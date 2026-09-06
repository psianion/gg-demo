#!/usr/bin/env node
// W1b — pine basis proof (THE PLAN §4.4 / §4.5).
//
// For one pine per set (ambush, theatre, montage, cliffWorld), build its five drawn
// strokes (3 tier skirt arcs + 2 side zigzags) in TWO bases — the HERO's (the bug: no
// setView call, so buildPine draws facing HERO_AZ/HERO_ELEV=18/33 regardless of shot) and
// the SHOT's own (the fix: setView(shotView(cam,look).az, .elev) before the call) — then
// project both through the shot's REAL judged camera (THREE.PerspectiveCamera, HERO_FOV
// 32 per hero.ts, 1440x900 per THE PLAN §4.5) and report, per THE PLAN's own rule:
//   (a) off-mass points: a mark farther than 1.05x the tier's own PROJECTED radius from
//       the tree's vertical axis (axis and reference radius projected at the mark's own
//       world height, reference direction = the judging camera's true screen-right, so it
//       is basis-independent — only the mark's build basis differs between the two runs).
//   (b) crossings: all-pairs 2D segment intersection between DIFFERENT strokes (5 strokes:
//       arc0, arc1, arc2, zigLeft, zigRight), in the same projected screen space.
//
// Geometry is copied verbatim from src/film/mock/foliageKit.ts (PINE_TIERS, pineProfile,
// arcPts, pineZig, pineSilR, ARC_PUSH_RATIO/ZIG_PUSH_RATIO — grep to confirm) rather than
// imported, matching the established precedent (w1a-arc-occlusion.mjs, basis-check.mjs):
// a .mjs script does not resolve the app's .ts module graph. Arc jitter (krand) is
// dropped (j=1), same choice w1a-arc-occlusion.mjs made, to isolate the basis cause from
// per-point PRNG noise — noted here as w1a noted it there.
//
// Camera/tree numbers (r, h, world position, shot cam/look) are copied from the four
// `buildPine(...)` call sites this task wraps in src/film/sets/{ambush,theatre,montage,
// cliffWorld}.ts and from the shot cameras in src/film/timeline.ts (see W1B-REPORT.md /
// the task's own report for the grep + literal numbers). `sets/kit.ts`'s `buildPine(r, h,
// ...)` feeds `r` straight into `pineCrown` as rWide (grep `pineCrown(r, h, 0, 0,` in
// kit.ts) — no `pineStand`-style rWide clamp — so no re-derivation is needed here.
//
// Usage: node scripts/measure/w1b-pine-basis.mjs   (run from story/story)

import * as THREE from 'three';

const DEG = Math.PI / 180;
const HERO_AZ = 18 * DEG;
const HERO_ELEV = 33 * DEG;
const HERO_FOV = 32;
const W = 1440;
const H = 900;

// ---- foliageKit.ts verbatim ---------------------------------------------------------
const PINE_TIERS = [
  [0.369, 1.0, 0.376],
  [0.624, 0.773, 0.336],
  [0.846, 0.523, 0.308],
];
const ARC_PUSH_RATIO = 0.3 / 0.44;
const ZIG_PUSH_RATIO = 0.1 / 0.44;

function pineProfile(rWide, h) {
  return PINE_TIERS.map(([cy, r, ch]) => [cy * h, r * rWide, ch * h]);
}
function pineSilR(tiers, rWide, h) {
  return (y) =>
    Math.max(
      rWide * 0.045,
      ...tiers.map(([cy, r, ch]) => {
        const top = cy + ch / 2;
        return y >= cy - ch / 2 - 0.013 * h && y <= top ? (r * (top - y)) / ch : 0;
      }),
    );
}
function basisOf(az, elev) {
  return {
    VIEW_R: new THREE.Vector3(Math.cos(az), 0, Math.sin(az)),
    VIEW_CAM: new THREE.Vector3(
      Math.sin(az) * Math.cos(elev),
      Math.sin(elev),
      -Math.cos(az) * Math.cos(elev),
    ),
  };
}
function shotView(cam, look) {
  const dx = cam[0] - look[0];
  const dy = cam[1] - look[1];
  const dz = cam[2] - look[2];
  return { az: Math.atan2(dx, -dz), elev: Math.atan2(dy, Math.hypot(dx, dz)) };
}

// arcPts — foliageKit.ts verbatim, jitter j dropped to 1 (see header note).
function arcPts(basis, cx, cy, cz, rx, ry, a0, a1, push, n = 16) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const hh = Math.cos(a) * rx;
    pts.push(
      new THREE.Vector3(cx + basis.VIEW_R.x * hh, cy + Math.sin(a) * ry, cz + basis.VIEW_R.z * hh).addScaledVector(
        basis.VIEW_CAM,
        push,
      ),
    );
  }
  return pts;
}

