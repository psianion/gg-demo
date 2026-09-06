import * as THREE from 'three';
import * as P from '../palette.ts';
import {
  buildGroundCard,
  buildIncidentCard,
  mergeRocks,
  rockMaterial,
  silhouette,
} from '../mock/groundKit.ts';
import {
  StrokeBag,
  buildLeaf,
  crownMaterial,
  kseed,
  merged,
  newStand,
  oakStand,
  pineStand,
  setView,
  shrubClumps,
  trunkGeom,
  trunkMaterial,
  trunkSideRuns,
  tuftBlades,
  vergeMaterial,
  VIEW_CAM,
  type LeafSpec,
  type TreeSpec,
} from '../mock/foliageKit.ts';
import { contacts } from './kit.ts';

// THE SOIL — S1's camp island and S3's path ribbon island, the flora that stands on the
// second one, and the three standing sheets behind it. Art bible §11.2 rows 1, 2, 5, 6
// and 17; §11.5 carriers C1, C2 and C3, which this file owns.
//
// WHAT THIS FILE STOPPED BEING. It was two `PlaneGeometry` half-planes, 270×300 and
// 210×300, running from behind the camp to x = 320 with an untoned `fillMaterial` on
// them — one enormous smooth Lambert ramp under every shot of the first half, which is
// the single failure signature the world rebuild exists to kill, at the largest possible
// scale. There are no infinite ground planes in this world: it is islands and paper.
//
// THE ONE STRUCTURAL CONSEQUENCE, stated plainly for the other set owners. Those planes
// also ran under S4's theatre (x 44), S5's tavern (x 80, which has its own floor mesh),
// S6's montage row and S7's miniature world (x 110+). Their stages now stand on paper
// until their own modules build their own cards — which is what C1 asks of every one of
// them and what `islandKit.ts`'s own header describes as the migration ("this kit
// replaces world.ts's buildGround planes stage by stage"). Nothing here can build them:
// a card is sized and gapped from the stage that stands on it.
//
// EVERYTHING BELOW CALLS THE KITS. `groundKit` builds the card, the C1 skirt, the C2 rim
// and the C3 painting; `foliageKit` builds the crowns, the trunks, the verge and the
// standing sheets. Where a recipe lived inside a mock module's `buildMock()` it was
// lifted into the kit and both callers now share it, so the `?mock=` route and the film
// cannot drift apart.

// ---- C1 · ONE SKIRT FORMULA, called with two bigger arguments ------------------------
//
//   SKIRT_D = clamp(rz · 0.439, 0.5, 2.60) · k = SKIRT_D / 0.79
//
//   camp    rz 2.60 → SKIRT_D 1.1414 → k 1.4448
//   ribbon  rz 5.20 → SKIRT_D 2.2828 → k 2.8896   (0.439·5.2 = 2.283, under the 2.60 cap)
//
// Both are the hero's own three-band closed lathe with every profile point, every roughen
// amplitude and every mark height multiplied by that one k.
//
// F14 — AND THE COMMENT THAT USED TO SIT HERE WAS WRONG, so it is corrected rather than
// re-stated. It read "at rz 1.8 the same call is byte-identical to what ships". It is not,
// and this file's own table is what catches it: `k = SKIRT_D / 0.79` exactly, and at the
// hero's rz 1.8 that is `0.439·1.8 / 0.79 = 0.7902 / 0.79 = 1.000253`. The formula is
// identical to the hero's to four significant figures and to about a quarter of a
// millimetre on a 1.8-u card — which is the honest claim, and it is enough for C1 — but it
// is not byte-identical, and in a file whose authority is its arithmetic that difference is
// the whole point. `skirtD`'s own comment in `groundKit.ts` rounds the same way and is
// corrected with it. (The code is right; only the claim about it was wrong.)
const CAMP = { x: -2.3, z: 0.2, rx: 3.3, rz: 2.6 };
// x 1.4 … 43.4, z −6.8 … +3.6. Three numbers decide this card and every one of them is
// the run's own geometry rather than a shape:
//
//   · rx 21 · cx 22.4 — the props run x 6…30 and the theatre's own card begins at 44, so the
//     ribbon has to reach 43 and still have soil under z = 0 at x = 3, where he lands. An
//     ellipse tapers, so the length is set by the WEST TIP's half-width, not by the props.
//     F11 — the figures here were wrong and are re-derived from `ribHalf` itself:
//       ribHalf(3) = 5.2·√(1 − (−19.4/21)²) = 5.2 · 0.38285 = **1.991 u**, not 2.21,
//     so against a centre 1.6 u off the path the near rim sits at z +0.391 and his first
//     stride has **0.39 u of verge** beyond it, not 0.6. The conclusion survives the
//     correction — there is still soil under z = 0 at x 3, which is what rx 21 is for, and
//     a shorter card still puts that stride on air — but 0.39 is the margin, and it is
//     thinner than the comment claimed. (The code is right; the arithmetic about it was not.)
//   · cz −1.6 — the path runs at z ≈ 0 because timeline.ts:458 runs him there, so the card
//     is offset off its own path rather than the path off the card.
//   · rz 5.2 — the near rim then sits at z +3.6 at mid-run, **0.8 u** behind the follow
//     camera at z 2.8, and swings forward to z +0.6 at either end. The cut edge crosses the
//     frame's low corner as he enters and as he leaves and is underfoot in between, which
//     is the "sheet edge in every travelling wide" without a wall of skirt under the lens.
const RIB = { x: 22.4, z: -1.6, rx: 21.0, rz: 5.2 };

