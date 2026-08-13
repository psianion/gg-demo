import * as THREE from 'three';
import { dieFaces } from './dieGeometry.ts';
import {
  PAPER,
  LINE,
  fillMaterial,
  inkMaterial,
  sketch,
  rays,
  hatch,
  crossHatch,
  contact,
  weight,
  numeral,
  polyline,
  curveLine,
} from './pencil.ts';

// A ray burst wrapped in a Group so timeline can own its scale (and ambient
// rotation reads world.t elsewhere) — every "*Rays" field is this shape.
function buildRayBurst(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.set(0, 0, 0);
  g.add(rays());
  return g;
}

// Campfire/lantern flame. This is the film's proof that time stopped, so it has to
// read as fire at a glance: tongues of different heights leaning off-vertical, not a
// stack of symmetrical cones. Film.tsx drives scale off userData.lit.
function buildFlames(lit: number): THREE.Group {
  const g = new THREE.Group();
  g.userData.lit = lit;

  // [radius, height, x, z, lean] — the lean is what stops them reading as traffic cones
  const tongues: [number, number, number, number, number][] = [
    [0.12, 0.42, 0, 0, 0.05],
    [0.085, 0.3, 0.06, 0.02, -0.22],
    [0.07, 0.24, -0.055, -0.025, 0.26],
    [0.05, 0.17, 0.02, -0.06, 0.12],
    [0.042, 0.13, -0.03, 0.055, -0.15],
  ];
  for (const [r, h, x, z, lean] of tongues) {
    const tongue = sketch(new THREE.ConeGeometry(r, h, 7), 18);
    tongue.position.set(x, h / 2, z);
    tongue.rotation.z = lean;
    g.add(tongue);
  }

  // embers riding above the fire — small, and they sell the heat
  for (const [x, y, z] of [
    [0.05, 0.5, 0.01],
    [-0.06, 0.58, -0.03],
  ] as [number, number, number][]) {
    const ember = sketch(new THREE.TetrahedronGeometry(0.016), 8, 'faint');
    ember.position.set(x, y, z);
    g.add(ember);
  }

  return g;
}

// A chest: static body + lid pivoting at the back edge + a coin pile that pops in.
function buildChest(x: number, y: number, z: number) {
  const width = 0.6;
  const depth = 0.4;
  const height = 0.35;

  const container = new THREE.Group();
  container.position.set(x, y, z);

  // the camera stops on this one, so it carries the heavier stroke
  const body = sketch(new THREE.BoxGeometry(width, height, depth), 25, 'hero');
  body.position.y = height / 2;
  container.add(body);

  // iron banding — lighter than the body it sits on, or the whole chest reads as a
  // solid black block at the distance the camera actually passes it
  for (const sx of [-0.19, 0.19]) {
    const strap = sketch(new THREE.BoxGeometry(0.04, height + 0.01, depth + 0.012));
    strap.position.set(sx, height / 2, 0);
    container.add(strap);
  }
  const lock = sketch(new THREE.BoxGeometry(0.08, 0.09, 0.02));
  lock.position.set(0, height * 0.62, depth / 2);
  container.add(lock);

  // the inside of an open chest is the darkest value in the shot
  const wellShadow = hatch(width * 0.8, depth * 0.75, 16, 0.35);
  wellShadow.rotation.x = -Math.PI / 2;
  wellShadow.position.y = height - 0.005;
  container.add(wellShadow);

  const lid = new THREE.Group();
  lid.position.set(0, height, -depth / 2); // hinge: back top edge
  const lidMesh = sketch(new THREE.BoxGeometry(width, height * 0.25, depth), 25, 'hero');
  lidMesh.position.z = depth / 2; // extends forward from the hinge
  lid.add(lidMesh);
  for (const sx of [-0.19, 0.19]) {
    const strap = sketch(new THREE.BoxGeometry(0.04, height * 0.25 + 0.012, depth + 0.012));
    strap.position.set(sx, 0, depth / 2);
    lid.add(strap);
  }
  container.add(lid);

  container.add(contact(width * 1.25, depth * 1.1));

  const coins = new THREE.Group();
  coins.position.set(0, height * 0.6, 0);
  coins.scale.set(0, 0, 0);
  const coinOffsets: [number, number, number][] = [
    [-0.12, 0.02, -0.05],
    [0.05, 0.05, 0.03],
    [0.14, 0.01, -0.02],
    [-0.04, 0.06, 0.06],
    [0.0, 0.03, -0.08],
  ];
  coinOffsets.forEach(([ox, oy, oz]) => {
    const coin = sketch(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 8));
    coin.position.set(ox, oy, oz);
    coins.add(coin);
  });
  container.add(coins);

  return { container, lid, coins };
}

// A pine drawn as stacked tiers rather than one cone — the stepped silhouette is what
// makes a conifer read as a conifer. This one is instanced across the whole backdrop,
// so it stays lean and lets fog do the rest of the work.
function buildPine(r: number, h: number, trunkH = 0.15): THREE.Group {
  const g = new THREE.Group();
  const trunk = sketch(new THREE.CylinderGeometry(r * 0.13, r * 0.18, trunkH, 6), 25, 'faint');
  trunk.position.y = trunkH / 2;
  g.add(trunk);

  // three overlapping skirts, each narrower and shorter than the one below
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers;
    const tier = sketch(new THREE.ConeGeometry(r * (1 - f * 0.42), h * 0.52, 9), 25, 'faint');
    tier.position.y = trunkH + h * (0.26 + f * 0.3);
    tier.rotation.y = i * 0.7; // break the seam alignment between tiers
    g.add(tier);
  }
  return g;
}

// A bird, not a bead: body, head, beak, swept tail and two wings.
function buildRaven(): THREE.Group {
  const g = new THREE.Group();

  const body = sketch(new THREE.SphereGeometry(0.07, 8, 6), 22);
  body.scale.set(1, 0.8, 1.4);
  g.add(body);

  const head = sketch(new THREE.SphereGeometry(0.038, 7, 5), 22);
  head.position.set(0, 0.045, 0.075);
  g.add(head);

  const beak = sketch(new THREE.ConeGeometry(0.016, 0.055, 5));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.04, 0.13);
  g.add(beak);

  const tail = sketch(new THREE.ConeGeometry(0.035, 0.12, 4), 20);
  tail.rotation.x = -Math.PI / 2 - 0.25;
  tail.position.set(0, 0.01, -0.13);
  g.add(tail);

  // wings held mid-beat — these are birds caught scattering
  for (const side of [-1, 1]) {
    const wing = sketch(new THREE.ConeGeometry(0.045, 0.19, 4), 20);
    wing.rotation.set(0.15, 0, side * (Math.PI / 2 - 0.5));
    wing.position.set(side * 0.1, 0.035, -0.01);
    g.add(wing);
  }
  return g;
}

