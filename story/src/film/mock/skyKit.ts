// WS-b — row 17 (the standing sheet) as a kit. The recipe itself — leafShape,
// bakeSkySheet, SKY_TILE_U, the actual `buildLeaf(LeafSpec, bag, faceAway)` mesh +
// brace/slot-line builder — already lives in `foliageKit.ts` (both the film body and
// this route import it from there; see that file's ROW 17 section). This module does
// not duplicate that recipe. It wraps it: a convenience one-leaf `buildLeaf(opts)` for
// callers that only care about tint/wash/lobes, a `buildLeafBank(leaves)` for placing
// several (what `mock/sky.ts` needs), and `retintLeaf` for the per-chapter recolour the
// film will need later.
import * as THREE from 'three';
import {
  StrokeBag,
  buildLeaf as buildLeafMesh,
  kseed,
  type LeafSpec,
} from './foliageKit.ts';

export interface BuildLeafOpts {
  tint: number;
  wash: number;
  lobes?: number;
  seed?: number;
  scale?: number;
}

// Defaults match the mid leaf of `mock/sky.ts`'s own three-leaf staging, scaled by
// `opts.scale`. A caller that needs its own size/position/yaw/rake uses `buildLeafBank`
// with a full `LeafSpec` instead.
const DEF_W = 12.8;
const DEF_H = 2.8;
const DEF_NOTCH = 6;
const DEF_DIR = 0.18;

/** One leaf: the sheet mesh + its back-facing brace/slot line, as a Group. */
export function buildLeaf(opts: BuildLeafOpts): THREE.Group {
  if (opts.seed !== undefined) kseed(opts.seed);
  const scale = opts.scale ?? 1;
  const spec: LeafSpec = {
    w: DEF_W * scale,
    h: DEF_H * scale,
    x: 0,
    z: 0,
    tint: opts.tint,
    wash: opts.wash,
    dir: DEF_DIR,
    rake: 0.14,
    yaw: 0,
    lobes: opts.lobes ?? 11,
    notch: DEF_NOTCH,
  };
  const bag = new StrokeBag();
  const mesh = buildLeafMesh(spec, bag);
  const group = new THREE.Group();
  group.add(mesh, bag.build());
  group.userData.sheetMesh = mesh;
  return group;
}

/**
 * Several leaves sharing one merged stroke draw, exactly as row 17's banks stand
 * together. `faceAway[i]` (default false) is `foliageKit.buildLeaf`'s own `faceAway` —
 * the backstage-flat leaning used to show the brace off-axis.
 */
export function buildLeafBank(leaves: LeafSpec[], faceAway: boolean[] = []): THREE.Group {
  const bag = new StrokeBag();
  const group = new THREE.Group();
  const meshes: THREE.Mesh[] = [];
  leaves.forEach((L, i) => {
    const mesh = buildLeafMesh(L, bag, faceAway[i] ?? false);
    meshes.push(mesh);
    group.add(mesh);
  });
  group.add(bag.build());
  group.userData.sheetMeshes = meshes;
  return group;
}

/**
 * Retint every sheet mesh under `group` (works on a single `buildLeaf` group or a whole
 * `buildLeafBank`). Returns how many materials it touched.
 *
 * CONTRACT — wash is BAKED, not a material property. `buildLeaf`'s material.color is
 * `mixHex(tint, paper, wash)` (foliageKit.ts, `buildLeaf`), computed once at construction
 * and stored as the plain RGB of `material.color`. There is no separate "wash" uniform to
 * adjust afterward. So `retintLeaf(group, hex)` CAN change which pigment a leaf shows
 * (swap chapter tokens) by setting `material.color` directly, but it CANNOT independently
 * change the tint while preserving the leaf's original depth-wash fraction — the caller
 * must pre-compute `hex = mixHex(newTint, P.paper, originalWash)` itself (the same way
 * `buildLeaf`/`buildLeafBank` did) and pass that in, or the wash ladder that encodes depth
 * is lost and the leaf's tone jumps to whatever `hex` alone specifies.
 */
export function retintLeaf(group: THREE.Object3D, hex: number): number {
  let n = 0;
  group.traverse((obj) => {
    // LineSegments2 also reports isMesh = true (it extends three's Mesh) — exclude it so
    // the brace/slot line (graphite, `flat`/`flatLight` register) never gets recoloured
    // as if it were the sheet's paint.
    const o = obj as THREE.Mesh & { isLineSegments2?: boolean };
    if (o.isMesh && !o.isLineSegments2 && o.material) {
      const mat = o.material as THREE.MeshLambertMaterial;
      if (mat.color) {
        mat.color.setHex(hex);
        n++;
      }
    }
  });
  return n;
}