// The void between them: the camp card ends at x 1.0, the ribbon begins at x 1.4 — 0.4 u of
// bare paper. That is S3-B1, "between places there is paper": the camp has to reach x 1.0
// (he hides behind the hero rock at 0.5, 0.9) and the ribbon has to have soil under the path
// by x 3, so the void between them is as wide as those two facts leave it. He crosses it at
// t16.5–17.0 with the camera anchorless, and lands on island earth at 17.0.

/** The ribbon's own half-width in z at a station x — every tree is placed through it. */
const ribHalf = (x: number) =>
  RIB.rz * Math.sqrt(Math.max(0, 1 - ((x - RIB.x) / RIB.rx) ** 2));

// ---- §3.6 · THE SHOT'S VIEW PLANE ----------------------------------------------------
// Every drawn contour in this file is authored in the lens that sees it, and S3's lens is
// not the hero's. The run's follow camera is `(sx − 3.2, 1.6, 2.8)` looking at
// `(sx, 0.8, 0)` (timeline.ts:458) — 31° round from HERO_AZ and, decisively, on the other
// side of the trees, so the hero basis would push every crown arc INTO its own mass.
const CAM_BACK = 3.2;
const CAM_OUT = 2.8;
const CAM_RUN = Math.hypot(CAM_BACK, CAM_OUT);
const C2_AZ = Math.atan2(-CAM_BACK, -CAM_OUT); // VIEW_R = (−0.658, 0, −0.752)
const C2_ELEV = Math.atan2(1.6 - 0.8, CAM_RUN); // 0.186 rad — the run rides low

// ---- the stand ------------------------------------------------------------------------
// Set scale, not cover scale (row 5): a film tree stands beside a 1.24-u human, so it is
// 2.4–2.9 u, not the hero diorama's 1.45. `f` is the tree's station across the island's
// own half-width, so no tree can ever be authored off its soil — the far verge is a
// function of the card, not a column of hand-typed z values that goes stale the moment the
// card is resized.
type Placed = { x: number; f: number; h: number; r: number; seed: number };
const FAR_OAKS: Placed[] = [
  { x: 6.6, f: 0.74, h: 2.42, r: 0.82, seed: 3 },
  { x: 12.4, f: 0.63, h: 2.88, r: 1.0, seed: 11 },
  { x: 18.9, f: 0.79, h: 2.34, r: 0.86, seed: 6 },
  { x: 25.4, f: 0.6, h: 2.72, r: 0.94, seed: 19 },
  { x: 31.2, f: 0.76, h: 2.46, r: 0.84, seed: 23 },
  { x: 36.4, f: 0.66, h: 2.2, r: 0.78, seed: 31 },
];
// THE PINE'S r IS NOT THE OAK'S, and it is arithmetic rather than taste. `pineStand`
// spaces its three tiers at 0.40 / 0.67 / 0.91 of the tree's HEIGHT — 0.27·h apart — and
// sizes each tier's boughs off its RADIUS: a tier's mass comes out about 0.62·r tall. At
// the mock's own r/h ≈ 0.33 that is 0.27·h of gap against 0.20·h of bough, so every tier
// floats clear of the next and a fir renders as three plates on a bare pole — visible on
// `?mock=foliage` and, at S3's framing, the loudest thing in the frame. r/h ≈ 0.52 closes
// it: the boughs grow to 0.32·h and the tiers touch. Same recipe, honest argument.
const FAR_PINES: Placed[] = [
  { x: 5.0, f: 0.6, h: 2.66, r: 1.38, seed: 2 },
  { x: 9.4, f: 0.82, h: 2.9, r: 1.5, seed: 9 },
  { x: 15.3, f: 0.7, h: 2.5, r: 1.3, seed: 14 },
  { x: 21.6, f: 0.86, h: 2.94, r: 1.53, seed: 27 },
  { x: 23.8, f: 0.58, h: 2.36, r: 1.22, seed: 5 },
  { x: 28.6, f: 0.83, h: 2.78, r: 1.44, seed: 33 },
  { x: 33.7, f: 0.62, h: 2.52, r: 1.31, seed: 41 },
  { x: 38.2, f: 0.72, h: 2.28, r: 1.18, seed: 47 },
];
// The near verge is undergrowth and nothing taller. v1 flanked the frame with a second
// row of trees at z +4.6…+5.8; on an island that z is open paper, and a 2.6-u crown put
// where the dolly rides at z 2.8 fills the lens with bark. The verge does the flanking.
const NEAR_SHRUBS: [number, number][] = [
  [7.2, 0.62], [11.0, 0.5], [16.4, 0.7], [20.2, 0.55],
  [26.0, 0.66], [30.8, 0.52], [35.0, 0.6],
];

