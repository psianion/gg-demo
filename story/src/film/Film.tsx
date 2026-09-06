import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { buildWorld } from './world';
import { buildGoblin } from './stages/goblin';
import { buildTimeline, disposeTimeline } from './timeline';
import { FLICKER, IDLE_THROTTLE } from './motion';
import { fitFov, fitPullback } from './framing';
import { PAPER, setPencilResolution } from './pencil';
import { applyGait } from './actions';
import { createCurtainPass, curtain, markAlive } from './curtain';
import { paper } from './palette';
import { FILM_RIG } from './stages/rigs';
import { rig } from './stages/trilayer';

// The parked seam — the value `trilayer.ts:49` already defaults to, where
// `smoothstep(seamX - w, seamX + w, x)` never opens and `triC = max(uTriCurtain,
// triSeamF)` collapses to the curtain alone. See the render pass at the bottom.
const PARKED_SEAM = 1e6;

// THE FILM'S DEPTH LANGUAGE, and it is the same class of bug as the seam, one uniform
// over. The rig's 6/26 default is the hero diorama's ~9-unit camera distance, and the
// cover restages it tighter still (9/24, re-solved per resize). The film's shots run to
// 100+ units — the ambush treeline sits 100 u from the S1 camera — so under the cover's
// numbers every one of them is 100 % paper. Walked at t33.5: the S3 island's standing
// backdrop sheet, 40 u out, rendered as a BLANK WHITE SLAB behind the theatre; at 10/150
// it is the painted green hillside it was built as.
//
// 10/150 is the film's own scale, read off its FogExp2(0.0085): that fog reaches 5 % at
// 26 u and 51 % at 100 u, and smoothstep(10, 150) gives 3 % and 63 %. Same language, the
// film's argument. It was already committed in `sets/kit.ts`, but only for materials that
// happened to pass through that file — every `mock` kit surface (the ground cards, the
// flora stands, the verge, the rocks) still read the rig and still washed out. Borrowed
// here with the seam, so one number reaches every film surface and the cover keeps its
// own; `sets/kit.ts`'s private copy is deleted as the redundancy it became.
const FILM_NEAR = 10;
const FILM_FAR = 150;

// Ambient life — flicker, turning ray bursts, the goblin's bob — is the motion nobody
// asked for. Under reduced motion it stops outright: motion §3.3/§14 supersedes the
// old 0.3 damping ("A = 0 — still, at lit pose"; "damped" motion still moves).
const AMBIENT =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : 1;

