// THE FILM'S SHARED PROP AND CREATURE VOCABULARY.
//
// Every surface in this file is a PORT of a signed-off mockup recipe, not an invention.
// Where the recipe already lived in a kit it is called; where it lived inside a class
// module's buildMock() it was lifted into a kit first and is called from both, so the
// ?mock= route and the film body cannot drift apart. The rows, by function:
//
//   rock() ......................... row 3   · groundKit.rockGeometry / rockMaterial
//   trunkOf(), the trunks ......... row 6   · foliageKit.trunkGeom / bakeBark
//   lobedCrown(), buildOak() ...... row 5   · foliage.ts's five-lobe crown, lifted
//   buildPine() ................... row 5   · foliage.ts's three-tier bough stack, lifted
//   buildRaven() .................. row 22  · mock/hideKit.ravenGeometry(), wrapped in the committed surface
//   buildMushroom() ............... rows 5 + 3
//   buildHouse() .................. rows 8 + 6 + 3
//   buildChest() .................. rows 8 + 11
//   buildFlames() ................. row 13  · fire.buildFire(), called
//   buildBolt() ................... row 23  · marks.ts's spindle, lifted
//   buildAdventurer() ............. row 9 + row 11 · clothKit.buildFigure(), called
//   buildArrow() .................. rows 11 + 6
//   buildFinger() ................. row 22  (skin is the one-mass family)
//   cauliflowerShape/streakShape .. row 17  — authored Shapes, kept verbatim
//
// RETIRED HERE, BY NAME AND TO ZERO (§11.2's closing paragraph, and row 23):
//   · buildRayBurst / rays() — "rays were v1's word for light". The burst survives only
//     as an EMPTY positioned group so three call sites in set modules this file does not
//     own keep compiling; it draws nothing. Delete the export when they drop the call.
//   · rays() at buildBolt — replaced by the spindle, which is what a loaded brush leaves.
//   · hatch() ×3 — buildChest's well shadow, buildMushroom's gills, buildAdventurer's
//     cloak tone. Two strokes crossing inside one form is the gate failure this whole
//     rebuild exists to kill; every one is answered by a committed tier or a drawn edge.
//   · contact() ×4 — buildChest, buildMushroom, buildHouse, buildAdventurer. contact()
//     builds a nine-stroke hatch internally at pencil.ts:493, and C9 is explicit: a
//     painted prop grounds with a painted contact blob in the ISLAND's own albedo
//     (groundKit.propGround / bakeIncidentCard), never with geometry of its own, and a
//     drawing never grounds at all. Grounding is therefore the SET's job, not the prop's.
//
// NO INSTANCING ANYWHERE: trilayer.ts computes vTriWorld from modelMatrix and never from
// instanceMatrix, so an InstancedMesh would sample strokes, page grid and seam from one
// shared world point. Repeats merge into the vertices instead.
import * as THREE from 'three';
import { blobs, ball, type Blob } from '../sculpt.ts';
import * as P from '../palette.ts';
import { type Paint, paint, roughen, type Weight } from '../pencil.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { rockGeometry, rockMaterial, silhouette, mixHex } from '../mock/groundKit.ts';
import {
  StrokeBag,
  arcPts,
  bakeBark,
  bakeFoliageFilm,
  CROWN_POSTER,
  lobeUScale,
  pineCrown,
  merged,
  placed,
  shotView,
  trunkGeom,
  trunkSideRuns,
  uvBand,
  VIEW_CAM,
  VIEW_R,
} from '../mock/foliageKit.ts';
import {
  bakeGrain,
  boardUV,
  boxRun,
  merge as mergeBoards,
  put,
  IRON_LIT,
  IRON_SHADE,
  BRASS_HASP,
} from '../mock/plankKit.ts';
import { mark, mergeAt, buildImpact, setMarksView } from '../mock/marksKit.ts';
import { buildFire, createFlameMaterial } from '../mock/fire.ts';
import { ravenGeometry } from '../mock/hideKit.ts';
import {
  CAST_STEEL,
  FRONT,
  buildFigure,
  mergeFigureMarks,
  cloakOiled,
  cloakRoad,
  cloakUmber,
  figureMaterial,
  garmentMaterial,
  type Attribute,
  type Part,
  type PartKind,
} from '../mock/clothKit.ts';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';

// ---------------------------------------------------------------------------
// ONE MATERIAL PER TOKEN PER CLASS, cached module-wide. `stroke.dir` is a per-material
// uniform, so a per-prop material would be a per-prop program's worth of state for
// forty trees; the stroke ladder's spread belongs BETWEEN classes, not between copies
// of one (C4, and groundKit's own note on why rock lost its seed%4 spread).
//
// Every material here carries `userData.retint`. A film set recolours a prop after it
// builds it — `paint(caveRock, { fill: P.stoneCool })` — and a trilayer cannot be
// cloned, because clone() drops onBeforeCompile and the whole underdrawing with it. The
// material hands paint() a way back into this cache instead; pencil.ts never learns what
// a trilayer is.
// ---------------------------------------------------------------------------
// THE FILM'S DRYBRUSH SCALE, and it is a measured number rather than a taste.
//
// Edge wear is `mix(lit, paper, pow(1 − |N·V|, 2.5) · wear)` — a straight ramp toward
// PAPER on everything the lens sees at a glancing angle, which on a lathe or a sculpted
// mass is most of the visible surface. The mockup route runs the hero rig (hemi 0.8, one
// key) and 0.30 of it reads there as a rim on a hem. THE FILM IS NOT THAT LIGHT: hemi
// 1.45 over the same 2.2 key, plus a fire PointLight measured at intensity 5.09 standing
// among the ambush cast. Under it the same 0.30 took three earthy cloaks to three silver
// statues with no hue left — walked at t6.4, frame 01. 0.55 of the mock's value is what
// puts the drybrush back on the edge instead of over the whole form.
//
// It scales the mock's numbers rather than replacing them, so when a row's wear is
// re-judged on the route the film moves with it.
const FILM_WEAR = 0.55;

// ---------------------------------------------------------------------------
// THE FILM DOES NOT STAGE ITS OWN RIG UNIFORMS ANY MORE. It used to, and this note is
// kept because the failure it was built around is the one the whole world rebuild ran
// aground on.
//
// `rig.seamX`, `rig.depthNear` and `rig.depthFar` are MODULE SINGLETONS shared by every
// trilayer material in the app, and `stages/hero.ts` stages all three for the cover:
// the seam at x = 1.0 (drained to BLANK_X = −3.4 by `heroLife` at the handoff) and the
// depth ramp at ~9/24, which is the hero diorama’s camera distance. The film’s sets live
// at x = 0…126 and its shots run to 100+ units, and `triSeamF = smoothstep(seamX−w,
// seamX+w, vTriWorld.x)` puts PREP EAST of the line — so under the cover’s numbers every
// film surface rendered its Prep state in broad daylight and everything past ~23 units
// washed to bare paper. Three earthy cloaks came back as three silver statues, and no
// token, map, wear or poster change moved them, because none of those reach the drawn
// half. Walked at t6.4; `material.wireframe = true` was what finally proved the meshes
// were mine and the state was not.
//
// The fix shipped here was a PRIVATE set of uniforms for materials that happened to
// pass through this file, which left every surface built by a mock kit — the ground
// cards, the flora stands, the verge, the rocks — still reading the cover’s values and
// still wrong for the whole run. `Film.tsx` now borrows all three for the length of the
// film’s own render pass and hands them straight back, so ONE number reaches every film
// surface and the cover keeps its own. The private copies were the divergent path and
// they are gone (client ruling, 2026-09-05).

// ---------------------------------------------------------------------------
// THE TINT IS DIVIDED BY THE BAKE'S OWN BASE PIGMENT, AND THAT IS THE WHOLE OF V7.
//
// `trilayer.ts:533` takes `triAlbedo = diffuseColor.rgb` immediately AFTER
// `#include <map_fragment>`, so the albedo every tone, tier and stroke decision derives
// from is `material.color × map`. A bake authored on a WHITE base (`bakeGrain`,
// `bakeRockFace`) is therefore a pure value structure and the class token multiplying it
// lands exactly: white × token = token. A bake authored IN a pigment is not.
// `bakeFoliage` paints its bands in `canopy`/`canopyDeep`/`needle` and `bakeBark` lays
// its whole tile on `timber` — so re-applying the class token on top of those SQUARED the
// pigment. Measured: `canopy × canopy` = `#254C0A`, linear L 0.0565 against the token's
// own 0.2262 — **four times too dark** — `triTone` 0.854 against row 5's 0.559, which
// pins every crown in the film to tier 4 (three passes, hard pressure) wherever poster 12
// does not first quantize each flat quad of the 13×10 sphere into its own bin. That bin
// pattern at the tessellation's frequency IS the lattice on every crown in every wide
// shot, and it is a hatch. Proven by A/B at S4 t37.1: map null → clean; map replaced by a
// 4×4 solid → lattice STILL THERE; mips off + LinearFilter → still there; real bake kept
// and `material.color` forced to white → GONE.
//
// So `mapBase` names the bake's own base pigment and the tint is `token ÷ mapBase` in
// LINEAR space, which is the domain the multiply happens in. One rule, no special cases:
//   · `bakeGrain` (white base)  → ratio 1 → the token, exactly as before. Plank is
//     unchanged, and its three committed board tiers survive.
//   · `bakeBark` (base `timber`) → `barkMat(P.timber)` divides to white and the trunk
//     lands ON row 6's `timber` t3; `barkMat(P.timberDark)` still darkens to t4.
//   · `bakeFoliage` (reference band `canopy`) → `crownMat(P.canopy)` divides to white, so
//     the oak takes the canopy band (t3) and the pine the needle band (t4) — exactly row
//     5's own tiers — while `crownMat(P.mushCap)` still re-hues the same value structure.
// A ratio channel may exceed 1 (a red cap over a green band); `material.color` is a plain
// vec3 uniform, not a clamped colour, so that is a lift and not a clip until the frame.
type TriSpec = {
  wear?: number;
  poster?: number;
  dir?: number;
  map?: THREE.Texture | null;
  /** The bake's own base pigment. White (the default) means the map is a value structure. */
  mapBase?: number;
};
const RATIO_A = new THREE.Color();
const RATIO_B = new THREE.Color();
const TRI = new Map<string, THREE.MeshLambertMaterial>();
function tri(kind: string, color: number, spec: TriSpec): THREE.MeshLambertMaterial {
  const key = `${kind}:${color.toString(16)}`;
  let m = TRI.get(key);
  if (!m) {
    m = createTrilayer({
      color: spec.map ? 0xffffff : color,
      wear: (spec.wear ?? 0.22) * FILM_WEAR,
      poster: spec.poster ?? 0,
      stroke: { dir: spec.dir ?? 0.61, sheet: true },
    });
    if (spec.map) {
      m.map = spec.map;
      RATIO_A.setHex(color); // both sides decoded to linear — the domain of the multiply
      RATIO_B.setHex(spec.mapBase ?? 0xffffff);
      m.color.setRGB(
        RATIO_A.r / Math.max(RATIO_B.r, 1e-4),
        RATIO_A.g / Math.max(RATIO_B.g, 1e-4),
        RATIO_A.b / Math.max(RATIO_B.b, 1e-4),
      );
    }
    m.userData.role = 'tri';
    m.userData.retint = (hex: number) => tri(kind, hex, spec);
    TRI.set(key, m);
  }
  return m;
}

