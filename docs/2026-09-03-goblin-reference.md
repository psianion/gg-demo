# The Good Goblin — the character, measured from the client's reference

2026-09-03 · **This document is the character's definition.** It is derived by measurement from
the three sheets the client supplied:

    docs/reference/goblin-faces.png     1002 x 616   15 head plates
    docs/reference/goblin-body.png      1011 x 662   15 full-body plates, front
    docs/reference/goblin-actions.png   1016 x 655    8 back-view action plates + 10 activity scenes

**Where any other document, constant, gate or prior decision disagrees with these sheets, the
sheets win.** §7 lists every place `docs/2026-09-03-goblin-design.md` is contradicted, with the
ruling. Nothing in that document may be built from until it has been reconciled against §7.

**How the numbers were got.** A throwaway Node script decodes the PNGs with `zlib` alone (no new
dependency, no browser): chunk walk → inflate → per-scanline unfilter → RGB. The figure in each
plate is isolated as the largest 4-connected non-background component of its card, with the soft
ground ellipse cut at the lowest row holding dark pixels. Every hex below is the **mode of a
sampled region** — the art is flat cel fill, so the mode is the authored value — never an
eyedropper guess. Proportions are pixel measurements of that isolated mask. Luma is quoted
**sRGB-encoded** (0.2126 R + 0.7152 G + 0.0722 B on the stored bytes), the same convention
`2026-09-03-goblin-design.md` uses, so the two are directly comparable.

**The canonical plate** for proportion is `goblin-body.png` frame 1 — dead front, arms down,
neutral. Isolated figure: **134 px wide x 177 px tall.** All fractions below are of that height
**H**, measured **from the crown downward**, unless stated. Frames 2–15 were measured as a check
and agree within ±3 % on every landmark; where a frame differs it is a pose difference and is
called out.

---

## 1. Proportion sheet

### 1.1 The head unit

**HU = crown → chin = 0.424 H = 75 px.**

| | measure | in H | in HU |
|---|---|---|---|
| Total figure, crown to sole | 177 px | 1.000 | **2.36** |
| Head + hood mass, crown to the hood's bottom edge | 88 px | 0.50 | 1.18 |
| Head width (hood, ears excluded), at its widest | **93 px** | 0.525 | **1.24** |
| Shoulder width, at 0.52 H | 57 px | 0.322 | 0.76 |
| Widest lower body (hands at the hips), 0.71 H | 64 px | 0.362 | 0.85 |
| Waist, narrowest | 50 px | 0.282 | 0.67 |
| Ear tip to ear tip = the figure's full width | **134 px** | **0.757** | 1.79 |

**He is a 2.36-head figure and the head is wider than it is tall (1.24 : 1).**
**The head is the widest element of the whole figure: head width : widest body width = 1.45 : 1.**

### 1.2 Vertical landmarks (fraction of H, from the crown)

| y | landmark | width there |
|---|---|---|
| 0.000 | **hood crown — the apex of the entire figure** | — |
| 0.040 | hood | 44 px |
| 0.062 | hood's front hem; the shaded forehead appears below it | ~60 px |
| 0.170 | eye top | |
| **0.203** | **both ear tips** — figure reaches its full 134 px width | 134 px |
| 0.272 | eye centre | |
| 0.339 | eye bottom | |
| 0.31–0.35 | ear roots rejoin the skull | |
| 0.36–0.44 | head + hood at its widest | **93 px** |
| **0.424** | **chin** (bottom of the lit face) | |
| 0.48 → 0.52 | hood's bottom edge → shoulder | 77 → 57 px |
| 0.605 | waist, narrowest point | 50 px |
| 0.64–0.69 | belt | |
| 0.712 | hands at the hips — widest point below the head | 64 px |
| 0.82 | tunic hem; the two legs separate | 51 → 40 px |
| 0.83–0.89 | shin wraps | |
| 0.89 | boot tops | |
| 1.000 | soles | boot pair 40–49 px |

Limbs, read off the same profile: **arm shoulder→hand = 0.20 H = 0.47 HU** (very short);
**leg hip→sole = 0.28 H = 0.66 HU**, of which only 0.18 H is visible below the hem.

### 1.3 Aspect

| plate set | aspect (H : W, ear tips included) |
|---|---|
| body 1, 3 (arms down, neutral) | **1.321, 1.331** |
| body 13 | 1.380 |
| body 2–15, whole set | 1.32 – 1.38 |
| back views (actions 1–8) | 1.53 – 1.59 |

The front figure is **1.32–1.38 : 1**. The back view is narrower because the ears foreshorten.

### 1.4 Ears

- **Both tips sit at 0.203 H — 0.203 H *below* the crown.** In all 15 body plates and all 8 back
  plates the **hood crown is the highest point of the figure and the ears never reach it.**
- Tips at x 0.000 W and 0.993 W: **the ears define the figure's entire width.** They buy width,
  not height.
- **Symmetric.** Left tip 0.203 H, right tip 0.198–0.203 H across frames — inside measurement
  noise. There is no long/short ear, no unequal sweep, no ear furniture.
