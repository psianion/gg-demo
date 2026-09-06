import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildWorld, RIG, EAR_Z_L, EAR_Z_R } from '../src/film/world.ts';
import { buildGoblin } from '../src/film/stages/goblin.ts';
import {
  applyGait,
  reachSolve,
  crouchPose,
  crouchChest,
  plantFor,
  stanceOf,
  EXPRESSIONS,
} from '../src/film/actions.ts';

// The puppet's contract, asserted. The milestone this file ships with exists because the
// gait wrote leg and torso channels absolutely on every frame, so no beat could pose the
// body. These checks make that class of bug unrepeatable rather than fixed once.

const g = buildWorld(buildGoblin()).goblin;
// he starts the film hidden behind the ambush rock; measure the rig, not the staging
g.root.position.set(0, 0, 0);
g.root.rotation.set(0, 0, 0);

const world = (o: THREE.Object3D) => {
  g.root.updateMatrixWorld(true);
  return o.getWorldPosition(new THREE.Vector3());
};

// ---- 1. ownership: no channel has two writers -----------------------------
// The gait may only touch these. Everything else belongs to the beat sheet.
const gaitOwned = new Set<THREE.Object3D>([
  g.bob,
  g.legL.swing,
  g.legR.swing,
  g.legL.shin.swing,
  g.legR.shin.swing,
  g.armL.swing,
  g.armR.swing,
]);
const timelineOwned: THREE.Object3D[] = [
  g.root, g.pelvis, g.chest, g.neck, g.head, g.earL, g.earR,
  g.legL.pose, g.legR.pose, g.legL.shin.pose, g.legR.shin.pose,
  g.legL.foot, g.legR.foot, g.legL.toe, g.legR.toe,
  g.armL.pose, g.armR.pose, g.armL.elbow, g.armR.elbow, g.armL.wrist, g.armR.wrist,
];
for (const o of timelineOwned) assert.ok(!gaitOwned.has(o), 'a joint is claimed by both owners');
assert.equal(new Set(timelineOwned).size, timelineOwned.length, 'a joint is listed twice');

// every gait-owned group is reachable from the root, i.e. it is really in the rig
for (const o of gaitOwned) {
  let p: THREE.Object3D | null = o;
  while (p && p !== g.root) p = p.parent;
  assert.equal(p, g.root, 'a gait group is not attached to the rig');
}

// ---- 2. the hierarchy the milestone is about ------------------------------
const descends = (child: THREE.Object3D, ancestor: THREE.Object3D) => {
  let p: THREE.Object3D | null = child.parent;
  while (p && p !== ancestor) p = p.parent;
  return p === ancestor;
};
// head and arms ride the chest, or a lean tears him apart
assert.ok(descends(g.head, g.chest), 'head must ride the chest');
assert.ok(descends(g.armL.pose, g.chest), 'arms must ride the chest');
assert.ok(descends(g.armR.pose, g.chest), 'arms must ride the chest');
// legs ride the pelvis, but NOT the bob — the breath must not lift his feet
assert.ok(descends(g.legL.pose, g.pelvis), 'legs must ride the pelvis');
assert.ok(!descends(g.legL.pose, g.bob), 'the bob must not carry the legs');
assert.ok(descends(g.chest, g.bob), 'the bob must carry the upper body');

// ---- 3. golden rest pose: the reparent moved nothing on screen -------------
// Values measured from the rig before head, arms and legs were re-hung. If a limb length
// or an offset drifts, this is what catches it.
const near = (got: THREE.Vector3, want: [number, number, number], what: string) => {
  const w = new THREE.Vector3(...want);
  assert.ok(got.distanceTo(w) < 1e-6, `${what} moved: ${got.toArray()} vs ${want}`);
};
// Golden pose re-measured 2026-08-18 for the art-bible rig retune (real-goblin
// proportions: big head, wiry short limbs).
near(world(g.head), [0, 0.59, 0], 'head');
near(world(g.armL.wrist), [-0.115, 0.205, 0], 'left wrist');
near(world(g.armR.wrist), [0.115, 0.205, 0], 'right wrist');
near(world(g.legL.foot), [-0.055, 0.02, 0], 'left ankle');
near(world(g.legR.foot), [0.055, 0.02, 0], 'right ankle');

// ---- 4. release: at speed 0 the gait contributes exactly nothing -----------
// This is the milestone in one assertion. Pose the body, run the frame maths at speed 0,
// and the pose must survive untouched.
const gait = (sp: number, gobT: number) => {
  g.speed = sp;
  applyGait(g, gobT);
};

