/** WebLens detector: Angular */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "angular",
    name: "Angular",
    category: "Frontend Framework",
    description: "Platform for building single-page applications.",
    website: "https://angular.dev",
    logo: null,
    minSignals: 2,
    signals: {
      globals: ["angular", "ng"],
      scriptUrl: [/angular(?:\.min)?\.js/i, /\/@angular\//i, /zone\.js/i],
      styleUrl: [],
      meta: {},
      domAttr: ["[ng-version]", "[ng-app]", "app-root"],
      html: [/ng-version/i, /<app-root/i],
      cookies: []
    },
    versionHints: { scriptRegex: /@angular\/[^"']*?(\d+\.\d+(?:\.\d+)?)/i, metaKey: null }
  });
})();
