/** WebLens detector: Mailchimp */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "mailchimp",
    name: "Mailchimp",
    category: "Marketing",
    description: "Email marketing and signup forms.",
    website: "https://mailchimp.com",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/chimpstatic\.com/i, /list-manage\.com/i],
      styleUrl: [/chimpstatic\.com/i],
      meta: {},
      domAttr: ["div#mc_embed_signup"],
      html: [/list-manage\.com/i, /mc_embed_signup/i],
      cookies: []
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
