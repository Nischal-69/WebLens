/**
 * WebLens — content.js (isolated world orchestrator)
 * Loaded AFTER core/signals.js, detectors/*, core/engine.js, core/normalize.js.
 * Listens for WEBLENS_SCAN, collects signals, runs engine, returns structured results.
 */
(() => {
  // Guard against double-injection: the popup may programatically inject
  // these same files via chrome.scripting on tabs that pre-date install.
  // Without this, a second listener would be registered and sendResponse
  // would fire twice for a single scan.
  if (window.__WEBLENS_CONTENT_READY__) return;
  window.__WEBLENS_CONTENT_READY__ = true;

  function getApi() {
    return {
      Signals: window.WebLensSignals,
      Detectors: window.WebLensDetectors || [],
      Engine: window.WebLensEngine,
      Normalize: window.WebLensNormalize,
      WpExtras: window.WebLensWpExtras || null
    };
  }

  const WebLensContent = {
    init() {
      if (!chrome?.runtime?.onMessage) return;
      chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        // Lightweight health check used by the popup to decide whether
        // on-demand injection is needed. Must stay synchronous.
        if (msg?.type === "WEBLENS_PING") {
          sendResponse({ ok: true });
          return false;
        }
        if (msg?.type !== "WEBLENS_SCAN") return false;
        (async () => {
          try {
            const { Signals, Detectors, Engine, Normalize, WpExtras } = getApi();
            if (!Signals || !Engine || !Normalize) {
              sendResponse({ ok: false, error: "engine-not-loaded" });
              return;
            }
            const mainGlobals = msg.mainGlobals || null;
            const mainFlags = mainGlobals
              ? {
                  ...(typeof mainGlobals.hasNextData !== "undefined"
                    ? { hasNextData: !!mainGlobals.hasNextData }
                    : {}),
                  ...(typeof mainGlobals.hasNuxtData !== "undefined"
                    ? { hasNuxtData: !!mainGlobals.hasNuxtData }
                    : {})
                }
              : null;
            const signals = Signals.collect(mainGlobals);
            const hits = Engine.run(signals, Detectors, mainFlags);
            // Passive WP enrichment: only when WordPress itself was detected.
            if (WpExtras && hits.some((h) => h?.detector?.slug === "wordpress")) {
              try {
                const extras = WpExtras.extract(signals);
                if (extras) {
                  const wpHit = hits.find((h) => h?.detector?.slug === "wordpress");
                  if (wpHit) wpHit.details = extras;
                }
              } catch {
                /* extras must never break the scan */
              }
            }
            const technologies = Normalize.normalize(hits);
            sendResponse({ ok: true, url: location.href, technologies });
          } catch (err) {
            sendResponse({ ok: false, error: String((err && err.message) || err) });
          }
        })();
        return true; // async response
      });
      console.log(`[WebLens] Content ready (${(window.WebLensDetectors || []).length} detectors).`);
    }
  };

  WebLensContent.init();
})();
