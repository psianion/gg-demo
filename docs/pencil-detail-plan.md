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
- Vocabulary additions the larger sets needed: `polyline` and `curveLine` (drawn lines through a
  run of points, replacing the last `THREE.Line` hairlines), `inkMaterial` (the film's only
  filled black — pupils, a maw, a wick), and the back-face `shell` option on `sketch`.
- Every set piece above verified against rendered frames at 1440×900 and 390×844.

**Why this milestone is worth doing properly.** From `art-direction.md`: "When the art pass lands,
the pencil look does not disappear — it becomes the Behind-the-Curtain state, and the Normal World
gets painted on top." The pencil line-work is not scaffolding. It graduates into the finished film's
graphite/ink state, which is the film's whole thesis moment. It has to hold up as final art.

**Ranked crudest set pieces** (from a full read of all 176 `sketch()` call sites — 352 objects,
~365 renderable Object3Ds, two shared materials):

1. ~~**The cliff is a bare 6×6×6 cube.**~~ **Done.** Now three seven-sided tiers, so it has a
   rock outline from directly above (where the camera ends) and a stepped face as the camera
   lifts, plus crack tone on the plateau and talus around the base. The goblin's stance at
   local x=2.6, y=6 is preserved exactly.
2. ~~**The board is grid lines only.**~~ **Done.** Paper fill so it stops reading as a wireframe,
   a double-ruled edge and corner trim marks. Every material in the group is board-local,
   transparent, starting at opacity 0 — the timeline traverses the group and fades up whatever
   it finds, so a shared material in there would drag the whole film's line-work up with it.
   Note: at the final framing the camera is close enough that only ~8 of the board's 24 units
   are on screen, so the ruled edge and trim marks are currently out of frame. They will matter
   when the milestone 5 d20→board morph reframes this shot.
3. ~~**The lantern is a bare pole.**~~ **Done.** Cross-arm, drop and a real housing for
   the ray burst to come from.
4. ~~**The cave door is a flat plane.**~~ **Done.** A slab with plank seams, banding and a
   handle, opening onto a cross-hatched cave mouth in the rocks. Hinge point unchanged.
5. ~~**The rope is a rigid straight cylinder.**~~ **Done.** Hangs on a curve with strand
   wraps and a knot.
6. ~~**The raven's branch floats unsupported.**~~ **Done.** It grows from a tree, sited clear
   of where the birds perch and scatter to.
7. ~~**Roads and the river are 3-point polylines**~~ **Done.** Both are drawn curves
   now, via a `polyline`/`curveLine` pair in the vocabulary. Roads have two edges,
   the river has two banks with water tone in six short reaches that follow the
   meander, and the blank paper between the eight houses carries hatched fields with
   drawn boundaries. This is the shot the film ends on, seen from directly above.

## The lighting run now plays as a freeze

The run used to happen in a live world — `timeScale` returned to 1 at t16.5, before the
sequence started. That contradicted the art direction, whose campfire example is explicit:
time freezes, the goblin walks in and does the work, *then* it snaps back. The world now
holds still from t9.5 all the way to t30, and a fire he lights mid-freeze sits lit and
perfectly motionless until time resumes. The stillness is the grammar, not a bug.

He also never actually touched anything. He stopped on the path at each prop's own x and
reached straight ahead — but the cave door is 2 units off the path, the mushrooms 1.2 off,
and the branch 1.6 up while he is 0.9 tall. He was grasping at air and the props were moving
on their own. Each stop is now a spot *beside* the prop with a heading toward it, a per-prop
reach height, and the prop action fires only once his hand has arrived.

**Sparse regions the camera crosses with nothing to look at**, ranked: the 600×300 ground plane
(flat paper everywhere but a handful of prop clusters and one 5-point path line); the 32-unit voids
between all six montage platforms; the theatre disc outside its two clusters; the tavern's single
flat wall and empty floor.

**The larger sets — done.** `buildGoblin`, `buildAdventurer`, `buildAmbush`, the signpost in
`buildPathProps`, `buildTheatre`, `buildTavern`, `buildMontage`, `buildCliffWorld` and
`buildGround` all carry their detail now. What each one needed:

- **The goblin** has a face — angled brows, ink pupils, a mouth set off-centre — plus hands at
  the ends of the arms he spends all of C2 reaching with, feet under the gait, a tunic with a
  belt and collar, and the tool satchel that C2's over-the-shoulder follow spends thirteen
  seconds looking at. He travels with his own contact shadow, so he sits on the path, on a
  montage platform and on the cliff top alike.
- **The adventurers** are cloak and hat brim rather than a cylinder under a ball: the two shapes
  that read at fifteen units. Six ship, so the part count stays lean.
- **The ambush** is a camp — stone ring, logs, scorched ground, bedroll, pack, planted spear —
  around an outcrop instead of one boulder, with a fogged treeline set back far enough to give
  the freeze close-up a world behind it without crowding his head.
- **The theatre disc** reads as a revolve: kerb, plank seams, the joint the halves part on. Its
  forest half has undergrowth, stumps, boulders and a fallen trunk; its mountain half has ridges
  and hatched rock below a snowline that is left as bare paper.
- **The tavern** has floorboards, a timber-framed wall, a hearth with a fire in it, a shelf of
  bottles, benches, and a table with character sheets, a referee's screen, a pencil and a candle
  on it. The room is where the film turns — the world we have been watching is the one being
  rolled for here — and it was a wall, a disc and three mugs.
