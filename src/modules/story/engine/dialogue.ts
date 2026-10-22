// Dialogue window (DOM overlay over the PIXI canvas — crisp CJK text).

import { REF, makeShake } from "./camera";
import { clock, sleep } from "./clock";
import { storyUrls } from "./urls";

export class DialogueBox {
  private root: HTMLElement;
  private nameEl: HTMLElement;
  private bodyEl: HTMLElement;
  private noteEl: HTMLElement;
  private typing = false;
  private skip = false;
  private opened = false; // window-open fade plays once

  constructor(parent: HTMLElement) {
    this.root = document.createElement("div");
    this.root.className = "dialogue hidden";
    // the teal music-note is the game's tap-to-continue indicator
    // layout follows TalkWindow.prefab: the name bar sits behind the name
    this.root.innerHTML = `<div class="dlg-namebar"></div>
      <div class="dlg-name"></div>
      <div class="dlg-body"></div>
      <img class="dlg-note" src="${storyUrls.ui("serif_note.png")}" alt="" />
      <div class="dlg-auto"></div>`;
    parent.appendChild(this.root);
    this.nameEl = this.root.querySelector(".dlg-name")!;
    this.bodyEl = this.root.querySelector(".dlg-body")!;
    this.noteEl = this.root.querySelector(".dlg-note")!;
  }

  // The outline layer (CSS ::before) renders data-text, so keep both in step.
  private setText(el: HTMLElement, text: string) {
    el.textContent = text;
    el.dataset.text = text;
  }

  // AutoSignal: "▶ AUTO" while auto-advancing, "▶▶ SKIP" while fast-forwarding
  // (AutoSignalIcon1/2 + AutoSignalText / SkipSignalText).
  setAuto(mode: "off" | "auto" | "skip") {
    this.root.classList.toggle("auto", mode !== "off");
    this.root.classList.toggle("skip", mode === "skip");
  }

  // Jump: close the window and abandon any typing in progress.
  reset() {
    this.hide();
    this.typing = false;
    this.skip = false;
    this.stopShake();
  }

  hide() {
    this.root.classList.add("hidden");
    this.noteEl.classList.remove("show");
  }

  // Typewriter at the game's fixed 0.06s/char (ShowWords_d__95). Resolves when
  // the full body is shown. Click during typing fast-forwards (skipTyping()).
  // `instant` (早送り) shows the whole body at once.
  async show(name: string, body: string, instant = false): Promise<void> {
    this.root.classList.remove("hidden");
    this.setText(this.nameEl, name);
    this.root.classList.toggle("no-name", !name); // narration: no name, no bar
    this.setText(this.bodyEl, "");
    this.typing = true;
    this.skip = false;
    this.noteEl.classList.remove("show"); // hide indicator while typing
    if (!this.opened) {
      this.opened = true;
      await sleep(200); // 0.2s window-open fade
    }
    if (instant) this.skip = true;
    const delay = 60; // 0.06s per character
    for (let i = 0; i < body.length; i++) {
      if (this.skip) {
        this.setText(this.bodyEl, body);
        break;
      }
      this.setText(this.bodyEl, body.slice(0, i + 1));
      await sleep(delay);
    }
    this.typing = false;
    this.noteEl.classList.add("show"); // line done → show the continue mark
  }

  isTyping() {
    return this.typing;
  }
  skipTyping() {
    if (this.typing) this.skip = true;
  }

  // ShakeWindow (6): TalkWindow.ShakeWindow → DOShakeAnchorPos on the Text node
  // only (name + words; the panel, name bar and marks stay), strength 10 ref,
  // vibrato 16, randomness 90, fadeOut, 2D. ≥3600 s = endless (the snippet
  // finishes at once); StopShakeWindow (26) or a new shake ends it.
  private shakeToken = 0;
  shakeWindow(seconds: number): Promise<void> {
    this.stopShake();
    if (seconds <= 0) return Promise.resolve();
    const token = ++this.shakeToken;
    const endless = seconds >= 3600;
    const dur = endless ? 3600 : seconds;
    const shake = makeShake(dur, 10, 16, 90, true, true);
    const els = [this.nameEl, this.bodyEl];
    const t0 = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        if (token !== this.shakeToken) return resolve();
        const t = ((Date.now() - t0) / 1000) * clock.scale;
        const [x, y] = shake(t);
        for (const el of els) el.style.translate = `${x * REF}px ${-y * REF}px`;
        if (t < dur) setTimeout(tick, 16);
        else {
          this.stopShake();
          resolve();
        }
      };
      if (endless) resolve();
      tick();
    });
  }
  stopShake() {
    this.shakeToken++;
    for (const el of [this.nameEl, this.bodyEl]) el.style.translate = "";
  }
}
