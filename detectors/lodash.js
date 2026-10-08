/** WebLens detector: Lodash */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "lodash",
    name: "Lodash",
    category: "JavaScript Library",
    description: "Utility library for common programming tasks.",
    website: "https://lodash.com",
    logo: null,
    minSignals: 2,
    signals: {
      globals: ["lodash", "_"],
      scriptUrl: [/lodash(?:\.min)?\.js/i, /\/lodash@\d/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/lodash/i],
      cookies: []
    },
    versionHints: { scriptRegex: /lodash@(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
