# THE KEPT WORLD — binding creative direction for the whole site

2026-09-03 · The film body (stages 1–8), the persistent interface, and the endcard.
Adjudicated from three competing directions; this document is the decision. It is
written to be built from with no further creative input: every ruling here is a
decision, not an option.

---

## 0. Status

### What this supersedes

- **All v1 art docs**, for the film body: `docs/art-direction.md`, `color-script.md`,
  `puppet-spec.md`, `skeleton-spec.md`, `pencil-detail-plan.md`. They remain readable as
  history. Where they disagree with this document, this document wins. Nothing in them
  binds a v2 surface.
- **The three competing directions** `docs/build/direction/DIR-A.md`, `DIR-B.md`,
  `DIR-C.md`. All three are closed. Their surviving content lives here.
- **The direction doc's §14 art gates** that the 2026-09-02 amendment already struck:
  there is **no art bible**, **no external asset sign-off gate**, and **no forge /
  image-generation pipeline**. The build authors its own final art, in code, in this
  repo. Any plan that reintroduces a generation run or an approval gate before a surface
  may be painted is wrong on its face.
- **`docs/build/direction/DIR-C.md` §6's "the camera never hunts evidence"** as an
  absolute, and **§15's blanket refusal of the seam**. Both are amended below (§6, §7).
- **FINDINGS `P4d-T6`'s claim that "framing solves this, not scale changes."** Portrait
  figure legibility is solved in §6 with a named three-tier mechanism and a check.

### What this inherits unchanged

| Inherited | Authority | Status |
|---|---|---|
| The narrative and every story beat | `docs/story.md` | LOCKED. Story and narrative are the only things carried from v1. |
| Every on-screen word, all eleven captions, the endcard block | `docs/copy-spec.md` | LOCKED and VERBATIM. Never reworded, never added to. **[ERRATA 2026-09-03 — eleven, not twelve: `copy-spec.md:25–37` lists eleven caption rows and row 12 is the endcard *block*, not a caption; `App.tsx:35–49` ships eleven. Corrected everywhere below.]** |
| Runtime `t = 66` | `src/film/motion.ts:25` | Fixed. |
| The scroll↔t gearing map and its nine stage rows | `src/film/gearing.ts:44–54` | Fixed. This document restages art, never time. |
| The two-clock architecture (`world.t` freezable / `gobT` never stops) | motion doc §4 | Fixed. |
| The seven-transition catalog | experience doc §7 | Fixed. No eighth transition is invented here. |
| The shipped hero — the quality bar | `hero.ts`, `heroLife.ts`, `trilayer.ts`, `rigs.ts`, `islandKit.ts`, `palette.ts` | Verified (`docs/build/P5-REVIEW.md`). The anchor for every ruling below. |
| The trilayer material, the stroke-tile bake, the 4-tier quantizer, the two rigs | `trilayer.ts`, `rigs.ts` | Shipped. Extended here; not replaced. |
| The committed palette tokens | `src/film/palette.ts` | Fixed. §5 is a permission table over them, not a new palette. |

### Hard gates, restated because they are absolute

No hatching, ever — one stroke family per face, one direction per organic prop. Paper
`#F7F5F0`, ink `#222222`, amber `#F2C35E` the only glow hue. No tone mapping (three r185
forces `NoToneMapping`; everything is judged flat). No spinner anywhere. Reduced motion
and keyboard access are not optional. Goblin v2 design is locked — this is a **surface
and staging** rebuild, nothing is redrawn.

---

## 1. Core concept

**Every surface in this film is a document of its keeping — drawn, painted, worn, erased
and re-painted by one goblin, for years — and the freeze is when you are allowed to read
the file.**

