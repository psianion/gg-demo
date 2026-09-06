import * as THREE from 'three';
import { createTrilayer } from './trilayer.ts';
import { brushFor, assertPoster } from './goblinBrush.ts';
import { polyline, paint, weight, STROKE_LAYER } from '../pencil.ts';
import { BROW_Y, MOUTH_Y } from '../actions.ts';
import {
  RIG,
  EAR_Z_L,
  EAR_Z_R,
  setGoblinRim,
  type Arm,
  type Face,
  type Goblin,
  type Leg,
} from '../world.ts';

// ===================================================================================
// THE GOOD GOBLIN — SCULPTED FROM NOTHING AS ONE CONTINUOUS SKIN, AND RIGGED
//
// Promoted from the study route (it was `gobStudyA.ts`) to the film's own figure. The
// study export at the bottom still works — `/?gobstudy=A` is how he gets judged — and
// it is the SAME build: the route shows the rigged figure at its bind pose.
//
// THE CONTRACT. One Object3D, origin at the SOLES, facing +z, authored 0.90 world
// units tall. The study route parents it at the hero's own staged place / rotation /
// scale, calls markAlive() on it and measures it. `buildGoblin()` returns the same
// figure as world.ts's `Goblin` — the rig `actions.ts` and `heroLife.ts` already drive
// (§7 below is the whole of that argument).
//
// THE SOURCE OF TRUTH is docs/reference/goblin-{faces,body,actions}.png and its
// measurement, docs/2026-09-03-goblin-reference.md. Every number below is a line of
// that document at k = 0.90 / 177 px = 0.005085 units per reference pixel. Where an
// older doc, gate, token or shipped constant disagreed, THE REFERENCE WON and the
// line says so. Nothing is ported from world.ts's goblin — not a part, not a
// proportion, not a constant, not a colour.
//
// ---- THE HARD PART, NAMED ---------------------------------------------------------
//
// The reference is flat 2D cel: hard fills, five committed values of one olive, a
// lost-and-found contour, no texture anywhere. The film is 3D in a painted/graphite
// language — trilayer paint/underdrawing/edge-wear, a tone quantizer, canvas-baked
// authored stroke tiles, drybrush rims. Copying the cel look into 3D gives a cardboard
// cut-out. Abandoning it for the film's look gives back the figure the client rejected
// twice.
//
// The resolution: the two already agree about ONE thing — TONE COMES IN COMMITTED
// TIERS, NOT RAMPS. The cel art is a five-tier quantization of one hue; uTriPoster is
// a quantizer. They are the same instrument. So he takes the film's whole program and
// the client's own tier PLACEMENT.
//
// The arithmetic, done once here rather than inherited (the design doc's poster-10 was
// computed for a cloak at L 0.211 that the reference struck), and re-derived after a
// live framebuffer read caught two errors in the first pass of it.
//
// uTriPoster quantizes in GAMMA-2.2 space (`pow(triPl, 0.4545)`), but the reference's
// values and this film's own convention are sRGB-encoded. The two differ: the shader's
// 0.1389 plateau measured back off the canvas as sRGB 0.117, not 0.139. So a shader
// tier T shows on screen as srgbEncode(T^2.2), and the tier a target value needs is
// T = (srgbDecode(target))^(1/2.2). The client's palette converts to
//
//   cloth  0.161  0.202  0.257  0.324  0.357      (sRGB 0.143 0.188 0.249 0.320 0.355)
//   skin               0.373  0.415  0.682        (sRGB 0.372 0.416 0.688)
//   linen              0.446         0.809        (sRGB 0.448 0.814)
//
// At N = 20 the plateaux are 0.175 0.225 0.275 0.325 0.375 0.425 ... 0.675 ... 0.825,
// which lands the three values that carry the character almost exactly: the cloth BASE
// (0.324 -> 0.325, error 0.001, and it is 47% of the front figure and 75% of the back),
// the shaded skin (0.373 -> 0.375) and the lit skin (0.682 -> 0.675). N = 20 is also
// the tier DENSITY the reference itself uses — five cloth tiers across a 0.196 span is
// a step of 0.049, and 1/20 = 0.050. Committed tiers, not a fine ramp.
//
// THE PIGMENT IS SOLVED FROM THE TWO TIERS, not lifted from the sampled hex — and that
// is a measurement, not a preference. Two live framebuffer reads settled it:
//
//   1. The hero stages the key at (-4, 3.95, -4) and stages HIM at rotation.y 1.542, so
//      he faces +x and the key is BEHIND him. His camera-facing side receives the cool
//      hemisphere and nothing else. Setting the material colour to pure red and then to
//      pure green changed the rendered pixel by ZERO: at that light level `wear`'s few
//      per cent of paper outweighs the lit colour 25 : 1, so the poster then commits a
//      PAPER-hued grey at the floor value. He came out a grey figure.
//   2. Where wear is small and the light is nil, `outgoingLight` is ~0, the poster's
//      `outgoingLight *= tier / lum` multiplies zero by anything and stays zero: the
//      belt measured #000000. That is the design doc's "he reads as a hole", live.
//
// Both have one cause — a cel character in a rig that does not light him — and one
// honest fix, which is also what the reference itself does: THE SHADE TIER IS PAINTED,
// NOT COMPUTED. `tone()` below takes the two tiers the client painted (the value where
// the light reaches him and the value where it does not) and solves the albedo and the
// emissive that land them, against two measured rig gains. The emissive is the pigment's
// own shade value, exactly as a cel painter mixes it; it lights nothing, blooms nothing,
// and takes no hue that is not the client's. It also makes the range he has to survive
// ~3 : 1 instead of ~25 : 1, which is why the hue lives through the drybrush now.
//
// ---- THE CONSTRUCTION: ONE CONTINUOUS SKIN ----------------------------------------
//
// The shipped figure failed as "a robot made out of tins and shapes" because it was a
// stack of closed objects, each with its own outline. This is one lofted surface.
//
// `trunk()` lofts ONE BufferGeometry through 29 hand-shaped cross-section keys from the
// hood's crown to the tunic's hem — crown, hood dome, brow, cheek band, chin, hood
// bottom, shoulder, chest, waist, belt, skirt, hem. The FACE is not a separate object
// and not a hole: it is a RECESS in that same skin. Inside the face window the surface
// is pushed back along -z; the boundary is a fold, and the fold at the brow is a real
// forward-projecting overhang — which is what throws the hood's shadow across the top
// of the eyes under a real light instead of painting a patch there. Cloth, hood
// interior, face skin, throat tab and belt are MATERIAL GROUPS of that one geometry:
// they share their vertices, so no two of them can ever have separate outlines.
//
// Ears, arms and legs are lofted tubes whose FIRST cross-section is buried inside the
// trunk's volume, so a limb emerges from the mass instead of butting against it, and
// the one ink shell is merged over all of them — the whole silhouette is one line.
//
// ---- THE FIVE SILHOUETTE MARKS (reference section 2), in priority order ------------
//   1  the hood dome — one unbroken curve, top 50% of the height, 69% of the width
//   2  two ear blades, tips at 0.203 H BELOW the crown, defining the full width
//   3  two bright eyes, low in the head (64% down the head unit), L 0.914
//   4  the small body: shoulders 0.61 x head width, the notch between the boots
//   5  two pale linen bands — forearms and shins, the only high-value cloth on him
// ===================================================================================

// ---- the measured figure, in units ------------------------------------------------
// H = 0.90 units = 177 reference px. All y are from the SOLES; the reference's own
// fractions are from the CROWN, so y = H * (1 - f).
const H = 0.9;
const K = H / 177; // units per reference pixel

const Y_CROWN = H; // 0.000 H — the apex of the entire figure. NOT the ears (STRUCK).
const Y_BROW = H * (1 - 0.062); // 0.844 — the hood's front hem; the shaded forehead below
const Y_EAR_TIP = H * (1 - 0.203); // 0.717 — both tips, level, 0.203 H BELOW the crown
// AMENDED after the fix round's own read: the almond's TOP measured f 0.211 against the
// reference's f 0.170 while its BOTTOM (f 0.341 vs 0.339) was exact. All of the error was
// at the top, so the centre rises 0.0175 H and the height grows to match — and the
// over-tall forehead (0.144 H against the reference's 0.108 H) loses that same 0.041 H in
// the one edit, because the forehead is only the space above this line.
const Y_EYE = H * (1 - 0.261); // 0.665 — eye centre
const Y_CHIN = H * (1 - 0.424); // 0.518 — bottom of the lit face; head unit = 0.382
// AMENDED: at 0.452 the tab was 0.025 units tall — two loft rings — and it stepped. The
// client's patch hangs from the chin to about the hood's own hem, which is four rings.
const Y_COLLAR = H * (1 - 0.47); // 0.477 — the throat tab dies at the collar
const Y_HOOD_HEM = H * (1 - 0.48); // 0.468 — the hood's bottom edge (77 px wide)
const Y_SHOULDER = H * (1 - 0.52); // 0.432 — 57 px
const Y_BELT_T = H * (1 - 0.64); // 0.324
const Y_BELT_B = H * (1 - 0.69); // 0.279
const Y_HAND = H * (1 - 0.712); // 0.259 — hands at the hips, widest below the head
const Y_HEM = H * (1 - 0.82); // 0.162 — tunic hem; the legs separate
const Y_WRAP_T = H * (1 - 0.83); // 0.153 — shin wraps
const Y_BOOT = H * (1 - 0.89); // 0.099 — boot tops

const HEAD_HW = (93 * K) / 2; // 0.2364 — head half-width. The WIDEST element of him.
const EAR_HALF = (134 * K) / 2; // 0.3407 — ear tip to ear tip IS the figure's width

// ---- the palette, sampled from the client's sheets ---------------------------------
// Not palette.ts's goblin block: every token in it was struck by the reference (cool
// slate cloak, gobCloakWorn mitts, gobSatchel, gobEarInner, brass earring, ink #222222,
// amber eyes at 0.770). These are region MODES off the plates, so they are the
// authored cel values, never an eyedropper guess.
const C = {
  clothBase: 0x4f5442, //  L 0.320 — 47% of the front figure, 75% of the back
  clothShade: 0x303127, //  L 0.188 — hood interior, under the hem
  skinLit: 0xabb772, //  L 0.688 — cheek, chin, jaw, hands
  skinEar: 0xa0ab67, //  L 0.642 — 0.046 under the cheek; separated by POSITION
  skinShade: 0x60623c, //  L 0.372 — the forehead under the hood's hem
  skinMid: 0x6b6e42, //  L 0.416 — the terminator's own width, and nowhere else
  eyeField: 0xfef15c, //  L 0.914 — the only saturated warm on him (r-b 166-178)
  eyeShade: 0x95853a, //  L 0.514 — the crescent. Painted, NOT a light response.
  pupil: 0x0c0e07, //  L 0.051
  pupilNotch: 0x4b4d31, //  the single lighter catchlight notch
  linen: 0xd2d0c4, //  L 0.814 — forearm + shin wraps; silhouette mark #5
  belt: 0x4e3e24, //  L 0.249 — the ONLY family on him where r > g
  pouch: 0x9e8e67, //  L 0.559 — small, right hip, clearest from behind
  throat: 0x9aa46a, //  L 0.616 — the throat tab: pale green cloth, the reference's own
  //                    small vertical patch between the hood's two front edges
  boot: 0x565338, //  L 0.320 — EQUAL to the cloak. Separated by line + wrap only.
  earTick: 0xf9efd5, //  L 0.938 — the BRIGHTEST marks on the figure
  contour: 0x1a1b10, //  L 0.102 — a dark OLIVE-black. Not neutral, not #222222.
  accent: 0x0a0b06, //  L 0.041 — pupils, deepest folds, the boot line
  tooth: 0xf0ede4,
};

const POSTER = 20; // see the header: the client's own tier density, and his three
//                    load-bearing values land within 0.002 of a plateau
assertPoster(POSTER); // the brush's amplitude is solved in THESE plateaux (§8)

// THE TWO CALIBRATION KNOBS, measured off the live framebuffer rather than assumed: a
// fully key-lit fragment returns KEY_GAIN x its albedo's linear luminance and an unlit
// one HEMI_GAIN x it. These are properties of the hero's rig — same numbers for cloth,
// skin, linen, belt and boot — so if a live read ever disagrees, these two move and
// nothing else does.
const KEY_GAIN = 0.594;
const HEMI_GAIN = 0.108;

/**
 * Author the two tiers the client PAINTED and solve the pigment that lands them.
 *
 * `unlit` is the value the garment holds where the key does not reach — the client's
 * shade tier, and a PAINTED decision in every one of his 38 frames. `lit` is the value
 * where it does. Both are given in the quantizer's own gamma-2.2 space, so the tier
 * asked for is the tier that appears. The albedo carries the difference (what the key
 * adds) and the emissive carries the floor (what the pigment holds without it).
 */
// sRGB transfer, written out rather than borrowed from THREE.Color's converters: this
// solve has to know exactly how many times a value has been encoded. It did not on the
// first pass — `convertLinearToSRGB()` followed by `getHex()` (which encodes again) put
// every pigment through the transfer twice and lifted the whole figure 3-5 tiers, which
// is what the live read caught: a cloak asked for 0.214 rendered at 0.426.
const s2l = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const l2s = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const byte = (v: number) => Math.max(0, Math.min(255, Math.round(l2s(v) * 255)));
const packLinear = (r: number, g: number, b: number) => (byte(r) << 16) | (byte(g) << 8) | byte(b);

function tone(hue: number, unlit: number, lit: number, gain = 1): { color: number; emissive: number } {
  const r = s2l(((hue >> 16) & 255) / 255);
  const g = s2l(((hue >> 8) & 255) / 255);
  const b = s2l((hue & 255) / 255);
  const lum = Math.max(1e-5, 0.2126 * r + 0.7152 * g + 0.0722 * b);
  const albLum = Math.max(1e-4, (Math.pow(lit, 2.2) - Math.pow(unlit, 2.2)) / KEY_GAIN);
  const emiLum = Math.max(0, Math.pow(unlit, 2.2) - HEMI_GAIN * albLum);
  // §8 — `gain` is the brush tile's inverse mean. The tile multiplies both the albedo and
  // the emissive, so without it a brushed surface renders at `mean` of the tier the two
  // lines above just solved. With it the AVERAGE fragment lands exactly on that tier and
  // the marks swing either side of it, which is the whole "within the committed tiers"
  // requirement expressed as one multiplication.
  const ka = (albLum / lum) * gain;
  const ke = (emiLum / lum) * gain;
  return {
    color: packLinear(r * ka, g * ka, b * ka),
    emissive: packLinear(r * ke, g * ke, b * ke),
  };
}

