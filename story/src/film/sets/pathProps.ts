import * as THREE from 'three';
import * as P from '../palette.ts';
import {
  paint,
  fillMaterial,
  sketch,
  hatch,
  crossHatch,
  contact,
  curveLine,
} from '../pencil.ts';
import {
  trunkOf,
  rock,
  buildRayBurst,
  buildFlames,
  buildChest,
  nextTreeSeed,
  lobedCrown,
  buildRaven,
  buildMushroom,
} from './kit.ts';

// C2 — path props at z~0, in +x order: fire, lantern, cave, chest, ravens, mushrooms, sign.
export function buildPathProps() {
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
  const treeCrown = lobedCrown(0.55, 0.8, nextTreeSeed());
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
