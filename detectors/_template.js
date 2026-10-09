/**
 * WebLens detector TEMPLATE — copy this file to `<slug>.js`, fill it in,
 * and add the filename to manifest.json `content_scripts[0].js`
 * (alphabetical order, before "registry.js").
 *
 * THIS FILE IS NEVER LOADED (not listed in manifest.json). Do not edit it
 * in place — it exists only as copy-paste documentation.
 *
 * Reliability over coverage. Before adding a technology, prove at least ONE
 * of these, and note the proof in a `// NOTE:` comment:
 *   - a STRONG single channel: page global, asset script URL, meta tag, or
 *     versioned in-page signature (`htmlStrong`), OR
 *   - TWO corroborating channels (stylesheet-url, dom, MAIN flag, cookie,
 *     htmlStrong) with `minSignals: 2`.
 *
 * False-positive checklist (all must be true):
 *   - No bare prose `html:` regex is the only thing matching on article
 *     pages about the technology (prose adds score, never evidence).
 *   - No shared global (e.g. "gtag") attributes two technologies — scope
 *     with product-specific IDs, cookies, or URLs instead.
 *   - Asset-URL regexes cannot match unrelated paths (anchor them to
 *     vendor dirs, file names, or version segments).
 *   - `htmlStrong` patterns require a version or ID — never bare prose.
 */
(function () {
  (typeof window !== "undefined" ? window : globalThis).WebLensDetectors =
    (typeof window !== "undefined" ? window : globalThis).WebLensDetectors || [];
  window.WebLensDetectors.push({
    slug: "example", // unique, lowercase, URL-safe
    name: "Example", // human-readable name
    category: "Other", // canonical name; see core/categories.js ORDER
    description: "One-line description of what this technology is.",
    website: "https://example.com", // official site, or null
    logo: null, // reserved for future use; always null today
    // Uncomment when one strong channel is not enough on its own:
    // minSignals: 2,
    signals: {
      globals: [], // page JS globals, e.g. ["React"]
      scriptUrl: [], // regexes over <script src>, e.g. [/\/wp-includes\//i]
      styleUrl: [], // regexes over stylesheet hrefs
      meta: {}, // e.g. { generator: [/wordpress/i] }
      domAttr: [], // selectors, e.g. ["#__next"]
      flags: [], // MAIN-world probe flags, e.g. ["hasNextData"]
      html: [], // prose regexes: score only, NEVER evidence alone
      htmlStrong: [], // versioned signatures / IDs: strong evidence
      cookies: [] // cookie NAME regexes (values are never read)
    },
    versionHints: { scriptRegex: null, metaKey: null }
  });
})();
