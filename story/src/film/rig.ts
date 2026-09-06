import * as THREE from 'three';

// One channel, one owner. A beat poses `*.pose` groups and the named joints below; the
// gait writes ONLY into `*.swing` groups and `bob`, at an amplitude scaled by `speed`.
// At speed 0 the gait contributes exactly zero, so an authored pose is released rather
// than overridden — which is the whole reason this rig exists. `scripts/puppet.check.ts`
// asserts both halves of that sentence.
export interface Swung {
  pose: THREE.Group; // timeline
  swing: THREE.Group; // gait, additive
}

export interface Arm extends Swung {
  elbow: THREE.Group; // timeline — the joint that lands a hand ON a thing
  wrist: THREE.Group; // timeline — grip angle
}

export interface Leg extends Swung {
  shin: Swung;
  foot: THREE.Group; // timeline — ankle; the toe pivot lives inside it
  toe: THREE.Group;
}

// Expression channels. Geometry never changes; these are the parts an expression moves.
export interface Face {
  browL: THREE.Object3D;
  browR: THREE.Object3D;
  eyeL: THREE.Object3D;
  eyeR: THREE.Object3D;
  mouth: THREE.Object3D;
}

// Bone lengths, in the goblin's own units — the numbers `actions.ts` solves reaches and
// crouches against, so a limb that changes length here cannot silently stop reaching the
// props.
export interface Rig {
  hipY: number; // pelvis height at rest
  hipX: number; // half the hip width
  chestY: number; // pelvis → the waist the chest folds at
  shoulderY: number; // waist → shoulder
  shoulderX: number; // half the shoulder width
  shoulderZ: number; // waist → shoulder, fore and aft; 0 when they sit in the waist's plane
  neckY: number; // shoulder → head centre
  thigh: number;
  shin: number;
  ankle: number; // ankle → sole
  upper: number;
  fore: number;
  hand: number; // wrist → hand centre
}

export interface Goblin {
  root: THREE.Group; // position/rotation tweened by timeline
  pelvis: THREE.Group; // crouch (position.y) + weight shift (rotation.z)
  bob: THREE.Group; // gait bob + idle breath — carries the upper body only
  chest: THREE.Group; // hunch (rotation.x) ↔ straighten; counter-rotation (rotation.z)
  neck: THREE.Group; // carries the head mass; a look starts here
  head: THREE.Group; // and finishes here
  earL: THREE.Group; // pivots at the skull, so an ear swings from its base
  earR: THREE.Group;
  face: Face;
  armL: Arm;
  armR: Arm;
  legL: Leg;
  legR: Leg;
  // §9's three additions, all single groups and all driven by AUTHORED keys only —
  // there is no integrator, spring or velocity term anywhere in his motion.
  hemFlick: THREE.Group; // the cloth point at the hem rear: the tail of the line of action
  pupils: THREE.Group; // both slit pupils, offset ±0.006 u — saccade + look-at-viewer
  hood: THREE.Group; // the cowl's ±0.02 y slide: the BROW channel (§6)
  shells: THREE.Mesh[]; // the two px-solved ink shells — see setGoblinRim (§5.12)
  speed: number; // 0..1 gait amplitude, tweened by timeline
  // 0..1, tweened by a reach: a hand resting on a prop must not ride the breath up and
  // down with the rest of him. Same shape as `speed` — one number the frame loop reads.
  planted: number;
}

export interface World {
  root: THREE.Group; // add to scene
  look: THREE.Vector3; // camera lookAt target, tweened by timeline
  // THE KEY'S COLOUR, per chapter family (client ruling 2026-09-05). Film.tsx assigns
  // this object onto the key light BY IDENTITY, exactly the way rig.curtain reaches
  // every material, so the beat sheet can step it at a chapter boundary with the same
  // paired `tl.set` grammar the chapter sky already uses. Never a ramp: a boundary is
  // a gear change and a hard cut there is correct.
  keyColor: THREE.Color;
  // THE CHAPTER AIR, the wash at the top of frame. Same grammar as keyColor above: the
  // timeline steps or ramps this object BY IDENTITY at each boundary (`sky`/`skyCut`)
  // and Film.tsx reads it every frame into the CSS `--sky` token. It is not fog — fog
  // is pinned to paper, because distance is the page (art bible C6).
  air: THREE.Color;
  timeScale: number; // world clock scale (freeze = 0)
  t: number; // world clock (useFrame advances)
  gobT: number; // goblin clock (useFrame advances)
  goblin: Goblin;

