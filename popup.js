/**
 * WebLens — popup.js
 * Popup UI controller (UI-only batch — no detection engine yet).
 *
 * Modules:
 *   Store    -> popup state (status, technologies[])
 *   Elements -> DOM cache
 *   Domain   -> active-tab hostname display (not fingerprinting)
 *   Status   -> scan status pill + dot + footer
 *   Results  -> rendering + count (renders Store.technologies, currently [])
 *   Search   -> client-side filter over rendered rows
 *   Actions  -> Scan button handler (loading/empty demo only)
 *
 * Detection integration point (later batch):
 *   Actions.onScanRequested() will send { type: "WEBLENS_SCAN" }
 *   to content.js / background.js and render the real payload via
 *   Results.render(detectedTechnologies).
 */

// ---------- Store ----------
const Store = {
  status: "idle", // "idle" | "scanning"
  technologies: [], // Detection engine fills this later: [{ name, category, version }]
  filter: ""
};

// ---------- Elements ----------
const Elements = {
  els: {},
  cache() {
    const ids = [
      "domainName",
      "scanBtn",
      "scanStatus",
      "scanStatusDot",
      "techCount",
      "searchInput",
      "loadingState",
      "emptyState",
      "resultsList",
      "noMatch",
      "noMatchQuery",
      "footerStatus"
    ];
    for (const id of ids) this.els[id] = document.getElementById(id);
  },
  get(id) {
    return this.els[id] || null;
  }
};

// ---------- Domain (display only) ----------
const Domain = {
  async resolve() {
    const label = Elements.get("domainName");
    if (!label) return;
    try {
      if (chrome?.tabs?.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          const host = new URL(tab.url).hostname;
          label.textContent = host || "unknown site";
          label.title = tab.url;
          return;
        }
      }
    } catch (err) {
      console.warn("[WebLens] Domain lookup failed:", err);
    }
    label.textContent = "unknown site";
  }
};

// ---------- Status ----------
const Status = {
  set(next) {
    Store.status = next;
    const text = Elements.get("scanStatus");
    const dot = Elements.get("scanStatusDot");
    const footer = Elements.get("footerStatus");
    const btn = Elements.get("scanBtn");

    const map = {
      idle: { label: "Idle", footer: "ready" },
      scanning: { label: "Scanning", footer: "scanning…" }
    };
    const state = map[next] || map.idle;

    if (text) text.textContent = state.label;
    if (footer) footer.textContent = state.footer;
    if (dot) dot.className = `dot dot-${next === "idle" ? "idle" : next}`;
    if (btn) btn.disabled = next === "scanning";
  }
};

// ---------- Results ----------
const Results = {
  render() {
    const list = Elements.get("resultsList");
    const empty = Elements.get("emptyState");
    const loading = Elements.get("loadingState");
    if (!list || !empty || !loading) return;

    const query = Store.filter.trim().toLowerCase();
    const items = Store.technologies.filter((t) =>
      query
        ? `${t.name} ${t.category || ""}`.toLowerCase().includes(query)
        : true
    );

    // Views: loading takes precedence, then results, then empty.
    const isScanning = Store.status === "scanning";
    loading.hidden = !isScanning;
    empty.hidden = isScanning || items.length > 0 || query.length > 0;
    list.hidden = isScanning || items.length === 0;

    list.innerHTML = "";
    for (const tech of items) {
      list.appendChild(this.row(tech));
    }

    this.updateCount(items.length);
    this.updateNoMatch(items.length, query);
  },

  row(tech) {
    const li = document.createElement("li");
    li.className = "tech";

    const mark = document.createElement("span");
    mark.className = "tech-mark";
    mark.textContent = this.initials(tech.name);
    mark.setAttribute("aria-hidden", "true");

    const meta = document.createElement("div");
    meta.className = "tech-meta";

    const name = document.createElement("span");
    name.className = "tech-name";
    name.textContent = tech.name;

    const cat = document.createElement("span");
    cat.className = "tech-cat";
    cat.textContent = tech.category || "Uncategorized";

    meta.append(name, cat);
    li.append(mark, meta);

    if (tech.version) {
      const ver = document.createElement("span");
      ver.className = "tech-ver";
      ver.textContent = `v${tech.version}`;
      ver.title = `Version ${tech.version}`;
      li.append(ver);
    }
    return li;
  },

  initials(name = "?") {
    const parts = name.trim().split(/[\s\-_.]+/).filter(Boolean);
    const letters = parts.slice(0, 2).map((p) => p[0].toUpperCase());
    return letters.join("") || "?";
  },

  updateCount(n) {
    const count = Elements.get("techCount");
    if (count) count.textContent = `${n} found`;
  },

  updateNoMatch(visibleCount, query) {
    const noMatch = Elements.get("noMatch");
    const q = Elements.get("noMatchQuery");
    if (!noMatch) return;
    const show = query.length > 0 && visibleCount === 0 && Store.technologies.length > 0;
    noMatch.hidden = !show;
    if (q) q.textContent = Store.filter.trim();
  }
};

// ---------- Search (filter only, no detection) ----------
const Search = {
  init() {
    const input = Elements.get("searchInput");
    if (!input) return;
    input.addEventListener("input", () => {
      Store.filter = input.value;
      Results.render();
    });
  },
  clear() {
    const input = Elements.get("searchInput");
    if (input) input.value = "";
    Store.filter = "";
  }
};

// ---------- Actions (placeholder — no detection calls yet) ----------
const Actions = {
  scanTimer: null,

  onScanRequested() {
    if (Store.status === "scanning") return;
    Search.clear();
    Status.set("scanning");
    Results.render();
    console.log("[WebLens] Scan requested (UI demo — engine not wired yet).");

    // Demo-only delay so loading + empty states are reviewable.
    // Replaced by real content.js/background.js messaging in a later batch.
    clearTimeout(this.scanTimer);
    this.scanTimer = setTimeout(() => {
      Store.technologies = [];
      Status.set("idle");
      Results.render();
    }, 900);
  }
};

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
  Elements.cache();
  Status.set("idle");
  Results.render();
  Search.init();
  Domain.resolve();

  const btn = Elements.get("scanBtn");
  if (btn) btn.addEventListener("click", () => Actions.onScanRequested());
});
