/**
 * WebLens — core/normalize.js
 * Dedupe + structured output shaping. No detection logic here.
 */
(function () {
  function confidenceFor(score) {
    if (score >= 60) return "high";
    if (score >= 30) return "medium";
    return "low";
  }

  function categoryFor(detector) {
    try {
      const api = (typeof window !== "undefined" ? window : globalThis).WebLensCategories;
      if (api && typeof api.canonicalize === "function") {
        return api.canonicalize(detector.category, detector.slug);
      }
    } catch {
      /* fall through to raw label */
    }
    return detector.category || "Other";
  }
  const api = {
    normalize(hits) {
      const bySlug = new Map();
      for (const h of hits || []) {
        const d = h.detector;
        if (!d || !d.slug) continue;
        const prev = bySlug.get(d.slug);
        if (!prev || h.score > prev.score) bySlug.set(d.slug, h);
      }
      return [...bySlug.values()]
        .map((h) => ({
          slug: h.detector.slug,
          name: h.detector.name,
          category: categoryFor(h.detector),
          description: h.detector.description || "",
          confidence: confidenceFor(h.score),
          score: h.score,
          detectedBy: h.detectedBy || [],
          website: h.detector.website || null,
          logo: h.detector.logo || null,
          version: h.version || null,
          ...(h.details ? { details: h.details } : {})
        }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    }
  };

  (typeof window !== "undefined" ? window : globalThis).WebLensNormalize = api;
})();
