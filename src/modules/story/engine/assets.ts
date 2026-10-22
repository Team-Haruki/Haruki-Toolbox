// Live2D model loading. Models, motions and facials come from the JP asset
// tree; storyUrls (urls.ts) knows the layout.

import { Live2DModel } from "@sekai-world/pixi-live2d-display-mulmotion/cubism4";
import type { ScenarioSceneData } from "./types";
import { storyUrls } from "./urls";

// Per-Character2dId sets of motion/facial names referenced anywhere in the
// scenario, so a loaded model lists exactly the motions it might play.
export interface MotionIndex {
  motions: Map<number, Set<string>>;
  facials: Map<number, Set<string>>;
}
export function buildMotionIndex(scn: ScenarioSceneData): MotionIndex {
  const motions = new Map<number, Set<string>>();
  const facials = new Map<number, Set<string>>();
  const add = (m: Map<number, Set<string>>, id: number, v?: string) => {
    if (!v) return;
    if (!m.has(id)) m.set(id, new Set());
    m.get(id)!.add(v);
  };
  for (const l of scn.LayoutData) {
    add(motions, l.Character2dId, l.MotionName);
    add(facials, l.Character2dId, l.FacialName);
  }
  for (const t of scn.TalkData)
    for (const mo of t.Motions || []) {
      add(motions, mo.Character2dId, mo.MotionName);
      add(facials, mo.Character2dId, mo.FacialName);
    }
  return { motions, facials };
}

// A loaded character model + helpers to drive its two motion managers.
export class CharacterModel {
  private motionIdx = new Map<string, number>();
  private facialIdx = new Map<string, number>();
  private facialUrls = new Map<string, string>();
  // pjsk facials are LOOPING (held) expressions, but the lib never applies
  // Meta.Loop (CubismMotion._isLoop stays false) so they play once then revert —
  // the closed-eye expression reopened. Fix: hold the facial's parameter values
  // ourselves and re-apply them every frame.
  private heldFacial: Array<[string, number]> = [];
  private static facialCache = new Map<string, Array<[string, number]>>();
  // lip-sync (Live2DVoice.UpdateParam): in the game EVERY character's voice runs
  // every frame and OWNS ParamMouthOpenY — non-speakers are driven to 0 (closed),
  // the speaker gets the voice curve. So default target 0 (mouth shut) and always
  // apply the weighted smoothing; the facial only controls mouth SHAPE, not open.
  private lipTarget = 0;
  private lipPrev = 0;
  private lipCurrent = 0;
  // auto eye-blink (Live2DEyeBlinkController.PlayAutoMode): pjsk model3 declares
  // no EyeBlink params so the lib never blinks — drive it ourselves with the
  // game's |sin| curve. (speed/mean/deviation are prefab-serialized; using
  // natural defaults since they aren't in the binary.)
  private blinkAt = 0;
  private static readonly BLINK_SPEED = 10; // rad/s (Live2DEyeBlinkController.ctor speed=10)
  private static readonly BLINK_MEAN = 3.0; // s between blinks
  private static readonly BLINK_DEV = 2.0;
  // pjsk breath (Live2DModel.LateUpdate): ONLY ParamBreath, value =
  // (sin(deg)*0.5+0.5)*influence, full cycle = breathCycle seconds. (The lib's
  // default breath rocks ParamAngleX ±15° = the wrong "swaying" — disabled.)
  private static readonly BREATH_CYCLE = 3.0; // s
  private static readonly BREATH_INFLUENCE = 0.5; // game packs breathInfluence=0.5
  public readonly display: Live2DModel;
  constructor(display: Live2DModel) {
    this.display = display;
  }

  // lip-sync target (already curved/clamped by the player); null = mouth closed.
  setLipTarget(t: number | null) {
    this.lipTarget = t ?? 0;
  }

