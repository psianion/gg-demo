import * as THREE from 'three';

// The d20 is the hinge of the whole film: the camera comes close enough to read the
// number on its top face, and the gag is that one face becomes another with a single
// tilt. So the die is built to a known orientation — the face carrying the 1 pointing
// straight up at rest, and the face carrying the 20 sharing an edge with it, that edge
// lying along local X. Tipping is then one rotation about one axis, and `tipAngle` is
// exactly how far to turn it.
//
// This is pure geometry, kept apart from the drawing so the orientation maths can be
// checked on its own — if it drifts, the 1 tips to something that isn't the 20 and
// nobody finds out until they watch the film.
export function dieFaces(radius: number) {
  const geom = new THREE.IcosahedronGeometry(radius);
  const pos = geom.getAttribute('position');

  const at = (i: number) => new THREE.Vector3().fromBufferAttribute(pos, i);
  const key = (v: THREE.Vector3) => `${v.x.toFixed(3)}|${v.y.toFixed(3)}|${v.z.toFixed(3)}`;

  // on a regular icosahedron centred on the origin a face's centroid points along its
  // own normal, so one vector serves as both
  const faceDir = (f: number) =>
    at(f * 3)
      .add(at(f * 3 + 1))
      .add(at(f * 3 + 2))
      .divideScalar(3);
  const faceKeys = (f: number) => [key(at(f * 3)), key(at(f * 3 + 1)), key(at(f * 3 + 2))];

  const faceCount = pos.count / 3;
  const top = 0;
  const topKeys = faceKeys(top);
  const sharedWithTop = (f: number) => faceKeys(f).filter((k) => topKeys.includes(k));

  // a neighbour shares exactly two vertices with the top face — that pair is the edge
  // the die rolls over
  let neighbour = -1;
  for (let f = 1; f < faceCount && neighbour < 0; f++) {
    if (sharedWithTop(f).length === 2) neighbour = f;
  }

  const edgeKeys = sharedWithTop(neighbour);
  const edge = [0, 1, 2].map((k) => at(top * 3 + k)).filter((v) => edgeKeys.includes(key(v)));

  // stand the die up: top face normal to +Y, rolling edge along X
  const yAxis = faceDir(top).normalize();
  const xAxis = edge[1].clone().sub(edge[0]).normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  xAxis.crossVectors(yAxis, zAxis).normalize(); // re-orthogonalise against float drift
  geom.applyMatrix4(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis).invert());

  // both normals now lie in the YZ plane, so one rotation about X swaps them
  const nNext = faceDir(neighbour).normalize();
  let tipAngle = -Math.atan2(nNext.z, nNext.y);

  // keep the roll leaning toward the camera side. Half a turn about Y moves the
  // neighbour to the other side of the top face and flips the sign, which lets the
  // finger always come in from behind the die rather than across the lens.
  if (tipAngle < 0) {
    geom.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI));
    tipAngle = -tipAngle;
  }

  return { geom, tipAngle, faceDir, faceCount, top, neighbour };
}
