# Inventory — `sets/tavern.ts` (read-only audit, 2026-09-06)

Produced for W7. Facts only; every row carries its grep. Nothing here is a design decision.

**File**: `src/film/sets/tavern.ts` — 492 lines.

**Imports**: `THREE`; `dieFaces` (`../dieGeometry.ts`); `blobs` (`../sculpt.ts`); `P` (`../palette.ts`);
`PAPER, paint, fillMaterial, sketch, rays, hatch, crossHatch, contact, numeral, polyline` (`../pencil.ts`);
`COLUMN, buildFlames, buildAdventurer, buildFinger` (`./kit.ts`). No import from any `mock/*Kit.ts`, no `setView`.

**Callers**: only `world.ts` (`buildTavern()`); `timeline.ts` reads `tavernSet` (`onlyFor(world.tavernSet, 38, 49.9)`),
`dieInner`, `nudgeFinger`, `dieTipAngle`. No other set references this module.

**Shot**: one `cut(38, [80, 2.1, 6.2], [80, 1.0, 0])` (`timeline.ts`, grep `cut(38`) covers the whole S5-B2→B8 span
t38–49.9. Azimuth 90°, elevation ≈ 10.06°. Two `cam(` eases move within that cut (grep `cam(38.3` and `cam(46.5`).
The scene book's S5-B2 describes a different establishing move; code is what ships.

## TABLE 1 — PROPS

`grep -n "propGround\|contacts(" src/film/sets/tavern.ts` → 0 hits: nothing uses the proven grounding pipeline.
Grounded legend: **contact()** = shadow only via the banned singular `contact()`; **none** = nothing under it.

