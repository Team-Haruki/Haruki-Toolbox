// Full-screen SpecialEffect overlays (DOM, over the stage canvas):
//
// FrontCover ColorFader (cases 1-4, 20/21/40/41): one full-screen overlay;
//   Play(target, delay, duration) holds for `delay`, then lerps ALL of RGBA
//   linearly from the current colour. In = opaque→clear, Out = →opaque.
// Telop (8): caption = StringVal, ScenarioTelop.prefab Show clip, held 2.0s
//   (or until a click), Hide clip.
// SideFadePlayer (29-36): black panel + feathered edges sliding across
//   everything (OutQuad), ScenarioSideFadePlayer.Play.
// PlaceInfo (18), FullScreenText (24), SimpleSelectable (23), Movie (19):
//   see the methods below.

import { EASE, REF, sideFade } from "./camera";
import { clock, playClip, sleep, tween } from "./clock";

export type RGBA = [number, number, number, number];

// ScenarioTelop.prefab animator (ac_scenario_telop_v2_01): Show =
// clip_scenario_telop_v2_01, Hide = clip_scenario_telop_v2_02, both 0.333s.
// [time s, value] keys sampled from the clips at 60 fps; sampled linearly.
type Keys = [number, number][];
const TELOP_SHOW = {
  baseScaleX: [[0, 0], [0.017, 0.123], [0.033, 0.254], [0.05, 0.378], [0.067, 0.49], [0.083, 0.589],
    [0.1, 0.675], [0.117, 0.749], [0.133, 0.813], [0.15, 0.865], [0.167, 0.909], [0.183, 0.943],
    [0.2, 0.968], [0.217, 0.986], [0.233, 0.997], [0.25, 1]] as Keys,
  baseAlpha: [[0, 0], [0.017, 0.014], [0.033, 0.055], [0.05, 0.124], [0.067, 0.216], [0.083, 0.325],
    [0.1, 0.442], [0.117, 0.557], [0.133, 0.664], [0.15, 0.757], [0.167, 0.835], [0.183, 0.897],
    [0.2, 0.944], [0.217, 0.976], [0.233, 0.994], [0.25, 1]] as Keys,
  textAlpha: [[0.05, 0], [0.067, 0.012], [0.083, 0.052], [0.1, 0.136], [0.117, 0.291], [0.133, 0.55],
    [0.15, 0.808], [0.167, 0.9], [0.333, 1]] as Keys,
  // anchoredPosition.x -30 -> 0 (reference px), flat tangents at both ends
  textX: [[0.05, -30], [0.12, -24.7], [0.19, -15], [0.26, -5.3], [0.333, 0]] as Keys,
};
const TELOP_HIDE_ALPHA: Keys = [[0, 1], [0.033, 0.992], [0.067, 0.962], [0.1, 0.904], [0.133, 0.804],
  [0.167, 0.645], [0.2, 0.424], [0.233, 0.212], [0.267, 0.079], [0.3, 0.017], [0.333, 0]];
const REF_TO_STAGE = 1280 / 1920;

function sample(keys: Keys, t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
  }
  return keys[keys.length - 1][1];
}

export class Effects {
  private fadeEl: HTMLElement;
  private telopEl: HTMLElement;
  private telopBase: HTMLElement;
  private telopText: HTMLElement;
  private sideEl: HTMLElement;
  private placeEl: HTMLElement;
  private placeText: HTMLElement;
  private movieEl: HTMLVideoElement;
  private fade: RGBA = [0, 0, 0, 0];
  private fadeToken = 0;

