// THE CAST KIT — art bible §11.2 row 9, lifted out of mock/cloth.ts so the mockup route
// and the film body build the SAME human from the SAME numbers.
//
// Everything here was authored, judged and signed off inside `cloth.ts`'s buildMock().
// It moved here unchanged the day the film's own `sets/kit.ts` needed an adventurer,
// because a second copy of "what a person looks like in this world" is exactly the drift
// this rebuild exists to close. `cloth.ts` now imports it; so does `sets/kit.ts`.
//
// THE HUMAN BUILD LAW (row 9). A human here is built to three marks the goblin does not
// have, and to nothing else:
//   1. the SHOULDER LINE — a horizontal at the top of the body. He has none.
//   2. one unbroken VERTICAL DRAPE — he is a dome on a stump; they are a wedge on a
//      column.
//   3. exactly ONE silhouette-carrying attribute — raised sword · shield · hat brim.
//      A second attribute halves the first.
// No hands, no feet, no face in the silhouette. A hand is the end of the sleeve and the
// object starts inside it. No eye geometry: a head here is 6–13 px and two ink dots on
// it is a beetle, not a person.
//
// WHAT MOVED, AND IT IS ONE THING: the figure used to be authored in the hero route's
// own view plane, with the shot's azimuth baked into every part's matrix. The film
// stands adventurers at seven yaws across eight stages, so the frame is now a parameter
// — `FRONT` builds the figure in its own front plane (local +X screen-right, local +Z
// toward the lens) and the caller rotates the whole group, which is the same thing
// §3.6 asks for: marks authored in the plane the lens will see.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { mark, at, limb, mixHex, hand, mergeStrokes, VIEW_CAM } from './marksKit.ts';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';

// ---- THE PROPORTION SHEET · docs/2026-09-05-cast-reference.md §3 --------------------
//
// EVERY NUMBER BELOW IS MEASURED, none is chosen. The cast failed the same "three chess
// pawns" verdict three times because three rounds moved values and none moved the
// silhouette. The reference measured the shipped figures at the beats they appear in and
// resolved row 9's own contradiction, so the figure is now built off its §3 table.
//
// THE 60 % IS STRUCK (reference §1.3). R16 derived it from a 0.75-u goblin; `goblin.ts`
// now reads `const H = 0.9` and `world.goblin.root.scale` measures 1.000. Holding his
// three surviving numbers — 0.900 u, 2.36 head-units, his head 2.4× a human head:
//
//   goblin head unit = 0.424 × 0.900 = 0.38160 u
//   human head unit  = 0.38160 / 2.4 = 0.15900 u    ← HU
//   human head-units = 1.2402 / 0.159 = 7.80
//   goblin : human   = 0.900 / 1.2402 = 72.6 %      (was 60 %: a BIGGER goblin beside them)
//
// 1.24 u, 2.4× and 2.36 HU all survive, and 7.80 head units is inside the 7.5–8 band a
// drawn human reads in. Note the direction of travel: the change makes the goblin larger
// beside the cast and the cast's job harder, not easier.
export const HU = 0.159;
export const FIG_H = 1.2402;
/** A landmark quoted in head-units FROM THE CROWN (§3.1), as a height above the sole. */
const fromCrown = (hu: number) => FIG_H - hu * HU;
export const Y_HEM = fromCrown(7.2); // 0.0955 — BELOW THIS THE SILHOUETTE MUST BREAK
export const Y_KNEE = fromCrown(5.75); // 0.3262
export const Y_HIP = fromCrown(3.8); // 0.6362
export const Y_WAIST = fromCrown(3.0); // 0.7627 — the drape's waist, not the body's
export const Y_SHOULDER = fromCrown(1.5); // 1.0021 — the acromion. THE shoulder line
export const Y_CHIN = fromCrown(1.0); // 1.0812
export const DEPTH = 0.56; // the wedge: wide across the lens, thin in depth

// ---- WHY THE OLD FIGURE WAS A PAWN, IN ONE PARAGRAPH --------------------------------
//
// `LatheGeometry(DRAPE, 26)` is a SOLID OF REVOLUTION and the reference measured exactly
// what that costs: **two turning points on all twelve silhouette edges** (6 figures ×
// left/right) at every prominence threshold down to 1 px, and each edge a uniformly
// scaled copy of the other to within **0.04–3.9 % of the figure's own width**. A chess
// pawn has exactly two turning points and is mirror-symmetric about its axis. So did
// every figure in this film, and no amount of re-colouring was ever going to touch it.
//
// The azimuthal sculpt that was supposed to prevent this could not, for three arithmetic
// reasons the reference sets out in §2.4c: a silhouette samples TWO azimuths; `amp`
// collapses to 0.016 at the shoulder (0.0038 u = 0.79 px, a quarter of the stroke floor);
// and the one height-invariant term, `0.08·cos φ`, is a lateral shear — a lean, not a
// shape, and a lean cannot make a turning point.
//
// So the outline is now TWO DIFFERENT FUNCTIONS, one per silhouette edge, over a centre
// line that is not a straight axis. G-A2 fits an axis and then a scalar — which removes a
// lean and removes a scale — so the difference has to live in the shape itself, and it
// does: between y 0.20 and 0.64 the two edges' slopes have OPPOSITE SIGN.

/** Half-width across the lens, the symmetric part. §3.2: shoulder 0.3339, waist 0.2783,
 *  hem 0.3737 — the HEM is the widest element below the shoulder, which is what turns the
 *  monotone pawn taper into a hem maximum, a waist minimum and a shoulder maximum. */
const BASE: [number, number][] = [
  [Y_HEM, 0.18685],
  [0.2, 0.177],
  [0.35, 0.164],
  [0.5, 0.152],
  [Y_HIP, 0.144],
  [Y_WAIST, 0.13915],
  [0.9, 0.152],
  [0.978, 0.16],
  [Y_SHOULDER, 0.16695], // the shoulder CORNER; the next point is the flat run inward
  [1.0105, 0.098],
  [1.019, 0.0334], // the neck — 0.42 HU (§3.2)
  [1.075, 0.0334],
];
/** The lathe's own profile: BASE closed at both ends so the robe is a solid. */
const LATHE: [number, number][] = [[Y_HEM, 0], ...BASE, [1.075, 0]];

// THE SIDE DELTAS ARE THE ROUND. The left hem flares while the right hangs straight; the
// right hip carries the weight while the left goes slack. Over y 0.20 → 0.64 — 35 % of
// the figure's height — the two edges move in OPPOSITE directions, which no axis fit and
// no scalar fit can remove (H5 · G-A2). They vanish at the shoulder, because the shoulder
// line is a measured width (0.3339) and is not negotiable.
// The first cut of these numbers cost the RIGHT edge its hem maximum — measured at t38,
// turnL came back 2, because the hem-to-waist step on that side was 0.0157 u = 2.5 px,
// under A1's own max(2 px, 1.5 % of H) = 4.16 px prominence floor. The pruner ate it and
// the edge read as a two-turning-point pawn again. Both edges therefore now keep a hem
// maximum worth at least 0.040 u, and the opposite-sign band is carried by the HIP: over
// y 0.20 → 0.64 — 35 % of the figure height — the left half-width FALLS 0.064 u while
// the right RISES 0.021, and the band was widened to that after a first cut measured 7.2 %
// on one player against H5/A2 own 8 % floor.
// SECOND CUT, and the same class of defect one level down: the left edge had a 0.003-u
// bump at the waist above its hip minimum, and a prominence pruner removes the SMALLEST
// pair first — so it removed (hip min, waist max) and left two maxima with nothing between
// them, reporting turnL 2 on a profile that has three. Both edges are now monotone into a
// single minimum, and every surviving extremum clears 0.025 u — 5.6 px at t38, against the
// gate own max(2 px, 1.5 % of H) = 4.2 px.
const DELTA_L: [number, number][] = [
  [Y_HEM, 0.01],
  [0.2, 0.008],
  [0.35, -0.006],
  [0.5, -0.014],
  [Y_HIP, -0.018],
  [Y_WAIST, -0.018],
  [0.9, 0.012],
  [Y_SHOULDER, 0],
  [1.075, 0],
];
const DELTA_R: [number, number][] = [
  [Y_HEM, -0.003],
  [0.2, -0.016],
  [0.35, 0],
  [0.5, 0.02],
  [Y_HIP, 0.038],
  [Y_WAIST, 0.024],
  [0.9, -0.012],
  [Y_SHOULDER, 0],
  [1.075, 0],
];
// CONTRAPPOSTO (H4). The goblin reference §7.1 rules HIS rest pose plumb and symmetric;
// the cast must be the inversion of that, because a row of plumb figures is a row of
// chess pieces and that contrast is the whole point. The centre line is an S — weight on
// the left foot, hip pushed screen-right, shoulders coming back over it — and the head is
// then set 0.072 u across, so the head-centre-to-hem-centre line runs 4.9° off vertical
// (H4 asks ≥ 4°) with the head 0.57 HU off the hem's centre (H4 asks ≥ 0.30 HU).
const LEAN: [number, number][] = [
  [0, 0],
  [0.15, 0.002],
  [0.35, 0.014],
  [Y_HIP, 0.024],
  [Y_WAIST, 0.02],
  [0.9, 0.01],
  [Y_SHOULDER, 0.006],
  [1.075, 0.022],
];
/** Where the head sits across the lens — the top of the contrapposto S. Every unit of
 *  body lean is also a unit of width the arm cannot spend against G-F's aspect floor, so
 *  the body lean is half what the first cut used and the head carries the rest: measured,
 *  the head's centre lands 0.083 u (0.52 HU) off the hem's centre and the line between
 *  them runs 4.5° off vertical, against H4's 0.30 HU and 4°. */
