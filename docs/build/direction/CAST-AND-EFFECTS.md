# CAST AND EFFECTS — everything alive or transient in the film

**Status:** binding design for the cast tier and the whole transient layer. Written against
`docs/2026-09-03-art-bible.md`, `docs/2026-09-03-world-direction.md` (THE KEPT WORLD),
`docs/2026-09-03-scene-book.md`, `docs/2026-09-03-goblin-reference.md`, and the shipped code
named inline. Where this and a binding doc disagree, the binding doc wins and this is the
error; where this closes a gap none of them names, it is marked **GAP CLOSED** and the
reasoning is given.

**What this owns:** the adventurer trio, the DM, the two players, the tavern patrons, the
ravens, the monster, the NPC miniature — how a human is *built* here. And the attacks (swords,
the bolt, the arrows, impacts, near-misses, scorch), fire at all four scales, torch/lantern/
hearth/candle, embers, dust, sparks, smoke, snow, water, god-rays, the die's motion, and the
paint bloom.

**What this does not own:** the goblin. `docs/2026-09-03-goblin-reference.md` is binding and he
is not redesigned here. This document only says how everything else *relates* to him, and every
such rule is derived from a number in that doc or in `palette.ts`.

**Files this workflow authors:** new files only, plus handoff notes for the owned set
(`world.ts`, `timeline.ts`, `goblin.ts`, `hero.ts`, `GobStudy.tsx`) collected in §10.

---

## 0. The two measured facts everything in this document is sized against

Nothing below is authored by feel. Two numbers govern every mark.

### 0.1 Screen pixels per world unit, per shot

`framing.ts` holds the **horizontal** field constant across breakpoints: `fitFov` opens the lens
until it clamps at `MAX_FOV = 70`, then `fitPullback` steps the camera back by
`tan(REF_H_FOV/2) / tan(h/2)`, capped at 2.2. Consequence, and it is the useful one:

> **At every breakpoint where the pullback cap does not bite, the authored horizontal world
> width at the look target is identical. So px-per-world-unit is just `frameWidthPx / authoredWidth`.**

`REF_FOV 42°` at `16/9` gives `REF_H_FOV = 68.622°`, `tan(REF_H_FOV/2) = 0.682425`.
Authored width `= 2 · d · 0.682425`, where `d` is camera-to-target distance.

Verified the cap does not bite at the two hard breakpoints: at 390×844 the solve needs
pullback **2.109** (< 2.2 ✓); at 500×915 it needs **1.784** (< 2.2 ✓). So the table holds
at both.

Stage 1's four framings, from the scene book §3 (these supersede the shipped v1 camera
positions in `timeline.ts:200–277`):

| Beat | Camera → target | `d` | Authored width | **px/unit @390** | **@500** | **@1440** |
|---|---|---|---|---|---|---|
| S1-B2 wide | `[100,7.5,6] → [114,3.2,0]` | 15.83 | 21.60 u | 18.1 | **23.1** | 66.7 |
| S1-B3 volley | `[108.5,7.0,4.4] → [117.2,5.4,0]` | 9.88 | 13.48 u | 28.9 | **37.1** | 106.8 |
| S1-B4 rim | `[113.5,9.2,3.4] → [117.6,6.2,0]` | 6.11 | 8.34 u | 46.7 | **59.9** | 172.6 |
| S1-B5 landing | `[129.5,2.6,3.4] → [126.5,0.5,-0.5]` | 5.35 | 7.30 u | 53.4 | **68.5** | 197.2 |

**The volley beat — S1-B3 — is the one to author against: 37.1 px per world unit at 500 px.**
Every attack mark below is sized in world units *and* quoted at that number. A mark that lands
under 4 px there does not exist.

### 0.2 Stroke weight is screen pixels, and it thins on phones

`pencil.ts:31,38` — `WIDTH = { hero: 3.4, form: 2.1, faint: 1.1 }`, all screen px, multiplied by
`SCALE = 0.75` when `window.innerWidth < 700`.

| Weight | ≥700 px | **< 700 px (the 390 and 500 cases)** |
|---|---|---|
| `hero` | 3.4 px | **2.55 px** |
| `form` | 2.1 px | **1.58 px** |
| `faint` | 1.1 px | **0.83 px** |

> **RULE (attacks).** At 500 px a `'faint'` stroke is 0.83 px — under `alphaToCoverage` that is a
> grey ghost. **No transient mark in this film is ever `'faint'`.** Attacks, impacts, dust and
> spall are `'hero'`; the fire's Prep-side contour is `'form'`. `'faint'` is for ghosts and
> erased passes only, exactly as art bible §9.9 already rules for static work — this document
> extends the same rule to everything that moves, where it matters more, because a transient
> mark gets a fraction of a second to land.

---

# 1. THE CAST

## 1.1 The human build law

The goblin's silhouette reads by five marks in priority order (goblin reference §2): **the hood
dome · two ear blades · two bright eyes · the small body · the two pale linen bands.** A human
here must not compete for any of them. So a human is built to three marks, and they are three
he does not have:

1. **The shoulder line.** A horizontal at the top of the body. The goblin's shoulders are
   0.61× his head width and buried under the dome — he has no shoulder line at all. This is
   the single cheapest separation available and it costs nothing but staging: **every cast
   figure presents its shoulder line to the lens.**
2. **The vertical drape.** One unbroken fall from shoulder to hem. He is *a dome on a stump*;
   they are *a wedge on a column*.
3. **One silhouette-carrying attribute, never two.** Hat brim · raised sword · shield · mug ·
   DM screen. It is the whole read at 30 px, and a second attribute halves the first.

Nothing else is in the silhouette. No hands, no feet, no face.

### The proportion ruling — and the one number that has to change