// ---- small maths ------------------------------------------------------------------
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
};
/** Hand-authored 1-D track: keys ascending in x, smoothstepped between. */
function track(keys: readonly (readonly [number, number])[], x: number): number {
  const n = keys.length;
  if (x <= keys[0][0]) return keys[0][1];
  if (x >= keys[n - 1][0]) return keys[n - 1][1];
  for (let i = 1; i < n; i++) {
    if (x <= keys[i][0]) {
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * sstep(keys[i - 1][0], keys[i][0], x);
    }
  }
  return keys[n - 1][1];
}
/** Uniform Catmull-Rom through a scalar key run. */
function cr(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t2 * t)
  );
}

// ---- the mesh builder --------------------------------------------------------------
//
// One geometry, many MATERIAL GROUPS. This is the mechanism that makes "one continuous
// skin" and "his cloth, his skin and his belt are different colours" the same object:
// a group boundary shares its vertices with its neighbour, so a colour change can never
// become a second outline. Winding is not trusted — `build()` measures the signed
// volume and flips the whole index buffer if the surface came out inside-out.
class Build {
  private pos: number[] = [];
  private uvs: number[] = [];
  private tags: BindTag[] = [];
  private slots = new Map<number, number[]>();
  /** Which bone family the vertices pushed from here belong to (§7). Set it before the
   *  part that needs it; 'none' emits no skin attributes at all, which is what the eyes
   *  and the pupils want — they are rigid children of the head bone. */
  bind: BindTag = 'none';
  /** §8 — THE BRUSH COORDINATE of the next vertex, IN WORLD UNITS: `bv` runs along the
   *  form's own length (down the cloth's hang, along the arm's run, out the ear's blade)
   *  and `bu` across it. World units, not 0..1, so `BRUSH_SPAN` is the brush's size
   *  everywhere on him and no part can end up with a different-sized mark than its
   *  neighbour. Both are TRUE ARC LENGTH walked on the surface points themselves — see
   *  `buildTrunk` and `tube` for why neither a warped angle nor a mirrored fold survived
   *  a live look. */
  bu = 0;
  bv = 0;

  v(x: number, y: number, z: number): number {
    this.pos.push(x, y, z);
    this.uvs.push(this.bu, this.bv);
    this.tags.push(this.bind);
    return this.pos.length / 3 - 1;
  }
  tri(a: number, b: number, c: number, slot: number): void {
    let t = this.slots.get(slot);
    if (!t) this.slots.set(slot, (t = []));
    t.push(a, b, c);
  }
  /** a = (row, col), b = (row, col+1), c = (row+1, col+1), d = (row+1, col). */
  quad(a: number, b: number, c: number, d: number, slot: number): void {
    this.tri(a, c, b, slot);
    this.tri(a, d, c, slot);
  }

  build(): { geom: THREE.BufferGeometry; order: number[] } {
    const order = [...this.slots.keys()].sort((a, b) => a - b);
    const index: number[] = [];
    const geom = new THREE.BufferGeometry();
    const p = new Float32Array(this.pos);

    // signed volume of the closed surface — negative means every triangle is wound
    // inward and the whole thing renders as its own interior
    let vol = 0;
    for (const s of order) {
      const t = this.slots.get(s)!;
      for (let i = 0; i < t.length; i += 3) {
        const [a, b, c] = [t[i] * 3, t[i + 1] * 3, t[i + 2] * 3];
        vol +=
          p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) +
          p[a + 1] * (p[b + 2] * p[c] - p[b] * p[c + 2]) +
          p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
      }
    }
    const flip = vol < 0;
    for (const s of order) {
      const t = this.slots.get(s)!;
      const start = index.length;
      for (let i = 0; i < t.length; i += 3) {
        if (flip) index.push(t[i], t[i + 2], t[i + 1]);
        else index.push(t[i], t[i + 1], t[i + 2]);
      }
      geom.addGroup(start, index.length - start, order.indexOf(s));
    }
    geom.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uvs), 2));
    geom.setIndex(index);
    geom.computeVertexNormals();
    if (this.tags.some((t) => t !== 'none')) attachSkin(geom, p, this.tags);
    return { geom, order };
  }
}

/** Solve §7's bind for every vertex and write the four-influence attributes three's
 *  skinning wants. Weights come out of `bindOf` as a function of the REST position, so
 *  the ink shell — which is these same vertices pushed out along their normals — binds
 *  to the same bones the fill does and can never peel off it. */
function attachSkin(geom: THREE.BufferGeometry, p: Float32Array, tags: BindTag[]): void {
  const n = tags.length;
  const si = new Uint16Array(n * 4);
  const sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const w = bindOf(tags[i], p[i * 3], p[i * 3 + 1], p[i * 3 + 2])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    let sum = 0;
    for (const [, k] of w) sum += k;
    if (!(sum > 0)) {
      si[i * 4] = BI.pelvis;
      sw[i * 4] = 1;
      continue;
    }
    for (let j = 0; j < w.length; j++) {
      si[i * 4 + j] = w[j][0];
      sw[i * 4 + j] = w[j][1] / sum;
    }
  }
  geom.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
  geom.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
}

// ---- materials ---------------------------------------------------------------------
//
// EVERY solid on him is a trilayer: poster tiers on the paint side, drybrush edge-wear
// at the rims, the authored stroke tiles carrying his graphite in ONE family direction
// per form (sheet basis, so a form is one continuous param space and never swirls per
// face). No fillMaterial, no paint({fill:}), no blobs, no hatching. That is the whole
// "he belongs to this film" argument, and it is structural rather than stated.
//
// STROKE DIRECTION IS THE DRAWING'S OWN (reference section 8.2):
//   cloth  1.45 rad — the reference's fold strokes run vertically on hood and skirt
//   skin   0.38 rad — one direction following the cheek's curve
//   ear    along the blade, MIRRORED per side, because each ear is its own form
//   linen  across the limb — how a bandage is wound; the wrap is a separate small
//          form, so that cross-limb family never meets the limb's own on one face
// Nothing crosses anywhere. The no-hatching hard gate is met by construction.
//
// WEAR IS THE LOST-AND-FOUND MAP (reference section 3.6 / 8.3): the drybrush is
// STRONGEST where the reference dropped its line (crown, shoulder tops, the ear's outer
// curve near the tip) and weakest where the reference pressed it (the hood's lower
// edge, the jaw, the boot line). The rim shell below carries the same map inverted, so
// the two agree instead of fighting.
// §8 — AND THE BRUSHWORK IS THE SAME ARGUMENT, ON THE PAINT SIDE. He is markAlive, so
// `triC` is 0 in every state and the authored graphite above never composes: the stroke
// tiles are a description of a drawing he does not show. Measured, that left his cowl
// rendering FORTY-EIGHT CONSECUTIVE PIXELS OF ONE LUMA at the shipped framing while the
// island's grass in the same frame carried 171 distinct values. So the same authorship
// lands on `triPaint` the way the island's does — a canvas-baked tile on `map` AND
// `emissiveMap` (goblinBrush.ts; the emissive is 94% of his rendered luminance on the
// camera-facing side, so a `map` alone would have modulated nothing) — with its family
// direction taken from THIS material's own `dir`, so paint and graphite draw the same
// figure in the same direction. The poster quantizes it afterwards, which is what keeps
// every mark on one of his committed tiers instead of inventing a value.
function mat(hue: number, wear: number, dir: number, unlit: number, lit: number) {
  const brush = brushFor((unlit + lit) / 2, dir);
  const t = tone(hue, unlit, lit, brush ? brush.gain : 1);
  const m = createTrilayer({
    color: t.color,
    wear,
    poster: POSTER,
    floor: unlit, // the same tier as a safety net, so nothing can fall through it
    stroke: { dir, sheet: true },
  });
  m.emissive = new THREE.Color(t.emissive);
  if (brush) {
    m.map = brush.tex;
    m.emissiveMap = brush.tex;
  }
  return m;
}

const DIR_CLOTH = 1.45;
const DIR_SKIN = 0.38;
const DIR_LINEN = 0.02;
const EAR_DIR = 0.66; // 38 deg above horizontal — the blade's own axis

// THE TIER PAIRS, aimed at the stage he actually stands on. The hero's key is BEHIND
// him, so the `unlit` half of each pair is what ~85% of his camera-facing pixels land
// on: that half must therefore carry the client's DOMINANT value, not his shade. Cloth
// unlit 0.325 measures back as sRGB 0.320 — the base that is 47% of the client's front
// figure and 75% of his back — and `lit` 0.375 is his lit plane 0.355 for the crown and
// the whole back view. His darker tiers are not lost: the hemisphere alone spreads a
// vertical surface's value by ~4 tiers between an up-facing fold and a down-facing one
// (measured on this build: crown 0.323, side 0.214, under-fold 0.158), which is the
// client's 0.143 - 0.355 range arriving from the form instead of from a paint job.
//
// THE FACE IS TWO GROUPS, split on the reference's own terminator. Its shade side is a
// painted decision in all 15 face plates — the hood outline is pixel-identical across
// them — so the shaded forehead (0.372) and the lit lower face (0.688) are authored as
// the two tiers the client measured, and the 0.416 mid appears in the transition. Both
// halves still take the key, so a real front light still moves the terminator and the
// Prep rig still softens it: the split guarantees the read, it does not replace lighting.
function makeMaterials() {
  return {
    hood: mat(C.clothBase, 0.13, DIR_CLOTH, 0.325, 0.375), //  crown: the line was dropped
    body: mat(C.clothBase, 0.12, DIR_CLOTH, 0.325, 0.375), //  hem/jaw: the line was pressed
    // THE CAVE. The reference paints it 0.188 and this quantizer has no tier there: its
    // plateaux either side are 0.157 and 0.213. 0.213 is the nearer of the two and the
    // honest one — asking for 0.19 landed 0.157, which is darker than the reference's own
    // darkest cloth. So the cave measures 0.213 against a stated 0.188, by 0.025, and the
    // step down from the outer hood's 0.322 is 0.109.
    inner: mat(C.clothShade, 0.05, DIR_CLOTH, 0.235, 0.28),
    throat: mat(C.throat, 0.09, DIR_CLOTH, 0.555, 0.605), //  the small pale-green tab
    face: mat(C.skinLit, 0.13, DIR_SKIN, 0.675, 0.725), //  0.688 — the lit lower face
    faceUp: mat(C.skinShade, 0.13, DIR_SKIN, 0.375, 0.475), //  0.372 — under the hood's hem
    faceMid: mat(C.skinMid, 0.13, DIR_SKIN, 0.425, 0.525), //  0.416 — the terminator's width
    belt: mat(C.belt, 0.07, DIR_LINEN, 0.225, 0.275), //  matte leather: a narrow range
    earR: mat(C.skinEar, 0.22, EAR_DIR, 0.625, 0.675),
    earL: mat(C.skinEar, 0.22, Math.PI - EAR_DIR, 0.625, 0.675), //  mirrored: one family per form
    sleeve: mat(C.clothBase, 0.13, DIR_CLOTH, 0.325, 0.375),
    linen: mat(C.linen, 0.14, DIR_LINEN, 0.825, 0.85), //  silhouette mark #5: it must stay pale
    hand: mat(C.skinLit, 0.13, DIR_SKIN, 0.675, 0.725),
    boot: mat(C.boot, 0.07, 0.2, 0.325, 0.375), //  the boot's tier EQUALS the cloak's
    // AMENDED: 0.575 put a pale oval on a dark hip and it read as a stain, which is half
    // of why the judge called the satchel a splat. It sits two tiers over the cloth now,
    // and its shape does the work instead of its value.
    pouch: mat(C.pouch, 0.1, DIR_LINEN, 0.40, 0.45),
  };
}

// ===================================================================================
// 1. THE TRUNK — one lofted skin, crown to hem
// ===================================================================================
//
// [y, rx, rz, cx, cz]. Every landmark row is the reference's own measurement; the rows
// between are hand-shaped so the curve between two landmarks is a curve and not a cone.
// The read this table exists to produce is section 2's: A DOME ON A STUMP — head 93 px
// against a body max of 64 px, head : widest body = 1.45 : 1. (The design doc's "bell",
// its "cloak hem is the widest body element" and gate G3 are struck and inverted.)
type Key = [number, number, number, number, number];
const TRUNK: Key[] = [
  // Re-authored against a live silhouette scan of this build (the profile probe reads
  // the rendered figure row by row and prints width/H at the reference's own landmark
  // fractions). The first pass measured 0.350 of H at f 0.04 where the client's plate
  // measures 0.249 — a crown a third too fat, which is what made the back view read as
  // a rounded box instead of a dome.
  [0.9, 0.0, 0.0, 0.0, 0.01], //  crown — apex of the figure, a little forward of centre
  [0.897, 0.03, 0.034, 0.0, 0.011], //  a spherical cap, not a cone: r ~ sqrt(2Rd)
  [0.89, 0.066, 0.073, -0.001, 0.011],
  [0.88, 0.098, 0.106, -0.001, 0.011],
  [0.864, 0.112, 0.122, -0.002, 0.01], //  f 0.04 -> 0.249 H, the client's own number
  [0.85, 0.135, 0.143, -0.002, 0.009],
  [0.846, 0.146, 0.153, -0.002, 0.008], //  ...the overhang is the two rows
  [0.841, 0.1525, 0.16, -0.003, 0.008], //  0.062 H -> 0.339 H, the hood's front hem
  [0.81, 0.18, 0.181, -0.003, 0.005], //  f 0.10
  [0.765, 0.205, 0.2, -0.003, 0.002], //  f 0.15
  [0.717, 0.2205, 0.2105, -0.003, -0.004], //  ear tips, 0.203 H
  [0.69, 0.225, 0.213, -0.003, -0.005],
  // through the FACE BAND the keys are dense on purpose: the material boundary between
  // the shaded forehead and the lit lower face lands on a ring, so a sparse loft turns
  // the client's terminator into a staircase (it did — 0.031 of ring spacing measured
  // as 21 CSS px of stair at plate scale)
  [0.67, 0.228, 0.2148, -0.002, -0.006],
  [0.655, 0.2298, 0.216, -0.002, -0.006], //  eye line
  [0.64, 0.2315, 0.2168, -0.002, -0.007],
  [0.62, 0.2337, 0.2176, -0.001, -0.0075],
  [0.6, 0.2354, 0.2185, 0.0, -0.008],
  [0.576, 0.2364, 0.219, 0.001, -0.008], //  0.36 H — 93 px, the widest thing on him...
  [0.54, 0.2364, 0.219, 0.002, -0.008],
  [0.52, 0.2362, 0.2187, 0.003, -0.0075], //  chin, 0.424 H — still inside the wide band
  [0.508, 0.235, 0.2175, 0.003, -0.007], //  ...0.44 H — and it holds 93 px to here
  [0.5, 0.2295, 0.2125, 0.003, -0.005],
  // THE HOOD'S HEM IS A FOLD, not a value change (judge item 11). The cloth swells a
  // little as it turns, then tucks under in 0.005 of height: from behind that is the
  // difference between an edge you can see the thickness of and a line painted on a dome.
  [0.4885, 0.216, 0.201, 0.003, -0.002],
  [0.479, 0.2125, 0.198, 0.003, 0.0],
  [0.472, 0.206, 0.1925, 0.002, 0.001],
  [0.466, 0.1975, 0.1855, 0.002, 0.001], //  0.48 H — the hood's bottom edge, 77 px
  [0.452, 0.176, 0.1675, 0.001, 0.003],
  [0.432, 0.1449, 0.142, 0.0, 0.004], //  0.52 H — shoulder, 57 px
  [0.4, 0.1345, 0.1315, 0.0, 0.005],
  [0.356, 0.1271, 0.1245, 0.0, 0.004], //  0.605 H — waist, narrowest, 50 px
  [0.33, 0.1275, 0.125, 0.0, 0.003],
  [0.318, 0.1285, 0.1258, 0.0, 0.002], //  belt top
  [0.281, 0.1295, 0.1265, 0.0, 0.0], //  belt bottom
  [0.25, 0.1272, 0.1245, 0.0, -0.002], //  0.712 H — the HANDS pass outside this
  [0.21, 0.1284, 0.125, 0.0, -0.004],
  [0.18, 0.1298, 0.1248, 0.0, -0.005],
  // AMENDED. The hem stepped in at y 0.162, which measures f 0.767: the client's plate
  // still carries 0.288 H of tunic at f 0.82 and this build carried 0.197. The tunic was
  // 0.05 H short and the legs read that much long, so the whole run below the belt drops.
  [0.1465, 0.1316, 0.1258, 0.0, -0.005], //  0.82 H — tunic hem, 51 px; the legs separate
  [0.1425, 0.113, 0.109, 0.0, -0.005], //  the hem rolls under: a real edge, not a card
  [0.1405, 0.093, 0.089, 0.0, -0.005],
];

