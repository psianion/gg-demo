// MOCK — Ground card. Art bible §11.2 row 1, §11.5 C1/C2/C3. Author group A.
//
//   http://localhost:5180/?mock=ground            beside the actual hero island
//   http://localhost:5180/?mock=ground&rig=prep   the drawn half (curtain = 1)
//
// WHAT THIS ROW HAS TO PROVE, and it is the whole of C1: this island is not a
// *translation* of the hero's — it is the same three functions called with a smaller
// argument. rz 1.55 → SKIRT_D = 0.680, k = 0.861, so every profile point, every
// roughen amp and every mark height here is the hero's own number × 0.861. Set rz to
// 1.8 and the geometry is byte-identical to what ships.
//
// The card carries the film's ONE ground painting (bakeGroundSheet, 1024² tiling at
// 4 world units = 256 texels/unit) and nothing else: no path, no ruts, no contact
// blobs. Those live on the incident card, which is row 2 and its own module — the
// two-card construction is the one structural departure from the hero and it is made
// for a measured reason (a 36-unit ribbon at the hero's 394 texels/unit would need a
// 14,000² canvas).
import * as THREE from 'three';
import { buildGroundCard } from './groundKit.ts';

const RX = 2.2;
const RZ = 1.55;

export function buildMock(): THREE.Object3D {
  // The rim's unfinished span: 286°→74° (148°, well past C2's ≥45° minimum) on the
  // far side, so the drawn arc faces the lens and the gap is what you find when you
  // look for where the hand stopped.
  return buildGroundCard(RX, RZ, { gap: [286, 74] }).root;
}
