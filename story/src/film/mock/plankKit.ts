// MOCK KIT — the shared hand for the BUILT-THINGS classes (mockup author 3):
// timber · plank · metal · cloth · glass · water · snow.
//
// Everything here is a copy of an idiom that already ships in stages/hero.ts but is
// module-private there (`mixHex`, `brand`, `mark`, the VIEW_R / VIEW_CAM view-plane
// basis, `boxMarks`). The mock modules may not edit hero.ts, so the idioms are
// re-expressed here ONCE rather than seven times — the file is named for `plank.ts`
// because a helper file must share a stem with an owned module (plank is the biggest
// class in the set).
//
// Two things here are NOT copies, and both are art decisions:
//   `boxRun()`  — hero's boxMarks() spends 12 draw calls on one box (one polyline per
//                 edge). The same 12 edges are traced by ONE continuous walk of 16
//                 segments (4 edges re-traced, invisible because a re-drawn line lands
//                 on itself), so a construction box costs 1 draw instead of 12.
//   `bakeGrain()` — a WHITE-based grain tile. Art bible row 8 implies a coloured
//                 `bakePlank`; a white base multiplied by `material.color` lets ONE
//                 512² serve all six plank tokens, which is the same lever row 17
//                 already uses for the sky sheet ("base is paper, not a colour").
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { polyline, paint, sketch, type Weight } from '../pencil.ts';
import { rig, createTrilayer } from '../stages/trilayer.ts';
import { HERO_AZ, HERO_ELEV } from '../heroView.ts';
import { plank, flameCore, timberDark, ink, graphiteDark, iron, steel, ravenSlate, brass } from '../palette.ts';

