# Color script — the painted Normal World

Milestone 4. The film's per-scene color assignment for the **painted** state only. The graphite
Behind-the-Curtain state is not authored here — it is computed from this one by the desaturation pass,
and the last section of this document sets the constraint that pass must satisfy.

This is a specification, not a mood board. Every fill below names a token, every token has a hex, and
every object name is a real local in `story/src/film/world.ts`. Apply it mechanically.

---

## 0. The lane, named

**Poster gouache over ink.** Flat opaque mid-value fills, no gradients, no specular, no baked glow,
black line-work on top carrying all the form. The reference is mid-century travel-poster gouache and
the printed board the film ends on — *not* pastel storybook illustration.

The storybook reflex (muted sage, dusty rose, cream, powder blue, everything at 80% white) is
explicitly rejected. It would collapse the painted state into the parchment state and the film's one
structural idea would stop working. Every ground and foliage token here sits in the **mid** value band
on purpose.

Color strategy: **full palette** — four named roles per chapter, each used deliberately — under a
single **committed** signature for the goblin that never changes across all seven chapters.

---

## 1. How this gets applied

### The API

```
paint(obj, { fill })            // obj: THREE.Object3D built by sketch()/hatch()/rays()
```

`paint` walks `obj` and assigns fills. Two mechanical facts about the existing code decide its
implementation, and getting either wrong breaks the whole film:

1. **`fillMaterial` in `pencil.ts` is a single shared `MeshBasicMaterial`.** Every one of the ~176
   `sketch()` call sites points at the same instance. `paint` must therefore **clone** it per painted
   object and assign the clone, never mutate the shared one. This is the same trap
   `pencil-detail-plan.md` records for the board's opacity fade — a shared material there would have
   dragged the entire film's line-work up with it.
2. **Fills are `MeshBasicMaterial` — unlit.** That is exactly right for this look and must stay that
   way. What you write in `fill` is what renders, at every pixel, in every frame. There is no light
   rig, no shading, no tone mapping to fight. Do not introduce `MeshLambert`/`MeshStandard` to "make
   it look painted"; the paint *is* the flat, and the ink and hatch layers already supply the hand.

### What never gets painted

