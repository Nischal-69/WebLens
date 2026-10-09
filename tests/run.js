/**
 * WebLens — tests/run.js (headless detector fixtures, no dependencies)
 *
 * Run: `node tests/run.js` (exit 0 = all green).
 *
 * What this proves: the engine's channel policy on synthetic signals —
 * strong singles emit, weak singles stay silent, shared signals (gtag)
 * don't misattribute, and prose never corroborates. Fixtures are
 * hand-written, not a crawl of the real web.
 *
 * What this does NOT claim: 100% detection accuracy. Real pages vary;
 * these fixtures guard the rules, they don't certify the wild.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// Browser-global shim: core/detector IIFEs attach to `window`.
globalThis.window = globalThis;

function load(rel) {
  require(path.join(ROOT, rel));
}

load("core/categories.js");
load("core/engine.js");
load("core/normalize.js");

const detectorFiles = fs
  .readdirSync(path.join(ROOT, "detectors"))
  .filter((f) => f.endsWith(".js") && f !== "_template.js" && f !== "registry.js")
  .sort();
for (const f of detectorFiles) load(`detectors/${f}`);
load("detectors/registry.js");

const Engine = globalThis.WebLensEngine;
const Normalize = globalThis.WebLensNormalize;
const Detectors = globalThis.WebLensDetectors;

let pass = 0;
let fail = 0;

function signals(over = {}) {
  return {
    globals: [],
    scriptUrls: [],
    styleUrls: [],
    meta: {},
    cookieNames: [],
    html: "",
    hasSelector: () => false,
    ...over
  };
}

function withSelectors(list) {
  return (sel) => list.includes(sel);
}

// Run the full pipeline (engine + normalize) like content.js does.
function scan(over = {}, mainFlags = {}) {
  const hits = Engine.run(signals(over), Detectors, mainFlags);
  return Normalize.normalize(hits);
}

function slugs(result) {
  return result.map((t) => t.slug);
}

function check(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`PASS ${name}`);
  } catch (err) {
    fail += 1;
    console.log(`FAIL ${name} — ${err.message}`);
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function expectEmitted(result, slug) {
  assert(slugs(result).includes(slug), `expected "${slug}" emitted, got [${slugs(result)}]`);
}

function expectSilent(result, slug) {
  assert(!slugs(result).includes(slug), `expected "${slug}" silent, got [${slugs(result)}]`);
}

// ---------- Registry integrity ----------
check("registry loads every detector file exactly once", () => {
  const seen = new Set(slugs(Detectors.map((d) => ({ slug: d.slug }))));
  assert(
    seen.size === detectorFiles.length,
    `expected ${detectorFiles.length} unique slugs, got ${seen.size}`
  );
  for (const d of Detectors) {
    assert(d.slug && d.name && d.category && d.description, `incomplete detector: ${d.slug}`);
  }
});

// ---------- Frameworks ----------
check("react app detected with high confidence", () => {
  const r = scan({
    globals: ["React"],
    scriptUrls: ["https://cdn.example.com/react-dom.min.js"],
    html: '<div id="root" data-reactroot></div>',
    hasSelector: withSelectors(["[data-reactroot]", "[data-reactid]"])
  });
  expectEmitted(r, "react");
  assert(
    r.find((t) => t.slug === "react").confidence === "high",
    "react should be high confidence"
  );
});

check("next.js detected via static path + flag", () => {
  const r = scan(
    {
      scriptUrls: ["https://example.com/_next/static/chunks/app.js"],
      html: '<div id="__next"></div><script id="__NEXT_DATA__" type="application/json">{}</script>',
      hasSelector: withSelectors(["#__next", "#__NEXT_DATA__"])
    },
    { hasNextData: true }
  );
  expectEmitted(r, "nextjs");
});

check("vue detected via global + script", () => {
  const r = scan({
    globals: ["Vue"],
    scriptUrls: ["https://cdn.example.com/vue.min.js"]
  });
  expectEmitted(r, "vue");
});

// ---------- gtag disambiguation (the overlap that used to double-fire) ----------
check("bare gtag stays silent for both Analytics and Ads", () => {
  const r = scan({
    globals: ["gtag"],
    html: "<p>we use gtag on this site</p>"
  });
  expectSilent(r, "google-analytics");
  expectSilent(r, "google-ads");
});

check("GA4 emits Analytics, not Ads", () => {
  const r = scan({
    globals: ["gtag"],
    scriptUrls: ["https://www.googletagmanager.com/gtag/js?id=G-ABC123DE"],
    html: '<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123DE"></script>' +
      "<script>gtag('config', 'G-ABC123DE');</script>",
    cookieNames: ["_ga", "_gid"]
  });
  expectEmitted(r, "google-analytics");
  expectSilent(r, "google-ads");
  assert(
    r.find((t) => t.slug === "google-analytics").confidence === "high",
    "GA4 should be high confidence"
  );
});

check("Ads emits Ads, not Analytics", () => {
  const r = scan({
    globals: ["gtag"],
    scriptUrls: ["https://www.googletagmanager.com/gtag/js?id=AW-123456789"],
    html: "<script>gtag('config', 'AW-123456789');</script>",
    cookieNames: ["_gcl_au"]
  });
  expectEmitted(r, "google-ads");
  expectSilent(r, "google-analytics");
});

check("googleadservices conversion script emits Ads (URL in two channels)", () => {
  const src = "https://www.googleadservices.com/pagead/conversion.js";
  const r = scan({
    scriptUrls: [src],
    html: `<script src="${src}"></script>`
  });
  expectEmitted(r, "google-ads");
});

// ---------- Server prose must not corroborate ----------
check("nginx prose article stays silent", () => {
  const r = scan({
    meta: { generator: "WordPress" },
    html: "<article><h1>How to tune nginx for caching</h1><p>nginx is great</p></article>"
  });
  expectSilent(r, "nginx");
});

check("nginx version comment emits", () => {
  const r = scan({ html: "<!-- nginx/1.24.0 --><html></html>" });
  expectEmitted(r, "nginx");
});

check("apache bare prose stays silent (version required)", () => {
  const r = scan({ html: "<article><p>powered by Apache</p></article>" });
  expectSilent(r, "apache");
});

check("apache version signature emits", () => {
  const r = scan({ html: "<!-- apache/2.4.57 (Unix) -->" });
  expectEmitted(r, "apache");
});

// ---------- CMS scoping ----------
check("drupal lookalike /core/app.js stays silent", () => {
  const r = scan({ scriptUrls: ["https://example.com/core/app.js"] });
  expectSilent(r, "drupal");
});

check("real drupal emits high", () => {
  const r = scan({
    globals: ["Drupal"],
    scriptUrls: ["https://example.com/core/modules/node/node.js"],
    meta: { generator: "Drupal 10" },
    html: '<body data-drupal-selector="x">',
    hasSelector: withSelectors(["[data-drupal-selector]"])
  });
  expectEmitted(r, "drupal");
  assert(r.find((t) => t.slug === "drupal").confidence === "high", "drupal should be high");
});

check("wordpress emits via includes + generator", () => {
  const r = scan({
    scriptUrls: ["https://example.com/wp-includes/js/wp-embed.min.js"],
    meta: { generator: "WordPress 6.4" },
    html: '<link rel="stylesheet" href="https://example.com/wp-content/themes/x/style.css">'
  });
  expectEmitted(r, "wordpress");
});

// ---------- Weak singles stay silent ----------
check("jquery prose mention alone stays silent", () => {
  const r = scan({ html: "<article><p>jQuery is a classic library</p></article>" });
  expectSilent(r, "jquery");
});

check("jquery global + script emits", () => {
  const r = scan({
    globals: ["jQuery"],
    scriptUrls: ["https://cdn.example.com/jquery.min.js"]
  });
  expectEmitted(r, "jquery");
});

check("astro generator alone stays silent (minSignals)", () => {
  const r = scan({ meta: { generator: "Astro v3.1" } });
  expectSilent(r, "astro");
});

check("bootstrap stylesheet + prose alone stays silent", () => {
  const r = scan({
    styleUrls: ["https://cdn.example.com/bootstrap.min.css"],
    html: "<p>bootstrap makes grids easy</p>"
  });
  expectSilent(r, "bootstrap");
});

check("bootstrap global emits", () => {
  const r = scan({ globals: ["bootstrap"] });
  expectEmitted(r, "bootstrap");
});

// ---------- Approved single-hit behavior (CDN, fonts) ----------
check("cloudfront single asset URL emits (approved)", () => {
  const r = scan({ scriptUrls: ["https://d123abc.cloudfront.net/app.js"] });
  expectEmitted(r, "cloudfront");
});

check("google fonts stylesheet + link emits", () => {
  const href = "https://fonts.googleapis.com/css2?family=Inter";
  const r = scan({
    styleUrls: [href],
    html: `<link href="${href}" rel="stylesheet">`,
    hasSelector: withSelectors(['link[href*="fonts.googleapis.com"]'])
  });
  expectEmitted(r, "google-fonts");
});

// ---------- Summary ----------
console.log(`\n${pass} passed, ${fail} failed (${detectorFiles.length} detectors loaded).`);
if (fail > 0) process.exit(1);
