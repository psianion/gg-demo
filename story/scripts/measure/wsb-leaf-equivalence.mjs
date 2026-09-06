// WS-b: prove the lift of mock/sky.ts's buildMock() inline leaf loop into
// skyKit.ts's buildLeafBank() changed nothing geometrically. BEFORE is a verbatim
// reconstruction of buildMock() as it stood prior to the lift (captured by Read before
// the edit: one shared StrokeBag, four foliageKit.buildLeaf() calls in order — the three
// LEAVES then the face-away spare — one bag.build() at the end). AFTER calls the actual,
// edited mock/sky.ts's buildMock(), which now goes through skyKit.buildLeafBank().
//
// Count method copied from scripts/measure/w6d-machinery-equivalence.mjs: LineSegments2
// also reports isMesh = true (it extends three's Mesh), so it must be excluded from the
// vertex sum with `else if`, not summed as a mesh — its own instanceStart count is the
// real per-vertex-pair stroke count.
import * as THREE from 'three';
import * as P from '../../src/film/palette.ts';
import { StrokeBag, buildLeaf, kseed, mixHex, parkSeam } from '../../src/film/mock/foliageKit.ts';
import { buildMock } from '../../src/film/mock/sky.ts';

function sumCounts(root) {
  let verts = 0;
  let segs = 0;
  root.traverse((o) => {
    if (o.isLineSegments2 && o.geometry?.attributes?.instanceStart) segs += o.geometry.attributes.instanceStart.count;
    else if (o.isMesh && o.geometry?.attributes?.position) verts += o.geometry.attributes.position.count;
  });
  return { verts, segs };
}

// ---- BEFORE: verbatim reconstruction of sky.ts's old buildMock() -------------------
const SKY_MID_OLD = mixHex(P.canopyDeep, P.stoneWarm, 0.55);
const SKY_FAR_OLD = mixHex(P.canopyDeep, P.skyDawn, 0.7);
const LEAVES_OLD = [
  { w: 9.6, h: 2.3, x: -0.8, z: 3.2, tint: P.canopyDeep, wash: 0.3, dir: 0.13, rake: 0.14, yaw: 0.05, lobes: 13, notch: 4 },
  { w: 12.8, h: 2.8, x: 0.9, z: 7.6, tint: SKY_MID_OLD, wash: 0.44, dir: 0.18, rake: 0.14, yaw: -0.04, lobes: 11, notch: 7 },
  { w: 16.6, h: 3.4, x: -1.4, z: 12.6, tint: SKY_FAR_OLD, wash: 0.62, dir: 0.23, rake: 0.14, yaw: 0.03, lobes: 14, notch: 3 },
];

function buildMockOld() {
  parkSeam();
  kseed(0x33bc6d1);
  const g = new THREE.Group();
  const bag = new StrokeBag();
  for (const L of LEAVES_OLD) g.add(buildLeaf(L, bag));
  g.add(
    buildLeaf(
      { w: 3.6, h: 2.2, x: 4.0, z: 1.5, tint: SKY_MID_OLD, wash: 0.5, dir: 0.2, rake: 0.3, yaw: Math.PI - 0.42, lobes: 8, notch: 5 },
      bag,
      true,
    ),
  );
  g.add(bag.build());
  return g;
}

const before = sumCounts(buildMockOld());
const after = sumCounts(buildMock());
console.log('BEFORE', JSON.stringify(before));
console.log('AFTER ', JSON.stringify(after));
console.log(before.verts === after.verts && before.segs === after.segs ? 'MATCH' : 'MISMATCH');
