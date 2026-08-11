import assert from 'node:assert/strict';
import { fitFov } from '../src/film/framing.ts';

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

console.log('framing ok');
