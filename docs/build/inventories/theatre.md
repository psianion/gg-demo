# Inventory — `sets/theatre.ts` (S4, read-only audit, 2026-09-06)

Produced for W6. Facts first, main-session rulings at the end. Every row carries its grep.

**File**: 301 lines. **Imports**: `THREE`; `blobs` (`../sculpt.ts`); `P`; from `pencil.ts`: `paint, sketch, hatch, polyline,
curveLine, roughen`; from `./kit.ts`: `COLUMN, STUMP, rock, buildPine, buildOak`. **Export**: `buildTheatre()` →
`{ container, stageDisc, rope }`. **Caller**: `world.ts` only, 4th in build order. **timeline.ts**: `onlyFor(world.theatreSet,
16.5, 38)`; `stageDisc.rotation.y += π` over 2.5 s at t32.0; `rope.position.y` yoyo ×12 at t32.0. Nothing else animated.

**THE CENTRAL FACT — this file is v1 stage geometry, not the scene book's shot.** Scene book S4-B1…B6 (lines 883–1130)
specifies: the theatre island CARD + apron (new, set tier) · stage disc + kerb re-surfaced with the floorboard bake · forest
dressing merged one geometry per class as DISC CHILDREN · the mountain as ONE FLAT SHEET in a slot, reserved-paper snow
with the row-15 ladder, a drawn windward edge, a graphite brace and slot visible in the freeze · a MACHINERY SET (capstan
drum + spokes, 6 radial rails, 2 outboard counterweight booms + weights, 4 blocks; graphite only; boom rotation slaved to
`stageDisc.rotation`) · 3–4 SCRIBED ARCS on the apron bed plus one overshoot arc (FLAGSHIP 2) · an ERASER-GHOST ellipse on
the bare disc half · the rope with a fibre-streak bake. `theatre.ts` has none of these: it builds three roughened cone
peaks with `P.snow` caps, no card, no apron, no machinery, no arcs, no ghost, plain fills everywhere.

**No ground card exists.** `ground.ts` says the old planes "ran under S4's theatre… their stages now stand on paper until
their own modules build their own cards." The disc, forest and mountain sit on bare paper with no C1 skirt, no C2 rim, no
incident card, although bible row 1 lists "S4 theatre" among its 12 islands.

## TABLE 1 — PROPS

| Prop | Builder (grep) | Beat | §11.2 row | Grounded |
|---|---|---|---|---|
| stage disc + kerb | `sketch(CylinderGeometry(7, 7, 0.3, 32))` + `paint(P.platformDisc)`; kerb `CylinderGeometry(7.16, …)` + `paint(P.timber)` | B1–B6 | 1 / 8 | none |
| plank seams ×16 + joint | `polyline(...)` loop | B1–B6 | 8 | marks |
| disc rim shadow | `discShadow = hatch(13.6, 1.6, 5, 0.15, 'faint')` | | — | RETIREMENT |
| forest trees ×8 | `buildPine(r, h, 0.15, fills)` / `buildOak(…)` in `forestSpots.forEach` | B1–B3 | 5 / 6 | none |
| forest floor tone ×3 | `patch = hatch(w, d, 4, a, 'faint')` + `paint({line: P.undergrowth})` | | — | RETIREMENT |
| stumps ×2 | `sketch(blobs(STUMP, 32))` + `paint(P.timberDark)`; `rings = hatch(…)` | | 6, plain fill | RETIREMENT (rings) |
| boulders ×3 | `rock(br*2, 'faint', bx*1.9)` + `paint({fill: P.rockFace})` | | 3 | none |
| fallen trunk | `sketch(blobs(COLUMN, 26))` + `paint(P.timberDark)` | | 7, plain fill | none |
| mountain peaks ×3 | `sketch(roughen(ConeGeometry(r, h, 14, 8)))` + `paint({fill: P.stoneCool})` | B4–B6 | replaced by the flat sheet | none |
| snow caps ×3 | `sketch(roughen(ConeGeometry(r*0.42, h*0.38, …)))` + `paint({fill: P.snow})` | | 15 — wrong recipe entirely | none |
| mountain rock tone ×3 | `tone = hatch(tw, h*0.42, 7, 0.35, 'faint')` | | — | RETIREMENT |
| ridge polylines ×3 | `polyline([...], 'faint')` | | 4 contour | marks |
| scree rocks ×3 | `rock(fr*2, 'faint', fx*2.3)` + `paint({fill: P.rockFace})` | | 3 | none |
| mountain-foot pines ×5 | `buildPine(0.34, 0.9, 0.12, {tier: P.needle, trunk: P.timberDark})` | | 5 / 6 | none |
| rope: catenary tube, 6 wraps, knot, 3 frayed strands, 3-loop coil + feed line | `TubeGeometry` / `TorusGeometry` / `IcosahedronGeometry` / `CylinderGeometry` / `polyline` / `curveLine`, all `paint(P.bedroll)` | B3–B6 | 10 | none |

