// Script overview beside the stage, styled like the game's talk log
// (TalkLogWindowDialog / TalkLogWindowCell.prefab): every line of the episode
// with its character icon, the current line marked and later lines dimmed, so
// the list doubles as the progress bar. Searchable; clicking a line (or a
// place telop) jumps playback there.

import { Action, SpecialEffectType, type ScenarioSceneData } from "./types";
import { storyUrls } from "./urls";

const MOB_ICON = "chr_ts_mob.png";

export interface ScriptLogLabels {
  searchPlaceholder: string;
  matches: (count: number) => string;
}

interface Entry {
  seq: number; // snippet index to jump to
  el: HTMLElement;
  bodyEl?: HTMLElement;
  name: string;
  body: string;
  talk: boolean;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export class ScriptLog {
  private root: HTMLElement;
  private list: HTMLElement;
  private input: HTMLInputElement;
  private countEl: HTMLElement;
  private barEl: HTMLElement;
  private entries: Entry[] = [];
  private talks = 0;
  private current = -1;
  private lastSeq = -1;

  private onJump: (seq: number) => void;
  private labels: ScriptLogLabels;
  constructor(
    parent: HTMLElement,
    scn: ScenarioSceneData,
    icons: Record<string, string>,
    onJump: (seq: number) => void,
    labels: ScriptLogLabels,
  ) {
    this.onJump = onJump;
    this.labels = labels;
    const iconDir = storyUrls.ui("chr_ts/");
    this.root = document.createElement("aside");
    this.root.className = "script-log";
    this.root.innerHTML = `<div class="sl-head">
        <input class="sl-search" type="search" placeholder="${esc(labels.searchPlaceholder)}" spellcheck="false" />
        <span class="sl-count"></span>
      </div>
      <div class="sl-bar"><i></i></div>
      <div class="sl-list"></div>`;
    parent.appendChild(this.root);
    this.list = this.root.querySelector(".sl-list")!;
    this.input = this.root.querySelector(".sl-search")!;
    this.countEl = this.root.querySelector(".sl-count")!;
    this.barEl = this.root.querySelector(".sl-bar i")!;

    const frag = document.createDocumentFragment();
    scn.Snippets.forEach((s, seq) => {
      if (s.Action === Action.Talk) {
        const t = scn.TalkData[s.ReferenceIndex];
        if (!t) return;
        const id = t.TalkCharacters?.[0]?.Character2dId;
        const icon = (id != null && icons[id]) || MOB_ICON;
        const el = document.createElement("div");
        el.className = "sl-cell";
        el.innerHTML = `<img class="sl-icon" src="${iconDir}${icon}" alt="" loading="lazy" />
          <div class="sl-name">${esc(t.WindowDisplayName)}</div><div class="sl-body"></div>`;
        const bodyEl = el.querySelector<HTMLElement>(".sl-body")!;
        bodyEl.textContent = t.Body;
        this.entries.push({ seq, el, bodyEl, name: t.WindowDisplayName, body: t.Body, talk: true });
        this.talks++;
      } else if (s.Action === Action.SpecialEffect) {
        const e = scn.SpecialEffectData[s.ReferenceIndex];
        if (e?.EffectType !== SpecialEffectType.Telop || !e.StringVal) return;
        const el = document.createElement("div");
        el.className = "sl-place";
        el.textContent = e.StringVal;
        this.entries.push({ seq, el, name: "", body: e.StringVal, talk: false });
      } else return;
      const entry = this.entries[this.entries.length - 1];
      entry.el.addEventListener("click", () => this.onJump(entry.seq));
      frag.appendChild(entry.el);
    });
    this.list.appendChild(frag);
    this.setProgress(-1);

    this.input.addEventListener("input", () => this.search(this.input.value));
    // Enter: scroll to the next visible match
    this.input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const shown = this.entries.filter((x) => !x.el.hidden);
      if (!shown.length) return;
      const top = this.list.scrollTop + 1;
      const next = shown.find((x) => x.el.offsetTop - this.list.offsetTop > top) ?? shown[0];
      this.list.scrollTo({ top: next.el.offsetTop - this.list.offsetTop, behavior: "smooth" });
    });
  }

  destroy() {
    this.root.remove();
  }

  setVisible(on: boolean) {
    this.root.classList.toggle("hidden", !on);
  }
  get visible() {
    return !this.root.classList.contains("hidden");
  }

  // Mark the entry at or before snippet `seq` as current; later ones as future.
  setProgress(seq: number) {
    this.lastSeq = seq;
    let cur = -1;
    for (let i = 0; i < this.entries.length && this.entries[i].seq <= seq; i++) cur = i;
    if (cur === this.current && seq >= 0) return;
    this.current = cur;
    let talkNo = 0;
    this.entries.forEach((e, i) => {
      e.el.classList.toggle("cur", i === cur);
      e.el.classList.toggle("future", i > cur);
      if (e.talk && i <= cur) talkNo++;
    });
    this.countEl.textContent = this.input.value ? this.countEl.textContent : `${talkNo} / ${this.talks}`;
    this.barEl.style.width = `${this.talks ? (100 * talkNo) / this.talks : 0}%`;
    // follow playback unless the reader is looking around the list
    const el = this.entries[cur]?.el;
    if (el && !this.input.value && !this.root.matches(":hover")) {
      const top = el.offsetTop - this.list.offsetTop;
      if (top < this.list.scrollTop || top + el.offsetHeight > this.list.scrollTop + this.list.clientHeight)
        this.list.scrollTo({ top: top - this.list.clientHeight / 3, behavior: "smooth" });
    }
  }

  private search(q: string) {
    const needle = q.trim().toLowerCase();
    let hits = 0;
    for (const e of this.entries) {
      const hay = `${e.name}\n${e.body}`.toLowerCase();
      const hit = !needle || hay.includes(needle);
      e.el.hidden = !hit;
      if (hit && needle) hits++;
      const target = e.bodyEl ?? e.el;
      if (!needle) target.textContent = e.body;
      else if (hit) {
        // highlight every occurrence in the body (names match without marks)
        const lower = e.body.toLowerCase();
        let out = "";
        let i = 0;
        for (let j = lower.indexOf(needle); j >= 0; j = lower.indexOf(needle, i)) {
          out += esc(e.body.slice(i, j)) + `<mark>${esc(e.body.slice(j, j + needle.length))}</mark>`;
          i = j + needle.length;
        }
        target.innerHTML = out + esc(e.body.slice(i));
      }
    }
    if (needle) this.countEl.textContent = this.labels.matches(hits);
    else {
      this.current = -2; // force a refresh of the counter + scroll position
      this.setProgress(this.lastSeq);
    }
  }
}
