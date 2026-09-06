#!/usr/bin/env node
// W3c-explore — candidate site search for impacts[0..2] (row 23), on the ACTUAL meshes
// `buildCliffWorld()` produces (LatheGeometry strata bands = the west face, the plateau's
// `groundDisc` CircleGeometry = the top), not hand-derived geometry. `document.createElement`
// is guarded everywhere in groundKit.ts (`if (typeof document === 'undefined') return null`),
// so the real build runs headless in node — textures come back null, geometry does not.
//
// §4.4: basis is NEVER hand-derived. Camera literals are regexed out of cliffWorld.ts's own
// `shotView([...],[...])` calls (same method as w3c-impact-crossings.mjs) and fed to the
// real `shotView` import; the projection helpers (fitFov/makeCam/toScreen) are copied
// verbatim from that script.
//
// Invoke: node --experimental-strip-types scripts/measure/w3c-site-search.mjs
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { shotView } from '../../src/film/mock/foliageKit.ts';
import { buildCliffWorld } from '../../src/film/sets/cliffWorld.ts';
import { buildRayBurst } from '../../src/film/sets/kit.ts';
import { crouchChest } from '../../src/film/actions.ts';
import { fitFov, fitPullback } from '../../src/film/framing.ts';

const deg = (r) => (r * 180) / Math.PI;
const HERE = dirname(fileURLToPath(import.meta.url));
const cliffWorldSrc = readFileSync(join(HERE, '../../src/film/sets/cliffWorld.ts'), 'utf8');

// ---- live camera literals (verbatim method from w3c-impact-crossings.mjs) --------------
function parseBase(name) {
  const re = new RegExp(`const ${name} = shotView\\(\\s*\\[([^\\]]+)\\]\\s*,\\s*\\[([^\\]]+)\\]\\s*\\)`);
  const m = cliffWorldSrc.match(re);
  if (!m) throw new Error(`could not find "const ${name} = shotView(...)" in cliffWorld.ts`);
  return { pos: m[1].split(',').map(Number), look: m[2].split(',').map(Number) };
}
const CAM4 = parseBase('CAM4_VIEW'); // timeline.ts cam(4)
const CUT75 = parseBase('CUT75_VIEW'); // timeline.ts cut(7.5)
const CAM4_VIEW = shotView(CAM4.pos, CAM4.look);
const CUT75_VIEW = shotView(CUT75.pos, CUT75.look);
console.log('cam(4)  basis: az', deg(CAM4_VIEW.az).toFixed(1), 'elev', deg(CAM4_VIEW.elev).toFixed(1));
console.log('cut(7.5) basis: az', deg(CUT75_VIEW.az).toFixed(1), 'elev', deg(CUT75_VIEW.elev).toFixed(1));

// scales, read live (law 14) the same way as w3c-impact-crossings.mjs
const blockMatch = cliffWorldSrc.match(/const impactViews = \[([\s\S]*?)\];/);
const scaleEntries = [...blockMatch[1].matchAll(/\{\s*\.\.\.(CAM4_VIEW|CUT75_VIEW),\s*scale:\s*([\d.]+)\s*\}/g)];
const SCALES = scaleEntries.map(([, , s]) => Number(s)); // [1.5, 1.5, 0.5]

