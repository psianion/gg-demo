# MOCK-1 — group A · ground and landform

Author group A of art bible §11.8: **ground · incident · rock · strata · field**, built as real
geometry on the `?mock=` route and judged against the actual hero island in the same frame, in
both rigs.

Modules (the only files this workflow wrote):

```
story/src/film/mock/groundKit.ts    the shared kit — C1 skirt, C2 rim, C3 sheet, C8/C9 incident,
                                    rock class, field wash, strokeSet, the drawn-mark helpers
story/src/film/mock/ground.ts       row 1
story/src/film/mock/incident.ts     row 2
story/src/film/mock/rock.ts         row 3  (+ bakeRockFace, the film's one rock bake)
story/src/film/mock/strata.ts       row 4  (+ the plan-form, the band arithmetic)
story/src/film/mock/field.ts        row 21
```

Nothing else was touched. `npm run build` green (tsc + vite, 871 ms, bundle **1,440.33 kB** — the
recorded baseline, so the route still tree-shakes out of production). `npm run check` green, all
13 gate scripts, `gob.check` 22/22 with 0 regressions. Zero console errors on every walk.

---

## 1 · What is on screen

**`?mock=ground`** — an island at rx 2.2 / rz 1.55 carrying the film's one ground painting
(`bakeGroundSheet`, 1024² tiling at 4 world units = 256 texels/unit), on the hero's three-band
closed lathe skirt, with an open rim contour whose unfinished span is 148°, two strata boundary
arcs and thirteen section cut marks. C1's whole claim is testable here: rz 1.55 gives
`SKIRT_D = 0.680`, `k = 0.861`, so every profile point and every mark height is the hero's own
number × 0.861. Set rz to 1.8 and the geometry is byte-identical to what ships.

**`?mock=incident`** — the same card with the incident layer on top: the ground circle at 0.985,
+0.006 y, `ground: false`, transparent everywhere it is not painted. Carries the five things the
row allows and nothing else — path ribbon, two cart ruts stopping at 0.55 R with a drybrushed
stop, the rubbed landing patch, five contact blobs off the C9 ledger, one repair patch.

**`?mock=rock`** — the S1 hero rock (five merged lobes, the film's one `bakeRockFace` at 512² =
285 texels/unit), three merged outcrop chunks, four merged talus chunks, and one boulder
straddling the cut edge carrying two strata marks that continue the island's own band
boundaries. On its own ground card, because clause 4 is only true if there is a cut edge to cross.

**`?mock=strata`** — the cliff. Seven closed lathe bands at 72 segments, `DoubleSide`,
non-monotonic radii, `CLIFF_RX 5.4 / RZ 4.6`, top y 6.0, tier sequence 2·4·2·3·4·2·3, plus the
plateau meadow, the rim contour with its 102° north-west gap, six boundary arcs, sixteen cut
marks, nine measure ticks, two crown chunks and four scree chunks.

**`?mock=field`** — six fields on an irregular lattice, three UV-selected tints from one 256²
bake, one material, one draw, with merged hedge ridges on every lattice edge.

Screenshots, all at the shipped hero camera solve, cited beside each claim below:

