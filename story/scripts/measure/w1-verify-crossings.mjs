#!/usr/bin/env node
// W1-VERIFY gate: crossings (THE PLAN §4.5 / DISPATCH W1-verify).
// VERIFIER script — independent of the builder's w1a-arc-occlusion.mjs (never run, never
// cited). Calls the REAL exported foliageKit functions directly (node's native TS
// type-stripping DOES resolve this project's .ts module graph — verified live; the note in
// w1b-pine-basis.mjs that ".mjs cannot resolve .ts" only applies to a plain .mjs, not to
// `node --experimental-strip-types`).
//
// Geometry source: `pineProfile` (real, exported) gives the three (cy,r,ch) tiers for any
// (rWide,h). Each tier's arc is `arcPts` (real, exported) called with the exact args
// pineCrown itself uses (verified by reading pineCrown's body, and independently by
// w1-verify-ratios.mjs: rx=r*1.01, ry=r*0.3, a0=1.1*PI, a1=1.9*PI, push=rWide*(0.3/0.44)).
// Each side's zigzag is `pineZig` (real, exported, unmodified) called directly — no
// reimplementation, pineSilR runs for real inside it.
//
// Deliberately working with the RAW point arrays (pre-`polyline()`/`strokes()`) rather
// than the built StrokeBag: `strokes()` subdivides long segments for wobble (SUB/SUB_MIN
// in pencil.ts), which multiplies segment count without changing crossing topology (the
// bow amplitude is sub-pixel) — using raw points avoids re-deriving that subdivision count
// while keeping the exact same construction math. The joint-overshoot exclusion
// (`over = min(len*0.06, 0.05)`, pencil.ts `strokes()`) is applied per RAW segment, which is
// where the real overshoot is actually added (subdivision happens strictly between the
// already-extended endpoints, so it cannot change what is or isn't a genuine crossing).
//
// Usage: node --experimental-strip-types scripts/measure/w1-verify-crossings.mjs
//   (run from story/story)

import * as THREE from 'three';
import { pineProfile, pineZig, arcPts, setView, kseed } from '../../src/film/mock/foliageKit.ts';
import { heroFraming, HERO_FOV } from '../../src/film/stages/hero.ts';

setView(); // HERO_AZ/HERO_ELEV — the default lens, matching hero.ts's own VIEW_R/VIEW_CAM
const ARC_PUSH_RATIO = 0.3 / 0.44; // verified against foliageKit.ts source by w1-verify-ratios.mjs

function toSegs(pts) {
  const s = [];
  for (let i = 0; i < pts.length - 1; i++) s.push([[pts[i].x, pts[i].y, pts[i].z], [pts[i + 1].x, pts[i + 1].y, pts[i + 1].z]]);
  return s;
}

// Builds the 5 strokes (arc0, arc1, arc2, zigLeft, zigRight) for one pine, via the REAL
// pineProfile/arcPts/pineZig — pineCrown's own construction, called the same way it does.
function buildPineStrokes(rWide, h, seed) {
  kseed(seed); // reset the shared PRNG so hero and film builds see the SAME jitter draw —
  // arcPts'/pineZig's ±3% wobble is a shared global generator (foliageKit.ts `let seed`),
  // and comparing without resetting it would let PRNG state order (not construction)
  // decide a borderline crossing.
  const tiers = pineProfile(rWide, h);
  const pushArc = rWide * ARC_PUSH_RATIO;
  const arcs = tiers.map(([cy, r, ch]) => toSegs(arcPts(0, cy - ch / 2, 0, r * 1.01, r * 0.3, 1.1 * Math.PI, 1.9 * Math.PI, pushArc)));
  const zigL = toSegs(pineZig(rWide, h, 0, 0, tiers, -1));
  const zigR = toSegs(pineZig(rWide, h, 0, 0, tiers, 1));
  return { arc0: arcs[0], arc1: arcs[1], arc2: arcs[2], zigL, zigR };
}

