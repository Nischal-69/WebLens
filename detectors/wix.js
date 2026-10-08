/** WebLens detector: Wix */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "wix",
    name: "Wix",
    category: "Website Builder",
    description: "Hosted website builder for small businesses.",
    website: "https://www.wix.com",
    logo: null,
    signals: {
      globals: ["wixEmbedsAPI"],
      scriptUrl: [/static\.wixstatic\.com/i, /parastorage/i],
      styleUrl: [/static\.wixstatic\.com/i, /parastorage/i],
      meta: { generator: [/wix/i] },
      domAttr: ["#SITE_CONTAINER"],
      html: [/wixstatic/i, /parastorage/i],
      cookies: [/^X-Mapping-/i, /^wix/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
