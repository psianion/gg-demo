import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildHero,
  compFor,
  heroFraming,
  heroProject,
  parkHeroRig,
  shadowReachX,
  pathZ,
  CASTERS,
  COMP,
  KEY_POS,
  LANTERN_POS,
  SEAM_X,
  SEAM_W,
  GOB_SCALE,
  HERO_AZ,
  HERO_AZ_PORTRAIT,
  HERO_FOV,
  ISLAND_RX,
  ISLAND_RZ,
  RIM_OVERHANG,
} from '../src/film/stages/hero.ts';
import { rig } from '../src/film/stages/trilayer.ts';

// P4: the Half-Alive Island. What must hold: the lens is a FIXED 32° tele with no
// FOV tween anywhere (motion §10); the comp rebalances per breakpoint at constant
// elevation/azimuth; the seam is staged on the shared rig by identity; the staging
// rules FINDINGS assigned to P4 are honoured structurally — warm sources on the
// painted side (P3-T2), registered world casters clear of the seam's shadow-throw
// line (P3-T4) — and the locked copy reaches the DOM verbatim.

const fs = await import('node:fs/promises');
const heroSrc = await fs.readFile(new URL('../src/film/stages/hero.ts', import.meta.url), 'utf8');
const domSrc = await fs.readFile(new URL('../src/Hero.tsx', import.meta.url), 'utf8');
const markSrc = await fs.readFile(new URL('../src/HeroWordmark.tsx', import.meta.url), 'utf8');

// ---- framing: fixed lens, rebalancing comp (hero §3, §7; motion §10) --------------
const breakpoints: [number, number, boolean][] = [
  [390, 844, true],
  [768, 1024, true],
  [1440, 900, false],
  [1920, 1080, false],
];
for (const [w, h, portrait] of breakpoints) {
  const f = heroFraming(w, h);
  assert.equal(f.portrait, portrait, `${w}x${h} portrait detection`);
  assert.ok(Number.isFinite(f.d) && f.d > 4 && f.d < 40, `${w}x${h} solves a sane distance`);
  const dir = f.position.clone().sub(f.look);
  const elev = Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) / (Math.PI / 180);
  assert.ok(Math.abs(elev - 33) < 0.01, `${w}x${h}: elevation 33° (got ${elev.toFixed(2)})`);
  // POSITIVE azimuth — a P4c-ledgered SUPERSESSION of hero §3's −18° (see the
  // decision comment at HERO_AZ in hero.ts and the FINDINGS row flagged for the P5
  // ★ review): the world-x seam's screen tilt is set by azimuth alone, and −18°
  // flips §2's diagonal. This pin holds the decided value; the ledger row holds why.
  // RE-BASELINED 2026-09-03: the portrait azimuth is 18°, not 24°. Gate G6 (the face
  // plane against the him→camera ray, band 40–48°) failed at three of four breakpoints,
  // and the 12.4° spread between the portrait and landscape readings was this constant —
  // the face normal is identical in all four. See the sweep at HERO_AZ_PORTRAIT.
  const az = Math.atan2(dir.x, -dir.z) / (Math.PI / 180);
  const wantAz = (portrait ? HERO_AZ_PORTRAIT : HERO_AZ) / (Math.PI / 180);
  assert.ok(
    Math.abs(az - wantAz) < 0.01,
    `${w}x${h}: azimuth ${wantAz.toFixed(0)}° (got ${az.toFixed(2)})`,
  );
  assert.ok(f.position.z < 0, 'camera on the -z hemisphere: graphite owns screen-left');

  // ---- the COMP, measured (hero §2/§7 — the P4 verify round found no assert here):
  // island share of viewport width and its centre, by projecting the actual rim.
  // compFor is the one authored source: portrait margin-caps the 92vw (direction §6)
  // and drops the centre to 56vh (ledgered supersession of §2's 48vh).
  const { frac, cx, cy } = compFor(w, h);
  let lo = Infinity;
  let hi = -Infinity;
  for (let a = 0; a < 64; a++) {
    const t = (a / 64) * Math.PI * 2;
    const p = heroProject(w, h, new THREE.Vector3(Math.cos(t) * ISLAND_RX, 0, Math.sin(t) * ISLAND_RZ));
    lo = Math.min(lo, p.x);
    hi = Math.max(hi, p.x);
  }
  assert.ok(
    Math.abs(hi - lo - frac) < 0.01,
    `${w}x${h}: island spans ${(100 * (hi - lo)).toFixed(1)}vw, authored ${(100 * frac).toFixed(1)}vw`,
  );
  const c = heroProject(w, h, new THREE.Vector3(0, 0, 0));
  assert.ok(Math.abs(c.x - cx) < 0.01, `${w}x${h}: island centre x ${(100 * c.x).toFixed(1)}vw vs ${100 * cx}vw`);
  assert.ok(Math.abs(c.y - cy) < 0.01, `${w}x${h}: island centre y ${(100 * c.y).toFixed(1)}vh vs ${100 * cy}vh`);
}
// the portrait frac respects the drawn page margin at the phone solve (direction §6):
// at 390 wide a raw 92vw island would sit 15px from the edge, inside the 18px rule.
// P4d: the caps solve for the RENDERED extent (rim × RIM_OVERHANG — feather, strata
// lip and outboard marks), so the RIM frac lands under the authored numbers.
assert.ok(compFor(390, 844).frac * RIM_OVERHANG < 0.92 - 1e-6, 'portrait frac margin-caps at 390');
// P4e: the 92vw portrait comp survives only where the window is tall enough to also
// hold the type, the pine and the bottom margin (the measured pine/below terms) —
// a true 2:3 tablet still renders it; shorter windows shed span instead of colliding
assert.ok(Math.abs(compFor(768, 1152).frac * RIM_OVERHANG - 0.92) < 1e-6, 'tall portrait renders the 92vw');
assert.ok(compFor(768, 1024).frac * RIM_OVERHANG < 0.92 - 1e-6, '…and 768×1024 already sheds span');
// short-portrait windows sink the island centre so the brand block clears the far
// rim (the 768×895 walk measured the meta-line 59% on the island at a fixed centre);
// phone aspects with air to spare stay at the authored 0.56
assert.ok(compFor(768, 895).cy > 0.59, 'short portrait drops the island centre');
assert.ok(compFor(500, 815).cy > 0.62, 'narrow phones clear the pine under the type');
assert.ok(compFor(390, 844).cy < 0.58, '390 stays near the authored 56vh');
// P4e (P4d-T4): the pine-tip clearance term covers ALL portrait widths now — the
// width<560 gate was the hole the painted pine grew through the wordmark at 768.
// 768×1024 therefore sinks off the authored 0.56 until the pine clears the type…
assert.ok(
  compFor(768, 1024).cy > 0.6 && compFor(768, 1024).cy < 0.72,
  '768×1024 sinks the island until the pine clears the wordmark',
);
// …and windows too short to sink any further SHRINK instead of running the keel and
// roots off the page bottom (the flat 0.64 centre cap is gone; the bottom-extent
// rule replaces it): at the walked 768×917 the island gives up rendered span.
assert.ok(
  compFor(768, 917).frac < compFor(768, 1024).frac - 0.01,
  'too-short portraits shrink the island instead of clipping it',
);

