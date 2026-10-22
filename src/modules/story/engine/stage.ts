// Visual stage: background + positioned character models, under a camera.
//
// Layering mirrors the game's ScenarioStudio (Screen-Space-Camera canvas
// rendered by an orthographic ScenarioCamera; UILayer stays outside):
//   studio   — Layer_Scenario: camera pan + ShakeScreen kick; post-effect slot
//              (colour MonotoneColord or camera blur, one at a time)
//   └ root   — ScenarioRoot: CameraZoom about the screen centre + shake offset
//      ├ fxBottom — effects on the Default sorting layer (below the background)
//      ├ bgRoot — backgroundRoot: DollyZoom scale; background quads with the
//      │          UIGaussianBlur / UIDollyZoomEffect material
//      ├ fxBack — effects sorted before the characters (UI order < 220)
//      ├ charLayer — characters (each with ambient colour + model effect filters)
//      ├ fxLayer   — effects in front of the characters
//      └ fxTop     — AreaObject sorting layer
// The talk window, fades, telop and menu are DOM overlays and never move.

import * as PIXI from "pixi.js";
import { CharacterModel, type MotionIndex } from "./assets";
import { storyUrls } from "./urls";
import { modeScale, sideToFraction } from "./types";
import { AMBIENT, EASE, HologramFilter, REF, ScenarioBlurFilter, makeBackground, makeShake } from "./camera";
import { clock, sleep, tween } from "./clock";

// ScenarioStudioCamera.AttachEffect → SetColorEffect(monochrome, toneRatio,
// influence) on the MonotoneColord camera material (constants from 6.8.1):
//   rgb' = lerp(rgb, dot(rgb, monochrome) * toneRatio, influence)
// FlashbackIn/Out toggles "flashback", SepiaIn/Out toggles "sepia".
export type ColorEffect = "flashback" | "sepia" | "grayscale";
const COLOR_EFFECTS: Record<ColorEffect, { mono: number[]; tone: number[]; influence: number }> = {
  sepia: { mono: [0.298912, 0.586611, 0.114478], tone: [1.07, 0.74, 0.43], influence: 0.75 },
  flashback: { mono: [0.5, 0.5, 0.5], tone: [0.5, 0.5, 0.5], influence: 0.5 },
  grayscale: { mono: [0.5, 0.5, 0.5], tone: [0.5, 0.5, 0.5], influence: 1 },
};

// AttachCharacterShader kinds (ScenarioModelView.ModelEffectType 5/6/7)
export type ModelEffect = "hologram" | "monitor" | "blur";

interface StageChar {
  costume: string;
  cm: CharacterModel;
  side: number;
}

interface ModelFx {
  kind: ModelEffect;
  filter: PIXI.Filter;
}

export class Stage {
  readonly studio = new PIXI.Container();
  private root = new PIXI.Container();
  private bgRoot = new PIXI.Container();
  private bgImages = new PIXI.Container();
  readonly bgFxLayer = new PIXI.Container(); // ScenarioBGData.BackgroundPrefab children
  // a background was shown (prefab backgrounds add their animated parts)
  onBackground?: (id: string) => void;
  readonly charLayer = new PIXI.Container();
  readonly fxLayer = new PIXI.Container();
  readonly fxBottom = new PIXI.Container();
  readonly fxBack = new PIXI.Container();
  readonly fxTop = new PIXI.Container();
  private bg?: PIXI.Mesh;
  private bgIncoming?: PIXI.Mesh; // mid-crossfade background (dropped by a jump)
  private chars = new Map<number, StageChar>();
  private modelCache = new Map<string, CharacterModel>(); // preloaded by costume
  private modelFx = new Map<CharacterModel, ModelFx>(); // effect lives on the costume's model
  private ambient = 12;
  private ambientFilter?: PIXI.ColorMatrixFilter;
  private layoutMode = 0; // CharacterLayoutMode: 0=Default(2-char), 3=Three
  private dead = false; // destroy()ed by a scenario switch
  readonly w: number;
  readonly h: number;