function buildMushroom(): THREE.Group {
  const g = new THREE.Group();
  g.scale.set(0, 0, 0);

  const stem = sketch(new THREE.CylinderGeometry(0.018, 0.028, 0.12, 7));
  stem.position.y = 0.06;
  stem.rotation.z = 0.07; // nothing in nature grows plumb
  const cap = sketch(new THREE.SphereGeometry(0.08, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 22);
  cap.position.y = 0.12;

  // gills — the shaded underside is most of what says "mushroom" in line-work
  const gills = hatch(0.13, 0.13, 26, 0);
  gills.rotation.x = Math.PI / 2;
  gills.position.y = 0.117;

  g.add(stem, cap, gills, contact(0.17, 0.14));
  return g;
}

// A cottage: body, pitched roof with a ridge, door, windows and a chimney. The old
// version was a box under a pyramid, which read as a tent.
function buildHouse(): THREE.Group {
  const g = new THREE.Group();

  const body = sketch(new THREE.BoxGeometry(0.4, 0.35, 0.4));
  body.position.y = 0.175;
  g.add(body);

  const roof = sketch(new THREE.ConeGeometry(0.33, 0.3, 4), 25);
  roof.position.y = 0.35 + 0.15;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  const door = sketch(new THREE.BoxGeometry(0.1, 0.16, 0.02));
  door.position.set(0, 0.08, 0.205);
  g.add(door);

  for (const sx of [-0.12, 0.12]) {
    const win = sketch(new THREE.BoxGeometry(0.07, 0.07, 0.02));
    win.position.set(sx, 0.23, 0.205);
    g.add(win);
  }

  const chimney = sketch(new THREE.BoxGeometry(0.06, 0.16, 0.06));
  chimney.position.set(0.11, 0.46, -0.06);
  g.add(chimney);

  g.add(contact(0.5, 0.42));
  return g;
}

export interface Goblin {
  root: THREE.Group; // position/rotation tweened by timeline
  torso: THREE.Group; // bob target
  head: THREE.Group; // look beats tween head.rotation
  armL: { pose: THREE.Group; swing: THREE.Group }; // timeline poses `pose`, gait writes `swing.rotation.x`
  armR: { pose: THREE.Group; swing: THREE.Group };
  legL: THREE.Group; // gait writes rotation.x
  legR: THREE.Group;
  speed: number; // 0..1 gait amplitude, tweened by timeline
}

export interface World {
  root: THREE.Group; // add to scene
  look: THREE.Vector3; // camera lookAt target, tweened by timeline
  timeScale: number; // world clock scale (freeze = 0)
  t: number; // world clock (useFrame advances)
  gobT: number; // goblin clock (useFrame advances)
  goblin: Goblin;

  // chapter 1 — ambush
  ambushFlames: THREE.Group; // campfire flames, userData.lit starts at 1
  adventurers: THREE.Group[]; // 3 figures

  // chapter 2 — lighting the world (props in +x order)
  fire2Flames: THREE.Group; // userData.lit starts at 0
  fire2Rays: THREE.Group; // scale starts 0
  lanternRays: THREE.Group; // scale starts 0
  caveDoor: THREE.Group; // pivot at hinge; rotation.y 0 = closed
  chestLid: THREE.Group; // pivot at back edge; rotation.x 0 = closed
  chestCoins: THREE.Group; // scale starts 0
  ravens: THREE.Group[]; // 3, perched on a branch
  mushrooms: THREE.Group[]; // 3, scale start 0
  signBoard: THREE.Group; // rotation.z starts at 0.5 (crooked)

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

  // chapter 7 — the throw
  die2: THREE.Group; // second d20, starts hidden (scale 0) at the cliff
  board: THREE.Group; // pencil game board (grid), materials transparent, opacity starts 0
}

// Goblin rig, ~0.9 units tall, origin at feet, faces +z by default.
//
// Every joint pivot here is load-bearing: Film.tsx writes the gait into legL/legR and
// both arm `swing` groups every frame, and timeline.ts poses `head.rotation` and both
// arm `pose.rotation`. Detail hangs off those groups; none of it moves them.
function buildGoblin(): Goblin {
  const root = new THREE.Group();

  // spec pins hip height (y=0.30) but not hip width; a small split keeps
  // the two legs visually distinct instead of coincident at rest.
  const HIP_X = 0.08;

  function buildLeg(x: number, side: number): THREE.Group {
    const leg = new THREE.Group();
    leg.position.set(x, 0.3, 0);
    // tapered, because a leg that is the same width at ankle and thigh is a dowel
    const mesh = sketch(new THREE.CylinderGeometry(0.052, 0.042, 0.3, 10), 25, 'form', 0.006);
    mesh.position.y = -0.15;
    leg.add(mesh);

    // Big flat feet, carried forward of the ankle. The gait swings the whole leg group,
    // so the feet swing with it — and a foot is what stops a walk cycle reading as two
    // pendulums. He had none, which is most of why he floated.
    const foot = sketch(new THREE.BoxGeometry(0.1, 0.045, 0.17));
    foot.position.set(side * 0.005, -0.278, 0.038);
    foot.rotation.y = side * 0.09; // toes turned out
    leg.add(foot);
    return leg;
  }
  const legL = buildLeg(-HIP_X, -1);
  const legR = buildLeg(HIP_X, 1);

  const torso = new THREE.Group();
  torso.position.y = 0.3;
  const torsoBox = sketch(new THREE.BoxGeometry(0.28, 0.34, 0.16), 25, 'hero');
  torsoBox.position.y = 0.17;
  torso.add(torsoBox);

  // A tunic, a belt and a collar. Three thin slabs, and they turn a box into someone
  // dressed for work — which is the whole claim the film makes about him.
  const hem = sketch(new THREE.BoxGeometry(0.3, 0.07, 0.18), 25, 'form');
  hem.position.y = 0.035;
  const belt = sketch(new THREE.BoxGeometry(0.295, 0.035, 0.175), 25, 'form');
  belt.position.y = 0.11;
  const buckle = sketch(new THREE.BoxGeometry(0.045, 0.045, 0.02));
  buckle.position.set(0, 0.11, 0.09);
  const collar = sketch(new THREE.BoxGeometry(0.255, 0.045, 0.15), 25, 'form');
  collar.position.y = 0.325;
  torso.add(hem, belt, buckle, collar);

  // C2 is a three-quarter-back over-the-shoulder follow: for thirteen seconds his back
  // is the shot. A tool satchel and its strap are what that view has to look at.
  const satchel = sketch(new THREE.BoxGeometry(0.17, 0.15, 0.08), 25, 'form');
  satchel.position.set(-0.02, 0.15, -0.12);
  const flap = sketch(new THREE.BoxGeometry(0.175, 0.05, 0.085), 25, 'faint');
  flap.position.set(-0.02, 0.21, -0.122);
  const strap = sketch(new THREE.BoxGeometry(0.035, 0.36, 0.02), 25, 'faint');
  strap.position.set(0.02, 0.19, 0.0);
  strap.rotation.z = 0.42;
  torso.add(satchel, flap, strap);

  // tone down his left flank so the tunic has a lit side and a shadow side
  const flank = hatch(0.3, 0.16, 13, 1.2, 'faint');
  flank.rotation.y = -Math.PI / 2;
  flank.position.set(-0.142, 0.17, 0);
  torso.add(flank);

  const head = new THREE.Group();
  head.position.y = 0.76;
  // the shell draws the head's outline, so the facet lines it used to be drawn with
  // drop back to 'faint' and stop reading as a striped scribble
  head.add(sketch(new THREE.SphereGeometry(0.16, 12, 10), 25, 'faint', 0.013));

  const nose = sketch(new THREE.ConeGeometry(0.035, 0.1, 8), 25, 'form', 0.007);
  nose.rotation.x = Math.PI / 2; // apex from +y to +z
  nose.position.z = 0.2;
  head.add(nose);

  const earGeom = new THREE.ConeGeometry(0.05, 0.26, 8);
  const earL = sketch(earGeom, 25, 'form', 0.007);
  earL.position.set(-0.13, 0.08, -0.02);
  earL.rotation.z = 0.6; // sideways-up
  const earR = sketch(earGeom, 25, 'form', 0.007);
  earR.position.set(0.13, 0.08, -0.02);
  earR.rotation.z = -0.6;
  head.add(earL, earR);

  // The face. Brows angled inward and eyes set close read as someone concentrating on
  // a job rather than a mascot staring out; the mouth is off-centre so his default
  // expression is a little sly. Pupils are the film's only filled black — this is the
  // one place a drawing presses that hard.
  for (const side of [-1, 1]) {
    const brow = sketch(new THREE.BoxGeometry(0.075, 0.022, 0.03));
    brow.position.set(side * 0.062, 0.062, 0.133);
    brow.rotation.z = side * -0.34;
    head.add(brow);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.023, 8, 6), inkMaterial);
    eye.position.set(side * 0.061, 0.026, 0.146);
    head.add(eye);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.014, 0.02), inkMaterial);
  mouth.position.set(0.012, -0.072, 0.142);
  mouth.rotation.z = 0.2;
  head.add(mouth);

  // jaw tone, so the head has an underside instead of stopping at its outline
  const jaw = hatch(0.16, 0.07, 16, 0.2, 'faint');
  jaw.position.set(0, -0.118, 0.09);
  jaw.rotation.x = -0.9;
  head.add(jaw);

  function buildArm(x: number): { pose: THREE.Group; swing: THREE.Group } {
    const pose = new THREE.Group();
    pose.position.set(x, 0.62, 0);
    const swing = new THREE.Group();
    pose.add(swing);
    const mesh = sketch(new THREE.CylinderGeometry(0.042, 0.034, 0.28, 8), 25, 'form', 0.006);
    mesh.position.y = -0.14;
    swing.add(mesh);

    // Hands. The entire second chapter is him putting a hand on seven things; before
    // this the arm simply ended.
    // kept just proud of the forearm: a bigger fist reads as a mallet, and a separate
    // thumb at this scale reads as a spike coming out of his wrist
    const hand = sketch(new THREE.IcosahedronGeometry(0.045, 0), 30, 'form', 0.007);
    hand.position.y = -0.295;
    swing.add(hand);
    return { pose, swing };
  }
  const armL = buildArm(-0.17);
  const armR = buildArm(0.17);

  root.add(legL, legR, torso, head, armL.pose, armR.pose);
  // he travels with his own shadow — it rides the root, so it is under him on the
  // path, on a montage platform and on the cliff top alike
  root.add(contact(0.34, 0.26));

  return { root, torso, head, armL, armR, legL, legR, speed: 0 };
}

// Adventurer figure — taller than the goblin, ~1.1 units, faces +z by default. Six of
// these ship: three at the ambush and three around the tavern table, so the part count
// is kept lean and the overall height is unchanged from the locked previz framing.
//
// It used to be a cylinder under a ball under a cone, which is a chess pawn. What makes
// an adventurer read at a glance is the cloak silhouette and the hat brim, so those
// carry the figure and the rest stays cheap.
function buildAdventurer(swordRaised: boolean): THREE.Group {
  const g = new THREE.Group();

  for (const side of [-1, 1]) {
    const leg = sketch(new THREE.CylinderGeometry(0.048, 0.038, 0.32, 7), 25, 'faint');
    leg.position.set(side * 0.062, 0.16, 0);
    g.add(leg);
    const boot = sketch(new THREE.BoxGeometry(0.085, 0.05, 0.15), 25, 'faint');
    boot.position.set(side * 0.062, 0.025, 0.03);
    g.add(boot);
  }

  const body = sketch(new THREE.CylinderGeometry(0.13, 0.15, 0.36, 9), 25, 'form', 0.006);
  body.position.y = 0.46;
  g.add(body);

  // the cloak is the silhouette — it hangs over the leg tops and gives the figure a
  // shape that isn't a tube
  const cloak = sketch(new THREE.ConeGeometry(0.23, 0.46, 9), 22, 'form', 0.007);
  cloak.position.y = 0.4;
  cloak.rotation.y = 0.3;
  g.add(cloak);
  const cloakTone = hatch(0.3, 0.36, 11, 1.35, 'faint');
  cloakTone.position.set(-0.13, 0.4, 0.06);
  cloakTone.rotation.y = -0.8;
  g.add(cloakTone);

  for (const side of [-1, 1]) {
    const arm = sketch(new THREE.CylinderGeometry(0.035, 0.03, 0.3, 6), 25, 'faint');
    arm.position.set(side * 0.16, 0.48, 0.03);
    arm.rotation.z = side * -0.16;
    g.add(arm);
  }

  const head = sketch(new THREE.SphereGeometry(0.115, 10, 8), 25, 'faint', 0.011);
  head.position.y = 0.72;
  g.add(head);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 5), inkMaterial);
    eye.position.set(side * 0.04, 0.735, 0.1);
    g.add(eye);
  }

  // wide-brimmed hat: the brim is what reads at fifteen units, not the crown
  const brim = sketch(new THREE.CylinderGeometry(0.22, 0.22, 0.018, 12), 25, 'form');
  brim.position.y = 0.815;
  const crown = sketch(new THREE.ConeGeometry(0.14, 0.26, 9), 25, 'form', 0.006);
  crown.position.y = 0.95;
  g.add(brim, crown);

  // a real sword: blade, crossguard, grip, pommel — held high in the ambush, resting
  // point-down beside the chair at the table
  const sword = new THREE.Group();
  const blade = sketch(new THREE.BoxGeometry(0.028, 0.42, 0.016), 25, 'form');
  blade.position.y = 0.27;
  const guard = sketch(new THREE.BoxGeometry(0.15, 0.028, 0.03));
  const grip = sketch(new THREE.CylinderGeometry(0.019, 0.019, 0.1, 6), 25, 'faint');
  grip.position.y = -0.07;
  const pommel = sketch(new THREE.SphereGeometry(0.028, 7, 5), 25, 'faint', 0.005);
  pommel.position.y = -0.128;
  sword.add(blade, guard, grip, pommel);
  // point-down means the blade hangs below the grip, so the rest pose sits the hilt at
  // hip height and lets the tip fall to just above the floor
  sword.position.set(0.19, swordRaised ? 0.62 : 0.52, 0.06);
  sword.rotation.z = swordRaised ? -0.34 : Math.PI;
  g.add(sword);

  g.add(contact(0.42, 0.3));
  return g;
}

