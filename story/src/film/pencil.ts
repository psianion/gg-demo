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

export const fillMaterial = new THREE.MeshBasicMaterial({
  color: PAPER,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});

// A mark pressed hard enough to fill: pupils, an open mouth, the shadow inside a
// hearth. Everything else in the film is line and tone, so this stays rare — a solid
// black shape is the loudest thing on a pencil page.
export const inkMaterial = new THREE.MeshBasicMaterial({ color: LINE, fog: true });

// The silhouette shell. `EdgesGeometry` only emits an edge where two faces meet above
// a threshold, which on a curved form gives a cage of longitudinal facet lines and no
// outline at all — the goblin's head read as a striped scribble rather than a head.
// Raising the threshold is strictly worse: a sphere's silhouette is view-dependent,
// not a geometric edge, so past ~30° there is nothing left to draw and the head
// vanishes, leaving the ears floating.
//
// Drawing the solid a second time, slightly larger and inside-out, gives a true
// contour from any angle. It costs one extra draw call per solid, so it is opt-in and
// spent only on the forms the camera actually reads.
const shellMaterial = new THREE.MeshBasicMaterial({
  color: LINE,
  side: THREE.BackSide,
  fog: true,
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
//
// `shell` is the contour thickness in world units, and turning it on is what lets a
// curved form drop its interior facet lines to 'faint' and still read — see
// shellMaterial above. Leave it off for anything boxy: a cube's edges are its outline.
export function sketch(
  geom: THREE.BufferGeometry,
  threshold = 25,
  w: Weight = 'form',
  shell = 0,
): THREE.Group {
  const group = new THREE.Group();
  const edges = new THREE.EdgesGeometry(geom, threshold);
  const src = edges.getAttribute('position').array as Float32Array;
  group.add(new THREE.Mesh(geom, fillMaterial), drawn(strokes(src), w));
  edges.dispose();

  if (shell > 0) {
    // scaled by radius so the rim comes out a constant thickness whatever the form's
    // size — a flat scale factor makes small props hairline and big ones blunt
    geom.computeBoundingSphere();
    const r = geom.boundingSphere?.radius ?? 1;
    const rim = new THREE.Mesh(geom, shellMaterial);
    rim.scale.setScalar(1 + (shell * SCALE) / r);
    group.add(rim);
  }
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

// A drawn line through a run of points — roads, rivers, the path, a window frame, a
// plank seam. These used to be `THREE.Line` hairlines, which is the same 1px CAD
// stroke the whole film moved off: no weight, no wobble, and no way to say that a
// river matters more than a field boundary. Corners get the same overshoot as every
// other stroke, so the joins overlap the way a hand's do.
export function polyline(points: THREE.Vector3[], w: Weight = 'form', close = false): LineSegments2 {
  const src: number[] = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    src.push(points[i].x, points[i].y, points[i].z, points[i + 1].x, points[i + 1].y, points[i + 1].z);
  }
  if (close && n > 2) {
    src.push(points[n - 1].x, points[n - 1].y, points[n - 1].z, points[0].x, points[0].y, points[0].z);
  }
  return drawn(strokes(new Float32Array(src)), w);
}

// A smooth run — roads and rivers meander; a 3-point polyline reads as a survey
// diagram. Resolution drops on phones with the rest of the stroke budget.
export function curveLine(points: THREE.Vector3[], w: Weight = 'form', segments = 24): LineSegments2 {
  const curve = new THREE.CatmullRomCurve3(points);
  return polyline(curve.getPoints(reduced ? Math.ceil(segments / 2) : segments), w);
}

// Ground contact. Nothing in the film currently sits convincingly on the floor; a short
// tonal smear under an object is what makes it stop floating.
export function contact(width: number, depth = width * 0.4): THREE.Group {
  const g = new THREE.Group();
  // Density is per unit of depth, so a fixed value gave a hand-sized shadow three
  // strokes (stray marks) and a table-sized one fifteen (a zebra crossing). Solving
  // for a constant stroke count instead makes every shadow in the film read the same
  // way whatever it is under.
  const h = hatch(width, depth, 9 / depth, 0, 'faint');
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

// Digits as a seven-segment cell: six named points around a W×H rectangle, and each
// digit is just the subset of the seven edges between them that's lit. Straight lines
// only — this is a pencil mark on a die face, not a font.
// '1' is handled separately below — a bare right-hand stroke reads as an edge, not a
// digit, and leaves the glyph's ink lopsided in its cell instead of centred.
type Seg = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
const DIGIT_SEGMENTS: Record<string, Seg[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

// A number, laid out digit by digit and centred on the origin, lying flat in XY. Built
// from the same stroke pipeline as every other primitive so it wobbles and weights like
// the rest of the film's line-work — this is what gets stamped on a d20's faces.
export function numeral(value: number, height = 1, w: Weight = 'form'): THREE.Group {
  const digits = Math.trunc(Math.abs(value)).toString().split('');
  const W = height * 0.6; // digit width
  const gap = height * 0.22; // space between digits
  const total = digits.length * W + (digits.length - 1) * gap;
  const x0 = -total / 2; // centres the whole run on the origin
  const top = height / 2;
  const mid = 0;
  const bot = -height / 2;

  const positions: number[] = [];
  digits.forEach((d, i) => {
    const l = x0 + i * (W + gap);
    const r = l + W;
    const c = (l + r) / 2;
    // the seven-segment corners, plus a middle column for the '1' stroke
    const pt: Record<string, [number, number]> = {
      TL: [l, top], TR: [r, top], TM: [c, top],
      ML: [l, mid], MR: [r, mid],
      BL: [l, bot], BR: [r, bot], BM: [c, bot],
    };
    if (d === '1') {
      // a stem down the centre plus a full-width foot — the foot is what keeps this
      // digit's ink spanning the same [l, r] as every other digit's
      positions.push(...pt.TM, 0, ...pt.BM, 0, ...pt.BL, 0, ...pt.BR, 0);
      return;
    }
    const edge: Record<Seg, [string, string]> = {
      a: ['TL', 'TR'], b: ['TR', 'MR'], c: ['MR', 'BR'],
      d: ['BL', 'BR'], e: ['ML', 'BL'], f: ['TL', 'ML'], g: ['ML', 'MR'],
    };
    for (const seg of DIGIT_SEGMENTS[d] ?? []) {
      const [p, q] = edge[seg];
      const [px, py] = pt[p];
      const [qx, qy] = pt[q];
      positions.push(px, py, 0, qx, qy, 0);
    }
  });

  const group = new THREE.Group();
  group.add(drawn(strokes(new Float32Array(positions)), w));
  return group;
}
