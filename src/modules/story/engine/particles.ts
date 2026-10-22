// Scenario particle effects (SpecialEffect 15/16, the hologram of 22): a
// runtime for Unity Shuriken prefabs converted to effect.json by
// fx_convert.py (field names kept, curves/gradients compacted).
//
// Space: "ref" = 1920x1080 canvas px, y-up, origin at the screen centre (the
// EffectLayer pivot). Stage px = ref·2/3 with y flipped. Particle systems use
// scalingMode Local, so particle quantities are world units scaled only by
// the emitter's own localScale: 1 unit = 540 ref (ortho size 1 at 1080).
// Blending follows the Sekai particle shaders (premultiplied output under
// ONE / ONE_MINUS_SRC_ALPHA): "Additive" = alpha written 0, "AlphaBlended" =
// alpha kept, "Additive+AlphaBlend" picks per particle from Custom1.x > 0.5,
// "UI/Multiply" uses DstColor.
// Lifecycle (ScenarioEffector / CommandAnimator): Play = animator default
// state + playOnAwake systems; Stop = systems stop emitting, the "Stop" clip
// plays if present, the effect is removed once nothing is alive;
// ForceStop = removed at once.

import * as PIXI from "pixi.js";
import { storyUrls } from "./urls";
import { random } from "./random";

// pixi 7 types GPU data as IArrayBuffer (an ArrayBuffer), which typed arrays no longer satisfy
const gpu = (a: ArrayBufferView) => a as unknown as PIXI.IArrayBuffer;

const K = 2 / 3; // ref → stage px
const UNIT = 540; // ref px per world unit (UIParticle prefabs override via effect.json "unit")
const GRAVITY = 9.81;
const DEG = Math.PI / 180;

// ── data types (effect.json) ─────────────────────────────────────────────────
type Curve = { k: [number, number, number, number][]; w?: [number, number] } | null;
interface MinMax {
  m: number;
  s: number;
  n: number;
  c?: Curve;
  cn?: Curve;
}
interface Grad {
  c: [number, number, number, number][];
  a: [number, number][];
  f: number;
}
interface MinMaxGrad {
  m: number;
  max?: number[];
  min?: number[];
  g?: Grad;
  gn?: Grad;
}
type Json = any;
interface FxNode {
  name: string;
  active: number;
  layer: number;
  pos: number[];
  rot: number[];
  scale: number[];
  rect?: { amin: number[]; amax: number[]; apos: number[]; size: number[]; pivot: number[] };
  parent: number;
  children: number[];
  ps?: Json;
  psr?: Json;
  image?: Json;
  sprite?: Json;
  canvas?: Json;
  animator?: Json;
  effector?: Json;
}
interface FxData {
  name: string;
  roots: number[];
  nodes: FxNode[];
  materials: Record<string, Json>;
  sprites: Record<string, Json>;
  meshes: Record<string, Json>;
  clips: Record<string, Json>;
  unit?: number;
}

// ── curve / gradient evaluation ─────────────────────────────────────────────
function evalCurve(c: Curve | undefined, t: number): number {
  const k = c?.k;
  if (!k || !k.length) return 0;
  if (t <= k[0][0]) return k[0][1];
  const last = k[k.length - 1];
  if (t >= last[0]) return last[1];
  let i = 1;
  while (k[i][0] < t) i++;
  const [t0, v0, , o0] = k[i - 1];
  const [t1, v1, i1] = k[i];
  const dt = t1 - t0;
  if (Math.abs(o0) > 1e8 || Math.abs(i1) > 1e8) return v0; // stepped key
  const s = (t - t0) / dt;
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * dt * o0 + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * dt * i1;
}
// MinMaxCurve: 0 constant, 1 curve, 2 random between curves, 3 random between constants
function evalMM(m: MinMax | undefined, t: number, r: number): number {
  if (!m) return 0;
  switch (m.m) {
    case 0:
      return m.s;
    case 1:
      return m.s * evalCurve(m.c, t);
    case 2: {
      const a = evalCurve(m.cn, t);
      return m.s * (a + (evalCurve(m.c, t) - a) * r);
    }
    default:
      return m.n + (m.s - m.n) * r;
  }
}
function evalGrad(g: Grad | undefined, t: number): [number, number, number, number] {
  if (!g) return [1, 1, 1, 1];
  const ch = (keys: number[][], idx: number[]) => {
    if (t <= keys[0][0]) return idx.map((i) => keys[0][i]);
    const l = keys[keys.length - 1];
    if (t >= l[0]) return idx.map((i) => l[i]);
    let i = 1;
    while (keys[i][0] < t) i++;
    const a = keys[i - 1];
    const b = keys[i];
    if (g.f === 1) return idx.map((j) => b[j]); // fixed mode
    const s = (t - a[0]) / (b[0] - a[0] || 1);
    return idx.map((j) => a[j] + (b[j] - a[j]) * s);
  };
  const [r, gg, b] = ch(g.c, [1, 2, 3]);
  const [a] = ch(g.a, [1]);
  return [r, gg, b, a];
}
function evalMMG(m: MinMaxGrad | undefined, t: number, r: number): [number, number, number, number] {
  if (!m) return [1, 1, 1, 1];
  const lerp = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * r) as [number, number, number, number];
  switch (m.m) {
    case 0:
      return (m.max ?? [1, 1, 1, 1]) as [number, number, number, number];
    case 1:
      return evalGrad(m.g, t);
    case 2:
      return lerp(m.min ?? [1, 1, 1, 1], m.max ?? [1, 1, 1, 1]);
    case 3:
      return lerp(evalGrad(m.gn, t), evalGrad(m.g, t));
    default:
      return evalGrad(m.g, r); // random colour from the gradient
  }
}

