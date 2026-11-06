import * as THREE from 'three';
import { sketch, numeral, paint } from '../hero/film/pencil.ts';
import { dieFaces } from '../hero/film/dieGeometry.ts';
import { type Art, ACCENT, Pen, disposeTree, VIEW } from './draw.ts';

// The red d20. Built on dieGeometry's orientation: the 1 face up at rest, the 20 face
// its neighbour across an edge parallel to X. Red paper fill, ink edges, paper numerals.
//
// showFace(1 | 20) sets the resting face. setTip(0..1) is the gag's tip in between: the
// die rolls about its bottom edge on the +z side, so it ends resting on the next face
// with the 20 up (the footprint shifts toward +z by one face).
// For the roll in: `body` is the die (spin it freely), `faceNormals[i]` are unit normals
// in body space and `faceValues[i]` the number on that face; `restY` is the centre
// height that puts a face flat on y = 0.

export interface D20 extends Art {
  showFace(f: 1 | 20): void;
  setTip(t: number): void;
  body: THREE.Group;
  faceNormals: THREE.Vector3[];
  faceValues: number[];
  tipAngle: number;
  restY: number;
}

export function buildD20(radius: number, view: THREE.Vector3 = VIEW): D20 {
  const { geom, tipAngle, faceDir, faceCount, top, neighbour } = dieFaces(radius);
  const pos = geom.getAttribute('position');
  const restY = faceDir(top).length(); // inradius

  // numbers: 1 on top, 20 on the neighbour, the rest in face order
  const faceValues: number[] = [];
  let next = 2;
  for (let f = 0; f < faceCount; f++) faceValues.push(f === top ? 1 : f === neighbour ? 20 : next++);
  const faceNormals = Array.from({ length: faceCount }, (_, f) => faceDir(f).normalize());

  const root = new THREE.Group();
  const pivot = new THREE.Group();
  const body = new THREE.Group();
  root.add(pivot);
  pivot.add(body);

  const solid = paint(sketch(geom, 10, 'form'), { fill: ACCENT.red });
  body.add(solid);

  // numerals sit on each face, reading upright from the camera (`view`) when that face is up
  const nums = new THREE.Group();
  const tipRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tipAngle);
  const away = new THREE.Vector3(-view.x, 0, -view.z).normalize(); // top of a digit points away from the lens
  for (let f = 0; f < faceCount; f++) {
    const n = faceNormals[f];
    const c = faceDir(f);
    // the up-direction this face's digits should have, in body space
    let up: THREE.Vector3;
    if (f === top) up = away.clone();
    else if (f === neighbour) up = away.clone().applyQuaternion(tipRot.clone().invert());
    else up = new THREE.Vector3(0, 1, 0);
    up.addScaledVector(n, -up.dot(n));
    if (up.lengthSq() < 1e-6) up.set(0, 0, -1).addScaledVector(n, -n.z);
    up.normalize();
    const right = new THREE.Vector3().crossVectors(up, n);
    const v = faceValues[f];
    const glyph = paint(numeral(v, radius * (v >= 10 ? 0.24 : 0.3), 'form'), { line: ACCENT.paper });
    glyph.matrixAutoUpdate = false;
    glyph.matrix.makeBasis(right, up, n).setPosition(c.addScaledVector(n, radius * 0.01));
    nums.add(glyph);
  }
  body.add(nums);

  // the bottom edge to tip over: the bottom face's edge parallel to X, on the +z side
  let ymin = Infinity;
  for (let i = 0; i < pos.count; i++) ymin = Math.min(ymin, pos.getY(i));
  let zEdge = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) - ymin < 1e-4) zEdge = Math.max(zEdge, pos.getZ(i));
  }
  pivot.position.set(0, 0, zEdge);
  body.position.set(0, restY, -zEdge);

  const pen = new Pen();
  pen.at(solid, 0, 0.7);
  pen.at(nums, 0.55, 1);

  function setTip(t: number) {
    pivot.rotation.x = Math.min(1, Math.max(0, t)) * tipAngle;
  }

  pen.reveal(0);
  return {
    root,
    body,
    faceNormals,
    faceValues,
    tipAngle,
    restY,
    showFace: (f) => setTip(f === 20 ? 1 : 0),
    setTip,
    reveal: (p) => pen.reveal(p),
    dispose: () => disposeTree(root),
  };
}
