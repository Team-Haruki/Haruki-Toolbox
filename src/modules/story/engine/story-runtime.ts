// The player shell inside a host element: story browser (left), the stage
// (the pjsk-scenario-player library), script overview (right). Builds the DOM
// and the player once, then plays whatever scenario the page hands it;
// nothing plays until then.

import { DEFAULT_MENU, PjskPlayer, type ModelManifest, type ScenarioSceneData, type TextScript } from "pjsk-scenario-player";

import { ScriptLog, type ScriptLogLabels } from "./scriptlog";
import { StoryBrowser, type BrowserLabels } from "./browser";
import { createStoryResolver, storyUrls, type StoryEpisodeContext } from "./urls";
import type { StoryCatalog } from "../lib/story-catalog";

export type MenuLabels = Record<"fullscreen" | "auto" | "mute" | "fast" | "hide" | "log", string>;

export interface RuntimeLabels {
  browser: BrowserLabels;
  menu: MenuLabels;
  log: ScriptLogLabels;
  loading: string;
  /** before the "loaded / total" count under the spinner */
  models: string;
  start: string;
  /** shown on the stage until an episode is picked (browser beside / below the stage) */
  pickBeside: string;
  pickBelow: string;
  /** narrow layout: the panel tabs under the stage */
  tabBrowser: string;
  tabLog: string;
  fullscreen: string;
  exitFullscreen: string;
  /** credit line shown over the top of the stage */
  credit: string;
}

/** Below this host width the stage goes on top and the browser / log become tabs under it. */
const NARROW = 1100;
/** Narrow layout: the panels keep this design width and are zoomed to the host, like the desktop row. */
const PANEL_WIDTH = 400;

const ICON_EXPAND = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`;
const ICON_SHRINK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>`;

// Can this page play sound without a click yet? (a silent clip either plays or
// is rejected by the browser's autoplay policy)
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
export const canAutoplay = () =>
  new Audio(SILENT_WAV).play().then(
    () => true,
    () => false,
  );

interface HanSansManifest {
  family: string;
  weights: Record<string, { file: string; range: string }[]>;
}

