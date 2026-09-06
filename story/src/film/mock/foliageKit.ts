// FLORA AND SKY — the shared hand behind mock/foliage.ts, mock/bark.ts and mock/sky.ts.
// Author 2's file (stem `foliage`); nothing outside those three imports it.
//
// It carries exactly what the three classes have in common and nothing speculative:
// the view basis the hero authors its contours in, one deterministic hand, the two
// canvas bakes those classes own, a geometry merger (instancing is BANNED — art bible
// §11.7 gate 4), and a stroke batcher that turns N authored runs into ONE draw call
// per (weight × register).
//
// THE ONE MECHANISM ADDED HERE, and the reason: hero.ts builds every tree TWICE — a
// painted copy east of the seam in `ink`, a graphite copy west of it in `graphiteDark`
// (hero.ts:916–1050, `style: 'painted' | 'graphite'`). On the mock route the seam is
// parked at 1e6, so the curtain alone decides the state and a fixed-colour stroke
// cannot follow it. `strokeMaterial()` below patches the shipped LineMaterial the same
// way R14 patches the flame: it mixes toward the drawn register by `rig.curtain` TAKEN
// BY IDENTITY, so any partial curtain is a coherent held frame by construction. One
// tree then carries both truths, and the film body needs half the tree geometry the
// hero spends.

import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { polyline, roughen, STROKE_LAYER, type Weight } from '../pencil.ts';
import { createTrilayer, rig } from '../stages/trilayer.ts';
import { HERO_AZ, HERO_ELEV } from '../heroView.ts';
import * as P from '../palette.ts';

// ---- the hand ---------------------------------------------------------------------
// Deterministic: the same painting and the same wobble on every load. Gate 6 bans
// runtime Math.random outright, and a re-randomising bake shimmers on reload.
let seed = 0x51a3f07;
export function krand(): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** Re-seed so each class's bake is identical whatever order the route loads them in. */
export function kseed(s: number): void {
  seed = s | 0;
}

/**
 * MEASURED ROUTE DEFECT, and the reason this exists.
 *
 * MockSheet.tsx:105 parks the seam at 1e6 so "the curtain alone decides the state and
 * the comparison is like-for-like". It does not stick: read live off the island drop
 * shadow's own `uSeamX` (which is `rig.seamX` by identity) on a freshly navigated
 * `?mock=foliage`, the value is **1.0 with curtain 0.0** — `buildHero()`'s
 * `stageHeroRig()` (hero.ts:1405 → :1797) wins the StrictMode mount race against the
 * route's own effect. Every mock is placed at x ≥ 6.4, the seam's drawn side, so under
 * rig A EVERY class in this route renders in the DRAWN register and no author can see
 * their paint at all.
 *
 * This is one line in a file no mockup author owns, so it is written down as a handoff
 * (MOCK-2.md finding F0) and parked here instead — idempotently, to the value the route
 * already asks for, at build time. Nothing else about the rig is touched.
 */
export function parkSeam(): void {
  if (rig.seamX.value < 1e5) rig.seamX.value = 1e6;
}

export const mixHex = (a: number, b: number, t: number) => {
  const ch = (h: number, s: number) => (h >> s) & 255;
  const m = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};
