# The cast — the film's human figures, measured

2026-09-05 · **This document is the cast's definition**, in the manner of
`docs/2026-09-03-goblin-reference.md`. It exists because the cast has failed the same human
gate three times across two agents with the same verdict each round — *"the cast still read as
three chess pawns. Each figure is a tapered column with a ball on top and a horizontal disc —
the textbook pawn. The value ladder did change and is now genuinely three values, but nothing
in the silhouette moved."*

The goblin came right the day his prose became numbers. Bible row 9 is still prose: *"a wedge on
a column"*, *"exactly ONE silhouette attribute"*, *"no hands, no feet, no face in the
silhouette"*. It contains **not one measured number about the human body.** This is that pass.

**Where row 9, R16, R17 or any prior decision disagrees with a measurement below, the
measurement wins.** §8 lists every place they are contradicted, with the ruling.

---

## 0. How the numbers were got

Three independent methods, all reproducible without touching source:

1. **Analytic.** `src/film/mock/clothKit.ts`'s `DRAPE` table, `radiusAt()` and `drapeGeom()`'s
   perturbation `f(φ, y, seed)` re-implemented verbatim in a throwaway Node script. Every
   world-unit figure in §2 and §3 comes from that, and anyone can re-derive it by reading the
   file. The film's six live seeds are `3, 8, 13` (ambush, `i*5+3`) and `18, 23, 28` (tavern).
2. **Projected.** The shipped page at `localhost:5180`, timeline scrubbed **forward from t=0 in
   0.5 s steps** (a jump-seek gives a different pose — measured, 6 % different at t6), then every
   triangle **edge** of every `adventurer:*` mesh projected through the live camera and walked at
   1-px steps into a per-scanline min/max buffer. Vertex-only projection under-samples a
   26-segment lathe and produces a jagged, false profile; edge-walking gives the true silhouette.
   **Measurement viewport: CSS 1488 × 674, dpr 1.25, fov 42 (`fitFov` clamps at `REF_FOV` for any
   aspect ≥ 16:9), pullback 1.000.** Projected sizes scale linearly with CSS viewport *height*
   only, so **× 1.602 converts every pixel figure below to a 1080-tall viewport.**
3. **Photometric.** Frames saved to `docs/build/walks/world/castref-*.jpg` and re-measured
   offline with `System.Drawing` — mode of a sampled region, never an eyedropper guess, the
   goblin reference's own convention. Luma is quoted **sRGB-encoded**
   (0.2126 R + 0.7152 G + 0.0722 B on the stored bytes). A live framebuffer `readPixels` of the
   same regions agreed with the saved frames to within 0.004 of mean L.

**Two traps that have already produced wrong numbers in this project, recorded so nobody repeats
them.** (a) `App.tsx` mounts **two** canvases — the film's (`<Canvas><Film/></Canvas>`, first in
DOM) and the Cover's (`<Hero film />`, later in DOM, painting *over* the film at scroll 0). A
screenshot at scroll 0 shows the Cover while the film canvas underneath is at whatever `t` you
set; read `document.querySelector('canvas')` (the first) or hide the second.
(b) A scan window sized from the figure's **full** bounding box lands on the table, the bench or
the wall, because the box is set by the hat brim and the lower body is occluded. The first pass
of this document reported the tavern **table** (mean L 0.535, range 8/255) as the drained figure.
Every photometric number below states its pixel rectangle in a named saved frame.

**Frames:**
`docs/build/walks/world/castref-s1-t6-trio.jpg` ·
`castref-s1-t6-trio-zoom.png` ·
`castref-s5-t38-tavern.jpg` ·
`castref-s5-t44-drained.jpg`

---

## 1. THE FOUR-NUMBER CONTRADICTION, RESOLVED

Row 9 and R16 state four relations:

> a human at **1.24 u** · the goblin at **60 %** of a human · his head **2.4×** a human head

and `2026-09-03-goblin-reference.md` §1.1 measures him at **2.36 head-units**.

### 1.1 The derivation is correct, and it produces a fashion plate

    human head       = (goblin head) / 2.4
                     = (goblin height / 2.36) / 2.4
                     = (0.60 × 1.24 / 2.36) / 2.4 = 0.1314 u
    human head-units = 1.24 / 0.1314 = 9.44

**Verified.** Nine-and-a-half heads. Standard figure canon is 7–8; heroic drawing uses 8;
fashion illustration stops at 9. A 9.44-head figure *is* a tapered column with a small ball on
top. The derivation stands.

### 1.2 But it was never built, so it is not the defect

Measured on the shipped `buildFigure()`:

| | shipped | where |
|---|---|---|
| total height, sole to hood crown | **1.2523 u** | `DRAPE` tops at 1.105; hood sphere r 0.098 × 0.86 at y 1.168 |
| head unit, crown → chin | 0.1744 u | |
| head unit, bare face sphere | 0.1643 u | `SphereGeometry(0.079)`, y-scale 1.04 |
| **head-unit count** | **7.18 – 7.62** | in canon |

The shipped cast is a **7.2–7.6-head figure.** The 9.44 contradiction is real *in the document*
and has never reached the geometry. **Fixing the arithmetic will not move the silhouette one
pixel.** Anyone who "fixes the proportions" and re-submits will fail a fourth time.

### 1.3 Which of the four numbers is wrong: the 60 %

R16, verbatim: *"`buildAdventurer` stands 0.95 u; **the goblin stands 0.75** — 79 %… Decided:
the cast scales ×1.30 — a human at 1.24 u, the goblin at 60 % of a human."*
0.75 / 1.24 = 0.605. **That is where 60 % comes from, and it describes a goblin that no longer
exists.** `src/film/stages/goblin.ts:124` reads `const H = 0.9;` and `world.goblin.root.scale`
is 1.000 — measured in the running film. The goblin rebuild took him from 0.75 u to 0.900 u and
row 9's ratio was never re-derived.

Hold the three numbers that are still true — his 0.900 u, his 2.36 HU, and the 2.4× head
relation — and everything closes:

    goblin head unit  = 0.424 × 0.900   = 0.38160 u   (goblin-reference §1.1)
    human head unit   = 0.38160 / 2.4   = 0.15900 u
    human head-units  = 1.240 / 0.15900 = 7.799  →  7.80
    goblin : human    = 0.900 / 1.240   = 0.7257 →  72.6 %

