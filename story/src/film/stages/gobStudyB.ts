import * as THREE from 'three';
import { createTrilayer } from './trilayer.ts';

// ═══════════════════════════════════════════════════════════════════════════════════
// STUDY B — THE HOODED GOBLIN
//
// Built from nothing against docs/2026-09-03-goblin-reference.md and the three client
// sheets. Nothing is carried over from world.ts's figure or from the build that used
// to sit in this file: no lathe bell, no sphere skull, no wedge ears, no marching-cube
// mitts, no cool slate, no per-part closed outline.
//
// ── METHOD: THE DRAWING LEADS, THE VOLUME SERVES ──────────────────────────────────
//
// Every measured number in this file is a FRONT-VIEW HALF-WIDTH at a named height,
// read straight off §1.2's landmark table. Those pairs are `GARMENT` below. The figure
// is then swept: at each height a closed section is generated whose x-radius IS the
// measured half-width and whose z-radius is invented. So the front silhouette is the
// client's drawing at every height BY CONSTRUCTION, and the depth is free to make him
// a solid. Width is measured; depth is authored; nothing about the drawing is emergent.
//
// The interior form is the same surface pushed, never another part. `SWELLS` is a
// short table of soft ellipsoidal bumps — the hood's crown bunch, the visor over the
// brow, the back of the skull, the chest, the sag of the belly over the belt, the
// heavier hang on one hip — displaced along the section's own outward normal. A
// cheekbone here is the head's surface growing, not a second object with its own edge.
//
// ── WHY HE IS NOT A CUT-OUT AND NOT A CEL COPY ────────────────────────────────────
//
// The reference is flat cel; the film is painted tone in committed tiers. §8's premise
// is that those two already agree — cel art IS a quantization, and `uTriPoster` IS a
// quantizer. So he gets the film's whole instrument (trilayer, poster, drybrush wear,
// authored line, one stroke family per form) set to the CLIENT'S tier placements, not
// the island's. See TIERS below for the arithmetic that picks poster = 18.
//
// ── THE FACE IS A HOLE IN THE GARMENT, NOT A DECAL ────────────────────────────────
//
// §4.1: the hood is one piece with the tunic — no shoulder seam. So the cloth is ONE
// swept surface crown → hem, and the face opening is a real oval DISH pushed into its
// front with a steep rim (`dish()`). That rim is a genuine overhang: the key throws its
// shadow off it across the forehead and the top of the eyes, which is §8.4's whole
// argument for lighting over paint — a painted patch cannot soften and rise under the
// Prep rig, and a real one does.

// ── THE FIGURE'S SIZE ─────────────────────────────────────────────────────────────
// hero.ts scales the goblin root by GOB_SCALE/0.9, i.e. it expects a build 0.9 units
// tall and stages it at 0.75. H is that build height and every fraction below is §1's
// fraction of H, measured from the CROWN downward — the same convention as the doc, so
// a constant here can be compared to the doc without arithmetic.
const H = 0.9;
const CROWN = H; // soles at y = 0, crown at y = H
// (the `node -e` edits above pass a lateral offset already in doc units; H is exported
//  into that scope only so `Math.abs(x) / H` converts a local x back to doc space)
/** doc-space (fraction of H, from the crown) → local y */
const y = (t: number) => CROWN - t * H;
/** doc-space fraction of H → local units */
const u = (t: number) => t * H;

// ── TIERS (§8.1) ──────────────────────────────────────────────────────────────────
//
// THE QUANTIZER, RE-DERIVED — §7.2 struck the doc's poster-10 because it was computed
// for a cloak at L 0.211. The trilayer quantizes at gamma 2.2 and the canvas then
// encodes sRGB, so the tier value a bin actually PUTS ON THE PAGE is
// srgb((k + 0.5)/N)^2.2 — not (k + 0.5)/N. Solving that against all ten of §3's
// measured tiers (five cloth, three skin, two linen) over N = 8…44, the best fit is
//
//   N = 33 → 0.149 0.183 0.249 0.314 0.346 | 0.378 0.410 0.688 | 0.441 0.808
//   §3      0.143 0.188 0.249 0.320 0.355 | 0.372 0.416 0.688 | 0.448 0.814
//
// worst error 0.0086, mean 0.0051. (N = 18, the best fit in the quantizer's OWN space,
// is 0.068 out on the skin's lit tier once the sRGB encode is accounted for — the same
// linear-vs-encoded mistake trilayer.ts documents twice in its own shader.)
const POSTER = 33;

// THE ONE CALIBRATION KNOB. §3's hexes are what the client PAINTED; they are not
// albedos, because the Performance rig then multiplies them by its own irradiance. The
// rig's fill-only response was MEASURED off a live frame: a vertical plane facing away
// from the key renders at 0.107 × the albedo's linear luminance (hemi 0.8 over π,
// mixed sky/ground). Lifting each of §3's colours by this gain IN LINEAR, hue exactly
// preserved and clamped so no channel clips, puts the rendered tiers back where the
// client painted them:
//
//   cloth  fill 0.151  key×0.57 0.329  key×1 0.443   (§3.1 wants 0.143 … 0.355)
//   skin   fill 0.347  key×0.57 0.622                (§3.2 wants 0.372 … 0.688)
//   belt   fill 0.113  key×0.57 0.253                (§3.4 wants 0.249)
//   boot   fill 0.151  key×0.57 0.330                (§3.4 wants 0.272 / 0.320)
//
// It is one number, it is measured rather than eyeballed, and it is the knob to turn
// if the rig's intensities ever move.
const LIFT = 2.2;

/** §3's painted colour → the albedo that renders as that colour under this rig */
function albedo(hex: number): number {
  const c = new THREE.Color().setHex(hex, THREE.SRGBColorSpace); // → linear-sRGB
  c.multiplyScalar(Math.min(LIFT, 1 / Math.max(c.r, c.g, c.b, 1e-6)));
  return c.getHex(THREE.SRGBColorSpace);
}

// The floors are §3's DARKEST COMMITTED TIER per family — the paint side never falls
// below its own mixed dark (§4.5, "he must not read as a hole"). `floor` is compared
// against pow(luminance, 1/2.2), so each is that gamma encode of the doc's page value.
const enc22 = (page: number) => {
  const lin = page <= 0.04045 ? page / 12.92 : ((page + 0.055) / 1.055) ** 2.4;
  return +(lin ** 0.4545).toFixed(3);
};
// `page` is the value §3 measured for the surface the LENS mostly sees — his front,
// which the hero key never reaches. The basecoat above is solved to land it there; the
// key then carries the surface UP from that value on the crown, the shoulders and the
// back, which is the reference's own 0.333 top plane and 0.355 lit plane.
const TIER = {
  cloth: { color: albedo(0x4f5442), floor: enc22(0.143), page: 0.32 }, // §3.1 base — 47 % of the front figure
  boot: { color: albedo(0x565338), floor: enc22(0.272), page: 0.32 }, // §3.4 — the cloak's own value
  skin: { color: albedo(0xabb772), floor: enc22(0.3), page: 0.688 }, // §3.2 lit
  linen: { color: albedo(0xd2d0c4), floor: enc22(0.448), page: 0.814 }, // §3.4 lit
  belt: { color: albedo(0x4e3e24), floor: enc22(0.249), page: 0.249 }, // §3.4 — the one r > g family
  pouch: { color: albedo(0x9e8e67), floor: enc22(0.436), page: 0.559 },
} as const;

// §3.3 — the eyes, and they are unlit by construction (§8.5). These are canvas values,
// not albedos: no rig, curtain state or grade may move them.
const EYE_FIELD = 0xfef15c; // L 0.914 — the highest value anywhere on the figure
const EYE_CRESC = 0x95853a; // L 0.514 — painted, constant across all 15 face plates
const EYE_PUPIL = 0x0c0e07; // L 0.051
const EYE_CATCH = 0xd8cf94; // the single lighter notch §1.5 measures inside the pupil
const EAR_TICK = 0xf9efd5; // L 0.938 — the brightest marks on him, brighter than the eyes
const LINE = 0x1a1b10; // §3.4 contour — a dark OLIVE-black, not #222222, not neutral
const LINE_DEEP = 0x0a0b06; // §3.4 deepest accents

