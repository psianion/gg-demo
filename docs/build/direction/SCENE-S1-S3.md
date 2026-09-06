# CHAPTER ONE — scene direction for Stages 1–3

2026-09-03 · The Claim (t0–10.2) · The Address (t10.2–16.5) · Proof of Light (t16.5–26.5).
Authored under `docs/2026-09-03-world-direction.md` (THE KEPT WORLD — law), `docs/story.md`
(locked), `docs/copy-spec.md` (verbatim), `docs/2026-09-02-experience-design.md` (beat
sheet + boundaries, inherited), `docs/2026-09-02-motion-system.md` (two clocks). Line
refs are current `story/src/film/*` unless marked v1-history. This directs staging; it
does not authorise a build.

## Chapter thesis

Chapter One opens on black and must earn a stranger's next scroll three times over:
recognition (S1 — *you have rolled this ambush*), identity (S2 — *the goblin is the
narrator, and this world was decided, not found*), and the film's thesis image (S3 — the
lantern: light, colour and shadow are one gift, delivered by hand). The keeping tense
runs: shared memory inverted → the file opens → tonight's shift. Flagship beat 1 (the
erased, redrawn cliff contour) lives in S2. The seam frontier's first of two legal
appearances is S3's lantern bloom.

## Standing facts every beat below assumes

- **Clocks.** `world.t`/`timeScale` freezes at the S2 tick (t12.5) and does **not**
  resume inside this chapter — the shipped resume mark is t30 (timeline.ts:539), in the
  S4 author's t-range. `gobT` never stops. Touched props bank their life on `gobT` via
  `markAlive` (direction §11) — that is what lets a lit fire flicker inside a frozen
  world, which v1 could not do.
- **Timeline marks are kept** (direction §13, S3 row): captions at their shipped `cap()`
  positions (timeline.ts:171,243,306–314,533), the tick at 12.5 (tightened 0.2→≤0.15t,
  closing FINDINGS P1-T3/P2-T4), the seven prop stops at `segAt = 17 + i·1.857`
  (timeline.ts:350–358,434), the partial-drain mark at 25.4 (timeline.ts:503). Marks 5
  and 6 (mushrooms ~26.29, signpost ~28.14) and the t30 exhale fall past this chapter's
  26.5 boundary — see the handoff contract at the end.
- **Sky is always the page.** Night is dusk air (`skyDusk` hemisphere) on painted
  surfaces plus the campfire key — never a dark backdrop. The paper stays `#F7F5F0`
  behind everything; the only true black in the chapter is the `#blackout` DOM overlay
  (t0–5.5), which is also why `open1`/`open2` are the film's only white type
  (copy-spec: "white on blackout, ink on paper" — `open2` plays after the lift, so it is
  ink on the lower-third band like every later caption).
- **Key families.** S1/S2 = exterior night: campfire key at `(1.2, 2.4, 1.6)`, +18°
  screen azimuth, low, radius-limited. S2's freeze = Prep flat light, **no key**; his
  contact shadow (`rig.aliveShadow`, film default 0.3) is the only shadow in the frame.
  S3 = exterior day key `(4, 6, 3)` warming in with the return. The cliff is baked once
  for the day family; night takes it at reduced intensity, same azimuth (direction §8).
  `Film.tsx:100`'s `0xffb45e` point light retires here (closes FINDINGS P3-T6).
- **Elevation clamp 20–75° in every shot** (direction §6). Every v1 camera in this span
  sits below it (the ambush wide looks *up* the cliff at ~9° from `[102,1.6,2.2]`,
  timeline.ts:199; the rim medium ~10°, timeline.ts:240; the address close-up ~3°,
  timeline.ts:300). All four setups restage as lean-over angles; authored targets below.
- **World layout.** v1 puts the S1/S2 cliff at x≈106–130 (`buildCliffWorld` doing double
  duty, RECON §2.9) and the S3 path at x≈0–30 — the t16.5 hard cut is a 124-unit
  teleport (timeline.ts:321–323). v2 keeps both sets where they are and replaces the cut
  with **the void hop** (below), because the experience doc's S3 in-transition is
  "continuous — no cut" and the travel line is grammar kit item 6.
- **The void hop** (implementation note, chapter-owned): from t15.85 the goblin runs off
  the cliff island's rim onto bare paper; the graphite travel line draws ~1.5 units
  ahead of him (`LineSegments2` `instanceCount` ramp, the `heroLife.ts` mechanism); the
  camera swings to the three-quarter-back follow and tightens so that for ~0.5t
  **nothing but paper, the line, him and his contact shadow is in frame**. Inside that
  anchorless window one scrub-tied `tl.to` slides goblin+camera+look by a constant world
  offset onto the path island's approach — a match-on-motion reposition that is
  invisible forward and exactly reversible backward (it is v1's `tl.set` teleport spread
  over the void, where no landmark can betray it). No page turn is spent; the
  seven-transition catalog is untouched.
- **Margins.** Chapter numeral `C1` through both S1 and S2; it cross-fades to `C2` at
  16.5. Margin whispers ≤4% during Performance, breathes to full at the tick (0.4s).
  Passed ruler ticks ink in throughout. Skip note (*skip to the table ↓*) appears at
  t16.5, per experience §4 — never earlier.
- **Deleted on this chapter's watch:** `earthPlane`/`grassPlane` (world.ts:2244–2254),
  S1's flat-fill treeline rows and band-plate horizon, the rock-face hatch at
  world.ts:1573, the cave-mouth crossHatch at 1941, the sign "letters" at 2147/2189, the
  `camp` children-filter coupling at 1759–1763 (replaced by an explicit island group —
  RECON's named extraction hazard).

---

# STAGE 1 — THE CLAIM (t0–10.2)

Five beats. State: Performance, genuine night. The stage's tense: *shared memory,
inverted* — the ambush aftermath is already evidence of keeping, but the audience does
not yet know whose.

---

## S1-B1 · t0–4.0 · BLACK

**1. ARGUMENT.** *This film speaks my game.* Before a single image, the visitor learns
the film's voice is D&D's shared memory — and that the page obeys them (they caused this
blackout by leaving the Cover; scrolling up un-causes it).

**2. MESSAGE.** `open1` — **"Every campaign begins the same way…"** — verbatim. Enters
at t0.5 as the Hand's stroke write-on in the shipped `cap('open1', 0.5, 2.5)` window
(timeline.ts:171), holds to 3.0, un-writes by 3.4. White strokes on the blackout — the
only white-on-black type in the film. Lower-third band. The caption *is* the frame;
nothing competes.

**3. VISUAL.** The `#blackout` overlay at full. No geometry renders meaningfully. The
margin system is present but at whisper; the scroll hint died on first input at the
Cover. This is also the streaming absorber: a slow line simply holds black a beat longer
(experience §10), and the *sharpening pencils…* margin note is the only legal stall
surface. No spinner exists.

**4. 3D ELEMENTS.** None on screen. Behind the black: camp island + cliff island
(set tier, both N), campfire kit (R), camp kit bedroll/pack/spear (R), adventurer trio
(R), arrows + shield + bolt (R) are staged at t0 exactly as the shipped `tl.set` block
does (timeline.ts:186–195), so a reverse scrub into black always finds the stage set.
Per G2, the Cover's idle has already kicked S1's class bakes (rock, cloth, fire).

**5. GOBLIN ACTION.** Staged, not seen: `settle` + `express('neutral')` at t0
(timeline.ts:194–195), on the cliff rim at the near lip, facing the party.

**6. INTERACTION.** Scroll only. Geared tight (the blackout absorbs impatient scrollers
and slow loaders equally). Responsiveness is the caption itself: it writes and un-writes
1:1 with the thumb.

**7. ANIMATION.** Master timeline only: the write-on (~15 strokes/s). World clock runs
(timeScale 1) but nothing visible rides it. Reverses cleanly by construction.

**8. TRANSITION OUT.** None — B2 is the same shot; the blackout begins lifting at t4.0.
(The transition *into* this beat was **house lights**, spent once, at the Cover.)

**9. KEEPING.** None yet — deliberately. The black is the withheld file. Not a flagship.

---

## S1-B2 · t4.0–5.5 · THE LIFT — aftermath by firelight

**1. ARGUMENT.** *Someone already worked this night.* The first image is not a battle
but its residue: dropped kit, arrows standing in rock, a fire that someone laid. The
visitor reads evidence before they read action — the stage's inverted tense.

**2. MESSAGE.** None (open1 has cleared). The meaning is carried by the campfire being
the frame's only warmth and by the residue reading as *arranged*, not scattered.

**3. VISUAL.** `#blackout` fades 4.0–5.5 (timeline.ts:198, kept). Revealed: a raised
night wide from behind and **above** the party — camera at ≈`[100, 7.5, 6]`, target
≈`[114, 3.2, 0]`, elevation ≈24° (restaged from v1's 9° up-shot to obey the bench
clamp; the maquette is leaned over, never stood inside). Foreground: the three
adventurers' backs, anchoring the bottom edge on the **camp island**; middle: the paper
gap between the two islands — both cut edges showing their bright painted lip over
sectioned strata; far: the **cliff island** rising as a dusk-lit mass, one small goblin
shape at its rim, reading against the island's own stone (nothing silhouettes against
"sky" — the paper beyond ramps in-material). Light state: `skyDusk` hemisphere, campfire
key low at +18°, embers drifting. Everything painted (Performance); nothing graphite.
The sheet edge rule is satisfied twice — both island rims and the void between them are
in frame.

