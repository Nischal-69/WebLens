/** WebLens detector: unpkg */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "unpkg",
    name: "unpkg",
    category: "CDN",
    description: "CDN serving files from npm packages.",
    website: "https://unpkg.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/unpkg\.com/i],
      styleUrl: [/unpkg\.com/i],
      meta: {},
      domAttr: [],
      html: [/unpkg\.com/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
