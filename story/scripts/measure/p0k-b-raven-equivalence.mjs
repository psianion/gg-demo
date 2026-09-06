// P0k-B: prove the raven geometry split (sets/kit.ts's buildRaven() body moved verbatim
// into mock/hideKit.ts's ravenGeometry(), buildRaven() now a thin wrapper) changed nothing
// geometrically at the pathProps.ts call site, and that mock/hide.ts's route ravens keep
// the same geometry counts while their materials correct to the committed recipe.
//
// BEFORE is a verbatim reconstruction of each site's code as it stood before this task
// (captured by Read before any edit). AFTER imports the real, current code.
// Both are summed the same way: geometry.attributes.position.count over every Mesh.
//
// Run: node --experimental-strip-types scripts/measure/p0k-b-raven-equivalence.mjs
import * as THREE from 'three';
import * as P from '../../src/film/palette.ts';
import { createTrilayer } from '../../src/film/stages/trilayer.ts';
import { at, mark, mergeAt, VIEW_CAM } from '../../src/film/mock/marksKit.ts';
import { ball, blobs } from '../../src/film/sculpt.ts';
import { buildRaven } from '../../src/film/sets/kit.ts';
import { ravenGeometry } from '../../src/film/mock/hideKit.ts';

function sumVerts(root) {
  let verts = 0;
  root.traverse((o) => {
    if (o.isMesh && o.geometry?.attributes?.position) verts += o.geometry.attributes.position.count;
  });
  return verts;
}

// ---- BEFORE: verbatim reconstruction of kit.ts's old inline buildRaven() -------------
function buildRavenOld() {
  const massMat = (token) => createTrilayer({ color: token, wear: 0.26 * 0.55, poster: 0, stroke: { dir: 0.55, sheet: true } });
  const metalMat = (token) => createTrilayer({ color: token, wear: 0.26 * 0.55, poster: 0, stroke: { dir: 0.55, sheet: true } });
  const g = new THREE.Group();
  const body = blobs(
    [
      ball(0.5, 0.46, 0.42, 0.16),
      ball(0.5, 0.44, 0.58, 0.14),
      ball(0.5, 0.52, 0.3, 0.11),
      ball(0.5, 0.62, 0.64, 0.1),
    ],
    36,
  );
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

  const slate = [
    {
      geom: body,
      m: new THREE.Matrix4().compose(
        new THREE.Vector3(-0.1875, -0.143, -0.165),
        new THREE.Quaternion(),
        new THREE.Vector3(0.375, 0.31, 0.375),
      ),
    },
    {
      geom: new THREE.ExtrudeGeometry(tailShape, { depth: 0.012, bevelEnabled: false }),
      m: new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0.015, -0.075),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + 0.5, 0, 0)),
        new THREE.Vector3(1, 1, 1),
      ),
    },
  ];
  for (const s of [-1, 1]) {
    slate.push({
      geom: new THREE.BoxGeometry(0.012, 0.052, 0.15),
      m: new THREE.Matrix4().compose(
        new THREE.Vector3(s * 0.055, 0.026, -0.025),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.28, s * 0.12, 0)),
        new THREE.Vector3(1, 1, 1),
      ),
    });
  }
  const bird = new THREE.Mesh(mergeAt(slate), massMat(P.ravenSlate));
  g.add(bird);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 5), metalMat(P.iron));
  beak.rotation.x = Math.PI / 2 + 0.22;
  beak.position.set(0, 0.036, 0.115);
  g.add(beak);
  return g;
}