| file | what it shows |
|---|---|
| `mock-groupA-sheet-1545x784-prep.jpg` | **the acceptance test** — all five classes and the hero island at `curtain 1.00`, everything graphite, only the goblin in colour |
| `mock-groupA-sheet-1545x784-perf.jpg` | the same five painted |
| `mock-groupA-sheet-1545x784-seamed.jpg` | the five drawn beside a painted hero (the route's seam flake, §5) |
| `mock-ground-incident-field-1545x784-perf.jpg` | field · incident · ground · hero, left to right, zoom 2 |
| `mock-incident-zoom3-1545x784-perf.jpg` | the incident card's path against the hero's own, zoom 3 |
| `mock-rock-1545x784-perf.jpg` | the outcrop, zoom 2 |
| `mock-strata-1545x784-perf.jpg` | the cliff, zoom 1 |

**The acceptance test passes.** In `mock-groupA-sheet-1545x784-prep.jpg` the four ground cards,
the cliff and the outcrop sit at the same tonal weight and in the same stroke family as the hero
island beside them; the rim contours, skirts and cut marks read as one grammar. Nothing crosses
a second stroke direction anywhere in the frame.

---

## 2 · Measured

Baseline: the hero island alone renders **320 draws / 79,888 triangles** at 1545×784. Each class
below is the delta it adds.

| class | draws | triangles | trilayer materials | bakes |
|---|---|---|---|---|
| ground | **+7** | +3,226 | 4 (groundCard, 3 skirt bands) | `bakeGroundSheet` 1024², shared |
| incident | **+8** | +3,290 | +1 (incidentCard, unique per island) | `bakeIncidentCard` 512², unmipped |
| rock | **+19** | +18,724 | +4 (hero rock mapped, 3 rockMass rungs) | `bakeRockFace` 512² |
| strata | **+24** | +16,686 | +6 strata bands, +2 rockMass rungs | none — correct, this class has no bake |
| field | **+10** | +4,372 | +2 (fieldWash, hedge) | `bakeFieldWash` 256² |
| **all five in one frame** | **+64** | **+43,032** | **18 distinct** | 4 bakes, 5.25 MiB unmipped-equivalent |

Every class is far inside the ≤120-draws-per-stage ceiling: the heaviest single class is the
cliff at 24 draws, and it is the only asset in S1, S2 and S7's landform slot.

**`bakeGroundSheet` measures 14.9 ms** (`performance.now()`, logged to the console on every load,
`groundKit.ts:301`). §11.6's budget is **≤12 ms per bake**, so it is **24% over** — see finding
F8.

Every colour emitted is a palette token or a two-token `mixHex`, verified by recomputing
`triTone` and the tier exactly as `trilayer.ts:365–379` does. The recomputation reproduces the
bible's own published numbers to three decimals (snow 0.018, grassShade 0.677, cliffLit 0.309,
trackShade 0.629, rockShade 0.749, fieldC 0.591), so the model is the shader's:

```
grass       #94B164  tone 0.385  tier 2  luma 165
grassDeep   #6F9349  tone 0.533  tier 3  luma 134
grassShade  #4C7436  tone 0.677  tier 4  luma 103
grassLit    #CDD5A4  tone 0.183  tier 1  luma 208
```

Ground tier medians land 103 / 137 / 208 — **34 and 71 luma apart**, both past the ≥25 law, and
they span three tier bands (4 / 3 / 1) exactly as row 1 requires.

`hatch(` / `crossHatch(` / `contact(` call sites across all six files: **0**.

---

## 3 · Where the recipe was wrong

Eight findings. Each was found by rendering, not by reading.

**F1 · Row 3's "icosahedral mass" cannot be built as written at hero-rock scale.**
`IcosahedronGeometry(r, 1)` renders as a geodesic dome: `roughen()`'s noise wavelength (freq 2.5
over a ±1.8-unit form is about nine cells) is far coarser than the facet grid, so displacement
moves whole neighbourhoods together and the subdivision pattern survives intact. Subdividing to
detail 2 is worse, not better — `inkEdges(geom, 22)` then finds ~480 edges and draws every one,
and the mass renders as a wireframe circus tent. Built as the hero's own
`DodecahedronGeometry` at detail 0 (36 triangles, 30 edges — a count a hand would draw), with a
big mass made of **more lobes, not more subdivision**. A big rock is not a finer rock; it is
more rocks, overlapping, which is the appendix's own step 2. `groundKit.ts:rockGeometry`.

**F2 · Row 3's `inkEdges(geom, 22, …)` does not survive the merge.** Every dodecahedral edge
meets at ~63°, so on a single pebble 22 and 40 draw the same 30 lines and 22 is right. On a
five-lobe mass it is 150 lines and the drawn rock reads as a cracked eggshell. Built at
threshold 40 for merged masses, 22 for single lobes. `rock.ts`.

**F3 · Row 3's palette column and its drawn-state column disagree.** The palette gives three
tiers (`rockLit` t2 / `rockFace` t3 / `rockShade` t4); the drawn-state column says "uniform tier
3". Both are right for different rocks: uniform t3 for the flat-token rocks, three tiers for the
one that carries a bake. Built as three tiers on the hero rock, uniform token elsewhere.

