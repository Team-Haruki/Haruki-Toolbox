// Shared timeline clock for every setTimeout-driven wait and tween.
//
// - `scale`: playback speed. 早送り (fast-forward) raises it so delays, fades,
//   moves and telops run shorter; 1 = normal.
// - `epoch`: bumped by cancelAll() when the player jumps. Waits and tweens
//   started in an older epoch never resolve, so stale coroutines from before
//   the jump stop where they are instead of touching the rebuilt stage.

export const clock = { scale: 1, epoch: 0 };

export function cancelAll() {
  clock.epoch++;
}

export function sleep(ms: number): Promise<void> {
  const epoch = clock.epoch;
  return new Promise((resolve) => {
    setTimeout(() => {
      if (epoch === clock.epoch) resolve();
    }, ms / clock.scale);
  });
}

// Tween of `set(v)` from `from` to `to` over `ms` (scaled), linear unless `ease` is given.
export function tween(
  ms: number,
  from: number,
  to: number,
  set: (v: number) => void,
  ease: (t: number) => number = (t) => t,
): Promise<void> {
  if (ms <= 0) {
    set(to);
    return Promise.resolve();
  }
  const epoch = clock.epoch;
  const dur = ms / clock.scale;
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if (epoch !== clock.epoch) return; // cancelled by a jump
      const k = Math.min(1, (Date.now() - t0) / dur);
      set(from + (to - from) * ease(k));
      if (k < 1) setTimeout(tick, 16);
      else resolve();
    };
    tick();
  });
}

// Drive `frame(t)` with clip time t (seconds) for `seconds`, setTimeout-paced.
export function playClip(seconds: number, frame: (t: number) => void): Promise<void> {
  const epoch = clock.epoch;
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if (epoch !== clock.epoch) return;
      const t = Math.min(seconds, ((Date.now() - t0) / 1000) * clock.scale);
      frame(t);
      if (t < seconds) setTimeout(tick, 16);
      else resolve();
    };
    tick();
  });
}
