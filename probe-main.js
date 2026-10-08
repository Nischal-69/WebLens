/**
 * WebLens — probe-main.js
 * Runs in MAIN world via chrome.scripting.executeScript to observe
 * page-level JS globals invisible to the isolated content script.
 * Must stay tiny, side-effect free, and JSON-serializable in return value.
 * Last expression is the return value for executeScript.
 */
(() => {
  const CHECK = [
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
    "bootstrap"
  ];
  const present = [];
  for (const name of CHECK) {
    try {
      if (typeof window[name] !== "undefined" && window[name] !== null) present.push(name);
    } catch {
      /* ignore cross-origin accessor errors */
    }
  }
  let hasNextData = false;
  let hasNuxtData = false;
  try {
    hasNextData = !!document.getElementById("__NEXT_DATA__");
  } catch {
    hasNextData = false;
  }
  try {
    hasNuxtData =
      !!document.getElementById("__NUXT_DATA__") || !!document.querySelector("#__nuxt");
  } catch {
    hasNuxtData = false;
  }
  return { present, hasNextData, hasNuxtData };
})();
