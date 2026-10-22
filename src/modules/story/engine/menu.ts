// Story menu — ScreenLayerScenario.prefab RightTop: the ⋯ button
// (UIPartsMenuButton) opens the ScenarioMenu panel. Values are the prefab's
// 1920x1080 reference rects mapped to the 1280x720 stage (x 2/3).
//
// Labels come from the page (i18n). The game's bookmark / consecutive / skip
// buttons are replaced by what a web player needs: fullscreen (bookmark's
// slot) and mute; auto / fast / hide / log work as in the game (log toggles
// the script overview).

import { storyUrls } from "./urls";

const S = 2 / 3; // reference px → stage px

export type MenuLabelKey = "fullscreen" | "auto" | "mute" | "fast" | "hide" | "log";
export type MenuLabels = Record<MenuLabelKey, string>;

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export interface MenuHandlers {
  onFullscreen(): void;
  onMute(): void;
  onAuto(): void;
  onFast(): void;
  onHideUi(): void;
  onLog(): void;
}

// Wide buttons (280x96): top = Content top (72) - anchoredPosition.y - 8 is
// folded into `top`; icon centred 77.4 left of the button centre; label centred
// in its rect (width 280 - inset, shifted by `tx`).
// icons drawn here (used as masks like the game's icon sprites)
const svgMask = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`)}`;
const IC_FULLSCREEN = svgMask(`<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>`);
const IC_MUTE = svgMask(`<path d="M4 9h4l5-4v14l-5-4H4z" fill="#000"/><path d="M17 9l5 6M22 9l-5 6"/>`);

const WIDE: { key: MenuLabelKey; top: number; icon: string; iw: number; ih: number; inset: number; tx: number; sp: number }[] = [
  { key: "fullscreen", top: 64, icon: IC_FULLSCREEN, iw: 34, ih: 34, inset: 152, tx: 11.3, sp: -2 },
  { key: "auto", top: 195.7, icon: "ic_auto", iw: 32, ih: 36, inset: 152, tx: 11.3, sp: -2 },
  { key: "mute", top: 300.3, icon: IC_MUTE, iw: 38, ih: 34, inset: 152, tx: 11.3, sp: -2 },
  { key: "fast", top: 404.2, icon: "ic_fast", iw: 48, ih: 32, inset: 152, tx: 11.6, sp: -2 },
];
// Small buttons (136x112) at x ∓72 from the content centre, top 612.
const SMALL: { key: MenuLabelKey; cx: number; icon: string; iw: number; ih: number; ix: number }[] = [
  { key: "hide", cx: 196 - 72, icon: "ic_hide", iw: 58, ih: 32, ix: 0 },
  { key: "log", cx: 196 + 72, icon: "ic_log", iw: 52, ih: 32, ix: 1.6 },
];

const px = (v: number) => `${(v * S).toFixed(2)}px`;

export class ScenarioMenu {
  private button: HTMLElement;
  private panel: HTMLElement;
  private btns = new Map<string, HTMLElement>();

  constructor(parent: HTMLElement, h: MenuHandlers, labels: MenuLabels) {
    const ICON = storyUrls.ui("menu/");
    this.button = document.createElement("div");
    this.button.className = "scn-menu";
    parent.appendChild(this.button);

    this.panel = document.createElement("div");
    this.panel.className = "scn-menu-panel hidden";
    const icon = (name: string, w: number, h: number, extra = "") => {
      const url = name.startsWith("data:") ? `'${name}'` : `${ICON}${name}.png`;
      return `<i class="smp-ic" style="width:${px(w)};height:${px(h)};-webkit-mask-image:url(${url});mask-image:url(${url});${extra}"></i>`;
    };
    let html = `<div class="smp-close"></div><div class="smp-line"></div>`;
    for (const b of WIDE) {
      const tw = 280 - b.inset;
      html += `<div class="smp-btn wide" data-k="${b.key}" style="top:${px(b.top)}">
        ${icon(b.icon, b.iw, b.ih, `left:${px(140 - 77.4 - b.iw / 2)};top:${px(48 - b.ih / 2)}`)}
        <span style="left:${px(140 + b.tx - tw / 2)};width:${px(tw)};letter-spacing:${b.sp / 100}em">${esc(labels[b.key])}</span>
      </div>`;
    }
    for (const b of SMALL)
      html += `<div class="smp-btn small" data-k="${b.key}" style="left:${px(b.cx - 68)}">
        ${icon(b.icon, b.iw, b.ih, `left:${px(68 + b.ix - b.iw / 2)};top:${px(56 - 16 - b.ih / 2)}`)}
        <span>${esc(labels[b.key])}</span>
      </div>`;
    this.panel.innerHTML = html;
    parent.appendChild(this.panel);
    for (const el of this.panel.querySelectorAll<HTMLElement>(".smp-btn")) this.btns.set(el.dataset.k!, el);

    // menu clicks must not reach the stage (that would advance the story)
    const on = (el: Element, f: () => void) =>
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        f();
      });
    on(this.button, () => this.open());
    on(this.panel.querySelector(".smp-close")!, () => this.close());
    on(this.panel, () => {}); // swallow clicks on the panel background
    on(this.btns.get("fullscreen")!, () => {
      this.close();
      h.onFullscreen();
    });
    on(this.btns.get("mute")!, h.onMute);
    on(this.btns.get("auto")!, h.onAuto);
    on(this.btns.get("fast")!, h.onFast);
    on(this.btns.get("log")!, h.onLog);
    on(this.btns.get("hide")!, () => {
      this.close();
      h.onHideUi();
    });
  }

  // ac_scenario_menu Open / Close (clip_scenario_menu_open/close, 0.167s):
  // the panel grows from the top to 788 tall while Base/Content fades in; the
  // ⋯ button fades out. Close plays it backwards, then the button returns.
  private closing = 0;
  open() {
    this.closing++;
    this.panel.classList.remove("hidden", "closing");
    this.panel.classList.add("opening");
    this.button.classList.add("faded");
  }
  close() {
    if (this.panel.classList.contains("hidden")) return;
    const token = ++this.closing;
    this.panel.classList.remove("opening");
    this.panel.classList.add("closing");
    this.panel.addEventListener(
      "animationend",
      () => {
        if (token !== this.closing) return; // reopened meanwhile
        this.panel.classList.add("hidden");
        this.panel.classList.remove("closing");
        this.button.classList.remove("faded");
      },
      { once: true },
    );
  }

  // Toggle buttons turn pink (icon + label) while on.
  setState(s: { auto: boolean; fast: boolean; log: boolean; mute: boolean; fullscreen: boolean }) {
    this.btns.get("mute")!.classList.toggle("on", s.mute);
    this.btns.get("fullscreen")!.classList.toggle("on", s.fullscreen);
    this.btns.get("auto")!.classList.toggle("on", s.auto);
    this.btns.get("fast")!.classList.toggle("on", s.fast);
    this.btns.get("log")!.classList.toggle("on", s.log);
  }
}
