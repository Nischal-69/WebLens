/** WebLens detector: HubSpot */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "hubspot",
    name: "HubSpot",
    category: "Marketing",
    description: "CRM with marketing automation and forms.",
    website: "https://www.hubspot.com",
    logo: null,
    signals: {
      globals: ["hubspot", "_hsq"],
      scriptUrl: [/js\.hs-scripts\.com/i, /js\.hsforms\.net/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/js\.hs-scripts\.com/i, /hsforms/i],
      cookies: [/^__hstc/i, /^hubspotutk/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
