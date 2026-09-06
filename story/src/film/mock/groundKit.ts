// GROUND KIT — the shared build vocabulary for author group A (art bible §11.8):
// ground · incident · rock · strata · field. Five classes, one skirt formula, one
// ground painting, one rim grammar (§11.5 C1/C2/C3/C8/C9).
//
// WHY THIS FILE EXISTS AT ALL: §11.1's one sentence — "the hero island is not a sample
// of this world, it is a slice of it" — is only true if the five classes call the SAME
// functions rather than five parallel re-implementations of the hero's arithmetic. All
// of it lives here; the five mock modules are placement and dressing.
//
// The hero's own helpers (mixHex, brand, mark, inkEdges, contourArc, bakeIslandAlbedo)
// are module-private in stages/hero.ts and this workflow may not touch that file, so
// the four small ones are re-derived here, byte-for-byte, and the bakes are authored
// fresh to §11.2's own texel arithmetic. Where a number differs from the hero's it is
// because a tiling sheet cannot carry what a unique 2048² card carries — every such
// place is commented with the measurement.
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as P from '../palette.ts';
import { paint, polyline, roughen, sketch, STROKE_LAYER, type Weight } from '../pencil.ts';
import { buildIsland } from '../stages/islandKit.ts';
import { createTrilayer } from '../stages/trilayer.ts';