export const css = (hex: number) => '#' + hex.toString(16).padStart(6, '0');
export const rgba = (hex: number, a: number) =>
  `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;

// ---- the shot's view plane (hero.ts:665–673, re-derived from the exported angles) ---
// A drawn silhouette lives where THIS lens sees the form's edge. VIEW_R is screen-right
// on the ground plane; VIEW_CAM points at the camera, so a mark pushed along it keeps
// its screen position and wins the depth test against the solid it annotates.
export const VIEW_R = new THREE.Vector3();
export const VIEW_CAM = new THREE.Vector3();

/**
 * POINT THE HAND AT A DIFFERENT LENS. §3.6 — contour marks are authored in the SHOT's
 * view plane, and the mock route's shot is the hero's while the film body's is not: S3's
 * follow camera rides `(sx − 3.2, 1.6, 2.8)` looking at `(sx, 0.8, 0)`, which is 31° round
 * from `HERO_AZ` and, decisively, on the OTHER SIDE of the trees. Authored at the hero's
 * basis the crowns' contour push would drive every arc INTO the mass instead of toward
 * the lens, and the class would ship with its drawn half invisible.
 *
 * Build-time only, exactly like `parkSeam()` above: a builder sets the basis, builds, and
 * calls `setView()` with no argument to hand the hero's lens back. `VIEW_R`/`VIEW_CAM`
 * stay the same two objects, so every existing importer keeps reading them by identity.
 */
export function setView(az: number = HERO_AZ, elev: number = HERO_ELEV): void {
  VIEW_R.set(Math.cos(az), 0, Math.sin(az));
  VIEW_CAM.set(
    Math.sin(az) * Math.cos(elev),
    Math.sin(elev),
    -Math.cos(az) * Math.cos(elev),
  );
}
setView();

/**
 * A timeline `cut(t, cam, look)`'s (az, elev), in the convention `setView`/`setMarksView`
 * actually expect — NOT the plan §4.4 literal `atan2(cz−fz, cx−fx)`, which is the standard
 * atan2(z,x) angle of the (dx,dz) vector and lands 90° away from what `VIEW_CAM` above
 * solves for. Solving `VIEW_CAM`'s x/z rows for az shows the kit measures az off −Z toward
 * +X: `az = atan2(dx, −dz)` (`= atan2(cz−fz, cx−fx) + 90°`). Elevation is untouched — both
 * conventions agree on `atan2(dy, hypot(dx,dz))`. Verified 2026-09-06
 * (`scripts/measure/basis-check.mjs`): reproduces `HERO_AZ`/`HERO_ELEV` from the hero's own
 * camera to 1e-13°, and the plan's literal formula is ~90° off `VIEW_CAM`'s true "toward
 * camera" axis on every timeline shot checked.
 */
export function shotView(
  cam: [number, number, number],
  look: [number, number, number],
): { az: number; elev: number } {
  const dx = cam[0] - look[0];
  const dy = cam[1] - look[1];
  const dz = cam[2] - look[2];
  return { az: Math.atan2(dx, -dz), elev: Math.atan2(dy, Math.hypot(dx, dz)) };
}

/** Points of a drawn arc in the view plane: angle 0 = screen-right, π/2 = up. */
export function arcPts(
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  push = 0.15,
  n = 16,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const j = 1 + (krand() - 0.5) * 0.06;
    const h = Math.cos(a) * rx * j;
    pts.push(
      new THREE.Vector3(cx + VIEW_R.x * h, cy + Math.sin(a) * ry * j, cz + VIEW_R.z * h)
        .addScaledVector(VIEW_CAM, push),
    );
  }
  return pts;
}


// ---- strokes that follow the curtain ----------------------------------------------
// `register`: PAINT draws in `ink` and mixes to `graphiteDark` as the curtain rises —
// one contour, two truths. PREP is graphite and fades UP from nothing, so the interior
// leaf arcs (hero.ts:990–995, graphite-only there) arrive with the drawing instead of
// cluttering the paint.
export type Register = 'paint' | 'prep' | 'flat' | 'flatLight';

// base = the colour under Performance · prep = the colour at curtain 1 · a0/a1 = its
// presence at either end. `paint` is a contour that follows the curtain; `prep` is a
// mark that belongs to the drawing only; `flat` is graphite that is graphite in every
// state, which is what the standing sheet's brace and slot line are.
const REGISTERS: Record<Register, { base: number; prep: number; a0: number; a1: number }> = {
  paint: { base: P.ink, prep: P.graphiteDark, a0: 1, a1: 1 },
  prep: { base: P.graphite, prep: P.graphite, a0: 0, a1: 1 },
  flat: { base: P.graphite, prep: P.graphite, a0: 1, a1: 1 },
  flatLight: { base: P.graphiteLight, prep: P.graphiteLight, a0: 1, a1: 1 },
};

const STROKE_GLSL_FROM = 'gl_FragColor = vec4( diffuseColor.rgb, alpha );';
const STROKE_GLSL_TO = /* glsl */ `
  float aCur = alpha * mix(uStrokeA0, uStrokeA1, uStrokeCurtain);
  if (aCur < 0.02) discard;
  gl_FragColor = vec4( mix(diffuseColor.rgb, uStrokePrep, uStrokeCurtain), aCur );`;

const strokeMats = new Map<string, LineMaterial>();
const bufSize = new THREE.Vector2();

/**
 * A LineMaterial clone whose colour and presence ride `rig.curtain` by identity.
 *
 * It cannot go through `paint()`: that caches ONE shared variant per (weight, colour)
 * for the whole film, so patching the `ink`/`form` variant would drain every hero
 * stroke with it. A private clone is the correct blast radius — the cost is that
 * pencil.ts's `setPencilResolution` never sees it, which `onBeforeRender` pays below.
 */
export function strokeMaterial(w: Weight, reg: Register): LineMaterial {
  const key = w + ':' + reg;
  const hit = strokeMats.get(key);
  if (hit) return hit;
  // the shipped weight tier, with its SCALE and alphaToCoverage, straight off pencil.ts
  const probe = polyline([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)], w);
  const m = (probe.material as LineMaterial).clone();
  probe.geometry.dispose();
  const R = REGISTERS[reg];
  m.color = new THREE.Color(R.base);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uStrokeCurtain = rig.curtain;
    shader.uniforms.uStrokePrep = { value: new THREE.Color(R.prep) };
    shader.uniforms.uStrokeA0 = { value: R.a0 };
    shader.uniforms.uStrokeA1 = { value: R.a1 };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uStrokeCurtain;\nuniform vec3 uStrokePrep;\nuniform float uStrokeA0;\nuniform float uStrokeA1;',
      )
      .replace(STROKE_GLSL_FROM, STROKE_GLSL_TO);
  };
  // every patched weight compiles to one program — the knobs are uniforms
  m.customProgramCacheKey = () => 'strokeCurtain';
  m.userData.role = 'strokeCurtain';
  strokeMats.set(key, m);
  return m;
}

/**
 * Authored runs in, ONE draw call per (weight × register) out.
 *
 * `polyline()` is the film's wobble pipeline and every run goes through it; the runs
 * are then merged by concatenating the interleaved segment buffers `setPositions`
 * built, which is the same flat [ax,ay,az,bx,by,bz] the hand wrote. Nine contour arcs
 * on seven trees is 63 draws unmerged and 1 merged.
 */
export class StrokeBag {
  private runs = new Map<string, number[]>();

  /** `m` bakes a transform into the run, so marks authored in a prop's own frame still
   *  land in ONE merged draw with everything else. */
  add(points: THREE.Vector3[], w: Weight = 'form', reg: Register = 'paint', m?: THREE.Matrix4): this {
    if (points.length < 2) return this;
    const line = polyline(m ? points.map((p) => p.clone().applyMatrix4(m)) : points, w);
    const attr = line.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute;
    const src = attr.data.array as ArrayLike<number>;
    const key = w + ':' + reg;
    let out = this.runs.get(key);
    if (!out) this.runs.set(key, (out = []));
    for (let i = 0; i < src.length; i++) out.push(src[i]);
    line.geometry.dispose();
    return this;
  }

  build(): THREE.Group {
    const g = new THREE.Group();
    for (const [key, positions] of this.runs) {
      if (!positions.length) continue;
      const [w, reg] = key.split(':') as [Weight, Register];
      const geom = new LineSegmentsGeometry();
      geom.setPositions(positions);
      const mat = strokeMaterial(w, reg);
      const line = new LineSegments2(geom, mat);
      line.computeLineDistances();
      line.layers.set(STROKE_LAYER);
      // pencil.ts only resizes the materials IT owns; these are private clones, so they
      // take the viewport off the renderer at draw time. Without it every stroke here
      // renders at whatever width the last resize left, which on a resize is the wrong
      // weight and on first paint is zero.
      line.onBeforeRender = (renderer) => {
        renderer.getSize(bufSize);
        if (!mat.resolution.equals(bufSize)) mat.resolution.copy(bufSize);
      };
      g.add(line);
    }
    return g;
  }
}

// ---- geometry -----------------------------------------------------------------------
/** Bake a transform into the vertices and hand back the geometry, ready to merge. */
export function placed(
  geom: THREE.BufferGeometry,
  x: number,
  y: number,
  z: number,
  rotY = 0,
  rotZ = 0,
): THREE.BufferGeometry {
  if (rotZ) geom.rotateZ(rotZ);
  if (rotY) geom.rotateY(rotY);
  geom.translate(x, y, z);
  return geom;
}

/** One BufferGeometry per class per island — gate 4. Never an InstancedMesh. */
export function merged(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(list, false);
  if (!g) throw new Error('merge failed — mismatched attributes');
  for (const s of list) s.dispose();
  return g;
}

/** Remap the v of every UV into [v0, v1] — how two families share one 512² tile. */
export function uvBand(
  geom: THREE.BufferGeometry,
  v0: number,
  v1: number,
  uScale = 1,
): THREE.BufferGeometry {
  const uv = geom.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) {
    uv.setX(i, uv.getX(i) * uScale);
    uv.setY(i, v0 + uv.getY(i) * (v1 - v0));
  }
  uv.needsUpdate = true;
  return geom;
}

/**
 * THE u-SCALE THAT HOLDS ROW 5'S OWN TEXEL DENSITY ON A LOBE OF ANY SIZE.
 *
 * A sphere wraps the tile ONCE around its circumference, so the density is
 * 512 / (2*PI*r) — 291 tex/u on the hero's r 0.28 crown lobe, which is the 272 row 5
 * verifies, and 900+ on a 0.09-u pine bough. At 900 tex/u the leaf masses are finer than
 * the lens can resolve and the tile stops reading as marks; the tile is therefore scaled
 * to the density it was authored at instead: uSpan = 272*2*PI*r/512, clamped at 1 so a
 * hero-sized lobe is untouched. A 0.09-u bough shows a third of the tile rather than all
 * of it, its 38–72-texel leaf masses land 0.14–0.26 u across, and the crown carries the
 * bake as the VALUE STRUCTURE the row asks for — the same answer groundKit's bakeRockFace
 * note already reaches for small rocks.
 *
 * THIS IS NOT WHAT THE "PLAID" WAS, and the docstring that claimed it was has been
 * corrected rather than restated. The crown lattice measured at S4 t37.1 survived the map
 * being replaced by a 4×4 solid and survived mipmaps being turned off with LinearFilter,
 * so it was never a sampling or a mip-selection artefact; it disappeared only when
 * `material.color` was forced to white. The cause was the class token being re-applied on
 * top of a bake that already carried the pigment — see `sets/kit.ts`'s `tri()`. `uScale`
 * is a density control and nothing more.
 */
export const lobeUScale = (r: number) => Math.min(1, 3.34 * r);

// ---- bakeFoliage ---------------------------------------------------------------------
// 512², TWO BANDS: oak in v ∈ [0.5, 1], pine in v ∈ [0, 0.5]. One texture, one MiB,
// exactly the census's allocation — and the reason is in §11.6's own numbers rather
// than in taste. See MOCK-2.md: the census gives `crownPine` the shipped
// `bakeFoliage` map with a "needle tint", but `mapped()` (hero.ts:634) drops the
// fallback colour the moment a map exists, so that tint is inert in the shipped code
// and oak and pine render the same green. Two bands cost nothing and land it.
//
// SCREEN-SPACE, first as §1's law requires. A crown lobe here is r 0.52–0.72 u; a
// sphere's u wraps the tile once around its circumference, so 512 / (2π·0.55) = 148
// texels/unit. The mock route frames at ~45–75 px/u, so a cluster needs
// 25 px · 148/73 = 51 texels to hold the ≥25 px cluster law at the film's wide
// framing. Clusters are authored at r 38–72. Halving the v range at the same time as
// the pixel range leaves the density ISOTROPIC (512 tex per unit-u AND per unit-v) —
// the full-tile mapping was 2:1 anisotropic and its round dabs rendered squashed.
function bakeBand(
  ctx: CanvasRenderingContext2D,
  y0: number,
  h: number,
  w: number,
  deep: number,
  mid: number,
  lit: number,
): void {
  const s = w / 512; // every authored radius below is in 512-tile texels
  const g = ctx.createLinearGradient(0, y0 + h, 0, y0);
  g.addColorStop(0, css(deep));
  g.addColorStop(1, css(mid));
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, w, h);
  // FEWER, BIGGER (§11.2 row 23's doctrine, and the cluster law above): ten committed
  // leaf masses, each a dark under-mass with lit dabs on its upper shoulder — never a
  // field of small dabs, which projects as out-of-focus noise.
  for (let c = 0; c < 10; c++) {
    const cx = krand() * w;
    const cy = y0 + h * (0.12 + krand() * 0.76);
    const cr = (38 + krand() * 34) * s;
    // PASS 3 → 4: the under-mass ran 0.42–0.66α and the crowns came out a soft mid-green
    // with no committed dark, so poster 12 had nothing to quantize and the lobes read as
    // shaded spheres. C5 wants ≥3 tiers ≥25 luma apart IN THE PAINT; 0.62–0.92 is what
    // puts them there, and the second inner dark is the third tier.
    ctx.fillStyle = rgba(deep, 0.62 + krand() * 0.3);
    ctx.beginPath();
    ctx.ellipse(cx, cy + cr * 0.22, cr, cr * 0.74, -0.3 + krand() * 0.6, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = rgba(deep, 0.55);
    ctx.beginPath();
    ctx.ellipse(cx + cr * 0.22, cy + cr * 0.5, cr * 0.55, cr * 0.34, 0.2, 0, 6.3);
    ctx.fill();
    // the key is at +18°: the lit leaves gather on the upper shoulder, one arc of it
    for (let i = 0; i < 5; i++) {
      const a = -2.6 + (i / 4) * 1.85 + (krand() - 0.5) * 0.28;
      const rr = cr * (0.42 + krand() * 0.46);
      ctx.fillStyle = rgba(krand() < 0.5 ? lit : mid, 0.66 + krand() * 0.28);
      ctx.beginPath();
      ctx.ellipse(
        cx + Math.cos(a) * rr,
        cy + Math.sin(a) * rr * 0.8,
        (15 + krand() * 12) * s,
        (10 + krand() * 8) * s,
        -0.4 + krand() * 0.8,
        0,
        6.3,
      );
      ctx.fill();
    }
    // wrap redraw: a cluster crossing the left edge repaints on the right, so the tile
    // is seamless in u (bakeStrokeTiles' own trick, trilayer.ts:115–150)
    if (cx < cr) {
      ctx.fillStyle = rgba(deep, 0.5);
      ctx.beginPath();
      ctx.ellipse(cx + w, cy + cr * 0.22, cr, cr * 0.74, 0, 0, 6.3);
      ctx.fill();
    }
  }
}

const foliageTexes = new Map<string, THREE.CanvasTexture | null>();

/**
 * THE BAND'S THREE STOPS, DERIVED FROM THE CROWN'S OWN TOKEN — the fix for a §4.5 defect
 * that the ruling makes explicit: "never a fresh hue" binds on WHAT REACHES THE SCREEN,
 * not on the authoring mechanism, so a bake's band stop that renders is a colour in the
 * film and must land on a committed token or a two-token `mixHex`.
 *
 * WHAT WAS WRONG, and it is arithmetic. `sets/kit.ts`'s `tri()` divides the class token by
 * the bake's base (`mapBase`) and multiplies the tile back in, so what renders at a stop is
 * `token / mapBase × stop`. That is the token EXACTLY at the band's mid — but at the deep
 * and lit stops it is a three-way product that lands wherever it lands. One base per bake
 * therefore only holds §4.5 for the ONE token the base was authored for:
 *
 *   pine band, mapBase `needle`, ten crowns placed at `canopy` (ambush, montage):
 *     lit   `#7F9877` → renders **#A9BB63** — no token, no two-token mix. OFF PALETTE.
 *     deep  `#4A7246` → renders  #648D39 — likewise.
 *   oak band, mapBase `canopy`, retinted to `canopyDeep` by `paint()` (ambush, cliffWorld):
 *     lit   `#98AF73` → renders  #69895B — likewise. The same class of lift, older.
 *
 * The bases are therefore PER TOKEN, not one per bake: every crown token gets a tile whose
 * mid IS that token, so the ratio is unity and all three stops render exactly as authored —
 * a committed token or a two-token `mixHex`, by construction, for any token the film asks
 * for. `crownFamily` is that authoring, and `bakeFoliage` is keyed on it.
 *
 * COST, stated openly: one 512² RGBA tile per DISTINCT crown token instead of one tile
 * total. The film asks for three (`canopy`, `canopyDeep`, `needle`) plus the mushroom cap's
 * deliberate hue transform, which keeps `canopy` as its base and so re-uses that tile — so
 * 3.00 MiB where §11.6 carries 1.00 MiB for `bakeFoliage`. Reproduce it by counting
 * `foliageTexes.size` after S4 settles.
 *
 * The `canopy` family is TODAY'S oak band unchanged, stop for stop, so the shipped oak at
 * its own token does not move. The measured `triTone` of every stop, taken WITH the map
 * multiply (`triAlbedo = material.color × map`, trilayer.ts:549) and against the tier
 * boundaries 0.14 / 0.30 / 0.46 / 0.62, with the clearance each keeps from the nearest —
 * every one clear of trilayer.ts:377's ±0.03 world noise:
 *
 *   canopy      deep #466F33 0.7005 t4 (0.081) · mid #678E42 0.5586 t3 (0.061) · lit #98AF73 0.3856 t2 (0.074)
 *   canopyDeep  deep #3B582E 0.7937 t4 (0.174) · mid #466F33 0.7005 t4 (0.081) · lit #708E59 0.5475 t3 (0.073)
 *   needle      deep #446347 0.7423 t4 (0.122) · mid #4C7350 0.6760 t4 (0.056) · lit #728E6D 0.5411 t3 (0.079)
 */