**4. 3D ELEMENTS.** Camp island (N, sculpted three-band edge, roots, drawn rim, grid
ghost ≤4%); cliff island (N, shared with S2/S7, day-family bake at night intensity);
campfire kit (R: ring + logs + tongue flames + glow sprite); camp kit bedroll + pack +
spear (R); adventurer trio (R: `cloakIndigo` ×2, `cloakCrimson` ×1, silhouette-first,
painted cloaks, zero interior hatch); arrows ×3 standing in rock + dropped shield (R,
keeping props); ember particles (R, world clock); cloud/streak flats behind (R, honest
theatre sheets, atmosphere only); rock kit boulders merged into each island's one
geometry per class (G1 — no instancing anywhere). Per-mesh materials: none this beat.

**5. GOBLIN ACTION.** He holds the rim — `peek` posture (actions.ts:349) over the lip
rock, ears up. Story-locked: "one tiny goblin peeks around a rock." No path, no touch.

**6. INTERACTION.** Scroll only. The frame answers by parallax of real planes as the
scrub eases (camera drift is scrub-tied); embers answer on the world clock without input.

**7. ANIMATION.** World clock: fire flicker (`FLICKER` on world.t), ember drift, cloth.
Master timeline: the blackout fade (1.5t, `power2.inOut`, shipped) and a slow authored
settle of the camera into the wide. Nothing needs a reverse recipe; the fade mirrors.

**8. TRANSITION OUT.** None — continuous into B3 (same shot; the volley begins).

**9. KEEPING.** The stage's evidence, unattributed: the laid fire (ring of stones, cut
logs), the arrows *in* the rock as painted strokes, the dropped kit arranged the way a
camp is struck — plane two and four, never captioned. Cart-rut wear enters the camp
island's edge and stops where the pencil line stops (direction §3). Not a flagship.

---

## S1-B3 · t5.0–7.5 · THE VOLLEY — the party sees him

**1. ARGUMENT.** *This is THE goblin — the one from my table.* The party's reaction
confirms the peek was seen; the shared memory clicks from "an ambush" to "that ambush."

**2. MESSAGE.** None. Meaning is carried by aim: every projectile converges on the rim,
so the tiny figure becomes the shot's subject without a cut.

**3. VISUAL.** Same wide as B2 (one eye-path: the arc of the bolt). The wizard's bolt
rises twice as a bright painted stroke crossing the paper void between the islands —
`rayGold` burst on each impact near the rim. Two thrown arrows follow. The goblin
flinches at each strike. The impacts are painted marks landing on the cliff's painted
face; scorch (if any survives to the S7 dressing) is painted dark pooling, never
crosshatch.

**4. 3D ELEMENTS.** Everything from B2, plus: the bolt streak prop (R, metal/fire
grammar: matte gouache, one authored glint, no specular), `impacts[0..1]` ray-bursts (R,
`rayGold` painted cones, scaled in/out per the shipped `boltThrow`/`arrowThrow` recipes,
timeline.ts:205–223, marks kept: 5.0 / 5.9 / 6.3 / 6.6), `arrows2` ×2 (R). No new
assets.

**5. GOBLIN ACTION.** `flinch` composite at 5.55 and 6.85 (kept, timeline.ts:227–235):
`crouch` 0.3 + `look` down + `express('alarm')`, recovering each time. A duck, not a
stagger — his feet never move until the leap.

**6. INTERACTION.** Scroll only. The volley is scrub-tied ray-bursts (experience S1
Move), so dragging back literally un-fires the wizard — the film's first taste of the
projectionist's power.

**7. ANIMATION.** Master timeline: bolt arcs (0.3 out + 0.3 in per throw), impact pops
(`back.out(2)` in, `SETTLE.exit` out), flinches. World clock: fire, embers, cloth,
unbroken. Reverses cleanly — the throws are position tweens with `tl.set` visibility
flags, which replay correctly backward (shipped grammar).

**8. TRANSITION OUT.** **The page turn** (1-frame paper flash) at t7.5 — the first of
S1's two licensed cuts (experience §7 names them). Costs nothing: a camera `cut()` under
one frame of paper; both islands persist.

**9. KEEPING.** The impacts add to the aftermath the audience will re-meet in S7: these
same arrow strikes are the "remains" the tended cliff later clears. The film plants its
own future evidence here. Not a flagship.

---

## S1-B4 · t7.5–9.5 · THE RIM — glance, line, leap

**1. ARGUMENT.** *"…and one goblin always gets away" — and this film is his.* The claim
lands verbatim as he proves it. The film's title character earns the camera.

**2. MESSAGE.** `open2` — **"…and one goblin always gets away."** — verbatim, at the
shipped mark `cap('open2', 8, 1.6)` (timeline.ts:243): write-on 8.0, held to 9.6,
un-writing over the landing cut. Ink strokes on the lower-third band, which at this
framing sits on the cliff-top's quiet painted ground — ≥4.5:1 held. Timed so the line's
last words sit under the leap.

**3. VISUAL.** Rim medium, restaged for the clamp: camera ≈`[113.5, 9.2, 3.4]`, target
≈`[117.6, 6.2, 0]`, elevation ≈28° — we lean over the rim with him. Foreground: the
rim's drawn contour and the lip rock; middle: the goblin, full figure on the left third
(this is *not* a direct address — thirds hold); far: the plateau top running to the far
edge, then paper. One more bolt impact (`impacts[2]`, mark 8.1 kept). He glances down
the way he came, turns, bolts across the top, and leaps off the far side, dropping out
of frame. The leap reads in silhouette at this distance — no face acting required.
Light: dusk air; the campfire key rakes up from frame-left at +18°, low.

**4. 3D ELEMENTS.** Cliff island (the star of the frame — strata as contour steps,
drybrush only on climbable edges); `impacts[2]` (R); no party in frame (they stay on the
camp island behind camera). No new assets.

**5. GOBLIN ACTION.** Marks kept from timeline.ts:241–265: `look` down (7.6) +
`express('strain')`; `crouch` flinch on the 8.1 impact + `express('alarm')`; turn (8.3),
`bolt` sprint unload (8.35), `express('neutral')` — he is not panicking, he is
commuting; the three-tween leap arc 8.4→9.5 (run, rise, fall) with the chest/pelvis/ear
follow-through as authored. He exits over the far rim.

**6. INTERACTION.** Scroll only. A touch-device soft rest sits on the `open2` anchor.
The leap is scrub-tied: reversing pulls him backward up out of the void, which is
correct and funny, and costs nothing.

**7. ANIMATION.** All master-timeline: impact pop, turn, sprint (gait via
`goblin.speed`, cycled by `gobT`), leap arc, ear flaps. World clock: dusk ambience only.
The leap needs no special reverse — three position tweens mirror exactly.