// hero §2's third-line staging, measured on the landscape comps: the goblin (at the
// seam's leading edge) projects onto the left third-line, the lantern onto the right.
// The lines are authored at the 58vw comp (1440). Past the 900px island cap the
// world staging CANNOT land both props on the raw third-lines — the island span
// shrinks (~47vw at 1920) while the third-lines stay 33.3vw apart, so the authored
// 1920 quantity is the 1440 comp COMPRESSED about the island centre by the frac
// ratio (P4c, replacing the old 0.06 pass-almost-anything band with a meaningful
// 0.035 tolerance on the real invariant).
const GOB_P = new THREE.Vector3(0.95, 0.3, pathZ(0.95));
const LAN_P = new THREE.Vector3(LANTERN_POS.x, 0.5, LANTERN_POS.z);
{
  const gob = heroProject(1440, 900, GOB_P);
  assert.ok(
    Math.abs(gob.x - 1 / 3) < 0.035,
    `1440x900: goblin on the left third-line (got ${(100 * gob.x).toFixed(1)}vw)`,
  );
  const lan = heroProject(1440, 900, LAN_P);
  assert.ok(
    Math.abs(lan.x - 2 / 3) < 0.035,
    `1440x900: lantern on the right third-line (got ${(100 * lan.x).toFixed(1)}vw)`,
  );
  // P4d: the 1920 comp both compresses about the island centre (frac ratio) AND
  // eases that centre toward the frame's middle (compFor's cap-bite bias) — the
  // expected quantity composes the two authored moves.
  const squeeze = compFor(1920, 1080).frac / compFor(1440, 900).frac;
  const cx14 = compFor(1440, 900).cx;
  const cx19 = compFor(1920, 1080).cx;
  const gob19 = heroProject(1920, 1080, GOB_P);
  assert.ok(
    Math.abs(gob19.x - (cx19 + (1 / 3 - cx14) * squeeze)) < 0.035,
    `1920x1080: goblin holds the compressed left third (got ${(100 * gob19.x).toFixed(1)}vw)`,
  );
  const lan19 = heroProject(1920, 1080, LAN_P);
  assert.ok(
    Math.abs(lan19.x - (cx19 + (2 / 3 - cx14) * squeeze)) < 0.035,
    `1920x1080: lantern holds the compressed right third (got ${(100 * lan19.x).toFixed(1)}vw)`,
  );
}
// …and the diagonal itself: the seam line holds more graphite at the bottom of the
// frame than at the top (graphite lower-left, painted upper-right — hero §2)
{
  const seamTop = heroProject(1440, 900, new THREE.Vector3(SEAM_X, 0, ISLAND_RZ * 0.9));
  const seamBot = heroProject(1440, 900, new THREE.Vector3(SEAM_X, 0, -ISLAND_RZ * 0.9));
  assert.ok(
    seamBot.x > seamTop.x + 0.05,
    `the seam tilts for the §2 diagonal (top ${(100 * seamTop.x).toFixed(1)}vw, bottom ${(100 * seamBot.x).toFixed(1)}vw)`,
  );
}
// desktop px cap (P4d: 1040 — see the COMP.maxPx decision): it bites at 1920, so
// the island's viewport share drops below the authored 58vw and holds exactly maxPx
assert.ok(compFor(1920, 1080).frac < COMP.frac.landscape - 1e-6, 'the px cap bites at 1920');
assert.ok(Math.abs(compFor(1920, 1080).frac * 1920 - COMP.maxPx) < 1e-6, 'and holds the island at maxPx');
// P4e (P4d-T3): SHORT landscape windows pull below the px cap — at the walked
// 1920×917 (a 1080p screen minus browser chrome) the raw 1040 cap ran the trailing
// roots off the bottom row; the height-aware term keeps the keel + roots clear of
// the 36px margin, while 1440×900 keeps the authored 58vw comp bit-identical.
assert.ok(compFor(1920, 917).frac * 1920 < COMP.maxPx - 1, 'short landscape windows shed the px cap');
assert.ok(Math.abs(compFor(1440, 900).frac - COMP.frac.landscape) < 1e-9, '1440×900 keeps the authored comp');
assert.equal(HERO_FOV, 32, 'the tele lens (hero §3)');
// no FOV tween: the DOM side writes the constant once; nothing animates a lens.
// P5 split: the SCENE (hero.ts) and the React shell (Hero.tsx) still own no tweens —
// every tween lives in heroLife.ts, and hero-life.check pins that module lens-free.
assert.ok(!/gsap/.test(heroSrc) && !/gsap/.test(domSrc), 'scene and shell own no tweens');
assert.equal((domSrc.match(/\.fov\s*=/g) ?? []).length, 1, 'one fov write, the constant');
assert.match(domSrc, /cam\.fov = HERO_FOV/, 'and it is the fixed 32');

