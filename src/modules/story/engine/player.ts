// ScenarioPlayer — faithful reimplementation of the game's Sekai.ScenarioPlayer
// timeline (reverse-engineered from the il2cpp coroutines).
//
// Model (NOT "await-or-fire"): every snippet's action runs in PARALLEL and is
// tracked in an in-flight set `executeSnippets`. Before starting snippet i a
// per-snippet BARRIER runs: ProgressBehavior==Now → proceed immediately;
// ==WaitFinished → wait until the in-flight set is empty (all PRIOR actions
// done). Each action consumes its own `Delay` at its start, then runs, then
// calls FinishSnippet (leaves the in-flight set) at a time that depends on the
// action type — that timing is what gates a downstream WaitFinished snippet:
//   Sound      → immediately (SE/BGM ring out async, never gate)
//   Talk       → only when the talk window closes (auto-advance / tap)
//   ChangeMotion→ immediately (motion plays async)
//   Layout     → after its appear/move/hide/shake animation (gates)
//   None       → immediately
//
// Jump (progress list click): every wait/tween of the old run is cancelled via
// the shared clock epoch, the stage is rebuilt from a replay of snippets
// [0, target) (background, BGM, layout mode, fades, who stands where with
// which motion/facial), then the timeline continues from the target snippet.
// 早送り (fast-forward): text appears at once, no voice, line held 0.5s, and
// every other wait/fade/move runs at FAST_SCALE (clock.scale).

import { AudioManager } from "./audio";
import { storyUrls } from "./urls";
import { cancelAll, clock, sleep } from "./clock";
import { DialogueBox } from "./dialogue";
import { parseDolly, parseEase } from "./camera";
import { Effects, type RGBA } from "./effects";
import { Stage, type ColorEffect, type ModelEffect } from "./stage";
import {
  Action,
  LayoutType,
  Progress,
  SoundPlayMode,
  SpecialEffectType,
  enumName,
  type ScenarioSceneData,
  type Snippet,
  type SnippetTalk,
} from "./types";

// MoveSpeedType Normal/Fast/Slow (seconds in-game: 0.5 / 0.33 / 0.75).
const MOVE_MS = [500, 330, 750];

// TalkWindow constants (from ShowWords_d__95).
const AUTO_PAGE_DELAY = 2000; // TalkWindow.prefab autoTextNextPageDelay: no voice, or voice already ended at typing-end
const AUTO_POST_VOICE = 500; // after the voice clip ends
const VOICE_CAP = 30000; // give up waiting for a voice after this
// 早送り: in-game capture advances a line every ~0.5-1s with the text shown at once.
const FAST_SCALE = 3;
const FAST_PAGE_HOLD = 500 * FAST_SCALE; // → 0.5s real time at FAST_SCALE

// Stage state reconstructed for a jump.
interface PlacedChar {
  costume: string;
  side: number;
  offsetX: number;
  motion: string;
  facial: string;
  visible: boolean;
}
interface ReplayState {
  bg: string;
  bgm: string;
  bgmVolume?: number;
  layoutMode: number;
  fade: RGBA;
  colorEffect?: ColorEffect;
  ambient: number;
  cam: { x: number; y: number; zoom: number };
  bgBlur: boolean;
  dolly?: { zoom?: number; blur?: number; dist?: number };
  shakeScreen: boolean; // an endless ShakeScreen is running
  shakeWindow: boolean;
  sideCover?: string; // a side fade "Out" left the panel covering
  modelFx: Map<number, { kind: ModelEffect; intensity: number }>;
  holo: Set<number>; // characters carrying the hologram particles
  effects: string[]; // scenario effects played and not stopped yet
  chars: Map<number, PlacedChar>;
}

const SIDE_FADES: Record<number, string> = {
  [SpecialEffectType.LeftIn]: "LeftIn",
  [SpecialEffectType.LeftOut]: "LeftOut",
  [SpecialEffectType.RightIn]: "RightIn",
  [SpecialEffectType.RightOut]: "RightOut",
  [SpecialEffectType.TopIn]: "TopIn",
  [SpecialEffectType.TopOut]: "TopOut",
  [SpecialEffectType.BottomIn]: "BottomIn",
  [SpecialEffectType.BottomOut]: "BottomOut",
};

interface InFlight {
  status: number; // SnippetParam.Status; 2 = flushed by talk-window close
}

