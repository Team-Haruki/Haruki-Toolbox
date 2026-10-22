// The player shell inside a host element: story browser (left), stage with
// its overlays, script overview (right). Builds the DOM and the PIXI app once,
// then plays whatever scenario the page hands it; nothing plays until then.
//
// Needs the Live2D Cubism core on window (see cubism.ts) before this module
// is imported.

import * as PIXI from "pixi.js";
import { Live2DModel } from "@sekai-world/pixi-live2d-display-mulmotion/cubism4";

import type { ScenarioSceneData } from "./types";
import { buildMotionIndex } from "./assets";
import { Stage } from "./stage";
import { DialogueBox } from "./dialogue";
import { AudioManager } from "./audio";
import { Effects } from "./effects";
import { ScenarioPlayer } from "./player";
import { ScenarioMenu, type MenuLabels } from "./menu";
import { ScriptLog, type ScriptLogLabels } from "./scriptlog";
import { StoryBrowser, type BrowserLabels } from "./browser";
import { FxManager } from "./particles";
import { configureStoryEpisode, storyUrls, type StoryEpisodeContext } from "./urls";
import type { StoryCatalog } from "../lib/story-catalog";

(window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI;
Live2DModel.registerTicker(PIXI.Ticker);

export interface RuntimeLabels {
  browser: BrowserLabels;
  menu: MenuLabels;
  log: ScriptLogLabels;
  loading: string;
  start: string;
  /** shown on the stage until an episode is picked (browser beside / below the stage) */
  pickBeside: string;
  pickBelow: string;
  /** narrow layout: the panel tabs under the stage */
  tabBrowser: string;
  tabLog: string;
  fullscreen: string;
  exitFullscreen: string;
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
// The game's fonts. JP/EN text: FOT-RodinNTLGPro (EB = name plate, DB =
// dialogue body). CN/TW/KR clients build those same two faces from Source Han
// Sans (Bold / Medium), served here as frequency slices with unicode-range,
// so the browser only downloads the slices a page uses.
function addFonts() {
  if (fontsAdded) return;
  fontsAdded = true;
  for (const [family, file] of [
    ["RodinEB", "FOT-RodinNTLGPro-EB.otf"],
    ["RodinDB", "FOT-RodinNTLGPro-DB.otf"],
  ]) {
    const face = new FontFace(family, `url("${storyUrls.fonts(file)}") format("opentype")`, { display: "swap" });
    document.fonts.add(face);
    face.load().catch(() => console.warn("font load failed", family));
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

// Sprites the CSS paints (menu button, panel close, buttons, side-fade strips).
const CSS_SPRITES: Record<string, string> = {
  "--sp-menu-circle": "menu/menu_circle.png",
  "--sp-menu-dots": "menu/menu_dots.png",
  "--sp-menu-close": "menu/close.png",
  "--sp-menu-btn": "menu/btn.png",
  "--sp-choice-btn": "scenario/btn_round_h80_wh.png",
  "--sp-side-left": "scenario/tex_transition_left.png",
  "--sp-side-top": "scenario/tex_transition_top.png",
};

interface Session {
  sid: string;
  player: ScenarioPlayer;
  stage: Stage;
  log: ScriptLog;
  fx: FxManager;
}

export class StoryRuntime {
  private root: HTMLElement;
  private row: HTMLElement;
  private box: HTMLElement;
  private wrap: HTMLElement;
  private fsBtn: HTMLButtonElement;
  private overlay: HTMLElement;
  private loadingEl: HTMLElement;
  private statusEl: HTMLElement;
  private pickEl: HTMLElement;
  private startBtn: HTMLButtonElement;
  private app: PIXI.Application;
  private dialogue: DialogueBox;
  private audio = new AudioManager();
  private effects: Effects;
  private menu: ScenarioMenu;
  private browser: StoryBrowser;
  private session?: Session;
  // Character2dId → talk-log icon (optional), fetched with the first episode
  private icons?: Promise<Record<string, string>>;
  private labels: RuntimeLabels;
  private resizeObserver: ResizeObserver;
  private loadSeq = 0;
  private destroyed = false;
  private readonly onViewport = () => this.fit();
  private readonly onFullscreenChange = () => {
    const native = document.fullscreenElement === this.box;
    this.root.classList.toggle("fs", native);
    if (!native) (screen.orientation as { unlock?: () => void } | undefined)?.unlock?.();
    this.syncFullscreenButton();
    this.fit();
  };
  // auto / 早送り / log visibility survive scenario switches
  private modes = { auto: true, fast: false, log: true, mute: false };

  constructor(host: HTMLElement, labels: RuntimeLabels, onPick: (sid: string) => void) {
    this.labels = labels;
    addFonts();
    this.root = document.createElement("div");
    this.root.className = "story-player";
    for (const [k, v] of Object.entries(CSS_SPRITES)) this.root.style.setProperty(k, `url("${storyUrls.ui(v)}")`);
    this.root.dataset.panel = "browser";
    this.root.innerHTML = `<div class="sp-row">
        <div class="sp-stage-box">
          <div class="sp-stage-wrap">
            <canvas class="sp-canvas" width="1280" height="720"></canvas>
            <div class="sp-overlay">
              <div class="sp-loading" hidden></div>
              <div class="sp-status"></div>
              <div class="sp-pick"><span class="beside"></span><span class="below"></span></div>
              <button class="sp-start" hidden></button>
            </div>
          </div>
          <button class="sp-fs-btn" type="button"></button>
        </div>
        <div class="sp-tabs" role="tablist">
          <button type="button" role="tab" data-panel="browser"></button>
          <button type="button" role="tab" data-panel="log"></button>
        </div>
      </div>`;
    host.appendChild(this.root);
    const $ = <T extends HTMLElement>(sel: string) => this.root.querySelector<T>(sel)!;
    this.row = $(".sp-row");
    this.box = $(".sp-stage-box");
    this.wrap = $(".sp-stage-wrap");
    this.fsBtn = $<HTMLButtonElement>(".sp-fs-btn");
    this.overlay = $(".sp-overlay");
    this.loadingEl = $(".sp-loading");
    this.statusEl = $(".sp-status");
    this.pickEl = $(".sp-pick");
    this.startBtn = $<HTMLButtonElement>(".sp-start");
    this.loadingEl.textContent = labels.loading;
    this.startBtn.textContent = labels.start;
    $(".sp-pick .beside").textContent = labels.pickBeside;
    $(".sp-pick .below").textContent = labels.pickBelow;
    for (const tab of this.root.querySelectorAll<HTMLButtonElement>(".sp-tabs button")) {
      tab.textContent = tab.dataset.panel === "log" ? labels.tabLog : labels.tabBrowser;
      tab.addEventListener("click", () => this.showPanel(tab.dataset.panel === "log" ? "log" : "browser"));
    }
    this.syncPanelTabs();
    this.fsBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // not a tap on the story
      void this.toggleFullscreen();
    });
    this.syncFullscreenButton();

    this.app = new PIXI.Application({
      view: $<HTMLCanvasElement>(".sp-canvas") as unknown as HTMLCanvasElement,
      width: 1280,
      height: 720,
      backgroundColor: 0x000000,
      antialias: true,
      autoStart: true,
    });
    this.dialogue = new DialogueBox(this.wrap);
    this.effects = new Effects(this.wrap);
    this.menu = new ScenarioMenu(
      this.wrap,
      {
        onFullscreen: () => void this.toggleFullscreen(),
        onMute: () => {
          this.modes.mute = !this.modes.mute;
          this.audio.setMuted(this.modes.mute);
          this.syncModes();
        },
        onAuto: () => {
          this.modes.auto = !this.modes.auto;
          if (this.session) this.session.player.auto = this.modes.auto;
          this.syncModes();
        },
        onFast: () => {
          this.modes.fast = !this.modes.fast;
          this.session?.player.setFast(this.modes.fast);
          this.syncModes();
        },
        onHideUi: () => this.wrap.classList.add("ui-hidden"),
        onLog: () => {
          this.modes.log = !this.modes.log;
          this.syncModes();
          this.fit();
        },
      },
      labels.menu,
    );
    this.browser = new StoryBrowser(this.row, onPick, () => this.fit(), labels.browser);

    // Stage taps: bring hidden UI back (非表示) or drive the current player.
    this.row.addEventListener(
      "click",
      (e) => {
        if (!this.wrap.classList.contains("ui-hidden") || !this.wrap.contains(e.target as Node)) return;
        this.wrap.classList.remove("ui-hidden");
        e.stopPropagation();
      },
      true,
    );
    this.wrap.addEventListener("click", () => this.session?.player.onClick());

    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(host);
    addEventListener("resize", this.onViewport);
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
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

  /** Font group of the dialogue text ("ja" | "zh" | "ko" | "latin"). */
  setScript(script: string) {
    this.root.dataset.script = script;
  }

  /** Font group of the story browser's titles (they follow the title region). */
  setTitleScript(script: string) {
    this.root.dataset.titles = script;
  }

  // Fit browser + stage + overview into the host (CSS zoom keeps the 1280x720
  // layout). Narrow hosts put the stage on top at full width with the browser
  // and the log as tabs under it; fullscreen fits the stage to the screen.
  private fit() {
    const host = this.root.parentElement;
    if (!host) return;
    const width = host.clientWidth;
    const narrow = width < NARROW;
    this.root.classList.toggle("narrow", narrow);
    let stageZoom = 1;
    if (this.isFullscreen()) {
      this.row.style.zoom = "1";
      stageZoom = Math.min(this.box.clientWidth / 1280, this.box.clientHeight / 720);
    } else if (narrow) {
      this.row.style.zoom = "1";
      stageZoom = Math.min(1, width / 1282);
      // panels: same proportions as on desktop, scaled to the width
      const panelZoom = Math.min(1.25, width / PANEL_WIDTH);
      const panelHeight = Math.min(innerHeight * 0.68, 620) / panelZoom;
      this.root.style.setProperty("--sp-panel-zoom", String(panelZoom));
      this.root.style.setProperty("--sp-panel-height", `${Math.round(panelHeight)}px`);
    } else {
      this.wrap.style.zoom = "1";
      this.row.style.zoom = "1";
      const maxHeight = Math.max(360, innerHeight - this.row.getBoundingClientRect().top - 16);
      const z = Math.min(1, width / this.row.scrollWidth, maxHeight / this.row.scrollHeight);
      this.row.style.zoom = String(Math.max(0.3, z));
    }
    this.wrap.style.zoom = String(stageZoom);
    // keep the prompt / spinner / start button readable on a small stage
    this.overlay.style.zoom = String(stageZoom < 0.6 ? Math.min(2.6, 0.6 / stageZoom) : 1);
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

  isFullscreen() {
    return document.fullscreenElement === this.box || this.root.classList.contains("pseudo-fs");
  }

  /**
   * Native fullscreen on the stage (landscape where the browser lets us lock
   * it); where pages cannot go fullscreen (iPhone Safari) the stage covers the
   * viewport instead, turned sideways while the phone is held upright.
   */
  async toggleFullscreen() {
    if (this.isFullscreen()) {
      if (document.fullscreenElement === this.box) await document.exitFullscreen().catch(() => {});
      this.root.classList.remove("pseudo-fs");
      document.documentElement.classList.remove("story-player-fs-lock");
    } else if (document.fullscreenEnabled && this.box.requestFullscreen) {
      try {
        await this.box.requestFullscreen({ navigationUI: "hide" });
        await (screen.orientation as { lock?: (o: string) => Promise<void> } | undefined)?.lock?.("landscape").catch(() => {});
      } catch {
        this.enterPseudoFullscreen();
      }
    } else {
      this.enterPseudoFullscreen();
    }
    this.syncFullscreenButton();
    this.fit();
  }

  private enterPseudoFullscreen() {
    this.root.classList.add("pseudo-fs");
    document.documentElement.classList.add("story-player-fs-lock");
  }

  private syncFullscreenButton() {
    const on = this.isFullscreen();
    this.menu?.setState({ ...this.modes, fullscreen: on });
    this.fsBtn.innerHTML = on ? ICON_SHRINK : ICON_EXPAND;
    const label = on ? this.labels.exitFullscreen : this.labels.fullscreen;
    this.fsBtn.title = label;
    this.fsBtn.setAttribute("aria-label", label);
  }

  // Mirror auto / 早送り / log onto the AUTO-SKIP sign and the menu buttons.
  private syncModes() {
    this.dialogue.setAuto(this.modes.fast ? "skip" : this.modes.auto ? "auto" : "off");
    this.menu.setState({ ...this.modes, fullscreen: this.isFullscreen() });
    this.session?.log.setVisible(this.modes.log);
  }

  private overlayState(state: "pick" | "loading" | "status" | "start" | "none", status = "") {
    this.overlay.hidden = state === "none";
    this.loadingEl.hidden = state !== "loading";
    this.pickEl.hidden = state !== "pick";
    this.startBtn.hidden = state !== "start";
    this.statusEl.textContent = state === "status" ? status : "";
  }

  /** Overlay spinner while the page fetches the scenario. */
  showLoading() {
    this.overlayState("loading");
  }

  showError(message: string) {
    this.overlayState("status", message);
  }

  private teardown() {
    const s = this.session;
    if (!s) return;
    s.player.stop();
    s.fx.destroy();
    s.stage.destroy();
    s.log.destroy();
    this.session = undefined;
    this.app.stage.removeChildren();
    this.dialogue.reset();
    this.audio.stopVoice();
    this.audio.stopBgm();
  }

  /** Stop playback and ask for an episode. */
  showPick() {
    this.loadSeq++;
    this.teardown();
    this.browser.setCurrent(null);
    this.showPanel("browser");
    this.overlayState("pick");
  }

  /**
   * Tear down the current scenario and set up this one. With `play` it starts
   * as soon as the models are loaded; otherwise it waits for the start button
   * (browsers need a click before playing audio).
   */
  async load(sid: string, scn: ScenarioSceneData, episode: StoryEpisodeContext, play: boolean) {
    const seq = ++this.loadSeq;
    this.teardown();
    this.wrap.classList.remove("ui-hidden");
    this.menu.close();
    this.browser.setCurrent(sid);
    this.showPanel("log"); // narrow layout: follow the lines once an episode is picked
    this.overlayState("loading");
    configureStoryEpisode(episode);
    this.icons ??= fetch(storyUrls.ui("chr_ts/map.json"))
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : {}))
      .catch(() => ({}));
    const icons = await this.icons;
    if (seq !== this.loadSeq) return;

    const stage = new Stage(this.app, buildMotionIndex(scn));
    const player = new ScenarioPlayer(scn, stage, this.dialogue, this.audio, this.effects);
    const log = new ScriptLog(this.row, scn, icons, (i) => void player.jumpTo(i), this.labels.log);
    const fx = new FxManager(this.app.ticker, { bottom: stage.fxBottom, back: stage.fxBack, front: stage.fxLayer, top: stage.fxTop });
    // scenario/effect/<name> particles; Stop becomes ForceStop while fast-forwarding
    player.onScenarioEffect = (name, on) => (on ? void fx.play(name) : fx.stop(name, player.isFast));
    const holo = (id: number) => void fx.play("hologram", () => stage.charFoot(id), `hologram@${id}`);
    player.onCharacterEffect = (id, bundle) => (bundle ? holo(id) : fx.detach((k) => k === `hologram@${id}`));
    // SekaiOut: the transition prefab (EffectLayer, under the white cover)
    player.onSekaiTransition = (anniv) =>
      void fx.play(anniv ? "sekai_transition_3anv" : "sekai_transition").then((i) => setTimeout(() => i?.stop(), 5000)); // DestroyAtTime 5s
    stage.onBackground = (id) => fx.background(id, stage.bgFxLayer);
    player.onEffectsRestore = (names, holos) => {
      fx.clear();
      for (const n of names) void fx.play(n);
      for (const id of holos) holo(id);
    };
    this.session = { sid, player, stage, log, fx };
    player.auto = this.modes.auto;
    player.setFast(this.modes.fast);
    player.onProgress = (i) => log.setProgress(i);
    player.onReady = () => {
      if (this.session?.player === player) this.overlayState("none");
    };
    this.syncModes();
    this.fit();

    const start = async () => {
      this.overlayState("loading");
      try {
        await player.run(); // preloads, fires onReady (hides the overlay), then plays
      } catch (e) {
        console.error(e);
        if (this.session?.player === player) this.showError((e as Error).message);
      }
    };
    if (play) return start();
    if (seq !== this.loadSeq) return;
    // no autoplay permission yet: load now, start on the click
    void player.preload(); // models load in the background meanwhile
    this.overlayState("start");
    this.startBtn.onclick = (e) => {
      e.stopPropagation();
      void start();
    };
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
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
    if (this.root.classList.contains("pseudo-fs")) document.documentElement.classList.remove("story-player-fs-lock");
    if (document.fullscreenElement === this.box) void document.exitFullscreen().catch(() => {});
    this.teardown();
    this.browser.destroy();
    this.app.destroy(false, { children: true, texture: false, baseTexture: false });
    this.root.remove();
  }
}
