/** WebLens detector: GitHub Pages (platform domain + optional Jekyll corroboration) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "github-pages",
    name: "GitHub Pages",
    category: "Hosting",
    description: "Static site hosting from GitHub repositories.",
    website: "https://pages.github.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/\.github\.io\//i],
      styleUrl: [/\.github\.io\//i],
      meta: { generator: [/jekyll/i] },
      domAttr: [],
      html: [/\.github\.io/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