export class ScenarioPlayer {
  private autoMode = true;
  private fast = false;
  private gen = 0; // bumped by jumpTo(); coroutines of an older run bail out
  private finished?: () => void; // resolves run() when the live run reaches the end
  private stopped = false;
  private preloading?: Promise<void>;
  private executeSnippets = new Map<Snippet, InFlight>();
  private skipMode = false;
  private inputtedWaitSkip = false;
  private pendingAdvance?: () => void;
  private lipTimer?: ReturnType<typeof setInterval>;
  private motionTimers: ReturnType<typeof setTimeout>[] = [];
  private speakers: number[] = [];
  onProgress?: (i: number, total: number, label: string) => void;
  // particle effects (scenario/effect/<name>) are driven by the host
  onScenarioEffect?: (name: string, play: boolean) => Promise<void> | void;
  onCharacterEffect?: (char2dId: number, bundle: string | null) => void;
  onSekaiTransition?: (anniversary: boolean) => void;
  onEffectsRestore?: (effects: string[], hologram: number[]) => void; // after a jump
  onReady?: () => void; // fired after preload, before the first snippet

  private scn: ScenarioSceneData;
  private stage: Stage;
  private dialogue: DialogueBox;
  private audio: AudioManager;
  private effects: Effects;
  constructor(
    scn: ScenarioSceneData,
    stage: Stage,
    dialogue: DialogueBox,
    audio: AudioManager,
    effects: Effects,
  ) {
    this.scn = scn;
    this.stage = stage;
    this.dialogue = dialogue;
    this.audio = audio;
    this.effects = effects;
  }

  get auto() {
    return this.autoMode;
  }
  // Turning auto on while a line waits for a tap advances it.
  set auto(on: boolean) {
    this.autoMode = on;
    if (on) this.advance();
  }
  get isFast() {
    return this.fast;
  }
  setFast(on: boolean) {
    this.fast = on;
    clock.scale = on ? FAST_SCALE : 1;
    if (!on) return;
    this.audio.stopVoice();
    this.dialogue.skipTyping();
    this.advance();
  }
  private advance() {
    const f = this.pendingAdvance;
    this.pendingAdvance = undefined;
    f?.();
  }

  private nextFrame() {
    return sleep(16);
  }
  private finishSnippet(s: Snippet) {
    this.executeSnippets.delete(s);
  }

  // Stage click: first click completes the typewriter, next click advances a Talk.
  onClick() {
    if (this.dialogue.isTyping()) this.dialogue.skipTyping();
    else this.advance();
  }

  async run() {
    this.stage.setLayoutMode(this.scn.FirstCharacterLayoutMode ?? 0);
    this.stage.setBackground(this.scn.FirstBackground); // non-blocking
    // Load every appearing costume up front (game loads NeedBundleNames before
    // play) so Appers are instant fades, not load stalls.
    await this.preload();
    if (this.stopped) return;
    this.onReady?.();
    // resolves when whichever run is current (the first, or one started by a
    // jump) reaches the end of the scenario
    await new Promise<void>((resolve) => {
      this.finished = resolve;
      void this.playFrom(0, this.gen);
    });
  }

  private async playFrom(start: number, gen: number) {
    if (start === 0) {
      if (this.scn.FirstBgm) this.audio.playBgm(storyUrls.bgm(this.scn.FirstBgm), 0.7);
      for (const l of this.scn.FirstLayout || []) {
        await this.stage.appear(
          l.Character2dId,
          l.CostumeType,
          l.PositionSide,
          l.OffsetX,
          l.MotionName,
          l.FacialName,
        );
        if (gen !== this.gen) return;
      }
      await sleep(167); // ~10-frame startup beat before snippet[0] (PlayCore states 0/1)
    }
    const snippets = this.scn.Snippets;
    for (let seq = start; seq < snippets.length; seq++) {
      const s = snippets[seq];
      await this.waitOtherFinished(s); // BARRIER (consumer-side)
      if (gen !== this.gen) return;
      const param: InFlight = { status: 0 };
      this.executeSnippets.set(s, param); // mark in-flight AFTER the barrier
      this.onProgress?.(seq, snippets.length, enumName(Action, s.Action) ?? String(s.Action));
      void this.runAction(s, param, gen); // start the action in PARALLEL — not awaited
    }
    await this.waitAllFinished(); // end-of-scenario drain
    if (gen === this.gen) this.finished?.();
  }