export const css = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;
export const rgba = (hex: number, a: number) =>
  `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;

/** Two committed tokens, one mix — the only way a new colour is allowed to exist. */
export const mixHex = (a: number, b: number, t: number) => {
  const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
  const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
  const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
  return (r << 16) | (g << 8) | bl;
};

/** Deterministic hand — the same drawing on every load (art bible gate 6). */
export function hand(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The shot's view plane. Contour marks are authored where THIS lens sees the form's
// edge; VIEW_CAM biases a mark toward the camera so it wins the depth test against the
// solid it annotates without moving on screen. Both are hero.ts's, by its exports.
export const VIEW_R = new THREE.Vector3(Math.cos(HERO_AZ), 0, Math.sin(HERO_AZ));
export const VIEW_CAM = new THREE.Vector3(
  Math.sin(HERO_AZ) * Math.cos(HERO_ELEV),
  Math.sin(HERO_ELEV),
  -Math.cos(HERO_AZ) * Math.cos(HERO_ELEV),
);

/** One drawn run in a committed graphite/ink value. One polyline = ONE draw call. */
export const mark = (pts: THREE.Vector3[], hex: number, w: Weight = 'form', close = false) =>
  paint(polyline(pts, w, close), { line: hex });

/** The form's own edges as pencil marks; the trilayer solid underneath keeps the tone. */
export function inkEdges(geom: THREE.BufferGeometry, threshold: number, hex: number, w: Weight = 'form') {
  const s = sketch(geom, threshold, w);
  (s.children[0] as THREE.Mesh).visible = false;
  return paint(s, { line: hex });
}

/** A drawn arc in the view plane. `push` biases it toward the lens (depth only). */
export function arc(
  c: THREE.Vector3,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  hex: number,
  rnd: () => number,
  w: Weight = 'form',
  push = 0.12,
) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = a0 + ((a1 - a0) * i) / 16;
    const j = 1 + (rnd() - 0.5) * 0.06;
    const h = Math.cos(a) * rx * j;
    pts.push(
      new THREE.Vector3(c.x + VIEW_R.x * h, c.y + Math.sin(a) * ry * j, c.z + VIEW_R.z * h)
        .addScaledVector(VIEW_CAM, push),
    );
  }
  return mark(pts, hex, w);
}

const M = new THREE.Matrix4();
const E = new THREE.Euler();
const Q = new THREE.Quaternion();
const V = new THREE.Vector3();
const S = new THREE.Vector3();

export interface Place {
  pos?: [number, number, number];
  rot?: [number, number, number];
  scale?: [number, number, number] | number;
}

/**
 * Bake a transform into a geometry's vertices. This is what replaces instancing
 * (art bible gate 4): the trilayer reads its world position from `modelMatrix` and
 * never from `instanceMatrix`, so repeats MUST land in the vertices.
 */
export function put(geom: THREE.BufferGeometry, p: Place): THREE.BufferGeometry {
  const s = p.scale ?? 1;
  const pos = p.pos ?? [0, 0, 0];
  const rot = p.rot ?? [0, 0, 0];
  const sc: [number, number, number] = typeof s === 'number' ? [s, s, s] : s;
  V.set(pos[0], pos[1], pos[2]);
  E.set(rot[0], rot[1], rot[2]);
  S.set(sc[0], sc[1], sc[2]);
  M.compose(V, Q.setFromEuler(E), S);
  geom.applyMatrix4(M);
  return geom;
}

/**
 * Merge a class's repeats into one BufferGeometry — one draw, never an InstancedMesh.
 * ExtrudeGeometry comes back non-indexed while every other primitive is indexed, so
 * the list is levelled first: `mergeGeometries` refuses a mixed set outright.
 */
export function merge(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const mixed = list.some((x) => !x.index);
  const src = mixed ? list.map((x) => (x.index ? x.toNonIndexed() : x)) : list;
  // drop anything the whole set does not share (morph targets, stray uv2s)
  const keep = Object.keys(src[0].attributes).filter((k) => src.every((x) => x.attributes[k]));
  for (const x of src) for (const k of Object.keys(x.attributes)) if (!keep.includes(k)) x.deleteAttribute(k);
  const g = mergeGeometries(src, false);
  if (!g) throw new Error('mock: merge failed — mismatched attributes');
  for (const x of [...list, ...src]) if (x !== g) x.dispose();
  return g;
}

/**
 * Rescale a box's UVs so one 512² grain tile repeats every 2 world units = 256
 * texels/unit, with `v` running along the board's own length. BoxGeometry's top face
 * runs u along x and v along z, which is the face that matters on carpentry.
 */
export function boardUV(geom: THREE.BufferGeometry, w: number, len: number, tile = 2): THREE.BufferGeometry {
  const uv = geom.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / tile), uv.getY(i) * (len / tile));
  uv.needsUpdate = true;
  return geom;
}

/**
 * All 12 edges of a box as ONE continuous walk (16 segments, 4 re-traced) — hero's
 * boxMarks() drawing at 1/12 the draw cost. Returns the point run, not the mesh, so a
 * caller can concatenate several boxes' construction into one polyline where the
 * carry-over segment is hidden inside the form.
 */
export function boxRun(w: number, h: number, d: number, c: THREE.Vector3): THREE.Vector3[] {
  const v = (x: number, y: number, z: number) =>
    new THREE.Vector3(c.x + x * w * 0.5, c.y + y * h * 0.5, c.z + z * d * 0.5);
  const a = v(-1, -1, -1), b = v(1, -1, -1), cc = v(1, -1, 1), dd = v(-1, -1, 1);
  const e = v(-1, 1, -1), f = v(1, 1, -1), g = v(1, 1, 1), hh = v(-1, 1, 1);
  return [a, b, cc, dd, a, e, f, g, hh, e, a, b, f, g, cc, dd, hh];
}

/**
 * ROUTE DEFECT, and every author on this route is hit by it. `MockSheet.tsx:105` parks
 * the seam at 1e6 on mount so the curtain alone decides the state — but `buildHero()`
 * wires heroLife's entrance, whose GSAP timeline tweens `rig.seamX` back to
 * `SEAM_X = 1.0` a beat later (`heroLife.ts:424`). The route places every mock at
 * x ≥ 6.4, which is on the DRAWN side of a seam at 1.0, so under `?rig=perf` a finished
 * painted class renders as flat graphite and the whole comparison is a lie. Measured
 * live: `uTriSeamX 1, uTriSeamW 0.2, uTriCurtain 0` on a mock material.
 *
 * MockSheet.tsx belongs to another workflow, so the park is re-asserted per frame from
 * inside the mock instead. (`foliageKit.ts:62` carries the same workaround — two
 * authors found it independently, which is the argument for fixing it at the route.)
 */
export function parkSeam<T extends THREE.Object3D>(root: T): T {
  const host: THREE.Mesh[] = [];
  root.traverse((o) => {
    if (!host.length && (o as THREE.Mesh).isMesh) host.push(o as THREE.Mesh);
  });
  if (host.length) {
    host[0].onBeforeRender = () => {
      if (rig.seamX.value < 1e5) rig.seamX.value = 1e6;
    };
  }
  return root;
}

/**
 * The silhouette of a tube, as THIS lens sees it. For an axis sample at world point
 * `p` with radius `r`, the drawn edge sits along `cross(axis, viewDir)` — so the
 * contour lands ON the form's own outline instead of near it. hero.ts's roots use a
 * fixed limb-local push, which is exact only while a limb's yaw stays inside ±0.4 rad;
 * a fallen log at 90° throws that mark clean off the timber, which is the first thing
 * ?mock=timber showed. Returns the two edges as one continuous run: down one side,
 * around the tip, back up the other.
 */
export function tubeContour(
  axis: { p: THREE.Vector3; r: number }[],
  push = 0.06,
): THREE.Vector3[] {
  const left: THREE.Vector3[] = [];
  const right: THREE.Vector3[] = [];
  const a = new THREE.Vector3();
  const o = new THREE.Vector3();
  for (let i = 0; i < axis.length; i++) {
    const prev = axis[Math.max(0, i - 1)].p;
    const next = axis[Math.min(axis.length - 1, i + 1)].p;
    a.subVectors(next, prev);
    o.crossVectors(a, VIEW_CAM);
    if (o.lengthSq() < 1e-8) o.copy(VIEW_R);
    o.normalize().multiplyScalar(axis[i].r * 1.04);
    left.push(axis[i].p.clone().sub(o).addScaledVector(VIEW_CAM, push));
    right.push(axis[i].p.clone().add(o).addScaledVector(VIEW_CAM, push));
  }
  return [...left, ...right.reverse()];
}

/**
 * A WHITE-based grain tile: streaks only, so `material.color` supplies the pigment and
 * one bake serves every wood token in the film. 512² @ 2 u = 256 texels/unit; the
 * streaks are 7–14 texels wide, which is 2.7–5.5 screen px at the film's 133 px/u
 * figure floor — over the 2 px stroke floor at both ends.
 */
/**
 * SIX TINT BLOCKS IN ONE TILE — the judgement's item 31, and the reason row 8 shipped
 * nine materials against a budget of two.
 *
 * The white-based `bakeGrain` below lets one canvas serve every wood token, but the
 * token still arrives as `material.color`, so six tokens across two stroke directions is
 * nine materials — `stroke.dir` being a per-material uniform (trilayer.ts:498) and
 * `color` likewise. The only way to collapse them is to move the TINT into the tile and
 * let the UV pick, which is `fieldCard`'s own lever and the one the judgement names.
 *
 * THE GRAIN THEREFORE RUNS ACROSS THE TILE, not down it. Six blocks stacked in v means v
 * can no longer tile, so the board's LENGTH is addressed by u — which tiles — and its
 * WIDTH picks the block. A streak runs along u, wrap-drawn at both u edges, so the grain
 * repeats seamlessly along a board of any length while its across-the-board spacing is
 * fixed at about five streaks per board whatever the board's width. That is what a plank
 * actually looks like: a few grain lines, not a density that scales with the cut.
 *
 * 512² over six blocks is 85 texels per block. At the class's 256 texels/unit along the
 * board a streak 7–14 texels thick is 2.7–5.5 screen px at the film's 133 px/u figure
 * floor — the same numbers `bakeGrain` was authored against, unchanged.
 */
export function bakePlankTints(tints: number[], size = 512, seed = 0x71ab): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const rnd = hand(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.lineCap = 'round';
  const block = size / tints.length;
  tints.forEach((tint, b) => {
    const y0 = b * block;
    ctx.fillStyle = css(tint);
    ctx.fillRect(0, y0 - 1, size, block + 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y0, size, block);
    ctx.clip();
    // 7 streaks per block, running ALONG u, drawn at both wraps so u tiles
    for (let i = 0; i < 7; i++) {
      const y = y0 + (i + 0.5) * (block / 7) + (rnd() - 0.5) * block * 0.16;
      ctx.strokeStyle = `rgba(0,0,0,${0.1 + rnd() * 0.16})`;
      ctx.lineWidth = 5 + rnd() * 7;
      for (const oy of [0]) {
        ctx.beginPath();
        ctx.moveTo(-8, y + oy);
        ctx.bezierCurveTo(
          size * 0.34, y + oy + (rnd() - 0.5) * block * 0.3,
          size * 0.68, y + oy + (rnd() - 0.5) * block * 0.3,
          size + 8, y + oy,
        );
        ctx.stroke();
      }
    }
    // one knot per block — a board has incident, and a knot is where a limb was
    ctx.strokeStyle = `rgba(0,0,0,${0.14 + rnd() * 0.1})`;
    ctx.lineWidth = 3 + rnd() * 2;
    ctx.beginPath();
    // a knot is SMALL: at 256 texels/unit along the board a 20-texel ellipse is 0.08 u,
    // and one of those per 85-texel block reads as a printed "0" on every plank in the
    // film. 9 texels of half-width is a knot; anything larger is a logo.
    ctx.ellipse(rnd() * size, y0 + block * 0.5, 9 + rnd() * 7, 5 + rnd() * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping; // u runs along the board and tiles
  tex.wrapT = THREE.ClampToEdgeWrapping; // v picks the block and must never wrap
  tex.flipY = false; // block b is canvas rows [b·85, (b+1)·85]
  tex.anisotropy = 4;
  return tex;
}

export function bakeGrain(size = 512, count = 60, seed = 0x2c91): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const rnd = hand(seed);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = rnd() * size;
    ctx.strokeStyle = `rgba(0,0,0,${0.10 + rnd() * 0.16})`;
    ctx.lineWidth = 7 + rnd() * 7;
    ctx.beginPath();
    // v runs along the board, so the grain runs down the tile: one family, never
    // crossed. Drawn twice at the horizontal wrap so the tile repeats seamlessly.
    for (const ox of [-size, 0, size]) {
      ctx.moveTo(x + ox, -8);
      ctx.bezierCurveTo(
        x + ox + (rnd() - 0.5) * 26, size * 0.34,
        x + ox + (rnd() - 0.5) * 26, size * 0.68,
        x + ox + (rnd() - 0.5) * 20, size + 8,
      );
    }
    ctx.stroke();
  }
  // a few knots — a board has incident, and a knot is where a limb was
  for (let i = 0; i < 5; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    ctx.strokeStyle = `rgba(0,0,0,${0.16 + rnd() * 0.14})`;
    ctx.lineWidth = 5 + rnd() * 4;
    ctx.beginPath();
    ctx.ellipse(x, y, 9 + rnd() * 7, 20 + rnd() * 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ============================================================================
// DOOR + SIGNPOST (RULING 4, docs/build/inventories/pathProps.md, task W5a-node) —
// ported verbatim from mock/plank.ts's "3 · the door" and "6 · the signpost". The
// committed recipe (board count, GAP, tiers, dir, wear) is unchanged; only "overall
// size" is now a parameter, because the two call sites (this route's mock door and
// signpost, and pathProps.ts tomorrow) want different sizes. Three copies -> one.
// ============================================================================

// door/signpost tiers — identical mixHex calls to mock/plank.ts's own `T.plankLit` /
// `T.plankShade`, so the pigments are byte-identical to what shipped.
const DOOR_TOK = {
  plank,
  plankLit: mixHex(plank, flameCore, 0.3), // #C0A881 t2
  plankShade: mixHex(plank, timberDark, 0.55), // #866A49 t4
} as const;

// DEFINED HERE, NOT sets/kit.ts (P0k): metal-on-carpentry (the door ring handle, the
// chest banding) is this kit's domain. kit.ts imports THIS file already (bakeGrain,
// boardUV, boxRun, merge, put), so kit.ts -> plankKit.ts -> sets/kit.ts would cycle;
// the fix is sets/kit.ts importing these three and re-exporting them under the same
// names, never a second `mixHex(P.iron, ...)` of its own.
//
// V9 · lit iron, moved off the boundary along its own two-token axis rather than to a new
// hue: 0.45 → 0.60 of `iron` toward `steel`. `#9CA5AE`, `triTone` **0.400**, t2, **0.060
// clear** of the t2/t3 boundary — over this file's own 0.05 rule with the world noise in.
// Still `mixHex` of two committed tokens (§4.5), still the tier row 11 asks for, and still
// a step off both boards it crosses. §11.3's table is amended with it.
export const IRON_LIT = mixHex(iron, steel, 0.6); // #9CA5AE · 0.400 · t2 (0.060 clear)
// C5 · the chest's banding and the lid's straps: one committed step off BOTH boards they
// cross (the lit front at t2 and the plank sides at t3), so §11.3's published `ironShade`
// rather than a fourth iron. 0.063 clear of the t3/t4 boundary.
export const IRON_SHADE = mixHex(iron, ravenSlate, 0.5); // #626974 · 0.683 · t4
// C5 · the hasp. Raw `brass` computes to 0.474 — 0.014 from the t2/t3 boundary, so it
// flips across its own 8-mm plate — and it sat on a t3 board. This lands t3 solidly, on a
// front board that is now t2.
export const BRASS_HASP = mixHex(brass, timberDark, 0.22); // #A1833D · 0.540 · t3 (0.080)

