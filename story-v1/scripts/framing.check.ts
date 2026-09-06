import assert from 'node:assert/strict';
import { fitFov, fitPullback } from '../src/film/framing.ts';

const hFov = (aspect: number) =>
  2 * Math.atan(Math.tan((fitFov(aspect) * Math.PI) / 360) * aspect);

// the reference viewport is untouched — the beat sheet frames exactly as authored
assert.equal(Math.round(fitFov(16 / 9)), 42);

// holding the horizontal field is the whole point: same hfov at 16:9 and 4:3
assert.ok(Math.abs(hFov(16 / 9) - hFov(4 / 3)) < 1e-9);

// portrait opens up instead of cropping, and stops at the distortion cap
assert.ok(fitFov(390 / 844) > fitFov(16 / 9));
assert.equal(fitFov(390 / 844), 70);

// ultrawide keeps the authored vertical field rather than shrinking it
assert.equal(Math.round(fitFov(21 / 9)), 42);

// ---- the portrait pull-back ---------------------------------------------------
// The clamp costs a phone half the horizontal field; the pull-back buys it back with
// distance. What has to hold is the WIDTH OF WORLD the shot covers at its subject, not
// the angle — the angle is exactly what the cap refuses to give back.
const covered = (aspect: number) =>
  // one unit of authored subject distance, pulled back and re-measured
  fitPullback(aspect) * Math.tan((fitFov(aspect) * Math.PI) / 360) * aspect;
const authored = Math.tan((42 * Math.PI) / 360) * (16 / 9);

assert.ok(
  covered(390 / 844) >= 0.9 * authored,
  `portrait covers ${(covered(390 / 844) / authored).toFixed(2)}x the authored field`,
);
// and the compensation is inert wherever the fov solve never hit the cap
assert.equal(fitPullback(16 / 9), 1);
assert.equal(fitPullback(4 / 3), 1);
assert.equal(fitPullback(21 / 9), 1);
// it is capped, or it backs the tavern lens out through the room's own walls
assert.ok(fitPullback(390 / 844) <= 2.2);
assert.equal(fitPullback(0.25), 2.2, 'a slot of a viewport stops at the cap');

console.log('framing ok');
