#!/usr/bin/env node
// W3c fix round (W3-V2) — row 23 impact, §4.5 crossing count + §4.4 basis + §3.7/row-23
// screen-size check, one impact at a time, each through its OWN real shot camera.
//
// Reimplements marksKit.ts's buildImpact() authored geometry directly (vp/mark/tick's
// point math, copied verbatim from src/film/mock/marksKit.ts), the same way
// scripts/tritone.mjs reimplements trilayer.ts's formula rather than importing the TS
// module.
//
// LAW 14 FIX (2026-09-06): the three impact `scale` values and the two shot bases used to
// be typed-in literals here, which drifted stale when cliffWorld.ts's own numbers changed
// (5.0/5.0/1.8 -> 1.5/1.5/0.5) and this script kept printing the old ones. Both are now
// READ LIVE out of cliffWorld.ts's source text below instead of hand-copied. The bases go
// one step further: rather than re-typing the `shotView` az/elev formula a second time
// (that duplicate WAS the W3c bug — 90° off the kits' convention), this script now
// IMPORTS the real `shotView` from foliageKit.ts and only regexes the literal camera
// numbers cliffWorld.ts feeds it. That import was tried and works without a DOM (verified
// 2026-09-06: foliageKit.ts's module-level code never touches `document`, only functions
// called later do) — so this script now needs `node --experimental-strip-types` (report:
// invoked as `node --experimental-strip-types scripts/measure/w3c-impact-crossings.mjs`).
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { shotView } from '../../src/film/mock/foliageKit.ts';

const deg = (r) => (r * 180) / Math.PI;
const HERE = dirname(fileURLToPath(import.meta.url));
const CLIFF_WORLD_PATH = join(HERE, '../../src/film/sets/cliffWorld.ts');
const cliffWorldSrc = readFileSync(CLIFF_WORLD_PATH, 'utf8');

// ---- live bases: regex the literal camera numbers out of cliffWorld.ts's own
// `shotView(...)` calls (quoted exactly, cliffWorld.ts today):
//   const CAM4_VIEW = shotView([102, 1.6, 2.2], [117.4, 3.8, 0.2]); // timeline.ts cam(4)
//   const CUT75_VIEW = shotView([114.4, 7.2, 3.0], [117.6, 6.4, 0]); // timeline.ts cut(7.5)
function parseBase(name) {
  const re = new RegExp(`const ${name} = shotView\\(\\s*\\[([^\\]]+)\\]\\s*,\\s*\\[([^\\]]+)\\]\\s*\\)`);
  const m = cliffWorldSrc.match(re);
  if (!m) throw new Error(`could not find "const ${name} = shotView(...)" in cliffWorld.ts`);
  return { pos: m[1].split(',').map(Number), look: m[2].split(',').map(Number) };
}
const CAM4 = parseBase('CAM4_VIEW'); // timeline.ts cam(4), active t4-7.5
const CUT75 = parseBase('CUT75_VIEW'); // timeline.ts cut(7.5), active t7.5+
const CAM4_VIEW = shotView(CAM4.pos, CAM4.look);
const CUT75_VIEW = shotView(CUT75.pos, CUT75.look);
console.log('cam(4)  basis: az', deg(CAM4_VIEW.az).toFixed(1), 'deg, elev', deg(CAM4_VIEW.elev).toFixed(1), 'deg');
console.log('cut(7.5) basis: az', deg(CUT75_VIEW.az).toFixed(1), 'deg, elev', deg(CUT75_VIEW.elev).toFixed(1), 'deg');

// ---- live scales: regex the impactViews array's `scale: <number>` entries out of
// cliffWorld.ts, IN ORDER, alongside which base (CAM4_VIEW/CUT75_VIEW) each one spreads in
// (quoted exactly, cliffWorld.ts today):
//   const impactViews = [
//     { ...CAM4_VIEW, scale: 1.5 },
//     { ...CAM4_VIEW, scale: 1.5 },
//     { ...CUT75_VIEW, scale: 0.5 },
//   ];
const blockMatch = cliffWorldSrc.match(/const impactViews = \[([\s\S]*?)\];/);
if (!blockMatch) throw new Error('could not find "const impactViews = [...]" in cliffWorld.ts');
const entries = [...blockMatch[1].matchAll(/\{\s*\.\.\.(CAM4_VIEW|CUT75_VIEW),\s*scale:\s*([\d.]+)\s*\}/g)];
if (entries.length !== 3) {
  throw new Error(
    `expected exactly 3 impactViews entries, found ${entries.length}. Matched block text:\n${blockMatch[1]}`,
  );
}
const BASES = { CAM4_VIEW: { shot: CAM4, view: CAM4_VIEW, label: 'cam(4)' }, CUT75_VIEW: { shot: CUT75, view: CUT75_VIEW, label: 'cut(7.5)' } };

