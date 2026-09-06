// MOCK — Rock (mass). Art bible §11.2 row 3, and §5-S1B of the world direction.
//
//   http://localhost:5180/?mock=rock
//   http://localhost:5180/?mock=rock&rig=prep
//
// Four things are on screen, and each is a clause of the row:
//
//  1. THE S1 HERO ROCK — the one he peeks around.
//  2. THREE OUTCROP CHUNKS. MERGED into one BufferGeometry: one draw. The trilayer
//     computes its world position from modelMatrix and never reads instanceMatrix, so an
//     InstancedMesh would sample strokes, grid and seam from one shared world point.
//     Instancing is banned; merging is the answer.
//  3. FOUR TALUS CHUNKS, merged the same way, at the foot.
//  4. A BOULDER STRADDLING THE CUT EDGE, carrying two short strata marks that continue
//     the island's own band boundaries across it. That is what "the edge is a section
//     through the layers" means at prop scale, and it costs two strokes.
//
// It stands on its own ground card because clause 4 is only true if there is a cut edge
// to cross, and because a rock judged on bare paper is a rock judged alone.
//
// ================== FIX ROUND — REBUILD, ITEMS 7 AND 8 ==============================
//
// The judgement: "a rockery of hexagonal paving slabs… the drawn state is the failure:
// a polygon wireframe diagram, ~150 inked dodecahedral edges on a five-lobe mass. Reads
// better small than large, which is the diagnosis." And: "cut the triangle cost —
// +18,724, second-highest in the set, for a class that reads worse the more of it you
// see." Three changes, and the second one answers both complaints at once:
//
//  1. MORE, SMALLER LOBES AT LOWER RADIUS — and, once `inkEdges` was gone, a SUBDIVIDED
//     primitive under each of them (see `rockGeometry`, where the old dodecahedron
//     finding is recorded and overturned). The hero mass goes from five lobes at
//     r 0.62–1.16 to NINE at r 0.34–0.78, and the paving-slab read is gone because there
//     are no longer any slabs: each lobe is a welded 320-face icosphere carrying two
//     octaves of displacement.
//  2. `inkEdges` IS GONE FROM THIS FILE. Every rock is drawn by `silhouetteRuns` — the
//     mass's actual outline from this lens — which returns 8–14 chained runs where the
//     threshold pass returned ~150 segments of interior cage. That is the drawn state
//     the row always meant, and because the stroke pipeline's triangles ARE this class's
//     triangle cost (a LineSegments2 segment is an instanced solid), it is also the
//     whole of item 8.
//  3. EVERY ROCK TAKES THE BAKE, not just the hero one — see `rockMaterial` in
//     groundKit. A flat token under Lambert is a flat plane at any size.
import * as THREE from 'three';
import * as P from '../palette.ts';
import {
  ROCK_LIT,
  buildGroundCard,
  mergeRocks,
  rockGeometry,
  rockMaterial,
  silhouette,
  strokeSet,
} from './groundKit.ts';
import { VIEW_CAM } from './plankKit.ts';

const RX = 3.0;
const RZ = 2.1;