// ---- projection helpers -----------------------------------------------------------------
// fitFov/fitPullback are now the REAL imports from framing.ts (never hand-derived — the
// coordinator's follow-up #1 caught this script's earlier hand-copy of fitFov and its
// missing pullback term). Pullback replicates Film.tsx's per-frame lens step VERBATIM
// (`camera.position = world.look + (authoredPos - world.look) * lens.pull`, grep
// `lens.pull` / `lens.applied` in Film.tsx) — at 1 it is the identity, and stays 1 unless
// fitFov's MAX_FOV=70 clamp engages (narrow phone aspects only), so it is applied
// unconditionally rather than skipped "because it won't matter here".
function makeCam(shot, width, height) {
  const aspect = width / height;
  const cam = new THREE.PerspectiveCamera(fitFov(aspect), aspect, 0.1, 200);
  const look = new THREE.Vector3(...shot.look);
  const authored = new THREE.Vector3(...shot.pos);
  const pull = fitPullback(aspect);
  cam.position.subVectors(authored, look).multiplyScalar(pull).add(look);
  cam.lookAt(look);
  cam.updateMatrixWorld();
  return cam;
}
function toScreen(cam, p, width, height) {
  const v = p.clone().project(cam);
  return [((v.x + 1) / 2) * width, ((1 - v.y) / 2) * height];
}
// REAL capture pixel size, not the requested --w/--h: frame.mjs's headless window loses a
// fixed 18x96 px to the (chrome-less but still cropped) viewport at every resolution asked
// so far (2880x1800 -> 2862x1704, 1440x900 -> 1422x804) — verified by reading the PNGs'
// own dimensions, not assumed. Three.js sizes its camera off the real canvas
// (window.innerWidth/innerHeight in Film.tsx's useFrame), so this is the aspect that
// actually rendered the frames read by hand, and matching it is what the follow-up asked
// to check.
const W = 1422, H = 804;
const CAM4_CAM = makeCam(CAM4, W, H);
const CUT75_CAM = makeCam(CUT75, W, H);

// ---- build the ACTUAL scene ------------------------------------------------------------
const { cliff } = buildCliffWorld();
cliff.updateMatrixWorld(true);
const CLIFF_POS = new THREE.Vector3(120, 0, 0);

// classify meshes purely by geometry shape (no .name is set anywhere in groundKit.ts):
//   strataBands() returns THREE.LatheGeometry meshes  -> the west face ("cliff")
//   groundDisc() (the plateau top) is a THREE.CircleGeometry mesh at y=6.0
const westFaceMeshes = [];
let topMesh = null;
const allMeshes = [];
cliff.traverseVisible((o) => {
  if (!o.isMesh) return;
  allMeshes.push(o);
  if (o.geometry?.type === 'LatheGeometry') westFaceMeshes.push(o);
  else if (o.geometry?.type === 'CircleGeometry' && Math.abs(o.position.y - 6.0) < 0.01) topMesh = o;
});
console.log(`\ncliff meshes: ${allMeshes.length} total, ${westFaceMeshes.length} strata bands (west face), plateau top ${topMesh ? 'found' : 'MISSING'}`);
if (westFaceMeshes.length === 0 || !topMesh) {
  console.log('STOP: could not classify the required meshes — report this verbatim, do not stub geometry.');
  process.exit(1);
}

const raycaster = new THREE.Raycaster();
function firstHit(camPos, target) {
  const dir = target.clone().sub(camPos).normalize();
  raycaster.set(camPos, dir);
  const hits = raycaster.intersectObjects(allMeshes, false);
  return hits.length ? hits[0] : null;
}