export const HEAD_X = 0.078;
export const HEAD_Y = FIG_H - 0.0795; // 1.1607: crown 1.2402, chin 1.0812, 1.00 HU tall

const tbl = (t: [number, number][], y: number) => {
  if (y <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (y <= t[i][0]) {
      const [y0, r0] = t[i - 1];
      const [y1, r1] = t[i];
      return r0 + (r1 - r0) * (y1 === y0 ? 1 : (y - y0) / (y1 - y0));
    }
  }
  return t[t.length - 1][1];
};
/** The symmetric half-width — still the lathe's radius on the azimuths the lens never
 *  sees, which is the only thing it was ever entitled to be. */
export const radiusAt = (y: number) => tbl(BASE, y);
export const leanAt = (y: number) => tbl(LEAN, y);
/** THE SILHOUETTE ITSELF, as signed screen-x. `s` is −1 for the screen-left edge, +1 for
 *  the screen-right one. G-E asks that the drawn line BE the rendered edge; mass and
 *  contour both come from here, so they cannot drift apart the way they did (§2.4d: the
 *  contour was built from `radiusAt()` and the mass from `radiusAt()·f(φ,y,seed)`, and
 *  the strongest mark on the figure was therefore a drawing of a lathe). */
export const edgeAt = (y: number, s: -1 | 1) =>
  leanAt(y) + s * (tbl(BASE, y) + tbl(s < 0 ? DELTA_L : DELTA_R, y));

// ---- THE COMMITTED VALUE LADDER, AND bakeCloth ---------------------------------
//
// WHAT THIS REPLACES, AND WHY. The bake that shipped here laid 24 fold strokes at alpha
// 0.18-0.38 over a white field with a 0.72 floor, and two verifiers measured the same
// thing from it: the DM's umber at t38 came back mean L 0.2344 with 41.08 % of its own
// pixels within 0.05 of INK, row ranges 74/53/39/38/39 and plateaux 0/2/2/4/3 - one of
// seven rows passing. At t44 one scan row measured range 4/255 at 100 % a single value.
// A near-black slab with a couple of scratches on it, which is exactly what those numbers
// describe and exactly what "peg dolls" means once the contour is already on the form.
//
// THE ARITHMETIC OF THE FAILURE, because the strokes were never the whole story. The
// paint side quantizes in the ENCODED domain (trilayer.ts:292): triPq = (floor(E*N)+0.5)/N
// over N = `poster` bins. At N = 8 a bin is 0.125 encoded and the FIRST bin above the ink
// value 0.1527 has its representative at 0.1875 - 0.0348 above ink, INSIDE the gate's own
// "within 0.05 of ink" band. cloakUmber's albedo is E 0.3387 and the film's key lands it
// near E 0.234 lit, so the whole garment fell into bins 1 and 2 and the darker of those
// two IS the 41 % near-ink population. No stroke alpha reaches that: a x0.72 multiply is
// 0.868 in the encoded domain, a third of one bin. POSTER 8 CANNOT PUT FOUR PLATEAUX ON A
// TIER-4 GARMENT at any albedo the token ladder allows, and that is why every previous
// round of stroke-tuning on this canvas measured the same slab.
//
// SO THE SURFACE IS AUTHORED, NOT SHADED. Row 9's drawn-state clause asks for "committed
// shadow mass ... no tone fill", and that is taken literally: the canvas is a small ladder
// of COMMITTED VALUE MASSES - broad vertical bands of cloth, each one a decided colour,
// with irregular hand boundaries that pinch and swell down the drape. A mass has no
// direction, so nothing on this canvas can cross anything else on it: the no-hatching
// gate is met by construction rather than by inspection. The one horizontal is the hem,
// and it is an EDGE.
//
// §4.5 BINDS ON WHAT REACHES THE SCREEN, so a grey multiply is not available: `token x
// 0.72` is a point on the segment from the token toward BLACK, and black is not a token
// (`ink` is #222222). Every stop below is therefore a real two-token mixHex, painted into
// the canvas as ITS OWN COLOUR, and `material.color` goes to white - the idiom
// sets/kit.ts:180 already ships (`color: spec.map ? 0xffffff : color`). triAlbedo then IS
// the stop, exactly, and the tier quantizer at trilayer.ts:549 reads the authored value
// instead of a multiply of it.
//
// THE STOPS ARE AUTHORED AS ENCODED LUMINANCE and solved onto the segment, not the other
// way round: E is the quantity BOTH quantizers measure (pow(triLum(c), 0.4545)), so
// authoring in E is authoring in the units the film actually bands in.
const ENC_INK = 0.1527; // pow(triLum(#222222), 0.4545) - the shader's own ink value
const ENC_PAPER = 0.9598; // ...and its paper
// THE KEY'S GAIN ON A GARMENT, as one number, MEASURED and not assumed: the ratio of a
// garment texel's rendered encoded luminance to its own albedo's. Read off the DM's umber
// at S5 t38 (albedo E 0.3387, rendered mean 0.2344) and confirmed on player2's road cloak
// (0.7747 -> 0.508). It is used for exactly one thing — placing the paint-side floor on
// the garment's own darkest committed stop rather than on the paper's black — and it is a
// calibration, so it lives here as a named number that a re-measure can move.
const KEY_GAIN = 0.69;
/** The encoded luminance trilayer.ts measures: sRGB -> linear -> Rec.709 luma -> pow 1/2.2. */
export function encLum(hex: number): number {
  const ch = (s: number) => {
    const c = ((hex >> s) & 255) / 255;
    return c < 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return Math.pow(0.2126 * ch(16) + 0.7152 * ch(8) + 0.0722 * ch(0), 0.4545);
}
/** The underdrawing tier an albedo lands in - trilayer.ts:377-381, restated. */
export const triTierOf = (hex: number) => {
  const tone = 1 - (encLum(hex) - ENC_INK) / (ENC_PAPER - ENC_INK);
  return tone < 0.14 ? 0 : Math.min(4, Math.floor((tone - 0.14) * 6.25) + 1);
};
/** The committed mix on a->b whose encoded luminance is `e`. Monotone either way; 20
 *  halvings is exact to the byte, and the result is a two-token mixHex by construction. */
function stopHex(a: number, b: number, e: number): number {
  const up = encLum(b) > encLum(a);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if ((encLum(mixHex(a, b, m)) < e) === up) lo = m;
    else hi = m;
  }
  return mixHex(a, b, (lo + hi) / 2);
}