**8. TRANSITION OUT.** **The page turn** at t9.5 — S1's second licensed cut. It hides
the fall (experience S1: "the cut hides the fall"). Cost: one camera `cut()`, goblin
`tl.set` to the far-base landing pose under the flash.

**9. KEEPING.** The rim he crosses carries the ruts of every previous crossing — a
rubbed patch at the lip where he always lands, drybrush where hands go (rock class
recipe). Second-plane; discoverable on scrub-back. Not a flagship.

---

## S1-B5 · t9.5–10.2 · THE LANDING — crumpled

**1. ARGUMENT.** *He is real, fallible, and endearing.* The legendary escape ends in a
dust puff. Affection begins here — the belief ladder's third rung starts loading before
S2 says a word.

**2. MESSAGE.** None (`open2` finishes un-writing over this beat's first frames). The
meaning is the gap between the legend just captioned and the heap on the ground.

**3. VISUAL.** Far base of the cliff, night, quiet: camera ≈`[129.5, 2.6, 3.4]`, target
`[126.5, 0.5, -0.5]`, elevation ≈26° looking down at him. Foreground: ground and one
boulder; middle: the goblin crumpled at frame centre-right, the landing dust puff
rising; far: the cliff's dark base going up out of frame — its edge and the paper void
visible frame-left (sheet-edge rule). The campfire key barely reaches around here: the
frame is the chapter's darkest painted state, one step of air above `caveDark` (colour
law 5 respected — no adjacent near-blacks).

**4. 3D ELEMENTS.** Cliff island far side (same asset); dust puff — the shipped
reused-impact scale trick dies with v1; v2 uses the particle language's dust sprite (R,
Performance-side flats), because this same dust must freeze as graphite at the S2 tick.
No other props. No new assets beyond the S2 dust scribble already registered.

**5. GOBLIN ACTION.** `tl.set` landing pose under the page turn (kept,
timeline.ts:269–273): full `crouch` 0.92, `look` down, `express('strain')`. He holds
the heap through the stage boundary — the get-up belongs to S2.

**6. INTERACTION.** Scroll only. Nothing to offer; the frame's responsiveness is the
dust settling 1:1 with the scrub.

**7. ANIMATION.** Master timeline: dust puff scale-in/out (marks 9.55–9.88 kept). World
clock: ambient night only. Clean reverse: the page turn replays backward gracefully
(paper, never black).

**8. TRANSITION OUT.** None — S2 begins at t10.2 in the same shot, on his first
weight-shift. The stage boundary is a gear change, not a cut.

**9. KEEPING.** The ground he lands on shows the rubbed patch of every previous landing
— the same wear vocabulary as B4's rim, now at reading distance. This is the world's
quietest receipt: *he has done this exact fall before.* Not a flagship.

---

# STAGE 2 — THE ADDRESS (t10.2–16.5)

Five beats. The file opens: first freeze, first underdrawing, first revision mark, the
grid — the oldest layer. Direct address #1 (dead-centre is licensed here and at
"You're welcome." only). His contact shadow is the only shadow in the frame after the
tick. **Flagship beat 1 lives at S2-B3.**

---

## S2-B1 · t10.2–12.5 · UP, AND DUSTED OFF

**1. ARGUMENT.** *He survived — and we are alone with him now.* The party, the volley
and the noise are a cliff away; the film's social contract shifts from watching a party
to following a goblin.

**2. MESSAGE.** None. Carried by the acting: the get-up is unhurried. Nobody who just
escaped death dusts off this calmly — the calm *is* the mystery `me1` is about to name.

**3. VISUAL.** Same far-base shot as S1-B5, easing closer as he rises (camera drifts
from `[129.5, 2.6, 3.4]` toward `[128.2, 1.9, 2.6]`, elevation held ≈24°). He gets up,
weight-shifts, and dusts himself off; the dust of the gesture rises around his knees.
Night Performance still: `skyDusk` air, the world clock alive. Frame composition puts
him right-of-centre, leaving the left third for the cliff base's drawn edge.

**4. 3D ELEMENTS.** Cliff island; dust motes from the dust-off (particle language,
Performance flats — these exact motes are about to be frozen). No new assets.

**5. GOBLIN ACTION.** Marks kept with one staging change: `weightShift` 10.2, `crouch`
release 10.2–10.7, `settle` 10.6, `express('strain')` → `look` level 10.6–11.0
(timeline.ts:279–283). **`dustOff` restaged from 11.2×0.9 to 11.4–12.55** so the tick at
12.5 catches the last brush mid-stroke — the experience doc's "Mid dust-off: the tick"
(§6 S2), which v1 missed by 0.4t. He finishes the wipe *inside* the frozen world,
because his clock never stops — the film's first proof that he is exempt.

**6. INTERACTION.** Scroll only. First soft-rest anchors of the address cluster arm
here on touch.

**7. ANIMATION.** Master timeline: get-up chain, dust-off, camera drift (all scrub-tied,
`power2.out` settles). World clock: night ambience, dust drift. All reversible as-is.

**8. TRANSITION OUT.** **The tick** at t12.5 — instant, never eased, never announced.

**9. KEEPING.** None staged — this beat is deliberately evidence-quiet so the tick's
reveal (the whole underdrawing at once) lands with nothing pre-spent. Not a flagship.

---

## S2-B2 · t12.5–13.35 · THE TICK · "That was me."

**1. ARGUMENT.** *The narrator is the goblin, the film can stop time, and I am
backstage.* Three beliefs in one frame: identity, mechanism, privilege.

**2. MESSAGE.** `me1` — **"That was me."** — verbatim, at the shipped mark
`cap('me1', 12.6, 0.55, T_PUNCH)` (timeline.ts:306). Graphite strokes (the Hand under
Prep), lower-third band, write-on as his eyes find us. The four `me*` lines run at punch
fades — spaced so no two are ever on screen together (shipped discipline, kept).

**3. VISUAL.** The tick: same frame, the world lifts to its underdrawing in ≤0.15t —
`timeScale → 0` and the curtain's tick recipe together (tightened from v1's 0.2t,
closing P1-T3/P2-T4). The cliff becomes contour strokes with construction ellipses and
measure ticks; the dust of his dust-off **hangs mid-air as a graphite scribble sprite**;
beneath the ground the **grid** ghosts in for the first time, ≤`GRID_INK`, running a few
cells past the island rim onto the paper. The margin breathes to full: sheet, ticks,
`C1`, the ruler. He stays painted — the loudest chroma in the frame — and casts the
frame's only shadow (`rig.aliveShadow` 0.3). No key light exists in Prep; a drawing
casts none. The push-in begins: camera eases from the B1 drift position toward the
direct-address medium close-up, scrub-tied, dead straight — dead-centre framing is
licensed for this address.

**4. 3D ELEMENTS.** Cliff underdrawing mark set (N — construction ellipses, measure
ticks, authored contours in `graphiteDark`); the grid ghost (grammar kit); dust scribble
sprite (N — the one Prep-side particle in the film, material table row "Particles");
the four `me*` letterings (N, P6 scope, DOM). The cliff island's albedo is untouched —
the curtain mixes to the underdrawing in-material (trilayer), nothing is swapped.

**5. GOBLIN ACTION.** He finishes the dust-off's last wipe (12.5–12.65, unbothered),
then turns from the hips to camera: `look` to lens (restaged to 12.55–12.9; v1's 12.1
turn pre-empted the tick), `express('sly')` at 12.4 (mark kept), `armRest` both sides,
`weightShift` onto one leg (timeline.ts:295–299 kept). `goblin.speed → 0` — the gait
releases, the breath term takes over on `gobT`.

**6. INTERACTION.** Scroll only — but this is where touch soft-rests earn their keep:
momentum dying within ±0.35t of each `me*` anchor eases to it over 220ms, so the four
lines are never half-written on a phone. Keyboard ↓ steps land on the same anchors.

**7. ANIMATION.** Master timeline: the tick (≤0.15t, no ease), the push-in
(12.5→13.7, `power2.inOut`, scrub-tied), caption write-on. `gobT` (never stops): his
breath, ear settle, blink availability. Held still: everything else in the world, by
construction — the stroke tiles are baked and still, and the freeze reads against that
stillness. Reverse recipe: the tick reversed is the same recipe mirrored (snap back to
Performance) — shipped curtain grammar; the margin un-breathes.

