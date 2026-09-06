// MOCK — Foliage. Art bible §11.2, row 5. FLORA AND SKY, author 2.
//
//   http://localhost:5180/?mock=foliage            beside the actual hero island
//   http://localhost:5180/?mock=foliage&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=foliage&zoom=1..6
//
// WHAT THIS IS: a stand, not a specimen. Row 5 is "every crown in the film" and the
// film's foliage is never one tree — it is S3's 40+, S4's forest, S7's twelve. So the
// mock is a copse: three oaks, three pines and a sapling on a verge of undergrowth and
// grass, merged to four BufferGeometries and drawn by one hand. It answers the two
// questions the route exists for at once — does a lobe read at arm's length, and does
// the stand read as a MASS at 500 px instead of turning to noise.
//
// RECIPE (row 5): oak = 5 overlapping lobes + 5 contour arcs; pine = 3 stacked tiers +
// a silR()-derived zigzag; stands merge to one BufferGeometry per class per island;
// sheet: true, dir 0.50 + (seed%5)·0.06; poster 12; bakeFoliage 512²; canopy t3 /
// canopyDeep t4 / needle t4 / undergrowth t3; drawn state = 5 contour arcs at 1.10×
// radius + 4 interior leaf arcs; NO WEAR — trees are tended, not handled.
//
// Where the recipe had to move, and why, is in docs/build/walks/world/MOCK-2.md.


// WHERE THE RECIPE LIVES NOW. The oak's five lobes and its arcs, the pine's three bough
// tiers and its zigzag, the verge's shrubs and tufts and the three materials all moved
// into `foliageKit.ts` unchanged, because the film body builds this row too — S3's stand
// is `sets/ground.ts`'s path ribbon island. A crown recipe that exists in the route and a
// second one that exists in the film is how a proven row drifts off its own mockup.
import * as THREE from 'three';
import { roughen } from '../pencil.ts';
import { propGround } from './groundKit.ts';
import * as P from './../palette.ts';
import {
  StrokeBag,
  arcPts,
  crownMaterial,
  kseed,
  merged,
  newStand,
  oakStand,
  parkSeam,
  pineStand,
  placed,
  setView,
  shrubClumps,
  trunkGeom,
  trunkMaterial,
  trunkSideRuns,
  tuftBlades,
  uvBand,
  vergeMaterial,
  type TreeSpec,
} from './foliageKit.ts';

// Set scale, not cover scale. The hero's oak stands 1.45 u because it is a diorama tree
// on a 5.2-u island; in the film body a tree stands beside a 1.24-u human (R16), so the
// film's oak is 2.4–2.9 u. That is the size the bake's texel arithmetic in foliageKit is
// done against, and the size this mock builds.
//
// Two rows, so the stand has a front and a back and reads as a mass rather than a line of
// props. The near oak is the specimen; everything behind it is the forest.
const OAKS: TreeSpec[] = [
  { x: -0.55, z: -0.85, h: 2.88, r: 1.0, seed: 3 },
  { x: 1.75, z: 0.75, h: 2.32, r: 0.86, seed: 11 },
  { x: -1.95, z: 1.15, h: 1.98, r: 0.78, seed: 6 },
];
const PINES: TreeSpec[] = [
  { x: 0.85, z: -1.55, h: 2.74, r: 0.92, seed: 2 },
  { x: -1.55, z: -0.15, h: 2.24, r: 0.8, seed: 9 },
  { x: 2.15, z: -0.95, h: 1.86, r: 0.7, seed: 14 },
];
const SHRUBS: [number, number, number][] = [
  [-0.15, -1.95, 0.26],
  [1.25, -1.85, 0.21],
  [2.6, 0.15, 0.24],
  [1.9, 1.7, 0.2],
  [-0.9, 1.85, 0.26],
  [-2.5, 0.35, 0.22],
  [-2.3, -1.3, 0.19],
  [0.4, 1.35, 0.17],
];

