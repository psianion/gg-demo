// MOCK — Standing sheet, painted. Art bible §11.2, row 17. FLORA AND SKY, author 2.
//
//   http://localhost:5180/?mock=sky            beside the actual hero island
//   http://localhost:5180/?mock=sky&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=sky&zoom=1..6
//
// HOW DISTANCE AND HORIZON ARE HANDLED, in one frame. The sky in this film is three
// things and nothing else (C7): the VOID (bare paper — `scene.background` stays null,
// `scene.fog` is deleted), the AIR (the chapter's token, living only in
// `rigs.hemi.color`), and the LEAF — the only sky OBJECT there is. So this mock builds
// S3's exact three-leaf staging, near → far, `canopyDeep` t4 → `rockFace` t3 →
// `skyDay` t1, every flat bottom on ONE baseline. That common baseline IS the horizon:
// the film has no horizon line, it has three sheets standing in slots at one height,
// and the value ladder between them is the distance.
//
// The fourth sheet is a spare, leaned face-away behind the others. It is the only way
// to see what the route's fixed camera otherwise hides — the Λ brace and the slot line
// on the back of every leaf, which §2.2 requires to be built always and to be legible
// the moment the camera moves off-axis. A backdrop flat here is an honest theatre
// sheet, and this is it admitting so.
//
// RECIPE (row 17): ExtrudeGeometry(depth 0.10, no bevel) from an authored Shape, NEVER
// a PlaneGeometry; dead-flat bottom; 8–14 lobes at radii 0.62–1.00 of leaf height with
// control points ±8%; ONE torn notch pulled to 0.34 height; hard vertical sides;
// rotation.x = −0.14 rad of rake; sheet: true, dir 0.18 ± 0.05; POSTER 6; wear 0.10;
// bakeSkySheet 512² tiling @ 6 u = 85 tex/u with a PAPER base; drawn state = tier
// field + the brace and slot line, and no cloud contours — a bank is a mass, and a
// mass in this drawing is density, not line.


// WHERE THE RECIPE LIVES NOW. `bakeSkySheet`, `leafShape` and the leaf builder moved
// into `foliageKit.ts` unchanged, because the film body builds this row too — S3's three
// leaves stand behind the path ribbon island in `sets/ground.ts`. A sky bake that exists
// in the route and a second one that exists in the film is exactly how a proven row drifts
// off its own mockup, so there is one of each and both callers import it.
//
// WS-b: this route now calls `skyKit.ts`'s `buildLeafBank` rather than looping
// `foliageKit.buildLeaf` itself — the kit is the one place that owns "several leaves,
// one merged stroke draw". Proved byte-equivalent to the old inline loop by
// `scripts/measure/wsb-leaf-equivalence.mjs`.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { kseed, mixHex, parkSeam, type LeafSpec } from './foliageKit.ts';
import { buildLeafBank } from './skyKit.ts';

// S3's own staging (§2.5): three leaves, near → far. The near leaf IS the treeline bank —
// the forest seen as a mass at distance is not a merged stand of trees, it is one cut
// sheet at the canopy's token.
//
// THE DISTANCES ARE NOT §2.2's. §2.2 places leaves at depthNear×1.6 / depthFar×0.55 /
// depthFar×0.92, and on this route `depthNear`/`depthFar` are derived from the fit
// distance the route itself solves (MockSheet.tsx:170–172), which re-solves around
// whatever box the leaves make — the ramp position of the far leaf works out at a
// constant ~0.33 whatever spacing is authored. So the leaves are staged at a spacing that
// FRAMES beside the island, and the ramp's own proof is handed off (MOCK-2.md, F1).
//
// THE TINT LADDER IS ONE HUE AT THREE DEPTHS. It was `canopyDeep` (green) → `rockFace`
// (grey-green) → `skyDay` (cold blue), and the judgement read that as "three leaves at
// three unrelated hues … three different projects, not three depths of one", with the far
// leaf a cold neutral grey that exists nowhere else in the film. All three steps are now
// the SAME token walked along a WARM axis:
//   near  canopyDeep                        #466F33 — the treeline itself
//   mid   mix(canopyDeep, stoneWarm, 0.55)  #7C845A — the green going to warm stone
//   far   mix(canopyDeep, skyDawn,   0.70)  #B6A881 — the same green in warm air
// then the 0.30 / 0.44 / 0.62 wash toward paper on top, which is the depth language
// stated as pigment.
export const SKY_MID = mixHex(P.canopyDeep, P.stoneWarm, 0.55);
export const SKY_FAR = mixHex(P.canopyDeep, P.skyDawn, 0.7);

const LEAVES: LeafSpec[] = [
  { w: 9.6, h: 2.3, x: -0.8, z: 3.2, tint: P.canopyDeep, wash: 0.3, dir: 0.13, rake: 0.14, yaw: 0.05, lobes: 13, notch: 4 },
  { w: 12.8, h: 2.8, x: 0.9, z: 7.6, tint: SKY_MID, wash: 0.44, dir: 0.18, rake: 0.14, yaw: -0.04, lobes: 11, notch: 7 },
  { w: 16.6, h: 3.4, x: -1.4, z: 12.6, tint: SKY_FAR, wash: 0.62, dir: 0.23, rake: 0.14, yaw: 0.03, lobes: 14, notch: 3 },
];

// The spare sheet, stacked backstage face-away. S2 is the film's argument for it: "the
// leaves' braces and slot lines stay in frame, unpainted — the sheets are there; they
// have simply not been painted yet." It takes the ladder's own MID step, not
// `skyOvercast` — that token is #AAB6C0, the third cold neutral this file used to carry,
// and a backstage sheet is the same stock as the ones in the slots.
const SPARE: LeafSpec = {
  w: 3.6,
  h: 2.2,
  x: 4.0,
  z: 1.5,
  tint: SKY_MID,
  wash: 0.5,
  dir: 0.2,
  rake: 0.3,
  yaw: Math.PI - 0.42,
  lobes: 8,
  notch: 5,
};

export function buildMock(): THREE.Object3D {
  parkSeam();
  kseed(0x33bc6d1);
  return buildLeafBank([...LEAVES, SPARE], [false, false, false, true]);
}
