import * as THREE from 'three';
import type { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { type Art, Pen, raw, buf, touch, rng, disposeTree } from './draw.ts';

// The haul rope. Authored once in a "rope space" — x runs 0..1 along the rope, y/z are
// world-unit offsets across it (the hand's wobble and the twist ticks) — and every
// set() maps that space onto a sagging chord a→b, writing the stroke buffers in place.
const N = 40; // points along the strand
const TICKS = 26; // twist marks
const R = 0.014; // rope half-thickness

export interface Rope extends Art {
  set(a: THREE.Vector3, b: THREE.Vector3, sag: number): void;
}

export function buildRope(): Rope {
  const rand = rng(41);
  const root = new THREE.Group();

  // strand: a smooth, hand-wobbled run (two slow sines keyed off the seed, baked once)
  const p1 = rand() * 6;
  const p2 = rand() * 6;
  const strandSrc = new Float32Array((N - 1) * 6);
  for (let i = 0; i < N - 1; i++) {
    for (let k = 0; k < 2; k++) {
      const t = (i + k) / (N - 1);
      const o = i * 6 + k * 3;
      strandSrc[o] = t;
      strandSrc[o + 1] = Math.sin(t * 9 + p1) * 0.006;
      strandSrc[o + 2] = Math.sin(t * 7 + p2) * 0.006;
    }
  }
  // twist: short slanted marks across the strand, the way a rope is drawn
  const tickSrc = new Float32Array(TICKS * 6);
  for (let i = 0; i < TICKS; i++) {
    const t = (i + 0.5 + (rand() - 0.5) * 0.3) / TICKS;
    tickSrc.set([t - 0.008, -R, R * 0.3, t + 0.008, R, -R * 0.3], i * 6);
  }

  const strand = raw(strandSrc.slice(), 'form');
  const ticks = raw(tickSrc.slice(), 'faint');
  for (const l of [strand, ticks]) l.frustumCulled = false; // the setter moves it anywhere
  root.add(strand, ticks);

  const pen = new Pen();
  pen.at(strand, 0, 0.7, true);
  pen.at(ticks, 0.55, 1, true);

  // scratch — set() is called every frame during hauls
  const chord = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const e3 = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const X = new THREE.Vector3(1, 0, 0);

  function map(line: LineSegments2, src: Float32Array, a: THREE.Vector3, sag: number) {
    const dst = buf(line);
    for (let i = 0; i < src.length; i += 3) {
      const t = src[i];
      const drop = sag * 4 * t * (1 - t);
      dst[i] = a.x + chord.x * t + e2.x * src[i + 1] + e3.x * src[i + 2];
      dst[i + 1] = a.y + chord.y * t - drop + e2.y * src[i + 1] + e3.y * src[i + 2];
      dst[i + 2] = a.z + chord.z * t + e2.z * src[i + 1] + e3.z * src[i + 2];
    }
    touch(line);
  }

  function set(a: THREE.Vector3, b: THREE.Vector3, sag: number) {
    chord.subVectors(b, a);
    const len = chord.length();
    if (len < 1e-6) e1.set(1, 0, 0);
    else e1.copy(chord).divideScalar(len);
    e3.crossVectors(e1, Math.abs(e1.y) > 0.95 ? X : UP).normalize();
    e2.crossVectors(e3, e1).normalize();
    map(strand, strandSrc, a, sag);
    map(ticks, tickSrc, a, sag);
    pen.retouch();
  }

  set(new THREE.Vector3(-0.6, 0.3, 0), new THREE.Vector3(0.6, 0.3, 0), 0.15);
  pen.reveal(0);
  return { root, set, reveal: (p) => pen.reveal(p), dispose: () => disposeTree(root) };
}
