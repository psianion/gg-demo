import * as THREE from 'three';
import { polyline, roughen, fillMaterial } from '../hero/film/pencil.ts';
import { type Art, Pen, rng, disposeTree, v3, clamp01 } from './draw.ts';

// A lump of snow for the top of a post or a crown, w across. A low paper dome with a
// scalloped rim and a few drips hanging over the edge; setAmount grows it from nothing.
export interface SnowCap extends Art {
  setAmount(a: number): void;
}

export function buildSnowCap(w: number): SnowCap {
  const r = w / 2;
  const rand = rng(Math.round(w * 1000) + 7);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const dome = new THREE.Mesh(
    roughen(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), r * 0.06, 6 / w, 3),
    fillMaterial,
  );
  dome.scale.y = 0.38;

  // the rim: a wavy ring with drips pulled down out of it every so often
  const pts: THREE.Vector3[] = [];
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const drip = i % 7 === 3 ? 0.18 + rand() * 0.12 : 0;
    const rr = r * (1.03 + (rand() - 0.5) * 0.06);
    pts.push(v3(Math.cos(a) * rr, (-drip + (rand() - 0.5) * 0.04) * r, Math.sin(a) * rr));
  }
  const rim = polyline(pts, 'form');
  // two lumps across the top so it reads as a soft heap from above
  const lumps = new THREE.Group();
  for (const [a0, rr] of [[0.3, 0.55], [2.6, 0.4]] as const) {
    const lp: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (i / 8) * 1.6;
      lp.push(v3(Math.cos(a) * r * rr, r * 0.38 * Math.sqrt(1 - rr * rr) + 0.004, Math.sin(a) * r * rr));
    }
    lumps.add(polyline(lp, 'faint'));
  }
  body.add(dome, rim, lumps);

  const pen = new Pen();
  pen.at(dome, 0, 0.6);
  pen.at(rim, 0, 0.7);
  pen.at(lumps, 0.65, 1);

  function setAmount(a: number) {
    const q = clamp01(a);
    body.visible = q > 0.001;
    body.scale.set(0.7 + 0.3 * q, q, 0.7 + 0.3 * q);
  }
  setAmount(1);
  pen.reveal(0);
  return { root, setAmount, reveal: (p) => pen.reveal(p), dispose: () => disposeTree(root) };
}
