/** WebLens detector: React */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "react",
    name: "React",
    category: "Frontend Framework",
    description: "Component-based JavaScript UI library.",
    website: "https://react.dev",
    logo: null,
    signals: {
      globals: ["React", "__REACT_DEVTOOLS_GLOBAL_HOOK__"],
      scriptUrl: [/react(?:\.min|\.production\.min)?\.js/i, /\/react@\d/i, /react-dom/i],
      styleUrl: [],
      meta: {},
      domAttr: ["[data-reactroot]", "[data-reactid]"],
      html: [/data-reactroot/i],
      cookies: []
    },
    versionHints: { scriptRegex: /react@(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
