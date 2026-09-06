# GOBLIN-C — the performance-first redesign

Designer C. Pressure: he carries a 66-second film almost alone; the story is what he
DOES. So the figure is designed backwards from the acting: every mass earns its place by
what it can play, and the silhouette is a *pose-space*, not a statue. The diagnosis's
eleven failures are each answered inline, marked `[D#]`.

---

## 1. Who he is

**One line:** The theatre's stagehand caught mid-task — the most competent small person
in the world, too busy working to notice he is the star.

**The single adjective the silhouette must sell: ABSORBED.** Bent to the work, weight
committed forward, tool out, one ear up listening while the hands keep going. Not cute,
not menacing — occupied. Every rest pose, idle, and recovery returns to *absorbed*; every
beat is an interruption of it and a return to it. That is the character AND the comedy:
the world's most magical events are, to him, chores.

---

## 2. Silhouette

The silhouette is asymmetric on purpose, because symmetry is a mascot and asymmetry is a
verb. It is built from four shapes and two negative spaces:

**At 36 px (phone, whole figure):**
- One dark bell (cloak, hood-to-hem) leaning ~15° forward of vertical.
- One diagonal spike exiting the crown top-rear at ~55° above horizontal — the up-ear.
  It is the tallest point of the figure. **[D2]** The ear breaks the shape UPWARD, it no
  longer spends the width budget: shipped `pivot.rotation.z = -side*1.3`
  (world.ts:1101) swept both ears to near-horizontal and made him wider than tall at
  every mobile breakpoint. Dead.
- One arm exiting the bell's front at mid-height, angled down-forward, ending in a mitt
  with the pencil crossing OUTSIDE the arm's contour.
- One amber point inside the dark hood. That is the whole face at this size, and it is
  enough — a lit eye in a dark cowl reads as "alive" at any size a lantern does.
- Two feet under the hem, front foot leading by 0.05 u.

**Negative space that does the work:**
1. The wedge between the underside of the working arm and the cloak front — an open
   triangle ~0.20 H × 0.14 H. This gap is what says *doing something* at 36 px; if the
   arm merges with the body the figure is a pawn again.
2. The notch between the raised hem rear and the back heel — what says *feet on ground,
   mid-stance*, not a cone sitting on the page.

**Aspect ratio: width : height = 1 : 1.8 at rest (ear tip included), and the check
asserts h/w ≥ 1.35 at 390, 768 and 1440.** **[D2]** Shipped measured 1.11–1.13 wider
than tall on mobile.

**Head + ears width ≤ 0.72 × total figure width.** **[D2]** Shipped was 100 % at every
breakpoint: cloak, arms, legs and pencil contributed zero outline.

**At 150 px:** the bell resolves into hood + shoulder + skirt strata (three lathe bands,
§5); the satchel's warm patch breaks the dark mass on the back; the pencil reads as a
two-value object; the second (back) ear appears, swept rearward and drooped — depth, not
width. The face is one amber eye, a pale chin crescent, the dark hood frame.

**At full frame (≈120 px at 1440):** the drybrush edge-wear at his skin contours, the
stroke-tile shading tiers, both eyes in three-quarter, the mouth arc, the shin wraps, the
brass earring. Nothing NEW appears past 150 px that changes the read — zoom adds craft,
never information.

**Value ownership [D1]:** the cloak commits to a near-ink moss that nothing else in the
world may use (§5, `gobCloak`). Target: his mean luma ≥ 0.12 BELOW the darkest painted
tree crown at the 500×915 framing (shipped delta was 0.02 — he measured as a third
tree). The skin stays `goblinGreen` (his alone by palette law), the eye is `amber`. He is
simultaneously the darkest painted mass and the only green-plus-amber object in the
frame: value separates him at 36 px, chroma confirms him at 150 px.

---

## 3. Proportion sheet

Build scale 0.9 world units sole→crown (unchanged; stages scale him, hero stages at
0.75 u per the P4e decision, hero.ts:1164-1178). All numbers below in build units and as
fractions of H = 0.9.

| Landmark              | y (u)  | fraction of H |
|-----------------------|--------|---------------|
| sole                  | 0.00   | 0             |
| hem (cloak bottom)    | 0.16   | 0.18          |
| hip (pelvis pivot)    | 0.20   | 0.22          |
| waist (chest pivot)   | 0.30   | 0.33          |
| shoulder              | 0.475  | 0.53          |
| chin                  | 0.42   | 0.47          |
| eye line              | 0.60   | 0.67          |
| crown (hood peak)     | 0.90   | 1.00          |
| up-ear tip            | 1.04   | 1.16          |