**8. TRANSITION OUT.** None — B3 is the same held freeze, next line.

**9. KEEPING.** The grid is the oldest layer of all (direction §2, S2 row) — the first
time the film shows the world sits on a decided sheet. The construction ellipses and
measure ticks say *this cliff was drafted*. Evidence in planes two and four; his face
owns plane three. Sets up the flagship next beat. Not itself the flagship.

---

## S2-B3 · t13.35–14.3 · FLAGSHIP 1 · "You thought I ran away."

**1. ARGUMENT.** *This world was decided, not found — and revised.* The one line that
accuses the visitor lands over proof of authorship: a contour that was drawn, judged
wrong, rubbed out, and drawn again. Someone kept this cliff.

**2. MESSAGE.** `me2` — **"You thought I ran away."** — verbatim, mark kept
`cap('me2', 13.52, 0.55, T_PUNCH)`. Write-on in the lower-third band. The caption and
the erasure are the frame's only two readable marks; the eye path runs face → line →
erasure and back.

**3. VISUAL.** **The authored flagship framing, inside the freeze** (direction §6: each
flagship gets exactly one authored framing with a stopped clock). The push-in has
settled at the direct-address medium close-up: camera ≈1.1 units out, ≈0.35 above his
eye line, elevation ≈20° — he looks *up* into the lens, dead-centre, eyes on the
upper-third line, ear tips out the top. Behind him, plane four, the cliff face at
reading scale carries **the erased contour pair**: the committed rim line in
`graphiteDark`, and beside it one earlier line rubbed to `graphiteLight` — a visible
ghost with the eraser's smear direction legible, redrawn a hand's width to the right.
Nothing else new is in frame. The lower-third band sits on the quiet drawn ground in
front of him (his tunic never enters the band — the locked contrast lesson; the 20°
down-angle is what keeps the band on ground instead of chest).

**4. 3D ELEMENTS.** Erased-contour pair (N — flagship asset, two authored strokes +
smear decal); eraser-ghost decal #1 (N — the doc's own example made literal: a
prior-position ellipse in `graphiteLight` at the cliff base where a boulder once stood,
plane two, supporting cast to the flagship — one of the register's exactly four); the
`me*` letterings. All graphite-layer marks from `pencil.ts` primitives — never type.

**5. GOBLIN ACTION.** Holding the address: `express('smug')` at 13.35 (kept),
`weightShift` to the other leg (kept, timeline.ts:308). No reach, no touch — his
stillness (breath only) is the acting.

**6. INTERACTION.** Scroll only; the me2 soft-rest anchor is where a curious visitor
naturally parks — and the flagship is composed to reward exactly that park. The frame's
responsiveness at rest: nothing moves but him breathing, which is the point.

**7. ANIMATION.** Master timeline: caption write-on/off only. `gobT`: breath, one ear
half-settle. Everything else dead still. Fully reversible; nothing needs a recipe.

**8. TRANSITION OUT.** None — same held freeze into B4.

**9. KEEPING.** **FLAGSHIP BEAT 1 of the film's four** (direction §1): the erased,
redrawn cliff contour. One line rubbed out and redrawn = the pentimento thesis in a
single mark. It whispers — no caption names it, no camera hunts it; it is simply
legible at the framing the address already required. The supporting eraser-ghost
(boulder ellipse) sits lower and fainter for the scrub-back reader.

---

## S2-B4 · t14.3–15.15 · "I did."

**1. ARGUMENT.** *The escape was the job.* The deadpan flips me2's accusation into
intent — he is not defending himself, he is correcting the record.

**2. MESSAGE.** `me3` — **"I did."** — verbatim, mark kept `cap('me3', 14.44, 0.5,
T_PUNCH)`. Shortest line in the film; the write-on is two beats of the Hand.

**3. VISUAL.** Identical held framing. The single change is his face — and one slow
blink at the line (experience §6 S2, locked). The frozen dust still hangs. The margin
is at full breathe; the ruler's inked ticks now visibly reach a fifth of the way along.

**4. 3D ELEMENTS.** No change. Nothing enters, nothing leaves.

**5. GOBLIN ACTION.** `express('flat')` at 14.3 (kept) — the deadpan — plus the one
authored slow blink. Nothing else moves.

**6. INTERACTION.** Scroll only; me3 anchor armed. This is the film's stillest beat —
its responsiveness is that even here, reverse-scrubbing half a line un-writes it.

**7. ANIMATION.** Caption write-on; blink on the puppet lane; breath on `gobT`. Reverse
is trivial.

**8. TRANSITION OUT.** None — same freeze into B5.

**9. KEEPING.** The held flagship frame continues to carry it (the erasure stays
readable through all four lines — one framing, four beats of reading time). No new
evidence; the discipline is the point.

---

## S2-B5 · t15.15–16.5 · "Straight to work." — the release

**1. ARGUMENT.** *The mystery has a job attached — follow him.* The address ends not
with an explanation but with motion; curiosity converts into pursuit.

**2. MESSAGE.** `me4` — **"Straight to work."** — verbatim, mark kept
`cap('me4', 15.32, 0.7, T_PUNCH)`; it un-writes at ~16.27, clearing before the chapter
numeral flips.

**3. VISUAL.** On the line he breaks the address: `express('sly')`, weight forward, and
he turns out of dead-centre and *runs* — off the cliff island's rim onto bare paper.
The world does **not** unfreeze and no colour floods back: the freeze holds (Prep
continues into S3 by the experience doc's own S3 state), the seam is banned in S2, and
what "releases" is *him*. The camera swings off the address axis into the
three-quarter-back travel follow (elevation rising to ≈26°) as the travel line begins
drawing itself ~1.5 units ahead of his feet. His contact shadow is the only shadow on
the void. The cliff island's drawn rim exits frame-left; for the last ~0.3t of the
stage, frame contents are: paper, the line, the goblin. The skip note pencils into the
bottom-right margin exactly at 16.5 — leaving is now allowed.

**4. 3D ELEMENTS.** The travel line (grammar kit item 6 — `polyline()`/`curveLine()`
via `LineSegments2` `instanceCount` ramp, N wiring, shipped mechanism); cliff island
(exits). Set windows: `cliffSet` visibility now closes at ~16.9 (off-frame under the
void hop) instead of v1's hard 16.5 (timeline.ts:165).

**5. GOBLIN ACTION.** `express('sly')` + `weightShift` (marks kept, 15.15); turn from
the address at 15.85; `goblin.speed → 1` and the run begins — the same unhurried
working gait S3 will keep. He exits the stage mid-stride on the void.

**6. INTERACTION.** Scroll only. The skip note's arrival is itself the interaction
event: the premise has landed, and the margin quietly offers the exit (eases to the
endcard in 1.2s; reduced motion jumps). Keyboard: the me4 anchor is the last of the
address cluster.

**7. ANIMATION.** Master timeline: caption, turn, run-out, camera swing, travel-line
`instanceCount` ramp (scrub-tied — it un-draws behind his heels on reverse, by
construction). `gobT`: gait cycle. Special reverse note: none needed here; the void hop
world-slide lives just past 16.5 (S3-B1) so this stage's reverse is plain tween mirror.

**8. TRANSITION OUT.** Continuous — no catalog transition is spent. The S2→S3 boundary
at 16.5 is a gear change and a chapter-numeral cross-fade (`C1`→`C2`, 300ms) crossed at
a run. This supersedes the experience doc's S2-out sentence "color floods back along his
walk direction": under the direction's seam discipline (frontier in exactly two places,
neither in S2) that flood cannot exist; the direction wins where they disagree. Flagged
in RISKS.

**9. KEEPING.** As he crosses the rim, the run's first strides land on the rubbed patch
at the island's edge — the commute wear of §3, the same mark S1-B5 planted, now read
from the other side. Second-plane. Not a flagship.

---

# STAGE 3 — PROOF OF LIGHT (t16.5–26.5)