  // Load every costume (run() awaits this too; call early to load before play).
  preload() {
    return (this.preloading ??= this.stage.preloadAll(this.scn.AppearCharacters));
  }

  // Scenario switch: end this player for good (its run() resolves).
  stop() {
    this.stopped = true;
    this.gen++;
    cancelAll();
    this.executeSnippets = new Map();
    this.pendingAdvance = undefined;
    this.stopLipSync();
    for (const tm of this.motionTimers) clearTimeout(tm);
    this.motionTimers = [];
    this.audio.stopVoice();
    this.audio.stopBgm();
    this.dialogue.reset();
    this.effects.reset([0, 0, 0, 0]);
    const f = this.finished;
    this.finished = undefined;
    f?.();
  }

  // ── jump ─────────────────────────────────────────────────────────────────
  // Restart the timeline at snippet `seq` with the stage rebuilt as it would be
  // after snippets [0, seq). Only valid once run() has preloaded the models.
  async jumpTo(seq: number) {
    if (!this.finished || seq < 0 || seq >= this.scn.Snippets.length) return;
    const gen = ++this.gen;
    cancelAll();
    this.executeSnippets = new Map();
    this.pendingAdvance = undefined;
    this.inputtedWaitSkip = false;
    this.stopLipSync();
    for (const tm of this.motionTimers) clearTimeout(tm);
    this.motionTimers = [];
    this.audio.stopVoice();
    this.dialogue.reset();

    const st = this.replay(seq);
    this.stage.clear();
    this.stage.resetView();
    this.stage.setLayoutMode(st.layoutMode);
    this.stage.setBackground(st.bg);
    this.stage.restoreView(st);
    this.effects.reset(st.fade, st.sideCover);
    this.stage.setColorEffect(st.colorEffect);
    this.stage.setAmbient(st.ambient);
    if (st.bgm) this.audio.playBgm(storyUrls.bgm(st.bgm), 0.7, 0);
    else this.audio.stopBgm();
    if (st.bgmVolume != null) this.audio.setBgmVolume(st.bgmVolume);
    await Promise.all(
      [...st.chars].map(([id, c]) =>
        this.stage.place(id, c.costume, c.side, c.offsetX, c.motion, c.facial, c.visible),
      ),
    );
    if (gen !== this.gen) return;
    for (const [id, fx] of st.modelFx) this.stage.attachModelEffect(id, fx.kind, fx.intensity);
    this.onEffectsRestore?.(st.effects, [...st.holo]);
    if (st.shakeScreen) void this.stage.shakeScreen(9999);
    if (st.shakeWindow) void this.dialogue.shakeWindow(9999);
    this.onProgress?.(seq, this.scn.Snippets.length, "Jump");
    void this.playFrom(seq, gen);
  }