- **Head (chin→crown) = 0.48 u = 53 % of H.** The head-is-half decision is KEPT — the
  diagnosis confirms it is a real stylistic asset. Only the ears stop double-spending it.
- Ear blade length 0.40 u (trim the shipped 0.46 shape by ~13 %). Up-ear base angle 55°
  above horizontal, back-ear 15° above horizontal, swept rearward `rotation.y = 0.6`,
  drooped −0.1. The `EAR_Z = 1.3` constant in actions.ts (line ~362) becomes two per-ear
  base constants; `express()` still writes absolute z, so rig and actions must share the
  new pair — the coupling world.ts:1098-1101 already documents.
- Shoulder width 0.23 u (2 × RIG.shoulderX 0.115, unchanged). Hem radius 0.20 u max.
- Arms: upper 0.11, fore 0.11 (unchanged — `reachSolve`'s law-of-cosines depends on
  them). Mitt 0.09 u long — half the forearm, the sheet's rule, kept.
- Legs: thigh 0.09, shin 0.09, ankle 0.02 (unchanged — gait maths lives on these).

**Line of action at rest:** a single forward C. Heel→crown diagonal 15° forward of
vertical: pelvis shifted +0.05 u toward +z over the heels, `pelvis.rotation.z −0.05`,
chest `HUNCH` 0.3, neck 0.08, head 0.10 (the shipped stoop numbers, hero.ts:1207-1215,
are good — they were just applied to a figure with no diagonal under them). The head
mass cantilevers PAST the toes; the up-ear continues the C past the crown. **[D7]**
Shipped hip→sternum→skull was a plumb line with one kink and both legs measured 0 % and
6 % unoccluded; here the stance is offset (front foot +0.06 z, back heel raised 0.02,
toe pivot down) so the legs are two different shapes from every angle.

**He holds a three-quarter.** The P4 note "every three-quarter under a bent hood
collapsed to a featureless dome" (hero.ts:1194-1197) was a VALUE failure, not a staging
failure: a mid-olive hood in front of mid-olive trees has no interior edges. With a
near-ink hood, proud amber eyes and a pale chin, the three-quarter — `rotation.y ≈ 1.15`
instead of the shipped 1.6 — gives the two-eyes-in-a-dark-plate read that already works
in the wordmark at 60 px. The mark and the character finally depict the same creature.
**[D4]** (Fallback if the check disagrees: the profile stage keeps everything else in
this document; see §12.)

---

## 4. Construction

Vocabulary is strictly what the hero proved: closed lathe bands + roughen, extruded
beveled profiles, `sketch()` drawn contours, trilayer stroke-tile faces, baked gouache
contact. The marching-cubes `blobs()` are BANNED from this figure — 8,280 tris of brown
lumps was the old hands-and-feet bill. **[D9]**

Part by part. "Shell" = a `sketch()` inside-out ink contour; he gets exactly **4**
(shipped: 19). Everything else contours via trilayer edge-wear like every other prop in
the film. **[D6]**