// C1 — ambush around the origin. The camera opens on this from (0, 2.0, 6.2) and later
// pushes in to (2.5, 1.1, 3.2) for the film's hero close-up, so this set has to hold up
// both as a wide tableau and as the backdrop behind his face.
function buildAmbush(goblin: Goblin) {
  const container = new THREE.Group();

  const rock = sketch(new THREE.DodecahedronGeometry(0.9), 25, 'hero');
  rock.scale.y = 0.6;
  rock.position.set(0, 0, 0);
  container.add(rock);

  // an outcrop rather than one boulder — kept off z=+0.9 where he pops up, so nothing
  // stands between the camera and the reveal
  const outcrop: [number, number, number, number][] = [
    [-0.95, 0.12, -0.5, 0.5],
    [0.98, 0.08, -0.62, 0.42],
    [-0.3, 0.05, -1.05, 0.34],
  ];
  outcrop.forEach(([x, y, z, r]) => {
    const chunk = sketch(new THREE.DodecahedronGeometry(r), 25, 'form');
    chunk.scale.y = 0.7;
    chunk.position.set(x, y, z);
    container.add(chunk);
  });
  // The outcrop's own shadow only. A tone panel tilted off the rock face and a
  // full-width contact both landed as free-floating parallel lines on open ground —
  // at this angle the ground beside the rock is bare paper, and stripes on bare paper
  // read as stripes, not as shade.
  const rockShadow = contact(2.2, 0.8);
  rockShadow.position.set(-0.1, 0.012, -0.5);
  container.add(rockShadow);
  // tone standing on the rock's own near face, not lying on the ground beside it: a
  // dodecahedron drawn in outline alone reads as a flat plate of facets
  for (const [tx, ty, tz, tw, th] of [
    [-0.62, 0.22, 0.34, 0.8, 0.4],
    [0.72, 0.16, 0.2, 0.5, 0.3],
  ] as [number, number, number, number, number][]) {
    const face = hatch(tw, th, 12, 1.1, 'faint');
    face.position.set(tx, ty, tz);
    face.rotation.y = tx > 0 ? -0.6 : 0.6;
    container.add(face);
  }

  const ambushFlames = buildFlames(1);
  ambushFlames.position.set(-2.2, 0, 0.6);
  container.add(ambushFlames);

  // A campfire needs a hearth or it is a flame standing on paper: a ring of stones,
  // two logs laid into it, and scorched ground.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    const stone = sketch(new THREE.DodecahedronGeometry(0.075 + (i % 3) * 0.015), 25, 'faint');
    stone.position.set(-2.2 + Math.cos(a) * 0.34, 0.04, 0.6 + Math.sin(a) * 0.34);
    container.add(stone);
  }
  for (const [lx, lz, rot] of [
    [-0.06, 0.04, 0.6],
    [0.05, -0.05, -0.9],
  ] as [number, number, number][]) {
    const log = sketch(new THREE.CylinderGeometry(0.045, 0.05, 0.5, 6), 25, 'faint');
    log.rotation.set(0, rot, Math.PI / 2);
    log.position.set(-2.2 + lx, 0.05, 0.6 + lz);
    container.add(log);
  }
  const scorch = contact(0.95, 0.85);
  scorch.position.set(-2.2, 0.011, 0.6);
  container.add(scorch);

  // camp kit, so three figures round a fire read as a party that stopped for the night
  const bedroll = sketch(new THREE.CylinderGeometry(0.11, 0.11, 0.62, 8), 25, 'faint');
  bedroll.rotation.set(0, 0.35, Math.PI / 2);
  bedroll.position.set(-3.5, 0.11, 0.9);
  container.add(bedroll);
  const pack = sketch(new THREE.BoxGeometry(0.28, 0.26, 0.22), 25, 'faint');
  pack.rotation.y = -0.4;
  pack.position.set(-1.5, 0.13, 1.15);
  container.add(pack);
  const packFlap = sketch(new THREE.BoxGeometry(0.29, 0.08, 0.23), 25, 'faint');
  packFlap.rotation.y = -0.4;
  packFlap.position.set(-1.5, 0.28, 1.15);
  container.add(packFlap);
  // planted spear — short enough to read as kit leaning by the fire rather than as a
  // flagpole running out of the top of the frame
  const spearLean = 0.12;
  const spearH = 1.05;
  const spear = sketch(new THREE.CylinderGeometry(0.016, 0.016, spearH, 5), 25, 'faint');
  spear.rotation.z = spearLean;
  spear.position.set(-4.0, spearH / 2, -0.3);
  container.add(spear);
  const spearHead = sketch(new THREE.ConeGeometry(0.04, 0.18, 5), 25, 'faint');
  spearHead.rotation.z = spearLean;
  spearHead.position.set(
    -4.0 - Math.sin(spearLean) * (spearH / 2 + 0.09),
    spearH + Math.cos(spearLean) * 0.09 - 0.02,
    -0.3,
  );
  container.add(spearHead);

  // The freeze pushes in to his face at (2.5, 1.1, 3.2) looking -z, and until now there
  // was nothing behind him but blank paper. A fogged treeline gives the film's most
  // important shot a world to happen in without competing with it.
  // Set back far enough that fog does the work. At six units out they were the same
  // size as the figures and crowded in behind his head instead of sitting behind him.
  const treeline: [number, number, number, number][] = [
    [2.2, -15.5, 0.62, 1.9],
    [4.6, -18.4, 0.7, 2.2],
    [0.4, -20.2, 0.58, 1.8],
    [7.2, -16.6, 0.6, 1.9],
    [-2.8, -17.8, 0.66, 2.1],
    [-6.4, -21.0, 0.6, 1.8],
    [10.4, -19.5, 0.68, 2.1],
    [-10.2, -18.2, 0.62, 1.9],
  ];
  treeline.forEach(([x, z, r, h]) => {
    const pine = buildPine(r, h, 0.3);
    pine.position.set(x, 0, z);
    container.add(pine);
  });

  const advPositions: [number, number, number][] = [
    [-3.2, 0, -0.8],
    [-2.5, 0, 1.0],
    [-1.8, 0, 0.1],
  ];
  const adventurers = advPositions.map(([x, y, z]) => {
    const a = buildAdventurer(true);
    a.position.set(x, y, z);
    a.rotation.y = Math.PI / 2; // faces +x
    container.add(a);
    return a;
  });

  goblin.root.position.set(0.5, -0.7, 0.9); // hidden behind the rock
  container.add(goblin.root);

  return { container, ambushFlames, adventurers };
}

// C2 — path props at z~0, in +x order: fire, lantern, cave, chest, ravens, mushrooms, sign.
function buildPathProps() {
  const container = new THREE.Group();

  const fire2Flames = buildFlames(0);
  fire2Flames.position.set(6, 0, 0);
  container.add(fire2Flames);
  const fire2Rays = buildRayBurst(6, 0.5, 0);
  container.add(fire2Rays);

  const lanternPost = new THREE.Group();
  lanternPost.position.set(10, 0, 0);
  const pole = sketch(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8));
  pole.position.y = 0.55;
  lanternPost.add(pole);

  // cross-arm off the post top, with a short drop to hold the housing clear of the pole
  const lanternArm = sketch(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 6));
  lanternArm.rotation.z = Math.PI / 2;
  lanternArm.position.set(0.1, 1.05, 0);
  lanternPost.add(lanternArm);
  const lanternDrop = sketch(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 6), 25, 'faint');
  lanternDrop.position.set(0.19, 1.0, 0);
  lanternPost.add(lanternDrop);

  // housing: cap, base and corner posts only — a cage, not a box, so the ray burst
  // at (10, 1.1, 0) still reads as light coming from inside it
  const lanternCap = sketch(new THREE.ConeGeometry(0.09, 0.05, 4), 20, 'faint');
  lanternCap.rotation.y = Math.PI / 4;
  lanternCap.position.set(0.19, 1.17, 0);
  lanternPost.add(lanternCap);
  const lanternBase = sketch(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 8), 25, 'faint');
  lanternBase.position.set(0.19, 1.02, 0);
  lanternPost.add(lanternBase);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const bar = sketch(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4), 15, 'faint');
    bar.position.set(0.19 + Math.cos(a) * 0.065, 1.095, Math.sin(a) * 0.065);
    lanternPost.add(bar);
  }
  container.add(lanternPost);
  const lanternRays = buildRayBurst(10, 1.1, 0);
  container.add(lanternRays);

  const caveRocks: [number, number, number, number][] = [
    [14, 0.5, -2.8, 0.6],
    [14.9, 0.4, -2.2, 0.5],
    [13.2, 0.45, -2.3, 0.5],
  ];
  caveRocks.forEach(([x, y, z, r]) => {
    const rock = sketch(new THREE.DodecahedronGeometry(r));
    rock.position.set(x, y, z);
    container.add(rock);
  });
  // a dark opening behind the door, set into the rock cluster — the door swings
  // open onto this, not onto more rock. Fixed to the cluster, so it does not
  // rotate with the door.
  const caveMouth = new THREE.Group();
  caveMouth.position.set(13.4, 0.8, -2.2);
  const mouthDark = crossHatch(0.9, 1.2, 16);
  caveMouth.add(mouthDark);
  const rimChips: [number, number, number, number][] = [
    [-0.42, 0.35, -0.05, 0.22],
    [0.4, 0.3, 0.05, 0.2],
    [-0.1, 0.62, 0.02, 0.2],
    [0.15, -0.55, -0.03, 0.22],
  ];
  rimChips.forEach(([x, y, z, r]) => {
    const chip = sketch(new THREE.DodecahedronGeometry(r), 25, 'faint');
    chip.position.set(x, y, z);
    caveMouth.add(chip);
  });
  container.add(caveMouth);

  const doorWidth = 1.2;
  const doorHeight = 1.6;
  const doorThickness = 0.08;
  const caveDoor = new THREE.Group();
  caveDoor.position.set(13.4, 0.8, -2); // hinge at the left edge
  const doorSlab = sketch(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), 25, 'hero');
  doorSlab.position.x = doorWidth / 2; // offset +x from the hinge
  caveDoor.add(doorSlab);

  // plank seams — thin proud strips read as the gaps between boards
  for (const px of [doorWidth * 0.22, doorWidth * 0.45, doorWidth * 0.68, doorWidth * 0.9]) {
    const seam = sketch(new THREE.BoxGeometry(0.015, doorHeight * 0.94, doorThickness + 0.01), 25, 'faint');
    seam.position.x = px;
    caveDoor.add(seam);
  }

  // iron banding, top and bottom
  for (const py of [doorHeight * 0.32, -doorHeight * 0.32]) {
    const band = sketch(new THREE.BoxGeometry(doorWidth + 0.01, 0.05, doorThickness + 0.015));
    band.position.set(doorWidth / 2, py, 0);
    caveDoor.add(band);
  }

  // handle, near the free edge
  const handle = sketch(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6));
  handle.rotation.z = Math.PI / 2;
  handle.position.set(doorWidth - 0.15, 0, doorThickness / 2 + 0.03);
  caveDoor.add(handle);

  container.add(caveDoor);

  const chest = buildChest(18, 0, 0);
  container.add(chest.container);

  // a tree for the ravens to actually perch on — trunk offset from the branch/raven
  // span so it doesn't run through them
  const tree = new THREE.Group();
  tree.position.set(21.2, 0, 0);
  const trunkH = 1.5;
  const trunk = sketch(new THREE.CylinderGeometry(0.08, 0.12, trunkH, 7), 25, 'form');
  trunk.position.y = trunkH / 2;
  trunk.rotation.z = -0.05; // nothing grows perfectly plumb
  tree.add(trunk);
  tree.add(contact(0.4, 0.32));

  // a couple of smaller twigs off the trunk, near where the main branch grows out
  const twigSpecs: [number, number, number, number, number][] = [
    [0.3, 1.15, 0.06, 0.35, -0.5],
    [-0.2, 1.32, -0.05, 0.28, 0.6],
  ];
  twigSpecs.forEach(([x, y, z, len, tilt]) => {
    const twig = sketch(new THREE.CylinderGeometry(0.015, 0.02, len, 5), 25, 'faint');
    twig.rotation.z = Math.PI / 2 + tilt;
    twig.position.set(x, y, z);
    tree.add(twig);
  });

  // a little foliage, kept loose so it doesn't read as a hedge
  const foliageSpecs: [number, number, number, number][] = [
    [0.05, 1.75, 0.05, 0.3],
    [-0.28, 1.55, 0.1, 0.24],
    [0.42, 1.6, -0.08, 0.22],
  ];
  foliageSpecs.forEach(([x, y, z, r]) => {
    const puff = sketch(new THREE.IcosahedronGeometry(r, 0), 28, 'faint');
    puff.position.set(x, y, z);
    tree.add(puff);
  });
  container.add(tree);

  const branch = sketch(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6));
  branch.rotation.z = Math.PI / 2;
  branch.position.set(22, 1.6, 0);
  container.add(branch);
  const ravenOffsets: [number, number, number][] = [
    [-0.3, 0.05, 0],
    [0.05, 0.05, 0.04],
    [0.35, 0.05, -0.03],
  ];
  const ravens = ravenOffsets.map(([ox, oy, oz]) => {
    const raven = buildRaven();
    raven.position.set(22 + ox, 1.6 + oy, oz);
    container.add(raven);
    return raven;
  });

  const mushroomOffsets: [number, number][] = [
    [-0.15, 0.05],
    [0.1, -0.08],
    [0.25, 0.1],
  ];
  const mushrooms = mushroomOffsets.map(([ox, oz]) => {
    const m = buildMushroom();
    m.position.set(26 + ox, 0, -1.2 + oz);
    container.add(m);
    return m;
  });

  // The last prop of the run, and the one the caption 'work4' plays over — a bare pole
  // with a blank slab on it was the weakest thing in the chapter.
  const post = sketch(new THREE.CylinderGeometry(0.036, 0.05, 1.0, 8), 25, 'form', 0.006);
  post.position.set(30, 0.5, 0);
  container.add(post);
  const postCap = sketch(new THREE.ConeGeometry(0.06, 0.09, 6), 25, 'faint');
  postCap.position.set(30, 1.06, 0);
  container.add(postCap);
  const postBase = contact(0.3, 0.26);
  postBase.position.set(30, 0.012, 0);
  container.add(postBase);

  // a second, lower board fixed to the post and pointing back down the path — one sign
  // is a marker, two are a crossroads, and a crossroads is somewhere worth going
  const backBoard = sketch(new THREE.BoxGeometry(0.44, 0.2, 0.045), 25, 'form');
  backBoard.position.set(29.78, 0.68, 0.01);
  backBoard.rotation.z = -0.08;
  container.add(backBoard);
  const backLetters = hatch(0.3, 0.08, 22, 0, 'faint');
  backLetters.position.set(29.78, 0.68, 0.036);
  backLetters.rotation.z = -0.08;
  container.add(backLetters);

  const signBoard = new THREE.Group();
  signBoard.position.set(30, 1.0, 0);
  signBoard.rotation.z = 0.5; // crooked
  const boardMesh = sketch(new THREE.BoxGeometry(0.6, 0.3, 0.05), 25, 'form');
  signBoard.add(boardMesh);

  // the pointed end is what makes a plank a signpost
  const point = sketch(new THREE.ConeGeometry(0.16, 0.18, 3), 20, 'form');
  point.rotation.set(0, Math.PI / 6, -Math.PI / 2);
  point.position.set(0.38, 0, 0);
  signBoard.add(point);

  // lettering as two ruled lines of tone — legible as writing, unreadable as words,
  // which is exactly what a drawing of a sign should be
  for (const ly of [0.055, -0.045]) {
    const letters = hatch(0.4, 0.055, 26, 0, 'faint');
    letters.position.set(-0.04, ly, 0.03);
    signBoard.add(letters);
  }
  for (const nx of [-0.24, 0.24]) {
    const nail = sketch(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 6), 25, 'faint');
    nail.rotation.x = Math.PI / 2;
    nail.position.set(nx, 0.1, 0.03);
    signBoard.add(nail);
  }
  container.add(signBoard);

  return { container, fire2Flames, fire2Rays, lanternRays, caveDoor, chestLid: chest.lid, chestCoins: chest.coins, ravens, mushrooms, signBoard };
}

