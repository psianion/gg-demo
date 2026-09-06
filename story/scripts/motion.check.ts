import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BOIL,
  BREATH_RATE,
  EASE_SCRUB,
  FLICKER,
  HERO_DOLLY,
  IDLE_THROTTLE,
  MOTH_ORBIT_S,
  PARALLAX_CAP_DEG,
  PUPPET,
  SETTLE,
  STRIDE_RATE,
  T_BEAT,
  T_BLOOM_CTA,
  T_BLOOM_MAX,
  T_BLOOM_MIN,
  T_CAM_MAX,
  T_CAM_MIN,
  T_DRAIN_MAX,
  T_DRAIN_MIN,
  T_EXHALE,
  T_FLICK,
  T_GESTURE,
  T_PUNCH,
  T_REVEAL,
  T_UI,
  T_UI_MAX,
  UI_RISE_MAX_PX,
} from '../src/film/motion.ts';

// ---- every duration in the scale, at its documented value (motion §3.1) ----------
assert.equal(T_FLICK, 0.12);
assert.equal(T_UI, 0.2);
assert.equal(T_UI_MAX, 0.25);
assert.equal(T_BEAT, 0.4);
assert.equal(T_PUNCH, 0.25);
assert.equal(T_GESTURE, 0.5);
assert.equal(T_REVEAL, 0.8);
assert.equal(T_DRAIN_MIN, 0.5);
assert.equal(T_DRAIN_MAX, 1.4);
assert.equal(T_EXHALE, 0.3);
assert.equal(T_CAM_MIN, 1.5);
assert.equal(T_CAM_MAX, 2.5);
assert.equal(T_BLOOM_MIN, 0.8);
assert.equal(T_BLOOM_MAX, 1.2);
assert.equal(T_BLOOM_CTA, 0.18);

// ---- the dead zone: no UI token between 0.25s and 0.4s ---------------------------
// The gap is what keeps UI-speed and world-speed legibly different.
for (const [name, v] of Object.entries({ T_FLICK, T_UI, T_UI_MAX, T_BLOOM_CTA })) {
  assert.ok(!(v > 0.25 && v < 0.4), `${name}=${v} sits inside the 0.25–0.4s dead zone`);
  // and no durationed UI motion under 100ms except T_FLICK acknowledgments
  assert.ok(v >= 0.1 || name === 'T_FLICK', `${name}=${v} is under the 100ms UI floor`);
}

// ---- ease lanes are what the doc says (motion §3.2) ------------------------------
assert.equal(EASE_SCRUB, 'none');
assert.deepEqual(Object.values(SETTLE).sort(), [
  'power2.in',
  'power2.inOut',
  'power2.out',
  'power3.out',
  'power4.out',
]);
assert.deepEqual(Object.values(PUPPET).sort(), ['back.out', 'bounce.out', 'sine.inOut', 'sine.out']);

// ---- puppet eases never referenced by camera/UI modules --------------------------
// The puppet lane (back/bounce/elastic/sine) is for in-world acting only. timeline.ts
// and actions.ts hold the acting and are exempt; every camera/UI-side module must stay
// clean. New stage modules live in src/film/stages/ (world-side, exempt) — anything
// added to the camera/UI side joins this list.
const cameraUiModules = [
  '../src/App.tsx',
  '../src/DevHud.tsx',
  '../src/Hero.tsx',
  '../src/Wordmark.tsx',
  '../src/main.tsx',
  '../src/styles.css',
  '../src/film/Film.tsx',
  '../src/film/framing.ts',
  '../src/film/curtain.ts',
  '../src/film/gearing.ts',
];
const puppetEase = /\b(back|bounce|elastic|sine)\.(in|out|inOut)/;
for (const rel of cameraUiModules) {
  const src = readFileSync(new URL(rel, import.meta.url), 'utf8');
  const hit = src.match(puppetEase);
  assert.equal(hit, null, `${rel} references puppet ease "${hit?.[0]}" — settle lane only`);
}

// ---- micro-motion constants (motion §3.3 / §15) ----------------------------------
// BREATH_RATE/STRIDE_RATE (actions.ts) and FLICKER (Film.tsx) are wired
// at their call sites — verified by the grep section below — so pinning the token here
// pins the shipped formula. P5 wired the hero set (HERO_DOLLY, MOTH_ORBIT_S,
// UI_RISE_MAX_PX, PARALLAX_CAP_DEG — Hero.tsx / heroLife.ts, greps below); BOIL stays
// FORWARD: no consumer yet, the assert pins the doc value its stage will inherit.
assert.equal(BREATH_RATE, 1.9);
assert.equal(STRIDE_RATE, 11);
assert.deepEqual(FLICKER, {
  scaleAmp: 0.18,
  scaleRate: 9,
  pulseAmp: 0.3,
  pulseRate: 13,
  glowBase: 4.5,
  glowAmp: 1.6,
});
assert.deepEqual(IDLE_THROTTLE, { afterS: 12, fps: 30 });
assert.deepEqual(BOIL, { fps: 6, ampPx: 0.8 });
assert.deepEqual(HERO_DOLLY, { amp: 0.012, periodS: 13 });
assert.equal(MOTH_ORBIT_S, 2.6);
assert.equal(UI_RISE_MAX_PX, 12);
assert.deepEqual(PARALLAX_CAP_DEG, { yaw: 2.2, pitch: 1.2 });