Measured from the shipped build: `buildAdventurer` stands **≈0.95 world units** (hat crown at
`world.ts:1214`, y ≈ 0.94). The goblin stands **0.75 units** (`goblin.ts:124` `H = 0.9`, times
`hero.ts:1332`'s `GOB_SCALE / 0.9 = 0.8333`).

**0.75 / 0.95 = 79 %.** That is not *"one tiny goblin"*. It is a slightly short adult.

> **RULING — GAP CLOSED. The cast scales to 1.30×; a human stands 1.24 world units and the
> goblin reads at 60 % of a human.** One multiplier at the trio's build, zero draws, zero
> materials, and it does not touch him — which matters, because he is locked.
>
> Why 60 %: a human is ~8 heads; his head mass occupies the top 50 % of his height (goblin ref
> §2.1). At 60 % height his head is 0.375 u against a human's 0.155 u — **his head is 2.4× a
> human head.** *A small body carrying a big head, next to normal people.* That is the storybook
> read, and it comes out of the reference's own proportions rather than being invented.
>
> **Sequencing:** the S5 interior is sized for 0.95-unit humans (`buildTavern`). The scale change
> lands **with the tavern rebuild, never before it.** S1 has no such coupling and can take it
> immediately.

Post-change figure heights: S1-B2 **28.6 px** @500 (goblin 17.3), S1-B3 **46.0 px** @500
(goblin 27.8). Both trio beats are `E`- and shoulder-shape framings, so the figure floor does
not apply to them — but they now *read* as adults.

## 1.2 The detail ladder — authored once, at the small end

Projected head height decides everything, and the humans in this film live in one band:

| Projected figure | Head is | What is built |
|---|---|---|
| **≥ 120 px** | ≥ 15 px | mass + drape + attribute + eye dots + one mouth mark |
| **80–120 px** | 10–15 px | mass + drape + attribute + eye dots. No mouth, no nose. |
| **30–80 px** ← *every human in this film except one* | 4–10 px | mass + drape + attribute. **Face is one value, not features.** |
| **< 30 px** | < 4 px | silhouette only; merges into the class geometry |

At S1-B3, 500 px: the trio is 46 px, their heads **5.8 px**. The shipped build puts two
0.015-radius ink spheres at `world.ts:1150–1153` — **1.1 px each, 3 px apart.** That is confetti,
and it is a large part of why the v1 figures read as chess pawns: two dark dots on a 6 px head
is a beetle, not a person.

> **RULING. No cast head carries eye geometry below 80 px projected.** What replaces the eyes:
> - the head mass's **lower two-thirds sits in a committed shade tier**, thrown by the brim or
>   hood overhang — lighting, not paint, exactly the mechanism goblin reference §8.4 specifies
>   for his own hood shadow, used here to make the opposite point;
> - **exactly one authored contour mark per head** — the jaw line, `'form'`, in the shot's view
>   plane via the `contourArc` basis (`hero.ts:665–702`). One mark is what turns a ball into a
>   head. Two marks is a face, and a face at 6 px is noise.
>
> **No runtime LOD.** Each figure is built once, authored for the 30–80 band, and gains nothing
> at larger sizes but its contour. A size-switched build is machinery for a problem this film
> does not have — no cast member crosses two bands.

**The one exception, and it is a real one:** the **DM** acts (`S5-B2`, the throw) and is held in
a frozen frame at reading scale (`S5-B4`, flagship 3). He crosses 80 px and takes eye dots plus
one mouth mark. They are `inkMaterial` (`pencil.ts:141`, `MeshBasicMaterial`, outside the
trilayer), so they are identical on both sides of the curtain — a drawing still has pupils.
That is how the goblin's own pupils already work, and it is the reason the exception costs
nothing.

## 1.3 Hands, feet and grounding

**Hands.** Almost every cast member holds something. **A cast hand is the end of the sleeve, and
the object starts inside it.** No fingers anywhere in the cast, at any size. The cuff is a
committed value step (the same device as the goblin's linen wraps at L 0.814) and the grip
begins under it. This is not a shortcut — at 46 px of figure a hand is 2 px, and modelled
fingers at 2 px are the "robot made of tins and shapes" signature (art bible §9.7).

**Feet.** In the silhouette the boots are one mass with a drawn separation line, per goblin
reference §3.5's own finding: value cannot separate boots from hem, only the line can.

**Grounding — and this retires a hatch field nobody has counted.**

`buildAdventurer` ends at `world.ts:1257` with `g.add(contact(0.42, 0.3))`. `contact()`
(`pencil.ts:487–500`) builds `hatch(width, depth, 9/depth, 0, 'faint')` — **a nine-stroke hatch
disc**. `buildAdventurer` is called for the trio, the DM, the two players and the three patrons:
**nine figures, nine hatch discs, from one call site.**

> **RULING. Zero `contact()` calls in the cast.** A static cast figure's grounding is a **painted
> contact blob in the island's own albedo bake** — proven machinery (`hero.ts:320+`
> `bakeIslandAlbedo`: *"the painted contact blobs that ground every painted prop"*), already
> ruled for S3 and S6 by scene book §6.4. Zero draws, zero hatch, and it grounds the figure on
> both sides of the curtain for free because the bake is what the underdrawing derives its tone
> from. Interior figures (S5) take a short drybrush smear in the floor/table bake instead.
>
> The goblin's contact pool is a *trilayer* pool parented to his root with `userData.neverAlive`
> (`curtain.ts:72`). That device is his alone and no cast member gets one.

## 1.4 Value and chroma — how the frame separates him from them

Every number below is Rec.709 luma on sRGB-**encoded** channels. Method validated against
`palette.ts:126`'s own recorded measurement: it states `gobTunic 0x9C3A22` at **0.303**; this
method returns **0.3024**. Same instrument.

| Token | Hex | **L** | Δ vs `gobCloak` (0.177) |
|---|---|---|---|
| `gobCloak` | `#272E37` | **0.177** | — |
| `cloakIndigo` | `#4D5A9E` | 0.361 | **+0.184** ✓ (gate ≥ 0.12) |
| `cloakCrimson` | `#9E3D2C` | 0.315 | **+0.138** ✓ |
| `stoneWarm` (human skin) | `#A9967A` | 0.596 | — |
| `goblinGreen` (his skin) | `#84A058` | **0.584** | — |
| `gobEye` = `amber` | `#F2C35E` | 0.770 | — |

Two findings fall straight out, and both need a decision.

**FINDING 1 — human skin and goblin skin are the same value.** `stoneWarm` 0.596 against
`goblinGreen` 0.584 is **Δ 0.012**. They are separated by hue alone (warm ochre vs sage), and
hue is not reliable on a 6-px head.

> **RULING. A human's visible face is authored at its *shade* tier, never its lit one.** The
> brim/hood overhang throws it, so the face the lens sees measures **≤ 0.45** —
> `mixHex(stoneWarm, timberDark, 0.55)` lands at ≈ 0.450, which is a sanctioned two-token mix
> (art bible §9.13), not a new colour. That gives **Δ 0.134** against his lit skin and puts him
> on the light side of the pair whenever both are in frame.
>
> The rhyme is exact and deliberate: his hood shadow's terminator lands on the *upper third of
> the eyes* so the bright field sits inside a dark head (goblin ref §8.4). Their brim shadow
> takes the *whole* face. **He has a bright thing in a dark head; they have a dark head.**

**FINDING 2 — the crimson adventurer is camouflaged against the treeline.** `cloakCrimson` L
**0.3153**. `palette.ts:126` records the rendered pine crown at **0.314**. That is **Δ 0.001** —
and S1-B2 stages the trio in front of the pine treeline (`world.ts:1385–1400`). This is the
exact failure that killed the goblin's rust tunic, measured at Δ 0.011 and rejected.

> **RULING.** Two valves, in order.
> 1. **Restage first.** The crimson figure takes the frame position whose background is the
>    campfire's lit ground or the paper void, not the treeline. Costs nothing and it is the
>    honest fix: a value clash is a composition problem before it is a palette problem.
> 2. **Calibration knob, if the walk still reads him as flat.** `cloakCrimson` drops toward
>    `timberDark` — range `mixHex(cloakCrimson, timberDark, 0.0 → 0.35)`, L 0.315 → 0.279.
>    **Never past 0.35**, or he converges on `gobCloak`'s band from the other side. Move nothing
>    else in the trio.
>
> **Verify under the night key before shipping either.** 0.314 is a *rendered* figure and the
> night family (`KEY_I_NIGHT 0.55`, `HEMI_I_NIGHT 0.35`) will move both terms. The test is a
> framebuffer readback at S1-B2's authored camera, not a token comparison.

### The chroma law for the cast

> **A cast member's chroma lives in ONE mass — the garment — and nowhere else.** Skin, leather,
> metal, hair, hat band and kit all sit in the film's neutral and earth tokens. No cast member
> carries a second chromatic patch. The goblin is allowed one warm patch at ≤ 12 % of his
> silhouette (`palette.ts:137`); **the cast is allowed zero.**

### One separation rule per stage, both derived from the direction

- **S1 (exterior night) separates by VALUE.** He is small and lit on dusk stone; they are dark
  masses at the bottom of frame. Their chroma is delivered *by the night grade* — nobody
  re-grades a token to get there.
- **S5 (interior) separates by TEMPERATURE.** The room is hearth-warm and candle-warm; he is the
  only cool object in it. This is the only stage where painted humans and a painted goblin share
  a frame at reading scale — t47–50, after the exhale. In the freeze itself (t40.6–47) they are
  graphite and the question does not arise.

## 1.5 The graphite law, and what it demands of the painted state

Direction §13a **G6** is absolute: **the DM, the players, the patrons and the adventurer trio are
never `markAlive`d, in any stage, under any freeze.** The players are in the Performance; the
goblin is the one who crosses. There is no per-stage exception.

The design consequence nobody has stated:

> **A cast figure's painted state must be authored so that draining it to graphite loses nothing
> structural.** Every read the figure has — shoulder line, drape, attribute, the head's shade
> tier — must survive the 4-tier tone quantizer with all colour removed. Practically: the
> figure's whole legibility comes from **silhouette and one value step**, and its colour is
> decoration on top. A figure whose read depends on its hue is a figure that vanishes in the
> film's single most important frame.
>
> **The test:** render the figure at `curtain = 1` at 500 px. If you cannot name what it is
> holding, the attribute is too small; if you cannot find its shoulders, the drape is wrong.

That frame, for the record, is S5-B4: *three graphite figures caught mid-laugh, a graphite die
still wobbling, a graphite mug ring — and one painted goblin walking through them, casting the
only shadow in the room.* Everything in §1 exists to make that frame work.

## 1.6 The roster

| Who | Stages | Silhouette attribute | Garment | Build | Draws (merged) | Per-mesh mats |
|---|---|---|---|---|---|---|
| **Adventurer trio** | S1, S8 (as token discs) | raised sword ×1 · shield ×1 · hat brim ×1 | `cloakIndigo` ×2, `cloakCrimson` ×1 (see FINDING 2) | R — geometry kept, surface rebuilt to the cloth class: sculpted fold masses, `sheet: true`, `dir 1.45`, `poster 3`, committed shadow mass, hem drybrush. **Interior hatch deleted** (`world.ts:1644`). | 4 (cloth · mass · metal · timber) — merge legal, they never move after `t0` | **0** |
| **DM** | S5 | the screen he sits behind | `tavernCloth`, cloth class | R. **Unmerged** — the throw arm is a moving node. Only head in the film above 80 px: eye dots + one mouth mark. | ~5 | **0** |
| **Players ×2** | S5 | mug · character sheet | cloth class, neutral | R, merged as one pair | 3 | **0** |
| **Patrons ×3** | S5 | mug ×2 · nothing ×1 (he is mid-laugh, head back — that *is* his read) | `tavernCloth` | R, merged | 3 | **0** |
| **Ravens ×3** | S3-B6 | the wedge beak and the fanned tail | `ravenSlate` | R. Build is already right (`world.ts:479–546`: fused `blobs()` body, wedge beak, extruded tail blades, plate wings). Surface → trilayer, `sheet: true`, `dir` along the body axis, **`poster 0`** — an ink-dark tier does not tier. **Never touched, never painted** (scene book S3-B6 §3). | 1 merged; the scatter is a transform on each | **0** |
| **The monster** | S6-B2 | the reared bulk and the brow bar | `monsterHide` | R geometry **verbatim**; N surface: 3 quantized tiers riding `roughen()` displacement, never parallel bands. Claws `caveDark`, tusks `gobTooth`, eyes `flameCore`. | 2 | **0** |
| **NPC based miniature** | S6-B5, S7, S8 | its base disc | `cloakIndigo` on a `dieBone` disc one cell across | **N** — the register's one new cast prop | 1 | **0** |

### The monster's shag is the film's word for a broken edge — promote it

`world.ts:3257–3295` builds the shag as **clumps of 3–6 individual three-point tick strokes at
per-tick varying angle**, deterministic via `treeVary`, explicitly authored as *not*-hatch. The
direction already blesses it. This document **promotes it to the film's general vocabulary word
for any broken or fringed edge**, and reuses it three more times below: the **spall** at an
impact (§2.4), the **landing dust** (§4.1), and the fire's **Prep-side fringe** (§3.2). One
authored word, four uses, zero new mechanisms — and it is no-hatch by construction, because the
angle is per-tick.

### The NPC miniature is the cast ladder's own ending

It is deliberately the **least** detailed cast member in the film: at one cell across, its head
is ~2 px and it is a painted silhouette on a visible base. That is not a compromise, it is the
argument. **A token is a figure reduced to its silhouette** — the detail ladder in §1.2, run to
its last rung, arrives at the product. At the S7 flatten every figure in the world resolves to a
token disc, and the miniature is the one that got there early.

---

# 2. THE ATTACKS

## 2.0 Doctrine

> **An attack in this film is a mark someone drew, not an event someone simulated.**

Three consequences, and every specification below is derived from them:

1. **A mark has ends.** A stroke begins and finishes. A particle system does not, which is why
   one can never be authored — it has no first frame and no last.
2. **The same object exists at every `t`.** Nothing spawns, nothing despawns. A thrown thing is
   a built thing being moved, and a mark that "appears" is a mark whose `instanceCount` ramps.
3. **Motion is a position tween of an authored object**, so a backward scrub is the identical
   tween running the other way. The projectionist can un-fire the wizard, which the scene book
   already names as the film's first taste of that power (S1-B3 §6).

**The only glow hue is `amber #F2C35E` and its ramp** (`amberLantern`, `amberEmber`,
`flameCore`). No exception is requested anywhere in this document. `rayGold #A88E3E` survives as
the one non-ink **stroke** colour, for **drawn** light — the S7 god-ray cones and nothing else.
`buildRayBurst`/`rays()` retire film-wide: rays were v1's word for light, and this document
replaces every one of their uses.

## 2.1 The swords

**As held geometry.** The shipped parts list is right — blade, crossguard, grip, pommel
(`world.ts:1235–1252`). Keep it; rebuild the surface to the metal class:

- blade `steel`, guard and pommel `brass`, grip `gobBelt`, all **matte gouache by value**;
- **one authored glint stroke** baked into the paint layer — a miniature painter's dot-and-line
  along the blade's upper third, `mixHex(steel, paper, 0.7)`;
- Prep side: contour + **one** core-shadow stroke;
- rubbed-bright at the grip, where hands go.
- **No specular, no environment reflection, no envmap. Ever.**

**How it reads at 500 px, and why it survives.** The blade is 0.028 world units wide
(`world.ts:1236`). At S1-B3's 37.1 px/unit that is **1.04 px** of fill. A sword that carried its
read in its fill would be invisible.

> It does not. **The sword reads by its LINE.** `sketch()` gives the blade a `'form'` contour on
> each long edge — 1.58 px each at 500 px — bracketing 1.04 px of `steel` fill. **Total 4.2 px
> of bright vertical bar**, held against dusk. That reads, and it is why the raised sword is a
> legal silhouette attribute at this framing while a modelled hand is not.

**The swing — specified, not built.**

> **RULING. There is no sword swing in the shooting script and one must not be added.** S1-B3
> is a bolt and two arrows; the swords are *raised* (`swordRaised = true`), which is the
> ambush's whole posture. A swung blade needs a smear, a smear needs a swept mark, and a swept
> mark is a new mechanism for a beat that does not exist. Skipped.
>
> **If direction ever authors one**, the mechanism is already in the film and costs nothing new:
> a `curveLine()` arc authored **in the shot's view plane** (the `VIEW_R` / `VIEW_CAM` basis,
> `hero.ts:665–675`), drawn `'hero'`, its `LineSegments2` `instanceCount` ramping **on** across
> the swing and **off** behind it — the same self-drawing mechanism the entrance's 152 strokes
> and the travel line both use. One draw, zero materials, reverses by construction. Author it in
> the view plane, never as a 3D ribbon: a ribbon turns edge-on and disappears.

