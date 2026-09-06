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

// Drawn strokes live on their own layer so the sketch pipeline's normal/depth pass
// (curtain.ts) sees only solid surfaces — a line has no surface to contour.
export const STROKE_LAYER = 2;

// Weight is how a drawing says "this matters" and "this is far away". Silhouettes and
// the things the camera is about carry a heavier stroke; background set dressing thins
// out and lets fog finish the job.
export type Weight = 'hero' | 'form' | 'faint';

// Boosted 2026-08-18 to the art bible's line presence: the bible draws its heroes at
// a bold 2.2-2.6 SVG px on a ~200px card; at film framing that means heavier tiers
// than the old CAD-shy weights, or every silhouette reads as a hairline.
const WIDTH: Record<Weight, number> = { hero: 3.4, form: 2.1, faint: 1.1 };

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

// Every LineMaterial in the film, base tiers and painted clones alike — they all need
// the viewport handed to them on resize or their strokes come out the wrong weight.
const lineMaterials: LineMaterial[] = Object.values(materials);

function pencilMaterial(w: Weight): LineMaterial {
  const m = new LineMaterial({
    color: LINE,
    linewidth: WIDTH[w] * SCALE,
    worldUnits: false,
    // fog OFF for ink (art bible): a drawing handles distance with lighter weight and
    // paler wash, never by dissolving the line — fogged strokes erased every silhouette
    // past ten units and the whole film read as unfinished previz
    fog: false,
    alphaToCoverage: true,
  });
  m.userData.role = 'stroke';
  return m;
}

// LineMaterial needs pixel dimensions to size its quads; without this every stroke
// renders at the wrong weight. Film.tsx calls this on mount and on every resize.
export function setPencilResolution(width: number, height: number) {
  for (const m of lineMaterials) m.resolution.set(width, height);
}

// Lambert, not Basic — draft 5 direction: the film's solids are REAL lit 3D, so form
// shades under the light rig in Film.tsx and tone comes from lighting rather than
// pattern fills. The drawn strokes, ink marks and shells stay unlit: lines are ink,
// not surface.
export const fillMaterial = new THREE.MeshLambertMaterial({
  color: PAPER,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
fillMaterial.userData.role = 'fill';

// ---- pigment --------------------------------------------------------------
//
// A painted surface carries pigment, not one flat hex — the colour pass read as tinted
// graphite because every fill was a single value edge to edge (the ground planes are
// 270 units of one colour). Two octaves of world-space value noise now modulate the
// fill: a broad mottle that breaks the big washes, and a fine granulation that reads as
// paper tooth under the paint. The mottle's dips drift cool and its rises warm, the way
// wet pigment separates. This is texture in the ALBEDO only — form still comes from the
// light rig alone (draft 5: no surface hatching, tone from light).
const PIGMENT_GLSL = /* glsl */ `
  varying vec3 vPigmentPos;
  uniform float uPigment;
  // sin-dot hash, domain-wrapped so world coordinates out at x=126 keep their
  // precision — the multiplicative hash banded into diagonal streaks on every surface
  float pigHash(vec3 p) {
    p = mod(p, 289.0);
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  float pigNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(pigHash(i), pigHash(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(pigHash(i + vec3(0.0, 1.0, 0.0)), pigHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(pigHash(i + vec3(0.0, 0.0, 1.0)), pigHash(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(pigHash(i + vec3(0.0, 1.0, 1.0)), pigHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
`;

function pigment(m: THREE.Material, amount = 1): void {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uPigment = { value: amount };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPigmentPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvPigmentPos = (modelMatrix * vec4(position, 1.0)).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + PIGMENT_GLSL)
      .replace(
        '#include <map_fragment>',
        /* glsl */ `#include <map_fragment>
        {
          float mottle = pigNoise(vPigmentPos * 0.55) * 0.5 + pigNoise(vPigmentPos * 2.4) * 0.5;
          float grain = pigNoise(vPigmentPos * 9.0);
          diffuseColor.rgb *= 1.0 + ((mottle - 0.5) * 0.26 + (grain - 0.5) * 0.1) * uPigment;
          diffuseColor.rgb *= mix(vec3(0.94, 0.97, 1.05), vec3(1.05, 1.01, 0.95), mix(0.5, mottle, uPigment));
        }`,
      );
  };
  // every pigmented fill compiles to the same program — share it
  m.customProgramCacheKey = () => 'pigment';
}
pigment(fillMaterial);

