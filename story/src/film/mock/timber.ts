// MOCK — Timber (mass). Art bible §11.2, row 7.
//
//   ?mock=timber · &rig=prep · &zoom=1..6
//
// THE ROW, built: limbs are SEGMENT CHAINS — each segment's top radius continues the
// parent's end radius, joints overlap 6% (`next.y = -len·0.94`), curl accumulates
// `rotation.x = 0.2 + i·0.12`. `sheet: true`, `dir 1.15 + curl·0.12` (one steep grain
// per limb). timber t3 · timberDark t4 · trackShade t4. Drawn: two side contours at
// 'form' + two bark streaks at 'faint' per limb. The roots' lesson from
// hero.ts:1466–1528 is the row's whole argument: the fix for a smooth Lambert limb was
// DRAWN MARKS, not more geometry.
//
// SCREEN ARITHMETIC (appendix step 1): judged at the route's hero solve, ~130 px/u. A
// 0.20-u log radius is 52 screen px of unbroken fill across the near face. That number
// is what drives the two corrections below.
//
// THREE CORRECTIONS TO THE ROW, all found on screen and all reported in MOCK-3.md:
//
//  1. "no bake" IS WRONG AT LOG SCALE. At the hero's own root radius (0.075 u = 10 px)
//     a flat token plus two contours is right, and that is what the row measured. A
//     log at 0.20 u is five times that: 52 px of one Lambert value reads as bent
//     plastic tubing, which is exactly §9.3's gradient-wash signature, and it is what
//     ?mock=timber showed on its first frame. The class takes bark's tile (row 6's
//     `bakeBark`, here the white-based `bakeGrain` so one bake serves all three wood
//     tokens). Nothing else about the row changes.
//
//  2. poster 0 IS WRONG FOR THE SAME REASON. With no bake and no poster a cylinder is
//     a smooth Lambert ramp end to end — the failure the bible names by name. The
//     class runs poster 4: four committed steps, so the round of a limb reads as
//     TIERS, which is C5's ≥3 separated values applied to a form that has no geometry
//     to supply them.
//
//  3. THE CURL CONSTANT IS A ROOT'S, NOT A BEAM'S. `rotation.x = 0.2 + i·0.12` on a
//     three-segment post accumulates 0.2 + 0.32 + 0.44 = 0.96 rad of bend; the row
//     files "beams and doorframes" under the same recipe, and built literally it makes
//     every doorframe a croquet hoop (the first ?mock=timber frame, again). The
//     accumulation is scaled by a per-limb `bend`: 1.0 is the root the row measured,
//     0.05 is a post. The FORMULA is unchanged — it is multiplied, not replaced.
//
// And one thing hero.ts does that does not transfer: its roots push their marks by a
// FIXED limb-local `(0.03, 0.03, −0.07)`, which is exact only while a limb's yaw stays
// inside ±0.4 rad. A fallen log lies at 90° and that push throws the contour clean off
// the timber. The marks here are built in WORLD space off `cross(axis, viewDir)` —
// `tubeContour()` in plankKit.
import * as THREE from 'three';
import { roughen } from '../pencil.ts';
import { propGround } from './groundKit.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { timber, timberDark, earthTrack, flameCore, ink, graphite, graphiteDark } from '../palette.ts';
import { bakeGrain, hand, mark, merge, mixHex, parkSeam, put, tubeContour, VIEW_CAM } from './plankKit.ts';

const rnd = hand(0x71b3);

// #8C6F4C t4 — a two-token mix (§11.3), not a palette literal
const trackShade = mixHex(earthTrack, timberDark, 0.45);

interface LimbSpec {
  radii: number[]; // one more than lens: every joint's radius is shared by both sides
  lens: number[];
  curl: number; // the row's `dir 1.15 + curl·0.12` term, and the z-lean
  bend: number; // correction 3: how much of the root's x-accumulation this limb takes
  seed: number;
  pos: [number, number, number];
  rot: [number, number, number];
  tier: 0 | 1 | 2; // lit · mid · shade
  streaks: number;
  /**
   * ITEM 27b — "clamp the fallen log's tail to the ground; the accumulating curl lifts
   * it and it reads as balanced, not fallen."
   *
   * The curl is applied as a rotation PER SEGMENT and it accumulates, so by the fourth
   * segment a log laid flat has swung 0.86 rad and its tail sits 0.4 u in the air. The
   * fix is not to remove the curl — a grown limb curls, and that is the row's whole
   * reason for the term — but to LAY THE RESULT DOWN: once the axis is built, the whole
   * limb is rotated about its own base until the tail's height matches the base's. The
   * curl survives in plan and in the silhouette; only the lift goes.
   */
  layFlat?: boolean;
}

