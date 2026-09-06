import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import {
  BLANK_X,
  ENTRANCE,
  HANDOFF,
  RETURNER_PACE,
  SETTLED,
  collectStrokes,
  createHeroLife,
} from '../src/film/stages/heroLife.ts';
import {
  buildHero,
  parkHeroRig,
  stageHeroRig,
  ISLAND_RX,
  SEAM_X,
} from '../src/film/stages/hero.ts';
import { HERO_SHARE, HERO_T, STAGES, gearing, gearingInverse } from '../src/film/gearing.ts';
import { RUNTIME } from '../src/film/motion.ts';
import { rig } from '../src/film/stages/trilayer.ts';

// P5: Hero II — the entrance, the cursor, and the first-scroll handoff. What must
// hold: the lantern ignites BEFORE the paint blooms; the 3.5% carve is the gearing
// map's own t<0 stage (one drive, both clocks); skip lands exactly on the settled
// frame; returners run 0.6×; and the world stays pointer-dead — no cursor:pointer,
// no click handler anywhere but the margin's two controls.

const lifeSrc = readFileSync(new URL('../src/film/stages/heroLife.ts', import.meta.url), 'utf8');
const domSrc = readFileSync(new URL('../src/Hero.tsx', import.meta.url), 'utf8');
const cssSrc = readFileSync(new URL('../src/hero.css', import.meta.url), 'utf8');

// ---- the entrance schedule (hero §8) ----------------------------------------------
assert.ok(
  ENTRANCE.ignite.at < ENTRANCE.bloom.at,
  'the lantern ignites BEFORE paint — light leads, exactly as in the film',
);
assert.ok(ENTRANCE.grid.at <= 0.25 + 1e-9, 'paper + grid ghost inside the first 250ms window');
assert.ok(ENTRANCE.strokes.min >= 1.2 - 1e-9, 'stroke phase never rushes under 1.2s');
assert.ok(ENTRANCE.strokes.max <= 4 + 1e-9, 'and stretches gracefully to at most ~4s');
assert.equal(ENTRANCE.settledBy, 3.2);
// the authored beats actually settle inside the promise, on a warm cache
const typeEnd = Math.max(
  ENTRANCE.type.at + ENTRANCE.type.wordmark - ENTRANCE.type.lead + ENTRANCE.type.tagline,
  ENTRANCE.type.at + ENTRANCE.type.wordmark - 0.1 + Math.max(ENTRANCE.type.meta, ENTRANCE.type.rise),
);
assert.ok(typeEnd <= ENTRANCE.settledBy + 1e-9, `type settles at ${typeEnd}, past 3.2s`);
assert.ok(
  ENTRANCE.bloom.at + ENTRANCE.bloom.dur <= ENTRANCE.type.at + 0.2,
  'the bloom lands before the type does',
);
assert.equal(RETURNER_PACE, 0.6, 'returners run the entrance at 0.6× duration');
assert.equal(ENTRANCE.stallNoteAfter, 3, 'the margin note pencils on after a 3s true stall');

// ---- the 3.5% carve against the gearing map (closes P1-T4's hero half) -----------
assert.equal(STAGES[0].name, 'The Cover');
assert.equal(STAGES[0].share, HERO_SHARE);
assert.equal(HERO_SHARE, 0.035);
assert.ok(Math.abs(HERO_T - RUNTIME * HERO_SHARE) < 1e-12);
assert.equal(gearing(0), -HERO_T, 'scroll 0 is the settled cover');
assert.ok(Math.abs(gearing(HERO_SHARE)) < 1e-9, 'the carve boundary IS film t0');
assert.ok(Math.abs(gearingInverse(0) - HERO_SHARE) < 1e-9);