const crouched = crouchPose(0.6);
g.pelvis.position.y = crouched.hipY;
for (const leg of [g.legL, g.legR]) {
  leg.pose.rotation.x = crouched.thigh;
  leg.shin.pose.rotation.x = crouched.knee;
  leg.foot.rotation.x = crouched.ankle;
}
for (let t = 0; t < 4; t += 0.37) {
  gait(0, t);
  for (const s of [g.legL.swing, g.legR.swing, g.legL.shin.swing, g.legR.shin.swing, g.armL.swing, g.armR.swing]) {
    assert.equal(Math.abs(s.rotation.x), 0, 'gait leaks into a pose at speed 0');
  }
}
// the authored crouch is still exactly what the beat asked for
assert.equal(g.legL.pose.rotation.x, crouched.thigh);
assert.equal(g.pelvis.position.y, crouched.hipY);

// ---- 5. he never fully dies: breath runs on the goblin clock --------------
// The freeze grammar's whole claim is that he keeps moving when the world stops. At
// speed 0 the gait is silent, so the breath is the only thing left to carry it.
const heights = new Set<number>();
for (let t = 0; t < 4; t += 0.31) {
  gait(0, t);
  heights.add(Number(g.bob.position.y.toFixed(6)));
}
assert.ok(heights.size > 3, 'he holds perfectly still through a freeze');
assert.ok(Math.max(...heights) > 0.004, 'the breath is too small to read');
assert.ok(Math.max(...heights) < 0.02, 'the breath is big enough to break the freeze');

// ---- 6. the crouch keeps his feet on the floor -----------------------------
// A crouch that slides the feet is a step, not a crouch.
for (const amount of [0, 0.25, 0.5, 0.75, 1]) {
  const p = crouchPose(amount);
  g.pelvis.position.y = p.hipY;
  for (const leg of [g.legL, g.legR]) {
    leg.pose.rotation.x = p.thigh;
    leg.shin.pose.rotation.x = p.knee;
    leg.foot.rotation.x = p.ankle;
  }
  gait(0, 0);
  const ankle = world(g.legR.foot);
  assert.ok(Math.abs(ankle.y - RIG.ankle) < 1e-6, `crouch ${amount} lifts the ankle to ${ankle.y}`);
  assert.ok(Math.abs(ankle.z) < 0.012, `crouch ${amount} slides the foot to z=${ankle.z}`);
}

// ---- 7. reach: the hand lands ON the prop ----------------------------------
// Thirteen reaches used to be thirteen hand-found angles. These assert the solve puts the
// hand where the beat said, at prop heights taken from the actual C2 run.
const restPose = crouchPose(0);
g.pelvis.position.y = restPose.hipY;
for (const leg of [g.legL, g.legR]) {
  leg.pose.rotation.x = 0;
  leg.shin.pose.rotation.x = 0;
  leg.foot.rotation.x = 0;
}

// Prop heights taken from the actual C2 run and montage: the fire and the mushrooms at
// his feet, the chest lid and the sign board at his chest, the lantern over his head.
// the hand centre, which is what actually touches a prop — it hangs just past the wrist
const handPoint = () => {
  g.root.updateMatrixWorld(true);
  return g.armR.wrist.localToWorld(new THREE.Vector3(0, -RIG.hand, 0));
};

const shoulderAt = () => world(g.armR.pose);

const pose = (amount: number) => {
  g.bob.position.y = 0;
  g.bob.rotation.x = 0;
  const p = crouchPose(amount);
  g.pelvis.position.y = p.hipY;
  g.chest.rotation.x = crouchChest(amount);
  for (const leg of [g.legL, g.legR]) {
    leg.pose.rotation.x = p.thigh;
    leg.shin.pose.rotation.x = p.knee;
    leg.foot.rotation.x = p.ankle;
  }
};

for (const targetY of [0.14, 0.35, 0.4, 0.62, 0.85, 1.1, 1.62]) {
  const plant = plantFor(targetY);
  const target: [number, number, number] = [plant.lateral, targetY, plant.standoff];
  pose(plant.crouch);
  const s = reachSolve(1, target, stanceOf(plant.crouch));
  g.armR.pose.rotation.set(s.shoulderX, s.shoulderY, s.shoulderZ);
  g.armR.elbow.rotation.x = s.elbowX;
  const hand = handPoint();
  const want = new THREE.Vector3(...target);
  // out-of-range heights stretch instead of landing; everything else has to make contact
  const reachable = shoulderAt().distanceTo(want) <= RIG.upper + RIG.fore + RIG.hand;
  if (reachable) {
    assert.ok(
      hand.distanceTo(want) < 1e-3,
      `reach missed a prop at y=${targetY} by ${hand.distanceTo(want).toFixed(4)}`,
    );
  }
  // and he is not standing inside the thing he is touching
  assert.ok(plant.standoff > 0.05, `he stands inside a prop at y=${targetY}`);

  // The hand landing on the prop is not enough: an arm can reach a point overhead by
  // going up the front or by swinging back through his own spine, and both put the hand
  // in the same place. A shoulder has a front. The elbow has to stay on it.
  const elbow = world(g.armR.elbow);
  const shoulder = world(g.armR.pose);
  assert.ok(
    elbow.z > shoulder.z - 0.02,
    `the arm routes behind him to reach y=${targetY} (elbow z ${elbow.z.toFixed(3)} vs shoulder ${shoulder.z.toFixed(3)})`,
  );

  // and a reach is only a reach if it is visibly out in front of him — threshold
  // scaled 2026-08-18 with the art-bible rig's shorter arms (0.225 vs 0.295 reach)
  assert.ok(plant.standoff >= 0.14, `the reach at y=${targetY} is too tucked in to read`);
}

