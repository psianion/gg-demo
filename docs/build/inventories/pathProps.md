# Inventory — `sets/pathProps.ts` (read-only audit, 2026-09-06)

Produced for W5. Facts only, then the main session's rulings at the end. Every row carries its grep.

**File**: 441 lines. **Imports**: `THREE`; `P`; from `pencil.ts`: `paint, fillMaterial, sketch, hatch, crossHatch,
contact, curveLine`; from `./kit.ts`: `trunkOf, rock, buildRayBurst, buildFlames, buildChest, nextTreeSeed, lobedCrown,
buildRaven, buildMushroom`. No direct `mock/*Kit.ts` import. **Caller**: only `world.ts` (`buildPathProps()`), which runs
BEFORE `buildGround()`.

**Shot**: one `cut(16.5, [2.5, 1.1, 3.2], [2.5, 0.7, 0.9])` (`timeline.ts`, grep `cut(16.5`) drives the whole C2 run
t17–30, covering every prop here including the S4 mushroom and signpost beats. Azimuth ≈ 90°, elevation ≈ 9.9°.
`ground.ts` already holds this basis as `C2_AZ` / `C2_ELEV`. `pathProps.ts` never calls `setView` (grep → 0) and builds
before `ground.ts` sets the basis, so its marks are authored at the hero's lens.

## TABLE 1 — PROPS

| Prop | Builder (grep) | Beat / t | §11.2 row | Grounded today |
|---|---|---|---|---|
| campfire 2 | `buildFlames(0)`; `buildRayBurst(6, 0.5, 0)` (inert stub) | S3-B2 t17.0–18.857 | 13 fire | n/a, on the ground plane |
| lantern post (base tiers, pole, collar, finial, arm, scroll, curl, hook, ring, cap, base, drip knob, 4 cage bars) | inline `sketch()`/`paint()`, no kit, plain `fillMaterial` | S3-B3 t18.857–20.714 | 11 metal (`P.iron`/`P.brass`) | NO — `lampShadow = contact(0.3, 0.24)`; `CONTACT.lantern = [48, 0.3]` exists in `kit.ts` and is unused |
| cave (3 rocks, mouth fill, mouth crosshatch, chips, jambs, lintel) | rocks via `rock()`; mouth `fillMaterial` + `crossHatch()`; frame `sketch()`+`paint(P.timberDark)` | S3-B4 t20.714–22.571 | 3 rock; 7 timber | NO — nothing under rocks, chips or frame |
| cave door (arched slab, 4 seams, 2 straps + curls + 4 rivets, ring) | inline `THREE.Shape` + `ExtrudeGeometry`, `sketch()`+`paint()` | S3-B4 | 8 plank; 11 metal | n/a |
| chest + lid + straps + coins | `buildChest(18, 0, 0)` (`kit.ts`) | S3-B5 t22.571–24.428 | 8 + 11 | YES — `contacts([['chest', …]])` in `ground.ts` (grep `contacts([` there) |
| perch tree (trunk, 2 twigs, crown, branch) | `trunkOf()`, hand twigs, `lobedCrown()` | S3-B6 t24.428–25.9 | 6 bark; 5 foliage | NO — `tree.add(contact(0.4, 0.32))`; `CONTACT.oak = [58, 0.26]` unused |
| ravens ×3 | `buildRaven()` (`kit.ts`) | S3-B6 | 22 hide | n/a, perched |
| mushrooms ×3 | `buildMushroom()` (`kit.ts`) | S4-B1 t26.5–28.1 | 5 + 3 | YES — `contacts([['mushroom', …]×3])` in `ground.ts` |
| signpost (post, cap, back board, back pointer, 2 rope lashes, base) | inline `sketch()`+`paint()` | S4-B2 t28.1–30.35 | 7 timber; 8 plank; 10 leather (`P.bedroll`) | NO — `postBase = contact(0.3, 0.26)`; `CONTACT.signpost = [40, 0.28]` unused |
| sign board (arrow plank, 2 lettering rows, 2 nails) | inline | S4-B2 | 8 plank; 11 metal | n/a, mounted |

