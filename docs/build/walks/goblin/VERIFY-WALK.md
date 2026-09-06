# Goblin rebuild — adversarial verification walk

2026-09-03. Every number below was measured by the verifier, in this session, on the running dev
server (localhost:5180, PID 17556, never restarted). Nothing here is quoted from a builder report.

Environment: Chrome, window foregrounded and re-asserted after every screenshot
(`document.visibilityState === 'visible'` plus a counted rAF burst — 37 frames / 600 ms at the
start, 60.1 fps measured idle at the end). One measurement (the budget probe) was taken while the
tab had silently dropped to `hidden` and was re-run after re-foregrounding via PowerShell
(`ShowWindow` minimize-foreground → `ShowWindow(9)` + `SetForegroundWindow` on the Chrome handle).

6× zoom method: `gl.setPixelRatio(6)` + `gl.setSize(innerWidth, innerHeight, false)` on the live
renderer, with the canvas CSS-transformed `scale(6) translate(-x,-y)`. The drawing buffer is 6×
the CSS box and the transform maps it 1:1, so this is a true optical 6×, not an upscale — and
because `setPencilResolution` is left at CSS-px, line weights magnify correctly with it. Scale
factors above 6 (8, 9) silently clamp the drawing buffer and render the wrong region: **6 is the
usable maximum at 1440×900.** The `zoom` computer action does NOT magnify — it only crops.

Chrome's minimum window width on this machine is 500 CSS px, so a true 390-wide *layout* could not
be walked. The phone STROKE tier (`pencil.ts:34-36`, `window.innerWidth < 700` at module load) WAS
reached by sizing the window to 500 before load; every Class P number at 390/500 below was taken
in that state and is therefore the real phone tier, which nobody had measured before.

---

## 1. Build and checks

    npm run build   exit 0  (tsc --noEmit + vite build, 566 ms)
    npm run check   exit 0  (13/13 scripts)

**`npm run check` being green does not mean the gates pass.** `gob.check.ts:67` files every gate
with an `expect` flag, and only `'now'` gates feed the exit code (`assert.equal(hardFails, 0)` at
:701). 8 gate readings are still tagged `'rebuild'`, print `✗ … [awaits rebuild]`, and do not fail
the process. Its own summary line says so: `31 gates · 23 passing · 8 awaiting the rebuild · 0
REGRESSIONS`.

## 2. CLASS G — measured