## TABLE 2 — RETIREMENT SITES (4, all `hatch(`)

| Line | Call | For | Replacement |
|---|---|---|---|
| 43 | `discShadow = hatch(13.6, 1.6, 5, 0.15, 'faint')` | the disc floating on paper | a real island card under the disc (row 1) with its own skirt and shadow |
| 85 | `patch = hatch(w, d, 4, a, 'faint')` ×3 | forest floor colour | the disc top's own bake carries tone; delete |
| 104 | `rings = hatch(sr*1.5, sr*1.5, 9, 0.3, 'faint')` | tree rings on the stump top | a trilayer bake on the stump; delete the hatch |
| 174 | `tone = hatch(tw, h*0.42, 7, 0.35, 'faint')` ×3 | rock shading on the peaks | the peaks are deleted with the mountain restage |

## TABLE 3 — PIGMENTS (`scripts/tritone.mjs`)

Plain fills: `P.platformDisc` #CFC0A0 0.2568 t1 (0.043) · `P.timber` 0.5835 t3 · `P.timberDark` 0.7695 t4 · `P.undergrowth`
0.5043 t3 · **`P.stoneCool` raw fill 0.4893 t3, 0.0293 from 0.46, FLAG** · `P.snow` #F2F2EC 0.0175 t0 (clear, but the recipe
is wrong: row 15 is reserved paper + the 5-value ladder `SNOW_SUN #EEF0EC · SNOW #DFE8EA · LEE_EDGE #D5E2E9 · LEE_PALE
#ACCDE6 · LEE_MID #96AAC0`) · `P.needle` 0.6760 t4 · `P.bedroll` 0.4042 t2. No `P.steel`, no `P.water`.
Crowns (`crownMat`, ratio 1): `canopy` 0.7005 / 0.5586 / 0.3856 · `canopyDeep` 0.7937 / 0.7005 / 0.5475 · `needle` 0.7423 /
0.6760 / 0.5411 — all clear. Rock (`rockFace` × bake): 0.6774 / 0.5291 / 0.8223, clear.

## TABLE 4 — KIT PORTS

Ported: `rock`, `buildPine` (lines 69, 210 — W1b), `buildOak`. Not ported / no kit: island card (`buildGroundCard` exists,
unused), stump, fallen trunk, mountain (a second hand-rolled mountain beside `cliffWorld`'s), snow (`mock/snow.ts` exists,
unused), rope (no kit), machinery (`mock/machinery.ts` exists as the class 20 mock — the port source).

## TABLE 5 — BASIS

`setView` → 0. Cameras: `cut(16.5, …)` az 90° / elev 9.9° until t30; `cam(30, 1.5, [31.5, 4.5, 6], [42, 1.0, -2])` az 142.7° /
elev 14.9°; `cam(36, 2, [43.2, 0.95, 2.1], [46.2, 0.6, 0.45])` az 151.2° / elev 5.8°. The scene book restages B3 to
`[30.5, 7.2, 7] → [42, 0.6, -2]` (≈22°); `timeline.ts` still holds the v1 move (see WT in the plan).

---

## RULINGS (main session, 2026-09-06 — these bind W6)