// THE LADDERS. Each garment is a HUB token with a dark anchor and a light anchor, so
// every stop is a two-token mix through a colour already committed to this film. The
// stops are chosen against two independent grids at once:
//
//  - THE TIER GRID (drawn state). Boundaries in E are 0.8468 / 0.7177 / 0.5885 / 0.4594.
//    Every stop clears its nearest boundary by >= 0.031 encoded, against the shader's own
//    +/-0.03 tone noise (+/-0.025 in E), so no mass flickers a tier across its own area.
//  - THE POSTER GRID (painted state). Adjacent stops are >= 0.06 apart in E so that after
//    the key's gain they still land at least one poster bin apart and read as two
//    plateaux rather than one.
//
// AND THE DECISION THE BRIEF ASKS FOR, WITH ITS ARITHMETIC. A garment's albedo SWEEPS
// TIERS across its own surface, deliberately, and it is the structure - not a defect.
// The counting: cloakUmber sits at E 0.3387 and the t3/t4 boundary is E 0.4594. A map can
// only multiply DOWN (a canvas texel is <= 1.0), so under the old white-based bake the
// umber garment could not reach t3 at ANY texel - it needed x1.384 - and its entire drawn
// state was ONE tier, which is one stroke-tile density over the whole figure. That is
// precisely G6's failure: at curtain 1 the garment is a single flat scribble field with
// nothing structural in it, and G6 forbids the alive ramp that would otherwise carry the
// read. So the sweep is REQUIRED, and §6.3 clause 4's reading is the right one.
//
// What is not free is its EXTENT, so it is capped at THREE tiers per garment and the
// DOMINANT band group - 0.37 of the tile, the widest three bands - stays exactly on the
// committed token. Solved, the middle stop of each ladder comes back as #D7C5A3 /
// #808372 / #6A5238, which is cloakRoad, cloakOiled and cloakUmber to within one byte of
// green on the middle one. C5 is judged there and the ladder is untouched: E 0.775 /
// 0.500 / 0.339, gaps 0.275 and 0.161 against C5's 0.098.
//
// AND THE HONEST HALF OF THAT, because the RENDERED means do move. A ladder wide enough
// for the standard's 50/255 of range is 0.27 encoded of albedo, and neither end token has
// 0.135 of room on both sides: cloakUmber has 0.085 above the ink floor before its darkest
// mass reads as a hole, cloakRoad has 0.072 below the tier-0 blank ceiling before its
// lightest mass stops being drawn at all. So the dark garment's rendered mean rises above
// its token and the pale one's falls below it, and the trio's rendered separation closes
// from 0.136/0.125 (flat) to 0.091/0.092 (measured at S5 t38, curtain 0). That is a cost
// of the standard, not a choice inside it, and it is ledgered rather than hidden: it
// cannot be bought back without either cloakRoad dropping a tier or the tier-0 ceiling
// moving, and neither is this workflow's to move.
type Ladder = { hub: number; lo: number; hi: number; stops: number[] };
let ladders: Map<number, Ladder> | null = null;
/** THE THREE AUTHORED LADDERS. Solved and printed (E · tier · clearance to the nearest
 *  tier boundary; the middle stop of each is the committed token):
 *    road   #9A7B55 .499 t3 .040 | #BBA179 .640 t2 .051 | #D7C5A3 .775 t1 .057
 *                                | #DCCBAA .798 t1 .049 | #DFD0AE .816 t1 .031
 *    oiled  #645F51 .374 t4 .085 | #6F6E5E .427 t4 .033 | #808372 .503 t3 .043
 *                                | #8D907F .553 t3 .036 | #B2B19C .684 t2 .034
 *    umber  #4B3A2B .249 t4 .210 | #5A4632 .294 t4 .165 | #6A5238 .341 t4 .118
 *                                | #7E674E .418 t4 .041 | #9D8B70 .550 t3 .039
 *  The umber ladder stops at TWO tiers rather than three on purpose: a t2 stop on it was
 *  built and measured, and it took the drained figure at t44 from 2.2 % to 14.6 % of its
 *  area within 0.05 of paper - a tier-2 mass draws a sparse stroke tile, and a sparse
 *  stroke tile on the film's one curtain-1 figure is G-G clause 1's own failure. Two
 *  tiers, and the drained DM measures 3.6 % near paper.
 *  Built lazily because the three cloak tokens are declared below this block. */
function ladderFor(token: number): Ladder {
  if (!ladders)
    ladders = new Map([
      [cloakRoad, { hub: P.earthTrack, lo: P.caveDark, hi: P.flameCore, stops: [0.5, 0.64, 0.7747, 0.8, 0.815] }],
      [cloakOiled, { hub: P.rockFace, lo: P.caveDark, hi: P.flameCore, stops: [0.375, 0.425, 0.5001, 0.555, 0.685] }],
      [cloakUmber, { hub: P.timberDark, lo: P.caveDark, hi: P.flameCore, stops: [0.25, 0.295, 0.3387, 0.42, 0.55] }],
    ]);
  return (
    ladders.get(token) ?? {
      // an unlisted paint (a set may pass its own earthy token) gets the same SHAPE of
      // ladder centred on itself, clamped inside the drawable band so it can neither
      // fall through the ink floor nor rise off the page into tier 0
      hub: token,
      lo: P.caveDark,
      hi: P.flameCore,
      stops: [-0.16, -0.08, 0, 0.09, 0.19].map((d) =>
        Math.min(0.83, Math.max(0.24, encLum(token) + d)),
      ),
    }
  );
}

// THE DRAPE ITSELF. Nine bands round the tile, unequal, in a sequence that runs a crest
// down into a trough and back - cloth does not alternate, it falls. The sequence matters
// more than it looks: the tile repeats 1.6x round the garment (robeGeom's uv), so the
// lens sees about 0.8 of one tile - seven bands - and the film stands this figure at
// seven different yaws across eight stages. EVERY window of seven consecutive bands in
// this sequence carries at least FOUR distinct stops, so "four plateaux" holds at every
// yaw the film has and not only at the one it was authored at.
//
// NINE AND NOT SEVEN, measured rather than argued. A seven-band cut was built to serve
// S1's small framing (§3.8's "fewer and bigger") and measured WORSE where it counts: the
// DM at t44 went from 6 of 7 scan rows carrying four plateaux to 3 of 4. The narrowest
// band here is 0.07 of the tile = 18 texels; the lens sees 0.8 of a tile across a figure
// ~110 px wide at S5, so that band is ~9 screen px of plateau against the standard's 4.
// It is ~5 px at S1's own framing, which is where the standard stops being met — see the
// report's S1 numbers; the honest fix for that is a bigger figure, not a coarser tile.
const BAND_W = [0.14, 0.09, 0.13, 0.07, 0.12, 0.1, 0.15, 0.08, 0.12];
const BAND_S = [4, 3, 2, 0, 2, 1, 3, 1, 2];

const clothTex = new Map<number, THREE.CanvasTexture | null>();
/**
 * One garment's canvas: its committed value ladder, painted as masses.
 *
 * 256^2, addressing 1.4 u of a 1.24-u figure - 183 texels/unit. The narrowest band is
 * 0.07 of the tile = 18 texels; the lens sees 0.8 of a tile across a figure ~85 px wide
 * at t38's 213 px/u, so that band is ~7 screen px of plateau against the gate's 4. The
 * narrowest thing on this canvas is still wider than the gate's floor.
 */
