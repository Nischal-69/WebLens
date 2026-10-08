/** WebLens detector: Netlify (strict platform URLs only) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "netlify",
    name: "Netlify",
    category: "Hosting",
    description: "Web hosting platform for static and dynamic sites.",
    website: "https://www.netlify.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/\.netlify\.app\//i, /\/\.netlify\//i],
      styleUrl: [/\.netlify\.app\//i, /\/\.netlify\//i],
      meta: {},
      domAttr: [],
      html: [/\.netlify\.app/i, /\/\.netlify\//i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
