/**
 * WebLens — detectors/registry.js
 * Single import point. Manifest loads detectors/* first, then this file
 * validates the registry (dedupe slugs, schema check) for engine.js.
 * A bad detector warns and is dropped — it must never break the scan.
 * See detectors/_template.js + detectors/README.md to add a technology.
 */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  root.WebLensDetectors = root.WebLensDetectors || [];

  const seen = new Set();
  root.WebLensDetectors = root.WebLensDetectors.filter((d) => {
    if (!d || !d.slug || !d.name) return false;
    if (seen.has(d.slug)) return false;
    seen.add(d.slug);
    d.signals = d.signals || {};
    if (!d.category || !d.description) {
      warn(d.slug, "missing category or description; check detectors/_template.js");
      return false;
    }
    const sources = sourceCount(d);
    if (sources === 0) {
      warn(d.slug, "no signal sources at all — can never emit; check detectors/_template.js");
      return false;
    }
    const need = d.minSignals || 1;
    if (need > sources) {
      warn(
        d.slug,
        `minSignals:${need} but only ${sources} signal source(s) — can never emit; ` +
          "lower minSignals or add corroborating signals"
      );
    } else if (!hasStrongChannel(d) && sources < 2) {
      warn(
        d.slug,
        "single weak source (stylesheet-url/dom/flag/cookie) can never emit " +
          "alone under the channel policy — add a second signal source"
      );
    }
    return true;
  });

  // Count usable signal sources. Prose `html` is score-only and does NOT
  // count — it can never corroborate or emit by itself.
  function sourceCount(d) {
    const s = d.signals || {};
    let n = 0;
    if (Array.isArray(s.globals) && s.globals.length > 0) n += 1;
    if (Array.isArray(s.scriptUrl) && s.scriptUrl.length > 0) n += 1;
    if (Array.isArray(s.styleUrl) && s.styleUrl.length > 0) n += 1;
    if (s.meta && typeof s.meta === "object" && Object.keys(s.meta).length > 0) n += 1;
    if (Array.isArray(s.domAttr) && s.domAttr.length > 0) n += 1;
    if (Array.isArray(s.flags) && s.flags.length > 0) n += 1;
    if (Array.isArray(s.cookies) && s.cookies.length > 0) n += 1;
    if (Array.isArray(s.htmlStrong) && s.htmlStrong.length > 0) n += 1;
    return n;
  }

  // A detector has a strong channel when ANY of these exist: page globals,
  // asset script URLs, meta rules, or versioned htmlStrong signatures.
  // (Prose `html` is score-only and does not count.)
  function hasStrongChannel(d) {
    const s = d.signals || {};
    if (Array.isArray(s.globals) && s.globals.length > 0) return true;
    if (Array.isArray(s.scriptUrl) && s.scriptUrl.length > 0) return true;
    if (Array.isArray(s.htmlStrong) && s.htmlStrong.length > 0) return true;
    if (s.meta && typeof s.meta === "object" && Object.keys(s.meta).length > 0) return true;
    return false;
  }

  function warn(slug, message) {
    try {
      console.warn(`[WebLens] Detector "${slug}" skipped/inaccurate risk: ${message}`);
    } catch {
      /* logging must never break the scan */
    }
  }

  root.WebLensRegistry = {
    all() {
      return root.WebLensDetectors;
    },
    count() {
      return root.WebLensDetectors.length;
    }
  };
})();
