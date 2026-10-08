/** WebLens detector: Nginx (passive leaks only — often undetectable when hardened) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "nginx",
    name: "Nginx",
    category: "Web Server",
    description: "Web server software (visible only when passively exposed).",
    website: "https://nginx.org",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [],
      styleUrl: [],
      meta: { generator: [/nginx/i] },
      domAttr: [],
      html: [/nginx/i],
      htmlStrong: [/<!--[\s\S]{0,200}?nginx\/\d+\.\d+[\s\S]{0,200}?-->/i, /powered by nginx(\/\d+\.\d+)?/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