// ---- palette helpers (hero.ts:290–299, re-derived) ---------------------------------
export const css = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;
export const rgba = (hex: number, a: number) =>
  `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
/** Two committed tokens, blended. Gate 2: no colour in this film is a fresh hue. */
export const mixHex = (a: number, b: number, t: number) => {
  const ch = (h: number, s: number) => (h >> s) & 255;
  const m = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};

// deterministic hand — the same painting on every load (gate 6 bans Math.random)
let bakeSeed = 0x51f3a7d;
export function brand(): number {
  bakeSeed = (bakeSeed + 0x6d2b79f5) | 0;
  let t = Math.imul(bakeSeed ^ (bakeSeed >>> 15), 1 | bakeSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ---- the authored mixes this group needs (§11.3, tone and tier recomputed there) ----
export const GRASS_LIT = mixHex(P.grass, P.flameCore, 0.58); // #CDD5A4 t1
export const GRASS_SHADE = mixHex(P.grassDeep, P.canopyDeep, 0.85); // #4C7436 t4
export const EARTH_LIT = mixHex(P.earth, P.flameCore, 0.35); // #D5C29B t1
export const TRACK_SHADE = mixHex(P.earthTrack, P.timberDark, 0.45); // #8C6F4C t4
export const ROCK_LIT = mixHex(P.rockFace, P.flameCore, 0.4); // #B4B39D t2
export const ROCK_SHADE = mixHex(P.rockFace, P.caveDark, 0.55); // #5F5A4C t4
// P0h — the cool rock (cave flank, ring stones). Raw `P.stoneCool` painted through
// `rockMaterial()` breaches law 6 after the bake's grey(0.56/0.78/1.0) multiply:
// base stop (×0.78) -> triTone 0.6466 t4 (0.027 from 0.62); lit stop (×1.0, no-op since
// the multiplier is 1) -> triTone 0.4893 t3 (0.029 from 0.46). Shade stop clears
// (0.8001 t4, 0.18 from 0.62). Fix (§4.5, never a fresh hue): mix `stoneCool` toward
// `caveDark` — the smallest t that clears every stop by > 0.03, staying cool per the
// swept t=0.05 step 0.05..0.60 (`caveDark` and `skyDusk` both clear at t=0.05; `caveDark`
// wins on margin — 0.045 vs `skyDusk`'s 0.030, too close to the boundary to trust past
// texture-quantization noise). shade ×0.56 -> 0.8136 t4 (d0.194); base ×0.78 -> 0.6650 t4
// (d0.045); lit ×1.0 -> 0.5126 t3 (d0.053). min distance 0.045. Reproduce:
// `node scripts/tritone.mjs mix "#8792A6" "#3F3226" 0.05` gives the raw mix (#838DA0,
// triTone 0.5126 — the lit-stop number, ×1.0 being identity); the base/shade stop
// triTones require the multiply (§4.3) and were computed in
// scratchpad p0h/sweep.mjs, not this script (tritone.mjs has no per-stop multiply).
// committed 2026-09-06 (P0h) — raw stoneCool breached law 6 at the base and lit stops
// (0.027 / 0.029).
export const COOL_ROCK = mixHex(P.stoneCool, P.caveDark, 0.05); // #838DA0
export const CLIFF_LIT = mixHex(P.stoneWarm, P.flameCore, 0.35); // #C4B599 t2
export const CLIFF_SHADE = mixHex(P.stoneWarm, P.caveDark, 0.5); // #746450 t4
export const STONE_SHELF = mixHex(P.stoneWarm, P.timberDark, 0.42); // #8F795E t3
export const FIELD_A = mixHex(P.earth, P.grass, 0.35); // #B2AC75 t2
export const FIELD_B = mixHex(P.earth, P.undergrowth, 0.5); // #A59F6E t2
export const FIELD_C = mixHex(P.earthTrack, P.timberDark, 0.3); // #957751 t3

// ---- drawn marks -------------------------------------------------------------------

/** One polyline, wobbled and coloured. hero.ts:644's `mark`, re-derived. */
export const mark = (pts: THREE.Vector3[], hex: number, w: Weight = 'form') =>
  paint(polyline(pts, w), { line: hex });

/**
 * MANY disjoint runs, ONE draw call.
 *
 * The hero authors sixteen cut marks as sixteen `polyline()` calls and pays sixteen
 * draws (hero.ts:1597–1611). At island scale that is affordable; at the cliff's
 * six boundary arcs + sixteen cut marks + nine measure ticks it is 31 draws against
 * S2's whole 47-draw budget (§11.4 R18), so the marks merge.
 *
 * The wobble, the corner overshoot, the weight tiers and the stroke layer all still
 * come from `polyline()` — this only concatenates the segment lists it produces, so
 * there is exactly one hand in the film and it is pencil.ts's.
 */
export function strokeSet(runs: THREE.Vector3[][], hex: number, w: Weight = 'form'): THREE.Object3D {
  const pos: number[] = [];
  let mat: LineSegments2['material'] | null = null;
  for (const run of runs) {
    if (run.length < 2) continue;
    const line = polyline(run, w);
    mat ??= line.material;
    const attr = line.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute;
    const src = attr.data.array as Float32Array;
    for (let i = 0; i < src.length; i++) pos.push(src[i]);
    line.geometry.dispose();
  }
  if (!mat || pos.length === 0) return new THREE.Group();
  const geom = new LineSegmentsGeometry();
  geom.setPositions(pos);
  const merged = new LineSegments2(geom, mat);
  merged.computeLineDistances();
  merged.layers.set(STROKE_LAYER);
  return paint(merged, { line: hex });
}

/** The form's own edges as strokes, fill dropped — hero.ts's `inkEdges`, re-derived. */
export function inkEdges(
  geom: THREE.BufferGeometry,
  threshold: number,
  hex: number,
  w: Weight = 'form',
): THREE.Group {
  const s = sketch(geom, threshold, w);
  (s.children[0] as THREE.Mesh).visible = false; // tone is the trilayer's; only strokes stay
  return paint(s, { line: hex });
}

// ---- THE SILHOUETTE PASS -------------------------------------------------------------
//
// WHY THIS EXISTS, and it is the judgement's item 7. `inkEdges` inks every edge whose
// dihedral angle passes a threshold, and a dodecahedron's faces meet at ~63° — so on a
// five-lobe rock mass ANY threshold under 63 draws all ~150 of them and the drawn state
// is "a polygon wireframe diagram, an engineering drawing of a polyhedron, not a drawn
// rock". Raising the threshold does not fix it either: past 63 the pass keeps whichever
// interior ridges `roughen()` happened to spread, which is a random subset of the same
// cage rather than a drawing.
//
// A HAND DRAWS THE OUTLINE. So this finds the actual silhouette from THIS lens — every
// edge whose two faces disagree about which way they face the camera, plus any open
// boundary edge — and chains those into continuous runs. On the five-lobe hero rock it
// returns 8–14 runs where `inkEdges(…, 22)` returned about 150 segments of cage, and it
// is the same instrument the rest of the film draws with: the mass's own edge, where the
// shot sees it turn.
//
// Static camera, so this is a BUILD-TIME solve, not a per-frame one. Nothing in this
// film has a moving lens.
const QUANT = 1e4;

export function silhouetteRuns(geom: THREE.BufferGeometry, view: THREE.Vector3): THREE.Vector3[][] {
  const pos = geom.getAttribute('position') as THREE.BufferAttribute;
  const idx = geom.getIndex();
  const tri = idx ? idx.count / 3 : pos.count / 3;
  const at = (i: number) => (idx ? idx.getX(i) : i);

  // weld by quantised position: PolyhedronGeometry and ExtrudeGeometry both arrive
  // non-indexed, so without a weld every edge looks like a boundary and the pass
  // returns the whole triangle soup
  const id = new Map<string, number>();
  const pt: THREE.Vector3[] = [];
  const vid = (i: number) => {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = `${Math.round(x * QUANT)},${Math.round(y * QUANT)},${Math.round(z * QUANT)}`;
    let v = id.get(k);
    if (v === undefined) {
      v = pt.length;
      id.set(k, v);
      pt.push(new THREE.Vector3(x, y, z));
    }
    return v;
  };

  const edge = new Map<string, { a: number; b: number; s: number[] }>();
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let t = 0; t < tri; t++) {
    const v = [vid(at(t * 3)), vid(at(t * 3 + 1)), vid(at(t * 3 + 2))];
    A.subVectors(pt[v[1]], pt[v[0]]);
    B.subVectors(pt[v[2]], pt[v[0]]);
    N.crossVectors(A, B);
    const facing = Math.sign(N.dot(view));
    for (let e = 0; e < 3; e++) {
      const a = v[e];
      const b = v[(e + 1) % 3];
      if (a === b) continue;
      const k = a < b ? a + '_' + b : b + '_' + a;
      const hit = edge.get(k);
      if (hit) hit.s.push(facing);
      else edge.set(k, { a, b, s: [facing] });
    }
  }

  // an edge is on the silhouette when its two faces disagree about the camera — or when
  // it has only one face at all, which is what an open form's rim is
  const adj = new Map<number, number[]>();
  const segs: [number, number][] = [];
  for (const { a, b, s } of edge.values()) {
    const sil = s.length === 1 || (s.length >= 2 && s[0] * s[1] < 0);
    if (!sil) continue;
    segs.push([a, b]);
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(segs.length - 1);
    (adj.get(b) ?? adj.set(b, []).get(b)!).push(segs.length - 1);
  }

  // chain them: a silhouette is a small number of long runs, and a run is what a hand
  // draws in one movement — 40 loose segments would cost the wobble pipeline its whole
  // point
  const used = new Array(segs.length).fill(false);
  const runs: THREE.Vector3[][] = [];
  for (let s0 = 0; s0 < segs.length; s0++) {
    if (used[s0]) continue;
    used[s0] = true;
    const chain = [segs[s0][0], segs[s0][1]];
    for (const dir of [0, 1]) {
      for (;;) {
        const end = dir ? chain[0] : chain[chain.length - 1];
        const next = (adj.get(end) ?? []).find((s) => !used[s]);
        if (next === undefined) break;
        used[next] = true;
        const [a, b] = segs[next];
        const other = a === end ? b : a;
        if (dir) chain.unshift(other);
        else chain.push(other);
      }
    }
    if (chain.length >= 3) runs.push(chain.map((v) => pt[v].clone()));
  }

  // DECIMATE, and this is both the art and the budget. A hand does not put a corner at
  // every mesh edge: an outline traced vertex-for-vertex reads as a traced polygon, and
  // it also costs, because `polyline()` subdivides every span three ways and a
  // LineSegments2 segment is an instanced solid — the stroke pipeline IS this class's
  // triangle bill (the judgement measured +18,724 for a boulder field of 468 mesh
  // triangles). Keeping one point per ~16% of the form's radius cuts a 60-point lobe
  // outline to about twelve and turns it into a drawn contour at the same time.
  // The step is a fraction of the RUN's own length, not of the whole merged mass —
  // otherwise a fourteen-chunk scree, whose bounding sphere is the size of a cliff,
  // decimates every pebble down to a triangle. About fourteen points per run whatever
  // the run is, which is a contour a hand draws in one movement.
  return runs
    .map((run) => {
      let len = 0;
      for (let i = 1; i < run.length; i++) len += run[i].distanceTo(run[i - 1]);
      const step = len / 14;
      const out = [run[0]];
      for (let i = 1; i < run.length - 1; i++) {
        if (run[i].distanceTo(out[out.length - 1]) >= step) out.push(run[i]);
      }
      out.push(run[run.length - 1]);
      return out;
    })
    .filter((run) => run.length >= 3);
}

/** The silhouette of a mass, drawn — biased toward the lens so it wins the depth test. */
export function silhouette(
  geom: THREE.BufferGeometry,
  view: THREE.Vector3,
  hex: number,
  push = 0.05,
  w: Weight = 'form',
): THREE.Object3D {
  const runs = silhouetteRuns(geom, view).map((run) => run.map((p) => p.addScaledVector(view, push)));
  return strokeSet(runs, hex, w);
}

// ---- C1 · one skirt formula --------------------------------------------------------
//
// Every finite ground object in the film stands on the hero's three-band closed lathe
// skirt scaled by ONE number. At the hero's rz 1.8 this lands 0.439 · 1.8 = 0.7902, so
// k = 1.000253 — identical to the shipped skirt to four significant figures, a quarter of
// a millimetre on a 1.8-u card, and NOT byte-identical however often it gets written down
// that way. The film's ground vocabulary is the same function called with a bigger
// argument, not a translation of it.
export const skirtD = (rz: number) => Math.min(2.6, Math.max(0.5, rz * 0.439));

const SKIRT_BANDS: { color: number; amp: number; pts: [number, number][] }[] = [
  // earth lip, proud and near-vertical, meets the card
  { color: P.earth, amp: 0.02, pts: [[0.996, 0.004], [1.012, -0.055], [0.99, -0.125], [0.982, -0.175]] },
  // stone shelf, a committed step darker than the lip (raw stoneWarm vs earth measured
  // 12 luma apart and the walk read the two as one tan band)
  { color: STONE_SHELF, amp: 0.03, pts: [[0.998, -0.155], [0.962, -0.265], [0.93, -0.375]] },
  // the keel: a hand-cut slice tapering to a drip point, upper run ≤30° inward so the
  // 33°-elevation lens actually sees caveDark below the shelf
  { color: P.caveDark, amp: 0.05, pts: [[0.945, -0.35], [0.9, -0.52], [0.78, -0.63], [0.5, -0.71], [0.18, -0.77], [0, -0.79]] },
];

// ---- bakeSkirtBand — the judgement's item 21, the highest-leverage fix in the set ----
//
// "The SKIRT is not [painted]: judge-ground-1444x711-perf-z6.jpg shows the tan band and
// the grey band as two smooth Lambert gradients with no marks at all, beside an island
// skirt that carries strata, roots and a rim contour. This is the single highest-leverage
// fix in the set because ground+incident are twelve islands."
//
// It was the same fault as row 4's cliff and it takes the same answer: THREE TINT BLOCKS
// IN ONE 512², UV-selected, so one bake and ONE MATERIAL serve all three bands of every
// island in the film where there used to be three materials and no surface at all.
//
// SCREEN-SPACE: an island's skirt circumference is about 12 u and u repeats three times,
// so 512 × 3 / 12 = 128 texels/unit around the ring; a block's 170 texels over a 0.2-u
// band is 850 down it, which is heavily oversampled in v and exactly why every mark here
// runs ALONG the band. A skirt is a cut section through laid beds; its marks are
// horizontal by geology and by `dir 0.04`, and a vertical family here would be the hatch.
const SKIRT_BLOCKS = 3;
let skirtTex: THREE.CanvasTexture | null | undefined;
function bakeSkirtBand(): THREE.CanvasTexture | null {
  if (skirtTex !== undefined) return skirtTex;
  if (typeof document === 'undefined') return (skirtTex = null);
  const size = 512;
  const block = size / SKIRT_BLOCKS;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.lineCap = 'round';
  SKIRT_BANDS.forEach((band, b) => {
    const y0 = b * block;
    ctx.fillStyle = css(band.color);
    ctx.fillRect(0, y0 - 1, size, block + 2);
    const lit = mixHex(band.color, P.flameCore, 0.3);
    const dark = mixHex(band.color, P.caveDark, 0.24);
    // three bedding partings per band, wrap-drawn, the same word the cliff uses
    for (let p = 0; p < 3; p++) {
      const py = y0 + block * (0.2 + p * 0.28) + (brand() - 0.5) * block * 0.12;
      ctx.strokeStyle = rgba(dark, 0.24 + brand() * 0.2);
      ctx.lineWidth = 4 + brand() * 7;
      for (const ox of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(ox - 4, py);
        for (let x = 0; x <= size; x += 64) {
          ctx.quadraticCurveTo(ox + x - 32, py + (brand() - 0.5) * 14, ox + x, py + (brand() - 0.5) * 9);
        }
        ctx.stroke();
      }
    }
    // and 90 dabs, one value step either side, laid along the bed
    for (let d = 0; d < 90; d++) {
      const x = brand() * size;
      const y = y0 + 5 + brand() * (block - 10);
      const len = 34 + brand() * 40;
      const ang = (brand() - 0.5) * 0.22;
      ctx.strokeStyle = rgba(brand() < 0.48 ? dark : lit, 0.18 + brand() * 0.24);
      ctx.lineWidth = 5 + brand() * 8;
      for (const ox of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(x + ox, y);
        ctx.quadraticCurveTo(
          x + ox + Math.cos(ang) * len * 0.5,
          y + Math.sin(ang) * len * 0.5 + (brand() - 0.5) * 6,
          x + ox + Math.cos(ang) * len,
          y + Math.sin(ang) * len,
        );
        ctx.stroke();
      }
    }
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.flipY = false; // block b is canvas rows [b·170, (b+1)·170]; v = 0 is the band's top
  tex.anisotropy = 4;
  return (skirtTex = tex);
}

// ONE material for all three bands and every island in the film — the tint arrives from
// the bake's own block, so `color` is white and the three slots collapse to one.
let skirtMat: THREE.MeshLambertMaterial | null = null;
function skirtMaterial(): THREE.MeshLambertMaterial {
  if (skirtMat) return skirtMat;
  const map = bakeSkirtBand();
  skirtMat = createTrilayer({
    color: map ? 0xffffff : P.earth,
    wear: 0.18,
    poster: 5, // with an albedo under it the quantizer has something to step
    stroke: { dir: 0.04, sheet: true },
  });
  if (map) skirtMat.map = map;
  skirtMat.side = THREE.DoubleSide; // a lathe band the lens can see inside of
  return skirtMat;
}

/**
 * Ramanujan's ellipse perimeter — the skirt's own ring length, in world units.
 *
 * It exists because the u-repeat below has to be a TEXEL DENSITY and not a constant. At
 * the hero/mock card (rx 2.2, rz 1.55) the ring is 11.87 u and the shipped three repeats
 * put 512·3/11.87 = 129 texels on a world unit; hard-coding that 3 on the film's 39-u
 * path ribbon island would stretch the same block to 19 texels/unit and every mark on the
 * cut edge would arrive 6.7× oversize — a smear the size of a tree where the hero has a
 * section mark. So the repeat is derived from the ring, at 3.956 u each, which is the
 * hero's own figure and therefore leaves every existing card byte-identical.
 */
const ellipseP = (rx: number, rz: number) => {
  const h = ((rx - rz) / (rx + rz)) ** 2;
  return Math.PI * (rx + rz) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
};

/** The three closed lathe bands of one island's cut edge. Three draws, ONE material. */
export function buildSkirt(rx: number, rz: number): THREE.Mesh[] {
  const k = skirtD(rz) / 0.79;
  const inset = 4 / 512;
  const reps = Math.max(3, Math.round(ellipseP(rx, rz) / 3.956));
  // ROUGHEN IS AUTHORED IN LATHE UNITS AND THE MESH IS SCALED AFTERWARDS, so a band's
  // 0.02–0.05 amplitude is 0.04–0.11 WORLD units on the hero card and 0.42–1.05 on a 21-u
  // path ribbon island — measured on screen, a sawtooth chevron a metre deep running the
  // length of the shot, with the drawn rim contour (jitter ±0.6% of a nominal ellipse)
  // floating clear of it. The hand's wobble is a fixed size because a hand is; only the
  // card grows. `min(1, …)` leaves every card up to 2.6 u byte-identical, the hero and the
  // mock included.
  const ampScale = Math.min(1, 2.6 / Math.max(rx, rz));
  return SKIRT_BANDS.map((band, i) => {
    const geom = roughen(
      new THREE.LatheGeometry(band.pts.map(([r, y]) => new THREE.Vector2(r, y * k)), 72),
      band.amp * ampScale,
      3.1,
      7 + i,
    );
    // address this band's own tint block; u repeats three times round the ring
    const uv = geom.getAttribute('uv') as THREE.BufferAttribute;
    for (let j = 0; j < uv.count; j++) {
      uv.setXY(
        j,
        uv.getX(j) * reps,
        uv.getY(j) * (1 / SKIRT_BLOCKS - inset * 2) + i / SKIRT_BLOCKS + inset,
      );
    }
    uv.needsUpdate = true;
    const mesh = new THREE.Mesh(geom, skirtMaterial());
    mesh.scale.set(rx, 1, rz);
    return mesh;
  });
}

/**
 * THE SAME CUT EDGE ALONG AN OPEN LINE — C1 for anything that is not an ellipse.
 *
 * The judgement's item 18 and item 23: the water ribbon's "both ends are cut dead, no
 * skirt, so it floats", and every flat-card class in the film needs "the hero's
 * three-band closed-lathe skirt at card scale, not a hairline rim". `buildSkirt` can
 * only lathe a closed ellipse; a river's end is a straight cut through the same three
 * beds, so the profile is re-expressed as offsets from a LINE and swept along it.
 *
 * All three bands come back as ONE geometry on the ONE shared skirt material — each
 * band's tint arrives through its own UV block, so a cut edge anywhere in the film costs
 * one draw and no new material.
 *
 * The profile is `SKIRT_BANDS`' own shape, normalised: the keel's closure to r = 0 is
 * the lathe's way of capping a disc and means nothing on a straight cut, so it tucks to
 * 0.7 of the depth instead of to the axis.
 */
const CUT_PROFILE: [number, number][][] = [
  [[0.012, 0.005], [0.038, -0.07], [-0.025, -0.158], [-0.05, -0.221]],
  [[-0.003, -0.196], [-0.048, -0.335], [-0.089, -0.475]],
  [[-0.07, -0.443], [-0.127, -0.658], [-0.278, -0.797], [-0.506, -0.899], [-0.7, -0.975], [-0.76, -1.0]],
];

export function cutSection(line: THREE.Vector3[], depth: number): THREE.Mesh {
  const parts: THREE.BufferGeometry[] = [];
  const inset = 4 / 512;
  CUT_PROFILE.forEach((prof, b) => {
    const pos: number[] = [];
    const uv: number[] = [];
    // one quad strip per profile span, swept along the line's own normal
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i];
      const c = line[i + 1];
      const nx = c.z - a.z;
      const nz = -(c.x - a.x);
      const nl = Math.hypot(nx, nz) || 1;
      const u0 = i / (line.length - 1);
      const u1 = (i + 1) / (line.length - 1);
      for (let p = 0; p < prof.length - 1; p++) {
        const [o0, y0] = prof[p];
        const [o1, y1] = prof[p + 1];
        const v0 = p / (prof.length - 1);
        const v1 = (p + 1) / (prof.length - 1);
        const q = (pt: THREE.Vector3, o: number, y: number) =>
          pos.push(pt.x + (nx / nl) * o * depth, pt.y + y * depth, pt.z + (nz / nl) * o * depth);
        const t = (u: number, v: number) =>
          uv.push(u * 2, v * (1 / SKIRT_BLOCKS - inset * 2) + b / SKIRT_BLOCKS + inset);
        q(a, o0, y0); t(u0, v0);
        q(c, o0, y0); t(u1, v0);
        q(c, o1, y1); t(u1, v1);
        q(a, o0, y0); t(u0, v0);
        q(c, o1, y1); t(u1, v1);
        q(a, o1, y1); t(u0, v1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    parts.push(g);
  });
  const mesh = new THREE.Mesh(mergeGeometries(parts, false)!, skirtMaterial());
  mesh.receiveShadow = true;
  return mesh;
}

// ---- C2 · the rim contour and its deliberate gap -----------------------------------
//
// Every finite ground object ends in an OPEN drawn arc, never a closed loop, and every
// one carries one unfinished span ≥45°. Jitter is ±0.6% radial and never more: at
// RX 2.6 a 1.75% swing was ±7 screen px of float off the paint edge.
// THE BUG THIS CLOSES, because it shipped two whole islands with no rim contour at all.
// `buildGroundCard` calls this as `rimContour(rx, rz, gap[1], gap[0])` — the drawn arc is
// the gap's COMPLEMENT, so it runs from the gap's END round to the gap's START. That is
// only an increasing sweep when the gap straddles 0°, which every `?mock=` card's gap
// happens to do ([286,74], [268,92], [300,82]). The film's two do not: S1's camp gap is
// [20,100] → (100 → 20) and S3's ribbon is [150,212] → (212 → 150). `a1 < a0`, the loop
// below never ran once, `mark([])` returned an empty LineSegments2, and C2 — an OPEN drawn
// arc on every finite ground object — was absent rather than partial on the two biggest
// islands in the film. One wrap fixes every caller at once instead of every gap by hand.
export function rimContour(rx: number, rz: number, a0: number, a1: number, hex = P.ink, y = 0.012) {
  const pts: THREE.Vector3[] = [];
  const end = a1 > a0 ? a1 : a1 + 360;
  for (let a = a0; a <= end; a += 7) {
    const t = (a * Math.PI) / 180;
    const j = 1 + (brand() - 0.5) * 0.012;
    pts.push(new THREE.Vector3(Math.cos(t) * rx * j, y, -Math.sin(t) * rz * j));
  }
  return mark(pts, hex, 'form');
}

/** An arc at a fixed radius fraction and height on the skirt — a band boundary. */
export function bandArc(rx: number, rz: number, rr: number, y: number, a0: number, a1: number) {
  const pts: THREE.Vector3[] = [];
  for (let a = a0; a <= a1; a += 6) {
    const t = (a * Math.PI) / 180;
    pts.push(new THREE.Vector3(Math.cos(t) * rx * rr, y, -Math.sin(t) * rz * rr));
  }
  return pts;
}

// ---- C3 · the ground is ONE painting ------------------------------------------------
//
// SCREEN-SPACE ARITHMETIC (the appendix's first law). 1024² tiling at 4 world units =
// 256 texels/unit. The film's figure floor is 133 screen px/unit, so 1 texel = 0.52
// screen px against the hero's 0.41 — within 27%. Every dab is therefore authored at
// 1.27× the hero's 2048² card (30–64 → 38–81 texels long, 6–14 → 8–18 wide, alpha
// unchanged). That single multiplier is the whole transfer from cover to film.
//
// THE ONE CHANGE FROM THE HERO: the hero biases lit tips toward the key quarter with
// `litBias` (hero.ts:444). A TILING sheet cannot carry a key direction — it would
// repeat the sun every 4 units — so litBias is dropped and lit tips distribute evenly.
// The key direction arrives from the actual key light and from the incident card's
// contact blobs, which is where it belongs.
let groundSheet: THREE.CanvasTexture | null | undefined;

export function bakeGroundSheet(): THREE.CanvasTexture | null {
  if (groundSheet !== undefined) return groundSheet;
  if (typeof document === 'undefined') return (groundSheet = null);
  const t0 = performance.now();
  const size = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;

  // the base is one step up from raw grass. The judgement: the mock's drawn state is
  // "denser than the island's own ground in the same frame — the mock's card is close to a
  // solid tone field where the island's still shows paper. Same class, two tiers." Drawn
  // tier is computed from the ALBEDO's luminance, so the only lever is the albedo: the
  // fill goes up a quarter step toward grassLit and the dab tone leans the same way.
  ctx.fillStyle = css(mixHex(P.grass, GRASS_LIT, 0.25));
  ctx.fillRect(0, 0, size, size);

  // a mark near an edge is redrawn at the wrapped position, so the tile has no seam
  const wrapDraw = (x: number, y: number, m: number, fn: (px: number, py: number) => void) => {
    for (const dx of [0, size, -size]) {
      for (const dy of [0, size, -size]) {
        const px = x + dx;
        const py = y + dy;
        if (px < -m || px > size + m || py < -m || py > size + m) continue;
        fn(px, py);
      }
    }
  };

  // 9 CLUSTERED meadow clumps × 7 ellipses. Not random soft ellipses: the P4 verify
  // round read those as airbrush clouds and their accidental radial spread as a
  // concave ring. Clumps sit anywhere; their tone leans on position.
  //
  // WALKED, AND CHANGED: the hero's 4-shadow/5-mid split reads on a 2048² card because
  // the lantern pool, the path and eight contact blobs supply the rest of its tonal
  // structure. On a ground-ONLY sheet the same split renders as one even green — the
  // ground card and the incident card were split apart and the mass went with the
  // incident card. So the sheet takes the masses back: three shadow clumps at
  // committed alpha and two LIT clumps, which the hero never needed and this does,
  // giving the meadow a light mass and a dark mass before a single dab lands.
  // ---- FIX ROUND, ITEM 22 — THE LARGE-SCALE VALUE FIELD ---------------------------
  //
  // "The dab field has NO large-scale value structure — uniform size, uniform direction,
  // uniform density edge to edge. It is a wallpaper. The island's top has a dark passage
  // and a dirt patch."
  //
  // The nine clumps below were meant to supply that and could not, because they are
  // discrete masses laid UNDER a dab field that then ran at one density over the whole
  // canvas and averaged them away. The structure has to be in the DABS. `field()` is one
  // low-frequency function of position, wrapping exactly at the tile edge (every term is
  // an integer multiple of 2π/size, so the sheet still has no seam), and it drives four
  // things at once: which tone a dab takes, how long it is, how wide, and how many land
  // there. That is a meadow with a dark passage and a lit rise in it rather than an even
  // green — the same thing the island's own 2048² card gets from being unique.
  const field = (x: number, y: number) =>
    0.5 +
    0.3 * Math.sin((2 * Math.PI * x) / size + 0.7) * Math.cos((2 * Math.PI * y) / size - 1.2) +
    0.2 * Math.sin((4 * Math.PI * y) / size + 2.1) * Math.cos((2 * Math.PI * x) / size + 0.3);
  // ---- FIX ROUND, F6 — THE SECOND SCALE ------------------------------------------
  //
  // "The 42-unit ribbon island carries one dab size, one direction and one density from
  // edge to edge, so at S3's framing the ground reads as burlap."
  //
  // `field()` above already varies tone, length, angle and density — but all four ride ONE
  // function whose length term swings only 0.75→1.35, a 1.8× spread, and the sheet tiles
  // every 4 u, so a 42-u island shows the same 1.8× spread ten and a half times. A weave
  // is precisely a fine texture at one scale repeated on a pitch, and that is what came out.
  //
  // C3 says there is ONE `bakeGroundSheet`. It does not say every square unit of it looks
  // the same, and the hero's own 2048² field does not: it has a lantern pool, open trodden
  // ground and passages of long grass at three different scales. A tiling sheet cannot be
  // unique, but it CAN carry more than one scale, and two scales is what stops a repeat
  // reading as a weave — the eye locks onto a pitch it can find in one glance, and it
  // cannot find one when the marks in a patch differ by 5× from the marks two patches over.
  //
  // `scaleF` is a second low-frequency function on its own phases (still an exact integer
  // multiple of 2π/size, so the tile is still seamless) driving dab length and width over
  // **0.42 → 2.30, a 5.5× spread**, independently of the tone field. Where the two agree
  // the sheet gets a passage of long dark grass; where they disagree it gets short pale
  // stubble; and the rejection term below now bottoms out near zero, so some of the sheet
  // is OPEN GROUND with the base fill showing — bare passages break a weave better than
  // more marks do, and they are what a path-side meadow actually looks like.
  const scaleF = (x: number, y: number) =>
    0.5 +
    0.34 * Math.sin((2 * Math.PI * y) / size - 0.4) * Math.cos((2 * Math.PI * x) / size + 2.4) +
    0.16 * Math.cos((4 * Math.PI * x) / size + 1.1);

  const clumpTone = [2, 2, 2, 1, 1, 1, 1, 0, 0]; // 2 shade · 1 mid · 0 lit
  for (let c = 0; c < 9; c++) {
    const cx = brand() * size;
    const cy = brand() * size;
    const cr = 100 + brand() * 130;
    const band = clumpTone[c];
    for (let i = 0; i < 7; i++) {
      const a = brand() * 6.3;
      const rr = brand() * cr * 0.7;
      const r = 33 + brand() * 56;
      ctx.fillStyle = rgba(
        band === 2 ? (brand() < 0.6 ? GRASS_SHADE : P.grassDeep)
          : band === 1 ? (brand() < 0.5 ? P.grassDeep : P.undergrowth)
            : brand() < 0.5 ? GRASS_LIT : P.grass,
        0.42 + brand() * 0.3,
      );
      wrapDraw(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r * 1.3, (px, py) => {
        ctx.beginPath();
        ctx.ellipse(px, py, r, r * (0.45 + brand() * 0.35), -0.35 + brand() * 0.7, 0, 6.3);
        ctx.fill();
      });
    }
  }

  // 2000 curved dabs — a loaded brush pulled and lifted, never a plotted tick — in
  // THREE separated value tiers a luminance sample can pull apart. Drawn tiers 4/3/1,
  // a three-band span, which is why this ground reads as a drawing under the curtain
  // and a flat fill does not.
  ctx.lineCap = 'round';
  // 1 500, not 2 000 — the judgement measured `bakeGroundSheet` at 12.5 ms against a
  // ≤12 ms budget (item 35), and the dab loop is essentially the whole cost: each dab is
  // a `quadraticCurveTo` stroke re-issued at up to nine wrapped positions. Cutting a
  // quarter of them brings the bake under budget, and the value field below more than
  // pays back the density where it matters, because 1 500 dabs with structure read as
  // more paint than 2 000 without it.
  // one dab, so the fine pass and the coarse pass below are the same hand at two scales
  const dab = (x: number, y: number, len: number, wide: number, ang: number, hex: number, a: number) => {
    ctx.strokeStyle = rgba(hex, a);
    ctx.lineWidth = wide;
    const bx = (brand() - 0.5) * len * 0.22;
    const by = (brand() - 0.5) * len * 0.22;
    wrapDraw(x, y, len + 20, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(
        px + Math.cos(ang) * len * 0.5 + bx,
        py + Math.sin(ang) * len * 0.5 + by,
        px + Math.cos(ang) * len,
        py + Math.sin(ang) * len,
      );
      ctx.stroke();
    });
  };
  const toneOf = (t: number) =>
    t < 0.3 ? GRASS_SHADE : t < 0.54 ? P.grassDeep : t < 0.8 ? P.undergrowth : GRASS_LIT;

  for (let i = 0; i < 1360; i++) {
    const x = brand() * size;
    const y = brand() * size;
    const f = field(x, y);
    // REJECTION SAMPLING is what puts density into the field: a dab in the lit rise is
    // dropped more often than one in the dark passage, so the meadow gathers weight
    // where the large-scale value says it should. The floor is now 0.16 rather than 0.45,
    // so the lit rises come out as genuinely OPEN ground with the base fill showing —
    // that is the fourth thing `field()` drives and the one it was not driving hard enough.
    if (brand() > 0.16 + f * 1.05) continue;
    // and the LENGTH and the DIRECTION follow it too — a passage of longer strokes
    // leaning one way against a passage of shorter ones leaning another is what stops a
    // dab field reading as a texture and starts it reading as ground. Length now rides
    // `scaleF`, NOT `field`, so scale and value are independent and their beat is longer
    // than either one alone.
    const s = 0.42 + scaleF(x, y) * 1.88;
    const len = (26 + brand() * 40) * s;
    const ang = -0.32 + Math.sin(x * 0.006 + y * 0.004) * 0.35 + (f - 0.5) * 0.5 + (brand() - 0.5) * 0.26;
    // the tone leans on the field, not on a flat roll: dark clumps get their shade dabs,
    // lit rises get their pale ones, and the mid tiers cover the ground between
    const tone = brand() * 0.55 + (1 - f) * 0.45 + 0.08;
    dab(x, y, len, (6 + brand() * 8) * Math.sqrt(s), ang, toneOf(tone), 0.5 + brand() * 0.34);
  }

  // THE COARSE PASS — 85 long sweeps, about 2.4× the fine pass's own length, laid ONLY in
  // the dark passages (`f < 0.46`) and along the same angle function, so they are the same
  // family and never a crossed second. This is the "fewer, bigger" half of the sheet: at
  // 256 texels/unit a 150–270-texel sweep is 0.59–1.05 world units, 45–81 screen px at the
  // film's wide framing, which is a stroke the eye reads as a stroke instead of as grain.
  // One island then carries marks from 8 px to 81 px and a weave has no pitch to find.
  //
  // WHY 150–270 AND NOT THE 190–360 THIS ROUND FIRST TRIED: the same sheet tiles onto a
  // 6.6-u `?mock=ground` card and onto the 42-u ribbon. Walked at `?mock=ground&zoom=4`
  // beside the hero island, a 1.4-u sweep crosses a fifth of the small card and the two
  // cards stop reading as one hand — which is the route's own question. At 1.05 u it is
  // 16 % of the mock card and 2.5 % of the ribbon, and both still carry two scales.
  for (let i = 0; i < 85; i++) {
    const x = brand() * size;
    const y = brand() * size;
    const f = field(x, y);
    if (f > 0.46) continue;
    const len = (150 + brand() * 120) * (0.7 + scaleF(x, y) * 0.6);
    const ang = -0.32 + Math.sin(x * 0.006 + y * 0.004) * 0.35 + (f - 0.5) * 0.5 + (brand() - 0.5) * 0.18;
    dab(x, y, len, 8 + brand() * 10, ang, brand() < 0.55 ? P.grassDeep : GRASS_SHADE, 0.26 + brand() * 0.2);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  groundSheet = tex;
  if (typeof console !== 'undefined') {
    console.info('[mock] bakeGroundSheet 1024²', (performance.now() - t0).toFixed(1), 'ms');
  }
  return tex;
}

// One ground painting, one material — §11.6's `groundCard` slot. `sheet: false`: the
// ground IS the sheet, so it takes no view-plane stroke basis of its own.
let groundMat: THREE.MeshLambertMaterial | null = null;
function groundMaterial(): THREE.MeshLambertMaterial {
  if (groundMat) return groundMat;
  const map = bakeGroundSheet();
  groundMat = createTrilayer({
    color: map ? 0xffffff : P.grass,
    wear: 0.22,
    feather: 0.012,
    ground: true, // the island card is the ONE surface page furniture prints on
    stroke: { dir: 0.61, sheet: false },
  });
  if (map) groundMat.map = map;
  return groundMat;
}

/** 4 world units per repeat = 256 texels/unit, applied in the geometry. */
export function tileUV(geom: THREE.BufferGeometry, rx: number, rz: number): void {
  const uv = geom.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) - 0.5) * ((2 * rx) / 4) + 0.5, (uv.getY(i) - 0.5) * ((2 * rz) / 4) + 0.5);
  }
  uv.needsUpdate = true;
}

/** A bare ground disc on the shared meadow painting — no skirt, no page shadow. */
export function groundDisc(rx: number, rz: number, segments = 64): THREE.Mesh {
  const geom = new THREE.CircleGeometry(1, segments);
  tileUV(geom, rx, rz);
  const mesh = new THREE.Mesh(geom, groundMaterial());
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(rx, rz, 1);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * THE PAGE DROP SHADOW ON ITS OWN, for a finite object that is not a ground card.
 *
 * The judgement's item 3: the cliff "floats on the page, in both rigs, at every
 * framing" — because `buildIsland` is the only thing in the film that mints a page
 * shadow and strata never calls it. Rather than re-derive islandKit's shader (a second
 * copy of the one material state that decides whether a drawing casts) this borrows the
 * real one and throws the card away, so there is exactly ONE page-shadow shader in the
 * film and it still rides `curtain` and `rig.seamX` by identity: a drawing casts none.
 */
export function pageShadow(rx: number, rz: number): THREE.Mesh {
  const isle = buildIsland({ radiusX: rx, radiusZ: rz });
  isle.root.remove(isle.ground);
  isle.ground.geometry.dispose();
  (isle.ground.material as THREE.Material).dispose();
  isle.root.remove(isle.shadow);
  return isle.shadow;
}

export interface GroundCard {
  root: THREE.Group;
  rx: number;
  rz: number;
  k: number;
  card: THREE.Mesh;
}

/**
 * One island: the ground card on the C1 skirt, its rim contour with an authored gap,
 * three strata boundary arcs and the section cut marks — the base every stage sits on.
 *
 * `gap` is the unfinished span in degrees, [from, to]; the drawn arc is its complement.
 */
export function buildGroundCard(
  rx: number,
  rz: number,
  { gap = [286, 74] as [number, number], marks = true } = {},
): GroundCard {
  const root = new THREE.Group();
  const k = skirtD(rz) / 0.79;

  const island = buildIsland({ radiusX: rx, radiusZ: rz, feather: 0.012 });
  // buildIsland mints its own material per card; the film's twelve islands share one
  // painting, so the card takes the shared groundCard material instead.
  (island.ground.material as THREE.Material).dispose();
  island.ground.material = groundMaterial();
  // 4 world units per repeat = 256 texels/unit. The repeat lives in the GEOMETRY, not
  // in texture.repeat: one texture object serves every island size, and a per-card
  // repeat would need a per-card texture clone for no gain.
  tileUV(island.ground.geometry, rx, rz);

  island.shadow.position.y = -0.79 * k - 0.19;
  island.shadow.scale.set(rx * 1.32, rz * 1.32, 1);
  root.add(island.root);
  for (const band of buildSkirt(rx, rz)) root.add(band);

  // the rim contour: an open stroke that STOPS BEING DRAWN, never a closed loop
  root.add(rimContour(rx, rz, gap[1], gap[0], P.ink, 0.012 * k));

  if (marks) {
    // three strata boundary contours, proud of the lathe radius — drawn at the true
    // radius roughen() swallows the line (hero.ts:1580)
    const runs: THREE.Vector3[][] = [
      bandArc(rx, rz, 0.985, -0.15 * k, 12, 172),
      bandArc(rx, rz, 0.975, -0.36 * k, 20, 166),
    ];
    // section cut marks: short downward strokes carrying the section down the shelf
    // into the keel top. They live on the stone shelf's MID value — ink dies on the
    // caveDark keel — and their tails just enter the dark. 'form', never 'faint':
    // faint vanished on the skirt's mid values.
    for (let a = 14; a <= 170; a += 13) {
      const t = (a * Math.PI) / 180;
      const j = 0.9 + brand() * 0.2;
      runs.push([
        new THREE.Vector3(Math.cos(t) * rx * 0.965, (-0.16 - 0.06 * j) * k, -Math.sin(t) * rz * 0.965),
        new THREE.Vector3(Math.cos(t) * rx * 0.86, (-0.38 - 0.1 * j) * k, -Math.sin(t) * rz * 0.86),
      ]);
    }
    // INK, not graphiteDark. Walked at zoom 3 beside the hero: graphiteDark #4A4844 at
    // 'form' on the shelf's own mid value (stoneShelf, luma 124) reads as pale
    // scratches — the section vanishes and the skirt renders as two smooth plastic
    // bands. The hero draws these in ink on its painted quadrant for exactly this
    // reason and the value gap is why. Under Prep an ink section line on a graphite
    // drawing is a hard pencil over a soft one, which is what a section IS.
    root.add(strokeSet(runs, P.ink, 'form'));
  }

  return { root, rx, rz, k, card: island.ground };
}

// ---- C8/C9 · the incident card ------------------------------------------------------
//
// One per island, 512² unique, and only FIVE things may go on it: the path ribbon, the
// two cart ruts, the rubbed landing patch, the painted contact blobs, one repair patch.
// If a mark is not traffic, contact or repair it belongs to the sheet or to geometry.
//
// The card is the ground circle at 0.985 scale, +0.006 y, `ground: false` so the page
// grid prints ONCE. Everything not painted is transparent: the meadow shows through.
export interface IncidentOpts {
  /** z of the path spine as a function of x in card-local units, or null for no path. */
  spine?: ((x: number) => number) | null;
  /** contact blobs, [x, z, hero-radius, alpha] at the hero's 394 texels/unit (C9). */
  blobs?: [number, number, number, number][];
  /**
   * false: the C9 blobs only — no ruts, no landing patch, no repair patch.
   *
   * NOTE, and it is a real limit of the class rather than a knob: with `spine: null` AND
   * `wear: false` the bake comes out 100 % TRANSPARENT except for the blobs, and a C9 α is
   * then spent as a render-time OPACITY rather than as the ALBEDO-MIX fraction it is. Only
   * the second can move `triTone`/`triTier`, which is what carries a contact on both sides
   * of the curtain. Measured at S7 t58.5 (`sets/cliffWorld.ts`): such a card moved the
   * cairn foot by 0.0003 of linear luminance — nothing.
   */
  wear?: boolean;
  /**
   * The bake's edge, in texels. 512 is row 2's own figure and the default, and it holds
   * the row's 14–39 texels/unit band for every card up to rx ≈ 18. S3's path ribbon
   * island is 39 u across, where 512 lands 13.1 texels/unit — outside the band, and the
   * C9 contact blobs come out two texels wide, which is not a contact blob. That one card
   * asks for 1024 (26.9 texels/unit, inside the band); nothing else in the film does.
   */
  size?: number;
}

/**
 * THE PATH'S HALF-WIDTH at station `x` on side `side` — module scope on purpose.
 *
 * The bake fills the ribbon between these two curves and `buildIncidentCard` draws its
 * two edges from the SAME function, so the drawn line is the painted edge rather than a
 * line near it. Three harmonics at unequal amplitude and a different phase per side, so
 * the two edges are never parallel anywhere: that is the whole of item 15.
 */
const pathHalf = (x: number, side: number) =>
  0.26 *
  (1 +
    0.3 * Math.sin(x * 1.7 + side * 2.1) +
    0.17 * Math.sin(x * 3.3 - side * 0.9) +
    0.1 * Math.sin(x * 6.1 + side * 1.4));

// The three wear marks' own geometry, shared by the bake and by the drawn pass, so a
// mark cannot exist in one state and not the other. THIS IS ITEM 16: "land the three
// wear marks or delete them from row 2. They were invisible in all four of my captures."
// They were painted at 0.30–0.52 alpha over a meadow that carries its own dabs at the
// same tier, which is within a few percent of not existing. Painted alpha is now
// committed AND each of the three carries an authored contour, because a mark that has
// to survive twelve islands and both sides of the curtain cannot rely on alpha alone.
const RUT_BEARING = -0.95;
const RUT_GAUGE = 0.11;
const LANDING = [0.34, -0.42] as const; // as fractions of rx, rz
const REPAIR = [-0.46, 0.4] as const;

export function bakeIncidentCard(
  rx: number,
  rz: number,
  { spine = (x: number) => 0.15 + 0.35 * Math.sin((x - 0.4) * 0.85), blobs = [], wear = true, size = 512 }: IncidentOpts = {},
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const ux = (x: number) => ((x / rx + 1) / 2) * size;
  const vz = (z: number) => ((-z / rz + 1) / 2) * size;
  // this card's texels/unit, and the C9 ledger's scale factor off the hero's 394
  const tpu = size / (2 * rx);
  const c9 = tpu / 394;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (spine) {
    // 1 · THE PATH.
    //
    // ============ FIX ROUND — ITEM 15, AND IT IS THE v1 SIGNATURE ================
    //
    // "The path is a smooth, hard-edged, perfectly parallel brown stripe — 'ruled
    // analytic stripe plus gradient wash', the precise v1 signature the client rejected."
    // It was, and the cause is that every pass below used ONE spine at a CONSTANT
    // offset, so the two edges of the ribbon were parallel curves by construction and no
    // amount of alpha could break them.
    //
    // `edgeRun` gives each side its own wandering half-width — three harmonics, unequal,
    // different phases per side — so the ribbon narrows and widens the way a worn track
    // does and its two edges are never parallel anywhere along it. The band is then
    // filled as a POLYGON between those two edges rather than stroked at a fixed width,
    // which is what makes an irregular width possible at all.
    const half = pathHalf;
    const edge = (side: number, grow: number) => {
      const pts: [number, number][] = [];
      for (let x = -rx * 1.12; x <= rx * 1.12; x += 0.12) {
        pts.push([ux(x), vz(spine(x) + side * (half(x, side) + grow))]);
      }
      return pts;
    };
    const ribbon = (grow: number, hex: number, a: number) => {
      const top = edge(-1, grow);
      const bot = edge(1, grow).reverse();
      ctx.beginPath();
      ctx.moveTo(top[0][0], top[0][1]);
      for (const [px, py] of top.slice(1)) ctx.lineTo(px, py);
      for (const [px, py] of bot) ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fillStyle = rgba(hex, a);
      ctx.fill();
    };
    ribbon(0.07, P.earth, 0.55); // the verge, wider and softer
    ribbon(0, P.earthTrack, 1); // the track itself

    // ITEM 15's second half — "lay dabs across it". 120 short marks ACROSS the ribbon's
    // own width, in the path's own three tokens. A track is not a fill: it is where
    // hundreds of feet have taken the grass off, and every one of them is a mark.
    for (let d = 0; d < 120; d++) {
      const x = -rx * 1.08 + brand() * rx * 2.16;
      const w = half(x, brand() < 0.5 ? -1 : 1);
      const off = (brand() - 0.5) * 2 * w;
      const z0 = spine(x) + off;
      const roll = brand();
      const hex = roll < 0.34 ? TRACK_SHADE : roll < 0.7 ? P.earthTrack : EARTH_LIT;
      const len = (0.1 + brand() * 0.16) * tpu;
      const ang = 1.2 + (brand() - 0.5) * 0.8; // across the run, never along it
      ctx.strokeStyle = rgba(hex, 0.24 + brand() * 0.3);
      ctx.lineWidth = 0.035 * tpu + brand() * 0.03 * tpu;
      ctx.beginPath();
      ctx.moveTo(ux(x) - Math.cos(ang) * len * 0.5, vz(z0) - Math.sin(ang) * len * 0.5);
      ctx.lineTo(ux(x) + Math.cos(ang) * len * 0.5, vz(z0) + Math.sin(ang) * len * 0.5);
      ctx.stroke();
    }
    // a lit crown down the middle of the band: the ladder's tier-1 rung, without which
    // the ribbon is two values and reads as a stripe. It wanders too.
    ctx.beginPath();
    for (let x = -rx * 1.05; x <= rx * 1.05; x += 0.15) {
      const px = ux(x);
      const py = vz(spine(x) - 0.05 + Math.sin(x * 2.2) * 0.05);
      if (x <= -rx * 1.04) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = rgba(EARTH_LIT, 0.42);
    ctx.lineWidth = 0.16 * tpu;
    ctx.stroke();
  }

  // 2 · TWO CART RUTS entering at the rim and STOPPING at 0.55 R with a drybrushed
  // stop, never a fade (C8). Tier-4 lines: trackShade.
  //
  // ON THEIR OWN BEARING, not the path's. Walked beside the hero: laid along the same
  // spine they vanished into the track ribbon that already owns that ground, and the
  // island lost the one mark that says somebody arrives here. They come in across the
  // near rim instead, at 62° to the path — a second approach, worn by one visitor
  // rather than by traffic, which is the whole point of C8.
  if (wear) {
    const a = RUT_BEARING; // bearing, radians, measured off +x
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    for (const s of [-1, 1]) {
      const ox = -dz * RUT_GAUGE * s;
      const oz = dx * RUT_GAUGE * s;
      ctx.beginPath();
      for (let u = 0; u <= 1.0001; u += 0.05) {
        // rim → 0.55 R, in ELLIPSE coordinates so "the rim" means the rim
        const t = 1 - u * 0.45;
        ctx.lineTo(ux(dx * rx * t + ox), vz(dz * rz * t + oz));
      }
      // 0.82α and 0.1 u wide, up from 0.50 and 0.07 — item 16. At the old numbers a rut
      // measured within a few percent of the meadow dabs it crosses and the judgement
      // could not find it in four captures at two zooms in either rig.
      ctx.strokeStyle = rgba(TRACK_SHADE, 0.82);
      ctx.lineWidth = 0.1 * tpu;
      ctx.stroke();
      // the drybrushed stop: three lifting flecks, never a gradient
      for (let i = 0; i < 3; i++) {
        const t = 0.55 - i * 0.028;
        ctx.fillStyle = rgba(TRACK_SHADE, 0.34 - i * 0.1);
        ctx.beginPath();
        ctx.ellipse(ux(dx * rx * t + ox), vz(dz * rz * t + oz), 0.06 * tpu, 0.026 * tpu, a, 0, 6.3);
        ctx.fill();
      }
    }
  }

  // 3 · THE RUBBED LANDING PATCH, r 0.5 u, mix(earthTrack, earth, .5) @0.30α with six
  // committed earth dabs. The mark that makes twelve islands read as one commute.
  if (wear) {
    const lx = rx * LANDING[0];
    const lz = rz * LANDING[1];
    // 0.52α, walked up from the row's 0.30: at 0.30 a rubbed patch of
    // mix(earthTrack, earth, .5) over the meadow's own tier-2/3 dabs measured as one
    // more dab and the landing read as nothing at all. It is the film's most repeated
    // mark and it has to survive the ground it is rubbed into.
    // 0.74α, walked up again from 0.52 for item 16 — it is the film's most repeated mark
    // and it has to survive the ground it is rubbed into
    ctx.fillStyle = rgba(mixHex(P.earthTrack, P.earth, 0.5), 0.74);
    ctx.beginPath();
    ctx.ellipse(ux(lx), vz(lz), 0.5 * tpu, 0.5 * tpu * 0.72, 0.25, 0, 6.3);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = brand() * 6.3;
      const r = brand() * 0.4;
      ctx.fillStyle = rgba(P.earth, 0.7 + brand() * 0.25);
      ctx.beginPath();
      ctx.ellipse(
        ux(lx + Math.cos(a) * r),
        vz(lz + Math.sin(a) * r * 0.7),
        (0.06 + brand() * 0.05) * tpu,
        (0.03 + brand() * 0.03) * tpu,
        -0.32 + brand() * 0.6,
        0,
        6.3,
      );
      ctx.fill();
    }
  }

  // 5 · ONE REPAIR PATCH, exactly one value step off its ground — a square of turf put
  // back. One whisper of history per island, never captioned.
  if (wear) {
    const px = rx * REPAIR[0];
    const pz = rz * REPAIR[1];
    ctx.save();
    ctx.translate(ux(px), vz(pz));
    ctx.rotate(0.22);
    // one value step off its ground — grassDeep t3 against the sheet's grass t2 — and
    // 0.78 × 0.52 u, walked up from 0.6 × 0.4. Turf that was lifted and put back is a
    // spade's width, and below about 0.7 u it reads as a stain instead of an edit.
    ctx.fillStyle = rgba(P.grassDeep, 0.88);
    ctx.fillRect(-0.39 * tpu, -0.26 * tpu, 0.78 * tpu, 0.52 * tpu);
    ctx.strokeStyle = rgba(GRASS_SHADE, 0.6);
    ctx.lineWidth = 0.025 * tpu;
    ctx.strokeRect(-0.39 * tpu, -0.26 * tpu, 0.78 * tpu, 0.52 * tpu);
    ctx.restore();
  }

  // 4 · THE PAINTED CONTACT BLOBS — the C9 ledger, authored at the hero's 394
  // texels/unit and scaled by this card's own. Painted props ground; drawings never do.
  //
  // A BLOB IS A CIRCLE IN THE WORLD, NOT IN THE CANVAS. The canvas is square and the card
  // is not: `ux` divides by `rx` and `vz` by `rz`, so this card carries `size/(2·rx)`
  // texels per unit ACROSS and `size/(2·rz)` ALONG. On S3's ribbon (rx 21, rz 5.2, 1024²)
  // that is 24.38 and 98.46 — a 4.04 : 1 anisotropy — and a blob drawn with `arc()` at one
  // radius came out as a world-space ELLIPSE **four times narrower in z than in x**: the
  // chest's 46 landed 0.117 u across and 0.029 u deep, a thin east–west smear under a
  // 0.60 × 0.38 u prop, and each coin's 0.028 × 0.007 u. That is why the wired card read
  // as no grounding at all. Both radii are taken from the ledger's ONE world radius, so
  // the blob is round on the ground wherever the card's aspect goes. `ctx.ellipse` and a
  // gradient in a scaled frame, because a canvas radial gradient is circular by
  // construction and would otherwise stay round in texels while the fill went oval.
  const c9z = tpu * (rx / rz) / 394; // texels per hero-texel along z
  for (const [x, z, r, a] of blobs) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * c9);
    g.addColorStop(0, rgba(P.caveDark, a));
    g.addColorStop(1, rgba(P.caveDark, 0));
    ctx.save();
    ctx.translate(ux(x), vz(z));
    ctx.scale(1, c9z / c9);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * c9, 0, 6.3);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  // ============ flipY = false, AND IT IS THE C9 BLOCKER =============================
  //
  // `CanvasTexture` flips v by default, which MIRRORS this card in z against the
  // geometry it is laid on, and that single default is why "S7's grounding contributes
  // nothing". The bake writes canvas row `vz(z) = ((−z/rz + 1)/2)·size`, so z = +rz is
  // row 0; the card is a `CircleGeometry` turned by `rotation.x = −π/2`, which sends
  // local +y (uv.y = 1) to world −z. With the flip ON, uv.y = 1 samples row 0 — the row
  // authored for z = +rz — so every blob renders at MINUS its authored z.
  //
  // Measured live at S7 t58.2, on/off A/B of the tended card against the framebuffer,
  // mean linear-luminance depression over a disc of the blob's own radius:
  //
  //   cairn at its AUTHORED (0.17, +0.48)   depression  0.0001
  //   cairn at the MIRRORED (0.17, −0.48)   depression  0.0374
  //
  // The blob was never missing. It was 0.96 u away, on the other side of the card, and
  // that is why five correct eliminations (right card · right UV scale · right bake ·
  // texture carries the blobs · not occlusion, since an opaque map darkens the same disc
  // by 0.1427) all missed it: every one of them tested the canvas or the mesh, and the
  // fault is in the v orientation BETWEEN them. `bakeStrataBand` carries the identical
  // note for the identical trap; this bake never got it.
  //
  // THE FIX IS FILM-WIDE AND IT CLOSES A SECOND DEFECT. `buildIncidentCard` draws the
  // path's two edges, the ruts, the landing ring and the repair patch from the SAME
  // functions in world coordinates, unmirrored — so on all twelve islands the painted
  // ribbon has been sitting at −z of the drawn ribbon that is supposed to be its own
  // edge. With the flip off, v = 0 is row 0 is z = +rz, the painting lands under its
  // drawing, and every C9 blob lands under its prop.
  tex.flipY = false;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

/**
 * The incident card: the painted layer AND the drawn one.
 *
 * ============ FIX ROUND — ITEM 14, THE CLASS'S REAL FAILURE ======================
 *
 * "At judge-incident-1444x711-prep-z5.jpg the incident card is INDISTINGUISHABLE from
 * the plain ground card in prep. Row 2 says 'Path draws as a three-band ribbon'. It
 * draws as nothing."
 *
 * It could not draw, and the reason is arithmetic rather than taste. The drawn tier is
 * computed from the ALBEDO's encoded luminance (`trilayer.ts` triTone), and this card's
 * three path tokens sit at 0.549 (`earthTrack`), 0.632 (`earthLit`) and 0.470
 * (`trackShade`) against the meadow's own 0.626 — so `earthTrack` and the grass it
 * crosses quantize into the SAME tier and the ribbon simply is not there once the paint
 * drains. The judgement offers two answers: push the tokens apart, or "draw the ribbon's
 * two edges as authored strokes". The second is taken, because pushing a token apart to
 * satisfy the quantizer means choosing a colour for a reason that has nothing to do with
 * colour — and because a path on a map IS drawn.
 *
 * So this returns a GROUP: the painted card, plus one merged stroke set carrying the
 * path's two edges, the two cart ruts, the landing patch and the repair patch. Six runs,
 * ONE draw, and every one of them is sampled from the same function the bake filled —
 * the drawn edge is the painted edge, not a line near it.
 */
export function buildIncidentCard(
  rx: number,
  rz: number,
  opts: IncidentOpts = {},
): THREE.Object3D {
  const group = new THREE.Group();
  const map = bakeIncidentCard(rx, rz, opts);
  const mat = createTrilayer({
    color: map ? 0xffffff : P.earth,
    wear: 0.22,
    feather: 0.052, // +0.04 over the ground card's 0.012
    ground: false, // so the page grid prints ONCE
    stroke: { dir: 0.61, sheet: false },
  });
  if (map) mat.map = map;
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(rx * 0.985, rz * 0.985, 1);
  mesh.position.y = 0.006;
  mesh.renderOrder = 1; // above the ground card in the transparent pass
  mesh.receiveShadow = true;
  group.add(mesh);

  // ---- the drawn half ------------------------------------------------------------
  const y = 0.014; // above the card, under anything standing on it
  const runs: THREE.Vector3[][] = [];
  const spine = opts.spine === undefined
    ? (x: number) => 0.15 + 0.35 * Math.sin((x - 0.4) * 0.85)
    : opts.spine;

  if (spine) {
    // the ribbon's two edges, sampled from `pathHalf` — the same curve the bake filled.
    //
    // CLIPPED TO THE CARD, and on an elongated island that is not a nicety. The sample
    // used to run x ∈ [−1.02 rx, +1.02 rx] at the spine's own z, which on a round card
    // overshoots by a whisker and on S3's 42 × 10.4 ribbon walks the drawn path line
    // several units out into bare paper at both ends — the card has no width left there.
    // The bake already stops at the card's alpha; the drawn half now stops with it, and
    // the run BREAKS rather than bridging, so a path that leaves the island leaves it in
    // two pieces like anything else drawn on this page.
    for (const side of [-1, 1] as const) {
      let pts: THREE.Vector3[] = [];
      const step = Math.min(rx * 0.13, 0.9);
      for (let x = -rx; x <= rx; x += step) {
        const z = spine(x) + side * pathHalf(x, side);
        if ((x / rx) ** 2 + (z / rz) ** 2 <= 0.97 ** 2) {
          pts.push(new THREE.Vector3(x, y, z));
        } else if (pts.length) {
          runs.push(pts);
          pts = [];
        }
      }
      if (pts.length) runs.push(pts);
    }
  }
  // the two cart ruts, on their own bearing across the near rim, stopping at 0.55 R
  if (opts.wear !== false) {
    const dx = Math.cos(RUT_BEARING);
    const dz = Math.sin(RUT_BEARING);
    for (const s of [-1, 1] as const) {
      const ox = -dz * RUT_GAUGE * s;
      const oz = dx * RUT_GAUGE * s;
      const pts: THREE.Vector3[] = [];
      for (let u = 0; u <= 1.0001; u += 0.2) {
        const t = 1 - u * 0.45;
        pts.push(new THREE.Vector3(dx * rx * t + ox, y, dz * rz * t + oz));
      }
      runs.push(pts);
    }
  }
  // the landing patch's own edge, and the repair patch's four corners — two more marks,
  // and between them the three wear marks of C8 now exist on both sides of the curtain
  if (opts.wear !== false) {
    const lx = rx * LANDING[0];
    const lz = rz * LANDING[1];
    const ring: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = 0.25 + (i / 12) * Math.PI * 2;
      const j = 1 + (brand() - 0.5) * 0.16; // a rubbed patch has no clean edge
      ring.push(new THREE.Vector3(lx + Math.cos(a) * 0.5 * j, y, lz + Math.sin(a) * 0.36 * j));
    }
    runs.push(ring);
    const px = rx * REPAIR[0];
    const pz = rz * REPAIR[1];
    const c = Math.cos(0.22);
    const s = Math.sin(0.22);
    const corner = (u: number, v: number) =>
      new THREE.Vector3(px + u * c - v * s, y, pz + u * s + v * c);
    runs.push([corner(-0.39, -0.26), corner(0.39, -0.26), corner(0.39, 0.26), corner(-0.39, 0.26), corner(-0.39, -0.26)]);
  }
  if (runs.length) group.add(strokeSet(runs, P.graphiteDark, 'form'));
  return group;
}

/**
 * THE PROP GROUND — the judgement's item 33, answered inside the mock modules.
 *
 * "Prove grounding: give MockSheet a ground card under the mock and hand markCaster to
 * buildMock(), then re-check the contact blob on foliage, bark, timber, plank, metal,
 * glass, cloth, fire and marks. C9 is unproven for every one of them."
 *
 * `MockSheet.tsx` belongs to another workflow and `rigs.markCaster` is per-rig and owned
 * by the route, so neither half of that sentence can be done where it was written. Both
 * can be done HERE, and arguably should be: a class that needs a ground to be judged
 * should build the ground it needs, exactly as `rock`, `field` and `incident` already
 * do. Nine classes now stand on one, and C9's painted contact blob — the thing that
 * actually grounds a painted prop in this film — is proven per class rather than
 * promised film-wide.
 *
 * It is the ORDINARY ground card: the same skirt, the same rim contour, the same meadow
 * painting. `wear: false` keeps the cart ruts and the landing patch off it, because
 * those are row 2's marks and this is not row 2 — the only thing on the incident layer
 * here is the C9 ledger for the props standing on it.
 */
export function propGround(
  rx: number,
  rz: number,
  blobs: [number, number, number, number][],
  gap: [number, number] = [292, 78],
): THREE.Group {
  const g = buildGroundCard(rx, rz, { gap, marks: false });
  g.root.add(buildIncidentCard(rx, rz, { spine: null, blobs, wear: false }));
  return g.root;
}

// ---- rock ---------------------------------------------------------------------------
//
// One mass, one direction. Tiering comes from roughen() + scale.y 0.7 under the key,
// so poster stays 0 — a posterised rock reads as a contour map.
// FIX ROUND. Two things changed here and both are the judgement's item 7 ("each pentagon
// face is a flat khaki plane with a smooth per-facet Lambert value at 60–70 screen px").
//
//  1. EVERY ROCK IN THE FILM NOW CARRIES THE BAKE. It used to be the S1 hero rock only,
//     on the argument that a small rock cannot carry a 512²; but a flat token under
//     Lambert is a flat plane at ANY size, and the tile is shared, so the outcrop, the
//     talus, the boulder, the cliff's crown and its scree all take it too. The bake is
//     white-based (see rock.ts) so `material.color` still supplies the token and one
//     canvas serves the whole family.
//  2. THE `seed % 4` DIRECTION SPREAD IS GONE. `stroke.dir` is a per-material uniform
//     (trilayer.ts:498), so four seeded directions per colour was four materials per
//     colour — up to twelve for this class alone, against §11.6's allowance. Every rock
//     is a merged mass and a merged mass has ONE direction; the ladder's spread belongs
//     between islands, exactly as bark's does.
// ---- bakeRockFace, WHITE-BASED, shared by every rock in the film -------------------
//
// SCREEN-SPACE ARITHMETIC: 512² over a mass whose spherical UV wraps the tile once. On
// the S1 hero rock's r 0.86 lobes that is 595 texels/unit and a 30–70-texel dab is
// 4–10 screen px at the film's 133 px/u figure floor; on the 0.29-u talus chunks it is
// 1 765 texels/unit and the same dab is 1.4–3.3 px, so the small rocks read the bake as
// a VALUE STRUCTURE (the three bands) rather than as marks. That is the right answer at
// both ends and it is why one tile can serve the whole family.
//
// THE BASE IS MID-GREY, NOT A COLOUR. The tiers are multiplicative — a light band at
// 1.0, the base at 0.78, a shade band at 0.56 — so `material.color` supplies the token
// and the same canvas paints a rockFace mass, a rockLit talus and a cliff crown alike.
// The earlier build baked the three tiers as literal colours, which meant exactly one
// rock in the film could use it.
let rockTex: THREE.CanvasTexture | null | undefined;
function bakeRockFace(): THREE.CanvasTexture | null {
  if (rockTex !== undefined) return rockTex;
  if (typeof document === 'undefined') return (rockTex = null);
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.lineCap = 'round';
  const grey = (v: number) => `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})`;

  // PolyhedronGeometry's spherical layout puts v = 1 at the top pole, so canvas y = 0 IS
  // the key shoulder and canvas y = size IS the underside. The three tiers are three
  // horizontal bands and the climbing lip is the top 40 texels.
  ctx.fillStyle = grey(0.78);
  ctx.fillRect(0, 0, size, size);
  // the lit shoulder — a band, brushed ragged at its edge, never ruled
  ctx.fillStyle = grey(1);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.lineTo(size, size * 0.34);
  for (let x = size; x >= 0; x -= 32) ctx.lineTo(x, size * 0.34 + (brand() - 0.5) * 52);
  ctx.closePath();
  ctx.fill();
  // and the shade side under it
  ctx.fillStyle = grey(0.56);
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, size * 0.7);
  for (let x = 0; x <= size; x += 32) ctx.lineTo(x, size * 0.7 + (brand() - 0.5) * 46);
  ctx.lineTo(size, size);
  ctx.closePath();
  ctx.fill();

  // 260 curved dabs, each a step off its own band — a loaded brush pulled and lifted,
  // never a plotted tick, and never crossing: ONE family across the whole face, which
  // must not argue with the trilayer's own dir 0.55.
  for (let i = 0; i < 260; i++) {
    const x = brand() * size;
    const y = brand() * size;
    const own = y < size * 0.36 ? 1 : y < size * 0.7 ? 0.78 : 0.56;
    const step = brand() < 0.55 ? -0.16 : 0.14;
    const len = 30 + brand() * 40;
    const ang = 0.52 + (brand() - 0.5) * 0.34;
    ctx.strokeStyle = `rgba(${Math.round(Math.min(1, Math.max(0.34, own + step)) * 255)},${Math.round(
      Math.min(1, Math.max(0.34, own + step)) * 255,
    )},${Math.round(Math.min(1, Math.max(0.34, own + step)) * 255)},${(0.42 + brand() * 0.34).toFixed(3)})`;
    ctx.lineWidth = 7 + brand() * 9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(ang) * len * 0.5 + (brand() - 0.5) * 9,
      y + Math.sin(ang) * len * 0.5 + (brand() - 0.5) * 9,
      x + Math.cos(ang) * len,
      y + Math.sin(ang) * len,
    );
    ctx.stroke();
  }

  // THE RUBBED CLIMBING EDGE — the top lip where hands go, drybrushed 40 texels wide.
  // Drybrush only where hands go (C8); this is the rock's one entry in the wear
  // vocabulary and it is the reason he can climb it.
  for (let i = 0; i < 150; i++) {
    const x = brand() * size;
    const y = brand() * 40;
    ctx.strokeStyle = `rgba(255,255,255,${(0.5 * (1 - y / 40) * (0.4 + brand() * 0.6)).toFixed(3)})`;
    ctx.lineWidth = 3 + brand() * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12 + brand() * 22, y + (brand() - 0.5) * 6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return (rockTex = tex);
}

// FIX ROUND. Two things changed here and both are the judgement's item 7 ("each pentagon
// face is a flat khaki plane with a smooth per-facet Lambert value at 60–70 screen px").
//
//  1. EVERY ROCK IN THE FILM NOW CARRIES THE BAKE. It used to be the S1 hero rock only,
//     on the argument that a small rock cannot carry a 512²; but a flat token under
//     Lambert is a flat plane at ANY size, and the tile is shared, so the outcrop, the
//     talus, the boulder, the cliff's crown and its scree all take it too.
//  2. THE `seed % 4` DIRECTION SPREAD IS GONE. `stroke.dir` is a per-material uniform
//     (trilayer.ts:498), so four seeded directions per colour was four materials per
//     colour — up to twelve for this class alone, against §11.6's allowance. Every rock
//     is a merged mass and a merged mass has ONE direction; the ladder's spread belongs
//     between islands, exactly as bark's does.
// `wear` is a PARAMETER for the same reason the cast's is: edge wear is a straight mix
// toward PAPER, and the film body runs a hotter rig than this route does (hemi 1.45 over
// the same 2.2 key, plus a fire point light). 0.30 reads as a rim on a rock here and as
// a whitewash there. This route's callers pass nothing and get exactly what shipped.
const rockMats = new Map<string, THREE.MeshLambertMaterial>();
export function rockMaterial(color: number, wear = 0.3): THREE.MeshLambertMaterial {
  const key = color + '@' + wear;
  let m = rockMats.get(key);
  if (!m) {
    const map = bakeRockFace();
    m = createTrilayer({
      color: map ? 0xffffff : color,
      wear,
      // §11.4 R6: the one-mass family, the same rung the ladder gives skin and hide.
      stroke: { dir: 0.55, sheet: true },
    });
    if (map) {
      m.map = map;
      m.color.setHex(color);
    }
    // The film's set modules recolour a prop with `paint(obj, { fill })` after they
    // build it — a cave flank is `stoneCool`, a chip is `rockFace`. `paint()` cannot
    // clone a trilayer (clone drops `onBeforeCompile` and the underdrawing with it), so
    // the material carries its own re-tint back to this cache instead. One line here is
    // what keeps every existing call site in the film honest.
    m.userData.role = 'tri';
    m.userData.retint = (hex: number) => rockMaterial(hex, wear);
    rockMats.set(key, m);
  }
  return m;
}

/**
 * ONE ROCK LOBE — and this recipe was reopened by the judgement, so the old finding is
 * recorded and then overturned.
 *
 * WHAT THE OLD FINDING SAID. `IcosahedronGeometry(r, 2)` was tried at r 1.8 and
 * rejected because "`inkEdges` at threshold 22 finds ~480 edges and draws every one, so
 * the mass renders as a wireframe circus tent. Subdividing to hide the pattern hands the
 * pattern straight to the contour pass." That was true, and it is the reason the class
 * shipped as a `DodecahedronGeometry` at detail 0 — 36 triangles, 30 edges, "a number of
 * contours a hand would actually draw".
 *
 * WHY IT NO LONGER HOLDS. The judgement's item 7 retired `inkEdges` from this class
 * outright in favour of `silhouetteRuns` — the mass's own outline, 8–14 chained runs,
 * independent of how many faces are under it. THE CONSTRAINT THAT FORCED THE PRIMITIVE
 * IS GONE, and once it is gone the primitive is simply wrong: a dodecahedron at +33°
 * elevation shows one large top pentagon and reads as a paving slab, which is exactly
 * what the judgement measured ("a rockery of hexagonal paving slabs… each pentagon face
 * is a flat khaki plane at 60–70 screen px"), and making the lobes smaller multiplies
 * the slabs rather than removing them.
 *
 * SO: 320 faces, and TWO OCTAVES of displacement. One octave at 1.3/r is the boulder's
 * own big lumps — wavelength about four subdivided edges, which is what actually breaks
 * a silhouette — and one at 4.0/r puts a smaller break on top of it so the surface is
 * not a smooth swell. A single fine octave was the old note's other failure mode:
 * `computeVertexNormals` averages a per-vertex crinkle straight back out and the lobe
 * returns as a polished pebble.
 */
export function rockGeometry(r: number, seed: number, detail = 2): THREE.BufferGeometry {
  // WELD FIRST, AND THIS IS THE WHOLE OF IT. `IcosahedronGeometry` arrives NON-INDEXED,
  // so `computeVertexNormals` — which `roughen` runs before it displaces — hands every
  // vertex its own FACE normal. Three copies of one corner then move three different
  // ways and the sphere comes apart into loose triangles: measured, the first attempt
  // rendered as a geodesic cage at 264k triangles because `silhouetteRuns` correctly
  // saw every edge as an open boundary. Welded, the normals average, the displacement is
  // coherent, and the silhouette pass finds the 10-odd runs it is supposed to find.
  // `detail` exists for the film body, not for this route: the mock's rocks are all
  // 0.25–0.78 u and take detail 2 (320 faces). A path pebble is 0.05 u and 8 screen px
  // — 320 faces on it is 320 faces the lens cannot resolve, so the film's small end
  // asks for detail 1 (80 faces). The recipe is unchanged; only the tessellation the
  // silhouette is cut from moves, and it moves with the mass's own screen size.
  const g = mergeVertices(new THREE.IcosahedronGeometry(r, detail), 1e-5);
  roughen(g, r * 0.19, 1.3 / r, seed);
  roughen(g, r * 0.06, 4.0 / r, seed + 71);
  g.scale(1, 0.72, 1); // wider than tall — a rock sits, it does not stand
  g.computeVertexNormals();
  return g;
}

/** Repeats MERGE — never instance: the trilayer reads modelMatrix, never instanceMatrix. */
export function mergeRocks(
  specs: { r: number; seed: number; pos: [number, number, number]; rotY?: number }[],
): THREE.BufferGeometry {
  const parts = specs.map((s) => {
    const g = rockGeometry(s.r, s.seed);
    g.rotateY(s.rotY ?? 0);
    g.translate(s.pos[0], s.pos[1], s.pos[2]);
    return g;
  });
  return mergeGeometries(parts, false)!;
}

// ---- field wash ---------------------------------------------------------------------
//
// Three tint blocks in ONE 256² bake, UV-selected, ONE material (§11.4 R9). A tiling
// sheet cannot carry a sub-region, so the three tints get their own small bake rather
// than a second region of bakeGroundSheet.
export const FIELD_TINTS = [FIELD_A, FIELD_B, FIELD_C];
let fieldWash: THREE.CanvasTexture | null | undefined;

export function bakeFieldWash(): THREE.CanvasTexture | null {
  if (fieldWash !== undefined) return fieldWash;
  if (typeof document === 'undefined') return (fieldWash = null);
  const size = 256;
  const band = size / 3;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.lineCap = 'round';
  FIELD_TINTS.forEach((tint, i) => {
    const y0 = i * band;
    ctx.fillStyle = css(tint);
    ctx.fillRect(0, y0, size, band + 1);
    // furrow dabs one value step either side of the tint, all on ONE direction: a
    // field is ploughed, and a ploughed field has a grain, not a texture. Alpha is
    // committed (0.30–0.62, walked up from 0.16–0.32) — at the miniature's ~1.5-unit
    // field a 256² block over 6 u is 43 texels/unit, so a furrow is 0.6 of a unit and
    // a whisper of one is a flat swatch.
    for (let d = 0; d < 200; d++) {
      const x = brand() * size;
      const y = y0 + brand() * band;
      const len = 34 + brand() * 40;
      ctx.strokeStyle = rgba(
        brand() < 0.5 ? mixHex(tint, P.timberDark, 0.55) : mixHex(tint, P.flameCore, 0.5),
        0.34 + brand() * 0.34,
      );
      ctx.lineWidth = 4 + brand() * 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(0.3) * len, y + Math.sin(0.3) * len);
      ctx.stroke();
    }
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  fieldWash = tex;
  return tex;
}

let fieldMat: THREE.MeshLambertMaterial | null = null;
export function fieldMaterial(): THREE.MeshLambertMaterial {
  if (fieldMat) return fieldMat;
  const map = bakeFieldWash();
  fieldMat = createTrilayer({
    color: map ? 0xffffff : FIELD_A,
    wear: 0.22,
    stroke: { dir: 0.3, sheet: true },
  });
  if (map) fieldMat.map = map;
  return fieldMat;
}

/**
 * A field as a POLYGON, not a quad — `mock/field.ts`'s item 19 applied to a scattered
 * field rather than to a lattice: "Land does not have vertices. Decal boundaries cut into
 * grass with hard geometric edges… make the field boundaries irregular."
 *
 * Sixteen points on the card's own ellipse, each pushed ±9 % off true, fan-triangulated
 * from the centroid. The ring is handed back so the hedge line that separates this field
 * from its neighbour is sampled from the SAME points the wash was filled between — the
 * drawn boundary is the painted boundary, never a line near it.
 */
export function fieldPatch(
  w: number,
  h: number,
  tier: number,
  seed = 0,
): { geom: THREE.BufferGeometry; ring: THREE.Vector3[] } {
  const rnd = (() => {
    let t = (seed * 0x9e3779b9) | 0;
    return () => {
      t = (t + 0x6d2b79f5) | 0;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  })();
  const N = 16;
  const ring: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const j = 1 + (rnd() - 0.5) * 0.18;
    ring.push(new THREE.Vector3(Math.cos(a) * (w / 2) * j, 0, Math.sin(a) * (h / 2) * j));
  }
  const pos: number[] = [];
  const uvs: number[] = [];
  const inset = 3 / 256; // guard band — a bilinear tap must not reach the next tint
  const push = (x: number, z: number) => {
    pos.push(x, 0, z);
    // u carries the field's own extent so the furrows run at one world scale across all
    // six; v picks the tint block
    uvs.push(x / w + 0.5, (z / h + 0.5) * (1 / 3 - inset * 2) + tier / 3 + inset);
  };
  // WINDING: the ring runs anticlockwise in XZ, and a fan (centre, a, b) in that order
  // gives (b−a)×(c−a) = (0, sin(θa − θb), 0) — a normal pointing DOWN, so the whole
  // patch back-face culls from any camera above it. Walked at t59.8: six hedge rings with
  // no wash inside them. The fan is emitted (centre, b, a).
  for (let i = 0; i < N; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % N];
    push(0, 0);
    push(b.x, b.z);
    push(a.x, a.z);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();
  return { geom, ring };
}

/** A flat field card whose UVs land inside tint block `tier` (0 A · 1 B · 2 C). */
export function fieldCard(w: number, h: number, tier: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h, 1, 1);
  g.rotateX(-Math.PI / 2);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const inset = 3 / 256; // guard band — a bilinear tap must not reach the next tint
  for (let i = 0; i < uv.count; i++) {
    const v = uv.getY(i) * (1 / 3 - inset * 2) + tier / 3 + inset;
    uv.setXY(i, uv.getX(i), v);
  }
  uv.needsUpdate = true;
  return g;
}


// =====================================================================================
// ROW 4 — CLIFF / STRATA. Lifted verbatim out of `mock/strata.ts`'s `buildMock()` so the
// ?mock=strata route and `sets/cliffWorld.ts` cannot drift: the film's bookend asset is
// ONE build, and the route now proves the same object the film ships.
//
// Everything below is the mock's own code with the module-local names given a `strata`/
// `cliff` prefix where groundKit already owns the short one. The numbers are untouched.
// =====================================================================================

export const CLIFF_RX = 5.4;
export const CLIFF_RZ = 4.6;

// THE SIX TINT BLOCKS, in bake order. Seven bands, six colours — cliffShade serves
// bands 2 and 5 — so one 512² carries every token this class has and the UV picks.
const STRATA_TINTS = [P.earth, CLIFF_SHADE, CLIFF_LIT, P.rockFace, P.stoneWarm, STONE_SHELF];

/** [r top, r bot, y top, y bot, tint block, roughen amp, roughen freq] */
export type StrataBand = [number, number, number, number, number, number, number];

// The row's own table. Radii NON-MONOTONIC so the silhouette STEPS; band 7's bottom
// GROWS to 1.040 because a cliff foot spreads into its own talus (bible row 4 and this
// comment always agreed — the shipped 1.16 below was undisclosed drift, corrected
// 2026-09-06; see the bible's row 4 note). Tiers 2·4·2·3·4·2·3.
//
// CORRECTED 2026-09-06 (W3a) — every top/bottom pair that meets at a boundary was also
// pulled apart by a uniform k=2.4 so the stepping silhouette actually reads: at k=1 the
// boundary discontinuities were 0.4-1.4% of rx, which projects to as little as 1.45px
// at S7 t58.5 (below the 3px-reads-as-a-step floor); at k=2.4 every boundary clears 3px
// at BOTH S1 t6 and S7 t58.5 (worst case 3.48px). Band order, band count and each
// band's own top/bottom relation (which one is larger) are unchanged — only the gap's
// size grew, about each boundary's own midpoint. Reproduce: node w3a-verify.mjs (W3a
// report, scratchpad/w3a/) — real perspective projection at fitFov(1440/900), no
// browser.
export const CLIFF_BANDS: StrataBand[] = [
  [1.0, 1.0128, 6.0, 5.62, 0, 0.05, 2.8], //      1 plateau lip     earth        t2
  [1.0032, 0.951, 5.7, 4.55, 1, 0.09, 2.4], //    2 first ledge     cliffShade   t4
  [0.975, 0.9784, 4.66, 3.3, 2, 0.12, 2.2], //    3 bright course   cliffLit     t2
  [0.9976, 0.9202, 3.42, 2.05, 3, 0.14, 2.0], //  4 mid course      rockFace     t3
  [0.9538, 0.9664, 2.16, 1.15, 1, 0.11, 2.4], //  5 deep course     cliffShade   t4
  [0.9856, 0.8762, 1.26, 0.42, 4, 0.16, 1.9], //  6 shelf           stoneWarm    t2
  [0.9098, 1.04, 0.5, 0.0, 5, 0.18, 1.7], //      7 talus foot      stoneShelf   t3
];

// THE MASSIF — S7's one landmark, and row 4's recipe at a quarter of the argument. Four
// bands instead of seven because at the miniature's scale a seventh course is 0.2 u tall
// and cannot carry a committed tier, and the row's own note is that the extension to a
// different scale is a SUBTRACTION. Every other rule holds: radii non-monotonic (each
// band's top steps INSIDE its neighbour's bottom, so the flank ledges), overlaps 10-13%
// of band height against the row's >=8%, tiers 2·4·2·3 with no two adjacent the same, and
// the cap is left to row 15 — this stack ends at r 0.28 under the snow, not at a point.
export const MASSIF_BANDS: StrataBand[] = [
  [0.1, 0.55, 3.0, 2.15, 4, 0.05, 3.4], //   stoneWarm    t2 — near a point, so row 15's cap can cover it
  [0.52, 0.62, 2.25, 1.5, 1, 0.08, 3.0], //  cliffShade   t4
  [0.6, 0.8, 1.58, 0.85, 2, 0.11, 2.6], //   cliffLit     t2
  [0.76, 1.06, 0.95, 0.0, 5, 0.14, 2.2], //  stoneShelf   t3
];

const STRATA_BLOCKS = 6;
let strataTex: THREE.CanvasTexture | null | undefined;

// 512², six horizontal blocks of 85 texels, tiling in u only. SCREEN-SPACE FIRST: the
// cliff's circumference is about 31 u and u repeats six times, so 512 × 6 / 31 = 99
// texels/unit around the turn; a block's 85 texels over a ~1.2-u band is 71 texels/unit
// down it. EVERYTHING ON THIS CANVAS IS NEAR-HORIZONTAL — strata are laid beds and the
// material's own stroke family is `dir 0.04`; a second angle here would be the hatch the
// gate bans, arriving through the albedo instead of through the shader.
export function bakeStrataBand(): THREE.CanvasTexture | null {
  if (strataTex !== undefined) return strataTex;
  if (typeof document === 'undefined') return (strataTex = null);
  const size = 512;
  const block = size / STRATA_BLOCKS;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.lineCap = 'round';

  STRATA_TINTS.forEach((tint, b) => {
    const y0 = b * block;
    ctx.fillStyle = css(tint);
    ctx.fillRect(0, y0 - 1, size, block + 2);

    // ONE VALUE STEP EITHER SIDE, and no more — 0.26 down / 0.34 up is a step, not a
    // repaint, and it keeps the C5 sequence the drawn half depends on.
    const lit = mixHex(tint, P.flameCore, 0.34);
    const dark = mixHex(tint, P.caveDark, 0.26);

    // FIVE BEDDING PARTINGS per block — a run the full width of the tile, wobbling, one
    // value step down, drawn twice at the u wrap so the tile has no seam.
    for (let p = 0; p < 5; p++) {
      const py = y0 + block * (0.12 + p * 0.19) + (brand() - 0.5) * block * 0.1;
      ctx.strokeStyle = rgba(dark, 0.22 + brand() * 0.2);
      ctx.lineWidth = 3 + brand() * 6;
      for (const ox of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(ox - 4, py);
        for (let x = 0; x <= size; x += 64) {
          ctx.quadraticCurveTo(ox + x - 32, py + (brand() - 0.5) * 11, ox + x, py + (brand() - 0.5) * 7);
        }
        ctx.stroke();
      }
      // a lit lip immediately under the biggest of them — a parting catches light on its
      // underside, which is the one place this class is allowed a bright mark
      if (p === 2) {
        ctx.strokeStyle = rgba(lit, 0.34);
        ctx.lineWidth = 4;
        for (const ox of [-size, 0, size]) {
          ctx.beginPath();
          ctx.moveTo(ox - 4, py + 7);
          for (let x = 0; x <= size; x += 64) ctx.lineTo(ox + x, py + 7 + (brand() - 0.5) * 6);
          ctx.stroke();
        }
      }
    }

    // 150 BEDDING DABS, one value step either side of the block's own tint, laid along
    // the bed at ±15° — a mark, not a speck, and nothing crosses.
    for (let d = 0; d < 150; d++) {
      const x = brand() * size;
      const y = y0 + 4 + brand() * (block - 8);
      const len = 40 + brand() * 46;
      const ang = (brand() - 0.5) * 0.26;
      ctx.strokeStyle = rgba(brand() < 0.46 ? dark : lit, 0.18 + brand() * 0.22);
      ctx.lineWidth = 5 + brand() * 7;
      for (const ox of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(x + ox, y);
        ctx.quadraticCurveTo(
          x + ox + Math.cos(ang) * len * 0.5,
          y + Math.sin(ang) * len * 0.5 + (brand() - 0.5) * 7,
          x + ox + Math.cos(ang) * len,
          y + Math.sin(ang) * len,
        );
        ctx.stroke();
      }
    }
  });

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  // u wraps (the tile goes round the cliff six times); v must CLAMP or a bilinear tap at
  // a block edge reaches into the next tint
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  // flipY OFF: with the default flip, asking for block 2 hands back block 3 and the wall
  // comes back one chocolate mass with the light course buried at the wrong height.
  tex.flipY = false;
  tex.anisotropy = 4;
  return (strataTex = tex);
}

/** Address the strata tile: `u` repeats round the turn, `v` lands inside tint block `b`. */
export function strataBandUV(geom: THREE.BufferGeometry, b: number, uRepeat: number): void {
  const uv = geom.getAttribute('uv') as THREE.BufferAttribute;
  const inset = 4 / 512; // guard band — a bilinear tap must not reach the next tint
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(
      i,
      uv.getX(i) * uRepeat,
      uv.getY(i) * (1 / STRATA_BLOCKS - inset * 2) + b / STRATA_BLOCKS + inset,
    );
  }
  uv.needsUpdate = true;
}

// ONE MATERIAL for every band on every strata landform in the film. The tint arrives from
// the bake's own block, so `color` is white and the cliff, the massif and its shoulders
// share the slot. dir 0.04: laid beds. poster 5, off the row's 0 — with an albedo under
// it the quantizer has something to step; at poster 0 it had nothing to do but pass the
// Lambert ramp through, which is §9.3's gradient wash.
let strataMat: THREE.MeshLambertMaterial | null = null;
export function strataMaterial(): THREE.MeshLambertMaterial {
  if (strataMat) return strataMat;
  const map = bakeStrataBand();
  strataMat = createTrilayer({
    color: map ? 0xffffff : P.stoneWarm,
    wear: 0.18,
    poster: 5,
    stroke: { dir: 0.04, sheet: true },
  });
  if (map) strataMat.map = map;
  strataMat.side = THREE.DoubleSide; // the lens sees inside a lathe band at a ledge
  return strataMat;
}

/**
 * THE CRUMBLE — ONE function of azimuth shared by every band. If the two rings either
 * side of a boundary crumbled independently they would eventually pull apart and open a
 * hole of bare paper through the wall. Sharing it means they move together and the
 * authored overlap survives.
 */
const strataCrumble = (phi: number) =>
  Math.sin(phi * 4.1 + 0.9) * 0.55 + Math.sin(phi * 7.3 - 2.1) * 0.3 + Math.sin(phi * 13.7 + 1.4) * 0.15;

/**
 * THE PLAN-FORM — one lobed outline the whole landform shares, applied to every band, to
 * the plateau and to every mark. A cliff is irregular in PLAN before it is irregular in
 * section, and the row's non-monotonic radii step in ELEVATION only. Three harmonics,
 * ±11% at most, and the SAME function for every band, so no two bands can cross.
 */
export const cliffLobe = (phi: number) =>
  1 + 0.085 * Math.sin(3 * phi + 0.7) + 0.045 * Math.sin(5 * phi - 1.9) + 0.03 * Math.sin(8 * phi + 2.6);

/** The plan-form's largest value — every harmonic in phase. */
export const CLIFF_LOBE_MAX = 1.16;

/** Apply the plan-form to a lathe or disc built in unit-radius space. */
export function applyCliffLobe(geom: THREE.BufferGeometry, scale = 1): THREE.BufferGeometry {
  const pos = geom.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const L = cliffLobe(Math.atan2(z, x)) * scale;
    pos.setX(i, x * L);
    pos.setZ(i, z * L);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/** A point on a strata landform's outline at screen-angle `a`°, radius fraction `rr`, height `y`. */
export function cliffEdge(a: number, rr: number, y: number, rx = CLIFF_RX, rz = CLIFF_RZ): THREE.Vector3 {
  const t = (a * Math.PI) / 180;
  const ux = Math.cos(t);
  const uz = -Math.sin(t);
  const L = cliffLobe(Math.atan2(uz, ux)) * rr;
  return new THREE.Vector3(ux * L * rx, y, uz * L * rz);
}

// roughen() displaces along the vertex normal, which on a near-vertical lathe wall is
// almost horizontal — exactly the ledge-making direction this class wants. The boundary
// rings are then put back on the SHARED crumble so neighbouring bands move together and
// the authored overlap survives: 4% of the band's own height in y, 2% of its radius out.
//
// LatheGeometry orders vertices segment-major, profile-minor, so the top ring is every
// index where i % points === 0.
function roughenStrataBand(
  geom: THREE.LatheGeometry,
  amp: number,
  freq: number,
  seed: number,
  points: number,
  height: number,
): THREE.BufferGeometry {
  const src = (geom.getAttribute('position') as THREE.BufferAttribute).clone();
  roughen(geom, amp, freq, seed);
  const pos = geom.getAttribute('position') as THREE.BufferAttribute;
  const yAmp = height * 0.04;
  for (let i = 0; i < pos.count; i++) {
    const ring = i % points;
    if (ring !== 0 && ring !== points - 1) continue;
    const x = src.getX(i);
    const z = src.getZ(i);
    const c = strataCrumble(Math.atan2(z, x));
    const rf = 1 + c * 0.02;
    pos.setXYZ(i, x * rf, src.getY(i) + c * yAmp, z * rf);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/**
 * The lathe stack on its own — the row's structure, shared by the cliff and the massif.
 *
 * `amp` is in WORLD units and is divided by `rx` here, which is the row's one arithmetic
 * trap: read as unit-radius amps (the hero skirt's convention) 0.05 -> 0.18 become
 * 0.27 -> 0.97 WORLD units on bands whose authored overlaps are 0.008-0.016 of a unit
 * radius, and every band punches clean through its neighbours into a stack of
 * translucent bowls. Read as world units they give 0.05-0.18 u of break against the
 * hero's own 0.05-0.13 u at island scale — the same hand, the bigger argument.
 *
 * `talus` (default true) rebuilds the LAST band's profile as an accelerating apron
 * instead of a straight taper: a scree slope's angle of repose, not a flat brown skirt.
 */
export function strataBands(
  bands: StrataBand[],
  rx: number,
  rz: number,
  { seed0 = 40, uRepeat = 6, talus = true }: { seed0?: number; uRepeat?: number; talus?: boolean } = {},
): THREE.Mesh[] {
  const last = bands.length - 1;
  return bands.map(([rTop, rBot, yTop, yBot, block, amp, freq], i) => {
    // four profile points, not two: roughen() needs interior vertices or a band comes
    // out a perfectly straight frustum with a wobbled rim, which is a lampshade
    const pts: THREE.Vector2[] = [];
    for (let s = 0; s <= 3; s++) {
      const t = s / 3;
      pts.push(new THREE.Vector2(rTop + (rBot - rTop) * t, yTop + (yBot - yTop) * t));
    }
    if (talus && i === last) {
      pts.length = 0;
      const span = yTop - yBot;
      for (const [f, g] of [[0, 1], [0.196, 0.7], [0.464, 0.4], [1, 0]] as const) {
        pts.push(new THREE.Vector2(rTop + (rBot - rTop) * f, yBot + span * g));
      }
    }
    const lathe = new THREE.LatheGeometry(pts, 72);
    strataBandUV(lathe, block, uRepeat);
    const geom = applyCliffLobe(
      roughenStrataBand(lathe, amp / rx, freq, seed0 + i, pts.length, Math.abs(yTop - yBot)),
    );
    const mesh = new THREE.Mesh(geom, strataMaterial());
    mesh.scale.set(rx, 1, rz);
    mesh.castShadow = i < last;
    mesh.receiveShadow = true;
    return mesh;
  });
}

/**
 * THE FILM'S BOOKEND ASSET — S1, S2 and S7, one build, two eras. The hero's own skirt
 * section promoted to landform scale: seven closed lathe bands, the plateau's ground
 * card, the rim contour with its authored gap, six boundary arcs, sixteen section cut
 * marks, nine measure ticks, a crown of rock and a graded talus scree.
 *
 * `top` is handed back so a caller can stand things on the plateau and know its y.
 */
export function buildStrataCliff(
  view: THREE.Vector3,
  rx = CLIFF_RX,
  rz = CLIFF_RZ,
): { root: THREE.Group; top: THREE.Mesh } {
  const root = new THREE.Group();
  const edge = (a: number, rr: number, y: number) => cliffEdge(a, rr, y, rx, rz);

  // THE DROP SHADOW. It rides the film's ONE page-shadow shader, so it is present under
  // the paint and gone under the drawing exactly as the island's is.
  const shade = pageShadow(rx * 1.06 * CLIFF_LOBE_MAX, rz * 1.06 * CLIFF_LOBE_MAX);
  shade.position.y = 0.012;
  root.add(shade);

  for (const band of strataBands(CLIFF_BANDS, rx, rz)) root.add(band);

  // The plateau's own ground — the meadow sheet, unchanged. The film has ONE ground
  // painting and the cliff top is not an exception to it. This is also the surface that
  // makes C9 work up here: a contact blob is an ALBEDO-MIX and needs an albedo to mix
  // into, and until row 4 landed the plateau was a bare `sketch()` Lambert.
  //
  // PRE-DIVIDED BY LOBE_MAX: the ground card's feather is computed from
  // `length(vTriLocal.xy)` over the LOCAL unit circle and a fragment past 1.0 is
  // discarded, so scaling positions by a plan-form peaking at 1.16 pushes most of the rim
  // outside its own feather. The lobe goes on normalised; LOBE_MAX goes into mesh scale.
  // 1.012 so the meadow overhangs band 1's lip. 72 segments, matching the bands'.
  const top = groundDisc(rx * 1.012 * CLIFF_LOBE_MAX, rz * 1.012 * CLIFF_LOBE_MAX, 72);
  applyCliffLobe(top.geometry.rotateX(-Math.PI / 2), 1 / CLIFF_LOBE_MAX);
  top.geometry.rotateX(Math.PI / 2);
  top.position.y = 6.0;
  root.add(top);

  // THE RIM CONTOUR: open arc 352° -> 250°, so the unfinished span is 250°->352°, 102° on
  // the north-west quadrant. That gap is off-camera at S1 and S2 and swings into view
  // exactly at S7's rise — the bookend surface shows the visitor its unfinished edge at
  // the moment the goblin hands the world over.
  const rim: THREE.Vector3[] = [];
  for (let a = 352; a <= 610; a += 6) rim.push(edge(a, 0.997 + (brand() - 0.5) * 0.012, 6.005));
  root.add(mark(rim, P.ink, 'form'));

  // SIX BOUNDARY ARCS, one per band boundary, at 1.03× EACH BAND'S OWN bottom radius
  // (bible row 4) — proud, because at the true radius roughen() swallows the line.
  // CORRECTED 2026-09-06 (W3a) — was 1.045× the LARGER of the boundary's two radii;
  // that formula also owned 12+ of the cut x arc crossings the section cuts drew
  // through. graphiteDark on the drawn quadrant, ink on the painted one; two draws,
  // not twelve.
  const bounds = CLIFF_BANDS.slice(0, 6).map(([, rBot, , yBot]) => ({
    r: rBot * 1.03,
    y: yBot,
  }));
  const arc = (r: number, y: number, a0: number, a1: number) => {
    const pts: THREE.Vector3[] = [];
    for (let a = a0; a <= a1; a += 6) pts.push(edge(a, r, y));
    return pts;
  };
  root.add(
    strokeSet(bounds.map((b) => arc(b.r, b.y, 10, 75)), P.graphiteDark, 'form'),
    strokeSet(bounds.map((b) => arc(b.r, b.y, 96, 176)), P.ink, 'form'),
  );

  // SIXTEEN SECTION CUT MARKS every 11° from 18° to 190°, sitting on band 6's stoneWarm
  // mid value. 'form' weight: 'faint' vanishes on the skirt's mid values, measured.
  // INK DIES ON cliffShade, which is why they live on band 6 and not on band 5.
  //
  // CORRECTED 2026-09-06 (W3a) — a section cut is a line BETWEEN arcs, not through
  // them (bible row 4): the old span ran from just under band 6's top straight through
  // and into band 7, crossing the band-6/7 boundary arc on 12 of 16 cuts (node-counted,
  // cross-family only, both S1 t6 and S7 t58.5). Each cut now starts just below the
  // band-5/6 arc and stops just above the band-6/7 arc, gapped (CUT_GAP) by more than
  // the 'form' stroke's own width in world units at S7's scale (WIDTH.form 2.1px / 34
  // px/u = 0.062u; 0.07 clears it before the hand-wobble is added), and its radius
  // pulled in from 0.99/0.92 to 0.95/0.92 — this close to either arc's radius the cut
  // still crossed it on screen even with the y-gap open, because elevation mixes world
  // x/z into screen y (§4.4's basis). Re-counted: 0 crossings at both shots. Reproduce:
  // node crossings.mjs / w3a-verify.mjs (W3a report, scratchpad/w3a/).
  const CUT_GAP = 0.07;
  const cutTopY = CLIFF_BANDS[4][3] - CUT_GAP; // just below the band 5/6 arc
  const cutBotY = CLIFF_BANDS[5][3] + CUT_GAP; // just above the band 6/7 arc
  const cuts: THREE.Vector3[][] = [];
  for (let a = 18; a <= 190; a += 11) {
    const j = 0.9 + brand() * 0.2;
    cuts.push([edge(a, 0.95, cutTopY - 0.015 * j), edge(a, 0.92, cutBotY + 0.015 * j)]);
  }
  root.add(strokeSet(cuts, P.ink, 'form'));

  // NINE MEASURE TICKS on the plateau lip — the draughtsman's own marks, left in. One
  // whisper of history, never captioned.
  const ticks: THREE.Vector3[][] = [];
  for (let i = 0; i < 9; i++) {
    const a = 104 + i * 8;
    ticks.push([edge(a, 1.055, 5.88), edge(a, 1.11, 5.84)]);
  }
  root.add(strokeSet(ticks, P.graphiteLight, 'form'));

  // two top chunks — rock class, merged, one draw, drawn by its own silhouette rather
  // than by every dodecahedral edge
  const crown = mergeRocks([
    { r: 0.7, seed: 14, pos: [-2.1, 6.08, 1.5], rotY: 0.6 },
    { r: 0.5, seed: 15, pos: [1.7, 6.02, -1.9], rotY: 2.1 },
    { r: 0.38, seed: 20, pos: [-1.5, 6.02, 0.7], rotY: 1.3 },
  ]);
  root.add(new THREE.Mesh(crown, rockMaterial(P.rockFace)), silhouette(crown, view, P.graphiteDark, 0.05));

  // THE TALUS SCREE. Four big chunks at the foot read as four boulders somebody put
  // there; a talus is a GRADED spill, so this is fourteen chunks whose radius falls as
  // they run out from the foot, laid on the arc band 7's apron actually reaches. The
  // apron and the scree are one landform stated twice.
  const screeSpec: { r: number; seed: number; pos: [number, number, number]; rotY: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const a = 0.32 + i * 0.42 + brand() * 0.16;
    const t = brand();
    const rr = (1.2 + t * 0.62) * cliffLobe(a);
    const r = 0.52 - t * 0.32;
    screeSpec.push({
      r,
      seed: 16 + i,
      pos: [Math.cos(a) * rx * rr, r * 0.34, -Math.sin(a) * rz * rr],
      rotY: a * 1.7,
    });
  }
  const scree = mergeRocks(screeSpec);
  const screeMesh = new THREE.Mesh(scree, rockMaterial(ROCK_LIT));
  screeMesh.castShadow = true;
  root.add(screeMesh, silhouette(scree, view, P.graphiteDark, 0.04));

  return { root, top };
}

// =====================================================================================
// ROW 14 — WATER. Lifted out of `mock/water.ts`'s `buildMock()` and parameterised by the
// curve, so the route and S7's river are one build. Four draws: band · banks · dabs ·
// two shore edges, plus C1's cut section at each end.
//
// R1 IS THE WHOLE ROW, AND IT IS ARITHMETIC, NOT TASTE. Raw `water #679FB4` computes to
// `triTone 0.462` = TIER 3, a dense two-pass graphite field, and is BANNED as a fill
// anywhere in the film. `BOARD_WATER = mix(water, paper, 0.78)` = #D7E2E3 computes to
// `triTone 0.1061`, under the shader's own 0.14 mark threshold, so it lands TIER 0 and
// the drawn river is bare paper with an edge. (Was `mix(water, paper, 0.72)` = #CFDDDF,
// `triTone 0.1335` — only 0.0065 clear of the 0.14 boundary, a law-6 breach — re-mixed
// 2026-09-06 for the 0.03 clearance.)
// =====================================================================================

