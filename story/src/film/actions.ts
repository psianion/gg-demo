import * as THREE from 'three';
import type gsap from 'gsap';
import {
  RIG,
  REST,
  EAR_Z_L,
  EAR_Z_R,
  WORKING_SIDE,
  WEIGHT_PELVIS_Z,
  WEIGHT_CHEST_Z,
  POCKET,
} from './world.ts';
import type { Arm, Goblin } from './world.ts';
import { BREATH_RATE, SETTLE, STRIDE_RATE, T_GESTURE } from './motion.ts';

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
// §3.3 — handedness is pinned ONCE, in world.ts. Every beat, both ear treatments, the
// stow and the pocket resolve their side through these two helpers instead of writing a
// literal 1 or −1, so flipping WORKING_SIDE flips the whole performance and nothing
// forks. `earOf` matters more than it looks: the two blades sit on unequal bases, so
// "the working-side ear" is a different rotation from "the other one" in every beat.
const earOf = (g: Goblin, side: -1 | 1): THREE.Group => (side < 0 ? g.earL : g.earR);
const earBase = (side: -1 | 1): number => (side < 0 ? EAR_Z_L : -EAR_Z_R);
const OFF_SIDE: -1 | 1 = -WORKING_SIDE as -1 | 1;

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
  const ph = gobT * STRIDE_RATE;
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
  const breath = 0.5 + 0.5 * Math.sin(gobT * BREATH_RATE);
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
  ease: string = SETTLE.arrive,
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

// WHICH SHOULDER THE LENS SEES — a SHOT test, not a handedness decision.
//
// §3.3 pins the working hand to WORKING_SIDE for the whole film, and every verb above
// reads that constant rather than choosing per beat. This function is what verifies a
// stage HONOURS that pin: the doc's own check is `cameraSideArm(1.60, [0.95, z], cam)`
// returning +1 at both HERO_AZ 18° and HERO_AZ_PORTRAIT 24°, i.e. the hero camera is
// staged so the working shoulder is the near one. Where a vignette's camera has not been
// restaged, this still flips the reach, because a correct reach that goes straight away
// from the lens is hidden behind his own back and that is worse than a mixed hand.
// Pass his heading, where he stands, and where the lens is, all in world xz.
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
  const p = side * WEIGHT_PELVIS_Z * amount;
  const c = -side * WEIGHT_CHEST_Z * amount;
  tl.to(g.pelvis.rotation, { z: p, duration: dur, ease: 'power2.inOut' }, at);
  tl.to(g.chest.rotation, { z: c, duration: dur, ease: 'power2.inOut' }, at);
}

// His rest state. The hunch is a goblin's default, not a mood, so every action returns
// here rather than to a mannequin's neutral.
export const HUNCH = 0.3;

export function settle(tl: TL, g: Goblin, at: number, dur = T_GESTURE) {
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
  // the flick trails home too — §11.1: it is an authored key, never a velocity term
  tl.to(g.hemFlick.rotation, { z: REST.hemFlickZ, duration: dur }, at);
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
  ear: number; // radians toward vertical off each blade's OWN base; + = up, − = back
  hood?: number; // §6 — the cowl's ±0.02 y slide IS the brow at 150 px
};