// ── small 3D math (column vectors, 3x4 affine stored as 12 numbers) ─────────
type Mat = number[]; // [r00 r01 r02 tx, r10 r11 r12 ty, r20 r21 r22 tz]
const IDENT: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
function trs(p: number[], q: number[], s: number[]): Mat {
  const [x, y, z, w] = q;
  const r = [
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y),
  ];
  return [r[0] * s[0], r[1] * s[1], r[2] * s[2], p[0], r[3] * s[0], r[4] * s[1], r[5] * s[2], p[1], r[6] * s[0], r[7] * s[1], r[8] * s[2], p[2]];
}
function mul(a: Mat, b: Mat): Mat {
  const o = new Array(12);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 4; j++)
      o[i * 4 + j] = a[i * 4] * b[j] + a[i * 4 + 1] * b[4 + j] + a[i * 4 + 2] * b[8 + j] + (j === 3 ? a[i * 4 + 3] : 0);
  return o;
}
const apply = (m: Mat, v: number[]) => [0, 1, 2].map((i) => m[i * 4] * v[0] + m[i * 4 + 1] * v[1] + m[i * 4 + 2] * v[2] + m[i * 4 + 3]);
const applyDir = (m: Mat, v: number[]) => [0, 1, 2].map((i) => m[i * 4] * v[0] + m[i * 4 + 1] * v[1] + m[i * 4 + 2] * v[2]);
function rotationOnly(m: Mat): Mat {
  const o = m.slice();
  for (let j = 0; j < 3; j++) {
    const l = Math.hypot(m[j], m[4 + j], m[8 + j]) || 1;
    for (let i = 0; i < 3; i++) o[i * 4 + j] = m[i * 4 + j] / l;
  }
  o[3] = o[7] = o[11] = 0;
  return o;
}
function eulerToQuat(e: number[]): number[] {
  // Unity order ZXY (applied Z, then X, then Y)
  const [x, y, z] = e.map((v) => (v * DEG) / 2);
  const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
  return [sx * cy * cz + cx * sy * sz, cx * sy * cz - sx * cy * sz, cx * cy * sz - sx * sy * cz, cx * cy * cz + sx * sy * sz];
}
const rand = random;