function limb(l: LimbSpec, out: THREE.BufferGeometry[][], runs: THREE.Group) {
  const A = new THREE.Matrix4().compose(
    new THREE.Vector3(...l.pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...l.rot)),
    new THREE.Vector3(1, 1, 1),
  );
  const R = new THREE.Matrix4();
  const T = new THREE.Matrix4();
  const axis: { p: THREE.Vector3; r: number }[] = [];

  for (let i = 0; i < l.lens.length; i++) {
    // the curl, scaled by this limb's own bend — correction 3
    R.makeRotationX((0.2 + i * 0.12) * l.bend);
    A.multiply(R);
    R.makeRotationZ(l.curl * 0.1 * i * l.bend);
    A.multiply(R);

    // 11 radial segments, not 7: at 52 px across, seven flat panels shade as folded
    // card. The extra four are 1.2k triangles for the whole class.
    const g = roughen(
      new THREE.CylinderGeometry(l.radii[i], l.radii[i + 1], l.lens[i], 11, 3),
      // amp 20% of the limb's own radius at freq 9: at 16%/5.5 the log's silhouette
      // came back a clean machine sweep on the second walk. The bible's own range is
      // 7–22% of the form's radius, and a limb wants the top of it.
      l.radii[i] * 0.2,
      9,
      l.seed + i,
    );
    // the bake's v runs along the limb, u around it: one grain family per limb
    const uv = g.getAttribute('uv');
    for (let k = 0; k < uv.count; k++) {
      uv.setXY(k, uv.getX(k) * ((Math.PI * 2 * l.radii[i]) / 2), uv.getY(k) * (l.lens[i] / 2));
    }
    uv.needsUpdate = true;
    T.makeTranslation(0, -l.lens[i] / 2, 0);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(A, T));
    out[l.tier].push(g);

    // the axis, in world space — the contour and the streaks both hang off it
    for (let k = 0; k < (i === l.lens.length - 1 ? 3 : 2); k++) {
      const t = k / 2;
      axis.push({
        p: new THREE.Vector3(0, -l.lens[i] * t, 0).applyMatrix4(A),
        r: l.radii[i] + (l.radii[i + 1] - l.radii[i]) * t,
      });
    }
    T.makeTranslation(0, -l.lens[i] * 0.94, 0);
    A.multiply(T);
  }

  // LAY IT DOWN — see LimbSpec.layFlat. One rotation about the base, in the vertical
  // plane the base and the tail share, applied to every segment and to the axis so the
  // contour and the streaks follow the wood.
  if (l.layFlat) {
    const base = axis[0].p;
    const tail = axis[axis.length - 1].p;
    const d = new THREE.Vector3().subVectors(tail, base);
    const flat = Math.hypot(d.x, d.z);
    if (flat > 1e-4) {
      const drop = -Math.atan2(d.y, flat); // the angle that puts the tail level again
      const axisV = new THREE.Vector3(-d.z, 0, d.x).normalize(); // horizontal, across the run
      const M = new THREE.Matrix4()
        .makeTranslation(base.x, base.y, base.z)
        .multiply(new THREE.Matrix4().makeRotationAxis(axisV, drop))
        .multiply(new THREE.Matrix4().makeTranslation(-base.x, -base.y, -base.z));
      for (const geom of out[l.tier].slice(-l.lens.length)) geom.applyMatrix4(M);
      for (const a of axis) a.p.applyMatrix4(M);
    }
  }

  // TWO side contours, ONE draw: down one silhouette, around the tip, back up the
  // other. Built in the shot's view plane off the axis, so a limb at any yaw keeps
  // its marks on its own outline.
  runs.add(mark(tubeContour(axis, 0.05), l.tier === 0 ? ink : graphiteDark, 'form'));

  // two bark streaks, each one continuous run down the whole limb — the row's two
  // marks, at two draws instead of two per segment
  const side = new THREE.Vector3();
  const a = new THREE.Vector3();
  for (let s = 0; s < l.streaks; s++) {
    const pts: THREE.Vector3[] = [];
    const off = (s === 0 ? -0.34 : 0.3) + (rnd() - 0.5) * 0.2;
    for (let i = 1; i < axis.length - 1; i++) {
      a.subVectors(axis[i + 1].p, axis[i - 1].p);
      side.crossVectors(a, VIEW_CAM).normalize().multiplyScalar(axis[i].r * off);
      pts.push(axis[i].p.clone().add(side).addScaledVector(VIEW_CAM, axis[i].r * 0.9));
    }
    if (pts.length > 1) runs.add(mark(pts, l.tier === 0 ? timber : graphite, 'faint'));
  }
}

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();

  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class now builds the ordinary ground
  // card under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  g.add(propGround(2.4, 2, [[-0.9,0.7,162,0.28],[-0.66,-0.62,66,0.26],[0.66,-0.62,66,0.26],[0.5,1.6,42,0.22]]));
  const geos: THREE.BufferGeometry[][] = [[], [], []];
  const runs = new THREE.Group();

  // 1 — THE FALLEN LOG, the class's headline form. Four segments, the radius
  // continuing at every joint, a full root's bend so it reads as grown and not turned.
  limb(
    {
      radii: [0.2, 0.172, 0.14, 0.1, 0.032],
      lens: [0.74, 0.66, 0.58, 0.46],
      curl: 0.5,
      bend: 0.9,
      seed: 11,
      pos: [-1.5, 0.235, 0.62],
      rot: [0, 0.28, -1.5],
      tier: 0,
      streaks: 2,
      layFlat: true,
    },
    geos,
    runs,
  );
  // its broken-off limb, still attached — the joint's radius continues the log's
  limb(
    {
      radii: [0.095, 0.066, 0.02],
      lens: [0.34, 0.28],
      curl: -0.9,
      bend: 1.0,
      seed: 17,
      pos: [-0.28, 0.3, 0.76],
      rot: [0.45, -0.5, -2.35],
      tier: 2,
      streaks: 1,
    },
    geos,
    runs,
  );

  // 2 — THE DOORFRAME: two posts and a lintel. Same recipe, bend 0.05, which is
  // correction 3 doing its whole job — a post that leans a little is timber, a post
  // that curls 0.96 rad is a hoop.
  for (const x of [-0.66, 0.66] as const) {
    limb(
      {
        radii: [0.092, 0.084, 0.076],
        lens: [1.0, 1.0],
        curl: x < 0 ? 0.2 : -0.2,
        bend: 0.05,
        seed: x < 0 ? 23 : 29,
        // built downward from the head, so the taper runs the way the tree grew
        pos: [x, 1.98, -0.62],
        rot: [0, 0, x < 0 ? 0.03 : -0.03],
        tier: 1,
        streaks: 2,
      },
      geos,
      runs,
    );
  }
  limb(
    {
      radii: [0.1, 0.093, 0.086],
      lens: [0.72, 0.72],
      curl: 0.1,
      bend: 0.04,
      seed: 31,
      pos: [-0.74, 1.99, -0.62],
      rot: [0, 0, -Math.PI / 2 + 0.02],
      tier: 0,
      streaks: 2,
    },
    geos,
    runs,
  );

  // 3 — the S4 rope, which the row files under timber because it is built the same
  // way: a chain whose radius continues and whose curl IS the drape. Full bend.
  limb(
    {
      radii: [0.03, 0.028, 0.026, 0.023, 0.02],
      lens: [0.3, 0.3, 0.3, 0.26],
      curl: -1.4,
      bend: 1.3,
      seed: 37,
      pos: [0.5, 1.9, -0.56],
      rot: [0.5, 0.15, 0.35],
      tier: 2,
      streaks: 0,
    },
    geos,
    runs,
  );

  // ---- three tiers, three merged geometries, three draws ----------------------
  // poster 4 (correction 2) and the grain tile (correction 1) are what turn a smooth
  // Lambert cylinder into wood; `dir` is one steep grain per tier, all three inside
  // C4's ±0.2 rad neighbour window (1.21 · 1.15 · 1.10).
  const grain = bakeGrain(512, 74, 0x51c4);
  // ============ FIX ROUND — ITEM 27a: THE VALUE WAS WRONG ====================
  // "The limbs are DARKER THAN ANY TIMBER ON THE ISLAND, close to black-brown in shade."
  // They were: two of the three tiers are the film's own dark tokens (timberDark L 0.336,
  // trackShade L 0.451) and poster 4 then commits the shaded half of a round limb to the
  // bottom bin, so a 0.2-u log bottoms out below anything the island carries. Every tier
  // moves UP one step toward the light without leaving the wood family —  is
  // new only as a name, being the same two-token mix the plank class already uses.
  const timberLit = mixHex(timber, flameCore, 0.26);
  const tiers = [
    { hex: timberLit, dir: 1.15 + 0.5 * 0.12 },
    { hex: timber, dir: 1.15 },
    { hex: mixHex(timberDark, timber, 0.45), dir: 1.15 - 0.4 * 0.12 },
  ];
  for (const [i, t] of tiers.entries()) {
    if (!geos[i].length) continue;
    const mat = createTrilayer({
      color: t.hex,
      wear: 0.24,
      poster: 4,
      stroke: { dir: t.dir, sheet: true },
    });
    if (grain) mat.map = grain;
    const mesh = new THREE.Mesh(merge(geos[i]), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }

  // the lintel's two sawn ends — a beam is a cut section, and a cut section is drawn
  for (const x of [-0.75, 0.75] as const) {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const j = 1 + (rnd() - 0.5) * 0.06;
      pts.push(
        new THREE.Vector3(x, 1.99 + Math.sin(a) * 0.098 * j, -0.62 + Math.cos(a) * 0.098 * j)
          .addScaledVector(VIEW_CAM, 0.1),
      );
    }
    runs.add(mark(pts, ink, 'form'));
  }

  g.add(runs);
  return parkSeam(g);
}
