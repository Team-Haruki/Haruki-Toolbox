// Story browser (left of the stage), laid out like the game's ストーリー
// screens: category tabs, a unit filter row with the game's unit icons, a
// search box, and story cells that expand into their episodes (number + title
// + episode image). Collapsible to a thin rail. Picking an episode calls
// onPick; the page decides what plays.

import type { StoryCatalog, StoryEpisodeLabel, StorySeries, StoryTab } from "../lib/story-catalog";
import { STORY_TABS } from "../lib/story-catalog";
import { handleSekaiImageError } from "@/shared/sekai/image-recovery";
import { preferAssetHost, resolveAssetImageFallback } from "@/shared/sekai/asset-image-fallback";
import { storyUrls } from "./urls";

export interface BrowserLabels {
  tabs: Record<StoryTab, string>;
  all: string;
  rail: string;
  toggle: string;
  search: string;
  loading: string;
  empty: string;
  episode: (label: StoryEpisodeLabel) => string;
}

const UNITS: { key: string; icon: string; name: string }[] = [
  { key: "", icon: "icon_unit", name: "" },
  { key: "light_sound", icon: "icon_unit_ln", name: "Leo/need" },
  { key: "idol", icon: "icon_unit_mj", name: "MORE MORE JUMP！" },
  { key: "street", icon: "icon_unit_vb", name: "Vivid BAD SQUAD" },
  { key: "theme_park", icon: "icon_unit_ws", name: "ワンダーランズ×ショウタイム" },
  { key: "school_refusal", icon: "icon_unit_25", name: "25時、ナイトコードで。" },
  { key: "piapro", icon: "icon_unit_vs_wh", name: "バーチャル・シンガー" },
];

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Per-viewer UI state (tab, filter, collapsed) — best effort only.
const store = {
  get(k: string) {
    try {
      return localStorage.getItem(`story-browser:${k}`);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(`story-browser:${k}`, v);
    } catch {
      /* private mode etc. */
    }
  },
};

export class StoryBrowser {
  private root: HTMLElement;
  private listEl: HTMLElement;
  private input: HTMLInputElement;
  private cat?: StoryCatalog;
  private tab: StoryTab = (STORY_TABS as readonly string[]).includes(store.get("tab") ?? "") ? (store.get("tab") as StoryTab) : "event";
  private unit = store.get("unit") || "";
  // card stories / area talks: one game character (0 = all)
  private char = Number(store.get("char")) || 0;
  private charsEl!: HTMLElement;
  private open = new Set<string>(); // expanded story keys
  private current: string | null = null;
  private onPick: (sid: string) => void;
  private onResize: () => void;
  private labels: BrowserLabels;

