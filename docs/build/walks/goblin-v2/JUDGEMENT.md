# Judgement — goblin v2, study A vs study B

2026-09-04 · judged live at http://localhost:5180 against `docs/reference/goblin-body.png`,
`goblin-faces.png`, `goblin-actions.png` and `docs/2026-09-03-goblin-reference.md`.
Every screenshot cited below is my own, taken this session, and lives in this folder.

**Verdict: study A wins. It is him. It is not yet alive.**

---

## 0. How the numbers were got, and three process facts

**Instrument.** All colour and profile numbers are read back with `gl.readPixels` from the study's
own drawing buffer via `window.__studyScene.gl`, then **composited over paper `#F7F5F0`** (the hero
canvas is transparent-backed, so a raw readback is premultiplied over black — an uncomposited read
reports 86 % of the frame at luma 0 and is worthless). Luma is sRGB-encoded on the composited
bytes, the same convention `2026-09-03-goblin-reference.md` uses, so every number here is directly
comparable to the doc's. Silhouette mask = alpha > 140 and composited luma < 210 (the second term
drops the soft contact ellipse). Profile fractions are of the figure's own crown→sole height.

**Process fact 1 — the breakpoint.** Chrome on this machine will not give a viewport narrower than
657 CSS px. The 500×915 reads were produced by sizing the study's own lens container to 500×915
inside a 657-wide window and letting R3F re-solve the camera; **both** studies were measured that
way and both re-solved correctly (the island sits fully inside the frame in
`judge-A-scene-perf-500x915.jpg` and `judge-B-scene-perf-500x915.jpg`). That is a change in how the
breakpoint was reached and every 500×915 number below comes from it.

**Process fact 2 — study A's evidence is not on disk.** A's report claims "19 screenshots +
STUDY-A.md in docs/build/walks/goblin-v2/". This folder contains exactly one A screenshot
(`study-A-i01-front-1920x889.jpg`) and no `STUDY-A.md`. B's `STUDY-B.md` and 18 B frames are
present. Nothing in this judgement rests on either sculptor's images — I re-shot everything.

**Process fact 3 — the server.** The dev server named in the brief (PID 17556) is dead. Port 5180
is served by PID 26288. I did not start, restart or kill anything.

**Console:** zero page errors on every load, both studies, both rigs. One pre-existing warning,
`THREE.Clock: deprecated`.

**`npm run build`** green (tsc --noEmit + vite build, 1.28 s). **`npm run check`** green — 31 gates,
31 passing, 0 regressions. Note that `check` gates the **shipped** `world.ts` goblin, not either
study: its G7 reports 83.8 px at 500×915 for the OLD figure, where the studies project 60.2 (A) and
60.9 (B) at the same breakpoint.

---

## 1. IS IT HIM?

### Study A — yes, at a glance and under measurement

Put `judge-A-front-perf-1440x900.jpg` beside `goblin-body.png` frame 1 and the character is
immediately the same character: dome hood, two blades out of the sides, two big yellow eyes low in
the head, olive cloth, belt, forearm and shin linen, dark boots, on a soft ellipse.

**Silhouette profile, client's landmark first, A second (fraction of H, from the crown)** — from
`judge-A-front-perf-1440x900.jpg`:

| landmark | ref | A | |
|---|---|---|---|
| 0.040 hood | 0.249 | **0.246** | ✓ |
| 0.062 hood front hem | 0.339 | **0.328** | ✓ |
| 0.203 ear tips | 0.757 | **0.745** | ✓ and it is the widest row (f 0.206) |
| 0.36–0.44 head width | 0.525 | **0.513–0.515** | ✓ |
| 0.48 hood bottom | 0.435 | **0.420** | ✓ |
| 0.52 shoulder | 0.322 | **0.325** | ✓ |
| 0.605 waist | 0.282 | **0.329** | **✗ +17 %** |
| 0.712 hands | 0.362 | **0.361** | ✓ exact |
| 0.82 hem / legs | 0.288 | **0.197** | **✗ −32 %** — the hem is at f 0.767, 0.05 H too high |
| 0.89 boots | 0.226–0.277 | **0.208** | slightly narrow |

