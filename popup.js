/**
 * WebLens — popup.js
 * Popup UI controller + scan orchestration (detection engine v1).
 * Simplified for general users: manual scan, single status line,
 * plain-language results (name + type + version), slim detail view.
 *
 * Modules:
 *   Store    -> { status, technologies[], filter, activeCategory, notice }
 *   Elements -> DOM cache
 *   Site     -> active-tab favicon + domain display
 *   Status   -> idle | scanning | done | error (single CTA + status line)
 *   Results  -> render structured technologies [{name,category,description,
 *               version,website,slug}]
 *   Detail   -> in-popup technology detail view (open / close / fill)
 *   Search   -> client-side filter (visible only with results)
 *   Export   -> local-only copy results + JSON download (no network)
 *   Settings -> local theme setting (never uploaded)
 *   Scanner  -> MAIN probe + content-script messaging (no backend)
 *   Actions  -> Scan button handler
 */

// ---------- Store ----------
const Store = {
  status: "idle", // idle | scanning | done | error
  technologies: [],
  filter: "",
  activeCategory: "All", // All | CMS | Frameworks | Analytics | Other
  selectedSlug: null, // slug of technology shown in the detail view, or null
  notice: "" // e.g. "Cannot scan this page" / error text
};

// ---------- Elements ----------
const Elements = {
  els: {},
  cache() {
    const ids = [
      "domainName",
      "siteSubtitle",
      "siteFavicon",
      "siteFallback",
      "rescanBtn",
      "scanBtn",
      "scanBtnLabel",
      "toolbar",
      "searchInput",
      "categoryFilters",
      "loadingState",
      "emptyState",
      "emptyRetryBtn",
      "resultsList",
      "noMatch",
      "noMatchQuery",
      "noMatchFilter",
      "clearFiltersBtn",
      "detailView",
      "backBtn",
      "detailIcon",
      "detailName",
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
      "settingsSection",
      "settingsToggle",
      "settingsBody",
      "themeSelect",
      "aboutVersion"
    ];
    for (const id of ids) this.els[id] = document.getElementById(id);
  },
  get(id) {
    return this.els[id] || null;
  }
};

// ---------- Site ----------
// Compact top section: favicon + domain + single status line.
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

  async resolve() {
    const domain = Elements.get("domainName");
    const tab = await this.getActiveTab();
    if (!tab?.url) {
      if (domain) {
        domain.textContent = "unknown site";
        domain.title = "Current site";
      }
      this.setFavicon("");
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
    this.setFavicon(tab.favIconUrl || "");
    return tab;
  }
};

// Back-compat alias (Domain -> Site).
const Domain = Site;

// ---------- Status ----------
// Single CTA with two labels only (manual scan): "Scan website" / "Scanning…".
// The header re-scan icon mirrors the same state for quick re-scans.
const Status = {
  set(next) {
    Store.status = next;
    const btn = Elements.get("scanBtn");
    const label = Elements.get("scanBtnLabel");
    const rescan = Elements.get("rescanBtn");

    if (next === "scanning") {
      if (label) label.textContent = "Scanning…";
      if (btn) {
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
      }
      if (rescan) {
        rescan.hidden = true;
        rescan.disabled = true;
      }
    } else {
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
      }
      if (label) label.textContent = "Scan website";
      if (rescan) {
        const hasResults = (Store.technologies || []).length > 0;
        rescan.hidden = !(next === "done" && hasResults);
        rescan.disabled = false;
      }
    }
    // Keep the single status line in sync (e.g. button-only transitions).
    try {
      Results.updateSubtitle(Results.lastVisibleCount ?? Store.technologies.length);
    } catch {
      /* subtitle optional */
    }
  }
};

