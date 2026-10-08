/** WebLens detector: Vue */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "vue",
    name: "Vue",
    category: "Frontend Framework",
    description: "Progressive JavaScript framework for UIs.",
    website: "https://vuejs.org",
    logo: null,
    signals: {
      globals: ["Vue", "__VUE__"],
      scriptUrl: [/(?:^|[/_-])vue(?:\.min|\.global|\.runtime)?\.js/i, /\/vue@\d/i],
      styleUrl: [],
      meta: {},
      domAttr: ["[data-v-app]"],
      html: [/data-v-[a-f0-9]{6,}/i, /__vue__/i],
      cookies: []
    },
    versionHints: { scriptRegex: /vue@(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
