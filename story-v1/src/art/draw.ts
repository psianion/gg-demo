import * as THREE from 'three';
import type { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import type { InterleavedBufferAttribute } from 'three';
import { polyline, type Weight } from '../hero/film/pencil.ts';
import { brass, amber, amberLantern, mushCap, paper, ink } from '../hero/film/palette.ts';

// Shared plumbing for every prop in src/art: the draw-on pen, the view plane that
// rounded forms carry their contours in, and a few point generators. Lines are always
// pencil.ts strokes — this file only orders and reveals them.

export interface Art {
  root: THREE.Group; // origin at the prop's footprint centre, resting on y = 0
  reveal(p: number): void; // 0 = not drawn, 1 = fully drawn. Pure function of p.
  dispose(): void;
}

// One accent per object.
export const ACCENT = {
  brass, // light
  flame: amberLantern,
  glow: amber,
  orange: 0xd9772b, // player tokens
  red: mushCap, // the d20
  wood: 0xd8c3a0, // the table: pale, so the laptop reads against it
  ink,
  paper,
};

// ---- deterministic hand ---------------------------------------------------
export function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- the view plane -------------------------------------------------------
// A rounded solid's silhouette depends on the lens. Like the hero's contourArc, the
// contours of cloud / sack / pawns are drawn where THE SHOT sees the edge: builder's beat
// 2-3 camera, on -z looking toward +z at 52° elevation (screen-right = -x, the hero's
// convention). Pass another `view` if the camera differs.
export const VIEW = new THREE.Vector3(0, Math.sin((52 * Math.PI) / 180), -Math.cos((52 * Math.PI) / 180));

/** Yaw that turns an object's authored +z "front" toward the camera. */
export const yawTo = (view: THREE.Vector3) => Math.atan2(view.x, view.z);

export type Basis = { right: THREE.Vector3; up: THREE.Vector3; view: THREE.Vector3 };
export function basis(view: THREE.Vector3 = VIEW): Basis {
  const v = view.clone().normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(v);
  if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
  right.normalize();
  const up = v.clone().cross(right).normalize();
  return { right, up, view: v };
}

/** Arc in the view plane around c: angle 0 = screen right, π/2 = screen up. */
export function viewArc(
  c: THREE.Vector3,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  b: Basis,
  n = 18,
  rand?: () => number,
  jit = 0.05,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const j = rand ? 1 + (rand() - 0.5) * jit : 1;
    pts.push(
      c.clone()
        .addScaledVector(b.right, Math.cos(a) * rx * j)
        .addScaledVector(b.up, Math.sin(a) * ry * j),
    );
  }
  return pts;
}

/** Horizontal ellipse (XZ) at height y — view-independent, so it reads from any yaw. */
export function ring(
  rx: number,
  rz: number,
  y: number,
  n = 24,
  a0 = 0,
  a1 = Math.PI * 2,
  rand?: () => number,
  jit = 0.04,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const j = rand ? 1 + (rand() - 0.5) * jit : 1;
    pts.push(new THREE.Vector3(Math.cos(a) * rx * j, y, Math.sin(a) * rz * j));
  }
  return pts;
}

export const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---- raw / merged strokes -------------------------------------------------
// A pencil stroke whose positions this code owns (rain, rope, fog — anything moved by
// a setter). The material and weight still come from pencil.ts; only the buffer is ours.
export function raw(positions: Float32Array, w: Weight = 'form'): LineSegments2 {
  const line = polyline([v3(0, 0, 0), v3(1, 0, 0)], w);
  line.geometry.setPositions(positions);
  return line;
}

/** The live xyzxyz buffer of a stroke, for in-place edits (then call touch()). */
export function buf(line: LineSegments2): Float32Array {
  const a = line.geometry.attributes.instanceStart as InterleavedBufferAttribute;
  return a.data.array as Float32Array;
}
export function touch(line: LineSegments2): void {
  (line.geometry.attributes.instanceStart as InterleavedBufferAttribute).data.needsUpdate = true;
}
export const segCount = (line: LineSegments2) =>
  (line.geometry.attributes.instanceStart as InterleavedBufferAttribute).count;

