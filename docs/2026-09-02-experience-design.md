# THE PROJECTIONIST'S SEAT — experience design for the Good Goblin story site

2026-09-02 · Companion to `2026-09-02-3d-site-creative-direction.md` ("The Underdrawing").
That doc says what the world is; this one says what the visitor does, sees, reads, and
feels from first byte to Discord click — every stage, message, 3D element, interaction,
animation, transition, and conversion purpose. Copy stays locked per `copy-spec.md`.
Build requires an approved plan; this document is the design.

---

## 1. Experience thesis

**The visitor is the projectionist.** The site is one continuous film that only moves
when they move it. All spectacle routes through a single input — progress — and the
film pays them back for every millimetre. Nothing plays itself, nothing hijacks, nothing
asks for input it doesn't honor instantly.

Five rules govern every decision below:

1. **One input, fully honored.** Scroll (or its equivalents: touch drag, arrow keys,
   the play button) is the only interaction during the film. No mid-film hotspots, no
   hover Easter eggs before the endcard. Agency = control of time, not fiddling.
2. **Never lost, never trapped.** At any instant the visitor can answer: *what is
   this, where am I, how much is left, how do I act, how do I leave.* The margin
   system answers all five without speaking.
3. **One thing at a time.** One subject per shot, one caption at a time, one CTA on
   the whole site. Clarity is a budget; every frame spends it on one point.
4. **Spectacle serves the sentence.** Every wow moment exists to make a specific
   caption land harder. A beat that can't name its sentence gets cut.
5. **The story never blocks the exit.** Skip is offered the moment the premise has
   landed; the CTA is reachable in two seconds from anywhere; leaving mid-film and
   returning resumes cleanly.

**Audience modes served:**

| Mode | Who | What they get |
|---|---|---|
| Lean-in scrubber | Curious player/DM, desktop | Full scrub control, keyboard stepping, replay |
| Lean-back watcher | Phone visitor, tired DM | Play mode: 66s assisted ride, tap to pause |
| Returner | Came back to share / to click | Cover shows *skip to the table*; deep-anchored endcard |
| Skimmer / juror | 20 seconds of attention | Gearing front-loads the claim; skip note at 25%; the die beat is reachable in 3 flicks |

---

## 2. The journey at a glance

Nine stages. No "sections" in the scroll-site sense — stages of one take, plus a
persistent interface layer (§4). Scroll weight is the share of total scroll distance
(gearing, §5.2); it is deliberately not proportional to film time.

| # | Stage | Film t | Scroll | State | The sentence it lands | Conversion job |
|---|---|---|---|---|---|---|
| 0 | The Cover | pre-0 | 0% | Paper | "This is a drawn thing, and it's for people like me." | Arrival, zero bounce-shock |
| 1 | The Claim | 0–10.2 | 14% | Perf. | "…one goblin always gets away." | Hook via shared memory |
| 2 | The Address | 10.2–16.5 | 12% | Prep | "That was me." | Identity; you're backstage now |
| 3 | Proof of Light | 16.5–26.5 | 16% | Prep→Perf. | "Someone has to light the world." | Product promise #1: prep makes worlds alive |
| 4 | Proof of Scenery | 26.5–36 | 12% | Perf.+turn | "Your DM dreams it. I move the scenery." | Product promise #2: scenes are stagecraft |
| 5 | Proof of Time | 36–50 | 20% | Perf.→Prep→Perf. | "You're welcome." | The shareable beat; table magic |
| 6 | The Many Jobs | 50–57.5 | 8% | Perf. cuts | *(silent)* | Breadth without a feature list |
| 7 | The Handover | 57.5–64.5 | 12% | Perf.→flatten | "Now I work for every table." | Category reveal: this world is a map |
| 8 | The Table | 64.5–66→rest | 6% | Board | "The Dungeon Master's backstage." | The click |