// ---- row 17 · the three standing sheets ------------------------------------------------
// C7: the sky is three things and nothing else — the VOID (bare paper), the AIR (the
// chapter token in `rigs.hemi.color`) and the LEAF. These are S3's three leaves, near →
// far, one hue walked along a warm axis at three depths; the wash ladder toward paper IS
// the depth language stated as pigment. The near leaf IS the treeline: a forest seen as a
// mass at distance is not a merged stand of trees, it is one cut sheet at the canopy's
// token, which is why v1's fourteen far-row trees and its band silhouettes are gone.
//
// `faceYaw: 0` — the extrude faces +z and this shot is on the +z side, so the sheet needs
// no turn; the −0.14 rad rake then tips the top away, into the page.
//
// ---- THE RAKE IS A DEPTH BEFORE IT IS A ROTATION, AND THAT SETS EVERY HEIGHT BELOW ----
//
// Row 17's clause has two halves and the previous pass met one: "`rotation.x = −0.14 rad`
// of rake **so the top sits 1.4–3.0 u farther than the bottom**". The rotation alone is
// not the rake; the DEPTH is. A leaf's top runs `h · sin(0.14) = 0.13954·h` behind its
// bottom, so the clause is a height band and nothing else:
//
//        h ≥ 1.4 / 0.13954 = 10.03 u        h ≤ 3.0 / 0.13954 = 21.50 u
//
// The shipped 3.6 / 5.2 / 7.4 gave 0.50 / 0.73 / 1.03 u — a third of the floor, which is
// why the row's own acceptance test ("the rake reads as depth and not as a gradient") was
// failed by arithmetic before anyone looked at it: at 0.5 u of throw across 46 u of sheet
// there is no parallax to read, so all the eye has left is the value ramp, and a value
// ramp with no parallax IS a gradient. 10.4 / 15.2 / 21.4 land 1.45 / 2.12 / 2.99 u.
//
// And a 10–21-u sheet is what a sky is. The old ones were 3.6-u strips sitting BELOW the
// treeline's own crowns (2.2–2.9 u at 8 u out projects higher than a 3.6-u sheet at 16 u
// out) — the film's only sky object was entirely behind the trees.
//
// ---- THE TINTS: COLD, BECAUSE COLD IS NOW REACHABLE (§4.7, revised 2026-09-05) --------
//
// The shipped ladder was `canopyDeep` → `mix(canopyDeep, stoneWarm, .55)` → `mix(canopyDeep,
// skyDawn, .7)`: one hue walked along a WARM axis, i.e. green → olive → tan, which is the
// three-colour recipe for camouflage print and is exactly what the verify round called it.
// It was authored warm on purpose, because under the cover's rig a cold token came back
// brown. S3 and S4 are the **ext-day** family and the ruling put `keyDay #FAF2E6` over the
// film's cool fill: the ext-day gain vector is 0.8040 / 0.8053 / 0.8047, a scalar to
// 0.16 %, so §4.7.5's pre-compensation table is a no-op here and an authored token's own
// R−B survives the light. The ladder is now walked along the COLD axis, all three
// committed tokens on row 17's own tint list, and it is a landscape rather than a print:
//
//   near  `canopyDeep #466F33` w 0.30 — NOT sky. It is the treeline, seen as one mass
//                                (row 17's "also the S1 treeline bank"). tone 0.501, tier 3.
//   mid   `skyDay     #ACCDE6` w 0.15 — **the sky**. S3's own air token (scene book §3-S3
//                                line 707), authored R−B −58. tone 0.189, tier 1.
//   far   `skyDay     #ACCDE6` w 0.64 — the horizon haze, washed to near-paper: the top of
//                                the frame dissolving into the page. tone 0.081, tier 0.
//
// Three tiers, 3 / 1 / 0, no two adjacent in one band: C5 satisfied by the depth ladder
// itself. S4 grades the air to `skyOvercast` at 31.5 and the same three sheets serve it —
// one bake, `material.color` carries the hue, and both chapters are ext-day.
//
// AND THE COLD LIVES IN THE MID SHEET, NOT THE FAR ONE, WHICH IS ARITHMETIC AND NOT TASTE.
// The leaf's albedo is `material.color` MULTIPLIED BY the bake, whose base is `paper`
// (row 17's own rule) — so the page's +7 warm bias multiplies every leaf before the rig
// touches it, and the ext-day VERT gain adds another 1.100 on top. A sheet's on-screen R−B
// therefore only stays negative while its authored linear R/B is under 1/1.173 = 0.853, and
// mixing toward paper walks it straight up:
//
//     mix(skyDay, paper, 0.15) → screen R−B **−25**    mix(skyDay, paper, 0.66) → **+1**
//
// So "≥85 % of paper's luma" and "cold" are in direct tension on the SAME sheet, and row 17
// demands the first of the far leaf. C11 says the same thing from the other end: nothing is
// ever lighter than the page, so the palest sheet in the film is also the most neutral one
// — that is what near-paper MEANS. The answer is not to pre-compensate (§4.7.5: ext-day
// needs none, and #DDE9FC is not a two-token mix, so gate 2 forbids it anyway). It is to
// put the cold on the sheet that has the value headroom for it. The mid sheet is also the
// one that actually fills the frame above the treeline in both S3's run and S4's wide, so
// the cold lands where the sky is looked at.
//
// ---- THE SLOT DEPTHS, solved rather than chosen ----------------------------------------
// A leaf stands over the void BEHIND the island, so its dead-flat bottom projects ABOVE the
// island's own far rim from any camera below it — a ruled horizon line hanging in the sky.
// Solve `(1.6 − y)/(2.8 − z) = 1.6/9.6` for the y at which a base projects exactly onto the
// far rim at S3's follow height: −1.03 · −2.37 · −4.37 at these z. Every base below sits
// under its own line, and each sheet's bottom is additionally covered by the sheet in front
// of it — the three are nested in ANGULAR width (±60° · ±57° · ±53° from the run camera),
// so the near one occludes the mid and the mid occludes the far all the way to the frame
// edge. That nesting is why the far sheet can be the tallest without showing its own hem.
// ---- THE UNDERDRAWING'S OWN SCREEN-SPACE ARITHMETIC (§3.8), WHICH WAS NEVER DONE ------
//
// §3.8 was applied to `bakeSkySheet`'s 85 tex/u and stopped there. The trilayer's TIER
// FIELD is a second bake and it was never measured on this class: `trilayer.ts` lays
// `STROKE_TILE_V` 0.4 u over `ROWS` 15, a **0.02667 u row pitch**, solved once at the
// hero's 161 px/u where it is **4.29 screen px**. These sheets stand 15.8 / 23.8 / 35.8 u
// from the run camera at z 2.8. At the film's own reference frame (canvas 1910 × 889,
// fov 42 vertical) px/u = 889 / (2 · d · tan 21°) = 1158 / d, so:
//
//   near  d 15.8 → 73.3 px/u → row pitch **1.95 px**
//   mid   d 23.8 → 48.7 px/u → row pitch **1.30 px**
//   far   d 35.8 → 32.3 px/u → row pitch **0.86 px**
//
// against §3.7's 2.1-px readable floor for a `form` contour and against §11.6's phone
// weights 2.55 / 1.58 / 0.83. Every sheet is under the floor and the far one is
// sub-pixel — so the rows beat against the pixel grid and the whole top of frame at S3
// entry (t16.79, curtain 1) carried a WOVEN LATTICE, which is two families crossing
// inside one form. It grew into the frame when `h` went 3.6/5.2/7.4 → 10.4/15.2/21.4 to
// satisfy row 17's rake clause; nothing re-measured the underdrawing after it.
//
// FEWER AND BIGGER, ALWAYS. `strokeScale` lays the same tile bigger in world space by
// 161 ÷ (this sheet's px/u), which puts its rows back at the 4.29 px the tile was drawn
// for: 161/73.3 = **2.20**, 161/48.7 = **3.30**, 161/32.3 = **4.99**.
//
// AND THE FAR SHEET IS NOT TIER 0. This note used to say it "is tier 0 and draws no rows
// at all, but it carries its factor too" — the factor was right and the reason was not,
// and the reason was measured from ONE value where the sheet has a whole tile of them.
// Sampling every texel of `bakeSkySheet` through this sheet's OWN `material.color`
// (`#EEF0EF`, the 0.88 wash) and running each product through `trilayer.ts:365–379`:
//
//   triTone **0.0698 … 0.4574** across the tile — tiers **0, 1 AND 2**
//   262 144 texels: t0 230 282 · t1 25 280 · t2 6 582 → **12.2 % of the tile draws**
//
// The 0.0745 the wash was solved on is the tile's BASE, not the tile: the sheet's own
// leaf marks are darker than the ground they sit on and they carry tiers of their own. So
// the sheet does draw, its `strokeScale` is load-bearing rather than precautionary, and
// the 0.0355 of clearance the 0.88 wash bought is clearance for the BASE — which is what
// keeps the sheet's empty field off the page, and is still the right thing to have solved.
const LEAVES: LeafSpec[] = [
  { w: 72, h: 10.4, x: 26, y: -4.9, z: -13.0, tint: P.canopyDeep, wash: 0.3, dir: 0.13, rake: 0.14, yaw: 0.04, lobes: 13, notch: 4, faceYaw: 0, vOff: 4.56, strokeScale: 2.2 },
  { w: 92, h: 15.2, x: 28, y: -6.4, z: -21.0, tint: P.skyDay, wash: 0.15, dir: 0.18, rake: 0.14, yaw: -0.03, lobes: 11, notch: 7, faceYaw: 0, vOff: 1.96, strokeScale: 3.3 },
  // wash 0.88 — AND THE DERIVATION IT REPLACES WAS TAKEN FROM THE WRONG QUANTITY.
  //
  // `trilayer.ts:533` sets `vec3 triAlbedo = diffuseColor.rgb` immediately AFTER
  // `#include <map_fragment>`, so the albedo every tone and tier decision derives from is
  // `material.color × map` — and row 17's map is based on the PAPER token
  // (`foliageKit.ts` `bakeSkySheet`, `ctx.fillStyle = css(P.paper)`). Both the shipped
  // 0.64 and the round before it solved `triTone` from `material.color` ALONE and so
  // measured a colour this surface never has.
  //
  // Re-derived with paper linear (0.93011, 0.91310, 0.87137):
  //   `mix(skyDay, paper, 0.64)` `#DCE7EC` × paper = albedo **`#D5DEDE`**, triTone
  //   **0.1246** → interval **[0.095 … 0.155]**, which CROSSES the tier-0/1 boundary at
  //   0.14 — the far sheet drew tier-1 grain over part of itself and bare paper over the
  //   rest, with the split following `trilayer.ts:377`'s world noise. That is banding, and
  //   it is the same defect the 0.64 amendment was written to close.
  //
  // Moved clear on the SAME two tests, both now read off the albedo:
  //   `mix(skyDay, paper, 0.88)` `#EEF0EF` × paper = albedo **`#E7E7E1`**, triTone
  //   **0.0745** → interval **[0.0445 … 0.1045]**, clear of 0.14 by **0.0355**, which
  //   meets row 15's own ≥ 0.034 precedent; luma **86.7 %** of paper's, over row 17's
  //   85 % floor. 0.88 is where both first hold: at 0.86 the clearance is 0.0310, under
  //   the precedent, and at 0.74 the luma falls to 82.0 %, under the floor.
  { w: 110, h: 21.4, x: 24, y: -6.0, z: -33.0, tint: P.skyDay, wash: 0.88, dir: 0.23, rake: 0.14, yaw: 0.02, lobes: 14, notch: 3, faceYaw: 0, vOff: 0, strokeScale: 5.0 },
];

