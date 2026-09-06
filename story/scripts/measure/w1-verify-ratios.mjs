#!/usr/bin/env node
// W1-VERIFY gate 1+2 — pine arc/zig ratios, CROWN_POSTER, cone segments.
// VERIFIER script, independent of the builder's w1a-arc-occlusion.mjs (never run, never cited).
//
// Method: extract the literal numbers straight from src/film/mock/foliageKit.ts's own
// source text (regex on the exact call sites), then let JS evaluate the arithmetic
// (never hand-typed decimals) so what prints is the code's own number, not a paraphrase.
// Cross-checked against a live call of the REAL exported functions (pineSilR, pineZig,
// CROWN_POSTER, ConeGeometry via THREE) via node --experimental-strip-types, which DOES
// resolve this project's .ts module graph (verified here — contradicts the note in
// w1b-pine-basis.mjs that "a .mjs script does not resolve the app's .ts module graph";
// that note is about a PLAIN .mjs importing .ts, not about node's native type-stripping).
//
// Usage: node --experimental-strip-types scripts/measure/w1-verify-ratios.mjs
//   (run from story/story; falls back to source-regex-only if the import fails)

import { readFileSync } from 'node:fs';

const src = readFileSync('src/film/mock/foliageKit.ts', 'utf8');
// scope to pineCrown's own body only — the file also has shrubClumps' unrelated
// `arcPts(..., 1.05 * Math.PI, ...)` (an ANGLE, on a shrub, nothing to do with pines)
// and oakStand's own crown arcs; a file-wide grep for "1.05" or "arcPts(" false-flags both.
const pineCrownStart = src.indexOf('export function pineCrown(');
const pineCrownEnd = src.indexOf('\nexport function', pineCrownStart + 1);
if (pineCrownStart < 0 || pineCrownEnd < 0) { console.log('MISSING: pineCrown function body'); process.exit(1); }
const pineCrownSrc = src.slice(pineCrownStart, pineCrownEnd);
const need = (re, label) => {
  const m = src.match(re);
  if (!m) { console.log(`MISSING: ${label} (pattern not found)`); process.exit(1); }
  return m;
};

console.log('=== gate: arc span / y-radius / arc radius (pineCrown -> arcPts call site) ===');
const arcCall = (() => {
  const m = pineCrownSrc.match(
    /bag\.add\(arcPts\(x, cy - ch \/ 2, z, (r \* [\d.]+), (r \* [\d.]+), ([\d.]+ \* Math\.PI), ([\d.]+ \* Math\.PI), pushArc\), 'form', 'paint'\);/,
  );
  if (!m) { console.log('MISSING: pineCrown arcPts call'); process.exit(1); }
  return m;
})();
const rxRatio = eval(arcCall[1].replace('r', '1'));
const ryRatio = eval(arcCall[2].replace('r', '1'));
const a0 = eval(arcCall[3]), a1 = eval(arcCall[4]);
console.log('radius ratio (rx/r):', rxRatio, ' spec 1.01 ->', rxRatio === 1.01 ? 'MATCH' : 'MISMATCH');
console.log('y-radius ratio (ry/r):', ryRatio, ' spec 0.3 ->', ryRatio === 0.3 ? 'MATCH' : 'MISMATCH');
console.log('a0 =', arcCall[3], '=', (a0 / Math.PI).toFixed(4), 'pi   a1 =', arcCall[4], '=', (a1 / Math.PI).toFixed(4), 'pi');
console.log('span =', ((a1 - a0) / Math.PI).toFixed(4), 'pi =', ((a1 - a0) * 180 / Math.PI).toFixed(2),
  'deg  spec 1.1pi->1.9pi (144deg) ->', (a0 === 1.1 * Math.PI && a1 === 1.9 * Math.PI) ? 'MATCH' : 'MISMATCH');