// ---- the handoff schedule (hero §10) ----------------------------------------------
assert.equal(HANDOFF.headSnap, 0.12, 'the head snap is his fastest move — 120ms at play pace');
assert.ok(Math.abs(HANDOFF.phaseA - 0.55 * HERO_T) < 1e-9, 'Phase A owns 55% of the slice');
assert.ok(HANDOFF.drainAt < HANDOFF.phaseA, 'the drain lives inside Phase A');
assert.ok(HANDOFF.tuck.at + HANDOFF.tuck.dur <= HANDOFF.phaseA, 'the tuck finishes in Phase A');
assert.equal(HANDOFF.emberDies, 0.97, 'the last live pixel dies at 97%');
assert.equal(HANDOFF.recede, 0.06, 'the graphite island recedes 6%');
assert.ok(HANDOFF.phaseA + HANDOFF.lights <= HERO_T + 1e-9, 'the house lights land inside the slice');
// the drain parks the seam past the island's rim — nothing painted can survive it
assert.ok(BLANK_X < -ISLAND_RX, 'BLANK_X clears the island (wobble included)');

// ---- skip-completeness: skip lands exactly on the settled frame -------------------
// Structural: skip() is entrance.progress(1) — every tween/set renders its END state,
// and those end states ARE the settled constants. Pinned three ways: the source
// carries the progress(1) jump; the bloom tween ends at SEAM_X and the drain at
// BLANK_X (the same constants the staging uses); and the staged rig equals SETTLED.
assert.match(lifeSrc, /progress\(1\)/, 'skip jump-cuts via progress(1)');
assert.match(lifeSrc, /value: SEAM_X/, 'the bloom ends at the staged seam');
assert.match(lifeSrc, /value: BLANK_X/, 'the drain ends at the blank page');
assert.equal(SETTLED.seamX, SEAM_X);
stageHeroRig();
assert.equal(rig.seamX.value, SETTLED.seamX, 'settled seam = staged seam, by identity');
assert.equal(
  rig.aliveShadow.value,
  SETTLED.aliveShadow,
  'settled shadow = the committed 0.97 — the value gate P6 actually passes at (goblin design §8, swept live; §8s own 0.62 measured 0.033 against a 0.25 gate)',
);
assert.equal(SETTLED.birth, 1, 'a settled page is fully drawn');
parkHeroRig();
assert.equal(rig.birth.value, 1, 'the film always gets a fully-drawn page back');
assert.equal(rig.touchAmt.value, 0, 'and an untouched one');

// ---- the entrance has a real drawing's worth of strokes to write ------------------
// (hero §8 says "~78"; the built island authors more marks than the doc's estimate —
// the invariant is a band: enough strokes to read as the island drawing itself,
// few enough that the 3-stagger pacing still shows individual lines.)
const hero = buildHero();
const strokes = collectStrokes(hero);
assert.ok(
  strokes.length >= 60 && strokes.length <= 200,
  `entrance writes ${strokes.length} strokes — outside the ~78-band`,
);
for (const s of strokes) assert.ok(s.count > 0, 'every collected stroke has segments to draw');
parkHeroRig();

