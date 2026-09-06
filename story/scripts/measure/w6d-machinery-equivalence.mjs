// W6d: prove the lift of mock/machinery.ts's buildMock() into mock/machineryKit.ts's
// buildMachinery() + buildMachineryBooms() changed nothing geometrically. BEFORE is a
// verbatim reconstruction of buildMock() as it stood prior to the lift (captured by Read
// before the edit). AFTER calls the two new kit exports and sums both groups. Both are
// summed the same way: geometry.attributes.position.count over every real fill Mesh,
// geometry.attributes.instanceStart.count over every LineSegments2.
//
// NOTE on the count method (found while deriving this script from w8c's):
// `LineSegments2` extends three's `Mesh` internally, so it carries `isMesh = true` as
// well as `isLineSegments2 = true` — its `geometry.attributes.position` is the shared
// instanced quad TEMPLATE (8), not real strokes. w8c's `sumCounts` (`if (isMesh) ... ;
// if (isLineSegments2) ...`, not `else if`) double-counts that template into `verts`
// once per LineSegments2 object. Both builds here still have exactly one fill Mesh's
// worth of real vertices (1706, checked separately), so that artifact is harmless only
// while both sides build the SAME NUMBER of LineSegments2 objects. This lift
// deliberately turns ONE `sketch()` call into TWO (fixed parts + booms, so the wiring
// task can parent them separately) — a real, wanted structural change — which the
// naive counter would misreport as an 8-vertex geometry drift (1714 vs 1722, checked).
// Fixed here with `else if` so a LineSegments2 is counted once, as a line, never as a
// mesh — this is the correct count, not a loosened gate.
import * as THREE from 'three';
import * as P from '../../src/film/palette.ts';
import { sketch } from '../../src/film/pencil.ts';
import { merge, put } from '../../src/film/mock/plankKit.ts';
import { buildMachinery, buildMachineryBooms } from '../../src/film/mock/machineryKit.ts';

function sumCounts(root) {
  let verts = 0;
  let segs = 0;
  root.traverse((o) => {
    if (o.isLineSegments2 && o.geometry?.attributes?.instanceStart) segs += o.geometry.attributes.instanceStart.count;
    else if (o.isMesh && o.geometry?.attributes?.position) verts += o.geometry.attributes.position.count;
  });
  return { verts, segs };
}

