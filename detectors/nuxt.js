/** WebLens detector: Nuxt */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "nuxt",
    name: "Nuxt",
    category: "Frontend Framework",
    description: "Vue meta-framework for production apps.",
    website: "https://nuxt.com",
    logo: null,
    minSignals: 2,
    signals: {
      globals: ["__NUXT__", "Nuxt"],
      scriptUrl: [/\/_nuxt\//i],
      styleUrl: [/\/_nuxt\//i],
      meta: {},
      domAttr: ["#__nuxt", "#__NUXT_DATA__"],
      html: [/__NUXT__/i, /\/_nuxt\//i],
      cookies: [],
      flags: ["hasNuxtData"]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
