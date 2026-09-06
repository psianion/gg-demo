# Study B — the hooded goblin

`src/film/stages/gobStudyB.ts` · built 2026-09-04 against `docs/2026-09-03-goblin-reference.md`
and the three client sheets. The file that used to sit at this path was deleted, not revised.

---

## What was built

A **2.36-head hooded figure**, swept from the reference's own landmark table, in the film's
material language.

**The method: the drawing leads, the volume serves.** `GARMENT` is a table of
(height, front-view half-width) pairs read straight off §1.2 — crown 0.016, hood front hem 0.169,
head widest 0.2625, shoulder 0.161, waist 0.141, hem 0.1455, all as fractions of H. The figure is
then swept: at each height a closed superellipse section is generated whose **x-radius IS the
measured half-width** and whose z-radius is invented. The front silhouette is therefore the
client's drawing at every height by construction. Width is measured; depth is authored.

**One garment, one contour.** §4.1's "one piece with the tunic, no shoulder seam" is taken
literally: hood and tunic are a single swept surface from crown to hem, and the face opening is a
real oval **dish** pushed into its front with a steep rim. That rim is genuine overhanging
geometry, not a painted patch. Arms, legs and ears are rooted *inside* the mass they grow out of,
so no part carries a closed ring of its own; every fill is merged into one buffer and the ink line
is that buffer drawn back-faces-only, so the drawn contour is the union silhouette.

**Interior form is the same surface pushed.** `SWELLS` is a table of soft ellipsoidal
displacements along the section's own normal — the hood's crown bunch, the visor over the brow,
the back of the skull, the two lappets beside the face, the chest, the belly sagging over the
belt, two vertical creases in the skirt, a heavier hang on his left hip. No cheekbone is a second
object. He is not bilaterally identical: the asymmetry lives in the surface (bunch, folds, hem,
pouch), never in the proportions the gates measure, because §7.1 rules the C-curve and the 58/42
weight shift FILM-ONLY and all 23 standing plates are plumb.

**Lost-and-found line.** A per-vertex `rimW` carries §3.6's measured map — pressed at the hood's
lower edge, the jaw and the boots, dropped to 0.2 across the crown and on each ear's outer curve
near the tip. The offset is 1.0 % of figure height in world units, clamped in the vertex shader to
a floor and ceiling expressed as a **fraction of the frame** (1.0 px and 3.6 px of a 900-px frame),
which is §7.6 P4 as amended.

---

## The three things that were actually hard, and how they were solved

### 1. The quantizer had to be re-derived in the right colour space

§7.2 struck the doc's poster-10. The trilayer quantizes at gamma 2.2 and the canvas *then* encodes
sRGB, so the tier a bin puts **on the page** is `srgb(((k+0.5)/N)^2.2)`, not `(k+0.5)/N`. Solved
against all ten of §3's measured tiers over N = 8…44:

| | | | | | | | | | | |
|---|---|---|---|---|---|---|---|---|---|---|
| **N = 33** | 0.149 | 0.183 | 0.249 | 0.314 | 0.346 | 0.378 | 0.410 | 0.688 | 0.441 | 0.808 |
| **§3** | 0.143 | 0.188 | 0.249 | 0.320 | 0.355 | 0.372 | 0.416 | 0.688 | 0.448 | 0.814 |

Worst error 0.0086, mean 0.0051. N = 18 is the best fit in the quantizer's *own* space and is
0.068 out on the skin's lit tier once the sRGB encode is accounted for — the same linear-vs-encoded
mistake `trilayer.ts` documents twice in its own shader.

### 2. Edge wear was destroying his hue, and it is why the shipped figure reads as a black robot

