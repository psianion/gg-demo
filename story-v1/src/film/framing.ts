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

export function fitFov(aspect: number): number {
  const v = deg(2 * Math.atan(Math.tan(REF_H_FOV / 2) / aspect));
  return Math.min(Math.max(v, REF_FOV), MAX_FOV);
}

// Once the solve clamps at MAX_FOV the lens cannot open any further, and a phone was
// left with roughly half the horizontal field every shot was composed around — at
// 390x844 the frame is about 36 degrees wide against the authored 69. The lens can't
// open, so it steps back instead: at the clamped fov the frame grows by tan(h/2) per
// unit of depth, so multiplying the camera's distance from its look target by
// tan(REF_H_FOV/2) / tan(h/2) covers exactly the authored width of world at the subject.
// Perspective flattens a little; the composition survives, which is the trade.
//
// Capped, because a pull-back only works while there is still set behind the lens to
// pull back into. C4 is the binding shot: the tavern is the one interior, and its box
// (world.ts buildTavern) is sized so that at 2.2 the lens still sees floor at the bottom
// of frame and wall at the top rather than the ground and sky outside the room. Phone
// aspects need about 2.1, so the cap only ever bites on something narrower than a phone.
// Exactly 1 at any aspect where the fov clamp never engages, so desktop is untouched by
// construction.
const MAX_PULLBACK = 2.2;

export function fitPullback(aspect: number): number {
  const h = 2 * Math.atan(Math.tan(rad(fitFov(aspect)) / 2) * aspect);
  const restore = Math.tan(REF_H_FOV / 2) / Math.tan(h / 2);
  return Math.min(Math.max(restore, 1), MAX_PULLBACK);
}