| # | Part | Technique | Stroke family direction | Tris |
|---|------|-----------|------------------------|------|
| 1 | **Skirt band** (hem→waist) | closed lathe, 11 profile pts × 18 seg, `roughen` amp 0.03; hem rear kicked +0.02 y, profile asymmetric front/back via `scale.z 0.92` + authored profile | with the drape: dir 1.40 rad (near-vertical), `sheet:true` | 420 |
| 2 | **Torso band** (waist→collar) | closed lathe, 8 pts × 18 seg, roughen 0.02; overlaps skirt band by 0.02 u (strata step, the island-tree trick) | dir 1.40, `sheet:true` | 320 |
| 3 | **Cowl** (hood) | partial-phi roughened sphere shell as shipped (world.ts:1035-1045 technique) but window top ABOVE the eyes, sides ending at ear roots; rim torus kept; soft peak cone kept, leaning back −0.45 | dir 1.25 | 620 |
| 4 | **Hood tail** | cone, kept, behind the shoulder | dir 1.25 | 60 |
| 5 | **Skull** | the chestnut lathe kept verbatim (world.ts:998-1012, scale 1.18/0.86/0.9) — it is good | dir 0.35 (follows the cheek) | 460 |
| 6 | **Ears ×2** | the extruded beveled `earShape` kept (world.ts:1077-1092) — the wedge-with-a-nick is good; length ×0.87; NEW base angles per §3; inner-ear inset kept; earring L / bandage R kept | along the blade axis: dir = ear base angle | 680 |
| 7 | **Eyes ×2** | flattened sphere `scale (1, 1.05, 0.4)`, **centre z = 0.118** so the front cap leads the skull surface by ≥ 0.012 u along the face normal — a lens raycast must hit EYE before SKULL (shipped: skull won by 0.064 u, world.ts:1145 `z 0.102`) **[D4]**; rim torus in `P.ink` (NOT timberDark — [D11]); ink slit pupil + paper glint kept | — (plain fills) | 520 |
| 8 | **Brows, nose, mouth, fang** | kept as shipped (ink torus arcs, button nose, cone fang) — the bottom-loaded face layout is right | — | 300 |
| 9 | **Arms ×2** | `limb()` lathes 8-seg, radii 0.02/0.018 kept; glove cuff cylinder kept | dir 1.1 along the limb | 480 |
| 10 | **Mitts ×2** | **lathe mitt**: rounded-wedge profile 9 pts × 10 seg + one beveled-extrude thumb wedge; ~230 tris each vs the blobs' 2,160 **[D9]** | dir 0.9 | 460 |
| 11 | **Legs ×2** | `limb()` 8-seg kept; shin wraps kept (`bedroll` — the pale break above the feet) | dir 1.3 | 420 |
| 12 | **Feet ×2** | flattened lathe pad (7 pts × 10 seg) + toe wedge on the existing toe pivot; ~170 each vs the blobs' 1,980 | dir 0.2 | 340 |
| 13 | **Satchel + strap** | boxes kept (world.ts:959-969) | dir 0.61 default | 220 |
| 14 | **Pencil** | `buildPencil()` kept verbatim (hero.ts:1135-1160 — the two-value body/collar/core is already right), scaled ×1.35 | — | 300 |
| 15 | **Contact pool** | one trilayer feathered card (§8) | — | 2 |
| 16 | **Shells ×4** | `sketch()` contours on: cloak (skirt+torso as one, weight `hero`), cowl (`hero`), up-ear (`form`), pencil (`form`). Max weight ratio ≤ 1.8 : 1 **[D6]** (shipped: 6.3 : 1 across 19 shells, beading below AA at 390) | — | ~2,400 |

**Totals: ≈ 8,000 fill tris + ≈ 2,400 shell tris ≈ 10,400 triangles, ≈ 30 draw calls**
(every trilayer compiles to one program, trilayer.ts:511; per-mesh materials remain
per-mesh calls). Shipped: ~56,800 tris, ~102 draw calls for the same 43 px figure.
**This design hands the film back ~46,000 triangles and ~70 draw calls** — his cost is
the film's cost, and the film just got most of a frame budget back. **[D9]**

**Hatching: zero.** The flank hatch (world.ts:978), jaw hatch (world.ts:1211) and
`contact()` hatch field (world.ts:1277) are deleted. Their jobs move to the trilayer:
flank tone = poster tier + lighting, jaw tone = poster tier, grounding = §8. **[D10]**

---

## 5. Materials

He moves ONTO the shipped material. Every `paint(mesh, {fill})` in buildGoblin becomes a
`createTrilayer({...})` per part. **[D3]** Shipped: `createTrilayer` ×11 in the hero, ×0
on the protagonist — he was flat `fillMaterial` Lambert with his albedo damped to 0.3 by
QUIET_PIGMENT (pencil.ts:184-200); moving off `fillMaterial` entirely is also what
removes him from that damping list. The 26-samples-one-unit-apart airbrush scan dies
here.

**Character palette — three values, everything else resolves by value, not hue [D11]:**

| Token | Hex | Role | Owner rule |
|-------|-----|------|-----------|
| `gobCloak` (NEW) | `0x333B2C` | cloak, cowl, tail, boots, gloves | near-ink moss; no other object in the world may use this value band |
| `gobSkin` | `0x84A058` (existing `goblinGreen`) | skin, ears | green is his alone by palette law |
| `gobEye` | `amber 0xF2C35E` | the eyes only | amber = the glow hue, already gated |
| supporting | `gobSatchel 0xB08D55`, `bedroll`, `dieBone`, `timberDark` (pencil body ONLY), `brass` | satchel, wraps, pencil collar, pencil body, earring | `timberDark` loses the boots, gloves, cuffs and eye rims — the five-parts-one-hex mass **[D8][D11]** |