/**
 * Row 6 · bark. `bakeBark` 256², dir 1.35 along the grain, poster 0.
 *
 * `mapBase: P.timber` because that is the colour `bakeBark` fills its tile with before it
 * lays the shade band and the grain (`foliageKit.ts:448`). `barkMat(P.timber)` therefore
 * divides to white and the trunk lands ON row 6's `timber` — `triTone` 0.584, tier 3 —
 * instead of on `timber × timber` `#54361A`, 0.885, tier 4. `barkMat(P.timberDark)` keeps
 * its step: the ratio darkens the same tile to row 6's `timberDark` t4.
 */
const barkMat = (token: number) =>
  tri('bark', token, { wear: 0.18, dir: 1.35, map: safeBake(bakeBark), mapBase: P.timber });

/**
 * Row 5 · foliage. Row 5's own numbers, all of them: `bakeFoliage` 512² **unchanged**,
 * **poster 12**, wear 0 (trees are tended, not handled), and two rungs of the row's own
 * `0.50 + (seed%5)·0.06` ladder — 0.50 for the broadleaf crowns, 0.62 for the needles,
 * one per species rather than one per copy (`stroke.dir` is a per-material uniform, so a
 * seeded spread is a material per seed; C4 puts the spread between classes).
 *
 * THE BAKE IS 512 AND THE ROW IS UNAMENDED. `lobeUScale` already holds row 5's verified
 * **272 tex/u** on a lobe of any size (`foliageKit.ts:302`) — it scales the tile's u span
 * with the lobe's circumference and clamps at 1 — so the density argument the 128 downgrade
 * was made on had already been answered where it belongs. At 128 the same lobe samples
 * 272 × 128/512 = **68 tex/u**, a quarter of the figure row 5 records as verified, and the
 * row was never amended to say so. The lattice that downgrade was chasing was not
 * minification at all (see `tri()` above: it was the tint squaring the pigment), so the
 * number goes back to the row's.
 *
 * THE BASE IS PER BAND, AND THE PARAGRAPH BELOW USED TO ASSUME ONE TILE HAS ONE.
 *
 * `bakeFoliage` is a TWO-BAND tile (`foliageKit.ts:420–421`) and the two bands are painted
 * in DIFFERENT pigments: v ∈ [0.5, 1] is `canopyDeep · canopy · lit-canopy` and v ∈ [0, 0.5]
 * is `needle+canopyDeep · needle · lit-needle`. An oak lobe is `uvBand(…, 0.5, 1)` and only
 * ever samples the first; a pine bough is `uvBand(…, 0, 0.5)` and only ever samples the
 * second. One `mapBase` for both was therefore right for the oak and wrong for the pine:
 * `P.canopy` divides out a pigment the pine's band never carried, so any pine given a
 * non-canopy tier rendered at `needle × tier ÷ canopy` — a SECOND coat of the tier token
 * over a band that was already needle-green. Measured off the live materials, 29 of the
 * 51 meshes on this bake carried a non-unity, unintended tint:
 *
 *   pine `tier: P.needle`     needle × needle ÷ canopy     `#375D60`  L 0.0949  1.52× dark
 *   pine `tier: P.canopyDeep` needle × canopyDeep ÷ canopy `#33593E`  L 0.0820  1.74× dark
 *
 * against row 5's own needle L 0.1438. `#375D60` is a cold teal that is neither a palette
 * token nor a two-token `mixHex`, and two pines at the same distance in different hues is
 * exactly what it looks like in frame. Both still landed t4, so it was a pigment defect
 * rather than a gate failure — which is the kind that reaches a jury and not a check.
 *
 * The base is now the band's own, so each species' material divides out the pigment its
 * own band is painted in and every crown renders its token EXACTLY. Re-derived under
 * §11.3 with the map multiply in (`trilayer.ts:549` takes `triAlbedo` after
 * `map_fragment`), at the band's mid stop, which is the crown's pigment:
 *
 *   oak  `canopy`      `#678E42`  tone 0.5586  t3  0.0614 clear
 *   oak  `canopyDeep`  `#466F33`  tone 0.7005  t4  0.0805 clear
 *   pine `needle`      `#4C7350`  tone 0.6760  t4  0.0560 clear
 *   pine `canopyDeep`  `#466F33`  tone 0.7005  t4  0.0805 clear
 *   pine `canopy`      `#678E42`  tone 0.5586  t3  0.0614 clear
 *
 * — row 5's own `canopy t3 · canopyDeep t4 · needle t4`, every one over 0.03 of clearance
 * from a boundary. The bands' lit and deep stops still cross tiers, which is the tier
 * field doing its job rather than a pigment straddling a line.
 *
 * `crownMat(P.mushCap, 0.5)` keeps `P.canopy`: the cap is a plain lathe whose v spans the
 * WHOLE tile, so the tile's own reference band is the only base it can have, and the ratio
 * there is a hue transform and not a second coat of pigment.
 *
 * With the map OFF the crown had Lambert and the poster bins and nothing else — a hard
 * faceted low-poly lump with no marks on it at all, which is §9.5's named failure and a
 * no-hatch gate passing vacuously. Row 5 assigns channel F. It gets channel F.
 */
const crownMat = (token: number, dir: number, mapBase: number = P.canopy) => {
  // the base is folded into the cache key AND into the bake: `tri()` renders
  // `token / mapBase × stop`, so a tile whose mid is not this crown's own token puts its
  // deep and lit stops on a colour nobody committed (§4.5 binds on what reaches the
  // screen). `foliageKit.crownFamily` carries the authoring and the measured tones.
  const m = tri(`crown${dir.toFixed(2)}/${mapBase.toString(16)}`, token, {
    wear: 0,
    poster: CROWN_POSTER,
    dir,
    map: safeBake(() => bakeFoliageFilm(mapBase)),
    mapBase,
  });
  // A crown recoloured by `paint()` (buildOak's own last act) must take the TILE of its
  // new token, not the old token's tile with a ratio laid over it — that ratio is exactly
  // the lift the oak has carried at `canopyDeep`: lit `#98AF73` rendering `#69895B`.
  m.userData.retint = (hex: number) => crownMat(hex, dir, hex);
  return m;
};

/**
 * Row 8 · plank. `bakeGrain` 512² tiling at 2 u = 256 tex/u, dir 1.42, poster 0.
 *
 * NO `mapBase`, and that is the measurement rather than an omission: `bakeGrain` fills
 * `#ffffff` and draws in black at 0.10–0.30 alpha (`plankKit.ts:309`), so it is a value
 * structure and the ratio is unity. The token multiplies it exactly, which is what keeps
 * the chest's `PLANK_LIT` t2 / `plank` t3 / `caveDark` t4 ladder three real steps apart.
 */
const plankMat = (token: number) =>
  tri('plank', token, { wear: 0.24, dir: 1.42, map: safeBake(bakeGrain) });

/** Row 11 · metal. poster 8 struck and turned, poster 0 banding; dir 0.55. */
const metalMat = (token: number, poster = 8) =>
  tri('metal' + poster, token, { wear: 0.26, poster, dir: 0.55 });

/** Row 3 / row 22 · the one-mass family — rock, hide and skin all take dir 0.55. */
const massMat = (token: number, poster = 0) =>
  tri('mass' + poster, token, { wear: 0.26, poster, dir: 0.55 });

