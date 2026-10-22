// BGM / SE / voice playback. Every source is a list of candidate mp3 URLs
// (the same clip can sit in several folders of the asset tree); the next one
// is tried when a URL fails to load.

// An <audio> that walks `urls` on load errors and calls `failed` when none works.
function candidateAudio(urls: string[], failed?: () => void): HTMLAudioElement {
  const a = new Audio();
  a.crossOrigin = "anonymous";
  let i = 0;
  a.addEventListener("error", () => {
    if (a.dataset.stopped) return; // stopped while still loading
    if (++i < urls.length) {
      a.src = urls[i];
      a.play().catch(() => {});
    } else failed?.();
  });
  if (urls.length > 0) a.src = urls[0];
  else queueMicrotask(() => failed?.());
  return a;
}

function stop(a: HTMLAudioElement) {
  a.dataset.stopped = "1";
  a.pause();
}

export class AudioManager {
  private bgm?: HTMLAudioElement;
  private bgmUrl?: string;
  private voice?: HTMLAudioElement;
  private voiceDone?: () => void; // settles the current playVoice() promise
  private muted = false;
  // after the analyser, so muting keeps the lip-sync input
  private gain?: GainNode;

  // Web Audio graph for voice lip-sync (amplitude analysis).
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private voiceSrc?: MediaElementAudioSourceNode;
  private timeBuf?: Uint8Array<ArrayBuffer>;
  // a MediaElementSource can only be created once per element, so reuse a pool
  private srcCache = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

  private ensureCtx() {
    if (!this.ctx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AC();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const gain = ctx.createGain();
      gain.gain.value = this.muted ? 0 : 1;
      analyser.connect(gain);
      gain.connect(ctx.destination);
      this.ctx = ctx;
      this.analyser = analyser;
      this.gain = gain;
      this.timeBuf = new Uint8Array(analyser.fftSize);
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  // Current voice amplitude (RMS, ~0-1) for lip-sync; 0 if no voice playing.
  getVoiceLevel(): number {
    if (!this.analyser || !this.timeBuf || !this.voice || this.voice.paused) return 0;
    this.analyser.getByteTimeDomainData(this.timeBuf);
    let sum = 0;
    for (let i = 0; i < this.timeBuf.length; i++) {
      const d = (this.timeBuf[i] - 128) / 128;
      sum += d * d;
    }
    const rms = Math.sqrt(sum / this.timeBuf.length);
    return Math.min(0.85, rms * 2.4); // gain for a natural open (not a gape)
  }

  /** Silence BGM, SE and voice (the voice still drives lip-sync). */
  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.bgm) this.bgm.muted = muted;
    if (this.gain) this.gain.gain.value = muted ? 0 : 1;
    if (this.voice && !this.voiceSrc) this.voice.muted = muted;
  }

  playBgm(urls: string[], volume = 1, fadeMs = 250) {
    const url = urls[0];
    if (this.bgm && this.bgmUrl === url) return; // same BGM already playing
    const old = this.bgm;
    this.bgmUrl = url;
    const a = candidateAudio(urls, () => console.warn("bgm load failed", url));
    a.muted = this.muted;
    a.loop = true;
    a.volume = fadeMs > 0 ? 0 : volume;
    a.play().catch((e) => console.warn("bgm play blocked/failed", e));
    this.bgm = a;
    if (fadeMs > 0) {
      this.fadeAudio(a, volume, fadeMs); // fade in new
      if (old) this.fadeAudio(old, 0, fadeMs, () => stop(old)); // crossfade out old
    } else if (old) {
      stop(old);
    }
  }

  private fadeAudio(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
    const from = el.volume;
    const t0 = Date.now();
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / ms);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) setTimeout(tick, 33);
      else done?.();
    };
    tick();
  }
  stopBgm() {
    if (this.bgm) {
      stop(this.bgm);
      this.bgm = undefined;
      this.bgmUrl = undefined;
    }
  }
  setBgmVolume(v: number) {
    if (this.bgm) this.bgm.volume = Math.max(0, Math.min(1, v));
  }

  playSe(urls: string[], volume = 1) {
    if (urls.length === 0) return;
    const a = candidateAudio(urls, () => console.warn("se load failed", urls[0]));
    a.muted = this.muted;
    a.volume = volume;
    a.play().catch((e) => console.warn("se play failed", e));
  }

  // Resolves when the voice clip ends (or fails to load). Never rejects.
  // Routed through an AnalyserNode so getVoiceLevel() can drive lip-sync.
  playVoice(urls: string[], volume = 1): Promise<void> {
    this.stopVoice();
    return new Promise((resolve) => {
      let finish = () => {};
      const a = candidateAudio(urls, () => {
        console.warn("voice load failed", urls[0]);
        finish();
      });
      a.volume = volume;
      this.voice = a;
      try {
        this.ensureCtx();
        let src = this.srcCache.get(a);
        if (!src) {
          src = this.ctx!.createMediaElementSource(a);
          this.srcCache.set(a, src);
        }
        src.connect(this.analyser!);
        this.voiceSrc = src;
      } catch (e) {
        console.warn("voice analyser setup failed", e);
        a.muted = this.muted; // played directly, outside the graph
      }
      let done = false;
      finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      this.voiceDone = finish;
      a.addEventListener("ended", finish);
      // a rejected play() on a missing file is followed by the error walk
      a.play().catch((e: DOMException) => {
        if (e.name === "NotAllowedError") finish();
      });
    });
  }
  stopVoice() {
    if (this.voiceSrc) {
      try {
        this.voiceSrc.disconnect();
      } catch {
        /* noop */
      }
      this.voiceSrc = undefined;
    }
    if (this.voice) {
      stop(this.voice);
      this.voice = undefined;
    }
    // a stopped clip never fires "ended": settle its promise here
    const done = this.voiceDone;
    this.voiceDone = undefined;
    done?.();
  }
}