## TABLE 2 — RETIREMENT SITES (6)

`grep -n "hatch(\|crossHatch(\|contact(\|rays(" src/film/sets/pathProps.ts`

| Line | Call | For | Replacement |
|---|---|---|---|
| 129 | `lampShadow = contact(0.3, 0.24)` | shadow under the lamp | `contacts([['lantern', x, z]])` on the S3 ribbon card in `ground.ts`, same pattern as the chest |
| 164 | `mouthDark = crossHatch(0.9, 1.2, 16)` | tone over the cave mouth | DELETE — the `mouthFill` plane is already `P.caveDark` (triTone 0.92, t4); the hatch is redundant tone |
| 287 | `tree.add(contact(0.4, 0.32))` | shadow under the perch tree | `contacts([['oak', x, z]])` on the ribbon card |
| 359 | `postBase = contact(0.3, 0.26)` | shadow under the signpost | `contacts([['signpost', x, z]])` on the ribbon card |
| 370 | `backLetters = hatch(0.3, 0.08, 22, 0, 'faint')` | tone standing in for lettering on the back board | see RULING 1 |
| 412 | `letters = hatch(0.4, 0.055, 26, 0, 'faint')` ×2 rows | tone standing in for lettering on the arrow board | see RULING 1 |

## TABLE 3 — PIGMENTS (exact piecewise sRGB; `encInk 0.15266`)

Flat `P` tokens on plain fills (no map): `P.iron` 0.5520 t3 · `P.brass` 0.4741 t3 **0.0141 from 0.46, FLAG** · `P.stoneCool`
0.4893 t3 **0.0293, FLAG** · `P.caveDark` 0.9199 t4 · `P.rockFace` 0.5291 t3 · `P.timberDark` 0.7695 t4 · `P.timber` 0.5835
t3 · `P.canopy` 0.5586 t3 · `P.plank` 0.5043 t3 · `P.bedroll` 0.4042 t2.

`rock()` retint = `rockMaterial(token)` × neutral-grey `bakeRockFace()` stops grey(0.56 / 0.78 / 1.0):
- `stoneCool` × 0.78 base → 0.6466 t4 **0.0266 FLAG**; × 1.0 lit → 0.4893 t3 **0.0293 FLAG**; × 0.56 shade → 0.8001 t4.
  The cave flank sits inside the clearance across most of its visible face. See RULING 2.
- `rockFace` × 0.78 → 0.6774 t4; × 1.0 → 0.5291 t3; × 0.56 → 0.8223 t4. Clear.

Mushroom cap (`buildMushroom` in `sets/kit.ts`, NOT in this file): `crownMat(P.mushCap, 0.5)` with the default
`mapBase = P.canopy`, so per-channel ratio `mushCap / canopy` multiplies the canopy bake's three stops:
deep `#466F33` → `#7A2D19` (0.84 t4) · mid `#678E42` → `#B03C22` = raw token (0.71 t4) · **lit `#98AF73` → `#FF4C3F`, red
channel clips (linear 1.005)**. Confirms the plan's hex exactly. `P.mushCap = 0xb03c22` is a standalone `P` token.
See RULING 3.

Other kit colours reached from here: `P.ravenSlate` 0.8150 t4 · `P.gold` (coins) 0.3733 t2 · `P.graphiteDark` 0.8312 t4 ·
`P.paper` spots t0 (by design). Chest tiers are documented in `kit.ts` comments (`PLANK_LIT` 0.365 t2 etc.).

## TABLE 4 — KIT PORTS