| Prop | Builder (grep) | Beats / t | §11.2 row | Grounded |
|---|---|---|---|---|
| floor plane | `const floor = new THREE.Mesh` (PlaneGeometry 12×22, fillMaterial) | S5-B2→B8 t38–49.9 | 8 plank (floorboard) | n/a, it is the ground |
| floorboard seams ×15, butt joints ×6 | `for (let i = 0; i <= 14; i++)`, `butt joints, staggered` | same | 8 plank | marks |
| back wall, wing walls ×2 | `const wall = sketch`, `const wing = sketch` | same | 8 plank | vertical |
| framing posts ×4, beams ×2 | `const postW = sketch`, `const beam = sketch(new THREE.BoxGeometry(12, ph` | same | 7 timber / 8 plank (plain Box, not a limb) | vertical |
| wall bay plaster tone | `const bay = hatch(2.5, 2.4, 3, 1.2` | same | nearest idiom `HOUSE_PLASTER` (`sets/kit.ts`) | RETIREMENT |
| window (frame/mullions/sill) | `const win = new THREE.Group` | same | row 12 EXCLUDES it (the window's absence of glass is by design) | n/a |
| window night fill | `const nightFill = new THREE.Mesh` | same | — | n/a |
| window cross-hatch | `const night = crossHatch` | same | — | RETIREMENT |
| hearth breast, hearth stone | `const breast = sketch`, `const hearthStone = sketch` | same | no masonry row; `stoneWarm` | none |
| hearth mantel | `const mantel = sketch` | same | 8 plank | n/a |
| firebox fill | `const fireBoxFill = new THREE.Mesh` (`P.caveDark`) | same | 13 fire | none |
| firebox cross-hatch | `const fireBox = crossHatch` | same | 13 fire | RETIREMENT |
| hearth logs ×2 | `const hearthLogMass = sketch` (uses `COLUMN`) | same | 7 timber | none |
| hearth fire | `const hearthFire = buildFlames(1)` | same | 13 fire — ported, keep | n/a |
| shelf | `const shelf = sketch` | same | 8 plank | wall-mounted |
| bottles ×5 (body+neck, 10 meshes) | `bottleSpecs.forEach` | same | 14 water — raw `P.water` fill, BANNED | none |
| table top, lip, leg, foot, seams ×6 | `const tableTop = sketch` … `for (const oz of [-1.2` | same | 8 plank | none |
| table wear | `const tableWear = hatch` | same | 8 plank (wear is channel D of plank's own recipe) | RETIREMENT |
| table shadow | `const tableShadow = contact(3.0, 2.2)` | same | — | contact() RETIREMENT |
| die + dieInner + 20 numerals | `const built = dieFaces`, `const dieInner = sketch` | tumble t38–40, tips t~44.5 | unique asset (`dieGeometry.ts`) | rests on table |
| nudge finger | `const nudgeFinger = buildFinger()` | t42.4–45.4 | 22 skin (kit.ts comment `ROW 22`) | hovers |
| DM, player1, player2 | `const dm = buildAdventurer(false, { fill: P.cloakIndigo })` etc. | S5-B2→B8 | 9 cloth | none |
| mugs ×3 + handles | `mugOffsets.forEach` | same | no pottery row; `stoneWarm` | none |
| character sheets ×3 | `sheetSpots.forEach` | same | 16 paper props | n/a |
| sheet "writing" | `const written = hatch(0.24, 0.17, 22, 0, 'faint')` | same | 16 — row bans tone fill on sheets | RETIREMENT |
| pencil stub | `const pencilStub = sketch` | same | 8 plank nearest | n/a |
| DM screen ×3 panels | `const screen = new THREE.Group` | same | 16 paper props, but painted `P.tavernCloth` (a row-9 token) | none |
| screen "printed tables" | `const printed = hatch(0.22, 0.24, 12, 0, 'faint')` | same | 16 — same ban | RETIREMENT |
| tankard + handle + foam | `const tankard = sketch` | same | no row; `tavernCloth`/`candle` tokens | none |
| candle dish, candlestick, shaft | `const candleDish = sketch`, `const candlestick = sketch` | same | 11 metal (`P.brass`) | none |
| candle flame | hand-rolled ConeGeometry + `P.flameCore` | same | 13 fire — NOT via `buildFlames` | n/a |
| candle rays | `const candleSetRays = rays(8, 0.05, 0.13, 'faint')` | same | 13 fire / 23 marks — the film's one live `rays()` | RETIREMENT |
| benches ×3 | `const buildBench =` | same | 8 plank | contact() RETIREMENT |
| door (slab, 3 planks, 2 bands, knob) | `const door = new THREE.Group` | same | 8 plank · bands 11 metal (`P.iron`) · knob 11 metal (`P.brass`) | none |

Note on the cast: `buildAdventurer` (`sets/kit.ts`) holds `RETIRED_CLOAKS = {cloakIndigo, cloakCrimson}` and silently
replaces the requested `P.cloakIndigo` with `CAST_CLOAK[i % 3]` = `cloakUmber #6A5138 t4 / cloakOiled #808272 t3 /
cloakRoad #D7C5A3 t1`, chosen by a module-level counter `castSeq` shared across every set in build order. Which figure
gets which cloak depends on how many `buildAdventurer(` calls precede it film-wide.

## TABLE 2 — RETIREMENT SITES (9)

`grep -n "hatch(\|crossHatch(\|contact(\|rays(" src/film/sets/tavern.ts`

| Line | Call | Visually for | Proven replacement (plan §4.7) |
|---|---|---|---|
| 98 | `bay = hatch(2.5,2.4,3,1.2,'faint')` | plaster tone in wall bays | delete; tone is the trilayer's. Idiom: `tri('plaster', HOUSE_PLASTER, {wear:0.24, dir:0.55})` as in `buildHouse` (`sets/kit.ts`) |
| 115 | `night = crossHatch(1.12,1.12,7)` | dark behind the window | delete; a flat `P.caveDark` fill like `fireBoxFill` |
| 156 | `fireBox = crossHatch(1.2,1.15,9)` | firebox darkest value | delete the hatch, keep the `caveDark` fill; glow comes from `buildFlames` |
| 228 | `tableWear = hatch(0.9,0.6,7,0.4,'faint')` | tabletop wear | trilayer `wear` parameter (as `plankMat` in `sets/kit.ts`); delete |
| 241 | `tableShadow = contact(3.0,2.2)` | stain under the table | `propGround` blob via `contacts([...])` |
| 351 | `written = hatch(0.24,0.17,22,0,'faint')` | writing on a sheet | row 16's scribble bake (`bakeScribbleRows`, currently local to `mock/paperprop.ts` → lift into a kit) or contact shadow + ink rule |
| 379 | `printed = hatch(0.22,0.24,12,0,'faint')` | printed tables on the screen | same as 351 |
| 439 | `candleSetRays = rays(8,0.05,0.13,'faint')` | candle glow | `fire.ts` via `buildFlames` (already imported); delete `rays()` |
| 459 | `b.add(contact(len * 1.1, 0.5))` in `buildBench` | stain under each bench | `propGround` blob via `contacts([...])` |

## TABLE 3 — PIGMENTS

Script: `scratchpad/inv-tavern/tritone-tavern.mjs` (exact piecewise sRGB; `enc(lum(ink)) = 0.15266`).
`grep -n "0x\|mixHex" src/film/sets/tavern.ts` → 0: every fill is a raw `P` token or `PAPER`. No material carries a
map, so albedo = `material.color`. **Seven tokens sit inside the 0.03 clearance — law 6 breaches when used raw.**

| Pigment | Hex | triTone | Tier | Dist to boundary | Flag |
|---|---|---|---|---|---|
| `P.floorboard` | #B98E52 | 0.4694 | 3 | 0.0094 | < 0.03 |
| `P.plank` | #A9895E | 0.5043 | 3 | 0.0443 | |
| `P.timberDark` | #6A5138 | 0.7695 | 4 | 0.1495 | |
| `P.skyDusk` | #6D78AE | 0.5965 | 3 | 0.0235 | < 0.03 |
| `P.stoneWarm` | #A9967A | 0.4546 | 2 | 0.0054 | < 0.03 |
| `P.caveDark` | #3F3226 | 0.9199 | 4 | 0.2999 | |
| `P.water` (bottles, lines 198 & 202) | #679FB4 | 0.4618 | 3 | 0.0018 | < 0.03 AND banned by row 14 |
| `P.timber` | #94795A | 0.5835 | 3 | 0.0365 | |
| `P.dieBone` | #ECE2CA | 0.0923 | 0 | 0.0477 | |
| `P.cloakIndigo` (requested; never renders, see note) | #4D5A9E | 0.7281 | 4 | 0.1081 | |
| `P.tavernCloth` | #AC9570 | 0.4569 | 2 | 0.0031 | < 0.03 |
| `P.candle` | #F4E8C8 | 0.0626 | 0 | 0.0774 | |
| `P.brass` | #B0913F | 0.4741 | 3 | 0.0141 | < 0.03 |
| `P.flameCore` | #F7EFD2 | 0.0313 | 0 | 0.1087 | |
| `P.rayGold` (line colour) | #A88E3E | 0.4943 | 3 | 0.0343 | |
| `P.iron` | #7D8590 | 0.5520 | 3 | 0.0680 | |
| `PAPER` | #F7F5F0 | 0.0000 | 0 | 0.1400 | |

Committed mixes that already exist for these classes: `PLANK_LIT`, `PLANK_SHADE`, `IRON_LIT`, `IRON_SHADE`, `BRASS_HASP`,
`HOUSE_PLASTER`, `CAST_STEEL` (exported from `sets/kit.ts`); `CLIFF_LIT`, `CLIFF_SHADE`, `STONE_SHELF`, `BOARD_WATER`
(`mock/groundKit.ts`). `BOARD_WATER` is being re-mixed under P0e for its own clearance.

## TABLE 4 — KIT PORTS

| Class | Kit that builds it | tavern.ts uses it? |
|---|---|---|
| planks / boards / benches / tables | `plankKit.ts` (`bakeGrain`, `boardUV`, `boxRun`, `merge`, `put`) + `plankMat` in `sets/kit.ts` (`tri('plank', token, {wear:0.24, dir:1.42, map: safeBake(bakeGrain)})`) | NO — all hand `sketch()`+`paint()`, flat Lambert, no grain map, no `PLANK_LIT/SHADE` |
| table + bench assembly | recipe lives ONLY inside `mock/plank.ts` `buildMock()` (grep `the table and its bench`) | NO — lift into `plankKit.ts`, then call from both |
| grounding | `groundKit.ts` `propGround` + `contacts` | NO |
| fire | `fire.ts` via `buildFlames` | hearth YES; candle flame NO (hand cone + `rays()`) |
| cast | `clothKit.ts` via `buildAdventurer` | YES for DM/players |
| marks | `marksKit.ts` | only indirectly via `buildFinger`/`buildAdventurer`; die numerals use `numeral()` from `pencil.ts` |
| paper props | no kit; `bakeScribbleRows` is local to `mock/paperprop.ts` | NO — hand `hatch()` |
| metal | `metalMat` (private, `sets/kit.ts`) + exported `IRON_LIT/IRON_SHADE/BRASS_HASP` | NO — raw `P.iron`/`P.brass` |

## TABLE 5 — BASIS

`grep -n "setView" src/film/sets/tavern.ts` → 0. The file has no view-plane basis wiring; its marks are authored per
call site in local planes. Shot camera is the single `cut(38, …)` above (az 90°, elev ≈ 10°).
