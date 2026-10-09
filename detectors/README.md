# WebLens detectors

Reliability over coverage. WebLens never claims 100% detection accuracy:
every rule below is designed to stay silent rather than guess.

## Add a technology in 5 steps

1. Copy `detectors/_template.js` to `detectors/<slug>.js` (lowercase slug).
2. Fill in `slug`, `name`, `category` (a canonical name from
   `core/categories.js` `ORDER`), `description`, and `website` (or `null`).
3. Add signals (see "Signal reference"). Prove at least one strong channel
   or two corroborating channels; note the proof in a `// NOTE:` comment.
4. Register the file in `manifest.json` `content_scripts[0].js`,
   alphabetical by filename, before `registry.js`.
5. Add a fixture to `tests/run.js` (positive + false-positive cases) and
   run `node tests/run.js` until green.

## Signal reference

| Slot | Tests against | Strength |
|---|---|---|
| `globals` | Page JS globals (isolated + MAIN probe) | **Strong** — emits alone |
| `scriptUrl` | `<script src>` values | **Strong** — emits alone |
| `meta` | `<meta name/property>` content | **Strong** — emits alone |
| `htmlStrong` | Versioned signatures / IDs in markup | **Strong** — emits alone |
| `styleUrl` | Stylesheet `href` values | Weak — needs corroboration |
| `domAttr` | CSS selectors present in the DOM | Weak — needs corroboration |
| `flags` | MAIN-world probe booleans | Weak — needs corroboration |
| `cookies` | Cookie **names** (values are never read) | Weak — needs corroboration |
| `html` | Prose regexes over markup | Score only — **never evidence** |

`minSignals: 2` requires two distinct channels. The engine dedupes
channels before gating, so two patterns hitting the same channel still
count once. `registry.js` drops detectors with no usable signals and warns
about unreachable `minSignals` — watch the console when testing.

## Rules of thumb

- Anchor asset-URL regexes to vendor dirs or file names
  (`/\/wp-includes\//i`, not `/press/i`).
- Never use a shared global to attribute one product (`gtag` fires both
  Google Analytics and Google Ads — both detectors scope with IDs,
  cookies, and tag URLs instead, and bare `gtag` stays silent).
- `htmlStrong` patterns must require a version or ID
  (`/powered by apache\/\d+\.\d+/i`, not bare prose).
- Overlapping truths both emit (React + Next.js, WordPress + WooCommerce +
  PHP) — that is correct, not duplication. Same-`slug` double
  registration is deduped by the registry and the normalizer.
- Known-implied pairs are documented in the detector's `// NOTE:` comment.