- **The montage** platforms have rims and shadows; the map table has legs and a map wider than
  the road drawn on it; the monster has eyes, a maw and teeth; the sign hangs off a braced
  bracket on a planked wall; the candles have wicks, drips and a book to light.

Deliberately left flat: the ground plane. In pencil illustration the paper *is* the ground; hatching
600×300 units of it would cost a fortune and read worse than nothing.

## Curved forms now have a silhouette

Round primitives were drawn only by `EdgesGeometry`, which emits an edge wherever two faces meet
above an angle threshold. On a sphere that produces a cage of longitudinal facet lines, so the
head read as a striped scribble rather than a head. Raising the threshold was strictly worse: a
sphere's silhouette is view-dependent, not a geometric edge, so above ~30° there is nothing left
to draw and the head disappeared entirely, leaving the ears floating.

`sketch(geom, threshold, weight, shell)` now takes an optional back-face shell: the solid drawn a
second time, scaled out by a constant rim thickness in world units, `side: THREE.BackSide` in line
colour. Curved forms carrying it drop their interior facets to `faint` and finally read as drawn
rather than tessellated. It costs one extra draw call, so it is opt-in and spent on hero forms
only — the goblin's head and hands, the adventurers, the monster, the mountains.

The same threshold trap had silently erased whole set pieces: a broad 12-sided cone's facets meet
at about 17°, so at the default of 25 the theatre's three mountains and the miniature world's
massif drew **no edges at all** — pale grey triangles with not one line on them. They build at
threshold 15 with a shell now.

## What the screenshots changed

Every fix below came from looking at rendered frames at 1440×900 and 390×844, not from reading
code:

- **He was looking 36° past the lens.** `head.rotation.y` went to -2.2 on the freeze, but his root
  is turned to +x by the bolt, so square to the camera is -π/2. With a sphere and a nose that read
  as "roughly toward us"; with eyes it is unmistakably looking past the viewer, in the one shot of
  the film where he addresses them. Now -1.62.
- **The four to-camera lines ran through his face.** Every caption is centred at 50%/50% and the
  freeze frames his head there. `me1`–`me4` now carry a `.above` class at 24%, where there is
  empty paper at both aspects, and keep the full statement size — `low` is for narration over the
  work, and these are not that.
- **Contact shadows had a fixed hatch density**, which is per unit of depth: a hand-sized shadow
  came out as three stray marks and a table-sized one as a zebra crossing. It solves for a
  constant stroke count instead.
- **The table's plank seams were radial** and converged on the exact spot the die comes to rest,
  firing a sunburst out from behind it in the macro shot. Boards on a round table are chords.
- **Cross-hatch at high density reads as netting**, not as darkness — the eye takes a regular grid
  for a mechanism. The window, the hearth and the montage wall's window all came down.
- **Four lines down the path** — two edges plus two ruts, at full weight — turned a woodland track
  into a railway that cut every wide shot in half. Two, both faint. The verge tufts moved to the
  far side: in the foreground, three strokes read as a scribble on the lens.

## Open decisions for the client

- **The wordmark is set in Georgia.** The endcard "GOOD GOBLIN" and every caption run on the system
  serif. A system face as the display voice of an own-world page is the one thing the craft floor
  refuses outright, and this is the brand's name. It needs a real face, self-hosted, chosen against
  the pencil world — that is a typographic decision with a licence attached, not something to pick
  silently.
- **Chapter ticks on the progress rail** were skipped: placing them requires exact chapter
  boundaries from the timeline, and wrong ticks are worse than none.

## Further findings, not yet fixed

- **Captions can land on top of the thing they describe.** Every caption is centred at 50%/50%
  with no awareness of what is behind it. At the ending this stacked "Natural 20." on the endcard
  *and* ran the wordmark straight through the d20. Fixed for that beat — `nat20` now clears the
  screen before the endcard begins, and the wordmark sits at 72% as a title card under the final
  image — but the underlying collision risk applies to every caption in the film and has only
  been checked at the beats that were screenshotted.
- **A 23-second stretch with no captions**, t17–40: the whole C2 prop run, rope pull, wave and
  tavern travel. Whether that silence is intentional is a story question worth confirming.
- **Georgia is absent on Android**, so a large share of phone traffic silently falls back to
  generic serif with different metrics — which compounds the wordmark decision below.
- **No WebGL fallback.** If the context fails, the visitor gets a blank paper page and nothing else.
- **Later sets are legible on the horizon of earlier chapters.** The six montage platforms at
  z=-40 sit on the skyline of the ambush and the C2 run, and the tavern at x=80 sits in the
  top-right corner of the theatre rotation. Both were always there; filling them with set
  dressing is what made them read. The fixes are all blocking decisions rather than detail ones —
  denser fog would wash out the top-down ending, and moving a set means moving the camera beats
  keyed to it — so this wants a staging pass, not a patch.
- **`nat1` and `nat20` are still centred**, and at those beats the die is centre-frame. Same
  collision class as the `me*` captions, not yet checked against a screenshot at the exact hold.
- **The board still draws with a hairline grid**, deliberately: it needs per-object transparent
  materials it can fade from zero, and the film's last image is a printed board, which is
  machine-ruled by nature. The shared `lineMaterial` is gone from the codebase.
