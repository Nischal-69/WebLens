/** WebLens detector: Hotjar */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "hotjar",
    name: "Hotjar",
    category: "Analytics",
    description: "Behavior analytics with heatmaps and recordings.",
    website: "https://www.hotjar.com",
    logo: null,
    signals: {
      globals: ["hj"],
      scriptUrl: [/static\.hotjar\.com/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/static\.hotjar\.com/i, /hotjar/i],
      cookies: [/^_hj/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