// ── shaders ──────────────────────────────────────────────────────────────────
const PART_VERT = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aKeep;
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 uST;
varying vec2 vUv;
varying vec4 vColor;
varying float vKeep;
void main(){
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
  vUv = aTextureCoord * uST.xy + uST.zw;
  vColor = aColor;
  vKeep = aKeep;
}`;
const PART_FRAG = `
varying vec2 vUv;
varying vec4 vColor;
varying float vKeep;
uniform sampler2D uSampler;
uniform float uAlpha;
void main(){
  vec4 c = texture2D(uSampler, vUv) * vColor;
  float a = c.a * uAlpha;
  gl_FragColor = vec4(c.rgb * a, a * vKeep);
}`;
let partProgram: PIXI.Program | undefined;
const whiteTex = () => PIXI.Texture.WHITE;

type BlendKind = "alpha" | "add" | "addAlpha" | "multiply";
function blendOf(shader: string | null | undefined): BlendKind {
  const s = shader || "";
  if (/Additive\+AlphaBlend/.test(s)) return "addAlpha";
  if (/Multiply/.test(s)) return "multiply";
  if (/Add/.test(s)) return "add";
  return "alpha";
}

// ── emitter ─────────────────────────────────────────────────────────────────
interface Particle {
  p: number[]; // position (sim space: units local, or ref world)
  v: number[]; // velocity (sim space, units/s or ref/s)
  age: number;
  life: number;
  size: number[];
  rot: number;
  rotVel: number;
  color: number[];
  r: number[]; // per-particle randoms
  sub?: SubState[];
}
interface SubState {
  em: Emitter;
  t: number;
  acc: number;
  bursts: number[];
}

class Emitter {
  ps: Json;
  particles: Particle[] = [];
  time = 0;
  emitting = false;
  alive = false; // played at least once and not cleared
  private emitAcc = 0;
  private burstDone: number[] = [];
  mesh?: PIXI.Mesh;
  blend: BlendKind = "alpha";
  customStream = false;
  world: Mat = IDENT; // emitter frame (ref px), updated per frame
  rotM: Mat = IDENT;
  scale: number[] = [1, 1, 1];
  isSub = false;
  u: number; // ref px per world unit
  uv: { tx: number; ty: number } = { tx: 1, ty: 1 };
  st = [1, 1, 0, 0];

  public node: FxNode;
  public fx: FxInstance;
  constructor(
    node: FxNode,
    fx: FxInstance,
  ) {
    this.node = node;
    this.fx = fx;
    this.ps = JSON.parse(JSON.stringify(node.ps)); // animated per instance
    this.u = fx.data.unit ?? UNIT;
    const uvm = this.ps.UVModule;
    if (uvm) this.uv = { tx: uvm.tilesX || 1, ty: uvm.tilesY || 1 };
  }

  get worldSpace() {
    return this.ps.moveWithTransform === 1;
  }
  get duration() {
    return this.ps.lengthInSec || 5;
  }

  play() {
    this.time = -evalMM(this.ps.startDelay, 0, rand());
    this.emitting = true;
    this.alive = true;
    this.emitAcc = 0;
    this.burstDone = [];
    this.particles = [];
    if (this.ps.prewarm && this.ps.looping) {
      for (let t = 0; t < this.duration; t += 1 / 30) this.step(1 / 30);
    }
  }
  stop() {
    this.emitting = false;
  }
  clear() {
    this.emitting = false;
    this.alive = false;
    this.particles = [];
  }

  // spawn one particle; `at` = sim-space position override (sub-emitters)
  spawn(at?: number[], inherit?: Particle, inheritFlags = 0) {
    const im = this.ps.InitialModule;
    if (!im || this.particles.length >= (im.maxNumParticles ?? 1000)) return;
    const tn = Math.max(0, this.time) / this.duration;
    const r = [rand(), rand(), rand(), rand(), rand(), rand(), rand(), rand()];
    const shape = this.shapePoint();
    let pos = shape[0];
    const dir = shape[1];
    let life = evalMM(im.startLifetime, tn, rand());
    const speed = evalMM(im.startSpeed, tn, rand());
    const sx = evalMM(im.startSize, tn, r[0]);
    const size = im.size3D ? [sx, evalMM(im.startSizeY, tn, r[0]), 1] : [sx, sx, 1];
    let rot = evalMM(im.startRotation, tn, rand());
    if (im.randomizeRotationDirection && rand() < im.randomizeRotationDirection) rot = -rot;
    let color = evalMMG(im.startColor, tn, rand());
    let v = dir.map((d) => d * speed);
    if (this.worldSpace) {
      pos = this.toRef(pos);
      v = this.dirToRef(v);
    }
    if (at) pos = at.slice();
    if (inherit) {
      if (inheritFlags & 1) color = color.map((c, i) => c * inherit.color[i]) as typeof color;
      if (inheritFlags & 2) for (let i = 0; i < 2; i++) size[i] *= inherit.size[i];
      if (inheritFlags & 4) rot += inherit.rot;
      if (inheritFlags & 8) life *= inherit.life;
    }
    const p: Particle = { p: pos, v, age: 0, life: Math.max(life, 1e-3), size, rot, rotVel: 0, color, r };
    const sub = this.ps.SubModule?.subEmitters as Json[] | undefined;
    if (sub)
      for (const s of sub) {
        const em = s.emitter != null ? this.fx.emitterOf(s.emitter) : undefined;
        if (!em || rand() > (s.emitProbability ?? 1)) continue;
        if (s.type === 0) (p.sub ??= []).push({ em, t: 0, acc: 0, bursts: [] });
      }
    this.particles.push(p);
    return p;
  }

  // local-space point + direction on the emission shape (units)
  private shapePoint(): [number[], number[]] {
    const sh = this.ps.ShapeModule;
    if (!sh || !sh.enabled) return [[0, 0, 0], [0, 0, 1]];
    const radius = sh.radius?.value ?? 1;
    const thick = sh.radiusThickness ?? 1;
    const arc = ((sh.arc?.value ?? 360) * DEG) as number;
    const rr = () => radius * (1 - thick * (1 - Math.sqrt(rand()))) ; // area-uniform within the shell
    let p = [0, 0, 0];
    let d = [0, 0, 1];
    const unit = () => {
      const u = rand() * 2 - 1;
      const th = rand() * 2 * Math.PI;
      const s = Math.sqrt(1 - u * u);
      return [s * Math.cos(th), s * Math.sin(th), u];
    };
    switch (sh.type) {
      case 0: // sphere
      case 1: {
        d = unit();
        const k = radius * (1 - thick * (1 - Math.cbrt(rand())));
        p = d.map((x) => x * k);
        break;
      }
      case 2: // hemisphere (+z)
      case 3: {
        d = unit();
        d[2] = Math.abs(d[2]);
        const k = radius * (1 - thick * (1 - Math.cbrt(rand())));
        p = d.map((x) => x * k);
        break;
      }
      case 4: // cone (base)
      case 7:
      case 8: // cone volume
      case 9: {
        const a = rand() * arc;
        const k = rr();
        const base = [Math.cos(a) * k, Math.sin(a) * k, 0];
        const t = Math.tan((sh.angle ?? 25) * DEG);
        d = [(base[0] / (radius || 1)) * t, (base[1] / (radius || 1)) * t, 1];
        const l = Math.hypot(...d);
        d = d.map((x) => x / l);
        p = base;
        if (sh.type >= 8) {
          const h = rand() * (sh.length ?? 5);
          p = base.map((x, i) => x + d[i] * (h / d[2]));
        }
        break;
      }
      case 10: // circle (XY), outward
      case 11:
      case 17: {
        const a = rand() * arc;
        const k = sh.type === 11 ? radius : rr();
        d = [Math.cos(a), Math.sin(a), 0];
        p = [d[0] * k, d[1] * k, 0];
        break;
      }
      case 12: // single-sided edge along X, emits +Y
        p = [(rand() * 2 - 1) * radius, 0, 0];
        d = [0, 1, 0];
        break;
      default: {
        // box family / sprite: inside the (unit) box scaled by m_Scale, emits +Z
        p = [rand() - 0.5, rand() - 0.5, rand() - 0.5];
        d = [0, 0, 1];
      }
    }
    // shape transform (m_Position / m_Rotation / m_Scale)
    const q = eulerToQuat([sh.m_Rotation?.x ?? 0, sh.m_Rotation?.y ?? 0, sh.m_Rotation?.z ?? 0]);
    const sc = [sh.m_Scale?.x ?? 1, sh.m_Scale?.y ?? 1, sh.m_Scale?.z ?? 1];
    const m = trs([sh.m_Position?.x ?? 0, sh.m_Position?.y ?? 0, sh.m_Position?.z ?? 0], q, sc);
    p = apply(m, p);
    d = applyDir(trs([0, 0, 0], q, [1, 1, 1]), d);
    if (sh.randomDirectionAmount) {
      const u = unit();
      d = d.map((x, i) => x + (u[i] - x) * sh.randomDirectionAmount);
    }
    if (sh.sphericalDirectionAmount) {
      const l = Math.hypot(...p) || 1;
      d = d.map((x, i) => x + (p[i] / l - x) * sh.sphericalDirectionAmount);
    }
    if (sh.randomPositionAmount) p = p.map((x) => x + (rand() * 2 - 1) * sh.randomPositionAmount);
    const l = Math.hypot(...d) || 1;
    return [p, d.map((x) => x / l)];
  }

  private toRef(pUnits: number[]) {
    return apply(this.world, pUnits.map((v, i) => v * this.u * this.scale[i]));
  }
  private dirToRef(vUnits: number[]) {
    return applyDir(this.rotM, vUnits.map((v, i) => v * this.u * this.scale[i]));
  }

  step(dt: number) {
    const ps = this.ps;
    dt *= ps.simulationSpeed ?? 1;
    // emission
    if (this.emitting && !this.isSub) {
      const prev = this.time;
      this.time += dt;
      if (this.time >= 0) {
        if (this.time >= this.duration) {
          if (ps.looping) {
            this.time -= this.duration;
            this.burstDone = [];
          } else this.emitting = false;
        }
        const em = ps.EmissionModule;
        if (em?.enabled && this.emitting) {
          const tn = this.time / this.duration;
          this.emitAcc += evalMM(em.rateOverTime, tn, rand()) * dt;
          while (this.emitAcc >= 1) {
            this.emitAcc -= 1;
            this.spawn();
          }
          (em.m_Bursts || []).forEach((b: Json, i: number) => this.burst(b, i, prev, this.time));
        }
      }
    }
    // update
    const im = ps.InitialModule || {};
    const g = evalMM(im.gravityModifier, Math.max(0, this.time) / this.duration, rand());
    const vm = ps.VelocityModule;
    const cv = ps.ClampVelocityModule;
    const nz = ps.NoiseModule;
    const out: Particle[] = [];
    for (const p of this.particles) {
      p.age += dt;
      if (p.age >= p.life) {
        this.onDeath(p);
        continue;
      }
      const t = p.age / p.life;
      // gravity (world −y, units/s²)
      if (g) {
        const gv = this.worldSpace ? [0, -GRAVITY * g * this.u, 0] : this.gravityLocal(g);
        for (let i = 0; i < 3; i++) p.v[i] += gv[i] * dt;
      }
      const vel = p.v.slice();
      if (vm?.enabled) {
        const add = [evalMM(vm.x, t, p.r[1]), evalMM(vm.y, t, p.r[2]), evalMM(vm.z, t, p.r[3])];
        const w = this.worldSpace ? this.dirToRef(add) : add;
        for (let i = 0; i < 3; i++) vel[i] += w[i];
        const sm = vm.speedModifier ? evalMM(vm.speedModifier, t, p.r[4]) : 1;
        if (sm !== 1) for (let i = 0; i < 3; i++) vel[i] *= sm;
        const radial = vm.radial ? evalMM(vm.radial, t, p.r[5]) : 0;
        if (radial) {
          const l = Math.hypot(p.p[0], p.p[1], p.p[2]) || 1;
          for (let i = 0; i < 3; i++) vel[i] += (p.p[i] / l) * radial * (this.worldSpace ? this.u : 1);
        }
      }
      if (cv?.enabled) {
        const unitK = this.worldSpace ? this.u : 1;
        const damp = 1 - Math.pow(1 - Math.min(1, cv.dampen ?? 0), dt * 30);
        if (cv.separateAxis) {
          const lim = [cv.x, cv.y, cv.z].map((c: MinMax) => evalMM(c, t, p.r[6]) * unitK);
          for (let i = 0; i < 3; i++) {
            const a = Math.abs(p.v[i]);
            if (a > lim[i]) p.v[i] -= Math.sign(p.v[i]) * (a - lim[i]) * damp;
          }
        } else {
          const lim = evalMM(cv.magnitude, t, p.r[6]) * unitK;
          const sp = Math.hypot(...p.v);
          if (sp > lim && sp > 0) {
            const ns = sp - (sp - lim) * damp;
            p.v = p.v.map((x) => (x / sp) * ns);
          }
        }
        const drag = cv.drag ? evalMM(cv.drag, t, p.r[7]) : 0;
        if (drag) p.v = p.v.map((x) => x * Math.max(0, 1 - drag * dt));
      }
      if (nz?.enabled) {
        const str = evalMM(nz.strength, t, p.r[0]) * (this.worldSpace ? this.u : 1);
        const f = nz.frequency ?? 0.5;
        const tt = (this.time + p.r[1] * 10) * (1 + (nz.scrollSpeed ? evalMM(nz.scrollSpeed, t, 0) : 0));
        const n = (s: number) => Math.sin(s * 1.7 + tt * 2.3) * 0.6 + Math.sin(s * 3.1 - tt * 1.3) * 0.4;
        const k = this.worldSpace ? 1 / this.u : 1;
        vel[0] += n(p.p[1] * f * k + p.r[2] * 50) * str;
        vel[1] += n(p.p[0] * f * k + p.r[3] * 50) * str;
      }
      for (let i = 0; i < 3; i++) p.p[i] += vel[i] * dt;
      const rm = ps.RotationModule;
      if (rm?.enabled) p.rot += evalMM(rm.curve, t, p.r[4]) * dt;
      // birth sub-emitters follow the particle
      if (p.sub) for (const s of p.sub) this.runSub(s, p, dt);
      out.push(p);
    }
    this.particles = out;
  }

  private gravityLocal(g: number) {
    const w = [0, -GRAVITY * g, 0];
    const r = this.rotM;
    // inverse rotation (transpose), units
    return [0, 1, 2].map((j) => (r[j] * w[0] + r[4 + j] * w[1] + r[8 + j] * w[2]) / (this.scale[j] || 1));
  }

  private burst(b: Json, i: number, prev: number, now: number) {
    const cycles = b.cycleCount || 1;
    const done = this.burstDone[i] ?? 0;
    if (done >= cycles && cycles > 0) return;
    const at = b.time + done * (b.repeatInterval || 0.01);
    if (now >= at && (prev < at || prev > now || done === 0)) {
      this.burstDone[i] = done + 1;
      if (rand() > (b.probability ?? 1)) return;
      const n = Math.round(evalMM(b.countCurve, 0, rand()));
      for (let j = 0; j < n; j++) this.spawn();
    }
  }

  // a birth sub-emitter runs its own emission while its parent lives
  private runSub(s: SubState, parent: Particle, dt: number) {
    const em = s.em;
    const e = em.ps.EmissionModule;
    if (!e?.enabled) return;
    const prev = s.t;
    s.t += dt;
    const dur = em.duration;
    if (s.t > dur && !em.ps.looping) return;
    const tn = (s.t % dur) / dur;
    s.acc += evalMM(e.rateOverTime, tn, rand()) * dt;
    const at = this.subPos(parent, em);
    while (s.acc >= 1) {
      s.acc -= 1;
      em.spawn(at);
    }
    (e.m_Bursts || []).forEach((b: Json, i: number) => {
      const done = s.bursts[i] ?? 0;
      if (done >= (b.cycleCount || 1)) return;
      const t = b.time + done * (b.repeatInterval || 0.01);
      if (s.t >= t && prev <= t) {
        s.bursts[i] = done + 1;
        const n = Math.round(evalMM(b.countCurve, 0, rand()));
        for (let j = 0; j < n; j++) em.spawn(at);
      }
    });
  }
  // parent position expressed in the sub-emitter's simulation space
  private subPos(p: Particle, em: Emitter) {
    const ref = this.worldSpace ? p.p : this.toRef(p.p);
    if (em.worldSpace) return ref;
    // into em local units (inverse of em.world, ignoring shear)
    const w = em.world;
    const d = [ref[0] - w[3], ref[1] - w[7], ref[2] - w[11]];
    const r = em.rotM;
    return [0, 1, 2].map((j) => (r[j] * d[0] + r[4 + j] * d[1] + r[8 + j] * d[2]) / (this.u * (em.scale[j] || 1)));
  }
  private onDeath(p: Particle) {
    const sub = this.ps.SubModule?.subEmitters as Json[] | undefined;
    if (!sub) return;
    for (const s of sub) {
      if (s.type !== 2) continue;
      const em = s.emitter != null ? this.fx.emitterOf(s.emitter) : undefined;
      if (!em || rand() > (s.emitProbability ?? 1)) continue;
      const at = this.subPos(p, em);
      const e = em.ps.EmissionModule;
      let n = 0;
      for (const b of e?.m_Bursts || []) n += Math.round(evalMM(b.countCurve, 0, rand()));
      if (!n) n = 1;
      for (let j = 0; j < n; j++) em.spawn(at, p, s.properties || 0);
    }
  }

  // ── geometry ──────────────────────────────────────────────────────────────
  build(alpha: number) {
    const ps = this.ps;
    const psr = this.node.psr || {};
    const mode = psr.m_RenderMode ?? 0;
    const n = this.particles.length;
    const pos = new Float32Array(n * 8);
    const uv = new Float32Array(n * 8);
    const col = new Float32Array(n * 16);
    const keep = new Float32Array(n * 4);
    const idx = new Uint16Array(n * 6);
    const sm = ps.SizeModule;
    const cm = ps.ColorModule;
    const um = ps.UVModule;
    const cd = ps.CustomDataModule;
    const piv = psr.pivot || [0, 0, 0];
    const minPx = (psr.m_MinParticleSize ?? 0) * 720;
    const maxPx = (psr.m_MaxParticleSize ?? 0.5) * 720 * 2; // screen-height fraction (generous)
    for (let i = 0; i < n; i++) {
      const p = this.particles[i];
      const t = p.age / p.life;
      // position → ref → stage px
      const ref = this.worldSpace ? p.p : this.toRef(p.p);
      const cx = 640 + ref[0] * K;
      const cy = 360 - ref[1] * K;
      let sx = p.size[0];
      let sy = p.size[1];
      if (sm?.enabled) {
        const a = evalMM(sm.curve, t, p.r[5]);
        sx *= a;
        sy *= sm.separateAxes ? evalMM(sm.y, t, p.r[5]) : a;
      }
      const sbs = ps.SizeBySpeedModule;
      if (sbs?.enabled) {
        const sp = Math.hypot(...p.v) / (this.worldSpace ? this.u : 1);
        const range = sbs.range || { x: 0, y: 1 };
        const tt = Math.min(1, Math.max(0, (sp - range.x) / ((range.y - range.x) || 1)));
        const a = evalMM(sbs.curve, tt, p.r[5]);
        sx *= a;
        sy *= a;
      }
      let w = sx * this.u * Math.abs(this.scale[0]) * K;
      let h = sy * this.u * Math.abs(this.scale[1]) * K;
      const clampPx = (v: number) => Math.min(Math.max(v, minPx), maxPx || v);
      w = clampPx(w);
      h = clampPx(h);
      let c = p.color.slice();
      if (cm?.enabled) {
        const g = evalMMG(cm.gradient, t, p.r[6]);
        c = c.map((v, j) => v * g[j]);
      }
      // texture sheet frame
      let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
      if (um?.enabled && (this.uv.tx > 1 || this.uv.ty > 1)) {
        const cyc = um.cycles || 1;
        const tt = (t * cyc) % 1;
        const count = um.animationType === 1 ? this.uv.tx : this.uv.tx * this.uv.ty;
        // frameOverTime and startFrame are serialised as fractions of the sheet
        const fr = evalMM(um.frameOverTime, tt, p.r[7]) + evalMM(um.startFrame, 0, p.r[7]);
        let f = Math.floor(fr * count) % count;
        if (f < 0) f += count;
        let row = 0;
        if (um.animationType === 1) row = um.rowMode === 1 ? Math.floor(p.r[0] * this.uv.ty) : um.rowIndex || 0;
        const fx = um.animationType === 1 ? f : f % this.uv.tx;
        const fy = um.animationType === 1 ? row : Math.floor(f / this.uv.tx);
        u0 = fx / this.uv.tx;
        u1 = (fx + 1) / this.uv.tx;
        v0 = fy / this.uv.ty;
        v1 = (fy + 1) / this.uv.ty;
      }
      // quad corners (stage px)
      let ax: number, ay: number, bx: number, by: number;
      let rot = p.rot;
      if (mode === 1) {
        // stretched along screen velocity
        // stretched billboard: length = sizeY·lengthScale + speed·velocityScale
        // along the screen velocity (straight up when the particle is at rest),
        // width = sizeX
        const vr = this.worldSpace ? p.v : this.dirToRef(p.v);
        const vx = vr[0] * K;
        const vy = -vr[1] * K;
        const sp = Math.hypot(vx, vy);
        const len = h * (psr.m_LengthScale ?? 2) + sp * (psr.m_VelocityScale ?? 0);
        rot = sp > 1e-6 ? Math.atan2(vy, vx) : -Math.PI / 2;
        ax = len / 2;
        ay = w / 2;
        bx = ax;
        by = ay;
      } else {
        ax = w / 2;
        ay = h / 2;
        bx = ax;
        by = ay;
      }
      const co = Math.cos(rot);
      const si = Math.sin(rot);
      const ox = -piv[0] * w;
      const oy = piv[1] * h;
      const corners = [
        [-ax, -by],
        [bx, -by],
        [bx, ay],
        [-ax, ay],
      ];
      for (let j = 0; j < 4; j++) {
        const [x, y] = corners[j];
        const xx = x + ox;
        const yy = y + oy;
        pos[i * 8 + j * 2] = cx + xx * co - yy * si;
        pos[i * 8 + j * 2 + 1] = cy + xx * si + yy * co;
      }
      // corners TL, TR, BR, BL; sheet frame 0 is the top-left tile
      uv.set([u0, v0, u1, v0, u1, v1, u0, v1], i * 8);
      for (let j = 0; j < 4; j++) col.set(c, i * 16 + j * 4);
      let kp = 1;
      if (this.blend === "add") kp = 0;
      else if (this.blend === "addAlpha") {
        const cx1 = this.customStream && cd?.enabled ? evalMM(cd.vector0_0, t, p.r[3]) : 0;
        kp = cx1 > 0.5 ? 0 : 1;
      }
      keep.fill(kp, i * 4, i * 4 + 4);
      const b = i * 4;
      idx.set([b, b + 1, b + 2, b, b + 2, b + 3], i * 6);
    }
    const m = this.mesh!;
    const geo = m.geometry;
    geo.getBuffer("aVertexPosition").update(gpu(pos));
    geo.getBuffer("aTextureCoord").update(gpu(uv));
    geo.getBuffer("aColor").update(gpu(col));
    geo.getBuffer("aKeep").update(gpu(keep));
    geo.getIndex().update(gpu(idx));
    m.shader.uniforms.uAlpha = alpha;
    m.shader.uniforms.uST = this.st;
    m.visible = n > 0;
  }
}

// ── effect instance ─────────────────────────────────────────────────────────
interface NodeState {
  active: boolean;
  pos: number[];
  rot: number[];
  scale: number[];
  rect?: { amin: number[]; amax: number[]; apos: number[]; size: number[]; pivot: number[] };
  color?: number[]; // Image / SpriteRenderer colour
  world: Mat;
  rectW: number;
  rectH: number;
  wasActive: boolean;
}
interface Drawable {
  layer: "bottom" | "back" | "front" | "top";
  order: number;
  seq: number;
  obj: PIXI.DisplayObject;
}
interface AnimState {
  node: number;
  data: Json;
  state: string | null;
  t: number;
}

const texCache = new Map<string, PIXI.Texture>();
function loadTex(url: string, premultiplied: boolean) {
  const key = url + (premultiplied ? "#pm" : "#npm");
  let t = texCache.get(key);
  if (!t) {
    t = PIXI.Texture.from(url, { alphaMode: premultiplied ? PIXI.ALPHA_MODES.PMA : PIXI.ALPHA_MODES.NPM } as any);
    texCache.set(key, t);
  }
  return t;
}

export class FxInstance {
  readonly root = new PIXI.Container();
  private st: NodeState[];
  private emitters = new Map<number, Emitter>();
  private sprites = new Map<number, PIXI.Sprite>();
  private anims: AnimState[] = [];
  drawables: Drawable[] = [];
  state: "play" | "stopping" | "dead" = "play";
  // the parent the roots are laid out in: EffectLayer (1920x1080, pivot at the
  // centre) or, for character-attached effects, the ModelView (pivot bottom centre)
  origin = { x: 0, y: 0, scale: 1, pivotY: 0.5 };
  visible = true;
  private stopClipLeft = 0;

  public data: FxData;
  public base: string;
  constructor(
    data: FxData,
    base: string,
  ) {
    this.data = data;
    this.base = base;
    this.st = data.nodes.map((n) => ({
      active: !!n.active,
      pos: n.pos.slice(),
      rot: n.rot.slice(),
      scale: n.scale.slice(),
      rect: n.rect ? JSON.parse(JSON.stringify(n.rect)) : undefined,
      color: n.image?.color?.slice() ?? n.sprite?.color?.slice(),
      world: IDENT,
      rectW: 0,
      rectH: 0,
      wasActive: false,
    }));
    let seq = 0;
    data.nodes.forEach((n, i) => {
      if (n.ps) {
        const em = new Emitter(n, this);
        this.emitters.set(i, em);
        const mat = data.materials[n.psr?.materials?.[0]] || {};
        em.blend = blendOf(mat.shader);
        em.customStream = !!n.psr?.m_UseCustomVertexStreams && String(n.psr?.m_VertexStreams || "").includes("1f");
        const tex = mat.tex?._MainTex;
        if (tex?.st) em.st = tex.st;
        em.mesh = this.makeMesh(tex ? loadTex(`${base}/${tex.file}`, false) : whiteTex(), em.blend);
        this.addDrawable(em.mesh, n.psr, seq++);
      }
      if (n.image?.sprite || n.sprite?.sprite) {
        const spr = this.makeSprite(n);
        if (spr) {
          this.sprites.set(i, spr);
          const r = n.sprite ? { m_SortingOrder: n.sprite.order, m_SortingLayerID: -348333445 } : { m_SortingOrder: this.canvasOrder(i), m_SortingLayerID: this.canvasLayer(i) };
          this.addDrawable(spr, r, seq++);
        }
      }
      if (n.animator) this.anims.push({ node: i, data: n.animator, state: n.animator.default, t: 0 });
    });
    // systems used as sub-emitters don't emit by themselves
    for (const em of this.emitters.values())
      for (const s of em.ps.SubModule?.subEmitters || []) {
        const sub = s.emitter != null ? this.emitters.get(s.emitter) : undefined;
        if (sub) sub.isSub = true;
      }
  }

  emitterOf(node: number) {
    return this.emitters.get(node);
  }

  private canvasOrder(i: number): number {
    for (let n = i; n !== -1; n = this.data.nodes[n].parent) {
      const c = this.data.nodes[n].canvas;
      if (c) return c.m_SortingOrder ?? 230;
    }
    return 230;
  }
  private canvasLayer(i: number): number {
    for (let n = i; n !== -1; n = this.data.nodes[n].parent) {
      const c = this.data.nodes[n].canvas;
      if (c) return c.m_SortingLayerID ?? -348333445;
    }
    return -348333445;
  }

  private addDrawable(obj: PIXI.DisplayObject, r: Json, seq: number) {
    const layerId = r?.m_SortingLayerID ?? -348333445;
    const order = r?.m_SortingOrder ?? 0;
    // sorting layers: Default(0) < UI < AreaObject(109347411); characters draw at UI 220
    const layer = layerId === 0 ? "bottom" : layerId === 109347411 ? "top" : order < 220 ? "back" : "front";
    this.drawables.push({ layer, order, seq, obj });
  }

  private makeMesh(tex: PIXI.Texture, blend: BlendKind) {
    partProgram ??= PIXI.Program.from(PART_VERT, PART_FRAG, "scenario-particles");
    const geo = new PIXI.Geometry()
      .addAttribute("aVertexPosition", new PIXI.Buffer(gpu(new Float32Array(0)), false), 2)
      .addAttribute("aTextureCoord", new PIXI.Buffer(gpu(new Float32Array(0)), false), 2)
      .addAttribute("aColor", new PIXI.Buffer(gpu(new Float32Array(0)), false), 4)
      .addAttribute("aKeep", new PIXI.Buffer(gpu(new Float32Array(0)), false), 1)
      .addIndex(new PIXI.Buffer(gpu(new Uint16Array(0)), false, true));
    const shader = new PIXI.MeshMaterial(tex, { program: partProgram, uniforms: { uAlpha: 1, uST: [1, 1, 0, 0] } });
    const mesh = new PIXI.Mesh(geo, shader);
    mesh.blendMode = blend === "multiply" ? PIXI.BLEND_MODES.MULTIPLY : PIXI.BLEND_MODES.NORMAL;
    mesh.visible = false;
    return mesh;
  }

  private makeSprite(n: FxNode) {
    const key = n.image?.sprite ?? n.sprite?.sprite;
    const sp = this.data.sprites[key];
    if (!sp?.tex) return null;
    const base = loadTex(`${this.base}/${sp.tex}`, false); // files are straight alpha
    const rect = sp.rect;
    const s = new PIXI.Sprite(base);
    const setFrame = () => {
      const H = base.baseTexture.height;
      // Unity rect y is from the bottom
      s.texture = new PIXI.Texture(base.baseTexture, new PIXI.Rectangle(rect[0], H - rect[1] - rect[3], rect[2], rect[3]));
    };
    if (base.baseTexture.valid) setFrame();
    else base.baseTexture.once("loaded", setFrame);
    s.anchor.set(0.5);
    const mat = this.data.materials[n.image?.material ?? n.sprite?.materials?.[0]] || {};
    const b = blendOf(mat.shader);
    s.blendMode = b === "add" ? PIXI.BLEND_MODES.ADD : b === "multiply" ? PIXI.BLEND_MODES.MULTIPLY : PIXI.BLEND_MODES.NORMAL;
    return s;
  }

  // ── per frame ─────────────────────────────────────────────────────────────
  update(dt: number) {
    if (this.state === "dead") return;
    this.animate(dt);
    this.layout();
    // activation edges restart / clear systems (playOnAwake)
    this.data.nodes.forEach((n, i) => {
      const s = this.st[i];
      const on = this.effectiveActive(i);
      const em = this.emitters.get(i);
      if (em && on !== s.wasActive) {
        if (on && this.state === "play" && (n.ps.playOnAwake ?? 1) && !em.isSub) em.play();
        else if (!on) em.clear();
      }
      s.wasActive = on;
    });
    for (const [i, em] of this.emitters) {
      const s = this.st[i];
      em.world = s.world;
      em.rotM = rotationOnly(s.world);
      em.scale = this.data.nodes[i].scale.map((v, j) => this.st[i].scale[j] ?? v);
      if (s.wasActive || em.isSub) em.step(dt);
    }
    // render
    for (const [i, em] of this.emitters) em.build(this.visible && (this.st[i].wasActive || em.isSub) ? 1 : 0);
    for (const [i, spr] of this.sprites) {
      const s = this.st[i];
      const on = this.visible && this.effectiveActive(i);
      spr.visible = on;
      if (!on) continue;
      const w = s.world;
      spr.position.set(640 + w[3] * K, 360 - w[7] * K);
      const n = this.data.nodes[i];
      const sx = Math.hypot(w[0], w[4]);
      const sy = Math.hypot(w[1], w[5]);
      if (n.image && s.rect) {
        spr.width = s.rectW * sx * K;
        spr.height = s.rectH * sy * K;
      } else {
        const sp = this.data.sprites[n.sprite.sprite];
        spr.width = (sp.rect[2] / sp.ppu) * sx * K * (n.sprite.flip?.[0] ? -1 : 1);
        spr.height = (sp.rect[3] / sp.ppu) * sy * K;
      }
      spr.rotation = -Math.atan2(w[4], w[0]);
      const c = s.color ?? [1, 1, 1, 1];
      spr.tint = new PIXI.Color([c[0], c[1], c[2]].map((v) => Math.min(1, Math.max(0, v)))).toNumber();
      spr.alpha = Math.max(0, Math.min(1, c[3]));
    }
    if (this.state === "stopping") {
      this.stopClipLeft -= dt;
      const alive = [...this.emitters.values()].some((e) => e.particles.length > 0);
      if (!alive && this.stopClipLeft <= 0) this.state = "dead";
    }
  }

  private effectiveActive(i: number) {
    for (let n = i; n !== -1; n = this.data.nodes[n].parent) if (!this.st[n].active) return false;
    return true;
  }

  // hierarchy → world matrices (ref px). Roots sit in EffectLayer: a 1920x1080
  // rect with its pivot at the screen centre (or the character's foot point).
  private layout() {
    const visit = (i: number, parent: Mat, pw: number, ph: number, ppiv: number[]) => {
      const n = this.data.nodes[i];
      const s = this.st[i];
      let local: number[];
      if (s.rect) {
        const r = s.rect;
        const pminX = -ppiv[0] * pw;
        const pminY = -ppiv[1] * ph;
        const aminX = pminX + r.amin[0] * pw;
        const aminY = pminY + r.amin[1] * ph;
        const amaxX = pminX + r.amax[0] * pw;
        const amaxY = pminY + r.amax[1] * ph;
        s.rectW = amaxX - aminX + r.size[0];
        s.rectH = amaxY - aminY + r.size[1];
        local = [aminX + (amaxX - aminX) * r.pivot[0] + r.apos[0], aminY + (amaxY - aminY) * r.pivot[1] + r.apos[1], s.pos[2]];
      } else {
        s.rectW = s.rectH = 0;
        local = s.pos;
      }
      s.world = mul(parent, trs(local, s.rot, s.scale));
      for (const c of n.children) visit(c, s.world, s.rectW || pw, s.rectH || ph, s.rect ? s.rect.pivot : [0.5, 0.5]);
    };
    const o = trs([this.origin.x, this.origin.y, 0], [0, 0, 0, 1], [this.origin.scale, this.origin.scale, 1]);
    for (const r of this.data.roots) visit(r, o, 1920, 1080, [0.5, this.origin.pivotY]);
  }

  // ── animator ──────────────────────────────────────────────────────────────
  private animate(dt: number) {
    for (const a of this.anims) {
      const st = a.state ? a.data.states[a.state] : null;
      if (!st) continue;
      const clip = st.clip ? this.data.clips[st.clip] : null;
      a.t += dt * (st.speed ?? 1);
      const len = clip?.len || 0;
      // exit-time transitions without conditions
      for (const tr of st.trans || []) {
        if (tr.exit && !(tr.conds || []).length && len > 0 && a.t >= tr.exitTime * len) {
          a.state = tr.to;
          a.t = 0;
          break;
        }
      }
      if (!clip) continue;
      let t = a.t;
      if (clip.loop && len > 0) t %= len;
      else t = Math.min(t, len);
      this.applyClip(a.node, clip, t);
    }
  }

  private find(from: number, path: string) {
    let i = from;
    if (!path) return i;
    for (const part of path.split("/")) {
      const c = this.data.nodes[i].children.find((ch) => this.data.nodes[ch].name === part);
      if (c == null) return -1;
      i = c;
    }
    return i;
  }

  private applyClip(animNode: number, clip: Json, t: number) {
    for (const cv of clip.curves) {
      const i = this.find(animNode, cv.path);
      if (i < 0) continue;
      const s = this.st[i];
      if (cv.kind === "float") {
        const v = evalCurve(cv.curve, t);
        const at: string = cv.attr || "";
        if (at === "m_IsActive") s.active = v > 0.5;
        else if (at.startsWith("script:m_Color.") || at.startsWith("m_Color.") || at.startsWith("material._Color.")) {
          const ch = "rgba".indexOf(at[at.length - 1]);
          s.color ??= [1, 1, 1, 1];
          s.color[ch] = v;
        } else if (at.startsWith("m_AnchoredPosition.") && s.rect) s.rect.apos[at.endsWith("x") ? 0 : 1] = v;
        else if (at.startsWith("m_AnchorMax.") && s.rect) s.rect.amax[at.endsWith("x") ? 0 : 1] = v;
        else if (at.startsWith("m_AnchorMin.") && s.rect) s.rect.amin[at.endsWith("x") ? 0 : 1] = v;
        else if (at.startsWith("m_SizeDelta.") && s.rect) s.rect.size[at.endsWith("x") ? 0 : 1] = v;
        else if (at.startsWith("m_LocalPosition.")) s.pos["xyz".indexOf(at[at.length - 1])] = v;
        else if (at.startsWith("m_LocalScale.")) s.scale["xyz".indexOf(at[at.length - 1])] = v;
        else if (at === "looping") {
          const em = this.emitters.get(i);
          if (em) em.ps.looping = v > 0.5 ? 1 : 0;
        } else if (at.startsWith("material._MainTex_ST.")) {
          const em = this.emitters.get(i);
          if (em) em.st["xyzw".indexOf(at[at.length - 1])] = v;
        }
      } else if (cv.kind === "position" || cv.kind === "scale" || cv.kind === "euler") {
        const v = evalVec(cv.keys, t);
        if (cv.kind === "position") {
          if (s.rect) {
            s.rect.apos[0] = v[0];
            s.rect.apos[1] = v[1];
          } else s.pos = v;
        } else if (cv.kind === "scale") s.scale = v;
        else s.rot = eulerToQuat(v);
      }
    }
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────
  stop() {
    if (this.state !== "play") return;
    this.state = "stopping";
    for (const em of this.emitters.values()) em.stop();
    for (const a of this.anims) {
      const stop = Object.entries(a.data.states as Record<string, Json>).find(([, s]) => s.name === "Stop");
      if (stop) {
        a.state = stop[0];
        a.t = 0;
        this.stopClipLeft = Math.max(this.stopClipLeft, this.data.clips[stop[1].clip]?.len || 0);
      } else a.state = null; // animator disabled: pose frozen
    }
  }
  forceStop() {
    this.state = "dead";
  }
  destroy() {
    for (const d of this.drawables) d.obj.destroy();
    this.drawables = [];
  }
}

function evalVec(keys: Json[], t: number): number[] {
  if (!keys.length) return [0, 0, 0];
  const out = [0, 1, 2].map((a) => evalCurve({ k: keys.map((k: Json) => [k[0], k[1][a], k[2][a], k[3][a]]) }, t));
  return out;
}

// ── manager: owns the instances, ticks them, routes drawables to stage layers ─
export interface FxLayers {
  bottom: PIXI.Container;
  back: PIXI.Container;
  front: PIXI.Container;
  top: PIXI.Container;
}

const BG_KEY = "@background";

// where a character-attached effect sits (ref px, y-up) and whether it shows
type Attach = () => { x: number; y: number; scale?: number; visible: boolean } | null;

export class FxManager {
  private live: { name: string; fx: FxInstance; attach?: Attach }[] = [];
  private cache = new Map<string, Promise<FxData | null>>();

  private ticker: PIXI.Ticker;
  private layers: FxLayers;
  private root: string;
  constructor(
    ticker: PIXI.Ticker,
    layers: FxLayers,
    root: string = storyUrls.fxRoot(),
  ) {
    this.ticker = ticker;
    this.layers = layers;
    this.root = root;
    ticker.add(this.tick, this);
  }

  private load(name: string) {
    let p = this.cache.get(name);
    if (!p) {
      p = fetch(`${this.root}/${name}/effect.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      this.cache.set(name, p);
    }
    return p;
  }

  // `key` names the instance for stop()/detach() (defaults to the effect name);
  // `into` puts every drawable in one container (background prefabs)
  async play(name: string, attach?: Attach, key = name, into?: PIXI.Container) {
    const data = await this.load(name);
    if (!data) {
      if (!into) console.warn("scenario effect missing", name);
      return;
    }
    const fx = new FxInstance(data, `${this.root}/${name}`);
    for (const d of fx.drawables.sort((a, b) => a.order - b.order || a.seq - b.seq)) {
      const layer = into ?? this.layers[d.layer];
      // keep layer children ordered by sorting order
      (d.obj as any).__order = d.order;
      const at = layer.children.findIndex((c: any) => (c.__order ?? 0) > d.order);
      if (at < 0) layer.addChild(d.obj);
      else layer.addChildAt(d.obj, at);
    }
    this.live.push({ name: key, fx, attach });
    return fx;
  }

  // StopScenarioEffect: every live instance with that name
  stop(name: string, force = false) {
    for (const l of this.live) {
      if (l.name !== name || l.attach) continue;
      if (force) l.fx.forceStop();
      else l.fx.stop();
    }
  }
  // character-attached effects (hologram): ForceStop on detach
  detach(match: (attachName: string) => boolean) {
    for (const l of this.live) if (l.attach && match(l.name)) l.fx.forceStop();
  }
  clear() {
    for (const l of this.live) if (l.name !== BG_KEY) l.fx.forceStop();
  }

  // Prefab backgrounds (ScenarioBGData.BackgroundPrefab): replace the running one.
  private bgId = "";
  private bgIndex?: Promise<Set<string>>;
  background(id: string, into: PIXI.Container) {
    if (id === this.bgId) return;
    this.bgId = id;
    for (const l of this.live) if (l.name === BG_KEY) l.fx.forceStop();
    this.bgIndex ??= fetch(`${this.root}/bg/index.json`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((ids: string[]) => new Set(ids));
    void this.bgIndex.then(async (ids) => {
      if (!ids.has(id) || this.bgId !== id) return;
      const fx = await this.play(`bg/${id}`, undefined, BG_KEY, into);
      if (fx && this.bgId !== id) fx.forceStop(); // replaced while loading
    });
  }
  names() {
    return this.live.filter((l) => !l.attach && l.fx.state === "play").map((l) => l.name);
  }

  private tick() {
    const dt = Math.min(this.ticker.deltaMS / 1000, 0.1);
    for (const l of this.live) {
      if (l.attach) {
        const a = l.attach();
        if (!a) l.fx.forceStop();
        else {
          l.fx.origin = { x: a.x, y: a.y, scale: a.scale ?? 1, pivotY: 0 };
          l.fx.visible = a.visible;
        }
      }
      l.fx.update(dt);
    }
    const dead = this.live.filter((l) => l.fx.state === "dead");
    if (dead.length) {
      for (const l of dead) l.fx.destroy();
      this.live = this.live.filter((l) => l.fx.state !== "dead");
    }
  }

  destroy() {
    this.ticker.remove(this.tick, this);
    for (const l of this.live) l.fx.destroy();
    this.live = [];
  }
}
