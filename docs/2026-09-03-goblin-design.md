# The Good Goblin — the binding character design

2026-09-03 · Character director of record. **This document is binding.** An engineer builds
from it with no further creative input; an animator acts from it with no further direction.
Every number here is either a build value or a gate, and every gate is objectively checkable.

---

## 0.0 Adjudications from the harness baseline (2026-09-03, binding)

The Class G / Class P harness was built first and measured the shipped figure before any rebuild
(`docs/build/walks/goblin/HARNESS.md`). It reproduced the diagnosis almost exactly, and in doing so
found three places where this document's own gates were unrunnable or self-defeating. Those are
settled here. Where this section and the body of the document disagree, **this section wins.**

1. **G6 face-plane angle — the doc's formula is superseded by the measured ray.** §14's algebraic
   reading (root.y + neck.y + head.y against HERO_AZ) returns 41.7° landscape / 35.7° portrait, and
   §3.4's own prescribed nudge moves it *away* from its 43° target, to 39.4° / 33.4°. The intent of
   the gate is a readable three-quarter, which is a property of the angle between the face plane
   and the actual camera ray — measured at 51.3° at 1440. **G6 is measured as the face-plane normal
   against the him→camera ray**, target 40–48°, and the algebraic formula is retired. Retune the
   pose against the measured reading, not against the formula.

2. **P3's baseline of "0 amber pixels" was a JPEG artifact, not the frame.** The float readback
   holds 74–88 px at 1440 and 20 px at 500 — chroma subsampling in the walk JPEGs flattened a warm
   5-px feature to nothing. **The float framebuffer is the source of truth for every colour gate**;
   walk frames are evidence for the eye, never for a number. The structural failure is unchanged
   and is the one that matters: the far eye returns 0 at every breakpoint and the Class G raycast
   cannot hit it at all. Restate P3 against the float baseline (74–88 / 20), and keep P3b — both
   eyes must return amber, near:far ≤ 2.5:1 — as the gate that actually carries the fix.

3. **P7 cannot pass as written and is amended.** `gobSatchel 0xB08D55` has R−B = 91, over the ≥70
   amber classifier, while §4.2 keeps the satchel as the one warm patch. The 76–99 "off-head amber"
   pixels the harness measured *are* the satchel. **P7 excludes the satchel's projected region** and
   otherwise stands: no amber may appear anywhere else on him.

Two measurement facts that constrain the build, from the same report: the shipped shaded hood
already measures 0.133 encoded — bit for bit the ink value — so rim thickness must be measured
geometrically (mask minus mask-without-shells), never by colour, and `gobCloak` must be checked
against the ink floor before it is tuned darker. And the phone stroke tier (`pencil.ts:34-36`) is
decided by `window.innerWidth < 700` **at module load**, so a true phone-tier reading requires the
browser window to be narrower than 700 before the page loads — calling `__gob(390, 844)` from a
wide window measures the desktop tier at phone framing.

---

## 0.1 Adjudications from the first verify round (2026-09-03, binding)

The adversarial verify pass (`docs/build/walks/goblin/VERIFY-WALK.md`, ledger rows GOB-T1..T16)
failed the rebuild with five blockers and, more usefully, proved that several gates pass **vacuously**
— they report green on work that was never done. Those are settled here, and they win over anything
in the body of this document.

1. **A gate that cannot see its own requirement is a broken gate, and fixing it comes first.**
   Before any further figure work: P2 scans vertically down a lathe whose tier variation runs
   *around* the bell, and its "≥3 plateaux" term is satisfied by the quantisation floor of a smooth
   ramp — re-author it to sample across the form and to reject a monotone decay. P3/P3b count amber
   anywhere inside the head bbox and never ask where — constrain eye position and require the pupil
   to resolve. P4 drops zero and non-finite samples from `rimVals` before computing max:min, hiding
   the exact failure it exists to catch — zeroes are a failure, not a missing sample. G4 returns
   `Infinity` when the ray finds no non-eye hit and passes on it — an unmeasured gate fails.
   A gate may not be reported as green until it has been shown to fail on the defect it guards.