  private parent: HTMLElement;
  constructor(parent: HTMLElement) {
    this.parent = parent;
    this.fadeEl = document.createElement("div");
    this.fadeEl.className = "fx-fade";
    parent.appendChild(this.fadeEl);

    this.sideEl = document.createElement("div");
    this.sideEl.className = "fx-side hidden";
    this.sideEl.innerHTML = `<i class="l"></i><i class="r"></i><i class="t"></i><i class="b"></i>`;
    parent.appendChild(this.sideEl);

    this.placeEl = document.createElement("div");
    this.placeEl.className = "fx-place hidden";
    this.placeEl.innerHTML = `<div class="fx-place-text"></div>`;
    this.placeText = this.placeEl.firstElementChild as HTMLElement;
    parent.appendChild(this.placeEl);

    this.movieEl = document.createElement("video");
    this.movieEl.className = "fx-movie hidden";
    this.movieEl.playsInline = true;
    parent.appendChild(this.movieEl);

    this.telopEl = document.createElement("div");
    this.telopEl.className = "fx-telop hidden";
    this.telopEl.innerHTML = `<div class="fx-telop-box">
        <div class="fx-telop-base"><i class="l"></i><i class="m"></i><i class="r"></i></div>
        <div class="fx-telop-text"></div>
      </div>`;
    this.telopBase = this.telopEl.querySelector(".fx-telop-base")!;
    this.telopText = this.telopEl.querySelector(".fx-telop-text")!;
    parent.appendChild(this.telopEl);
  }

  private paintFade(c: RGBA) {
    this.fade = c;
    const [r, g, b, a] = c.map((v, i) => (i < 3 ? Math.round(v * 255) : v));
    this.fadeEl.style.background = `rgba(${r},${g},${b},${a})`;
  }

  // ColorFader.Play: hold `delayMs`, then lerp every RGBA channel from `from`
  // (default: the current colour) to `to`.
  async colorFade(to: RGBA, ms: number, from: RGBA = this.fade, delayMs = 0) {
    const token = ++this.fadeToken;
    this.paintFade(from);
    if (delayMs > 0) await sleep(delayMs);
    const f = from.slice() as RGBA;
    await tween(ms, 0, 1, (k) => {
      if (token === this.fadeToken) this.paintFade(f.map((v, i) => v + (to[i] - v) * k) as RGBA);
    });
  }
  get fadeColor(): RGBA {
    return this.fade.slice() as RGBA;
  }

  // ScenarioSideFadePlayer.Play: Out slides the black panel in from that side
  // and leaves it covering; In slides it away (then hides it).
  async sideFade(type: string, seconds: number) {
    const f = sideFade(type);
    const el = this.sideEl;
    el.classList.remove("hidden");
    const put = (x: number, y: number) => (el.style.transform = `translate(${x * REF}px, ${-y * REF}px)`);
    put(...f.from);
    await tween(seconds * 1000, 0, 1, (k) => {
      put(f.from[0] + (f.to[0] - f.from[0]) * k, f.from[1] + (f.to[1] - f.from[1]) * k);
    }, EASE.OutQuad);
    if (f.hideAtEnd) el.classList.add("hidden");
  }

  // Jump: put the overlays straight into the replayed state.
  reset(fade: RGBA, side?: string) {
    this.fadeToken++;
    this.paintFade(fade);
    this.telopEl.classList.add("hidden");
    this.placeEl.classList.add("hidden");
    this.placeState = "none";
    this.stopMovie();
    this.sideEl.classList.toggle("hidden", !side);
    this.sideEl.style.transform = "";
    this.fst?.remove();
    this.fst = undefined;
    this.choice?.remove();
    this.choice = undefined;
  }

  // ── PlaceInfo (18): TopLeft2/PlaceInfo slides in 0.2s OutQuart; it hides
  // when the next talk window closes (ScenarioPlayer.OnFinishTalkWindow).
  private placeState: "none" | "in" | "shown" | "out" = "none";
  private placeCloseReserved = false;
  private static PLACE_HIDDEN_X = -732 * REF; // panel + tail fully off-screen
  async showPlace(text: string) {
    this.placeText.textContent = text;
    // TMP auto-size 18..40 ref: shrink to fit one line
    this.placeText.style.fontSize = "";
    this.placeEl.classList.remove("hidden");
    for (let fs = 40; fs > 18 && this.placeText.scrollWidth > this.placeText.clientWidth; fs -= 1)
      this.placeText.style.fontSize = `${fs * REF}px`;
    if (this.placeState === "shown" || this.placeState === "in") return;
    this.placeState = "in";
    this.placeCloseReserved = false;
    const x0 = Effects.PLACE_HIDDEN_X;
    await tween(200, x0, 0, (x) => (this.placeEl.style.transform = `translateX(${x}px)`), EASE.OutQuart);
    if (this.placeState !== "in") return;
    this.placeState = "shown";
    if (this.placeCloseReserved) void this.hidePlace();
  }
  async hidePlace() {
    if (this.placeState === "in") {
      this.placeCloseReserved = true;
      return;
    }
    if (this.placeState !== "shown") return;
    this.placeState = "out";
    await tween(200, 0, Effects.PLACE_HIDDEN_X, (x) => (this.placeEl.style.transform = `translateX(${x}px)`), EASE.OutQuart);
    if (this.placeState !== "out") return;
    this.placeState = "none";
    this.placeEl.classList.add("hidden");
  }

