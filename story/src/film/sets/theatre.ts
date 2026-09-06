import * as THREE from 'three';
import { blobs } from '../sculpt.ts';
import * as P from '../palette.ts';
import { paint, sketch, hatch, polyline, curveLine, roughen } from '../pencil.ts';
import { COLUMN, STUMP, rock, buildPine, buildOak } from './kit.ts';
import { setView, shotView } from '../mock/foliageKit.ts';

// C3 — theatre set: a rotating disc, forest half facing the path at rest.
export function buildTheatre() {
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
  // §4.4 basis: judged under timeline.ts's cam(30, 1.5, [31.5,4.5,6], [42,1.0,-2]) — the
  // B3–B5 hold, the shot the forest and mountain-foot pines are both seen under.
  const vForest = shotView([31.5, 4.5, 6], [42, 1.0, -2]);
  setView(vForest.az, vForest.elev);
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
  setView(); // hand the hero's lens back

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
  // §4.4 basis: same cam(30) shot as the forest above.
  const vFoot = shotView([31.5, 4.5, 6], [42, 1.0, -2]);
  setView(vFoot.az, vFoot.elev);
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
  setView(); // hand the hero's lens back

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