## 2.2 The wizard's bolt — the first ten seconds' loudest object

The shipped bolt (`world.ts:123–136`) is a `polyline` streak plus a `rays()` flare painted
`rayGold`. Both halves retire: `rays()` is going film-wide, and `rayGold` is a *drawn*-light
colour — a wizard's bolt is a Performance-side lit event and belongs on the amber ramp.

> **A bolt is a brush stroke someone loaded and pulled.**

**Geometry — the spindle.** One `LatheGeometry` of a tapered profile, laid **along** its travel
axis. This is `buildFlames`'s own tongue mechanism (`world.ts:154–163`) rotated 90°, so it is
not a new word:

```
profile (radius fraction, length fraction):
  [0.001, 0.00] [0.35, 0.12] [1.00, 0.30] [0.72, 0.55] [0.40, 0.78] [0.001, 1.00]
length 1.10 u · max radius 0.055 u · 12 radial segments
```

Fat one third along, tapering to a point at both ends — which is what a loaded brush actually
leaves on paper, and what a cone or a capsule never does.

**Surface.** Unlit `MeshBasicMaterial` on the shared flame material (§3.2): `amber` body,
`flameCore` heart at the fat point. Fire is the film's only emissive family and a *lit* flame is
a contradiction. **One `'hero'` contour polyline along its upper silhouette edge only** — a
stroke has one lit edge; two would make it a tube.