Seven beats. Present tense — tonight's shift. State: Prep throughout the run;
Performance returns at its end (spatially, via the film's first seam frontier — the
world clock stays frozen past this chapter's boundary; the t30 exhale is the S4
author's). The seven shipped prop marks are kept; five of the seven stops land inside
this stage, and the lantern is the thesis image.

---

## S3-B1 · t16.5–17.0 · THE VOID CROSSING

**1. ARGUMENT.** *The world is a page, and between places there is paper.* The film's
world model — islands, void, a keeper commuting between them — is taught in half a
second of pure grammar, wordlessly.

**2. MESSAGE.** None. The graphite line drawing itself ahead of him carries it: the way
is only there because he is going.

**3. VISUAL.** The film's first pure travel-line shot: paper `#F7F5F0` edge to edge,
the line unspooling ~1.5 units ahead of his feet, him mid-stride at frame centre-right,
his contact shadow the only shadow. Camera three-quarter-back, elevation ≈26°, tight
enough that no island anchors the frame. **Inside this anchorless window the void hop
executes** (see Standing facts): one scrub-tied slide of goblin+camera+look by a
constant offset re-seats the pair at the path island's approach. At t~16.9 the path
ribbon island's near rim slides into frame ahead: cut edge first — bright painted lip
over sectioned strata — then the graphite path dressing beyond. His first stride onto
island earth lands at t17.0, exactly on the fire beat's `segAt`.

**4. 3D ELEMENTS.** Travel line (grammar); **path ribbon island** (N — the big build;
the hero island is a slice of it, so its albedo/bark/foliage bakes extend 1:1); the
island's ~40-tree flora stand, merged one `BufferGeometry` per class (G1); path-island
grid ghost. `pathSet` visibility opens at 16.5 (replacing v1's theatre-at-16.5 slot
logic). Per G2, S3's class bakes were kicked during S2's idle.

**5. GOBLIN ACTION.** Run, nothing else — the working gait at `speed 1`. Enters from
the void, path along the line, exits the beat onto the island's entry rut.

**6. INTERACTION.** Scroll only. The line answers the thumb directly: forward draws it,
backward un-draws it from his heels — the single clearest 1:1 the film has yet offered.

**7. ANIMATION.** Master timeline: line `instanceCount` ramp, the world-slide, camera
follow. `gobT`: gait. **Special reverse recipe, named:** the void hop must reverse as
the identical offset tween backward — nothing is created or destroyed, so it does, but
the check is that no island pixel is in frame for the full slide window in *both*
directions at every breakpoint (portrait's wider vertical FOV is the risk case; see
RISKS).

**8. TRANSITION OUT.** None — continuous onto the island; B2 begins at the fire.

**9. KEEPING.** The island's entry: **cart ruts enter at the cut edge and stop where
the pencil line stops** (direction §3, verbatim rule), and the path's first metres
carry the most wear on the island — the keeper's own commute, read before a single
prop. Not a flagship.

---

## S3-B2 · t17.0–18.86 · FIRST TOUCH — the campfire

**1. ARGUMENT.** *His work is making the world ready — and touch is the mechanism.*
The first prop stop converts S2's claim ("straight to work") into observable labour.

**2. MESSAGE.** None yet (`light1` is two beats away). Carried by the touch-reveal
grammar itself: colour exists in this world only where he has put his hands.

**3. VISUAL.** The run's follow shot, raised to clamp: camera trails 3.2 back and 2.8
out at y≈3.4 (v1's y1.6 restaged), elevation ≈27°, the ribbon island's near cut edge
riding the frame's low corner the whole run (sheet edge in every travelling wide). All
graphite: 40+ underdrawn trees, the props ahead as drawn forms. He stops at the
fire-ring (prop 0, hand point `[6, 0.35, 0]`), stoops, and the fire catches: the film's
first **touch reveal** — colour and its glow blooming from the contact point, 0.6–0.9s,
`power2.out`, the fire-ring, logs and flames taking paint while the world around stays
pencil. The flame's glow pool is the frame's only light; scorch below is painted dark
pooling.

**4. 3D ELEMENTS.** Campfire kit #2 (R — ring + logs + tongue flames + glow sprite;
`fire2Flames`/`fire2Rays` marks kept, timeline.ts:364–366); ember particles (R) — alive
on `gobT` once touched (banked life). markAlive'd this beat: the fire group (counts
against the ≤40 per-mesh budget; running chapter total after this beat: ~3 meshes).
No new assets.

**5. GOBLIN ACTION.** The shipped per-stop chain, kept as the run's grammar
(timeline.ts:434–526): run to the solved stand point, `speed → 0`, turn to face, deep
`stoop` (`crouch` to the plant's solve) + `reach` to `[6, 0.35, 0]`, the prop moves
only once his hand arrives, `armRest` + `crouch` release, turn back to +x, `speed → 1`.
`express('neutral')` — practiced, no hesitation, `power2.out` confidence (direction
§11).

**6. INTERACTION.** Scroll only. What answers instead: the reveal is scrub-tied, so
backing up un-lights the fire — the visitor can audit the work (the projectionist
rule).

**7. ANIMATION.** Master timeline: run/turn/stoop/reach chain, the reveal mask ramp.
`gobT` (banked): flame flicker + ember drift begin the moment the reveal completes and
never stop — motion accumulating in a still world, the body's signature move. Held
still: everything untouched, by construction. Reverse: reveal reversed retreats to the
contact point (shipped `reveal()` grammar); the banked idle's amplitude rides the
reveal mask so it dies smoothly on reverse — no special recipe.

**8. TRANSITION OUT.** None — the run continues (camera never stops travelling between
stops).

**9. KEEPING.** The fire-ring's stones carry soot from previous nights — painted dark
pooling on the ring's inner faces, present *before* he lights it. Tonight is not the
first night. Plane-two texture. Not a flagship.

---

## S3-B3 · t18.86–20.71 · THE LANTERN — thesis image, seam frontier #1

**1. ARGUMENT.** *Someone has to light the world — and light is labour that brings
colour and shadow as one gift.* The film's whole pitch in one held image. If a visitor
remembers one frame of Chapter One, it is this.

**2. MESSAGE.** `light1` — **"Someone has to light the world."** — verbatim, at the
shipped mark `cap('light1', 19, 4)` (timeline.ts:533). It writes on in graphite (Prep
side of the Hand), and as the lantern pool crosses the caption band (~20.2–20.8) each
stroke **flushes graphite→ink in a 200ms per-stroke crossfade** — never a repaint
(direction §4, experience §6). It holds long (4t) across the cave-door stretch and
un-writes by 23.4.

**3. VISUAL.** **The run's one held wide.** The camera stops travelling and holds:
lamppost right of centre on a third, the goblin at its foot, the path ribbon running
away into graphite depth, the island's cut edge and paper low in frame. Elevation ≈30°.
The lamppost is restaged per the hero lesson (P4d-T5 as staging law): the flame column
is never occluded by its own post from this lens, and the bracket arm resolves against
the paper beyond, not against the pole. He reaches up and taps the glass — the flame
takes — and the **amber pool blooms from the touch point**: `amber` core,
`amberLantern` glass tier, glow cones painted. Every tree the pool reaches **takes its
paint back, shadows arriving with the colour** — the day key fades up inside the pool's
territory only. Then the pool stops being a circle: **the funded `seamDir` frontier
absorbs it** — the reveal's edge becomes the film's first directional frontier, its
`seamDir` set along the path tangent (+x), carrying the shipped pooling, dab break-up
and tide-line (trilayer.ts:281–319). Behind the line (west): painted morning. Ahead
(east): pencil. The frontier then advances with his progress for the rest of the run.

**4. 3D ELEMENTS.** The lamppost (hero tier item 3, R — restaged); glow sprite +
painted glow cones (R); the seam basis promotion (`seamDir: Vector3`, two files,
trilayer.ts:276 + islandKit shadowFrag — the one funded extension, wired here);
`lanternPost`/`lanternRays` reveal marks kept (timeline.ts:483). markAlive'd: lantern
glass/flame (flicker banks on `gobT`). The `light1` lettering (N, P6). Trees repainting
are *not* per-mesh — the frontier crosses the merged stands in-material; zero draw-call
cost.

**5. GOBLIN ACTION.** Run to the post's solved stand (prop 1, hand `[10, 1.1, 0]`),
`speed → 0`, turn, `reach` up + `tap` on the glass (the touch is the mechanism — his
grammar, later handed to the visitor at the CTA), hold a beat looking up at it —
the one unhurried look of the run — then `armRest`, turn, `speed → 1`, and he runs
**through his own frontier** eastward into the pencil.

**6. INTERACTION.** Scroll only; a rest anchor sits on the lantern (experience §6 S3).
On touch, momentum dying near `light1` eases to the anchor — every phone visitor holds
this frame once. The frame's answer to a parked visitor: banked flicker breathing in
the pool while the graphite half stays utterly still.

**7. ANIMATION.** Master timeline: reach/tap, bloom (T_BLOOM lane 0.8–1.2s), the
pool→frontier handoff, the caption flush, the frontier's scrub-tied advance. `gobT`:
flame flicker, his gait. **Reverse must be flawless** (this is a signature scrub-back):
the handoff is authored as one continuous uniform ramp (radius grows → seam takes over
at a fixed blend mark), so backward it re-contracts to the touch point and the flame
un-takes — same tween mirrored, nothing spawned or destroyed. The caption flush
reverses per-stroke (ink→graphite).

**8. TRANSITION OUT.** None — the run resumes; the frontier travels with him from here
to B7.

**9. KEEPING.** The lantern ledger starts its visible life here: this is the first
light the audience watches him light, retroactively explaining S1's laid fire (and
prospectively every practical in the film — no unmotivated light anywhere). On the
post: rubbed-bright brass where his hand always lands, one authored glint stroke.
Second-plane. Not one of the four flagships — the thesis image and the flagship
discipline are deliberately separate ledgers.

