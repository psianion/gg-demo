import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import HeroWordmark from './HeroWordmark';
import {
  buildHero,
  heroFraming,
  stageHeroRig,
  parkHeroRig,
  solveGoblinRim,
  solveGoblinScale,
  HERO_FOV,
} from './film/stages/hero';
import { createHeroLife, tableScrollY, type HeroLife } from './film/stages/heroLife';
import { rig } from './film/stages/trilayer';
import { prmAmbient } from './film/stages/rigs';
import { gearing, preScrub } from './film/gearing';
import { setPencilResolution, STROKE_LAYER } from './film/pencil';
import { HERO_DOLLY, IDLE_THROTTLE } from './film/motion';
import './hero.css';

// THE HALF-ALIVE ISLAND — the film's front door (P5). The scene is hero.ts; its life
// (entrance, cursor, idle acts, the first-scroll handoff) is heroLife.ts. This file
// wires both into React and the page.
//
// Two modes:
//  - `film` (the DEFAULT route): the cover sits over the film as scroll 0–3.5% — the
//    gearing map's t<0 Cover stage. The one drive in timeline.ts hands the raw
//    playhead to heroLife through gearing.preScrub; past the carve the cover hides
//    and the untouched v1 film owns the page.
//  - standalone (?hero=1, kept as a DEV JUMP — see main.tsx): entrance + idle life
//    with no film behind, for judging the hero in isolation and baking the poster.
//
// Render path: a `flat` Canvas — NoToneMapping, the film's own transfer. No curtain
// pass here: the seam split lives in the trilayer materials (P3's design), and
// skipping the pass keeps P2c-T1's prepass/feather gap out of this route (P7's).

const DEGR = Math.PI / 180;