export function crownFamily(base: number): { deep: number; mid: number; lit: number } {
  // The three the film places. Authored rather than derived because the oak's dark IS the
  // committed `canopyDeep` token and no generic recipe reproduces that exactly.
  if (base === P.canopy) return { deep: P.canopyDeep, mid: base, lit: mixHex(P.canopy, P.flameCore, 0.34) };
  // `canopyDeep` is already the family's dark, so its own deep steps toward `ink`; and its
  // lit sits at 0.24, not the oak's 0.34: at 0.34 it renders triTone 0.4810, which is 0.021
  // from the t2/t3 boundary at 0.46 and so inside trilayer.ts:377's ±0.03 world noise —
  // the tier would wander across the lit part of every crown. 0.24 clears it by 0.073, and
  // it clears DOWNWARD (quieter), which is also what keeps the lit dabs from reading as
  // pale blotches on a tier the size of one cluster (walked at ?mock=foliage zoom 4).
  if (base === P.canopyDeep) return { deep: mixHex(P.canopyDeep, P.ink, 0.3), mid: base, lit: mixHex(P.canopyDeep, P.flameCore, 0.24) };
  // needle: mix(needle, canopyDeep, 0.35) was 0.007 of triTone from the mid — no under-mass
  // at all once poster 12 quantized them into the same tier. Toward `ink` instead, and the
  // lit at 0.22 clears the 0.46 boundary by 0.079 (at 0.30 it renders 0.4911 — 0.031, ON
  // the noise). Same reason as canopyDeep for clearing downward rather than up.
  if (base === P.needle) return { deep: mixHex(P.needle, P.ink, 0.2), mid: base, lit: mixHex(P.needle, P.flameCore, 0.22) };
  return { deep: mixHex(base, P.ink, 0.26), mid: base, lit: mixHex(base, P.flameCore, 0.4) };
}

/**
 * ROW 5 · CHANNEL F. The tile is authored ONCE at 512 texels — the row's own figure,
 * and the film takes it unchanged.
 *
 * THE "PLAID", MEASURED AND CLOSED, AND THE 128 DOWNGRADE WITHDRAWN. The A/B that shipped
 * the 128 tile read a MINIFICATION cause off "map on vs map off" alone, which cannot
 * separate the map's resolution from the map's presence. Run out properly at S4 t37.1, the
 * same crop, four renders: (a) `map = null` → crowns clean; (b) the map replaced by a 4×4
 * SOLID → lattice still there, so it is not the tile's content; (c) `generateMipmaps
 * false` + `LinearFilter` → lattice still there, so it is not mip selection; (d) the real
 * bake kept and `material.color` forced to white → lattice completely gone. The cause was
 * `sets/kit.ts`'s `tri()` re-applying the class token on top of a bake that already
 * carries the pigment: `canopy × canopy` is `#254C0A`, four times too dark in linear
 * luminance, which pins the crown to tier 4 and lets poster 12 quantize each flat quad of
 * the sphere into its own bin — a lattice at the tessellation's frequency. That is fixed
 * where it lives.
 *
 * So the resolution goes back to the row's 512, and `lobeUScale` (above) is what holds the
 * row's verified **272 tex/u** on a lobe of any size. At 128 the same lobe sampled 68
 * tex/u — a quarter of the verified figure — with no amendment to row 5 recording it.
 * `size` stays a parameter because the map is keyed and cached per edge; nothing in the
 * film or the route now asks for anything but 512. `base` is the crown token the tile is
 * painted FOR — see `crownFamily` for why there is one tile per token.
 */
export function bakeFoliage(size = 512, base = P.canopy): THREE.CanvasTexture | null {
  const key = `${size}:${base}`;
  const hit = foliageTexes.get(key);
  if (hit !== undefined) return hit;
  if (typeof document === 'undefined') { foliageTexes.set(key, null); return null; }
  kseed(0x51a3f07);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const f = crownFamily(base);
  // flipY is on, so v in [0.5, 1] is the TOP half of the canvas: the oak's lobes take that
  // half and the pine's cones the lower one. Both bands carry the SAME family — the tile is
  // keyed per token now, so the split is no longer oak-vs-pine PIGMENT, it is two separate
  // draws of the same recipe, which keeps a cone and a lobe standing side by side from
  // showing the identical cluster layout.
  bakeBand(ctx, 0, size / 2, size, f.deep, f.mid, f.lit);
  bakeBand(ctx, size / 2, size / 2, size, f.deep, f.mid, f.lit);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping; // the bands must never bleed into each other
  // anisotropy 1: a crown lobe is a sphere whose u compresses to nothing at its own
  // silhouette, and an anisotropic tap reads a sharper mip along that axis. Trilinear
  // costs a 60-px crown nothing it can resolve.
  tex.anisotropy = 1;
  foliageTexes.set(key, tex);
  return tex;
}

/** The film's crowns: row 5's tile at row 5's edge, the same one the route draws. */
export const bakeFoliageFilm = (base = P.canopy) => bakeFoliage(512, base);

// ---- bakeBark ------------------------------------------------------------------------
// 128² → 256², the film's ONE re-bake, and the reason is arithmetic (§11.2 row 6).
// A trunk here is r 0.10–0.20 u → circumference 0.63–1.26 u under one tile wrap, so
// 256 / 1.0 ≈ 256 texels/unit. At the film's 133 px/u figure floor a 3-texel streak is
// 1.6 screen px at 128² — under the 2 px floor — and 3.1 px at 256². The streaks below
// are 3–9 texels wide for that reason and no other.
let barkTex: THREE.CanvasTexture | null | undefined;
export function bakeBark(): THREE.CanvasTexture | null {
  if (barkTex !== undefined) return barkTex;
  if (typeof document === 'undefined') return (barkTex = null);
  kseed(0x2b17d9);
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = css(P.timber);
  ctx.fillRect(0, 0, size, size);
  // THE COMMITTED SHADE SIDE, and it costs nothing because of where it lives. u wraps
  // exactly ONCE around a trunk, so a value band across the tile's u IS a band around
  // the trunk — a lit side, a mid, and a shade side baked into the albedo, the same
  // three tiers every other painted mass in the film carries. Lambert alone gave one
  // smooth gradient and the trunks read as polished dowels (pass 3); poster cannot fix
  // that, it quantizes the gradient AND swallows the grain with it, which is why row 6
  // is right to say poster 0 and why this band is the actual answer. It is laid FIRST:
  // over the streaks (pass 5) its own 0.5 alpha halved their contrast and took the grain
  // back out — the band is the ground the grain is drawn on, not a glaze over it.
  const band = ctx.createLinearGradient(0, 0, size, 0);
  band.addColorStop(0, rgba(P.timberDark, 0.12));
  band.addColorStop(0.18, rgba(mixHex(P.timber, P.flameCore, 0.45), 0.5));
  band.addColorStop(0.44, rgba(P.timber, 0));
  band.addColorStop(0.72, rgba(P.timberDark, 0.46));
  band.addColorStop(1, rgba(P.timberDark, 0.12));
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, size, size);
  ctx.lineCap = 'round';
  // ONE direction, along the grain — never a crossing pass (gate 1). The streaks run
  // the full height and wrap, so the trunk's UV v carries them along its own length.
  for (let i = 0; i < 46; i++) {
    const x = krand() * size;
    const dark = krand() < 0.68;
    // PASS 2: at 0.2–0.5α over a timber base the grain was invisible at set scale — the
    // trunks read as smooth brown tubes. 0.34–0.72α and 4–11 texels is what makes a
    // 220-texel/unit trunk carry a 2.5–5 screen-px streak at the film's framings.
    ctx.strokeStyle = rgba(dark ? P.timberDark : P.plank, 0.45 + krand() * 0.4);
    ctx.lineWidth = 6 + krand() * 8;
    ctx.beginPath();
    ctx.moveTo(x, -8);
    ctx.bezierCurveTo(
      x + (krand() - 0.5) * 16,
      size * 0.33,
      x + (krand() - 0.5) * 16,
      size * 0.66,
      x + (krand() - 0.5) * 12,
      size + 8,
    );
    ctx.stroke();
    if (x < 12 || x > size - 12) {
      ctx.beginPath();
      ctx.moveTo(x < 12 ? x + size : x - size, -8);
      ctx.lineTo(x < 12 ? x + size : x - size, size + 8);
      ctx.stroke();
    }
  }
  // four committed lenticels — the mark that says "this is a skin, not a stripe field"
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = rgba(P.timberDark, 0.34);
    ctx.beginPath();
    ctx.ellipse(krand() * size, krand() * size, 14 + krand() * 10, 4 + krand() * 3, 0, 0, 6.3);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // MIPPED, as the census budgets it. Unmipping was tried on the live route to recover
  // the grain and changed nothing measurable: the trunk sits at 1.5–3 texels per screen
  // pixel, so mip level 1 was never the reason the grain is quiet. The reason is
  // CONTRAST — see MOCK-2.md finding F5. Anisotropy 8 for the grazing edge of a lathe.
  tex.anisotropy = 8;
  return (barkTex = tex);
}

