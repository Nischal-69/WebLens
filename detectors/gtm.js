/** WebLens detector: Google Tag Manager */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "google-tag-manager",
    name: "Google Tag Manager",
    category: "Analytics",
    description: "Tag management for marketing and analytics snippets.",
    website: "https://tagmanager.google.com",
    logo: null,
    signals: {
      globals: ["google_tag_manager"],
      scriptUrl: [/googletagmanager\.com\/gtm\.js/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/googletagmanager\.com\/gtm\.js/i, /GTM-[A-Z0-9]{4,}/],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