// Ground plane (fill only, no edges) + the hand-drawn path under C2.
//
// The plane itself stays untoned on purpose: in pencil illustration the paper is the
// ground, and hatching 600×300 units of it would cost a fortune and read worse than
// nothing. The path is the exception — the camera follows it for thirteen seconds.
function buildGround(): THREE.Group {
  const container = new THREE.Group();

  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 300), fillMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(90, 0, 0);
  container.add(groundMesh);

  // A track has two edges. One centre line was the single thinnest mark in the film —
  // a 1px hairline running the length of the chapter the camera spends longest in.
  const spine: [number, number][] = [
    [2, 0.4],
    [10, -0.5],
    [18, 0.3],
    [26, -0.4],
    [36, 0.2],
  ];
  // Two edges, both light. Four lines at full weight — edges plus ruts — turned a
  // woodland path into a railway running the length of the chapter, and they cut every
  // wide shot in the film clean in half.
  for (const side of [-1, 1]) {
    const edge = curveLine(
      spine.map(([x, z]) => new THREE.Vector3(x, 0.01, z + side * 0.55)),
      'faint',
      40,
    );
    container.add(edge);
  }

  // Tufts on the far verge only, and kept low. On the near verge they sat in the
  // foreground of every shot down the path, where three strokes at any size read as a
  // scribble on the lens rather than as grass on the ground.
  const tufts: [number, number][] = [
    [3.4, -0.95], [11.6, -0.8], [19.4, -1.0], [27.8, -1.05], [34.6, -0.9],
  ];
  tufts.forEach(([x, z], i) => {
    const lean = (i % 3) * 0.12 - 0.12;
    const blades: THREE.Vector3[] = [];
    for (const [dx, h] of [
      [-0.04, 0.09],
      [0.0, 0.13],
      [0.05, 0.08],
    ] as [number, number][]) {
      blades.push(new THREE.Vector3(x + dx, 0.01, z), new THREE.Vector3(x + dx + lean * h, h, z + 0.02));
    }
    container.add(polyline(blades, 'faint'));
  });

  return container;
}

// C3 — theatre set: a rotating disc, forest half facing the path at rest.
function buildTheatre() {
  const container = new THREE.Group();

  const stageDisc = new THREE.Group();
  stageDisc.position.set(44, 0, -2);
  const discMesh = sketch(new THREE.CylinderGeometry(7, 7, 0.3, 32), 25, 'form');
  discMesh.position.y = 0.15;
  stageDisc.add(discMesh);

  // It is a revolve, and the film only gets to say so once — when it turns. A kerb
  // around the rim, plank seams radiating across the top and the joint line down the
  // middle are the three marks that make a disc read as stagecraft rather than as a
  // coin the world happens to sit on.
  const kerb = sketch(new THREE.CylinderGeometry(7.16, 7.16, 0.12, 32), 25, 'faint');
  kerb.position.y = 0.06;
  stageDisc.add(kerb);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    stageDisc.add(
      polyline(
        [
          new THREE.Vector3(Math.cos(a) * 0.6, 0.302, Math.sin(a) * 0.6),
          new THREE.Vector3(Math.cos(a) * 6.95, 0.302, Math.sin(a) * 6.95),
        ],
        'faint',
      ),
    );
  }
  // the joint the two halves part on, drawn heavier than the planks
  stageDisc.add(
    polyline([new THREE.Vector3(0, 0.303, -7), new THREE.Vector3(0, 0.303, 7)], 'form'),
  );
  // tone under the rim so seven units of disc stop floating on the paper
  const discShadow = hatch(13.6, 1.6, 5, 0.15, 'faint');
  discShadow.rotation.x = -Math.PI / 2;
  discShadow.position.set(0, 0.012, 6.6);
  stageDisc.add(discShadow);

  // forest half, local -x (faces the path at rotation.y = 0)
  const forestSpots: [number, number, number][] = [
    [-5.5, 1.5, 0.6],
    [-4.8, -1.8, 0.7],
    [-3.6, 0.5, 0.55],
    [-2.8, -2.5, 0.65],
    [-2.0, 2.2, 0.5],
    [-1.2, -0.5, 0.6],
    [-5.0, -3.5, 0.75],
    [-1.8, 3.6, 0.5],
  ];
  forestSpots.forEach(([x, z, r], i) => {
    const h = 1.6 + (i % 3) * 0.3;
    const pine = buildPine(r, h);
    pine.position.set(x, 0.3, z);
    stageDisc.add(pine);
  });

  // Forest floor. Eight pines on a bare disc read as eight pines on a bare disc; what
  // makes it a wood is the litter between them — undergrowth tone, a couple of stumps
  // where trees came out, boulders and a fallen trunk.
  const floorTone: [number, number, number, number, number][] = [
    [-4.4, -0.6, 3.4, 2.6, 0.4],
    [-2.4, 1.9, 2.4, 2.0, -0.7],
    [-5.0, 2.6, 2.2, 1.8, 0.2],
  ];
  floorTone.forEach(([x, z, w, d, a]) => {
    const patch = hatch(w, d, 4, a, 'faint');
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.305, z);
    stageDisc.add(patch);
  });
  for (const [sx, sz, sr] of [
    [-3.4, 2.9, 0.3],
    [-4.2, -0.9, 0.24],
  ] as [number, number, number][]) {
    const stump = sketch(new THREE.CylinderGeometry(sr, sr * 1.15, 0.34, 9), 25, 'faint');
    stump.position.set(sx, 0.47, sz);
    stageDisc.add(stump);
    const rings = hatch(sr * 1.5, sr * 1.5, 9, 0.3, 'faint');
    rings.rotation.x = -Math.PI / 2;
    rings.position.set(sx, 0.645, sz);
    stageDisc.add(rings);
  }
  for (const [bx, bz, br] of [
    [-2.2, -1.4, 0.42],
    [-5.8, 0.4, 0.34],
    [-1.0, 2.7, 0.28],
  ] as [number, number, number][]) {
    const boulder = sketch(new THREE.DodecahedronGeometry(br), 25, 'faint');
    boulder.scale.y = 0.7;
    boulder.position.set(bx, 0.3 + br * 0.5, bz);
    stageDisc.add(boulder);
  }
  const fallen = sketch(new THREE.CylinderGeometry(0.17, 0.2, 2.6, 7), 25, 'faint');
  fallen.rotation.set(0, 0.5, Math.PI / 2 + 0.06);
  fallen.position.set(-3.0, 0.48, -2.8);
  stageDisc.add(fallen);

  // mountain half, local +x (swings to face camera after rotation.y += PI). Local +x is
  // the side the lens ends up on, so that is the side that gets the tone.
  const peaks: [number, number, number, number, number][] = [
    // [radius, height, x, z, tone width]
    [3.2, 4.5, 3, 0, 3.0],
    [1.4, 2.2, 5, 2.2, 1.4],
    [1.2, 1.9, 4.6, -2.4, 1.2],
  ];
  peaks.forEach(([r, h, x, z, tw]) => {
    // Threshold 15, not 25: a broad 12-sided cone's facets meet at about 17 degrees, so
    // at the default the mountains drew no edges whatsoever — three pale grey triangles
    // with no line on them at all, which is why this half of the disc read as empty.
    // The shell then guarantees a contour whatever the facet count works out to.
    const peak = sketch(new THREE.ConeGeometry(r, h, 12), 15, 'form', 0.03);
    peak.position.set(x, 0.3 + h / 2, z);
    stageDisc.add(peak);

    // Snow is the paper. The rock below the snowline is what gets hatched, and the
    // boundary between them is the whole reason this half reads as a mountain and the
    // other half reads as a wood.
    const tone = hatch(tw, h * 0.42, 7, 0.35, 'faint');
    tone.rotation.y = Math.PI / 2;
    tone.position.set(x + r * 0.34, 0.3 + h * 0.24, z);
    stageDisc.add(tone);

    // a ridge running down the face, so the cone has structure instead of a seam
    stageDisc.add(
      polyline(
        [
          new THREE.Vector3(x, 0.3 + h, z),
          new THREE.Vector3(x + r * 0.3, 0.3 + h * 0.55, z + r * 0.18),
          new THREE.Vector3(x + r * 0.55, 0.3 + h * 0.22, z + r * 0.1),
          new THREE.Vector3(x + r * 0.9, 0.31, z + r * 0.2),
        ],
        'faint',
      ),
    );
  });
  // scree and a treeline at the foot, which is what gives the peaks their scale
  for (const [fx, fz, fr] of [
    [1.6, 1.9, 0.34],
    [1.4, -2.1, 0.28],
    [6.1, 0.4, 0.3],
  ] as [number, number, number][]) {
    const rock = sketch(new THREE.DodecahedronGeometry(fr), 25, 'faint');
    rock.position.set(fx, 0.3 + fr * 0.6, fz);
    stageDisc.add(rock);
  }
  for (const [tx, tz] of [
    [1.3, 3.4],
    [2.1, 4.2],
    [1.1, -3.6],
    [2.6, -4.1],
    [6.4, 2.0],
  ] as [number, number][]) {
    const pine = buildPine(0.34, 0.9, 0.12);
    pine.position.set(tx, 0.3, tz);
    stageDisc.add(pine);
  }

  container.add(stageDisc);

  const rope = new THREE.Group();
  rope.position.set(38.5, 0, 1);

  // a hanging line with a real catenary sag, not a rigid rod — the goblin grabs
  // the bottom of this. Spans y 0.4..2.2, same as before.
  const ropeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.03, 2.2, 0),
    new THREE.Vector3(-0.02, 1.7, 0.05),
    new THREE.Vector3(-0.06, 1.2, 0.08),
    new THREE.Vector3(-0.03, 0.75, 0.05),
    new THREE.Vector3(0, 0.4, 0),
  ]);
  const ropeMesh = sketch(new THREE.TubeGeometry(ropeCurve, 24, 0.022, 5, false), 20, 'form');
  rope.add(ropeMesh);

  // strand twist — short wraps climbing the tube
  for (let i = 0; i < 6; i++) {
    const pt = ropeCurve.getPointAt(i / 6);
    const wrap = sketch(new THREE.TorusGeometry(0.026, 0.006, 4, 8), 15, 'faint');
    wrap.position.copy(pt);
    wrap.rotation.set(Math.PI / 2, 0.5, 0);
    rope.add(wrap);
  }

  // a knot near the bottom
  const knot = sketch(new THREE.IcosahedronGeometry(0.045, 0), 30, 'form');
  knot.position.copy(ropeCurve.getPointAt(0.92));
  rope.add(knot);

  // frayed end below the knot
  const frayEnd = ropeCurve.getPointAt(1);
  for (const [dx, dz] of [
    [0.02, 0],
    [-0.015, 0.015],
    [0.005, -0.02],
  ]) {
    const strand = sketch(new THREE.CylinderGeometry(0.004, 0.001, 0.08, 4), 15, 'faint');
    strand.position.set(frayEnd.x + dx, frayEnd.y - 0.04, frayEnd.z + dz);
    strand.rotation.set(dz * 4, 0, dx * 4);
    rope.add(strand);
  }

  container.add(rope);

  return { container, stageDisc, rope };
}