---

## S3-B4 · t20.71–22.57 · THE CAVE DOOR

**1. ARGUMENT.** *He opens the way before anyone arrives to need it.* Prep as
hospitality: dungeon doors do not open themselves.

**2. MESSAGE.** None on entry; `light1` still holds over this stretch (to 23.0) —
the caption's long hold is authored to make the door and the lantern one thought.

**3. VISUAL.** The follow resumes; he leaves the path (prop 2 sits 2 off-path at
`[13.4, 0.85, -2]`) to the cave mouth: `caveDark` paint + drawn contour (the crossHatch
at world.ts:1941 is dead). He hauls the timber door open on its hinge. The frontier's
edge trails a stride behind him, so the door crosses from pencil to paint *as he works
it* — the reveal and the frontier meet at the prop, which is the "frontier absorbs the
reveal" rule performing per-prop. Inside the mouth: dark, one value step above the
door's shadow side (law 5 — `caveDark` never sits against another near-black).

**4. 3D ELEMENTS.** Cave + door + timber frame (carpentry kit, R; `caveDoor`/`cave`
reveal marks kept, timeline.ts:486). markAlive'd: the door (its slow settle-creak idle
banks on `gobT` — a door he opened stays subtly alive). No new assets.

**5. GOBLIN ACTION.** Run, `speed → 0`, turn, `reach` to the door edge and haul it to
`rotation.y −1.9` (mark kept) — the pull is bodyweight, not arm-wave (the `haul`
posture vocabulary at small amplitude), then back to the path, `speed → 1`.

**6. INTERACTION.** Scroll only. Reverse un-opens the door and hands it back to the
pencil — the audit continues.

**7. ANIMATION.** Master timeline: chain + door swing + reveal. `gobT`: banked door
settle, fire/lantern behind still flickering. No special reverse.

**8. TRANSITION OUT.** None — run continues.

**9. KEEPING.** The door's Prep side keeps a `graphiteLight` **previous swing arc** —
scribed by every earlier opening, exactly the eraser-ghost vocabulary (the register's
example), but here it is *wear*, baked as a graphite arc under the hinge. Second-plane,
scrub-back treasure. Not a flagship.

---

## S3-B5 · t22.57–24.43 · THE CHEST

**1. ARGUMENT.** *Even the reward is authored.* Treasure is not found; it is placed —
the quietest, most subversive product truth in the chapter (encounters are built).

**2. MESSAGE.** None (`light1` un-writes at 23.0–23.4, early in this beat). Carried by
the joke of logistics: the "loot" is stocked like a larder.

**3. VISUAL.** Back on the path (prop 3, hand `[18, 0.4, 0]`): the chest sits at the
verge. He flips the lid; the coins rise into place (`chestCoins` pop, mark kept). The
frontier line is now mid-frame — the shot deliberately holds both truths at once:
painted morning west of the dab edge, pencil east, tide-line pooling along the cut.
This is the run's clearest reading of the frontier as an object.

**4. 3D ELEMENTS.** Chest + judged coins (carpentry kit, R; `chestLid`/`chestCoins`
marks kept, timeline.ts:374–375, reveal at 489). Metal grammar: `gold` by value, matte,
one authored glint stroke on the hoard — no specular. markAlive'd: lid + coins.

**5. GOBLIN ACTION.** Run, stop, turn, `stoop` + `lift` the lid, a satisfied half-beat
(`express('neutral')` — this is routine, not triumph), release, run on.

**6. INTERACTION.** Scroll only. Frame answers via the frontier edge's dab texture
breathing at sub-pixel under the scrub — the one place the "still world" shows its
material grain.

**7. ANIMATION.** Master timeline: lid, coin pop (`PUPPET.pop`), reveal. `gobT`: banked
idles accumulating behind him (fire, lantern, door — three embers of motion now
visible in one frame when the camera glances back west). No special reverse.

**8. TRANSITION OUT.** None — run continues.

**9. KEEPING.** The chest's handled corners carry corner-lightening drybrush (timber
recipe: wear only where hands go) and its Prep side keeps `boxMarks` construction — the
draughtsman's box that built it. Second-plane. Not a flagship.

---

## S3-B6 · t24.43–25.4 · THE RAVENS — the joke

**1. ARGUMENT.** *The world's life is staged too — and he tends it anyway.* The comedy
beat: shooing birds that are already frozen. It also quietly re-teaches the freeze
before the world returns — the audience re-notices time is stopped.

**2. MESSAGE.** None. The joke is the message: he waves at statues, because the job is
the job.

**3. VISUAL.** The perch tree at the path's side, three ravens caught mid-flap in the
graphite ahead of the frontier — already frozen (the world clock stopped at 12.5; the
scatter is scrub-tied position tweens, so they drift apart stiffly, statues on wires).
He shoos them; they scatter-slide up and away in that frozen stiffness (offsets kept,
timeline.ts:378–396). They stay `ravenSlate` — cast tier, never out-chroma-ing him.
The frontier edge stands just west of the perch tree through the gag, so the birds
read as pencil-adjacent even as the morning gains ground.

**4. 3D ELEMENTS.** Perch tree + ravens ×3 (cast tier, R; scatter marks kept). The
ravens are per-mesh already (they move independently) — counted in the ≤40. No new
assets.

**5. GOBLIN ACTION.** Run, stop under the branch (prop 4, hand `[22, 1.62, 0]` — over
his head, so the reach *stays a stretch*, the solved full-extension read), `wave` —
the shoo — then a beat of looking at the un-fleeing birds, `shrug`-adjacent recovery
(`armRest`), run on. `express('strain')` on the overhead reach (mark logic kept).

**6. INTERACTION.** Scroll only. Reverse un-scatters the ravens back onto the branch —
one of the film's best backwards gags, free of charge.

**7. ANIMATION.** Master timeline: reach, wave, scatter tweens. `gobT`: nothing new
banks (he never touches them — the ledger stays honest: only touched things live).
Held: the ravens' wings, mid-flap, throughout. No special reverse.

**8. TRANSITION OUT.** Into B7 on the same run — at t25.4 the world's return begins
(the shipped `drain(25.4, …)` mark, re-purposed: see B7).

**9. KEEPING.** Under the perch tree: droppings-ring and a worn patch where he stands
to shoo them — he does this every night; the birds know him, which is *why* they
wouldn't move even unfrozen. Told entirely in wear. Not a flagship.

---

## S3-B7 · t25.4–26.5 · THE WORLD COMES BACK — morning

