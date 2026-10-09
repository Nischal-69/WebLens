/**
 * WebLens — popup.js
 * Popup UI controller + scan orchestration (detection engine v1).
 *
 * Modules:
 *   Store    -> { status, technologies[], filter, activeCategory, notice }
 *   Elements -> DOM cache
 *   Site     -> active-tab favicon + domain + title + HTTPS display
 *   Status   -> idle | scanning | done | error (scan button + subtitle)
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
  activeCategory: "All", // All | Frameworks | CMS | Analytics | WordPress | Fonts | Infrastructure | Other
  notice: "" // e.g. "Cannot scan this page" / error text
};

// ---------- Elements ----------
const Elements = {
  els: {},
  cache() {
    const ids = [
      "domainName",
      "pageTitle",
      "siteSubtitle",
      "siteFavicon",
      "siteFallback",
      "httpsBadge",
      "scanBtn",
      "scanBtnLabel",
      "searchInput",
      "categoryFilters",
      "loadingState",
      "emptyState",
      "resultsList",
      "noMatch",
      "noMatchQuery",
      "noMatchFilter",
      "clearFiltersBtn"
    ];
    for (const id of ids) this.els[id] = document.getElementById(id);
  },
  get(id) {
    return this.els[id] || null;
  }
};

// ---------- Site ----------
// Compact top section: favicon + domain + page title + HTTPS badge.
// Single active-tab query; pure display, never triggers a scan.
const Site = {
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

  setFavicon(favIconUrl) {
    const img = Elements.get("siteFavicon");
    const fallback = Elements.get("siteFallback");
    if (!img || !fallback) return;
    if (typeof favIconUrl === "string" && favIconUrl.length > 0) {
      img.onerror = () => {
        img.hidden = true;
        img.removeAttribute("src");
        fallback.style.display = "";
      };
      img.hidden = false;
      fallback.style.display = "none";
      img.src = favIconUrl;
    } else {
      img.hidden = true;
      img.removeAttribute("src");
      fallback.style.display = "";
    }
  },

  setHttps(url) {
    const badge = Elements.get("httpsBadge");
    if (!badge) return;
    let protocol = "";
    try {
      protocol = new URL(url).protocol || "";
    } catch {
      protocol = "";
    }
    const LOCK =
      '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" stroke-width="1.5"/></svg>';
    const WARN =
      '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8 2 14.5 13.5h-13L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><line x1="8" y1="6.5" x2="8" y2="9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.9" fill="currentColor"/></svg>';
    if (protocol === "https:") {
      badge.className = "https is-secure";
      badge.title = "Secure HTTPS connection";
      badge.innerHTML = `${LOCK}<span>Secure</span>`;
    } else if (protocol === "http:") {
      badge.className = "https is-insecure";
      badge.title = "Not secure — plain HTTP";
      badge.innerHTML = `${WARN}<span>Not secure</span>`;
    } else {
      badge.className = "https is-na";
      badge.title = "Local or browser page";
      badge.textContent = "Local page";
    }
  },

  async resolve() {
    const domain = Elements.get("domainName");
    const title = Elements.get("pageTitle");
    const tab = await this.getActiveTab();
    if (!tab?.url) {
      if (domain) {
        domain.textContent = "unknown site";
        domain.title = "Current site";
      }
      if (title) {
        title.textContent = "";
        title.title = "";
      }
      this.setFavicon("");
      this.setHttps("");
      return tab;
    }
    let hostname = "unknown site";
    try {
      hostname = new URL(tab.url).hostname || "unknown site";
    } catch {
      /* keep fallback */
    }
    if (domain) {
      domain.textContent = hostname;
      domain.title = tab.url;
    }
    const pageTitle = typeof tab.title === "string" ? tab.title.trim() : "";
    if (title) {
      title.textContent = pageTitle;
      title.title = pageTitle;
    }
    this.setFavicon(tab.favIconUrl || "");
    this.setHttps(tab.url);
    return tab;
  }
};

// Back-compat alias (Domain -> Site).
const Domain = Site;

