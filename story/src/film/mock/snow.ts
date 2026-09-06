// MOCK — Snow. Art bible §11.2 row 15, standing on row 4's landform.
//
//   ?mock=snow · &rig=prep · &zoom=1..6
//
// THE ROW: RESERVED PAPER. You paint AROUND it. `sheet: true`, `dir 0.18` — THE SKY
// FAMILY, because snow is weather, not stone. The body is tier 0, below the shader's own
// 0.14 mark threshold, so the underdrawing under it is blank; the drape is shaped by a
// lee in three committed values and by one drawn windward ridge at 'form'.
//
// TWO PLACES THIS FILE DEPARTS FROM THE ROW AS WRITTEN, both argued at their site and
// both amendments the row should carry:
//   · POSTER 0, which is row 15's own number — but reached the long way round, and the
//     2026-09-05 amendment to poster 6 is superseded. The reason poster 0 works here now
//     is that the bake carries five committed values; when it carried one, it did not.
//     See `snowMaterial`.
//   · A DRAWN SILHOUETTE, which row 15 does not mention and C2 requires. See the F5
//     block at the bottom of `buildMock`.
//
// WHAT THE ROCK CLASS IS DOING IN A SNOW FILE (F10, and the premise this file used to
// state wrongly). The massif is NOT built from the rock class — it is seven closed lathe
// bands on row 4's landform arithmetic, on their own banded albedo. Row 3 appears here
// exactly once and by its own sanction: `mergeRocks` / `rockMaterial` build the sixteen-
// chunk TALUS at the foot, which is row 3's "S4 talus" line. The other two names that
// grep as rock — `ROCK_LIT`, `ROCK_SHADE` — are groundKit PIGMENTS (mixes of `rockFace`)
// serving as two of the seven band courses. They are colour names, not a class.
//
// ============ ROUND 4 · THE KEY WENT NEUTRAL, AND THE PREMISE CHANGED ================
//
// Everything below this block that argues about §4.7 was solved for a light that no longer
// exists. On 2026-09-05 the client ruled the KEY COLOUR A PER-CHAPTER-FAMILY PROPERTY and a
// rig agent landed it: the massif is S4, which is the ext-day family, whose key is `keyDay
// #FAF2E6` and whose gain on an up-facing surface is a SCALAR — G = 0.8040/0.8053/0.8047,
// flat to 0.16%. Three things followed, and they are the whole of this round's colour work:
//
//   · the §4.7.4 inverse that produced `SNOW #DCE7FF` is void. Under a neutral gain that
//     inverse is just a blue token and it rendered as one — a lavender hood, walked at the
//     massif-filling framing before the first edit of this round.
//   · the wall moved. The brightest neutral-or-cool up-facing value was #C0C0C0 (luma 192)
//     and is now #E8E8E8 (232). Last round's brightest pixel was #BFC1C7 at 193 — the wall
//     itself, and correctly reported as such. This round's drape p95 is 210 and its
//     brightest committed value lands 217.
//   · §4.7.5 now reads "no token needs pre-compensation on the ext-day family. Not one."
//     So every token in this file is authored at the value it is MEANT to read at.
//
// AND THE SURFACE WAS RE-AUTHORED, NOT RE-TINTED, because the client's second rejection was
// not about colour: "sucks, if there is snow it should feel right with the same brushwork
// and feel". It was right. The drape carried FIVE marks on its whole lit half and the rest
// of it was one flat field being carved into polygons by the poster quantizer. What changed:
//
//   V2  the poster comes off and the value moves into the bake — the ground card's own
//       recipe. All three of the verifier's candidates were walked. See `snowMaterial`.
//   V2  the shell's SHADING normals are smoothed and its positions are not, so the drape
//       keeps its wandering silhouette and stops faceting its light. See `buildShell`.
//   —   the bake paints the WHOLE turn in five committed values, in loaded-brush runs
//       28–80 texels across, where it used to paint one azimuth. See `bakeSnowDrape`.
//   —   the snow's stand-off is a function of AZIMUTH AND HEIGHT, so the wind scours the
//       ribs bare and the rock breaks through near the snowline. A constant stand-off is
//       the geometry of a GARMENT, and that is what "white boulders" and "a hood" were both
//       describing. See `clear`.
//   V1  all seven band pigments re-derived by §11.3, not just course 7. See `TINTS`.
//   V5  LEE_EDGE moved clear of the 0.14 mark threshold. See the token block.
//   V4  the silhouette step measured against the shipped cliff's own radii, and answered
//       with the measurement rather than with a bigger number. See the V4 block.
//   —   SEG 72 → 120, because the snowline's 21-cycle term was aliasing into sawteeth.
//
// The mock route grew `&family=extDay` this round (`MockSheet.tsx`) because this surface
// cannot be judged under the cover's warm key, which is what the route defaults to and what
// the last two rounds were graded under.
//
// ==================== FIX ROUND 3 · THE VERIFIER'S TEN, AND WHAT MOVED ================
//
// The verdict on the previous build was "a smooth caramel cone wearing a cream hood with
// a grey paper cut-out glued to it", and every word of it was earned. What follows is
// what each finding turned out to BE, because in three of the ten cases the stated
// symptom and the actual cause were different objects.
//
//  F3 · THE COOL TOKEN DID NOT SURVIVE THE KEY, and it never could have. The rig is a
//    per-channel gain (§4.7) and it is warm before the token is read. Fixed by authoring
//    the §4.7.4 inverse — see the token block below. Measured on screen in the linear mix
//    domain: the drape's mean R−B is now −0.0215 linear / −5.8 sRGB with 76.4% of it
//    neutral-or-cool, its brightest pixel went from #D8C8B0 (+40) to #C0C1C5 (−5), and
//    the fraction of it that is both light and near-neutral from 0.08% to 42.8%.
//
//  F1 · NO BRUSHWORK ON THE DRAPE. Row 17's doctrine, applied: poster 6, floor 0.24. The
//    shell's screen luminance now occupies FOUR of the six bins at 7.5 / 27.7 / 34.2 /
//    30.7 percent — four decided values on an object that had one gradient.
//
//  F2 · THE LEE WAS A CUT-OUT: 5,471 texels of exactly one colour. It is now 14,650
//    texels in THREE committed tokens (6.04% / 2.41% / 2.73% of the canvas), every mark a
//    loaded-brush run with a tapered end at each end, and each value broken by runs of its
//    neighbour. Measured off the live `CanvasTexture`.
//
//  F4 · THE ONE AUTHORED LINE WAS BROKEN because it was sampled on the IDEAL shell while
//    the shell is displaced by roughen() by a comparable amount, and because its descent
//    stopped at k = 0.38 by construction. It is now sampled on the BUILT vertices and both
//    arms run to the hem.
//
//  F6 + F7 · THE PROFILE WAS A CONE, and the cause was two numbers, not one. The
//    non-monotonic clause had been reduced to 0.021-unit lips — but the deeper fault was
//    that `roughen` was running at the shipped cliff's ABSOLUTE amplitudes on a massif
//    with a quarter of the cliff's radius, so every authored ledge was inside the noise.
//    Both are at the BANDS table. The plan-form went with them: ±10.8% of a 1.25-u radius
//    is ±15 screen px, against the cliff's ±47 on its own.
//
//  F5 · NO INK ROUND ITS EDGE. Ruled, and done twice: C2's foot arc with a 78° unfinished
//    span, AND the massif's own outline, which is the half the Prep rig insists on —
//    under the curtain the snow is reserved paper, so without it the top 45% of this
//    landform is a white hole in the page with one caret floating over it.
//
//  F8 · `stoneWarm` sat 0.0054 under a tier boundary against ±0.03 of world noise. Course
//    7 is `earth` now, 0.060 clear of any boundary, and lighter, which lifts the foot.
//
//  WHAT THE PREVIOUS ROUND GOT RIGHT AND IS UNTOUCHED: the seven closed lathe bands on
//  their own banded albedo; the lee addressed in the surface's own (azimuth, height) UV;
//  the non-ring snowline, still swinging 0.604 u with 38 local extrema round the turn; the
//  tier-0 body; and the one-direction rule on both canvases.
//
// STRUCTURE COMES FROM ROW 4, NOT ROW 3. Snow is not a mass class and must not borrow
// rock's mass recipe. The landform recipe in this film is STRATA: seven closed lathe
// bands, 72 seg, every band `DoubleSide`, radii NON-MONOTONIC so the silhouette steps into
// ledges (a monotonic taper is a cone; a mountain has ledges), each band overlapping the
// next by ≥8% of its own height, roughen rougher downward.
//
// SNOW HAS NO SNOWLINE — and reserved paper only reads as snow when there is something
// painted around it to reserve it FROM. A mountain that is white top to bottom is a white
// mountain. So the massif is STRATA BELOW and SNOW ABOVE, and the boundary is not a ring:
// `snowLine(φ)` DIPS DOWN THE GULLIES and RIDES UP THE RIDGES, because that is where snow
// lies. Band 4 — the course the snowline crosses — is `cliffShade` t4, the darkest token
// on the mountain, so the one edge the eye uses to decide "snow" instead of "pale rock" is
// a full four-tier step. That edge is the whole read.
//
//   HOW FAR IT MAY SWING is its own measured number. The first build gave it ±0.53 of a
//   3.05-unit peak, on the argument that wind scours a ridge bare — and since the
//   plan-form's biggest spur is phased to the LIT limb this shot sees, the snowline rode
//   to 68% of the height there and dropped to 36% opposite. The lit half came back bare
//   rock and the shaded half came back white, which is the read exactly inverted. ±0.20
//   plus two fast terms keeps the line ragged at the scale of a couloir without letting it
//   swing a whole face.
//
// VALUE, MEASURED AGAINST §11.3's ARITHMETIC, NOT ASSUMED. Every pigment on this object
// was run through triT = (enc(lum(albedo)) − 0.1526)/0.8072, triTone = 1 − triT.
//
// **SUPERSEDED — EVERY HEX IN THE TABLE BELOW HAS MOVED.** The drape's four tokens were the
// now-void §4.7.4 inverse (see ROUND 4 at the top of this file), and five of the seven rock
// courses were re-derived by V1 — three of them because they did not clear a tier boundary
// by the ±0.03 of world noise trilayer.ts:377 adds. The live tables are the token block and
// `TINTS`. This one is kept because the METHOD is still the method, and because the
// sequence rule underneath it still governs the object:
//   SNOW      #DCE7FF  0.072  t0   ← bare paper under the curtain
//   LEE_EDGE  #D2DFF5  0.115  t0   LEE_PALE #C0CCE1 0.208 t1   LEE_MID #9EAABD 0.375 t2
//   rockLit   #B4B39D  0.333  t2   rockShade  #5F5A4C  0.749  t4
//   rockFace  #878B7A  0.529  t3   cliffShade #746450  0.692  t4
//   cliffLit  #C4B599  0.309  t2   stoneShelf #8F795E  0.589  t3
//   earth     #C2A97E  0.360  t2
//   → the course sequence down the massif is 2·4·3·4·2·3·2: no two adjacent courses share
//     a tier, which is the one rule that stops a drawn landform reading as one flat
//     graphite wall (C5). The drape's own three values run 0·1·2 for the same reason.
//
// PREP = PERFORMANCE MINUS THE SHADOW STROKES, and the snow's whole drawn state is three
// things: BLANK PAPER at tier 0, the lee at tiers 1–2, and the two authored lines. That is
// not a coincidence of tuning; it is what the drape's albedo computes to.
//
// SCREEN-SPACE FIRST (Appendix step 1). The route solves ~66 px/world-unit at zoom 1 on a
// 1440-wide canvas and ~111 at zoom 2 on this massif. The lee canvas is 512 wide over ONE
// turn of a cone whose perimeter runs ~3.6 u at the snowline down to nothing at the
// summit, so it runs ~140 tex/u at the hem and finer above — which is why a lee run is
// authored 11–15 texels across (0.08–0.11 u, 9–12 screen px at zoom 2) and 2.2× that down
// the fall line: at the first build's 26–42 texels a single dab spanned 30° of azimuth and
// the mass could only be a swatch. The strata tile repeats twice round the massif's 7.9-u
// foot = 130 tex/u, so its 40–86-texel bedding runs are 0.31–0.66 u = 34–73 screen px at
// zoom 2 — bigger on screen than the shipped cliff's own, which is the correction that
// took the rock from "smooth caramel" to brushwork.
import * as THREE from "three";
import * as P from "../palette.ts";
import { roughen } from "../pencil.ts";
import { createTrilayer } from "../stages/trilayer.ts";
import {
  CLIFF_SHADE,
  css,
  mark,
  mergeRocks,
  mixHex,
  pageShadow,
  rgba,
  rockMaterial,
  silhouette,
  strokeSet,
} from "./groundKit.ts";
import { hand, parkSeam, VIEW_CAM, VIEW_R } from "./plankKit.ts";
const rnd = hand(0x63c7);
// The drape bake's own stream. `rnd` is shared with the beds bake, the talus, the crest
// and both contours, so a mark added to the drape canvas would re-roll every one of
// them; drawing the new body passes from a second seed means this round could change the
// snow's paint WITHOUT moving a single authored line. Same discipline as pencil.ts's
// global prng, one scope down.
const bRnd = hand(0x5c0d);

