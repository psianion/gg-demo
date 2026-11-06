import * as THREE from 'three';
import { polyline, type Weight } from '../hero/film/pencil.ts';

// The artist's props land in src/art/ one file at a time. Everything is picked up by
// glob, so a missing file never breaks the build: until a builder exists the stage
// gets a pencil stand-in with the same shape of API (reveal + any setter as a no-op).

export interface Art {
  root: THREE.Group;
  reveal(p: number): void;
  dispose(): void;
}

type AnyFn = (...a: never[]) => unknown;
const mods = import.meta.glob('../art/*.ts', { eager: true }) as Record<string, Record<string, unknown>>;
const builders: Record<string, AnyFn> = {};
for (const [path, m] of Object.entries(mods)) {
  if (path.endsWith('/index.ts')) continue;
  for (const [k, v] of Object.entries(m)) if (typeof v === 'function' && k.startsWith('build')) builders[k] = v as AnyFn;
}

export const hasArt = (name: string) => name in builders;

/** Call the artist's builder by name, or fall back to a stand-in of the given footprint. */
export function art<T extends Art>(name: string, args: unknown[], fallback: () => Art): T {
  const b = builders[name];
  if (b) {
    try {
      return (b as unknown as (...a: unknown[]) => T)(...args);
    } catch (e) {
      console.warn(`[art] ${name} threw, using stand-in`, e);
    }
  }
  return withNoopSetters(fallback()) as T;
}

/** Any setter the stage calls on a stand-in quietly does nothing. */
function withNoopSetters(a: Art): Art {
  return new Proxy(a, {
    get(t, k) {
      if (k in t) return (t as unknown as Record<string | symbol, unknown>)[k];
      return () => {};
    },
  });
}

/** Draw-on for any group of pencil strokes: reveal(p) writes strokes on in order. */
export function revealer(root: THREE.Object3D): (p: number) => void {
  const lines: { g: THREE.InstancedBufferGeometry; n: number }[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    if (!m.isLineSegments2) return;
    const g = m.geometry as THREE.InstancedBufferGeometry;
    const n = (g.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute | undefined)?.count ?? 0;
    if (n) lines.push({ g, n });
  });
  const fills: THREE.Mesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    if (m.isMesh && !m.isLineSegments2) fills.push(m);
  });
  const N = lines.length;
  return (p: number) => {
    for (let i = 0; i < N; i++) {
      const local = Math.min(1, Math.max(0, p * N - i));
      lines[i].g.instanceCount = local >= 1 ? Infinity : Math.floor(local * lines[i].n);
    }
    for (const f of fills) f.visible = p > 0.35;
  };
}

/** A pencil box outline the size of the prop — "this goes here". */
export function boxStandIn(w: number, h: number, d: number, wt: Weight = 'form'): Art {
  const root = new THREE.Group();
  const x = w / 2;
  const z = d / 2;
  const V = (a: number, b: number, c: number) => new THREE.Vector3(a, b, c);
  root.add(polyline([V(-x, 0, -z), V(x, 0, -z), V(x, 0, z), V(-x, 0, z)], wt, true));
  root.add(polyline([V(-x, h, -z), V(x, h, -z), V(x, h, z), V(-x, h, z)], wt, true));
  for (const [a, c] of [[-x, -z], [x, -z], [x, z], [-x, z]]) root.add(polyline([V(a, 0, c), V(a, h, c)], wt));
  const reveal = revealer(root);
  reveal(0);
  return { root, reveal, dispose: () => {} };
}

export function discStandIn(r: number, h: number, color?: number): Art {
  const root = new THREE.Group();
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r));
  }
  root.add(polyline(pts, 'form', true));
  const fill = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h, 24),
    new THREE.MeshBasicMaterial({ color: color ?? 0xf7f5f0 }),
  );
  fill.position.y = h / 2;
  root.add(fill);
  const reveal = revealer(root);
  reveal(0);
  return { root, reveal, dispose: () => {} };
}