// ---- the trunk, shared by mock/foliage.ts and mock/bark.ts ---------------------------
/**
 * One trunk, limb or post as geometry, transform baked in, ready to merge.
 * `(x, y, z)` is the BASE — the end that meets the ground or its parent — not the
 * centre: pass 1 built limbs about their own midpoint and they came out as fallen logs
 * skewered through the trunk. `lean` tips it in the x/y plane, `leanDir` swings that
 * lean around y, so one call places a leaning post and a limb alike.
 */
export function trunkGeom(
  rTop: number,
  rBot: number,
  len: number,
  x: number,
  y: number,
  z: number,
  lean = 0,
  leanDir = 0,
): THREE.BufferGeometry {
  // 9 segments, the hero's own count: a faceted lathe gives Lambert something to step
  // ON, and a smoother one just makes the dowel rounder.
  // CLOSED, not open-ended: at the hero's +33° elevation an open cylinder shows the
  // inside of its own top and a trunk reads as a drainpipe (pass 1). Segments 11, and
  // a light roughen, because a 2.6-u dead-straight lathe at set scale is a ruled line
  // and this world has none.
  // heightSegments from the trunk's own length, and this is the whole reason a lathe
  // stops being a dowel: at the default 1 there are exactly TWO rings of vertices, so
  // roughen() has nothing to displace between the ends and every pass of amplitude
  // tuning was tuning nothing (passes 3–5). ~3 rings per world unit is enough for the
  // lumps to land and cheap enough that seven trunks cost ~1 000 triangles.
  const g = new THREE.CylinderGeometry(rTop, rBot, len, 9, Math.max(3, Math.round(len * 3)), false);
  // u wraps ONCE around the trunk, as the hero's does — seamless, and it makes an old
  // thick trunk's grain coarser than a sapling's for free, which is what bark does.
  // v then repeats len/circumference times so a streak is the same world width AS it
  // is long: at v ∈ [0,1] over a 2.6-u trunk the tile stretches 2:1 and the grain
  // reads as smeared toffee. Measured floor: below r ≈ 0.09 u the streaks fall back
  // under 2 screen px even at 256² — see MOCK-2.md finding F5.
  const circ = Math.PI * (rTop + rBot);
  const uv = g.getAttribute('uv');
  // v repeats len/circumference times so a streak is as wide as it is long — but CAPPED,
  // because a slim pole (circ 0.35 u) would otherwise repeat 4.9× and land 728 texels on
  // a world unit: 5.6 texels per screen pixel, mip level 2.5, and the grain mushes to a
  // flat brown. The cap holds every trunk in the film at ≤ 300 texels/unit.
  const vRep = Math.min(len / Math.max(circ, 1e-3), (len * 300) / 256);
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * vRep);
  uv.needsUpdate = true;
  // amp 0.22 of the radius at frequency 2.2 — lumps every ~0.45 u, which is a trunk.
  // Pass 4 used 2.6/rBot ≈ 12, and a frequency that high displaces every vertex
  // independently: computeVertexNormals then averages the crinkle straight back out and
  // the lathe comes back a polished dowel. The frequency is what makes a mass, not the
  // amplitude.
  roughen(g, rBot * 0.22, 2.2, Math.round((x * 31 + z * 17 + len * 7) * 10));
  g.translate(0, len / 2, 0); // base at the origin, so the caller places the FOOT
  return placed(g, x, y, z, leanDir, lean);
}

/** The two tapering side strokes that say "trunk" — hero.ts:938–953. */
export function trunkSideRuns(
  x: number,
  z: number,
  r0: number,
  r1: number,
  y0: number,
  y1: number,
  dx = 0,
  dz = 0,
  push = 0.14,
): THREE.Vector3[][] {
  // dx/dz are the TOP's offset from the foot. A trunk that leans and a side stroke that
  // does not is the single loudest registration error this class can make: pass 3 ran
  // the strokes vertically past a 0.09-rad pole and they read as stray wire 12 px clear
  // of the wood.  computes the offset from the same lean the geometry took.
  const runs: THREE.Vector3[][] = [];
  for (const side of [-1, 1]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const r = side * (r0 + (r1 - r0) * t);
      pts.push(
        new THREE.Vector3(x + dx * t + VIEW_R.x * r, y0 + (y1 - y0) * t, z + dz * t + VIEW_R.z * r)
          .addScaledVector(VIEW_CAM, push),
      );
    }
    runs.push(pts);
  }
  return runs;
}

/** Where a leaning trunk's top ends up, from the same numbers trunkGeom took. */
export function leanTip(len: number, lean: number, dir: number): [number, number, number] {
  const s = Math.sin(lean);
  return [-len * s * Math.cos(dir), len * Math.cos(lean), len * s * Math.sin(dir)];
}

// =====================================================================================
// THE STAND, THE VERGE AND THE STANDING SHEET — lifted out of mock/foliage.ts's and
// mock/sky.ts's `buildMock()` so the film body and the mock route call the SAME code.
//
// Nothing below is new. Every number, every comment's reasoning and every pass note came
// across verbatim from the two class modules, which now call these. A recipe that exists
// twice drifts; a recipe that exists once cannot.
// =====================================================================================

/** One tree: foot at (x, z), `h` tall, `r` the crown's own radius, `seed` its hand. */
export interface TreeSpec {
  x: number;
  z: number;
  h: number;
  r: number;
  seed: number;
}

/** Where a stand's merged geometry gathers, one list per class per island (gate 4). */
export interface Stand {
  oak: THREE.BufferGeometry[];
  pine: THREE.BufferGeometry[];
  trunks: THREE.BufferGeometry[];
  verge: THREE.BufferGeometry[];
}

export const newStand = (): Stand => ({ oak: [], pine: [], trunks: [], verge: [] });

// The lobe layout is hero.ts:958-964's, scaled by the tree's own crown radius. Five
// masses that OVERLAP is what makes the silhouette break like a drawn tree's; five that
// merely touch is a cauliflower, and one sphere is the v1 blob the client rejected.
const OAK_LOBES: [number, number, number, number][] = [
  [0, 0.0, 0, 1.0],
  [-0.79, -0.35, 0.24, 0.76],
  [0.74, -0.38, -0.15, 0.79],
  [0.09, 0.65, 0.12, 0.74],
  [-0.41, 0.29, -0.47, 0.65],
];

/** OAK — five overlapping lobes, five contour arcs, three interior leaf arcs. */
export function oakStand(t: TreeSpec, bag: StrokeBag, out: Stand): void {
  const cr = t.r * 0.62; // the big lobe's radius, world units
  const cy = t.h - cr * 1.05; // crown centre
  const trunkLen = cy - cr * 0.75;
  const rb = t.r * 0.098;
  out.trunks.push(trunkGeom(rb * 0.62, rb, trunkLen, t.x, 0, t.z));

  for (const [i, [lx, ly, lz, lr]] of OAK_LOBES.entries()) {
    const r = cr * lr;
    // 13x10, not the hero's 12x9: at r 0.62 seen at x4 the coarser sphere showed straight
    // polygon edges on the silhouette. The silhouette must break from roughen, never from
    // the tessellation. roughen 0.17 (the hero uses 0.10 on a 0.34-u lobe): at 1.8x the
    // radius the same fraction is twice the world displacement.
    const geom = roughen(new THREE.SphereGeometry(r, 13, 10), r * 0.17, 3.4 / t.r, t.seed * 7 + i);
    out.oak.push(placed(uvBand(geom, 0.5, 1, lobeUScale(r)), t.x + lx * cr, cy + ly * cr, t.z + lz * cr));
  }

  // THE DRAWN CROWN. Painted register: arcs hug the silhouette at 1.05x the lobe radius.
  // The graphite register wants 1.10x - the difference is 5% of a 0.62-u lobe, below the
  // stroke pipeline's own wobble. ONE arc set serves both. `push` scales WITH the lobe
  // (cr*0.30): a fixed push on a lobe far off the optical axis diverges laterally as well
  // as in depth, which is the perspective residue hero.ts:1036 measured.
  const K = 1.03;
  const push = cr * 0.3;
  const arc = (lx: number, ly: number, lz: number, lr: number, a0: number, a1: number, w: Weight = 'form') =>
    bag.add(
      arcPts(t.x + lx * cr, cy + ly * cr, t.z + lz * cr, cr * lr * K, cr * lr * K * 0.96, a0, a1, push, 6),
      w,
      'paint',
    );
  arc(0, 0, 0, 1.0, 1.2 * Math.PI, 1.86 * Math.PI);
  arc(-0.79, -0.35, 0.24, 0.76, 0.45 * Math.PI, 1.5 * Math.PI);
  arc(0.74, -0.38, -0.15, 0.79, -0.55 * Math.PI, 0.42 * Math.PI);
  arc(0.09, 0.65, 0.12, 0.74, 0.15 * Math.PI, 0.9 * Math.PI);
  // one interior separation where two masses meet - 'faint', a seam in the crown, not its edge
  arc(-0.34, 0.1, 0.1, 0.52, 1.25 * Math.PI, 1.75 * Math.PI, 'faint');

  // THREE interior leaf arcs, Prep register only - what makes a scalloped mass read TREE
  // and not CLOUD once the paint has drained (hero.ts:989-995). They fade up with the
  // curtain, so the painted crown never carries them as clutter.
  const inner = (lx: number, ly: number, lz: number, r: number, a0: number, a1: number) =>
    bag.add(
      arcPts(t.x + lx * cr, cy + ly * cr, t.z + lz * cr, cr * r, cr * r * 0.78, a0, a1, push * 1.2, 6),
      'form',
      'prep',
    );
  inner(-0.46, -0.17, 0.18, 0.4, 0.3 * Math.PI, 1.1 * Math.PI);
  inner(0.35, 0.17, 0, 0.37, 0.5 * Math.PI, 1.4 * Math.PI);
  inner(0.46, -0.52, -0.12, 0.34, -0.2 * Math.PI, 0.7 * Math.PI);

  for (const run of trunkSideRuns(t.x, t.z, rb * 1.15, rb * 0.66, 0.02, trunkLen)) {
    bag.add(run, 'form', 'paint');
  }
}