| gate | target | measured | verdict |
|---|---|---|---|
| G1 | aspect ≥ 1.45 | 1.40 @390×844 · 1.35 @500×915 · 1.31 @768×1024 · 1.42 @1440×900 | **FAIL ×4** |
| G2 | right ear ≥ 2% above left | +16.4% · +14.6% · +13.2% · +17.3% (clears body by 5.7/6.4/7.9/16.3 px) | PASS ×4 |
| G3 | head ≤ 0.86 × hem | 0.81 · 0.81 · 0.80 · 0.77 | PASS ×4 |
| G4 | eye proud ≥ 0.03 rig units | printed `near +—, far +—` | **PASS, but no number** — see GOB-T9 |
| G5 | pencil ≥14 px@390 / ≥34@1440, overlap ≤20% | 24.3 px · 59.5 px; over his own mass 0% / 0% (bbox metric 32%/31%) | PASS |
| G6 | face plane 40–48° off the him→camera ray | 35.1° · 35.9° · 37.0° · 47.5° | **FAIL 3 of 4** |
| G7 | figure ≥ 52 CSS px | 45.5 · 58.2 · 80.6 · 115.7 | **FAIL @390** |
| G8 | EAR_Z_R/EAR_Z_L one home, old constant gone | true/true/true (re-grepped independently) | PASS |
| G9 | buildGoblin banned vocabulary | 0 each. Independently re-grepped world.ts:1067–1562 (buildGoblin's real body): 0 hits for `hatch(`, `crossHatch(`, `contact(`, `blobs(`, `timberDark`, `paint(`, `gobTunic`, `gobHood`, `gobBelt`, `gobSkinLit` | PASS |
| G10 | one REST table, three readers | REST exported, applyPose exists, 3/3 call it, 0 inline literals — but still tagged `[awaits rebuild]` | PASS |
| G11 | shadow crosses the seam band | reach x 1.86 > band edge 1.20 | PASS |
| G12 | contact pool + contour parity | pool present, `neverAlive` set, hide-loop gone, 0 stray not-alive trilayers, 0 contours in the opt-out | PASS |
| G13 | clear of the island underside | 72.9 · 103.4 · 157.8 · 197.2 px of card below his soles | PASS ×4 |

**G12 re-verified LIVE**, not just in Node — traversing `__hero.hero.goblin.root` in the running
page: 36 trilayer fills, 35 with `alive.value === 1`, exactly 1 not alive (the contact pool), 2
ink shells, 14 line objects, 1 `neverAlive` node, **0 contour objects inside it**. At the hero the
seam band is live at `seamX 1.0 / seamW 0.2` and he stands at x 0.95 — the band literally crosses
his body — and nothing on him switches to the underdrawing at 6× on either side. His contours and
his surfaces agree at the seam by construction, and I confirmed it in the frame, not in a comment.

## 3. CLASS P — Performance rig (curtain 0), measured at five sizes

`__gob(w, h, {ss:2, curtain:0})`, run by the verifier.

| | 390×844 | 500×915 | 768×917 | 1440×900 | 1920×1080 |
|---|---|---|---|---|---|
| P1 cloak ≤ crown − 0.12 | 0.008 **F** | 0.015 **F** | 0.018 **F** | 0.036 **F** | 0.041 **F** |
| P2 range/plateaux (≥60, ≥3) | 48/3 **F** | 81/2 **F** | 70/3 P | 71/3 P | 59/2 **F** |
| P3 amber in head bbox | 172 (≥40) P | 303 (≥250) P | 414 P | 1021 P | 1615 P |
| P3b near:far ≤ 2.5 | 91:87 = 1.05 P | 168:151 = 1.11 P | 222:211 = 1.05 P | 605:544 = 1.11 P | 961:855 = 1.12 P |
| P4 rim samples (px) | 3 / 2.5 / **0** / 4.5 — r 1.8 **F** | 3 / 2.5 / **0** / 5 — r 2.0 **F** | 3.5 / 2.5 / 2.5 / 4.5 — r 1.8 **F** | **1.5** / 3 / 2.5 / 4.5 — r 3.0 **F** | **1.0** / 3 / 2.5 / 4 — r 4.0 **F** |
| P5 contact area ratio (≥0.9) | 0.512 **F** | 0.405 **F** | 0.323 **F** | 0.214 **F** | 0.206 **F** |
| P5 contact mean delta | 0.450 | 0.467 | 0.483 | 0.451 | 0.411 |
| P6 region delta / boundary | 0.272, 0.645 over 3 px P | 0.329, 0.572 / 2 px P | 0.389, 0.344 / 2.5 px P | 0.323, 0.494 / 3 px P | 0.330, 0.353 / 3.5 px P |
| P7 amber off head (0) | 0 P | 1 **F** | 3 **F** | 7 **F** | 8 **F** |

The rim sample order is `head-seam-side / head-painted-side / hem-seam-side / hem-painted-side`.
The printed `ratio` **hides the zeroes**: the harness drops non-finite/zero samples from `rimVals`
before taking max:min, so a 0 px rim reports as `ratio 1.8` and only fails through the separate
`rimVals.length === rims.length` term. The zeroes are real and visible — see §6.

## 4. CLASS P — Prep rig (curtain 1), measured at the same five sizes

| | 390 | 500 | 768 | 1440 | 1920 |
|---|---|---|---|---|---|
| P8 cloak lit range /255 (≥45) | 200 | 199 | 194 | 195 | 195 |
| P8 darkest cloak px (≥ 0.165) | 0.174 | 0.181 | 0.199 | 0.196 | 0.196 |
| P8 verdict | PASS | PASS | PASS | PASS | PASS |
| P1 under Prep | 0.286 P | 0.294/0.300 P | 0.299 P | 0.318 P | 0.320 P |

P8 passes at all five. He is not a hole under Prep at any framing — that part of the rebuild
holds, and it holds one breakpoint further than the builder measured.

Class-P numbers taken at the **true phone stroke tier** (window 500 wide before load) are
identical to the desktop-tier readings to within rounding — 390: P1 0.010, P2 48/3, P4 3/2.5/0/4.5,
P5 0.512, P6 0.300; 500: P1 0.015, P2 81/2, P4 3/2.5/0/5, P5 0.423. The open "phone tier not
measured" item is now closed, and it changes no verdict.

## 5. P9 / P10

- **P9 — NOT RUNNABLE.** `gobBirth` (§13 step 8) is unbuilt, so there is no birth t = 0.5 state to
  read. Not a pass.
- **P10, clause 1 (hard gate) — PASS.** At a true optical 6× on the head, the hem, the cloak and
  the ears, in both rigs, **there are no crossing strokes anywhere on him.** He carries no stroke
  family at all; the only marks on him are single-family authored contour lines. G9 proves it in
  source and the frames prove it on screen.
  (The island's own graphite side *is* densely cross-stroked — three families crossing on the
  ground under him, `verify-zoom6x-ground-1440x900.jpg`. That is the film body, outside this brief.)
- **P10, clause 2 (drybrush at every rim) — FAIL.** No drybrush at any rim, and two rim samples
  measure 0 px.
- **P10, clause 3 (stroke tiles resolve on the cloth) — FAIL.** See §6.

## 6. What I see — the eye pass

**At 500×915, the narrowest real framing available (phone stroke tier), he is not a subject.**
`verify-hero-500x915-phonetier.jpg`. He is a ~58 px dark smudge on the seam with one yellow dot.
No ear reads, no face reads, no pencil reads, no creature reads. The signpost, the lamp post and
the near tree all read more clearly than he does. The answer to "is there a subject in this
poster at phone width" is no.

**At 1440×900** (`verify-hero-1440x900.jpg`, 6× in `verify-zoom6x-figure-1440x900.jpg`,
`verify-zoom6x-body-1440x900.jpg`, `verify-zoom6x-head-1440x900.png`):

1. **The cloak is a smooth Lambert gradient.** No poster tiers, no stroke tiles, no edge wear —
   one continuous grey-blue ramp with a soft highlight down the left flank and visible lathe
   facets. The island beside him is painterly dashes on the painted half and pencil strokes on the
   graphite half. **He does not share the world's material language; he looks pasted on.**
   The numbers agree: the 26-sample torso scan at 1440 is
   `122, 90, 79, 71, 65, 56, 52, 51, 52, 55, 61, 62, 62, 62, 62, 63, 63, 63, 64, 64, 64, 65, 65, 99` —
   a monotone decay into a 20-sample flat. The "3 plateaux" P2 counts are the quantization floor
   of a smooth ramp, not committed tiers.
2. **There is no face.** The two amber eyes are large flat lobes hanging off the *lower-left* of
   the skull, with the near one's left third outside the head's own silhouette. No pupil or iris
   resolves at 6× (a `pupils` group exists on the rig). No nose, mouth, fang or brow reads. From
   a normal distance it is a hooded shape with a yellow blob under its chin.
3. **Part of his silhouette has no drawn line.** The bell's upper-right edge, from the shoulder
   round to the hip, is a soft antialiased edge against the grass while the lower-left hem carries
   a 4–5 px black band. That is the P4 `0 px` and `1.5 px` samples, seen.
4. **The pencil does not read as a tool in a hand.** It is a flat tan slab with no ferrule, no
   graphite tip and no dark core visible at 6×; it crosses in front of the mitt at ~90° to the
   forearm, with about a third of its length above the grip. It reads as a stake leaning on him.
5. **The cast shadow reads as an ink blot.** At `aliveShadow 0.97` (§8 prescribed 0.62) it is a
   near-solid black lozenge — the darkest and loudest mass in the frame, louder than the figure,
   and it does not read as his silhouette drawn twice.
6. One stray orange scratch sits on the cloak's right shoulder — the satchel, which never reads as
   a satchel at any size (this is the P7 amber).

**Prep rig** (`verify-prep-rig-1440x900.jpg`, 6× `verify-prep-zoom6x-1440x900.jpg`): the conceit
works — the world goes graphite and he keeps colour. Same three defects (smooth cloak, missing
upper-right contour, tan-plank pencil), plus the black shadow reads even heavier against paper.

**Film body** (`verify-film-c1-goblin-1440x900.png`, C1 at ~p 0.18): at roughly 230 px tall he
renders **with no readable ink contour at all** — a smooth dark teardrop with a green head on
smooth green ground. At the road beat (p 0.45, seen from behind) he does carry a contour and reads
acceptably. The cause is in source, not in the frame: `solveGoblinRim` is called from `hero.ts`,
`Hero.tsx`, `gobMeasure.ts` and `posterBake.ts` — **never from the film** — so the film keeps
`GOB_RIM_DEFAULT` 0.024 rig units and his line weight rides the camera distance.

## 7. Walks — what is NOT broken

- **Entrance** (default route, `/`): plays from blank paper → strokes writing on → colour flood →
  settled cover. Takes ~25 s end to end on this machine. Completes clean.
- **Mouse life** (`?hero=1`, 1502 frames / 25 s with real trusted hovers):
  head.rotation.x −0.2276…0.0447, head.rotation.y 0.2334…0.5266 (tracks the cursor),
  eyeR.scale.y 0.12…1 (**blink fires**), earR.rotation.z −0.55…−0.25 (**ear tick fires**).
- **Idle scritch** (1083 frames / 18 s with no input): `armR.wrist.rotation.x` −0.3928…−0.2072,
  `armR.pose.rotation.z` −0.3279…−0.2721, head returned to base 0.38. **Working.**
  (`bob.position.y` is 0 throughout — correct: the "breath" in heroLife is camera parallax, not a
  body channel.)
- **Reduced motion** (`__prmForce(true)` + reload): every joint at REST, two snapshots 3 s apart
  byte-identical, no spinner on the figure. `verify-prm-still-1440x900.jpg`. Honest still.
  (The scroll-hint SVG keeps its infinite CSS drift under a *forced* PRM only, because
  `__prmForce` patches JS matchMedia and CSS cannot see it. `hero.css:293-297` disables it under a
  real `prefers-reduced-motion: reduce`. Not a defect.)
- **First-scroll handoff and its reverse**: forward 0 → 8% hands off cleanly; scrolled back to a
  true `scrollY === 0` (Lenis momentum has to be forced down over ~120 frames) the cover restores
  exactly — wordmark, tagline, affordances, island framing and figure all back.
  `verify-cover-default-route-1440x900.jpg`.
- **Full film scrub**: 41 steps forward and 41 back, 0 page errors. Spot-checked at p 0.18 (C1),
  0.45 (road), 0.62 (tavern), 0.88 (aerial). Nothing the figure change broke downstream except the
  film rim above. The throw at t62.08 is indeed off camera (aerial at p 0.88 — the builder's own
  note, confirmed).
- **Console**: zero errors on every path walked (hero, cover, full film forward and back, Prep,
  PRM). Two warnings, both `THREE.Clock: This module has been deprecated` from r3f, one per
  Canvas, pre-existing.
- **Budget** (measured live off the scene graph): goblin subtree 6,212 triangles across 62 visible
  meshes + 14 line objects; pencil 66 triangles / 4 meshes. Under the doc's ≈9,300 triangle target.
  Idle fps 60.1.

## 8. Regressions

**None found.** Build green, checks green, console clean, life green, PRM still honest, handoff
and reverse exact, film scrub error-free.

## 9. Frames

| file | what |
|---|---|
| `verify-hero-1440x900.jpg` | settled hero, Performance rig |
| `verify-zoom6x-figure-1440x900.jpg` | true optical 6×, whole figure |
| `verify-zoom6x-body-1440x900.jpg` | 6×, cloak + pencil + pocket |
| `verify-zoom6x-head-1440x900.png` | 6×, head and eyes |
| `verify-zoom6x-ground-1440x900.jpg` | 6×, the graphite ground under him (island cross-strokes) |
| `verify-hero-500x915-phonetier.jpg` | 500×915, phone stroke tier, 1:1 |
| `verify-zoom6x-500x915-phonetier.jpg` | 6× at the portrait framing, phone tier |
| `verify-prep-rig-1440x900.jpg` | Prep rig, curtain 1 |
| `verify-prep-zoom6x-1440x900.jpg` | 6×, Prep rig |
| `verify-prm-still-1440x900.jpg` | reduced-motion still |
| `verify-cover-default-route-1440x900.jpg` | default route cover, settled |
| `verify-film-c1-goblin-1440x900.png` | the film's C1 beat — no contour |
