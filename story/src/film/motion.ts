// MOTION TOKENS — the one vocabulary (motion-system doc §3–§4). Durations that live on
// the scrubbed timeline are in film-t units (1t = 1s at play pace); UI durations are in
// real seconds. Rules the scale carries (asserted by scripts/motion.check.ts):
//   - no durationed UI motion under 100ms except T_FLICK acknowledgments
//   - nothing between 0.25s and 0.4s — the gap keeps UI-speed and world-speed
//     legibly different. Doc-sanctioned exception: T_EXHALE=0.3, which the doc's own
//     §3.1 scale places inside the gap — it is a world-side timeScale resume ramp in
//     film-t, not a UI duration, so it never competes for the gap's legibility.
//   - anything ≥0.4s on the film must be scrub-tied
//
// A token here is one of three things, and each says which it is:
//   - WIRED: imported by its call site, so the token IS the shipped value — drift is
//     impossible by construction. motion.check.ts greps every wired file for the
//     reference so a literal creeping back in fails the check.
//   - CSS: consumed by styles.css, which cannot import — motion.check.ts pins every
//     transition duration in that file to the UI-lane values instead.
//   - FORWARD: vocabulary for a stage that is not built yet (P2+). No consumer exists;
//     the check pins the doc value so the stage that wires it inherits the right number.
// Pure constants, no imports: safe under Node --experimental-strip-types.

// ---- the master clock (motion §4) -------------------------------------------------
// The film is authored 0..66t. The last authored tween settles at ~t65.72; an explicit
// endcap hold in timeline.ts pins tl.duration() to exactly RUNTIME so scroll fraction
// 1.0 IS t66 and play mode runs a true 1t/s.
export const RUNTIME = 66;
// The numeric scrub: the playhead eases toward the scroll target over this many
// seconds. Re-implemented explicitly in timeline.ts's gearing drive.
export const SCRUB = 0.8;

// ---- 3.1 duration scale -----------------------------------------------------------
export const T_FLICK = 0.12; // WIRED timeline.ts: snapBack + the t30 time-restart
export const T_UI = 0.2; // CSS: UI state changes (seconds) — shipped transitions
export const T_UI_MAX = 0.25; // CSS: upper edge of the UI lane, at the dead zone's rim
export const T_BEAT = 0.4; // WIRED timeline.ts: cap() fade default
export const T_PUNCH = 0.25; // WIRED timeline.ts: punchline caption fades (me1–me4)
export const T_GESTURE = 0.5; // WIRED actions.ts: settle() default rig beat
export const T_REVEAL = 0.8; // WIRED curtain.ts: reveal() default
export const T_DRAIN_MIN = 0.5; // WIRED timeline.ts: the two extreme drain() glides
export const T_DRAIN_MAX = 1.4; //   (in-between drains stay authored per beat)
export const T_EXHALE = 0.3; // WIRED timeline.ts: the t47 timeScale 0→1 resume ramp
export const T_CAM_MIN = 1.5; // FORWARD doc range for cam() moves — v1 beats still
export const T_CAM_MAX = 2.5; //   carry authored outliers (1.15 push, 3.5 pull-back)
export const T_BLOOM_MIN = 0.8; // FORWARD: hero paint bloom (seconds), lands with P2+
export const T_BLOOM_MAX = 1.2;
export const T_BLOOM_CTA = 0.18; // FORWARD: CTA amber bloom — a UI cousin, not T_BLOOM

// ---- 3.2 ease lanes ---------------------------------------------------------------
// Scrub lane: everything mapped 1:1 to scroll. The master timeline's default.
export const EASE_SCRUB = 'none';
// Settle lane: camera beats, reveals, rig moves, UI enters/exits, lettering.
// Never bounce/back/elastic. WIRED at the canonical call sites — timeline.ts (cam/drain
// default, snapBack, impact fades, die settles), actions.ts (reach default), curtain.ts
// (reveal) — with authored same-family literals surviving elsewhere until the stage
// rebuilds (P7–P12) retire their blocks.
export const SETTLE = {
  arrive: 'power2.out', // reach + reveal defaults
  move: 'power2.inOut', // the dominant authored A→B ease — cam() + drain() defaults
  exit: 'power2.in', // impacts and exits
  heavy: 'power3.out', // heavy settles: the die
  snap: 'power4.out', // snapBack only
} as const;
// Puppet lane: in-world prop/character acting ONLY — never UI, camera, type, margin,
// or CTA. motion.check.ts greps the camera/UI modules for these. WIRED in timeline.ts.
export const PUPPET = {
  pop: 'back.out', // prop pop-ins
  organic: 'sine.inOut', // organic micro-loops (the rope wiggle)
  glide: 'sine.out', // walk-offs
  drop: 'bounce.out', // one authored drop (tavern sign), grandfathered
} as const;

// ---- 3.3 micro-motion constants ---------------------------------------------------
export const BOIL = { fps: 6, ampPx: 0.8 } as const; // FORWARD: UI strokes; off under PRM
export const BREATH_RATE = 1.9; // WIRED actions.ts: breath = 0.5 + 0.5*sin(gobT * rate)
export const STRIDE_RATE = 11; // WIRED actions.ts: stride = sin(gobT * rate)
export const FLICKER = {
  scaleAmp: 0.18,
  scaleRate: 9,
  pulseAmp: 0.3,
  pulseRate: 13,
  glowBase: 4.5,
  glowAmp: 1.6,
} as const; // WIRED Film.tsx — all on world.t, so a freeze stills every term
// RAY_SPIN_RATE retired with buildRayBurst (§11.2 row 23: "rays were v1's word for
// light"). It spun three groups that carry no geometry and no draw call.
export const HERO_DOLLY = { amp: 0.012, periodS: 13 } as const; // WIRED Hero.tsx: ±1.2% breath
export const MOTH_ORBIT_S = 2.6; // WIRED heroLife.ts: the lantern moth's orbit
export const UI_RISE_MAX_PX = 12; // WIRED heroLife.ts: the entrance affordance rise
export const PARALLAX_CAP_DEG = { yaw: 2.2, pitch: 1.2 } as const; // WIRED heroLife.ts

// ---- §15 performance --------------------------------------------------------------
// Idle frame throttle at held frames: 30fps after 12s without input or t-change,
// instant wake. Consumed by Film.tsx's frame loop.
export const IDLE_THROTTLE = { afterS: 12, fps: 30 } as const;