// ---- pointer-dead invariant (hero §9): the world is not a tool --------------------
// cursor:pointer may exist exactly once — on the returners' skip note, a margin
// control — and never on world surfaces; the cover itself is pointer-events: none.
const cursorHits = [...cssSrc.matchAll(/cursor:\s*pointer/g)].length;
assert.ok(cursorHits <= 1, `hero.css declares cursor:pointer ${cursorHits} times`);
if (cursorHits === 1) {
  const skipRule = cssSrc.slice(cssSrc.indexOf('#hero-skip'));
  assert.match(skipRule, /cursor:\s*pointer/, 'the one pointer cursor is the skip note');
}
assert.ok(!/cursor:\s*pointer/.test(domSrc), 'no inline pointer cursor in the shell');
assert.match(cssSrc, /#hero-cover\s*\{[^}]*pointer-events:\s*none/s, 'the cover is pointer-dead');
const clickHandlers = [...domSrc.matchAll(/onClick/g)].length;
assert.equal(clickHandlers, 1, 'exactly one click handler — the skip note');
assert.match(domSrc, /id="hero-skip"[\s\S]{0,120}onClick=\{skipToTable\}/, 'and it is the skip note');
// the life module owns every tween and never touches the lens
assert.ok(!/\.fov\s*=/.test(lifeSrc), 'heroLife never writes a fov — no lens tween exists');

// ---- P5 verify fix 1 stays fixed: the teardown clock ------------------------------
// The cover tears down on the EASED playhead forwarded from the one preScrub drive,
// never on raw scroll. Hero.tsx is React shell — the wiring itself cannot run under
// plain node, so these stay source asserts, pinned at the invariant (a listener that
// must not exist; the forwarding that must) rather than at any implementation line.
assert.ok(
  !/addEventListener\('scroll'/.test(domSrc),
  'no raw-scroll listener gates the cover teardown',
);
assert.match(domSrc, /preScrub\.fn = /, 'the cover registers on the one scroll drive');
assert.match(domSrc, /onEased/, 'the teardown consumes the forwarded eased playhead');

// ---- behavior: the entrance driven headlessly (P5 reverify) -----------------------
// The world is already built above (the house idiom — puppet.check drives the real
// rig), and gsap runs its own ticker under plain node, so the REAL entrance timeline
// runs here in real time. A minimal DOM shim stands in for the cover chrome (gsap
// tweens plain objects identically); every settled assert reads the SCENE — rig
// uniforms, stroke instanceCounts, goblin/flame visibility — never the shim.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const els = new Map<string, { opacity: number; classList: { add(): void; remove(): void } }>();
const mkEl = (id: string) => {
  let e = els.get(id);
  if (!e) {
    e = { opacity: 0, classList: { add() {}, remove() {} } };
    els.set(id, e);
  }
  return e;
};
let prmOn = false;
let seen = false;
const docShim = {
  getElementById: (id: string) => mkEl(id),
  querySelector: () => null,
  querySelectorAll: () => [] as unknown[],
  fonts: { ready: new Promise(() => {}) as Promise<unknown> },
};
const G = globalThis as Record<string, unknown>;
G.window = {
  matchMedia: () => ({ matches: prmOn, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {},
  removeEventListener() {},
};
G.document = docShim;
G.localStorage = { getItem: (k: string) => (seen && k === 'gg.seen' ? '1' : null), setItem() {} };
G.sessionStorage = { getItem: () => null, setItem() {} };

const flame = (() => {
  let f: THREE.Object3D | undefined;
  hero.root.traverse((o) => {
    if (o.userData.heroPart === 'flame') f = o;
  });
  return f!;
})();
type Life = ReturnType<typeof createHeroLife>;
// (c) the settled state: full stroke instanceCount, birth 1, seam/shadow/glow/goblin
const assertSettled = (life: Life, label: string) => {
  assert.equal(rig.seamX.value, SETTLED.seamX, `${label}: seam parked at the work edge`);
  assert.equal(rig.birth.value, 1, `${label}: the page is fully drawn (birth 1)`);
  assert.equal(rig.aliveShadow.value, SETTLED.aliveShadow, `${label}: his shadow is down`);
  assert.equal(life.state.glow, 1, `${label}: the lantern glow is up`);
  assert.equal(hero.goblin.root.visible, true, `${label}: the goblin landed`);
  assert.equal(flame.visible, true, `${label}: the flame is lit`);
  for (const s of strokes)
    assert.ok(
      s.line.geometry.instanceCount === Infinity || s.line.geometry.instanceCount >= s.count,
      `${label}: a stroke is only part-drawn`,
    );
  assert.ok(life.entranceDone(), `${label}: the entrance reports done`);
  assert.equal(life.entrance.progress(), 1, `${label}: the timeline sits at its end`);
};

// PRM cold load with fonts still PENDING: the crossfade jump must land the full
// settled frame — underdrawing included (the reverify blocker: suppressed events
// skipped the stroke onUpdate and the island settled with no drawing at all).
prmOn = true;
docShim.fonts = { ready: new Promise(() => {}) };
const prmLife = createHeroLife(hero, {});
assertSettled(prmLife, 'PRM cold load');
prmLife.dispose();
prmOn = false;

// (a) skip mid-entrance with the readiness gate ARMED: fonts never resolve, the
// crawl slows the hand, the gate parks AT gateT — then any input must land the
// full settled frame, and nothing may re-park or rewind it afterwards.
docShim.fonts = { ready: new Promise(() => {}) };
const gateT = ENTRANCE.strokes.at + ENTRANCE.strokes.min;
const gateLife = createHeroLife(hero, {});
{
  const t0 = Date.now();
  while (!(gateLife.entrance.paused() && gateLife.entrance.time() >= gateT - 1e-3)) {
    assert.ok(Date.now() - t0 < 6000, 'the readiness gate never armed');
    await sleep(50);
  }
  assert.ok(!gateLife.entranceDone(), 'parked at the gate, not done');
  assert.equal(rig.seamX.value, BLANK_X, 'nothing past the gate has rendered');
  gateLife.skip();
  assertSettled(gateLife, 'skip under an armed gate');
  await sleep(400);
  assertSettled(gateLife, 'still settled 400ms after the skip');
}
gateLife.dispose();

// (b) the stall cap: fonts pending FOREVER and no input — the entrance must
// complete on its own at the cap (ENTRANCE.strokes.max of rest, then the authored
// tail), the margin note must appear during the >3s true stall and clear after.
docShim.fonts = { ready: new Promise(() => {}) };
const capLife = createHeroLife(hero, {});
{
  const t0 = Date.now();
  const note = mkEl('hero-note');
  let noteSeen = false;
  const capMs =
    (ENTRANCE.strokes.at +
      ENTRANCE.strokes.min * 0.85 +
      ENTRANCE.strokes.max +
      (ENTRANCE.settledBy - gateT)) *
    1000;
  while (!capLife.entranceDone()) {
    assert.ok(
      Date.now() - t0 < capMs + 1500,
      `fonts pending forever: the cap must complete the entrance inside ~${capMs}ms`,
    );
    if (note.opacity > 0.5) noteSeen = true;
    await sleep(100);
  }
  assert.ok(noteSeen, 'the "sharpening pencils…" note appeared during the >3s stall');
  assertSettled(capLife, 'stall-cap completion');
  await sleep(400);
  assert.ok(note.opacity < 0.1, 'the note cleared once the drawing finished');
}
capLife.dispose();

// (d) returner pacing + the almost-touch decay, on one life with fonts ready
seen = true;
docShim.fonts = { ready: Promise.resolve() };
const retLife = createHeroLife(hero, {});
assert.ok(
  Math.abs(retLife.entrance.timeScale() - 1 / RETURNER_PACE) < 1e-9,
  'a returner runs the entrance at 0.6× duration (timeScale 1/0.6)',
);
retLife.skip();
assertSettled(retLife, 'skip with fonts ready');
// the almost-touch warms in over 250ms and DECAYS over 400ms — it must ramp down
// through the out-leg, never cut (the P5 verify dual-quickTo bug, behaviorally)
{
  const cam = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 120);
  cam.position.set(0, 5, -9);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld(true);
  const ndcOf = (x: number, z: number) => new THREE.Vector3(x, 0, z).project(cam);
  const on = ndcOf(SEAM_X + 0.8, 0); // over the island's graphite half
  retLife.onPointer(on.x, on.y, cam, false);
  await sleep(400);
  assert.ok(rig.touchAmt.value > 0.85, `almost-touch warms in (${rig.touchAmt.value})`);
  const off = ndcOf(20, 10); // far off the island — the warmth must decay
  retLife.onPointer(off.x, off.y, cam, false);
  await sleep(150);
  const mid = rig.touchAmt.value;
  assert.ok(mid > 0.02 && mid < 0.95, `almost-touch decays through the 400ms out-leg (${mid})`);
  await sleep(500);
  assert.ok(rig.touchAmt.value < 0.03, 'and lands back at zero');
}
retLife.dispose();
seen = false;
parkHeroRig();

console.log('hero-life.check: ok');
process.exit(0); // gsap's node ticker is a live setTimeout loop — release it
