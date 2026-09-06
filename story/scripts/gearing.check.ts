import assert from 'node:assert/strict';
import {
  BOUNDARIES,
  HERO_SHARE,
  HERO_T,
  SCROLL_BOUNDARIES,
  STAGES,
  gearing,
  gearingInverse,
  stageAt,
} from '../src/film/gearing.ts';
import { RUNTIME } from '../src/film/motion.ts';

// ---- the stage table is the experience doc's (§2 / §5.2), plus the P5 hero carve --
// (hero doc §10/§14.3: 3.5% of total scroll, carved from Stage 1's 14%; the Cover is
// the t<0 stage of the one map — closes FINDINGS P1-T4's hero half)
assert.equal(STAGES.length, 9);
assert.equal(HERO_SHARE, 0.035);
assert.ok(Math.abs(HERO_T - RUNTIME * HERO_SHARE) < 1e-12, 'HERO_T is the carve at play pace');
assert.deepEqual(BOUNDARIES, [-HERO_T, 0, 10.2, 16.5, 26.5, 36, 50, 57.5, 64.5, RUNTIME]);
const expectedShares = [HERO_SHARE, 0.14 - HERO_SHARE, 0.12, 0.16, 0.12, 0.2, 0.08, 0.12, 0.06];
for (const [i, s] of STAGES.entries()) {
  assert.ok(
    Math.abs(s.share - expectedShares[i]) < 1e-12,
    `stage ${i} share ${s.share}, expected ${expectedShares[i]}`,
  );
}
assert.equal(STAGES[0].name, 'The Cover');
const shareSum = STAGES.reduce((sum, s) => sum + s.share, 0);
assert.ok(Math.abs(shareSum - 1) < 1e-12, `shares sum to ${shareSum}, not 1`);
assert.equal(SCROLL_BOUNDARIES[0], 0);
assert.equal(SCROLL_BOUNDARIES[SCROLL_BOUNDARIES.length - 1], 1);

// ---- stage starts are contiguous (each t1 is the next t0) ------------------------
for (let i = 1; i < STAGES.length; i++) assert.equal(STAGES[i - 1].t1, STAGES[i].t0);

// ---- boundaries land exactly on the beat-sheet t values --------------------------
for (let i = 0; i < BOUNDARIES.length; i++) {
  assert.ok(
    Math.abs(gearing(SCROLL_BOUNDARIES[i]) - BOUNDARIES[i]) < 1e-9,
    `scroll boundary ${i} maps to ${gearing(SCROLL_BOUNDARIES[i])}, expected t${BOUNDARIES[i]}`,
  );
  assert.ok(
    Math.abs(gearingInverse(BOUNDARIES[i]) - SCROLL_BOUNDARIES[i]) < 1e-9,
    `t boundary ${i} inverts to ${gearingInverse(BOUNDARIES[i])}, expected ${SCROLL_BOUNDARIES[i]}`,
  );
}

// ---- endpoints and clamping ------------------------------------------------------
assert.equal(gearing(0), -HERO_T);
assert.ok(Math.abs(gearing(HERO_SHARE)) < 1e-9, 'the carve boundary lands on film t0');
assert.equal(gearing(1), RUNTIME);
assert.equal(gearing(-0.5), -HERO_T);
assert.equal(gearing(1.5), RUNTIME);
assert.ok(Math.abs(gearingInverse(0) - HERO_SHARE) < 1e-9, 'film t0 sits at 3.5% scroll');
assert.equal(gearingInverse(-HERO_T), 0);
assert.equal(gearingInverse(RUNTIME), 1);
assert.equal(gearingInverse(-HERO_T - 3), 0);
assert.equal(gearingInverse(RUNTIME + 3), 1);

// ---- strictly monotonic, and the inverse round-trips to 1e-6 ---------------------
const N = 4000;
let prev = -HERO_T - 1;
for (let i = 0; i <= N; i++) {
  const p = i / N;
  const t = gearing(p);
  assert.ok(t > prev, `gearing not strictly increasing at p=${p}`);
  prev = t;
  assert.ok(Math.abs(gearingInverse(t) - p) < 1e-6, `round-trip drift at p=${p}`);
}
let prevP = -1;
for (let i = 0; i <= N; i++) {
  const t = -HERO_T + (i / N) * (RUNTIME + HERO_T);
  const p = gearingInverse(t);
  assert.ok(p > prevP, `inverse not strictly increasing at t=${t}`);
  prevP = p;
  assert.ok(Math.abs(gearing(p) - t) < 1e-6, `round-trip drift at t=${t}`);
}

// ---- the die beat's runway: stage 5 is 21% of the clock but 20% of the scroll ----
// (the experience doc's whole reason for gearing — keep the shape, not just the map)
const proofOfTime = STAGES[5];
assert.equal(proofOfTime.name, 'Proof of Time');
assert.ok(proofOfTime.share / ((proofOfTime.t1 - proofOfTime.t0) / RUNTIME) < 1);
const manyJobs = STAGES[6];
assert.equal(manyJobs.name, 'The Many Jobs');
assert.ok(manyJobs.share / ((manyJobs.t1 - manyJobs.t0) / RUNTIME) < 1, 'montage geared tight');

// ---- stageAt picks the right stage everywhere ------------------------------------
assert.equal(stageAt(-1).name, 'The Cover');
assert.equal(stageAt(0).name, 'The Claim');
assert.equal(stageAt(10.2).name, 'The Address');
assert.equal(stageAt(44.6).name, 'Proof of Time');
assert.equal(stageAt(RUNTIME).name, 'The Table');

console.log('gearing ok');
