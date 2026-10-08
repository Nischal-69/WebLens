/** WebLens detector: Svelte / SvelteKit */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "svelte",
    name: "Svelte",
    category: "Frontend Framework",
    description: "Compiler-based UI framework with SvelteKit.",
    website: "https://svelte.dev",
    logo: null,
    minSignals: 2,
    signals: {
      globals: ["__sveltekit"],
      scriptUrl: [/svelte(?:\.min)?\.js/i, /\.svelte-kit\//i, /sveltekit/i],
      styleUrl: [],
      meta: { generator: [/sveltekit/i] },
      domAttr: ["[data-sveltekit-reload]", "[data-svelte-h]", "[data-sveltekit-preload-data]"],
      html: [/sveltekit/i, /data-svelte-h/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: "generator" }
  });
})();
