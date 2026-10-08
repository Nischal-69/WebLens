/**
 * WebLens — core/wp-extras.js
 * Passive WordPress theme/plugin identification from browser-exposed
 * asset URLs only. No fetching, no probing, no auth bypass.
 * Loaded after core/engine.js, before core/normalize.js.
 */
(function () {
  const THEME_RE = /\/wp-content\/themes\/([a-z0-9_-]+)\//i;
  const PLUGIN_RE = /\/wp-content\/plugins\/([a-z0-9_-]+)\//i;
  const MAX_PLUGINS = 8;

  function prettify(slug) {
    return String(slug || "")
      .split(/[-_]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function tally(pattern, signals) {
    const counts = new Map(); // slug(lower) -> { slug, urlEvidence, refs }
    const sources = [
      ...(signals.scriptUrls || []),
      ...(signals.styleUrls || [])
    ];
    for (const u of sources) {
      if (typeof u !== "string") continue;
      const m = u.match(pattern);
      if (!m || !m[1]) continue;
      const raw = m[1].replace(/[?#].*$/, "");
      if (raw.length < 2 || raw.length > 80) continue;
      const key = raw.toLowerCase();
      const e = counts.get(key) || { slug: raw, urlEvidence: 0, refs: 0 };
      e.urlEvidence += 1;
      e.refs += 1;
      counts.set(key, e);
    }
    // HTML corroboration only (never sufficient alone for theme winner;
    // plugins require urlEvidence >= 1, enforced by caller filter).
    const html = typeof signals.html === "string" ? signals.html : "";
    if (html) {
      const g = new RegExp(pattern.source, "gi");
      let m;
      let guard = 0;
      while ((m = g.exec(html)) && guard++ < 200) {
        const raw = (m[1] || "").replace(/[?#].*$/, "");
        if (raw.length < 2 || raw.length > 80) continue;
        const key = raw.toLowerCase();
        const e = counts.get(key) || { slug: raw, urlEvidence: 0, refs: 0 };
        e.refs += 1;
        counts.set(key, e);
      }
    }
    return counts;
  }

  const api = {
    MAX_PLUGINS,
    prettify,
    extract(signals) {
      if (!signals) return null;
      const themes = tally(THEME_RE, signals);
      let theme = null;
      for (const e of themes.values()) {
        // Theme requires at least one asset URL (not prose/html alone).
        if (e.urlEvidence < 1) continue;
        if (!theme || e.refs > theme.evidence) {
          theme = { slug: e.slug.toLowerCase(), name: prettify(e.slug), evidence: e.refs };
        }
      }
      const plugins = [];
      for (const e of tally(PLUGIN_RE, signals).values()) {
        if (e.urlEvidence < 1) continue; // single asset URL suffices (URL is strong)
        plugins.push({ slug: e.slug.toLowerCase(), name: prettify(e.slug), evidence: e.refs });
      }
      plugins.sort((a, b) => b.evidence - a.evidence || a.slug.localeCompare(b.slug));
      if (!theme && plugins.length === 0) return null;
      return { theme, plugins: plugins.slice(0, MAX_PLUGINS) };
    }
  };

  (typeof window !== "undefined" ? window : globalThis).WebLensWpExtras = api;
})();
