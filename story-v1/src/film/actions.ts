import * as THREE from 'three';
import type gsap from 'gsap';
import { RIG } from './world.ts';
import type { Arm, Goblin } from './world.ts';

// The beat sheet's body language, named. These were inline tween clusters in
// timeline.ts — the rope pull six lines, the shrug two, the nudge three — each found by
// eye against one prop and unreusable anywhere else. Naming them is what lets the same
// gesture appear in three chapters and stay the same gesture.
//
// Everything here writes only into timeline-owned channels (`*.pose`, elbow, wrist,
// pelvis, chest, neck, head, ears, face). The gait owns `*.swing` and `bob`, and the two
// sets never overlap — see `scripts/puppet.check.ts`.

type TL = gsap.core.Timeline;
type Vec3 = [number, number, number];

const armOf = (g: Goblin, side: -1 | 1): Arm => (side < 0 ? g.armL : g.armR);

// ---------------------------------------------------------------------------
// The gait — the only thing that runs per frame
// ---------------------------------------------------------------------------

// Written ONLY into swing/bob groups, at an amplitude scaled by `speed`, so it is additive
// over whatever pose the beat sheet authored. At speed 0 every term is exactly 0: the pose
// is released, not overridden. That single property is what this milestone is about.
//
// It lives here rather than in the render loop so `scripts/puppet.check.ts` can assert
// against the code that actually ships instead of against a copy of it.
export function applyGait(g: Goblin, gobT: number, ambient = 1) {
  const sp = g.speed;
  const ph = gobT * 11;
  const sw = Math.sin(ph) * sp;
  g.legL.swing.rotation.x = sw * 0.8;
  g.legR.swing.rotation.x = -sw * 0.8;
  // A knee only bends one way. Flexing just after each leg's backswing is what lifts the
  // trailing foot clear of the ground instead of dragging it through.
  g.legL.shin.swing.rotation.x = 0.7 * Math.max(0, Math.sin(ph - 0.7)) * sp;
  g.legR.shin.swing.rotation.x = 0.7 * Math.max(0, Math.sin(ph - 0.7 + Math.PI)) * sp;
  g.armL.swing.rotation.x = -sw * 0.6;
  g.armR.swing.rotation.x = sw * 0.6;

  // He is the one thing a freeze does not stop, so his breath rides the same clock as his
  // gait and fades in as the gait fades out. Without it he holds perfectly still through
  // "That was me." — the exact frame where the film claims he is still alive.
  const breath = 0.5 + 0.5 * Math.sin(gobT * 1.9);
  const still = (1 - sp) * ambient * (1 - g.planted);
  g.bob.position.y = 0.025 * Math.abs(Math.sin(ph * 2)) * sp + 0.011 * breath * still;
  g.bob.rotation.x = -0.018 * breath * still;
}

// ---------------------------------------------------------------------------
// Reach — solved, not tuned
// ---------------------------------------------------------------------------

// Thirteen reaches in this film used to be thirteen hand-found shoulder angles, each
// correct for exactly one prop height. With an elbow in the chain the angles are just
// trigonometry: two bones, a target, and the law of cosines. The hand then lands ON the
// hinge, the lid or the mushroom at any height — including the ones the art pass moves.
//
// `target` is in the goblin's own space (root-local): +z is in front of him, +y is up
// from the ground he stands on. That is how the beat sheet already thinks about props.
export type Stance = {
  hipY?: number; // pelvis height — a crouch lowers the shoulder with it
  chestX?: number; // chest pitch — it does not move the shoulder, it rotates the arm's frame
};

