// Pure easing + range helpers. Everything scroll-driven is built from these, so every
// value is a function of u alone.

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0→1 progress of u through [a, b] */
export const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a));
/** C1 ease in-out */
export const smooth = (t: number) => t * t * (3 - 2 * t);
/** C2 ease in-out — the camera's ease: zero velocity AND acceleration at both ends */
export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** ease in-out with a small anticipation and settle (overshoot ≈ 2%) — goblin moves */
export function settle(t: number): number {
  const c = 0.35;
  const c2 = c * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}
/** a 0→1→0 bump across [a, b], smooth at both ends */
export const bump = (u: number, a: number, b: number) => Math.sin(Math.PI * seg(u, a, b)) ** 2;
/** on across [a,a+f], off across [b-f,b] */
export const window01 = (u: number, a: number, b: number, f = 0.12) =>
  smooth(seg(u, a, a + f)) * (1 - smooth(seg(u, b - f, b)));

export function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
