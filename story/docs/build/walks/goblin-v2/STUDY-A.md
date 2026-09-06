# Study A — the Good Goblin, sculpted from nothing as one continuous skin

`src/film/stages/gobStudyA.ts` · `/?gobstudy=A [&view=front|three|back|sheet] [&rig=prep] [&zoom=1..6]`

The previous contents of that file were deleted, not revised. Nothing is ported from
`world.ts` — not a part, not a proportion, not a constant, not a colour.

---

## 1. What is built

One `Object3D`, origin at the soles, facing +z, authored 0.90 world units tall.
**30,134 triangles · 27 draw calls · 24 materials** (`window.__study()`, front plate,
1350×896). At the shipped scene framing he projects **61.7 × 117.4 CSS px** and the whole
frame costs 296 calls / 76,540 tris — the figure is 9 % of that.

**The construction is ONE CONTINUOUS SKIN.** `buildTrunk()` lofts a single
`BufferGeometry` through 36 hand-shaped cross-section keys from the hood's crown to the
tunic's hem — crown, brow, cheek band, chin, hood bottom, shoulder, chest, waist, belt,
skirt, hem. The face is **not a separate object and not a hole**: it is a *recess* in that
same skin, pushed back along −z inside a window whose boundary is a fold. Cloth, hood
interior, shaded forehead, terminator mid-tier, lit lower face and belt are **material
groups of that one geometry** — they share their vertices, so no two of them can ever
grow separate outlines. That is the whole answer to "a robot made out of tins and shapes".

Ears, arms and legs are lofted tubes whose **first cross-section sits inside the trunk's
volume**, so a limb grows out of the mass instead of butting against it, and one merged
ink shell covers trunk + ears + arms + legs — the whole silhouette is one line.

The hood's front hem is a **real forward-projecting overhang**, not a painted patch: two
adjacent ring rows carry the whole 0.06-unit step, so the key throws a real shadow across
the forehead and the top of the eyes, and under the Prep rig it softens on its own.

---

## 2. How it measures against the client's plates

A silhouette-profile probe reads the *rendered* figure row by row and reports width ÷ H at
the reference's own landmark fractions, so these numbers drop straight beside
`docs/2026-09-03-goblin-reference.md` §1. Front plate, 1350×896, performance rig:

| landmark | client's plate | study A | Δ |
|---|---|---|---|
| f 0.04 — hood near the crown | 0.249 | **0.249** | 0.000 |
| f 0.062 — hood's front hem | 0.339 | 0.327 | −0.012 |
| f 0.203 — **ear tips, the figure's full width** | 0.757 | 0.744 | −0.013 |
| f 0.36 — head at its widest | 0.525 | 0.518 | −0.007 |
| f 0.44 — head still at 93 px | 0.525 | 0.500 | −0.025 |
| f 0.48 — hood's bottom edge | 0.435 | 0.429 | −0.006 |
| f 0.52 — shoulder | 0.322 | 0.325 | +0.003 |
| f 0.605 — waist | 0.282 | **0.330** | **+0.048** |
| f 0.712 — hands at the hips | 0.362 | **0.363** | +0.001 |
| aspect (H : W, ear tips in) | 1.32 – 1.38 | **1.336** | in band |
| height of the widest row | 0.203 | 0.208 | +0.005 |

**Gates.** G1 aspect 1.336 ∈ [1.25, 1.45] and the widest row *is* the ear tips ✓.
G2 the crown is the apex, both tips 0.208 H below it, one symmetric constant, ≤ 0.02 H
apart by construction ✓. G3 head 0.518 ÷ widest body below the shoulder 0.363 = **1.43 ≥
1.30** ✓. G4 the eye caps stand 0.042 proud of the skull ✓.

**Colour, measured off the framebuffer** (front plate; the client's sampled value first):

| | client | study A |
|---|---|---|
| cloak base | 0.320 | **0.322** — 29.5 % of the figure, its largest plateau |
| cloth shade / mid | 0.188 / 0.249 | 0.212 |
| skin, shaded forehead | 0.372 | **0.373** |
| skin, lit lower face | 0.688 | 0.678 |
| skin, terminator mid | 0.416 | 0.427 |
| ear | 0.642 | 0.627 |
| linen wrap | 0.814 | 0.831 |
| **eye bright field** | **0.914** | **0.914** |
| contour | 0.102 | **0.102** |
| eye area share | 5.6 % | **5.63 %** |
| eye warmth r−b | 166–178 | 162, and nothing else on him exceeds it |

Ten committed plateaux across the figure, spanning 0.102 → 0.914 — P2's ≥ 50/255 and
≥ 4 plateaux are cleared several times over. P3/P7's amber classifier (r−b ≥ 100) fires
on the eye almonds and nowhere else.

---

## 3. The hard part, and how it is solved

The reference is flat 2D cel; the film is 3D in a painted/graphite language. The two
already agree about **one** thing: tone comes in committed TIERS, not ramps. The cel art
is a five-tier quantization of one hue and `uTriPoster` is a quantizer — the same
instrument. So he takes the film's whole program (trilayer, sheet basis, one stroke family
per form, drybrush rim, two-tier authored line) and the **client's own tier placement**.