**The belief ladder** those jobs climb: attention → recognition ("I've rolled that
ambush") → affection (the goblin) → promise (light, scenery) → delight (time) →
breadth → category comprehension (map editor + live table, zero setup) → action.
Each stage's exit criterion is the belief, not the visuals. If a visitor leaves at
stage N, they leave with belief N — the sheet is ordered so even a 15-second visit
teaches "the goblin that got away runs the world."

---

## 3. Stage 0 — first load and the Cover

> **Superseded 2026-09-02 by `2026-09-02-hero-design.md` (The Half-Alive Island):** the
> Cover's principles below — paper-first paint, the ~2-minute contract, loading absorbed
> in-world, skippability, returners' fast path, the house-lights handoff — all carry
> forward; the still life of wordmark-on-paper becomes a full signature 3D scene.

The film opens on blackout by script — but no site should *arrive* on a black void.
The Cover solves loading, branding, affordance, and expectation-setting in one surface
that costs almost nothing to render.

**Sequence from first byte:**

1. **0–300ms:** Paper. Background `PAPER` + tooth grain (CSS/base64, no network wait).
   No spinner, no white flash, no layout shift, ever.
2. **300–900ms:** The page assembles in graphite — margin ticks draw on (staggered
   120ms dash reveals), then the wordmark writes itself center-page (stroke SVG,
   already inline in the HTML — zero fetch). Beneath it, hand-lettered: *a backstage
   tale, told in one take*. Bottom margin: penciled *~2 minutes* — the single most
   effective abandonment-killer a scroll film can ship.
3. **By ~1.5s:** Two affordances fade in, both drawn objects:
   - **scroll ↓** — the primary, center-bottom; the arrow re-draws itself with the
     2-frame boil; it bobs once every 6s (8px, power2.out) until first input, then
     never again.
   - **play** — small-caps Inscription, bottom-left, ≥44px hit area. For the
     lean-back mode. (No audio exists, so no mute control — one less thing.)
   - Returners (localStorage `gg.seen`, try/catch-guarded) also get bottom-right:
     *been here? skip to the table ↓* in the Quiet Serif.
4. **Behind the paper:** the film streams (§10). The Cover needs none of it.

**Leaving the Cover:** the first scroll (or play, or Space) dims the page to black
over 0.6s — house lights going down; the paper margin stays faintly visible at 4%
ink so the "sheet" never fully disappears. The blackout is now something the visitor
*caused*. Stage 1 begins.

**Head/meta (part of the arrival experience):** title `Good Goblin — The Dungeon
Master's backstage.` · description `Build the maps. Run the table. The goblin does
the rest.` · OG image = the hero poster frame (per the hero doc; the frozen
die-nudge frame stays the in-film share beat and second press still) · favicon = the wordmark's goblin-ears glyph. The SR document (§9) doubles
as crawlable page text.

---

## 4. The persistent interface layer

Everything that isn't the world, in one inventory. All of it lives in the page margin
grammar; none of it ever overlaps a set piece.

| Element | Where | Behavior |
|---|---|---|
| **Page margin + ticks** | Viewport edge, 24–40px | Whisper (≤4% ink) during Performance; breathes to full legibility during every freeze (0.4s). The sheet the world is drawn on. |
| **Chapter numeral** | Top-right margin | Penciled `C1`…`C7`, cross-fades 300ms at chapter handoffs. Orientation at a glance. |
| **Progress ruler** | Bottom margin | 66 fine ticks; passed ticks ink in. Same whisper/breathe rule. Answers "how much is left" wordlessly, precisely, ignorably. |
| **Captions** | Lower-third band, on the margin system | Hand-lettered stroke SVGs; write on stroke-by-stroke ~0.4s, un-write on reverse. One at a time, ever. Hold ≥ max(authored, chars×55ms+500ms). ≥4.5:1 on their band. Graphite in Prep, ink in Performance. |
| **play / pause** | Bottom-left, Inscription small caps | Toggles play mode (§5.3). Swaps to **replay** at the endcard. |
| **scroll hint** | Center-bottom | Cover only; dies on first input, never returns. |
| **skip note** | Bottom-right margin | *skip to the table ↓* — penciled, appears at t16.5 (the premise has landed), or on the Cover for returners. Eases to the endcard in 1.2s (reduced motion: jumps). Hidden during stage 8 (you've arrived). |
| **© line** | Endcard bottom margin | `© 2026 Good Goblin` — Quiet Serif, 4% ink. The only footer. |
| **Cursor** | — | System default. Auto-hides after 2.5s of stillness during play mode (video-player convention); any movement restores it. No custom cursor, no trails. |

The entire layer is DOM (not canvas): crisp at any DPR, selectable, SR-visible,
z-indexed above the film, `pointer-events: none` except the four controls.

---

## 5. Input model

### 5.1 Devices

- **Wheel / trackpad:** Lenis smoothing, scrub ≈0.8s settle. Natural direction only —
  scroll is never remapped, reversed, or held hostage. Total scroll height ≈1400vh
  desktop, tuned so a committed scrub traverses in ~40s and play mode in 66.
- **Touch:** native drag + momentum through Lenis; ≈950vh so the full tale is
  ~10 confident flicks. **Soft rests (touch only):** if momentum dies within ±0.35t
  of a caption anchor, ease to the anchor over 220ms — captions never sit half-written
  on a phone. Cancelled instantly by any input; off on desktop; off under reduced motion.
- **Keyboard:** `Space` play/pause · `↓/↑` next/previous rest anchor (the ~18 caption
  and chapter marks) · `PgDn/PgUp` chapter · `Home` cover · `End` endcard · `Esc`
  pauses play mode. Tab order: SR skip link → play → skip note (when present) → CTA.
- **Focus:** `:focus-visible` renders as a drawn double-line rectangle (the CTA's
  offset-border language), never the browser default ring, never suppressed.

### 5.2 Gearing — the scroll-to-time map

Scroll and film time are deliberately non-linear (see the table in §2). Transit
breathes past; the moments that carry belief get runway. The die beat is 11% of the
film's clock but 20% of its scroll — at full flick-speed on a phone it still occupies
~2 full swipes, so the centerpiece cannot be accidentally skipped. Blackout and
montage are geared tight so impatience is rewarded with story, not with waiting.
Within a stage, mapping is linear; stage boundaries are the gear changes.

### 5.3 Play mode

Play drives the same scrub at 1t/s — the film as a 66-second ride. Grammar: any
manual input pauses it instantly (the human always wins); `visibilitychange` pauses it
(rAF-throttled tabs otherwise desync); it never loops; it ends at the endcard with
focus moved to the CTA (politely: `preventScroll`, no jump). The button is the only
UI that changes label: play ⇄ pause ⇄ replay.

### 5.4 What is deliberately not interactive

The world. No hover states, no clickable props, no parallax-follows-pointer during
the film. Pointer-live surfaces are exactly two — the pre-film hero (read-only
presence: parallax, the goblin noticing you, the almost-touch; per the hero doc) and
the endcard — and the first pointer-reactive *object* is still the CTA, which is the
point: the only thing you can ever touch is the thing the story taught you touching
means (§8). The three micro-interactions from the direction (CTA
touch-light, wordmark ear-perk, hint-die settling on 20) all live at the edges, never
mid-tale.

---

## 6. The beat sheet

Format per stage: **State** (Performance/Prep) · **Camera** · **See** (visual + 3D) ·
**Read** (message) · **Move** (animation) · **Do** (interaction) · **Cut** (transition
in/out) · **Sell** (conversion purpose) · **Guard** (clarity safeguard).

---

### Stage 1 — THE CLAIM (t0–10.2, 14% of scroll)

**State:** Performance (night). **Camera:** black → low wide behind the party →
cliff-rim medium.

- **See:** Blackout, then the ambush aftermath at the cliff base: three adventurer
  silhouettes lit by one campfire (C1's *actual night* — indigo dark, ember drift,
  the film's first proof that light is painted), dropped kit and arrows in the dirt,
  the cliff rising as a dark mass, one small goblin silhouette on the rim. A wizard
  bolt arcs up as a bright painted stroke; arrows thunk into the rock face; the
  goblin flinches. Cut to the rim: he glances down, glances at us, and leaps off the
  back side, dropping out of frame.
- **Read:** `open1` *Every campaign begins the same way…* (white on black, the only
  white-on-black type in the film) → `open2` *…and one goblin always gets away.*
  timed to the leap.
- **Move:** Ambient world clock at full: fire flicker, ember particles, cloth. The
  bolt/arrow impacts are scrub-tied ray-bursts. The leap is a hand-authored arc.
- **Do:** Scroll only. The blackout is geared tight (absorbs slow loaders, §10, and
  impatient scrollers equally).
- **Cut in/out:** House-lights dim from the Cover (visitor-caused). Out: hard cut to
  the cliff base on the landing — the cut hides the fall.
- **Sell:** Recognition. Every D&D player has *been* this party; DMs have run this
  ambush. Self-selection in ten seconds — the visitor knows this site is for their
  table, before any product word.
- **Guard:** Captions on black are the most legible frames in the film; nothing else
  competes. The leap reads in silhouette (no face acting needed at this distance).

### Stage 2 — THE ADDRESS (t10.2–16.5, 12%)

**State:** the first freeze — Prep. **Camera:** base of the cliff's far side, slow
push-in to a direct-address medium close-up.

- **See:** The goblin crumpled in a dust puff, then up, then the dust-off. Mid
  dust-off: **the tick.** The world lifts to its underdrawing — dust hangs as
  graphite scribble, the cliff becomes contour strokes with construction ellipses
  still in place, and beneath the ground, faint as a watermark, *the grid* appears
  for the first time. The goblin stays painted — and casts the only shadow in the
  frame. The margin breathes to full: sheet, ticks, `C1`, ruler.
- **Read:** `me1` *That was me.* → `me2` *You thought I ran away.* → `me3` *I did.*
  → `me4` *Straight to work.* Four short graphite-lettered lines, held in the high
  band (they must clear his silhouette into sky — framing rule, locked).
- **Move:** Only him: weight shift, dust-off, ear settle, one slow blink at *I did.*
  The push-in is scrub-tied and straight (no drift — direct address is dead-center,
  per the composition rule).
- **Do:** Scroll. First soft-rest anchors land here on touch — the four lines are
  the film's first "stop and read" moments.
- **Cut in/out:** In: the tick (instant, same-frame, silence made visible). Out:
  on *Straight to work.* the freeze releases toward the path — color floods back
  along his walk direction, and the skip note appears in the margin for the first
  time (the premise has landed; leaving is now allowed).
- **Sell:** Identity + trust. The brand character exists, addresses you as an equal,
  and has a secret worth staying for. The grid ghost quietly plants the ending.
- **Guard:** Direct address = dead-center framing only here and at *You're welcome.*
  — the rarity is what makes it land. Caption band never crosses the tunic (locked
  contrast lesson).

### Stage 3 — PROOF OF LIGHT (t16.5–26.5, 16%)

**State:** Prep throughout the run; Performance returns at its end. **Camera:**
tracking alongside his run down the path island, one held wide at the lantern.

- **See:** The morning-path island — a winding ribbon diorama with sculpted earth
  edges, the road ending where the pencil line stops. In graphite: 40+ trees as
  underdrawn forms, the cave door, the chest, ravens, the signpost. He works the
  run: opens the cave door, seeds mushrooms, straightens the signpost, scares the
  ravens (they freeze mid-flap — already frozen; the joke is he shoos them anyway),
  and lights the lamppost — **the film's thesis image:** an amber pool blooms
  through the graphite, and every tree it reaches takes its paint back, shadows
  arriving with color.
- **Read:** `light1` *Someone has to light the world.* — timed to the lantern catch,
  the caption's own strokes flushing from graphite to ink as the pool crosses the
  band.
- **Move:** Each touched prop gets a soft expanding reveal (the existing reveal
  grammar): color spreads from the touch point, 0.6–0.9s, power2.out. Touched props
  regain their idle animations one by one — banked embers of motion accumulating in
  a still world.
- **Do:** Scroll. Rest anchors at the lantern and at the world's return.
- **Cut in/out:** In: freeze-release walk from Stage 2 (continuous — no cut; the
  camera simply starts traveling). Out: at t≈25.4 the *world comes back* — full
  Performance floods in one breath (a held partial-curtain frame is banned; the
  return is committed), morning light warming as scripted, and the run crests a
  rise straight into the theatre valley.
- **Sell:** Product promise #1, embodied: prep is what makes a world feel alive —
  light, doors, and dressing are *someone's work*, and the product's whole pitch is
  that this work becomes automatic. Not said; shown.
- **Guard:** One eye-path: the lantern beat is *about* the lantern — chest and door
  get their own camera beats before it, never simultaneous. Density tripled but
  every shot still has one subject.

### Stage 4 — PROOF OF SCENERY (t26.5–36, 12%)

**State:** Performance, with a freeze-flicker inside it. **Camera:** wide raked
angle on the theatre disc, then low behind the goblin at the rope.

- **See:** A forest standing on a visible stage disc — planked, rimmed, unapologetic.
  The goblin heaves a rope; the entire forest **rotates away like a set**, trees
  sliding past each other on their radial rails, revealing the snowy mountain flat
  standing backstage. He waves at it, hops off, keeps running. For one scrubbed
  breath mid-turn, the frame flickers to Prep: the disc's underside shows its
  graphite machinery — capstan, counterweights, rails — then back. Reality has
  rigging, and now you've seen it.
- **Read:** `set1` *Your DM dreams it. I move the scenery.* — during the turn, in
  the lower band, which the disc never enters (the collision in the current build
  is fixed by framing, not by moving the caption).
- **Move:** The turn is scrub-tied 1:1 — the visitor physically drags a forest
  offstage with their thumb. This is the stage where input = spectacle is most
  literal; it must feel *heavy* (turn maps through a gentle ease so the disc has
  inertia against the scrub).
- **Do:** Scroll (= the rope, effectively). Rest anchor after the mountain reveal.
- **Cut in/out:** In: continuous run from Stage 3. Out: he runs past the mountain
  flat's edge — and the camera slips *behind the flats* with him into darkness for
  two beats, emerging inside the tavern: the film's one "walk through backstage"
  door, replacing a cut with a reveal.
- **Sell:** Product promise #2: scenes, travel, and staging are DM stagecraft — the
  product's scene system as theatre. Also the deepest lore beat: the world is
  *built*, which is what the final reveal cashes in.
- **Guard:** The machinery flicker lasts ≥0.8t of scroll (can't be missed at flick
  speed) and ≤1 breath (can't become the point). The turn direction matches scroll
  direction — reversing scroll reverses the forest, which teaches the scrub's power
  better than any tutorial.

### Stage 5 — PROOF OF TIME (t36–50, 20% — the largest share in the film)

**State:** Performance → the long Prep centerpiece → Performance. **Camera:** tavern
establish → table-level close on the die → the nudge in macro → pull back.

- **See:** The film's only interior: the tavern in lamplight pools, patrons
  mid-laugh, the DM's table with screen, mugs, candle — the warmest, densest frame
  so far. The DM rolls. The die tumbles, lands — **natural 1**, readable on its
  painted face. *Tick.* The room lifts to underdrawing mid-laugh: mugs hang tilted,
  a spilled drop stops in the air, candleflames become still graphite teardrops;
  the grid ghosts under the floorboards. The goblin strolls in through the frozen
  room, hops onto the bench, studies the die, looks at us — the film's second
  direct address, closer than the first — shrugs, and gives it the tiniest nudge.
  The die tips in slow scrubbed grace to **20**. He dusts his hands, walks out of
  frame. Time resumes; the cheer finishes as if it never stopped.
- **Read:** Nothing during the freeze — the beat is wordless on purpose (its
  captions were cut in the copy pass; the die's faces do the talking). Then
  `welcome` *You're welcome.* landing right off the flip, as locked.
- **Move:** The wobble on the frozen die stays authored-still (dead still — the
  "held breath" rock was rejected; respect it). The nudge is the most polished
  animation in the film: fingertip contact, 4-frame anticipation, the tip-over
  weighted like a real jewel. The resume is a timeScale ramp over 0.3s — the room
  doesn't lurch awake, it *exhales*.
- **Do:** Scroll, geared long. Rest anchors: nat-1 landing, the look-at-us, the 20.
  On touch, the soft rest at the look-to-camera is the single most engineered
  half-second on the site — every phone visitor stops, eye to eye, exactly once.
- **Cut in/out:** In: through-the-flats walk from Stage 4. Out: `welcome` clears,
  then the film's first **hard cut** — to the montage. The cut grammar changes on
  purpose: proofs are over, tempo now.
- **Sell:** The delight beat and the share beat: "the DM saves the moment" is the
  product's emotional core (drama belongs to the DM), and this is the frame people
  will send each other. Conversion-wise this stage doesn't sell features — it makes
  someone *want to be the kind of DM this goblin works for*.
- **Guard:** The die's numerals must read at phone width (macro framing, painted
  faces, no ambiguity between 1 and its neighbors from the shown angle). The freeze
  entry is silent and instant — any easing would blunt the tick.

### Stage 6 — THE MANY JOBS (t50–57.5, 8%)

**State:** Performance, six hard cuts. **Camera:** one composed shot per vignette.

- **See:** Six island vignettes, ~1.2t each: drawing a road onto the world with a
  pencil the size of a fence post · hanging the tavern sign · planting a tree and
  patting the soil · filling a chest, one coin at a time, judged · walking an NPC
  into a village like a chess piece · lighting the candles down a long table. Same
  goblin, six costumesless jobs — the montage's charm is his identical diligence.
- **Read:** Silent. (The decision is locked, and it's right: after the wordless
  centerpiece, captions here would read as filler.) The chapter numeral ticks
  `C5` and the ruler visibly accelerates — the interface itself communicates
  "montage tempo."
- **Move:** Hard cuts on the beat; within each vignette one loop of one action,
  scrub-tied. Cut flashes are a single frame of paper (not black) — page-turns,
  not blinks.
- **Do:** Scroll; geared tight so the montage *feels* faster than everything before
  it even at constant scrub speed. No rest anchors inside (deliberate — this is the
  one stage that rewards momentum).
- **Cut in/out:** In: hard cut off `welcome`. Out: the sixth vignette's camera
  tilts up from the candle flames to a dawn sky and the cliff in the distance —
  a match-dissolve into Stage 7 (flame glow → dawn gold).
- **Sell:** Breadth without a feature list: roads, encounters, signage, treasure,
  NPCs, lighting — a DM reads six product areas; a player reads one busy goblin.
  Both are correct.
- **Guard:** Six, not ten: each vignette must survive a 0.8s glance. Paper-flash
  cuts keep reverse-scrubbing legible (page-turns run backwards gracefully).

### Stage 7 — THE HANDOVER (t57.5–64.5, 12%)

**State:** Performance → the flatten (a state of its own — the two truths merging).
**Camera:** the angle-echo of Stage 1's rim shot → over-the-shoulder → a straight
vertical rise.

- **See:** The same cliff from the same angle — but tended: remains cleared, a
  cairn, three mushrooms. The bookend reads in half a second (the visual rhyme does
  it, no caption needed). The goblin walks to the rim; over his shoulder, the whole
  world at once — every island of the film arranged below, morning-lit, tilt-shift
  shallow: for one breath it *is* a miniature on a table. The camera rises straight
  up. **The flatten:** islands lie down into their own underdrawings, paint
  refilling as flat map color — trees to illustrated canopies, buildings to icons,
  roads to inked lines, fires to painted flame marks, the grid ghost rising through
  the ground to meet them — the world becoming a Good Goblin map in one continuous
  motion. The goblin, tiny below, pulls out the d20, spins it, and throws it up at
  us. It tumbles toward camera, growing until one face fills the frame: **20**.
- **Read:** `pitch1` *I've built worlds for your DM for years.* on the rise;
  `pitch2` *Now I work for every table.* on the throw. The two most product-forward
  lines in the film sit on its most spectacular sixty seconds — spectacle serving
  the sentence, by design.
- **Move:** The rise is slow, straight, and axis-locked (vestibular safety: no roll,
  no spiral). The flatten is scrub-tied; scrubbed backwards, the map stands back up
  into the world — the most repeat-scrubbed moment on the site, and it must be
  flawless in both directions.
- **Do:** Scroll. Rest anchors at the tended-cairn read and between the pitch lines.
- **Cut in/out:** In: match-dissolve from candle glow. Out: the die face *is* the
  next frame — no cut (the morph, §7).
- **Sell:** The category reveal: map editor and live table are one thing, and the
  film has been an authored map all along. `pitch1`/`pitch2` convert the story into
  the offer. If a visitor screenshots one scroll-position for a friend, gearing and
  anchors bias it to be this one or the die.
- **Guard:** The tilt-shift breath is short (scale-flip is a story beat, not a lens
  toy). Caption band stays clear of the rising horizon; the world below the rise
  must never be asked to carry close-up detail (it reads as composition, saving the
  texture budget where the camera actually goes).

### Stage 8 — THE TABLE (t64.5–66, then at rest, 6%)

**State:** the Board — a real authored Good Goblin map in the product's own art
style. **Camera:** locked top-down; the film is over; the page is now a table.

- **See:** The d20's face morphs edge-to-edge into the board — grid, painted
  terrain, inked roads, the film's world as its map. Over ~1.2t the endcard letters
  itself on: wordmark (with the goblin-ears mark) → hand-lettered tagline *The
  Dungeon Master's backstage.* → Quiet-Serif subline *Build the maps. Run the
  table. The goblin does the rest.* → the CTA, arriving last because it's the thing
  you're asked to do.
- **Read:** The endcard block (locked, direction C — lettered on the board, no box,
  per-glyph paper halos).
- **Move:** Write-on choreography per copy-spec (overlapping staggers, power2.out).
  Scrolling back un-letters it and stands the world back up — the projectionist
  keeps their power to the last frame. At rest: the board breathes at whisper
  scale (≤0.5% zoom drift, 12s period) so the final frame is alive but still.
  Reduced motion: static.
- **Do:** The film's interactivity inverts — the world finally accepts touch:
  - **CTA** — the full spec in §8.
  - **Wordmark hover:** the ears perk once per session, 300ms, settle 500ms. Once.
  - **play → replay:** eases Home (scroll animates back in 1.6s; reduced motion
    jumps); the Cover is skipped on replay (straight to t0's dim).
- **Cut in/out:** In: the morph (no cut — the promise of the whole film kept).
  There is no out. The site ends on the product surface with one action available.
- **Sell:** The click. Everything above this line exists so that this frame — a
  real map, a true tagline, one warm button — feels like *arriving*, not like
  being sold.
- **Guard:** The endcard is the only pointer-enabled overlay surface; the board
  itself does not pan/zoom (it's an ending, not a demo — a demo here would bury
  the CTA under play). Every element passes 4.5:1 against the board via the halo
  system. Nothing below it: scroll ends here, cleanly, no footer to dilute the
  frame.

---

## 7. Transition grammar — the complete catalog

Seven transitions exist. No others may be invented without a name and a rule.

| Name | What it is | Where | Rule |
|---|---|---|---|
| **House lights** | Paper dims to black, 0.6s | Cover→S1 only | Visitor-caused, once |
| **The tick** | Same-frame freeze into Prep; margin breathes in | Every freeze | Instant. Never eased, never announced |
| **The exhale** | timeScale 0→1 over 0.3s + color flood | Every unfreeze | World resumes mid-gesture, never restarts |
| **The touch reveal** | Color/shadow bloom from contact point, 0.6–0.9s | Prep, goblin touches | Grows from the prop's own center |
| **The page turn** | 1-frame paper flash between shots | Montage + S1's two cuts | Paper, never black; reversible |
| **The walk-through** | Camera follows him behind scenery into the next set | S4→S5 | Darkness ≤2 beats; replaces a cut with a reveal |
| **The morph** | d20 face → board, edge-to-edge | S7→S8 only | The one irreversible-feeling move; still scrubs backward |

House ease everywhere: power2.out. Durations 150–400ms for interface, 0.6–1.2s for
world reveals; only the flatten and the rise run longer, and both are scrub-tied.

---

## 8. The conversion spec — one button, fully designed

**Goal:** closed-beta Discord joins. One CTA, no waitlist, no feature list, no
backend, no analytics shipped by default. Success = a visitor who *finished wanting
to be at that table* clicking one honest button.

**The CTA's story:** the film taught one rule for eleven scenes — *what the goblin
touches comes alive.* The button is drawn in graphite, and the visitor's pointer is
the touch. The final interaction is the film's grammar performed by the visitor.

| State | Render | Notes |
|---|---|---|
| Rest | Graphite outline, paper fill, Inscription caps `JOIN THE DISCORD`; second border offset 2–3px, rotated 0.4°, boiling gently | Legible and self-evidently a button even at rest — ≥44px, drawn affordance, never wallflowered |
| Hover / focus-visible | **The touch-light:** warm lantern amber blooms through the letterforms from the pointer-entry side (180ms), contact shadow arrives beneath, offset border re-inks to 0.9° | Focus-visible gets the identical bloom (keyboard visitors get the grammar too) plus the drawn double-line focus rectangle |
| Active (press) | Fill deepens to ink, label to paper; 2px settle | The one "physical" press on the site |
| Click | New tab (`rel="noopener"`), and the die beside the wordmark rolls once to 20 — the send-off | Focus returns intact on tab-return; site state untouched |
| Unset URL | The button does not render; the subline stands alone | A dead `#` CTA never ships. `DISCORD_URL` is the single wired constant (owner: Nayan); the site is not deploy-ready until it exists |

**Secondary conversion paths:** the skip note (margin, from t16.5) is the respect
valve — DMs are busy; jurors scrub; both reach the offer without penalty. Replay is
the advocacy valve — the person who scrubs the die beat five times is the person who
posts it. Neither competes with the primary: both are margin-quiet.

**Measurement:** none shipped (no analytics scripts, no cookies, one localStorage
convenience flag). If instrumentation is ever wanted it's a separate decision:
cookieless stage-depth + CTA clicks would answer everything this design asks.

---

## 9. Accessibility — the film for every body

- **Reduced motion** (`prefers-reduced-motion`): the film becomes a stepped picture
  book — freezes are cuts, write-ons are fades, the boil stops, soft rests off,
  camera rides become held compositions per beat. Every caption, beat, and the CTA
  survive. Play mode steps at the same 66s pacing.
- **Screen readers:** the canvas is `aria-hidden`. A parallel linear document —
  visually hidden, first in DOM — tells the full tale: the twelve captions verbatim
  with one-sentence scene descriptions between them, then the endcard copy and the
  real link. First element on the page: *Skip to joining the Discord*. The film is a
  rendering of the story, not the only copy of it.
- **Keyboard:** full traversal (§5.1), visible drawn focus, no traps, Esc always
  de-escalates.
- **Contrast:** captions and endcard ≥4.5:1 via band/halo systems; interface ink
  ≥3:1 even at whisper states' *breathed* form (whisper states are redundant, never
  sole carriers of information).
- **Vestibular safety:** no camera roll >8°, no spiral moves, FOV fixed at the 70°
  clamp, cuts are instant (no smear frames), the one long vertical (the rise) is
  slow and axis-locked.
- **Color independence:** state changes are never color-only — Prep is also texture
  (graphite strokes), lighting (shadowless), margin (breathed), and motion (stopped).

## 10. Performance, loading, and failure

**Budgets (mid-tier phone, 4G):** first paint <1s (paper+ink are CSS/inline) ·
Cover interactive <2s · film ready <4s · initial JS <300KB gz · full texture stream
<9MB (KTX2 atlases; paint + underdrawing maps packed together so the tick can never
pop) · 60fps desktop / ≥40fps mid phone · DPR cap 2 (1.5 low tier) · one post pass
(the curtain — already true).

**Streaming order:** Cover (inline) → C1+goblin (the first 16.5t) → C2 → onward by
scroll proximity; play mode prefetches linearly. **The blackout absorbs slowness:**
Stage 1 opens on black + type, which needs nothing — on a slow line the film simply
holds the blackout a beat longer, and if C1 still isn't ready after 3s, a penciled
margin note appears: *sharpening pencils…* A stall that stays in-world; no spinner
exists anywhere.

**Tiering:** low tier drops shadows to contact blobs, halves particles, caps DPR
1.5, shortens the boil to static — the grammar survives every tier; only garnish
sheds.

**Failure states:** WebGL unavailable or context-lost twice → **the Picture Book:**
the same page renders eight pre-rendered painted frames (one per stage) with the
captions and the full endcard as plain scrolling HTML — same story, same CTA, also
the SEO/share surface. Context-lost once → silent restore at the nearest rest
anchor. Reload mid-film → resume at nearest rest anchor (never a raw offset: every
restored frame is a composed one, which also retires the stale-first-frame gotcha —
the app must force one full scrub-render before unveiling, behind the Cover).
Resize/rotate → re-clamp FOV, restack portrait staging, preserve t.

## 11. The clarity contract — shippable assertions

Testable, walkable, non-negotiable. The build's impeccable review checks these:

1. At any scroll position, a first-time visitor can state what the site is (margin +
   wordmark), where they are (numeral), how much remains (ruler), what to do
   (scroll/play), and how to act now (skip/CTA reachable ≤2s).
2. One caption at a time; every caption ≥4.5:1, ≥ reading-time hold, never over
   scenery, un-writes cleanly in reverse.
3. Scroll is never remapped or blocked; every animation longer than 400ms is
   scrub-tied; play mode yields to any input instantly.
4. Each stage lands its one sentence with its one subject; any frame with two
   subjects is a bug.
5. The die's faces read at 390px width; the grid ghost stays ≤4% ink; direct
   address happens exactly twice.
6. The endcard passes contrast on a busy board, the CTA is obvious at rest and
   magic on touch, and nothing renders below it.
7. Zero console errors on a full walk, both directions, on the dev grid and a real
   phone (sprint-gate standard).

## 12. Guardrails carried forward

Everything in the direction doc's §14 binds this design: no hatching; painted
textures gated on in-the-moment approval; goblin v2 and all copy locked; the art
bible (extended with material boards) signs off assets; impeccable runs on the built
UI before any release gate; nothing deploys or is published from this design — the
deployment decision remains open and unmade; `story/` stays uncommitted; the build
starts only after its plan is approved.