**RULING. `60 %` is STRUCK and replaced by `72.6 %`.** The evidence is a source constant anyone
can read (`goblin.ts:124`) against a superseded one quoted in R16's own sentence. Note the
direction: this makes the goblin **larger** beside the cast and the cast's job **harder**, not
easier. `1.24 u`, `2.4×` and `2.36 HU` all **SURVIVE**, and they land the human on **7.80 head
units** — inside the 7.5–8 band where a drawn human reads as human, without a single number
being chosen for convenience.

---

## 2. THE DIAGNOSIS — why it reads as a pawn, measured

### 2.1 Where the cast actually is

The brief named four beats. Two of them do not exist:

| named | what is actually there |
|---|---|
| S1 t6, the ambush trio | **exists** — three figures, 165–256 px tall. The film's biggest cast read. |
| S5 t44, seated patrons | **exists, but nothing is seated.** `buildTavern` stands `dm`, `player1`, `player2` at `y = 0` on the standing drape. At t44 the lens is 1.5 u from the die and **only the DM is in frame, cropped 95 px above the top of the screen.** The readable tavern cast beat is **t38**. |
| S6 t55.6, the NPC | **does not exist.** Scene-book S6-B5 specs an "NPC based miniature (**N**)"; `sets/montage.ts` contains no figure, no base disc and no `buildAdventurer` call. Nothing to measure. |
| S7, the party | **does not exist on screen.** `world.party === world.adventurers === ambush.adventurers`; the camp group is gated off after S2 and no adventurer mesh is visible at any t ≥ 50. |

Scanned every second of the 66-second timeline: **the cast is on screen for t5–t13 and t38–t46,
and nowhere else.** Nine `buildAdventurer` instances, six live groups, two beats.

### 2.2 Projected size, per beat

CSS 1488 × 674; multiply by **1.602** for a 1080-tall viewport.

| beat | figure | attribute | px/u | figure px H | px W | H : W | head px | widest px @ fraction from crown |
|---|---|---|---|---|---|---|---|---|
| t5 | f0 | sword | 42.2 | **53** | 19.9 | 2.67 | 6 × 7 | 19.3 @ 0.21 (shoulder) |
| t5 | f1 | shield | 41.1 | **52** | 19.6 | 2.66 | 6 × 7 | 18.7 @ 0.21 |
| t5 | f2 | brim | 45.6 | **60** | 24.0 | 2.50 | 7 × 8 | 24.0 @ **0.10 (the hat brim)** |
| **t6** | **f0** | sword | 149.7 | **188** | 71.5 | 2.63 | 24 × 23 | 65.5 @ 0.21 |
| **t6** | **f1** | shield | 130.6 | **165** | 60.5 | 2.73 | 19 × 20 | 58.1 @ 0.20 |
| **t6** | **f2** | brim | 195.3 | **256** | 98.0 | 2.61 | 28 × 30 | 97.8 @ **0.09 (the brim)** |
| t10–13 | f0 | sword | 46.4 | **59** | 29.7 | 1.99 | 9 × 7 | 26.3 @ 0.22 |
| **t38** | DM ×1.3 | brim | 97.1 | **174** | 72.5 | 2.40 | 21 × 22 | 72.5 @ **0.10 (the brim)** |
| **t38** | player1 | brim | 169.7 | **242** | 107.1 | 2.26 | 31 × 30 | 105.5 @ **0.09 (the brim)** |
| **t38** | player2 | brim | 169.7 | **241** | 106.6 | 2.26 | 31 × 30 | 105.5 @ **0.09 (the brim)** |
| t44 | DM ×1.3 | brim | 168.3 | **376** built, **289** in frame | 171.5 | 2.19 | 49 × 55 | 171.0 @ 0.12 |

### 2.3 What the silhouette actually consists of

Six masses and five marks, and that is all:

| # | mass | geometry |
|---|---|---|
| 1 | the drape | `LatheGeometry(DRAPE, 26)` perturbed by `f(φ, y, seed)` — **one surface of revolution** |
| 2 | the face | `SphereGeometry(0.079)` scaled `[1, 1.04, 0.94]` — **a sphere** |
| 3 | the hood shell | `SphereGeometry(0.098, φ 0…0.86π)` scaled `[1, 0.86, 0.98]` — **a sphere** |
| 4 | the nape | `SphereGeometry(0.072)` scaled `[1.25, 0.72, 0.90]` — **a sphere** |
| 5 | the attribute | brim `Cylinder(0.265, 0.272, 0.028, 20)` — **a horizontal disc**; or shield `Cylinder(0.185, 0.185, 0.034, 18)` — a disc; or a 0.042 × 0.60 blade |
| 6 | one arm stub | only on the sword and shield figures; **the brim figure has no arm at all** |

| # | mark | weight |
|---|---|---|
| 1 | one contour up the **screen-left** silhouette, across the shoulder, and 0.06 u down the right | `'form'` 2.1 px |
| 2–3 | exactly two near-vertical fold lines | `'form'` |
| 4 | one jaw arc on the head | `'form'` |
| 5 | one boot separation line across the hem | `'form'` |

### 2.4 The pawn signature, tested part by part

The brief proposes three tests. **Two of them the figure passes — it is not guilty on those —
and one is guilty beyond argument.** Stating that honestly matters, because two rounds have
already been spent on the wrong half.

#### (a) Continuous taper from foot to shoulder — GUILTY, and total

Each silhouette edge sampled at 400 heights over `y = 0 … 1.048`, box-smoothed over 5 samples,
local extrema kept only if their prominence exceeds a threshold:

| prominence floor | 0.015 u (= 2 px at the 133 px/u figure floor) | 0.004 u (= 1 px at the largest trio framing) |
|---|---|---|
| turning points per edge, all 12 edges (6 figures × L/R) | **2** | **2** |

