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
 *   Detail   -> in-popup technology detail view (open / close / fill)
 *   Search   -> client-side filter
 *   Export   -> local-only copy results + JSON download (no network)
 *   History  -> local scan history in chrome.storage.local (never uploaded)
 *   Scanner  -> MAIN probe + content-script messaging (no backend)
 *   Actions  -> Scan button handler
 */

// ---------- Store ----------
const Store = {
  status: "idle", // idle | scanning | done | error
  technologies: [],
  filter: "",
  activeCategory: "All", // All | Frameworks | CMS | Analytics | WordPress | Fonts | Infrastructure | Other
  selectedSlug: null, // slug of technology shown in the detail view, or null
  viewingHistoryId: null, // id of open history snapshot, or null for live results
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
      "clearFiltersBtn",
      "detailView",
      "backBtn",
      "detailIcon",
      "detailName",
      "detailConf",
      "detailVer",
      "detailCategory",
      "detailDescWrap",
      "detailDesc",
      "detailReason",
      "detailWpWrap",
      "detailWp",
      "detailWebsite",
      "exportBar",
      "copyBtn",
      "exportJsonBtn",
      "exportStatus",
      "historySection",
      "historyToggle",
      "historyCount",
      "historyBody",
      "historyBanner",
      "historyBannerText",
      "historyBackBtn",
      "historyList",
      "historyEmpty",
      "clearHistoryBtn",
      "historyStatus"
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

// ---------- Detail ----------
// In-popup technology detail view. Pure client-side overlay of the list:
// open(slug) fills the panel from Store.technologies, close() restores
// the filtered list with scroll + focus preserved. Never rescans.
const Detail = {
  _returnFocus: null,
  _returnScroll: 0,

  isOpen() {
    return Store.selectedSlug !== null;
  },

  find(slug) {
    return (Store.technologies || []).find((t) => t.slug === slug) || null;
  },

  init() {
    const back = Elements.get("backBtn");
    if (back) back.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) {
        e.preventDefault();
        this.close();
      }
    });
  },

  open(slug) {
    const tech = this.find(slug);
    if (!tech) return;
    const view = Elements.get("detailView");
    if (!view) return;
    // Remember where to return: focused row + scroll position.
    this._returnFocus = document.activeElement;
    const scroller = view.closest(".content");
    this._returnScroll = scroller ? scroller.scrollTop : 0;
    Store.selectedSlug = slug;
    this.fill(tech);
    Results.render();
    const back = Elements.get("backBtn");
    if (back) back.focus();
  },

  closeSilent() {
    Store.selectedSlug = null;
    this._returnFocus = null;
  },

  close() {
    const view = Elements.get("detailView");
    const returnFocus = this._returnFocus;
    const returnScroll = this._returnScroll || 0;
    Store.selectedSlug = null;
    this._returnFocus = null;
    this._returnScroll = 0;
    Results.render();
    // Restore scroll + focus to the originating row when possible.
    try {
      const scroller = view?.closest(".content");
      if (scroller) scroller.scrollTop = returnScroll;
    } catch {
      /* scroll restore optional */
    }
    try {
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    } catch {
      /* focus restore optional */
    }
  },

  fill(tech) {
    const icon = Elements.get("detailIcon");
    if (icon) {
      let glyph = "";
      try {
        if (tech.logo) {
          glyph = `<img src="${tech.logo}" alt="" width="20" height="20" />`;
        } else {
          glyph = Results.iconFor(tech.category);
        }
      } catch {
        glyph = "";
      }
      icon.innerHTML = glyph;
    }
    const name = Elements.get("detailName");
    if (name) {
      name.textContent = tech.name;
      name.title = tech.description || tech.name;
    }
    const conf = Elements.get("detailConf");
    if (conf) {
      const level = tech.confidence || "low";
      conf.className = `conf conf-${level}`;
      conf.textContent = level;
      conf.title = `Confidence: ${level} (${(tech.detectedBy || []).join(", ") || "n/a"}) · score ${typeof tech.score === "number" ? tech.score : "n/a"}`;
    }
    const ver = Elements.get("detailVer");
    if (ver) {
      if (tech.version) {
        ver.hidden = false;
        ver.textContent = `v${tech.version}`;
        ver.title = `Version ${tech.version}`;
      } else {
        ver.hidden = true;
        ver.textContent = "";
      }
    }
    const cat = Elements.get("detailCategory");
    if (cat) cat.textContent = tech.category || "Other";
    const descWrap = Elements.get("detailDescWrap");
    const desc = Elements.get("detailDesc");
    if (desc) desc.textContent = tech.description || "No description available.";
    if (descWrap) descWrap.hidden = false;
    const reason = Elements.get("detailReason");
    if (reason) {
      let sentence = "";
      try {
        sentence = Results.evidenceSentence(tech.detectedBy);
      } catch {
        sentence = "";
      }
      reason.textContent =
        sentence || "Signals matched this technology's detection rules.";
    }
    // WordPress extras (theme / plugins) when present.
    const wpWrap = Elements.get("detailWpWrap");
    const wp = Elements.get("detailWp");
    if (wpWrap && wp) {
      const parts = [];
      try {
        if (tech.slug === "wordpress" && tech.details) {
          const { theme, plugins } = tech.details;
          if (theme?.name) parts.push(`Theme: ${theme.name}`);
          if (Array.isArray(plugins) && plugins.length > 0) {
            parts.push(`Plugins: ${plugins.map((p) => p.name).join(", ")}`);
          }
        }
      } catch {
        /* extras optional */
      }
      if (parts.length > 0) {
        wpWrap.hidden = false;
        wp.textContent = parts.join(" · ");
      } else {
        wpWrap.hidden = true;
        wp.textContent = "";
      }
    }
    const site = Elements.get("detailWebsite");
    if (site) {
      if (tech.website) {
        site.hidden = false;
        site.href = tech.website;
        site.title = tech.description || tech.website;
      } else {
        site.hidden = true;
        site.removeAttribute("href");
      }
    }
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
    const detailView = Elements.get("detailView");
    const noMatch = Elements.get("noMatch");

    // Detail view takes over the content area; list states stay hidden.
    if (Store.selectedSlug !== null) {
      const tech = Detail.find(Store.selectedSlug);
      if (tech && detailView) {
        Detail.fill(tech);
        loading.hidden = true;
        empty.hidden = true;
        list.hidden = true;
        if (noMatch) noMatch.hidden = true;
        detailView.hidden = false;
        this.updateSubtitle(items.length);
        try {
          Export.sync();
        } catch {
          /* export bar optional */
        }
        try {
          History.syncBanner();
        } catch {
          /* history banner optional */
        }
        return;
      }
      // Selection no longer exists (rescan / new data) — fall back to list.
      Store.selectedSlug = null;
    }
    if (detailView) detailView.hidden = true;
    loading.hidden = !isScanning;

    // Empty state doubles as error/unsupported notice.
    const emptyTitle = empty.querySelector(".state-title");
    const emptySub = empty.querySelector(".state-sub");
    if (Store.status === "error" && Store.notice) {
      if (emptyTitle) emptyTitle.textContent = "Scan unavailable";
      if (emptySub) emptySub.textContent = Store.notice;
    } else {
      if (emptyTitle) emptyTitle.textContent = "Ready to inspect this website";
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
    try {
      Export.sync();
    } catch {
      /* export bar optional */
    }
    try {
      History.syncBanner();
    } catch {
      /* history banner optional */
    }
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
    li.setAttribute("role", "button");
    li.setAttribute("tabindex", "0");
    li.dataset.slug = tech.slug;
    li.setAttribute("aria-label", `View ${tech.name} details`);
    li.title = `View ${tech.name} details`;

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

    const chev = document.createElement("span");
    chev.className = "tech-chev";
    chev.setAttribute("aria-hidden", "true");
    chev.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    li.append(chev);

    // Whole row opens the detail view; the inline website link keeps
    // working and must not trigger the detail view.
    li.addEventListener("click", (e) => {
      const anchor = e.target?.closest?.("a");
      if (anchor && li.contains(anchor)) return;
      Detail.open(tech.slug);
    });
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const anchor = e.target?.closest?.("a");
        if (anchor && li.contains(anchor)) return;
        e.preventDefault();
        Detail.open(tech.slug);
      }
    });
    return li;
  },

  updateSubtitle(n) {
    this.lastVisibleCount = n;
    const sub = Elements.get("siteSubtitle");
    if (!sub) return;
    if (Store.status === "scanning") {
      sub.textContent = "Scanning website...";
      return;
    }
    if (Store.status === "error") {
      sub.textContent = Store.notice || "Scan failed";
      return;
    }
    if (Store.technologies.length === 0) {
      sub.textContent = "Ready to inspect this website";
      return;
    }
    if (n === 0) {
      sub.textContent = "No matches for current filters";
      return;
    }
    const base =
      n === 1 ? "1 technology detected" : `${n} technologies detected`;
    sub.textContent = Store.viewingHistoryId ? `History · ${base}` : base;
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

// ---------- Export ----------
// Local-only export: copy formatted results to clipboard + download JSON.
// No network involved — clipboard writes and Blob downloads only.
const Export = {
  _statusTimer: null,

  init() {
    const copy = Elements.get("copyBtn");
    if (copy) copy.addEventListener("click", () => this.copy());
    const json = Elements.get("exportJsonBtn");
    if (json) json.addEventListener("click", () => this.downloadJson());
  },

  domain() {
    const label = Elements.get("domainName");
    const text = label ? label.textContent.trim() : "";
    return text && text !== "…" ? text : "unknown site";
  },

  pageUrl() {
    const label = Elements.get("domainName");
    return (label && label.title) || "";
  },

  pageTitle() {
    const el = Elements.get("pageTitle");
    return el ? el.textContent.trim() : "";
  },

  formatText() {
    const lines = [`Website: ${this.domain()}`, "", "Technologies:", ""];
    for (const t of Store.technologies || []) lines.push(`* ${t.name}`);
    return lines.join("\n");
  },

  buildJson() {
    return {
      website: this.domain(),
      url: this.pageUrl(),
      pageTitle: this.pageTitle(),
      scannedAt: new Date().toISOString(),
      count: (Store.technologies || []).length,
      technologies: (Store.technologies || []).map((t) => {
        const entry = {
          slug: t.slug,
          name: t.name,
          category: t.category || "Other",
          description: t.description || "",
          confidence: t.confidence || "low",
          score: typeof t.score === "number" ? t.score : null,
          detectedBy: t.detectedBy || [],
          website: t.website || null,
          version: t.version || null
        };
        if (t.details) entry.details = t.details;
        return entry;
      })
    };
  },

  setStatus(text, ok) {
    const el = Elements.get("exportStatus");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-ok", !!ok);
    if (this._statusTimer !== null) clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(() => {
      const cur = Elements.get("exportStatus");
      if (cur && cur.textContent === text) {
        cur.textContent = "";
        cur.classList.remove("is-ok");
      }
    }, 2500);
  },

  async copyFallback(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      const done = document.execCommand("copy");
      if (!done) throw new Error("execCommand copy failed");
    } finally {
      ta.remove();
    }
  },

  async copy() {
    if (Store.status !== "done" || (Store.technologies || []).length === 0) return;
    const text = this.formatText();
    const btn = Elements.get("copyBtn");
    const restore = btn ? btn.textContent : "";
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        await this.copyFallback(text);
      }
      if (btn) btn.textContent = "Copied ✓";
      this.setStatus("Copied to clipboard", true);
    } catch (err) {
      console.warn("[WebLens] Copy failed:", err);
      try {
        await this.copyFallback(text);
        if (btn) btn.textContent = "Copied ✓";
        this.setStatus("Copied to clipboard", true);
      } catch (fallbackErr) {
        console.warn("[WebLens] Copy fallback failed:", fallbackErr);
        this.setStatus("Copy failed — select manually", false);
      }
    }
    if (btn) setTimeout(() => { if (btn.textContent !== restore) btn.textContent = restore; }, 2000);
  },

  downloadJson() {
    if (Store.status !== "done" || (Store.technologies || []).length === 0) return;
    try {
      const json = JSON.stringify(this.buildJson(), null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe = this.domain().toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "site";
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
      a.href = url;
      a.download = `weblens-${safe}-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      this.setStatus("Downloaded JSON", true);
    } catch (err) {
      console.warn("[WebLens] JSON export failed:", err);
      this.setStatus("Export failed", false);
    }
  },

  sync() {
    const bar = Elements.get("exportBar");
    if (!bar) return;
    const show =
      Store.status === "done" &&
      (Store.technologies || []).length > 0 &&
      Store.selectedSlug === null;
    bar.hidden = !show;
  }
};

// ---------- History ----------
// Local scan history. Stored ONLY in chrome.storage.local under a single
// key — never sent anywhere (no fetch/XHR in this file). Newest first,
// capped at MAX entries with oldest pruned.
const History = {
  KEY: "weblens.history.v1",
  MAX: 20,
  _entries: [],
  _expanded: false,

  available() {
    try {
      return !!(chrome?.storage?.local?.get && chrome?.storage?.local?.set);
    } catch {
      return false;
    }
  },

  makeId() {
    try {
      if (crypto?.randomUUID) return crypto.randomUUID();
    } catch {
      /* fall through */
    }
    return `scan-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  },

  formatDate(iso) {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso || "");
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return String(iso || "");
    }
  },

  async init() {
    const section = Elements.get("historySection");
    if (!section) return;
    if (!this.available()) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    const toggle = Elements.get("historyToggle");
    if (toggle) toggle.addEventListener("click", () => this.toggle());
    const back = Elements.get("historyBackBtn");
    if (back) back.addEventListener("click", () => this.backToLive());
    const clear = Elements.get("clearHistoryBtn");
    if (clear) clear.addEventListener("click", () => this.clear());
    await this.load();
  },

  toggle() {
    this._expanded = !this._expanded;
    const body = Elements.get("historyBody");
    const toggle = Elements.get("historyToggle");
    if (body) body.hidden = !this._expanded;
    if (toggle) toggle.setAttribute("aria-expanded", this._expanded ? "true" : "false");
  },

  async load() {
    if (!this.available()) return [];
    try {
      const res = await chrome.storage.local.get(this.KEY);
      const list = res?.[this.KEY];
      this._entries = Array.isArray(list) ? list : [];
    } catch (err) {
      console.warn("[WebLens] History load failed:", err);
      this._entries = [];
    }
    this.render();
    return this._entries;
  },

  async persist() {
    await chrome.storage.local.set({ [this.KEY]: this._entries.slice(0, this.MAX) });
  },

  // Fire-and-forget from the scan success path — never blocks rendering.
  save(entry) {
    if (!this.available()) return;
    try {
      this._entries = [entry, ...this._entries].slice(0, this.MAX);
      this.render();
      this.persist().catch((err) => {
        // Quota pressure: drop oldest and retry once, else warn only.
        console.warn("[WebLens] History persist failed, pruning:", err);
        try {
          this._entries = this._entries.slice(0, Math.max(1, this.MAX - 5));
          this.render();
          this.persist().catch((retryErr) => {
            console.warn("[WebLens] History persist retry failed:", retryErr);
          });
        } catch {
          /* storage must never break scanning */
        }
      });
    } catch (err) {
      console.warn("[WebLens] History save failed:", err);
    }
  },

  snapshot(domain, url, pageTitle, technologies) {
    return {
      id: this.makeId(),
      domain: domain || "unknown site",
      url: url || "",
      pageTitle: pageTitle || "",
      scannedAt: new Date().toISOString(),
      count: (technologies || []).length,
      technologies: Array.isArray(technologies) ? technologies : []
    };
  },

  open(id) {
    const entry = this._entries.find((e) => e.id === id);
    if (!entry) return;
    Detail.closeSilent();
    Search.clear();
    CategoryFilters.reset();
    Store.notice = "";
    Store.technologies = Array.isArray(entry.technologies) ? entry.technologies : [];
    Store.viewingHistoryId = entry.id;
    Store.status = "done";
    try {
      Status.set("done");
    } catch {
      /* subtitle sync optional */
    }
    Results.render();
    this.syncBanner();
  },

  backToLive() {
    if (!Store.viewingHistoryId) return;
    Store.viewingHistoryId = null;
    Detail.closeSilent();
    Search.clear();
    CategoryFilters.reset();
    Store.notice = "";
    Store.technologies = [];
    try {
      Status.set("idle");
    } catch {
      Store.status = "idle";
    }
    Results.render();
    this.syncBanner();
  },

  async clear() {
    if (!this.available()) return;
    const wasViewing = !!Store.viewingHistoryId;
    try {
      await chrome.storage.local.remove(this.KEY);
    } catch (err) {
      console.warn("[WebLens] History clear failed:", err);
      this.setStatus("Clear failed", false);
      return;
    }
    this._entries = [];
    if (wasViewing) {
      Store.viewingHistoryId = null;
      Detail.closeSilent();
      Store.technologies = [];
      Store.notice = "";
      try {
        Status.set("idle");
      } catch {
        Store.status = "idle";
      }
    }
    this.render();
    Results.render();
    this.setStatus("History cleared", true);
  },

  setStatus(text, ok) {
    const el = Elements.get("historyStatus");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-ok", !!ok);
    setTimeout(() => {
      const cur = Elements.get("historyStatus");
      if (cur && cur.textContent === text) {
        cur.textContent = "";
        cur.classList.remove("is-ok");
      }
    }, 2500);
  },

  syncBanner() {
    const banner = Elements.get("historyBanner");
    const text = Elements.get("historyBannerText");
    if (!banner) return;
    const entry = Store.viewingHistoryId
      ? this._entries.find((e) => e.id === Store.viewingHistoryId)
      : null;
    if (!entry) {
      banner.hidden = true;
      if (text) text.textContent = "";
      return;
    }
    banner.hidden = false;
    if (text) text.textContent = `${entry.domain} · ${this.formatDate(entry.scannedAt)} · ${entry.count} tech`;
  },

  render() {
    const count = Elements.get("historyCount");
    if (count) count.textContent = String(this._entries.length);
    const list = Elements.get("historyList");
    const empty = Elements.get("historyEmpty");
    const clear = Elements.get("clearHistoryBtn");
    if (!list) return;
    list.innerHTML = "";
    const has = this._entries.length > 0;
    if (empty) empty.hidden = has;
    if (clear) clear.disabled = !has;
    for (const entry of this._entries) {
      const li = document.createElement("li");
      li.className = "history-item";

      const main = document.createElement("button");
      main.type = "button";
      main.className = "history-open";
      const title = document.createElement("span");
      title.className = "history-domain";
      title.textContent = entry.domain || "unknown site";
      title.title = entry.url || entry.domain || "";
      const meta = document.createElement("span");
      meta.className = "history-meta";
      const n = typeof entry.count === "number" ? entry.count : (entry.technologies || []).length;
      meta.textContent = `${this.formatDate(entry.scannedAt)} · ${n} tech`;
      main.append(title, meta);
      const label = `${entry.domain}, ${this.formatDate(entry.scannedAt)}, ${n} technologies. Open this scan.`;
      main.setAttribute("aria-label", label);
      if (Store.viewingHistoryId === entry.id) {
        main.classList.add("is-viewing");
        main.setAttribute("aria-current", "true");
      }
      main.addEventListener("click", () => this.open(entry.id));

      li.appendChild(main);
      list.appendChild(li);
    }
    this.syncBanner();
  }
};

