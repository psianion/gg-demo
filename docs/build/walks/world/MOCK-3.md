# MOCK-3 — built things and materials

Mockup author 3. Six surface classes built as real geometry against the hero island on
`?mock=<class>`, both rigs, iterated on screen. Art bible §11.2 rows 7, 8, 11, 12, 14, 15.

| row | class | file | route |
|---|---|---|---|
| 7 | Timber (mass) | `src/film/mock/timber.ts` | `?mock=timber` |
| 8 | Plank / carpentry | `src/film/mock/plank.ts` | `?mock=plank` |
| 11 | Metal | `src/film/mock/metal.ts` | `?mock=metal` |
| 12 | Glass | `src/film/mock/glass.ts` | `?mock=glass` |
| 14 | Water | `src/film/mock/water.ts` | `?mock=water` |
| 15 | Snow | `src/film/mock/snow.ts` | `?mock=snow` |

Shared helper: `src/film/mock/plankKit.ts` (same stem as `plank.ts`, which is the
ownership rule). It re-expresses hero.ts's module-private idioms — `mixHex`, the
deterministic `hand()`, the `VIEW_R`/`VIEW_CAM` view-plane basis, `mark()`, `inkEdges()`
— plus four things that are new and are argued in place: `boxRun()`, `tubeContour()`,
`bakeGrain()` and `parkSeam()`.

**Cloth (row 9) is NOT in this set.** It was in my brief, but `cloth.ts` is author group
D's in the bible's own §11.8 map, and mockup author 4 was iterating on it live
(`?mock=cloth&zoom=2&rig=prep` open in a sibling tab) while I worked. I built it, they
overwrote it at 05:33, and I stood down rather than race the file. **Stone masonry** was
also named in my brief; there is no masonry row — rock (3) and cliff/strata (4) are
author group A's, and I did not touch them.

---

## Measured — draws, triangles, materials

Baseline: the hero island alone renders **320 draws / 79,888 triangles** on this route
(`?mock=<unbuilt class>`, verified). Each class's cost is the difference, read off the
live HUD at `zoom=2`, 1456×774 CSS.

| class | HUD | draws | triangles | per-mesh materials | bakes |
|---|---|---|---|---|---|
| timber | 343 / 84,936 | **23** | 5,048 | 3 | 1 × 512² grain |
| plank | 350 / 86,980 | **30** | 7,092 | 9 | 1 × 512² grain |
| metal | 338 / 83,848 | **18** | 3,960 | 7 | none |
| glass | 331 / 80,662 | **11** | 774 | 7 (3 trilayer + 4 basic) | none |
| water | 327 / 82,136 | **7** | 2,248 | 4 (3 trilayer + 1 basic) | none |
| snow | 329 / 83,486 | **9** | 3,598 | 4 | none |
| **all six** | — | **98** | **22,720** | **34** | 2 × 512² = 2.00 MiB mipped |

Draw counts include the drawn runs: every contour, comb, strap and construction box is a
`LineSegments2`, one draw each. The mass geometry is 3–9 draws per class; the rest is ink.

Every repeat is merged with its transform baked into the vertices (`put()` + `merge()`).
**Zero `InstancedMesh`** anywhere in the six, per gate 4 — grepped to zero along with
`hatch(`, `crossHatch(`, `contact(`, `rays(`, `Math.random` and `deltaTime`.

`npm run build` green (tsc --noEmit + vite build, 1.17 s, production bundle unchanged at
1,440.33 kB). `npm run check` green — 13 gate scripts, gob.check 22/22, 0 regressions.

---

## THE ROUTE DEFECT — this one belongs to whoever owns MockSheet.tsx

`MockSheet.tsx:105` parks the seam at `1e6` on mount so the curtain alone decides the
state. **It does not hold.** `buildHero()` wires `heroLife`'s entrance, whose GSAP
timeline tweens `rig.seamX` back to `SEAM_X = 1.0` a beat later (`heroLife.ts:424`). The
route places every mock at x ≥ 6.4, which is on the *drawn* side of a seam at 1.0 — so
under `?rig=perf` a finished painted class renders as flat graphite and the whole
comparison is a lie.

Measured live off a mock material's compiled uniforms:
`uTriSeamX 1, uTriSeamW 0.2, uTriCurtain 0`.

