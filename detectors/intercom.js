/** WebLens detector: Intercom */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "intercom",
    name: "Intercom",
    category: "Marketing",
    description: "Customer messaging and support chat.",
    website: "https://www.intercom.com",
    logo: null,
    signals: {
      globals: ["Intercom"],
      scriptUrl: [/widget\.intercom\.io/i],
      styleUrl: [],
      meta: {},
      domAttr: ["#intercom-container"],
      html: [/widget\.intercom\.io/i, /intercom/i],
      cookies: [/^intercom-/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