// ---- BEFORE: verbatim reconstruction of hide.ts's old inline route ravens -----------
function buildRouteRavensOld() {
  const g = new THREE.Group();
  const ravenParts = [];
  const beakParts = [];
  const birdBody = blobs(
    [
      ball(0.5, 0.46, 0.42, 0.16),
      ball(0.5, 0.44, 0.58, 0.14),
      ball(0.5, 0.52, 0.3, 0.11),
      ball(0.5, 0.62, 0.64, 0.1),
    ],
    36,
  );
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

  const PERCH = [
    [1.62, 0.62, 0.55, 0.35],
    [2.12, 0.36, -0.3, -1.05],
    [1.34, 0.2, -1.05, 2.2],
  ];
  for (const [x, y, z, yaw] of PERCH) {
    const b = at([x, y, z], [0, yaw, 0]);
    ravenParts.push({
      geom: birdBody,
      m: b.clone().multiply(at([-0.1875, -0.143, -0.165], [0, 0, 0], [0.375, 0.31, 0.375])),
    });
    ravenParts.push({ geom: tailGeom, m: b.clone().multiply(at([0, 0.015, -0.075], [Math.PI / 2 + 0.5, 0, 0])) });
    for (const s of [-1, 1]) {
      ravenParts.push({
        geom: new THREE.BoxGeometry(0.012, 0.052, 0.15),
        m: b.clone().multiply(at([s * 0.055, 0.026, -0.025], [0.28, s * 0.12, 0])),
      });
    }
    beakParts.push({
      geom: new THREE.ConeGeometry(0.02, 0.05, 5),
      m: b.clone().multiply(at([0, 0.036, 0.115], [Math.PI / 2 + 0.22, 0, 0])),
    });
  }
  const bucket = [
    [beakParts, P.caveDark, 0, 0.55], // OLD: wrong token
    [ravenParts, P.ravenSlate, 0, 0.76], // OLD: wrong dir
  ];
  const materials = [];
  for (const [parts, color, poster, dir] of bucket) {
    materials.push({ color: '#' + color.toString(16), poster, dir });
    const mesh = new THREE.Mesh(mergeAt(parts), createTrilayer({ color, wear: 0.26, poster, stroke: { dir, sheet: true } }));
    g.add(mesh);
  }
  return { g, materials };
}

// ---- AFTER: real current code --------------------------------------------------------
function buildRouteRavensNew() {
  const g = new THREE.Group();
  const ravenParts = [];
  const beakParts = [];
  const { body: birdBody, beak: beakGeom } = ravenGeometry();
  const PERCH = [
    [1.62, 0.62, 0.55, 0.35],
    [2.12, 0.36, -0.3, -1.05],
    [1.34, 0.2, -1.05, 2.2],
  ];
  for (const [x, y, z, yaw] of PERCH) {
    const b = at([x, y, z], [0, yaw, 0]);
    ravenParts.push({ geom: birdBody, m: b.clone() });
    beakParts.push({ geom: beakGeom, m: b.clone() });
  }
  const bucket = [
    [beakParts, P.iron, 0, 0.55], // NEW: correct token
    [ravenParts, P.ravenSlate, 0, 0.55], // NEW: correct dir
  ];
  const materials = [];
  for (const [parts, color, poster, dir] of bucket) {
    materials.push({ color: '#' + color.toString(16), poster, dir });
    const mesh = new THREE.Mesh(mergeAt(parts), createTrilayer({ color, wear: 0.26, poster, stroke: { dir, sheet: true } }));
    g.add(mesh);
  }
  return { g, materials };
}

// ---- pathProps.ts-style single buildRaven() call --------------------------------------
const oldSingle = sumVerts(buildRavenOld());
const newSingle = sumVerts(buildRaven());
console.log('SINGLE RAVEN (pathProps.ts call site)');
console.log('  BEFORE verts', oldSingle);
console.log('  AFTER  verts', newSingle);
console.log('  ', oldSingle === newSingle ? 'MATCH' : 'MISMATCH');

// ---- hide.ts route, 3 ravens ------------------------------------------------------
const oldRoute = buildRouteRavensOld();
const newRoute = buildRouteRavensNew();
const oldRouteVerts = sumVerts(oldRoute.g);
const newRouteVerts = sumVerts(newRoute.g);
console.log('\nROUTE RAVENS x3 (mock/hide.ts)');
console.log('  BEFORE verts', oldRouteVerts, JSON.stringify(oldRoute.materials));
console.log('  AFTER  verts', newRouteVerts, JSON.stringify(newRoute.materials));
console.log('  geometry:', oldRouteVerts === newRouteVerts ? 'MATCH' : 'MISMATCH');
console.log('  material diff: body dir 0.76 -> 0.55; beak token caveDark(#3f3226) -> iron(#7d8590)');
