import * as THREE from 'three';
import { polyline, curveLine, fillMaterial, paint } from '../hero/film/pencil.ts';
import { type Art, ACCENT, Pen, rng, disposeTree, basis, ring, v3 } from './draw.ts';

// Two kinds of piece, deliberately unlike each other:
//  - players: chess-like pawns, 0.36 tall (half the goblin), orange base. Each has its
//    own head so four tokens read as four people.
//  - monsters: flat "pog" counters, 0.42 across, with the creature drawn on the face —
//    readable from ¾ top-down at any yaw, which a standee is not.
// setFacing turns whatever says "front": the pawn's face notch, the pog's drawing + rim arrow.

export interface Token extends Art {
  setFacing(rad: number): void;
}

export type MonsterKind = 'goblin' | 'wolf' | 'skeleton' | 'slime' | 'bat' | 'ogre';
export const MONSTER_SETS: MonsterKind[][] = [
  ['goblin', 'wolf', 'skeleton'],
  ['slime', 'bat', 'ogre'],
];

// ---- players --------------------------------------------------------------
// lathe profile (radius, height) — base disc, waist, shoulders, neck
const PROFILE: [number, number][] = [
  [0.0, 0.0], [0.16, 0.0], [0.16, 0.045], [0.12, 0.06], [0.07, 0.1],
  [0.055, 0.17], [0.075, 0.2], [0.05, 0.215], [0.0, 0.215],
];
const HEAD_Y = 0.27;
const HEAD_R = 0.06;

