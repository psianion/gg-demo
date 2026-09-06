# GOBLIN-B — The Good Goblin, rebuilt from construction

Designer B. Pressure: **construction first** — he is made of the island's own vocabulary
(closed lathe bands, stepped strata, extruded beveled blades, authored view-plane contour
marks, trilayer surfaces with one stroke family per part) so he belongs to the world
materially, not just tonally. Every part below names its technique, its trilayer channels,
its stroke direction, and its triangle cost. Nothing here needs a new system: everything
is `createTrilayer` (trilayer.ts:427), `LatheGeometry` + `roughen` (pencil.ts:277),
`ExtrudeGeometry` with bevels (the shipped ear, world.ts:1085), `mark`/`contourArc`
(hero.ts:618, 651), and `markAlive`. The joint set from world.ts:832–843 is kept whole.

---

## 1. Who he is, and the adjective

**One line:** the DM's invisible stagehand — the goblin who got away and went straight to
work on the world.

**The silhouette sells one adjective: INTENT.** Bent to the work, tool touching the
ground, ears live. Not cute, not menacing — occupied. Every ratio below serves the read
"he is in the middle of doing something" before you can see what it is.

---

## 2. Silhouette

Let **H** = figure height, sole to crown of skull (ears excluded). Rig H = 0.9 world
units, staged at `GOB_SCALE` 0.75 as today (hero.ts:44).

**At 36 px** (phone): a dark bell with a big round head carried *forward* off it, two
unequal blades breaking up-and-out at different angles, one bright double-dot in a dark
frame, and a stick meeting the ground in front of him. Five marks. That is the whole
budget and it is enough.

**At 150 px:** the bell resolves into three shingled cloth bands with a hem flick trailing
behind; the blades resolve into ears (one bandaged); the double-dot resolves into two
amber lantern eyes almost touching over a dark nose; the stick resolves into a fat
carpenter's pencil in a gloved mitt; boots poke out under the hem.

**At full frame (≈500 px of figure at 6× zoom):** stroke-tile tone on the graphite state,
poster tiers and drybrush rim on the paint state, the whittled pencil collar, the earring,
the fang, the stitch marks. Nothing new appears that contradicts the 36 px read.

**Hard numbers (assert with `heroProject`, hero.ts:256, at 1440×900 / 768 / 500 / 390):**

- Figure aspect (height incl. ear tips : max width incl. ears) ≥ **1.45 : 1** at every
  breakpoint. (Shipped build measures 0.91–1.13 wide-than-tall — the mushroom. This is
  the first gate the rebuild must pass.)
- Cloak hem is the widest *body* element: hem width **0.42 H** (±0.21 H from centre).
  Head width **0.34 H**. Head : hem = 0.81 — the head no longer out-spans the base;
  the figure is a bell with a boulder on it, not a mushroom.
- Ears re-spend NOTHING of the width budget symmetrically. Left ear swept **25° off
  vertical** (mostly height: tip at **1.10 H**, horizontal reach 0.31 H from centre).
  Right ear swept **50° off vertical** (tip at 0.98 H, horizontal reach 0.41 H). The
  current `pivot.rotation.z = -side * 1.3` (world.ts:1101) is ≈75° off vertical both
  sides — that one line is the mushroom cap. Both ears keep `rotation.y = side * 0.22`.
