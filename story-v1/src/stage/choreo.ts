import { prepare, type Key, type Span, type Track } from './actor';
import { pathZ } from '../hero/film/stages/hero.ts';
import type { ActionKind } from './state';

// Where things are on the island (hero units, x right-on-island = screen-LEFT, the
// camera sits on −z). One table so props and the goblin agree.
export const SPOT = {
  home: { x: 0.95, z: pathZ(0.95) },
  ropeLip: { x: 0.42, z: -1.74 }, // where the hanging rope goes over the near rim
  haul: { x: 0.5, z: -1.3 },
  tie: { x: 0.1, z: -0.98 },
  signpost: { x: -0.15, z: -0.9 },
  centre: { x: 0.25, z: -0.32 },
  lanternBase: { x: -1.5, z: -1.02 },
  lantern: { x: -1.7, z: -1.18 },
  farEdge: { x: 0.25, z: 1.6 },
  offFar: { x: 0.25, z: 2.12 },
  cloudPark: { x: 0.2, z: 0.25 },
  leftEdge: { x: 2.35, z: 0.2 },
  sack: { x: 1.45, z: 0.62 },
  die: { x: 0.35, z: -0.5 },
  sit: { x: -0.55, z: -1.6 },
  campfire: { x: -1.3, z: 0.95 },
};

// the party along the path (right side), the monsters across on the far-left
export const CELL = 0.38;
export const PLAYER_CELLS = [0, 1, 2, 3].map((i) => {
  const x = -1.95 + i * CELL;
  return { x, z: pathZ(x) + 0.32 };
});
// the leader (token 3, nearest the fog) walks 3 cells along the path toward the monsters
export const LEADER = 3;
export const ACTIVE_PATH = [1, 2, 3].map((k) => {
  const px = PLAYER_CELLS[LEADER].x + k * CELL;
  return { x: px, z: pathZ(px) + 0.12 };
});
export const MONSTER_CELLS = [0, 1, 2].map((i) => ({ x: 0.85 + i * 0.42, z: 0.95 - i * 0.12 }));
export const FOG = { x: 0.35, z: 0.25, w: 1.5, d: 1.25 };
export const PICKUP = [0, 1, 2, 3].map((i) => ({ x: -0.55 + i * 0.28, z: -1.5 }));

const R = Math.PI;
const FACE_CAM = R; // heading toward −z: toward the lens
const FACE_RAIL = -2.3; // three-quarter toward the rail (screen right, −x)

const K = (t: number, s: { x: number; z: number }, extra: Partial<Key> = {}): Key => ({ t, x: s.x, z: s.z, ...extra });
const off = (s: { x: number; z: number }, dx: number, dz: number) => ({ x: s.x + dx, z: s.z + dz });

