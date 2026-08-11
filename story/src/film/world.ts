import * as THREE from 'three';
import { PAPER, LINE, fillMaterial, lineMaterial, sketch, rays, hatch, contact, weight } from './pencil';

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
function buildGoblin(): Goblin {
  const root = new THREE.Group();

  // spec pins hip height (y=0.30) but not hip width; a small split keeps
  // the two legs visually distinct instead of coincident at rest.
  const HIP_X = 0.08;

  function buildLeg(x: number): THREE.Group {
    const leg = new THREE.Group();
    leg.position.set(x, 0.3, 0);
    const mesh = sketch(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10));
    mesh.position.y = -0.15;
    leg.add(mesh);
    return leg;
  }
  const legL = buildLeg(-HIP_X);
  const legR = buildLeg(HIP_X);

  const torso = new THREE.Group();
  torso.position.y = 0.3;
  const torsoBox = sketch(new THREE.BoxGeometry(0.28, 0.34, 0.16));
  torsoBox.position.y = 0.17;
  torso.add(torsoBox);

  const head = new THREE.Group();
  head.position.y = 0.76;
  head.add(sketch(new THREE.SphereGeometry(0.16, 12, 10)));
  const nose = sketch(new THREE.ConeGeometry(0.035, 0.1, 8));
  nose.rotation.x = Math.PI / 2; // apex from +y to +z
  nose.position.z = 0.2;
  head.add(nose);
  const earGeom = new THREE.ConeGeometry(0.05, 0.26, 8);
  const earL = sketch(earGeom);
  earL.position.set(-0.13, 0.08, -0.02);
  earL.rotation.z = 0.6; // sideways-up
  const earR = sketch(earGeom);
  earR.position.set(0.13, 0.08, -0.02);
  earR.rotation.z = -0.6;
  head.add(earL, earR);

  function buildArm(x: number): { pose: THREE.Group; swing: THREE.Group } {
    const pose = new THREE.Group();
    pose.position.set(x, 0.62, 0);
    const swing = new THREE.Group();
    pose.add(swing);
    const mesh = sketch(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8));
    mesh.position.y = -0.14;
    swing.add(mesh);
    return { pose, swing };
  }
  const armL = buildArm(-0.17);
  const armR = buildArm(0.17);

  root.add(legL, legR, torso, head, armL.pose, armR.pose);

  return { root, torso, head, armL, armR, legL, legR, speed: 0 };
}

// Adventurer figure — taller than the goblin, ~1.1 units, faces +z by default.
function buildAdventurer(swordRaised: boolean): THREE.Group {
  const g = new THREE.Group();
  const body = sketch(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 10));
  body.position.y = 0.25;
  const head = sketch(new THREE.SphereGeometry(0.13, 12, 10));
  head.position.y = 0.63;
  const hat = sketch(new THREE.ConeGeometry(0.15, 0.3, 10));
  hat.position.y = 0.91;
  const sword = sketch(new THREE.BoxGeometry(0.03, 0.5, 0.03));
  sword.position.set(0.16, swordRaised ? 0.75 : 0.3, 0.05);
  sword.rotation.z = swordRaised ? -0.3 : 0;
  g.add(body, head, hat, sword);
  return g;
}

// C1 — ambush around the origin.
function buildAmbush(goblin: Goblin) {
  const container = new THREE.Group();

  const rock = sketch(new THREE.DodecahedronGeometry(0.9));
  rock.scale.y = 0.6;
  rock.position.set(0, 0, 0);
  container.add(rock);

  const ambushFlames = buildFlames(1);
  ambushFlames.position.set(-2.2, 0, 0.6);
  container.add(ambushFlames);

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

  const lanternPost = sketch(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8));
  lanternPost.position.set(10, 0.55, 0);
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
  const caveDoor = new THREE.Group();
  caveDoor.position.set(13.4, 0.8, -2); // hinge at the left edge
  const doorPlane = sketch(new THREE.PlaneGeometry(1.2, 1.6));
  doorPlane.position.x = 0.6;
  caveDoor.add(doorPlane);
  container.add(caveDoor);

  const chest = buildChest(18, 0, 0);
  container.add(chest.container);

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

  const post = sketch(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8));
  post.position.set(30, 0.5, 0);
  container.add(post);
  const signBoard = new THREE.Group();
  signBoard.position.set(30, 1.0, 0);
  signBoard.rotation.z = 0.5; // crooked
  const boardMesh = sketch(new THREE.BoxGeometry(0.6, 0.3, 0.05));
  signBoard.add(boardMesh);
  container.add(signBoard);

  return { container, fire2Flames, fire2Rays, lanternRays, caveDoor, chestLid: chest.lid, chestCoins: chest.coins, ravens, mushrooms, signBoard };
}

