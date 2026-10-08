/** WebLens detector: Cloudflare */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "cloudflare",
    name: "Cloudflare",
    category: "Security / CDN",
    description: "CDN, DNS and bot protection in front of the site.",
    website: "https://www.cloudflare.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/challenges\.cloudflare\.com/i, /cdnjs\.cloudflare\.com/i, /\/cdn-cgi\//i],
      styleUrl: [/cdnjs\.cloudflare\.com/i],
      meta: {},
      domAttr: [],
      html: [/cloudflare/i, /\/cdn-cgi\//i],
      cookies: [/^__cf_bm/i, /^cf_clearance/i, /^__cfduid/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