**Trilayer channels per part:**
- Cloak/cowl/boots/gloves: `poster: 4`, `wear: 0.12`, `stroke: {sheet: true, dir: 1.40}`.
  Wear stays LOW on the dark cloth: edge-wear lifts toward *paper* (trilayer.ts:304-305)
  and a bright halo would eat the dark silhouette this design just bought. The ink shell
  carries the cloak's contour; wear only frosts it.
- Skin/ears: `poster: 3`, `wear: 0.30`, `stroke: {sheet: true, dir: 0.35}`. Here the
  drybrush IS the outline (the reason 15 shells could be deleted) — his cheek, ear and
  mitt contours lighten exactly the way the island's roots do.
- Satchel/wraps: `poster: 3`, `wear: 0.25`, default dir.
- Pencil: kept as built (sketch + fills) — it is jewel-tier small and already two-value.

**Value verification [D1]:** the four-tier `uTriPoster` quantizer means a scan down his
head now steps in committed plateaux like the oak crown (measured 92/255 range in 4
tiers) instead of the shipped 21-steps-in-8/255 airbrush. Assert in the hero check: his
bbox mean luma ≤ (darkest crown mean − 0.12) at 500×915, and ≥ 3 distinct value plateaux
on a 26-sample head scan.

**The seam and the two lighting states:**
- `markAlive(goblin.root)` stays (hero.ts:1243): `uTriAlive = 1` zeroes
  `max(curtain, seam)` for him (trilayer.ts:299), so when the page freezes to graphite
  he keeps his paint — the brand's whole payoff, unchanged.
- The "half underdrawing, half painted" state belongs to the ENTRANCE: his parts ride
  `uTriBirth` and the paint-toggle machinery (heroLife.ts:115-171) like any world prop —
  he is born as graphite strokes, tier by tier, and `markAlive` flips at the handoff
  (`HANDOFF`, heroLife.ts:55). After that, alive wins everywhere.
- Where he READS on each side: at x = 0.95 against SEAM_X = 1.0 his pencil arm crosses
  onto the paper-white graphite field — `gobCloak` against paper is the strongest
  contrast in the frame. On the painted side, dark bell against lit grass. He wins both
  fields by value alone, which is what "reads at 36 px" actually requires.
- Performance rig: warm key + lantern; the amber eye picks up the lantern side. Prep
  rig: flat, shadowless — he still reads because his read never depended on shading,
  only on value + silhouette. Only what is alive casts (rigs.ts:13-17): him.

---

## 6. Face and eye

**The face at phone width is: dark hood frame + amber eye(s) + pale chin crescent.**
Nothing else is budgeted to survive 43 px, so nothing else is load-bearing.

- Eye discs 0.056 u radius (kept), proud of the cheek plane by ≥ 0.012 u (§4 row 7).
  At the 0.75 u staging that is ~9 px at 1440 and ~4 px at 390 — four SATURATED amber
  pixels inside a near-ink cowl, which reads as a lit eye the way a 4-px lantern flame
  reads as fire. Assert: ≥ 40 px of warm (R−B ≥ 70) inside his bbox at 1440, **≥ 8 px at
  390** (shipped: 0 and 0 **[D4]**).
- One baked amber under-glow dab on the upper cheek, `amberLantern` at 12 % over
  `gobSkin` in the skin trilayer's albedo (a painted mark, not a light) — doubles the
  warm footprint without touching the glow gate (glow remains amber-only and this IS
  amber).
- The eye's limit: it may never emit (no bloom, no additive material). It is paint. The
  amber ramp's lift belongs to the lantern and the touch system (trilayer.ts:399-405),
  not to him.
