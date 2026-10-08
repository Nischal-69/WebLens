/** WebLens detector: jsDelivr */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "jsdelivr",
    name: "jsDelivr",
    category: "CDN",
    description: "Free CDN for JavaScript and CSS packages.",
    website: "https://www.jsdelivr.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/cdn\.jsdelivr\.net/i],
      styleUrl: [/cdn\.jsdelivr\.net/i],
      meta: {},
      domAttr: [],
      html: [/cdn\.jsdelivr\.net/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
