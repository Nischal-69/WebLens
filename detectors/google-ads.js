/** WebLens detector: Google Ads (presence only — ID values never stored) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "google-ads",
    name: "Google Ads",
    category: "Advertising",
    description: "Ads conversion tracking tags.",
    website: "https://ads.google.com",
    logo: null,
    // NOTE: the shared "gtag" global is intentionally NOT listed — bare
    // gtag also fires Google Analytics, so it must never attribute Ads
    // alone. Ads emits only with product-specific corroboration (AW- ID,
    // _gcl_ cookies, or googleadservices URLs). Reliability over coverage.
    minSignals: 2,
    signals: {
      globals: [],
      scriptUrl: [/googleadservices\.com/i, /googletagmanager\.com\/gtag\/js/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/googleadservices\.com/i],
      htmlStrong: [/AW-\d{4,}/, /googleadservices\.com/i],
      cookies: [/^_gcl_/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