// The only part of him the table scene ever shows. It slides in from behind the die,
// tips it one face, and leaves.
function buildFinger(): THREE.Group {
  const g = new THREE.Group();

  const knuckle = sketch(new THREE.CylinderGeometry(0.05, 0.045, 0.17, 7), 22);
  knuckle.rotation.x = Math.PI / 2;
  knuckle.position.z = -0.085;
  g.add(knuckle);

  const tipSeg = sketch(new THREE.CylinderGeometry(0.042, 0.048, 0.13, 7), 22);
  tipSeg.rotation.set(Math.PI / 2 - 0.16, 0, 0);
  tipSeg.position.set(0, 0.012, 0.06);
  g.add(tipSeg);

  const pad = sketch(new THREE.SphereGeometry(0.042, 8, 6), 22);
  pad.position.set(0, 0.022, 0.122);
  g.add(pad);

  // one crease so it reads as a knuckle rather than a dowel
  const crease = hatch(0.07, 0.02, 40, 0, 'faint');
  crease.position.set(0, 0.048, -0.01);
  crease.rotation.x = -Math.PI / 2.4;
  g.add(crease);

  return g;
}

// C4 — tavern interior: floor, wall, table, die, DM + two players, mugs, door.
function buildTavern() {
  const container = new THREE.Group();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), fillMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(80, 0.01, 0);
  container.add(floor);

  // Floorboards running away from the lens. The room is seen from (80, 2.1, 6.2) and
  // its floor was a blank sheet with three figures standing on it; boards are the
  // cheapest thing that gives an interior a direction and a depth.
  for (let i = 0; i <= 14; i++) {
    const x = 74.4 + i * 0.8;
    container.add(
      polyline([new THREE.Vector3(x, 0.012, -4.4), new THREE.Vector3(x, 0.012, 4.4)], 'faint'),
    );
  }
  // butt joints, staggered — boards are not twelve units long
  for (const [x, z] of [
    [76.8, -1.4], [79.2, 2.1], [81.6, -2.6], [83.2, 1.2], [78.4, -3.2], [82.4, 3.0],
  ] as [number, number][]) {
    container.add(
      polyline([new THREE.Vector3(x - 0.4, 0.012, z), new THREE.Vector3(x + 0.4, 0.012, z)], 'faint'),
    );
  }

  const wall = sketch(new THREE.PlaneGeometry(12, 4), 25, 'form');
  wall.position.set(80, 2, -4);
  container.add(wall);

  // Timber framing. The back wall is the backdrop of every shot in this chapter and it
  // was one flat rectangle — posts, a beam and a rail turn it into a room someone built.
  for (const px of [-4.6, -1.8, 1.8, 4.6]) {
    const postW = sketch(new THREE.BoxGeometry(0.17, 4, 0.12), 25, 'form');
    postW.position.set(80 + px, 2, -3.94);
    container.add(postW);
  }
  for (const [py, ph] of [
    [3.72, 0.2],
    [1.05, 0.13],
  ] as [number, number][]) {
    const beam = sketch(new THREE.BoxGeometry(12, ph, 0.14), 25, 'faint');
    beam.position.set(80, py, -3.93);
    container.add(beam);
  }
  // plaster tone in the bays, so the wall carries a value instead of being paper —
  // sparse, because this is the surface every other line in the room is read against
  for (const bx of [-3.2, 0, 3.2]) {
    const bay = hatch(2.5, 2.4, 3, 1.2, 'faint');
    bay.position.set(80 + bx, 2.45, -3.92);
    container.add(bay);
  }

  // The window: a drawn frame with real mullions, a sill, and night outside. Cross-hatch
  // behind the glass is the darkest value in the room, which is what makes a window
  // read as a window rather than as four lines on a wall.
  const win = new THREE.Group();
  win.position.set(80, 2.3, -3.9);
  // loose enough to read as tone. Dense cross-hatch on a square reads as netting, and
  // the eye takes a regular grid for a mechanism rather than for darkness.
  const night = crossHatch(1.12, 1.12, 7);
  night.position.z = -0.02;
  win.add(night);
  win.add(
    polyline(
      [
        new THREE.Vector3(-0.6, -0.6, 0),
        new THREE.Vector3(0.6, -0.6, 0),
        new THREE.Vector3(0.6, 0.6, 0),
        new THREE.Vector3(-0.6, 0.6, 0),
      ],
      'form',
      true,
    ),
  );
  win.add(polyline([new THREE.Vector3(0, -0.6, 0.01), new THREE.Vector3(0, 0.6, 0.01)], 'form'));
  win.add(polyline([new THREE.Vector3(-0.6, 0, 0.01), new THREE.Vector3(0.6, 0, 0.01)], 'form'));
  const sill = sketch(new THREE.BoxGeometry(1.4, 0.07, 0.14), 25, 'form');
  sill.position.set(0, -0.66, 0.03);
  win.add(sill);
  container.add(win);

  // A hearth. The room is lit by something, the film's whole grammar is fire and light,
  // and the left third of the backdrop was empty wall.
  const hearth = new THREE.Group();
  hearth.position.set(76.4, 0, -3.85);
  const breast = sketch(new THREE.BoxGeometry(1.9, 3.4, 0.5), 25, 'form');
  breast.position.set(0, 1.7, -0.2);
  hearth.add(breast);
  const mantel = sketch(new THREE.BoxGeometry(2.2, 0.14, 0.42), 25, 'form');
  mantel.position.set(0, 1.42, 0.04);
  hearth.add(mantel);
  const fireBox = crossHatch(1.2, 1.15, 9);
  fireBox.position.set(0, 0.62, 0.06);
  hearth.add(fireBox);
  for (const [lx, ly, rot] of [
    [-0.12, 0.16, 0.25],
    [0.1, 0.28, -0.4],
  ] as [number, number, number][]) {
    const log = sketch(new THREE.CylinderGeometry(0.09, 0.1, 0.85, 6), 25, 'faint');
    log.rotation.set(0, 0.1, Math.PI / 2 + rot);
    log.position.set(lx, ly, 0.1);
    hearth.add(log);
  }
  const hearthFire = buildFlames(1);
  hearthFire.position.set(0, 0.3, 0.14);
  hearthFire.scale.setScalar(1.4);
  hearth.add(hearthFire);
  const hearthStone = sketch(new THREE.BoxGeometry(2.0, 0.09, 0.7), 25, 'faint');
  hearthStone.position.set(0, 0.045, 0.4);
  hearth.add(hearthStone);
  container.add(hearth);

  // a shelf of bottles on the other side, to answer the hearth across the backdrop
  const shelf = sketch(new THREE.BoxGeometry(2.0, 0.08, 0.28), 25, 'form');
  shelf.position.set(83.4, 1.75, -3.8);
  container.add(shelf);
  const bottleSpecs: [number, number, number][] = [
    [-0.7, 0.38, 0.1],
    [-0.32, 0.3, 0.085],
    [0.05, 0.44, 0.095],
    [0.42, 0.26, 0.08],
    [0.75, 0.35, 0.09],
  ];
  bottleSpecs.forEach(([ox, h, r]) => {
    const bottle = sketch(new THREE.CylinderGeometry(r * 0.45, r, h, 7), 25, 'faint');
    bottle.position.set(83.4 + ox, 1.79 + h / 2, -3.8);
    container.add(bottle);
    const neck = sketch(new THREE.CylinderGeometry(r * 0.3, r * 0.4, h * 0.28, 6), 25, 'faint');
    neck.position.set(83.4 + ox, 1.79 + h + h * 0.13, -3.8);
    container.add(neck);
  });

  const tableTop = sketch(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 24), 25, 'form');
  tableTop.position.set(80, 0.85, 0);
  container.add(tableTop);
  // an edge lip and radial planks: the table is the stage of this whole chapter
  const tableLip = sketch(new THREE.CylinderGeometry(1.64, 1.64, 0.05, 24), 25, 'faint');
  tableLip.position.set(80, 0.83, 0);
  container.add(tableLip);
  // Parallel plank seams, not radial ones. Spokes converge on the middle of the table,
  // which is exactly where the die comes to rest — the macro shot had a sunburst
  // firing out from behind it. Boards on a round table are cut as chords anyway.
  for (const oz of [-1.2, -0.7, -0.2, 0.3, 0.8, 1.3]) {
    const half = Math.sqrt(Math.max(0, 1.57 * 1.57 - oz * oz));
    container.add(
      polyline(
        [new THREE.Vector3(80 - half, 0.912, oz), new THREE.Vector3(80 + half, 0.912, oz)],
        'faint',
      ),
    );
  }
  // wear on the tabletop, kept off the die's rest spot and out of the finger's approach
  const tableWear = hatch(0.9, 0.6, 7, 0.4, 'faint');
  tableWear.rotation.x = -Math.PI / 2;
  tableWear.position.set(81.0, 0.913, 0.75);
  container.add(tableWear);

  const tableLeg = sketch(new THREE.CylinderGeometry(0.15, 0.2, 0.79, 12), 25, 'form');
  tableLeg.position.set(80, 0.395, 0);
  container.add(tableLeg);
  const tableFoot = sketch(new THREE.CylinderGeometry(0.52, 0.6, 0.08, 12), 25, 'faint');
  tableFoot.position.set(80, 0.04, 0);
  container.add(tableFoot);
  const tableShadow = contact(3.0, 2.2);
  tableShadow.position.set(80, 0.013, 0.1);
  container.add(tableShadow);

  const die = new THREE.Group();
  const built = dieFaces(0.35);
  const dieInner = sketch(built.geom, 25, 'hero');
  dieInner.position.set(78.6, 1.7, 0.6); // tumbles to rest near (80, 1.21, 0)

  // Number every face, so the die reads as a die from any angle and the camera can come
  // close enough to watch one number become another. 1 sits on the face that lands
  // upward; 20 sits on its rolling neighbour. On a real d20 those two are opposite
  // rather than adjacent — here they share an edge, because the whole gag is that one
  // small tilt is all it takes.
  const faceNumbers = [1, 20, 7, 13, 4, 16, 9, 11, 6, 14, 3, 18, 8, 12, 5, 15, 10, 2, 17, 19];
  for (let f = 0; f < built.faceCount; f++) {
    const outward = built.faceDir(f);
    const mark = numeral(faceNumbers[f] ?? f + 1, 0.1, 'form');
    mark.position.copy(outward).multiplyScalar(1.03);

    // face the numeral out along its own face, upright about that normal
    const n = outward.clone().normalize();
    // on a face that points nearly straight up or down there is no natural "up" for the
    // glyph, so it is picked to read the right way round from where the camera watches
    // the tilt rather than upside down
    const ref = Math.abs(n.y) > 0.9 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
    const mx = new THREE.Vector3().crossVectors(ref, n).normalize();
    const my = new THREE.Vector3().crossVectors(n, mx);
    mark.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(mx, my, n));

    // The 20 is only ever read after the die has tipped, when this face is the one
    // pointing up. Orienting it in its rest pose lands it upside down at the moment it
    // matters, so it is set upright in its post-tilt frame and rotated back into place.
    if (f === built.neighbour) {
      const upright = new THREE.Vector3(0, 1, 0);
      const ax = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 0, -1), upright).normalize();
      const ay = new THREE.Vector3().crossVectors(upright, ax);
      mark.quaternion
        .setFromRotationMatrix(new THREE.Matrix4().makeBasis(ax, ay, upright))
        .premultiply(
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -built.tipAngle),
        );
    }
    dieInner.add(mark);
  }

  die.add(dieInner);
  container.add(die);

  const nudgeFinger = buildFinger();
  // waits in the die's blind spot: low and just behind it, where the die itself hides
  // the finger from the camera until it rises over the back edge
  nudgeFinger.position.set(80.04, 1.02, -0.56);
  nudgeFinger.scale.setScalar(0);
  container.add(nudgeFinger);

  const dm = buildAdventurer(false);
  dm.scale.setScalar(1.3);
  dm.position.set(80, 0, -2.4);
  container.add(dm);

  const player1 = buildAdventurer(false);
  player1.position.set(78.3, 0, 1.6);
  player1.rotation.y = Math.PI; // facing the table
  container.add(player1);
  const player2 = buildAdventurer(false);
  player2.position.set(81.7, 0, 1.6);
  player2.rotation.y = Math.PI;
  container.add(player2);

  const mugOffsets: [number, number][] = [
    [-0.4, 0.3],
    [0.4, -0.2],
    [-0.85, -0.5],
  ];
  mugOffsets.forEach(([ox, oz], i) => {
    const mug = sketch(new THREE.CylinderGeometry(0.06, 0.055, 0.1, 10), 25, 'form');
    mug.position.set(80 + ox, 0.96, oz);
    container.add(mug);
    const handle = sketch(new THREE.TorusGeometry(0.035, 0.009, 4, 8, Math.PI), 20, 'faint');
    handle.rotation.set(0, Math.PI / 2 + i, 0);
    handle.position.set(80 + ox + Math.cos(i) * 0.06, 0.96, oz + Math.sin(i) * 0.06);
    container.add(handle);
  });

  // This is a table people are playing a game at — the film's whole turn is that the
  // world we just watched is the one being rolled for here. Sheets, a pencil and a
  // screen say so; a bare disc with a die on it said nothing.
  const sheetSpots: [number, number, number][] = [
    [-1.05, 0.85, 0.25],
    [1.05, 0.8, -0.35],
    [0.15, 1.15, 0.1],
  ];
  sheetSpots.forEach(([ox, oz, rot]) => {
    const sheet = sketch(new THREE.BoxGeometry(0.34, 0.008, 0.26), 25, 'faint');
    sheet.rotation.y = rot;
    sheet.position.set(80 + ox, 0.918, oz);
    container.add(sheet);
    const written = hatch(0.24, 0.17, 22, 0, 'faint');
    written.rotation.set(-Math.PI / 2, 0, rot);
    written.position.set(80 + ox, 0.924, oz);
    container.add(written);
  });
  const pencilStub = sketch(new THREE.CylinderGeometry(0.011, 0.011, 0.17, 6), 25, 'faint');
  pencilStub.rotation.set(0, 0.5, Math.PI / 2);
  pencilStub.position.set(78.85, 0.925, 0.6);
  container.add(pencilStub);

  // the screen sits off the die's axis on purpose: the tilt is watched down the line
  // from (80.42, 2.42, 1.5), and anything directly behind the die crowds that frame
  const screen = new THREE.Group();
  screen.position.set(78.35, 0.91, -1.28);
  screen.rotation.y = 0.62;
  for (const [px, pr] of [
    [-0.29, 0.5],
    [0, 0],
    [0.29, -0.5],
  ] as [number, number][]) {
    const panel = sketch(new THREE.BoxGeometry(0.3, 0.34, 0.02), 25, 'form');
    panel.position.set(px, 0.17, 0);
    panel.rotation.y = pr;
    screen.add(panel);
    // the referee's side of a screen is covered in tables; three blank white slabs
    // read as a projector screen standing on the table
    const printed = hatch(0.22, 0.24, 12, 0, 'faint');
    printed.position.set(px + Math.sin(pr) * 0.012, 0.17, Math.cos(pr) * 0.012);
    printed.rotation.y = pr;
    screen.add(printed);
  }
  container.add(screen);

  // a candle on the table — the room's light has to come from somewhere in frame
  const candlestick = sketch(new THREE.CylinderGeometry(0.05, 0.09, 0.05, 8), 25, 'faint');
  candlestick.position.set(81.3, 0.94, -0.8);
  const candleShaft = sketch(new THREE.CylinderGeometry(0.028, 0.032, 0.26, 8), 25, 'faint');
  candleShaft.position.set(81.3, 1.09, -0.8);
  // small: at 0.11 tall on a 0.26 candle this read as a rocket standing on the table
  const candleFlame = sketch(new THREE.ConeGeometry(0.02, 0.06, 6), 18, 'form');
  candleFlame.position.set(81.3, 1.25, -0.8);
  container.add(candlestick, candleShaft, candleFlame);

  // seating, so three figures standing round a table read as three people at a table
  const buildBench = (x: number, z: number, len: number, rot: number): THREE.Group => {
    const b = new THREE.Group();
    b.position.set(x, 0, z);
    b.rotation.y = rot;
    const seat = sketch(new THREE.BoxGeometry(len, 0.09, 0.34), 25, 'faint');
    seat.position.y = 0.44;
    b.add(seat);
    for (const lx of [-len / 2 + 0.14, len / 2 - 0.14]) {
      const legB = sketch(new THREE.BoxGeometry(0.08, 0.44, 0.28), 25, 'faint');
      legB.position.set(lx, 0.22, 0);
      b.add(legB);
    }
    b.add(contact(len * 1.1, 0.5));
    return b;
  };
  container.add(buildBench(78.3, 2.35, 1.3, 0));
  container.add(buildBench(81.7, 2.35, 1.3, 0));
  container.add(buildBench(80, -3.15, 1.1, 0.12));

  // the door out — planks and a frame, drawn rather than ruled
  const door = new THREE.Group();
  door.position.set(83.8, 1, 1.5);
  door.rotation.y = Math.PI / 2; // faces into the room
  const doorSlab2 = sketch(new THREE.BoxGeometry(1.0, 2.0, 0.08), 25, 'form');
  door.add(doorSlab2);
  for (const px of [-0.32, 0, 0.32]) {
    const plank = sketch(new THREE.BoxGeometry(0.02, 1.9, 0.1), 25, 'faint');
    plank.position.x = px;
    door.add(plank);
  }
  for (const py of [0.6, -0.6]) {
    const band = sketch(new THREE.BoxGeometry(1.0, 0.06, 0.11), 25, 'faint');
    band.position.y = py;
    door.add(band);
  }
  const knob = sketch(new THREE.SphereGeometry(0.05, 7, 5), 25, 'faint', 0.006);
  knob.position.set(0.38, -0.05, 0.08);
  door.add(knob);
  container.add(door);

  return { container, die, dieInner, dieTipAngle: built.tipAngle, nudgeFinger };
}