  // Eye-open multiplier from the |sin| blink (1 between blinks → 0 mid-blink).
  // Multiplied onto the current eye param so closed-eye expressions still win.
  private eyeFactor(nowSec: number): number {
    if (this.blinkAt === 0) this.blinkAt = nowSec + 1 + Math.random() * 4;
    const e = nowSec - this.blinkAt;
    if (e < 0) return 1; // waiting for next blink
    const r = -Math.PI / 2 + e * CharacterModel.BLINK_SPEED;
    if (r > Math.PI / 2) {
      this.blinkAt = nowSec + CharacterModel.BLINK_MEAN + (Math.random() * 2 - 1) * CharacterModel.BLINK_DEV;
      return 1;
    }
    return Math.abs(Math.sin(r));
  }

  static async load(costume: string, char2dId: number, midx: MotionIndex): Promise<CharacterModel> {
    const m = storyUrls.model(costume);
    if (!m) throw new Error(`no model for costume ${costume}`);

    const base = storyUrls.modelBase(m);
    const res = await fetch(base + m.model3);
    if (!res.ok) throw new Error(`${costume}: model3 HTTP ${res.status}`);
    const settings: any = await res.json();
    settings.url = base;
    // the model3 names "<stem>.physics3.json"; the export writes "<stem>.physics3"
    if (m.physics) settings.FileReferences.Physics = m.physics;
    else delete settings.FileReferences.Physics;

    // scenarios name clips in mixed case; exports are lower-case
    const motionNames = [...(midx.motions.get(char2dId) ?? [])];
    const facialNames = [...(midx.facials.get(char2dId) ?? [])];
    const clips = (kind: "motion" | "facial", names: string[]) =>
      names.flatMap((n) => {
        const file = storyUrls.clip(m, kind, n);
        return file ? [{ name: n, file }] : [];
      });
    const motions = clips("motion", motionNames);
    const facials = clips("facial", facialNames);
    settings.FileReferences.Motions = {
      Motion: motions.map((c) => ({
        Name: c.name,
        File: c.file,
        FadeInTime: 0.5, // ChangeMotionCore default
        FadeOutTime: 0.5,
      })),
      Expression: facials.map((c) => ({
        Name: c.name,
        File: c.file,
        FadeInTime: 0.25, // ChangeModelFacial GetBlendInTime default
        FadeOutTime: 0.25,
      })),
    };
    settings.FileReferences.Expressions = {};

    const display = (await Live2DModel.from(settings, {
      autoHitTest: false,
      autoFocus: false,
    })) as any;
    display.internalModel.extendParallelMotionManager(2);
    // kill the lib's default breath (rocks ParamAngleX ±15° — not how pjsk
    // breathes); we drive ParamBreath ourselves below.
    try {
      display.internalModel.breath?.setParameters?.([]);
    } catch {
      /* noop */
    }

    const cm = new CharacterModel(display);
    motions.forEach((c, i) => cm.motionIdx.set(c.name, i));
    facials.forEach((c, i) => cm.facialIdx.set(c.name, i));
    facials.forEach((c) => cm.facialUrls.set(c.name, c.file));
    // after motions/expressions apply: hold facial + eye-blink + breath + lip-sync
    // (matches Live2DEyeBlinkController.PlayAutoMode + Live2DModel.LateUpdate +
    // Live2DVoice.UpdateParam).
    display.internalModel.on("afterMotionUpdate", () => {
      const core = display.internalModel.coreModel;
      const nowSec = Date.now() / 1000;
      // hold the current facial expression (the lib doesn't loop it back)
      for (const [id, v] of cm.heldFacial) core.setParameterValueById(id, v);
      const ef = cm.eyeFactor(nowSec);
      if (ef < 1) {
        for (const id of ["ParamEyeLOpen", "ParamEyeROpen"]) {
          core.setParameterValueById(id, core.getParameterValueById(id) * ef);
        }
      }
      // pjsk breath — ParamBreath only
      const breath =
        (Math.sin(nowSec * ((2 * Math.PI) / CharacterModel.BREATH_CYCLE)) * 0.5 + 0.5) *
        CharacterModel.BREATH_INFLUENCE;
      core.setParameterValueById("ParamBreath", breath);
      // lip-sync owns ParamMouthOpenY every frame (target 0 = closed for non-speakers)
      {
        const t = cm.lipTarget;
        let tw: number, pw: number;
        if (cm.lipCurrent >= 0.1) {
          const stable = Math.abs(t - cm.lipPrev) < 0.1;
          tw = stable ? 0.2 : 0.25;
          pw = stable ? 0.8 : 0.75;
        } else {
          tw = 0.6;
          pw = 0.4;
        }
        const v = t * tw + cm.lipPrev * pw;
        cm.lipCurrent = v;
        cm.lipPrev = v;
        core.setParameterValueById("ParamMouthOpenY", v);
      }
    });
    return cm;
  }