export function reachSolve(side: -1 | 1, target: Vec3, stance: Stance = {}) {
  const a = RIG.upper;
  const b = RIG.fore + RIG.hand;
  const hipY = stance.hipY ?? RIG.hipY;
  const chestX = stance.chestX ?? 0;

  // Into chest space first. The chest pivots at the waist, so a fold carries the shoulder
  // down and forward with it; solving in the upright frame puts the hand behind the prop
  // by however far he was bent over.
  const v = new THREE.Vector3(target[0], target[1] - (hipY + RIG.chestY), target[2])
    .applyAxisAngle(new THREE.Vector3(1, 0, 0), -chestX)
    .sub(new THREE.Vector3(side * RIG.shoulderX, RIG.shoulderY, RIG.shoulderZ));

  // Out of range clamps to full extension, which is also the correct read: he is
  // reaching for something too high. The hanging tavern sign in the montage is exactly
  // that shot, and it should look like a stretch rather than snap to a shorter pose.
  const d = THREE.MathUtils.clamp(v.length(), Math.abs(a - b) + 1e-6, a + b - 1e-6);

  // How far the elbow bends, and how far that throws the hand off the aim line.
  const interior = Math.acos(THREE.MathUtils.clamp((a * a + b * b - d * d) / (2 * a * b), -1, 1));
  const bend = Math.PI - interior;
  const alpha = Math.atan2(b * Math.sin(bend), a + b * Math.cos(bend));

  // Aim, inverted exactly rather than approached. The group's Euler order is XYZ, so the
  // z swing applies first and the x pitch second, which makes the arm direction
  //   d = (sin z, -cos z cos x, -cos z sin x)
  // and that inverts in closed form. Two wrong answers were tried first and both are worth
  // remembering: "swing sideways then pitch" via atan2 over a hypotenuse loses the SIGN of
  // the vertical component, so every overhead target solved to an arm thrown backwards;
  // and a shortest-arc quaternion is signless in a different way — it happily routes the
  // arm to an overhead prop through his own back, because nothing in it knows a shoulder
  // has a front. Solving the pitch as a full atan2 keeps the arm going up the front.
  const dir = v.clone().normalize();
  const swing = Math.asin(THREE.MathUtils.clamp(dir.x, -1, 1));
  const pitch = Math.atan2(-dir.z, -dir.y);

  // and pre-tilt by alpha so the elbow's bend brings the hand back onto the aim line
  return { shoulderX: pitch + alpha, shoulderY: 0, shoulderZ: swing, elbowX: -bend };
}

export function reach(
  tl: TL,
  g: Goblin,
  at: number,
  dur: number,
  side: -1 | 1,
  target: Vec3,
  stance: Stance = {},
  ease = 'power2.out',
) {
  const arm = armOf(g, side);
  const s = reachSolve(side, target, stance);
  tl.to(
    arm.pose.rotation,
    { x: s.shoulderX, y: s.shoulderY, z: s.shoulderZ, duration: dur, ease },
    at,
  );
  tl.to(arm.elbow.rotation, { x: s.elbowX, duration: dur, ease }, at);
  // the wrist follows the forearm a beat late, which is what makes a hand land rather
  // than arrive rigid
  tl.to(arm.wrist.rotation, { x: -0.35, duration: dur * 0.8, ease }, at + dur * 0.2);
  tl.to(g, { planted: 1, duration: dur, ease }, at);
}

// An arm at rest hangs plumb. It is a child of the chest, so folding the chest forward
// swings both arms out in front of him unless the shoulder counter-rotates by the same
// angle — which read as a man carrying an invisible tray, and got worse the lower he
// stooped. Every rest pose therefore needs to know how far he is bent over.
export function armRest(tl: TL, g: Goblin, at: number, dur: number, side: -1 | 1, chestX = HUNCH) {
  const arm = armOf(g, side);
  tl.to(arm.pose.rotation, { x: -chestX, y: 0, z: 0, duration: dur }, at);
  tl.to(arm.elbow.rotation, { x: -0.18, duration: dur }, at);
  tl.to(arm.wrist.rotation, { x: 0, duration: dur }, at);
  tl.to(g, { planted: 0, duration: dur }, at);
}

// ---------------------------------------------------------------------------
// Stance
// ---------------------------------------------------------------------------

// A crouch is the hips dropping while the feet stay where they are. Knee forward, shin
// back by the same angle, so the ankle tracks straight down and he compresses instead of
// stepping. `amount` 0..1; 1 is as low as he goes before the tunic hem meets the floor.
const CROUCH_MAX = 1.15; // radians of thigh angle

export function crouchPose(amount: number) {
  const a = amount * CROUCH_MAX;
  return {
    hipY: RIG.hipY - (RIG.thigh + RIG.shin) * (1 - Math.cos(a)),
    thigh: -a,
    knee: 2 * a,
    ankle: -a, // keeps the sole flat on the floor
  };
}