  private replay(end: number): ReplayState {
    const scn = this.scn;
    const st: ReplayState = {
      bg: scn.FirstBackground,
      bgm: scn.FirstBgm,
      layoutMode: scn.FirstCharacterLayoutMode ?? 0,
      fade: [0, 0, 0, 0],
      ambient: 12,
      cam: { x: 0, y: 0, zoom: 1 },
      bgBlur: false,
      shakeScreen: false,
      shakeWindow: false,
      modelFx: new Map(),
      holo: new Set(),
      effects: [],
      chars: new Map(),
    };
    const pose = (id: number, motion: string, facial: string) => {
      const c = st.chars.get(id);
      if (!c) return;
      if (motion) c.motion = motion;
      if (facial) c.facial = facial;
    };
    for (const l of scn.FirstLayout || [])
      st.chars.set(l.Character2dId, {
        costume: l.CostumeType,
        side: l.PositionSide,
        offsetX: l.OffsetX,
        motion: l.MotionName,
        facial: l.FacialName,
        visible: true,
      });
    for (const s of scn.Snippets.slice(0, end)) {
      switch (s.Action) {
        case Action.CharacterLayout: {
          const l = scn.LayoutData[s.ReferenceIndex];
          if (!l) break;
          const c = st.chars.get(l.Character2dId);
          if (l.Type === LayoutType.Apper) {
            const costume = l.CostumeType || c?.costume; // empty = re-show existing
            if (!costume) break;
            if (c && costume !== c.costume) st.modelFx.delete(l.Character2dId); // new costume, no effect
            st.chars.set(l.Character2dId, {
              costume,
              side: l.SideTo,
              offsetX: l.SideToOffsetX,
              motion: l.MotionName || c?.motion || "",
              facial: l.FacialName || c?.facial || "",
              visible: true,
            });
          } else if (l.Type === LayoutType.Hide) {
            if (c) c.visible = false;
          } else if (l.Type === LayoutType.Move) {
            if (c) {
              c.side = l.SideTo;
              c.offsetX = l.SideToOffsetX;
            }
          } else if (l.Type !== LayoutType.ShakeX && l.Type !== LayoutType.ShakeY) {
            pose(l.Character2dId, l.MotionName, l.FacialName);
          }
          break;
        }
        case Action.CharacterMotion: {
          const l = scn.LayoutData[s.ReferenceIndex];
          if (l) pose(l.Character2dId, l.MotionName, l.FacialName);
          break;
        }
        case Action.Talk:
          for (const mo of scn.TalkData[s.ReferenceIndex]?.Motions || [])
            pose(mo.Character2dId, mo.MotionName, mo.FacialName);
          break;
        case Action.CharacterLayoutMode: {
          const m = scn.ScenarioSnippetCharacterLayoutModes[s.ReferenceIndex];
          if (m) st.layoutMode = m.CharacterLayoutMode;
          break;
        }
        case Action.SpecialEffect: {
          const e = scn.SpecialEffectData[s.ReferenceIndex];
          if (!e) break;
          const T = SpecialEffectType;
          switch (e.EffectType) {
            case T.BlackOut: st.fade = [0, 0, 0, 1]; break;
            case T.BlackIn: st.fade = [0, 0, 0, 0]; break;
            case T.WhiteOut: case T.SekaiOut: case T.SekaiOut3anv: st.fade = [1, 1, 1, 1]; break;
            case T.WhiteIn: case T.SekaiIn: case T.SekaiIn3anv: st.fade = [1, 1, 1, 0]; break;
            case T.ChangeBackground:
              if (e.StringVal) st.bg = e.StringVal;
              st.ambient = 12; // FinishLoadBgAfterProcess resets the ambient colour
              break;
            case T.FlashbackIn: st.colorEffect = "flashback"; break;
            case T.SepiaIn: st.colorEffect = "sepia"; break;
            case T.FlashbackOut: case T.SepiaOut: case T.BlurIn: case T.BlurOut: st.colorEffect = undefined; break;
            case T.AmbientColorNormal: case T.AmbientColorEvening: case T.AmbientColorNight: st.ambient = e.EffectType; break;
            case T.CameraMove: {
              const [x, y] = e.StringVal.split(",").map((v) => Number.parseFloat(v));
              if (!Number.isNaN(x) && !Number.isNaN(y)) {
                st.cam.x = x;
                st.cam.y = y;
              }
              break;
            }
            case T.CameraZoom: {
              const z = Number.parseFloat(e.StringVal);
              if (!Number.isNaN(z)) st.cam.zoom = z;
              break;
            }
            case T.BackGroundBlur: st.bgBlur = e.StringVal.trim().toLowerCase() === "true"; break;
            case T.DollyZoom: {
              const d = parseDolly(e.StringVal);
              if (d.zoom != null) st.dolly = d;
              break;
            }
            case T.ShakeScreen: st.shakeScreen = e.Duration >= 3600; break;
            case T.StopShakeScreen: st.shakeScreen = false; break;
            case T.ShakeWindow: st.shakeWindow = e.Duration >= 3600; break;
            case T.StopShakeWindow: st.shakeWindow = false; break;
            case T.AttachCharacterShader: {
              const kind = e.StringVal;
              if (kind === "none") {
                st.modelFx.clear();
                st.holo.delete(e.IntVal);
              } else if (kind === "hologram" || kind === "monitor" || kind === "blur") {
                if (st.modelFx.get(e.IntVal)?.kind !== kind) {
                  st.modelFx.set(e.IntVal, { kind, intensity: Number.parseFloat(e.StringValSub) || 1 });
                  if (kind === "hologram") st.holo.add(e.IntVal);
                }
              }
              break;
            }
            case T.PlayScenarioEffect: st.effects.push(e.StringVal); break;
            case T.StopScenarioEffect: st.effects = st.effects.filter((n) => n !== e.StringVal); break;
            default:
              if (SIDE_FADES[e.EffectType]) {
                const name = SIDE_FADES[e.EffectType];
                st.sideCover = name.endsWith("Out") ? name : undefined;
              }
          }
          break;
        }
        case Action.Sound: {
          const so = scn.SoundData[s.ReferenceIndex];
          if (!so) break;
          if ((so.PlayMode === SoundPlayMode.CrossFade || so.PlayMode === SoundPlayMode.Stack) && so.Bgm)
            st.bgm = so.Bgm;
          else if (so.PlayMode === SoundPlayMode.BgmVolume) st.bgmVolume = so.Volume;
          break;
        }
      }
    }
    return st;
  }

