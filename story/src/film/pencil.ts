import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

// The pencil vocabulary. Every solid, every stroke and every shadow in the film is
// built from these five helpers, so the whole world draws with one hand.
//
// The previz used to render as hidden-line CAD: `LineBasicMaterial.linewidth` is
// clamped to 1px by nearly every GL driver, so every edge came out the same weight no
// matter how near or important it was, and every edge was machine-exact. Lines here are
// screen-space quads (LineSegments2) with real width tiers, and every stroke carries
// baked-in wobble and corner overshoot.

export const PAPER = 0xf7f5f0;
export const LINE = 0x222222;

// Weight is how a drawing says "this matters" and "this is far away". Silhouettes and
// the things the camera is about carry a heavier stroke; background set dressing thins
// out and lets fog finish the job.
export type Weight = 'hero' | 'form' | 'faint';

const WIDTH: Record<Weight, number> = { hero: 2.4, form: 1.5, faint: 0.85 };

// Phones get thinner strokes and straighter lines: the same drawing, cheaper to draw.
// Composition never varies by device, only stroke cost.
const reduced = typeof window !== 'undefined' && window.innerWidth < 700;
const SUB = reduced ? 1 : 3; // sub-segments per edge — the wobble needs interior points
const SCALE = reduced ? 0.75 : 1;

const materials: Record<Weight, LineMaterial> = {
  hero: pencilMaterial('hero'),
  form: pencilMaterial('form'),
  faint: pencilMaterial('faint'),
};

function pencilMaterial(w: Weight): LineMaterial {
  return new LineMaterial({
    color: LINE,
    linewidth: WIDTH[w] * SCALE,
    worldUnits: false,
    fog: true,
    alphaToCoverage: true,
  });
}

// LineMaterial needs pixel dimensions to size its quads; without this every stroke
// renders at the wrong weight. Film.tsx calls this on mount and on every resize.
export function setPencilResolution(width: number, height: number) {
  for (const m of Object.values(materials)) m.resolution.set(width, height);
}

// Hairline material, for the few places that draw with THREE.Line / LineLoop rather
// than a stroke — the ground path, window and door frames, the board grid. Those
// convert to drawn strokes scene by scene during the detail pass.
export const lineMaterial = new THREE.LineBasicMaterial({ color: LINE });

export const fillMaterial = new THREE.MeshBasicMaterial({
  color: PAPER,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});

// Deterministic, so the drawing is identical on every load. A re-randomising wobble
// would shimmer on reload and read as noise rather than as someone's hand.
let seed = 0x9e3779b9;
function rand(): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const jitter = () => rand() - 0.5;

// Turn clean edge pairs into drawn strokes: overshoot the corners the way a hand does
// when it doesn't stop exactly on the join, and bow the span slightly off true.
function strokes(src: Float32Array | THREE.TypedArray): number[] {
  const out: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  const n1 = new THREE.Vector3();
  const n2 = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const alt = new THREE.Vector3(1, 0, 0);

  for (let i = 0; i < src.length; i += 6) {
    a.set(src[i], src[i + 1], src[i + 2]);
    b.set(src[i + 3], src[i + 4], src[i + 5]);
    dir.subVectors(b, a);
    const len = dir.length();
    if (len < 1e-6) continue;
    dir.divideScalar(len);

    // two axes across the stroke, so the wobble isn't confined to one plane
    n1.crossVectors(dir, Math.abs(dir.y) > 0.9 ? alt : up).normalize();
    n2.crossVectors(dir, n1).normalize();

    const over = Math.min(len * 0.04, 0.03);
    const amp = Math.min(len * 0.02, 0.012);

    a.addScaledVector(dir, -over * rand());
    b.addScaledVector(dir, over * rand());

    for (let s = 0; s < SUB; s++) {
      p.lerpVectors(a, b, s / SUB);
      q.lerpVectors(a, b, (s + 1) / SUB);
      // endpoints stay put; only the interior of a stroke drifts
      if (s > 0) p.addScaledVector(n1, jitter() * amp).addScaledVector(n2, jitter() * amp);
      if (s < SUB - 1) q.addScaledVector(n1, jitter() * amp).addScaledVector(n2, jitter() * amp);
      out.push(p.x, p.y, p.z, q.x, q.y, q.z);
    }
  }
  return out;
}

