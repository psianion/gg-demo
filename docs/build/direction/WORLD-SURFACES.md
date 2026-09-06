# WORLD SURFACES — every place and every surface in the film, rebuilt

**Status: binding for the world rebuild.** This document answers the client's instruction —
*"every surface and sky and forest and everything has to be repainted and rebuilt… completely
reimagine the world structure texture and pallete to meet our hero's brushing and sketching
skills. It should be natural throughout the story."*

It does not restage time, does not touch the beat sheet, and does not re-litigate the goblin.
It decides **structure, texture and palette for every place in the film**, in the hero island's
own vocabulary, with the numbers an engineer needs to build each one without asking a question.

**What it binds:** every world surface in stages 1–8, the sky, the ground, the drawn half of all
of it, the bake census and the material census.

**What it inherits, unchanged and unarguable:**

- `docs/2026-09-03-art-bible.md` — the transfer, the trilayer, the two quantizers, the stroke
  tiles, the sheet basis, the form rules, the 14 failure signatures. **Where this document and
  the bible disagree, the bible wins.**
- `docs/2026-09-03-world-direction.md` — THE KEPT WORLD: the concept, the palette, the five
  colour laws, the seam restraint, the three key-azimuth families, the asset register, G1–G7.
- `docs/2026-09-03-scene-book.md` — the 48 beats, the state schedules, the asset bill.
- `src/film/stages/hero.ts`, `trilayer.ts`, `islandKit.ts`, `rigs.ts`, `pencil.ts`,
  `palette.ts` — **the code is the standard.** Every recipe below is a scaling of something
  that is already on screen and already accepted.

**What it supersedes:** every v1 surface decision in `src/film/world.ts`. Nothing in that file
survives as art. Geometry survives where the asset bill says `R`; the surface never does.

---

## 0. THE ONE SENTENCE

**The hero island is not a sample of this world — it is a slice of it, and every other place in
the film is the same island at a different size, dressed for a different job.**

That is the whole answer to "natural throughout the story." Twelve islands, one skirt formula,
one ground painting, one stroke-angle ladder, one rim-contour grammar with its gap, one wear
vocabulary, one backdrop class. The film changes weather, scale and dressing. It never changes
hands.

---

## 1. THE ELEVEN CARRIERS — what makes the film one place

These carry across every stage without exception. Anything that breaks one of them is not a
style choice; it is the defect the client rejected, returning under a new name.

### C1 · The skirt formula

Every finite ground object in the film — twelve islands, six worksheet islets, the theatre
disc, the tavern floor card, the board — stands on the hero's three-band closed lathe skirt
(`hero.ts:1430–1458`), scaled by one number:

```
SKIRT_D = clamp(radiusZ * 0.439, 0.5, 2.6)      // hero: 1.8 * 0.439 = 0.790  → k = 1.000
k       = SKIRT_D / 0.79
```

Profiles, radius × (k·y), at 72 segments, **every band `DoubleSide`**, each band starting
*above* where the previous ended:

```
earth lip   [0.996, 0.004] [1.012, -0.055] [0.99, -0.125] [0.982, -0.175]   roughen amp 0.02·k, freq 3.1
stone shelf [0.998, -0.155] [0.962, -0.265] [0.93,  -0.375]                 roughen amp 0.03·k, freq 3.1
keel        [0.945, -0.35]  [0.9,  -0.52]  [0.78,  -0.63]
            [0.5,   -0.71]  [0.18, -0.77]  [0,     -0.79]                   roughen amp 0.05·k, freq 3.1
```

Seeds `7 + i + islandIndex * 3`. Scaled `(radiusX, 1, radiusZ)`. At the hero's numbers this is
byte-identical to what ships, which is the point: **the film's ground vocabulary is not a
translation of the hero's, it is the same function called with a bigger argument.**

Two rules come from the two failures behind that code and they are absolute (bible §3.1):
overlap every profile with the next, and keep the upper run of a downward taper ≤30° inward so
a 20–75° lens sees the stratum before the silhouette turns under.

### C2 · The rim contour, and its gap

Every finite ground object ends in an **open drawn arc, never a closed loop** — `polyline()`,
`'form'` weight, jitter ±0.6% radial (never more; the stroke pipeline's own wobble is the hand,
bible §9-12), at `y = 0.012 · k` above the lip.

**Every one of them has one deliberate unfinished span**: ≥45° of arc on an elliptical card,
≥1 whole corner on a rectangular one. Eighteen gaps in the film. Their positions are authored,
not random, and the table in §5 gives every one.

`inkEdges`-derived rims are banned. The art-side belt from G5 binds: **no rim contour in this
film may depend on the curtain prepass finding an edge.**

### C3 · The ground is one painting

One tiling bake, `bakeGroundSheet()`, 1024², **4 world units per repeat → 256 texels/unit**,
serves every island in the film that has soil. It is `hero.ts:346–462`'s field block made
tileable. Details in §3. There is no second ground painting anywhere.

### C4 · The stroke-angle ladder

`uTriStrokeDir`, radians in the projection plane. Every surface in the film picks from this
ladder and nowhere else. Neighbouring props of one class vary by **≤ ±0.2 rad** — larger reads
as a second draughtsman (bible §2.4).

| dir | family | who uses it |
|---|---|---|
| **0.02** | dead-flat | the board map |
| **0.04** | laid beds | island strata, cliff strata, the theatre kerb |
| **0.06** | radial floor | the stage disc |
| **0.10** | flowing | water bands |
| **0.18** | laid banks | **the sky leaf, cloud banks, the snow flat** |
| **0.30** | tilled | field washes |
| **0.50 + (seed%5)·0.06** | crowns | oak, pine, sapling, shrub |
| **0.55 + (seed%4)·0.07** | one mass, one direction | rock, boulder, scree, cairn, skin |
| **0.61** | the legacy default | plaster, leather, paper props, incident card |
| **1.15 + curl·0.12** | one steep grain per limb | roots, timber masses |
| **1.35 + (seed%3)·0.05** | along the grain | bark, trunks |
| **1.42** | along the boards | the tavern floor |
| **1.45** | drape falls | cloth |
| **1.50** | along the tool | the pencil, the brush |

**The deliberate rhyme:** strata at 0.04 and cloud banks at 0.18 are 8° apart. The sky and the
ground are shaded by the same hand at nearly the same angle. That is what makes the sky belong
to the world instead of standing behind it.

**The grain/stroke distinction, stated once because it decides several builds.** A directional
*grain* (bark streaks, plank runs, fibre) is a fact of the **albedo bake and its UV layout**. A
*stroke family* is a fact of the **draughtsman's sheet**. They are different things and they do
not have to agree. A 24-plank radial disc has 24 grain directions and **one** stroke family.

### C5 · The three-tier law, and the adjacency rule

Two gates on every painted mass:

1. **≥3 separated value tiers, ≥25 luma between tier medians** (bible §4.6; the hero ground
   bake's measured figure). A 26-sample scan across the widest span shows ≥4 plateaus with a
   ≥2/255 step at each boundary.
2. **No two adjacent surfaces of one object may land in the same underdrawing tier band.**
   This is new here and it is the single most useful rule in the document. The underdrawing's
   tier is a deterministic function of the albedo's encoded luminance (`trilayer.ts:365–379`),
   so it can be computed at authoring time. §6 gives the tier for every token in the palette.
   Two adjacent strata that both land in tier 3 draw as **one flat graphite wall**, which is
   exactly how a v1 cliff reads under the curtain.

### C6 · Distance is paper, and paper is age

One depth language, in-material, per island scale: `rig.depthNear` / `rig.depthFar`. **`scene.fog`
is deleted** (`Film.tsx:67`) — it stacks a second, differently-coloured ramp on the same
fragments and it fogs the Prep, which has none (bible §2, `trilayer.ts:480` sets
`material.fog = false` for precisely this reason). Per-stage settings in §5.

Because distance ramps toward `paper`, far scenery reads as thinner, older coats and near
scenery as the freshest paint with the most wear. **The film's space and its chronology agree
without one extra uniform**, and that is where "a document of its keeping" becomes visible.

### C7 · The standing sheet

Every backdrop in the film — sky, cloud bank, treeline bank, the snowy mountain, the view
through the tavern window — is **one class**: a cut sheet standing in a slot with a brace on
its back. Full spec in §2. **Backdrop flats are honest theatre sheets, allowed for atmosphere,
banned for solid matter**, and they admit their sheet-nature at every freeze.

### C8 · The wear vocabulary

Drybrush only where hands go. Three marks, same recipe, on every island:

- **the rubbed landing patch** — one ellipse where he always lands, r ≈ 0.5 world units,
  `mix(earthTrack, earth, 0.5)` @ 0.30α with 6 committed `earth` dabs inside it;
- **two cart ruts** — 4 texel-px wide, `trackShade #8C6F4C` @ 0.22α, entering at the island rim
  and **stopping** at 0.55 of the island radius with a drybrushed stop, never a fade;
- **one repair patch** — colour law 4: exactly one value step off its ground, same hue family,
  drybrushed edges, ≤0.8 world units across.

One per island. Twelve of each in the film. **This is the mark that makes twelve islands read as
one commute**, and it costs three canvas operations per island.

### C9 · The contact ledger

The hero's exact painted contact blobs (`hero.ts:529–552`), radial `caveDark`, authored at the
hero's 394 texels/unit and scaled per card by `(this card's texels/unit ÷ 394)`:

```
lantern post r 48 a 0.30   signpost r 40 a 0.28   mushroom r 18–20 a 0.26
support stone r 22 a 0.24  rock r 26 a 0.24       oak r 58 a 0.26
pine r 50 a 0.26           the goblin r 24 a 0.40
```

**Painted props ground. Drawings never do** (`hero.ts:530`). No exception in any stage.

### C10 · Ink is never a fill

`ink #222222` appears in this film as **line geometry only** — `polyline`, `curveLine`, `score`,
`numeral`, `mark`, `contourArc`. Every dark mass is a palette token. The film's darkest painted
masses are `gobCloak #272E37` (the goblin, tone 0.951) and `caveDark #3F3226` (tone 0.920), and
they never sit against each other (colour law 5).

### C11 · Nothing in the world is ever lighter than the page

`paper #F7F5F0` is the lightest value in every frame of the film including the night. The fire
is the lightest **object**; the page is the lightest **value**. This is what keeps eight
different weathers on one sheet.

---

## 2. THE SKY — decided once

### 2.1 What a sky IS in this film

Today the sky is `FogExp2` tinted per chapter (`Film.tsx:67`), a CSS backdrop lerp
(`Film.tsx:291`), flat cauliflower plates painted `skyVellum`, horizon streaks, band plates and
a sun disc. Every one of those is a gradient wash or a flat fill, and together they are the
single biggest reason the film's body does not look like its cover.

**Ruling — a sky in this film is three things and nothing else:**

**1. THE VOID.** Bare `paper #F7F5F0`. `scene.background = null` (kept, `Film.tsx:61`);
`scene.fog` **deleted**. The sky's body is the page the film is drawn on. Every stage, no
exception. This is already what `palette.ts` says paper is for — *"the page, the void, the
sky's floor."*

**2. THE AIR.** The chapter's sky token exists in exactly one place in the whole engine:
`rigs.hemi.color`. You read the weather off the **tops of rocks, canopies and shoulders**, never
off the void. Ground bounce stays `earthTrack` (`rigs.ts:112`) everywhere except S5
(`floorboard`) and S8 (hemi off entirely). **A chapter's air is a light. It is never a
backdrop plate fill and never a hue in the void.**

**3. THE SKY LEAF.** The only sky *object*: a finite painted sheet standing in a slot.

That is the answer to "it cannot be a gradient." The value change you see in the sky is
**parallax**, produced by the same depth-to-paper ramp that fades a far tree — not a wash.

### 2.2 The sky leaf — structure

`ExtrudeGeometry(shape, { depth: 0.10, bevelEnabled: false })` from an authored `Shape`.
Never a `PlaneGeometry`, never a rectangle.

- **Bottom edge: dead flat.** It is the line where the sheet enters its slot. Nothing crosses it.
- **Top edge: 8–14 lobes**, radii 0.62–1.00 of the leaf height, `quadraticCurveTo` with each
  control point offset ±8%. This is `cauliflowerShape()` (`world.ts:1500`) — **the shape was
  always right; the surface was always wrong. Keep the function, rebuild the material.**
- **One torn notch per leaf**: one lobe pulled to 0.34 of the height. A sheet that was cut, not
  generated.
- **Side edges: vertical and hard.** A sheet has an end.
- **Rake:** `rotation.x = −0.14 rad` (top away from camera), so the top of the leaf sits 1.4–3.0
  world units farther than its bottom. The in-material ramp then lightens the leaf upward **as a
  fact of distance.** This is the film's entire answer to the gradient problem and it costs one
  number.
