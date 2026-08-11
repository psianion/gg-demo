# Pencil detail pass — plan

Milestone 3, rescoped. The pencil previz stops being a wireframe stand-in and becomes a finished
pencil-illustration state: denser forms, real tone, hand-drawn line quality, and the interaction
layer that the site has never had. The output is not a throwaway — it is the stencil the milestone 4
art pass paints over, and it is the Behind-the-Curtain state the finished film cuts to.

Nothing here adds a dependency. Everything used ships inside the installed `three@0.185.1`.

## The problem with what we have

`sketch()` renders a white fill mesh plus a black `EdgesGeometry` overlay. That is **hidden-line CAD**,
not pencil. Three specific things give it away, and each has a fix:

| Tell | Why it reads wrong | Fix |
|---|---|---|
| Uniform hairlines | `LineBasicMaterial.linewidth` is capped at 1px on every desktop GL driver, so every edge in the film is the same weight regardless of importance or distance | `LineSegments2` + `LineMaterial`, which render lines as screen-space quads with genuine width |
| Perfectly straight, perfectly closed | Hand-drawn strokes wobble, overshoot corners, and get struck twice. Machine-exact edges read as engineering | Bake per-vertex jitter and endpoint overshoot into the line geometry at build time |
| No tone anywhere | The world is pure outline. Pencil illustration carries **value** — that is what separates a drawing from a diagram, and value is the single most useful thing a stencil can hand the art pass | A `hatch()` primitive: parallel stroke clusters at a density that encodes light/mid/dark |

## Rendering vocabulary

Five helpers in one new module. Every set piece is built from these, so the look is consistent by
construction and the art pass inherits one legible system rather than per-prop improvisation.

1. **`sketch(geom, opts)`** — the existing helper, upgraded. Same call shape so existing world code
   keeps working. Fill mesh unchanged; the edge overlay becomes width-aware and jittered.
2. **`hatch(area, density, angle)`** — a cluster of parallel strokes filling a region. Density is the
   value: sparse = light, dense = mid, crossed = dark. This is where shadow, ground contact, and
   material weight come from.
3. **`weight(object, tier)`** — line-weight tier. Silhouette and hero props carry heavier contour;
   background set pieces thin out. Combined with the existing `FogExp2`, this builds real depth.
4. **`rays(...)`** — unchanged. Already the film's "light" idiom and it works.
5. **`contact(object)`** — the ground shadow: a short hatch smear under anything resting on the
   ground. Currently nothing in the film touches the ground convincingly; this fixes it everywhere at
   once.

## Paper

The background is flat `#f7f5f0` with no tooth. Real paper grain is worth a surprising amount of
perceived quality, and the cheapest correct place for it is **not** WebGL: make the canvas
transparent and put a procedural grain on the page behind it in CSS. Zero GPU cost, zero draw calls,
no post-processing chain, and it survives on the weakest phone. Scene fog already fades geometry
toward the same paper value, so the two layers agree.

Deliberately NOT building an `EffectComposer` pass for this. The graphite/parchment post-pass belongs
to milestone 4 where it is gated by a mask render-target; standing one up now to draw paper texture
would cost a full-screen pass on mobile for something CSS does free.

## Mobile budget

Mobile is a release gate, not late polish. `LineSegments2` is heavier than `LineSegments` — each
segment becomes an instanced quad — so line width and hatch density are the two dials that get turned
down on small viewports, not the geometry itself. Composition must stay identical across devices;
only stroke cost varies. Every scene gets judged at 390px wide before it is called done.

## Status

**Done and verified** (build clean, `npm run check` passing):

- The vocabulary module `src/film/pencil.ts` — `sketch`, `hatch`, `crossHatch`, `contact`, `weight`,
  `rays`, on `LineSegments2` with three weight tiers, deterministic wobble and corner overshoot.
  `world.ts` now imports it instead of defining its own materials, so all 60 existing `sketch()`
  call sites picked up the new look without being touched.
- Paper grain in CSS behind a transparent canvas. Zero GPU cost.
- Interaction layer: scroll-timeline progress rail that inks itself in, drawn scroll-hint arrow,
  `prefers-reduced-motion` path (no Lenis glide, ambient motion damped to 0.3, rail static),
  themed browser surfaces (selection, focus-visible, caret, scrollbar), a screen-reader narrative
  summary for a film that otherwise has no text at all, and phone `theme-color`.
- Detailed set pieces: `buildFlames` (5 leaning tongues + embers), `buildChest` (banding, lock
  plate, interior tone, contact), `buildPine` (3 stacked tiers), `buildRaven` (head, beak, tail,
  wings), `buildMushroom` (gills, contact), `buildHouse` (ridged roof, door, windows, chimney).