// THE EAR RETUNE (design §13 step 6), done. Every delta below is measured against the
// UNEQUAL bases EAR_Z_R 0.55 / EAR_Z_L 0.85, not the retired symmetric 1.3.
//
// `ear` is still an absolute radian delta applied to both blades, because that is what
// keeps the pair swinging as a unit: the V between them is (EAR_Z_L + EAR_Z_R) − 2·ear,
// so a common delta rotates the whole pair without either blade re-sweeping past the
// other. Two rules fall out of the new bases and they are the reason this pass was not
// free — an old delta transplanted onto them breaks one or the other:
//
//   CEILING +0.70. The RIGHT blade must stay the figure's apex (gate G2), which holds
//     while |0.55 − ear| < |0.85 − ear| — true up to 0.70, where the two tips meet and
//     past which the LEFT blade becomes the apex: the mushroom read G2 exists to kill.
//     `alarm` sits at 0.62, which carries the right blade 4° PAST vertical (§9 books
//     that explicitly, and it is funnier) with the apex still safely on the right.
//   FLOOR −0.30. Below that the blades re-open toward the retired 1.3 cap: the old
//     `strain` of −0.5 would lay the left blade at 77° off vertical, which is the
//     shipped mushroom back again. Effort now reads at −0.22, and the run's pinned
//     ears are authored in `bolt` where the doc puts them, not here.
export const EXPRESSIONS: Record<string, Expression> = {
  neutral: { brow: [0, 0], browY: 0, eye: 1, mouth: [0.2, 1, 0], ear: 0 },
  sly: { brow: [0.24, -0.02], browY: 0.012, eye: 0.95, mouth: [0.48, 1.15, 0.004], ear: 0.12 },
  flat: { brow: [-0.34, 0.34], browY: 0, eye: 1, mouth: [0, 0.9, 0], ear: -0.05 },
  strain: { brow: [-0.16, 0.16], browY: -0.016, eye: 0.7, mouth: [0.2, 0.75, -0.006], ear: -0.22 },
  smug: {
    brow: [0.18, -0.18], browY: 0.018, eye: 1.05, mouth: [0.54, 1.3, 0.006], ear: 0.2, hood: -0.01,
  },
  alarm: {
    brow: [0.26, -0.26], browY: 0.03, eye: 1.45, mouth: [0.1, 0.7, -0.01], ear: 0.62, hood: 0.014,
  },
};

// §11.3 — the ears are the follow-through: they arrive LAST, +80 ms behind the face,
// and they overshoot by 30 %. The apex of the silhouette is an ear, so this is what
// makes even a 36-px figure feel elastic.
const EAR_LAG = 0.08;
const EAR_OVERSHOOT = 'back.out(1.3)';

// Exported because `express` writes these two ABSOLUTELY: any figure this library drives
// has to seat its brow and mouth channels on the same two numbers, and a second copy of
// them inside a sculpt is a fork waiting to happen. Nothing else here changed.
export const BROW_Y = 0.05; // the face is bottom-loaded — brows ride the huge eyes
export const MOUTH_Y = -0.086; // and the mouth sits just above the pointed chin
// The ear bases are UNEQUAL now (goblin design §2, §9): the right blade is the tall
// clean apex of the silhouette, the left is the swept one. `express` writes ear
// rotation ABSOLUTELY, so it must read the rig's own two constants — one home in
// world.ts, imported here (gate G8). The old symmetric base of 1.3 rad (≈75° both sides)
// was the mushroom cap the diagnosis measured.
//
// RETUNED against those bases — see the ceiling/floor rules on EXPRESSIONS above.

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
  // §6 — the cowl IS the brow. Silhouette-safe, and it reads at 150 px where a two-pixel
  // brow stroke does not.
  tl.to(g.hood.position, { y: e.hood ?? 0, duration: dur }, at);
  // …and the ears arrive last, with the one overshoot (§11.3)
  tl.to(g.earL.rotation, { z: EAR_Z_L - e.ear, duration: dur, ease: EAR_OVERSHOOT }, at + EAR_LAG);
  tl.to(
    g.earR.rotation,
    { z: -(EAR_Z_R - e.ear), duration: dur, ease: EAR_OVERSHOOT },
    at + EAR_LAG,
  );
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
  // §10 — THE PERISCOPE. Everything else hides; the working-side blade stays up, and it
  // is the gag the unequal ear pivots were built for. Written after express() on purpose:
  // it overrides that one channel and nothing else. Vertical, not past it — the blade is
  // a periscope here, not an alarm.
  tl.to(
    earOf(g, WORKING_SIDE).rotation,
    { z: 0, duration: dur * 0.5, ease: EAR_OVERSHOOT },
    at + dur * 0.3 + EAR_LAG,
  );
}