- **The brace, on the back of every leaf, always built:** two `polyline()` battens in a Λ at
  `graphite`, `'form'` weight, plus one `score()` slot line at the foot in `graphiteLight`.
  Back-facing, so invisible head-on under Performance; **required to be visible at S4's flicker
  and at any freeze that moves the camera off-axis.**

**Placement.** Maximum **3 leaves per stage** (the direction's "three to five real planes"),
measured from the shot's look target:

| leaf | distance | job |
|---|---|---|
| near bank | `depthNear × 1.6` | reads as a real object; carries the most committed paint |
| mid bank | `depthFar × 0.55` | the middle value; where a treeline bank or a hill bank goes |
| far bank | `depthFar × 0.92` | ≥85% washed to paper by the ramp; its only job is to put a soft lid above the horizon so the void has a top |

### 2.3 The sky leaf — texture

```ts
createTrilayer({ color: <the leaf's own token>, map: skySheet,
                 wear: 0.10, poster: 6, stroke: { dir: 0.18 + (i - 1) * 0.05, sheet: true } })
```

- **`poster: 6`.** A pale mass needs few steps; six lands three readable tiers across a bank's
  shoulder. (Rock is 0 because `roughen()` supplies rock's tiers geometrically; a flat sheet has
  no geometry to supply them, so the quantizer must. This is the reason the two classes differ,
  and it is not a preference.)
- **`dir 0.18`, `sheet: true`.** Near-horizontal, one family for the whole leaf, ±0.05 rad per
  leaf so three banks are one hand.
- **`wear: 0.10`.** Low, deliberately: everything the goblin handles wears; the sky he does not.

**`bakeSkySheet()` — one 512² tiling sheet, shared by every leaf in the film.**

Screen-space arithmetic, done first as the bible's first law requires: a leaf spans 14–26 world
units; the film's wide framings measure **77 screen px/world-unit** (S3/S4 wide: 1054 px per
unit of visible height at 1440×900 ÷ a 13.66-unit camera distance). Tiling at **6 world units
per repeat → 85 texels/unit → 1 texel ≈ 0.9 screen px.** A cloud-shoulder dab must therefore be
**≥ 30 texels (≈27 screen px) long and ≥ 10 texels wide** to read at framing.

Content, in order:

1. **Base: `paper`, not a colour.** The chapter's hue arrives as `material.color` multiplying the
   map, so **one bake serves all seven chapters** and every sky hue stays a palette token.
2. **14 bank masses.** Flat-bottomed lobed ellipses, `rgba(<tint>, 0.22)`, r 60–150 texels,
   bottoms aligned to a common baseline ±12 texels. A cauliflower is top-lit and flat-bellied;
   fourteen of them sharing a baseline read as **one bank**, which is the difference between a
   sky and confetti.
3. **5 shoulder dabs per bank**, upper-left quadrant (the +18° key side), `rgba(paper, 0.85)`.
   **The lit edge of a cloud is the page showing through, not white paint.** This is the snow
   doctrine applied to cloud, and it is why the sky can never get brighter than the page (C11).
4. **1 committed under-shadow per bank.** One curved dab, 36–70 texels long, 10–16 wide,
   `rgba(stoneCool, 0.30)`, gathering lower-right. That single dark is the entire reason a bank
   reads as a solid rather than as a stain.
5. **Zero strokes crossing a bank's own bottom line.** The flat belly is the sheet's one straight
   edge and it must survive every pass.

Wrap-offset redraw at the tile edges, exactly as `bakeStrokeTiles` does (`trilayer.ts:115–150`),
so the sheet tiles seamlessly in both axes.

### 2.4 The sky leaf — the drawn half

The leaf's underdrawing is derived from its albedo like everything else, and the tier it lands
in is a computed fact (§6). Under Prep a leaf shows: its tier field, its brace, its slot line,
and **nothing else**. No cloud contours, no drawn outline around a bank — a bank is a mass, and
a mass in this drawing is density, not line.

### 2.5 The per-stage sky — the complete table

| Stage | leaves | tint (`material.color`) | rake | drawn tier | what the sky is doing |
|---|---|---|---|---|---|
| **S1** night camp | **2** — mid, far | mid `canopyDeep #466F33` (the treeline bank) · far `skyDusk #6D78AE` | −0.14 | 4 · 3 | the banks are the darkest things above the horizon; the campfire is the only warm. **Retires the band-plate horizon (`world.ts:1695–1717`) and the three cloud plates (`1720–1729`)** |
| **S2** the address | **0 painted** | — | — | — | **Prep. The sky is the page, and that is the argument.** A drawn world has no weather. The leaves' braces and slot lines stay in frame, unpainted — the sheets are there; they have simply not been painted yet |
| **S3** proof of light | **3** | near `canopyDeep` · mid `rockFace #878B7A` · far `skyDay #ACCDE6` | −0.14 | 4 · 3 · 1 | morning crosses west→east: the far leaf is already ≥85% paper, so the frontier's east side *already looks like unpainted sky* before the seam gets there. **Retires the sun disc + drawn rays (`world.ts:2476–2487`)** — a sun in this film is a key light and, at S7, a painted cone. Never a disc |
| **S4** proof of scenery | **3** | near `canopyDeep` · mid `skyOvercast #AAB6C0` · far `skyOvercast` at 0.6 opacity of tint | **−0.10** | 4 · 2 · 2 | flattest rake in the film — overcast has no depth, and the leaves crowd toward one plane. The **snowy mountain is a fourth sheet of this same class** (§5-S4) |
| **S5** proof of time | **1**, indoors | — (drawn variant) | 0 | n/a | the window's view of the undrawn world: **two flat baked graphite cards on `MeshBasicMaterial`, outside the trilayer** (scene book §3-S5) — a treeline card at `graphite`, a hill card at `graphiteLight`. The film's one sky that is a drawing, seen through the film's one finished room. **Retires `world.ts:3018`'s crossHatch night fill** |
| **S6** the many jobs | **0** | — | — | — | worksheet pages. A worksheet has no sky. The islets' page drop shadows carry the whole read of "above", and `skyVellum` air on their tops carries the weather |
| **S7** the handover | **3** | near `rockFace` · mid `stoneCool #8792A6` · far `skyDawn #E6C1A2` | **−0.18** | 3 · 3 · 1 | steepest rake: the rise wants the sky to fall away as the camera climbs, and the ramp does it for free with no camera-linked tween |
| **S8** the table | **0** | `skyBoard = paper`, hemi **off** | — | — | the film ends in the light it was drawn in |

**One sky. Seven weathers. One geometry class, one 512² bake, ≤3 draw calls per stage, 1 MiB.**

---

## 3. THE GROUND — the film's most repeated surface

### 3.1 The two-card construction

At set scale a single unique ground bake fails the screen-space law: the hero's 5.2-unit card
carries 2048² (394 texels/unit); a 36-unit path ribbon at that density would need a 14,000²
canvas. And a bake below **128 texels/unit cannot carry a legible dab** — a dab must be ≥25
texels long (bible §3.8) and ≤26 screen px (or it stops reading as a dab), and at the film's
figure-floor framing of 133 px/world-unit that caps a dab at 0.195 world units, which is 25
texels only at ≥128 texels/unit.

So the ground is **two cards**, and this is the one structural departure from the hero, made for
a measured reason:

| card | geometry | material | y | carries |
|---|---|---|---|---|
| **the ground card** | `islandKit.buildIsland()`'s circle, scaled | `groundCard` — the tiling meadow sheet, `ground: true`, feather per island | 0 | the field: grass, soil, tone, the page furniture (grid + ghosts) |
| **the incident card** | the same circle at 0.985 scale | `incidentCard` — unique per island, `ground: false`, `feather` +0.04 over the ground card's | **+0.006** | the path, the ruts, the landing patch, the repair patch, the contact blobs |

Precedent for the +0.006 stack: v1's `campGround` (`world.ts:2254–2258`) already does exactly
this at r=4. The incident card is `ground: false` so the grid prints **once**.

Islands whose longest extent is ≤ 8 world units may collapse the two into one unique 1024²
card. Two islands must take the split by size: **the path ribbon (S3, ~36 units)** and **the
miniature world (S7, ~40 units)**.

### 3.2 `bakeGroundSheet()` — 1024², 4 world units/repeat, 256 texels/unit

This is `hero.ts:346–462`'s field block, made tileable. It is the film's ground painting and
there is not a second one.

- **Base fill `grass #94B164`.**
- **9 clustered clumps × 7 ellipses** (hero's, unchanged — clustered meadow masses, never random
  soft ellipses; the P4 verify round read random ellipses as *airbrush clouds* and their
  accidental radial spread as *a concave ring*, `hero.ts:341–345`).