// A bake returns null in a headless build (no `document`), and a null map means the
// material falls back to its flat token. One guard rather than four.
function safeBake(f: () => THREE.CanvasTexture | null): THREE.Texture | null {
  try {
    return f();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// THE FILM'S COMMITTED TIERS, mixed from two committed tokens each (§4.5, §11.3), with
// the tone and tier each one COMPUTES to under `trilayer.ts:365–379` — not the tier
// someone wanted, the tier the arithmetic gives. `triTone` boundaries are 0.14 / 0.30 /
// 0.46 / 0.62, and the shader adds ±0.03 of world noise (`trilayer.ts:377`), so a pigment
// within 0.03 of a boundary FLIPS TIER ACROSS ITS OWN SURFACE. Every value below is at
// least 0.05 clear EXCEPT `PLANK_SHADE`, which is named where it is used.
//
// V9 — AND THE SENTENCE ABOVE USED TO CLAIM MORE THAN THE ARITHMETIC SUPPORTS. It read
// "every value below is at least 0.05 clear, and the three that were not are named where
// they are used", and `IRON_LIT` was neither 0.05 clear nor named anywhere: at
// `mix(iron, steel, 0.45)` `#949DA7` it computes to `triTone` **0.439**, which is **0.021**
// from the t2/t3 boundary at 0.46 — INSIDE `trilayer.ts:377`'s ±0.03 of world noise, so
// the arrowhead and the chest hasp it paints flip tier across their own 8-mm plates. Two
// things were wrong and both are fixed: the pigment moves clear and the claim now says
// what is actually true.
const PLANK_LIT = mixHex(P.plank, P.flameCore, 0.3); // #C0A881 · 0.365 · t2 (0.065 clear)
const PLANK_SHADE = mixHex(P.plank, P.timberDark, 0.55); // #866A49 · 0.653 · t4 (0.033)
// IRON_LIT / IRON_SHADE / BRASS_HASP moved to mock/plankKit.ts (P0k): metal-on-carpentry
// is that kit's domain. Imported above, re-exported below under the same names so every
// caller here compiles unchanged. See plankKit.ts for the measured triTone comments.
// F13 · `stoneWarm` computes to 0.455, which is 0.005 from the t2/t3 boundary: a plaster
// wall drawn half in one tier and half in the next, with the split following the shader's
// noise rather than the form. The film's own lit-plaster idiom (mix toward `flameCore`,
// as `cliffLit`/`rockLit`/`earthLit` all do) moves it clear without a new hue.
const HOUSE_PLASTER = mixHex(P.stoneWarm, P.flameCore, 0.18); // #B7A68A · 0.380 · t2 (0.080)
// F13 · `gobSkin` computes to 0.464 — 0.004 from the same boundary. The finger is a
// close-up in one shot and a tier that flips mid-knuckle is the whole read.
const SKIN_SHADE = mixHex(P.gobSkin, P.caveDark, 0.16); // #798E50 · 0.542 · t3 (0.078)

// ---------------------------------------------------------------------------
// Sculpt vocabulary. The three ball lists are DATA and stay exactly as they were —
// ambush's fire log and bedroll, ground's and montage's stumps, theatre's forest floor
// all polygonise them at their own call sites and nothing about those reads changes.
// ---------------------------------------------------------------------------

// a tapered organic column in unit space — limbs and logs. Spans y ≈ 0.05..1.0,
// girth ≈ 0.32 across.
export const COLUMN: Blob[] = [
  ball(0.5, 0.84, 0.5, 0.16),
  ball(0.5, 0.62, 0.5, 0.145),
  ball(0.5, 0.4, 0.5, 0.135),
  ball(0.5, 0.17, 0.5, 0.125),
];

// a cut stump: squat trunk over a root flare
export const STUMP: Blob[] = [
  ball(0.5, 0.6, 0.5, 0.17),
  ball(0.5, 0.35, 0.5, 0.2),
  ball(0.32, 0.28, 0.5, 0.09),
  ball(0.66, 0.3, 0.62, 0.08),
  ball(0.6, 0.28, 0.34, 0.08),
];

/**
 * ROW 3 · A SCULPTED ROCK, `w` wide, centred on its own mass.
 *
 * The dodecahedron this replaces was the exact failure the judgement measured on the
 * mock route — "a rockery of hexagonal paving slabs… each pentagon face is a flat khaki
 * plane at 60–70 screen px" — and the constraint that forced it (inkEdges drawing every
 * one of a subdivided mass's 480 edges) died when the class moved to `silhouetteRuns`.
 * So this is groundKit's recipe called, not restated: a welded icosahedron under TWO
 * octaves of roughen, `scale.y 0.72`, the shared white-based `bakeRockFace` under
 * `rockFace`, poster 0 — tiering comes from the displacement under the key — and the
 * mass's own outline as its only drawn mark.
 *
 * TWO NUMBERS ARE THE FILM'S, NOT THE MOCK'S, and both are screen-space arithmetic:
 *  · detail 1 under r 0.14. The mock's rocks are all 0.25–0.78 u; a path pebble is 0.05 u
 *    and 4–8 screen px, and 320 faces on it is 320 faces the lens cannot resolve.
 *  · NO SILHOUETTE under w 0.30. At the film's 77 px/u floor that mass is 23 px across,
 *    and a contour on it is one more grey tick, not a drawing. The tier field carries it.
 */
export function rock(w: number, tier: Weight = 'faint', turn = 0): THREE.Group {
  const g = new THREE.Group();
  const r = w * 0.5;
  const seed = Math.floor(Math.abs(turn) * 613 + w * 971) % 257;
  const geom = rockGeometry(r, seed, r < 0.14 ? 1 : 2);
  geom.rotateY(turn);
  const m = new THREE.Mesh(geom, rockMaterial(P.rockFace, 0.3 * FILM_WEAR));
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  if (w >= 0.3) {
    g.add(silhouette(geom, VIEW_CAM, P.graphiteDark, Math.min(0.03, r * 0.05), tier === 'faint' ? 'form' : tier));
  }
  return g;
}

/**
 * ROW 6 · A STANDING TRUNK, base at y = 0, girth `d` across. Grown wood.
 *
 * foliageKit's `trunkGeom` — a closed lathe at ~3 rings per world unit so `roughen` has
 * something between the ends to displace, u wrapping ONCE so an old thick trunk's grain
 * comes out coarser than a sapling's for free — under `bakeBark` at 256², plus the two
 * tapering side strokes that are row 6's whole drawn state.
 */
export function trunkOf(d: number, h: number, w: Weight = 'faint'): THREE.Group {
  const g = new THREE.Group();
  const r = d * 0.5;
  const geom = trunkGeom(r * 0.7, r, h, 0, 0, 0);
  const m = new THREE.Mesh(geom, barkMat(P.timber));
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  const bag = new StrokeBag();
  for (const run of trunkSideRuns(0, 0, r * 1.15, r * 0.7, 0.02, h)) {
    bag.add(run, w === 'hero' ? 'hero' : 'form', 'paint');
  }
  g.add(bag.build());
  return g;
}

/**
 * ROW 23 · restored 2026-09-06 as the row-23 impact (was an empty stub; the S1 volley
 * rendered nothing). Builds `marksKit.buildImpact()` — the strike stroke, the 4 spall
 * ticks and the 3 spindle flashes — so the mock route and this film builder share one
 * recipe, and positions it at `(x, y, z)`. Starts at scale 0 exactly like the old stub:
 * every call site (S1's three volley impacts, `montage.ts`'s candle rays, `pathProps.ts`'s
 * fire/lantern rays) stays invisible until a timeline tween opens the scale back up, and
 * only `cliffWorld.ts`'s three impacts get one.
 */
// §4.4 basis, CORRECTED 2026-09-06 (W3-V2 / W3c fix round, re-corrected W3c-fix2):
// `cut(7.5)` is NOT the S1 volley's shot — `timeline.ts` shows only `cam(4)`
// (`[102,1.6,2.2] -> [117.4,3.8,0.2]`, active t4-7.5) across all three throws
// (t5.0/5.9/6.3/6.6) and both scale-ramped impacts (`impacts[0]` ~t5.6-5.95, `impacts[1]`
// ~t6.9-7.45); `cut(7.5)` doesn't start until t7.5, after both have fired, and only ever
// shows `impacts[2]` (popped t8.1-8.3). So `buildRayBurst` now takes an optional per-call
// basis; the default below stays `cut(7.5)`'s numbers so the three callers that are not
// shot-critical (`pathProps.ts` x2, `montage.ts` x1) keep compiling and drawing unchanged,
// and `cliffWorld.ts` passes each impact its own real shot basis explicitly. `buildImpact`
// is authored in whatever plane `marksKit`'s view basis currently points at, so this
// builder points it at the caller's shot for the build and hands the hero's lens back
// immediately after — build-time only, exactly like `foliageKit.setView`.
// T-BASIS (`scripts/measure/basis-check.mjs`) proved the az formula this used to carry
// (`atan2(camZ-tgtZ, camX-tgtX)`) is 90° off the kits' convention; use the shared helper.
const IMPACT_VIEW = shotView([114.4, 7.2, 3.0], [117.6, 6.4, 0]); // timeline.ts cut(7.5)
const IMPACT_AZ = IMPACT_VIEW.az;
const IMPACT_ELEV = IMPACT_VIEW.elev;

export function buildRayBurst(
  x: number,
  y: number,
  z: number,
  view?: { az: number; elev: number; scale?: number },
): THREE.Group {
  setMarksView(view?.az ?? IMPACT_AZ, view?.elev ?? IMPACT_ELEV);
  const g = buildImpact({ material: createFlameMaterial(), scale: view?.scale });
  setMarksView();
  g.position.set(x, y, z);
  g.scale.set(0, 0, 0);
  return g;
}

/**
 * ROW 23 · THE BOLT — one `LatheGeometry` spindle laid along its travel axis: fat one
 * third along and tapering to a point at BOTH ends, which is what a loaded brush leaves
 * on paper and what a cone never does. The profile, the length and the max radius are
 * marks.ts's, and the amber ramp rides vertex colours through the shared flame material,
 * so the bolt drains to graphite with everything else instead of standing on the drawn
 * page as a glow hue.
 *
 * The old `rays()` flare at the tip is gone. Hidden until the timeline arcs it.
 */
const SPINDLE: [number, number][] = [
  [0.001, 0.0], [0.35, 0.12], [1.0, 0.3], [0.72, 0.55], [0.4, 0.78], [0.001, 1.0],
];
const SPINDLE_C = new THREE.Color();
const lin = (hex: number) => SPINDLE_C.set(hex).toArray() as [number, number, number];

function spindleGeom(len: number, maxR: number): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    SPINDLE.map(([r, y]) => new THREE.Vector2(r * maxR, y * len)),
    12,
  );
  const pos = g.getAttribute('position');
  const col = new Float32Array(pos.count * 3);
  // flameCore only where the brush was loaded, amber through the belly, amberEmber out
  // to both points — a single flameCore run came back a pale peach smear on paper.
  const heart = lin(P.flameCore);
  const body = lin(P.amber);
  const tailC = lin(P.amberEmber);
  for (let i = 0; i < pos.count; i++) {
    const v = pos.getY(i) / len;
    const k = Math.min(1, Math.abs(v - 0.3) / 0.22);
    const b = v > 0.3 ? tailC : body;
    for (let c = 0; c < 3; c++) col[i * 3 + c] = heart[c] + (b[c] - heart[c]) * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export function buildBolt(): THREE.Group {
  const g = new THREE.Group();
  g.visible = false;
  // the travel axis is local −z, exactly where the old streak ran, so the timeline's arc
  // is unchanged: the point sits at the group's origin and the body trails behind it
  const geom = spindleGeom(1.1, 0.055);
  geom.rotateX(Math.PI / 2); // +y spindle → +z, tail at the origin
  geom.translate(0, 0, -1.1); // …then slid back so the POINT lands on the origin
  const head = new THREE.Mesh(geom, createFlameMaterial());
  head.renderOrder = 3;
  g.add(head);
  // ONE 'hero' contour along its upper silhouette edge — a stroke has one lit edge; two
  // would make it a tube. Present in both states, which is what makes the Prep side a
  // teardrop rather than a grey smudge.
  g.add(
    mark(
      SPINDLE.map(([r, y]) => new THREE.Vector3(0, r * 0.055 * 1.05, -1.1 + y * 1.1)),
      P.graphiteDark,
      'hero',
    ),
  );
  return g;
}

/**
 * ROW 13 · FIRE — one class, four scales, one material. `buildFire()` is the signed-off
 * build: five merged lathe tongues on the drawn flame profile with the amber ramp in
 * vertex colours, a committed coal bed underneath (the tongues are the lightest object
 * in the frame and float without one), fourteen authored ember blobs with their phase
 * baked into position, and the still graphite teardrop with its four-tick shag fringe
 * for the drained state. The two `TetrahedronGeometry` embers retired with §9.5.
 *
 * Film.tsx drives `scale` off `userData.lit` and parents its own PointLight in, so both
 * survive here untouched.
 */
export function buildFlames(lit: number): THREE.Group {
  const g = buildFire(1);
  g.userData.lit = lit;
  return g;
}

/**
 * ROW 8 + ROW 11 · A CHEST: static body + lid pivoting at the back edge + a coin pile.
 *
 * Carpentry, so it keeps its ruled silhouette and paint supplies all tone: seven boards
 * with real thickness on three committed tiers, UV'd so the grain runs along each board's
 * own length, merged per tier, and `boxRun()`'s twelve-edge construction walk as the
 * drawn half. The straps, lock and hasp are row 11 — banded metal, poster 0.
 *
 * TWO RETIREMENTS LAND HERE. The `hatch()` well shadow is gone: the inside of an open
 * chest is the darkest value in the shot and C10 says a dark mass is a TOKEN, so the
 * floor board is `caveDark` and the tone is painted. The `contact()` is gone with C9:
 * this chest grounds on a painted blob in its island's own albedo, which the set that
 * places it authors, and which drains with the island instead of surviving as geometry.
 */
export function buildChest(x: number, y: number, z: number) {
  const container = new THREE.Group();
  container.position.set(x, y, z);

  const tiers = new Map<number, THREE.BufferGeometry[]>();
  const board = (
    token: number,
    w: number,
    h: number,
    d: number,
    pos: [number, number, number],
  ) => {
    const geom = boardUV(new THREE.BoxGeometry(w, h, d), w, Math.max(h, d));
    put(geom, { pos });
    (tiers.get(token) ?? tiers.set(token, []).get(token)!).push(geom);
  };

  // THE CARCASS, on a C5 ladder that was re-derived rather than asserted. What shipped
  // had the sides and back at `PLANK_SHADE` (0.653, t4) meeting a `caveDark` well floor
  // (0.920, t4) — two adjacent faces of one object in one tier, drawing as ONE flat
  // graphite field, which is C5's own named defect. The floor cannot move (C10: the
  // darkest value in the shot is a TOKEN, and it is the one place tier 4 may fill), so
  // the boards did: front t2 · sides and back t3 · floor t4. Every seam is a step.
  board(PLANK_LIT, 0.6, 0.32, 0.045, [0, 0.19, 0.19]); // front · 0.365 t2
  board(P.plank, 0.6, 0.32, 0.045, [0, 0.19, -0.19]); // back · 0.504 t3
  board(P.plank, 0.045, 0.32, 0.34, [-0.28, 0.19, 0]);
  board(P.plank, 0.045, 0.32, 0.34, [0.28, 0.19, 0]);
  // the well floor: the darkest value in the shot, and it is a TOKEN, not a hatch
  board(P.caveDark, 0.58, 0.04, 0.38, [0, 0.045, 0]); // 0.920 t4
  // two coins already spilled at its feet — a chest that has been gotten into
  const metal = new Map<number, THREE.BufferGeometry[]>();
  const metalPart = (token: number, geom: THREE.BufferGeometry, p: Parameters<typeof put>[1]) =>
    (metal.get(token) ?? metal.set(token, []).get(token)!).push(put(geom, p));
  for (const [cx, cz] of [[-0.36, 0.14], [0.34, 0.2]] as [number, number][]) {
    metalPart(P.gold, new THREE.CylinderGeometry(0.04, 0.04, 0.012, 8), {
      pos: [cx, 0.008, cz],
      rot: [0, cx * 3, 0],
    });
  }
  // iron banding, poster 0. It wraps the front (t2) AND the back (t3), so the only tier
  // that is a step off both is t4 — §11.3's `ironShade`. It was `IRON_LIT` (t2), which
  // matched the front board it crossed and drew as one field with it.
  for (const sx of [-0.19, 0.19]) {
    metalPart(IRON_SHADE, new THREE.BoxGeometry(0.04, 0.33, 0.395), { pos: [sx, 0.19, 0] });
  }
  // the hasp: t3 on a t2 front board. Raw `brass` was t3 too, but 0.014 from the boundary
  // and sitting on a board that was ALSO t3 — the second of F11's two flat fields.
  metalPart(BRASS_HASP, new THREE.BoxGeometry(0.08, 0.09, 0.02), { pos: [0, 0.217, 0.21] });

  const carcassRun = boxRun(0.6, 0.38, 0.38, new THREE.Vector3(0, 0.2, 0));

  // ---- the lid, hinged on the back top edge -----------------------------------
  const lid = new THREE.Group();
  lid.position.set(0, 0.36, -0.19);
  const lidTiers = new Map<number, THREE.BufferGeometry[]>();
  const lidBoard = (token: number, w: number, h: number, d: number, pos: [number, number, number]) => {
    const geom = boardUV(new THREE.BoxGeometry(w, h, d), w, d);
    put(geom, { pos });
    (lidTiers.get(token) ?? lidTiers.set(token, []).get(token)!).push(geom);
  };
  // TWO boards with a real gap and a stagger, per row 8 — a one-piece lid is a slab
  lidBoard(PLANK_LIT, 0.29, 0.05, 0.4, [-0.155, 0.02, 0.2]);
  lidBoard(P.plank, 0.29, 0.05, 0.4, [0.155, 0.02, 0.2]);
  const lidMetal: THREE.BufferGeometry[] = [];
  for (const sx of [-0.19, 0.19]) {
    lidMetal.push(put(new THREE.BoxGeometry(0.035, 0.02, 0.42), { pos: [sx, 0.048, 0.2] }));
  }
  // the hasp drop-plate rides the LID, so it swings open with it and hangs over the lock
  lidMetal.push(put(new THREE.BoxGeometry(0.07, 0.09, 0.016), { pos: [0, -0.015, 0.395] }));
  for (const [token, list] of lidTiers) lid.add(new THREE.Mesh(mergeBoards(list), plankMat(token)));
  // the straps cross a t2 board and a t3 board; t4 is the only step off both
  lid.add(new THREE.Mesh(mergeBoards(lidMetal), metalMat(IRON_SHADE, 0)));
  lid.add(mark(boxRun(0.6, 0.05, 0.4, new THREE.Vector3(0, 0.02, 0.2)), P.graphiteDark, 'form'));
  container.add(lid);

  for (const [token, list] of tiers) {
    const mesh = new THREE.Mesh(mergeBoards(list), plankMat(token));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    container.add(mesh);
  }
  for (const [token, list] of metal) {
    container.add(new THREE.Mesh(mergeBoards(list), metalMat(token, token === BRASS_HASP ? 8 : 0)));
  }
  container.add(mark(carcassRun, P.graphiteDark, 'form'));

  // the pile that pops in — one merged geometry, brass at poster 8
  const coins = new THREE.Group();
  coins.position.set(0, 0.21, 0);
  coins.scale.set(0, 0, 0);
  coins.add(
    new THREE.Mesh(
      mergeBoards(
        ([
          [-0.12, 0.02, -0.05],
          [0.05, 0.05, 0.03],
          [0.14, 0.01, -0.02],
          [-0.04, 0.06, 0.06],
          [0.0, 0.03, -0.08],
        ] as [number, number, number][]).map(([ox, oy, oz]) =>
          put(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 8), { pos: [ox, oy, oz], rot: [0, ox * 9, 0] }),
        ),
      ),
      metalMat(P.gold, 8),
    ),
  );
  container.add(coins);

  return { container, lid, coins };
}

// Per-tree variety: every pine and oak draws its own profile jitter, scallop phase and
// facing off a build-order counter. Deterministic — build order never changes between
// loads, so the forest is the same forest every time, but no two trees in it repeat.
let treeSeed = 0;
export function treeVary(seed: number, k: number): number {
  const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** The next seed off that counter, for a caller in another module: `treeSeed` is a
 *  module-local `let` and an imported binding cannot be incremented, so the one bespoke
 *  perch tree in sets/pathProps.ts reads the build-order sequence through here. */
export function nextTreeSeed(): number {
  return treeSeed++;
}

// ---------------------------------------------------------------------------
// ROW 5 · FOLIAGE. THE MOST EXPENSIVE CLASS IN THE FILM, AND THE REASON IT WAS.
//
// The lathe-and-roughen crown this replaces spent its whole triangle bill on `sketch()`:
// a lathe of 26 segments over a 7-row profile hands `EdgesGeometry` several hundred
// edges above threshold 43, each of which became a LineSegments2 segment — an INSTANCED
// SOLID, two triangles and two round caps — and then three of them, because strokes()
// subdivides. That is where +27,922 triangles after a 19% cut came from: not the form,
// the drawing of the form.
//
// The proven recipe puts the tone in the SURFACE and keeps the line for the silhouette.
// Five overlapping roughened lobes merged to one geometry under the canopy tokens at
// poster 8, and four authored contour arcs at 1.03× the lobe radius with
// the push scaling WITH the lobe — a fixed push floats the back arcs 10–20 px clear of
// the mass, which is the registration failure hero.ts:975 already names.
// ---------------------------------------------------------------------------
const LOBES: [number, number, number, number][] = [
  [0, 0.0, 0, 1.0],
  [-0.79, -0.35, 0.24, 0.76],
  [0.74, -0.38, -0.15, 0.79],
  [0.09, 0.65, 0.12, 0.74],
  [-0.41, 0.29, -0.47, 0.65],
];

/**
 * The five-lobe crown, reusable. Spans y ∈ [0, crownH] in its own frame with a half-width
 * of about `r`, exactly as the lathe it replaces did, so every existing caller places it
 * unchanged. Unpainted — callers `paint()`, which reaches the trilayer through its own
 * re-tint.
 *
 * `bag` and `y0` let a tree fold this crown's arcs into ITS stroke merge instead of
 * opening a second draw call; called without them the crown carries its own.
 *
 * V10 · `yaw` IS THIS FUNCTION'S JOB AND NOT THE CALLER'S, and that is the registration
 * failure `hero.ts:975` names, reintroduced by the merge optimisation. When a `bag` is
 * handed in, the contour and interior arcs go into the TREE's bag and the group this
 * returns holds only the MESH — so a caller that spun the group ("never the same face
 * twice") spun the lobes out from under arcs authored to sit on them. `buildOak` did
 * exactly that with a seeded yaw, and every oak in the film with a non-zero one carried
 * five contour arcs and four interior arcs floating over nothing. A floating line reads
 * as a mistake. The turn is therefore baked into BOTH halves here — into the merged lobe
 * geometry after `roughen` (so the displacement is untouched) and into the arc points
 * through `StrokeBag`'s own matrix — and the group is never rotated by anyone.
 */
export function lobedCrown(
  r: number,
  crownH: number,
  seed: number,
  bag?: StrokeBag,
  y0 = 0,
  yaw = 0,
): THREE.Group {
  const g = new THREE.Group();
  const own = bag ?? new StrokeBag();
  // one matrix, shared by the mesh and by every arc — the crown's turn about the trunk's
  // own axis, which is x = z = 0 in the frame both halves are authored in
  const spin = new THREE.Matrix4().makeRotationY(yaw);
  // the big lobe's radius: 1.58 cr across the widest pair, and 2.18 cr tall, so one
  // number cannot satisfy both — take the tighter and let the crown sit inside its box
  const cr = Math.min(r * 0.63, crownH * 0.45);
  const cy = crownH - 1.39 * cr;

  const lobes: THREE.BufferGeometry[] = [];
  for (const [i, [lx, ly, lz, lr]] of LOBES.entries()) {
    const lrr = cr * lr;
    // 13×10, not the hero's 12×9: at set scale a coarser sphere shows straight polygon
    // edges ON the silhouette and reads as "a default primitive" through the paint. The
    // silhouette must break from roughen, never from the tessellation — 0.17 of the
    // radius, which at 1.8× the hero's lobe is twice the world displacement.
    const geom = roughen(
      new THREE.SphereGeometry(lrr, 13, 10),
      lrr * 0.17,
      3.4 / Math.max(r, 0.05),
      seed * 7 + i,
    );
    lobes.push(placed(uvBand(geom, 0.5, 1, lobeUScale(lrr)), lx * cr, cy + ly * cr, lz * cr));
  }
  const mesh = new THREE.Mesh(merged(lobes).rotateY(yaw), crownMat(P.canopy, 0.5));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);

  // FIVE CONTOUR ARCS, row 5's count — four at 'form' on the outer lobes and the fifth at
  // 'faint' where two masses meet, which is exactly `hero.ts:993–997`'s set.
  //
  // K = 1.05, AND IT IS A MEASUREMENT RATHER THAN A PREFERENCE. Row 5 asks for 1.10× in
  // the graphite register and 1.05× painted; this file draws ONE arc set that carries both
  // states, and drawing two would double the most expensive stroke bill in the film
  // (§11.6). The two radii differ by 0.05·cr·lr — at this file's cr 0.28 that is 0.014 u,
  // which is **1.1 screen px at the film's 77 px/u wide framing and 2.8 px at its closest
  // 200 px/u** — under `arcPts`'s own ±3% per-point jitter (foliageKit:118, ±0.4–1.7 px on
  // the same arc). One set at the painted radius errs toward ON the mass, which is the
  // side hero.ts:975 already names as the one that matters ("a floating line reads as a
  // mistake"). The 1.03 that shipped before was neither of row 5's numbers.
  const K = 1.05;
  const push = cr * 0.3;
  const arc = (
    lx: number,
    ly: number,
    lz: number,
    lr: number,
    a0: number,
    a1: number,
    w: Weight = 'form',
  ) =>
    own.add(
      arcPts(lx * cr, y0 + cy + ly * cr, lz * cr, cr * lr * K, cr * lr * K * 0.96, a0, a1, push, 6),
      w,
      'paint',
      spin,
    );
  arc(0, 0, 0, 1.0, 1.2 * Math.PI, 1.86 * Math.PI);
  arc(-0.79, -0.35, 0.24, 0.76, 0.45 * Math.PI, 1.5 * Math.PI);
  arc(0.74, -0.38, -0.15, 0.79, -0.55 * Math.PI, 0.42 * Math.PI);
  arc(0.09, 0.65, 0.12, 0.74, 0.15 * Math.PI, 0.9 * Math.PI);
  // one interior separation where two masses meet — 'faint', a seam in the crown, not
  // its edge. Only where the crown is big enough for the seam to land on a pixel.
  if (r >= 0.34) arc(-0.34, 0.1, 0.1, 0.52, 1.25 * Math.PI, 1.75 * Math.PI, 'faint');

  // THE INTERIOR LEAF ARCS, Prep register only: they are what make a scalloped mass read
  // TREE and not CLOUD once the paint has drained, and they fade up with the curtain so
  // the painted crown never carries them as clutter. FOUR, row 5's count and `hero.ts`'s
  // own four. Skipped below 0.34 u of crown, where at the film's 77 px/u they are 26 px of
  // line inside a 52-px mass and read as scribble — that skip is a screen-space threshold,
  // not a change to the count.
  if (r >= 0.34) {
    const inner = (lx: number, ly: number, lz: number, ir: number, a0: number, a1: number) =>
      own.add(
        arcPts(lx * cr, y0 + cy + ly * cr, lz * cr, cr * ir, cr * ir * 0.78, a0, a1, push * 1.2, 6),
        'form',
        'prep',
        spin,
      );
    inner(-0.46, -0.17, 0.18, 0.4, 0.3 * Math.PI, 1.1 * Math.PI);
    inner(0.35, 0.17, 0, 0.37, 0.5 * Math.PI, 1.4 * Math.PI);
    inner(0.46, -0.52, -0.12, 0.34, -0.2 * Math.PI, 0.7 * Math.PI);
    inner(-0.3, 0.52, -0.3, 0.22, 1.1 * Math.PI, 1.75 * Math.PI);
  }

  if (!bag) g.add(own.build());
  return g;
}

/**
 * ROW 5 · A BROADLEAF: a gnarled trunk with a visible fork, under the five-lobe crown.
 * `r` is the crown's half-width and `h` its full height, exactly as before, so every
 * placement in every set stands unchanged.
 */
export function buildOak(
  r: number,
  h: number,
  fill: { canopy: number; trunk: number } = { canopy: P.canopy, trunk: P.timberDark },
): THREE.Group {
  const g = new THREE.Group();
  const seed = treeSeed++;
  const bag = new StrokeBag();
  const trunkH = h * 0.34;
  const rb = Math.max(r * 0.115, 0.012);

  // trunk + two forks, ONE merged geometry: row 7's rule that each segment's top radius
  // continues the parent's end radius, so the joint is a taper and not a step
  const wood: THREE.BufferGeometry[] = [trunkGeom(rb * 0.62, rb, trunkH, 0, 0, 0)];
  for (const side of [-1, 1]) {
    wood.push(
      trunkGeom(rb * 0.3, rb * 0.55, trunkH * 0.55, side * rb * 1.3, trunkH * 0.66, 0, 0.5, side > 0 ? 0 : Math.PI),
    );
  }
  const trunk = new THREE.Mesh(merged(wood), barkMat(fill.trunk));
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);
  for (const run of trunkSideRuns(0, 0, rb * 1.15, rb * 0.66, 0.02, trunkH)) bag.add(run, 'form', 'paint');

  const crownY = trunkH * 0.9;
  // never the same face twice — and the turn goes THROUGH `lobedCrown`, which owns both
  // halves of the crown. Set on the group it would have spun the lobes only: the arcs
  // that describe them live in this tree's `bag` (V10, and `hero.ts:975`).
  const crown = lobedCrown(r, h - crownY, seed, bag, crownY, treeVary(seed, 12) * Math.PI * 2);
  crown.position.y = crownY;
  paint(crown, { fill: fill.canopy });
  g.add(crown);

  g.add(bag.build());
  return g;
}

