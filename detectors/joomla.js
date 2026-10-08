/** WebLens detector: Joomla */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "joomla",
    name: "Joomla",
    category: "CMS",
    description: "Open-source content management system.",
    website: "https://www.joomla.org",
    logo: null,
    signals: {
      globals: ["Joomla"],
      scriptUrl: [/\/media\/jui\//i, /\/media\/system\/js\//i],
      styleUrl: [/\/media\/jui\//i, /\/media\/system\/css\//i],
      meta: { generator: [/joomla/i] },
      domAttr: [],
      html: [/joomla/i, /\/option=com_/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: "generator" }
  });
})();
