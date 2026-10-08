/** WebLens detector: Blogger */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "blogger",
    name: "Blogger",
    category: "CMS",
    description: "Google blogging and publishing service.",
    website: "https://www.blogger.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/blogger\.com/i, /blogspot\.com/i],
      styleUrl: [/blogspot\.com/i],
      meta: { generator: [/blogger/i] },
      domAttr: [".post-body", "#Blog1"],
      html: [/blogspot/i, /blogger/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
