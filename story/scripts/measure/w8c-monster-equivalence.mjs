// W8c: prove the monster lift out of mock/hide.ts into mock/hideKit.ts's buildMonster()
// changed nothing geometrically. BEFORE is a verbatim reconstruction of the monster-only
// code block as it stood in hide.ts's buildMock() prior to the lift (captured by Read
// before any edit — see docs/build/inventories/montage.md CENTRAL FACT 2 for the recipe
// this reproduces). AFTER imports the real, current buildMonster() from hideKit.ts.
// Both are summed the same way: geometry.attributes.position.count over every Mesh,
// geometry.attributes.instanceStart.count over every LineSegments2.
//
// Run: node --experimental-strip-types scripts/measure/w8c-monster-equivalence.mjs
import * as THREE from 'three';
import * as P from '../../src/film/palette.ts';
import { roughen } from '../../src/film/pencil.ts';
import { createTrilayer } from '../../src/film/stages/trilayer.ts';
import { at, hand, mark, mergeAt, mergeStrokes, mixHex, VIEW_CAM } from '../../src/film/mock/marksKit.ts';
import { buildMonster } from '../../src/film/mock/hideKit.ts';

function sumCounts(root) {
  let verts = 0;
  let segs = 0;
  root.traverse((o) => {
    if (o.isMesh && o.geometry?.attributes?.position) verts += o.geometry.attributes.position.count;
    if (o.isLineSegments2 && o.geometry?.attributes?.instanceStart) segs += o.geometry.attributes.instanceStart.count;
  });
  return { verts, segs };
}