// ── STROKE FAMILIES (§8.2) — one direction per FORM, never two on one face ────────
// The cloth's folds run vertically in every plate; the ears' family runs ALONG the
// blade, which is also the direction of their pale ticks, so marks and strokes agree
// instead of crossing; the wraps run ACROSS the limb, the way a bandage is wound, and
// because a wrap is its own small form that direction never meets the limb's own.
const DIR_CLOTH = 1.45; // near-vertical
const DIR_SKIN = 0.35; // follows the cheek's curve
const DIR_LIMB = 1.2; // along the arm / leg
const DIR_WRAP = 0.0; // across the limb
const DIR_EAR_R = -0.62; // along the right blade
const DIR_EAR_L = 0.62; // along the left blade — mirrored, so each blade gets its own

// ── DRYBRUSH, AND WHY HIS IS SO MUCH LIGHTER-HANDED THAN THE ISLAND'S ─────────────
//
// MEASURED, and it is the single thing that was making him read as a black robot: the
// trilayer's edge wear is `mix(lit, PAPER, wearF · wear)` and that mix happens in
// LINEAR light. Paper is 0.93 linear; his cloth, lit by fill alone, is 0.019. So at the
// film's default wear (0.22) a fragment only half-turned from the lens takes
// 0.177 · 0.22 = 3.9 % of paper — which ADDS 0.036 linear to a 0.019 signal, nearly
// three times the surface's own colour. The poster then renormalises the luminance back
// onto its tier, so the value looks right and the HUE IS GONE. Sampled live, that is
// exactly what the frame showed: cloak #272625, forehead #51504e, boots #4a4947 — every
// lit surface achromatic no matter what albedo it carried. (The shipped OLD figure has
// the same disease: its cloak measures #1b1b1a against a 0x272E37 albedo.)
//
// The island never sees this because its surfaces are five to ten times lighter, where
// the same paper fraction is a rounding error. A DARK garment needs a lighter hand:
// wear is set here so the paper term stays well under the surface's own value except in
// the last few degrees of the silhouette, where it becomes the drybrush rim it is for.
const WEAR = { cloth: 0.03, skin: 0.06, linen: 0.1 };

// THE BODY COLOUR (§4.5, and the reason this figure is not a hole in the page).
//
// MEASURED at the hero stage: the key sits at (−4, 3.95, −4) and the figure is staged
// facing +x, so `dot(his front, the key) = −0.563` — HE IS BACKLIT. His whole front
// face is fill only, at 0.107 × albedo, and every fragment of the garment lands in one
// bin near the quantizer's floor. That is a flat black robe, which is precisely the
// note the client gave twice.
//
// A painted figure does not go to black in shade, because the gouache sits on paper and
// the paper keeps showing through — a miniature painter basecoats for exactly this
// reason. `emissive` is that basecoat: the surface's OWN body colour, in its own hue,
// under the lighting rather than instead of it. It lifts the shade end without lifting
// the key end by the same proportion, which is the one thing a brighter albedo cannot
// do, and it keeps the reference's five tiers inside a range the rig can actually
// deliver. It rides the paint side only (the underdrawing never reads outgoingLight),
// so the Prep rig is untouched.
// It is not a free knob: each family's basecoat is SOLVED so that the surface's
// fill-only render lands on the value §3 measured for it. One formula, six answers.
const FILL = 0.107; // the measured fill-only response (hemi 0.8 / π, mixed sky+ground)

function emitFor(albedoHex: number, targetPage: number): number {
  const c = new THREE.Color().setHex(albedoHex, THREE.SRGBColorSpace);
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const lin =
    targetPage <= 0.04045 ? targetPage / 12.92 : ((targetPage + 0.055) / 1.055) ** 2.4;
  return Math.max(0, lin / Math.max(lum, 1e-6) - FILL);
}

const tri = (t: { color: number; floor: number; page: number }, dir: number, wear: number) => {
  const m = createTrilayer({
    color: t.color,
    floor: t.floor,
    poster: POSTER,
    wear,
    stroke: { dir, sheet: true },
  });
  m.emissive.copy(m.color).multiplyScalar(emitFor(t.color, t.page));
  return m;
};

const flat = (color: number) =>
  new THREE.MeshBasicMaterial({ color, toneMapped: false, side: THREE.DoubleSide });

// ═══════════════════════════════════════════════════════════════════════════════════
// THE MEASURED OUTLINE
//
// [ y from the crown as a fraction of H , front-view HALF-width as a fraction of H ].
// Rows carrying a doc number are cited; the rows between them exist only to keep the
// spline from overshooting into a bulge the client did not draw.
// ═══════════════════════════════════════════════════════════════════════════════════
const GARMENT: [number, number][] = [
  [0.000, 0.016], // crown — §1.2's apex of the entire figure
  [0.012, 0.062],
  [0.028, 0.104],
  [0.040, 0.124], // §1.2: 44 px
  [0.062, 0.169], // §1.2: hood's front hem, ~60 px
  [0.095, 0.201],
  [0.140, 0.227],
  [0.203, 0.246], // §1.2: ear-tip height; the hood itself, not the ears
  [0.270, 0.257],
  [0.340, 0.262],
  [0.400, 0.2625], // §1.2: head + hood at its widest — 93 px = 0.525 H
  [0.440, 0.261],
  [0.462, 0.250],
  [0.480, 0.218], // §1.2: hood's bottom edge, 77 px
  [0.496, 0.190],
  [0.520, 0.161], // §1.2: shoulder, 57 px
  [0.560, 0.150],
  [0.605, 0.141], // §1.2: waist, narrowest — 50 px
  [0.660, 0.146],
  [0.712, 0.155], // §1.2: the body at hip height; the HANDS take it out to 64 px
  [0.770, 0.152],
  [0.820, 0.1455], // §1.2: tunic hem, 51 px
  [0.838, 0.118], // the hem's underside folds back in, so no back face is ever seen
  [0.846, 0.082],
];

/** half-depth as a fraction of the half-width at the same height — invented, not measured */
const DEPTH: [number, number][] = [
  [0.0, 1.0],
  [0.2, 0.97],
  [0.4, 0.92],
  [0.48, 0.9],
  [0.6, 0.82],
  [0.72, 0.78],
  [0.85, 0.82],
];

/** section roundness: 2 is an ellipse, higher is boxier front-to-back */
const ROUND: [number, number][] = [
  [0.0, 2.0],
  [0.45, 2.05],
  [0.6, 2.35],
  [0.85, 2.3],
];

/** linear read of a sorted [key, value] table */
function tbl(t: [number, number][], k: number): number {
  if (k <= t[0][0]) return t[0][1];
  const last = t[t.length - 1];
  if (k >= last[0]) return last[1];
  for (let i = 1; i < t.length; i++) {
    if (k <= t[i][0]) {
      const [a, av] = t[i - 1];
      const [b, bv] = t[i];
      return av + ((bv - av) * (k - a)) / (b - a);
    }
  }
  return last[1];
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a || 1e-6)));
  return t * t * (3 - 2 * t);
};

