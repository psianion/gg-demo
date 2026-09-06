// MOCK — Field wash. Art bible §11.2 row 21; world direction §5-S7B.
//
//   http://localhost:5180/?mock=field
//   http://localhost:5180/?mock=field&rig=prep
//
// S7's miniature world, six fields, and the board's own fields later. ALTERNATING so
// no two adjacent fields share an underdrawing tier (C5) — and where two tier-2s must
// adjoin, the hedge between them is the separator. This is the simplest row in the
// table and it exists to prove the adjacency rule at its cheapest.
//
// ONE MATERIAL, ONE BAKE, ONE DRAW for all six. §11.4 R9 rejected "three tints in a
// second region of bakeGroundSheet" — a TILING sheet cannot carry a sub-region, the
// repeat wrap addresses the whole canvas — so the tints get their own 256² bake with
// three UV-selected blocks and the six cards merge into one BufferGeometry.
//
// TWO WALKED DEPARTURES FROM THE ROW, both for the same reason — the first build was
// six axis-aligned rectangles on a regular grid, separated by `polyline()` hedges, and
// it rendered as GRAPH PAPER: ruled green lines boxing equal cells.
//
//  1. THE FIELDS SIT ON AN IRREGULAR LATTICE. Twelve jittered lattice points; each
//     field is the quad between four of them. No two field edges are parallel, every
//     border is SHARED with its neighbour rather than each field carrying its own box,
//     and the patchwork interlocks the way enclosure fields do.
//  2. A HEDGE IS A MASS, NOT A LINE. The row says `polyline()` in canopyDeep and at
//     this scale that is a 2.1-px ruled boundary — a cadastral plan, not a hedge. It
//     also cannot drain: strokes are `LineMaterial` and keep their colour through the
//     curtain, so six green rules would survive into a graphite frame. Built instead
//     as one merged low ridge on the trilayer it reads as planted, it drains with
//     everything else, and it is still ONE draw.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as P from '../palette.ts';
import { roughen } from '../pencil.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { brand, buildGroundCard, fieldMaterial, strokeSet } from './groundKit.ts';

const RX = 3.0;
const RZ = 2.1;
const COLS = 3;
const ROWS = 2;

// tint block per field, 0 = fieldA t2 · 1 = fieldB t2 · 2 = fieldC t3. Read across and
// down: 2|3 3|2 · 3|2 2|3 · vertically 2|3 3|2 2|3. Nothing adjacent shares a tier.
const TINTS = [
  [0, 2, 1],
  [2, 0, 2],
];

