#!/usr/bin/env node
// W3a — cliff-silhouette step-depth check (art bible §11.2 row 4, "Cliff / strata").
// Proves the note's claim: "step depth x2.4 so every boundary reads >= 3 px at S1 t6
// and S7 t58.5 (1440x900)". Copied from a scratchpad script (w3a/w3a-verify.mjs,
// step-size half only; the crossing half lives in w3a-strata-crossings.mjs) and made
// self-contained per THE PLAN law 14 — no scratchpad path, no relative TS import.
//
// CLIFF_BANDS below is copied verbatim from the shipped table
// (grep -n "export const CLIFF_BANDS" src/film/mock/groundKit.ts) — confirmed matching
// on 2026-09-06. cliffLobe() is copied from the same file's function of that name.
//
// Usage: node scripts/measure/w3a-step-verify.mjs   (run from story/story)

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// ---- camera projection, matching THE PLAN §4.1's heroFraming-style fit-to-aspect ----
const REF_FOV = 42, REF_ASPECT = 16 / 9, MAX_FOV = 70;
const REF_H_FOV = 2 * Math.atan(Math.tan(rad(REF_FOV) / 2) * REF_ASPECT);
function fitFov(aspect) {
  const v = deg(2 * Math.atan(Math.tan(REF_H_FOV / 2) / aspect));
  return Math.min(Math.max(v, REF_FOV), MAX_FOV);
}
const W = 1440, H = 900, ASPECT = W / H, VFOV = rad(fitFov(ASPECT)), tanV = Math.tan(VFOV / 2);

// The film ships the cliff at CLIFF_S scale with a world-x offset (timeline blocking,
// see bible row 4's CLARIFIED 2026-09-06 note) — reproduced here only so the S1/S7
// camera positions below (lifted from timeline.ts's cut()/cam() at those beats) land
// on the actual film cliff, not the mock's un-offset one.
const CLIFF_S = 0.72987, CLIFF_RX_FILM = 5.4 * CLIFF_S, CLIFF_RZ_FILM = 4.6 * CLIFF_S;
const LAND_DX = 0.802, CLIFF_X = 120;

// cliffLobe — copied verbatim from src/film/mock/groundKit.ts
// (grep -n "function cliffLobe" src/film/mock/groundKit.ts).
const cliffLobe = (phi) =>
  1 + 0.085 * Math.sin(3 * phi + 0.7) + 0.045 * Math.sin(5 * phi - 1.9) + 0.03 * Math.sin(8 * phi + 2.6);

function cliffEdgeWorld(a, rr, y, rx = CLIFF_RX_FILM, rz = CLIFF_RZ_FILM) {
  const t = (a * Math.PI) / 180, ux = Math.cos(t), uz = -Math.sin(t);
  const L = cliffLobe(Math.atan2(uz, ux)) * rr;
  return [CLIFF_X + LAND_DX + ux * L * rx, y, uz * L * rz];
}
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; }
function camera(pos, tgt) {
  const forward = norm(sub(tgt, pos));
  const right = norm(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  return { pos, forward, right, up };
}
function project(P, cam) {
  const rel = sub(P, cam.pos);
  const cz = dot(rel, cam.forward);
  if (cz <= 0.01) return null;
  const cx = dot(rel, cam.right), cy = dot(rel, cam.up);
  const ndcX = cx / cz / (tanV * ASPECT), ndcY = cy / cz / tanV;
  return [W / 2 + ndcX * (W / 2), H / 2 - ndcY * (H / 2)];
}
function extremalScreenX(rr, y, cam, N = 720) {
  let best = 0, bs = 0;
  for (let i = 0; i < N; i++) {
    const a = (360 * i) / N;
    const P = cliffEdgeWorld(a, rr, y);
    const s = project(P, cam);
    if (!s) continue;
    const d = Math.abs(s[0] - W / 2);
    if (d > best) { best = d; bs = s[0] - W / 2; }
  }
  return bs;
}

// ---- CLIFF_BANDS — copied verbatim from src/film/mock/groundKit.ts -----------------
// (grep -n "export const CLIFF_BANDS" src/film/mock/groundKit.ts). [rTop, rBot, yTop,
// yBot, tint, roughenAmp, roughenFreq]. This is the step depth x2.4 already applied —
// the bible note describes a fix already shipped, not a delta this script computes.
const CLIFF_BANDS = [
  [1.0, 1.0128, 6.0, 5.62, 0, 0.05, 2.8],
  [1.0032, 0.951, 5.7, 4.55, 1, 0.09, 2.4],
  [0.975, 0.9784, 4.66, 3.3, 2, 0.12, 2.2],
  [0.9976, 0.9202, 3.42, 2.05, 3, 0.14, 2.0],
  [0.9538, 0.9664, 2.16, 1.15, 1, 0.11, 2.4],
  [0.9856, 0.8762, 1.26, 0.42, 4, 0.16, 1.9],
  [0.9098, 1.04, 0.5, 0.0, 5, 0.18, 1.7],
];

// S1 t6's cut(7.5) and S7 t58.5's cam(58.5), camera pos/target read from timeline.ts.
const SHOTS = {
  S1: camera([114.4, 7.2, 3.0], [117.6, 6.4, 0]),
  S7: camera([128, 26, 8], [146, 2, 0]),
};

console.log('=== W3a step-depth check (art bible row 4) ===');
let worst = Infinity;
for (let i = 0; i < 6; i++) {
  const rBot = CLIFF_BANDS[i][1], rTop = CLIFF_BANDS[i + 1][0], y = CLIFF_BANDS[i][3];
  const pctRx = Math.abs(rBot - rTop) * 100;
  let line = `boundary ${i} y=${y} pctRx=${pctRx.toFixed(3)}`;
  for (const [name, cam] of Object.entries(SHOTS)) {
    const px = Math.abs(extremalScreenX(rBot, y, cam) - extremalScreenX(rTop, y, cam));
    if (px < worst) worst = px;
    line += `  ${name}=${px.toFixed(2)}px`;
  }
  console.log(line);
}
console.log('worst step px across all boundaries/shots:', worst.toFixed(3), worst >= 3 ? 'PASS (>= 3px)' : 'FAIL (< 3px)');
