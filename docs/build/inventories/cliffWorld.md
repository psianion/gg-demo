# Inventory — `sets/cliffWorld.ts` (S1/S2 + S7, read-only audit, 2026-09-06)

Produced for W3. Facts first, main-session rulings at the end. Every row carries its grep.

**File**: 648 lines, last of 7 in build order. **Imports** from `groundKit.ts`: `buildGroundCard, buildIncidentCard, buildRiver,
buildStrataCliff, strataBands, strataBandUV, strataMaterial, fieldPatch, fieldMaterial, mark, mergeRocks, rockMaterial,
silhouette, cliffEdge, MASSIF_BANDS`; from `./kit.ts`: `buildRayBurst, buildBolt, buildArrow, buildMushroom, buildHouse,
buildPine, buildOak, contacts, CAST_STEEL`; `buildBoard` from `./board.ts`. **Export**: `buildCliffWorld()` →
`{ container, miniWorld, cliff, die2, board, remains, tended, bolt, arrows2, impacts }`.

**timeline.ts**: `cliffSet` visible [0, 16.5) and [57.0, ∞); `bolt` / `arrows2` / `impacts` thrown at t5.0 / 5.9 / 6.3 / 6.6,
`impacts[2]` popped t8.1 / 8.3, `impacts[0]` reused as dust at t9.5; `remains` → `tended` swap at t57.5; `die2` and `board`
from t62. Cameras that look at the cliff: `cam(4, …)` az 172.6° / elev −8.1°; `cut(7.5, …)` az 136.8° / 10.3°;
`cut(57.5, …)` az 149.9° / 0°; `cut(58.0, …)` az 149.8° / 7.2°; `cam(58.5, …)` az 156° / 50.6°; `cam(62, …)` top-down.
S2 (`cam(4)`) vs S7 (`cut(58.0)`) differ by 47.6° measured from the plateau top.

**THE CENTRAL FACTS.**
1. The landform is already ported: `buildStrataCliff` / `strataBands` from `groundKit.ts`. `grep -n "hatch(\|crossHatch(\|contact(\|rays("`
   → 5 hits, ALL inside comments; zero live calls. `P.water` is not used (the river takes `BOARD_WATER` inside `buildRiver`).
2. The open defects live in `groundKit.ts`, not this file: `CLIFF_BANDS` row 7 ships radius factor **1.16** while the comment
   two lines above it says "GROWS to 1.040+" and the bible says 1.040; boundary arcs are `Math.max(rBot, nextTop) * 1.045`
   (1.045× the LARGER radius) not 1.03× each band's own; **13 of 16** section cuts cross the band-6/7 arc (reproduced in node
   from the literal angles); step depth at the six boundaries is 0.4–1.4% of rx (the "brick" silhouette).
3. **`impacts` draw nothing.** The three S1 volley impacts are `buildRayBurst(...)`, which `kit.ts` retired to an empty
   scale-0 group. `timeline.ts` animates invisible objects at t5–9.5.
4. Scene-book props that do not exist: S7-B1 "one painted god-ray cone" and S7-B2 "god-ray cones ×2" (`rayGold`, hard
   stop, never a soft falloff); S7-B2 "eraser-ghost #4 of 4: the erased scorch-ring beside the cairn, `graphiteLight`".
5. Scale: the bible's `CLIFF_RX / RZ` 5.4 / 4.6 are the mock's; the film ships 3.941 / 3.357 (`CLIFF_S = 0.72987`) forced by
   `timeline.ts`'s blocking. The header discloses this and punts.
6. Toadstool/cairn grounding: `tendedCard` carries `contacts([['cairn', …], ['mushroom', …]×3])`; the header argues the old
   ~0 depression is fixed by the plateau now having a baked `groundDisc()`, but cites only the OLD measurement. Unverified.
7. `CLIFF_VIEW` is a `Vector3` fed to `silhouette()` (view-dependent contour runs), not the `setView` mark basis. Three
   uses: cliff crown, talus scree, massif scree. No shot-specific silhouette exists.

## TABLE 1 — PROPS (abridged; full detail in the agent report)

Landform: 7 strata bands + plateau disc, 16 cuts, 6 boundary arcs, open rim contour (102° gap), 9 measure ticks, rock crown
(3 merged blobs), talus scree (14 merged) — all `groundKit`. Rim arrows ×2 + drooping ×3 (`buildArrow`). Dropped shield
(hand: `CylinderGeometry` `CAST_STEEL` + `SphereGeometry` `P.iron`, deliberately ungrounded, "a twelfth island"). `remainsCard`
(scorch pools + 2 stone contacts, `buildIncidentCard`). Cairn: 5 hand-rolled roughened drums `paint(P.stoneCool)` — raw,
FLAG 0.0293, `COOL_ROCK` exists and is unused. 3 mushrooms (`buildMushroom`). `tendedCard`. Bolt (`buildBolt`, scale 2.4),
2 `arrows2`, 3 `impacts` (stub). MiniWorld: `buildGroundCard(21, 20)`, 8 houses (`buildHouse`), 12 trees (9 `buildPine` at
line 420 + 3 `buildOak`), `miniCard` 1024², massif (`strataBands(MASSIF_BANDS, …)`), massif snow cap (`sketch` cone
`P.snow`, deferred to W9 by design), 2 shoulders, 3 ridge polylines, massif scree, 2 hand-rolled roads (`curveLine` double
edge, no kit), river (`buildRiver`), 6 fields (`fieldPatch`). `buildBoard()`.

## TABLE 3 — PIGMENTS (flags only; full table in the agent report)