// Out of range stretches to full extension rather than snapping to a shorter pose: the
// lantern, the raven branch and the hanging sign are all meant to read as a stretch.
pose(0);
const far = reachSolve(1, [0, 1.6, 0.2]);
g.armR.pose.rotation.set(far.shoulderX, far.shoulderY, far.shoulderZ);
g.armR.elbow.rotation.x = far.elbowX;
assert.ok(Math.abs(far.elbowX) < 0.05, 'an out-of-range reach should straighten the arm');
const reachLen = handPoint().distanceTo(world(g.armR.pose));
assert.ok(Math.abs(reachLen - (RIG.upper + RIG.fore + RIG.hand)) < 1e-3, 'full extension is not full');

// ---- 8. the breath does not walk a planted hand off its prop ---------------
// The reach is solved against a still body, and then the breath tilts the chest under it.
// That coupling is real and cannot be zero without killing the breath, so it is bounded
// instead: at his scale a centimetre of drift is under 1% of his height and reads as a
// hand resting on something rather than welded to it.
pose(0);
const plant = plantFor(0.35);
const solved = reachSolve(1, [plant.lateral, 0.35, plant.standoff], stanceOf(plant.crouch));
g.armR.pose.rotation.set(solved.shoulderX, solved.shoulderY, solved.shoulderZ);
g.armR.elbow.rotation.x = solved.elbowX;
const planted = handPoint();

// unplanted, the breath moves his whole body — including the hand
let free = 0;
g.planted = 0;
for (let t = 0; t < 4; t += 0.19) {
  gait(0, t);
  free = Math.max(free, planted.distanceTo(handPoint()));
}
assert.ok(free > 0.004, 'the breath is not moving him at all');

// planted, it must not: a hand resting on a prop stays on the prop
let drift = 0;
g.planted = 1;
for (let t = 0; t < 4; t += 0.19) {
  gait(0, t);
  drift = Math.max(drift, planted.distanceTo(handPoint()));
}
assert.ok(drift < 1e-9, `the breath drags a planted hand ${drift.toFixed(4)} off its prop`);
g.planted = 0;

// ---- 9. the expression set is complete and in range ------------------------
//
// The old bound was a symmetric ±0.6, written when both ear pivots sat on the same 1.3
// rad base. They do not any more (goblin design §2: EAR_Z_R 0.55 / EAR_Z_L 0.85), so the
// bound is DERIVED from those two numbers rather than re-eyeballed:
//
//   CEILING (EAR_Z_R + EAR_Z_L) / 2 = 0.70. `express` closes both blades toward vertical
//     by the same delta, so the right blade stays the higher tip while
//     |EAR_Z_R − ear| < |EAR_Z_L − ear| — true exactly up to the midpoint. At it the two
//     tips are level; past it the LEFT blade becomes the apex, which is the mushroom read
//     gob.check's G2 exists to kill. `alarm` sits at 0.62, deliberately close: §9 books
//     the right blade going past vertical there, and that is still inside this rule.
//   FLOOR −0.30. Further back and the pair re-opens toward the retired 1.3 rad cap.
const EAR_CEIL = (EAR_Z_R + EAR_Z_L) / 2;
for (const name of ['neutral', 'sly', 'flat', 'strain', 'smug', 'alarm']) {
  const e = EXPRESSIONS[name];
  assert.ok(e, `expression ${name} is missing`);
  assert.ok(
    e.ear < EAR_CEIL,
    `${name} ear ${e.ear} lifts past ${EAR_CEIL.toFixed(2)} — the LEFT blade becomes the apex`,
  );
  assert.ok(e.ear >= -0.3, `${name} ear ${e.ear} sweeps back toward the retired 1.3 rad cap`);
  assert.ok(e.eye > 0.5 && e.eye < 1.6, `${name} eye scale is out of range`);
}

console.log('puppet.check: ok');
