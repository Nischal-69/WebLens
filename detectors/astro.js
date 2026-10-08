/** WebLens detector: Astro */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "astro",
    name: "Astro",
    category: "Frontend Framework",
    description: "Content-focused framework with islands architecture.",
    website: "https://astro.build",
    logo: null,
    minSignals: 2,
    signals: {
      globals: ["astro"],
      scriptUrl: [/\/_astro\//i, /astro.*hoisted/i],
      styleUrl: [/\/_astro\//i],
      meta: { generator: [/astro/i] },
      domAttr: ["astro-island", "astro-slot"],
      html: [/astro-island/i, /<astro-/i, /\/_astro\//i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: "generator" }
  });
})();