  // Per-chapter sets, gated visible/invisible from the timeline. Every one of these used
  // to be in frame for all 66 seconds of the film.
  camp: THREE.Group; // C1's staging, minus the treeline and minus the goblin
  theatreSet: THREE.Group;
  tavernSet: THREE.Group;
  montageSet: THREE.Group;
  cliffSet: THREE.Group; // C6 + C7; board and die2 are gated again inside it

  // chapter 1 — ambush
  ambushFlames: THREE.Group; // campfire flames, userData.lit starts at 1
  adventurers: THREE.Group[]; // 3 figures
  treeline: THREE.Group; // C1 backdrop pines — C2's last beat paints these

  // chapter 2 — lighting the world (props in +x order)
  fire2Flames: THREE.Group; // userData.lit starts at 0
  fire2Rays: THREE.Group; // scale starts 0
  lanternPost: THREE.Group; // post, arm and housing
  lanternRays: THREE.Group; // scale starts 0
  cave: THREE.Group; // the rock cluster and the mouth the door opens onto
  caveDoor: THREE.Group; // pivot at hinge; rotation.y 0 = closed
  chest: THREE.Group; // body, lid and coins together
  chestLid: THREE.Group; // pivot at back edge; rotation.x 0 = closed
  chestCoins: THREE.Group; // scale starts 0
  ravens: THREE.Group[]; // 3, perched on a branch
  mushrooms: THREE.Group[]; // 3, scale start 0
  signPost: THREE.Group; // post, cap, base and the back board
  signBoard: THREE.Group; // rotation.z starts at 0.5 (crooked)
  tufts: THREE.Group[]; // 5 grass tufts on the far verge of the path
  pathForestFront: THREE.Group; // C2 forest, front row both sides
  pathForestMid: THREE.Group; // C2 forest, far-side mid row, reduced scale/contrast
  pathClouds: THREE.Group[]; // C2 sky plates along the run — drift along x in Film.tsx

  // chapter 3 — theatre set
  stageDisc: THREE.Group; // giant disc; forest half + snowy-mountain half (mountain at +PI)
  rope: THREE.Group; // hangs at disc edge

  // chapter 4 — tavern / dice
  die: THREE.Group; // OUTER wobble wrapper — useFrame writes its rotation.z
  dieInner: THREE.Group; // icosahedron inside; timeline tweens THIS position/rotation
  dieWobble: number; // 0..1, tweened by timeline (frozen mid-wobble)
  dieTipAngle: number; // rotation about dieInner's local X that rolls 1 onto 20
  nudgeFinger: THREE.Group; // the only part of him the table scene shows

  // chapter 5 — montage vignettes (index 0..5, world positions below)
  roadLine: THREE.Group; // scale.x starts 0 (road being drawn)
  monster: THREE.Group; // scale starts 0
  tavernSign: THREE.Group; // starts 1.2 above its bracket; drops into place
  trees5: THREE.Group[]; // 3, scale start 0
  chest5Lid: THREE.Group; // like chestLid
  chest5Coins: THREE.Group; // scale starts 0
  candleRays: THREE.Group; // scale starts 0

  // chapter 6 — cliff + miniature world
  miniWorld: THREE.Group[]; // every miniature (houses, trees, mountain) — flatten tweens scale.y
  cliff: THREE.Group;
  remains: THREE.Group; // battle-remains dressing at the rim/base — visible by default, C6 hides it
  tended: THREE.Group; // C6's "fixed" dressing — cairn + 3 mushrooms — hidden by default
  party: THREE.Object3D[]; // the 3 ambush adventurers, repositionable for the cliff-front restage