// A mark pressed hard enough to fill: pupils, an open mouth, the shadow inside a
// hearth. Everything else in the film is line and tone, so this stays rare — a solid
// black shape is the loudest thing on a pencil page.
export const inkMaterial = new THREE.MeshBasicMaterial({ color: LINE, fog: false });
inkMaterial.userData.role = 'ink';

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
  fog: false, // the contour is ink too — see the stroke materials
});
shellMaterial.userData.role = 'shell';

// ---- colour ---------------------------------------------------------------
//
// The film is drawn once and painted twice. Everything above builds paper-and-ink;
// `paint` swaps the *fill* under the line-work for a colour and leaves every stroke,
// hatch, shell and ink mark exactly where it was. The graphite pass (curtain.ts)
// computes the pencil state back out of whatever colour it is handed, so there is one
// set of art and no second pass of assets.
//
// Bulk use is the point: a scene's colour script is a list of one-liners next to its
// builder — `paint(rock, { fill: C1.rock })` — and anything left unpainted stays paper,
// which the graphite pass passes through untouched.
export type Paint = {
  fill?: number; // the solid under the drawing (replaces paper)
  line?: number; // drawn strokes + silhouette shell — omit and the outline stays ink
  ink?: number; // the pressed-hard solid marks: pupils, an open mouth
};

// Materials are shared by colour so a hundred painted props cost a handful of them.
const painted = new Map<string, THREE.Material>();

// Fills that sit on character-scale meshes the camera reads up close — the goblin, his
// kit, the guards' faces. Keyed by colour because that is the one thing paint() knows.
import { gobSkin, gobSkinLit, gobTunic, gobTunicShade, gobBelt, gobSatchel, gobTooth, gobHood, gobEarInner, gobEye, cloakCrimson, cloakIndigo } from './palette.ts';
const QUIET_PIGMENT = new Set<number>([
  gobSkin, gobSkinLit, gobTunic, gobTunicShade, gobBelt, gobSatchel, gobTooth,
  gobHood, gobEarInner, gobEye, cloakCrimson, cloakIndigo,
]);

function variant<T extends THREE.Material>(key: string, src: T, hex: number): T {
  const id = `${key}:${hex}`;
  let m = painted.get(id) as T | undefined;
  if (!m) {
    m = src.clone() as T;
    // clone() carries userData, so a painted material still knows what it is and can
    // be repainted — the art pass will iterate on these values.
    (m as unknown as { color: THREE.Color }).color = new THREE.Color(hex);
    // clone() does NOT carry onBeforeCompile — re-patch the pigment onto painted fills.
    // The characters stay quiet: full-strength mottle on a face-sized mesh reads as a
    // bruise, not paint — the texture budget belongs to the big world surfaces.
    if (m.userData?.role === 'fill') pigment(m, QUIET_PIGMENT.has(hex) ? 0.3 : 1);
    painted.set(id, m);
    if ((m as unknown as LineMaterial).isLineMaterial) lineMaterials.push(m as unknown as LineMaterial);
  }
  return m;
}

export function paint<T extends THREE.Object3D>(object: T, colors: Paint): T {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh & { isLineSegments2?: boolean };
    if (!mesh.isMesh) return;
    const m = mesh.material as THREE.Material;
    const role = m.userData?.role as string | undefined;

    if (role === 'stroke') {
      // keyed by width so each weight tier keeps its own painted material
      if (colors.line !== undefined) {
        mesh.material = variant(`stroke${(m as LineMaterial).linewidth}`, m as LineMaterial, colors.line);
      }
    } else if (role === 'fill' && colors.fill !== undefined) {
      // keyed by side so a double-sided plate fill never shares a variant with the
      // single-sided solids — a shared clone would flip every fill in the film
      mesh.material = variant(
        `fill${(m as THREE.MeshBasicMaterial).side}`,
        m as THREE.MeshBasicMaterial,
        colors.fill,
      );
    } else if (role === 'shell' && colors.line !== undefined) {
      mesh.material = variant('shell', m as THREE.MeshBasicMaterial, colors.line);
    } else if (role === 'ink' && colors.ink !== undefined) {
      mesh.material = variant('ink', m as THREE.MeshBasicMaterial, colors.ink);
    }
  });
  return object;
}

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

// ---- sculpt ---------------------------------------------------------------
//
// Deterministic 3D value noise, position-keyed: coincident seam vertices get identical
// offsets, so a displaced revolve never cracks open.
function noise3(x: number, y: number, z: number): number {
  const h = (ix: number, iy: number, iz: number) => {
    let n = ix * 374761393 + iy * 668265263 + iz * 1274126177;
    n = (n ^ (n >> 13)) * 1103515245;
    return (((n ^ (n >> 16)) >>> 0) % 1000) / 1000;
  };
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const ux = s(x - ix);
  const uy = s(y - iy);
  const uz = s(z - iz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(h(ix, iy, iz), h(ix + 1, iy, iz), ux), l(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), ux), uy),
    l(l(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), ux), l(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), ux), uy),
    uz,
  );
}