**F4 · Row 3's bakeRockFace tiers must be COMMITTED BANDS, not per-dab probability.** Authored
as 260 dabs over a flat `rockFace` fill, a 3.6-unit mass rendered as one even value — at 285
texels/unit a 30–70-texel dab is a tenth of a lobe, so 260 of them are texture and never
structure. Built as three brushed-ragged horizontal bands (which the spherical UV puts exactly
where they belong: v = 1 is the key shoulder, v = 0 the underside) with the dabs breaking the
boundaries. `rock.ts:bakeRockFace`.

**F5 · Row 4's roughen amplitudes 0.05 → 0.18 are in WORLD units, not the lathe's unit-radius
space.** Taken in unit-radius space as the hero's own amps (0.02 → 0.05) are, they become
0.05·5.4 = 0.27 up to 0.18·5.4 = **0.97 world units** of radial displacement on bands whose
authored overlaps are 0.008–0.016 of a unit radius. Every band punches through its neighbours
and the cliff renders as a stack of translucent bowls. Divided by `CLIFF_RX` they give 0.05–0.18
u of break against the hero's own 0.05–0.13 u at island scale — the same hand, the bigger
argument, C1 exactly. `strata.ts:134`.

**F6 · Row 4 has no plan-form, and without one seven correct bands render as a wedding cake.**
The non-monotonic radii are right, but they step in ELEVATION only; at the corrected amplitude
`roughen()` cannot break a 5.4-unit ring, so the six ledges flare the same distance all the way
round. Added one lobed outline (three harmonics, ±11% at most) shared by every band, the plateau
and every mark — shared so no two bands can cross and the 8% overlaps survive untouched.
**A cliff is irregular in plan before it is irregular in section, and nothing in the row supplies
that.** `strata.ts:lobe`.

**F7 · A lobed ground card fights its own feather, and this is a trap for every author.** The
trilayer computes the feather from `length(vTriLocal.xy)` over the LOCAL unit circle and
discards a fragment past 1.0 (`trilayer.ts:535–544`). Scaling a ground disc's positions by a
plan-form that peaks at 1.16 therefore pushes most of the rim outside its own feather and the
shader eats it — a torn notch of bare paper that did not move when the radius or the segment
count changed. Any deformation of a feathered card must be applied **normalised to peak 1.0**,
with the scale factor moved into `mesh.scale` where the feather never sees it. `strata.ts:146`.

**F8 · `bakeGroundSheet` is 24% over the millisecond budget: 14.9 ms against ≤12 ms.** The cost
is 2,000 curved dabs plus the tile's wrap-offset redraw (every dab tests nine offsets and every
near-edge dab draws up to four times). §11.6 named this bake as one of the two to watch and it
was right. It runs **once, film-wide** — one ground painting, C3 — so it costs 14.9 ms at first
island, not per island. Left as measured rather than tuned, because the lever is dab count and
dab count is what makes the three tiers read.

**F9 · Row 21's `polyline()` hedge cannot carry the class.** At S7's miniature scale a hedge
drawn as a 2.1-px ruled boundary is a cadastral plan, not planting, and six of them box six
equal cells into graph paper. It also **cannot drain**: strokes are `LineMaterial` and keep their
colour through the curtain, so six `canopyDeep` rules would survive into a graphite frame. Built
as one merged low triangular ridge on the trilayer — planted, drains with everything else, still
one draw. `field.ts:seg`.

**F10 · §11.6's per-class material slots undercount every class whose `dir` varies by seed.**
`createTrilayer` puts `stroke.dir` into a **per-material** uniform (`trilayer.ts:498`), so the
ladder's `0.55 + (seed%4)·0.07` makes "rockMass" **four** materials, not one. The same applies
film-wide to foliage (`seed%5` → 5), bark (`seed%3` → 3) and timber (per-limb curl → one per
limb). Group A alone lands at 18 distinct trilayer materials against the census's 11 allocation
for these rows: the skirt is 3 (earth lip, stone shelf, keel) not 1, rockMass is 4 not 1, and
the hedge is a material the row did not name. **The film-wide 33-slot trilayer count needs
re-deriving from the stroke ladder, not from the class list.**