function drawn(positions: number[], w: Weight): LineSegments2 {
  const geom = new LineSegmentsGeometry();
  geom.setPositions(positions);
  const line = new LineSegments2(geom, materials[w]);
  line.computeLineDistances();
  return line;
}

// One solid: paper-fill mesh that occludes what's behind it, plus drawn edges that
// describe the form. Same call shape as before, so every existing set piece still builds.
export function sketch(geom: THREE.BufferGeometry, threshold = 25, w: Weight = 'form'): THREE.Group {
  const group = new THREE.Group();
  // Note: raising this threshold to quiet the facet scribble on curved forms makes
  // spheres vanish outright — a sphere's silhouette is view-dependent, not a geometric
  // edge, so EdgesGeometry has nothing left to draw. Curved forms need a real outline
  // (a back-face shell) before their interior lines can be thinned out.
  const edges = new THREE.EdgesGeometry(geom, threshold);
  const src = edges.getAttribute('position').array as Float32Array;
  group.add(new THREE.Mesh(geom, fillMaterial), drawn(strokes(src), w));
  edges.dispose();
  return group;
}

// Tone. Parallel strokes at a density that reads as a value — this is what separates a
// drawing from a diagram, and it is the most useful thing the stencil hands the art
// pass: it says where the shadow goes before anyone paints it.
export function hatch(
  width: number,
  height: number,
  density = 14,
  angle = -0.5,
  w: Weight = 'faint',
): LineSegments2 {
  const positions: number[] = [];
  const n = Math.max(2, Math.round(density * height));
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const half = width / 2;

  for (let i = 0; i < n; i++) {
    const y = -height / 2 + (height * (i + 0.5)) / n + jitter() * (height / n) * 0.4;
    // strokes stop short of the edge by varying amounts — a filled rectangle of
    // perfectly flush lines reads as a swatch, not as shading
    const x0 = -half * (0.75 + rand() * 0.25);
    const x1 = half * (0.75 + rand() * 0.25);
    positions.push(x0 * cos - y * sin, x0 * sin + y * cos, 0, x1 * cos - y * sin, x1 * sin + y * cos, 0);
  }
  return drawn(strokes(new Float32Array(positions)), w);
}

// Cross-hatch for the darkest values — a second pass laid across the first.
export function crossHatch(width: number, height: number, density = 12): THREE.Group {
  const g = new THREE.Group();
  g.add(hatch(width, height, density, -0.5), hatch(width, height, density * 0.8, 0.9));
  return g;
}

// Ground contact. Nothing in the film currently sits convincingly on the floor; a short
// tonal smear under an object is what makes it stop floating.
export function contact(width: number, depth = width * 0.4): THREE.Group {
  const g = new THREE.Group();
  const h = hatch(width, depth, 10, 0, 'faint');
  g.add(h);
  g.rotation.x = -Math.PI / 2;
  g.position.y = 0.012;
  return g;
}

// Retier an already-built object — used to push a hero prop forward or drop set
// dressing back without rebuilding its geometry.
export function weight(object: THREE.Object3D, w: Weight): THREE.Object3D {
  object.traverse((child) => {
    if (child instanceof LineSegments2) child.material = materials[w];
  });
  return object;
}

// A ray burst — the film's pencil word for "light" — n spokes from r0 to r1.
export function rays(n = 10, r0 = 0.25, r1 = 0.55, w: Weight = 'form'): LineSegments2 {
  const positions: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    positions.push(cos * r0, sin * r0, 0, cos * r1, sin * r1, 0);
  }
  return drawn(strokes(new Float32Array(positions)), w);
}