// ---- goblin screen bbox, pose-accurate (ponytail approx — see note below) --------------
// root (117.4, 6, 0), rotation.y = -pi/2 (faces world -x) for the whole of this window
// (timeline.ts: turn starts at t8.3, after impact2's t8.25 peak). H = 0.744u total height
// (cliffWorld.ts comment), W = 0.757*H ear-tip-to-ear-tip (goblin-reference.md 1.1), and
// that width runs along world Z (local +-x maps to world +z at this rotation).
//
// ponytail: goblin-reference.md is a FRONTAL spec only — no front-to-back depth ratio is
// measured anywhere in the doc, so depth is approximated as W (a round hood is roughly as
// deep as it is wide). Crouch is modelled as a single fold at a pivot 1/3 up his height
// (roughly where RIG's hip+chest sit relative to the ~0.9u raw rig, `crouchChest(amount)`
// imported rather than re-derived): the top 2/3 of him leans forward (-x, since he faces
// -x) by aboveFrac*H*sin(angle) and drops aboveFrac*H*(1-cos(angle)). The rig's own hip-drop
// term is <2% of H at these shallow crouch amounts (0.25-0.3 of CROUCH_MAX) and is skipped.
// This is a screen-bbox HINT for the site search, not a rig FK solve — the frame reads in
// the report are the ground truth.
const ROOT = new THREE.Vector3(117.4, 6, 0);
const GH = 0.744;
const GW = 0.757 * GH;
const ABOVE_FRAC = 0.67;
function goblinBox(amount) {
  const angle = crouchChest(amount);
  const fwd = ABOVE_FRAC * GH * Math.sin(angle);
  const drop = ABOVE_FRAC * GH * (1 - Math.cos(angle));
  const depthHalf = GW / 2;
  return new THREE.Box3(
    new THREE.Vector3(ROOT.x - depthHalf - fwd, ROOT.y, ROOT.z - GW / 2),
    new THREE.Vector3(ROOT.x + depthHalf, ROOT.y + GH - drop, ROOT.z + GW / 2),
  );
}
function boxCorners(box) {
  const { min, max } = box;
  return [
    [min.x, min.y, min.z], [max.x, min.y, min.z], [min.x, max.y, min.z], [max.x, max.y, min.z],
    [min.x, min.y, max.z], [max.x, min.y, max.z], [min.x, max.y, max.z], [max.x, max.y, max.z],
  ].map((p) => new THREE.Vector3(...p));
}
function screenRect(cam, points3d) {
  const pts = points3d.map((p) => toScreen(cam, p, W, H));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
function rectGap(a, b) {
  const dx = Math.max(a.x0 - b.x1, b.x0 - a.x1, 0);
  const dy = Math.max(a.y0 - b.y1, b.y0 - a.y1, 0);
  if (dx === 0 && dy === 0) return 0; // overlapping
  return Math.hypot(dx, dy);
}
function rectOverlap(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}
function rectCenter(r) {
  return [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2];
}

const GOBLIN_REST_1 = screenRect(CAM4_CAM, boxCorners(goblinBox(0))); // t5.75/7.05 rest
const GOBLIN_CROUCH_1 = screenRect(CAM4_CAM, boxCorners(goblinBox(0.3))); // amount 0.3 both peaks
const GOBLIN_REST_2 = screenRect(CUT75_CAM, boxCorners(goblinBox(0)));
const GOBLIN_CROUCH_2 = screenRect(CUT75_CAM, boxCorners(goblinBox(0.25))); // amount 0.25 @ t8.25, node model (95px width error — see report)
// coordinator round 3: use the FRAME-READ silhouette (+-10px read tolerance) instead of
// the node model for the impacts[2] search — the node box's width error was rejecting
// sites that the actual picture does not.
const FRAME_READ_GOBLIN_2 = { x0: 575, y0: 282, x1: 728, y1: 518 };
const fmtRect = (r) => `x[${r.x0.toFixed(0)},${r.x1.toFixed(0)}] y[${r.y0.toFixed(0)},${r.y1.toFixed(0)}]`;
console.log('\n--- goblin screen bbox (node projection, REST vs crouch-expanded) ---');
console.log('t5.75/7.05 (cam(4)) REST   :', fmtRect(GOBLIN_REST_1));
console.log('t5.75/7.05 (cam(4)) CROUCH :', fmtRect(GOBLIN_CROUCH_1), '(amount 0.3)');
console.log('t8.25     (cut(7.5)) REST  :', fmtRect(GOBLIN_REST_2));
console.log('t8.25     (cut(7.5)) CROUCH:', fmtRect(GOBLIN_CROUCH_2), '(amount 0.25)');

// open2 caption band, measured off w3c-explore-05/06-t8.25 (see report) — fixed screen
// rect, present for the whole cap('open2', 8, 1.6) span regardless of fade-in opacity.
const CAPTION_BAND = { x0: 375, y0: 595, x1: 1045, y1: 655 }; // measured directly off the actual 1422x804 pixels of w3c-explore-06-t8.25

// ---- candidate search -------------------------------------------------------------------
function searchWestFace() {
  const camPos = new THREE.Vector3(...CAM4.pos);
  const out = [];
  for (let x = 116.2; x <= 116.8 + 1e-9; x += 0.1) {
    for (let y = 4.8; y <= 5.8 + 1e-9; y += 0.1) {
      for (let z = -1.4; z <= 1.2 + 1e-9; z += 0.2) {
        const target = new THREE.Vector3(x, y, z);
        const hit = firstHit(camPos, target);
        if (hit && westFaceMeshes.includes(hit.object)) out.push(hit.point.clone());
      }
    }
  }
  return out;
}
function searchTop() {
  const camPos = new THREE.Vector3(...CUT75.pos);
  const out = [];
  // extended per coordinator round 3: x 116.9-119.0, z -2.8-1.5 (was 117.0-119.0 / -1.5-1.5)
  for (let x = 116.9; x <= 119.0 + 1e-9; x += 0.1) {
    for (let z = -2.8; z <= 1.5 + 1e-9; z += 0.1) {
      const target = new THREE.Vector3(x, 6.1, z);
      const hit = firstHit(camPos, target);
      if (hit && hit.object === topMesh) out.push(hit.point.clone());
    }
  }
  return out;
}

function evaluate(hitsWorld, camShot, cam, scale, goblinRect, band) {
  const rows = [];
  for (const p of hitsWorld) {
    const local = p.clone().sub(CLIFF_POS);
    const view = { ...(camShot === CAM4 ? CAM4_VIEW : CUT75_VIEW), scale };
    const burst = buildRayBurst(local.x, local.y, local.z, view);
    burst.scale.set(1, 1, 1);
    burst.position.set(local.x + 120, local.y, local.z); // world position for projection
    burst.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(burst);
    const rect = screenRect(cam, boxCorners(box));
    const overlapGoblin = rectOverlap(rect, goblinRect);
    const gap = rectGap(rect, goblinRect);
    const [cx, cy] = rectCenter(rect);
    const [gx, gy] = rectCenter(goblinRect);
    const distance = Math.hypot(cx - gx, cy - gy);
    const overlapBand = band ? rectOverlap(rect, band) : false;
    rows.push({ local, mesh: camShot === CAM4 ? 'strata band (west face)' : 'plateau top (groundDisc)', gap, distance, overlapGoblin, overlapBand, rect });
  }
  rows.sort((a, b) => b.gap - a.gap);
  return rows;
}
function stats(name, rows) {
  const g12 = rows.filter((r) => r.gap >= 12).length;
  const d140 = rows.filter((r) => r.distance <= 140).length;
  const noOv = rows.filter((r) => !r.overlapGoblin && !r.overlapBand).length;
  const all = rows.filter((r) => r.gap >= 12 && r.distance <= 140 && !r.overlapGoblin && !r.overlapBand).length;
  console.log(`  gate summary — ${name}: n=${rows.length} gap>=12:${g12} dist<=140:${d140} noOverlap:${noOv} ALL GATES:${all}`);
}

// sanity anchor — where does the ORIGINAL (broken, shipped) impacts[2] local position
// project? Confirms the model reproduces the filed defect (W3-V4: gap should read ~0).
{
  const orig = new THREE.Vector3(-2.0, 6.08, -0.5).add(CLIFF_POS);
  const burst = buildRayBurst(-2.0, 6.08, -0.5, { ...CUT75_VIEW, scale: 0.5 });
  burst.scale.set(1, 1, 1);
  burst.position.set(orig.x, orig.y, orig.z);
  burst.updateMatrixWorld(true);
  const rect = screenRect(CUT75_CAM, boxCorners(new THREE.Box3().setFromObject(burst)));
  console.log(`\nsanity check — shipped impacts[2] local (-2.0,6.08,-0.5): gap ${rectGap(rect, FRAME_READ_GOBLIN_2).toFixed(1)}px vs goblin (W3-V4 predicts ~0)`);
}

const hits0 = searchWestFace(); // shared grid serves impacts[0] and [1] (same shot, same face)
const rows0 = evaluate(hits0, CAM4, CAM4_CAM, SCALES[0], GOBLIN_CROUCH_1, null);
const rows1 = evaluate(hits0, CAM4, CAM4_CAM, SCALES[1], GOBLIN_CROUCH_1, null);
const hits2 = searchTop();
const rows2 = evaluate(hits2, CUT75, CUT75_CAM, SCALES[2], FRAME_READ_GOBLIN_2, CAPTION_BAND);
console.log('\n--- gate pass counts (of unoccluded on-target candidates) ---');
stats('impacts[0]', rows0); stats('impacts[1]', rows1); stats('impacts[2]', rows2);

function printTop(name, rows) {
  console.log(`\n--- ${name}: ${rows.length} unoccluded on-target candidates, top 5 by gap ---`);
  if (rows.length === 0) {
    console.log('  NONE FOUND — no unoccluded site on the target mesh from this camera.');
    return;
  }
  for (const r of rows.slice(0, 5)) {
    console.log(
      `  cliff-local (${r.local.x.toFixed(3)}, ${r.local.y.toFixed(3)}, ${r.local.z.toFixed(3)}) ` +
      `on ${r.mesh} | gap ${r.gap.toFixed(1)}px | dist-to-goblin-centre ${r.distance.toFixed(1)}px | ` +
      `overlapsGoblin=${r.overlapGoblin} overlapsCaption=${r.overlapBand}`,
    );
  }
  const best = rows[0];
  if (best.gap < 12) {
    console.log(`  STOP-CONDITION: best gap found is ${best.gap.toFixed(1)}px, under the 12px floor.`);
  }
}
printTop('impacts[0] (cam(4), scale 1.5)', rows0);
printTop('impacts[1] (cam(4), scale 1.5)', rows1);
printTop('impacts[2] (cut(7.5), scale 0.5, plateau top)', rows2);

function recommend(name, rows) {
  const ok = rows.filter((r) => !r.overlapGoblin && !r.overlapBand && r.gap >= 12 && r.distance <= 140);
  if (ok.length) {
    const r = ok[0];
    console.log(
      `\n${name} RECOMMEND: cliff-local (${r.local.x.toFixed(3)}, ${r.local.y.toFixed(3)}, ${r.local.z.toFixed(3)}) — ` +
      `largest clearance (${r.gap.toFixed(1)}px) while staying within the rim's own convergence radius (${r.distance.toFixed(1)}px <= 140).`,
    );
    return;
  }
  // no candidate clears all four gates — report the best gap that at least clears the
  // goblin (law 1: report the miss, never quietly relax a gate) and name which gate breaks.
  const clean = rows.filter((r) => !r.overlapGoblin && r.gap >= 12).sort((a, b) => a.distance - b.distance)[0];
  if (!clean) {
    console.log(`\n${name}: NO candidate clears the goblin at all with gap>=12 — best gap found: ${rows[0]?.gap.toFixed(1) ?? 'n/a'}px.`);
    return;
  }
  console.log(
    `\n${name}: NO candidate clears every gate. Best available: cliff-local (${clean.local.x.toFixed(3)}, ${clean.local.y.toFixed(3)}, ${clean.local.z.toFixed(3)}) — ` +
    `gap ${clean.gap.toFixed(1)}px (clears the goblin) but dist ${clean.distance.toFixed(1)}px > 140 and overlapsCaption=${clean.overlapBand}. ` +
    `Every unoccluded top-surface point far enough from the goblin to clear him lands past the 140px convergence radius and into the open2 caption band — ` +
    `report to BUILDER, do not silently relax the gate.`,
  );
}
console.log('\n--- recommendations ---');
recommend('impacts[0]', rows0);
recommend('impacts[1]', rows1);
recommend('impacts[2]', rows2);

// ---- follow-up #2 (round 3): impacts[0]/[1] LATERAL not stacked ------------------------
// rank-1 site shared; impact[1] now requires |dz|>=0.4u (sideways across the face) AND
// |dy|<=0.2u (not stacked above/below) from rank1, best gap first (rows1 pre-sorted).
console.log('\n--- follow-up #2 (round 3): lateral impacts[0]/[1] sites ---');
const rank1 = rows0[0];
const rank1Str = `(${rank1.local.x.toFixed(3)}, ${rank1.local.y.toFixed(3)}, ${rank1.local.z.toFixed(3)})`;
const lateral = rows1.find((r) => Math.abs(r.local.z - rank1.local.z) >= 0.4 && Math.abs(r.local.y - rank1.local.y) <= 0.2);
console.log(`  impacts[0] rank1: local ${rank1Str} gap ${rank1.gap.toFixed(1)}px dist ${rank1.distance.toFixed(1)}px centre (${rectCenter(rank1.rect).map((v) => v.toFixed(0))})`);
if (lateral) {
  const sep = Math.hypot(...rectCenter(rank1.rect).map((v, i) => v - rectCenter(lateral.rect)[i]));
  console.log(`  impacts[1] |dz|>=0.4u & |dy|<=0.2u: local (${lateral.local.x.toFixed(3)}, ${lateral.local.y.toFixed(3)}, ${lateral.local.z.toFixed(3)}) gap ${lateral.gap.toFixed(1)}px dist ${lateral.distance.toFixed(1)}px centre (${rectCenter(lateral.rect).map((v) => v.toFixed(0))}) | screen separation = ${sep.toFixed(1)}px`);
} else {
  console.log('  NONE of the 207 gate-passing sites is lateral (|dz|>=0.4u, |dy|<=0.2u) from rank1 — report as a miss, do not relax.');
}

// ---- follow-up #3 (round 3): impacts[2] against the FRAME-READ goblin box, wider grid --
function printTop8(label, rows) {
  console.log(`\n  ${label} (top 8 by gap, n=${rows.length}):`);
  if (!rows.length) { console.log('    NONE.'); return; }
  for (const r of rows.slice(0, 8).sort((a, b) => b.gap - a.gap)) {
    console.log(
      `    local (${r.local.x.toFixed(3)}, ${r.local.y.toFixed(3)}, ${r.local.z.toFixed(3)}) | ` +
      `gap ${r.gap.toFixed(1)}px | dist ${r.distance.toFixed(1)}px | caption=${r.overlapBand} | rect ${fmtRect(r.rect)}`,
    );
  }
}
console.log('\n--- follow-up #3 (round 3): impacts[2] vs frame-read goblin box ---');
console.log(`  frame-read goblin box (+-10px): ${fmtRect(FRAME_READ_GOBLIN_2)} | caption band: ${fmtRect(CAPTION_BAND)}`);
const tableA2 = rows2.filter((r) => r.distance <= 140);
const tableB2 = rows2.filter((r) => r.distance <= 195);
printTop8('(A) dist<=140', tableA2);
printTop8('(B) dist<=195 (0.9x his 217px height)', tableB2);
if (tableA2.length) {
  const r1 = [...tableA2].sort((a, b) => b.gap - a.gap)[0];
  console.log(`  (A) rank-1 site for the frame READ: local (${r1.local.x.toFixed(3)}, ${r1.local.y.toFixed(3)}, ${r1.local.z.toFixed(3)}), rect ${fmtRect(r1.rect)} — READ w3c-explore-05 (t8.25 perf) at that rect to confirm painted plateau vs rim/paper (see report).`);
}