const RINGS = 88;
const SEG = 64;

/** The cross-section at loft parameter t in 0..1 (crown to hem). */
function ring(t: number): Key {
  const segs = TRUNK.length - 1;
  const g = clamp01(t) * segs;
  const s = Math.min(segs - 1, Math.floor(g));
  const f = g - s;
  const k = (j: number) => TRUNK[Math.max(0, Math.min(TRUNK.length - 1, j))];
  const out = [0, 0, 0, 0, 0] as Key;
  for (let c = 0; c < 5; c++) out[c] = cr(k(s - 1)[c], k(s)[c], k(s + 1)[c], k(s + 2)[c], f);
  out[1] = Math.max(0, out[1]);
  out[2] = Math.max(0, out[2]);
  return out;
}

// ---- the face window ---------------------------------------------------------------
//
// The head mass measures 93 px wide while the face window inside it is only ~53 px:
// that difference is the two hood LAPPETS hanging beside the face to jaw level
// (reference section 4.1), and here they are literally the cloth left standing outside
// this window. The window narrows at the brow and closes to a tongue at the throat, so
// the lappet's inner edge and the throat tab both fall out of one function.
const FACE_W: readonly (readonly [number, number])[] = [
  [0.0, 0.26], //  chin — the window has closed to the jaw's width
  [0.12, 0.4],
  [0.3, 0.585],
  // AMENDED at the eye band. The almond is 0.24-0.27 head widths wide with its centres
  // 0.363 apart, so its OUTER end lands past a 0.57 aperture — in the reference the eyes
  // touch the hood, and they should. At 0.598 rad the fold wall ate 22% of the almond's
  // width and the measured eye came back 62 px against the reference's 69-78.
  [0.55, 0.663],
  [0.78, 0.648],
  [0.92, 0.52],
  [1.0, 0.4], //  brow — the cowl closes over the forehead
];
// How far the face sits BEHIND the hood's outer surface. At the brow this is the
// overhang's depth, and it is the number that decides where the key's terminator lands
// (section 8.4: the hood shadow must cross the TOP THIRD of the eyes, not stop above
// them). It is a lighting quantity, not paint — under the Prep rig the terminator
// softens and rises on its own, which is the client's own frames 4 / 10 / 13.
const FACE_D: readonly (readonly [number, number])[] = [
  [0.0, 0.06],
  [0.2, 0.052],
  [0.45, 0.055],
  [0.62, 0.06],
  [0.85, 0.07],
  [1.0, 0.078],
];
const FOLD = 0.075; // half-width of the fold, in radians

// THE GRID IS WARPED PER RING so that two of its columns sit exactly on the window's two
// edges. This is what turns the fold into a drawn edge: on the first pass a fixed
// angular grid cut the boundary diagonally across quads and the face window came out as
// a visible staircase. Pinning the edge to a column makes the wall exactly
// COL_FOLD - COL_FACE quads wide on EVERY ring, puts the material change on it, and
// costs nothing — the same 64 columns, moved.
const COL_FACE = 10; // columns 0..10 out from the front centre are inside the window
const COL_FOLD = 12; // 10..12 is the fold wall — the hood's inner edge, and the lappet's
// 12..15 is the CAVE: the inner face of the cowl, which the reference paints `#303127`
// 0.188 — its darkest cloth — and which this build measured at `#505445` 0.322, identical
// to the outer hood. With no cave the face aperture read ~0.72 of head width against the
// reference's ~0.57, which is why the head read as a helmet with a face printed on it.
const COL_EDGE = 17;

/** The cowl's front RIM, as one curve: the arch over the forehead, then down past the
 *  cheeks, reaching the hood's own hem at column 19 — which is 88 deg round, i.e. the
 *  silhouette. Everything inside it and outside the window is cave.
 *
 *  It has to be ONE closing curve. A cave bounded by a fixed column instead came out as a
 *  hard faceted ring with a straight outer edge across the front of the head — a visor,
 *  the same read the client rejected. Closing the region ON the silhouette means the
 *  boundary has nowhere to show: where the two tiers meet, the surface is edge-on. */
function hoodEdgeY(m: number): number {
  const a = Math.abs(m);
  if (a <= COL_FACE) return Y_BROW - 0.018 * (a / COL_FACE) ** 2;
  const g = clamp01((a - COL_FACE) / (COL_EDGE - COL_FACE));
  const top = Y_BROW - 0.018;
  return top - (top - (Y_HOOD_HEM - 0.02)) * g * g;
}

/** Angular half-width of the face/throat window at height y; 0 where the skin is cloth. */
function windowHalf(y: number): number {
  if (y > Y_BROW || y < Y_COLLAR) return 0;
  if (y >= Y_CHIN) return track(FACE_W, (y - Y_CHIN) / (Y_BROW - Y_CHIN));
  // below the chin the window necks down HARD to the throat tab between the two lappets:
  // the client's tab is ~0.11 head-widths. AMENDED: it was 0.13-0.26 rad, which draws a
  // 0.25-head-width tongue — twice the reference — and at the recess depth below it read
  // as a dark bar with pale ticks rather than as the reference's small pale-green patch.
  const g = (y - Y_COLLAR) / (Y_CHIN - Y_COLLAR);
  return 0.085 + 0.035 * g;
}
/** The half-angle the GRID is laid out on: continuous everywhere, including above the
 *  brow and below the collar, so the columns never twist between rings. */
function windowWarp(y: number): number {
  return Math.max(0.17, windowHalf(Math.min(Y_BROW, Math.max(Y_COLLAR, y))));
}
/** Column offset m -> angle, with |m| = COL_FACE and COL_FOLD pinned to the two edges. */
function colAngle(m: number, y: number): number {
  const w = windowWarp(y);
  const a = Math.abs(m);
  const half = SEG / 2;
  const u =
    a <= COL_FACE
      ? (a / COL_FACE) * (w - FOLD)
      : a <= COL_FOLD
        ? w - FOLD + ((a - COL_FACE) / (COL_FOLD - COL_FACE)) * 2 * FOLD
        : w + FOLD + ((a - COL_FOLD) / (half - COL_FOLD)) * (Math.PI - w - FOLD);
  return m < 0 ? -u : u;
}
/** The vertical half of the window: a near-hard cut at the brow, which IS the overhang.
 *  It DROPS toward the sides, so the hood's opening is an arch rather than a visor —
 *  a flat cut at one height is what made the first pass read as a motorcycle helmet. */
function windowVert(f: number, y: number): number {
  const top = Y_BROW - 0.018 * f * f;
  return sstep(top + 0.005, top - 0.005, y) * sstep(Y_COLLAR - 0.012, Y_COLLAR + 0.012, y);
}
/** Read off the COLUMN, so a vertex is unambiguously inside or outside the window. */
function recessCol(m: number, y: number): number {
  const a = Math.abs(m);
  const t = a <= COL_FACE ? 1 : a >= COL_FOLD ? 0 : 1 - (a - COL_FACE) / (COL_FOLD - COL_FACE);
  return t * windowVert(clamp01(a / COL_FACE), y);
}
/** The same thing as a function of angle — what the eyes and the marks read. */
function recess(u: number, y: number): number {
  const w = windowHalf(y);
  if (w <= 0) return 0;
  const a = Math.abs(u);
  return (
    (1 - sstep(w - FOLD, w + FOLD, a)) * windowVert(clamp01(a / Math.max(1e-3, w - FOLD)), y)
  );
}
/** Recess depth at (u, y) — flattened toward the edges so the face is a face, not a bowl. */
function faceDepth(u: number, y: number): number {
  const fy = y >= Y_CHIN ? (y - Y_CHIN) / (Y_BROW - Y_CHIN) : 0;
  // the throat tab is a PATCH OF CLOTH lying on the collar, not a pit: at the old
  // 0.09-0.12 it sat far enough back to fall out of the key entirely and went to ink
  const base = y >= Y_CHIN ? track(FACE_D, fy) : 0.032 + 0.028 * (1 - (y - Y_COLLAR) / (Y_CHIN - Y_COLLAR));
  return base * (1 - 0.26 * (1 - Math.cos(u)));
}

// ---- the cloth's own work ----------------------------------------------------------
//
// The island is the quality bar for SURFACE, and it is worked. A smooth Lambert mass is
// the diagnosis the shipped figure failed on, so the cloth carries authored relief: fold
// ridges running vertically (which is also the cloth's stroke family, so the geometry
// and the graphite agree), a belt cinch, a shoulder swell where the arms leave, and a
// low-frequency lobe that makes his two sides genuinely different. Every term is an
// integer harmonic of u, so it is periodic by construction and the loft's seam at u = 0
// cannot crack open. sin(k*u) is odd, which is why the folds are asymmetric for free.
const CLOTH_AMP: readonly (readonly [number, number])[] = [
  [0.156, 1.15], //  the skirt: the reference's strongest vertical fold strokes
  [0.279, 1.0],
  [0.3, 0.3], //  belt: cinched, the folds die
  [0.34, 0.35],
  [0.44, 0.75], //  chest / shoulders
  [0.6, 0.7], //  hood
  [0.84, 0.4],
  [0.9, 0.12], //  crown: smooth cloth. Its creases are AUTHORED MARKS, not geometry.
];
function clothWork(u: number, y: number): number {
  const a = track(CLOTH_AMP, y);
  const folds =
    0.0092 * Math.sin(3 * u + 0.7 + y * 1.1) +
    0.0064 * Math.sin(5 * u - 1.9 - y * 0.8) +
    0.0038 * Math.sin(8 * u + 2.6 + y * 1.6) +
    0.0021 * Math.sin(13 * u - 0.4);
  // one slow lobe — he is not bilaterally identical, and this is where that starts
  const lobe = 0.0045 * Math.sin(u + 0.45) * sstep(0.9, 0.45, y);
  // the belt pulls the cloth in; the tunic bunches just above it
  const cinch = -0.0075 * Math.exp(-Math.pow((y - (Y_BELT_T + Y_BELT_B) / 2) / 0.028, 2));
  const bunch = 0.005 * Math.exp(-Math.pow((y - Y_BELT_T - 0.028) / 0.026, 2));
  // the cowl's spine crease and the gather at the nape — the back is 18 of the client's
  // 38 frames and it has to read as a picture on its own
  const back = Math.PI - Math.abs(u);
  const crease = -0.007 * Math.exp(-Math.pow(back / 0.26, 2)) * sstep(0.45, 0.62, y);
  // THE NAPE GATHER, item 11. The back was a featureless dome with one crease and the
  // client drew this view 18 times in 38, so the cloth has to bunch where the hood meets
  // the shoulders: a ridge across the nape, and a second, lower fold under it.
  const nape =
    0.017 * Math.exp(-Math.pow((y - 0.487) / 0.026, 2)) * Math.exp(-Math.pow(back / 0.95, 2)) +
    0.009 * Math.exp(-Math.pow((y - 0.446) / 0.022, 2)) * Math.exp(-Math.pow((back - 0.42) / 0.55, 2)) +
    0.008 * Math.exp(-Math.pow((y - 0.452) / 0.02, 2)) * Math.exp(-Math.pow((back + 0.46) / 0.5, 2));
  // the hood folds AROUND the ear's root, so a blade grows out of cloth rather than
  // lying on it — the far ear at three-quarter was the one place A still read as a part
  const earFold =
    0.0085 * Math.exp(-Math.pow((y - 0.6) / 0.052, 2)) * Math.exp(-Math.pow((Math.abs(u) - 0.53) / 0.28, 2));
  // one hip takes the heavier hang (item 13)
  const hipHang = 0.011 * Math.exp(-Math.pow((y - 0.235) / 0.08, 2)) * Math.pow(0.5 + 0.5 * Math.sin(u + 0.35), 2);
  // the shoulders swell where the arms leave the mass, so a limb grows out of a body
  const sh =
    0.006 *
    Math.exp(-Math.pow((y - Y_SHOULDER - 0.012) / 0.04, 2)) *
    Math.pow(Math.abs(Math.sin(u)), 3);
  return folds * a + lobe + cinch + bunch + sh + crease + nape + earFold + hipHang;
}

/** THE HEM DOES NOT FALL LEVEL. Judge item 13: both boots level, hem level, arms
 *  mirrored — nothing carried weight and he read as a figurine. The client's stance IS
 *  even-weighted, so the weight goes into the CLOTH: the skirt's lower edge is pushed
 *  down per column, so one hip hangs a heavier fall than the other and the silhouette
 *  below the belt has a rhythm. Two odd harmonics, so it is periodic and the loft's seam
 *  at u = 0 cannot crack. */
function hemDrop(u: number, y: number): number {
  // ONE-SIDED. A symmetric drop takes the same bite out of both shins and mark #5 (the
  // pale shin band) goes with it; a one-sided fall is also what the phrase means.
  const skirt =
    -(0.016 * Math.pow(0.5 + 0.5 * Math.sin(u + 1.1), 2) + 0.004 * Math.sin(3 * u - 0.6)) *
    sstep(0.30, 0.16, y);
  // AND THE COWL'S HEM IS A CURVE, not a level cut round the head. Item 11 again: from
  // behind, a hood whose bottom edge is one straight horizontal line across the full width
  // is a lid on a jar — the exact read the client rejected in the other study. It dips
  // over the spine, so the cowl ends in a rounded point and the shoulders come out under it.
  const back = Math.PI - Math.abs(u);
  const cowl = -0.03 * Math.exp(-Math.pow(back / 0.92, 2)) * Math.exp(-Math.pow((y - 0.4775) / 0.045, 2));
  return skirt + cowl;
}