// ---- art gates, structurally ------------------------------------------------------
assert.ok(!/hatch\(|crossHatch\(/i.test(heroSrc), 'NO HATCHING: the hero authors none');
assert.match(heroSrc, /P\.graphiteLight|P\.graphite/, 'authored marks use graphite tokens');
assert.ok(!/0xf7f5f0|0x222222/.test(heroSrc), 'paper/ink never re-inlined in the hero');

// ---- the staged scene -------------------------------------------------------------
const hero = buildHero();
assert.equal(rig.seamX.value, SEAM_X, 'the seam is staged on the shared rig, by identity');
assert.equal(rig.seamW.value, SEAM_W);
assert.ok(rig.seamWob.value > 0, 'the hero seam is irregular (hero §4), never a ruler cut');

// the goblin: locked design, staged at GOB_SCALE units — a P4e-ledgered SUPERSESSION
// of hero §2's 0.62 (see the decision comment at stageGoblin; flagged for the P5 ★
// review): the subject must read as the subject, and 0.62 measured as a speck.
assert.ok(Math.abs(hero.goblin.root.scale.x - GOB_SCALE / 0.9) < 1e-6, 'staged at the decided scale');
assert.ok(GOB_SCALE <= 0.78, 'the scale supersession stays inside the granted band');
let aliveMeshes = 0;
hero.goblin.root.traverse((o) => {
  const m = o as THREE.Mesh;
  if (m.isMesh && m.userData.alive === true && m.castShadow) aliveMeshes++;
});
assert.ok(aliveMeshes > 10, 'markAlive from frame one — he casts in every state');
assert.ok(hero.pencil.parent, 'the pencil is in his glove');
let pencilAlive = false;
hero.pencil.traverse((o) => {
  if ((o as THREE.Mesh).isMesh && o.userData.alive === true) pencilAlive = true;
});
assert.ok(pencilAlive, 'the pencil is of the alive (hero §8 grammar)');
// GROUNDING (goblin design §8, 2026-09-03 — SUPERSEDES the hide-loop this used to pin).
// The v1 nine-stroke contact() hatch is gone, and with it the "hide every root child but
// the pelvis" loop, which by then was switching off his grounding rather than a stray
// smear. He now carries a feathered trilayer contact pool AND the crossing cast shadow:
// two devices, two jobs. Every root child is visible, and exactly one of them is the
// pool, which is the one part of him that is deliberately not alive.
for (const child of hero.goblin.root.children) {
  assert.equal(child.visible, true, 'nothing on his root is parked any more');
}
const pools = hero.goblin.root.children.filter((c) => c.userData.neverAlive === true);
assert.equal(pools.length, 1, 'exactly one contact pool, and it is a child of root');
assert.equal(
  (pools[0] as THREE.Mesh).material instanceof THREE.MeshLambertMaterial,
  true,
  'the pool is a trilayer, not the islandKit drop-shadow shader (§8: that one vanishes past the seam)',
);

// ---- lighting staging rules (FINDINGS P3-T2 / P3-T4 / P3-T1) ----------------------
// the key restaged to ~35° from the lantern side; the rigs.ts default (50.2°) would
// shorten every shadow and land the light from the wrong quarter
const keyElev = Math.atan2(KEY_POS.y, Math.hypot(KEY_POS.x, KEY_POS.z)) / (Math.PI / 180);
assert.ok(Math.abs(keyElev - 35) < 1.5, `key at ~35° elevation (got ${keyElev.toFixed(1)})`);
assert.ok(KEY_POS.x < 0 && hero.lanternGlow.x < 0, 'warm sources live on the painted side (P3-T2)');
assert.ok(hero.rigs.glow.position.equals(hero.lanternGlow), 'the amber glow parks at the lantern');
// every registered world caster's shadow tip stays short of the seam band: the
// goblin's shadow is the ONLY one that crosses onto the drawing (hero §5, P3-T4)
for (const c of CASTERS) {
  const reach = shadowReachX(c.x, c.height);
  assert.ok(
    reach < SEAM_X - SEAM_W,
    `caster at x=${c.x} throws to ${reach.toFixed(2)}, clear of the seam band ${(SEAM_X - SEAM_W).toFixed(2)}`,
  );
}
// P3-T1 re-judged: the tightened shadow frustum still covers the island's span
assert.ok(hero.rigs.key.shadow.camera.right >= ISLAND_RX, 'shadow frustum covers the island');
assert.ok(hero.rigs.key.shadow.camera.right < 8, 'and is tighter than the kit default');

// the island base: finite, feathered, its page shadow sunk below the strata skirt
assert.ok(hero.island.shadow.position.y < -0.4, 'page shadow sits below the sculpted underside');
assert.equal(hero.island.ground.receiveShadow, true, 'the card catches the one crossing shadow');

// ---- the DOM layer carries the locked copy, verbatim ------------------------------
assert.match(domSrc, /The Dungeon Master&rsquo;s backstage\./, 'tagline verbatim (copy-spec)');
assert.match(
  domSrc,
  /a tale told in one take &middot; about two minutes/,
  'the ~2-minute contract line (hero §6)',
);
assert.match(domSrc, /scroll/, 'the scroll affordance exists');
assert.match(markSrc, /wordmarkPip/, 'the pip is the palette token, not a literal');
assert.ok(!/b6d648/i.test(markSrc.replace(/wordmarkPip/g, '')), 'no re-inlined pip hex');
assert.match(markSrc, /GOOD|hw-word/, 'the drawn wordmark is authored, not a grey box');

// ---- restore the module singletons ------------------------------------------------
parkHeroRig();
assert.equal(rig.seamX.value, 1e6, 'the film gets its parked seam back');
assert.equal(rig.seamWob.value, 0);
assert.equal(rig.depthNear.value, 6);
assert.equal(rig.depthFar.value, 26);

console.log('hero.check: ok');
