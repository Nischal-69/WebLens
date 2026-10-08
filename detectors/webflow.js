/** WebLens detector: Webflow */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "webflow",
    name: "Webflow",
    category: "Website Builder",
    description: "Visual website builder and hosting platform.",
    website: "https://webflow.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/assets\.website-files\.com/i, /webflow\.js/i],
      styleUrl: [/assets\.website-files\.com/i],
      meta: { generator: [/webflow/i] },
      domAttr: ["[data-wf-page]", ".w-embed"],
      html: [/w-webflow/i, /assets\.website-files\.com/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