// The trunk surface, as one function — the eyes, the marks and the ear roots all read
// it, so nothing can be placed somewhere the skin is not.
function surfaceAt(u: number, y: number, r: Key, rec: number): THREE.Vector3 {
  const work = (1 - rec) * clothWork(u, y);
  const rx = r[1] + work;
  const rz = r[2] + work;
  return new THREE.Vector3(
    r[3] + rx * Math.sin(u),
    y + hemDrop(u, y),
    r[4] + rz * Math.cos(u) - rec * faceDepth(u, y),
  );
}
const surface = (u: number, y: number, r: Key) => surfaceAt(u, y, r, recess(u, y));

const SLOT = { HOOD: 0, BODY: 1, INNER: 2, FACE: 3, BELT: 4, FACE_UP: 5, FACE_MID: 6, THROAT: 7 };

// THE ONE SHADOW LINE. The hood's overhang throws a single terminator, and both the skin
// and the EYE read it off this function — that is the whole of judge item 3. Before, the
// eye's shade crescent was a separate painted rim shape and the skin's terminator was a
// level band; they met at the eye top and disagreed, in the most-looked-at place on him.
// It is a shallow DIAGONAL, not a level line: sin(u) is odd, so one side of the face
// carries more shadow than the other for free and the cut can never read as a visor.
const TERM_Y = 0.6765; // world y at the face's centre — the eyes' upper third
const TERM_TILT = 0.016;
const termY = (u: number) => TERM_Y + TERM_TILT * Math.sin(u);
/** 2 = the shaded forehead, 1 = the terminator's own width, 0 = the lit lower face. */
const faceUpper = (u: number, y: number) => {
  const t = termY(u);
  return y > t ? 2 : y > t - 0.014 ? 1 : 0;
};

function buildTrunk(): { geom: THREE.BufferGeometry; order: number[] } {
  const b = new Build();
  b.bind = 'trunk';
  const rows: Key[] = [];
  for (let i = 0; i < RINGS; i++) rows.push(ring(i / (RINGS - 1)));
  const idx: number[][] = [];
  const pole = b.v(TRUNK[0][3], TRUNK[0][0], TRUNK[0][4]);

  // column j carries the signed offset m from the FRONT centre (m = 0 is his +z)
  const mOf = (j: number) => (j <= SEG / 2 ? j : j - SEG);
  // §8's brush v: TRUE ARC LENGTH down the front profile, not the ring's y. The loft is
  // dense through the face band and nearly horizontal over the crown, so a y-based v
  // would stretch the marks to four times their width across the top of the hood and
  // crush them at the eyes — the one place a repeat would be seen.
  const arc: number[] = [0];
  for (let i = 1; i < RINGS; i++) {
    arc.push(arc[i - 1] + surface(0, rows[i][0], rows[i]).distanceTo(surface(0, rows[i - 1][0], rows[i - 1])));
  }
  // §8 — THE RING IS WALKED ONCE, ALL THE WAY ROUND, FROM HIS RIGHT FLANK.
  //
  // Two things had to be true at once and each broke the other. (1) The brush u must be
  // the ring's TRUE ARC LENGTH walked on the surface points: the grid is WARPED per ring
  // (colAngle pins two columns to the face window's edges) and the window's half-angle
  // swings from 0.26 rad at the chin to 0.66 at the eyes, so an angle-based u sheared the
  // face's marks into hard-edged blocks — measured on the front plate at 11×, on the most
  // looked-at surface he has. (2) The walk must not fold. The first fix mirrored u about
  // the front and back centre-lines to dodge the loft's wrap, and the BACK PLATE came back
  // a Rorschach: the cowl's left half was the pixel mirror of its right, and 18 of the
  // client's 38 frames are back views.
  //
  // So the column order is rotated to start at SEAM_T and the row carries ONE EXTRA vertex
  // that repeats the first column's position with the full circumference as its u. The
  // walk is then monotone the whole way round, nothing mirrors, and the one discontinuity
  // the wrap must have lands on HIS RIGHT FLANK — the line that is edge-on and inside the
  // silhouette in the front plate, the three-quarter and the back alike. It costs 88
  // vertices and no triangles.
  const SEAM_T = SEG / 4;
  const colOf = (t: number) => (SEAM_T + t) % SEG;
  for (let i = 0; i < RINGS; i++) {
    const r = rows[i];
    const row: number[] = [];
    b.bv = arc[i];
    const pts: THREE.Vector3[] = [];
    for (let t = 0; t <= SEG; t++) {
      const m = mOf(colOf(t));
      pts.push(surfaceAt(colAngle(m, r[0]), r[0], r, recessCol(m, r[0])));
    }
    let u = 0;
    for (let t = 0; t <= SEG; t++) {
      if (t > 0) u += pts[t].distanceTo(pts[t - 1]);
      b.bu = u;
      row.push(b.v(pts[t].x, pts[t].y, pts[t].z));
    }
    idx.push(row);
  }

  const slotFor = (m: number, y: number): number => {
    const rec = recessCol(m, y);
    if (rec > 0.72) {
      // below the chin the window is no longer face: it is the throat tab, a small pale
      // patch of cloth between the hood's two front edges (reference §4.1)
      if (y < Y_CHIN) return SLOT.THROAT;
      return [SLOT.FACE, SLOT.FACE_MID, SLOT.FACE_UP][faceUpper(colAngle(m, y), y)];
    }
    if (rec > 0.1) return SLOT.INNER; // the fold wall = the hood's interior tier
    // THE CAVE: the inner face of the cowl, from the fold out to COL_EDGE and from the
    // hood's own front edge down to its hem. Cloth, not a paint job — the same tier the
    // fold wall already carries, so the two are one surface at one value.
    if (Math.abs(m) <= COL_EDGE && y < hoodEdgeY(m) && y > Y_HOOD_HEM - 0.02) return SLOT.INNER;
    if (y < 0.3195 && y > 0.2805) return SLOT.BELT;
    return y > Y_HOOD_HEM ? SLOT.HOOD : SLOT.BODY;
  };

  // crown fan
  for (let t = 0; t < SEG; t++) {
    b.tri(pole, idx[0][t], idx[0][t + 1], SLOT.HOOD);
  }
  for (let i = 0; i < RINGS - 1; i++) {
    const yMid = (rows[i][0] + rows[i + 1][0]) / 2;
    for (let t = 0; t < SEG; t++) {
      // the quad's own column offset: the boundary is pinned to a column, so this is
      // exact rather than a sample of a continuous test
      const m1 = mOf(colOf(t));
      const m2 = mOf(colOf(t + 1));
      const mMid = m1 + (m2 > m1 ? 0.5 : -0.5);
      b.quad(idx[i][t], idx[i][t + 1], idx[i + 1][t + 1], idx[i + 1][t], slotFor(mMid, yMid));
    }
  }
  // close the hem — the legs come through it, but a closed surface is what lets the
  // ink shell offset along a welded normal instead of tearing at an open rim
  const capC = b.v(0, rows[RINGS - 1][0] - 0.004, rows[RINGS - 1][4]);
  for (let t = 0; t < SEG; t++) {
    b.tri(capC, idx[RINGS - 1][t + 1], idx[RINGS - 1][t], SLOT.INNER);
  }
  return b.build();
}

// ===================================================================================
// 2. LOFTED TUBES — ears, arms, legs
// ===================================================================================
//
// Each one's FIRST cross-section is inside the trunk's volume, so the join is buried in
// the mass and the eye never catches it: what the silhouette shows is one outline with
// a blade / an arm / a boot growing out of it. The ear's V against the hood, the notch
// between the boots and the hands at the hips are then real negative space, which is
// exactly the four spaces the reference uses (section 2).
interface Node {
  p: THREE.Vector3;
  breadth: number; // half-extent in the form's own plane
  thick: number; // half-extent out of it
  slot: number;
}
function tube(b: Build, nodes: Node[], planeN: THREE.Vector3, seg = 12): void {
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const rows: number[][] = [];
  // §8's brush v: distance travelled along the tube's own spine, so the family runs the
  // LENGTH of the limb — the arm's run, the ear's blade, the boot's foot — and the mark
  // is the same size here as on the trunk because both are world units.
  let run = 0;
  for (let i = 0; i < nodes.length; i++) {
    T.copy(nodes[Math.min(i + 1, nodes.length - 1)].p)
      .sub(nodes[Math.max(i - 1, 0)].p)
      .normalize();
    N.copy(planeN).addScaledVector(T, -planeN.dot(T)).normalize();
    B.crossVectors(T, N).normalize();
    if (i > 0) run += nodes[i].p.distanceTo(nodes[i - 1].p);
    b.bv = run;
    const row: number[] = [];
    // …and the brush u walks the section ONCE, all the way round, with one repeated
    // vertex closing it — the trunk's own rule and for the trunk's own reason. The walk
    // starts a quarter turn on, which on a blade (the ear) is its thin EDGE and on a limb
    // is its side, so the wrap's one discontinuity has nowhere to show.
    const off = Math.round(seg / 4);
    let u = 0;
    let px = 0;
    let py = 0;
    let pz = 0;
    for (let j = 0; j <= seg; j++) {
      const a = ((j + off) / seg) * Math.PI * 2;
      const x = nodes[i].p.x + N.x * nodes[i].thick * Math.cos(a) + B.x * nodes[i].breadth * Math.sin(a);
      const y = nodes[i].p.y + N.y * nodes[i].thick * Math.cos(a) + B.y * nodes[i].breadth * Math.sin(a);
      const z = nodes[i].p.z + N.z * nodes[i].thick * Math.cos(a) + B.z * nodes[i].breadth * Math.sin(a);
      if (j > 0) u += Math.hypot(x - px, y - py, z - pz);
      px = x;
      py = y;
      pz = z;
      b.bu = u;
      row.push(b.v(x, y, z));
    }
    rows.push(row);
  }
  b.bu = 0;
  b.bv = 0;
  const c0 = b.v(nodes[0].p.x, nodes[0].p.y, nodes[0].p.z);
  for (let j = 0; j < seg; j++) b.tri(c0, rows[0][j + 1], rows[0][j], nodes[0].slot);
  for (let i = 0; i < nodes.length - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const j2 = j + 1;
      // circulation is the REVERSE of the trunk's: a tube's rows run along the spine and
      // its columns around it, so passing them in the trunk's order winds the sides
      // INWARD while the two end caps stay outward. That mesh is not consistently
      // oriented, the signed-volume test then has nothing meaningful to measure, and the
      // ink shell offsets along inward normals — which is what painted the arms and the
      // boot toes solid black (measured: every sampled arm triangle wound inward while
      // every trunk triangle wound outward).
      b.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j2], rows[i][j2], nodes[i + 1].slot);
    }
  }
  const last = nodes.length - 1;
  b.bu = 0;
  b.bv = run;
  const cN = b.v(nodes[last].p.x, nodes[last].p.y, nodes[last].p.z);
  for (let j = 0; j < seg; j++) b.tri(cN, rows[last][j], rows[last][j + 1], nodes[last].slot);
}

// ---- ears ---------------------------------------------------------------------------
//
// SYMMETRIC, and they buy WIDTH, not height (the design doc's "ears buy height", its
// unequal EAR_Z_R / EAR_Z_L pair and gate G2 are all struck: measured, both tips sit
// 0.203 H BELOW the crown in all 23 plates and are level with each other). ONE constant
// governs both blades. The blade leaves the skull nearly sideways and CURLS UP along
// its length — a shallow banana, not a spike — and its root is buried 0.12 units inside
// the hood, which is where the reference's V of clean paper comes from.
// AMENDED TWICE against the judge. (10) The blade was a flat leaf: no thickness at the
// root, no taper in depth, and its outer edge ran 53 deg off vertical near the tip where
// the client draws 14-34 — a spike, not the shallow banana. (15) It was a pure SIDEWAYS
// blade, so he measured exactly as wide from behind as from the front: back aspect 1.343
// against the client's 1.53-1.59 across all 8 back plates. A blade angled FORWARD is
// nearer the camera from the front and further from it behind, so one blade can hit both
// the front's 0.745 H and the back's narrower read. The tip's x comes in to pay for it.
const EAR_ROOT = new THREE.Vector3(0.096, 0.612, 0.012);
const EAR_TIP = new THREE.Vector3(0.317, Y_EAR_TIP, 0.172);
function earNodes(side: 1 | -1): Node[] {
  // the curl: t is along the blade, the rise accelerates toward the tip
  const path: [number, number, number, number, number][] = [
    // [t, xLerp, yLerp, breadth, thickness]
    [0.0, 0.0, 0.0, 0.046, 0.036],
    [0.2, 0.25, 0.06, 0.058, 0.032],
    [0.4, 0.49, 0.19, 0.061, 0.026],
    // the outer third tapers HARD: the blade's width axis runs down-and-out, so a fat
    // node at 0.88 puts the widest row BELOW the tip and G2 (tips are the widest row,
    // f 0.17-0.24) fails on a technicality — measured f 0.243 before this taper
    [0.58, 0.69, 0.37, 0.05, 0.02],
    [0.74, 0.84, 0.57, 0.033, 0.013],
    [0.88, 0.95, 0.78, 0.016, 0.0075],
    [1.0, 1.0, 1.0, 0.004, 0.002],
  ];
  return path.map(([, fx, fy, br, th]) => ({
    p: new THREE.Vector3(
      side * (EAR_ROOT.x + (EAR_TIP.x - EAR_ROOT.x) * fx),
      EAR_ROOT.y + (EAR_TIP.y - EAR_ROOT.y) * fy,
      EAR_ROOT.z + (EAR_TIP.z - EAR_ROOT.z) * fx,
    ),
    breadth: br,
    thick: th,
    slot: side > 0 ? 0 : 1,
  }));
}

