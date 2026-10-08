/**
 * WebLens — background.js (MV3 service worker, type: module)
 * Central event hub. Detection orchestration will live here in later batches.
 */

const WebLensBackground = {
  init() {
    chrome.runtime.onInstalled.addListener((details) => this.onInstalled(details));
    // Future: chrome.action.onClicked, chrome.tabs.onUpdated,
    // chrome.runtime.onMessage for SCAN_REQUEST / SCAN_RESULT.
    console.log("[WebLens] Background service worker registered.");
  },

  onInstalled(details) {
    if (details.reason === "install") {
      console.log("[WebLens] Installed — See what powers the web.");
    } else if (details.reason === "update") {
      console.log(`[WebLens] Updated to ${chrome.runtime.getManifest().version}.`);
    }
  }
};

WebLensBackground.init();