function bakeCloth(token: number): THREE.CanvasTexture | null {
  const had = clothTex.get(token);
  if (had !== undefined) return had;
  if (typeof document === 'undefined') {
    clothTex.set(token, null);
    return null;
  }
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const L = ladderFor(token);
  const hubE = encLum(L.hub);
  const css = L.stops.map(
    (e) => '#' + stopHex(L.hub, e < hubE ? L.lo : L.hi, e).toString(16).padStart(6, '0'),
  );
  const rnd = hand(0x3c17b + (token & 0xffff));

  // the ground is the token's own band, so a texel the drape never covers is still the
  // colour the ladder says this garment is
  ctx.fillStyle = css[1];
  ctx.fillRect(0, 0, size, size);

  // THE BOUNDARIES. Each is a hand line down the tile - a slow swell plus a faster pinch
  // - and boundary N is boundary 0 shifted by exactly the tile width, so the wrap is
  // seamless under RepeatWrapping. Amplitudes are texels: 6.5 and 2.8 on a 256 tile is
  // 0.035 u and 0.015 u of breathing on a fold, which is a fold breathing.
  const ph = BAND_W.map(() => [rnd() * 6.28, rnd() * 6.28, 1.4 + rnd() * 1.6]);
  const edge: ((v: number) => number)[] = [];
  let acc = 0;
  for (let i = 0; i <= BAND_W.length; i++) {
    const x0 = acc * size;
    const p = ph[i % BAND_W.length];
    edge.push(
      (v) => x0 + Math.sin(v * 0.0245 + p[0]) * 6.5 + Math.sin(v * 0.0245 * p[2] + p[1]) * 2.8,
    );
    if (i < BAND_W.length) acc += BAND_W[i];
  }

  // THE MASSES. Filled between neighbouring boundaries, three times across so a band that
  // straddles the seam is whole. No stroke, no alpha, no direction: a mass.
  //
  // AND THREE ZONES DOWN THE DRAPE, because a garment banded only across the lens is a
  // barcode: every scan row would meet the identical set of values and the standard's "at
  // >= 5 heights" would be one measurement counted five times. Cloth over the shoulders
  // catches the light, cloth at the hem pools, so the yoke takes each band ONE STOP UP the
  // ladder and the hem ONE STOP DOWN. The zone boundary is a boundary between two masses -
  // an edge, exactly as the hem line below is - and never a second stroke family, so the
  // no-hatching gate is untouched. The two crossings wobble against each other (the band
  // edges bow, the zone lines are drawn with the same hand), so the tile has no lattice in
  // it: measured, no two of the nine bands change zone at the same texel row.
  const zoneY = [0, 0.28, 0.74, 1].map((f) => f * size); // canvas-down: yoke, body, hem
  for (let z = 0; z < 3; z++) {
    const shift = [1, 0, -1][z]; // yoke lighter, body the band's own stop, hem darker
    const zw = ((rnd() - 0.5) * 9) | 0;
    for (let i = 0; i < BAND_W.length; i++) {
      ctx.fillStyle = css[Math.min(4, Math.max(0, BAND_S[i] + shift))];
      const a = z === 0 ? -2 : zoneY[z] + zw + Math.sin(i * 1.7) * 6;
      const b = z === 2 ? size + 2 : zoneY[z + 1] + zw + Math.sin(i * 1.7 + 2.1) * 6;
      for (const ox of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(edge[i](a) + ox, a);
        for (let v = a; v <= b; v += 8) ctx.lineTo(edge[i](v) + ox, v);
        ctx.lineTo(edge[i](b) + ox, b);
        ctx.lineTo(edge[i + 1](b) + ox, b);
        for (let v = b; v >= a; v -= 8) ctx.lineTo(edge[i + 1](v) + ox, v);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // THE HEM - the one horizontal on this canvas, and it is an EDGE, not a stroke family:
  // the darkest committed stop, where the cloth gathers and pools on itself. v = 0 is the
  // hem in the lathe's own sense and CanvasTexture flips, so it is the bottom rows here.
  ctx.fillStyle = css[0];
  ctx.fillRect(0, size - 15, size, 15);
  // ...and its DRYBRUSH, row 9's own last clause. A dry brush lifts off the tooth in
  // BROKEN patches, so the hem's top edge is chewed into by irregular dabs of whichever
  // band stands over it - same family, no second direction, every dab a committed stop.
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size;
    ctx.fillStyle = css[BAND_S[Math.floor(((x / size) * BAND_W.length) % BAND_W.length)]];
    ctx.fillRect(x, size - 15, 4 + rnd() * 13, 2 + rnd() * 5);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // NO MIPMAPS. The tile lands at ~2 texels per screen pixel on a figure this size, and
  // a mip chain at that ratio blends the two masses either side of every boundary into a
  // ramp — measured, it is what made the first cut of this bake read as an airbrushed
  // gradient rather than as decided values. Linear magnification stays, so nothing
  // aliases; only the pre-blur goes.
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  clothTex.set(token, tex);
  return tex;
}

/**
 * THE ROBE — one mass, and NOT a solid of revolution.
 *
 * It still starts life as a `LatheGeometry`, because three's lathe gets the winding, the
 * seam and the uv right and re-deriving those by hand is a bug farm. What happens next is
 * the whole fix: every vertex is re-radiused by a blend of the LEFT and RIGHT profiles
 * (`w = 0.5 + 0.5·cos φ`, so φ = 0 lands exactly on the screen-right edge and φ = π
 * exactly on the screen-left one), then leaned by the contrapposto S.
 *
 * THE FOLD HARMONICS ARE GATED BY |sin φ|. They were the old file's claim to have killed
 * the pawn, and the reference struck that claim: they change the SILHOUETTE by 0.04–3.9 %
 * of the figure's width while changing the plan a great deal. Gated, they are exactly
 * zero at the two azimuths the lens sees and full strength at the two it does not — so a
 * three-quarter figure still has folds, and the drawn contour can be the rendered edge to
 * the pixel (G-E) instead of disagreeing with its own mass by 3.55 px.
 *
 * THE HEM IS SWEPT, not level: `+0.032·cos φ` lifts it on the screen-right side and drops
 * it on the left, so the robe ends higher over the striding leg. That is the first half of
 * the hem break; the legs below are the second (H3 · G-A3).
 */
export function robeGeom(seed: number): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    LATHE.map(([y, r]) => new THREE.Vector2(r, y)),
    26,
  );
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r0 = Math.hypot(x, z);
    const phi = Math.atan2(z, x);
    const w = 0.5 + 0.5 * Math.cos(phi); // 1 on the screen-right edge, 0 on the left
    // deepest at the hem where cloth gathers, shallow at the shoulder where it is pulled
    const amp =
      0.16 * Math.min(1, Math.max(0.1, 1.1 - y / 0.94)) * Math.abs(Math.sin(phi));
    const f =
      1 +
      amp *
        (Math.sin(phi * 3 + seed) * 0.52 +
          Math.sin(phi * 5 + seed * 1.7) * 0.31 +
          Math.sin(phi * 8 + seed * 0.6) * 0.17);
    const rr = (radiusAt(y) + tbl(DELTA_R, y)) * w + (radiusAt(y) + tbl(DELTA_L, y)) * (1 - w);
    const k = r0 > 1e-6 ? (rr * f) / r0 : 0;
    // a person is flat at the front and full at the back, which a constant DEPTH cannot say
    const d = DEPTH * (0.9 + 0.28 * (0.5 - 0.5 * Math.cos(phi)));
    pos.setX(i, x * k + leanAt(y));
    pos.setZ(i, z * k * d);
    if (y <= Y_HEM + 1e-4 && r0 > 1e-6) pos.setY(i, y + 0.032 * Math.cos(phi));
    // v runs down the garment and u round it; the tile addresses 1.4 u of height
    uv.setXY(i, uv.getX(i) * 1.6, uv.getY(i) * 0.88);
  }
  uv.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}
/** Kept under its old name so nothing outside this file has to know the shape changed. */
export const drapeGeom = robeGeom;

// ================== FIX ROUND — ITEM 10, THE TRIO'S PALETTE =========================
//
// The judgement: "`cloakIndigo #4D5A9E` and `cloakCrimson #9E3D2C` are the most
// saturated, least-earthy colours in the film and they arrive on the only three figures
// who stand beside the goblin… Recommend earthy substitutes at the same tiers, and
// differentiate the two navy figures — they are currently the same silhouette in the
// same colour."
//
// Both tokens are gone from this file. Three EARTHY mixes replace them, on three
// separate value tiers so the trio also stops being one shape repeated.
//
// FIX ROUND — THE LADDER WAS RE-SOLVED, BECAUSE IT WAS NEVER THREE TIERS. The three
// values shipped as `t2 · t3 · t4` in this comment and computed as `t3 · t4 · t4`:
//
//   cloakRoad   mix(earthTrack, caveDark, 0.18)  #957852  triTone 0.587  t3   L 0.486
//   cloakOiled  mix(rockFace,   caveDark, 0.36)  #6D6C5E  triTone 0.673  t4   L 0.417
//   cloakUmber  timberDark                       #6A5138  triTone 0.770  t4   L 0.339
//
// The tier column had been read off the L column. It is not the same number and it does
// not run the same way: `triTone = 1 − (L − 0.1529)/0.8071`, so a HIGH L is a LOW tier,
// and the boundaries in L are 0.717 / 0.588 / 0.460. Two of the three cast garments were
// one underdrawing tier — §11.5's C5 defect, and half of why a drained adventurer at
// S5 t44 measured a solid mid-grey mass with no drawn structure in it (G6). Re-solved on
// the boundaries themselves, on committed segments (§4.5), each ≥0.047 clear of a
// boundary so the shader's ±0.03 world noise cannot flip a tier mid-garment:
//
//   cloakRoad   mix(earthTrack, flameCore, 0.60)  #D7C5A3  triTone 0.229  t1  L 0.775
//   cloakOiled  mix(rockFace,   caveDark,  0.10)  #808272  triTone 0.570  t3  L 0.500
//   cloakUmber  timberDark                        #6A5138  triTone 0.770  t4  L 0.339
//
// Three hues (sun-bleached ochre, grey-olive, dark umber), three tiers ONE APART, and
// 0.275 / 0.161 of luma between neighbours against C5's 25-luma (0.098) floor. The road
// cloak going pale is the point: it is the dust of the road, it is still well under
// `paper` 0.960 (C11), and it is what gives the drained figure a light mass to carry the
// silhouette while the brim and boots hold t4.
//
// R4 STILL HOLDS AND IS STILL THE REASON THE THIRD FIGURE IS STAGED OUTBOARD: its
// L 0.285 sits 0.029 off the rendered pine crown's 0.314, which fails the ≥0.12
// separation gate exactly as the crimson did. The answer was never the colour — it was
// the SLOT. He takes the one whose background is lit ground or the paper void.
//
// THE TOKENS THEMSELVES ARE NOT DELETED FROM palette.ts. `cloakIndigo` and
// `cloakCrimson` are the shipped v1 film's, and this workflow does not own that file;
// what changes is that no v2 surface names them.
export const cloakRoad = mixHex(P.earthTrack, P.flameCore, 0.6); // #D7C5A3 · 0.229 · t1
export const cloakOiled = mixHex(P.rockFace, P.caveDark, 0.1); // #808272 · 0.570 · t3
export const cloakUmber = P.timberDark; // #6A5138 · 0.770 · t4

