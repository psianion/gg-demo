# JUDGEMENT — the 22 surface classes against the hero island

Judged 2026-09-04 on the running dev server (PID 17556, untouched) at
`http://localhost:5180/?mock=…`, every frame taken by me, none taken from an author's images.

## How this was judged, and what it cost

**Viewport.** The brief asks for 1440×900 and 500×915. Neither exists on this display:
`screen.availHeight` is **816 CSS px** at `devicePixelRatio 1.25`, so the largest browser
viewport obtainable is **1444×711 CSS** (1805×889 device px) and the narrow column is
**503×711 CSS** (629×889 device px). Wide captures are therefore 1444×711 — full width, 189 px
short in height; narrow captures are 503×711 — correct width, 204 px short. Width is what governs
px/unit in the route's `min(vfov, hfov)` camera fit, so the px/unit reads are honest at both.
Every claim below is cited to a file in this folder.

**Live-frame discipline.** Every capture was taken with `document.visibilityState === 'visible'`
and a counted rAF rate of **61 fps over a 600 ms window**. The first four attempts of this session
came back blank at `visibilityState: 'hidden'` — the background-tab trap — and were discarded. The
MCP tab turned out to live in a **second Chrome window** (hwnd 23594774), which is why
`SetForegroundWindow` on the process's `MainWindowHandle` plus `ctrl+9` was not enough; the tab was
found by stamping `document.title = 'JUDGETAB'` and cycling `ctrl+Tab` per window until the
foreground window title matched.

**The seam did not misbehave for me — correcting three authors' handoffs.** MOCK-1, MOCK-2 (F0)
and MOCK-3 all report `MockSheet.tsx:105`'s seam park losing a race to `buildHero()`, and MOCK-2
measured `{seamX: 1, seamW: 0.2}` live. In **41 captures across all 17 built classes and both
rigs**, rig A rendered the hero island **fully painted** and rig B **fully drained**, with no
graphite left-half anywhere — the island straddles the origin and a seam at x = 1.0 would be
unmissable. Two of the three workarounds are also load-bearing only in their own group
(`plankKit.parkSeam` re-asserts per frame via `onBeforeRender`, `foliageKit.parkSeam` only at build
time), yet group A's five classes, which carry no workaround at all, rendered correctly too
(`judge-ground-1444x711-perf-z6.jpg`). The likeliest reading is that most of the authors'
"seam-drained" walks were the same background-tab trap: a tab with zero rAF ticks also loses the
mount effect's ordering. **The route fix is still worth making** — it is one line and it removes
the doubt — but it is not the reason any class looks wrong.

**Console.** Zero page errors on every route, both rigs. One informational log:
`[mock] bakeGroundSheet 1024² 12.5 ms` — measured by me, against the ≤12 ms budget, so **4% over**
(better than MOCK-1's recorded 14.9 ms, but still over).

**Build.** `npm run build` green (tsc clean, vite 1.54 s, production bundle **1,440.33 kB**,
unchanged — the mock route still tree-shakes out). `npm run check` green — **22 gates, 22 passing,
0 regressions**.

---

## 1. What is actually on screen

**17 of 22 classes are built. Five are still stubs and would ship as nothing:**
`paperprop` (row 16), `hide` (row 22), `machinery` (row 19), `drawnsheet` (row 18), `board`
(row 20) — the HUD's own "not on screen" list, `judge-sheet-1444x711-perf.jpg`. Row 22 (creature
hide) carries the S6 monster and the S3 ravens; row 20 (the board) is the film's last shot. Two of
the five are load-bearing endings.

---

## 2. The client's own evidence

`docs/reference/goblin-actions.png` — his ten painted activity scenes — is the strongest single
argument in this review, because it shows what he means by "natural". Every one of those ten
frames has:

- a **named light source** and a warm/cool split off it (candle, hearth, lantern, torch, sun
  through leaves);
- surfaces with **real material incident** — individual cobbles with mortar between them, moss on
  tunnel stone, leaf clusters at three depths, wood grain on a ladder rung;
- **deep shadow value**, not a mid-tone everywhere;
- **no flat card, no ruled stripe, no smooth vinyl anywhere in the ten**;
- a palette of warm greens and warm browns, with cool grey used **only** in stone shadow, and
  always warmed by the light.

Held against that, four of this set's surfaces are foreign on palette alone (sky's neutral grey,
water's cold grey, cloth's navy/crimson, metal's neutral steel) and five are foreign on
*technique* — they carry no incident at all.