// ── SWELLS (§ the interior form) ──────────────────────────────────────────────────
// Soft ellipsoidal bumps displaced along the section's own outward normal. Positive
// pushes out, negative pulls in. Positions are in LOCAL units (use u()/y()).
// He is not bilaterally identical: the hood bunches on his left, the hem hangs heavier
// on the same side, and the belly sags forward over the belt. The reference's standing
// plates are plumb and symmetric (§7.1 rules the C-curve and the 58/42 weight FILM-ONLY),
// so the asymmetry lives in the SURFACE, never in the proportions the gates measure.
interface Swell {
  p: [number, number, number];
  r: [number, number, number];
  a: number;
}
const SWELLS: Swell[] = [
  // the hood's back — a hood has cloth behind the skull, and this is what makes the
  // dead-back plate (18 of the client's 38 frames) a picture rather than an egg
  { p: [0, y(0.3), -u(0.16)], r: [u(0.2), u(0.19), u(0.12)], a: u(0.03) },
  // the visor: cloth carried FORWARD over the brow. This is the overhang whose shadow
  // §8.4 requires to cross the top third of the eyes.
  { p: [0, y(0.075), u(0.17)], r: [u(0.15), u(0.075), u(0.13)], a: u(0.042) },
  // the crown bunch, on his left — where the 2–3 crease strokes of §4.1 sit
  { p: [u(0.09), y(0.055), -u(0.02)], r: [u(0.11), u(0.07), u(0.14)], a: u(0.016) },
  // THE TWO LAPPETS (§4.1) — the hood's front edges hanging beside the face to jaw
  // level, present in every plate. They are cloth thickening FORWARD beside the face
  // window, so the face sits in a slot rather than on a smooth egg, and they are what
  // carries the head's 93 px width past a face window of ~53.
  { p: [u(0.215), y(0.33), u(0.13)], r: [u(0.085), u(0.15), u(0.1)], a: u(0.026) },
  { p: [-u(0.215), y(0.33), u(0.13)], r: [u(0.085), u(0.15), u(0.1)], a: u(0.024) },
  { p: [u(0.2), y(0.45), u(0.11)], r: [u(0.07), u(0.07), u(0.08)], a: u(0.016) },
  { p: [-u(0.2), y(0.45), u(0.11)], r: [u(0.07), u(0.07), u(0.08)], a: u(0.014) },
  // chest, and the belly sagging forward over the belt — where his weight is
  { p: [0, y(0.575), u(0.11)], r: [u(0.13), u(0.06), u(0.09)], a: u(0.008) },
  { p: [0, y(0.688), u(0.1)], r: [u(0.12), u(0.055), u(0.09)], a: u(0.014) },
  // the skirt hangs heavier on his left: one deep fold, one shallow, and two vertical
  // creases across the front so the tunic is a hanging cloth and not a dark cylinder
  { p: [u(0.11), y(0.78), u(0.06)], r: [u(0.07), u(0.09), u(0.09)], a: u(0.011) },
  { p: [-u(0.13), y(0.79), -u(0.04)], r: [u(0.06), u(0.08), u(0.08)], a: -u(0.006) },
  { p: [u(0.045), y(0.775), u(0.115)], r: [u(0.035), u(0.11), u(0.06)], a: -u(0.007) },
  { p: [-u(0.06), y(0.755), u(0.112)], r: [u(0.03), u(0.1), u(0.06)], a: -u(0.0055) },
  { p: [u(0.135), y(0.735), u(0.075)], r: [u(0.04), u(0.07), u(0.06)], a: u(0.008) },
  // the waist is really cinched by the belt, not merely narrow
  { p: [0, y(0.648), 0], r: [u(0.2), u(0.035), u(0.2)], a: -u(0.008) },
];

function swellAt(px: number, py: number, pz: number): number {
  let d = 0;
  for (const s of SWELLS) {
    const q =
      ((px - s.p[0]) / s.r[0]) ** 2 + ((py - s.p[1]) / s.r[1]) ** 2 + ((pz - s.p[2]) / s.r[2]) ** 2;
    if (q < 1) d += s.a * (1 - smooth(0, 1, Math.sqrt(q)));
  }
  return d;
}

// ── THE FACE OPENING ──────────────────────────────────────────────────────────────
// An oval hole in the front of the garment, spanning §1.2's hood front hem (0.062) to
// just past the chin (0.424), 0.30 H across — which is §4.1's ~53 px face window.
// WIDER than the first pass, and deliberately: at rx 0.152 the two almonds spanned the
// whole opening and touched the hood on their outer side, so he had no cheek. In every
// one of the 15 face plates there is a clear band of lit green OUTSIDE each eye, and it
// is what makes the eyes sit in a face rather than on a mask.
// §4.1 measures the window at ~53 px in a 93 px head — 0.57 of the head width, so
// rx = 0.57 × 0.525 H / 2 ≈ 0.150. §1.5's pair span is 0.61 head widths, WIDER than the
// window, which is why the client's almonds tuck under the hood at their outer corners
// and still leave a sliver of cheek. 0.158 is that, plus the sliver.
// `depth` is solved, not chosen: the face must clear the dish floor at every point
// INSIDE the opening or the hood crops it and the window's oval stops being the face's
// outline. At 0.086 the two surfaces met within 0.003 near the brow; 0.105 leaves
// 0.012–0.017 of margin all the way round, and it buys the deeper brim §8.4 wants.
const FACE = { cx: 0, cy: 0.263, rx: 0.158, ry: 0.181, depth: u(0.105), rim: 0.14 };

/** how far the cloth is pushed back at this point to make the face opening (local units) */
function dish(px: number, py: number, pz: number): number {
  if (pz <= 0) return 0; // the back of the garment is never dished
  const q = Math.sqrt(((px - u(FACE.cx)) / u(FACE.rx)) ** 2 + ((py - y(FACE.cy)) / u(FACE.ry)) ** 2);
  // a STEEP rim: the wall between hood and face is ~16 % of the window radius wide, so
  // it reads as the reference's hard line and throws a hard shadow, not a soft valley
  const inside = 1 - smooth(1 - FACE.rim, 1, q);
  // front-facing only — the dish must not wrap round to the ears
  return FACE.depth * inside * smooth(0, 0.35, pz / u(0.2));
}

// ═══════════════════════════════════════════════════════════════════════════════════
// THE SWEEP
// ═══════════════════════════════════════════════════════════════════════════════════

interface Ring {
  y: number;
  ax: number;
  az: number;
  n: number;
  cz?: number;
}

/**
 * Sweep a stack of closed sections into one grid mesh. The top ring may be a point (a
 * closed apex); the bottom is left as authored, so the garment's inward-folded hem lip
 * closes itself and no back face is ever seen from a shipped angle.
 */