/**
 * ROW 5 · THE PINE'S PROFILE — ONE table and ONE builder, with two call sites: `pineStand`
 * here (S1's treeline, S3's forty, S4's forest) and `sets/kit.ts`'s `buildPine`. It had
 * been two copies of one recipe, so it had two copies of every defect in it.
 *
 * BUILT THE HERO'S WAY, because row 5 says "PROVEN, transfers 1:1" and the shipped fir at
 * t = 0 is the bar. `hero.ts:1017` stacks three roughened CONES at
 * `(cy, r, h) = (0.55, 0.44, 0.56) (0.93, 0.34, 0.50) (1.26, 0.23, 0.46)`, tip 1.49,
 * widest skirt 0.44; divide through and it is `PINE_TIERS` below to three places. The
 * spans `[0.181, 0.557] [0.456, 0.792] [0.692, 1.000]` of h OVERLAP by 0.101 h and
 * 0.100 h — that overlap is the word STACKED, and it is what makes one tapering mass out
 * of three tiers instead of three discs on a stick.
 *
 * CONES, NOT LOBES. The round of boughs that shipped before this — a ring of squashed
 * spheres per tier — was argued from facet size, and it cost the class its drawing: a
 * fir's tier is a cone, its skirt is a straight slant, and a ring of spheres has neither.
 * The facet worry is answered where it lives, in the tessellation: `roughen` at 0.07 r
 * breaks the silhouette regardless of segment count. `pineRadial` itself is now the
 * hero's own flat 10 (W1a-fix3, 2026-09-06, measured) — raising it with the tier's own
 * world radius, tried here first to keep the quad off the 20–40 px the ring was
 * introduced to dodge, packed the cone's vertices too close together for the skirt arc's
 * fixed `1.01 r` clearance to clear at every one of them, and dashed the arc.
 *
 * A CONE ALSO CARRIES THE VALUE GRADIENT. `bakeBand` climbs deep → mid up the band and a
 * cone's own v runs 0 at the skirt to 1 at the leader, so `uvBand(cone, 0, 0.5)` paints
 * each tier dark at the whorl and light at the tip — the "value gradient across each cone"
 * the hero's fir reads as, which a sphere's wrapped v cannot produce.
 */
export const PINE_TIERS: [number, number, number][] = [
  [0.369, 1.0, 0.376],
  [0.624, 0.773, 0.336],
  [0.846, 0.523, 0.308],
];

/** `[centreY, baseRadius, coneHeight]` in world units, from the widest skirt and the tip. */
export function pineProfile(rWide: number, h: number): [number, number, number][] {
  return PINE_TIERS.map(([cy, r, ch]) => [cy * h, r * rWide, ch * h] as [number, number, number]);
}

/**
 * `silR(y)` — the mass's half-width at any height, `hero.ts:1038` verbatim with its two
 * absolute offsets carried across as fractions of the tree (the hero's 0.02 at h 1.49 and
 * r 0.44 is 0.013 h and 0.045 r). A cone's silhouette radius is exactly `r·(top − y)/h`,
 * so unlike the ring of boughs this needs no measurement pass over the built vertices:
 * the profile IS the drawn edge.
 */
export function pineSilR(tiers: [number, number, number][], rWide = tiers[0][1], h = 1) {
  return (y: number) =>
    Math.max(
      rWide * 0.045,
      ...tiers.map(([cy, r, ch]) => {
        const top = cy + ch / 2;
        return y >= cy - ch / 2 - 0.013 * h && y <= top ? (r * (top - y)) / ch : 0;
      }),
    );
}

/**
 * RULING B (W1a fix round). `contourArc`'s `push` is a WORLD-UNIT offset added straight
 * along `VIEW_CAM` (`.addScaledVector(VIEW_CAM, push)`), never scaled by rx/ry/r — and
 * hero.ts:1029/1046 pass the SAME literal push (0.3 arc, 0.1 zig) on every one of the
 * three tiers regardless of that tier's own r (0.44/0.34/0.23). The push is therefore tied
 * to the TREE's own scale, not each tier's, and hero's tier-0 r IS its rWide (PINE_TIERS[0]
 * carries skirt fraction 1.0) — 0.44. The ratio is push / rWide, held CONSTANT across
 * tiers: arc 0.3/0.44 = 0.6818, zig 0.1/0.44 = 0.2273. The struck build used `r * 0.3`
 * (per-tier r, wrong base) for the arc and the literal `0.1 * rWide` for the zig — treating
 * hero's raw push number as if it were already a fraction of rWide instead of converting
 * it — law 1 says check, not assume; both are fixed below.
 */
const ARC_PUSH_RATIO = 0.3 / 0.44;
const ZIG_PUSH_RATIO = 0.1 / 0.44;

/**
 * THE SILHOUETTE, tip to skirt — `hero.ts:1038-1051` (`silR`, `zigPts`) verbatim, its two
 * absolute offsets carried across as fractions exactly as `pineSilR`'s own doc above does
 * (0.02 at h 1.49 → 0.013 h; 0.03 stays 0.01·h below at the corner, 0.02·h more to the
 * tuck). W1a (P0 row 5): this used to ride a rim parametrisation that traded the hero's
 * ratios for a zero-crossing construction; that is struck — the spec's numbers stand
 * (law 1), and the ≤4-crossings-a-tree ceiling §4.5 measures is the hero's own, not zero.
 *
 * REGISTER RULING (2026-09-06, main session): the hero's 0.99-painted / 1.03-graphite
 * pair are two TREE INSTANCES either side of a fixed seam (hero.ts:1052), not one tree
 * drawing both. The film's seam is parked and moves, so one pine carries ONE mark set at
 * the painted ratio — 0.99 r — in the paint register, which itself recolours to graphite
 * under curtain/seam exactly as the hero's painted instance does. Emitting both radii on
 * one object was measured to double the marks under Prep (paint-register alpha stays 1 at
 * curtain 1), which is what read as broken, dash-like fragments rather than one stroke.
 */
export function pineZig(
  rWide: number,
  h: number,
  x: number,
  z: number,
  tiers: [number, number, number][],
  side: number,
): THREE.Vector3[] {
  const zig = 0.99; // painted ratio, paint register only — see REGISTER RULING above
  // THE LEADER — `hero.ts:1046` verbatim: `[0.03, tiers[2].cy + tiers[2].h/2 + 0.02]`, a
  // fir's tip is a stroke a hair wide, not a point. 0.03 at the hero's own 0.44 skirt is
  // 0.068 rWide; the 0.02 overshoot above the apex is the SAME fraction `pineSilR`'s own
  // tolerance band already carries (0.013 h) — §4.5 measured (crossings-pine.mjs) that an
  // on-the-slant tip, tried here first, adds crossings the hero's own overshoot tip does
  // not; the overshoot stands (law 1).
  const [cyT, , chT] = tiers[2];
  const tipX = rWide * 0.068;
  const push = rWide * ZIG_PUSH_RATIO; // RULING B — see the ratio's derivation above
  const pts = [
    new THREE.Vector3(
      x + VIEW_R.x * side * tipX,
      cyT + chT / 2 + 0.013 * h,
      z + VIEW_R.z * side * tipX,
    ).addScaledVector(VIEW_CAM, push),
  ];
  // `silR` — the hero's own function, actually called (it shipped exported and unused).
  const silR = pineSilR(tiers, rWide, h);
  for (let i = tiers.length - 1; i >= 0; i--) {
    const [cy, , ch] = tiers[i];
    const yBot = cy - ch / 2 + 0.007 * h; // hero's +0.01 at h 1.49
    const r0 = silR(yBot);
    pts.push(
      new THREE.Vector3(x + VIEW_R.x * side * r0 * zig, yBot, z + VIEW_R.z * side * r0 * zig).addScaledVector(
        VIEW_CAM,
        push,
      ),
    );
    if (i > 0) {
      const yTuck = yBot + 0.02 * h; // hero's +0.03 at h 1.49
      const rTuck = r0 * 0.45;
      pts.push(
        new THREE.Vector3(
          x + VIEW_R.x * side * rTuck * zig,
          yTuck,
          z + VIEW_R.z * side * rTuck * zig,
        ).addScaledVector(VIEW_CAM, push),
      );
    }
  }
  return pts;
}

/**
 * Radial segments for a tier cone. STRUCK (W1a-fix3, 2026-09-06, measured): this used to
 * rise with the tier's own world radius (up to 20) to keep the flat-panel quad near the
 * hero's at close zoom on a big tree. Measured cause of the dashed-arc defect (§4.5-style
 * node test in `scripts/measure/w1a-arc-occlusion.mjs`, then confirmed on screen): the
 * skirt arc sits at a FIXED `1.01 r` (law 1 — never moved) with a FIXED push; a cone's
 * vertices always reach exactly `r` regardless of segment count, so raising the segment
 * count doesn't change the worst-case protrusion, but it packs vertices closer together —
 * more chances for the arc's own 16-sample, ±3%-jittered sweep to land its thin (~0.01 r)
 * margin right on top of a vertex. At the hero's flat 10 (proven continuous on all three
 * tiers, verified 2026-09-06) that alignment never bites; at 14–18 (this file's old
 * per-tier scaling, on the film's actual pine sizes) it did, on the middle tier, as a run
 * of ~4 dash fragments. Ten is the hero's own number and the one proven not to dash — the
 * flat-panel risk this used to dodge is not a hatching-family defect and is not what this
 * task gates; if a future close-zoom pass measures a real flat panel, it needs an arc-side
 * fix (more push, not more cone segments), not this one back.
 */
