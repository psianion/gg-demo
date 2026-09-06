#!/usr/bin/env node
// W1-VERIFY gate: W1b basis (THE PLAN §4.4 / DISPATCH W1-verify).
// VERIFIER script — independent of the builder's w1b-pine-basis.mjs (never run, never
// cited). Extracts each set's `shotView(cam, look)` call args by regex from the set file
// itself, and the timeline's `cut(`/`cam(` line the set's own comment cites, then asserts
// the two vectors are byte-identical (not "close") — the bracket is only correct if it
// reads the SAME camera the timeline actually stages for that beat.
//
// Usage: node scripts/measure/w1-verify-basis.mjs   (run from story/story)

import { readFileSync } from 'node:fs';

const timeline = readFileSync('src/film/timeline.ts', 'utf8');

const cases = [
  {
    set: 'ambush.ts', beat: 'S1/S2 ambush treeline — cut(16.5)',
    setPattern: /const v = shotView\(\[([\d.,\s-]+)\], \[([\d.,\s-]+)\]\);\n\s*setView\(v\.az, v\.elev\);/,
    timelinePattern: /cut\(16\.5, \[([\d.,\s-]+)\], \[([\d.,\s-]+)\]\)/,
  },
  {
    set: 'theatre.ts', beat: 'S4 forest — cam(30)',
    setPattern: /const vForest = shotView\(\[([\d.,\s-]+)\], \[([\d.,\s-]+)\]\);/,
    timelinePattern: /cam\(30, 1\.5, \[([\d.,\s-]+)\], \[([\d.,\s-]+)\]/,
  },
  {
    set: 'theatre.ts', beat: 'S4 foot pines — same cam(30) shot',
    setPattern: /const vFoot = shotView\(\[([\d.,\s-]+)\], \[([\d.,\s-]+)\]\);/,
    timelinePattern: /cam\(30, 1\.5, \[([\d.,\s-]+)\], \[([\d.,\s-]+)\]/,
  },
  {
    set: 'montage.ts', beat: 'S6 montage vignette-3 saplings — c5Xs[3]/c5Shots[3]',
    setPattern: /const vSaplings = shotView\(\[([\d.,\s-]+)\], \[([\d.,\s-]+)\]\);/,
    // reconstructed, not a literal cut()/cam() line: x=c5Xs[3]=24, shot=c5Shots[3]
    // {focus:[0.55,1.0,0.2], cam:[1.7,1.8,3.05]}, world z offset -40 (verified by reading
    // timeline.ts's c5Xs.forEach block directly: cam=[x+1.7,1.8,-40+3.05], focus=[x+0.55,1.0,-40+0.2])
    reconstructed: { cam: [24 + 1.7, 1.8, -40 + 3.05], look: [24 + 0.55, 1.0, -40 + 0.2] },
  },
  {
    set: 'cliffWorld.ts', beat: 'S7 cliffWorld miniature — cam(58.5)',
    setPattern: /const vMini = shotView\(\[([\d.,\s-]+)\], \[([\d.,\s-]+)\]\);/,
    timelinePattern: /cam\(58\.5, 3\.5, \[([\d.,\s-]+)\], \[([\d.,\s-]+)\]/,
  },
];

const parseNums = (s) => s.split(',').map((n) => Number(n.trim()));
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

let allPass = true;
for (const c of cases) {
  const setSrc = readFileSync(`src/film/sets/${c.set}`, 'utf8');
  const m = setSrc.match(c.setPattern);
  if (!m) { console.log(`FAIL  ${c.set} (${c.beat}): shotView call not found by pattern`); allPass = false; continue; }
  const setCam = parseNums(m[1]);
  const setLook = parseNums(m[2]);
  let refCam, refLook, refSrcText;
  if (c.reconstructed) {
    refCam = c.reconstructed.cam; refLook = c.reconstructed.look;
    refSrcText = '(reconstructed from timeline.ts c5Xs.forEach + c5Shots[3], not a literal cut/cam line)';
  } else {
    const tm = timeline.match(c.timelinePattern);
    if (!tm) { console.log(`FAIL  ${c.set} (${c.beat}): timeline pattern not found`); allPass = false; continue; }
    refCam = parseNums(tm[1]); refLook = parseNums(tm[2]);
    refSrcText = tm[0];
  }
  const camMatch = eq(setCam, refCam);
  const lookMatch = eq(setLook, refLook);
  const pass = camMatch && lookMatch;
  allPass = allPass && pass;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${c.set} (${c.beat})`);
  console.log(`  shotView cam=[${setCam}] look=[${setLook}]`);
  console.log(`  timeline cam=[${refCam}] look=[${refLook}]   from: ${refSrcText}`);
  console.log(`  cam match: ${camMatch}   look match: ${lookMatch}`);
}
console.log(`\nGATE: ${allPass ? 'PASS' : 'FAIL'} — every setView(shotView(...)) bracket uses the exact camera its own beat's cut()/cam() stages.`);
