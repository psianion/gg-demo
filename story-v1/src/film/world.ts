import * as THREE from 'three';
import { dieFaces } from './dieGeometry.ts';
import { blobs, ball, type Blob } from './sculpt.ts';
import * as P from './palette.ts';
import {
  PAPER,
  LINE,
  type Paint,
  paint,
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
  plate,
  score,
  roughen,
  type Weight,
} from './pencil.ts';

// ---------------------------------------------------------------------------
// Sculpt vocabulary. Every organic body in the film — limbs, rocks, stumps,
// birds, heads — is a blended-mass sculpt built from these shared ball lists,
// scaled and turned per site. blobs() caches by ball list, so each form
// polygonises exactly once however many times it ships.
// Carpentry stays straight-edged on purpose: a house, a door, a sword are the
// bible's S-class — drawn with a straightedge in the source art too. Sculpting
// is for things that grew.
// ---------------------------------------------------------------------------

// a tapered organic column in unit space — limbs and logs. Spans y ≈ 0.05..1.0,
// girth ≈ 0.32 across.
const COLUMN: Blob[] = [
  ball(0.5, 0.84, 0.5, 0.16),
  ball(0.5, 0.62, 0.5, 0.145),
  ball(0.5, 0.4, 0.5, 0.135),
  ball(0.5, 0.17, 0.5, 0.125),
];

// a lumpy boulder — masses set off-centre so every rotation is a new rock
const BOULDER: Blob[] = [
  ball(0.45, 0.42, 0.5, 0.2),
  ball(0.62, 0.48, 0.56, 0.15),
  ball(0.55, 0.36, 0.38, 0.14),
  ball(0.36, 0.5, 0.6, 0.11),
];

// a cut stump: squat trunk over a root flare
const STUMP: Blob[] = [
  ball(0.5, 0.6, 0.5, 0.17),
  ball(0.5, 0.35, 0.5, 0.2),
  ball(0.32, 0.28, 0.5, 0.09),
  ball(0.66, 0.3, 0.62, 0.08),
  ball(0.6, 0.28, 0.34, 0.08),
];

// A sculpted limb segment hung from its top pivot, exactly where the old
// cylinders hung: spans y in [-len, 0], centred on x/z. One cached sculpt
// serves every arm and leg in the film — the per-limb taper differences the
// cylinders carried were never visible at film scale.
function limb(radius: number, len: number, w: Weight = 'form', shell = 0.004): THREE.Group {
  const g = new THREE.Group();
  const s = radius / 0.16;
  const seg = sketch(blobs(COLUMN, 26), 60, w, shell);
  seg.scale.set(s, len, s);
  seg.position.set(-0.5 * s, -len, -0.5 * s);
  g.add(seg);
  return g;
}

// A standing sculpted trunk: the COLUMN flipped root-heavy, base at y=0,
// girth `d` across. Grown wood, not turned wood.
function trunkOf(d: number, h: number, w: Weight = 'faint'): THREE.Group {
  const g = new THREE.Group();
  const s = d / 0.32;
  const m = sketch(blobs(COLUMN, 26), 60, w);
  m.scale.set(s, h, s);
  m.rotation.z = Math.PI; // the unit column is thickest at its top — flip it rootward
  m.position.set(0.5 * s, h, -0.5 * s);
  g.add(m);
  return g;
}

// A sculpted rock, `w` wide, centred on its own mass like the dodecahedra it
// replaces. `turn` spins the shared form so no two rocks repeat a silhouette.
// LOW-POLY, per the art-bible rocks card (a KEEP): "facets ARE the drawing — flat
// tops, settled bases". The metaball boulder this replaced read as a smooth floating
// egg beside the cave door — the exact soft-blob trap the bible calls out. A flattened
// dodecahedron keeps real facets for the lit render to shade plane by plane; the
// gentle roughen warps them hand-cut without melting the edges.
function rock(w: number, tier: Weight = 'faint', turn = 0): THREE.Group {
  const g = new THREE.Group();
  const geom = roughen(new THREE.DodecahedronGeometry(w * 0.5, 0), w * 0.055, 2.5 / w, turn);
  const m = sketch(geom, 25, tier);
  m.scale.y = 0.72; // flat top, settled base
  g.add(m);
  g.rotation.y = turn;
  return g;
}

// A ray burst wrapped in a Group so timeline can own its scale (and ambient
// rotation reads world.t elsewhere) — every "*Rays" field is this shape.
function buildRayBurst(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.set(0, 0, 0);
  // The one stroke colour in the film that isn't ink — light is a drawn mark that gains
  // a colour, never a baked glow.
  const burst = rays();
  paint(burst, { line: P.rayGold });
  g.add(burst);
  return g;
}

// A wizard's bolt: a bright drawn streak with a small flare at the tip — light as a
// moving mark, same rule as buildRayBurst above. Hidden until the timeline arcs it.
function buildBolt(): THREE.Group {
  const g = new THREE.Group();
  g.visible = false;
  const streak = polyline([new THREE.Vector3(0, 0, -0.45), new THREE.Vector3(0, 0, 0)], 'hero');
  paint(streak, { line: P.rayGold });
  g.add(streak);
  const flare = rays(6, 0.02, 0.05, 'form');
  paint(flare, { line: P.rayGold });
  g.add(flare);
  return g;
}

// Campfire/lantern flame. This is the film's proof that time stopped, so it has to
// read as fire at a glance: tongues of different heights leaning off-vertical, not a
// stack of symmetrical cones. Film.tsx drives scale off userData.lit.
function buildFlames(lit: number): THREE.Group {
  const g = new THREE.Group();
  g.userData.lit = lit;

  // [radius, height, x, z, lean] — the lean is what stops them reading as traffic cones.
  // Every fire in the film (ambush, path, hearth) shares one token set, so it self-paints
  // here rather than at each call site: flame-core on the tall central tongue, flame-body
  // on the rest. Fire is amber/gold only — never red, which is the tunic's colour alone —
  // so the strokes stay plain ink; only the fill carries the colour.
  const tongues: [number, number, number, number, number][] = [
    [0.12, 0.42, 0, 0, 0.05],
    [0.085, 0.3, 0.06, 0.02, -0.22],
    [0.07, 0.24, -0.055, -0.025, 0.26],
    [0.05, 0.17, 0.02, -0.06, 0.12],
    [0.042, 0.13, -0.03, 0.055, -0.15],
  ];
  // each tongue is a drawn flame profile — belly low, waist, licking tip — not a cone;
  // rooted at its base so the lean swings the tip, not the middle
  const tongueProfile: [number, number][] = [
    [0.001, 0], [0.55, 0.1], [1.0, 0.32], [0.6, 0.55], [0.3, 0.72], [0.13, 0.88], [0.001, 1.0],
  ];
  tongues.forEach(([r, h, x, z, lean], i) => {
    const tongue = sketch(
      new THREE.LatheGeometry(
        tongueProfile.map(([px, py]) => new THREE.Vector2(px * r, py * h)),
        12,
      ),
      35,
      'form',
      0.008,
    );
    tongue.position.set(x, 0, z);
    tongue.rotation.z = lean;
    paint(tongue, { fill: i === 0 ? P.flameCore : P.flameBody });
    g.add(tongue);
  });

  // embers riding above the fire — small, and they sell the heat
  for (const [x, y, z] of [
    [0.05, 0.5, 0.01],
    [-0.06, 0.58, -0.03],
  ] as [number, number, number][]) {
    const ember = sketch(new THREE.TetrahedronGeometry(0.016), 8, 'faint');
    ember.position.set(x, y, z);
    paint(ember, { fill: P.ember });
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
  paint(body, { fill: P.timberDark });
  container.add(body);

  // iron banding — lighter than the body it sits on, or the whole chest reads as a
  // solid black block at the distance the camera actually passes it
  for (const sx of [-0.19, 0.19]) {
    const strap = sketch(new THREE.BoxGeometry(0.04, height + 0.01, depth + 0.012));
    strap.position.set(sx, height / 2, 0);
    paint(strap, { fill: P.iron });
    container.add(strap);
  }
  const lock = sketch(new THREE.BoxGeometry(0.08, 0.09, 0.02));
  lock.position.set(0, height * 0.62, depth / 2);
  paint(lock, { fill: P.brass });
  container.add(lock);

  // the inside of an open chest is the darkest value in the shot
  const wellShadow = hatch(width * 0.8, depth * 0.75, 16, 0.35);
  wellShadow.rotation.x = -Math.PI / 2;
  wellShadow.position.y = height - 0.005;
  container.add(wellShadow);

  const lid = new THREE.Group();
  lid.position.set(0, height, -depth / 2); // hinge: back top edge
  // a barrel lid, not a plank — the domed top is the whole difference between "box"
  // and "treasure chest" in every D&D illustration
  const lidMesh = sketch(
    new THREE.CylinderGeometry(depth / 2, depth / 2, width, 10, 1, false, 0, Math.PI),
    25,
    'hero',
  );
  lidMesh.rotation.z = Math.PI / 2; // dome up, axis across the width
  lidMesh.position.z = depth / 2; // extends forward from the hinge
  paint(lidMesh, { fill: P.timberDark });
  lid.add(lidMesh);
  // the straps follow the dome as half-hoops instead of stabbing through it
  for (const sx of [-0.19, 0.19]) {
    const hoop = sketch(new THREE.TorusGeometry(depth / 2 + 0.008, 0.02, 4, 10, Math.PI), 20, 'form');
    hoop.position.set(sx, 0, depth / 2);
    hoop.rotation.y = Math.PI / 2;
    paint(hoop, { fill: P.iron });
    lid.add(hoop);
  }
  // the hasp drop-plate rides the LID, so it swings open with it and hangs over
  // the lock when shut
  const hasp = sketch(new THREE.BoxGeometry(0.07, 0.11, 0.016), 25, 'form');
  hasp.position.set(0, -0.05, depth - 0.004);
  paint(hasp, { fill: P.iron });
  const haspEye = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 6), inkMaterial);
  haspEye.rotation.x = Math.PI / 2;
  haspEye.position.set(0, -0.07, depth + 0.006);
  lid.add(hasp, haspEye);
  container.add(lid);

  // two coins already spilled at its feet — a chest that has been gotten into
  for (const [cx, cz] of [[-0.36, 0.14], [0.34, 0.2]] as [number, number][]) {
    const spilled = sketch(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 8), 25, 'faint');
    spilled.position.set(cx, 0.008, cz);
    spilled.rotation.y = cx * 3;
    paint(spilled, { fill: P.gold });
    container.add(spilled);
  }

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
    paint(coin, { fill: P.gold });
    coins.add(coin);
  });
  container.add(coins);

  return { container, lid, coins };
}

// Per-tree variety: every pine and oak draws its own profile jitter, scallop phase and
// facing off a build-order counter. Deterministic — build order never changes between
// loads, so the forest is the same forest every time, but no two trees in it repeat.
let treeSeed = 0;
function treeVary(seed: number, k: number): number {
  const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// The bible oak's crown, reusable: the card's wide lumpy dome revolved, then pushed
// radially by an integer-order wave (a fractional order plus a phase steps at the
// lathe's wrap seam and cracks the silhouette), heavily roughened for the card's
// grainy texture. Unpainted — callers paint. Used by buildOak and the one bespoke
// perch tree on the C2 run, so a crown is a crown everywhere.
function lobedCrown(r: number, crownH: number, seed: number): THREE.Group {
  const j = (k: number, amt: number) => 1 + (treeVary(seed, k) - 0.5) * amt;
  const profile: [number, number][] = [
    [0.3, 0.0],
    [0.88 * j(1, 0.22), 0.03],
    [1.0 * j(2, 0.18), 0.3 * j(3, 0.3)], // the wide waist of the crown
    [0.94 * j(4, 0.22), 0.56 * j(3, 0.12)],
    [0.64 * j(5, 0.28), 0.84],
    [0.32 * j(6, 0.34), 0.97],
    [0.0, 1.0],
  ];
  const pts = profile.map(([px, py]) => new THREE.Vector2(px * r, py * crownH));
  const geom = new THREE.LatheGeometry(pts, 26);
  const pos = geom.getAttribute('position');
  const order = 4 + Math.round(treeVary(seed, 8) * 2);
  const amp = 0.13 + treeVary(seed, 9) * 0.09;
  const phase = treeVary(seed, 10) * Math.PI * 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = pos.getY(i);
    const rad = Math.hypot(x, z);
    if (rad < 1e-5) continue;
    const theta = Math.atan2(z, x);
    const lump = 1 + amp * Math.cos(theta * order + phase + (y / crownH) * 2.7);
    pos.setX(i, (x / rad) * rad * lump);
    pos.setZ(i, (z / rad) * rad * lump);
  }
  pos.needsUpdate = true;
  // heavy roughen = the card's grainy crown texture; threshold 43 keeps a few drawn
  // foliage creases without cataloguing every facet — at 38 the crown read as a
  // crumpled low-poly crystal instead of leaf masses. No shell: fat contour smears on
  // lumpy forms are the "bold edges" that got cut.
  return sketch(roughen(geom, r * 0.11, 2.4 / r, seed + 11), 43, 'faint', 0);
}

// A pine drawn as stacked tiers rather than one cone — the stepped silhouette is what
// makes a conifer read as a conifer. This one is instanced across the whole backdrop,
// so it stays lean and lets fog do the rest of the work.
// Reused across every chapter's backdrop with a different foliage token: the ambush
// treeline, the theatre's forest and mountain halves, the C5 trees vignette and the C6
// miniature all pass their own {tier, trunk} pair rather than forking the geometry.
function buildPine(
  r: number,
  h: number,
  trunkH = 0.15,
  fill: { tier: number; trunk: number } = { tier: P.canopy, trunk: P.timberDark },
): THREE.Group {
  const g = new THREE.Group();
  const trunk = trunkOf(r * 0.32, trunkH);
  paint(trunk, { fill: fill.trunk });
  g.add(trunk);

  // TURNED, per the bible card's own build note: "this silhouette revolved". Metaball
  // tiers were tried twice and always fused back into a smooth bell at film distance —
  // a lathe of the card's exact half-profile keeps the 4 drooping ruffle tiers crisp
  // from every yaw angle. Each rim sits LOWER than the notch behind it (the droop);
  // each skirt's bottom edge is scalloped around the turn (the card's ruffle bumps);
  // and every tree draws its own profile jitter off treeVary so a row never repeats.
  // Profile in (radius, height) fractions of the card's tier ratios 1.0/0.72/0.52/0.34.
  const seed = treeSeed++;
  const j = (k: number, amt: number) => 1 + (treeVary(seed, k) - 0.5) * amt;
  // jitter ranges are WIDE (up to ±15% on rims, ±9% on tier heights): at row spacing
  // the earlier timid ±7% still read as one tree copy-pasted
  const pineProfile: [number, number][] = [
    [0.06, 0.14],
    [1.0 * j(1, 0.3), 0.1 * j(11, 0.3)], // skirt 1 rim — below its root: the droop
    [1.0 * j(1, 0.3), 0.16 * j(11, 0.2)],
    [0.38 * j(2, 0.34), 0.33 * j(3, 0.18)],
    [0.72 * j(4, 0.3), 0.295 * j(3, 0.14)], // skirt 2
    [0.72 * j(4, 0.3), 0.35 * j(3, 0.13)],
    [0.3 * j(5, 0.34), 0.5 * j(6, 0.14)],
    [0.52 * j(7, 0.3), 0.47 * j(6, 0.12)], // skirt 3
    [0.52 * j(7, 0.3), 0.52 * j(6, 0.12)],
    [0.22 * j(8, 0.34), 0.66 * j(9, 0.1)],
    [0.34 * j(10, 0.3), 0.63 * j(9, 0.1)], // skirt 4
    [0.34 * j(10, 0.3), 0.68 * j(9, 0.09)],
    [0.1 * j(13, 0.4), 0.86 * j(14, 0.08)], // the card's tall top spike
    [0.0, 1.0], // apex point
  ];
  const pts = pineProfile.map(([px, py]) => new THREE.Vector2(px * r, py * h));
  const geom = new THREE.LatheGeometry(pts, 24);
  // scallop the four rim rows: profile rows 1-2, 4-5, 7-8, 10-11 are the skirt edges;
  // bumps around the turn, a different count and phase per tree and per tier
  {
    const rows = new Set([1, 2, 4, 5, 7, 8, 10, 11]);
    const nRows = pineProfile.length;
    const pos = geom.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const row = i % nRows;
      if (!rows.has(row)) continue;
      const tier = row < 3 ? 0 : row < 6 ? 1 : row < 9 ? 2 : 3;
      const m = 8 - tier + Math.floor(treeVary(seed, 20 + tier) * 3);
      const phase = treeVary(seed, 30 + tier) * Math.PI * 2;
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const rad = Math.hypot(x, z);
      if (rad < 1e-5) continue;
      const theta = Math.atan2(z, x);
      const scallop = 0.5 + 0.5 * Math.cos(theta * m + phase);
      pos.setX(i, x * (1 + 0.05 * scallop));
      pos.setZ(i, z * (1 + 0.05 * scallop));
      pos.setY(i, pos.getY(i) - h * 0.028 * scallop); // the bump dips below the rim line
    }
    pos.needsUpdate = true;
  }
  // heavy roughen is the TEXTURE: the card's tiers are grainy, ragged masses, not
  // smooth solids — a strong high-frequency displacement rags the silhouette and lets
  // the light break up across the surface the way the card's grey does
  roughen(geom, r * 0.15, 3.4 / r, seed);
  // threshold 38 on the roughened surface scatters short drawn creases across the
  // canopy — the card's foliage marks — while staying above the lathe's facet angles.
  // No shell — fat contour smears on lumpy forms are the "bold edges" that got cut.
  const canopy = sketch(geom, 38, 'faint', 0);
  canopy.position.y = trunkH * 0.55;
  canopy.rotation.y = treeVary(seed, 40) * Math.PI * 2; // never the same face twice
  paint(canopy, { fill: fill.tier });
  g.add(canopy);
  return g;
}

// A broadleaf the way a D&D map key draws one: a lumpy, scalloped canopy — overlapping
// leaf masses rather than one ball — over a short trunk. Mixed among the pines so the
// woods read as woods instead of a tree farm.
function buildOak(
  r: number,
  h: number,
  fill: { canopy: number; trunk: number } = { canopy: P.canopy, trunk: P.timberDark },
): THREE.Group {
  const g = new THREE.Group();
  const trunkH = h * 0.32;
  // gnarled trunk: root flare at the base, and a visible fork feeding the crown —
  // the bible sheet's oak is a tree with anatomy, not a lollipop stick
  const trunk = trunkOf(r * 0.5, trunkH);
  trunk.rotation.z = 0.04;
  paint(trunk, { fill: fill.trunk });
  g.add(trunk);
  for (const side of [-1, 1]) {
    const fork = limb(r * 0.09, trunkH * 0.55);
    fork.position.set(side * r * 0.16 - Math.sin(side * 0.5) * trunkH * 0.28, trunkH * 0.86, 0);
    fork.rotation.z = Math.PI - side * 0.5; // limb hangs down; flip it to grow up
    paint(fork, { fill: fill.trunk });
    g.add(fork);
  }

  // TURNED crown, then lumped: a lathe of the card's wide dome profile, with every
  // vertex pushed radially by a low-order angular wave (5.3 lobes around, drifting
  // with height) plus roughen — real bumps around the whole turn, from any camera.
  // Metaball lobes were tried and fused back into a smooth ball at film distance.
  const seed = treeSeed++;
  const j = (k: number, amt: number) => 1 + (treeVary(seed, k) - 0.5) * amt;
  const crown = lobedCrown(r, h * 0.72 * j(7, 0.2), seed);
  crown.position.y = trunkH * 0.92;
  crown.rotation.y = treeVary(seed, 12) * Math.PI * 2;
  paint(crown, { fill: fill.canopy });
  g.add(crown);

  // 2 interior scallop scores per the art bible's tweak note — drawn seams between
  // foliage masses. A lit 3D render can't fake this texture with hatching, so these
  // are real authored lines, kept faint so they read as texture, not edges.
  for (const [ox, oy, oz, ry, flip] of [
    [-r * 0.15, h * 0.62, r * 0.42, -0.3, 1],
    [r * 0.12, h * 0.48, -r * 0.4, 0.35, -1],
  ] as [number, number, number, number, number][]) {
    const seam = new THREE.Path();
    seam.moveTo(-r * 0.28 * flip, 0);
    seam.quadraticCurveTo(0, h * 0.09, r * 0.28 * flip, -h * 0.04);
    const line = score(seam, 'faint');
    line.position.set(ox, oy, oz);
    line.rotation.y = ry;
    g.add(line);
  }
  return g;
}

