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
  /** shown on the stage until an episode is picked (browser beside / above the stage) */
  pickBeside: string;
  pickAbove: string;
}

/** Below this host width the browser and the log stack around the stage. */
const NARROW = 1100;

// Can this page play sound without a click yet? (a silent clip either plays or
// is rejected by the browser's autoplay policy)
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
export const canAutoplay = () =>
  new Audio(SILENT_WAV).play().then(
    () => true,
    () => false,
  );

let fontsAdded = false;
// The game's fonts (FOT-RodinNTLGPro EB = name plate, DB = dialogue body).
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
  private wrap: HTMLElement;
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
  // auto / 早送り / log visibility survive scenario switches
  private modes = { auto: true, fast: false, log: true };

  constructor(host: HTMLElement, labels: RuntimeLabels, onPick: (sid: string) => void) {
    this.labels = labels;
    addFonts();
    this.root = document.createElement("div");
    this.root.className = "story-player";
    for (const [k, v] of Object.entries(CSS_SPRITES)) this.root.style.setProperty(k, `url("${storyUrls.ui(v)}")`);
    this.root.innerHTML = `<div class="sp-row">
        <div class="sp-stage-wrap">
          <canvas class="sp-canvas" width="1280" height="720"></canvas>
          <div class="sp-overlay">
            <div class="sp-loading" hidden></div>
            <div class="sp-status"></div>
            <div class="sp-pick"><span class="beside"></span><span class="above"></span></div>
            <button class="sp-start" hidden></button>
          </div>
        </div>
      </div>`;
    host.appendChild(this.root);
    const $ = <T extends HTMLElement>(sel: string) => this.root.querySelector<T>(sel)!;
    this.row = $(".sp-row");
    this.wrap = $(".sp-stage-wrap");
    this.overlay = $(".sp-overlay");
    this.loadingEl = $(".sp-loading");
    this.statusEl = $(".sp-status");
    this.pickEl = $(".sp-pick");
    this.startBtn = $<HTMLButtonElement>(".sp-start");
    this.loadingEl.textContent = labels.loading;
    this.startBtn.textContent = labels.start;
    $(".sp-pick .beside").textContent = labels.pickBeside;
    $(".sp-pick .above").textContent = labels.pickAbove;

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

  // Fit browser + stage + overview into the host (CSS zoom keeps the 1280x720
  // layout). Narrow hosts stack the browser above and the log below the stage.
  private fit() {
    const host = this.root.parentElement;
    if (!host) return;
    const width = host.clientWidth;
    const narrow = width < NARROW;
    this.root.classList.toggle("narrow", narrow);
    if (narrow) {
      this.row.style.zoom = "1";
      this.wrap.style.zoom = String(Math.min(1, width / 1282));
      return;
    }
    this.wrap.style.zoom = "1";
    this.row.style.zoom = "1";
    const maxHeight = Math.max(360, innerHeight - this.row.getBoundingClientRect().top - 16);
    const z = Math.min(1, width / this.row.scrollWidth, maxHeight / this.row.scrollHeight);
    this.row.style.zoom = String(Math.max(0.3, z));
  }

  // Mirror auto / 早送り / log onto the AUTO-SKIP sign and the menu buttons.
  private syncModes() {
    this.dialogue.setAuto(this.modes.fast ? "skip" : this.modes.auto ? "auto" : "off");
    this.menu.setState(this.modes);
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
    this.teardown();
    this.browser.destroy();
    this.app.destroy(false, { children: true, texture: false, baseTexture: false });
    this.root.remove();
  }
}
