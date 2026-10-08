/** WebLens detector: jQuery */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "jquery",
    name: "jQuery",
    category: "JavaScript Library",
    description: "Fast DOM manipulation and Ajax utility library.",
    website: "https://jquery.com",
    logo: null,
    signals: {
      globals: ["jQuery"],
      scriptUrl: [/jquery(?:\.min|\.slim\.min)?\.js/i, /\/jquery@\d/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/jquery/i],
      cookies: []
    },
    versionHints: { scriptRegex: /jquery[-.](\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