export type Part = { geom: THREE.BufferGeometry; m: THREE.Matrix4 };
/** The six material classes a figure is made of. `garment` is the cloak, hood and hat —
 *  ONE token per figure, because a hood is made of the cloak and sharing the token is
 *  what makes it read as one garment rather than as a wig. */
export type PartKind = 'garment' | 'face' | 'linen' | 'steel' | 'brass' | 'timber';
export type Sink = (kind: PartKind, geom: THREE.BufferGeometry, m: THREE.Matrix4) => void;
/** Exactly ONE per figure, and never two. */
export type Attribute = 'sword' | 'shield' | 'brim';

/** The plane the figure is drawn in: `right` is screen-right, `yaw` turns the built
 *  masses into it. The third axis — toward the lens — is NOT a member any more; see
 *  `mergeFigureMarks` for why the push cannot be a build-time constant. */
export interface Frame {
  right: THREE.Vector3;
  yaw: number;
}

// every figure faces the shot's lens, so its shoulder line is presented flat to the
// sheet and its local +X is screen-right. The camera is authored rails: this is a
// build-time constant, not a lookAt, and no billboard exists anywhere in this film.
const FACE_Y = Math.atan2(VIEW_CAM.x, VIEW_CAM.z);
/** The mock route's frame: the shipped hero camera solve, figures turned to face it. */
export const HERO_FRAME: Frame = {
  right: new THREE.Vector3(Math.cos(FACE_Y), 0, -Math.sin(FACE_Y)),
  yaw: FACE_Y,
};
/** The film's frame: the figure faces its own +z and the SET turns the group. The marks
 *  ride the same rotation as the mass, so they stay in the plane the lens will see at
 *  whatever yaw a stage gives the figure — which is what §3.6 actually asks for. */
export const FRONT: Frame = {
  right: new THREE.Vector3(1, 0, 0),
  yaw: 0,
};

// ---- THE PUSH IS A DEPTH PUSH, AND IT HAS TO BE AIMED AT THE LENS ------------------
//
// Every mark below is authored as a flat curve in the figure's own screen plane and then
// offset by `push` so it wins the depth test against the mass it describes. `marksKit`
// states the contract in one line — "a push along this wins the depth test WITHOUT
// MOVING ON SCREEN" — and that is true of `VIEW_CAM` on the mock route, where the lens
// really does lie on the figure's own +z. It was not true of the film. `FRONT` pushed
// along the figure's LOCAL +z and the sets stand adventurers at yaws the lens is nowhere
// near: at S2 the trio is turned 1.27/1.57/1.82 rad and at the tavern 0 and π, so the
// offset came out as a LATERAL screen displacement of up to 0.18 u — 38 px at t38's
// 213 px/u. Measured: the body contour ran inside the robe, the sleeve contour hung over
// the floor and the shield's rim circle was drawn beside the shield.
//
// A build-time constant cannot fix it, and that is the whole argument for doing this at
// render time: the film's lens MOVES inside a shot (S2 alone tracks 1.5 s of dolly), and
// the party is restaged 110 units east of where the set builds it. Any baked direction is
// wrong by the angle the camera has travelled since — 0.18 u × sin 20° is still 12 px.
//
// So the marks are BUILT AT PUSH ZERO, exactly on the form, each one carrying its own
// push distance, and this re-offsets them along the true per-vertex view ray every frame.
// A push along the ray through a point cannot move that point on screen at all, which is
// the property the whole idiom was resting on. Cost is one madd per mark vertex per
// figure per frame — ~120 vertices, six figures.
//
// ONE THING MOVES AND IT IS THE PUSH. `pencil.ts`'s `strokes()` reads only each segment's
// LENGTH and DIRECTION (`len`, `dir`, the `SUB_MIN` verdict, then `rand()`), never its
// absolute position, and every mark on this figure carries a SINGLE push — so dropping it
// is a rigid translation of each mark's point set. Segment lengths, sub-segment counts and
// therefore the exact number of draws on the file-global PRNG at `pencil.ts:244` are
// unchanged, and so is every stroke's wobble.
const _lensInv = new THREE.Matrix4();
const _lensCam = new THREE.Vector3();
/**
 * Merge one figure's marks into a single draw and aim their push at the lens.
 * Each input mark carries `userData.push`, the distance it stands off the form.
 */
export function mergeFigureMarks(marks: LineSegments2[]): LineSegments2 {
  const counts = marks.map(
    (l) =>
      (l.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute).data.array
        .length / 3,
  );
  const push = new Float32Array(counts.reduce((a, b) => a + b, 0));
  for (let i = 0, k = 0; i < marks.length; i++) {
    const p = (marks[i].userData.push as number | undefined) ?? 0;
    for (let j = 0; j < counts[i]; j++) push[k++] = p;
  }
  const out = mergeStrokes(marks);
  const attr = out.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute;
  const live = attr.data.array as Float32Array;
  const base = Float32Array.from(live);
  // the pushed positions leave the merged geometry's own bounds, so the cull sphere is
  // grown by the largest push on the figure rather than the whole object being exempted
  out.geometry.computeBoundingSphere();
  if (out.geometry.boundingSphere) out.geometry.boundingSphere.radius += 0.35;
  // QA handles, the `__film` precedent: the un-pushed marks and each vertex's push, so a
  // probe can project the drawing against the figure's own silhouette without guessing.
  out.userData.markBase = base;
  out.userData.markPush = push;
  // `LineSegments2` narrows `onBeforeRender` to the renderer alone in its own typings;
  // the runtime hook is `Object3D`'s six-argument one, so it is attached through that.
  (out as THREE.Object3D).onBeforeRender = (_r, _s, camera) => {
    out.updateWorldMatrix(true, false);
    _lensInv.copy(out.matrixWorld).invert();
    _lensCam.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_lensInv);
    for (let i = 0, v = 0; i < base.length; i += 3, v++) {
      const p = push[v];
      const dx = _lensCam.x - base[i];
      const dy = _lensCam.y - base[i + 1];
      const dz = _lensCam.z - base[i + 2];
      const s = p / Math.max(1e-6, Math.hypot(dx, dy, dz));
      live[i] = base[i] + dx * s;
      live[i + 1] = base[i + 1] + dy * s;
      live[i + 2] = base[i + 2] + dz * s;
    }
    attr.data.needsUpdate = true;
  };
  return out;
}

/**
 * ONE ADVENTURER, emitted part by part into `sink` so the caller decides how the merge
 * is bucketed — three figures into three garments on the mock route, one figure into one
 * on a film set. Nothing about the recipe changes with the caller.
 */