// ---- wired tokens are actually read at their call sites --------------------------
// The value asserts above pin token -> doc; these pin call site -> token. A literal
// creeping back into a call site (the token still declared, no longer consumed) is
// exactly the drift this module exists to prevent, and it is invisible to the value
// asserts alone.
//
// Matching runs against the module BODY — comments and import statements stripped —
// because a bare `src.includes(token)` was satisfied by the import line (or a comment
// naming the token) alone, so a literal re-inlined at the call site still passed.
const moduleBody = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/\/\/[^\n]*/g, '') // line comments
    .replace(/^import[\s\S]*?['"][^'"]*['"];?$/gm, ''); // import statements, incl. multi-line
const wiredAt: Record<string, string[]> = {
  '../src/film/Film.tsx': [
    'FLICKER.scaleAmp',
    'FLICKER.scaleRate',
    'FLICKER.pulseAmp',
    'FLICKER.pulseRate',
    'FLICKER.glowBase',
    'FLICKER.glowAmp',
    'IDLE_THROTTLE.afterS',
    'IDLE_THROTTLE.fps',
  ],
  '../src/film/actions.ts': ['STRIDE_RATE', 'BREATH_RATE', 'T_GESTURE', 'SETTLE.arrive'],
  '../src/film/timeline.ts': [
    'EASE_SCRUB',
    'RUNTIME',
    'SCRUB',
    'T_BEAT',
    'T_PUNCH',
    'T_FLICK',
    'T_EXHALE',
    'T_DRAIN_MIN',
    'T_DRAIN_MAX',
    'SETTLE.move',
    'SETTLE.exit',
    'SETTLE.heavy',
    'PUPPET.pop',
    'PUPPET.organic',
    'PUPPET.glide',
    'PUPPET.drop',
  ],
  // P2: the freeze recipes (tick / glidingDrain / snapBack) moved the curtain tween
  // shapes here from timeline.ts — SETTLE.snap's canonical call site moved with them.
  '../src/film/curtain.ts': [
    'T_REVEAL',
    'SETTLE.arrive',
    'SETTLE.move',
    'SETTLE.snap',
    'T_FLICK',
    'T_DRAIN_MIN',
    'T_DRAIN_MAX',
    'EASE_SCRUB',
  ],
  '../src/film/gearing.ts': ['RUNTIME'],
  // P5: the cover wires the hero set — the idle throttle and dolly breath in the
  // shell, the moth orbit / parallax caps / affordance rise in the life module.
  '../src/Hero.tsx': [
    'HERO_DOLLY.amp',
    'HERO_DOLLY.periodS',
    'IDLE_THROTTLE.afterS',
    'IDLE_THROTTLE.fps',
  ],
  '../src/film/stages/heroLife.ts': [
    'MOTH_ORBIT_S',
    'PARALLAX_CAP_DEG.yaw',
    'PARALLAX_CAP_DEG.pitch',
    'UI_RISE_MAX_PX',
  ],
};
for (const [rel, tokens] of Object.entries(wiredAt)) {
  const body = moduleBody(readFileSync(new URL(rel, import.meta.url), 'utf8'));
  for (const token of tokens) {
    assert.ok(
      body.includes(token),
      `${rel} no longer reads ${token} at a call site — re-wire it, don't re-inline the value`,
    );
  }
}

// ---- styles.css cannot import — pin its transition durations to the UI lane ------
// Every `transition:` duration in the stylesheet must be a UI-lane token value
// (T_FLICK / T_UI / T_UI_MAX). This is the CSS half of the wiring guarantee.
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const cssDurations = [...css.matchAll(/transition:[^;]*/g)].flatMap((m) =>
  [...m[0].matchAll(/(\d*\.?\d+)s\b/g)].map((d) => Number(d[1])),
);
assert.ok(cssDurations.length > 0, 'styles.css has no transitions — the grep went stale');
for (const d of cssDurations) {
  assert.ok(
    [T_FLICK, T_UI, T_UI_MAX].includes(d),
    `styles.css transition ${d}s is not a UI-lane value (T_FLICK ${T_FLICK} / T_UI ${T_UI} / T_UI_MAX ${T_UI_MAX})`,
  );
}

console.log('motion ok');