---

## 3. Per class, worst first

Draw and triangle numbers are **my own**, read live off the route HUD, as a delta against the
hero island alone (**320 draws / 79,888 triangles**, `judge-ground-1444x711-perf-z6.jpg` baseline
confirmed on every single-class route).

### 1. STRATA — REBUILD (row 4) · +24 draws / +16,686 tris
1 **Same hand?** No, and it is the clearest "different, worse project" object at the film's own
framing. `judge-strata-1444x711-perf-z2.jpg`.
2 **Painted or shaded geometry?** Shaded geometry, unambiguously. At
`judge-strata-1444x711-perf-z4.jpg` each of the seven bands is a **perfectly smooth vertical
Lambert gradient** — light at the band top, dark at the band bottom, zero dabs, zero marks, zero
break. The failure signature is art-bible §9.3's gradient wash, and it is damning in that frame
because the ground card **directly above it** in the same image carries real brush dabs. Row 4's
"NO BAKE" decision is the cause and the mock disproves it: with no albedo and poster 0 there is
nothing left but the ramp.
3 **Drawn state.** Honest, and much better than the paint — the alternating tier stack reads and
the boundary arcs are real drawing (`judge-sheet-1444x711-prep.jpg`, centre). It reads as a
graphite layer cake, not a cliff, because the band heights are near-equal.
4 **Structure.** Made object, yes — the lobed plan-form works and no two bands cross. But the
band-to-band boundary is a **flawless smooth curve** with no crumble, and the long black "cut
marks" scatter across the face as random cracks with no geological logic.
5 **At 500 px.** Survives as a shape; the vinyl reading is *worse*, not better
(`judge-strata-snow-sky-503x711-perf-z2.jpg`).
6 **Crossing strokes.** None found.
7 **No drop shadow** — it floats on the page, in both rigs, at every framing.

### 2. SNOW — REBUILD (row 15) · +9 draws / +3,598 tris
1 **Same hand?** No. This is the single worst object in the film for the client's question.
`judge-snow-1444x711-perf-z2.jpg`.
2 **Painted or shaded?** Shaded, at maximum. A 34-segment lathe with a smooth cream Lambert ramp —
a **marshmallow**. The seven lee strokes render as **flat grey rectangular bars** stuck on the
dome (MOCK-3 predicted this and it is exactly what is on screen); they read as a barcode. The
substrate under it is two more smooth bands, one green-grey and one chocolate, with no incident.
3 **Drawn state.** Tier 0 by construction works — the cap drains to bare paper — but the *form*
does not survive: `judge-sheet-1444x711-prep.jpg` shows a bald blob with a dark crescent under it.
You cannot tell it is a mountain.
4 **Structure.** Primitive with a material.
5 **At 500 px.** Reads as a mushroom cap.
6 **Crossing strokes.** None.
7 MOCK-3's own author called the massif "scaffolding, not my row". It is in every frame of two
stages and nobody owns it. Somebody must.

### 3. SKY / standing sheet — REBUILD the paint (row 17) · +6 draws / +2,528 tris
1 **Same hand?** No — and it is the class that breaks the *set*, not just itself.
`judge-sky-1444x711-perf-z2.jpg`.
2 **Painted or shaded?** Neither: **flat washes with a pattern on them**. The cloud/tree banks are
hard-edged jigsaw blobs that read as **camouflage print** or an oil slick. There is not one brush
dab, not one stroke family, on any of the four leaves.
3 **Drawn state.** The best half of this class by a distance — real tier fields, the Λ brace and
slot line legible on the small leaf (`judge-sheet-1444x711-prep.jpg`, top-left). Keep it.
4 **Structure.** The cut sheet reads as a cut sheet, which is the row's ambition. But the scalloped
tops are **regular semicircular arcs** — a stage flat, a Mario cloud — not a hand-drawn skyline.
5 **At 500 px.** Survives; still reads as grey cardboard.
6 **Crossing strokes.** None.
7 **Palette.** The far leaf is a cold neutral grey that exists nowhere else in the film and
nowhere in the client's plates. Three leaves at three unrelated hues (neutral grey / khaki /
dull green) read as three different projects, not three depths of one.

