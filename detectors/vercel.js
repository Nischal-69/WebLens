/** WebLens detector: Vercel (strict platform URLs only) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "vercel",
    name: "Vercel",
    category: "Hosting",
    description: "Frontend cloud platform for web apps.",
    website: "https://vercel.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/\.vercel\.app\//i, /\/_vercel\//i],
      styleUrl: [/\.vercel\.app\//i, /\/_vercel\//i],
      meta: {},
      domAttr: [],
      html: [/\.vercel\.app/i, /\/_vercel\//i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