// The chest pitch a crouch of this depth folds him into. Kept as a function because
// every reach taken mid-crouch has to be solved in that folded frame.
export const crouchChest = (amount: number) => 0.22 + 0.5 * amount;

// Where he has to stand, and how far he has to fold, to actually put a hand on something
// at a given height. His arm is a third of his body — shorter, proportionally, than a
// human's — so the ground is simply not reachable standing up. That is why a stoop is a
// real action here and not a flourish, and why prop stand positions are derived from it
// rather than eyeballed: at the old distances the nearest prop was three times his own
// reach away, and every one of them appeared to move by itself.
// `standoff` is how far in front of his feet the prop sits; `lateral` puts it in front of
// the working shoulder rather than his navel, which is how anyone stands to work on
// something and is worth 0.17 of reach he does not otherwise have.
// `minStandoff` floors how far in front of his feet the job sits, past whatever the reach
// solve itself would pick. Default 0 leaves every existing call untouched. It exists for
// jobs with a footprint the reach solve doesn't know about — furniture, a table's own
// legs — where the natural stand point lands his feet inside something solid; the arm
// still clamps to its own max extension in reachSolve, so pushing the floor out reads as
// a stretch over the edge rather than a step through it.
export function plantFor(targetY: number, side: -1 | 1 = 1, minStandoff = 0) {
  const arm = RIG.upper + RIG.fore + RIG.hand;
  const comfortable = (arm * 0.94) ** 2;
  const lateral = side * RIG.shoulderX;

  // READABLE is why this loop takes the first fold that clears 0.2 rather than the first
  // that merely works. Taking the shallowest workable fold put the campfire 0.14 in front
  // of him, which solves to an arm hanging almost straight down: technically his hand was
  // on the fire, and on screen he was a man standing next to one. A stoop has to look like
  // a stoop, so he folds until the job is out in front of him where the audience can see
  // the arm go to it.
  // Scaled by the rig's own reach (was a 0.2 literal): the art-bible retune shortened
  // his arms, and a readability bar tuned to the old arm put every prop out of range.
  const READABLE = arm * 0.68;
  let best: { crouch: number; standoff: number; lateral: number } | null = null;
  for (const amount of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    const chestX = crouchChest(amount);
    // where the fold puts the shoulder — the chest pivots at the waist, carrying it down and
    // forward, and a shoulder set behind the waist swings through that same arc
    const shoulderY =
      crouchPose(amount).hipY +
      RIG.chestY +
      RIG.shoulderY * Math.cos(chestX) -
      RIG.shoulderZ * Math.sin(chestX);
    const shoulderZ = RIG.shoulderY * Math.sin(chestX) + RIG.shoulderZ * Math.cos(chestX);
    const room = comfortable - (targetY - shoulderY) ** 2;
    if (room > 0.04 ** 2) {
      const standoff = shoulderZ + Math.sqrt(room);
      if (standoff >= READABLE) {
        return { crouch: amount, standoff: Math.max(standoff, minStandoff), lateral };
      }
      // keep the deepest fold that at least reaches, in case nothing clears the bar
      best = { crouch: amount, standoff, lateral };
    }
  }
  // A fold that technically reaches but tucks the hand against his body reads worse
  // than an honest stretch — only keep it if the job still sits visibly in front of him.
  if (best && best.standoff >= arm * 0.65) {
    return { ...best, standoff: Math.max(best.standoff, minStandoff) };
  }
  // Above his head or too tucked in: he stands back from it and stretches. Standing
  // directly under it put the target behind his own shoulder once the hunch is counted,
  // and the only way to a point behind your shoulder is backwards through your spine —
  // so ~0.95 of his arm keeps it out in front.
  return { crouch: 0, standoff: Math.max(arm * 0.95, minStandoff), lateral };
}

// Which hand he works with. A correct reach that goes straight away from the lens is
// hidden behind his own back, so the shot decides the hand: whichever shoulder is nearer
// the camera. Pass his heading, where he stands, and where the lens is, all in world xz.
export function cameraSideArm(
  heading: number,
  stand: [number, number],
  cam: [number, number],
): -1 | 1 {
  // his local +x in world xz, i.e. the direction of his right shoulder
  const right: [number, number] = [Math.cos(heading), -Math.sin(heading)];
  const toCam: [number, number] = [cam[0] - stand[0], cam[1] - stand[1]];
  return right[0] * toCam[0] + right[1] * toCam[1] > 0 ? 1 : -1;
}