### 4. ROCK — REBUILD (row 3) · +19 draws / +18,724 tris
1 **Same hand?** No. `judge-rock-1444x711-perf-z2.jpg` reads as a rockery of **hexagonal paving
slabs**, or a concrete-block pile — "cut stone", as MOCK-1 conceded, but worse than conceded.
2 **Painted or shaded?** Shaded: each pentagon face is a flat khaki plane with a smooth per-facet
Lambert value, and the face is 60–70 screen px so the flatness is the whole read.
3 **Drawn state.** This is the failure. `judge-rock-1444x711-prep-z6.jpg` is a **polygon wireframe
diagram** — every dodecahedral edge inked, ~150 lines on a five-lobe mass, with parallel strokes
inside each cell. It is an engineering drawing of a polyhedron, not a drawn rock.
4 **Structure.** Primitive with a material, dressed with ink.
5 **At 500 px.** Reads better small than large, which is the diagnosis: the class only works when
its facets are sub-pixel, i.e. only at the hero island's own tiny rocks.
6 **Crossing strokes.** None *within* a face — I checked two separate facet interiors at 6× under
further magnification. But the stroke direction **flips at every one of ~150 inked edges**, and
the aggregate is the visual cousin of the thing the gate bans.
7 The cost is also the worst value in the set: 18,724 triangles for one boulder field.

### 5. CLOTH / the adventurer trio — REBUILD (row 9) · +8 draws / +6,298 tris
1 **Same hand?** No. `judge-cloth-1444x711-perf-z2.jpg`: three **chess pawns**, or lipstick tubes.
2 **Painted or shaded?** The purest case of shaded geometry in the film — a lathe of revolution
with one vertical Lambert ramp and a hard pale rim that reads as a **specular highlight**. No
cloth incident, no fold that survives, no tier separation inside the garment (MOCK-4 called this
out and it is right).
3 **Drawn state.** The one class where **prep beats perf outright** — shoulder line, one drape,
one attribute, a legible hooded head. Keep the drawn build; the paint is the problem.
4 **Structure.** Two of the three figures are the *same* navy silhouette. Heads are bare tan
spheres — shop mannequins.
5 **At 500 px.** Three coloured pills.
6 **Crossing strokes.** None.
7 **Palette.** `cloakIndigo #4D5A9E` and `cloakCrimson #9E3D2C` are the most saturated,
least-earthy colours in the film and they arrive on the only three figures who stand beside the
goblin. That is a bible decision as much as a build one, and it needs re-deciding.

### 6. WATER — heavy fix, close to a rebuild (row 14) · +7 draws / +2,248 tris
1 **Same hand?** No. `judge-water-1444x711-perf-z2.jpg` is **three flat colour fields** — tan,
grey, tan — with hard straight edges. It reads as a road map.
2 **Painted or shaded?** Neither. Flat fill. The banks carry **no dabs, no tiers, no marks at
all**; the river's lit dabs are **evenly spaced ruled white ticks** at one constant slant — a
mechanical tick row, exactly as MOCK-3 admitted.
3 **Drawn state.** Good — two graphite banks and a paper river, which is the row's own solve and
it works.
4 **Structure.** A card. Both ends are cut dead, no skirt, so it floats.
5 **At 500 px.** The river survives; the banks read as brown paper.
6 **Crossing strokes.** None.
7 `boardWater #CFDDDF` is a cold neutral against a warm world; on screen it is the second foreign
grey after sky's.

### 7. INCIDENT — fix (row 2) · +8 draws / +3,290 tris
1 **Same hand?** Half. The grass field is the ground class and is fine; the path is not.
2 **Painted or shaded?** The path is a **smooth, hard-edged, perfectly parallel brown stripe** —
"ruled analytic stripe plus gradient wash", the precise v1 signature the client rejected
(`judge-incident-1444x711-perf-z2.jpg`).
3 **Drawn state — the class's real failure.** At `judge-incident-1444x711-prep-z5.jpg` the incident
card is **indistinguishable from the plain ground card** in prep. Row 2 says "Path draws as a
three-band ribbon". It draws as nothing. Compare `judge-sheet-1444x711-prep.jpg`: the mid-front
disc in that frame has no path in it.
4 **Structure.** A decal on a disc.
5 **At 500 px.** The path survives; the wear marks do not.
6 **Crossing strokes.** None.
7 The three wear marks MOCK-1 fought for — cart ruts, landing patch, repair patch — were **not
visible in any of my four incident captures**, at zoom 2 or zoom 5, in either rig. MOCK-1 said
they sit "within a few percent alpha of not existing". They do not exist.