function sweep(rings: Ring[], nu: number, shape?: (p: THREE.Vector3) => void): THREE.BufferGeometry {
  const nv = rings.length;
  const pos = new Float32Array(nu * nv * 3);
  const p = new THREE.Vector3();
  for (let j = 0; j < nv; j++) {
    const r = rings[j];
    const e = 2 / r.n;
    for (let i = 0; i < nu; i++) {
      // theta measured from +z (his front), so u = 0 is dead front
      const th = (i / nu) * Math.PI * 2;
      const c = Math.cos(th);
      const s = Math.sin(th);
      p.set(
        r.ax * Math.sign(s) * Math.abs(s) ** e,
        r.y,
        (r.cz ?? 0) + r.az * Math.sign(c) * Math.abs(c) ** e,
      );
      shape?.(p);
      const o = (j * nu + i) * 3;
      pos[o] = p.x;
      pos[o + 1] = p.y;
      pos[o + 2] = p.z;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < nv - 1; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * nu + i;
      const b = j * nu + ((i + 1) % nu);
      idx.push(a, a + nu, b, b, a + nu, b + nu);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A capsule swept along a curve — arms, legs, ear blades. `rad(t)` is in local units. */
function limb(
  axis: (t: number) => THREE.Vector3,
  rad: (t: number) => [number, number],
  nv: number,
  nu: number,
  roll = 0,
): THREE.BufferGeometry {
  const rings: THREE.Vector3[][] = [];
  const eps = 1e-3;
  for (let j = 0; j < nv; j++) {
    const t = j / (nv - 1);
    const c = axis(t);
    const d = axis(Math.min(1, t + eps)).sub(axis(Math.max(0, t - eps))).normalize();
    // a stable frame: side is horizontal-ish, up follows
    const side = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1));
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const up = new THREE.Vector3().crossVectors(side, d).normalize();
    if (roll) {
      const q = new THREE.Quaternion().setFromAxisAngle(d, roll);
      side.applyQuaternion(q);
      up.applyQuaternion(q);
    }
    const [ra, rb] = rad(t);
    const ring: THREE.Vector3[] = [];
    for (let i = 0; i < nu; i++) {
      const th = (i / nu) * Math.PI * 2;
      ring.push(
        new THREE.Vector3()
          .copy(c)
          .addScaledVector(side, Math.cos(th) * ra)
          .addScaledVector(up, Math.sin(th) * rb),
      );
    }
    rings.push(ring);
  }
  const pos = new Float32Array(nu * nv * 3);
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const o = (j * nu + i) * 3;
      const v = rings[j][i];
      pos[o] = v.x;
      pos[o + 1] = v.y;
      pos[o + 2] = v.z;
    }
  const idx: number[] = [];
  for (let j = 0; j < nv - 1; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * nu + i;
      const b = j * nu + ((i + 1) % nu);
      idx.push(a, a + nu, b, b, a + nu, b + nu);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// THE PARTS
// ═══════════════════════════════════════════════════════════════════════════════════

const NU = 40; // sections around — enough that the drawn contour has no facet at 6×

function garment(): THREE.BufferGeometry {
  const rings: Ring[] = GARMENT.map(([t, w]) => {
    const hw = u(w);
    return {
      y: y(t),
      ax: hw,
      az: hw * tbl(DEPTH, t),
      n: tbl(ROUND, t),
      // §4.1: the hood's apex sits a little forward of centre
      cz: u(0.022) * (1 - smooth(0.0, 0.42, t)),
    };
  });
  return sweep(rings, NU, (p) => {
    const d = swellAt(p.x, p.y, p.z);
    if (d) {
      const l = Math.hypot(p.x, p.z) || 1;
      p.x += (p.x / l) * d;
      p.z += (p.z / l) * d;
    }
    p.z -= dish(p.x, p.y, p.z);
  });
}

/**
 * The head. It runs from inside the hood's crown down into the collar, so its own
 * outline is never on the figure's silhouette anywhere — the only edge of it a viewer
 * sees is the hood's rim, which is where the reference draws a line too.
 */
const HEAD_P: [number, number][] = [
  [0.05, 0.024],
  [0.09, 0.1],
  [0.14, 0.14],
  [0.20, 0.162],
  [0.27, 0.172], // the cheeks — the widest of the face
  [0.34, 0.166],
  [0.39, 0.145],
  [0.424, 0.116], // §1.2 chin
  [0.46, 0.089],
  [0.50, 0.067],
  [0.54, 0.051],
];
const headAz = (t: number) => tbl(HEAD_P, t) * (t < 0.2 ? 1.18 : t < 0.4 ? 1.12 : 1.0);
const headCz = (t: number) => 0.028 * (1 - smooth(0.42, 0.54, t));

/**
 * The head's own front surface, in DOC units, at height `t` and lateral offset `x`.
 * Everything that has to sit ON the face reads this rather than carrying a constant:
 * the eyes were pinned at a hand-typed 0.185 and the moment the skull was reshaped they
 * sank inside it and the figure lost its whole signature.
 */
function headFrontZ(t: number, x: number): number {
  const ax = tbl(HEAD_P, t);
  const f = Math.max(0, 1 - (x / Math.max(ax, 1e-4)) ** 2);
  return headCz(t) + headAz(t) * Math.sqrt(f);
}

function head(): THREE.BufferGeometry {
  const P = HEAD_P;
  // FORWARD, deliberately: the face must FILL the hood's opening. Built recessed, the
  // head sits behind the dish floor and the window reads as a black hole with two eyes
  // in it — which is what iteration 1 rendered. The front cap now sits ~0.02 H proud of
  // the dish floor, and the hood's rim still overhangs it by ~0.05 H.
  // DEEPER than it is wide, and carried further forward than the first passes. Solved,
  // not guessed: at the window's edge the head's z was landing within 0.001 of the
  // hood's dish floor, so the two surfaces z-fought and the face came out as a
  // rounded RECTANGLE tracking the head's own silhouette instead of the clean oval the
  // window cuts. The face must clear the dish floor with margin at every point inside
  // the opening; then the opening's own oval is the face's outline, which is what the
  // reference draws.
  const rings: Ring[] = P.map(([t, w]) => ({
    y: y(t),
    ax: u(w),
    az: u(headAz(t)),
    cz: u(headCz(t)),
    n: 2.0,
  }));
  return sweep(rings, 32, (p) => {
    // the brow ridge and the two cheeks — the face's own form, the same surface pushed
    const bump = (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, a: number) => {
      const q = ((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2 + ((p.z - cz) / rz) ** 2;
      return q < 1 ? a * (1 - smooth(0, 1, Math.sqrt(q))) : 0;
    };
    // BROAD and SHALLOW. At a tenth of this head's radius the same bumps read as
    // lumps on a potato rather than as a brow and two cheeks; the face's outline has
    // to stay a clean oval because at ship size the outline is all there is.
    let d = 0;
    d += bump(0, y(0.19), u(0.13), u(0.16), u(0.07), u(0.13), u(0.006)); // brow
    d += bump(u(0.1), y(0.31), u(0.1), u(0.11), u(0.1), u(0.12), u(0.005)); // cheek R
    d += bump(-u(0.1), y(0.31), u(0.1), u(0.11), u(0.1), u(0.12), u(0.0045)); // cheek L
    d += bump(0, y(0.405), u(0.09), u(0.07), u(0.055), u(0.08), u(0.004)); // chin
    d -= bump(0, y(0.5), 0, u(0.1), u(0.06), u(0.1), u(0.006)); // under the jaw
    if (d) {
      const l = Math.hypot(p.x, p.z) || 1;
      p.x += (p.x / l) * d;
      p.z += (p.z / l) * d;
      p.y -= d * 0.15;
    }
  });
}

// ── EARS (§1.4) ───────────────────────────────────────────────────────────────────
// Root INSIDE the skull, out to the tip at x 0.371 H / y 0.203 H so the two tips are
// the figure's whole width. The axis leaves the skull nearly sideways and curls UP
// along its length (a shallow banana, not a spike) — the control point below puts the
// start tangent on +x alone and the end tangent 29° off vertical, inside §1.4's
// measured 14–34°. Both tips sit at the SAME height, 0.203 H below the crown: the
// crown is the apex of the figure and the ears buy width, never height (§7.1 G2).
const EAR_SWEEP = -0.2; // rad about Y — the blade plane rakes back, which is what
// foreshortens the ears to §1.3's 1.53–1.59 back-view aspect. At −0.34 the blades read
// edge-on from the front and the pair looked like two swept horns, not two leaves.
const EAR_TIP_T = 0.203;

function ear(side: 1 | -1): THREE.BufferGeometry {
  const p0 = new THREE.Vector3(side * u(0.085), y(0.305), -u(0.062));
  const p1 = new THREE.Vector3(side * u(0.29), y(0.322), -u(0.05));
  const p2 = new THREE.Vector3(side * u(0.378), y(EAR_TIP_T), -u(0.042));
  const axis = (t: number) => {
    const it = 1 - t;
    return new THREE.Vector3(
      it * it * p0.x + 2 * it * t * p1.x + t * t * p2.x,
      it * it * p0.y + 2 * it * t * p1.y + t * t * p2.y,
      it * it * p0.z + 2 * it * t * p1.z + t * t * p2.z,
    );
  };
  const g = limb(axis, earRad, 20, 14, 0);
  g.rotateY(side * EAR_SWEEP);
  return g;
}

// §1.4: blade 25 px deep at the root (0.141 H), tapering to the tip; a lens section,
// thin front-to-back. The taper is held FULL until well past halfway — iteration 1
// tapered from the root and the blades read as whiskers rather than the broad leaves
// the client draws.
function earRad(t: number): [number, number] {
  // a LEAF: broad through the middle of the blade, drawn to a point only in the last
  // fifth. sin(πt)^0.45 holds the width where the client draws it — a taper that starts
  // at the root gives the thin curved horn the first two passes rendered.
  //
  // ORDER MATTERS, and getting it wrong cost two passes. limb() frames each ring with
  // `side` = cross(tangent, +z) — for a blade that leaves the skull almost horizontally
  // that vector is VERTICAL — and `up` = cross(side, tangent), which comes out along
  // +z. So the FIRST radius is the blade's height in the picture plane and the second
  // is its thickness front-to-back. Returned the other way round, the whole leaf stood
  // edge-on to the lens and the ears rendered as two thin crescents.
  // …and it must close to a POINT at t = 1. Left blunt (w ≈ 0.49 at the tip) the blade
  // ended in a 60-px paddle whose corner pushed the figure's projected width out to
  // 0.802 H — past §1.1's 0.757 and below gate G1's 1.25 aspect floor at 1.247.
  const w = Math.sin(Math.min(1, 0.16 + t * 0.84) * Math.PI) ** 0.72;
  return [u(0.064) * w, u(0.017) * (0.3 + 0.7 * w)];
}

// ── ARMS (§1.2: shoulder → hand = 0.20 H, very short) ─────────────────────────────
function armPieces(side: 1 | -1) {
  const at = (t: number) => {
    // 0 deep inside the torso, 1 at the fingertips. The hand has to CLEAR the hip —
    // §1.2 puts the widest point below the head at the hands (64 px against a 50 px
    // waist), so if the mitt merges into the skirt that landmark is simply gone.
    const yy = y(0.5 + t * 0.27);
    const xx = side * u(0.095 + 0.088 * smooth(0, 0.6, t));
    const zz = u(0.055 * Math.sin(t * Math.PI * 0.9));
    return new THREE.Vector3(xx, yy, zz);
  };
  // sleeve: cloth, rooted 0.09 H inside the garment so it has no ring at the shoulder
  const sleeve = limb(
    (t) => at(t * 0.5),
    (t) => {
      const r = u(0.052) * (1 - 0.2 * t);
      return [r, r * 1.05];
    },
    10,
    16,
  );
  // forearm: bare green, and only its top strip is ever seen — the wrap takes the rest
  const fore = limb(
    (t) => at(0.42 + t * 0.38),
    (t) => {
      const r = u(0.04) * (1 - 0.12 * t);
      return [r, r];
    },
    8,
    16,
  );
  // a narrow BAND, not a sleeve: at 0.045 the two wraps read as the widest thing on his
  // arms and the bare green hand below them shrank to a nub
  const wrap = limb(
    (t) => at(0.53 + t * 0.2),
    () => [u(0.039), u(0.039)],
    6,
    16,
  );
  // the hand: a small bare mitt with a thumb ridge, at the hip. §1.2 puts the widest
  // point below the head here — 64 px — and it is the hands that buy it.
  const hand = limb(
    (t) => at(0.74 + t * 0.26),
    (t) => {
      const r = u(0.057) * Math.sin(Math.min(1, 0.4 + t * 0.85) * Math.PI * 0.82);
      return [r * 0.72, r];
    },
    10,
    16,
  );
  return { sleeve, fore, wrap, hand };
}

// ── LEGS (§1.2: hip → sole 0.28 H, only 0.18 H of it below the hem) ───────────────
function legPieces(side: 1 | -1) {
  const at = (t: number) =>
    new THREE.Vector3(side * u(0.068 + 0.004 * t), y(0.72 + t * 0.28), u(0.004 * t));
  const shank = limb(
    (t) => at(t * 0.68),
    () => {
      const r = u(0.048);
      return [r, r];
    },
    8,
    16,
  );
  const wrap = limb(
    (t) => at(0.39 + t * 0.22),
    () => [u(0.054), u(0.054)],
    6,
    16,
  );
  // the boot: ankle at 0.89 H, and a real toe — the toe is what stops the pair reading
  // as two dowels, and it is the only part of him that leaves the plumb line
  const boot = limb(
    (t) => {
      const p = at(0.6 + t * 0.4);
      p.z += u(0.075) * smooth(0.55, 1, t);
      p.y += u(0.004) * smooth(0.7, 1, t);
      return p;
    },
    (t) => {
      const r = u(0.056) * (1 + 0.14 * smooth(0.2, 0.8, t) - 0.5 * smooth(0.88, 1, t));
      return [r, r * (1 - 0.28 * smooth(0.5, 1, t))];
    },
    12,
    14,
  );
  return { shank, wrap, boot };
}

// ── THE EYES (§1.5, §8.5) ─────────────────────────────────────────────────────────
//
// A two-part UNLIT object. The bright field cannot go muddy under any rig, curtain
// state or grade — which is exactly why the client can stage him in front of a torch
// and still read him. The shade crescent is part of the SAME unlit surface, not a
// light response: in the reference it is constant across all 15 face plates, and
// making it lighting-driven would make the eyes flicker, the one thing they must never
// do. No ink outline: at small sizes a ring eats the bright field and the read dies.
const EYE = {
  cy: 0.272, // §1.5 — eye centre 64 % down the head unit
  cx: 0.0945, // half of the 0.189 H centre-to-centre spacing (§1.5: 57 px pair span)
  rx: 0.0685, // §1.5: 0.26 × head width
  ry: 0.085, // §1.5: 0.40 × head height
  proud: 0.05, // front cap proud of the skull, in H — gate G4 wants ≥ 0.03 world units
};

function eyeGeometry(side: 1 | -1) {
  // an almond: an ellipse pinched a little at the inner corner, which is what the
  // reference draws — a tall oval, not a disc
  const outline = (t: number) => {
    const a = t * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const pinch = 1 - 0.16 * Math.max(0, -side * c) * (1 - Math.abs(s) * 0.4);
    return new THREE.Vector2(u(EYE.rx) * c * pinch, u(EYE.ry) * s);
  };
  const N = 34;
  const R = 5;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const field = new THREE.Color(EYE_FIELD);
  const cres = new THREE.Color(EYE_CRESC);
  // the head's own front surface at THIS eye's centre — read off the skull, never typed
  const cz = u(headFrontZ(EYE.cy, EYE.cx));
  // THE DOME. Everything the eye is made of rides this one surface — the crescent and
  // the pupil are lifted along it, never placed at a flat z. Iteration 1 put them at
  // fixed depths and both vanished INSIDE the bright field's own bulge.
  const domeZ = (f: number) => cz + u(EYE.proud) * Math.sqrt(Math.max(0, 1 - f * f));
  const put = (x: number, yy: number, z: number, c: THREE.Color) => {
    pos.push(x, yy, z);
    col.push(c.r, c.g, c.b);
    return pos.length / 3 - 1;
  };
  const centre = put(0, 0, domeZ(0), field);
  const rowStart: number[] = [];
  for (let r = 1; r <= R; r++) {
    const f = r / R;
    rowStart.push(pos.length / 3);
    for (let i = 0; i < N; i++) {
      const o = outline(i / N);
      put(o.x * f, o.y * f, domeZ(f), field);
    }
  }
  for (let i = 0; i < N; i++) idx.push(centre, rowStart[0] + i, rowStart[0] + ((i + 1) % N));
  for (let r = 0; r < R - 1; r++)
    for (let i = 0; i < N; i++) {
      const a = rowStart[r] + i;
      const b = rowStart[r] + ((i + 1) % N);
      const c = rowStart[r + 1] + i;
      const d = rowStart[r + 1] + ((i + 1) % N);
      idx.push(a, c, b, b, c, d);
    }
  // THE SHADE CRESCENT — top and OUTER third, a strip between the almond's rim and an
  // inner boundary drawn toward the pupil. Its own geometry, hard-edged, so the cut is
  // the painted decision the reference makes and not a shading gradient.
  const crestStart = pos.length / 3;
  const M = 26;
  const lo = -0.13; // start of the arc, in turns — §1.5: the top and the OUTER third
  const hi = 0.27;
  for (let i = 0; i <= M; i++) {
    const t = lo + ((hi - lo) * i) / M;
    // the arc runs over the top and round the OUTER side of this eye
    const tt = side > 0 ? t : 0.5 - t;
    const o = outline(tt);
    const lift = u(0.007);
    put(o.x * 0.998, o.y * 0.998, domeZ(0.998) + lift, cres);
    // the inner boundary: thickest at the top-outer, tapering to nothing at both ends
    const w = 0.36 * Math.sin((i / M) * Math.PI) ** 0.5 + 0.07;
    put(o.x * (1 - w), o.y * (1 - w) - u(0.004) * w, domeZ(1 - w) + lift, cres);
  }
  for (let i = 0; i < M; i++) {
    const a = crestStart + i * 2;
    idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  // THE PUPIL — §1.5: a small vertical oval, 0.20 × 0.23 of the almond, in the
  // inner-lower quadrant, with one lighter notch as its only catchlight. This is what
  // makes a look-at-camera read at 150 px; below ~90 px it is not resolvable and the
  // eye is correctly two bright dots, which is the reference's own 36-px read.
  const px = -side * u(EYE.rx) * 0.3;
  const py = -u(EYE.ry) * 0.17;
  const dark = new THREE.Color(EYE_PUPIL);
  const domeAt = (x: number, yy: number) =>
    domeZ(Math.min(0.999, Math.hypot(x / u(EYE.rx), yy / u(EYE.ry)))) + u(0.011);
  const pc = put(px, py, domeAt(px, py), dark);
  const pr = pos.length / 3;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const x = px + Math.cos(a) * u(EYE.rx) * 0.2;
    const yy = py + Math.sin(a) * u(EYE.ry) * 0.23;
    put(x, yy, domeAt(x, yy), dark);
  }
  for (let i = 0; i < 18; i++) idx.push(pc, pr + i, pr + ((i + 1) % 18));
  const catchC = new THREE.Color(EYE_CATCH);
  const cx = px - side * u(EYE.rx) * 0.07;
  const cy2 = py + u(EYE.ry) * 0.1;
  const cc = put(cx, cy2, domeAt(cx, cy2) + u(0.0012), catchC);
  const cr = pos.length / 3;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    // §1.5: ONE 1-px notch. At 0.011 H it was a second white disc and the pair read
    // googly rather than alive — 0.0045 keeps it a notch at 150 px and invisible below.
    const x = cx + Math.cos(a) * u(0.0045);
    const yy = cy2 + Math.sin(a) * u(0.0055);
    put(x, yy, domeAt(x, yy) + u(0.0012), catchC);
  }
  for (let i = 0; i < 10; i++) idx.push(cc, cr + i, cr + ((i + 1) % 10));

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  // ON THE SKULL'S OWN NORMAL, not along +z. Built flat and pushed straight forward, the
  // near eye broke out through the cheek at the three-quarter — the classic eye-on-a-
  // stalk — because at ±0.0945 H the head's surface already turns 36° away from the
  // lens. The eye is authored about the origin, swung to that normal, and only then set
  // on the face, so its cap is proud of the SURFACE and never of the silhouette.
  const ax = tbl(HEAD_P, EYE.cy);
  const az = headAz(EYE.cy);
  const nx = EYE.cx / (ax * ax);
  const nz = (headFrontZ(EYE.cy, EYE.cx) - headCz(EYE.cy)) / (az * az);
  const swing = Math.atan2(nx, Math.max(nz, 1e-6));
  g.translate(0, 0, -u(headFrontZ(EYE.cy, EYE.cx)));
  g.rotateY(side * swing);
  g.translate(
    side * u(EYE.cx),
    y(EYE.cy),
    u(headFrontZ(EYE.cy, EYE.cx)) * Math.cos(swing),
  );
  return g;
}

// ── AUTHORED MARKS (§7.3 mark 16) ─────────────────────────────────────────────────
// The short list the reference actually draws and that no silhouette can carry: the
// hood's lower edge, the 2–3 crown creases, two brows, the nose, the mouth, and the
// pale ticks across each ear blade. Everything else — wrap edges, the belt line, the
// boot line — is a real geometric edge and the ink shell draws it.
function markStrip(
  pts: THREE.Vector3[],
  widths: number[],
  normal: THREE.Vector3,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const d = new THREE.Vector3()
      .subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)])
      .normalize();
    const s = new THREE.Vector3().crossVectors(d, normal).normalize().multiplyScalar(widths[i]);
    pos.push(pts[i].x + s.x, pts[i].y + s.y, pts[i].z + s.z);
    pos.push(pts[i].x - s.x, pts[i].y - s.y, pts[i].z - s.z);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/** a mark laid on the garment's own surface at (theta, t), lifted clear of it */
function onGarment(th: number, t: number, lift = u(0.004)): THREE.Vector3 {
  const hw = u(tbl(GARMENT.map(([a, b]) => [a, b]) as [number, number][], t));
  const az = hw * tbl(DEPTH, t);
  const n = tbl(ROUND, t);
  const e = 2 / n;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const p = new THREE.Vector3(
    hw * Math.sign(s) * Math.abs(s) ** e,
    y(t),
    u(0.022) * (1 - smooth(0, 0.42, t)) + az * Math.sign(c) * Math.abs(c) ** e,
  );
  const d = swellAt(p.x, p.y, p.z);
  const l = Math.hypot(p.x, p.z) || 1;
  p.x += (p.x / l) * (d + lift);
  p.z += (p.z / l) * (d + lift);
  p.z -= dish(p.x, p.y, p.z);
  return p;
}

function marks(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const radial = (p: THREE.Vector3) => new THREE.Vector3(p.x, 0, p.z).normalize();

  // THE HOOD'S LOWER EDGE — §3.6 lists it as one of the places the reference PRESSES
  // the line hardest. It is not a silhouette edge from the front, so it must be drawn.
  {
    const pts: THREE.Vector3[] = [];
    const w: number[] = [];
    for (let i = 0; i <= 44; i++) {
      const th = -Math.PI + (i / 44) * Math.PI * 2;
      const t = 0.478 + 0.02 * Math.cos(th * 0.8);
      pts.push(onGarment(th, t));
      w.push(u(0.0045));
    }
    out.push(markStrip(pts, w, radial(pts[22])));
  }
  // THE CROWN CREASES — §4.1: 2–3 short dark strokes near the crown, in every one of
  // the 38 frames, front and back. They sit over the hood's bunch, on his left.
  for (const [th0, t0, len] of [
    [0.35, 0.045, 0.055],
    [0.62, 0.058, 0.042],
    [0.12, 0.075, 0.03],
    [Math.PI - 0.36, 0.05, 0.052],
    [Math.PI - 0.07, 0.066, 0.04],
    [Math.PI + 0.3, 0.058, 0.034],
  ]) {
    const pts: THREE.Vector3[] = [];
    const w: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const f = i / 8;
      pts.push(onGarment(th0 + 0.22 * f, t0 + len * f));
      w.push(u(0.0035) * Math.sin(Math.min(0.999, 0.1 + f) * Math.PI) ** 0.4);
    }
    out.push(markStrip(pts, w, radial(pts[4])));
  }
  // BROWS — §5: thin dark strokes drawn INSIDE the shaded forehead
  for (const side of [1, -1] as const) {
    const pts: THREE.Vector3[] = [];
    const w: number[] = [];
    for (let i = 0; i <= 6; i++) {
      const f = i / 6;
      const x = side * u(EYE.cx + EYE.rx * (0.7 - 1.5 * f));
      const yy = y(EYE.cy - EYE.ry * (1.15 + 0.22 * f));
      pts.push(new THREE.Vector3(x, yy, u(headFrontZ(EYE.cy - EYE.ry * (1.15 + 0.22 * f), Math.abs(x) / H) + 0.006)));
      w.push(u(0.0055) * Math.sin(Math.min(0.999, 0.12 + f) * Math.PI) ** 0.5);
    }
    out.push(markStrip(pts, w, new THREE.Vector3(0, 0, 1)));
  }
  // NOSE and MOUTH — §1.6: both tiny and bottom-loaded, and neither reads below about
  // 90 px of figure, which is why they are marks and not modelled features
  {
    const pts: THREE.Vector3[] = [];
    const w: number[] = [];
    for (let i = 0; i <= 5; i++) {
      const f = i / 5;
      pts.push(new THREE.Vector3(u(0.016) * (1 - f), y(0.368 + 0.022 * f), u(headFrontZ(0.368 + 0.022 * f, 0.016) + 0.005)));
      w.push(u(0.009) * (0.35 + 0.65 * f));
    }
    out.push(markStrip(pts, w, new THREE.Vector3(0, 0, 1)));
  }
  {
    const pts: THREE.Vector3[] = [];
    const w: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const f = i / 8;
      pts.push(
        new THREE.Vector3(u(0.036) * (f - 0.5) * 2, y(0.404 + 0.008 * Math.sin(f * Math.PI)), u(headFrontZ(0.404, Math.abs(0.036 * (f - 0.5) * 2)) + 0.005)),
      );
      w.push(u(0.005) * Math.sin(Math.min(0.999, 0.08 + f) * Math.PI) ** 0.5);
    }
    out.push(markStrip(pts, w, new THREE.Vector3(0, 0, 1)));
  }
  return out;
}