// ---------- Status ----------
const Status = {
  set(next) {
    Store.status = next;
    const btn = Elements.get("scanBtn");
    const label = Elements.get("scanBtnLabel");

    if (next === "scanning") {
      if (label) label.textContent = "Scanning…";
      if (btn) {
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
      }
    } else {
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
      }
      if (label) {
        if (next === "error") label.textContent = "Retry Scan";
        else if (Store.technologies.length > 0) label.textContent = "Scan Again";
        else label.textContent = "Scan Website";
      }
    }
    // Keep the count subtitle in sync (e.g. button-only transitions).
    try {
      Results.updateSubtitle(Results.lastVisibleCount ?? Store.technologies.length);
    } catch {
      /* subtitle optional */
    }
  }
};

// ---------- CategoryFilters ----------
// Simplified UI taxonomy (8 pills) mapped onto canonical categories.
// Instant client-side filtering only — never triggers a rescan.
const CategoryFilters = {
  FILTER_MAP: {
    All: null,
    Frameworks: ["Frameworks"],
    CMS: ["CMS"],
    Analytics: ["Analytics"],
    WordPress: ["WordPress"],
    Fonts: ["Fonts"],
    Infrastructure: ["CDN", "Hosting", "Web Server", "Security"]
    // Other is handled as catch-all negation in matches().
  },

  isActive() {
    return Store.activeCategory && Store.activeCategory !== "All";
  },

  matches(tech) {
    const active = Store.activeCategory || "All";
    if (active === "All") return true;
    const category = tech.category || "Other";
    if (active === "Other") {
      // Catch-all: anything not covered by the 6 explicit buckets.
      const covered = new Set();
      for (const [key, cats] of Object.entries(this.FILTER_MAP)) {
        if (key === "All") continue;
        for (const c of cats || []) covered.add(c);
      }
      return !covered.has(category);
    }
    const allowed = this.FILTER_MAP[active];
    if (!allowed) return true;
    return allowed.includes(category);
  },

  init() {
    const bar = Elements.get("categoryFilters");
    if (!bar) return;
    bar.addEventListener("click", (e) => {
      const btn = e.target?.closest?.('[data-filter]');
      if (!btn || !bar.contains(btn)) return;
      this.set(btn.dataset.filter);
    });
  },

  set(next) {
    if (!next) return;
    Store.activeCategory = next;
    this.syncUI();
    Results.render();
  },

  syncUI() {
    const bar = Elements.get("categoryFilters");
    if (!bar) return;
    const buttons = bar.querySelectorAll("[data-filter]");
    for (const btn of buttons) {
      const on = btn.dataset.filter === Store.activeCategory;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  },

  reset() {
    Store.activeCategory = "All";
    this.syncUI();
  }
};

// ---------- Results ----------
const Results = {
  lastVisibleCount: 0,
  render() {
    const list = Elements.get("resultsList");
    const empty = Elements.get("emptyState");
    const loading = Elements.get("loadingState");
    if (!list || !empty || !loading) return;

    const query = Store.filter.trim().toLowerCase();
    const categoryActive = CategoryFilters.isActive();
    const items = Store.technologies.filter((t) => {
      if (!CategoryFilters.matches(t)) return false;
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

    empty.hidden = isScanning || items.length > 0 || query.length > 0 || categoryActive;
    list.hidden = isScanning || items.length === 0;

    list.innerHTML = "";
    for (const grp of this.groupItems(items)) {
      list.appendChild(this.groupHeader(grp));
      for (const tech of grp.items) list.appendChild(this.row(tech));
    }

    this.updateSubtitle(items.length);
    this.updateNoMatch(items.length, query);
  },

  groupItems(items) {
    try {
      const api = window.WebLensCategories;
      if (api && typeof api.group === "function") return api.group(items);
    } catch {
      /* fall through to single group */
    }
    return items.length > 0 ? [{ name: "Technologies", count: items.length, items }] : [];
  },

  groupHeader(grp) {
    const h = document.createElement("div");
    h.className = "cat-header";
    const name = document.createElement("span");
    name.className = "cat-name";
    name.textContent = grp.name;
    const count = document.createElement("span");
    count.className = "cat-count";
    count.textContent = String(grp.count);
    count.title = `${grp.count} detected`;
    h.append(name, count);
    return h;
  },

  // Human-readable evidence sentence, e.g. "Detected from page globals and scripts."
  evidenceSentence(detectedBy) {
    const LABELS = {
      global: "page globals",
      "script-url": "scripts",
      "stylesheet-url": "stylesheets",
      meta: "meta tags",
      dom: "DOM signals",
      cookie: "cookies",
      html: "page markup"
    };
    const parts = [...new Set(detectedBy || [])]
      .map((k) => LABELS[k])
      .filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return `Detected from ${parts[0]}.`;
    return `Detected from ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`;
  },

  iconFor(category) {
    try {
      const api = window.WebLensIcons;
      if (api && typeof api.svgFor === "function") return api.svgFor(category || "Other");
    } catch {
      /* fall through to empty */
    }
    return "";
  },

  row(tech) {
    const li = document.createElement("div");
    li.className = "tech";

    const icon = document.createElement("span");
    icon.className = "tech-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = this.iconFor(tech.category);

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
      const globe = document.createElement("span");
      globe.className = "ext-link";
      globe.setAttribute("aria-hidden", "true");
      try {
        const api = window.WebLensIcons;
        if (api && typeof api.extLink === "function") globe.innerHTML = api.extLink();
      } catch {
        /* icon optional */
      }
      name.appendChild(globe);
    } else {
      name.textContent = tech.name;
      if (tech.description) name.title = tech.description;
    }

    const conf = document.createElement("span");
    conf.className = `conf conf-${tech.confidence || "low"}`;
    conf.textContent = tech.confidence || "low";
    conf.title = `Confidence: ${tech.confidence || "low"} (${(tech.detectedBy || []).join(", ") || "n/a"})`;

    topRow.append(name, conf);

    meta.appendChild(topRow);

    if (tech.description) {
      const desc = document.createElement("span");
      desc.className = "tech-desc";
      desc.textContent = tech.description;
      desc.title = tech.description;
      meta.appendChild(desc);
    }

    const evidence = this.evidenceSentence(tech.detectedBy);
    if (evidence) {
      const ev = document.createElement("span");
      ev.className = "tech-evidence";
      ev.textContent = evidence;
      meta.appendChild(ev);
    }

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

    li.append(icon, meta);

    if (tech.version) {
      const ver = document.createElement("span");
      ver.className = "tech-ver";
      ver.textContent = `v${tech.version}`;
      ver.title = `Version ${tech.version}`;
      li.append(ver);
    }
    return li;
  },

  updateSubtitle(n) {
    this.lastVisibleCount = n;
    const sub = Elements.get("siteSubtitle");
    if (!sub) return;
    if (Store.status === "scanning") {
      sub.textContent = "Scanning…";
      return;
    }
    if (Store.status === "error") {
      sub.textContent = Store.notice || "Scan failed";
      return;
    }
    if (Store.technologies.length === 0) {
      sub.textContent = "Ready to scan";
      return;
    }
    if (n === 0) {
      sub.textContent = "No matches for current filters";
      return;
    }
    sub.textContent =
      n === 1 ? "1 technology detected" : `${n} technologies detected`;
  },

  updateNoMatch(visibleCount, query) {
    const noMatch = Elements.get("noMatch");
    const q = Elements.get("noMatchQuery");
    const f = Elements.get("noMatchFilter");
    if (!noMatch) return;
    const hasQuery = query.length > 0;
    const hasCategory = CategoryFilters.isActive();
    const show =
      visibleCount === 0 &&
      Store.technologies.length > 0 &&
      (hasQuery || hasCategory) &&
      Store.status !== "scanning";
    noMatch.hidden = !show;
    if (!show) return;
    if (q) q.textContent = hasQuery ? Store.filter.trim() : "all technologies";
    if (f) {
      if (hasQuery && hasCategory) f.textContent = ` in ${Store.activeCategory}`;
      else if (hasCategory) f.textContent = ` in ${Store.activeCategory}`;
      else f.textContent = "";
    }
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
    const clearBtn = Elements.get("clearFiltersBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.clear();
        CategoryFilters.reset();
        Results.render();
        if (input) input.focus();
      });
    }
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
    CategoryFilters.reset();
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
  CategoryFilters.syncUI();
  Search.init();
  CategoryFilters.init();
  Domain.resolve();

  const btn = Elements.get("scanBtn");
  if (btn) btn.addEventListener("click", () => Actions.onScanRequested());
});