  // ── barrier / drain ──────────────────────────────────────────────────────
  private async waitOtherFinished(s: Snippet) {
    if (s.ProgressBehavior !== Progress.WaitFinished) return; // Now: no wait
    while (this.executeSnippets.size > 0) await this.nextFrame();
  }
  private async waitAllFinished() {
    while (this.executeSnippets.size > 0) await this.nextFrame();
  }

  // ── per-action pre-delay (consumed at the START of every action) ─────────
  private async waitDelaySnippet(s: Snippet, param: InFlight) {
    if (s.Delay <= 0) return;
    const end = Date.now() + (s.Delay * 1000) / clock.scale;
    while (Date.now() < end) {
      if (this.skipMode) return;
      if (param.status === 2) return; // flushed by talk-window close
      const earlierInFlight = [...this.executeSnippets.keys()].some(
        (k) => k.Index < s.Index,
      );
      if (!earlierInFlight && this.inputtedWaitSkip) return; // tap-skip
      await this.nextFrame();
    }
  }

  // ── action dispatch (decides FinishSnippet timing per type) ──────────────
  private async runAction(s: Snippet, param: InFlight, gen: number) {
    try {
      await this.waitDelaySnippet(s, param);
      if (gen !== this.gen) return;
      switch (s.Action) {
        case Action.Sound:
          this.handleSound(s.ReferenceIndex);
          this.finishSnippet(s); // immediate — sound rings out async
          break;
        case Action.CharacterLayout:
          await this.handleLayout(s.ReferenceIndex); // gate on the animation
          if (gen !== this.gen) return;
          this.finishSnippet(s);
          break;
        case Action.CharacterMotion: // ChangeMotion (4): indexes LayoutData, non-gating
          this.handleChangeMotion(s.ReferenceIndex);
          this.finishSnippet(s); // immediate — motion plays async
          break;
        case Action.Talk:
          await this.runTalkWindow(s, gen); // typing + voice + auto-advance / tap
          if (gen !== this.gen) return;
          this.onFinishTalkWindow(s); // stop voice, flush motions, finish
          break;
        case Action.SpecialEffect:
          await this.handleSpecialEffect(s.ReferenceIndex, s); // gate for effect duration
          if (gen !== this.gen) return;
          this.finishSnippet(s);
          break;
        case Action.CharacterLayoutMode: {
          const m = this.scn.ScenarioSnippetCharacterLayoutModes[s.ReferenceIndex];
          if (m) this.stage.setLayoutMode(m.CharacterLayoutMode);
          this.finishSnippet(s);
          break;
        }
        default: // None / InputName — not yet modeled
          this.finishSnippet(s);
          break;
      }
    } catch (e) {
      console.warn(`snippet ${s.Index} (${enumName(Action, s.Action)}) failed:`, (e as Error).message);
      if (gen === this.gen) this.finishSnippet(s); // never strand the in-flight set
    }
  }

  // ── Talk lifecycle ───────────────────────────────────────────────────────
  private waitForClick(): Promise<void> {
    return new Promise((resolve) => (this.pendingAdvance = resolve));
  }