/** §1.4's 2–3 near-paper ticks across each blade at mid-length — the brightest marks on him */
function earTicks(side: 1 | -1): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const p0 = new THREE.Vector3(side * u(0.085), y(0.305), -u(0.062));
  const p1 = new THREE.Vector3(side * u(0.29), y(0.322), -u(0.05));
  const p2 = new THREE.Vector3(side * u(0.378), y(EAR_TIP_T), -u(0.042));
  const at = (t: number) => {
    const it = 1 - t;
    return new THREE.Vector3(
      it * it * p0.x + 2 * it * t * p1.x + t * t * p2.x,
      it * it * p0.y + 2 * it * t * p1.y + t * t * p2.y,
      it * it * p0.z + 2 * it * t * p1.z + t * t * p2.z,
    );
  };
  // the tick's length is the BLADE's own half-height at that station, never a constant:
  // iteration 1 used a fixed length and the ticks hung off the ear into open paper
  for (const [t, frac] of [
    [0.46, 0.82],
    [0.6, 0.76],
    [0.73, 0.62],
  ]) {
    // IN THE BLADE'S OWN FRAME. Laid at a fixed z instead, the ticks floated in front
    // of a blade that is raked back, and read as sparks coming off the ear.
    // the same frame the blade itself is built in: `side3` is the blade's HEIGHT (the
    // direction the ticks cross it) and `face` is its front, where they are laid
    const c = at(t);
    const d = at(t + 0.02).sub(at(t - 0.02)).normalize();
    const side3 = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1)).normalize();
    const face = new THREE.Vector3().crossVectors(side3, d).normalize();
    if (face.z < 0) face.negate();
    const half = earRad(t)[0] * frac;
    const pts: THREE.Vector3[] = [];
    const w: number[] = [];
    for (let i = 0; i <= 4; i++) {
      const f = (i / 4 - 0.5) * 2;
      pts.push(
        new THREE.Vector3()
          .copy(c)
          .addScaledVector(side3, f * half)
          .addScaledVector(face, earRad(t)[1] * 0.8),
      );
      w.push(u(0.0045) * Math.sin(Math.min(0.999, 0.1 + i / 4) * Math.PI) ** 0.5);
    }
    const g = markStrip(pts, w, face);
    g.rotateY(side * EAR_SWEEP);
    out.push(g);
  }
  return out;
}