// Nimble Escape, which is the one thing every table knows a goblin for. He does not
// accelerate from standing: he unloads the crouch he is already in.
export function bolt(tl: TL, g: Goblin, at: number, dur: number) {
  // §7 — ALWAYS SHOW THE STOW. A 120 ms tuck before any run or haul; an invisible tool
  // is a deleted premise, so it goes behind the working ear, never into the satchel.
  stow(tl, g, at);
  const t0 = at + STOW_DUR; // the unload starts AFTER the tuck — §10's "stow 120 ms →"
  tl.to(g.pelvis.position, { y: RIG.hipY - 0.02, duration: dur * 0.25, ease: 'power3.out' }, t0);
  tl.to(g.chest.rotation, { x: 0.55, duration: dur * 0.3, ease: 'power2.out' }, t0);
  for (const leg of [g.legL, g.legR]) {
    tl.to(leg.pose.rotation, { x: 0, duration: dur * 0.3 }, t0);
    tl.to(leg.shin.pose.rotation, { x: 0, duration: dur * 0.3 }, t0);
    tl.to(leg.foot.rotation, { x: 0, duration: dur * 0.3 }, t0);
  }
  // §10 — HE DOES NOT PUMP HIS ARMS. A professional runs like a waiter with a tray:
  // both arms stay in against the fold and the legs do the running. This is also what
  // brings the stowing hand back down out of the tuck.
  armRest(tl, g, t0, dur * 0.3, -1, HUNCH + 0.12);
  armRest(tl, g, t0, dur * 0.3, 1, HUNCH + 0.12);
  // ears pinned back into the wind, hem trailing — both authored keys, both restored by
  // settle(). §11.1: there is no velocity term anywhere in this.
  tl.to(g.earL.rotation, { z: EAR_Z_L + 0.5, duration: dur * 0.3 }, t0 + EAR_LAG);
  tl.to(g.earR.rotation, { z: -(EAR_Z_R + 0.5), duration: dur * 0.3 }, t0 + EAR_LAG);
  tl.to(g.hemFlick.rotation, { z: -0.3, duration: dur * 0.3, ease: 'power2.out' }, t0);
  // and he settles from a sprint lean back into his working hunch
  tl.to(g.chest.rotation, { x: HUNCH + 0.12, duration: dur * 0.7 }, t0 + dur * 0.3);
}

