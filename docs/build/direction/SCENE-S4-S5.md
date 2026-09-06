# CHAPTER TWO — Stages 4 & 5, staged

2026-09-03 · The proof chapter: PROOF OF SCENERY (S4, t26.5–36) and PROOF OF TIME
(S5, t36–50). Authored under `docs/2026-09-03-world-direction.md` (THE KEPT WORLD —
law), `docs/story.md` (locked), `docs/copy-spec.md` (verbatim),
`docs/2026-09-02-experience-design.md` (inherited beat structure and t-marks),
`docs/2026-09-02-motion-system.md` (clocks, lanes, tokens). Line refs are current
`src/film/world.ts` / `timeline.ts` unless noted. This document stages; it does not
re-time. Every t-mark below that exists in `timeline.ts` today is inherited, not
invented.

**What this chapter must prove.** S4: the world is *built*, and the building is old —
past-perfect tense. S5: he does not just build the room; he saves the night in it —
the intervention. Two of the film's four flagship evidence beats live here: **#2, the
scribed arcs under the stage disc** (S4 flicker) and **#3, the graphite mug rings**
(S5 freeze). No fifth is invented.

**Standing rulings applied throughout (not re-argued):** no hatching; no frontier/seam
anywhere in S4 or S5 (§7 — the S4 flicker and S5 freeze are global curtain flips, the
tick, never a spatial seam); humans freeze graphite, always (G6); the die is the one
object that crosses, at contact, via `reveal()` (G6); `buildFinger`
(world.ts:2888–2918) and `nudgeFinger` (world.ts:3192–3197; timeline.ts:656–676)
retire — the nudge is full-puppet; instancing banned, merge per class per island (G1);
camera elevation 20°–75° in every shot (§6 — this restages the v1 tavern establish at
~10° and the v1 theatre wide at ~15°, both of which sit below the clamp today);
`GOB_SCALE 0.75`, figure floor ≥100 px landscape / ≥84 px portrait at every acting
beat, `portraitLook` second targets per acting beat (§6).

---

## STAGE 4 — PROOF OF SCENERY (t26.5–36, 12% of scroll, chapter numeral C3)