export function buildMock(): THREE.Object3D {
  const g = buildGroundCard(RX, RZ, { gap: [300, 82] });
  const root = g.root;

  // 1 · THE HERO ROCK — nine overlapping lobes, merged: one geometry, one draw.
  //
  // A 1.8-unit mass is not a finer 0.05-unit pebble, it is MORE pebbles: overlapping
  // masses give an irregular silhouette from one primitive, and the buried contours are
  // depth-culled by the neighbouring lobe's own solid, which is why the silhouette pass
  // is pushed only 0.025 toward the lens — enough to beat z-fighting, not enough to let
  // an interior lobe's outline show through the one in front of it.
  const heroGeom = mergeRocks([
    { r: 0.78, seed: 3, pos: [-0.62, 0.44, 0.18], rotY: 0.3 },
    { r: 0.72, seed: 4, pos: [0.34, 0.4, -0.3], rotY: 1.25 },
    { r: 0.64, seed: 21, pos: [-1.34, 0.34, -0.18], rotY: 2.4 },
    { r: 0.58, seed: 22, pos: [-0.28, 0.58, -0.64], rotY: 0.9 },
    { r: 0.52, seed: 23, pos: [0.96, 0.28, 0.24], rotY: 1.9 },
    { r: 0.46, seed: 24, pos: [-0.98, 0.66, 0.34], rotY: 0.55 },
    { r: 0.42, seed: 25, pos: [0.5, 0.66, 0.1], rotY: 2.75 },
    { r: 0.38, seed: 26, pos: [-1.62, 0.2, 0.42], rotY: 1.6 },
    { r: 0.34, seed: 27, pos: [0.16, 0.2, 0.5], rotY: 0.2 },
  ]);
  const heroRock = new THREE.Mesh(heroGeom, rockMaterial(P.rockFace));
  heroRock.castShadow = true;
  heroRock.receiveShadow = true;
  root.add(heroRock);
  // THE SILHOUETTE, and nothing else. `push` scales with the mass so the contour lands
  // ON the outline rather than 15 px clear of it — the registration failure foliage
  // measured and answered the same way.
  root.add(silhouette(heroGeom, VIEW_CAM, P.graphiteDark, 0.025, 'form'));

  // 2 · three outcrop chunks, merged — kept clear of +z (his peek line)
  const outcrop = mergeRocks([
    { r: 0.62, seed: 5, pos: [1.36, 0.26, -0.5], rotY: 0.4 },
    { r: 0.5, seed: 6, pos: [2.0, 0.2, -0.05], rotY: 1.1 },
    { r: 0.44, seed: 7, pos: [1.02, 0.16, -1.02], rotY: 2.2 },
    { r: 0.34, seed: 28, pos: [1.68, 0.14, -0.86], rotY: 1.75 },
  ]);
  const outcropMesh = new THREE.Mesh(outcrop, rockMaterial(P.rockFace));
  outcropMesh.castShadow = true;
  root.add(outcropMesh, silhouette(outcrop, VIEW_CAM, P.graphiteDark, 0.02, 'form'));

  // 3 · four talus chunks at the foot, merged. Lighter token, so the foot separates from
  // the mass by a value step rather than by a line.
  const talus = mergeRocks([
    { r: 0.36, seed: 8, pos: [-1.9, 0.1, -0.85], rotY: 0.9 },
    { r: 0.3, seed: 9, pos: [-2.34, 0.08, -0.45], rotY: 1.7 },
    { r: 0.25, seed: 10, pos: [-1.5, 0.07, -1.16], rotY: 2.9 },
    { r: 0.32, seed: 11, pos: [0.42, 0.09, -1.32], rotY: 0.2 },
  ]);
  const talusMesh = new THREE.Mesh(talus, rockMaterial(ROCK_LIT));
  talusMesh.castShadow = true;
  root.add(talusMesh, silhouette(talus, VIEW_CAM, P.graphiteDark, 0.015, 'form'));

  // 4 · the boulder on the cut edge, and its two strata marks
  const bx = 0.1;
  const bz = RZ * 0.965;
  const boulder = rockGeometry(0.52, 12);
  boulder.translate(bx, 0.1, bz);
  const boulderMesh = new THREE.Mesh(boulder, rockMaterial(P.rockFace));
  boulderMesh.castShadow = true;
  root.add(boulderMesh, silhouette(boulder, VIEW_CAM, P.graphiteDark, 0.02, 'form'));
  // the island's own band boundaries, continued across the boulder at prop scale: two
  // short polylines at the skirt's two boundary heights, scaled by this island's k.
  root.add(
    strokeSet(
      [-0.15, -0.36].map((y) => [
        new THREE.Vector3(bx - 0.46, y * g.k + 0.09, bz + 0.24),
        new THREE.Vector3(bx - 0.08, y * g.k + 0.13, bz + 0.38),
        new THREE.Vector3(bx + 0.4, y * g.k + 0.08, bz + 0.27),
      ]),
      P.graphiteDark,
      'form',
    ),
  );

  return root;
}