**1. ARGUMENT.** *A prepared world becomes a living morning — prep IS the aliveness.*
Product promise #1 lands: the difference between a dead map and a live world is
someone's work, and the visitor just watched all of it.

**2. MESSAGE.** None — the return is wordless on purpose; `light1` said the sentence,
the world now demonstrates it.

**3. VISUAL.** The committed return, staged as the frontier's release: at t25.4 the
seam stops tracking his heels and **races east down the ribbon in one breath**
(~1.2t, `power2.out` — the T_DRAIN_MAX-scale glide re-expressed as seam travel), taking
the remaining graphite with it: verge grass, the far treeline, the signpost and
mushroom patch ahead, out to the island's far cut edge and the paper beyond. No held
partial-curtain frame exists — the experience doc's ban is honoured because the return
is a *spatial* commit, not a global half-drain (this retires v1's uniform
`drain(25.4, 0.25)` hold). `sky` ramps to `skyDay` over 1.0 from 25.6 (v1's mark logic
kept, re-eased); the day key `(4, 6, 3)` warms to full inside the swept territory —
shadows arrive with the colour, everywhere, the lantern rule at world scale. The
camera lifts slightly (elevation to ≈32°) to hold the whole ribbon's morning in one
travelling wide, cut edge and paper low in frame. He runs on ahead, toward the mushroom
patch (its mark starts at 26.29), a small painted figure in a world that finally
matches him. **The world clock does not resume** — the fire flickers, the lantern
breathes (banked, `gobT`), but the ravens still hang and nothing ambient moves: a
painted morning, holding its breath for the t30 exhale that belongs to the next stage.

**4. 3D ELEMENTS.** Nothing new — this beat is pure uniform travel across assets
already staged (the seam release is why the ribbon island was funded as one build:
one frontier crosses everything). `tufts`/`treeline` reveal marks (v1 timeline.ts:515
–516) are subsumed by the sweep and retire.

**5. GOBLIN ACTION.** Run only, `speed 1`, eastward through his own completed morning.
At t26.5 exactly he is mid-stride at x≈26, approaching the mushroom patch's solved
stand point.

**6. INTERACTION.** Scroll only; the world-return rest anchor lands here (experience
§6 S3). Reverse re-pencils the morning east-to-west — the film's biggest single
un-keeping yet, and it must scrub silky (one uniform, one direction — see RISKS).

**7. ANIMATION.** Master timeline: seam release ramp, sky ramp, key intensity ramp,
camera lift — all scrub-tied. `gobT`: gait + every banked idle west of the line.
Held: all untouched ambient (frozen until t30). **Reverse recipe, named:** the release
is one seam-position tween + two colour/intensity ramps on the same timeline span —
reversing replays them mirrored; nothing else may key off "the world is back" (no
boolean flips; the P3-T3 crossfade caution applies at the wire-in).

**8. TRANSITION OUT.** Continuous — the stage ends mid-run at the 26.5 gear change.
No catalog transition is spent. See the handoff contract below.

**9. KEEPING.** Ahead of him, now painted: the mushroom patch shows **a graphite ring
where mushrooms grew last season** (the direction's named whisper — it survives the
sweep because it is an underdrawing-layer mark, and the morning light makes it *more*
legible, not less), and the signpost beyond carries its older nail holes in graphite.
Chapter One exits on next season's evidence. Not a flagship.

---

## HANDOFF CONTRACT at t26.5 (for the S4 author)

State crossing the boundary, exactly:

- Goblin: x≈26 on the path, `speed 1`, heading +x, `express('neutral')`.
- World: fully painted morning, `skyDay` arriving (ramp completes ~26.6), day key at
  full in swept territory. `timeScale` **still 0** — the exhale is the shipped t30 mark
  (timeline.ts:539, `T_FLICK`), yours; the direction's §11 dialect ("resumes exhale,
  0.3t") invites tightening it to `T_EXHALE` — your call, your t-range.
- Banked alive set (on `gobT`): fire2, lantern, cave door, chest lid+coins. Ravens
  frozen mid-scatter (they complete under your first frames; scatter marks end ~26.3).
- Shipped marks in your t-range that are Chapter One's story: mushrooms `segAt` 26.29
  (actionAt ~27.6, pop + `PUPPET.pop`, seeded by `stoop` — the patch's last-season ring
  is already staged), signpost `segAt` 28.14 (actionAt ~29.5, `straighten`d; older nail
  holes in graphite; sign face is scribble-rows, never letters), the t30 exhale + snap,
  the t30–31.5 dash. The seam frontier is **spent and gone** by 26.6 — S4 gets no
  frontier (no radial seam; the turn stages with the seven transitions).