Why this is true for this product and no other: a DM's campaign world *is* a long-kept
document. The map gets redrawn between sessions, the tavern gets reused, the encounter
gets rebalanced, the eraser ghosts stay in the paper. Good Goblin's pitch is taking over
that upkeep — *build the maps, run the table, the goblin does the rest*. A generic
product can claim a maker; **only a DM tool can claim a keeper.** The film's ending (the
tended cliff, already built at `world.ts:4052`), its thesis proof (light as someone's
nightly work), and its climax caption (`pitch1` — "I've built worlds for your DM for
years") are all already about maintenance. The art direction's job is to make the pixels
agree, so that when `pitch1` letters on at t58 the visitor believes it because they have
been reading receipts for eight stages.

Three tenses, one material. The shipped trilayer already carries all three
(`trilayer.ts:5–27`):

| Layer | Tense | What it says |
|---|---|---|
| **Underdrawing** (Prep) | past — how it was decided | construction, measure ticks, and **the revisions**: erased lines, ghost positions, scribed arcs. The pentimento layer. |
| **Paint** (Performance) | present — how it plays | committed gouache, the current coat, the world the players get tomorrow |
| **Wear** | continuous — whose hands keep it | drybrush on handled corners, rubbed paint where he always lands, ruts between islands |

**The four-flagship discipline (law).** The film carries exactly four evidence beats,
one per proof plus the bookend:

1. **S2 — the erased cliff contour.** One line rubbed out and redrawn.
2. **S4 — the scribed arcs under the stage disc.** Ten thousand swings in one mark.
3. **S5 — the graphite mug rings on the tavern table.** Years of game nights under one roll.
4. **S7 — the tended cairn.** Already scripted, already built.

Everything else is second-plane texture, discoverable on scrub-back, never the eye-path.
There is no fifth flagship. Evidence whispers; it never captions itself.

---

## 2. Narrative across stages 1–8 — the argument each stage makes

The claim / three proofs / handover shape (direction doc §2) stands. What this direction
adds is that each stage argues in a different **tense of keeping**, so the film builds a
case instead of a reel. All eleven captions verbatim per `copy-spec.md`; the evidence
layer is **marks only** (ticks, `numeral()`, arrows, erasures), never lettering.

| Stage | t | Tense | The argument it makes |
|---|---|---|---|
| **S1 — The Claim** | 0–10.2 | shared memory, inverted | *This is the night you remember.* The ambush aftermath is already evidence — dropped kit, arrows in rock, a fire someone laid. The audience does not yet know whose work it is. |
| **S2 — The Address** | 10.2–16.5 | the file opens | *This world was decided, not found.* First freeze, first underdrawing, first revision mark, the grid — the oldest layer of all. "You thought I ran away" lands over proof of authorship. |
| **S3 — Proof of Light** | 16.5–26.5 | present — tonight's shift | *Someone lights the world, prop by prop.* Every beat leaves the world more alive than he found it. The lantern is the thesis image: paint and shadow arrive together, from the touch point. |
| **S4 — Proof of Scenery** | 26.5–36 | past-perfect — the infrastructure | *The machinery is old because it has always worked.* The freeze-flicker shows a stage worn by years of turning. |
| **S5 — Proof of Time** | 36–50 | the intervention | *He does not just build the room; he saves the night in it.* The freeze shows the table's own history. This room has hosted years of the game the die is about to rescue. |
| **S6 — The Many Jobs** | 50–57.5 | habitual | *This is not one heroic night. This is the job.* Six vignettes of routine, silent, because routine does not announce itself. |
| **S7 — The Handover** | 57.5–64.5 | the verdict | *You already believe it.* `pitch1` reads as a conclusion the visitor reached. The flatten then reveals the ledger the work was kept in: the map. |
| **S8 — The Table** | 64.5–66 | the handover completed | *The ledger is yours, and it is the product.* |

---

## 3. The visual world

**Islands on the page.** Binding (direction §3), and the hero shipped the recipe: an
elliptical card over a **solid, closed three-band lathe skirt** — earth lip / darkened
stone shelf / `caveDark` keel — with bent tapering roots and a drawn rim contour that
stops being drawn (`islandKit.ts`, `hero.ts`; verified at four breakpoints, FINDINGS
P2-T1). The film's seven sets are that recipe at set scale. **No infinite ground plane
survives anywhere in v2**; `world.ts:2244–2254`'s `earthPlane` / `grassPlane` are deleted
at S1 and S3.

Two additions, both binding:

- **The edge is a section through the layers.** At every island's cut edge the paint
  reads as a *thin skin* over sectioned earth — a bright 2–3 px painted lip over the
  strata, the way a painted maquette shows its build at the cut. The world is painted
  *on*, thinly; the island edge is where the film admits it.
- **Places relate by wear, not by roads alone.** The connective tissue between islands is
  the keeper's traffic: cart ruts entering at the island edge and stopping where the
  pencil line stops, a rubbed patch where he always lands. The film's world map is
  legible as *his commute*.

**The travel line.** Between sets the goblin runs on bare paper along a graphite path
line that **draws itself ~1.5 world units ahead of him**, scrub-tied, and **un-draws
behind his heels** on reverse. His contact shadow is the only shadow on the void. Built
on `pencil.ts`'s `polyline()` / `curveLine()` with a `LineSegments2` `instanceCount` ramp
— exactly the mechanism the hero entrance already uses for its 152 strokes
(`heroLife.ts`). Rest anchors never land mid-void.

**The page.** The margin system of experience §4 is unchanged: sheet, ticks, penciled
C1…C7, the 66-tick ruler, whisper/breathe. The grid ghost stays at or below
`GRID_INK = 0.04` (`trilayer.ts:31`, sandbox-asserted) and extends a few cells past each
island's rim onto the paper — the drawing escaping its object, promoted from a hero
effect to a site-wide constant.

**The 66-tick ruler performs the film's grammar.** Passed ticks ink in; future ticks stay
graphite. The interface tells the story wordlessly at 4% opacity for the whole runtime.

---

## 4. Typography system

Three voices. No fourth. No grotesk anywhere. Hierarchy is voice, not size.

1. **The Hand** — the eleven captions and the endcard tagline. **Authored stroke SVGs**
   in the wordmark's hand, written on stroke-by-stroke (~15 strokes/s, `T_BEAT`),
   un-written on reverse. Graphite under Prep, ink under Performance; `light1`'s strokes
   flush graphite→ink as the lantern pool crosses the caption band (experience §6), a
   200 ms per-stroke crossfade of the two stroke colours — never a repaint. **The Hand
   never revises.** The world carries erasures; the narrator does not. No boil on
   captions mid-write; boil only at rest, ≤0.8 px.
2. **The Inscription** — Cinzel 700, letterspaced caps. The CTA label and the three
   wayfinding labels (play / pause / replay). **Nothing else, ever.**
3. **The Quiet Serif** — Vollkorn (variable, true italic, self-hosted). The endcard
   subline, ~~the meta line,~~ the skip note, the © line. **[ERRATA 2026-09-03 — the
   endcard "meta line" RETIRES (scene book §2): direction C is "no box, nothing extra"
   and it has no source copy in `copy-spec.md`. The Cover's own meta line is unaffected.]**

**Drawn art vs live DOM text — the accessibility/SEO split.**

| On screen | Implementation | Accessible / crawlable form |
|---|---|---|
| The eleven captions | authored stroke SVGs, `aria-hidden` | the verbatim line in the SR document, **first in DOM** |
| The endcard tagline | authored stroke SVG | the verbatim line in the SR document |
| The endcard subline, skip note, © | **live DOM text** in Vollkorn — selectable, indexable | itself |
| The CTA label | **live DOM text** in Cinzel, inside a real `<a href>` | itself |
| The wordmark | art (drawn lockup + pip) | `aria-label="Good Goblin"` |
| The whole canvas | — | `aria-hidden="true"` |

The **SR document** (experience §9) is the film's canonical transcript: the eleven lines
verbatim, the scene sentences, the endcard copy and the real Discord link, first in DOM,
visually hidden. **SEO reads the page, not the canvas.** Nothing on screen is a raster of
words.

**Marks are not type.** Every evidence numeral, tick, arrow and erasure comes from
`pencil.ts`'s stroke primitives (`numeral()`, `polyline()`, `score()`), never from a
font. They are drawing furniture and are never asked to be read as language. This is
also the rule that governs S6's study-plate margins (§13) — **non-verbal draughting marks
only**: dimension ticks, one arrow, an X where a prop will stand. Copy is locked; the
draughtsman annotates in marks.

Caption discipline: lower-third band, on the margin system, ≥4.5:1 contrast at every
breakpoint, phone-verified clamps.

---

## 5. Colour palette — exact hex, with the permission rule for each

Source of truth: `src/film/palette.ts`. No re-inlined literals anywhere; a new colour is
a palette change, not a paint call.

### The spine — both states

| Token | Hex | Permission |
|---|---|---|
| `paper` | `#F7F5F0` | The page, the void, the sky's floor, the Prep ground. Unrestricted. |
| `ink` | `#222222` | Contours, lettering, the wordmark, near-black silhouettes. Never a fill mass. |
| `tooth` | `#E8E5DF` | Paper-grain shadow, margin furniture. Interface only. |
| `graphiteLight` | `#B9B6B0` | Faint construction marks, ghost positions, erasures. |
| `graphite` | `#82807A` | Underdrawing strokes, Prep midtone. |
| `graphiteDark` | `#4A4844` | Heavy graphite, authored contours, near-black accents. |

Near-zero chroma by adjudication. **No cream drift, no parchment tokens** — parchment
warmth belongs to the curtain shader alone.

### The alive ramp — the only colours allowed to glow

| Token | Hex | Permission |
|---|---|---|
| `amber` | `#F2C35E` | Life, touch, fire core, the nudged die, the lit CTA. The one glow hue. |
| `amberLantern` | `#E8963E` | Lantern glass tier; the ≤6% almost-touch lift. |
| `amberEmber` | `#C75B2A` | Ember tier only. |
| `keyWarm` | `#FFEACC` | The key light's hue. **A light colour, not a glow** — never appears as paint. |

Exactly two light hues exist in the film: `keyWarm` and `amber`. No coloured fill lights,
no rim lights, no lens artifacts. **One open violation retires with the rebuild:**
`Film.tsx:100` still parents a `0xffb45e` point light into the flame groups (FINDINGS
P3-T6) — it is replaced by the amber ramp at S1 and S3.

### The goblin — his alone

**[ERRATA 2026-09-03 — superseded by `docs/2026-09-03-goblin-design.md` §4.2, which the
scene book §0 marks LOCKED for his materials, and which `palette.ts:133–147` has already
shipped. The row below was the pre-rebuild tunic palette.]** His palette is now:
`gobCloak` **`#2E3742`** (cloak ×3 bands, hood + peak + tail, hem flick, patch pocket,
collar — cool slate, theatre blacks; **no other object in the world may take this value
band**) · `gobCloakWorn` `#59626B` (mitts, cuffs, boots — the same cloth worn pale, a
value tier not a fourth hue) · `gobSkin` = `goblinGreen` **`#84A058`** (face, ears, arms,
legs) · `gobEarInner` `#5C7A2E` (inner ear **and the nose**) · `amber` `#F2C35E` (the
eyes, and nothing else on him) · `gobSatchel` `#B08D55` (the ONE warm patch, ≤12% of his
silhouette area) · `dieBone` (pencil body, inverted) · `graphiteDark` (pencil core) ·
`brass` (one earring, left) · `gobTooth` `#F0EDE4` (the fang nub) · `ink` (2 shells,
~12 marks, pupils). **Retired from his build entirely:** `gobTunic`, `gobTunicShade`,
`gobHood`, `gobBelt`, `gobSkinLit`, `bedroll`, `timberDark`.

**Nothing else in any frame may read goblin-green.** ~~He is the loudest chroma in every
frame by one deliberate step.~~ **[ERRATA 2026-09-03 — goblin doc §0/§4.1 overrides this
on merit: he owns the frame's **darkest committed value and its only cool hue**; his
*chroma* concentrates in the skin and the amber eyes — small, warm, inside a cool dark
frame.]**

### Brand

`wordmarkPip` **`#B6D648`** — the d20 pip on the wordmark and **nowhere else on the
site**. Not in the film, not on the board, not on the endcard's die.

### The world — chapter air

`skyDusk` `#6D78AE` (S1) · `skyDay` `#ACCDE6` (S3) · `skyOvercast` `#AAB6C0` (S4) ·
`skyHearth` `#D4B184` (S5) · `skyVellum` `#EEE6D2` (S6) · `skyDawn` `#E6C1A2` (S7) ·
`skyBoard` `#F7F5F0` (S8). Permission: the hemisphere fill's sky colour for that chapter,
and the only place chapter air is expressed. Never a gradient wash, never a backdrop
plate fill.

### The world — pigment

Grounds `earth #C2A97E` · `earthTrack #A8875C` · `grass #94B164` · `grassDeep #6F9349` ·
`snow #F2F2EC` · `stoneCool #8792A6` · `stoneWarm #A9967A` · `rockFace #878B7A` ·
`caveDark #3F3226` · `water #679FB4` · `floorboard #B98E52` · `platformDisc #CFC0A0`.
Foliage `canopy #678E42` · `canopyDeep #466F33` · `needle #4C7350` · `undergrowth #87945E`
· `moss #8BA05E`. Wood `timber #94795A` · `timberDark #6A5138` · `plank #A9895E`.
Fire `flameCore #F7EFD2` · `flameBody #F4CC70` · `ember #E89544` · `rayGold #A88E3E` ·
`lanternGlass #F2E2B4` · `candle #F4E8C8`. Cloth `cloakIndigo #4D5A9E` ·
`cloakCrimson #9E3D2C` · `bedroll #B5A084` · `tavernCloth #AC9570`. Metal `brass #B0913F`
· `iron #7D8590` · `gold #CDA43E` · `steel #B1BAC2`. Specials `dieBone #ECE2CA` ·
`monsterHide #8B6D47` · `ravenSlate #464C58` · `mushCap #B03C22` · `boardFill #F0EDE4`.

**Permission rule for every pigment above: a hue enters the film only as PAINT — albedo
on a trilayer surface — never as light.**

### The five colour laws

1. **Colour is earned by crossing the frontier.** Behind the curtain every hue drains to
   the graphite ramp except the goblin's, and whatever he has touched. The graphite side
   of any frontier admits exactly four things: paper, the graphite ramp, ink, and the
   alive.
2. **All or nothing.** A prop is either fully past the frontier (full palette) or fully
   not (graphite). **No half-tinted transitional objects.** The blend band belongs to the
   frontier texture (`trilayer.ts:286–298`), never to a prop's own fill.
3. **Age is thinness, never yellow.** An older coat sits closer to paper — more tooth
   show-through, same hue, never warmer. Capped: thinness is an accent on **≤15% of any
   surface** (worn centres, rubbed edges); the mass tone keeps the committed grade.
4. **A repair is one step off.** A repainted patch sits exactly one value step from its
   ground, same hue family, edges drybrushed — visible to a reader, invisible to a
   scanner. Repairs never introduce a hue.
5. **Ink-dark tiers are never adjacent.** `caveDark`, `gobTunicShade`, `ravenSlate` are
   the film's only near-blacks and never sit against each other in a frame. Big areas
   keep one value step of air above their accents.

Contrast floors, binding: captions ≥4.5:1, grid ≤4% toward ink, interface ink ≥3:1
breathed.

---

## 6. Composition rules

Binding from direction §6: four-plane rule, one eye-path per shot, goblin on thirds
(dead-centre reserved for the two direct addresses), captions in the lower-third band on
the margin system, page margin instead of letterboxing, `REF_FOV` 42° with the shipped
clamp + pull-back (`framing.ts`), no FOV tweens.

Added and binding:

- **The bench eye-level clamp.** Camera elevation is between **20° and 75°** in every
  shot of the film. ~~90° straight-down exists only at the board (S8).~~ **[ERRATA
  2026-09-03 — scene book §0 amendment 3: straight-down is legal wherever the frame's
  content is the finished map — **S7 from t62, and S8**. It never frames a standing
  world. The shipped `cam(62, 2.5, [145,40,0.01] → [145,0,0])` stands.]** No
  horizon-level landscape shots: the "sky" is the paper beyond, always ramping to
  `paper` in-material (`uTriNear`/`uTriFar`). The film is a maquette you lean over, not a
  landscape you fly through.
- **A sheet edge in every wide.** Every establishing frame shows **at least one island
  rim or the paper void**. No wide may crop an island on all four sides. Close-ups are
  exempt. Finiteness is the composition's signature, the way the hero's near rim cuts its
  bottom zone.
- **Island rims never touch the viewport edge**, at any breakpoint (`islandKit.ts:18–21`,
  direction §6's margin rule is absolute). The drop shadow's soft tail is exempt at
  ≤11% alpha (the P4c-T2(f) / P4e-T6 precedent).
- **Evidence lives in plane two or four, never plane three.** Keeping marks ride the
  foreground occluder or the supporting element — never the subject. If a mark competes
  with the beat's subject, the mark moves.
- **The four flagships each get exactly one authored framing, inside their own freeze.**
  This amends DIR-C §6: the film does not hunt evidence in motion, and there are no
  insert shots or push-ins onto second-plane texture — but a flagship beat with nothing
  else on screen and a stopped clock is permitted, and required to be, framed for
  legibility. S4's arcs get the freeze's slow push-in the flicker already carries; S5's
  mug rings sit in the frozen frame's near plane at reading scale. **A mark the camera
  is forbidden to point at is a mark that does not exist.**

### The phone-width contract

This closes FINDINGS `P4d-T6` and owns the portrait solve, which framing alone did not
deliver (measured: ~36 px figure at 500×915).

**The figure floor.** At any **acting** beat the goblin projects **≥100 px of figure
height** on landscape and **≥84 px** on portrait ≤560 CSS px wide. Establishing wides —
the only shots where he is not acting — are the sole shots permitted below the floor.

**The mechanism, applied in this order per beat:**

1. **Camera distance.** The portrait comp solves per breakpoint, the `compFor` /
   `BELOW_FRAC` precedent (`hero.ts`, FINDINGS P4d-T3, P4e-T2). Height-aware, always.
2. **The portrait beat re-frame.** On portrait ≤560 px every acting beat carries a
   **second authored camera target** (`portraitLook`) — a tighter, differently-composed
   shot of the same moment, not a crop of the landscape one. This is authored staging,
   not a runtime crop, and **not a FOV tween** (the shipped clamp holds).
3. **Drop the wide.** Where (1) and (2) cannot reach the floor without breaking the 92vw
   island margin, the beat **plays as a medium**: the island shows a rim and one plane of
   dressing, not its whole footprint. The stage's establishing wide happens on either
   side of the acting beat, never during it.

**Figure scale is uniform and locked at `GOB_SCALE = 0.75`** across the whole film — the
hero's ledgered supersession (P4e-T1) adopted body-wide, 21% above the doc's 0.62. World
scale per beat does not change; camera and shot size do. **[ERRATA 2026-09-03 — two
surfaces, one name: this film-wide `GOB_SCALE = 0.75` is NOT the goblin doc §11.2 / gate
G7 scalar, which the **Cover** solves per breakpoint for a ≥52 CSS px projected figure
capped at 1.35×. The shipped `hero.ts:50 export const GOB_SCALE = 0.75` is the Cover's
(it is read only inside `stageGoblin`) and **renames to `HERO_GOB_SCALE`**; the film
body's constant takes the `GOB_SCALE` name at film level.]**

**Check (required):** `scripts/figure.check.ts` asserts the projected figure height for
every **`A`-flagged (acting)** beat in the scene book §3 beat table at 390×844, 500×915
and 768×917 — ≥84 px, and ≥100 px at 1440×900 and 1920×1080. **[ERRATA 2026-09-03 — "no
exceptions" is struck: `E`-flagged establishing beats are exempt by construction, and
S7-B6 (the throw) carries a **registered** exemption the check's beat table must carry
or it fails at 390 px. The scene book §3's `A`/`E` flag is the check's single source of
truth.]**

**Everything else at phone width:** islands restack vertically rather than crop; the
caption band and margin hold at 390×844; the S5 interior is sized against
`MAX_PULLBACK 2.2` with its open side facing the pulled-back portrait camera by
construction; the die's painted numerals and the S5 mug rings are both QA'd at 390 px
exactly as the clarity contract §11.5 requires. A flagship evidence read that cannot
survive 390 px **demotes itself to texture at that breakpoint** — it does not shrink the
shot.

---

## 7. Materials

One material system, no exceptions: `createTrilayer()` — paint (lit gouache) /
underdrawing (authored stroke tiles through the 4-tier tone quantizer) / edge-wear
drybrush, mixed by the curtain uniform, with per-material knobs `poster`, `stroke.dir`,
`stroke.sheet`, `wear`, `feather`, `ground`. **Every class below is a recipe of those
knobs plus an authored albedo bake. No new material system is introduced.**

The four techniques the hero proved are the entire toolkit:

- **A** — canvas-baked gouache albedo (`bakeIslandAlbedo`: committed dabs in measured value tiers)
- **B** — baked authored stroke tiles (`bakeStrokeTiles`, `trilayer.ts:94–204`: four density tiers of hand-drawn tapered strokes, one family direction, `flipY = false`, `anisotropy = 16`)
- **C** — the 4-tier tone quantizer (`trilayer.ts:345–347`, unchanged since P4d)
- **D** — anisotropic dab noise at frontiers (`trilayer.ts:286–298`, with pooling and tide-line at 310–319)

| Surface class | Technique | Hero precedent it inherits from |
|---|---|---|
| **Rock / cliff** | Closed lathe with stepped strata; baked gouache in **3 quantized tiers** riding `roughen()`; strata read as **contour steps**, never hatch; section bands at every cut; drybrush on climbable edges only — rock wears where hands go. `stroke.sheet: true`, one family per mass. | A + B + C; the island skirt's three-band lathe (P2-T1 third cut) at landform scale |
| **Timber / carpentry** | `bakeBark`-family directional streak bake along the grain; **straight edges kept** — carpentry keeps its ruled silhouette and paint supplies all tone; box construction + end-arcs + strap lines on the Prep side; corner-lightening on handled parts only. | A + B; `bakeBark`, the chest's `boxMarks` pattern |
| **Foliage** | `bakeFoliage` clump-mass tiles on lobed-crown / tiered-cone geometry; `poster: 12` on crowns for committed steps; **silhouette radii derived from the tier cone profile via `silR()` — never authored free** (the P4d-T2 lesson); scalloped lobe outlines + interior leaf arcs as authored contours; `stroke.sheet: true`. **No wear** — trees are tended, not handled. | A + B + C; `buildTree` (`hero.ts:890`), `silR()` |
| **Cloth** | Sculpted fold masses; fold-following brushwork, **one direction per garment panel**; `poster: 3`; committed shadow mass; contour + two fold lines on small cloth, no tone fill; hem-edge drybrush. Hem follow-through physics is goblin-only. | A + B + C; the hero cloak lathe grammar |
| **Water** | **Bare paper with a drawn edge line.** A pencil does not fill water; the drawing admits it. Shorelines take technique **D** — the dab frontier as the drybrush where water meets land — plus the `triEdge` tide-line, which is already a waterline. Optional: a flat `water #679FB4` pigment band with tangent-aligned lit dabs for the S7 river only. **No transparency, no reflection, no specular, ever.** | D; `trilayer.ts:316–319` |
| **Metal** | Gouache by value (`brass` / `iron` / `gold` / `steel`), matte; **one authored glint stroke per hero prop** — a miniature painter's dot-and-line, baked into the paint layer, never a specular; contour + one core-shadow stroke on the Prep side; rubbed-bright on gripped parts. **No environment reflection, ever.** | A; the die's glint treatment |
| **Fire / light** | Lathe tongue geometry + `buildGlowSprite` amber radial + painted glow cones. **The only emissive family.** Prep side: a still graphite teardrop — a drawn flame, no glow, no rays. Scorch is **painted dark pooling**, never crosshatch. Glow dies with the paint (`rigs.ts:143`). | `buildFlames`, `rigs.ts` flicker |
| **Snow** | **Reserved paper.** Snow is the page showing through, shaped by blue-grey shadow strokes and a drawn windward edge — you paint *around* snow, not over it. Nearly free, and doctrinally correct: **the S4 mountain is barely painted because nobody has played there yet.** Prep state = Performance state minus the shadow strokes. | Reserved-paper is native to the trilayer's `uTriPaper` base |
| **Paper props** (sheets, sign faces, DM screen, book, map sheet) | `dieBone` ground + **authored illegible scribble-rows, one direction**; the same scribble in graphite on the Prep side; dog-eared corner lightening. Sheets separate from each other by contact shadow and an ink rule line, never by tone fill. | B; the stroke-tile bake at prop scale |
| **The painted map** (S7 flatten targets, S8 board) | The product's own art: flat map paint for terrain, inked roads, painted flame marks, illustrated canopy blobs, gabled house icons, token discs. **A map is already both drawing and paint, so it renders identically on both sides of any frontier and inside every freeze** — the third truth. Its underdrawing IS the battle grid. Board shows light handling wear at its edges. | New bake, `bakeBoardMap()` — see §9 and gap-closure G4 |
| **Particles** (motes, moths, embers, dust, pollen) | Painted flats and authored scribble sprites, Performance-side only, all on the world clock, frozen mid-air by the tick. Prep side: absent — except S2's frozen dust, which renders as a **graphite scribble sprite**. | Shipped hero motes/moth |

### The hatch retirement programme — a named work item

**[ERRATA 2026-09-03, verified against the file — the roll is stale in three ways.
(1) The count is now **31 live sites**, not 33: the goblin rebuild has already deleted
his flank and jaw patches. (2) **`1366` was never the goblin's** — it is the
**adventurer's** cloak tone, inside `buildAdventurer`, and it is still live (now
`world.ts:1644`); the goblin's own third hatch field was the nine-stroke `contact()`
call (`pencil.ts:487` builds a `hatch()` inside it), also already deleted. `buildGoblin`
now greps clean for `hatch(`, `contact(`, `blobs(`, `timberDark` and `paint(…fill:` —
goblin gate G9 passes. (3) **Every `world.ts` line number below is ~278 lines low**:
`world.ts` is now 4756 lines, not 4478, and the monster's not-hatch comment sits at
`3803`, not `3526`. Retire the sites by NAME, never by line.]**

`world.ts` carries **31 live `hatch()` / `crossHatch()` call sites** (32 grep lines; the
monster's tick-stroke comment is not a call). Every one maps to a row above:

`218` well shadow (chest interior) · `573` mushroom gills · ~~`978` goblin flank~~ ·
~~`1211` goblin jaw~~ **(both already deleted)** · **`1366` adventurer cloak tone** —
cast tier, retires with S1's "silhouette-first, painted cloaks, zero interior hatch" ·
`1573` S1 rock face · `1941` cave mouth · `2147`+`2189`
sign "letters" · `2628`/`2670`/`2689`/`2759` theatre tones · `2914` finger crease
(dies with `buildFinger`) · `3001` tavern bay · **`3018` window night** · **`3059`
firebox** · `3131` table wear · `3249` sheets · `3277` DM screen · `3409` montage ring ·
`3687` fragment window · `3772`/`3784`/`3809`/`3864` montage tones · `3952` cliff cracks
· `4016`/`4027`/`4044` scorches and trample · `4208` massif tone · `4260` water ·
`4297` field till.

**Two of these retirements become better shots, not equivalent ones:**

- **`world.ts:3018`** — the tavern window's crossHatch night fill is replaced by **an
  actual view of the undrawn world through the glass**. The room is finished; outside is
  still pencil. Gate fix and the best single shot idea in the field.
- **`world.ts:3059`** — the firebox crossHatch is replaced by **painted dark plus
  coals**.

The `curtain.ts` shader's near-black hatch accent retires with them. `hatch()` and
`crossHatch()` stay in `pencil.ts` as dead exports until the last call site is gone, then
are deleted.

### The seam — machinery taken, doctrine refused

The travelling seam is **not** the film's spine. It appears in exactly **two** places,
and its restraint is what keeps the curtain meaningful:

**[ERRATA 2026-09-03 — the two places use two different mechanisms, per scene book §0
amendment 1, which is forced by the shipped shader: `triSeamF = smoothstep(seamX−w,
seamX+w, vTriWorld.x)` and `triC = max(uTriCurtain, triSeamF)` (`trilayer.ts` ~276–300)
means the seam can only ever *add* Prep east of the line. Driving S7 off `seamX` would
flip the world's whole east half to graphite in one frame at t60. So: **frontier
grammar in exactly two places — S3's lantern as `rig.seamX` (island-scale), S7's
flatten as the per-prop `uTriFlat` ramp (world-scale), with `rig.seamX` parked at `1e6`
for the whole of S7.** The frontier *look* is authored into the flat ramp through the
shader's existing `triDabN` noise.]**

1. **S3's lantern bloom** — the touch reveal whose pool the frontier absorbs, the film's
   thesis image. **`rig.seamX`, island-scale.**
2. **S7's flatten** — the one legal world-scale frontier, sweeping outward from beneath
   him. **`uTriFlat` per merged group, NOT `seamX`.**

Nowhere else. No S4 radial seam (an angle around a pivot is a second shader mode, not a
dot — the turn stages with the shipped seven-transition grammar instead). No six
simultaneous montage frontiers (`rig.seamX` is shared by identity across every trilayer
material, `trilayer.ts:451`, and `triSeamC` is `vTriWorld.x`, `trilayer.ts:276`; the
montage discs sit at x = 0, 8, 16, 24, 32, 40, `world.ts:3396`, so one global world-x cut
slices all six at once). No frontier in S1, S2, S4, S5, S6 or S8.

**~~One contained extension is funded:~~ DECLINED. [ERRATA 2026-09-03 — scene book §0
amendment 2 stands: nothing in the film needs a non-x frontier basis (S3's path ribbon
runs +x; S7 uses no seam at all), so the `seamDir: Vector3` promotion is specified below
but NOT built, and its budget goes to the three-slot practicals array in `rigs.ts`. The
rig/shader extension count is net-neutral.]** The declined spec, kept for the record:
promote `seamX` from world-x to a **dot against a rig-side `seamDir: Vector3`**,
defaulting to `(1,0,0)` so the hero and every shipped frame are byte-identical. Two files
change together: `trilayer.ts:276` and `islandKit.ts`'s `shadowFrag` seam line. One
uniform, one dot product. The wobble/dab/tide machinery at `trilayer.ts:281–319` is
untouched either way, and S3 uses it as shipped.

---

## 8. Lighting

The two shipped rigs (`stages/rigs.ts`) carry the whole film. **Performance** = `skyDay`
hemisphere fill (`HEMI_I 0.8`) + warm `keyWarm` key (`KEY_I 2.2`) + the amber practical
glow flickering on the world clock. **Prep** = flat `paper` ambient (`FLAT_I 0.9`), **no
shadows — a drawing casts none** — except the alive, whose shadow strength is the
`rig.aliveShadow` uniform (film default 0.3). Both rigs are always live, blended by the
same curtain object the materials mix by.

### The coherence rule — committed shadow direction, scoped per chapter family

A baked albedo can only commit its shadow side once. Therefore **the key's azimuth is
fixed per chapter family, not per stage and not globally.** Three families, three
azimuths, and an asset baked for one family is never re-lit into another:

| Family | Stages | Key position | Azimuth | Why |
|---|---|---|---|---|
| **Exterior day** | S3, S4, S6, S7 | `(4, 6, 3)` — the shipped hero key | +18° screen | The bake direction every daylight asset commits to. Unchanged from `rigs.ts:119`. |
| **Exterior night** | S1, S2 | ~~`(1.2, 2.4, 1.6)`, warm, radius-limited~~ **the same `DirectionalLight` as the day family, lowered and dimmed: `KEY_I_NIGHT = 0.55`, `HEMI_I_NIGHT = 0.35`** | +18° screen, low | **The campfire is the key.** Same screen azimuth so an asset shared with the day family (the cliff) keeps its bake; only elevation and intensity drop. **[ERRATA 2026-09-03 — scene book §6 rig ruling 1: `rigs.ts`'s key IS a `THREE.DirectionalLight` and has **no distance falloff at all**, so "radius-limited" is not a thing it can be; making it one would convert the film's only shadow-caster to a point light for two stages, against a cliff baked for the day family. S1-B5's darkest frame is **composed and baked** — dusk hemisphere plus contact darkening in the island albedo — not lit by a falloff that does not exist.]** |
| **Interior** | S5 | `(2.6, 3.2, 1.1)` — the hearth | +38° screen | A hearth interior lit by an exterior sun key reads as daylight. This is the one family that moves the azimuth, and it lights only assets that exist nowhere else. |

**S8 is unlit:** `skyBoard` = `paper`; the board is lit by the page. **S2 is Prep:** no
key at all — his shadow is the only one in the frame.

The cliff is the only asset shared across two families (S1/S2 night, S7 day). It is
baked **once, for the day family**, and the night stage takes it at reduced key intensity
with the same azimuth — which is exactly why the night family holds +18°.

### Per-stage deltas

| Stage | Air (hemisphere) | Key | The rule the stage applies |
|---|---|---|---|
| S1 | `skyDusk` `#6D78AE` — real night | the campfire, sole warm pool; embers on the world clock | the film's first proof that light is painted |
| S2 | Prep — flat paper light | none | his shadow is the only one in the frame |
| S3 | Prep → `skyDay` `#ACCDE6` morning | the lantern he lights; the key warms as the world returns | **colour arrives with shadows, from the touch point** |
| S4 | `skyOvercast` `#AAB6C0` | flat grey key near-vertical, **no practicals** | a theatre between shows; the flicker's graphite machinery casts nothing |
| S5 | `skyHearth` `#D4B184` interior | hearth + candle practicals carry the room; key demoted | the film's only interior; warmth is the room's argument |
| S6 | `skyVellum` `#EEE6D2` — bright, flat, weightless | one soft key per vignette | **montage light never changes mid-vignette** |
| S7 | `skyDawn` `#E6C1A2` gold | low dawn key + painted god-ray cones in `rayGold` | light is a painted object, never a flare |
| S8 | `skyBoard` = `paper` | none | the film ends in the light it was drawn in |

### The lantern ledger

**Every light source in the film is one the goblin lit on camera or plausibly
maintains** — the fire he laid, the lanterns he fills, the candles he sets (S6's sixth
vignette is literally him lighting them). **No unmotivated light anywhere.** Light is his
signature, which is why the CTA taking light on touch reads as *his* grammar handed to
the visitor.

**Shadow policy.** One shadow-casting light, ever — the key. The painted world casts
through `markCaster` while any paint is up and **releases at the fully-drawn page**, so a
frozen frame's shadow map holds only the alive. Staging rules P3-T2 and P3-T4 bind every
stage: warm sources are placed on the painted side, and world casters are kept clear of a
frontier's shadow-throw line or left unregistered. Contact blobs (`pencil.ts:487`) ground
every **painted** prop, baked into the island albedo; **graphite props get none — a
drawing casts nothing.**

---

## 9. The 3D kit — the asset register

Build once, reuse everywhere. Four tiers by polish depth. This is the list the build
works from. **Nothing on this list may be a default primitive with a flat fill.**

### Grammar kit — 8 items (shipped; extend, do not rebuild)

1. **Island card + page drop shadow** (`islandKit.ts`) — the base every set stands on.
2. **The trilayer + stroke-tile bake** (`trilayer.ts`) — one program, per-class recipes.
3. **The two rigs** (`rigs.ts`) — extended with the three chapter-family key presets.
4. ~~**The seam basis** — `seamDir: Vector3` promotion (§7).~~ **DECLINED [ERRATA
   2026-09-03]** — not built (§7). The slot is spent instead on the **three-slot
   practicals array** in `rigs.ts` (`rigs.ts` ships one fixed amber `PointLight`;
   four stages need several at once, and S6's three candles set the cap at three).
5. **The grid ghost** — per island, ≤`GRID_INK`, extending a few cells onto the paper.
6. **The travel line** — self-drawing graphite path between sets, `LineSegments2` +
   `instanceCount` ramp, un-drawing on reverse.
7. **Margin furniture** — ticks, chapter numerals, the 66-tick ruler (passed ticks ink
   in), skip note, play/pause/replay, © line. DOM, never over a set piece.
8. **The particle language** — motes, moths, embers, pollen, cloud flats, the graphite
   dust scribble. Performance-only, freezable by construction, first thing shed on low
   tier.

### Hero tier — 6 items (jewel polish; every close-up cites these)

1. **The goblin** — the full surface rebuild. §14 below answers the client's complaint.
2. **The d20** — `dieBone` gouache, painted numerals readable at 390 px, worn edges, one
   authored glint, real inertia on the tumble. Geometry solved (`dieGeometry.ts`); the
   treatment is the work. Plus `die2` (S7 throw) and the endcard send-off die.
3. **The lamppost** — the hero's, **restaged so the flame is never occluded by its own
   post** (P4d-T5 is a staging rule now, not a weight problem) and so the bracket
   resolves against the sky rather than the pole.
4. **The hand lantern** — the one he carries between sets.
5. **The carpenter's pencil** — exists (hero). Recurs at S6's road vignette (scaled up as
   the fence-post pencil). **[ERRATA 2026-09-03 — "and at the endcard" is struck: §12 and
   the scene book §5.2 both spec the endcard as wordmark → tagline → subline → CTA on the
   bare board, *"no box, nothing extra"*. The pencil's drawn language survives there only
   as the CTA's hand-redrawn offset border. Its two appearances are the Cover and S6-B1.]**
6. **The brush and pigment pot** — new. Lives in the satchel; used once, on camera, in
   S6. Pencil draws the Prep, brush paints the Performance: the trilayer's origin story
   as two props.

### Set tier — 12 island cards + 5 set pieces

**[ERRATA 2026-09-03 — "9 islands" matched neither this list nor the scene book's §6
table. The enumeration below is twelve: camp · cliff · path ribbon · theatre · tavern ·
six S6 worksheet islets · the miniature world. Scene book §6's grammar-kit row is
corrected to the same number.]**

Islands (each with sculpted three-band edge, roots, drawn rim, grid ghost):

1. **Camp island** (S1)
2. **Cliff island** (S1/S2/S7 — **one asset, two eras of dressing**: remains, then tended)
3. **Path ribbon island** (S3 — the big build; **the hero island is a slice of it**, so its albedo/bark/foliage bakes extend 1:1)
4. **Theatre disc + backstage apron** (S4)
5. **Tavern interior shell** (S5 — cutaway, open side facing the pulled-back portrait camera)
6–11. **Six vignette islets** (S6) — small square work-sheets, one subject each, island
   edges, **non-verbal draughting marks in the margins**: dimension ticks, one arrow, an
   X where a prop will stand.
12. **The miniature world** (S7) — v1's `miniWorld` topology **kept and re-surfaced**.
   Not a desk, not a table of plates.

Set pieces:

13. **Theatre machinery** — capstan, radial rails, counterweights. **Graphite-only; the
   film's one asset with no paint side.** Freeze-visible, and **worn**: the scribed arcs
   under the disc are flagship beat 2.
14. **The rope** — catenary + fray + coil, shipped at `world.ts:2802+`, re-surfaced.
15. **The snowy mountain flat** — reserved-paper snow; an honest theatre flat, visibly a
   cut sheet standing in a slot at the freeze.
16. **The tavern hearth + firebox** — painted dark plus coals (retires `world.ts:3059`).
17. **The tavern window** — a real view of the undrawn world through the glass (retires
   `world.ts:3018`).

### Flora kit — 10 items, built once, merged per island

pine (3 sizes) · oak (2 sizes) · sapling · stump + rings · snag · fern · grass tuft ·
sprig · **mushroom (caps in threes — the signature)** · moss patch. All `poster`-tier
crowns, `stroke.sheet: true`, `silR()`-derived silhouettes.

### Rock kit — 6 items

boulder (3 sizes) · outcrop cluster · cliff strata stack · scree · pebbles · **cairn
stones** (S7's tended beat, shipped at `world.ts:4052+`).

### Carpentry kit — 12 items

signpost (with **older nail holes in graphite**) · cave door + timber frame · chest +
judged coins · bench · table (tavern + montage) · plank surface · stage disc + kerb ·
gabled house (montage + miniature) · tavern sign + chains · shelf + bottles · DM screen
(faced with map art — the third truth, planting the ending) · long table + book.

### Light kit — 8 items

campfire (ring + logs + tongue flames + glow) · hearth fire · candle · candle set (S6) ·
lantern glass tiers · glow sprite · ember particles · painted god-ray cones (`rayGold`).

### Cast tier — 7 items (silhouette-first; never out-chroma the goblin)

**[ERRATA 2026-09-03 — the list below has seven entries, not nine: adventurer trio · DM ·
two players · tavern patrons ×3 · ravens ×3 · the monster · the NPC based miniature.
"Never out-chroma the goblin" now reads against the goblin doc's §4.2 palette (§5): his
chroma is the skin and the amber eyes, his mass is the frame's darkest cool value.]**

adventurer trio (S1: `cloakIndigo` ×2, `cloakCrimson` ×1) · DM · two players · tavern
patrons ×3 · ravens ×3 · **the monster** (S6 — **its tick-stroke shag at `world.ts:3526`
is already the correct no-hatch language, authored specifically as not-hatch; keep the
language, repaint the surface**) · **the NPC as a based miniature** (S6 vignette 5): the
script's own simile — "moving NPCs into villages like a chess piece" — made literal. A
painted figure on a visible base is a token; at the flatten every figure resolves to a
token disc. The product rhyme costs one prop.

### Keeping props — 8 items (the concept's own shelf)

cairn + planted mushrooms · mugs (whose rings are on the table) · bedroll / pack / spear
camp kit · arrows + dropped shield + bolt (S1 remains) · spilled drop, frozen in air ·
character sheets · the map sheet + quill + inkpot (S6 vignette 0) · **eraser-ghost
decals** — graphite-layer marks in `graphiteLight`: a door's previous swing arc, a tree's
prior position ellipse. **Exactly four, one per flagship beat's supporting cast.**

### Board tier — 3 items

1. **The board map** — a real authored Good Goblin map of the film's own world: the
   islands you walked, as their map. `bakeBoardMap()`, one 2048² canvas bake, the film's
   only texture above 1024². Replaces the `GridHelper` + `boardFill` placeholder
   (`world.ts:4337–4351`). **The single most product-critical asset on the site.**
2. **The flatten target set** — illustrated canopy blobs, gabled house icons, inked roads
   at 2 px, painted flame marks, field washes, token discs at one-cell diameter, water as
   bare paper with a drawn edge. **These are slices of the same `bakeBoardMap()` atlas**,
   addressed per-prop by a UV rect, so the flatten's destination can never drift from the
   board it lands on.
3. **The endcard lettering set** — the Hand's authored stroke SVGs for the tagline, plus
   the CTA's drawn double-border.

---

## 10. Depth language

Two languages, one per state, both already in-material (`trilayer.ts:15–21`). No scene
fog anywhere — it would stack a second, differently-coloured ramp and would fog the Prep,
which has none.

- **Performance depth is atmospheric.** Distance ramps the lit result toward **`paper`,
  never grey** (`rig.depthNear` / `depthFar`, staged per island scale). Parallax cloud
  and hill flats behind. ~~Tilt-shift DOF~~ **[ERRATA 2026-09-03 — scene book §0
  amendment 4: there is NO DOF pass anywhere in `story/src` and the experience doc
  budgets one post pass (the curtain). Same two beats, same intent, shipped machinery:
  the depth-to-paper ramp (`rig.depthNear`/`depthFar`) TIGHTENS]** at **exactly two
  moments in the film**: the S5 die close-up and the S7 miniature reveal. Nowhere else.
- **Prep depth is graphite.** No fog, no DOF — line-weight falloff (far strokes fainter,
  more paper), and foreground occluders nearer than `rig.silhouetteNear` go near-black
  silhouette: a shape in front of the drawing, not a drawing.
- **Depth doubles as age.** Because distance fades toward paper, far scenery reads as
  older, thinner coats and near scenery as the freshest paint with the most wear. The
  film's space and its time agree without a single new uniform.
- **Backdrop flats are honest theatre sheets** — allowed for atmosphere, **banned for
  solid matter**. At any freeze their sheet-nature is visible in graphite (an edge, a
  brace). The camera proves depth by moving past island rims (occlusion), never by haze
  quantity. Three to five real planes, the depth of a maquette. Never videogame draw
  distance.
- **Camera vocabulary:** authored rails, push-ins on freezes, the angle-echo bookend
  (S1 ↔ S7), the axis-locked rise. **No orbits, no free camera, ever.**

---

## 11. Motion language for the film body

Architecture is shipped and binding: `world.t` / `timeScale` freezable, `gobT` never
stops, scroll owns the master timeline, three ease lanes, house ease `power2.out`, the
seven named transitions. The body's dialect on top:

- **The keeping gestures are the choreography.** The acting alphabet (`actions.ts`:
  `stoop`, `lift`, `tap`, `haul`, `shrug`, `wave`, `nudge`, `dustOff`, `straighten`)
  gains **four verbs in the same file, on the puppet lane**: `hop` (onto and off the S5
  bench — mandated by the `buildFinger` retirement), `hang` (the sign), `plantAndPat`
  (the tree), `touchUp` (one brush stroke — used exactly once, S6). **[ERRATA 2026-09-03
  — `coinDrop` is struck: the S6 chest vignette it served is cut (scene book §3-S6), and
  S3-B5's judged coins are a `PUPPET.pop`, not a verb. `hop` replaces it. Separately,
  the goblin doc's own five — `freeze` `stow`/`draw` `scribe` `pocket` `throwDie` — have
  SHIPPED (`actions.ts:631/669/694/722/752/772`); these four are what remain to author.]**
  His work reads as **practiced**: no gesture hesitates, every
  settle is `power2.out` confidence.
- **Touched things bank their life.** The S3 grammar — each revealed prop regains its
  idle, one by one, embers of motion accumulating in a still world — is the body's
  signature move. S6 reprises it per vignette at tempo.
- **The world only ever moves where he has been.** Ambient life (flicker, moths, leaf
  sway) rides `world.t` and exists only on surfaces he has lit or dressed. An untouched
  graphite region is still by construction — the lantern ledger, kinetically.
- **Freezes are instant; resumes exhale.** The tick is ≤0.15t and never eased, never
  announced; the exhale is 0.3t with the world resuming mid-gesture. **The t12.5
  `timeScale` stop tightens from 0.2t to the spec 0.15t when S2 rebuilds** — this closes
  FINDINGS P1-T3 and P2-T4.
- **`buildFinger` retires.** `world.ts:2890–2920` and `nudgeFinger` (`world.ts:3194`) are
  deleted. The v1 finger-only compromise is replaced by the experience doc's actual
  staging: **the goblin strolls into the frozen room, hops on the bench, and nudges the
  die with the full puppet.** It keeps its 4-frame anticipation and stays the most
  polished animation in the film. `world.ts:2914`'s crease hatch dies with it.
- **The scrub reads backwards as un-keeping.** Reverse un-paints, un-writes, un-lights,
  un-draws the travel line, in reveal order. The projectionist can always audit the work.
  **Two moves must be flawless in both directions: the S4 disc turn and the S7 flatten.**
  The disc turn keeps its 0.35 s input smoothing (perceived inertia).
- **The boil is UI-side only** — margin, lettering, CTA offset border, ≤0.8 px. **World
  strokes never boil**: the stroke tiles are baked and still, and that stillness is what
  the freezes read against.
- **Reduced motion:** the stepped picture book, per the complete mapping (motion §14).
  `A = 0` is *still, at the lit pose*, not merely reduced. Live `matchMedia`, no reload,
  as `rigs.ts:42–51` already does.

---

## 12. Conversion — the endcard and the one action

At t66 the visitor must **understand**: *this world was kept by someone, the keeping is
the product, and the map in front of me is where it happens.* And must **feel**: *I want
that goblin at my table.*

**One action: Join the Discord.** No waitlist, no feature list, no second CTA, no
backend, no analytics shipped by default. `DISCORD_URL` stays the single wired constant;
if it is unset the button does not render.

- **The board is a real authored map in product style** — the film's last frame is the
  product's first frame, no cut. The morph (`d20` face → board, edge-to-edge) is shipped
  grammar and still scrubs backward.
- **The endcard is `copy-spec.md` direction C, verbatim and unchanged**: wordmark →
  tagline → subline → CTA, lettered directly on the board, **no box, no card, no wash, no
  drawn border, no drop-shadow smudge**. Per-glyph paper halos do the knockout. The
  entrance choreography (t65.0–66) is locked: wordmark opacity in, tagline `clip-path`
  write-on, subline at ~60% of the tagline's, CTA last — the last thing to arrive is the
  thing you are asked to do. Scrolling back un-writes it.
- **The CTA performs the film's one taught rule.** Drawn at rest: graphite outline, paper
  fill, a second border offset 2–3 px and rotated ~0.4° at lower opacity — a drawn-world
  object with a hand-redrawn line. **Touch-lit on hover and focus:** amber blooming
  through the letterforms from the pointer side, with the contact shadow arriving
  alongside the colour. The visitor's first touch is the goblin's grammar, given away.
  Click: the die rolls a natural 20, new tab.
- **One quiet trace of the concept:** the board carries faint edge-handling wear — this
  map has been played on. **No pentimenti on the board itself**; contrast and product
  truth outrank the theme at the conversion surface.
- Skip note from t16.5, replay valve, board breath ≤0.5% at rest, nothing rendered below
  the endcard.

---

## 13. Per-stage art delta

**[ERRATA 2026-09-03 — every `world.ts` line ref in this table is ~278 lines low: the
file is now **4756** lines (the goblin rebuild landed). Landmarks moved:
`earthPlane`/`grassPlane` 2244–2254 → **2522–2532**; `buildFinger` 2890 → **3168**;
`buildTavern` 2923 → **3201**; the rope 2802 → **3080**; the montage discs 3396 →
**3674**; the monster's shag comment 3526 → **3803**; `GridHelper` + `boardFill`
4337–4351 → **4615–4629**. **Read every retirement below by name, never by line.**]**

Line refs were current `world.ts` at 4478 lines. **Kill** = retired. **Keep** = geometry
survives, surface rebuilt. **New** = authored fresh.

| Stage | What `world.ts` does today | What v2 does instead | Assets to author |
|---|---|---|---|
| **S1 — The Claim** (t0–10.2) | `buildAmbush` 1532–1766 over the infinite `earthPlane`/`grassPlane` (2244–2254); rock-face hatch tone 1573; flat-fill treeline rows; band-plate horizon; decal firelight; `Film.tsx:100`'s `0xffb45e` glow | **The two planes die.** Camp island + cliff island with sculpted three-band edges. **Genuine night**: `skyDusk` air, the campfire as the sole key (exterior-night family), embers on the world clock, amber ramp replacing the non-amber glow. Rocks and cliff take baked 3-tier tone + authored contours. Adventurers re-surfaced silhouette-first, painted cloaks, no interior hatch. Bolt/arrow impacts as painted strokes + `rayGold` bursts. The `camp` children-filter coupling (1759–1763) is retired by giving the island an explicit group. | camp island (N) · cliff island (N, shared S2/S7) · campfire kit (R) · camp kit: bedroll/pack/spear (R) · adventurer trio (R) · ember particles (R) · cloud/streak flats (R) · arrows + shield + bolt (R) |
| **S2 — The Address** (t10.2–16.5) | The shipped curtain freeze over v1 geometry; dust is a decal; `timeScale` stop is 0.2t | **Flagship beat 1.** The cliff's underdrawing gains construction ellipses, measure ticks, and **one erased, redrawn contour** in `graphiteLight` under the committed line. The grid ghosts in. Dust hangs as a **graphite scribble sprite**. **His contact shadow is the only one in the frame** (`rig.aliveShadow`). Tick tightened to ≤0.15t, closing P1-T3 / P2-T4. One authored framing on the erasure inside the freeze. | cliff underdrawing mark set (N) · erased-contour pair (N) · dust scribble sprite (N) · the four `me*` letterings (N, P6) |
| **S3 — Proof of Light** (t16.5–26.5) | `buildPathProps` 1802–2218 + `buildGround` dressing 2225–2590 on infinite planes; cave-mouth crossHatch 1941; sign "letters" 2147/2189; 44 flat-fill trees; sun disc + ray decal | **The path becomes a ribbon island** — the hero island's own bakes extended 1:1. All seven prop beats keep their timeline marks; each prop gets its authored surface **plus one whisper of history** (older nail holes on the signpost, a graphite ring where mushrooms grew last season). Sign letters become scribble rows. Cave mouth becomes `caveDark` paint + contour. Sun disc dies: morning is the day-family key at `skyDay`. **The lantern beat is the thesis image** — the pool blooms, trees take their paint back, shadows arrive with colour; the frontier (`rig.seamX` on the shipped default basis — **[ERRATA 2026-09-03: the `seamDir` extension is declined, §7]**) absorbs the reveal. Lantern staged so the flame reads and the bracket resolves. | path ribbon island (N, the big build) · lamppost restage (R) · cave + door (R) · chest (R) · perch tree + ravens ×3 (R) · signpost (R) · mushrooms (R) · flora kit ×40+ merged (R) |
| **S4 — Proof of Scenery** (t26.5–36) | `buildTheatre` 2593–2886; hatch tones 2628/2670/2689/2759; flat-fill disc; snow-capped mountain with rock tone | Disc becomes a **planked painted stage** (floorboard bake, kerb wear where the rope runs). Forest half on **visible radial rails**. Mountain flat = **reserved-paper snow** — barely painted because nobody has played there yet. The freeze-flicker reveals graphite-only machinery, and **flagship beat 2: scribed arcs worn into the under-disc.** `skyOvercast` air, flat near-vertical key, **no practicals**. Turn stays scrub-tied 1:1 with 0.35 s smoothing. **No radial seam.** | stage disc + kerb (R) · machinery set: capstan, counterweights, radial rails (N, graphite-only) · scribed-arc marks (N) · rope (R) · mountain flat (R) · scree + foot pines (R) |
| **S5 — Proof of Time** (t36–50) | `buildTavern` 2923–3390; crossHatch window 3018 + firebox 3059; hatch table wear 3131, sheets 3249, screen 3277, bay 3001; `buildFinger` 2890 + `nudgeFinger` 3194 | The film's **only interior**, on the interior key family (+38°): hearth and candle practicals carry the room, dark corners kept. Window → **a real view of the undrawn world through the glass.** Firebox → painted dark + coals. Table wear → drybrush. Sheets and screen → authored scribble rows. **The die gets jewel treatment**, numerals QA'd at 390 px. Patrons mid-laugh, mugs, spilled drop frozen in air. **Flagship beat 3: graphite mug rings** on the table, framed inside the freeze. **`buildFinger` retires** — full-puppet nudge. **The humans freeze into graphite** (gap-closure G6). | tavern shell cutaway (R) · table + mug rings (N) · d20 jewel treatment (R) · mugs/sheets/screen/candle (R) · DM + two players (R) · patrons ×3 (R) · spill-drop prop (N) · window view set (N) |
| **S6 — The Many Jobs** (t50–57.5) | `buildMontage` 3393–3882; six discs at z = −40; hatch tones 3409/3772/3784/3809/3864; fragment window crossHatch 3687 | Six discs become **islets with island edges + baked surfaces + non-verbal draughting marks in their margins**. The monster **keeps its tick-stroke shag language (3526 — already correct) and is repainted**, not rebuilt. The NPC becomes a **based miniature**. ~~Chest coins are judged one by one.~~ **[ERRATA 2026-09-03 — the chest vignette is CUT (scene book §3-S6): it re-argued S3-B5 with the same registered prop thirty seconds later, and the montage's job is to accumulate, not restate. The six subjects are road · monster · sign · saplings · NPC miniature · candles, one per shipped slot solve. `world.ts`'s `hoardTone` hatch dies with the geometry.]** The candle vignette hands off to dawn. The road vignette uses the fence-post pencil; **the one `touchUp` brush stroke lives here.** Hard cuts as paper flashes. `skyVellum`, one soft key per vignette, never changing mid-vignette. | six islets (N) · monster repaint (R) · NPC based miniature (N) · tavern sign + chains (R) · sapling trio (R) · ~~chest + hoard~~ **(cut)** · candle table + book (R) · map sheet + quill + inkpot (R) · **brush + pigment pot (N — hero tier 6, its one on-camera use)** · draughting-mark set (N) |
| **S7 — The Handover** (t57.5–64.5) | `buildCliffWorld` 3905–4388; hatch cracks 3952, scorches 4016/4027, trample 4044, massif 4208, water 4260, till 4297; roads/river/fields sit **outside** `miniWorld` (4215–4265) and never flatten | The bookend cliff reads **tended in half a second** — cairn + mushrooms, already built at 4052–4093: **flagship beat 4**, already the shot. `skyDawn` + painted god-ray cones. The miniature world below becomes a **real miniature** (houses, trees, massif re-surfaced; fields painted; water as bare paper with a drawn edge). **Everything flattens** — roads and river join `miniWorld`'s lie-down, closing the v1 split. The flatten runs as the film's one world-scale frontier, sweeping outward from beneath him; its far side is the map. **[ERRATA 2026-09-03: driven by per-group `uTriFlat`, never `rig.seamX`, which stays parked at `1e6` for all of S7 (§7).]** ~~Tilt-shift~~ **the depth-to-paper ramp (`rig.depthNear`/`depthFar`) tightens** for one breath at the rise — **there is no DOF pass in this film (§10).** The die throw fills frame with a painted 20. | tended dressing (K) · miniature world re-surface (R) · flatten target atlas (N — slices of `bakeBoardMap`) · `die2` (R) · god-ray cones (N) · road/river/field flatten wiring (N) |
| **S8 — The Table** (t64.5–66 → rest) | `board` group: `GridHelper` 4351 + `boardFill` 4337 + rule loops | The board becomes **a real authored Good Goblin map of the film's own world** — the islands you walked, as their map. Endcard per `copy-spec.md` direction C. CTA per §12. Board breath ≤0.5% at rest. The board group's material-locality + opacity-fade contract holds for the new asset. | the board map, `bakeBoardMap()` 2048² (N) · endcard lettering SVGs (N) · CTA drawn double-border (N) |
| **Persistent interface** (all stages) | Metamorphous caption divs | The Hand's authored letterings replace them, **keeping the same element ids** — every `cap()` call silently no-ops on a missing id (`timeline.ts`'s early return). Margin, ticks, chapter numeral, 66-tick ruler (passed ticks ink in), skip note from t16.5, play/pause/replay, © line. All DOM, never over a set piece. | 11 caption letterings + tagline (N, P6) |

---

## 13a. The seven gap closures

These are decisions, not open questions. Build against them.

**G1 — Instancing vs per-material uniforms. Ruling: merge, never instance.**

`InstancedMesh` is **banned in this film.** The trilayer's vertex injection computes
`vTriWorld = (modelMatrix * vec4(position,1.0)).xyz` (`trilayer.ts:482`) and does **not**
read `instanceMatrix` — so every instance of an `InstancedMesh` would sample the stroke
tiles, the grid, the seam and the depth ramp from the *same* world position. Instancing
does not merely cost work; it breaks the material.

The shape that works:

- **A fixed material registry, `src/film/stages/surfaces.ts`.** One shared trilayer per
  surface class from §7 (11 classes), plus at most **3 stroke-direction variants per
  class** where a class genuinely needs more than the ±7° of hand variance the bake
  already carries. **Ceiling: 33 trilayer materials for the whole site.** All share the
  rig uniforms by identity and one program (`customProgramCacheKey`).
- **Repeated props merge.** Every stand of trees, rocks, tufts and mushrooms on an island
  is merged into **one `BufferGeometry` per class per island** with transforms baked into
  vertices — which is also what makes `vTriWorld` correct for free. A 40-tree stand is
  one draw call.
- **Per-mesh materials exist only where a mesh needs its own state**: `markAlive`
  entities, `reveal()` targets, and flatten targets (which carry `uTriFlat` / `uTriFlatUv`
  — see G7). That set is countable and small: **≤40 across the film.**
- **Budget, measured, not asserted by feel: ≤120 draw calls per stage**, and no stage may
  raise the total above the S3 ribbon island's measured figure without a recorded
  decision. `scripts/draws.check.ts` reads `renderer.info.render.calls` at each stage's
  authored camera and fails above 120.

**G2 — Bake budget and first paint. Ruling: three at load, the rest one stage ahead.**

- **Grammar bakes, at module load: 3.** The stroke tiles (the shipped 1024²,
  `trilayer.ts:94–204`, unchanged), the paper tooth, the contact blob.
- **Class albedo bakes: 11**, one per §7 row. **512² for tiling classes** (rock, timber,
  foliage, cloth, water, snow, paper props, particles); **1024² for the four that carry
  close-ups** (the goblin's cloak, metal, fire, the island ground). Plus the board's
  single **2048²**, which is the film's only texture above 1024 and is the exception that
  proves it.
- **Texture-memory ceiling: 48 MB, for the whole site.** **[ERRATA 2026-09-03 — the
  arithmetic as written breached its own ceiling: 8 × 512² + 4 × 1024² + 1 × 2048² RGBA
  is 40 MiB, and ×1.33 for mips is **53 MB**, not 45. **Ruling: the ceiling holds and the
  board's 2048² ships without a mip chain** — it is only ever seen dead top-down at one
  scale, so a mip chain buys it nothing. Corrected census: (8 × 512² + 4 × 1024²) × 1.33
  + 16 MiB = **47.9 MB**.]** A bake that would cross the ceiling
  reduces its own resolution; it does not get an exception.
- **Millisecond budget: ≤12 ms per bake, ≤140 ms total,** measured with
  `performance.now()` on the reference machine and asserted by `scripts/bake.check.ts`.
- **Schedule.** Load-time owes only the Cover's four bakes — the ones the hero already
  ships. Each stage kicks the **next** stage's class bakes during its own idle
  (`requestIdleCallback`, hard fallback at the stage boundary). A stage never waits on a
  bake it did not have a full stage's runway to produce.
- **First paint is unchanged and there is no spinner.** The loader is the entrance's
  stroke write-on (`heroLife.ts`), gated on `document.fonts.ready`, capped at 4 s, with
  the pencilled "sharpening pencils…" margin note past a 3 s stall — all P5b-verified.
  A class bake that misses its window renders its class **in flat class albedo without
  the stroke tone** for the frames it is late, which reads as a thinner coat, not as a
  broken surface.

**G3 — Phone-width figure legibility.** Closed in §6's phone-width contract: the ≥84 px
portrait floor, the three-tier mechanism (distance → `portraitLook` re-frame → drop the
wide), `GOB_SCALE 0.75` film-wide, and `scripts/figure.check.ts`. This supersedes
P4d-T6's "framing solves this, not scale changes."

**G4 — Where the S8 board art comes from. Ruling: hand-authored in this repo, by
`bakeBoardMap()`.**

Not an export from the product, for three reasons: there is no wired path from the
product to this repo; there is no forge; and the board must be a map of **the film's own
world** — the islands you walked — which no product export contains. It is authored the
same way `bakeIslandAlbedo` is: as code, as a single deterministic 2048² canvas bake, in
`src/film/stages/board.ts`. Its vocabulary is fixed here: **illustrated canopy blobs,
gabled house icons, inked roads at 2 px, painted flame marks, token discs at one-cell
diameter, field washes, water as bare paper with a drawn edge, and the battle grid at
`GRID_INK`.** Edge-handling wear at the margins; no pentimenti.

**The flatten's target marks are UV slices of this same atlas.** One bake, two consumers:
S7's destination art and S8's board. They cannot drift.

**G5 — The curtain prepass gap (FINDINGS P2c-T1). Ruling: a third override, plus an
art-side belt.**

`createCurtainPass` swaps `scene.overrideMaterial` twice — the mask material
(`curtain.ts:443`) and a normal override (`curtain.ts:457`) — and both bypass the
trilayer, so a feathered card's alpha discard never runs in the prepass and the contour
pass would ink a hard ring at each card's geometric circle: the exact opposite of "an
edge that simply stops being drawn."

The fix, at the P7 wire-in: the normal/depth override becomes a **feather-aware
variant** — a `MeshNormalMaterial` clone whose fragment shader carries the same three
lines the trilayer already runs, reading `uTriFeather` and the local position from
`mesh.userData`. Roughly ten lines, once, and it closes the gap for every island in every
stage. Do the same for the mask override.

**The art-side belt, which binds regardless:** **no island's rim contour may depend on the
prepass finding its edge.** Every rim contour in the film is an **authored mark** with a
deliberate gap where the line stops being drawn — exactly as the hero authors its own.
If the prepass ever inks a ring, the authored line is still what reads.

**G6 — What the humans are during the S5 freeze. Ruling: graphite. Both parties. Always.**

The DM, the two players, the patrons in S5 and the adventurer trio in S1 **all freeze
into the underdrawing like everything else.** They are never `markAlive`d, in any stage,
under any freeze. The reason is the thesis: the players are in the Performance; **the
goblin is the one who crosses.** A player rendered painted inside the Prep would say the
players get backstage too, which is the opposite of the pitch.

This makes the film's most important frozen frame better, not weaker: three graphite
figures caught mid-laugh, a graphite die still wobbling, a graphite mug ring on the
table — and **one painted goblin walking through them, casting the only shadow in the
room.** That is the shot.

**Exactly one exception, and it uses shipped machinery:** what he touches goes alive with
him. **The die takes paint at the moment of contact** (`reveal()`, 0.6–0.9 s, blooming
from the die's own centre) and is the only object at that table that crosses. S1 answers
identically — no per-stage exception exists.

**G7 — Reverse-scrub of authored flatten art. Ruling: a cross-fade on the same mesh.
Nothing is created or destroyed during the flatten.**

The flatten is a **geometry lie-down whose destination art cross-fades in on the very
same material** — never a swap, never a spawn, never a despawn:

- Each flattenable prop's trilayer gains two per-material uniforms: **`uTriFlat`
  (0…1)** and **`uTriFlatUv` (vec4 rect)**. The board atlas is bound **rig-side** as a
  single shared sampler, so the cost is one rig uniform and two per-material uniforms —
  not a second texture per prop.
- On the scrub-tied tween, `uTriFlat` ramps 0→1, mixing the class albedo to its slice of
  the board bake, **while the same tween runs `scale.y → 0.02`** and settles rotation.
  One timeline, one direction of travel, no branch.
- **Because nothing is instantiated or removed, reversing is the identical tween running
  backwards.** That is the only construction under which the site's most repeat-scrubbed
  moment is flawless in both directions, and it is why the flatten is authored this way
  rather than as an end-state swap.
- The grid rises to meet the flattened props via the board group's shipped opacity-fade
  traversal. Roads, river and fields join `miniWorld`'s lie-down; the v1 split at
  `world.ts:4215–4265` is closed.

---

## 14. The goblin rebuild — the named complaint, answered

*"The goblin looks like a bad asset drawing right now."*

**[ERRATA 2026-09-03 — this section predates `docs/2026-09-03-goblin-design.md`, which
the scene book §0 marks LOCKED for his design, build, rig and materials. Where the two
disagree, the goblin doc wins. Its answers, in the same order: his three hatch fields
were flank `978`, jaw `1211` and the nine-stroke `contact()` disc (NOT `1366`, which is
the adventurer's) and **all three are already deleted**; the cloak is `gobCloak #2E3742`
cool slate at `poster: 10`, not an olive ramp; and he is the frame's **darkest committed
value and only cool hue**, not its loudest chroma. Items 1–6 below stand as staging
intent with those substitutions applied.]**

The diagnosis, from the code: **his build is good and his surface is v1.** The locked v2
design, the real IK, the acting alphabet and `puppet.check` are all green. What ships is
flat fills plus **three literal hatch patches** — flank `world.ts:978`, jaw
`world.ts:1211`, and the `contact()` shadow disc — which violate the film's own first
gate, on stroke shells tuned for a smaller screen presence. **The fix is surface and
staging. He is not redrawn.**

1. **Remove every interior hatch** — the three patches above, deleted. Interior tone comes
   from the lit Lambert plus the cloak bake. Their old job (a lit side and an underside)
   belongs to the key light now.
2. **Cloak as authored gouache** — a `bakeIslandAlbedo`-class 1024² bake:
   fold-following directional strokes, **one direction per panel**, committed shadow mass
   in the **`gobCloak #2E3742` cool-slate ramp**, **`poster: 10`** (a dark mass needs
   *more* quantizer steps to show a tier at all, not fewer — goblin §4.3), and **hem-edge
   drybrush wear**. His own material tells his story: the most-worn cloak in the film.
3. **Face at hero polish** — the amber eye as a real warm glint, QA'd at ≥1920 **and** at
   500×915; skin in `goblinGreen #84A058` with the quiet pigment pass; expressions
   untouched.
4. **Presence budget** — §6's figure floor is film law for him: ≥100 px landscape, ≥84 px
   portrait at every acting beat, enforced by `scripts/figure.check.ts`.
5. **Contour weight** moves off the beaded hero-tier line onto the sketch shells — the
   P4e fix that made him read at the seam. No beaded dot-chains anywhere on the figure.
6. **Cloak hem follow-through** — hand-offset channel, puppet lane, two frames of drag on
   the bolt and the leap. Nothing elastic.

He is the only thing painted on both sides of the curtain, the only shadow in Prep, and
**the frame's darkest committed value and its only cool hue, with the amber eyes as the
one warm accent** (goblin §4.2 — this replaces "the loudest chroma", 2026-09-03). After
this pass he is also, visibly, **the best-kept asset in the film** — which is the concept.

---

## 15. What this is not

- **Not a drafting table.** There is no desk, no bench furniture, no pin tin, no eraser,
  no straightedge, no tape tab, no brass drawing pin at the theatre's hub, no visible
  maker's hands, no fourth-wall workshop. Any of those imply a maker who is not the
  goblin, working at someone else's bench — which contradicts the story's premise that he
  is the one who made this. **The keeper is the goblin; the page is the only
  meta-surface.**
- **Not "the table entire."** The C6 rise reveals **a miniature world**, per `story.md`'s
  "looks out over the whole world" — v1's `miniWorld` topology, re-surfaced. Not every
  plate of the film co-resident in one frame.
- **Not a travelling seam as a spine.** The frontier appears twice (§7). The restraint
  rule is the first of the ownable five: *the Prep appears only when we're allowed
  backstage; if it were everywhere it would mean nothing.*
- **Not a tech demo.** No chrome blobs, no particle typography, no cursor trails, no
  shader-flex, no dark-mode neon, no liquid metal, no wireframe cities, no tunnels. The
  flex is craft: paper, paint, pencil, in real 3D, with two rendering truths.
- **Not the scroll-through-a-world genre.** The ownable five are the underdrawing
  curtain, islands-on-the-page, the only-shadow-of-the-alive rule, hand-lettered
  narration obeying the curtain, and the touch-lit conversion into a real product map.
  **Any beat that does not serve one of those five gets cut before it gets polished.**
- Not photoreal, not pixel art, not flat vector.
- **Not a fifth flagship.** Four evidence beats, then discipline.
- **No new copy**, no lettered marginalia, no aging-yellow, no ACES or filmic look, no
  spinner, no unmotivated light, no orbit camera, no environment reflections, no
  specular highlights.

---

## 16. Guardrails

**Art gates, absolute.**

1. **No hatching, anywhere.** One stroke family per face, one direction per organic prop.
   The **31** live `hatch()` / `crossHatch()` sites in `world.ts` go to zero, by name (§7 —
   ERRATA 2026-09-03: was 33; the goblin's flank and jaw patches are already deleted).
   The gate is structural in the shader: one `texture2D(uTriStrokes)` sample through one
   rotated param space per fragment, pinned by `island.check`.
2. **Paper `#F7F5F0` · ink `#222222` · amber `#F2C35E` the only glow · `#B6D648` the
   wordmark pip alone · goblin-green his alone.** New colours are palette changes, never
   paint calls.
3. **`NoToneMapping` is the judged transfer.** Every value decision is made under the flat
   transfer. No ACES, no filmic, no post grade.
4. **Real painted surfaces only.** Smooth Lambert masses, ruled analytic stripes, default
   primitives and gradient washes are not final art and are rejected on sight.

**Structural gates.**

5. `t = 66` and the gearing map are fixed. This document restages art, never time.
6. **No spinner, ever.** The loader is the drawing drawing itself.
7. Reduced motion and keyboard access are first-class, per experience §9 / motion §14.
8. Copy is verbatim from `copy-spec.md`. Goblin v2 design is locked.
9. `story/story-v1` is **read-only reference**; never edited.
10. **No forge, no art bible, no external sign-off gate.** The build authors its own final
    art. Any plan reintroducing one is wrong.
11. `story/` stays uncommitted. Nothing deploys, publishes, or leaves this machine.
12. **This document directs a build; it does not authorise one.** A build begins only
    after its plan is approved.

**Checks this direction owes the build** (each a `scripts/*.check.ts`, Node-safe, no GLSL
compiled there): `figure.check.ts` (§6 phone contract), `draws.check.ts` (G1 budget),
`bake.check.ts` (G2 budget and ceiling), plus the existing thirteen — `framing.check`,
`pencil.check`, `die.check`, `puppet.check`, `curtain.check`, `island.check`,
`motion.check`, `clocks.check`, `gearing.check`, `rigs.check`, `hero.check`,
`hero-life.check`, `gob.check` (**[ERRATA 2026-09-03 — the original list named eight of
the thirteen shipped in `package.json`'s `check`; `gob.check.ts` has since landed with
the goblin rebuild]**).

---

**The direction's own test.** When *"I've built worlds for your DM for years"* letters on
at t58, the visitor should already believe it — because for eight stages, the pixels kept
the receipts.