  constructor(parent: HTMLElement, onPick: (sid: string) => void, onResize: () => void, labels: BrowserLabels) {
    this.onPick = onPick;
    this.onResize = onResize;
    this.labels = labels;
    const ui = (p: string) => preferAssetHost(storyUrls.ui(p));
    this.root = document.createElement("aside");
    this.root.className = "story-browser";
    if (store.get("collapsed") === "1") this.root.classList.add("collapsed");
    this.root.innerHTML = `<button class="sb-toggle" title="${esc(labels.toggle)}" aria-label="${esc(labels.toggle)}"></button>
      <div class="sb-rail">${esc(labels.rail)}</div>
      <div class="sb-main">
        <div class="sb-tabs">${STORY_TABS.map((t) => `<button data-tab="${t}">${esc(labels.tabs[t])}</button>`).join("")}</div>
        <div class="sb-units">${UNITS.map(
          (u) =>
            `<button data-unit="${u.key}" title="${esc(u.name || labels.all)}" class="${u.key === "piapro" ? "vs" : ""}"><img src="${ui(`units/${u.icon}.png`)}" alt="" /></button>`,
        ).join("")}</div>
        <div class="sb-chars"></div>
        <input class="sb-search" type="search" placeholder="${esc(labels.search)}" spellcheck="false" />
        <div class="sb-list"><div class="sb-empty">${esc(labels.loading)}</div></div>
      </div>`;
    parent.prepend(this.root);
    this.listEl = this.root.querySelector(".sb-list")!;
    // unit and character icons: the fallback host's copy once, when this
    // host is failing (the list's images recover through their own handlers below)
    this.root.addEventListener(
      "error",
      (e) => {
        const img = e.target;
        if (!(img instanceof HTMLImageElement) || this.listEl.contains(img) || img.dataset.fallback) return;
        img.dataset.fallback = "1";
        const failed = img.src;
        void resolveAssetImageFallback(failed).then((twin) => {
          if (twin && img.src === failed) img.src = twin;
        });
      },
      true,
    );
    this.charsEl = this.root.querySelector(".sb-chars")!;
    this.charsEl.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("button[data-char]");
      if (!b) return;
      const id = Number(b.dataset.char);
      this.char = this.char === id ? 0 : id;
      store.set("char", String(this.char));
      this.render();
    });
    this.input = this.root.querySelector(".sb-search")!;

    this.root.querySelector(".sb-toggle")!.addEventListener("click", () => {
      const c = this.root.classList.toggle("collapsed");
      store.set("collapsed", c ? "1" : "0");
      this.onResize();
    });
    this.root.querySelector(".sb-rail")!.addEventListener("click", () => {
      this.root.classList.remove("collapsed");
      store.set("collapsed", "0");
      this.onResize();
    });
    for (const b of this.root.querySelectorAll<HTMLElement>(".sb-tabs button"))
      b.addEventListener("click", () => {
        this.tab = b.dataset.tab as StoryTab;
        store.set("tab", this.tab);
        this.render();
      });
    for (const b of this.root.querySelectorAll<HTMLElement>(".sb-units button"))
      b.addEventListener("click", () => {
        this.unit = b.dataset.unit!;
        store.set("unit", this.unit);
        this.render();
      });
    this.input.addEventListener("input", () => this.render());
    this.listEl.addEventListener("click", (e) => this.onListClick(e));
    this.render();
  }

  setCatalog(cat: StoryCatalog) {
    const first = !this.cat;
    this.cat = cat;
    if (first) this.revealCurrent();
    this.render();
  }

  setError(message: string) {
    this.listEl.innerHTML = `<div class="sb-empty">${esc(message)}</div>`;
  }

  // The player switched scenario: move the highlight (and open its story).
  setCurrent(sid: string | null) {
    this.current = sid;
    if (!this.cat) return;
    this.revealCurrent();
    this.render();
  }

  // Open the tab + story that contain the scenario now playing.
  private revealCurrent() {
    const hit = this.current ? this.cat?.bySid.get(this.current) : undefined;
    if (!hit) return;
    this.tab = hit.series.kind;
    this.open.add(hit.series.key);
  }

  // Characters offered by the filter: the selected unit's members (all 26 without one).
  private charChoices(): number[] {
    const units = this.cat?.units ?? {};
    return Object.keys(units)
      .map(Number)
      .filter((id) => id >= 1 && id <= 26 && (!this.unit || units[id] === this.unit))
      .sort((a, b) => a - b);
  }

  private renderChars() {
    const show = this.tab === "card" || this.tab === "area";
    this.charsEl.hidden = !show || !this.cat;
    if (this.charsEl.hidden) return;
    const choices = this.charChoices();
    if (this.char && !choices.includes(this.char)) this.char = 0;
    const names = this.cat!.names;
    this.charsEl.innerHTML = choices
      .map(
        (id) =>
          `<button data-char="${id}" class="${id === this.char ? "on" : ""}" title="${esc(names[id] ?? "")}"><img src="${preferAssetHost(storyUrls.ui(`chr_ts/chr_ts_${id}_g2.png`))}" alt="${esc(names[id] ?? "")}" loading="lazy" /></button>`,
      )
      .join("");
  }

  private matchesChar(s: StorySeries) {
    if (!this.char || (this.tab !== "card" && this.tab !== "area")) return true;
    if (s.chars?.includes(this.char)) return true;
    return s.episodes.some((e) => e.chars?.includes(this.char));
  }

  private matchesUnit(s: StorySeries) {
    if (!this.unit) return true;
    if (s.unit === this.unit || s.vsUnit === this.unit) return true;
    // area talks: any participating character from that unit
    return s.episodes.some((e) => e.chars?.some((id) => this.cat!.units[id] === this.unit));
  }

  private render() {
    for (const b of this.root.querySelectorAll<HTMLElement>(".sb-tabs button"))
      b.classList.toggle("on", b.dataset.tab === this.tab);
    for (const b of this.root.querySelectorAll<HTMLElement>(".sb-units button"))
      b.classList.toggle("on", b.dataset.unit === this.unit);
    this.renderChars();
    if (!this.cat) return;
    // straight to the fallback host while this one is known to be failing
    const img = (p: string) => preferAssetHost(storyUrls.asset(p));
    const q = this.input.value.trim().toLowerCase();
    let html = "";
    let n = 0;
    for (const s of this.cat.tabs[this.tab]) {
      if (!this.matchesUnit(s) || !this.matchesChar(s)) continue;
      let eps = s.episodes;
      if (this.tab === "area" && this.unit)
        eps = eps.filter((e) => e.chars?.some((id) => this.cat!.units[id] === this.unit));
      if (this.tab === "area" && this.char) eps = eps.filter((e) => e.chars?.includes(this.char));
      const titleHit = !q || s.title.toLowerCase().includes(q);
      if (q && !titleHit) eps = eps.filter((e) => e.title.toLowerCase().includes(q));
      if (!eps.length) continue;
      if (++n > 400) break; // keep the DOM light; search narrows further
      const open = this.open.has(s.key) || (q && !titleHit);
      const cur = eps.some((e) => e.sid === this.current);
      const pic = s.logo
        ? `<img class="sb-logo" src="${img(s.logo)}" alt="" loading="lazy" />`
        : s.thumb
          ? `<img class="sb-thumb" src="${img(s.thumb)}" alt="" loading="lazy" />`
          : s.unit
            ? `<img class="sb-uicon" src="${preferAssetHost(storyUrls.ui(`units/${UNITS.find((u) => u.key === s.unit)?.icon ?? "icon_unit"}.png`))}" alt="" />`
            : "";
      const date = s.at ? new Date(s.at).toISOString().slice(0, 10) : "";
      html += `<div class="sb-story${open ? " open" : ""}${cur ? " cur" : ""}" data-key="${esc(s.key)}">
        <div class="sb-head">${pic}<div class="sb-title"><b>${esc(s.title)}</b>${date ? `<small>${date}</small>` : ""}</div><i class="sb-caret"></i></div>`;
      if (open)
        html += `<div class="sb-eps">${eps
          .map(
            (e) => `<div class="sb-ep${e.sid === this.current ? " cur" : ""}" data-sid="${esc(e.sid)}" title="${esc(e.sid)}">
              <div class="sb-ep-text"><small>${esc(this.labels.episode(e.label))}</small><span>${esc(e.title)}</span></div>
              ${e.thumb ? `<img src="${img(e.thumb)}" alt="" loading="lazy" />` : ""}
            </div>`,
          )
          .join("")}</div>`;
      html += `</div>`;
    }
    this.listEl.innerHTML = html || `<div class="sb-empty">${esc(this.labels.empty)}</div>`;
    // CDN images recover through the shared retry (the fallback host's copy
    // when this host fails); one that is really gone (no logo / episode art
    // for that story) just disappears
    for (const el of this.listEl.querySelectorAll("img")) {
      const src = el.src;
      el.addEventListener("error", (ev) => {
        if (!handleSekaiImageError(ev, src)) el.remove();
      });
    }
    const cur = this.listEl.querySelector<HTMLElement>(".sb-ep.cur");
    if (cur && !q) this.revealInList(cur);
  }

  // Scroll only the list to the episode: scrollIntoView() also scrolls the
  // page, which on the narrow layout pushed the stage off screen.
  private revealInList(el: HTMLElement) {
    const list = this.listEl.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    // rects include the row's CSS zoom, scrollTop doesn't
    const zoom = list.height / this.listEl.offsetHeight || 1;
    if (r.top < list.top) this.listEl.scrollTop += (r.top - list.top) / zoom;
    else if (r.bottom > list.bottom) this.listEl.scrollTop += (r.bottom - list.bottom) / zoom;
  }

  private onListClick(e: Event) {
    const t = e.target as HTMLElement;
    const ep = t.closest<HTMLElement>(".sb-ep");
    if (ep) {
      this.onPick(ep.dataset.sid!);
      return;
    }
    const story = t.closest<HTMLElement>(".sb-story");
    if (!story) return;
    const key = story.dataset.key!;
    if (this.open.has(key)) this.open.delete(key);
    else this.open.add(key);
    const top = this.listEl.scrollTop;
    this.render();
    this.listEl.scrollTop = top;
  }

  destroy() {
    this.root.remove();
  }
}