// ---- the hood's two lappets -----------------------------------------------------------
//
// Reference §4.1: two flaps of cloth beside the face, hanging to JAW level, each with its
// own end. They are what makes the head mass 93 px wide while the face window inside it is
// only 53 px, and they are what stops a hood reading as a helmet. The first pass let the
// hood's own sides serve instead and the judge called it: no lappets.
//
// Built the way the ears and the arms are built, which is the only reason they do not read
// as two more parts: the first node is BURIED inside the hood's volume, so what the
// silhouette shows is one outline with a flap growing out from under the cowl's front edge.
// Their path is READ OFF the trunk's own surface at the window's outer angle, so a lappet
// can never end up somewhere the head is not, and it follows the cowl's curve for free.
function lappetNodes(side: 1 | -1): Node[] {
  // [y, radians outside the fold, breadth, thickness, how proud of the cowl]
  const rows: [number, number, number, number, number][] = [
    // PROUD is deliberately small. A flap standing clear of the cowl gets its own heavy
    // ink outline from the shell and reads as a plate of armour at 4x; a flap that mostly
    // lies in the cloth gets a thin line down its inner edge, which is the line the
    // reference actually draws, and keeps its own END at the jaw.
    [0.756, 0.06, 0.021, 0.009, -0.018], //  root, inside the mass
    [0.716, 0.12, 0.031, 0.013, -0.005],
    [0.668, 0.155, 0.037, 0.016, 0.002],
    [0.616, 0.168, 0.038, 0.017, 0.004],
    [0.568, 0.158, 0.035, 0.015, 0.004],
    [0.532, 0.132, 0.027, 0.011, 0.004],
    [0.508, 0.1, 0.011, 0.004, 0.003], //  the flap's own end, at the jaw
  ];
  return rows.map(([y, out, br, th, proud]) => {
    const r = ringAtY(y);
    const u = side * (windowHalf(y) + FOLD + out);
    const p = surface(u, y, r);
    p.x += Math.sin(u) * proud;
    p.z += Math.cos(u) * proud;
    return { p, breadth: br, thick: th, slot: 0 };
  });
}

// ---- arms ---------------------------------------------------------------------------
// shoulder -> hand = 0.20 H = 0.47 head-units. VERY short, and the hands are BARE GREEN
// at the same value as the face (mitts struck; no gloves, no sleeve over the hand).
function armNodes(side: 1 | -1): Node[] {
  const rows: [number, number, number, number, number][] = [
    // [x, y, z, radius, slot]  slot 0 sleeve / 1 linen wrap / 2 bare hand
    // AMENDED. The waist measured 0.329 H against the client's 0.282 and the arms were
    // what pushed it: the client draws them INSIDE the tunic's outline and separates them
    // by value alone. They come in 0.013 at the elbow and forward 0.010, so they clear the
    // hip in depth rather than in width. The HANDS do not move — 0.361 against 0.362 was
    // exact and had to stay exact.
    [0.074, 0.452, 0.004, 0.044, 0],
    [0.094, 0.418, 0.024, 0.037, 0],
    [0.101, 0.378, 0.043, 0.031, 0],
    [0.104, 0.338, 0.053, 0.028, 0],
    [0.106, 0.332, 0.054, 0.029, 1], //  0.63 H — the linen begins
    [0.113, 0.3, 0.056, 0.029, 1],
    [0.121, 0.273, 0.053, 0.028, 1], //  0.70 H — and ends
    [0.125, 0.268, 0.05, 0.027, 2],
    [0.134, 0.25, 0.043, 0.031, 2], //  0.712 H — the hands at the hips, 64 px across
    [0.134, 0.235, 0.034, 0.027, 2],
    [0.129, 0.226, 0.022, 0.013, 2],
  ];
  return rows.map(([x, y, z, r, s]) => ({
    // his right hand rides forward, his left arm hangs a touch lower: the pair is never
    // a mirror, which is the other half of item 13
    p: new THREE.Vector3(side * x, y + (side > 0 ? 0 : -0.006), z + (side > 0 ? 0.005 : 0)),
    breadth: r,
    thick: r * 0.88,
    slot: s,
  }));
}

// ---- legs ---------------------------------------------------------------------------
// hip -> sole = 0.28 H, of which only 0.18 H shows below the hem. The shin wraps are
// silhouette mark #5 and the ONLY thing separating the dark boots (L 0.320) from the
// dark hem (L 0.320) — they are at identical value, so the reference separates them
// with the drawn line and the pale band alone. ("Shin wraps deleted, never visible" is
// struck and inverted: they are in all 38 frames.)
function legNodes(side: 1 | -1): Node[] {
  const rows: [number, number, number, number, number][] = [
    [0.055, 0.268, 0.0, 0.04, 0],
    [0.055, 0.21, 0.0, 0.032, 0],
    [0.054, 0.148, 0.002, 0.029, 0],
    [0.054, 0.142, 0.002, 0.029, 1], //  0.83 H — shin wrap, following the hem down
    [0.053, 0.126, 0.004, 0.03, 1],
    [0.053, 0.102, 0.005, 0.029, 1], //  0.89 H
    [0.053, 0.096, 0.006, 0.035, 2], //  boot top
    [0.054, 0.06, 0.012, 0.04, 2],
    [0.055, 0.024, 0.022, 0.042, 2],
    [0.056, 0.006, 0.032, 0.038, 2],
    [0.056, 0.0, 0.04, 0.026, 2],
  ];
  return rows.map(([x, y, z, r, s]) => ({
    p: new THREE.Vector3(side * x, y, z),
    breadth: r,
    thick: s === 2 ? r * 1.35 : r * 0.92, // the boot is longer than it is wide
    slot: s,
  }));
}

// ---- the belt pouch ------------------------------------------------------------------
// On his RIGHT hip, clearest from behind. The satchel and its whole 12%-of-silhouette
// carve-out are struck; this is what took its role, and it is much smaller and darker.
// It is also the loudest piece of his asymmetry.
// AMENDED. It was five round nodes on a plane normal parallel to their own run, so the
// frame degenerated and it came out as the judge described: a brown splat. It is now a
// flat-backed satchel with its own FLAP — two runs on a backward plane normal, the flap
// standing 0.008 proud of the body — and marks() draws the flap's edge and its strap.
const POUCH_N = new THREE.Vector3(0, 0.12, -0.993).normalize();
function buildPouch(): THREE.BufferGeometry {
  const b = new Build();
  b.bind = 'trunk'; // it hangs off the belt, so it rides the hip like the cloth does
  const run = (rows: [number, number, number, number, number][]) =>
    tube(
      b,
      rows.map(([y, x, z, br, th]) => ({
        p: new THREE.Vector3(x, y, -z),
        breadth: br,
        thick: th,
        slot: 0,
      })),
      POUCH_N,
      12,
    );
  //     y      x      z      breadth thick
  run([
    [0.296, 0.097, 0.079, 0.026, 0.014],
    [0.276, 0.103, 0.086, 0.038, 0.022],
    [0.25, 0.107, 0.089, 0.041, 0.025],
    [0.224, 0.106, 0.087, 0.038, 0.023],
    [0.206, 0.1, 0.081, 0.021, 0.012],
  ]);
  run([
    [0.302, 0.096, 0.082, 0.024, 0.008],
    [0.284, 0.102, 0.092, 0.04, 0.011],
    [0.264, 0.106, 0.095, 0.042, 0.011],
    [0.252, 0.106, 0.092, 0.036, 0.008],
  ]);
  return b.build().geom;
}

// ===================================================================================
// 3. THE EYES — the signature, and a two-part UNLIT object
// ===================================================================================
//
// 0.26 x head width, 0.40 x head height, centres 0.61 head-widths apart at 64% down the
// head unit. (The design doc's "22% of head height" and its ink slit pupil are amended;
// its amber 0.770 and the lanternGlass 0.878 cap are amended too — the client's own
// frames stage him as a dark shape with bright eyes in front of a candle, a fire, a
// lantern and a torch, so the eyes take 0.914 and the lantern keeps the only glow.)
//
// The bright field is unlit MeshBasicMaterial: it cannot go muddy under any rig, any
// curtain state or any grade, which is the whole reason the read survives a torch. The
// shade crescent is NOT a second material and NOT a light response — it is part of the
// same unlit surface, because in the reference it is constant across all 15 face plates
// regardless of the light, and making it lighting-driven would make the eyes flicker,
// the one thing they must never do.
//
// Field, crescent, pupil and catchlight are FOUR MATERIAL GROUPS OF ONE CURVED PATCH.
// No stacked cards, no polygon offset, no z-fighting, no ink ring — at small sizes an
// ink ring eats the bright field and the whole read collapses. The almond is cut by
// value alone, exactly as the reference cuts it.
const EYE_W = 0.27 * (HEAD_HW * 2); // 0.1276 full width — the client measures 0.24-0.27
const EYE_H = 0.457 * (Y_CROWN - Y_CHIN); // 0.1746 full height — the measured almond was
//   0.311 of the head unit against the reference's 0.40 (22% short, aspect 1.06 against
//   1.24-1.36). The authored factor carries the correction; no second constant.
const EYE_DX = 0.0846; // centre offset: pair span 0.61 x head width
const EYE_TILT = 0.24; // rad — the outer end rides higher, as drawn
// AMENDED to 0.032, still clear of gate G4's 0.03. At 0.042 the cap is a steep dome over
// a 0.064 half-width, and at the film's own 43 deg hero angle the crest OCCLUDED the far
// eye's pupil — which sits at 0.84 of the half-width, inboard. Measured: the far pupil came
// back 2 px wide at view=three. A flatter cap keeps both pupils at every staged angle.
const EYE_BULGE = 0.032;
// The pupil, in the almond's own normalised half-extents. The reference is 0.19-0.21 W x
// 0.23 H of the almond, inner-lower; this build measured 0.257 W x 0.311 H, which is the
// difference between a small pupil in a large lemon field and a googly eye.
const PUPIL_RX = 0.136;
const PUPIL_RY = 0.197;
const PUPIL_X = 0.842; //  inboard, toward the nose
const PUPIL_Y = 0.158; //  and down

const ESLOT = { FIELD: 0, CRESC: 1, PUPIL: 2, NOTCH: 3 };

/** The almond outline in normalised eye space: full at the outer end, tapered to the nose. */
function almond(a: number, outSign: number): { x: number; y: number } {
  const x = Math.cos(a);
  const inner = clamp01((1 - x * outSign) / 2); // 0 outer .. 1 at the nose corner
  // AMENDED 0.46 -> 0.30. At 0.46 the almond collapsed to 54% of its height at the nose
  // corner, and the pupil — which the reference puts 0.318 of the WIDTH inboard — hung off
  // that corner with no eye surface behind it. The client's own almonds keep height into
  // the inner corner; they are lemons, not leaves.
  return { x, y: Math.sin(a) * (1 - 0.3 * inner * inner) * (Math.sin(a) > 0 ? 0.93 : 1) };
}

