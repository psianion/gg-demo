import * as THREE from 'three';
import { polyline, curveLine, roughen, fillMaterial } from '../hero/film/pencil.ts';
import { type Art, Pen, raw, buf, touch, rng, disposeTree, basis, viewArc, v3, clamp01 } from './draw.ts';

// ---- cloud ----------------------------------------------------------------
// A heap of paper puffs, each outlined in the view plane (the hero's contourArc trick):
// the circle that IS the puff's silhouette from the shot. Depth sorts the overlaps, so a
// near puff's line crosses the far one and the far one's line hides behind it — the
// way a cloud is drawn. ~2.6 wide, 1.4 tall; origin under its flat belly.

export interface Cloud extends Art {
  setSquash(s: number): void; // 0 = at rest, 1 = squeezed (the shake that drops snow)
}

const PUFFS: [number, number, number, number][] = [
  // x, y, z, r
  [-1.0, 0.42, 0.05, 0.4],
  [-0.45, 0.62, 0.1, 0.52],
  [0.2, 0.7, -0.05, 0.6],
  [0.85, 0.5, 0.05, 0.44],
  [0.35, 0.42, 0.42, 0.4],
  [-0.35, 0.4, -0.42, 0.4],
  [0.55, 0.4, -0.45, 0.38],
];

export function buildCloud(view?: THREE.Vector3): Cloud {
  const b = basis(view);
  const rand = rng(77);
  const root = new THREE.Group();
  const body = new THREE.Group(); // squashes about the belly
  root.add(body);

  const fills: THREE.Object3D[] = [];
  const outlines: THREE.Object3D[] = [];
  const order = PUFFS.map((p, i) => ({ p, i, sx: p[0] * b.right.x + p[2] * b.right.z }))
    .sort((a, c) => a.sx - c.sx);
  for (const { p, i } of order) {
    const [x, y, z, r] = p;
    const m = new THREE.Mesh(roughen(new THREE.SphereGeometry(r, 16, 12), r * 0.04, 2.2, i + 3), fillMaterial);
    m.position.set(x, y, z);
    fills.push(m);
    body.add(m);
    // upper three quarters of the silhouette; the belly is one shared stroke below
    // pushed toward the lens (the hero's contourArc push) so it wins depth against its own puff
    const arc = polyline(viewArc(v3(x, y, z).addScaledVector(b.view, r * 0.5), r * 1.02, r * 1.02, -0.2 * Math.PI, 1.2 * Math.PI, b, 22, rand), 'form');
    outlines.push(arc);
    body.add(arc);
  }
  // the flat belly: a long, slightly bowed stroke across the bottom, in the view plane
  const belly = curveLine(
    [-1.35, -0.4, 0.4, 1.25].map((s, i) =>
      v3(0, 0.12 + (i % 2) * 0.03, 0).addScaledVector(b.right, s).addScaledVector(b.view, 0.5),
    ),
    'form',
    16,
  );
  // a few curls inside the big puffs — detail, drawn last
  const curls = new THREE.Group();
  for (const [x, y, z, r] of [PUFFS[1], PUFFS[2], PUFFS[3]]) {
    const c = v3(x, y, z).addScaledVector(b.view, r * 0.9);
    curls.add(polyline(viewArc(c, r * 0.45, r * 0.4, 0.15 * Math.PI, 0.75 * Math.PI, b, 8, rand), 'faint'));
  }
  body.add(belly, curls);

  const pen = new Pen();
  for (const f of fills) pen.at(f, 0, 0.6);
  pen.seq(outlines, 0, 0.75);
  pen.at(belly, 0.7, 0.85);
  pen.at(curls, 0.82, 1);

  function setSquash(s: number) {
    const q = clamp01(s);
    body.scale.set(1 + 0.12 * q, 1 - 0.22 * q, 1 + 0.12 * q);
  }

  pen.reveal(0);
  return { root, setSquash, reveal: (p) => pen.reveal(p), dispose: () => disposeTree(root) };
}

// ---- precipitation --------------------------------------------------------
// Short pencil marks falling over an ellipse w×d (the island), from height h to 0. Every
// drop's position is a pure function of t; setAmount thins by drawing fewer drops
// (they're pre-shuffled, so thinning is even). reveal(p) scales the amount too.

export interface Weather extends Art {
  setTime(t: number): void; // seconds
  setAmount(a: number): void; // 0..1
}

type Drop = { x: number; z: number; phase: number; speed: number };

function scatter(n: number, w: number, d: number, seed: number, v0: number, v1: number): Drop[] {
  const rand = rng(seed);
  const out: Drop[] = [];
  while (out.length < n) {
    const x = rand() * 2 - 1;
    const z = rand() * 2 - 1;
    if (x * x + z * z > 1) continue;
    out.push({ x: (x * w) / 2, z: (z * d) / 2, phase: rand(), speed: v0 + rand() * (v1 - v0) });
  }
  return out;
}

function precipitation(
  drops: Drop[],
  segsPer: number,
  h: number,
  write: (dst: Float32Array, o: number, d: Drop, y: number, t: number) => void,
): Weather {
  const root = new THREE.Group();
  const line = raw(new Float32Array(drops.length * segsPer * 6), 'faint');
  line.frustumCulled = false;
  root.add(line);
  let amount = 1;
  let shown = 0;
  const count = () => {
    const n = Math.round(drops.length * amount * shown) * segsPer;
    line.geometry.instanceCount = n;
    line.visible = n > 0;
  };
  function setTime(t: number) {
    const dst = buf(line);
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      // falling from h to 0, wrapping; the wrap happens at the ground, out of sight of the cloud
      const y = h - ((((d.phase * h + t * d.speed) % h) + h) % h);
      write(dst, i * segsPer * 6, d, y, t);
    }
    touch(line);
  }
  setTime(0);
  count();
  return {
    root,
    setTime,
    setAmount: (a) => {
      amount = clamp01(a);
      count();
    },
    reveal: (p) => {
      shown = clamp01(p);
      count();
    },
    dispose: () => disposeTree(root),
  };
}

export function buildRain(w: number, d: number, h = 2.2): Weather {
  const drops = scatter(Math.round(w * d * 14), w, d, 91, 3.6, 4.6);
  const L = 0.14; // stroke length
  const slant = 0.035; // a little wind
  return precipitation(drops, 1, h, (dst, o, dr, y) => {
    dst[o] = dr.x + slant;
    dst[o + 1] = y + L;
    dst[o + 2] = dr.z;
    dst[o + 3] = dr.x;
    dst[o + 4] = Math.max(0, y);
    dst[o + 5] = dr.z;
  });
}

export function buildSnow(w: number, d: number, h = 2.2): Weather {
  const drops = scatter(Math.round(w * d * 9), w, d, 93, 0.45, 0.75);
  const s = 0.022; // flake half-size: a little drawn x
  return precipitation(drops, 2, h, (dst, o, dr, y, t) => {
    const x = dr.x + Math.sin(t * 1.3 + dr.phase * 6.28) * 0.08;
    const z = dr.z + Math.cos(t * 0.9 + dr.phase * 4.1) * 0.05;
    const yy = Math.max(s, y);
    // no array literal here — this runs per flake per frame
    dst[o] = x - s; dst[o + 1] = yy - s; dst[o + 2] = z;
    dst[o + 3] = x + s; dst[o + 4] = yy + s; dst[o + 5] = z;
    dst[o + 6] = x - s; dst[o + 7] = yy + s; dst[o + 8] = z;
    dst[o + 9] = x + s; dst[o + 10] = yy - s; dst[o + 11] = z;
  });
}
