import assert from 'node:assert/strict';
import * as THREE from 'three';
import { sketch, hatch, rays, numeral, polyline, curveLine } from '../src/film/pencil.ts';

const SUB = 3; // no `window` in node, so pencil.ts builds at full detail
// …and the subdivision is LENGTH-GATED. The interior points exist for one reason — to
// bow a span off true by len·0.035 — and under 0.25 u that bow is 0.0088 u, which is
// 0.67 screen px at the film's 77 px/u wide framing and 1.4 px at the hero's 161 px/u.
// Both are narrower than the 2.1-px round-capped stroke they would be displacing, so
// below the floor the subdivision is a sub-pixel wobble on a line already wider than the
// wobble. Measured over the whole built film world: 38,241 stroke segments before the
// gate and 21,183 after — 34,116 triangles, 45% of the film's entire stroke bill, for no
// change the lens can resolve. Long strokes — contours, rims, marks, the whole hand-drawn
// register — are over the floor and keep all three.
const SUB_MIN = 0.25; // world units — pencil.ts strokes()
const subFor = (len: number) => (len >= SUB_MIN ? SUB : 1);

const segments = (line: any) => line.geometry.attributes.instanceStart.count;
const lineOf = (group: THREE.Object3D) => group.children[1];

// a solid is still fill + edges, so every existing set piece keeps building
const box = sketch(new THREE.BoxGeometry(1, 1, 1));
assert.equal(box.children.length, 2);
assert.ok(box.children[0] instanceof THREE.Mesh);

// each of a cube's 12 edges is drawn as SUB sub-strokes, which is what carries the wobble
assert.equal(segments(lineOf(box)), 12 * SUB);

// the wobble is bounded: overshoot and drift stay near the true form rather than
// deforming it. A unit edge may stray at most ~0.045; 0.06 leaves headroom without
// letting a runaway jitter bug through.
const start = (lineOf(box) as any).geometry.attributes.instanceStart;
for (let i = 0; i < start.count; i++) {
  for (const v of [start.getX(i), start.getY(i), start.getZ(i)]) {
    assert.ok(Math.abs(v) <= 0.5 + 0.06, `stroke strayed to ${v}`);
  }
}

// the silhouette shell is opt-in, sits behind the fill, and comes out a constant rim
// thickness whatever the form's size — a flat scale factor was the bug this replaces
const plain = sketch(new THREE.SphereGeometry(0.16, 12, 10));
assert.equal(plain.children.length, 2, 'no shell unless asked for');
for (const [radius, thickness] of [
  [0.16, 0.013],
  [0.7, 0.02],
] as [number, number][]) {
  const shelled = sketch(new THREE.SphereGeometry(radius, 12, 10), 25, 'form', thickness);
  assert.equal(shelled.children.length, 3, 'shell adds exactly one mesh');
  const rim = shelled.children[2] as THREE.Mesh;
  assert.equal((rim.material as THREE.MeshBasicMaterial).side, THREE.BackSide);
  const grown = (rim.scale.x - 1) * radius;
  assert.ok(
    Math.abs(grown - thickness) < 1e-6,
    `rim came out ${grown} thick, expected ${thickness}`,
  );
}

// a drawn polyline chains its points; closing it adds the one segment back to the start
assert.equal(segments(polyline([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)])), 1 * SUB);
const square = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(1, 1, 0),
  new THREE.Vector3(0, 1, 0),
];
assert.equal(segments(polyline(square)), 3 * SUB);
assert.equal(segments(polyline(square, 'form', true)), 4 * SUB);

// a curve is resampled into `segments` spans — getPoints(n) returns n+1 points
// THE LENGTH GATE, on the one shape where it is unambiguous: two single-span polylines,
// one either side of the floor. This is the assertion that pins the rule.
assert.equal(segments(polyline([new THREE.Vector3(), new THREE.Vector3(SUB_MIN * 0.8, 0, 0)])), 1);
assert.equal(segments(polyline([new THREE.Vector3(), new THREE.Vector3(SUB_MIN * 1.2, 0, 0)])), SUB);
// A curve's resampled spans are NOT uniform — a CatmullRom's ends run long — so a curve
// cut fine enough to straddle the floor comes back between the two bounds rather than on
// one of them. Cut coarse enough that every span clears the floor and it is all three.
const arcPts = [new THREE.Vector3(), new THREE.Vector3(1, 0, 1), new THREE.Vector3(2, 0, 0)];
const fine = segments(curveLine(arcPts, 'form', 12));
assert.ok(fine >= 12 && fine <= 12 * SUB, `straddling curve out of bounds: ${fine}`);
assert.equal(segments(curveLine(arcPts, 'form', 4)), 4 * subFor(0.57));

// tone: density is strokes per unit of height
assert.equal(segments(hatch(1, 1, 14)), 14 * SUB);
assert.equal(segments(hatch(1, 2, 10)), 20 * SUB);

// light: one spoke per ray, plus the broken-halo chord after every other spoke
// (art-bible ragged burst: n spokes + ceil(n/2) halo dashes)
// rays() RETIRE film-wide (art bible §11.2 row 23 — "rays were v1's word for light");
// what is left of them is one 0.08-u candle set, and every span in a burst that small is
// under the subdivision floor. So the count is bounded rather than pinned: the structure
// is still 15 spans, and how many of them carry interior points is the length gate's
// business, not this assertion's.
const burst = segments(rays(10));
assert.ok(burst >= 15 && burst <= 15 * SUB, `ray burst out of bounds: ${burst}`);

// numerals: a digit is a handful of segments, so a real stroke count comes out
const numeralLine = (n: THREE.Group) => n.children[0] as any;
const one = numeral(1);
const oneSegs = segments(numeralLine(one));
assert.ok(oneSegs > 0, 'a single digit should draw strokes');

// a two-digit number draws strictly more strokes than a one-digit number
const twenty = numeral(20);
const twentySegs = segments(numeralLine(twenty));
assert.ok(twentySegs > oneSegs, `expected 20 (${twentySegs}) to draw more than 1 (${oneSegs})`);

// the whole run is centred on the local origin, not left-aligned from it
for (const n of [1, 13, 20]) {
  const geom = (numeralLine(numeral(n)) as any).geometry.attributes;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < geom.instanceStart.count; i++) {
    for (const x of [geom.instanceStart.getX(i), geom.instanceEnd.getX(i)]) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }
  const mid = (minX + maxX) / 2;
  assert.ok(Math.abs(mid) < 0.05, `numeral(${n}) bounding box centred at ${mid}, expected near 0`);
}

console.log('pencil ok');