// THE EYES ARE THREE MESHES, not one — and that is the rig talking, not the sculpt.
// `actions.ts` scales each eye (`express`'s eye channel, and `blink`'s scale.y) and
// slides both pupils together (`throwDie`'s saccade), so the almond patch has to have
// its own origin per side and the two pupil discs have to share a group of their own.
// The geometry, its slots and its winding are the accepted build's, vertex for vertex:
// each side is authored exactly as before and then translated onto its own centre.
function buildEyes(): {
  eye: { geom: THREE.BufferGeometry; order: number[]; c: THREE.Vector3 }[];
  pupil: { geom: THREE.BufferGeometry; order: number[] };
} {
  const out: { geom: THREE.BufferGeometry; order: number[]; c: THREE.Vector3 }[] = [];
  const pb = new Build();
  const RAD = 16;
  const ANG = 72;
  for (const side of [-1, 1] as const) {
    // index 0 is his LEFT (−x): world.ts's own `face.eyeL = eyes[0]` convention
    const b = new Build();
    // stand the eye on the face's own surface, sampled from the same function the skin
    // was lofted from — an eye can never end up somewhere the face is not
    const r = ringAtY(Y_EYE);
    const u = side * Math.asin(clamp01(EYE_DX / r[1]));
    const c = surface(u, Y_EYE, r);
    const du = surface(u + 0.02, Y_EYE, r).sub(surface(u - 0.02, Y_EYE, r)).normalize();
    const dv = surface(u, Y_EYE + 0.01, ringAtY(Y_EYE + 0.01))
      .sub(surface(u, Y_EYE - 0.01, ringAtY(Y_EYE - 0.01)))
      .normalize();
    const n = new THREE.Vector3().crossVectors(du, dv).normalize();
    if (n.z < 0) n.negate();
    const ex = du.clone().multiplyScalar(Math.cos(side * EYE_TILT)).addScaledVector(dv, Math.sin(side * EYE_TILT)).normalize();
    const ey = new THREE.Vector3().crossVectors(n, ex).normalize();
    if (ey.y < 0) ey.negate();
    c.addScaledVector(n, 0.004);

    const outSign = side; // +1 eye: outer is +x, which is +ex
    const evalAt = (nx: number, ny: number, t: number) =>
      new THREE.Vector3(
        c.x + ex.x * nx * EYE_W * 0.5 + ey.x * ny * EYE_H * 0.5 + n.x * EYE_BULGE * Math.sqrt(Math.max(0, 1 - t * t)),
        c.y + ex.y * nx * EYE_W * 0.5 + ey.y * ny * EYE_H * 0.5 + n.y * EYE_BULGE * Math.sqrt(Math.max(0, 1 - t * t)),
        c.z + ex.z * nx * EYE_W * 0.5 + ey.z * ny * EYE_H * 0.5 + n.z * EYE_BULGE * Math.sqrt(Math.max(0, 1 - t * t)),
      );
    const put = (nx: number, ny: number, t: number) => {
      const p = evalAt(nx, ny, t);
      return b.v(p.x, p.y, p.z);
    };

    const uT = termY(u);
    const slotAt = () => ESLOT.FIELD;
    const centre = put(0, 0, 0);
    const rows: number[][] = [];
    for (let i = 1; i <= RAD; i++) {
      const t = i / RAD;
      const row: number[] = [];
      for (let j = 0; j < ANG; j++) {
        const e = almond((j / ANG) * Math.PI * 2, outSign);
        row.push(put(e.x * t, e.y * t, t));
      }
      rows.push(row);
    }
    for (let j = 0; j < ANG; j++) b.tri(centre, rows[0][j], rows[0][(j + 1) % ANG], slotAt());
    for (let i = 0; i < RAD - 1; i++) {
      for (let j = 0; j < ANG; j++) {
        const j2 = (j + 1) % ANG;
        b.quad(rows[i][j], rows[i][j2], rows[i + 1][j2], rows[i + 1][j], slotAt());
      }
    }

    // THE SHADE CRESCENT IS THE HOOD'S SHADOW, and it gets its OWN strip rather than a
    // material group of the patch above. Classified on the patch's polar grid, a STRAIGHT
    // cut across it comes out as a chewed edge — the stair is one whole quad, ~3 px at
    // plate scale, and it showed. This strip's lower edge lies exactly ON termY(), which is
    // the same function the SKIN's terminator is classified off, so the hood shadow arrives
    // as ONE diagonal crossing cheek, eye and cheek with nothing to disagree about. (It was
    // a radial rim shape hugging the top and the outer side, meeting a level band on the
    // skin at the eye top: the judge's item 3, and the most-looked-at place on him.)
    {
      const half = EYE_H * 0.5;
      const yTop = (nx: number) => {
        const inner = clamp01((1 - nx * outSign) / 2);
        return Math.sqrt(Math.max(0, 1 - nx * nx)) * (1 - 0.46 * inner * inner) * 0.93;
      };
      const yCut = (nx: number) => (uT - c.y - ex.y * nx * EYE_W * 0.5) / (ey.y * half);
      const above = (nx: number) => yTop(nx) - yCut(nx);
      // the two nx where the cut meets the almond's own outline, by bisection: the strip has
      // to CLOSE on the outline or the crescent shows a sliver of field past its own end
      const edge = (lo: number, hi: number) => {
        for (let k = 0; k < 24; k++) {
          const m = (lo + hi) / 2;
          if (above(m) > 0) hi = m;
          else lo = m;
        }
        return (lo + hi) / 2;
      };
      let peak = 0;
      for (let i = 0; i <= 40; i++) {
        const nx = -1 + (i / 40) * 2;
        if (above(nx) > above(peak)) peak = nx;
      }
      if (above(peak) > 0) {
        const x0 = edge(-1, peak);
        const x1 = edge(1, peak);
        const N = 34;
        const cv = (nx: number, ny: number) => {
          const t = Math.min(0.999, Math.hypot(nx, ny));
          const bulge = EYE_BULGE * Math.sqrt(Math.max(0, 1 - t * t)) + 0.0009;
          return b.v(
            c.x + ex.x * nx * EYE_W * 0.5 + ey.x * ny * half + n.x * bulge,
            c.y + ex.y * nx * EYE_W * 0.5 + ey.y * ny * half + n.y * bulge,
            c.z + ex.z * nx * EYE_W * 0.5 + ey.z * ny * half + n.z * bulge,
          );
        };
        let prev: [number, number] | null = null;
        for (let i = 0; i <= N; i++) {
          const nx = x0 + ((x1 - x0) * i) / N;
          const lo = cv(nx, yCut(nx));
          const hi = cv(nx, Math.max(yCut(nx), yTop(nx)));
          // quad() emits its triangles wound OPPOSITE to a-b-c-d, so this order is the
          // patch's own: authored the other way round the strip renders back-faced and the
          // crescent is simply not there (it was not, for one build)
          if (prev) b.quad(prev[1], hi, lo, prev[0], ESLOT.CRESC);
          prev = [lo, hi];
        }
      }
    }

    // THE PUPIL gets its OWN fan rather than a group of the patch above. Classified on
    // the patch's polar grid it came out as a chewed black blob — the grid's angular
    // step out at the pupil's radius is a fifth of the pupil's width. A small dedicated
    // ellipse, lifted a hair along the same cap normal, is crisp at any size and costs
    // 60 triangles. It is a vertical oval 0.20 x 0.23 of the almond in the INNER-LOWER
    // quadrant (7 px toward the nose, 5 px down), with one lighter notch. Not a slit.
    // SOLVED AGAINST THE FRAMEBUFFER, not against the authored plane: the almond stands on
    // a curved face at u = 0.37 rad and is tilted 0.24 rad in its own plane, so an authored
    // offset arrives on screen rotated ~30 deg toward vertical and scaled ~0.35. The first
    // pass authored 0.609 inboard and 0.328 down and MEASURED 0.129 W inboard, 0.209 H down
    // against the reference's 0.318 W and 0.167 H. These two numbers are the ones that land
    // the measured pair; if the eye's seat or tilt ever moves, re-read and re-solve them.
    const px = -outSign * PUPIL_X;
    const py = -PUPIL_Y;
    const disc = (cx: number, cy: number, rx: number, ry: number, lift: number, slot: number) => {
      const seg = 26;
      const at = (a: number, k: number) => {
        const nx = cx + Math.cos(a) * rx * k;
        const ny = cy + Math.sin(a) * ry * k;
        const t = Math.min(0.999, Math.hypot(nx, ny));
        const bulge = EYE_BULGE * Math.sqrt(Math.max(0, 1 - t * t)) + lift;
        return pb.v(
          c.x + ex.x * nx * EYE_W * 0.5 + ey.x * ny * EYE_H * 0.5 + n.x * bulge,
          c.y + ex.y * nx * EYE_W * 0.5 + ey.y * ny * EYE_H * 0.5 + n.y * bulge,
          c.z + ex.z * nx * EYE_W * 0.5 + ey.z * ny * EYE_H * 0.5 + n.z * bulge,
        );
      };
      const mid = at(0, 0);
      const ring0: number[] = [];
      for (let j = 0; j < seg; j++) ring0.push(at((j / seg) * Math.PI * 2, 1));
      for (let j = 0; j < seg; j++) pb.tri(mid, ring0[j], ring0[(j + 1) % seg], slot);
    };
    disc(px, py, PUPIL_RX, PUPIL_RY, 0.003, ESLOT.PUPIL);
    disc(px + outSign * PUPIL_RX * 0.36, py + PUPIL_RY * 0.38, PUPIL_RX * 0.3, PUPIL_RY * 0.3, 0.0042, ESLOT.NOTCH);

    const built = b.build();
    built.geom.translate(-c.x, -c.y, -c.z); // the almond's own origin: `express` scales it
    out.push({ ...built, c });
  }
  return { eye: out, pupil: pb.build() };
}

/** The trunk ring whose y is closest to `y` — the eyes and the marks stand on the skin. */
function ringAtY(y: number): Key {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 26; i++) {
    const m = (lo + hi) / 2;
    if (ring(m)[0] > y) lo = m;
    else hi = m;
  }
  const r = ring((lo + hi) / 2);
  r[0] = y;
  return r;
}

// ===================================================================================
// 4. THE INK SHELL — one line round the whole animal, LOST AND FOUND
// ===================================================================================
//
// One shell over the merged trunk + ears + arms + legs, pushed out along welded normals
// and drawn inside-out. Merged rather than per-part because nineteen independent shells
// is what made the shipped figure a stack of outlines.
//
// The reference contour is 1-2 px on a 177 px figure and IT IS NOT UNIFORM (section
// 3.6): ink-dark at the hood's lower edges, under the chin, at the ear's outer edge and
// around the boots; across the top of the crown it thins to a bare value step with no
// ink at all. That map is baked per vertex here, and it is the exact inverse of the
// wear map on the materials — where the reference dropped the line the drybrush takes
// over, so the two mechanisms tell one story instead of two.
//
// Weight is a SCREEN quantity (gate P4, as amended): 1.0% of the projected figure
// height, floor 1.0 px, ceiling 3.6 px. The doc's fixed 2.6-3.6 px is right only at a
// ~280 px figure and is 5x too heavy at a 52 px phone figure, so this solves per frame
// off the live camera rather than carrying a world constant.
function rimWeight(x: number, y: number, ny: number): number {
  let w = 1;
  w *= 1 - 0.62 * sstep(0.79, 0.9, y); //  the crown: the reference has no ink there
  w *= 1 - 0.34 * clamp01(ny) * sstep(0.38, 0.45, y) * (1 - sstep(0.46, 0.56, y)); // shoulder tops
  w *= 1 - 0.4 * sstep(0.24, 0.32, Math.abs(x)) * sstep(0.64, 0.71, y); //  ear tip, outer curve
  w *= 1 + 0.25 * sstep(0.52, 0.47, y) * (1 - sstep(0.47, 0.42, y)); //  the hood's lower edge
  w *= 1 + 0.2 * sstep(0.14, 0.09, y); //  the boot line
  return w;
}

/** Push the shell's vertices out along their weighted directions by `rim` local units. */
function applyRim(mesh: THREE.Mesh, rim: number): void {
  mesh.userData.rim = rim;
  const base = mesh.userData.rimBase as Float32Array;
  const dir = mesh.userData.rimDir as Float32Array;
  const attr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const a = attr.array as Float32Array;
  for (let i = 0; i < a.length; i++) a[i] = base[i] + dir[i] * rim;
  attr.needsUpdate = true;
}

const shellMaterial = new THREE.MeshBasicMaterial({
  color: C.contour, //  a dark OLIVE-black, not #222222 (amended: the reference line is olive)
  side: THREE.BackSide,
  fog: false,
});
shellMaterial.userData.role = 'shell';

function buildShell(parts: THREE.BufferGeometry[]): THREE.SkinnedMesh {
  const pos: number[] = [];
  const idx: number[] = [];
  // …and the shell inherits the FILL's own bind, vertex for vertex. It is the same
  // surface pushed out along its normals, so copying the influences is what guarantees
  // the contour deforms with the form instead of peeling off it at every bend.
  const si: number[] = [];
  const sw: number[] = [];
  for (const g of parts) {
    const p = g.getAttribute('position');
    const gi = g.getIndex()!;
    const gsi = g.getAttribute('skinIndex');
    const gsw = g.getAttribute('skinWeight');
    const base = pos.length / 3;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      si.push(gsi.getX(i), gsi.getY(i), gsi.getZ(i), gsi.getW(i));
      sw.push(gsw.getX(i), gsw.getY(i), gsw.getZ(i), gsw.getW(i));
    }
    for (let i = 0; i < gi.count; i++) idx.push(base + gi.getX(i));
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geom.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(si), 4));
  geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  geom.setIndex(idx);
  geom.computeVertexNormals();

  // WELD the normals across the merge — a per-face normal tears the shell open at every
  // hard edge, and the parts meet at hard edges by construction
  const p = geom.getAttribute('position');
  const nr = geom.getAttribute('normal');
  const key = (i: number) =>
    `${Math.round(p.getX(i) * 2e3)},${Math.round(p.getY(i) * 2e3)},${Math.round(p.getZ(i) * 2e3)}`;
  const acc = new Map<string, [number, number, number]>();
  for (let i = 0; i < p.count; i++) {
    const a = acc.get(key(i)) ?? [0, 0, 0];
    a[0] += nr.getX(i);
    a[1] += nr.getY(i);
    a[2] += nr.getZ(i);
    acc.set(key(i), a);
  }
  // CONCAVITY. A normal offset self-intersects in a valley, and a BackSide shell that
  // folds through itself draws its far wall IN FRONT of the fill — measured on the first
  // pass as a black smear down the middle of the face, another under the chin and a third
  // at the belt cinch, all of them exactly the concave places. So the offset dies where
  // the surface turns concave, which is also where the reference has no line: an interior
  // contour there is an AUTHORED mark, never the silhouette shell's job.
  const conc = new Float32Array(p.count);
  const cnt = new Float32Array(p.count);
  const gi2 = geom.getIndex()!;
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  for (let t = 0; t < gi2.count; t += 3) {
    for (let e = 0; e < 3; e++) {
      const i0 = gi2.getX(t + e);
      const i1 = gi2.getX(t + ((e + 1) % 3));
      const n0 = acc.get(key(i0))!;
      const l0 = Math.hypot(n0[0], n0[1], n0[2]) || 1;
      va.set(p.getX(i1) - p.getX(i0), p.getY(i1) - p.getY(i0), p.getZ(i1) - p.getZ(i0));
      if (va.lengthSq() > 1e-12) {
        vb.set(n0[0] / l0, n0[1] / l0, n0[2] / l0);
        conc[i0] += va.normalize().dot(vb);
        cnt[i0]++;
      }
    }
  }
  const dir = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const a = acc.get(key(i))!;
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    const cv = cnt[i] > 0 ? conc[i] / cnt[i] : 0; // > 0 = a valley
    const w = rimWeight(p.getX(i), p.getY(i), a[1] / l) * (1 - sstep(0.02, 0.16, cv));
    dir[i * 3] = (a[0] / l) * w;
    dir[i * 3 + 1] = (a[1] / l) * w;
    dir[i * 3 + 2] = (a[2] / l) * w;
  }
  const mesh = new THREE.SkinnedMesh(geom, shellMaterial);
  mesh.userData.rimBase = (p.array as Float32Array).slice();
  mesh.userData.rimDir = dir;
  // world.ts's `setGoblinRim` (§5.12, the hero's per-breakpoint solve) reads this name;
  // `applyRim` below reads `rimDir`. ONE array under two names rather than two arrays —
  // a second copy is a second answer.
  mesh.userData.rimNormal = dir;
  mesh.frustumCulled = false;
  // A BAKED DEFAULT, before any live solve — world.ts's GOB_RIM_DEFAULT precedent, and
  // here it is load-bearing rather than a convenience: the study route's `sheet` strip
  // renders three `Object3D.clone()`s, and clone() does not carry `onBeforeRender`, so a
  // cloned shell never gets solved. Left at zero it sits exactly on the fill and the
  // whole strip rendered with NO contour at all (measured). This is the plate framing's
  // own solve, so a clone carries the line the original does.
  applyRim(mesh, 0.0062);
  // A contour is a LINE, not a creature: it must not cast. markAlive() would otherwise
  // set castShadow on it, and a BackSide shell renders its front faces into the shadow
  // map from ~1 px OUTSIDE the fill — which shadows the whole figure with itself.
  mesh.userData.neverAlive = true;
  return mesh;
}

// ===================================================================================
// 5. THE AUTHORED MARKS
// ===================================================================================
//
// About sixteen of them, the reference's own list: 2-3 hood-crown creases (in every
// front AND back plate), 3 ear ticks per blade (the brightest marks on him), two brows
// drawn INSIDE the shaded forehead, the nose, the mouth, the hood's front hem (an
// interior contour the silhouette shell cannot draw), the belt line and the boot lines.
// No hatching: every one of these runs with its form's single stroke family, never
// across it. There is not one hatch mark in the client's 38 frames either.
interface MarkKit {
  head: THREE.Group; //   mounted on the head bone
  neck: THREE.Group; //   the cowl's own back hem: the skin there is mostly neck
  pelvis: THREE.Group; // belt, skirt folds, the pouch's flap and strap
  hood: THREE.Group; //   §6's BROW CHANNEL — the hood's front hem and nothing else
  seats: THREE.Group; //  holds the three expression seats; mounted on the head bone
  browL: THREE.Group;
  browR: THREE.Group;
  mouth: THREE.Group;
  earR: THREE.Group;
  earL: THREE.Group;
  bootR: THREE.Group;
  bootL: THREE.Group;
}