/**
 * ROW 5 · A PINE. THREE STACKED CONES plus a `silR()`-derived zigzag AND the per-tier
 * skirt arc — three drawn elements the shipped hero carries together at `hero.ts:1017-1063`,
 * which row 5 records as "PROVEN, transfers 1:1".
 *
 * THE STRUCK AMENDMENT. What shipped before this was a ring of squashed spheres per tier
 * with the skirt arcs deleted, on the argument that an arc under a tier and an outline
 * descending past it cross by construction — 10 to 12 measured crossings a tree. Art-bible
 * row 5 was amended to retire the arc, and that amendment is STRUCK: a requirement is never
 * retired to make a gate pass, and the hero disproves the premise by carrying the arc on
 * every tier. The construction is what was wrong, twice over — the mass was spheres where
 * the drawing assumed cones, and the drawing was authored against radii the mass never had.
 * Both halves now come out of `foliageKit.pineCrown`, which `pineStand` also calls, so the
 * film's two pine call sites cannot drift into two different trees again.
 *
 * WHY THE ARC AND THE ZIGZAG DO NOT BECOME A HATCH: the arc spans 1.1π→1.9π only — the
 * near-lower 144°, never a ring — its y-radius is 0.3 r so it is a flattened ellipse
 * hugging the skirt's own bottom edge, and it sits at ~1.01 r against the zigzag's ~0.99 r.
 *
 * REGISTER RULING (2026-09-06, main session, superseding W1a fix round's RULING A): the
 * hero's 1.01-painted-arc/0.99-zig versus 1.05-graphite-arc/1.03-zig pairs are TWO TREE
 * INSTANCES either side of a FIXED seam (hero.ts:1029, :1052); exclusivity there is
 * geographic, not one tree drawing both. The film's seam is parked and moves, so
 * `pineCrown` emits ONE mark set — the painted ratios, 1.01 arc / 0.99 zig — in the paint
 * register, which recolours ink → graphiteDark under curtain/seam on its own exactly as
 * the hero's painted instance does; the 1.05/1.03 set belongs only to seam-east duplicates
 * the film does not build. Emitting both on one object was measured to double every mark
 * under Prep (the paint register's alpha stays 1 at curtain 1) — that doubling is what
 * read as heavy, broken, dash-like fragments instead of the hero's one continuous stroke.
 * Measured on the built view-plane geometry (the plane the marks are authored in, so
 * screen crossings are exactly 2-D crossings there): ≤4 a tree, at the two inter-tier
 * descents, matching the shipped hero's own single-instance count by the same method.
 */