// pineZig — foliageKit.ts verbatim.
function pineZig(basis, rWide, h, x, z, tiers, side) {
  const zig = 0.99;
  const [cyT, , chT] = tiers[2];
  const tipX = rWide * 0.068;
  const push = rWide * ZIG_PUSH_RATIO;
  const pts = [
    new THREE.Vector3(
      x + basis.VIEW_R.x * side * tipX,
      cyT + chT / 2 + 0.013 * h,
      z + basis.VIEW_R.z * side * tipX,
    ).addScaledVector(basis.VIEW_CAM, push),
  ];
  const silR = pineSilR(tiers, rWide, h);
  for (let i = tiers.length - 1; i >= 0; i--) {
    const [cy, , ch] = tiers[i];
    const yBot = cy - ch / 2 + 0.007 * h;
    const r0 = silR(yBot);
    pts.push(
      new THREE.Vector3(
        x + basis.VIEW_R.x * side * r0 * zig,
        yBot,
        z + basis.VIEW_R.z * side * r0 * zig,
      ).addScaledVector(basis.VIEW_CAM, push),
    );
    if (i > 0) {
      const yTuck = yBot + 0.02 * h;
      const rTuck = r0 * 0.45;
      pts.push(
        new THREE.Vector3(
          x + basis.VIEW_R.x * side * rTuck * zig,
          yTuck,
          z + basis.VIEW_R.z * side * rTuck * zig,
        ).addScaledVector(basis.VIEW_CAM, push),
      );
    }
  }
  return pts;
}

// 3 tier arcs + 2 side zigzags, built at LOCAL origin (0,0) in `basis` — matches
// pineCrown(r, h, 0, 0, ...) in kit.ts's buildPine; the caller translates by the tree's
// world position afterward, exactly as `tree.position.set(x, y, z)` does in the sets.
function buildStrokes(basis, rWide, h) {
  const tiers = pineProfile(rWide, h);
  const pushArc = rWide * ARC_PUSH_RATIO;
  const strokes = tiers.map(([cy, r, ch]) =>
    arcPts(basis, 0, cy - ch / 2, 0, r * 1.01, r * 0.3, 1.1 * Math.PI, 1.9 * Math.PI, pushArc),
  );
  for (const side of [-1, 1]) strokes.push(pineZig(basis, rWide, h, 0, 0, tiers, side));
  return { tiers, strokes }; // [0..2] = arcs by tier, [3,4] = zig sides
}

function translate(strokes, wx, wy, wz) {
  return strokes.map((s) => s.map((p) => p.clone().add(new THREE.Vector3(wx, wy, wz))));
}

function makeCamera(camPos, lookPos) {
  const cam = new THREE.PerspectiveCamera(HERO_FOV, W / H, 0.1, 300);
  cam.position.set(...camPos);
  cam.lookAt(new THREE.Vector3(...lookPos));
  cam.updateMatrixWorld();
  return cam;
}
function toPx(v3, cam) {
  const p = v3.clone().project(cam);
  return { x: ((p.x + 1) / 2) * W, y: ((1 - p.y) / 2) * H };
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function segX(p1, p2, p3, p4) {
  const d1 = [p2.x - p1.x, p2.y - p1.y];
  const d2 = [p4.x - p3.x, p4.y - p3.y];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-9) return false;
  const t = ((p3.x - p1.x) * d2[1] - (p3.y - p1.y) * d2[0]) / den;
  const u = ((p3.x - p1.x) * d1[1] - (p3.y - p1.y) * d1[0]) / den;
  const e = 1e-6;
  return t > e && t < 1 - e && u > e && u < 1 - e;
}

