import assert from 'node:assert/strict';
import * as THREE from 'three';
import { sketch, hatch, rays } from '../src/film/pencil.ts';

const SUB = 3; // no `window` in node, so pencil.ts builds at full detail

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

// tone: density is strokes per unit of height
assert.equal(segments(hatch(1, 1, 14)), 14 * SUB);
assert.equal(segments(hatch(1, 2, 10)), 20 * SUB);

// light: one spoke per ray
assert.equal(segments(rays(10)), 10 * SUB);

console.log('pencil ok');
