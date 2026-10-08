/** WebLens detector: PHP (direct evidence only — never inferred from CMS) */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "php",
    name: "PHP",
    category: "Web Server",
    description: "Server scripting language for dynamic pages.",
    website: "https://www.php.net",
    logo: null,
    signals: {
      globals: [],
      scriptUrl: [/\.php(?:[?#]|$)/i],
      styleUrl: [],
      meta: { generator: [/php\/?\d/i] },
      domAttr: [],
      html: [/\.php(?:[?#"'\s>]|$)/i, /x-powered-by:\s*php/i],
      cookies: [/^phpsessid/i, /^phpbb/i]
    },
    versionHints: { scriptRegex: null, metaKey: "generator" }
  });
})();
