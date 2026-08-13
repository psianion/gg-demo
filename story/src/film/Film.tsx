import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { buildWorld } from './world';
import { buildTimeline } from './timeline';
import { fitFov } from './framing';
import { PAPER, setPencilResolution } from './pencil';

// Ambient life — flicker, turning ray bursts, the goblin's bob — is the motion nobody
// asked for, so it damps under reduced motion rather than stopping: the freeze grammar
// only reads if there is something alive to freeze.
const AMBIENT =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0.3
    : 1;

export default function Film({ caps }: { caps: Record<string, Element> }) {
  const world = useMemo(buildWorld, []);
  const { scene, camera, size } = useThree();

  // The canvas stays transparent so the page's paper grain shows through; fog still
  // fades distant line-work to the same paper value, the way pencil drops off.
  // ponytail: fogged geometry is flat paper against grained paper — invisible at this
  // grain contrast, and the honest fix is the milestone 4 post-pass, not a second one now.
  useEffect(() => {
    scene.background = null;
    scene.fog = new THREE.FogExp2(PAPER, 0.012);
  }, [scene]);

  // keep the composed horizontal field on narrow viewports instead of cropping it,
  // and keep every pencil stroke at its intended weight — screen-space lines need the
  // viewport size to know how wide to draw
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fitFov(size.width / size.height);
    cam.updateProjectionMatrix();
    setPencilResolution(size.width, size.height);
  }, [camera, size.width, size.height]);

  // beat sheet lives entirely in the scroll timeline
  useEffect(() => {
    const tl = buildTimeline(world, camera, caps);
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [world, camera, caps]);

  useFrame((_state, delta) => {
    // two clocks: world freezes on cue, goblin never does
    world.t += delta * world.timeScale;
    world.gobT += delta;

    camera.lookAt(world.look);

    // flame flicker reads the world clock — visibly stops during a freeze
    const flames: [THREE.Group, number][] = [
      [world.ambushFlames, 0],
      [world.fire2Flames, 1],
    ];
    for (const [flame, i] of flames) {
      const lit = flame.userData.lit as number;
      const s = lit * (1 + 0.18 * AMBIENT * Math.sin(world.t * 9 + i));
      flame.scale.set(s, lit * (1 + 0.3 * AMBIENT * Math.abs(Math.sin(world.t * 13 + i))), s);
    }

    // ray bursts slowly rotate ambiently; scale is timeline-owned
    const spin = world.t * 0.5 * AMBIENT;
    world.fire2Rays.rotation.z = spin;
    world.lanternRays.rotation.z = spin;
    world.candleRays.rotation.z = spin;

    // goblin gait — driven by gobT so it keeps moving through a world freeze
    const g = world.goblin;
    const sw = Math.sin(world.gobT * 11) * g.speed;
    g.legL.rotation.x = sw * 0.8;
    g.legR.rotation.x = -sw * 0.8;
    g.armL.swing.rotation.x = -sw * 0.6;
    g.armR.swing.rotation.x = sw * 0.6;
    g.torso.position.y = 0.3 + 0.025 * Math.abs(Math.sin(world.gobT * 22)) * g.speed;

    // frozen-mid-wobble die
    world.die.rotation.z = 0.02 * Math.sin(world.gobT * 6) * world.dieWobble;
  });

  return <primitive object={world.root} />;
}