### 8. FIELD — fix (row 21) · +10 draws / +4,372 tris
1 **Same hand?** No. `judge-field-1444x711-perf-z2.jpg` reads as a **cadastral plan**: six polygons
outlined in bright green rules. MOCK-1 said the polyline hedge could not carry the class and
rebuilt it as a merged ridge — at film framing the ridge still reads as a ruled line.
2 **Painted or shaded?** Flat washes with a faint dab whisper. The field browns are greyer than
any earth on the island.
3 **Drawn state.** The class **disappears**: one grey disc with ghost polygon outlines.
4 **Structure.** Decal boundaries cut into grass with hard geometric edges. Land does not have
vertices.
5 **At 500 px.** Reads as a tortoise shell.
6 **Crossing strokes.** None.

### 9. FOLIAGE — fix (row 5) · +11 draws / +34,688 tris
1 **Same hand?** Close but not yet. The oaks are in the island's family; the pines are not.
2 **Painted or shaded?** Shaded. `judge-foliage-1444x711-perf-z5.jpg`: the crown is a **smooth
green mass with broad soft pale patches** — poster 12 reading as airbrush at this size. The pines
are **flat triangular facets with hard straight edges** — folded paper cones, zero incident.
3 **Drawn state.** Honest and good, but at 6× the crown's stroke field reads as **wood grain** —
long parallel strokes with hard white gaps across a whole lobe.
4 **Structure.** Oak lobes are authored form; pines are a primitive.
5 **At 500 px.** Survives well — this class is designed for it.
6 **Crossing strokes.** None.
7 **Palette.** The mock's greens are visibly **brighter and cooler** than the island's crowns in
the same frame. Side by side that is the most obvious palette break after sky.
8 **Measured cost contradicts MOCK-2.** The report claims 9,946 triangles. I measure **+34,688**
against the hero baseline — 3.5× the claim (its own scene total, 110,712, is nearer mine). It is
the most expensive class in the set and the number in the report is wrong.

### 10. BARK — fix (row 6) · +5 draws / +4,100 tris
1 **Same hand?** At island scale yes; at mock scale no.
2 **Painted or shaded?** Shaded — smooth brown cylinders with a vertical ramp; the 256² grain is
invisible at zoom 2, which is MOCK-2's own F5 finding (a 28% luminance band under a 100% Lambert
ramp).
3 **Drawn state.** Good tubes, one direction each — except the **cut stump top drains to a solid
black disc**, a blot rather than a drawing.
4 **Structure.** Lathes. The roughen now has height segments and helps, but not at this size.
5 **At 500 px.** Fine.
6 **Crossing strokes.** None.
7 Every limb **floats** — no ground, no contact.
8 MOCK-2 claims 682 triangles; I measure **+4,100**.

### 11. METAL — fix (row 11) · +18 draws / +3,960 tris · **THE ONE HARD-GATE VIOLATION**
1 **Same hand?** Partly — the sword and arrows are in language; the shield is not.
2 **Painted or shaded?** The shield is a **flat grey disc with a smooth radial ramp and a yellow
dot** — it reads as a frying pan or a coin, still, after MOCK-3's two iterations. The chain reads
as a bead diagram.
3 **Drawn state.** Thin but honest — outlines and one core-shadow stroke.
4 **Structure.** The shield has no rim thickness and no boss depth in its read.
5 **At 500 px.** `judge-metal-marks-water-fire-503x711-perf-z2.jpg` — the shield is a **coin**, the
sword a splinter, the hinge a speck.
6 **CROSSING STROKES — FOUND.** `judge-metal-1444x711-prep-z2.jpg`, the shield at ~(213, 424):
two straight authored strokes **cross at close to a right angle** inside the disc. This is the
only crossing I found in 41 captures across all 17 classes at 1×, 2×, 4×, 5× and 6× in both rigs.
It is a strap over a boss, not a hatch field — but the gate says crossing strokes are a blocker
and this one is visible at the film's own framing.

### 12. TIMBER — fix (row 7) · +23 draws / +5,048 tris (matches MOCK-3 exactly)
1 **Same hand?** Nearly — but the value is wrong: the limbs are **darker than any timber on the
island**, close to black-brown in shade.
2 **Painted or shaded?** Shaded with faint poster steps — bent tubing with a hard pale highlight
strip along the top.
3 **Drawn state.** Good; contours land on the form, which is MOCK-3's own world-space fix and it
shows.
4 **Structure.** The doorframe is an L of two rounded bars; the fallen log's **tail lifts off the
ground** so it reads as balanced rather than fallen.
5 **At 500 px.** Fine.
6 **Crossing strokes.** None.