- **2000 curved dabs.** The hero authors 30–64 texels long × 6–14 wide at 0.55–0.9 alpha at 394
  texels/unit. This sheet runs at 256 texels/unit against the film's 133 px/unit floor
  (1 texel = 0.52 screen px, vs the hero's 0.41 — within 27%). **Author every dab 1.27× the
  hero's: 38–81 texels long, 8–18 wide, alpha unchanged at 0.55–0.9.** That single multiplier
  is the entire transfer from cover to film, and it is why the hero's foliage, bark and stroke
  tiles need no change at all.
- **Flow field, unchanged:** `ang = -0.32 + sin(x·0.006 + y·0.004)·0.35 ± 0.15`. One gently
  varying family. Curved dabs via `quadraticCurveTo` — a loaded brush pulled and lifted, never a
  plotted tick.
- **Three separated tiers, ≥25 luma between medians:** shadow `mix(grassDeep, canopyDeep, 0.85)`
  → `#4C7436`, mid `grassDeep #6F9349` / `undergrowth #87945E`, lit `mix(grass, flameCore, 0.58)`
  → `#CDD5A4`. Drawn tiers **4 / 3 / 1** — a three-band span, which is why the hero's ground
  reads as a drawing under the curtain and a flat fill does not.
- **The one change from the hero, and its reason:** the hero biases lit tips toward the key
  quarter via `litBias` (`hero.ts:445`). **A tiling sheet cannot carry a key direction** — it
  would repeat the sun every 4 units. Drop `litBias`; distribute lit tips evenly. The key
  direction is then supplied by the actual key light and by the incident card's contact blobs,
  which is where it belongs.
- Wrap-offset redraw at tile edges, per `bakeStrokeTiles`.

**There is no second "dun" sheet.** An earth-coloured ground (the camp, the miniature's fields)
is the **incident card's earth field widened to cover the island**, with the green sheet showing
only at the verge. One bake serves the whole film.

### 3.3 The incident card — 512² per island, and only five things on it

Nothing else may go on this card. If a mark is not traffic, contact or repair, it belongs to the
sheet or to geometry.

1. **The path / track ribbon.** Hero's recipe verbatim (`hero.ts:372–419`), scaled by this card's
   texels/unit: `earth` verge 0.62 world units wide @ 0.55α · `earthTrack` band @ 0.52 wide ·
   two `timberDark` ruts at 7 hero-px @ 0.26α · two `mix(earthTrack, timberDark, 0.5)` edges at
   5 hero-px @ 0.3α. Drawn ladder `earthLit #D5C29B` (tier 1) → `earthTrack` (tier 3) →
   `trackShade #8C6F4C` (tier 4): three bands, and the path draws itself.
2. **Two cart ruts** entering at the rim, stopping at 0.55 R (C8).
3. **The rubbed landing patch** (C8).
4. **Painted contact blobs**, the C9 ledger.
5. **One repair patch** (C8).

---

## 4. THE SURFACE CLASS TABLE — v2

Channel key as the bible's §8: **A** trilayer paint · **B** authored stroke tiles · **C** paint
poster · **D** edge-wear drybrush · **E** authored contour marks · **F** baked canvas albedo ·
**G** `sketch()` pencil vocabulary (not trilayer). Every trilayer surface gets **A+B+D** by
construction; the table names what is added.

| # | Class | Channels | Stroke family · direction | Tiers (poster / how tone is made) | Bake | Drawn state | Status |
|---|---|---|---|---|---|---|---|
| 1 | **Ground card** | A B D F | ground family, `sheet: false` (it *is* the sheet) | poster 0 — three committed pigment tiers in the bake, ≥25 luma apart | `bakeGroundSheet()` 1024² tiling @ 4 u | tiers **4/3/1** across the field; grid ghost ≤`GRID_INK 0.04`; ghosts @ 0.1 | **PROVEN** (hero card) |
| 2 | **Incident card** | A F | dir 0.61, `sheet: false` | poster 0 — the bake's own ladder | unique 512²/island | path draws as a three-band ribbon; ruts as tier-4 lines that stop | **PROVEN** |
| 3 | **Rock (mass)** | A B D E | `sheet: true`, `dir 0.55 + (seed%4)·0.07` — one direction per mass | **poster 0.** Tiering from `roughen(r·0.22, 2.5)` + `scale.y 0.7` under the key | **none — flat token colour** | uniform tier 3 (`rockFace` 0.529) + `inkEdges(geom, 22, graphiteDark, 'form')` | **PROVEN** |
| 4 | **Cliff / strata** | A B D E | `sheet: true`, `dir 0.04` | poster 0 — **committed band colours, one per band, no two adjacent in the same tier (C5)** | none | the band ladder draws as an alternating density stack — this is what makes a drawn cliff read as strata rather than as a wall | **PROVEN at island scale; extended to landform scale in §5-S1, arithmetic re-derived** |
| 5 | **Foliage** | A B C D E F | `sheet: true`, `dir 0.50 + (seed%5)·0.06` | **poster 12** (~3–4 tiers) | `bakeFoliage()` 512², **unchanged** | crown tier 3 (`canopy` 0.559) / tier 4 (`canopyDeep` 0.701) with 5 contour arcs at 1.10× radius graphite, 4 interior leaf arcs | **PROVEN — transfers 1:1**¹ |
| 6 | **Bark / trunk** | A B D F | `sheet: true`, `dir 1.35 + (seed%3)·0.05` | poster 0 | `bakeBark()` 128² → **256²** at set scale² | tier 3–4, plus `trunkSide()` tapering side strokes | **PROVEN** |
| 7 | **Timber (mass)** | A B D E | `sheet: true`, `dir 1.15 + curl·0.12` per limb | poster 0 | none | `timber` tier 3 / `timberDark` tier 4; every limb carries 2 side contours (`'form'`) + 2 bark streaks (`'faint'`), pushed `(0.03, 0.03, −0.07)` local | **PROVEN** |
| 8 | **Plank / carpentry** | A B D E F | `sheet: true`, `dir` **per merged mesh, once** (C4) | poster 0 | `bakePlank()` 512² tiling @ 2 u, **UV'd so `v` runs along each board's own length** | tier 2 (`plankLit`) / 3 (`plank`) / 4 (`plankShade`); `boxMarks()` 12-edge construction on the Prep side | **PROVEN** (chest, signpost) |
| 9 | **Cloth** | A B C D E | `sheet: true`, **`dir 1.45`** — drape falls | **poster 3** for cast cloth (`cloakIndigo` tier 4, `cloakCrimson` tier 4, `tavernCloth` tier 2) | none | committed shadow mass; contour + exactly **two** fold lines on small cloth, **no tone fill** | **PROVEN** (the goblin's recipe; the figure is his, the recipe is the film's) |
| 10 | **Leather** | A B C D | `sheet: true`, `dir 0.61` | **poster 8**, wear 0.25 | none | tier 3 (`gobSatchel` 0.484) / tier 2 (`bedroll` 0.404) | **PROVEN for ≤12% of a silhouette.** A leather *garment* remains unproven and the film has none |
| 11 | **Metal** | A B C D + E | `sheet: true`, `dir 0.55` | **poster 8** struck/turned; **poster 0** banding | none | tier 2 (`ironLit`) / 3 (`brass`, `iron` 0.552) / 4 (`ironShade`) + contour + **one** core-shadow stroke | **PROVEN. NO specular, NO reflection, NO environment map. Metal is value + contour + one authored glint dab baked into the paint** |
| 12 | **Glass** | `MeshBasicMaterial`, `fog: false` | none | one committed value | none | **its unlit state is bare `paper`** — pre-ignition it is one more unpainted solid on the drawing | **PROVEN.** Must be the head's dominant mass; must out-shine its own ground pool (measured 237 vs pool p95 212) |
| 13 | **Fire** | `MeshBasicMaterial` + sprite + `PointLight` | none | n/a | radial sprite 128²: `flameCore` 0.95 → `amber` 0.5 @0.22 → 0.16 @0.55 → 0 @1.0 | **a still graphite teardrop. No glow, no rays, no sprite.** Scorch is painted dark pooling, never crosshatch | **PROVEN.** sprite `toneMapped: false`, `depthWrite: false`, `renderOrder 4`, scale 1.15 (0.9 under 560 px); glow `distance 1.5 / decay 2` |
| 14 | **Water** | A B D E | `sheet: true`, `dir 0.10` | poster 0 | none | **bare paper + one drawn edge line** — and it is bare paper *by construction*, see the ruling below | **UNPROVEN → SOLVED.** See §7.1 |
| 15 | **Snow** | A B D E | `sheet: true`, `dir 0.18` (the sky family — snow is weather) | poster 0 | none | **blank. tier 0.** `snow #F2F2EC` has `triTone 0.018`, below the shader's own 0.14 mark threshold | **UNPROVEN → SOLVED BY CONSTRUCTION.** See §7.2 |
| 16 | **Paper props** | A B D F | `dir 0.61`, `sheet: false` | poster 0 | `bakeScribbleRows()` 512² tiling — **illegible authored scribble rows, one direction** | the same scribble in `graphite`; dog-eared corner lightening | **PROVEN** (stroke-tile bake at prop scale) |
| 17 | **Standing sheet — painted** | A B C D E F | `sheet: true`, `dir 0.18 ± 0.05` | **poster 6** | `bakeSkySheet()` 512² tiling @ 6 u | tier per tint (§2.5) + the brace + the slot line | **NEW, specified §2 — unproven, first instance measured before the rest** |
| 18 | **Standing sheet — drawn** | **G** | n/a | n/a | `bakeGraphiteCard()` 256² | it is *only* a drawn state — `MeshBasicMaterial`, `fog: false`, `graphite`/`graphiteLight` | **NEW** (S5's window view) |
| 19 | **Machinery** | **G** | n/a | n/a | none | **the film's one asset with no paint side.** `sketch()` lines at `'form'` + `MeshBasicMaterial` fill in `graphiteLight` (tier 2), `fog: false`, no Lambert response at all | **NEW** (S4) |
| 20 | **Painted map / board** | A B D E F | `sheet: true`, `dir 0.02` | poster 0 | `bakeBoardMap()` **1536²** over a 16×16-unit window — see §8 | **identical to its painted state.** Washes land tier 0–2; all ink is geometry. This is the third truth, and §6 proves it numerically | **UNPROVEN → SPECIFIED §5-S8** |
| 21 | **Field wash** | A B D | `sheet: true`, `dir 0.30` | poster 0 | tints baked into `bakeGroundSheet`'s second region | tier 2 / 2 / 3 alternating so adjacent fields never share a band | **by extension from ground** |

¹ **The foliage tile transfers unchanged, verified:** a crown lobe of r 0.3 wraps the whole 512
tile around its 1.885-unit circumference → 272 texels/unit. At the hero's 161 px/unit that is
0.59 screen px/texel and clusters read at 24–56 px; at the film's 77 px/unit wide it is 0.28
px/texel and clusters read at 11–27 px. Both sit inside the ≥25-screen-px cluster law with the
wide as the floor. **No re-bake.**

² `bakeBark` at 128² over a 0.16-unit trunk radius = 1.0-unit circumference gives 128
texels/unit. At the film's 133 px/unit floor that is 1.04 screen px/texel and its 1.5–4.5-texel
streaks read at 1.6–4.7 px — under the 2-px floor at the thin end. **Re-bake at 256²** (0.06 MiB
→ 0.25 MiB), streaks 3–9 texels. The one hero bake that does not transfer, and the reason is
arithmetic, not taste.

**Retired on this document's watch, by name, to zero:** all 31 live `hatch()` / `crossHatch()`
call sites in `world.ts`. Each is answered by a row above; §5 names the replacement per site.

---

## 5. PLACE BY PLACE

Every place gets: **STRUCTURE** (how it is formed, and what makes it a made object) ·
**TEXTURE** (class, direction, tiers, bake) · **PALETTE** (hex ladder, value discipline, eye
path) · **DRAWN** (what it is under the curtain).

Depth settings per stage are given once, at the stage head, as
`rig.depthNear / rig.depthFar`.

---

### STAGE 1 — THE CLAIM · t0–10.2 · genuine night

Air `skyDusk #6D78AE` at `HEMI_I_NIGHT 0.35`. Key: the same `DirectionalLight` at **+18° screen
azimuth**, lowered, `KEY_I_NIGHT 0.55`. **The campfire is the key** in composition; the
directional is what casts. `depthNear 8 / depthFar 34`.
**Deleted:** `earthPlane` + `grassPlane`, the flat-fill treeline rows, the band-plate horizon,
the rock-face hatch (`world.ts:1573`), `Film.tsx:100`'s `0xffb45e` point light.

#### 1A · THE CAMP ISLAND — the ambush ground

**STRUCTURE.** `buildIsland({ radiusX: 6.5, radiusZ: 5.0 })`. `SKIRT_D = 5.0 × 0.439 = 2.20`,
`k = 2.78`. Three-band skirt per C1, seeds 7/8/9. **Two bent tapering roots** on the −x quarter,
the hero's recipe (`hero.ts:1466–1528`) scaled by `k`: radii `[0.075, 0.05, 0.028, 0.007] × k`,
lengths `[0.3, 0.26, 0.2] × k`, **each segment's top radius continues the parent's end radius**,
joints overlap 6% (`next.position.y = -len[i] * 0.94`), curl accumulates `rotation.x = 0.2 + i·0.12`.
Two drawn side contours at `'form'` + two bark streaks at `'faint'` per segment, pushed local
`(0.03, 0.03, −0.07) × k`.

*What makes it a made object rather than a primitive:* the roots. `hero.ts:1459–1465` records
what the straight version looked like — "nails hammered through the island" — and the fix was
not more geometry, it was drawn marks on a curled limb.

**Rim contour:** open arc **72° → 296°**, step 7°, `y = 0.033`, jitter ±0.6%. **Gap 296°→72°
(136°) on the +z near edge** — the edge the opening camera looks over. The film's first frame
of world is an island whose near edge is not finished.

**TEXTURE.** Ground card: the meadow sheet, `feather 0.10`, `depthNear/Far` as above. Incident
card 512² over 13 units = 39 texels/unit — **below the 128 floor, and that is correct**: this
card carries only masses and blobs, never dabs. Its content: the worn camp patch (r 4.0 world
units, `earthTrack` @ 0.42α with 40 `earth` dabs), the fire's scorch pool (r 1.1,
`caveDark` @ 0.34α), the landing patch, two ruts entering at 210°, one repair patch, and the C9
contact ledger for hearth stones, rock, kit and figures.

**PALETTE.** Darkest: `gobCloak #272E37` (0.951) — the goblin on the rim, and he is the only
thing that dark. Then `caveDark #3F3226` (0.920) — the scorch and the logs' undersides. Mass:
`grassDeep #6F9349` (0.533) and `earthTrack #A8875C` (0.512) under a night key, so the whole
field sits tier 3. Lightest object: `flameCore #F7EFD2` (0.031). Lightest value: the page.
**The eye goes to the fire pool first, then up the three arrow-lines converging on the goblin's
silhouette on the rim.**

**DRAWN.** S1 never enters Prep, but the island's drawn half must exist because S2 opens on it:
tier field 3–4 across the ground, the rim arc in `graphiteDark` on the drawn quadrant / `ink`
on the painted one, grid ghost at `GRID_INK`, and the three strata boundary contours at 1.03×
their band's own bottom radius.

#### 1B · THE AMBUSH ROCKS

**STRUCTURE.** The hero rock: `buildRock(1.8, ·, seed)` — icosahedral mass, `roughen(r·0.22, 2.5)`,
`scale.y 0.70`. Three outcrop chunks at r 0.9 / 0.7 / 0.55, kept clear of z = +0.9 (the goblin's
peek line). **Section bands where a rock meets the island rim**: any rock whose silhouette
crosses the cut edge gets two short `polyline()` strata marks continuing the island's own band
boundaries across it, so the rock reads as part of the same sectioned earth rather than as an
object set on top of it. That is what "the edge is a section through the layers" means at prop
scale, and it costs two strokes.

**TEXTURE.** Rock class, `sheet: true`, `dir 0.55 + (seed%4)·0.07`, poster 0, no bake, plus
`inkEdges(geom, 22, graphiteDark, 'form')`.

**The one exception in the film:** the hero rock — the one he peeks around, framed at S1-B4's
rim glance — **takes a 512² `bakeRockFace()`**, because a 1.8-unit close-up prop cannot carry a
whole beat on a flat token. Three committed tiers: `rockLit #B4B39D` (tier 2) on the key
shoulder, `rockFace #878B7A` (tier 3) mass, `rockShade #5F5A4C` (tier 4) underside, 260 curved
dabs at 30–70 texels, plus **the rubbed climbing edge** — the top lip where hands go — as a
drybrushed band of `rockLit` at 0.5α, 40 texels wide. **Every other rock in the film stays flat
token + roughen + inkEdges, as proven.** One bake, 1 MiB, named and priced.

**PALETTE.** `rockLit #B4B39D` (0.333) / `rockFace #878B7A` (0.529) / `rockShade #5F5A4C`
(0.749). Drawn tiers **2 / 3 / 4** — three bands, and the rock draws itself.

**Retires `world.ts:1573`** — the rock-face hatch. Its job (a lit side and an underside) now
belongs to the key and to those three committed tiers.

#### 1C · THE CAMPFIRE

**STRUCTURE.** Seven hearth stones (rock class, r 0.14–0.22, merged into one geometry, one draw
call), two logs (timber mass, `dir 1.15`), **lathe tongue flames** (`buildFlames`, kept), the
`buildGlowSprite()` radial, and `rigs.glow` on the world clock via `flicker()`.

**PALETTE.** `flameCore #F7EFD2` (0.031) heart · `flameBody #F4CC70` (0.181) body ·
`ember #E89544` (0.381) base · scorch `caveDark` (0.920). **Amber is the only glow hue in the
film.** `Film.tsx:100`'s `0xffb45e` point light is deleted and replaced by the amber ramp.

**DRAWN.** A still graphite teardrop at `graphite`, no glow, no sprite, no rays. The scorch
stays as painted dark pooling and draws tier 4.

#### 1D · THE CLIFF — the film's bookend asset, built once

Shared by **S1, S2 and S7**. Baked once for the **exterior-day family (+18°)**; the night takes
it at reduced key intensity with the same azimuth. That azimuth discipline is the only reason
one asset serves two eras.

**STRUCTURE.** Not three tiers. **Seven closed lathe bands** at 72 segments, `DoubleSide`, each
overlapping the next by ≥8% of its own height, radii **non-monotonic** so the silhouette steps
in and out — a monotonic taper is a cone; a cliff has ledges. `CLIFF_RX 5.4`, `CLIFF_RZ 4.6`,
top face y = 6.0.

| # | band | r top | r bot | y top | y bot | colour | tone | **tier** | roughen amp / freq |
|---|---|---|---|---|---|---|---|---|---|
| 1 | plateau lip | 1.000 | 1.010 | 6.00 | 5.62 | `earth #C2A97E` | 0.360 | **2** | 0.05 / 2.8 |
| 2 | first ledge | 1.006 | 0.958 | 5.70 | 4.55 | `cliffShade #746450` | 0.692 | **4** | 0.09 / 2.4 |
| 3 | bright course | 0.968 | 0.984 | 4.66 | 3.30 | `cliffLit #C4B599` | 0.309 | **2** | 0.12 / 2.2 |
| 4 | mid course | 0.992 | 0.930 | 3.42 | 2.05 | `rockFace #878B7A` | 0.529 | **3** | 0.14 / 2.0 |
| 5 | deep course | 0.944 | 0.972 | 2.16 | 1.15 | `cliffShade #746450` | 0.692 | **4** | 0.11 / 2.4 |
| 6 | shelf | 0.980 | 0.886 | 1.26 | 0.42 | `stoneWarm #A9967A` | 0.455 | **2** | 0.16 / 1.9 |
| 7 | talus foot | 0.900 | **1.040** | 0.50 | 0.00 | `stoneShelf #8F795E` | 0.589 | **3** | 0.18 / 1.7 |

Tier sequence down the face: **2 · 4 · 2 · 3 · 4 · 2 · 3** — no two adjacent bands share a
tier (C5). Roughening gets rougher as it goes down, as the hero's keel does, for the same
recorded reason: a smooth lower band shades into an airbrush gradient. Band 7's radius **grows**
downward: a cliff foot spreads into its own talus.

Plus: two top chunks and four talus chunks (rock class, merged), and the plateau's own ground —
the meadow sheet at `feather 0.06` with an incident card carrying the trample and the tended
dressing.

**TEXTURE.** Strata class, `sheet: true`, `dir 0.04`, poster 0, no bake. Value comes entirely
from the seven committed band colours under the key.

**Rim contour:** open arc **352° → 250°** (258° drawn), **gap 250°→352° (102°) on the
north-west quadrant.** That gap is off-camera in S1 and S2 and swings into view exactly at
S7-B3's rise — so the film's bookend surface shows the visitor its unfinished edge at the
moment the goblin hands the world over, and the flatten begins there. This is the single most
deliberate mark placement in the document.

**Strata boundary contours:** six arcs, one per band boundary, radius **1.03× the band's own
bottom radius** (proud — at the true radius `roughen` swallows the line, `hero.ts:1571–1585`).
`graphiteDark` on the drawn quadrant 10–75°, `ink` on the painted quadrant 96–176°.

**Section cut marks:** short downward strokes every **11°** from 18° to 190°, `'form'` weight
(`'faint'` vanishes on mid values, `hero.ts:1603`), sitting on band 6's `stoneWarm` mid value —
**ink dies on `cliffShade`** — with their tails just entering band 7.

**PALETTE.** Lightest `cliffLit #C4B599` (0.309). Darkest `cliffShade #746450` (0.692). Never
`caveDark` on the cliff — that value belongs to the cave mouth, the firebox and the keel, and
colour law 5 keeps the film's ink-darks apart.

**DRAWN.** The alternating tier stack is the whole read. Under Prep the cliff is seven bands of
visibly different graphite density, six boundary arcs, sixteen cut marks, the grid ghost, and —
at S2 — the flagship: **one contour rubbed out and redrawn** (§5-S2).

**Retires `world.ts:3952`** (cliff cracks) — replaced by painted value-break fractures authored
as narrow `cliffShade` wedges inside bands 3 and 6, which are value facts, not line noise.

#### 1E · THE ADVENTURER TRIO

Cloth class, silhouette-first: sculpted fold masses, **one direction per garment panel**,
`poster: 3`, committed shadow mass, **zero interior hatch**. `cloakIndigo #4D5A9E` ×2 (tier 4),
`cloakCrimson #9E3D2C` ×1 (tier 4). Contour + exactly two fold lines each; no tone fill.
Merged to 3 meshes per figure (mass, cloak, head), 9 draws for the trio.
**Retires `world.ts:1644`** — the adventurer's cloak-tone hatch, the last cast-tier hatch site.

Under any freeze they are **graphite** (G6). They are never `markAlive`d in any stage. The
players are in the Performance; the goblin is the one who crosses.

#### 1F · THE ARROWS, THE SHIELD, THE BOLT

Metal class: matte value + contour + **one authored glint dab** baked into the paint, never a
specular. `steel #B1BAC2` (tier 1) shafts, `iron #7D8590` (tier 3) heads. Impacts are **painted
strokes plus `rayGold` bursts**, not decals.

---

### STAGE 2 — THE ADDRESS · t10.2–16.5 · Prep

`curtain = 1`. Flat paper light `FLAT_I 0.9`, **no key**. His contact shadow
(`rig.aliveShadow 0.3`) is the only shadow in the frame. `depthNear 4 / depthFar 18` — the
Prep depth language is line-weight falloff, and at this framing (863 px/world-unit, the film's
tightest) it wants a short ramp.

**The whole stage is the cliff's drawn half, and it needs three things S1 did not build:**

**1. The construction layer.** On the cliff's near face, in `graphiteLight #B9B6B0` (tone 0.311,
tier 2 as a mark colour, but authored as line geometry so it reads as line, not tone):
- **3 construction ellipses** — `ellipseMark()`, the bounding ovals the bands were struck from,
  at 1.08× the band radius so they escape the form;
- **9 measure ticks** down the face at band boundaries, `score()`, `'faint'`;
- **2 scribed arcs** where the plateau's curve was found.

**2. Flagship 1 — the erased, redrawn contour.** Beside his head, in the direct-address medium
close-up: the committed band-4 boundary arc in `graphiteDark #4A4844` at `'form'`, and
**underneath it, offset 0.06 world units and rotated 0.03 rad, its rubbed-out predecessor** in
`graphiteLight` at `'faint'` — with a **legible smear direction**: the ghost's stroke opacity
ramps 0.55 → 0.15 left-to-right across its own length, the way an eraser pulls. Prototype at
390 px before polishing anything else on this stage.

**3. The eraser ghost.** Exactly one, per the film's four: **the boulder's prior-position
ellipse** in `graphiteLight`, an ellipse the same size as the boulder still standing 0.9 units
away. An eraser ghost is the prior position of a thing that is **still in frame**.

**The dust.** The film's only Prep-side particle: a **graphite scribble sprite** — 12 short
`polyline()` scribbles on a 128² card at `graphite`, `MeshBasicMaterial`, frozen by construction
because it never rides a clock. It replaces v1's dust decal.

**The sky.** Zero painted leaves; the braces and slot lines stay (§2.5). This is the frame that
teaches the visitor what a backdrop is in this film, and it teaches it by showing an unpainted one.

**PALETTE.** One painted object in the frame — the goblin, `gobCloak #272E37` (0.951), the
darkest committed value in the film and its only cool hue. Everything else is the graphite ramp
on paper: `graphiteLight` 0.311 · `graphite` 0.572 · `graphiteDark` 0.831. **The eye goes to his
face, then 0.4 s later to the erasure beside his head** — plane two, never plane three (the
composition rule that keeps evidence off the subject).

---

### STAGE 3 — PROOF OF LIGHT · t16.5–26.5 · Prep → the frontier

Air ramps to `skyDay #ACCDE6`. Exterior-day key `(4, 6, 3)`, +18°. `depthNear 6 / depthFar 26`
(the shipped default; the ribbon is the island this default was written for).
`rig.seamX` sweeps 2.0 → 13.0 at t20.55–21.45, parks at 13.0, retires at 30.315.

#### 3A · THE VOID

Bare `paper`. The travel line draws itself ~1.5 world units ahead of him on `curveLine()` with a
`LineSegments2` `instanceCount` ramp — the mechanism `heroLife.ts` already ships for its 152
entrance strokes. **His contact shadow is the only shadow on the void.** No island, no sheet,
no mark. The void is a surface and its treatment is: nothing, deliberately.

#### 3B · THE PATH RIBBON ISLAND — the big build

**STRUCTURE.** A long ribbon card, **not an ellipse**: an `ExtrudeGeometry` from an authored
`Shape` whose centreline is `pathZ(x) = 0.15 + 0.35·sin((x − 0.4)·0.85)` — **the hero's own path
function** (`hero.ts:311`) extended over x = 2…36 — with a half-width that varies 3.2…5.6 world
units on a slow sine so the ribbon is a hand-cut strip, never a rectangle. `radiusZ` for the
skirt formula = the local half-width, so `SKIRT_D` **varies along the ribbon** from 1.40 to
2.46. The skirt is built as a swept version of the three-band profile along the ribbon's own
outline, `DoubleSide`, overlapping, roughen amps scaled by the local `k`.

*What makes it a made object:* the varying half-width and the varying skirt depth. A constant
cross-section reads as extruded stock. It also delivers the direction's promise literally —
**the hero island is a 5.2-unit slice of this ribbon**, so its bakes extend 1:1 and its `pathZ`
is the same curve.

**Rim contour:** two open polylines, one per long edge, each with **one gap of 4.0–5.5 world
units** — the north edge's gap at x 11–15.5 (behind the lantern, so the frontier sweep crosses
a rim that stops being drawn), the south edge's at x 27–32 (which the S4 walk-through leaves by).