Already ported: rock, bark, crown, fire, raven, mushroom, chest.
NOT ported, two recipes exist: **door** (`mock/plank.ts` `buildMock()` "3 · the door": 5 boards + frame + 2 straps, real
trilayer tiers; `pathProps.ts` hand-builds a different arched door with flat paint) and **signpost** (`mock/plank.ts`
"post + 2 boards" vs `pathProps.ts`'s flat hand build). Neither recipe is in `plankKit.ts` yet.
No kit exists for the lantern post; it is original, hand-rolled, plain `fillMaterial`, no trilayer.

---

## RULINGS (main session, 2026-09-06 — these bind W5)

**RULING 1 — lettering hatch (lines 370, 412).** A hatch standing in for text is tone fill, which row 16 bans. Before
choosing a replacement the builder reads scene book S4-B2 and `docs/copy-spec.md` for the sign. If the sign carries
WORDS from copy-spec, that is lettering, owned by the lettering pass (FINDINGS P4-T1), and the builder leaves the
board blank with an ink rule line and reports it. If it carries no specified words, use row 16's illegible scribble
idiom: lift `bakeScribbleRows` out of `mock/paperprop.ts` into a kit export and call it from both. Never a hatch.

**RULING 2 — `stoneCool` on the cave flank.** Law 6 (clearance) is the requirement; row 3's token choice is derived.
The cave flank keeps its cool hue by mixing `stoneCool` with one other `P` token (toward `caveDark` for a shade
flank, or `flameCore` for a lit one) until every bake stop clears its boundary by > 0.03 after the multiply. Commit
the result as a named export beside `ROCK_LIT` / `ROCK_SHADE` in `groundKit.ts`, measured with
`scripts/tritone.mjs`, and record it in the bible row 3 with a CORRECTED marker. Same for any raw `P.brass` fill:
use `BRASS_HASP` or a committed mix, never the raw token.

**RULING 3 — mushroom cap.** The clip is a bake-base mismatch, not a palette fault. `buildMushroom` must bake its cap
with `mapBase = P.mushCap` (ratio 1, no clipping) or bake its own sheet from `crownFamily(P.mushCap)`. This is in
`sets/kit.ts`, so it runs AFTER W1a lands as task **W5c**, not inside pathProps.

**RULING 4 — door and signpost.** Lift the `mock/plank.ts` recipes into `plankKit.ts` as exported builders, make
`mock/plank.ts` call them, then make `pathProps.ts` call them. Delete the hand-rolled versions. Three copies → one.

**RULING 5 — basis.** After retirement no basis-dependent mark remains in this file, so no `setView` wrapping is
added here. If the ported door/signpost builders draw kit marks, they take `C2_AZ` / `C2_ELEV` from `ground.ts`.

**RULING 6 (added after W3c, 2026-09-06) — `fire2Rays` and `lanternRays`.** Both call `buildRayBurst`, which since W3c builds a
row-23 IMPACT (strike + spall + flash), not a light burst. Their scale is 0 and nothing animates them, so they are invisible
today, but the calls are wrong. W5 replaces both with the fire kit's glow (`fire.ts`: `buildGlowSprite` or the flame
material's own radial), keeps the `world.fire2Rays` / `world.lanternRays` identities, and does not add or remove any other
builder call (PRNG order).

**Post-W5a notes (2026-09-06).** `buildDoor` / `buildSignpost` now exist in `plankKit.ts` (defaults = the mock's exact recipe;
`arched` / `ringHandle` options exist for the film's door; `boards[]` with rotations for the signpost). W5b wires
`pathProps.ts` to them and takes S3-B4 t21.5 and S4-B2 t29 frames. Two follow-ups: (1) `IRON_LIT` / `IRON_SHADE` were
re-derived locally in `plankKit.ts` to avoid an import cycle — P0k moves the three metal constants' definitions INTO
`plankKit.ts` and has `sets/kit.ts` re-export them, so one definition exists; (2) `PLANK_LIT` under `bakeGrain`'s darkest
realistic overlap (g ≈ 0.70) computes to triTone 0.6169, 0.0031 from 0.62 — a committed-pigment flag shared with
`buildChest`; the owner of the grain bake (W5b or W7) measures the bake's true darkest texel and either lifts the bake's
floor or re-mixes `PLANK_LIT`, with the number beside it.
