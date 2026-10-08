/**
 * WebLens — content.js (isolated world orchestrator)
 * Loaded AFTER core/signals.js, detectors/*, core/engine.js, core/normalize.js.
 * Listens for WEBLENS_SCAN, collects signals, runs engine, returns structured results.
 */
(() => {
  function getApi() {
    return {
      Signals: window.WebLensSignals,
      Detectors: window.WebLensDetectors || [],
      Engine: window.WebLensEngine,
      Normalize: window.WebLensNormalize
    };
  }

  const WebLensContent = {
    init() {
      if (!chrome?.runtime?.onMessage) return;
      chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg?.type !== "WEBLENS_SCAN") return false;
        (async () => {
          try {
            const { Signals, Detectors, Engine, Normalize } = getApi();
            if (!Signals || !Engine || !Normalize) {
              sendResponse({ ok: false, error: "engine-not-loaded" });
              return;
            }
            const mainGlobals = msg.mainGlobals || null;
            const mainFlags = mainGlobals && typeof mainGlobals.hasNextData !== "undefined"
              ? { hasNextData: !!mainGlobals.hasNextData }
              : null;
            const signals = Signals.collect(mainGlobals);
            const hits = Engine.run(signals, Detectors, mainFlags);
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