  // camera state (ref units, Unity y-up)
  private cam = { x: 0, y: 0, zoom: 1 };
  private kick = 0; // Layer_Scenario anchoredPosition.y (ShakeScreen)
  private shakeOff: [number, number] = [0, 0]; // ScenarioRoot offset (ShakeScreen)
  private camTween = 0;
  private zoomTween = 0;
  private shakeToken = 0;
  // background material state
  private bgBlur = false;
  private dolly = { scale: 1, blur: 0, dist: 0, on: false };
  private dollyTween = 0;
  private post: PIXI.Filter | null = null;
  private blurFilter?: ScenarioBlurFilter;
  private blurToken = 0;

  private app: PIXI.Application;
  private midx: MotionIndex;
  constructor(
    app: PIXI.Application,
    midx: MotionIndex,
  ) {
    this.app = app;
    this.midx = midx;
    this.w = app.renderer.width;
    this.h = app.renderer.height;
    app.stage.addChild(this.studio);
    this.studio.addChild(this.root);
    this.root.pivot.set(this.w / 2, this.h / 2);
    this.bgRoot.pivot.set(this.w / 2, this.h / 2);
    this.bgRoot.position.set(this.w / 2, this.h / 2);
    this.bgRoot.addChild(this.bgImages, this.bgFxLayer);
    this.root.addChild(this.fxBottom, this.bgRoot, this.fxBack, this.charLayer, this.fxLayer, this.fxTop);
    this.applyCam();
    app.ticker.add(this.tick, this);
  }

  // hologram flicker (Live2DHologramController.Update)
  private tick() {
    const dt = this.app.ticker.deltaMS / 1000;
    for (const [cm, fx] of this.modelFx)
      if (fx.filter instanceof HologramFilter) {
        fx.filter.update(dt);
        const b = (cm.display as any).getBounds();
        fx.filter.setModelRect(b.x, b.y, b.height);
      }
  }

  setLayoutMode(mode: number) {
    if (mode === this.layoutMode) return;
    this.layoutMode = mode;
    this.relayout(); // reposition + rescale on-stage characters for the new mode
  }

  // Preload every appearing costume's model up front (matches the game loading
  // NeedBundleNames before play), so an Apper is just a fade — not a load stall.
  // All costumes load in parallel; a model that arrives after destroy() is freed.
  async preloadAll(costumes: { Character2dId: number; CostumeType: string }[]) {
    const uniq = new Map(costumes.filter((c) => c.CostumeType).map((c) => [c.CostumeType, c]));
    await Promise.all(
      [...uniq.values()].map(async (c) => {
        try {
          const cm = await CharacterModel.load(c.CostumeType, c.Character2dId, this.midx);
          await cm.preloadMotions();
          if (this.dead) return cm.destroy();
          (cm.display as any).alpha = 0;
          this.modelCache.set(c.CostumeType, cm);
        } catch (e) {
          console.warn("preload failed", c.CostumeType, (e as Error).message);
        }
      }),
    );
  }

  private async getModel(costume: string, char2dId: number): Promise<CharacterModel> {
    const cached = this.modelCache.get(costume);
    if (cached) return cached;
    const cm = await CharacterModel.load(costume, char2dId, this.midx);
    await cm.preloadMotions();
    this.modelCache.set(costume, cm);
    return cm;
  }

  // ── background ────────────────────────────────────────────────────────────
  // The first candidate that loads (plain / startapp / prefab base image).
  private async loadBgTexture(id: string): Promise<PIXI.Texture> {
    const urls = storyUrls.background(id);
    for (const url of urls) {
      const tex = await this.loadTexture(url);
      if (tex) return tex;
    }
    console.warn("bg load failed", id);
    return PIXI.Texture.EMPTY;
  }

  private loadTexture(url: string): Promise<PIXI.Texture | null> {
    const tex = PIXI.Texture.from(url, { resourceOptions: { crossorigin: true } } as any);
    if (tex.baseTexture.valid) return Promise.resolve(tex);
    return new Promise((resolve) => {
      let done = false;
      const fin = (ok: boolean) => {
        if (done) return;
        done = true;
        if (!ok) PIXI.Texture.removeFromCache(tex);
        resolve(ok ? tex : null);
      };
      tex.baseTexture.once("loaded", () => fin(true));
      tex.baseTexture.once("error", () => fin(false));
      setTimeout(() => fin(tex.baseTexture.valid), 5000); // don't hang the timeline on a bad bg
    });
  }

