# Inventory — `sets/montage.ts` (S6, t50–57.5, read-only audit, 2026-09-06)

Produced for W8. Facts first, main-session rulings at the end. Every row carries its grep.

**File**: 544 lines, 6th of 7. **Imports**: `THREE`; `blobs`; `P`; from `pencil.ts`: `PAPER, paint, fillMaterial, inkMaterial,
sketch, hatch, crossHatch, contact, polyline, curveLine`; from `./kit.ts`: `STUMP, rock, treeVary, buildRayBurst, buildChest,
buildPine, buildOak, contacts`; from `groundKit.ts`: `buildIncidentCard`. **Export**: `buildMontage()` → `{ container, roadLine,
monster, tavernSign, trees5, chest5Lid, chest5Coins, candleRays }`, all re-exposed on `world`. **timeline.ts**:
`onlyFor(world.montageSet, 49.5, 57.7)`; tweens `roadLine.scale.x`, `monster.scale`, `tavernSign.position.y`, `trees5[i].scale`,
`chest5Lid.rotation.x` + `chest5Coins.scale`; `candleRays` is never referenced.

**Cameras** (computed in `timeline.ts`'s `c5Xs.forEach`, `at = 50 + i·1.25`, alternating sides): even vignettes ≈ az 110° /
elev 20° (map 113.1/23.3, sign 107.4/10.0, chest-slot 109.1/18.1); odd ≈ az 69° / elev 15° (monster 69.7/15.5, saplings
68.0/14.6, candles 68.8/15.9). `setView` → 0 hits; no mark in the file is authored in either basis.

## CENTRAL FACTS

1. **Vignette 5 (t55–56.25) builds the wrong beat.** Scene book S6-B5 "THE NPC" (lines 1556–1579): a miniature village of 3
   gabled houses, a lane, a placement X, and a painted NPC figure on a `dieBone` base disc — "the most product-literal beat
   in the film", planting the S7/S8 token payoff. The code builds `chest5` + `hoardCard` + 2 crates (lines 443–484).
2. **The monster is a third hand copy.** Bible row 22 is PROVEN because the geometry lives in `mock/hide.ts` `buildMock()`
   (with `roughen(bulk, 0.075, 3.0, 44)`, corrected shoulder offsets +0.11/+0.26, 20 lathe segments, a 3-tier
   `createTrilayer` bucket `monsterLit / monsterHide / monsterShade`, `marksKit.mark()` shag ticks, trilayer eyes).
   `montage.ts` lines 123–296 hand-roll the PRE-fix version: no roughen, flat `P.monsterHide` Lambert fill (0.0172 from a
   boundary, FLAG), old offsets +0.05/+0.14 that `hide.ts` says rendered armless, `polyline` shag, `inkMaterial` eyes.
3. **`candleRays` draws nothing** (`buildRayBurst` stub). S6-B6 wants lathe-tongue flames + `buildGlowSprite` amber radials
   and per-mesh alive materials #11–#13. No flame geometry exists; `timeline.ts`'s case 5 is empty.
4. **The road is the ember box the book forbids.** S6-B1: "re-surfaced as an inked road stroke, not an `ember` box".
   Code: `sketch(BoxGeometry(1.8, 0.02, 0.12))` + `paint({fill: P.ember})`.
5. **Missing S6-B1 props**: fence-post carpenter's pencil (hero item #5 rescaled), brush + pigment pot (hero item 6, its one
   on-camera use), and the draughting-mark set shared across all six islets (dimension ticks / arrows / an X per vignette).
   `quill` / `inkpot` are the old props.
6. **No islet is a ground card.** Six bare `sketch(CylinderGeometry)` + `paint(P.platformDisc)` discs with a `hatch()` ring and
   a banned `contact()` under each (×6). `buildIncidentCard` is used once (the hoard), stacked on a plain disc.
7. Retirement grep → 9 hits: **7 live** (45 ring ×6, 49 contact ×6, 323 crossHatch, 408 mound, 420 stumpRings, 471 hoardTone,
   526 written5), 2 comments (162, 445).

## TABLE 1 — PROPS (abridged)

Platforms ×6 (+rim, ring hatch, contact) · map table + 4 legs · map sheet (PAPER), coastline `curveLine`, 2 weight stones
(`rock`), inkpot, quill · road box (`P.ember`) · monster (bulk lathe, shag ×7, arms, mitts, claws, horn nubs, eyes, maw, tusks)
· wall fragment + 4 planks + plinth · shuttered window (`caveDark` fill + `crossHatch` + frame) · bracket, brace, scroll curl
(`P.iron`) · tavern sign (plank, border, mug device `P.tavernCloth` FLAG 0.0031, hooks + chain links) · mound hatch · stump
+ rings hatch · trees5 (2 `buildPine` line 435 + 1 `buildOak`) · chest5 + hoardCard (`buildIncidentCard` + `contacts`, the
only grounded group) + hoardTone hatch + 2 crates · candle table + leg + 3 candles (`P.candle`, holders `P.brass` FLAG
0.0141) + book + written5 hatch · `candleRays` stub.

## TABLE 3 — PIGMENTS (all raw fills, no bakes)

Clear: `platformDisc` 0.2568 t1 · `timber` · `timberDark` · `rockFace` · `caveDark` · `gobTooth` 0.0403 t0 · `ember` 0.3809 t2 ·
`flameCore` · `plank` · `iron` · `candle`. **FLAGS**: `monsterHide` #8B6D47 0.6372 t4 (0.0172) · `stoneCool` 0.4893 (0.0293) ·
`stoneWarm` 0.4546 (0.0054) · `tavernCloth` #AC9570 0.4569 (0.0031) · `brass` 0.4741 (0.0141). No `P.steel`, `P.water`, `P.snow`.

