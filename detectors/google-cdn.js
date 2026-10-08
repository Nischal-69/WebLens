/** WebLens detector: Google Hosted Libraries */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "google-cdn",
    name: "Google Hosted Libraries",
    category: "CDN",
    description: "Google CDN for popular JavaScript libraries.",
    website: "https://developers.google.com/speed/libraries",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/ajax\.googleapis\.com\/ajax\/libs\//i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/ajax\.googleapis\.com\/ajax\/libs\//i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
