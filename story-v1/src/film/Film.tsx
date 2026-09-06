import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { buildWorld } from './world';
import { buildTimeline } from './timeline';
import { fitFov, fitPullback } from './framing';
import { PAPER, setPencilResolution } from './pencil';
import { applyGait } from './actions';
import { createCurtainPass, curtain, markAlive } from './curtain';
import { skyDusk } from './palette';

// Ambient life — flicker, turning ray bursts, the goblin's bob — is the motion nobody
// asked for, so it damps under reduced motion rather than stopping: the freeze grammar
// only reads if there is something alive to freeze.
const AMBIENT =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0.3
    : 1;

export default function Film({ caps }: { caps: Record<string, Element> }) {
  const world = useMemo(() => buildWorld(), []);
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
    // third as bright as authored. Warm sun, not white: the warm-key/cool-fill split is
    // what makes lit form read as daylight instead of a lab scan.
    const key = new THREE.DirectionalLight(0xffeacc, 2.2);
    rig.add(key, key.target);
    rig.userData.key = key;
    return rig;
  }, []);
  // scratch for the per-frame key placement
  const keyScratch = useMemo(() => ({ view: new THREE.Vector3(), right: new THREE.Vector3() }), []);

  // The canvas stays transparent so the page's paper grain shows through; fog still
  // fades distant line-work to the same paper value, the way pencil drops off.
  // ponytail: fogged geometry is flat paper against grained paper — invisible at this
  // grain contrast. The curtain pass keeps that true by construction: paper in, paper
  // out, so distance still fades to the page whichever state the film is in.
  useEffect(() => {
    scene.background = null;
    // C1 opens on sky-dusk; the timeline tweens this fog colour at every chapter
    // boundary (see the `sky`/`skyCut` helpers in timeline.ts).
    // 0.012 washed the middle distance to flat sky by ~40 units out — most of "the
    // background is pale with no detail" was fog, not palette. 0.0085 keeps the painted
    // world readable twice as deep and still fades the far field into the chapter air.
    scene.fog = new THREE.FogExp2(skyDusk, 0.0085);
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

  // beat sheet lives entirely in the scroll timeline
  useEffect(() => {
    const tl = buildTimeline(world, camera, scene, caps);
    // A handle for QA: scrub to a beat and read the pose out of the rig rather than
    // squinting at a screenshot. Costs one property on `window` and has saved more rounds
    // than it costs — a reach that looks like an arm hanging at his side and a reach that
    // never fired are indistinguishable in a frame grab.
    if (typeof window !== 'undefined') {
      (window as unknown as { __film?: unknown }).__film = { world, tl, camera };
    }
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [world, camera, scene, caps]);

  useFrame((_state, delta) => {
    // two clocks: world freezes on cue, goblin never does
    world.t += delta * world.timeScale;
    world.gobT += delta;

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
      const s = lit * (1 + 0.18 * AMBIENT * Math.sin(world.t * 9 + i));
      flame.scale.set(s, lit * (1 + 0.3 * AMBIENT * Math.abs(Math.sin(world.t * 13 + i))), s);
      // the light breathes with the flame — same clock, so a freeze stills it too
      const glow = flame.userData.glow as THREE.PointLight | undefined;
      if (glow) glow.intensity = lit * (4.5 + 1.6 * AMBIENT * Math.abs(Math.sin(world.t * 13 + i)));
    }

    // ray bursts slowly rotate ambiently; scale is timeline-owned
    const spin = world.t * 0.5 * AMBIENT;
    world.fire2Rays.rotation.z = spin;
    world.lanternRays.rotation.z = spin;
    world.candleRays.rotation.z = spin;

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

    // The CSS grain layer behind the transparent canvas is the third surface the sky
    // lives on (see color-script.md §1). It tracks the same fog colour the WebGL side
    // already carries through the curtain pass, lerped toward paper by curtain.value so
    // a freeze reads as parchment there too — the curtain shader already does exactly
    // this for the canvas by construction (graphite ramp discards hue under the mask),
    // this is the same rule applied to the one surface outside WebGL.
    if (scene.fog) {
      skyCss.copy((scene.fog as THREE.FogExp2).color).lerp(paperColor, curtain.value);
      document.documentElement.style.setProperty('--sky', `#${skyCss.getHexString()}`);
    }
  });

  // Priority > 0 hands the render over from R3F to us: the film goes through the
  // curtain pass on its way to the canvas. Runs after the animation frame above, which
  // is priority 0.
  useFrame(() => curtainPass.render(scene, camera), 1);

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
      <hemisphereLight args={[0xcdd9e8, 0x8a7458, 1.45]} />
      <primitive object={keyRig} />
      <primitive object={world.root} />
    </>
  );
}