export function buildMock(): THREE.Object3D {
  parkSeam();
  setView(); // this route's shot IS the hero's lens — the kit's default basis
  kseed(0x9f2a41b);
  const g = new THREE.Group();
  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class builds the ordinary ground card
  // under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  g.add(propGround(3.4, 2.6, [[-0.55,-0.85,174,0.26],[1.75,0.75,144,0.26],[-1.95,1.15,132,0.26],[0.85,-1.55,150,0.26],[-1.55,-0.15,132,0.26],[2.15,-0.95,114,0.26],[2.55,1.55,60,0.24],[-0.15,-1.95,48,0.22],[1.25,-1.85,42,0.22],[2.6,0.15,45,0.22],[-0.9,1.85,48,0.22]]));
  const bag = new StrokeBag();
  const stand = newStand();

  for (const t of OAKS) oakStand(t, bag, stand);
  for (const t of PINES) pineStand(t, bag, stand);

  // ---- the sapling: the same class at a fifth of the size --------------------------
  // Row 5 covers S6's saplings too, and a class that only works at one scale is not a
  // class. Two lobes and one arc is what an oak has left at 1.1 u. It stays inline: it is
  // this route's scale probe, not a stand the film ever builds.
  {
    const x = 2.55;
    const z = 1.55;
    const h = 1.06;
    stand.trunks.push(trunkGeom(0.026, 0.04, 0.5, x, 0, z));
    const sap: [number, number, number][] = [
      [0, 0.0, 1.0],
      [-0.5, -0.28, 0.68],
      [0.42, 0.2, 0.6],
    ];
    for (const [i, [lx, ly, lr]] of sap.entries()) {
      const r = 0.27 * lr;
      const geom = roughen(new THREE.SphereGeometry(r, 10, 8), r * 0.1, 9, 40 + i);
      stand.oak.push(placed(uvBand(geom, 0.5, 1), x + lx * 0.27, h - 0.27 + ly * 0.27, z));
    }
    bag.add(arcPts(x, h - 0.27, z, 0.29, 0.28, 1.15 * Math.PI, 1.9 * Math.PI, 0.14, 7), 'form', 'paint');
    bag.add(arcPts(x, h - 0.27, z, 0.15, 0.12, 0.4 * Math.PI, 1.3 * Math.PI, 0.18, 6), 'form', 'prep');
    for (const run of trunkSideRuns(x, z, 0.046, 0.03, 0.02, 0.5)) bag.add(run, 'form', 'paint');
  }

  // ---- the verge -------------------------------------------------------------------
  // Grass gathers AT the shrub and at the trees' feet, never scattered across open paper —
  // a lone tuft on bare page is a stray mark.
  const tufts = shrubClumps(SHRUBS, bag, stand);
  for (const t of [...OAKS, ...PINES]) tufts.push([t.x + 0.16, t.z + 0.2], [t.x - 0.2, t.z - 0.12]);
  for (const [i, [tx, tz]] of tufts.entries()) stand.verge.push(...tuftBlades(tx, tz, i));

  // ---- materials: three, one map ---------------------------------------------------
  // dir: the crowns' family is 0.50 + (seed%5)·0.06. A MERGED stand is one mesh and
  // therefore one direction; the family's spread is spent BETWEEN the merges (oak 0.50,
  // pine 0.62), which is inside C4's ±0.2 rad neighbour rule and is the honest reading of
  // "one direction per organic form" once the form is a whole stand.
  // RULING C (W1a fix round): `crownMaterial` now bakes at `CROWN_POSTER` (foliageKit.ts),
  // the same constant `sets/kit.ts`'s `crownMat` uses, so the route renders what the film
  // renders — no compile-time patch needed to reconcile a route poster against a film one.
  const oakMat = crownMaterial(0.5, P.canopy, 512);
  const pineMat = crownMaterial(0.62, P.needle, 512);
  const oakMesh = new THREE.Mesh(merged(stand.oak), oakMat);
  const pineMesh = new THREE.Mesh(merged(stand.pine), pineMat);
  const trunkMesh = new THREE.Mesh(merged(stand.trunks), trunkMaterial());
  const vergeMesh = new THREE.Mesh(merged(stand.verge), vergeMaterial());

  for (const m of [oakMesh, pineMesh, trunkMesh, vergeMesh]) {
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  g.add(bag.build());
  return g;
}