// ---- the scroll track ---------------------------------------------------------------
const keys: Key[] = [
  K(0, SPOT.home, { face: 1.6 }),
  K(0.06, SPOT.home, { face: 1.6 }),
  // Beat 1 — the rope, the haul, the tie, the dust-off
  K(0.4, SPOT.haul, { face: R }),
  K(1.1, off(SPOT.haul, 0.03, 0.12), { face: R }),
  K(1.42, SPOT.tie, { face: -1.75 }),
  K(1.8, SPOT.tie, { face: -1.75 }),
  K(2.05, SPOT.centre, { face: FACE_RAIL }),
  // Beat 2 — light: walk with the taper, climb, light, slide down, come back
  K(2.12, SPOT.centre, { face: FACE_RAIL }),
  K(2.5, SPOT.lanternBase, { face: -2.2 }),
  K(2.56, SPOT.lanternBase, { face: -2.2 }),
  K(2.86, off(SPOT.lanternBase, -0.06, -0.04), { y: 0.36, face: -2.2 }),
  K(3.14, off(SPOT.lanternBase, -0.06, -0.04), { y: 0.36, face: -2.2 }),
  K(3.3, SPOT.lanternBase, { face: -2.2 }),
  // …then, back on the ground, he blows it out: day again by 4
  K(3.5, off(SPOT.lanternBase, 0.15, 0.25), { face: -2.4 }),
  K(3.86, off(SPOT.lanternBase, 0.15, 0.25), { face: -2.4 }),
  K(4.02, SPOT.centre, { face: FACE_RAIL }),
  // weather — off the far edge, back with the cloud on a rope, park it
  K(4.05, SPOT.centre, { face: FACE_RAIL }),
  K(4.3, SPOT.farEdge, { face: 0 }),
  K(4.42, SPOT.offFar, { y: -0.75, face: 0 }),
  K(4.55, SPOT.offFar, { y: -0.75, face: R }),
  K(4.7, SPOT.farEdge, { face: 0 }),
  K(4.95, off(SPOT.cloudPark, 0, -0.35), { face: 0 }),
  // it rains; then he shoos the cloud off — clear again by 6
  K(5.38, off(SPOT.cloudPark, 0, -0.35), { face: 0 }),
  K(5.68, off(SPOT.cloudPark, 0, -0.35), { face: 0 }),
  K(5.93, SPOT.centre, { face: FACE_RAIL }),
  // encounters — drag the sack in, tip, line up, nudge
  K(6.05, SPOT.centre, { face: FACE_RAIL }),
  K(6.3, SPOT.leftEdge, { face: 1.6 }),
  K(6.36, SPOT.leftEdge, { face: -1.4 }),
  K(6.66, off(SPOT.sack, 0.2, -0.05), { face: 1.4 }),
  K(6.92, off(SPOT.sack, 0.2, -0.05), { face: 1.4 }),
  K(7.42, off(MONSTER_CELLS[1], 0, -0.32), { face: 0 }),
  K(7.72, off(MONSTER_CELLS[1], 0, -0.32), { face: 0 }),
  K(7.95, SPOT.centre, { face: FACE_RAIL }),
];
const spans: Span[] = [
  { a: 0.08, b: 0.4, pose: 'stand', fade: 0.06 }, // drop the work hunch first
  { a: 0.38, b: 1.12, pose: 'haul', wig: 'hand', fade: 0.06 },
  { a: 1.4, b: 1.64, pose: 'crouch', wig: 'hand', amp: 0.5, fade: 0.05 },
  { a: 1.62, b: 1.82, pose: 'dust', wig: 'clap', fade: 0.04 },
  { a: 2.12, b: 2.58, pose: 'taper', fade: 0.06 },
  { a: 2.54, b: 2.88, pose: 'climb', wig: 'climb', fade: 0.05 },
  { a: 2.84, b: 3.16, pose: 'reach', fade: 0.05 },
  { a: 3.12, b: 3.32, pose: 'hang', fade: 0.04 },
  { a: 3.52, b: 3.86, pose: 'blow', fade: 0.06 },
  { a: 4.42, b: 4.57, pose: 'lift', fade: 0.04 },
  { a: 4.65, b: 5.0, pose: 'haul', wig: 'hand', fade: 0.05 },
  { a: 5.38, b: 5.68, pose: 'shoo', wig: 'wave', fade: 0.06 },
  { a: 6.34, b: 6.68, pose: 'haul', fade: 0.05 },
  { a: 6.64, b: 6.92, pose: 'lift', fade: 0.06 },
  { a: 7.44, b: 7.72, pose: 'kick', fade: 0.07 },
];

// Beat 3 — four tokens carried in, one per half unit
for (let i = 0; i < 4; i++) {
  const s = 8 + i * 0.5;
  const cell = PLAYER_CELLS[i];
  keys.push(
    K(s + 0.06, off(PICKUP[i], 0, 0.12), { face: FACE_CAM }),
    K(s + 0.1, off(PICKUP[i], 0, 0.12), { face: FACE_CAM }),
    K(s + 0.34, off(cell, 0.02, -0.22)),
    K(s + 0.46, off(cell, 0.02, -0.22), { face: 0 }),
  );
  spans.push(
    { a: s + 0.04, b: s + 0.12, pose: 'crouch', fade: 0.03 },
    { a: s + 0.1, b: s + 0.36, pose: 'carry', fade: 0.04 },
    { a: s + 0.33, b: s + 0.46, pose: 'crouch', fade: 0.04 },
  );
}
keys.push(
  // runs ahead and peels back the fog like a bedsheet
  K(10.22, off(SPOT.centre, -0.05, 0.12), { face: 1.4 }),
  K(10.36, { x: FOG.x - FOG.w / 2 + 0.1, z: FOG.z - 0.2 }, { face: 1.2 }),
  K(10.95, { x: FOG.x + FOG.w / 2 + 0.05, z: FOG.z + 0.15 }, { face: 1.3 }),
  K(11.15, { x: FOG.x + FOG.w / 2 + 0.05, z: FOG.z + 0.15 }, { face: -1.9 }),
  K(11.45, off(SPOT.die, 0.55, 0.35), { face: -2.2 }),
  // the dice gag: frozen world, he alone moves
  K(11.72, off(SPOT.die, 0.55, 0.35), { face: -2.2 }),
  K(11.95, off(SPOT.die, 0.06, 0.3), { face: R }),
  K(12.3, off(SPOT.die, 0.06, 0.3), { face: R }),
  K(12.5, off(SPOT.die, 0.3, 0.2), { face: -2.4 }),
  K(12.85, SPOT.sit, { face: FACE_CAM }),
  K(19, SPOT.sit, { face: FACE_CAM }),
);
spans.push(
  { a: 10.3, b: 10.98, pose: 'haul', fade: 0.06 },
  { a: 11.93, b: 12.08, pose: 'look', fade: 0.03 },
  { a: 12.05, b: 12.17, pose: 'shrug', fade: 0.025 },
  { a: 12.15, b: 12.3, pose: 'push', fade: 0.03 },
  { a: 12.8, b: 19, pose: 'sit', fade: 0.08 },
);