// ---- BEFORE: verbatim reconstruction of machinery.ts's old buildMock() --------------
function buildMockOld() {
  const K = 0.3; // the row's r 8.2 → 2.46 u
  const BOOM_R = 8.2 * K;

  const g = new THREE.Group();
  const parts = [];

  // ---- the capstan --------------------------------------------------------------
  parts.push(put(new THREE.CylinderGeometry(1.4 * K, 1.55 * K, 1.5 * K, 10), { pos: [0, 0.75 * K, 0] }));
  parts.push(put(new THREE.CylinderGeometry(1.85 * K, 1.85 * K, 0.22 * K, 16), { pos: [0, 1.42 * K, 0] }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.18;
    parts.push(
      put(new THREE.BoxGeometry(2.9 * K, 0.17 * K, 0.17 * K), {
        pos: [Math.cos(a) * 1.45 * K, 1.62 * K, Math.sin(a) * 1.45 * K],
        rot: [0, -a, 0],
      }),
    );
    parts.push(
      put(new THREE.CylinderGeometry(0.15 * K, 0.15 * K, 0.3 * K, 7), {
        pos: [Math.cos(a) * 2.85 * K, 1.62 * K, Math.sin(a) * 2.85 * K],
        rot: [Math.PI / 2, 0, -a],
      }),
    );
  }
  parts.push(put(new THREE.BoxGeometry(1.15 * K, 0.14 * K, 0.2 * K), { pos: [2.35 * K, 1.44 * K, 0.3 * K], rot: [0, -0.12, 0.16] }));
  parts.push(put(new THREE.CylinderGeometry(0.13 * K, 0.13 * K, 1.6 * K, 6), { pos: [2.95 * K, 0.8 * K, 0.36 * K] }));

  // ---- six radial rails ----------------------------------------------------------
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    parts.push(
      put(new THREE.BoxGeometry(5.4 * K, 0.13 * K, 0.26 * K), {
        pos: [Math.cos(a) * 4.6 * K, 0.07 * K, Math.sin(a) * 4.6 * K],
        rot: [0, -a, 0],
      }),
    );
    parts.push(
      put(new THREE.BoxGeometry(0.4 * K, 0.24 * K, 0.5 * K), {
        pos: [Math.cos(a) * 3.2 * K, 0.12 * K, Math.sin(a) * 3.2 * K],
        rot: [0, -a, 0],
      }),
    );
  }

  // ---- two counterweight booms, sweeping outboard at r 8.2 -----------------------
  for (const s of [0, Math.PI]) {
    const a = 0.72 + s;
    parts.push(
      put(new THREE.BoxGeometry(BOOM_R, 0.2 * K, 0.2 * K), {
        pos: [(Math.cos(a) * BOOM_R) / 2, 2.05 * K, (Math.sin(a) * BOOM_R) / 2],
        rot: [0, -a, 0.045],
      }),
    );
    parts.push(
      put(new THREE.BoxGeometry(0.72 * K, 1.05 * K, 0.62 * K), {
        pos: [Math.cos(a) * (BOOM_R - 0.35 * K), 1.85 * K, Math.sin(a) * (BOOM_R - 0.35 * K)],
        rot: [0, -a, 0],
      }),
    );
    const tie = new THREE.Vector3(Math.cos(a) * BOOM_R * 0.94, 2.16 * K, Math.sin(a) * BOOM_R * 0.94);
    const head = new THREE.Vector3(0, 3.1 * K, 0);
    const d = new THREE.Vector3().subVectors(tie, head);
    const rod = new THREE.CylinderGeometry(0.05 * K, 0.05 * K, d.length(), 5);
    rod.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3().addVectors(tie, head).multiplyScalar(0.5),
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    parts.push(rod);
  }
  parts.push(put(new THREE.CylinderGeometry(0.16 * K, 0.2 * K, 1.75 * K, 7), { pos: [0, 2.3 * K, 0] }));

  // ---- four blocks ----------------------------------------------------------------
  [[3.6, 0.9, 2.4], [-3.4, 1.1, 1.6], [1.4, 1.35, -3.8], [-1.9, 0.75, -3.2]].forEach(
    ([bx, by, bz], i) => {
      const p = [bx * K, by * K, bz * K];
      for (const c of [-1, 1]) {
        parts.push(
          put(new THREE.BoxGeometry(0.11 * K, 0.85 * K, 0.5 * K), {
            pos: [p[0] + c * 0.22 * K, p[1], p[2]],
            rot: [0, i * 0.6, 0.1],
          }),
        );
      }
      parts.push(
        put(new THREE.CylinderGeometry(0.3 * K, 0.3 * K, 0.14 * K, 9), {
          pos: [p[0], p[1] - 0.1 * K, p[2]],
          rot: [0, i * 0.6, Math.PI / 2],
        }),
      );
      parts.push(
        put(new THREE.CylinderGeometry(0.04 * K, 0.04 * K, (by + 0.4) * K, 5), {
          pos: [p[0], (by * 0.5 - 0.2) * K, p[2]],
        }),
      );
    },
  );

  // ---- one fill, one stroke pass, and NO trilayer anywhere -----------------------
  const drawn = sketch(merge(parts), 24, 'form');
  const fill = drawn.children[0];
  fill.material = new THREE.MeshBasicMaterial({ color: P.graphiteLight, fog: false });
  fill.castShadow = false;
  fill.receiveShadow = false;
  g.add(drawn);
  return g;
}

function buildMockNew() {
  const K = 0.3;
  const g = new THREE.Group();
  g.add(buildMachinery({ scale: K }));
  g.add(buildMachineryBooms({ scale: K }));
  return g;
}

const before = sumCounts(buildMockOld());
const after = sumCounts(buildMockNew());
console.log('BEFORE', JSON.stringify(before));
console.log('AFTER ', JSON.stringify(after));
console.log(before.verts === after.verts && before.segs === after.segs ? 'MATCH' : 'MISMATCH');