Also worth recording, though not a defect: the row's marks are authored in `ink` rather than
`graphiteDark`. Walked at zoom 3 beside the hero, `graphiteDark #4A4844` at `'form'` on the
shelf's own mid value (`stoneShelf`, luma 124) reads as pale scratches — the section vanishes
and the skirt renders as two smooth plastic bands. The hero draws these in ink on its painted
quadrant for exactly this reason.

---

## 4 · Where each class is weakest

**ground** — strongest of the five; it is the hero's own recipe with one measured change (no
`litBias`, because a tiling sheet cannot carry a key direction). **Weakest at the tile seam**:
the wrap-offset redraw closes it for dabs and clusters, but the 4-unit repeat is visible as a
faint rhythm on a card wider than about 9 units, and S3's 36-unit ribbon and S7's 40-unit
miniature are both past that. The row's answer is the incident card widening its earth field
over the verge; that is untested here because neither of those islands is built yet.

**incident** — **the five allowed marks are only just legible, and three of them were invisible
at first build.** The cart ruts had to be moved onto their own bearing (62° off the path) or they
vanished into the track ribbon that already owns that ground; the landing patch went from 0.30α
to 0.52α and the repair patch from 0.6 × 0.4 u to 0.78 × 0.52 u before either survived the
meadow's own dabs. C8 calls these "the mark that makes twelve islands read as one commute" and
they sit within a few percent alpha of not existing. **Re-measure them at S6's islet scale before
trusting the row's numbers.**

**rock** — reads as a faceted boulder field, which is the class language and matches the hero's
own small rocks, but at r 1.8 the pentagon faces are still 60–70 screen px and the mass reads
more "cut stone" than "weathered rock". The lever is more lobes at smaller radius (three → five
already bought most of it); the lever that is NOT available is subdivision, per F1/F2. The
boulder's two cut-edge strata marks are the weakest mark in the group — they read at zoom 3 and
are gone by zoom 1.

**strata** — the class that changed most and still the least finished. It now stands up solid
with an irregular plan and the alternating tier stack reading as the row promises, but **the
cliff has no drop shadow and floats on the page**, and band 7's talus foot is a broad flat brown
skirt rather than something that spreads into its own scree. The seven bands are also still
close to equal in height, so the section reads slightly as courses of masonry; the row's own
y-table is the cause and I did not deviate from it.

**field** — cheapest and least proven. The patchwork and the tier alternation read, but **the
whole class has been judged at one framing only**. S7's miniature is at 77 px/unit and the board's
own fields are seen dead-on at 229 px/unit; the 256² bake gives 43 texels/unit at the sizes used
here and will be undersampled on the board. The hedge ridge's 0.035 radius was tuned by eye at
one scale and is the number most likely to be wrong at another.

---

## 5 · Handoffs — files this workflow may not touch

**`src/MockSheet.tsx` — the seam is not reliably parked, and the failure is silent.** The route
sets `rig.seamX.value = 1e6` in a mount-only `useEffect`, but `buildHero()` calls
`stageHeroRig()` (`hero.ts:1797`, `seamX = SEAM_X`) from inside a **render-phase `useMemo`**. React
is free to discard a `useMemo` cache and recompute it, and when it does — reliably, when the tab
is backgrounded during load — `buildHero()` re-stages the film seam **after** the mount effect
has already run, and the effect never fires again because its dependency array is empty. Every
mock then draws entirely on the graphite side of the seam at `curtain 0.00`, which looks exactly
like a correct Prep frame and is not one. Roughly half of this workflow's walks landed in that
state. **Fix: stage the seam next to the `buildHero()` memo, or re-assert it in the route's
`useFrame`, not in a mount-only effect.** Nothing about it is my modules' doing and none of them
touch `rig.seamX`.

**`src/film/stages/trilayer.ts` — the feather/deformation trap (F7)** deserves a comment at
`:535`, because every author who deforms a ground card will hit it and it presents as a hole in
the geometry rather than as a shader discard.

**`docs/2026-09-03-art-bible.md` §11.2 row 4** — the roughen amp column (F5) and the missing
plan-form (F6) should be corrected in the table itself; they are the difference between a cliff
and a stack of bowls, and the next author to build S2 will re-derive them from scratch otherwise.

**§11.6's material census** — F10. The 33-slot trilayer count is derived from the class list; it
needs deriving from the stroke ladder.