export default function Film({ caps }: { caps: Record<string, Element> }) {
  const world = useMemo(() => buildWorld(buildGoblin()), []);
  const { scene, camera, size, gl } = useThree();
  const curtainPass = useMemo(() => createCurtainPass(gl), [gl]);
  // preallocated scratch colour for the CSS grain layer's per-frame sky sync — see the
  // useFrame block below
  const skyCss = useMemo(() => new THREE.Color(), []);
  const paperColor = useMemo(() => new THREE.Color(PAPER), []);
  // Scratch for the portrait pull-back below. `authored` is the position the beat sheet
  // last wrote; `applied` is what we last handed the renderer. Comparing the two is how
  // the compensation stays idempotent — see the useFrame.
  const lens = useMemo(
    () => ({ pull: 1, authored: new THREE.Vector3(), applied: new THREE.Vector3(NaN) }),
    [],
  );
  // The key light and its aim target live in one group so both are in the scene graph
  // (a DirectionalLight only honours target when the target's matrix is updated by the
  // renderer). Positioned every frame in the useFrame below.
  const keyRig = useMemo(() => {
    const rig = new THREE.Group();
    // intensities carry the physically-correct π: Lambert's BRDF divides irradiance by
    // π, so "feels like 1.0" needs ~3.1 across the rig or the whole film exposes a
    // third as bright as authored.
    //
    // THE KEY'S COLOUR IS PER CHAPTER FAMILY and lives on `world.keyColor`, assigned
    // here BY IDENTITY — the same trick `rig.curtain` uses to reach every material, so
    // the beat sheet steps one object at a boundary and the light follows with no
    // per-frame owner. `KEY_I` never moves (§5.5); a family that wants a demoted key
    // gets it out of the colour's own luminance. It used to be `0xffeacc` inlined here,
    // which made the whole film one lighting family and put the warm key of a lantern
    // over a morning run, an overcast theatre and a dawn cliff alike.
    const key = new THREE.DirectionalLight(0xffffff, FILM_RIG.keyI);
    key.color = world.keyColor;
    rig.add(key, key.target);
    rig.userData.key = key;
    return rig;
  }, [world]);
  // scratch for the per-frame key placement
  const keyScratch = useMemo(() => ({ view: new THREE.Vector3(), right: new THREE.Vector3() }), []);

  // The canvas stays transparent so the page's paper grain shows through; fog fades
  // distant line-work to the same paper value, the way pencil drops off.
  useEffect(() => {
    scene.background = null;
    // "Distance is paper" (art bible C6). The far field fades to the PAGE, not to a
    // colour — the fog colour is fixed at the paper token and never tweens; the chapter
    // air rides world.air (timeline's `sky`/`skyCut`) and shows as the CSS wash.
    // 0.012 washed the middle distance flat by ~40 units out — most of "the background
    // is pale with no detail" was fog, not palette. 0.0085 keeps the painted world
    // readable twice as deep and still drops the far field onto the page.
    scene.fog = new THREE.FogExp2(paper, 0.0085);
  }, [scene]);

  // keep the composed horizontal field on narrow viewports instead of cropping it,
  // and keep every pencil stroke at its intended weight — screen-space lines need the
  // viewport size to know how wide to draw
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fitFov(size.width / size.height);
    cam.updateProjectionMatrix();
    // The pull-back below re-solves from `lens.authored` every frame, so a new ratio
    // lands on the next one for free. Do NOT invalidate `lens.applied` here: that would
    // tell the next frame to read the already-pulled position as the authored one, and
    // every resize would multiply the pull-back into itself.
    lens.pull = fitPullback(size.width / size.height);
    setPencilResolution(size.width, size.height);
  }, [camera, size.width, size.height, lens]);

  // He is the one thing that is alive behind the curtain, so he is in the mask from the
  // start; the props he touches join it a beat at a time (see `reveal` in curtain.ts).
  useEffect(() => {
    markAlive(world.goblin.root);
    // The finger at the table is him — same gob-skin, the only part of him C4 ever shows.
    // Without this registration the t41-47 freeze, which is the whole thesis of the film,
    // played out with nothing alive in the frame at all: 100% graphite, including the hand
    // doing the cheating.
    markAlive(world.nudgeFinger);
    // Firelight is a light source, not just a drawn flame: a warm point light in each
    // fire pool colours the ground, the logs and whoever sits close — the reference
    // boards' whole night-camp mood is this one warm pool against the cool dusk.
    // Parented into the flame group so it rides every beat the flames already run on;
    // intensity is driven per-frame next to the flicker in the useFrame below.
    for (const flame of [world.ambushFlames, world.fire2Flames]) {
      if (!flame.userData.glow) {
        const glow = new THREE.PointLight(0xffb45e, 0, 8, 2);
        glow.position.set(0, 0.5, 0);
        flame.add(glow);
        flame.userData.glow = glow;
      }
    }
    // A handle for QA, in the same spirit as `__film` below: `__curtain.value = 1` holds
    // the film behind the curtain at any scroll position, which is the only way to read
    // the graphite state of a beat that isn't a freeze.
    if (typeof window !== 'undefined') {
      (window as unknown as { __curtain?: unknown }).__curtain = curtain;
      // the sketch pass's grading knobs (hatch period/threshold/strength, restate,
      // wobble) — live-tunable so a style round is a console session, not a rebuild
      (window as unknown as { __sketch?: unknown }).__sketch = curtainPass.material.uniforms;
    }
  }, [world, curtainPass]);

  useEffect(() => () => curtainPass.dispose(), [curtainPass]);

  // Idle frame throttle (motion §15): at a held frame — no input, no t-change — drop
  // to 30fps after 12s; any input or scrub wakes it the same frame. Skipped deltas are
  // carried so the ambient clocks keep true pace at the lower rate.
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const idle = useMemo(
    () => ({ lastActive: 0, lastRender: 0, lastT: -1, carry: 0, skip: false }),
    [],
  );
  useEffect(() => {
    const wake = () => {
      idle.lastActive = performance.now();
    };
    wake();
    const events = ['pointerdown', 'pointermove', 'wheel', 'touchstart', 'keydown', 'scroll'];
    for (const e of events) window.addEventListener(e, wake, { passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, wake);
    };
  }, [idle]);

  // beat sheet lives entirely in the scroll timeline
  useEffect(() => {
    const tl = buildTimeline(world, camera, scene, caps);
    tlRef.current = tl;
    // A handle for QA: scrub to a beat and read the pose out of the rig rather than
    // squinting at a screenshot. Costs one property on `window` and has saved more rounds
    // than it costs — a reach that looks like an arm hanging at his side and a reach that
    // never fired are indistinguishable in a frame grab.
    if (typeof window !== 'undefined') {
      (window as unknown as { __film?: unknown }).__film = { world, tl, camera };
    }
    return () => {
      tlRef.current = null;
      // the gearing drive's scrub tween targets timeline.ts's local playhead, not tl,
      // so it can only be killed from in there — disposeTimeline owns the whole chain
      // (drive tween, ScrollTrigger, then the timeline itself)
      disposeTimeline(tl);
    };
  }, [world, camera, scene, caps]);

  useFrame((_state, delta) => {
    // Idle throttle gate: reading tl.time() is how a scrub counts as activity — the
    // wheel listener above only sees the input device, not play mode or a HUD jump.
    const now = performance.now();
    const t = tlRef.current ? tlRef.current.time() : 0;
    if (t !== idle.lastT) {
      idle.lastT = t;
      idle.lastActive = now;
    }
    idle.skip =
      now - idle.lastActive > IDLE_THROTTLE.afterS * 1000 &&
      now - idle.lastRender < 1000 / IDLE_THROTTLE.fps;
    if (idle.skip) {
      idle.carry += delta;
      return;
    }
    idle.lastRender = now;
    const d = delta + idle.carry;
    idle.carry = 0;

    // The two clocks (motion §4): world.t freezes on cue — timeScale is a prop tweened
    // by the master timeline, never gsap.globalTimeline — and gobT never stops, so he
    // is alive by construction rather than by exception.
    world.t += d * world.timeScale;
    world.gobT += d;

    // His ink contour is a CSS-px quantity (world §5.12) and the film's lens moves, so it
    // re-solves from the live camera every frame — but the FIGURE owns that solve now
    // (stages/goblin.ts, the shell's own onBeforeRender), so the film no longer runs a
    // second solver over the same vertex buffer.

    // Portrait can't open the lens wide enough to hold the composed horizontal field
    // (framing.ts caps it), so it steps the lens back along its own axis instead. It has
    // to happen here rather than on the timeline: it composes with every authored camera
    // move, including the ones a visitor is scrubbing through, without any of them
    // knowing about it.
    //
    // The scrub is the reason for the two vectors. GSAP only writes camera.position while
    // a tween is actually running — stop scrolling and it stops writing — so scaling the
    // position in place would compound frame after frame and fly the camera off. If the
    // position is still exactly what we left there, the beat sheet has not spoken since,
    // and the authored value we cached is the one to scale.
    //
    // It runs unconditionally rather than under `pull !== 1`, because at 1 it is the
    // identity and running it keeps the two vectors honest — otherwise a viewport that
    // goes portrait and back leaves the lens parked at the pulled position until the
    // next authored camera move happens to overwrite it.
    if (!camera.position.equals(lens.applied)) lens.authored.copy(camera.position);
    camera.position
      .subVectors(lens.authored, world.look)
      .multiplyScalar(lens.pull)
      .add(world.look);
    lens.applied.copy(camera.position);

    camera.lookAt(world.look);

    // The key light re-stages itself for every shot: high, forward of the subject and
    // to the lens's left, aimed at the look target. One rule, every set — a fixed sun
    // can't serve sets that live 126 units apart.
    {
      const key = keyRig.userData.key as THREE.DirectionalLight;
      keyScratch.view.subVectors(camera.position, world.look).normalize();
      keyScratch.right.crossVectors(keyScratch.view, camera.up).normalize();
      key.position
        .copy(world.look)
        .addScaledVector(keyScratch.view, 10)
        .addScaledVector(camera.up, 14)
        .addScaledVector(keyScratch.right, -9);
      key.target.position.copy(world.look);
    }

    // flame flicker reads the world clock — visibly stops during a freeze
    const flames: [THREE.Group, number][] = [
      [world.ambushFlames, 0],
      [world.fire2Flames, 1],
    ];
    for (const [flame, i] of flames) {
      const lit = flame.userData.lit as number;
      const s = lit * (1 + FLICKER.scaleAmp * AMBIENT * Math.sin(world.t * FLICKER.scaleRate + i));
      flame.scale.set(
        s,
        lit * (1 + FLICKER.pulseAmp * AMBIENT * Math.abs(Math.sin(world.t * FLICKER.pulseRate + i))),
        s,
      );
      // the light breathes with the flame — same clock, so a freeze stills it too
      const glow = flame.userData.glow as THREE.PointLight | undefined;
      if (glow)
        glow.intensity =
          lit *
          (FLICKER.glowBase +
            FLICKER.glowAmp * AMBIENT * Math.abs(Math.sin(world.t * FLICKER.pulseRate + i)));
      // ROW 13'S ONE PIECE OF AUTHORED MOTION, and until now nothing called it.
      // `fire.ts` builds the ember plume with its own bob — `y = 0.15·a·sin(t·1.46)`, no
      // `mod(t, period)` so a backward scrub cannot find a teleport — and hands it out on
      // `embers.userData.bob` "for whoever wires this into a stage". Nobody did, so the
      // embers hung still in every fire in the film. This is the stage.
      const embers = flame.getObjectByName('embers')?.parent;
      const bob = embers?.userData.bob as ((t: number, a?: number) => number) | undefined;
      if (embers && bob) embers.position.y = bob(world.t, AMBIENT);
    }

    // Goblin gait and breath — driven by gobT so they keep running through a world
    // freeze, and additive over whatever pose the beat sheet authored. The maths lives in
    // actions.ts so the puppet check can assert against the code that ships.
    applyGait(world.goblin, world.gobT, AMBIENT);

    // C2's sky, kept alive through the same freeze the gait above survives — driven off
    // gobT rather than world.t for the same reason. A pure function of gobT rather than
    // a per-frame accumulator (`+=`), so scrubbing or pausing always lands on the same
    // frame instead of drifting. Trees do NOT sway — tried a whole-row rotation.z here
    // and it read as the background wobbling, not air, so the forest stays still and
    // only the sky drifts. Wraps every ~115s (46 units / 0.4 per second), slow enough
    // that within any one C2 shot it reads as ambient sky, not motion for its own sake;
    // euclideanModulo keeps it a pure function of gobT so a scrub-back never meets a seam.
    const cloudMinX = -8;
    const cloudWrapWidth = 46;
    for (const cloud of world.pathClouds) {
      const baseX = cloud.userData.baseX as number;
      cloud.position.x =
        THREE.MathUtils.euclideanModulo(baseX + world.gobT * 0.4 * AMBIENT - cloudMinX, cloudWrapWidth) +
        cloudMinX;
    }

    // frozen-mid-wobble die
    world.die.rotation.z = 0.02 * Math.sin(world.gobT * 6) * world.dieWobble;

    // The CSS wash behind the transparent canvas is where the chapter AIR shows. Its top
    // stop tracks world.air — the carrier the timeline tweens at every boundary now that
    // fog is pinned to paper — lerped toward paper by curtain.value so a freeze reads as
    // the page there too, exactly as the curtain shader does for the canvas.
    skyCss.copy(world.air).lerp(paperColor, curtain.value);
    document.documentElement.style.setProperty('--sky', `#${skyCss.getHexString()}`);
  });

  // Priority > 0 hands the render over from R3F to us: the film goes through the
  // curtain pass on its way to the canvas. Runs after the animation frame above, which
  // is priority 0 and owns the idle-throttle verdict for this frame.
  //
  // THE SEAM IS PARKED FOR THE LENGTH OF THIS PASS, AND HANDED STRAIGHT BACK.
  //
  // `rig.seamX` is a module singleton shared by every trilayer material in the app, and
  // it has two owners on two canvases: the cover stages it at SEAM_X = 1.0 and
  // `heroLife` drains it to BLANK_X = −3.4 at the handoff. Nothing put it back, and
  // `triSeamF = smoothstep(seamX−w, seamX+w, x)` makes everything EAST of the line
  // Prep, so with the film's sets living at x = 0…126 the whole world rendered as
  // GRAPHITE for the entire run — every ground card, flora stand, verge and rock. The
  // film had never shown most of its own paint (client ruling, 2026-09-05).
  //
  // Parked here rather than stepped on the beat sheet, because a `tl.set` at t0 cannot
  // hold it. `Hero.tsx` only HIDES the cover, so `preScrub` stays registered for the
  // whole film; the drive applies `tl.time()` and THEN `preScrub`, so on the frame the
  // playhead crosses 0 the handoff's last frame writes BLANK_X *after* the set has
  // fired, and `scrubTo` then saturates at HERO_T and never writes again — measured:
  // the set never gets a second chance and the run stays at −3.4. A one-way write in
  // the drive fixes that direction and breaks the other: scrubbing back into the cover,
  // GSAP will not re-render a tween the playhead is still past, so the hero's drained
  // page came back PAINTED under its own rising blackout (measured, t −1.0 → 0).
  //
  // A uniform with two owners is per-render-pass state, so it is borrowed per render
  // pass. The film's surfaces always draw with the seam parked — the global curtain
  // alone drives painted-versus-drawn — and the cover's own canvas always draws with
  // whatever its bloom and drain last wrote. Reversible in both directions by
  // construction, at every t, with no frame in between and nothing to un-set.
  //
  // The depth ramp is borrowed on the same argument and for the same reason: see
  // FILM_NEAR / FILM_FAR above. Three uniforms, one borrow, no per-beat owner.
  useFrame(() => {
    if (idle.skip) return;
    const hero = { seam: rig.seamX.value, near: rig.depthNear.value, far: rig.depthFar.value };
    rig.seamX.value = PARKED_SEAM;
    rig.depthNear.value = FILM_NEAR;
    rig.depthFar.value = FILM_FAR;
    curtainPass.render(scene, camera);
    rig.seamX.value = hero.seam;
    rig.depthNear.value = hero.near;
    rig.depthFar.value = hero.far;
  }, 1);

  // The light rig (draft 5, regraded): the film's solids are lit Lambert, so form
  // reads as real 3D. The key RIDES THE CAMERA (up and to the lens's left, re-aimed at
  // the look target every frame): the film's sets span x=0..126, so any fixed sun
  // leaves half the shots staring at their own shade side. The rig is no longer grey:
  // warm key, cool sky fill, warm earth bounce — the classic painted-illustration
  // split. The old 2.5 white hemisphere over a 1.6 key flooded every shade side flat
  // and clipped the lit sides toward white, which is most of why the colour pass read
  // pale; the fill now sits well under the key so every mass keeps a lit and a shade
  // side with its hue intact.
  return (
    <>
      <hemisphereLight args={[FILM_RIG.sky, FILM_RIG.ground, FILM_RIG.hemiI]} />
      <primitive object={keyRig} />
      <primitive object={world.root} />
    </>
  );
}