const pineRadial = (_r: number) => 10;

/**
 * THE WHOLE PINE CROWN — mass and drawing from one profile, called by both film pines.
 * Geometry goes into `out` (merged per class per island by the caller — §11.2 forbids
 * instancing a trilayer), strokes into `bag`.
 */
export function pineCrown(
  rWide: number,
  h: number,
  x: number,
  z: number,
  seed: number,
  bag: StrokeBag,
  out: THREE.BufferGeometry[],
): void {
  const tiers = pineProfile(rWide, h);
  const pushArc = rWide * ARC_PUSH_RATIO; // RULING B — see the ratio's derivation above pineZig
  for (const [i, [cy, r, ch]] of tiers.entries()) {
    // `hero.ts:1024`: roughen(ConeGeometry(r, h, 10, 2), r·0.07, 4.1, seed) — 4.1 is a
    // LITERAL, held constant across all three of hero's tiers, never scaled by that
    // tier's own r. W1a-fix3 (2026-09-06, measured): this used `1.8 / r` (PER-TIER r),
    // which only reduces to hero's 4.1 for tier 0 (whose r IS rWide) — tiers 1 and 2 got
    // 5.29 / 7.83 instead, a finer wobble than hero's own tiers ever had. Exactly the
    // per-tier-vs-per-tree mistake RULING B already caught for the push ratios: the
    // scale belongs to the TREE (rWide), held CONSTANT across tiers, same pattern as
    // ARC_PUSH_RATIO/ZIG_PUSH_RATIO above. `1.8/rWide` at hero's own rWide 0.44 is 4.09,
    // matching 4.1 on every tier — the amplitude (`r * 0.07`) still scales per tier.
    const cone = roughen(
      new THREE.ConeGeometry(r, ch, pineRadial(r), 2),
      r * 0.07,
      1.8 / Math.max(rWide, 0.05),
      seed * 5 + i,
    );
    // `3.34 r` is `lobeUScale` WITHOUT its clamp at 1, and the clamp is what has to go: a
    // cone wraps the tile once around its own circumference exactly as a sphere does, so
    // holding row 5's verified 272 tex/u means `272·2πr/512` — which for a 0.5-u skirt is
    // 1.67, i.e. the tile repeats. Clamped at 1 the same skirt sampled 163 tex/u and the
    // 38–72-texel leaf masses came out as pale blobs a third of a tier across (walked at
    // ?mock=foliage zoom 4). `wrapS` is Repeat and `bakeBand` redraws across the seam, so
    // the repeat is invisible.
    out.push(placed(uvBand(cone, 0, 0.5, 3.34 * r), x, cy, z));
    // THE PER-TIER SKIRT ARC — `hero.ts:1029` (`contourArc`) verbatim: one arc a tier at
    // the skirt (`cy - ch/2`), span 1.1π→1.9π (the near-lower 144°), y-radius 0.3 r, push
    // ratio'd to the tree's own scale (RULING B, `ARC_PUSH_RATIO` above `pineZig`). Built
    // with the kit's own `arcPts`, not a new arc function.
    //
    // REGISTER RULING (2026-09-06, main session, see `pineZig`'s own doc): the hero's
    // 1.01-painted / 1.05-graphite pair are two tree INSTANCES either side of a fixed
    // seam, never one tree drawing both. This pine is the film's single moving-seam
    // object, so it carries ONE mark set at the painted ratio — `register: 'paint'`
    // recolours ink → graphiteDark on its own as the curtain rises, exactly like the
    // hero's painted instance. The struck second emission at 1.05 `register: 'prep'`
    // stayed visible under Prep too (paint-register alpha is 1 at curtain 1) and doubled
    // every arc — that doubling is what read as heavy, broken, dash-like fragments.
    bag.add(arcPts(x, cy - ch / 2, z, r * 1.01, r * 0.3, 1.1 * Math.PI, 1.9 * Math.PI, pushArc), 'form', 'paint');
  }
  // ONE connected zigzag a side, tip to skirt, ONE mark set (painted ratio, paint
  // register) — per-tier slants never assemble into a tree at framing (hero.ts:1031-1037
  // walked exactly that failure). See `pineZig`'s own doc for the register ruling.
  for (const side of [-1, 1]) {
    bag.add(pineZig(rWide, h, x, z, tiers, side), 'form', 'paint');
  }
}

/** PINE — three stacked cones and one `silR()`-derived zigzag a side, per `pineCrown`. */
export function pineStand(t: TreeSpec, bag: StrokeBag, out: Stand): void {
  const trunkLen = t.h * 0.26;
  const rb = t.r * 0.078;
  out.trunks.push(trunkGeom(rb * 0.6, rb, trunkLen, t.x, 0, t.z));
  // THE ASPECT IS THE HERO'S, AND IT IS A MEASUREMENT. The fir at t = 0 is skirt 0.44 over
  // tip 1.49 — 0.295 — and that ratio is what makes three cones read as a fir rather than
  // as a spire or a bush. The `0.48 · t.r` that stood here was solved for the ring-of-boughs
  // recipe this replaces, and against the film's own placements it lands 0.161 (mock, and
  // S3's near stand) to 0.249 (S3's treeline): at 0.161 the tiers overhang by nothing and
  // the tree renders as one narrow cone with two dashes across it (walked at ?mock=foliage
  // zoom 4 and at S3 t19.5). The caller's `t.r` still sets the width — the stands are placed
  // on it — but it is held inside ±20% of the hero's aspect so no placement can flatten the
  // silhouette out of the class.
  const rWide = Math.min(0.36 * t.h, Math.max(0.24 * t.h, t.r * 0.9));
  pineCrown(rWide, t.h, t.x, t.z, t.seed, bag, out.pine);
  for (const run of trunkSideRuns(t.x, t.z, rb * 1.1, rb * 0.62, 0.02, trunkLen + t.h * 0.04)) {
    bag.add(run, 'form', 'paint');
  }
}

/**
 * THE VERGE — undergrowth clumps, and the grass anchors that gather at their feet.
 *
 * A stand that stops dead at the soil reads as props stuck in a board. A shrub is what a
 * crown is at a fifth of the size — three overlapping roughened lobes — so the verge and
 * the canopy are the same vocabulary word said quietly. `IcosahedronGeometry` is banned
 * here: three.js ships it NON-INDEXED, so `computeVertexNormals` cannot smooth it and it
 * arrives as section 9.5's "default primitive with a flat fill" by the back door.
 *
 * Returns the tuft anchors, so a caller that wants its tufts as separate revealable
 * objects can build them itself rather than take them merged.
 */
export function shrubClumps(
  shrubs: [number, number, number][],
  bag: StrokeBag,
  out: Stand,
): [number, number][] {
  const tufts: [number, number][] = [];
  for (const [i, [x, z, r]] of shrubs.entries()) {
    // three lobes, not two, and roughened hard: at 0.16 amp on two smooth ovoids the
    // shrubs read as green potatoes. A shrub is a broken mass or it is a bean.
    for (let b = 0; b < 3; b++) {
      const lr = r * [1, 0.78, 0.62][b];
      const geom = roughen(new THREE.SphereGeometry(lr, 9, 6), lr * 0.3, 7.5, 60 + i * 3 + b);
      geom.scale(1.16, 0.62, 1.02);
      out.verge.push(
        placed(geom, x + [0, r * 0.78, -r * 0.62][b], lr * (b ? 0.42 : 0.5), z + [0, r * 0.28, -r * 0.34][b]),
      );
    }
    // one short contour on the shrub's lit shoulder: two smooth lobes with no drawn edge
    // read as green potatoes beside a drawn island
    bag.add(arcPts(x, r * 0.44, z, r * 1.22, r * 0.7, 0.12 * Math.PI, 1.05 * Math.PI, r * 0.5, 6), 'form', 'paint');
    tufts.push([x - r * 1.15, z + r * 0.5], [x + r * 1.5, z - r * 0.35]);
  }
  return tufts;
}

/**
 * ONE TUFT — four blades, and the reason they are this size is screen-space, not taste.
 *
 * FEWER, BIGGER: a 0.3-u blade is 14-22 screen px at framing, and four of them clumped
 * read as a tuft. FOUR-sided, not three: a 3-sided cone is one flat triangle from most
 * angles and the verge read as arrowheads. r 0.032, because `undergrowth #87945E`
 * computes to tier 3 - two graphite passes across a 3-px blade is a solid black tick and
 * breaks C10 (ink is never a fill); the wider blade gives the tier something to land ON.
 */
export function tuftBlades(tx: number, tz: number, i: number, scale = 1): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let b = 0; b < 4; b++) {
    const len = (0.34 + krand() * 0.14) * scale;
    const blade = new THREE.ConeGeometry(0.032 * scale, len, 4, 1, true);
    out.push(
      placed(
        blade,
        tx + (krand() - 0.5) * 0.16 * scale,
        len * 0.46,
        tz + (krand() - 0.5) * 0.14 * scale,
        (i + b) * 1.31,
        (krand() - 0.5) * 0.42,
      ),
    );
  }
  return out;
}