  // restaged opening — projectile kit, hidden by default, timeline-driven
  bolt: THREE.Group; // wizard's bolt: bright stroke + tip flare
  arrows2: THREE.Group[]; // 2 thrown arrows
  impacts: THREE.Group[]; // 2-3 ray bursts at plausible impact points, scale starts 0

  // chapter 7 — the throw
  die2: THREE.Group; // second d20, starts hidden (scale 0) at the cliff
  board: THREE.Group; // pencil game board (grid), materials transparent, opacity starts 0
}

// The body's lengths, authored once here so the solvers and the geometry cannot drift.
// Retuned 2026-08-18 to the art-bible sheet: a real goblin's proportions — head + hood
// nearly half of him, wiry short limbs, oversized hands and feet. The reach and crouch
// solvers read these numbers, so they follow the new body automatically.
export const RIG: Rig = {
  hipY: 0.2, // pelvis height at rest — short legs
  hipX: 0.055, // half the hip width
  chestY: 0.05, // pelvis → the waist the chest folds at
  shoulderY: 0.175, // waist → shoulder
  shoulderX: 0.115, // half the shoulder width
  shoulderZ: 0, // the drawn shoulders sit in the waist's plane
  neckY: 0.165, // shoulder → head centre — huge head sunk into the collar, no neck
  thigh: 0.09,
  shin: 0.09,
  ankle: 0.02, // ankle → sole
  upper: 0.11,
  fore: 0.11,
  hand: 0.005, // wrist → hand centre
};

// Goblin rig, ~0.9 units tall, origin at feet, faces +z by default.
//
// The skeleton is argued from the character, not from how many pixels a joint occupies:
// a D&D goblin is Small, Dexterity-primary and hunched, with a head a third of his own
// height and a racial kit of Nimble Escape and Tinker's Lore. So the head needs a neck
// to swing that mass, the hunch needs a pelvis/chest split to be a state rather than a
// shape, the escape needs knees and ankles to compress and spring, and the thirteen
// authored reaches need elbows — an elbow is what separates working on a thing from
// touching it. See `docs/puppet-spec.md`.
//
// Every joint pivot here is load-bearing. Detail hangs off these groups; none of it
// moves them.
// Exported for the v2 stages (P4 hero and onward): the sculpted design is LOCKED —
// stages STAGE this build (pose, scale, placement), they never redesign it.
// §3.3 — HANDEDNESS, pinned once and forever. His RIGHT (+x in his own frame, the
// side buildArm/buildLeg already call R) is the working side: the pencil hand, the
// tall clean apex ear, the patch pocket, the stow. It is not a per-beat decision.
export const WORKING_SIDE = 1;

// §2 / §9 — the ear base angles, UNEQUAL by construction. The right blade sweeps only
// 0.55 rad off vertical and is the highest point of the figure; the left sweeps 0.85
// and carries the earring. The shipped symmetric base of 1.3 rad (≈75° both sides) laid
// both blades out sideways and made the mushroom cap the diagnosis measured.
// ONE home: actions.ts's express() writes ear rotation ABSOLUTELY, so the rig's base
// angles and the expression library must read the same two numbers or every expression
// re-sweeps the ears (gate G8).
export const EAR_Z_R = 0.55;
export const EAR_Z_L = 0.85;

