/**
 * WebLens — popup.js
 * Popup UI controller. Kept modular for the future detection engine.
 *
 * Planned modules (later batches):
 *   - detectors/*  -> framework / CMS / analytics signatures
 *   - core/scan.js -> tab messaging + result aggregation
 *   - ui/render.js -> result list rendering
 */

// ---------- UI module ----------
const UI = {
  scanBtn: null,
  statusText: null,
  resultsList: null,

  init() {
    this.scanBtn = document.getElementById("scanBtn");
    this.statusText = document.getElementById("statusText");
    this.resultsList = document.getElementById("resultsList");

    if (!this.scanBtn) return;
    this.scanBtn.addEventListener("click", () => Actions.onScanRequested());
  },

  setStatus(message) {
    if (this.statusText) this.statusText.textContent = message;
  }
};

// ---------- Actions module (placeholder) ----------
const Actions = {
  async onScanRequested() {
    // Non-functional for v0.1.0 — detection engine lands in later batches.
    UI.setStatus("Scan coming soon — detection engine not yet wired.");
    console.log("[WebLens] Scan Website clicked (no-op placeholder).");
  }
};

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
  UI.init();
});