function HeroScene({
  film,
  throttled,
  onEased,
}: {
  film: boolean;
  throttled: boolean;
  onEased: (t: number) => void;
}) {
  const hero = useMemo(() => buildHero(), []);
  const { camera, size, gl, scene, invalidate } = useThree();
  const life = useRef<HeroLife | null>(null);
  // authored framing for the current viewport; the breath scales off this base
  const base = useRef({ pos: new THREE.Vector3(0, 5, -9), look: new THREE.Vector3(), t: 0 });
  const glowBase = useRef(1.15);
  const ember = useRef<HTMLElement | null>(null);
  const emberV = useRef(new THREE.Vector3());

  // The shared rig uniforms are staged in an effect (not only in buildHero) so
  // StrictMode's mount→unmount→remount cycle re-stages what the first cleanup parked.
  // The scene's LIFE mounts here too: entrance plays at load; in film mode the
  // handoff registers on the one scroll drive (gearing.preScrub).
  useEffect(() => {
    stageHeroRig();
    const l = createHeroLife(hero, { film });
    life.current = l;
    if (film) {
      // every eased playhead update drives the handoff AND the cover teardown —
      // one clock, so the cover can never be torn down mid-handoff (P5 verify)
      preScrub.fn = (t) => {
        l.scrubTo(t);
        onEased(t);
      };
      // the drive may have run before this registration — seed from the live scroll
      const max = document.body.scrollHeight - window.innerHeight;
      preScrub.fn(gearing(max > 0 ? window.scrollY / max : 0));
    }
    // QA handle, the __film/__island precedent: scrub uniforms and read the staging
    // out of the scene instead of squinting at screenshots
    (window as unknown as Record<string, unknown>).__hero = { hero, rig, camera, gl, scene, life: l };
    return () => {
      if (film) preScrub.fn = null;
      l.dispose();
      life.current = null;
      parkHeroRig();
    };
  }, [hero, camera, gl, scene, film, onEased]);

  // the pointer is a presence, not a tool (hero §9): window-level listeners feed the
  // parallax, the head-track and the almost-touch; nothing on the world is clickable
  useEffect(() => {
    const move = (e: PointerEvent) => {
      life.current?.onPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
        camera,
        e.pointerType !== 'mouse',
      );
    };
    const touch = () => life.current?.glance();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('touchstart', touch, { passive: true, once: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('touchstart', touch);
    };
  }, [camera]);

  // idle throttle (motion §15): at the held cover, 30fps after 12s without input —
  // the outer component flips `throttled`; this interval is what keeps 'demand' alive
  useEffect(() => {
    if (!throttled) return;
    const iv = setInterval(() => invalidate(), 1000 / IDLE_THROTTLE.fps);
    return () => clearInterval(iv);
  }, [throttled, invalidate]);

  // the comp REBALANCES per viewport (hero §7): distance and look are solved, the
  // 32° lens is FIXED — no FOV tween exists (motion §10)
  useEffect(() => {
    const f = heroFraming(size.width, size.height);
    base.current.pos.copy(f.position);
    base.current.look.copy(f.look);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = HERO_FOV;
    cam.position.copy(f.position);
    cam.lookAt(f.look);
    cam.updateProjectionMatrix();
    // the goblin's ink and every authored graphite mark live on the pencil stroke
    // layer — in the film the curtain pass enables it per frame; the hero's flat
    // path must enable it on the camera or the drawing has no lines at all
    cam.layers.enable(STROKE_LAYER);
    // both depth languages tuned to the solved shot distance
    rig.depthNear.value = f.d * 0.95;
    rig.depthFar.value = f.d * 2.4;
    // the goblin's ink strokes need the viewport to hold their authored weight — and
    // his two silhouette shells are the same kind of quantity, solved the same way
    // (goblin design §5.12), so they re-solve here with them
    setPencilResolution(size.width, size.height);
    // …and §11.2's figure scale, which must land BEFORE the rim solve reads it
    solveGoblinScale(hero.goblin, size.width, size.height);
    solveGoblinRim(hero.goblin, size.width, size.height);
    // P4e (P4d comp note): at narrow phone widths the bloom's translucent tail was
    // the one thing crossing the drawn page margin (94vw against an 18px rule at
    // 500×915) — the halo breathes in a step; the glass geometry carries the lit read
    glowBase.current = size.width < 560 ? 0.9 : 1.15;
    // the almost-touch's 90px radius, in world units at the solved shot distance
    const worldPerPx = (2 * f.d * Math.tan((HERO_FOV * DEGR) / 2)) / size.height;
    life.current?.setTouchRadius(90 * worldPerPx);
    ember.current = document.getElementById('hero-ember');
  }, [camera, size.width, size.height, hero]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1); // a woken 'never'/'demand' loop hands back seconds
    base.current.t += dt;
    const t = base.current.t;
    const l = life.current;
    // the lantern's flicker rides the rigs' world clock; PRM stills it inside — and
    // the cover's life scales it: unlit before ignition, dying through the drain
    hero.rigs.update(t);
    if (l) {
      hero.rigs.glow.intensity *= l.state.glow;
      if (hero.glowSprite) hero.glowSprite.scale.setScalar(glowBase.current * l.state.glow);
      l.update(t, dt, camera);
    }
    // dolly breath: ±1.2% along the view axis, 13s sine — STILL under reduced
    // motion, live (prmAmbient follows the media query without a reload). The
    // handoff's Phase B recession (6% dolly-back) composes onto the same axis.
    const breath =
      (1 + HERO_DOLLY.amp * prmAmbient() * Math.sin((t * Math.PI * 2) / HERO_DOLLY.periodS)) *
      (1 + 0.06 * (l?.state.recede ?? 0));
    camera.position
      .copy(base.current.pos)
      .sub(base.current.look)
      .multiplyScalar(breath)
      .add(base.current.look);
    camera.lookAt(base.current.look);
    // parallax breath (hero §9): damped yaw/pitch offsets, applied about the lens
    if (l && (l.par.yaw !== 0 || l.par.pitch !== 0)) {
      camera.rotateY(l.par.yaw * DEGR);
      camera.rotateX(l.par.pitch * DEGR);
    }
    // the ember-dot rides the lantern's screen position while the house lights fall
    if (l && ember.current && l.handoffTime() > 0.3) {
      emberV.current.copy(hero.lanternGlow).project(camera);
      ember.current.style.left = `${((emberV.current.x + 1) / 2) * 100}%`;
      ember.current.style.top = `${((1 - emberV.current.y) / 2) * 100}%`;
    }
  });

  return <primitive object={hero.root} />;
}

