# Inventory — `sets/ambush.ts` (read-only audit, 2026-09-06)

Produced for W4. Facts first, main-session rulings at the end. Every row carries its grep.

**File**: 259 lines. **Imports**: `THREE`; `blobs` (`../sculpt.ts`); `P`; from `pencil.ts`: `paint, sketch, hatch, contact`;
from `./kit.ts`: `COLUMN, rock, buildFlames, buildPine, buildOak, buildAdventurer, cauliflowerShape, CAST_STEEL`.
**Export**: `buildAmbush(goblin)` → `{ container, camp, treeline, ambushFlames, adventurers }`. **Caller**: `world.ts` only,
FIRST in build order. `world.party = ambush.adventurers` (the same three groups `timeline.ts` moves).

**Non-obvious fact.** `timeline.ts` does `tl.set(world.party[0..2].position, {x: 109.4 / 110.0 / 109.7 …}, 0)` at t = 0
(grep `world.party[0]` in timeline.ts). The camp coordinates in `advPositions` are overwritten before the first frame; the
trio stands on the cliff for all of S1–S2 and is seen under `cut(7.5)` (az 136.8°, elev 10.3°) and `cut(9.5)` (az 41.5°,
elev 9.7°), not the camp's `cut(16.5)` (az 90°, elev 9.9°).

**Cameras in t0–16.5**: `cut(7.5, [114.4,7.2,3.0], [117.6,6.4,0])` · `cut(9.5, [130,1.3,2.6], [126.5,0.5,-0.5])` ·
`cut(16.5, [2.5,1.1,3.2], [2.5,0.7,0.9])`. No cut at t0: the camera enters from the hero Cover stage's framing and the
first move is `cam(4, 1.5, …)` toward the cliff. The camp itself is on screen in the opening sliver and at the t16.5 cut.
The file's comment "camera opens on this from (0, 2.0, 6.2)" is not found in `timeline.ts`.

## TABLE 1 — PROPS

| Prop | Builder (grep) | Beat / t | §11.2 row | Grounded today |
|---|---|---|---|---|
| hero rock | `rock(1.8, 'hero')` + `paint(heroRock, {fill: P.rockFace})` | S1-B1 t0–4 | 3 rock | YES — `ground.ts` S1 card blob `// the hero rock` |
| outcrop ×3 | `rock(r*2, 'form', x*3.1)` in `outcrop.forEach` | S1-B1 | 3 rock | not named in `ground.ts` blobs; unverified |
| rock shadow | `rockShadow = contact(2.2, 0.8)` | S1-B1 | — | banned; duplicates the hero-rock blob |
| rock face tone ×2 | `face = hatch(tw, th, 12, 1.1, 'faint')` | S1-B1 | 3 rock | surface hatch, not grounding |
| campfire | `buildFlames(1)` | S1-B1 | 13 fire | `// the fire ring` blob |
| ring stones ×7 | `rock(…, 'faint', …)` + `paint(stone, {fill: P.stoneCool})` | S1-B1 | 3 rock | fire-ring blob |
| fire logs ×2 | `sketch(blobs(COLUMN, 26), 60, 'faint')` + `paint(log, {fill: P.timberDark})` | S1-B1 | 7 timber, hand-rolled, plain fill | fire-ring blob |
| scorch | `scorch = contact(0.95, 0.85)` | S1-B1 | — | banned; duplicates the fire-ring blob |
| bedroll | `sketch(blobs(COLUMN, 26), 60, 'faint')` + `paint(P.bedroll)` | S1-B1 | 9/10, hand-rolled, plain fill | `// the bedroll` blob |
| pack + flap | `sketch(BoxGeometry(0.28, 0.26, 0.22), 25, 'faint')` + `paint(P.timber)` | S1-B1 | 7 timber, plain fill | `// the pack` blob |
| spear shaft | `sketch(CylinderGeometry(0.016, …), 25, 'faint')` + `paint(P.timber)` | S1-B1 | 7 timber, plain fill | `// the spear` blob |
| spear head | `sketch(ConeGeometry(0.04, 0.18, 5))` + `paint(spearHead, {fill: CAST_STEEL})` | S1-B1 | 11 metal | spear blob |
| treeline front ×8 | `buildPine(r, h, 0.3, {tier: P.canopyDeep, trunk: P.timberDark})` / `buildOak(…)` | S1–S2 backdrop | 5 / 6 | n/a |
| treeline mid ×8 | `buildPine(r, h, 0.28, {tier: P.canopy, …})` / `buildOak(…)` | same | 5 / 6 | n/a |
| back silhouette band ×2 | hand `THREE.Shape` + `ExtrudeGeometry`, `sketch(bandGeom, 30, 'faint')` + `paint(P.undergrowth)` | same | 5 (flat plate) | n/a |
| forest-top clouds ×3 | `cauliflowerShape()` → `sketch(cloudGeom, 30, 'faint')` + `paint(P.skyVellum)` | same | 17 sky | n/a |
| adventurer trio | `buildAdventurer(true, {fill: cloaks[i]})` | relocated to the cliff at t0 | 9 cloth | YES — three `figure` blobs `// and the three of them` |
| goblin | `goblin.root.position.set(0.5, -0.7, 0.9)` | S1-B1 on | puppet | n/a |

## TABLE 2 — RETIREMENT SITES (3)