/** Fold many drawn strokes into one draw call, segments ordered by `key` (draw-on order). */
export function merge(
  lines: LineSegments2[],
  w: Weight,
  key: (x: number, y: number, z: number) => number,
): LineSegments2 {
  const segs: { k: number; i: number; a: Float32Array }[] = [];
  for (const l of lines) {
    const a = buf(l);
    for (let i = 0; i < a.length; i += 6) {
      segs.push({ k: Math.min(key(a[i], a[i + 1], a[i + 2]), key(a[i + 3], a[i + 4], a[i + 5])), i, a });
    }
    l.geometry.dispose();
  }
  segs.sort((p, q) => p.k - q.k);
  const out = new Float32Array(segs.length * 6);
  segs.forEach((s, j) => out.set(s.a.subarray(s.i, s.i + 6), j * 6));
  return raw(out, w);
}

// ---- the pen --------------------------------------------------------------
// Draw-on by instance count: a LineSegments2 is instanced per segment, so drawing the
// first n segments is just `geometry.instanceCount = n` — no allocation, any p, both
// directions. Within an entry, strokes draw in the order they were added.
//
// The pen tip moves continuously: the one partly drawn segment has its end pulled back
// to lerp(start, end, frac), so the line end glides instead of stepping a segment at a
// time. Its true end is kept aside and put back when the tip moves on.
//
// Solids (the fills) fade in across FILL_A → FILL_B of their entry's progress — outline
// first, then it's coloured in. Each solid gets its own transparent clone of its material
// at registration (permanently transparent, so opacity changes never recompile).
const FILL_A = 0.4;
const FILL_B = 0.8;

type Tip = { idx: number; frac: number; saved: Float32Array; applied: boolean };
type Entry = {
  lines: LineSegments2[];
  starts: number[];
  counts: number[];
  tips: Tip[];
  total: number;
  solids: THREE.Object3D[];
  mats: THREE.Material[];
  t0: number;
  t1: number;
  dynamic: boolean;
};

const isLine = (o: THREE.Object3D): o is LineSegments2 =>
  (o as unknown as { isLineSegments2?: boolean }).isLineSegments2 === true;

function fadeClone(src: THREE.Material): THREE.Material {
  const m = src.clone();
  // clone() drops the pigment patch — carry it over so the fill looks the same
  m.onBeforeCompile = src.onBeforeCompile;
  m.customProgramCacheKey = src.customProgramCacheKey;
  m.transparent = true;
  m.userData.penClone = true;
  return m;
}

export class Pen {
  private entries: Entry[] = [];