### 13. MARKS — fix (row 23) · +7 draws / +1,074 tris
1 **Same hand?** Mostly. The amber matches the fire and the lantern.
2 **Painted or shaded?** N/A — marks. But the bolt's towed arc is a **mechanically smooth curve**
with no hand in it, against a film whose every other line wobbles.
3 **Drawn state.** Honest.
4 **Structure.** The three flashes read as a **clip-art sparkle**; the five landing-dust ticks
cluster into something that reads as a dead insect at 500 px.
5 **At 500 px.** The trail survives as a hair; the impact does not separate.
6 **Crossing strokes.** None.

### 14. GROUND — fix (row 1) · +7 draws / +3,226 tris
1 **Same hand?** Closest of the seventeen. The dab field is genuinely of the island.
2 **Painted or shaded?** The top is **painted** — three greens in committed dabs, the best painted
surface in the set. The **skirt is not**: `judge-ground-1444x711-perf-z6.jpg` shows the tan band
and the grey band as **two smooth Lambert gradients with no marks at all**, beside an island skirt
that carries strata, roots and a rim contour.
3 **Drawn state.** Honest, but **denser than the island's own ground** in the same frame — the
mock's card is close to a solid tone field where the island's still shows paper. Same class, two
tiers.
4 **Structure.** The card reads as a **pancake**: one flat disc with a hairline skirt, against the
island's three-band closed lathe. Every flat-card class in the sheet inherits this
(`judge-sheet-crop-1442x732-perf.png` — six pucks around one island).
5 **At 500 px.** Good.
6 **Crossing strokes.** None.
7 The dab field has **no large-scale value structure** — uniform size, uniform direction, uniform
density edge to edge. It is a wallpaper. The island's top has a dark passage and a dirt patch.
8 `bakeGroundSheet` measured by me at **12.5 ms** against a ≤12 ms budget.

### 15. PLANK — fix (row 8) · +30 draws / +7,092 tris (matches MOCK-3 exactly)
1 **Same hand?** Yes — the chest matches the island's own chest.
2 **Painted or shaded?** Borderline: each board is a smooth ramp with a faint grain; the read is
carried by the drawn joint combs, which is legitimate but leaves the surface itself quiet.
3 **Drawn state.** The best drawn state in the set — real construction lines.
4 **Structure.** The best-structured class in the film. The radial disc reads as a plank floor.
5 **At 500 px.** Survives.
6 **Crossing strokes.** None.
7 **Nine materials against the row's budget of two** (MOCK-3's own finding). Highest draw cost in
the set at +30.

### 16. FIRE — light fix (row 13) · +10 draws / +3,336 tris (two fires)
Reads as fire, drains honestly to a graphite teardrop, and the amber is the film's one glow hue
and matches the lantern. Two faults: the authored teardrop contour is a **hard balloon outline**
that sits proud of the tongue mass, and the coal bed is invisible at zoom 2.

### 17. GLASS — pass (row 12) · +8 draws / +666 tris
`judge-sheet-1444x711-perf.jpg`. It is the island's own lantern language, at the island's own
scale, with the island's own amber. Nothing to fix in this round. (MOCK-3's worry — that the
drained glass reads as a hole — is real but sub-pixel at the film's lantern sizes.)

---

## 4. HARD GATE — crossing strokes

**One violation, in one class.** The metal shield's straps cross inside the disc in rig B at
zoom 2: `judge-metal-1444x711-prep-z2.jpg`. Everything else is clean. I checked at 1×, 2×, 4×, 5×
and 6× in both rigs, with additional pixel-level magnification on rock's facet interiors, foliage's
crowns, ground's card and water's banks — 41 captures. **No live `hatch()` / `crossHatch()` /
`contact()` / `rays()` call site exists in any of the 22 mock files** — grep returns exactly one
match across the whole folder and it is a comment at `marks.ts:218` recording that `rays()` was
deliberately not reproduced. Rock's per-facet direction flip
at ~150 inked edges is not a gate violation but is the nearest thing to one in the set.

## 5. MEASURED — draws, triangles, budgets

Hero island alone: **320 draws / 79,888 triangles**. All figures below are my own HUD reads.

