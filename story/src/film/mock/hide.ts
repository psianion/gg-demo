// MOCK — Creature hide. Art bible §11.2, row 22. Author group D.
//
//   http://localhost:5180/?mock=hide            beside the actual hero island
//   http://localhost:5180/?mock=hide&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=hide&zoom=1..6
//
// TWO CREATURES, ONE ROW: the S6 monster and the S3 ravens ×3. Until now the class
// shipped as nothing, which meant two of the film's beats had no cast at all.
//
// THE ROW IS EXPLICIT THAT THE GEOMETRY IS KEPT: `world.ts:479–546` "is already right;
// only the surface changes". So the monster's thirteen-point bulk profile, its
// non-uniform (1.15, 1.0, 0.62) scale, its seven shag clumps and the ravens' fused body
// / wedge beak / bladed tail / plate wings arrive here VERBATIM. What changes is that
// they now stand on the trilayer instead of on `sketch()` + `fillMaterial`, so they
// drain with the curtain like every other surface in this world.
//
// THE SHAG IS THE POINT, and it is why this row matters beyond its own two creatures.
// Each clump is 3–6 individual three-point ticks at a PER-TICK angle — authored as
// not-hatch, at a time when the rest of the film was hatching — and it has since become
// the film's general word for any broken or fringed edge: the spall, the landing dust,
// the fire's Prep fringe all speak it (`marksKit.tick`). This is where it came from.
//
// tiers: `monsterLit` t3 · `monsterHide` t4 · `monsterShade` t4 · claws `caveDark` ·
// tusks `gobTooth` · eyes `flameCore` · ravens `ravenSlate` t4. The monster's t4/t4
// adjacency is legal ONLY because the shag geometry separates the two darks — and the
// ravens take poster 0, because an ink-dark tier has nothing to quantize.
//
// P0k-B (2026-09-06): the ravens used to carry their OWN inline geometry AND a stale
// surface — body dir 0.76 (never on the ladder, see `sets/kit.ts`'s `buildRaven()` doc)
// and a beak in `caveDark` (the wrong token; the beak is `iron`, the film's committed
// recipe). Both the geometry and the surface now come off the shared builder: geometry
// from `hideKit.ravenGeometry()`, materials built here with the SAME tokens and dir
// `sets/kit.ts`'s `buildRaven()` uses (`ravenSlate` dir 0.55 body, `iron` dir 0.55 beak),
// at this route's own unscaled wear (0.26), matching the monster's tiers above.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { at, mark, mergeAt, mergeStrokes, VIEW_CAM } from './marksKit.ts';
import { parkSeam } from './plankKit.ts';
import { buildMonster, ravenGeometry } from './hideKit.ts';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';

type Part = { geom: THREE.BufferGeometry; m: THREE.Matrix4 };

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();
  const ravenParts: Part[] = [];
  const beakParts: Part[] = [];
  const marks: LineSegments2[] = [];

  // ---- THE MONSTER, S6 -------------------------------------------------------------
  // Lifted verbatim into `mock/hideKit.ts`'s `buildMonster()` (W8c) so `sets/montage.ts`
  // can build the same creature. Basis: whatever `marksKit`'s VIEW_R/VIEW_CAM hold right
  // now (the hero's lens by default here) — see `hideKit.ts`'s own doc comment.
  g.add(buildMonster());

  // ---- THE RAVENS, S3 ×3 -----------------------------------------------------------
  // "never touched and never painted" — one fused body, a wedge beak, a bladed tail and
  // two plate wings, at ravenSlate t4 and poster 0. Geometry lifted verbatim into
  // `hideKit.ravenGeometry()` (P0k-B); this route places three copies of it and wraps
  // them in `sets/kit.ts`'s COMMITTED surface (that file's own `buildRaven()` doc), not
  // the stale dir/token this route used to carry on its own inline copy.
  const { body: birdBody, beak: beakGeom } = ravenGeometry();

  const PERCH: [number, number, number, number][] = [
    [1.62, 0.62, 0.55, 0.35],
    [2.12, 0.36, -0.3, -1.05],
    [1.34, 0.2, -1.05, 2.2],
  ];
  for (const [x, y, z, yaw] of PERCH) {
    const b = at([x, y, z], [0, yaw, 0]);
    // mergeAt clones before it transforms, so the shared body and beak geometry are each
    // polygonised ONCE (inside ravenGeometry()) and reused by all three birds
    ravenParts.push({ geom: birdBody, m: b.clone() });
    beakParts.push({ geom: beakGeom, m: b.clone() });
    // one perch mark under each bird — three birds on nothing read as three flies
    marks.push(
      mark(
        [
          new THREE.Vector3(x - 0.16, y - 0.075, z).addScaledVector(VIEW_CAM, 0.08),
          new THREE.Vector3(x + 0.17, y - 0.07, z + 0.02).addScaledVector(VIEW_CAM, 0.08),
        ],
        P.graphiteDark,
        'form',
      ),
    );
  }

  // ---- merge: one geometry and one material per token -------------------------------
  // dir 0.55 — the one-mass family, the same ladder rung as rock and skin (R6). The
  // committed recipe: body `ravenSlate`, beak `iron`, both dir 0.55, poster 0 (an
  // ink-dark tier does not tier). (The monster's own hide/lit/shade/claw/bone tiers are
  // merged inside `buildMonster()` now — this bucket is the ravens' beak + body only.)
  const bucket: [Part[], number, number, number][] = [
    [beakParts, P.iron, 0, 0.55],
    [ravenParts, P.ravenSlate, 0, 0.55],
  ];
  for (const [parts, color, poster, dir] of bucket) {
    if (!parts.length) continue;
    const mesh = new THREE.Mesh(
      mergeAt(parts),
      createTrilayer({ color, wear: 0.26, poster, stroke: { dir, sheet: true } }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  // one perch-mark LineMaterial for the ravens (the shag ticks + contour are merged
  // inside `buildMonster()`).
  const byMat = new Map<LineSegments2['material'], LineSegments2[]>();
  for (const m of marks) (byMat.get(m.material) ?? byMat.set(m.material, []).get(m.material)!).push(m);
  for (const list of byMat.values()) g.add(mergeStrokes(list));
  return parkSeam(g);
}

// ponytail: no modelled jaw, no teeth beyond the two tusks, no per-feather work on the
// ravens. At S6 the monster's head is under 40 screen px and an S3 raven is 30; every
// one of those is a mark the lens cannot resolve, and the shag already does the job any
// of them would have been asked to do.
