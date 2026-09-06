// MOCK — Cloth. Art bible §11.2, row 9. Author group D / mockup author 4.
//
//   http://localhost:5180/?mock=cloth            beside the actual hero island
//   http://localhost:5180/?mock=cloth&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=cloth&zoom=1..6
//
// THE HUMAN BUILD LAW (cast doc §1.1). A human here is built to three marks the goblin
// does not have, and to nothing else:
//   1. the SHOULDER LINE — a horizontal at the top of the body. He has none.
//   2. one unbroken VERTICAL DRAPE — he is a dome on a stump; they are a wedge on a
//      column.
//   3. exactly ONE silhouette-carrying attribute — raised sword · shield · hat brim.
//      A second attribute halves the first.
// No hands, no feet, no face in the silhouette. A hand is the end of the sleeve and
// the object starts inside it (§1.3). No eye geometry: a head here is 6–13 px and two
// ink dots on it is a beetle, not a person (R17). What replaces them is the head
// sitting whole in its SHADE tier plus exactly one jaw contour.
//
// THE ONE THING THE RECIPE DOES NOT SAY, AND THE FIRST WALK PROVED: a lathe of
// revolution is a BOTTLE. Round cross-section + a shoulder bulge + a knob on top is the
// chess-pawn silhouette v1 failed by, whatever the profile does. A human is WIDE ACROSS
// THE LENS AND THIN IN DEPTH — the cross-section is squashed to 0.56 in z, and that one
// number is what turns "a wedge on a column" from prose into a silhouette. MOCK-4.md.
//
// G6 is absolute — no cast member is ever markAlive'd — so every read here has to
// survive the drain with all colour removed: silhouette and one value step carry the
// whole figure, and its colour is decoration on top.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { propGround } from './groundKit.ts';
import { mark, mergeAt, at, limb, vp, mixHex, hand, VIEW_CAM } from './marksKit.ts';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';

// R16: the cast scales ×1.30 — a human stands 1.24 u (the crown of a bare head), the
// ---- THE RECIPE NOW LIVES IN clothKit.ts --------------------------------------------
// Every number that was here — DEPTH, the DRAPE table, bakeCloth, drapeGeom, the three
// earthy cloak tokens, buildFigure and the six materials — moved to ./clothKit.ts the
// day the film's own sets/kit.ts needed an adventurer. Nothing changed but the file it
// sits in: the mock route and the film body now build the SAME human from the SAME
// numbers, which is the only way "the mock proves the row" stays true.
import {
  buildFigure,
  mergeFigureMarks,
  garmentMaterial,
  figureMaterial,
  cloakRoad,
  cloakOiled,
  cloakUmber,
  humanFace,
  type Part,
  type PartKind,
  type Attribute,
} from './clothKit.ts';

type Cloak = 'road' | 'oiled' | 'umber';
const CLOAK: Record<Cloak, number> = { road: cloakRoad, oiled: cloakOiled, umber: cloakUmber };
type Buckets = Record<Cloak | Exclude<PartKind, 'garment'>, Part[]>;



/** The adventurer trio — S1's ambush cast, and the film's whole human vocabulary. */
export function buildMock(): THREE.Object3D {
  const root = new THREE.Group();
  const b: Buckets = { road: [], oiled: [], umber: [], face: [], linen: [], steel: [], brass: [], timber: [] };
  const marks: LineSegments2[] = [];

  // R4: the darkest figure is RESTAGED, never re-mixed — at L 0.336 against the rendered
  // pine crown's 0.314 it is Δ 0.022, the same failure that killed the rust tunic at
  // Δ 0.011 — so he takes the slot whose background is lit ground or the paper void,
  // never the treeline. Here that is the outboard slot, clear of the island.
  const cast: [number, number, Cloak, Attribute, number][] = [
    [-0.86, -0.16, 'road', 'sword', 3],
    [0.0, 0.12, 'oiled', 'shield', 8],
    [0.9, -0.05, 'umber', 'brim', 14],
  ];
  for (const [h, push, cloak, attribute, seed] of cast) {
    // the sink is what lets one recipe fill three garments here and one on a film set
    buildFigure(
      (kind, geom, m) => b[kind === 'garment' ? cloak : kind].push({ geom, m }),
      marks,
      vp(new THREE.Vector3(0, 0, 0), h, 0, push),
      attribute,
      seed,
    );
  }

  // The six materials come from the kit, so the film's adventurers and this trio are
  // painted by the same cache — see clothKit.figureMaterial for why poster is 8.
  const mats: Record<keyof Buckets, THREE.Material> = {
    road: garmentMaterial(cloakRoad),
    oiled: garmentMaterial(cloakOiled),
    umber: garmentMaterial(cloakUmber),
    face: figureMaterial('face'),
    linen: figureMaterial('linen'),
    steel: figureMaterial('steel'),
    brass: figureMaterial('brass'),
    timber: figureMaterial('timber'),
  };

  for (const key of Object.keys(b) as (keyof Buckets)[]) {
    if (!b[key].length) continue;
    const mesh = new THREE.Mesh(mergeAt(b[key]), mats[key]);
    mesh.name = 'cloth:' + key;
    // G6 / direction §8: no cast member is ever alive, so no cast member may cast into
    // a frozen frame. A mockup cannot register with rigs.markCaster (that registry is
    // per-rig and the route owns the rig), and a permanent castShadow would put a cast
    // shadow on the Prep page — the one thing Prep forbids. Grounding is C9's painted
    // contact blob in the island's own albedo, which the mock's bare paper has not got.
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class now builds the ordinary ground
  // card under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  root.add(propGround(2.2, 1.7, cast.map(([h, , , , ]) => { const o = vp(new THREE.Vector3(0, 0, 0), h, 0, 0); return [o.x, o.z, 88, 0.34] as [number, number, number, number]; })));

  const drawn = mergeFigureMarks(marks);
  drawn.name = 'cloth:marks';
  root.add(drawn);
  return root;
}

// ponytail: no eye dots, no mouth, no fingers, no separate boots, no beard. Every one
// of those is under 3 px at this film's framings and every one of them was in the v1
// build — which is exactly why the v1 figures read as chess pawns. The DM is the film's
// one head above 80 px and takes eye dots there; nothing else does, and there is no
// runtime LOD anywhere: each figure is authored once, at the small end.