// the frame a reach is solved in while he is folded into a crouch
export const stanceOf = (amount: number) => ({
  hipY: crouchPose(amount).hipY,
  chestX: crouchChest(amount),
});

export function crouch(tl: TL, g: Goblin, at: number, dur: number, amount: number, ease = 'power2.out') {
  const p = crouchPose(amount);
  tl.to(g.pelvis.position, { y: p.hipY, duration: dur, ease }, at);
  for (const leg of [g.legL, g.legR]) {
    tl.to(leg.pose.rotation, { x: p.thigh, duration: dur, ease }, at);
    tl.to(leg.shin.pose.rotation, { x: p.knee, duration: dur, ease }, at);
    tl.to(leg.foot.rotation, { x: p.ankle, duration: dur, ease }, at);
  }
  // he folds over the work as he goes down; standing back up opens him out again
  tl.to(g.chest.rotation, { x: crouchChest(amount), duration: dur, ease }, at);
}

// Weight onto one foot: the pelvis tips toward the loaded side and the chest tips back
// the other way. That counter-rotation is the whole difference between standing and
// posing, and it costs two tweens.
export function weightShift(tl: TL, g: Goblin, at: number, dur: number, side: -1 | 1, amount = 1) {
  tl.to(g.pelvis.rotation, { z: side * 0.09 * amount, duration: dur, ease: 'power2.inOut' }, at);
  tl.to(g.chest.rotation, { z: -side * 0.13 * amount, duration: dur, ease: 'power2.inOut' }, at);
}

// His rest state. The hunch is a goblin's default, not a mood, so every action returns
// here rather than to a mannequin's neutral.
export const HUNCH = 0.3;

export function settle(tl: TL, g: Goblin, at: number, dur = 0.5) {
  tl.to(g.pelvis.position, { y: RIG.hipY, duration: dur }, at);
  tl.to(g.pelvis.rotation, { z: 0, duration: dur }, at);
  tl.to(g.chest.rotation, { x: HUNCH, z: 0, duration: dur }, at);
  for (const leg of [g.legL, g.legR]) {
    tl.to(leg.pose.rotation, { x: 0, duration: dur }, at);
    tl.to(leg.shin.pose.rotation, { x: 0, duration: dur }, at);
    tl.to(leg.foot.rotation, { x: 0, duration: dur }, at);
    tl.to(leg.toe.rotation, { x: 0, duration: dur }, at);
  }
  armRest(tl, g, at, dur, -1);
  armRest(tl, g, at, dur, 1);
}

// ---------------------------------------------------------------------------
// Head and face
// ---------------------------------------------------------------------------

// A look leads from the neck and the head finishes it, 0.12 behind. Turning a head that
// is a third of his body from the skull alone reads as a doll on a spindle.
export function look(tl: TL, g: Goblin, at: number, dur: number, yaw: number, pitch = 0) {
  tl.to(g.neck.rotation, { y: yaw * 0.45, x: pitch * 0.4, duration: dur, ease: 'power2.inOut' }, at);
  tl.to(
    g.head.rotation,
    { y: yaw * 0.55, x: pitch * 0.6, duration: dur * 0.9, ease: 'power2.out' },
    at + dur * 0.12,
  );
}

// Expression set. Geometry never changes; these are offsets from the drawn face, and the
// ears are in every entry on purpose — at montage distance an ear still reads as a shape
// when a brow is two pixels.
type Expression = {
  brow: [number, number]; // rotation.z offset, [left, right]
  browY: number; // lift
  eye: number; // scale
  mouth: [number, number, number]; // rotation.z, scale.x, y offset
  ear: number; // + = up and forward, - = back
};

export const EXPRESSIONS: Record<string, Expression> = {
  neutral: { brow: [0, 0], browY: 0, eye: 1, mouth: [0.2, 1, 0], ear: 0 },
  sly: { brow: [0.24, -0.02], browY: 0.012, eye: 0.95, mouth: [0.48, 1.15, 0.004], ear: 0.18 },
  flat: { brow: [-0.34, 0.34], browY: 0, eye: 1, mouth: [0, 0.9, 0], ear: -0.06 },
  strain: { brow: [-0.16, 0.16], browY: -0.016, eye: 0.7, mouth: [0.2, 0.75, -0.006], ear: -0.5 },
  smug: { brow: [0.18, -0.18], browY: 0.018, eye: 1.05, mouth: [0.54, 1.3, 0.006], ear: 0.3 },
  alarm: { brow: [0.26, -0.26], browY: 0.03, eye: 1.45, mouth: [0.1, 0.7, -0.01], ear: 0.5 },
};

