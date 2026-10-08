/** WebLens detector: Google Fonts */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "google-fonts",
    name: "Google Fonts",
    category: "Fonts",
    description: "Web font service for fast typography.",
    website: "https://fonts.google.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [],
      styleUrl: [/fonts\.googleapis\.com/i, /fonts\.gstatic\.com/i],
      meta: {},
      domAttr: ['link[href*="fonts.googleapis.com"]'],
      html: [/fonts\.googleapis\.com/i, /fonts\.gstatic\.com/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