export function buildPlayerToken(i: number, view?: THREE.Vector3): Token {
  const b = basis(view);
  const rand = rng(200 + i);
  const root = new THREE.Group();

  // solids: lathe body + head, paper; the base disc painted orange
  const lathe = new THREE.Mesh(
    new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 20),
    fillMaterial,
  );
  const base = paint(
    new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.044, 24).translate(0, 0.022, 0), fillMaterial),
    { fill: ACCENT.orange },
  );
  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 14, 10), fillMaterial);
  head.position.y = HEAD_Y;

  // outline: rings (view-independent) + the two side profiles in the view plane
  const rings = new THREE.Group();
  rings.add(
    polyline(ring(0.16, 0.16, 0.0, 26, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(0.16, 0.16, 0.045, 26, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(0.075, 0.075, 0.2, 16, 0, Math.PI * 2, rand), 'faint'),
  );
  const sides = new THREE.Group();
  for (const s of [-1, 1]) {
    const pts = PROFILE.slice(2, 8).map(([r, y]) => v3(0, y, 0).addScaledVector(b.right, s * r * 1.04));
    sides.add(curveLine(pts, 'form', 10));
  }
  const headLine = polyline(
    ring(HEAD_R * 1.06, HEAD_R * 1.06, 0, 18).map((p) =>
      v3(0, HEAD_Y, 0).addScaledVector(b.right, p.x).addScaledVector(b.up, p.z),
    ),
    'form',
  );

  // what makes this one this player — a hat, a crest, a hood tail, a crown
  const topper = new THREE.Group();
  const top = HEAD_Y + HEAD_R;
  if (i % 4 === 0) {
    // pointed hat with a brim
    topper.add(
      polyline(ring(0.085, 0.085, top - 0.02, 18), 'form'),
      polyline([v3(-0.06, top - 0.02, 0), v3(0.01, top + 0.13, 0.01), v3(0.06, top - 0.02, 0)], 'form'),
    );
  } else if (i % 4 === 1) {
    // helmet crest: a fin over the crown, front to back
    topper.add(curveLine([v3(0, top - 0.01, 0.05), v3(0, top + 0.05, 0), v3(0, top + 0.02, -0.07)], 'form', 8));
  } else if (i % 4 === 2) {
    // hood with a tail hanging down the back
    topper.add(
      polyline(ring(HEAD_R * 1.15, HEAD_R * 1.15, HEAD_Y + 0.01, 14, Math.PI, Math.PI * 2), 'faint'),
      curveLine([v3(0, top, -0.02), v3(0, top - 0.04, -0.09), v3(0.01, HEAD_Y - 0.06, -0.1)], 'form', 8),
    );
  } else {
    // a three-point crown
    const cp: THREE.Vector3[] = [];
    for (let k = 0; k <= 6; k++) {
      const a = Math.PI * 0.15 + (k / 6) * Math.PI * 0.7;
      const y = top - 0.015 + (k % 2 === 1 ? 0.045 : 0);
      cp.push(v3(0, y, 0).addScaledVector(b.right, Math.cos(a) * HEAD_R * 1.1));
    }
    topper.add(polyline(cp, 'form'));
  }

  // facing: a notch on the base rim and two eye ticks on the head, both on +z
  const facing = new THREE.Group();
  facing.add(
    polyline([v3(-0.035, 0.047, 0.15), v3(0, 0.047, 0.19), v3(0.035, 0.047, 0.15)], 'form'),
    polyline([v3(-0.02, HEAD_Y + 0.01, HEAD_R * 0.98), v3(-0.02, HEAD_Y - 0.008, HEAD_R * 0.98)], 'faint'),
    polyline([v3(0.02, HEAD_Y + 0.01, HEAD_R * 0.98), v3(0.02, HEAD_Y - 0.008, HEAD_R * 0.98)], 'faint'),
  );
  // the hood/crest/hat are symmetric enough about y except the crest & tail — they face too
  facing.add(topper);

  root.add(lathe, base, head, rings, sides, headLine, facing);

  const pen = new Pen();
  pen.at(base, 0, 0.3);
  pen.at(lathe, 0.2, 0.5);
  pen.at(head, 0.45, 0.6);
  pen.seq([rings, sides, headLine], 0, 0.75);
  pen.at(facing, 0.75, 1);

  pen.reveal(0);
  return {
    root,
    setFacing: (rad) => {
      facing.rotation.y = rad;
    },
    reveal: (p) => pen.reveal(p),
    dispose: () => disposeTree(root),
  };
}

// ---- monsters -------------------------------------------------------------
// Portraits are drawn in a 2D face space (x right, y "up" = toward the token's front,
// unit = token radius) and laid onto the pog's top.
type Stroke = [number, number][];
const circle = (cx: number, cy: number, r: number, n = 12, a0 = 0, a1 = Math.PI * 2): Stroke =>
  Array.from({ length: n + 1 }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

const PORTRAIT: Record<MonsterKind, { lines: Stroke[]; smooth?: boolean[]; r: number }> = {
  goblin: {
    r: 0.21,
    lines: [
      // head with two big ears
      [[-0.32, 0.12], [-0.75, 0.38], [-0.38, -0.08], [-0.3, -0.35], [0, -0.5], [0.3, -0.35], [0.38, -0.08], [0.75, 0.38], [0.32, 0.12], [0.2, 0.32], [0, 0.38], [-0.2, 0.32], [-0.32, 0.12]],
      circle(-0.14, -0.02, 0.06, 6),
      circle(0.14, -0.02, 0.06, 6),
      [[-0.16, -0.28], [-0.06, -0.24], [0, -0.3], [0.06, -0.24], [0.16, -0.28]],
    ],
  },
  wolf: {
    r: 0.21,
    lines: [
      [[-0.28, -0.05], [-0.42, 0.5], [-0.12, 0.25], [0.12, 0.25], [0.42, 0.5], [0.28, -0.05], [0.12, -0.32], [0, -0.6], [-0.12, -0.32], [-0.28, -0.05]],
      [[-0.18, 0.02], [-0.06, -0.02]],
      [[0.18, 0.02], [0.06, -0.02]],
      circle(0, -0.5, 0.05, 6),
    ],
  },
  skeleton: {
    r: 0.21,
    lines: [
      [[-0.38, 0.05], [-0.36, 0.32], [-0.18, 0.48], [0.18, 0.48], [0.36, 0.32], [0.38, 0.05], [0.24, -0.12], [0.22, -0.36], [-0.22, -0.36], [-0.24, -0.12], [-0.38, 0.05]],
      circle(-0.15, 0.06, 0.1, 8),
      circle(0.15, 0.06, 0.1, 8),
      [[0, -0.06], [-0.05, -0.15], [0.05, -0.15], [0, -0.06]],
      [[-0.12, -0.36], [-0.12, -0.26]],
      [[0, -0.36], [0, -0.26]],
      [[0.12, -0.36], [0.12, -0.26]],
    ],
  },
  slime: {
    r: 0.21,
    lines: [
      [[-0.55, -0.35], [-0.5, 0.0], [-0.3, 0.32], [0, 0.42], [0.3, 0.32], [0.5, 0.0], [0.55, -0.35], [0.3, -0.3], [0.2, -0.45], [0.05, -0.32], [-0.15, -0.42], [-0.3, -0.3], [-0.55, -0.35]],
      circle(-0.14, 0.08, 0.06, 6),
      circle(0.14, 0.08, 0.06, 6),
      circle(0.25, 0.25, 0.04, 5, 0.5, 2.5),
    ],
  },
  bat: {
    r: 0.21,
    lines: [
      [[-0.15, 0.05], [-0.45, 0.3], [-0.75, 0.2], [-0.65, 0.02], [-0.55, -0.12], [-0.38, -0.05], [-0.25, -0.2], [-0.12, -0.1], [0, -0.25], [0.12, -0.1], [0.25, -0.2], [0.38, -0.05], [0.55, -0.12], [0.65, 0.02], [0.75, 0.2], [0.45, 0.3], [0.15, 0.05]],
      [[-0.15, 0.05], [-0.12, 0.25], [-0.05, 0.15], [0.05, 0.15], [0.12, 0.25], [0.15, 0.05]],
      [[-0.08, 0.06], [-0.04, 0.04]],
      [[0.08, 0.06], [0.04, 0.04]],
    ],
  },
  ogre: {
    r: 0.25,
    lines: [
      [[-0.45, 0.2], [-0.4, 0.42], [-0.15, 0.5], [0.15, 0.5], [0.4, 0.42], [0.45, 0.2], [0.42, -0.25], [0.2, -0.5], [-0.2, -0.5], [-0.42, -0.25], [-0.45, 0.2]],
      [[-0.3, 0.12], [-0.08, 0.05]],
      [[0.3, 0.12], [0.08, 0.05]],
      circle(-0.16, -0.02, 0.04, 5),
      circle(0.16, -0.02, 0.04, 5),
      [[-0.25, -0.28], [0.25, -0.28]],
      [[-0.18, -0.28], [-0.15, -0.16]],
      [[0.18, -0.28], [0.15, -0.16]],
    ],
  },
};

export function buildMonsterToken(kind: MonsterKind): Token {
  const { r, lines } = PORTRAIT[kind];
  const h = 0.05;
  const rand = rng(300 + kind.length * 17 + kind.charCodeAt(0));
  const root = new THREE.Group();
  const pog = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28).translate(0, h / 2, 0), fillMaterial);
  const rims = new THREE.Group();
  rims.add(
    polyline(ring(r, r, 0, 30, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(r, r, h, 30, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(r * 0.82, r * 0.82, h + 0.002, 26, 0, Math.PI * 2, rand), 'faint'),
  );

  const face = new THREE.Group(); // portrait + arrow, turns with setFacing
  const s = r * 0.8;
  // face space: x → +x, y → +z (front), on the top at h
  const lay = (st: Stroke) => st.map(([x, y]) => v3(x * s, h + 0.003, -y * s));
  for (const st of lines) face.add(polyline(lay(st), 'form'));
  // facing arrow on the rim at +z, the chin side. At rad 0 the portrait reads upright
  // from a camera on +z (top of head away, chin near) and the creature faces the lens.
  face.add(polyline([v3(-0.04, h + 0.003, r * 0.86), v3(0, h + 0.003, r * 1.08), v3(0.04, h + 0.003, r * 0.86)], 'form'));
  root.add(pog, rims, face);

  const pen = new Pen();
  pen.at(pog, 0, 0.3);
  pen.at(rims, 0, 0.4);
  pen.at(face, 0.4, 1);
  pen.reveal(0);
  return {
    root,
    setFacing: (rad) => {
      face.rotation.y = rad;
    },
    reveal: (p) => pen.reveal(p),
    dispose: () => disposeTree(root),
  };
}
