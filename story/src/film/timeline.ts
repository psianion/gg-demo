import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import type { World } from './world';

gsap.registerPlugin(ScrollTrigger);

type Vec3 = [number, number, number];

// deviation from the spec's literal numbers: the C2 run fills its whole
// 17->30 window with 7 equal prop stops (x up to 30, the last prop's
// position) — there is no slack left in that window to also reach x=34
// before t=30, so the post-C2 dash (30->31.5) starts from x=30 instead.
// order and total length (66) are unchanged.

export function buildTimeline(
  world: World,
  camera: THREE.Camera,
  caps: Record<string, HTMLElement>,
): gsap.core.Timeline {
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#track',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
    },
  });

  // caption: fade in, hold, fade out
  const cap = (id: string, at: number, hold: number) => {
    const el = caps[id];
    if (!el) return;
    tl.to(el, { opacity: 1, duration: 0.4 }, at);
    tl.to(el, { opacity: 0, duration: 0.4 }, at + hold);
  };

  // camera position + look target tweened together
  const cam = (at: number, dur: number, pos: Vec3, look: Vec3, ease = 'power2.inOut') => {
    tl.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], duration: dur, ease }, at);
    tl.to(world.look, { x: look[0], y: look[1], z: look[2], duration: dur, ease }, at);
  };

  // hard cut — no interpolation
  const cut = (at: number, pos: Vec3, look: Vec3) => {
    tl.set(camera.position, { x: pos[0], y: pos[1], z: pos[2] }, at);
    tl.set(world.look, { x: look[0], y: look[1], z: look[2] }, at);
  };

  const goblin = world.goblin;

  // ---- t0-4: blackout up, cold open ----------------------------------
  cap('open1', 0.5, 2.5);
  tl.to('#hint', { opacity: 0, duration: 0.3 }, 0.6);

  // ---- t4-5.5: blackout lifts on the ambush tableau -------------------
  tl.to('#blackout', { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 4);
  cam(4, 1.5, [0, 2.0, 6.2], [0, 0.8, 0]);

  // ---- t5-6: goblin peeks from behind the rock ------------------------
  tl.to(goblin.root.position, { y: 0, duration: 1, ease: 'power2.out' }, 5);

  cap('open2', 6, 2);

  // ---- t8.5-9.5: he bolts ----------------------------------------------
  tl.to(goblin.root.rotation, { y: Math.PI / 2, duration: 1 }, 8.5);
  tl.to(goblin, { speed: 1, duration: 1 }, 8.5);
  tl.to(goblin.root.position, { x: 2.5, duration: 1 }, 8.5);

  // ---- t9.5-10: FREEZE, camera pushes in --------------------------------
  tl.to(world, { timeScale: 0, duration: 0.2 }, 9.5);
  tl.to(goblin, { speed: 0, duration: 0.2 }, 9.5);
  cam(9.5, 1, [2.5, 1.1, 3.2], [2.5, 0.7, 0.9], 'power2.inOut');

  // ---- t10.2-11: goblin looks at camera ---------------------------------
  tl.to(goblin.head.rotation, { y: -2.2, duration: 0.5 }, 10.2);

  cap('me1', 10.8, 1.6);
  cap('me2', 12.8, 1.4);
  cap('me3', 14.4, 1.0);
  cap('me4', 15.6, 1.4);

  // ---- t16.5-17: head back, world thaws ---------------------------------
  tl.to(goblin.head.rotation, { y: 0, duration: 0.5 }, 16.5);
  tl.to(world, { timeScale: 1, duration: 0.5 }, 16.5);
  tl.to(goblin, { speed: 1, duration: 0.5 }, 16.5);

  // ---- t17-30: C2 run — 7 props, one per piecewise segment ---------------
  const c2Start = 17;
  const c2End = 30;
  const c2Xs = [6, 10, 14, 18, 22, 26, 30];
  const c2Window = (c2End - c2Start) / c2Xs.length;

  const c2PropAction = (i: number, at: number, dur: number) => {
    switch (i) {
      case 0: // campfire2
        tl.to(world.fire2Flames.userData, { lit: 1, duration: dur }, at);
        tl.to(world.fire2Rays.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, at);
        break;
      case 1: // lantern
        tl.to(world.lanternRays.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, at);
        break;
      case 2: // cave door
        tl.to(world.caveDoor.rotation, { y: -1.9, duration: dur }, at);
        break;
      case 3: // chest
        tl.to(world.chestLid.rotation, { x: -1.3, duration: dur }, at);
        tl.to(world.chestCoins.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, at);
        break;
      case 4: { // ravens scatter
        const offsets: Vec3[] = [
          [1.5, 2.5, 1],
          [-1.5, 3.0, -1],
          [1.5, 3.5, -1],
        ];
        world.ravens.forEach((raven, ri) => {
          const [dx, dy, dz] = offsets[ri];
          tl.to(
            raven.position,
            {
              x: raven.position.x + dx,
              y: raven.position.y + dy,
              z: raven.position.z + dz,
              duration: dur,
            },
            at + ri * 0.1,
          );
        });
        break;
      }
      case 5: // mushrooms pop up
        world.mushrooms.forEach((m, mi) => {
          tl.to(m.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, at + mi * 0.12);
        });
        break;
      case 6: // signpost straightens
        tl.to(world.signBoard.rotation, { z: 0, duration: dur }, at);
        break;
    }
  };

  c2Xs.forEach((x, i) => {
    const segAt = c2Start + i * c2Window;
    const runDur = 0.9;
    const reachAt = segAt + runDur;
    const reachDur = 0.3;
    const actionAt = reachAt + reachDur;
    const actionDur = 0.5;
    const backAt = actionAt + actionDur;
    const backDur = 0.15;

    tl.to(goblin.root.position, { x, duration: runDur }, segAt);
    tl.to(camera.position, { x, y: 2.3, z: 6, duration: c2Window }, segAt);
    tl.to(world.look, { x, y: 0.8, z: 0, duration: c2Window }, segAt);

    tl.to(goblin, { speed: 0, duration: reachDur }, reachAt);
    tl.to(goblin.armR.pose.rotation, { x: -2.0, duration: reachDur }, reachAt);

    c2PropAction(i, actionAt, actionDur);

    tl.to(goblin.armR.pose.rotation, { x: 0, duration: backDur }, backAt);
    tl.to(goblin, { speed: 1, duration: backDur }, backAt);
  });

  // ---- t30-31.5: dash to the rope, camera settles wide -------------------
  tl.to(goblin.root.position, { x: 38.5, duration: 1.5 }, 30);
  cam(30, 1.5, [44, 3.5, 14], [44, 1.4, -2]);

  // ---- t31.5-35: rope pull swings the theatre disc ------------------------
  tl.to(goblin, { speed: 0, duration: 0.2 }, 31.5);
  tl.to(goblin.armL.pose.rotation, { x: -2.4, duration: 0.4 }, 31.5);
  tl.to(goblin.armR.pose.rotation, { x: -2.4, duration: 0.4 }, 31.5);
  tl.to(goblin.root.rotation, { z: 0.15, duration: 0.4 }, 31.5);

  tl.to(world.stageDisc.rotation, { y: `+=${Math.PI}`, duration: 2.5, ease: 'power2.inOut' }, 32.0);
  tl.to(
    world.rope.position,
    { y: '+=0.15', duration: 0.2, repeat: 12, yoyo: true, ease: 'sine.inOut' },
    32.0,
  );

  tl.to(goblin.armL.pose.rotation, { x: 0, duration: 0.5 }, 34.5);
  tl.to(goblin.armR.pose.rotation, { x: 0, duration: 0.5 }, 34.5);
  tl.to(goblin.root.rotation, { z: 0, duration: 0.5 }, 34.5);

  // ---- t35-36: wave to camera ----------------------------------------------
  tl.to(goblin.armR.pose.rotation, { z: -2.6, duration: 0.2 }, 35);
  tl.to(goblin.armR.pose.rotation, { z: '+=0.3', duration: 0.15, yoyo: true, repeat: 3 }, 35.2);
  tl.to(goblin.armR.pose.rotation, { z: 0, duration: 0.2 }, 35.8);

  // ---- t36-38: off to the tavern, camera hands off to him -------------------
  tl.to(goblin, { speed: 1, duration: 0.3 }, 36);
  tl.to(goblin.root.position, { x: 54, duration: 2 }, 36);
  cam(36, 2, [50, 1.6, 5], [52, 0.7, 0]);

  // ---- t38: C4 hard cut ------------------------------------------------------
  cut(38, [80, 2.1, 6.2], [80, 1.0, 0]);
  tl.set(goblin.root.position, { x: 84.5, y: 0, z: 1.5 }, 38);
  tl.set(goblin, { speed: 0 }, 38);

  // ---- t38-40: the die tumbles, two bounces, settles -------------------------
  const dieAt = 38;
  tl.to(world.dieInner.position, { y: 1.21, duration: 0.35, ease: 'power2.in' }, dieAt);
  tl.to(world.dieInner.position, { y: 1.45, duration: 0.25, ease: 'power2.out' }, dieAt + 0.35);
  tl.to(world.dieInner.position, { y: 1.21, duration: 0.25, ease: 'power2.in' }, dieAt + 0.6);
  tl.to(world.dieInner.position, { y: 1.28, duration: 0.2, ease: 'power2.out' }, dieAt + 0.85);
  tl.to(world.dieInner.position, { y: 1.21, duration: 0.95, ease: 'power3.out' }, dieAt + 1.05);

  tl.to(world.dieInner.position, { x: 80.4, z: 0.1, duration: 1.05, ease: 'power1.out' }, dieAt);
  tl.to(world.dieInner.position, { x: 80, z: 0, duration: 0.95, ease: 'power3.out' }, dieAt + 1.05);

  tl.to(world.dieInner.rotation, { x: '+=9', y: '+=5.5', duration: 2, ease: 'power3.out' }, dieAt);

  cap('nat1', 40.2, 1.4);

  // ---- t40.6-41: tick, FREEZE, camera creeps in --------------------------------
  tl.to(world, { timeScale: 0, duration: 0.15 }, 40.6);
  tl.set(world, { dieWobble: 1 }, 40.6);
  cam(40.6, 3, [80.9, 1.7, 3.4], [80, 1.2, 0], 'power1.inOut');

  // ---- t41-42.6: goblin strolls in to look ---------------------------------------
  tl.to(goblin.root.rotation, { y: -Math.PI / 2, duration: 0.3 }, 41);
  tl.to(goblin, { speed: 0.7, duration: 0.3 }, 41);
  tl.to(goblin.root.position, { x: 81.1, z: 0.9, duration: 1.3 }, 41);
  tl.to(goblin, { speed: 0, duration: 0.3 }, 42.3);

  // ---- t42.6-43.2: looks at die, then at us ----------------------------------------
  tl.to(goblin.head.rotation, { y: 0.6, duration: 0.2 }, 42.6);
  tl.to(goblin.head.rotation, { y: -1.8, duration: 0.4 }, 42.8);

  // ---- t43.4-44: shrug -----------------------------------------------------------
  tl.to(goblin.armL.pose.rotation, { z: -0.9, duration: 0.3, yoyo: true, repeat: 1 }, 43.4);
  tl.to(goblin.armR.pose.rotation, { z: 0.9, duration: 0.3, yoyo: true, repeat: 1 }, 43.4);

  // ---- t44-44.8: the tiny push --------------------------------------------------
  tl.to(goblin.armR.pose.rotation, { x: -1.6, duration: 0.3 }, 44);
  tl.to(world.dieInner.rotation, { z: '-=0.35', duration: 0.3 }, 44.1);
  tl.to(world.dieInner.position, { x: '-=0.12', duration: 0.3 }, 44.1);
  tl.to(world, { dieWobble: 0, duration: 0.3 }, 44.3);

  // ---- t44.8-45.4: dust-off, then hands settle back ------------------------------
  tl.to(goblin.armL.pose.rotation, { x: '+=0.5', duration: 0.15, yoyo: true, repeat: 3 }, 44.8);
  tl.to(goblin.armR.pose.rotation, { x: '-=0.5', duration: 0.15, yoyo: true, repeat: 3 }, 44.8);
  tl.to(goblin.armL.pose.rotation, { x: 0, duration: 0.1 }, 45.3);
  tl.to(goblin.armR.pose.rotation, { x: 0, duration: 0.1 }, 45.3);

  // ---- t45.4-46.6: walks off, die re-rolls itself --------------------------------
  tl.to(goblin.root.rotation, { y: Math.PI / 2, duration: 0.2 }, 45.4);
  tl.to(goblin, { speed: 0.7, duration: 0.2 }, 45.4);
  tl.to(goblin.root.position, { x: 84.5, z: 1.5, duration: 0.8 }, 45.4);
  tl.to(goblin, { speed: 0, duration: 0.2 }, 46.2);

  tl.to(world.dieInner.rotation, { x: '+=6.5', y: '+=4', duration: 1.2, ease: 'power3.out' }, 45.4);
  tl.to(world.dieInner.position, { x: '+=0.05', z: '+=0.03', duration: 1.2, ease: 'power3.out' }, 45.4);

  cap('nat20', 46.8, 1.3);
  tl.to(world, { timeScale: 1, duration: 0.3 }, 47);

  cap('welcome', 48.4, 1.6);

  // ---- t50-57.5: C5 montage — six hard-cut vignettes ------------------------------
  const c5Xs = [0, 8, 16, 24, 32, 40];
  c5Xs.forEach((x, i) => {
    const at = 50 + i * 1.25;
    const dur = 0.9;

    cut(at, [x, 1.9, -35.6], [x, 0.7, -40]);

    // goblin is mid-job in every frame: set into place at the cut
    tl.set(goblin.root.position, { x: x - 1.5, y: 0, z: -38.5 }, at);
    tl.set(goblin.root.rotation, { y: Math.PI / 2, z: 0 }, at);
    tl.set(goblin, { speed: 0 }, at);
    tl.set(goblin.armR.pose.rotation, { x: -1.2 }, at);

    switch (i) {
      case 0: // map table — road being drawn
        tl.to(world.roadLine.scale, { x: 1, duration: dur }, at);
        break;
      case 1: // monster rears up
        tl.to(world.monster.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, at);
        break;
      case 2: // sign drops onto its bracket
        tl.to(world.tavernSign.position, { y: '-=1.2', duration: dur, ease: 'bounce.out' }, at);
        break;
      case 3: // trees planted
        world.trees5.forEach((tree, ti) => {
          tl.to(tree.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, at + ti * 0.15);
        });
        break;
      case 4: // chest opened
        tl.to(world.chest5Lid.rotation, { x: -1.3, duration: dur }, at);
        tl.to(world.chest5Coins.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, at);
        break;
      case 5: // candles lit
        tl.to(world.candleRays.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, at);
        break;
    }
  });

  // ---- t57.5: C6 hard cut to the cliff, over-the-shoulder -------------------------
  tl.set(goblin.root.position, { x: 122.6, y: 6, z: 0 }, 57.5);
  tl.set(goblin.root.rotation, { y: Math.PI / 2 }, 57.5);
  cut(57.5, [117.5, 7.4, 3.2], [123, 6.6, 0]);

  // ---- t58.5-62: camera rises to dead top-down -------------------------------------
  cam(58.5, 3.5, [128, 26, 8], [146, 2, 0], 'power2.inOut');
  cam(62, 2.5, [145, 40, 0.01], [145, 0, 0], 'power2.inOut');

  // ---- t60-62: the miniature world flattens during the rise ------------------------
  const miniScales = world.miniWorld.map((g) => g.scale);
  tl.to(miniScales, { y: 0.02, duration: 1.5, stagger: 0.05, ease: 'power2.in' }, 60);

  // ---- t62.5-64.5: the throw — die2 arcs into the top-down camera -------------------
  tl.to(world.die2.scale, { x: 1, y: 1, z: 1, duration: 0.3 }, 62.5);
  tl.to(world.die2.position, { x: 145, z: 0, duration: 2 }, 62.5);
  tl.to(world.die2.position, { y: 30, duration: 1, ease: 'power1.out' }, 62.5);
  tl.to(world.die2.position, { y: 35.2, duration: 1, ease: 'power2.in' }, 63.5);
  tl.to(world.die2.rotation, { x: '+=12', y: '+=8', duration: 2, ease: 'power2.out' }, 62.5);

  // ---- t64.5-65.5: board fades in, die settles ---------------------------------------
  const boardMaterials: THREE.Material[] = [];
  world.board.traverse((obj) => {
    const mesh = obj as THREE.Object3D & { material?: THREE.Material | THREE.Material[] };
    if (!mesh.material) return;
    if (Array.isArray(mesh.material)) boardMaterials.push(...mesh.material);
    else boardMaterials.push(mesh.material);
  });
  tl.to(boardMaterials, { opacity: 1, duration: 0.6 }, 64.5);
  tl.to(world.die2.position, { y: '-=0.15', duration: 0.2, yoyo: true, repeat: 1 }, 64.5);

  cap('nat20', 64.7, 1.2);

  // ---- t65.5-66: endcard, stays up -----------------------------------------------------
  if (caps.endcard) {
    tl.to(caps.endcard, { opacity: 1, duration: 0.5 }, 65.5);
  }

  return tl;
}
