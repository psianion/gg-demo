import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

// Real modelling, in code. An asset is authored as blended masses — metaballs fused
// through an SDF field and polygonised once at build time — the way a sculptor blocks
// a form, not the way a parts bin stacks primitives. The result is ONE smooth organic
// mesh with field-gradient normals, which is exactly what the sketch pass (curtain.ts)
// needs to contour like a pencil drawing.
//
// Coordinates: balls live in a unit box [0..1]^3, y up. `ball(x, y, z, r)` takes an
// intended radius in box units. Geometry comes back in that same unit space — scale
// and translate it into the asset's own units at the call site.

export type Blob = [number, number, number, number]; // x, y, z, strength

const SUBTRACT = 10;
const ISOLATION = 80;

// A ball's surface sits where strength/d^2 - SUBTRACT = ISOLATION, so the strength
// for an intended radius r is (ISOLATION + SUBTRACT) * r^2.
export const ball = (x: number, y: number, z: number, r: number): Blob => [
  x,
  y,
  z,
  (ISOLATION + SUBTRACT) * r * r,
];

// Polygonisation is the expensive step, and several assets ship in size families —
// cache by the exact ball list so a forest of one pine design sculpts once.
const cache = new Map<string, THREE.BufferGeometry>();

export function blobs(balls: Blob[], res = 44): THREE.BufferGeometry {
  const key = res + '|' + balls.map((b) => b.map((v) => v.toFixed(4)).join(',')).join(';');
  const hit = cache.get(key);
  if (hit) return hit;

  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 100000);
  mc.isolation = ISOLATION;
  for (const [x, y, z, s] of balls) mc.addBall(x, y, z, s, SUBTRACT);
  mc.update();

  const count = mc.geometry.drawRange.count;
  const pos = (mc.geometry.getAttribute('position').array as Float32Array).slice(0, count * 3);
  const nor = (mc.geometry.getAttribute('normal').array as Float32Array).slice(0, count * 3);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  // the field's [0..1] ball space comes back as [-1..1] mesh space — undo that so the
  // caller's coordinates mean what they said
  geom.scale(0.5, 0.5, 0.5);
  geom.translate(0.5, 0.5, 0.5);
  geom.computeBoundingSphere();

  mc.geometry.dispose();
  (mc.material as THREE.Material).dispose();
  cache.set(key, geom);
  return geom;
}