- `inkMaterial` forms (pupils, the monster's maw, wicks). They stay `#222222`. A solid black shape is
  the loudest mark on the page and the film spends it deliberately.
- The stroke color of `sketch`/`polyline`/`curveLine`/`hatch`/`contact`. All line-work stays
  `LINE = #222222` in the painted state. Colored outlines are banned (see §7).
- `rays()` bursts are the exception among line-work — see `ray-gold` in §2.

### Three places the sky lives

Chapter fog is one value written to **three** surfaces, and all three must be tweened together or the
frame delaminates:

1. `scene.fog.color` (`FogExp2`)
2. `scene.background`
3. the CSS page background behind the transparent canvas (the paper-grain layer from milestone 3)

The grain layer keeps its texture; only its base color moves. Where the ground plane does not cover,
the CSS layer *is* the sky, so a mismatch shows as a hard horizon seam.

---

## 2. Global palette

Every value below is verified: `Y` is WCAG relative luminance, `ink` is the contrast ratio of the
`#222222` line-work against that fill.

**Two contrast floors govern the whole film:**

- **Ink floor — 3.0:1** (WCAG 1.4.11, non-text graphical object). Any fill an ink line is drawn on
  must clear it, or the drawing disappears. In luminance terms: `Y ≥ 0.148`.
- **Caption floor — 4.5:1.** Any fill a `#222222` caption crosses must clear it. `Y ≥ 0.247`.

A third, deliberate tier exists:

- **Ink-dark tier** — fills below 3.0:1 where the ink is *meant* to vanish and the form reads as a
  solid silhouette. Permitted on exactly four things: the cave interior, the hearth firebox, the
  ravens, and the goblin's own belt/tunic-shade. Nothing else may go there.

### State

| Token | Hex | Y | ink | Role |
|---|---|---|---|---|
| `paper` | `#F7F5F0` | 0.914 | 14.60 | **Reserved.** The Behind-the-Curtain ground. Never a painted-world fill except C7 (§4.7). |
| `ink` | `#222222` | 0.016 | — | All line-work, both states. |

### Sky / fog — one per chapter, tweened

| Token | Hex | Y | ink | Chapter |
|---|---|---|---|---|
| `sky-dusk` | `#869AAB` | 0.311 | 5.47 | C1 — night camp |
| `sky-day` | `#A9C4D2` | 0.526 | 8.72 | C2 — the run |
| `sky-overcast` | `#BCC6C6` | 0.552 | 9.12 | C3 — theatre |
| `sky-hearth` | `#C7A882` | 0.418 | 7.09 | C4 — tavern interior |
| `sky-vellum` | `#E6E0D2` | 0.748 | 12.09 | C5 — montage void |
| `sky-dawn` | `#E2C79A` | 0.593 | 9.75 | C6 — cliff |
| `sky-board` | `#F7F5F0` | 0.914 | 14.60 | C7 — returns to `paper` |

The arc is a deliberate value ramp: the film **gets lighter as it goes**, dusk → day → dawn → paper.
C7 landing back on `paper` is not a shortcut. The product's board is printed on paper; the film ends
by becoming its own medium.

### Grounds

| Token | Hex | Y | ink |
|---|---|---|---|
| `earth` | `#C0A472` | 0.390 | 6.66 |
| `earth-track` | `#A88B5E` | 0.276 | 4.94 |
| `grass` | `#8FA45C` | 0.332 | 5.78 |
| `grass-deep` | `#71884B` | 0.216 | 4.03 |
| `snow` | `#E9EEF0` | 0.848 | 13.60 |
| `stone-cool` | `#9FA9AC` | 0.387 | 6.63 |
| `stone-warm` | `#B2A48F` | 0.380 | 6.52 |
| `rock-face` | `#8A8F8C` | 0.269 | 4.84 |
| `cave-dark` | `#4A4E52` | 0.075 | 1.90 · *ink-dark tier* |
| `water` | `#6E9BA6` | 0.295 | 5.23 |
| `floorboard` | `#B98A55` | 0.291 | 5.17 |
| `platform-disc` | `#C9B991` | 0.492 | 8.21 |

### Foliage

| Token | Hex | Y | ink |
|---|---|---|---|
| `canopy` | `#6B8A57` | 0.220 | 4.09 |
| `canopy-deep` | `#5A7D52` | 0.175 | 3.40 |
| `needle` | `#5F7F63` | 0.185 | 3.56 |
| `undergrowth` | `#82965A` | 0.273 | 4.89 |
| `moss` | `#8CA05C` | 0.315 | 5.53 |

All world greens are pushed **blue-green and olive**. The yellow-green band is reserved for the
goblin and nothing else in the film may enter it. This is what makes him findable in a forest.

### Wood

| Token | Hex | Y | ink |
|---|---|---|---|
| `timber` | `#B07C46` | 0.241 | 4.41 |
| `timber-dark` | `#96683B` | 0.167 | 3.29 |
| `plank` | `#C08F58` | 0.316 | 5.54 |

### Fire and warm light

| Token | Hex | Y | ink |
|---|---|---|---|
| `flame-core` | `#FFD97A` | 0.723 | 11.71 |
| `flame-body` | `#F2A03C` | 0.443 | 7.48 |
| `ember` | `#E0702F` | 0.276 | 4.95 |
| `ray-gold` | `#F5C24D` | 0.585 | 9.63 |
| `lantern-glass` | `#FFD98E` | 0.728 | 11.79 |
| `candle` | `#FFE2A3` | 0.783 | 12.62 |

`ray-gold` is the **only** stroke color in the film that is not `ink`. `rays()` bursts recolor their
`LineMaterial` to `ray-gold` when lit. This is how light works here: light is a *drawn mark* that
gains a color, never a radial gradient baked into the ground (see §8, the conflict note).

Fire is held at **amber/gold, never red.** Red belongs to the goblin's tunic alone; if fire went red
the two would compete every time he stands next to a fire, which he does in C1, C2, C4 and C5.

### Cloth

| Token | Hex | Y | ink |
|---|---|---|---|
| `cloak-indigo` | `#6B7BA8` | 0.201 | 3.81 |
| `cloak-crimson` | `#B85A4E` | 0.181 | 3.49 |
| `bedroll` | `#C2A277` | 0.386 | 6.61 |
| `tavern-cloth` | `#C98F5E` | 0.329 | 5.74 |

`cloak-crimson` is deliberately **desaturated and lightened** relative to `gob-tunic`. The adventurers
wear the goblin's hue at lower chroma; he is the saturated one.

### Metals

| Token | Hex | Y | ink |
|---|---|---|---|
| `brass` | `#C79A4E` | 0.358 | 6.18 |
| `iron` | `#8D9296` | 0.284 | 5.06 |
| `gold` | `#E8B84B` | 0.519 | 8.63 |
| `steel` | `#AFB7BC` | 0.466 | 7.82 |

### The goblin — signature, fixed for the whole film

| Token | Hex | Y | ink | vs `paper` |
|---|---|---|---|---|
| `gob-skin` | `#87A03C` | 0.306 | 5.40 | 2.71 |
| `gob-skin-lit` | `#A8C24E` | 0.475 | 7.95 | 1.84 |
| `gob-tunic` | `#CF4A32` | 0.184 | 3.54 | **4.12** |
| `gob-tunic-shade` | `#9E3322` | 0.098 | 2.24 · *ink-dark tier* | 6.20 |
| `gob-belt` | `#96603A` | 0.152 | 3.05 | 4.78 |
| `gob-satchel` | `#D9A441` | 0.417 | 7.07 | 1.71 |
| `gob-tooth` | `#F0EAD8` | 0.823 | 13.23 | 1.10 |

**Read order is tunic first, skin second.** This is load-bearing and was decided by measurement, not
taste. During a freeze the world becomes a high-key graphite ramp; a yellow-green at `Y 0.475` sits at
the *same value* as mid-grey and separates by hue alone — it would vanish for a colour-blind viewer,
on a bad panel, or in any grayscale still of the film. `gob-tunic` at `Y 0.184` clears `4.12:1`
against the lightest graphite and stays the darkest chromatic mass in frame.

Consequences, both mandatory:

- `gob-skin` is the **darker** green `#87A03C`. `gob-skin-lit` is a highlight only — ear tips, nose,
  the top plane of the hands. Do not swap them.
- The desaturation pass must keep the graphite state **high-key** (see §6).

`gob-satchel` at `Y 0.417` is the third note: a warm brass-ochre, deliberately close in value to the
world's `earth`/`brass` so it never out-shouts the tunic. It is the thing the C2 over-the-shoulder
follow spends thirteen seconds looking at, so it needs presence without competing.

### Specials

| Token | Hex | Y | ink |
|---|---|---|---|
| `die-bone` | `#EDE3C8` | 0.771 | 12.44 |
| `monster-hide` | `#7E6EA0` | 0.181 | 3.50 |
| `raven-slate` | `#525C68` | 0.104 | 2.34 · *ink-dark tier* |
| `mush-cap` | `#63B3A4` | 0.376 | 6.45 |
| `board-fill` | `#F2EDE0` | 0.848 | 13.61 |

---

## 3. State rule

One rule, and everything else follows from it:

> **The painted world lives in the mid value band. The graphite state lives in the high band.**

Painted grounds and foliage sit at `Y 0.17–0.55`. The graphite state is parchment and line, mass
average `Y ≈ 0.8`. The freeze therefore reads as the world *lifting away* into paper, and the goblin
— the darkest chromatic mass — is left standing on it. That value gap is the effect. If painted
grounds drift pale, the freeze has nothing to lift into and the film's thesis shot does not land.

---

## 4. Per-chapter assignment

Object names are locals in `world.ts`. Where a builder is reused (`buildPine`, `buildChest`,
`buildHouse`, `buildFlames`, `buildRaven`, `buildMushroom`, `buildAdventurer`) it takes a palette
argument so the same builder can serve a forest pine and a snow-line pine.

### C1 — Ambush camp (`buildAmbush`, around origin). Mood: night camp, one fire.

Fog `sky-dusk`. The whole chapter is **two hues**: cold blue-grey everywhere, one amber hole in it.
That single warm/cool opposition is the film's opening statement and the reason the C2 arc can build
from it.

| Object | Token |
|---|---|
| `rock`, `outcrop` `chunk`, `rimChips` | `rock-face` |
| `rockShadow` (contact), `face` (hatch) | `ink` — unpainted, tone only |
| `ambushFlames` `tongue` (inner) | `flame-core` |
| `ambushFlames` `tongue` (outer), `ember` | `flame-body`, `ember` |
| fire-ring `stone` | `stone-cool` |
| `log` | `timber-dark` |
| `scorch` (contact) | `ink` — unpainted |
| `bedroll` | `bedroll` |
| `pack`, `packFlap` | `timber` |
| `spear` shaft | `timber` |
| `spearHead` | `steel` |
| `treeline` `pine` tiers | `canopy-deep` |
| `treeline` `pine` trunks | `timber-dark` |
| ground under camp (`groundMesh` C1 region) | `earth-track` |
| `adventurers` — `cloak`, `crown`/`brim` | `cloak-indigo` ×2, `cloak-crimson` ×1 |
| `adventurers` — `body`, `arm` | `stone-warm` |
| `adventurers` — `leg`, `boot` | `timber-dark` |
| `adventurers` — `head` | `stone-warm` (human skin; note it sits nowhere near the goblin's green) |
| `adventurers` — `blade` | `steel`; `guard`/`pommel` `brass`; `grip` `gob-belt` |
| `cloakTone` (hatch) | `ink` — unpainted |

Only **one** of the three adventurers wears `cloak-crimson`, and he is placed furthest from the
goblin's peek position. Two crimson figures beside a vermilion goblin would split the read.

### C2 — The path (`buildPathProps` + `buildGround`). Mood: cool morning warming into full day.

Fog `sky-day`. Ground `earth` with the track `earth-track` and `tufts`/`blades` `grass`.
`spine`/`edge` path curves stay `ink`.

The seven props are the film's lighting sequence — their reveal order is specified in §5. Their
resting assignments:

| Prop (x) | Object | Token |
|---|---|---|
| campfire2 (6) | `fire2Flames` inner / outer / `ember` | `flame-core` / `flame-body` / `ember` |
| | `fire2Rays` stroke | `ray-gold` |
| lantern (10) | `pole`, `lanternArm`, `lanternDrop` | `timber-dark` |
| | `lanternCap`, `lanternBase`, `bar` | `brass` |
| | lantern housing glass | `lantern-glass` |
| | `lanternRays` stroke | `ray-gold` |
| cave (14) | `caveRocks` `rock` | `stone-cool` |
| | `mouthDark` (crossHatch) | `cave-dark` *(ink-dark tier — intentional; the dungeon is the one place he does not light)* |
| | `chip` | `rock-face` |
| | `doorSlab`, `seam`, `plank` runs | `timber` |
| | `band` | `iron` |
| | `handle` | `brass` |
| chest (18) | `body`, `lidMesh` | `timber-dark` |
| | `strap` (both) | `iron` |
| | `lock` | `brass` |
| | `coin` ×n | `gold` |
| | `wellShadow` (hatch) | `ink` — unpainted |
| ravens (22) | `tree` `trunk`, `twig`, `branch` | `timber-dark` |
| | `puff` foliage | `canopy` |
| | `raven` `body`, `head`, `tail`, `wing` | `raven-slate` *(ink-dark tier)* |
| | `beak` | `iron` |
| | raven `eye` | `ink` |
| mushrooms (26) | `stem` | `bedroll` |
| | `cap` | `mush-cap` |
| | `gills` (hatch) | `ink` — unpainted |
| signpost (30) | `post`, `postCap` | `timber` |
| | `backBoard`, `boardMesh`, `point` | `plank` |
| | `letters`, `backLetters` (hatch) | `ink` — unpainted |
| | `nail` | `iron` |
| | `postBase` (contact) | `ink` — unpainted |

### C3 — Theatre disc (`buildTheatre`, at 44,0,−2). Mood: overcast, stage-lit-by-nothing.

Fog `sky-overcast`. This is the chapter where the *set* is the subject, so the disc itself is warm
and the two halves are cold against each other. Camera is wide; hold to four values.

| Object | Token |
|---|---|
| `discMesh` | `platform-disc` |
| `kerb` | `timber` |
| `discShadow` (hatch) | `ink` — unpainted |
| forest half — `pine` tiers | `canopy` (near) / `canopy-deep` (far) |
| forest half — `pine` `trunk`, `stump`, `fallen` | `timber-dark` |
| forest half — `patch` `floorTone` | `undergrowth` |
| forest half — `rings` (hatch) | `ink` — unpainted |
| forest half — `boulder` | `rock-face` |
| mountain half — `peak` lower body | `stone-cool` |
| mountain half — `peak` above snowline | `snow` |
| mountain half — `tone` (hatch) | `ink` — unpainted |
| mountain half — `rock` | `rock-face` |
| mountain half — `pine` | `needle`, trunks `timber-dark` |
| `ropeMesh`, `wrap`, `knot`, `strand` | `bedroll` |

The snowline stays **bare `snow`** — a near-white plate on a `sky-overcast` fog. That is the one place
in the painted film where a fill approaches paper value, and it is correct: it is snow, and it makes
the reveal of the mountain half land as a temperature drop the moment the disc turns.

### C4 — Tavern (`buildTavern`, at 80,0,0). Mood: warm interior, the film's only enclosed room.

Fog `sky-hearth`. This is the warmest chapter and the widest palette — it is the turn of the film and
should feel like arriving somewhere. Every warm token in §2 appears here; the only cool notes are the
window and the die.

| Object | Token |
|---|---|
| `floor` | `floorboard` |
| `wall` | `plank` |
| `postW`, `beam` | `timber-dark` |
| `bay` (hatch) | `ink` — unpainted |
| `win` `night` (crossHatch) | `sky-dusk` — the night outside, and the room's only cool plate |
| `sill` | `timber` |
| `breast`, `hearthStone` | `stone-warm` |
| `mantel` | `timber-dark` |
| `fireBox` (crossHatch) | `cave-dark` *(ink-dark tier)* |
| `log` | `timber-dark` |
| `hearthFire` | `flame-core` / `flame-body` / `ember` |
| `shelf` | `timber` |
| `bottle`, `neck` | `water` (glass, cool, small) |
| `tableTop` | `timber` |
| `tableLip`, `tableLeg`, `tableFoot` | `timber-dark` |
| `tableWear` (hatch), `tableShadow` (contact) | `ink` — unpainted |
| `dieInner` | `die-bone` |
| `faceNumbers` / `mark` | `ink` |
| `nudgeFinger` — `knuckle`, `tipSeg`, `pad` | `gob-skin` |
| `nudgeFinger` — `crease` (hatch) | `ink` — unpainted |
| `dm`, `player1`, `player2` | as C1 adventurers; the `dm` gets `cloak-indigo` |
| `mug`, `handle` | `stone-warm` |
| `sheet` | `paper` — *permitted here.* Character sheets are literally paper. |
| `written` (hatch), `printed` (hatch) | `ink` — unpainted |
| `pencilStub` | `timber`, tip `ink` |
| `screen` `panel` | `tavern-cloth` |
| `candlestick`, `holder` | `brass` |
| `candleShaft` | `candle` |
| `candleFlame` | `flame-core` |
| `seat`, `legB` (benches) | `timber-dark` |
| `doorSlab2`, `plank` | `timber` |
| `band` | `iron`; `knob` `brass` |

`die-bone` at `Y 0.771` on a `timber` table at `Y 0.241` is a **3.2:1 value separation** — the die is
the brightest object in the room and the shot holds on it for six seconds. That is intentional.

### C5 — Montage (`buildMontage`, six platforms at z=−40). Mood: bright, weightless, fast.

Fog `sky-vellum`. Six cuts, 1.25s each — no viewer resolves a subtle palette at that rate. Each
platform is therefore **one dominant hue plus the goblin**, and the six hues are chosen to cycle so
consecutive cuts never repeat: gold → violet → red-brown → green → gold → amber.

All six share: `platform` `platform-disc`, `rim` `timber`, `ring` (hatch) and `under` (contact)
unpainted.

| # | Object | Token |
|---|---|---|
| 0 map | `mapTable`, `leg` | `timber-dark` |
| | `mapSheet` | `paper` — a drawn map is paper |
| | `coastline` (curveLine) | `ink` |
| | `roadBox` (in `roadLine`) | `ember` — the road inks itself in **warm**, the one saturated mark on a white sheet |
| | `weightStone` | `rock-face`; `inkpot` `cave-dark`; `quill` `gob-tooth` |
| 1 monster | `spike`, `hornL`, `hornR`, `claw`, `ridge`, `tail` | `monster-hide` |
| | body | `monster-hide` |
| | `maw` | `ink` (inkMaterial); `tooth` `gob-tooth` |
| | `eye` | `ray-gold` — the only prop besides fire that carries it |
| 2 sign | `wallFrag`, `plank` | `plank` |
| | `plinth` | `stone-warm` |
| | `fragWindow` (crossHatch) | `cave-dark` *(ink-dark tier)* |
| | `bracket`, `brace`, `hook` | `iron` |
| | `tavernSign` board | `timber-dark` |
| | `signBorder` (polyline) | `ink`; `device` (hatch) unpainted |
| 3 trees | `trees5` `buildPine` tiers | `canopy` |
| | trunks | `timber-dark` |
| | `mound` (hatch) unpainted; `oldStump` `timber-dark`; `stumpRings` unpainted |
| 4 chest | `chest5` as C2 chest | `timber-dark` / `iron` / `brass` / `gold` |
| | `hoardTone` (hatch) | `ink` — unpainted |
| | `crate` | `timber` |
| 5 candles | `candleTable`, `candleLeg` | `timber-dark` |
| | `candle` | `candle`; `drip` `candle`; `holder` `brass` |
| | `wick` | `ink` |
| | `book` | `bedroll`, pages `paper` |
| | `written5` (hatch) | `ink` — unpainted |
| | `candleRays` stroke | `ray-gold` |

### C6 — Cliff + miniature world (`buildCliffWorld`). Mood: dawn, altitude, the whole world at once.

Fog `sky-dawn`. This is the reveal shot and the palette **opens**: after the tight six-cut montage,
every ground token in the film appears at once in miniature. That breadth is the point — the audience
should recognise C2's earth, C3's forest and snow, and C4's roofs all in one frame.

| Object | Token |
|---|---|
| `cliff` `tier` (three) | `rock-face` (top) / `stone-cool` (middle) / `stone-warm` (base) |
| `crack` (hatch) | `ink` — unpainted |
| `chunk` (talus) | `rock-face` |
| `buildHouse` `body` | `stone-warm` |
| `buildHouse` `roof` | `timber-dark` — with **two** houses on `ember` roofs, scattered, as the eye's landing points |
| `buildHouse` `door`, `win` | `timber` / `cave-dark` |
| `buildHouse` `chimney` | `stone-cool` |
| mini `buildPine` | `canopy-deep` |
| `massif`, `shoulder` | `stone-cool`, above the shoulder `snow` |
| `massifTone` (hatch) | `ink` — unpainted |
| `roadA`, `roadB` (curveLine) | `ink`; the strip between the two edges filled `earth-track` |
| `riverCurve` reaches, `water` (hatch) | `water` |
| `fields` `till` (hatch) | `ink` — unpainted, over `grass` fill |
| field fills | alternating `grass` / `grass-deep` / `earth` |
| ground plane under the mini world | `grass` |

The flatten (t60–62) drops `scale.y` to 0.02 but **does not change any fill.** The miniature world
stays fully painted as it collapses. Colour is what survives the flattening — the shapes become
icons, the palette stays, and that is exactly the transition into the product's board.

### C7 — The throw and the board. Mood: paper.

Fog tweens `sky-dawn` → `sky-board` (`#F7F5F0`) across the throw arc, t62.5–64.5.

| Object | Token |
|---|---|
| `die2` | `die-bone`, numerals `ink` |
| `boardFill` | `board-fill` |
| `grid` / `gridMat` | `ink` at low weight (already transparent, opacity-tweened) |
| `boardInk`, `ruleAt`, `tickPts` | `ink` |
| goblin at the cliff edge | full signature, unchanged |

This is the only beat where the painted world deliberately converges on `paper`. It is not the freeze
grammar — nothing desaturates, the goblin does not become the exception, the fog simply arrives at the
value the product board is printed on. **The last colored thing on screen is the goblin,** and he is
still standing on the cliff behind camera when the board takes the frame.

---

## 5. The C2 re-ignition arc

The seven props re-ignite into color while the world is frozen (t17–30, `timeScale = 0` throughout —
per `pencil-detail-plan.md` the run now plays entirely inside the freeze). Each prop is graphite until
his hand arrives, then takes its assignment.

The arc is **not** a temperature ramp. It is a palette being assembled — each beat introduces one new
family, and the sequence peaks in the middle rather than at the end, so the run has a shape instead of
a slope.

| # | Prop | The reveal | New family introduced | Reach beat |
|---|---|---|---|---|
| 1 | `fire2Flames` + `fire2Rays` | **Ignition.** `flame-core` and `flame-body` snap in with the `lit` tween; `fire2Rays` stroke goes `ink` → `ray-gold` on the same `back.out` as its scale. Highest chroma so far, on a fully graphite world. | fire | t≈17.9 |
| 2 | `lanternRays` + housing | **Repetition, contained.** Same warm family, smaller and cooler: `brass` fittings, `lantern-glass` bulb, `ray-gold` stroke. It establishes lighting as a *verb he repeats*, not a one-off. | metal | t≈19.8 |
| 3 | `caveDoor` | **First cool.** `timber` door and `iron` bands swing open onto `cave-dark` — the mouth stays in the ink-dark tier. He opens the dungeon and pointedly does not light it. The surrounding `stone-cool` rocks take color on the same tween. | wood + stone | t≈21.6 |
| 4 | `chestCoins` + chest | **Peak.** `gold` at `Y 0.519` is the highest-chroma, highest-value moment of the run, placed at the midpoint. Coins pop `back.out` with the lid; `brass` lock and `iron` straps land a beat earlier so the gold arrives last. | gold | t≈23.5 |
| 5 | `ravens` | **The reveal leaves the props.** The birds themselves take only `raven-slate` — nearly no chroma. What takes color on this beat is the **sky**: fog tweens graphite → `sky-day` over the 1.0s of their scatter, and the ground plane takes `earth` under it. The prop is the trigger; the world is the subject. | sky + ground | t≈25.4 |
| 6 | `mushrooms` | **The breath.** `mush-cap` teal is the only cool-chroma prop in the film and the only cyan note anywhere. Small, low, three of them, staggered 0.12. After the sky opened, this is deliberately quiet. | cool accent | t≈27.2 |
| 7 | `signBoard` | **Completion.** `plank` board, `timber` post, `iron` nail — no new family. As `rotation.z` straightens to 0, the remaining unpainted world catches up: `tufts`/`blades` take `grass`, the far `treeline` takes `canopy-deep`, and the last graphite falls off the frame. | none — it completes | t≈29.1 |

Two invariants the sequence depends on:

- **The goblin is already fully colored at t17.** He is painted from his first frame in C1. The run is
  the world catching up to him, not him being introduced.
- **Once a prop is colored it stays colored,** including through t30's `timeScale → 1`. Nothing in
  this film un-paints.

---

## 6. Accessibility and readability

### Ink line-work

Every fill in §2 clears the **3.0:1** ink floor except the four ink-dark tier entries, which are
listed and bounded. No other fill may go below it. If a future value is added, it must be measured,
not eyeballed — the check is `Y ≥ 0.148`.

### Captions

Captions are `#222222` on the scene (`open1` is `#F7F5F0` on the blackout). The **4.5:1** floor means
`Y ≥ 0.247` for whatever is behind them.

Per-chapter caption verdicts, against the fog value each caption crosses:

| Caption | Chapter | Behind it | Ratio | Verdict |
|---|---|---|---|---|
| `open1` | C1 | blackout | — | fine (white on black) |
| `open2` | C1 | `sky-dusk` | 5.47 | **passes, thin margin** — see below |
| `me1`–`me4` | C1 freeze | `sky-dusk` at 24% height | 5.47 | passes |
| `nat1`, `nat20` | C4 | `sky-hearth` / `plank` wall | 7.09 / 5.54 | passes |
| `welcome` | C4 | `sky-hearth` | 7.09 | passes |
| `nat20` (reuse) | C7 | `board-fill` | 13.61 | passes |
| `endcard` | C7 | `sky-board` | 14.60 | passes |

**Flagged — C1 needs a halo.** `sky-dusk` clears the floor at 5.47:1, but C1 is the one chapter where
a caption can drift off the fog and onto `canopy-deep` (3.40:1, fails) or `raven-slate`-class darks as
the camera moves during the 4.0–16.5 stretch. `open2` and `me1`–`me4` should carry a
`text-shadow: 0 0 0.5em rgb(247 245 240 / 0.85)` paper halo. Nothing else in the film needs one —
C2 onward every fog value is `Y ≥ 0.418`.

**Flagged — no caption may cross the goblin.** `gob-tunic` is 3.54:1 and `gob-tunic-shade` is 2.24:1.
The `me*` captions already sit at 24% specifically to clear his head (per `pencil-detail-plan.md`);
that placement is now a **contrast** requirement, not just a composition one, and must not be moved
back to 50%.

### Colour-vision independence

The goblin's read does not depend on hue. `gob-tunic` at `Y 0.184` is the darkest chromatic mass in
every frame he appears in, so he separates by **value** under deuteranopia, protanopia, tritanopia and
in any grayscale still. This is why §2 inverts the obvious skin/shade assignment.

### Constraint on the milestone-4 desaturation pass

The graphite state must map painted fills into the **high band, `Y 0.55–0.91`** — not onto a full
0→1 grey ramp. Measured: `gob-skin` against a mid-grey at `Y 0.46` is **1.02:1** — total value
collapse. Against the high band it holds 1.25–1.84, and `gob-tunic` holds 2.80–4.12. Darkness in the
graphite state comes from *hatch density* (line, which does not lower the area's mean luminance much),
never from dark area fills. This is the single constraint that decides whether the freeze reads.

### Motion and reduced motion

Nothing here adds motion. Every reveal rides an existing timeline tween. The `prefers-reduced-motion`
path from milestone 3 damps ambient motion to 0.3 and is unaffected — color assignment is a state, not
an animation, and under reduced motion the reveals still fire, just without the glide.

---

## 7. Do not

1. **Do not mutate `fillMaterial`.** Clone per painted object. Mutating the shared instance repaints
   the entire film in one color.
2. **Do not color the ink.** All `sketch`/`hatch`/`contact`/`polyline` strokes stay `#222222`. The one
   exception is `rays()` → `ray-gold`. Colored outlines turn poster gouache into vector clip-art.
3. **Do not add a light rig.** No `MeshStandardMaterial`, no `PointLight`, no baked radial glows, no
   ambient tint. Mood comes from the fog token and the palette, full stop. Light in this film is a
   drawn ray burst that gains a color.
4. **Do not gradient anything.** No vertex colors ramping across a face, no gradient textures, no
   fog-as-fake-lighting on a single object. Flats.
5. **Do not paint over the hatch.** Every `hatch`/`crossHatch`/`contact` group stays unpainted line.
   The tone layer is what keeps the film from reading as flat vector; filling it kills the pencil.
6. **Do not put yellow-green anywhere but the goblin.** World greens are olive and blue-green. This is
   the whole reason he is findable.
7. **Do not make fire red.** Amber and gold only. Red is the tunic's, exclusively.
8. **Do not use `paper` as a painted-world fill,** except the three literal-paper objects named in
   §4 (`sheet`, `mapSheet`, `book` pages) and the C7 convergence. `paper` is the Behind-the-Curtain
   ground; spending it in the painted state weakens the freeze every time.
9. **Do not desaturate anything by hand.** There is one desaturation and it is the milestone-4 mask
   pass. Pre-muted fills would double-apply.
10. **Do not paint the goblin per chapter.** His seven tokens are fixed for the whole film. He is the
    constant; the world is the variable.
11. **Do not skip the fog trio.** `scene.fog.color`, `scene.background` and the CSS grain base move
    together or a horizon seam appears.
12. **Do not let a caption sit on the goblin or on any ink-dark tier fill.**

---

## 8. Where the two guides conflict

`art-direction.md` governs this film. `docs/art-style-guide.md` governs shipped map art. They disagree
in three places, and `art-direction.md` wins each time — recorded here so nobody "fixes" the film into
the guide later.

1. **Baked lighting.** Style guide §5: *"Lighting is painted, not neutral"* — every light source gets a
   soft radial warm glow baked into the ground, one global sun direction, long cast shadows, dramatic
   vignettes. The film has none of this. Light here is `rays()` — a graphic mark that turns
   `ray-gold` — and shadow is `contact()` hatch. A baked glow would contradict art-direction's
   flat-painted premise and would make the freeze impossible to compute, because a gradient cannot be
   desaturated into line-work.

2. **"Never flat vector."** Style guide §1 bans flat vector outright. The film's fills *are* flat —
   unlit `MeshBasicMaterial`. The resolution is that the flat never stands alone: it always carries
   the milestone-3 ink and hatch layer on top, and it is that layer, not shading, that supplies the
   hand-painted quality. The guide's ban targets *bare* flat vector; a flat under drawn line-work is
   the poster-gouache lane, not clip-art.

3. **The grid.** Style guide §2: the grid is always present on every terrain. In the film it appears
   exactly once, in C7, when the world becomes the board. That is the payoff of the entire ending — a
   grid anywhere earlier would spend it.

Everything else the style guide asks for, this script honours: one biome palette per scene, warm/cool
opposition, detail at edges, one focal accent per frame, and the biome palette families from §Style-DNA-4
(wood interior, stone interior, grass/meadow, forest, snow/ice, dark dungeon) supply the actual hues.
The film walks down that list chapter by chapter and ends on the board, which is the point: the world
in the film and the world in the product are painted from the same set.
