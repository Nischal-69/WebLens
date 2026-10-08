/** WebLens detector: Adobe Fonts */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "adobe-fonts",
    name: "Adobe Fonts",
    category: "Fonts",
    description: "Hosted font service (Typekit).",
    website: "https://fonts.adobe.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/use\.typekit\.net/i, /typekit/i],
      styleUrl: [/use\.typekit\.net/i],
      meta: {},
      domAttr: [],
      html: [/use\.typekit\.net/i, /typekit/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
