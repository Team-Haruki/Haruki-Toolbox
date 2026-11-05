// The player shell inside a host element: story browser, the stage (the
// pjsk-scenario-player library), script overview. Builds the DOM and the
// player once, then plays whatever scenario the page hands it; nothing plays
// until then. The panels keep their natural size in the app's theme; the
// layout (three columns, stage + one tabbed panel, or stacked) follows the
// host width and only the stage scales (see layout.ts).

import {
  DEFAULT_MENU,
  PjskPlayer,
  type ModelManifest,
  type PlayerModes,
  type ScenarioSceneData,
  type TextScript,
} from "pjsk-scenario-player";

import { ScriptLog, type ScriptLogLabels } from "./scriptlog";
import { StoryBrowser, type BrowserLabels } from "./browser";
import { createStoryResolver, storyUrls, type StoryEpisodeContext } from "./urls";
import {
  BROWSER_W,
  LOG_W,
  RAIL_W,
  STAGE_H,
  STAGE_W,
  creditFontSize,
  layoutMode,
  menuCloseScale,
  menuScale,
  rotatedStage,
  stageMenuFits,
  stageWidthFor,
  type LayoutMode,
} from "./layout";
import type { StoryCatalog } from "../lib/story-catalog";
import { AssetHttpError, loadWithAssetFallback } from "@/shared/sekai/asset-fallback";

export type MenuLabels = Record<"fullscreen" | "auto" | "mute" | "fast" | "hide" | "log", string>;

export interface RuntimeLabels {
  browser: BrowserLabels;
  menu: MenuLabels;
  log: ScriptLogLabels;
  loading: string;
  /** before the "loaded / total" count under the spinner */
  models: string;
  /** before the preload's "downloaded / total" count */
  preloading: string;
  /** files that failed on both hosts; "{n}" is their number */
  preloadFailed: string;
  retry: string;
  /** play without the failed files */
  continue: string;
  start: string;
  /** shown on the stage until an episode is picked (browser beside / below the stage) */
  pickBeside: string;
  pickBelow: string;
  /** mid / stacked layouts: the panel tabs */
  tabBrowser: string;
  tabLog: string;
  fullscreen: string;
  exitFullscreen: string;
  /** control row: bring the hidden talk window back */
  showUi: string;
  /** the stage as a keyboard target ("Space / Enter advance") */
  stage: string;
  /** under a phone stage before a line plays: fullscreen reads better */
  rotateHint: string;
  /** credit line shown over the top of the stage */
  credit: string;
}

export interface RuntimeOptions {
  labels: RuntimeLabels;
  /** auto-advance lines from the start (the reader's remembered choice) */
  auto: boolean;
  onPick: (sid: string) => void;
  /** a mode changed (auto, mute, fast, hidden UI, fullscreen) */
  onMode?: (modes: PlayerModes) => void;
  /** snippet `index` of the episode `sid` started */
  onProgress?: (sid: string, index: number) => void;
  /** the story list failed and the reader asked for it again */
  onRetryCatalog?: () => void;
}