| Line | Call | For | Replacement |
|---|---|---|---|
| 52 | `rockShadow = contact(2.2, 0.8)` | shadow under the outcrop | DELETE — `ground.ts` already paints the hero-rock blob. Confirm with a frame that the rock still sits. |
| 61 | `face = hatch(tw, th, 12, 1.1, 'faint')` ×2 | tone on the rock face | DELETE — `rock()` renders through `rockMaterial` × `bakeRockFace()` with real tier shading; the hatch is redundant tone |
| 94 | `scorch = contact(0.95, 0.85)` | scorch under the fire | DELETE — the fire-ring blob already exists; if the scorch READ (darker, sooty) is wanted, it is a blob alpha/radius change in `ground.ts`'s card, not a hatch |

`ground.ts` grounds the camp with a hand-authored `blobs: [[x, z, radiusTex, alpha], …]` array on the S1 `buildIncidentCard`,
an older idiom than `contacts([...])`. It works; W4 does not rewrite it.

## TABLE 3 — PIGMENTS (`scripts/tritone.mjs`, `encInk 0.15266`)

Plain fills: `P.timber` 0.5835 t3 · `P.timberDark` 0.7695 t4 · `P.bedroll` 0.4042 t2 · `P.undergrowth` 0.5043 t3 ·
`P.skyVellum` 0.0734 t0 · `CAST_STEEL` #C3C9CE 0.2232 t1 (0.077 clear). No raw `P.steel` is used (only cited in a
comment; `P.steel` itself is 0.2986, 0.0014 from 0.30).

`rock()` × `bakeRockFace()` stops 0.78 / 1.0 / 0.56: `rockFace` → 0.6774 t4 · 0.5291 t3 · 0.8223 t4, clear.
`stoneCool` (ring stones) → 0.6466 t4 (0.027) · **0.4893 t3 (0.029, FLAG)** · 0.8001 t4. Same flag as the cave flank.

Crowns: `crownMat(token, dir, token)` ratio 1, no clipping. `canopy` stops 0.7005 / 0.5586 / 0.3856; `canopyDeep`
0.7937 / 0.7005 / 0.5475. All clear. Bark: `barkMat(P.timberDark)` = `tri('bark', timberDark, {mapBase: P.timber, map:
bakeBark()})`, a real non-unity ratio; canvas alpha composite, extremes not hand-computable — prove on `?mock=bark` if needed.

**Dead cloaks.** `cloaks = [P.cloakCrimson, P.cloakIndigo, P.cloakIndigo]` is discarded by `buildAdventurer`'s
`RETIRED_CLOAKS`; the trio renders `cloakUmber, cloakOiled, cloakRoad` (`castSeq` 0, 1, 2 since ambush builds first). The
comment about "only one wears crimson, furthest from the goblin" describes tokens no figure wears.

## TABLE 4 — KIT PORTS

Kit used: `rock`, `buildFlames`, `buildPine` (lines 168, 184 — W1b wraps these), `buildOak`, `cauliflowerShape`,
`buildAdventurer`. Hand-rolled with NO kit and NO trilayer (plain `fillMaterial` via `sketch()` + `paint()`): fire logs,
bedroll, pack + flap, spear shaft + head, back-row silhouette band. No `buildLog / buildBedroll / buildPack / buildSpear`
exists anywhere in `sets/kit.ts` or `mock/*`.

## TABLE 5 — BASIS

`setView` → 0 hits. Pines and oaks are drawn at the hero's lens (W1b). The cast's marks use `marksKit`'s own basis and are
pushed along the view ray at render time (cast reference), so the two cliff cuts 95° apart are not a cast defect.

---

## RULINGS (main session, 2026-09-06 — these bind W4)

**RULING 1 — the three retirement sites are deletions,** not re-wirings: `ground.ts` already grounds every camp prop.
Delete the two `contact()` calls and the two `hatch()` panels. Then take ONE frame at t≈1.0 (camp on screen before
`cam(4…)` pulls away) and one at t16.5 in Performance and confirm the rock and fire still sit on the ground; if the
scorch read is missing, adjust the fire-ring blob's alpha/radius in `ground.ts`'s S1 card (one number, reported) — never
a stroke.

**RULING 2 — every painted mass goes through the trilayer.** The fire logs, bedroll, pack, spear shaft and spear head are
plain `fillMaterial`, outside the paint program every other surface uses. They become kit materials: timber masses via
the same `tri(...)` route `buildHouse` / `plankMat` use in `sets/kit.ts` (read `paint()`'s `role === 'tri'` retint path in
`pencil.ts` first), the spear head via the kit's metal material with `CAST_STEEL`, the bedroll via `garmentMaterial`
(`clothKit.ts`) with a committed cloth mix (`cloakRoad` / `cloakOiled` / `cloakUmber`, whichever tier the bible's row 9
/ row 10 text names for the bedroll; `P.bedroll` itself is row 10 leather and stays for the strap only if one exists).
Geometry stays as it is; this is a material port, not a remodel.

**RULING 3 — ring stones use the committed cool-rock mix** defined under P0h in `groundKit.ts` (beside `ROCK_LIT` /
`ROCK_SHADE`), never raw `P.stoneCool`. Same token W5 uses for the cave flank.

**RULING 4 — delete the dead cloak code.** Remove the `cloaks` array and its comment; call `buildAdventurer(true)` with
no fill so the kit's `CAST_CLOAK` rotation is explicit rather than accidental. Do not change `castSeq` order (every set's
cast colours depend on it).

**RULING 5 — leave `timeline.ts`'s party relocation alone.** The cliff is where S1 stages the volley; the camp
positions are a harmless construction default. W4 does not touch `timeline.ts` (law 12).

**RULING 6 — the back-row silhouette band and clouds stay hand-authored** (one-off backdrop shapes, class 17), but their
fills go through the trilayer like everything else (`tri('sky', P.skyVellum …)` — check `mock/sky.ts` for the sheet's
material and use that).
