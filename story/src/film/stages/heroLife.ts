import * as THREE from 'three';
import gsap from 'gsap';
import { rig } from './trilayer.ts';
import { prmAmbient } from './rigs.ts';
import { SEAM_X, ISLAND_RX, ISLAND_RZ, type Hero } from './hero.ts';
import { HERO_T, gearingInverse } from '../gearing.ts';
import { LINE } from '../pencil.ts';
import { applyPose, REST } from '../world.ts';
import {
  MOTH_ORBIT_S,
  PARALLAX_CAP_DEG,
  UI_RISE_MAX_PX,
  SETTLE,
  EASE_SCRUB,
} from '../motion.ts';
import * as P from '../palette.ts';

// HERO II — entrance, mouse, and the first-scroll handoff (P5; hero doc §8–§10,
// motion §6/§13). hero.ts stages the SCENE and owns no tweens; this module is the
// scene's LIFE: the load that draws itself, the noticed-not-clickable cursor, the
// idle ornaments, and the scrub-tied handoff into the film.
//
// One lever runs the whole paint story: rig.seamX. The entrance blooms it BLANK_X →
// SEAM_X (color spreading from the lantern side), the handoff drains it back, and a
// backward scrub re-ignites lantern-first by construction — the lantern sits nearest
// the painted rim, so the returning frontier reaches it before anything else.
//
// Node-safe at import (the checks read the schedule constants): no window access at
// module scope, all DOM/gsap work inside the builders.

const DEG = Math.PI / 180;

// the seam parked past the island's left rim (+SEAM_WOB headroom): the whole page is
// underdrawing. Entrance starts here; the handoff drain ends here.
export const BLANK_X = -3.4;

// returners (localStorage gg.seen) run the entrance at 0.6× duration (hero §8)
export const RETURNER_PACE = 0.6;

// ---- the entrance schedule (hero §8's table, seconds from first paint) -----------
// The stroke phase is the loader: its pacing is ELASTIC (min..max) against asset
// readiness — strokes simply keep drawing while anything streams; no spinner exists.
// The lantern ignites BEFORE the paint blooms (light leads) — pinned by the check.
export const ENTRANCE = {
  grid: { at: 0.25, dur: 0.2 }, // grid ghost + margin ticks
  strokes: { at: 0.45, min: 1.2, max: 4 }, // ~78 strokes write themselves on
  stagger: 3, // ~three strokes drawing at once
  ignite: { at: 1.65, dur: 0.35 }, // glass warms, one soft pulse — before paint
  bloom: { at: 1.75, dur: 0.8 }, // color spreads from the lantern (power2.out)
  type: { at: 2.4, wordmark: 0.48, tagline: 0.36, lead: 0.12, meta: 0.3, rise: 0.32 },
  settledBy: 3.2, // warm cache — asserted, not aspired
  stallNoteAfter: 3, // a true stall this long pencils the margin note on
} as const;

// ---- the handoff schedule (hero §10, in pre-film t — the slice is HERO_T long) ---
export const HANDOFF = {
  headSnap: 0.12, // the fastest move he ever makes (120ms at play pace)
  tuck: { at: 0.05, dur: 0.4 }, // pencil into the cloak, glove retracts
  shadowLift: { at: 0.1, dur: 0.25 }, // his shadow lifts off the drawing
  drainAt: 0.12, // seam sweep start…
  phaseA: 0.55 * HERO_T, // …and end — "caught" owns 55% of the slice
  lights: 0.73, // the 0.6s-equivalent page dim (Phase B)
  emberDies: 0.97, // the last live pixel dies at 97%
  recede: 0.06, // dolly-back as the house lights fall
} as const;

// the settled frame the skip must land on exactly (also what hero.check stages)
export const SETTLED = { seamX: SEAM_X, birth: 1, aliveShadow: 0.97 } as const;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

const setColor = (mat: THREE.Material, hex: number) =>
  (mat as THREE.MeshBasicMaterial).color.set(hex);

// ---- scene collection -------------------------------------------------------------

interface StrokeEntry {
  line: THREE.Mesh & { geometry: THREE.InstancedBufferGeometry };
  count: number;
}

/** Every authored stroke outside the goblin (he arrives with the bloom), sorted
 * ground → trunks → canopies by height — the §8 draw order, cheap and legible.
 * Exported for the check: the entrance must have a real drawing's worth to write. */
export function collectStrokes(hero: Hero): StrokeEntry[] {
  const out: { e: StrokeEntry; y: number }[] = [];
  hero.root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  hero.root.traverse((o) => {
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    if (m.isLineSegments2 !== true) return;
    // the goblin and his pencil are of the alive — they land with the bloom edge
    let p: THREE.Object3D | null = m;
    while (p) {
      if (p === hero.goblin.root) return;
      p = p.parent;
    }
    const count = (m.geometry.getAttribute('instanceStart') as THREE.BufferAttribute)?.count ?? 0;
    if (!count) return;
    box.setFromObject(m);
    out.push({ e: { line: m as StrokeEntry['line'], count }, y: (box.min.y + box.max.y) / 2 });
  });
  out.sort((a, b) => a.y - b.y);
  return out.map((o) => o.e);
}