Aspect **1.337** against the client's 1.32–1.38. G1 passes. Ear tips at f 0.206 / 0.205, 0.001
apart, inside the 0.17–0.24 band — G2 passes. Head : widest body below the shoulder = **1.41**
against the inverted G3's ≥ 1.30 — passes. Ear projection past the hood 0.116 H per side against
the reference's 0.116 H — exact.

**Colour, sampled point by point off the framebuffer** (`judge-A-front-perf-1440x900.jpg`), client
value first:

| | ref | A |
|---|---|---|
| cloak base | `#4F5442` 0.320 | `#505445` **0.322** — largest plateau, 29.7 % of the figure |
| shaded forehead | `#60623C` 0.372 | `#60623C` **0.372** — the reference hex, exactly |
| skin mid / terminator | 0.416 | **0.427** |
| lit face | `#ABB772` 0.688 | `#A9B470` **0.677** |
| ear | `#A0AB67` 0.642 | `#9DA765` **0.628** |
| linen wrap lit | `#D2D0C4` 0.814 | `#D6D4C8` **0.831** |
| boots | `#565338` 0.320 | `#57543B` **0.320** — exact |
| belt (r > g, the one warm family) | `#4E3E24` 0.249 | `#42341E` **0.21** |
| contour | `#1A1B10` 0.102 | `#1A1B10` **0.102** — exact |
| eye bright field | `#FEF15C` 0.914 | **0.914** — exact |

**This is the client's palette, landed.** Thirteen plateaux at ≥ 1 % of figure area spanning
0.102 → 0.914; P2's amended ≥ 50/255 and ≥ 4 plateaux clear several times over.

**Where A drifts off the reference** (`judge-A-head-zoom-1440x900.png`):

1. **The eyes are round, not almonds.** Measured 84 × 89 px → aspect **1.06**; reference 22×30 and
   25×31 → **1.24–1.36**. Width is right (0.242 head widths vs 0.24–0.27); **height is 22 % short**
   (0.311 of HU vs 0.40) and all of the error is at the **top** edge: A's eye top sits at f 0.211
   against the reference's f 0.170, while the eye bottom (f 0.341 vs 0.339) is exact.
2. **The forehead has eaten that 0.041 H.** A's visible forehead runs 0.067 → 0.211 = **0.144 H**
   against the reference's 0.062 → 0.170 = **0.108 H**. He reads high-browed.
3. **The pupils are far too big and in the wrong quadrant.** The reference pupil is 0.19–0.21 W ×
   0.23 H of the almond, in the **inner-lower** quadrant. A's read about **0.45 W**, round, and sit
   **outer**-lower. That is what makes him look vacant rather than curious.
4. **The hood interior is not a cave.** Sampled immediately inside the face opening, left and right:
   `#505445` **0.322** — identical to the outer hood. The reference paints it `#303127` **0.188**,
   its darkest cloth. Result: the face aperture reads ~0.72 of head width where the reference's is
   ~0.57 (93 px head, 53 px window).
5. **No lappets.** §4.1's two hanging flaps beside the face with their own ends at jaw level are not
   built; the hood's sides serve instead.
6. **The brows are wrong and they change the character.** Two long down-angled strokes across the
   forehead. He scowls. The reference brows are short thin strokes inside the shaded forehead and
   he is neutral-to-gentle in all 15 face plates.
7. **The throat tab is a dark bar with three regular pale ticks** under the mouth, at skin value.
   The reference has a small **pale-green vertical patch**, ~0.11 head widths.
8. **The crown creases are a straight dark band with regular vertical ticks** — a hat brim, not
   §4.1's 2–3 short crease strokes.
