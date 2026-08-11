// The beat sheet's camera positions were composed on a wide desktop viewport, and
// THREE's `fov` is vertical: a narrower viewport keeps the vertical field and silently
// crops the horizontal one. On a phone that costs most of what each shot was framed
// around. Hold the horizontal field constant instead, and cap how wide the lens may
// open so portrait doesn't bow the pencil line-work at the edges.

const REF_FOV = 42; // vertical fov the beat sheet was framed at
const REF_ASPECT = 16 / 9;
const MAX_FOV = 70; // wider than this and the edge line-work visibly distorts

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

// the horizontal field every shot assumes
const REF_H_FOV = 2 * Math.atan(Math.tan(rad(REF_FOV) / 2) * REF_ASPECT);

// ponytail: fov-only compensation — portrait still reads tighter than desktop once it
// hits the cap. Recomposing per-shot camera offsets for portrait belongs in the art
// pass, where the framing is judged against real art rather than primitives.
export function fitFov(aspect: number): number {
  const v = deg(2 * Math.atan(Math.tan(REF_H_FOV / 2) / aspect));
  return Math.min(Math.max(v, REF_FOV), MAX_FOV);
}
