/**
 * WebLens — core/icons.js
 * Monochrome category glyphs. Inline SVG only — no external images.
 * Usage: WebLensIcons.svgFor("Analytics") -> "<svg ...>...</svg>"
 * Unknown categories fall back to the "Other" magnifier.
 * Stroke inherits via currentColor; keep icons 14px in a 26px chip.
 */
(function () {
  const OPEN = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
  const CLOSE = "</svg>";
  const S = (inner) => OPEN + inner + CLOSE;
  const P = 'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const F = 'fill="currentColor" stroke="none"';

  const GLYPHS = {
    Frameworks: S(
      `<rect x="2" y="2" width="5" height="5" rx="1" ${P}/>` +
      `<rect x="9" y="2" width="5" height="5" rx="1" ${P}/>` +
      `<rect x="2" y="9" width="5" height="5" rx="1" ${P}/>` +
      `<rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" stroke="none"/>`
    ),
    "JavaScript Libraries": S(
      `<path d="M6 4.5 2.5 8 6 11.5" ${P}/><path d="M10 4.5l3.5 3.5L10 11.5" ${P}/>`
    ),
    CMS: S(
      `<rect x="2.5" y="4.5" width="11" height="9" rx="1.2" ${P}/>` +
      `<line x1="2.5" y1="7.5" x2="13.5" y2="7.5" ${P}/>` +
      `<circle cx="4.6" cy="6" r="0.9" ${F}/>`
    ),
    WordPress: S(
      `<circle cx="8" cy="8" r="5.8" ${P}/>` +
      `<path d="M8 3.5v9M5 6.2 8 8l3-1.8" ${P}/>`
    ),
    Analytics: S(
      `<line x1="2.5" y1="13.5" x2="13.5" y2="13.5" ${P}/>` +
      `<rect x="3.5" y="9" width="2.4" height="3.4" rx="0.5" ${F}/>` +
      `<rect x="6.8" y="6.4" width="2.4" height="6" rx="0.5" ${F}/>` +
      `<rect x="10.1" y="3.4" width="2.4" height="9" rx="0.5" ${F}/>`
    ),
    Advertising: S(
      `<path d="M2.5 9.5V6.8c0-.6.5-1.1 1.1-1L11 4.2c.8-.1 1.5.5 1.5 1.3v1.6" ${P}/>` +
      `<path d="M12.5 7.1v3.1c0 .8-.7 1.4-1.5 1.3L4 10.2" ${P}/>` +
      `<line x1="3" y1="10.5" x2="3" y2="13.5" ${P}/>`
    ),
    Marketing: S(
      `<rect x="2.5" y="4" width="11" height="8.5" rx="1.2" ${P}/>` +
      `<path d="M3 5l5 3.6L13 5" ${P}/>`
    ),
    Fonts: S(
      `<path d="M3 13 8 3.5 13 13" ${P}/><line x1="5" y1="10" x2="11" y2="10" ${P}/>`
    ),
    CDN: S(
      `<circle cx="8" cy="8" r="5.8" ${P}/>` +
      `<path d="M2.2 8h11.6M8 2.2c-3.2 3-3.2 8.6 0 11.6M8 2.2c3.2 3 3.2 8.6 0 11.6" ${P}/>`
    ),
    Hosting: S(
      `<rect x="2.5" y="2.8" width="11" height="4.4" rx="1" ${P}/>` +
      `<rect x="2.5" y="8.8" width="11" height="4.4" rx="1" ${P}/>` +
      `<circle cx="5" cy="5" r="0.9" ${F}/><circle cx="5" cy="11" r="0.9" ${F}/>`
    ),
    "Web Server": S(
      `<rect x="2" y="2.5" width="12" height="11" rx="1.4" ${P}/>` +
      `<path d="M5 6l2 1.8L5 9.6" ${P}/><line x1="8" y1="9.8" x2="11" y2="9.8" ${P}/>`
    ),
    CSS: S(
      `<path d="M8 2.5c-1.8 0-3.2 1.5-3.2 3.3 0 1.2.7 2.1 1.4 2.7.4.3.5.7.5 1.1v.6h4.6v-.6c0-.4.1-.8.5-1.1.7-.6 1.4-1.5 1.4-2.7 0-1.8-1.4-3.3-3.2-3.3H8Z" ${P}/>` +
      `<line x1="6.5" y1="13.5" x2="9.5" y2="13.5" ${P}/>`
    ),
    Payment: S(
      `<rect x="2" y="3.5" width="12" height="9" rx="1.4" ${P}/>` +
      `<line x1="2" y1="6.5" x2="14" y2="6.5" ${P}/>` +
      `<line x1="4" y1="10.2" x2="6.5" y2="10.2" ${P}/>`
    ),
    Security: S(
      `<path d="M8 2.2 12.8 4v4c0 3-2.1 5-4.8 5.8C5.3 13 3.2 11 3.2 8V4L8 2.2Z" ${P}/>` +
      `<path d="M6 7.8l1.5 1.5L10.2 6.5" ${P}/>`
    ),
    Ecommerce: S(
      `<path d="M2.5 4h2l1.6 7h7.4l1.6-5H5" ${P}/>` +
      `<circle cx="6.5" cy="13" r="1.1" ${F}/><circle cx="11.5" cy="13" r="1.1" ${F}/>`
    ),
    Other: S(
      `<circle cx="7" cy="7" r="4.5" ${P}/>` +
      `<line x1="10.5" y1="10.5" x2="14" y2="14" ${P}/>`
    )
  };

  const EXT_LINK = S(`<path d="M6.5 3.5H3.5v9h9V9.5" ${P}/><path d="M9 2.5h4.5V7" ${P}/><line x1="13.2" y1="2.8" x2="8" y2="8" ${P}/>`);

  const api = {
    svgFor(category) {
      return GLYPHS[category] || GLYPHS.Other;
    },
    extLink() {
      return EXT_LINK;
    },
    categories() {
      return Object.keys(GLYPHS);
    }
  };

  (typeof window !== "undefined" ? window : globalThis).WebLensIcons = api;
})();
