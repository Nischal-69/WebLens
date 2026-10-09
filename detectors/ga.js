/** WebLens detector: Google Analytics (gtag.js) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "google-analytics",
    name: "Google Analytics",
    category: "Analytics",
    description: "Web analytics for traffic and behaviour measurement.",
    website: "https://analytics.google.com",
    logo: null,
    // NOTE: the shared "gtag" global is intentionally NOT listed — bare
    // gtag also fires Google Ads, so it must never attribute Analytics
    // alone. GA emits only with product-specific corroboration (G-/UA- ID,
    // _ga cookies, or analytics tag URLs). Reliability over coverage.
    minSignals: 2,
    signals: {
      globals: ["ga"],
      scriptUrl: [/googletagmanager\.com\/gtag\/js/i, /google-analytics\.com\/(?:ga|analytics)\.js/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/googletagmanager\.com\/gtag\/js/i, /google-analytics\.com\/analytics\.js/i],
      htmlStrong: [/G-[A-Z0-9]{4,}/, /UA-\d{4,}/],
      cookies: [/^_ga/i, /^_gid/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