- **Projection past the hood: 24 px per side = 0.135 H = 0.26 x head width.**
- Blade length root→tip ≈ 40 px = **0.23 H = 0.53 HU**; blade depth 25 px at the root, tapering.
- **Axis:** root at (0.73 W, 0.31 H) → tip at (0.99 W, 0.203 H) → dx +24 px, dy −19 px =
  **52° off vertical / 38° above horizontal.** The blade is not straight: its outer edge near the
  tip runs at only **14–34° off vertical**, so the ear leaves the skull nearly sideways and
  **curls up along its length** — a shallow banana, not a spike.
- **Ear ticks: 2–3 short near-paper strokes across each blade at mid-length**, L 0.92–0.97
  (#F9EFD5 / #FCF7DC). Present on both ears in every frame. These are the brightest marks on the
  whole figure — brighter than the eyes.

### 1.5 Eyes

Measured on body 1 (the full-figure read) and cross-checked on faces 1 (a closer study, drawn
~15 % larger relative to the head — cite the body numbers as the build target).

| | body 1 | as a fraction |
|---|---|---|
| eye size | 22 x 30 and 25 x 31 px | **0.24–0.27 x head width**; **0.40 x head height (HU)** |
| gap between the two | 10 px | **0.42 eye-widths** = 0.11 head widths |
| pair span | 57 px | **0.61 x head width** |
| eye centre height | 0.272 H | **64 % down the head unit** |
| eye bottom | 0.339 H | 80 % down the head unit; 20 % of HU remains to the chin |
| pupil | 4–5 x 7 px | **0.19–0.21 W x 0.23 H of the almond** |
| pupil placement | | inner-lower quadrant: ~7 px toward the nose, ~5 px down from the eye's centre |
| bright field | | **68–77 % of the almond area** (63–70 % on the faces sheet) |

**The eye is a two-tone almond, not a disc.** The shade tier #95853A (L 0.514) holds the **top and
the outer side**; the bright field #FEF15C (L 0.914) holds the **inner-lower two-thirds**. The
pupil is a small vertical oval with a single 1-px lighter notch as its only catchlight.
**There is no ink outline around the eye** — the almond is cut by value alone against the skin.

### 1.6 Mouth and nose

Both are tiny and bottom-loaded. The nose is a single small dark mark between and just below the
eyes, ~0.08 head widths across, at ~0.85 of the eye-to-chin span. The mouth is a small dark shape
lower still, no wider than one eye at its widest (open, frames 3/7/9) and a 6–10 px curve when
closed. A small pale tooth shows in the open-mouth frames. Neither reads at figure sizes below
about 90 px.

---

## 2. The silhouette

**What the black shape reads as:** a big rounded hood with two blades out of its sides, on a small
plumb body, standing on a soft ellipse. Not a bell, not a cone, not a tapering drape —
**a dome on a stump.**

### The five marks, in priority order

1. **The hood dome.** One unbroken curve. The crown is the top of the figure; the mass occupies
   the top **50 %** of the height and **69 %** of the full width. It is *wider than the body under
   it*, which is the whole read — a big head carried on a small frame.
2. **Two ear blades** leaving the dome at 0.203 H and reaching the figure's extreme left and
   right. They *are* the width. Symmetric, curling up along their length.
3. **Two bright eyes** low in the head (64 % down HU), 0.61 head-widths apart, each 0.26
   head-widths across — L 0.91 against a face at 0.37–0.69 and cloth at 0.32. Nothing else on him
   is above 0.81 except the 6-px ear ticks.
4. **The small body:** shoulders 0.61 x the head width, and the notch between the two legs from
   0.84 to 0.92 H. This is what says *a person, standing*, once the dome has said *a goblin*.
5. **The two pale linen bands** — forearms at 0.63–0.70 H and shins at 0.83–0.89 H, L 0.70–0.81.
   The only high-value cloth on him, and the only thing that separates the dark boots from the
   dark hem (both are at L 0.32).

### What drops first when he gets small

5 goes first (the wraps merge into the dark). Then the leg notch in 4 (the legs become one stump).
Then the ear taper in 2 (blades become two straight spikes). Then the gap in 3 (the two eyes
become one bright bar — which still reads). **1 and 2 never drop; if either is gone he is gone.**

### Negative space the reference actually uses

| space | job |
|---|---|
| the V between each ear and the hood dome | says *goblin*, not *hat* |
| the notch between the boots, 0.84–0.92 H | says *standing on two feet* |
| the gap between the eyes | keeps the pair from reading as one lamp |
| the soft ellipse under the boots | says *on the ground* — drawn in every one of the 38 frames |

---

## 3. Colour, sampled

Every value is a region mode. Luma is sRGB-encoded.

### 3.1 The cloth — five tiers of ONE hue

| tier | hex | L | where |
|---|---|---|---|
| cloak, lit plane | `#585D4B` | 0.355 | the hood's light-turned side |
| cloak, top plane | `#535746` | 0.333 | hood crown |
| **cloak, base** | **`#4F5442`** | **0.320** | the dominant value — 47 % of the front figure's area, 75 % of the back's |
| cloak, mid | `#3E4134` | 0.249 | folds |
| cloak, shade | `#303127` | 0.188 | hood interior, under the hem |
| cloak, deep | `#25251D` | 0.143 | the darkest cloth, at the contour |

The garment's **hue is olive-grey — g slightly above r, b lowest.** It is not slate, not blue-grey,
not cool. Its total range is 0.143 → 0.355 = **54/255 across five committed tiers.**

### 3.2 Skin

| | hex | L |
|---|---|---|
| lit (cheek, chin, jaw, hands) | `#ABB772` | 0.688 |
| ear | `#A0AB67` | 0.642 |
| mid / transition | `#6B6E42` | 0.416 |
| shade (forehead under the hood) | `#60623C` | 0.372 |

### 3.3 The eyes — the only saturated warm on the figure

| | hex | L | r − b |
|---|---|---|---|
| bright field | `#FEF15C` | **0.914** | **166–178** |
| shade crescent (top and outer) | `#95853A` | 0.514 | 91 |
| pupil | `#0C0E07` | 0.051 | 5 |

**The next-warmest thing anywhere on him measures r − b = 60.** The eyes are warmer than
everything else by a factor of three. That gap is the character.

### 3.4 Everything else

| part | hex | L | note |
|---|---|---|---|
| linen wrap, lit | `#D2D0C4` | 0.814 | forearms and shins |
| linen wrap, warm-lit | `#CDBE92` | 0.745 | back plates |
| linen wrap, shade | `#827059` | 0.448 | |
| **belt (leather)** | `#4E3E24` | 0.249 | **the only pixel family on him where r > g** |
| pouch, right hip | `#9E8E67` / `#7D6E52` | 0.559 / 0.436 | back plates |
| boots | `#565338` / `#4A4631` | 0.320 / 0.272 | |
| ear tick | `#F9EFD5` | **0.938** | the brightest marks on the figure |
| **line, contour** | `#1A1B10` | 0.102 | a dark **olive**-black, not neutral, not `#222222` |
| **line, deepest accents** | `#0A0B06` | 0.041 | pupils, deep folds, the boot line |

### 3.5 What is the same value and must be separated some other way

- **Boots `#565338` (0.320) = cloak `#4F5442` (0.320).** Identical. The reference separates them
  **only** with the drawn line and with the pale shin wrap sitting between them. A value-based
  separation is not available and must not be invented.
- **Belt `#4E3E24` (0.249) = cloak mid `#3E4134` (0.249).** Identical. Separated by **hue** — the
  belt is the one warm-dominant family on him — and by the line.
- **Ear (0.642) vs cheek (0.688).** 0.046 apart. Separated by **position**: the ear is always
  against paper or cloth, never against the face.
- **Pupil (0.051) vs contour (0.102).** Two tiers of the same near-black; the pupil is the darker.
- **Must never converge:** the eye field (0.914) against everything else. The nearest competitor
  is the linen wrap at 0.814 and it is elsewhere on the body.

### 3.6 The contour

**1–2 px on a 177 px figure = 0.6–1.1 % of the figure's height** — and it is **lost and found.**
Measured across the silhouette: ink-dark (L < 0.13) at the hood's lower edges, under the chin, at
the ear's outer edge and around the boots; across the top of the crown it thins to a mere dark
value step of the cloth's own deep tier with no ink at all. **It is not a uniform outline.**

---

## 4. Costume and kit — part by part

Everything below appears in **every** frame it could appear in. Anything that appeared once was
discarded as noise; the discards are listed at the end.

1. **The hood.** One piece with the tunic — no shoulder seam, no separate cape. A rounded dome,
   apex a little forward of centre, with **two lappets hanging beside the face to jaw level**
   (this is why the head mass measures 93 px wide at 0.36–0.44 H while the face window inside it
   is only ~53 px). **Recurring detail: 2–3 short dark crease strokes near the crown**, present in
   every front plate and every back plate. **The hood never moves** — compare faces 1, 8, 11, 13:
   the hood outline is identical in all of them.
2. **The tunic.** Plain, mid-thigh, hem at 0.82 H, a slight flare. Vertical fold strokes.
   **No shingled bands, no tail, no pointed hem flick, no patch pocket.**
3. **The belt.** A narrow leather band at 0.64–0.69 H with **a small pouch on his right hip**,
   clearest in the back plates. The only warm-dominant colour family on him.
4. **The wraps.** Linen bands on **both forearms** (0.63–0.70 H) and **both shins** (0.83–0.89 H).
   Present in all 38 frames. They are silhouette mark #5 and they are load-bearing.
5. **The hands.** **Bare green**, at the same skin value as the face. No mitts, no gloves, no
   sleeves over them.
6. **The boots.** Dark, ankle height, from 0.89 H, at the cloak's own value.
7. **The throat tab.** A small pale-green vertical patch at the collar, ~0.11 head-widths wide,
   between the hood's two front edges. In every front plate.
8. **The ear ticks.** 2–3 near-paper strokes across each blade at mid-length (§1.4).

**Absent from all 38 frames, therefore not part of the character:** a satchel, an earring, mitts,
a pauldron, a pocket, a hem tail or flick, shingled cloak bands, shoulder armour, a tool in the
standing plates, and any tunic-under-cloak layering.

---

## 5. The face

**How the expression is carried.** By the **eye aperture** and by the mouth. The lids cut into the
bright field from above; a fully closed eye (faces 4, 7, 10, 13) reduces the bright field to
**zero** and becomes a single dark curve. Between wide (faces 1, 11, 15) and half-lidded (faces 8,
12) the bright field is the whole signal. The mouth is a very small dark shape at the bottom of
the face. The brows are thin dark strokes drawn *inside* the shaded forehead. **The hood does not
move and the ears do not move between expressions.**

**What the hood shadow does.** It covers the forehead and the **top third of the eyes**, meeting
the lit lower face along a soft diagonal terminator that crosses the eyes rather than stopping
above them. Three skin tiers stack down the face: shade `#60623C` (0.372) → mid `#6B6E42` (0.416)
→ lit `#ABB772` (0.688). Inside that shadow the eyes keep their own two-tone: the crescent
`#95853A` sits where the shadow crosses, the bright field below it.

**How the eyes read against it.** The face's own range is 0.372 → 0.688; the eye's bright field is
0.914. It is **0.23 above the brightest skin it ever touches** and 0.59 above the hood behind it.
That is why they survive at every size: they are not a hue difference, they are a value jump no
other part of him makes.

**The minimum feature set that still reads as him:** hood dome + two ear blades + two bright eyes.
Remove the mouth, nose, brows, wraps, belt, boots and hands and he is still recognisably this
character. Remove one ear, or dim the eyes toward the skin, and he is not.

---

## 6. Acting — what the action and activity plates say

### The 8 back-view action plates

Stand (1) → walk (2) → run (3) → **fully airborne leap with both feet tucked** (4) → land with
impact dust (5) → stride (6, 7) → stand (8).

- **The hood never comes off and the head barely turns.** The entire read is the dome, the ears,
  the arm swing and the lift of the hem.
- **The ears trail.** In the run and leap plates they lag behind the head. They are the
  follow-through, and they carry motion — not mood.
- **He runs compactly**, arms bent and close, not flailing. The airborne frame tucks both feet.

### The 10 activity scenes (camera following behind)

1 forest path · 2 town street · **3 standing at a wall map with a candle** · 4 climbing a library
ladder for books · 5 stirring a cauldron over a fire · 6 watering a flower with a watering can ·
**7 writing at a desk with a quill and candle** · 8 opening a treasure chest of gems ·
**9 climbing a ladder holding a lantern** · **10 walking a stone corridor holding a torch**.

**Who he is, from these:** he is always **facing away**, always **doing a task with both hands**,
and always lit by **one small warm source he is carrying or standing at**. He is never posed for
us. The camera sits behind him at his shoulder. **He is a worker seen from behind** — the client
arrived at the film's own "stagehand" premise independently, and drew it 10 times.

### The film's own beats already in the client's frames

| client frame | film beat |
|---|---|
| activity 3 (wall map, candle) | drawing roads onto the map |
| activity 7 (desk, quill, candle) | `scribe()` — the hero working pose |
| activity 9 (ladder, lantern) | setting a lantern |
| activity 10 (corridor, torch) | the dungeon / cave beat |
| activity 8 (treasure chest) | placing treasure |
| activity 1 (forest path) | the path at the seam |
| activity 6 (watering a flower) | planting a tree |

Seven of the film's beats are already authored, from behind, by the client. **The back view is not
a transition — it is the client's default view of this character, in 18 of his 38 frames.**

---

## 7. What the reference overrides in `docs/2026-09-03-goblin-design.md`

Ruling codes: **STRUCK** (delete it), **AMENDED** (new number, same intent), **SURVIVES** (untouched
by the reference), **FILM-ONLY** (not part of the character; may live as a film staging device but
may not gate the sculpt).

### 7.1 Silhouette and proportion — the section that changes most

| ref | what it says | ruling |
|---|---|---|
| §2 mark 1 | "a leaning dark **bell**, one unbroken curve crown to hem" | **AMENDED.** It is a **dome on a stump**, not a bell: head width 93 px against a body max of 64 px. The curve is unbroken and that survives; the taper direction is inverted. |
| §2 mark 2 | "**Ears buy height**; the right tip is the highest point of the figure. This is what kills the mushroom." | **STRUCK, and inverted.** Both ear tips sit **0.203 H below the crown** in all 23 measured plates. The crown is the apex. **Ears buy width** — tip-to-tip *is* the figure's width. And the "mushroom" the doc was trying to kill is what the client drew. |
| §2 | "Two ear blades at **unequal** angles"; right 0.55 rad / tip 1.10 H, left 0.85 rad / tip 0.98 H | **STRUCK.** The reference ears are symmetric to within measurement noise (both tips 0.198–0.203 H). Asymmetry belongs to pose, not build. |
| §2 | "Aspect **≥ 1.45 : 1** at every breakpoint. This is the first gate the rebuild must pass." | **STRUCK.** The client's own front plates measure **1.32–1.38**. A ≥1.45 gate fails the reference. New value in §7.6. |
| §2 | "Cloak hem is the widest body element: hem 0.42 H, head 0.34 H, **head : hem = 0.81**" | **STRUCK, and inverted.** Measured **head : widest body = 1.45**. The head is the widest element of the figure by 45 %. |
| §2 | "Max total width 0.72 H" | **AMENDED to 0.757 H** (ear tip to ear tip). |
| §2 | "height incl. the right ear tip 1.10 H → 1.53 : 1 at rest" | **STRUCK** with the ear rule. |
| §2 mark 4 | "the pencil notch — a triangle of clean paper… negative space does the verb" | **FILM-ONLY.** No tool appears in any standing plate; 8 of the 18 back/activity frames have empty hands. It may be a film device; it may not be a silhouette contract term. |
| §2 mark 3, 5 | two amber dots; a contact pool | **SURVIVE.** Both confirmed — the dots are almonds (§1.5), and a soft ground ellipse is drawn in all 38 frames. |
| §3 | "head = 0.50 H — kept" | **SURVIVES.** Reference head+hood mass = 0.50 of total height. The one proportion the doc had right. |
| §3 | eye line at 0.60 H from soles (= 52 % down the head) | **AMENDED.** Reference eye centre is **64 % down the head unit**, 0.272 H from the crown. Lower in the head, higher on the figure. |
| §3 | chin at 0.36 H from soles | **AMENDED to 0.576 from soles / 0.424 from the crown.** |
| §3 | "Head width 0.34 H" (= 0.309 of total silhouette height) | **AMENDED to 0.525 of total height** — 70 % wider, relatively. |
| §3.1 | the forward C, crown 0.10 H forward of the heels, hem trailing 0.10 H behind | **FILM-ONLY.** All 23 standing plates are plumb and symmetric. Keep it as the hero's working stoop; do not build it into the rest pose. |
| §3.2 | 58/42 weight, "he is never symmetric, in any frame, ever" | **FILM-ONLY**, same reason. The reference rest is even-weighted. |
| §3.3 | `WORKING_SIDE`, earring on the left, ear bandage deleted, patch pocket on the right | **Earring STRUCK** (absent from all 38 frames). **Pocket STRUCK** (absent). The handedness constant SURVIVES as a film convention. What the reference *does* put on the ears is **2–3 pale ticks per blade, symmetric** (§1.4) — the opposite of the doc's one-sided furniture. |
| §3.4 | the 43° three-quarter; root 1.60; nothing rotates | **SURVIVES for hero staging.** But the reference adds a requirement the doc never had: **the back view is a first-class read** (18 of 38 client frames). It must be authored, not tolerated. |

### 7.2 Colour — the section that changes second most

| ref | what it says | ruling |
|---|---|---|
| §4.2 | `gobCloak 0x2E3742`, L **0.211**, "cool slate — theatre blacks" | **STRUCK.** Reference cloak base is **`#4F5442`, L 0.320** — a warm-neutral **olive-grey**, a full 0.11 lighter, and not cool. |
| §4.1/§4.2 | "He owns the frame's **darkest committed value** and its **only cool hue**" | **STRUCK, both halves.** His base is a mid value. His darks are the shade tiers (0.14–0.19), the belt (0.25) and the line (0.04–0.10); his hue is olive. |
| §4.2 | calibration floor `0x232830` (0.152), "never below" | **MOOT** — the range was built around a value the reference does not use. |
| §4.2 | `gobCloakWorn 0x59626B` (0.379) for mitts, cuffs, boots | **STRUCK.** No mitts (bare green hands); cuffs are linen wraps at 0.70–0.81; boots sit at the cloak's own 0.320. |
| §4.2 | `gobSkin = goblinGreen 0x84A058` (0.600) | **AMENDED** to lit `#ABB772` (0.688) / shade `#60623C` (0.372) / mid `#6B6E42` (0.416). Lighter and less saturated than the token. |
| §4.2 | `gobEarInner 0x5C7A2E` (0.430) "inner ear, and the nose" | **STRUCK.** No inner-ear colour exists; the ear is the face's own skin, ~0.05 darker. The nose is a dark mark, not a coloured button. |
| §4.2 | `amber 0xF2C35E` (0.770) "the eyes and nothing else" | **AMENDED.** The rule survives and gets stronger; the value does not. Reference eye is **`#FEF15C`, L 0.914** — a **lemon** yellow, 0.144 brighter, r − b 166 vs 144. Plus a **shade crescent `#95853A` (0.514)** the doc has no token for. |
| §4.2 | `gobSatchel 0xB08D55` — "the ONE warm patch", capped at 12 % of silhouette area | **STRUCK.** No satchel. Its role is taken by a **belt pouch** on the right hip, `#9E8E67`/`#7D6E52`, much smaller and much darker. |
| §4.2 | `brass 0xB0913F` — one earring, left | **STRUCK.** |
| §4.2 | `ink 0x222222` (0.133) for shells, marks and pupils | **AMENDED.** The reference line is a **two-tier dark olive-black**: contour `#1A1B10` (0.102), accents and pupils `#0A0B06` (0.041). Neither is `#222222` and neither is neutral. |
| §4.2 | `gobTooth 0xF0EDE4` | **SURVIVES**, small — a pale tooth shows in the open-mouth plates. |
| §4.2 | `dieBone 0xECE2CA` (0.880) for the pencil body | **FILM-ONLY, with a warning:** the linen wraps now occupy the high-value cloth slot at 0.70–0.81. A 0.88 pencil beside a 0.81 wrap will not separate on value. |
| §4.3 | stroke direction 1.45 rad (near-vertical) on the cloak | **SURVIVES, confirmed** — the reference's fold strokes run vertically on the hood and the skirt. |
| §4.3 | "poster 10 on the cloth, because a **dark** mass needs more steps" | **AMENDED.** The arithmetic was computed for a cloak at 0.211. At 0.320 with a measured five-tier range of 0.143 → 0.355, re-derive the quantizer so those five tiers land. Do not carry the old number over. |
| §4.4, §4.5 | seam / curtain / alive / birth stagger / Prep rig | **SURVIVE** (mechanical). The "he must not read as a hole" worry in §4.5 gets easier: he is 0.32, not 0.21. |

### 7.3 Construction (§5)

| part | ruling |
|---|---|
| 1 cloak, 3 shingled lathe bands, hem 0.42 H | **AMENDED** — the widths are struck with §2; the reference tunic is plain, not shingled. |
| 2 hem flick | **STRUCK.** No tail or point on the hem in any frame. |
| 3 patch pocket | **STRUCK.** Absent. |
| 4 hood: window-cut cowl + peak cone + tail cone | **AMENDED.** The cowl survives. **Add: two lappets hanging beside the face to jaw level, and 2–3 crease strokes near the crown.** No peak, no tail cone. |
| 5 skull lathe | **SURVIVES.** |
| 6 ears, right −0.55 / left +0.85, blade trimmed 13 % | **STRUCK** (symmetric, and the axis is 52° off vertical with an upward curl). **Add the pale ticks.** |
| 7 eyes: sphere, z-scale 0.55, **ink slit pupil** | **AMENDED.** The pupil is a small **vertical oval**, 0.20 x 0.23 of the almond, in the inner-lower quadrant, with a 1-px catchlight — not a slit. **Add the shade crescent.** **No ink outline on the eye.** |
| 8 face furniture: nose as a `gobEarInner` button sphere | **AMENDED** — a dark mark, not a coloured mass. |
| 9 arms + **mitts** | **STRUCK.** Bare green hands. |
| 10 legs + boots, "**shin wraps deleted — never visible**" | **STRUCK, and inverted.** The shin wraps are silhouette mark #5 and appear in all 38 frames. |
| 11 satchel + strap | **STRUCK.** Replaced by the belt pouch. |
| 12 pencil | **FILM-ONLY.** |
| 13 earring | **STRUCK.** |
| 14 contact pool | **SURVIVES.** |
| 15 two px-solved ink shells | **SURVIVES mechanically**, with two corrections: the line has **two values**, and it is **lost and found** — a uniform-weight shell all the way round is not what the reference draws (§3.6). |
| 16 ~12 authored marks | **SURVIVES** at about the same count, different list: hood creases (2–3), ear ticks (4–6), brows (2), nose, mouth, wrap edges (4), belt line, boot line, throat tab. |

### 7.4 Face and eye (§6)

| ref | ruling |
|---|---|
| "eye diameter = **22 %** of head height" | **AMENDED to 40 %** of head height and **26 %** of head width. |
| "the two nearly touching, pupil a 2 px slit" at phone size | **SURVIVES** — the measured gap is 0.42 eye-widths, so at 5-px eyes the gap is 2 px. |
| "value never exceeds `lanternGlass 0xF2E2B4`" (0.878) | **AMENDED.** The reference eye is **0.914**, above that cap, and the client's own activity frames deliberately stage him as a dark shape with bright eyes in front of a candle, a fire, a lantern and a torch. **Ruling: the eyes may reach 0.914. The lantern keeps the largest warm area and the only glow; the eyes keep the highest value.** |
| "**brow = the hood hem**; the cowl slides ±0.02 y as an expression channel" | **STRUCK.** The hood outline is pixel-identical across faces 1, 8, 11 and 13. The hood does not move. |
| "**expression at distance is the EARS**; the eyes carry presence, the ears carry mood" | **AMENDED, split.** In the 15 face plates the ears do not move at all; **mood is the eye aperture.** In the 8 action plates the ears **trail** with the body. **The ears carry motion, not mood.** |
| "the wordmark test" | **SURVIVES**, and the reference makes it easy — dark dome, two blades, two bright eyes is exactly the mark. |

### 7.5 Costume, motion, accepted failures

| ref | ruling |
|---|---|
| §7 "one garment… mitts, cuffs and boots in `gobCloakWorn`; back satchel; brass earring; at rest both mitts live under the cloak" | **STRUCK** in every specific. See §4 for what the reference actually wears. The "one garment hood-to-hem" idea **survives**. |
| §8 grounding — pool, baked blob, crossing cast shadow | **SURVIVES** entirely. |
| §9 `EAR_Z_R = 0.55` / `EAR_Z_L = 0.85` as two constants | **STRUCK.** The ears are symmetric; this must become one constant. |
| §11 motion identity, "ears last, +80 ms, 1.3x overshoot" | **SURVIVES, and is confirmed** by the trailing ears in the run and leap plates. |
| §11.1 scrub safety, authored keys only | **SURVIVES.** |
| §11.2 reduced-motion still, `HERO_GOB_SCALE` ≥ 52 CSS px | **SURVIVES.** |
| §15.2 "the lathe cloak is radially near-symmetric… the film never stages him from dead behind for longer than a transition" | **STRUCK as an accepted failure — it is now a requirement.** 18 of the client's 38 frames are back views. The back must carry the hood crease, the belt and pouch, the wraps and the hem, and must read as a picture on its own. |
| §15.5 "mitts have no fingers" | **STRUCK.** Bare hands. |
| §15.9 stroke tiles tuned for trees | **SURVIVES.** |

### 7.6 The acceptance gates, one by one

| gate | ruling |
|---|---|
| **G1** aspect ≥ 1.45 : 1 | **STRUCK. Replaced:** projected aspect (height incl. ear tips : width incl. ear tips) must land **1.25 – 1.45** at every breakpoint, **and the ear span must equal the figure's full projected width** (no other part may be wider). |
| **G2** the two ear tips are the two highest points; right above left by ≥ 0.02 H | **STRUCK. Replaced:** the **hood crown** is the highest projected point; both ear tips sit **0.17 – 0.24 H below it**, and their heights differ by **≤ 0.02 H**. |
| **G3** head width ≤ 0.86 x hem width | **STRUCK, INVERTED. Replaced:** head width ≥ **1.30 x** the widest body width below the shoulder. |
| **G4** raycast: the eye's front cap ≥ 0.03 units proud of the skull | **SURVIVES.** |
| **G5** projected pencil length and overlap | **FILM-ONLY** — not a character gate. |
| **G6** face-plane-to-lens 40–48° | **SURVIVES for the hero stage.** **Add a sibling gate: the back view must return all five silhouette marks** (§2) at the same breakpoints. |
| **G7** ≥ 52 CSS px on the Cover; scale ≤ 1.35 x | **SURVIVES.** |
| **G8** `EAR_Z_R` / `EAR_Z_L` exported as two unequal constants | **STRUCK AND INVERTED** — assert **one symmetric** ear constant; assert the two-constant form is gone. |
| **G9** no `hatch(`, `blobs(`, `timberDark`, `paint(…fill:` | **SURVIVES** — and the reference confirms the intent: there is **no hatching anywhere in 38 frames**, only flat fills and single contour strokes. |
| **G10** one `REST` table, three readers | **SURVIVES.** |
| **G11** the cast shadow crosses the seam | **SURVIVES.** |
| **G12** contact pool is `neverAlive`, hide-loop gone | **SURVIVES.** |
| **G13** no overlap with the island underside band | **SURVIVES.** |
| **P1** cloak ≤ darkest crown − 0.12 | **AMENDED.** Unreachable: his base is 0.320, not 0.211, and the reference does not make him the darkest thing in his own frames. **Replaced:** at the hero stage, `|cloak − whatever is directly behind him| ≥ 0.12`, in either direction. Separation, not an absolute floor. |
| **P2** torso scan: range ≥ 60/255, ≥ 3 plateaux | **AMENDED to ≥ 50/255 and ≥ 4 plateaux.** The reference cloth runs 0.143 → 0.355 = **54/255 across five committed tiers**; the doc's 60/255 would fail the client's own art, and 3 tiers under-counts it. Keep §0.1's fix that the scan must run **across** the form. |
| **P3** amber pixels, classifier **r − b ≥ 70** | **AMENDED.** At that threshold the linen wraps (r − b up to 59) and the belt are misclassified as amber. **Raise the classifier to r − b ≥ 100** — the reference eye measures 166–178 and nothing else on him exceeds 60. Keep the counts. |
| **P3b** both eyes amber, near : far ≤ 2.5 : 1 | **SURVIVES.** |
| **P4** rim 2.6–3.6 CSS px at every breakpoint | **AMENDED.** The reference contour is **0.6–1.1 % of the figure's height**; a fixed 3.2 px is only right when the figure projects ~270–300 px and is 5x too heavy at a 52-px phone figure. **Re-gate as a fraction of projected figure height (1.0 %, floor 1.0 px, ceiling 3.6 px).** Keep §0.1's fix that zero samples are failures. |
| **P5** contact region in both curtain states | **SURVIVES.** |
| **P6** cast-shadow darkness and boundary gradient | **SURVIVES** (a film device; the reference draws only the soft ellipse). |
| **P7** zero amber outside the head bbox, satchel excluded | **AMENDED.** The satchel carve-out is **moot** (no satchel). **Replaced:** no pixel outside the eye almonds may exceed **r − b = 100**. Under that classifier the belt, pouch and wraps pass cleanly. |
| **P8** Prep rig repeat, no pixel darker than ink + 8/255 | **SURVIVES**, and gets easier at 0.320. |
| **P9** entrance at birth t = 0.5 | **SURVIVES.** |
| **P10** 6x zoom, **no crossing strokes** | **SURVIVES — hard gate, endorsed by the reference.** |

### 7.7 What survives untouched

The joint set; the head-is-half proportion; `markAlive` and the seam/curtain/alive contract; the
per-part birth stagger; the contact pool with its `neverAlive` carve-out; the crossing cast shadow;
the two-shell px-solved outline *as a mechanism*; the no-hatching gate; the scrub-safety rules;
the reduced-motion still; the phone scale bump; the whole of §12's performance budget; and §13's
step 0 (the gates need a runner before any of this can be checked).

---

## 8. The translation — a flat cel character as a form in this painted world

The problem, stated honestly: the reference is **2D cel** — flat fills, hard terminators, a single
lost-and-found contour, no texture anywhere. The film is **3D in a painted/graphite language** —
the trilayer's paint / underdrawing / edge-wear, a tone quantizer, canvas-baked stroke tiles, one
stroke family per face, drybrush rims. Copying the cel look into 3D gives a cardboard cut-out.
Abandoning it for the film's look gives back the figure the client rejected twice.

The resolution is that **the reference and the trilayer already agree about one thing: tone comes
in committed tiers, not in ramps.** The cel art is a five-tier quantization of one hue. The
trilayer's `uTriPoster` is a quantizer. They are the same instrument. So:

**1. The tone tiers are the reference's own tiers, not a re-derivation.**
Author the cloth so its lit luminance quantizes onto **five plateaux at 0.143 / 0.188 / 0.249 /
0.320 / 0.355**, the skin onto **three at 0.372 / 0.416 / 0.688**, and the linen onto **two at
0.448 / 0.814**. That is not a stylistic choice made in 3D; it is the client's own palette, made
to survive lighting. The quantizer setting is then whatever puts those plateaux where they are —
which is why §4.3's poster-10 argument must be recomputed rather than inherited (§7.2).

**2. Stroke direction is per form, one family per face, and it is already implied by the drawing.**
The cloth's folds in the reference run **vertically** — hood, lappets, skirt. That is the cloak's
one direction (≈1.45 rad), and it is what the reference already draws. The **skull and the lower
face** take a single direction that follows the cheek's curve. The **ears** each take one direction
**along the blade** — which is also the direction of the pale ticks, so the tick marks and the
stroke family agree instead of crossing. The **linen wraps** take a direction **across** the limb
(that is how a bandage is wound) — and because the wrap is a separate small form, that cross-limb
direction never meets the limb's own family on the same face. **Nothing crosses anywhere.** The
no-hatching gate is met by construction and the reference independently endorses it: there is not
one hatch mark in 38 frames.

**3. Edge wear goes where the reference lost its line.**
§3.6 measured that the contour is *lost and found* — ink at the hood's lower edges, under the chin,
at the ear's outer edge and around the boots; a bare value step across the crown. That map is the
edge-wear map. **`wear` is highest where the reference dropped the line** (the crown, the top of
the shoulders, the outer curve of each ear near the tip) and lowest where the reference pressed it
(the hood's lower edge, the jaw, the boot line). This gives the film's drybrush a *reason* instead
of an even dusting, and it reproduces the cel drawing's own rhythm with a 3D mechanism.

**4. The hood shadow is lighting, not paint.**
The reference's hood shadow is a shaped patch. In 3D it is the same thing done properly: **the
hood's front hem is a real overhang, and the key throws its shadow across the forehead and the top
third of the eyes.** Three consequences that must be authored, not hoped for:
- the hem's overhang depth is set so the terminator lands at the eyes' **upper third** at the hero
  azimuth, not above them — the reference's terminator crosses the eyes and that is what makes them
  sit *inside* the hood rather than in front of it;
- the shadowed skin must quantize to the **0.372** tier and the lit skin to **0.688**, with the
  0.416 mid appearing only in the terminator's width — so the tier structure is identical whether
  it came from a painted patch or from a shadow;
- under the Prep rig, where the key stays but the fill rises, the terminator softens and rises.
  That is correct and it is the reference's own frames 4 / 10 / 13, where the shadow is lighter.
  **It must not be a painted patch, because a painted patch cannot do that.**

**5. The eyes are the signature and they are handled as a two-part object, unlit.**
- The **bright field** is unlit `MeshBasicMaterial` at `#FEF15C` — it cannot go muddy under any rig,
  curtain state or grade, which is exactly why the reference can put him in front of a torch and
  still read.
- The **shade crescent** `#95853A` is *not* a second material and *not* a light response. It is
  part of the same unlit surface, occupying the almond's **top and outer** third — because in the
  reference it is a painted decision, constant across all 15 face plates regardless of what the
  light is doing. Making it lighting-driven would make the eyes flicker, which is the one thing
  they must never do.
- The **pupil** is a small vertical oval at 0.20 x 0.23 of the almond, in the inner-lower quadrant,
  with one lighter notch. It is the `pupils` group's payload and it is what makes a look-at-camera
  read at 150 px.
- **No outline on the eye.** The almond is cut by value alone, as in the reference. An ink ring
  around it at small sizes eats the bright field and the whole read collapses.
- **Survival at every size:** at 52 px of figure the eyes are ~5 px each with a 2 px gap and no
  resolvable pupil — which is the reference's own 36-px read, two bright dots in a dark dome. At
  150 px the pupil and the crescent resolve. At 6x nothing new appears that contradicts either.
  The one hard rule that makes all three work: **the eye's value never drops toward the skin.** The
  0.23 gap to the brightest skin and the 0.59 gap to the hood are the character; they are not
  negotiable against any rig, any curtain state or any grade.

**6. What makes him belong to the film rather than sit on top of it.**
He gets the same trilayer program, the same stroke sheet basis, the same drybrush rim, the same
quantizer and the same two-tier authored line as the island — the island being the finished
quality bar for surface and form. What he does **not** get is the island's tier *placement*: his
five cloth plateaux are the client's, not the island's. That is the whole trick. **Same material
language, his own palette.** A viewer who has seen the reference sees his colours, his proportions
and his marks; a viewer who has seen the film sees the film's surface. Neither sees a compromise.

---

## 9. Studying a sculpt against these sheets

`src/GobStudy.tsx` now takes a `&view=` parameter so a sculpt can be screenshotted in the same
framings as the plates above and laid directly beside them:

    /?gobstudy=OLD                      the scene study, unchanged (default)
    /?gobstudy=OLD&view=front           dead front, figure fills the frame, paper ground
    /?gobstudy=OLD&view=three           three-quarter
    /?gobstudy=OLD&view=back            dead back — the client's default view
    /?gobstudy=OLD&view=sheet           front + three-quarter + back in one strip

`&rig=prep` and `&zoom=1..6` work in every view. `window.__study()` reports `view` alongside the
projected size, triangles, draw calls and materials, so a study's aspect can be read straight off
against §1.3 and §7.6's G1.