Every edge, every seed, every threshold: **exactly two turning points** — one minimum at
`y = 0.715–0.718` (the waist) and one maximum at `y = 0.990` (the shoulder). Between them the
curve is strictly monotone: **zero** rises in the 145-sample taper span, **zero** falls in the
flare span. Sole 0.198 → waist 0.163 (−17.7 %) → shoulder 0.236 (+44.8 %) → neck 0.058.

**A chess pawn has exactly two turning points. So does every figure in this film.** A drawn
standing human has at least five (ankle, calf, hip, the arm's departure and return, shoulder).

#### (b) The head narrower than the shoulders by a large factor — NOT GUILTY. Strike this test.

| | shipped | a drawn human at 7.8 heads |
|---|---|---|
| bare head width : shoulder width | 0.1580 / 0.4720 = **0.335** | 0.1145 / 0.3339 = **0.343** |
| hood mass width : shoulder width | 0.1960 / 0.4720 = **0.415** | ≈ 0.45 |

**Within 2–8 % of correct.** This criterion does not discriminate and must be replaced (G-A2).

#### (c) Radial symmetry about the vertical axis — GUILTY, and subtle enough that it survived a "fix"

`drapeGeom`'s doc-comment claims the fix: *"THREE harmonics at UNEQUAL amplitude with a
per-figure phase, so no fold repeats and the plan has no symmetry axis at all… This is what
actually kills the pawn: a pawn is radially symmetric and a person is not."*

In **plan** that is true. Max/min radius over azimuth, measured:

| height y | seed 3 | seed 8 | seed 13 |
|---|---|---|---|
| 0.000 (hem) | 1.492 | 1.422 | 1.360 |
| 0.400 | 1.367 | 1.308 | 1.289 |
| 0.720 (waist) | 1.250 | 1.212 | 1.220 |
| 0.985 (shoulder) | 1.180 | 1.164 | 1.184 |

In **silhouette** it is worth nothing, because **a silhouette samples exactly two azimuths.**
Fit the best single scalar `k` to each edge and compare it against the *unperturbed* lathe
profile:

| edge | k | max deviation | mean deviation | max, px @ 210 px/u | @ 136 px/u |
|---|---|---|---|---|---|
| seed 3 L / R | 1.006 / 1.025 | 0.0067 / 0.0009 u | 0.0029 / 0.0004 | 1.42 / **0.18** | 0.92 / 0.12 |
| seed 8 L / R | 0.992 / 0.976 | 0.0169 / 0.0109 u | 0.0074 / 0.0047 | 3.55 / 2.28 | 2.30 / 1.48 |
| seed 13 L / R | 0.961 / 1.070 | **0.0003** / 0.0063 u | 0.0001 / 0.0027 | **0.06** / 1.32 | 0.04 / 0.86 |
| seed 18 L / R | 0.993 / 0.977 | 0.0080 / 0.0139 u | 0.0035 / 0.0061 | 1.68 / 2.92 | 1.09 / 1.89 |
| seed 23 L / R | 1.105 / 0.924 | 0.0052 / **0.0005** u | 0.0023 / 0.0002 | 1.10 / **0.10** | 0.71 / 0.06 |
| seed 28 L / R | 0.970 / 1.002 | 0.0027 / 0.0027 u | 0.0012 / 0.0012 | 0.56 / 0.57 | 0.36 / 0.37 |

**Every silhouette edge in the film is a uniformly scaled copy of the same lathe profile, to
within 0.06–3.55 px** — a mean of 0.02–1.5 px. As a fraction of the figure's own projected
width, the residual is **0.04 %–3.9 %.** The sculpt happens entirely on the azimuths the lens
never sees.

Three arithmetic reasons it cannot do otherwise:

- `amp = 0.16 · clamp(1.1 − y/0.94, 0.1, 1)` **collapses exactly where the read lives.** At the
  shoulder `amp = 0.016`, i.e. `amp·r = 0.0038 u` = **0.79 px** at the largest trio framing —
  a quarter of the §3.7 stroke floor. It crosses 2 px only below `y = 0.55`.

  | y | 0.000 | 0.200 | 0.400 | 0.580 | 0.720 | 0.840 | 0.930 | 0.985 |
  |---|---|---|---|---|---|---|---|---|
  | `amp·r`, px @ 210 px/u | 6.65 | 5.60 | 4.03 | 2.73 | 1.83 | 1.25 | 0.79 | **0.79** |

- the one term that *is* constant with height, `0.08·cos(φ)`, is a **lateral shear**: it widens
  screen-right by 8 % and narrows screen-left by 8 % at every height. That is a lean, not a
  shape. It cannot create a turning point.
- the depth term `d = DEPTH·(0.9 + 0.28(0.5 − 0.5 cos φ))` moves **z only**. Invisible in
  silhouette by construction.

#### (d) The mark that carries the read draws the un-sculpted pawn

`clothKit.ts:402–408` builds the contour from `radiusAt(y)` — the **raw profile table**, with
±1.5 % hand jitter — while the mass is `radiusAt(y) · f(φ, y, seed)`. The graphite line and the
painted mass therefore disagree by up to 3.55 px, and the line always describes the perfectly
radial form. **The strongest mark on the figure is a drawing of a lathe.**

#### (e) The horizontal disc the verifier named is the hat, and it is the film's default

`RAISED = ['sword','shield','brim']`, `SEATED = ['brim','brim','brim']`, assigned by a global
`castSeq++`. **All three tavern figures wear the brim; so does one of the three ambush figures.**
The brim is `Cylinder(0.265, 0.272, 0.028)` — **0.530 u across on a 1.2523-u figure (42 % of the
figure's height), 0.028 u thick (2.2 %), aspect 19 : 1, dead horizontal, radially symmetric,
sitting directly above a sphere.** Row 9's own instruction *"the brim must CLEAR THE SHOULDERS
(0.236) or it is not a silhouette at all"* makes it the **widest element of the whole figure**,
so it is the dominant silhouette event.

Read the width profile of a tavern figure from the crown down (t38, player1, px):

    0.05 = 56.9      a ball
    0.10 = 104.6     a HORIZONTAL DISC, and the figure's widest point
    0.15 = 27.1      a neck stalk — 26 % of the disc
    0.20 = 21.9      still the stalk
    0.25 = 89.3      the shoulder flare
    0.30 = 78.3  →  0.50 = 62.1     one smooth taper
    0.60 = 64.2  →  0.98 = 66.9     one smooth base flare

**Ball · disc · stalk · tapered column · base ring.** That is not *like* a chess pawn; it is the
parts list of one, in order. See `castref-s5-t38-tavern.jpg` and `castref-s1-t6-trio-zoom.png`.

#### (f) No leg notch, no foot, no base break

The drape is a closed surface of revolution to `y = 0`; every scanline of the bottom 12 % is
**one span**, 0.396 u wide, meeting the ground as an unbroken slab. The goblin reference §2 names
the boot notch (0.84–0.92 H) as silhouette mark #4 — *"which is what says a person, standing"* —
and the cast has no version of it. Its only substitute is one 2.1-px drawn line at `y ≈ 0.10`.

#### (g) The head is three spheres, and it is round

Face, hood shell and nape are all spheres of revolution. Outline deviation from an ellipse:
**zero, by construction.** And the head is round, not egg-shaped:
**width : height = 0.1580 / 0.1643 = 0.963.** Measured on screen at t6/t38/t44:
24×23, 19×20, 28×30, 21×22, 31×30, 49×55 → **mean 0.965.** A drawn human head is ≈ 0.72 : 1.
This is the one proportion that is genuinely wrong, it is small in world units (0.043 u), and it
is the pawn's ball.

### 2.5 The verdict, in one line

The cast is not a pawn because its proportions are wrong. **It is a pawn because its silhouette
has two turning points, is mirror-symmetric to within 4 % of its own width, is drawn from an
unperturbed profile function, is capped by a horizontal disc on 4 of 6 figures, has a round head,
and meets the ground as an unbroken slab.** Every one of those is a structure fact, and every one
of them is measurable.

---

## 3. THE PROPORTION SHEET

**HU = 0.15900 u**, derived in §1.3 from the goblin's fixed numbers. **The figure is 7.80 HU.**
Fractions are of total height **H = 1.2402 u**, measured **from the crown downward**.

### 3.1 Vertical landmarks

| HU from crown | fraction of H | landmark |
|---|---|---|
| 0.00 | 0.000 | crown |
| 1.00 | 0.128 | **chin** — the head unit |
| 1.30 | 0.167 | pit of the neck |
| **1.50** | **0.192** | **the shoulder line** (acromion) |
| 2.00 | 0.256 | chest |
| 3.00 | 0.385 | elbow / navel |
| 3.80 | 0.487 | wrist / hip (great trochanter) |
| 3.90 | 0.500 | crotch — half the figure, the canon's own check |
| 5.75 | 0.737 | knee |
| **7.20** | **0.923** | **the hem** — below this the silhouette must break |
| 7.55 | 0.968 | ankle |
| 7.80 | 1.000 | sole |

### 3.2 Widths

| | HU | world u | note |
|---|---|---|---|
| head height (crown → chin) | 1.00 | **0.1590** | |
| **head width** | **0.72** | **0.1145** | taller than wide — the exact inversion of the goblin's 1.24 : 1 |
| neck | 0.42 | 0.0668 | |
| **shoulder, body** | **2.00** | **0.3180** | 25.6 % of stature; real biacromial : stature is 0.235 |
| chest | 1.55 | 0.2465 | |
| waist, body | 1.20 | 0.1908 | |
| hip | 1.45 | 0.2306 | |
| **drape at the shoulder (1.50 HU)** | **2.10** | **0.3339** | cloth adds 0.05 HU per side |
| **drape at the waist (3.00 HU)** | **1.75** | **0.2783** | cloth does not pinch to the body's 1.20 |
| **drape at the hem (7.20 HU)** | **2.35** | **0.3737** | the widest element below the shoulder |
| figure aspect, H : widest | | **3.32 : 1** | |

### 3.3 The goblin's relation to all of it — he is fixed, the cast is derived

| | goblin (fixed) | human (derived) | ratio |
|---|---|---|---|
| total height | **0.900 u** | 1.2402 u | **0.726** |
| head unit | 0.3816 u | 0.1590 u | **2.400** |
| head units in the figure | **2.36** | **7.80** | 0.303 |
| head **width** | 0.4729 u | 0.1145 u | **4.13** |
| head W : H | **1.24** (wider than tall) | **0.72** (taller than wide) | **1.72** |
| shoulder | 0.2898 u | 0.3339 u (drape) | 0.868 |
| full width | 0.6814 u (ear tip to tip) | 0.3737 u (hem) | **1.82** |
| **figure aspect H : W** | **1.32 : 1** | **3.32 : 1** | **2.51** |

**Two numbers carry the species read at any size: the head aspect inverts (1.24 vs 0.72) and the
figure aspect differs by 2.5×.** He is a wide low thing at 73 % of their height, twice as wide as
they are, with a head four times as wide as theirs. They are tall narrow things. Neither of those
survives if the human's head stays round and its shoulder stays 0.472 u wide.

### 3.4 Shipped against derived — the whole delta

| | shipped | derived | Δ |
|---|---|---|---|
| total height | 1.2523 u | 1.2402 u | −1.0 % |
| head unit | 0.1643 u (bare) | 0.1590 u | −3.2 % |
| head-unit count | 7.62 | 7.80 | +2.4 % |
| **head width** | 0.1580 u | **0.1145 u** | **−27.5 %** |
| **head W : H** | 0.963 | **0.720** | **−25 %** |
| **shoulder width (drape)** | 0.4720 u | **0.3339 u** | **−29.3 %** |
| waist (drape) | 0.3260 u | 0.2783 u | −14.6 % |
| hem (drape) | 0.3960 u | 0.3737 u | −5.6 % |
| **figure aspect** | **2.65 : 1** | **3.32 : 1** | **+25 %** |

Three numbers move by more than 15 %. **None of them is the head-unit count.**

---

## 4. THE SCREEN-SPACE CONTRACT (§3.7–3.8, re-derived for the cast)

`pencil.ts:30` — `hero 3.4`, `form 2.1`, `faint 1.1` **CSS px, fixed.** §3.8's law: a mark under
about **2 px** is a grey ghost under `alphaToCoverage`.

### 4.1 What a mark costs, per beat

At 1488 × 674 CSS. `HU px = px/u × 0.159`. The **smallest usable feature** is the world size that
projects to 2.0 px.

| beat | figure px H | px/u | **HU px** | smallest usable feature | 2.1-px contour as % of H |
|---|---|---|---|---|---|
| t5 f0 / f1 | 53 / 52 | 42.2 / 41.1 | **6.7 / 6.5** | 0.047 u = **0.30 HU** | **3.96 / 4.04 %** |
| t5 f2 | 60 | 45.6 | 7.3 | 0.044 u = 0.28 HU | 3.50 % |
| t6 f1 | 165 | 130.6 | 20.8 | 0.015 u = 0.096 HU | **1.27 %** |
| t6 f0 | 188 | 149.7 | 23.8 | 0.013 u = 0.084 HU | **1.12 %** |
| t6 f2 | 256 | 195.3 | 31.1 | 0.010 u = 0.064 HU | **0.82 %** |
| t10–13 f0 | 59 | 46.4 | 7.4 | 0.043 u = 0.27 HU | 3.56 % |
| t38 DM | 174 | 97.1 | 15.4 | 0.021 u = 0.13 HU | **1.21 %** |
| t38 players | 242 / 241 | 169.7 | 27.0 | 0.012 u = 0.074 HU | **0.87 %** |
| t44 DM | 376 (289 in frame) | 168.3 | 26.8 | 0.012 u = 0.075 HU | **0.56 %** |

### 4.2 The contour weight is out of band across the whole film

The goblin reference §3.6 measured his contour at **0.6–1.1 % of figure height** — the only
measured contour standard this project owns. The cast's fixed 2.1 px lands at **0.56 % to
4.04 %: a 7.2 : 1 spread.**

That is the same failure §3.7 records for the goblin's pre-fix shell — *"a world-unit shell gave
a 6.3 : 1 weight spread across breakpoints"* — with the sign reversed. A screen-fixed stroke on a
figure whose projection varies 7 : 1 between beats is the same defect as a world-fixed stroke on
a lens that moves. **The instrument already exists:** `GOB_RIM_PX / (pxPerUnit · rootScale)`.

**Derived rule.** `castContourPx = clamp(0.0085 × projectedFigureHeightPx, 1.6, 3.4)`.

| figure px | contour px | % of H | |
|---|---|---|---|
| 165 | 1.6 (floor) | 0.97 % | ✓ |
| 256 | 2.18 | 0.85 % | ✓ |
| 376 | 3.20 | 0.85 % | ✓ |
| 53 | 1.6 (floor) | **3.02 %** | ✗ |

**The honest consequence, stated rather than hidden:** with a 1.6-px `alphaToCoverage` floor the
0.6–1.1 % band is **unreachable below 145 projected px**, and unreachable below **191 px** at the
shipped 2.1 px. The film stages the cast at **52–60 px (t5)** and **59 px (t10–13)** — 2.5× to
3.6× over the band. Either the cast is never staged below ~150 px, or those two beats must
declare, in writing, that the figure there is a **value mass with no contour** (which is what the
goblin reference's own §2 "what drops first when he gets small" contemplates). **It must be an
authored decision. It is currently an accident.**

### 4.3 The one silhouette attribute, in pixels

Row 9's *"exactly ONE silhouette attribute, never two"* is only a rule once its budget is known.
World sizes: brim 0.530 u wide; shield 0.370 u diameter; blade 0.600 × 0.042 u.

| beat | brim | shield | blade (length × width) |
|---|---|---|---|
| t5 | 22 px (**42 % of H**) | 15 px (29 %) | 25 × **1.8 px** |
| t6 f0 / f1 / f2 | 103 px | 48 px | 90 × **6.3 px** |
| t10–13 | 25 px | 17 px | 28 × **1.9 px** |
| t38 DM / players | 51 / 90 px | — | — |
| t44 DM | 89 px | — | — |

**Derived rule (from §3.8's dab arithmetic).** A silhouette attribute must project **≥ 12 % of
the figure's height in its longest dimension** and **≥ 2.5 px in the narrowest dimension that
carries its read.**

- brim and shield: **pass at every beat.**
- **the blade fails at t5 and t10–13 (1.8 / 1.9 px)** — under the ghost floor. Its two bracketing
  `'form'` contours at 2.1 px are, at that size, the entire attribute; the 0.042-u steel fill
  contributes nothing. That is survivable *because the marks carry it*, but it means the sword
  figure at t5 is **two parallel lines**, and it must be authored as such rather than assumed to
  be a sword.

---

## 5. WHAT MAKES A DRAWN HUMAN READ AS HUMAN

Row 9 names three. A pawn satisfies all three: it has a horizontal shoulder run, one unbroken
vertical drape, and a single crowning attribute. The additions below are chosen for exactly one
reason — **they break the two things that make a pawn a pawn: the two-turning-point outline and
the mirror symmetry.** Every one is measurable in the projected image.

| | requirement | measured as |
|---|---|---|
| **H1** | **The shoulder line survives** (row 9, kept) — a run of the outline within 12° of horizontal for ≥ 1.2 HU of width | but it must be **cornered at both ends**: the outline's direction changes by **≥ 55° within 0.15 HU** at each end of the run. A pawn's collar rounds off; a shoulder has a point. |
| **H2** | **The arm break — one side only.** One arm leaves the drape's outline between 1.6 and 4.0 HU from the crown and returns to it | maximum outward displacement **≥ 0.25 HU**; it adds **≥ 2 turning points to that edge and 0 to the other.** The cheapest single item that breaks *both* pawn properties at once. |
| **H3** | **The hem break.** In the bottom 0.9 HU the silhouette either splits into **two spans** or shows one re-entrant notch | notch depth **≥ 0.18 HU**, present over **≥ 0.35 HU** of height. The goblin reference's own mark #4. |
| **H4** | **Contrapposto — the figure is not plumb** | the line through the head's centre and the hem's midpoint is **≥ 4° off vertical**, and the head's centre is **≥ 0.30 HU** laterally off the hem's centre. The goblin reference rules *his* rest pose plumb (§7.1); the cast must not be, because a row of plumb figures is a row of chess pieces. |
| **H5** | **Neither edge is a scaled copy of the other** | best-fit-scalar residual **≥ 8 % of the figure's projected width**, and **≥ 1 band of ≥ 8 % of the figure's height where the two edges' slopes have opposite sign.** Currently 0.04–3.9 % and never. |
| **H6** | **The head is an egg, not a ball**, and carries exactly one mass that breaks its own outline | head **W : H = 0.72 ± 0.06**; the breaking mass (hair fall, hood point, brim, collar) projects **≥ 0.15 HU** beyond the ellipse. This is the number that separates species at 25 px of head. |
| **H7** | **The drawn contour is the rendered silhouette** | the contour polyline and the rendered silhouette agree to **≤ 1.5 px** at every beat. Today the contour is built from `radiusAt()` and the mass from `radiusAt() · f(φ,y,seed)`; they disagree by up to 3.55 px and the line always draws the pawn. |
| **H8** | **One silhouette attribute, and it fits its pixel budget** (§4.3) | ≥ 12 % of figure height long, ≥ 2.5 px in its narrowest read-carrying dimension. |
| **H9** | **No feature below the beat's own 2-px floor** (§4.1) | at t5 that forbids anything under **0.30 HU**: no eyes, no mouth, no hands, no belt, no boot gap. R17 already says this for eyes; it applies to everything. |
| **H10** | **The garment separates from what is behind it** | \|mean L(figure) − mean L(background)\| **≥ 0.12** (goblin reference P1-amended). Measured at t6: the pale figure sits at **0.483** against a sky at **0.477** — **Δ 0.006, twenty times under.** R4's ruling (*"the answer was never the colour — it was the SLOT"*) has not been executed for `cloakRoad`. |

---

## 6. WHAT THE CAST MUST NOT BECOME

Row 9's **G6** is binding: *"no cast member is ever `markAlive`d, so the painted state must lose
nothing structural when it drains — silhouette plus one value step carry the whole read."*

### 6.1 The painted state, measured

Torso rectangles in the saved frames; mode of the region; sRGB-encoded L.

| beat | figure | garment | rect | mean L | range | dominant value | second |
|---|---|---|---|---|---|---|---|
| t6 | f0 | `cloakRoad` t1 | (320,610,40×100) | **0.483** | 67/255 | 0.44 · 59 % | 0.56 · 24 % |
| t6 | f1 | `cloakOiled` t3 | (935,600,35×90) | **0.275** | 56/255 | 0.30 · 53 % | 0.28 · 22 % |
| t6 | f2 | `cloakUmber` t4 | (640,620,55×100) | **0.171** | 46/255 | 0.16 · 68 % | 0.18 · 26 % |
| t38 | DM | `cloakRoad` t1 | (740,285,40×45) | 0.508 | 116/255 | 0.56 · 31 % | 0.44 · 19 % |
| t38 | player1 | `cloakOiled` t3 | (385,440,60×100) | 0.323 | 61/255 | 0.30 · 67 % | 0.44 · 11 % |
| t38 | player2 | `cloakUmber` t4 | (1065,440,60×100) | 0.184 | 49/255 | 0.16 · 60 % | 0.18 · 16 % |

**The value ladder works** — 0.483 / 0.275 / 0.171, gaps of 0.208 and 0.104, both above C5's
0.098 floor. The verifier was right that this changed, and right that it is not enough.
**The tone within each garment does not work.** One value holds **53–68 % of the torso's area**
and the range is **46–67/255** against goblin-reference **P2-amended's ≥ 50/255 across ≥ 4
plateaux**. `cloakUmber` fails the range outright at both beats (46 and 49). Every figure is a
two-value form.

### 6.2 The drained state, measured — and it is not a silver statue, it is a hole

`castref-s5-t44-drained.jpg`, t44, `__curtain.value = 1`, the DM's garment, rect (880,30,100×160):

| | |
|---|---|
| **mean encoded L** | **0.8312** |
| dominant mode | **0.96 — 39.1 % of the patch** |
| all of 0.88–0.98 together | **65.3 % of the patch** |
| pure-torso band (890,60,80×20) | mean **0.9235**, mode 0.96 at **52 %** |
| paper | **0.961** |
| live `readPixels` of the same band | mean 0.9195, mode 0.96 at 61.1 % — agrees to 0.004 |

**Two thirds of the drained figure is within 0.03 of the page.** The previous round's "three
silver statues" measured 0.709; this is 0.83–0.92. The figure has drained past grey and onto the
paper itself. It is not a statue — it is an absence with three lines on it.

### 6.3 The bound, and why the mean alone can never be it

Note the trap: 0.961 − 0.831 = **0.130**, so the drained DM **passes** a ≥ 0.12 mean-separation
gate while being invisible. A gate on the mean is a gate that cannot see this defect.

**THE DRAINED BOUND — all six, at the beat where the figure is largest, in the drained state:**

1. **Area near paper.** Fraction of the figure's own pixels with `L > paper − 0.05` (> 0.911)
   must be **≤ 10 %.** Measured: **65.3 %.**
2. **Area near ink.** Fraction with `L < ink + 0.05` (< 0.183) must be **≤ 12 %** — the same test
   for the opposite failure, so a fix in one direction cannot create the other.
3. **Mean.** Mean encoded L of the garment mass in **[0.30, 0.72]**. Measured: **0.831.** (The
   old 0.709 sits *inside* this band, which is why clauses 1 and 4 exist.)
4. **Structure across the form.** At **≥ 5 heights** spread over the middle 60 % of the figure's
   height: range **≥ 50/255** and **≥ 4 plateaux** of **≥ 4 px** each, with **no single value
   holding more than 45 %** of the scan.
5. **Nothing structural is lost.** plateaux(curtain 1) **≥ 0.75 ×** plateaux(curtain 0) at the
   same rows, **and** the count of `'form'` marks crossing the torso band is **identical** in both
   states (`instanceCount` unchanged).
6. **Separation.** \|mean L(figure) − mean L(background directly behind it)\| **≥ 0.12** in both
   curtain states.

**How each of these cannot pass vacuously.** The measured data in §6.2 contains the vacuous pass
in the flesh: scan rows placed with a 16 % inset of the figure's *full* bounding box — a box set
by the hat brim — reported *range 145–211/255 across 2–3 plateaux* on rows where **77 to 113 of
158 samples were background.** The 211/255 was paper minus one contour pixel, on a surface with
nothing drawn on it. So:

- every scan reports its **paper-pixel count and ink-pixel count**; a scan with **> 5 %** of
  either is **discarded and re-run further inset**;
- a scan that cannot be placed inside the form at all is a **FAIL**, never a skip;
- the inset is computed from the **garment class's own** bounding box, not the figure's, so the
  brim cannot set it;
- rows are rejected where the figure is **occluded** (the tavern table hides the lower body: the
  first pass of this document reported the table, mean 0.535 / range 8-of-255, as the figure).
  Occlusion is detected by comparing the rendered span width against the projected garment span
  width at that row; a mismatch over 15 % rejects the row.

---

## 7. THE GATES

Machine-checkable, each with a number, a method and its own anti-vacuity clause. **G-A is the
anti-pawn gate and the cast must FAIL every part of the pawn signature.**

### G-A · ANTI-PAWN (the cast must fail all three)

| | test | pawn signature (what the cast must NOT be) | required |
|---|---|---|---|
| **A1** | **turning points.** Sample each silhouette edge at 200 heights over the projected figure; box-smooth over 5; count local extrema whose prominence exceeds `max(2.0 px, 1.5 % of projected H)` | **≤ 2 per edge.** Measured today: exactly **2**, on all 12 edges, at every threshold | **≥ 4 on one edge and ≥ 3 on the other** |
| **A2** | **mirror.** Fit the axis, then the best scalar `k` minimising ‖R(y) − k·L(y)‖; report the residual as a fraction of projected width | **≤ 2 %** (a lathe). Measured today: **0.04–3.9 %** | **≥ 8 %**, plus ≥ 1 band of ≥ 8 % of height where the edges' slopes have opposite sign |
| **A3** | **base.** The bottom 12 % of the projected figure | **one span, monotone flare to the sole.** Measured today: exactly that | **≥ 2 spans on ≥ 1 row**, or a re-entrant notch ≥ 0.18 HU deep |

**Vacuous pass and its prevention.** A1 passes vacuously if the edge is sampled from the profile
*function* rather than the rendered image — which is precisely how the shipped contour is
authored (§2.4d) — so A1 reads the **rendered silhouette mask**, and asserts that ≥ 150 of its
200 rows are non-empty and that its measured maximum width matches the projected garment box to
within 5 %; an empty or single-row mask **errors**, it does not pass. A2 passes vacuously on a
figure that is merely leaning or merely scaled — the axis fit removes the lean and the `k` fit
removes the scale, so only genuine shape difference survives; it runs on the **garment and face
classes only**, asserting those meshes cover ≥ 80 % of the figure's rows, so an attribute cannot
supply the asymmetry. A3 passes vacuously on a contact pool or a cast shadow creating a spurious
span — it reads only the figure's own class meshes.

### G-B · The head is not a ball

Head mass projected alone; outline fitted to an ellipse. Required: **max deviation ≥ 6 % of head
width**, from a mass present at **every yaw the film stages this figure at** (t6 alone stages
1.27, 1.57 and 1.82 rad). Head **W : H = 0.72 ± 0.06** (today: 0.963 ± 0.03).
*Vacuous pass:* an ellipse fitted to three points, or a feature that exists at only one yaw. The
gate requires ≥ 40 boundary samples, prints the count, and repeats the test at each staged yaw.

### G-C · One silhouette attribute, in its pixel budget

Exactly one of `sword | shield | brim` per figure (assert two are **absent**, not that one is
present). It projects **≥ 12 % of the figure's height** in its longest dimension and **≥ 2.5 px**
in its narrowest read-carrying dimension, **at every beat where the figure is on screen.**
Today: the blade is **1.8 px at t5** and **1.9 px at t10–13** — FAIL.
*Vacuous pass:* measuring the attribute's world size instead of its projection. The gate runs
per-beat off the live camera and lists the beats it checked; zero measured beats is a failure.

### G-D · Contour weight as a fraction of figure height

`contourPx / projectedFigureHeightPx` in **[0.006, 0.011]** at every beat where the figure
exceeds 150 px, and the film must declare in writing every beat where it does not.
Today: **0.0056 to 0.0404**, a 7.2 : 1 spread — FAIL at t5, t10–13 and t44.
*Vacuous pass:* zero samples — §10's own recorded failure mode. Zero measured beats is a failure.

### G-E · The drawn line is the rendered edge

Contour polyline against rendered silhouette: **≤ 1.5 px** at every beat.
Today: up to **3.55 px**, and always on the un-sculpted side — FAIL.
*Vacuous pass:* comparing the polyline against the profile function it was generated from. The
gate compares against the **rasterised mask**.

### G-F · Proportion

Against §3.2, per figure, in world units: total height **1.240 ± 0.02 u**; head unit
**0.1590 ± 0.005**; head-unit count **7.80 ± 0.25**; head W : H **0.72 ± 0.06**; drape at the
shoulder **0.3339 ± 0.02**; figure aspect **3.32 ± 0.25 : 1**; and `goblinHeight / humanHeight`
**0.726 ± 0.01**.
*Vacuous pass:* reading the constants out of the file instead of measuring the built geometry.
The gate measures the **merged BufferGeometry's** bounding box per class.

### G-G · The drained bound

All six clauses of §6.3, with §6.3's scan-placement rules. Today: clauses 1, 3 and 4 FAIL.

### G-H · No hatching

`buildFigure` emits 5 marks: one contour, two fold lines, one jaw arc, one hem line. The two fold
lines sit at `hx = −0.058` and `+0.075` with a ±0.018 bow: minimum separation **0.097 u**, so they
can never cross — verified analytically. `buildAdventurer` calls **no** `contact()` (the note at
`sets/kit.ts:31` is stale; the call is gone). `contact()` — nine strokes internally at
`pencil.ts:493` — is still live in `ambush.ts:51,93`, `tavern.ts:241,454`, `montage.ts:47`,
`pathProps.ts:129,287,359`, i.e. **in the sets the cast stands on**, though not on the cast.
*Outside this document's remit; recorded because it is on screen in `castref-s1-t6-trio.jpg`.*
*Vacuous pass:* grepping for `hatch(` passes if the hatching is inline or inside a helper. The
gate renders the figure at 6× and counts stroke crossings **in the image**, and greps `contact(`
as well.

### G-I · Census

The cast is on screen at **t5–t13** and **t38–t46** only. The gate asserts the set of beats where
an `adventurer:*` mesh is both visible and in frame, and fails if that set changes without this
document changing with it. It also records that **S6-B5's NPC miniature and S7's party do not
exist**, so nobody measures them again.

---

## 8. WHAT THIS OVERRIDES

Codes: **STRUCK** · **AMENDED** · **SURVIVES**.

| source | claim | ruling |
|---|---|---|
| row 9 / R16 | "the goblin at **60 %** of a human" | **STRUCK → 72.6 %.** R16 computed it from a 0.75-u goblin; `goblin.ts:124` is `H = 0.9`. §1.3. |
| row 9 / R16 | human at 1.24 u · head 2.4× · goblin 2.36 HU | **ALL THREE SURVIVE.** With 72.6 % they close on **7.80 head units.** |
| row 9 | "A human reads by three marks the goblin does not have: the shoulder line, one unbroken vertical drape, one silhouette attribute" | **SURVIVES, and is insufficient** — a chess pawn satisfies all three. §5 adds H1–H10. |
| row 9 | "he is a dome on a stump; they are a **wedge on a column**" | **AMENDED.** Measured, they are a **cone on a column with a disc on top**: two turning points, mirror-symmetric to 4 %, and the widest element on 4 of 6 figures is a 19 : 1 horizontal hat brim. |
| row 9 | "no hands, no feet, no face in the silhouette" | **AMENDED.** No *face* SURVIVES (H9 gives it a number). "No hands" is why the brim figure has **no arm at all**, which costs the one feature that breaks both pawn properties at once. **H2 requires one arm to break the outline** — the sleeve's outline, not a hand. |
| row 9 | "poster 3 for cast cloth (R7)" | **AMENDED by the code, which already ships poster 8**, with the reason written at `clothKit.ts` (`figureMaterial`). The bible row is stale. |
| `clothKit.ts:33` | "**Eight heads:** 0.158 u of head in the 1.24" | **AMENDED.** 0.158 u is the head's **width**, not its unit; the built figure is **7.62** heads and the derived canon is **7.80**. |
| `drapeGeom` doc-comment | "**This is what actually kills the pawn**: a pawn is radially symmetric and a person is not" | **STRUCK.** It kills radial symmetry **in plan** (max/min 1.16–1.49) and changes the **silhouette** by 0.04–3.9 % of the figure's width, because a silhouette samples two azimuths. The claim is not wrong about plan; it is wrong about what the lens sees. §2.4c. |
| `drapeGeom` doc-comment | "±16 % of the radius… 0.032 u, over 4 screen px, a fold you can see" | **AMENDED.** ±16 % is reached **only at the hem**. At the shoulder `amp = 0.016` → **0.0038 u = 0.79 px** at the film's largest trio framing. §2.4c. |
| R17 | "the DM is the one exception film-wide — he crosses 80 px at S5-B2/B4 and takes eye dots plus one mouth mark" | **STRUCK as unearned.** The DM's **head** never exceeds **55 px**, and at t44 he is cropped 95 px above frame. `buildFigure` builds no eye geometry for anyone, which is correct; the exception should be deleted rather than left standing as a promise. |
| R16 | "It lands with the tavern rebuild (`buildTavern` is sized for 0.95-u humans)" | **UNEXECUTED, and now visible.** The DM carries `scale 1.3` **on top of** an already-×1.30 figure: **1.628 u**, standing beside 1.252-u players. §2.2. |
| scene book S6-B5 · S7 · S8 | "the NPC based miniature (**N**)" | **NOT BUILT.** No figure exists in `montage.ts`; no cast mesh is visible at any t ≥ 50. §2.1. |
| scene book S5 | "seated patrons" | **NOT BUILT.** All three tavern figures stand at `y = 0` on the standing drape. §2.1. |
| goblin-reference §3.6 | contour 0.6–1.1 % of figure height | **SURVIVES as the standard**, and the cast is at 0.56–4.04 %. §4.2. |
| goblin-reference P1 (amended) | separation ≥ 0.12 from what is behind | **SURVIVES**, and the pale figure at t6 measures **Δ 0.006** against the sky. H10. |
| goblin-reference P2 (amended) | ≥ 50/255 and ≥ 4 plateaux across the form | **SURVIVES**, and the cast measures 46–67/255 across 2 values painted, and 65 % near-paper drained. §6. |
| goblin-reference §7.1 | his rest pose is plumb and symmetric | **SURVIVES for him, and must be INVERTED for the cast.** H4. A row of plumb figures is a row of chess pieces; that is the whole point of the contrast. |

---

## 9. THE MINIMUM CHANGE THAT WOULD PASS

Not a build order — a statement of what the measurements imply, so the next builder does not
spend a round on the wrong half again.

1. **Nothing in §3 is urgent except three numbers**: head width 0.158 → 0.115, head W : H 0.963
   → 0.72, drape shoulder 0.472 → 0.334. The head-unit count is already right.
2. **A2 and A1 are the round.** One arm that leaves and re-enters the outline on **one** side
   (H2), and a hem that breaks (H3). Those two alone take the turning-point count from 2 to ≥ 5
   on one edge and the mirror residual from 4 % to well over 8 %.
3. **The brim must stop being the widest element.** Row 9's *"clear the shoulders"* is exactly
   what makes it a pawn's collar. Either it narrows below the shoulder, or it tilts off horizontal
   by ≥ 12°, or the figures stop all wearing the same one.
4. **The contour must be re-derived per beat** (G-D) and generated from the perturbed geometry
   (G-E), or every other fix stays invisible behind a line that draws a lathe.
5. **The drained state needs a value, not a fix to its mean.** 65 % of the DM's area is within
   0.03 of the page.