const ICON_EXPAND = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>`;
const ICON_SHRINK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>`;
// control row icons (lucide outlines)
const ICONS: Record<ControlKey, string> = {
  fullscreen: ICON_EXPAND,
  auto: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8z"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>`,
  fast: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 19l9-7-9-7zM2 19l9-7-9-7z"/></svg>`,
  hide: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.2 3.2M6.6 6.6A18 18 0 0 0 2 12s3 8 10 8a10.8 10.8 0 0 0 5.4-1.4M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`,
  log: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
};
type ControlKey = "fullscreen" | "auto" | "mute" | "fast" | "hide" | "log";
const CONTROLS: ControlKey[] = ["fullscreen", "auto", "mute", "fast", "hide", "log"];

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

let fontsAdded: Promise<void> | null = null;
// Talk window faces. The game sets JP/EN text in FOT-RodinNTLGPro (EB = name
// plate, DB = dialogue body), a commercial font; its CN/TW/KR clients build
// the same two faces from Source Han Sans (Bold / Medium). StoryJpBold /
// StoryJpMedium use Source Han Sans JP. CN/TW/KR text uses StoryHanSans,
// frequency slices with unicode-range. Faces are only registered here; the
// player's preload loads the ones an episode's text uses (only those slices).
// Each face also lists the fallback host's copy, which the browser tries when
// the first source fails.
const JP_FACES: [family: string, files: string[]][] = [
  ["StoryJpBold", ["SourceHanSansJP-Bold.otf"]],
  ["StoryJpMedium", ["SourceHanSansJP-Medium.otf"]],
];

/** A FontFace `src`: each URL, then its copy on the fallback host. */
export function fontSources(urls: string[], format: string): string {
  return urls
    .flatMap((url) => [url, storyUrls.fallback(url)])
    .filter((url): url is string => url !== null)
    .map((url) => `url("${url}") format("${format}")`)
    .join(", ");
}

/** A host that accepts the connection and then stalls counts as failed after this. */
const HOST_JSON_TIMEOUT_MS = 15_000;

/** A small JSON file of the asset host, from the fallback host when this one fails. */
async function fetchHostJson<T>(url: string): Promise<T> {
  const { value } = await loadWithAssetFallback(url, storyUrls.fallback(url), async (u) => {
    const r = await fetch(u, { signal: AbortSignal.timeout(HOST_JSON_TIMEOUT_MS) });
    if (!r.ok) throw new AssetHttpError(u, r.status);
    return (await r.json()) as T;
  });
  return value;
}

/** Register the faces once; resolves when the Han Sans slices are registered too (or unavailable). */
function addFonts(): Promise<void> {
  if (fontsAdded) return fontsAdded;
  for (const [family, files] of JP_FACES) {
    const src = fontSources(files.map((f) => storyUrls.fonts(f)), "opentype");
    document.fonts.add(new FontFace(family, src, { display: "swap" }));
  }
  fontsAdded = fetchHostJson<HanSansManifest>(storyUrls.fonts("shs/manifest.json"))
    .then((m) => {
      for (const [weight, slices] of Object.entries(m.weights))
        for (const s of slices)
          document.fonts.add(
            new FontFace(m.family, fontSources([storyUrls.fonts(`shs/${s.file}`)], "woff2"), {
              weight,
              unicodeRange: s.range,
              display: "swap",
            }),
          );
    })
    .catch((e: unknown) => console.warn("Han Sans font list unavailable", e));
  return fontsAdded;
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

/** Keys that should reach the player as a tap (a focused control keeps them). */
const isAdvanceKey = (e: KeyboardEvent) => (e.key === " " || e.key === "Enter") && !e.repeat && !e.altKey && !e.ctrlKey && !e.metaKey;
const isPageTarget = (t: EventTarget | null) => t === document.body || t === document.documentElement || t === null;

export class StoryRuntime {
  private root: HTMLElement;
  private row: HTMLElement;
  private main: HTMLElement;
  private tabsEl: HTMLElement;
  private box: HTMLElement;
  private lineEl: HTMLButtonElement;
  private controls = new Map<ControlKey, HTMLButtonElement>();
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
  private opts: RuntimeOptions;
  private resizeObserver: ResizeObserver;
  private loadSeq = 0;
  private picking = false; // the "pick an episode" prompt is up
  private destroyed = false;
  private mode: LayoutMode = "wide";
  private modes: PlayerModes = { auto: true, fast: false, uiHidden: false, muted: false, voice: true, fullscreen: false };
  // where to continue from once the episode plays (see load)
  private pendingJump?: { sid: string; index: number };
  private readonly onViewport = () => this.fit();
  // Space / Enter with nothing focused: same as a tap on the stage
  private readonly onDocKey = (e: KeyboardEvent) => {
    if (!this.session || !isAdvanceKey(e) || !isPageTarget(e.target)) return;
    e.preventDefault();
    this.advance();
  };
  // wide layout: the script overview beside the stage survives scenario switches
  private logVisible = true;

  constructor(host: HTMLElement, opts: RuntimeOptions) {
    const labels = opts.labels;
    this.labels = labels;
    this.opts = opts;
    this.modes.auto = opts.auto;
    this.root = document.createElement("div");
    this.root.className = "story-player";
    this.root.dataset.panel = "browser";
    this.root.dataset.layout = "wide";
    this.root.dataset.menu = "stage";
    this.root.dataset.log = "off";
    this.root.innerHTML = `<div class="sp-row">
        <div class="sp-main">
          <div class="sp-stage-box"></div>
          <button type="button" class="sp-line hint"><b></b><span></span></button>
          <div class="sp-controls" role="group"></div>
        </div>
        <div class="sp-tabs" role="tablist">
          <button type="button" role="tab" data-panel="browser"></button>
          <button type="button" role="tab" data-panel="log"></button>
        </div>
      </div>`;
    host.appendChild(this.root);
    const $ = <T extends HTMLElement>(sel: string) => this.root.querySelector<T>(sel)!;
    this.row = $(".sp-row");
    this.main = $(".sp-main");
    this.tabsEl = $(".sp-tabs");
    this.box = $(".sp-stage-box");
    this.lineEl = $(".sp-line");
    this.lineEl.addEventListener("click", () => this.advance());
    for (const tab of this.root.querySelectorAll<HTMLButtonElement>(".sp-tabs button")) {
      tab.textContent = tab.dataset.panel === "log" ? labels.tabLog : labels.tabBrowser;
      tab.addEventListener("click", () => this.showPanel(tab.dataset.panel === "log" ? "log" : "browser"));
    }

    this.player = new PjskPlayer(this.box, {
      assets: createStoryResolver(),
      models: () => this.models,
      menu: DEFAULT_MENU,
      auto: opts.auto,
      fonts: false, // registered above (Source Han Sans JP, Han Sans slices)
      // the player loads it itself, from the fallback host when this one fails
      cubismCoreUrl: storyUrls.lib("live2dcubismcore.min.js"),
      // every file of an episode is downloaded before it plays (the bar shows
      // it; files no host gives offer a retry or playing without them)
      preload: true,
      labels: {
        start: labels.start,
        loading: labels.loading,
        models: labels.models,
        preloading: labels.preloading,
        preloadFailed: labels.preloadFailed,
        retry: labels.retry,
        continue: labels.continue,
        menu: labels.menu,
      },
    });
    const pr = this.player.root;
    for (const [k, v] of Object.entries(PLAYER_FONTS)) pr.style.setProperty(k, v);
    // the stage is a keyboard target: Space / Enter advance like a tap
    pr.tabIndex = 0;
    pr.setAttribute("role", "button");
    pr.setAttribute("aria-label", labels.stage);
    pr.addEventListener("keydown", (e) => {
      if (!isAdvanceKey(e) || e.target !== pr) return;
      e.preventDefault();
      this.advance();
    });
    document.addEventListener("keydown", this.onDocKey);

    this.player.on("log", () => this.toggleLog());
    this.player.on("progress", (e) => {
      const s = this.session;
      if (!s) return;
      s.log.setProgress(e.index);
      this.syncLine();
      this.opts.onProgress?.(s.sid, e.index);
    });
    this.player.on("play", () => {
      const jump = this.pendingJump;
      this.pendingJump = undefined;
      // the timeline is set up right after this event; jump once it is
      if (jump && this.session?.sid === jump.sid) setTimeout(() => void this.player.jumpTo(jump.index), 0);
    });
    this.player.on("mode", (m) => {
      this.modes = m;
      this.syncFullscreenButton();
      this.syncControls();
      this.opts.onMode?.(m);
      this.fit();
    });

    // the control row under a small stage: the ⋯ menu's buttons at page size
    const controlsEl = $(".sp-controls");
    for (const key of CONTROLS) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.k = key;
      b.innerHTML = `${ICONS[key]}<span></span>`;
      b.addEventListener("click", () => this.control(key));
      controlsEl.appendChild(b);
      this.controls.set(key, b);
    }

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
    pr.append(this.fsBtn, this.creditEl);
    this.syncFullscreenButton();
    this.syncControls();
    this.syncLine();

    this.browser = new StoryBrowser(this.row, opts.onPick, () => this.fit(), labels.browser);

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

  /** The story list failed: say so in its place, with a retry when the page offers one. */
  setCatalogError(message: string) {
    const retry = this.opts.onRetryCatalog;
    this.browser.setError(message, retry ? { label: this.labels.retry, onRetry: retry } : undefined);
  }

  /** Play the voices; takes effect from the next line. */
  setVoice(on: boolean) {
    this.player.setVoice(on);
  }

  /** Listener volume (0-1) for the BGM or the voices; applies at once. */
  setVolume(kind: "bgm" | "voice", value: number) {
    this.player.setVolume(kind, value);
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

  /** The row (stage and panels), to scroll it into view after a pick. */
  get rowElement(): HTMLElement {
    return this.row;
  }

  // Lay the row out for the host: the layout mode by width, the stage width
  // from what the columns leave (capped so the stage also fits under the
  // row), the in-stage menu scaled to 40px targets or replaced by the control
  // row when it cannot fit, the credit line shrunk / wrapped to its room.
  private fit() {
    const host = this.root.parentElement;
    if (!host || this.destroyed) return;
    const width = host.clientWidth;
    if (!width) return;
    const mode = layoutMode(width);
    const wasMode = this.mode;
    this.mode = mode;
    this.root.dataset.layout = mode;
    if (wasMode !== mode) {
      // a side panel is shown one at a time outside the wide layout
      if (mode !== "wide" && this.root.dataset.panel === "log" && !this.session) this.root.dataset.panel = "browser";
      this.syncPanelTabs();
      this.syncLog();
      if (this.picking) this.showPickMessage();
    }
    const collapsed = mode === "wide" && this.browser.collapsed;
    const logShown = mode === "wide" && this.logVisible && !!this.session;
    this.root.dataset.log = logShown ? "on" : "off";
    // room under the row's top in the document (scroll-independent)
    const top = this.row.getBoundingClientRect().top + scrollY;
    const maxHeight = innerHeight - top - 16;
    const stageW = stageWidthFor(width, mode, { browserCollapsed: collapsed, logHidden: !logShown }, maxHeight);
    this.root.style.setProperty("--sp-stage-w", `${stageW}px`);
    if (mode === "wide") {
      const browserCol = collapsed ? `${RAIL_W}px` : `minmax(${BROWSER_W}px, 1fr)`;
      this.root.style.setProperty("--sp-cols", logShown ? `${browserCol} ${stageW}px minmax(${LOG_W}px, 1fr)` : `${browserCol} ${stageW}px`);
    } else if (mode === "mid") {
      this.root.style.setProperty("--sp-cols", `${stageW}px minmax(${LOG_W}px, 1fr)`);
    }
    // the panels are as tall as the stage column (they scroll inside); stacked, a share of the viewport
    let panelH = Math.round(Math.min(innerHeight * 0.6, 560));
    if (mode !== "stack") {
      const mainH = this.main.offsetHeight; // after the stage width above
      panelH = Math.max(200, mode === "mid" ? mainH - this.tabsEl.offsetHeight - 12 : mainH);
    }
    this.root.style.setProperty("--sp-panel-h", `${panelH}px`);

    // the stage's scale: from the box, or from the fullscreen element
    const pr = this.player.root;
    const fs = this.player.fullscreen;
    let k: number;
    let rotate = false;
    if (fs) {
      const w = pr.clientWidth;
      const h = pr.clientHeight;
      // native fullscreen still upright (landscape lock refused): draw sideways
      rotate = document.fullscreenElement === pr && h > w;
      if (rotate) {
        const r = rotatedStage(w, h);
        k = r.k;
        pr.style.setProperty("--sp-rot", r.transform);
      } else k = Math.min(w / STAGE_W, h / STAGE_H) || 1;
    } else k = (mode === "stack" ? this.box.clientWidth || width : stageW) / STAGE_W;
    pr.classList.toggle("sp-rotate", rotate);
    const stageMenu = fs || stageMenuFits(k, STAGE_H * k);
    this.root.dataset.menu = stageMenu ? "stage" : "row";
    pr.style.setProperty("--sp-menu-scale", menuScale(k).toFixed(4));
    pr.style.setProperty("--sp-close-scale", menuCloseScale(k).toFixed(4));
    this.fitCredit(k * menuScale(k), stageMenu);
  }

  // The credit grows with the player (12-18px) in the room between the corner
  // buttons: one line where it fits, two on a narrow stage, hidden when even
  // that is too much.
  private fitCredit(menuPx: number, stageMenu: boolean) {
    const credit = this.creditEl;
    const width = this.player.root.clientWidth;
    if (!width) return;
    const size = creditFontSize(width);
    credit.hidden = false;
    credit.classList.remove("wrap");
    credit.style.fontSize = `${size.toFixed(2)}px`;
    credit.style.width = "";
    const left = this.fsBtn.offsetParent ? 52 : 10;
    const right = stageMenu ? 64 * menuPx + 20 : 10;
    const room = Math.max(0, width - left - right);
    if (credit.scrollWidth <= room) return;
    credit.classList.add("wrap");
    credit.style.width = `${room}px`;
    if (credit.scrollHeight > size * 1.3 * 2 + 2) credit.hidden = true;
  }

  private showPanel(panel: "browser" | "log") {
    if (panel === "log" && !this.session) return;
    this.root.dataset.panel = panel;
    this.syncPanelTabs();
    this.syncLog();
    this.fit();
  }

  private syncPanelTabs() {
    for (const tab of this.root.querySelectorAll<HTMLButtonElement>(".sp-tabs button")) {
      const on = tab.dataset.panel === this.root.dataset.panel;
      tab.classList.toggle("on", on);
      tab.setAttribute("aria-selected", String(on));
      tab.disabled = tab.dataset.panel === "log" && !this.session;
    }
  }

  // The menu's Log button: beside the stage it shows / hides the overview;
  // where the overview shares a slot with the browser it switches between them.
  private toggleLog() {
    if (this.mode === "wide") {
      this.logVisible = !this.logVisible;
      this.syncLog();
      this.fit();
    } else this.showPanel(this.root.dataset.panel === "log" ? "browser" : "log");
  }

  private get logOn() {
    return this.mode === "wide" ? this.logVisible : this.root.dataset.panel === "log";
  }

  private syncLog() {
    this.session?.log.setVisible(this.mode === "wide" ? this.logVisible : true);
    this.player.setLogActive(this.logOn && !!this.session);
    this.syncControls();
  }

  private control(key: ControlKey) {
    const m = this.modes;
    switch (key) {
      case "fullscreen":
        void this.player.toggleFullscreen();
        break;
      case "auto":
        this.player.setAuto(!m.auto);
        break;
      case "mute":
        this.player.setMuted(!m.muted);
        break;
      case "fast":
        this.player.setFast(!m.fast);
        break;
      case "hide":
        this.player.setUiHidden(!m.uiHidden);
        break;
      case "log":
        this.toggleLog();
        break;
    }
  }

  private syncControls() {
    const m = this.modes;
    const state: Record<ControlKey, boolean> = {
      fullscreen: m.fullscreen,
      auto: m.auto,
      mute: m.muted,
      fast: m.fast,
      hide: m.uiHidden,
      log: this.logOn && !!this.session,
    };
    for (const [key, b] of this.controls) {
      const on = state[key];
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      const label =
        key === "fullscreen"
          ? on
            ? this.labels.exitFullscreen
            : this.labels.fullscreen
          : key === "hide" && on
            ? this.labels.showUi
            : this.labels.menu[key];
      b.querySelector("span")!.textContent = label;
      b.disabled = key === "log" && !this.session;
    }
  }

  /** Same as a tap on the stage: finish typing, or advance (or bring hidden UI back). */
  private advance() {
    if (this.modes.uiHidden) this.player.setUiHidden(false);
    else this.player.advance();
  }

  // The line strip under a phone stage: the current talk, or a hint while nothing plays.
  private syncLine() {
    const line = this.session?.log.currentLine() ?? null;
    const name = this.lineEl.querySelector("b")!;
    const body = this.lineEl.querySelector("span")!;
    if (!line) {
      this.lineEl.classList.add("hint");
      name.textContent = "";
      name.hidden = true;
      body.textContent = this.labels.rotateHint;
      return;
    }
    this.lineEl.classList.remove("hint");
    name.hidden = !line.name;
    name.textContent = line.name;
    body.textContent = line.body;
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

  /**
   * An episode was picked: stop the one playing (its frame and lines go away
   * at once), move the list highlight and show the spinner while the page
   * fetches the scenario.
   */
  beginLoad(sid: string) {
    this.loadSeq++;
    this.teardown();
    this.picking = false;
    this.browser.setCurrent(sid);
    this.player.showLoading();
  }

  showError(message: string) {
    this.picking = false;
    this.teardown();
    this.player.showMessage(message);
  }

  private showPickMessage() {
    this.player.showMessage(this.mode === "stack" ? this.labels.pickBelow : this.labels.pickBeside);
  }

  private teardown() {
    this.pendingJump = undefined;
    this.session?.log.destroy();
    this.session = undefined;
    this.player.stop();
    this.syncPanelTabs();
    this.syncLog();
    this.syncLine();
  }

  /** Stop playback and ask for an episode (leaving fullscreen: there is nothing to watch). */
  showPick() {
    this.loadSeq++;
    this.teardown();
    if (this.player.fullscreen) void this.player.setFullscreen(false);
    this.browser.setCurrent(null);
    this.root.dataset.panel = "browser";
    this.syncPanelTabs();
    this.syncLog();
    this.picking = true;
    this.showPickMessage();
    this.fit();
  }

  /**
   * Tear down the current scenario and play this one. With `play` it starts
   * as soon as the first models are loaded; otherwise the player shows its
   * start button (browsers need a click before playing audio). `startAt`
   * continues from that snippet once the episode plays.
   */
  async load(sid: string, scn: ScenarioSceneData, episode: StoryEpisodeContext, play: boolean, startAt = 0) {
    const seq = ++this.loadSeq;
    this.teardown();
    this.picking = false;
    this.browser.setCurrent(sid);
    this.player.showLoading();
    this.resolveModels(episode.index.models as unknown as ModelManifest);
    this.icons ??= fetchHostJson<Record<string, string>>(storyUrls.ui("chr_ts/map.json")).catch(() => ({}));
    // the slices must be registered before the player's preload loads the ones this text uses
    const [icons] = await Promise.all([this.icons, addFonts()]);
    if (seq !== this.loadSeq || this.destroyed) return;

    const log = new ScriptLog(this.row, scn, icons, (i) => void this.player.jumpTo(i), this.labels.log);
    this.session = { sid, log };
    this.pendingJump = startAt > 0 ? { sid, index: startAt } : undefined;
    // outside the wide layout: follow the lines once an episode is picked
    if (this.mode !== "wide") this.root.dataset.panel = "log";
    this.syncPanelTabs();
    this.syncLog();
    this.syncLine();
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
    document.removeEventListener("keydown", this.onDocKey);
    this.session?.log.destroy();
    this.session = undefined;
    this.browser.destroy();
    this.player.destroy();
    this.root.remove();
  }
}