Air `skyOvercast #AAB6C0`, exterior-day key family (+18° azimuth, the shipped hero key
`(4,6,3)`), key flattened near-vertical for this stage, **no practicals** — a theatre
between shows. The set: the **theatre island** — stage disc + backstage apron on one
island card with sculpted three-band edge, roots, drawn rim, grid ghost. v1 geometry
inherited from `buildTheatre()` (world.ts:2591–2884): `stageDisc` at (44, 0, −2), r=7,
top face y=0.3, forest half on local −x; `rope` at (38.5, 0, 1) (world.ts:2800–2881).
v1's mountain-on-the-disc (world.ts:2718–2774) restages as the **backstage mountain
flat standing in a slot** behind the disc, per experience §6 S4 ("revealing the snowy
mountain flat standing backstage") — the turn now *reveals* the flat instead of
carrying it. The disc's vacated +x half is bare planks, dressed by its own keeping
(see B3). Under the disc, always present: the **graphite-only machinery** — capstan,
radial rails, counterweights — dark and illegible under the Performance key, legible
under Prep's flat paper light. No state swap; the flicker is just permission to read
what was already there.

### S4.B1 — THE VALLEY OPENS · t26.5–30

1. **BEAT + ARGUMENT.** The run crests the rise out of the path island; the theatre
   valley opens ahead. The world he lit arrives fully painted (the S3 drain finishing:
   timeline.ts:503; last reveals at 29.1, timeline.ts:515–516; the snap at t30,
   timeline.ts:539–542 — all S3-authored marks, owned by the S3 chapter; this beat
   only frames them). New belief: *the lit world was not the destination — there is
   another set waiting, and the paper between them is where the sets end.*
2. **MESSAGE.** None (`light1` has faded by 23.4). Meaning is carried by geography:
   the path island's rim ends, the travel line draws itself onto bare paper ~1.5 units
   ahead of him, and the theatre island sits ahead as a separate drawn thing.
3. **VISUAL.** Tracking camera continuing S3's run grammar, restaged ≥20° elevation,
   goblin on the right third moving +x. Foreground: the path island's rim and its
   sectioned edge dropping to paper void. Middle: him, running, travel line self-
   drawing. Far: the theatre island — the disc's forest half in silhouette, the kerb,
   the mountain flat edge-on (a pencil-thin vertical line from this angle — invisible
   as a mountain, honest as a sheet). One sheet edge in frame (the wide rule). All
   painted; his contact shadow plus the key's.
4. **3D ELEMENTS.** Path ribbon island tail (S3's asset, shared frame); travel line
   (grammar kit 6, `LineSegments2` instanceCount ramp); theatre island card + apron
   (NEW, set tier); stage disc + kerb (R, re-surfaced world.ts:2594–2629); forest on
   disc — ~8 trees from the flora kit + 2 stumps + 3 boulders + fallen trunk (R,
   world.ts:2632–2716), merged one `BufferGeometry` per class as disc children;
   mountain flat (R-reshaped, edge-on); rope coil (R, world.ts:2800–2881); machinery
   set (NEW, graphite-only, occluded/dark at this range). Nothing markAlive'd here but
   the goblin.
5. **GOBLIN ACTION.** Run (gait via `applyGait`, speed 1), on the path line, exits the
   path island onto the travel line toward the rope. No prop contact.
6. **INTERACTION.** None — scroll only. The frame answers input by the travel line
   drawing/un-drawing exactly with the scrub and the ruler ticks inking past t26.5.
   Skip note stands in the margin (since t16.5). Chapter numeral still C2 (flips at
   31.5 with the sky).
7. **ANIMATION.** Master scrub: his root position, the travel line ramp, camera rail
   (settle lane, power2.inOut). World clock: nothing ambient here by design — the
   lantern ledger says untouched ground is still. gobT: gait/breath, never stops.
   Reverses cleanly by construction (line un-draws behind his heels).
8. **TRANSITION OUT.** The exhale (inherited, S3's tail): `timeScale → 1` in `T_FLICK`
   at t30 + `snapBack(30)` (timeline.ts:539–542). No cut, no cost — same take.
9. **KEEPING.** The travel line lands on a rubbed track entering the theatre island's
   edge — cart ruts that stop where the pencil line stops (§3, "his commute").
   Second-plane, discoverable. Not a flagship.

### S4.B2 — THE STAGE, WIDE · t30–31.5

1. **BEAT + ARGUMENT.** The stage's establishing wide: a forest standing on a visible
   planked disc, unapologetic. Dash to the rope (timeline.ts:545), camera settles wide
   (timeline.ts:546), sky eases to `skyOvercast` and the numeral cross-fades C2→C3 at
   31.5 (timeline.ts:547). New belief: *this forest is scenery. The world is staged.*
2. **MESSAGE.** None. The meaning is the kerb: the moment the eye finds the disc's rim
   and kerb under the trees, the sentence has landed without a word. `set1` is
   deliberately held for the turn itself.
3. **VISUAL.** The stage's one true wide (exempt from the figure floor — the acting
   beats sit on either side, per §6 mechanism 3). Camera restaged from v1's
   [31.5,4.5,6]→[42,1,−2] (~15° elevation) up to ≥20° — indicatively [30.5, 7.2, 7]
   → [42, 0.6, −2] — leaning over the maquette. Foreground: the rope's ground coil and
   feed line, island rim entering frame (sheet edge rule). Middle: the disc — planked
   painted stage, kerb, forest half toward us. Far: the bare +x half of the disc, the
   mountain flat edge-on behind it, paper beyond ramping in-material to `paper`. Flat
   grey key, soft; his shadow and the trees'. Island rim clear of viewport edges at
   every breakpoint.
4. **3D ELEMENTS.** As B1's theatre list, now at frame scale. Disc planks re-surfaced
   with the timber recipe (floorboard-family bake, ruled silhouette kept, paint
   supplies tone — kills hatch sites world.ts:2628/2670/2689/2759); kerb with 16
   radial plank lines inherited (world.ts:2605–2629). Rope: catenary + 6 strand wraps
   + knot + 3 frayed strands + 3-loop coil (R, re-surfaced fibre-streak timber-class
   bake). Merged geometry throughout; no per-mesh materials yet.
5. **GOBLIN ACTION.** Dash x→38.5 over 1.5t (timeline.ts:545), arriving at the rope's
   feed line. He is small in this wide — legal, he is not acting yet.
6. **INTERACTION.** None. Responsiveness: the dash is scrub-tied — flick-scrollers see
   him arrive fast; the disc looms at exactly scrub speed.
7. **ANIMATION.** Master scrub: dash, camera settle (settle lane), sky grade
   (`sky()`, scrub-tied). World clock: nothing — no practicals in S4, the overcast
   air is still by design. gobT: gait. All reversible as-is.
8. **TRANSITION OUT.** None — same shot; he takes the rope. Camera holds.
9. **KEEPING.** The kerb is **worn where the rope runs** — drybrush on the kerb throat
   the rope has crossed for years; the coil sits on a rubbed patch of plank. Plane
   two. Not a flagship.

### S4.B3 — THE HAUL · t31.5–35 (contains B4)

1. **BEAT + ARGUMENT.** He hangs his weight off the rope and the entire forest rotates
   away like a set — trees sliding past each other on the turning disc — revealing the
   snowy mountain flat standing backstage. Inherited marks: speed→0 at 31.5
   (timeline.ts:554), `haul` 31.5+3.0 (timeline.ts:555), disc `+= π` over 2.5s
   power2.inOut at 32.0 (timeline.ts:559) with the locked 0.35 s input smoothing,
   rope working in 12 organic yoyo pulses (timeline.ts:560–564), settle at 34.5
   (timeline.ts:566). New belief: *a scene change is physical work that someone does.*
2. **MESSAGE.** `set1` — **"Your DM dreams it. I move the scenery."** — verbatim,
   cap at 32.6 hold 2.0 (timeline.ts:557). Enters as the Hand: authored stroke SVG,
   written on stroke-by-stroke ~15 strokes/s, lower-third band, ink (Performance).
   Un-writes on reverse. During the B4 flicker its strokes flush ink→graphite via the
   200 ms per-stroke colour crossfade (the `light1` grammar, run off the curtain
   value — the narration obeys the curtain, ownable-five rule) and flush back on the
   exhale. Leaves by `T_BEAT` fade, clear by ~35.0. The disc never enters the band —
   held by framing (experience §6 S4, locked).
3. **VISUAL.** The acting medium: camera drops to low-behind-him at the rope — ~20–22°
   elevation, over his shoulder — rope running up-frame into the disc. Foreground: the
   rope and him (≥100 px landscape). Middle: the disc turning, trees sliding past each
   other (near-edge trees track right, far-edge left — the rigid turn does the
   sliding; no differential rigging needed). Far: the bare half swinging toward us,
   then the mountain flat resolving from a pencil edge into a standing sheet of
   reserved-paper snow. Sheet edge: the island rim at frame bottom. Caption band
   below, clear.
4. **3D ELEMENTS.** As B2. The mountain flat (R-reshaped: v1's 3 peaks + snow caps
   silhouette re-cut as one flat sheet in a slot): **reserved-paper snow** — the page
   showing through, blue-grey shadow strokes, drawn windward edge, barely painted
   *because nobody has played there yet*. Machinery (NEW, graphite-only) turning under
   the disc — capstan and counterweight boom rotation slaved to `stageDisc.rotation`,
   same tween target, so it works whenever the disc works. The rope is **markAlive'd**
   (one per-mesh material) — see B4 for why.
5. **GOBLIN ACTION.** `haul` (actions.ts:412): rear leg rolled onto its toe, front leg
   braced, pelvis back, chest counter-rotated, two pulls not one drag — practiced, no
   hesitation (§11: keeping gestures are the choreography). He stands on the rubbed
   patch beside the coil. He touches: the rope only.
6. **INTERACTION.** The stage where input = spectacle is most literal: **the scroll is
   the rope.** The turn maps 1:1 through the 0.35 s smoothing so the disc has inertia
   against the thumb; reversing scroll reverses the forest — the film's best scrub
   tutorial, offered silently. Rest anchor at `set1`. Nothing clickable.
7. **ANIMATION.** Master scrub: haul pose tweens (puppet lane), disc rotation +
   machinery (scrub-tied via smoothing), rope pulses (`PUPPET.organic` yoyo), caption
   write-on, camera move (settle lane). World clock: idle. gobT: gait amplitude at
   speed 0 is exactly 0 by construction (actions.ts:25–27) — the pose owns him.
   **Must be flawless in both directions** (§11 names the disc turn); the smoothing
   plus pure tweens make reverse the identical motion mirrored. No special recipe.
8. **TRANSITION OUT.** Contains B4 (the tick, below). After the settle at 34.5,
   continuous into B5 — no cut.
9. **KEEPING.** The rubbed patch where he always plants his feet to haul (§3 —
   "a rubbed patch where he always lands"); the kerb-throat wear running under the
   moving rope. Plane two. The flagship is B4's.

### S4.B4 — THE FLICKER · t33.1–34.3 (inside B3) — FLAGSHIP BEAT 2

1. **BEAT + ARGUMENT.** Mid-turn, for one scrubbed breath, the frame flickers to Prep:
   the paint lifts off the world and the disc's underworld shows its graphite
   machinery — capstan, radial rails, counterweights — still turning under his pull.
   The push-in reads the **scribed arcs worn into the under-disc**: concentric arcs
   ground into the graphite bed beneath the disc rim where the wheels and the
   counterweight boom have swept for years — ten thousand swings in one mark — and one
   arc that overshoots and stops, a turn once taken too far. New belief: *the
   machinery is old because it has always worked. Reality has rigging, and someone has
   been operating it for years.*
2. **MESSAGE.** None new — `set1` is up and holding, flushed to graphite for the
   flicker's duration (see B3.2). The meaning is carried entirely by the marks: the
   arcs are `pencil.ts` stroke primitives, never lettering, never captioned. Evidence
   whispers.
3. **VISUAL.** The flagship's one authored framing, inside its own freeze (§6): the
   tick fires, then a slow straight push-in (the push the flicker already carries)
   from the B3 medium down toward the kerb gap — ~20° elevation, the minimum the bench
   clamp allows, looking into the shadowless paper-lit slot under the disc rim. To
   make the sightline honest the disc rides on visible graphite blocks (the machinery
   set's rail trucks), opening a legible gap. Foreground: the kerb rim as occluder
   (evidence plane two). Middle: capstan, rails, counterweights — drawn, working.
   On the bed: the arcs, at reading scale at the push's deepest point. Far: the
   underside dark kept one value step above `caveDark` accents (colour law 5). The
   goblin stays painted at frame edge, rope in hand; **the rope stays painted with
   him** (markAlive'd — he has touched it, colour law 1's "the alive") — one warm line
   running from the only painted figure into the graphite machinery: his work is what
   animates the drawing. His contact shadow is the only shadow (Prep casts none;
   `rig.aliveShadow`).
4. **3D ELEMENTS.** Machinery set (NEW: capstan drum + spokes, 6 radial rails, 2
   counterweight booms + weights, 4 rail trucks/blocks — all graphite ramp, stroke
   primitives + tone, the film's one asset with no paint side). Scribed-arc mark set
   (NEW: 3–4 authored `polyline()`/`curveLine()` arcs, graphite/graphiteDark, plus
   the one overshoot arc). **Eraser-ghost decal #2 of 4** (NEW): a tree's prior
   position ellipse in `graphiteLight` on the disc's bare half — the forest was once
   dressed differently. Everything else as B3, rendered by the trilayer's Prep side.
5. **GOBLIN ACTION.** He keeps hauling — the haul does not pause for the flicker (gobT
   never stops; the pose tweens are timeline-owned and the scrub is still moving). He
   is the frame-edge anchor, not the subject; the machinery is the subject. One
   eye-path.
6. **INTERACTION.** None. The responsiveness IS the beat: the visitor's own scroll is
   still turning the disc while frozen — the one thing that moves in the freeze is the
   thing their thumb drives. Guard honored: the flicker spans 1.2t of scroll (≥0.8t —
   cannot be flicked past; ≤1 breath — cannot become the point).
7. **ANIMATION.** The tick at 33.1: `world.timeScale → 0` in ≤0.15t + curtain → 1 in
   0.35t power2.out, same cue (motion §12 recipe — trivially cheap here, nothing
   ambient runs in S4 anyway; the flip is for the *material* truth). Margin breathes
   in `T_BEAT`. Push-in t33.15–34.1, straight-line, settle lane, scrub-tied. Exhale at
   34.3: timeScale → 1 in `T_EXHALE`, curtain back down, camera eases back up to the
   B3/B5 medium over 34.3–34.9. Disc + machinery: scrub-tied throughout, unaffected
   by the freeze. Reverse: all tweens; the curtain pair and camera A→B→A mirror
   exactly. The `tl.set` pairs for margin state sit ≥0.02t apart (scrub-safety rule).
8. **TRANSITION OUT.** The exhale (named), at t34.3. Cost: none — no assets created or
   destroyed, no bakes, no cut; two curtain tweens and a camera return.
9. **KEEPING.** **FLAGSHIP BEAT 2 — the scribed arcs.** Supporting cast: the machinery
   wear (rubbed capstan grip where hands go — rock-rule logic on timber), the tree
   ghost ellipse, the mountain flat's graphite brace and slot visible at the freeze
   (backdrop flats are honest theatre sheets, §10). This is the stage's earned
   evidence; everything else stays second-plane.

### S4.B5 — THE WAVE · t34.5–36

1. **BEAT + ARGUMENT.** Turn complete; the mountain flat stands revealed in reserved-
   paper snow. He settles (timeline.ts:566), turns from the hips to find the camera
   line (34.9, timeline.ts:571), waves at the mountain from the wrist (35–36,
   timeline.ts:572), turns back and runs (timeline.ts:573–574, 582). New belief:
   *he has done this ten thousand times — it is courtesy between coworkers; he waves
   at scenery.* Rest anchor: mountain-reveal.
2. **MESSAGE.** None — `set1` has cleared by 35.0. The wave carries the whole beat:
   affection for the work, zero ceremony.
3. **VISUAL.** Medium on him at the rope, ~24° elevation, mountain flat behind and to
   frame right — barely painted, reserved paper shaped by blue-grey shadow strokes,
   drawn windward edge, visibly a sheet in a slot. Foreground: rope coil. Middle: him
   (acting beat — ≥100 px landscape, `portraitLook` tighter two-shot of goblin +
   flat on portrait). Far: bare disc half + paper. Sheet edge: island rim, frame
   bottom left.
4. **3D ELEMENTS.** As B3. Nothing new. Machinery again dark/illegible (Performance
   key) — the secret closes.
5. **GOBLIN ACTION.** `settle` (actions.ts:274) → hip turn → `wave` (actions.ts:444,
   from the wrist, weight on one leg) → turn to +x, `express` neutral, speed→1, run
   toward the mountain flat's edge (x→46.5 across the disc top at y 0.3,
   timeline.ts:582–596 — the dodge around the old peak at (41,−2) retires with the
   mountain's restage; the run line is re-authored straight across the bare stage,
   same marks, same target).
6. **INTERACTION.** None. Rest anchor after the reveal (soft-rest eligible on touch).
   The frame's responsiveness: reversing here runs the whole theatre backwards —
   forest returns, flat hides.
7. **ANIMATION.** Master scrub: all acting (puppet lane pose tweens), camera hold then
   trail. World clock: still idle. gobT: gait resumes at speed 1. Clean reverse.
8. **TRANSITION OUT.** **The walk-through** (S4→S5, the catalog's one use of it)
   begins as he crosses t36 — see S5.B1. Cost at this end: none yet; the theatre set
   stays up until 38 (`onlyFor(world.theatreSet, 16.5, 38)`, timeline.ts:152).
9. **KEEPING.** Keeping-by-absence: the mountain is barely painted **because nobody
   has played there yet** (§7 snow row) — the flat is the register's proof that paint
   in this world is accumulated play. The bare disc half carries the tree ghost. Not
   a flagship; the stage already spent its flagship in B4.

---

## STAGE 5 — PROOF OF TIME (t36–50, 20% of scroll — the film's largest share, chapter numeral C4)

Air `skyHearth #D4B184`, **the interior key family** — the film's one azimuth move,
+38°, hearth key `(2.6, 3.2, 1.1)` — hearth and candle practicals carry the room, key
demoted, dark corners kept. The set: the **tavern interior shell** (island 5) — v1
`buildTavern()` geometry (world.ts:2921–3388) re-surfaced on its own island card:
cutaway room, open side facing +z, sized against `MAX_PULLBACK 2.2` by construction
(RECON: 14-unit walls, 22-unit floor — shrink either and portrait sees outside the
set). Retirements executed by this stage: window crossHatch → **the real view of the
undrawn world through the glass** (world.ts:3018); firebox crossHatch → painted dark
+ coals (world.ts:3059); bay hatch 3001, table-wear hatch 3131 → drybrush, sheets
3249 and screen 3277 → authored scribble rows; `buildFinger`/`nudgeFinger` deleted
(with the crease hatch at 2914); the v1 goblin hide/park sets (timeline.ts:601–610,
646) retire — he is IN this scene now.

### S5.B1 — THE WALK-THROUGH · t36–38

1. **BEAT + ARGUMENT.** He runs past the mountain flat's edge and the camera slips
   behind the flats with him — darkness ≤2 beats — emerging inside the tavern on an
   exposure crossfade. No cut (the catalog's walk-through, its only use). New belief:
   *backstage connects everything; the sets are one workshop and he commutes through
   its walls.*
2. **MESSAGE.** None. In the dark, the margin is the only legible thing (sheet, ticks,
   ruler) — the interface holds the visitor's hand through the one dark corridor in
   the film. Numeral cross-fades C3→C4 in the darkness; `skyCut` grade lands with it
   (timeline.ts:611, retimed art-side only: the grade crossfades under darkness
   instead of on a hard cut — same mark, t38).
3. **VISUAL.** Camera low and trailing him (inherited framing intent,
   timeline.ts:597, lifted to ≥20°). He crosses the bare disc, passes the flat's edge;
   its braced graphite back wipes the frame (a near-black silhouette plane — Prep
   depth language: a shape in front of the drawing). Darkness t≈37.2–37.9 — not
   black, a `caveDark`-adjacent held tone with the margin breathing. Exposure
   crossfade t≈37.8–38.1 opens on the tavern establish (B2's frame). Behind the
   glass of the crossfade the sets swap.
4. **3D ELEMENTS.** Exit side: as S4.B5. Entry side: the full tavern (B2 list). The
   flats' backs: 2 graphite brace cards (part of the mountain flat asset — honest
   theatre). Set swap under darkness: `onlyFor` triads — theatre out at 38
   (timeline.ts:152), tavern in at 38 (timeline.ts:160).
5. **GOBLIN ACTION.** Run, speed 1, straight line past the flat's edge; the camera
   follows HIM into the dark — then he peels off frame during the crossfade: when the
   tavern opens, he is NOT in shot (he is "outside" by the door, off frame-left,
   staged at the door's side of the room, invisible until B4). The scene must open on
   the table, not on him.
6. **INTERACTION.** None. A visitor who parks mid-darkness holds a composed dark frame
   with a breathing margin — never a broken one (held-frame QA case, motion §4).
7. **ANIMATION.** Master scrub: his run, the camera rail, the exposure crossfade (a
   scrub-tied opacity/grade pair, `tl.set`s ≥0.02t apart), the set-visibility triads.
   World clock: the tavern's ambient life (hearth flicker, candle, patron sway) fades
   in with the crossfade, riding `world.t` at timeScale 1. gobT: gait. Reverse:
   the crossfade mirrors; the sets swap back via the triads (they un-set themselves —
   the shipped pattern, timeline.ts:129–139).
8. **TRANSITION OUT.** None — B1 *is* the transition; it ends standing in B2's
   establish. Cost: theatre set hidden, tavern shown; S6's class bakes get kicked
   during S5 idle per G2 (this stage has the film's longest runway — use it).
9. **KEEPING.** The flats' braced backs — the world's stagecraft admitted in graphite
   for two beats. Second-plane. Not a flagship.

### S5.B2 — THE ROLL · t38–40.6

1. **BEAT + ARGUMENT.** The film's only interior, the warmest and densest frame so
   far: lamplight pools, patrons mid-laugh, the DM's table — screen, sheets, mugs,
   candle. The DM rolls; the die tumbles (marks inherited exactly: tumble+bounces
   t38–40, timeline.ts:614–628), the camera comes in WHILE it rolls (38.3–39.8,
   timeline.ts:635) and it settles on a **natural 1**, readable on its painted face.
   Rest anchor: nat-1. New belief: *the whole night hangs on one number, and the
   number came up wrong.*
2. **MESSAGE.** None — `nat1` was cut in the copy pass; the die's face does the
   talking (its painted numerals are the caption). The freeze coming is unannounced.
3. **VISUAL.** Establish (t38–38.3, restaged ≥20°: indicatively [80, 4.8, 6.4] →
   [80, 1.1, 0.4], ~28° — v1's [80,2.1,6.2] at ~10° violates the bench clamp):
   foreground the table's near edge, middle the die landing zone + DM mid-throw
   behind the screen at far-left, far the hearth right / window left — through the
   glass, **the undrawn world in pencil**: graphite path and trees where the room's
   paint stops. Then the inherited dive to the die close ([80.42, 2.42, 1.5] →
   [80, 1.28, 0], ~37°, timeline.ts:635) — die large, numerals unambiguous (1 vs its
   neighbors QA'd from this exact angle, clarity contract §11.5). Candle pool warm;
   hearth glow on the world clock.
4. **3D ELEMENTS.** Tavern shell (R: floor+walls+framing, world.ts:2929–3002); window
   view set (NEW: muntin frame R world.ts:3004–3037 minus the night fill, no glass
   material — an opening; behind it 2 graphite diorama cards of the undrawn world,
   Prep-side rendering permanently, never takes paint); hearth + firebox painted
   dark + coals (R, world.ts:3039–3082) with `buildFlames` tongues on the world
   clock; shelf + 5 bottles (R, 3084–3105); table (R, 3107–3144) with the NEW wear
   bake (drybrush + the mug rings, see B4); **the d20** (R geometry, dieGeometry.ts +
   die.check; jewel re-surface: `dieBone` gouache, painted numerals, worn edges, one
   authored glint stroke, per-mesh material — a `reveal()` target); DM + 2 players
   (R, 3199–3214, silhouette-first re-surface, painted cloaks, no interior hatch);
   patrons ×3 (R from the adventurer family, at the tankard table, 3282–3296); mugs
   ×3 + sheets ×3 + screen (R, 3216–3280 — sheets and screen in scribble rows; **the
   screen's outward face carries map art** — see B3.9); candle (R, 3298–3338, ray
   burst retired, amber glow sprite grammar); benches ×3 (R, 3340–3360); door (R,
   3362–3385). All merged per class; per-mesh: die only (plus goblin).
5. **GOBLIN ACTION.** Absent from frame (staged off frame-left by the door). The DM
   acts: one authored arm-swing releasing the die at 37.9–38.2 (cast-tier acting,
   puppet lane — the cast may act; it may never out-chroma him).
6. **INTERACTION.** None. Rest anchor at nat-1 (~40.2). The gearing is long here —
   at full flick speed this stage still spans ~2 swipes; the centerpiece cannot be
   accidentally skipped (experience §5.2).
7. **ANIMATION.** Master scrub: die tumble/bounce/settle tweens (SETTLE.heavy —
   authored inertia, re-judged for weight in the jewel pass), camera dive, DM throw.
   World clock: hearth flicker, candle, patron sway, spill-drop *not yet* (see B3).
   gobT: idle offstage. All reversible; the die's rotation set at t38
   (timeline.ts:627) pairs with its tween per scrub-safety.
8. **TRANSITION OUT.** **The tick** (t40.6) — into B3.
9. **KEEPING.** The room itself is the evidence in second plane: table drybrush where
   forearms have rested for years, candle drip stack, hearth scorch as painted dark
   pooling, bottle shelf rubbed at grab height. None of it eye-path; the die is the
   subject. Not a flagship.

### S5.B3 — THE TICK · t40.6–41.3

1. **BEAT + ARGUMENT.** *Tick.* Absolute freeze, instant, unannounced
   (timeline.ts:644): the room lifts to underdrawing mid-laugh — mugs hang tilted, a
   spilled drop stops in the air, candleflames become still graphite teardrops, the
   patrons and players and DM freeze into graphite with everything else (G6 — both
   parties, always), the grid ghosts under the floorboards. The margin breathes to
   full. New belief: *time is a thing someone can hold.*
2. **MESSAGE.** None — the freeze is wordless by decision (copy pass); silence made
   visible is the message. What carries meaning: the graphite flip + the stopped
   drop.
3. **VISUAL.** The tick lands in the die close-up; then a slow straight dolly back
   (t40.75–42.2, settle lane, scrub-tied) opens the **freeze's authored flagship
   framing** — table-level medium, ~24°: near plane the tabletop's near edge at
   reading scale (the mug rings, B4), middle the graphite die on its 1 and the empty
   bench, far three graphite figures caught mid-laugh, the hearth's drawn teardrop
   flames, the window's pencil world now continuous with the room (outside and inside
   agree at last — the room was the exception). One deliberate persistence: **the DM
   screen's map face stays painted inside the freeze** — a map is already both
   drawing and paint, so it renders identically in every freeze (§7, the third
   truth). Plane four, discoverable, planting S7/S8.
4. **3D ELEMENTS.** As B2, flipped to Prep by the curtain. Spill-drop prop (NEW: 2
   painted droplet flats + a tabletop splash decal, Performance-side particles frozen
   by construction — but its *fall* is timeline-authored, see B8.7). Grid ghost at
   ≤`GRID_INK` under the floorboards. No practical glow: glow dies with the paint
   (`rigs.ts:143`).
5. **GOBLIN ACTION.** None yet — one beat of held, empty, frozen room. The pause
   before he enters is the joke's setup.
6. **INTERACTION.** None. The margin breathe answers the freeze (`T_BEAT` at +0.1t);
   the ruler and numeral are at full legibility — the interface reads the file with
   you.
7. **ANIMATION.** The tick recipe verbatim (motion §12): `timeScale → 0` in ≤0.15t +
   curtain → 1 in 0.35t power2.out, same cue — this wires the v1 drain
   (timeline.ts:645) onto the named recipe and closes P2-T4 for this beat. Camera
   dolly scrub-tied. Everything world-clocked stops same-frame by construction.
   gobT never stops (he breathes offstage). Reverse: exact mirror.
8. **TRANSITION OUT.** None — the freeze holds for 6.4t (t40.6–47). B4 enters it.
9. **KEEPING.** The freeze IS the file opening (core concept: "the freeze is when you
   are allowed to read the file"). The screen's persistent map face and the grid
   ghost — the oldest layer — are this beat's receipts. Flagship read comes next.

### S5.B4 — HE STROLLS IN · t41.3–42.6 — FLAGSHIP BEAT 3

1. **BEAT + ARGUMENT.** The goblin strolls into the frozen room — one painted figure
   walking through graphite people, casting the only shadow in the room (G6: "that is
   the shot") — crosses to the table and hops onto the bench. In the same held
   framing, the near plane carries the **graphite mug rings** worn into the tabletop:
   years of game nights under one roll. New belief: *this room has hosted years of
   the game he is about to rescue — and he is the one who kept it.*
2. **MESSAGE.** None. The rings are marks, not type (`pencil.ts` ellipse strokes in
   the graphite ramp, baked into the table's wear layer); they never caption
   themselves. The meaning is carried by contrast: painted goblin / graphite world /
   only shadow.
3. **VISUAL.** The flagship's one authored framing (held from B3): near plane —
   tabletop near edge, three overlapping mug rings at reading scale plus one fresh
   mug standing slightly off its own ring (the ring outlives the mug); the rings ride
   the foreground element, never the subject (§6 evidence rule). Middle — the die,
   the bench, and him entering frame-left through the door, walking the floorboards
   between graphite patrons. Far — the frozen laugh, hearth, window. His shadow
   sweeps the boards as he crosses — the frame's only moving shadow
   (`rig.aliveShadow`, world casters released at the fully-drawn page, §8).
   Figure floor: ≥100 px landscape, `portraitLook` re-frame on portrait (tighter on
   his path, rings still in the near plane; if 390 px cannot hold both, the rings
   demote to texture at that breakpoint — the shot does not shrink, §6).
4. **3D ELEMENTS.** As B3. Table wear bake (NEW, part of the table re-surface): mug
   rings + forearm drybrush + one repair patch a single value step off (colour law
   4). **Eraser-ghost decal #3 of 4** (NEW): the door's previous swing arc in
   `graphiteLight` on the boards at the door he enters through — the door was once
   hung the other way. Bench top: rubbed-paint patch where he lands (§3).
5. **GOBLIN ACTION.** Enter through the door (frame-left), stroll — unhurried gait,
   speed ~0.6 — along the table's far side, **`hop`** onto the bench (NEW verb,
   puppet lane, actions.ts — mandated by the §11 buildFinger retirement; the one verb
   this chapter adds), landing on the rubbed patch. He touches nothing yet.
6. **INTERACTION.** None. Responsiveness: scrubbing back walks him out backwards and
   re-seals the room — the projectionist can audit the entrance.
7. **ANIMATION.** Master scrub: his path + hop (puppet lane; the hop gets the leap's
   hand-authored-arc treatment), camera dead still (the held framing is the
   flagship). World clock: frozen. gobT: gait/breath live — he is the only alive
   thing, by construction. Reverse: clean; the hop reverses as a hop-down (author
   the arc symmetric — no special recipe needed).
8. **TRANSITION OUT.** None — continuous into B5; the camera begins its one push at
   B5's midpoint.
9. **KEEPING.** **FLAGSHIP BEAT 3 — the graphite mug rings**, framed inside the
   freeze at reading scale, QA'd at 390 px (§6, §11.5). Supporting cast: the door's
   swing-arc ghost, the bench's rubbed landing patch, the fresh mug off its ring.

### S5.B5 — THE LOOK · t42.6–43.7

1. **BEAT + ARGUMENT.** On the bench, he studies the die. Then he looks at us — the
   film's second direct address, closer than the first — and shrugs. Rest anchor:
   look-at-us (on touch, the engineered soft rest: every phone visitor stops here,
   eye to eye, exactly once). New belief: *he knows we can see him. We are backstage
   together; what happens next is between us.*
2. **MESSAGE.** None. The eyeline is the message. The shrug is the entire editorial
   position of the film on cheating: *someone has to.*
3. **VISUAL.** One slow straight push-in begins at 42.4 and runs to 44.4 (one move,
   one direction — it passes through the direct-address close at ~43.0 and lands at
   the nudge macro by 44.4). At the look: dead-centre framing (reserved for the two
   direct addresses — this is the second), his face over the graphite die, amber eye
   the loudest chroma in frame by one step. Foreground: die (graphite). Middle: him.
   Far: frozen room falling out of focus-by-value (no DOF here — the tilt-shift
   belongs to the die close-up moment per §10; see B6).
4. **3D ELEMENTS.** As B4. Nothing new.
5. **GOBLIN ACTION.** `look` at the die (neck→head follow-through, actions.ts:294) →
   `look` to lens → `express` 'flat' → `shrug` (actions.ts:431). Practiced, no
   hesitation.
6. **INTERACTION.** The soft rest at the look (touch only: momentum dying within
   ±0.35t eases to the anchor over 220 ms — motion §9). Keyboard ↓ lands here.
   Nothing clickable; the look answers the visitor's presence better than any hover
   could.
7. **ANIMATION.** Master scrub: the push (settle lane, straight, ~2.0t total —
   freeze push-in grammar), his acting (puppet lane). World frozen; gobT alive.
   Reverse: mirror.
8. **TRANSITION OUT.** None — the push continues into B6.
9. **KEEPING.** The rings hold the near plane through the push's first half; the
   die's worn edges start to read as the macro approaches — an object handled for
   years (metal-rule logic on bone: rubbed-bright on gripped parts).

### S5.B6 — THE NUDGE · t43.7–44.5

1. **BEAT + ARGUMENT.** The tiniest nudge, full puppet: fingertip contact with the
   4-frame anticipation — still the most polished animation in the film (§11) — and
   **the die takes paint at the moment of contact** (G6's one exception: `reveal()`,
   0.7s, blooming from the die's own centre), then tips over exactly one face, in
   slow scrubbed grace, to **20** (inherited: tip t43.75–44.25 via `dieTipAngle`,
   timeline.ts:668–672 — the geometry was built to roll on that edge,
   world.ts:3146–3190). Rest anchor: the-20. New belief: *the smallest possible
   intervention saves the night — drama belongs to the DM; the goblin only turns one
   face.*
2. **MESSAGE.** None — `nat20` was cut; the painted 20 reads its own face. The paint
   arriving WITH his touch is the film's thesis (what he touches comes alive)
   performed at jewel scale.
3. **VISUAL.** The macro (the push's end): die filling frame, his hand and forearm
   entering from behind it, face above — ~30° elevation. The 20's numerals painted,
   worn edges, the one authored glint; QA'd at 390 px from this exact angle (1 vs 20
   vs neighbors unambiguous). **Tilt-shift DOF for this one moment** — one of the
   film's exactly two DOF moments (§10). The graphite room soft beyond.
4. **3D ELEMENTS.** As B4. The die flips per-mesh state: `reveal()` target +
   markAlive at contact (it is the only object at the table that crosses; the
   film-wide markAlive census stays ≤40 — this chapter adds die + rope + goblin-
   already-counted).
5. **GOBLIN ACTION.** `reach` solved to the die's near-left edge (plantFor's
   furniture floor handles the bench+table stack, actions.ts:177–183) → **`nudge`**
   (actions.ts:460): 4-frame anticipation, one fingertip, push-through of a few
   millimetres. Nothing else moves.
6. **INTERACTION.** None. The gearing gives the tip its grace: at play pace the
   tip-over is 0.5s; under scrub the visitor owns its speed — the single most
   satisfying scrub-inch on the site.
7. **ANIMATION.** Master scrub: the push settles (44.4), the nudge (puppet lane),
   the reveal bloom (0.7s from die centre — colour and its shadow arrive together),
   the tip (power2.inOut, weighted like a real jewel; dead-still before it — the
   held-breath rock stays rejected). World frozen; gobT alive. Reverse recipe note:
   scrubbing back un-tips the die to 1 and **un-paints it** (the reveal reverses),
   then un-touches — reveal order is the un-keeping order, correct by construction.
8. **TRANSITION OUT.** None — hold the macro one beat as he withdraws the hand.
9. **KEEPING.** The die's worn edges under fresh paint — the most-handled object in
   the film's world, restored mid-freeze by its keeper. Second-plane inside a jewel
   shot.

### S5.B7 — DUST OFF, WALK AWAY · t44.5–47

1. **BEAT + ARGUMENT.** He dusts his hands, hops down, and walks out of frame without
   waiting. The camera holds the macro a breath, then begins the pull-back
   (t46.5–49, timeline.ts:684). New belief: *he doesn't want credit. This is
   routine — the ten-thousandth night, not a heroic one.*
2. **MESSAGE.** None. The exit's briskness is the characterization; the empty frozen
   room he leaves behind (painted die, graphite everything) is the film's cleanest
   single image of the concept.
3. **VISUAL.** Macro widening as the pull starts: the painted 20 in the foreground —
   the one warm object in a graphite room — his back crossing the middle plane
   toward the door, the frozen laugh beyond. He exits frame-left by ~46.3, before
   time resumes: the cheer must find the room exactly as the players left it.
4. **3D ELEMENTS.** As B6. Nothing new; nothing destroyed.
5. **GOBLIN ACTION.** `dustOff` (actions.ts:470) → `hop` down (the new verb,
   reversed staging) → stroll to the door, exit frame. Path retraces his entrance
   line (the commute again — same boards).
6. **INTERACTION.** None. Scrub-back replays the whole intervention backwards —
   the most repeat-scrubbed stretch of the chapter; every tween in it is
   symmetric by construction.
7. **ANIMATION.** Master scrub: acting (puppet lane), camera pull (settle lane,
   power2.inOut, inherited cam at 46.5). World frozen until B8. gobT alive.
8. **TRANSITION OUT.** **The exhale** at t47 — into B8.
9. **KEEPING.** His exit line crosses the door's swing-arc ghost one last time —
   entrance and exit bracketed by the same mark of prior keeping. Whisper-plane.

### S5.B8 — THE EXHALE — "You're welcome." · t47–50

1. **BEAT + ARGUMENT.** Time resumes mid-gesture: `timeScale → 1` over `T_EXHALE`
   (t47–47.3, timeline.ts:678) with `snapBack(47)` (timeline.ts:679 — power4.out,
   the punchline reserve); colour floods back; the spilled drop lands; the cheer
   finishes as though nobody noticed. `welcome` lands right off the flip. The camera
   is easing back to a normal-scale table view (46.5–49, timeline.ts:684); sky
   grades toward `skyVellum` from 47 (timeline.ts:685) so C4→C5 resolves before the
   cut. New belief: *nobody in the world will ever know. The DM gets the drama, the
   players get the miracle, the goblin gets nothing — and prefers it.*
2. **MESSAGE.** `welcome` — **"You're welcome."** — verbatim, cap at 47.3, hold 1.3,
   fade clear by 49.0 (timeline.ts:687–694, retiming locked in copy-spec). The Hand,
   lower-third band, ink; write-on, un-write on reverse. Delivered from off-frame —
   he has left; the line rides over the room that doesn't know he was there, which
   is the joke.
3. **VISUAL.** Pull-back settles at a ~30° table medium: the room in full paint and
   lamplight, players' arms up mid-cheer, the DM reaching for the die, the 20 face
   up, window still showing pencil beyond (outside remains undrawn — the room is the
   kept thing). Mug rings gone under paint — evidence closed with the file.
4. **3D ELEMENTS.** As B7, Performance side. Nothing created; the spill decal
   registers on the tabletop as the drop lands.
5. **GOBLIN ACTION.** None — offstage. (The v1 `visible:true` re-park at 49.95,
   timeline.ts:610, retires with the hide; S6 stages him fresh after the cut.)
6. **INTERACTION.** Rest anchor at welcome. Play/skip stand as ever. Nothing else —
   the beat rewards stillness.
7. **ANIMATION.** The exhale recipe verbatim: timeScale ramp 0.3t, world resumes
   MID-gesture (the cheer was always mid-rise under the graphite — the freeze never
   restarted anyone). **Spill-drop fall is timeline-authored** (a 0.2t tween at
   47.3), NOT world-clocked — a one-shot on the world clock would not reverse;
   as a tween it re-hangs on scrub-back. Cheer arms: puppet-lane tweens 47.3–48.2.
   World clock: hearth/candle/sway resume. Caption scrub-tied.
8. **TRANSITION OUT.** **The page turn** at t50 — one frame of paper (never black),
   `tl.set` pair ≥0.02t apart — into S6's first vignette. Cost: tavern set out at
   49.9 (timeline.ts:160), montage staged beyond; S6 bakes already warm (kicked in
   B1). Reversible page-turn per grammar.
9. **KEEPING.** The proof completes negatively: the keeping is invisible to the
   kept. The visitor alone holds the evidence — which is exactly the belief `pitch1`
   will cash at t58.

---

## ASSET BILL

Reuse = geometry survives, surface rebuilt per §7 recipes. NEW costs build time.

| Asset | Status | Technique / notes |
|---|---|---|
| Theatre island card + backstage apron | **NEW** (set tier 4) | islandKit recipe at set scale: three-band lathe skirt, roots, drawn rim with authored gap, grid ghost; island albedo bake (1024² ground class) |
| Stage disc + kerb | reuse (world.ts:2594–2629) | timber recipe: floorboard-family directional bake, ruled silhouette kept; kerb-throat drybrush; retires hatch 2628/2670/2689/2759 |
| Forest-on-disc dressing (8 trees, 2 stumps, 3 boulders, trunk) | reuse (world.ts:2632–2716) | flora kit + rock kit re-surface, merged one geometry per class per island (G1) |
| Theatre machinery set (capstan, 6 radial rails, 2 counterweight booms, rail trucks/blocks) | **NEW** | graphite-only — the film's one asset with no paint side; stroke primitives + quantized tone; boom rotation slaved to `stageDisc.rotation` |
| Scribed-arc mark set (3–4 arcs + one overshoot) | **NEW** (flagship 2) | `pencil.ts` `polyline()`/`curveLine()`, graphite/graphiteDark, on the under-disc bed |
| Eraser-ghost decal: tree prior-position ellipse | **NEW** (1 of the 4) | `graphiteLight`, disc bare half |
| Rope | reuse (world.ts:2800–2881) | fibre-streak directional bake; **markAlive'd** (stays painted through the flicker) |
| Snowy mountain flat | reuse-**reshaped** (world.ts:2718–2774) | disc-half → backstage flat in a slot; reserved-paper snow + blue-grey shadow strokes + windward edge; graphite brace + slot on the back (walk-through + freeze visible) |
| Scree + foot pines | reuse (world.ts:2775–2796) | rock/flora kit re-surface |
| Tavern island card | **NEW** (set tier 5) | island under the existing shell; cutaway open side +z by construction (MAX_PULLBACK 2.2) |
| Tavern shell (floor, walls, framing, bays) | reuse (world.ts:2929–3002) | timber + plaster recipes; retires bay hatch 3001 |
| Window view set | **NEW** (retires world.ts:3018) | muntin frame kept (3004–3037), no glass material; 2 graphite diorama cards of the undrawn world behind it, permanently Prep-side |
| Hearth + firebox + coals | reuse (world.ts:3039–3082) | painted dark + coals (retires 3059); flames = lathe tongues + amber glow, world clock; Prep = still graphite teardrop |
| Table + wear bake | reuse geometry (3107–3144); **NEW** wear bake (flagship 3) | drybrush wear + graphite mug rings + one one-value-step repair patch; retires wear hatch 3131 |
| The d20 (jewel pass) | reuse geometry (dieGeometry.ts; world.ts:3146–3190) | `dieBone` gouache, painted numerals QA'd at 390 px, worn edges, one authored glint; per-mesh material, `reveal()` + markAlive at contact |
| DM + 2 players | reuse (3199–3214) | silhouette-first, painted cloaks, no interior hatch; one authored DM throw beat |
| Patrons ×3 | reuse (adventurer family; tankard 3282–3296) | mid-laugh poses; graphite in freeze (G6) |
| Mugs ×3, sheets ×3, DM screen | reuse (3216–3280) | scribble-row recipe (retires 3249/3277); one mug restaged onto the near edge beside its ring; **screen's outward face = map art** — recommend a small dedicated 256² map-vocabulary bake, NOT a `bakeBoardMap` slice (keeps G2's bake schedule intact — see RISKS) |
| Candle | reuse (3298–3338) | ray burst retired → amber glow sprite; Prep teardrop |
| Benches ×3 | reuse (3340–3360) | rubbed-paint landing patch on the hop bench |
| Door | reuse (3362–3385) | + **NEW eraser-ghost decal: previous swing arc** (2 of the 4 spent by this chapter — S2 and S7 own the others) |
| Spill-drop prop | **NEW** | 2 painted droplet flats + splash decal; fall is a timeline tween |
| Spilled/frozen particle states | reuse grammar (kit 8) | Performance-only, freezable by construction |
| Interior key preset (+38°, hearth `(2.6,3.2,1.1)`) | **NEW rig values** (grammar kit 3 extension) | the one azimuth move in the film; lights only assets that exist nowhere else |
| `hop` verb | **NEW** (actions.ts, puppet lane) | mandated by the buildFinger retirement; symmetric arc for clean reverse |
| Retired outright | — | `buildFinger` 2888–2918, `nudgeFinger` 3192–3197 + timeline.ts:656–676, goblin hide/park sets timeline.ts:601–610/646, crossHatch 3018/3059, hatch 3001/3131/3249/3277/2914, v1 mountain-dodge run tweens 590–591 |

markAlive/per-mesh census added by this chapter: rope + die = 2 (goblin already
counted). Well inside the ≤40 film budget. Draw calls: tavern is the risk stage —
count via `draws.check.ts` early (see RISKS).

## PHONE PASS (390×844)

- **Figure floor.** Acting beats and their portrait solves, all owed rows in
  `figure.check.ts` at 390×844 / 500×915 / 768×917 (≥84 px) and 1440×900 / 1920×1080
  (≥100 px): S4 haul (portraitLook: tighter over-shoulder, rope + disc rim, mountain
  cropped until reveal), S4 wave (two-shot goblin + flat), S5 stroll-in (portraitLook
  tighter on his path; rings held in near plane if 390 allows), S5 look (dead-centre
  close — trivially clears), S5 nudge (macro — his hand/head at frame scale), S5 exit
  (medium). Establishing wides (S4.B2, S5.B2 establish) are exempt and are the only
  sub-floor shots.
- **Re-framed, not cropped.** Every portrait target is a second authored composition
  (`portraitLook`), never a runtime crop, never an FOV tween.
- **Cut at phone width:** nothing is cut outright. Two demote-to-texture valves per
  §6: the S4 scribed arcs and the S5 mug rings each get a 390 px legibility QA; if
  either fails at that breakpoint it demotes to texture there — the shot does not
  shrink. (Both are framed to pass: the arcs sit centred at the push's deepest point;
  the rings sit at reading scale in the near plane.)
- **The die's numerals** are QA'd at 390 px from both authored angles (the 1 at B2's
  close, the 20 at B6's macro) — clarity contract §11.5, release requirement.
- **The tavern survives the pull-back by construction:** open side faces the portrait
  camera; 14-unit walls / 22-unit floor sized against `MAX_PULLBACK 2.2` (RECON
  §2.7) — portrait never sees outside the set.
- Captions `set1` / `welcome` hold the lower-third band at 390×844 per the locked
  clamps; the S5 freeze's margin breathe is fully legible at phone width.

## ACCESSIBILITY PASS

- **Reduced motion (the stepped picture book, motion §14).** S4 steps: wide with
  forest half (B2 anchor-adjacent) → held graphite still of the machinery/arcs (the
  flicker becomes one cut-in/cut-out held frame — no push-in) → disc at π with the
  mountain revealed (mountain-reveal anchor) → wave held pose. S5 steps: tavern
  establish → die on 1 (nat-1) → frozen room with goblin at the die (look-at-us) →
  painted die on 20 (the-20) → resumed room (welcome). Freezes/exhales are instant
  cuts; the reveal bloom and exposure crossfade become plain crossfades; write-ons
  become opacity fades in the same windows; `A = 0` stills hearth, candle, patron
  sway, spill hang (still, at the lit pose); soft rests off; boil off. The walk-
  through becomes two stills separated by one dark held frame — no travelling
  darkness.
- **Screen reader.** Canvas `aria-hidden`; the SR document carries the two captions
  verbatim (`set1`, `welcome`) with scene sentences between them. Proposed SR-only
  sentences (not on-screen copy, per experience §9): S4 — "He pulls a rope and the
  forest swings away like a stage set; behind it stands a snowy mountain." S5 — "In
  the tavern the DM rolls a one; time freezes, the goblin walks in, nudges the die
  to twenty, and is gone before time starts again." The freeze, the flagship marks
  and the flicker are visual texture and are deliberately not narrated beyond those
  sentences.
- **Keyboard.** ↓/↑ steps the chapter's anchors: set1, mountain-reveal, nat-1,
  look-at-us, the-20, welcome. PgDn jumps C3→C4. Esc pauses play mode. No traps; no
  interaction is hover-only (there is no hover here at all); skip note reachable
  throughout.
- **Vestibular.** No roll anywhere; the disc turn is object motion under a static-
  to-slow camera; all pushes straight-line; the walk-through darkness is an exposure
  crossfade, not a smear; the tick is an instant cut (no easing to blunt, nothing to
  trigger).
- **Colour independence.** Freeze state is never colour-only: texture (graphite
  strokes), lighting (shadowless), margin (breathed), motion (stopped) all flip
  together.

## RISKS

1. **The under-disc sightline (flagship 2).** Reading arcs beneath a disc whose top
   face is y=0.3, at ≥20° camera elevation, through a kerb gap, is geometrically
   tight. Mitigation is authored here: the disc rides visible graphite blocks/trucks
   (honest theatre) to open the slot, and the arcs sit on the bed, not the disc's
   underside face. Still the chapter's most likely "reads worse than it writes"
   shot — prototype the flicker framing first, at 390 px, before polishing the
   machinery. A flagship that demotes at phone width is a real loss even though §6
   permits it.
2. **The full-puppet nudge replaces the film's best v1 animation.** Bench + table is
   a stacked-furniture reach at proportions where his arm is a third of his body
   (actions.ts:168–183); the die may need to live a few centimetres nearer the
   table's bench edge than v1's (80, 1.21, 0) for the reach to solve without the
   invisible-tray read. Budget rehearsal; `puppet.check` the reach at both
   breakpoint camera targets.
3. **The walk-through is the chapter's most fragile transition.** A parked scrub
   mid-darkness is a legal held frame and must be composed (margin breathing, tone
   held); the set swap must hide entirely inside the crossfade in BOTH directions;
   and the S5 establish must be fully composed on the emergence frame (stale-frame
   trap). Three QA cases, all named in motion §16's held-frame audit.
4. **Tavern draw calls.** The film's densest room plus a window diorama plus cast of
   six. Merge discipline per G1 and count with `draws.check.ts` at the establish
   camera before dressing passes; the window view is capped at 2 cards.
5. **The DM screen's map face vs the bake schedule.** If it is sliced from
   `bakeBoardMap()`'s 2048² atlas, S5 drags the film's biggest bake seven stages
   early and breaks G2's one-stage-ahead schedule. Ship it as a small dedicated
   256² map-vocabulary bake in the paper-props class instead; same vocabulary, no
   drift risk that matters at plane four.
6. **`set1` flushing graphite mid-hold.** The Hand's ink⇄graphite crossfade during
   the flicker is shipped grammar for `light1` but has never run off a whole-frame
   tick; it must key off the curtain value (not a parallel tween) to stay
   scrub-safe both directions. One wiring decision, cheap if made early, ugly if
   retrofitted.
7. **The mug rings overcooking.** Near-plane evidence at reading scale is one nudge
   away from becoming the subject and breaking the one-eye-path rule. The rings are
   value-quiet (graphite ramp on `plank`), the die and the goblin carry the frame's
   contrast; judge in the built frame, and thin the rings before moving the camera.
8. **The mountain restage changes v1's turn choreography.** With the mountain off
   the disc, the vacated half must not read as dead stage for 2.5 s of turn — the
   rail lines, the tree ghost and the kerb wear are its dressing; if the walk still
   sags, the fix is dressing density, never turn speed (time is locked).
9. **Reverse-scrub of the die reveal.** Un-painting on reverse is correct grammar
   but has never been seen on a jewel prop at macro scale; if the bloom's reverse
   reads as a glitch rather than un-keeping, re-judge the reveal's radius/duration
   inside the shipped 0.35–0.9 s band — not with new machinery.