**TEXTURE.** Ground card = the meadow sheet, `feather 0.09`. Incident card 512² over 36 units =
14 texels/unit — masses and blobs only, and at that density the path ribbon itself must move to
the **ground card's UV** rather than the incident card. **Ruling:** the ribbon island is the one
island whose path is baked into a **second region of `bakeGroundSheet`** — a 4-unit-wide track
strip in the same 1024² canvas, addressed by a UV offset, so the path runs at 256 texels/unit
like the field. The incident card keeps ruts, landing patch, repair patch and contact blobs.

**Flora.** 40+ trees merged into **four** BufferGeometries: oak crowns, pine crowns, trunks,
undergrowth. `poster: 12` on crowns, `sheet: true`, dirs off the C4 ladder, `bakeFoliage` and
`bakeBark` unchanged (bark at 256², footnote 2). **No wear on foliage — trees are tended, not
handled.**

**PALETTE.** Path ladder `earthLit #D5C29B` (0.244, tier 1) → `earth` (0.360, t2) →
`earthTrack` (0.512, t3) → `trackShade #8C6F4C` (0.629, t4). Field ladder `#CDD5A4` (0.183, t1)
→ `grassDeep` (0.533, t3) → `#4C7436` (0.677, t4). Canopy `canopy #678E42` (0.559, t3) and
`canopyDeep #466F33` (0.701, t4). Darkest in the stage: the cave mouth, `caveDark` (0.920).
**The eye goes to the lantern flame, then down to the tide-line at its foot.**

