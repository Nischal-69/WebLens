/** WebLens detector: Shopify */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "shopify",
    name: "Shopify",
    category: "E-commerce",
    description: "Hosted commerce platform for online stores.",
    website: "https://www.shopify.com",
    logo: null,
    signals: {
      globals: ["Shopify"],
      scriptUrl: [/cdn\.shopify\.com/i, /myshopify\.com/i],
      styleUrl: [/cdn\.shopify\.com/i],
      meta: {},
      domAttr: ["[data-shopify]"],
      html: [/cdn\.shopify\.com/i, /myshopify\.com/i],
      cookies: [/^_shopify_/i, /^shopify_/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
