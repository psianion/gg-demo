import { clamp } from './ease';

// THE ONE CLOCK. ScrollTrigger writes `target` (raw pinned-track progress in units);
// a single critically damped spring turns it into `u`, which drives the whole stage.
// Exact integration (no overshoot, frame-rate independent), so position AND velocity
// stay continuous whatever the input does.

export const U_MAX = 18;
const OMEGA = 9; // rad/s — settles in ~0.45 s on top of Lenis's own lerp

// scroll ↔ u (review 2). The page is not 1 viewport per unit everywhere: the chips
// beat (u 2–8) plays over 2.5 viewports like every other beat. Everything downstream
// stays a pure function of u; only the pixel density of that stretch changed.
const KEYS: [number, number][] = [[0, 0], [2, 2], [8, 4.5], [U_MAX, 14.5]]; // [u, s]
/** the story's length in viewports of scroll */
export const S_MAX = KEYS[KEYS.length - 1][1];
function remap(x: number, from: 0 | 1): number {
  const to = (1 - from) as 0 | 1;
  for (let i = 1; i < KEYS.length; i++) {
    const a = KEYS[i - 1], b = KEYS[i];
    if (x <= b[from]) return a[to] + ((x - a[from]) / (b[from] - a[from])) * (b[to] - a[to]);
  }
  const l = KEYS[KEYS.length - 1];
  return l[to] + (x - l[from]); // past the end, 1:1
}
/** u for a scroll position in viewports */
export const uOf = (s: number) => remap(s, 1);
/** scroll position in viewports for a u */
export const sOf = (u: number) => remap(u, 0);

export const clock = {
  target: 0,
  u: 0,
  v: 0,
  /** wall-clock seconds, for real-time events (die roll, clicks) */
  t: 0,
  /** bumped by every snap, so crossing detectors re-seed instead of firing */
  jumps: 0,
};

const params = new URLSearchParams(window.location.search);
/** dev-only: ?u=<n> parks the page at that u on load */
export const HOLD_U: number | null =
  import.meta.env.DEV && params.has('u') ? clamp(parseFloat(params.get('u') || '0') || 0, 0, U_MAX + 1.5) : null;
/** dev-only: ?hud=1 readout */
export const SHOW_HUD = import.meta.env.DEV && params.get('hud') === '1';

export function stepClock(dt: number): void {
  const w = OMEGA;
  const x0 = clock.u - clock.target;
  const v0 = clock.v;
  const e = Math.exp(-w * dt);
  const k = v0 + w * x0;
  clock.u = clock.target + (x0 + k * dt) * e;
  clock.v = (v0 - w * k * dt) * e;
  // land exactly — avoids a never-ending tail of sub-pixel frames
  if (Math.abs(clock.u - clock.target) < 1e-5 && Math.abs(clock.v) < 1e-4) {
    clock.u = clock.target;
    clock.v = 0;
  }
}

/** jump without a spring (initial load, ?u=) */
export function snapClock(u: number): void {
  clock.u = clock.target = u;
  clock.v = 0;
  clock.jumps++;
}
