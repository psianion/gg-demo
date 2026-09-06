# MOCK-4 — cast and effects: cloth · fire · transient marks

Mockup author 4. Art bible §11.2 rows **9 (Cloth)**, **13 (Fire)** and **23 (Transient mark)**,
built as real geometry against the actual hero island on `?mock=`.

Files owned and landed:

- `story/src/film/mock/cloth.ts` — the adventurer trio
- `story/src/film/mock/fire.ts` — the campfire, at two of its four scales
- `story/src/film/mock/marks.ts` — one authored instant of the S1 volley
- `story/src/film/mock/marksKit.ts` — the shared view-plane mark vocabulary (new helper,
  same stem, imported by all three)

Nothing else was touched. `MockSheet.tsx`, the art bible, the other twenty stubs, and
`world.ts` / `timeline.ts` / `hero.ts` / `goblin.ts` / `GobStudy.tsx` are unmodified.

---

## What is on screen

| shot | file |
|---|---|
| trio, rig A | `mock-cloth-perf-1442x732.jpg` |
| trio, rig B (curtain 1.00) | `mock-cloth-prep-1442x732.jpg` |
| campfire + hearth stance, rig A | `mock-fire-perf-1442x732.jpg` |
| campfire + hearth stance, rig B | `mock-fire-prep-1442x732.jpg` |
| the volley, rig A | `mock-marks-perf-1442x732.jpg` |
| the volley, rig B | `mock-marks-prep-1442x732.jpg` |
| all three beside the island | `mock-cast-sheet-perf-1442x732.jpg` |

All at `&zoom=2` except the sheet (`zoom=1`), viewport **1442 × 732 CSS** — the measured
viewport, not the 1440 × 900 asked for: the window would not give more than 732 CSS px of
page height on this machine, and the filenames say what was actually captured. At zoom 2 the
solve is ≈185 px per world unit, so a 1.24 u figure is ≈230 px and the 0.55 u campfire ≈100 px
— above the film's own 77 px/u wide framings and its 37.1 px/u volley, which is the framing
row 23 is authored against.

Zero console errors on every capture (`read_console_messages`, `onlyErrors`).

---

## Measured — triangles, draws, materials

Read off the live scene through an injected probe (`window.__mock`), not estimated.

**Cloth — the trio, three figures at 1.24 u**

| merged mesh | triangles | material |
|---|---|---|
| `cloth:indigo` | 1104 | trilayer `cloakIndigo` · poster 3 · dir 1.45 · sheet |
| `cloth:crimson` | 838 | trilayer `cloakCrimson` · poster 3 · dir 1.45 · sheet |
| `cloth:face` | 756 | trilayer `humanFace` · poster 3 · dir 0.55 · sheet |
| `cloth:linen` | 80 | trilayer `bedroll` — row 10's leather recipe (see finding 4) |
| `cloth:steel` | 84 | trilayer `steel` · poster 8 · dir 0.55 |
| `cloth:brass` | 200 | trilayer `brass` · poster 8 · dir 0.55 |
| `cloth:timber` | 500 | trilayer `timberDark` · dir 1.15 |
| `cloth:marks` | — | 456 line segments, shared `'form'` stroke @ `graphiteDark` |

**3562 triangles · 8 draws · 7 trilayer materials + 1 shared pencil variant.**
Per figure: 1187 tris, 2.67 draws. Zero instancing; every figure's parts are baked into the
class geometry by matrix.

**Fire — per fire, at any of the four scales**

| merged mesh | triangles | material |
|---|---|---|
| `flames` (5 tongues, one geometry) | 720 | **shared** flame `MeshBasicMaterial`, vertex colours |
| `coals` (6 lumps) | 480 | **shared** coal trilayer, vertex colours |
| `embers` (14 blob flats) | 70 | the same shared flame material |
| `fringe` (contour + 4 shag ticks) | — | 66 line segments, shared `'form'` @ `graphiteDark` |
| glow sprite | — | **shared** `SpriteMaterial`, one 128² bake film-wide |