const DOOR_GAP = 0.012; // mock/plank.ts's GAP — "ABSOLUTE and never scale with the prop"

/** A board whose grain runs along its own LENGTH (the `len`/z dimension) — mock/plank.ts's `board()`. */
export function boardGeom(w: number, th: number, len: number): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(w, th, len);
  const uv = geom.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * (len / 2), uv.getX(i));
  uv.needsUpdate = true;
  return geom;
}

/** A board whose grain runs UP its own HEIGHT (the `th`/y dimension) — the door leaf's boards. */
function vBoardGeom(w: number, th: number, len: number): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(w, th, len);
  const uv = geom.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * (th / 2), uv.getX(i));
  uv.needsUpdate = true;
  return geom;
}

let plankGrainTex: THREE.CanvasTexture | null | undefined;
const plankGrain = () => (plankGrainTex !== undefined ? plankGrainTex : (plankGrainTex = bakeGrain()));

/** `plankMat`-style (`sets/kit.ts`): one material per token, `bakeGrain`'s white tile carries the token. */
function tintedPlankMat(token: number, dir: number, wear = 0.24): THREE.MeshLambertMaterial {
  const mat = createTrilayer({ color: token, wear, stroke: { dir, sheet: true } });
  const g = plankGrain();
  if (g) mat.map = g;
  return mat;
}