// ---- BEFORE: verbatim reconstruction of hide.ts's old inline monster block ----------
function buildMonsterOld() {
  const rnd = hand(0x6d3a9);
  const monsterLit = mixHex(P.monsterHide, P.flameCore, 0.3);
  const monsterShade = mixHex(P.monsterHide, P.caveDark, 0.5);
  const BULK = [
    [0.02, -0.86], [0.6, -0.8], [0.68, -0.6], [0.6, -0.35],
    [0.46, -0.1], [0.4, 0.15], [0.32, 0.35], [0.22, 0.52],
    [0.16, 0.6], [0.28, 0.66], [0.32, 0.76], [0.16, 0.85], [0.02, 0.88],
  ];
  const SCALE = new THREE.Vector3(1.15, 1.0, 0.62);
  const bulkR = (y) => {
    for (let i = 1; i < BULK.length; i++) {
      const [r0, y0] = BULK[i - 1];
      const [r1, y1] = BULK[i];
      if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
    return BULK[BULK.length - 1][0];
  };

  const g = new THREE.Group();
  const hideParts = [];
  const litParts = [];
  const shadeParts = [];
  const clawParts = [];
  const boneParts = [];
  const marks = [];

  const MY = 0.9;
  const base = at([0, MY, 0], [0, 0, 0.05]);
  {
    const bulk = new THREE.LatheGeometry(BULK.map(([r, y]) => new THREE.Vector2(r, y)), 20);
    bulk.scale(SCALE.x, SCALE.y, SCALE.z);
    roughen(bulk, 0.075, 3.0, 44);
    hideParts.push({ geom: bulk, m: base });
  }

  const SHAG = [
    [-1.222, -0.65, 0.28, 0.2], [-0.698, -0.55, 0.26, 0.19],
    [-0.175, -0.3, 0.24, 0.17], [0.873, 0.05, 0.2, 0.14],
    [1.92, 0.4, 0.16, 0.12], [3.491, -0.6, 0.26, 0.18],
    [4.538, -0.3, 0.22, 0.15],
  ];
  for (const [a, y, w, h] of SHAG) {
    const r = bulkR(y);
    const o = new THREE.Vector3(Math.cos(a) * r * SCALE.x, MY + y * SCALE.y, Math.sin(a) * r * SCALE.z);
    const out = new THREE.Vector3(Math.cos(a) * SCALE.z, 0.12, Math.sin(a) * SCALE.x).normalize();
    const side = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 1, 0)).normalize();
    const n = 3 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const cx = (rnd() - 0.5) * w;
      const cy = (rnd() - 0.5) * h;
      const ang = (rnd() - 0.5) * 2.4;
      const len = 0.05 + rnd() * 0.04;
      const p = (dh, dv, push) =>
        o.clone().addScaledVector(side, cx + dh).setY(o.y + cy + dv).addScaledVector(out, push);
      marks.push(
        mark(
          [
            p(-Math.sin(ang) * len * 0.5, -Math.cos(ang) * len * 0.5, 0.05),
            p(0, 0, 0.075),
            p(Math.sin(ang) * len * 0.5, Math.cos(ang) * len * 0.5, 0.05),
          ],
          P.graphiteDark,
          'faint',
        ),
      );
    }
  }

  for (const side of [-1, 1]) {
    const big = side === 1 ? 1.25 : 1;
    const shoulder = new THREE.Vector3(side * (bulkR(0.3) * SCALE.x + 0.11), 0.32, 0.16);
    const paw = new THREE.Vector3(side * (bulkR(0.3) * SCALE.x + 0.26) * big, -0.5, 0.3 * big);
    const elbow = shoulder.clone().lerp(paw, 0.48);
    elbow.x += side * 0.045 * big;
    elbow.z += 0.05 * big;
    const seg = (a, b, rA, rB, into) => {
      const d = new THREE.Vector3().subVectors(b, a);
      into.push({
        geom: new THREE.CylinderGeometry(rB, rA, d.length(), 10),
        m: base.clone().multiply(
          new THREE.Matrix4().compose(
            new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
            new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()),
            new THREE.Vector3(1, 1, 1),
          ),
        ),
      });
    };
    seg(shoulder, elbow, 0.1 * big, 0.075 * big, litParts);
    seg(elbow, paw, 0.075 * big, 0.062 * big, shadeParts);
    hideParts.push({
      geom: new THREE.SphereGeometry(0.085 * big, 10, 8),
      m: base.clone().multiply(at([paw.x, paw.y, paw.z], [0, 0, 0], [1.1, 0.9, 1])),
    });
    for (let c = 0; c < 3; c++) {
      const a = -0.5 + c * 0.5;
      clawParts.push({
        geom: new THREE.ConeGeometry(0.019 * big, 0.1 * big, 6),
        m: base.clone().multiply(
          at(
            [paw.x + Math.sin(a) * 0.07 * big, paw.y - 0.07 * big, paw.z + Math.cos(a) * 0.07 * big],
            [1.35, a, 0],
          ),
        ),
      });
    }
  }

  for (const s of [-1, 1]) {
    boneParts.push({
      geom: new THREE.ConeGeometry(0.022, 0.1, 6),
      m: base.clone().multiply(at([s * 0.075, 0.7, 0.16], [-0.5, 0, s * 0.2])),
    });
  }
  const eyeMat = createTrilayer({ color: P.flameCore, wear: 0, stroke: { dir: 0.55, sheet: true } });
  const eyes = new THREE.Mesh(
    mergeAt(
      [-1, 1].map((s) => ({
        geom: new THREE.SphereGeometry(0.021, 7, 6),
        m: base.clone().multiply(at([s * 0.062, 0.775, 0.14])),
      })),
    ),
    eyeMat,
  );
  g.add(eyes);

  {
    const sil = [];
    for (let i = 0; i <= 18; i++) {
      const y = -0.84 + (i / 18) * 1.7;
      const r = bulkR(y) * SCALE.x * (1 + (rnd() - 0.5) * 0.04);
      sil.push(new THREE.Vector3(-r, MY + y * SCALE.y, 0).addScaledVector(VIEW_CAM, 0.3));
    }
    marks.push(mark(sil, P.graphiteDark, 'form'));
  }

  const bucket = [
    [hideParts, P.monsterHide, 3, 0.55],
    [litParts, monsterLit, 3, 0.62],
    [shadeParts, monsterShade, 3, 0.69],
    [clawParts, P.caveDark, 0, 0.55],
    [boneParts, P.gobTooth, 0, 0.55],
  ];
  for (const [parts, color, poster, dir] of bucket) {
    if (!parts.length) continue;
    const mesh = new THREE.Mesh(
      mergeAt(parts),
      createTrilayer({ color, wear: 0.26, poster, stroke: { dir, sheet: true } }),
    );
    g.add(mesh);
  }
  const byMat = new Map();
  for (const m of marks) (byMat.get(m.material) ?? byMat.set(m.material, []).get(m.material)).push(m);
  for (const list of byMat.values()) g.add(mergeStrokes(list));
  return g;
}

const before = sumCounts(buildMonsterOld());
const after = sumCounts(buildMonster());
console.log('BEFORE', JSON.stringify(before));
console.log('AFTER ', JSON.stringify(after));
console.log(before.verts === after.verts && before.segs === after.segs ? 'MATCH' : 'MISMATCH');