  // Load every motion/facial this model can play, so a later startMotion never
  // waits on a fetch (while it waits the model sits in its default T-pose).
  async preloadMotions() {
    // the parallel tracks share the main manager's definitions and motion cache
    const mm = (this.display as any).internalModel.motionManager;
    await Promise.all([
      ...[...this.facialIdx.values()].map((i) => mm.loadMotion("Expression", i)),
      ...[...this.motionIdx.values()].map((i) => mm.loadMotion("Motion", i)),
      ...[...this.facialIdx.keys()].map((n) => this.holdFacial(n, false)),
    ]);
  }

  // Start a motion/facial with no fade-in: the model's first pose on Apper. A
  // fade-in from nothing would blend from the default T-pose for 0.5s.
  async playInstant(motionName?: string, facialName?: string) {
    const internal = (this.display as any).internalModel;
    const pmm = internal.parallelMotionManager;
    const tracks: [number, string, number | undefined][] = [
      [0, "Expression", facialName ? this.facialIdx.get(facialName) : undefined],
      [1, "Motion", motionName ? this.motionIdx.get(motionName) : undefined],
    ];
    await Promise.all(
      tracks.map(async ([track, group, index]) => {
        if (index === undefined) return;
        const motion = await internal.motionManager.loadMotion(group, index);
        if (!motion) return;
        const fadeIn = motion.getFadeInTime();
        motion.setFadeInTime(0);
        await pmm[track].startMotion(group, index);
        // fade-in is evaluated every update, so restore it only once a normal
        // fade from this start would have finished
        setTimeout(() => motion.setFadeInTime(fadeIn), Math.max(0, fadeIn) * 1000 + 100);
      }),
    );
    if (facialName && this.facialIdx.has(facialName)) await this.holdFacial(facialName);
  }

  // manager[0] = facial track, manager[1] = body track (mulmotion).
  play(motionName?: string, facialName?: string) {
    const pmm = (this.display as any).internalModel.parallelMotionManager;
    if (facialName && this.facialIdx.has(facialName)) {
      pmm[0].startMotion("Expression", this.facialIdx.get(facialName)); // fade-in
      void this.holdFacial(facialName); // + persist (lib doesn't loop it)
    }
    if (motionName && this.motionIdx.has(motionName))
      pmm[1].startMotion("Motion", this.motionIdx.get(motionName));
  }

  // Parse a facial's parameter values (constant "held" expression) and keep
  // re-applying them each frame so the expression persists.
  // `apply = false` only fills the cache (preload).
  private async holdFacial(facialName: string, apply = true) {
    const url = this.facialUrls.get(facialName);
    if (!url) return;
    const cached = CharacterModel.facialCache.get(url);
    if (cached) {
      if (apply) this.heldFacial = cached;
      return;
    }
    let params: Array<[string, number]> = [];
    try {
      const m = await (await fetch(url)).json();
      params = (m.Curves || [])
        .filter(
          (c: any) =>
            c.Target === "Parameter" &&
            Array.isArray(c.Segments) &&
            c.Id !== "ParamMouthOpenY", // lip-sync owns mouth-open; facial sets only the shape
        )
        .map((c: any) => [c.Id, c.Segments[1] ?? 0] as [string, number]);
    } catch {
      /* params stays [] */
    }
    CharacterModel.facialCache.set(url, params);
    if (apply) this.heldFacial = params;
  }

  destroy() {
    (this.display as any).destroy();
  }
}