export function buildPine(
  r: number,
  h: number,
  trunkH = 0.15,
  fill: { tier: number; trunk: number } = { tier: P.canopy, trunk: P.timberDark },
): THREE.Group {
  const g = new THREE.Group();
  const seed = treeSeed++;
  const bag = new StrokeBag();
  // `r` IS the widest skirt (PINE_TIERS[0] carries skirt 1.0), so the profile is fed r
  // directly — the old r·1.85 "tree radius" fudge reached a table that no longer needs it
  const rb = Math.max(r * 0.144, 0.01);

  const trunk = new THREE.Mesh(trunkGeom(rb * 0.6, rb, Math.max(trunkH, h * 0.1), 0, 0, 0), barkMat(fill.trunk));
  trunk.castShadow = true;
  g.add(trunk);

  const cones: THREE.BufferGeometry[] = [];
  pineCrown(r, h, 0, 0, seed, bag, cones);
  // `mapBase: fill.tier` — the tile is baked FOR this crown's token so the ratio is unity
  // and the band's deep/mid/lit render exactly as authored (crownMat's own note). The
  // needle base that stood here rendered `#A9BB63` at the lit stop on every canopy pine.
  const canopy = new THREE.Mesh(merged(cones), crownMat(fill.tier, 0.62, fill.tier));
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  g.add(canopy);

  for (const run of trunkSideRuns(0, 0, rb * 1.1, rb * 0.62, 0.02, trunkH + h * 0.04)) bag.add(run, 'form', 'paint');

  g.add(bag.build());
  return g;
}