// Ground plane (fill only, no edges) + the hand-drawn path line under C2.
function buildGround(): THREE.Group {
  const container = new THREE.Group();

  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 300), fillMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(90, 0, 0);
  container.add(groundMesh);

  const pathPoints = [
    new THREE.Vector3(2, 0.01, 0.4),
    new THREE.Vector3(10, 0.01, -0.5),
    new THREE.Vector3(18, 0.01, 0.3),
    new THREE.Vector3(26, 0.01, -0.4),
    new THREE.Vector3(36, 0.01, 0.2),
  ];
  const pathLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pathPoints), lineMaterial);
  container.add(pathLine);

  return container;
}

// C3 — theatre set: a rotating disc, forest half facing the path at rest.
function buildTheatre() {
  const container = new THREE.Group();

  const stageDisc = new THREE.Group();
  stageDisc.position.set(44, 0, -2);
  const discMesh = sketch(new THREE.CylinderGeometry(7, 7, 0.3, 32));
  discMesh.position.y = 0.15;
  stageDisc.add(discMesh);

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

  // mountain half, local +x (swings to face camera after rotation.y += PI)
  const mountain = sketch(new THREE.ConeGeometry(3.2, 4.5, 12));
  mountain.position.set(3, 0.3 + 2.25, 0);
  stageDisc.add(mountain);
  const peak2 = sketch(new THREE.ConeGeometry(1.4, 2.2, 10));
  peak2.position.set(5, 0.3 + 1.1, 2.2);
  stageDisc.add(peak2);
  const peak3 = sketch(new THREE.ConeGeometry(1.2, 1.9, 10));
  peak3.position.set(4.6, 0.3 + 0.95, -2.4);
  stageDisc.add(peak3);

  container.add(stageDisc);

  const rope = new THREE.Group();
  rope.position.set(38.5, 0, 1);
  const ropeMesh = sketch(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6));
  ropeMesh.position.y = 1.3; // spans y 0.4..2.2
  rope.add(ropeMesh);
  container.add(rope);

  return { container, stageDisc, rope };
}

// C4 — tavern interior: floor, wall, table, die, DM + two players, mugs, door.
function buildTavern() {
  const container = new THREE.Group();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), fillMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(80, 0.01, 0);
  container.add(floor);

  const wall = sketch(new THREE.PlaneGeometry(12, 4));
  wall.position.set(80, 2, -4);
  container.add(wall);

  const windowPts = [
    new THREE.Vector3(-0.6, -0.6, 0),
    new THREE.Vector3(0.6, -0.6, 0),
    new THREE.Vector3(0.6, 0.6, 0),
    new THREE.Vector3(-0.6, 0.6, 0),
  ];
  const windowFrame = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(windowPts), lineMaterial);
  windowFrame.position.set(80, 2.3, -3.98);
  container.add(windowFrame);

  const tableTop = sketch(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 24));
  tableTop.position.set(80, 0.85, 0);
  container.add(tableTop);
  const tableLeg = sketch(new THREE.CylinderGeometry(0.15, 0.2, 0.79, 12));
  tableLeg.position.set(80, 0.395, 0);
  container.add(tableLeg);

  const die = new THREE.Group();
  const dieInner = sketch(new THREE.IcosahedronGeometry(0.35));
  dieInner.position.set(78.6, 1.7, 0.6); // tumbles to rest near (80, 1.21, 0)
  die.add(dieInner);
  container.add(die);

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
  ];
  mugOffsets.forEach(([ox, oz]) => {
    const mug = sketch(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 10));
    mug.position.set(80 + ox, 0.96, oz);
    container.add(mug);
  });

  const doorPts = [
    new THREE.Vector3(-0.5, -1, 0),
    new THREE.Vector3(0.5, -1, 0),
    new THREE.Vector3(0.5, 1, 0),
    new THREE.Vector3(-0.5, 1, 0),
  ];
  const doorFrame = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(doorPts), lineMaterial);
  doorFrame.position.set(83.8, 1, 1.5);
  doorFrame.rotation.y = Math.PI / 2; // faces into the room
  container.add(doorFrame);

  return { container, die, dieInner };
}