/** the same, for the eyes' vertex-coloured buffers */
function mergeColoured(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (const g of gs) {
    const P = g.getAttribute('position');
    const C = g.getAttribute('color');
    const base = pos.length / 3;
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      col.push(C.getX(i), C.getY(i), C.getZ(i));
    }
    const I = g.getIndex()!;
    for (let i = 0; i < I.count; i++) idx.push(base + I.getX(i));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setIndex(idx);
  return out;
}

/** one buffer out of many — position + normal + index, so a family costs one draw call */
function merge(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  let hasN = true;
  for (const g of gs) if (!g.getAttribute('normal')) hasN = false;
  for (const g of gs) {
    const P = g.getAttribute('position');
    const N = g.getAttribute('normal');
    const base = pos.length / 3;
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      if (hasN && N) nor.push(N.getX(i), N.getY(i), N.getZ(i));
    }
    const I = g.getIndex();
    if (I) for (let i = 0; i < I.count; i++) idx.push(base + I.getX(i));
    else for (let i = 0; i < P.count; i++) idx.push(base + i);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (hasN) out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  if (!hasN) out.computeVertexNormals();
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// THE DRAWN LINE — one shell over the UNION of the fills (§7.3 mark 15)
//
// Every fill mesh is merged into one buffer and drawn back-faces-only, offset along the
// normal. Because it is one buffer over the union, an arm that is rooted INSIDE the
// torso has no ring at its shoulder — the only line there is where the arm's silhouette
// genuinely crosses the body, which is a line the reference draws too.
//
// LOST AND FOUND (§3.6): the offset rides a per-vertex weight, ink-dark at the hood's
// lower edges, under the chin, at each ear's outer edge and round the boots, thinning
// to a bare value step across the crown. It is not a uniform outline, because the
// reference's is not.
//
// SCREEN-SOLVED (§7.6 P4 as amended): the offset is 1.0 % of the figure's height in
// world units — which projects to 1.0 % of its projected height at every viewport by
// construction — then clamped in the vertex shader to a floor and ceiling expressed as
// a FRACTION OF THE FRAME, so a 52-px phone figure keeps a 1-px line and a 625-px plate
// figure does not grow a 6-px cartoon outline.
// ═══════════════════════════════════════════════════════════════════════════════════

const RIM = u(0.010); // §3.6: 0.6–1.1 % of the figure's height
const RIM_MIN_FRAME = 1.0 / 900; // floor 1.0 CSS px in a 900-px frame
const RIM_MAX_FRAME = 3.6 / 900; // ceiling 3.6 CSS px

function lineWeight(p: THREE.Vector3, n: THREE.Vector3): number {
  const t = (CROWN - p.y) / H; // back into doc space
  let w = 0.72;
  // pressed hardest where the reference pressed: the hood's lower edge and the jaw…
  w = Math.max(w, 1.0 * smooth(0.36, 0.46, t) * (1 - smooth(0.53, 0.62, t)));
  // …and round the boots
  w = Math.max(w, 1.0 * smooth(0.86, 0.9, t));
  // dropped across the crown to a bare value step with no ink at all
  w *= 0.2 + 0.8 * smooth(0.02, 0.14, t);
  // and dropped again on the outer curve of each ear near the tip, and on the tops of
  // the shoulders — §8.3's wear map is the same map, read the other way up
  const r = Math.hypot(p.x, p.z);
  if (t < 0.34 && r > u(0.27)) w *= 0.35 + 0.65 * (1 - smooth(u(0.27), u(0.36), r));
  if (t > 0.48 && t < 0.56 && n.y > 0.55) w *= 0.5;
  return w;
}

const SHELL_VERT = /* glsl */ `
  attribute float rimW;
  uniform float uRim;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 nv = mat3(modelViewMatrix) * normal;      // length == the uniform object scale
    float sc = max(length(nv), 1e-6);
    float w = uRim * rimW * sc;                    // local units -> world units
    vec4 clip = projectionMatrix * mv;
    // NDC-y that this offset buys at this depth; NDC spans 2 over the frame height, so
    // the fraction of the frame it covers is half of it
    float frac = 0.5 * abs(w * projectionMatrix[1][1] / max(abs(clip.w), 1e-5));
    float k = clamp(frac, ${RIM_MIN_FRAME.toFixed(6)}, ${RIM_MAX_FRAME.toFixed(6)}) / max(frac, 1e-8);
    gl_Position = projectionMatrix * vec4(mv.xyz + (nv / sc) * (w * k), 1.0);
  }
`;

const SHELL_FRAG = /* glsl */ `
  uniform vec3 uInk;
  void main() {
    gl_FragColor = vec4(uInk, 1.0);
    #include <colorspace_fragment>
  }
`;

function shell(fills: THREE.Mesh[]): THREE.Mesh {
  const pos: number[] = [];
  const nor: number[] = [];
  const rim: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const m of fills) {
    const g = m.geometry;
    const P = g.getAttribute('position');
    const N = g.getAttribute('normal');
    const base = pos.length / 3;
    for (let i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i);
      n.fromBufferAttribute(N, i);
      pos.push(p.x, p.y, p.z);
      nor.push(n.x, n.y, n.z);
      rim.push(lineWeight(p, n) * (m.userData.rimScale ?? 1));
    }
    const I = g.getIndex();
    if (I) for (let i = 0; i < I.count; i++) idx.push(base + I.getX(i));
    else for (let i = 0; i < P.count; i++) idx.push(base + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('rimW', new THREE.Float32BufferAttribute(rim, 1));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    vertexShader: SHELL_VERT,
    fragmentShader: SHELL_FRAG,
    uniforms: { uRim: { value: RIM }, uInk: { value: new THREE.Color(LINE) } },
    side: THREE.BackSide,
  });
  mat.userData.role = 'shell'; // the study's fill-mesh scan and hero.ts's scale solve skip it
  const mesh = new THREE.Mesh(g, mat);
  mesh.name = 'gobB.line';
  return mesh;
}

