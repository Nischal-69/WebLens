/**
 * WebLens — core/signals.js
 * In-page signal collectors. Runs in content-script (isolated) context.
 * No detection rules here — only raw evidence gathering.
 * Loaded before content.js via manifest content_scripts order.
 * Attaches to window.WebLensSignals (browser) / globalThis (safe).
 */
(function () {
  const MAX_HTML = 20000;
  const MAX_URLS = 120;

  function safe(fn, fallback) {
    try {
      return fn();
    } catch {
      return fallback;
    }
  }

  function collectMeta() {
    const out = {};
    safe(() => {
      const tags = document.querySelectorAll("meta[name], meta[property]");
      tags.forEach((m) => {
        const key = (m.getAttribute("name") || m.getAttribute("property") || "").toLowerCase().trim();
        const val = (m.getAttribute("content") || "").trim();
        if (key && val && !(key in out)) out[key] = val.slice(0, 500);
      });
    }, undefined);
    return out;
  }

  function collectScriptUrls() {
    return safe(() => {
      const urls = [];
      document.querySelectorAll("script[src]").forEach((s) => {
        const src = s.getAttribute("src") || "";
        if (src) urls.push(src.slice(0, 500));
      });
      return urls.slice(0, MAX_URLS);
    }, []);
  }

  function collectStyleUrls() {
    return safe(() => {
      const urls = [];
      document.querySelectorAll('link[rel="stylesheet"][href], link[href][rel*="style"]').forEach((l) => {
        const href = l.getAttribute("href") || "";
        if (href) urls.push(href.slice(0, 500));
      });
      // Inline <style> tailwind marker is checked via DOM, not here.
      return urls.slice(0, MAX_URLS);
    }, []);
  }

  function collectHtml() {
    return safe(() => (document.documentElement?.outerHTML || "").slice(0, MAX_HTML), "");
  }

  function collectCookieNames() {
    return safe(() => {
      const raw = document.cookie || "";
      if (!raw) return [];
      return raw
        .split(";")
        .map((c) => c.split("=")[0].trim())
        .filter(Boolean)
        .slice(0, 60);
    }, []);
  }

  // Quick isolated-world global presence check (MAIN probe supplements this).
  // NOTE: "_" and "$" are weak alone — detectors must require corroboration.
  const KNOWN_GLOBALS = [
    "React",
    "__REACT_DEVTOOLS_GLOBAL_HOOK__",
    "Vue",
    "__VUE__",
    "__NUXT__",
    "Nuxt",
    "jQuery",
    "$",
    "angular",
    "ng",
    "gsap",
    "TweenMax",
    "TweenLite",
    "lodash",
    "_",
    "THREE",
    "__sveltekit",
    "astro",
    "Shopify",
    "wixEmbedsAPI",
    "Squarespace",
    "Drupal",
    "Joomla",
    "Ghost",
    "woocommerce_params",
    "gtag",
    "ga",
    "google_tag_manager",
    "dataLayer",
    "clarity",
    "hj",
    "Matomo",
    "_paq",
    "fbq",
    "hubspot",
    "_hsq",
    "Intercom",
    "$crisp",
    "CRISP_WEBSITE_ID",
    "bootstrap",
    "tailwind"
  ];

  function collectIsolatedGlobals() {
    const found = [];
    KNOWN_GLOBALS.forEach((name) => {
      const hit = safe(() => typeof window[name] !== "undefined" && window[name] !== null, false);
      if (hit) found.push(name);
    });
    return found;
  }

  function hasSelector(selector) {
    return safe(() => !!document.querySelector(selector), false);
  }

  const api = {
    collect(extraMainGlobals) {
      const signals = {
        url: safe(() => location.href, ""),
        html: collectHtml(),
        meta: collectMeta(),
        scriptUrls: collectScriptUrls(),
        styleUrls: collectStyleUrls(),
        cookieNames: collectCookieNames(),
        globals: collectIsolatedGlobals(),
        hasSelector
      };
      // Merge MAIN-world globals (authoritative for page-level frameworks).
      if (extraMainGlobals && Array.isArray(extraMainGlobals.present)) {
        const merged = new Set([...signals.globals, ...extraMainGlobals.present]);
        signals.globals = [...merged];
      }
      return signals;
    }
  };

  (typeof window !== "undefined" ? window : globalThis).WebLensSignals = api;
})();