/**
 * ROW 22 · A CORVID. The geometry is `mock/hideKit.ts`'s `ravenGeometry()` (moved there
 * verbatim under P0k-B, so `mock/hide.ts`'s route can build the SAME two geometries
 * instead of carrying its own stale copy) — a tight teardrop with NO neck, a thick
 * down-curved wedge of a beak, folded wings hugging the body in one unbroken outline, and
 * a tail that fans into pointed blades. This function supplies only the COMMITTED
 * surface: `ravenSlate` t4 at POSTER 0, because an ink-dark tier has nothing to quantize,
 * on the one-mass family's own rung, dir 0.55 — C4's `0.55 + (seed%4)·0.07`, the same rung
 * rock and skin take (R6). The 0.76 a stale copy in `mock/hide.ts` used to carry was never
 * on the ladder (P0k-B).
 *
 * The two paper eye dots are gone. An S3 raven is 30 screen px and a white dot on an
 * ink-dark head at that size is a speck of dust, not an eye; the beak's one value step
 * is what tells you which way it is looking, and that is the row's own answer.
 */
export function buildRaven(): THREE.Group {
  const g = new THREE.Group();
  const { body, beak } = ravenGeometry();
  const bird = new THREE.Mesh(body, massMat(P.ravenSlate, 0));
  bird.castShadow = true;
  g.add(bird);

  // the beak is iron, not slate — the one value step on a bird that is otherwise one
  // committed dark, and the only thing that says which way it is looking. Its local
  // offset is already baked into the geometry by `ravenGeometry()`.
  g.add(new THREE.Mesh(beak, metalMat(P.iron, 0)));
  return g;
}

/**
 * ROWS 5 + 3 · A TOADSTOOL. The cap is a drawn profile — wide brim curling under at the
 * lip, domed top — turned and roughened at the foliage family's own rung; the stem is
 * the leather-warm `bedroll` tier one step off it; the spots are left as PAPER, which is
 * C11's rule that the page is the lightest value and the reason a toadstool reads.
 *
 * TWO RETIREMENTS. The `hatch()` gill disc is gone — the shaded underside is now ONE
 * drawn brim arc, an edge rather than a crossed family, which is what the no-hatch law
 * leaves you. The `contact()` is gone with C9: this mushroom grounds on the painted blob
 * its set authors into the island albedo (the hero ledger's r18–20 @ 0.26), not on
 * geometry it carries around.
 */
export function buildMushroom(): THREE.Group {
  const g = new THREE.Group();
  g.scale.set(0, 0, 0);

  const stem = new THREE.Mesh(
    roughen(new THREE.CylinderGeometry(0.018, 0.028, 0.12, 7, 2), 0.004, 30, 4),
    massMat(P.bedroll, 0),
  );
  stem.position.y = 0.06;
  stem.rotation.z = 0.07; // nothing in nature grows plumb
  g.add(stem);

  const capProfile: [number, number][] = [
    [0.55, 0.04], [0.85, 0.0], [1.0, 0.22], [0.85, 0.58], [0.48, 0.88], [0.001, 1.0],
  ];
  const capGeom = roughen(
    new THREE.LatheGeometry(
      capProfile.map(([px, py]) => new THREE.Vector2(px * 0.09, py * 0.07)),
      14,
    ),
    0.004,
    26,
    9,
  );
  const cap = new THREE.Mesh(capGeom, crownMat(P.mushCap, 0.5));
  cap.position.y = 0.105;
  cap.castShadow = true;
  g.add(cap);

  // cap spots, left PAPER — the toadstool polka-dot is half of what says "mushroom",
  // and a D&D map key leads with it
  const spots: THREE.BufferGeometry[] = [];
  for (const [sx, sy, sz] of [
    [0.03, 0.158, 0.025],
    [-0.04, 0.15, 0.015],
    [0.008, 0.145, -0.045],
  ] as [number, number, number][]) {
    spots.push(put(new THREE.SphereGeometry(0.018, 7, 5), { pos: [sx, sy, sz], scale: [1, 0.45, 1] }));
  }
  g.add(new THREE.Mesh(mergeBoards(spots), massMat(P.paper, 0)));

  // ONE drawn brim arc where the gills would be — the underside as an EDGE
  g.add(
    mark(
      arcPts(0, 0.113, 0, 0.092, 0.03, 1.06 * Math.PI, 1.94 * Math.PI, 0.03, 7),
      P.graphiteDark,
      'form',
    ),
  );
  return g;
}

/**
 * ROWS 8 + 6 + 3 · A COTTAGE. Body, gabled roof with a ridge and eaves, a round-top
 * door, one mullioned window, timber-frame beams and a stone chimney.
 *
 * The whole house is now FOUR merged meshes and one stroke merge instead of eleven
 * `sketch()` groups: plaster on the walls, plank on the roof and joinery, stone on the
 * chimney, paper in the glass. `boxRun()` carries the construction lines. The
 * `contact()` is gone with C9 — the village grounds on painted blobs in the miniature's
 * own albedo, which is also the only grounding that survives the drain.
 */