// C5 — six montage vignette platforms at z=-40, x = 0/8/16/24/32/40.
function buildMontage() {
  const container = new THREE.Group();
  const Z = -40;
  const xs = [0, 8, 16, 24, 32, 40];

  xs.forEach((x) => {
    const platform = sketch(new THREE.CylinderGeometry(2.5, 2.5, 0.2, 24), 25, 'form');
    platform.position.set(x, 0.1, Z);
    container.add(platform);
    // a rim and a shadow — each cut opens on this disc, and a bare cylinder edge was
    // the first thing every one of the six frames showed
    const rim = sketch(new THREE.CylinderGeometry(2.56, 2.56, 0.07, 24), 25, 'faint');
    rim.position.set(x, 0.045, Z);
    container.add(rim);
    const ring = hatch(4.7, 0.5, 6, 0, 'faint');
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.203, Z + 1.9);
    container.add(ring);
    const under = contact(5.4, 3.4);
    under.position.set(x, 0.012, Z);
    container.add(under);
  });

  // vignette 0 — map table with a road being drawn, anchored at its -x end
  const mapTable = sketch(new THREE.BoxGeometry(1.6, 0.08, 1.0), 25, 'form');
  mapTable.position.set(xs[0], 0.9, Z);
  container.add(mapTable);
  // it was a slab hanging in mid-air over the platform
  for (const [lx, lz] of [
    [-0.68, -0.38], [0.68, -0.38], [-0.68, 0.38], [0.68, 0.38],
  ] as [number, number][]) {
    const leg = sketch(new THREE.BoxGeometry(0.07, 0.66, 0.07), 25, 'faint');
    leg.position.set(xs[0] + lx, 0.53, Z + lz);
    container.add(leg);
  }
  // The map he is drawing the road onto. It is wider than the table on purpose — the
  // road grows to 1.8 across, and a road running off the edge of its own map was the
  // thing that made the first cut read as a plank rather than a drawing.
  const mapSheet = sketch(new THREE.BoxGeometry(1.88, 0.01, 0.86), 25, 'faint');
  mapSheet.position.set(xs[0], 0.948, Z);
  container.add(mapSheet);
  const coastline = curveLine(
    [
      new THREE.Vector3(xs[0] - 0.6, 0.956, Z + 0.32),
      new THREE.Vector3(xs[0] - 0.15, 0.956, Z + 0.05),
      new THREE.Vector3(xs[0] + 0.2, 0.956, Z + 0.3),
      new THREE.Vector3(xs[0] + 0.62, 0.956, Z + 0.12),
    ],
    'faint',
    14,
  );
  container.add(coastline);
  for (const [wx, wz] of [
    [-0.84, -0.35], [0.84, 0.35],
  ] as [number, number][]) {
    const weightStone = sketch(new THREE.DodecahedronGeometry(0.06), 25, 'faint');
    weightStone.position.set(xs[0] + wx, 0.98, Z + wz);
    container.add(weightStone);
  }
  const inkpot = sketch(new THREE.CylinderGeometry(0.07, 0.085, 0.11, 8), 25, 'faint');
  inkpot.position.set(xs[0] + 0.52, 1.0, Z - 0.3);
  container.add(inkpot);
  const quill = sketch(new THREE.ConeGeometry(0.022, 0.34, 5), 20, 'faint');
  quill.rotation.set(0.4, 0, 0.35);
  quill.position.set(xs[0] + 0.52, 1.2, Z - 0.3);
  container.add(quill);
  const roadLine = new THREE.Group();
  // 1.8 long, not 3: a three-unit road cannot fit a phone frame at any distance close
  // enough to read the goblin drawing it, and it overhung the table on both sides.
  roadLine.position.set(xs[0] - 0.9, 0.96, Z);
  roadLine.scale.x = 0;
  const roadBox = sketch(new THREE.BoxGeometry(1.8, 0.02, 0.12));
  roadBox.position.x = 0.9; // grows away from the anchor as scale.x -> 1
  roadLine.add(roadBox);
  container.add(roadLine);

  // vignette 1 — monster: spiked sphere + horns
  const monster = new THREE.Group();
  monster.position.set(xs[1], 0.9, Z);
  monster.scale.set(0, 0, 0);
  // 8x6, not 14x10: a smooth sphere has no silhouette for EdgesGeometry to draw, so at
  // 14x10 the monster rendered as a grey blob with spikes and no outline at all. Coarse
  // facets give it real edges, and a lumpy hide suits it better than a ball anyway.
  monster.add(sketch(new THREE.SphereGeometry(0.7, 8, 6), 25, 'form', 0.02));
  const spikeCount = 6;
  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2;
    const spike = sketch(new THREE.ConeGeometry(0.08, 0.35, 6));
    spike.position.set(Math.cos(a) * 0.65, 0.1, Math.sin(a) * 0.65);
    spike.rotation.x = 1.2; // tilt outward from vertical
    spike.rotation.y = -a;
    monster.add(spike);
  }
  const hornL = sketch(new THREE.ConeGeometry(0.06, 0.3, 6));
  hornL.position.set(-0.2, 0.65, 0.3);
  hornL.rotation.x = -0.4;
  const hornR = sketch(new THREE.ConeGeometry(0.06, 0.3, 6));
  hornR.position.set(0.2, 0.65, 0.3);
  hornR.rotation.x = -0.4;
  monster.add(hornL, hornR);

  // A face. It had horns and spikes and no front, which made it a hazard rather than a
  // monster — and this cut is the one where he stages a monster for someone to fight.
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), inkMaterial);
    eye.position.set(side * 0.23, 0.26, 0.62);
    monster.add(eye);
    const ridge = sketch(new THREE.BoxGeometry(0.24, 0.07, 0.1), 25, 'form');
    ridge.position.set(side * 0.23, 0.4, 0.58);
    ridge.rotation.z = side * -0.3;
    monster.add(ridge);
    const claw = sketch(new THREE.ConeGeometry(0.07, 0.26, 5), 22, 'form');
    claw.position.set(side * 0.42, -0.58, 0.42);
    claw.rotation.x = 1.9;
    monster.add(claw);
  }
  const maw = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), inkMaterial);
  maw.scale.set(1, 0.42, 0.4);
  maw.position.set(0, -0.1, 0.63);
  monster.add(maw);
  for (let i = 0; i < 5; i++) {
    const tooth = sketch(new THREE.ConeGeometry(0.038, 0.13, 4), 20, 'form');
    tooth.position.set(-0.19 + i * 0.095, -0.04, 0.71);
    tooth.rotation.x = Math.PI; // points down out of the mouth
    monster.add(tooth);
  }
  const tail = sketch(new THREE.ConeGeometry(0.13, 0.75, 6), 22, 'form');
  tail.position.set(-0.1, -0.35, -0.62);
  tail.rotation.set(-2.3, 0, 0.25);
  monster.add(tail);
  container.add(monster);

  // vignette 2 — tavern wall fragment + bracket + hanging sign
  // 1.7x1.5, not 2x2: a wall more than twice the goblin's height read as a blank plane
  // filling the frame, and the bracket at 1.6 put the sign's whole drop above his head.
  const wallFrag = sketch(new THREE.BoxGeometry(1.7, 1.5, 0.15), 25, 'form');
  wallFrag.position.set(xs[2], 0.75, Z - 0.4);
  container.add(wallFrag);
  // planks, a plinth and a shuttered window — a blank slab was the whole set for the
  // cut that is supposed to say "tavern"
  for (const px of [-0.62, -0.21, 0.21, 0.62]) {
    const plank = sketch(new THREE.BoxGeometry(0.025, 1.44, 0.17), 25, 'faint');
    plank.position.set(xs[2] + px, 0.75, Z - 0.4);
    container.add(plank);
  }
  const plinth = sketch(new THREE.BoxGeometry(1.8, 0.16, 0.22), 25, 'faint');
  plinth.position.set(xs[2], 0.28, Z - 0.38);
  container.add(plinth);
  const fragWindow = crossHatch(0.3, 0.34, 8);
  fragWindow.position.set(xs[2] + 0.55, 1.06, Z - 0.31);
  container.add(fragWindow);
  container.add(
    polyline(
      [
        new THREE.Vector3(xs[2] + 0.4, 0.89, Z - 0.3),
        new THREE.Vector3(xs[2] + 0.7, 0.89, Z - 0.3),
        new THREE.Vector3(xs[2] + 0.7, 1.23, Z - 0.3),
        new THREE.Vector3(xs[2] + 0.4, 1.23, Z - 0.3),
      ],
      'form',
      true,
    ),
  );

  const bracket = sketch(new THREE.BoxGeometry(0.5, 0.06, 0.06), 25, 'form');
  bracket.position.set(xs[2], 1.2, Z - 0.3);
  container.add(bracket);
  // A diagonal brace from the wall face up to the bracket's outer end. Sized and seated
  // off its own endpoints — floated by eye it came out as a loose stick crossing the
  // wall with both ends in mid-air.
  const braceFrom = new THREE.Vector3(xs[2] - 0.24, 0.94, Z - 0.33);
  const braceTo = new THREE.Vector3(xs[2] - 0.02, 1.17, Z - 0.3);
  const braceMid = braceFrom.clone().lerp(braceTo, 0.5);
  const brace = sketch(
    new THREE.BoxGeometry(braceFrom.distanceTo(braceTo), 0.04, 0.04),
    25,
    'faint',
  );
  brace.position.copy(braceMid);
  brace.rotation.z = Math.atan2(braceTo.y - braceFrom.y, braceTo.x - braceFrom.x);
  container.add(brace);

  const tavernSign = new THREE.Group();
  tavernSign.position.set(xs[2], 1.2 + 0.95, Z - 0.3); // 0.95 above its bracket
  tavernSign.add(sketch(new THREE.BoxGeometry(0.7, 0.4, 0.05), 25, 'form'));
  // a painted device and a border: this sign is read at 1.5 units in a close cut
  const signBorder = polyline(
    [
      new THREE.Vector3(-0.29, -0.15, 0.03),
      new THREE.Vector3(0.29, -0.15, 0.03),
      new THREE.Vector3(0.29, 0.15, 0.03),
      new THREE.Vector3(-0.29, 0.15, 0.03),
    ],
    'faint',
    true,
  );
  tavernSign.add(signBorder);
  const device = hatch(0.34, 0.16, 16, -0.4, 'faint');
  device.position.set(0, 0, 0.035);
  tavernSign.add(device);
  for (const hx of [-0.26, 0.26]) {
    const hook = sketch(new THREE.TorusGeometry(0.035, 0.008, 4, 8), 20, 'faint');
    hook.position.set(hx, 0.22, 0);
    tavernSign.add(hook);
  }
  container.add(tavernSign);

  // vignette 3 — three pines. The mound and the stump stay outside `trees5`: those
  // scale from zero as he plants them, and ground he planted them in cannot pop in too.
  const mound = hatch(2.2, 1.5, 5, 0.3, 'faint');
  mound.rotation.x = -Math.PI / 2;
  mound.position.set(xs[3], 0.203, Z + 0.15);
  container.add(mound);
  const oldStump = sketch(new THREE.CylinderGeometry(0.22, 0.26, 0.3, 9), 25, 'faint');
  oldStump.position.set(xs[3] - 1.0, 0.35, Z - 0.7);
  container.add(oldStump);
  const stumpRings = hatch(0.34, 0.34, 10, 0.3, 'faint');
  stumpRings.rotation.x = -Math.PI / 2;
  stumpRings.position.set(xs[3] - 1.0, 0.503, Z - 0.7);
  container.add(stumpRings);

  const treeOffsets: [number, number][] = [
    [-0.5, 0.3],
    [0.4, -0.2],
    [0, 0.6],
  ];
  const trees5 = treeOffsets.map(([ox, oz]) => {
    const t = buildPine(0.5, 1.4);
    t.position.set(xs[3] + ox, 0.2, Z + oz);
    t.scale.set(0, 0, 0);
    container.add(t);
    return t;
  });

  // vignette 4 — chest, with a floor to be found on
  const chest5 = buildChest(xs[4], 0.2, Z);
  container.add(chest5.container);
  const hoardTone = hatch(2.0, 1.3, 5, -0.35, 'faint');
  hoardTone.rotation.x = -Math.PI / 2;
  hoardTone.position.set(xs[4], 0.203, Z + 0.1);
  container.add(hoardTone);
  for (const [cx, cz, cr] of [
    [-0.95, -0.55, 0.22],
    [0.9, -0.7, 0.17],
  ] as [number, number, number][]) {
    const crate = sketch(new THREE.BoxGeometry(cr * 2, cr * 1.7, cr * 1.8), 25, 'faint');
    crate.position.set(xs[4] + cx, 0.2 + cr * 0.85, Z + cz);
    crate.rotation.y = cx * 0.6;
    container.add(crate);
  }

  // vignette 5 — three candles + rays. No flames are drawn: the ray burst is this
  // film's word for light, and a lit candle before he lights it gives the cut away.
  const candleTable = sketch(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 16), 25, 'form');
  candleTable.position.set(xs[5], 0.9, Z);
  container.add(candleTable);
  const candleLeg = sketch(new THREE.CylinderGeometry(0.09, 0.14, 0.62, 8), 25, 'faint');
  candleLeg.position.set(xs[5], 0.55, Z);
  container.add(candleLeg);
  const candleOffsets: [number, number][] = [
    [-0.25, 0],
    [0.15, 0.15],
    [0.1, -0.2],
  ];
  candleOffsets.forEach(([ox, oz], i) => {
    const candle = sketch(new THREE.CylinderGeometry(0.03, 0.034, 0.2 + i * 0.04, 8), 25, 'form');
    candle.position.set(xs[5] + ox, 1.04 + i * 0.02, Z + oz);
    container.add(candle);
    // a wick, and wax that has run down one side
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.035), inkMaterial);
    wick.position.set(xs[5] + ox, 1.16 + i * 0.04, Z + oz);
    container.add(wick);
    const drip = sketch(new THREE.CylinderGeometry(0.008, 0.014, 0.07, 5), 25, 'faint');
    drip.position.set(xs[5] + ox + 0.031, 1.05 + i * 0.03, Z + oz);
    container.add(drip);
    const holder = sketch(new THREE.CylinderGeometry(0.055, 0.07, 0.03, 8), 25, 'faint');
    holder.position.set(xs[5] + ox, 0.955, Z + oz);
    container.add(holder);
  });
  // an open book under the light — the smallest cut in the montage needed one more
  // thing in frame than three sticks
  const book = sketch(new THREE.BoxGeometry(0.4, 0.035, 0.28), 25, 'faint');
  book.rotation.y = 0.3;
  book.position.set(xs[5] - 0.02, 0.96, Z + 0.3);
  container.add(book);
  const written5 = hatch(0.3, 0.18, 20, 0, 'faint');
  written5.rotation.set(-Math.PI / 2, 0, 0.3);
  written5.position.set(xs[5] - 0.02, 0.979, Z + 0.3);
  container.add(written5);

  const candleRays = buildRayBurst(xs[5], 1.15, Z);
  container.add(candleRays);

  return {
    container,
    roadLine,
    monster,
    tavernSign,
    trees5,
    chest5Lid: chest5.lid,
    chest5Coins: chest5.coins,
    candleRays,
  };
}

