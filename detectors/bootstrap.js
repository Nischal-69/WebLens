/** WebLens detector: Bootstrap */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "bootstrap",
    name: "Bootstrap",
    category: "CSS Framework",
    description: "Responsive front-end component library.",
    website: "https://getbootstrap.com",
    logo: null,
    signals: {
      globals: ["bootstrap"],
      scriptUrl: [/bootstrap(?:\.min|\.bundle\.min)?\.js/i],
      styleUrl: [/bootstrap(?:\.min)?\.css/i],
      meta: {},
      domAttr: ["[data-bs-toggle]", "[data-bs-target]"],
      html: [/bootstrap/i],
      cookies: []
    },
    versionHints: { scriptRegex: /bootstrap@(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