// §9.1 — THE REST POSE. ONE TABLE, THREE READERS.
//
// These numbers were inline joint literals in `stageGoblin`, which meant the hero
// staging, the reduced-motion still and the poster bake each held their own private
// copy of the pose and would fork the first time anyone tuned one of them. All three
// now call `applyPose(goblin, REST)` and contain no joint literals at all (gate G10).
//
// It is the WORKING STOOP: bent to the work, head lifted against the fold, the working
// glove out of the cloak at the next stroke. §11.2's reduced-motion still and the poster
// are the same frame because they are literally the same table.
//
// Derived, never re-typed: the ear bases are EAR_Z_R/EAR_Z_L, the resting left arm is
// the `armRest` law (−chestX), and the weight shift is `weightShift(WORKING_SIDE, 0.55)`
// solved once here rather than tweened — 58/42, loaded on the working side (§3.2).
// weightShift's two amplitudes live here rather than in actions.ts, because REST is a
// weight-shifted pose and actions.ts already imports this module (never the reverse).
export const WEIGHT_PELVIS_Z = 0.09;
export const WEIGHT_CHEST_Z = 0.13;
const W = 0.55; // §3.2 — 58/42
export const REST = {
  rootY: 1.6, // faces his work (+x) — §3.4, nothing rotates
  pelvisY: RIG.hipY - 0.012, // settled, not crouched
  // §3.2 and §9.1 both state the SIGNED values −0.0495 / +0.0715, while §3.2's prose
  // names the call as `weightShift(WORKING_SIDE, 0.55)`, which produces the opposite
  // pair. The two signed tables agree, so the numbers win and the call sign is the
  // typo: this is `weightShift(-WORKING_SIDE, 0.55)` solved once, not tweened.
  pelvisZ: -WORKING_SIDE * WEIGHT_PELVIS_Z * W, // −0.0495
  chestX: 0.34, // the hunch, one step past HUNCH
  chestZ: WORKING_SIDE * WEIGHT_CHEST_Z * W, // +0.0715 — the counter-tip
  neckX: 0.16, // distributes the fold
  neckY: 0.16, // the head-turn (§3.4)
  headX: -0.06, // the head LIFTS against the fold — this reversal is the line of action
  headY: 0.38, // face plane into the three-quarter
  earR: -EAR_Z_R, // the apex blade
  earL: EAR_Z_L, // the swept blade
  legRX: -0.16, // working foot forward
  legLX: 0.1, // back leg trailing
  legLToeX: 0.18, // back heel rolled onto its toe
  armR: [-1.15, 0, -0.3] as const, // posed, not reach-solved: a solved reach at this
  armRElbowX: -0.1, //   azimuth foreshortens the whole arm away from the lens
  armRWristX: -0.3,
  armLElbowX: -0.18,
  hemFlickZ: -0.1, // trailing at rest — the tail of the line of action
} as const;

export type Pose = typeof REST;

// §7 — THE d20's HOME. A patch pocket on the front skirt, WORKING side, in the CHEST's
// own frame (it is a child of the chest, so it rides the hunch). `actions.ts`'s pocket()
// is the only reader left.
//
// STALE AGAINST THE REBUILT FIGURE, and deliberately not moved here. It used to be read
// twice — by this triple's own geometry and by the reach — so the hand could not miss.
// That geometry is gone with the old builder, and stages/goblin.ts carries the reference's
// own answer instead: the satchel is struck and a BELT POUCH sits on the working hip
// "clearest from behind", centred near (+0.106, 0.25, −0.089) in his own frame. Height and
// side still agree; the DEPTH does not — this reaches 0.124 in FRONT of the waist and the
// drawn pouch hangs 0.089 behind it. So t58.25's draw mimes over blank cloth.
//
// It is left alone because moving it is a design call, not a wiring one: §7 chose the
// front skirt precisely so the draw reads to a lens in front of him, the beat is off
// camera by t58.7 by the timeline's own note, and no die is ever parented to the mitt —
// world.die2 scales up at the cliff on its own. If the pouch is to become the home, it is
// these two numbers and nothing else: x 0.082 → 0.106, z 0.124 → −0.089.
export const POCKET = { x: WORKING_SIDE * 0.082, y: -0.012, z: 0.124 } as const;

/**
 * Write a pose table onto the puppet (§9.1). The ONLY way any surface stages him.
 *
 * `armL.pose` is not in the table on purpose: an arm at rest hangs plumb, which means
 * its shoulder must counter-rotate by exactly the chest's fold or he carries an
 * invisible tray (`actions.ts` armRest). Deriving it here is what keeps that law true
 * for every future value of `chestX`.
 *
 * `hemFlick` swings on its LOCAL z: the group carries `rotation.y = π/2` to turn the
 * authored profile's +x into his −z, and under three's XYZ Euler order the z term
 * applies first, in the flick's own plane. §9.1's table names that channel `.x`; the
 * built geometry settles it, and this is the one place the two are reconciled.
 */