// C6 — cliff + miniature world (flattened during the rise) + C7 die2/board.
function buildCliffWorld() {
  const container = new THREE.Group();

  // The climactic set piece. The camera arrives above the rim looking down at the
  // goblin (who stands at local x=2.6, y=6) and then rises to dead top-down, so what
  // reads here is the plateau's outline and its top surface — not the side faces.
  // A square box gave both away; seven-sided tiers give it a rock outline from above
  // and a stepped face as the camera lifts.
  const cliff = new THREE.Group();
  cliff.position.set(120, 0, 0);

  // [radiusTop, radiusBottom, height, y, spin] — top of the stack lands exactly at y=6
  const tiers: [number, number, number, number, number][] = [
    [3.6, 4.05, 2.2, 1.1, 0],
    [3.35, 3.65, 2.2, 3.3, 0.42],
    [3.2, 3.45, 1.6, 5.2, 0.83],
  ];
  for (const [rt, rb, h, y, spin] of tiers) {
    const tier = sketch(new THREE.CylinderGeometry(rt, rb, h, 7));
    tier.position.y = y;
    tier.rotation.y = spin; // stagger the facets so the tiers don't stack into one prism
    cliff.add(tier);
  }

  // fractured rock on the plateau, kept clear of the goblin's stance at local x=2.6
  const cracks: [number, number, number, number, number][] = [
    [-1.4, 0.6, 2.2, 1.1, 0.4],
    [0.3, -1.5, 1.6, 0.9, -0.9],
  ];
  cracks.forEach(([cx, cz, w, h, angle]) => {
    const crack = hatch(w, h, 4, angle);
    crack.rotation.x = -Math.PI / 2;
    crack.position.set(cx, 6.01, cz);
    cliff.add(crack);
  });

  // loose rock: a couple on the top, and talus fallen around the base
  const chunkSpots: [number, number, number, number][] = [
    [-2, 6.2, 2, 0.5],
    [2.3, 6.15, -1.6, 0.45],
    [-3.6, 0.4, 2.9, 0.55],
    [3.4, 0.3, 3.1, 0.42],
    [-2.4, 0.35, -3.7, 0.5],
    [3.9, 0.25, -2.4, 0.36],
  ];
  chunkSpots.forEach(([ox, oy, oz, r]) => {
    const chunk = sketch(new THREE.DodecahedronGeometry(r));
    chunk.position.set(ox, oy, oz);
    cliff.add(chunk);
  });
  container.add(cliff);

  const miniWorld: THREE.Group[] = [];

  const housePositions: [number, number][] = [
    [132, -12],
    [138, 6],
    [144, -6],
    [150, 14],
    [156, -14],
    [162, 4],
    [168, -8],
    [135, 10],
  ];
  housePositions.forEach(([x, z]) => {
    const h = buildHouse();
    h.position.set(x, 0, z);
    container.add(h);
    miniWorld.push(h);
  });

  const pinePositions: [number, number][] = [
    [131, 4],
    [134, -8],
    [137, 12],
    [140, -3],
    [143, 8],
    [146, -12],
    [149, 2],
    [152, -16],
    [155, 10],
    [158, -4],
    [161, 14],
    [166, -10],
  ];
  pinePositions.forEach(([x, z]) => {
    const p = buildPine(0.18, 0.5, 0.05);
    p.position.set(x, 0, z);
    container.add(p);
    miniWorld.push(p);
  });

  // The one landmark on the miniature. A bare cone flattens into a bare disc, so it
  // gets ridges and a shaded flank — and it stays a Group so the flatten tween still
  // takes the whole massif down together.
  const mountain = new THREE.Group();
  mountain.position.set(160, 0, 0);
  // same edge-threshold trap as the theatre peaks: a broad cone draws nothing at 25
  const massif = sketch(new THREE.ConeGeometry(2, 3, 12), 15, 'form', 0.02);
  massif.position.y = 1.5;
  mountain.add(massif);
  for (const [sx, sz, sr, sh] of [
    [-1.5, 1.4, 0.9, 1.5],
    [1.7, -1.1, 0.75, 1.2],
  ] as [number, number, number, number][]) {
    const shoulder = sketch(new THREE.ConeGeometry(sr, sh, 9), 15, 'faint');
    shoulder.position.set(sx, sh / 2, sz);
    mountain.add(shoulder);
  }
  for (const a of [0.4, 2.1, 4.0]) {
    mountain.add(
      polyline(
        [
          new THREE.Vector3(0, 3, 0),
          new THREE.Vector3(Math.cos(a) * 0.8, 1.55, Math.sin(a) * 0.8),
          new THREE.Vector3(Math.cos(a + 0.2) * 1.9, 0.05, Math.sin(a + 0.2) * 1.9),
        ],
        'faint',
      ),
    );
  }
  const massifTone = hatch(2.2, 1.5, 6, 0.4, 'faint');
  massifTone.position.set(0.7, 0.9, 1.5);
  massifTone.rotation.y = 0.5;
  mountain.add(massifTone);
  container.add(mountain);
  miniWorld.push(mountain);

  // Roads and a river, drawn rather than ruled. These were 3-point hairline polylines
  // across a 40×32 footprint — the straightest, thinnest marks in a film about
  // hand-drawn line-work, and the camera ends the story looking straight down at them.
  const roadA: [number, number][] = [
    [130, 0], [138, -1.4], [146, -3.2], [154, -2.0], [162, 0.4], [170, 2],
  ];
  const roadB: [number, number][] = [
    [135, 15], [142, 12.2], [150, 10], [158, 12.4], [165, 16],
  ];
  for (const road of [roadA, roadB]) {
    // two edges make a road; one line makes a boundary
    for (const side of [-0.34, 0.34]) {
      container.add(
        curveLine(
          road.map(([x, z]) => new THREE.Vector3(x, 0.02, z + side)),
          'form',
          28,
        ),
      );
    }
  }

  const riverPts: [number, number][] = [
    [130, -15], [137, -12.4], [145, -10], [152, -12.8], [160, -17],
  ];
  for (const side of [-0.85, 0.85]) {
    container.add(
      curveLine(
        riverPts.map(([x, z]) => new THREE.Vector3(x, 0.02, z + side)),
        'form',
        28,
      ),
    );
  }
  // Water tone in short reaches that follow the meander. One long straight patch per
  // stretch cannot bend with the river, so its strokes drifted off the channel and
  // landed across the fields and the road instead.
  const riverCurve = new THREE.CatmullRomCurve3(
    riverPts.map(([x, z]) => new THREE.Vector3(x, 0.021, z)),
  );
  for (let i = 0; i < 6; i++) {
    const u = (i + 0.5) / 6;
    const at = riverCurve.getPointAt(u);
    const dir = riverCurve.getTangentAt(u);
    const water = hatch(4.4, 1.25, 6, 0, 'faint');
    water.rotation.set(-Math.PI / 2, 0, -Math.atan2(dir.z, dir.x));
    water.position.copy(at);
    container.add(water);
  }

  // Worked ground. From directly overhead this is most of the picture, and it was blank
  // paper between eight houses — fields with hedges are what makes a miniature world
  // look inhabited from above.
  const fields: [number, number, number, number, number][] = [
    [136, -4, 7, 5, 0.3],
    [143, 2, 6, 5.5, -0.5],
    [151, -7, 7.5, 5, 0.15],
    [157, 6, 6.5, 6, -0.25],
    [164, -3, 6, 5, 0.45],
    [140, 17, 7, 4.5, -0.15],
  ];
  fields.forEach(([fx, fz, fw, fd, fa]) => {
    const till = hatch(fw, fd, 1.6, 0, 'faint');
    till.rotation.set(-Math.PI / 2, 0, fa);
    till.position.set(fx, 0.019, fz);
    container.add(till);
    const cos = Math.cos(fa);
    const sin = Math.sin(fa);
    const corner = (dx: number, dz: number) =>
      new THREE.Vector3(fx + dx * cos - dz * sin, 0.019, fz + dx * sin + dz * cos);
    container.add(
      polyline(
        [
          corner(-fw / 2, -fd / 2),
          corner(fw / 2, -fd / 2),
          corner(fw / 2, fd / 2),
          corner(-fw / 2, fd / 2),
        ],
        'faint',
        true,
      ),
    );
  });

  const die2 = sketch(new THREE.IcosahedronGeometry(0.5), 25, 'hero');
  die2.position.set(122.8, 6.8, 0);
  die2.scale.set(0, 0, 0);
  container.add(die2);

  // The board is the film's last image — the d20's face becomes it, and the visitor is
  // meant to land on an actual map. Floating grid lines with nothing behind them read as
  // a wireframe, so it gets paper to sit on, a double-ruled edge and corner registration
  // marks, the way a printed board is trimmed.
  //
  // Every material in this group MUST be board-local, transparent and start at opacity 0:
  // the timeline traverses the group, collects whatever it finds and fades it all up. A
  // shared material in here would drag the rest of the film up with it.
  const board = new THREE.Group();
  board.position.set(145, 35.4, 0);

  const boardFill = new THREE.Mesh(
    new THREE.PlaneGeometry(25.4, 25.4),
    new THREE.MeshBasicMaterial({
      color: PAPER,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  );
  boardFill.rotation.x = -Math.PI / 2;
  boardFill.position.y = -0.02; // under the grid, clear of z-fighting
  board.add(boardFill);

  const grid = new THREE.GridHelper(24, 24, LINE, LINE);
  const gridMat = grid.material as THREE.LineBasicMaterial;
  gridMat.transparent = true;
  gridMat.opacity = 0;
  board.add(grid);

  const boardInk = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0 });
  const ruleAt = (r: number) =>
    new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-r, 0, -r),
        new THREE.Vector3(r, 0, -r),
        new THREE.Vector3(r, 0, r),
        new THREE.Vector3(-r, 0, r),
      ]),
      boardInk,
    );
  board.add(ruleAt(12), ruleAt(12.55));

  // trim marks at the corners
  const tickPts: THREE.Vector3[] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      tickPts.push(
        new THREE.Vector3(sx * 12.9, 0, sz * 12.55),
        new THREE.Vector3(sx * 13.5, 0, sz * 12.55),
        new THREE.Vector3(sx * 12.55, 0, sz * 12.9),
        new THREE.Vector3(sx * 12.55, 0, sz * 13.5),
      );
    }
  }
  board.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tickPts), boardInk),
  );
  container.add(board);

  return { container, miniWorld, cliff, die2, board };
}

