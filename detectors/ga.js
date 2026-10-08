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
    signals: {
      globals: ["gtag", "ga"],
      scriptUrl: [/googletagmanager\.com\/gtag\/js/i, /google-analytics\.com\/(?:ga|analytics)\.js/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/googletagmanager\.com\/gtag\/js/i, /google-analytics\.com\/analytics\.js/i],
      cookies: [/^_ga/i, /^_gid/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