function measure(set) {
  const { camPos, lookPos, rWide, h, wx, wy, wz, buildBasis } = set;
  const cam = makeCamera(camPos, lookPos);
  const rightWorld = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);

  const { tiers, strokes: localStrokes } = buildStrokes(buildBasis, rWide, h);
  const strokes = translate(localStrokes, wx, wy, wz);
  const silR = pineSilR(tiers, rWide, h);

  let offMass = 0;
  let totalPts = 0;
  const worst = [];
  strokes.forEach((stroke, si) => {
    stroke.forEach((p) => {
      totalPts++;
      const r = si < 3 ? tiers[si][1] : silR(p.y - wy);
      const axisW = new THREE.Vector3(wx, p.y, wz);
      const refW = axisW.clone().addScaledVector(rightWorld, r);
      const axisPx = toPx(axisW, cam);
      const refPx = toPx(refW, cam);
      const projR = dist(axisPx, refPx);
      const markPx = toPx(p, cam);
      const d = dist(markPx, axisPx);
      const limit = 1.05 * projR;
      if (d > limit) {
        offMass++;
        worst.push({ stroke: si, over: (d - limit).toFixed(1) });
      }
    });
  });

  const segByStroke = strokes.map((s) => s.map((p) => toPx(p, cam)));
  let crossings = 0;
  for (let a = 0; a < segByStroke.length; a++) {
    for (let b = a + 1; b < segByStroke.length; b++) {
      for (let i = 0; i < segByStroke[a].length - 1; i++) {
        for (let j = 0; j < segByStroke[b].length - 1; j++) {
          if (segX(segByStroke[a][i], segByStroke[a][i + 1], segByStroke[b][j], segByStroke[b][j + 1])) crossings++;
        }
      }
    }
  }
  worst.sort((x, y) => y.over - x.over);
  return { offMass, totalPts, crossings, worst: worst.slice(0, 3) };
}

const SETS = [
  {
    name: 'ambush — front treeline tree 0 (r=0.62,h=1.9 @ 2.2,0,-15.5)',
    camPos: [2.5, 1.1, 3.2],
    lookPos: [2.5, 0.7, 0.9],
    rWide: 0.62,
    h: 1.9,
    wx: 2.2,
    wy: 0,
    wz: -15.5,
  },
  {
    // stageDisc.position.set(44, 0, -2) (theatre.ts) — forestSpots[0] (-5.5, 1.5) is LOCAL
    // to the disc, so world = (44-5.5, 0.3, -2+1.5) = (38.5, 0.3, -0.5).
    name: 'theatre — forest tree 0 (r=0.6,h=1.6 local -5.5,1.5 on stageDisc @ 44,0,-2)',
    camPos: [31.5, 4.5, 6],
    lookPos: [42, 1.0, -2],
    rWide: 0.6,
    h: 1.6,
    wx: 38.5,
    wy: 0.3,
    wz: -0.5,
  },
  {
    name: 'montage — vignette-3 sapling 0 (r=0.5,h=1.4 @ 23.5,0.2,-39.7)',
    camPos: [25.7, 1.8, -36.95],
    lookPos: [24.55, 1.0, -39.8],
    rWide: 0.5,
    h: 1.4,
    wx: 23.5,
    wy: 0.2,
    wz: -39.7,
  },
  {
    name: 'cliffWorld — miniWorld tree 0 (r=0.18,h=0.5 @ 131,0,4)',
    camPos: [128, 26, 8],
    lookPos: [146, 2, 0],
    rWide: 0.18,
    h: 0.5,
    wx: 131,
    wy: 0,
    wz: 4,
  },
];

console.log('=== W1b pine basis proof — off-mass points & crossings, hero basis (before) vs shot basis (after) ===');
console.log(`camera: PerspectiveCamera fov=${HERO_FOV} (HERO_FOV, hero.ts) aspect=${W}/${H}`);
console.log('off-mass rule: mark farther than 1.05x the tier\'s own projected radius from the tree axis, both at the mark\'s own world height, reference dir = the judging camera\'s true screen-right\n');

const heroBasis = basisOf(HERO_AZ, HERO_ELEV);

for (const set of SETS) {
  const sv = shotView(set.camPos, set.lookPos);
  const shotBasis = basisOf(sv.az, sv.elev);

  const before = measure({ ...set, buildBasis: heroBasis });
  const after = measure({ ...set, buildBasis: shotBasis });

  console.log(set.name);
  console.log(`  shot az=${(sv.az / DEG).toFixed(2)}deg elev=${(sv.elev / DEG).toFixed(2)}deg`);
  console.log(
    `  BEFORE (hero basis 18/33deg): off-mass ${before.offMass}/${before.totalPts} pts, crossings ${before.crossings}` +
      (before.worst.length ? `  worst overshoot px: ${before.worst.map((w) => `stroke${w.stroke}+${w.over}`).join(', ')}` : ''),
  );
  console.log(
    `  AFTER  (shot basis): off-mass ${after.offMass}/${after.totalPts} pts, crossings ${after.crossings}` +
      (after.worst.length ? `  worst overshoot px: ${after.worst.map((w) => `stroke${w.stroke}+${w.over}`).join(', ')}` : ''),
  );
  console.log('');
}