// ---- THE TOKENS, RE-AUTHORED AGAINST THE NEUTRAL KEY (§4.7, revised 2026-09-05) -----
//
// EVERY NUMBER IN THE BLOCK THIS REPLACES WAS SOLVED FOR A LIGHT THAT NO LONGER EXISTS.
// The massif is S4, which is the **ext-day** chapter family, and the client has ruled the
// key neutral per family: `keyDay #FAF2E6` makes G(UP) = (0.8040, 0.8053, 0.8047) — a
// SCALAR to 0.16%. Three consequences, and they undo the last round item for item:
//
//  1. THE PRE-COMPENSATION IS GONE. §4.7.5: "no token needs pre-compensation on the
//     ext-day family. Not one." `SNOW #DCE7FF` was the §4.7.4 inverse of a neutral under
//     a 1.222-warm gain; under a 1.000 gain that inverse is just a blue token, and it
//     rendered as one — a lavender hood, walked at zoom 3 before this edit. Every token
//     below is authored at the value it is MEANT to read at, and lands there.
//  2. THE WALL MOVED. The up-facing neutral ceiling was `#C0C0C0` (luma 192) and is now
//     `#E8E8E8` (232) — 15 luma off the page instead of 53. Last round's brightest pixel
//     was #BFC1C7 at luma 193, which was the arithmetic wall and not a choice.
//  3. THE COLD CAN GO WHERE COLD BELONGS. A neutral gain means an authored hue survives
//     the light exactly, so the body no longer has to spend its whole blue budget buying
//     back neutrality. Sunlit snow takes the sun's colour and shaded snow takes the
//     SKY's — so the body is barely cool and the lee is frankly blue, which is both the
//     physics and the way gouache snow has always been mixed.
//
// Every one is a §4.5 blend of committed tokens, and LEE_PALE is a committed token
// outright: `skyDay` is the air of this very chapter, and a snow shadow IS a piece of
// sky lying on a hill. That is also why this surface's stroke family is `dir 0.18`.
//
//   token      recipe                          hex      tone    tier  clr    on screen (UP)
//   SNOW_SUN   mix(snow, skyDay, 0.06)         #EEF0EC  0.0289   0   0.111  #D8DAD6 L217  +2
//   SNOW       mix(snow, skyDay, 0.26)         #DFE8EA  0.0721   0   0.068  #CAD1D4 L208 −11
//   LEE_EDGE   mix(snow, skyDay, 0.42)         #D5E2E9  0.1059   0   0.034  #C1CDD4 L203 −19
//   LEE_PALE   skyDay                          #ACCDE6  0.2208   1   0.079  #9CBAD1 L181 −53
//   LEE_MID    mix(skyDay, stoneCool, 0.60)    #96AAC0  0.3812   2   0.079  #889AAE L152 −38
//
// FIVE, not four, and the fifth is the one the client's second rejection was about. A
// snow field is not one value with a shadow on it — it is a WHITE that is broken all the
// way across by the light that struck it, and it has always been painted that way. The
// whole ladder lies on ONE segment, `snow → skyDay → stoneCool`, so five values and one
// hue family: sun-struck white, cool white, the taper, half shade, committed shade.
//
// `clr` is the distance to the nearest tier boundary (§11.3's 0.14 / 0.30 / 0.46 / 0.62)
// and trilayer.ts:377 adds ±0.03 of world noise to the tone, so anything under 0.03
// flickers in and out of its own tier across its own surface. **V5 was exactly that**:
// LEE_EDGE sat at 0.1149, 0.0251 under the mark threshold, so the palest lee value
// flickered in and out of being MARKED AT ALL. It is 0.1059 now — 0.0341 clear.
//
// SNOW stays tier 0 (0.0576, 0.082 under the threshold) — reserved paper survives under
// the curtain, which is the whole of row 15. LEE_EDGE is tier 0 too: it is the taper, and
// a taper that draws is a second silhouette. The two drawn lee values are tiers 1 and 2,
// so the object carries tiers 0 · 1 · 2 — C5's three separated tiers.
//
// THE VALUE LADDER, which §4.6 wants at ≥25 luma between tier medians: the three real
// tiers land at screen luma 212 / 181 / 152 — steps of 31 and 29. LEE_EDGE at 203 sits
// between the first two and is a TRANSITION, not a tier, which is what a taper is.
//
// The R−B ladder is −6 / −19 / −53 / −38 and the turn at the end is not an error: the
// core of a shadow sees less sky than its half-shade does, so the bluest value on a snow
// field is the MID shade and the deepest is on its way back to neutral-dark. Painted
// snow has always been mixed that way.
//
// RETIRED HERE: `snowShadow = mix(stoneCool, paper, 0.35)`. §4.7.3 still measures it at
// R−B −16 under ext-day, which is respectable — but it is one value where this surface
// needs three, and that was F2's whole finding.
const SNOW_SUN = mixHex(P.snow, P.skyDay, 0.06); // #EEF0EC · tone 0.0289 · t0 · clr 0.111
const SNOW = mixHex(P.snow, P.skyDay, 0.26); //    #DFE8EA · tone 0.0721 · t0 · clr 0.068
const LEE_EDGE = mixHex(P.snow, P.skyDay, 0.42); // #D5E2E9 · tone 0.1059 · t0 · clr 0.034
const LEE_PALE = P.skyDay; //                      #ACCDE6 · tone 0.2208 · t1 · clr 0.079
const LEE_MID = mixHex(P.skyDay, P.stoneCool, 0.6); // #96AAC0 · tone 0.3812 · t2 · clr 0.079
// The massif's plan is an ellipse, not a circle — the island's own proportion.
const MRX = 1.1;

const MRZ = 0.9;

const TOP = 3.05;

// ---- (a) ROW 4'S LANDFORM ARITHMETIC -------------------------------------------------
// r top · r bot · y top · y bot · tint block · roughen amp.
//
// HOW BIG A LEDGE IS, measured against the shipped row-4 cliff rather than guessed.
// Three walks went into this number and the two failures are worth naming:
//
//   · steps of 0.10–0.18 between bands came back a WEDDING CAKE — a band's top rim
//     stands that far proud of the wall above it, which opens an ANNULAR HOLE you look
//     straight down into at this shot's 33° elevation, and `DoubleSide` then hands you
//     the lit inside of the next cone as a bright flat shelf. Three of them stacked.
//   · alternating FLARE / VERTICAL / UNDERCUT courses to force the silhouette to step
//     rebuilt the same cake by a different door: a flare that follows a vertical collar
//     reads as a shelf whatever its actual slope.
//
// ================= F6 + F7 · THE THIRD WALK, AND THE ONE IT OVERTURNS ================
//
// The paragraph above concluded "so this profile is a straight 63° cone", sampled by
// seven bands whose between-band steps are 0.021 — and the verifier's word for the
// result was CONE, correctly. Two things were wrong with that reading of `?mock=strata`.
//
//  (1) THE STEP IS NOT BETWEEN BANDS, IT IS INSIDE THEM. The shipped cliff's radii are
//      1.010→1.006 · 0.958→0.968 · 0.984→0.992 · 0.930→0.944 · 0.972→0.980 · 0.886→0.900
//      at the boundaries — yes, ~1% and invisible, which is what the note above measured.
//      But WITHIN a band it runs 1.006→0.958 (in), 0.968→0.984 (OUT), 0.992→0.930 (in),
//      0.944→0.972 (OUT), 0.980→0.886 (in), 0.900→1.160 (OUT, and hard). The wall's own
//      SLOPE reverses at every boundary. That is what row 4's non-monotonic clause is
//      for, that is what "steps plainly at the band 6/7 foot and overhangs at band 3/4"
//      is describing, and this file had reduced it to a 0.021 lip on a monotonic cone.
//
//  (2) THE ROUGHEN AMPLITUDE WAS SWAMPING THE FORM. Both files write
//      `roughen(lathe, amp / RX)` on a unit lathe scaled by RX afterwards, so `amp` is
//      in WORLD units. The cliff is 5.4 u in radius and runs 0.05 → 0.18, which is
//      **0.9% → 3.3% of its own radius**. This massif is 1.2 u in radius and was running
//      the same 0.05 → 0.18 — **4% → 15%**, four to five times the row's figure. Every
//      authored ledge was inside the noise. That single number is most of why a landform
//      built to row 4's arithmetic still rendered as a smooth blob.
//
// So: the same PERCENTAGES the shipped cliff uses (0.9% → 3.3% of radius, rougher
// downward) — 0.018 at the summit to 0.055 at the foot — and the slope alternation put
// back. Four near-vertical WALL courses at 6°–9° off plumb alternating with three
// APRONS at 30°–33°, plus the talus spread. Silhouette slopes down the massif:
//
//   0.42 · 0.10 · 0.59 · 0.12 · 0.65 · 0.10 · 0.58   (dr/dy)
//
// against the old profile's uniform 0.397. At zoom 3's ~140 px/u a wall runs 8 px of
// radius over 50 px of height and the apron below it runs 49 over 76: a staircase, not
// a taper. Each boundary also leaves the lower band's rim 0.008–0.024 proud of the wall
// under it — which is what F7's four boundary arcs now have to trace.
// Overlaps are 10%–17% of the band's own height throughout (row 4 wants ≥8%), and at
// every boundary the LOWER band's top radius sits proud of the upper band's bottom, so
// roughen cannot open a hole through the wall.
//
// The tokens run COOL AND PALE at the top and warm into earth at the foot, which is
// what a massif does and what makes the top of it read as alpine rock rather than as
// the same chocolate cliff at a different size. Every one is a committed token.
//
// ============ V1 · THE TIER-BOUNDARY SWEEP, ALL SEVEN COURSES THIS TIME ==============
//
// F8 moved course 7 off `stoneWarm` (triTone 0.4546, 0.0054 under the 0.46 boundary) and
// stopped there. That was one course out of seven, and the verifier was right that the
// identical flip was still sitting on the others. Re-derived by §11.3's own arithmetic —
// `triT = (enc(lum(albedo)) − 0.1526)/0.8072`, `triTone = 1 − triT` — against the ±0.03
// of world noise trilayer.ts:377 adds. `clr` is the distance to the nearest boundary:
//
//   course                as shipped   tone     clr        →  now                tone    clr
//   1 summit crag         ROCK_LIT     0.3327   0.0327        mix(rockFace,       0.3820  0.0780
//                                                             flameCore, 0.30)
//   2 upper wall          ROCK_SHADE   0.7488   0.1288        unchanged
//   3 upper apron         rockFace     0.5291   0.0691        unchanged
//   4 SNOWLINE            CLIFF_SHADE  0.6921   0.0721        unchanged
//   5 bright apron        CLIFF_LIT    0.3094   0.0094  ****  mix(stoneWarm,      0.2435  0.0565
//                                                             flameCore, 0.50)
//   6 shelf wall          STONE_SHELF  0.5886   0.0314   **   mix(stoneWarm,      0.5521  0.0679
//                                                             timberDark, 0.30)
//   7 talus foot          earth        0.3598   0.0598        unchanged
//
// **** COURSE 5 WAS THE REAL ONE and the verifier named it exactly: `cliffLit` sits
// 0.0094 off the tier 2/3 boundary — a THIRD of F8's own margin — on the largest lit
// apron on the mountain and the course immediately under the snowline. That is the worst
// place on this object for a tier to flicker across its own surface, because it is the
// field the eye reads the snowline AGAINST. Replaced by the same recipe pulled two
// committed steps lighter (`cliffLit` IS `mix(stoneWarm, flameCore, 0.35)`; this is 0.50)
// — which lands it in tier 1 at 0.0565 clear, and 13 luma brighter, so the apron under
// the snow is now the bright course the profile always wanted it to be.
//
// ** COURSE 6 cleared 0.03 by 0.0014, which is a number and not a margin. Same recipe
// (`stoneShelf` is `mix(stoneWarm, timberDark, 0.42)`), one step lighter at 0.30.
//
// COURSE 1 cleared by 0.0027. It is the smallest surface on the massif and mostly under
// the drape, so this one is housekeeping — but `mix(rockFace, flameCore, 0.30)` is both a
// wider margin and a darker crag, and a dark horn standing out of white is what a summit
// is, so it pays for itself twice.
//
// EVERY COURSE NOW CLEARS BY ≥ 0.0565, i.e. by more than the whole noise amplitude.
// (this array is in the BAKE's block order, which is not the course order — `BANDS`
//  column 5 is the index each course reads)
const TINTS = [
  mixHex(P.rockFace, P.flameCore, 0.3), //   c1 #A9A994 t2 clr 0.0780 — ROCK_LIT, darker
  P.rockFace, //                             c2 #878B7A t3 clr 0.0691 — was ROCK_SHADE t4
  mixHex(P.stoneWarm, P.flameCore, 0.2), //  c3 #B9A88C t2 clr 0.0702 — was rockFace t3
  mixHex(P.stoneWarm, P.flameCore, 0.5), //  c5 #D0C3A6 t1 clr 0.0565 — CLIFF_LIT, lighter
  mixHex(P.stoneWarm, P.timberDark, 0.3), // c6 #968166 t3 clr 0.0679 — STONE_SHELF, lighter
  CLIFF_SHADE, //                            c4 #746450 t4 clr 0.0721 — unchanged
  P.earth, //                                c7 #C2A97E t2 clr 0.0598 — unchanged
];

