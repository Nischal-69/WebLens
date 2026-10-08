/** WebLens detector: Ghost */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "ghost",
    name: "Ghost",
    category: "CMS",
    description: "Publishing platform for blogs and newsletters.",
    website: "https://ghost.org",
    logo: null,
    signals: {
      globals: ["Ghost"],
      scriptUrl: [/\/public\/ghost/i, /\/ghost\/api\//i, /ghost-sdk/i],
      styleUrl: [],
      meta: { generator: [/ghost/i] },
      domAttr: ["body.post-template", "body.home-template"],
      html: [/ghost/i, /content\/images/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: "generator" }
  });
})();