**Why this milestone is worth doing properly.** From `art-direction.md`: "When the art pass lands,
the pencil look does not disappear — it becomes the Behind-the-Curtain state, and the Normal World
gets painted on top." The pencil line-work is not scaffolding. It graduates into the finished film's
graphite/ink state, which is the film's whole thesis moment. It has to hold up as final art.

**Ranked crudest set pieces** (from a full read of all 176 `sketch()` call sites — 352 objects,
~365 renderable Object3Ds, two shared materials):

1. **The cliff is a bare 6×6×6 cube.** It is the climactic set piece, and it is a box.
2. **The board is grid lines only** — no fill, no thickness, no tiles. The film's final image.
3. **The lantern is a bare pole** with no housing; light exists only as ray lines.
4. **The cave door is a flat plane** with no thickness and no cave opening behind it.
5. **The rope is a rigid straight cylinder** that cannot read as rope.
6. **The raven's branch floats unsupported**, attached to no tree.
7. **Roads and the river are 3-point polylines** across a 40×32 mini-world footprint.

**Sparse regions the camera crosses with nothing to look at**, ranked: the 600×300 ground plane
(flat paper everywhere but a handful of prop clusters and one 5-point path line); the 32-unit voids
between all six montage platforms; the theatre disc outside its two clusters; the tavern's single
flat wall and empty floor.

**Still crude — the remaining detail work:**

`buildGoblin`, `buildAdventurer`, `buildAmbush`, `buildPathProps` (lantern, cave door, signpost),
`buildTheatre`, `buildTavern`, `buildMontage` (12 primitives covering six cuts), `buildCliffWorld`,
`buildGround`. These are the larger sets rather than the hero props, and several of them are what
the camera lingers on longest.

Deliberately left flat: the ground plane. In pencil illustration the paper *is* the ground; hatching
600×300 units of it would cost a fortune and read worse than nothing.

## The next real problem: curved forms have no silhouette

Found by screenshotting the film, not by reading code. Round primitives — the goblin's head,
the raven's body, the mushroom cap — are drawn only by `EdgesGeometry`, which emits an edge
wherever two faces meet above an angle threshold. On a sphere that produces a cage of
longitudinal facet lines, so the head reads as a striped scribble rather than a head.

Raising the threshold to suppress those lines makes it strictly worse: a sphere's silhouette is
view-dependent, not a geometric edge, so above ~30° there is nothing left to draw and the head
disappears entirely, leaving the ears floating. That was tried, seen in a screenshot, and reverted.

The real fix is a back-face outline shell: render each solid a second time, scaled slightly, with
`side: THREE.BackSide` in line colour. That yields a true view-independent silhouette for any
form, at which point interior facet lines can be thinned right down and curved objects finally
read as drawn rather than tessellated. It costs one extra draw call per solid, so it wants
measuring on a phone before it ships everywhere — likely hero forms only, with fog and weight
tiers carrying the background.

This is the single highest-value remaining item; it affects the goblin's face, which is the
thing the whole film is about.

## Open decisions for the client

- **The wordmark is set in Georgia.** The endcard "GOOD GOBLIN" and every caption run on the system
  serif. A system face as the display voice of an own-world page is the one thing the craft floor
  refuses outright, and this is the brand's name. It needs a real face, self-hosted, chosen against
  the pencil world — that is a typographic decision with a licence attached, not something to pick
  silently.
- **Chapter ticks on the progress rail** were skipped: placing them requires exact chapter
  boundaries from the timeline, and wrong ticks are worse than none.

## Further findings, not yet fixed

- **Captions can land on top of the thing they describe.** At the endcard beat on a phone,
  "Natural 20." sits directly over the d20 — dark italic serif on dark line-work, effectively
  unreadable. Captions are centred absolutely with no awareness of what is behind them. Either the
  caption positions vary per beat, or captions need a paper scrim behind them.
- **A 23-second stretch with no captions**, t17–40: the whole C2 prop run, rope pull, wave and
  tavern travel. Whether that silence is intentional is a story question worth confirming.
- **Georgia is absent on Android**, so a large share of phone traffic silently falls back to
  generic serif with different metrics — which compounds the wordmark decision below.
- **No WebGL fallback.** If the context fails, the visitor gets a blank paper page and nothing else.
- **The board and the ground still draw with the old hairline material**, so they read as thin CAD
  lines next to the new strokes. They convert when those set pieces get their detail pass.