// A corvid, per the art-bible sheet: a tight teardrop with NO neck — the head sits
// straight on the chest — a thick down-curved wedge of a beak, folded wings hugging
// the body in one unbroken outline, and a tail that fans into pointed blades.
function buildRaven(): THREE.Group {
  const g = new THREE.Group();

  // raven-slate is the ink-dark tier — nearly no chroma. The birds are the trigger for
  // the C2 sky reveal, not the thing that takes the colour.
  // One sculpted bird: body, breast, rump and a hunched no-neck head fused — the
  // silhouette a drawn raven has, not a snowman of spheres.
  const bird = sketch(
    blobs(
      [
        ball(0.5, 0.46, 0.42, 0.16), // body
        ball(0.5, 0.44, 0.58, 0.14), // breast
        ball(0.5, 0.52, 0.3, 0.11), // rump into the tail root
        ball(0.5, 0.62, 0.64, 0.1), // head, sunk into the chest
      ],
      36,
    ),
    60,
    'form',
    0.005,
  );
  bird.scale.set(0.375, 0.31, 0.375);
  bird.position.set(-0.1875, -0.143, -0.165);
  paint(bird, { fill: P.ravenSlate });
  g.add(bird);

  // thick wedge beak, tipped down — thin and straight reads as a songbird
  const beak = sketch(new THREE.ConeGeometry(0.02, 0.05, 5), 20, 'form');
  beak.rotation.x = Math.PI / 2 + 0.22;
  beak.position.set(0, 0.036, 0.115);
  paint(beak, { fill: P.iron });
  g.add(beak);
  // one paper eye dot per side
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.006, 5, 4), fillMaterial);
    eye.position.set(side * 0.028, 0.052, 0.082);
    g.add(eye);
  }

  // the tail fans into blades — an authored silhouette, extruded thin
  const tailShape = new THREE.Shape();
  tailShape.moveTo(-0.03, 0);
  tailShape.lineTo(-0.038, 0.13);
  tailShape.lineTo(-0.018, 0.115);
  tailShape.lineTo(-0.006, 0.145);
  tailShape.lineTo(0.008, 0.115);
  tailShape.lineTo(0.022, 0.138);
  tailShape.lineTo(0.038, 0.11);
  tailShape.lineTo(0.03, 0);
  tailShape.lineTo(-0.03, 0);
  const tailGeom = new THREE.ExtrudeGeometry(tailShape, { depth: 0.012, bevelEnabled: false });
  const tail = sketch(tailGeom, 25, 'form');
  tail.rotation.x = Math.PI / 2 + 0.5; // sweeping back and slightly down
  tail.position.set(0, 0.015, -0.075);
  paint(tail, { fill: P.ravenSlate });
  g.add(tail);

  // folded wings hugging the flanks — thin plates, tips crossing over the tail root
  for (const side of [-1, 1]) {
    const wing = sketch(new THREE.BoxGeometry(0.012, 0.052, 0.15), 25, 'faint');
    wing.rotation.set(0.28, side * 0.12, 0);
    wing.position.set(side * 0.055, 0.026, -0.025);
    paint(wing, { fill: P.ravenSlate });
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
  paint(stem, { fill: P.bedroll });
  // a drawn toadstool cap — wide brim curling under at the lip, domed top — instead of
  // a geometric hemisphere
  const capProfile: [number, number][] = [
    [0.55, 0.04], [0.85, 0.0], [1.0, 0.22], [0.85, 0.58], [0.48, 0.88], [0.001, 1.0],
  ];
  const cap = sketch(
    new THREE.LatheGeometry(
      capProfile.map(([px, py]) => new THREE.Vector2(px * 0.09, py * 0.07)),
      12,
    ),
    35,
    'form',
    0.006,
  );
  cap.position.y = 0.105;
  paint(cap, { fill: P.mushCap });

  // gills — the shaded underside is most of what says "mushroom" in line-work
  const gills = hatch(0.13, 0.13, 26, 0);
  gills.rotation.x = Math.PI / 2;
  gills.position.y = 0.117;

  // cap spots, left paper — the toadstool polka-dot is the second half of what says
  // "mushroom", and the one a D&D map leads with
  for (const [sx, sy, sz] of [
    [0.03, 0.158, 0.025],
    [-0.04, 0.15, 0.015],
    [0.008, 0.145, -0.045],
  ] as [number, number, number][]) {
    const spot = sketch(new THREE.SphereGeometry(0.018, 6, 4), 30, 'faint');
    spot.scale.y = 0.45;
    spot.position.set(sx, sy, sz);
    g.add(spot);
  }

  g.add(stem, cap, gills, contact(0.17, 0.14));
  return g;
}

// A cottage: body, pitched roof with a ridge, door, windows and a chimney. The old
// version was a box under a pyramid, which read as a tent.
// roofColor defaults to timber-dark; two houses, scattered, get ember roofs as the eye's
// landing points across the miniature.
function buildHouse(roofColor: number = P.timberDark): THREE.Group {
  const g = new THREE.Group();

  const body = sketch(new THREE.BoxGeometry(0.4, 0.35, 0.4));
  body.position.y = 0.175;
  paint(body, { fill: P.stoneWarm });
  g.add(body);

  // A gabled roof — a ridge with two slopes and eaves overhanging the walls. The old
  // four-sided cone was a pyramid, and eight pyramids read as tents, not a village.
  const roof = sketch(
    new THREE.CylinderGeometry(0.27, 0.27, 0.5, 3, 1, false, Math.PI / 2),
    25,
  );
  roof.rotation.z = Math.PI / 2; // ridge along x, apex up
  roof.position.y = 0.485;
  paint(roof, { fill: roofColor });
  g.add(roof);

  // a round-top door — the arch is what makes a cottage door storybook
  const door = sketch(new THREE.BoxGeometry(0.1, 0.14, 0.02));
  door.position.set(-0.06, 0.07, 0.205);
  paint(door, { fill: P.timber });
  g.add(door);
  // 12 radial segments (not 8) so the top edge reads as a curved arc rather than a
  // faceted zigzag — the art bible's door-arc note
  const doorArch = sketch(
    new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12, 1, false, 0, Math.PI),
    30,
    'faint',
  );
  doorArch.rotation.x = Math.PI / 2;
  doorArch.position.set(-0.06, 0.14, 0.205);
  paint(doorArch, { fill: P.timber });
  g.add(doorArch);

  // one window per face, with a cross mullion — two blank squares read as eyes
  const win = sketch(new THREE.BoxGeometry(0.08, 0.08, 0.02));
  win.position.set(0.1, 0.21, 0.205);
  paint(win, { fill: P.snow });
  g.add(win);
  const mull = sketch(new THREE.BoxGeometry(0.012, 0.08, 0.024), 25, 'faint');
  mull.position.set(0.1, 0.21, 0.206);
  paint(mull, { fill: P.timber });
  const mull2 = sketch(new THREE.BoxGeometry(0.08, 0.012, 0.024), 25, 'faint');
  mull2.position.set(0.1, 0.21, 0.206);
  paint(mull2, { fill: P.timber });
  g.add(mull, mull2);

  // timber-frame strokes on the gable front — the sheet's jettied-frame read, cheap
  for (const [fx, rot] of [[-0.14, 0.5], [0.02, -0.5]] as [number, number][]) {
    const beam = sketch(new THREE.BoxGeometry(0.016, 0.18, 0.012), 25, 'faint');
    beam.position.set(fx, 0.28, 0.203);
    beam.rotation.z = rot;
    paint(beam, { fill: P.timberDark });
    g.add(beam);
  }

  // taller, so it clears the new roof slope instead of drowning in it
  const chimney = sketch(new THREE.BoxGeometry(0.06, 0.3, 0.06));
  chimney.position.set(0.11, 0.57, -0.06);
  paint(chimney, { fill: P.stoneCool });
  g.add(chimney);

  g.add(contact(0.5, 0.42));
  return g;
}

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
  speed: number; // 0..1 gait amplitude, tweened by timeline
  // 0..1, tweened by a reach: a hand resting on a prop must not ride the breath up and
  // down with the rest of him. Same shape as `speed` — one number the frame loop reads.
  planted: number;
}

export interface World {
  root: THREE.Group; // add to scene
  look: THREE.Vector3; // camera lookAt target, tweened by timeline
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
function buildGoblin(): Goblin {
  const root = new THREE.Group();

  // spec pins hip height but not hip width; a small split keeps
  // the two legs visually distinct instead of coincident at rest.
  const HIP_X = RIG.hipX;

  // Hips carry the legs and the upper body separately: `bob` lifts the chest without
  // lifting the feet off the floor, and `pelvis.position.y` is the crouch.
  const pelvis = new THREE.Group();
  pelvis.position.y = RIG.hipY;
  const bob = new THREE.Group();

  function buildLeg(x: number, side: number): Leg {
    const pose = new THREE.Group();
    pose.position.set(x, 0, 0);
    const swing = new THREE.Group();
    pose.add(swing);

    // wiry sculpted legs — the sheet's goblin is all head and hands; the legs stay
    // thin but knotted, not turned on a lathe
    const thighMesh = limb(0.024, RIG.thigh);
    paint(thighMesh, { fill: P.gobSkin });
    swing.add(thighMesh);

    const shinPose = new THREE.Group();
    shinPose.position.y = -RIG.thigh;
    const shinSwing = new THREE.Group();
    shinPose.add(shinSwing);
    const shinMesh = limb(0.021, RIG.shin);
    paint(shinMesh, { fill: P.gobSkin });
    shinSwing.add(shinMesh);
    // wrapped shins, both legs — the sheet's goblin binds everything below the knee;
    // heights differ per side so the wraps read hand-tied, not uniform
    const shinWrap = sketch(
      new THREE.CylinderGeometry(0.024, 0.026, side === -1 ? 0.05 : 0.038, 9),
      35,
      'faint',
    );
    shinWrap.position.y = side === -1 ? -0.03 : -0.048;
    paint(shinWrap, { fill: P.bedroll });
    shinSwing.add(shinWrap);
    swing.add(shinPose);

    // Big bare feet — oversized against the wire legs, carried forward of the ankle.
    // The toe pivot inside is what stops the contact frame sliding.
    const foot = new THREE.Group();
    foot.position.y = -RIG.shin;
    const toe = new THREE.Group();
    toe.position.z = 0.02;
    // a modelled bare foot: heel, instep and a wide toe mass fused, squashed flat
    const footMesh = new THREE.Group();
    const footMass = sketch(
      blobs(
        [
          ball(0.5, 0.4, 0.3, 0.16), // heel
          ball(0.5, 0.42, 0.5, 0.15), // instep
          ball(0.5, 0.38, 0.68, 0.16), // toe mass
        ],
        30,
      ),
      60,
      'form',
      0.004,
    );
    footMass.scale.set(0.27, 0.13, 0.21);
    footMass.position.set(-0.135, -0.052, -0.103);
    footMesh.add(footMass);
    footMesh.position.set(side * 0.004, -0.002, 0.008);
    footMesh.rotation.y = side * 0.12; // toes turned out
    // round leather BOOTS, off the reference sheet — the bare claw feet went with the
    // old mascot
    paint(footMesh, { fill: P.timberDark });
    toe.add(footMesh);
    foot.add(toe);
    shinSwing.add(foot);

    return { pose, swing, shin: { pose: shinPose, swing: shinSwing }, foot, toe };
  }
  const legL = buildLeg(-HIP_X, -1);
  const legR = buildLeg(HIP_X, 1);

  // The chest is the hunch. It pivots at the WAIST and carries the head and both arms,
  // so folding forward swings the shoulders down and in front of him.
  const chest = new THREE.Group();
  chest.position.y = RIG.chestY;
  // The kit, redrawn from the draft-6 sheet: a layered work outfit on a stocky little
  // frame — rust tunic, mustard shoulder caps, a WIDE belt with a big brass buckle
  // over a dark under-skirt. Scavenged, but worn-in: everything wraps, nothing
  // matches.
  // ONE CLOAK, hood to hem — the reference wears a single dark garment that drapes
  // from the crown to the ground, no colour break, no belt: the drape IS the outfit.
  // Olive, same cloth as the hood, so head and body read as one piece. His chroma
  // moves to the amber eyes. The arms live under it at rest and the gloves come OUT
  // of it when a reach fires, which is the charm, not a bug.
  // hem first, neck last — a lathe profile must climb or its normals flip and the
  // whole garment renders as its own ink shell
  const cloakProfile2: [number, number][] = [
    [0.185, -0.16], [0.168, -0.12], [0.148, -0.07], [0.13, -0.01],
    [0.12, 0.05], [0.11, 0.11], [0.098, 0.16], [0.06, 0.2],
  ];
  const torsoLathe = sketch(
    new THREE.LatheGeometry(cloakProfile2.map(([r, y]) => new THREE.Vector2(r, y)), 18),
    60,
    'hero',
    0.01,
  );
  torsoLathe.scale.z = 0.9;
  paint(torsoLathe, { fill: P.gobHood });
  chest.add(torsoLathe);

  // tool satchel on the back — the C2 over-the-shoulder follow reads it for
  // thirteen seconds
  const satchel = sketch(new THREE.BoxGeometry(0.11, 0.09, 0.05), 25, 'form');
  satchel.position.set(-0.01, 0.035, -0.095);
  satchel.rotation.z = 0.08;
  paint(satchel, { fill: P.gobSatchel });
  // the strap hugs the BACK shoulder only — run across the chest it read as suspenders
  const strap = sketch(new THREE.BoxGeometry(0.024, 0.2, 0.014), 25, 'faint');
  strap.position.set(0.03, 0.1, -0.075);
  strap.rotation.z = 0.5;
  strap.rotation.x = 0.25;
  paint(strap, { fill: P.gobSatchel });
  chest.add(satchel, strap);
  // the cowl — the hood's cloth pooling on the shoulders, closing the neck join under
  // the chin and tying the head's olive into the outfit
  const collar = sketch(new THREE.CylinderGeometry(0.062, 0.108, 0.06, 9), 35, 'form');
  collar.position.y = 0.172;
  paint(collar, { fill: P.gobHood });
  chest.add(collar);

  // tone down his left flank so the tunic has a lit side and a shadow side
  const flank = hatch(0.16, 0.12, 15, 1.2, 'faint');
  flank.rotation.y = -Math.PI / 2;
  flank.position.set(-0.075, 0.08, 0);
  chest.add(flank);

  // The neck carries the head mass; the head is HALF of him now, so every look
  // starts here and finishes at the head group.
  const neck = new THREE.Group();
  neck.position.y = RIG.shoulderY + RIG.neckY;
  const neckStub = sketch(new THREE.CylinderGeometry(0.026, 0.034, 0.06, 8), 35, 'faint');
  neckStub.position.y = -0.13;
  paint(neckStub, { fill: P.gobSkin });
  neck.add(neckStub);
  const head = new THREE.Group();
  neck.add(head);

  // The head, drawn as a CHESTNUT: widest at the eye line, cheeks tapering hard to a
  // small pointed chin, a soft rounded crown. A lathe, because the taper has to be
  // AUTHORED — fused metaballs kept relaxing back into a ball, and a ball is the old
  // mascot. Flattened front-to-back so the face is a plane the big eyes can own.
  const skullProfile: [number, number][] = [
    [0.001, -0.148], [0.028, -0.142], [0.058, -0.122], [0.09, -0.082],
    [0.118, -0.028], [0.136, 0.028], [0.14, 0.068], [0.126, 0.102],
    [0.092, 0.128], [0.048, 0.142], [0.001, 0.146],
  ];
  const skull = sketch(
    new THREE.LatheGeometry(skullProfile.map(([r, y]) => new THREE.Vector2(r, y)), 22),
    60,
    'faint',
    0.01,
  );
  // WIDER than tall — the reference head is a squashed chestnut, and every upright
  // egg so far has read as a baby. The squash also shrinks the under-mouth area so
  // the face can sit low the way a goblin's does.
  skull.scale.set(1.18, 0.86, 0.9);
  paint(skull, { fill: P.gobSkin });
  head.add(skull);

  // The hood — a revolved cowl with the face opening cut, ears bursting through the
  // sides, the tip flopped back-right. Threshold 40 leaves the contour shell as its
  // only line.
  // The face window is SMALL — brow to chin, eye to eye — everything else is cowl.
  // The old 97° window exposed the whole forehead and temples, and the head read as a
  // bald kid in a headband instead of the bible's hooded goblin.
  // The hood, DRAPED the way the sheet draws it — a soft cowl sitting back on the
  // crown, its opening framing the whole face, its tail hanging loose past his left
  // jaw. Olive cloth: the face reads out of a dark frame.
  // The hood SITS ON the head with real cloth volume — raised off the crown, a soft
  // peak leaning back, the opening cut WIDE so the whole face and forehead read out of
  // it. The last pass hugged the skull with a narrow window and the dark cloth read as
  // a bob of hair with bangs.
  // The hood is a TENT pitched over the crown — hem crossing the forehead just above
  // the eyes and ending at ear level, never wrapping the jaw. The wrap-under version
  // read as a bonnet, and a bonnet is a baby.
  // CLOSED down the back and sides to the jawline — a wide-brimmed shallow shell
  // showed its own open rim from behind and read as a floppy leaf hat. Only the face
  // window is cut, and it is cut WIDE, hem above the eyes.
  const hood = sketch(
    roughen(
      new THREE.SphereGeometry(0.185, 14, 10, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, 2.4),
      0.006,
      14,
      33,
    ),
    55,
    'form',
    0.009,
  );
  hood.scale.set(1.1, 0.95, 1.02);
  hood.position.set(0, 0.06, -0.03);
  paint(hood, { fill: P.gobHood });
  head.add(hood);
  // the soft peak, leaning back off the crown — small: at stem size it read mushroom
  const peak = sketch(new THREE.ConeGeometry(0.055, 0.1, 8), 40, 'form');
  peak.position.set(0, 0.225, -0.05);
  peak.rotation.x = -0.45;
  paint(peak, { fill: P.gobHood });
  head.add(peak);
  // one short hem line across the forehead only — the drawn edge between cloth and brow
  const rim = sketch(new THREE.TorusGeometry(0.152, 0.017, 5, 12, Math.PI * 0.62), 30, 'form');
  rim.position.set(0, 0.06, 0.048);
  rim.rotation.z = (Math.PI * (1 - 0.62)) / 2;
  paint(rim, { fill: P.gobHood });
  head.add(rim);
  // the tail hangs BEHIND the shoulder, not by the jaw — by the jaw it read as a
  // bonnet string
  const hoodTail = sketch(new THREE.ConeGeometry(0.036, 0.16, 7), 40, 'form');
  hoodTail.position.set(-0.1, -0.11, -0.1);
  hoodTail.rotation.z = Math.PI - 0.25;
  hoodTail.rotation.x = -0.15;
  paint(hoodTail, { fill: P.gobHood });
  head.add(hoodTail);

  // Ears: the goblin identifier. LONG blades swept OUT — closer to horizontal than
  // vertical, wider than the head is tall, with a dark inner-ear so they read as ears
  // and not leaves. Pivot at the skull so a droop swings from the base (the expression
  // channel that survives distance).
  // a straight tapered WEDGE — wide at the skull, running clean to a fine point with
  // one small nick. The old curled S-blade scalloped like a butterfly wing.
  const earShape = new THREE.Shape();
  earShape.moveTo(0, 0);
  earShape.quadraticCurveTo(0.095, 0.045, 0.085, 0.13); // outer edge, gently bellied
  earShape.lineTo(0.052, 0.3); // straight run toward the tip
  earShape.lineTo(0.058, 0.32); // the nick
  earShape.quadraticCurveTo(0.035, 0.4, 0.008, 0.46); // fine point
  earShape.quadraticCurveTo(-0.055, 0.3, -0.07, 0.12); // inner edge, concave
  earShape.quadraticCurveTo(-0.052, 0.02, 0, 0);
  const earGeom = new THREE.ExtrudeGeometry(earShape, {
    depth: 0.016,
    bevelEnabled: true, // soft edges — a flat slab reads as a leaf, a bevel reads as flesh
    bevelThickness: 0.005,
    bevelSize: 0.006,
    bevelSegments: 1,
  });
  earGeom.translate(0, 0, -0.008);
  function buildEar(side: number): THREE.Group {
    const pivot = new THREE.Group();
    // attached at EYE level on the head sides — high ears read as wings on a hat, low
    // ears read as anatomy
    pivot.position.set(side * 0.13, -0.025, -0.015);
    // near-horizontal, straight OUT of the hood. Base angle matches EAR_Z in
    // actions.ts: express() writes rotation.z absolutely, so the two must agree or
    // every expression re-sweeps the ears.
    pivot.rotation.z = -side * 1.3;
    pivot.rotation.y = side * 0.22; // angled back so both read in a three-quarter view
    const leaf = sketch(earGeom, 25, 'form', 0.006);
    paint(leaf, { fill: P.gobSkin });
    pivot.add(leaf);
    // inner-ear shadow: a narrow inset hugging the base half only — a full-blade copy
    // read as a leaf vein
    const inner = new THREE.Mesh(earGeom, fillMaterial);
    inner.scale.set(0.48, 0.42, 1);
    inner.position.set(0.008, 0.05, 0.014);
    paint(inner, { fill: P.gobEarInner });
    pivot.add(inner);
    if (side === -1) {
      // one earring, left ear only
      const ring = sketch(new THREE.TorusGeometry(0.02, 0.005, 4, 9), 30, 'faint');
      ring.position.set(0.08, 0.055, 0);
      paint(ring, { fill: P.brass });
      pivot.add(ring);
    } else {
      // a bandage wrapped around the right blade — the sheet's ears have seen work
      const wrap = sketch(new THREE.BoxGeometry(0.085, 0.05, 0.034), 25, 'faint');
      wrap.position.set(0.014, 0.23, 0);
      wrap.rotation.z = 0.3;
      paint(wrap, { fill: P.bedroll });
      pivot.add(wrap);
    }
    return pivot;
  }
  const earL = buildEar(-1);
  const earR = buildEar(1);
  head.add(earL, earR);

  // The face. BIG whites with ink pupils and a paper glint; one soft brow-ridge arc
  // per side (never a scowl); a small pointed nose; a thin wide smile with one fang.
  const brows: THREE.Object3D[] = [];
  const eyes: THREE.Object3D[] = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    // HUGE lantern-yellow ALMONDS hugging the face plane, nearly touching over the
    // nose — flattened hard so they read as drawn shapes on the face, not ping-pong
    // balls pressed into it. The sheet's face is mostly these.
    // the eyes ARE the face: big ROUND amber lanterns in dark goggle rims, all but
    // touching over the nose at the head's vertical centre — the reference's glowing
    // discs peering out of the hood. Slit pupils, the goblin-cat read.
    eye.position.set(side * 0.058, -0.005, 0.102);
    eye.rotation.y = side * 0.1; // follow the cheek plane around the wedge
    const eyeWhite = sketch(new THREE.SphereGeometry(0.056, 12, 8), 40, 'faint', 0.004);
    eyeWhite.scale.set(1, 1.05, 0.5);
    paint(eyeWhite, { fill: P.gobEye });
    eye.add(eyeWhite);
    // the rim — the drawn "glasses" edge that holds the disc against the skin
    const eyeRim = sketch(new THREE.TorusGeometry(0.052, 0.0075, 5, 12), 25, 'faint');
    eyeRim.position.z = 0.022;
    paint(eyeRim, { fill: P.timberDark });
    eye.add(eyeRim);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), inkMaterial);
    pupil.scale.set(0.55, 1.6, 0.5); // vertical slit
    pupil.position.set(side * -0.006, -0.008, 0.026);
    eye.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 6, 5), fillMaterial);
    glint.position.set(side * -0.013, 0.008, 0.032);
    eye.add(glint);
    head.add(eye);
    eyes.push(eye);

    // brows: thin, light strokes over the big eyes — the sheet's face carries almost
    // no brow weight, so these whisper instead of scowling
    const brow = new THREE.Group();
    brow.position.set(side * 0.058, 0.052, 0.105);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.005, 5, 8, 1.0), inkMaterial);
    arc.rotation.z = Math.PI / 2 - 0.5; // arc spans the top
    arc.position.y = -0.024;
    brow.add(arc);
    head.add(brow);
    brows.push(brow);
  }

  // the goblin nose: LONG and pointed, leading the profile the way the card's side
  // view calls out ("nose-led profile") — the old short wedge read generically cute,
  // not goblin. Slimmer at the base, twice the reach, tipped further down so the
  // point hooks the way a D&D goblin's does.
  // the nose is TINY — a button between the eyes; the sheet's face is eyes and ears,
  // and a big nose would fight both
  // plain mesh, no sketch strokes — drawn lines on a button this small read as a
  // wireframe golf ball. Skin tone, sitting right between the eye bottoms.
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), fillMaterial);
  nose.scale.set(1.25, 0.8, 0.9);
  nose.position.set(0, -0.062, 0.112);
  paint(nose, { fill: P.gobSkin });
  head.add(nose);

  // the mouth — a small easy smile LOW on the wedge, down by the pointed chin, one
  // snaggle fang riding up from the lower lip; the fang rides inside the group so an
  // expression moves both. actions.ts owns the group's y, rotation and stretch.
  // low, right above the pointed chin — a goblin face is bottom-loaded; the old
  // mid-height mouth left an empty jaw acreage that read as baby cheeks
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.09, 0.118);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.006, 5, 10, 1.4), inkMaterial);
  smile.rotation.z = -Math.PI / 2 - 0.7; // arc spans the bottom — a smile, not a frown
  smile.position.set(0, 0.021, 0);
  mouth.add(smile);
  const fang = sketch(new THREE.ConeGeometry(0.008, 0.022, 4), 20, 'faint');
  fang.position.set(0.033, -0.006, 0.002);
  paint(fang, { fill: P.gobTooth });
  mouth.add(fang);
  head.add(mouth);
  const face: Face = { browL: brows[0], browR: brows[1], eyeL: eyes[0], eyeR: eyes[1], mouth };

  // jaw tone, so the head has an underside instead of stopping at its outline
  const jaw = hatch(0.14, 0.06, 16, 0.2, 'faint');
  jaw.position.set(0, -0.11, 0.07);
  jaw.rotation.x = -0.9;
  head.add(jaw);

  function buildArm(x: number): Arm {
    const pose = new THREE.Group();
    pose.position.set(x, RIG.shoulderY, 0);
    const swing = new THREE.Group();
    pose.add(swing);
    // sturdier arms than the old wire — the mass still ends in the mitt
    const upper = limb(0.02, RIG.upper);
    paint(upper, { fill: P.gobSkin });
    swing.add(upper);
    // no pauldrons — every angle that caught one read as a growth on his chest, and
    // the reference goblin wears plain cloth

    // The elbow — thirteen authored reaches bend here.
    const elbow = new THREE.Group();
    elbow.position.y = -RIG.upper;
    const fore = limb(0.018, RIG.fore);
    paint(fore, { fill: P.gobSkin });
    elbow.add(fore);
    // glove cuff — the mitt below is leather now, and the cuff sells it
    const cuff = sketch(new THREE.CylinderGeometry(0.023, 0.027, 0.03, 8), 35, 'faint');
    cuff.position.y = -RIG.fore + 0.014;
    paint(cuff, { fill: P.timberDark });
    elbow.add(cuff);
    swing.add(elbow);

    // Oversized mitt hands — the sheet's hands are half the forearm's length.
    const wrist = new THREE.Group();
    wrist.position.y = -RIG.fore;
    // a sculpted mitt: palm with a thumb bump and knuckle swells — a modelled hand
    const hand = sketch(
      blobs(
        [
          ball(0.5, 0.48, 0.5, 0.16), // palm
          ball(0.34, 0.52, 0.58, 0.08), // thumb
          ball(0.62, 0.42, 0.6, 0.09), // knuckles
          ball(0.48, 0.36, 0.62, 0.08), // fingertip mass
        ],
        36,
      ),
      60,
      'form',
      0.005,
    );
    hand.scale.setScalar(0.36);
    hand.position.set(-0.18, -0.203, -0.18);
    // big leather work gloves — the sheet's goblin touches the world through his kit
    paint(hand, { fill: P.timberDark });
    wrist.add(hand);
    elbow.add(wrist);

    return { pose, swing, elbow, wrist };
  }
  const armL = buildArm(-RIG.shoulderX);
  const armR = buildArm(RIG.shoulderX);

  chest.add(neck, armL.pose, armR.pose);
  bob.add(chest);
  pelvis.add(legL.pose, legR.pose, bob);
  root.add(pelvis);
  // he travels with his own shadow — it rides the root, so it is under him on the
  // path, on a montage platform and on the cliff top alike
  root.add(contact(0.3, 0.22));

  return {
    root, pelvis, bob, chest, neck, head, earL, earR, face,
    armL, armR, legL, legR, speed: 0, planted: 0,
  };
}