// A mark is a LineSegments2 and cannot be skinned, so each one is parented to the bone
// that dominates the skin under it — by its own height, through the same TRUNK_CUTS the
// skin uses. That is the whole reason this returns families instead of one flat group:
// a belt line on the head bone would ride the head-turn, and a crown crease on the
// pelvis would not ride anything.
function marks(): MarkKit {
  const G = (): THREE.Group => new THREE.Group();
  const kit: MarkKit = {
    head: G(), neck: G(), pelvis: G(), hood: G(), seats: G(),
    browL: G(), browR: G(), mouth: G(), earR: G(), earL: G(), bootR: G(), bootL: G(),
  };
  const add = (
    g: THREE.Group,
    pts: THREE.Vector3[],
    hex: number,
    w: 'hero' | 'form' | 'faint',
  ) => g.add(paint(weight(polyline(pts, w), w), { line: hex }));

  const on = (u: number, y: number, out = 0.004) => {
    const r = ringAtY(y);
    const p = surface(u, y, r);
    const n = new THREE.Vector3(Math.sin(u), 0, Math.cos(u)).normalize();
    return p.addScaledVector(n, out);
  };

  // 2-3 short crease strokes near the crown, asymmetric, running with the cloth's
  // vertical family. Present in every front and every back plate.
  for (const [u, y0, len] of [
    [-0.55, 0.8885, 0.022],
    [0.22, 0.8935, 0.026],
  ] as const) {
    add(
      kit.head,
      [on(u, y0), on(u + 0.03, y0 - len * 0.55), on(u + 0.05, y0 - len)],
      C.contour,
      'faint',
    );
  }
  // …and the same crease on the back of the hood: 18 of the client's 38 frames are back
  // views and the back must read as a picture on its own.
  add(kit.head, [on(Math.PI - 0.12, 0.88), on(Math.PI - 0.06, 0.83), on(Math.PI - 0.02, 0.775)], C.contour, 'faint');

  // THE HOOD'S FRONT HEM. It is the strongest line in the reference and the shell can
  // never draw it — from the front it is an interior contour, not a silhouette edge.
  // AMENDED. It was drawn 0.012 ABOVE the brow — which on a dome puts it on the CROWN, so
  // it read as a straight dark band with regular ticks across the top of the head: a hat
  // brim, and the judge's item 12. It now sits ON the material boundary and follows
  // hoodEdgeY() all the way out to the cave's far column, so the cowl's edge sweeps down
  // and back past the cheeks instead of stopping level above the forehead.
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const g = -1 + (i / 30) * 2;
      const m = g * (COL_EDGE - 0.4);
      const y = hoodEdgeY(m) - 0.004 + 0.0035 * Math.sin(g * 7.3); // never a machined arc
      pts.push(on(colAngle(m, y), y, 0.009));
    }
    add(kit.hood, pts, C.contour, 'form');
  }
  // the lappets' inner edges — what separates the face window from the cloth beside it
  for (const s of [1, -1] as const) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const y = Y_BROW - 0.01 - (i / 8) * (Y_BROW - Y_CHIN - 0.02);
      pts.push(on(s * (windowHalf(y) + 0.02), y, 0.004));
    }
    add(kit.head, pts, C.contour, 'faint');
  }

  // brows — thin dark strokes drawn INSIDE the shaded forehead (they are not the hood
  // hem: the hood does not move, and the brow is a mark on skin)
  // AMENDED: the pair ran u 0.20 -> 0.50 with the INNER end LOWER than the outer, which is
  // the anatomy of an angry brow, and he scowled. The reference is neutral-to-gentle in all
  // 15 face plates: two SHORT strokes, high in the shaded forehead, tipping very slightly
  // down toward the outside.
  const browAt = { R: new THREE.Vector3(), L: new THREE.Vector3() };
  for (const s of [1, -1] as const) {
    const pts = [on(s * 0.2, 0.7965, 0.006), on(s * 0.3, 0.7945, 0.006), on(s * 0.39, 0.789, 0.006)];
    const at = pts[1].clone();
    browAt[s > 0 ? 'R' : 'L'].copy(at);
    add(s > 0 ? kit.browR : kit.browL, pts.map((q) => q.sub(at)), C.contour, 'faint');
  }
  // the nose: one small dark mark between and just below the eyes. The design doc's
  // coloured button sphere (gobEarInner) is struck — no inner-ear colour exists on him.
  add(kit.head, [on(-0.03, 0.585, 0.006), on(0.02, 0.575, 0.006), on(0.06, 0.581, 0.006)], C.accent, 'faint');
  // the mouth: a small closed curve, no wider than one eye
  const mouthPts = [
    on(-0.11, 0.548, 0.006), on(-0.04, 0.5435, 0.006), on(0.04, 0.5435, 0.006), on(0.11, 0.549, 0.006),
  ];
  const mouthAt = mouthPts
    .reduce((a, q) => a.add(q), new THREE.Vector3())
    .multiplyScalar(1 / mouthPts.length);
  add(kit.mouth, mouthPts.map((q) => q.sub(mouthAt)), C.accent, 'faint');

  // §6's THREE EXPRESSION SEATS. `express()` writes brow.position.y and mouth.position.y
  // ABSOLUTELY, at actions.ts's BROW_Y 0.05 and MOUTH_Y −0.086 — head-LOCAL numbers
  // measured on the old skull, whose brow sat 0.15 lower on the same head bone. So each
  // channel gets a seat carrying that difference: the channel's own rest transform stays
  // exactly what `express` writes at neutral, and the mark lands where the sculpt put it.
  const seat = (g: THREE.Group, at: THREE.Vector3, localY: number) => {
    const s = new THREE.Group();
    s.position.set(at.x, at.y - localY, at.z);
    g.position.y = localY;
    s.add(g);
    kit.seats.add(s);
  };
  seat(kit.browL, browAt.L, BROW_Y);
  seat(kit.browR, browAt.R, BROW_Y);
  seat(kit.mouth, mouthAt, MOUTH_Y);

  // EAR TICKS — 2-3 near-paper strokes on each blade at mid-length, L 0.938, the
  // brightest marks on the whole figure. They run ALONG the blade, which is also the
  // ear's one stroke family, so the marks and the graphite agree instead of crossing
  // (the hard gate). Staggered across the blade's width so they read as ticks.
  for (const side of [1, -1] as const) {
    const n = earNodes(side);
    for (const [i0, lat] of [
      [2, -0.5],
      [3, 0.05],
      [3, 0.62],
    ] as const) {
      const a = n[i0].p;
      const bN = n[i0 + 1].p;
      const t = bN.clone().sub(a).normalize();
      const side3 = new THREE.Vector3().crossVectors(t, new THREE.Vector3(0, 0, 1)).normalize();
      const o = new THREE.Vector3(0, 0, 1).multiplyScalar(n[i0].thick * 0.95);
      const m = a.clone().lerp(bN, 0.35).addScaledVector(side3, lat * n[i0].breadth * 0.55).add(o);
      // 'form', not 'faint': at 1.1 px with alphaToCoverage the stroke never reaches its
      // own pigment and these measured BELOW the eyes' 0.914. They are the reference's
      // brightest marks at 0.938 and the only thing on him above the eye field.
      add(
        side > 0 ? kit.earR : kit.earL,
        [m.clone().addScaledVector(t, -0.019), m.clone().addScaledVector(t, 0.019)],
        C.earTick,
        'form',
      );
    }
  }

  // ---- THE BACK ------------------------------------------------------------------
  // 18 of the client's 38 frames are back views and the judge's item 11 is that this one
  // was a featureless dome with one crease. These four marks are what a drawing of the
  // back has: the cowl's hem where it dips over the spine, the gather of cloth above it,
  // and the satchel read as an object rather than as a stain.
  {
    // the cowl's hem: it follows hemDrop()'s own curve, so the line lies ON the fold
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 22; i++) {
      const u = Math.PI - 1.5 + (i / 22) * 3.0;
      pts.push(on(u > Math.PI ? u - 2 * Math.PI : u, Y_HOOD_HEM + 0.006, 0.006));
    }
    add(kit.neck, pts, C.contour, 'form');
  }
  // the nape gather: two short folds above that hem, off centre, running with the cloth
  for (const [u0, y0, len] of [
    [Math.PI - 0.30, 0.523, 0.026],
    [Math.PI + 0.16, 0.516, 0.019],
  ] as const) {
    add(kit.head, [on(u0, y0), on(u0 + 0.05, y0 - len * 0.6), on(u0 + 0.07, y0 - len)], C.contour, 'faint');
  }
  // two fold strokes down the back of the skirt, where the client's own strokes are
  for (const [u0, y0] of [
    [Math.PI - 0.55, 0.262],
    [Math.PI + 0.38, 0.248],
  ] as const) {
    add(
      kit.pelvis,
      [on(u0, y0, 0.004), on(u0 + 0.04, y0 - 0.05, 0.004), on(u0 + 0.03, y0 - 0.095, 0.004)],
      C.contour,
      'faint',
    );
  }
  // the satchel: its flap's edge, and the strap that carries it off the belt
  {
    const flap: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = -0.9 + (i / 8) * 1.8;
      flap.push(new THREE.Vector3(0.106 + Math.sin(a) * 0.039, 0.2565 - Math.cos(a) * 0.007, -0.12));
    }
    add(kit.pelvis, flap, C.accent, 'faint');
    add(
      kit.pelvis,
      [new THREE.Vector3(0.1, 0.305, -0.088), new THREE.Vector3(0.102, 0.285, -0.106)],
      C.accent,
      'faint',
    );
  }

  // the belt's lower line, all the way round (the back view carries it too)
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) pts.push(on(-Math.PI + (i / 30) * Math.PI * 2, Y_BELT_B - 0.002, 0.003));
    add(kit.pelvis, pts, C.accent, 'faint');
  }
  // the boot line: the reference PRESSES this one — it is the only thing besides the
  // pale shin wrap separating the boots (L 0.320) from the hem (L 0.320)
  for (const s of [1, -1] as const) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI * 0.85 + (i / 10) * Math.PI * 1.7;
      pts.push(new THREE.Vector3(s * 0.053 + Math.sin(a) * 0.037, Y_BOOT - 0.002, 0.006 + Math.cos(a) * 0.047));
    }
    add(s > 0 ? kit.bootR : kit.bootL, pts, C.accent, 'faint');
  }
  for (const g of Object.values(kit)) {
    g.traverse((o: THREE.Object3D) => o.layers.enable(STROKE_LAYER));
  }
  return kit;
}

// ===================================================================================
// 6. THE SKELETON — twenty-eight bones under ONE skin
// ===================================================================================
//
// WHY A SKINNED MESH AND NOT A GROUP HIERARCHY.
//
// The whole argument of the sculpt is that he is one lofted surface: the face is a
// recess in the hood's own skin, the limbs' first cross-sections are buried inside the
// trunk's volume, and ONE ink shell is merged over all of it so the silhouette is one
// line. A group hierarchy can only bend him by CUTTING that surface into a pelvis
// piece, a chest piece, a neck piece and a head piece — four closed objects with four
// outlines, which is the "robot made out of tins and shapes" the client rejected, put
// back by the rig. And the bend is not optional: `REST.chestX` is 0.34 rad, so the hero
// staging itself folds him at the waist before a single action runs.
//
// So the bones carry no geometry at all. They are `THREE.Group`s (three's `Bone` is a
// blank Object3D with a type tag; `Skeleton` only ever reads `matrixWorld`, and a Group
// is what world.ts's `Goblin` interface asks for), and the trunk, the ears, the
// lappets, the arms, the legs, the pouch and the ink shell are all SkinnedMeshes
// sharing one Skeleton. The skin blends across every joint, so the silhouette stays
// unbroken through the hunch, the crouch and the head-turn.
//
// THE CHAIN IS `RIG`'s, EXACTLY. `actions.ts`'s `reachSolve` inverts a two-bone chain
// in closed form against RIG.upper / RIG.fore / RIG.hand and against a shoulder at
// (±RIG.shoulderX, RIG.shoulderY, RIG.shoulderZ), and its inversion assumes each
// segment's rest direction is −y. So every offset below is RIG's own number on the −y
// axis even where the sculpt's crease sits a centimetre off it: an anatomical bone
// position would move the elbow pivot 0.05 units and silently rotate every solved reach
// by the rest tilt. Where the sculpt and RIG disagree the SKIN CUTS move, not the bones
// (see `ARM_CUTS`), so the fold still lands on the crease the client drew.
//
// Bone ORDER is the contract between `makeSkeleton()` and `bindOf()` — the skin's
// indices are these constants, so a bone inserted anywhere but the end renumbers the
// whole figure.
const BI = {
  pelvis: 0, bob: 1, chest: 2, neck: 3, head: 4, earR: 5, earL: 6, hem: 7,
  armRP: 8, armRS: 9, armRE: 10, armRW: 11,
  armLP: 12, armLS: 13, armLE: 14, armLW: 15,
  legRP: 16, legRS: 17, legRKP: 18, legRKS: 19, legRF: 20, legRT: 21,
  legLP: 22, legLS: 23, legLKP: 24, legLKS: 25, legLF: 26, legLT: 27,
} as const;

type BindTag = 'none' | 'trunk' | 'head' | 'earR' | 'earL' | 'armR' | 'armL' | 'legR' | 'legL';
type Wt = [number, number][];

/** world y of the head bone: RIG's own hip → waist → shoulder → neck run. */
const HEAD_Y = RIG.hipY + RIG.chestY + RIG.shoulderY + RIG.neckY; // 0.590

// THE SKIN CUTS, in world y at the bind pose, one per joint boundary. Each pair is a
// smoothstep of half-width `blend`, so nothing creases; where the reference draws a
// crease the geometry already has one.
//
// TRUNK. 0.330 is the waist (the loft's narrowest ring is 0.356); 0.440 keeps the
// shoulder ring at 0.432 on the chest (72 %) while handing the COWL'S HEM FLARE — the
// 0.466–0.489 rings, which are the widest cloth on him and are head furniture, not body
// — to the neck; 0.485 puts the whole face and the cowl's upper half on the head. The
// head-turn's 0.54 rad then twists through the 0.395–0.53 band, which is exactly where
// `clothWork` already gathers the nape.
const TRUNK_CUTS = [0.33, 0.44, 0.485];
// ARM. Cut at the SCULPT's own creases, not at the bone positions: 0.262 is the bare
// hand's top (the linen wrap ends at 0.268), 0.330 the elbow (the wrap starts at 0.332),
// 0.432 the shoulder ring. The wrist BONE sits at RIG's y 0.205 — 0.06 below the hand it
// turns — so a wrist roll swings the hand on a slightly long lever. Named, not hidden.
const ARM_CUTS = [0.262, 0.33, 0.432];
// LEG. 0.088 is the boot top (the boot is rigid and pivots at the ankle, as a boot
// does), 0.132 the shin wrap's top, 0.225 the hem's underside where the thigh is buried.
const LEG_CUTS = [0.088, 0.132, 0.225];

/** Smooth partition of a bone chain along one axis. `bones[i]` owns the span between
 *  `cuts[i-1]` and `cuts[i]`; the ends are open. */
function chainWeights(t: number, cuts: number[], bones: number[], blend: number): Wt {
  const out: Wt = [];
  for (let i = 0; i < bones.length; i++) {
    const a = i === 0 ? 1 : sstep(cuts[i - 1] - blend, cuts[i - 1] + blend, t);
    const b = i === bones.length - 1 ? 1 : 1 - sstep(cuts[i] - blend, cuts[i] + blend, t);
    if (a * b > 1e-3) out.push([bones[i], a * b]);
  }
  return out;
}