export function buildWorld(): World {
  const root = new THREE.Group();

  const goblin = buildGoblin();
  const ambush = buildAmbush(goblin);
  const pathProps = buildPathProps();
  const ground = buildGround();
  const theatre = buildTheatre();
  const tavern = buildTavern();
  const montage = buildMontage();
  const cliffWorld = buildCliffWorld();

  root.add(
    ambush.container,
    pathProps.container,
    ground,
    theatre.container,
    tavern.container,
    montage.container,
    cliffWorld.container,
  );

  return {
    root,
    look: new THREE.Vector3(0, 0.8, 0),
    timeScale: 1,
    t: 0,
    gobT: 0,
    goblin,

    ambushFlames: ambush.ambushFlames,
    adventurers: ambush.adventurers,

    fire2Flames: pathProps.fire2Flames,
    fire2Rays: pathProps.fire2Rays,
    lanternRays: pathProps.lanternRays,
    caveDoor: pathProps.caveDoor,
    chestLid: pathProps.chestLid,
    chestCoins: pathProps.chestCoins,
    ravens: pathProps.ravens,
    mushrooms: pathProps.mushrooms,
    signBoard: pathProps.signBoard,

    stageDisc: theatre.stageDisc,
    rope: theatre.rope,

    die: tavern.die,
    dieInner: tavern.dieInner,
    dieWobble: 0,
    dieTipAngle: tavern.dieTipAngle,
    nudgeFinger: tavern.nudgeFinger,

    roadLine: montage.roadLine,
    monster: montage.monster,
    tavernSign: montage.tavernSign,
    trees5: montage.trees5,
    chest5Lid: montage.chest5Lid,
    chest5Coins: montage.chest5Coins,
    candleRays: montage.candleRays,

    miniWorld: cliffWorld.miniWorld,
    cliff: cliffWorld.cliff,

    die2: cliffWorld.die2,
    board: cliffWorld.board,
  };
}