export function buildFigure(
  sink: Sink,
  marks: LineSegments2[],
  o: THREE.Vector3,
  attribute: Attribute,
  seed: number,
  frame: Frame = HERO_FRAME,
) {
  const RIGHT = frame.right;
  const base = at([o.x, o.y, o.z], [0, frame.yaw, 0]);
  const put = (kind: PartKind, geom: THREE.BufferGeometry, lm: THREE.Matrix4) =>
    sink(kind, geom, base.clone().multiply(lm));
  const rebase = (kind: PartKind, p: Part) => sink(kind, p.geom, base.clone().multiply(p.m));
  // a point in the FIGURE's own screen plane: h right, v up. ON the form — the stand-off
  // toward the lens is `emit`'s `push`, resolved per frame by `mergeFigureMarks`.
  const fp = (h: number, v: number) => o.clone().addScaledVector(RIGHT, h).setY(o.y + v);
  const G = P.graphiteDark;
  /** One drawn mark, with the distance it stands off the form recorded on it. */
  const emit = (pts: THREE.Vector3[], push: number) => {
    const l = mark(pts, G, 'form');
    l.userData.push = push;
    marks.push(l);
  };
  const rnd = hand(seed * 7919);

  // 1 · THE ROBE — one unbroken vertical drape (row 9's second mark, kept), and no longer
  //     a solid of revolution. See robeGeom.
  put('garment', robeGeom(seed), at([0, 0, 0]));

  // 2 · THE LEGS — the hem break (H3 · G-A3). The reference measured the shipped figure's
  //     bottom 12 % as ONE span 0.396 u wide meeting the ground as an unbroken slab, and
  //     named the missing boot notch as the goblin's own silhouette mark #4 — "which is
  //     what says a person, standing". Two legs 0.074 u (0.47 HU) apart under a hem swept
  //     0.064 u higher on the striding side, so the bottom of the figure is TWO SPANS.
  //     The stance is the contrapposto's own: the screen-left leg is plumb and carries the
  //     weight, the right one strides and splays.
  put('garment', new THREE.CylinderGeometry(0.05, 0.058, 0.152, 9), at([-0.088, 0.076, 0.016]));
  put(
    'garment',
    new THREE.CylinderGeometry(0.048, 0.056, 0.18, 9),
    at([0.09, 0.09, 0.01], [0, 0, -0.05]),
  );

  // 3 · THE HEAD — an EGG, not a ball. §3.4's biggest single miss: shipped W : H 0.963
  //     against a drawn human's 0.72, on a 0.158-u head that should be 0.1145. Scaled
  //     [0.72, 1, 0.72] off a 0.0795 sphere that is exactly 0.1145 × 0.1590 — one head
  //     unit tall, crown 1.2402, chin 1.0812 — and it inverts the goblin's own 1.24 : 1,
  //     which §3.3 names as one of the two numbers carrying the species read at any size.
  //     Its DEPTH is its width and not its height, because a head deeper than it is wide
  //     projects wider than 0.72 the moment the figure is off-axis — measured 0.806 at t38
  //     on the two players, who stand 20° off the tavern lens.
  //     It sits at HEAD_X, the top of the contrapposto S, and is tipped 5.7°.
  put(
    'face',
    new THREE.SphereGeometry(0.0795, 14, 10),
    at([HEAD_X, HEAD_Y, 0.012], [0, 0, -0.03], [0.72, 1, 0.72]),
  );
  if (attribute !== 'brim') {
    // the hood, pushed off the brow rather than worn up: never a hood DOME, because the
    // dome is the first of the goblin's five marks and no human may compete for it
    put(
      'garment',
      new THREE.SphereGeometry(0.092, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.86),
      at([HEAD_X, HEAD_Y - 0.002, -0.014], [0.3, 0, -0.03], [0.7, 0.86, 0.7]),
    );
    // THE HOOD ROLL — the mass H6 asks for, and the reason it is a ROLL and not a point.
    // G-B requires the ellipse-breaking mass to be present "at every yaw the film stages
    // this figure at" (t6 alone stages 1.27, 1.57 and 1.82 rad). A hood point or a hair
    // fall breaks the outline at one yaw and hides at another; a roll gathered at the brow
    // projects beyond the head's fitted ellipse from every direction there is. Tipped 12°
    // forward, so it is a cowl and not a second horizontal disc.
    put(
      'garment',
      new THREE.TorusGeometry(0.066, 0.02, 6, 16),
      at([HEAD_X, HEAD_Y + 0.036, -0.004], [Math.PI / 2 + 0.21, 0, 0], [1, 1, 0.86]),
    );
  }
  // THE COLLAR IS NOT OPTIONAL, and gating it on the hood is what built the reference's
  // "neck stalk" — 27 px of disc-to-shoulder on a 105-px figure. §3.1 puts 0.5 HU of
  // neck between the chin and the shoulder line; on a drawn human that span is covered by
  // the jaw and the collar, and on the brim figure it was covered by nothing at all.
  put(
    'garment',
    new THREE.SphereGeometry(0.062, 10, 8),
    at([HEAD_X - 0.006, 1.086, -0.038], [0, 0, 0], [1.28, 0.74, 0.95]),
  );

  // 4 · THE ARM (H2). One arm leaves the drape's outline between 1.6 and 4.0 HU from the
  //     crown and returns to it — the cheapest single item that breaks BOTH pawn
  //     properties at once, because it puts two turning points on one edge and none on the
  //     other. Row 9's "no hands" is why the brim figure shipped with NO ARM AT ALL; the
  //     reference amends it, and this is a SLEEVE that ends at the cuff.
  type Joint = { p: THREE.Vector3; r: number };
  const armMark: THREE.Vector3[] = [];
  const emitArm = (chain: Joint[], s: -1 | 1) => {
    for (let i = 1; i < chain.length; i++)
      rebase('garment', limb(chain[i - 1].p, chain[i].p, chain[i - 1].r, chain[i].r));
    // the sleeve's own outer contour, offset from the SAME chain the mass is built from,
    // so the line is the edge (G-E) and not a second opinion about where the arm is
    for (let i = 0; i <= 7; i++) {
      const u = (i / 7) * (chain.length - 1);
      const k = Math.min(chain.length - 2, Math.floor(u));
      const f = u - k;
      const a = chain[k];
      const b = chain[k + 1];
      armMark.push(
        fp(
          a.p.x + (b.p.x - a.p.x) * f + s * (a.r + (b.r - a.r) * f),
          a.p.y + (b.p.y - a.p.y) * f,
        ),
      );
    }
  };
  /** The side the body contour is drawn up: the one with no arm on it. */
  let clean: -1 | 1 = -1;

  if (attribute === 'sword') {
    // the raised sword — the ambush's whole posture, and the reason the swords are never
    // swung. G-C: the 0.042-u blade projected 1.8 px at t5, under §3.8's ghost floor, so
    // the "sword" at that beat was two parallel contours and nothing else. 0.060 u lands
    // 2.5 px at t5's 42.2 px/u, which is the narrowest read-carrying dimension the gate
    // asks for, and 5 % of the figure's height is a broad-bladed shortsword.
    const grip = new THREE.Vector3(0.212, 0.775, 0.1);
    const sw = at([grip.x, grip.y, grip.z], [0, 0, -0.3]);
    put('steel', new THREE.BoxGeometry(0.06, 0.6, 0.022), sw.clone().multiply(at([0, 0.38, 0])));
    put('brass', new THREE.BoxGeometry(0.19, 0.036, 0.04), sw.clone().multiply(at([0, 0, 0])));
    put('brass', new THREE.SphereGeometry(0.034, 8, 6), sw.clone().multiply(at([0, -0.165, 0])));
    put(
      'timber',
      new THREE.CylinderGeometry(0.024, 0.024, 0.13, 8),
      sw.clone().multiply(at([0, -0.09, 0])),
    );
    emitArm(
      [
        { p: new THREE.Vector3(0.1, 0.978, 0), r: 0.064 },
        { p: grip, r: 0.042 },
      ],
      1,
    );
    put(
      'linen',
      new THREE.CylinderGeometry(0.052, 0.052, 0.05, 10),
      sw.clone().multiply(at([0, -0.025, 0])),
    );
    clean = -1;
    // metal's whole drawn state: a contour on each long edge, and one core shadow
    const s = Math.sin(-0.3);
    const c = Math.cos(-0.3);
    const bladePt = (dx: number, dy: number) =>
      fp(grip.x + dx * c - dy * s, grip.y + dx * s + dy * c);
    for (const dx of [-0.032, 0.032, 0.006]) {
      emit([bladePt(dx, 0.09), bladePt(dx, 0.67)], 0.2);
    }
  }

  if (attribute === 'shield') {
    // the shield faces the lens — the only reason a disc is a silhouette attribute. It is
    // 0.272 u across (22 % of the figure's height, G-C's floor is 12 %) and it is carried
    // ACROSS the body rather than held outboard, so the figure's aspect stays inside
    // G-F's 3.32 ± 0.25 while the disc still breaks the left outline by half a head unit.
    const arm = new THREE.Vector3(-0.128, 0.745, 0.1);
    emitArm(
      [
        { p: new THREE.Vector3(-0.1, 0.978, 0), r: 0.064 },
        { p: arm, r: 0.042 },
      ],
      -1,
    );
    put(
      'linen',
      new THREE.CylinderGeometry(0.05, 0.05, 0.05, 10),
      at([-0.124, 0.73, 0.11], [1.1, 0, 0.2]),
    );
    put(
      'steel',
      new THREE.CylinderGeometry(0.136, 0.136, 0.028, 18),
      at([-0.052, 0.705, 0.215], [Math.PI / 2, 0, 0]),
    );
    put(
      'brass',
      new THREE.SphereGeometry(0.04, 9, 7),
      at([-0.052, 0.705, 0.243], [0, 0, 0], [1, 1, 0.55]),
    );
    clean = 1;
    // its rim, drawn once — a disc without a drawn rim is a coin
    const rim: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      rim.push(fp(-0.052 + Math.cos(a) * 0.14, 0.705 + Math.sin(a) * 0.14));
    }
    emit(rim, 0.3);
  }

  if (attribute === 'brim') {
    // THE BRIM STOPS BEING THE WIDEST ELEMENT. Row 9 said "the brim must CLEAR THE
    // SHOULDERS or it is not a silhouette at all", and the reference measured what that
    // instruction actually built: a 0.530-u disc, 42 % of the figure's height, 19 : 1 in
    // aspect, dead horizontal, radially symmetric, sitting directly above a sphere — the
    // widest element on four of the six figures, and the "horizontal disc" of the verdict.
    // 0.212 u is 17 % of the figure's height (G-C's floor is 12 %) and 0.17 u NARROWER
    // than the hem, so the widest thing on the figure is the hem, where §3.2 puts it. It was
    // cut a second time after LOOKING: at 0.324 u it was 2.8x the head's own width, and a lens
    // looking DOWN on it covered the head completely — a plate on a stalk, the verdict's own
    // words. At 0.212 u it is 1.85x the head and 0.103 u of face reads clear below the brim;
    // and it is tilted 14° off horizontal, over the 12° §9.3 asks for, SIDEWAYS rather
    // than front-to-back: the film's lenses look DOWN on the cast at every beat, and a brim
    // tipped fore-and-aft under a high lens projects as a rounder plate than a level one
    // does. Looked at, it read as a disc; tipped across, it reads as a hat worn at an angle.
    // It also sits 0.022 u lower, on a crown with real height, because at 1.212 the crown
    // was 0.033 u of sliver above a 0.324-u brim and the pair read as a plate on a ball.
    put(
      'garment',
      new THREE.CylinderGeometry(0.1, 0.106, 0.02, 18),
      at([HEAD_X - 0.004, 1.184, -0.004], [0.1, 0, 0.22], [1, 1, 0.88]),
    );
    put(
      'garment',
      new THREE.SphereGeometry(0.098, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2),
      at([HEAD_X, 1.178, -0.004], [0.1, 0, 0.22], [0.78, 0.62, 0.76]),
    );
    put(
      'timber',
      new THREE.CylinderGeometry(0.07, 0.076, 0.02, 12),
      at([HEAD_X, 1.188, -0.004], [0.1, 0, 0.22], [1, 1, 0.9]),
    );
    // the free arm — the brim figure's outline break, and the place the reference is
    // hardest on row 9: deleting the arm cost the only feature that breaks the taper and
    // the mirror at the same time. Reach is side-aware because the contrapposto already
    // carries the body screen-right, so a right arm has further to travel to leave the
    // outline than a left one does.
    const armSide: -1 | 1 = seed % 2 === 0 ? 1 : -1;
    // the sleeve's radius and reach are budgeted against G-F's aspect floor: the widest
    // row of the figure may not exceed 1.2402 / 3.07 = 0.404 u, and the hem already spends
    // 0.381 of it. Measured at t38 an 0.040 sleeve reaching 0.172 put the widest row at
    // 0.438 u — aspect 2.83, out of band. Re-budgeted against the softened lean it still
    const reach = (armSide < 0 ? 0.128 : 0.208) + ((seed * 0.37) % 1) * 0.01;
    // leaves the outline by 0.56 HU, over H2's 0.25, and the widest row is the hem again.
    const elbowY = 0.72 + (((seed * 0.61) % 1) - 0.5) * 0.05;
    emitArm(
      [
        { p: new THREE.Vector3(armSide * 0.1, 0.978, 0), r: 0.064 },
        { p: new THREE.Vector3(armSide * reach, elbowY, 0.035), r: armSide < 0 ? 0.036 : 0.038 },
        { p: new THREE.Vector3(armSide * 0.112, 0.575, 0.07), r: 0.03 },
      ],
      armSide,
    );
    put(
      'linen',
      new THREE.CylinderGeometry(0.034, 0.034, 0.048, 10),
      at([armSide * 0.11, 0.565, 0.1], [0.2, 0, armSide * 0.2]),
    );
    clean = armSide === -1 ? 1 : -1;
  }

  // ---- the drawn half. One body contour, one sleeve contour, two fold lines, one jaw
  // contour, one hem line. NO TONE FILL anywhere: the tone is the trilayer's own tier
  // field, and a second family laid over it would be the hatch this rebuild exists to
  // retire. The two fold lines sit 0.106 u apart with a ±0.016 bow, so they cannot cross.

  // THE CONTOUR — one unbroken mark up the arm-free silhouette, ACROSS the shoulder line,
  // and a short way down the other side. Every point comes from `edgeAt`, the same
  // function the mass is built from, so the line IS the rendered edge (G-E). The old
  // contour was built from the unperturbed profile table while the mass carried the
  // perturbation, and disagreed with itself by up to 3.55 px — always drawing the lathe.
  const hemY = (s: -1 | 1) => Y_HEM + 0.032 * s;
  const y0 = hemY(clean) + 0.006;
  const sil: THREE.Vector3[] = [];
  for (let i = 0; i <= 13; i++) {
    const y = y0 + (i / 13) * (Y_SHOULDER - y0);
    sil.push(fp(edgeAt(y, clean) * (1 + (rnd() - 0.5) * 0.03), y));
  }
  // the shoulder line, CORNERED at both ends (H1): the outline arrives within 7° of
  // vertical and leaves within 12° of horizontal — an 81° turn inside 0.15 HU
  sil.push(fp(edgeAt(Y_SHOULDER, clean), Y_SHOULDER + 0.005));
  sil.push(fp(clean * -0.03 + 0.02, Y_SHOULDER + 0.011));
  sil.push(fp(clean * -0.09 + 0.02, Y_SHOULDER + 0.008));
  sil.push(fp(edgeAt(Y_SHOULDER, (-clean) as -1 | 1), Y_SHOULDER + 0.004));
  sil.push(fp(edgeAt(0.95, (-clean) as -1 | 1), 0.95));
  emit(sil, 0.14);
  if (armMark.length) emit(armMark, 0.18);

  // exactly two fold lines — they say "cloth falls" and nothing else. They ride the
  // contrapposto, because a fold that ignores the lean draws a different body.
  for (const [hx, ya, yb] of [
    [-0.048, 0.19, 0.85],
    [0.058, 0.15, 0.8],
  ] as const) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const y = ya + (yb - ya) * t;
      pts.push(fp(hx + leanAt(y) + Math.sin(t * 2.6) * 0.016, y));
    }
    emit(pts, 0.16);
  }

  // ONE jaw contour. One mark turns a ball into a head; two marks is a face, and a face at
  // 10 px is noise. It follows the egg, so it is 0.052 × 0.070 and not a circle.
  const jaw: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (1.22 + (i / 8) * 0.56);
    jaw.push(fp(HEAD_X + Math.cos(a) * 0.052, HEAD_Y + Math.sin(a) * 0.07));
  }
  emit(jaw, 0.2);

  // THE HEM, drawn where the robe actually ends — swept 0.064 u across the figure, which
  // is what turns the old "boot separation line" from a horizontal tick into the top edge
  // of the silhouette break the legs open below it.
  emit(
    [
      fp(edgeAt(Y_HEM, -1) * 0.96, hemY(-1) + 0.004),
      fp(-0.1, 0.084),
      fp(0.0, 0.106),
      fp(0.09, 0.122),
      fp(edgeAt(Y_HEM, 1) * 0.96, hemY(1) + 0.002),
    ],
    0.16,
  );
}

