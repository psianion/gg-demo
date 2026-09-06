// MOCK — Incident card. Art bible §11.2 row 2, §11.5 C8 (wear) and C9 (contact).
//
//   http://localhost:5180/?mock=incident
//   http://localhost:5180/?mock=incident&rig=prep
//
// The incident card is a LAYER, not an object: the ground circle at 0.985 scale,
// +0.006 y, `ground: false` so the page grid prints once, and transparent everywhere
// it is not painted. So this mock builds the ground card underneath it — judging an
// incident card alone would be judging a decal in mid-air, and the stack is the point.
//
// FIVE THINGS MAY GO ON THIS CARD AND NOTHING ELSE — the path ribbon, the two cart
// ruts, the rubbed landing patch, the painted contact blobs, one repair patch. If a
// mark is not traffic, contact or repair it belongs to the sheet or to geometry. That
// closed list is what stops the incident card becoming a second ground painting.
import * as THREE from 'three';
import { buildGroundCard, buildIncidentCard } from './groundKit.ts';

const RX = 2.2;
const RZ = 1.55;

export function buildMock(): THREE.Object3D {
  const g = buildGroundCard(RX, RZ, { gap: [286, 74] });
  g.root.add(
    buildIncidentCard(RX, RZ, {
      // the hero's own spine, a gentle S left to right
      spine: (x) => 0.13 + 0.3 * Math.sin((x - 0.4) * 0.85),
      // the C9 ledger at the hero's 394 texels/unit; bakeIncidentCard rescales by this
      // card's own texels/unit. Painted props ground — drawings never do.
      blobs: [
        [-0.95, -0.86, 58, 0.26], // an oak
        [-1.48, 0.62, 50, 0.26], // a pine
        [0.62, -0.5, 40, 0.28], // a signpost
        [0.34, 0.24, 26, 0.24], // a rock
        [1.28, 0.46, 24, 0.4], // and him
      ],
    }),
  );
  return g.root;
}