export function buildHouse(roofColor: number = P.timberDark): THREE.Group {
  const g = new THREE.Group();
  const stone: THREE.BufferGeometry[] = [];
  const wood: THREE.BufferGeometry[] = [];
  const roofParts: THREE.BufferGeometry[] = [];

  stone.push(put(new THREE.BoxGeometry(0.4, 0.35, 0.4), { pos: [0, 0.175, 0] }));
  // a chimney one committed step off the wall it grows out of (C5)
  stone.push(put(new THREE.BoxGeometry(0.06, 0.3, 0.06), { pos: [0.11, 0.57, -0.06] }));

  // a gabled roof — a ridge with two slopes and eaves overhanging the walls. Four-sided
  // cones read as tents, and eight tents are not a village.
  roofParts.push(
    put(boardUV(new THREE.CylinderGeometry(0.27, 0.27, 0.5, 3, 1, false, Math.PI / 2), 0.5, 0.5), {
      pos: [0, 0.485, 0],
      rot: [0, 0, Math.PI / 2],
    }),
  );

  wood.push(put(boardUV(new THREE.BoxGeometry(0.1, 0.14, 0.02), 0.1, 0.14), { pos: [-0.06, 0.07, 0.205] }));
  // 12 radial segments so the arch reads as a curve rather than a faceted zigzag
  wood.push(
    put(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12, 1, false, 0, Math.PI), {
      pos: [-0.06, 0.14, 0.205],
      rot: [Math.PI / 2, 0, 0],
    }),
  );
  wood.push(put(new THREE.BoxGeometry(0.012, 0.08, 0.024), { pos: [0.1, 0.21, 0.206] }));
  wood.push(put(new THREE.BoxGeometry(0.08, 0.012, 0.024), { pos: [0.1, 0.21, 0.206] }));
  // timber-frame strokes on the gable front — the sheet's jettied-frame read, cheap
  for (const [fx, rot] of [[-0.14, 0.5], [0.02, -0.5]] as [number, number][]) {
    wood.push(put(new THREE.BoxGeometry(0.016, 0.18, 0.012), { pos: [fx, 0.28, 0.203], rot: [0, 0, rot] }));
  }

  const walls = new THREE.Mesh(mergeBoards(stone), tri('plaster', HOUSE_PLASTER, { wear: 0.24, dir: 0.55 }));
  walls.castShadow = true;
  walls.receiveShadow = true;
  const roof = new THREE.Mesh(mergeBoards(roofParts), plankMat(roofColor));
  roof.castShadow = true;
  const joinery = new THREE.Mesh(mergeBoards(wood), plankMat(PLANK_SHADE));
  // the window is PAPER, not snow-white paint — C11 again: the page is the lightest value
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), massMat(P.paper, 0));
  win.position.set(0.1, 0.21, 0.205);
  g.add(walls, roof, joinery, win);

  // row 8's drawn half: boxRun()'s twelve-edge construction walk, 16 segments with 4
  // re-traced, derived from the box's own dimensions so it can never drift off the mass
  g.add(mark(boxRun(0.4, 0.35, 0.4, new THREE.Vector3(0, 0.175, 0)), P.graphiteDark, 'form'));
  return g;
}

/**
 * ROW 9 + ROW 11 · AN ADVENTURER — clothKit.buildFigure() called, which is cloth.ts's
 * own signed-off human. It is not restated here and it never will be: one recipe, two
 * call sites.
 *
 * THE JUDGE'S COMPLAINT, ANSWERED WHERE THE ROW ANSWERS IT. A human reads by three marks
 * the goblin does not have — the shoulder line, one unbroken vertical drape, and exactly
 * ONE silhouette attribute. He is a dome on a stump; they are a wedge on a column. The
 * old figure was a cylinder under a ball under a cone with a hat, a beard, eye dots,
 * boots, hands, a shield AND a sword, which is a chess pawn wearing every attribute at
 * once. What ships now is 1.24 u tall (that is the ×1.30), squashed to 0.56 in depth so
 * the plan is a wedge, and carries no hands, no feet, no face and one attribute.
 *
 * THREE THINGS THIS FILE DECIDES, because the API is a boolean and the recipe is a trio:
 *  1. THE ATTRIBUTE cycles off a build-order counter, the same deterministic trick the
 *     forest already uses. Raised → sword · shield · brim, which IS the signed-off mock
 *     trio. Seated → three brims: nobody brings a shield to the game table, and a raised
 *     sword at one is a second attribute on a figure that already has a hat.
 *  2. `cloakIndigo` and `cloakCrimson` DO NOT REACH A FIGURE. The judgement: they are
 *     "the most saturated, least-earthy colours in the film and they arrive on the only
 *     three figures who stand beside the goblin". The two retired tokens map to the
 *     sanctioned earthy trio — cloakRoad t2 · cloakOiled t3 · cloakUmber t4 — which is
 *     three hues on three VALUE tiers, so the two figures the judgement could not tell
 *     apart differ in value before their attributes are read. A set that passes an
 *     earthy token of its own is honoured unchanged.
 *  3. THE FRAME IS THE FIGURE'S OWN. The mock bakes the hero azimuth into every part;
 *     the film stands adventurers at four yaws, so this builds in `FRONT` and the set's
 *     `rotation.y` turns mass and marks together.
 *
 * G6: no cast member is ever markAlive'd, so nothing here may depend on colour. The
 * silhouette plus one value step carry the whole read, and `castShadow` stays off —
 * a cast shadow on the Prep page is the one thing Prep forbids.
 */
let castSeq = 0;
const RAISED: Attribute[] = ['sword', 'shield', 'brim'];
const SEATED: Attribute[] = ['brim', 'brim', 'brim'];
// THE ORDER IS THE SLOT, and R4 already ruled that the slot is the answer rather than the
// colour: 'the answer was never the colour — it was the SLOT. He takes the one whose
// background is lit ground or the paper void.' Two measured facts moved it this round, and
// neither is a colour change — the three tokens and their three tiers are untouched:
//   · H10. At t6 the index-0 ambush figure stands against open sky. Measured last session,
//     the pale cloak there read L 0.483 against a sky at 0.477 — Δ 0.006, twenty times
//     under P1's 0.12. Index 0 now takes the DARK cloak and the pale one moves to index 2,
//     who stands against the rock face.
//   · G-G. castSeq runs 0,1,2 over the ambush and 3,4,5 over the tavern, so index 0 is ALSO
//     the DM — the one figure on screen at t44, the film's own curtain-1 beat. A tier-1
//     garment drains onto the page there: 65.3 % of his area measured within 0.03 of paper.
//     The darkest cloak is the one that can hold a value when the colour drains out.
// Both orders were built and measured at t44 against the same wall (encoded L 0.4443):
//   umber  mean 0.6007 · 2.2 % within 0.05 of paper · separation 0.1564  ← ships
//   oiled  mean 0.7115 · 13.4 % within 0.05 of paper · separation 0.2672
// Oiled wins the separation and loses G-G clause 1, which is the clause the reference
// wrote precisely because a mean-only gate cannot see a figure draining onto the page.
const CAST_CLOAK = [cloakUmber, cloakOiled, cloakRoad];
const RETIRED_CLOAKS = new Set<number>([P.cloakIndigo, P.cloakCrimson]);

export function buildAdventurer(swordRaised: boolean, cloakPaint?: Paint): THREE.Group {
  const g = new THREE.Group();
  const i = castSeq++;
  const attribute = (swordRaised ? RAISED : SEATED)[i % 3];
  const asked = cloakPaint?.fill;
  const garment = asked === undefined || RETIRED_CLOAKS.has(asked) ? CAST_CLOAK[i % 3] : asked;

  const buckets = new Map<PartKind, Part[]>();
  const marks: LineSegments2[] = [];
  buildFigure(
    (kind, geom, m) => (buckets.get(kind) ?? buckets.set(kind, []).get(kind)!).push({ geom, m }),
    marks,
    new THREE.Vector3(0, 0, 0),
    attribute,
    i * 5 + 3,
    FRONT,
  );

  for (const [kind, parts] of buckets) {
    const mesh = new THREE.Mesh(
      mergeAt(parts),
      kind === 'garment'
        ? garmentMaterial(garment, 0.3 * FILM_WEAR)
        : figureMaterial(kind, garment, FILM_WEAR),
    );
    mesh.name = 'adventurer:' + kind;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  g.add(mergeFigureMarks(marks));
  return g;
}

// ROW 17 · Sky card. A cauliflower is top-lit — round lobes across the top, a dead-flat
// belly along the bottom edge. Authored `Shape`s, kept verbatim: row 17 is explicit that
// a standing sheet is an `ExtrudeGeometry` from an authored Shape and never a
// `PlaneGeometry`, and the mockup's own note on this pair is that they "were always
// right". No hatch on the underside — the flat bottom edge alone reads as the shadowed
// belly, which is the whole reason the shape is drawn this way.
export function cauliflowerShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-1.7, 0);
  s.quadraticCurveTo(-1.85, 0.55, -1.3, 0.6);
  s.quadraticCurveTo(-1.25, 1.05, -0.75, 0.95);
  s.quadraticCurveTo(-0.7, 1.35, -0.15, 1.25);
  s.quadraticCurveTo(-0.05, 1.45, 0.45, 1.3);
  s.quadraticCurveTo(0.55, 1.0, 1.0, 1.05);
  s.quadraticCurveTo(1.15, 0.6, 1.5, 0.55);
  s.quadraticCurveTo(1.8, 0.35, 1.7, 0);
  s.lineTo(-1.7, 0);
  return s;
}