function projectSeg(cam, [a, b]) {
  const pa = new THREE.Vector3(...a).project(cam);
  const pb = new THREE.Vector3(...b).project(cam);
  return [[pa.x, pa.y], [pb.x, pb.y]];
}

function intersect([p1, p2], [p3, p4]) {
  const [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3, [x4, y4] = p4;
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(d) < 1e-12) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { t, u };
}

function overshootMargin(worldSeg) {
  const [a, b] = worldSeg;
  const len = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  return Math.min(len * 0.06, 0.05); // pencil.ts strokes(): over = min(len*0.06, 0.05)
}

function countCrossings(cam, strokesWorld) {
  const names = Object.keys(strokesWorld);
  let crossings = 0;
  const detail = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      for (const wa of strokesWorld[names[i]]) {
        for (const wb of strokesWorld[names[j]]) {
          const hit = intersect(projectSeg(cam, wa), projectSeg(cam, wb));
          if (!hit) continue;
          const lenA = Math.hypot(wa[0][0] - wa[1][0], wa[0][1] - wa[1][1], wa[0][2] - wa[1][2]);
          const lenB = Math.hypot(wb[0][0] - wb[1][0], wb[0][1] - wb[1][1], wb[0][2] - wb[1][2]);
          const mA = overshootMargin(wa), mB = overshootMargin(wb);
          const distFromAEnd = Math.min(hit.t, 1 - hit.t) * lenA;
          const distFromBEnd = Math.min(hit.u, 1 - hit.u) * lenB;
          if (distFromAEnd < mA || distFromBEnd < mB) continue; // joint-overshoot exclusion
          crossings++;
          detail.push(`${names[i]}x${names[j]}`);
        }
      }
    }
  }
  return { crossings, detail };
}

const cam = new THREE.PerspectiveCamera(HERO_FOV, 1440 / 900, 0.1, 200);
const f = heroFraming(1440, 900);
cam.position.copy(f.position);
cam.lookAt(f.look);
cam.updateMatrixWorld();

console.log('=== hero-equivalent pine: pineProfile(0.44, 1.49) == hero.ts\'s own tier table ===');
console.log('(cy0=0.369*1.49=0.550, r0=1.0*0.44=0.440, ch0=0.376*1.49=0.560 == hero.ts literal [0.55,0.44,0.56]; tiers 1/2 check the same way)');
console.log('5 seeds, to keep a borderline crossing from being decided by PRNG state order rather than construction:\n');

const filmSizes = [
  { file: 'ambush.ts', r: 0.7, h: 2.2 },
  { file: 'theatre.ts', r: 0.34, h: 0.9 },
  { file: 'montage.ts', r: 0.5, h: 1.4 },
  { file: 'cliffWorld.ts', r: 0.18, h: 0.5 },
];
const seeds = [1, 2, 3, 4, 5];
let overallPass = true;
let heroMax = 0, filmMax = 0;
for (const seed of seeds) {
  const heroResult = countCrossings(cam, buildPineStrokes(0.44, 1.49, seed));
  heroMax = Math.max(heroMax, heroResult.crossings);
  let rowWorst = 0, rowDetail = '';
  for (const { file, r, h } of filmSizes) {
    const result = countCrossings(cam, buildPineStrokes(r, h, seed));
    filmMax = Math.max(filmMax, result.crossings);
    if (result.crossings > rowWorst) { rowWorst = result.crossings; rowDetail = `${file}=${result.crossings}`; }
    if (result.crossings > heroResult.crossings) overallPass = false;
  }
  console.log(`seed ${seed}: hero=${heroResult.crossings} [${heroResult.detail.join(',')}]   film worst=${rowWorst} (${rowDetail})   film<=hero? ${rowWorst <= heroResult.crossings}`);
}
console.log(`\nGATE: ${overallPass ? 'PASS' : 'FAIL'}  (across ${seeds.length} seeds: hero max ${heroMax}, film max ${filmMax}; film must be <= hero at every seed)`);