// A quick down-and-up over a job at his feet: plant a tree, set a stone, press a mushroom
// into the ground. Two thirds down, one third up, because standing up is the easy half.
export function stoop(tl: TL, g: Goblin, at: number, dur: number, target: Vec3, side: -1 | 1 = WORKING_SIDE) {
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
export function tap(tl: TL, g: Goblin, at: number, dur: number, target: Vec3, side: -1 | 1 = WORKING_SIDE, times = 2) {
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
  stow(tl, g, at); // §7 — the tuck before any run or haul
  const t0 = at + STOW_DUR; // …and the pull starts after it, never over it
  tl.to(g.legR.pose.rotation, { x: 0.42, duration: dur * 0.2 }, t0); // rear leg planted back
  tl.to(g.legR.shin.pose.rotation, { x: 0.1, duration: dur * 0.2 }, t0);
  tl.to(g.legR.toe.rotation, { x: 0.5, duration: dur * 0.2 }, t0);
  tl.to(g.legL.pose.rotation, { x: -0.3, duration: dur * 0.2 }, t0); // front leg braced
  tl.to(g.legL.shin.pose.rotation, { x: 0.34, duration: dur * 0.2 }, t0);
  tl.to(g.pelvis.position, { y: RIG.hipY - 0.05, duration: dur * 0.2 }, t0);

  reach(tl, g, t0, dur * 0.25, OFF_SIDE, [-0.12, 1.02, 0.34]);
  reach(tl, g, t0, dur * 0.25, WORKING_SIDE, [0.14, 1.12, 0.3]);
  express(tl, g, t0 + dur * 0.2, 0.3, 'strain');

  // §10 — the ratchet, 0.30 / 0.12 / 0.24: three tugs with rising chest involvement, not
  // one long drag. Effort is POSTURE, never face — the only face here is `strain` above.
  tl.to(g.chest.rotation, { x: -0.34, duration: dur * 0.3, ease: 'power2.in' }, t0 + dur * 0.22);
  tl.to(g.chest.rotation, { x: -0.12, duration: dur * 0.12 }, t0 + dur * 0.52);
  tl.to(g.chest.rotation, { x: -0.4, duration: dur * 0.24, ease: 'power2.in' }, t0 + dur * 0.64);
  tl.to(g.pelvis.rotation, { z: 0.06, duration: dur * 0.3, yoyo: true, repeat: 1 }, t0 + dur * 0.25);
  // the hem swings FORWARD under him as he hangs back off the rope — the counterweight
  tl.to(g.hemFlick.rotation, { z: 0.2, duration: dur * 0.3, ease: 'power2.in' }, t0 + dur * 0.22);
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
  // §10 — THE EARS DO HALF THE SHRUG: both droop 0.3 and settle 0.15 s LATE. At montage
  // distance the droop is the whole gag; the palms-up is four pixels.
  tl.to(g.earL.rotation, { z: EAR_Z_L + 0.3, duration: dur * 0.4 }, at + EAR_LAG);
  tl.to(g.earR.rotation, { z: -(EAR_Z_R + 0.3), duration: dur * 0.4 }, at + EAR_LAG);
  tl.to(g.earL.rotation, { z: EAR_Z_L, duration: dur * 0.4 }, at + dur * 0.6 + 0.15);
  tl.to(g.earR.rotation, { z: -EAR_Z_R, duration: dur * 0.4 }, at + dur * 0.6 + 0.15);
}

export function wave(tl: TL, g: Goblin, at: number, dur: number) {
  const side = WORKING_SIDE; // §3.3 — he waves with the hand he works with
  const arm = armOf(g, side);
  tl.to(arm.pose.rotation, { z: -side * 2.5, x: -0.2, duration: dur * 0.25, ease: 'power2.out' }, at);
  tl.to(arm.elbow.rotation, { x: -0.5, duration: dur * 0.25 }, at);
  tl.to(
    arm.wrist.rotation,
    { z: side * 0.5, duration: dur * 0.14, yoyo: true, repeat: 5, ease: 'sine.inOut' },
    at + dur * 0.28,
  );
  weightShift(tl, g, at, dur * 0.3, OFF_SIDE); // he leans off the waving arm
  express(tl, g, at + dur * 0.1, 0.3, 'smug');
  armRest(tl, g, at + dur * 0.78, dur * 0.22, side);
  weightShift(tl, g, at + dur * 0.78, dur * 0.22, side, 0);
}

// §10 — the die, nudged WITH THE PENCIL BUTT, not the mitt. The mitt has no finger (§15.5)
// and a carpenter reaches for the tool he is already holding anyway. The flip to
// butt-forward IS the anticipation — the beat gets no crouch-load, because §11.2 is
// explicit that competence does not telegraph the easy ones. The comedy is still that it
// takes his whole body to be this careful, so the crouch to eye level stays.
export function nudge(tl: TL, g: Goblin, at: number, dur: number, target: Vec3) {
  crouch(tl, g, at, dur * 0.3, 0.4);
  const st = stanceOf(0.4);
  const side = WORKING_SIDE;
  reach(tl, g, at + dur * 0.1, dur * 0.35, side, [target[0] - 0.1, target[1] + 0.04, target[2] - 0.08], st);
  express(tl, g, at, 0.3, 'sly');
  // the flip: 0.30 s of wrist, and it is the only warning the die gets
  tl.to(armOf(g, side).wrist.rotation, { y: side * 2.6, duration: 0.3, ease: 'power2.inOut' }, at + dur * 0.15);
  reach(tl, g, at + dur * 0.5, dur * 0.3, side, target, st); // the tap-through, 0.12 s of it
  // one glance to confirm, then back to work — §11.6, interruptible, not distractible
  look(tl, g, at + dur * 0.62, 0.18, 0, -0.5);
  crouch(tl, g, at + dur * 0.8, dur * 0.2, 0.05);
  tl.to(armOf(g, side).wrist.rotation, { y: 0, duration: 0.24 }, at + dur * 0.8);
  armRest(tl, g, at + dur * 0.82, dur * 0.18, side, crouchChest(0.05));
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
  tl.to(g.hemFlick.rotation, { z: 0, duration: dur, ease: 'power2.inOut' }, at); // it hangs plumb
}

// ---------------------------------------------------------------------------
// §10's five new verbs
//
// Every one of them is authored GSAP keys on transforms. No integrator, no spring, no
// velocity term, no state — so all of them reverse exactly under a backward scrub
// (motion-system §14, timeline.ts:129–139). The only zero-duration writes are `tl.set`s,
// which GSAP reverts on the way back, and which is the idiom the shipped handoff's
// pencil tuck already uses.
// ---------------------------------------------------------------------------

// THE FREEZE — his fingerprint, and the one piece of timing that is the character.
//
// Everyone else in fiction eases out of a motion. The stagehand just STOPS, because
// being caught is a professional hazard he has drilled for, and the comedy is the dead
// stop rather than the turn. So: every swing channel to zero in ≤ 100 ms with NO
// ease-out, then 250 ms of nothing but a blink, and only then the look — neck leading,
// head 0.12 behind, alarm melting to sly, and the ears arriving LAST.
//
// `yaw` is where he ends up looking; 0 is straight down the lens from his working stage.
const FREEZE_STOP = 0.1;
const FREEZE_BEAT = 0.25;
export function freeze(tl: TL, g: Goblin, at: number, dur: number, yaw = 0) {
  // The dead stop. Linear, not power2.out: an ease-out IS the thing being avoided.
  //
  // ONE channel does it. `speed` is the gait's whole amplitude and at 0 every swing term
  // is exactly 0, so this releases the pose instead of fighting it — writing the swing
  // groups directly would be overwritten by applyGait on the next frame anyway, and the
  // swing/pose split is the line puppet.check.ts polices.
  tl.to(g, { speed: 0, duration: FREEZE_STOP, ease: 'none' }, at);
  tl.to(g.hemFlick.rotation, { z: REST.hemFlickZ, duration: FREEZE_STOP, ease: 'none' }, at);
  // …then 250 ms in which the ONLY thing that moves is a blink. That hold is a pose, not
  // a gap: it is what makes the turn afterwards read as a decision.
  const t = at + FREEZE_STOP + FREEZE_BEAT;
  blink(tl, g, at + FREEZE_STOP + 0.06);
  // the turn. alarm first, melting to sly over 0.6 — caught, then unbothered that you saw.
  express(tl, g, t, 0.2, 'alarm');
  look(tl, g, t, Math.max(0.2, dur - FREEZE_STOP - FREEZE_BEAT), yaw);
  express(tl, g, t + 0.25, 0.6, 'sly');
}

// A blink is lids, and lids are eye scale.y — 90 ms down, 140 ms up (§6). Authored, so a
// scrub through it plays it backwards, which is a blink either way.
export function blink(tl: TL, g: Goblin, at: number) {
  for (const eye of [g.face.eyeL, g.face.eyeR]) {
    tl.to(eye.scale, { y: 0.12, duration: 0.09, ease: 'power2.in' }, at);
    tl.to(eye.scale, { y: 1, duration: 0.14, ease: 'power2.out' }, at + 0.09);
  }
}

// THE STOW and THE DRAW (§7). The pencil parks behind the WORKING-side ear, decorating
// the silhouette's apex — never into the satchel, because an invisible tool is a deleted
// premise. A 120 ms tuck, and it is always shown.
//
// `held`/`parked` are the two pencil objects a stage may own — the one in the mitt and
// the one at the ear. The verb works without them: the body does the tuck either way,
// which is what the film's pencil-less goblin needs. When a stage passes both, the swap
// is one `tl.set` each at the top of the tuck, exactly as the shipped hero handoff hides
// its pencil — zero-duration, so it reverses.
export const STOW_DUR = 0.12;
export function stow(
  tl: TL,
  g: Goblin,
  at: number,
  held?: THREE.Object3D | null,
  parked?: THREE.Object3D | null,
) {
  const side = WORKING_SIDE;
  const arm = armOf(g, side);
  // hand up beside the ear: shoulder out and up, elbow closed, wrist rolled over
  tl.to(arm.pose.rotation, { x: -1.9, z: -side * 0.34, duration: STOW_DUR, ease: 'power3.in' }, at);
  tl.to(arm.elbow.rotation, { x: -1.7, duration: STOW_DUR, ease: 'power3.in' }, at);
  tl.to(arm.wrist.rotation, { x: -0.2, duration: STOW_DUR }, at);
  if (held) tl.set(held, { visible: false }, at + STOW_DUR * 0.9);
  if (parked) tl.set(parked, { visible: true }, at + STOW_DUR * 0.9);
  // the ear ticks as the shaft goes behind it — the blade knows it was touched
  tl.to(earOf(g, side).rotation, { z: earBase(side) * 0.72, duration: 0.06 }, at + STOW_DUR * 0.7);
  tl.to(earOf(g, side).rotation, { z: earBase(side), duration: 0.12 }, at + STOW_DUR * 0.7 + 0.06);
  // …and it STOPS there, hand at the ear. The tuck is a transit and the caller's next
  // pose owns where the hand goes next — which is why `bolt` and `haul` both start their
  // own bodies at `at + STOW_DUR` rather than fighting a return tween for the same
  // channels at the same instant.
}

/** The stow, reversed: the hand goes to the ear and comes back holding it. */
export function draw(
  tl: TL,
  g: Goblin,
  at: number,
  held?: THREE.Object3D | null,
  parked?: THREE.Object3D | null,
) {
  const side = WORKING_SIDE;
  const arm = armOf(g, side);
  tl.to(arm.pose.rotation, { x: -1.9, z: -side * 0.34, duration: STOW_DUR, ease: 'power3.in' }, at);
  tl.to(arm.elbow.rotation, { x: -1.7, duration: STOW_DUR, ease: 'power3.in' }, at);
  if (parked) tl.set(parked, { visible: false }, at + STOW_DUR);
  if (held) tl.set(held, { visible: true }, at + STOW_DUR);
  // out and down to the work, and the craft drags the craftsman: the hand leads (§11.3's
  // stated exception) — the chest follows it 60 ms late.
  tl.to(arm.pose.rotation, { x: REST.armR[0], z: REST.armR[2], duration: 0.22, ease: 'power2.out' }, at + STOW_DUR);
  tl.to(arm.elbow.rotation, { x: REST.armRElbowX, duration: 0.22, ease: 'power2.out' }, at + STOW_DUR);
  tl.to(arm.wrist.rotation, { x: REST.armRWristX, duration: 0.22 }, at + STOW_DUR);
  tl.to(g.chest.rotation, { x: REST.chestX, duration: 0.22 }, at + STOW_DUR + 0.06);
}

// SCRIBE — drawing roads onto the map, and THE HERO POSE: §10 is explicit that the rest
// state IS this action paused, which is why it takes REST's own arm as its centre rather
// than a second set of numbers.
//
// 2.2 Hz of wrist, the head tracking the tip 90 ms behind, and the working ear ticking at
// each stroke end. The oscillation is a yoyo-repeat on one authored tween: GSAP owns the
// phase off the playhead, so a backward scrub draws the same strokes in reverse.
export function scribe(tl: TL, g: Goblin, at: number, dur: number, target: Vec3) {
  const side = WORKING_SIDE;
  const arm = armOf(g, side);
  const plant = plantFor(target[1], side);
  crouch(tl, g, at, dur * 0.22, plant.crouch);
  reach(tl, g, at + dur * 0.08, dur * 0.28, side, target, stanceOf(plant.crouch));
  express(tl, g, at, 0.25, 'neutral');
  // 2.2 Hz: a half-stroke is 1/4.4 s, and the yoyo makes each pair one there-and-back
  const half = 1 / 4.4;
  const strokes = Math.max(2, Math.round((dur * 0.6) / (half * 2)));
  tl.to(
    arm.wrist.rotation,
    { z: 0.4, duration: half, yoyo: true, repeat: strokes * 2 - 1, ease: 'sine.inOut' },
    at + dur * 0.3,
  );
  tl.set(arm.wrist.rotation, { z: 0 }, at + dur * 0.3 + strokes * 2 * half);
  // the head tracks the tip, 90 ms behind the hand
  look(tl, g, at + dur * 0.3 + 0.09, dur * 0.3, 0, -0.7);
  // the ear ticks at each stroke END — 60 ms, and it is what makes the work read at 36 px
  for (let i = 1; i <= strokes; i++) {
    const t = at + dur * 0.3 + i * 2 * half;
    tl.to(earOf(g, side).rotation, { z: earBase(side) * 0.86, duration: 0.03 }, t);
    tl.to(earOf(g, side).rotation, { z: earBase(side), duration: 0.03 }, t + 0.03);
  }
}

// POCKET (§7) — one reach into the front skirt at his own hip, on the working side. It is
// a shorter, more legible action than a satchel dig, which is exactly why the d20 lives
// here. The wrist SUPINATES on the way out so the die shows: without that he pulls his
// hand out of his pocket and the film's last prop never appears.
export function pocket(tl: TL, g: Goblin, at: number, inDur = 0.35, outDur = 0.25) {
  const side = WORKING_SIDE;
  const arm = armOf(g, side);
  // POCKET is in the CHEST's frame and the pocket rides the chest, so it is solved with
  // chestX 0 against the chest origin — the fold must not be counted twice.
  const target: Vec3 = [POCKET.x, RIG.hipY + RIG.chestY + POCKET.y, POCKET.z];
  reach(tl, g, at, inDur, side, target, { chestX: 0 });
  look(tl, g, at + inDur * 0.3, inDur * 0.6, 0, -0.4); // he looks at what he is doing
  tl.to(arm.wrist.rotation, { y: side * 1.5, x: -0.1, duration: outDur, ease: 'power2.out' }, at + inDur);
  tl.to(arm.pose.rotation, { x: -0.95, z: -side * 0.2, duration: outDur, ease: 'power2.out' }, at + inDur);
  tl.to(arm.elbow.rotation, { x: -1.1, duration: outDur, ease: 'power2.out' }, at + inDur);
}

// THROW (§10) — the ONE big anticipation he does all film, which is the only reason it
// lands. Everything else he does opens with weight and no windup; this opens with a
// 0.30 crouch-load, unwinds `power3.in` through chest and arm, releases at 55°, and then
// HE WATCHES IT. He is audience-aware by script (story.md:19, :47); pretending otherwise
// fought the film.
//
// Named `throwDie` because `throw` is a reserved word.
export function throwDie(tl: TL, g: Goblin, at: number, dur: number) {
  const side = WORKING_SIDE;
  const arm = armOf(g, side);
  const anticip = 0.28;
  const core = 0.14;
  // ANTICIPATION — weight first, exactly as every other action, only bigger and visible
  weightShift(tl, g, at, anticip, OFF_SIDE, 0.9);
  crouch(tl, g, at, anticip, 0.3, 'power2.inOut');
  tl.to(g.chest.rotation, { x: 0.5, duration: anticip, ease: 'power2.inOut' }, at);
  tl.to(arm.pose.rotation, { x: 0.7, z: side * 0.5, duration: anticip, ease: 'power2.inOut' }, at);
  tl.to(arm.elbow.rotation, { x: -1.5, duration: anticip, ease: 'power2.inOut' }, at);
  express(tl, g, at, 0.2, 'smug');
  // CORE — the unwind. power3.in: everything happens at the end, which is the release.
  const rel = at + anticip;
  tl.to(g.chest.rotation, { x: -0.35, duration: core, ease: 'power3.in' }, rel);
  tl.to(arm.pose.rotation, { x: -2.05, z: -side * 0.12, duration: core, ease: 'power3.in' }, rel); // ≈55° up
  tl.to(arm.elbow.rotation, { x: -0.15, duration: core, ease: 'power3.in' }, rel);
  crouch(tl, g, rel, core, 0.02, 'power3.in');
  // SETTLE — wrist follow-through, both ears trail, and the hem swings out behind him
  const settleT = rel + core;
  tl.to(arm.wrist.rotation, { x: -0.9, duration: 0.32, ease: 'power2.out' }, settleT);
  tl.to(g.earL.rotation, { z: EAR_Z_L + 0.34, duration: 0.14 }, settleT);
  tl.to(g.earR.rotation, { z: -(EAR_Z_R + 0.34), duration: 0.14 }, settleT);
  tl.to(g.earL.rotation, { z: EAR_Z_L, duration: 0.32, ease: EAR_OVERSHOOT }, settleT + 0.14);
  tl.to(g.earR.rotation, { z: -EAR_Z_R, duration: 0.32, ease: EAR_OVERSHOOT }, settleT + 0.14);
  tl.to(g.hemFlick.rotation, { z: -0.34, duration: 0.18, ease: 'power2.out' }, rel);
  tl.to(g.hemFlick.rotation, { z: REST.hemFlickZ, duration: 0.5 }, settleT + 0.18);
  // …and then he watches it go up. The head follows the arc; the pupils lead the head.
  look(tl, g, settleT + 0.1, Math.max(0.4, dur - anticip - core - 0.1), 0, 0.85);
  tl.to(g.pupils.position, { y: 0.006, duration: 0.18 }, settleT);
  tl.to(g.pupils.position, { y: 0, duration: 0.4 }, settleT + 0.5);
  express(tl, g, settleT + 0.35, 0.4, 'smug');
}
