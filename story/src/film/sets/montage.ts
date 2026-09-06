import * as THREE from 'three';
import { blobs } from '../sculpt.ts';
import * as P from '../palette.ts';
import {
  PAPER,
  paint,
  fillMaterial,
  inkMaterial,
  sketch,
  hatch,
  crossHatch,
  contact,
  polyline,
  curveLine,
} from '../pencil.ts';
import {
  STUMP,
  rock,
  treeVary,
  buildRayBurst,
  buildChest,
  buildPine,
  buildOak,
  contacts,
} from './kit.ts';
import { buildIncidentCard } from '../mock/groundKit.ts';
import { setView, shotView } from '../mock/foliageKit.ts';

// C5 — six montage vignette platforms at z=-40, x = 0/8/16/24/32/40.
export function buildMontage() {
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
  // §4.4 basis: judged under the vignette-3 camera timeline.ts's c5Xs.forEach computes for
  // i=3 (x=24) — cam [25.7,1.8,-36.95] looking at [24.55,1.0,-39.8] (odd side, saplings).
  const vSaplings = shotView([25.7, 1.8, -36.95], [24.55, 1.0, -39.8]);
  setView(vSaplings.az, vSaplings.elev);
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
  setView(); // hand the hero's lens back

  // vignette 4 — chest, with a floor to be found on
  const chest5 = buildChest(xs[4], 0.2, Z);
  container.add(chest5.container);
  // C9 · AND UNTIL NOW THIS CHEST AND ITS TWO SPILLED COINS FLOATED. `contact()` retired
  // with the nine-stroke hatch it builds at `pencil.ts:493`, and nothing took the job
  // over on this set, which passes no blobs at all — so at S6 t55 the vignette's own prop
  // sat on its platform with no shadow under it. C9 says where the grounding lives: "a
  // painted blob in the island's own albedo", never geometry of the prop's own. This
  // platform had no albedo layer to paint into, so it gets the smallest honest one — the
  // ordinary incident card with no path and no wear, which is exactly `propGround`'s own
  // recipe minus the ground card the platform already is.
  //
  // 512² over 2·rx = 5 u is **102.4 texels/unit**, so the ledger's chest — **210**, its
  // 0.355-u footprint half-diagonal at ×1.5 — paints **54.6** texels of radius and each
  // coin — **24** — paints **6.2**. Both are over §3.8's 5-texel floor, which is the whole
  // reason this card is sized to the vignette rather than to the set. (The 140 / 16 this
  // note used to quote were the pre-×1.5 ledger; `sets/kit.ts`'s CONTACT re-derived them
  // when a blob narrower than its own prop measured as no grounding at all.)
  const hoardCard = buildIncidentCard(2.5, 2.5, {
    spine: null,
    wear: false,
    blobs: contacts([
      ['chest', 0, 0],
      ['coin', -0.36, 0.14],
      ['coin', 0.34, 0.2],
    ]),
  });
  hoardCard.position.set(xs[4], 0.2, Z);
  container.add(hoardCard);
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