// C5 — six montage vignette platforms at z=-40, x = 0/8/16/24/32/40.
function buildMontage() {
  const container = new THREE.Group();
  const Z = -40;
  const xs = [0, 8, 16, 24, 32, 40];

  xs.forEach((x) => {
    const platform = sketch(new THREE.CylinderGeometry(2.5, 2.5, 0.2, 24));
    platform.position.set(x, 0.1, Z);
    container.add(platform);
  });

  // vignette 0 — map table with a road being drawn, anchored at its -x end
  const mapTable = sketch(new THREE.BoxGeometry(1.6, 0.08, 1.0));
  mapTable.position.set(xs[0], 0.9, Z);
  container.add(mapTable);
  const roadLine = new THREE.Group();
  roadLine.position.set(xs[0] - 1.5, 0.96, Z);
  roadLine.scale.x = 0;
  const roadBox = sketch(new THREE.BoxGeometry(3, 0.02, 0.12));
  roadBox.position.x = 1.5; // grows away from the anchor as scale.x -> 1
  roadLine.add(roadBox);
  container.add(roadLine);

  // vignette 1 — monster: spiked sphere + horns
  const monster = new THREE.Group();
  monster.position.set(xs[1], 0.9, Z);
  monster.scale.set(0, 0, 0);
  monster.add(sketch(new THREE.SphereGeometry(0.7, 14, 10)));
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
  container.add(monster);

  // vignette 2 — tavern wall fragment + bracket + hanging sign
  const wallFrag = sketch(new THREE.BoxGeometry(2, 2, 0.15));
  wallFrag.position.set(xs[2], 1, Z - 0.4);
  container.add(wallFrag);
  const bracket = sketch(new THREE.BoxGeometry(0.5, 0.06, 0.06));
  bracket.position.set(xs[2], 1.6, Z - 0.3);
  container.add(bracket);
  const tavernSign = new THREE.Group();
  tavernSign.position.set(xs[2], 1.6 + 1.2, Z - 0.3); // 1.2 above its bracket
  tavernSign.add(sketch(new THREE.BoxGeometry(0.7, 0.4, 0.05)));
  container.add(tavernSign);

  // vignette 3 — three pines
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

  // vignette 4 — chest
  const chest5 = buildChest(xs[4], 0.2, Z);
  container.add(chest5.container);

  // vignette 5 — three candles + rays
  const candleTable = sketch(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 16));
  candleTable.position.set(xs[5], 0.9, Z);
  container.add(candleTable);
  const candleOffsets: [number, number][] = [
    [-0.25, 0],
    [0.15, 0.15],
    [0.1, -0.2],
  ];
  candleOffsets.forEach(([ox, oz]) => {
    const candle = sketch(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8));
    candle.position.set(xs[5] + ox, 1.04, Z + oz);
    container.add(candle);
  });
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

  const mountain = sketch(new THREE.ConeGeometry(2, 3, 12));
  mountain.position.set(160, 1.5, 0);
  container.add(mountain);
  miniWorld.push(mountain);

  const roadA = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(130, 0.02, 0),
      new THREE.Vector3(150, 0.02, -3),
      new THREE.Vector3(170, 0.02, 2),
    ]),
    lineMaterial,
  );
  const roadB = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(135, 0.02, 15),
      new THREE.Vector3(150, 0.02, 10),
      new THREE.Vector3(165, 0.02, 16),
    ]),
    lineMaterial,
  );
  const river = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(130, 0.02, -15),
      new THREE.Vector3(145, 0.02, -10),
      new THREE.Vector3(160, 0.02, -17),
    ]),
    lineMaterial,
  );
  container.add(roadA, roadB, river);

  const die2 = sketch(new THREE.IcosahedronGeometry(0.5));
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
