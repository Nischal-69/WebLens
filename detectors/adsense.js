/** WebLens detector: Google AdSense */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "google-adsense",
    name: "Google AdSense",
    category: "Advertising",
    description: "Ad publisher network for site monetization.",
    website: "https://www.google.com/adsense/",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i],
      styleUrl: [],
      meta: {},
      domAttr: ["ins.adsbygoogle"],
      html: [/adsbygoogle/i, /pagead2\.googlesyndication\.com/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
