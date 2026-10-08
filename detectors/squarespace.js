/** WebLens detector: Squarespace */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "squarespace",
    name: "Squarespace",
    category: "Website Builder",
    description: "SaaS website builder and hosting service.",
    website: "https://www.squarespace.com",
    logo: null,
    signals: {
      globals: ["Squarespace"],
      scriptUrl: [/static(?:1)?\.squarespace\.com/i],
      styleUrl: [/static(?:1)?\.squarespace\.com/i],
      meta: { generator: [/squarespace/i] },
      domAttr: ["[data-collection-id]"],
      html: [/squarespace/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