Three things had to be discovered live rather than assumed, and each one is a measurement:

1. **The quantizer works in gamma-2.2 space; the client's values are sRGB.** The shader's
   0.1389 plateau measured back off the canvas as sRGB **0.117**. Converting the client's
   palette into the quantizer's space and solving for the tier density gives **N = 20** —
   which lands the cloak base (0.324 → 0.325), the shaded skin (0.373 → 0.375) and the lit
   skin (0.682 → 0.675) within 0.002, and whose step of 1/20 is the client's own tier
   density (five cloth tiers across a 0.196 span = 0.049 apart).

2. **The rig does not light his camera-facing side at all.** The hero stages the key at
   (−4, 3.95, −4) and stages *him* at rotation.y 1.542, so he faces +x with the key behind
   him. Setting the material colour to pure red and then to pure green changed the rendered
   pixel by **zero**: at that light level `wear`'s few per cent of paper outweighs the lit
   colour 25 : 1 and the poster then commits a *paper-hued* grey. He rendered as a grey
   figure. Where wear is small and light is nil the result is worse — `outgoingLight` is
   ~0, the poster's `× tier / lum` multiplies zero by anything, and the belt measured
   **#000000**: the design doc's "he reads as a hole", live.

   The fix is the one the reference itself uses: **the shade tier is painted, not
   computed.** `tone()` takes the two tiers the client painted — the value where light
   reaches him and the value where it does not — and solves the albedo and the *emissive*
   that land them, against two measured rig gains (KEY_GAIN 0.594, HEMI_GAIN 0.108). The
   emissive is the pigment's own shade value, exactly as a cel painter mixes it; it lights
   nothing, blooms nothing, and takes no hue that is not the client's. It also compresses
   the range he has to survive from ~25 : 1 to ~3 : 1, which is why the olive lives through
   the drybrush now.

3. **The `unlit` half of each tier pair is what ~85 % of his pixels land on**, so it must
   carry the client's *dominant* value, not his shade. Cloth unlit 0.325 shows as sRGB
   0.320 — the base that is 47 % of the client's front figure and 75 % of his back. His
   darker tiers are not lost: the hemisphere alone spreads a vertical surface's value by
   ~4 tiers between an up-facing fold and a down-facing one (measured on this build: crown
   0.323, side 0.214, under-fold 0.158), so the client's 0.143 → 0.355 range arrives from
   the *form* instead of from a paint job.

**No hatching, by construction.** Cloth 1.45 rad (the reference's own vertical fold
strokes), skin 0.38, each ear *along its own blade* with the direction mirrored per side
(each ear is its own form), linen *across* the limb — and because a wrap is a separate
small form, that cross-limb family never meets the limb's own on one face. The authored
ear ticks run **along** the blade for the same reason. A 6× walk over the belt and forearm
(`study-A-it15-zoom6-belt-1350x896.jpg`) shows flat committed tiers with clean boundaries
and not one crossing stroke.

