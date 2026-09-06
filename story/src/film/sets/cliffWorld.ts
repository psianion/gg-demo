import * as THREE from 'three';
import * as P from '../palette.ts';
import { paint, sketch, polyline, curveLine, roughen } from '../pencil.ts';
import {
  buildRayBurst,
  buildBolt,
  buildArrow,
  buildMushroom,
  buildHouse,
  buildPine,
  buildOak,
  contacts,
  CAST_STEEL,
} from './kit.ts';
import {
  buildGroundCard,
  buildIncidentCard,
  buildRiver,
  buildStrataCliff,
  strataBands,
  strataBandUV,
  strataMaterial,
  fieldPatch,
  fieldMaterial,
  mark,
  mergeRocks,
  rockMaterial,
  silhouette,
  cliffEdge,
  MASSIF_BANDS,
} from '../mock/groundKit.ts';

// §3.6 — CONTOUR MARKS ARE AUTHORED IN THE SHOT'S VIEW PLANE, and the shot here is not
// the hero's. `?mock=strata` draws the crown's and the scree's silhouettes against
// `plankKit.VIEW_CAM` (azimuth 18°, elevation 33° — the hero island's own lens), which is
// correct for a route judged at that lens and wrong the moment the same geometry stands
// in the film: every camera that sees this cliff sits WEST of it and above — S2 at
// (102, 1.6, 2.2), S3 at (114.4, 7.2, 3.0), S7 at (117.5, 7.4, 3.2). Walked at S2 with
// the hero's vector, the crown rock's contour ran as a loose dark ELLIPSE across the
// plateau with no edge under it, because it is the outline that lens would have seen.
// This is that bearing, normalised: west, up, and a little +z, which is the mean of the
// three and inside 25° of all of them.
const CLIFF_VIEW = new THREE.Vector3(-0.8, 0.4, 0.45).normalize();
import { buildBoard } from './board.ts';
import { setView, shotView } from '../mock/foliageKit.ts';

// C6 — cliff + miniature world (flattened during the rise) + C7 die2/board.
//
// ============ THE ROW-4 PORT, AND WHAT IT REPLACED ==================================
//
// This set is the film's bookend asset — S1, S2 and S7, ONE build, TWO eras — and until
// now it was three roughened `CylinderGeometry` drums with a six-patch `hatch()` field
// laid across the plateau. The whole landform is now `groundKit.buildStrataCliff()`,
// which is `?mock=strata`'s own build lifted into the kit so the route and the film
// cannot drift: seven closed lathe bands at 72 segments, every band DoubleSide, radii
// NON-MONOTONIC so the silhouette steps, CLIFF_RX 5.4 / CLIFF_RZ 4.6, top y 6.0, roughen
// 0.05 → 0.18 rougher downward, band 7 growing to 1.16 because a cliff foot spreads into
// its own talus, tiers 2·4·2·3·4·2·3, the plateau's own ground card, the rim contour
// with its authored 102° gap, six boundary arcs, sixteen section cut marks on stoneWarm,
// nine measure ticks, a merged rock crown and a graded talus scree.
//
// ============ ROW 4's RADII DO NOT FIT THE SHIPPED BLOCKING — MEASURED, OPENLY ======
//
// THIS IS A DEVIATION FROM ROW 4 AND IT IS STATED HERE RATHER THAN AMENDED INTO THE
// BIBLE. Row 4 gives `CLIFF_RX 5.4 · CLIFF_RZ 4.6`, and `?mock=strata` is judged READY at
// those numbers — beside the hero island, on bare paper, with no blocking around it. The
// film's blocking pins the landform between TWO fixed points that row 4 was never solved
// against, and they are 9.6 u apart where row 4's cliff needs 11.92. Both come out of
// `timeline.ts`, which this set does not own, and both are reproducible by hand:
//
//   WEST — the plateau's near lip must stand at x 116.80. timeline.ts stages the goblin
//   at x 117.40, y 6 for the whole of S2, the shipped three-drum plateau put its west lip
//   at 116.80, and the 0.60 u stand-off that leaves is what makes him readable: the lens
//   sits at (102, 1.6, 2.2), the plateau top is flat, so a figure Δd past the lip is
//   buried below the ray `6.0 + Δd·(6.0−1.6)/(lip−102)`. At Δd 0.60 that ray reaches
//   y 6.18 and ~77 % of a 0.744-u goblin stands against sky. At row 4's own radius
//   centred anywhere that keeps the east side clear, Δd is 2.88, the ray reaches 7.01,
//   and HE IS COMPLETELY OCCLUDED at the film's largest cast beat.
//
//   EAST — the talus foot must end by x 125.5. He leaps the far side at t8.4–9.5 and
//   lands at x 126.5, y 0, where S4's cut and the whole of S5 (t10.2–16.5, the film's ONE
//   close-up, six seconds of it) play out. Row 4's foot half-width is
//   5.4 × 1.16 × lobe(0) = 6.437, so a cliff whose west lip is at 116.80 puts its east
//   foot at 128.72 and the goblin lands, gets up, dusts himself off and delivers the
//   film's only close-up INSIDE THE ROCK.
//
//   THE SPAN: 5.4 × 1.012 × lobe(π) + 5.4 × 1.16 × lobe(0) = 5.483 + 6.437 = 11.920 u
//   against the 8.70 u the blocking leaves. Uniform radial scale s = 8.70 / 11.920 =
//   0.72987 → CLIFF_RX 3.941, CLIFF_RZ 3.357, landform centre x 120.802. TOP y STAYS 6.0
//   (he stands on it) and the scale is RADIAL ONLY, so every other row-4 number is
//   untouched: seven bands, 72 segments, DoubleSide, the non-monotonic radii, the ≥8 %
//   overlaps, the 2·4·2·3·4·2·3 tier sequence, roughen 0.05→0.18 in WORLD units (the
//   builder divides by rx, so the break is the same 0.05–0.18 u it was), band 7 growing
//   into its own talus, the six boundary arcs, the sixteen cut marks, the nine ticks.
//
// WHAT IS OPEN: 5.4 and 3.941 cannot both be right. Either the bible's radii move to the
// blocking's 3.94/3.36, or timeline.ts's leap and S5 staging move east by ~3.2 u and the
// party/goblin solve at S2 is re-measured against a lip at 114.5. That is a decision for
// whoever owns the blocking and the table; this file ships the film that works and states
// the number it had to move and how anyone re-derives it. `?mock=strata` still renders at
// the bible's 5.4/4.6 — the defaults are unchanged — so the route proves the row and the
// film proves the row at the one scale the blocking allows.
const CLIFF_S = 0.72987;
const CLIFF_RX_FILM = 5.4 * CLIFF_S; // 3.941
const CLIFF_RZ_FILM = 4.6 * CLIFF_S; // 3.357