// Adventurer figure — taller than the goblin, ~1.1 units, faces +z by default. Six of
// these ship: three at the ambush and three around the tavern table, so the part count
// is kept lean and the overall height is unchanged from the locked previz framing.
//
// It used to be a cylinder under a ball under a cone, which is a chess pawn. What makes
// an adventurer read at a glance is the cloak silhouette and the hat brim, so those
// carry the figure and the rest stays cheap.
// `cloak` is the one colour a figure needs to stop being a paper cut-out — it is the
// silhouette, so painting it is what separates three adventurers from three stencils.
// Left off, the figure builds as pencil, which is what the tavern scene still wants.
function buildAdventurer(swordRaised: boolean, cloakPaint?: Paint): THREE.Group {
  const g = new THREE.Group();

  for (const side of [-1, 1]) {
    const leg = limb(0.048, 0.32, 'faint');
    leg.position.set(side * 0.062, 0.32, 0);
    paint(leg, { fill: P.timberDark });
    g.add(leg);
    // a modelled boot — heel and toe fused, not a brick
    const boot = new THREE.Group();
    const bootMass = sketch(
      blobs(
        [
          ball(0.5, 0.52, 0.34, 0.16), // shaft
          ball(0.5, 0.36, 0.36, 0.15), // heel
          ball(0.5, 0.32, 0.62, 0.14), // toe
        ],
        30,
      ),
      60,
      'faint',
    );
    bootMass.scale.set(0.26, 0.16, 0.24);
    bootMass.position.set(-0.13, -0.067, -0.115);
    boot.add(bootMass);
    boot.position.set(side * 0.062, 0.05, 0.04);
    paint(boot, { fill: P.timberDark });
    g.add(boot);
  }

  // a sculpted trunk under the cloak: hips, belly, chest and shoulders fused —
  // what shows through the cloak's front break is a body, not a tube
  const body = new THREE.Group();
  const torsoMass = sketch(
    blobs(
      [
        ball(0.5, 0.3, 0.5, 0.2), // hips
        ball(0.5, 0.46, 0.52, 0.19), // belly
        ball(0.5, 0.62, 0.5, 0.18), // chest
        ball(0.38, 0.72, 0.5, 0.09), // shoulder L
        ball(0.62, 0.72, 0.5, 0.09), // shoulder R
      ],
      36,
    ),
    60,
    'form',
    0.006,
  );
  torsoMass.scale.set(0.6, 0.62, 0.6);
  torsoMass.position.set(-0.3, -0.31, -0.3);
  body.add(torsoMass);
  body.position.y = 0.46;
  paint(body, { fill: P.stoneWarm });
  g.add(body);

  // the cloak is the silhouette — a drawn drape: hem flaring over the leg tops, a
  // waist, real shoulders, and a collar the head sits into. The old cone was a
  // traffic-cone poncho and it is most of why the figures read as chess pawns.
  const cloakProfile: [number, number][] = [
    [0.27, 0.22], [0.235, 0.27], [0.255, 0.31], [0.19, 0.5],
    [0.165, 0.62], [0.08, 0.7], [0.001, 0.73],
  ];
  const cloak = sketch(
    new THREE.LatheGeometry(cloakProfile.map(([px, py]) => new THREE.Vector2(px, py)), 12),
    35,
    'form',
    0.01,
  );
  cloak.rotation.y = 0.3;
  if (cloakPaint) paint(cloak, cloakPaint);
  g.add(cloak);
  const cloakTone = hatch(0.3, 0.36, 11, 1.35, 'faint');
  cloakTone.position.set(-0.13, 0.4, 0.06);
  cloakTone.rotation.y = -0.8;
  g.add(cloakTone);

  for (const side of [-1, 1]) {
    const arm = limb(0.035, 0.3, 'faint');
    arm.position.set(side * 0.16, 0.63, 0.03);
    arm.rotation.z = side * -0.16;
    paint(arm, { fill: P.stoneWarm });
    g.add(arm);
  }

  // a belt cinching the tunic — one line at the waist is what turns a tube into a
  // dressed figure, same trick the goblin's own belt pulls
  const advBelt = sketch(new THREE.CylinderGeometry(0.15, 0.152, 0.04, 9), 25, 'faint');
  advBelt.position.y = 0.42;
  paint(advBelt, { fill: P.timberDark });
  g.add(advBelt);
  const advBuckle = sketch(new THREE.BoxGeometry(0.04, 0.04, 0.015), 25, 'faint');
  advBuckle.position.set(0, 0.42, 0.148);
  paint(advBuckle, { fill: P.brass });
  g.add(advBuckle);

  // human skin — kept nowhere near the goblin's green. A sculpted head: cranium,
  // jaw, cheeks and a nose fused, so the profile under the hat brim is a face.
  const head = new THREE.Group();
  const skull = sketch(
    blobs(
      [
        ball(0.5, 0.56, 0.5, 0.22), // cranium
        ball(0.5, 0.4, 0.54, 0.15), // jaw
        ball(0.4, 0.48, 0.56, 0.1), // cheek L
        ball(0.6, 0.48, 0.56, 0.1), // cheek R
        ball(0.5, 0.5, 0.7, 0.055), // nose
      ],
      36,
    ),
    60,
    'faint',
    0.011,
  );
  skull.scale.setScalar(0.5);
  skull.position.set(-0.25, -0.28, -0.25);
  head.add(skull);
  head.position.y = 0.72;
  paint(head, { fill: P.stoneWarm });
  g.add(head);
  for (const side of [-1, 1]) {
    // z=0.15: the skull sculpt's face surface at this height sits ~0.126 proud of the
    // head origin (metaball field, not a flat plane) — 0.1 buried the dot inside the
    // mass. 0.15 clears it with room for the sphere's own radius.
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 5), inkMaterial);
    eye.position.set(side * 0.04, 0.735, 0.15);
    g.add(eye);
  }
  // a sculpted beard under the eyes — the art bible's traveler is a person, not a
  // pawn; the mass tapers to a point the way a drawn beard does
  const beard = new THREE.Group();
  const beardMass = sketch(
    blobs(
      [
        ball(0.5, 0.66, 0.5, 0.14),
        ball(0.42, 0.48, 0.52, 0.1),
        ball(0.58, 0.48, 0.52, 0.1),
        ball(0.5, 0.28, 0.54, 0.09),
      ],
      30,
    ),
    60,
    'faint',
  );
  beardMass.scale.set(0.34, 0.22, 0.3);
  beardMass.position.set(-0.17, -0.11, -0.156);
  beard.add(beardMass);
  beard.position.set(0, 0.62, 0.075);
  paint(beard, { fill: P.timberDark });
  g.add(beard);
  // the cloak's front break — a drawn V where the collar opens, not added geometry;
  // z tracks the lathe profile's own radius at each height (+ a hair proud) so the
  // line rides the cloak's surface instead of floating off it or sinking in
  g.add(
    polyline(
      [
        new THREE.Vector3(-0.045, 0.68, 0.116),
        new THREE.Vector3(0, 0.615, 0.183),
        new THREE.Vector3(0.045, 0.68, 0.116),
      ],
      'form',
    ),
  );
  // one feather off the hat band
  const feather = sketch(new THREE.ConeGeometry(0.018, 0.12, 4), 20, 'faint');
  feather.position.set(0.13, 0.87, 0.02);
  feather.rotation.z = -0.9;
  paint(feather, { fill: P.snow });
  g.add(feather);

  // A slouch hat, not a wizard's: modest brim, low soft crown, a band. The old
  // 0.22-brim under a 0.26-tall cone read as three Gandalfs round the fire.
  const brim = sketch(new THREE.CylinderGeometry(0.165, 0.17, 0.02, 12), 25, 'form');
  brim.position.y = 0.815;
  // a soft dome, not a point — the point is what kept reading "wizard"
  const crown = sketch(
    new THREE.SphereGeometry(0.115, 9, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    35,
    'form',
    0.006,
  );
  crown.scale.y = 0.85;
  crown.position.y = 0.825;
  const hatband = sketch(new THREE.CylinderGeometry(0.105, 0.115, 0.03, 9), 25, 'faint');
  hatband.position.y = 0.835;
  paint(hatband, { fill: P.timberDark });
  // the hat is the same cloth as the cloak — not named separately in the colour script,
  // so it takes the nearest token: the figure's own outfit colour
  if (cloakPaint) {
    paint(brim, cloakPaint);
    paint(crown, cloakPaint);
  }
  g.add(brim, crown, hatband);

  // adventuring kit carries a shield; nobody brings one to the game table
  if (swordRaised) {
    const shield = new THREE.Group();
    shield.position.set(-0.21, 0.46, 0.03);
    shield.rotation.z = Math.PI / 2; // disc faces out along x
    shield.rotation.x = 0.35; // slung at an angle, not held up for inspection
    const disc = sketch(new THREE.CylinderGeometry(0.125, 0.125, 0.025, 12), 25, 'form');
    paint(disc, { fill: P.steel });
    shield.add(disc);
    const boss = sketch(new THREE.SphereGeometry(0.032, 8, 6), 30, 'faint');
    boss.position.y = 0.022; // proud of the outward face
    paint(boss, { fill: P.iron });
    shield.add(boss);
    g.add(shield);
  }

  // a real sword: blade, crossguard, grip, pommel — held high in the ambush, resting
  // point-down beside the chair at the table
  const sword = new THREE.Group();
  const blade = sketch(new THREE.BoxGeometry(0.028, 0.42, 0.016), 25, 'form');
  blade.position.y = 0.27;
  paint(blade, { fill: P.steel });
  const guard = sketch(new THREE.BoxGeometry(0.15, 0.028, 0.03));
  paint(guard, { fill: P.brass });
  const grip = sketch(new THREE.CylinderGeometry(0.019, 0.019, 0.1, 6), 25, 'faint');
  grip.position.y = -0.07;
  paint(grip, { fill: P.gobBelt });
  const pommel = sketch(new THREE.SphereGeometry(0.028, 7, 5), 25, 'faint', 0.005);
  pommel.position.y = -0.128;
  paint(pommel, { fill: P.brass });
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

  // C1 is the film's painted proof scene: the colour script is these `paint` calls,
  // sitting next to the geometry they colour. Nothing else in the film is painted yet,
  // and nothing else needs to be — paper passes through the graphite pass unchanged.
  const heroRock = rock(1.8, 'hero');
  heroRock.scale.y = 0.75;
  heroRock.position.set(0, 0, 0);
  paint(heroRock, { fill: P.rockFace });
  container.add(heroRock);

  // an outcrop rather than one boulder — kept off z=+0.9 where he pops up, so nothing
  // stands between the camera and the reveal
  const outcrop: [number, number, number, number][] = [
    [-0.95, 0.12, -0.5, 0.5],
    [0.98, 0.08, -0.62, 0.42],
    [-0.3, 0.05, -1.05, 0.34],
  ];
  outcrop.forEach(([x, y, z, r]) => {
    const chunk = rock(r * 2, 'form', x * 3.1);
    chunk.scale.y = 0.85;
    chunk.position.set(x, y, z);
    // same token as the hero rock — it reads first by weight ('hero' vs 'form'), not by
    // a darker fill; darkness comes from the hatch layers below, never from the paint
    paint(chunk, { fill: P.rockFace });
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
    const stone = rock((0.075 + (i % 3) * 0.015) * 2, 'faint', a * 2.7);
    stone.position.set(-2.2 + Math.cos(a) * 0.34, 0.04, 0.6 + Math.sin(a) * 0.34);
    paint(stone, { fill: P.stoneCool });
    container.add(stone);
  }
  for (const [lx, lz, rot] of [
    [-0.06, 0.04, 0.6],
    [0.05, -0.05, -0.9],
  ] as [number, number, number][]) {
    const log = new THREE.Group();
    const fireLogMass = sketch(blobs(COLUMN, 26), 60, 'faint');
    fireLogMass.scale.set(0.3, 0.5, 0.3);
    fireLogMass.position.set(-0.15, -0.25, -0.15);
    log.add(fireLogMass);
    log.rotation.set(0, rot, Math.PI / 2);
    log.position.set(-2.2 + lx, 0.05, 0.6 + lz);
    paint(log, { fill: P.timberDark });
    container.add(log);
  }
  const scorch = contact(0.95, 0.85);
  scorch.position.set(-2.2, 0.011, 0.6);
  container.add(scorch);

  // camp kit, so three figures round a fire read as a party that stopped for the night
  // a rolled bedroll — soft cloth, so it sculpts as a slightly lumpy roll
  const bedroll = new THREE.Group();
  const bedrollMass = sketch(blobs(COLUMN, 26), 60, 'faint');
  bedrollMass.scale.set(0.72, 0.62, 0.72);
  bedrollMass.position.set(-0.36, -0.31, -0.36);
  bedroll.add(bedrollMass);
  bedroll.rotation.set(0, 0.35, Math.PI / 2);
  bedroll.position.set(-3.5, 0.11, 0.9);
  paint(bedroll, { fill: P.bedroll });
  container.add(bedroll);
  const pack = sketch(new THREE.BoxGeometry(0.28, 0.26, 0.22), 25, 'faint');
  pack.rotation.y = -0.4;
  pack.position.set(-1.5, 0.13, 1.15);
  paint(pack, { fill: P.timber });
  container.add(pack);
  const packFlap = sketch(new THREE.BoxGeometry(0.29, 0.08, 0.23), 25, 'faint');
  packFlap.rotation.y = -0.4;
  packFlap.position.set(-1.5, 0.28, 1.15);
  paint(packFlap, { fill: P.timber });
  container.add(packFlap);
  // planted spear — short enough to read as kit leaning by the fire rather than as a
  // flagpole running out of the top of the frame
  const spearLean = 0.12;
  const spearH = 1.05;
  const spear = sketch(new THREE.CylinderGeometry(0.016, 0.016, spearH, 5), 25, 'faint');
  spear.rotation.z = spearLean;
  spear.position.set(-4.0, spearH / 2, -0.3);
  paint(spear, { fill: P.timber });
  container.add(spear);
  const spearHead = sketch(new THREE.ConeGeometry(0.04, 0.18, 5), 25, 'faint');
  spearHead.rotation.z = spearLean;
  spearHead.position.set(
    -4.0 - Math.sin(spearLean) * (spearH / 2 + 0.09),
    spearH + Math.cos(spearLean) * 0.09 - 0.02,
    -0.3,
  );
  paint(spearHead, { fill: P.steel });
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
  // The pines are their own group: they are C1's backdrop, but they are also the "far
  // treeline" the C2 run's last beat paints (color-script §5 #7), so they outlive the
  // camp gate below.
  const treelineGroup = new THREE.Group();
  // every third tree is a broadleaf — a real treeline is mixed, and the round crowns
  // between the pine spikes are what stop it reading as a sawtooth cut-out
  treeline.forEach(([x, z, r, h], i) => {
    const tree =
      i % 3 === 2
        ? buildOak(r * 1.2, h * 0.85, { canopy: P.canopyDeep, trunk: P.timberDark })
        : buildPine(r, h, 0.3, { tier: P.canopyDeep, trunk: P.timberDark });
    tree.position.set(x, 0, z);
    treelineGroup.add(tree);
  });

  // The art bible's forest band: the lone-specimen row becomes three depth tiers.
  // Middle row — simplified, one value lighter, filling the gaps between the front trees.
  const midRow: [number, number, number, number][] = [
    [-8.4, -24.5, 0.55, 1.6], [-4.6, -26, 0.5, 1.5], [-1.2, -24, 0.58, 1.7],
    [1.8, -26.5, 0.52, 1.5], [3.6, -24.2, 0.55, 1.6], [6.2, -25.8, 0.5, 1.5],
    [9.0, -24.6, 0.56, 1.65], [12.2, -26.2, 0.52, 1.5],
  ];
  midRow.forEach(([x, z, r, h], i) => {
    const tree =
      i % 4 === 1
        ? buildOak(r * 1.15, h * 0.8, { canopy: P.canopy, trunk: P.timberDark })
        : buildPine(r, h, 0.28, { tier: P.canopy, trunk: P.timberDark });
    tree.position.set(x, 0, z);
    treelineGroup.add(tree);
  });
  // Back row — flat spike-and-lobe silhouette plates, staggered, palest value:
  // aerial perspective in one draw call each (art-bible X-class backdrop).
  const bandShape = new THREE.Shape();
  bandShape.moveTo(-7, 0);
  bandShape.lineTo(-6.3, 2.2); // pine-spike
  bandShape.lineTo(-5.7, 0.9);
  bandShape.quadraticCurveTo(-5.0, 1.6, -4.2, 1.3); // oak-lobe
  bandShape.lineTo(-3.4, 2.6); // pine-spike
  bandShape.lineTo(-2.6, 1.0);
  bandShape.quadraticCurveTo(-1.6, 1.7, -0.7, 1.4); // oak-lobe
  bandShape.lineTo(0.2, 2.8); // pine-spike
  bandShape.lineTo(1.0, 1.1);
  bandShape.quadraticCurveTo(2.0, 1.8, 3.0, 1.4); // oak-lobe
  bandShape.lineTo(3.8, 2.5); // pine-spike
  bandShape.lineTo(4.6, 0.9);
  bandShape.quadraticCurveTo(5.6, 1.5, 6.4, 1.2); // oak-lobe
  bandShape.lineTo(7, 0);
  bandShape.lineTo(-7, 0);
  const bandGeom = new THREE.ExtrudeGeometry(bandShape, { depth: 0.12, bevelEnabled: false });
  for (const [bx, bz] of [[-4, -33], [6, -35]] as [number, number][]) {
    const band = sketch(bandGeom, 30, 'faint');
    band.position.set(bx, 0, bz);
    paint(band, { fill: P.undergrowth });
    treelineGroup.add(band);
  }
  // Cloud masses over the forest — flat cauliflower plates, far enough that the fog
  // washes them to a breath (art-bible sky card).
  const cloudGeom = new THREE.ExtrudeGeometry(cauliflowerShape(), { depth: 0.08, bevelEnabled: false });
  for (const [cx, cy, cz, cs] of [
    [-6, 6.2, -38, 1.6], [4, 7.4, -42, 2.1], [11, 5.8, -37, 1.3],
  ] as [number, number, number, number][]) {
    const cloud = sketch(cloudGeom, 30, 'faint');
    cloud.position.set(cx, cy, cz);
    cloud.scale.setScalar(cs);
    paint(cloud, { fill: P.skyVellum });
    treelineGroup.add(cloud);
  }
  container.add(treelineGroup);

  const advPositions: [number, number, number][] = [
    [-3.2, 0, -0.8],
    [-2.5, 0, 1.0],
    [-1.8, 0, 0.1],
  ];
  // Only one of the three wears cloak-crimson, and he is placed furthest from the
  // goblin's peek position (0.5, 0.9) — index 0 measures out to ~4.1, the other two to
  // ~2.4-3.0 — so two crimson figures never split the read beside a vermilion goblin.
  const cloaks = [P.cloakCrimson, P.cloakIndigo, P.cloakIndigo];
  const adventurers = advPositions.map(([x, y, z], i) => {
    const a = buildAdventurer(true, { fill: cloaks[i] });
    a.position.set(x, y, z);
    a.rotation.y = Math.PI / 2; // faces +x
    container.add(a);
    return a;
  });

  goblin.root.position.set(0.5, -0.7, 0.9); // hidden behind the rock
  container.add(goblin.root);

  // The camp itself is gated off once the run leaves it (timeline.ts) — it used to sit
  // in the far background of every C2 shot. Two things must not go with it: the goblin,
  // who is in every chapter, and the treeline, which C2 still paints. So rather than
  // threading a second group through eighty lines of staging, the set is split once here,
  // after everything is built: whatever is not the pines and not him is the camp.
  const camp = new THREE.Group();
  camp.add(
    ...container.children.filter((child) => child !== treelineGroup && child !== goblin.root),
  );
  container.add(camp);

  return { container, camp, treeline: treelineGroup, ambushFlames, adventurers };
}

// Sky card: a cauliflower is top-lit — round lobes across the top, a dead-flat belly along
// the bottom edge. One shape shared by every cloud plate in the film (the ambush's
// background puffs and the path run's drifting plates) so the silhouette reads the same
// everywhere it appears. No hatch on the underside per the render ban — the flat bottom
// edge alone reads as the shadowed belly.
function cauliflowerShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-1.7, 0);
  s.quadraticCurveTo(-1.85, 0.55, -1.3, 0.6);
  s.quadraticCurveTo(-1.25, 1.05, -0.75, 0.95);
  s.quadraticCurveTo(-0.7, 1.35, -0.15, 1.25);
  s.quadraticCurveTo(-0.05, 1.45, 0.45, 1.3);
  s.quadraticCurveTo(0.55, 1.0, 1.0, 1.05);
  s.quadraticCurveTo(1.15, 0.6, 1.5, 0.55);
  s.quadraticCurveTo(1.8, 0.35, 1.7, 0);
  s.lineTo(-1.7, 0);
  return s;
}