// A thin stratus sliver near the horizon — flat-ish top and bottom, wide and low.
export function streakShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0);
  s.quadraticCurveTo(-1.6, 0.3, -0.4, 0.22);
  s.quadraticCurveTo(0.6, 0.32, 1.6, 0.18);
  s.quadraticCurveTo(2.3, 0.12, 2.2, 0);
  s.quadraticCurveTo(0.8, -0.12, -1.0, -0.1);
  s.quadraticCurveTo(-1.8, -0.08, -2.2, 0);
  return s;
}

/**
 * ROW 22 · THE ONLY PART OF HIM THE TABLE SCENE EVER SHOWS. Skin takes the one-mass
 * family's rung, the same as rock and hide (R6), on the goblin's own sage.
 *
 * The `hatch()` knuckle crease is gone and ONE drawn contour replaces it: a crease is a
 * line, and a line is what the no-hatch law leaves. It is authored across the knuckle in
 * the finger's own frame, so it rides whatever rotation the beat gives the hand.
 */
export function buildFinger(): THREE.Group {
  const g = new THREE.Group();
  const fingerMass = new THREE.Mesh(
    blobs(
      [
        ball(0.5, 0.5, 0.28, 0.17), // knuckle
        ball(0.5, 0.52, 0.5, 0.15), // mid segment
        ball(0.5, 0.56, 0.7, 0.13), // tip, lifting
        ball(0.5, 0.6, 0.82, 0.09), // pad
      ],
      32,
    ),
    massMat(SKIN_SHADE, 0),
  );
  fingerMass.scale.set(0.3, 0.3, 0.44);
  fingerMass.position.set(-0.15, -0.155, -0.22);
  fingerMass.castShadow = true;
  g.add(fingerMass);

  g.add(
    mark(
      [
        new THREE.Vector3(-0.042, 0.052, -0.012),
        new THREE.Vector3(0, 0.062, -0.004),
        new THREE.Vector3(0.042, 0.052, -0.012),
      ],
      P.graphiteDark,
      'form',
    ),
  );
  return g;
}

/**
 * ROWS 11 + 6 · A STUCK OR THROWN ARROW: iron head, timber shaft, two paper fletches,
 * tip at the group's own origin so a caller only positions and rotates to land the point.
 *
 * The head is new and it is row 11's own argument: a 0.016-u shaft is under a screen
 * pixel of fill at the volley framing, so the arrow cannot carry its read in the shaft.
 * A committed iron wedge at the point is what makes it an arrow rather than a wire.
 */
export function buildArrow(len = 0.32): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    put(new THREE.CylinderGeometry(0.007, 0.009, len, 5), { pos: [0, 0, -len / 2], rot: [Math.PI / 2, 0, 0] }),
    barkMat(P.timberDark),
  );
  g.add(shaft);
  const head = new THREE.Mesh(
    put(new THREE.ConeGeometry(0.018, 0.06, 4), { pos: [0, 0, -0.026], rot: [-Math.PI / 2, 0, 0] }),
    metalMat(IRON_LIT, 0),
  );
  g.add(head);
  // TWO FLETCHES ALONG THE SHAFT, at 90° to each other. What shipped was two 0.05 × 0.045
  // plates whose thin axis ran DOWN the shaft — plates ACROSS an arrow, like a propeller —
  // and rotating one of them about that same z axis left both in the identical plane at
  // the identical z, so they z-fought over their whole overlap. A fletching is a vane
  // along the shaft: thin across, tall, and long in the direction of travel.
  const fletch: THREE.BufferGeometry[] = [];
  for (const rot of [0, Math.PI / 2]) {
    fletch.push(put(new THREE.BoxGeometry(0.0018, 0.05, 0.075), { pos: [0, 0, -len + 0.042], rot: [0, 0, rot] }));
  }
  g.add(new THREE.Mesh(mergeBoards(fletch), massMat(P.bedroll, 0)));
  return g;
}

// ---------------------------------------------------------------------------
// C9 · THE CONTACT LEDGER, AND THE ONE CALL THAT KEEPS A PROP ON THE GROUND.
//
// `contact()` retired here for a real reason — it builds a nine-stroke hatch internally at
// `pencil.ts:493` — but retiring it left the props it grounded FLOATING, because nothing
// took over the job. That was the wrong half of C9 to ship first.
//
// C9 is explicit about where the grounding lives: "a static figure's grounding is a
// painted blob in the island's own albedo, which grounds it on both sides of the curtain
// for free, because the bake is what the underdrawing derives its tone from." So a prop
// builder cannot ground its own prop — it does not know which island the prop will stand
// on. The set that PLACES it does, and every island already carries the card that takes
// these: `buildIncidentCard(rx, rz, { blobs })`, whose `blobs` are exactly
// `[x, z, heroRadius, alpha]` in card-local units, rescaled by the card itself.
//
// So the ledger is here, beside the builders it describes, and a set spends one line:
//
//   blobs: contacts([['chest', cx - CARD.x, cz - CARD.z], ['coin', …], ['mushroom', …]])
//
// The eight named radii are C9's own, verbatim, at the hero's 394 texels/unit; a radius
// here is therefore a WORLD radius of `r / 394` u, which is what makes one ledger serve
// cards of any density.
//
// THE FOUR ADDED BELOW ARE RE-DERIVED (§3.8), AND THE RATIO THAT SET THEM WAS THE DEFECT.
// They were sized by "0.195 × the prop's width × 394", which puts the blob at 0.39 of the
// prop's own footprint radius — a shadow narrower than the thing casting it. Under S3's
// ribbon card that lands the chest at **2.85 texels** and each coin at **0.68** of the
// card's 24.38 tex/u, and a 0.68-texel blob is not a blob: measured on the card's own
// canvas, the chest centre read L 0.471 against 0.670 nearby, and the coin centre read
// L 0.546 — identical to L at +2r, i.e. nothing was painted at all.
//
// §3.8's floor is 5 texels of width for a mark to read, so on the film's COARSEST card
// (the ribbon, 24.38 tex/u) a blob needs `r ≥ 2.5 · 394 / 24.38` = **40.4** hero-texels.
// But the texel floor is only half of it, and the frame at S6 t55 is what shows the other
// half: a blob whose radius equals the prop's own footprint is ENTIRELY UNDER THE PROP.
// Walked at r = the footprint half-diagonal (0.355 u for the chest): the ring that
// escapes the 0.60 × 0.38 u carcass is 0.05 u at the corners and nothing along the faces,
// and a radial gradient is already down to α 0.03 out there — the chest still read as
// floating. **The blob must be 1.5× the footprint**, so its α-0.15 core covers the
// footprint and a real penumbra falls outside it:
//   chest  0.60 × 0.38 u → half-diagonal 0.355 u × 1.5 = 0.533 u → **210**
//   coin   0.08 u disc   → 0.040 u × 1.5 = 0.060 u → **24**
// which is 13.0 and 1.5 texels on the ribbon card and 55 and 6.2 on a 512² prop card.
// The coin is still five times under the texel floor on the ribbon, which is why S3 gives
// its two spilled coins no blob of their own and lets the chest's — reaching x
// 17.47 … 18.53 around a centre at 18 — carry them. Fewer and bigger, always.
//
// The chest's ALPHA moves 0.30 → 0.40 with the radius, and it is the ledger's own top
// step rather than a new number: C9 runs 0.22–0.40 and gives 0.40 to the goblin, whose
// pool is the one contact in the film that visibly reads. Spreading a blob over 1.5× the
// footprint spreads its density with it, so at 0.30 the ring outside the chest came back
// at α 0.10 and walked at S6 t55 as a haze. The chest is the densest mass on its card and
// it takes the same step the figure does.
export const CONTACT = {
  lantern: [48, 0.3],
  signpost: [40, 0.28],
  mushroom: [19, 0.26],
  stone: [22, 0.24],
  rock: [26, 0.24],
  oak: [58, 0.26],
  pine: [50, 0.26],
  goblin: [24, 0.4],
  chest: [210, 0.4], // 0.60 × 0.38 u carcass → 0.355 u half-diagonal × 1.5
  coin: [24, 0.22], // 0.08 u spilled disc → 0.040 u × 1.5
  // S7's cairn, and it is NOT C9's `rock`: that entry is the hero's path pebble, and the
  // cairn's base stone is r 0.34 under `scale(0.82, 1, 1.18)` — a 0.56 × 0.80 u footprint,
  // half-diagonal 0.488 u × 1.5 = 0.732 u. Borrowing `rock` would have put a 0.13-u blob
  // under a 0.80-u stack, which is a shadow entirely inside its own prop.
  cairn: [288, 0.3],
  figure: [26, 0.3], // a standing adventurer, the goblin's own radius at ×1.30 height
  house: [62, 0.28], // 0.40 u square, plus the eaves' overhang
} as const satisfies Record<string, readonly [number, number]>;
export type ContactKind = keyof typeof CONTACT;

/** C9 · the blob list for `buildIncidentCard`, from `[kind, cardLocalX, cardLocalZ]`. */
export function contacts(
  items: [ContactKind, number, number][],
): [number, number, number, number][] {
  return items.map(([kind, x, z]) => [x, z, CONTACT[kind][0], CONTACT[kind][1]]);
}

// ---------------------------------------------------------------------------
// STILL EXPORTED BECAUSE SET MODULES OUTSIDE THIS FILE USE THEM, and unchanged:
//   COLUMN · STUMP — ball lists, polygonised at their own call sites
//   treeVary · nextTreeSeed — the build-order variety counter
// The tokens below are the film's committed tiers, mixed from two committed tokens each,
// and are re-exported so a set can reach the same value this file paints with rather
// than mixing its own.
// ---------------------------------------------------------------------------
export { PLANK_LIT, PLANK_SHADE, IRON_LIT, IRON_SHADE, BRASS_HASP, HOUSE_PLASTER, CAST_STEEL };