  private makeBg(tex: PIXI.Texture) {
    const m = makeBackground(tex);
    m.position.set(this.w / 2, this.h / 2);
    m.scale.set(Stage.BG_ZOOM * Math.max(this.w / (tex.width || this.w), this.h / (tex.height || this.h)));
    this.applyBgMaterial(m);
    return m;
  }

  // Non-blocking: never gate the timeline on the (large) background image.
  setBackground(id: string) {
    if (!id) return;
    const epoch = clock.epoch;
    for (const b of [this.bg, this.bgIncoming]) if (b) this.bgImages.removeChild(b);
    this.bg = this.bgIncoming = undefined;
    this.onBackground?.(id);
    void this.loadBgTexture(id).then((tex) => {
      if (epoch !== clock.epoch || this.dead) return;
      const m = this.makeBg(tex);
      if (this.bg) this.bgImages.removeChild(this.bg);
      this.bgImages.addChildAt(m, 0);
      this.bg = m;
    });
  }

  // ChangeBackground (SpecialEffect 7): load the new bg, then swap. Crossfade
  // over `ms` if >0, else instant. Gates on the load (resolves when swapped).
  async changeBackground(id: string, ms: number) {
    if (!id) return;
    const epoch = clock.epoch;
    const tex = await this.loadBgTexture(id);
    if (epoch !== clock.epoch || this.dead) return; // a jump replaced the background meanwhile
    const m = this.makeBg(tex);
    const old = this.bg;
    if (ms > 0 && old) {
      m.alpha = 0;
      this.bgImages.addChild(m); // above old bg
      this.bgIncoming = m;
      await tween(ms, 0, 1, (v) => (m.alpha = v));
      this.bgIncoming = undefined;
      this.bgImages.removeChild(old);
    } else {
      if (old) this.bgImages.removeChild(old);
      this.bgImages.addChildAt(m, 0);
    }
    this.bg = m;
    this.onBackground?.(id);
  }

  // UIDollyZoomEffect replaces UIGaussianBlur while active; clearing restores it.
  private applyBgMaterial(m?: PIXI.Mesh) {
    const sampling = this.dolly.on ? this.dolly.blur : this.bgBlur ? 2.8 : 0;
    const dist = this.dolly.on ? this.dolly.dist : 0;
    for (const b of m ? [m] : [this.bg, this.bgIncoming]) {
      if (!b) continue;
      b.shader.uniforms.uSampling = sampling;
      b.shader.uniforms.uDist = dist;
    }
  }

  // BackGroundBlur (44): instant on/off
  setBackgroundBlur(on: boolean) {
    this.bgBlur = on;
    this.applyBgMaterial();
  }

  // DollyZoom (45): background scale + material blur/distortion, never blocks.
  dollyZoom(p: { zoom?: number; blur?: number; dist?: number }, ms: number, ease: (t: number) => number) {
    if (p.zoom == null) return;
    const dist = p.dist != null ? p.dist * (1 - p.zoom) : 0;
    const clear = !(p.blur != null && p.blur > 0) && dist === 0;
    const token = ++this.dollyTween;
    const s0 = this.bgRoot.scale.x;
    const b0 = this.dolly.blur;
    const d0 = this.dolly.dist;
    const target = { blur: clear ? 0 : (p.blur ?? 0), dist: clear ? 0 : dist };
    if (!clear) this.dolly.on = true;
    void tween(ms, 0, 1, (k) => {
      if (token !== this.dollyTween) return;
      this.dolly.scale = s0 + (p.zoom! - s0) * k;
      this.bgRoot.scale.set(this.dolly.scale);
      if (!clear) {
        this.dolly.blur = b0 + (target.blur - b0) * k;
        this.dolly.dist = d0 + (target.dist - d0) * k;
        this.applyBgMaterial();
      }
    }, ease);
    if (clear) {
      this.dolly = { scale: this.dolly.scale, blur: 0, dist: 0, on: false };
      this.applyBgMaterial();
    }
  }

  // ── camera ────────────────────────────────────────────────────────────────
  private applyCam() {
    this.studio.position.set(-this.cam.x * REF, (this.cam.y - this.kick) * REF);
    this.root.scale.set(this.cam.zoom);
    this.root.position.set(this.w / 2 + this.shakeOff[0] * REF, this.h / 2 - this.shakeOff[1] * REF);
  }