  private async runTalkWindow(s: Snippet, gen: number) {
    const t = this.scn.TalkData[s.ReferenceIndex];
    if (!t) return;
    this.speakers = (t.TalkCharacters || []).map((c) => c.Character2dId);

    if (!this.skipMode) {
      // motions with TimingSyncValue==0 play immediately
      for (const mo of t.Motions || [])
        if (mo.TimingSyncValue === 0)
          this.stage.applyMotionFacial(mo.Character2dId, mo.MotionName, mo.FacialName);
      // timed motions (MotionChangeFrom==PlayTime) fire at TimingSyncValue seconds
      if (t.MotionChangeFrom === 1)
        for (const mo of t.Motions || [])
          if (mo.TimingSyncValue > 0)
            this.motionTimers.push(
              setTimeout(
                () => this.stage.applyMotionFacial(mo.Character2dId, mo.MotionName, mo.FacialName),
                mo.TimingSyncValue * 1000,
              ),
            );
    }

    const fast = this.fast; // 早送り: no voice, text at once, short hold
    const v = fast ? undefined : t.Voices?.[0];
    let voiceEnded = !v;
    const voiceP = v
      ? this.audio
          .playVoice(storyUrls.voice(this.scn.ScenarioId, v.VoiceId), v.Volume ?? 1)
          .then(() => {
            voiceEnded = true;
          })
      : null;

    this.startLipSync(t, v?.Character2dId);
    const typed = this.dialogue.show(t.WindowDisplayName, t.Body, fast);

    if (fast) {
      await typed;
      await sleep(FAST_PAGE_HOLD);
      return;
    }
    if (!this.auto) {
      await typed; // first tap completes typing
      if (gen !== this.gen) return;
      if (this.fast || this.auto) return; // switched on while typing
      await this.waitForClick(); // next tap advances (does not wait for voice)
      return;
    }
    // AUTO (ShowWords_d__95):
    await typed;
    if (gen !== this.gen) return;
    if (!voiceP || voiceEnded) {
      await sleep(AUTO_PAGE_DELAY); // no voice / voice already done → 2.0s
    } else {
      await Promise.race([voiceP, sleep(VOICE_CAP)]); // wait the voice out (cap 30s)
      await sleep(AUTO_POST_VOICE); // then +0.5s
    }
  }

  private onFinishTalkWindow(s: Snippet) {
    // flush pending ChangeMotion pre-delays so they fire in sync with window close
    for (const [snip, p] of this.executeSnippets)
      if (snip.Action === Action.CharacterMotion) p.status = 2;
    this.stopLipSync();
    for (const tm of this.motionTimers) clearTimeout(tm);
    this.motionTimers = [];
    const t = this.scn.TalkData[s.ReferenceIndex];
    if (t?.Voices?.[0]) this.audio.stopVoice(); // voice is cut at window close
    if (t?.WhenFinishCloseWindow) this.dialogue.hide();
    void this.effects.hidePlace(); // the place label leaves with the first line
    this.finishSnippet(s);
  }

  // ── lip-sync (LipSync: 0=Text, 1=Voice, 2=Close) ─────────────────────────
  // Computes the mouth TARGET (the model smooths + sets ParamMouthOpenY).
  // Voice target = Live2DVoice.LipSync curve: rms·pow(rms+1, powK), dead-zone
  // <0.06 → 0, else clamp [0.2, 1.0]; powK=1.75, scale=1.0 (TargetValueScale).
  private startLipSync(t: SnippetTalk, voiceCharId?: number) {
    this.stopLipSync();
    if (t.LipSync === 2) {
      for (const id of this.speakers) this.stage.setLipTarget(id, 0); // Close
      return;
    }
    // Text mode (LipSync 0) / Close (2): the game does NOT flap the mouth — it
    // follows the motion (≈closed). Only VOICE mode drives the mouth from rms.
    const useVoice = t.LipSync === 1 && voiceCharId != null;
    if (!useVoice) {
      for (const id of this.speakers) this.stage.setLipTarget(id, 0);
      return;
    }
    const scale = t.TargetValueScale > 0 ? t.TargetValueScale : 1; // DefaultTargetValueScale
    const powK = scale * 1.75; // DefaultPowKValue
    this.lipTimer = setInterval(() => {
      const rms = this.audio.getVoiceLevel() * scale;
      let target = rms * Math.pow(rms + 1, powK);
      target = target < 0.06 ? 0 : Math.min(1, Math.max(0.2, target));
      this.stage.setLipTarget(voiceCharId, target);
    }, 33);
  }
  private stopLipSync() {
    if (this.lipTimer) {
      clearInterval(this.lipTimer);
      this.lipTimer = undefined;
    }
    for (const id of this.speakers) this.stage.setLipTarget(id, null); // release to expression
  }

