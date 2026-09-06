// MOCK — Water. Art bible §11.2, row 14, and R1 / R2.
//
//   ?mock=water · &rig=prep · &zoom=1..6
//
// THE ROW, built: a flat band following the river's own tangent. `sheet: true`,
// `dir 0.10`, poster 0, no bake. Drawn state is BARE PAPER BY CONSTRUCTION plus one
// 'form' edge in `graphiteDark`; the body comes from tangent-aligned lit dabs in
// `paper` @ 0.7α. No transparency in the water itself, no reflection, no specular,
// ever. MOTION: NONE — R2 declined the edge-breath, and stillness is correct for a
// maquette you lean over.
//
// R1 IS THE WHOLE ROW, AND IT IS ARITHMETIC, NOT TASTE. Raw `water #679FB4` computes
// to `triTone 0.462` = TIER 3 — a dense two-pass graphite field, which is the opposite
// of what a pencil does with water, and the reason v1's water hatch was always going
// to be wrong however it was drawn. `BOARD_WATER = mix(water, paper, 0.78)` = #D7E2E3
// computes to `triTone 0.1061`, under the shader's own 0.14 mark threshold, so it lands
// TIER 0 and the drawn river is bare paper with an edge. Raw `water` is BANNED as a
// fill anywhere in the film.
//
// THE BUILD MOVED TO THE KIT. `groundKit.buildRiver(curve)` is this file's own
// `buildMock()` with the spine taken as an argument, so S7's river in
// `sets/cliffWorld.ts` and this route are one build. Four draws: band · banks · dabs ·
// two shore edges, plus C1's cut section at each end.
import * as THREE from 'three';
import { buildRiver } from './groundKit.ts';
import { hand, parkSeam } from './plankKit.ts';

// The river's own line — ONE lazy S, not a meander. THE FIRST BUILD'S BUG, and it is
// worth recording because it is a fact about offset ribbons and not about this river:
// a ribbon offset by `d` from a curve FOLDS wherever the curve's radius of curvature
// is smaller than `d`, and the fold renders as a bow-tie fan. The first spine wove
// ±0.4 u over 1.1 u of run (radius ≈ 0.4) while the banks sat at d up to 1.35 — so
// both banks came back as three brown triangles and the water vanished inside its own
// inverted surface. The rule this file now obeys: MIN CURVATURE RADIUS > MAX OFFSET.
// Here the S turns over ~2.2 u of run for ±0.5 u of swing (radius ≈ 2.4) against a
// maximum offset of 0.81, which is a factor of three of headroom.
const CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.5, 0, -2.3),
  new THREE.Vector3(-0.22, 0, -1.1),
  new THREE.Vector3(0.16, 0, 0.1),
  new THREE.Vector3(0.44, 0, 1.3),
  new THREE.Vector3(0.3, 0, 2.4),
]);

export function buildMock(): THREE.Object3D {
  return parkSeam(buildRiver(CURVE, { width: 0.86, bank: 0.38, rnd: hand(0x1f7a) }));
}