// ---------- Scanner (real detection path) ----------
const Scanner = {
  SCAN_TIMEOUT_MS: 15000,

  isScannable(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url);
  },

  withTimeout(promise, ms, message) {
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => {
      if (timer !== null) clearTimeout(timer);
    });
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
    const resp = await this.withTimeout(
      chrome.tabs.sendMessage(tab.id, {
        type: "WEBLENS_SCAN",
        mainGlobals
      }),
      this.SCAN_TIMEOUT_MS,
      "Scan timed out. Reload the page and retry."
    );
    if (!resp) throw new Error("No response from page. Reload the page and retry.");
    if (!resp.ok) throw new Error(resp.error || "Page scan failed.");
    return Array.isArray(resp.technologies) ? resp.technologies : [];
  }
};

// ---------- Actions ----------
const Actions = {
  _scanSeq: 0,
  async onScanRequested() {
    if (Store.status === "scanning") return;
    const scanId = ++this._scanSeq;
    const isCurrent = () => scanId === this._scanSeq;
    Detail.closeSilent();
    Store.viewingHistoryId = null;
    Search.clear();
    CategoryFilters.reset();
    Store.notice = "";
    Store.technologies = [];
    Status.set("scanning");
    Results.render();
    try {
      const technologies = await Scanner.scanActiveTab();
      if (!isCurrent()) return; // a newer scan superseded this one
      Store.technologies = technologies;
      Store.notice = "";
      Status.set("done");
      console.log(`[WebLens] Scan done: ${technologies.length} technologies.`);
      // Persist successful scans only — fire-and-forget, never blocks UI.
      try {
        const domainEl = Elements.get("domainName");
        const titleEl = Elements.get("pageTitle");
        History.save(
          History.snapshot(
            domainEl ? domainEl.textContent.trim() : "unknown site",
            domainEl ? domainEl.title || "" : "",
            titleEl ? titleEl.textContent.trim() : "",
            technologies
          )
        );
      } catch (histErr) {
        console.warn("[WebLens] History save failed:", histErr);
      }
    } catch (err) {
      if (!isCurrent()) return; // stale failure must not overwrite a newer scan
      Store.technologies = [];
      Store.notice = err?.message || "Scan failed.";
      Status.set("error");
      console.warn("[WebLens] Scan failed:", err);
    } finally {
      // Guarantee the UI always leaves the loading state, even if
      // Status.set or render throws unexpectedly.
      if (isCurrent() && Store.status === "scanning") {
        try {
          Status.set("error");
        } catch {
          Store.status = "error";
        }
      }
      try {
        Results.render();
      } catch (renderErr) {
        console.warn("[WebLens] Results.render failed:", renderErr);
      }
    }
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
  Detail.init();
  Export.init();
  History.init();
  Domain.resolve();

  const btn = Elements.get("scanBtn");
  if (btn) btn.addEventListener("click", () => Actions.onScanRequested());
});
