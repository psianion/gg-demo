import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import type { World } from './world';
import { curtain, reveal } from './curtain';
import * as P from './palette';
import {
  armRest,
  bolt as nimbleEscape,
  cameraSideArm,
  crouchChest,
  crouch,
  dustOff,
  express,
  haul,
  lift,
  look,
  plantFor,
  reach,
  settle,
  stanceOf,
  stoop,
  straighten,
  tap,
  wave,
  weightShift,
} from './actions';

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
  scene: THREE.Scene,
  // Element, not HTMLElement — the scroll rail is a pair of SVG <path> nodes, and
  // GSAP tweens those the same way as any DOM node.
  caps: Record<string, Element>,
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
  // `fade` is opt-in: the rapid-fire S5 punchlines need four windows inside 3.7s, and at
  // the standard 0.4 the fades alone eat the whole budget and force the lines to overlap.
  const cap = (id: string, at: number, hold: number, fade = 0.4) => {
    const el = caps[id];
    if (!el) return;
    tl.to(el, { opacity: 1, duration: fade }, at);
    tl.to(el, { opacity: 0, duration: fade }, at + hold);
  };

  // camera position + look target tweened together
  const cam = (at: number, dur: number, pos: Vec3, look: Vec3, ease = 'power2.inOut') => {
    tl.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], duration: dur, ease }, at);
    tl.to(world.look, { x: look[0], y: look[1], z: look[2], duration: dur, ease }, at);
  };

  // The curtain rides the freeze. It takes the same cue as the world clock and a softer
  // ease over a longer beat, because that is the grammar: the silence hits, and then the
  // colour drains out of the frame behind it. Every call below sits next to a
  // `world.timeScale` tween — the curtain never gets a beat of its own.
  const drain = (at: number, to: number, dur: number) =>
    tl.to(curtain, { value: to, duration: dur, ease: 'power2.inOut' }, at);

  // Going in is a drain; coming out is a snap. The release used to be a ~1s dissolve,
  // which read as a cross-fade between two grades rather than as time restarting.
  const snapBack = (at: number) =>
    tl.to(curtain, { value: 0, duration: 0.12, ease: 'power4.out' }, at);

  // hard cut — no interpolation
  const cut = (at: number, pos: Vec3, look: Vec3) => {
    tl.set(camera.position, { x: pos[0], y: pos[1], z: pos[2] }, at);
    tl.set(world.look, { x: look[0], y: look[1], z: look[2] }, at);
  };

  // The chapter sky ramp — one fog colour per chapter, tweened at the boundary. Painted
  // geometry carries this via scene.fog on its way through the curtain pass; the CSS
  // grain layer picks the same colour up every frame in Film.tsx, gated by curtain.value
  // so a freeze always reads as parchment regardless of which chapter it froze in.
  // scene.background stays null by design (see Film.tsx) — the canvas stays transparent
  // so the grain shows through, so fog is the only surface this film actually needs to move.
  const skyColor = new THREE.Color();
  const sky = (at: number, dur: number, hex: number) => {
    skyColor.set(hex);
    tl.to((scene.fog as THREE.FogExp2).color, { r: skyColor.r, g: skyColor.g, b: skyColor.b, duration: dur }, at);
  };
  const skyCut = (at: number, hex: number) => {
    skyColor.set(hex);
    tl.set((scene.fog as THREE.FogExp2).color, { r: skyColor.r, g: skyColor.g, b: skyColor.b }, at);
  };

  const goblin = world.goblin;

  // ---- one chapter's set at a time ------------------------------------
  // Every set was in the scene for all 66 seconds: the tavern floated beside the theatre
  // disc, the six montage platforms strung along the horizon of every exterior, and the
  // C7 board sat as a stroke at frame-right of the whole film. The fix is visibility, and
  // it belongs on the timeline rather than in a ScrollTrigger callback — `tl.set` is a
  // tween, so it un-sets itself when the visitor scrubs back up the page, which a
  // callback fired on a boundary crossing does not.
  //
  // Each window opens outside the chapter's own composed shots, on a cut or on a frame
  // the set is already out of. The theatre opens at 16.5 rather than at the reviewed 28:
  // at 28 the C2 camera is at x≈22 looking straight down the path at it, so the disc
  // would pop in mid-shot, while at 16.5 the lens is still square on the goblin's face
  // pointing -z and x=44 is 83 degrees off axis — outside a 68-degree frame by a mile.
  const onlyFor = (obj: THREE.Object3D, from: number, to?: number) => {
    // `from > 0` matters: two sets at the same position replay in reverse order on a
    // backward scrub, so a set that opens at 0 must not also be closed at 0 — the film's
    // first frame came back with the camp missing.
    if (from > 0) {
      obj.visible = false; // the first paint happens before the timeline has rendered
      tl.set(obj, { visible: false }, 0);
    }
    tl.set(obj, { visible: true }, from);
    if (to !== undefined) tl.set(obj, { visible: false }, to);
  };

  onlyFor(world.camp, 0, 18); // the run has its back to the camp by 18
  onlyFor(world.theatreSet, 16.5, 38); // out on C4's hard cut
  // 49.9, not 48.5: the tavern is still the shot until the montage cuts at 50 — the
  // camera is easing back off the table right up to 49
  // Opens ON the cut, not half a second before it. At 37.5 the set stood on the horizon
  // of the t36-38 run — the shot whose whole job is to land the cut somewhere the
  // audience has not been — and once the room grew walls tall enough for portrait
  // (world.ts buildTavern) that horizon dressing became a plank tower in the corner of
  // the frame. A hard cut is the one moment a set can appear for free.
  onlyFor(world.tavernSet, 38, 49.9);
  onlyFor(world.montageSet, 49.5, 57.7); // out just after C6's hard cut at 57.5
  // Cliff is also the set for the restaged open (S1-S5 below): visible from the start,
  // hidden through the C2-C5 run, back for good just before C6's hard cut.
  tl.set(world.cliffSet, { visible: true }, 0);
  tl.set(world.cliffSet, { visible: false }, 16.5);
  tl.set(world.cliffSet, { visible: true }, 57.0);
  onlyFor(world.board, 62);
  onlyFor(world.die2, 62);

  // ---- t0-4: blackout up, cold open ----------------------------------
  cap('open1', 0.5, 2.5);
  tl.to('#hint', { opacity: 0, duration: 0.3 }, 0.6);

  // ---- t0: cold-open staging, teleported before the first paint -------------------
  // The fight is already lost by the time the blackout lifts: three adventurers shoot up
  // at him from open ground west of the cliff, and he's already on the near rim
  // (local -2.6, 6). Positioned at 0, same discipline the old crouch-behind-rock setup
  // used, so a scrub into the blackout still finds him already staged.
  //
  // Near rim, not the far one (local 2.6, where C6 puts him back): the plateau top is
  // flat, so from any camera below y=6 its own top face buries a figure standing on the
  // far edge — the wide had him fully occluded. He crosses to the far side on the leap.
  // The party stands back at x~106 rather than against the base: it keeps them big
  // enough to anchor the bottom of the frame from a camera that is far enough out to
  // hold the whole cliff with sky over the rim.
  tl.set(world.party[0].position, { x: 108.0, y: 0, z: -1.3 }, 0);
  tl.set(world.party[1].position, { x: 109.4, y: 0, z: 2.7 }, 0);
  tl.set(world.party[2].position, { x: 106.9, y: 0, z: 1.1 }, 0);
  tl.set(world.party[0].rotation, { y: Math.PI / 2 }, 0); // backs to camera, facing the cliff
  tl.set(world.party[1].rotation, { y: Math.PI / 2 - 0.3 }, 0);
  tl.set(world.party[2].rotation, { y: Math.PI / 2 + 0.25 }, 0);
  tl.set(goblin.root.position, { x: 117.4, y: 6, z: 0 }, 0);
  tl.set(goblin.root.rotation, { y: -Math.PI / 2 }, 0); // facing the party, below and west
  settle(tl, goblin, 0, 0.01);
  express(tl, goblin, 0, 0.01, 'neutral');

  // ---- t4-7.5: S2 — wide, low, behind the party, looking up the cliff --------------
  tl.to('#blackout', { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 4);
  cam(4, 1.5, [102, 1.6, 2.2], [117.4, 3.8, 0.2]);

  // Wizard's bolt, twice, and two thrown arrows — rest position (by the party) arcing
  // to an impact near the rim. ponytail: position only, no aim rotation on the streak
  // itself — a moving gold mark against grey reads as "cast" without solving it to a
  // velocity vector.
  const boltThrow = (at: number, mid: Vec3, land: Vec3, impact: THREE.Group) => {
    tl.set(world.bolt.position, { x: -11.6, y: 1.2, z: 1.6 }, at); // back to rest, at the wizard
    tl.set(world.bolt, { visible: true }, at);
    tl.to(world.bolt.position, { x: mid[0], y: mid[1], z: mid[2], duration: 0.3, ease: 'power2.out' }, at);
    tl.to(world.bolt.position, { x: land[0], y: land[1], z: land[2], duration: 0.3, ease: 'power2.in' }, at + 0.3);
    tl.set(world.bolt, { visible: false }, at + 0.55);
    tl.to(impact.scale, { x: 1, y: 1, z: 1, duration: 0.15, ease: 'back.out(2)' }, at + 0.6);
    tl.to(impact.scale, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'power2.in' }, at + 0.8);
  };
  const arrowThrow = (at: number, arrow: THREE.Group, land: Vec3) => {
    tl.set(arrow, { visible: true }, at);
    tl.to(arrow.position, { x: land[0], y: land[1], z: land[2], duration: 0.28, ease: 'power1.in' }, at);
    tl.set(arrow, { visible: false }, at + 0.3);
  };

  boltThrow(5.0, [-7.6, 4.3, 0.8], [-2.6, 6.05, -1.1], world.impacts[0]);
  arrowThrow(5.9, world.arrows2[0], [-2.4, 6.5, -0.9]);
  boltThrow(6.3, [-7.2, 4.5, 0.2], [-3.0, 6.02, 0.7], world.impacts[1]);
  arrowThrow(6.6, world.arrows2[1], [-2.7, 6.45, 0.6]);

  // He flinches on each strike — a duck, not a stagger, since his feet don't move
  // until the leap.
  const flinch = (at: number) => {
    crouch(tl, goblin, at, 0.2, 0.3, 'power2.out');
    look(tl, goblin, at, 0.2, 0, -0.55);
    express(tl, goblin, at, 0.2, 'alarm');
    crouch(tl, goblin, at + 0.3, 0.3, 0.05, 'power2.inOut');
    look(tl, goblin, at + 0.3, 0.3, 0, 0);
  };
  flinch(5.55);
  flinch(6.85);

  // ---- t7.5-9.5: S3 — cliff-top medium, glance down, one more hit, then he jumps ---
  // Off the near lip and a little above it, so the shot holds him, the drop under him and
  // the far edge he is about to run for, all at once.
  cut(7.5, [114.4, 7.2, 3.0], [117.6, 6.4, 0]);
  look(tl, goblin, 7.6, 0.4, 0, -0.5);
  express(tl, goblin, 7.6, 0.3, 'strain');
  cap('open2', 8, 1.6);

  tl.to(world.impacts[2].scale, { x: 1, y: 1, z: 1, duration: 0.15, ease: 'back.out(2)' }, 8.1);
  tl.to(world.impacts[2].scale, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'power2.in' }, 8.3);
  crouch(tl, goblin, 8.1, 0.15, 0.25, 'power2.out');
  express(tl, goblin, 8.1, 0.2, 'alarm');

  // He turns from the party, bolts across the top and leaps the far side — hand-authored,
  // no jump primitive exists: a run then rise then fall in three position tweens, the same
  // segmented-arc grammar the die2 throw uses at t62.5. `nimbleEscape` is the existing
  // sprint unload, so the legs cycle instead of the root sliding.
  tl.to(goblin.root.rotation, { y: Math.PI / 2, duration: 0.4, ease: 'power2.inOut' }, 8.3);
  nimbleEscape(tl, goblin, 8.35, 0.5);
  express(tl, goblin, 8.4, 0.3, 'neutral');
  tl.to(goblin.root.position, { x: 121.8, y: 6, z: -0.25, duration: 0.5, ease: 'power2.out' }, 8.4);
  tl.to(goblin.root.position, { x: 124.0, y: 6.5, z: -0.35, duration: 0.25, ease: 'power2.out' }, 8.9);
  tl.to(goblin.root.position, { x: 126.5, y: 2.0, z: -0.6, duration: 0.35, ease: 'power2.in' }, 9.15);
  tl.to(goblin.chest.rotation, { x: -0.3, z: 0.15, duration: 0.25, ease: 'power2.out' }, 8.9);
  tl.to(goblin.chest.rotation, { x: 0.35, z: -0.1, duration: 0.35, ease: 'power2.in' }, 9.15);
  tl.to(goblin.pelvis.rotation, { z: 0.12, duration: 0.25 }, 8.9);
  tl.to(goblin.pelvis.rotation, { z: -0.1, duration: 0.35 }, 9.15);
  tl.to(goblin.earL.rotation, { z: '+=0.3', duration: 0.45, ease: 'power2.out' }, 8.95);
  tl.to(goblin.earR.rotation, { z: '-=0.3', duration: 0.45, ease: 'power2.out' }, 8.95);

  // ---- t9.5-10.2: S4 — hard cut hides the landing; he's already crumpled -----------
  cut(9.5, [130, 1.3, 2.6], [126.5, 0.5, -0.5]);
  tl.set(goblin.root.position, { x: 126.5, y: 0, z: -0.5 }, 9.5);
  tl.set(goblin.root.rotation, { y: Math.PI / 2 }, 9.5);
  crouch(tl, goblin, 9.5, 0.01, 0.92);
  look(tl, goblin, 9.5, 0.01, 0, -0.35);
  express(tl, goblin, 9.5, 0.15, 'strain');
  tl.set(world.impacts[0].position, { x: 6.5, y: 0.15, z: -0.5 }, 9.5); // reused as a dust puff
  tl.to(world.impacts[0].scale, { x: 0.5, y: 0.35, z: 0.5, duration: 0.12, ease: 'power2.out' }, 9.55);
  tl.to(world.impacts[0].scale, { x: 0, y: 0, z: 0, duration: 0.25, ease: 'power2.in' }, 9.63);

  // ---- t10.2-16.5: S5 — up, dusted off, and he tells us about it -------------------
  weightShift(tl, goblin, 10.2, 0.4, 1, 0.6);
  crouch(tl, goblin, 10.2, 0.5, 0.35, 'power2.out');
  settle(tl, goblin, 10.6, 0.5);
  express(tl, goblin, 10.6, 0.3, 'strain');
  look(tl, goblin, 10.6, 0.4, 0, 0);

  dustOff(tl, goblin, 11.2, 0.9); // half a second off the get-up, spent on the lines below

  // He faces camera and the world stops with him — the same freeze/push-in grammar as
  // before (drain + timeScale 0), relocated to the cliff base. The push-in lands on a
  // genuine close-up: this is the film's only one, and the beat is his face, so it ends
  // barely a unit off him — face across a third of frame height, eyes on the upper third,
  // ear tips out the top — rather than on the mid shot it used to settle into.
  look(tl, goblin, 12.1, 0.4, -1.62);
  tl.to(world, { timeScale: 0, duration: 0.2 }, 12.5);
  drain(12.5, 1, 0.6);
  tl.to(goblin, { speed: 0, duration: 0.2 }, 12.5);
  tl.to(goblin.chest.rotation, { x: 0.1, duration: 0.6 }, 12.5);
  armRest(tl, goblin, 12.5, 0.6, -1, 0.1);
  armRest(tl, goblin, 12.5, 0.6, 1, 0.1);
  weightShift(tl, goblin, 12.6, 0.5, 1);
  cam(12.5, 1.2, [126.5, 0.62, 0.72], [126.5, 0.58, -0.5], 'power2.inOut');

  // Four lines, four expressions. Each caption's window is at + hold + fade, so the four
  // are spaced 0.12s apart edge to edge: two of them on screen together is four words of
  // one line printed over four of the next, which is how the beat was reading.
  express(tl, goblin, 12.4, 0.35, 'sly'); // "That was me."
  cap('me1', 12.6, 0.55, 0.25);
  express(tl, goblin, 13.35, 0.35, 'smug'); // "You thought I ran away."
  weightShift(tl, goblin, 13.35, 0.5, -1);
  cap('me2', 13.52, 0.55, 0.25);
  express(tl, goblin, 14.3, 0.3, 'flat'); // "I did." — the deadpan
  cap('me3', 14.44, 0.5, 0.25);
  express(tl, goblin, 15.15, 0.35, 'sly'); // "Straight to work."
  weightShift(tl, goblin, 15.15, 0.5, 1);
  cap('me4', 15.32, 0.7, 0.25);

  // ---- t16.5: hard-cut handoff into the unchanged C2 run ---------------------------
  // The freeze is a non-diegetic aside — geometry doesn't have to hold across it. This
  // reproduces exactly the state the untouched block below (and the C2 run after it)
  // expects: same camera, same goblin root position/rotation, still frozen, still
  // drained — everything from here down is byte-for-byte what the film already did.
  cut(16.5, [2.5, 1.1, 3.2], [2.5, 0.7, 0.9]);
  tl.set(goblin.root.position, { x: 2.5, y: 0, z: 0 }, 16.5);
  tl.set(goblin.root.rotation, { y: Math.PI / 2 }, 16.5);

  // ---- t16.5-17: head back, but the world stays frozen --------------------
  // The lighting run is the goblin's hidden work, and the art direction is explicit
  // that this happens behind the curtain: the world holds still while he works and
  // snaps back only when he's finished (t30). A fire he lights mid-freeze sits there
  // lit and perfectly motionless until time resumes — that stillness is the point.
  look(tl, goblin, 16.5, 0.5, 0);
  settle(tl, goblin, 16.5, 0.5);
  express(tl, goblin, 16.5, 0.4, 'neutral');
  weightShift(tl, goblin, 16.5, 0.5, 1, 0);
  tl.to(goblin, { speed: 1, duration: 0.5 }, 16.5);

  // ---- t17-30: C2 run — 7 props, one per piecewise segment ---------------
  const c2Start = 17;
  const c2End = 30;

  // Where he stands, and what he actually puts a hand on. He used to stop on the path
  // at the prop's own x and reach straight ahead, which left him grasping at air for
  // the cave door (2 units off the path), the mushrooms (1.2 off) and the branch
  // (1.6 up, and he is 0.9 tall) — so the props appeared to move by themselves.
  // Only the hand point is authored now. Where he STANDS is solved backwards from it: his
  // arm is 0.295 long on a 0.9-unit body, so a prop is either within a third of his own
  // height or it is not touchable at all. The old hand-placed stand points sat 0.86 out —
  // nearly three times his reach — which is the real reason the review kept seeing props
  // move by themselves. Moving him closer treated the symptom; deriving the distance from
  // the arm fixes the cause, and it survives the art pass moving any of these props.
  const c2Props: Vec3[] = [
    [6, 0.35, 0], // down to the fire
    [10, 1.1, 0], // up to the lantern
    [13.4, 0.85, -2], // off-path to the cave door
    [18, 0.4, 0], // lift the chest lid
    [22, 1.62, 0], // shoo the branch — over his head, so it stays a stretch
    [26, 0.14, -1.2], // down to the mushrooms
    [30, 1.0, 0], // straighten the sign
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

  c2Props.forEach((hand, i) => {
    const [hx, hy, hz] = hand;

    // He comes along the path from -x, so the heading runs from there to the prop. The
    // rig faces +z at rest, which makes a heading atan2(x, z) — the convention the
    // montage already uses. This loop used to compute atan2(-z, x), a heading for a model
    // facing +x, so every one of the seven prop turns was exactly 90 degrees off: he
    // stood with his shoulder to the prop and reached into the air beside it.
    const r = Math.hypot(1.3, hz);
    const heading = Math.atan2(1.3 / r, hz / r);
    const fwd: [number, number] = [Math.sin(heading), Math.cos(heading)];

    // He works with the arm on the camera side. The lens follows three-quarter-back and
    // he now genuinely faces each prop, so a reach with the far arm goes straight away
    // from us and vanishes behind his own silhouette: correct pose, invisible on screen.
    // The camera rides 3.2 back in x and 2.8 out in z, so which shoulder that is depends
    // on the heading, and the off-path props do not answer the same as the ones ahead.
    const guessStand: [number, number] = [hx - fwd[0] * 0.25, hz - fwd[1] * 0.25];
    const reachSide = cameraSideArm(heading, guessStand, [guessStand[0] - 3.2, 2.8]);
    const plant = plantFor(hy, reachSide);

    const side: [number, number] = [Math.cos(heading), -Math.sin(heading)];
    const sx = hx - fwd[0] * plant.standoff - side[0] * plant.lateral;
    const sz = hz - fwd[1] * plant.standoff - side[1] * plant.lateral;

    const segAt = c2Start + i * c2Window;
    const runDur = 0.85;
    const turnAt = segAt + runDur;
    const turnDur = 0.2;
    const reachAt = turnAt + turnDur;
    const reachDur = 0.3;
    const actionAt = reachAt + reachDur;
    const actionDur = 0.35;
    const backAt = actionAt + actionDur;
    const backDur = 0.22;

    // walk to the spot the solve says he can actually work from
    tl.to(goblin.root.position, { x: sx, z: sz, duration: runDur }, segAt);
    tl.to(camera.position, { x: sx - 3.2, y: 1.6, z: 2.8, duration: c2Window }, segAt);
    tl.to(world.look, { x: hx + 1.2, y: 0.7, z: hz * 0.6, duration: c2Window }, segAt);

    // turn to face what he is about to touch
    tl.to(goblin, { speed: 0, duration: turnDur }, turnAt);
    tl.to(goblin.root.rotation, { y: heading, duration: turnDur }, turnAt);

    // He folds as far as the prop's height demands, and the hand is solved into that
    // folded frame: a real stoop over the fire and the mushrooms, a stretch at the branch
    // he cannot reach. The pose IS the reach — there is no separate reach angle left to
    // tune, and moving a prop in the art pass re-solves it for free.
    crouch(tl, goblin, reachAt, reachDur, plant.crouch);
    reach(
      tl,
      goblin,
      reachAt,
      reachDur,
      reachSide,
      [plant.lateral, hy, plant.standoff],
      stanceOf(plant.crouch),
    );
    look(tl, goblin, reachAt, reachDur, 0, (hy - 0.76) * 0.9);
    express(tl, goblin, reachAt, 0.25, hy > 1.2 ? 'strain' : 'neutral');

    // the prop moves only once his hand has arrived
    c2PropAction(i, actionAt, actionDur);

    // The re-ignition arc (color-script.md §5): each prop was already painted at build
    // time, so what "ignites" here is only the curtain's reveal mask, timed to the same
    // actionAt every prop tween above already uses — no new beat, just a soft pool of
    // colour opening alongside the existing animation.
    switch (i) {
      case 0: // ignition — the fire and the ray burst it throws
        tl.add(reveal([world.fire2Flames, world.fire2Rays], { duration: actionDur, radius: 0.55 }), actionAt);
        break;
      case 1: // repetition, contained — brass fittings and glass, not just the light
        tl.add(reveal([world.lanternPost, world.lanternRays], { duration: 0.6, radius: 0.55 }), actionAt);
        break;
      case 2: // first cool — the door, and the stone-cool cluster it opens onto
        tl.add(reveal([world.caveDoor, world.cave], { duration: actionDur }), actionAt);
        break;
      case 3: // peak — the chest, coins last, at the midpoint of the run
        tl.add(reveal(world.chest, { duration: actionDur }), actionAt);
        break;
      case 4:
        // The reveal leaves the props. The birds stay raven-slate; what takes colour is
        // the sky and the ground, and neither is geometry a mask can hold — a fog colour
        // is not a solid, and the ground plane is 270 units of it. So this beat eases the
        // curtain itself instead: from here on the world is visibly coming back, and it
        // arrives the rest of the way on the snap at t30. The old version put a
        // six-unit sphere in the mask, which is where the review's "huge airbrushed
        // colour disc bleeding across ground and rocks" came from.
        // 0.6 was tuned on the pale grade, where 60% graphite was barely distinguishable
        // from full colour. On the committed palette that hold read as four beats of
        // washed-out frame with amber reveal-windows glowing through it — 0.25 keeps
        // "the world is coming back" legible while a held frame still reads as painted.
        drain(25.4, 0.25, 1.4);
        sky(actionAt, 1.0, P.skyDay); // C1 -> C2, arriving with this beat, not before it
        break;
      case 5: // the breath — small, low, all three of them
        tl.add(reveal(world.mushrooms, { duration: actionDur }), actionAt);
        break;
      case 6: // completion — no new family
        tl.add(reveal([world.signPost, world.signBoard], { duration: actionDur }), actionAt);
        // "...and the last graphite falls off the frame" (§5 #7): the verge grass and the
        // far treeline are the only things left in the chapter he never puts a hand on, so
        // they come back on their own, a beat ahead of the sign, rather than waiting for
        // the snap to hand them the whole world at once.
        tl.add(reveal(world.tufts, { duration: 0.9, radius: 0.12 }), 29.1);
        tl.add(reveal(world.treeline, { duration: 0.9 }), 29.1);
        break;
    }

    armRest(tl, goblin, backAt, backDur, reachSide, crouchChest(0.05));
    crouch(tl, goblin, backAt, backDur, 0.05);
    look(tl, goblin, backAt, backDur, 0);
    express(tl, goblin, backAt, backDur, 'neutral');
    // and back to facing +x for the next leg of the run
    tl.to(goblin.root.rotation, { y: Math.PI / 2, duration: backDur }, backAt);
    tl.to(goblin, { speed: 1, duration: backDur }, backAt);
  });

  // The run used to play out in silence — 23 seconds between "Straight to work." and
  // "Natural 1.", across the whole of his hidden work. One line carries his voice
  // through it: mid-run, clear of the campfire/lantern beats on either side, held
  // long enough to read against the running gait.
  cap('light1', 19, 4); // over the lantern / cave-door stretch of the run

  // the last prop leaves him off the path; put him back on it before the dash
  tl.to(goblin.root.position, { z: 0, duration: 0.3 }, c2End - 0.3);

  // ---- t30: the snap — time resumes and the world he prepared comes alive --
  tl.to(world, { timeScale: 1, duration: 0.12 }, 30);
  // the ravens already eased it to 0.6 at 25.4 — this is the last 0.6, in a twelfth of
  // a second, on the same frame the world clock restarts
  snapBack(30);

  // ---- t30-31.5: dash to the rope, camera settles wide -------------------
  tl.to(goblin.root.position, { x: 38.5, duration: 1.5 }, 30);
  cam(30, 1.5, [31.5, 4.5, 6], [42, 1.0, -2]);
  sky(31.5, 1.5, P.skyOvercast); // C2 -> C3, as the theatre disc comes into view

  // ---- t31.5-35: rope pull swings the theatre disc ------------------------
  // He is not pulling with his arms any more; he hangs his weight off the rope. Rear leg
  // planted and rolled onto its toe, front leg braced, pelvis back, chest counter-rotated,
  // and the rope comes in on two pulls rather than one long drag. Rotating the whole root
  // by 0.15 used to be the entire "lean" — a rigid figure tipped like a bowling pin.
  tl.to(goblin, { speed: 0, duration: 0.2 }, 31.5);
  haul(tl, goblin, 31.5, 3.0);

  cap('set1', 32.6, 2.0); // over the theatre-set rotation

  tl.to(world.stageDisc.rotation, { y: `+=${Math.PI}`, duration: 2.5, ease: 'power2.inOut' }, 32.0);
  tl.to(
    world.rope.position,
    { y: '+=0.15', duration: 0.2, repeat: 12, yoyo: true, ease: 'sine.inOut' },
    32.0,
  );

  settle(tl, goblin, 34.5, 0.5);

  // ---- t35-36: wave to camera ----------------------------------------------
  // The camera is behind him, so he turns from the hips to find it, waves from the wrist
  // rather than swinging the whole arm, and puts his weight on one leg while he does it.
  tl.to(goblin.root.rotation, { y: -0.94, duration: 0.35 }, 34.9);
  wave(tl, goblin, 35, 1.0);
  tl.to(goblin.root.rotation, { y: Math.PI / 2, duration: 0.3 }, 36);
  express(tl, goblin, 36, 0.3, 'neutral');

  // ---- t36-38: off to the tavern -------------------------------------------
  // He used to run 16 units toward the tavern with the camera high and wide, which
  // put a mostly-empty ground plane on screen and showed the tavern sitting tiny on
  // the horizon — so the hard cut at t38 arrived somewhere the audience had already
  // seen. Shorter run, camera low and trailing: the horizon rides high out of frame
  // and the cut lands on somewhere new.
  tl.to(goblin, { speed: 1, duration: 0.3 }, 36);
  tl.to(goblin.root.position, { x: 46.5, duration: 2 }, 36);
  // He was running straight through the theatre's mountain half: from x=38.5 to about
  // x=44 the 4.5-unit peak at (41, -2) is on the sightline and a knee-high goblin is
  // simply inside it, so the first half of this beat played as a head bobbing behind a
  // cone. Three units toward the lens takes him round the near shoulder and back onto
  // the path well before the camera closes on him — his run target and the shot are
  // untouched.
  tl.to(goblin.root.position, { z: 3.2, duration: 0.8, ease: 'sine.out' }, 36);
  tl.to(goblin.root.position, { z: 0, duration: 0.9, ease: 'sine.inOut' }, 36.9);
  // And up onto the stage he just turned. The whole run crosses the 7-unit disc, whose
  // top face is y=0.3 — at y=0 he was buried to the hips, which nobody had seen because
  // nobody had seen him at all. Same correction the C5 platforms already carry. No
  // restore: the C4 hard cut at 38 re-parks him.
  tl.to(goblin.root.position, { y: 0.3, duration: 0.35, ease: 'sine.out' }, 36);
  cam(36, 2, [43.2, 0.95, 2.1], [46.2, 0.6, 0.45]);

  // ---- t38: C4 hard cut ------------------------------------------------------
  cut(38, [80, 2.1, 6.2], [80, 1.0, 0]);
  tl.set(goblin.root.position, { x: 84.5, y: 0, z: 1.5 }, 38);
  tl.set(goblin, { speed: 0 }, 38);
  // The chapter plays on the die and never on him — but parked at 84.5 he clipped the
  // bottom-right corner of the wide shot as a green-and-red sliver, which is worse than
  // either being in it or being out of it. Hidden rather than moved further out: the
  // portrait framing pulls the lens back along its own axis (see framing.ts), so any
  // park position is only ever out of frame at one aspect ratio. `tl.set` reverses on a
  // backward scrub, so he comes back on his own when the visitor scrolls up.
  tl.set(goblin.root, { visible: false }, 38);
  tl.set(goblin.root, { visible: true }, 49.95);
  skyCut(38, P.skyHearth); // C3 -> C4, on the same hard cut

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

  // nat1 / nat20 no longer get captions here — the die is close enough in this shot
  // to read its own faces, and naming the roll on top of showing it was redundant.

  // ---- t40.6: tick, FREEZE -----------------------------------------------------
  // The goblin is never seen at this table. He is nine tenths of a unit tall and the
  // die sits at 1.21 on the tabletop, so putting him in shot only ever showed him
  // stranded underneath it. The scene plays entirely on the die.
  tl.to(world, { timeScale: 0, duration: 0.15 }, 40.6);
  drain(40.6, 1, 0.5);
  tl.set(goblin.root.position, { x: 84.5, y: 0, z: 1.5 }, 40.6);

  // The die sits dead still on the 1 through the freeze — reviewed: any rock after the
  // settle read as the die landing twice, so dieWobble stays 0 here. The only motion it
  // gets from now on is the finger nudge below.

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

  tl.to(world, { timeScale: 1, duration: 0.3 }, 47);
  snapBack(47);

  // ---- t46.5-49: ease back out before the montage cuts --------------------------
  // Cutting to the montage straight off a macro shot is a jolt. This hands the scene
  // over from a normal-scale view of the table instead.
  cam(46.5, 2.5, [80.9, 2.55, 3.2], [80, 1.15, 0], 'power2.inOut');
  sky(47, 2.5, P.skyVellum); // C4 -> C5, resolved well before the t50 hard cut

  // welcome now lands right off the flip: the die is done tipping to 20 by 44.25 and
  // holds through the finger's exit, but time itself doesn't move again until the
  // timeScale tween above starts at 47 and finishes at 47.3 — so 47.3 is the earliest
  // point where both are true (die on 20, world unfrozen). Landing it there instead of
  // the old 48.4 puts the line on the beat it's reacting to instead of after it. Hold
  // trimmed from 1.6 to 1.3 so the fade-out (47.3 + 1.3 + 0.4 = 49.0) still clears
  // before the montage's first hard cut at t50, same as before.
  cap('welcome', 47.3, 1.3);

  // ---- t50-57.5: C5 montage — six hard-cut vignettes ------------------------------
  // One shared camera could not frame six different jobs. The sign drops at y 2.8 while
  // the chest opens at y 0.5; the road is three units wide where the candles are a hand
  // across. So each vignette carries its own shot: what the frame is about (`focus`),
  // where the lens sits, where he works from, and how high his hand ends up.
  //
  // Three constraints shape every entry. `focus` sits between his chest and the job, not
  // on the job — aiming at the prop alone pushed him to the edge of frame or off it. The
  // lens stays under ~3 units out; from four and a half the whole vignette was a speck
  // in the middle of an empty frame, with the platform disc eating the bottom third. And
  // it stays above the work surface: dropping below prop height showed the map table's
  // underside, hiding the road being drawn on top, which is that shot's entire point.
  // A near straight-on angle keeps the neighbouring platforms outside the frustum, so
  // the row never reads as discs floating in a void.
  //
  // The lens also sits just outboard of `stand`, shooting down the line from him to the
  // job rather than across it. A phone's frame is 36 degrees wide against the desktop's
  // 69, and a goblin staged beside his work simply falls out of the side of it — staged
  // in front of it, he holds the middle at both aspects. Sides alternate so six shots
  // down one axis don't all look like the same shot.
  // `job` is the point his hand actually works on, and his stand position is solved back
  // from it the same way the C2 props are. Six cuts of one shared reach pose is one cut
  // shown six times, so each vignette also names a different action: a draughtsman's
  // stoop, a two-handed set-down, a stretch and a tap, three quick plantings, a crouched
  // lift, and one careful touch. They use different parts of the body on purpose.
  const c5Shots: {
    focus: [number, number, number]; // offsets from the vignette centre (x, y, z)
    cam: [number, number, number];
    job: [number, number, number]; // what his hand is on
  }[] = [
    // 0 map table — the road grows out of his hand, so the frame favours the near corner
    { focus: [-0.5, 0.9, 0.25], cam: [-1.5, 2.0, 2.6], job: [-0.5, 0.88, 0.25] },
    // 1 monster — rears to ~1.6, and he works it from the far side for the cut's sake
    { focus: [0.55, 0.98, 0.25], cam: [1.55, 1.78, 2.95], job: [0.55, 0.72, 0.25] },
    // 2 tavern sign — the drop runs 2.15 down onto the bracket at 1.2, above his reach
    { focus: [-0.45, 1.0, 0.15], cam: [-1.5, 1.62, 3.5], job: [-0.45, 1.35, 0.15] },
    // 3 pines — three of them across a unit, planted at the base rather than the tops
    { focus: [0.55, 1.0, 0.2], cam: [1.7, 1.8, 3.05], job: [0.55, 0.16, 0.2] },
    // 4 chest — low and small, so the lens drops to meet it instead of looking down
    { focus: [-0.5, 0.72, 0.25], cam: [-1.4, 1.62, 2.85], job: [-0.5, 0.54, 0.25] },
    // 5 candles — the smallest subject here, and so the tightest shot
    { focus: [0.5, 0.95, 0.3], cam: [1.45, 1.7, 2.75], job: [0.5, 0.93, 0.3] },
  ];

  const c5Xs = [0, 8, 16, 24, 32, 40];
  c5Xs.forEach((x, i) => {
    const at = 50 + i * 1.25;
    const dur = 0.5;
    const shot = c5Shots[i];
    const [fx, fy, fz] = [x + shot.focus[0], shot.focus[1], -40 + shot.focus[2]];
    const [cx, cy, cz] = [x + shot.cam[0], shot.cam[1], -40 + shot.cam[2]];

    // Where his hand goes, and — solved back from it through the same reach maths the
    // path run uses — where he has to stand and how far he has to fold to get it there.
    // The platform's top face is y=0.2, so the job height he works to is measured from it.
    //
    // He stands BESIDE the job rather than on the line between it and the lens: standing
    // on that line puts his back over the very thing the cut exists to show. Working
    // across the frame keeps both him and the job visible and turns the reach into a
    // gesture the audience can read. Sides alternate, as the six framings already do.
    const [jx, jy, jz] = [x + shot.job[0], shot.job[1], -40 + shot.job[2]];
    const camLen = Math.hypot(jx - cx, jz - cz);
    const axis: [number, number] = [(jx - cx) / camLen, (jz - cz) / camLen];
    const out: [number, number] = i % 2 === 0 ? [axis[1], -axis[0]] : [-axis[1], axis[0]];
    const heading = Math.atan2(-out[0], -out[1]); // stood off to the side, facing the job
    const side: [number, number] = [Math.cos(heading), -Math.sin(heading)];

    const plantSide = cameraSideArm(heading, [jx + out[0], jz + out[1]], [cx, cz]);
    // Vignette 0's job point sits over the map table (footprint x[-0.8,0.8] z[-40.5,-39.5]
    // at world (0,0.9,-40)) — the natural reach-solved stand point lands inside that
    // footprint, feet under the slab and legs visible beneath it. A floor on the standoff
    // pushes him out past the near edge (x~-1.05); the arm still clamps to its own max
    // reach in reachSolve, which reads as him leaning in over the edge, not stepping short.
    // Vignette 1's job point sits on the monster's wide haunch (art-bible: "wide
    // seated haunch") — the natural reach-solved standoff lands him against/behind
    // it, the same class of bug as vignette 0's table edge, same fix: floor the
    // standoff so he's clear of the mass before the reach is even solved.
    const plant = plantFor(jy - 0.2, plantSide, i === 0 ? 0.65 : i === 1 ? 0.5 : 0);
    const sx = jx + out[0] * plant.standoff - side[0] * plant.lateral;
    const sz = jz + out[1] * plant.standoff - side[1] * plant.lateral;
    const local: [number, number, number] = [plant.lateral, jy - 0.2, plant.standoff];

    cut(at, [cx, cy, cz], [fx, fy, fz]);

    // and each cut drifts a little closer. Six locked-off frames in a row read as a
    // slideshow; the drift is what makes it a montage.
    // 0.09, not 0.12: the drift is what makes six cuts a montage rather than a slideshow,
    // but at 0.12 it closed enough distance to push his feet out of the bottom of frame
    // on the shot with the least headroom.
    const push = 0.09;
    cam(
      at + 0.04,
      1.15,
      [cx + (fx - cx) * push, cy + (fy - cy) * push, cz + (fz - cz) * push],
      [fx, fy, fz],
      'power1.out',
    );

    // He arrives on the beat instead of being posted there mid-pose. Gait running, a
    // short step in to the job, then the hand comes down — and only then does the prop
    // move. Standing still while the work does itself was the whole problem.
    // y=0.2 is the platform's top face; at y=0 his feet sank into the disc.
    // he walks the last stride in along his own facing, so the arrival is a step, not a cut
    tl.set(
      goblin.root.position,
      { x: sx + out[0] * 0.42, y: 0.2, z: sz + out[1] * 0.42 },
      at,
    );
    tl.set(goblin.root.rotation, { y: heading, z: 0 }, at);
    tl.set(goblin, { speed: 1 }, at);
    tl.to(goblin.root.position, { x: sx, z: sz, duration: 0.5 }, at);
    tl.to(goblin, { speed: 0, duration: 0.12 }, at + 0.5);

    // the job lands as the hand does
    const actAt = at + 0.72;
    const bodyAt = at + 0.42;

    // Six jobs, six different actions. Each one is the reason its vignette is a separate
    // cut rather than the same cut six times.
    switch (i) {
      case 0: // a draughtsman's stoop, and the hand sweeps along the road as it grows
        crouch(tl, goblin, bodyAt, 0.3, plant.crouch);
        reach(tl, goblin, bodyAt, 0.3, plantSide, [local[0] - 0.12, local[1], local[2]], stanceOf(plant.crouch));
        reach(tl, goblin, actAt, dur, plantSide, [local[0] + 0.16, local[1], local[2] + 0.06], stanceOf(plant.crouch), 'none');
        express(tl, goblin, bodyAt, 0.3, 'neutral');
        break;
      case 1: // both hands set it down, then he steps back and lets go
        crouch(tl, goblin, bodyAt, 0.3, plant.crouch);
        reach(tl, goblin, bodyAt, 0.3, -plantSide as -1 | 1, [local[0] - plantSide * 0.16, local[1], local[2]], stanceOf(plant.crouch));
        reach(tl, goblin, bodyAt, 0.3, plantSide, [local[0] + plantSide * 0.02, local[1], local[2]], stanceOf(plant.crouch));
        express(tl, goblin, bodyAt, 0.3, 'strain');
        armRest(tl, goblin, actAt + dur * 0.6, 0.4, -plantSide as -1 | 1);
        armRest(tl, goblin, actAt + dur * 0.6, 0.4, plantSide);
        express(tl, goblin, actAt + dur * 0.6, 0.3, 'smug');
        break;
      case 2: // out of reach overhead: he guides the drop in, then taps it home
        reach(tl, goblin, bodyAt, 0.3, plantSide, local);
        express(tl, goblin, bodyAt, 0.3, 'strain');
        tap(tl, goblin, actAt + dur * 0.5, 0.5, [local[0], local[1] - 0.14, local[2]], plantSide);
        break;
      case 3: // three trees, three quick plantings, one per stagger step
        for (let t = 0; t < 3; t++) {
          stoop(tl, goblin, bodyAt + t * 0.24, 0.24, [local[0] + (t - 1) * 0.14, local[1], local[2]], plantSide);
        }
        break;
      case 4: // a crouched lift: both hands under the lid, straighten as it opens
        lift(tl, goblin, bodyAt, 0.9, local);
        break;
      case 5: // the tightest shot and the most careful: one touch, leaning in
        crouch(tl, goblin, bodyAt, 0.35, plant.crouch);
        reach(tl, goblin, bodyAt, 0.5, plantSide, local, stanceOf(plant.crouch), 'power2.inOut');
        express(tl, goblin, bodyAt, 0.35, 'sly');
        break;
    }

    switch (i) {
      case 0: // map table — road being drawn
        tl.to(world.roadLine.scale, { x: 1, duration: dur }, actAt);
        break;
      case 1: // monster rears up
        tl.to(world.monster.scale, { x: 1, y: 1, z: 1, duration: dur, ease: 'back.out' }, actAt);
        break;
      case 2: // sign drops onto its bracket
        tl.to(world.tavernSign.position, { y: '-=0.95', duration: dur, ease: 'bounce.out' }, actAt);
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
  // Redress: the battle remains are gone, tended away into the cairn + mushrooms.
  tl.set(world.remains, { visible: false }, 57.5);
  tl.set(world.tended, { visible: true }, 57.5);
  // Half a beat on S3's cliff-top angle — the same spot, now tended — before the cut
  // settles into the over-the-shoulder framing. Both are hard cuts (zero-duration
  // tl.set), so this doesn't touch the straighten/rise timing below at all.
  cut(57.5, [119.5, 6.3, 1.8], [122.6, 6.3, 0]);
  cut(58.0, [117.5, 7.4, 3.2], [123, 6.6, 0]);
  skyCut(57.5, P.skyDawn); // C5 -> C6, on the same hard cut

  // He has been folded over his work for the entire film. Here, once, he straightens all
  // the way up — and it only reads as a moment because nothing before it did.
  settle(tl, goblin, 57.5, 0.01);
  straighten(tl, goblin, 58.2, 1.8);

  cap('pitch1', 58, 2.2); // cliff establish, before the world underneath him flattens

  // ---- t58.5-62: camera rises to dead top-down -------------------------------------
  cam(58.5, 3.5, [128, 26, 8], [146, 2, 0], 'power2.inOut');
  cam(62, 2.5, [145, 40, 0.01], [145, 0, 0], 'power2.inOut');

  // ---- t60-62: the miniature world flattens during the rise ------------------------
  const miniScales = world.miniWorld.map((g) => g.scale);
  tl.to(miniScales, { y: 0.02, duration: 1.5, stagger: 0.05, ease: 'power2.in' }, 60);

  cap('pitch2', 62.6, 1.0); // the throw — clears well before the board fades in at 64.5

  // ---- t62.5-64.5: the throw — die2 arcs into the top-down camera -------------------
  // Fog tweens sky-dawn -> sky-board across the throw arc, landing exactly on paper as
  // the board takes the frame — the film ending by becoming its own medium.
  sky(62.5, 2.0, P.skyBoard);
  tl.to(world.die2.scale, { x: 1, y: 1, z: 1, duration: 0.3 }, 62.5);
  tl.to(world.die2.position, { x: 145, z: 0, duration: 2 }, 62.5);
  tl.to(world.die2.position, { y: 30, duration: 1, ease: 'power1.out' }, 62.5);
  tl.to(world.die2.position, { y: 35.2, duration: 1, ease: 'power2.in' }, 63.5);
  tl.to(world.die2.rotation, { x: '+=12', y: '+=8', duration: 2, ease: 'power2.out' }, 62.5);

  // ---- t64.5-65.5: board fades in, die settles ---------------------------------------
  //
  // "Colour is what survives the flattening" (color-script §4.6). The board's paper used
  // to go to full opacity, which put an opaque sheet between the top-down lens and the
  // miniature and deleted the world one second after flattening it — the last image of
  // the film was an empty grid. The grid, the rules and the trim marks still land at
  // full ink; only the paper stops half way, so the fields, roads, river and roofs read
  // through it as the board's printed content. Half, not less: the endcard letters over
  // this and its paper halo has to hold against whatever is underneath.
  const BOARD_WASH = 0.5;
  const boardMaterials: THREE.Material[] = [];
  let boardWash: THREE.Material | undefined;
  world.board.traverse((obj) => {
    const mesh = obj as THREE.Object3D & { material?: THREE.Material | THREE.Material[] };
    if (!mesh.material) return;
    const found = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of found) {
      if (m.name === 'board-fill') boardWash = m;
      else boardMaterials.push(m);
    }
  });
  tl.to(boardMaterials, { opacity: 1, duration: 0.6 }, 64.5);
  if (boardWash) tl.to(boardWash, { opacity: BOARD_WASH, duration: 0.6 }, 64.5);
  tl.to(world.die2.position, { y: '-=0.15', duration: 0.2, yoyo: true, repeat: 1 }, 64.5);

  // ---- t64.85-65: the die leaves before the endcard letters on -------------------------
  // Its silhouette sat across the lower half of the wordmark for the whole last second,
  // and the wordmark carries a d20 glyph of its own — two dice, one of them a leftover.
  // The die's last motion is the settle above, which finishes at 64.9; it is out of frame
  // by the wordmark's entrance at 65.0, with the board still fading up behind it.
  tl.to(world.die2.scale, { x: 0, y: 0, z: 0, duration: 0.15, ease: 'power2.in' }, 64.85);

  // ---- t65.0-66: endcard — lettered onto the board, no box to draw first ------------
  // Not a card fading up: the board is already there (its own fade runs 64.5-65.1), so
  // the endcard's job is just to letter itself onto it. Wordmark first, then tagline and
  // subline write on with an overlapping stagger, then the CTA arrives last as one
  // object — the thing you're asked to do only shows up once there's something to read
  // first. Confident deceleration throughout (power2.out), the same ease family the rest
  // of the film already uses for its settles.
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const wordmark = caps['endcard-wordmark'];
  const tagline = caps['endcard-tagline'];
  const subline = caps['endcard-subline'];
  const cta = caps['endcard-cta'];
  const ctaLabel = caps['endcard-cta-label'];

  const entranceAt = 65.0;
  const easeIn = 'power2.out';

  if (wordmark) {
    tl.fromTo(wordmark, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: easeIn }, entranceAt);
  }

  // Tagline and subline write on left-to-right via clip-path, the pencil's own left-to-
  // right stroke direction; reduced motion swaps the wipe for a plain opacity fade at the
  // same time and duration. The whole sequence below is timed to finish with margin
  // before t66 — the timeline's scrub has a 0.8s catch-up smoothing, so anything that
  // finished exactly at the wire would still look mid-draw for a beat after a visitor
  // hits the bottom of the page.
  const taglineAt = entranceAt + 0.23;
  const taglineDur = 0.26;
  if (tagline) {
    if (reducedMotion) {
      tl.fromTo(
        tagline,
        { opacity: 0 },
        { opacity: 1, duration: taglineDur, ease: easeIn },
        taglineAt,
      );
    } else {
      tl.fromTo(
        tagline,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: taglineDur, ease: easeIn },
        taglineAt,
      );
    }
  }

  // starts 60% into the tagline's own wipe — the two read as one continuous beat, not
  // two separate ones
  const sublineAt = taglineAt + taglineDur * 0.6;
  const sublineDur = 0.24;
  if (subline) {
    if (reducedMotion) {
      tl.fromTo(
        subline,
        { opacity: 0 },
        { opacity: 1, duration: sublineDur, ease: easeIn },
        sublineAt,
      );
    } else {
      tl.fromTo(
        subline,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: sublineDur, ease: easeIn },
        sublineAt,
      );
    }
  }

  // CTA: the button (real border + its offset second pass together) fades/scales in as
  // its own beat, then the label inks in a moment after — the last thing to arrive is
  // the thing you're asked to do.
  const ctaAt = sublineAt + 0.13;
  if (cta) {
    tl.fromTo(
      cta,
      { opacity: 0, scale: reducedMotion ? 1 : 0.96 },
      { opacity: 1, scale: 1, duration: 0.18, ease: easeIn },
      ctaAt,
    );
  }
  if (ctaLabel) {
    tl.fromTo(
      ctaLabel,
      { opacity: 0 },
      { opacity: 1, duration: 0.1, ease: easeIn },
      ctaAt + 0.1,
    );
  }
  // full sequence settles by ~t65.72 — comfortably inside the 66-long beat sheet

  return tl;
}