// tier down the mountain: 2 · 4 · 3 · 4 · 1 · 3 · 2 — no two adjacent courses alike, and
// the course the snowline crosses is still the darkest one there is (t4 against the
// drape's t0 is a four-tier step, and that edge is the whole read).
// ==================== V4 · THE SILHOUETTE EVENT, MEASURED =============================
//
// THE FINDING: "the between-band radial steps are still 1.5–7.9% of band radius, inside
// the range the previous round was told was too small. Either make the steps large enough
// to be the silhouette event the boundary arcs trace, or state with a measurement why the
// current magnitude is enough. Compare directly against ?mock=strata, whose cliff steps
// plainly at the band 6/7 foot."
//
// STATED WITH THE MEASUREMENT, because the comparison overturns the premise. The quantity
// the finding measures is not the quantity the cliff's read comes from.
//
// THE MASSIF'S BOUNDARY LIPS — the lower band's top rim standing proud of the wall above:
//
//   bnd   y      upper r   lower r   lip      % of r   px @z1   @dist 6.6   @dist 4.6
//   1/2   2.68   0.181     0.193     0.0111   5.8%     0.5      1.3         1.9
//   2/3   2.26   0.241     0.264     0.0234   8.9%     1.1      2.8         4.0
//   3/4   1.78   0.577     0.600     0.0226   3.8%     1.0      2.7         3.8
//   4/5   1.34   0.658     0.682     0.0244   3.6%     1.1      2.9         4.2
//   5/6   0.88   1.013     1.040     0.0267   2.6%     1.2      3.1         4.5
//   6/7   0.36   1.099     1.122     0.0233   2.1%     1.1      2.8         4.0
//
// THE SHIPPED CLIFF'S, computed off row 4's own radii at CLIFF_RX 5.4:
//
//   1/2  −0.259 u  (−5.0%)   ·  2/3  +0.086 u  (+1.6%)   ·  3/4  −0.335 u  (−6.7%)
//   4/5  +0.151 u  (+2.9%)   ·  5/6  −0.508 u  (−10.6%)  ·  6/7   0.000 u  ( 0.0%)
//
// READ THOSE TWO TABLES AGAINST EACH OTHER. The cliff's boundary steps are 1.6% to 10.6%
// of radius — the SAME ORDER as this massif's 2.1% to 8.9% — and four of the six run the
// other way, INWARD, so the cliff's wall re-enters at a boundary where this one stands
// proud. There is no sense in which the shipped cliff's boundary lip is the larger.
//
// AND THE CLIFF DOES NOT STEP AT ITS BOUNDARIES AT ALL. Its within-band slopes are
// dr/dy 0.005 · 0.012 · 0.009 · 0.016 · 0.009 · 0.016 · 0.303, so the tangent kink at each
// boundary is 0.9° · −0.1° · 0.4° · −0.4° · 0.4° — nothing — and then 15.9° at 6/7. THAT
// is the step "at the band 6/7 foot": one band whose radius grows 29% over its own height
// (0.900 → 1.160), a flare, not a lip. The finding named the right frame and the wrong
// quantity in it.
//
// THIS MASSIF HAS BOTH, AND MORE OF THE ONE THAT MATTERS. Its within-band slopes alternate
// 0.419 · 0.104 · 0.593 · 0.120 · 0.654 · 0.103 · 0.583 — walls at 5.9°–6.8° off plumb
// against aprons at 22.7°–33.2° — so the tangent kink at EVERY boundary is
// −16.8° · +24.7° · −23.8° · +26.3° · −27.3° · +24.4°. Against the cliff's 0.4°, that is
// sixty times the silhouette event at six boundaries instead of one. Course 7 also carries
// the cliff's own flare: 1.02 → 1.23, +21% of its own radius, dr/dy 0.583 against course
// 6's 0.103 — the same 24° kink at the same place in the profile.
//
// SO THE ANSWER IS NO, THE LIPS DO NOT NEED TO GROW, and there is a reason beyond parity
// not to grow them: this file already has the walk that says what happens. Lips of
// 0.10–0.18 came back a wedding cake, because at this shot's 33° elevation a lip that size
// opens an annular hole you look straight down into and `DoubleSide` hands you the lit
// inside of the next cone as a bright flat shelf. The lip's job here is not to BE the
// event; it is to give the four boundary arcs a real edge to sit on, and at the framings
// actually walked it is 2.7–4.5 px, which clears pencil.ts's 2 px stroke floor.
//
// WHAT IS TRUE IN THE FINDING: at the route's own zoom-1 framing the lips are 0.5–1.2 px,
// so at that scale the arcs are drawing a line the geometry cannot support. They still read
// — they are drawn ink on a paint boundary, not a highlight on a step — but nobody should
// claim the lip is visible there. The event at zoom 1 is the slope kink, and it is: the
// massif's stepped profile is legible at 46 px/u in frame snow-01.

// r top · r bot · y top · y bot · tint block · roughen amp (world units, 0.9%→3.3% of R)
const BANDS: [number, number, number, number, number, number][] = [
  [0.01, 0.19, 3.05, 2.62, 0, 0.03], //  1 summit crag  #A9A994 t2 · APRON  0.42
  [0.175, 0.225, 2.68, 2.2, 1, 0.04], // 2 upper wall   rockFace t3 · WALL   0.10
  [0.24, 0.56, 2.26, 1.72, 2, 0.05], //  3 upper apron   rockFace   t3 · APRON  0.59
  [0.545, 0.605, 1.78, 1.28, 5, 0.06], //4 SNOWLINE     cliffShade t4 · WALL 0.12
  [0.62, 0.96, 1.34, 0.82, 3, 0.07], //  5 bright apron #D0C3A6 t1 · APRON 0.65
  [0.945, 1.005, 0.88, 0.3, 4, 0.08], // 6 shelf wall  #968166 t3 · WALL   0.10
  [1.02, 1.23, 0.36, 0.0, 6, 0.085], // 7 talus foot   earth   t2 · SPREAD 0.58
];

// …and the amps landed at 2.4% → 6.8% of radius, not the cliff's 0.9% → 3.3%, which is
// the one place this file deliberately outruns the row it is built on. The reason is
// arithmetic and it is the cone: the cliff's wall is near-plumb, so the Lambert term is
// almost constant across its visible face and the bake's own value break is the only
// variation there is. A 63° cone swings its normal through the whole key ramp across one
// visible face, and at the cliff's percentages the roughen displacement disappeared under
// that ramp. Doubling it puts the geometric tiering row 3 relies on ("tiering comes from
// roughen under the key, not from the shader") back where the eye can see it. The ledges
// survive it untouched because `roughenBand` restores both boundary rings onto the shared
// `crumble` afterwards — only a band's INTERIOR moves.
/** The rock's own radius at height `y`, in unit-radius space. At an overlap the LIP
 *  wins (the larger of the two), because that is the surface the snow lies on. */
function rockR(y: number): number {
  let r = 0;
  for (const [rTop, rBot, yTop, yBot] of BANDS) {
    if (y <= yTop && y >= yBot)
      r = Math.max(r, rTop + ((rBot - rTop) * (yTop - y)) / (yTop - yBot));
  }
  return r || (y > TOP ? 0.01 : BANDS[6][1]);
}

// THE PLAN-FORM, and the ridge/gully signal the snowline rides. One function, shared by
// every band, the shell and every mark: sharing it means no two rings can cross, so the
// authored overlaps survive and the wall stays closed.
//
// All three harmonics are phased to peak together at φ = 0.55 rad. That is not decor.
// The visible limbs of this ellipse under this lens solve to φ = 0.26 and 3.40, and the
// key at (4, 6, 3) sits at 0.64 — so 0.55 is the one azimuth that is on the LIT face,
// clear of the limb, and turned toward the lens: the mountain's biggest spur is the
// arête the shot actually sees, and that is where the one drawn windward line goes. (It
// was authored at 0.27 first, dead on the limb, and the drawn line came back floating in
// the air beside the peak because a contour pushed toward the lens off a limb leaves the
// silhouette.) The deep lee at 3.79 — opposite the key — lands at ridge ≈ −0.65, a
// gully, so the snowline dips furthest on exactly the face the shadow falls on.
const ridge = (phi: number) =>
  0.55 * Math.sin(3 * phi - 0.079) +
  0.29 * Math.sin(5 * phi - 1.179) +
  0.19 * Math.sin(8 * phi - 2.829);

// HOW DEEP THE FLUTES ARE, and this is the second half of F6. The cliff carries ±16% of
// plan deviation on a 5.4-u radius — ±0.86 u, which at ?mock=strata's 55 px/u is ±47
// screen px on a 600-px form. This massif was carrying ±10.8% on a 1.25-u radius: ±0.135
// u, ±15 px on a 300-px form — a quarter of the cliff's read. Put beside it, that is
// most of why the massif looked TURNED and the cliff does not. 0.22 takes it to ±0.28 u
// (±31 px), and unlike the cliff's it has somewhere to go: a mountain's plan is spurs
// and gullies, and `ridge` is already the function the snowline rides, so deepening it
// deepens the couloirs and the snow that lies in them by the same number.
const lobe = (phi: number) => 1 + 0.22 * ridge(phi);

