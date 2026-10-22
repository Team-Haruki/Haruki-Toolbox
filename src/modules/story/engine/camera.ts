// Camera / shake / blur building blocks for the scenario studio (JP 6.8.1).
// Derived from libil2cpp.so + the exported prefabs/shaders:
//   ScenarioStudioCamera (BlurIn 0x6369C00, BlurOut 0x6369E4C, CameraMove 0x636A094),
//   ScreenShakeInfinity 0x6355A78, TalkWindow.ShakeWindow 0x636FF9C,
//   DOTween.Shake 0x65A8C34, DollyZoomParams 0x636A1EC,
//   shaders Hidden/Sekai/Scenario/Post, Sekai/UI/UIGaussianBlur, Sekai/UI/UIDollyZoomEffect.
// Units: "ref" = 1920x1080 canvas units (Unity, y-up); stage px = ref * 2/3 (y-down).

import * as PIXI from "pixi.js";
import { storyUrls } from "./urls";

export const REF = 2 / 3; // ref unit → stage px

// DOTween eases (DOTweenSettings.asset defaultEaseType 6 = OutQuad)
export const EASE: Record<string, (t: number) => number> = {
  Linear: (t) => t,
  InSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  OutSine: (t) => Math.sin((t * Math.PI) / 2),
  InOutSine: (t) => -0.5 * (Math.cos(Math.PI * t) - 1),
  InQuad: (t) => t * t,
  OutQuad: (t) => -t * (t - 2),
  InOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  InCubic: (t) => t * t * t,
  OutCubic: (t) => (t - 1) ** 3 + 1,
  InOutCubic: (t) => (t < 0.5 ? 4 * t ** 3 : (t - 1) * (2 * t - 2) ** 2 + 1),
  OutQuart: (t) => 1 - (t - 1) ** 4,
  InBack: (t) => t * t * (2.70158 * t - 1.70158),
  OutBack: (t) => (t - 1) ** 2 * (2.70158 * (t - 1) + 1.70158) + 1,
};
export const outQuad = EASE.OutQuad;
// Enum.TryParse<Ease>(s, ignoreCase); empty / unknown → Linear
export function parseEase(name: string | undefined) {
  const k = name && Object.keys(EASE).find((e) => e.toLowerCase() === name.trim().toLowerCase());
  return k ? EASE[k] : EASE.Linear;
}

// DOTween.Shake: N = max(2, trunc(vibrato·duration)) points; segment i lasts
// ∝ (i+1) with fadeOut (equal otherwise), renormalised to `duration`; each
// point turns ~180°±randomness from the previous, magnitude drops strength/N
// per point with fadeOut, the last point is 0; segments are linear.
// ignoreZ=false (Transform.DOShakePosition) also yaws each point by
// U(-randomness, randomness), shrinking screen x by cos(r).
// Returns t (seconds) → [x, y] offset in ref units, y-up.
export function makeShake(duration: number, strength = 10, vibrato = 16, randomness = 90, fadeOut = true, ignoreZ = true) {
  const n = Math.max(2, Math.trunc(vibrato * duration));
  const ends = new Float64Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += fadeOut ? i + 1 : 1;
  let acc = 0;
  for (let i = 0; i < n; i++) ends[i] = acc += ((fadeOut ? i + 1 : 1) / sum) * duration;
  const px = new Float32Array(n);
  const py = new Float32Array(n);
  let ang = Math.random() * 360;
  let mag = strength;
  const deg = Math.PI / 180;
  for (let i = 0; i < n - 1; i++) {
    if (i > 0) ang = ang - 180 + (Math.random() * 2 - 1) * randomness;
    let x = mag * Math.cos(ang * deg);
    if (!ignoreZ) x *= Math.cos((Math.random() * 2 - 1) * randomness * deg);
    px[i] = x;
    py[i] = mag * Math.sin(ang * deg);
    if (fadeOut) mag -= strength / n;
  }
  let seg = 0;
  return (t: number): [number, number] => {
    if (t >= duration) return [0, 0];
    if (t < (seg ? ends[seg - 1] : 0)) seg = 0;
    while (ends[seg] <= t) seg++;
    const t0 = seg ? ends[seg - 1] : 0;
    const k = (t - t0) / (ends[seg] - t0);
    const ax = seg ? px[seg - 1] : 0;
    const ay = seg ? py[seg - 1] : 0;
    return [ax + (px[seg] - ax) * k, ay + (py[seg] - ay) * k];
  };
}