This cost me two full iterations on `?mock=timber` — I rebuilt the class twice chasing a
"pale grey" I assumed was my bake and my poster count, and it was the seam. `foliageKit.ts:62`
carries the same workaround, found independently by another author, which is the argument
for fixing it once at the route. Mine is `parkSeam()` in `plankKit.ts`: re-assert the park
in an `onBeforeRender` on the mock's first mesh. **Handoff: move it into `MockSheet.tsx`
(a `useFrame` re-assert, or park it after `heroLife`'s timeline is killed) and every
author can delete their copy.**

---

## Where the recipe was wrong — findings, per row

### Row 7 · Timber — three corrections, all forced on screen

1. **"no bake" is wrong at log scale.** The row measured the hero's roots, which are
   0.075 u radius = 10 screen px; a flat token plus two drawn contours is right there.
   A log at 0.20 u is 52 px of unbroken fill across the near face, and it rendered as
   bent plastic tubing — §9.3's gradient-wash signature exactly. The class takes bark's
   tile (row 6's `bakeBark`). Cost: nothing new, because it shares `bakeGrain`.
2. **poster 0 is wrong for the same reason.** No bake plus no poster is a smooth Lambert
   ramp end to end. The class runs **poster 4**: four committed steps, which is C5's
   "≥3 separated tiers" applied to a form whose geometry cannot supply them.
3. **The curl constant is a root's, not a beam's.** `rotation.x = 0.2 + i·0.12` on a
   three-segment post accumulates 0.96 rad. The row files "beams and doorframes" under
   the same recipe and, built literally, every doorframe is a croquet hoop — which is
   what the first frame showed. The accumulation is now scaled by a per-limb `bend`:
   1.0 is the root the row measured, 0.05 is a post. **The formula is multiplied, not
   replaced.**

And one hero idiom that does not transfer: hero.ts's roots push their drawn marks by a
fixed limb-local `(0.03, 0.03, −0.07)`, exact only while a limb's yaw stays inside
±0.4 rad. A fallen log lies at 90° and that push throws the contour clean off the timber.
`tubeContour()` builds the two side contours in world space off `cross(axis, viewDir)`,
so a limb at any yaw keeps its marks on its own outline.

### Row 8 · Plank — four corrections

1. **The disc's gaps cannot be angular, and this only shows at 6×.** A
   `CylinderGeometry` sector's sides are radial, so a constant angular inset is a
   constant-*angle* gap: 0 u at the hub and 0.022 u at the rim — nearly double the
   authored 0.012. Twenty-four of those render as **white spokes converging on a
   starburst**, which is a fan, not a floor. A real radial plank floor has a constant
   **kerf**: same saw at every radius. Each wedge is now an authored trapezoid whose two
   long sides are offset laterally by GAP/2, with a `HUB` at r 0.30 so the joints never
   have to converge, and a subfloor plate because at 6× the kerf let the page show
   straight through the deck.
2. **`bakePlank`'s base must be WHITE, not a colour.** The row's palette implies a
   coloured bake, which is six bakes for six tokens. A white-based grain tile multiplies
   whatever `material.color` carries, so **one 512² serves all six plank tokens** — the
   same lever row 17 already uses for the sky sheet ("base is `paper`, not a colour").
3. **`v` runs along the board — and `ExtrudeGeometry` will not do it for you.** Extrude
   hands the *shape coordinates* back as uv, so on a radial wedge u is the radius and v
   is the half-width: the grain ran across the plank and the disc drew as concentric
   arcs. The axes are swapped explicitly.
4. **A 0.012-u gap does not survive the curtain.** It is 1.6 screen px at the film's
   figure floor and simply gone on the drawn side, where the door's five boards fused
   into one grey slab and the disc into one flat ellipse. So the joint is **drawn as well
   as cut** — the same answer row 16 already gives stacked paper ("an ink rule line,
   never a tone fill"). Three joint combs (deck, door leaf, disc), one boustrophedon
   polyline each, 1 draw each.

**The material cost the row does not budget for.** §11.6 allots the class two shared
materials, `plankRadial` and `plankBoards`. Built as written that is impossible: six
committed tokens × two stroke directions is **nine materials** (measured above), because
a token is a `material.color` and the direction is a per-material uniform. The fix is the
one R9 already found for the field wash: **three tint blocks in the bake, UV-selected**,
which collapses the class to 2. Recommended, not built — it would have made this mock
prove a bake instead of a structure.

Also: rows 8 and 16 both claim the signpost. Row 16 files "signpost boards" under paper
props; row 8 files "S6 sign" under carpentry. Built here as carpentry (post + arrow blank
in plank tokens) on the reading that the *board's writing* is row 16's and the *board* is
row 8's. Worth one line in the bible either way.

### Row 11 · Metal — the row is right, and its arithmetic is the whole build

Nothing in row 11 needed correcting. Its own argument is what makes the class work: a
blade cannot carry its read in its fill, so the read is the **bracket** — a `'form'`
contour on each long edge with one core-shadow stroke between them. In Prep the sword is
still unmistakably a sword at 1456 px; see `mock-metal-prep-zoom2.jpg`.

One build note that is not in the row: **a disc's lean cannot be guessed from one Euler
term.** The shield read as a pan for two iterations. It is now solved from the shot — the
lens looks along ≈ (0.4, 0.6, −0.8), the face normal is set to that, and the rim, boss and
straps all take the same basis (`SHIELD_ROT`) instead of each carrying its own
approximation.

The glint dab is built as authored geometry at `mix(steel, paper, 0.7)`, because the row
says "baked into the paint" and also says the class has no bake. Geometry is the only
reading that satisfies both. It is the weakest thing in the class (see below).

### Row 12 · Glass — one thing the row does not say, and the build needs it

A `MeshBasicMaterial` **does not drain**. It is outside the trilayer, so at `curtain = 1`
a bare basic material is still a warm cream block on a graphite page — and row 12's whole
drawn state is "it reverts to bare paper". R14 already solved exactly this for fire with a
three-line `onBeforeCompile` mixing by `rig.curtain` taken by identity; the same three
lines are what turn this glass to paper. `drains(hex, toward, key)` in `glass.ts`, with
`customProgramCacheKey` so every glass in the film is one program. **Row 12's channel
column should read `MeshBasicMaterial + curtain mix`, not `MeshBasicMaterial`.**

Verified: `mock-glass-prep-zoom2.jpg` — the lantern head is bare paper with the graphite
rim cap above it and the graphite post below.

Deliberately not built: the glow sprite and the `PointLight`. Both belong to row 13 and to
`createFlameMaterial()`, which `fire.ts` owns. **So shipped rule 2 — "it must out-shine its
own ground pool", measured 237 vs pool p95 212 — cannot be measured on this route.** Rules 1
(the glass is the head's dominant mass) and 3 (a distinct flame shape) are built and hold.

### Row 14 · Water — the row is proven, and the bug was geometry, not pigment

R1 is confirmed on screen and it is the row's headline: `boardWater #CFDDDF`
(`triTone 0.134`) lands **tier 0**, so the drawn river is bare paper between two graphite
banks with one `'form'` edge per shore. `mock-water-prep-zoom2.jpg` is that frame. The row
can be promoted from UNPROVEN.

Two build facts worth carrying into the S7 river, neither of which is about water:

1. **An offset ribbon folds wherever the curve's radius of curvature is smaller than the
   offset**, and the fold renders as a bow-tie fan. The first spine wove ±0.4 u over 1.1 u
   of run (radius ≈ 0.4) while the banks sat at d up to 1.35 — both banks came back as
   three brown triangles and the water vanished inside its own inverted surface. Rule:
   **min curvature radius > max offset.** The shipped S is radius ≈ 2.4 against a max
   offset of 0.81.
2. **Mapping a `PlaneGeometry`'s (x, y) onto world (x, z) is a reflection**, so every face
   comes out wound the wrong way and pointing at the floor — back-face culled from a
   camera 33° above. The ribbons rendered as nothing but their two drawn edges. All ribbon
   materials take `DoubleSide`, which the bible already requires of anything the lens can
   see the inside of.

### Row 15 · Snow — solved by construction, and the strokes are the whole build

`snow #F2F2EC` at `triTone 0.018` is below the shader's own 0.14 mark threshold, so the
underdrawing is literally blank. `mock-snow-prep-zoom2.jpg` is the row delivered: the cap
is bare paper, shaped by the seven lee strokes at t2 and one drawn windward ridge, with
the rock's graphite crescent underneath. Promote the row.

Four things the row does not say and a builder needs:

1. **A snow cap must clear its substrate by MORE than the substrate's roughen
   amplitude, in absolute units.** A multiplicative clearance (1.09×) is 0.008 u at a
   0.09-u summit radius against 0.07 u of rock displacement, and the peak came back with
   dark wedges torn out of the white. Absolute: +0.10 u in r, +0.03 u in y.
2. **An offset profile does not close.** Ending at r = 0.19 is an open ring and rendered
   as a dark hole at the summit. Push a final point at r ≈ 0.
3. **A lee stroke placed as a rotated `PlaneGeometry` does not lie on a cone** — it lies
   on a tangent plane, and seven of them read as a row of grey rectangles floating off the
   white. Each stroke is now a strip evaluated in the cap's own (azimuth, height) space at
   `r = capR(y)`, flush by construction, needing no rotation at all.
4. **"Prep = Performance minus the shadow strokes" cannot be built literally.** The lee
   strokes are `snowShadow` t2, so they *do* draw under the curtain — and they must, because
   they are the only thing giving a tier-0 mass any form at all. Take that line as being about
   the *lighting*, not the strokes. §11.3's "nothing to author" is correct as written.

---

## Where each class is weakest

**timber** — the two bark streaks are `'faint'` (0.83 px at 500 px) and are effectively
invisible at every framing I walked; they cost 2 draws per limb and return nothing. Either
promote them to `'form'` or delete them from the row. Second: the log's tail lifts off the
ground because the curl accumulates upward, so it reads as balanced rather than fallen —
the fix is a per-limb ground clamp, which the segment-chain recipe has no term for.

**plank** — nine materials against the row's budget of two (see above); that is the class's
real defect and it is a bake problem, not a geometry problem. Second: the joint comb's
carry-over segments are chords, not arcs, so at 6× the disc's rim reads as a faint zigzag.
Third: the signpost still hides behind the disc at some framings — six props in a 5.4-u
slot is one too many.

**metal** — the glint dab does not read. It is a near-paper value on a pale steel blade,
so the contrast that is supposed to say "struck metal" is ~10 luma; the row's "miniature
painter's dot-and-line" wants either a darker blade or a brighter dab, and neither is a
knob I own. Second: under the curtain the shield's interior is nearly blank (steel t1 /
ironLit t2 are sparse graphite), so a 0.7-u shield drains to a rim and a stroke and reads
as a plate. Poster 8 helps the paint side and does nothing for the drawn one.

**glass** — at the film's ≤20-px lantern head the drained glass reads as a *gap in the
drawing* rather than as a reserved highlight: the rim cap floats over a hole. Row 12
forbids the obvious fix ("glass carries no strokes"), so this needs a decision, not a
patch — one `'form'` contour on the glass **in the drawn state only** would settle it.
Second: the hand lantern is too small to carry any of the three shipped rules and is
really just a token presence.

**water** — the banks are flat cards that stop dead at both ends of the run; they have no
skirt, so C1's one skirt formula is unproven for a river's banks and the class currently
floats on the page at its ends. Second: the paper dabs are evenly spaced and similar in
length, so at 6× they read as a mechanical tick row rather than as light on moving water.

**snow** — the massif under the cap is the weakest surface in my whole set. It is
scaffolding, not my row, but it is in every frame: a 34-segment lathe with poster 4 reads
as a smooth plastic dome next to the hero island's brushed ground, and it is exactly the
"v1 placeholder" register the client rejected. Whoever builds row 3 or 4 should own it, and
`?mock=snow` should then borrow their mass instead of carrying its own. Second: the seven
lee gullies still read as blocky bars rather than as soft shadow; they want a tapered
alpha, which means the class wants the one thing the row denies it — a bake.

---

## Screenshots

All at 1456×774 CSS, live, hero island in frame, taken from a dedicated foreground Chrome
window (the shared MCP tab could not be held foreground against the other authors, and a
background tab gets zero rAF ticks — every measurement here was made with the tab visible
and rendering).

```
mock-<class>-perf-zoom2.jpg    rig A, ×2 on the hero/mock boundary
mock-<class>-prep-zoom2.jpg    rig B, curtain = 1
mock-<class>-perf-zoom6.jpg    ×6 detail   (timber · plank · metal · snow)
mock-<class>-prep-zoom6.jpg    ×6 detail   (timber · plank · metal · snow)
mock-built-sheet-perf.jpg      all six + the hero island, one frame
mock-built-sheet-prep.jpg      …the same frame drained
```

The sheet is the acceptance test and it passes: `?mock=sheet&classes=timber,plank,metal,glass,water,snow`
renders **402 draws / 98,896 tris** painted and **392 / 97,748** drained, and the six classes
sit against the island in one palette and one line weight. The drained sheet is the one to
look at — the carpentry's drawn joints, the water's reserved channel, the snow's reserved
cap and the glass's white void all read as the same hand's pencil, which is the question
§11.8 says this route exists to answer.

Zero page errors on every walk; the only console output on the route is Vite's HMR log and
three's `THREE.Clock` deprecation warning, both pre-existing.

**Viewport note:** the brief asks for 1440×900. This machine reports
`screen.availHeight 816` CSS px at `devicePixelRatio 1.25`, so a 900-px-tall viewport is
not reachable — 774 is the ceiling with the browser chrome cropped. Widths are 1456.