  // CameraMove (42): DOLocalMove OutQuad; screen = zoom·p − cam
  cameraMove(x: number, y: number, ms: number) {
    const token = ++this.camTween;
    const x0 = this.cam.x;
    const y0 = this.cam.y;
    return tween(ms, 0, 1, (k) => {
      if (token !== this.camTween) return;
      this.cam.x = x0 + (x - x0) * k;
      this.cam.y = y0 + (y - y0) * k;
      this.applyCam();
    }, EASE.OutQuad);
  }

  // CameraZoom (43): DOScale(ScenarioRoot) OutQuad about the screen centre
  cameraZoom(z: number, ms: number) {
    const token = ++this.zoomTween;
    const z0 = this.cam.zoom;
    return tween(ms, z0, z, (v) => {
      if (token !== this.zoomTween) return;
      this.cam.zoom = v;
      this.applyCam();
    }, EASE.OutQuad);
  }

  // ShakeScreen (5): (0,−8) kick on Layer_Scenario easing back + DOShakePosition
  // on ScenarioRoot (10, vibrato 16, fadeOut). ≥3600 s = endless, no fade, kick held.
  shakeScreen(seconds: number): Promise<void> {
    this.stopShakeScreen();
    const token = ++this.shakeToken;
    const epoch = clock.epoch;
    const endless = seconds >= 3600;
    const dur = endless ? 3600 : seconds;
    const shake = makeShake(dur, 10, 16, 90, !endless, false);
    this.kick = 8;
    const t0 = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        if (token !== this.shakeToken || epoch !== clock.epoch) return resolve();
        const t = ((Date.now() - t0) / 1000) * clock.scale;
        this.shakeOff = shake(t);
        if (!endless) this.kick = 8 * (1 - EASE.OutQuad(Math.min(1, t / dur)));
        this.applyCam();
        if (t < dur) setTimeout(tick, 16);
        else {
          this.stopShakeScreen();
          resolve();
        }
      };
      if (endless) resolve(); // finishes the snippet immediately
      tick();
    });
  }
  stopShakeScreen() {
    this.shakeToken++;
    this.kick = 0;
    this.shakeOff = [0, 0];
    this.applyCam();
  }

  // ── post effect slot (colour or blur) ─────────────────────────────────────
  private setPost(f: PIXI.Filter | null) {
    this.post = f;
    this.studio.filters = f ? [f] : null;
    this.studio.filterArea = f ? this.app.screen : (null as any);
  }

  // Camera colour effect over background + characters (UI is not affected).
  setColorEffect(kind?: ColorEffect) {
    if (!kind) {
      if (!(this.post instanceof ScenarioBlurFilter)) this.setPost(null);
      return;
    }
    const { mono, tone, influence: k } = COLOR_EFFECTS[kind];
    const f = new PIXI.ColorMatrixFilter();
    const row = (c: number) => [0, 1, 2].map((j) => (c === j ? 1 - k : 0) + k * tone[c] * mono[j]);
    const m: number[] = [...row(0), 0, 0, ...row(1), 0, 0, ...row(2), 0, 0, 0, 0, 0, 1, 0];
    f.matrix = m as PIXI.ColorMatrix;
    this.setPost(f);
  }

  // BlurIn (38) / BlurOut (39): spread 0↔3 driven by min(OutQuad(p)/d, 1)
  // (ScenarioStudioCamera quirk), replaces any colour effect; BlurOut ends at None.
  cameraBlur(into: boolean, seconds: number) {
    const f = (this.blurFilter ??= new ScenarioBlurFilter());
    this.setPost(f);
    const token = ++this.blurToken;
    const d = Math.max(seconds, 1e-6);
    return tween(seconds * 1000, 0, 1, (p) => {
      if (token !== this.blurToken) return;
      const x = Math.min(EASE.OutQuad(p) / d, 1);
      f.spread = into ? 3 * x : 3 - 3 * x;
    }).then(() => {
      if (!into && token === this.blurToken) this.setPost(null);
    });
  }

  // ── characters ────────────────────────────────────────────────────────────
  private placeX(side: number, offsetX: number) {
    // game offsetX is in 1920-ref canvas units → scale to our width. Side
    // positions sit at 0.96 of the layout-map distance from the centre in the
    // game (measured on a 1600x900 JP 7.1.0 capture of event_107_01).
    const x = this.w * sideToFraction(side, this.layoutMode) + (offsetX / 1920) * this.w;
    return this.w / 2 + (x - this.w / 2) * Stage.SIDE_SPREAD;
  }

  // Character framing. The game scales ∝ screen height (UpdateCurrentScale:
  // currentScale = contentSize.y·baseScale/1024); pjsk frames characters tight
  // ("telephoto", roughly head-to-hip), not full-body. ZOOM = model height as a
  // multiple of stage height; CENTER_Y keeps the head near the top.
  // Calibrated against the game (JP 7.1.0, event_107_01, An and Mizuki faces
  // matched at corr 0.95): models are 1.19x the earlier 1.75 framing, scaled
  // about face height, so the anchor moves down to keep the faces in place.
  private static readonly ZOOM = 2.08;
  private static readonly CENTER_Y = 0.811;
  private static readonly SIDE_SPREAD = 0.96;
  // Backgrounds are drawn 1.21x larger than "cover" (2048x1261 textures; the
  // classroom background matched the game at corr 0.94, centred).
  private static readonly BG_ZOOM = 1.21;

  private fitModel(d: any, side: number, offsetX: number) {
    const b = d.getLocalBounds();
    const targetH = this.h * Stage.ZOOM * modeScale(this.layoutMode);
    d.scale.set(targetH / b.height);
    d.anchor?.set?.(0.5, 0.5);
    d.position.set(this.placeX(side, offsetX), this.h * Stage.CENTER_Y);
  }

  // Reposition + rescale all on-stage characters for the current layout mode
  // (called when CharacterLayoutMode switches Default<->Three).
  private relayout() {
    for (const sc of this.chars.values()) this.fitModel(sc.cm.display as any, sc.side, 0);
  }

  private addModel(cm: CharacterModel) {
    this.charLayer.addChild(cm.display as any);
    this.refreshFilters(cm);
  }

  // Apper(2): ensure model for costume, place at side, play motion/facial, fade in.
  // Empty costume (70% of Appers in real scenarios) = re-show the character's
  // existing model. Models are kept alive across Hide so this works.
  async appear(char2dId: number, costume: string, side: number, offsetX: number, motion: string, facial: string) {
    const sc = this.chars.get(char2dId);
    if (!costume || (sc && sc.costume === costume)) {
      if (!sc) return; // empty costume but never appeared — nothing to show
      return this.showExisting(sc, side, offsetX, motion, facial);
    }
    // New / changed costume: get the (preloaded) model, then swap out the old.
    const epoch = clock.epoch;
    const cm = await this.getModel(costume, char2dId);
    if (epoch !== clock.epoch) return; // a jump rebuilt the stage meanwhile
    const d = cm.display as any;
    d.alpha = 0;
    this.addModel(cm);
    this.fitModel(d, side, offsetX);
    if (sc) this.charLayer.removeChild(sc.cm.display as any); // keep old in cache
    this.chars.set(char2dId, { costume, cm, side });
    // pose first (no fade-in from the default T-pose), show once it has rendered
    await cm.playInstant(motion, facial);
    await sleep(34);
    await tween(100, 0, 1, (v) => (d.alpha = v)); // 0.1s appear fade
  }

  // Apper with SideFrom != SideTo: slide in from off-screen (e.g. Mizuki enters
  // from RightOver → RightInside). Placed at `from` visible, then tweened to `to`.
  async appearSlide(
    char2dId: number,
    costume: string,
    sideFrom: number,
    offFrom: number,
    sideTo: number,
    offTo: number,
    ms: number,
    motion: string,
    facial: string,
  ) {
    let sc = this.chars.get(char2dId);
    if (!costume) {
      if (!sc) return; // empty costume = re-show the existing model; none yet
      costume = sc.costume;
    }
    const fresh = !sc || sc.costume !== costume;
    if (!sc || sc.costume !== costume) {
      const epoch = clock.epoch;
      const cm = await this.getModel(costume, char2dId);
      if (epoch !== clock.epoch) return;
      (cm.display as any).alpha = 0;
      this.addModel(cm);
      if (sc) this.charLayer.removeChild(sc.cm.display as any);
      sc = { costume, cm, side: sideTo };
      this.chars.set(char2dId, sc);
    }
    const d = sc.cm.display as any;
    this.fitModel(d, sideFrom, offFrom); // scale + place at the off-screen start
    sc.side = sideTo;
    if (fresh) {
      await sc.cm.playInstant(motion, facial); // no T-pose frame while sliding in
      await sleep(34);
    } else sc.cm.play(motion, facial);
    d.alpha = 1;
    // the game finishes the Apper on the ~0.1s fade; the slide runs async
    void tween(ms, this.placeX(sideFrom, offFrom), this.placeX(sideTo, offTo), (v) => (d.position.x = v));
    await sleep(100);
  }

  private async showExisting(sc: StageChar, side: number, offsetX: number, motion: string, facial: string) {
    const d = sc.cm.display as any;
    sc.side = side;
    this.fitModel(d, side, offsetX); // reposition (+ rescale for current mode)
    this.charLayer.addChild(d); // raise to top
    this.refreshFilters(sc.cm);
    if (d.alpha < 0.01) {
      // hidden: pose before it shows (no default-pose frame during the fade)
      const epoch = clock.epoch;
      await sc.cm.playInstant(motion, facial);
      if (epoch !== clock.epoch) return;
    } else sc.cm.play(motion, facial);
    if (d.alpha < 1) await tween(200, d.alpha, 1, (v) => (d.alpha = v));
  }

  // Hide(3): keep the model (a later empty-costume Apper re-shows it), just fade out.
  async hide(char2dId: number) {
    const sc = this.chars.get(char2dId);
    if (!sc) return;
    const d = sc.cm.display as any;
    await tween(100, d.alpha, 0, (v) => (d.alpha = v)); // 0.1s hide fade
  }

  async move(char2dId: number, toSide: number, offsetX: number, ms: number) {
    const sc = this.chars.get(char2dId);
    if (!sc) return;
    const d = sc.cm.display as any;
    sc.side = toSide;
    await tween(ms, d.position.x, this.placeX(toSide, offsetX), (v) => (d.position.x = v));
  }

  async shake(char2dId: number, axis: "x" | "y") {
    const sc = this.chars.get(char2dId);
    if (!sc) return;
    const d = sc.cm.display as any;
    const base = axis === "x" ? d.position.x : d.position.y;
    for (let i = 0; i < 3; i++) {
      const off = (i % 2 === 0 ? 1 : -1) * 14;
      await tween(45, base, base + off, (v) => (axis === "x" ? (d.position.x = v) : (d.position.y = v)));
    }
    if (axis === "x") d.position.x = base;
    else d.position.y = base;
  }

  // Movie (19): every shown character is hidden instantly first.
  hideAll() {
    for (const sc of this.chars.values()) (sc.cm.display as any).alpha = 0;
  }

  // Apply motion/facial to an already-present character (CharacterMotion / Talk).
  applyMotionFacial(char2dId: number, motion: string, facial: string) {
    this.chars.get(char2dId)?.cm.play(motion, facial);
  }

  // Lip-sync: set a character's mouth target (smoothed onto ParamMouthOpenY),
  // or null to release the mouth back to the expression.
  setLipTarget(char2dId: number, t: number | null) {
    this.chars.get(char2dId)?.cm.setLipTarget(t);
  }

  // ModelView pivot (bottom centre of the character's view, at the screen
  // bottom in the default framing) in effect space (ref px, y-up, origin at the
  // screen centre), following the character's own x / y offset; for attached
  // effects such as the hologram particles.
  // The view's localScale ((1080/1024)·baseScale) multiplies the effect's offsets.
  private static readonly VIEW_SCALE = 1080 / 1024;
  charFoot(char2dId: number): { x: number; y: number; scale: number; visible: boolean } | null {
    const sc = this.chars.get(char2dId);
    if (!sc) return null;
    const d = sc.cm.display as any;
    return {
      x: (d.position.x - this.w / 2) / REF,
      y: -540 - (d.position.y - this.h * Stage.CENTER_Y) / REF,
      scale: Stage.VIEW_SCALE * modeScale(this.layoutMode),
      visible: d.alpha > 0.01 && d.parent === this.charLayer,
    };
  }

  // ── character colour / shader ─────────────────────────────────────────────
  // AmbientColor (12/13/14): multiply on characters only, instant; the
  // player resets it to Normal when a ChangeBackground completes.
  setAmbient(type: number) {
    this.ambient = AMBIENT[type] ? type : 12;
    const [r, g, b] = AMBIENT[this.ambient];
    if (this.ambient === 12) this.ambientFilter = undefined;
    else {
      const f = new PIXI.ColorMatrixFilter();
      f.matrix = [r, 0, 0, 0, 0, 0, g, 0, 0, 0, 0, 0, b, 0, 0, 0, 0, 0, 1, 0] as PIXI.ColorMatrix;
      this.ambientFilter = f;
    }
    for (const sc of this.chars.values()) this.refreshFilters(sc.cm);
  }
  get ambientType() {
    return this.ambient;
  }

  // AttachCharacterShader (22): hologram / monitor / blur on that character's
  // current model; no-op if it already has that kind.
  attachModelEffect(char2dId: number, kind: ModelEffect, intensity = 1) {
    const sc = this.chars.get(char2dId);
    if (!sc || this.modelFx.get(sc.cm)?.kind === kind) return;
    let filter: PIXI.Filter;
    if (kind === "blur") {
      const b = Math.min(3, Math.max(1, intensity)); // Live2DBlurController clamp
      filter = new PIXI.BlurFilter(b * b * REF, 2);
    } else filter = new HologramFilter();
    this.modelFx.set(sc.cm, { kind, filter });
    this.refreshFilters(sc.cm);
  }
  // "none": DetachModelEffect removes the shader effect from every character
  detachModelEffects() {
    const cms = [...this.modelFx.keys()];
    this.modelFx.clear();
    for (const cm of cms) this.refreshFilters(cm);
  }
  modelEffectOf(char2dId: number): ModelEffect | undefined {
    const sc = this.chars.get(char2dId);
    return sc ? this.modelFx.get(sc.cm)?.kind : undefined;
  }

  private refreshFilters(cm: CharacterModel) {
    const fs = [this.ambientFilter, this.modelFx.get(cm)?.filter].filter(Boolean) as PIXI.Filter[];
    (cm.display as any).filters = fs.length ? fs : null;
  }

  // ── jump / teardown ───────────────────────────────────────────────────────
  // Jump: drop every on-stage character (models stay cached for reuse).
  clear() {
    for (const sc of this.chars.values()) this.charLayer.removeChild(sc.cm.display as any);
    this.chars.clear();
  }

  // Jump: camera, background material and post effects back to defaults.
  resetView() {
    this.camTween++;
    this.zoomTween++;
    this.dollyTween++;
    this.blurToken++;
    this.stopShakeScreen();
    this.cam = { x: 0, y: 0, zoom: 1 };
    this.applyCam();
    this.bgBlur = false;
    this.dolly = { scale: 1, blur: 0, dist: 0, on: false };
    this.bgRoot.scale.set(1);
    this.applyBgMaterial();
    this.setPost(null);
    this.modelFx.clear();
    this.setAmbient(12);
  }

  // Jump: apply a replayed camera / background state instantly.
  restoreView(v: { cam: { x: number; y: number; zoom: number }; bgBlur: boolean; dolly?: { zoom?: number; blur?: number; dist?: number } }) {
    this.cam = { ...v.cam };
    this.applyCam();
    this.bgBlur = v.bgBlur;
    if (v.dolly) this.dollyZoom(v.dolly, 0, EASE.Linear);
    this.applyBgMaterial();
  }

  // Jump: put a character straight into its replayed state — posed, placed,
  // shown (or kept hidden so a later empty-costume Apper can re-show it).
  async place(char2dId: number, costume: string, side: number, offsetX: number, motion: string, facial: string, visible: boolean) {
    const epoch = clock.epoch;
    const cm = await this.getModel(costume, char2dId);
    if (epoch !== clock.epoch) return;
    const d = cm.display as any;
    d.alpha = 0;
    this.addModel(cm);
    this.fitModel(d, side, offsetX);
    this.chars.set(char2dId, { costume, cm, side });
    await cm.playInstant(motion, facial); // posed even while hidden
    if (epoch !== clock.epoch || !visible) return;
    d.alpha = 1;
  }

  // Scenario switch: drop the stage and free every loaded model.
  destroy() {
    this.dead = true;
    this.app.ticker.remove(this.tick, this);
    this.clear();
    for (const cm of this.modelCache.values()) cm.destroy();
    this.modelCache.clear();
    this.app.stage.removeChild(this.studio);
    this.studio.destroy({ children: true });
  }

  has(char2dId: number) {
    return this.chars.has(char2dId);
  }
}

export { sleep };