// THE FACE. What shipped was `mix(stoneWarm, timberDark, 0.55)`, and the comment on it —
// "#7E6E52, L 0.450, t2" — was two thirds wrong in a way worth naming, because §11.3 of
// the art bible copied it. The mix does NOT give #7E6E52; byte-lerping those two tokens
// at 0.55 gives **#867056**. Its L IS 0.451, so that number was right and intended. Its
// `triTone` is **0.631**, which is **tier 4** — the tier column had been read off the L
// column again, and the bible's own row inherits both errors (it prints a hex that is not
// on the segment, and a tone of 0.450 that is L, not tone: #7E6E52 itself computes to
// 0.647/t4). Two tiers too dark, exactly as the verifier measured.
//
// Re-solved for the tier the row and §11.3 both ask for — **tier 2** — on the film's own
// lit-skin idiom (mix toward `flameCore`, the same segment `cliffLit`/`rockLit`/`earthLit`
// ride). It is 0.080 clear of both boundaries, so the shader's ±0.03 noise cannot band a
// 10-px head, and it is one tier off EVERY garment in the trio above (t1/t3/t4), which is
// what G6 asks for: a face and a hood that are never one flat graphite field.
export const CAST_STEEL = mixHex(P.steel, P.paper, 0.26); // #C3C9CE · 0.223 · t1 (row 11)
export const humanFace = mixHex(P.stoneWarm, P.flameCore, 0.18); // #B7A68A · 0.380 · t2 · L 0.653
// F13's defect, found again on the OTHER metal when §11.3 was re-derived for this round.
// The shader's tier boundaries are triTone 0.14 / 0.30 / 0.46 / 0.62 (trilayer.ts:379) and
// raw `brass` computes to 0.474 — 0.014 above the t2/t3 boundary, inside the shader's own
// ±0.03 world noise, so a pommel and a shield boss tier-flip across their own faces. This
// lands t3 with 0.078 of clearance on the committed brass → caveDark segment (§4.5).
export const CAST_BRASS = mixHex(P.brass, P.caveDark, 0.14); // #A0843C · 0.538 · t3