| class | draws | Δ draws | tris | Δ tris |
|---|---|---|---|---|
| ground | 327 | +7 | 83,114 | +3,226 |
| incident | 328 | +8 | 83,178 | +3,290 |
| rock | 339 | +19 | 98,612 | +18,724 |
| strata | 344 | +24 | 96,574 | +16,686 |
| field | 330 | +10 | 84,260 | +4,372 |
| foliage | 331 | +11 | 114,576 | **+34,688** |
| bark | 325 | +5 | 83,988 | +4,100 |
| timber | 343 | +23 | 84,936 | +5,048 |
| plank | 350 | +30 | 86,980 | +7,092 |
| metal | 338 | +18 | 83,848 | +3,960 |
| sky | 326 | +6 | 82,416 | +2,528 |
| snow | 329 | +9 | 83,486 | +3,598 |
| water | 327 | +7 | 82,136 | +2,248 |
| fire | 330 | +10 | 83,224 | +3,336 |
| glass | 328 | +8 | 80,554 | +666 |
| cloth | 328 | +8 | 86,186 | +6,298 |
| marks | 327 | +7 | 80,962 | +1,074 |
| **sum of deltas** | | **+210** | | **+120,934** |
| **all 17 on one sheet** | **505** | **+185** | **184,210** | **+104,322** |

The sheet total is lower than the sum because the wider fit culls; both numbers are measured.

**Against the budgets.** No single stage carries all seventeen classes, so the **≤120 draws per
stage** ceiling is not breached by this set — but +185 for seventeen classes means a stage using
eight of them lands near 100, which is where §11.6's reconciled 47–86 per stage stops having
headroom. Two of the seventeen are half the cost: **plank (+30) and strata (+24) are 29% of the
draws; foliage and rock are 44% of the triangles.**

**Materials.** The mock route exposes no scene handle (no `__r3f` on the canvas or any ancestor —
checked), so per-class material counts here are the authors' own live figures, and two of them
already contradict the census: group A measured **18** distinct trilayer materials where §11.6
allots 11, and plank measured **9** where the row allots 2. **The film-wide 40-material budget
must be re-derived from the stroke ladder before the film body is built** — it is currently
counted per class, and `stroke.dir` is a per-material uniform (`trilayer.ts:498`), so every seeded
direction is another slot. This is a live risk, not a hypothetical.

**Timing.** `bakeGroundSheet` 1024²: **12.5 ms** measured, budget ≤12 ms.

## 6. CONTINUITY — do these read as ONE world?

**No, in rig A. Yes, in rig B.** That split is the single most useful thing in this review.

- `judge-sheet-1444x711-perf.jpg` / `judge-sheet-crop-1442x732-perf.png`: the painted sheet reads
  as **four projects sharing a table** — a brushed island and its ground cards; a set of grey
  camouflage stage flats; a marshmallow mountain on a chocolate plinth; and a scatter of smooth
  vinyl props. The eye lands on the sky sheets first because they are the only cold neutrals, and
  on the snow dome second because it is the only object with no surface at all.
- `judge-sheet-1444x711-prep.jpg`: the drawn sheet reads as **one drawing**, made by one hand, on
  one page. Tone ladders agree, stroke families agree, every contour is the same instrument.

**The classes that break the set, named:**
1. **sky** — the only cold neutral greys in the film, and a pattern language (hard-edged blobs)
   that appears nowhere else.
2. **snow** — the only surface with zero incident of any kind.
3. **strata** — the only large mass rendered as an unbroken gradient.
4. **cloth** — the only saturated non-earth colours, on the three figures nearest the hero.
5. **water** — the second cold grey, and the only ruled tick rhythm.
6. **field** — the only ruled boundary lines.

**One structural break that is nobody's class:** every flat-card class (ground, incident, field,
water) is a **puck** — a disc with a hairline skirt — beside a hero island with a three-band
closed lathe, stepped strata, roots and a rim contour with authored gaps. In
`judge-sheet-crop-1442x732-perf.png` that difference is the sheet's dominant read, ahead of any
single class's texture.

**And nothing grounds.** Not one prop class has a contact blob or a cast shadow onto anything. The
route gives no ground card under a mock, so C9's grounding is **unproven film-wide** — for foliage,
bark, timber, plank, metal, glass, cloth, fire and marks alike.

---

## 7. THE ONE FIX LIST — ordered, and the only round there will be

