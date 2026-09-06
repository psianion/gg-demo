#!/usr/bin/env node
// W1-VERIFY gate: montage sapling off-mass ruling (DISPATCH W1-verify, disclosed 14->16).
// VERIFIER script — independent of the builder's own metric. Own definition: a mark point
// counts as OFF-MASS if its screen-space lateral distance from the tree's own vertical
// axis, at that point's own world height, exceeds `MARGIN` x the CONE's own silhouette
// half-width at that height, both measured through the real montage vignette-3 camera
// (cam [25.7,1.8,-36.95] look [24.55,1.0,-39.8], the same one w1-verify-basis.mjs confirmed
// matches c5Xs[3]/c5Shots[3] in timeline.ts). MARGIN = 1.10 (10% over the drawn silhouette —
// generous enough that a mark hugging the mass at its own natural jitter doesn't false-flag,
// tight enough that a mark actually adrift into the sky does).
//
// Real exported pineProfile/pineSilR/arcPts/pineZig build the marks and the reference
// silhouette function identically to the film's own pineCrown — no reimplementation of the
// geometry rule, only of the OFF-MASS JUDGEMENT itself (which the film has no function for).
// Local tree position (0.2, +/-0.5 offsets from xs[3]/Z) is ignored — the check is RELATIVE
// (mark vs its own tree's axis), and a few world units of translation this far from a ~13u
// camera does not materially change the local perspective (ponytail: documented shortcut).
//
// Usage: node --experimental-strip-types scripts/measure/w1-verify-offmass.mjs

import * as THREE from 'three';
import { pineProfile, pineSilR, arcPts, pineZig, setView, shotView, kseed } from '../../src/film/mock/foliageKit.ts';
import { HERO_FOV } from '../../src/film/stages/hero.ts';

// FIRST ATTEMPT (kept as a finding, not silently dropped): a pure RATIO
// (markDxPx / refHalfWidthPx > 1.10) blows up near the tree's tip and near the arc's own
// dip below its tier's cone base (`ry = 0.3r` deliberately swings the arc a little BELOW
// the strict tapered-cone edge that pineSilR models — the arc hugs the skirt, it does not
// trace it), where refHalfWidthPx -> 0 and any small absolute deviation reads as ratio 10x
// or 25x with no visible defect behind it. That is a metric artefact, not a construction
// one, and it is a fair bet it is what produced the builder's own 14->16 too. An ABSOLUTE
// screen-pixel margin does not have that failure mode: hero.ts's own law states a 'form'
// stroke is drawn 2.1 screen px wide at the hero's own framing (search 'screen-space' in
// hero.ts) — a mark within about one stroke-width of the silhouette edge is still ON it.
// MARGIN_PX is set a little above that (this shot's camera distance differs from hero's).
const MARGIN_PX = 3.0;
const W = 1440, H = 900;
const v = shotView([25.7, 1.8, -36.95], [24.55, 1.0, -39.8]);
setView(v.az, v.elev);

const rWide = 0.5, h = 1.4;
const ARC_PUSH_RATIO = 0.3 / 0.44;
const ZIG_PUSH_RATIO = 0.1 / 0.44;
kseed(3003);
const tiers = pineProfile(rWide, h);
const silR = pineSilR(tiers, rWide, h);
const pushArc = rWide * ARC_PUSH_RATIO;
const arcs = tiers.map(([cy, r, ch]) => ({ name: 'arc', pts: arcPts(0, cy - ch / 2, 0, r * 1.01, r * 0.3, 1.1 * Math.PI, 1.9 * Math.PI, pushArc) }));
const zigL = { name: 'zigL', pts: pineZig(rWide, h, 0, 0, tiers, -1) };
const zigR = { name: 'zigR', pts: pineZig(rWide, h, 0, 0, tiers, 1) };
const allStrokes = [...arcs, zigL, zigR];

// camera: same cam/look as the real shot, HERO_FOV 32 (fixed film-wide, per hero.ts law)
const cam = new THREE.PerspectiveCamera(HERO_FOV, W / H, 0.1, 200);
cam.position.set(25.7, 1.8, -36.95);
cam.lookAt(new THREE.Vector3(24.55, 1.0, -39.8));
cam.updateMatrixWorld();
const projPx = (x, y, z) => {
  const v = new THREE.Vector3(x, y, z).project(cam);
  return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H };
};

let offMass = 0, total = 0;
const offDetail = [];
for (const stroke of allStrokes) {
  for (const p of stroke.pts) {
    total++;
    const axisScreen = projPx(0, p.y, 0); // tree's own vertical axis at this mark's height
    const markScreen = projPx(p.x, p.y, p.z);
    const refEdgeWorld = { x: silR(p.y), y: p.y, z: 0 }; // cone's own silhouette half-width at this height
    const refScreen = projPx(refEdgeWorld.x, refEdgeWorld.y, refEdgeWorld.z);
    const refHalfWidthPx = Math.abs(refScreen.x - axisScreen.x);
    const markDxPx = Math.abs(markScreen.x - axisScreen.x);
    const overPx = markDxPx - refHalfWidthPx;
    if (overPx > MARGIN_PX) { offMass++; offDetail.push(`${stroke.name} y=${p.y.toFixed(3)} overPx=${overPx.toFixed(2)} (mark=${markDxPx.toFixed(1)}px ref=${refHalfWidthPx.toFixed(1)}px)`); }
  }
}
console.log(`sapling (montage, buildPine(0.5, 1.4, ...)), MARGIN_PX=${MARGIN_PX} at ${W}x${H}:`);
console.log(`total mark points sampled: ${total}`);
console.log(`off-mass points: ${offMass}`);
if (offDetail.length) console.log(offDetail.join('\n'));
console.log(`\nRULING: ${offMass === 0 ? 'no points exceed the silhouette by more than one stroke-width in screen px — metric artefact, not a real defect' : 'points DO exceed the silhouette by more than a stroke-width — check the t54.5 frame for a visible stray stroke'}`);