const LOBE_MAX = 1.227;

/** Boundary-ring crumble — the SAME function of azimuth for both rings at a boundary,
 *  so neighbours move together and the authored overlap is never opened. */
const crumble = (phi: number) =>
  Math.sin(phi * 4.1 + 0.9) * 0.55 +
  Math.sin(phi * 7.3 - 2.1) * 0.3 +
  Math.sin(phi * 13.7 + 1.4) * 0.15;

// ---- (b) THE SNOWLINE ----------------------------------------------------------------
// NOT A RING. Snow is scoured off ridges and drifts into gullies, so the line rides up
// where `ridge` is high and dips down where it is low, plus two fast terms so the edge
// is ragged at the scale of a couloir rather than a sine.
const SNOW_Y = 1.62;

const SNOW_A = 0.2;

const snowLine = (phi: number) =>
  SNOW_Y +
  SNOW_A * ridge(phi) +
  0.095 * Math.sin(phi * 13 + 2.2) +
  0.055 * Math.sin(phi * 21 - 1.1);

/** The roughen amplitude of whichever rock course sits at `y`. */
function bandAmp(y: number): number {
  for (const b of BANDS) if (y <= b[2] && y >= b[3]) return b[5];
  return 0.05;
}

/**
 * How far the snow stands off the rock — AND THIS IS THE NUMBER THE WALK TURNED ON.
 *
 * A flat 0.045–0.125 clearance was authored first, from the snow's own thickness. It
 * put the whole cap INSIDE the rock: `roughen` displaces a band by up to ±amp along its
 * normal, and the summit courses' amps (0.05, 0.07) are the same size as that
 * clearance, so the rock broke through over most of the upper cone and the massif came
 * back brown to the summit with one white wedge on its flank. Clearance is therefore
 * TIED TO THE COURSE'S OWN AMPLITUDE and always beats it: 0.05 of snow depth on top of
 * whatever the rock under this height is allowed to move.
 */
// …AND THE WIND TAKES IT OFF THE RIBS. This is the change the third walk turned on, and
// it is the answer to "white boulders" and "a hood" both, which were two descriptions of
// the same fault: a drape at a CONSTANT stand-off is a garment, because a garment is
// exactly the object that keeps a constant stand-off from what it covers. Snow is not
// that. Wind scours a windward rib bare and dumps what it takes into the couloir beside
// it, so the stand-off is a function of AZIMUTH — and the mountain's own `ridge` is
// already that function.
//
// So the clearance is reduced on a spur and increased in a gully, hard enough that on the
// strongest ribs it goes NEGATIVE and the rock breaks out THROUGH the snow field. That is
// the single strongest cue there is for snow on a mountain, and nothing else in this file
// was providing it: the summit crag poked out at the apex and everything below the
// snowline was an unbroken white blanket.
//
// `^1.7` on the positive half keeps the scour to the few real spurs instead of thinning
// the whole windward side, and the gully half is only a third as strong — snow fills a
// couloir deep but it does not pile a metre proud of one.
// The scour has MORE ribs than the plan-form does. `ridge` runs harmonics 3, 5 and 8, so
// on its own it bares three or four broad flanks and the massif reads as a faceted cone
// wearing a cap. An alpine face is scoured at the scale of a buttress — ten or twelve of
// them round a peak this size — so the scour is `ridge` plus an 11-cycle term of its own,
// deliberately NOT phased to it: where the two agree the rib is bare to the snowline, and
// where they fight the snow only thins.
const RIB = 0.14;
// IT TWISTS WITH HEIGHT, and that is the difference between a mountain and a pleated
// skirt. A scour that is a function of azimuth ALONE is a set of straight flutes that all
// converge on the apex, which is the geometry of drapery and was read as drapery in every
// walk. The third term carries , so a rib wanders sideways as it climbs and the
// convergence never resolves into a fan.
const scour = (phi: number, y: number) =>
  0.44 * ridge(phi) + 0.42 * Math.sin(phi * 11 - 1.05) + 0.34 * Math.sin(phi * 7 + 2.6 * y);
const clear = (phi: number, y: number) => {
  const rg = scour(phi, y);
  // …AND IT ONLY WORKS NEAR THE SNOWLINE. Walked with the scour running the full height of
  // the drape and the PREP rig threw it out in one frame: row 15's cap is reserved paper,
  // so every patch of rock the wind bared came back as a graphite smudge INSIDE the blank
  // shape, and the cap stopped being one white form. That is the read the verifier said
  // was the one thing still working, and it is not for sale. So the scour fades out over
  // the first 0.7 u above the local snowline — which is also where it belongs physically:
  // a summit dome holds its drift, a face bares out where it steepens.
  const y0 = snowLine(phi);
  const k = Math.max(0, 1 - Math.max(0, y - y0) / 0.7);
  const band = k * k * (3 - 2 * k);
  // …and the rock may only stand 0.045 u proud of the snow, whatever the arithmetic says.
  // Wider than that and a rib stops being a rib and becomes a hole in a sheet — walked,
  // and the hole reads as a tear because the rock behind it is in its own shade.
  const cut = band * (rg > 0 ? RIB * Math.pow(rg, 2.2) : (RIB / 3) * rg);
  return 0.05 + bandAmp(y) / MRX - Math.min(cut, 0.045 + bandAmp(y) / MRX);
};

// ---- bakeSnowDrape ---------------------------------------------------------------
// (was `bakeSnowLee` until this round, and the rename is the change: this canvas used to
//  be one flat fill with a shadow wedge stuck on one azimuth of it, and it is now the
//  drape’s whole painted surface. The value on this object comes from HERE, not from the
//  poster quantizer — see `snowMaterial`.)
// 512 × 256, UNIQUE (not tiling in v), addressed by the shell's own u = azimuth and
// v = height. u wraps; v clamps; flipY off, so canvas row 0 is v = 0 is the snowline.
//
// THE BASE IS `snow` ITSELF, not white — so `material.color` is 0xffffff and every
// texel on this canvas is a committed token at its own measured tier. That is the whole
// difference from the last round, which multiplied a white base toward a neutral grey
// and could not produce a cool hue at all.
//
// ONE DIRECTION ON THIS CANVAS. Every mark runs down the fall line (up-and-down in v).
// Snow shades down its own slope; a second angle here would be the hatch the gate bans,
// arriving through the albedo instead of through the shader.
// The key at (4, 6, 3) puts the terminator at azimuth 127°–307°, and this shot sees the
// massif from 288°, so its visible limbs are 198° and 18°. The DEEP lee (217°) is only
// 19° inside the right-hand limb and would compress to a rim. The shadow mass is
// therefore centred at 250° — the middle of the span that is both shaded AND seen.
const LEE_U = 0.694;

let leeTex: THREE.CanvasTexture | null | undefined;