## TABLE 4 — KIT PORTS

Ported: `buildChest`, `buildPine` / `buildOak`, `rock`, `buildIncidentCard` + `contacts` (hoard only). Everything else is plain
`sketch()` + `paint()` Lambert: platforms, map table set, road, the whole monster, the wall/window/sign assembly, mound,
stump, crates, candle table and candles, book.

---

## RULINGS (main session, 2026-09-06 — these bind W8)

W8 is a REBUILD to scene book S6-B1…B7 (lines 1438–1689), split into six tasks. Each reads its beat first.
Order: W8a → W8b → W8c → W8d → W8f; **W8e waits for W2** (the NPC is a cast-kit figure) and pairs with WT.

**W8a — six islet cards.** Replace each plain disc with `buildGroundCard` + `buildIncidentCard` (C1 skirt, C2 rim, C9 blobs
for every prop standing on it via `contacts`, adding `CONTACT` kinds at the END of the table only). Delete the ring hatch
and the `contact()` under each (12 live sites → 0). Keep the platform positions and the `world.*` identities the timeline
tweens. Frames: each vignette at its `at + 0.6`, Performance and Prep.

**W8b — the draughting-mark set (shared).** One kit export (put it in `marksKit.ts`) that draws the margin marks the book
names at every vignette: dimension ticks, a small arrow, a placement X, in `graphite` / `graphiteDark`, authored in EACH
vignette's own basis (`setView(az, elev)` from the table above, restored after). Fewer and bigger (§3.7). Never 'faint'.

**W8c — the monster.** Delete lines 123–296. Lift `mock/hide.ts`'s `buildMock()` recipe into an exported kit builder
(`buildMonster` in a new `mock/hideKit.ts` or in `kit.ts`; report which and why), make `mock/hide.ts` call it, then call
it here with the same scale/position and the `world.monster` identity kept. The 3-tier bucket, roughen, corrected
shoulders, `marksKit` shag and trilayer eyes come with it. Basis: vignette 1's az 69.7° / elev 15.5°. `P.monsterHide` is
never a flat fill again.

**W8d — vignettes 1, 3, 4 surfaces.** (1) Road: an inked road stroke as per-mesh material #10 (a drawn stroke whose
`scale.x` the timeline still tweens — keep `world.roadLine` pointing at it), not a box; add the carpenter's pencil
(hero item #5 rescaled — read `hero.ts` for it) and the brush + pigment pot (hero item 6); the quill and inkpot go.
(3) Window: delete the `crossHatch`, keep the `caveDark` fill, add drawn slat lines; sign device: `P.tavernCloth` → a
committed cloth/plank mix that clears (measure with `scripts/tritone.mjs`); brackets `P.iron` → `IRON_LIT / IRON_SHADE`.
(4) Mound and stump rings → painted tone in the islet bake / a timber bake; hatches deleted. All fills through the
trilayer via kit materials (same rule as W4 ruling 2).

**W8e — vignette 5, the NPC beat (after W2, with WT).** Delete the chest, hoard and crates. Build: three gabled houses
(`buildHouse` from `kit.ts`), a lane (the inked-stroke idiom from W8d), a placement X (W8b's mark), and the NPC: a
cast-kit figure (`buildFigure` / `garmentMaterial`, `clothKit.ts`) standing on a `dieBone` base disc, painted. The
`world.chest5Lid` / `chest5Coins` fields and their tweens retire → WT removes the tweens; W8e renames the exports
(`world.npc5`, `world.village5`) and updates `world.ts`'s composition lines only.

**W8f — vignette 6, the candles.** Three lathe-tongue flames + amber glow sprites from `fire.ts` (`buildFlames` /
`buildGlowSprite` — check which exports exist), replacing the stub; `world.candleRays` keeps its identity as the glow
group so WT can wire the alive steps #11–#13. Book page → row 16 scribble rows (the kit export W5 lifts; if W5 has not
landed, lift it here — never a second copy). `P.brass` holders → `BRASS_HASP`.

**Untouched:** `buildPine` at line 435 (W1b); `timeline.ts` (WT: chest tweens out, candle alive steps in).

**RULING 7 (added after W3c, 2026-09-06) — `candleRays`.** Same as pathProps ruling 6: `buildRayBurst` now builds an impact.
W8f replaces the call with the fire kit's glow, keeping the `world.candleRays` identity for WT's alive steps.

**Post-W8c notes (2026-09-06).** `buildMonster(opts)` now lives in `mock/hideKit.ts` (recipe verbatim, 1071 verts / 84 segs
identical before and after); `monsterLit` / `monsterShade` are exported from there. It reads `marksKit`'s live basis, so
W8c-wire brackets the call with `setMarksView(69.7°, 15.5°)` … `setMarksView()`. TWO law-6 flags on a PROVEN row:
`monsterLit` #AB9471 triTone 0.4613 t3, **0.0013** from 0.46; `monsterHide` #8B6D47 0.6372 t4, 0.0172 from 0.62. **P0l**
re-mixes both toward a committed partner until each clears 0.03 while keeping its tier (Lit t3, Hide t4, Shade t4 — row 22's
t4/t4 adjacency is legal because the shag separates them), records the change in row 22, and does not touch the geometry.
The shag ticks are `'faint'` weight: W8c-wire measures their on-screen px at t51.9 (§3.7: under ~2 px is a ghost) and reports.