/**
 * Row 5's crown material. wear 0 — row 5 is explicit: trees are tended, not handled.
 * RULING C (W1a fix round) struck the route-only `poster 8` this doc used to argue for
 * (the film's `crownMat` already shipped 12; a route rendering at a different poster than
 * the film judges the stand against the wrong quantizer). `CROWN_POSTER` above is the one
 * number both take now. `tile` is the bake's edge; both callers take the row's own 512
 * (see `bakeFoliage`).
 *
 * `tint` IS NOT APPLIED WHEN THE BAKE IS. The old docstring here read "the bake is
 * paper-white, so `material.color` is the only tint lever there is", and that was simply
 * untrue: `bakeFoliage` paints its two bands in `canopyDeep`/`canopy` and
 * `needle`/`canopyDeep`, so multiplying the species token over it SQUARED the pigment —
 * `canopy × canopy` = `#254C0A`, linear L 0.0565 against the token's 0.2262, `triTone`
 * 0.854 against row 5's 0.559. Both call sites pass exactly the token of the band their
 * geometry samples (`uvBand` puts oak in v ∈ [0.5, 1] and pine in v ∈ [0, 0.5]), so the
 * bake IS the class pigment and the right tint over it is white. `tint` stays live for the
 * headless path, where there is no map and the flat token is all the surface has.
 */
/**
 * RULING C (W1a fix round): ONE shared poster constant for row 5's crowns, not a route
 * value (8) and a film value (12) that a compile-time hook had to reconcile. The film
 * renders 12 (`sets/kit.ts`'s `crownMat`) — that number wins, `?mock=foliage`'s route
 * poster moves to match it, and `mock/foliage.ts`'s `useFilmPoster` patch is deleted along
 * with it: the route now renders what the film renders because the same constant is what
 * both ask for, not because a patch reached into the route's compiled shader and moved it.
 */
export const CROWN_POSTER = 12;

export function crownMaterial(dir: number, tint: number, tile = 512): THREE.MeshLambertMaterial {
  // `tint` is the class's committed token, so it is also the tile's BASE: the map then
  // carries this crown's own deep/mid/lit and `color` stays white, which is the hero's own
  // arrangement (`hero.ts:645`'s `mapped` drops the fallback the moment a map exists) and
  // the only one in which every band stop reaches the screen as the colour it was authored
  // as. See `crownFamily`.
  const map = bakeFoliage(tile, tint);
  const m = createTrilayer({
    color: map ? 0xffffff : tint,
    wear: 0,
    poster: CROWN_POSTER,
    stroke: { dir, sheet: true },
  });
  if (map) m.map = map;
  return m;
}

/** The trunk material - row 6, `dir 1.35` along the grain, the 256-square bark tile. */
export function trunkMaterial(dir = 1.35): THREE.MeshLambertMaterial {
  const map = bakeBark();
  const m = createTrilayer({ color: map ? 0xffffff : P.timber, wear: 0.18, stroke: { dir, sheet: true } });
  if (map) m.map = map;
  return m;
}

/** The verge material - undergrowth, one step quieter than a crown. */
export function vergeMaterial(dir = 0.56): THREE.MeshLambertMaterial {
  return createTrilayer({ color: P.undergrowth, wear: 0, poster: 12, stroke: { dir, sheet: true } });
}

// ---- ROW 17 - the standing sheet -----------------------------------------------------
//
// ONE 512-square tiling sheet, shared by every leaf in the film. Base is PAPER, not a
// colour: the chapter's hue arrives as `material.color` multiplying the map, so one bake
// serves all seven weathers and every sky hue stays a palette token.
//
// A BANK IS A CLUSTER OF DABS AND NOTHING ELSE. There is no outline, no fill and no path
// in `bakeSkySheet` - the envelope only decides WHERE dabs may land, it is never drawn.
// That is the judgement's "hard-edged jigsaw blobs / camouflage print": it was the filled
// path, and the answer was to delete it rather than to soften it.
//
// THE COLD IS BACK, AND IT IS THE RULING THAT PUT IT BACK (art bible §4.7, revised
// 2026-09-05). The previous pass took `stoneCool` OUT of this bake and put `stoneWarm` in,
// because under the COVER's rig (`G_R/G_B` 1.222 on an up-facing surface) every cold token
// came back brown. The film's ext-day family — S3, S4, S6, S7 — now runs `keyDay #FAF2E6`
// over the film's own cool fill, and its gain is a SCALAR to 0.16 %: an authored token's
// hue survives the light exactly. §4.7.5's whole pre-compensation table is a no-op there.
// So the answer to "warm everywhere" is not to pre-compensate and not to keep removing the
// cool: it is to author the cold token and measure it. Three values, all committed:
//   body      `skyOvercast #AAB6C0` (R−B −22)  — the bank's own mass
//   shoulder  `paper #F7F5F0`      @0.85       — C11, the lit edge is the page showing through
//   under     `stoneCool  #8792A6` @0.30       — row 17's own under-shadow, one per bank
export const SKY_TILE_U = 6; // world units per repeat - 512 / 6 = 85.3 texels/unit
// The bank band's floor inside the tile, as a fraction of the repeat: it puts the common
// baseline at world y = 0.72 u on EVERY leaf in the film at once, which is what makes
// fourteen separate masses read as ONE bank at ONE altitude.
const SKY_BASE_V = 0.14;
const SKY_BANK = P.skyOvercast;
const SKY_UNDER = P.stoneCool;

