import * as THREE from 'three';
import { blobs } from '../sculpt.ts';
import * as P from '../palette.ts';
import { paint, sketch, hatch, contact } from '../pencil.ts';
import type { Goblin } from '../rig.ts';
import {
  COLUMN,
  rock,
  buildFlames,
  buildPine,
  buildOak,
  buildAdventurer,
  cauliflowerShape,
  CAST_STEEL,
} from './kit.ts';
import { setView, shotView } from '../mock/foliageKit.ts';

// C1 — ambush around the origin. The camera opens on this from (0, 2.0, 6.2) and later
// pushes in to (2.5, 1.1, 3.2) for the film's hero close-up, so this set has to hold up
// both as a wide tableau and as the backdrop behind his face.
export function buildAmbush(goblin: Goblin) {
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
  // CAST_STEEL, not raw `steel`: `P.steel` #B1BAC2 computes triTone 0.2986 — 0.0014 off
  // the t1/t2 boundary at 0.30, with the shader's ±0.03 world noise putting its interval
  // at [0.2686 … 0.3286] STRADDLING it, so a spearhead tier-flips across its own 40-mm
  // plate. The bible files the film's blades and shields at CAST_STEEL and this is one;
  // it lands t1 with 0.077 of clearance on the committed `steel → paper` segment.
  paint(spearHead, { fill: CAST_STEEL });
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
  //
  // §4.4 basis: judged at timeline.ts's cut(16.5, [2.5,1.1,3.2], [2.5,0.7,0.9]) — the
  // freeze close-up handoff into the C2 run, the shot that holds the treeline behind the
  // goblin longest and closest (cut(7.5)/cut(9.5) hold the relocated adventurer trio, not
  // this backdrop). Front row and mid row share the shot, so one bracket covers both.
  const v = shotView([2.5, 1.1, 3.2], [2.5, 0.7, 0.9]);
  setView(v.az, v.elev);
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
  setView(); // hand the hero's lens back
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