// A thin stratus sliver near the horizon — flat-ish top and bottom, wide and low. Unlike
// the cauliflower plates these never drift: whatever calls this keeps the result out of
// pathClouds so Film.tsx's drift loop never sees it.
function streakShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0);
  s.quadraticCurveTo(-1.6, 0.3, -0.4, 0.22);
  s.quadraticCurveTo(0.6, 0.32, 1.6, 0.18);
  s.quadraticCurveTo(2.3, 0.12, 2.2, 0);
  s.quadraticCurveTo(0.8, -0.12, -1.0, -0.1);
  s.quadraticCurveTo(-1.8, -0.08, -2.2, 0);
  return s;
}

// C2 — path props at z~0, in +x order: fire, lantern, cave, chest, ravens, mushrooms, sign.
function buildPathProps() {
  const container = new THREE.Group();

  const fire2Flames = buildFlames(0);
  fire2Flames.position.set(6, 0, 0);
  container.add(fire2Flames);
  const fire2Rays = buildRayBurst(6, 0.5, 0);
  container.add(fire2Rays);

  // A wrought-iron street lamp, the way a D&D town map draws one: stepped base, tapered
  // iron pole with a finial, a curved arm with a scroll under it, and the lantern HUNG
  // from a hook rather than skewered on a cross-arm. The housing stays centred on
  // (0.19, ~1.1) so the ray burst at (10, 1.1, 0) still fires from inside it.
  const lanternPost = new THREE.Group();
  lanternPost.position.set(10, 0, 0);
  for (const [br, bh, by] of [
    [0.09, 0.07, 0.035],
    [0.062, 0.06, 0.095],
  ] as [number, number, number][]) {
    const tier = sketch(new THREE.CylinderGeometry(br * 0.85, br, bh, 8), 25, 'faint');
    tier.position.y = by;
    paint(tier, { fill: P.iron });
    lanternPost.add(tier);
  }
  const pole = sketch(new THREE.CylinderGeometry(0.022, 0.034, 1.2, 8));
  pole.position.y = 0.72;
  paint(pole, { fill: P.iron });
  lanternPost.add(pole);
  const poleCollar = sketch(new THREE.CylinderGeometry(0.034, 0.034, 0.025, 8), 25, 'faint');
  poleCollar.position.y = 0.88;
  paint(poleCollar, { fill: P.iron });
  lanternPost.add(poleCollar);
  const finial = sketch(new THREE.SphereGeometry(0.032, 7, 5), 25, 'faint', 0.004);
  finial.position.y = 1.36;
  paint(finial, { fill: P.iron });
  const finialTip = sketch(new THREE.ConeGeometry(0.016, 0.05, 5), 20, 'faint');
  finialTip.position.y = 1.41;
  paint(finialTip, { fill: P.iron });
  lanternPost.add(finial, finialTip);

  // the arm curves out and slightly up off the pole — a straight rod is a gallows
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 1.24, 0),
    new THREE.Vector3(0.1, 1.3, 0),
    new THREE.Vector3(0.19, 1.31, 0),
  ]);
  const lanternArm = sketch(new THREE.TubeGeometry(armCurve, 10, 0.012, 5, false), 20, 'form');
  paint(lanternArm, { fill: P.iron });
  lanternPost.add(lanternArm);
  // the scroll curl bracing the arm's underside — the one mark that says wrought iron
  const scroll = sketch(new THREE.TorusGeometry(0.045, 0.008, 4, 10, Math.PI * 1.5), 15, 'faint');
  scroll.position.set(0.075, 1.235, 0);
  scroll.rotation.z = -0.5;
  paint(scroll, { fill: P.iron });
  lanternPost.add(scroll);
  // the S-curl under the bracket (art-bible lamppost card): a small drawn wrought-iron
  // flourish hanging off the arm's underside, distinct from the torus scroll above.
  const bracketCurl = curveLine(
    [
      new THREE.Vector3(0.045, 1.215, 0),
      new THREE.Vector3(0.09, 1.19, 0),
      new THREE.Vector3(0.07, 1.15, 0),
      new THREE.Vector3(0.11, 1.13, 0),
    ],
    'form',
    10,
  );
  paint(bracketCurl, { line: P.iron });
  lanternPost.add(bracketCurl);

  // hook and hanging ring
  const hook = sketch(new THREE.CylinderGeometry(0.007, 0.007, 0.06, 5), 15, 'faint');
  hook.position.set(0.19, 1.275, 0);
  paint(hook, { fill: P.iron });
  const ring = sketch(new THREE.TorusGeometry(0.022, 0.006, 4, 8), 15, 'faint');
  ring.position.set(0.19, 1.235, 0);
  paint(ring, { fill: P.iron });
  lanternPost.add(hook, ring);

  // housing: peaked cap with its own tiny finial, base with a drip knob, corner posts
  // only — a cage, not a box, so the light reads as coming from inside it
  const lanternCap = sketch(new THREE.ConeGeometry(0.1, 0.06, 4), 20, 'faint');
  lanternCap.rotation.y = Math.PI / 4;
  lanternCap.position.set(0.19, 1.185, 0);
  paint(lanternCap, { fill: P.brass });
  const capKnob = sketch(new THREE.SphereGeometry(0.014, 6, 4), 30, 'faint');
  capKnob.position.set(0.19, 1.22, 0);
  paint(capKnob, { fill: P.brass });
  lanternPost.add(lanternCap, capKnob);
  const lanternBase = sketch(new THREE.BoxGeometry(0.15, 0.02, 0.15), 25, 'faint');
  lanternBase.position.set(0.19, 1.02, 0);
  paint(lanternBase, { fill: P.brass });
  const dripKnob = sketch(new THREE.ConeGeometry(0.018, 0.04, 5), 20, 'faint');
  dripKnob.rotation.x = Math.PI;
  dripKnob.position.set(0.19, 0.995, 0);
  paint(dripKnob, { fill: P.brass });
  lanternPost.add(lanternBase, dripKnob);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const bar = sketch(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4), 15, 'faint');
    bar.position.set(0.19 + Math.cos(a) * 0.065, 1.095, Math.sin(a) * 0.065);
    paint(bar, { fill: P.brass });
    lanternPost.add(bar);
  }
  const lampShadow = contact(0.3, 0.24);
  lanternPost.add(lampShadow);
  container.add(lanternPost);
  const lanternRays = buildRayBurst(10, 1.1, 0);
  container.add(lanternRays);

  // Rocks and mouth in one group: color-script §5 #3 has the surrounding stone-cool take
  // colour on the same tween as the door, and `reveal` now masks the shapes it is given
  // rather than a disc around them.
  const cave = new THREE.Group();
  const caveRocks: [number, number, number, number][] = [
    [14, 0.5, -2.8, 0.6],
    [14.9, 0.4, -2.2, 0.5],
    // pulled back from (13.2,-2.3): almost exactly where the door beat solves his stand
    // point, so his feet sat inside the rock's own radius regardless of camera angle.
    // Same x (still the near flank of the mouth), pushed 0.8 deeper so it clears him.
    [13.2, 0.45, -3.1, 0.5],
  ];
  caveRocks.forEach(([x, y, z, r]) => {
    const caveRock = rock(r * 2, 'form', x * 1.7);
    caveRock.position.set(x, y, z);
    paint(caveRock, { fill: P.stoneCool });
    cave.add(caveRock);
  });
  // a dark opening behind the door, set into the rock cluster — the door swings
  // open onto this, not onto more rock. Fixed to the cluster, so it does not
  // rotate with the door.
  const caveMouth = new THREE.Group();
  caveMouth.position.set(13.4, 0.8, -2.2);
  // the cross-hatch alone has nothing behind it but blank paper; a cave-dark backing
  // plane gives the ink-dark tier fill the hatch is meant to sit on
  const mouthFill = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), fillMaterial);
  mouthFill.position.z = -0.01;
  paint(mouthFill, { fill: P.caveDark });
  caveMouth.add(mouthFill);
  const mouthDark = crossHatch(0.9, 1.2, 16);
  caveMouth.add(mouthDark);
  const rimChips: [number, number, number, number][] = [
    [-0.42, 0.35, -0.05, 0.22],
    [0.4, 0.3, 0.05, 0.2],
    [-0.1, 0.62, 0.02, 0.2],
    [0.15, -0.55, -0.03, 0.22],
  ];
  rimChips.forEach(([x, y, z, r]) => {
    const chip = rock(r * 2, 'faint', x * 9 + y * 4);
    chip.position.set(x, y, z);
    paint(chip, { fill: P.rockFace });
    caveMouth.add(chip);
  });
  cave.add(caveMouth);

  // A timber doorframe set into the rock. A door standing free beside a cave mouth
  // read as a prop leaning on the scenery; jambs and a lintel make it an entrance
  // someone built — the dungeon-door glyph on every D&D map. Fixed to the cluster,
  // so the door swings inside it.
  const doorFrame = new THREE.Group();
  doorFrame.position.set(13.4, 0, -2);
  for (const fx of [-0.08, 1.28]) {
    const jamb = sketch(new THREE.BoxGeometry(0.14, 1.75, 0.14), 25, 'form');
    jamb.position.set(fx, 0.875, 0);
    paint(jamb, { fill: P.timberDark });
    doorFrame.add(jamb);
  }
  const lintel = sketch(new THREE.BoxGeometry(1.75, 0.16, 0.18), 25, 'form');
  lintel.position.set(0.6, 1.7, 0);
  paint(lintel, { fill: P.timberDark });
  doorFrame.add(lintel);
  cave.add(doorFrame);
  container.add(cave);

  const doorWidth = 1.2;
  const doorHeight = 1.6;
  const doorThickness = 0.08;
  const caveDoor = new THREE.Group();
  caveDoor.position.set(13.4, 0.8, -2); // hinge at the left edge

  // round-topped door: straight sides up to where a semicircle spanning the full
  // width takes over — the bible's voussoir door, not a rectangular crate lid.
  // Shape lives in the same 0..doorWidth / centred-height frame every other piece
  // below already positions against, so nothing downstream of it has to shift.
  const doorRadius = doorWidth / 2;
  const doorStraightTop = doorHeight / 2 - doorRadius; // where the sides end and the arc begins
  const doorBottom = -doorHeight / 2;
  const doorShape = new THREE.Shape();
  doorShape.moveTo(0, doorBottom);
  doorShape.lineTo(0, doorStraightTop);
  const archSegs = 16;
  for (let i = 0; i <= archSegs; i++) {
    const a = Math.PI - (Math.PI * i) / archSegs; // sweep left-top-right, over the apex
    doorShape.lineTo(doorRadius + doorRadius * Math.cos(a), doorStraightTop + doorRadius * Math.sin(a));
  }
  doorShape.lineTo(doorWidth, doorBottom);
  doorShape.lineTo(0, doorBottom);
  const doorSlab = sketch(new THREE.ExtrudeGeometry(doorShape, { depth: doorThickness, bevelEnabled: false }), 25, 'hero');
  doorSlab.position.z = -doorThickness / 2; // centre the slab's thickness on the hinge's z, like the old box
  paint(doorSlab, { fill: P.timber });
  caveDoor.add(doorSlab);

  // the top of the door's silhouette at a given x — plank seams clip against this so
  // they stop at the round top instead of poking through it
  const doorTopAt = (px: number) => doorStraightTop + Math.sqrt(Math.max(0, doorRadius * doorRadius - (px - doorRadius) ** 2));

  // plank seams — thin proud strips read as the gaps between boards. Straight lines,
  // just shortened near the top so they stay inside the new round-topped face.
  const seamHalf = doorHeight * 0.47;
  for (const px of [doorWidth * 0.22, doorWidth * 0.45, doorWidth * 0.68, doorWidth * 0.9]) {
    const top = Math.min(seamHalf, doorTopAt(px) - 0.02);
    const bottom = -seamHalf;
    const seam = sketch(new THREE.BoxGeometry(0.015, top - bottom, doorThickness + 0.01), 25, 'faint');
    seam.position.set(px, (top + bottom) / 2, 0);
    paint(seam, { fill: P.timber });
    caveDoor.add(seam);
  }

  // strap hinges off the hinge edge, curled at their ends, riveted
  for (const py of [doorHeight * 0.32, -doorHeight * 0.32]) {
    const strapHinge = sketch(new THREE.BoxGeometry(doorWidth * 0.42, 0.05, doorThickness + 0.015));
    strapHinge.position.set(doorWidth * 0.21, py, 0);
    paint(strapHinge, { fill: P.iron });
    caveDoor.add(strapHinge);
    const curl = sketch(new THREE.TorusGeometry(0.035, 0.012, 4, 8, Math.PI * 1.2), 30, 'faint');
    curl.position.set(doorWidth * 0.44, py + 0.01, doorThickness / 2 + 0.01);
    paint(curl, { fill: P.iron });
    caveDoor.add(curl);
    for (const rx of [0.12, 0.3]) {
      const rivet = sketch(new THREE.CylinderGeometry(0.014, 0.014, 0.014, 6), 25, 'faint');
      rivet.rotation.x = Math.PI / 2;
      rivet.position.set(doorWidth * rx, py, doorThickness / 2 + 0.012);
      paint(rivet, { fill: P.iron });
      caveDoor.add(rivet);
    }
  }

  // iron ring handle near the free edge — a gate gets a ring, not a drawer pull
  const ringMount = sketch(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 6), 25, 'faint');
  ringMount.rotation.x = Math.PI / 2;
  ringMount.position.set(doorWidth - 0.18, 0.05, doorThickness / 2 + 0.012);
  paint(ringMount, { fill: P.iron });
  const doorRing = sketch(new THREE.TorusGeometry(0.07, 0.014, 5, 10), 30, 'form');
  doorRing.position.set(doorWidth - 0.18, -0.02, doorThickness / 2 + 0.03);
  doorRing.rotation.x = 0.25;
  paint(doorRing, { fill: P.iron });
  caveDoor.add(ringMount, doorRing);

  container.add(caveDoor);

  const chest = buildChest(18, 0, 0);
  container.add(chest.container);

  // a tree for the ravens to actually perch on — trunk offset from the branch/raven
  // span so it doesn't run through them
  const tree = new THREE.Group();
  tree.position.set(21.2, 0, 0);
  const trunkH = 1.5;
  const trunk = trunkOf(0.2, trunkH, 'form');
  trunk.rotation.z = -0.05; // nothing grows perfectly plumb
  paint(trunk, { fill: P.timberDark });
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
    paint(twig, { fill: P.timberDark });
    tree.add(twig);
  });

  // The bible oak's crown (same lobed lathe as buildOak — a crown is a crown
  // everywhere), sat over the trunk top and kept clear of the branch and its ravens.
  // Its metaball predecessor kept a 0.012 ink shell, which on a lumpy near-camera
  // crown rendered as a fat black band along the rim — the exact bold edge draft 5 cut.
  const treeCrown = lobedCrown(0.55, 0.8, treeSeed++);
  treeCrown.position.y = 1.05;
  treeCrown.rotation.y = 2.1;
  paint(treeCrown, { fill: P.canopy });
  tree.add(treeCrown);
  container.add(tree);

  // §5 beat 5 has no prop to reveal at all — the birds stay raven-slate and what takes
  // colour is the sky and the ground. Neither is geometry the mask can hold, so that beat
  // eases the curtain itself instead (see timeline.ts); there is nothing to anchor here.

  const branch = sketch(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6));
  branch.rotation.z = Math.PI / 2;
  branch.position.set(22, 1.6, 0);
  paint(branch, { fill: P.timberDark });
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
  // everything the signpost is except the board that straightens — grouped so the last
  // beat of the run reveals the whole prop and not just the plank on top of it
  const signPost = new THREE.Group();
  const post = sketch(new THREE.CylinderGeometry(0.036, 0.05, 1.0, 8), 25, 'form', 0.006);
  post.position.set(30, 0.5, 0);
  paint(post, { fill: P.timber });
  signPost.add(post);
  const postCap = sketch(new THREE.ConeGeometry(0.06, 0.09, 6), 25, 'faint');
  postCap.position.set(30, 1.06, 0);
  paint(postCap, { fill: P.timber });
  signPost.add(postCap);
  const postBase = contact(0.3, 0.26);
  postBase.position.set(30, 0.012, 0);
  signPost.add(postBase);

  // a second, lower board fixed to the post and pointing back down the path — one sign
  // is a marker, two are a crossroads, and a crossroads is somewhere worth going
  const backBoard = sketch(new THREE.BoxGeometry(0.44, 0.2, 0.045), 25, 'form');
  backBoard.position.set(29.78, 0.68, 0.01);
  backBoard.rotation.z = -0.08;
  paint(backBoard, { fill: P.plank });
  signPost.add(backBoard);
  const backLetters = hatch(0.3, 0.08, 22, 0, 'faint');
  backLetters.position.set(29.78, 0.68, 0.036);
  backLetters.rotation.z = -0.08;
  signPost.add(backLetters);
  // the back board points too — a pointer both ways is a crossroads
  const backPoint = sketch(new THREE.ConeGeometry(0.1, 0.14, 3), 20, 'form');
  backPoint.rotation.set(0, Math.PI / 6, Math.PI / 2);
  backPoint.position.set(29.53, 0.7, 0.01);
  paint(backPoint, { fill: P.plank });
  signPost.add(backPoint);
  // rope lashing where the boards meet the post
  for (const ly of [0.84, 0.87]) {
    const lash = sketch(new THREE.TorusGeometry(0.048, 0.008, 4, 10), 35, 'faint');
    lash.rotation.x = Math.PI / 2;
    lash.position.set(30, ly, 0);
    paint(lash, { fill: P.bedroll });
    signPost.add(lash);
  }
  container.add(signPost);

  const signBoard = new THREE.Group();
  signBoard.position.set(30, 1.0, 0);
  signBoard.rotation.z = 0.5; // crooked

  // one thick plank with a pointed end (art-bible signpost card), not a box with a cone
  // glued on: a 5-vertex outline — rectangle plus a triangular point — reads as a single
  // arrow-shaped board the way the card's SVG draws it.
  const boardShape = new THREE.Shape();
  boardShape.moveTo(-0.3, -0.15);
  boardShape.lineTo(0.29, -0.15);
  boardShape.lineTo(0.47, 0);
  boardShape.lineTo(0.29, 0.15);
  boardShape.lineTo(-0.3, 0.15);
  boardShape.closePath();
  const boardMesh = sketch(new THREE.ExtrudeGeometry(boardShape, { depth: 0.05, bevelEnabled: false }), 25, 'form');
  boardMesh.position.z = -0.025; // centre the thickness like the box it replaces
  paint(boardMesh, { fill: P.plank });
  signBoard.add(boardMesh);

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
    paint(nail, { fill: P.iron });
    signBoard.add(nail);
  }
  container.add(signBoard);

  return {
    container,
    fire2Flames,
    fire2Rays,
    lanternPost,
    lanternRays,
    cave,
    caveDoor,
    chest: chest.container,
    chestLid: chest.lid,
    chestCoins: chest.coins,
    ravens,
    mushrooms,
    signPost,
    signBoard,
  };
}