  // ── CharacterLayout (2): gates on the animation ──────────────────────────
  private handleLayout(ref: number): Promise<void> {
    const l = this.scn.LayoutData[ref];
    if (!l) return Promise.resolve();
    const ms = MOVE_MS[l.MoveSpeedType] ?? MOVE_MS[0];
    switch (l.Type) {
      case LayoutType.Apper:
        if (l.SideFrom !== l.SideTo) // slide-in entrance (e.g. Mizuki from off-screen right)
          return this.stage.appearSlide(
            l.Character2dId,
            l.CostumeType,
            l.SideFrom,
            l.SideFromOffsetX,
            l.SideTo,
            l.SideToOffsetX,
            ms,
            l.MotionName,
            l.FacialName,
          );
        return this.stage.appear(
          l.Character2dId,
          l.CostumeType,
          l.SideTo,
          l.SideToOffsetX,
          l.MotionName,
          l.FacialName,
        );
      case LayoutType.Hide:
        return this.stage.hide(l.Character2dId);
      case LayoutType.Move:
        return this.stage.move(l.Character2dId, l.SideTo, l.SideToOffsetX, ms);
      case LayoutType.ShakeX:
        return this.stage.shake(l.Character2dId, "x");
      case LayoutType.ShakeY:
        return this.stage.shake(l.Character2dId, "y");
      default: // Layer / None — static, non-gating
        if (l.MotionName || l.FacialName)
          this.stage.applyMotionFacial(l.Character2dId, l.MotionName, l.FacialName);
        return Promise.resolve();
    }
  }

  // ── ChangeMotion (4): change an on-stage character's motion/facial, async ──
  private handleChangeMotion(ref: number) {
    const l = this.scn.LayoutData[ref];
    if (l && (l.MotionName || l.FacialName))
      this.stage.applyMotionFacial(l.Character2dId, l.MotionName, l.FacialName);
  }

