/** WebLens detector: WordPress */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "wordpress",
    name: "WordPress",
    category: "CMS",
    description: "Open-source content management system.",
    website: "https://wordpress.org",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/\/wp-content\//i, /\/wp-includes\//i],
      styleUrl: [/\/wp-content\//i, /\/wp-includes\//i],
      meta: { generator: [/wordpress/i] },
      domAttr: ["#wpadminbar", ".wp-block", 'link[src*="wp-content"]'],
      html: [/wp-content/i, /wordpress/i],
      cookies: [/^wordpress_/i, /^wp-/i]
    },
    versionHints: { scriptRegex: null, metaKey: "generator" }
  });
})();