const BROW_Y = 0.052; // the draft-6 face is bottom-loaded — brows ride the huge eyes
const MOUTH_Y = -0.09; // and the mouth sits just above the pointed chin
const EAR_Z = 1.3; // matches the rig's near-horizontal ear base angle in world.ts (draft 6)

export function express(tl: TL, g: Goblin, at: number, dur: number, name: keyof typeof EXPRESSIONS) {
  const e = EXPRESSIONS[name];
  const f = g.face;
  tl.to(f.browL.rotation, { z: 0.34 + e.brow[0], duration: dur }, at);
  tl.to(f.browR.rotation, { z: -0.34 + e.brow[1], duration: dur }, at);
  tl.to(f.browL.position, { y: BROW_Y + e.browY, duration: dur }, at);
  tl.to(f.browR.position, { y: BROW_Y + e.browY, duration: dur }, at);
  tl.to(f.eyeL.scale, { x: e.eye, y: e.eye, duration: dur }, at);
  tl.to(f.eyeR.scale, { x: e.eye, y: e.eye, duration: dur }, at);
  tl.to(f.mouth.rotation, { z: e.mouth[0], duration: dur }, at);
  tl.to(f.mouth.scale, { x: e.mouth[1], duration: dur }, at);
  tl.to(f.mouth.position, { y: MOUTH_Y + e.mouth[2], duration: dur }, at);
  tl.to(g.earL.rotation, { z: EAR_Z - e.ear, duration: dur }, at);
  tl.to(g.earR.rotation, { z: -(EAR_Z - e.ear), duration: dur }, at);
}

// ---------------------------------------------------------------------------
// The named actions
// ---------------------------------------------------------------------------

// Chapter 1. He is not rising out of the floor on a lift; he is folded behind a rock and
// the head clears it first, because that is what looking over something is.
export function peek(tl: TL, g: Goblin, at: number, dur: number) {
  crouch(tl, g, at, dur * 0.6, 0.85, 'power2.out');
  tl.to(g.chest.rotation, { x: 0.62, duration: dur * 0.6 }, at);
  look(tl, g, at + dur * 0.35, dur * 0.6, 0, -0.9);
  express(tl, g, at + dur * 0.3, 0.3, 'alarm');
  // shoulders up around the ears — hiding is a whole-body verb
  tl.to(g.armL.pose.rotation, { x: 0.34, z: -0.24, duration: dur * 0.6 }, at);
  tl.to(g.armR.pose.rotation, { x: 0.34, z: 0.24, duration: dur * 0.6 }, at);
}

// Nimble Escape, which is the one thing every table knows a goblin for. He does not
// accelerate from standing: he unloads the crouch he is already in.
export function bolt(tl: TL, g: Goblin, at: number, dur: number) {
  tl.to(g.pelvis.position, { y: RIG.hipY - 0.02, duration: dur * 0.25, ease: 'power3.out' }, at);
  tl.to(g.chest.rotation, { x: 0.55, duration: dur * 0.3, ease: 'power2.out' }, at);
  for (const leg of [g.legL, g.legR]) {
    tl.to(leg.pose.rotation, { x: 0, duration: dur * 0.3 }, at);
    tl.to(leg.shin.pose.rotation, { x: 0, duration: dur * 0.3 }, at);
    tl.to(leg.foot.rotation, { x: 0, duration: dur * 0.3 }, at);
  }
  armRest(tl, g, at, dur * 0.3, -1, HUNCH + 0.12);
  armRest(tl, g, at, dur * 0.3, 1, HUNCH + 0.12);
  // and he settles from a sprint lean back into his working hunch
  tl.to(g.chest.rotation, { x: HUNCH + 0.12, duration: dur * 0.7 }, at + dur * 0.3);
}