9. **The ear blades are flat leaves.** Right length and right projection, but no thickness at the
   root and no upward curl (reference: outer edge 14–34° off vertical near the tip, "a shallow
   banana"). The ear ticks are three thin dashes, dimmer than the eye's 0.914; the reference's are
   the figure's **brightest** marks at 0.938.
10. **Back-view aspect 1.343** (`judge-A-back-perf-1440x900.jpg`) against the client's **1.53–1.59**.

The hood shadow is real: the terminator crosses the eyes at **0.17 of eye height** below the eye
top — inside the reference's "upper third". That is the single hardest thing in §8.4 and A has it.

### Study B — recognisably the same species, but not this character

`judge-B-front-perf-1440x900.jpg` beside `goblin-body.png`: the hood, the ears, the cloth, the
belt, the wraps and the boots are all present and the aspect is right (**1.331**), so the outline
passes. The **face** does not.

| landmark | ref | B | |
|---|---|---|---|
| 0.203 ear tips | 0.757 | 0.748 | ✓ widest row |
| 0.36–0.44 head width | 0.525 | 0.519 | ✓ |
| 0.52 shoulder | 0.322 | 0.319 | ✓ |
| **0.605 waist** | **0.282** | **0.425** | **✗ +51 %** |
| **0.712 hands** | **0.362** | **0.440** | **✗ +22 %** |
| 0.82 hem | 0.288 | 0.244 | ✗ |

**G3 fails: head : widest body below the shoulder = 1.17**, against the amended gate's ≥ 1.30.
B's body is a straight-sided barrel with the arms welded to it; the head is not decisively the
widest element, which is §1.1's "whole read".

**The eyes are the failure** (`judge-B-head-zoom-1440x900.png`):

| | ref | B |
|---|---|---|
| eye width / head width | 0.24–0.27 | **0.144** (−45 %) |
| eye aspect h : w | 1.24–1.36 | **2.06–2.10** (+58 %) — vertical slots |
| gap between the eyes | **0.42** eye-widths | **2.02** eye-widths (4.8×) |
| pair span, centre-to-centre / head width | ~0.36 | 0.433 (+20 %) |
| pupil / almond width | 0.19–0.21 | 0.33–0.36 (+70 %) |
| shade crescent `#95853A` | present in all 15 plates | **absent** |
| hood-shadow terminator across the eyes | required (§8.4) | **absent** |

Narrow, tall, and set 4.8× too far apart, with no crescent and no terminator: this is an owl, not
the client's goblin. §5's "the eye aperture is the whole signal" cannot be built on this shape.

**Colour is systematically dark and the face has no tiers.** Cloak base **0.282** vs 0.320; lit skin
**0.624** vs 0.688; linen **0.749**, sitting between the reference's 0.448 and 0.814 rather than on
either. Worse, the face's three top values are **0.592 / 0.596 / 0.624** — three adjacent bins
0.032 apart. That is a **smooth ramp being quantized**, not §3.2's three committed tiers
(0.372 / 0.416 / 0.688). B has **no skin shade tier at all**.

Other drifts: a forehead swell that reads as a bruise and a central swell that reads as a snout; a
black triangular flick for a mouth; no nose; no throat tab; four asymmetric diagonal scratches for
crown creases; back aspect **1.336** vs 1.53–1.59.

---

## 2. IS IT ALIVE, OR IS IT PARTS?

**Neither is alive yet. Both are better than OLD by an enormous margin** — put
`judge-OLD-front-perf-1440x900.jpg` beside either: OLD measures aspect **3.036**, head width
0.329 H, eyes at f **0.518** (halfway down the figure), dominant plateau **0.133**, and it carries a
spike ear and a pencil. It is not this character at all.

### A — one skin, but no weight

The single continuous trunk is real and it shows. Crown → hood → shoulder → tunic → hem is one
unbroken run with **no join the eye can find**, in front, three-quarter and back
(`judge-A-front-perf-1440x900.jpg`, `judge-A-three-perf-1440x900.jpg`,
`judge-A-back-perf-1440x900.jpg`). The arms come out from under the hood's lower edge without a
seam. That is the thing the client asked for and A delivered it.

Where the eye **does** catch a join:

- **The far ear in three-quarter.** `judge-A-three-perf-1440x900.jpg`: it lies flat on the dome as a
  leaf-shaped decal with a hard outline where it meets the hood. No root, no thickness, no fold of
  cloth around it. This is the clearest pasted-on moment on the figure.
- **The eye caps at three-quarter** read as two flat discs on the front of the face.
- **The dark bar with three pale ticks** under the mouth reads as an applied plate.
- **The crown crease band** reads as a hat brim.

Where the silhouette has **no rhythm**: everything below the shoulder. The arms bulge symmetrically
into the waist (0.329 vs 0.282), both boots are planted level, the hem is level, the tunic has no
hang and no drape, and there is no hip. Nothing carries weight. He stands like a figurine, not like
a small person standing.

**The back is the weakest picture.** `judge-A-back-perf-1440x900.jpg` is a featureless dome with one
spine crease, a belt, a brown splat for a pouch, and two flat leaves. The client drew this view
**18 times out of 38**. It would not be one of them.

### B — a lid on a jar

`judge-B-front-perf-1440x900.jpg`, `judge-B-back-perf-1440x900.jpg`: a **dead-straight black
horizontal line runs across the full width of the figure at the base of the hood**, in every view.
It cuts him into a head unit and a body unit. That is precisely the read the client rejected.

Second join: the face is a pale mass sitting in a dark socket, and the boundary between hood
interior and face is a soft airbrushed gradient with no fold and no line — so the face reads as a
**mask dropped into a hole** rather than as a face inside a hood.

Third: in `judge-B-three-perf-1440x900.jpg` the near ear has **almost disappeared** — a ~15 px sliver
at the frame's left edge — while the far ear is a flat leaf. B's ears are a pair from dead front and
dead back only; from the film's own 43° hero angle he is a cyclops.

Silhouette rhythm is worse than A's: no waist at all, arms welded to the barrel, mittens for hands,
both level.

**Plainly: B still reads as parts.** A reads as one object that has not yet been given weight.

---

## 3. DOES IT BELONG IN THIS WORLD?

**Committed tiers, both.** At 6× neither shows a smooth ramp on the cloth:
`judge-A-front-zoom6-perf-1440x900.jpg` and `judge-B-front-zoom6-perf-1440x900.jpg` are flat
committed plateaux with hard boundaries. A has 13 plateaux ≥ 1 % of figure area, B has 12.
**But B's face is a ramp** (0.592 / 0.596 / 0.624 in adjacent bins) where A's is three separated
tiers (0.372 / 0.427 / 0.677).

**Stroke family: neither shows one, and that is structurally correct, not a choice.** The trilayer's
authored stroke tiles live on the **underdrawing**; the paint side gets poster + wear + paper tooth.
Both studies are `markAlive`, so `triC = max(curtain, seam) × (1 − alive) = 0` and neither ever
switches to the underdrawing. Their Prep and Performance frames are **pixel-identical** —
`judge-A-front-prep-1440x900.jpg` vs `judge-A-front-perf-1440x900.jpg`,
`judge-B-front-prep-1440x900.jpg` vs `judge-B-front-perf-1440x900.jpg`,
and the same for both sheets. Whatever graphite either sculptor authored, the film never renders it.
**That is a rig conversation, not a sculpt one, and it applies to both equally.**

**Edge wear — this is where they separate.** `judge-A-scene-zoom6-perf-1440x900.jpg`: A's contour
breaks into a **beaded chain of dashes** along the belt, the hem and the boots — the same drawn,
broken rim the island itself uses on its mound and its board edges in the same frame. A sits *in*
the picture. `judge-B-scene-zoom6-perf-1440x900.jpg`: B's contour is a **smooth continuous solid
black line** that never breaks; it reads as vector art laid over the render. B's only visible wear
is a blown-out pale halo under the boots (`judge-B-sheet-prep-1440x900.jpg`).

**Next to the island** (`judge-A-scene-perf-1440x900.jpg`, `judge-B-scene-perf-1440x900.jpg`): both
sit at the right value and neither is a hole — a real improvement on OLD, whose cloak measures
0.133. Both are **plainer than the island**: nothing lives between their tier boundaries, and the
boundaries themselves are visibly polygonal at 6× (B's arm-wrap edge, A's tunic edge). The island
carries authored marks across its whole surface; neither goblin carries any.

**No crossing strokes anywhere, either study, either rig, any magnification.** See §6.

---

## 4. DO THE EYES CARRY?

Measured at the phone breakpoint, like for like — both studies staged identically, both framings
re-solved, buffer 500×915:

| | A | B |
|---|---|---|
| figure | **32.3 × 60.2** CSS px | **32.1 × 60.9** CSS px |
| pixels with r − b ≥ 100 | **19** | **4** |
| their bounding box | 5 × 11 px | 5 × 9 px |
| brightest eye pixel | **0.914** | **0.798** |
| figure's own dark median | 0.376 | 0.441 |
| value jump, eye → body | **0.54** | 0.36, on four pixels |

`judge-A-scene-perf-500x915.jpg` — **A's eyes carry.** A clear lemon mark on a dark dome; §1's
"a dark shape with bright eyes" is achieved.

`judge-B-scene-perf-500x915.jpg` — **B's eyes do not carry.** Four pixels at 0.798, which is *below*
the reference's own linen wrap (0.814). At the smallest size in the frame B is a dark dome with two
ears and nothing else. §2 mark 3 is gone. This is B's own stated weakest point and it measures worse
than B reported: 0.798, not 0.914, at the breakpoint.

---

## 5. MEASURED

| | study A | study B | OLD |
|---|---|---|---|
| front plate 1440×900, `__study()` | 500.5 × 668 | 504.9 × 672.6 | 286.8 × 625.6 |
| front, probe (incl. ink shell) | 504 × 674 | 507 × 675 | 223 × 677 |
| **front aspect** | **1.337** | **1.331** | 3.036 |
| three-quarter 1440×900 | 326.8 × 625.1 | 330 × 629.4 | — |
| back 1440×900 | 490.3 × 658.4 (**1.343**) | 488.6 × 651.6 (**1.334**) | — |
| sheet 1440×900 (per figure) | 300.8 × 402.9 | 291.3 × 389.1 | 242.1 × 511.4 |
| **scene 1440×900** | **61.7 × 117.4** | **63.2 × 118.2** | — |
| **scene 500×915** | **32.3 × 60.2** | **32.1 × 60.9** | — |
| **triangles** | **30 134** | **15 606** | 7 080 |
| **draw calls** | **27** | **16** | 64 |
| **materials** | **24** | **14** | 42 |
| **fps, scene 1440×900** | **60.4** | **60.3** | — |
| whole scene with him in it | 296 calls / 76 540 tris | 266 / 58 514 | 192 / 22 950 |
| his share of scene triangles | **39 %** | **27 %** | 31 % |
| his share of scene draw calls | 9 % | 6 % | 33 % |

Both hold 60 fps. A costs 1.93× B's triangles and 1.69× its draw calls for a figure that is 39 % of
the frame's triangle budget. That is affordable at this scene size but it is the one place B is
plainly better engineering, and it is worth watching when the film's later beats add geometry.

---

## 6. HARD GATE — crossing strokes

**Both pass. Zero crossing strokes, anywhere, at any magnification, in either rig.**

Checked at 6× on the cloth, belt, forearm wrap and hem
(`judge-A-front-zoom6-perf-1440x900.jpg`, `judge-A-front-zoom6-prep-1440x900.jpg`,
`judge-B-front-zoom6-perf-1440x900.jpg`, `judge-B-front-zoom6-prep-1440x900.jpg`) and on the whole
figure beside the island (`judge-A-scene-zoom6-perf-1440x900.jpg`,
`judge-B-scene-zoom6-perf-1440x900.jpg`). Neither figure's paint side carries any stroke texture at
all, so there is nothing that could cross. The only authored marks on either are single-direction:
A's crown ticks, ear ticks, brows, wrap edges; B's crown scratches and ear ticks. None cross.

The three pale ticks on A's throat bar and the three on each ear blade are parallel within their own
form and do not meet another family. Passing, but they are the only marks on either figure that
would need watching if more were added.

---

## 7. RANK

**1. Study A. 2. Study B. Both far ahead of OLD.**

A wins on the two things that decide it:

- **It is him.** A's colour is the client's palette *measured and landed* — cloak base 0.322 vs
  0.320, shaded forehead the exact reference hex, contour exact, boots exact, eye field exact. Eight
  of ten silhouette landmarks are within 0.025 H of the plate. B is 0.038–0.065 dark on every colour
  family, has no skin shade tier, fails G3 at 1.17, misses the waist by 51 %, and its eyes are the
  wrong shape, 45 % too narrow and set 4.8× too far apart.
- **The eyes carry.** 19 px at 0.914 against 4 px at 0.798. §2's mark 3 is the character and only A
  keeps it at the size the film will mostly show him at.

A also has the thing §8.4 says must not be faked — a real hood overhang throwing a real terminator
across the top of the eyes — and a contour that breaks the way the island's does.

B is better engineered (half the triangles, 60 % of the draw calls) and its front outline below the
head is smoother. Neither buys back a face that is not the client's face.

---

## 8. WHAT THE WINNER STILL NEEDS — the only fix round

Ordered by how much of the client's "that's him" each one buys. Items 1–7 are the ones that decide
whether he is approved; 8–15 are what separates approved from finished.

1. **Grow each eye almond upward.** Move the eye **top** from f 0.211 to the reference's **f 0.170**
   and leave the bottom at f 0.339. That takes height from 0.311 of HU to **0.40**, aspect from 1.06
   to **~1.30**, and shortens the over-tall forehead from 0.144 H to the reference's **0.108 H** in
   the same edit. Do not touch the width (0.242 head widths, correct) or the centre-to-centre span
   (0.363, correct).
2. **Shrink the pupil and move it inboard.** To **0.20 W × 0.23 H of the almond** (it currently reads
   ~0.45 W), placed in the **inner-lower quadrant** — about 7/22 of the eye width toward the nose and
   5/30 down from the eye's centre — with one 1-px lighter notch as the only catchlight.
3. **Put the eye's shade crescent on the same line as the skin terminator.** The crescent must end
   where the hood shadow ends, so shadow reads as **one diagonal** crossing skin and eye together.
   Today the crescent is a separate painted shape and the skin terminator is a flat horizontal band;
   they meet at the eye top and disagree, which is the most-looked-at place on the character.
4. **Darken the hood interior to `#303127` (0.188).** It measures `#505445` **0.322** — identical to
   the outer hood. There is no cave, so the face aperture reads ~0.72 of head width instead of the
   reference's ~0.57. This is the cheapest single change with the biggest effect on the head read.
5. **Replace the brows.** Two short thin strokes drawn *inside* the shaded forehead, not the current
   long down-angled pair. He scowls; the reference never does.
6. **Build the two hood lappets** — real flaps beside the face, hanging to jaw level, with their own
   ends (§4.1). This is what makes the head mass 93 px wide while the face window is 53 px, and it is
   what stops the hood reading as a helmet.
7. **Replace the throat bar** with the reference's small **pale-green vertical patch**, ~0.11 head
   widths, between the hood's two front edges. Delete the three regular pale ticks on it.
8. **Take the waist in to ≤ 0.30 H** (currently 0.329, reference 0.282). Bring the arms against the
   hip. Do not move the hands — 0.361 vs 0.362 is exact and must stay exact.
9. **Lower the tunic hem from f 0.767 to f 0.82.** A's f 0.82 row measures 0.197 H against the
   reference's 0.288: the tunic is 0.05 H short and the legs read that much long.
10. **Give the ear blade thickness at the root and the reference's upward curl** (outer edge 14–34°
    off vertical near the tip — "a shallow banana, not a spike"), and fold the hood's edge around the
    root. At three-quarter the far ear is currently a decal on the dome; this is the one place on A
    that still reads as a part.
