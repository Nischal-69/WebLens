/** WebLens detector: Next.js */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "nextjs",
    name: "Next.js",
    category: "Frontend Framework",
    description: "React framework for production websites and apps.",
    website: "https://nextjs.org",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/_next\/static/i],
      styleUrl: [/_next\/static/i],
      meta: {},
      domAttr: ["#__next", "#__NEXT_DATA__"],
      html: [/__NEXT_DATA__/i, /\/_next\/static/i],
      cookies: [],
      flags: ["hasNextData"]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
