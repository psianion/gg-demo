import * as THREE from 'three';
import { type Art, Pen, raw, rng, disposeTree } from './draw.ts';

// A faint dashed threat ring on the ground, radius r. Dashes vary a little in length and
// radius (a hand going round with a pencil); they draw on clockwise from the front.
// setPulse(t) breathes it — a pure function of t (seconds), so scrub-safe.
export interface Ring extends Art {
  setPulse(t: number): void;
}

export function buildThreatRing(r: number): Ring {
  const rand = rng(Math.round(r * 997) + 5);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const dashes = Math.max(10, Math.round((Math.PI * 2 * r) / 0.09));
  const sub = 3; // segments per dash, so a dash bends with the circle
  const pos = new Float32Array(dashes * sub * 6);
  let o = 0;
  for (let i = 0; i < dashes; i++) {
    const a0 = Math.PI / 2 + (i / dashes) * Math.PI * 2;
    const len = ((Math.PI * 2) / dashes) * (0.45 + rand() * 0.2);
    const rr = r * (1 + (rand() - 0.5) * 0.03);
    for (let k = 0; k < sub; k++) {
      const p = a0 + (len * k) / sub;
      const q = a0 + (len * (k + 1)) / sub;
      pos.set([Math.cos(p) * rr, 0, Math.sin(p) * rr, Math.cos(q) * rr, 0, Math.sin(q) * rr], o);
      o += 6;
    }
  }
  const line = raw(pos, 'faint');
  line.position.y = 0.006;
  body.add(line);

  const pen = new Pen();
  pen.at(line, 0, 1);
  pen.reveal(0);
  return {
    root,
    setPulse: (t) => {
      body.scale.setScalar(1 + 0.035 * Math.sin(t * Math.PI * 1.2));
      body.rotation.y = t * 0.15; // a slow crawl, so the dashes feel alive
    },
    reveal: (p) => pen.reveal(p),
    dispose: () => disposeTree(root),
  };
}