11. **Author the back.** `judge-A-back-perf-1440x900.jpg` is a dome with one crease. Add the nape
    gather where the hood meets the shoulders, make the hood's bottom edge a **fold** rather than a
    value change, and shape the belt pouch into an object instead of a brown splat. The client drew
    this view 18 times out of 38 and it must read as a picture on its own.
12. **Replace the crown crease band.** The straight dark band with regular vertical ticks reads as a
    hat brim. Use 2–3 short irregular crease strokes near the crown (§4.1).
13. **Give the rest pose some weight.** Both boots level, hem level, arms mirrored: nothing carries
    weight. Keep the reference's even-weighted stance, but let one hip take a slightly heavier hang
    of cloth and let the hem fall unevenly, so the silhouette below the shoulder has a rhythm.
14. **Raise the ear ticks to 0.938** — the reference's brightest marks, brighter than the eyes. A's
    are currently thin dashes below 0.914.
15. **Angle the ear blades slightly forward** so they foreshorten from behind. Back-view aspect is
    **1.343** against the client's **1.53–1.59**, and a pure sideways blade cannot hit both the front
    0.745 H width and the narrower back read.

**Not on this list, deliberately, and it will therefore ship as it is:** his authored graphite never
renders, because `markAlive` holds `triC` at 0 and his Prep frame is pixel-identical to his
Performance frame. That is true of the island's alive entities too and it is a rig decision, not a
sculpt one. If the film wants his pencil, raise it there.