#### 3C · THE CAVE MOUTH AND DOOR

**STRUCTURE.** v1 fills the mouth with a plane and a crossHatch (`world.ts:1941`). **The mouth
becomes a closed lathe throat**: a 5-step inward taper running 1.6 world units back, radii
`[1.00, 0.86, 0.66, 0.42, 0.18, 0]` at y-steps `[0, −0.18, −0.42, −0.72, −1.10, −1.60]` along
−z, `DoubleSide`, roughen amp 0.09 freq 2.6. It is a hole with a back, and the camera can see
into it.

Three flanking rocks (rock class, merged) and four rim chips. Timber doorframe with
`boxMarks()`. The door: round-topped extrude, 4 plank seams clipped to the arc, 2 strap hinges
with curls and rivets, a ring handle — v1's geometry (`world.ts:1974–2048`), re-surfaced to the
plank and metal classes. **The v1 previous-swing arc is deleted** (the film's four eraser ghosts
are fixed and this is not one of them).

**TEXTURE / PALETTE.** Throat `caveDark #3F3226` (0.920, tier 4) — **the one place in the film
where tier 4 is allowed to fill a large area, because a hole in a drawing is density.** Its
edge is an authored contour arc at **1.03× the throat's outer radius**, `ink` on the painted
side. Frame `timber #94795A` (0.583, t3) with `timberDark #6A5138` (0.770, t4) strap hinges;
door planks `plank #A9895E` (0.504, t3) with `plankShade #866A49` (0.653, t4) in the seams.
Adjacent-tier check: throat t4 sits against frame t3 — legal. `caveDark` never touches
`ravenSlate`; the ravens perch nine units east.

**Retires `world.ts:1941`.**

#### 3D · THE LAMPPOST, THE CHEST, THE RAVENS, THE MUSHROOMS, THE SIGNPOST

All hero-tier or kit assets, geometry kept, surfaces per the class table. The three that change
materially:

- **The signpost.** Its "letters" (`world.ts:2147`, `2189`) become **authored illegible scribble
  rows in one direction**, paper-props class, `bakeScribbleRows()`. Plus **older nail holes in
  graphite** — four `score()` dots in `graphiteLight` where a previous board hung. One whisper of
  history per prop; never captioned.
- **The chest.** Its interior tone (`world.ts:218`) becomes **painted dark pooling** in
  `caveDark` at 0.55α, never crosshatch. `boxMarks()` 12-edge construction on the Prep side;
  corner-lightening on the handled lid edge only.
- **The mushrooms.** Gills (`world.ts:573`) become **one committed shadow mass** —
  `mix(mushCap, caveDark, 0.5)` under the cap, a single value, no rows. `mushCap #B03C22`
  (0.706, t4) is the stage's only saturated red and it appears in threes, which is the signature.
  A **graphite ring where mushrooms grew last season** sits 0.7 units away in `graphiteLight` —
  history, not an eraser ghost.

---

### STAGE 4 — PROOF OF SCENERY · t26.5–36 · overcast

Air `skyOvercast #AAB6C0` from 31.5. Exterior-day key, flattened near-vertical. **No
practicals** — a theatre between shows. `depthNear 7 / depthFar 30`.

#### 4A · THE THEATRE ISLAND

**STRUCTURE.** `buildIsland({ radiusX: 9.0, radiusZ: 7.0 })` at (44, 0, −2). `SKIRT_D` clamps
at **2.60** (the film's maximum skirt depth — beyond it the keel drips below every camera's
lower frame line). Roots on the −x quarter only.

**Rim contour:** open arc **28° → 250°**, **gap 250°→28° (138°) behind the mountain flat's
slot** — the sheet stands in an unfinished edge, which is the stage's whole argument.

**The stage disc.** Not a cylinder. **24 wedge planks**, each an `ExtrudeGeometry`, radial,
0.012 world units of gap between neighbours, **alternating two board lengths (r 7.0 and r 6.86)
so the outer joint ring is not one circle** — a made floor has butt joints that do not align.
Top face y = 0.30. All 24 merged into one BufferGeometry, **one material, one stroke family at
`dir 0.06`**, with each wedge's UVs laid out so `v` runs along its own radius (C4: the grain is
a UV fact, the family is a world fact). The 16 radial plank seam lines (`world.ts:2605`) are
kept as `polyline()` geometry.

**The kerb.** A closed lathe band around the rim: profile `[1.00, 0.30] [1.03, 0.24] [1.02, 0.10]
[0.99, 0.00]`, overlapping, `DoubleSide`, roughen amp 0.04 freq 3.4. **Kerb-throat drybrush**
where the rope runs: a rubbed band of `discLit` 0.35 units wide on the −x quadrant.

**TEXTURE.** Plank class. `bakePlank()` 512² tiling at 2 world units = 256 texels/unit; at the
S4 wide's 77 px/unit that is 0.30 screen px/texel, so a grain streak must be **≥ 34 texels
(≈10 screen px) long and ≥ 7 wide.** 60 bezier grain streaks per tile at `timberDark`/`plank`,
0.22–0.52α, 7–14 texels wide.

**PALETTE.** `discLit #DBCEAF` (0.190, **t1**) key-side boards · `platformDisc #CFC0A0` (0.257,
t1) mass · `discShade #A28E71` (0.492, **t3**) shadowed boards and the kerb throat. Adjacent
tiers 1/1/3 — the mass and the lit tier share tier 1, so **the disc's drawn read comes from its
seam geometry, not from its tone**, which is correct for carpentry: *carpentry keeps its ruled
silhouette and paint supplies all tone.*
Darkest in frame: `canopyDeep` (0.701) in the forest half. Lightest: the mountain's snow
(tier 0, bare paper). **The eye goes to the rope, then along it to the mountain the turn
reveals.**

**Retires `world.ts:2628`, `2670`, `2689`, `2759`** — all four theatre tones.

#### 4B · THE MACHINERY — the film's one asset with no paint side

**STRUCTURE.** Capstan (drum + 6 spokes + a pawl), six radial rails under the disc, **two
counterweight booms sweeping outboard at radius ≈ 8.2** — a metre beyond the kerb, which is what
makes flagship 2 a shot instead of a shot that does not exist. Four blocks. Boom rotation slaved
to `stageDisc.rotation`.

**TEXTURE.** **Class 19.** `sketch(geom, 20–30, 'form')` for every silhouette + a
`MeshBasicMaterial` fill in `graphiteLight #B9B6B0` (tier 2) with `fog: false`. **No Lambert
response anywhere on it.** It does not light, it does not shade, it does not cast, and under
Performance it is simply a drawing that happens to be in the world — which is exactly what stage
machinery is.

**Flagship 2 — the scribed arcs.** In the **apron bed just outboard of the kerb**, in plain view
from the bench clamp: 3 arcs at radii 8.05 / 8.20 / 8.36, `curveLine()` in `graphite` at
`'form'`, spanning 96° of the booms' sweep — **plus one overshoot arc** at radius 8.44 running
14° past the others, which is the mark that says a boom once swung too far. The arcs sit in a
rubbed patch painted into the theatre island's incident card: `mix(earthTrack, earth, 0.5)` at
0.28α. **Prototype at 390 px before polishing the machinery.**

**Eraser ghost 2:** the tree's prior-position ellipse on the disc's bare half, `graphiteLight`.

#### 4C · THE SNOWY MOUNTAIN — a standing sheet, and this is the continuity win

v1 puts the mountain **on the disc** (`world.ts:2718–2774`) so the turn carries it. v2 restages
it as a **backstage flat standing in a slot behind the disc**, so the turn *reveals* it.

**And it is class 17 — the same asset as the sky.** Same `ExtrudeGeometry` from an authored
`Shape` (three peaks instead of cloud lobes: a ridge profile with 3 summits at 1.00 / 0.78 /
0.62 of the leaf height and two saddle notches), same depth 0.10, same flat bottom in a slot,
same Λ brace and slot line in `graphite` on the back, same `dir 0.18` family. **The sky and the
mountain are one class, and that is why the mountain belongs to the weather instead of standing
in front of it.**

**PALETTE / the snow ruling.** Lower two-thirds `rockFace #878B7A` (0.529, t3) with
`cliffShade #746450` (0.692, t4) in the couloirs. The cap is **`snow #F2F2EC`**, and its
`triTone` is **0.018** — below the shader's own 0.14 mark threshold (`trilayer.ts:378`), so
**the snow's underdrawing is literally blank paper, by construction.** Nothing to author. The
snow is shaped by:
- **7 authored lee-side shadow strokes** in `snowShadow #AEB5C0` (`mix(stoneCool, paper, 0.35)`,
  tone 0.320, **tier 2**), painted into the leaf's own bake, gathering on the −x side;
- **one drawn windward edge** at `'form'` weight in `graphiteDark`, running the summit ridge.

**Prep state = Performance state minus the shadow strokes.** The mountain goes almost entirely
blank under the curtain, and the brace shows. That is the flicker's best frame, and it is free.

**Retires `world.ts:4208`** (the massif tone at S7 too — the same recipe serves both).

#### 4D · THE ROPE

Catenary tube + 6 strand wraps + knot + 3 frayed strands + a 3-loop ground coil + the feed line
(`world.ts:2800–2881`, kept). Timber-mass class with a **fibre-streak directional bake**:
`bakePlank()` sampled along the tube's own `v`, `dir 1.15`. `markAlive`'d at contact.
`timber #94795A` (0.583, t3) with `trackShade` (0.629, t4) in the twist shadows — adjacent, so
the twist read must come from the **wrap geometry**, not from tone. Two committed strand
shadows per wrap, painted.

---

### STAGE 5 — PROOF OF TIME · t36–50 · the film's only interior

Air `skyHearth #D4B184`. **The interior key family, the film's one azimuth move: +38°, hearth
key `(2.6, 3.2, 1.1)`.** Hearth + candle practicals carry the room; the key is demoted; **dark
corners are kept.** Hemi ground bounce `floorboard`. `depthNear 3 / depthFar 14` — an interior's
air is short, and the room's far corners must reach paper or the cutaway shows its own back wall
as a hard plane.

#### 5A · THE TAVERN SHELL

**STRUCTURE.** Island card `radiusX 7.0, radiusZ 12.0`, `SKIRT_D` clamped 2.60, under the room
so the cutaway sits on the page like everything else. Rim gap: **one whole −z corner**, behind
the hearth wall.

- **Floor:** 15 boards, each 0.78 units wide × 22 long, extruded, 0.010 gap, **butt joints
  staggered across three z-lines** (v1's six joints, restaged to three stagger lines — a floor
  laid by one person has a stagger pattern). Merged, one material, `dir 1.42`.
- **Walls:** back wall + two 8×14 wings. **Not planes.** Each is a timber frame with plaster
  bays: 4 posts, 2 beams, 3 bays, per v1's structure (`world.ts:2979–3002`), re-surfaced. The
  bays are recessed 0.06 units behind the frame so the frame casts on them.
- **Hearth:** breast + mantel + firebox + hearthstone. **The firebox interior is `caveDark`
  paint pooling (0.920, t4) with five coals at `coals #974D29` (0.716, t4)** and `buildFlames`
  tongues on the world clock. **Retires `world.ts:3059`.**
- **Window:** muntin frame kept, **no glass material at all**, and behind it two **class-18
  drawn standing sheets** — a treeline card at `graphite` (0.572, mark colour) and a hill card
  at `graphiteLight` — on `MeshBasicMaterial`, `fog: false`, outside the trilayer entirely.
  **The room is finished; outside is still pencil.** **Retires `world.ts:3018`**, and it is the
  best single shot idea in the field: the film's thesis, visible through a window, with zero new
  uniforms.
- **Bay tone (`world.ts:3001`)** → drybrush at the bays' recessed edges.

**PALETTE.** `floorLit #CCAB78` (0.342, **t2**) in the hearth pool · `floorboard #B98E52`
(0.469, **t3**) mass · `floorShade #82653E` (0.676, **t4**) under the benches and in the
corners. Three tiers, all separated. Plaster `platformDisc #CFC0A0` (0.257, t1); timbers
`timberDark #6A5138` (0.770, t4) — a t1 bay against a t4 frame is the strongest tier contrast in
the film, and it is what makes a half-timbered wall read at a glance.
Darkest: the firebox `caveDark` (0.920) and the kept corners. Lightest object: `candle #F4E8C8`
(0.063, t0) and the die `dieBone #ECE2CA` (0.092, t0). **The eye goes to the die.**

#### 5B · THE TABLE, AND FLAGSHIP 3

