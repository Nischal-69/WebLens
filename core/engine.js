/**
 * WebLens — core/engine.js
 * Runs detector registry against collected signals.
 * Multi-signal scoring: each matched signal type adds weight once.
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
          const m = val.match(/(\d+\.\d+(?:\.\d+)?)/);
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
    const detectedBy = [];

    if (matchGlobals(rule, signals.globals || [])) {
      score += WEIGHTS.global;
      detectedBy.push("global");
    }
    if (anyRegex(signals.scriptUrls || [], rule.signals.scriptUrl)) {
      score += WEIGHTS.scriptUrl;
      detectedBy.push("script-url");
    }
    if (anyRegex(signals.styleUrls || [], rule.signals.styleUrl)) {
      score += WEIGHTS.styleUrl;
      detectedBy.push("stylesheet-url");
    }
    if (matchMeta(rule, signals.meta || {})) {
      score += WEIGHTS.meta;
      detectedBy.push("meta");
    }
    if (matchDom(rule, signals.hasSelector)) {
      score += WEIGHTS.domAttr;
      detectedBy.push("dom");
    }
    if (matchFlags(rule, mainFlags)) {
      score += WEIGHTS.flags;
      detectedBy.push("dom");
    }
    const cookieNames = signals.cookieNames || [];
    if (anyRegex(cookieNames, rule.signals.cookies)) {
      score += WEIGHTS.cookie;
      detectedBy.push("cookie");
    }
    if (anyRegex(signals.html || "", rule.signals.html)) {
      score += WEIGHTS.html;
      detectedBy.push("html");
    }

    // Emit if one decent signal or 2+ weak corroborating signals.
    // Strict detectors (minSignals: 2) require corroboration — a lone
    // weak trace (e.g. Astro meta alone, "_" global alone) never emits.
    if (score >= 30 || detectedBy.length >= 2) {
      const min = rule.minSignals || 1;
      if (detectedBy.length < min) return null;
      return {
        detector: rule,
        score: Math.min(99, score),
        detectedBy: [...new Set(detectedBy)],
        version: extractVersion(rule, signals)
      };
    }
    return null;
  }

  const api = {
    WEIGHTS,
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