/** The bind, as a pure function of the REST position and the part it belongs to. */
function bindOf(tag: BindTag, x: number, y: number, z: number): Wt {
  switch (tag) {
    case 'head':
      // the lappets: two flaps hanging beside the face, so they turn with it whole
      return [[BI.head, 1]];
    case 'earR':
    case 'earL': {
      // along the blade: the root is buried 0.09 inside the hood and stays with the
      // skull, so a blade grows out of cloth instead of hinging on it
      const f = sstep(0.098, 0.175, Math.abs(x));
      const b = tag === 'earR' ? BI.earR : BI.earL;
      return f > 0.999 ? [[b, 1]] : [[b, f], [BI.head, 1 - f]];
    }
    case 'armR':
      return chainWeights(y, ARM_CUTS, [BI.armRW, BI.armRE, BI.armRS, BI.chest], 0.022);
    case 'armL':
      return chainWeights(y, ARM_CUTS, [BI.armLW, BI.armLE, BI.armLS, BI.chest], 0.022);
    case 'legR':
      return chainWeights(y, LEG_CUTS, [BI.legRT, BI.legRKS, BI.legRS, BI.pelvis], 0.026);
    case 'legL':
      return chainWeights(y, LEG_CUTS, [BI.legLT, BI.legLKS, BI.legLS, BI.pelvis], 0.026);
    default: {
      const w = chainWeights(y, TRUNK_CUTS, [BI.pelvis, BI.chest, BI.neck, BI.head], 0.045);
      // THE HEM FLICK IS A BONE, not a part. The reference has no cloth point on the hem
      // (the shipped one is struck), but `actions.ts` writes `hemFlick.rotation.z` in
      // settle / bolt / haul / freeze / straighten / throwDie, and the channel means
      // "the trailing skirt swings". So it swings the trailing skirt: the rear-lower
      // cloth takes up to 0.55 of the bone and the pelvis keeps the rest, which is what
      // stops the hem tearing away from the hip.
      const back = Math.PI - Math.abs(Math.atan2(x, z));
      const hf = 0.55 * sstep(0.275, 0.165, y) * Math.exp(-((back / 1.15) ** 2));
      if (hf < 1e-3) return w;
      const out: Wt = w.map(([i, k]) => [i, k * (1 - hf)] as [number, number]);
      out.push([BI.hem, hf]);
      return out;
    }
  }
}

interface Skel {
  bones: THREE.Group[];
  pelvis: THREE.Group;
  bob: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  earR: THREE.Group;
  earL: THREE.Group;
  hemFlick: THREE.Group;
  armR: Arm;
  armL: Arm;
  legR: Leg;
  legL: Leg;
}

function makeSkeleton(): Skel {
  const bones: THREE.Group[] = [];
  const bone = (parent: THREE.Group | null, x = 0, y = 0, z = 0): THREE.Group => {
    const b = new THREE.Group();
    b.position.set(x, y, z);
    // The flag the measurement substrate partitions him by (gobParts). It is how a part
    // is NAMED on a figure that is one mesh: "the head" is no longer a subtree, it is the
    // set of vertices this bone dominates. Same idiom as the contact pool's neverAlive —
    // gobParts stays free of mesh names.
    b.userData.boneIndex = bones.length;
    parent?.add(b);
    bones.push(b);
    return b;
  };
  const pelvis = bone(null, 0, RIG.hipY, 0);
  const bob = bone(pelvis);
  const chest = bone(bob, 0, RIG.chestY, 0);
  const neck = bone(chest, 0, RIG.shoulderY + RIG.neckY, 0);
  const head = bone(neck);
  // THE EARS ARE BOUND AT REST'S OWN TWO ANGLES, and that one line is what lets a
  // symmetric pair of blades live under an asymmetric channel. `applyPose(REST)` writes
  // earR.z = −EAR_Z_R and earL.z = +EAR_Z_L absolutely, and `express()` writes
  // `EAR_Z_L − ear` / `−(EAR_Z_R − ear)`; binding the skeleton with those two values
  // already on the bones makes them the ZERO of the deformation, so the accepted blade
  // sweep is the sculpt's own and every expression, the perk, the stow tick and the run
  // pin still arrive as the same DELTA they always were, with the same signs.
  const earR = bone(head, EAR_ROOT.x, EAR_ROOT.y - HEAD_Y, EAR_ROOT.z);
  earR.rotation.z = -EAR_Z_R;
  const earL = bone(head, -EAR_ROOT.x, EAR_ROOT.y - HEAD_Y, EAR_ROOT.z);
  earL.rotation.z = EAR_Z_L;
  // pivot at the rear hem. rotation.y = π/2 so the flick's local z swings the cloth fore
  // and aft under three's XYZ order — world.ts's own convention, kept by hand.
  const hemFlick = bone(pelvis, 0, 0.165 - RIG.hipY, -0.112);
  hemFlick.rotation.y = Math.PI / 2;
  const arm = (side: 1 | -1): Arm => {
    const pose = bone(chest, side * RIG.shoulderX, RIG.shoulderY, RIG.shoulderZ);
    const swing = bone(pose);
    const elbow = bone(swing, 0, -RIG.upper, 0);
    const wrist = bone(elbow, 0, -RIG.fore, 0);
    return { pose, swing, elbow, wrist };
  };
  const armR = arm(1); // right BEFORE left — BI's numbering is the contract
  const armL = arm(-1);
  const leg = (side: 1 | -1): Leg => {
    const pose = bone(pelvis, side * RIG.hipX, 0, 0);
    const swing = bone(pose);
    const shinPose = bone(swing, 0, -RIG.thigh, 0);
    const shinSwing = bone(shinPose);
    const foot = bone(shinSwing, 0, -RIG.shin, 0);
    const toe = bone(foot, 0, 0, 0.02);
    return { pose, swing, shin: { pose: shinPose, swing: shinSwing }, foot, toe };
  };
  const legR = leg(1);
  const legL = leg(-1);
  return { bones, pelvis, bob, chest, neck, head, earR, earL, hemFlick, armR, armL, legR, legL };
}

/** A holder under `bone` whose own frame is the FIGURE's — so the eyes, the pupils and
 *  every authored mark can stay authored in the coordinates the sculpt measures in and
 *  still ride the joint that owns them. Call after the skeleton's rest matrices exist. */
function mount(bone: THREE.Object3D): THREE.Group {
  const g = new THREE.Group();
  bone.add(g);
  bone.updateWorldMatrix(true, false);
  g.matrix.copy(bone.matrixWorld).invert();
  g.matrix.decompose(g.position, g.quaternion, g.scale);
  return g;
}

// ===================================================================================
// 7. THE FIGURE
// ===================================================================================
function buildFigure(): Goblin {
  const root = new THREE.Group();
  root.name = 'goblin';
  // The deforming skin lives one level under root, so `root.children` stays the three
  // things every stage check counts: the bone tree, the body, and the contact pool.
  const body = new THREE.Group();
  body.name = 'gobBody';
  const M = makeMaterials();
  const S = makeSkeleton();
  root.add(S.pelvis, body);

  // --- the one skin ---------------------------------------------------------------
  const trunk = buildTrunk();
  const trunkMesh = new THREE.SkinnedMesh(
    trunk.geom,
    trunk.order.map((s) => [M.hood, M.body, M.inner, M.face, M.belt, M.faceUp, M.faceMid, M.throat][s]),
  );

  // --- the lofted limbs ------------------------------------------------------------
  const earB = new Build();
  earB.bind = 'earR';
  tube(earB, earNodes(1), new THREE.Vector3(0.22, 0.06, 0.973).normalize(), 12);
  earB.bind = 'earL';
  tube(earB, earNodes(-1), new THREE.Vector3(-0.22, 0.06, 0.973).normalize(), 12);
  const ears = earB.build();
  const earMesh = new THREE.SkinnedMesh(ears.geom, ears.order.map((s) => [M.earR, M.earL][s]));

  const lapB = new Build();
  lapB.bind = 'head'; // two flaps hanging beside the face: they turn with it, whole
  tube(lapB, lappetNodes(1), new THREE.Vector3(0.32, 0, 0.947).normalize(), 20);
  tube(lapB, lappetNodes(-1), new THREE.Vector3(-0.32, 0, 0.947).normalize(), 20);
  const lappets = lapB.build();
  const lapMesh = new THREE.SkinnedMesh(lappets.geom, M.inner);

  const armB = new Build();
  armB.bind = 'armR';
  tube(armB, armNodes(1), new THREE.Vector3(0, 0, 1), 12);
  armB.bind = 'armL';
  tube(armB, armNodes(-1), new THREE.Vector3(0, 0, 1), 12);
  const arms = armB.build();
  const armMesh = new THREE.SkinnedMesh(arms.geom, arms.order.map((s) => [M.sleeve, M.linen, M.hand][s]));

  const legB = new Build();
  legB.bind = 'legR';
  tube(legB, legNodes(1), new THREE.Vector3(0, 0, 1), 12);
  legB.bind = 'legL';
  tube(legB, legNodes(-1), new THREE.Vector3(0, 0, 1), 12);
  const legs = legB.build();
  const legMesh = new THREE.SkinnedMesh(legs.geom, legs.order.map((s) => [M.sleeve, M.linen, M.boot][s]));

  const pouchMesh = new THREE.SkinnedMesh(buildPouch(), M.pouch);

  // --- the eyes --------------------------------------------------------------------
  const eyes = buildEyes();
  const eyeMats = [
    new THREE.MeshBasicMaterial({ color: C.eyeField, fog: false }),
    new THREE.MeshBasicMaterial({ color: C.eyeShade, fog: false }),
    new THREE.MeshBasicMaterial({ color: C.pupil, fog: false }),
    new THREE.MeshBasicMaterial({ color: C.pupilNotch, fog: false }),
  ];
  const eyeGroups = eyes.eye.map((e, i) => {
    const g = new THREE.Group();
    g.name = i === 0 ? 'eyeL' : 'eyeR';
    g.position.copy(e.c);
    g.add(new THREE.Mesh(e.geom, e.order.map((s) => eyeMats[s])));
    return g;
  });
  const pupils = new THREE.Group();
  pupils.name = 'pupils';
  pupils.add(new THREE.Mesh(eyes.pupil.geom, eyes.pupil.order.map((s) => eyeMats[s])));

  // --- the contour ------------------------------------------------------------------
  const shell = buildShell([trunk.geom, ears.geom, lappets.geom, arms.geom, legs.geom]);
  const size = new THREE.Vector2();
  const wp = new THREE.Vector3();
  const cp = new THREE.Vector3();
  const ws = new THREE.Vector3();
  shell.onBeforeRender = (renderer, _scene, camera) => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    renderer.getSize(size);
    const dist = Math.max(0.05, cam.getWorldPosition(cp).distanceTo(root.getWorldPosition(wp)));
    const pxPerUnit = size.y / (2 * dist * Math.tan((cam.fov * Math.PI) / 360));
    const scale = Math.abs(root.getWorldScale(ws).y) || 1;
    const projPx = H * scale * pxPerUnit;
    const px = Math.min(3.6, Math.max(1.0, projPx * 0.01)); // gate P4, as amended
    const want = px / (pxPerUnit * scale);
    const last = (shell.userData.rim as number) ?? 0;
    // ponytail: 4% quantized — the rim is a vertex rewrite plus a buffer upload, and a
    // smooth dolly would otherwise re-upload it every frame for a sub-pixel move
    if (Math.abs(want - last) <= last * 0.04) return;
    applyRim(shell, want);
  };

  // --- the contact pool -------------------------------------------------------------
  // A soft ground ellipse is drawn in ALL 38 of the client's frames. neverAlive by
  // design (the design doc's carve-out survives): a not-alive trilayer renders as a
  // gouache shadow on the painted half and as its own graphite smudge on the drawing,
  // so he is grounded on both sides of the seam from one mesh with zero staging.
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    createTrilayer({ color: 0x8f8f84, wear: 0, feather: 0.72 }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.004, 0.005, 0.012);
  pool.scale.set(0.165, 0.108, 1);
  pool.userData.neverAlive = true;
  pool.renderOrder = -1;

  body.add(trunkMesh, earMesh, lapMesh, armMesh, legMesh, pouchMesh, shell);
  root.add(pool);

  // --- bind, then hang the rigid furniture off the joints that own it ---------------
  //
  // Order matters and both halves are load-bearing. The bones' rest matrices have to
  // exist before the Skeleton captures its inverses, and every skinned mesh binds with
  // an IDENTITY bind matrix — they are all authored in the figure's own space and the
  // root is still at the origin here, so the stage is free to place, rotate and re-scale
  // him afterwards without any of it reaching the deformation.
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(S.bones as unknown as THREE.Bone[]);
  // A FLAG, not the Skeleton itself: `Object3D.copy` round-trips userData through
  // JSON.stringify, so a Skeleton parked here would be silently replaced by its
  // serialised husk on every clone. gobParts walks up to this flag and reads the live
  // skeleton off a SkinnedMesh under it.
  root.userData.gobRoot = true;
  const skinned: THREE.SkinnedMesh[] = [trunkMesh, earMesh, lapMesh, armMesh, legMesh, pouchMesh, shell];
  for (const m of skinned) {
    m.bind(skeleton, new THREE.Matrix4());
    m.frustumCulled = false; // a bend puts vertices outside the bind pose's own bounds
  }

  const K = marks();
  const headKit = mount(S.head);
  headKit.add(...eyeGroups, pupils, K.head, K.hood, K.seats);
  mount(S.neck).add(K.neck);
  mount(S.pelvis).add(K.pelvis);
  mount(S.earR).add(K.earR);
  mount(S.earL).add(K.earL);
  mount(S.legR.toe).add(K.bootR);
  mount(S.legL.toe).add(K.bootL);

  const face: Face = {
    browL: K.browL,
    browR: K.browR,
    eyeL: eyeGroups[0],
    eyeR: eyeGroups[1],
    mouth: K.mouth,
  };
  const goblin: Goblin = {
    root,
    pelvis: S.pelvis,
    bob: S.bob,
    chest: S.chest,
    neck: S.neck,
    head: S.head,
    earL: S.earL,
    earR: S.earR,
    face,
    armL: S.armL,
    armR: S.armR,
    legL: S.legL,
    legR: S.legR,
    hemFlick: S.hemFlick,
    pupils,
    // §6 — the cowl IS the brow. On this figure the cowl's own front hem is a drawn
    // mark, so the channel moves the LINE, exactly as the shipped figure's did.
    hood: K.hood,
    shells: [shell],
    speed: 0,
    planted: 0,
  };
  setGoblinRim(goblin, 0.0062); // the plate framing's own solve, until a stage re-solves
  return goblin;
}

/** THE FILM'S AND THE HERO'S FIGURE. */
export function buildGoblin(): Goblin {
  return buildFigure();
}

/** The study route's own entry point — `/?gobstudy=A`, which is how he gets judged.
 *  Same build, at its bind pose: the route stages placement and scale itself. */
export function buildGobStudyA(): THREE.Object3D {
  return buildFigure().root;
}