**The trail is the mark.** The bolt tows a `curveLine()` arc along the path it has just
travelled, `'hero'`, on the amber ramp, whose `instanceCount` **ramps up as it flies and back
down as it dies.** The bolt's read is not the head; it is *the line the head is drawing*. This
is the same self-drawing word as the (unbuilt) sword swing, the travel line and the hero
entrance — one mechanism, every use.

**Read at 500 px, S1-B3 (37.1 px/unit):** spindle **41 × 4 px** of the brightest value in a
dusk frame, towing a 2.55 px arc. At 390 px (28.9 px/unit): **32 × 3 px.** Both read. Compare
the shipped bolt: a 0.45 u polyline at 2.4× scale is 1.08 u of *stroke*, no mass at all, which
is why `world.ts:3830`'s own comment records it reading "as a speck".

**Cost:** 1 draw (spindle) + 1 draw (arc line). Zero per-mesh materials — the spindle shares the
flame material, the arc shares the `'hero'` stroke material painted `amber`.

## 2.3 The arrows

An arrow is **matter, not light** — the metal and timber classes, dark against dusk. And at
S1-B3 a 0.3 u arrow is **11 px**. Eleven pixels of dark stick on a dark field is nothing.

> **RULING. The arrows do not read as objects at this framing and must not try to.** What reads
> is (a) their motion and (b) what they leave.

- **In flight**, the read is a **`'hero'` fletch trail** — a 0.5 u `curveLine` lying along the
  flight axis, `graphiteDark` under the night grade, `instanceCount`-ramped exactly as the
  bolt's arc. The arrow body travels inside its own trail.
- **On landing, the arrow stays.** It becomes a standing arrow in the rock — **the same asset
  class as the three already standing** as S1-B2's residue, and the same ones S7's tended cliff
  clears. The shipped `arrowThrow` sets `visible: false` at `at + 0.3` (`timeline.ts:222`);
  replacing that with a landed transform costs one `tl.set` and buys the film its own continuity
  for free. Reverse-scrub un-plants it.

**This is the beat where the film plants its own future evidence** (scene book S1-B3 §9), and
making the thrown arrows and the remembered arrows literally the same objects is what makes that
claim true rather than thematic. Handoff note, §10.

## 2.4 The impact — three marks landing together

`rays()` retires, so this is the piece with no shipped answer. An impact here is **three authored
marks arriving on the same frame**, and exactly one of them survives:

**1 · The strike mark — permanent.**
One short hard `'hero'` stroke on the surface, at the angle the thing came in. **0.25 u** (9.3 px
@500). Its `instanceCount` ramps 0→full over **0.10 t** and *never comes back down*. It stays for
the rest of the film. This is the keeping layer doing its job: these strikes are the remains the
S7 cliff clears, and permanence is the point. Scrubbing back un-writes it, which is correct.

**2 · The spall — the monster's shag word, reused.**
**4** three-point tick strokes (`polyline`, `'hero'`) flying off the strike point along the
incoming direction's reflection, each at a **per-tick angle** — never parallel, so this is
no-hatch by construction. Authored in the shot's view plane.

> Sizing, and it is the whole difference between reading and not: **0.14–0.26 u each**, which is
> **5–10 px @500**. The instinct is eight ticks at 0.06–0.12 u; that is 2–4 px each and it is
> invisible dirt. **Fewer, bigger.** This is the general rule for every transient mark in this
> film at phone width.

Group-scales 0→1 with `PUPPET.pop` over 0.15 t, then to 0 with `SETTLE.exit` over 0.35 t —
the shipped impact timing (`timeline.ts:214–215`), kept.

**3 · The flash — three flicks, not a starburst.**
**Three** instances of the bolt's own spindle geometry at 0.35 u, at three different angles about
the strike point, on the amber ramp. Three spindles is a hand's three flicks; a radial rosette of
eight is the "diagram, not a drawing" failure `rays()` was already written to avoid and only
half-avoided. Scales with the spall, on the same tween.

**Total footprint ≈ 0.5 u = 19 px @500.** That is a hit.

**Cost per impact:** 3 draws (strike line · spall group · flash group). Three impacts in S1 =
**9 draws, 0 per-mesh materials.** The flash reuses the bolt's `BufferGeometry` by reference.

## 2.5 The near-miss

The most valuable mark in the sequence, because it is what makes the hit rate believable and
the goblin lucky rather than invulnerable.

