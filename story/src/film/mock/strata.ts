// MOCK — Cliff / strata. Art bible §11.2 row 4; world direction §5-S1D.
//
//   http://localhost:5180/?mock=strata
//   http://localhost:5180/?mock=strata&rig=prep&zoom=3
//
// THE FILM'S BOOKEND ASSET — S1, S2 and S7, one build, two eras. It is the hero's own
// skirt section promoted to landform scale.
//
// NOT THREE TIERS — SEVEN CLOSED LATHE BANDS, radii NON-MONOTONIC so the silhouette
// steps in and out. A monotonic taper is a cone; a cliff has ledges. Band 7's radius
// GROWS downward, because a cliff foot spreads into its own talus.
//
// The tier sequence down the face is 2 · 4 · 2 · 3 · 4 · 2 · 3 — no two adjacent bands
// share an underdrawing tier (C5), which is the single rule that stops a drawn cliff
// reading as one flat graphite wall.
//
// ================== THE BUILD ITSELF NOW LIVES IN THE KIT =============================
//
// Every line of the recipe this route used to hold — `bakeStrataBand`, the plan-form
// lobe, the shared crumble, `roughenStrataBand`, the seven bands, the plateau's ground
// card, the rim contour, the six boundary arcs, the sixteen cut marks, the nine measure
// ticks, the crown and the graded talus scree — moved to `groundKit.buildStrataCliff()`
// UNCHANGED, so that `sets/cliffWorld.ts` ships the same object this route proves.
//
// That is the whole point of the move and it closes a real hole: the film's bookend
// asset was judged READY here while the film itself still carried three roughened
// `CylinderGeometry` drums with a hatch field on top. A mock that cannot drift from the
// film is the only kind worth judging.
//
// The fix round that produced these numbers is recorded on the kit's own section:
//  1. `bakeStrataBand` — 512², SIX horizontal tint blocks UV-selected. One bake and ONE
//     MATERIAL for all seven bands where there used to be six. The marks inside a block
//     are BEDDING: near-horizontal partings and dabs at 0.31–0.42 u.
//  2. POSTER 5, off the row's 0. With an albedo under it the quantizer now has
//     something to step; at poster 0 it had nothing to do but pass the ramp through.
//  3. THE BOUNDARIES CRUMBLE and the class has a DROP SHADOW. No two bands meet on a
//     flawless curve any more, band 7 spreads into a real talus apron, and the cliff
//     stops floating on the page.
import * as THREE from 'three';
import { buildStrataCliff } from './groundKit.ts';
import { VIEW_CAM } from './plankKit.ts';

export function buildMock(): THREE.Object3D {
  return buildStrataCliff(VIEW_CAM).root;
}
