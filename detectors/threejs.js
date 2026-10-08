/** WebLens detector: Three.js */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "threejs",
    name: "Three.js",
    category: "3D / WebGL Library",
    description: "JavaScript 3D library built on WebGL.",
    website: "https://threejs.org",
    logo: null,
    minSignals: 2,
    signals: {
      globals: ["THREE"],
      scriptUrl: [/three(?:\.min|\.module\.min)?\.js/i, /\/three@\d/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/three\.js/i, /THREE\./],
      cookies: []
    },
    versionHints: { scriptRegex: /three@(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