export interface DoorOpts {
  /** Leaf width (5 boards + 4 gaps). Default 0.898 = 5x0.17 + 4xGAP — the committed recipe. */
  width?: number;
  /** Leaf height. Default 1.62 — the committed recipe. */
  height?: number;
  center?: THREE.Vector3;
  /**
   * pathProps.ts's door is a voussoir arch (`sets/pathProps.ts`, ~line 220, READ ONLY);
   * the mock's is square-topped. Off by default. Draws a contour cue only — it does not
   * reshape the 5-board leaf, so the ported recipe stays unchanged either way.
   */
  arched?: boolean;
  /** pathProps.ts's door carries an iron ring handle (~line 262, READ ONLY); the mock has none. */
  ringHandle?: boolean;
}

/**
 * The door: 5 boards, a frame (2 jambs + a lintel), 2 strap marks, a construction
 * outline and a 4-joint comb. Ported verbatim from mock/plank.ts's "3 · the door"
 * (RULING 4) — same board count, same GAP, same tiers (i===1 lit, i===3 shade, else
 * mid), same dir (1.42) and wear (0.24). `width`/`height` scale the leaf; GAP stays
 * absolute per the row's own rule (mock/plank.ts, search "ABSOLUTE").
 */
export function buildDoor(opts: DoorOpts = {}): THREE.Group {
  const width = opts.width ?? 0.898;
  const height = opts.height ?? 1.62;
  const c = opts.center ?? new THREE.Vector3();
  const sx = width / 0.898;

  const boardW = (width - 4 * DOOR_GAP) / 5;
  const leafY = height / 2 + 0.05; // 0.86 at the default height
  const jambH = height + 0.24; // 1.86 at the default height
  const jambX = width / 2 + 0.081; // 0.53 at the default width
  const jambY = jambH / 2;
  const lintelW = 2 * jambX + 0.11; // 1.17 at the default width
  const lintelY = jambH + 0.06; // 1.92 at the default height
  const jointTop = height + 0.04; // 1.66 at the default height
  const jointBottom = 0.07; // a fixed ground-side inset, not scaled

  const byTok = new Map<number, THREE.BufferGeometry[]>();
  const addB = (tok: number, geom: THREE.BufferGeometry) =>
    (byTok.get(tok) ?? byTok.set(tok, []).get(tok)!).push(geom);

  for (let i = 0; i < 5; i++) {
    const tok = i === 1 ? DOOR_TOK.plankLit : i === 3 ? DOOR_TOK.plankShade : DOOR_TOK.plank;
    addB(tok, put(vBoardGeom(boardW, height, 0.045), { pos: [c.x + (i - 2) * (boardW + DOOR_GAP), leafY, c.z] }));
  }
  addB(DOOR_TOK.plankShade, put(boardGeom(0.11, jambH, 0.1), { pos: [c.x - jambX, jambY, c.z] }));
  addB(DOOR_TOK.plankShade, put(boardGeom(0.11, jambH, 0.1), { pos: [c.x + jambX, jambY, c.z] }));
  addB(DOOR_TOK.plankShade, put(boardGeom(lintelW, 0.13, 0.1), { pos: [c.x, lintelY, c.z] }));

  const g = new THREE.Group();
  for (const [tok, list] of byTok) {
    const mesh = new THREE.Mesh(merge(list), tintedPlankMat(tok, 1.42));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }

  const runs = new THREE.Group();
  for (const y of [0.36 * (height / 1.62), 1.32 * (height / 1.62)]) {
    runs.add(
      mark(
        [
          new THREE.Vector3(c.x - 0.42 * sx, y, c.z + 0.03).addScaledVector(VIEW_CAM, 0.08),
          new THREE.Vector3(c.x + 0.36 * sx, y + 0.02, c.z + 0.03).addScaledVector(VIEW_CAM, 0.08),
          new THREE.Vector3(c.x + 0.44 * sx, y + 0.09, c.z + 0.03).addScaledVector(VIEW_CAM, 0.08),
        ],
        ink,
        'form',
      ),
    );
  }
  runs.add(mark(boxRun(width, height, 0.045, new THREE.Vector3(c.x, leafY, c.z)), graphiteDark, 'faint'));
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 4; i++) {
      const x = c.x + (i - 1.5) * (boardW + DOOR_GAP);
      const [a, b] = i % 2 ? [jointTop, jointBottom] : [jointBottom, jointTop];
      pts.push(
        new THREE.Vector3(x, a, c.z + 0.026).addScaledVector(VIEW_CAM, 0.07),
        new THREE.Vector3(x, b, c.z + 0.026).addScaledVector(VIEW_CAM, 0.07),
      );
      if (i < 3) pts.push(new THREE.Vector3(c.x + (i - 0.5) * (boardW + DOOR_GAP), b, c.z + 0.026).addScaledVector(VIEW_CAM, 0.07));
    }
    runs.add(mark(pts, ink, 'form'));
  }

  // DELTA: pathProps' door is a voussoir arch — a contour cue only, added on top of
  // the unchanged 5-board leaf rather than reshaping it.
  if (opts.arched) {
    runs.add(arc(new THREE.Vector3(c.x, jambH, c.z), width / 2, height * 0.28, 0, Math.PI, ink, hand(0xd00a), 'form', 0.06));
  }
  g.add(runs);

  // DELTA: pathProps' door has an iron ring handle; the mock has none.
  if (opts.ringHandle) {
    const ironMat = (token: number) => createTrilayer({ color: token, wear: 0.15, stroke: { dir: 0.5, sheet: true } });
    const mount = put(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 6), {
      pos: [c.x + width / 2 - 0.18 * sx, leafY - height * 0.3, c.z + 0.025],
      rot: [Math.PI / 2, 0, 0],
    });
    const ring = put(new THREE.TorusGeometry(0.07, 0.014, 5, 10), {
      pos: [c.x + width / 2 - 0.18 * sx, leafY - height * 0.3 - 0.07, c.z + 0.04],
      rot: [0.25, 0, 0],
    });
    const mountMesh = new THREE.Mesh(mount, ironMat(IRON_SHADE));
    const ringMesh = new THREE.Mesh(ring, ironMat(IRON_LIT));
    mountMesh.castShadow = mountMesh.receiveShadow = true;
    ringMesh.castShadow = ringMesh.receiveShadow = true;
    g.add(mountMesh, ringMesh);
  }

  return g;
}

