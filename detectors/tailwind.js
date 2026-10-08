/** WebLens detector: Tailwind CSS */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "tailwind",
    name: "Tailwind CSS",
    category: "CSS Framework",
    description: "Utility-first CSS framework.",
    website: "https://tailwindcss.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/cdn\.tailwindcss\.com/i, /tailwindcss/i],
      styleUrl: [/tailwind(?:\.min)?\.css/i, /tailwindcss/i],
      meta: {},
      domAttr: [],
      html: [/cdn\.tailwindcss\.com/i, /tailwind\.config/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