// Ground plane (fill only, no edges) + the hand-drawn path under C2.
//
// The plane itself stays untoned on purpose: in pencil illustration the paper is the
// ground, and hatching 600×300 units of it would cost a fortune and read worse than
// nothing. The path is the exception — the camera follows it for thirteen seconds.
function buildGround() {
  const container = new THREE.Group();

  // One plane per ground token, not one plane for the film. The seams are placed where no
  // composed shot can see them:
  //
  //  - `earth` runs the exteriors from behind C1 to x=110. Every C2, C3 and C5 camera
  //    lives inside it, so none of them ever sees an edge.
  //  - `grass` starts at x=110 (color-script §4 C6, "ground plane under the mini world").
  //    C6's establish looks +x from x=117.5 and its top-down at y=40 reaches back only to
  //    x≈118, so the seam sits behind both. From C3 it is 78 units out and ~60% fogged.
  //  - `earth-track` is a worn patch under the camp, not a half-plane. A straight x-seam
  //    anywhere near the origin runs through the middle of both C1 shots — the wide
  //    tableau and the hero close-up both look -z across it — and the script asks for
  //    "ground under camp", which is a patch. Its far edge reads as worn ground behind the
  //    fire, the same way `scorch` reads under it.
  //
  // The tavern gets its own dedicated floor mesh (see buildTavern), so it never touches
  // any of these.
  const earthPlane = new THREE.Mesh(new THREE.PlaneGeometry(270, 300), fillMaterial);
  earthPlane.rotation.x = -Math.PI / 2;
  earthPlane.position.set(-25, 0, 0); // x -160..110
  paint(earthPlane, { fill: P.earth });
  container.add(earthPlane);

  const grassPlane = new THREE.Mesh(new THREE.PlaneGeometry(210, 300), fillMaterial);
  grassPlane.rotation.x = -Math.PI / 2;
  grassPlane.position.set(215, 0, 0); // x 110..320
  paint(grassPlane, { fill: P.grass });
  container.add(grassPlane);

  const campGround = new THREE.Mesh(new THREE.CircleGeometry(4, 40), fillMaterial);
  campGround.rotation.x = -Math.PI / 2;
  campGround.position.set(-2.2, 0.006, 0.3);
  paint(campGround, { fill: P.earthTrack });
  container.add(campGround);

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
  // Each tuft is its own group, positioned rather than baked into its own vertices: the
  // run's last beat reveals them (color-script §5 #7) and a reveal needs something with a
  // place to open out of.
  const tufts: THREE.Group[] = [];
  const tuftSpots: [number, number][] = [
    [3.4, -0.95], [11.6, -0.8], [19.4, -1.0], [27.8, -1.05], [34.6, -0.9],
  ];
  tuftSpots.forEach(([x, z], i) => {
    const lean = (i % 3) * 0.12 - 0.12;
    const blades: THREE.Vector3[] = [];
    // five ragged blades per the art bible, not a neat trio
    for (const [dx, h] of [
      [-0.055, 0.07],
      [-0.03, 0.1],
      [0.0, 0.13],
      [0.03, 0.11],
      [0.055, 0.075],
    ] as [number, number][]) {
      blades.push(new THREE.Vector3(dx, 0.01, 0), new THREE.Vector3(dx + lean * h, h, 0.02));
    }
    // the blade strokes ARE the grass — there is no separate fill mesh for a tuft, so
    // recolouring the stroke is the sanctioned second exception to "the ink stays ink"
    // alongside rays()
    const bladeLine = polyline(blades, 'faint');
    paint(bladeLine, { line: P.grass });
    // a second fan crossed at ~60°, so the tuft exists from every angle instead of
    // vanishing edge-on (art-bible X-class rule)
    const bladeLine2 = polyline(blades, 'faint');
    paint(bladeLine2, { line: P.grass });
    bladeLine2.rotation.y = 1.05;
    const tuft = new THREE.Group();
    tuft.position.set(x, 0, z);
    tuft.add(bladeLine, bladeLine2);
    container.add(tuft);
    tufts.push(tuft);
  });

  // The run goes THROUGH a forest now, not past a couple dozen lonely trees: front and
  // mid rows flanking both sides of the path (art-bible forest card), plus banded
  // silhouettes and cloud plates on the horizon for depth. The OTS camera rides the +z
  // side the whole run (z=2.8, timeline.ts c2Props loop), looking across the path
  // toward -z, so the -z side reads dead-centre in every shot and carries the density;
  // the +z side only has to flank the frame's edges. Every tree here is grouped by row
  // (front vs. mid) rather than added loose, for the same reason the rest of this file
  // groups by chapter — one object per row to gate or adjust instead of walking a tree
  // list. The trees do not move: a per-frame sway read as the background wobbling, not
  // air, so only the cloud plates below drift.
  //
  // Nothing here starts before x=4.5: the t16.5 hard-cut ("...and the last graphite
  // falls off the frame") holds on the goblin at x=2.5 with the fogged C1 treeline bare
  // behind him by design (buildAmbush, above) — crowding that gap with C2 trees would
  // compete with the one shot that is deliberately empty.
  const forestFrontGroup = new THREE.Group(); // front row, both sides
  const forestMidGroup = new THREE.Group(); // far-side mid row, reduced scale/contrast

  // Doubled from the original 21 anchors (user: "a forest with multiple MANY trees") by
  // interleaving a second tree into every gap so crowns overlap and the row reads as a
  // mass, not specimens — same deterministic hand-placed pattern, twice the density, no
  // Math.random. Value discipline per the art bible: front row paints canopyDeep
  // (darkest), mid row paints canopy (one step lighter).
  const pathForest: [number, number, number, number, number][] = [
    // x, z, r, h, tier: 0 = far-side front row, 1 = far-side mid row
    [5.8, -8.2, 0.6, 1.9, 0], [6.7, -6.6, 0.44, 1.4, 0], [7.6, -8.8, 0.5, 1.6, 0],
    [8.5, -9.4, 0.46, 1.35, 0], [9.4, -6.0, 0.5, 1.6, 0], [10.4, -8.0, 0.42, 1.3, 0],
    [11.4, -6.4, 0.56, 1.8, 0], [12.5, -6.0, 0.48, 1.5, 0], [13.6, -7.8, 0.62, 2.0, 0],
    [14.4, -6.6, 0.44, 1.35, 0], [15.3, -8.7, 0.52, 1.65, 0], [16.2, -9.6, 0.46, 1.4, 0],
    [17.2, -6.3, 0.52, 1.65, 0], [18.2, -8.4, 0.42, 1.3, 0], [19.3, -6.7, 0.58, 1.9, 0],
    [20.4, -6.0, 0.48, 1.5, 0], [21.5, -8.5, 0.58, 1.85, 0], [22.3, -6.4, 0.44, 1.35, 0],
    [23.2, -8.7, 0.5, 1.6, 0], [24.1, -9.4, 0.46, 1.4, 0], [25.0, -6.2, 0.55, 1.7, 0],
    [26.6, -8.6, 0.5, 1.55, 0], [27.9, -5.9, 0.44, 1.35, 0], [29.3, -7.6, 0.6, 1.9, 0],
    [31.4, -6.8, 0.46, 1.4, 0], [33.6, -6.4, 0.52, 1.6, 0], [34.4, -9.0, 0.42, 1.3, 0],
    [35.3, -6.8, 0.55, 1.75, 0],
    [5.0, -13.2, 0.44, 1.35, 1], [8.2, -14.0, 0.55, 1.6, 1], [10.4, -11.6, 0.42, 1.3, 1],
    [12.6, -12.2, 0.48, 1.45, 1], [14.7, -14.4, 0.44, 1.35, 1], [16.8, -13.8, 0.52, 1.55, 1],
    [18.9, -12.0, 0.4, 1.25, 1], [21.0, -12.4, 0.5, 1.5, 1], [23.6, -14.2, 0.46, 1.4, 1],
    [26.2, -13.6, 0.54, 1.6, 1], [28.6, -11.8, 0.42, 1.3, 1], [31.0, -12.6, 0.48, 1.45, 1],
    [32.7, -13.4, 0.4, 1.25, 1], [34.4, -12.8, 0.48, 1.45, 1],
  ];
  pathForest.forEach(([x, z, r, h, tier], i) => {
    const fills =
      tier === 0
        ? { tier: P.canopyDeep, trunk: P.timberDark, canopy: P.canopyDeep }
        : { tier: P.canopy, trunk: P.timber, canopy: P.canopy };
    const tree =
      i % 4 === 2
        ? buildOak(r * 1.15, h * 0.82, { canopy: fills.canopy, trunk: fills.trunk })
        : buildPine(r, h, 0.28, { tier: fills.tier, trunk: fills.trunk });
    tree.position.set(x, 0, z);
    (tier === 0 ? forestFrontGroup : forestMidGroup).add(tree);
  });

  // Near side (+z, the camera's own side) only has to flank the frame, not fill it —
  // sparse, and set back far enough (z>=4.6) that the dolly riding at z=2.8 never
  // passes through one.
  const nearForest: [number, number, number, number][] = [
    [4.5, 4.6, 0.5, 1.5], [10.0, 5.4, 0.46, 1.4], [16.5, 4.8, 0.52, 1.55],
    [22.0, 5.8, 0.48, 1.45], [27.5, 4.6, 0.5, 1.5], [33.0, 5.6, 0.46, 1.4],
  ];
  nearForest.forEach(([x, z, r, h], i) => {
    const tree =
      i % 3 === 1
        ? buildOak(r * 1.15, h * 0.82, { canopy: P.canopy, trunk: P.timberDark })
        : buildPine(r, h, 0.28, { tier: P.needle, trunk: P.timberDark });
    tree.position.set(x, 0, z);
    forestFrontGroup.add(tree);
  });
  container.add(forestFrontGroup, forestMidGroup);

  // Small sprig marks in the paper gaps under the front row (art-bible forest card:
  // "dot-clusters and sprigs keeping the edge alive") — cheap two-stroke marks, not full
  // tufts, just enough to keep the line from hardening between trunks.
  const sprigSpots: [number, number][] = [
    [6.2, -5.3], [13.0, -5.5], [20.8, -5.2], [27.2, -5.6], [33.2, -5.3],
  ];
  sprigSpots.forEach(([x, z], i) => {
    const lean = (i % 2) * 0.1 - 0.05;
    const sprig = polyline(
      [
        new THREE.Vector3(-0.05 + lean, 0, 0),
        new THREE.Vector3(-0.02, 0.09, 0),
        new THREE.Vector3(0.02, 0.03, 0),
        new THREE.Vector3(0.06 + lean, 0.11, 0),
      ],
      'faint',
    );
    paint(sprig, { line: P.grass });
    sprig.position.set(x, 0, z);
    forestFrontGroup.add(sprig);
  });

  // Back-row silhouette bands — same flat-plate technique as the C1 treeline's
  // bandShape (buildAmbush, above), one draw call each. Kept east of x=14: the C1
  // treeline already owns x -10..12 at this depth, and its t29.1 reveal is that beat's
  // moment, not this one — a band here would sit in front of it and dull the reveal.
  const pathBandShape = new THREE.Shape();
  pathBandShape.moveTo(-7, 0);
  pathBandShape.lineTo(-6.2, 2.1); // pine-spike
  pathBandShape.lineTo(-5.5, 0.8);
  pathBandShape.quadraticCurveTo(-4.7, 1.5, -3.9, 1.2); // oak-lobe
  pathBandShape.lineTo(-3.1, 2.4); // pine-spike
  pathBandShape.lineTo(-2.3, 0.9);
  pathBandShape.quadraticCurveTo(-1.3, 1.6, -0.4, 1.3); // oak-lobe
  pathBandShape.lineTo(0.5, 2.6); // pine-spike
  pathBandShape.lineTo(1.3, 1.0);
  pathBandShape.quadraticCurveTo(2.3, 1.7, 3.3, 1.3); // oak-lobe
  pathBandShape.lineTo(4.1, 2.3); // pine-spike
  pathBandShape.lineTo(4.9, 0.8);
  pathBandShape.quadraticCurveTo(5.9, 1.4, 6.7, 1.0); // oak-lobe
  pathBandShape.lineTo(7, 0);
  pathBandShape.lineTo(-7, 0);
  const pathBandGeom = new THREE.ExtrudeGeometry(pathBandShape, { depth: 0.12, bevelEnabled: false });
  for (const [bx, bz] of [[16, -25], [24, -27], [32, -25]] as [number, number][]) {
    const band = sketch(pathBandGeom, 30, 'faint');
    band.position.set(bx, 0, bz);
    paint(band, { fill: P.undergrowth });
    container.add(band);
  }

  // Sky along the run — cloud plates spaced so the OTS camera always has one or two
  // above the treeline, same flat cauliflower plate as buildAmbush's sky cloud. `baseX`
  // survives on userData for the gobT-driven drift in Film.tsx.
  const pathCloudGeom = new THREE.ExtrudeGeometry(cauliflowerShape(), { depth: 0.08, bevelEnabled: false });
  const pathClouds: THREE.Group[] = [];
  for (const [cx, cy, cz, cs] of [
    [6, 7.6, -32, 1.9], [14, 6.5, -29, 1.6], [22, 7.8, -33, 2.0],
    [30, 6.6, -30, 1.7], [38, 7.3, -33, 1.8],
  ] as [number, number, number, number][]) {
    const cloud = sketch(pathCloudGeom, 30, 'faint');
    cloud.position.set(cx, cy, cz);
    cloud.scale.setScalar(cs);
    cloud.userData.baseX = cx;
    paint(cloud, { fill: P.skyVellum });
    container.add(cloud);
    pathClouds.push(cloud);
  }

  // Small flat streak clouds near the horizon (art-bible sky card). These are plain
  // container children, never pushed to pathClouds, so Film.tsx's drift loop — which
  // only walks world.pathClouds — never touches them.
  for (const [sx, sy, sz, ss] of [
    [10, 5.0, -36, 2.2], [24, 4.6, -38, 2.6], [34, 5.2, -35, 2.0],
  ] as [number, number, number, number][]) {
    const streak = plate(streakShape(), 'faint');
    streak.position.set(sx, sy, sz);
    streak.scale.setScalar(ss);
    paint(streak, { fill: P.skyVellum });
    container.add(streak);
  }

  // A pale sun disc high in the C2 sky, its light drawn as grey rayGold strokes rather
  // than any lit glow (art-bible sky card: "a pale sun whose light is drawn in grey
  // strokes").
  const sunShape = new THREE.Shape();
  sunShape.absarc(0, 0, 1, 0, Math.PI * 2, false);
  const sun = plate(sunShape, 'faint');
  sun.position.set(26, 8.6, -22);
  sun.scale.setScalar(1.4);
  paint(sun, { fill: P.snow });
  container.add(sun);
  const sunRays = rays(10, 1.15, 1.9, 'faint');
  sunRays.position.copy(sun.position);
  sunRays.scale.setScalar(1.4);
  paint(sunRays, { line: P.rayGold });
  container.add(sunRays);

  // Ground marks clustered near the path (art-bible land card): contour dashes on the
  // verge and a few pebbles. Marks cluster at features; the wash does the rest.
  for (const [dx, dz, da] of [
    [2.6, -1.6, 0.2], [7.8, 1.4, -0.15], [13.2, -1.8, 0.1], [18.4, 1.6, -0.2],
    [23.8, -1.5, 0.15], [29.2, 1.5, -0.1], [33.8, -1.7, 0.2],
  ] as [number, number, number][]) {
    const dash = polyline(
      [
        new THREE.Vector3(dx - 0.22, 0.012, dz),
        new THREE.Vector3(dx, 0.012, dz + 0.05),
        new THREE.Vector3(dx + 0.24, 0.012, dz - 0.02),
      ],
      'faint',
    );
    dash.rotation.y = da;
    paint(dash, { line: P.grassDeep });
    container.add(dash);
  }
  const pebbleSpots: [number, number][] = [[4.8, -1.3], [15.6, 1.2], [26.6, -1.2], [31.8, 1.3]];
  pebbleSpots.forEach(([px, pz], i) => {
    const turn = px * 2.1;
    const pebble = rock(0.1, 'faint', turn);
    pebble.scale.y = 0.7;
    pebble.position.set(px, 0.02, pz);
    paint(pebble, { fill: P.stoneWarm });
    container.add(pebble);
    // Double-edged rocks (art-bible land card): a restated inner edge, just inside the
    // silhouette, is what reads as worn stone on the card. A scaled duplicate with its
    // fill hidden — not a shell; a BackSide ink shell on a rock this small renders as a
    // fat black band, not a second contour.
    if (i < 3) {
      const inner = rock(0.1 * 0.92, 'faint', turn);
      inner.scale.y = 0.7;
      inner.position.set(px, 0.024, pz);
      inner.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && (mesh.material as THREE.Material)?.userData?.role === 'fill') {
          mesh.visible = false;
        }
      });
      container.add(inner);
    }
  });

  // Contour-dash clusters (art-bible land card): 2-4 short parallel dashes lying flat on
  // a gentle roll, always sitting beside a feature (a path bend, a pebble, the camp) —
  // never an even scatter across the plane. Left plain ink like the card's own strokes,
  // not tinted like the grass tufts.
  const contourClusters: [number, number, number, number][] = [
    // path verges, each beside a spine bend or one of the pebbles above
    [9.2, -1.5, 0.3, 3], [17.6, 1.7, -0.25, 2], [25.6, -1.6, 0.2, 3],
    [5.3, -1.7, 0.15, 2], [16.1, 1.75, -0.2, 4], [32.3, 1.85, 0.25, 3],
    // C1 camp verge
    [-3.6, -1.6, 0.4, 3], [-0.6, 1.9, -0.3, 2], [-4.0, 1.5, 0.2, 3],
  ];
  contourClusters.forEach(([cx, cz, rot, n]) => {
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 0.08;
      const dash = polyline(
        [
          new THREE.Vector3(-0.13, 0.012, off - 0.012),
          new THREE.Vector3(0, 0.012, off + 0.016),
          new THREE.Vector3(0.15, 0.012, off - 0.008),
        ],
        'faint',
      );
      dash.rotation.y = rot;
      dash.position.set(cx, 0, cz);
      container.add(dash);
    }
  });

  // A revolved stump beside the run (art-bible land card): squat trunk over a root
  // flare, flat cut top, same STUMP sculpt already used for the theatre's forest floor.
  // Off the path corridor (z <= -5) so the walk and the OTS camera stay clear of it.
  const stumpSr = 0.3;
  const stumpBody = new THREE.Group();
  const stumpMass = sketch(blobs(STUMP, 32), 60, 'faint');
  stumpMass.scale.set(stumpSr * 3.9, 0.5, stumpSr * 3.9);
  stumpMass.position.set(-0.5 * stumpSr * 3.9, -0.225, -0.5 * stumpSr * 3.9);
  paint(stumpMass, { fill: P.timberDark });
  stumpBody.add(stumpMass);
  const stumpTop = sketch(new THREE.CylinderGeometry(stumpSr * 0.85, stumpSr * 0.85, 0.03, 16), 25, 'faint');
  stumpTop.position.y = 0.29; // the flat, paler cut — the one mark that says "cut", not "grew"
  paint(stumpTop, { fill: P.timber });
  stumpBody.add(stumpTop);
  stumpBody.position.set(19, 0.17, -5.5);
  container.add(stumpBody);
  const stumpShadow = contact(stumpSr * 2.3, stumpSr * 1.8);
  stumpShadow.position.set(19, 0, -5.5);
  container.add(stumpShadow);

  return {
    container,
    tufts,
    pathForestFront: forestFrontGroup,
    pathForestMid: forestMidGroup,
    pathClouds,
  };
}

