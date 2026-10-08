/**
 * WebLens — core/categories.js
 * Canonical category taxonomy. Single source of truth for grouping.
 * New detectors should use canonical names directly; legacy detector
 * labels are mapped here so existing files need no edits.
 *
 * Canonical set: Frameworks, JavaScript Libraries, CMS, WordPress,
 *   Analytics, Advertising, Marketing, Fonts, CDN, Hosting, Web Server,
 *   CSS, Payment, Security, Ecommerce, Other
 */
(function () {
  const ORDER = [
    "Frameworks",
    "JavaScript Libraries",
    "CMS",
    "WordPress",
    "Analytics",
    "Advertising",
    "Marketing",
    "Fonts",
    "CDN",
    "Hosting",
    "Web Server",
    "CSS",
    "Payment",
    "Security",
    "Ecommerce",
    "Other"
  ];

  const LEGACY_MAP = {
    "Frontend Framework": "Frameworks",
    "JavaScript Library": "JavaScript Libraries",
    "Animation Library": "JavaScript Libraries",
    "3D / WebGL Library": "JavaScript Libraries",
    "CSS Framework": "CSS",
    "Website Builder": "CMS",
    "Security / CDN": "CDN",
    "E-commerce": "Ecommerce"
  };

  function canonicalize(rawLabel, slug) {
    if (slug === "wordpress") return "WordPress";
    if (!rawLabel) return "Other";
    if (ORDER.includes(rawLabel)) return rawLabel;
    return LEGACY_MAP[rawLabel] || "Other";
  }

  function group(technologies) {
    const buckets = new Map();
    for (const t of technologies || []) {
      const name = t.category || "Other";
      if (!buckets.has(name)) buckets.set(name, []);
      buckets.get(name).push(t);
    }
    const out = [];
    for (const name of ORDER) {
      const items = buckets.get(name);
      if (items && items.length > 0) out.push({ name, count: items.length, items });
    }
    // Safety: any category outside ORDER (should not happen) goes last.
    for (const [name, items] of buckets) {
      if (!ORDER.includes(name)) out.push({ name, count: items.length, items });
    }
    return out;
  }

  const api = { ORDER, canonicalize, group };

  (typeof window !== "undefined" ? window : globalThis).WebLensCategories = api;
})();