  /** Draw `obj` (all its strokes, in traversal order) inside [t0, t1] of p.
   * `dynamic`: a setter rewrites these strokes' buffers (call retouch() after it does). */
  at<T extends THREE.Object3D>(obj: T, t0: number, t1: number, dynamic = false): T {
    const e: Entry = { lines: [], starts: [], counts: [], tips: [], total: 0, solids: [], mats: [], t0, t1, dynamic };
    obj.traverse((o) => {
      if (isLine(o)) {
        e.lines.push(o);
        e.starts.push(e.total);
        const c = segCount(o);
        e.counts.push(c);
        e.tips.push({ idx: -1, frac: 0, saved: new Float32Array(3), applied: false });
        e.total += c;
      } else if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        const m = fadeClone(mesh.material as THREE.Material);
        mesh.material = m;
        e.solids.push(mesh);
        e.mats.push(m);
      }
    });
    this.entries.push(e);
    return obj;
  }

  // move a stroke's tip to segment idx at frac (idx -1 = no partial segment)
  private tip(e: Entry, i: number, idx: number, frac: number): void {
    const t = e.tips[i];
    if (t.applied && t.idx === idx && t.frac === frac) return;
    const line = e.lines[i];
    const a = buf(line);
    const data = (line.geometry.attributes.instanceStart as InterleavedBufferAttribute).data;
    if (t.applied && t.idx >= 0) {
      const o = t.idx * 6 + 3;
      a[o] = t.saved[0];
      a[o + 1] = t.saved[1];
      a[o + 2] = t.saved[2];
      if (!e.dynamic) data.addUpdateRange(o, 3);
    }
    if (idx >= 0) {
      const o = idx * 6;
      t.saved[0] = a[o + 3];
      t.saved[1] = a[o + 4];
      t.saved[2] = a[o + 5];
      a[o + 3] = a[o] + (t.saved[0] - a[o]) * frac;
      a[o + 4] = a[o + 1] + (t.saved[1] - a[o + 1]) * frac;
      a[o + 5] = a[o + 2] + (t.saved[2] - a[o + 2]) * frac;
      if (!e.dynamic) data.addUpdateRange(o + 3, 3);
    }
    // dynamic strokes are re-uploaded whole by their setter's touch(); a range here would
    // clip that full upload down to this one segment
    data.needsUpdate = true;
    t.idx = idx;
    t.frac = frac;
    t.applied = true;
  }

  /** A setter just rewrote the dynamic buffers with true positions: re-cut the tips. */
  retouch(): void {
    for (const e of this.entries) {
      if (!e.dynamic) continue;
      for (let i = 0; i < e.tips.length; i++) {
        const t = e.tips[i];
        t.applied = false; // the buffer holds the true end now; nothing to restore
        this.tip(e, i, t.idx, t.frac);
      }
    }
  }

  /** Lay objects one after another across [t0, t1], each getting time by its stroke count. */
  seq(objs: THREE.Object3D[], t0 = 0, t1 = 1): void {
    const counts = objs.map((o) => {
      let n = 0;
      o.traverse((c) => {
        if (isLine(c)) n += segCount(c);
      });
      return Math.max(n, 1);
    });
    const sum = counts.reduce((a, b) => a + b, 0);
    let t = t0;
    objs.forEach((o, i) => {
      const dt = ((t1 - t0) * counts[i]) / sum;
      this.at(o, t, t + dt);
      t += dt;
    });
  }

  reveal(p: number): void {
    for (const e of this.entries) {
      const q = e.t1 > e.t0 ? (p - e.t0) / (e.t1 - e.t0) : p >= e.t0 ? 1 : 0;
      const k = Math.min(1, Math.max(0, q)) * e.total;
      for (let i = 0; i < e.lines.length; i++) {
        const c = e.counts[i];
        const d = Math.min(c, Math.max(0, k - e.starts[i])); // segments drawn, fractional
        let full = Math.floor(d + 1e-6);
        let frac = d - full;
        if (full >= c) {
          full = c;
          frac = 0;
        }
        const partial = frac > 1e-4;
        this.tip(e, i, partial ? full : -1, partial ? frac : 0);
        const n = full + (partial ? 1 : 0);
        e.lines[i].geometry.instanceCount = n;
        e.lines[i].visible = n > 0;
      }
      const f = smooth((q - FILL_A) / (FILL_B - FILL_A));
      for (let i = 0; i < e.solids.length; i++) {
        e.mats[i].opacity = f;
        e.solids[i].visible = f > 0;
      }
    }
  }
}

/** Dispose every geometry under root, the pen's fade clones, and any materials this prop
 * owns (never pencil's shared ones). */
export function disposeTree(root: THREE.Object3D, own: THREE.Material[] = []): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    (mesh.geometry as THREE.BufferGeometry | undefined)?.dispose();
    const m = mesh.material as THREE.Material | undefined;
    if (m && !Array.isArray(m) && m.userData?.penClone) m.dispose();
  });
  for (const m of own) m.dispose();
}

/** Flat paper (unlit) for sheets whose normals a setter would have to recompute every frame. */
export function flatPaper(): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({
    color: paper,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  m.userData.role = 'fill';
  return m;
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