- **Expression at distance = ears** — already the shipped doctrine ("at montage distance
  an ear still reads when a brow is two pixels", actions.ts EXPRESSIONS comment) and the
  reason every EXPRESSIONS entry carries an `ear` term. The asymmetric base makes this
  BETTER: up-ear droop is legible as a mood change at 36 px because it changes the
  figure's apex.
- Brows/mouth/pupil carry expression from 150 px up. The slit pupil gains one channel:
  ±0.006 u lateral offset for the look-at-viewer micro-saccade (§9).
- The wordmark alignment: in the look-at-viewer beat he gives the two-ears-two-eyes
  plate straight to the lens — the character quoting his own logo, once.

---

## 7. Costume and kit

**One garment, hood to hem** — the shipped decision (world.ts:936-940) was right, only
its value was wrong. `gobCloak` near-ink moss, three strata bands. The arms live UNDER
it at rest and the glove comes OUT for a reach — kept; that reveal is the charm and now
it is also a value event (dark glove crossing pale paper).

**Kit, complete list — a stagehand carries exactly what the film uses:**
1. **The carpenter's pencil** — HIS icon. Kept two-value (timberDark body / dieBone
   collar / graphite core), scaled ×1.35, and it must silhouette: held OVERHAND with the
   long axis at ~40° to the forearm so tip and butt both clear the arm's contour. It is
   never parallel to a limb (parallel = the shipped lozenge merge **[D8]**). Between
   beats it parks BEHIND THE UP-EAR — instantly legible, pure character, and it decorates
   the silhouette's apex.
2. **The satchel** — kept, back-slung, `gobSatchel` warm patch breaking the dark bell in
   over-shoulder framings (the C2 follow reads it for thirteen seconds).
3. **Shin wraps** — kept, `bedroll`; the pale interval that separates hem from feet.
4. **One brass earring (L), one ear bandage (R)** — kept; the ears have seen work.

Nothing else. No belt, no tunic layers, no pauldrons (already litigated out,
world.ts:1226-1227). Every prop is either an acting partner or a silhouette event;
anything that is neither is weight.

**Staging the props:** pencil-side arm is the camera-side arm in the hero stage; the
satchel faces camera in the follow shots. `reachSolve` (actions.ts:69) already solves
either arm to any target, so prop-side flips are staging calls, not rig work.

---

## 8. Weight and contact

The film's Canvas has NO shadow maps (curtain.ts:72-74), so grounding must be painted or
committed — never hoped for. Three layers, all cheap: **[D5]**

