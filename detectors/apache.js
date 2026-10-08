/** WebLens detector: Apache (passive leaks only — often undetectable when hardened) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "apache",
    name: "Apache",
    category: "Web Server",
    description: "Web server software (visible only when passively exposed).",
    website: "https://httpd.apache.org",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [],
      styleUrl: [],
      meta: { generator: [/apache/i] },
      domAttr: [],
      html: [/apache/i],
      htmlStrong: [/<!--[\s\S]{0,200}?apache\/\d+\.\d+[\s\S]{0,200}?-->/i, /powered by apache(\/\d+\.\d+)?/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