export function applyPose(g: Goblin, p: Pose = REST): void {
  g.root.rotation.y = p.rootY;
  g.pelvis.position.y = p.pelvisY;
  g.pelvis.rotation.z = p.pelvisZ;
  g.chest.rotation.x = p.chestX;
  g.chest.rotation.z = p.chestZ;
  g.neck.rotation.x = p.neckX;
  g.neck.rotation.y = p.neckY;
  g.head.rotation.x = p.headX;
  g.head.rotation.y = p.headY;
  g.earR.rotation.z = p.earR;
  g.earL.rotation.z = p.earL;
  g.legR.pose.rotation.x = p.legRX;
  g.legL.pose.rotation.x = p.legLX;
  g.legL.toe.rotation.x = p.legLToeX;
  g.armR.pose.rotation.set(p.armR[0], p.armR[1], p.armR[2]);
  g.armR.elbow.rotation.x = p.armRElbowX;
  g.armR.wrist.rotation.x = p.armRWristX;
  g.armL.pose.rotation.set(-p.chestX, 0, 0);
  g.armL.elbow.rotation.x = p.armLElbowX;
  g.hemFlick.rotation.z = p.hemFlickZ;
}

// §5.12 — THE DRAWN LINE IS A SCREEN-SPACE QUANTITY.
//
// The contour is a CSS-px quantity, not a world one: solved per viewport as
//
//   rimUnits = GOB_RIM_PX / (pxPerUnit(width, height) * rootScale)
//
// `setGoblinRim` takes the solved number, and it is how a STAGE seeds the line —
// hero.ts's framing effect, posterBake and gobMeasure all call it where
// setPencilResolution already runs. The figure itself (stages/goblin.ts) then re-solves
// its own shell per frame from the live camera in `onBeforeRender`, which is the solve
// that survives a moving lens; this seed is what it starts from.
export const GOB_RIM_PX = 3.2;

/** Re-solve the two ink shells' thickness for a viewport (§5.12). `rimUnits` is in the
 *  figure's own rig units — the caller divides the target CSS px by pxPerUnit and by
 *  the stage's root scale. */
export function setGoblinRim(g: Goblin, rimUnits: number): void {
  for (const m of g.shells) {
    const base = m.userData.rimBase as Float32Array;
    const n = m.userData.rimNormal as Float32Array;
    const attr = m.geometry.getAttribute('position') as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    for (let i = 0; i < a.length; i++) a[i] = base[i] + n[i] * rimUnits;
    attr.needsUpdate = true;
    m.userData.rimR = rimUnits; // what gob.check reports as the analytic thickness
  }
}


// THE CONTOUR AND THE SEAM — the standing rule (§4.4), stated where it is enforced.
//
// His trilayer FILLS carry seam/curtain/alive uniforms; his ink shell and his authored
// marks carry none, and they never need one, because `markAlive(goblin.root)` (Film.tsx,
// and stageGoblin on the hero) sets uTriAlive = 1 on every one of his fill materials:
// trilayer.ts computes `triC = max(curtain, seam) * (1 - alive)`, which is exactly 0 for
// him in every state. HE STAYS PAINTED — at the seam, under the curtain, inside every
// freeze, in both rigs. The one deliberately-not-alive part is his contact pool, and it
// carries no shell and no mark, so there is nothing to disagree. gob.check's G12 asserts
// that parity rather than trusting this comment.
//
// THE FIGURE IS BUILT IN stages/goblin.ts. The 600-line builder that used to sit here —
// lathed skull, banded cloak, cylinder bones, two merged shells — is the figure the
// client rejected, and it is gone. `buildWorld` takes the built goblin as its argument
// rather than importing the new builder, because stages/goblin.ts imports RIG and the
// rest of the rig contract from THIS file: importing it back would make an ES module
// cycle whose deeper half (goblin.ts's `const HEAD_Y = RIG.hipY + …`) evaluates before
// RIG exists. One argument, two call sites, no cycle.