// Sculpt a clean solid into an organic one: displace every vertex along its normal by
// smooth noise, then re-derive the normals. The sketch pass (curtain.ts) contours the
// result like a pencil over real form — this is what separates "3D primitive" from
// "3D that was drawn". Deterministic per seed: the same mass on every load.
export function roughen(
  geom: THREE.BufferGeometry,
  amp: number,
  freq: number,
  seed = 0,
): THREE.BufferGeometry {
  geom.computeVertexNormals();
  const pos = geom.getAttribute('position');
  const nor = geom.getAttribute('normal');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = noise3(x * freq + seed * 13.7, y * freq + seed * 5.1, z * freq + seed * 9.3) - 0.5;
    pos.setXYZ(
      i,
      x + nor.getX(i) * n * amp * 2,
      y + nor.getY(i) * n * amp * 2,
      z + nor.getZ(i) * n * amp * 2,
    );
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

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

    // wobble roughly doubled for the art bible's hand — the old amplitudes read as
    // machine lines at any distance past arm's length
    const over = Math.min(len * 0.06, 0.05);
    const amp = Math.min(len * 0.035, 0.024);

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
  // strokes live ONLY on their layer; the curtain pass enables it on the main camera
  // every frame and drops it for the normal/depth contour pass
  line.layers.set(STROKE_LAYER);
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

// ---- drawn plates ---------------------------------------------------------
//
// The 2D-illustration primitive. `sketch` extracts its lines from where a mesh happens
// to bend; a plate's line goes where the author put it — an authored closed outline
// (a THREE.Shape of beziers) filled flat and stroked with the film's wobble. This is
// the goblin's ear technique promoted to a vocabulary word: the parts of the film that
// have to read as *drawn* (the cutout characters) are stacks of these, layered a few
// millimetres apart like cut paper.
// Plates stay UNLIT: they are the film's 2D-illustration layer — a drawn cutout takes
// its value from the author, not from where the sun is, and a lit double-sided card
// flips tone with every camera move.
const plateFill = new THREE.MeshBasicMaterial({
  color: PAPER,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
plateFill.userData.role = 'fill';
plateFill.side = THREE.DoubleSide; // a cutout has no back face to cull

export function plate(shape: THREE.Shape, w: Weight = 'form', divisions = 10): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.ShapeGeometry(shape, divisions), plateFill));
  const pts = shape.getPoints(divisions).map((p) => new THREE.Vector3(p.x, p.y, 0));
  g.add(polyline(pts, w, true));
  return g;
}

// An open drawn line along an authored path — the interior marks of a plate: an ear
// fold, a belt across a tunic, a stitch. Same wobble pipeline as everything else.
export function score(path: THREE.Path, w: Weight = 'faint', divisions = 10): LineSegments2 {
  return polyline(
    path.getPoints(divisions).map((p) => new THREE.Vector3(p.x, p.y, 0)),
    w,
  );
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
    if (!(child instanceof LineSegments2)) return;
    // retier without losing paint: a warm stroke that got pushed back should still be
    // warm, or `weight` silently reverts a `paint` that ran before it
    const hex = (child.material as LineMaterial).color.getHex();
    child.material =
      hex === LINE ? materials[w] : variant(`stroke${materials[w].linewidth}`, materials[w], hex);
  });
  return object;
}

// A ray burst — the film's pencil word for "light". Per the art bible this is a drawn
// mark, not a diagram: the spokes come out ragged (deterministically varied lengths)
// and a broken halo of short arcs rides between them.
export function rays(n = 10, r0 = 0.25, r1 = 0.55, w: Weight = 'form'): LineSegments2 {
  const positions: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    // ragged: every spoke its own length, long-short-long the way a hand flicks them
    const rIn = r0 * (1 + 0.12 * Math.cos(i * 1.9));
    const rOut = r1 + (r1 - r0) * 0.35 * Math.sin(i * 2.7);
    positions.push(cos * rIn, sin * rIn, 0, cos * rOut, sin * rOut, 0);
    // the broken halo: a short chord between every other pair of spokes
    if (i % 2 === 0) {
      const h = r1 * 1.12;
      const a0 = a + (Math.PI / n) * 0.55;
      const a1 = a + (Math.PI / n) * 1.45;
      positions.push(Math.cos(a0) * h, Math.sin(a0) * h, 0, Math.cos(a1) * h, Math.sin(a1) * h, 0);
    }
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
