import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EASE_SCRUB, RUNTIME, SCRUB } from '../src/film/motion.ts';

// ---- the clock constants are the documented invariants (motion §4) ---------------
assert.equal(RUNTIME, 66, 'the film is authored 0..66t');
assert.equal(SCRUB, 0.8, 'the numeric scrub settles over 0.8s');
assert.equal(EASE_SCRUB, 'none', 'the scrub lane is linear');

// strip comments so commented-out code (or a comment naming the forbidden API) can
// neither satisfy nor trip an assertion
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const src = readFileSync(new URL('../src/film/timeline.ts', import.meta.url), 'utf8');
const code = stripComments(src);

// ---- the master timeline: paused, linear default, scrubbed by the gearing drive --
assert.ok(
  code.includes(`gsap.timeline({ paused: true, defaults: { ease: EASE_SCRUB } })`),
  'master timeline is paused with the scrub-lane default ease',
);
assert.ok(
  /duration:\s*SCRUB/.test(code),
  'the gearing drive re-implements the numeric scrub with the SCRUB token',
);

// ---- the endcap hold pins tl.duration() to exactly RUNTIME -----------------------
// Without it the last authored tween (~t65.716) set the duration, scroll fraction 1.0
// was not t66, and play mode ran ~0.4% slow.
assert.ok(/tl\.set\(\{\},\s*\{\},\s*RUNTIME\)/.test(code), 'endcap hold at RUNTIME exists');

// ---- freeze = tweened world.timeScale, never the global clock --------------------
assert.ok(
  /tl\.to\(world,\s*\{\s*timeScale:/.test(code),
  'timeScale freezes are tweens on the master timeline',
);
const srcDir = fileURLToPath(new URL('../src', import.meta.url));
for (const f of readdirSync(srcDir, { recursive: true }) as string[]) {
  if (!/\.(ts|tsx)$/.test(f)) continue;
  const body = stripComments(readFileSync(join(srcDir, f), 'utf8'));
  assert.ok(!body.includes('globalTimeline'), `${f} touches gsap.globalTimeline`);
}

// ---- tl.set pair spacing (motion §4 scrub-safety) --------------------------------
// Paired tl.sets at the SAME position on the same target replay in reverse order on a
// backward scrub — the shipped page-turn-flash bug class. Static rule: for any one
// target, numeric-literal positions sit >=0.02t apart, and no two distinct call sites
// share the same symbolic position expression. (Numeric vs symbolic cannot be
// cross-compared statically; each kind is checked within itself.)
const setCall = /tl\.set\(\s*([\s\S]*?),\s*\{([\s\S]*?)\}\s*,\s*([\s\S]*?)\)/g;
const byTarget = new Map<string, { nums: number[]; syms: string[] }>();
let sites = 0;
for (const m of code.matchAll(setCall)) {
  sites += 1;
  const target = m[1].trim();
  const pos = m[3].trim().replace(/,\s*$/, '');
  const group = byTarget.get(target) ?? { nums: [], syms: [] };
  const n = Number(pos);
  if (Number.isFinite(n)) group.nums.push(n);
  else group.syms.push(pos);
  byTarget.set(target, group);
}
// parser sanity — the beat sheet holds ~40 tl.set call sites; a regex gone stale
// would otherwise pass vacuously
assert.ok(sites >= 35, `parsed only ${sites} tl.set call sites — parser or beat sheet drifted`);

for (const [target, { nums, syms }] of byTarget) {
  nums.sort((a, b) => a - b);
  for (let i = 1; i < nums.length; i++) {
    assert.ok(
      nums[i] - nums[i - 1] >= 0.02,
      `${target}: tl.set pair at t${nums[i - 1]} / t${nums[i]} closer than 0.02t`,
    );
  }
  assert.equal(
    new Set(syms).size,
    syms.length,
    `${target}: two tl.set call sites share a position expression (${syms.join(', ')})`,
  );
}

console.log('clocks ok');
