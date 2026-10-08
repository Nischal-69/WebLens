/** WebLens detector: Crisp (presence only — website ID never stored) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "crisp",
    name: "Crisp",
    category: "Marketing",
    description: "Live chat widget for customer support.",
    website: "https://crisp.chat",
    logo: null,
    signals: {
      globals: ["$crisp", "CRISP_WEBSITE_ID"],
      scriptUrl: [/client\.crisp\.chat/i],
      styleUrl: [],
      meta: {},
      domAttr: [],
      html: [/client\.crisp\.chat/i, /crisp\.chat/i],
      cookies: [/^crisp-client/i]
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