export function buildGround() {
  const container = new THREE.Group();
  // The film's lens for everything below. Restored to the hero's at the end of the build:
  // the basis is a module-level object in the kit, exactly as `parkSeam` is, and a set
  // module that leaves it pointed at its own shot has moved every other builder's hand.
  // `parkSeam()` is deliberately NOT called here — the film drives `rig.seamX` as S3's
  // frontier at t20.53 and parking it at 1e6 would delete the film's one seam move.
  setView(C2_AZ, C2_ELEV);
  const bag = new StrokeBag();

  // =====================================================================================
  // S1 · THE CAMP ISLAND
  // =====================================================================================
  // C2's unfinished span is authored at 20°→100°: the far-east quadrant, the direction he
  // leaves in. The camp's drawn arc faces the lens for the whole of S1 and S2, and the one
  // edge that was never finished is the one the story walks off. 80° of gap, 280° drawn.
  //
  // F1 — AND NOTHING CAME OUT OF THIS CALL UNTIL NOW. `buildGroundCard` passes the gap to
  // `rimContour` as `(gap[1], gap[0])` because the drawn arc is the gap's complement, and
  // `rimContour` swept `a0 → a1` with no wrap. Every `?mock=` card's gap happens to straddle
  // 0° ([286,74], [268,92], [300,82]) so `a1 > a0` and they all drew. Both of the film's do
  // not — 100 > 20 here, 212 > 150 below — so the loop ran zero times, `mark([])` returned an
  // empty geometry, and C2 was ABSENT rather than partial on the two largest islands in the
  // picture. Fixed in the kit with one wrap so every caller and every future gap is covered
  // (`groundKit.ts:487`); nothing here needed to change, and the two gaps stay where the
  // story put them.
  const camp = buildGroundCard(CAMP.rx, CAMP.rz, { gap: [20, 100] });
  camp.root.position.set(CAMP.x, 0, CAMP.z);
  camp.root.add(
    buildIncidentCard(CAMP.rx, CAMP.rz, {
      // the worn track leaving the camp — v1's `campGround` disc, which was a flat
      // `earthTrack` circle, is this: C3's "an earth-coloured ground is the incident
      // card's earth field widened", painted rather than a second ground token
      spine: (x) => -0.1 + 0.26 * Math.sin((x + 1.2) * 0.42),
      // C9 · the contact ledger, in card-local units, at the hero's 394 texels/unit and
      // rescaled by this card's own. Painted props ground; drawings never do.
      blobs: [
        [2.0, -0.2, 160, 0.26], // the hero rock
        [-0.2, 0.4, 90, 0.28], // the fire ring
        [-1.5, 0.7, 70, 0.24], // the bedroll
        [0.5, 0.95, 50, 0.24], // the pack
        [-2.0, -0.5, 30, 0.22], // the spear
        [-1.2, -1.0, 34, 0.3], // and the three of them
        [-0.5, 0.8, 34, 0.3],
        [0.2, -0.1, 34, 0.3],
      ],
    }),
  );
  container.add(camp.root);

  // =====================================================================================
  // S3 · THE PATH RIBBON ISLAND — the big build, and the hero island is a slice of it
  // =====================================================================================
  // C2's unfinished span is 150°→212°: the WEST end, the end he arrives at. S3-B1 shows
  // the island cut edge first as it slides in at t16.9, and what it shows him is the arc
  // stopping — the way is only finished as far as he has come. 62° of gap, 298° drawn;
  // both spans clear C2's ≥45° floor on an elliptical card. See the F1 note above: this
  // call drew nothing at all until the kit's wrap landed.
  const ribbon = buildGroundCard(RIB.rx, RIB.rz, { gap: [150, 212] });
  ribbon.root.position.set(RIB.x, 0, RIB.z);

  // the C9 ledger for the stand, derived from the same specs the crowns are built from —
  // a blob that is hand-typed beside a tree is a blob that moves when the tree does.
  // Ledger radii are the hero's (oak 58, pine 50) scaled by the prop, which is the mock
  // route's own reading of C9 and lands a film oak at 174 hero-texels.
  const ribBlobs: [number, number, number, number][] = [];
  const stand = newStand();
  kseed(0x2f7ac13);
  for (const t of FAR_OAKS) {
    const spec: TreeSpec = { x: t.x, z: RIB.z - ribHalf(t.x) * t.f, h: t.h, r: t.r, seed: t.seed };
    oakStand(spec, bag, stand);
    ribBlobs.push([spec.x - RIB.x, spec.z - RIB.z, Math.round(58 * 3 * t.r), 0.26]);
  }
  for (const t of FAR_PINES) {
    const spec: TreeSpec = { x: t.x, z: RIB.z - ribHalf(t.x) * t.f, h: t.h, r: t.r, seed: t.seed };
    pineStand(spec, bag, stand);
    ribBlobs.push([spec.x - RIB.x, spec.z - RIB.z, Math.round(50 * 3 * t.r), 0.26]);
  }

  // ONE STUMP beside the run — row 7, timber. v1 built it from `blobs(STUMP)` under
  // `sketch()`, which is the pencil vocabulary, and grounded it with `contact()`, which
  // builds a nine-stroke hatch at pencil.ts:493 and is retired film-wide by C9. It is now
  // a short fat trunk on the bark tile with the class's own two side contours, and it
  // grounds the way everything else does: a painted blob in the island's albedo.
  const STUMP_X = 19.0;
  const STUMP_Z = RIB.z - ribHalf(STUMP_X) * 0.42;
  stand.trunks.push(trunkGeom(0.3, 0.42, 0.62, STUMP_X, 0, STUMP_Z));
  for (const run of trunkSideRuns(STUMP_X, STUMP_Z, 0.44, 0.34, 0.02, 0.6)) bag.add(run, 'form', 'paint');
  ribBlobs.push([STUMP_X - RIB.x, STUMP_Z - RIB.z, 120, 0.26]);

  // C9 · THE PROPS `sets/pathProps.ts` STANDS ON THIS CARD, and until now they floated.
  // `contact()` retired with the hatch it builds at `pencil.ts:493`, but nothing took the
  // grounding over, so the chest at x 18, the two coins spilled at its feet and the three
  // toadstools at x 26 all hovered from t16.9 to t38. C9 says where the blob lives — "a
  // painted blob in the island's own albedo, which grounds it on both sides of the curtain
  // for free" — and this is that island's albedo. The radii come from `sets/kit.ts`'s
  // exported ledger rather than being typed here, so a prop and its shadow cannot drift.
  //
  // THE TWO SPILLED COINS GET NO BLOB OF THEIR OWN HERE, and that is §3.8 rather than an
  // omission. This card is 2·rx = 42 u across at 1024², i.e. **24.38 texels/unit** — the
  // coarsest incident card in the film, and 1024 is already gate 5's ceiling. A coin is a
  // 0.08-u disc, so its honest ledger radius (16, = 0.04 u) paints **0.99 texels** here,
  // five times under §3.8's 5-texel floor: measured on the card's own canvas the coin
  // centre read L 0.546, identical to L at +2r — nothing was there. The chest's blob is
  // now 1.5× the prop's own footprint half-diagonal (0.533 u, 13.0 texels), so it reaches
  // x 17.47 … 18.53 around its centre at 18 and covers both coins at 17.64 and 18.34.
  // One blob that reads, instead of three of which two do not.
  ribBlobs.push(
    ...contacts([
      ['chest', 18 - RIB.x, 0 - RIB.z],
      ['mushroom', 25.85 - RIB.x, -1.15 - RIB.z],
      ['mushroom', 26.1 - RIB.x, -1.28 - RIB.z],
      ['mushroom', 26.25 - RIB.x, -1.1 - RIB.z],
    ]),
  );

  // the near verge — undergrowth clumps, and the grass that gathers at their feet
  const shrubSpecs: [number, number, number][] = NEAR_SHRUBS.map(([x, f]) => [
    x,
    RIB.z + ribHalf(x) * f,
    0.24 + ((x * 7) % 5) * 0.018,
  ]);
  const tuftSpots = shrubClumps(shrubSpecs, bag, stand);
  for (const [x, z] of shrubSpecs) ribBlobs.push([x - RIB.x, z - RIB.z, 52, 0.22]);

  ribbon.root.add(
    buildIncidentCard(RIB.rx, RIB.rz, {
      // 1024², not 512². F13 — the figures were wrong; the decision was not. The card is
      // `2·rx` = **42 u** across, not 39, so row 2's own 512 lands **12.2** texels/unit
      // (not 13.1) — still outside the row's 14–39 band, and further outside it than the
      // comment claimed — and the C9 blobs come out two texels wide. 1024 lands **24.4**
      // (not 26.9), inside the band. Same call, corrected arithmetic.
      size: 1024,
      // ONE gentle S across the whole island, not v1's four wiggles: at 42 u a path that
      // turns every eight units is a snake, and the camera follows this for thirteen
      // seconds. F12 — the offset was wrong: the spine is CARD-LOCAL and the card sits at
      // `RIB.z = −1.6`, so `z_world = spine(x) − 1.6`, not −2.4. With `spine` running
      // 1.6 ± 0.42 over the card's own x ∈ [−21, 21], the path wanders **z −0.42 … +0.42**
      // (not −0.37 … +0.34), centred on z = 0 — which is where `timeline.ts:458` runs him,
      // so he still runs down the middle of it. The code was already right; the two
      // numbers describing it were not, and −2.4 would have put the whole path a unit off
      // his line if anyone had trusted it.
      spine: (x) => 1.6 + 0.42 * Math.sin((x + 6) * 0.16),
      blobs: ribBlobs,
    }),
  );
  container.add(ribbon.root);

  // ---- the stand's four merged meshes — one BufferGeometry per class per island -------
  // Gate 4: never an InstancedMesh. `trilayer.ts` computes vTriWorld from modelMatrix and
  // never from instanceMatrix, so an instanced stand would sample the strokes, the page
  // grid and the seam from ONE shared world position and fourteen trees would carry one
  // tree's paint.
  const forestFrontGroup = new THREE.Group();
  kseed(0x51d09a7);
  for (const [i, [x, z]] of tuftSpots.entries()) stand.verge.push(...tuftBlades(x, z, i));
  const oakMesh = new THREE.Mesh(merged(stand.oak), crownMaterial(0.5, P.canopy));
  const pineMesh = new THREE.Mesh(merged(stand.pine), crownMaterial(0.62, P.needle));
  const trunkMesh = new THREE.Mesh(merged(stand.trunks), trunkMaterial());
  const vergeMesh = new THREE.Mesh(merged(stand.verge), vergeMaterial());
  for (const m of [oakMesh, pineMesh, trunkMesh, vergeMesh]) {
    m.castShadow = true;
    m.receiveShadow = true;
    forestFrontGroup.add(m);
  }
  container.add(forestFrontGroup);

  // ---- the tufts the run's last beat reveals ------------------------------------------
  // timeline.ts:526 opens these at t29.1, and a reveal needs something with a place to
  // open out of, so these seven stay separate objects while the verge above is merged.
  // They share the verge material, so seven objects are seven draws of one state.
  // FEWER, BIGGER (§3.7–3.8): v1 drew each tuft as two 0.13-u polylines at `'faint'`
  // crossed at 1.05 rad — 10 screen px of grey ghost, and, more seriously, TWO STROKE
  // RUNS CROSSING AT AN ANGLE INSIDE ONE FORM, which is the hard gate. They are geometry
  // now, four 0.34–0.48-u blades apiece, on the class's own undergrowth token.
  // AND THEY STAND AT THE SHRUBS, not out on open soil. Pass 1 put them along the near
  // verge on their own and every one read as a white spiked star on bare ground — the
  // kit's own rule, written for the mock and just as true here: "grass gathers AT the
  // shrub and at the trees' feet, never scattered across open paper; a lone tuft on bare
  // page is a stray mark". Each one now sits half a metre off a shrub it belongs to.
  //
  // SCALE 1 — F15, AND ONE CLASS SHIPS AT ONE SIZE. These seven stood at 1.75 while the
  // merged verge tufts half a metre away (line 438, `tuftBlades(x, z, i)` at the default
  // scale) stood at 1.0, so `undergrowth` shipped at two sizes on the same island: the
  // seven revealed tufts were 75 % taller than the ones already growing beside them, and
  // the reveal read as a different plant arriving rather than as this one opening.
  //
  // 1.0 IS THE ONE THAT SURVIVES, and it is the screen-space arithmetic that says so
  // rather than the count. At 1.0 a blade is 0.34–0.48 u long by 0.064 u across, which at
  // the film's 77 px/unit wide framing is **26–37 px tall and 4.9 px wide** — over §3.7's
  // 2.1 px floor by 2.3×, and over §3.8's ≥5-texel/≈2-px width law. The 1.75 that shipped
  // was argued from "0.058 u across = 2.2 px", and that figure is simply wrong: 0.058 u at
  // 77 px/u is 4.5 px. The defect it was written to fix did not exist, and the correction
  // reintroduced a worse one. Fewer numbers, and the surviving one is the class's own.
  const tufts: THREE.Group[] = [];
  kseed(0x77b1e05);
  for (const [i, [sx, sz]] of shrubSpecs.entries()) {
    const tuft = new THREE.Group();
    tuft.position.set(sx - 0.52, 0, sz - 0.34);
    const mesh = new THREE.Mesh(merged(tuftBlades(0, 0, i)), vergeMaterial());
    mesh.castShadow = true;
    tuft.add(mesh);
    container.add(tuft);
    tufts.push(tuft);
  }

  // ---- the path's loose stone — row 3 --------------------------------------------------
  // Four pebbles, ONE merged geometry, one material, and the drawn half is the mass's own
  // silhouette from this lens rather than `inkEdges`, which on a 320-face lobe draws the
  // polyhedron instead of the rock. v1's "double-edged rock" was a scaled duplicate with
  // its fill hidden — a second solid to pay for a second contour; the silhouette pass is
  // the contour, and it costs no geometry at all.
  const pebbleSpecs = [
    { r: 0.14, seed: 5, pos: [7.4, 0.06, -0.95] as [number, number, number] },
    { r: 0.11, seed: 12, pos: [16.8, 0.05, 0.72] as [number, number, number] },
    { r: 0.16, seed: 21, pos: [26.9, 0.07, -1.05] as [number, number, number] },
    { r: 0.12, seed: 30, pos: [33.4, 0.05, 0.66] as [number, number, number] },
  ];
  const pebbleGeom = mergeRocks(pebbleSpecs.map((s) => ({ ...s })));
  const pebbles = new THREE.Mesh(pebbleGeom, rockMaterial(P.rockFace));
  pebbles.castShadow = true;
  container.add(pebbles, silhouette(pebbleGeom, VIEW_CAM, P.graphiteDark, 0.03));

  // =====================================================================================
  // THE SKY — row 17, three leaves, and the film's only sky object
  // =====================================================================================
  // v1 put five extruded cauliflower plates and three flat streak lozenges up here in
  // `skyVellum`, drifting along x off `gobT`, plus three band silhouettes standing in for
  // a far treeline. All of it retires: a bank is a mass and a mass in this drawing is
  // density, not a filled outline, and a backdrop in a slot does not slide sideways
  // through the frame. `pathClouds` comes back EMPTY, so Film.tsx's drift loop walks
  // nothing rather than needing a change in a file this one does not own.
  //
  // ROW 17'S THREE ACCEPTANCE CHECKS, answered where they are built rather than in a
  // report: (1) the rake reads as DEPTH — the heights above put 1.45 / 2.12 / 2.99 u of
  // throw behind each top, inside the row's 1.4–3.0 band, where the shipped sheets had
  // 0.50 / 0.73 / 1.03 and could only ever read as a gradient; (2) the far leaf is
  // **86.7 %** of paper's own luma and its triTone interval **[0.0445 … 0.1045]** clears
  // the tier-0 boundary at 0.14 by 0.0355 with the ±0.03 world noise included, so it
  // cannot band — BOTH figures measured on the ALBEDO (`material.color × map`, the
  // quantity `trilayer.ts:533` actually reads) and not on `material.color`, which is what
  // the two numbers that used to stand here (86.2 % and [0.047 … 0.107]) were taken from.
  // They disagreed with each other and with the token; the derivation now lives once, on
  // the `LEAVES` table above, and this line quotes it; (3) the Λ
  // brace is on the back of every sheet at `back = −0.03` in the `flat` register, invisible
  // head-on and legible off-axis, and its collar tie now BUTTS the legs instead of lapping
  // past them (`foliageKit.ts`, F16) so the one required mark is not also a crossing.
  const skyGroup = new THREE.Group();
  kseed(0x33bc6d1);
  for (const L of LEAVES) skyGroup.add(buildLeaf(L, bag));
  container.add(skyGroup);

  // A pale sun disc used to hang at (26, 8.6, −22) with ten `rayGold` strokes fanned off
  // it. `rays()` is row 23's own retirement — rays were v1's word for light — and both
  // the fan and the disc are gone with it; `P.snow` no longer appears in this file, so
  // nothing here waits on the snow rebuild.

  container.add(bag.build());
  setView(); // hand the hero's lens back

  return {
    container,
    tufts,
    // The stand you can walk up to.
    pathForestFront: forestFrontGroup,
    // And the forest as a mass at distance, which row 17 says is not a stand of trees at
    // all but the near standing sheet. v1's fourteen reduced-contrast mid-row trees are
    // this group now.
    pathForestMid: skyGroup,
    // Retired with the cloud plates — see the note above.
    pathClouds: [] as THREE.Group[],
  };
}