- Caption state: none on screen (`light1` cleared at 23.4); next is your `set1` at 32.6.
- Margin: numeral `C2` (flips to your chapter on your first composed shot's boundary),
  ruler ~40% inked, skip note live.

---

# ASSET BILL — Chapter One

Reuse-from-kit (R) = exists in the shipped kit/register; NEW (N) = authored fresh for
these stages. Techniques per direction §7's rows.

| Asset | R/N | Technique / notes |
|---|---|---|
| Camp island | N | islandKit recipe at set scale: three-band lathe skirt, roots, drawn rim with authored gap, grid ghost; A+B+C |
| Cliff island (S1/S2, = S7's) | N | one asset, two eras of dressing; baked once for the day family, night at reduced key; rock class: 3 quantized tiers, contour-step strata, section bands, climb-edge drybrush |
| Path ribbon island | N | **the big build** — hero island's bakes extend 1:1; ribbon path, verge, 40+ merged flora, cut edges both sides; sets the ≤120-draw ceiling (G1) |
| Campfire kit ×2 (camp + path) | R | fire family: lathe tongues + `buildGlowSprite` + painted cones; Prep side = still graphite teardrop |
| Camp kit (bedroll, pack, spear) | R | cloth/timber recipes; keeping props register |
| Adventurer trio | R | cast tier re-surface: silhouette-first, painted cloaks (`cloakIndigo`×2, `cloakCrimson`), no interior hatch; graphite under any freeze (G6) |
| Arrows ×3 + dropped shield + bolt streak | R | keeping props (S1 remains — same set S7 clears); metal: matte + one glint |
| Ember particles / dust flats | R | particle language, world clock (S1) |
| Cloud/streak flats | R | honest theatre sheets, atmosphere only, graphite edge at any freeze |
| Cliff underdrawing mark set | N | `pencil.ts` primitives: construction ellipses, measure ticks, authored contours — marks, never type |
| **Erased-contour pair** | N | **flagship 1**: committed `graphiteDark` line + rubbed `graphiteLight` ghost with smear direction; one authored framing (S2-B3) |
| Eraser-ghost decal #1 (boulder prior-position ellipse) | N | one of the register's exactly four; `graphiteLight`, plane two of the flagship frame |
| Dust scribble sprite | N | the film's only Prep-side particle; graphite scribble, frozen by construction |
| Travel line wiring | N | `polyline()`/`curveLine()` + `LineSegments2` `instanceCount` ramp (shipped hero mechanism, new call site); un-draws on reverse |
| `seamDir` promotion | N | the funded extension: trilayer.ts:276 + islandKit shadowFrag, one uniform, one dot product; hero byte-identical at default `(1,0,0)` |
| Lamppost | R | hero tier 3, restaged (flame never behind its own post; bracket resolves against paper) |
| Cave + door + timber frame | R | timber recipe; `caveDark` paint + contour replaces the 1941 crossHatch; Prep-side previous-swing arc |
| Chest + judged coins | R | timber + metal recipes; `boxMarks` Prep construction; corner-lightening wear |
| Perch tree + ravens ×3 | R | cast tier; `ravenSlate`; per-mesh (independent movers) |
| Signpost | R | carpentry kit; scribble-row sign face (retires 2147/2189 "letters"); **older nail holes in graphite** |
| Mushrooms (caps in threes) | R | flora signature; last-season graphite ring decal |
| Flora kit stand ×40+ | R | merged per class per island; `silR()` silhouettes, `poster` crowns, `stroke.sheet` |
| Rock kit dressing | R | boulders, outcrop, scree, pebbles — merged |
| Caption letterings: `open1` `open2` `me1–me4` `light1` | N (P6) | the Hand, authored stroke SVGs, same element ids so `cap()` drives them; `light1` carries the graphite→ink flush |

Per-mesh material count this chapter (markAlive/reveal targets): fire2 group, lantern
glass+flame, cave door, chest lid, coins, ravens ×3, mushrooms ×3 (S4's t-range but
chapter-owned), sign board — ≈13 of the film-wide ≤40. Everything else merged.

---

# PHONE PASS — 390×844

Portrait ≤560 rules: figure floor ≥84 px at every acting beat (`GOB_SCALE 0.75` locked;
mechanism order: camera distance → `portraitLook` → drop the wide). Asserted by
`scripts/figure.check.ts` at 390×844, 500×915, 768×917.

- **S1-B1** black + caption: caption clamp verified at 390×844 (copy-spec release rule).
  Nothing else on screen.
- **S1-B2/B3** the aftermath wide + volley: **establishing wides — the chapter's only
  shots below the floor**, licensed by §6. `portraitLook`: recompose toward the cliff
  (party as two foreground shoulders at frame bottom, rim goblin upper third); the paper
  gap between islands is the shot's spine, and it survives the narrow frame better than
  the landscape spread does. He is not acting-primary until the flinches; the flinch
  frames ride the same `portraitLook` and accept the sub-floor read (the volley's
  subject is the converging fire, not his face).
- **S1-B4** the rim: acting beat — `portraitLook` tightens to a rim medium-close (him
  ≥84 px), plateau cropped, paper void kept above. The leap plays taller in portrait
  (vertical drop suits the frame).
- **S1-B5 / S2-B1** landing + get-up: acting — `portraitLook` steps in half a unit;
  ≥84 px comfortably.
- **S2-B2–B5** the address: the push-in's portrait solve lands closer (the
  `compFor`/`BELOW_FRAC` precedent); his face at ≥84 px is trivial here. **The flagship
  erasure must read at 390 px**: the erased pair sits beside his head at the same
  world scale, and the clarity contract's §11.5 QA applies — if the ghost line cannot
  survive 390 px it **demotes to texture at that breakpoint** (direction §6) and the
  flagship carries at ≥500 px; it does not shrink the shot. Caption band + margin hold
  at 390×844 (copy-spec).
- **S3-B1** void crossing: acting-light but he is the only content — portrait
  naturally centres him ≥84 px. Check the void-hop window still contains no island
  pixel at portrait's taller FOV (widen the anchorless span by 0.1t if needed).
- **S3-B2–B6** the run stops: each stop carries a `portraitLook` — a tighter
  three-quarter shot of goblin+prop, island rim and one plane of dressing, not the
  ribbon's whole width ("drop the wide" tier). The travelling connective tissue between
  stops may dip below floor (transit, not acting).
- **S3-B3** the lantern held wide: the thesis image must keep him ≥84 px **and** the
  caption band ≥4.5:1. `portraitLook`: lamppost and goblin stacked vertically (post
  exits top of frame, pool fills the lower half, caption band on the pool's quiet
  outer edge — QA the flush legibility at 390 exactly as §11.5 requires). The full
  ribbon-depth wide plays on either side of the acting, never during (mechanism 3).
- **S3-B7** the return: travelling wide — establishing-class, exempt; the seam edge is
  a full-height event and reads at any width. Islands never touch the viewport edge at
  any breakpoint (islandKit margin rule; drop-shadow tail exempt ≤11% alpha).

---

# ACCESSIBILITY PASS

**Reduced motion** (stepped picture book, motion §14 mapping; live `matchMedia`, no
reload):

- One held composition per beat above (17 stills). Camera rides (push-in, follow,
  lift) become their end compositions; the void hop is a step (no slide to see).
- Write-ons become plain opacity fades at the same marks and durations; no boil
  anywhere (boil is ≤0.8 px UI-side and off under PRM regardless).
- The tick is already a cut — unchanged, and now the house style. The S3 touch reveals
  become steps to the revealed state; the lantern bloom and the B7 release become a
  **two-still sequence each** (before / after) — `A = 0` is *still at the lit pose*,
  never a slowed sweep.
- Banked idles (flame flicker, ember drift) go still at their lit pose; his gait and
  breath still (he steps between poses per beat).
- Soft rests off; page turns become plain cuts (no flash frame); blackout lift becomes
  a stepped fade.

**Screen reader** (the SR document is first in DOM, visually hidden; canvas
`aria-hidden`): the chapter contributes its seven captions verbatim — `open1`, `open2`,
`me1`–`me4`, `light1` — with one-sentence scene descriptions between them (P15 owns
final copy; they describe, in order: the night ambush aftermath; the goblin's escape
and landing; time stopping and the world showing its pencil under-drawing; the goblin
lighting the world back to colour, prop by prop, ending at a lit lantern). Keyboard:
↓/↑ step the chapter's rest anchors (open2 · me1 · me2 · me3 · me4 · lantern ·
world-return), Space play/pause, Esc de-escalates, skip note enters tab order at
t16.5. Contrast: white-on-black for `open1` only; every other caption ink-on-band
≥4.5:1; margin ink ≥3:1 breathed. No camera roll anywhere in the chapter; the volley's
impacts are scale pops, not flashes (vestibular-safe); cuts are single-frame paper,
never smears.

---

# RISKS

1. **The void hop is the chapter's one piece of new spatial machinery.** It must hold
   "no anchor in frame" through the slide window at every breakpoint and in both scrub
   directions, including portrait's taller FOV and reduced-motion's stepped variant
   (where it is a hidden cut — actually *safer*). If it ever shows, the fallback is the
   v1 hard cut at 16.5 dressed as a page turn — but the catalog licenses page turns for
   S1 and the montage only, so that fallback needs a ruling. Flagged, not assumed.
2. **The lantern pool→frontier handoff is the chapter's hardest reversible.** One
   radius uniform handing to one seam uniform at a fixed blend mark, both scrub-tied —
   any implementation that swaps materials or spawns a second mask breaks the reverse
   audit. Prototype early; this is also the site's first use of `seamDir`, and the
   hero must stay byte-identical at the default basis.
3. **Banked idles need `markAlive` semantics on ~13 props.** The flicker terms
   currently read `world.t` (`FLICKER`, Film.tsx) — frozen all stage. Moving touched
   props' idles to `gobT` with amplitude gated by their reveal mask is new wiring;
   budget-wise fine (≤40), but P3-T3's release-pop caution applies: nothing may
   boolean-flip on "revealed".
4. **The S2-out supersession.** This chapter reads the experience doc's "color floods
   back along his walk direction" (S2 Out) as superseded by the direction's seam
   discipline (no frontier in S2, colour only via touch/lantern). If the adjudicator
   meant a literal S2 colour flood, S2-B5 and S3-B1 restage — say so before build.
5. **The 26.5 boundary bisects the shipped run.** Marks kept means mushrooms/signpost/
   exhale land in S4's t-range; if the S4 author stages their theatre establish early
   (at 26.5 sharp), the two prop stops collide with it. The handoff contract above is
   the fix, but it needs the S4 author to accept it explicitly.
6. **Night on a paper page is unproven.** S1's "genuine night" carries entirely in
   dusk air + one warm key on painted surfaces over a light page, with the cliff baked
   for the *day* family. If the night read fails (too pale, or the day-baked shadow
   side contradicts the fire key), the fix lane is intensity/air only — the bake and
   azimuth are law. Judge at the first S1 walk, flat transfer, no grading escape hatch.
7. **The flagship's legibility window is narrow.** An erasure that reads at 1440 can
   vanish at 390 (it demotes by rule) — but if it also fails at ~768 the film's
   flagship-1 argument thins for half of real traffic. Author the ghost line at the
   width the framing guarantees, and QA at 768 as well as the contract's named sizes.
8. **Draw-call ceiling lives here.** The path ribbon island sets the film's measured
   ≤120 budget (G1). The chapter's merged-geometry discipline (one `BufferGeometry`
   per class per island) is what makes it fit — any "just one more separate mesh"
   dressing pass on the ribbon is where the budget dies first. `draws.check.ts` at the
   B3 and B7 cameras is the gate.