> **A near-miss has no impact at all.** The bolt's arc passes the rim and the spindle exits
> frame. Two things sell it, and both are free:
> 1. **Depth.** The arc is authored **one `VIEW_CAM` push nearer the camera than his contour**
>    (`hero.ts:670–675`, the marks' own 2.5D depth cheat), so the line crosses visibly *in front
>    of him*. A miss that passes behind reads as a miss at a different distance; a miss that
>    passes in front reads as *nearly hit*.
> 2. **His flinch.** Already authored, already timed (`timeline.ts:231–239`).
>
> **Zero new assets. Zero draws.**

**Staging proposal (handoff, §10):** retime the second arrow at `t6.6` to pass rather than land.
Three attacks, two hits, one miss is a better rhythm than three hits, and the miss is the one
that makes the audience flinch with him.

## 2.6 Scorch, and which layer a permanent mark belongs in

Direction §7: *"Scorch is painted dark pooling, never crosshatch."* Shipped:
`world.ts:1338` `const scorch = contact(0.95, 0.85)` — a hatch disc. Retire.

> **The two-layer rule for permanence:**
> - **A mark that was always there is BAKED.** The campfire's scorch is a dark pool painted into
>   the island albedo at the fire ring. It is not geometry. Zero draws, zero materials, and it
>   cannot be scrubbed away — which is right, because the ground under a nightly campfire is
>   permanently scorched.
> - **A mark that arrives during the film is DRAWN, with a one-way `instanceCount` ramp.** The
>   three strike marks. They must be scrubbable, because the audience watches them happen.
>
> Getting this the wrong way round is how a film ends up with a scorch that pops in and a strike
> that was always there.

## 2.7 The ten seconds, as a shot list

| t | On screen | Marks live | Widest thing | px @500 |
|---|---|---|---|---|
| 0–4.0 | black; caption only | 0 | — | — |
| 4.0–5.5 | the lift: residue, laid fire, arrows standing in rock, trio backs, one goblin on the rim | campfire tongues + embers | the campfire | 23.1 px/u |
| **5.0** | **bolt 1 leaves** — spindle + arc drawing itself | +2 | spindle 41 px | 37.1 px/u |
| 5.55 | **impact 1** at the rim · his flinch | +3 (strike stays) | flash 13 px | |
| 5.9 | arrow 1, fletch trail | +1 | trail 19 px | |
| **6.3** | bolt 2 | +2 | | |
| 6.6 | arrow 2 — **the near-miss**, passing in front of his contour | +1 | | |
| 6.85 | his second flinch, on nothing landing | 0 | | |
| 7.5 | **page turn** — one frame of paper | — | — | |
| 8.1 | impact 3 on the rim, beside him | +3 | flash 21 px | 59.9 px/u |
| 8.4–9.5 | the leap; three position tweens, ears trailing | 0 | | |
| 9.5 | **page turn** hides the fall | — | — | |
| 9.55 | **the landing dust** — 5 comma ticks, not a puff (§4.1) | +1 | ticks 10–17 px | 68.5 px/u |

**Never more than 6 transient marks on screen at once**, and never two of the same kind at the
same instant. That is what keeps a volley reading as *aimed* rather than as weather.

---

# 3. FIRE AND LIGHT

## 3.1 One fire class, four scales

| Scale | Where | Build |
|---|---|---|
| **Campfire** | S1, S3 | `buildFlames` kept (`world.ts:138–188`): 5 lathe tongues, leaning off-vertical, drawn flame profile (belly / waist / licking tip), rooted at the base so the lean swings the tip. **Retire the two `TetrahedronGeometry` embers** at `world.ts:174–182` — a default primitive with a flat fill is art bible §9.5 by name. Replaced by §3.4. |
| **Hearth** | S5 | Same tongues, wider stance. Firebox = **painted dark + coals**: 5–7 `roughen()`ed lumps on `amberEmber`, unlit, inside a `caveDark` box. Retires `world.ts:3059`'s crossHatch. |
| **Candle / candle set** | S5, S6 | The hero lantern's proven teardrop at candle scale (`hero.ts:799–816`): sphere r 0.014 (y × 1.3) `amberLantern` + cone tip + `flameCore` heart r 0.007. Plus the drip stack on the body, which is a keeping mark. |
| **Torch / hand lantern** | S3, and the client's activities 9 and 10 | The lamppost housing at hand scale: glass block, teardrop, dark overhanging rim roof. The bible's three rules hold — the glass is the head's dominant mass, it out-shines its own ground pool, and its **unlit state is bare `paper`.** |

The client's own reference is unanimous on the register: in all ten activity plates he is lit by
**one small warm source he is carrying or standing at** — candle, hearth, lantern, torch. Never a
broad ambient warmth, never a bloom that fills the frame. **The pool is small and the source is
the brightest thing in it.** That is the whole lighting brief for this film's fire, and it is
what the practicals array delivers.

## 3.2 The flame material, and the Prep side — **GAP CLOSED**

The gap: fire is `MeshBasicMaterial`, so it is outside the trilayer and **does not drain with the
curtain.** Direction requires *"Prep side: a still graphite teardrop — a drawn flame, no glow, no
rays."* Nothing in the shipped code does this. A `visible` swap at some curtain threshold would
pop on scrub, which the experience doc bans outright.

> **RULING. One shared `createFlameMaterial()` in the new file, with a three-line
> `onBeforeCompile` mixing toward `graphite` by the film's own curtain uniform, taken by
> identity:**
>
> ```
> shader.uniforms.uFlameCurtain = rig.curtain;   // the SAME { value } object
> // in the fragment:  gl_FragColor.rgb = mix(flameHue, uGraphite, uFlameCurtain);
> ```
>
> - Any partial curtain is a coherent held frame **by construction** — the same argument
>   `trilayer.ts:10–13` makes for every other surface. A scrub cannot pop.
> - `customProgramCacheKey = () => 'flame'` — one program for every fire in the film.
> - The **glow sprite's** opacity takes `(1 − curtain)` from the same uniform, so a drawn fire
>   emits nothing (`rigs.ts:143` already does this for the practical light; this extends it to
>   the painted halo, which today would survive the drain).
> - The Prep teardrop's **fringe** is the monster's shag word: 4 tick strokes at the tongue tips,
>   `'form'`, `graphiteDark`. A drawn flame has a broken edge; a smooth one reads as a leaf.
>
> **Per-mesh materials: ZERO.** Every flame in the film shares this one material. Per-source
> flicker is a **transform** — `flicker(t, ambient, phase)` (`rigs.ts:71–77`) drives the group's
> `scale`, never the material.
>
> **Census consequence:** scene book §6 allocates S6 four per-mesh materials, three of which are
> *"candle flames ×3"*. With a shared flame material those three go to **0**. S6 drops 4 → 1 and
> the film-wide census drops **28 → 25 of 40**. *Verify against the S6 reveal wiring before
> banking it* — a `reveal()` needs a mask shell, not a material, so it should hold, but it is
> measured, not assumed. A candle that is not yet lit has **no flame geometry showing** (group
> scale 0), which is a transform, not a material state.

## 3.3 Glow, and the practicals

**The painted halo.** `buildGlowSprite()` (`hero.ts:829–852`), unchanged: a 128² radial —
`flameCore` 0.95 → `amber` 0.5 @ 0.22 → 0.16 @ 0.55 → 0 @ 1.0, `toneMapped: false`,
`depthWrite: false`, `renderOrder 4`, scale 1.15 (0.9 under 560 px). Plus the curtain-driven
opacity above.

**The lights.** The three-slot practicals array (scene book §6.2), each `{ position, intensity,
phase }` with its own flicker term, all scaled by `(1 − curtain)`. Allocation is already ruled:
S1 one (campfire) · S3 two · S5 two · S6 three · S2/S4/S7/S8 none.

**The lantern ledger, restated as a gate on this document:** *every light source in the film is
one he lit on camera or plausibly maintains.* There is no unmotivated light anywhere. An impact
flash is not a light — it is paint. It emits nothing and it casts nothing. That is why the
flashes cost zero light budget and why they may exist at all in a film with a one-light rig.

## 3.4 Embers

Performance-side painted flats, on the world clock, **frozen mid-air by the tick** by
construction.

**Build.** One merged `BufferGeometry` per fire: **~14 authored 5-point blob flats**, 0.05–0.09 u
each, positions distributed along a shallow convection arc above the fire with **baked phase
offsets in the position itself.** One shared unlit material on the `amberEmber` → `amber` ramp.
**One draw per fire.**

**Motion — and why it is not a loop.**

> A looping emitter needs `mod(t, period)`, and a modulo puts a **teleport at the wrap**, which is
> exactly the discontinuity a scrubbed timeline exposes: drag slowly through the wrap and an
> ember jumps. **So embers do not loop.**
>
> The cloud **bobs**: the group rises and sinks 0.15 u on a 4.3 s sine of `world.t`, and each
> ember's own place on the convection arc is baked in. `y = base + 0.15 · a · sin(world.t · 1.46)`
> — a pure function of `t`, exactly reversible, and at `a = 0` (reduced motion) it is exactly the
> lit pose, as `rigs.ts:42–51` requires. The read is *warm specks shimmering over a fire*, which
> is what a painting of a fire actually shows. It is not a particle system and it must not become
> one.

**Sizing.** 0.05–0.09 u is **2–3 px @500**, 5–9 px @1440. That is knowingly at the floor: embers
are **texture, not read**. The rule that makes them work is count, not size — **≥ 8 or the eye
reads dead pixels.** 14 is the authored number.

**No billboards, anywhere in this film.** A flat is authored facing **the shot's view plane**
(the `VIEW_R`/`VIEW_CAM` basis). The camera is authored rails with no orbits (direction §10), so
a flat authored for S1-B3 is ~20° off in S1-B2 — 94 % of its width, which is nothing. A
per-frame `lookAt` would be machinery for a problem the camera policy already removed.

## 3.5 God-rays — S7 only

> *"`rayGold` painted cones with drawn edge lines, dab-textured fill, hard stop — never a soft
> alpha falloff."* — scene book §6, light kit.

**Geometry.** An **open** `CylinderGeometry(rTop, rBottom, len, 6, 1, true)` — a six-sided open
cone, `side: DoubleSide`, `depthWrite: false`, unlit `MeshBasicMaterial` at `rayGold`. The
**hard stop is the geometry's own end edge, drawn**: two `'form'` polylines along the cone's two
silhouette edges in the shot's view plane, plus one across the stop. That is a painted object
with an edge — which is the ruling — rather than a volumetric, which this renderer has no
language for and which would land as the gradient wash art bible §9.3 fails by name.

**Motion: none.** `RAY_SPIN_RATE` (`motion.ts:83`) dies with `buildRayBurst`. A god-ray is a
shaft of light in a still dawn; a rotating one is a screensaver.

**Optional, if the still shaft reads dead:** ≤ 6 motes drifting *inside* the cone — the ember
word at a `paper`-warm value, one merged geometry, world clock, freezes with everything else.
Costs one draw. Ship only if the walk asks for it.

**Cost:** 2–3 instances sharing one geometry and one material, merged because they are static:
**2 draws total, 0 per-mesh materials.**

---

# 4. THE TRANSIENT SET

## 4.1 Dust — three kinds, and they are different

**a · The landing dust (S1-B5).** The client drew this himself: action plate 5 shows **short
comma ticks around the boots**, not a puff cloud.

Build: **5 short `'hero'` tick strokes** in the shot's view plane, splayed from the contact
point, 0.15–0.25 u each (**10–17 px @500** at B5's 68.5 px/unit). Group-scale 0→1 over 0.12 t
(`power2.out`), 1→0 over 0.25 t (`power2.in`) — the shipped marks at `t9.55` / `t9.63` kept.

This **retires the shipped hack** at `timeline.ts:278`, which repositions `impacts[0]` — a
`rays()` burst — and reuses it as a dust puff. That object is retiring anyway, and a starburst
was never dust.

**b · The frozen dust (S2) — the film's only Prep-side particle.** Direction calls it a *graphite
scribble sprite*.

Build: **5 motes, each one open mark that loops twice** — a lazy 14-point spiral with the stroke
pipeline's own wobble, `'form'` (never `'faint'`: 0.83 px @500), `graphite`. Group-scale
animated on the master lane, so it is **frozen by construction** — it is not on the world clock
and there is nothing for the tick to stop.

> **On the no-hatch gate:** the gate bans **two stroke families over one region as a tone
> device**. A scribble is one continuous mark, and its loops touch at points rather than forming
> a parallel second family. That distinction is the same one the monster's shag already relies on
> and the direction already blessed. **Where a loop would run parallel to its own neighbour for
> more than a third of its length, the mote is re-authored.** Stated so nobody has to guess later.

**c · The disc dust (S4-B5).** *"the disc lifts one pass of dust motes as it turns."* Same comma-
tick word as (a), at set scale, one pass, master lane. **No new asset.**

## 4.2 Sparks

> **RULING. Sparks and spall are one word.** The impact's four tick strokes (§2.4) *are* the
> sparks. On stone they are painted `graphiteDark` and read as chips; on the amber ramp at a bolt
> impact they read as sparks. **One geometry, two paints, one name.** Building a second thing
> called "sparks" would be building the same mark twice.

## 4.3 Smoke — **declined, with the reason**

Smoke is not in the direction's particle register (*motes, moths, embers, dust, pollen, cloud
flats, the graphite dust scribble*), and it should not be added.

> **The doctrinal reason, which outranks the budget one:** this world's fire is *the keeper's*
> fire — a lit lantern, a laid campfire, a tended hearth. **Smoke says "burning"; this film needs
> "lit".** A smoking campfire is a fire going out, and every fire in this film is a fire someone
> has just made.
>
> **The technical reason:** smoke is a soft volumetric, and there is no soft volumetric in this
> language. Every attempt lands as the gradient wash art bible §9.3 fails by name — *"a soft
> radial or linear ramp standing in for form."*
>
> The one place it would be legal is the hearth's flue, and that is off camera. **Skipped.**

## 4.4 Falling snow — **declined, with the mechanism recorded**

No beat in the scene book has falling snow. S4's mountain is a **flat** of reserved-paper snow,
and its being *barely painted* is the doctrinal point (*"nobody has played there yet"*).

> **And it cannot be built the obvious way.** Snow here is **reserved paper** — you paint *around*
> it. Falling snow drawn as white marks would be `paper` on `paper`: invisible by construction.
>
> **If direction ever wants it**, the only legal mechanism is to draw the snow as **its own
> shadow**: `stoneCool`-tier tick strokes, falling. Snow rendered as the marks a painter leaves
> *beside* the flakes. Recorded, not built.

## 4.5 Water

Bible marks water **UNPROVEN** — no hero precedent. By extension, and this document commits to it:

- **Bare paper with a drawn edge line at `'form'` weight**, both banks. A pencil does not fill
  water and the drawing admits it.
- **Shorelines** take the seam's granular frontier (`trilayer.ts:313–325`) as the drybrush where
  water meets land, plus the `triEdge` tide-line — which already *is* a waterline.
- **The one funded pigment use:** a flat `water #679FB4` trilayer band with tangent-aligned lit
  dabs, **S7's river only.**
- **No transparency, no reflection, no specular, ever.**

**Motion: none.** A flowing river needs either a scrolling texture (state, and it reverses into
nothing meaningful) or animated dabs (a second family crossing the first). The world's water is a
painted map's water: it is still, and stillness is correct for a maquette you lean over.

> **The one life granted, if the still river reads dead:** the drawn edge line's `instanceCount`
> **breathes by ±3 segments** on `world.t` — the line redrawing its own end. That is a hand's
> hesitation, not a flow, it costs nothing, and it freezes with everything else. Ship it only if
> the walk asks.

## 4.6 The spill drop (S5)

Two painted droplet flats plus a tabletop splash decal. **Its fall is a master-lane tween, never
world-clocked** — it is frozen in air during the freeze and lands on the exhale, which is the
whole gag. Already specified by scene book §6; recorded here so it is not mistaken for a particle.

---

# 5. THE DIE'S MOTION

The die is the film's one jewel prop and its motion carries a whole beat. Three moments.

## 5.1 The roll (S5-B2)

**Authored inertia, not physics.** The shipped marks (`timeline.ts:614–628`, `SETTLE.heavy`) are
kept. One decision added, and it is the one that makes a die read as a die:

> **A d20's tumble is a sequence of committed faces, not a smooth spin.** A smoothly interpolated
> rotation reads as a fidget spinner, and no amount of easing fixes it.
>
> **Build: three sequential rotation tweens, each about a different axis, each on a `steps(3)`
> ease, then a final `SETTLE.heavy` quarter-turn tip onto the landing face.** GSAP's `steps()` is
> a pure function of tween progress, so it reverses exactly like everything else. Four tweens,
> zero assets.

## 5.2 The wobble inside the freeze — **GAP CLOSED**

`docs/story.md`: *"Everything freezes. **The die is still wobbling slightly.**"*

The die wobbles *during* the freeze — but `world.t` is stopped, so it cannot ride the world clock.
And it must not, because a world-clocked wobble in a stopped world would be the one thing
contradicting the freeze.

> **RULING. The die's freeze wobble is a MASTER-lane tween** — a decaying ±1.5° oscillation
> authored as **5 keys** across t40.6–43.7, on the scroll-scrubbed timeline.
>
> This is not a workaround; it is better than the alternative. **The master lane is the
> audience's own thumb.** The die wobbles as the visitor scrolls and stops when they stop — so
> in a room where time has stopped, the one object still moving is moving *because the viewer is
> moving it.* That is the film's own thesis about who controls the page, delivered by an
> accident of the architecture, and it costs 5 keys and no assets.

## 5.3 The nudge (S5-B6) and the die's crossing

`buildFinger` retires; the full puppet nudges. The die's response: **one face-step rotation plus a
0.4 u roll**, `PUPPET.pop` in, `SETTLE.heavy` out.

**And the die takes paint at the moment of contact** — `reveal()`, 0.6–0.9 s, blooming from its
own centre. It is the **only** object at that table that crosses (direction G6's single
exception). Per-mesh material #8 in the census, already allocated.

## 5.4 The throw (S7-B6) and the morph (S8-B1)

Segmented-arc grammar, already the `die2` recipe. Not re-authored here. One note that belongs to
this document: **the throw's arc gets no trail.** The bolt's arc-drawing word is for a *cast* — an
attack — and using it on the die would say the die was thrown *at* someone. It is thrown at us,
which is a different verb.

---

# 6. THE PAINT BLOOM

Shipped and correct (`curtain.ts:101–186`): the mask takes **the prop's own shape** — a mask-only
copy of its solids, grown from zero about the prop's own centre, returned as a tween so it drops
onto the scrubbed timeline and plays in both directions. `T_REVEAL = 0.8`, ease `SETTLE.arrive`.

Three rules this document adds, all of which are about *not* changing it:

**1 · The bloom's edge is HARD, and that is correct.**

> Somebody will eventually notice that the reveal's silhouette edge is crisp while the seam's
> frontier breaks into granular dabs (`trilayer.ts:313–325`), and will try to "fix" the mask.
> **Do not.** They are two different events with two different edges:
> - the **seam** is *the page's unfinished edge* — where the work stops. It breaks into pigment
>   granules because paint runs out.
> - a **reveal** is *a prop taking its paint back all at once, in its own shape*, because the
>   shape is the prop.
>
> A prop that faded in through a granular frontier would be a prop being *painted*; a prop that
> blooms in its own silhouette is a prop being *switched on*. The second is the film's grammar.

**2 · The bloom's shadow arrives with its colour, for free.** Direction requires *"shadows arrive
with the colour"* (S3-B3, the thesis image). The mechanism is already in place and costs nothing:
the prop's contact darkening is **painted into the island albedo** (§1.3), which sits *under* the
mask — so it reveals with the prop, on the same frame, and can never lag or lead. Nothing to
author and nothing to tune.

**3 · The `radius` fallback is for line-only props only.** `maskShell` falls back to one blob when
a prop has no solids (a grass tuft is a `LineSegments2` and nothing else), and the radius is a
**hard clamp on that object's own size, never a multiple of it** (`curtain.ts:160–167`). Every
transient in this document has solids, so **nothing here uses the fallback.** Stated so a future
effect does not casually reintroduce the airbrushed disc the colour script bans by name.

---

# 7. MOTION-SAFE — the contract

Everything in this document lives on a scroll-scrubbed timeline that runs backwards as often as
forwards.

## 7.1 The one test

> **Set the timeline to `t` approaching from below; set it to `t` approaching from above. The two
> frames must be byte-identical.**

Every construction in §7.3 passes it. Every construction in §7.2 fails it.

## 7.2 Banned outright

- `Math.random()` at runtime. Deterministic seeds only, evaluated at build time — `treeVary`,
  `brand()`, `pencil.ts`'s `rand()`, `bakeStrokeTiles`'s counter. Every mark in this document
  gets its variance from one of those.
- Velocity or position **integrators**. Anything of the form `p += v * dt`.
- **Springs**, damping, inertia solvers. `SETTLE.heavy` is an *ease curve*, which is a pure
  function of progress; a spring is a differential equation, which is not.
- **Particle simulation** of any kind: emitters, lifetimes, pools, spawn/despawn.
- Anything reading `deltaTime` or frame count.
- `onUpdate` callbacks that mutate scene state.
- `mod(t, period)` **wherever the wrap is visible.** This is what rules out looping embers (§3.4).
- **Billboards** — a per-frame `lookAt`. Not because it would break reversal (it would not), but
  because the authored-rail camera policy makes it unnecessary machinery (§3.4).
- `visible` flips **outside** a `tl.set`. A `tl.set` on a GSAP timeline reverses; a raw assignment
  does not.

## 7.3 Legal, and the only forms used here

| Form | Used by |
|---|---|
| `tl.to` / `fromTo` / `set` on transforms | every projectile, every scatter, the die, the leap |
| `tl.to` on a scalar material/shader uniform | the flame's curtain mix, the glow's opacity |
| **`instanceCount` ramps** on `LineSegments2` | the bolt arc, the fletch trails, the strike marks, the sword swing (unbuilt), the water line's breath |
| **group scale** 0→1→0 | impacts, spall, flash, dust, the monster's set-down |
| **pure `f(world.t)`** — `sin`, `cos`, `abs`, no visible discontinuity | fire flicker, ember bob, patron sway, ember-roof shimmer |
| **`steps(n)`** eases | the die's tumble |

## 7.4 The three clocks, and they never mix

- **`world.t`** — freezable. Ambient life only: flicker, embers, sway. **The tick stops it, and
  everything on it is frozen mid-air by construction, with nothing to author.**
- **The master (scroll) lane** — never stops. Every authored beat: projectiles, impacts, dust,
  camera, the die's freeze wobble.
- **`gobT`** — never stops. Banked idles and gait.

> **Nothing in this document is on two clocks.** Where a thing needs to move inside a freeze, it
> goes on the master lane and the reason is recorded (the die, §5.2). Where a thing must stop at
> the tick, it goes on `world.t` and nothing is written to stop it.

## 7.5 Reduced motion

`prefers-reduced-motion` gives `ambient = 0` live via `matchMedia` (`rigs.ts:42–51`), and
`a = 0` must be **still, at the lit pose** — not merely damped.

Every world-clock term in this document takes `ambient` as a multiplier on its **amplitude only**,
so at `a = 0`:

- `flicker(t, 0)` returns `scale 1`, `pulse 1`, `glow = FLICKER.glowBase` — the lit pose exactly
  (`rigs.ts:71–77`, already correct);
- the ember cloud's bob amplitude is 0 and the cloud sits at its arc's authored position;
- the water line's `instanceCount` breath is 0 and the line is fully drawn;
- the god-ray motes, if built, are still at their authored places.

**None of them vanishes and none of them moves.** A reduced-motion viewer sees a lit fire with
embers over it, not an unlit one.

---

# 8. COST

Budgets: **≤120 draw calls per stage**, **≤40 per-mesh materials film-wide** (28 allocated, 12
spare), **≤48 MB texture**, bakes ≤1024² (board 2048² excepted), 60 fps.

## 8.1 Per-mesh materials added by this document: **ZERO**

Everything here is transform-animated or shares a class material. Explicitly:

| Would-be candidate | Why it needs none |
|---|---|
| bolt spindle, flash spindles | share the flame material; motion is transform |
| every flame in the film | one shared `createFlameMaterial()`; flicker is a group scale |
| embers, motes, dust | merged geometry, shared unlit material, group transform |
| god-ray cones | static, merged, one shared material |
| impacts, spall, strike marks | `LineSegments2`, shared `'hero'` stroke material painted by `paint()`'s variant cache |
| ravens, monster, NPC miniature | transform-animated (scene book §6 already rules this) |
| the adventurer trio | static after `t0` — merged per class |

**And it gives three back:** the shared flame material takes S6 from 4 to 1, moving the film-wide
census from **28 → 25 of 40** (§3.2, verify before banking).

## 8.2 New shared materials — 2

Not per-mesh; these belong to the fire/light family, which the bible already carves out of the
trilayer registry.

1. `createFlameMaterial()` — unlit, curtain-mixed, one program via `customProgramCacheKey`.
   Serves every flame, the bolt spindle and the impact flashes.
2. `rayGoldCone` — unlit `MeshBasicMaterial`, S7 only.

The glow sprite's material is shipped (`hero.ts:846–848`).

## 8.3 New bakes: **ZERO. New texture memory: ZERO.**

The cast rides the cloth / skin / leather / metal class bakes already billed in G2. Every effect
in this document is unlit geometry, an authored stroke, or the shipped 128² glow sprite. The
47.9 MB census is untouched.

## 8.4 Draws — designed, to be measured by `scripts/draws.check.ts`

| Stage | This document's contribution | Detail |
|---|---|---|
| **S1** | **≈ 28** | trio merged 4 · bolt 2 · arrows + trails 4 · impacts 9 · campfire 3 (tongues merged / embers / sprite) · landing dust 1 · standing arrows + shield merged 2 · strike marks persist within the 9 |
| **S2** | **1** | the dust scribble group |
| **S3** | **5** | ravens merged 1 · campfire 3 · lantern glow 1 |
| **S4** | **1** | the disc's dust pass |
| **S5** | **≈ 19** | DM unmerged 5 · players 3 · patrons 3 · hearth 3 · candle 2 · spill 2 · die 1 |
| **S6** | **≈ 6** | monster 2 · NPC miniature 1 · candle set 3 |
| **S7** | **2** | god-ray cones merged (cone geo + edge lines) |
| **S8** | **0** | — |

S1 is the heaviest and sits at roughly a quarter of its stage budget with the islands, dressing
and the goblin still to add. Comfortable.

## 8.5 The merge rule this document commits to

> **A cast figure may be merged into its class geometry only if it never moves independently
> within its stage.** S1's trio is `tl.set` once at `t0` and never tweened → merge, 4 draws for
> three people. S5's **DM throws** → he stays unmerged. Everyone else in S5 is static → merge.
>
> `InstancedMesh` is banned film-wide and nothing here reaches for it. The three impacts look
> like an instancing candidate and are not: they fire at three different times, so each needs its
> own `instanceCount` ramp, and the trilayer's `vTriWorld` would sample all three from one world
> point anyway (direction G1).

---

# 9. WHAT THIS ADDS TO THE HATCH ROLL — a finding

The direction's retirement roll counts **31 live `hatch()` / `crossHatch()` call sites in
`world.ts`**, and gate scripts grep for `hatch(`.

**Measured, this session:** `world.ts` also carries **13 `contact()` call sites** —
`world.ts:264, 590, 662, 1257, 1296, 1338, 1638, 1796, 1868, 2311, 2876, 3089, 3145`. And
`contact()` (`pencil.ts:487–500`) **builds a nine-stroke `hatch()` internally** at `pencil.ts:493`.

> **So retiring all 31 named sites leaves 13 hatch fields live on the page**, and a `hatch(` grep
> over `world.ts` will not find any of them.

This is not a new discovery in principle — the goblin's own third hatch field *was* his
`contact()` disc, and direction §7's errata records it as already deleted for exactly this
reason. The roll simply did not generalise the ruling.

**Three of the thirteen are this document's, and all three are retired above:**

| Site | What it is | Retired by |
|---|---|---|
| `world.ts:1257` | `buildAdventurer`'s contact disc — **instantiated 9 times** (trio + DM + 2 players + 3 patrons) | §1.3 — painted contact blobs in the island albedo |
| `world.ts:1338` | the campfire's `scorch` | §2.6 — baked dark pooling |
| `world.ts:1296` | the ambush rock's `rockShadow` | §2.6 — same, it is set dressing on the same island bake |

The other ten belong to other workflows. **Recommend the roll be restated as: 31 named
`hatch()`/`crossHatch()` sites + 13 `contact()` sites = 44 live hatch fields, and that the gate
grep for `contact(` as well as `hatch(`** — otherwise the film can pass its own no-hatch gate
with thirteen hatch fields still drawing.

---

# 10. HANDOFF NOTES — changes needed in files this workflow may not touch

Recorded, not made.

**`world.ts`**

1. `buildAdventurer` — delete the cloak hatch (`:1644`, already on the roll) **and** the
   `contact()` at `:1257`; add the `1.30×` scale (§1.1); drop the two eye spheres at `:1150–1153`
   for every figure below 80 px projected (all but the DM); add one `'form'` jaw contour per head.
2. `buildAmbush` — delete `rockShadow` (`:1296`) and `scorch` (`:1338`); both move into the island
   albedo bake.
3. `buildFlames` — delete the two `TetrahedronGeometry` embers (`:174–182`); the ember cloud
   (§3.4) replaces them.
4. `buildBolt` (`:123–136`) — replaced wholesale by the spindle + arc (§2.2).
5. `buildRayBurst` (`:109–121`) and `pencil.ts`'s `rays()` — retire film-wide once §2.4's impact
   lands; every current caller is replaced above.

**`timeline.ts`**

6. `arrowThrow` (`:218–223`) — replace `tl.set(arrow, { visible: false }, at + 0.3)` with a landed
   transform, so a thrown arrow becomes a standing arrow (§2.3). One `tl.set`; buys S1↔S7
   continuity outright.
7. `boltThrow` (`:209–217`) — the impact is now three marks, not one `rays()` scale (§2.4). The
   timing (`0.15` `back.out(2)` in, `0.35` `SETTLE.exit` out, marks 5.0 / 5.9 / 6.3 / 6.6 / 8.1)
   is unchanged and correct.
8. `timeline.ts:278–280` — the "reused as a dust puff" hack retires with `rays()`; the landing
   dust is its own 5-tick group (§4.1).
9. **Staging proposal:** retime the `t6.6` arrow to a near-miss (§2.5). Zero cost, better rhythm,
   and it is the beat that makes the audience flinch with him.

**`hero.ts`** — no change requested. This document consumes `contourArc`, `mark`, `inkEdges`,
`buildGlowSprite`, the `VIEW_R`/`VIEW_CAM` basis and `bakeIslandAlbedo`'s contact-blob technique
as read.

**`rigs.ts`** (not in the locked set, but adjacent) — the practicals array and the glow sprite's
`(1 − curtain)` opacity (§3.2, §3.3).

---

# 11. HOW TO CHECK

**Scriptable.**

1. `grep -c "hatch(" world.ts` **and** `grep -c "contact(" world.ts` — both must reach 0. Extend
   the existing gate to the second term (§9).
2. No `Math.random`, no `requestAnimationFrame`, no `deltaTime`, no `mod(` on a `t` term, no
   `lookAt` in the new file.
3. Every colour is a `palette.ts` token or a two-token `mixHex` — art bible §9.13, enforced at
   `hero.check.ts:190` and `:265`; extend to the new file.
4. `renderer.info.render.calls` at each stage's authored camera, against §8.4.
5. Per-mesh material census against §8.1: the added count must be **0**.

**Framebuffer.**

6. **The night-key value check (FINDING 2).** Render S1-B2 at its authored camera under
   `KEY_I_NIGHT 0.55` / `HEMI_I_NIGHT 0.35` and read back the crimson adventurer's cloak against
   the pine crown behind him. **Δ ≥ 0.12 encoded luma, or restage (§1.4 valve 1).**
7. **The skin check (FINDING 1).** The human face's shaded region must measure **≤ 0.45** and the
   goblin's lit skin **0.584 ± 0.02** in the same frame. Δ ≥ 0.13.
8. **The graphite-cast check (G6).** Render every cast figure at `curtain = 1`, 500 px. Its
   attribute must be nameable and its shoulder line findable (§1.5).
9. **The flame drain check.** Sweep `curtain` 0 → 1 in 0.05 steps over a lit campfire. The flame's
   colour must move monotonically to `graphite` and the glow sprite's alpha monotonically to 0.
   **No step may differ from its neighbour by more than 1/16 of the total range** — that is what
   proves there is no pop for a scrub to find.
10. **The reversal check, and it is the important one.** For each of t5.0, 5.55, 6.6, 8.1, 9.55,
    40.6, 43.7: seek to `t − 0.001` then to `t`; seek to `t + 0.001` then to `t`. Capture both.
    **The two images must be identical.** This single test catches every banned construction in
    §7.2.

**Human only.**

11. At **500 px**, does the volley read as *aimed at him*? Three attacks, two hits, one miss,
    never more than six marks alive at once.
12. At **500 px**, is the impact a *hit* or a *smudge*? The failure mode is too many marks too
    small — the fix is always **fewer and bigger** (§2.4).
13. In S5-B4's frozen frame: three graphite figures mid-laugh, a graphite die still wobbling, a
    graphite mug ring, one painted goblin walking through them casting the only shadow in the
    room. **If that frame does not land, nothing else in §1 matters.**