// ---- the six materials, cached by token ---------------------------------------------
//
// ONE material per class, ONE merged geometry per class — instancing is banned (the
// trilayer computes its world position from modelMatrix and never reads instanceMatrix,
// so an InstancedMesh samples strokes, page grid and seam from ONE shared world point).
//
// POSTER 8, NOT R7's 3, and this is the half of "kill the pale rim" that is not the
// bake. The rim was never a specular: it is the LIT BIN of the quantizer. At poster 3
// the top bin spans a third of the lit range and everything in it flattens to the same
// bright value, so a lathe under a warm key grows a hard pale strip down its key side
// whatever its albedo does. At poster 8 the same sliver splits across three narrow bins
// and the edge grades instead of jumping.
//
// The cache is keyed by token, so a film that stands six adventurers across two stages
// compiles ONE garment program and holds one material per distinct cloak colour.
// `wear` is a PARAMETER because the two rigs this figure stands under are not the same
// light. The mock route runs the hero rig (hemi 0.8) and 0.30 of drybrush reads there as
// a rim on a hem. The film runs hemi 1.45 over the same 2.2 key plus a 5.1-intensity
// fire point light, and the same 0.30 — a straight mix toward PAPER — whitewashes the
// whole garment: measured on the ambush trio at t6.4, three earthy cloaks came back as
// three silver statues with no hue left in them at all. The mock keeps 0.30; the film
// asks for less. Nothing else about the recipe moves.
const garmentMats = new Map<string, THREE.MeshLambertMaterial>();
export function garmentMaterial(color: number, wear = 0.3): THREE.MeshLambertMaterial {
  const key = color + '@' + wear;
  let m = garmentMats.get(key);
  if (!m) {
    // THE POSTER COUNT IS 11, AND IT IS ARITHMETIC, NOT TASTE. Two conditions have to hold
    // at once, and only a narrow band of N satisfies both:
    //
    //   1. THE DARKEST USABLE BIN MUST CLEAR INK. The paint side quantizes encoded
    //      luminance to `triPq = (floor(E·N)+0.5)/N`, so the darkest value a garment can
    //      actually render is the representative of the bin its `floor` lands in. With the
    //      floor at ink + 0.06 = 0.2127, that representative is (floor(0.2127·N)+0.5)/N,
    //      and it has to clear ink (0.1527) by the standard's own 0.05:
    //          N =  8 → 0.1875 (0.035 clear)  FAILS — this IS the shipped 41 % near-ink
    //          N =  9 → 0.1667 (0.014 clear)  FAILS
    //          N = 10 → 0.2500 (0.097 clear)  ok
    //          N = 11 → 0.2273 (0.075 clear)  ok
    //          N = 13 → 0.1923 (0.040 clear)  FAILS — built and measured: 23.7 % near ink
    //          N = 16 → 0.2188 (0.066 clear)  ok
    //   2. FOUR PLATEAUX MUST FIT THE GARMENT'S OWN LIT SPAN. The plateaux are the bins, so
    //      four of them need 3/N of range and no more than the ladder's lit span supplies.
    //      Measured on the trio at S5 t38: N = 10 gave 3/7 and 2/7 rows, N = 13 gave 4/7 and
    //      3/7, N = 16 gave 3/7 and 4/7, N = 11 gave 4/7 and 4/7 with the DM at t44 on 6/7.
    //
    // N = 11 is the only count that passes (1) with margin and measures best on (2). The old
    // comment's argument for 8 over 3 survives intact and is strengthened: a finer grid
    // splits the lit sliver over more bins, so the "pale rim" it was written against grades
    // further still.
    //
    // AND THE FLOOR IS SET, which it never was. `floor` is trilayer's "darkest COMMITTED
    // tier" — the goblin passes his own `unlit` into it (goblin.ts:401) and the cast passed
    // nothing, so a cast garment's shade side was free to fall to the paper's black. That
    // is the other half of the 41 %/68.7 % near-ink measurements: not the albedo, the
    // absence of a bottom. It is set to the garment's own darkest committed stop taken
    // through the key's gain, so the shade side bottoms out on a value that was MIXED for
    // this garment rather than on nothing — and never below ink + 0.06, which is the
    // standard's own "within 0.05 of ink" band plus a stroke of margin.
    const fold = bakeCloth(color);
    const L = ladderFor(color);
    m = createTrilayer({
      color: fold ? 0xffffff : color,
      wear,
      poster: 11,
      // ...and never below ink + 0.06 encoded, which is the gate's own "within 0.05 of
      // ink" band plus a stroke of margin. A garment is cloth, not a hole.
      floor: Math.max(L.stops[0] * KEY_GAIN, ENC_INK + 0.06),
      stroke: { dir: 1.45, sheet: true }, // drape falls
    });
    if (fold) m.map = fold;
    // `paint(fig, { fill })` in a film set has to be able to recolour a garment, and a
    // trilayer cannot be cloned (clone() drops onBeforeCompile and the underdrawing with
    // it). The material carries its own re-tint instead; pencil.ts's paint() calls it.
    // QA handle, the `__film` precedent: which committed token this white-based garment
    // is wearing, so a probe can name the figure it just measured instead of guessing.
    m.userData.token = color;
    m.userData.role = 'tri';
    m.userData.retint = (hex: number) => garmentMaterial(hex, wear);
    garmentMats.set(key, m);
  }
  return m;
}

const kitMats = new Map<string, THREE.Material>();
export function figureMaterial(kind: PartKind, garment = cloakUmber, wear = 1): THREE.Material {
  if (kind === 'garment') return garmentMaterial(garment, 0.3 * wear);
  const key = kind + '@' + wear;
  let m = kitMats.get(key);
  if (!m) {
    m =
      kind === 'face'
        ? // raw `stoneWarm` (L 0.596) against his sage (0.584) is Δ 0.012 and hue does not
          // carry a 10-px head, so the face is authored OFF the skin token — now to L 0.653,
          // Δ 0.069 from the goblin, and tier 2 against a t1/t3/t4 hood (see `humanFace`)
          createTrilayer({ color: humanFace, wear: 0.18 * wear, poster: 3, stroke: { dir: 0.55, sheet: true } })
        : kind === 'linen'
          ? // the cuffs are the film's LEATHER — row 10's own recipe verbatim
            createTrilayer({ color: P.bedroll, wear: 0.25 * wear, poster: 8, stroke: { dir: 0.61, sheet: true } })
          : kind === 'steel'
            ? // F13 · raw `steel` computes to triTone 0.299 — ONE THOUSANDTH off the t1/t2
              // boundary, so a blade and a shield boss tier-flipped across their own faces
              // under the shader's ±0.03 noise. Row 11 files steel at t1; this lands t1
              // with 0.077 of clearance, on the committed `steel → paper` segment.
              createTrilayer({ color: CAST_STEEL, wear: 0.2 * wear, poster: 8, stroke: { dir: 0.55, sheet: true } })
            : kind === 'brass'
              ? createTrilayer({ color: CAST_BRASS, wear: 0.2 * wear, poster: 8, stroke: { dir: 0.55, sheet: true } })
              : createTrilayer({ color: P.timberDark, wear: 0.2 * wear, stroke: { dir: 1.15, sheet: true } });
    kitMats.set(key, m);
  }
  return m;
}
