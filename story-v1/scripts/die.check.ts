import assert from 'node:assert/strict';
import * as THREE from 'three';
import { dieFaces } from '../src/film/dieGeometry.ts';

// The whole dice gag rests on this: the die must land with one numbered face straight
// up, and a single rotation about one local axis must bring its neighbour up in its
// place. If this drifts, the 1 tips to something that isn't the 20 and nobody notices
// until they watch the finished film.
const d = dieFaces(0.35);
const X = new THREE.Vector3(1, 0, 0);

// at rest the 1-face points straight up
const up = d.faceDir(d.top).normalize();
assert.ok(up.y > 0.999, `top face should point up, got y=${up.y}`);

// one tilt about local X brings the 20-face exactly up
const rolled = d.faceDir(d.neighbour).normalize().applyAxisAngle(X, d.tipAngle);
assert.ok(rolled.y > 0.999, `neighbour should land up after the tilt, got y=${rolled.y}`);

// it is one face over, not a flip — an icosahedron's neighbouring faces sit ~41.8 apart
const deg = (d.tipAngle * 180) / Math.PI;
assert.ok(deg > 35 && deg < 48, `tilt should be one face (~41.8 deg), got ${deg.toFixed(1)}`);

// and it leans toward the camera, so the finger comes from behind the die rather than
// reaching across the lens
assert.ok(d.tipAngle > 0, `tilt should lean toward camera, got ${d.tipAngle}`);

console.log('die ok');
