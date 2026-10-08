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
    signals: {
      globals: ["gtag"],
      scriptUrl: [/googleadservices\.com/i, /googletagmanager\.com\/gtag\/js/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/AW-\d{4,}/, /googleadservices\.com/i],
      cookies: [/^_gcl_/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