// `cliff` stays at world x = 120 because timeline.ts addresses the bolt, the two thrown
// arrows and the three impacts in THIS group's local frame, and those numbers are
// shipped (`boltThrow(5.0, [-7.6, 4.3, 0.8], [-2.6, 6.05, -1.1], …)`). The landform sits
// at +0.802 inside it, which is the 120.802 solved above.
const LAND_DX = 0.802;

export function buildCliffWorld() {
  const container = new THREE.Group();

  const cliff = new THREE.Group();
  cliff.position.set(120, 0, 0);

  // ---- the landform ---------------------------------------------------------------
  const land = buildStrataCliff(CLIFF_VIEW, CLIFF_RX_FILM, CLIFF_RZ_FILM);
  land.root.position.x = LAND_DX;
  cliff.add(land.root);

  /** A point in the landform's own frame, expressed in this group's. */
  const at = (x: number, y: number, z: number) => new THREE.Vector3(x + LAND_DX, y, z);
  /** A point on the landform's outline, expressed in this group's frame. */
  const rim = (a: number, rr: number, y: number) => {
    const p = cliffEdge(a, rr, y, CLIFF_RX_FILM, CLIFF_RZ_FILM);
    p.x += LAND_DX;
    return p;
  };

  // ---- battle remains ---------------------------------------------------------------
  //
  // Dressing for the restaged open (S1/S2) and the thing C6 has to read as tended away.
  // Visible by default — timeline.ts hides it for the C6 redress at t57.5.
  //
  // The rim dressing lives on the NEAR (west) lip, not the far one: a figure or a mark on
  // the far edge of a flat plateau is occluded by its own top face from any camera below
  // the rim, so S2's low wide can only read what sits on the lip closest to the party.
  // Placed by `cliffEdge` rather than by hand, so the marks follow the plan-form's lobes
  // instead of sitting on a circle the landform does not have.
  const remains = new THREE.Group();
  for (const [a, rr, y, rx, ry, rz] of [
    [172, 0.80, 6.02, -Math.PI / 2 + 0.4, 0.5, 0.1],
    [190, 0.84, 6.03, -Math.PI / 2 + 0.25, -0.4, -0.15],
  ] as [number, number, number, number, number, number][]) {
    const arrow = buildArrow(0.34);
    arrow.position.copy(rim(a, rr, y));
    arrow.rotation.set(rx, ry, rz);
    remains.add(arrow);
  }
  // Stuck in the near cliff face, angled well off the face normal on purpose: S2 looks at
  // this face almost head-on, and a shaft pointing straight out of it foreshortens to a
  // dot. These read as strokes. `buildArrow` puts its HEAD at the group origin and runs
  // the shaft back along −z, so the origin goes at rr 0.955 — inside the band's own radius
  // by ~0.07 u, which buries the head and still clears roughen's ±0.14 u of wander.
  //
  // THE SHAFTS RUN OUT OF THE ROCK, and the shipped rotations ran them INTO it. The
  // Euler is XYZ, so `rotation.y` turns the arrow's own −z axis to
  // (−sin y, 0, −cos y) before `rotation.x` tips it: at the shipped y = −π/2 + 0.85 that
  // resolves to (+0.85, +0.25, −0.46), i.e. the shaft buried eastward and only the head
  // proud — walked at S2 and all three were a dot or nothing. Adding π to each turns the
  // shafts west, out of the face, and the x tips them down: a spent arrow drooping out of
  // the rock, which is the stroke S2 needs.
  for (const [a, y, rx, ry, rz] of [
    [168, 5.0, 0.5, Math.PI / 2 + 0.85, 0],
    [194, 4.1, -0.35, Math.PI / 2 - 0.7, 0.1],
    [180, 3.2, 0.62, Math.PI / 2 + 0.55, -0.08],
  ] as [number, number, number, number, number][]) {
    const arrow = buildArrow(0.62);
    arrow.position.copy(rim(a, 0.955, y));
    arrow.rotation.set(rx, ry, rz);
    remains.add(arrow);
  }
  // Dropped kit — a small round shield, left where it fell, resting ON the talus apron at
  // r 1.00 / y 0.26 rather than on the page beside it. Band 7 is a real surface with a
  // real angle of repose, so the apron itself cuts the shield's lower edge and grounds it;
  // there is no ground-card albedo at the foot of the cliff for a C9 blob to be painted
  // into, and inventing one for a 0.24-u prop would be a twelfth island nobody asked for.
  //
  // CAST_STEEL, not raw `steel` — the same move as `sets/ambush.ts`. `P.steel #B1BAC2`
  // computes `triTone` 0.2986 with the ±0.03 world-noise interval [0.2686 … 0.3286]
  // STRADDLING the t1/t2 boundary at 0.30, so a dropped shield drew half its face in one
  // tier and half in the next. `CAST_STEEL` clears the boundary; see the note in kit.ts.
  const shield = new THREE.Group();
  const shieldDisc = sketch(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12), 25, 'form');
  paint(shieldDisc, { fill: CAST_STEEL });
  shield.add(shieldDisc);
  const shieldBoss = sketch(new THREE.SphereGeometry(0.03, 8, 6), 30, 'faint');
  shieldBoss.position.y = 0.02;
  paint(shieldBoss, { fill: P.iron });
  shield.add(shieldBoss);
  shield.rotation.set(0.22, 0.4, 0);
  shield.position.copy(rim(186, 1.0, 0.26));
  remains.add(shield);

  // C9 / ROW 13 · THE REMAINS' OWN GROUND. `crossHatch()` retired with the rest of §11.2's
  // 31 sites, and row 13 names the replacement by hand: "scorch is painted DARK POOLING,
  // never crosshatch." A pool is `caveDark` mixed into the ground's own albedo, which is
  // exactly what `bakeIncidentCard`'s blob list already paints — so the two rim scorches
  // and the trample become blob clusters on an ordinary incident card, and the two rim
  // arrows take real C9 contacts on the same card at the same time.
  //
  // Three blobs per scorch, not one: a radial gradient alone is a clean disc, and a burn
  // is not. Radii are in the C9 ledger's hero-texels — 0.36 u of pool is 142, 0.22 u is 87
  // — and on this card's 512² over 2·rx = 3.0 u (170.7 tex/u) they land 62 and 38 texels
  // of radius, an order over §3.8's 5-texel floor. α runs 0.34 / 0.26, inside C9's own
  // 0.22–0.40 ladder, with `caveDark` the token row 13 gives scorch.
  const CARD = { x: -2.5, z: 0.0, r: 1.5 };
  const scorchPool = (px: number, pz: number, s: number): [number, number, number, number][] => [
    [px - CARD.x, pz - CARD.z, 142 * s, 0.34],
    [px - CARD.x + 0.28 * s, pz - CARD.z - 0.19 * s, 87 * s, 0.26],
    [px - CARD.x - 0.21 * s, pz - CARD.z + 0.24 * s, 87 * s, 0.26],
  ];
  const remainsCard = buildIncidentCard(CARD.r, CARD.r, {
    spine: null,
    wear: false,
    blobs: [
      ...scorchPool(-2.9, -0.5, 1),
      ...scorchPool(-3.3, 0.9, 0.78),
      ...contacts([
        ['stone', rim(172, 0.8, 0).x - LAND_DX - CARD.x, rim(172, 0.8, 0).z - CARD.z],
        ['stone', rim(190, 0.84, 0).x - LAND_DX - CARD.x, rim(190, 0.84, 0).z - CARD.z],
      ]),
    ],
  });
  remainsCard.position.copy(at(CARD.x, 6.0, CARD.z));
  remains.add(remainsCard);
  cliff.add(remains);

  // ---- C6's "fixed" state ------------------------------------------------------------
  //
  // A small talus cairn and three mushrooms at the rim, in the over-the-shoulder
  // foreground. Hidden by default — timeline.ts reveals it at t57.5.
  //
  // Flat stones, not boulders. `rock()` is a metaball blob, and five blobs of decreasing
  // size stacked dead on one axis read as a soft-serve swirl at the C6 over-shoulder
  // distance. These use the landform's own band technique instead — a low, few-sided,
  // roughened drum — so each stone has facets and a flat top and the stack silhouette
  // reads as slabs. Every one offset, spun and tilted off its neighbour: the axis is what
  // made the old one a swirl.
  const tended = new THREE.Group();
  tended.visible = false;
  // [x, y, z, radiusTop, radiusBottom, height, spin, tilt, squash] — landform frame
  // Landform-local, and every WORLD x is the one the shipped C6 over-the-shoulder was
  // framed on (121.99 …) — the cairn did not move, the ground under it did.
  const cairnStones: [number, number, number, number, number, number, number, number, number][] =
    [
      [1.188, 6.07, -0.6, 0.3, 0.34, 0.14, 0, 0.05, 0.82],
      [1.248, 6.2, -0.56, 0.25, 0.29, 0.12, 0.9, -0.08, 1.18],
      [1.158, 6.32, -0.64, 0.215, 0.245, 0.13, 1.9, 0.07, 0.86],
      [1.228, 6.44, -0.57, 0.175, 0.2, 0.11, 0.5, -0.05, 1.14],
      [1.198, 6.56, -0.62, 0.12, 0.155, 0.12, 2.4, 0.08, 0.9],
    ];
  cairnStones.forEach(([x, y, z, rt, rb, h, spin, tilt, squash], i) => {
    const stone = sketch(
      roughen(new THREE.CylinderGeometry(rt, rb, h, 9, 3), 0.05, 9, x * 4 + i * 1.7),
      34,
      i < 2 ? 'form' : 'faint',
    );
    stone.position.copy(at(x, y, z));
    stone.scale.set(squash, 1, 2 - squash); // no stone is round in plan
    stone.rotation.set(tilt, spin, i % 2 === 0 ? -tilt * 0.9 : tilt * 0.7);
    paint(stone, { fill: P.stoneCool });
    tended.add(stone);
  });
  // caps in threes, never symmetric (art bible) — offsets and scale both stay irregular
  const tendedMushrooms: [number, number, number, number][] = [
    [0.898, -1.4, 1.0, 1],
    [1.148, -1.15, 1.15, 0.85],
    [0.748, -1.6, 0.9, 1.05],
  ];
  tendedMushrooms.forEach(([x, z, s, sy]) => {
    const m = buildMushroom();
    m.scale.set(s, s * sy, s);
    m.position.copy(at(x, 6.0, z));
    tended.add(m);
  });

  // ============ C9 · THE S7 GROUNDING, AND WHY IT MEASURED ZERO =======================
  //
  // This card is unchanged — the same `buildIncidentCard`, the same C9 ledger, the same
  // 512² over 2·rx = 2.8 u at 183 texels/unit, the same four blobs at the same card-local
  // coordinates. What changed is THE SURFACE UNDERNEATH IT, and that was the defect.
  //
  // The previous pass measured 0.0000 luminance depression at the cairn foot and
  // 0.0051 / 0.0002 / 0.0050 at the three toadstools, and ruled out five causes live: not
  // the wrong card, not the UV or the scale (the cairn blob measures 133.7 texels of
  // radius = 0.731 u, exactly the ledger's 288 hero-texels, α 0.302 at centre falling
  // linearly to 0 at 0.732 u), not the props standing off their blobs, not
  // paint-after-upload, not occlusion or depth. All five are correct and all five are
  // beside the point:
  //
  //   C9's α is an ALBEDO-MIX fraction. `trilayer.ts:549` takes `triAlbedo` immediately
  //   AFTER `map_fragment`, so a blob only exists as a value once it has an albedo to be
  //   mixed into. The card's own bake is `spine: null, wear: false` — 100 % transparent
  //   except the blobs — so it has none of its own, and it was laid over a plateau that
  //   was a `sketch()` LAMBERT drum: no map, no trilayer, no albedo. The blob's only
  //   remaining currency was render-time opacity, spent as 0.30 of `caveDark` over a
  //   surface already at L 0.13 under a lens 13.4° above its own ground. There was no
  //   contrast left for it to use, which is why the same mechanism measures
  //   0.2727 against 0.4576 on S3's ribbon card and 0.0003 here: S3's card sits on a
  //   GROUND CARD and this one sat on a drum.
  //
  //   Row 4 supplies the missing half by construction. `buildStrataCliff` gives the
  //   plateau `groundDisc()` — the film's one meadow painting, a trilayer with a real
  //   baked albedo — so this card is now the ordinary `propGround` configuration that
  //   nine mock classes already stand on, and the blob is an albedo mix again.
  //
  // The obvious fix — giving THIS bake a base pigment — was built, walked and rejected on
  // the previous pass, and it stays rejected: solving the base for the plateau's measured
  // value (`cardL = 0.6958·L(base) + 0.0969`) matches at one point and misses everywhere
  // else, because a roughened Lambert cap swings 0.10 … 0.19 across this footprint and a
  // flat disc cannot follow it. A grounding that BRIGHTENS is worse than none. The answer
  // was never the card. It was the ground.
  const tendedCard = buildIncidentCard(1.4, 1.4, {
    spine: null,
    wear: false,
    blobs: contacts([
      ['cairn', 1.188 - 1.018, -0.6 + 1.08],
      ['mushroom', 0.898 - 1.018, -1.4 + 1.08],
      ['mushroom', 1.148 - 1.018, -1.15 + 1.08],
      ['mushroom', 0.748 - 1.018, -1.6 + 1.08],
    ]),
  });
  tendedCard.position.copy(at(1.018, 6.0, -1.08));
  tended.add(tendedCard);
  cliff.add(tended);

  // ---- projectile kit — row 23, hidden by default, animated by timeline.ts ------------
  // These stay in the GROUP's frame, not the landform's: timeline.ts owns their numbers.
  const bolt = buildBolt();
  bolt.position.set(-11.6, 1.2, 1.6);
  // S2 watches this cross ~11 units from 15 units out, so the 0.45 streak was a speck.
  // Scaled up and laid back along the arc, so the tail trails down and behind the flare.
  bolt.scale.setScalar(2.4);
  bolt.rotation.set(-Math.PI / 2, 1.2, 0);
  cliff.add(bolt);
  const arrows2 = [
    [-11.2, 1.4, -1.2],
    [-11.6, 1.1, 0.9],
  ].map(([x, y, z]) => {
    const a = buildArrow(0.3);
    a.visible = false;
    a.position.set(x, y, z);
    cliff.add(a);
    return a;
  });
  // §4.4 basis fix (W3c-fix2): the volley's three throws (t5.0/5.9/6.3/6.6) and the
  // first two impacts (`impacts[0]` ~t5.6-5.95, `impacts[1]` ~t6.9-7.45) all fall inside
  // `cam(4)`'s window (t4-7.5) — `cut(7.5)` doesn't start until AFTER both have fired and
  // only ever shows `impacts[2]` (popped t8.1-8.3). T-BASIS (`scripts/measure/basis-check.mjs`)
  // proved the local `shotView` this file used to carry (az = atan2(camZ-tgtZ, camX-tgtX))
  // is 90° off the kits' own convention; use the shared helper instead (§4.4).
  const CAM4_VIEW = shotView([102, 1.6, 2.2], [117.4, 3.8, 0.2]); // timeline.ts cam(4)
  const CUT75_VIEW = shotView([114.4, 7.2, 3.0], [117.6, 6.4, 0]); // timeline.ts cut(7.5)
  // §3.7/row-23 screen size, W3c-fix3 (2026-09-06): W3c-fix2's corrected basis (cam(4) for
  // impacts[0]/[1], cut(7.5) for impacts[2]) left the OLD scales (5.0/5.0/1.8, tuned against
  // the wrong basis) overshooting row 23's 5-10 px @500 spall floor by 2-3x. Node-measured
  // UNSCALED (scale=1) spall @500 (`scripts/measure/w3c-impact-crossings.mjs`):
  // impacts[0] 3.63-5.89 px, impacts[1] 3.77-6.13 px, impacts[2] 11.40-18.53 px. Admissible
  // scale interval per impact, so both the shortest (0.16 u) and longest (0.26 u) tick land
  // inside 5-10 px @500 (s_min = 5/shortest, s_max = 10/longest):
  //   impacts[0] [1.379, 1.697] -> chosen 1.5   impacts[1] [1.326, 1.631] -> chosen 1.5
  //   impacts[2] [0.438, 0.540] -> chosen 0.5
  // Chosen = interval midpoint rounded to 1 decimal. Re-measured @500 at these scales: spall
  // 5.44-8.84 / 5.66-9.19 / 5.70-9.27 px (all inside 5-10; strike 8.5/8.8/8.9 px, well clear
  // of row 23's 0.83 px "grey ghost" floor). Crossings unchanged at 0 for all three.
  const impactViews = [
    { ...CAM4_VIEW, scale: 1.5 },
    { ...CAM4_VIEW, scale: 1.5 },
    { ...CUT75_VIEW, scale: 0.5 },
  ];
  // PLACEMENT, W3c-fix4 (2026-09-06). The shipped offsets sat on the goblin's own standing
  // point (cliff-local -2.6, 6, 0): impacts[2]'s strike + spall projected onto or behind his
  // robe so only the flash read (FINDINGS W3-V4, frames `w3c-verify3-08/10`) and impacts[1]'s
  // flash crossed his face (W3-V5). Re-sited once, for all three, against the ACTUAL cliff
  // meshes: `node --experimental-strip-types scripts/measure/w3c-site-search.mjs` ray-casts
  // from each impact's own shot camera and prints unoccluded surface hits with their px gap
  // from the goblin's crouched silhouette. Chosen hits (cliff-local, ON the surface):
  //   impacts[0] (-2.126, 5.177, -1.824) west face, gap 38.9 px, dist 133.4 px
  //   impacts[1] (-2.326, 4.989, -1.401) west face, gap 27.0 px, dist 120.1 px
  //   impacts[2] (-1.891, 6.000, -2.345) plateau top, gap 40.3 px, dist 163.9 px
  // Each burst then stands 0.05 u off its surface toward ITS shot camera, so the strike and
  // spall clear the rock the way the flash already did: final = site + 0.05 * normalize(
  // camLocal - site), camLocal = cam(4) [-18, 1.6, 2.2] for 0/1, cut(7.5) [-5.6, 7.2, 3.0]
  // for 2 (camera world minus the cliff group's own (120, 0, 0)).
  // Reproduce: node -e "const S=[[-2.126,5.177,-1.824],[-2.326,4.989,-1.401],[-1.891,6,-2.345]],
  //   C=[[-18,1.6,2.2],[-18,1.6,2.2],[-5.6,7.2,3]];S.forEach((s,i)=>{const d=C[i].map((c,k)=>c-s[k]),
  //   L=Math.hypot(...d);console.log(s.map((v,k)=>+(v+0.05*d[k]/L).toFixed(3)).join(', '))})"
  // Bases and scales above are CLOSED (verify 3) and are untouched by this round.
  const impacts = [
    [-2.173, 5.166, -1.812],
    [-2.374, 4.979, -1.39],
    [-1.919, 6.009, -2.305],
  ].map(([x, y, z], i) => {
    const burst = buildRayBurst(x, y, z, impactViews[i]);
    cliff.add(burst);
    return burst;
  });

  container.add(cliff);

  // =====================================================================================
  // THE MINIATURE WORLD — rows 1, 2 and 21
  // =====================================================================================
  //
  // ROW 1 GIVES S7's MINIATURE A GROUND CARD, and until now it had none: eight houses,
  // twelve trees, six painted fields, two roads and a river all stood on BARE PAPER, which
  // is why the last minute of the film read as a diagram of a world rather than a world.
  // It is the ordinary island — the same skirt formula, the same rim contour with its own
  // unfinished span, the same meadow painting as the camp and the ribbon — because §11.1's
  // one sentence is only true if this is the same ground as everywhere else.
  //
  // Sized off the props rather than off a shape: they run x 131…168 and z −17…+17, and the
  // west rim has to clear the cliff's own talus apron (which reaches x 128.5) with paper
  // between them, because between places there is paper.
  const MINI = { x: 151, z: 0, rx: 21, rz: 20 };
  const mini = buildGroundCard(MINI.rx, MINI.rz, { gap: [214, 118] });
  mini.root.position.set(MINI.x, 0, MINI.z);
  container.add(mini.root);

  const miniWorld: THREE.Group[] = [];

  const housePositions: [number, number][] = [
    [134, -3],
    [138, 6],
    [144, -6],
    [150, 14],
    [156, -14],
    [162, 4],
    [168, -8],
    [135, 10],
  ];
  // two houses, scattered, get ember roofs as the eye's landing points
  const emberRoofs = new Set([2, 5]);
  housePositions.forEach(([x, z], i) => {
    const h = buildHouse(emberRoofs.has(i) ? P.ember : P.timberDark);
    h.position.set(x, 0, z);
    container.add(h);
    miniWorld.push(h);
  });

  const pinePositions: [number, number][] = [
    [131, 4],
    [134, -8],
    [137, 12],
    [140, -3],
    [143, 8],
    [146, -16],
    [149, 2],
    [152, -17.5],
    [155, 10],
    [158, -4],
    [161, 14],
    [166, -10],
  ];
  // §4.4 basis: judged under timeline.ts's cam(58.5, 3.5, [128,26,8], [146,2,0]) — the S7
  // wide shot that holds the miniature world (and its trees) in frame.
  const vMini = shotView([128, 26, 8], [146, 2, 0]);
  setView(vMini.az, vMini.elev);
  pinePositions.forEach(([x, z], i) => {
    // the miniature's woods are mixed too — a map key has both tree glyphs on it
    const p =
      i % 4 === 3
        ? buildOak(0.24, 0.48, { canopy: P.canopyDeep, trunk: P.timberDark })
        : buildPine(0.18, 0.5, 0.05, { tier: P.canopyDeep, trunk: P.timberDark });
    p.position.set(x, 0, z);
    container.add(p);
    miniWorld.push(p);
  });
  setView(); // hand the hero's lens back

  // ROW 2 · the miniature's incident card, carrying the C9 contact for every prop that
  // stands on it — eight houses and twelve trees.
  //
  // §3.8 SIZES THIS CARD AND NOT TASTE. A blob has to clear 5 texels of radius to exist,
  // so on a card of half-width rx the smallest ledger entry in use (`pine` 50 hero-texels)
  // needs `size ≥ 5 · 394 / 50 · 2 · rx` = 8 · 21 = 331 … which rounds up to the row's own
  // 512² only if nothing smaller is asked for. At 1024² over 2 · 21 = 42 u the card runs
  // 24.4 texels/unit — S3's ribbon density exactly, the coarsest card the film ships and
  // the one C9's radii were re-derived against — and `house` 62 lands 3.8 texels of
  // radius, `pine` 50 lands 3.1 and `oak` 58 lands 3.6.
  //
  // ponytail: THOSE THREE ARE UNDER §3.8's FLOOR and are shipped that way deliberately,
  // because the two honest alternatives are both worse. Inflating the radii would break
  // the C9 ledger, which is the film's ONE grounding scale and is what makes twelve
  // islands read as one commute; going to 2048² spends 16 MiB to move a 0.16-u mark from
  // 3.8 texels to 7.7 on props whose own footprint is 0.40 u. The mark is soft rather
  // than absent — it is a mass, which is all row 2 asks a card at this density to carry —
  // and the upgrade path, if the top-down beat ever needs a harder contact, is a per-
  // CLUSTER blob (fewer and bigger, §3.8's own law) rather than a bigger bake.
  const miniBlobs = contacts([
    ...housePositions.map(
      ([x, z]) => ['house', x - MINI.x, z - MINI.z] as ['house', number, number],
    ),
    ...pinePositions.map(
      ([x, z], i) =>
        [i % 4 === 3 ? 'oak' : 'pine', x - MINI.x, z - MINI.z] as ['oak' | 'pine', number, number],
    ),
  ]);
  const miniCard = buildIncidentCard(MINI.rx, MINI.rz, {
    spine: null,
    wear: false,
    size: 1024,
    blobs: miniBlobs,
  });
  miniCard.position.set(MINI.x, 0, MINI.z);
  container.add(miniCard);

  // ---- the massif — row 4's recipe at a quarter of the argument, row 15's cap ---------
  //
  // The one landmark on the miniature. A bare cone flattens into a bare disc, so it is
  // built as row 4's own lathe stack: four bands on the SAME strata material and the same
  // plan-form lobe as the cliff, radii non-monotonic so the flank ledges, tiers 2·4·2·3.
  // It stays a Group so the flatten tween takes the whole massif down together.
  //
  // THE CAP IS LEFT ALONE. `src/film/mock/snow.ts` (row 15) is three rounds in and not
  // signed off, and it exports only its own `buildMock()` — a whole mock scene, not a
  // drape a set can call — so there is nothing here to port. The snow cone below is
  // EXACTLY as it shipped: `sketch()` + `P.snow`, channel G, outside the trilayer. When
  // row 15 lands a callable drape this is the one line that changes.
  const mountain = new THREE.Group();
  mountain.position.set(160, 0, 0);
  for (const band of strataBands(MASSIF_BANDS, 2.0, 1.9, { seed0: 60, uRepeat: 2 })) {
    mountain.add(band);
  }
  // THE CAP IS ROW 15's AND IT IS NOT REBUILT — same `sketch()`, same `P.snow`, same
  // `roughen`, same 'faint'. What changed is its RADIUS, because row 4's stack is fatter
  // than the single cone it used to sit on: walked at t59.8, the shipped 0.85 × 1.2 cone
  // was entirely INSIDE the rock (the massif's flank is r 1.16 at y 1.8 against the
  // snow's 0.85) and the film's only snow simply did not exist on screen. A cone caps a
  // taper only if its own taper is at least as steep, so this one is solved against the
  // stack's: the rock runs r 0.20 @ y3.0 → 1.10 @ y2.15, i.e. 1.06 per unit; this cone is
  // 1.42 over 1.35 = 1.05 per unit from a base 0.35 u wider, which stands proud by
  // 0.07–0.09 u the whole way up against roughen's ±0.07.
  const massifSnow = sketch(roughen(new THREE.ConeGeometry(1.42, 1.35, 14, 5), 0.07, 2.0, 42), 25, 'faint');
  massifSnow.position.y = 1.95 + 1.35 / 2;
  paint(massifSnow, { fill: P.snow });
  mountain.add(massifSnow);
  // two subsidiary shoulders, on the massif's own painting — the bake's block 3 (rockFace,
  // t3) against the flank's t2 at that height, so a shoulder never merges into the band
  // behind it
  for (const [sx, sz, sr, sh] of [
    [-1.5, 1.4, 0.9, 1.5],
    [1.7, -1.1, 0.75, 1.2],
  ] as [number, number, number, number][]) {
    const geom = roughen(new THREE.ConeGeometry(sr, sh, 11, 6), sr * 0.15, 1.8, sx * 3);
    strataBandUV(geom, 3, 2);
    const shoulder = new THREE.Mesh(geom, strataMaterial());
    shoulder.position.set(sx, sh / 2, sz);
    shoulder.castShadow = true;
    mountain.add(shoulder);
  }
  // three ridge lines off the summit — the massif's drawn half, and all that it has: the
  // `hatch()` tone patch that used to sit on the south flank retires with §11.2's 31.
  // three ridge lines, and they START AT THE SNOW LINE (y 2.0) rather than at the summit:
  // row 15's drawn state is reserved paper, so a contour drawn across the cap would be
  // the one mark that class is not allowed.
  for (const a of [0.4, 2.1, 4.0]) {
    mountain.add(
      polyline(
        [
          new THREE.Vector3(Math.cos(a) * 1.06, 2.0, Math.sin(a) * 1.06),
          new THREE.Vector3(Math.cos(a + 0.1) * 1.45, 1.2, Math.sin(a + 0.1) * 1.45),
          new THREE.Vector3(Math.cos(a + 0.2) * 1.95, 0.05, Math.sin(a + 0.2) * 1.95),
        ],
        'faint',
      ),
    );
  }
  // and its own foot of scree, the same graded spill the cliff's talus takes — one draw
  const massifScree = mergeRocks(
    [0.5, 1.7, 2.9, 4.2, 5.4].map((a, i) => ({
      r: 0.16 + (i % 3) * 0.05,
      seed: 80 + i,
      pos: [Math.cos(a) * 2.1, 0.06, Math.sin(a) * 2.1] as [number, number, number],
      rotY: a * 1.3,
    })),
  );
  mountain.add(
    new THREE.Mesh(massifScree, rockMaterial(P.rockFace)),
    silhouette(massifScree, CLIFF_VIEW, P.graphiteDark, 0.03),
  );
  container.add(mountain);
  miniWorld.push(mountain);

  // ---- roads, drawn rather than ruled -------------------------------------------------
  // Two edges make a road; one line makes a boundary. Both run off the card's own rim at
  // each end, so a road that leaves the island leaves it rather than stopping in a field.
  const roadA: [number, number][] = [
    [129, 0], [138, -1.4], [146, -3.2], [154, -2.0], [163, 0.4], [173, 2],
  ];
  const roadB: [number, number][] = [
    [133, 17], [142, 12.2], [150, 10], [158, 12.4], [165, 17],
  ];
  for (const road of [roadA, roadB]) {
    for (const side of [-0.34, 0.34]) {
      container.add(
        curveLine(
          road.map(([x, z]) => new THREE.Vector3(x, 0.028, z + side)),
          'form',
          28,
        ),
      );
    }
  }

  // ---- the river — row 14 --------------------------------------------------------------
  //
  // `mock/water.ts`'s own build, lifted into the kit and handed this spine: the flat band
  // in `BOARD_WATER` (triTone 0.1061 → TIER 0, bare paper under the curtain by construction),
  // two banks carrying the GROUND class's dabs at the meadow's own 4-u repeat, a darker
  // cut bank one committed step down, clustered lit dabs in `paper` at 0.7α, and one
  // 'form' shore edge per side in `graphiteDark` sampled off the ribbon's own offset.
  //
  // That retires the six `hatch()` water patches this file used to lay along the meander.
  // Row 14 is explicit and it is arithmetic, not taste: raw `water #679FB4` computes
  // `triTone 0.462` = TIER 3, a dense two-pass graphite field where a pencil leaves bare
  // paper, and it is BANNED as a fill anywhere in the film.
  //
  // The spine is a lazy meander and it has to be: a ribbon offset by `d` FOLDS wherever
  // the curve's radius of curvature is smaller than `d`. Max offset here is
  // 0.85 + 0.70 = 1.55 u against turns of ~14 u radius. Both ends run off the card's rim,
  // so `ends: false` — a cut section belongs where a river stops, not where it leaves.
  const river = buildRiver(
    new THREE.CatmullRomCurve3(
      ([
        [129.5, -5.5], [137, -9], [144, -11.5], [151, -13.5], [158, -15], [165, -14.5], [172, -10.5],
      ] as [number, number][]).map(([x, z]) => new THREE.Vector3(x, 0, z)),
    ),
    // 1.1 u of channel and 0.45 u of bank, walked down from 1.7 / 0.70: at the wider
    // numbers the reach measured 4.5 u across a 42-u island and read as a canal — a
    // constant-width ruled strip, which is the one thing row 14 says water must not be.
    { width: 1.1, bank: 0.45, y: 0.024, ends: false },
  );
  container.add(river);

  // ---- worked ground — row 21 -----------------------------------------------------------
  //
  // From directly overhead this is most of the picture. Six flat cards on ONE material,
  // their tint block picked by the UV out of `bakeFieldWash`'s three — `fieldA` t2,
  // `fieldB` t2, `fieldC` t3, cycling so consecutive fields never repeat — separated by
  // hedge polylines in `canopyDeep`, which is the row's own separator and the reason two
  // adjacent t2 fields are still two fields under the curtain.
  //
  // The `hatch()` till pass that used to sit on each field retires here: the furrows are
  // in the wash's own 200 dabs per block, laid on ONE direction at 43 texels/unit, which
  // is a ploughed grain rather than a second stroke family arriving through the albedo.
  const fields: [number, number, number, number, number][] = [
    [136, -4, 7, 5, 0.3],
    [143, 2, 6, 5.5, -0.5],
    [151, -7, 7.5, 5, 0.15],
    [157, 6, 6.5, 6, -0.25],
    [164, -3, 6, 5, 0.45],
    [142, 12, 6.5, 4.5, -0.15],
  ];
  fields.forEach(([fx, fz, fw, fd, fa], i) => {
    // ONE HOLDER, ONE TRANSFORM: the wash and the hedge are the same ring stated twice,
    // and parenting them removes the second copy of the maths rather than correcting it.
    // The shipped build placed the fill, the till hatch and the outline three times over,
    // and solved the outline's corners in world space with the opposite sense of `fa` to
    // the meshes' Euler, so every field's ink sat rotated the wrong way off its colour.
    //
    // AND THE FIELDS ARE POLYGONS, NOT QUADS. Walked at t59.5 as six hard-edged pale
    // parallelograms lying on the meadow like decals — which is verbatim the judgement
    // `mock/field.ts` already answered ("Land does not have vertices… make the field
    // boundaries irregular"), arriving again by a different door. `fieldPatch` is that
    // answer for a scattered field: a 16-point ring ±9 % off true, fan-triangulated, with
    // the hedge sampled from the ring's own points.
    const field = new THREE.Group();
    field.rotation.y = fa;
    field.position.set(fx, 0.026, fz);
    container.add(field);

    const { geom, ring } = fieldPatch(fw, fd, i % 3, 11 + i * 7);
    field.add(new THREE.Mesh(geom, fieldMaterial()));
    // the hedge: row 21's own separator, in `canopyDeep`, at 'form' rather than 'faint' —
    // at the top-down framing this line is 0.9 device px of the whole miniature and a
    // faint weight is not on the page at all
    field.add(
      mark(
        ring.map((p) => new THREE.Vector3(p.x, 0.004, p.z)).concat([
          new THREE.Vector3(ring[0].x, 0.004, ring[0].z),
        ]),
        P.canopyDeep,
        'form',
      ),
    );
  });

  const { die2, board } = buildBoard();
  container.add(die2, board);

  return { container, miniWorld, cliff, die2, board, remains, tended, bolt, arrows2, impacts };
}