// C3 — theatre set: a rotating disc, forest half facing the path at rest.
function buildTheatre() {
  const container = new THREE.Group();

  const stageDisc = new THREE.Group();
  stageDisc.position.set(44, 0, -2);
  const discMesh = sketch(new THREE.CylinderGeometry(7, 7, 0.3, 32), 25, 'form');
  discMesh.position.y = 0.15;
  paint(discMesh, { fill: P.platformDisc });
  stageDisc.add(discMesh);

  // It is a revolve, and the film only gets to say so once — when it turns. A kerb
  // around the rim, plank seams radiating across the top and the joint line down the
  // middle are the three marks that make a disc read as stagecraft rather than as a
  // coin the world happens to sit on.
  const kerb = sketch(new THREE.CylinderGeometry(7.16, 7.16, 0.12, 32), 25, 'faint');
  kerb.position.y = 0.06;
  paint(kerb, { fill: P.timber });
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
    // near the camp side (x closer to 0) reads canopy; further into the wood reads
    // canopy-deep — the nearest split the script's "near/far" grouping supports on an
    // otherwise unordered spot list. Every third tree is a broadleaf — same mixed-wood
    // rule as the C1 treeline.
    const fills = { tier: x > -3.6 ? P.canopy : P.canopyDeep, trunk: P.timberDark };
    const tree =
      i % 3 === 1
        ? buildOak(r * 1.15, h * 0.85, { canopy: fills.tier, trunk: fills.trunk })
        : buildPine(r, h, 0.15, fills);
    tree.position.set(x, 0.3, z);
    stageDisc.add(tree);
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
    // the tone strokes are the forest floor's colour — same sanctioned exception as the
    // path's grass tufts
    const patch = hatch(w, d, 4, a, 'faint');
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.305, z);
    paint(patch, { line: P.undergrowth });
    stageDisc.add(patch);
  });
  for (const [sx, sz, sr] of [
    [-3.4, 2.9, 0.3],
    [-4.2, -0.9, 0.24],
  ] as [number, number, number][]) {
    // a sculpted stump with a root flare — the cylinder read as a pipe end
    const stump = new THREE.Group();
    const stumpMass = sketch(blobs(STUMP, 32), 60, 'faint');
    stumpMass.scale.set(sr * 3.9, 0.5, sr * 3.9);
    stumpMass.position.set(-0.5 * sr * 3.9, -0.225, -0.5 * sr * 3.9);
    stump.add(stumpMass);
    stump.position.set(sx, 0.47, sz);
    paint(stump, { fill: P.timberDark });
    stageDisc.add(stump);
    const rings = hatch(sr * 1.5, sr * 1.5, 9, 0.3, 'faint');
    rings.rotation.x = -Math.PI / 2;
    rings.position.set(sx, 0.645, sz);
    stageDisc.add(rings);
  }
  for (const [bx, bz, br] of [
    [-2.2, -1.4, 0.42],
    // was (-5.8,0.4): almost exactly on the radius toward the rope-pull stand point
    // (world 38.5,0, local -5.5,2 — same ~5.8 radius from the disc centre, 16 degrees off
    // the same angle), so the haul/wave beats read him planted against it. Swung round to
    // the opposite side of the disc, where the +=pi turntable rotation carries it through
    // t31.5-36 without ever crossing his side.
    [-1.0, -5.71, 0.34],
    [-1.0, 2.7, 0.28],
  ] as [number, number, number][]) {
    const boulder = rock(br * 2, 'faint', bx * 1.9);
    boulder.position.set(bx, 0.3 + br * 0.5, bz);
    paint(boulder, { fill: P.rockFace });
    stageDisc.add(boulder);
  }
  // the fallen trunk is the limb column laid on its side — a log grew too
  const fallen = new THREE.Group();
  const logMass = sketch(blobs(COLUMN, 26), 60, 'faint');
  logMass.scale.set(1.16, 2.6, 1.16);
  logMass.position.set(-0.58, -1.3, -0.58);
  fallen.add(logMass);
  fallen.rotation.set(0, 0.5, Math.PI / 2 + 0.06);
  fallen.position.set(-3.0, 0.48, -2.8);
  paint(fallen, { fill: P.timberDark });
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
    const peak = sketch(
      roughen(new THREE.ConeGeometry(r, h, 14, 8), r * 0.13, 1.8, x * 5),
      25,
      'form',
      0.03,
    );
    peak.position.set(x, 0.3 + h / 2, z);
    paint(peak, { fill: P.stoneCool });
    stageDisc.add(peak);

    // The snowline is a near-white plate on a sky-overcast fog — the one place in the
    // painted film a fill approaches paper value, and the whole reason the reveal of this
    // half lands as a temperature drop. It needs its own geometry to carry a second fill:
    // a smaller cone sharing the main peak's apex.
    const snowCap = sketch(
      roughen(new THREE.ConeGeometry(r * 0.42, h * 0.38, 14, 5), r * 0.05, 2.0, x * 5 + 1),
      25,
      'faint',
    );
    snowCap.position.set(x, 0.3 + h - (h * 0.38) / 2, z);
    paint(snowCap, { fill: P.snow });
    stageDisc.add(snowCap);

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
    const scree = rock(fr * 2, 'faint', fx * 2.3);
    scree.position.set(fx, 0.3 + fr * 0.6, fz);
    paint(scree, { fill: P.rockFace });
    stageDisc.add(scree);
  }
  for (const [tx, tz] of [
    [1.3, 3.4],
    [2.1, 4.2],
    [1.1, -3.6],
    [2.6, -4.1],
    [6.4, 2.0],
  ] as [number, number][]) {
    const pine = buildPine(0.34, 0.9, 0.12, { tier: P.needle, trunk: P.timberDark });
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
  paint(ropeMesh, { fill: P.bedroll });
  rope.add(ropeMesh);

  // strand twist — short wraps climbing the tube
  for (let i = 0; i < 6; i++) {
    const pt = ropeCurve.getPointAt(i / 6);
    const wrap = sketch(new THREE.TorusGeometry(0.026, 0.006, 4, 8), 15, 'faint');
    wrap.position.copy(pt);
    wrap.rotation.set(Math.PI / 2, 0.5, 0);
    paint(wrap, { fill: P.bedroll });
    rope.add(wrap);
  }

  // a knot near the bottom
  const knot = sketch(new THREE.IcosahedronGeometry(0.045, 0), 30, 'form');
  knot.position.copy(ropeCurve.getPointAt(0.92));
  paint(knot, { fill: P.bedroll });
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
    paint(strand, { fill: P.bedroll });
    rope.add(strand);
  }

  // A small coil where the rope meets the floor — the frayed end above is the grip
  // point, but the rope itself keeps going and piles up on the ground below it. Three
  // flattened loops, shrinking radius and offset centre per loop (hand-coiled, not
  // concentric circles), plus a short drop feeding the rope's end into the pile.
  const coilCenter = new THREE.Vector3(frayEnd.x - 0.01, 0, frayEnd.z - 0.02);
  const coilLoops: [number, number, number, number, number, number][] = [
    // [rx, rz, y, angle offset, cx offset, cz offset]
    [0.11, 0.09, 0.012, 0, 0, 0.01],
    [0.08, 0.065, 0.026, 0.6, -0.012, -0.008],
    [0.05, 0.04, 0.04, 1.2, 0.008, 0.006],
  ];
  coilLoops.forEach(([rx, rz, y, offset, cx, cz]) => {
    const cxAbs = coilCenter.x + cx;
    const czAbs = coilCenter.z + cz;
    const pts: THREE.Vector3[] = [];
    const n = 14;
    for (let k = 0; k <= n; k++) {
      const a = offset + (k / n) * Math.PI * 2;
      pts.push(new THREE.Vector3(cxAbs + Math.cos(a) * rx, y, czAbs + Math.sin(a) * rz));
    }
    const loop = polyline(pts, 'faint');
    paint(loop, { line: P.bedroll });
    rope.add(loop);
  });
  const coilFeed = curveLine(
    [
      frayEnd,
      new THREE.Vector3(coilCenter.x, 0.16, coilCenter.z + 0.01),
      new THREE.Vector3(coilCenter.x, 0.04, coilCenter.z),
    ],
    'form',
  );
  paint(coilFeed, { line: P.bedroll });
  rope.add(coilFeed);

  container.add(rope);

  return { container, stageDisc, rope };
}

