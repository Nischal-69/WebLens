/** WebLens detector: GSAP */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "gsap",
    name: "GSAP",
    category: "Animation Library",
    description: "JavaScript animation library for the web.",
    website: "https://gsap.com",
    logo: null,
    minSignals: 2,
    signals: {
      globals: ["gsap", "TweenMax", "TweenLite"],
      scriptUrl: [/gsap(?:\.min)?\.js/i, /TweenMax(?:\.min)?\.js/i, /\/gsap@\d/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/gsap/i, /TweenMax/i],
      cookies: []
    },
    versionHints: { scriptRegex: /gsap@(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