export const BOARD_WATER = mixHex(P.water, P.paper, 0.78); // #D7E2E3 · triTone 0.1061 · tier 0 · re-mixed 2026-09-06 for the 0.03 clearance (was 0.72 → #CFDDDF, triTone 0.1335, 0.0065 from 0.14)

let bankTex: THREE.CanvasTexture | null | undefined;
// 512² tiling at 4 world units = 128 texels/unit, the meadow sheet's own density.
// WHITE-BASED so `material.color` supplies `earth` for the bank and `trackShade` for the
// cut, which is how one canvas paints both tiers of the shore.
export function bakeBank(): THREE.CanvasTexture | null {
  if (bankTex !== undefined) return bankTex;
  if (typeof document === 'undefined') return (bankTex = null);
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.lineCap = 'round';
  const grey = (k: number, a: number) => {
    const t = Math.round(k * 255);
    return `rgba(${t},${t},${t},${a})`;
  };
  // 7 tonal masses first, dabs second — the ground sheet's own order, and the reason a
  // bank has a dark reach and a lit shoulder instead of one even tan
  for (let c = 0; c < 7; c++) {
    const cx = brand() * size;
    const cy = brand() * size;
    const k = c < 3 ? 0.74 + brand() * 0.1 : 1.0;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = grey(k, 0.14 + brand() * 0.16);
      ctx.beginPath();
      ctx.ellipse(
        cx + (brand() - 0.5) * 220,
        cy + (brand() - 0.5) * 220,
        40 + brand() * 70,
        24 + brand() * 44,
        brand() * 3,
        0,
        6.3,
      );
      ctx.fill();
    }
  }
  // 520 dabs in three tiers, one flow family, wrap-drawn — the meadow's own recipe with
  // the greens taken out, because a shore is earth and not grass
  for (let i = 0; i < 520; i++) {
    const x = brand() * size;
    const y = brand() * size;
    const len = 30 + brand() * 40;
    const ang = -0.3 + Math.sin(x * 0.012 + y * 0.008) * 0.4 + (brand() - 0.5) * 0.3;
    const roll = brand();
    const k = roll < 0.34 ? 0.7 : roll < 0.7 ? 0.86 : 1.06;
    ctx.strokeStyle = grey(Math.min(1, k), 0.24 + brand() * 0.3);
    ctx.lineWidth = 6 + brand() * 8;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.quadraticCurveTo(
          x + ox + Math.cos(ang) * len * 0.5,
          y + oy + Math.sin(ang) * len * 0.5,
          x + ox + Math.cos(ang) * len,
          y + oy + Math.sin(ang) * len,
        );
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return (bankTex = tex);
}