- Max total width = 0.72 H (the right ear's reach). Height incl. left ear tip = 1.10 H.
  1.10 / 0.72 = **1.53 : 1** at rest, pose-independent.

**Negative space that does the work:**

1. **The keyhole under the chin.** The head is carried forward on the neck (+0.05 H in z,
   see §3 line of action), so paper/ground shows between chin and chest. This is what
   separates "hunched worker" from "stacked snowman", and it survives to 36 px as a
   one-pixel notch.
2. **The work triangle**: extended pencil arm (upper edge), body flank (rear edge),
   ground (base). Open, bright, roughly 0.25 H × 0.30 H at the staged beat. The pencil
   silhouettes across it against ground, never against his own chest.
3. **The ear notch**: the two blades at 25°/50° leave a V of sky between them that reads
   at any size; symmetric ears read as one hat shape.

---

## 3. Proportion sheet

Origin at feet, faces +z, H = 0.9 rig units. RIG joint heights (world.ts RIG table) are
kept — the skeleton is signed off; these are the *mass* proportions drawn on it.

| Landmark | Height | Width note |
|---|---|---|
| Boot soles | 0 – 0.04 H | boots visible below hem — hem stops at **0.09 H** |
| Cloak hem (widest point) | 0.09 H | width 0.42 H |
| Hem→yoke (three shingled bands) | 0.09 – 0.46 H | tapers 0.42 → 0.24 H |
| Shoulder / cowl | 0.42 H | arm pose pivots here (RIG.shoulderY unchanged) |
| Chin | 0.36 H | head OVERLAPS the yoke — sunk collar, no neck visible |
| Head mass (chin→crown, hood incl.) | 0.36 – 0.86 H | **head = 0.50 H — the head-is-half-of-him decision is kept** |
| Eye line | 0.60 H | widest skull point (chestnut lathe, kept) |
| Crown | 0.86 H | |
| Left ear tip | 1.10 H | the highest point of the figure |
| Right ear tip | 0.98 H | |

Limbs: arm chain (upper 0.11 + fore 0.11 + mitt 0.07) = 0.32 H reach — RIG unchanged.
Legs: thigh 0.09 + shin 0.09 + ankle 0.02 — RIG unchanged; they exist for the puppet, not
for the silhouette (see budget, §4.9).

**Line of action at rest:** one forward C-curve. Ankle→hip vertical (0°), hip→sternum
+10° forward, sternum→crown +22° forward, head pitched 12° down. Net: the crown sits
**0.10 H forward of the heels**; the pencil's ground contact another 0.20 H beyond that.
Counterweight: the hem flick (§4.2) trails 0.10 H *behind* the heels. Stance staggered:
right (pencil-side) foot forward 0.06 H, weight over it, left heel a touch off the
ground plane rotation — never the shipped symmetric parade stance (chest.x 0.32 with
both legs vertical, the "no centre of weight" failure).

---

## 4. Construction — part by part

Technique names are the codebase's own. Every solid is a `createTrilayer` material —
**zero** `fillMaterial`, zero `paint()` fills, zero `QUIET_PIGMENT` damping
(pencil.ts:184–200 stops applying to him entirely because nothing of his routes through
`paint()` fills any more). Tris are per-part totals, both sides counted.

### 4.1 Cloak — three stacked lathe bands (the strata technique)
The island's strata are continuous climbing lathe bands with a small radius step and a
lip between beds (hero.ts:1312–1320). The cloak is built the same way: **three separate
`LatheGeometry` bands** — hem band (0.09–0.22 H), skirt band (0.22–0.36 H), yoke band
(0.36–0.46 H) — each profile 5–6 authored points, 20 radial segments, each band's top
radius stepping **in 0.006 units** under the band above so a shingle shadow-line runs
around him twice (the drawn "cloth tiers" a brush would lay). Profiles climb hem-first
(the normals rule, world.ts:943). Each band: `roughen(geom, 0.010, 8, seed)` with
distinct seeds — three different hands, one garment. `scale.z = 0.88` keeps the bell
elliptical. **Why bands and not one lathe:** each band is its own trilayer instance, so
the seam/alive machinery can hold one band painted while another is still underdrawing
(§5) — the construction is what makes the half-alive character stageable at all.
~1,400 tris.

### 4.2 Hem flick — extruded beveled plate (the ear technique)
One authored `THREE.Shape` — a soft cloth point, 0.14 H long — extruded 0.014 with
bevel (thickness 0.005, size 0.006, 1 segment), attached at the hem's rear, trailing
−z and slightly −x. It is the only asymmetry on the lathe garment and the tail of the
line of action. Its own group (`hemFlick`) so motion can drag it (§10). ~220 tris.

### 4.3 Hood — sphere-slice cowl, kept recipe, new material
The shipped window-cut cowl geometry is right (world.ts:1035–1046: `SphereGeometry`
14×10 with phi/theta window, `roughen 0.006/14`, scale 1.1/0.95/1.02): keep it, plus the
small roughened peak cone and the hood tail cone. What changes is material (§6: the hood
is the **darkest** value on him — the face's frame) and the deletion of its sketch shell.
~640 tris with peak and tail.

### 4.4 Skull — the chestnut lathe, kept
The authored 11-point chestnut profile (world.ts:998–1002) at 22 segments, scale
(1.18, 0.86, 0.9), is a proven authored lathe — keep it exactly. ~900 tris.

### 4.5 Ears — extruded beveled blades, kept shape, new sweep + new drawing
Keep the wedge `Shape` and beveled `ExtrudeGeometry` (world.ts:1077–1092), the inner-ear
inset, the earring (left) and bandage (right). Change: pivot angles per §2
(left `rotation.z = -0.44` rad, right `+0.87` rad — replacing `-side*1.3` at
world.ts:1101), and `EAR_Z` in actions.ts updated to match (the absolute-write contract
noted at world.ts:1098–1100). Drawing: **no shell** — each ear gets two authored side
`mark()` strokes running base→tip (the roots' two-side-contour treatment,
hero.ts:1349 region), 'form' weight. ~760 tris both.

### 4.6 Eyes — proud flattened spheres, the amber lanterns
`SphereGeometry` r 0.062, 12×8, z-scale 0.55. **Positioned proud of the skull:**
`eye.position.z = 0.135` (was 0.102, world.ts:1145 — the geometrically sunk eye).
Buildable acceptance test, not a vibe: a raycast down the shipped lens ray must hit the
eye's front cap **≥ 0.03 rig units before** the skull surface; assert it headlessly next
to the existing `heroProject` checks. Material: `MeshBasicMaterial({ color: amber, fog:
false })` — flat committed amber gouache, unlit, never emissive, never bloomed; identical
in both rigs and under the curtain (he keeps colour anyway). Ink slit pupil and paper
glint dot kept. ~300 tris both.

### 4.7 Face furniture
Nose: kept button sphere but painted `gobEarInner` (dark olive) — the shipped nose was
gobSkin-on-gobSkin, 3% visible (diagnosis F4). Mouth: kept ink torus arc + tooth-cone
fang. Brows: kept ink arcs. ~270 tris. Delete the jaw hatch (world.ts:1211) — the jaw's
underside tone now comes from the skull trilayer's Lambert + poster tiers, which is what
tone comes from everywhere else in the film.

### 4.8 Arms and mitts — lathe limbs, lathe mittens
Upper/fore stay `limb()` cones at 8 radial segments (~200 tris per segment). Cuffs kept.
Mitts: the marching-cubes `blobs()` hands (world.ts:1245–1259, 2,160 tris ×2 draws each)
are replaced by an **authored 7-point mitten lathe** (a revolve of palm-swell profile,
10 segments, scaled 1 / 0.7 / 0.55) plus **one drawn thumb `mark()`** — the same
"authored profile + drawn detail" trade the trees make. ~260 tris each. Arms total
~1,280.

### 4.9 Legs and boots — stubs plus extruded boots (the budget line)
Legs are 0–6 % visible under the bell (diagnosis F9: 21,928 tris hidden). They become
`limb()` cones at 8 segments (~160 tris/leg) — the joints stay (Nimble Escape needs
knees), the *meat* goes. Shin wraps: deleted (never visible). Feet: the `blobs()` foot
masses are replaced by **extruded beveled boot plates** — one authored side-profile boot
`Shape` per foot, extruded 0.05 with bevel, toes turned out ±0.12 as now. ~300 tris
each. Legs total ~920.

### 4.10 Pencil — kept design, promoted staging
`buildPencil()` (hero.ts:1136–1162) is correct: dark cedar body, pale whittled collar,
graphite core — keep all three values. Two staging changes: scale ×1.35 relative to him
(length ≈ 0.20 rig units = 22 % of H — oversized the way his head is oversized; the tool
is an icon, not an accessory), and the grip contract: the mitt holds the **top third**,
the axis runs 40° off vertical, and the **tip touches the ground line** — hand, tool and
ground are three different values (§6) meeting at one point inside the work triangle.
~350 tris.

### 4.11 Satchel — kept, repainted
Box + strap kept (world.ts:959–969), repainted into the leather-dark tier (§6). 150 tris.

### 4.12 The drawn line — two merged shells + authored marks (replaces 19 shells)
The 19 independent sketch shells (6.3:1 weight variance, beaded chain at 390 px —
diagnosis F6) are replaced by exactly **two** BackSide ink shells over merged
silhouette geometry: one for the head group (skull+hood+peak merged via
`mergeGeometries`), one for the cloak (three bands + flick merged). Thickness is not a
world constant: the stage computes it from `heroFraming`'s px-per-unit at layout time so
the rim lands at **3.2 CSS px, asserted 2.6–3.6 px, at every breakpoint** — this is what
kills the 0.97 px sub-AA chain on phones. Interior separations are authored `mark()` /
`contourArc()` strokes at 'form' (2.1 px): two per ear, one hem arc, one pencil-arm
stroke, one chin-shadow arc — ~10 marks total. Weight system on the figure: **hero (the
two shells) and form (the marks), nothing fainter.** Max ratio 1.7 : 1, by construction.

**Triangle budget: ≈ 7,900 tris** (was ~56,800 — an 86 % cut, with the visible parts
*gaining* geometry). **Draw calls: ~30 solids + 12 ink lines ≈ 42** (was ~102). All
solids share the single trilayer program (`customProgramCacheKey`, trilayer.ts:511) — no
new shader compiles. Estimated GPU cost at 1440×900: < 0.3 ms; he stops being a line item.

---

## 5. Materials — trilayer channels, and how the seam crosses him

Every solid: `createTrilayer({ color, wear, poster, stroke: { dir, sheet: true } })`.
Per-part channel table:

| Part | color (token) | wear | poster | stroke dir (rad, one family) |
|---|---|---|---|---|
| Cloak bands ×3 | `gobTunic` | 0.30 | 10 | 1.45 (near-vertical — drape falls) |
| Hem flick | `gobTunic` | 0.30 | 10 | 1.45 (same family as skirt) |
| Hood + peak + tail | `gobTunicShade` | 0.30 | 8 | 1.45 |
| Skull | `gobSkin` | 0.22 | 12 | 0.55 |
| Ears | `gobSkin` | 0.22 | 12 | 1.15 / 1.05 (each blade its own single family, along the blade) |
| Mitts, cuffs, boots, satchel | `gobTunicShade` | 0.30 | 8 | 0.2 |
| Limb segments | `gobSkin` | 0.22 | 0 | 0.55 |
| Pencil body | `timberDark` | 0.25 | 0 | 1.5 (along the shaft) |

One direction per part, `sheet: true` on every organic mass — the whole figure obeys the
no-hatching gate **by construction**, and the three shipped hatch fields on him (flank
world.ts:978, jaw world.ts:1211, contact world.ts:1277) are deleted, not restyled.

**Painted side (Performance rig):** Lambert under the warm key, poster tiers commit the
value steps (the oak crown's 4-tier / 36 % range read — he finally measures like his own
trees instead of 21 mushy steps in a 3 % range), and `wear` drybrushes his rims toward
paper just inside the ink shell — the worked seam between line and paint that the bar
demands.

**Graphite side (Prep rig / curtain):** his tone quantizes into the four authored
stroke-tile tiers (trilayer.ts:336–371): rust cloak → tiers 3–4 (dense, pressed), sage
skin → tiers 2–3, amber eyes stay amber (Basic material — the one thing that never
drains; the brand rule).

**How the seam crosses him:** he stands at x 0.95 with SEAM_X 1.0 and seamW 0.6 — the
blend band spans his whole body. The banded construction is the answer: **aliveness is
per material instance** (trilayer.ts:440), so the film's default marks every part alive
(paint holds, as shipped, hero.ts:1243), and staged states un-alive *chosen parts* — the
entrance births him hood-first (hood painted, hem band and flick still tier-stroke
graphite of their own tone, the boundary falling naturally at a band step where a seam
line reads as a drawn cloth edge, not a glitch). Half-underdrawing is a staging verb the
construction supports, never a shader accident.

---

## 6. Face and eye — the three-value stack, and colour that owns the frame

**Failure 1's fix is a palette decision, and palette.ts already made it** (lines
111–118): "committed rust tunic; the tunic stays the darkest mass in every frame… his
palette is pitched a step louder than the world's." The shipped build ignored its own
palette and dressed him in `gobHood` moss — the third tree. The rebuild wears the tokens
as written, as a **three-value character palette** (diagnosis F11's fix):

- **Cloth = `gobTunic` 0x9C3A22 rust** (luma ≈ 0.30 vs grass 0.65, painted crowns
  0.31–0.35 — separated from ground by ≥ 0.3 luma AND complementary hue; separated from
  crowns by hue at matched value). Rust belongs to him alone. Gate: measured luma delta
  to both tree crowns ≥ 0.12 *or* hue delta ≥ 60°, checked at 500×915 like the diagnosis
  measured.
- **Skin = `gobSkin` sage** (mid value) — green stays his, face/ears/hands only.
- **Accent = `amber` eyes** (light value) — the only glow-family hue on him.
- Leather tier (`gobTunicShade` 0x64281A) for hood/mitts/boots/satchel — the darkest
  value, breaking the five-parts-one-hex `timberDark` blur: glove (0.12 luma), pencil
  body (0.21), collar (0.79) — hand, tool, and tip separate by value at any size.

**The face at phone width is a value sandwich, not features:** darkest (hood frame) →
mid (skin window) → lightest (amber eyes). At 390×844 the figure is ~43 px, head ~24 px
wide, face window ~14 px, each eye ~5 px with the two nearly touching, pupil a 2 px slit.
Gate (headless, via `heroProject` + pixel count): **≥ 40 amber-classified pixels inside
the head bbox at 390×844, ≥ 250 at 1440×900** (shipped build: 0 and 0).

**The amber eye's limit:** it is gouache, not a light. No emissive, no bloom, no halo; the
paper glint is its only highlight; the lantern remains the brightest amber in every frame
(the P4d lamp-outshines-pool rule applies to him too). Expression at distance never
depends on the eyes: it rides the ears and head pitch (§10); the eyes carry *presence*,
the ears carry *mood*.

---

## 7. Costume and kit

One garment: the rust cloak, hood to hem, bands shingled, hem flick trailing — scavenged
cloth worn to a bell. Under it: leather-dark mitts, cuffs, boots. On it: the back
satchel (leather-dark), one brass earring (left ear), one cloth bandage (right ear —
the ear that's seen work is the swept-low one; the story is in the asymmetry). At rest
both mitts live *under* the cloak (the shipped charm, kept — world.ts:938–940); a reach
brings a glove out, which is an event.

**The pencil is his prop and it must silhouette:** carried at 22 % of H, gripped at the
top third, axis 40° off vertical, tip on the ground, staged across the work triangle
(§2) so its full length crosses ground value, never his own cloak. When not drawing
(run, rope, lantern) it goes **behind the left ear** — a carpenter's habit, a silhouette
gag, and the reason the left ear sweep stays clear of the hood. Never into the satchel:
an invisible tool is a deleted premise.

---

## 8. Weight and contact — he never floats

Three devices, all cheap, all always-on:

1. **Stance:** staggered feet (§3), front boot toe overlapping the drawn path edge —
   he stands *on his work*, boots visibly below the hem (the 0.09 H hem gap exists for
   this).
2. **The contact disc:** the film's Canvas has no shadow maps (curtain.ts:72–74), so his
   in-film grounding is an authored ellipse mesh under the stance centroid — the
   islandKit drop-shadow technique at figure scale (islandKit.ts:33–58: radial plateau
   falloff, ink at alpha **0.34**, `toneMapped: false`): 0.34 H × 0.20 H, offset +0.04 H
   toward +x (the KEY azimuth, hero.ts:164), riding `root` so it is under him on every
   surface, fading with curtain like the island's own shadow — alive-flagged so it
   *persists* when the page freezes (he is the one thing still standing on it). This
   **replaces** `contact()`'s 9 hatch strokes (world.ts:1277) — deleted, and stageGoblin's
   hide-the-smear patch (hero.ts:1201–1203) dies with it.
3. **The baked blob:** the ground albedo's painted contact blob at his stance
   (hero.ts:524) darkens from a 0.3 to **0.4** and tightens to r 24 so paint, disc and
   boots agree.

**Cast-shadow rule:** real renderer shadows exist only where a rig enables them (the hero
page). There his committed seam-crossing shadow (rig `aliveShadow`, trilayer.ts:395) is
the signature and stays. Everywhere else the disc IS the shadow. Nothing about his
grounding depends on which side of the seam his feet are on — that was failure 5.

---

## 9. Puppet — joints and the demanded actions

**The joint set is world.ts:832–843 unchanged** — pelvis, bob, chest (the hunch-as-state),
neck, head, earL/earR pivots, per-arm pose/swing/elbow/wrist, per-leg
pose/swing/shin/foot/toe, face groups (brows, eyes, mouth+fang). **One addition:**
`hemFlick` (a single rotation group at the hem attachment) for cloth follow-through.
actions.ts's 25 channels keep their targets; only `EAR_Z` rest values change (§4.5).

Poses, in joint terms (angles in radians, times at 60 fps):

- **Peek:** pelvis −0.04 crouch, chest.x +0.5, neck.y toward edge, ears both up (+0.25
  from rest), one eye's glint toward camera. Hold is a pose, not a loop.
- **Run (Nimble Escape):** leg swings ±0.9 alternating, 280 ms cycle, chest.x +0.32,
  ears trail −0.5 from rest, hemFlick streams −0.6, arms pump ±0.4 with elbows locked
  bent −0.8. The pencil goes behind the ear first (120 ms stow — always show the stow).
- **Freeze-and-turn-to-camera:** dead stop in 2 frames (no ease-out — the stop IS the
  joke), 400 ms hold, then head.y to camera over 180 ms, ears pop +0.3 sixty ms *after*
  the head arrives, one blink.
- **Light a lantern / pull a rope / nudge a die / draw on a map:** the thirteen authored
  reaches — armR chain (pose, elbow, wrist) with chest.x compensating; rope adds both
  arms + chest.x −0.25 lean-back + stagger widened; die-nudge is wrist-only ±0.15 (the
  smallest action he owns — one knuckle); draw-on-map is the staged beat (hero.ts
  stageGoblin values, kept).
- **Throw a d20:** windup 120 ms (chest.y −0.3, arm back), release 80 ms, follow-through
  carried by chest.y +0.4 and both ears +0.35, eyes tracking the die (eye groups get ±0.1
  y-rotation, the head-track cone's own channel).
- **Walk-in casually:** 2 steps/s, hands under cloak, head level, ears at rest doing
  small ±0.06 counter-rolls — competence is unhurried.
- **Shrug:** both arm poses z ±0.35, ears out to half-horizontal, brows +0.01 y, 300 ms
  up, slow 600 ms settle.
- **Look at viewer:** neck.y + head.y sum to lens azimuth within the ±14° head-track cone
  (heroLife.ts:607–757 machinery, re-aimed at the new proud eyes).
- **Scritch:** armL wrist to skull side, 4 oscillations over 1.2 s at the 4 s idle mark
  (heroLife's existing loop), then *back to work* — the return is the character.
- **Idle breathing:** bob.y ±0.004 at 0.25 Hz, weight shift (pelvis.x lean swap) every
  7 s, blink every 3–6 s. Nothing else moves — stillness is what makes the ear moves
  legible.

---

## 10. Motion identity

**Timing signature — "fast in, one overshoot, dead stop."** He never eases in slowly:
anticipation is a small counter-move ≤ 120 ms (head dips 0.02 before any look-up; heel
lifts before any step), the action itself is quick (120–280 ms), the settle is a single
overshoot on the *head mass* only, then absolute stillness. He settles like a dropped
satchel.

**What leads / what follows:** the nose leads (every action starts with gaze), chest
follows within 2–3 frames, ears trail 80–120 ms behind the head at 1.4× amplitude (the
emotional trailer — the animator's loudest channel at distance), hemFlick is last and
purely physical (velocity-driven drag, 200 ms lag, no authored keys).

**Idle habit:** he keeps working. Micro pencil taps against the boot (wrist ±0.05,
every ~11 s), the scritch at 4 s of user idle, ear semaphore at hover (the perk is the
first-hover event, kept from heroLife). He is never *waiting* — idle is small work.

**What he never does:** hold symmetry (some joint always breaks it), move everything at
once (one chain at a time, ears excepted), or ease-in-out evenly (that is tween-software
motion, and he is hand-drawn).

---

## 11. Reduced-motion still and phone fallback

**Reduced motion:** the staged work beat, fully composed and completely still — final
pose values, contact disc on, eyes open, pencil on the ground line, seam shadow
committed. No breath, no blink, no loops: an honest poster frame, and it is the frame
the whole silhouette section was designed to be.

**Phone width:** composition never changes (the film rule) — the *checks* change scale.
The figure must project ≥ 43 px tall at 390×844 (current framing already yields this);
the shells' px-solve (§4.12) keeps the rim ≥ 2.6 px; the LineMaterial phone tier (SUB 1,
SCALE 0.75, pencil.ts:34–36) keeps marks at 1.6 px — above AA. Gates asserted at all
four breakpoints in the same headless harness as `heroProject`: aspect ≥ 1.45, amber
count ≥ 40, rim px ≥ 2.6, cloak-vs-crown separation per §6.

---

## 12. Failure modes I am accepting

1. **Authored marks are lens-biased.** The ~10 contour marks are authored against the
   film's dominant camera basis and tolerate ~±15° (the wobble absorbs it, as the tree
   contours' ±6° note proves). At extreme angles the marks drift off-silhouette and the
   read falls back to shells + wear + mass. Accepted: the film has one dominant lens
   family; a full turnaround was never the contract.
2. **The lathe cloak is radially near-symmetric.** From dead behind, only the hem flick,
   satchel and ears break symmetry. Accepted: the film never stages him from dead
   behind for longer than a transition.
3. **Rust vs mushroom caps.** `mushCap` 0xB03C22 sits near `gobTunic`. Accepted at prop
   size (< 12 px on screen); if a beat ever frames mushrooms large, they shift toward
   crimson, not him.
4. **Per-part alive boundaries are hard edges.** Un-aliving a band shows a material-sharp
   paint/graphite cut at the band step. Deliberate: it is staged only at band steps and
   cuffs, where a drawn cloth edge is the natural reading. Mid-mass splits are forbidden
   to staging, not to the shader.
5. **The three-quarter must be re-proven, not assumed.** hero.ts:1194–1197 records the
   old head collapsing to a dome at the 33° lens. The proud eyes, dark hood frame and
   asymmetric ears are designed to fix that, but the profile stays the shipped fallback
   until a walk proves the three-quarter at 150 px. Budget one restage round for it.
6. **Legs stay stubs.** If a future beat stages bare legs large (a climb framed from
   below), they will need one authoring pass. YAGNI until that beat exists.

---

## Build order for the engineer (each step walkable on the shipped harness)

1. Palette + ear sweep + delete three hatch fields — the poster gains a subject in a day.
2. Trilayer conversion (channel table §5) + delete `paint()`/QUIET_PIGMENT routing.
3. Silhouette rebuild: cloak bands, hem flick, boots, mitts, leg stubs; two merged
   shells + authored marks; retire the 19 shells and the P4d 2.6× patch (hero.ts:1185–1190).
4. Face: proud eyes + raycast assert; nose/mouth values; amber pixel gates.
5. Contact disc + baked blob agreement; delete `contact()` from the figure.
6. Ear/action retune (`EAR_Z`), hemFlick channel, motion-identity pass in actions.ts.
7. Gate run: aspect, amber, rim-px, luma-separation asserts at 4 breakpoints + 6× zoom
   walk + Prep-rig walk + seam-birth walk.