**1270 triangles · 5 draws per fire · ZERO per-mesh materials.** Every fire in the film shares
the same four materials, so the mock's two fires cost the same material budget as one. Both the
flame material and the glow sprite mix on `rig.curtain` **by identity**, so a partial curtain is
a coherent held frame and the halo leaves exactly with the paint.

**Transient marks — one authored instant, six marks**

| object | triangles / segments | material |
|---|---|---|
| `marks:bolt` (spindle) | 120 tris | shared flame material |
| `marks:flash` (3 spindles merged) | 360 tris | shared flame material |
| `marks:boltEdge` | 15 segs | shared `'hero'` @ `graphiteDark` |
| `marks:trail` | 27 segs | same |
| `marks:strike` | 3 segs | same |
| `marks:spall` (4 ticks merged) | 24 segs | same |
| `marks:dust` (5 ticks merged) | 30 segs | same |

**480 triangles · 7 draws · ZERO new materials.**

**All three plus the hero island in one frame:** draws **345**, triangles **90 596**,
programs 20, textures 13. The hero island alone with a stub in the slot measures draws 320 /
tris 79 888, so the three classes together add **25 draws and ~10 700 triangles** — a whole
stage's cast, fire and attack layer inside a fifth of the 120-draw ceiling.

Gates honoured by construction: no `hatch()` / `crossHatch()` / `contact()` call anywhere in
the four files; one stroke family per face and one direction per organic form; no
`InstancedMesh`; no new bake (the glow sprite is the hero's own 128², rebuilt not added); no
new dependency; no `Math.random`, no integrator, no `mod(t, period)`, no billboard, no
`visible` flip.

---

## Where the recipe was wrong

Sixteen findings. Each was found by building the row as written, rendering it beside the
island, and looking.

**1 · Row 9 — the cloth silhouette is not reachable from a lathe of revolution.**
The row says *"sculpted fold masses, silhouette-first … a wedge on a column"* and specifies no
cross-section. Built with a round cross-section, the first pass came back as **three bottles**:
a straight tube, a scalloped shoulder bulge, a knob on top. That is the chess-pawn silhouette
v1 failed by, and no profile fixes it. The missing number is one the row does not carry: the
body's cross-section is squashed to **0.56 in depth**. Wide across the lens, thin in depth — a
human. **Recommend the row carry `DEPTH 0.56`**, because every author who builds row 9 from the
prose alone will build a bottle first.

**2 · Row 9 — `humanFace`'s hex is a typo; its formula and its luma are right.**
§11.3 lists `humanFace = mix(stoneWarm, timberDark, .55)` → `#7E6E52`, tone 0.450, tier 2.
Evaluated, that mix is **`#867056`** (measured off the live material). `#867056`'s Rec.709
encoded luma is **0.4502** — exactly the 0.450 the table states. `#7E6E52` is what
`t ≈ 0.62` gives. The build follows the formula; **the hex in §11.3 should read `#867056`.**

**3 · Row 9 / R17 — the trio's two bare heads have no brim to throw the shade tier.**
R17 replaces eye geometry with *"the head's lower two-thirds sitting in a committed shade tier,
thrown by the brim or hood overhang"*, but the roster gives the trio **one** brim. Rendered
bare, the other two take the key on the crown and read pale and warm — the exact inversion of
*"he has a bright thing in a dark head; they have a dark head."* Built: a **`timberDark` hair
cap** (tier 4) on the two hoodless figures. Hair in a neutral earth token is already granted to
the cast by §1.4's chroma law, and it is **not** a hood dome — the dome is the first of his five
marks and no human may compete for it.

**4 · Row 10 is written "THE ROW STAYS UNUSED", and the cast needs it.**
§1.3 requires a cuff as a committed value step at the end of every sleeve, because *"a cast hand
is the end of the sleeve and the object starts inside it."* The nearest committed token is row
10's own `bedroll`, and row 10's recipe (`sheet: true`, dir 0.61, poster 8, wear 0.25) fits a
cuff exactly. Built that way. **Row 10 is used; the census should count one leather material for
the cast, not zero.**

**5 · Row 9 / R5 — four draws is not reachable at this palette.**
R5 decides *"4 (cloth · mass · metal · timber)"*. Merging is per **material**, and the trio's own
palette names seven: `cloakIndigo`, `cloakCrimson`, `humanFace`, `bedroll`, `steel`, `brass`,
`timberDark`. Measured: **8 draws** (7 class meshes + 1 merged stroke set). 4 is reachable only
by collapsing to one cloak colour and one kit token — which R4's restaging and §1.4's separation
rule both want kept. **Recommend R18's S1 line carry 8, not 4.** It costs four draws out of 120.

**6 · Row 13 — "a still graphite teardrop" cannot be delivered by draining the fill.**
R14's mechanism is exactly right and works: one shared material, `onBeforeCompile`,
`rig.curtain` by identity, `customProgramCacheKey = () => 'flame'`, and the drain is smooth
across the sweep. But **a drained fill is a grey blot; a teardrop is a LINE.** The first Prep
capture had no drawn read at all. Built: **one authored teardrop contour in the shot's view
plane, present in both states** — which is what `world.ts`'s own `buildFlames` already did with
`sketch(…, 'form')`, so it is not a new mechanism. It is the mark that makes the Prep fire a
drawing, and the row should name it.

**7 · Row 13 — `graphite` is the wrong drain target.**
At `graphite #82807A` the drained flame sits within a hair of its own `graphiteDark #4A4844`
contour and the contour vanishes into the fill. Built at **`graphiteLight #B9B6B0`**: the
contour reads, and C11 still holds — the fire is the lightest **object**, the page the lightest
**value**.

**8 · Row 13 — the ember count rule is right; the ember SPREAD is unspecified and matters.**
"≥ 8, not size" is correct (14 built, 0.048–0.076 u). But a wide convection arc reads as
**confetti thrown over a fire**. The plume has to be a narrow column that leans with the
tongues: built at x-spread `0.072·(0.35+k)` with a `+k·0.05` lean.

**9 · Row 13 — the amber ramp has to be spent on the MASS, not the heart.**
Running `flameCore` up the tall tongue gave a pale cream lump whose only read was its contour.
`flameCore` is the **bottom quarter of the core tongue and nothing else**; the mass is
`flameBody → amber → ember`. Row 13's stop list is right; its distribution needs saying.

**10 · Row 23 — a `curveLine` at 26 segments is a bead chain, not a line.**
`strokes()` subdivides every segment three ways (`pencil.ts:337`, `SUB = 3`), so 26 curve points
over a 2.5 u arc give **75 sub-segments of ~2.7 screen px** against a round-capped `'hero'`
stroke **3.4 px** wide. A segment shorter than its own width renders as a dot, and the bolt's
trail came back as a string of beads. **The rule the row needs: a curve's point count must keep
every sub-segment at ≥ 2× the stroke width.** Built at 9 points ≈ 7.6 px per sub-segment.

**11 · Row 23 — "the amber ramp for cast light" cannot apply to a STROKE.**
`pencil.ts`'s line materials have no curtain channel, so a stroke painted amber **survives the
drain unchanged** and stands as a glow hue on the fully drawn black-and-white page — the one
thing Prep may not contain, and the thing the client named by name. Built: the towed arc and the
bolt's contour are `graphiteDark`; the amber lives in the spindle and the three flashes, which
share the flame material and do drain. Both states honest, and in Performance it reads as the
film's own grammar — a drawn contour over a painted mass.

**12 · Row 23 — the spindle's `flameCore` belly is a smear on paper.**
Finding 9 at mark scale: a cream belly on `paper #F7F5F0` is art bible §9.3's gradient wash by
another name. Built: `flameCore` only within ±0.22 of the belly, `amber` through it,
`amberEmber` out to both points. The doctrine's "fat one third along, a point at both ends" is
right; the value distribution is what makes it read as a loaded brush rather than an airbrush.

**13 · Smoke — not built, and that is the direction's own decision, not an omission.**
The brief names smoke. `CAST-AND-EFFECTS.md` §4.3 declines it outright: this world's fire is the
keeper's fire, *"smoke says burning where the film needs lit"*, and there is no soft volumetric
in this language that would not land as §9.3's gradient wash. Reported rather than built.

**14 · `pencil.ts` exports no way to merge authored strokes.**
A four-tick spall would cost four draws where row 23 budgets one, and the trio's fifteen marks
would cost fifteen. Built `mergeStrokes()` in `marksKit.ts`: `polyline()` runs the full
wobble/overshoot pipeline first, then the resulting `LineSegmentsGeometry` interleaved buffers
are concatenated — **loss-free, the hand survives the merge**. It is why the trio's whole drawn
half is 1 draw and the spall and the dust are 1 each. **Handoff: this belongs in `pencil.ts`.**

**15 · A mockup cannot honour the alive-shadow rule.**
`rigs.markCaster` is per-rig and the route owns the rig, so a mock's meshes keep whatever
`castShadow` they are given. `true` puts a cast shadow on the Prep page, which G6 forbids
outright for the cast. Built with `castShadow = false`, so nothing here casts in either state;
in the film a cast figure grounds through C9's painted contact blob in the island's own albedo,
which a mock standing on bare paper has not got. **Handoff: `MockSheet` would need to hand
`rigs.markCaster` to `buildMock()` for a mock to ground honestly.**

**16 · Route observation, for whoever owns `MockSheet.tsx`.**
Two things every author will hit:
- `?mock=<class>` renders the hero island **with its seam live** for the first seconds after
  load — the island's left half graphite, its right half painted. `MockSheet.tsx:105` parks
  `rig.seamX` at `1e6` on mount, but `buildHero()`'s own entrance drives it afterwards, so the
  like-for-like comparison the route exists for is compromised until it settles.
- `&zoom≥3` tightens on the **combined** bounding sphere's centre, and a mock at `x 6.4` falls
  outside the frame from zoom 3 up. **Zoom 2 is the practical maximum for a small class**, which
  is why every capture here is at 2.

---

## Where each class is weakest

**Cloth — the garment's own tier separation.**
Row 9 gives cloth no bake and `poster: 3`, so the whole value read comes from one key light on a
lathe. At 185 px/u the garment is close to one flat value with a lit rim: C5's *"≥ 3 separated
tiers, ≥ 25 luma between medians"* is carried by the head, the cuff and the attribute, not by the
drape itself. The drawn half is fine — the Prep capture has the shoulder line, the drape, and
all three attributes nameable at 230 px, which is the graphite-cast check — but the painted half
leans on its contour more than the hero island does on its own. If the walk rejects it, the
levers in order are deeper folds (amp 0.05 → 0.08), then a committed `floor`, and **not** a bake:
the row's "Bake: none" is right, because a bake on a 230 px figure is texture nobody sees.

**Fire — the drawn contour sits proud of the mass on the screen-left side.**
The teardrop is authored in the shot's view plane (correct, per row 23's own basis) and the five
tongues lean in 3D, so at the hero azimuth the outline stands 2–4 px off the mass on one side.
At the film's own framings (77 px/u wide, 37.1 px/u at the volley) that is under a pixel and
invisible; at zoom 2 it shows. Fixing it properly means deriving the contour from the merged
tongue silhouette rather than authoring it, which is a prepass the film does not otherwise have —
so it is recorded, not built.

**Marks — the trail still beads at its thin far end, and the impact reads as one cluster.**
The bead fix (finding 10) holds along the body of the arc, but the last two sub-segments shorten
under the round cap and dot again. And *"three flicks and four chips"* lands as a single starred
cluster at zoom 2: the flash spindles (0.35 u = 65 px) and the spall (0.16–0.26 u = 30–48 px)
overlap around one point. FEWER, BIGGER did its job — nothing here is 2–4 px dirt — but the next
lever is pushing the three flashes out to ~0.06 u from the strike point so the hand's three
separate flicks separate. At the film's 37.1 px/u they already do; at 185 px/u they do not.

---

## Build state

- `npm run build` — **green**. `tsc --noEmit` clean, `vite build` in 2.14 s, production bundle
  **1,440.33 kB** — byte-identical to the recorded baseline, so the DEV-only `?mock=` route and
  all four of these modules still tree-shake out of production.
- `npm run check` — **green**, all 13 gate scripts, `gob.check` 22 gates / 22 passing /
  0 regressions.
- Live console on every capture — **zero errors**.
