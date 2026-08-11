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
//
// camera grammar revised per review: travel/work beats (C2 run t17-30,
// theatre dash/wide t30-31.5, off-to-tavern t36-38, C5 montage t50-57.5)
// now follow the goblin three-quarter-back over-the-shoulder instead of
// a lateral side dolly. Cold open/ambush/freeze (t0-17), the dice/tavern
// scene (t38-50), and the cliff OTS + top-down ending (t57.5-66) keep
// their original staging.

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

  // ---- t16.5-17: head back, but the world stays frozen --------------------
  // The lighting run is the goblin's hidden work, and the art direction is explicit
  // that this happens behind the curtain: the world holds still while he works and
  // snaps back only when he's finished (t30). A fire he lights mid-freeze sits there
  // lit and perfectly motionless until time resumes — that stillness is the point.
  tl.to(goblin.head.rotation, { y: 0, duration: 0.5 }, 16.5);
  tl.to(goblin, { speed: 1, duration: 0.5 }, 16.5);

  // ---- t17-30: C2 run — 7 props, one per piecewise segment ---------------
  const c2Start = 17;
  const c2End = 30;

  // Where he stands, and what he actually puts a hand on. He used to stop on the path
  // at the prop's own x and reach straight ahead, which left him grasping at air for
  // the cave door (2 units off the path), the mushrooms (1.2 off) and the branch
  // (1.6 up, and he is 0.9 tall) — so the props appeared to move by themselves.
  const c2Props: { stand: [number, number]; hand: Vec3; reach: number }[] = [
    { stand: [5.3, 0.5], hand: [6, 0.35, 0], reach: -1.35 }, // down to the fire
    { stand: [9.35, 0.42], hand: [10, 1.1, 0], reach: -2.75 }, // up to the lantern
    { stand: [13.05, -1.2], hand: [13.4, 0.85, -2], reach: -2.0 }, // off-path to the door
    { stand: [17.3, 0.55], hand: [18, 0.4, 0], reach: -1.5 }, // lift the chest lid
    { stand: [21.5, 0.6], hand: [22, 1.62, 0], reach: -2.95 }, // shoo the branch
    { stand: [25.7, -0.55], hand: [26, 0.14, -1.2], reach: -1.25 }, // down to the mushrooms
    { stand: [29.4, 0.5], hand: [30, 1.0, 0], reach: -2.4 }, // straighten the sign
  ];
  const c2Window = (c2End - c2Start) / c2Props.length;

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

  c2Props.forEach(({ stand, hand, reach }, i) => {
    const [sx, sz] = stand;
    const [hx, hy, hz] = hand;
    const segAt = c2Start + i * c2Window;
    const runDur = 0.85;
    const turnAt = segAt + runDur;
    const turnDur = 0.2;
    const reachAt = turnAt + turnDur;
    const reachDur = 0.25;
    const actionAt = reachAt + reachDur;
    const actionDur = 0.35;
    const backAt = actionAt + actionDur;
    const backDur = 0.22;

    // walk to a spot beside the prop rather than into it
    tl.to(goblin.root.position, { x: sx, z: sz, duration: runDur }, segAt);
    tl.to(camera.position, { x: sx - 3.2, y: 1.6, z: 2.8, duration: c2Window }, segAt);
    tl.to(world.look, { x: hx + 1.2, y: 0.7, z: hz * 0.6, duration: c2Window }, segAt);

    // turn to face what he's about to touch — the rig faces +x at rest, so this is
    // the heading from where he stands to where his hand goes
    tl.to(goblin, { speed: 0, duration: turnDur }, turnAt);
    tl.to(goblin.root.rotation, { y: Math.atan2(-(hz - sz), hx - sx), duration: turnDur }, turnAt);

    // reach height is per-prop: high for the lantern and the branch overhead, low for
    // the fire and the mushrooms at his feet
    tl.to(goblin.armR.pose.rotation, { x: reach, duration: reachDur }, reachAt);
    tl.to(goblin.head.rotation, { x: (hy - 0.76) * 0.35, duration: reachDur }, reachAt);

    // the prop moves only once his hand has arrived
    c2PropAction(i, actionAt, actionDur);

    tl.to(goblin.armR.pose.rotation, { x: 0, duration: backDur }, backAt);
    tl.to(goblin.head.rotation, { x: 0, duration: backDur }, backAt);
    tl.to(goblin.root.rotation, { y: 0, duration: backDur }, backAt);
    tl.to(goblin, { speed: 1, duration: backDur }, backAt);
  });

  // The run used to play out in silence — 23 seconds between "Straight to work." and
  // "Natural 1.", across the whole of his hidden work. These carry his voice through it.
  cap('work1', 17.8, 1.9); // over the campfire
  cap('work2', 21.0, 2.0); // over the cave door
  cap('work3', 23.3, 1.9); // over the chest
  cap('work4', 28.3, 1.6); // over the signpost

  // the last prop leaves him off the path; put him back on it before the dash
  tl.to(goblin.root.position, { z: 0, duration: 0.3 }, c2End - 0.3);

  // ---- t30: the snap — time resumes and the world he prepared comes alive --
  tl.to(world, { timeScale: 1, duration: 0.12 }, 30);

  // ---- t30-31.5: dash to the rope, camera settles wide -------------------
  tl.to(goblin.root.position, { x: 38.5, duration: 1.5 }, 30);
  cam(30, 1.5, [31.5, 4.5, 6], [42, 1.0, -2]);

  // ---- t31.5-35: rope pull swings the theatre disc ------------------------
  tl.to(goblin, { speed: 0, duration: 0.2 }, 31.5);
  tl.to(goblin.armL.pose.rotation, { x: -2.4, duration: 0.4 }, 31.5);
  tl.to(goblin.armR.pose.rotation, { x: -2.4, duration: 0.4 }, 31.5);
  tl.to(goblin.root.rotation, { z: 0.15, duration: 0.4 }, 31.5);

  cap('work5', 32.6, 2.0); // over the theatre-set rotation

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
  tl.to(goblin.root.rotation, { y: -0.94, duration: 0.35 }, 34.9);
  tl.to(goblin.armR.pose.rotation, { z: -2.6, duration: 0.2 }, 35);
  tl.to(goblin.armR.pose.rotation, { z: '+=0.3', duration: 0.15, yoyo: true, repeat: 3 }, 35.2);
  tl.to(goblin.armR.pose.rotation, { z: 0, duration: 0.2 }, 35.8);
  tl.to(goblin.root.rotation, { y: Math.PI / 2, duration: 0.3 }, 36);

  // ---- t36-38: off to the tavern -------------------------------------------
  // He used to run 16 units toward the tavern with the camera high and wide, which
  // put a mostly-empty ground plane on screen and showed the tavern sitting tiny on
  // the horizon — so the hard cut at t38 arrived somewhere the audience had already
  // seen. Shorter run, camera low and trailing: the horizon rides high out of frame
  // and the cut lands on somewhere new.
  tl.to(goblin, { speed: 1, duration: 0.3 }, 36);
  tl.to(goblin.root.position, { x: 46.5, duration: 2 }, 36);
  cam(36, 2, [43.2, 0.95, 2.1], [46.2, 0.6, 0.45]);

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

  // The die is built with its 1-face up at rotation zero, so the tumble has to land
  // exactly there rather than spinning to an arbitrary rest — the camera is about to
  // come close enough to read the number.
  tl.set(world.dieInner.rotation, { x: -9, y: -5.5, z: 0 }, dieAt);
  tl.to(world.dieInner.rotation, { x: 0, y: 0, z: 0, duration: 2, ease: 'power3.out' }, dieAt);

  // ---- t38.3-39.8: the camera comes in WHILE the die is still rolling -----------
  // We should watch it land, not arrive after the fact. The move settles before the die
  // does, so the 1 comes up already in the close view. About 37 degrees above the
  // table: steep enough to read the top face, shallow enough that the die still hides
  // the patch of table right behind it, which is where the finger comes from.
  cam(38.3, 1.5, [80.42, 2.42, 1.5], [80, 1.28, 0], 'power2.inOut');

  cap('nat1', 40.2, 1.4);

  // ---- t40.6: tick, FREEZE -----------------------------------------------------
  // The goblin is never seen at this table. He is nine tenths of a unit tall and the
  // die sits at 1.21 on the tabletop, so putting him in shot only ever showed him
  // stranded underneath it. The scene plays entirely on the die.
  tl.to(world, { timeScale: 0, duration: 0.15 }, 40.6);
  tl.set(goblin.root.position, { x: 84.5, y: 0, z: 1.5 }, 40.6);

  // Caught mid-motion the die rocks, then holds. It is a held breath, not a loop — run
  // across the whole freeze it stops reading as stopped time and just looks like a die
  // that never settles.
  tl.set(world, { dieWobble: 1 }, 40.6);
  tl.to(world, { dieWobble: 0, duration: 1.2, ease: 'power2.out' }, 40.85);

  // ---- t42.4-43.6: a finger rises from directly behind the die ------------------
  // Not a hand crossing the table. It starts low in the die's own blind spot, where the
  // die hides it completely from this angle, and rises into view over the back edge —
  // so it appears from nowhere rather than travelling in from somewhere.
  tl.set(world.nudgeFinger.scale, { x: 1, y: 1, z: 1 }, 42.4);
  tl.fromTo(
    world.nudgeFinger.position,
    { y: 1.02, z: -0.56 },
    { y: 1.44, z: -0.35, duration: 1.2, ease: 'power2.out' },
    42.4,
  );

  // ---- t43.7-44.4: one tilt, and the 1 rolls over into the 20 -------------------
  // Not another spin: the die goes over exactly one face, about the edge the geometry
  // was built to roll on. That is the whole cheat — the smallest possible nudge.
  tl.to(world.nudgeFinger.position, { z: -0.3, duration: 0.45, ease: 'power2.inOut' }, 43.7);
  tl.to(
    world.dieInner.rotation,
    { x: world.dieTipAngle, duration: 0.5, ease: 'power2.inOut' },
    43.75,
  );

  // ---- t44.5-45.4: and it drops back out of sight the way it came ---------------
  tl.to(world.nudgeFinger.position, { y: 1.0, z: -0.58, duration: 0.9, ease: 'power2.in' }, 44.5);
  tl.set(world.nudgeFinger.scale, { x: 0, y: 0, z: 0 }, 45.4);

  cap('nat20', 46.8, 1.3);
  tl.to(world, { timeScale: 1, duration: 0.3 }, 47);

  // ---- t46.5-49: ease back out before the montage cuts --------------------------
  // Cutting to the montage straight off a macro shot is a jolt. This hands the scene
  // over from a normal-scale view of the table instead.
  cam(46.5, 2.5, [80.9, 2.55, 3.2], [80, 1.15, 0], 'power2.inOut');

  cap('welcome', 48.4, 1.6);

  // ---- t50-57.5: C5 montage — six hard-cut vignettes ------------------------------
  const c5Xs = [0, 8, 16, 24, 32, 40];
  c5Xs.forEach((x, i) => {
    const at = 50 + i * 1.25;
    const dur = 0.5;

    // Tight on one platform, and looking DOWN on it. Six units back put the neighbouring
    // vignettes in frame and showed the montage for what it is — discs floating in a
    // void. Below prop height it was worse: the map table showed only its underside, so
    // the road being drawn on top, which is the entire point of the shot, was invisible.
    cut(at, [x - 2.5, 2.4, -36.9], [x - 0.1, 1.0, -39.7]);

    // and each cut drifts a little closer. Six locked-off frames in a row read as a
    // slideshow; the drift is what makes it a montage.
    cam(at + 0.04, 1.15, [x - 2.05, 2.2, -37.6], [x - 0.1, 0.95, -39.8], 'power1.out');

    // He arrives on the beat instead of being posted there mid-pose. Gait running, a
    // short step in to the job, then the hand comes down — and only then does the prop
    // move. Standing still while the work does itself was the whole problem.
    tl.set(goblin.root.position, { x: x - 1.35, y: 0, z: -38.6 }, at);
    tl.set(goblin.root.rotation, { y: 2.36, z: 0 }, at);
    tl.set(goblin.armR.pose.rotation, { x: -2.15 }, at);
    tl.set(goblin, { speed: 1 }, at);
    tl.to(goblin.root.position, { x: x - 0.8, z: -39.1, duration: 0.5 }, at);
    tl.to(goblin, { speed: 0, duration: 0.12 }, at + 0.5);
    tl.to(goblin.armR.pose.rotation, { x: -1.1, duration: 0.32 }, at + 0.5);

    // the job lands as the hand does
    const actAt = at + 0.72;

    switch (i) {
      case 0: // map table — road being drawn
        tl.to(world.roadLine.scale, { x: 1, duration: dur }, actAt);
        break;
      case 1: // monster rears up
        tl.to(world.monster.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, actAt);
        break;
      case 2: // sign drops onto its bracket
        tl.to(world.tavernSign.position, { y: '-=1.2', duration: dur, ease: 'bounce.out' }, actAt);
        break;
      case 3: // trees planted
        world.trees5.forEach((tree, ti) => {
          tl.to(tree.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, actAt + ti * 0.12);
        });
        break;
      case 4: // chest opened
        tl.to(world.chest5Lid.rotation, { x: -1.3, duration: dur }, actAt);
        tl.to(world.chest5Coins.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, actAt);
        break;
      case 5: // candles lit
        tl.to(world.candleRays.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, actAt);
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

  // pulled earlier and shortened from (64.7, 1.2): every caption is centred in the same
  // spot, so any overlap with the endcard at 65.5 stacked two lines of type on the
  // film's last image. This now clears the screen exactly as the wordmark begins.
  cap('nat20', 64.4, 0.7);

  // ---- t65.5-66: endcard, stays up -----------------------------------------------------
  if (caps.endcard) {
    tl.to(caps.endcard, { opacity: 1, duration: 0.5 }, 65.5);
  }

  return tl;
}