  // ── SpecialEffect (6): the returned promise is when FinishSnippet happens ─
  // (ScenarioPlayer.<SnippetActionSpecialEffect>d__247; see camera.ts /
  // effects.ts / stage.ts for each effect's source).
  private async handleSpecialEffect(ref: number, s: Snippet): Promise<void> {
    const e = this.scn.SpecialEffectData[ref];
    if (!e) return;
    const T = SpecialEffectType;
    const ms = e.Duration * 1000;
    switch (e.EffectType) {
      case T.BlackOut:
        return this.effects.colorFade([0, 0, 0, 1], ms);
      case T.BlackIn:
        return this.effects.colorFade([0, 0, 0, 0], ms, [0, 0, 0, 1]); // start opaque → clear
      case T.WhiteOut:
        return this.effects.colorFade([1, 1, 1, 1], ms);
      case T.WhiteIn:
        return this.effects.colorFade([1, 1, 1, 0], ms, [1, 1, 1, 1]);
      case T.SekaiOut:
      case T.SekaiOut3anv:
        // white from the current cover colour after 0.5s (+ transition particles)
        this.onSekaiTransition?.(e.EffectType === T.SekaiOut3anv);
        return this.effects.colorFade([1, 1, 1, 1], ms, undefined, 500);
      case T.SekaiIn:
      case T.SekaiIn3anv:
        return this.effects.colorFade([1, 1, 1, 0], ms, [1, 1, 1, 1], 250);
      case T.Telop:
        return this.effects.telop(e.StringVal, () => (this.auto || this.fast ? sleep(2000) : this.waitForClick()));
      case T.ChangeBackground:
        await this.stage.changeBackground(e.StringVal, ms);
        this.stage.setAmbient(12); // FinishLoadBgAfterProcess → SetAmbientColor(Normal)
        return;
      case T.ShakeScreen:
        return this.stage.shakeScreen(e.Duration);
      case T.StopShakeScreen:
        return this.stage.stopShakeScreen();
      case T.ShakeWindow:
        return this.dialogue.shakeWindow(e.Duration);
      case T.StopShakeWindow:
        return this.dialogue.stopShake();
      case T.FlashbackIn:
        return this.stage.setColorEffect("flashback");
      case T.SepiaIn:
        return this.stage.setColorEffect("sepia");
      case T.FlashbackOut:
      case T.SepiaOut:
        return this.stage.setColorEffect();
      case T.AmbientColorNormal:
      case T.AmbientColorEvening:
      case T.AmbientColorNight:
        return this.stage.setAmbient(e.EffectType);
      case T.AttachCharacterShader: {
        const kind = e.StringVal;
        if (kind === "none") {
          this.stage.detachModelEffects();
          this.onCharacterEffect?.(e.IntVal, null);
        } else if (kind === "hologram" || kind === "monitor" || kind === "blur") {
          if (this.stage.modelEffectOf(e.IntVal) === kind) return;
          this.stage.attachModelEffect(e.IntVal, kind, Number.parseFloat(e.StringValSub) || 1);
          if (kind === "hologram" && e.StringValSub) this.onCharacterEffect?.(e.IntVal, e.StringValSub);
        }
        return;
      }
      case T.PlayScenarioEffect:
      case T.StopScenarioEffect: {
        // FinishSnippet first; Duration is a pre-delay before Play/Stop
        const play = e.EffectType === T.PlayScenarioEffect;
        const gen = this.gen;
        (async () => {
          if (e.Duration > 0) await sleep(e.Duration * 1000);
          if (gen === this.gen) await this.onScenarioEffect?.(e.StringVal, play);
        })().catch((err: unknown) => console.warn("scenario effect failed", err));
        return;
      }
      case T.PlaceInfo:
        void this.effects.showPlace(e.StringVal); // finishes at once
        return;
      case T.FullScreenText: {
        const i = this.scn.Snippets.indexOf(s);
        const isFst = (sn?: Snippet) =>
          !!sn && this.scn.SpecialEffectData[sn.ReferenceIndex]?.EffectType === T.FullScreenText;
        const voice = e.StringValSub;
        return this.effects.fullScreenText(e.StringVal, {
          first: !isFst(this.scn.Snippets[i - 1]),
          last: !isFst(this.scn.Snippets[i + 1]),
          fast: this.fast,
          playVoice: voice ? () => this.audio.playVoice(storyUrls.voice(this.scn.ScenarioId, voice), 1) : undefined,
          stopVoice: () => this.audio.stopVoice(),
        });
      }
      case T.SimpleSelectable: {
        const opts = e.StringVal.split("/");
        if (opts.length > 1) await this.effects.choose(opts);
        return;
      }
      case T.Movie: {
        this.stage.hideAll();
        const url = storyUrls.movie(e.StringVal);
        if (!url) return console.warn("movie not found", e.StringVal);
        return this.effects.movie(url, () => {});
      }
      case T.BlurIn:
        return this.stage.cameraBlur(true, e.Duration);
      case T.BlurOut:
        return this.stage.cameraBlur(false, e.Duration);
      case T.BackGroundBlur:
        return this.stage.setBackgroundBlur(e.StringVal.trim().toLowerCase() === "true");
      case T.CameraMove: {
        const [x, y] = e.StringVal.split(",").map((v) => Number.parseFloat(v));
        if (Number.isNaN(x) || Number.isNaN(y)) return;
        return this.stage.cameraMove(x, y, ms);
      }
      case T.CameraZoom: {
        const z = Number.parseFloat(e.StringVal);
        if (Number.isNaN(z)) return;
        return this.stage.cameraZoom(z, ms);
      }
      case T.DollyZoom:
        return this.stage.dollyZoom(parseDolly(e.StringVal), ms, parseEase(e.StringValSub));
      default:
        if (SIDE_FADES[e.EffectType]) return this.effects.sideFade(SIDE_FADES[e.EffectType], e.Duration);
        // MusicVideo (3D live scene), ChangeCardStill / ChangeBackgroundStill (no-ops in 6.8.1)
        return;
    }
  }

  // ── Sound (7): trigger then return; never blocks ─────────────────────────
  private handleSound(ref: number) {
    const s = this.scn.SoundData[ref];
    if (!s) return;
    switch (s.PlayMode) {
      case SoundPlayMode.CrossFade:
      case SoundPlayMode.Stack:
        // BGM crossfades over Duration (or 0.25s default); SE plays after Duration's delay
        if (s.Bgm)
          this.audio.playBgm(storyUrls.bgm(s.Bgm), 0.7, s.Duration > 0 ? s.Duration * 1000 : 250);
        if (s.Se) {
          const se = s.Se;
          if (s.Duration > 0) setTimeout(() => this.audio.playSe(storyUrls.se(se), 1), s.Duration * 1000);
          else this.audio.playSe(storyUrls.se(se), 1);
        }
        return;
      case SoundPlayMode.SpecialSePlay:
        if (s.Se) this.audio.playSe(storyUrls.se(s.Se), s.Volume ?? 1);
        return;
      case SoundPlayMode.Stop:
        // game mode 3 stops an SE (via playSEDict), NOT the BGM. We don't track
        // SE one-shots, so this is a no-op (do NOT stop the BGM here).
        return;
      case SoundPlayMode.BgmVolume:
        this.audio.setBgmVolume(s.Volume);
        return;
      default:
        return;
    }
  }
}
