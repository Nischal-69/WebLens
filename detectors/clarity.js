/** WebLens detector: Microsoft Clarity */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "microsoft-clarity",
    name: "Microsoft Clarity",
    category: "Analytics",
    description: "Session replay and heatmap analytics.",
    website: "https://clarity.microsoft.com",
    logo: null,
    signals: {
      globals: ["clarity"],
      scriptUrl: [/clarity\.ms\/tag\//i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/clarity\.ms\/tag\//i],
      cookies: [/^_clck/i, /^_clsk/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