**The wear map is the lost-and-found map.** The drybrush is strongest where the reference
dropped its line (crown, shoulder tops, the ear's outer curve near the tip) and weakest
where it pressed it (the hood's lower edge, the jaw, the boot line). The rim shell carries
the same map inverted, so the two mechanisms tell one story. Rim weight is a *screen*
quantity — 1.0 % of the projected figure height, floor 1.0 px, ceiling 3.6 px — solved
per frame off the live camera (P4 as amended), with a baked default so a cloned figure
still carries its line.

---

## 4. What failed on the way, and what the failure taught

Sixteen build → render → look rounds. The screenshots in this folder are the progression.

| # | what the render showed | root cause | fix |
|---|---|---|---|
| 1 | a grey figure, near-black, staircased face window | see §3.2; a fixed angular grid cut the window boundary diagonally across quads | pin two grid columns to the window's edges per ring |
| 3–4 | everything 3–5 tiers too bright | `tone()` ran its pigment through the sRGB transfer twice — `convertLinearToSRGB()` then `getHex()`, which encodes again | explicit `s2l` / `l2s`, so the solve knows how many times a value has been encoded |
| 5–6 | **arms and boot toes solid black** | the lofted tubes' side quads were wound **inward** while their end caps were outward. That mesh is not consistently oriented, the signed-volume test has nothing meaningful to measure, and the ink shell offset along inward normals and drew *over* the fills. Measured: every sampled arm triangle wound inward, every trunk triangle outward | reverse the tube's quad circulation |
| 6 | a black smear down the face, under the chin, at the belt | a normal offset self-intersects in a valley, and a BackSide shell that folds through itself draws its far wall in front of the fill | kill the rim where the surface turns concave (also where the reference has no line) |
| 7 | the forehead terminator was a blocky staircase | a sine of even one ring's amplitude turns a ring-quantized boundary into a stair | level the terminator (one `yMid` per ring ⇒ exactly straight), and add the client's 0.416 *mid* tier as a third group so it is not a hard bar |
| 12 | **the `sheet` strip rendered with no contour at all** | the route's strip is three `Object3D.clone()`s and `clone()` does not carry `onBeforeRender`, so a cloned shell never gets solved and sits exactly on the fill | bake a default rim at build time |
| 13 | the arms vanished from the front when tucked, from the back when forward | the client's waist at 0.605 H is 50 px *including* them, yet they are plainly visible in every plate | hang them slightly forward of the hip — visible as a separate value from both sides |
| 14 | at scene scale, "a dark blob with a hint of yellow" | the face well was deep enough that the cowl's side wall ate the far eye at the hero's 43° stage | shallower well, prouder almonds, wider window |
| 15 | the three-quarter plate showed **one ear** | swept back, a blade sits at exactly the hood's own depth at 43° | sweep the ears slightly **forward** — which is also why the client's back plates measure narrower than his front ones |
| 15 | the pouch read as two mud smears from behind | it hung across the belt | move it below the belt, proud of the hip |

---

## 5. Where it is weakest — honestly

1. **The waist measures 0.330 of H against the client's 0.282.** The arms are the whole
   difference. The client draws them *inside* the tunic's outline and separates them by
   value alone; in 3D that only works if they hang in front of the hip, and hung far
   enough forward to read from behind they push the silhouette ~17 % wide at the waist.
   Every other landmark is within 0.025 of the plate. This is the one proportion I traded,
   and I traded it knowingly for silhouette mark #5 (the wraps) in the back views.

2. **The back of the hood is under-worked.** It carries one spine crease and a nape
   gather; the client's eight back plates carry more. It reads as a dome rather than as
   cloth. The paint side of the trilayer has no texture map, so at 6× the surfaces are
   flat committed tiers with nothing between them — correct for a cel character, but it
   means every bit of surface interest has to come from geometry, and the back has the
   least of it.

3. **The Prep rig is nearly identical to Performance.** That is structurally correct — he
   is `markAlive`, so `triC = max(curtain, seam) × (1 − alive)` is exactly 0 for him and
   his surfaces never switch to the underdrawing. The consequence is that his *authored
   graphite* never renders, so "one stroke family per form" is met by construction but is
   never actually seen. If the film ever wants his pencil, that is a rig conversation, not
   a sculpt one.

4. **I could not capture the 500 × 915 breakpoint.** The Chrome window is shared with a
   concurrent process that resized and re-focused it throughout; `resize_window` reported
   success but the viewport never changed, and several measurement passes had to be
   retried because the tab lost foreground mid-frame. `npm run check`'s G7 does solve that
   breakpoint analytically (60.5 px at HERO_GOB_SCALE 1.00×), but I did not see it.
   Every number above is from a foreground tab with the figure rendered.

5. **The near-black tiers are quantized, not lit.** Because the emissive floor sets the
   unlit value, a cast shadow on him cannot take a surface below its own painted shade
   tier. That is exactly what the reference does and it is why he can never read as a
   hole — but it also means a dramatic shadow *across* him will be flatter than one across
   the island.

6. **Two things the reference has that I only gesture at**: the hood's two lappets read as
   the cowl's sides rather than as separate hanging flaps with their own ends, and the ear
   ticks are three thin dashes where the client draws short bright strokes.

---

## 6. Files and state

- Only `src/film/stages/gobStudyA.ts` was written. `hero.ts`, `trilayer.ts`, `rigs.ts`,
  `world.ts`, `palette.ts`, `GobStudy.tsx` and the other sculptors' modules are untouched.
- `npm run build` green (`tsc --noEmit` + `vite build`).
- `npm run check` green — **31 gates, 31 passing, 0 regressions** (they gate `world.ts`'s
  shipped goblin, which this study does not touch).
- 19 screenshots in this folder, `study-A-*`, showing the progression and the final reads
  in both rigs at front / three-quarter / back / sheet / scene / 6× zoom.