2. **G1 (aspect ≥ 1.45) and G7 (≥ 52 CSS px) have an owner: they are figure work, not framing
   work, and they are in scope.** Both builders declared them out of scope and neither picked them
   up, which is why he is still an unreadable smudge at phone width — the failure the client
   actually named. The aspect is bought in the silhouette (hem width, ear sweep, the bell's taper),
   and the size is bought by the G7 scale solve this document already specifies, capped at 1.35×.
   Ship both. If they trade against each other, the phone read wins.

3. **P1's knob is the CROWN, not the cloak.** The figure builder measured the entire legal
   `gobCloak` range — 0x272E37 → ~0.047, the §4.2 floor 0x232830 → ~0.080 — against a 0.12 gate and
   correctly concluded the gate is unreachable from his side. The gate stands. He owns the frame's
   darkest committed value, which means **the painted crowns behind him lighten** until the
   separation is real. That is legitimate and desirable under THE KEPT WORLD: the scenery is the
   kept thing, he is the keeper, and the keeper reads darkest. Take it out of the crown bakes.

4. **The rim solve belongs to the film, not only to the Cover.** `solveGoblinRim` has four call
   sites and none of them is the film, so the film's goblin keeps a fixed world-unit rim whose
   on-screen weight rides camera distance — the precise failure the screen-space solve exists to
   remove. Wire it into the film. And fix the disagreement between its two existing callers:
   `posterBake.ts:66` passes the supersampled size while `gobMeasure.ts:171` passes the logical
   size, so the baked poster ships its rim at half weight. The logical size is correct.

5. **`aliveShadow` returns to the specified 0.62.** It was raised to 0.97 to clear P6, which
   bought the number at the cost of the read it protects — the shadow became the loudest mass in
   the frame, darker than the figure casting it. If P6 then fails, the fix is the shadow's *shape*
   (it must read as his silhouette drawn a second time), never its opacity.

---

## 0. Status, and what this supersedes

**Status:** BINDING. Adjudicated from `docs/build/direction/GOBLIN-DIAGNOSIS.md` and the three
answers `GOBLIN-A/B/C.md`. Those three are now **rationale, not authority** — where they
disagree with this document, this document wins, and §14 records which of their claims were
killed and why, so nothing is re-litigated from them.

**Supersedes, by name:**

| Source | Line | What it said | What now holds |
|---|---|---|---|
| `docs/2026-09-02-hero-design.md` §4 | 113 | "olive cloak… He is the loudest chroma in the frame by one deliberate step." | §4 below. He owns the frame's **darkest committed value and its only cool hue**; his *chroma* concentrates in the skin and the amber eyes — small, warm, inside a cool dark frame. **Edit that bullet.** |
| `src/film/palette.ts` | 111–114 | "committed rust tunic; the tunic stays the darkest mass in every frame" | Stale — it predates the one-cloak decision and was never built. **Delete the comment; retire `gobTunic`/`gobTunicShade`/`gobHood`/`gobBelt`/`gobSkinLit` from his build.** |
| `src/film/world.ts` | 930–940 | "ONE CLOAK, hood to hem… Olive, same cloth as the hood… His chroma moves to the amber eyes." | **Kept in full except the hue.** One cloak hood-to-hem is right; his chroma moving to the eyes is right; olive is wrong (§4). |
| `src/film/stages/hero.ts` | 1194–1197 | "every three-quarter under a bent hood at the 33° lens collapsed to a featureless dome" | Correctly *observed*, wrongly *diagnosed*. §3.4 proves with the lens geometry that the shipped head is already at a 41° three-quarter. It was a value failure. **Nothing rotates.** |
| `src/film/stages/hero.ts` | 1179–1190 | the P4d ×2.6 shell-scale patch | Deleted with the 19 shells (§5.12). |

**Unchanged and re-signed:** the joint set argued at `world.ts:832–843`. The head-is-half-of-him
proportion. The staged beat — on the path at the seam's leading edge, on the comp's left
third-line, head bent to his work, right glove out of the cloak, caught making it.

---

## 1. Who he is

**The DM's stagehand: a small professional caught mid-task, unbothered that you saw.**

He is not cute, not sneaky, not heroic, not a mascot and not a creature. He is *occupied*. He
got away from the ambush and went straight to work, and the joke of the whole film is that the
world's most magical events are, to him, chores.

**The one adjective the silhouette must sell: INTENT.** A 36-px black shape has to say *that
small thing is DOING something* before you can see what it is.

**He wears theatre blacks.** A stage crew dresses in dark, non-reflective cloth so it
disappears against the set. That is his job description, it is why his garment is the frame's
one committed dark, and it is the argument the palette has been missing (§4).

**He is audience-aware.** `story.md:19` gives the narrator "That was me"; `:47` is "Looks at the
die. **Looks at us.** Shrugs"; he waves in S2 and smiles at the cliff. He knows we are here in
at least four beats. He is simply too busy to make a performance of it.

---

## 2. The silhouette contract

Five marks, in strict priority order. **If a size cut bites, drop from the bottom.** This order
is the directable brief: an engineer trading pixels sacrifices 5 first, never 1.

1. **A leaning dark bell**, one unbroken curve from crown to hem, tilted forward over the work.
   The line of action *is* the outline.
2. **Two ear blades breaking UP and OUT at unequal angles.** The goblin identifier, and the
   wordmark's own shape. Ears buy **height**; the right tip is the highest point of the figure.
   This is what kills the mushroom.
3. **Two amber dots** in the dark of the hood. The only warm pixels on him.
4. **The pencil notch** — a triangle of clean paper between the working arm's underside, the
   body's front, and the ground. Negative space does the verb: arm out = at work. The pale
   pencil crosses that notch as a light stroke on dark.
5. **A contact pool** under the boots. He is *on* the ground, not near it.

### The three reads

**36 px (phone; figure ≥ 52 px — see §11.2).** A dark bell with a big round head carried
forward off it; two unequal blades up and out; one bright double-dot in the dark; a pale stick
crossing open paper in front. Five marks. That is the entire budget and it is enough.

**150 px.** The bell resolves into three shingled cloth bands with a flick trailing behind; the
blades resolve into ears (one ringed); the double-dot into two amber eyes over a dark nose; the
stick into a fat carpenter's pencil in a dark mitt; boots under the hem; the satchel's warm
patch on the back curve; the hood hem as a brow line; the nose-and-chin zigzag breaking the
face contour.

**Full frame / 6× zoom.** Poster tiers with visible drybrush at every rim; the authored stroke
tiles carrying his graphite tone; the whittled collar and graphite core; the tooth nub; the
earring; the patch pocket's stitch line; the drawn contours registered *at* the silhouette
exactly as the oak crowns are (`hero.ts:906–960`). **Nothing new appears at zoom that
contradicts the 36-px read** — zoom adds craft, never information.

### Negative space inventory (what the paper does)

| Space | Job | Minimum at phone |
|---|---|---|
| The work triangle (arm underside / body front / ground) | says *doing something* | 4 × 4 px |
| The keyhole under the chin | separates hunched worker from stacked snowman | 1 px notch |
| The ear V between the two blades | reads "goblin", not "hat" | 2 px |
| Under the lifted front hem, between the boots | says *feet on ground, mid-stance* | 2 px |

### Hard silhouette numbers

Let **H** = figure height, soles to crown of skull (ears excluded). Rig H = 0.9 units.

- **Aspect (height incl. ear tips : max width incl. ears) ≥ 1.45 : 1 at every breakpoint.**
  Shipped measures 0.91–1.13 — wider than tall. This is the first gate the rebuild must pass.
- Cloak hem is the widest *body* element: hem width **0.42 H**. Head width **0.34 H**.
  **Head : hem = 0.81** (shipped 1.97–2.50 : 1).
- **Right ear** swept **0.55 rad (31.5°) off vertical** — tip at **1.10 H**, the highest point
  of the figure, horizontal reach 0.29 H. **Left ear** swept **0.85 rad (48.7°)** — tip at
  0.98 H, reach 0.38 H. Both keep `rotation.y = side * 0.22`.
  `world.ts:1101`'s `pivot.rotation.z = -side * 1.3` (≈75° both sides) **is the mushroom cap.**
- Max total width **0.72 H**; height incl. the right ear tip **1.10 H** → **1.53 : 1 at rest,
  pose-independent.**

---

## 3. Proportion sheet

Origin at soles, faces +z, rig-native units, H = 0.9. `RIG` (`world.ts:815–830`) is unchanged —
the skeleton is signed off; these are the *mass* proportions drawn on it.

| Landmark | Height | Width note |
|---|---|---|
| Boot soles | 0 – 0.04 H | |
| Cloak hem (widest point) | 0.09 H | width 0.42 H — boots read below it |
| Hem → yoke, three shingled bands | 0.09 – 0.46 H | tapers 0.42 → 0.24 H |
| Shoulder / cowl | 0.42 H | `RIG.shoulderY` unchanged |
| Chin | 0.36 H | head overlaps the yoke — sunk collar, no neck |
| Head mass, chin → crown incl. hood | 0.36 – 0.86 H | **head = 0.50 H — kept** |
| Eye line | 0.60 H | widest skull point |
| Crown | 0.86 H | |
| Right ear tip | **1.10 H** | the figure's highest point |
| Left ear tip | 0.98 H | |

Limbs: arm chain 0.32 H (`RIG.upper` + `fore` + `hand`), legs thigh 0.09 + shin 0.09 + ankle
0.02 — all unchanged, because `reachSolve` and `crouchPose` read them.

### 3.1 Line of action

One forward C that **reverses at the top** — that reversal is the whole difference between a
curve and a plumb line with a kink:

```
hip 0 → sternum +0.34 → skull base +0.50 → skull −0.06 (the head lifts against the fold)
```

Net: the crown sits **0.10 H forward of the heels**, the pencil's ground contact 0.20 H beyond
that, and the hem flick trails 0.10 H *behind* the heels as the counterweight.

### 3.2 Weight

**58 / 42, loaded on the working side.** Authored as the existing verb, not as new numbers:
`weightShift(tl, g, 0, 0, WORKING_SIDE, 0.55)` → `pelvis.rotation.z = -0.0495`,
`chest.rotation.z = +0.0715`. Stance staggered: working foot forward, back heel rolled onto its
toe. He is never symmetric, in any frame, ever.

### 3.3 Handedness — pinned once, forever

**`export const WORKING_SIDE = 1` (his RIGHT).** Exported from `world.ts` beside `RIG`. Every
beat, both ear treatments, the stow, the pocket and the poster bake read it. It is not a
per-beat decision. Consequences that follow from it and are therefore also fixed:

- the pencil parks behind the **right** ear (a carpenter stows with the hand that holds it);
- the right ear is therefore the **tall, clean** blade — the silhouette's apex — and carries no
  furniture but the parked pencil;
- the **earring hangs on the left** (the low, swept blade, where a ring reads as a ring);
- the **ear bandage is deleted** (§7) — the nick already in `earShape` (`world.ts:1081`) tells
  the same story for zero pixels;
- the patch pocket sits on the **right** front skirt (§7);
- at the hero stage the right shoulder is camera-side. Verified: `cameraSideArm(1.60, [0.95, z],
  cam)` returns +1 at both `HERO_AZ` 18° and `HERO_AZ_PORTRAIT` 24°.

### 3.4 The three-quarter — SETTLED, and nothing rotates

`hero.ts:1194–1197` recorded a real observation and drew the wrong conclusion, and all three
direction docs inherited it. The lens geometry:

- Camera at `HERO_ELEV` 33°, `HERO_AZ` 18° → the him→camera direction in xz ≈ **(0.309, −0.951)**.
- His body at `root.rotation.y = 1.60` faces **+x** — his work, the unpainted path. That is the
  premise of the poster and it is non-negotiable.
- The **head** carries `neck.rotation.y 0.15 + head.rotation.y 0.35` on top of the body, so the
  face plane sits at θ ≈ 2.10, whose dot with the lens is 0.75 → **41° off the lens axis.**

**41° is a three-quarter.** The shipped staging was already there. The P4 dome collapse was a
*value* failure — a mid-olive hood in front of mid-olive trees with a sunk eye has no interior
edge to find — exactly as GOBLIN-C argued, while C's proposed remedy (`rotation.y → 1.15`) turns
him to **96° off the lens**, i.e. further away. That number is dead.

**DECISION.** Root stays **1.60**. The head-turn nudges to **`neck.y 0.16` + `head.y 0.38`
(→ 43°)** so both eyes clear the nose at 150 px, and that is the entire restage. There is no
restage round, no fallback stage, and no open question. The gate is `G6`: the face-plane-to-lens
angle must measure **40–48°** at every breakpoint, and `P3b`: both eyes must return amber, the
near eye no more than 2.5× the far one's pixel count — a three-quarter shows two eyes,
unequally.

---

## 4. Materials, colour, and the seam

### 4.1 The palette adjudication

Three signed sources disagreed and none of the three direction docs settled it. Settled here:

- `palette.ts:111–114` (rust, "the darkest mass") is **stale** — it predates the one-cloak
  decision, was never built, and its own file contradicts it eleven lines later.
- `world.ts:930–940` + `palette.ts:122/124` ("ONE CLOAK… olive… his chroma moves to the amber
  eyes") is the **later, argued** decision. Its *structure* is right and is kept whole.
- `hero-design.md:113` ("the loudest chroma in the frame") is **overridden here**, on merit.

**Rust is dead, and not because of a citation.** `gobTunic 0x9C3A22` measures 0.303 encoded
luma against the rendered pine crown's 0.314 — it fails the separation gate by 0.011. Worse, he
stands on an ochre path (`earthTrack`, 0.545) beside warm earth: a rust figure on a warm ground
is camouflage. **Olive is dead** for the reason the diagnosis measured: he becomes a third tree.

**He owns VALUE, and he owns the frame's one cool hue.** The world is warm green and ochre on
paper. The colour missing from it is a cool dark, and a cool dark is what a stagehand wears.

### 4.2 The character palette — three values, everything else by value

| Token | Hex | Encoded luma | Owns | Rule |
|---|---|---|---|---|
| **`gobCloak`** *(new)* | `0x2E3742` | **0.211** | cloak ×3 bands, hood + peak + tail, hem flick, patch pocket, collar | cool slate — theatre blacks. **No other object in the world may take this value band.** |
| **`gobCloakWorn`** *(new)* | `0x59626B` | 0.379 | mitts, cuffs, boots | the same cloth, worn pale. **A value tier, not a fourth hue.** |
| **`gobSkin`** = `goblinGreen` | `0x84A058` | 0.600 | face, ears, arms, legs | green is his alone by palette law |
| `gobEarInner` | `0x5C7A2E` | 0.430 | inner ear, **and the nose** | the shipped nose was skin-on-skin and 3 % visible |
| **`amber`** | `0xF2C35E` | 0.770 | **the eyes, and nothing else on him** | unlit `MeshBasicMaterial` (§6) |
| `gobSatchel` | `0xB08D55` | 0.550 | satchel + strap | the ONE warm patch — earns it in the C2 over-shoulder follow, capped at 12 % of his silhouette area |
| `dieBone` | `0xECE2CA` | 0.880 | **pencil body** (inverted — §7) | |
| `graphiteDark` | `0x4A4844` | 0.280 | pencil core | |
| `brass` | `0xB0913F` | 0.550 | one earring, left | |
| `gobTooth` | `0xF0EDE4` | 0.930 | the fang nub | |
| `ink` | `0x222222` | 0.133 | 2 shells, ~12 marks, pupils | |

**Retired from his build entirely:** `gobTunic`, `gobTunicShade`, `gobHood`, `gobBelt`,
`gobSkinLit`, `bedroll`, **and `timberDark`.** Failure 11's five-parts-one-hex dies by
construction: after this, `timberDark` appears **zero times** in `buildGoblin` (gate `G9`).

**Calibration knob.** If gate `P1` fails on a live walk, the knob is `gobCloak`'s value and the
range is `0x2E3742` → `0x272E37` (luma 0.211 → 0.175). **Never below `0x232830`** (0.152) —
below that he is within 2/255 of ink and reads as a hole, not a garment. Move nothing else.

### 4.3 Trilayer channels, per part

Every solid is `createTrilayer({ color, wear, poster, stroke: { dir, sheet: true } })`.
**Zero `fillMaterial`, zero `paint({fill})`, zero `blobs()`.** `paint()` survives on him only
for the `line`/`ink` channels. `QUIET_PIGMENT` (`pencil.ts:184–200`) stops applying to him
because nothing of his routes through a `paint()` fill any more — the protagonist stops being
the least painted object on the page.

| Part | color | wear | poster | stroke dir (rad) |
|---|---|---|---|---|
| Cloak bands ×3, pocket | `gobCloak` | 0.26 | **10** | 1.45 (near-vertical — drape falls) |
| Hem flick | `gobCloak` | 0.26 | 10 | 1.45 (same family as the skirt) |
| Hood, peak, tail, collar | `gobCloak` | 0.26 | 10 | 1.45 |
| Skull | `gobSkin` | 0.22 | **12** | 0.55 |
| Ears | `gobSkin` | 0.22 | 12 | along each blade: R 1.02, L 0.72 |
| Nose, inner ear | `gobEarInner` | 0.22 | 12 | 0.55 |
| Arm + leg segments | `gobSkin` | 0.22 | **12** | 0.55 |
| Mitts, cuffs, boots | `gobCloakWorn` | 0.24 | **10** | 0.20 |
| Satchel + strap | `gobSatchel` | 0.25 | 8 | 0.61 |
| Pencil body | `dieBone` | 0.20 | **6** | 1.50 (along the shaft) |
| Contact pool | `caveDark`, `feather: 0.5` | 0 | 0 | — |

**One direction per part, `sheet: true` on every organic mass.** The no-hatching gate is met by
construction, and the three hatch fields on him — flank `world.ts:978`, jaw `:1211`, `contact()`
`:1277` — are **deleted, not restyled. [DONE 2026-09-03: `buildGoblin` greps clean for `hatch(`,
`contact(`, `blobs(`, `timberDark` and `paint(…fill:` — gate `G9` passes. Note for the other docs:
the world direction's §7 and §14 named the third patch as "`1366` goblin cloak tone"; `1366` is
**the adventurer's** cloak tone, inside `buildAdventurer` (now `world.ts:1644`), still live, and it
retires under the cast tier's "zero interior hatch", not here. The direction and the scene book are
corrected.]**

**Why poster 10 on the cloth and 12 on the skin.** `uTriPoster` quantizes lit luminance across
the whole [0,1] (`trilayer.ts:264–267`), and `hero.ts:947` records poster 12 yielding only ~3–4
tiers on a mid-value crown — a **dark** mass needs *more* steps to show any tier at all, not
fewer. At poster 10 a cloak whose lit luminance spans ~0.03–0.25 lands 3 committed plateaux
(0.05 / 0.15 / 0.25). That is A's "fewer, harder tiers on a small figure" and B's dark-mass
arithmetic agreeing. **Nothing on him runs poster 0** — smooth Lambert beside tiered gouache is
precisely the defect the diagnosis measured, and it must not come back on the limbs.

### 4.4 The seam, the curtain, and his contour

`markAlive(goblin.root)` stays. `uTriAlive = 1` zeroes `max(curtain, seam)` for every material
of his (`trilayer.ts:299`), so **he keeps his paint in every state** — the brand's whole payoff.

He stands at x 0.95 against `SEAM_X` 1.0 with **`SEAM_W` 0.2** (not the trilayer default 0.6 —
the hero stages a worked edge) and `SEAM_WOB` 0.75, so the wobbled blend band crosses him.

**The standing rule, so this is never re-litigated:** *his ink shells and authored marks carry
no seam, curtain or alive uniform — and they never need one, because he is alive everywhere.
His fills never change state, so his contour never disagrees with them. The single exception is
the entrance.*

**The entrance is one channel, not two.** `gobBirth(part, t)` (a) writes the part material's
`alive` uniform and (b) sets that part's shell/mark `LineMaterial.opacity` from the same curve.
An unborn part must not carry a full-strength ink contour. It is a pure function of timeline
progress — no state, scrub-safe.

**Per-part paint stagger, inside the hero bloom** (the best single character idea in the three
docs, and it rides the existing `uTriBirth` machinery):

```
pencil + mitt  0 ms
working arm  120 ms
head + ears  240 ms
cloak upper  360 ms
hem + legs   480 ms
```

*The tool wakes first; the maker is painted by his own work.*

### 4.5 The Prep rig — his best state, not his weakest

All three docs waved this away in a sentence. The facts (`rigs.ts:134–157`):

`flat.intensity = FLAT_I * c` (paper ambient rises to 0.9), and **`key.intensity` never
changes** — the alive keep their private warm key in both states. At full curtain the world's
materials discard lighting entirely (they render `triUnder`), so **he is the only lit object on
the page**, with a 2.2 : 0.9 key-to-fill ratio. He has a decisive shade side under Prep, and his
poster tiers commit there exactly as they do under Performance.

Two things are therefore authored, not assumed:

1. **He must not read as a hole.** A near-ink mass against near-paper is the strongest read in
   the film and also the easiest to over-shoot. `wear` 0.26 drybrushes his rims toward paper
   (`triWearF` is view-dependent only, so it works under flat light too), the satchel's warm
   patch breaks the bell, and the `gobCloak` floor of §4.2 holds. Gate `P8`.
2. **Form comes from the drawn line.** Under Prep his two shells and ~12 marks are doing more
   work than under Performance. They are the same lines; nothing is added for Prep.

---

## 5. Construction — part by part

Vocabulary is strictly what the island proved: closed lathe bands + `roughen`, extruded beveled
profiles, `sketch()` contours, `mark()`/`contourArc()` strokes, `createTrilayer`. **The
marching-cubes `blobs()` hands and feet are banned from this figure** — 8,280 tris of brown
lumps, each drawn twice, to make four shapes under 60 px².

| # | Part | Technique | Tris |
|---|---|---|---|
| 1 | **Cloak, 3 stacked lathe bands** — hem (0.09–0.22 H), skirt (0.22–0.36 H), yoke (0.36–0.46 H); 5–6 authored points × 20 radial each; each band's top radius steps **in 0.006** under the band above so a shingle line runs twice around him; `roughen(g, 0.010, 8, seed)` with three distinct seeds; `scale.z 0.88`. Profiles climb hem-first or the normals flip (`world.ts:943`). Each band its own trilayer instance, so §4.4's per-part birth is stageable at all. | 1,400 |
| 2 | **Hem flick** — one authored `Shape`, a soft cloth point 0.14 H long, extruded 0.014 with bevel, at the hem rear trailing −z. **Its own `hemFlick` group.** The only asymmetry on a lathe garment and the tail of the line of action. | 220 |
| 3 | **Patch pocket** — small extruded beveled plate on the front-**right** skirt, one drawn stitch line. The d20's home (§7), the second asymmetry, and the target for the hands-in-pockets amble. Three jobs. | 120 |
| 4 | **Hood** — the shipped window-cut cowl recipe kept verbatim (`world.ts:1035–1046`), plus peak cone and tail cone. Material changes, geometry does not. | 640 |
| 5 | **Skull** — the authored 11-point chestnut lathe kept verbatim (`world.ts:998–1002`), 22 segments, `scale (1.18, 0.86, 0.9)`. It is proven; do not touch it. | 900 |
| 6 | **Ears ×2 + inner ×2** — the wedge `Shape` and beveled `ExtrudeGeometry` kept (`world.ts:1077–1092`), blade trimmed 13 %. **New pivots: right `rotation.z = -0.55`, left `+0.85`** (§2). Contour by two authored `mark()` strokes base→tip per blade, `'form'` — the roots' two-side treatment. No shell. | 760 |
| 7 | **Eyes ×2** — `SphereGeometry` r 0.062, 12×8, z-scale 0.55, **`position.z = 0.135`** (shipped 0.102 sat *inside* a skull whose z half-depth is ~0.122). Ink slit pupil, paper glint. `MeshBasicMaterial({ color: amber, fog: false })`. | 300 |
| 8 | **Face furniture** — brows (ink arcs), nose (button sphere, now `gobEarInner`), mouth (ink torus arc), fang. Bottom-loaded layout kept. **The jaw hatch is deleted** — the jaw's underside tone comes from the skull's poster tiers, which is where tone comes from everywhere else in the film. | 270 |
| 9 | **Arms ×2** — `limb()` cones at 8 radial, cuffs kept. **Mitts: authored 7-point mitten lathe** (palm-swell profile, 10 segments, `scale 1/0.7/0.55`) + one drawn thumb `mark()`. ~260 each, against the blobs' 2,160 ×2 draws. | 1,280 |
| 10 | **Legs ×2 + boots** — `limb()` cones at 8 radial; the joints stay (Nimble Escape needs knees), the meat goes. **Shin wraps deleted** — never visible. Feet: one authored side-profile boot `Shape` per foot, extruded 0.05 with bevel, toes out ±0.12, **toe pivot retained** so contact frames don't slide. | 920 |
| 11 | **Satchel + strap** | 150 |
| 12 | **Pencil** — `buildPencil()` geometry kept, **values inverted** (§7). Scale ×1.35 relative to him. | 350 |
| 13 | **Earring** (left) | 72 |
| 14 | **Contact pool** — one feathered `createTrilayer` disc (§8) | 64 |
| 15 | **Two ink shells** — `sketch()` BackSide contours over **coarse silhouette proxies** of the merged head group (skull + hood + peak + tail at half the lathe/sphere resolution) and the merged cloak group (3 bands + pocket). A 12-segment proxy's silhouette sits ≤ 0.6 CSS px inside the 22-segment fill's, well under the 3.2 px rim it carries. | ~1,530 |
| 16 | **~12 authored marks** — 2 per ear, 2 on the hem flick (its two long edges), 1 hood front hem arc, 1 chin–jaw, 1 thumb per mitt, 1 pencil-arm underside, 1 front hem ellipse, 1 pocket stitch | ~220 |

**Totals: ≈ 9,300 triangles, ≈ 44 draw calls** (≈ 30 solids + 2 shells + ~12 line objects).
Shipped: **~56,800 tris and ~102 draw calls** for the same figure. **He hands the film back
~47,500 triangles and ~58 draw calls.** All solids share the one trilayer program
(`customProgramCacheKey`, `trilayer.ts:511`) — no new shader compiles, ever.

### 5.12 The drawn line — two shells, px-solved

Nineteen independent shells with a 6.3 : 1 weight variance, beading to 0.97 px at 390, is
replaced by **exactly two**, and the thickness is a **screen-space quantity, not a world
constant** — this is the mechanically correct fix and it is what wins over deleting the outline
altogether:

```
shellWorld = TARGET_PX / (pxPerUnit(width, height) * rootScale)
pxPerUnit  = height / (2 * heroFraming(width,height).d * tan(HERO_FOV/2))
TARGET_PX  = 3.2      // asserted 2.6–3.6 at every breakpoint
```

`sketch()`'s fourth argument is already a world-unit rim scaled by the geometry's bounding
radius, so it takes this directly. **Solved at layout time, re-solved on resize** (the same
place `setPencilResolution` already runs).

Interior separations are authored `mark()` polylines at `'form'` (2.1 px, 1.6 px on the phone
tier). **Weight system on the figure: `hero` (the two shells) and `form` (the marks). Nothing
fainter. Maximum ratio 1.7 : 1, by construction.**

**The hem flick is never merged into the cloak shell.** It animates; a merged static shell
cannot follow it. Its contour is its two authored edge marks, which is what a draughtsman draws
on a cloth point anyway.

**Zero shells is rejected.** `trilayer.ts:304–305` lightens rims *toward paper* — on the
graphite half a wear-only rim against a paper ground is not a contour. The trees get away with
it because the trees never move; an authored contour parented across chest and hem groups drifts
off the silhouette the moment those joints rotate. Two px-solved shells stay.

---

## 6. Face and eye

**At phone width the face is a value sandwich, not features:** darkest (hood frame) → mid (skin
window) → lightest (amber eyes). At 390 × 844 the figure is ≥ 52 px, head ~26 px wide, face
window ~15 px, each eye ~5 px, the two nearly touching, pupil a 2 px slit.

- **The eyes are unlit `MeshBasicMaterial` amber.** They cannot go muddy under any rig, any
  curtain state, any grade — guaranteed warm pixels at every size, and the one thing on him that
  never drains.
- **The limit:** value never exceeds `lanternGlass 0xF2E2B4`. **No emissive, no bloom, no halo,
  no glow sprite.** They are painted lanterns; they light nothing. Amber *glow FX* belongs to
  fire and the lantern, and the lantern stays the brightest amber in every frame.
- **Geometric gate, not a vibe:** a raycast down the shipped lens must hit the eye's front cap
  **≥ 0.03 rig units before** the skull surface. Shipped: the skull won by 0.064. Gate `G4`.
- **Pixel gate:** ≥ 40 amber pixels (R−B ≥ 70) inside the head bbox at 390 × 844, ≥ 250 at
  1440 × 900. Shipped: **0 and 0.** Gate `P3`.
- Eye diameter = 22 % of head height. Blink is `lids scale.y`, 90 ms down / 140 ms up, with an
  18 % chance of a second blink at +180 ms.
- **Brow = the hood hem.** The cowl slides ±0.02 y as an expression channel — more hood =
  determined, less = surprised. Cheap, silhouette-safe, reads at 150 px.
- **Expression at distance is the EARS**, already the shipped doctrine (`actions.ts:305`) and now
  better: the up-ear's droop changes the figure's *apex*, so a mood change is legible at 36 px.
  The eyes carry presence; the ears carry mood.
- **`pupils`** — one group offsetting both slit pupils ±0.006 u. The look-at-viewer micro-saccade
  lands here, and it is the only thing that makes that beat read at 150 px.
- **The wordmark test.** Dark hood plate + two up-ears + two bright eyes: the 3D head at 60 px
  and the flat mark now depict the same creature *by construction*. That was the single most
  damning line in the diagnosis and this is the answer to it.

---

## 7. Costume and props

**One garment, hood to hem** — the shipped decision (`world.ts:936–940`), kept, recoloured. Three
shingled bands, a hem flick, a patch pocket. Under it: `gobCloakWorn` mitts, cuffs and boots.
On it: the back satchel (the one warm patch), one brass earring on the **left** ear, the collar
pool at the neck. **At rest both mitts live under the cloak; a reach brings a glove out, which
is an event** — the shipped charm, kept, and now also a value event (a dark glove crossing pale
paper).

**Deleted:** the ear bandage (a lump on the apex blade; the ear's existing nick tells it), the
shin wraps (never visible), every belt/tunic-layer/pauldron already litigated out.

### The pencil — his icon, and its values are inverted

`buildPencil()`'s geometry is right and its two-value instinct is right. Its **assignment** is
what made "a goblin with a pencil" illegible: a `timberDark` body in a `timberDark` mitt is one
continuous brown mass with a stick.

**Body → `dieBone` (pale cedar, 0.88). Core → `graphiteDark` (0.28). Mitt → `gobCloakWorn`
(0.379) on a `gobCloak` sleeve (0.211).** A whittled carpenter's pencil *is* pale wood, so this
is more true, not less — and it gives a value gradient along the tool that separates from
whatever is behind it at every stage of the shot: a **pale bar** against his dark mitt and
against mid grass, ending in a **dark tip** where it touches the near-paper graphite half.

Staging contract:

- length **22 % of H** — oversized the way his head is oversized; the tool is an icon, not an
  accessory;
- gripped at the top third, axis **40° off the forearm** — **never parallel to a limb**
  (parallel is the shipped lozenge merge);
- **the tip touches the ground line**, inside the work triangle, so its full length crosses
  ground value and never his own cloak;
- **the stow:** between beats it parks **behind the right ear**, decorating the silhouette's
  apex. **Always show the stow** — a 120 ms tuck before any run or haul. Never into the satchel:
  an invisible tool is a deleted premise.

### The d20's home — settled

`story.md:76` is the film's last image and no doc gave the die a pocket. **It lives in the patch
pocket on the front-right skirt** (§5 part 3). The cliff beat is `pocket()` → `throw()`: one
reach into the skirt at his own hip, which is a shorter, more legible action than a satchel dig,
and the pocket is on the working side by §3.3.

---

## 8. Weight, contact, and the shadow rule

Three devices. All cheap, all always-on, none dependent on which side of the seam his feet are on.

**1. The contact pool.** A **feathered `createTrilayer` disc** — 0.34 H × 0.20 H, `feather: 0.5`,
`caveDark` at low opacity — parented to `root` under the stance centre, offset +0.03 in x away
from the key. It is **NOT marked alive**, and that is the whole trick: the material grammar then
grounds him for free on both sides of any seam. Painted side → a gouache shadow blob, exactly
what every painted prop gets (`hero.ts:504`). Graphite side → its own underdrawing, a dark-tier
stroke smudge: *the drawn contact smear, from the same mesh, with zero staging.*

- **Not** the islandKit drop-shadow shader. That shader multiplies alpha by `(1.0 - cSeam)`
  (`islandKit.ts:47`) so it **vanishes** past the seam and under the curtain — the exact opposite
  of the persistence required — and it carries no alive uniform. Its alpha is 0.24, not 0.34.
- `markAlive` traverses `root`, so the pool needs an explicit carve-out: **one line in
  `curtain.ts:63` — `if (child.userData.neverAlive) return;`** — and `pool.userData.neverAlive =
  true`. No doc mentioned this and it silently breaks the whole device.
- The `stageGoblin` hide-loop (`hero.ts:1201–1203`), which hid every root child but the pelvis
  and so silently deleted his grounding, **is deleted.** So is `contact()`'s nine-hatch field.
- **Animator rule: feet may leave the pool; the pool never leaves the feet.** In a jump the pool
  stays on the ground and shrinks 20 % — one tween, the classic and cheapest height cue.

**2. The baked contact blob.** The ground albedo's painted blob at his stance (`hero.ts:524`)
darkens 0.3 → **0.4** and tightens to r 24, so paint, pool and boots agree.

**3. The crossing cast shadow — kept, and re-aimed.** No doc re-argued it; it is re-argued here.
`KEY_POS(-4, 3.95, -4)` throws his shadow from x 0.95 out to **x 1.79** — past `SEAM_X` 1.0 and
past the band's far edge at 1.2, entirely onto the graphite half. **That is correct and it is the
poster's signature**: on a frozen page the only shadow belongs to what is alive, and his
silhouette appears twice — once in colour, once as a drawn shadow on the paper. What is broken is
that it *reads as a wash* on a field already full of grey strokes. Two changes, both one-liners:

- **`rig.aliveShadow` 0.45 → 0.62** at the hero stage (`hero.ts:1667`). At 0.62 toward ink over
  near-paper graphite it is a committed dark shape, not a haze.
- **`key.shadow.radius` 3 → 1.5** for the hero stage. A drawn shadow has an *edge*; a soft wash
  does not.

Gate `P6` measures both: the shadow region's mean luma ≥ 0.25 below the surrounding graphite
field, and a boundary gradient ≥ 0.15 luma across ≤ 4 CSS px.

**Stance:** boots oversized and visibly below the hem (the 0.09 H hem gap exists for this), front
boot toe overlapping the drawn path edge — *he stands on his work.*

---

## 9. The puppet

**The joint set is `world.ts:832–843`, unchanged and re-signed.** root · pelvis (`position.y` =
crouch) · bob (breath) · chest (the waist hinge — the hunch as a *state*) · neck · head ·
earL/earR pivots · face (browL/R, eyeL/R, mouth+fang) · armL/R (pose, swing, elbow, wrist) ·
legL/R (pose, swing, shin, foot, toe). `actions.ts` drives 25 channels off it.

**Three additions, all single groups:**

| Group | Where | Driven by |
|---|---|---|
| `hemFlick` | rotation pivot at the hem rear | **authored action keys only** (§10) |
| `pupils` | offsets both slit pupils ±0.006 u | saccade + look-at-viewer |
| `hood` | the cowl's ±0.02 y slide | the brow channel (§6) |

**One constant change with a downstream cost nobody may skip. — DONE. [ERRATA 2026-09-03: this is
SHIPPED, not pending. `world.ts:866–867` exports `EAR_Z_R = 0.55` / `EAR_Z_L = 0.85`;
`actions.ts:6–7` imports both; `earBase()` at `actions.ts:35` resolves per side; and
`actions.ts:344` records the retune as done, with all six `EXPRESSIONS` entries carrying values
measured against the unequal bases. **Gate `G8` is CLOSED** — delete it from every build ledger,
and do not cost §13 step 6 again.]** `EAR_Z = 1.3` became
**`EAR_Z_R = 0.55` / `EAR_Z_L = 0.85`**, exported from one module and imported by both
`world.ts` and `actions.ts` (gate `G8`). `express()` writes ear rotation **absolutely** —
`earL.z = EAR_Z_L - ear`, `earR.z = -(EAR_Z_R - ear)` — so **every one of the six
`EXPRESSIONS` entries lands its `ear` delta on unequal bases and needed a retune pass.** That
pass is booked as its own step (§13, step 6); it is done. An `alarm`
at full ear-up carries the right ear past vertical — **that is accepted and funnier.**

### 9.1 The rest pose — ONE table, three readers

Today these values are inline in `stageGoblin` (`hero.ts:1207–1228`) and will fork across
`stageGoblin`, the reduced-motion still and `posterBake` the first time the pose is tuned.

**`export const REST` lives in `world.ts` beside `RIG`.** `stageGoblin()`, the PRM still and
`posterBake` all call `applyPose(goblin, REST)` and contain **no inline joint literals** (gate
`G7`).

| Channel | Value | Why |
|---|---|---|
| `root.rotation.y` | **1.60** | faces his work (+x). §3.4 — nothing rotates. |
| `pelvis.position.y` | `RIG.hipY - 0.012` | settled, not crouched |
| `pelvis.rotation.z` | `-0.0495` | `weightShift(WORKING_SIDE, 0.55)` — 58/42 |
| `chest.rotation.x` | **0.34** | the hunch, one step past `HUNCH` |
| `chest.rotation.z` | `+0.0715` | the counter-tip of the same `weightShift` |
| `neck.rotation.x` | 0.16 | distributes the fold |
| `neck.rotation.y` | **0.16** | the head-turn (§3.4) |
| `head.rotation.x` | **−0.06** | **the head lifts against the fold** — this reversal is the line of action |
| `head.rotation.y` | **0.38** | face plane 43° off the lens |
| `earR.rotation.z` | **−0.55** | the apex blade |
| `earL.rotation.z` | **+0.85** | the swept blade |
| `legR.pose.rotation.x` | −0.16 | working foot forward |
| `legL.pose.rotation.x` | +0.10 | back leg trailing |
| `legL.toe.rotation.x` | +0.18 | back heel rolled onto the toe |
| `armR.pose.rotation` | (−1.15, 0, −0.30) | posed, not reach-solved — a solved reach at this azimuth foreshortens the arm away |
| `armR.elbow.rotation.x` | −0.10 | |
| `armR.wrist.rotation.x` | −0.30 | |
| `armL.pose.rotation` | (−0.34, 0, 0) | the `armRest` law: `-chestX` |
| `armL.elbow.rotation.x` | −0.18 | |
| `hemFlick.rotation.x` | −0.10 | trailing at rest |

---

## 10. The action library

Every beat the film demands, with its pose and its timing signature. Verbs in `code` exist in
`actions.ts`; **bold** verbs were the five to author. Durations are at film scale.

**[ERRATA 2026-09-03 — all five have SHIPPED: `actions.ts:631` `freeze` · `:669` `stow` · `:694`
`draw` · `:722` `scribe` · `:752` `pocket` · `:772` **`throwDie`** — the last renamed because
`throw` is a JavaScript reserved word; every reference to `throw()` in this document means
`throwDie()`. The table below bolds four because it never bolded `stow`/`draw`, which §13 step 7
always counted as the fifth; the prose count of five was right. **The film's outstanding verbs are
the scene book's four — `hop`, `hang`, `plantAndPat`, `touchUp` — not these.** Nine new verbs
total, four remaining (motion doc D-5, closed).]**

| Beat (script ref) | Pose | Timing signature |
|---|---|---|
| **Peek** behind the rock (`story.md:13`) | `peek()` — crouch 0.85, chest 0.62, look down-under, `alarm`, shoulders to ears. **Add: the right ear stays UP while everything else hides** — the periscope gag the asymmetric ear was built for. | crouch 0.6·dur `power2.out`; hold is a *pose*, not a loop |
| **Run** / Nimble Escape (`:17`) | `bolt()` + `applyGait` — he unloads the crouch he is already in. Ears pinned −0.5, `hemFlick` trailing −0.30, chest +0.08. **He does not pump his arms: a professional runs like a waiter with a tray.** Pencil stows first. | stow 120 ms → unload 0.25·dur `power3.out`; 280 ms stride |
| **Freeze and turn to camera** (`:17–19`) | **`freeze()`** — THE signature. All swing channels → 0; then 250 ms of *nothing but a blink*; then `look()` to the lens (neck leads, head +0.12 s), `alarm` melting to `sly` over 0.6 s; ears arrive **last**. | **stop in ≤ 100 ms, no ease-out.** The comedy is the dead stop, not the turn. Ears +80 ms at 1.3× overshoot. |
| **Light a campfire / set a lantern** (`:31`) | `plantFor` + `reach` + `tap(×1)`; the flame answers on the contact frame. **Amber comes from the lantern, never from him.** | reach 0.45·dur `power2.out`; tap 0.12 s |
| **Open a cave door / dungeon gate** (`:31`, `:66`) | `haul()` at half amplitude, one hand, chest lean-back −0.25 | two pulls, not one drag |
| **Place treasure / put mushrooms / plant a tree** (`:31`, `:62`) | `stoop()` — two thirds down, one third up | 0.4/0.38 split |
| **Scare ravens** (`:31`) | `wave()` at double rate + `alarm` → `smug`, one hop (pelvis +0.03) | 5 wrist yoyos, `sine.inOut` |
| **Straighten a signpost** (`:31`) | `reach` + wrist twist ±0.2, then one step back and a `sly` head tilt — *he checks his work* | 0.3 s check, always |
| **Pull the giant rope** (`:37`) | `haul()` — heels dig (toe up 0.5), three tugs with rising chest involvement, `strain`, `hemFlick` +0.20. **Effort is posture, never face.** | ratchet: 0.30 / 0.12 / 0.24 |
| **Wave, keep running** (`:37`) | `wave()` → `bolt()` with no settle between | the overlap *is* the character |
| **Walk in casually** (`:47`) | `applyGait` at sp 0.55, one arm under the cloak, **the other thumb in the patch pocket**, head wander ±0.06 yaw on a 3 s noise, pencil behind the ear | 2 steps/s. *The entrance of someone who works here.* |
| **Look at the die** (`:47`) | `look()` down-forward + `pupils` toward it | 180 ms, head +0.12 s |
| **Look at us** (`:47`) | `look()` to lens + `pupils` toward the lens + hood slide +0.01. **Expression is the beat's, not this table's: S5-B5 stages `express('flat')` into the `shrug` (scene book §3-S5-B5) — the deadpan is the film's editorial position on cheating. `sly` is the verb's general pairing, used at S2-B2 and S6-B6.** (ERRATA 2026-09-03: expressions per beat belong to the scene book; verb mechanics belong here.) | hold ≤ 1.2 s |
| **Shrug** (`:47`) | `shrug()` + both ears droop 0.3 and settle 0.15 s late — **the ears do half the shrug** | 300 ms up, 600 ms settle |
| **Nudge the die** (`:47`) | `nudge()`, **but with the PENCIL BUTT, not the mitt.** The mitt has no finger and he would use the tool anyway. The flip to butt-forward is the anticipation. | flip 0.30 s → tap-through 0.12 s → one glance to confirm → back to work |
| **Dust off hands, walk away** (`:47`) | `dustOff()` + `smug` → gait | 4 elbow yoyos |
| **Draw roads onto the map** (`:59`) | **`scribe()`** — `stoop()` + `wrist.z` oscillation ±0.4 rad at 2.2 Hz; head tracks the tip with 90 ms lag; **the right ear ticks at each stroke end.** *This is the hero pose — the rest state IS this action paused.* | 2.2 Hz; ear tick 60 ms |
| **Add monsters / move NPCs / fill chests** (`:60–64`) | `stoop()` + `lift()` variants at montage speed | 0.6× film durations |
| **Hang a tavern sign** (`:61`) | `reach` above his own head — `plantFor` returns the stand-back-and-stretch branch; it should read as a stretch | `PUPPET.drop` on the sign only |
| **Put candles on tables** (`:65`) | `tap(times: 1)` at table height, then `sly` | the smallest of the montage |
| **Straighten up at the cliff** (`:72`) | `straighten()` — **he stands fully upright exactly once in the film and this is it.** | 1.2 s `power2.inOut` |
| **Smile** (`:76`) | `express('smug')` + hood slide −0.01 | 0.4 s |
| **Pull the d20 from his pocket** (`:76`) | **`pocket()`** — one reach into the front-right skirt, `WORKING_SIDE`, wrist supinates on the way out so the die shows | 0.35 s in, 0.25 s out |
| **Spin it, throw it** (`:76`) | **`throw()`** — crouch 0.30 (**the only big anticipation he does all film**, which is why it lands) → chest + arm unwind `power3.in` → release at 55° → wrist follow-through, both ears trail, `pupils` track the die. **Then he watches it.** He is audience-aware; `story.md:47` and `:19` settle that. | anticipation 0.28 s / core 0.14 s / settle 0.32 s |
| — hero page — | | |
| **The staged working stoop** | `applyPose(goblin, REST)` (§9.1) | static |
| **Head-track** | ±14° cone, existing `heroLife.ts:607–757` | 90 ms lag |
| **Ear-perk on first island hover** | right ear +0.25, once per session | 140 ms, `back.out` |
| **Scritch at 4 s idle** | **pencil butt scritches under the right ear, then the pencil parks there** | 4 oscillations over 1.2 s, then back to work |
| **HANDOFF** | existing `heroLife.ts:502–567` head snap + pencil tuck | unchanged |

**Idle, always running:** breath on `applyGait`'s own term (rides the gait clock, so a freeze
never stops it), blink every 3–6 s with the 18 % double, ear micro-flick ±0.02 rad, a weight-shift
swap every 7 s, a pencil twiddle (`wrist.y ±0.5`, 1.6 Hz, 0.7 s) every 12 s. **He is never
*waiting*. Idle is small work.**

---

## 11. Motion identity

**"Fast in, one overshoot, dead stop." A stagehand's economy: nothing he does is for the
audience.**

1. **Timing.** Attack 90–140 ms (`power3.in`), settle 450–700 ms (`power2.out`). Only the *head
   mass* gets an overshoot, and only 4 %. Then absolute stillness — he settles like a dropped
   satchel.
2. **He anticipates with WEIGHT, not windup.** Every action opens with a `weightShift` or a
   crouch-load 0.12–0.18 s before a limb moves. His hips already know. Small actions (nudge,
   scritch, tap) get **no** anticipation — competence does not telegraph the easy ones. The d20
   throw is the single authored exception in the film.
3. **Order of operations, always:** pelvis → chest → neck → head → **ears last** (+80 ms, 1.3×
   overshoot). The ears are the apex of the silhouette, so they are the follow-through that makes
   even a 36-px figure feel elastic. Exception: **when he is working, the pencil hand leads and
   the body follows it** — the craft drags the craftsman.
4. **The freeze is his fingerprint.** Motion stops in ≤ 100 ms; only eyes, ears and breath
   continue. Everyone else in fiction eases out. The stagehand just *stops*, because being caught
   is a professional hazard he has drilled for.
5. **He never** holds symmetry (some joint always breaks it), moves everything at once (one chain
   at a time, ears excepted), or eases in-out evenly (that is tween software, and he is
   hand-drawn).
6. **Recovery from any beat returns to the working stoop within 0.8 s.** He is interruptible, not
   distractible.

### 11.1 Scrub safety — non-negotiable

**Every channel is an authored GSAP key on a transform. There are no integrators, no springs, no
velocity-driven drag, and no state anywhere in his motion.** `hemFlick` is driven by authored
action keys (`hemFlick trail -0.30` in `bolt`, `+0.20` in `haul`, `-0.10` at rest), **not** by
root velocity and **not** by a spring. GOBLIN-B's 200 ms velocity drag and GOBLIN-C's spring are
both rejected: `motion-system.md:107` ("Scrub-safety rules — each one paid for in a shipped bug")
and `timeline.ts:129–139` ("tweens un-set themselves on backward scrub") make a stateful
integrator on a scrub-scrubbed timeline a known shipped bug class. Zero per-frame allocation,
zero material swaps, zero geometry morphs.

### 11.2 Reduced motion and the phone

**The reduced-motion still** is the settled hero poster: bent to the work, pencil at the next
stroke, both ears up, amber eyes open, pool under his boots, the crossing shadow committed,
`uTriBirth = 1`. **No breath, no blink, no ear tick.** It is honest — it is a frame the live
scene actually holds — and it is the frame this whole silhouette section was designed to be. It
is also exactly what `posterBake` renders, from the same `REST` table.

**The phone scale bump.** 43 px was never a legible size for five marks; only GOBLIN-C questioned
whether the figure was big enough rather than only what shape filled it. **The Cover's stage solves
`HERO_GOB_SCALE` so the projected figure height (soles → right ear tip) is ≥ 52 CSS px at every
breakpoint, capped at 1.35× the desktop scale**, and his projected bbox must stay inside the
island's painted half.

**[ERRATA 2026-09-03, motion doc D-6 applied — the scalar is renamed to `HERO_GOB_SCALE` because
`GOB_SCALE` has a second, unrelated owner: the scene book §7 and the direction §6 lock the **film
body's** figure scale at a fixed `GOB_SCALE = 0.75`, with the film's own floors (≥100 px landscape,
≥84 px portrait, `A`-flagged beats only). The shipped `hero.ts:50 export const GOB_SCALE = 0.75` is
read only inside `stageGoblin`, so it is **this** doc's scalar and it is the one that renames; the
film body's constant takes the `GOB_SCALE` name at film level. Two constants, two surfaces, two
floors, no conflict.]** One scalar, solved the same iterative way `heroFraming` fits the island.
At 390 the shipped 43 px needs 1.21× — inside the cap.

**Phone line tier.** `pencil.ts:34–36`'s reduced tier (SUB 1, SCALE 0.75) stands; the shells'
px-solve (§5.12) is what actually kills the 0.97 px beaded chain, because it is solved *per
breakpoint* rather than inherited from a world constant.

---

## 12. Performance budget

| | Shipped | This design |
|---|---|---|
| Triangles | ~56,800 | **≈ 9,300** (−84 %) |
| Draw calls | ~102 | **≈ 44** (−57 %) |
| Shader programs | Lambert + Basic + Line + shell | same set; **one** trilayer program, already resident |
| Hidden anatomy | 88 % of the mesh budget (legs 21,928 tris at 0–6 % visible) | legs 920 tris, mitts/feet 260 each |
| Per-frame allocation | — | **zero** |
| Estimated GPU cost @ 1440×900 | line item | **< 0.3 ms** — he stops being one |

He is on screen for essentially the whole 66-second film, so his cost *is* the film's cost. This
design hands the film back ~47,500 triangles and ~58 draw calls, which is most of a frame budget.
**60 fps inside the scroll-scrubbed timeline is met by construction**, because nothing in §10 or
§11 does per-frame work beyond GSAP writing transforms.

---

## 13. Build checklist

**Step 0 is the harness, and it is not optional.** All three direction docs wrote colour gates
that assume a pixel readback; `scripts/hero.check.ts` is plain Node + three with no WebGL — it
projects points and greps source text. **Half the spec has no runner until this is built.**

- [ ] **0. The measurement split.** Add `scripts/gob.check.ts` for the **CLASS G** gates (Node +
      three, runs in `pnpm check` today — no new infrastructure). Add `window.__gob(w, h)`,
      installed by `Hero.tsx` beside `__hero`, for the **CLASS P** gates: it renders the hero
      through the authored framing into an offscreen target and reads it back with
      `gl.readRenderTargetPixels` — **the exact recipe already proven at `IslandSandbox.tsx:193`
      and `posterBake.ts:43–60`. No new dependency, no Playwright.** It asserts its own
      thresholds and throws on failure, so a walk is one call per breakpoint.
- [ ] **1. Palette + ears + hatch.** Add `gobCloak`/`gobCloakWorn`; delete the stale
      `palette.ts:111–114` comment; amend `hero-design.md:113`; re-pivot the ears to
      `EAR_Z_R/EAR_Z_L`; delete the three hatch fields (`world.ts:978`, `:1211`, `:1277`).
      **→ the poster gains a subject in a day. This step alone is walkable and reviewable.**
- [ ] **2. Trilayer conversion.** Every `paint({fill})` in `buildGoblin` → `createTrilayer` per
      §4.3. Assert `timberDark` and `QUIET_PIGMENT` no longer touch him.
- [ ] **3. Silhouette rebuild.** Cloak bands, hem flick, patch pocket, lathe mitts, extruded
      boots, leg stubs. Delete `blobs()` and the shin wraps. Two px-solved merged shells + ~12
      authored marks; retire the 19 shells and the P4d ×2.6 patch (`hero.ts:1179–1190`).
- [ ] **4. Face.** Proud eyes (`z 0.135`) + the raycast assert; nose → `gobEarInner`; `pupils`
      group; hood-slide brow channel; amber pixel gates.
- [ ] **5. Grounding.** The feathered trilayer pool + the `neverAlive` carve-out in
      `curtain.ts:63`; delete the `stageGoblin` hide-loop; baked blob 0.3 → 0.4;
      `rig.aliveShadow` 0.45 → 0.62; `key.shadow.radius` 3 → 1.5.
- [x] **6. `REST` + the ear retune. — DONE 2026-09-03.** `world.ts:857` `WORKING_SIDE`, `:866–867`
      `EAR_Z_R`/`EAR_Z_L`, `:888` `REST`, `:934` `applyPose`; all six `EXPRESSIONS` retuned
      (`actions.ts:344–372`). **Do not re-cost this step.**
- [x] **7. The five new verbs. — DONE 2026-09-03.** `actions.ts:631` `freeze()` · `:669` `stow()` ·
      `:694` `draw()` · `:722` `scribe()` · `:752` `pocket()` · `:772` **`throwDie()`** (renamed —
      `throw` is a reserved word). **The film's four remaining verbs belong to the scene book, not
      here:** `hop`, `hang`, `plantAndPat`, `touchUp`.
- [ ] **8. The entrance.** `gobBirth(part, t)` driving alive **and** shell/mark opacity from one
      curve; the per-part stagger of §4.4.
- [ ] **9. Gate run.** CLASS G in `pnpm check`; CLASS P at 390 / 500 / 768 / 1440, plus a 6×
      zoom walk, a Prep-rig walk and a seam-birth walk.

### The minimum viable subset, if the work slips

**Steps 1, 4 and 5 are roughly 80 % of the client's verdict** — value ownership, a face that
exists at shipped sizes, and a figure that touches the ground. They reach it through palette,
ear pivots, proud eyes and the contact pool, **before any geometry rebuild**, and they are
independently walkable. **Gate that subset on its own** (`G1`, `G2`, `G4`, `P1`, `P3`, `P5`) so
the redesign has a real halfway landing instead of one ten-step all-or-nothing.

---

## 14. Acceptance tests

Every test is a measurement, an assert or a screenshot criterion. **CLASS G** runs in Node today;
**CLASS P** needs step 0.

### CLASS G — geometry and source (`scripts/gob.check.ts`, in `pnpm check`)

| # | Test | Pass |
|---|---|---|
| G1 | Projected figure aspect (height incl. ear tips : max width incl. ears) at 390/500/768/1440 | **≥ 1.45 : 1** at every breakpoint |
| G2 | The two ear tips are the two highest projected points of the figure; right tip above left | right − left **≥ 0.02 × figure height** |
| G3 | Projected head width vs projected hem width | head **≤ 0.86 ×** hem |
| G4 | Raycast down the shipped lens through the eye centre | hits the eye front cap **≥ 0.03 rig units before** the skull |
| G5 | Projected pencil length; overlap of that length with the body bbox | **≥ 14 px @ 390**, **≥ 34 px @ 1440**; overlap **≤ 20 %** |
| G6 | Face-plane-to-lens angle from `root.y` + `neck.y` + `head.y` vs `HERO_AZ`/`HERO_ELEV` | **40–48°** at every breakpoint |
| G7 | Projected figure height on the **Cover**; solved **`HERO_GOB_SCALE`** ratio (ERRATA 2026-09-03 — renamed; the film body's `GOB_SCALE = 0.75` is a different constant with a different floor, gated by `figure.check.ts`, not here) | **≥ 52 CSS px**; scale **≤ 1.35 ×** base |
| G8 | ~~Source: `EAR_Z_R`/`EAR_Z_L` exported from one module and imported by both `world.ts` and `actions.ts`; `EAR_Z` gone~~ **CLOSED 2026-09-03** — `world.ts:866–867` exports both, `actions.ts:6–7` imports both, `EAR_Z` is gone, and the six `EXPRESSIONS` retunes landed (`actions.ts:344`). Keep the assert; stop costing the work | 0 occurrences of the old constant — **passing** |
| G9 | Source: `buildGoblin` contains no `hatch(`, no `contact(`, no `blobs(`, no `timberDark`, and no `paint(… fill:` | 0 hits each |
| G10 | Source: `stageGoblin`, the PRM still and `posterBake` each call `applyPose(_, REST)` and contain no inline joint literals | 0 literals |
| G11 | `shadowReachX(0.95, figureTop)` | lands **> `SEAM_X` + `SEAM_W`** — the crossing is preserved |
| G12 | The contact pool is a child of `root`, carries `userData.neverAlive`, and the `hero.ts:1201–1203` hide-loop is gone | all three |
| G13 | His projected bbox does not overlap the island underside band at any breakpoint | 0 px overlap |

### CLASS P — framebuffer readback (`window.__gob(w, h)`)

| # | Test | Pass |
|---|---|---|
| P1 | Cloak mean luma vs the darkest painted tree crown, @ 500 × 915 | cloak **≤ crown − 0.12** *(shipped delta: 0.02)* |
| P2 | 26-sample scan down the torso: encoded range, and count of plateaux (runs of ≥ 3 samples within 2/255) | range **≥ 60/255** *(shipped head: 8/255)*; **≥ 3 plateaux** |
| P3 | Amber-classified pixels (R − B ≥ 70) inside the head bbox | **≥ 40 @ 390 × 844**, **≥ 250 @ 1440 × 900** *(shipped: 0 and 0)* |
| P3b | Both eyes return amber; near-eye : far-eye pixel ratio | both **> 0**; ratio **≤ 2.5 : 1** — a three-quarter shows two eyes, unequally |
| P4 | Rim thickness at the head's widest projected point, both shells, all four breakpoints | each **2.6–3.6 CSS px**; max : min across the two **≤ 1.7 : 1** *(shipped 6.3 : 1, 0.97 px @ 390)* |
| P5 | A contiguous region under the hem darker than the local ground by ≥ 0.10 luma, at curtain 0 **and** curtain 1 | area **≥ 0.9 ×** the boot bbox, in both states |
| P6 | Cast-shadow region mean luma vs the surrounding graphite field; boundary gradient | **≥ 0.25** darker; **≥ 0.15 luma across ≤ 4 CSS px** |
| P7 | Amber pixels on his body outside the head bbox | **0** — amber is the eyes and nothing else |
| P8 | Prep rig (curtain 1): repeat P1–P4; plus the cloak's lit range and its darkest pixel | range **≥ 45/255** (he is the only lit thing); no pixel darker than **ink + 8/255** (he is not a hole) |
| P9 | Entrance at birth t = 0.5 | both a painted and a graphite region present on him; every shell/mark opacity within **± 0.05** of its part's alive value |
| P10 | 6× zoom on the head and on the hem, both rigs | **no crossing strokes anywhere** (hard gate); visible drybrush at every rim; stroke tiles resolve on the cloth |

---

## 15. Failure modes deliberately accepted

1. **`gobCloak` 0.211 sits within 0.01 of `caveDark` 0.204**, the island's underside strata. They
   are separated by ~150° of hue, by position (he is on top of the island, the strata are a
   horizontal band at the frame's bottom) and by gate `G13`. If a walk ever confuses them, the
   knob is the strata, never him.
2. **The lathe cloak is radially near-symmetric.** From dead behind, only the hem flick, the
   pocket, the satchel and the ears break it. The film never stages him from dead behind for
   longer than a transition.
3. **Rigid parts, no skinning.** Extreme reaches can open a 1–2 px joint gap at 6×. Sleeve and hem
   overlaps plus the drawn contours cover every staged pose; unstaged extremes are nobody's shot.
4. **One-bone cloth.** `hemFlick` is a swing, not a ripple. Storybook register. No sim, ever.
5. **Mitts have no fingers.** All grips are wrap or pinch; fine manipulation is always the
   pencil's job — a character statement as much as a saving.
6. **Unlit amber eyes stay bright in dark scenes** (the C4 tavern). That is the lantern-eyes
   conceit, capped at `lanternGlass`. Accepted as identity.
7. **Authored marks are lens-biased**, tolerating ~±15°. At extreme angles they drift and the
   read falls back to the two shells + wear + mass. The film has one dominant lens family; a
   turnaround was never the contract.
8. **Interior costume detail dies below ~150 px.** The dark cloak trades interior read for
   silhouette. Nothing inside the bell is load-bearing at poster size.
9. **Stroke tiles were tuned for trees** (1.6 u repeat; he is 0.9 u). Sheet-basis projection keeps
   him one continuous param space so there is no per-face swirl, but below ~60 px of figure the
   poster tiers carry the read, not the strokes. True of every prop his size.
10. **~44 draw calls is not the theoretical floor** (~30 with merged stroke classes). At 9,300
    tris on an already-resident program, engineering there before a measured need is the wrong
    kind of lazy. Revisit only if a frame profile says so.

---

## 16. What was killed, and why — so it is not re-litigated

- **Zero-shell outlining (A).** `trilayer.ts:304–305` lightens rims *toward paper*; on the
  graphite half a wear-only rim against a paper ground is not a contour. The tree citation is
  real but the trees never move. Two px-solved shells stay.
- **"The palette committed rust and the build ignored it" (A + B).** The rust comment is the
  *stale* one; `world.ts:930–936` and `palette.ts:122/124` record a later, argued supersession.
  Rust is dead anyway — on merit (§4.1), not on a citation.
- **`gobTunic 0x9C3A22` paired with a "≥ 0.12 below the darkest crown" gate (A).** Rust measures
  0.303 against a rendered crown of 0.314. The colour fails its own gate.
- **Poster 3/4 (C).** `uTriPoster` quantizes across the whole [0,1]; a near-ink cloak at poster 4
  spans about two tiers, while C's own gate demands three. The spec defeated its own test.
- **`gobCloak 0x333B2C` exactly as written (C).** The value-ownership *idea* is what won this
  document; that particular execution silently overrode a signed line and was never checked in
  the Prep rig. §4.2 lands the value with the override stated and both rigs gated (`P8`).
- **The islandKit shadow disc (B §8.2).** `alpha * (1.0 - cSeam)` makes it vanish exactly where
  persistence was wanted; no alive uniform; the quoted alpha was wrong (0.24, not 0.34).
- **`hemFlick` merged into a static cloak shell (B §4.12).** An animated part cannot live inside a
  merged static silhouette.
- **Poster 0 on limbs and the pencil (B §5).** Smooth Lambert beside tiered gouache is the exact
  defect being fixed.
- **Velocity-driven hem drag (B) and the hem spring (C).** Stateful integrators on a scrubbed
  timeline. Authored keys only.
- **The contact pool parented inside the pelvis-sibling set (C §8).** `pelvis.position.y` *is* the
  crouch channel; the pool would rise and sink with every crouch, breaking C's own rule.
- **`rotation.y → 1.15` (C §3).** The lens math (§3.4) puts that at 96° off the axis — *further*
  from camera than the shipped 1.60's 41°. C's diagnosis was right and its remedy inverted.
- **"No watching the die" and a once-per-film wordmark quote (C).** `story.md:47` is "Looks at the
  die. Looks at us. Shrugs"; `:19` is "That was me". He is audience-aware by script in at least
  four beats; the rule fought the film.
- **"The colour gates run in `hero.check`" (all three).** They cannot. That is step 0.