W6 is a REBUILD to scene book S4, split into five tasks. Each reads S4-B1…B6 in the scene book (lines 883–1130) before
touching code. Order: W6a → W6b → W6d → W6e; **W6c waits for W9** (it is the snow recipe's first instance).

**W6a — the island and the disc.** Build the theatre island as a real card: `buildGroundCard` + `buildIncidentCard`
(`groundKit.ts`) with the C1 skirt and C2 rim, sized so the rim clears the viewport at every breakpoint per S4-B3, plus
the APRON: a graphite bed band just outboard of the kerb, dark and illegible under the Performance key, legible in
Prep. The stage disc becomes a plank surface: the floorboard-family directional bake via `plankMat` / `plankKit`, ruled
silhouette kept, 16 radial kerb plank lines kept. Delete the hatch at line 43 and the three at line 85. **The disc is a
turntable**, so every prop on it stays a child of `stageDisc` and the contact blobs for those props go in the DISC's own
bake, not the island card underneath. `world.stageDisc` and `world.rope` keep their identities (timeline.ts tweens them).

**W6b — dressing materials.** Stumps and fallen trunk go through the trilayer timber route (same as W4 ruling 2); stump
rings become a bake, hatch at 104 deleted. Boulders stay. Merge one geometry per class as disc children (law 3).

**W6c — the mountain flat (after W9).** Delete the three peaks, caps, tone hatches and ridge lines. Build ONE flat sheet
standing in a slot: reserved-paper snow with the row-15 ladder from W9's kit export, blue-grey shadow strokes, a drawn
windward edge with one unfinished span (C2), and a graphite brace + slot behind it that reads in the freeze. Edge-on
from S4-B1 it is "a pencil-thin vertical line"; from B4 on it is a standing sheet. Barely painted, by design.
`P.stoneCool` leaves this file with the peaks.

**W6d — the machinery, the arcs, the ghost (FLAGSHIP 2).** Port `mock/machinery.ts`'s recipe into a kit export and
build: capstan drum + spokes, 6 radial rails, 2 outboard counterweight booms + weights, 4 blocks — graphite only, stroke
primitives + quantized tone, no paint side, no per-mesh material. Booms live under a group whose rotation is
`stageDisc`'s (child of `stageDisc`, or a group the same tween drives — same target, no second tween). On the apron bed:
3–4 authored `polyline()` / `curveLine()` scribed arcs in `graphite` / `graphiteDark`, concentric where the booms sweep,
plus ONE arc that overshoots and stops. On the bare disc half: one eraser-ghost ellipse in `graphiteLight` where a tree
once stood. Judge at S4-B5 t33.5 in Prep (this is the flagship frame) and confirm they go dark and illegible at B6 in
Performance. Phone valve: if the arcs cannot survive 390 px they demote to texture at that breakpoint.

**W6e — the rope.** Keep the geometry (catenary + 6 wraps + knot + 3 frays + coil + feed). Replace the plain `P.bedroll`
fill with a trilayer material carrying a fibre-streak directional bake (row 10, leather-family; write the bake beside
`bakeBark` in `foliageKit.ts` or in `clothKit.ts`, whichever the builder finds owns cordage — report which). The
`alive`-step on first contact (per-mesh material #7) is a `timeline.ts` change and goes to WT, not this task; the
builder makes the material `markAlive`-capable and reports the hook.

**Basis.** Every mark W6 authors uses `setView` for the shot it is judged in: B3/B4/B5 are `cam(30…)` az 142.7° / elev
14.9° (or the restaged 22° once WT lands — check `timeline.ts` at build time). Restore with `setView()` after.

**What W6 does not touch.** `timeline.ts` (camera restage, alive steps, machinery tween sharing beyond parenting) → WT.

**Post-W6d notes (2026-09-06).** `buildMachinery(opts)` (fixed parts) and `buildMachineryBooms(opts)` (the two counterweight
booms + weights + tie rods, to be parented under `stageDisc`) now live in `mock/machineryKit.ts`; the mock calls them; 1706
verts / 1143 segs identical before and after. The mock is calibrated to the film's disc (r 7 / kerb 7.16) at `scale: 1`. It
has NO scribed arcs and NO eraser ghost — W6d-wire authors those in theatre.ts. Correction: machinery is bible row **19**,
not 20 (row 20 is `board`). The machinery fill is `MeshBasicMaterial(P.graphiteLight)`, outside the trilayer, so its 0.0109
distance from the 0.30 tier boundary is NOT a law-6 case (no quantizer runs on it); no action. Basis: `sketch()` edges are
object-space, camera-independent — no `setView` bracket needed for the machinery itself; the scribed arcs and ghost ARE
view-plane marks and take `shotView(cam(30) …)`.
