/**
 * WebLens — core/engine.js
 * Runs detector registry against collected signals.
 * Multi-signal scoring: each matched signal type adds weight once.
 *
 * Channel policy (accuracy first):
 *   - Every matched signal TYPE is one evidence channel, except prose
 *     `html` matches, which add score but are NEVER channels (article
 *     text mentioning "nginx" must not corroborate by itself).
 *   - `flags` (MAIN-world probe) is its own channel, distinct from `dom`.
 *   - A single channel emits only when it is STRONG (global, script-url,
 *     meta, versioned htmlStrong). Weaker single channels (stylesheet-url,
 *     dom, flag, cookie) always need corroboration.
 *   - `minSignals` counts distinct channels, never raw matches.
 */
(function () {
  const WEIGHTS = {
    global: 40,
    scriptUrl: 30,
    domAttr: 30,
    flags: 30,
    meta: 25,
    styleUrl: 20,
    cookie: 20,
    html: 10
  };

  // Channels strong enough to emit on their own (single-channel hit).
  // Everything else (stylesheet-url, dom, flag, cookie) needs a second
  // corroborating channel. Prose `html` is intentionally absent: it only
  // adds score, it is never evidence by itself.
  const STRONG_CHANNELS = ["global", "script-url", "meta", "html"];

  function anyRegex(haystacks, patterns) {
    if (!patterns || !patterns.length) return false;
    const list = Array.isArray(haystacks) ? haystacks : [haystacks];
    return patterns.some((re) => list.some((h) => typeof h === "string" && re.test(h)));
  }

  function matchGlobals(rule, globals) {
    const want = rule.signals.globals || [];
    if (!want.length) return false;
    return want.some((g) => globals.includes(g));
  }

  function matchMeta(rule, meta) {
    const spec = rule.signals.meta || {};
    const keys = Object.keys(spec);
    if (!keys.length) return false;
    return keys.some((k) => {
      const val = meta[k] || meta[k.toLowerCase()];
      if (!val) return false;
      const patterns = Array.isArray(spec[k]) ? spec[k] : [spec[k]];
      return patterns.some((re) => re.test(val));
    });
  }

  function matchDom(rule, hasSelector) {
    const sels = rule.signals.domAttr || [];
    if (!sels.length || typeof hasSelector !== "function") return false;
    return sels.some((sel) => {
      try {
        return hasSelector(sel);
      } catch {
        return false;
      }
    });
  }

  function matchFlags(rule, mainFlags) {
    const want = rule.signals.flags || [];
    if (!want.length) return false;
    if (!mainFlags) return false;
    return want.some((f) => !!mainFlags[f]);
  }

  function extractVersion(rule, signals) {
    const hints = rule.versionHints || {};
    try {
      if (hints.scriptRegex) {
        const all = [...(signals.scriptUrls || []), ...(signals.styleUrls || [])];
        for (const u of all) {
          const m = u.match(hints.scriptRegex);
          if (m && m[1]) return m[1];
        }
      }
      if (hints.metaKey) {
        const val = signals.meta[hints.metaKey] || signals.meta[hints.metaKey.toLowerCase()];
        if (val) {
          // Allow single-major ("Drupal 10") as well as dotted versions.
          const m = val.match(/(\d+(?:\.\d+){0,2})/);
          if (m) return m[1];
        }
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function scoreDetector(rule, signals, mainFlags) {
    let score = 0;
    // Internal evidence channels (distinct types only). Display labels are
    // derived below; gating always uses these deduped channels.
    const channels = [];

    if (matchGlobals(rule, signals.globals || [])) {
      score += WEIGHTS.global;
      channels.push("global");
    }
    if (anyRegex(signals.scriptUrls || [], rule.signals.scriptUrl)) {
      score += WEIGHTS.scriptUrl;
      channels.push("script-url");
    }
    if (anyRegex(signals.styleUrls || [], rule.signals.styleUrl)) {
      score += WEIGHTS.styleUrl;
      channels.push("stylesheet-url");
    }
    if (matchMeta(rule, signals.meta || {})) {
      score += WEIGHTS.meta;
      channels.push("meta");
    }
    if (matchDom(rule, signals.hasSelector)) {
      score += WEIGHTS.domAttr;
      channels.push("dom");
    }
    if (matchFlags(rule, mainFlags)) {
      score += WEIGHTS.flags;
      channels.push("flag");
    }
    const cookieNames = signals.cookieNames || [];
    if (anyRegex(cookieNames, rule.signals.cookies)) {
      score += WEIGHTS.cookie;
      channels.push("cookie");
    }
    // Prose HTML mentions add score but are NOT a channel — a blog post
    // about a technology must never corroborate its own detection.
    if (anyRegex(signals.html || "", rule.signals.html)) {
      score += WEIGHTS.html;
    }
    // Versioned in-page signatures (e.g. "<!-- nginx/1.24 -->") are far
    // stronger than prose mentions — weight them as a script-grade signal
    // and count them as an "html" channel. Reported as "html" in
    // detectedBy (same display label as before).
    if (anyRegex(signals.html || "", rule.signals.htmlStrong)) {
      score += WEIGHTS.scriptUrl;
      channels.push("html");
    }

    const distinct = [...new Set(channels)];
    if (distinct.length === 0) return null;

    // Strict detectors (minSignals: 2) require corroboration — a lone
    // trace (e.g. Astro meta alone, "_" global alone) never emits.
    const min = rule.minSignals || 1;
    if (distinct.length < min) return null;

    // Emit if one STRONG signal or 2+ corroborating channels.
    // (Two channels always score >= 30 given current weights.)
    if (distinct.length >= 2) {
      return {
        detector: rule,
        score: Math.min(99, score),
        detectedBy: displayLabels(distinct),
        version: extractVersion(rule, signals)
      };
    }
    if (score >= 30 && STRONG_CHANNELS.includes(distinct[0])) {
      return {
        detector: rule,
        score: Math.min(99, score),
        detectedBy: displayLabels(distinct),
        version: extractVersion(rule, signals)
      };
    }
    return null;
  }

  // Internal channels -> user-facing detectedBy labels. Kept stable so the
  // popup evidence sentence ("Detected from …") never changes shape.
  function displayLabels(distinct) {
    return [...new Set(distinct.map((c) => (c === "flag" ? "dom" : c)))];
  }

  const api = {
    WEIGHTS,
    STRONG_CHANNELS,
    run(signals, detectors, mainFlags) {
      const list = Array.isArray(detectors) ? detectors : [];
      const hits = [];
      for (const rule of list) {
        try {
          const hit = scoreDetector(rule, signals, mainFlags);
          if (hit) hits.push(hit);
        } catch {
          /* one bad detector must not break the scan */
        }
      }
      return hits;
    }
  };

  (typeof window !== "undefined" ? window : globalThis).WebLensEngine = api;
})();