The trilayer's drybrush is `mix(lit, PAPER, wearF · wear)` **in linear light**. Paper is 0.93
linear; his cloth, lit by fill alone, is 0.019. At the film's default wear (0.22) a fragment only
half-turned from the lens takes 3.9 % of paper — which *adds* 0.036 linear to a 0.019 signal,
nearly three times the surface's own colour. The poster then renormalises the luminance back onto
its tier, so the value looks right and **the hue is gone**. Measured live before the fix: cloak
`#272625`, forehead `#51504e`, boots `#4a4947` — every lit surface achromatic no matter what
albedo it carried. Setting the albedo to pure red and then to pure blue changed nothing.

The shipped OLD figure has the same disease: its cloak measures **`#1b1b1a`** against a `0x272E37`
albedo. The island never sees it because its surfaces are five to ten times lighter, where the same
paper fraction is a rounding error.

Fixed by a lighter hand on a dark garment: `WEAR = { cloth 0.03, skin 0.06, linen 0.10 }`, so the
paper term stays well under the surface's own value except in the last few degrees of the
silhouette, where it becomes the drybrush rim it is for.

### 3. He is backlit at the hero stage, and the reference's tiers had to survive it

Measured off a live frame: the key sits at (−4, 3.95, −4), the figure is staged facing +x, and
**`dot(his front, the key) = −0.563`**. His whole front is fill only, at 0.107 × albedo, and every
fragment of the garment lands in one bin near the quantizer's floor. That is a flat black robe.

Two knobs answer it, and both are solved rather than chosen:

- **`LIFT = 2.2`** — §3's hexes are what the client *painted*, not albedos. Each is lifted in
  linear by the measured inverse of the rig's fill response, hue exactly preserved, clamped so no
  channel clips.
- **`EMIT`, per family** — a painted figure does not go to black in shade, because the gouache sits
  on paper and the paper keeps showing through; a miniature painter basecoats for exactly this
  reason. `emitFor(albedo, targetPage)` solves each family's basecoat so its **fill-only** render
  lands on the value §3 measured for it. One formula, six answers. It lifts the shade end without
  lifting the key end by the same proportion — the one thing a brighter albedo cannot do — and it
  rides the paint side only, so the Prep rig is untouched.

---

## Measured, at 1440 × 951, view=front, Performance rig

| | measured | reference | |
|---|---|---|---|
| projected figure | 533.5 × 710.7 CSS px | | |
| **aspect** | **1.332** | §1.3: 1.32–1.38 · G1: 1.25–1.45 | pass |
| eye bright field | **`#fef15c` L 0.914** | §3.3 `#FEF15C` L 0.914 | exact |
| eye − brightest skin | **0.290** | §5 wants ≥ 0.23 | pass |
| eye − hood | **0.633** | §5 quotes 0.59 | pass |
| max r − b | 162 | §3.3: 166–178 | −4 |
| warm pixels (r − b ≥ 100) | 3.96 %, all inside the almonds | P3/P7 | pass |
| cloth plateaux | 0.04 / 0.10 / 0.24 / **0.28 (52.7 %)** / 0.31 | P2 wants ≥ 4 plateaux, range ≥ 0.196 | pass (5, range 0.27) |
| cloth dominant | 0.281 | §3.1 base 0.320 | −0.039 |
| skin | 0.593 / 0.624 | §3.2 lit 0.688 | −0.07 |
| belt | `#4d3d23` L 0.245, **r > g** | §3.4: 0.249, the one r > g family | pass |
| boots | L 0.285 | §3.4: 0.272 / 0.320 | pass |
| linen wrap | L 0.515 | §3.4: 0.448 / 0.814 | between tiers |
| cost | **15 606 tris · 16 draw calls · 14 materials** | | |
| scene view, 1440 × 900 | figure 63.1 × 118.2 CSS px | OLD: 77.6 × 124.1 | |
| scene view, 500 × 915 | figure 32.1 × 60.9 CSS px | G7 wants ≥ 52 | pass |

No page errors in any view. 6× zoom: **no crossing strokes** (P10), tiers read as committed
plateaux with hard boundaries, contour is one clean weight.

---

## The progression (17 plates in this folder)