// A quick down-and-up over a job at his feet: plant a tree, set a stone, press a mushroom
// into the ground. Two thirds down, one third up, because standing up is the easy half.
export function stoop(tl: TL, g: Goblin, at: number, dur: number, target: Vec3, side: -1 | 1 = 1) {
  const plant = plantFor(target[1], side);
  crouch(tl, g, at, dur * 0.4, plant.crouch);
  reach(tl, g, at + dur * 0.15, dur * 0.45, side, target, stanceOf(plant.crouch));
  express(tl, g, at, 0.25, 'neutral');
  crouch(tl, g, at + dur * 0.62, dur * 0.38, 0.08);
  armRest(tl, g, at + dur * 0.66, dur * 0.34, side, crouchChest(0.08));
}

// Both hands under something heavy, and the straighten is the whole action. Weight is a
// posture problem: the load goes over his feet or he falls over.
export function lift(tl: TL, g: Goblin, at: number, dur: number, target: Vec3) {
  crouch(tl, g, at, dur * 0.3, 0.75);
  const st = stanceOf(0.75);
  reach(tl, g, at + dur * 0.1, dur * 0.3, -1, [target[0] - 0.08, target[1], target[2]], st);
  reach(tl, g, at + dur * 0.1, dur * 0.3, 1, [target[0] + 0.08, target[1], target[2]], st);
  express(tl, g, at + dur * 0.3, 0.25, 'strain');
  crouch(tl, g, at + dur * 0.45, dur * 0.45, 0.1, 'power2.inOut');
  tl.to(g.chest.rotation, { x: HUNCH - 0.16, duration: dur * 0.45 }, at + dur * 0.45);
  express(tl, g, at + dur * 0.85, 0.3, 'smug');
}

// A short stroke from the elbow. A hammer swung from the shoulder is a sledgehammer.
export function tap(tl: TL, g: Goblin, at: number, dur: number, target: Vec3, side: -1 | 1 = 1, times = 2) {
  const s = reachSolve(side, target, {});
  reach(tl, g, at, dur * 0.4, side, target);
  tl.to(
    armOf(g, side).elbow.rotation,
    { x: s.elbowX - 0.45, duration: dur * 0.12, yoyo: true, repeat: times * 2 - 1, ease: 'power2.inOut' },
    at + dur * 0.45,
  );
}

// The rope. He is not pulling with his arms; he is hanging his weight off it, which is
// what the rear foot rolling onto its toe is there to say.
export function haul(tl: TL, g: Goblin, at: number, dur: number) {
  tl.to(g.legR.pose.rotation, { x: 0.42, duration: dur * 0.2 }, at); // rear leg planted back
  tl.to(g.legR.shin.pose.rotation, { x: 0.1, duration: dur * 0.2 }, at);
  tl.to(g.legR.toe.rotation, { x: 0.5, duration: dur * 0.2 }, at);
  tl.to(g.legL.pose.rotation, { x: -0.3, duration: dur * 0.2 }, at); // front leg braced
  tl.to(g.legL.shin.pose.rotation, { x: 0.34, duration: dur * 0.2 }, at);
  tl.to(g.pelvis.position, { y: RIG.hipY - 0.05, duration: dur * 0.2 }, at);

  reach(tl, g, at, dur * 0.25, -1, [-0.12, 1.02, 0.34]);
  reach(tl, g, at, dur * 0.25, 1, [0.14, 1.12, 0.3]);
  express(tl, g, at + dur * 0.2, 0.3, 'strain');

  // two pulls, not one long drag: a rope comes in on a ratchet
  tl.to(g.chest.rotation, { x: -0.34, duration: dur * 0.3, ease: 'power2.in' }, at + dur * 0.22);
  tl.to(g.chest.rotation, { x: -0.12, duration: dur * 0.12 }, at + dur * 0.52);
  tl.to(g.chest.rotation, { x: -0.4, duration: dur * 0.24, ease: 'power2.in' }, at + dur * 0.64);
  tl.to(g.pelvis.rotation, { z: 0.06, duration: dur * 0.3, yoyo: true, repeat: 1 }, at + dur * 0.25);
}

