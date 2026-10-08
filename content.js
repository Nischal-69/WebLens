/**
 * WebLens — content.js
 * Runs in page context (document_idle). Fingerprint collectors
 * for the detection engine will be added here in later batches.
 *
 * Planned detectors:
 *   - meta tags / generator
 *   - window globals (React, Vue, Angular, jQuery, Next.js, etc.)
 *   - script src patterns, CSS hints, headers (via background)
 */

(() => {
  const WebLensContent = {
    init() {
      chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg?.type === "WEBLENS_SCAN") {
          // Placeholder response — real fingerprint payload comes later.
          sendResponse({ ok: true, url: location.href, detected: [] });
          return true;
        }
        return false;
      });

      console.log("[WebLens] Content script loaded.");
    }
  };

  WebLensContent.init();
})();