export default function Hero({ film = false }: { film?: boolean }) {
  // film mode: the cover owns the page only through the gearing carve — past it the
  // whole stack hides and the film underneath is the site
  const [active, setActive] = useState(true);
  const [throttled, setThrottled] = useState(false);

  // the standalone dev jump is a held frame: no scroll track, sky flattened to paper
  useEffect(() => {
    if (film) return;
    document.body.classList.add('hero');
    return () => document.body.classList.remove('hero');
  }, [film]);

  // the cover tears down on the EASED playhead — the same clock that drives the
  // handoff. Gating on raw window.scrollY hid the cover while its own handoff was
  // still mid-flight (raw scroll crosses the carve ~0.8s before the eased playhead
  // under the expo scrub, cutting all of Phase B on a fast first scroll — P5 verify
  // blocker). HeroScene forwards every preScrub update here, so the flip lands on
  // the exact frame the handoff completes; the reverse return is frame-exact too.
  const onEased = useCallback((t: number) => setActive(t < -1e-3), []);

  // idle throttle timer (motion §15): 30fps after 12s without input, instant wake
  useEffect(() => {
    let last = performance.now();
    const wake = () => {
      last = performance.now();
      setThrottled(false);
    };
    const evs = ['pointermove', 'wheel', 'keydown', 'touchstart', 'scroll'] as const;
    for (const ev of evs) window.addEventListener(ev, wake, { passive: true });
    const iv = setInterval(() => {
      if (performance.now() - last > IDLE_THROTTLE.afterS * 1000) setThrottled(true);
    }, 1000);
    return () => {
      for (const ev of evs) window.removeEventListener(ev, wake);
      clearInterval(iv);
    };
  }, []);

  // dev-only poster bake (?hero=1 route work): window.__bakePoster() renders the
  // settled frame at 1200×630 from the real scene — the OG image / Picture-Book
  // frame 1. The DEV gate constant-folds in production; the chunk never builds.
  // …and the goblin's CLASS P acceptance harness (goblin design §13 step 0):
  // window.__gob(w, h) renders the authored framing into an offscreen FLOAT target and
  // reads the §14 P1–P8 numbers back out. Same DEV gate, same lazy chunk rule.
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('./posterBake').then((m) => m.install());
      import('./gobMeasure').then((m) => m.install());
    }
  }, []);

  // returners' fast path (experience §3): the penciled note eases to the table.
  // Routed through App's Lenis (the 'gg-jump' event) — a raw scrollTo under Lenis
  // gets partially rewound by its own smoothing frame.
  const skipToTable = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('gg-jump', {
        detail: { y: tableScrollY(), smooth: prmAmbient() > 0 },
      }),
    );
  }, []);

  return (
    <div id="hero-cover" style={{ visibility: active ? 'visible' : 'hidden' }}>
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        // flat = NoToneMapping: render-pipeline parity with the film (see IslandSandbox)
        flat
        // 'percentage' = PCFShadowMap: honours shadow.radius for the rig's soft key,
        // and the boolean default's PCFSoft is deprecated in three r185
        shadows="percentage"
        dpr={[1, 2]}
        frameloop={active ? (throttled ? 'demand' : 'always') : 'never'}
        camera={{ fov: HERO_FOV, near: 0.1, far: 120, position: [0, 5, -9] }}
      >
        <HeroScene film={film} throttled={throttled} onEased={onEased} />
      </Canvas>

      {/* The scene for anyone who can't see it. */}
      <p className="sr-only">
        A small island of a fantasy world floats on a sheet of paper, half painted and half
        still a pencil drawing. A goblin stands at the edge of the painted part, carpenter&rsquo;s
        pencil in hand, caught in the middle of making the world.
      </p>

      {/* the drafting sheet: quiet margin, tick marks, and the battle-grid ghost
          escaping the island's unfinished side onto the page (hero §4) */}
      <div id="hero-page" aria-hidden="true">
        <div id="hero-margin" />
        <span className="hero-tick t-n" />
        <span className="hero-tick t-s" />
        <span className="hero-tick t-e" />
        <span className="hero-tick t-w" />
        <div id="hero-gridghost" />
      </div>

      <header id="hero-brand">
        <HeroWordmark />
        {/* locked line (copy-spec): said here and again at the endcard — bookends.
            Set in the caption voice until P6's lettering hand replaces the face. */}
        <p id="hero-tagline">The Dungeon Master&rsquo;s backstage.</p>
        {/* the contract-setter (hero §6) — the Quiet Serif, true italic */}
        <p id="hero-meta">a tale told in one take &middot; about two minutes</p>
      </header>

      {/* scroll affordance (hero §6) — drawn, same hand as the film's hint */}
      <div id="hero-hint" aria-hidden="true">
        <span>scroll</span>
        <svg viewBox="0 0 12 26">
          <path d="M6 1 C7 8 5 14 6 21" />
          <path d="M2.5 17.5 L6 21.5 L9.5 17.5" />
        </svg>
      </div>

      {/* the margin's honest loader voice: pencils on only past a 3s true stall */}
      <p id="hero-note" aria-hidden="true">
        sharpening pencils&hellip;
      </p>

      {/* returners' fast path (experience §3) — film mode only, after gg.seen */}
      {film && (
        <button id="hero-skip" type="button" onClick={skipToTable}>
          been here? skip to the table &darr;
        </button>
      )}

      {/* Phase B — the house lights; and the last live pixel, the lantern's ember */}
      <div id="hero-blackout" aria-hidden="true" />
      <span id="hero-ember" aria-hidden="true" />
    </div>
  );
}