Strata bake stroke tints inside 0.03: `CLIFF_SHADE` lit stroke #A1937C 0.0134 · `CLIFF_LIT` base #C4B599 **0.0094** ·
`CLIFF_LIT` dark stroke #A1937B 0.0137 · `P.rockFace` dark stroke #747464 0.0136 · `P.stoneWarm` base #A9967A **0.0054** ·
`P.stoneWarm` lit stroke #C4B498 0.0131 · `P.graphiteLight` ticks 0.0109 (a stroke) · raw `P.stoneCool` cairn 0.0293.
Clear: `P.earth`, `CLIFF_SHADE` base, `STONE_SHELF` ×3, `ROCK_LIT` (0.0327, close), `BOARD_WATER` 0.0339, `CAST_STEEL`,
`P.iron`, `P.ember`, `P.canopyDeep`, `P.snow`.

---

## RULINGS (main session, 2026-09-06 — these bind W3)

**Scope ruling.** Sizes are dynamic per shot (P0). The film's 3.941 / 3.357 radii are legitimate; the bible's 5.4 / 4.6 are
the mock's. The binding content of row 4 is the CONSTRUCTION (band count, radius RATIOS between bands, arc rule, cut
rule, step rule), not absolute radii. W3a records this in the bible as a clarification, no number "corrected".

**W3a — strata rules in `groundKit.ts` (node first, then frames).** Files: `groundKit.ts` (`CLIFF_BANDS`, `MASSIF_BANDS`,
the arc/cut construction inside `buildStrataCliff`) and the bible row 4. (1) Band 7's factor → 1.040 as the bible and the
kit's own comment state; the 1.16 is undisclosed drift. (2) Boundary arcs → 1.03 × EACH BAND'S OWN radius (the bible's
rule), one arc per boundary as today. (3) Re-count the cut/arc crossings in node after (1) and (2); the target is the
row-4 rule (read it: cuts and arcs are two mark sets on one face and must not cross as a family). If crossings remain,
the fix is where the cuts START and STOP (a cut is a section line between arcs, not through them), never a hatch;
report the count before/after. (4) The stepping silhouette: read row 4's stated step rule; if the bible names a ratio,
meet it; if it only says "reads as stepped", sweep the step depth (radius discontinuity as % of rx) until the step is
≥ 3 device px at S1 t6 AND ≥ 3 px at S7 t58.5 at 1440×900, report the ratio you land on, and write it into row 4 with the
measurement. Bands' relative order and count do not change. Frames at S1 t6 and S7 t58.5, both rigs.

**W3b — cairn, toadstools, ghost.** Cairn drums → `mergeRocks` / `rockMaterial(COOL_ROCK)` (kit rock, committed mix),
keep the five-slab silhouette. Re-measure the toadstool and cairn grounding with a FRESH luminance depression readout
at S7 t58.5 (the header's claim is unverified). Add eraser-ghost #4: the erased scorch ring beside the cairn in
`graphiteLight`, one ellipse, on the tended card's drawn layer. Frame at S7 t58.5 zoom 2.5, both rigs.

**W3c — the impacts (row 23).** Replace the three `buildRayBurst` stubs with row 23's impact: a permanent strike stroke
(0.25 u, ramps up, never down), 4 spall ticks at per-tick angles, 3 spindle flashes at 0.35 u, authored in the SHOT's view
plane (`cut(7.5)` az 136.8° / elev 10.3° for the volley), `graphiteDark` for matter, one family per mark set, never
'faint'. Port the recipe from `mock/marks.ts` into `marksKit.ts` exports and call them from `kit.ts`'s builder so the
route and the film share it. Keep the `impacts` array's identity and length (timeline drives it). Frames at t6.3 and
t8.2. Also the bolt's towed `curveLine` arc and the `instanceCount` ramp: confirm they exist and work, report.

**W3d — god-ray cones.** S7-B1 one cone, S7-B2 two: painted `rayGold` cones with a HARD stop (no soft alpha falloff),
Performance only. Read scene book S7-B1/B2 for placement. If no kit idiom exists, build them as `MeshBasicMaterial`
cones the way `fire.ts` builds its sprite geometry, and report the material choice.

**W3e — S2 vs S7 silhouette.** `silhouette()` contours are view-dependent. Build TWO contour groups for the cliff crown and
scree, one from `cam(4)`'s view for S1/S2 and one from `cut(58.0)`'s view for S7, both children of `cliff`, exported as
`cliff.userData.contoursS1` / `contoursS7`. Both visible by default; WT toggles them at t57.0. Report the two view
vectors used.

**Untouched by W3:** the massif snow cap (W9), `buildPine` at line 420 (W1b), `timeline.ts` (WT), the mini-world houses,
river, fields (already kit; W10 judges continuity).

**W3f (added after W3c, 2026-09-06) — the bolt's towed line.** Row 23: the bolt "tows a `curveLine()` arc whose
`instanceCount` ramps up as it flies: the read is the line the head is drawing, not the head." `buildBolt` in `kit.ts` builds
only the head and one contour; no trail exists in the film (`mock/marks.ts` has a static demo only). W3f adds the towed arc
to `buildBolt` (kit export, shared with the route) with an `instanceCount` the timeline can ramp; the ramp tween itself is
WT's. Basis `cut(7.5)`. After W3c's frames.

**PRNG note.** W3c made six previously-empty `buildRayBurst` calls draw real strokes, so every hand-wobble downstream of
`pathProps` re-rolled. Any pixel-exact measurement taken before 2026-09-06 in ground / theatre / tavern / montage /
cliffWorld is stale; construction rules are unaffected.