// ---- buildImpact()'s authored geometry (marksKit.ts, verbatim numbers). `scale` mirrors
// the `opts.scale` inner-group multiplier added to marksKit.ts's buildImpact (W3c fix):
// every offset from the strike point scales uniformly, ratios untouched. -----------------
function buildImpactEdges(view, worldPos, scale = 1) {
  const VIEW_R = new THREE.Vector3(Math.cos(view.az), 0, Math.sin(view.az));
  const VIEW_UP = new THREE.Vector3(0, 1, 0);
  const VIEW_CAM = new THREE.Vector3(
    Math.sin(view.az) * Math.cos(view.elev),
    Math.sin(view.elev),
    -Math.cos(view.az) * Math.cos(view.elev),
  );
  function vp(o, h, v, push = 0) {
    return o
      .clone()
      .addScaledVector(VIEW_R, h * scale)
      .addScaledVector(VIEW_UP, v * scale)
      .addScaledVector(VIEW_CAM, push * scale);
  }
  const strike = new THREE.Vector3(...worldPos);
  const inAngle = Math.atan2(-1.28, 2.0); // default angle == mock/marks.ts's launch->strike vector

  const families = []; // { name, edges: [[p0,p1], ...] }

  // a. the strike mark — 1 edge, 0.25 u
  {
    const p0 = vp(strike, Math.cos(inAngle) * -0.13, Math.sin(inAngle) * -0.13, 0.1);
    const p1 = vp(strike, Math.cos(inAngle) * 0.12, Math.sin(inAngle) * 0.12, 0.1);
    families.push({ name: 'strike', edges: [[p0, p1]], lenU: 0.25 });
  }

  // b. the spall — 4 ticks, each its own family (never parallel, no-hatch by construction)
  const refl = inAngle + Math.PI;
  const spallLens = [];
  [-0.72, -0.24, 0.3, 0.86].forEach((d, i) => {
    const a = refl + d;
    const len = 0.16 + (i % 3) * 0.05;
    const bow = 0.18 - i * 0.06;
    const push = 0.1;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const n = [-s, c];
    const p0 = vp(strike, 0, 0, push);
    const p1 = vp(strike, c * len * 0.55 + n[0] * len * bow, s * len * 0.55 + n[1] * len * bow, push);
    const p2 = vp(strike, c * len, s * len, push);
    families.push({ name: `spall${i}`, edges: [[p0, p1], [p1, p2]], lenU: len });
    spallLens.push(len);
  });

  return { strike, families, spallLens };
}

