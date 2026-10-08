/**
 * WebLens — popup.js
 * Popup UI controller + scan orchestration (detection engine v1).
 *
 * Modules:
 *   Store    -> { status, technologies[], filter, notice }
 *   Elements -> DOM cache
 *   Domain   -> active-tab hostname display
 *   Status   -> idle | scanning | done | error
 *   Results  -> render structured technologies [{name,category,description,
 *               confidence,score,detectedBy,website,logo,version}]
 *   Search   -> client-side filter
 *   Scanner  -> MAIN probe + content-script messaging (no backend)
 *   Actions  -> Scan button handler
 */

// ---------- Store ----------
const Store = {
  status: "idle", // idle | scanning | done | error
  technologies: [],
  filter: "",
  notice: "" // e.g. "Cannot scan this page" / error text
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

// ---------- Domain ----------
const Domain = {
  async getActiveTab() {
    try {
      if (!chrome?.tabs?.query) return null;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab || null;
    } catch (err) {
      console.warn("[WebLens] getActiveTab failed:", err);
      return null;
    }
  },

  async resolve() {
    const label = Elements.get("domainName");
    if (!label) return;
    const tab = await this.getActiveTab();
    if (tab?.url) {
      try {
        label.textContent = new URL(tab.url).hostname || "unknown site";
        label.title = tab.url;
        return;
      } catch {
        /* fall through */
      }
    }
    label.textContent = "unknown site";
  }
};

// ---------- Status ----------
const Status = {
  set(next, footerOverride) {
    Store.status = next;
    const text = Elements.get("scanStatus");
    const dot = Elements.get("scanStatusDot");
    const footer = Elements.get("footerStatus");
    const btn = Elements.get("scanBtn");

    const map = {
      idle: { label: "Idle", footer: "ready" },
      scanning: { label: "Scanning", footer: "scanning…" },
      done: { label: "Done", footer: `${Store.technologies.length} found` },
      error: { label: "Error", footer: Store.notice || "scan failed" }
    };
    const state = map[next] || map.idle;

    if (text) text.textContent = state.label;
    if (footer) footer.textContent = footerOverride || state.footer;
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
    const items = Store.technologies.filter((t) => {
      if (!query) return true;
      const extras =
        t.details != null
          ? [
              t.details.theme?.name || "",
              ...(Array.isArray(t.details.plugins)
                ? t.details.plugins.map((p) => p.name)
                : [])
            ].join(" ")
          : "";
      return `${t.name} ${t.category || ""} ${t.description || ""} ${extras}`
        .toLowerCase()
        .includes(query);
    });

    const isScanning = Store.status === "scanning";
    loading.hidden = !isScanning;

    // Empty state doubles as error/unsupported notice.
    const emptyTitle = empty.querySelector(".state-title");
    const emptySub = empty.querySelector(".state-sub");
    if (Store.status === "error" && Store.notice) {
      if (emptyTitle) emptyTitle.textContent = "Scan unavailable";
      if (emptySub) emptySub.textContent = Store.notice;
    } else {
      if (emptyTitle) emptyTitle.textContent = "No technologies yet";
      if (emptySub) emptySub.textContent = "Run a scan to see what powers this site.";
    }

    empty.hidden = isScanning || items.length > 0 || query.length > 0;
    list.hidden = isScanning || items.length === 0;

    list.innerHTML = "";
    for (const tech of items) list.appendChild(this.row(tech));

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

    const topRow = document.createElement("div");
    topRow.className = "tech-top";

    const name = document.createElement("span");
    name.className = "tech-name";
    if (tech.website) {
      const link = document.createElement("a");
      link.href = tech.website;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = tech.name;
      link.className = "tech-link";
      link.title = tech.description || tech.website;
      name.appendChild(link);
    } else {
      name.textContent = tech.name;
      if (tech.description) name.title = tech.description;
    }

    const conf = document.createElement("span");
    conf.className = `conf conf-${tech.confidence || "low"}`;
    conf.textContent = tech.confidence || "low";
    conf.title = `Confidence: ${tech.confidence || "low"} (${(tech.detectedBy || []).join(", ") || "n/a"})`;

    topRow.append(name, conf);

    const cat = document.createElement("span");
    cat.className = "tech-cat";
    const by = (tech.detectedBy || []).join(" · ");
    cat.textContent = by ? `${tech.category || "Uncategorized"} · ${by}` : tech.category || "Uncategorized";
    cat.title = tech.description || cat.textContent;

    meta.append(topRow, cat);

    // WordPress theme/plugin sub-block (passive extras only).
    if (tech.slug === "wordpress" && tech.details) {
      const { theme, plugins } = tech.details;
      if (theme?.name) {
        const tRow = document.createElement("span");
        tRow.className = "wp-sub";
        const tLabel = document.createElement("span");
        tLabel.className = "wp-label";
        tLabel.textContent = "Theme: ";
        const tName = document.createElement("span");
        tName.className = "wp-val";
        tName.textContent = theme.name;
        tName.title = `Theme slug: ${theme.slug} (${theme.evidence} ref${theme.evidence === 1 ? "" : "s"})`;
        tRow.append(tLabel, tName);
        meta.appendChild(tRow);
      }
      if (Array.isArray(plugins) && plugins.length > 0) {
        const pRow = document.createElement("span");
        pRow.className = "wp-sub";
        const pLabel = document.createElement("span");
        pLabel.className = "wp-label";
        pLabel.textContent = "Plugins: ";
        const pVals = document.createElement("span");
        pVals.className = "wp-val";
        const names = plugins.map((p) => p.name);
        pVals.textContent = names.join(", ");
        pVals.title = plugins.map((p) => `${p.name} (${p.evidence})`).join(", ");
        pRow.append(pLabel, pVals);
        meta.appendChild(pRow);
      }
    }

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
    const parts = String(name).trim().split(/[\s\-_.]+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
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

// ---------- Search ----------
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

// ---------- Scanner (real detection path) ----------
const Scanner = {
  isScannable(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url);
  },

  async probeMainWorld(tabId) {
    try {
      if (!chrome?.scripting?.executeScript) return null;
      const res = await chrome.scripting.executeScript({
        target: { tabId },
        files: ["probe-main.js"],
        world: "MAIN"
      });
      return res?.[0]?.result || null;
    } catch (err) {
      console.warn("[WebLens] MAIN probe failed, continuing isolated-only:", err);
      return null;
    }
  },

  async scanActiveTab() {
    const tab = await Domain.getActiveTab();
    if (!tab?.id || !this.isScannable(tab.url)) {
      throw new Error("Cannot scan this page. Open a regular http(s) website and retry.");
    }
    const mainGlobals = await this.probeMainWorld(tab.id);
    const resp = await chrome.tabs.sendMessage(tab.id, {
      type: "WEBLENS_SCAN",
      mainGlobals
    });
    if (!resp) throw new Error("No response from page. Reload the page and retry.");
    if (!resp.ok) throw new Error(resp.error || "Page scan failed.");
    return Array.isArray(resp.technologies) ? resp.technologies : [];
  }
};

// ---------- Actions ----------
const Actions = {
  async onScanRequested() {
    if (Store.status === "scanning") return;
    Search.clear();
    Store.notice = "";
    Store.technologies = [];
    Status.set("scanning");
    Results.render();
    try {
      const technologies = await Scanner.scanActiveTab();
      Store.technologies = technologies;
      Store.notice = "";
      Status.set("done");
      console.log(`[WebLens] Scan done: ${technologies.length} technologies.`);
    } catch (err) {
      Store.technologies = [];
      Store.notice = err?.message || "Scan failed.";
      Status.set("error");
      console.warn("[WebLens] Scan failed:", err);
    }
    Results.render();
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