export interface SignBoard {
  width: number;
  height: number;
  thickness: number;
  /** offset from `center`, in x/y. */
  x: number;
  y: number;
  /** pointing direction, as a full Euler — pathProps.ts points its boards down different legs. */
  rot: [number, number, number];
  tok: 'plank' | 'plankLit' | 'plankShade';
  /** draw a construction-outline mark on this board — the mock marks only the top board. */
  marked?: boolean;
}

export interface SignpostOpts {
  center?: THREE.Vector3;
  post?: { width?: number; height?: number; depth?: number; rot?: [number, number, number] };
  /** Default: the mock's committed two boards (RULING 4 — "post + 2 boards"). */
  boards?: SignBoard[];
}

/**
 * The signpost: a post + boards. Ported verbatim from mock/plank.ts's "6 · the
 * signpost" (RULING 4) — same post/board dimensions, same tiers, same dir (1.42) and
 * wear (0.24). `boards` exposes count and pointing direction (`rot`) because
 * pathProps.ts (tomorrow) points its boards down different legs of the path; the
 * mock's two just lean with the post.
 *
 * DELTA from pathProps.ts's hand-rolled signpost (`sets/pathProps.ts`, ~line 350-423,
 * READ ONLY): pathProps also builds a cap, 2 rope lashes, a base contact blob and a
 * back-pointer cone. None of those are in the "post + 2 boards" recipe RULING 4 names,
 * so none are ported here — that is pathProps.ts's own addition, left for the
 * follow-up wiring task.
 */
