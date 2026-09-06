import * as THREE from 'three';
import { dieFaces } from '../dieGeometry.ts';
import { blobs } from '../sculpt.ts';
import * as P from '../palette.ts';
import {
  PAPER,
  paint,
  fillMaterial,
  sketch,
  rays,
  hatch,
  crossHatch,
  contact,
  numeral,
  polyline,
} from '../pencil.ts';
import { COLUMN, buildFlames, buildAdventurer, buildFinger } from './kit.ts';

// C4 — tavern interior: floor, wall, table, die, DM + two players, mugs, door.
export function buildTavern() {
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
  // NO SECOND SCALE. `buildAdventurer` already returns the cast reference's own 1.2402 u
  // figure — the ×1.30 that number carries is inside the recipe (`sets/kit.ts`'s own note
  // on it) — so `setScalar(1.3)` here stacked a second one and stood the DM at 1.6156 u
  // beside 1.2402 u players in the same shot. Gate G-F fixes total height at 1.240 ± 0.02
  // per figure and the cast reference §8 files this multiplier as UNEXECUTED: it is not a
  // composition decision anywhere, and an undocumented one may not stand in for one.
  const dm = buildAdventurer(false, { fill: P.cloakIndigo });
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
