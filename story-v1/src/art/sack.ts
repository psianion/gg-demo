import * as THREE from 'three';
import { polyline, curveLine, roughen, fillMaterial } from '../hero/film/pencil.ts';
import { type Art, Pen, rng, disposeTree, basis, ring, v3, clamp01, VIEW, yawTo } from './draw.ts';

// The monster sack: a lumpy burlap bag, gathered and tied at the neck, mouth flared.
// ~0.4 tall (just over half the goblin). setTip(0..1) rolls it forward (toward the camera) over its
// front foot until the mouth points down-and-out — the tokens pour from `mouth`.
// Authored with its front (folds, knot, tip direction) on +z, then turned so that front
// faces the camera; its contours use the view in that turned frame. Don't yaw the root.
const PROFILE: [number, number][] = [
  [0.0, 0.0], [0.17, 0.0], [0.215, 0.04], [0.215, 0.11], [0.18, 0.2],
  [0.11, 0.275], [0.06, 0.31], [0.075, 0.345], [0.11, 0.38],
];
const FOOT = 0.17; // where it pivots when it tips

export interface Sack extends Art {
  setTip(t: number): void;
  mouth: THREE.Object3D; // follows the mouth; world position = where tokens spill from
}

export function buildSack(view?: THREE.Vector3): Sack {
  const v = (view ?? VIEW).clone();
  const yaw = yawTo(v);
  const b = basis(v.applyAxisAngle(new THREE.Vector3(0, 1, 0), -yaw)); // view in the turned frame
  const rand = rng(515);
  const root = new THREE.Group();
  const turn = new THREE.Group();
  turn.rotation.y = yaw;
  root.add(turn);
  const pivot = new THREE.Group(); // at the front foot
  pivot.position.z = FOOT;
  const body = new THREE.Group();
  body.position.z = -FOOT;
  pivot.add(body);
  turn.add(pivot);

  const fill = new THREE.Mesh(
    roughen(new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 18, 0, Math.PI * 2), 0.012, 9, 4),
    fillMaterial,
  );

  const sides = new THREE.Group();
  for (const s of [-1, 1]) {
    const pts = PROFILE.slice(1).map(([r, y]) => v3(0, y, 0).addScaledVector(b.right, s * r * (1.04 + (rand() - 0.5) * 0.04)));
    sides.add(curveLine(pts, 'form', 18));
  }
  const bottom = polyline(ring(0.17, 0.17, 0.002, 18, 0, Math.PI * 2, rand), 'form');
  // the mouth: a ruffle of gathered cloth, not a clean rim (a clean rim reads as a vase)
  const ruffle = ring(0.11, 0.11, 0.38, 14, 0, Math.PI * 2, rand, 0.1);
  ruffle.forEach((p, i) => {
    const k = i % 2 === 0 ? 1.09 : 0.93;
    p.x *= k;
    p.z *= k;
    p.y += (i % 2 === 0 ? 0.02 : -0.01) + (rand() - 0.5) * 0.01;
  });
  ruffle[ruffle.length - 1].copy(ruffle[0]);
  const mouth = polyline(ruffle, 'form');
  const tie = new THREE.Group();
  tie.add(
    polyline(ring(0.07, 0.07, 0.318, 14, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(0.072, 0.072, 0.308, 14, 0.3, Math.PI * 2 + 0.3, rand), 'faint'),
    // the knot's loose end, hanging down the front
    curveLine([v3(0.03, 0.315, 0.065), v3(0.05, 0.27, 0.1), v3(0.04, 0.21, 0.13)], 'faint', 8),
  );
  // gather folds below the tie, and a couple of slumps on the belly — front side (+z)
  const folds = new THREE.Group();
  for (const x of [-0.05, 0.0, 0.05]) {
    folds.add(curveLine([v3(x * 0.6, 0.305, 0.068), v3(x, 0.27, 0.1), v3(x * 1.8, 0.22, 0.15)], 'faint', 6));
  }
  folds.add(curveLine([v3(-0.12, 0.08, 0.16), v3(-0.04, 0.11, 0.2), v3(0.06, 0.09, 0.19)], 'faint', 8));
  folds.add(curveLine([v3(0.08, 0.17, 0.17), v3(0.13, 0.14, 0.13)], 'faint', 4));
  body.add(fill, sides, bottom, mouth, tie, folds);

  const mouthAnchor = new THREE.Object3D();
  mouthAnchor.position.y = 0.38;
  body.add(mouthAnchor);

  const pen = new Pen();
  pen.at(fill, 0, 0.5);
  pen.seq([sides, bottom, mouth], 0, 0.6);
  pen.seq([tie, folds], 0.6, 1);

  pen.reveal(0);
  return {
    root,
    mouth: mouthAnchor,
    setTip: (t) => {
      pivot.rotation.x = clamp01(t) * 1.75; // linear — easing is the caller's; ~100° = mouth past horizontal
    },
    reveal: (p) => pen.reveal(p),
    dispose: () => disposeTree(root),
  };
}
