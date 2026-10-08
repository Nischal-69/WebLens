/** WebLens detector: Cloudflare Pages */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "cloudflare-pages",
    name: "Cloudflare Pages",
    category: "Hosting",
    description: "JAMstack hosting on the Cloudflare edge.",
    website: "https://pages.cloudflare.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/\.pages\.dev\//i, /\/cdn-cgi\//i],
      styleUrl: [/\.pages\.dev\//i],
      meta: {},
      domAttr: [],
      html: [/\.pages\.dev/i, /\/cdn-cgi\//i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
