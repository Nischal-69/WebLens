/** WebLens detector: CloudFront */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "cloudfront",
    name: "CloudFront",
    category: "CDN",
    description: "Amazon content delivery network.",
    website: "https://aws.amazon.com/cloudfront/",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/cloudfront\.net/i],
      styleUrl: [/cloudfront\.net/i],
      meta: {},
      domAttr: [],
      html: [/cloudfront\.net/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