1. **The painted contact pool** — one trilayer feathered card (`feather: 0.55`),
   ellipse 0.36 × 0.22 u under the root, colour `grassDeep` pulled 25 % toward ink,
   centre offset +0.10 u in +x (agreeing with KEY_POS(−4, 3.95, −4)'s throw). It rides
   the root like the old `contact()` did, so he is grounded on the path, a montage
   platform and the cliff top alike — but it is a gouache blob, not nine hatch strokes.
   `markAlive` includes it: his pool stays painted on the frozen page, which is hero §5's
   grammar (only what is alive shades the drawing).
2. **The committed crossing shadow** — in the hero stage, where a real shadow map
   exists, `rig.aliveShadow` stays at the SETTLED 0.45 (heroLife.ts:67): his cast shadow
   crossing the seam onto the graphite half is the poster's signature and now it lands
   on a field the pool has already anchored, instead of BEING the only grounding.
3. **Hem behaviour** — the hem never hangs clean: rear kicked +0.02 u, front interrupted
   by the leading foot. A hem that touches its own shadow pool is what "standing" looks
   like in paint.

Rule for animators: **feet may leave the pool; the pool never leaves the feet.** In a
jump the pool stays on the ground and shrinks 20 % (scale, one tween) — the cheapest
possible height cue and the classic one.

The shipped bug — stageGoblin hiding every root child except the pelvis
(hero.ts:1201-1203), which silently deleted the contact smear — becomes impossible: the
pool is parented INSIDE the pelvis-sibling set the stage keeps, and the hero check
asserts ≥ N dark px under the hem at 1440.

---

## 9. The puppet

**The joint set is the shipped set — the diagnosis is explicit that the rig argument
(world.ts:832-843) is sound and 25 channels already drive it. Kept verbatim:** root,
pelvis (pos.y = crouch), bob (breath), chest (waist hinge = the hunch as a STATE),
neck, head, earL/earR pivots, face (browL/R rot+lift, eyeL/R scale, mouth rot/scale/y),
armL/R (pose, swing, elbow, wrist), legL/R (pose, swing, shin, foot, toe).

**Two additions, both single groups:**
- **`hem`** — one pivot at the skirt band's top. rotation.x/z lag the root's velocity by
  ~120 ms, clamped ±0.12 rad, spring-settled. One joint of cloth follow-through is 90 %
  of a cloth sim's storytelling at 0 % of its cost. The bell finally trails a bolt and
  settles after a stop.
- **`pupils`** — one group offsetting both slit pupils ±0.006 u. Saccades and the
  look-at-viewer land here.

**The demanded actions.** Most already exist in actions.ts — the puppet was never the
problem; it now has a figure that shows the work. Recipes (durations at film scale;
every core uses the motion doc's ease lanes):

| Action | Recipe |
|--------|--------|
| **peek** | exists (actions.ts:349) — crouch 0.85 + chest 0.62 + look down-under + `alarm` + shoulders-to-ears. Add: up-ear stays UP while everything hides — the periscope gag the asymmetric ear was built for. |
| **run** | `bolt` (361) unloads the crouch he is already in + `applyGait` at sp 1. Ears pinned −0.5, hem lag at clamp, chest +0.08 lean. He does not pump arms wildly — a professional runs like a waiter with a tray. |
| **freeze-and-turn-to-camera** | THE signature. All swing channels → 0 in ≤ 0.10 s (power3.out); 0.25 s of nothing but a blink; then `look` (yaw 0.9 to lens — neck leads, head +0.12 s, actions.ts:294) with `alarm` melting to `sly` over 0.6 s; ears arrive LAST (+0.08 s, 1.3× overshoot). Comedy is the dead stop, not the turn. |
| **light a lantern** | `plantFor` + `reachSolve` to the wick + `tap` ×1; the flame answers on contact frame. Amber comes from the LANTERN, never from him — glow gate. |
| **pull a rope** | `haul` (412) exists: two hands, weight shifts back, heels dig (toe up 0.2), three tugs with rising chest involvement — effort shown by posture, not by face. |
| **walk-in casually** | `applyGait` sp 0.55, one arm under the cloak (`armRest`), head wander ±0.06 yaw on a 3 s noise, pencil behind the ear. The entrance of someone who works here. |
| **shrug** | exists (431); ears mirror the shoulders +0.2 and settle 0.15 s later. |
| **nudge a die** | `nudge` (460), but with the PENCIL BUTT, not the mitt — the mitt has no finger and he would use the tool anyway; flip to butt-forward is the 0.3 s anticipation, tap-through 0.12 s, one glance to confirm, back to work. |
| **draw on a map** | `stoop` (377) + wrist.z oscillation ±0.4 rad at 2.2 Hz; head tracks the tip with 90 ms lag; up-ear ticks at each stroke end. This is the hero pose — the rest state IS this action paused. |
| **throw a d20** | new compound: crouch 0.3 (0.28 s, the only big anticipation he ever does) → chest+arm unwind power3.in 0.14 s, release 55°, wrist follow-through, ears trail — then immediately back to work, no watching the die. The not-watching is the character. |
| **look at the viewer** | `look` + `sly` + pupil offset toward lens; hold ≤ 1.2 s; the once-per-film wordmark quote (§6). |
| **scritch** | the heroLife 4 s-idle loop (heroLife.ts:607-757) — retarget: pencil butt scritches under the up-ear, then the pencil parks there. Ends back at *absorbed*. |
| **idle breathing** | exists — `applyGait`'s breath term (actions.ts:45-50) on BREATH_RATE, riding the same clock as the gait so a freeze never stops it. Add a 12 s pencil-twiddle: wrist.y ±0.5 rad, 1.6 Hz, 0.7 s. |

---

## 10. Motion identity

What makes movement HIM, implementable:

1. **Quick middles, soft ends.** Anticipation 0.12–0.20 s, core at power3, settle 1.6–2.2×
   the core's duration. Never a symmetric ease. He is fast the way a craftsman is fast —
   the move itself is snapped, the landing is placed.
2. **He anticipates with WEIGHT, not windup.** Every action begins with a `weightShift`
   (actions.ts:265) or a crouch-load, 0.12–0.18 s before the limb moves. He never
   telegraphs with the arms; his hips already know. (The d20 throw is the one authored
   exception — one real windup per film, which is why it lands.)
3. **Order of operations, always:** pelvis → chest → neck → head → ears. Looks lead from
   the neck with the head +0.12 s behind (shipped, actions.ts:294 — kept). **Ears are
   ALWAYS last** (+80 ms, 1.3× overshoot) — the follow-through signature that makes even
   a 36 px figure feel elastic, because the ears are the apex of the silhouette.
4. **The freeze is his fingerprint.** Motion stops in ≤ 100 ms; only eyes, ears and
   breath continue. Everyone else in fiction eases out; the stagehand just STOPS,
   because being caught is a professional hazard he has drilled for.
5. **Idle = maintenance, never boredom.** Breath (always), double-blink pattern (120 ms
   blink, 18 % chance of a second at +180 ms), ear flick, pencil twiddle, scritch at 4 s.
   He checks his work, not his phone.
6. **Economy is the character.** No gesture uses more joints than it needs; recovery
   from ANY beat returns to the working stoop within 0.8 s. He is interruptible, not
   distractible.

Budget: all channels are GSAP tweens on transforms — zero per-frame allocation, zero
material swaps, zero geometry morphs. The scrub-driven timeline stays scrub-safe because
nothing here is stateful (the shipped rule, kept).

---

## 11. Reduced motion and phone width

**Reduced-motion still:** the entrance pre-completed (`uTriBirth = 1`, paint toggles on,
`markAlive` set), figure in the working stoop with the pencil at the next stroke, the
committed crossing shadow and the contact pool in place. No breath, no blink, no ear
tick — an honest still, and it holds, because the pose is a story: *caught making it*.
The eye glint and the seam do the life. (Maps to motion-doc §14's static lane.)

**Phone width:** at ≤ 480 px the stage bumps his scale so the figure is ≥ 52 px tall
(the shipped 43 px was below the silhouette's legibility knee). Shell weights drop one
class (`hero`→`form`) so lines sit at 1.5–2 px, above the AA beading that ate the 390 px
outline. Stroke tiles stop resolving below ~60 px of figure — accepted; poster tiers and
value carry the read there by design. The check runs the §2/§5/§6 asserts at 390, 768,
1440 via `heroProject` (hero.ts:256) — the measurement discipline the diagnosis praised
is the gate for every number in this document.

---

## 12. Failure modes I am accepting

1. **One-hinge cloth.** The hem lag can intersect a shin at extreme crouch+turn; clamped
   ±0.12 rad and the film has no beat that combines both. No sim, ever.
2. **Mitts have no fingers.** All grips are wrap or pinch; fine manipulation is always
   the pencil's job (which is a character statement, not just a save).
3. **Interior costume detail dies below ~150 px.** The dark cloak trades interior read
   for silhouette. Deliberate: nothing inside the bell is load-bearing at poster size.
4. **The three-quarter restage could still fail** despite the value fix. If the hero
   check's amber/aspect asserts fail at 1.15 rad, the profile stage (1.6) keeps every
   other decision here; only the two-eye wordmark quote is lost outside the
   look-at-viewer beat.
5. **The asymmetric ears break left/right symmetry of EXPRESSIONS.** `express()` deltas
   now land on unequal bases; `alarm` at full ear-up can carry the up-ear past vertical.
   Acceptable — an over-vertical alarm ear is funnier — but it is a new tuning pass.
6. **Stroke tiles alias on him at small sizes** (they tile at 1.6 u across strokes,
   trilayer.ts:92, and he is 0.9 u). Sheet-basis projection makes his whole body one
   param space so there is no per-face swirl, but tile density was tuned for trees;
   below 60 px of figure the tiers are the read, not the strokes. Accepted, and true of
   every prop his size.
7. **He no longer self-outlines everywhere.** Deleting 15 shells means his skin contour
   depends on edge-wear + value contrast; against a hypothetical mid-value background
   (none exists in the shipped comps) he would lose ~1 px of pop. The four kept shells
   guard the poster contours.

---

## Build order for the engineer

1. Palette: add `gobCloak 0x333B2C`; retire `timberDark` from boots/gloves/cuffs/rims.
2. world.ts buildGoblin: swap `paint()` fills → per-part `createTrilayer` (§5 table);
   delete the three hatch fields (978, 1211, 1277); replace `blobs()` hands/feet with
   the lathe mitts/pads; re-pivot the ears; move eyes proud; add `hem` and `pupils`
   groups; reduce shells to 4.
3. actions.ts: split `EAR_Z` into per-ear constants matching the rig; everything else
   is untouched — the verbs already exist.
4. hero.ts stageGoblin: rotation.y 1.6 → 1.15; delete the shell-scale patch
   (1179-1183, obsolete with 4 uniform shells); keep scale, position, stoop; add the
   contact pool to the kept children; wire the new asserts into hero.check.
5. heroLife: retarget scritch to the ear-park; include his parts in the birth toggles.
6. Measure. Every number in §2, §5, §6 and §8 is a `heroProject`/readback assert, not
   an opinion.
