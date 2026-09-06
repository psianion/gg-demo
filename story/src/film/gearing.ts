// GEARING — the scroll↔time map (experience doc §5.2). Scroll and film time are
// deliberately non-linear: transit breathes past, the moments that carry belief get
// runway (the die beat is 11% of the film's clock but 20% of its scroll). Within a
// stage the mapping is linear; stage boundaries are the gear changes.
//
// This module is why the master timeline no longer carries a `scrollTrigger:` scrub of
// its own: ScrollTrigger's progress is linear by construction, so the map lives in
// timeline.ts's drive — ScrollTrigger reports raw progress, gearing() shapes it, and a
// short 'expo' tween re-implements the numeric scrub. The authored t vocabulary every
// doc and check is written against survives untouched. The scroll allocation lives
// entirely in gearing() — #track itself is a flat 1800vh; the hero's 3.5% scroll carve
// is the t<0 Cover stage below (P5); portrait track sizing (~950vh) is P14 scope.
//
// Pure math, no imports beyond motion: safe under Node --experimental-strip-types.
import { RUNTIME } from './motion.ts';

export interface Stage {
  name: string;
  t0: number; // film time where the stage starts
  t1: number; // film time where it ends
  share: number; // fraction of total scroll distance it occupies
}

// THE HERO CARVE (P5, closes FINDINGS P1-T4's hero half — hero doc §10/§14.3):
// the first 3.5% of total scroll belongs to the cover's handoff, carved from Stage 1's
// 14% (10.5% remains; every other stage untouched). DECISION — the hero is wired as
// t<0 of THIS map, not as a second scroll trigger: the Cover is a stage row like any
// other, with t0=-HERO_T, so gearing()/gearingInverse() stay the single scroll↔t
// authority (autoplay's inverse, the HUD and every check inherit the carve for free)
// while the master timeline's authored 0..66 vocabulary is untouched — the film drive
// clamps its own playhead at 0 and hands the raw (possibly negative) t to the cover
// through `preScrub` below. HERO_T is the carve at play pace (1t/s), so play mode
// crosses the handoff in 2.31s of wall clock, film-paced like everything else.
export const HERO_SHARE = 0.035;
export const HERO_T = RUNTIME * HERO_SHARE; // 2.31t of pre-film time

// The cover's scrub hook: the hero mount registers a handler and the film's drive
// (timeline.ts) hands it every playhead update — one drive, two clocks. Null when no
// cover is mounted (?hero=1 static judging, tests): the drive skips it.
export const preScrub: { fn: ((t: number) => void) | null } = { fn: null };

// Stage table from experience doc §2 (t boundaries are the beat sheet's; shares are
// the authored scroll weights, summing to exactly 1).
export const STAGES: Stage[] = [
  { name: 'The Cover', t0: -HERO_T, t1: 0, share: HERO_SHARE },
  { name: 'The Claim', t0: 0, t1: 10.2, share: 0.14 - HERO_SHARE },
  { name: 'The Address', t0: 10.2, t1: 16.5, share: 0.12 },
  { name: 'Proof of Light', t0: 16.5, t1: 26.5, share: 0.16 },
  { name: 'Proof of Scenery', t0: 26.5, t1: 36, share: 0.12 },
  { name: 'Proof of Time', t0: 36, t1: 50, share: 0.2 },
  { name: 'The Many Jobs', t0: 50, t1: 57.5, share: 0.08 },
  { name: 'The Handover', t0: 57.5, t1: 64.5, share: 0.12 },
  { name: 'The Table', t0: 64.5, t1: RUNTIME, share: 0.06 },
];

// Cumulative boundaries: BOUNDARIES[i] is the film t where stage i starts (last entry
// is RUNTIME); SCROLL_BOUNDARIES[i] is the scroll fraction where it starts (last is 1).
export const BOUNDARIES: number[] = [...STAGES.map((s) => s.t0), RUNTIME];
export const SCROLL_BOUNDARIES: number[] = [0];
for (const s of STAGES) {
  SCROLL_BOUNDARIES.push(SCROLL_BOUNDARIES[SCROLL_BOUNDARIES.length - 1] + s.share);
}
// the shares are authored to sum to exactly 1 — pin the endpoint so float drift can
// never leave the last sliver of scroll unmapped
SCROLL_BOUNDARIES[SCROLL_BOUNDARIES.length - 1] = 1;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Scroll progress (0..1) → film time (0..RUNTIME). Piecewise linear, monotonic. */
export const gearing = (progress: number): number => {
  const p = clamp(progress, 0, 1);
  let i = SCROLL_BOUNDARIES.length - 2;
  while (i > 0 && p < SCROLL_BOUNDARIES[i]) i--;
  const p0 = SCROLL_BOUNDARIES[i];
  const p1 = SCROLL_BOUNDARIES[i + 1];
  return BOUNDARIES[i] + ((p - p0) / (p1 - p0)) * (BOUNDARIES[i + 1] - BOUNDARIES[i]);
};

/** Film time (-HERO_T..RUNTIME) → scroll progress (0..1). Exact inverse of gearing(). */
export const gearingInverse = (time: number): number => {
  const t = clamp(time, -HERO_T, RUNTIME);
  let i = BOUNDARIES.length - 2;
  while (i > 0 && t < BOUNDARIES[i]) i--;
  const t0 = BOUNDARIES[i];
  const t1 = BOUNDARIES[i + 1];
  return SCROLL_BOUNDARIES[i] + ((t - t0) / (t1 - t0)) * (SCROLL_BOUNDARIES[i + 1] - SCROLL_BOUNDARIES[i]);
};

/** The stage a film time sits in — HUD readout and boundary jumps. */
export const stageAt = (time: number): Stage => {
  const t = clamp(time, -HERO_T, RUNTIME);
  for (let i = STAGES.length - 1; i > 0; i--) if (t >= STAGES[i].t0) return STAGES[i];
  return STAGES[0];
};