// ---------- CategoryFilters ----------
// Small fixed taxonomy (5 pills max) mapped onto canonical categories.
// WordPress counts as CMS; Fonts / CDN / Hosting / servers count as Other.
// Pills render only when results exist, and only for categories present.
// Instant client-side filtering only — never triggers a rescan.
const CategoryFilters = {
  FILTER_MAP: {
    All: null,
    CMS: ["CMS", "WordPress"],
    Frameworks: ["Frameworks"],
    Analytics: ["Analytics"]
    // Other is handled as catch-all negation in matches().
  },

  isActive() {
    return Store.activeCategory && Store.activeCategory !== "All";
  },

  // Canonical category -> simplified pill bucket.
  bucketOf(category) {
    if (category === "CMS" || category === "WordPress") return "CMS";
    if (category === "Frameworks") return "Frameworks";
    if (category === "Analytics") return "Analytics";
    return "Other";
  },

  // Buckets present in the current result set (for dynamic pills).
  visibleBuckets() {
    const seen = new Set();
    for (const t of Store.technologies || []) seen.add(this.bucketOf(t.category || "Other"));
    return ["All", "CMS", "Frameworks", "Analytics", "Other"].filter(
      (b) => b === "All" || seen.has(b)
    );
  },

  matches(tech) {
    const active = Store.activeCategory || "All";
    if (active === "All") return true;
    return this.bucketOf(tech.category || "Other") === active;
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
    const visible = new Set(this.visibleBuckets());
    const buttons = bar.querySelectorAll("[data-filter]");
    for (const btn of buttons) {
      const bucket = btn.dataset.filter;
      btn.hidden = !visible.has(bucket);
      const on = bucket === Store.activeCategory;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  },

  reset() {
    Store.activeCategory = "All";
    this.syncUI();
  }
};

// ---------- Toolbar ----------
// Search + filters are progressive disclosure: hidden until results exist,
// so first-run users face one CTA, not pills + search + settings.
const Toolbar = {
  sync() {
    const hasResults =
      Store.status === "done" && (Store.technologies || []).length > 0;
    const toolbar = Elements.get("toolbar");
    const bar = Elements.get("categoryFilters");
    if (toolbar) toolbar.hidden = !hasResults;
    if (bar) {
      bar.hidden = !hasResults;
      if (hasResults) CategoryFilters.syncUI();
    }
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

  // Plain-language evidence for general users (no channel codes/scores).
  plainEvidence(detectedBy) {
    const MAP = {
      global: "page code",
      "script-url": "page code",
      html: "page code",
      "stylesheet-url": "page styles",
      meta: "site settings",
      dom: "page structure",
      cookie: "cookies"
    };
    const parts = [...new Set((detectedBy || []).map((k) => MAP[k]).filter(Boolean))];
    if (parts.length === 0) return "";
    if (parts.length === 1) return `Found in ${parts[0]}.`;
    return `Found in ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`;
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
        sentence = this.plainEvidence(tech.detectedBy);
      } catch {
        sentence = "";
      }
      reason.textContent =
        sentence || "Matched this technology's signals on this page.";
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
          Toolbar.sync();
        } catch {
          /* toolbar optional */
        }
        return;
      }
      // Selection no longer exists (rescan / new data) — fall back to list.
      Store.selectedSlug = null;
    }
    if (detailView) detailView.hidden = true;
    loading.hidden = !isScanning;

    // One state at a time: error / zero-found / idle onboarding.
    const emptyTitle = empty.querySelector(".state-title");
    const emptySub = empty.querySelector(".state-sub");
    const retryBtn = Elements.get("emptyRetryBtn");
    const isError = Store.status === "error";
    const isDoneEmpty =
      Store.status === "done" && (Store.technologies || []).length === 0;
    if (isError) {
      if (emptyTitle) emptyTitle.textContent = "Couldn't scan this page";
      if (emptySub) emptySub.textContent = Store.notice || "Something went wrong.";
      if (retryBtn) retryBtn.hidden = false;
      empty.classList.add("is-error");
    } else if (isDoneEmpty) {
      if (emptyTitle) emptyTitle.textContent = "No familiar tools found";
      if (emptySub) emptySub.textContent = "This page doesn't seem to use tools we recognize.";
      if (retryBtn) retryBtn.hidden = true;
      empty.classList.remove("is-error");
    } else {
      if (emptyTitle) emptyTitle.textContent = "See what this site is built with";
      if (emptySub) emptySub.textContent = "Press Scan to check this page.";
      if (retryBtn) retryBtn.hidden = true;
      empty.classList.remove("is-error");
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
      Toolbar.sync();
    } catch {
      /* toolbar optional */
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
    // Slim single-target row: icon + name + type + optional version.
    // Details (description, evidence, links) live in the detail view.
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

    const name = document.createElement("span");
    name.className = "tech-name";
    name.textContent = tech.name;
    if (tech.description) name.title = tech.description;

    const cat = document.createElement("span");
    cat.className = "tech-category";
    cat.textContent = tech.category || "Other";

    meta.append(name, cat);
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

    li.addEventListener("click", () => Detail.open(tech.slug));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        Detail.open(tech.slug);
      }
    });
    return li;
  },

  // Single status line: one string per state, plain words.
  updateSubtitle(n) {
    this.lastVisibleCount = n;
    const sub = Elements.get("siteSubtitle");
    if (!sub) return;
    if (Store.status === "scanning") {
      sub.textContent = "Scanning…";
      return;
    }
    if (Store.status === "error") {
      sub.textContent = Store.notice || "Couldn't scan this page";
      return;
    }
    if (Store.technologies.length === 0) {
      sub.textContent = "Ready — press Scan";
      return;
    }
    if (n === 0) {
      sub.textContent = "No matches for current filters";
      return;
    }
    sub.textContent = n === 1 ? "1 tool found" : `${n} tools found`;
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
    if (q) q.textContent = hasQuery ? Store.filter.trim() : "these filters";
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
    return "";
  },

  formatText() {
    const lines = [`Website: ${this.domain()}`, "", "Tools:", ""];
    for (const t of Store.technologies || []) lines.push(`* ${t.name}`);
    return lines.join("\n");
  },

  buildJson() {
    return {
      website: this.domain(),
      url: this.pageUrl(),
      scannedAt: new Date().toISOString(),
      count: (Store.technologies || []).length,
      technologies: (Store.technologies || []).map((t) => {
        const entry = {
          slug: t.slug,
          name: t.name,
          category: t.category || "Other",
          description: t.description || "",
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

// ---------- Settings ----------
// Theme only, stored ONLY in chrome.storage.local — never sent anywhere.
const Settings = {
  KEY: "weblens.settings.v1",
  DEFAULTS: {
    theme: "system" // system | light | dark
  },
  values: null, // merged settings once loaded
  loaded: false,
  _expanded: false,
  _media: null,

  get(name) {
    if (this.values && name in this.values) return this.values[name];
    return this.DEFAULTS[name];
  },

  available() {
    try {
      return !!(chrome?.storage?.local?.get && chrome?.storage?.local?.set);
    } catch {
      return false;
    }
  },

  sanitize(raw) {
    const out = { ...this.DEFAULTS };
    if (!raw || typeof raw !== "object") return out;
    if (["system", "light", "dark"].includes(raw.theme)) out.theme = raw.theme;
    return out;
  },

  async load() {
    if (this.available()) {
      try {
        const res = await chrome.storage.local.get(this.KEY);
        this.values = this.sanitize(res?.[this.KEY]);
      } catch (err) {
        console.warn("[WebLens] Settings load failed, using defaults:", err);
        this.values = { ...this.DEFAULTS };
      }
    } else {
      this.values = { ...this.DEFAULTS };
    }
    this.loaded = true;
    this.applyAll();
    this.syncUI();
    return this.values;
  },

  async save() {
    if (!this.available()) return;
    try {
      await chrome.storage.local.set({ [this.KEY]: this.values });
    } catch (err) {
      console.warn("[WebLens] Settings save failed:", err);
    }
  },

  async set(name, value) {
    this.values = { ...(this.values || this.DEFAULTS), [name]: value };
    this.applyAll();
    this.syncUI();
    await this.save();
  },

  applyAll() {
    this.applyTheme();
  },

  applyTheme() {
    const root = document.documentElement;
    const mode = this.get("theme");
    // Follow the OS while "system" is selected.
    try {
      if (this._media) {
        this._media.onchange = null;
        this._media = null;
      }
      if (mode === "system" && window.matchMedia) {
        this._media = window.matchMedia("(prefers-color-scheme: dark)");
        this._media.onchange = () => this.applyTheme();
        root.dataset.theme = this._media.matches ? "dark" : "light";
        return;
      }
    } catch {
      /* matchMedia optional */
    }
    if (mode === "dark") root.dataset.theme = "dark";
    else root.removeAttribute("data-theme");
  },

  syncUI() {
    const theme = Elements.get("themeSelect");
    if (theme) theme.value = this.get("theme");
  },

  fillAbout() {
    const el = Elements.get("aboutVersion");
    if (!el) return;
    try {
      const version = chrome?.runtime?.getManifest?.().version;
      el.textContent = version ? `Version ${version}` : "Version unknown";
    } catch {
      el.textContent = "Version unknown";
    }
  },

  init() {
    const toggle = Elements.get("settingsToggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        this._expanded = !this._expanded;
        const body = Elements.get("settingsBody");
        if (body) body.hidden = !this._expanded;
        toggle.setAttribute("aria-expanded", this._expanded ? "true" : "false");
      });
    }
    const theme = Elements.get("themeSelect");
    if (theme) {
      theme.addEventListener("change", () => this.set("theme", theme.value));
    }
    this.fillAbout();
  }
};

// ---------- Scanner (real detection path) ----------
const Scanner = {
  SCAN_TIMEOUT_MS: 15000,
  PING_TIMEOUT_MS: 2500,

  // Must stay in sync with the "content_scripts" js list in manifest.json
  // (same order: signals -> detectors -> registry -> engine -> extras ->
  // normalize -> content). Used for on-demand injection on tabs that
  // pre-date install/reload, where the static content script isn't running.
  CONTENT_FILES: [
    "core/signals.js",
    "detectors/react.js",
    "detectors/nextjs.js",
    "detectors/vue.js",
    "detectors/nuxt.js",
    "detectors/angular.js",
    "detectors/svelte.js",
    "detectors/astro.js",
    "detectors/jquery.js",
    "detectors/lodash.js",
    "detectors/gsap.js",
    "detectors/threejs.js",
    "detectors/wordpress.js",
    "detectors/woocommerce.js",
    "detectors/shopify.js",
    "detectors/webflow.js",
    "detectors/wix.js",
    "detectors/squarespace.js",
    "detectors/drupal.js",
    "detectors/joomla.js",
    "detectors/ghost.js",
    "detectors/blogger.js",
    "detectors/tailwind.js",
    "detectors/bootstrap.js",
    "detectors/ga.js",
    "detectors/gtm.js",
    "detectors/clarity.js",
    "detectors/hotjar.js",
    "detectors/matomo.js",
    "detectors/google-ads.js",
    "detectors/meta-pixel.js",
    "detectors/adsense.js",
    "detectors/hubspot.js",
    "detectors/mailchimp.js",
    "detectors/intercom.js",
    "detectors/crisp.js",
    "detectors/cloudflare.js",
    "detectors/cloudflare-pages.js",
    "detectors/jsdelivr.js",
    "detectors/unpkg.js",
    "detectors/google-cdn.js",
    "detectors/cloudfront.js",
    "detectors/google-fonts.js",
    "detectors/font-awesome.js",
    "detectors/adobe-fonts.js",
    "detectors/vercel.js",
    "detectors/netlify.js",
    "detectors/github-pages.js",
    "detectors/nginx.js",
    "detectors/apache.js",
    "detectors/php.js",
    "detectors/registry.js",
    "core/engine.js",
    "core/categories.js",
    "core/icons.js",
    "core/wp-extras.js",
    "core/normalize.js",
    "content.js"
  ],

  isScannable(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url);
  },

  isReceivingEndError(err) {
    const msg = String((err && err.message) || err || "");
    return (
      msg.includes("Receiving end does not exist") ||
      msg.includes("Could not establish connection")
    );
  },

  isRestrictedError(err) {
    const msg = String((err && err.message) || err || "");
    return (
      msg.includes("Cannot access") ||
      msg.includes("chrome://") ||
      msg.includes("cannot be scripted") ||
      msg.includes("No tab with id") ||
      msg.includes("Invalid tab")
    );
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

  async ping(tabId) {
    const resp = await this.withTimeout(
      chrome.tabs.sendMessage(tabId, { type: "WEBLENS_PING" }),
      this.PING_TIMEOUT_MS,
      "ping-timeout"
    );
    if (!resp || !resp.ok) throw new Error("ping-failed");
  },

  // Tabs opened before install/update/reload have no content-script
  // listener, so sendMessage fails with "Receiving end does not exist".
  // Inject the same file stack on demand, then verify with a ping.
  async ensureContentScripts(tabId) {
    try {
      await this.ping(tabId);
      return; // static content script already running
    } catch {
      /* not injected yet — fall through to programmatic injection */
    }
    if (!chrome?.scripting?.executeScript) {
      throw new Error("WebLens isn't running on this tab yet. Reload the page and retry.");
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: this.CONTENT_FILES,
        world: "ISOLATED"
      });
    } catch (err) {
      if (this.isRestrictedError(err)) {
        throw new Error(
          "Cannot scan this page — the browser blocks extensions here. Open a regular http(s) website and retry."
        );
      }
      throw new Error("WebLens isn't running on this tab yet. Reload the page and retry.");
    }
    // Verify the fresh listener answers before the real scan runs.
    try {
      await this.ping(tabId);
    } catch {
      throw new Error("WebLens isn't running on this tab yet. Reload the page and retry.");
    }
  },

  sendScan(tabId, mainGlobals) {
    return this.withTimeout(
      chrome.tabs.sendMessage(tabId, {
        type: "WEBLENS_SCAN",
        mainGlobals
      }),
      this.SCAN_TIMEOUT_MS,
      "Scan timed out. Reload the page and retry."
    );
  },

  async scanActiveTab() {
    const tab = await Domain.getActiveTab();
    if (!tab?.id || !this.isScannable(tab.url)) {
      throw new Error("Cannot scan this page. Open a regular http(s) website and retry.");
    }
    const mainGlobals = await this.probeMainWorld(tab.id);
    let resp;
    try {
      resp = await this.sendScan(tab.id, mainGlobals);
    } catch (err) {
      // First-attempt handshake failure almost always means the content
      // script was never injected (stale tab). Inject + retry once before
      // surfacing the raw Chrome error to the user.
      if (!this.isReceivingEndError(err)) throw err;
      console.warn("[WebLens] Content script missing, injecting on demand:", err);
      await this.ensureContentScripts(tab.id);
      resp = await this.sendScan(tab.id, mainGlobals);
    }
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
      console.log(`[WebLens] Scan done: ${technologies.length} tools.`);
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
  Boot.boot();
});

const Boot = {
  async boot() {
    // Settings first so theme applies before first paint.
    try {
      await Settings.load();
    } catch (err) {
      console.warn("[WebLens] Settings init failed:", err);
    }
    Status.set("idle");
    Results.render();
    CategoryFilters.syncUI();
    Search.init();
    CategoryFilters.init();
    Detail.init();
    Export.init();
    Settings.init();
    try {
      await Domain.resolve();
    } catch (err) {
      console.warn("[WebLens] Site resolve failed:", err);
    }

    const btn = Elements.get("scanBtn");
    if (btn) btn.addEventListener("click", () => Actions.onScanRequested());
    const rescan = Elements.get("rescanBtn");
    if (rescan) rescan.addEventListener("click", () => Actions.onScanRequested());
    const retry = Elements.get("emptyRetryBtn");
    if (retry) retry.addEventListener("click", () => Actions.onScanRequested());
  }
};