  // ── Movie (19): cover to black 0.5s, play the clip (cover fades back),
  // black again for its last 0.5s, then reveal after 0.5s. Resolves at the end.
  async movie(url: string, hideUi: (on: boolean) => void): Promise<void> {
    const v = this.movieEl;
    await this.colorFade([0, 0, 0, 1], 500);
    hideUi(true);
    v.src = url;
    v.muted = false;
    const ok = await new Promise<boolean>((res) => {
      v.oncanplay = () => res(true);
      v.onerror = () => res(false);
      v.load();
    });
    if (ok) {
      v.classList.remove("hidden");
      await v.play().catch(() => ((v.muted = true), v.play().catch(() => {})));
      void this.colorFade([0, 0, 0, 0], 500);
      const epoch = clock.epoch;
      await new Promise<void>((res) => {
        let tail = false;
        v.ontimeupdate = () => {
          if (!tail && v.duration - v.currentTime <= 0.5) {
            tail = true;
            void this.colorFade([0, 0, 0, 1], 500);
          }
        };
        v.onended = () => res();
        v.onerror = () => res();
        const guard = () => (epoch !== clock.epoch ? res() : setTimeout(guard, 250));
        guard();
      });
    } else console.warn("movie load failed", url);
    this.stopMovie();
    this.paintFade([0, 0, 0, 1]);
    hideUi(false);
    void this.colorFade([0, 0, 0, 0], 500, [0, 0, 0, 1], 500);
  }
  private stopMovie() {
    const v = this.movieEl;
    v.pause();
    v.ontimeupdate = v.onended = v.onerror = v.oncanplay = null;
    v.removeAttribute("src");
    v.classList.add("hidden");
  }

  // Telop full sequence: fade in caption, hold, fade out. `hold` is a function
  // so the player can choose 2.0s (auto) or wait-for-click (manual).
  async telop(text: string, hold: () => Promise<void>) {
    this.telopText.textContent = text;
    this.telopEl.classList.remove("hidden");
    await playClip(0.333, (t) => {
      this.telopBase.style.transform = `scaleX(${sample(TELOP_SHOW.baseScaleX, t)})`;
      this.telopBase.style.opacity = String(sample(TELOP_SHOW.baseAlpha, t));
      this.telopText.style.opacity = String(sample(TELOP_SHOW.textAlpha, t));
      this.telopText.style.transform = `translateX(${sample(TELOP_SHOW.textX, t) * REF_TO_STAGE}px)`;
    });
    await hold();
    await playClip(0.333, (t) => {
      const a = String(sample(TELOP_HIDE_ALPHA, t));
      this.telopBase.style.opacity = a;
      this.telopText.style.opacity = a;
    });
    this.telopEl.classList.add("hidden");
  }

  // expose for the player's auto/manual hold
  static holdAuto = () => sleep(2000); // 2.0s auto-hold (PlayCore_d__18)

