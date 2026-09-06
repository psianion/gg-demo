#!/usr/bin/env node
// W3a — cliff section-cut x boundary-arc crossing count (art bible §11.2 row 4,
// "Cliff / strata"). Proves the note's claim: "cut x arc crossings 12 of 16 -> 0".
// Copied from a scratchpad script (w3a/crossings.mjs / w3a/w3a-verify.mjs's crossing
// half) and made self-contained per THE PLAN law 14 — no scratchpad path, no relative
// TS import. Method matches THE PLAN §4.5: build the world-space runs exactly as
// buildStrataCliff does, project through the shot's camera azimuth/elevation basis
// (§4.4's own formula), then all-pairs segment intersection, cut-family vs arc-family
// only (never within a family).
//
// All constants below (CLIFF_BANDS, cliffLobe, the 1.03x boundary rule, CUT_GAP, the
// 18-190 step-11 cut loop) are copied verbatim from src/film/mock/groundKit.ts's
// buildStrataCliff — grep -n "export const CLIFF_BANDS" / "SIX BOUNDARY ARCS" /
// "SIXTEEN SECTION CUT MARKS" in that file — confirmed matching on 2026-09-06.
//
// Usage: node scripts/measure/w3a-strata-crossings.mjs   (run from story/story)

const cliffLobe = (phi) =>
  1 + 0.085 * Math.sin(3 * phi + 0.7) + 0.045 * Math.sin(5 * phi - 1.9) + 0.03 * Math.sin(8 * phi + 2.6);

// mock-scale geometry (rx=5.4/rz=4.6) — crossing topology is scale-invariant under
// uniform per-axis scaling with a basis-only camera, matching groundKit.ts's own units.
function cliffEdge(a, rr, y, rx = 5.4, rz = 4.6) {
  const t = (a * Math.PI) / 180, ux = Math.cos(t), uz = -Math.sin(t);
  const L = cliffLobe(Math.atan2(uz, ux)) * rr;
  return [ux * L * rx, y, uz * L * rz];
}

// CLIFF_BANDS — copied verbatim from src/film/mock/groundKit.ts (see header comment).
const CLIFF_BANDS = [
  [1.0, 1.0128, 6.0, 5.62, 0, 0.05, 2.8],
  [1.0032, 0.951, 5.7, 4.55, 1, 0.09, 2.4],
  [0.975, 0.9784, 4.66, 3.3, 2, 0.12, 2.2],
  [0.9976, 0.9202, 3.42, 2.05, 3, 0.14, 2.0],
  [0.9538, 0.9664, 2.16, 1.15, 1, 0.11, 2.4],
  [0.9856, 0.8762, 1.26, 0.42, 4, 0.16, 1.9],
  [0.9098, 1.04, 0.5, 0.0, 5, 0.18, 1.7],
];

// deterministic hand-wobble jitter — same generator as groundKit.ts's brand(), reset
// to a fixed local seed so the jitter is reproducible in isolation (established under
// W3a: the +-10% jitter never changes whether a boundary is crossed, only wobbles the
// endpoint by <=0.013u).
let bakeSeed = 0x51f3a7d;
function brand() {
  bakeSeed = (bakeSeed + 0x6d2b79f5) | 0;
  let t = Math.imul(bakeSeed ^ (bakeSeed >>> 15), 1 | bakeSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// SIX BOUNDARY ARCS at 1.03x each band's own bottom radius (groundKit.ts, "SIX
// BOUNDARY ARCS" comment).
const bounds = CLIFF_BANDS.slice(0, 6).map(([, rBot], i) => ({ r: rBot * 1.03, y: CLIFF_BANDS[i][3] }));
function arcRun(r, y, a0, a1) {
  const pts = [];
  for (let a = a0; a <= a1; a += 6) pts.push(cliffEdge(a, r, y));
  return pts;
}

// SIXTEEN SECTION CUT MARKS, gapped by CUT_GAP past each neighbouring arc (groundKit.ts,
// "SIXTEEN SECTION CUT MARKS" comment).
const CUT_GAP = 0.07;
function fixedCuts() {
  bakeSeed = 0x51f3a7d;
  const topY = CLIFF_BANDS[4][3] - CUT_GAP; // just below the band 5/6 arc
  const botY = CLIFF_BANDS[5][3] + CUT_GAP; // just above the band 6/7 arc
  const cuts = [];
  for (let a = 18; a <= 190; a += 11) {
    const j = 0.9 + brand() * 0.2;
    cuts.push([cliffEdge(a, 0.95, topY - 0.015 * j), cliffEdge(a, 0.92, botY + 0.015 * j)]);
  }
  return cuts;
}

// ---- camera basis, THE PLAN §4.4's own formula (azimuth/elevation, not a full frustum
// projection — matches the mock-scale crossing convention used to derive the shipped
// fix) ----
function basis(azDeg, elDeg) {
  const az = (azDeg * Math.PI) / 180, el = (elDeg * Math.PI) / 180;
  const R = [Math.cos(az), 0, Math.sin(az)];
  const U = [-Math.sin(el) * Math.sin(az), Math.cos(el), Math.sin(el) * Math.cos(az)];
  return { R, U };
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const proj = (p, B) => [dot(p, B.R), dot(p, B.U)];

function segX(p1, p2, p3, p4) {
  const d1 = [p2[0] - p1[0], p2[1] - p1[1]], d2 = [p4[0] - p3[0], p4[1] - p3[1]];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-12) return false;
  const t = ((p3[0] - p1[0]) * d2[1] - (p3[1] - p1[1]) * d2[0]) / den;
  const u = ((p3[0] - p1[0]) * d1[1] - (p3[1] - p1[1]) * d1[0]) / den;
  const e = 1e-6;
  return t > e && t < 1 - e && u > e && u < 1 - e;
}
function segs(run, B) {
  const pts = run.map((p) => proj(p, B));
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) out.push([pts[i], pts[i + 1]]);
  return out;
}

const cuts = fixedCuts();
const SHOTS = {
  'S1 t6 cut(7.5)': basis(136.8, 10.3),
  'S7 t58.5 cam(58.5)': basis(156.0, 50.6),
};

console.log('=== W3a strata cut x boundary-arc crossings (art bible row 4) ===');
console.log('boundary arc radii:', bounds.map((b) => b.r.toFixed(5)).join('  '));
let totalX = 0;
for (const [name, B] of Object.entries(SHOTS)) {
  const per = bounds.map((b) => {
    const arcSegs = [...segs(arcRun(b.r, b.y, 10, 75), B), ...segs(arcRun(b.r, b.y, 96, 176), B)];
    return cuts.filter((c) => {
      const cSeg = segs(c, B)[0];
      return arcSegs.some(([a, bb]) => segX(cSeg[0], cSeg[1], a, bb));
    }).length;
  });
  const tot = per.reduce((a, b) => a + b, 0);
  totalX += tot;
  console.log(`${name}: per-boundary [${per.join(', ')}] total ${tot}`);
}
console.log('total crossings (both shots):', totalX, totalX === 0 ? 'PASS — 0 crossings' : 'FAIL');
