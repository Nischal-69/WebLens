/** WebLens detector: Font Awesome */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "font-awesome",
    name: "Font Awesome",
    category: "Fonts",
    description: "Icon font and toolkit for interfaces.",
    website: "https://fontawesome.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/fontawesome/i, /font-awesome/i, /use\.fontawesome\.com/i],
      styleUrl: [/fontawesome/i, /font-awesome/i, /use\.fontawesome\.com/i],
      meta: {},
      domAttr: ['link[href*="font-awesome"]', 'link[href*="fontawesome"]'],
      html: [/font-awesome/i, /fontawesome/i],
      cookies: []
    },
    versionHints: { scriptRegex: /font-?awesome@(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
