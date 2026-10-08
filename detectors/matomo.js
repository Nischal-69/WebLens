/** WebLens detector: Matomo */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "matomo",
    name: "Matomo",
    category: "Analytics",
    description: "Self-hosted web analytics platform.",
    website: "https://matomo.org",
    logo: null,
    signals: {
      globals: ["Matomo", "_paq"],
      scriptUrl: [/matomo\.js/i, /piwik\.js/i],
      styleUrl: [],
      meta: { generator: [/matomo/i, /piwik/i] },
      domAttr: [],
      html: [/_paq\.push/i, /matomo/i],
      cookies: [/^_pk_id/i, /^_pk_ses/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