  // ── FullScreenText (24): ScenarioFullScreenTextDialog. A run of consecutive
  // FST snippets shares one dialog (first opens it, last closes it).
  // First: base 0→.5 + cinemascope bars 0→160px in 1.0s (OutQuad), wait 0.5s.
  // Text: each slot of TMP's characterInfo array fades in over 0.125s, one at
  // a time; the array is padded to a power of two, so the tail still takes time.
  // Then wait for the voice (≤10s), hold 1.0s; a tap shortens each step.
  // Last: text + bars + base fade out in 1.0s. Auto-advances.
  private fst?: HTMLElement;
  async fullScreenText(
    text: string,
    o: { first: boolean; last: boolean; fast: boolean; playVoice?: () => Promise<void>; stopVoice: () => void },
  ) {
    let el = this.fst;
    if (!el || o.first) {
      el?.remove();
      el = document.createElement("div");
      el.className = "fx-fst";
      el.innerHTML = `<div class="fst-base"></div><div class="fst-bar top"></div><div class="fst-bar bottom"></div><div class="fst-text"></div>`;
      this.parent.appendChild(el);
      this.fst = el;
    }
    const base = el.querySelector<HTMLElement>(".fst-base")!;
    const bars = [...el.querySelectorAll<HTMLElement>(".fst-bar")];
    const txt = el.querySelector<HTMLElement>(".fst-text")!;
    let wake: (() => void) | undefined;
    let tapped: boolean;
    el.onclick = (e) => {
      e.stopPropagation();
      tapped = true;
      wake?.();
    };
    const waitOrTap = (p: Promise<unknown>) =>
      new Promise<void>((res) => {
        tapped = false;
        wake = res;
        void p.then(() => res());
      });
    const frame = (k: number, a: number) => {
      base.style.opacity = String(0.5 * a);
      for (const b of bars) b.style.height = `${160 * k}px`;
    };
    if (o.first) {
      frame(0, 1); // the base is already dim
      await tween(1000, 0, 1, (k) => frame(k, 1), EASE.OutQuad);
      await sleep(500);
    }
    const chars = [...text];
    txt.innerHTML = `<div>${chars.map((c) => (c === "\n" ? "<br>" : `<span>${c.replace(/[&<]/g, (m) => (m === "&" ? "&amp;" : "&lt;"))}</span>`)).join("")}</div>`;
    txt.style.opacity = "1";
    const spans = [...txt.querySelectorAll<HTMLElement>("span")];
    const showAll = () => spans.forEach((sp) => (sp.style.opacity = "1"));
    const voice = !o.fast && o.playVoice ? o.playVoice() : undefined;
    if (o.fast) showAll();
    else {
      spans.forEach((sp) => (sp.style.opacity = "0"));
      let slots = 1;
      while (slots < chars.length + 1) slots *= 2;
      tapped = false;
      wake = undefined;
      let si = 0;
      for (let i = 0; i < slots && !tapped; i++) {
        if (chars[i] !== undefined && chars[i] !== "\n" && chars[i].trim()) {
          const sp = spans[si++];
          await tween(125, 0, 1, (a) => (sp.style.opacity = String(a)));
        } else {
          if (chars[i] !== undefined && chars[i] !== "\n") si++;
          await sleep(125);
        }
      }
      showAll();
      if (voice) await waitOrTap(Promise.race([voice, sleep(10000)]));
      await waitOrTap(sleep(1000));
      if (tapped) o.stopVoice();
    }
    if (o.last) {
      await tween(1000, 1, 0, (a) => {
        txt.style.opacity = String(a);
        frame(a, a);
      }, EASE.OutQuad);
      el.remove();
      this.fst = undefined;
    } else txt.innerHTML = "";
  }

  // ── SimpleSelectable (23): AnswerChoiceDialog with two pill buttons; the
  // answer is cosmetic (no branching) and is always waited for, even in auto.
  // Open/close scale 0↔1 in 0.125s (linear), then 0.5s before the next snippet.
  private choice?: HTMLElement;
  async choose(options: string[]) {
    const el = document.createElement("div");
    el.className = "fx-choice";
    el.innerHTML = `<div class="fx-choice-win">${options
      .slice(0, 2)
      .map((t, i) => `<button class="fx-choice-btn" data-i="${i}"><span>${t.replace(/[&<]/g, (m) => (m === "&" ? "&amp;" : "&lt;"))}</span></button>`)
      .join("")}</div>`;
    this.parent.appendChild(el);
    this.choice = el;
    const win = el.firstElementChild as HTMLElement;
    const scale = (k: number) => (win.style.transform = `scale(${k})`);
    await tween(125, 0, 1, scale);
    await new Promise<void>((res) => {
      el.onclick = (e) => {
        e.stopPropagation();
        if ((e.target as HTMLElement).closest(".fx-choice-btn")) res();
      };
    });
    await tween(125, 1, 0, scale);
    el.remove();
    if (this.choice === el) this.choice = undefined;
    await sleep(500);
  }
}
