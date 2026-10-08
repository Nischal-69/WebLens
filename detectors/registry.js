/**
 * WebLens — detectors/registry.js
 * Single import point. Manifest loads detectors/* first, then this file
 * validates the registry (dedupe slugs, schema check) for engine.js.
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
    return true;
  });

  root.WebLensRegistry = {
    all() {
      return root.WebLensDetectors;
    },
    count() {
      return root.WebLensDetectors.length;
    }
  };
})();