1. **Build the five stubs.** `hide` (row 22 — the S6 monster and the S3 ravens), `board` (row 20 —
   the film's last shot), `paperprop` (row 16), `machinery` (row 19), `drawnsheet` (row 18).
   Nothing else on this list matters if the last shot of the film does not exist.
2. **STRATA: give the seven bands a surface.** Bake `bakeStrataBand` (512², tiling, one tile,
   three tint blocks UV-selected so one bake serves all seven tokens — plank's own lever) and
   raise poster off 0. Row 4's "NO BAKE" is disproven by `judge-strata-1444x711-perf-z4.jpg`.
3. **STRATA: add the drop shadow and break the band boundaries.** It floats in every frame. Give
   each boundary a crumble amplitude of ~3–5% of band height so no two bands meet on a flawless
   curve, and give band 7 a talus foot that spreads into scree instead of a flat brown skirt.
4. **SNOW: rebuild the massif under the cap** on group A's strata or rock vocabulary — a lathe at
   poster 4 with no albedo is the v1 register the client rejected. Then replace the seven lee
   rectangles with tapered strips evaluated in the cap's own (azimuth, height) space, which means
   giving row 15 the bake it currently forbids.
5. **SKY: repaint the leaves as brushwork.** Replace the hard-edged bank blobs with dab clusters
   (bakeSkySheet already proves 46 belly dabs work; the banks did not get the same treatment), and
   break the regular scalloped arcs into an irregular skyline with unequal lobes.
6. **SKY: kill the cold neutral grey.** Warm every leaf tint toward the film's stone/earth family;
   nothing in `docs/reference/goblin-actions.png` is neutral. Keep the three-step tint ladder, move
   all three steps onto warm axes.
7. **ROCK: rebuild the mass** as more, smaller lobes at lower radius (MOCK-1's own conclusion,
   which he did not take far enough), and **drop `inkEdges` to a silhouette-only pass** — a
   threshold that yields ≤12 lines on a five-lobe mass, not ~150. The wireframe is what makes
   `judge-rock-1444x711-prep-z6.jpg` a diagram.
8. **ROCK: cut the triangle cost.** +18,724 for one boulder field, second-highest in the set, for
   a class that reads worse the more of it you see.
9. **CLOTH: replace the lathe with a sculpted silhouette** that is wide across the lens and
   genuinely irregular in plan — the 0.56 depth squash was not enough and
   `judge-cloth-1444x711-perf-z2.jpg` is still a pawn. Kill the pale rim that reads as specular.
10. **CLOTH: re-decide the trio's palette with the client.** `cloakIndigo #4D5A9E` and
    `cloakCrimson #9E3D2C` are the only saturated non-earth colours in the film and they sit
    beside the hero. Recommend earthy substitutes at the same tiers, and differentiate the two
    navy figures — they are currently the same silhouette in the same colour.
11. **CLOTH: give the heads a hood or a hair mass.** Bare tan spheres read as mannequins.
12. **METAL: fix the crossing strokes on the shield** — `judge-metal-1444x711-prep-z2.jpg`.
    This is the hard gate and it is the only violation in the set.
13. **METAL: make the shield read as a shield.** It needs rim thickness and boss depth in its
    silhouette, not a radial ramp; at 500 px it is a coin.
14. **INCIDENT: make the path draw.** In prep it is currently invisible —
    `judge-incident-1444x711-prep-z5.jpg` is identical to the plain ground card. Push
    `earthTrack`/`trackShade` far enough apart in triTone to land different tiers, or draw the
    ribbon's two edges as authored strokes.
15. **INCIDENT: break the path's ruled edges.** A smooth parallel stripe is the exact v1
    signature. Give the ribbon an irregular edge and lay dabs across it.
16. **INCIDENT: land the three wear marks or delete them from the row.** They were invisible in
    all four of my captures. A mark that does not exist should not be in the bible as "the mark
    that makes twelve islands read as one commute".
17. **WATER: give the banks a surface.** They are flat tan planes with nothing on them. They take
    the ground class's dabs and the ground class's tiers, or the class stays a road map.
18. **WATER: de-rig the lit dabs.** Vary length, spacing and angle; the current row is mechanical.
    Add C1's skirt to both ends so the ribbon stops floating.
19. **FIELD: replace the green rules with a real separator** — a low planted ridge with its own
    dabs, or a value step in the wash, but not a line. And make the field boundaries irregular:
    land does not have vertices.
20. **FIELD: give the class a drawn state.** It vanishes at curtain 1.
21. **GROUND: paint the skirt.** The two skirt bands are smooth Lambert with zero marks
    (`judge-ground-1444x711-perf-z6.jpg`) beside a hero skirt that carries strata and roots.
    This is the single highest-leverage fix in the set because ground+incident are twelve islands.
22. **GROUND: give the dab field large-scale value structure.** Vary dab density and direction
    across the card so it stops reading as wallpaper, and match the drawn state's density to the
    island's — the mock currently drains a tier darker.
23. **ALL FLAT-CARD CLASSES: stop them being pucks.** ground, incident, field and water each need
    the hero's three-band closed-lathe skirt at card scale (C1's own formula), not a hairline rim.
    This is the sheet's dominant continuity break.
24. **FOLIAGE: rebuild the pine** — flat triangular facets with hard edges are a primitive with a
    material. Oak's lobed vocabulary works; pine needs the same treatment.
25. **FOLIAGE: cool-shift and dull the crown greens** to sit with the island's, and drop poster 12
    to ~8 so the lit patches stop reading as airbrush at large framings.
26. **FOLIAGE: cut the triangle cost** — +34,688 measured, 3.5× MOCK-2's reported figure, the most
    expensive class in the film.
27. **TIMBER: lift the value.** The limbs are darker than any timber on the island. And clamp the
    fallen log's tail to the ground — the accumulating curl lifts it and it reads as balanced.
28. **BARK: fix the drained stump top.** It is a solid black disc; it needs a committed lighter cap
    value so a cut reads as a cut.
29. **MARKS: put a hand in the bolt's arc.** It is the only perfectly smooth curve in the film.
    Push the three impact flashes apart so they stop reading as one clip-art sparkle.
30. **FIRE: derive the teardrop contour from the merged silhouette** instead of the view plane —
    it currently floats 2–4 px proud of the tongues. Raise the coal bed's value so it exists.
31. **PLANK: collapse nine materials to two** via three tint blocks in `bakePlank`, UV-selected
    (MOCK-3's own recommendation, not built).
32. **RE-DERIVE the film-wide material census from the stroke ladder**, not the class list.
    §11.6's 33/40 is already wrong by 7 on group A alone and by 7 on plank alone.
33. **Prove grounding.** Give `MockSheet` a ground card under the mock and hand `markCaster` to
    `buildMock()`, then re-check the contact blob on foliage, bark, timber, plank, metal, glass,
    cloth, fire and marks. C9 is unproven for every one of them.
34. **Fix the route's seam park** (`MockSheet.tsx:105` → after `buildHero()`, or call
    `parkHeroRig()` in a `useLayoutEffect`) and retire the two duplicate `parkSeam` workarounds in
    `foliageKit.ts:61` and `plankKit.ts:181`. It did not misfire for me, but three authors lost
    rebuilds to it and one line removes the doubt.
35. **Bring `bakeGroundSheet` under 12 ms** — measured 12.5 ms.

## 8. Rebuild rather than fix

**strata · snow · sky · rock · cloth.** Each of these five fails question 2 outright — they are
shaded geometry, not painted surfaces — and no amount of mark-adding on top of a smooth Lambert
ramp will make them read as the hand that made the island. Items 2–11 above are written as
rebuilds, not adjustments.

---

## 9. Files

Evidence, all captured by me on 2026-09-04, all in this folder:

`judge-sheet-1444x711-perf.jpg` · `judge-sheet-1444x711-prep.jpg` ·
`judge-sheet-crop-1442x732-perf.png` · `judge-sheet-503x711-perf.jpg` ·
`judge-sheet-503x711-prep.jpg` · `judge-strata-1444x711-perf-z2.jpg` ·
`judge-strata-1444x711-perf-z4.jpg` · `judge-strata-snow-sky-503x711-perf-z2.jpg` ·
`judge-snow-1444x711-perf-z2.jpg` · `judge-sky-1444x711-perf-z2.jpg` ·
`judge-rock-1444x711-perf-z2.jpg` · `judge-rock-1444x711-prep-z6.jpg` ·
`judge-cloth-1444x711-perf-z2.jpg` · `judge-water-1444x711-perf-z2.jpg` ·
`judge-incident-1444x711-perf-z2.jpg` · `judge-incident-1444x711-prep-z5.jpg` ·
`judge-foliage-1444x711-perf-z5.jpg` · `judge-ground-1444x711-perf-z6.jpg` ·
`judge-field-1444x711-perf-z2.jpg` · `judge-metal-1444x711-prep-z2.jpg` ·
`judge-metal-marks-water-fire-503x711-perf-z2.jpg`