export const SCROLL_TRACK = prepare({
  keys,
  spans,
  // look #2 (the hero hover is #1, the card peek is #3): after reading the die
  look: [{ a: 11.98, b: 12.1 }],
});

/** a clicked chip's own scroll segment is held (he already did what you asked) */
export const CHIP_SEGMENT = {
  light: [2.12, 4.02] as const,
  weather: [4.05, 5.93] as const,
  encounters: [6.05, 7.95] as const,
};

// ---- click clips (tau 0→1, built per frame around the live anchor) -----------------
export function clipTrack(kind: ActionKind, ax: number, az: number): Track {
  const A = { x: ax, z: az };
  const keys: Key[] = [];
  const spans: Span[] = [];
  const dashTo = (s: { x: number; z: number }, t0: number, t1: number, face?: number) => {
    keys.push(K(t0, A), K(t1, s, face !== undefined ? { face } : {}));
  };
  const back = (s: { x: number; z: number }, t0: number) => keys.push(K(t0, s), K(1, A));
  switch (kind) {
    case 'lightOn': {
      const b = SPOT.lanternBase;
      dashTo(b, 0, 0.26, -2.2);
      keys.push(K(0.3, b, { face: -2.2 }), K(0.46, off(b, -0.06, -0.04), { y: 0.36, face: -2.2 }));
      keys.push(K(0.64, off(b, -0.06, -0.04), { y: 0.36, face: -2.2 }), K(0.74, b, { face: -2.2 }));
      back(b, 0.78);
      spans.push({ a: 0.02, b: 0.32, pose: 'taper' }, { a: 0.28, b: 0.48, pose: 'climb', wig: 'climb' },
        { a: 0.44, b: 0.66, pose: 'reach' }, { a: 0.62, b: 0.76, pose: 'hang' });
      break;
    }
    case 'lightOff': {
      const b = off(SPOT.lanternBase, 0.15, 0.25);
      dashTo(b, 0, 0.3, -2.4);
      spans.push({ a: 0.28, b: 0.66, pose: 'blow' });
      back(b, 0.68);
      break;
    }
    case 'rain':
    case 'snow': {
      const p = off(SPOT.cloudPark, 0, -0.35);
      dashTo(p, 0, 0.24, 0);
      spans.push(kind === 'rain'
        ? { a: 0.22, b: 0.72, pose: 'haul', wig: 'hand' }
        : { a: 0.22, b: 0.76, pose: 'shake', wig: 'shake' });
      back(p, 0.78);
      break;
    }
    case 'clear': {
      const p = off(SPOT.cloudPark, 0, -0.3);
      dashTo(p, 0, 0.26, 0);
      spans.push({ a: 0.24, b: 0.7, pose: 'shoo', wig: 'wave' });
      back(p, 0.72);
      break;
    }
    case 'monsters': {
      const p = off(SPOT.sack, 0.2, -0.05);
      dashTo(p, 0, 0.24, 1.4);
      spans.push({ a: 0.22, b: 0.5, pose: 'haul' }, { a: 0.46, b: 0.72, pose: 'lift' });
      back(p, 0.76);
      break;
    }
    case 'swap': {
      const p = off(MONSTER_CELLS[1], 0, -0.32);
      dashTo(p, 0, 0.26, 0);
      spans.push({ a: 0.26, b: 0.56, pose: 'kick' });
      back(p, 0.6);
      break;
    }
  }
  return prepare({ keys, spans });
}