let skyTex: THREE.CanvasTexture | null | undefined;
export function bakeSkySheet(): THREE.CanvasTexture | null {
  if (skyTex !== undefined) return skyTex;
  if (typeof document === 'undefined') return (skyTex = null);
  kseed(0x7ac1e35);
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = css(P.paper);
  ctx.fillRect(0, 0, size, size);

  // flipY is on, so v = SKY_BASE_V is this many pixels down from the canvas top
  const baseline = size * (1 - SKY_BASE_V);

  // A DAB, and everything on this sheet is one. A linear gradient under poster 6 becomes a
  // RULED horizontal band across every leaf - the quantizer will always find a hard step
  // in a smooth ramp, which is why the ground bake spends 2 000 dabs and not one gradient.
  // 30+ texels long, 10+ wide, so at 85 texels/unit against the film's 77 px/u a dab is
  // 27+ screen px and reads as a mark someone made.
  const dab = (x: number, y: number, len: number, wide: number, hex: number, a: number, rot: number) => {
    ctx.fillStyle = rgba(hex, a);
    ctx.beginPath();
    ctx.ellipse(x, y, len / 2, wide / 2, rot, 0, 6.3);
    ctx.fill();
  };

  // THE BELLY. A leaf is 2.3-5.6 u tall against a 6-u repeat, so only the bottom of the
  // tile is ever seen. Below the bank baseline the sheet gathers weight; above the bank
  // tops it is left at base, because the leaf's own CUT top already draws the bank tops.
  for (let i = 0; i < 46; i++) {
    const y = baseline + krand() * (size - baseline) * 0.92;
    const near = 1 - (y - baseline) / Math.max(size - baseline, 1);
    dab(krand() * size, y, 46 + krand() * 74, 9 + krand() * 8, SKY_BANK, 0.1 + (1 - near) * 0.15, (krand() - 0.5) * 0.18);
  }
  // Nothing may cross a bank's flat belly - clip the whole pass above the baseline and the
  // rule holds by construction instead of by care.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, size, baseline);
  ctx.clip();

  // The envelope is three harmonics with UNEQUAL amplitudes, so the top of a bank rises
  // and falls without ever repeating - no two lobes the same.
  const bank = (cx: number, r: number, h: number, dx: number, phase: number) => {
    const y0 = baseline + (krand() - 0.5) * 24; // the common baseline, +/-12 texels
    const env = (u: number) =>
      0.52 +
      0.26 * Math.sin(u * 3.1 + phase) +
      0.14 * Math.sin(u * 5.7 - phase * 1.7) +
      0.08 * Math.sin(u * 9.3 + phase * 0.6);

    // 26 body dabs. Many quiet dabs, never few loud ones - the ground bake's law, and the
    // reason this reads as a solid rather than as a stain.
    for (let i = 0; i < 26; i++) {
      const u = krand();
      const top = env(u * 6.28);
      // biased LOW: a cauliflower is top-lit and flat-bellied
      const v = Math.pow(krand(), 0.62) * top;
      dab(
        cx + dx + (u - 0.5) * 2 * r,
        y0 - h * v,
        38 + krand() * 46,
        11 + krand() * 8,
        SKY_BANK,
        0.1 + krand() * 0.12,
        (krand() - 0.5) * 0.34,
      );
    }
    // 5 shoulder dabs on the +18 degree key side. THE LIT EDGE OF A CLOUD IS THE PAGE
    // SHOWING THROUGH (C11), so they are paper at 0.8, riding the SAME envelope.
    for (let i = 0; i < 5; i++) {
      const u = 0.06 + krand() * 0.46;
      dab(
        cx + dx + (u - 0.5) * 2 * r,
        y0 - h * env(u * 6.28) * (0.82 + krand() * 0.2),
        34 + krand() * 32,
        10 + krand() * 6,
        P.paper,
        0.8,
        -0.4 + krand() * 0.45,
      );
    }
    // ONE UNDER-SHADOW, row 17's own `rgba(stoneCool, 0.30)`, and it is what turns a
    // cluster of dabs into a MASS: a bank without one is a stain, because nothing says
    // which way is down. It hugs the belly — a long, low, flat dab spanning most of the
    // bank's width, sitting INSIDE the clip so it can never cross the baseline itself.
    dab(cx + dx, y0 - h * 0.045, r * 1.62, 15 + krand() * 7, SKY_UNDER, 0.3, (krand() - 0.5) * 0.1);
  };

  // FOURTEEN BANKS — row 17's own count, and getting it right changes what the sheet IS.
  //
  // The shipped loop walked a cursor by the bank's own radius and stopped at the tile edge,
  // so a bigger radius meant FEWER banks: at r 34–96 it laid about six, and the first pass
  // of this fix round widened the radius and got FIVE. Six isolated lumps across 512 texels
  // is the "stain" the row warns about — the eye reads separate blobs, not a bank. The row
  // does not say "up to fourteen": fourteen flat-bottomed masses on ONE baseline across one
  // tile IS the bank. They have to overlap, and the spacing has to be a division of the
  // tile rather than an accumulation, or the count and the tile can never both be true.
  //
  // So the advance is `size/14` wobbled ±45 % (unequal spacing, mean exactly one share, so
  // fourteen still span exactly one repeat and the tile still wraps), and each bank's radius
  // is 0.85–2.2 shares — every bank overlaps its neighbours about three deep. The result is
  // one continuous flat-bellied layer with a lumpy top, which is a MASS, and the 2.6× spread
  // in radius is what stops the lumps landing on a pitch.
  const ADV = size / 14;
  let cursor = -ADV * 0.5;
  for (let i = 0; i < 14; i++) {
    cursor += ADV * (0.55 + krand() * 0.9);
    const cx = cursor;
    const r = ADV * (0.85 + krand() * 1.35);
    const h = 30 + krand() * 96;
    const phase = krand() * 6.28;
    bank(cx, r, h, 0, phase);
    if (cx < r) bank(cx, r, h, size, phase); // the sheet tiles in u
    else if (cx > size - r) bank(cx, r, h, -size, phase);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return (skyTex = tex);
}

/**
 * THE CUT SHEET. Authored in the leaf's OWN world units, so the extruded UVs come out in
 * world units too and the tile is addressed at a fixed 6 u per repeat whatever size the
 * leaf is. Three things stop the top edge being a stage flat, and none of them is jitter:
 *
 *   1. LOBE WIDTHS ARE UNEQUAL - each takes a share drawn from 0.55-1.45 of the even
 *      width, normalised so the run still spans w. A skyline is not on a pitch.
 *   2. THE CONTROL POINT IS ASYMMETRIC - 0.28-0.72 of the span, never the midpoint, so a
 *      lobe rises fast and falls slow or the reverse. This is the load-bearing one.
 *   3. HEIGHTS COME FROM TWO HARMONICS, not an alternation, so the run has a large-scale
 *      rise and fall while adjacent lobes still cannot match.
 */
export function leafShape(w: number, h: number, lobes: number, notch: number): THREE.Shape {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  s.moveTo(x0, 0);
  s.lineTo(x0, h * 0.62); // hard vertical sides: a sheet has an end

  const share = Array.from({ length: lobes }, () => 0.55 + krand() * 0.9);
  const total = share.reduce((a, b) => a + b, 0);

  let px = x0;
  let py = h * 0.62;
  let run = 0;
  for (let i = 1; i <= lobes; i++) {
    run += share[i - 1] / total;
    const nx = x0 + w * run;
    const u = (i / lobes) * 6.28;
    // ONE torn notch per leaf, pulled to 0.34 of the height - a sheet that was CUT, not
    // generated. Everything else rides 0.62-1.00 of the height.
    const ny =
      h *
      (i === notch
        ? 0.34
        : 0.78 + 0.11 * Math.sin(u + 1.3) + 0.07 * Math.sin(u * 2.7 - 0.4) + (krand() - 0.5) * 0.16);
    const t = 0.28 + krand() * 0.44; // the asymmetry - never 0.5
    const cx = px + (nx - px) * t;
    const cy = Math.max(py, ny) + h * (i === notch || i === notch + 1 ? -0.04 : 0.04 + krand() * 0.08);
    s.quadraticCurveTo(cx, cy, nx, ny);
    px = nx;
    py = ny;
  }
  s.lineTo(w / 2, 0); // the last lobe lands on the right edge; the side drops dead vertical
  s.lineTo(x0, 0); // dead-flat bottom - the line where the sheet enters its slot
  return s;
}

export interface LeafSpec {
  w: number;
  h: number;
  x: number;
  z: number;
  tint: number;
  dir: number;
  rake: number;
  yaw: number;
  wash: number;
  lobes: number;
  notch: number;
  /** Which way the sheet's painted face is turned before the rake tips it. */
  faceYaw?: number;
  /**
   * HOW DEEP THE SLOT IS. Row 17's bottom is "dead-flat … the line where it enters its
   * slot", and on the mock route the island stands in front of every leaf and hides it.
   * In the film body a leaf stands over the VOID behind its island, and a flat bottom at
   * y 0 then projects ABOVE the island's far rim from any camera below it — a hard ruled
   * horizon line hanging in the sky, measured at S3's follow height. Sinking the leaf so
   * its bottom projects behind the island's own rim is the slot: the island is the thing
   * that occludes it, exactly as the route's does. Default 0 keeps the mock unchanged.
   */
  y?: number;
  /**
   * WHERE THE BANK BAND SITS ON THIS LEAF, in world units above its dead-flat bottom.
   *
   * The sheet tiles at `SKY_TILE_U` = 6 u and the bank band lives at `v` 0.14–0.40 of the
   * tile, so on a leaf shorter than 6 u the band lands wherever the bottom happens to be.
   * Row 17's rake clause — the top must sit 1.4–3.0 u FARTHER than the bottom at −0.14 rad
   * — makes every leaf in the film at least `1.4 / sin(0.14)` = **10.0 u** tall, so the
   * tile now repeats up the sheet and the band's altitude has to be authored rather than
   * inherited. This slides the v origin so ONE band lands in the leaf's visible span, and
   * the repeats above and below it fall outside the frame or into the island's slot.
   */
  vOff?: number;
  /**
   * §3.8 FOR THE LEAF'S OWN UNDERDRAWING. The trilayer's tier field is a WORLD-space tile
   * — 0.4 u per band over 15 rows = a **0.02667 u row pitch**, solved once at the hero's
   * 161 px/u where it is 4.29 screen px. A sheet standing 16–36 u from the run camera
   * projects that pitch to a fraction of a pixel and the rows alias into a woven grid
   * across the whole top of frame. `strokeScale` lays the tile bigger in world space by
   * this factor so its rows land back at the pitch they were authored for. Default 1 —
   * the mock route's sheets stand 3–13 u away and need nothing.
   */
  strokeScale?: number;
}

/**
 * ONE LEAF, with the brace and the slot line baked onto its back.
 *
 * `faceAway` stacks a spare backstage so the brace can be seen; `faceYaw` turns the sheet
 * to the shot - the extrude faces +z, so a lens on the -z side takes the mock's default
 * PI and a lens on the +z side (the film's S3 follow) takes 0. The rake always tips the
 * top AWAY from that face, into the page, which is the row's whole depth mechanism.
 */
export function buildLeaf(L: LeafSpec, bag: StrokeBag, faceAway = false): THREE.Mesh {
  const map = bakeSkySheet();
  const shape = leafShape(L.w, L.h, L.lobes, L.notch);
  const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  // ExtrudeGeometry's UV generator hands back the shape's own x/y, which are world units
  // here - so one divide is the whole "tile at 6 world units" instruction, and it holds at
  // every leaf size without a per-leaf number.
  const uv = geom.getAttribute('uv');
  const vo = (L.vOff ?? 0) / SKY_TILE_U;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) / SKY_TILE_U, uv.getY(i) / SKY_TILE_U - vo);
  }
  uv.needsUpdate = true;

  const mat = createTrilayer({
    // THE TINT IS THE LEAF'S DEEPEST TIER, NOT ITS FILL - forced, not chosen. With a
    // paper-base bake the hue arrives as material.color MULTIPLYING the map, so a leaf can
    // only ever go DARKER than its token, and "the lit edge of a cloud is the page showing
    // through" (C11) has no headroom once the token itself is the fill. mixHex(token,
    // paper, wash) gives the fill its headroom back and the bake's own darkening then
    // lands the banks ON the token. The wash ladder is also the depth language as pigment.
    color: mixHex(L.tint, P.paper, L.wash),
    wear: 0.1, // low, deliberately: everything he handles wears; the sky he does not
    poster: 6, // a pale flat mass has no geometry to supply tiers, so the quantizer must
    stroke: { dir: L.dir, sheet: true, scale: L.strokeScale ?? 1 },
  });
  if (map) mat.map = map;

  const mesh = new THREE.Mesh(geom, mat);
  const yaw0 = L.faceYaw ?? Math.PI;
  mesh.rotation.set(faceAway ? L.rake : -L.rake, yaw0 + L.yaw, 0, 'YXZ');
  mesh.position.set(L.x, L.y ?? 0, L.z);
  // a backdrop flat is atmosphere, not matter: it takes the key but throws nothing
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  // THE BRACE AND THE SLOT LINE, on the back of every leaf, always built. Authored in the
  // leaf's own frame and baked through its matrix, so all of them land in one merged draw.
  // `flat` register: graphite in every state - a batten is a real batten and it does not
  // drain, because it was never painted.
  mesh.updateMatrix();
  const m = mesh.matrix;
  const back = -0.03; // behind the sheet's back face: hidden head-on, found off-axis
  const bx = L.w * 0.34;
  const by = L.h * 0.72;
  bag.add(
    [new THREE.Vector3(-bx, 0.06, back), new THREE.Vector3(0, by, back), new THREE.Vector3(bx, 0.06, back)],
    'form',
    'flat',
    m,
  );
  // THE COLLAR TIE, AND WHY ITS HALF-WIDTH IS SOLVED RATHER THAN TYPED.
  //
  // It used to run to ±0.62·bx at a height of 0.42·by. The Λ's own legs are at ±0.58·bx
  // there, so the tie overshot each leg by 0.04·bx and the brace carried TWO STROKES
  // CROSSING AT AN ANGLE INSIDE ONE FORM — the hard gate, on the one mark row 17 makes
  // mandatory. Row 17 requires the brace, so this is depicted structure and not shading,
  // and the resolution is the one a joiner would use: the tie BUTTS the rafters instead of
  // lapping past them. Solve the leg's own x at the tie's height and stop there — a T at
  // each end, three strokes, no crossing, and the gate has nothing to argue with.
  const ty = by * 0.42;
  const tx = bx * (1 - (ty - 0.06) / (by - 0.06));
  bag.add([new THREE.Vector3(-tx, ty, back), new THREE.Vector3(tx, ty, back)], 'form', 'flat', m);
  bag.add(
    [new THREE.Vector3(-L.w * 0.46, 0.035, back), new THREE.Vector3(L.w * 0.46, 0.035, back)],
    'faint',
    'flatLight',
    m,
  );
  return mesh;
}

