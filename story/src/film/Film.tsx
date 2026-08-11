import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { buildWorld } from './world';
import { buildTimeline } from './timeline';
import { fitFov } from './framing';

const PAPER = 0xf7f5f0;

export default function Film({ caps }: { caps: Record<string, HTMLElement> }) {
  const world = useMemo(buildWorld, []);
  const { scene, camera, size } = useThree();

  // background + fog match the paper — distant line-work fades like pencil
  useEffect(() => {
    scene.background = new THREE.Color(PAPER);
    scene.fog = new THREE.FogExp2(PAPER, 0.012);
  }, [scene]);

  // keep the composed horizontal field on narrow viewports instead of cropping it
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fitFov(size.width / size.height);
    cam.updateProjectionMatrix();
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
      const s = lit * (1 + 0.18 * Math.sin(world.t * 9 + i));
      flame.scale.set(s, lit * (1 + 0.3 * Math.abs(Math.sin(world.t * 13 + i))), s);
    }

    // ray bursts slowly rotate ambiently; scale is timeline-owned
    world.fire2Rays.rotation.z = world.t * 0.5;
    world.lanternRays.rotation.z = world.t * 0.5;
    world.candleRays.rotation.z = world.t * 0.5;

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