let fontsAdded = false;
// Talk window faces. The game sets JP/EN text in FOT-RodinNTLGPro (EB = name
// plate, DB = dialogue body), a commercial font; its CN/TW/KR clients build
// the same two faces from Source Han Sans (Bold / Medium). StoryJpBold /
// StoryJpMedium use Source Han Sans JP and fall back to the Rodin files while
// the asset host still has only those. CN/TW/KR text uses StoryHanSans,
// frequency slices with unicode-range. Faces are only registered here: the
// browser downloads one when text first renders in it, not up front.
const JP_FACES: [family: string, files: string[]][] = [
  ["StoryJpBold", ["SourceHanSansJP-Bold.otf"]],
  ["StoryJpMedium", ["SourceHanSansJP-Medium.otf"]],
];
function addFonts() {
  if (fontsAdded) return;
  fontsAdded = true;
  for (const [family, files] of JP_FACES) {
    const src = files.map((f) => `url("${storyUrls.fonts(f)}") format("opentype")`).join(", ");
    document.fonts.add(new FontFace(family, src, { display: "swap" }));
  }
  fetch(storyUrls.fonts("shs/manifest.json"))
    .then((r) => (r.ok ? (r.json() as Promise<HanSansManifest>) : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((m) => {
      for (const [weight, slices] of Object.entries(m.weights))
        for (const s of slices)
          document.fonts.add(
            new FontFace(m.family, `url("${storyUrls.fonts(`shs/${s.file}`)}") format("woff2")`, {
              weight,
              unicodeRange: s.range,
              display: "swap",
            }),
          );
    })
    .catch((e) => console.warn("Han Sans font list unavailable", e));
}

// the faces above, handed to the player's talk window
const PLAYER_FONTS: Record<string, string> = {
  "--pjsk-font-name": `"StoryJpBold", system-ui, sans-serif`,
  "--pjsk-font-body": `"StoryJpMedium", system-ui, sans-serif`,
  "--pjsk-font-zh-name": `"StoryHanSans", "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei UI", sans-serif`,
  "--pjsk-font-zh-body": `"StoryHanSans", "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei UI", sans-serif`,
  "--pjsk-font-ko-name": `"StoryHanSans", "Source Han Sans K", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`,
  "--pjsk-font-ko-body": `"StoryHanSans", "Source Han Sans K", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`,
};

interface Session {
  sid: string;
  log: ScriptLog;
}

export class StoryRuntime {
  private root: HTMLElement;
  private row: HTMLElement;
  private box: HTMLElement;
  private fsBtn: HTMLButtonElement;
  private creditEl: HTMLElement;
  private player: PjskPlayer;
  private browser: StoryBrowser;
  private session?: Session;
  // Character2dId → talk-log icon (optional), fetched with the first episode
  private icons?: Promise<Record<string, string>>;
  // the asset index's costumes, given to the player with the first episode
  private resolveModels!: (m: ModelManifest) => void;
  private models = new Promise<ModelManifest>((resolve) => (this.resolveModels = resolve));
  private labels: RuntimeLabels;
  private resizeObserver: ResizeObserver;
  private loadSeq = 0;
  private picking = false; // the "pick an episode" prompt is up
  private destroyed = false;
  private readonly onViewport = () => this.fit();
  // the script overview survives scenario switches
  private logVisible = true;

  constructor(host: HTMLElement, labels: RuntimeLabels, onPick: (sid: string) => void) {
    this.labels = labels;
    addFonts();
    this.root = document.createElement("div");
    this.root.className = "story-player";
    this.root.dataset.panel = "browser";
    this.root.innerHTML = `<div class="sp-row">
        <div class="sp-stage-box"></div>
        <div class="sp-tabs" role="tablist">
          <button type="button" role="tab" data-panel="browser"></button>
          <button type="button" role="tab" data-panel="log"></button>
        </div>
      </div>`;
    host.appendChild(this.root);
    const $ = <T extends HTMLElement>(sel: string) => this.root.querySelector<T>(sel)!;
    this.row = $(".sp-row");
    this.box = $(".sp-stage-box");
    for (const tab of this.root.querySelectorAll<HTMLButtonElement>(".sp-tabs button")) {
      tab.textContent = tab.dataset.panel === "log" ? labels.tabLog : labels.tabBrowser;
      tab.addEventListener("click", () => this.showPanel(tab.dataset.panel === "log" ? "log" : "browser"));
    }
    this.syncPanelTabs();

    this.player = new PjskPlayer(this.box, {
      assets: createStoryResolver(),
      models: () => this.models,
      menu: DEFAULT_MENU,
      fonts: false, // registered above (Source Han Sans JP / Rodin fallback, Han Sans slices)
      cubismCoreUrl: storyUrls.lib("live2dcubismcore.min.js"),
      labels: { start: labels.start, loading: labels.loading, models: labels.models, menu: labels.menu },
    });
    for (const [k, v] of Object.entries(PLAYER_FONTS)) this.player.root.style.setProperty(k, v);
    this.player.setLogActive(this.logVisible);
    this.player.on("log", () => {
      this.logVisible = !this.logVisible;
      this.player.setLogActive(this.logVisible);
      this.session?.log.setVisible(this.logVisible);
      this.fit();
    });
    this.player.on("progress", (e) => this.session?.log.setProgress(e.index));
    this.player.on("mode", () => {
      this.syncFullscreenButton();
      this.fit();
    });

    // the fullscreen toggle and the credit sit on the player, so they stay in fullscreen
    this.fsBtn = document.createElement("button");
    this.fsBtn.type = "button";
    this.fsBtn.className = "sp-fs-btn";
    this.fsBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // not a tap on the story
      void this.player.toggleFullscreen();
    });
    this.creditEl = document.createElement("div");
    this.creditEl.className = "sp-credit";
    this.creditEl.textContent = labels.credit;
    this.player.root.append(this.fsBtn, this.creditEl);
    this.syncFullscreenButton();

    this.browser = new StoryBrowser(this.row, onPick, () => this.fit(), labels.browser);

    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(host);
    addEventListener("resize", this.onViewport);
    this.showPick();
    this.fit();
  }

  setCatalog(cat: StoryCatalog) {
    this.browser.setCatalog(cat);
    this.fit();
  }

  setCatalogError(message: string) {
    this.browser.setError(message);
  }

  /** Play the voices; takes effect from the next line. */
  setVoice(on: boolean) {
    this.player.setVoice(on);
  }

  /** Font group of the dialogue text ("ja" | "zh" | "ko" | "latin"). */
  setScript(script: string) {
    this.root.dataset.script = script;
    this.player.setTextScript(script as TextScript);
  }

  /** Font group of the story browser's titles (they follow the title region). */
  setTitleScript(script: string) {
    this.root.dataset.titles = script;
  }

  // Fit browser + stage + overview into the host (CSS zoom keeps the 1280x720
  // layout). Narrow hosts put the stage on top at full width with the browser
  // and the log as tabs under it. The player scales its own stage to the box.
  private fit() {
    const host = this.root.parentElement;
    if (!host) return;
    const width = host.clientWidth;
    const narrow = width < NARROW;
    const wasNarrow = this.root.classList.contains("narrow");
    this.root.classList.toggle("narrow", narrow);
    if (this.player.fullscreen) {
      // a zoomed ancestor would scale the fullscreen player as well
      this.row.style.zoom = "1";
    } else if (narrow) {
      this.row.style.zoom = "1";
      // panels: same proportions as on desktop, scaled to the width
      const panelZoom = Math.min(1.25, width / PANEL_WIDTH);
      const panelHeight = Math.min(innerHeight * 0.68, 620) / panelZoom;
      this.root.style.setProperty("--sp-panel-zoom", String(panelZoom));
      this.root.style.setProperty("--sp-panel-height", `${Math.round(panelHeight)}px`);
    } else {
      this.row.style.zoom = "1";
      const maxHeight = Math.max(360, innerHeight - this.row.getBoundingClientRect().top - 16);
      const z = Math.min(1, width / this.row.scrollWidth, maxHeight / this.row.scrollHeight);
      this.row.style.zoom = String(Math.max(0.3, z));
    }
    if (this.picking && wasNarrow !== narrow) this.showPickMessage();
    this.fitCredit();
  }

  // The credit grows with the player (12-18px) and stays on one line: shrunk
  // to the room between the corner buttons.
  private fitCredit() {
    const credit = this.creditEl;
    const width = this.player.root.clientWidth;
    credit.style.fontSize = `${Math.min(18, Math.max(12, width * 0.016)).toFixed(2)}px`;
    const room = width - (this.root.classList.contains("narrow") || this.player.fullscreen ? 76 : 120);
    const natural = credit.scrollWidth;
    if (natural > room && natural > 0)
      credit.style.fontSize = `${Math.max(5, (Number.parseFloat(getComputedStyle(credit).fontSize) * room) / natural).toFixed(2)}px`;
  }

  private showPanel(panel: "browser" | "log") {
    this.root.dataset.panel = panel;
    this.syncPanelTabs();
  }

  private syncPanelTabs() {
    for (const tab of this.root.querySelectorAll<HTMLElement>(".sp-tabs button")) {
      const on = tab.dataset.panel === this.root.dataset.panel;
      tab.classList.toggle("on", on);
      tab.setAttribute("aria-selected", String(on));
    }
  }

  private syncFullscreenButton() {
    const on = this.player.fullscreen;
    this.root.classList.toggle("fs", on);
    this.fsBtn.innerHTML = on ? ICON_SHRINK : ICON_EXPAND;
    const label = on ? this.labels.exitFullscreen : this.labels.fullscreen;
    this.fsBtn.title = label;
    this.fsBtn.setAttribute("aria-label", label);
  }

  /** Overlay spinner while the page fetches the scenario. */
  showLoading() {
    this.picking = false;
    this.player.showLoading();
  }

  showError(message: string) {
    this.picking = false;
    this.player.showMessage(message);
  }

  private showPickMessage() {
    this.player.showMessage(this.root.classList.contains("narrow") ? this.labels.pickBelow : this.labels.pickBeside);
  }

  private teardown() {
    this.session?.log.destroy();
    this.session = undefined;
    this.player.stop();
  }

  /** Stop playback and ask for an episode. */
  showPick() {
    this.loadSeq++;
    this.teardown();
    this.browser.setCurrent(null);
    this.showPanel("browser");
    this.picking = true;
    this.showPickMessage();
  }

  /**
   * Tear down the current scenario and play this one. With `play` it starts
   * as soon as the first models are loaded; otherwise the player shows its
   * start button (browsers need a click before playing audio).
   */
  async load(sid: string, scn: ScenarioSceneData, episode: StoryEpisodeContext, play: boolean) {
    const seq = ++this.loadSeq;
    this.teardown();
    this.picking = false;
    this.browser.setCurrent(sid);
    this.showPanel("log"); // narrow layout: follow the lines once an episode is picked
    this.player.showLoading();
    this.resolveModels(episode.index.models as unknown as ModelManifest);
    this.icons ??= fetch(storyUrls.ui("chr_ts/map.json"))
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : {}))
      .catch(() => ({}));
    const icons = await this.icons;
    if (seq !== this.loadSeq || this.destroyed) return;

    const log = new ScriptLog(this.row, scn, icons, (i) => void this.player.jumpTo(i), this.labels.log);
    log.setVisible(this.logVisible);
    this.session = { sid, log };
    this.fit();
    await this.player.load(scn, { autoplay: play, context: episode });
  }

  /** Is this runtime still showing `sid`? */
  isCurrent(sid: string) {
    return this.session?.sid === sid;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.loadSeq++;
    this.resizeObserver.disconnect();
    removeEventListener("resize", this.onViewport);
    this.session?.log.destroy();
    this.session = undefined;
    this.browser.destroy();
    this.player.destroy();
    this.root.remove();
  }
}