export function buildSignpost(opts: SignpostOpts = {}): THREE.Group {
  const c = opts.center ?? new THREE.Vector3();
  const post = { width: 0.075, height: 1.35, depth: 0.075, rot: [0, 0.3, 0.03] as [number, number, number], ...opts.post };
  const boards: SignBoard[] = opts.boards ?? [
    { width: 0.62, height: 0.19, thickness: 0.04, x: 0.16, y: 1.14, rot: [0, 0.3, -0.02], tok: 'plankLit', marked: true },
    { width: 0.5, height: 0.15, thickness: 0.04, x: 0.12, y: 0.9, rot: [0, 0.3, 0.03], tok: 'plank' },
  ];
  const postY = post.height * (0.68 / 1.35); // 0.68 at the default post height

  const byTok = new Map<number, THREE.BufferGeometry[]>();
  const addB = (tok: number, geom: THREE.BufferGeometry) =>
    (byTok.get(tok) ?? byTok.set(tok, []).get(tok)!).push(geom);

  addB(DOOR_TOK.plankShade, put(boardGeom(post.width, post.height, post.depth), { pos: [c.x, postY, c.z], rot: post.rot }));

  const runs = new THREE.Group();
  for (const b of boards) {
    addB(DOOR_TOK[b.tok], put(boardGeom(b.width, b.height, b.thickness), { pos: [c.x + b.x, b.y, c.z], rot: b.rot }));
    if (b.marked) runs.add(mark(boxRun(b.width, b.height, b.thickness, new THREE.Vector3(c.x + b.x, b.y, c.z)), ink, 'form'));
  }

  const g = new THREE.Group();
  for (const [tok, list] of byTok) {
    const mesh = new THREE.Mesh(merge(list), tintedPlankMat(tok, 1.42));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  g.add(runs);
  return g;
}