// ---- camera + projection at a given resolution --------------------------------------
function fitFov(aspect) {
  const REF_FOV = 42, REF_ASPECT = 16 / 9, MAX_FOV = 70;
  const rad = (d) => (d * Math.PI) / 180;
  const REF_H_FOV = 2 * Math.atan(Math.tan(rad(REF_FOV) / 2) * REF_ASPECT);
  const v = deg(2 * Math.atan(Math.tan(REF_H_FOV / 2) / aspect));
  return Math.min(Math.max(v, REF_FOV), MAX_FOV);
}
function makeCam(shot, width, height) {
  const cam = new THREE.PerspectiveCamera(fitFov(width / height), width / height, 0.1, 200);
  cam.position.set(...shot.pos);
  cam.lookAt(...shot.look);
  cam.updateMatrixWorld();
  return cam;
}
function toScreen(cam, p, width, height) {
  const v = p.clone().project(cam);
  return [((v.x + 1) / 2) * width, ((1 - v.y) / 2) * height];
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function segXing(p1, p2, p3, p4) {
  const [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3, [x4, y4] = p4;
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(d) < 1e-9) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

// ---- the film's three impacts, real world positions (cliff.position (120,0,0) + local,
// cliffWorld.ts's literal `impacts` array — unchanged by this fix, not a law-14 offender)
// paired with the LIVE scale + base parsed above, in order. `scale` is cliffWorld.ts's
// chosen `buildRayBurst(..., { ..., scale })` value per impact (§3.7/row-23).
const IMPACT_POS = [
  [117.4, 6.05, -1.1],
  [117.0, 6.02, 0.7],
  [118.0, 6.08, -0.5],
];
const IMPACTS = entries.map(([, baseName, scaleStr], i) => {
  const base = BASES[baseName];
  return { name: `impacts[${i}]`, pos: IMPACT_POS[i], shot: base.shot, view: base.view, scale: Number(scaleStr), baseLabel: base.label };
});

// px/world-unit at each impact's own position, the same scalar quantity §3.8's
// "screen-space arithmetic" and the original overshoot-threshold computation both use:
// distance from the strike point to a point exactly 1 world-unit away ALONG the view
// plane's own horizontal axis, projected. This is the size a mark of a given AUTHORED
// LENGTH reads at — not a per-vertex re-projection of the tick's own (basis-approximate)
// 3D orientation, which is noisy here for the same reason every view-plane mark in this
// film is noisy off-axis: `VIEW_UP` is fixed world-Y (marksKit.ts), not the camera's true
// (roll-free) up vector, so a `push`-only offset lands at a slightly different apparent
// depth per direction. That basis approximation is shared by every mark class in the
// film (pine, cast, impact) and is out of this task's file scope (marksKit.ts's `vp`/
// `setMarksView` are not editable here) — the pxPerUnit scalar is the row's own intended
// yardstick and is what row 23's "0.14-0.26 u = 5-10 px" line is stated against.
const WIDTHS = [1440, 500]; // 1440x900 (the task's ask) and 500-wide (row 23's "@500" reference)
console.log('\n--- screen size vs row 23 (spall 0.14-0.26 u = 5-10 px @500; strike 0.25 u; never faint) ---');
for (const imp of IMPACTS) {
  const { strike } = buildImpactEdges(imp.view, imp.pos);
  const VIEW_R = new THREE.Vector3(Math.cos(imp.view.az), 0, Math.sin(imp.view.az));
  for (const width of WIDTHS) {
    const height = width === 1440 ? 900 : Math.round((900 * 500) / 1440); // same aspect, held constant
    const cam = makeCam(imp.shot, width, height);
    const pxPerU = dist(toScreen(cam, strike, width, height), toScreen(cam, strike.clone().add(VIEW_R), width, height));
    const before = { strike: pxPerU * 0.25, lo: pxPerU * 0.16, hi: pxPerU * 0.26 };
    const s = imp.scale;
    const after = { strike: before.strike * s, lo: before.lo * s, hi: before.hi * s };
    console.log(
      `${imp.name} @ ${width}x${height} (${pxPerU.toFixed(2)} px/u, unscaled): BEFORE strike ${before.strike.toFixed(2)}px, spall ${before.lo.toFixed(2)}-${before.hi.toFixed(2)}px  |  scale=${s} -> AFTER strike ${after.strike.toFixed(2)}px, spall ${after.lo.toFixed(2)}-${after.hi.toFixed(2)}px`,
    );
  }
}

// ---- §4.5: crossing count per impact, at 1440x900, under its real post-fix basis AND
// post-fix scale (the actual shipped geometry) --------------------------------------
console.log('\n--- §4.5 crossing count, 1440x900, post-fix basis + scale per impact ---');
for (const imp of IMPACTS) {
  const { strike, families } = buildImpactEdges(imp.view, imp.pos, imp.scale);
  const cam = makeCam(imp.shot, 1440, 900);
  const p0screen = toScreen(cam, strike, 1440, 900);
  const pxPerU = dist(p0screen, toScreen(cam, strike.clone().add(new THREE.Vector3(1, 0, 0)), 1440, 900));
  const OVERSHOOT_PX = 0.05 * pxPerU;

  const screenSegs = [];
  for (const fam of families) {
    for (const [p0, p1] of fam.edges) {
      screenSegs.push({ family: fam.name, a: toScreen(cam, p0, 1440, 900), b: toScreen(cam, p1, 1440, 900) });
    }
  }
  const table = {};
  let total = 0;
  for (let i = 0; i < screenSegs.length; i++) {
    for (let j = i + 1; j < screenSegs.length; j++) {
      const s1 = screenSegs[i], s2 = screenSegs[j];
      if (s1.family === s2.family) continue;
      const hit = segXing(s1.a, s1.b, s2.a, s2.b);
      if (!hit) continue;
      const nearEndpoint = [s1.a, s1.b, s2.a, s2.b].some((ep) => dist(hit, ep) <= OVERSHOOT_PX);
      if (nearEndpoint) continue;
      total++;
      const key = [s1.family, s2.family].sort().join(' x ');
      table[key] = (table[key] || 0) + 1;
    }
  }
  console.log(`${imp.name} (${imp.baseLabel} basis): TOTAL legitimate crossings = ${total}`, Object.keys(table).length ? table : '(none)');
}
console.log('total marks in each impact: strike 1 + spall 4 (8 edges) + flash 3 = 8 line edges + 3 flash meshes, per impact');
console.log('\ninvoked as: node --experimental-strip-types scripts/measure/w3c-impact-crossings.mjs (needed for the live `shotView` import from foliageKit.ts)');
