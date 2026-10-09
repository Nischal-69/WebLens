/** WebLens detector: Drupal */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "drupal",
    name: "Drupal",
    category: "CMS",
    description: "Open-source content management framework.",
    website: "https://www.drupal.org",
    logo: null,
    // NOTE: core-asset patterns are scoped to real Drupal directories — a
    // bare "/core/*.js" path on non-Drupal sites must not count. The
    // "Drupal" global alone is not enough either (corroboration required).
    minSignals: 2,
    signals: {
      globals: ["Drupal"],
      scriptUrl: [/\/sites\/default\/files/i, /\/misc\/drupal\.js/i, /\/core\/(modules|themes|misc|profiles|layouts)\//i],
      styleUrl: [/\/sites\/default\/files/i, /\/core\/(modules|themes|misc|profiles|layouts)\//i],
      meta: { generator: [/drupal/i] },
      domAttr: ["[data-drupal-selector]"],
      html: [/drupal/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: "generator" }
  });
})();