export function shrug(tl: TL, g: Goblin, at: number, dur: number) {
  tl.to(g.armL.pose.rotation, { z: -0.95, x: 0.3, duration: dur * 0.4, ease: 'back.out(2)' }, at);
  tl.to(g.armR.pose.rotation, { z: 0.95, x: 0.3, duration: dur * 0.4, ease: 'back.out(2)' }, at);
  tl.to(g.armL.elbow.rotation, { x: -1.35, duration: dur * 0.4 }, at); // palms up
  tl.to(g.armR.elbow.rotation, { x: -1.35, duration: dur * 0.4 }, at);
  tl.to(g.chest.rotation, { x: HUNCH + 0.14, duration: dur * 0.4 }, at); // shoulders to ears
  tl.to(g.neck.rotation, { x: 0.16, duration: dur * 0.4 }, at);
  tl.to(g.neck.rotation, { x: 0, duration: dur * 0.4 }, at + dur * 0.6);
  tl.to(g.chest.rotation, { x: HUNCH, duration: dur * 0.4 }, at + dur * 0.6);
  armRest(tl, g, at + dur * 0.6, dur * 0.4, -1);
  armRest(tl, g, at + dur * 0.6, dur * 0.4, 1);
}

export function wave(tl: TL, g: Goblin, at: number, dur: number) {
  tl.to(g.armR.pose.rotation, { z: -2.5, x: -0.2, duration: dur * 0.25, ease: 'power2.out' }, at);
  tl.to(g.armR.elbow.rotation, { x: -0.5, duration: dur * 0.25 }, at);
  tl.to(
    g.armR.wrist.rotation,
    { z: 0.5, duration: dur * 0.14, yoyo: true, repeat: 5, ease: 'sine.inOut' },
    at + dur * 0.28,
  );
  weightShift(tl, g, at, dur * 0.3, -1);
  express(tl, g, at + dur * 0.1, 0.3, 'smug');
  armRest(tl, g, at + dur * 0.78, dur * 0.22, 1);
  weightShift(tl, g, at + dur * 0.78, dur * 0.22, 1, 0);
}

// One finger, applied to a die. The comedy is that it takes his whole body to be this
// careful, so he crouches to eye level to do it.
export function nudge(tl: TL, g: Goblin, at: number, dur: number, target: Vec3) {
  crouch(tl, g, at, dur * 0.3, 0.4);
  const st = stanceOf(0.4);
  reach(tl, g, at + dur * 0.1, dur * 0.35, 1, [target[0] - 0.1, target[1] + 0.04, target[2] - 0.08], st);
  express(tl, g, at, 0.3, 'sly');
  reach(tl, g, at + dur * 0.5, dur * 0.3, 1, target, st); // the push itself
  crouch(tl, g, at + dur * 0.8, dur * 0.2, 0.05);
  armRest(tl, g, at + dur * 0.82, dur * 0.18, 1, crouchChest(0.05));
}

export function dustOff(tl: TL, g: Goblin, at: number, dur: number) {
  for (const [i, arm] of [g.armL, g.armR].entries()) {
    tl.to(arm.pose.rotation, { x: -0.55, duration: dur * 0.25 }, at + i * 0.05);
    tl.to(
      arm.elbow.rotation,
      { x: -1.5, duration: dur * 0.16, yoyo: true, repeat: 3, ease: 'power2.inOut' },
      at + dur * 0.25 + i * 0.05,
    );
  }
  express(tl, g, at, 0.3, 'smug');
  armRest(tl, g, at + dur * 0.8, dur * 0.2, -1);
  armRest(tl, g, at + dur * 0.8, dur * 0.2, 1);
}

// The cliff. He straightens fully exactly once in the film, and this is it — everything
// before it is worked over, hunched, at arm's length.
export function straighten(tl: TL, g: Goblin, at: number, dur: number) {
  tl.to(g.chest.rotation, { x: -0.05, z: 0, duration: dur, ease: 'power2.inOut' }, at);
  tl.to(g.pelvis.position, { y: RIG.hipY, duration: dur, ease: 'power2.inOut' }, at);
  tl.to(g.pelvis.rotation, { z: 0, duration: dur }, at);
  tl.to(g.neck.rotation, { x: -0.1, y: 0, duration: dur, ease: 'power2.inOut' }, at);
  tl.to(g.head.rotation, { x: -0.12, duration: dur, ease: 'power2.inOut' }, at);
  express(tl, g, at + dur * 0.4, dur * 0.5, 'smug');
}