function bakeSnowDrape(): THREE.CanvasTexture | null {
  if (leeTex !== undefined) return leeTex;
  if (typeof document === "undefined") return (leeTex = null);
  const W = 512;
  const H = 256;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  // THE BASE IS `snow` ITSELF and it is NOT optional: the trilayer discards any fragment
  // whose albedo alpha is under 0.01, so an unpainted (transparent) texel is a HOLE in
  // the surface, not a white one. Leaving this fill out cost four walks — the cap
  // vanished everywhere the lee did not reach and the massif came back bare rock.
  ctx.fillStyle = css(SNOW);
  ctx.fillRect(0, 0, W, H);
  // ---- F2 · IT IS SHADE LYING IN SNOW, NOT A STICKER -------------------------------
  //
  // The last build's lee measured 5,471 texels of EXACTLY ONE COLOUR at alpha 1: one
  // value, one hard jagged silhouette, zero interior. Moving it into the surface's own
  // UV fixed the addressing and nothing else. Three things are wrong with a mass like
  // that and all three are fixed here.
  //
  //   VALUE — it had one. Every other shaded mass in this film carries at least three
  //     (C5). This lee is LEE_EDGE → LEE_PALE → LEE_MID, three committed tokens at
  //     tiers 0 · 1 · 2, nested: the mid inside the pale inside the edge.
  //   ENDS — it had none; the dabs were plain ellipses, so every mark ended in a blunt
  //     round stop and the mass's boundary was the union of sixty-four of them. Every
  //     mark here is a LOADED-BRUSH RUN — `fall()` below — whose width envelope is
  //     sin(πt)^0.62: nothing at both ends, fat a third of the way in. That is the same
  //     envelope pencil.ts's own strokes carry, and it is what makes the mass end in
  //     tapers instead of in a cut edge.
  //   TEXTURE — it had none. Each value is BROKEN by runs of its neighbour laid inside
  //     it, so the shade is scoured rather than filled.
  //
  // ALPHA STAYS 1, and that lesson from the last walk is kept verbatim: sixty-four dabs
  // at 0.3–0.9 COMPOSITE (two overlaps of 0.5 is 0.75, four is 0.94), so alpha is not a
  // value register when marks overlap. Every texel on this canvas is exactly one of four
  // committed tokens at its own measured tier — that is what makes §11.3's arithmetic
  // usable on this surface at all.
  //
  // ONE DIRECTION STILL. Every run below travels in v and only in v (with a ≤0.018-u
  // bow), and on a surface of revolution a constant-u line IS the fall line. So the dab
  // texture follows the form's own slope by construction, and no two marks on this
  // canvas cross — the hatch gate holds through the albedo as well as through the shader.
  /** One loaded-brush run down the fall line, drawn at all three u wraps. */
  const fall = (
    u: number,
    v0: number,
    v1: number,
    wMax: number,
    hex: number,
    bow = 0,
  ) => {
    ctx.fillStyle = css(hex);
    for (const o of [-1, 0, 1]) {
      ctx.beginPath();
      for (let s = 0; s < 20; s++) {
        const t = s / 19;
        const w = wMax * Math.pow(Math.sin(Math.PI * t), 0.62);
        if (w < 0.6) continue;
        ctx.ellipse(
          (u + o + bow * Math.sin(t * Math.PI)) * W,
          (v0 + (v1 - v0) * t) * H,
          w,
          w * 2.2,
          0,
          0,
          6.3,
        );
      }
      ctx.fill();
    }
  };
  // THE WEDGE, three times over. Widest at the hem where the form turns under and away
  // from the key, narrowing to nothing well below the summit where the light gets round
  // the ridge. Each pass is a comb of tapered runs of DIFFERENT lengths, so the mass's
  // upper boundary is a row of points, never a cut.
  const wedge = (
    n: number,
    halfW: number,
    vTop: number,
    wMax: number,
    hex: number,
  ) => {
    for (let i = 0; i < n; i++) {
      const q = (i + 0.5) / n; // across the wedge, 0..1
      const du = (q - 0.5) * 2 * halfW;
      // the runs at the edges of the wedge are the short ones — that is the taper
      const reach = vTop * (0.34 + 0.66 * Math.pow(1 - Math.abs(q - 0.5) * 2, 0.7));
      const v0 = -0.035 + rnd() * 0.045;
      fall(
        LEE_U + du + (rnd() - 0.5) * 0.012,
        v0,
        v0 + reach * (0.7 + rnd() * 0.55),
        wMax * (0.7 + rnd() * 0.6),
        hex,
        (rnd() - 0.5) * 0.03,
      );
    }
  };
  // ======= THE BODY IS PAINTED, AND THAT IS THE CLIENT'S SECOND REJECTION ==========
  //
  // "if there is snow it should feel right with the same brushwork and feel". Walked at
  // the massif-filling framing before this pass: the cap carried FIVE marks on its whole
  // lit half (the drift shoulders below) against a hero island whose every square inch is
  // dabs, and the rest of it was one flat field being carved into polygons by the poster
  // quantizer. There was no brushwork to have a feel.
  //
  // So the drape is painted the whole way round now, in the two white values, before the
  // lee is laid on top of it. `bRnd` is this bake's OWN prng (`hand(0x5c0d)`) so that
  // adding these passes could not shift a single one of the file's authored marks — the
  // talus, the crest, the foot arc and the outline draw the same numbers they drew
  // before this edit, and only the canvas changed.
  //
  // WHY THIS ALSO CLOSES V2. The verifier's three candidates for the poster terracing
  // were: drop poster, smooth the shell's normals, or move the quantization into the
  // bake "where dabs can break the boundaries the way strata's bedding breaks its bands".
  // This is the third, and it is the one that makes the first two safe: a quantizer only
  // finds a facet edge when there is nothing else in the fragment for it to find. With
  // ~150 committed-value runs across the drape the bin boundaries fall INSIDE brush
  // marks, which is exactly what stops a boundary reading as an edge of the form.

  /** A scatter of runs down the fall line across a span of u.
   *
   *  THE BOW IS 0.02 AND IT IS A HARD CEILING, not a taste. `fall`’s bow leans a run off
   *  the fall line, and two runs bowed opposite ways meet at twice that lean — which is
   *  the hatch the gate bans, arriving through the albedo. Walked at 0.13 and 0.08 for the
   *  sweep they give across the cone’s convergence, and measured: where a stroke still
   *  carries 80% of its width, 0.13 leans it 61° and 0.08 leans it 48°. Both are strokes
   *  crossing. 0.02 leans 20° at 80% width, INSIDE the 0.03 the wedge and the gullies have
   *  always used, so this file’s “no two marks on this canvas cross” holds a fortiori. The
   *  cone’s convergence is answered by `scour`’s height term instead, where it belongs. */
  const drift = (
    n: number,
    u0: number,
    span: number,
    vLo: number,
    vHi: number,
    len: number,
    wMax: number,
    hex: number,
  ) => {
    for (let i = 0; i < n; i++) {
      const v0 = vLo + bRnd() * (vHi - vLo);
      fall(
        u0 + bRnd() * span,
        v0,
        v0 + len * (0.55 + bRnd() * 0.9),
        wMax * (0.55 + bRnd() * 0.9),
        hex,
        (bRnd() - 0.5) * 0.02,
      );
    }
  };

  // (1) THE COOL BREAK, everywhere. The field's own value laid back over itself in
  //     longer, thinner runs — a snowfield is drifted, and a drift is a long low ridge
  //     running down the slope. Full turn, so no azimuth is left as flat fill.
  drift(11, 0.0, 1.0, -0.04, 0.5, 0.24, 27, LEE_EDGE);
  // (2) THE SUN-STRUCK BREAK, weighted onto the lit half (the key sits at φ 0.64 =
  //     u 0.102, so the lit span is roughly u 0.85 → 0.40 through the wrap). Wider and
  //     shorter than the cool runs: a struck face is a plane catching light, not a rib.
  drift(13, 0.86, 0.55, -0.03, 0.42, 0.22, 40, SNOW_SUN);
  drift(9, 0.0, 1.0, 0.3, 0.66, 0.2, 34, SNOW_SUN);
  drift(5, 0.0, 1.0, 0.42, 0.78, 0.16, 24, LEE_EDGE); // the summit dome takes paint too
  // (4) DRIFT SHADOWS ON THE LIT HALF. Without these the sunlit side is white-on-white and
  //     the only value on it is the Lambert ramp, which is a gradient and not a decision.
  //     A snowfield in full sun is white with SHARP blue shapes cut into it — the shadow a
  //     drift throws on the snow behind it — and that shape is a 36-luma step, not a tint.
  drift(6, 0.8, 0.62, -0.02, 0.46, 0.17, 26, LEE_PALE);
  drift(4, 0.8, 0.62, 0.1, 0.6, 0.11, 15, LEE_MID); // and the upper cone, all round
  // (3) THE HEM. Snow ends thin, and its last inch is where the rock shows through as a
  //     cooler, dirtier edge — the drybrush stop the row's "you paint AROUND it" implies.
  //     Confined to v < 0.09, so it is the drape's own bottom lip and nothing else.
  drift(13, 0.0, 1.0, -0.05, 0.02, 0.12, 20, LEE_PALE);

  wedge(17, 0.132, 0.4, 15, LEE_EDGE); //  the taper into the body — tier 0, no mark
  wedge(15, 0.098, 0.33, 13, LEE_PALE); // half shade                tier 1
  wedge(11, 0.058, 0.24, 11, LEE_MID); //  the committed shade       tier 2
  // SEVEN LEE GULLIES — the row's own seven marks, climbing out of the mass in the
  // shell's own coordinates. A gully debouches wide at the foot and runs OUT as it
  // climbs, which is what the taper envelope already says; what it adds here is that
  // three of them reach above the LEE_MID mass, so the committed shade has fingers.
  for (let i = 0; i < 7; i++) {
    const u0 = LEE_U - 0.07 + (i / 6) * 0.14 + (rnd() - 0.5) * 0.018;
    const v0 = -0.02 + rnd() * 0.05;
    fall(u0, v0, v0 + 0.17 + rnd() * 0.16, 6.5 + rnd() * 3.5, LEE_MID, 0.018);
  }
  // …AND THE SCOUR. Runs of the LIGHTER neighbour laid back inside each mass: wind
  // strips a lee slope in ribs, and one flat passage of shade is the thing this fix
  // round exists to retire. Nine in the mid, seven in the pale — all in v, all tapered,
  // none of them crossing anything.
  for (let i = 0; i < 9; i++) {
    const v0 = rnd() * 0.11;
    fall(
      LEE_U - 0.05 + rnd() * 0.1,
      v0,
      v0 + 0.06 + rnd() * 0.1,
      2.6 + rnd() * 2.6,
      LEE_PALE,
      (rnd() - 0.5) * 0.02,
    );
  }
  for (let i = 0; i < 7; i++) {
    const v0 = rnd() * 0.2;
    fall(
      LEE_U - 0.1 + rnd() * 0.2,
      v0,
      v0 + 0.07 + rnd() * 0.12,
      2.4 + rnd() * 2.4,
      LEE_EDGE,
      (rnd() - 0.5) * 0.02,
    );
  }
  // TWO DRIFT SHOULDERS on the lit limb — the same brush, one value only, so the body
  // is not a single unbroken field of SNOW either. LEE_EDGE is tier 0, so these add a
  // painted value without adding a drawn mark: reserved paper survives (row 15).
  for (let i = 0; i < 5; i++) {
    const v0 = 0.02 + rnd() * 0.16;
    fall(
      LEE_U + 0.34 + rnd() * 0.3,
      v0,
      v0 + 0.1 + rnd() * 0.14,
      5 + rnd() * 5,
      LEE_EDGE,
      (rnd() - 0.5) * 0.03,
    );
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false; // v = 0 is the snowline, v = 1 the summit — the shell's own sense
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return (leeTex = tex);
}

let snowMat: THREE.MeshLambertMaterial | null = null;

function snowMaterial(): THREE.MeshLambertMaterial {
  if (snowMat) return snowMat;
  const map = bakeSnowDrape();
  // ==== V2 · THE POSTER COMES OFF, AND WHAT IT WAS DOING IS NOW IN THE BAKE ========
  //
  // THE FINDING: under Performance the poster-6 quantizer landed as hard polygonal
  // boundaries following the shell's own facet edges, so the cap terraced like a contour
  // map. The verifier named three candidates and said to walk them by eye rather than
  // pick one on theory. All three were walked, on this object, at this framing:
  //
  //  A · SMOOTH THE SHELL'S NORMALS. Done, and KEPT — see `buildShell`. It is what stops
  //    a boundary tracing the mesh, and it was a real bug on its own. But it does not fix
  //    the terracing: with a smooth normal field the boundaries stop being polygons and
  //    become long smooth CONTOURS instead, which is the same contour-map read drawn more
  //    neatly. Frame snow-05 is that, at poster 10 / floor 0.58.
  //
  //  B · DROP THE POSTER COUNT. Walked at 10, 6 and 4, with floors from 0.50 to 0.58. The
  //    floor genuinely helps — it is what stops a white surface falling to #7B7C7E on its
  //    shade side — but every count has the same failure: the quantizer REPLACES the lit
  //    luminance with the bin centre, so a bin swallows every albedo step narrower than
  //    itself. At poster 6 a bin is 42 luma and the drape's five committed values span 65
  //    — so the whole body's brushwork collapsed into ONE value and survived only as hue.
  //    Measured: at poster 6 / floor 0.50 the drape's p95 falls 210 → 193 and the cap
  //    reads as two big flat fields.
  //
  //  C · MOVE THE QUANTIZATION INTO THE BAKE. Taken, and it is the one that works. Row 17's
  //    doctrine is conditional on its own premise — "a pale flat mass has no geometry to
  //    supply tiers, SO the quantizer must" — and that premise was true of the drape when
  //    its canvas was one fill with a lee stuck on it. It is not true now: the bake carries
  //    five committed values across the whole turn, so the tiers have a supplier and the
  //    quantizer is not it.
  //
  // WHICH LANDS THIS SURFACE ON THE GROUND CARD'S OWN RECIPE, not on a new one. Row 1 is
  // "poster 0; three committed pigment tiers in the bake, ≥25 luma apart", and rows 3 and 4
  // are poster 0 for the same reason. Measured in the albedo, the drape's three tiers are
  // SNOW_SUN 217 · LEE_PALE 181 · LEE_MID 152 — steps of 36 and 29. Row 1's rule, met.
  //
  // AMENDS ROW 15 A SECOND TIME, and the amendment before this one is now wrong: the
  // 2026-09-05 "poster 6, floor 0.24" line was authored against a bake that had one value
  // and against the cover's warm key. Both are gone.
  //
  // THE COST, STATED: with no poster there is no floor either, and the floor was the only
  // thing holding the drape's shade side up. Measured, the drape's p05 goes 149 → 100. That
  // is accepted rather than hidden: under ext-day the SHADE gain is NEUTRAL (§4.7.2,
  // G = 0.1995/0.2004/0.2087), so a white albedo in shade lands #7B7C7E — dark, but grey,
  // not brown. Snow in deep shade being a cold dark grey is true; snow in deep shade being
  // a warm one was the old rig's fault and is gone.
  //
  // wear 0.07. Edge wear is mix(lit, paper, …) and `paper` is +6 warm at R−B under ext-day
  // (§4.7.8, and it is now the LARGEST remaining source of warmth in a lit frame, because
  // the key no longer has one) — a VIEW term, so it hits the massif's whole glancing rim.
  // 0.07 keeps the drybrush channel (D) on the silhouette without repainting the rim in
  // sand.
  //
  // `dir 0.18` and `sheet: true` are the SKY family, not the strata family the rock under
  // it uses — the two halves of this mountain are drawn by two different hands on purpose,
  // which is what "snow is weather, not stone" is. It is also why the drape's shade is
  // authored on `skyDay`: a snow shadow is a piece of this chapter's own air lying on a
  // hill, and under a neutral key that is finally a statement the token can carry.
  snowMat = createTrilayer({
    color: map ? 0xffffff : SNOW,
    wear: 0.07,
    poster: 0,
    floor: 0,
    stroke: { dir: 0.18, sheet: true },
  });
  if (map) snowMat.map = map;
  snowMat.side = THREE.DoubleSide;
  return snowMat;
}

// ---- the strata bake — row 4's bedding, at massif scale -----------------------------
// ponytail: a third near-copy of the same six-block band tile (strata.ts's
// `bakeStrataBand`, groundKit's `bakeSkirtBand`, this). The upgrade is one exported
// `bandTile(tints)` in groundKit — not taken now because strata.ts belongs to another
// author and folding all three needs its file.
let bedTex: THREE.CanvasTexture | null | undefined;

function bakeBeds(): THREE.CanvasTexture | null {
  if (bedTex !== undefined) return bedTex;
  if (typeof document === "undefined") return (bedTex = null);
  const size = 512;
  const block = size / TINTS.length;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.lineCap = "round";
  TINTS.forEach((tint, b) => {
    const y0 = b * block;
    ctx.fillStyle = css(tint);
    ctx.fillRect(0, y0 - 1, size, block + 2);
    const lit = mixHex(tint, P.flameCore, 0.38);
    const dark = mixHex(tint, P.caveDark, 0.3);
    // FIVE bedding partings per block — near-horizontal runs the full width, wrapped,
    // one value step down. Rock is laid in courses and the courses are what a hand
    // draws first. NOTHING ON THIS CANVAS CROSSES: every mark is the bed's own lie.
    for (let p = 0; p < 5; p++) {
      const py = y0 + block * (0.12 + p * 0.19) + (rnd() - 0.5) * block * 0.1;
      ctx.strokeStyle = rgba(dark, 0.34 + rnd() * 0.24);
      ctx.lineWidth = 4 + rnd() * 7;
      for (const ox of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(ox - 4, py);
        for (let x = 0; x <= size; x += 64) {
          ctx.quadraticCurveTo(
            ox + x - 32,
            py + (rnd() - 0.5) * 11,
            ox + x,
            py + (rnd() - 0.5) * 7,
          );
        }
        ctx.stroke();
      }
      // the shipped cliff's one bright mark: a parting catches light on its UNDERSIDE,
      // and it is the thing that makes a bedding plane read as a plane rather than a
      // scratch. Under the middle parting only.
      if (p === 2) {
        ctx.strokeStyle = rgba(lit, 0.42);
        ctx.lineWidth = 5;
        for (const ox of [-size, 0, size]) {
          ctx.beginPath();
          ctx.moveTo(ox - 4, py + 7);
          for (let x = 0; x <= size; x += 64)
            ctx.lineTo(ox + x, py + 7 + (rnd() - 0.5) * 6);
          ctx.stroke();
        }
      }
    }
    for (let d = 0; d < 170; d++) {
      const x = rnd() * size;
      const y = y0 + 4 + rnd() * (block - 8);
      const len = 40 + rnd() * 46;
      const ang = (rnd() - 0.5) * 0.26; // ±15° of the bed, and nothing crosses it
      ctx.strokeStyle = rgba(rnd() < 0.46 ? dark : lit, 0.28 + rnd() * 0.3);
      ctx.lineWidth = 6 + rnd() * 8;
      for (const ox of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(x + ox, y);
        ctx.quadraticCurveTo(
          x + ox + Math.cos(ang) * len * 0.5,
          y + Math.sin(ang) * len * 0.5 + (rnd() - 0.5) * 7,
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
  tex.flipY = false;
  tex.anisotropy = 4;
  return (bedTex = tex);
}

let bedMat: THREE.MeshLambertMaterial | null = null;

function bedMaterial(): THREE.MeshLambertMaterial {
  if (bedMat) return bedMat;
  const map = bakeBeds();
  bedMat = createTrilayer({
    color: map ? 0xffffff : P.stoneWarm,
    wear: 0.18,
    poster: 5,
    stroke: { dir: 0.04, sheet: true }, // laid beds — the strata family
  });
  if (map) bedMat.map = map;
  bedMat.side = THREE.DoubleSide; // the lens sees inside a lathe band at a ledge
  return bedMat;
}

/** Address the tile: `u` repeats twice round the turn, `v` lands inside tint block `b`. */
function bandUV(geom: THREE.BufferGeometry, b: number): void {
  const uv = geom.getAttribute("uv") as THREE.BufferAttribute;
  const inset = 4 / 512;
  const n = TINTS.length;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(
      i,
      uv.getX(i) * 2,
      uv.getY(i) * (1 / n - inset * 2) + b / n + inset,
    );
  }
  uv.needsUpdate = true;
}

/** roughen(), then put the two boundary rings back on the shared crumble so the
 *  authored overlap survives (strata.ts's own lesson, and the same failure mode). */
function roughenBand(
  geom: THREE.LatheGeometry,
  amp: number,
  seed: number,
  points: number,
  h: number,
) {
  const src = (geom.getAttribute("position") as THREE.BufferAttribute).clone();
  roughen(geom, amp / MRX, 2.2, seed);
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const ring = i % points;
    if (ring !== 0 && ring !== points - 1) continue;
    const x = src.getX(i);
    const z = src.getZ(i);
    const c = crumble(Math.atan2(z, x));
    pos.setXYZ(
      i,
      x * (1 + c * 0.02),
      src.getY(i) + c * h * 0.04,
      z * (1 + c * 0.02),
    );
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/** The plan-form, applied to a lathe built in unit-radius space. */
function applyLobe(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geom.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const L = lobe(Math.atan2(z, x));
    pos.setX(i, x * L);
    pos.setZ(i, z * L);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/** The snow shell: a parametric drape whose LOWER EDGE is `snowLine(φ)`. Not a lathe —
 *  a lathe cannot have a wandering hem, and the hem is the whole point. */
// 120, not 72. The snowline carries a 21-cycle term (`snowLine`) and 72 samples give it
// 3.4 per cycle, so the hem was ALIASED into a row of triangles — the jester-collar edge
// the walk kept reading as a cut-out. 120 samples take the fastest term to 5.7 and the
// 13-cycle one to 9.2, and the hem comes back a ragged curve. 4,320 triangles against
// 2,592: nothing at this budget, and it is the cheapest fix on the object.
const SEG = 120;

const ROWS = 18;

/**
 * The snow's radius at azimuth `phi`, height `y`, `t` of the way up its own column.
 * The last fifth of the column TAPERS TO THE APEX, which does two jobs at once: it
 * closes the shell without a special-case ring, and it lets the summit crag break out
 * of the snow — above t ≈ 0.85 the rock's own radius beats the drape, so the peak is a
 * dark horn standing in white instead of a white nipple, which is what a summit is.
 */
const shellR = (phi: number, y: number, t: number) =>
  (rockR(y) + clear(phi, y)) * lobe(phi) * Math.min(1, (1 - t) * 5);

// F4 · THE ROUGHENED VERTICES ARE KEPT, and this is the whole of the broken-line fix.
// The crest was sampled on the IDEAL `shellR`, while the shell it is supposed to lie on
// is displaced by `roughen(0.03/MRX)` — a comparable magnitude — so the line sat on the
// threshold of being swallowed and rendered as two arms stopping in mid-air with a
// detached fleck under one of them, identically in both rigs (which is what said it was
// geometry and not the rig). A mark on a surface has to be sampled ON that surface.
let shellPos: Float32Array | null = null;

function buildShell(): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= SEG; j++) {
    const phi = (j / SEG) * Math.PI * 2;
    const L = lobe(phi);
    const y0 = snowLine(phi);
    for (let s = 0; s <= ROWS; s++) {
      const t = Math.pow(s / ROWS, 0.85);
      let y = y0 + (TOP - y0) * t;
      // row 0 TUCKS INSIDE the rock — snow lies ON the mountain, it is not a lid over
      // it, and the short flare from row 0 to row 1 is the snow's own edge thickness.
      const r =
        s === 0 ? Math.max(0.02, rockR(y) * L - 0.055) : shellR(phi, y, t);
      if (s === 0) y -= 0.05;
      pos.push(Math.cos(phi) * r, y, Math.sin(phi) * r);
      // v is height ALONG THIS COLUMN'S OWN SNOW — 0 at the hem, 1 at the summit. An
      // absolute-height v was tried first and it is wrong for a wandering hem: the
      // snowline swings 1 u, so most columns never sampled the bottom of the canvas
      // and the whole lee was painted below the snow that was supposed to carry it.
      uv.push(j / SEG, s / ROWS);
    }
  }
  const stride = ROWS + 1;
  for (let j = 0; j < SEG; j++) {
    for (let s = 0; s < ROWS; s++) {
      const a = j * stride + s;
      const b = (j + 1) * stride + s;
      // wound so the face normal comes out RADIALLY OUTWARD. The other winding compiles,
      // renders (DoubleSide flips it in the fragment) and then casts a self-shadow over
      // the whole cap, because the shadow pass has no gl_FrontFacing to flip.
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  // a gentle break so the drape is not a turned surface — snow smooths a form, it does
  // not sharpen it, so this is a third of the rock's amplitude. The hem and the apex go
  // back afterwards: the hem must stay tucked and the apex must stay closed.
  const src = (geom.getAttribute("position") as THREE.BufferAttribute).clone();
  roughen(geom, 0.03 / MRX, 3.4, 91);
  const p = geom.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const ring = i % stride;
    if (ring === 0 || ring === ROWS)
      p.setXYZ(i, src.getX(i), src.getY(i), src.getZ(i));
  }
  p.needsUpdate = true;
  geom.computeVertexNormals();

  // ==== V2 · THE SHADING NORMALS ARE SMOOTHED AND THE POSITIONS ARE NOT ==============
  //
  // THE FINDING: under Performance the poster-6 quantizer was landing as hard polygonal
  // boundaries following the shell's own facet edges, so the cap terraced like a contour
  // map. The cause is one line up: `roughen(0.03/MRX)` displaces this 72 × 18 grid by
  // about half a quad's width, and `computeVertexNormals()` then hands back a normal
  // field that swings by ~20° from one vertex to the next. The Lambert term inherits that
  // swing, the quantizer bins the Lambert term, and a bin boundary crossing a noisy ramp
  // traces the mesh. It was never the poster count: at poster 12 the same object terraces
  // twelve times instead of six.
  //
  // The fix is to separate the two jobs the displacement was doing. Its SILHOUETTE job is
  // real and stays — an unroughened drape has a turned, machined rim. Its SHADING job was
  // never wanted: snow smooths a form, it does not facet it. So the positions keep every
  // bit of the displacement and the normals get two Laplacian passes over the grid, which
  // is the same thing as saying the drape is a smooth surface with a wandering edge.
  //
  // Wraps in j (column 0 and column SEG are the same seam column, so they must average
  // together or the seam lights as a crease) and clamps in s. Two passes: one leaves the
  // ramp still visibly stepped at zoom 4, three flattens the drape's own big forms —
  // walked at 1, 2, 3 and 4.
  const nrm = geom.getAttribute("normal") as THREE.BufferAttribute;
  const at = (j: number, s: number) => (((j % SEG) + SEG) % SEG) * stride + s;
  for (let pass = 0; pass < 2; pass++) {
    const src2 = nrm.clone();
    for (let j = 0; j < SEG; j++) {
      for (let s = 0; s <= ROWS; s++) {
        let x = 0;
        let y = 0;
        let z = 0;
        for (const [dj, ds] of [
          [0, 0],
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as [number, number][]) {
          const k = at(j + dj, Math.min(ROWS, Math.max(0, s + ds)));
          x += src2.getX(k);
          y += src2.getY(k);
          z += src2.getZ(k);
        }
        const L = Math.hypot(x, y, z) || 1;
        nrm.setXYZ(at(j, s), x / L, y / L, z / L);
      }
    }
    // the duplicate seam column carries the copy, not its own average
    for (let s = 0; s <= ROWS; s++)
      nrm.setXYZ(SEG * stride + s, nrm.getX(s), nrm.getY(s), nrm.getZ(s));
  }
  nrm.needsUpdate = true;

  shellPos = p.array as Float32Array;
  return geom;
}

/**
 * A world-space point ON THE BUILT SHELL — the roughened vertices, in the mesh's own
 * scaled frame — at azimuth `phi` and `k` of the way up the column (0 = the hem at the
 * snowline, 1 = the summit). Bilinear between the two nearest columns so the mark is a
 * smooth run rather than a staircase of 72 samples, and the same displacement the
 * surface carries, so the line cannot sink under it.
 */
const shellPt = (phi: number, k: number) => {
  const stride = ROWS + 1;
  const g = (((phi / (Math.PI * 2)) % 1) + 1) % 1;
  const jf = g * SEG;
  const j0 = Math.floor(jf);
  const fj = jf - j0;
  const sf = Math.min(1, Math.max(0, k)) * ROWS;
  const s0 = Math.min(ROWS - 1, Math.floor(sf));
  const fs = Math.min(1, sf - s0);
  const at = (j: number, s: number) => (j % (SEG + 1)) * stride + s;
  const out = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const P4 = shellPos!;
  const rd = (i: number, v: THREE.Vector3) =>
    v.set(P4[i * 3], P4[i * 3 + 1], P4[i * 3 + 2]);
  rd(at(j0, s0), out);
  rd(at(j0, s0 + 1), tmp);
  out.lerp(tmp, fs);
  const b = new THREE.Vector3();
  rd(at(j0 + 1, s0), b);
  rd(at(j0 + 1, s0 + 1), tmp);
  b.lerp(tmp, fs);
  out.lerp(b, fj);
  return out.multiply(new THREE.Vector3(MRX, 1, MRZ));
};

/** A world-space point on the ROCK's own lobed, crumbled outline at azimuth `a`. */
const edgePt = (a: number, y: number, out = 1.0) => {
  const c = crumble(a);
  const r = rockR(y) * lobe(a) * (1 + c * 0.02) * out;
  return new THREE.Vector3(Math.cos(a) * r * MRX, y, Math.sin(a) * r * MRZ);
};

export function buildMock(): THREE.Object3D {
  const root = new THREE.Group();
  // it stands on the page like everything else
  const shade = pageShadow(1.27 * MRX * LOBE_MAX, 1.27 * MRZ * LOBE_MAX);
  shade.position.y = 0.012;
  root.add(shade);
  // ---- the massif's rock half — seven closed lathe bands, ONE material -------------
  BANDS.forEach(([rTop, rBot, yTop, yBot, block, amp], i) => {
    // four profile points, not two: roughen() needs interior vertices or a band comes
    // out a straight frustum with a wobbled rim, which is a lampshade
    const pts: THREE.Vector2[] = [];
    for (let s = 0; s <= 5; s++) {
      const t = s / 5;
      pts.push(
        new THREE.Vector2(rTop + (rBot - rTop) * t, yTop + (yBot - yTop) * t),
      );
    }
    const lathe = new THREE.LatheGeometry(pts, 72);
    bandUV(lathe, block);
    const geom = applyLobe(
      roughenBand(lathe, amp, 40 + i, pts.length, yTop - yBot),
    );
    const mesh = new THREE.Mesh(geom, bedMaterial());
    mesh.name = "massif-band-" + (i + 1); // the framebuffer probe masks by name
    mesh.scale.set(MRX, 1, MRZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  });
  // ---- the massif's snow half — reserved paper above a wandering snowline ----------
  const shell = buildShell();
  const shellMesh = new THREE.Mesh(shell, snowMaterial());
  shellMesh.name = "massif-snow-shell";
  shellMesh.scale.set(MRX, 1, MRZ);
  shellMesh.castShadow = true;
  root.add(shellMesh);
  // ---- the talus ------------------------------------------------------------------
  // The foot is rock, and rock at the foot of a landform is a GRADED spill: the farther
  // out, the smaller. Row 3's own class, merged to one draw, drawn by its silhouette.
  // SIXTEEN, NOT TEN, AND SMALLER. Ten chunks at r 0.13–0.37 spaced 0.63 rad apart came
  // back as a necklace of eggs round the foot — at zoom 3 each one is 40–70 screen px,
  // which is a boulder, and evenly spaced is a decoration. The shipped cliff runs
  // fourteen on a size gradient; this runs sixteen at r 0.07–0.22, clustered by the
  // plan-form so the spill is heaviest where an apron actually debouches.
  const scree = mergeRocks(
    Array.from({ length: 16 }, (_, i) => {
      const a = 0.2 + i * 0.41 + rnd() * 0.34;
      const t = rnd() * rnd(); // biased small — a scree sorts itself by size on the way down
      const r = (0.07 + t * 0.15) * (0.8 + 0.4 * (1 + ridge(a)) * 0.5);
      const rr = (1.03 + t * 0.3) * lobe(a);
      return {
        r,
        seed: 80 + i,
        pos: [Math.cos(a) * rr * MRX, r * 0.32, Math.sin(a) * rr * MRZ] as [
          number,
          number,
          number,
        ],
        rotY: a * 1.7,
      };
    }),
  );
  // V1, the eighth pigment on this object: the talus was `ROCK_LIT` — triTone 0.3327,
  // 0.0327 clear, and the SAME tier 2 as the `earth` foot it lies on, so a boulder only
  // read by its own ink. `rockFace` is row 3's own mid token at 0.5291 / 0.0691 clear and
  // a tier apart from the ground under it, so the spill reads as stone on soil.
  const screeMesh = new THREE.Mesh(scree, rockMaterial(P.rockFace));
  screeMesh.name = "massif-talus";
  screeMesh.castShadow = true;
  root.add(screeMesh, silhouette(scree, VIEW_CAM, P.graphiteDark, 0.03));
  // ---- the drawn half -------------------------------------------------------------
  // ONE windward ridge at 'form', and that is the whole of row 15's authored line work.
  // It runs the biggest spur — φ = 0.55, the lit arête this shot sees turned toward it —
  // from the snowline to the summit, on the snow's own surface, pushed toward the lens
  // so it wins the depth test without moving on screen.
  // It is ONE run and it goes OVER THE TOP: up the windward arête at φ = 0.40, across
  // the summit, and a short way down the shoulder at φ = 3.40. Walked at zoom 1 in
  // Prep first as a single climbing line, and at that framing the massif lost its peak
  // outright — reserved paper has no tone, so above the snowline there is nothing on
  // the page at all and one line up one flank reads as a stray hair. A line that
  // crosses the apex IS the peak; it is still one mark, at 'form', which is all the
  // row allows and all it needs.
  // F4 · TWO THINGS WERE BREAKING IT AND BOTH ARE HERE.
  //   · the descent stopped at k = 0.38 — 38% of the way up the column, so the far arm
  //     ended in mid-air 41% above the snowline BY CONSTRUCTION. Both arms now run to
  //     k = 0: the hem, which is the snowline, which is where a crest line ends.
  //   · it was sampled on the ideal `shellR` while the shell is displaced by
  //     roughen(0.03/MRX). `shellPt` now reads the BUILT vertices (above), so the run
  //     lies on the surface it is drawn on and cannot be swallowed by it. The push
  //     toward the lens goes 0.03 → 0.045, one comfortable margin over that same
  //     displacement rather than exactly equal to it.
  const WIND = 0.4;
  const FAR = 3.4; // the limb this shot sees the cap turn on, solved for the 1.10/0.90 plan
  const crest: THREE.Vector3[] = [];
  for (let s = 0; s <= 30; s++) {
    const t = s / 30;
    const over = t > 0.56;
    const phi = (over ? FAR : WIND) + (rnd() - 0.5) * 0.03;
    const k = over ? 1 - (t - 0.56) / 0.44 : t / 0.56;
    crest.push(shellPt(phi, Math.pow(k, 0.92)).addScaledVector(VIEW_CAM, 0.045));
  }
  root.add(mark(crest, P.graphiteDark, "form"));
  // ---- F5 · THE MASSIF ENDS IN A DRAWN ARC (C2), and that is a RULING -------------
  //
  // Row 15's "the underdrawing is literally blank" governs the snow FIELD's interior —
  // there is nothing to draw inside reserved paper — and it says nothing about the
  // landform's edge. C2 in §11.5 does, and it is unconditional: "every finite ground
  // object ends in an OPEN DRAWN ARC, never a closed loop… every one carries one
  // deliberate unfinished span." The massif was the only landform in the film without
  // one, and beside `?mock=strata` — whose plateau lip carries exactly this arc with a
  // 102° gap — that absence is precisely what broke the "same hand" read.
  //
  // Authored the way the cliff's is: at the FOOT, which is this landform's own ground
  // contact (it has no plateau), on band 7's own crumbled outline, ±0.6% radial jitter
  // and no more (C2: the stroke pipeline's own wobble is the hand), proud at 1.035×
  // because at the true radius roughen() swallows it. The unfinished span is
  // 118° → 196°, 78° on the far-left quadrant this shot sees turn away — comfortably
  // over C2's ≥45° minimum, and placed where a hand would have stopped: the side it
  // could not reach.
  const rim: THREE.Vector3[] = [];
  for (let a = 196; a <= 478; a += 5) {
    rim.push(edgePt((a * Math.PI) / 180, 0.05, 1.035 + (rnd() - 0.5) * 0.012));
  }
  root.add(mark(rim, P.ink, "form"));
  // …AND THE OUTLINE ITSELF, which is the half of F5 the Prep walk named.
  //
  // The foot arc above satisfies C2 by the letter. It does not satisfy the sentence F5
  // is actually written against — "beside ?mock=strata that is exactly what breaks the
  // 'same hand' read" — and the drawn rig says why in one frame: under Prep the snow is
  // reserved paper by row 15, so the top 45% of this landform is a WHITE HOLE in the
  // page with one caret floating over it. The cliff does not have that problem because
  // the edge you actually see of a plateau IS its rim; the edge you see of a cone is its
  // outline, and nothing was drawing it.
  //
  // Authored, not extracted. `silhouetteRuns()` is the kit's tool for a mass and it is
  // wrong here: a `LatheGeometry` band is open at both ends, so every one of the seven
  // bands would hand back its top and bottom ring as "an open form's rim" and the massif
  // would come back wearing fourteen ink hoops.
  //
  // AUTHORED IN THE SHOT'S VIEW PLANE (§3.6), and the first build of it was authored on
  // the two limb AZIMUTHS instead — φ 0.26 and 3.40, the numbers this file solves for the
  // snowline's phasing — which came back with both rock arms occluded by the mountain's
  // own belly. An azimuth is not a limb: the limb is where the surface turns away from
  // THIS lens, so it is `argmax ±(p · VIEW_R)`, it is different at every height once the
  // plan is a lobed ellipse, and it is a two-line solve. 48 samples a height, both signs.
  //
  // 1.045× radially and 0.05 toward the lens, for the same reason the boundary arcs are
  // proud: at the true radius roughen() swallows the line and it renders as beading.
  // THE UNFINISHED SPAN (C2): the descent stops halfway down the left limb's rock and
  // the foot arc's own 78° gap sits under it, so the whole lower-left quadrant is left
  // open — one lift of the pencil, on the side turned away.
  // ONE HEIGHT SWEEP, not two stitched arms. The first build of this ran the rock limb
  // and the snow limb as separate ladders and joined them at the snowline; the junction
  // rendered as a hard right-angled notch on the near limb, because the two ladders solve
  // their own azimuths independently and the shell's hem row is authored TUCKED inside
  // the rock. `outerPt` is the massif's own outer radius at a height — whichever of rock
  // and snow is further out — so the contour is continuous by construction and the small
  // step it does take at the hem is the real one: snow standing proud of the rock it lies
  // on.
  const outerPt = (a: number, y: number) => {
    const y0 = snowLine(a);
    const rr = rockR(y) * lobe(a) * (1 + crumble(a) * 0.02) * 1.02;
    // …and the snow's own radius is ramped ON over the first 0.14 u above the hem. Taking
    // a bare max() there put a 9-px right-angled shelf on the near limb where the drape's
    // clearance switches in; snow does not begin at full thickness, it wedges in.
    const rs =
      y >= y0
        ? rr +
          (shellR(a, y, Math.min(1, Math.max(0, (y - y0) / (TOP - y0)))) - rr) *
            Math.min(1, (y - y0) / 0.14)
        : 0;
    const r = Math.max(rr, rs);
    return new THREE.Vector3(Math.cos(a) * r * MRX, y, Math.sin(a) * r * MRZ);
  };
  const climb = (sgn: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 26; i++) {
      const y = (i / 26) * (TOP - 0.01);
      let best = 0;
      let bv = -Infinity;
      for (let j = 0; j < 48; j++) {
        const a = (j / 48) * Math.PI * 2;
        const v = sgn * outerPt(a, y).dot(VIEW_R);
        if (v > bv) {
          bv = v;
          best = a;
        }
      }
      pts.push(outerPt(best, y));
    }
    return pts;
  };
  // the NEAR, LIT limb is drawn whole; the shaded limb is the one the pencil leaves
  // unfinished, and the foot arc's own gap sits under it
  const outline = climb(-1)
    .concat(climb(1).reverse().slice(1, 19))
    .map((p) => p.addScaledVector(VIEW_CAM, 0.04));
  root.add(mark(outline, P.graphiteDark, "form"));
  // and row 4's own Prep addition on the rock half: a boundary arc at each visible
  // ledge, proud at 1.045× the boundary's larger radius, because at the true radius
  // roughen() swallows the line. One strokeSet, one draw.
  // It traces the LOWER band's own proud top rim, crumble and all — an arc authored on
  // the nominal radius sinks into roughen() and renders as beading (walked).
  const arcs: THREE.Vector3[][] = [];
  for (let i = 2; i < 6; i++) {
    const [rTop, , yTop, , , amp] = BANDS[i + 1];
    const run: THREE.Vector3[] = [];
    for (let a = 3.42; a <= 6.6; a += 0.11) {
      const c = crumble(a);
      const L = lobe(a) * rTop * (1 + c * 0.02) * 1.03;
      const y =
        yTop + c * (BANDS[i + 1][2] - BANDS[i + 1][3]) * 0.04 + amp * 0.06;
      run.push(
        new THREE.Vector3(Math.cos(a) * L * MRX, y, Math.sin(a) * L * MRZ),
      );
    }
    arcs.push(run);
  }
  root.add(strokeSet(arcs, P.graphiteDark, "form"));
  return parkSeam(root);
}

// ponytail: no second instance. Row 15 names two (the S4 mountain flat and the S7
// massif) but the mock route solves its camera to the union of the island and whatever
// this file returns, so a second white form 3 u away costs the massif ~20% of its
// screen size — and the massif is the thing the client is looking at. The recipe is
// already a function of a form (`snowMaterial` + the bake's (azimuth, height) address);
// the flat calls it with a row-17 extruded sheet when S4 is built.

// ==================== THE FRAMEBUFFER PROBE (§10.2, class P) =========================
//
// `await window.__snowProbe()` on any `?mock=snow` route. It exists because every round
// on this surface has been graded on a screenshot pipette, and a pipette reads sRGB bytes
// off a JPEG — which is how a previous round on the neighbouring probe shipped a
// calibration bug. This renders the live scene into a `FloatType` / `NoColorSpace` target
// and reads back LINEAR MIX-DOMAIN values, then encodes once, at the end, so the numbers
// quoted are the numbers §4.7 is written in.
//
// Four passes, all at canvas resolution and all through the scene's own camera:
//   1. colour   — everything visible, as shipped
//   2. mask     — the drape alone, then the rock courses + talus alone, flat white under
//                 `overrideMaterial`, so a pixel is attributed to exactly one object
//   3. albedo   — the drape alone with its bake as an unlit `MeshBasicMaterial`, which
//                 classifies every drape pixel to the committed token it was painted in
// Ink is excluded throughout (`LineSegments2` hidden in every pass): the question is what
// the PAINT does, and a contour would answer it with graphite.
//
// WHAT IT MEASURES, ON THE BUILD THIS FILE SHIPS. `?mock=snow&family=extDay`, whole massif
// in frame (`&aim=6.4,1.6,0&dist=7`), 1444 × 769, linear readback, encoded once at the end:
//
//   region                    % of massif   luma   R−B    mean      p05   p95   warm
//   DRAPE (all)                   35.9%    154.3   −16   #929CA2    96   210   18.3%
//     body   SNOW_SUN + SNOW      12.4%    168.4     0   #A7A9A7   121   216   42.6%
//     lee    EDGE + PALE + MID    23.6%    147.0   −23   #88959F    90   208    5.5%
//   ROCK (7 courses + talus)      64.1%    138.4    +5   #8A8B85    75   203   62.1%
//   MASSIF (drape + rock)          100%    144.0    −2   #8D918F    75   208   46.3%
//
//   per token   SNOW_SUN  L164.4 R−B   0 · SNOW     L184.1 R−B  −3 · LEE_EDGE L170.6 R−B −12
//               LEE_PALE  L135.8 R−B −35 · LEE_MID  L126.5 R−B −23
//
// READ THE `warm` COLUMN CAREFULLY — it is the fraction of pixels with encoded R − B > 0,
// so a single byte of rounding counts. The BODY's mean R−B is exactly 0, which is what
// "neutral" means: half its pixels round one byte warm and half one byte cool. The number
// that matters is the drape's 18.1% against last round's 23.6%, and its mean R−B of −17
// against last round's −5.8. The ROCK is 62.1% warm and it is SUPPOSED to be: it is tan
// stone under a neutral key, and a mountain whose rock reads cool is a mountain made of ice.
//
// AND THE VALUE, which is the whole of what the key ruling bought. Last round's brightest
// pixel anywhere on this object was #BFC1C7 at luma 193, sitting on the old #C0C0C0 wall.
// The drape's p95 is now 210 and SNOW_SUN's own p95 is 216, with committed values reading
// up to #DFDDD5 at luma 221 on a key-facing face — 24 luma off the page, against 52.
const TOKEN_NAMES: [string, number][] = [
  ["SNOW_SUN", SNOW_SUN],
  ["SNOW", SNOW],
  ["LEE_EDGE", LEE_EDGE],
  ["LEE_PALE", LEE_PALE],
  ["LEE_MID", LEE_MID],
];

type Stat = {
  px: number;
  pct: string;
  luma: number;
  rb: number;
  hex: string;
  p05: number;
  p95: number;
  warmPct: string;
};

function encByte(x: number): number {
  const c = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(255 * Math.min(1, Math.max(0, c)));
}

/** Encode a linear pixel run to sRGB bytes, then report luma / R−B / the warm fraction. */
function stat(buf: Float32Array, idx: number[]): Stat {
  const lum: number[] = [];
  let r = 0;
  let g = 0;
  let b = 0;
  let warm = 0;
  for (const i of idx) {
    const R = encByte(buf[i * 4]);
    const G = encByte(buf[i * 4 + 1]);
    const B = encByte(buf[i * 4 + 2]);
    r += R;
    g += G;
    b += B;
    if (R - B > 0) warm += 1;
    lum.push(0.2126 * R + 0.7152 * G + 0.0722 * B);
  }
  const n = Math.max(1, idx.length);
  lum.sort((a, c) => a - c);
  const mr = Math.round(r / n);
  const mg = Math.round(g / n);
  const mb = Math.round(b / n);
  return {
    px: idx.length,
    pct: "",
    luma: Math.round((0.2126 * mr + 0.7152 * mg + 0.0722 * mb) * 10) / 10,
    rb: mr - mb,
    hex:
      "#" +
      [mr, mg, mb].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase(),
    p05: Math.round(lum[Math.floor(n * 0.05)] ?? 0),
    p95: Math.round(lum[Math.floor(n * 0.95)] ?? 0),
    warmPct: ((100 * warm) / n).toFixed(1) + "%",
  };
}

export async function probeSnow(state: {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
}) {
  const { gl, scene, camera } = state;
  const size = gl.getSize(new THREE.Vector2());
  const W = Math.round(size.x);
  const H = Math.round(size.y);
  const target = new THREE.WebGLRenderTarget(W, H, {
    type: THREE.FloatType,
    colorSpace: THREE.NoColorSpace,
    stencilBuffer: false,
  });
  const buf = new Float32Array(W * H * 4);

  // every mesh in the scene, split into the three roles this probe attributes by
  const shell: THREE.Mesh[] = [];
  const rock: THREE.Mesh[] = [];
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    if (m.isLineSegments2 || (o as THREE.Line).isLine) {
      if (o.visible) hidden.push(o);
      return;
    }
    if (!m.isMesh) return;
    if (m.name === "massif-snow-shell") shell.push(m);
    else if (/^massif-(band-\d|talus)$/.test(m.name)) rock.push(m);
  });
  for (const o of hidden) o.visible = false;

  const shot = () => {
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.readRenderTargetPixels(target, 0, 0, W, H, buf);
    gl.setRenderTarget(null);
    return buf.slice();
  };

  const colour = shot();

  // ---- masks. Everything but the subject is hidden and the subject is drawn flat white.
  const allMeshes: THREE.Mesh[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) allMeshes.push(m);
  });
  const wasVisible = allMeshes.map((m) => m.visible);
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const maskOf = (subject: THREE.Mesh[]) => {
    allMeshes.forEach((m, i) => (m.visible = wasVisible[i] && subject.includes(m)));
    scene.overrideMaterial = white;
    const b = shot();
    scene.overrideMaterial = null;
    const idx: number[] = [];
    for (let i = 0; i < W * H; i++) if (b[i * 4] > 0.5) idx.push(i);
    return idx;
  };
  const shellIdx = maskOf(shell);
  const rockIdx = maskOf(rock);

  // ---- the drape's albedo, unlit, so every drape pixel names its own committed token
  const albedoMat = new THREE.MeshBasicMaterial({ map: snowMaterial().map });
  allMeshes.forEach((m, i) => (m.visible = wasVisible[i] && shell.includes(m)));
  scene.overrideMaterial = albedoMat;
  const alb = shot();
  scene.overrideMaterial = null;
  allMeshes.forEach((m, i) => (m.visible = wasVisible[i]));
  for (const o of hidden) o.visible = true;

  const linOf = (hex: number) =>
    [16, 8, 0].map((s) => {
      const c = ((hex >> s) & 255) / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
  const refs = TOKEN_NAMES.map(([n, h]) => [n, linOf(h)] as [string, number[]]);
  const byToken: Record<string, number[]> = {};
  for (const [n] of refs) byToken[n] = [];
  for (const i of shellIdx) {
    let best = refs[0][0];
    let bd = Infinity;
    for (const [n, c] of refs) {
      const d =
        (alb[i * 4] - c[0]) ** 2 + (alb[i * 4 + 1] - c[1]) ** 2 + (alb[i * 4 + 2] - c[2]) ** 2;
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    byToken[best].push(i);
  }
  // the body is what the two whites cover; the lee is the three shaded values
  const body = [...byToken.SNOW_SUN, ...byToken.SNOW];
  const lee = [...byToken.LEE_EDGE, ...byToken.LEE_PALE, ...byToken.LEE_MID];
  const massif = [...shellIdx, ...rockIdx];

  const out: Record<string, Stat> = {
    "DRAPE (all)": stat(colour, shellIdx),
    "  body  SNOW_SUN+SNOW": stat(colour, body),
    "  lee   EDGE+PALE+MID": stat(colour, lee),
    "ROCK (7 courses+talus)": stat(colour, rockIdx),
    "MASSIF (drape+rock)": stat(colour, massif),
  };
  for (const [n] of refs) out["    " + n] = stat(colour, byToken[n]);
  const tot = Math.max(1, massif.length);
  for (const k of Object.keys(out)) out[k].pct = ((100 * out[k].px) / tot).toFixed(1) + "%";

  target.dispose();
  white.dispose();
  albedoMat.dispose();
  return { canvas: W + "x" + H, rows: out };
}

if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__snowProbe = async () => {
    const state = (
      window as unknown as {
        __mock?: { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera };
      }
    ).__mock;
    if (!state) throw new Error("?mock= route is not up — no renderer");
    const r = await probeSnow(state);
    document.documentElement.dataset.snow = JSON.stringify(r);
    return r;
  };
}