interface PaintToggle {
  mesh: THREE.Mesh;
  x: number; // world x the seam frontier crosses it at
}

/** The painted-half pencil-vocabulary props' FILLS (and colored strokes): the seam is
 * a trilayer construct, so these opt in by visibility — each pops on/off exactly when
 * the frontier crosses its world x, in both directions. Ink strokes stay: an
 * un-painted prop remains its own contour drawing (the film's grammar). */
function collectPaintToggles(hero: Hero): PaintToggle[] {
  const out: PaintToggle[] = [];
  const pos = new THREE.Vector3();
  // graphite-family strokes ARE the underdrawing — never frontier-toggled
  const drawingHexes = new Set([LINE, P.graphite, P.graphiteDark, P.graphiteLight, P.ink]);
  hero.root.updateMatrixWorld(true);
  hero.root.traverse((o) => {
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    if (!m.isMesh) return;
    let p: THREE.Object3D | null = m;
    while (p) {
      if (p === hero.goblin.root) return; // the alive keep their paint
      p = p.parent;
    }
    const mat = m.material as THREE.Material & { color?: THREE.Color };
    const role = mat.userData?.role as string | undefined;
    if (role === 'trilayer') return; // the seam already speaks here
    const coloredStroke =
      (role === 'stroke' || role === 'shell') &&
      mat.color !== undefined &&
      !drawingHexes.has(mat.color.getHex());
    const isFill = role === 'fill';
    // the ignition set (glass/flame) is authored separately — never a seam toggle
    if (m.userData.heroPart || m.parent?.userData.heroPart) return;
    if ((m as unknown as THREE.Sprite).isSprite) return; // the bloom sprite rides state.glow
    if (!isFill && !coloredStroke) return;
    m.getWorldPosition(pos);
    out.push({ mesh: m, x: pos.x });
  });
  return out;
}

// ---- the factory ------------------------------------------------------------------

export interface HeroLifeOpts {
  film?: boolean; // embedded under the film's scroll (the default route)
}

export interface HeroLife {
  state: { glow: number; recede: number };
  par: { yaw: number; pitch: number }; // damped parallax, degrees — camera-side apply
  /** the entrance timeline itself — exposed so the checks can drive it headlessly */
  entrance: gsap.core.Timeline;
  entranceDone: () => boolean;
  strokeTotal: number; // ~78 — the check pins the band
  skip: () => void;
  update: (t: number, dt: number, camera: THREE.Camera) => void;
  onPointer: (ndcX: number, ndcY: number, camera: THREE.Camera, touch: boolean) => void;
  setTouchRadius: (worldR: number) => void;
  /** Drive the handoff from the film's raw playhead t (t<0 is the cover's slice).
   * Returns the handoff time in 0..HERO_T — HERO_T means fully handed off. */
  scrubTo: (rawT: number) => number;
  handoffTime: () => number;
  /** Touch devices: he glances up once at the first touch-scroll (hero §9). */
  glance: () => void;
  dispose: () => void;
}

