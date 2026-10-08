/** WebLens detector: WooCommerce (runs on WordPress — both are listed) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "woocommerce",
    name: "WooCommerce",
    category: "E-commerce",
    description: "WordPress plugin for online stores.",
    website: "https://woocommerce.com",
    logo: null,
    signals: {
      globals: ["woocommerce_params"],
      scriptUrl: [/\/plugins\/woocommerce/i],
      styleUrl: [/\/plugins\/woocommerce/i],
      meta: {},
      domAttr: [".woocommerce", "#woocommerce"],
      html: [/woocommerce/i],
      cookies: [/^woocommerce_/i, /^wp_woocommerce/i]
    },
    versionHints: { scriptRegex: /woocommerce@(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