const flatSide = <T extends THREE.Material>(m: T): T => ((m.side = THREE.DoubleSide), m);

export interface RiverOpts {
  /** channel width, world units */
  width?: number;
  /** bank half-width either side of the channel */
  bank?: number;
  /** the water surface's y; banks and edges stack above it */
  y?: number;
  /** deterministic hand — defaults to the kit's own */
  rnd?: () => number;
  /** C1 cut sections at both ends. Off where the river runs off a ground card's rim. */
  ends?: boolean;
}

/**
 * The river. ONE lazy curve in, four draws out.
 *
 * THE RULE THIS OBEYS, and it is a fact about offset ribbons rather than about any one
 * river: MIN CURVATURE RADIUS > MAX OFFSET. A ribbon offset by `d` from a curve FOLDS
 * wherever the curve's radius of curvature is smaller than `d`, and the fold renders as
 * a bow-tie fan — the first water build came back as three brown triangles with the
 * water inside its own inverted surface. Author the spine as a lazy meander, never a
 * tight one, and keep `width/2 + bank` well under its turning radius.
 */
export function buildRiver(curve: THREE.CatmullRomCurve3, opts: RiverOpts = {}): THREE.Group {
  const { width: W = 0.86, bank: BK = 0.38, y = 0, rnd = brand, ends = true } = opts;
  const g = new THREE.Group();
  const RUN = curve.getLength();

  // A flat ribbon that follows the curve's own tangent — offset `o`, half-width `hw`.
  // SECOND WALK: mapping a PlaneGeometry's (x, y) onto world (x, z) is a REFLECTION, so
  // every face comes out wound the wrong way and pointed at the floor, back-face culled
  // from any camera above. Every ribbon material here takes DoubleSide.
  const ribbon = (o: number, hw: number, yy: number, seg = 56): THREE.BufferGeometry => {
    const geom = new THREE.PlaneGeometry(1, 1, 1, seg);
    const pos = geom.getAttribute('position');
    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) * 2; // -1 | +1
      const v = pos.getY(i) + 0.5; // 0..1 along the run
      const vv = Math.min(0.9999, Math.max(0.0001, v));
      curve.getPointAt(vv, p);
      curve.getTangentAt(vv, t);
      const d = o + u * hw;
      pos.setXYZ(i, p.x + t.z * d, yy, p.z - t.x * d);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  };
  /** 4 world units per repeat — the meadow sheet's own density, applied in the geometry. */
  const bankUV = (geom: THREE.BufferGeometry, w: number): THREE.BufferGeometry => {
    const uv = geom.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 4), uv.getY(i) * (RUN / 4));
    uv.needsUpdate = true;
    return geom;
  };

  // ---- 1 · the band ----------------------------------------------------------
  // ONE committed value, flat, at tier 0. There is nothing else in it: no gradient, no
  // second tone, no transparency. What makes it water is the EDGE and the DABS.
  const band = new THREE.Mesh(
    ribbon(0, W / 2, y + 0.006),
    flatSide(createTrilayer({ color: BOARD_WATER, wear: 0.16, stroke: { dir: 0.1, sheet: true } })),
  );
  band.receiveShadow = true;
  g.add(band);

  // ---- 2 · the banks ---------------------------------------------------------
  // Land, so the shoreline has two sides — and they take the GROUND class's dabs and the
  // GROUND class's tiers, at the same 4-world-units-per-repeat the meadow uses, so a
  // river bank and an island's path are the same painting at the same density.
  const bankMap = bakeBank();
  const banks = mergeGeometries([
    bankUV(ribbon(-(W / 2 + BK), BK, y + 0.018), BK * 2),
    bankUV(ribbon(W / 2 + BK, BK, y + 0.018), BK * 2),
  ]);
  const bankMat = flatSide(
    createTrilayer({ color: P.earth, wear: 0.28, stroke: { dir: 0.61 } }),
  );
  if (bankMap) bankMat.map = bankMap;
  const bankMesh = new THREE.Mesh(banks, bankMat);
  bankMesh.receiveShadow = true;
  g.add(bankMesh);
  // the cut bank: one value step darker where the water has undercut the outside of each
  // bend. Not a gradient — a committed second tier, which is C5. Same sheet, multiplied
  // by its own darker token, so it is the same paint one step down.
  const cut = mergeGeometries([
    bankUV(ribbon(-(W / 2 + BK * 0.16), BK * 0.16, y + 0.012), BK * 0.32),
    bankUV(ribbon(W / 2 + BK * 0.16, BK * 0.16, y + 0.012), BK * 0.32),
  ]);
  const cutMat = flatSide(
    createTrilayer({ color: TRACK_SHADE, wear: 0.3, stroke: { dir: 0.61 } }),
  );
  if (bankMap) cutMat.map = bankMap;
  g.add(new THREE.Mesh(cut, cutMat));

  // ---- 3 · the lit dabs ------------------------------------------------------
  // The body of the water, and the only thing in frame that says it is moving.
  // Tangent-aligned, in `paper` at 0.7α — the page showing through, never white paint
  // (C11). Under the curtain they are paper on paper and vanish by construction.
  //
  // NOT ON A SCHEDULE. They arrive in CLUSTERS — a river's light gathers where the water
  // breaks and leaves long quiet reaches — which is what stops a row of marks reading as
  // a ruler. ±0.34 rad of slant, not ±0.05: water does not run parallel to its own banks.
  const dabs: THREE.BufferGeometry[] = [];
  let v = 0.02;
  while (v < 0.97) {
    const n = 2 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) {
      const vv = Math.min(0.97, v + rnd() * 0.05);
      const p = curve.getPointAt(vv);
      const t = curve.getTangentAt(vv);
      const off = (rnd() - 0.5) * W * 0.82;
      const len = (0.07 + rnd() * 0.35) * W;
      const q = new THREE.PlaneGeometry(len, W * (0.016 + rnd() * 0.024));
      // rotate in the quad's own plane FIRST, then tip it onto the ground — the same
      // composition put()'s Euler [-PI/2, 0, theta] applies, in the same order
      q.rotateZ(Math.atan2(t.x, t.z) + (rnd() - 0.5) * 0.68);
      q.rotateX(-Math.PI / 2);
      q.translate(p.x + t.z * off, y + 0.0075, p.z - t.x * off);
      dabs.push(q);
    }
    v += 0.06 + rnd() * 0.13;
  }
  const dabMesh = new THREE.Mesh(
    mergeGeometries(dabs),
    flatSide(
      new THREE.MeshBasicMaterial({
        color: P.paper,
        transparent: true,
        opacity: 0.7,
        fog: false,
        depthWrite: false,
      }),
    ),
  );
  dabMesh.renderOrder = 2;
  g.add(dabMesh);

  // ---- 4 · the drawn edge ----------------------------------------------------
  // One 'form' run per shore, in graphiteDark, sampled off the ribbon's OWN offset — so
  // the line is the water's edge and not a line near it. This is the entire drawn state
  // of the class: everything else on the drawn side is bare paper.
  for (const side of [-1, 1] as const) {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 44; k++) {
      const vv = Math.min(0.9999, Math.max(0.0001, k / 44));
      const p = curve.getPointAt(vv);
      const t = curve.getTangentAt(vv);
      const d = side * (W / 2) * (1 + (rnd() - 0.5) * 0.05);
      pts.push(new THREE.Vector3(p.x + t.z * d, y + 0.02, p.z - t.x * d));
    }
    g.add(mark(pts, P.graphiteDark, 'form'));
  }

  // ---- 5 · THE CUT ENDS ------------------------------------------------------
  // "Both ends are cut dead, no skirt, so it floats." They take C1's own three-band
  // section, swept along the ribbon's own cross-line — the same formula, the same three
  // tokens, the same one shared material as every island's skirt in the film.
  if (ends) {
    for (const [vEnd, sign] of [[0.0006, -1], [0.9994, 1]] as const) {
      const p = curve.getPointAt(vEnd);
      const t = curve.getTangentAt(vEnd);
      const nx = t.z;
      const nz = -t.x;
      const line: THREE.Vector3[] = [];
      const HALF = W / 2 + BK * 2;
      for (let i = 0; i <= 8; i++) {
        const d = (-HALF + (i / 8) * 2 * HALF) * sign;
        line.push(new THREE.Vector3(p.x + nx * d, y + 0.018, p.z + nz * d));
      }
      g.add(cutSection(line, 0.34));
    }
  }

  return g;
}