export function createHeroLife(hero: Hero, opts: HeroLifeOpts = {}): HeroLife {
  const doc = document;
  const el = (id: string) => doc.getElementById(id);
  const dom = {
    cover: el('hero-cover'),
    grid: el('hero-gridghost'),
    ticks: [...doc.querySelectorAll<HTMLElement>('.hero-tick')],
    brand: el('hero-brand'),
    wordmark: doc.querySelector<SVGElement>('#hero-brand svg'),
    tagline: el('hero-tagline'),
    meta: el('hero-meta'),
    hint: el('hero-hint'),
    note: el('hero-note'),
    skipNote: el('hero-skip'),
    blackout: el('hero-blackout'),
    ember: el('hero-ember'),
  };

  const prm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = { glow: 1, recede: 0 };
  const par = { yaw: 0, pitch: 0 };

  const strokes = collectStrokes(hero);
  const toggles = collectPaintToggles(hero);
  const glassEtc: { glass?: THREE.Mesh; flame?: THREE.Object3D } = {};
  hero.root.traverse((o) => {
    if (o.userData.heroPart === 'glass') glassEtc.glass = o as THREE.Mesh;
    if (o.userData.heroPart === 'flame') glassEtc.flame = o;
  });
  const glassMat = glassEtc.glass?.material as THREE.MeshBasicMaterial | undefined;
  const litHex = (glassEtc.glass?.userData.litHex as number) ?? P.flameCore;
  const unlitHex = (glassEtc.glass?.userData.unlitHex as number) ?? P.dieBone;

  const g = hero.goblin;
  // THE REDUCED-MOTION STILL IS THE REST POSE (goblin design §9.1 / §11.2, gate G10).
  //
  // Under PRM the entrance becomes a crossfade to the settled frame and nothing here
  // ever animates him — no breath, no blink, no ear tick — so the still is whatever
  // pose his joints are holding. Writing `REST` once, here, is what makes that frame
  // HONEST: it is the same table `stageGoblin` staged him from and the same one
  // `posterBake` prints, rather than three copies that agree until someone tunes one.
  // Unconditional on purpose — the live path's head-track and scritch are offsets from
  // `base` below, so they need the same origin the still has.
  applyPose(g, REST);
  // captured rest pose — head-track/scritch write base+offset, never absolutes
  const base = {
    neckY: g.neck.rotation.y,
    neckX: g.neck.rotation.x,
    headY: g.head.rotation.y,
    headX: g.head.rotation.x,
    wristX: g.armR.wrist.rotation.x,
    poseZ: g.armR.pose.rotation.z,
    gobY: g.root.position.y,
  };

  // ---- idle ornaments: moth + motes (built here — new scene work, new module) -----
  const lifeGroup = new THREE.Group();
  lifeGroup.visible = false;
  const inkMat = new THREE.MeshBasicMaterial({ color: LINE, side: THREE.DoubleSide, fog: false });
  const moth = new THREE.Group();
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.018), inkMat);
    wing.position.x = side * 0.014;
    wing.userData.side = side;
    moth.add(wing);
  }
  lifeGroup.add(moth);
  const MOTES = 8;
  const motePos = new Float32Array(MOTES * 3);
  const moteSeed: number[] = [];
  for (let i = 0; i < MOTES; i++) {
    moteSeed.push(Math.random() * Math.PI * 2);
    motePos[i * 3] = hero.lanternGlow.x + (Math.random() - 0.5) * 0.7;
    motePos[i * 3 + 1] = 0.1 + Math.random() * 0.7;
    motePos[i * 3 + 2] = hero.lanternGlow.z + (Math.random() - 0.5) * 0.5;
  }
  const moteGeom = new THREE.BufferGeometry();
  moteGeom.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(
    moteGeom,
    new THREE.PointsMaterial({
      color: P.amber,
      size: 2.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );
  lifeGroup.add(motes);
  hero.root.add(lifeGroup);

  // ---- entrance -------------------------------------------------------------------

  let returner = false;
  try {
    returner = localStorage.getItem('gg.seen') === '1';
  } catch {
    /* storage may be unavailable — cold path */
  }

  const strokeState = { p: 0 };
  const N = strokes.length;
  const applyStrokes = () => {
    const c = ENTRANCE.stagger;
    for (let i = 0; i < N; i++) {
      const local = clamp((strokeState.p * (N + c - 1) - i) / c, 0, 1);
      strokes[i].line.geometry.instanceCount =
        local >= 1 ? Infinity : Math.floor(local * strokes[i].count);
    }
    rig.birth.value = strokeState.p;
  };

  // pre-roll state: bare paper, everything to be drawn (applied before first paint)
  const initEntrance = () => {
    rig.seamX.value = BLANK_X;
    rig.birth.value = 0;
    rig.aliveShadow.value = 0;
    strokeState.p = 0;
    applyStrokes();
    for (const t of toggles) t.mesh.visible = false;
    if (glassMat) glassMat.color.set(unlitHex);
    if (glassEtc.flame) glassEtc.flame.visible = false;
    state.glow = 0;
    g.root.visible = false;
    gsap.set([dom.grid, ...dom.ticks], { opacity: 0 });
    if (dom.brand) gsap.set(dom.brand, { opacity: 0 });
    if (dom.wordmark) gsap.set(dom.wordmark, { clipPath: 'inset(0 100% 0 0)' });
    if (dom.tagline) gsap.set(dom.tagline, { clipPath: 'inset(0 100% 0 0)' });
    if (dom.meta) gsap.set(dom.meta, { opacity: 0 });
    // xPercent carries the CSS centering: a bare y tween would replace the
    // stylesheet's translateX(-50%) with its own transform
    if (dom.hint) gsap.set(dom.hint, { opacity: 0, y: UI_RISE_MAX_PX, xPercent: -50, x: 0 });
    if (dom.skipNote) gsap.set(dom.skipNote, { opacity: 0 });
  };

  // seam-frontier crossing time under the bloom's power2.out (u solved analytically)
  const bloomCross = (x: number) => {
    const q = clamp((x - BLANK_X) / (SEAM_X - BLANK_X), 0, 1);
    return ENTRANCE.bloom.at + (1 - Math.sqrt(1 - q)) * ENTRANCE.bloom.dur;
  };

  let done = false;
  // declared before the entrance runs: finishEntrance (PRM path included) touches it
  let handoff: gsap.core.Timeline | null = null;
  // DEV walk hook (?stallfonts): a never-resolving readiness emulates a font stall
  // deterministically — on a warm cache the real fonts resolve before the gate ever
  // arms. import.meta.env is undefined under plain node (the checks import this).
  const stallForced =
    typeof location !== 'undefined' &&
    import.meta.env?.DEV === true &&
    location.search.includes('stallfonts');
  const readiness: Promise<unknown> = stallForced
    ? new Promise(() => {})
    : typeof doc.fonts !== 'undefined'
      ? doc.fonts.ready
      : Promise.resolve();
  let ready = false;
  readiness.then(() => {
    ready = true;
  });

  const entrance = gsap.timeline({ paused: true });
  let stallNote: ReturnType<typeof setTimeout> | undefined;
  let stallCap: ReturnType<typeof setTimeout> | undefined;
  const clearStall = () => {
    if (stallNote) clearTimeout(stallNote);
    if (stallCap) clearTimeout(stallCap);
    if (dom.note) gsap.to(dom.note, { opacity: 0, duration: 0.2, overwrite: 'auto' });
  };
  const buildEntrance = () => {
    const tl = entrance;
    // grid ghost + ticks (0.25–0.45)
    if (dom.grid) tl.to(dom.grid, { opacity: 1, duration: ENTRANCE.grid.dur }, ENTRANCE.grid.at);
    dom.ticks.forEach((tick, i) =>
      tl.to(tick, { opacity: 1, duration: 0.12 }, ENTRANCE.grid.at + i * 0.05),
    );
    // ~78 strokes write themselves on — the loader. Elastic: at 85% a not-ready page
    // slows the hand to a crawl (the strokes keep drawing); at 100% it rests the
    // pencil until ready, capped at ENTRANCE.strokes.max of total stroke time. A
    // >stallNoteAfter true stall pencils the margin note on. No spinner exists.
    tl.to(
      strokeState,
      { p: 1, duration: ENTRANCE.strokes.min, ease: EASE_SCRUB, onUpdate: applyStrokes },
      ENTRANCE.strokes.at,
    );
    tl.call(
      () => {
        if (ready || done) return;
        tl.timeScale(tl.timeScale() * 0.18);
        stallNote = setTimeout(() => {
          if (dom.note) gsap.to(dom.note, { opacity: 1, duration: 0.4 });
        }, ENTRANCE.stallNoteAfter * 1000);
        // restore is registered TWICE (readiness + the stall cap) and must run
        // once: a late second fire would pause a playing entrance mid-beat
        let restored = false;
        const restore = () => {
          if (done || restored) return;
          restored = true;
          // resume on the NEXT ticker tick, parked: lagSmoothing is 0 (App.tsx),
          // so the first tick after a stall carries the whole accumulated delta —
          // resumed synchronously (against the ticker's stale time), that delta
          // teleported the playhead past ignite AND bloom in one frame (P5 verify).
          // A paused timeline consumes the big tick as nothing; play() inside the
          // tick re-bases fresh, and the beats run at their authored pace.
          tl.pause();
          gsap.ticker.add(() => {
            if (done) return;
            tl.timeScale(returner ? 1 / RETURNER_PACE : 1).play();
            clearStall();
          }, true);
        };
        readiness.then(restore);
        stallCap = setTimeout(restore, ENTRANCE.strokes.max * 1000);
      },
      undefined,
      ENTRANCE.strokes.at + ENTRANCE.strokes.min * 0.85,
    );
    const gateT = ENTRANCE.strokes.at + ENTRANCE.strokes.min;
    // the gate pauses AT MOST ONCE. The call re-fires — when restore() plays from
    // gateT itself, and inside any progress(1) jump that crosses it — and a second
    // pause re-parked the cap forever / aborted the very jump that completes the
    // entrance (P5 reverify blockers: a callback that seeks its own timeline
    // aborts a progress(1) mid-flight).
    let gated = false;
    tl.call(
      () => {
        // pause AT the gate, not wherever this tick landed: lagSmoothing is 0, so
        // a stalled main thread hands the crawl one huge delta that overshoots
        // 1.65 mid-render — a bare pause() then strands the playhead PAST the
        // still-unrendered ignite/bloom, and the resume snap-renders both in one
        // frame (P5 verify major, measured parked at t3.019). pause(gateT) rewinds
        // the strand; nothing past the gate has rendered, so the seek is invisible.
        if (!ready && !done && !gated) {
          gated = true;
          tl.pause(gateT);
        }
      },
      undefined,
      gateT,
    );
    // the lantern ignites BEFORE paint: glass warms, one soft pulse, light pool rises
    if (glassMat) {
      tl.to(glassMat.color, { ...hexRGB(P.flameCore), duration: 0.1, ease: SETTLE.arrive }, ENTRANCE.ignite.at);
      tl.to(glassMat.color, { ...hexRGB(litHex), duration: 0.18, ease: SETTLE.move }, ENTRANCE.ignite.at + 0.1);
    }
    if (glassEtc.flame) tl.set(glassEtc.flame, { visible: true }, ENTRANCE.ignite.at + 0.04);
    tl.to(state, { glow: 1, duration: ENTRANCE.ignite.dur, ease: SETTLE.arrive }, ENTRANCE.ignite.at);
    // the paint bloom — from the lantern side, shadows arriving with color
    tl.to(rig.seamX, { value: SEAM_X, duration: ENTRANCE.bloom.dur, ease: SETTLE.arrive }, ENTRANCE.bloom.at);
    for (const t of toggles) tl.set(t.mesh, { visible: true }, bloomCross(t.x));
    // the goblin rides the bloom's leading edge — he lands, his shadow crosses
    const tGob = bloomCross(g.root.position.x);
    tl.set(g.root, { visible: true }, tGob - 0.02);
    tl.fromTo(
      g.root.position,
      { y: base.gobY + 0.08 },
      { y: base.gobY, duration: 0.25, ease: SETTLE.arrive, immediateRender: false },
      tGob - 0.02,
    );
    tl.to(rig.aliveShadow, { value: SETTLED.aliveShadow, duration: 0.3, ease: SETTLE.arrive }, tGob);
    // type settles: wordmark writes on, tagline overlaps, meta fades, affordances rise
    const T = ENTRANCE.type;
    if (dom.brand) tl.set(dom.brand, { opacity: 1 }, T.at);
    if (dom.wordmark)
      tl.to(dom.wordmark, { clipPath: 'inset(0 0% 0 0)', duration: T.wordmark, ease: SETTLE.move }, T.at);
    if (dom.tagline)
      tl.to(
        dom.tagline,
        { clipPath: 'inset(0 0% 0 0)', duration: T.tagline, ease: SETTLE.move },
        T.at + T.wordmark - T.lead,
      );
    if (dom.meta) tl.to(dom.meta, { opacity: 1, duration: T.meta }, T.at + T.wordmark - 0.1);
    if (dom.hint)
      tl.to(dom.hint, { opacity: 1, y: 0, duration: T.rise, ease: SETTLE.arrive }, T.at + T.wordmark - 0.1);
    if (returner && opts.film && dom.skipNote)
      tl.to(dom.skipNote, { opacity: 1, duration: T.meta }, T.at + T.wordmark - 0.1);
    tl.call(finishEntrance, undefined, Math.max(ENTRANCE.settledBy, tl.duration()));
  };

  function finishEntrance() {
    if (done) return;
    done = true;
    clearStall();
    lifeGroup.visible = true;
    // belt to the immediateRender braces above: whatever a handoff tween may have
    // recorded before the settled frame existed, re-capture from the real thing
    handoff?.invalidate();
    try {
      localStorage.setItem('gg.seen', '1');
    } catch {
      /* fine — next visit runs cold pacing again */
    }
  }

  // ANY input completes the entrance instantly to the settled frame (hero §8)
  const skip = () => {
    if (done) return;
    // done FIRST, then a full events-ON jump. progress(1) fires every callback in
    // its path (only seek() suppresses by default), and it MUST: suppressing events
    // also suppressed the stroke tween's onUpdate, leaving the underdrawing at
    // instanceCount 0 (P5 reverify). With done already set, the crawl/gate calls
    // stand down instead of pausing the very jump that completes the entrance.
    finishEntrance();
    entrance.timeScale(1).progress(1);
  };

  const onInput = () => skip();
  const inputEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown', 'scroll'] as const;

  initEntrance();
  if (prm()) {
    // motion §14: the entrance becomes a ≤0.4s crossfade to the settled frame.
    // Same shape as skip(): done first, then an events-ON jump — progress(1, true)
    // suppressed the stroke tween's onUpdate, so a PRM cold load settled with
    // rig.birth 0 and every ink contour at instanceCount 0 (P5 reverify blocker).
    buildEntrance();
    finishEntrance();
    entrance.progress(1);
    dom.cover?.classList.add('hero-prm-fade');
  } else {
    buildEntrance();
    if (returner) entrance.timeScale(1 / RETURNER_PACE);
    entrance.play();
    for (const ev of inputEvents) window.addEventListener(ev, onInput, { passive: true });
  }
  // a live PRM flip mid-entrance completes it (next paint honours the preference)
  const prmMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onPrm = () => {
    if (prmMq.matches) skip();
    if (opts.film) rebuildHandoff();
  };
  prmMq.addEventListener('change', onPrm);

  // ---- the handoff (embedded only): scrub-tied, reversible, duration HERO_T -------

  const buildHandoff = (): gsap.core.Timeline => {
    const tl = gsap.timeline({ paused: true, defaults: { ease: EASE_SCRUB } });
    const A = HANDOFF.phaseA;
    if (prm()) {
      // motion §14: three crossfade steps — settled → graphite still → black
      const steps = [dom.brand, dom.hint, dom.meta, dom.skipNote].filter(Boolean) as Element[];
      tl.to(steps, { opacity: 0, duration: 0.3 * HERO_T, immediateRender: false }, 0);
      tl.set(rig.seamX, { value: BLANK_X }, 0.45 * HERO_T);
      tl.set(rig.aliveShadow, { value: 0 }, 0.45 * HERO_T);
      tl.set(state, { glow: 0 }, 0.45 * HERO_T);
      for (const t of toggles) tl.set(t.mesh, { visible: false }, 0.45 * HERO_T);
      if (glassEtc.flame) tl.set(glassEtc.flame, { visible: false }, 0.45 * HERO_T);
      if (dom.blackout)
        tl.to(dom.blackout, { opacity: 1, duration: 0.4 * HERO_T }, 0.6 * HERO_T);
      tl.set({}, {}, HERO_T); // pin the duration
      return tl;
    }
    // Phase A — caught. Head snap to camera: the fastest move he ever makes.
    tl.to(g.neck.rotation, { y: base.neckY - 0.35, duration: HANDOFF.headSnap, ease: SETTLE.snap }, 0);
    tl.to(
      g.head.rotation,
      { y: base.headY - 0.75, x: base.headX - 0.32, duration: HANDOFF.headSnap, ease: SETTLE.snap },
      0,
    );
    // pencil tuck — the glove retracts under the cloak
    tl.to(
      g.armR.pose.rotation,
      { x: -0.35, z: -0.05, duration: HANDOFF.tuck.dur, ease: SETTLE.move },
      HANDOFF.tuck.at,
    );
    tl.to(g.armR.elbow.rotation, { x: -0.55, duration: HANDOFF.tuck.dur, ease: SETTLE.move }, HANDOFF.tuck.at);
    tl.to(g.armR.wrist.rotation, { x: 0.4, duration: HANDOFF.tuck.dur * 0.8, ease: SETTLE.move }, HANDOFF.tuck.at);
    tl.set(hero.pencil, { visible: false }, HANDOFF.tuck.at + HANDOFF.tuck.dur * 0.9);
    // his shadow lifts off the drawing
    tl.to(rig.aliveShadow, { value: 0, duration: HANDOFF.shadowLift.dur }, HANDOFF.shadowLift.at);
    // the paint drains back — reverse touch-reveal, linear so crossings are exact;
    // scrubbed back, the frontier re-ignites lantern-first by geometry
    tl.to(rig.seamX, { value: BLANK_X, duration: A - HANDOFF.drainAt }, HANDOFF.drainAt);
    const cross = (x: number) =>
      HANDOFF.drainAt + ((SEAM_X - x) / (SEAM_X - BLANK_X)) * (A - HANDOFF.drainAt);
    for (const t of toggles) tl.set(t.mesh, { visible: false }, cross(t.x));
    const lanternCross = cross(hero.lanternGlow.x);
    if (glassMat)
      tl.to(glassMat.color, { ...hexRGB(unlitHex), duration: 0.1, ease: SETTLE.exit }, lanternCross - 0.05);
    if (glassEtc.flame) tl.set(glassEtc.flame, { visible: false }, lanternCross);
    tl.to(state, { glow: 0, duration: A - lanternCross }, lanternCross);
    // the ember-dot takes over from the dying glass, above the house lights
    if (dom.ember) {
      tl.to(dom.ember, { opacity: 1, duration: 0.15 }, lanternCross);
      tl.to(
        dom.ember,
        { opacity: 0, duration: 0.07 * HERO_T, ease: SETTLE.exit },
        HANDOFF.emberDies * HERO_T - 0.07 * HERO_T,
      );
    }
    // the brand un-writes; meta and hint fade; the margin stays.
    // immediateRender:false is LOAD-BEARING: a .to() sitting at a paused timeline's
    // playhead renders at creation, and the handoff is built while the entrance still
    // holds these elements UNWRITTEN — the captured "start" was the blank pre-roll,
    // so a backward scrub restored blankness instead of re-writing the brand (walked).
    if (dom.wordmark)
      tl.to(dom.wordmark, { clipPath: 'inset(0 100% 0 0)', duration: 0.4, immediateRender: false }, 0.05);
    if (dom.tagline)
      tl.to(dom.tagline, { clipPath: 'inset(0 100% 0 0)', duration: 0.3, immediateRender: false }, 0);
    const fades = [dom.meta, dom.hint, dom.skipNote].filter(Boolean) as Element[];
    if (fades.length) tl.to(fades, { opacity: 0, duration: 0.25, immediateRender: false }, 0);
    // Phase B — house lights: the page dims, the graphite island recedes
    if (dom.blackout) tl.to(dom.blackout, { opacity: 1, duration: HANDOFF.lights, ease: SETTLE.move }, A);
    tl.to(state, { recede: 1, duration: HERO_T - A }, A);
    tl.set({}, {}, HERO_T); // endcap — the slice IS the carve, exactly
    return tl;
  };
  const rebuildHandoff = () => {
    if (!opts.film) return;
    const at = handoff?.time() ?? 0;
    handoff?.kill();
    handoff = buildHandoff();
    handoff.time(at, false);
  };
  if (opts.film) handoff = buildHandoff();

  // ---- mouse: noticed, not clickable (hero §9, motion §6) -------------------------

  const parYawTo = gsap.quickTo(par, 'yaw', { duration: 0.55, ease: SETTLE.arrive });
  const parPitchTo = gsap.quickTo(par, 'pitch', { duration: 0.55, ease: SETTLE.arrive });
  // the almost-touch warms in over 250ms and DECAYS over 400ms (hero §9, motion §6).
  // ONE tween path owns the value: the previous dual-quickTo pair kept two persistent
  // tweens on the same property, and the out-leg's resetTo landed on its end value
  // synchronously — the warmth cut to zero instead of decaying (P5 verify).
  let touchTarget = 0;
  const touchTo = (v: number) => {
    if (touchTarget === v) return; // pointermove-rate calls: tween only on a change
    touchTarget = v;
    gsap.to(rig.touchAmt, {
      value: v,
      duration: v > 0 ? 0.25 : 0.4,
      ease: SETTLE.arrive,
      overwrite: 'auto',
    });
  };

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const headWorld = new THREE.Vector3();

  const track = { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 };
  let cursorIdle = 0;
  let scritchT = 0;
  let everOverIsland = false;
  let earPerked = false;
  try {
    earPerked = sessionStorage.getItem('gg.earperk') === '1';
  } catch {
    /* once per load, then */
  }
  let blinkAt = 5;
  let blinkPhase = -1;

  const interactive = () => done && (handoff ? handoff.time() < 0.02 : true) && prmAmbient() > 0;

  const earPerk = () => {
    if (earPerked) return;
    earPerked = true;
    try {
      sessionStorage.setItem('gg.earperk', '1');
    } catch {
      /* module flag already set */
    }
    // 300ms up, 500ms settle — settle lane: noticed, not cartoon (motion §6)
    for (const ear of [g.earL, g.earR]) {
      const sign = Math.sign(ear.rotation.z) || 1;
      gsap
        .timeline()
        .to(ear.rotation, { z: ear.rotation.z - sign * 0.3, duration: 0.3, ease: SETTLE.arrive })
        .to(ear.rotation, { z: ear.rotation.z, duration: 0.5, ease: SETTLE.move });
    }
  };

  const onPointer = (ndcX: number, ndcY: number, camera: THREE.Camera, touchDevice: boolean) => {
    if (!done) return; // any input already skipped the entrance
    if (touchDevice) return; // hero §9: touch gets the single glance-up, no parallax
    cursorIdle = 0;
    const amb = prmAmbient();
    if (!interactive()) {
      parYawTo(0);
      parPitchTo(0);
      touchTo(0);
      return;
    }
    // parallax breath — capped, damped, off under PRM (amb 0 zeroes the targets)
    parYawTo(-ndcX * PARALLAX_CAP_DEG.yaw * amb);
    parPitchTo(ndcY * PARALLAX_CAP_DEG.pitch * amb);
    // world point under the cursor — head-track aim + the almost-touch position
    ndc.set(ndcX, ndcY);
    ray.setFromCamera(ndc, camera);
    const p = ray.ray.intersectPlane(groundPlane, hit);
    if (p) {
      const overIsland = (p.x / ISLAND_RX) ** 2 + (p.z / ISLAND_RZ) ** 2 < 1.15;
      if (overIsland && !everOverIsland) {
        everOverIsland = true;
        earPerk();
      }
      // he notices you: aim offsets toward the cursor's page point, cone-clamped
      g.head.getWorldPosition(headWorld);
      const yawWorld = Math.atan2(p.x - headWorld.x, p.z - headWorld.z);
      const rest = g.root.rotation.y + base.neckY + base.headY;
      let dYaw = yawWorld - rest;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      track.targetYaw = clamp(dYaw, -14 * DEG, 14 * DEG);
      track.targetPitch = clamp((ndcY - 0.1) * -14 * DEG, -10 * DEG, 6 * DEG);
      // the almost-touch: over the graphite half only; it never paints (shader-side)
      const graphiteSide = p.x > rig.seamX.value - rig.seamW.value;
      if (graphiteSide && overIsland) {
        rig.touch.value.copy(p);
        touchTo(1);
      } else {
        touchTo(0);
      }
    } else {
      touchTo(0);
    }
  };

  // ---- per-frame idle life --------------------------------------------------------

  const update = (t: number, dt: number, _camera: THREE.Camera) => {
    const amb = prmAmbient();
    const hTime = handoff ? handoff.time() : 0;
    // ornaments leave with the paint: hide once the drain is under way
    lifeGroup.visible = done && hTime < HANDOFF.drainAt + 0.2;

    // moth — MOTH_ORBIT_S orbit around the lantern, still under PRM
    const a = amb > 0 ? (t * Math.PI * 2) / MOTH_ORBIT_S : 0.7;
    moth.position.set(
      hero.lanternGlow.x + Math.cos(a) * 0.17,
      hero.lanternGlow.y + 0.06 + Math.sin(a * 2) * 0.05,
      hero.lanternGlow.z + Math.sin(a) * 0.12,
    );
    moth.rotation.y = -a;
    for (const wing of moth.children) {
      wing.rotation.y = amb > 0 ? (wing.userData.side as number) * (0.5 + Math.sin(t * 26) * 0.55) : 0.4;
    }
    // motes drift up through the pool, wrapping — still under PRM
    if (amb > 0) {
      for (let i = 0; i < MOTES; i++) {
        motePos[i * 3 + 1] += dt * 0.05;
        motePos[i * 3] += Math.sin(t * 0.6 + moteSeed[i]) * dt * 0.02;
        if (motePos[i * 3 + 1] > 0.9) motePos[i * 3 + 1] = 0.05;
      }
      moteGeom.getAttribute('position').needsUpdate = true;
    }

    if (!interactive()) return;

    // blink — a life sign, not an ornament loop; still under PRM (amb gates above)
    if (blinkPhase < 0 && t > blinkAt) blinkPhase = 0;
    if (blinkPhase >= 0) {
      blinkPhase += dt;
      const s = blinkPhase < 0.06 ? 1 - blinkPhase / 0.06 : (blinkPhase - 0.06) / 0.07;
      const sy = clamp(Math.abs(s), 0.12, 1);
      g.face.eyeL.scale.y = sy;
      g.face.eyeR.scale.y = sy;
      if (blinkPhase > 0.13) {
        blinkPhase = -1;
        blinkAt = t + 3.5 + (Math.sin(t * 7.13) * 0.5 + 0.5) * 3.5;
        g.face.eyeL.scale.y = 1;
        g.face.eyeR.scale.y = 1;
      }
    }

    // 4s of cursor stillness → he loses interest and returns to work: the scritch
    cursorIdle += dt;
    const working = cursorIdle > 4;
    if (working) {
      track.targetYaw = 0;
      track.targetPitch = 0;
      scritchT += dt;
      const u = (scritchT % 1.8) / 1.8; // two tiny pencil strokes per 1.8s loop
      const stroke = Math.sin(u * Math.PI * 4) * Math.sin(u * Math.PI);
      g.armR.wrist.rotation.x = base.wristX + stroke * 0.1;
      g.armR.pose.rotation.z = base.poseZ + stroke * 0.03;
    } else {
      scritchT = 0;
      g.armR.wrist.rotation.x += (base.wristX - g.armR.wrist.rotation.x) * Math.min(1, dt * 6);
      g.armR.pose.rotation.z += (base.poseZ - g.armR.pose.rotation.z) * Math.min(1, dt * 6);
    }

    // damped head chase (400ms) — the look cascades neck → head, like look()
    const k = 1 - Math.exp(-dt / 0.13);
    track.yaw += (track.targetYaw - track.yaw) * k;
    track.pitch += (track.targetPitch - track.pitch) * k;
    g.neck.rotation.y = base.neckY + track.yaw * 0.4;
    g.head.rotation.y = base.headY + track.yaw * 0.6;
    g.head.rotation.x = base.headX + track.pitch;
  };

  const dispose = () => {
    done = true;
    clearStall();
    entrance.kill();
    handoff?.kill();
    for (const ev of inputEvents) window.removeEventListener(ev, onInput);
    prmMq.removeEventListener('change', onPrm);
    hero.root.remove(lifeGroup);
    gsap.killTweensOf(rig.touchAmt); // an in-flight touch tween must not outlive us
    rig.touchAmt.value = 0;
  };

  let glanced = false;
  const glance = () => {
    if (glanced || prmAmbient() === 0 || !done) return;
    glanced = true;
    gsap
      .timeline()
      .to(g.head.rotation, { x: base.headX - 0.22, duration: 0.4, ease: SETTLE.arrive })
      .to(g.head.rotation, { x: base.headX, duration: 0.8, ease: SETTLE.move }, 1.1);
  };

  return {
    state,
    par,
    entrance,
    entranceDone: () => done,
    strokeTotal: N,
    skip,
    update,
    onPointer,
    setTouchRadius: (r: number) => {
      rig.touchR.value = r;
    },
    scrubTo: (rawT: number) => {
      if (!handoff) return 0;
      const ht = clamp(rawT + HERO_T, 0, HERO_T);
      if (ht > 0.001 && !done) skip(); // scrolling is input: the entrance completes first
      if (Math.abs(handoff.time() - ht) > 1e-4) handoff.time(ht, false);
      return ht;
    },
    handoffTime: () => (handoff ? handoff.time() : 0),
    glance,
    dispose,
  };
}

// gsap tweens colors by channel — a THREE.Color target wants {r,g,b} in linear space,
// exactly what Color.set produces under the renderer's color management
function hexRGB(hex: number) {
  const c = new THREE.Color(hex);
  return { r: c.r, g: c.g, b: c.b };
}

/** The returner skip-note's destination: the endcard's scroll position. */
export function tableScrollY(): number {
  const max = document.body.scrollHeight - window.innerHeight;
  return gearingInverse(64.5) * max;
}
