/** WebLens detector: Meta Pixel */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "meta-pixel",
    name: "Meta Pixel",
    category: "Advertising",
    description: "Meta ads conversion tracking pixel.",
    website: "https://www.facebook.com/business/tools/meta-pixel",
    logo: null,
    signals: {
      globals: ["fbq"],
      scriptUrl: [/connect\.facebook\.net\/en_US\/fbevents\.js/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/connect\.facebook\.net\/en_US\/fbevents\.js/i, /fbq\s*\(/i],
      cookies: [/^_fbp/i, /^_fbc/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
