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
    signals: {
      globals: ["Drupal"],
      scriptUrl: [/\/sites\/default\/files/i, /\/misc\/drupal\.js/i, /\/core\/.*\.js/i],
      styleUrl: [/\/sites\/default\/files/i, /\/core\/.*\.css/i],
      meta: { generator: [/drupal/i] },
      domAttr: ["[data-drupal-selector]"],
      html: [/drupal/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: "generator" }
  });
})();