export function buildMock(): THREE.Object3D {
  const g = buildGroundCard(RX, RZ, { gap: [268, 92] });

  // the lattice: (COLS+1) × (ROWS+1) points across the card's inner two thirds, each
  // pushed off true. The jitter is the whole difference between a patchwork and a grid.
  const node: THREE.Vector2[][] = [];
  for (let r = 0; r <= ROWS; r++) {
    const row: THREE.Vector2[] = [];
    for (let c = 0; c <= COLS; c++) {
      const edge = r === 0 || r === ROWS || c === 0 || c === COLS;
      const p = new THREE.Vector2(
        -RX * 0.7 + (c / COLS) * RX * 1.4 + (brand() - 0.5) * (edge ? 0.3 : 0.8),
        -RZ * 0.58 + (r / ROWS) * RZ * 1.16 + (brand() - 0.5) * (edge ? 0.22 : 0.55),
      );
      // pull every node back inside the card's own ellipse: the lattice is rectangular
      // and the island is not, so an un-clamped corner hangs a field off the rim into
      // bare paper — walked, bottom-left, and it reads as a dropped tile
      const q = Math.hypot(p.x / (RX * 0.8), p.y / (RZ * 0.8));
      if (q > 1) p.multiplyScalar(1 / q);
      row.push(p);
    }
    node.push(row);
  }

  // ============ FIX ROUND — ITEM 19: LAND DOES NOT HAVE VERTICES ==================
  //
  // "Decal boundaries cut into grass with hard geometric edges. Land does not have
  // vertices… replace the green rules with a real separator — a low planted ridge with
  // its own dabs, or a value step in the wash, but not a line. And make the field
  // boundaries irregular."
  //
  // The lattice was already jittered, but each field was a four-vertex QUAD, so every
  // border between two nodes was a dead straight line and the patchwork read as a
  // cadastral plan whatever the corners did. Every border is now a POLYLINE of five
  // points wandering ±0.09 u off true, and — this is the load-bearing part — each
  // border is built ONCE and shared by the two fields either side of it, so a wandering
  // boundary cannot open a gap of bare meadow between neighbours.
  const border = new Map<string, THREE.Vector2[]>();
  const key = (a: THREE.Vector2, b: THREE.Vector2) =>
    a.x < b.x || (a.x === b.x && a.y < b.y)
      ? `${a.x},${a.y}|${b.x},${b.y}`
      : `${b.x},${b.y}|${a.x},${a.y}`;
  const edgeOf = (a: THREE.Vector2, b: THREE.Vector2): THREE.Vector2[] => {
    const k = key(a, b);
    let run = border.get(k);
    if (!run) {
      const n = new THREE.Vector2(b.y - a.y, a.x - b.x).normalize();
      run = [0, 1, 2, 3, 4].map((i) =>
        a.clone().lerp(b, i / 4).addScaledVector(n, i === 0 || i === 4 ? 0 : (brand() - 0.5) * 0.18),
      );
      border.set(k, run);
    }
    // the stored run always goes from the LOWER key end; hand it back the way asked
    return run[0].distanceToSquared(a) < run[run.length - 1].distanceToSquared(a)
      ? run
      : [...run].reverse();
  };

  // six field polygons, merged. `fieldCard` carries the UV block selection; the polygon
  // is then triangulated as a fan from its own centroid, which a convex-ish enclosure
  // always allows and which costs 14 triangles instead of 2.
  const quads: THREE.BufferGeometry[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ring = [
        ...edgeOf(node[r][c], node[r][c + 1]).slice(0, -1),
        ...edgeOf(node[r][c + 1], node[r + 1][c + 1]).slice(0, -1),
        ...edgeOf(node[r + 1][c + 1], node[r + 1][c]).slice(0, -1),
        ...edgeOf(node[r + 1][c], node[r][c]).slice(0, -1),
      ];
      const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length;
      const cy = ring.reduce((s, p) => s + p.y, 0) / ring.length;
      const pos: number[] = [];
      const uvs: number[] = [];
      const inset = 3 / 256;
      const tier = TINTS[r][c];
      // the tint block is picked by v; u carries the field's own extent so the furrows
      // run at one world scale across all six
      const push = (x: number, z: number) => {
        pos.push(x, 0.01, z);
        uvs.push((x - cx) * 0.5 + 0.5, ((z - cy) * 0.5 + 0.5) * (1 / 3 - inset * 2) + tier / 3 + inset);
      };
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        push(cx, cy);
        push(a.x, a.y);
        push(b.x, b.y);
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.computeVertexNormals();
      quads.push(geom);
    }
  }
  const fields = new THREE.Mesh(mergeGeometries(quads, false)!, fieldMaterial());
  fields.receiveShadow = true;
  fields.renderOrder = 1;
  g.root.add(fields);

  // THE HEDGES — a MASS, not a ridge, and not a line.
  //
  // The pass before this one built each border as three low triangular prisms and the
  // judgement still read them as "bright green rules". A prism has two long straight
  // edges however low it is, and two straight edges 0.07 u apart at film framing ARE a
  // ruled line. A hedge is a row of PLANTING: five roughened lobes per border segment,
  // unequal, overlapping, so its silhouette breaks the way the copse's own shrubs do —
  // which is also the foliage class's word for the same thing, said quietly.
  const bushes: THREE.BufferGeometry[] = [];
  const plant = (run: THREE.Vector2[]) => {
    for (let i = 0; i < run.length - 1; i++) {
      const a = run[i];
      const b = run[i + 1];
      // TWO lobes per sub-segment, not three, at 7×5 — measured. Three at 9×6 over
      // seventeen borders is 204 spheres and 19,584 triangles, which made this the most
      // expensive class in the set; a hedge lobe is 0.05–0.085 u and never wider than
      // ~14 screen px, so the tessellation is spent where nothing can see it.
      const n = 2;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const p = a.clone().lerp(b, t);
        const r = 0.05 + brand() * 0.035;
        const lobe = roughen(new THREE.SphereGeometry(r, 7, 5), r * 0.34, 9, 200 + bushes.length);
        lobe.scale(1.25, 0.72, 1.05);
        lobe.translate(p.x + (brand() - 0.5) * 0.03, r * 0.5, p.y + (brand() - 0.5) * 0.03);
        bushes.push(lobe);
      }
    }
  };
  // EVERY lattice edge, outer boundary included — walked. Hedging only the interior
  // borders left the patchwork's outside edge as a hard straight cut against the meadow
  // and the whole block read as pasted paper. A field is an ENCLOSURE; the outermost
  // hedge is the one that says so.
  const allEdges: THREE.Vector2[][] = [];
  for (let c = 0; c <= COLS; c++) for (let r = 0; r < ROWS; r++) allEdges.push(edgeOf(node[r][c], node[r + 1][c]));
  for (let r = 0; r <= ROWS; r++) for (let c = 0; c < COLS; c++) allEdges.push(edgeOf(node[r][c], node[r][c + 1]));
  for (const run of allEdges) plant(run);
  const hedge = new THREE.Mesh(
    mergeGeometries(bushes, false)!,
    // canopyDeep t4 against fieldA/B t2 and fieldC t3 — two tier bands of separation
    // either side, which is what makes it legible as a separator and not a seam
    createTrilayer({ color: P.canopyDeep, wear: 0.22, poster: 8, stroke: { dir: 0.3, sheet: true } }),
  );
  hedge.castShadow = true;
  hedge.receiveShadow = true;
  g.root.add(hedge);

  // ============ FIX ROUND — ITEM 20: THE CLASS HAD NO DRAWN STATE ================
  //
  // "The class DISAPPEARS: one grey disc with ghost polygon outlines. Give the class a
  // drawn state. It vanishes at curtain 1."
  //
  // It vanished because everything the class owned was ALBEDO — three tints inside one
  // luminance band, which quantize into the same drawn tier and leave a blank disc — and
  // the hedges were geometry the drain turned into more of the same grey. Enclosure is a
  // thing a hand DRAWS, so every border now carries an authored run at 'form'. One
  // strokeSet, one draw, present in both states, and it is what makes the patchwork a
  // patchwork on the graphite page.
  g.root.add(
    strokeSet(
      // 0.15, not 0.055: the hedge lobes span 0 to 0.09 in y, so a run at 0.055 is INSIDE
      // the planting it is supposed to describe and never draws
      allEdges.map((run) => run.map((p) => new THREE.Vector3(p.x, 0.15, p.y))),
      P.graphiteDark,
      'form',
    ),
  );

  return g.root;
}