// The only part of him the table scene ever shows. It slides in from behind the die,
// tips it one face, and leaves.
function buildFinger(): THREE.Group {
  const g = new THREE.Group();

  // one sculpted finger: knuckle, mid segment, lifting tip and pad fused — the
  // two-cylinders-and-a-ball version read as a dowel with a marble on it
  const fingerMass = sketch(
    blobs(
      [
        ball(0.5, 0.5, 0.28, 0.17), // knuckle
        ball(0.5, 0.52, 0.5, 0.15), // mid segment
        ball(0.5, 0.56, 0.7, 0.13), // tip, lifting
        ball(0.5, 0.6, 0.82, 0.09), // pad
      ],
      32,
    ),
    60,
    'form',
  );
  fingerMass.scale.set(0.3, 0.3, 0.44);
  fingerMass.position.set(-0.15, -0.155, -0.22);
  paint(fingerMass, { fill: P.gobSkin });
  g.add(fingerMass);

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

  // 22 deep, not 9: the boards and the staging all live in the front nine, but a
  // portrait viewport pulls the lens back along its own axis (framing.ts) until the
  // bottom of frame lands about ten units in front of the table. Plain floorboard fill
  // out there is the cheapest possible answer and it beats the exterior ground the shot
  // used to show instead.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 22), fillMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(80, 0.01, 7);
  paint(floor, { fill: P.floorboard });
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

  // The room is a back wall and nothing else, so every wide shot in the chapter showed
  // exterior ground and sky running past its left and right edges: the composed frame is
  // about 14 units across at the back wall and the wall is 12. Two side wings close the
  // box. Everything here is 14 units tall — four times anything the composed lens sees —
  // because height costs one number and portrait needs it: the fov clamp plus the
  // pull-back (framing.ts) puts the top of frame around y=12 at the back wall, and below
  // 14 that is sky.
  const wall = sketch(new THREE.PlaneGeometry(12, 14), 25, 'form');
  wall.position.set(80, 7, -4);
  paint(wall, { fill: P.plank });
  container.add(wall);

  // x=74 / x=86 are the floor's own edges, so the wings land on it with no gap. Each
  // faces into the room; from outside the set they are invisible, which is fine — the
  // lens never leaves it.
  for (const [wx, wr] of [
    [74, Math.PI / 2],
    [86, -Math.PI / 2],
  ] as [number, number][]) {
    const wing = sketch(new THREE.PlaneGeometry(8, 14), 25, 'faint');
    wing.position.set(wx, 7, 0);
    wing.rotation.y = wr;
    paint(wing, { fill: P.plank });
    container.add(wing);
  }

  // Timber framing. The back wall is the backdrop of every shot in this chapter and it
  // was one flat rectangle — posts, a beam and a rail turn it into a room someone built.
  for (const px of [-4.6, -1.8, 1.8, 4.6]) {
    const postW = sketch(new THREE.BoxGeometry(0.17, 4, 0.12), 25, 'form');
    postW.position.set(80 + px, 2, -3.94);
    paint(postW, { fill: P.timberDark });
    container.add(postW);
  }
  for (const [py, ph] of [
    [3.72, 0.2],
    [1.05, 0.13],
  ] as [number, number][]) {
    const beam = sketch(new THREE.BoxGeometry(12, ph, 0.14), 25, 'faint');
    beam.position.set(80, py, -3.93);
    paint(beam, { fill: P.timberDark });
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
  // the eye takes a regular grid for a mechanism rather than for darkness. sky-dusk — the
  // night outside, and the room's only cool plate — needs a fill behind the hatch to sit on.
  const nightFill = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 1.12), fillMaterial);
  nightFill.position.z = -0.021;
  paint(nightFill, { fill: P.skyDusk });
  win.add(nightFill);
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
  paint(sill, { fill: P.timber });
  win.add(sill);
  container.add(win);

  // A hearth. The room is lit by something, the film's whole grammar is fire and light,
  // and the left third of the backdrop was empty wall.
  const hearth = new THREE.Group();
  hearth.position.set(76.4, 0, -3.85);
  const breast = sketch(new THREE.BoxGeometry(1.9, 3.4, 0.5), 25, 'form');
  breast.position.set(0, 1.7, -0.2);
  paint(breast, { fill: P.stoneWarm });
  hearth.add(breast);
  const mantel = sketch(new THREE.BoxGeometry(2.2, 0.14, 0.42), 25, 'form');
  mantel.position.set(0, 1.42, 0.04);
  paint(mantel, { fill: P.timberDark });
  hearth.add(mantel);
  // the firebox is a cross-hatch with nothing behind it — cave-dark gives the ink-dark
  // tier fill it needs, same fix as the cave mouth
  const fireBoxFill = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.15), fillMaterial);
  fireBoxFill.position.set(0, 0.62, 0.059);
  paint(fireBoxFill, { fill: P.caveDark });
  hearth.add(fireBoxFill);
  const fireBox = crossHatch(1.2, 1.15, 9);
  fireBox.position.set(0, 0.62, 0.06);
  hearth.add(fireBox);
  for (const [lx, ly, rot] of [
    [-0.12, 0.16, 0.25],
    [0.1, 0.28, -0.4],
  ] as [number, number, number][]) {
    const log = new THREE.Group();
    const hearthLogMass = sketch(blobs(COLUMN, 26), 60, 'faint');
    hearthLogMass.scale.set(0.6, 0.85, 0.6);
    hearthLogMass.position.set(-0.3, -0.425, -0.3);
    log.add(hearthLogMass);
    log.rotation.set(0, 0.1, Math.PI / 2 + rot);
    log.position.set(lx, ly, 0.1);
    paint(log, { fill: P.timberDark });
    hearth.add(log);
  }
  const hearthFire = buildFlames(1);
  hearthFire.position.set(0, 0.3, 0.14);
  hearthFire.scale.setScalar(1.4);
  hearth.add(hearthFire);
  const hearthStone = sketch(new THREE.BoxGeometry(2.0, 0.09, 0.7), 25, 'faint');
  hearthStone.position.set(0, 0.045, 0.4);
  paint(hearthStone, { fill: P.stoneWarm });
  hearth.add(hearthStone);
  container.add(hearth);

  // a shelf of bottles on the other side, to answer the hearth across the backdrop
  const shelf = sketch(new THREE.BoxGeometry(2.0, 0.08, 0.28), 25, 'form');
  shelf.position.set(83.4, 1.75, -3.8);
  paint(shelf, { fill: P.timber });
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
    paint(bottle, { fill: P.water });
    container.add(bottle);
    const neck = sketch(new THREE.CylinderGeometry(r * 0.3, r * 0.4, h * 0.28, 6), 25, 'faint');
    neck.position.set(83.4 + ox, 1.79 + h + h * 0.13, -3.8);
    paint(neck, { fill: P.water });
    container.add(neck);
  });

  const tableTop = sketch(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 24), 25, 'form');
  tableTop.position.set(80, 0.85, 0);
  paint(tableTop, { fill: P.timber });
  container.add(tableTop);
  // an edge lip and radial planks: the table is the stage of this whole chapter
  const tableLip = sketch(new THREE.CylinderGeometry(1.64, 1.64, 0.05, 24), 25, 'faint');
  tableLip.position.set(80, 0.83, 0);
  paint(tableLip, { fill: P.timberDark });
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
  paint(tableLeg, { fill: P.timberDark });
  container.add(tableLeg);
  const tableFoot = sketch(new THREE.CylinderGeometry(0.52, 0.6, 0.08, 12), 25, 'faint');
  tableFoot.position.set(80, 0.04, 0);
  paint(tableFoot, { fill: P.timberDark });
  container.add(tableFoot);
  const tableShadow = contact(3.0, 2.2);
  tableShadow.position.set(80, 0.013, 0.1);
  container.add(tableShadow);

  const die = new THREE.Group();
  const built = dieFaces(0.35);
  const dieInner = sketch(built.geom, 25, 'hero');
  dieInner.position.set(78.6, 1.7, 0.6); // tumbles to rest near (80, 1.21, 0)
  paint(dieInner, { fill: P.dieBone });

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

  // dm/player1/player2 are painted like the C1 adventurers; the doc names cloak-indigo
  // for the DM specifically, and the two players take the same default rather than
  // reopening the "only one crimson" rule that was scoped to the ambush scene.
  const dm = buildAdventurer(false, { fill: P.cloakIndigo });
  dm.scale.setScalar(1.3);
  dm.position.set(80, 0, -2.4);
  container.add(dm);

  const player1 = buildAdventurer(false, { fill: P.cloakIndigo });
  player1.position.set(78.3, 0, 1.6);
  player1.rotation.y = Math.PI; // facing the table
  container.add(player1);
  const player2 = buildAdventurer(false, { fill: P.cloakIndigo });
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
    paint(mug, { fill: P.stoneWarm });
    container.add(mug);
    const handle = sketch(new THREE.TorusGeometry(0.035, 0.009, 4, 8, Math.PI), 20, 'faint');
    handle.rotation.set(0, Math.PI / 2 + i, 0);
    handle.position.set(80 + ox + Math.cos(i) * 0.06, 0.96, oz + Math.sin(i) * 0.06);
    paint(handle, { fill: P.stoneWarm });
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
    paint(sheet, { fill: PAPER }); // character sheets are literally paper — permitted here
    container.add(sheet);
    const written = hatch(0.24, 0.17, 22, 0, 'faint');
    written.rotation.set(-Math.PI / 2, 0, rot);
    written.position.set(80 + ox, 0.924, oz);
    container.add(written);
  });
  const pencilStub = sketch(new THREE.CylinderGeometry(0.011, 0.011, 0.17, 6), 25, 'faint');
  pencilStub.rotation.set(0, 0.5, Math.PI / 2);
  pencilStub.position.set(78.85, 0.925, 0.6);
  paint(pencilStub, { fill: P.timber });
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
    paint(panel, { fill: P.tavernCloth });
    screen.add(panel);
    // the referee's side of a screen is covered in tables; three blank white slabs
    // read as a projector screen standing on the table
    const printed = hatch(0.22, 0.24, 12, 0, 'faint');
    printed.position.set(px + Math.sin(pr) * 0.012, 0.17, Math.cos(pr) * 0.012);
    printed.rotation.y = pr;
    screen.add(printed);
  }
  container.add(screen);

  // a tankard by the table edge — the one prop that says "tavern" in a close cut
  const tankard = sketch(new THREE.CylinderGeometry(0.075, 0.09, 0.2, 9), 25, 'form');
  tankard.position.set(79.15, 1.01, 0.65);
  paint(tankard, { fill: P.tavernCloth });
  container.add(tankard);
  const tankardHandle = sketch(new THREE.TorusGeometry(0.06, 0.014, 4, 8, Math.PI), 30, 'faint');
  tankardHandle.position.set(79.06, 1.01, 0.65);
  tankardHandle.rotation.z = Math.PI / 2;
  paint(tankardHandle, { fill: P.tavernCloth });
  container.add(tankardHandle);
  const tankardFoam = sketch(new THREE.SphereGeometry(0.07, 7, 5), 40, 'faint', 0.004);
  tankardFoam.scale.y = 0.35;
  tankardFoam.position.set(79.15, 1.12, 0.65);
  paint(tankardFoam, { fill: P.candle });
  container.add(tankardFoam);

  // a candle on the table — the room's light has to come from somewhere in frame
  // a shallow turned dish under the holder — the art bible's tweak note: a bare
  // candlestick standing on bare boards reads as a prop dropped there, not placed
  const candleDishProfile: [number, number][] = [
    [0.0, 0.0],
    [0.78, 0.0],
    [1.0, 0.4],
    [0.86, 0.46],
  ];
  const candleDish = sketch(
    new THREE.LatheGeometry(
      candleDishProfile.map(([px, py]) => new THREE.Vector2(px * 0.1, py * 0.025)),
      16,
    ),
    30,
    'faint',
  );
  candleDish.position.set(81.3, 0.9, -0.8);
  paint(candleDish, { fill: P.brass });
  container.add(candleDish);

  const candlestick = sketch(new THREE.CylinderGeometry(0.05, 0.09, 0.05, 8), 25, 'faint');
  candlestick.position.set(81.3, 0.94, -0.8);
  paint(candlestick, { fill: P.brass });
  const candleShaft = sketch(new THREE.CylinderGeometry(0.028, 0.032, 0.26, 8), 25, 'faint');
  candleShaft.position.set(81.3, 1.09, -0.8);
  paint(candleShaft, { fill: P.candle });
  // small: at 0.11 tall on a 0.26 candle this read as a rocket standing on the table
  const candleFlame = sketch(new THREE.ConeGeometry(0.02, 0.06, 6), 18, 'form');
  candleFlame.position.set(81.3, 1.25, -0.8);
  paint(candleFlame, { fill: P.flameCore });
  container.add(candlestick, candleShaft, candleFlame);

  // rays at the flame — this die-shot candle carries no timeline reveal (it's always
  // lit set dressing, unlike the montage's three-candle beat), so the burst is drawn
  // at full scale rather than wrapped for a tween. Small radii: this is a background
  // prop the die-shot only grazes, not the film's "candles lit" moment.
  const candleSetRays = rays(8, 0.05, 0.13, 'faint');
  candleSetRays.position.set(81.3, 1.25, -0.8);
  paint(candleSetRays, { line: P.rayGold });
  container.add(candleSetRays);

  // seating, so three figures standing round a table read as three people at a table
  const buildBench = (x: number, z: number, len: number, rot: number): THREE.Group => {
    const b = new THREE.Group();
    b.position.set(x, 0, z);
    b.rotation.y = rot;
    const seat = sketch(new THREE.BoxGeometry(len, 0.09, 0.34), 25, 'faint');
    seat.position.y = 0.44;
    paint(seat, { fill: P.timberDark });
    b.add(seat);
    for (const lx of [-len / 2 + 0.14, len / 2 - 0.14]) {
      const legB = sketch(new THREE.BoxGeometry(0.08, 0.44, 0.28), 25, 'faint');
      legB.position.set(lx, 0.22, 0);
      paint(legB, { fill: P.timberDark });
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
  paint(doorSlab2, { fill: P.timber });
  door.add(doorSlab2);
  for (const px of [-0.32, 0, 0.32]) {
    const plank = sketch(new THREE.BoxGeometry(0.02, 1.9, 0.1), 25, 'faint');
    plank.position.x = px;
    paint(plank, { fill: P.timber });
    door.add(plank);
  }
  for (const py of [0.6, -0.6]) {
    const band = sketch(new THREE.BoxGeometry(1.0, 0.06, 0.11), 25, 'faint');
    band.position.y = py;
    paint(band, { fill: P.iron });
    door.add(band);
  }
  const knob = sketch(new THREE.SphereGeometry(0.05, 7, 5), 25, 'faint', 0.006);
  knob.position.set(0.38, -0.05, 0.08);
  paint(knob, { fill: P.brass });
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
    paint(platform, { fill: P.platformDisc });
    container.add(platform);
    // a rim and a shadow — each cut opens on this disc, and a bare cylinder edge was
    // the first thing every one of the six frames showed
    const rim = sketch(new THREE.CylinderGeometry(2.56, 2.56, 0.07, 24), 25, 'faint');
    rim.position.set(x, 0.045, Z);
    paint(rim, { fill: P.timber });
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
  paint(mapTable, { fill: P.timberDark });
  container.add(mapTable);
  // it was a slab hanging in mid-air over the platform
  for (const [lx, lz] of [
    [-0.68, -0.38], [0.68, -0.38], [-0.68, 0.38], [0.68, 0.38],
  ] as [number, number][]) {
    const leg = sketch(new THREE.BoxGeometry(0.07, 0.66, 0.07), 25, 'faint');
    leg.position.set(xs[0] + lx, 0.53, Z + lz);
    paint(leg, { fill: P.timberDark });
    container.add(leg);
  }
  // The map he is drawing the road onto. It is wider than the table on purpose — the
  // road grows to 1.8 across, and a road running off the edge of its own map was the
  // thing that made the first cut read as a plank rather than a drawing. A drawn map is
  // paper — one of the three literal-paper exceptions.
  const mapSheet = sketch(new THREE.BoxGeometry(1.88, 0.01, 0.86), 25, 'faint');
  mapSheet.position.set(xs[0], 0.948, Z);
  paint(mapSheet, { fill: PAPER });
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
    const weightStone = rock(0.12, 'faint', wx * 11);
    weightStone.position.set(xs[0] + wx, 0.98, Z + wz);
    paint(weightStone, { fill: P.rockFace });
    container.add(weightStone);
  }
  const inkpot = sketch(new THREE.CylinderGeometry(0.07, 0.085, 0.11, 8), 25, 'faint');
  inkpot.position.set(xs[0] + 0.52, 1.0, Z - 0.3);
  paint(inkpot, { fill: P.caveDark });
  container.add(inkpot);
  const quill = sketch(new THREE.ConeGeometry(0.022, 0.34, 5), 20, 'faint');
  quill.rotation.set(0.4, 0, 0.35);
  quill.position.set(xs[0] + 0.52, 1.2, Z - 0.3);
  paint(quill, { fill: P.gobTooth });
  container.add(quill);
  const roadLine = new THREE.Group();
  // 1.8 long, not 3: a three-unit road cannot fit a phone frame at any distance close
  // enough to read the goblin drawing it, and it overhung the table on both sides.
  roadLine.position.set(xs[0] - 0.9, 0.96, Z);
  roadLine.scale.x = 0;
  const roadBox = sketch(new THREE.BoxGeometry(1.8, 0.02, 0.12));
  roadBox.position.x = 0.9; // grows away from the anchor as scale.x -> 1
  // the road inks itself in warm — the one saturated mark on a white sheet
  paint(roadBox, { fill: P.ember });
  roadLine.add(roadBox);
  container.add(roadLine);

  // vignette 1 — the monster, rebuilt per the art-bible sheet: R-class bulk (a lumpy
  // profile revolved, same lathe-and-shell technique as the mushroom cap and the
  // goblin's own torso) plus S-class solid arms, not one marching-cubes blob. The old
  // blob had no facets for the sketch pass's EdgesGeometry to catch, so at vignette
  // distance it read as a featureless dome; a revolve's profile bends give it real
  // ring-form lines (haunch, waist, chest, neck, head) the way the mushroom's lip
  // curl does. Non-uniform scale (not the profile) breaks the perfect-cone symmetry.
  const monster = new THREE.Group();
  monster.position.set(xs[1], 0.9, Z);
  monster.scale.set(0, 0, 0);

  // radius, height pairs — wide seated haunch low down, the waist pulls in at
  // standing height (this is the clearance the goblin works in, so it stays narrow
  // rather than the old blob's 0.6+ belly), a chest hump, a narrow neck, then a
  // small head lobe separated from the shoulders — the old profile topped out at
  // 0.58 with no head at all, which is half of why it read as a dome.
  const bulkProfile: [number, number][] = [
    [0.02, -0.86], [0.6, -0.8], [0.68, -0.6], [0.6, -0.35],
    [0.46, -0.1], [0.4, 0.15], [0.32, 0.35], [0.22, 0.52],
    [0.16, 0.6], [0.28, 0.66], [0.32, 0.76], [0.16, 0.85], [0.02, 0.88],
  ];
  // linear read of the same curve the lathe revolves, so shag and arms land ON the
  // surface instead of floating off it
  const bulkR = (y: number): number => {
    for (let i = 1; i < bulkProfile.length; i++) {
      const [r0, y0] = bulkProfile[i - 1];
      const [r1, y1] = bulkProfile[i];
      if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
    return bulkProfile[bulkProfile.length - 1][0];
  };
  // shallower in z than the old blob's front face (which sat deep enough to bury
  // the goblin's stand point inside it) — forced perspective does the depth work
  const bulkScale = new THREE.Vector3(1.15, 1.0, 0.62);
  const bulk = sketch(
    new THREE.LatheGeometry(bulkProfile.map(([r, y]) => new THREE.Vector2(r, y)), 10),
    32,
    'form',
    0.03,
  );
  bulk.scale.copy(bulkScale);
  bulk.rotation.z = 0.05; // nothing this big sits perfectly plumb
  paint(bulk, { fill: P.monsterHide });
  monster.add(bulk);

  // shag — the bible's own note: "shag drawn as scored ticks", clumps of short tufts,
  // not hatch()'s parallel pinstripes (the film's no-hatch rule). Each clump is 3-6
  // individual 3-point tick strokes at varying angle, scattered tangent to the surface
  // via the same bulkR(y) lookup the old hatch patches used. Deterministic via
  // treeVary — no Math.random(). Angles favour the -70..140 deg arc — the vignette
  // camera's front-right quarter — with two clumps held back at 200/260 for the
  // neighbouring c5 shots that catch other angles.
  const shagClumps: [number, number, number, number][] = [
    [-1.222, -0.65, 0.28, 0.2], [-0.698, -0.55, 0.26, 0.19],
    [-0.175, -0.3, 0.24, 0.17], [0.873, 0.05, 0.2, 0.14],
    [1.92, 0.4, 0.16, 0.12], [3.491, -0.6, 0.26, 0.18],
    [4.538, -0.3, 0.22, 0.15],
  ];
  shagClumps.forEach(([a, y, w, h], ci) => {
    const r = bulkR(y);
    const clump = new THREE.Group();
    const count = 3 + Math.floor(treeVary(ci, 0) * 4); // 3..6 ticks per clump
    for (let i = 0; i < count; i++) {
      const cx = (treeVary(ci, i * 4 + 1) - 0.5) * w;
      const cy = (treeVary(ci, i * 4 + 2) - 0.5) * h;
      const ang = (treeVary(ci, i * 4 + 3) - 0.5) * 2.4; // per-tick angle — tuft, not stripe
      const len = 0.025 + treeVary(ci, i * 4 + 4) * 0.02;
      const dx = Math.sin(ang) * len * 0.5;
      const dy = Math.cos(ang) * len * 0.5;
      const tick = polyline(
        [
          new THREE.Vector3(cx - dx, cy - dy, 0),
          new THREE.Vector3(cx, cy, 0.006),
          new THREE.Vector3(cx + dx, cy + dy, 0),
        ],
        'faint',
      );
      clump.add(tick);
    }
    clump.position.set(Math.cos(a) * r * bulkScale.x, y * bulkScale.y, Math.sin(a) * r * bulkScale.z);
    clump.rotation.y = Math.PI / 2 - a; // faces outward along the surface normal
    paint(clump, { line: P.monsterHide });
    monster.add(clump);
  });

  // arms — S-class solid masses, planted like knuckles rather than blended into the
  // bulk; the far one bigger, per the sheet's forced perspective. Two tapered
  // segments (upper arm, forearm) meeting at a bent elbow instead of one straight
  // cylinder — a single rod shades as a flat tube under lighting; the elbow break
  // gives the lit render two distinct round masses to shade. Mitt and claws stay
  // hung off the same `paw` point, so the vignette staging doesn't move.
  for (const side of [-1, 1] as const) {
    const big = side === 1 ? 1.25 : 1;
    // tucked close to the haunch, not flared wide — a wide-flung arm swept its whole
    // diagonal straight through the goblin's stand point on the far side
    const shoulder = new THREE.Vector3(side * (bulkR(0.3) * bulkScale.x + 0.05), 0.32, 0.12);
    const paw = new THREE.Vector3(side * (bulkR(0.3) * bulkScale.x + 0.14) * big, -0.5, 0.26 * big);
    const elbow = shoulder.clone().lerp(paw, 0.48);
    elbow.x += side * 0.045 * big;
    elbow.z += 0.05 * big;

    const upper = sketch(
      new THREE.CylinderGeometry(0.075 * big, 0.1 * big, shoulder.distanceTo(elbow), 8),
      25,
      'form',
    );
    upper.position.copy(shoulder).lerp(elbow, 0.5);
    upper.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), elbow.clone().sub(shoulder).normalize());
    paint(upper, { fill: P.monsterHide });
    monster.add(upper);

    const forearm = sketch(
      new THREE.CylinderGeometry(0.05 * big, 0.075 * big, elbow.distanceTo(paw), 8),
      25,
      'form',
    );
    forearm.position.copy(elbow).lerp(paw, 0.5);
    forearm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), paw.clone().sub(elbow).normalize());
    paint(forearm, { fill: P.monsterHide });
    monster.add(forearm);

    const mitt = sketch(new THREE.SphereGeometry(0.1 * big, 8, 6), 25, 'form');
    mitt.position.copy(paw);
    paint(mitt, { fill: P.monsterHide });
    monster.add(mitt);
    // claw fan off the mitt
    for (const cx of [-1, 0, 1]) {
      const claw = sketch(new THREE.ConeGeometry(0.032 * big, 0.14 * big, 4), 20, 'faint');
      claw.position.set(paw.x + cx * 0.075 * big, paw.y - 0.07 * big, paw.z + 0.08 * big);
      claw.rotation.x = 1.9;
      paint(claw, { fill: P.caveDark });
      monster.add(claw);
    }
  }

  // horn nubs, on the head lobe's crown
  for (const side of [-1, 1]) {
    const nub = sketch(new THREE.ConeGeometry(0.06, 0.18, 5), 20, 'faint');
    nub.position.set(side * 0.13, 0.84, 0.1);
    nub.rotation.z = -side * 0.35;
    paint(nub, { fill: P.stoneCool });
    monster.add(nub);
  }
  // heavy brow bar over pale lantern eyes — the single most important read on this
  // asset. The token is what fixes the under-read (flameCore near-paper, not rayGold's
  // mid-grey — that tone never separated from the fur); the SIZE stays small, per the
  // card: tiny pale lanterns low on a small head against the mound. A 0.13 pass here
  // read as cartoon eyeballs and swallowed the card's big-body/small-eyes contrast.
  for (const side of [-1, 1]) {
    const ridge = sketch(new THREE.BoxGeometry(0.16, 0.05, 0.1), 25, 'form');
    ridge.position.set(side * 0.11, 0.73, 0.24);
    ridge.rotation.z = side * -0.18;
    paint(ridge, { fill: P.monsterHide });
    monster.add(ridge);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), inkMaterial);
    eye.position.set(side * 0.11, 0.67, 0.3);
    paint(eye, { ink: P.flameCore });
    monster.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), inkMaterial);
    pupil.position.set(side * 0.11, 0.67, 0.365);
    monster.add(pupil);
  }
  // the maw: a drawn underbite line (lower jaw forward, a subtle upward bow) instead
  // of the old hard ink band, with the tusks doing the "tooth or two up" work —
  // scary-friendly, it grins
  const mawLine = curveLine(
    [
      new THREE.Vector3(-0.19, 0.55, 0.19),
      new THREE.Vector3(0, 0.6, 0.27),
      new THREE.Vector3(0.19, 0.55, 0.19),
    ],
    'form',
  );
  monster.add(mawLine);
  for (const side of [-1, 1]) {
    const tusk = sketch(new THREE.ConeGeometry(0.045, 0.16, 4), 20, 'form');
    tusk.position.set(side * 0.16, 0.63, 0.24);
    paint(tusk, { fill: P.gobTooth });
    monster.add(tusk);
  }
  container.add(monster);

  // vignette 2 — tavern wall fragment + bracket + hanging sign
  // 1.7x1.5, not 2x2: a wall more than twice the goblin's height read as a blank plane
  // filling the frame, and the bracket at 1.6 put the sign's whole drop above his head.
  const wallFrag = sketch(new THREE.BoxGeometry(1.7, 1.5, 0.15), 25, 'form');
  wallFrag.position.set(xs[2], 0.75, Z - 0.4);
  paint(wallFrag, { fill: P.plank });
  container.add(wallFrag);
  // planks, a plinth and a shuttered window — a blank slab was the whole set for the
  // cut that is supposed to say "tavern"
  for (const px of [-0.62, -0.21, 0.21, 0.62]) {
    const plank = sketch(new THREE.BoxGeometry(0.025, 1.44, 0.17), 25, 'faint');
    plank.position.set(xs[2] + px, 0.75, Z - 0.4);
    paint(plank, { fill: P.plank });
    container.add(plank);
  }
  const plinth = sketch(new THREE.BoxGeometry(1.8, 0.16, 0.22), 25, 'faint');
  plinth.position.set(xs[2], 0.28, Z - 0.38);
  paint(plinth, { fill: P.stoneWarm });
  container.add(plinth);
  // shuttered window: cave-dark backing behind the cross-hatch, same fix as the cave
  // mouth and the hearth firebox
  const fragWindowFill = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.34), fillMaterial);
  fragWindowFill.position.set(xs[2] + 0.55, 1.06, Z - 0.311);
  paint(fragWindowFill, { fill: P.caveDark });
  container.add(fragWindowFill);
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
  paint(bracket, { fill: P.iron });
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
  paint(brace, { fill: P.iron });
  container.add(brace);

  const tavernSign = new THREE.Group();
  tavernSign.position.set(xs[2], 1.2 + 0.95, Z - 0.3); // 0.95 above its bracket
  const signPlank = sketch(new THREE.BoxGeometry(0.7, 0.4, 0.05), 25, 'form');
  paint(signPlank, { fill: P.timberDark });
  tavernSign.add(signPlank);
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
  // the device is a drawn tankard — the one silhouette that says "tavern" alone
  const deviceMug = sketch(new THREE.CylinderGeometry(0.055, 0.065, 0.16, 8), 30, 'form');
  deviceMug.position.set(-0.02, 0, 0.05);
  paint(deviceMug, { fill: P.tavernCloth });
  const deviceHandle = sketch(new THREE.TorusGeometry(0.045, 0.011, 4, 8, Math.PI), 30, 'faint');
  deviceHandle.position.set(0.04, 0, 0.05);
  deviceHandle.rotation.z = -Math.PI / 2;
  paint(deviceHandle, { fill: P.tavernCloth });
  const deviceFoam = sketch(new THREE.SphereGeometry(0.045, 7, 5), 40, 'faint', 0.003);
  deviceFoam.scale.y = 0.4;
  deviceFoam.position.set(-0.02, 0.09, 0.05);
  tavernSign.add(deviceMug, deviceHandle, deviceFoam);
  // hooks + short chain links up toward the bracket
  for (const hx of [-0.26, 0.26]) {
    for (let li = 0; li < 3; li++) {
      const link = sketch(new THREE.TorusGeometry(0.028, 0.007, 4, 8), 20, 'faint');
      link.position.set(hx, 0.22 + li * 0.05, 0);
      link.rotation.y = (li % 2) * (Math.PI / 2);
      paint(link, { fill: P.iron });
      tavernSign.add(link);
    }
  }
  container.add(tavernSign);
  // the forged scroll curl at the bracket's outer end — the sheet's signature detail
  const bracketCurl = sketch(new THREE.TorusGeometry(0.05, 0.014, 4, 9, Math.PI * 1.3), 30, 'faint');
  bracketCurl.position.set(xs[2] + 0.24, 1.14, Z - 0.3);
  bracketCurl.rotation.z = Math.PI * 0.6;
  paint(bracketCurl, { fill: P.iron });
  container.add(bracketCurl);

  // vignette 3 — three pines. The mound and the stump stay outside `trees5`: those
  // scale from zero as he plants them, and ground he planted them in cannot pop in too.
  const mound = hatch(2.2, 1.5, 5, 0.3, 'faint');
  mound.rotation.x = -Math.PI / 2;
  mound.position.set(xs[3], 0.203, Z + 0.15);
  container.add(mound);
  const oldStump = new THREE.Group();
  const oldStumpMass = sketch(blobs(STUMP, 32), 60, 'faint');
  oldStumpMass.scale.set(0.86, 0.44, 0.86);
  oldStumpMass.position.set(-0.43, -0.198, -0.43);
  oldStump.add(oldStumpMass);
  oldStump.position.set(xs[3] - 1.0, 0.35, Z - 0.7);
  paint(oldStump, { fill: P.timberDark });
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
  const trees5 = treeOffsets.map(([ox, oz], ti) => {
    // he plants a mixed stand — two pines and a broadleaf, like the woods he walked
    const t =
      ti === 1
        ? buildOak(0.55, 1.3, { canopy: P.canopy, trunk: P.timberDark })
        : buildPine(0.5, 1.4, 0.15, { tier: P.canopy, trunk: P.timberDark });
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
    paint(crate, { fill: P.timber });
    container.add(crate);
  }

  // vignette 5 — three candles + rays. No flames are drawn: the ray burst is this
  // film's word for light, and a lit candle before he lights it gives the cut away.
  const candleTable = sketch(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 16), 25, 'form');
  candleTable.position.set(xs[5], 0.9, Z);
  paint(candleTable, { fill: P.timberDark });
  container.add(candleTable);
  const candleLeg = sketch(new THREE.CylinderGeometry(0.09, 0.14, 0.62, 8), 25, 'faint');
  candleLeg.position.set(xs[5], 0.55, Z);
  paint(candleLeg, { fill: P.timberDark });
  container.add(candleLeg);
  const candleOffsets: [number, number][] = [
    [-0.25, 0],
    [0.15, 0.15],
    [0.1, -0.2],
  ];
  candleOffsets.forEach(([ox, oz], i) => {
    const candle = sketch(new THREE.CylinderGeometry(0.03, 0.034, 0.2 + i * 0.04, 8), 25, 'form');
    candle.position.set(xs[5] + ox, 1.04 + i * 0.02, Z + oz);
    paint(candle, { fill: P.candle });
    container.add(candle);
    // a wick, and wax that has run down one side
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.035), inkMaterial);
    wick.position.set(xs[5] + ox, 1.16 + i * 0.04, Z + oz);
    container.add(wick);
    const drip = sketch(new THREE.CylinderGeometry(0.008, 0.014, 0.07, 5), 25, 'faint');
    drip.position.set(xs[5] + ox + 0.031, 1.05 + i * 0.03, Z + oz);
    paint(drip, { fill: P.candle });
    container.add(drip);
    const holder = sketch(new THREE.CylinderGeometry(0.055, 0.07, 0.03, 8), 25, 'faint');
    holder.position.set(xs[5] + ox, 0.955, Z + oz);
    paint(holder, { fill: P.brass });
    container.add(holder);
  });
  // an open book under the light — the smallest cut in the montage needed one more
  // thing in frame than three sticks
  const book = sketch(new THREE.BoxGeometry(0.4, 0.035, 0.28), 25, 'faint');
  book.rotation.y = 0.3;
  book.position.set(xs[5] - 0.02, 0.96, Z + 0.3);
  paint(book, { fill: P.bedroll });
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