`study-B-i04` first build that read as the character at all (colour still wrong) ·
`i05` face enlarged, overcorrected to a lumpy potato · `i06` pulled back ·
`i08` eye depth derived from the skull instead of a constant · `i09` ears as leaves ·
`i10` ear taper to a point, aspect back inside G1 · `i11` crescent lifted clear of the field dome ·
`i12`/`i13` back view, before and after crown creases + full hood hem + a pouch that projects ·
`i14`/`i15` three-quarter, before and after the eyes were put on the skull's normal ·
`i16` sheet · `i17` shipped scene · `i18` Prep rig · `i19` 6× · `i20` final front ·
`i21` phone breakpoint.

---

## What failed, and what is weakest

**Failed and was fixed — worth recording because each cost a pass:**

- The face never emerged from the dish: the head sat *behind* the hood's dish floor and the window
  rendered as a black hole with two eyes in it.
- The eye's shade crescent and pupil were placed at fixed depths and vanished **inside** the bright
  field's own dome; later they z-fought it and only an antialiased sliver survived.
- Only one eye had a crescent — the left eye's strip is generated by a mirrored parametrisation, so
  its triangles wind the other way and `FrontSide` culled it.
- The ear blades were built with `limb()`'s two radii **swapped**, so the leaf stood edge-on to the
  lens and rendered as two thin crescents; the ear ticks then ran across the blade's 0.02 thickness
  and shot out past the silhouette as pale sparks.
- The eyes were pushed along +z and broke out through the cheek at the three-quarter.

**Weakest, honestly:**

1. **The eyes do not carry at the phone breakpoint.** At 60.9 CSS px in the shipped scene the hood
   dome and the two ear blades hold (§2's marks 1 and 2), but mark 3 does not — the face is turned
   ~45° from the lens and the skin at 0.62 is too close to the eye at 0.91 once downsampled. §1's
   "a dark shape with bright eyes at 36 px" is not achieved. The lever is the skin's basecoat, not
   the eye's.
2. **§8.4's hood-shadow terminator does not exist.** The overhang is real geometry and deep enough,
   but at the hero azimuth the key is *behind* him (NdotL −0.563), so nothing casts onto the face
   and the reference's terminator across the top third of the eyes cannot be produced by lighting
   here. It will appear the moment a stage puts a warm source in front of him — which is the
   client's own activity plates. Not faked with paint.
3. **The cloth's dominant tier is 0.281 against §3.1's 0.320**, and the skin is 0.07 under its lit
   tier. Both are one basecoat step away; they were left where they are because raising them
   further starts flattening the Lambert variation the poster needs to make tiers out of.
4. **The back view measures 1.334 aspect against the reference's 1.53–1.59.** The client's back
   plates foreshorten the ears more than a rigid figure can — a pure Y-rake foreshortens the front
   and the back equally, so the two numbers cannot both be hit by one ear angle.
5. **Tier boundaries are visibly polygonal at 6×** on the small limbs even after raising their
   segment counts, and the tunic's fold swells barely read at ship size.
6. **No skeleton.** Parts are separate named meshes in one local space, which is what a joint
   hierarchy needs, but nothing is skinned. Form was this round's job.

---

## Ownership

Only `src/film/stages/gobStudyB.ts` was written. `hero.ts`, `trilayer.ts`, `rigs.ts`, `world.ts`,
`palette.ts`, `GobStudy.tsx` and the other sculptors' modules are untouched.

A throwaway framebuffer probe was served from `public/gobStudyB-probe.js` during the walk so pixel
values could be read back off real frames rather than eyeballed; it has been deleted.

**Note on the environment:** the dev server named in the brief (PID 17556) was already dead and
port 5180 was free when this round started, so a new one was started in the same directory with the
same command. It was restarted once more mid-round after its file watcher stopped firing and it
began serving a stale transform of this module — which had silently invalidated several
measurements taken before that point; those were re-taken.
