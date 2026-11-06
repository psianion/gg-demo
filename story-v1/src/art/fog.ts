import * as THREE from 'three';
import type { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { type Art, Pen, raw, buf, touch, rng, disposeTree, flatPaper, clamp01 } from './draw.ts';

// Fog of war: a hatched paper sheet lying over w×d of the map. setPeel(0..1) pulls it
// back like a bedsheet from the -x edge: a fold line travels toward +x, the peeled part
// curls over a small roll and lies on top heading the other way. At 1 the sheet is
// folded clean past the +x edge; erase the pile with reveal(1 → 0) if it must go.
//
// Everything (paper fill, outline, hatch) is authored flat in sheet space (x, z) and
// remapped in place by setPeel — no allocation.
const CURL = 0.07; // radius of the roll at the fold
const LIFT = 0.012; // the sheet floats this far above the map

export interface Fog extends Art {
  setPeel(p: number): void;
}

export function buildFogSheet(w: number, d: number): Fog {
  const rand = rng(Math.round(w * 131 + d * 17));
  const root = new THREE.Group();
  const x0 = -w / 2;

  // paper fill: a plane in XZ, finely divided along x so it can bend at the fold
  const segX = Math.max(24, Math.round(w * 28));
  const fillGeom = new THREE.PlaneGeometry(w, d, segX, 2).rotateX(-Math.PI / 2);
  const fillMat = flatPaper();
  const fill = new THREE.Mesh(fillGeom, fillMat);
  const fillPos = fillGeom.getAttribute('position') as THREE.BufferAttribute;
  const fillSrc = (fillPos.array as Float32Array).slice();

  // outline: a slightly ragged rectangle, many short segments so it bends too
  const out: number[] = [];
  const edge = (ax: number, az: number, bx: number, bz: number, n: number) => {
    let px = ax;
    let pz = az;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const j = i < n ? (rand() - 0.5) * 0.02 : 0;
      const qx = ax + (bx - ax) * t + (az === bz ? 0 : j);
      const qz = az + (bz - az) * t + (az === bz ? j : 0);
      out.push(px, 0, pz, qx, 0, qz);
      px = qx;
      pz = qz;
    }
  };
  const nx = Math.round(w / 0.05);
  const nz = Math.round(d / 0.05);
  edge(x0, -d / 2, -x0, -d / 2, nx);
  edge(-x0, -d / 2, -x0, d / 2, nz);
  edge(-x0, d / 2, x0, d / 2, nx);
  edge(x0, d / 2, x0, -d / 2, nz);

  // hatch: diagonal strokes clipped to the sheet, cut into short pieces, stopping
  // short of the edge by varying amounts the way pencil.ts hatch does
  const hat: number[] = [];
  const gap = 0.07;
  const k = 0.8; // slope dz/dx
  const span = w + d / k;
  for (let c = -span / 2; c < span / 2; c += gap * (0.85 + rand() * 0.3)) {
    // line: z = k (x - c)
    let xa = Math.max(x0, c - d / 2 / k);
    let xb = Math.min(-x0, c + d / 2 / k);
    if (xb - xa < 0.05) continue;
    xa += (xb - xa) * rand() * 0.06;
    xb -= (xb - xa) * rand() * 0.06;
    const n = Math.max(2, Math.ceil((xb - xa) / 0.06));
    for (let i = 0; i < n; i++) {
      const a = xa + ((xb - xa) * i) / n;
      const b = xa + ((xb - xa) * (i + 1)) / n;
      hat.push(a, 0, k * (a - c), b, 0, k * (b - c));
    }
  }

  const outSrc = new Float32Array(out);
  const hatSrc = new Float32Array(hat);
  const outline = raw(outSrc.slice(), 'form');
  const hatch = raw(hatSrc.slice(), 'faint');
  for (const o of [outline, hatch, fill]) o.frustumCulled = false;
  root.add(fill, outline, hatch);

  // sheet (x, z) at fold f → world, written into dst
  const fold = (src: Float32Array, dst: Float32Array, f: number, stride: number) => {
    for (let i = 0; i < src.length; i += stride) {
      const x = src[i];
      const s = f - x; // how far behind the fold this point lies
      let wx = x;
      let wy = 0;
      if (s > 0) {
        if (s < Math.PI * CURL) {
          const a = s / CURL;
          wx = f - CURL * Math.sin(a);
          wy = CURL * (1 - Math.cos(a));
        } else {
          wx = f + (s - Math.PI * CURL);
          wy = 2 * CURL;
        }
      }
      dst[i] = wx;
      dst[i + 1] = wy + LIFT + src[i + 1];
      dst[i + 2] = src[i + 2];
    }
  };
  const lines: [LineSegments2, Float32Array][] = [[outline, outSrc], [hatch, hatSrc]];
  function setPeel(p: number) {
    // fold travels from the -x edge to the +x edge; slightly past, so the last strip lifts
    const f = x0 + clamp01(p) * (w + Math.PI * CURL);
    for (const [l, src] of lines) {
      fold(src, buf(l), f, 3);
      touch(l);
    }
    fold(fillSrc, fillPos.array as Float32Array, f, 3);
    fillPos.needsUpdate = true;
    pen.retouch();
  }

  const pen = new Pen();
  pen.at(fill, 0, 0.3);
  pen.at(outline, 0, 0.35, true);
  pen.at(hatch, 0.3, 1, true);

  setPeel(0);
  pen.reveal(0);
  return { root, setPeel, reveal: (p) => pen.reveal(p), dispose: () => disposeTree(root, [fillMat]) };
}