// ScenarioSideFadePlayer.Play: black panel tween (OutQuad), ref units y-up.
// "Out" slides in from that side and stays; "In" starts covering and leaves
// travelling the same way (LeftIn exits to the right).
export function sideFade(type: string, W = 1920, H = 1080) {
  const X = W + 512;
  const Y = H + 512;
  const t: Record<string, [number, number, number, number, boolean]> = {
    LeftOut: [-X, 0, 0, 0, false],
    LeftIn: [0, 0, X, 0, true],
    RightOut: [X, 0, 0, 0, false],
    RightIn: [0, 0, -X, 0, true],
    TopOut: [0, Y, 0, 0, false],
    TopIn: [0, 0, 0, -Y, true],
    BottomOut: [0, -Y, 0, 0, false],
    BottomIn: [0, 0, 0, Y, true],
  };
  const [fx, fy, tx, ty, hide] = t[type];
  return { from: [fx, fy] as [number, number], to: [tx, ty] as [number, number], hideAtEnd: hide };
}

// Scenario camera blur (Hidden/Sekai/Scenario/Post): downsample /2, then for
// i in 0..2: B = 1 + spread·i, a vertical and a horizontal 5-tap pass at
// 0, ±B, ±2B texels (weights .4026/.2442/.0545). One downsampled texel =
// 2 device px = 4/3 stage px on a 1080p device.
const BLUR_FRAG = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;
uniform vec4 inputClamp;
uniform vec2 uDir;
uniform float uStepPx;
vec4 tap(vec2 o){ return texture2D(uSampler, clamp(vTextureCoord + o, inputClamp.xy, inputClamp.zw)); }
void main(){
  vec2 o = uDir * uStepPx * inputSize.zw;
  gl_FragColor = tap(vec2(0.0))*0.4026 + (tap(o)+tap(-o))*0.2442 + (tap(2.0*o)+tap(-2.0*o))*0.0545;
}`;
export class ScenarioBlurFilter extends PIXI.Filter {
  spread = 0;
  private v = new PIXI.Filter(undefined, BLUR_FRAG, { uDir: [0, 1], uStepPx: 1 });
  private u = new PIXI.Filter(undefined, BLUR_FRAG, { uDir: [1, 0], uStepPx: 1 });
  private copy = new PIXI.AlphaFilter(1);
  apply(fm: PIXI.FilterSystem, input: PIXI.RenderTexture, output: PIXI.RenderTexture, clear: PIXI.CLEAR_MODES) {
    const a = fm.getFilterTexture(input);
    const b = fm.getFilterTexture(input);
    fm.applyFilter(this.copy, input, a, PIXI.CLEAR_MODES.CLEAR);
    for (let i = 0; i < 3; i++) {
      const step = (1 + this.spread * i) * (4 / 3);
      this.v.uniforms.uStepPx = step;
      fm.applyFilter(this.v, a, b, PIXI.CLEAR_MODES.CLEAR);
      this.u.uniforms.uStepPx = step;
      fm.applyFilter(this.u, b, a, PIXI.CLEAR_MODES.CLEAR);
    }
    fm.applyFilter(this.copy, a, output, clear);
    fm.returnFilterTexture(a);
    fm.returnFilterTexture(b);
  }
}

// Background material: UIGaussianBlur (uSampling 2.8, uDist 0) and
// UIDollyZoomEffect (_SamplingDistance / _DistortionStrength), in the
// background texture's own UV space.
const BG_VERT = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
varying vec2 vTextureCoord;
void main(){
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
  vTextureCoord = aTextureCoord;
}`;
const BG_FRAG = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 uColor;
uniform vec2 uTexel;
uniform float uSampling;
uniform float uDist;
float wt(int i){ return i==0||i==6?0.036: i==1||i==5?0.113: i==2||i==4?0.216: 0.269; }
void main(){
  vec2 d = vTextureCoord - 0.5;
  vec2 uv = clamp(d * (uDist * dot(d,d) + 1.0) + 0.5, 0.0, 1.0);
  if (uSampling <= 0.001) { gl_FragColor = texture2D(uSampler, uv) * uColor; return; }
  vec4 acc = vec4(0.0);
  vec2 sv = vec2(0.0, uTexel.y * uSampling), su = vec2(uTexel.x * uSampling, 0.0);
  vec2 pv = uv - 3.0*sv, pu = uv - 3.0*su;
  for (int i = 0; i < 7; i++) {
    acc += texture2D(uSampler, clamp(pv, 0.0, 1.0)) * wt(i) * 0.5;
    acc += texture2D(uSampler, clamp(pu, 0.0, 1.0)) * wt(i) * 0.5;
    pv += sv; pu += su;
  }
  gl_FragColor = acc * uColor;
}`;
const bgProgram = () => PIXI.Program.from(BG_VERT, BG_FRAG, "scenario-bg");

// A background drawn as a textured quad (centred on its position) so its
// shader sees the texture's UVs.
export function makeBackground(tex: PIXI.Texture) {
  const w = tex.width || 1;
  const h = tex.height || 1;
  const geom = new PIXI.Geometry()
    .addAttribute("aVertexPosition", [-w / 2, -h / 2, w / 2, -h / 2, w / 2, h / 2, -w / 2, h / 2], 2)
    .addAttribute("aTextureCoord", [0, 0, 1, 0, 1, 1, 0, 1], 2)
    .addIndex([0, 1, 2, 0, 2, 3]);
  const mat = new PIXI.MeshMaterial(tex, {
    program: bgProgram(),
    uniforms: { uTexel: [1 / w, 1 / h], uSampling: 0, uDist: 0 },
  });
  return new PIXI.Mesh(geom, mat);
}

// "Zoom：1.1, Blur：0, Dist：-5" (full-width colons allowed)
export function parseDolly(s: string) {
  const r: { zoom?: number; blur?: number; dist?: number } = {};
  for (const part of s.replace(/：/g, ":").split(",")) {
    const kv = part.split(":");
    if (kv.length !== 2) continue;
    const k = kv[0].trim().toLowerCase();
    const v = parseFloat(kv[1].trim());
    if (Number.isNaN(v)) continue;
    if (k === "zoom") r.zoom = v;
    else if (k === "blur") r.blur = v;
    else if (k === "dist") r.dist = v;
  }
  return r;
}

// Live2DHologramController + Live2DHologram material (also "monitor"):
//   g = dot(c.rgb, mono)·c.a; rgb = g·tone·.6 + c.rgb·.4; rgb += line ≥ n ? n·.07 : 0;
//   alpha = c.a·subA, n = holo.png at uv·0.25 + (0, t·0.1/20) over the model's
//   own rect — the in-game capture shows those horizontal scan lines (≈128
//   texel rows per model height), so uv1 follows the model, not 0.
const HOLO_FRAG = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D uHolo;
uniform highp vec4 inputSize;
uniform highp vec4 outputFrame;
uniform vec4 uModel; // model rect on screen: x, y, w, h (px)
uniform float uTime;
uniform float uLine;
uniform float uSubA;
void main(){
  vec4 c = texture2D(uSampler, vTextureCoord);
  vec3 col = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  float g = dot(col, vec3(0.2, 0.45, 0.35)) * c.a;
  vec3 rgb = g * vec3(0.9, 1.2, 1.15) * 0.6 + col * 0.4;
  vec2 screen = vTextureCoord * inputSize.xy + outputFrame.xy;
  vec2 uv1 = vec2((screen.x - uModel.x) / max(uModel.w, 1.0), 1.0 - (screen.y - uModel.y) / max(uModel.w, 1.0));
  float n = texture2D(uHolo, uv1 * 0.25 + vec2(0.0, uTime * 0.005)).r;
  rgb += uLine >= n ? n * 0.07 : 0.0;
  float a = c.a * uSubA;
  gl_FragColor = vec4(rgb * a, a);
}`;
let holoTex: PIXI.Texture | undefined;
export class HologramFilter extends PIXI.Filter {
  private timer = Math.random() * 0.2 + 0.05;
  constructor() {
    holoTex ??= PIXI.Texture.from(storyUrls.ui("scenario/holo.png"), {
      wrapMode: PIXI.WRAP_MODES.REPEAT,
    } as any);
    super(undefined, HOLO_FRAG, { uHolo: holoTex, uTime: 0, uLine: 0.86, uSubA: 0.7764706, uModel: [0, 0, 1, 1] });
  }
  // model rect in screen px (uv1 spans the model; height used for both axes)
  setModelRect(x: number, y: number, h: number) {
    if (Number.isFinite(h) && h > 1 && Number.isFinite(x) && Number.isFinite(y)) this.uniforms.uModel = [x, y, h, h];
  }
  // per frame (Live2DHologramController.Update): re-roll the flicker
  update(dt: number) {
    this.uniforms.uTime += dt;
    if (Math.random() * 10000 < 150 || this.timer <= 0) {
      this.uniforms.uLine = 0.6 + Math.random() * 0.2;
      this.uniforms.uSubA = 0.85 + Math.random() * 0.05;
      this.timer = Math.random() * 0.5;
    }
    this.timer -= dt;
  }
}

// ScenarioModelView ambient colours (multiply on the character only)
export const AMBIENT: Record<number, [number, number, number]> = {
  12: [1, 1, 1],
  13: [0.99, 0.9, 0.8],
  14: [0.83, 0.86, 0.91],
};
