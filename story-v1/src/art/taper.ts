import * as THREE from 'three';
import { curveLine, polyline, plate, paint } from '../hero/film/pencil.ts';
import { type Art, ACCENT, Pen, disposeTree, v3, ring } from './draw.ts';

// The lighting stick. At the goblin's 0.75 height a taper is a pencil-thin stroke, so
// it IS a stroke: a slightly bowed stem, a wax-dipped head (three wraps) and a wick.
// Origin at the butt end; `tip` is where the flame sits, for whoever lights things.
const LEN = 0.46;

export interface Taper extends Art {
  setLit(l: number): void;
  tip: THREE.Vector3;
}

function flameShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.03, 0, 0.034, 0.03, 0.018, 0.06);
  s.bezierCurveTo(0.01, 0.075, 0.004, 0.09, 0, 0.1);
  s.bezierCurveTo(-0.006, 0.085, -0.016, 0.072, -0.022, 0.056);
  s.bezierCurveTo(-0.034, 0.028, -0.026, 0, 0, 0);
  return s;
}

export function buildTaper(): Taper {
  const root = new THREE.Group();
  const stem = curveLine([v3(0, 0, 0), v3(0.006, LEN * 0.5, 0.003), v3(0, LEN, 0)], 'form', 10);
  const wax = new THREE.Group();
  for (let i = 0; i < 3; i++) wax.add(polyline(ring(0.012, 0.012, LEN - 0.02 - i * 0.022, 8), 'faint'));
  const wick = polyline([v3(0, LEN, 0), v3(0.004, LEN + 0.018, 0.002), v3(-0.002, LEN + 0.03, 0)], 'faint');
  root.add(stem, wax, wick);

  // flame: two crossed cut-paper plates so it reads from any yaw. Not part of the
  // reveal — setLit owns it entirely.
  const flame = new THREE.Group();
  for (const ry of [0, Math.PI / 2]) {
    const f = paint(plate(flameShape(), 'faint', 8), { fill: ACCENT.glow, line: ACCENT.flame });
    f.rotation.y = ry;
    flame.add(f);
  }
  const tip = v3(0, LEN + 0.02, 0);
  flame.position.copy(tip);
  flame.visible = false;
  root.add(flame);

  const pen = new Pen();
  pen.seq([stem, wax, wick]);

  function setLit(l: number) {
    flame.visible = l > 0.001;
    // grows from the wick, a touch taller than wide as it catches
    flame.scale.set(l, l * (0.6 + 0.4 * l), l);
  }

  pen.reveal(0);
  return { root, tip, setLit, reveal: (p) => pen.reveal(p), dispose: () => disposeTree(root) };
}