**STRUCTURE.** Top + lip + 6 chord plank seams + one leg + foot (v1's, kept). Plank class,
`dir 1.42` to agree with the floor — one room, one hand.

**The wear bake** — a dedicated 512² region: **forearm drybrush** (two rubbed arcs where elbows
rest, `plankLit` at 0.42α, 90 texels wide) and **one repair patch** exactly one value step off
its ground (`mix(plank, plankLit, 0.5)`), edges drybrushed, ≤0.8 world units.
**Retires `world.ts:3131`.**

**Flagship 3 — the graphite mug rings.** Three ellipse mark sets in `graphite` and
`graphiteLight`, `'form'` weight, radii 0.085/0.092/0.088 world units, at the table's near edge
at reading scale inside the freeze. One mug restaged onto the near edge **beside its own ring**,
so the frame carries the cause and the record together.

**The mechanism, decided here:** the rings are `pencil.ts` `LineSegments2` whose material alpha
is multiplied by `uCurtain`, bound **by identity** to the shared `curtain` object through a
four-line `onBeforeCompile`. No per-frame code, no timeline change, no new uniform object. The
same helper serves every Prep-only mark in the film (the construction layer, the eraser ghosts,
the scribed arcs' graphite pass). **It lives in a new file, `src/film/stages/marks.ts`.**

**Eraser ghost 3:** the tavern door's previous swing arc on the boards, `graphiteLight`.

#### 5C · THE CAST, THE DIE, THE PAPER

- **DM, two players, three patrons.** Cloth class, `poster: 3`, silhouette-first, mid-laugh
  poses. **Graphite under the freeze, always, both parties** (G6). Three graphite figures caught
  mid-laugh, a graphite die still wobbling, a graphite mug ring — and one painted goblin walking
  through them casting the only shadow in the room. That is the shot the whole film is built to
  reach.
- **The d20.** Metal/bone: `dieBone #ECE2CA` gouache (0.092, **tier 0 — bare paper in the drawn
  half**), worn edges, one authored glint dab. **Ruling forced by that tier: the numerals must
  be `pencil.ts` geometry, never baked value.** A baked dark numeral would land tier 4 locally
  and, at the stroke tile's 4.3 CSS-px row pitch, resolve into a smudge rather than a "20" at
  any framing. As ink geometry it reads identically on both sides of the curtain, which is what
  the beat needs. QA at 390 px.
- **Sheets, DM screen, book.** Paper-props class, `bakeScribbleRows()`, one direction.
  **Retires `world.ts:3249` and `3277`.** The DM screen takes its own 256² map-vocabulary bake
  (not a `bakeBoardMap` slice) and one per-mesh trilayer with `alive = 1` set at build — it is
  map art, and map art renders the same on both sides.
- **`buildFinger` retires** with its crease hatch (`world.ts:2914`) — the nudge is the full puppet.
- **The spill drop**, frozen in air: two painted droplet flats plus a tabletop splash decal in
  the wear bake. Its fall is a timeline tween, never world-clocked.

---

### STAGE 6 — THE MANY JOBS · t50–57.5 · six worksheets

Air `skyVellum #EEE6D2`, bright, flat, weightless. One soft day-family key per vignette, never
changing mid-vignette. **No freeze, no frontier, no sky leaves.** `depthNear 5 / depthFar 16`.

#### 6A · THE SIX ISLETS — one recipe, six instances

**STRUCTURE.** Not ellipses. **Worksheet pages:** a rounded-rect `Shape` (5.0 × 5.0 world units,
corner radius 0.22) extruded 0.16 deep, at x = 0, 8, 16, 24, 32, 40, z = −40, top face y = 0.20
(all shipped, untouched).

The three-band skirt **collapses to two** at worksheet thickness, which is the honest scaling of
C1 rather than a violation of it: a lip band (`earth`, 0.06 deep, roughen amp 0.012) over a keel
band (`caveDark`, 0.10 deep, roughen amp 0.02). Both `DoubleSide`, overlapping.

**Rim contour:** a `polyline()` around the rectangle with **one whole corner left undrawn** —
the stop-gap at worksheet scale. **Corner index = the vignette index mod 4**, so the six pages
do not all stop in the same place, and the montage reads as six sheets from one pad rather than
six copies.

**Grid ghost** extends 3 cells past the rim onto the paper.

**Draughting marks in the margins** — non-verbal only, from `pencil.ts`, never a font:
4 dimension ticks (`score()`, `'faint'`, `graphiteLight`), **one arrow** (`polyline()`,
`'form'`, `graphite`), and **one X** where the vignette's prop will stand. One shared mark set,
six placements.

**TEXTURE.** Ground card = the meadow sheet (road / saplings / NPC) or the plank tile (sign /
candles); the monster's islet takes rock. **The incident cards are six UV rects of one shared
1024² atlas** (2×3 grid, 512² per islet, `generateMipmaps: false` — each is seen at one scale,
dead-on). One bake, six islets.

**PALETTE.** Lightest value: the page, and the vellum air makes the islets float. Darkest:
`monsterShade #655037` (0.779, t4). The islets are the film's highest-key stage on purpose —
routine does not announce itself.

**Retires `world.ts:3409`, `3772`, `3784`, `3809`, `3864`, `3687`.**

#### 6B · THE SIX SUBJECTS

1. **The road.** Map sheet + quill + inkpot + 2 weight stones (paper props + metal + rock).
   The **fence-post-scale carpenter's pencil** draws the `roadLine`. This is also where the
   **brush + pigment pot** get their one on-camera use — pencil draws the Prep, brush paints the
   Performance, the trilayer's origin story as two props.
2. **The monster.** **Geometry kept verbatim**, including the 7 shag clumps of 3–6 tick strokes
   (`world.ts:3803`) — that language was authored specifically as **not-hatch** and it is
   correct. Repaint only: `monsterLit #AB9471` (0.461, t3) / `monsterHide #8B6D47` (0.637, t4) /
   `monsterShade #655037` (0.779, t4). Tiers ride the `roughen()` displacement, **never parallel
   bands**. Adjacent t4/t4 on the two darks — legal only because the shag geometry separates
   them; if a walk shows it flattening, the mid moves to `mix(monsterHide, flameCore, 0.45)`.
3. **The tavern sign.** Timber + `iron`. Scribble-row border, painted tankard device, six chain
   links. **The shutter is painted `caveDark` behind slats**, not a crosshatch.
4. **The saplings.** Foliage class at sapling scale; the old stump's **rings are painted
   concentric value steps**, never hatch: three rings at `timber` / `trackShade` / `timberDark`.
5. **The NPC based miniature.** A painted `cloakIndigo` figure on a visible `dieBone` base one
   cell across. The script's own simile made literal, and at the S7 flatten every figure resolves
   to a token disc. The product rhyme costs one prop.
6. **The candles.** Long table + book + 3 candles. `candle #F4E8C8` (0.063, t0) — the candle body
   is bare paper in the drawn half, which is why it needs its drip and holder as geometry.
   **`buildRayBurst` retires — rays were v1's word for light.**

---

### STAGE 7 — THE HANDOVER · t57.5–64.5 · dawn

Air `skyDawn #E6C1A2`. Low dawn key, exterior-day family (+18° — which is precisely why the
cliff's single bake serves S1's night and S7's day). `seamX` parked at `1e6` for the whole
stage. `depthNear 10 / depthFar 44`, **tightening to `12 / 30` for one breath at the rise** —
the film's one depth move, and there is no DOF pass anywhere.

#### 7A · THE TENDED CLIFF — flagship 4

The S1/S2 asset in its second era. `remains` hidden, `tended` shown: the 5-stone cairn
(roughened drums, offset / spun / tilted) and three planted mushrooms, already built and already
the shot. Rock class per §1D.

**Retires `world.ts:4016`, `4027`, `4044`** — the scorches and the trample go with the remains.
**Eraser ghost 4:** the erased scorch-ring beside the cairn, `graphiteLight`, sited at B2.

#### 7B · THE MINIATURE WORLD — a real miniature, not a desk

v1's `miniWorld` topology kept and re-surfaced (`world.ts:4125–4313`).

- **8 gabled houses.** Plank walls `plank` (0.504, t3), `timberDark` frames (0.770, t4), roofs
  `trackShade #8C6F4C` (0.629, **t4**). Roof t4 against wall t3 — legal. Two ember roofs at
  `ember #E89544` (0.381, t2). Merged into one geometry.
- **12 trees.** Foliage class, merged, `bakeFoliage` unchanged.
- **The massif.** Rock class banding + the §4C snow ruling verbatim: `snow` cap (tier 0, blank
  under the curtain), `snowShadow #AEB5C0` lee strokes, one drawn windward edge. **Retires
  `world.ts:4208`.**
- **6 fields.** Field-wash class, `dir 0.30`, alternating so **no two adjacent fields share a
  tier**: `fieldA #B2AC75` (0.370, t2) · `fieldB #A59F6E` (0.431, t2) · `fieldC #957751` (0.591,
  t3). Where two t2s must adjoin, the hedge line between them is the separator. Hedges are
  `polyline()` in `canopyDeep`. **Retires `world.ts:4297`.**
- **2 roads.** `earthTrack` double-edged `curveLine()`. **They join `miniWorld` and flatten** —
  closing the v1 split at `4213–4233`.
- **The river — and this is the water class solved.** See §7.1. **Retires `world.ts:4260`.**

#### 7C · THE GOD-RAY CONES

Painted cones with **drawn edge lines, dab-textured fill, and a hard stop — never a soft alpha
falloff.** Fill `mix(rayGold, paper, 0.62)`; edges `rayGold #A88E3E` (0.494, t3) at `'form'`.
2–3 instances, shared geometry. **Light is a painted object in this film, never a flare and
never a lens artifact.**

#### 7D · THE FLATTEN

Per G7, and no surface decision here may change it: `uTriFlat` (0…1) plus `uTriFlatUv` (vec4
rect) per merged group; the board atlas bound **rig-side as one shared sampler**; the same tween
ramps `uTriFlat` 0→1 while running `scale.y → 0.02` and settling rotation. **Nothing is created
or destroyed**, so reversing is the identical tween backwards. The frontier *look* comes from
the shader's existing `triDabN` noise applied to the `uTriFlat` mix — one added line, and the
seam machinery is not involved. `rig.seamX` stays at `1e6`.

12 flatten groups, x-keyed stagger. Their destinations are UV rects of `bakeBoardMap()`, which
is the same bake S8 stands on, so **the flatten's destination can never drift from the board it
lands on.**

---

### STAGE 8 — THE TABLE · t64.5–66 → rest

**Unlit.** `skyBoard = paper`; hemi off; no key. The board is lit by the page, and the film ends
in the light it was drawn in. Camera locked top-down at 4.6 units above a 24 × 24-unit card.

#### 8A · THE BOARD

**STRUCTURE.** Not a plane and not a `GridHelper`. **A printed sheet on the page:** a 24 × 24
card 0.02 units thick with its own two-band micro-skirt (lip `boardFill`, keel `caveDark`,
0.012 deep each) so it sits on the page like every other object in the film; a **drawn double
rule** inset 0.55 units; **corner trim marks**, the way a printed board is trimmed; and the
battle grid at 1 world unit per cell.

**All ink on the board is `pencil.ts` geometry** — grid, double rule, trim marks, roads,
coastlines, token-disc rims. This is a ruling and it is what makes the bake resolution
affordable (§8).

**`bakeBoardMap()` — 1536², over a 16 × 16-unit window centred on the card = 96 texels/unit.**

*Screen-space, derived:* at 1440×900 the camera sits 4.6 units above, `fitFov` gives 46.2°
vertical, so visible height = 3.93 world units → **229 screen px/world-unit**; 1 texel = 2.4
screen px. On phone (390×844) the fov clamps at 70° and `fitPullback` returns 2.11, so the
camera sits 9.71 units up and 13.6 × 6.3 world units are visible → **62 px/unit**; 1 texel =
0.65 px. **The desktop figure is a genuine undersample and it is accepted for one reason: the
bake carries only washes, and washes are the one thing you can undersample. Every edge the eye
judges is line geometry, resolution-solved by `setPencilResolution` on mount and every resize.**
The 16-unit window covers the phone's 13.6-unit view with margin; outside it the card is
`boardFill` with edge wear.

**The vocabulary, fixed:** field washes · illustrated canopy blobs · gabled house icons · inked
roads at 2 px · painted flame marks · token discs at one-cell diameter · water as bare paper
with a drawn edge · the battle grid at `GRID_INK`.

**What the map depicts, and this is the product argument:** **the film's own world, in the order
you walked it.** The camp and the cliff at the east edge, the path ribbon running west, the
theatre clearing, the tavern, the six job sites as marginal vignette boxes, the massif in the
north. A visitor who scrolled the film recognises the map. No product export contains this, which
is why it is hand-authored here.

**PALETTE and the third truth.** `boardWash #E8E1D2` (0.098, **tier 0**) · `boardWater #CFDDDF`
(0.134, **tier 0**) · `fieldA #B2AC75` (0.370, t2) · `boardCanopy #92AD76` (0.398, t2) ·
`ember` flame marks (0.381, t2) · `dieBone` token discs (0.092, t0) · ink line-work as geometry.

**Every wash lands in tier 0 or tier 2 and every line is geometry, so the board renders
identically on both sides of any frontier and inside every freeze.** That is the third truth,
and the tier column above is its proof rather than its promise.

**Board wear.** Edge-handling drybrush at the margins, four rubbed corners, one thumb smudge.
**No pentimenti** — a printed board has no revisions. The world carries erasures; the product
does not.

**Board breath ≤0.5% at rest.** Every material board-local, transparent, opacity 0 at build —
the shipped fade contract holds for the new asset.

---

## 6. THE DRAWN HALF — measured, not asserted

The underdrawing's tier is a deterministic function of the albedo's encoded luminance
(`trilayer.ts:365–379`):

```
triT    = (enc(lum(albedo)) − enc(lum(ink))) / (enc(lum(paper)) − enc(lum(ink)))
        = (enc(lum(albedo)) − 0.1526) / 0.8072
triTone = 1 − triT   (± a ±0.03 world-space noise that lands boundaries ragged)
tier    = 0 if triTone < 0.14, else clamp(floor((triTone − 0.14) × 6.25) + 1, 1, 4)
```

| tier | `triTone` | reads as |
|---|---|---|
| 0 | < 0.14 | **bare paper — no mark at all** |
| 1 | 0.14 – 0.30 | sparse, grainy, rows lifted |
| 2 | 0.30 – 0.46 | continuous single pass |
| 3 | 0.46 – 0.62 | two passes, wider lead |
| 4 | ≥ 0.62 | three passes, hard pressure |

**Every token in `palette.ts`, computed. This is the table to author against.**

| tier | tokens (`triTone`) |
|---|---|
| **0 — blank** | `paper` 0.000 · **`snow` 0.018** · `flameCore` 0.031 · `boardFill` 0.040 · `keyWarm` 0.042 · `candle` 0.063 · `skyVellum` 0.073 · `tooth` 0.079 · `lanternGlass` 0.092 · **`dieBone` 0.092** |
| **1 — sparse** | `flameBody` 0.181 · `amber` 0.217 · `skyDay` 0.221 · `skyDawn` 0.225 · `platformDisc` 0.257 · `steel` 0.299 |
| **2 — one pass** | `skyHearth` 0.309 · `graphiteLight` 0.311 · `skyOvercast` 0.320 · `earth` 0.360 · `gold` 0.373 · `amberLantern` 0.379 · `ember` 0.381 · `grass` 0.385 · `bedroll` 0.404 · `stoneWarm` 0.455 · `moss` 0.457 · `tavernCloth` 0.457 |
| **3 — two passes** | `water` 0.462 · `goblinGreen` 0.464 · `floorboard` 0.469 · `brass` 0.474 · `gobSatchel` 0.484 · `stoneCool` 0.489 · `rayGold` 0.494 · `undergrowth` 0.504 · `plank` 0.504 · `earthTrack` 0.512 · `rockFace` 0.529 · `grassDeep` 0.533 · `iron` 0.552 · `canopy` 0.559 · `graphite` 0.572 · `timber` 0.583 · `amberEmber` 0.596 · `skyDusk` 0.597 |
| **4 — hard pressure** | `monsterHide` 0.637 · `needle` 0.676 · `canopyDeep` 0.701 · `mushCap` 0.706 · `gobCloakWorn` 0.718 · `cloakIndigo` 0.728 · `cloakCrimson` 0.739 · `timberDark` 0.770 · `ravenSlate` 0.815 · `graphiteDark` 0.831 · `caveDark` 0.920 · **`gobCloak` 0.951** · `ink` 1.000 |

**The mixes this document authors:**

| name | hex | tone | tier |
|---|---|---|---|
| `grassLit` = mix(grass, flameCore, .58) | `#CDD5A4` | 0.183 | 1 |
| `earthLit` = mix(earth, flameCore, .35) | `#D5C29B` | 0.244 | 1 |
| `discLit` = mix(platformDisc, flameCore, .30) | `#DBCEAF` | 0.190 | 1 |
| `boardWater` = mix(water, paper, .72) | `#CFDDDF` | 0.134 | **0** |
| `boardWash` = mix(boardFill, earth, .18) | `#E8E1D2` | 0.098 | **0** |
| `cliffLit` = mix(stoneWarm, flameCore, .35) | `#C4B599` | 0.309 | 2 |
| `snowShadow` = mix(stoneCool, paper, .35) | `#AEB5C0` | 0.320 | 2 |
| `rockLit` = mix(rockFace, flameCore, .40) | `#B4B39D` | 0.333 | 2 |
| `floorLit` = mix(floorboard, flameCore, .30) | `#CCAB78` | 0.342 | 2 |
| `plankLit` = mix(plank, flameCore, .30) | `#C0A881` | 0.365 | 2 |
| `fieldA` = mix(earth, grass, .35) | `#B2AC75` | 0.370 | 2 |
| `boardCanopy` = mix(canopy, paper, .30) | `#92AD76` | 0.398 | 2 |
| `fieldB` = mix(earth, undergrowth, .50) | `#A59F6E` | 0.431 | 2 |
| `ironLit` = mix(iron, steel, .45) | `#949DA7` | 0.439 | 2 |
| `monsterLit` = mix(monsterHide, flameCore, .30) | `#AB9471` | 0.461 | 3 |
| `discShade` = mix(platformDisc, timberDark, .45) | `#A28E71` | 0.492 | 3 |
| `stoneShelf` = mix(stoneWarm, timberDark, .42) | `#8F795E` | 0.589 | 3 |
| `fieldC` = mix(earthTrack, timberDark, .30) | `#957751` | 0.591 | 3 |
| `trackShade` = mix(earthTrack, timberDark, .45) | `#8C6F4C` | 0.629 | 4 |
| `plankShade` = mix(plank, timberDark, .55) | `#866A49` | 0.653 | 4 |
| `floorShade` = mix(floorboard, caveDark, .45) | `#82653E` | 0.676 | 4 |
| `grassShade` = mix(grassDeep, canopyDeep, .85) | `#4C7436` | 0.677 | 4 |
| `ironShade` = mix(iron, ravenSlate, .50) | `#626974` | 0.683 | 4 |
| `cliffShade` = mix(stoneWarm, caveDark, .50) | `#746450` | 0.692 | 4 |
| `coals` = mix(amberEmber, caveDark, .35) | `#974D29` | 0.716 | 4 |
| `rockShade` = mix(rockFace, caveDark, .55) | `#5F5A4C` | 0.749 | 4 |
| `monsterShade` = mix(monsterHide, caveDark, .50) | `#655037` | 0.779 | 4 |

**Every value in this document is a palette token or a `mixHex` of two tokens.** No fresh hues.
`hero.check.ts:190` and `:265` enforce this and the new work must pass the same gate.

**Two consequences worth stating outright, because they turn two "unproven" rows into solved
ones without a line of new shader code:**

1. **Snow is already correct in the drawn half.** `snow #F2F2EC` computes to `triTone 0.018`,
   under the shader's own 0.14 threshold. Paint a surface `snow` and its underdrawing is
   literally bare paper. The reserved-paper doctrine is not an art convention here; it is what
   the shipped shader already does.
2. **The drawn state of the whole film is authorable at design time.** Every "what does this look
   like under the curtain" question in this document was answered by arithmetic before anything
   was built, and every adjacency conflict was found the same way.

**What every class adds in Prep beyond its tier field** — the complete list, because "the drawn
half" is not only tone:

| class | what appears only in Prep |
|---|---|
| Island / ground | grid ghost ≤`GRID_INK`, ghosts @0.1, three strata boundary arcs, section cut marks, construction ellipses (S2 cliff only) |
| Cliff | six boundary arcs, sixteen cut marks, the erased-and-redrawn contour (S2), measure ticks |
| Rock | `inkEdges(geom, 22, graphiteDark, 'form')` — the graphite-side silhouette |
| Foliage | 5 crown contour arcs at **1.10×** radius (painted side uses 1.05×) + 4 interior leaf arcs |
| Timber / plank | `boxMarks()` 12-edge construction, strap lines, end-arcs |
| Cloth | contour + two fold lines; **no tone fill** |
| Metal | contour + one core-shadow stroke |
| Fire | the still graphite teardrop replaces the whole flame, glow, sprite and light |
| Glass | reverts to bare `paper` — an unpainted solid on the drawing |
| Standing sheet | **the Λ brace and the slot line**, back-facing, the sheet admitting it is a sheet |
| Machinery | nothing — it is *only* a Prep state, in every frame |
| Particles | absent, except S2's graphite dust scribble |
| Board / map | **nothing changes.** The third truth |

---

## 7. THE UNPROVEN CLASSES — specified by extension, marked

The bible names three classes with no hero precedent (water, snow, painted map) and three
partly-proven (cliff at landform scale, soil as a mass, leather beyond a patch). Each gets a
build-first-instance-and-measure ruling.

### 7.1 Water — **UNPROVEN → SOLVED, by choosing the pigment for its drawn tier**

Raw `water #679FB4` computes to `triTone 0.462` — **tier 3**, a dense two-pass graphite field.
That is the opposite of what a pencil does with water, and it is why v1's water hatch
(`world.ts:4260`) was always going to be wrong however it was drawn.

**Ruling.** The film's one funded pigment use of water — S7's river — is painted at
**`boardWater #CFDDDF` = `mix(water, paper, 0.72)`, `triTone 0.134`, tier 0.** Its drawn state
is bare paper *by construction*, and the only mark is a drawn edge line at `'form'` weight in
`graphiteDark`. Body comes from **tangent-aligned lit dabs in `paper` at 0.7α** painted into the
band, following the river's own tangent, `dir 0.10`.

Shorelines take technique **D** — the trilayer's granular dab frontier
(`trilayer.ts:313–325`) — as the drybrush where water meets land, plus the `triEdge` tide-line,
**which already is a waterline.**

**No transparency, no reflection, no specular, ever.** Everywhere else in the film water is bare
paper with a drawn edge.

*Status: unproven → build the S7 river first, measure its `triTone` against the readback, then
promote this row.*

### 7.2 Snow — **UNPROVEN → SOLVED BY CONSTRUCTION** (§6, consequence 1)

Reserved paper. `snow #F2F2EC` draws blank. Shaped by `snowShadow #AEB5C0` lee strokes (tier 2)
and one drawn windward edge at `'form'`. **Prep = Performance minus the shadow strokes.** Two
instances: the S4 mountain flat and the S7 massif — one recipe.

*Doctrinally, this is also why the mountain is barely painted: nobody has played there yet.*

### 7.3 The painted map — **specified §5-S8**

The one thing that must be measured before it is polished: **the desktop texel density (2.4
screen px per texel).** Build the wash layer, screenshot at 1440×900, and if the washes read as
blur rather than as paint, the answer is **fewer, larger washes**, never more texels — the
budget has no room and the line-work is already carrying the crispness.

### 7.4 Cliff at landform scale — **specified §5-1D, arithmetic re-derived**

The hero proves the three-band skirt at 5.2 × 3.6 units and **161 px/world-unit**. The cliff runs
10.8 × 9.2 units and is framed at **67 px/unit** (S1, 15.7-unit camera distance) and **34
px/unit** (S7's rise). At 34 px/unit a band 1.15 units tall is 39 screen px — enough for a
committed tier, not enough for an authored dab, which is exactly why the cliff carries **no bake
at all** and gets its whole read from seven committed band colours plus authored contours.
**That is the extension, and it is a subtraction rather than an addition.**

### 7.5 Soil as a 3D mass — **avoided, deliberately**

Nothing in this film is a soil mound, bank or berm. Every earth surface is a card or a strata
band. If a beat later needs one, it is built as a two-band lathe with the ground sheet on its
top face, and it is measured before it is trusted.

### 7.6 Leather beyond a patch — **not needed**

The film's only leather is the goblin's satchel (≤12% of his silhouette) and the bedroll. No
leather garment, no saddle. The row stays unproven and unused.

### 7.7 The standing sheet — **NEW, unproven**

The whole sky class. **Build S3's three leaves first**, at the S3-B3 camera, and check three
things before any other stage gets leaves: (a) the rake's ramp reads as depth and not as a
gradient; (b) the far leaf at `depthFar × 0.92` is ≥85% paper and does not band; (c) the brace
is invisible head-on under Performance and legible at 12° off-axis.

---

## 8. THE BAKE AND MATERIAL CENSUS — measured, including a breach

### 8.1 The bakes

| bake | size | mips | scope | texels/unit | MiB |
|---|---|---|---|---|---|
| `bakeStrokeTiles` (shipped) | 1024² | yes | film-wide | 4.3 CSS px row pitch | 4.00 |
| `bakeIslandAlbedo` (shipped, Cover) | 2048² | yes | the hero card only | 394 | 16.00 |
| `bakeFoliage` (shipped) | 512² | yes | film-wide | 272 (per lobe) | 1.00 |
| `bakeBark` (**re-bake, footnote 2**) | 256² | yes | film-wide | 256 | 0.25 |
| `bakeGroundSheet` | 1024² | yes | film-wide, tiling @ 4 u | 256 | 4.00 |
| `bakeSkySheet` | 512² | yes | film-wide, tiling @ 6 u | 85 | 1.00 |
| `bakePlank` | 512² | yes | film-wide, tiling @ 2 u | 256 | 1.00 |
| `bakeScribbleRows` | 512² | yes | film-wide, tiling | 256 | 1.00 |
| `bakePaperTooth` | 256² | yes | film-wide | — | 0.25 |
| `bakeContactBlob` | 256² | yes | film-wide | — | 0.25 |
| `bakeRockFace` (**the one exception**, §5-1B) | 512² | yes | the S1 hero rock | 285 | 1.00 |
| `bakeGraphiteCard` | 256² | yes | S5 window ×2 | — | 0.25 |
| glow sprite (shipped) | 128² | yes | film-wide | — | 0.06 |
| DM-screen map bake | 256² | yes | S5 | — | 0.25 |
| **incident cards** | 512² × 6 | **no** | camp · ribbon · theatre · tavern · miniature · **islet atlas @1024²** | 14–39 | 5.00+4.00 |
| **`bakeBoardMap`** | **1536²** | **no** | S7 atlas + S8 board | 96 | 9.00 |

**Census.** Mipped: 4.00+16.00+1.00+0.25+4.00+1.00+1.00+1.00+0.25+0.25+1.00+0.25+0.06+0.25 =
**30.31 MiB × 1.33 = 40.3 MiB**. Unmipped: 5.00 + 4.00 + 9.00 = **18.0 MiB**.
**Total 58.3 MiB ≈ 61.1 MB.**

### 8.2 The breach, reported honestly

**The direction's ceiling is 48 MB and this scheme lands at 61 MB — over by 13 MB.** That is a
real finding, not a rounding, and it comes almost entirely from two places: the Cover's shipped
2048² island albedo (21.3 MB with mips, 35% of the whole budget) and the board.

**Levers, cheapest first, with what each costs in quality:**

| # | lever | saves | what it costs |
|---|---|---|---|
| 1 | **Board 2048² → 1536²** (already applied above) | 12.4 MB | nothing measurable — the ink is geometry |
| 2 | **Six incident cards → one shared 2048² atlas, unmipped** | 1.0 MB | one bake instead of six; nothing visual |
| 3 | **Board 1536² → 1280²** | 2.6 MB | washes at 80 texels/unit; 3 screen px/texel desktop |
| 4 | **Drop `bakeRockFace`**, hero rock returns to flat token | 1.3 MB | S1-B4's rim glance loses its close-up tiers |
| 5 | **The Cover's 2048² card released when the film body is entered, re-baked on scroll-back** | up to 21.3 MB | a re-bake on reverse scrub, ~12 ms, inside a stage's runway |

**Recommendation: levers 1 + 2, which land the census at 57.9 MB, and then lever 5, which is the
only one that reaches 48 MB and the only one that costs nothing on screen.** Lever 5 is an engine
decision in `Film.tsx` / `hero.ts`, both of which this workflow may not touch — **it is
handed off as §9-H1.** If it is declined, levers 3 + 4 together land at 54.0 MB and the ceiling
needs a recorded amendment.

**Millisecond budget** (G2, ≤12 ms per bake, ≤140 ms total): 14 film-body bakes at the
schedule's one-stage-ahead cadence. The two to watch are `bakeGroundSheet` (2000 curved dabs at
1024² — the hero's 2000-dab 2048² bake is the closest measured analogue) and `bakeBoardMap`.
**Measure both with `performance.now()` before anything else in this document is polished.**

### 8.3 The material census — 31 shared trilayer materials, ceiling 33

One shared trilayer per surface class, plus at most three stroke-direction variants per class
where a class genuinely needs more than the ±7° of hand variance the bake already carries. All
share the rig uniforms by identity and compile to one program.

| # | material | color / map | poster | dir | sheet | wear |
|---|---|---|---|---|---|---|
| 1 | `groundCard` | ground sheet | 0 | — | false | 0.20 |
| 2 | `incidentCard` | per-island map | 0 | 0.61 | false | 0.24 |
| 3 | `rockMass` | `rockFace` | 0 | 0.55+ | true | 0.22 |
| 4–9 | `strata` ×6 | `earth` · `cliffLit` · `stoneWarm` · `rockFace` · `cliffShade` · `stoneShelf` | 0 | 0.04 | true | 0.22 |
| 10 | `keelDark` | `caveDark` | 0 | 0.04 | true | 0.18 |
| 11 | `crownOak` | foliage map | 12 | 0.50+ | true | 0 |
| 12 | `crownPine` | foliage map, `needle` tint | 12 | 0.56+ | true | 0 |
| 13 | `bark` | bark map | 0 | 1.35+ | true | 0.22 |
| 14–15 | `timberMass` ×2 | `timber` · `timberDark` | 0 | 1.15+ | true | 0.24 |
| 16 | `plankRadial` | plank map | 0 | 0.06 | true | 0.26 |
| 17 | `plankBoards` | plank map, `floorboard` tint | 0 | 1.42 | true | 0.26 |
| 18 | `plaster` | `platformDisc` | 0 | 0.61 | false | 0.20 |
| 19–21 | `cloth` ×3 | `cloakIndigo` · `cloakCrimson` · `tavernCloth` | 3 | 1.45 | true | 0.22 |
| 22 | `leather` | `gobSatchel` / `bedroll` | 8 | 0.61 | true | 0.25 |
| 23 | `metalStruck` | `brass` | 8 | 0.55 | true | 0.22 |
| 24 | `metalBand` | `iron` | 0 | 0.55 | true | 0.22 |
| 25 | `paperProp` | scribble map | 0 | 0.61 | false | 0.18 |
| 26 | `skyLeaf` | sky map | 6 | 0.18± | true | 0.10 |
| 27 | `snowMass` | `snow` | 0 | 0.18 | true | 0.10 |
| 28 | `waterBand` | `boardWater` | 0 | 0.10 | true | 0.10 |
| 29 | `fieldWash` | ground sheet's field region — **all three tints in one bake** | 0 | 0.30 | true | 0.20 |
| 30 | `monsterHide` | `monsterHide` | 3 | 0.61 | true | 0.24 |
| 31 | `boardMap` | board bake | 0 | 0.02 | true | 0.14 |

**31 of 33. Two slots spare.** The three field tints were collapsed into one material with the
tints in the bake specifically to leave that headroom.

**Non-trilayer, outside that ceiling:** machinery basic ×2, window view cards ×2, glass ×1,
flame basic ×3, glow sprite ×1, god-ray ×1, and `pencil.ts`'s three shipped weights.

**Per-mesh materials** (the ≤40 census): 12 flatten groups + 10 reveal shells + 8 touched props
+ the DM screen + the hero rock = **32 of 40.**

**Instancing is banned** and this document contains no instance of it. Every repeated prop merges
into one `BufferGeometry` per class per island, transforms baked into vertices — which is also
what makes `vTriWorld` correct for free. A 40-tree stand is one draw call.

### 8.4 Draw calls, estimated per stage against the ≤120 ceiling

| stage | estimate | the drivers |
|---|---|---|
| S1 | ~62 | camp + cliff cards, 2 sky leaves, merged treeline, merged rocks, campfire kit, 9 cast, goblin ~28 |
| S2 | ~46 | one island, no sky leaves, the mark sets, goblin |
| **S3** | **~74** | **the ceiling-setter.** Ribbon (2 cards + shadow), 3 leaves, 4 merged flora groups, 7 prop beats, ~14 mark groups, goblin |
| S4 | ~70 | theatre island, disc merged to 1, kerb, machinery ~8, mountain leaf, rope, merged forest |
| S5 | ~88 | interior: floor 1, walls 3, framing 1, hearth 4, window 4, table 3, 18 cast meshes, die 3, props, ~10 mark groups, goblin |
| S6 | ~44 | one islet live at a time + its subject |
| S7 | ~78 | cliff, 12 merged flatten groups, 3 leaves, god-rays, die2 |
| S8 | ~9 | board card, skirt, grid, rules, trim, tokens |

All under 120. `scripts/draws.check.ts` gates S3 at the B3 and B7 cameras.

---

## 9. HANDOFF NOTES — changes needed in files this workflow may not touch

Written down rather than made, per the brief.

- **H1 · `Film.tsx:67` — delete `scene.fog`.** Both depth languages are in-material
  (`trilayer.ts:480` already sets `material.fog = false` for every trilayer). Scene fog stacks a
  second, differently-coloured ramp on the same fragments and it fogs the Prep, which has none.
  The chapter-air CSS lerp at `Film.tsx:291` must then read its colour from `rigs.hemi.color`
  rather than from the fog object.
- **H2 · `Film.tsx:100` — delete the `0xffb45e` point light** parented into the flame groups.
  It is the film's one open colour violation; the amber ramp replaces it at S1 and S3.
- **H3 · `Film.tsx:314` — the v1 `hemisphereLight(0xcdd9e8, 0x8a7458, 1.45)` retires** in favour
  of `rigs.ts`'s hemi, whose colour is the chapter air (§2.1, component 2).
- **H4 · `rigs.ts`** needs the three chapter-family key presets, a **three-slot practicals array**
  with per-source flicker phase, and key-target tracking. ~15 lines, already priced in the asset
  bill. It also needs `HEMI_I_NIGHT = 0.35` / `KEY_I_NIGHT = 0.55` as named constants.
- **H5 · `world.ts`** — every retirement named in §5 is in a file this workflow does not own.
  They are listed by **name**, never by line, because the file has moved ~278 lines since the
  direction doc was written.
- **H6 · `trilayer.ts`** needs the two flatten uniforms (`uTriFlat`, `uTriFlatUv`) and one line
  applying `triDabN` to the flatten mix (G7). No other shader change is requested by this
  document.
- **H7 · the bake budget breach (§8.2).** The only lever that reaches the 48 MB ceiling without
  a visible cost is releasing the Cover's 2048² island albedo when the film body is entered and
  re-baking it on scroll-back. That is a `Film.tsx` / `hero.ts` decision. If declined, the
  ceiling needs a recorded amendment to 54 MB.

**New files this document authorises (all new, none owned elsewhere):**
`src/film/stages/surfaces.ts` (the 31-material registry and the class bakes) ·
`src/film/stages/sky.ts` (the standing sheet) ·
`src/film/stages/ground.ts` (`bakeGroundSheet`, the two-card island) ·
`src/film/stages/marks.ts` (the curtain-driven Prep-only mark helper) ·
`src/film/stages/board.ts` (`bakeBoardMap`).

---

## 10. THE GATES THIS DOCUMENT MUST PASS

1. **No hatching anywhere.** One stroke family per face, one direction per organic form.
   The 31 live `hatch()` / `crossHatch()` sites in `world.ts` go to zero, each answered by a
   named row in §4 and a named replacement in §5.
2. **Paper `#F7F5F0` · ink `#222222` · amber `#F2C35E` the only glow · `#B6D648` the wordmark
   pip alone · goblin-green his alone.** Every value in this document is a token or a `mixHex`
   of two tokens.
3. **`NoToneMapping` is the judged transfer.** Every tone, tier and hex above was computed under
   the flat transfer. Nothing here may be judged or tuned under ACES.
4. **No instancing.** Merge per class per island.
5. **≤120 draw calls per stage · ≤40 per-mesh materials · bakes ≤1024² except the board.**
   Measured in §8; the board exception is taken at 1536² and the census breach is reported rather
   than hidden.
6. **Real painted surfaces only.** Smooth Lambert masses, ruled analytic stripes, default
   primitives and gradient washes are rejected on sight — and §5 names, for every place, the
   specific v1 instance of each that it replaces.
7. **Code-authored geometry and canvas-baked textures only.** No GLTF, no OBJ, no new
   dependency, no image-generation pipeline. Everything above is `three` primitives, authored
   `Shape`s, `LatheGeometry`, `ExtrudeGeometry`, `roughen()` and a 2D canvas.