// ═══════════════════════════════════════════════════════════════════════════════════

/** Study B — the hooded goblin, built to the client's sheets. */
export function buildGobStudyB(): THREE.Object3D {
  const root = new THREE.Group();
  root.name = 'gobStudyB';

  const mCloth = tri(TIER.cloth, DIR_CLOTH, WEAR.cloth);
  const mBoot = tri(TIER.boot, DIR_CLOTH, WEAR.cloth);
  const mSkin = tri(TIER.skin, DIR_SKIN, WEAR.skin);
  const mLimb = tri(TIER.skin, DIR_LIMB, WEAR.skin);
  const mLinen = tri(TIER.linen, DIR_WRAP, WEAR.linen);
  const mBelt = tri(TIER.belt, DIR_WRAP, WEAR.cloth);
  const mPouch = tri(TIER.pouch, DIR_WRAP, WEAR.skin);
  const mEarR = tri(TIER.skin, DIR_EAR_R, WEAR.skin);
  const mEarL = tri(TIER.skin, DIR_EAR_L, WEAR.skin);

  const fills: THREE.Mesh[] = [];
  const add = (g: THREE.BufferGeometry, m: THREE.Material, name: string, rimScale = 1) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.rimScale = rimScale;
    root.add(mesh);
    fills.push(mesh);
    return mesh;
  };

  // ── the one garment, crown to hem ───────────────────────────────────────────────
  add(garment(), mCloth, 'gobB.garment');
  add(head(), mSkin, 'gobB.head');
  add(ear(1), mEarR, 'gobB.earR');
  add(ear(-1), mEarL, 'gobB.earL');

  // §4.7 — the pale-green throat tab at the collar, in every front plate
  {
    // §4.7 measures it at ~0.11 head-widths across; a box read as a badge, so it is a
    // small rounded capsule sunk into the collar instead
    const tab = limb(
      (t) => new THREE.Vector3(0, y(0.472 + t * 0.055), u(0.128)),
      (t) => {
        const r = u(0.028) * Math.sin(Math.min(0.999, 0.3 + t * 0.7) * Math.PI) ** 0.5;
        return [r, r * 0.6];
      },
      6,
      10,
    );
    add(tab, mSkin, 'gobB.throat');
  }

  // one buffer per FAMILY — a family shares a value, a stroke direction and a draw call
  const sleeves: THREE.BufferGeometry[] = [];
  const skinLimbs: THREE.BufferGeometry[] = [];
  const wraps: THREE.BufferGeometry[] = [];
  const boots: THREE.BufferGeometry[] = [];
  for (const side of [1, -1] as const) {
    const a = armPieces(side);
    sleeves.push(a.sleeve);
    skinLimbs.push(a.fore, a.hand);
    wraps.push(a.wrap);
    const l = legPieces(side);
    sleeves.push(l.shank); // the leg above the boot is cloth-valued in every plate
    wraps.push(l.wrap);
    boots.push(l.boot);
  }
  add(merge(sleeves), mCloth, 'gobB.limbCloth');
  add(merge(skinLimbs), mLimb, 'gobB.hands');
  add(merge(wraps), mLinen, 'gobB.wraps');
  add(merge(boots), mBoot, 'gobB.boots');

  // ── the belt and the pouch on his right hip (§4.3) ──────────────────────────────
  {
    const rings: Ring[] = [];
    for (const t of [0.632, 0.645, 0.678, 0.69]) {
      const hw = u(tbl(GARMENT, t)) + u(0.006) * (t > 0.64 && t < 0.685 ? 1 : 0.2);
      rings.push({ y: y(t), ax: hw, az: hw * tbl(DEPTH, t), n: tbl(ROUND, t) });
    }
    add(
      sweep(rings, 28, (p) => {
        const d = swellAt(p.x, p.y, p.z);
        if (d) {
          const l = Math.hypot(p.x, p.z) || 1;
          p.x += (p.x / l) * d;
          p.z += (p.z / l) * d;
        }
      }),
      mBelt,
      'gobB.belt',
    );
    // his right is −x when he faces +z; from behind — the client's default view — the
    // pouch lands on the viewer's left, which is where all eight back plates put it
    const pouch = limb(
      (t) => new THREE.Vector3(-u(0.152 - 0.006 * t), y(0.66 + t * 0.07), -u(0.03)),
      (t) => {
        const r = u(0.055) * Math.sin(Math.min(1, 0.42 + t * 0.75) * Math.PI * 0.9);
        return [r * 0.95, r * 0.85];
      },
      8,
      10,
    );
    add(pouch, mPouch, 'gobB.pouch');
  }

  // ── the eyes: unlit, and nothing may move them ──────────────────────────────────
  {
    const eyes = new THREE.Mesh(
      mergeColoured([eyeGeometry(1), eyeGeometry(-1)]),
      new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide }),
    );
    eyes.name = 'gobB.eyes';
    root.add(eyes); // NOT a shell contributor: §8.5 forbids an ink ring on the eye
  }

  // ── the authored marks ─────────────────────────────────────────────────────────
  {
    const m = new THREE.Mesh(merge(marks()), flat(LINE_DEEP));
    m.name = 'gobB.marks';
    root.add(m);
    const t = new THREE.Mesh(merge([...earTicks(1), ...earTicks(-1)]), flat(EAR_TICK));
    t.name = 'gobB.ticks';
    root.add(t);
  }

  // ── the drawn contour over the union ───────────────────────────────────────────
  root.add(shell(fills));

  // ── the contact pool (§2, §7.3 mark 14) — a soft ground ellipse is drawn in all 38
  // frames. neverAlive on purpose: a not-alive trilayer renders as a gouache blob on
  // the painted half and as its own graphite smudge on the drawing, so one mesh grounds
  // him on both sides of the seam with no staging.
  {
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      createTrilayer({ color: TIER.cloth.color, feather: 0.55, wear: 0 }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.scale.set(u(0.3), u(0.155), 1);
    pool.position.set(-u(0.012), u(0.004), u(0.01));
    pool.userData.neverAlive = true;
    pool.name = 'gobB.pool';
    root.add(pool);
  }

  return root;
}