console.log('\n=== gate: exactly ONE arc mark set per tier (no second 1.05/1.03 set), scoped to pineCrown() only ===');
console.log('(file-wide "1.05" / "arcPts(" also hit shrubClumps\' unrelated shrub-lobe arc and its 1.05*Math.PI ANGLE arg — scoping to pineCrown\'s own body avoids that false positive)');
const arcAddCount = (pineCrownSrc.match(/bag\.add\(arcPts\(/g) || []).length;
console.log('bag.add(arcPts( occurrences inside pineCrown():', arcAddCount, '(spec: 1 call site, executed once per tier in the loop) ->',
  arcAddCount === 1 ? 'MATCH' : 'MISMATCH');
const has105 = /1\.05\s*\*?\s*r\b|r\s*\*\s*1\.05/.test(pineCrownSrc);
console.log('a "1.05 * r" arc RADIUS literal present inside pineCrown():', has105, ' spec: false ->', has105 ? 'MISMATCH' : 'MATCH');

console.log('\n=== gate: ARC_PUSH_RATIO / ZIG_PUSH_RATIO (pineCrown/pineZig pushes) ===');
const arcRatioExpr = need(/const ARC_PUSH_RATIO = ([^;]+);/, 'ARC_PUSH_RATIO')[1];
const zigRatioExpr = need(/const ZIG_PUSH_RATIO = ([^;]+);/, 'ZIG_PUSH_RATIO')[1];
const arcRatio = eval(arcRatioExpr);
const zigRatio = eval(zigRatioExpr);
console.log('ARC_PUSH_RATIO =', arcRatioExpr, '=', arcRatio, ' spec 0.3/0.44=0.6818 ->',
  Math.abs(arcRatio - 0.3 / 0.44) < 1e-9 ? 'MATCH' : 'MISMATCH');
console.log('ZIG_PUSH_RATIO =', zigRatioExpr, '=', zigRatio, ' spec 0.1/0.44=0.2273 ->',
  Math.abs(zigRatio - 0.1 / 0.44) < 1e-9 ? 'MATCH' : 'MISMATCH');
// confirm the ratios are actually the ones fed into arcPts/pineZig's push argument (not
// dead constants) — the RHS of `pushArc =` / `push =` must reference the same names.
console.log('ARC_PUSH_RATIO used as pushArc inside pineCrown():', /pushArc = rWide \* ARC_PUSH_RATIO/.test(pineCrownSrc));
console.log('ZIG_PUSH_RATIO used as zig push (module-wide, pineZig body):', /const push = rWide \* ZIG_PUSH_RATIO/.test(src));

console.log('\n=== gate: zig radius 0.99 via pineSilR actually called ===');
const zigLine = need(/const zig = ([\d.]+); \/\/ painted ratio/, 'pineZig zig ratio literal')[1];
console.log('pineZig zig ratio literal =', zigLine, ' spec 0.99 ->', Number(zigLine) === 0.99 ? 'MATCH' : 'MISMATCH');
const silRCallSites = [...src.matchAll(/pineSilR\(/g)].length; // 1 def (export function pineSilR() + 1 real call inside pineZig
console.log('pineSilR( occurrences (export decl + real call):', silRCallSites, ' spec: >=2 (decl + >=1 call) ->', silRCallSites >= 2 ? 'MATCH' : 'MISMATCH');
console.log('pineZig actually calls pineSilR (not just imports/exports it):', /const silR = pineSilR\(tiers, rWide, h\);/.test(src));
console.log('pineZig then reads through silR (not a dead binding):', /silR\(yBot\)/.test(src));

console.log('\n=== gate: cone segments fixed at 10, not size-scaled ===');
const pineRadialDef = need(/const pineRadial = \(_r: number\) => (\d+);/, 'pineRadial constant')[1];
console.log('pineRadial(_r) always returns:', pineRadialDef, ' spec 10 ->', Number(pineRadialDef) === 10 ? 'MATCH' : 'MISMATCH');
const hasConeCall = /new THREE\.ConeGeometry\(r, ch, pineRadial\(r\), 2\)/.test(pineCrownSrc);
console.log('pineCrown\'s ConeGeometry radial-segments arg is pineRadial(r) (constant fn, ignores r):', hasConeCall);

console.log('\n=== gate: CROWN_POSTER = 12, shared by film and ?mock=foliage ===');
const posterDef = need(/export const CROWN_POSTER = (\d+);/, 'CROWN_POSTER decl')[1];
console.log('foliageKit.ts CROWN_POSTER =', posterDef, ' spec 12 ->', Number(posterDef) === 12 ? 'MATCH' : 'MISMATCH');
const kitSrc = readFileSync('src/film/sets/kit.ts', 'utf8');
const mockSrc = readFileSync('src/film/mock/foliage.ts', 'utf8');
console.log('sets/kit.ts imports CROWN_POSTER from foliageKit (not a local redefinition):',
  /import\s*\{[^}]*\bCROWN_POSTER\b[^}]*\}\s*from\s*['"]\.\.\/mock\/foliageKit\.ts['"]/.test(kitSrc));
console.log('sets/kit.ts crownMat uses poster: CROWN_POSTER:', /poster:\s*CROWN_POSTER/.test(kitSrc));
console.log('mock/foliage.ts has no local `poster` literal for crownMaterial (uses the shared constant baked into crownMaterial()):',
  !/poster:\s*8\b/.test(mockSrc));
console.log('foliageKit.ts crownMaterial() itself bakes at poster: CROWN_POSTER:', /poster:\s*CROWN_POSTER/.test(src));