// A stuck or thrown arrow: shaft + crossed tail fletch, tip at the group's own origin —
// a caller only has to position and rotate the group to land the point. Shared by the
// cliff's battle remains and the projectile kit below.
function buildArrow(len = 0.32): THREE.Group {
  const g = new THREE.Group();
  const shaft = sketch(new THREE.CylinderGeometry(0.007, 0.009, len, 5), 25, 'faint');
  shaft.rotation.x = Math.PI / 2; // axis along local z
  shaft.position.z = -len / 2; // tip at the origin, shaft trails to -z
  paint(shaft, { fill: P.timberDark });
  g.add(shaft);
  for (const rot of [0, Math.PI / 2]) {
    const fletch = sketch(new THREE.BoxGeometry(0.05, 0.045, 0.002), 25, 'faint');
    fletch.rotation.z = rot;
    fletch.position.z = -len + 0.03;
    paint(fletch, { fill: P.snow });
    g.add(fletch);
  }
  return g;
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

  // [radiusTop, radiusBottom, height, y, spin] — top of the stack lands exactly at y=6.
  // One massif, one stone family: warm base shading to rock-face grey at the top. The
  // old warm/cool/grey mix read as three different rocks stacked — under the colour
  // pass the cool middle band split the cliff into patchwork.
  const tierFills = [P.stoneWarm, P.rockFace, P.rockFace];
  const tiers: [number, number, number, number, number][] = [
    [3.6, 4.05, 2.2, 1.1, 0],
    [3.35, 3.65, 2.2, 3.3, 0.42],
    [3.2, 3.45, 1.6, 5.2, 0.83],
  ];
  tiers.forEach(([rt, rb, h, y, spin], i) => {
    // roughened rock faces — height segments give roughen() vertices to push, so
    // the flanks crag instead of reading as a stack of drums
    const tier = sketch(roughen(new THREE.CylinderGeometry(rt, rb, h, 9, 5), 0.18, 0.9, y * 7), 42, 'form');
    tier.position.y = y;
    tier.rotation.y = spin; // stagger the facets so the tiers don't stack into one prism
    paint(tier, { fill: tierFills[i] });
    cliff.add(tier);
  });

  // Fractured rock on the plateau, kept clear of the goblin's stance at local x=2.6.
  //
  // The three tiers do each take their own token — but the C6 lens sits at y=7.4 over a
  // plateau at y=6 and then rises to dead top-down, so it never sees a tier flank at all.
  // The whole "flat grey mass across half the frame" is this one top face, and the only
  // place a value break can land is on it. Two patches over a 7-unit plateau left most of
  // it bare; six read as fractured rock, which is what the surface is meant to be.
  const cracks: [number, number, number, number, number][] = [
    [-1.4, 0.6, 2.2, 1.1, 0.4],
    [0.3, -1.5, 1.6, 0.9, -0.9],
    [1.9, 1.7, 1.8, 1.0, 0.15],
    [-2.3, -1.9, 1.7, 1.2, -0.5],
    [0.8, 2.4, 1.5, 0.8, 1.1],
    [-0.6, -0.2, 1.3, 0.7, -0.25],
  ];
  cracks.forEach(([cx, cz, w, h, angle]) => {
    const crack = hatch(w, h, 4, angle);
    crack.rotation.x = -Math.PI / 2;
    crack.position.set(cx, 6.01, cz);
    cliff.add(crack);
  });

  // loose rock: a couple on the top, and talus fallen around the base
  const chunkSpots: [number, number, number, number][] = [
    // off to -z rather than +z: on the +z lip it sat right beside the goblin's S2 rim
    // stance and a smooth blob against open sky next to him read as a floating ball
    [-1.6, 6.2, -2.5, 0.5],
    [2.3, 6.15, -1.6, 0.45],
    [-3.6, 0.4, 2.9, 0.55],
    [3.4, 0.3, 3.1, 0.42],
    [-2.4, 0.35, -3.7, 0.5],
    [3.9, 0.25, -2.4, 0.36],
  ];
  chunkSpots.forEach(([ox, oy, oz, r]) => {
    const chunk = rock(r * 2, 'form', ox * 1.3 + oz);
    chunk.position.set(ox, oy, oz);
    paint(chunk, { fill: P.rockFace });
    cliff.add(chunk);
  });

  // Battle-remains dressing for the restaged open (S2/S3) and the thing C6 has to read
  // as tended away. Everything sits near the goblin's rim stance (local -2.6, 6, 0) or on
  // the near/-x face, so both the from-below front shot and the C6 over-shoulder top
  // framing see it. Visible by default — timeline.ts hides it for the C6 redress.
  //
  // The rim dressing lives on the NEAR (-x) lip, not the far one: a figure standing on
  // the far edge of a flat plateau is occluded by its own top face from any camera below
  // the rim, so S2's low wide can only read what sits on the lip closest to the party.
  const remains = new THREE.Group();
  const rimArrows: [number, number, number, number, number, number][] = [
    [-1.9, 6.02, -1.3, -Math.PI / 2 + 0.4, 0.5, 0.1],
    [-2.3, 6.03, 1.1, -Math.PI / 2 + 0.25, -0.4, -0.15],
  ];
  rimArrows.forEach(([x, y, z, rx, ry, rz]) => {
    const arrow = buildArrow(0.34);
    arrow.position.set(x, y, z);
    arrow.rotation.set(rx, ry, rz);
    remains.add(arrow);
  });
  // stuck in the near cliff face, angled outward — reads best from the low front shot
  // Angled well off the face normal on purpose: S2 looks at this face almost head-on, and
  // a shaft pointing straight out of it foreshortens to a dot. These read as strokes.
  const faceArrows: [number, number, number, number, number, number][] = [
    [-3.15, 5.0, -0.9, 0.5, -Math.PI / 2 + 0.85, 0],
    [-3.45, 4.1, 0.85, -0.35, -Math.PI / 2 - 0.7, 0.1],
    [-3.4, 3.2, -0.2, 0.62, -Math.PI / 2 + 0.55, -0.08],
  ];
  faceArrows.forEach(([x, y, z, rx, ry, rz]) => {
    const arrow = buildArrow(0.62);
    arrow.position.set(x, y, z);
    arrow.rotation.set(rx, ry, rz);
    remains.add(arrow);
  });
  // scorch on the near face itself — the rim marks below are flat to the sky and invisible
  // from under the cliff, so the low wide needs its own
  const faceScorch: [number, number, number, number, number][] = [
    [-3.3, 4.6, 0.35, 0.8, 0.6],
    [-3.5, 3.5, -0.75, 0.6, 0.45],
  ];
  faceScorch.forEach(([sx, sy, sz, sw, sh]) => {
    const mark = crossHatch(sw, sh, 9);
    mark.rotation.y = -Math.PI / 2;
    mark.position.set(sx, sy, sz);
    remains.add(mark);
  });
  // scorch/impact marks on the rim — dark hatch, not a gradient
  const scorchSpots: [number, number, number, number][] = [
    [-1.5, -0.5, 0.7, 0.5],
    [-2.4, 1.0, 0.55, 0.4],
  ];
  scorchSpots.forEach(([sx, sz, sw, sh]) => {
    const scorch = crossHatch(sw, sh, 10);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(sx, 6.015, sz);
    remains.add(scorch);
  });
  // dropped kit at the front base — a small round shield, left where it fell
  const shield = new THREE.Group();
  const shieldDisc = sketch(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12), 25, 'form');
  paint(shieldDisc, { fill: P.steel });
  shield.add(shieldDisc);
  const shieldBoss = sketch(new THREE.SphereGeometry(0.03, 8, 6), 30, 'faint');
  shieldBoss.position.y = 0.02;
  paint(shieldBoss, { fill: P.iron });
  shield.add(shieldBoss);
  shield.rotation.y = 0.4;
  shield.position.set(-7.6, 0.02, -0.6);
  remains.add(shield);
  const trample = crossHatch(1.4, 1.0, 9);
  trample.rotation.x = -Math.PI / 2;
  trample.position.set(-7.4, 0.012, -0.6);
  remains.add(trample);
  cliff.add(remains);

  // C6's "fixed" state: a small talus cairn and three mushrooms at the rim, in the
  // over-shoulder foreground. Hidden by default — timeline.ts reveals it at t57.5.
  const tended = new THREE.Group();
  tended.visible = false;
  // Flat stones, not boulders. `rock()` is a metaball blob, and five blobs of decreasing
  // size stacked dead on one axis read as a soft-serve swirl at the C6 over-shoulder
  // distance. These use the cliff's own tier technique instead — a low, few-sided,
  // roughened drum — so each stone has facets and a flat top, and the stack silhouette
  // reads as slabs. Wider and flatter at the base, and every one offset, spun and tilted
  // off its neighbour: the axis is what made the old one a swirl.
  // [x, y, z, radiusTop, radiusBottom, height, spin, tilt, squash]
  const cairnStones: [number, number, number, number, number, number, number, number, number][] =
    [
      [1.98, 6.07, -0.6, 0.3, 0.34, 0.14, 0, 0.05, 0.82],
      [2.04, 6.2, -0.56, 0.25, 0.29, 0.12, 0.9, -0.08, 1.18],
      [1.95, 6.32, -0.64, 0.215, 0.245, 0.13, 1.9, 0.07, 0.86],
      [2.02, 6.44, -0.57, 0.175, 0.2, 0.11, 0.5, -0.05, 1.14],
      [1.99, 6.56, -0.62, 0.12, 0.155, 0.12, 2.4, 0.08, 0.9],
    ];
  cairnStones.forEach(([x, y, z, rt, rb, h, spin, tilt, squash], i) => {
    const stone = sketch(
      roughen(new THREE.CylinderGeometry(rt, rb, h, 9, 3), 0.05, 9, x * 4 + i * 1.7),
      34,
      i < 2 ? 'form' : 'faint',
    );
    stone.position.set(x, y, z);
    stone.scale.set(squash, 1, 2 - squash); // no stone is round in plan
    stone.rotation.set(tilt, spin, i % 2 === 0 ? -tilt * 0.9 : tilt * 0.7);
    paint(stone, { fill: P.stoneCool });
    tended.add(stone);
  });
  // caps in threes, never symmetric (art bible) — offsets and scale both stay irregular
  const tendedMushrooms: [number, number, number, number][] = [
    [1.7, -1.4, 1.0, 1],
    [1.95, -1.15, 1.15, 0.85],
    [1.55, -1.6, 0.9, 1.05],
  ];
  tendedMushrooms.forEach(([x, z, s, sy]) => {
    const m = buildMushroom();
    m.scale.set(s, s * sy, s);
    m.position.set(x, 6.0, z);
    tended.add(m);
  });
  cliff.add(tended);

  // Projectile kit — hidden by default, positioned and animated by timeline.ts.
  const bolt = buildBolt();
  bolt.position.set(-11.6, 1.2, 1.6);
  // S2 watches this cross ~11 units from 15 units out, so the 0.45 streak was a speck.
  // Scaled up and laid back along the arc, so the tail trails down and behind the flare.
  bolt.scale.setScalar(2.4);
  bolt.rotation.set(-Math.PI / 2, 1.2, 0);
  cliff.add(bolt);
  const arrows2 = [
    [-11.2, 1.4, -1.2],
    [-11.6, 1.1, 0.9],
  ].map(([x, y, z]) => {
    const a = buildArrow(0.3);
    a.visible = false;
    a.position.set(x, y, z);
    cliff.add(a);
    return a;
  });
  const impacts = [
    [-2.6, 6.05, -1.1],
    [-3.0, 6.02, 0.7],
    [-2.0, 6.08, -0.5],
  ].map(([x, y, z]) => {
    const burst = buildRayBurst(x, y, z);
    cliff.add(burst);
    return burst;
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
  // two houses, scattered, get ember roofs as the eye's landing points
  const emberRoofs = new Set([2, 5]);
  housePositions.forEach(([x, z], i) => {
    const h = buildHouse(emberRoofs.has(i) ? P.ember : P.timberDark);
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
  pinePositions.forEach(([x, z], i) => {
    // the miniature's woods are mixed too — a map key has both tree glyphs on it
    const p =
      i % 4 === 3
        ? buildOak(0.24, 0.48, { canopy: P.canopyDeep, trunk: P.timberDark })
        : buildPine(0.18, 0.5, 0.05, { tier: P.canopyDeep, trunk: P.timberDark });
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
  const massif = sketch(roughen(new THREE.ConeGeometry(2, 3, 14, 8), 0.26, 1.8, 41), 25, 'form', 0.02);
  massif.position.y = 1.5;
  paint(massif, { fill: P.stoneCool });
  mountain.add(massif);
  // above the shoulder is snow — same fix as the theatre's mountain half: a second,
  // smaller cone sharing the apex, since one mesh can't carry two fills
  const massifSnow = sketch(roughen(new THREE.ConeGeometry(0.85, 1.2, 14, 5), 0.07, 2.0, 42), 25, 'faint');
  massifSnow.position.y = 3 - 1.2 / 2;
  paint(massifSnow, { fill: P.snow });
  mountain.add(massifSnow);
  for (const [sx, sz, sr, sh] of [
    [-1.5, 1.4, 0.9, 1.5],
    [1.7, -1.1, 0.75, 1.2],
  ] as [number, number, number, number][]) {
    const shoulder = sketch(roughen(new THREE.ConeGeometry(sr, sh, 11, 6), sr * 0.15, 1.8, sx * 3), 25, 'faint');
    shoulder.position.set(sx, sh / 2, sz);
    paint(shoulder, { fill: P.stoneCool });
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
    // river reaches take colour, unlike the roads which stay ink
    const riverEdge = curveLine(
      riverPts.map(([x, z]) => new THREE.Vector3(x, 0.02, z + side)),
      'form',
      28,
    );
    paint(riverEdge, { line: P.water });
    container.add(riverEdge);
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
    paint(water, { line: P.water });
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
  // alternating grass / grass-deep / earth, cycling so consecutive fields never repeat
  const fieldFills = [P.grass, P.grassDeep, P.earth];
  fields.forEach(([fx, fz, fw, fd, fa], i) => {
    // One holder, one transform. The fill, the till hatch and the hedge outline are the
    // same quad drawn three ways, and they used to be placed three times over: the
    // outline solved its own corners in world space with the opposite sense of `fa` to
    // the meshes' Euler, so every field's ink sat rotated the wrong way off its colour.
    // Parenting them removes the second copy of the maths rather than correcting it.
    // Local +z is world up here (the holder is tipped onto the ground plane), so the
    // stacking offsets below are z, not y.
    const field = new THREE.Group();
    field.rotation.set(-Math.PI / 2, 0, fa);
    field.position.set(fx, 0.018, fz);
    container.add(field);

    const fieldFill = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), fillMaterial);
    paint(fieldFill, { fill: fieldFills[i % fieldFills.length] });
    field.add(fieldFill);

    const till = hatch(fw, fd, 1.6, 0, 'faint');
    till.position.z = 0.001;
    field.add(till);

    field.add(
      polyline(
        [
          new THREE.Vector3(-fw / 2, -fd / 2, 0.002),
          new THREE.Vector3(fw / 2, -fd / 2, 0.002),
          new THREE.Vector3(fw / 2, fd / 2, 0.002),
          new THREE.Vector3(-fw / 2, fd / 2, 0.002),
        ],
        'faint',
        true,
      ),
    );
  });

  const die2 = sketch(new THREE.IcosahedronGeometry(0.5), 25, 'hero');
  die2.position.set(122.8, 6.8, 0);
  die2.scale.set(0, 0, 0);
  paint(die2, { fill: P.dieBone });
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

  // board-fill, set directly rather than through paint()'s shared cache — this material
  // must stay board-local so the opacity fade in timeline.ts only ever touches this group.
  // Named because it is the one material in the group that does NOT go to full opacity:
  // it is the paper the flattened world is printed on, not a lid over it. See BOARD_WASH
  // in timeline.ts.
  const boardFill = new THREE.Mesh(
    new THREE.PlaneGeometry(25.4, 25.4),
    new THREE.MeshBasicMaterial({
      name: 'board-fill',
      color: P.boardFill,
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

  return { container, miniWorld, cliff, die2, board, remains, tended, bolt, arrows2, impacts };
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
    ground.container,
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

    camp: ambush.camp,
    theatreSet: theatre.container,
    tavernSet: tavern.container,
    montageSet: montage.container,
    cliffSet: cliffWorld.container,

    ambushFlames: ambush.ambushFlames,
    adventurers: ambush.adventurers,
    treeline: ambush.treeline,

    fire2Flames: pathProps.fire2Flames,
    fire2Rays: pathProps.fire2Rays,
    lanternPost: pathProps.lanternPost,
    lanternRays: pathProps.lanternRays,
    cave: pathProps.cave,
    caveDoor: pathProps.caveDoor,
    chest: pathProps.chest,
    chestLid: pathProps.chestLid,
    chestCoins: pathProps.chestCoins,
    ravens: pathProps.ravens,
    mushrooms: pathProps.mushrooms,
    signPost: pathProps.signPost,
    signBoard: pathProps.signBoard,
    tufts: ground.tufts,
    pathForestFront: ground.pathForestFront,
    pathForestMid: ground.pathForestMid,
    pathClouds: ground.pathClouds,

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
    remains: cliffWorld.remains,
    tended: cliffWorld.tended,
    party: ambush.adventurers,

    bolt: cliffWorld.bolt,
    arrows2: cliffWorld.arrows2,
    impacts: cliffWorld.impacts,

    die2: cliffWorld.die2,
    board: cliffWorld.board,
  };
}
