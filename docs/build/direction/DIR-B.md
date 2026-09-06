# DIR-B — THE TRAVELLING SEAM

Creative direction for the whole site: film body (stages 1–8), persistent interface,
endcard. Continuous with the shipped hero (`hero.ts`, `trilayer.ts`, `rigs.ts`,
`islandKit.ts`) and with the binding v2 docs; where this direction extends them it names
the extension and its rule. Copy per `copy-spec.md`, verbatim; story per `story.md`;
runtime t=66 and the gearing map untouched.

---

## 1. Core concept

**The world is finished exactly as far as someone has worked on it — and the frontier of
that work travels with the goblin.**

The shipped hero already contains this sentence in still form: hero doc §1 says the
boundary between graphite and paint "is not a wipe line — it is the goblin's *progress*."
This direction makes that one sentence the engine of the entire film. The seam the hero
freezes, the film *moves*.

Why this is true for THIS product and no other: a DM's prep is a frontier. Nobody
finishes a whole world; you finish the part the party will reach tonight, and the rest of
the map stays pencil. Good Goblin's pitch — build the maps, run the table, the goblin
does the rest — is literally "someone else advances your frontier." A film whose world is
painted exactly as far as the goblin has worked is not a metaphor for the product; it is
a demo of it, run at world scale.

The two shipped truths stay exactly as the direction doc names them — the Performance
and the Prep — and the tick stays the film's holy instant. What this direction adds is
the third thing the code already built but the film never used: `rig.seamX/seamW/seamWob`
(`trilayer.ts:49–54`) is a *spatial* Prep↔Performance cut that composes with the global
curtain by `max(curtain, seam)` (`trilayer.ts:299`) — today parked at `1e6` everywhere
except the hero. Unpark it. Drive it from the beat sheet. The frontier the hero holds
still becomes the film's line of action.

### The four seam laws (the discipline that keeps the restraint rule alive)

1. **The curtain is time; the seam is work.** The curtain is scalar, global, instant —
   the tick, unchanged, still the film's only way to stop the world. The seam is spatial,
   slow, and *always motivated by labor or transit*. Neither may impersonate the other:
   no seam ever snaps; no curtain ever creeps.
2. **One frontier per shot.** The seam has one shape and one travel direction per stage.
   A frame never shows two independent frontiers (the montage's six islands each carry
   their own, but only one is ever the shot's subject).
3. **The seam shows a band, never a world.** Full-Prep frames belong to the curtain
   freezes alone, exactly as shipped. The seam's graphite side is always partial — an
   edge, a wake, the far half of an island. This is how "the contrast IS the
   storytelling" survives the seam being present in most stages: the *whole* underdrawing
   is still rationed to the three freezes.
4. **Unfinishing is earned, not ambient.** The world relaxes back to graphite only
   (a) under reverse scrub — the projectionist un-tells the tale, already the site's
   grammar — and (b) in exactly one forward beat, the theatre turn, where scenery
   leaving the audience's view un-paints as it goes backstage (§Stage 4). Nothing else
   ever un-paints forward. A world that visibly rots behind the camera reads hollow;
   a set that rests when the audience turns away reads true.

---

## 2. Narrative — the argument the scroll makes

`story.md`'s beats become a three-act argument about the frontier:

- **Act I — the frontier exists** (S1–S2). The claim opens on a *finished* night — the
  party's world is complete because he already prepped it — with one quiet tell: the
  camp island's far rim trails off into pencil. The first freeze then shows the whole
  truth at once (the tick, the grid, the underdrawing), and the release on *Straight to
  work.* is the seam's first travel: color returns along his walk direction, from his
  heel. The visitor now owns the film's one rule: **finished = worked on.**
- **Act II — the frontier is his job** (S3–S6). Three proofs, restated as frontier
  moves: light *advances* it (the lantern pool is the seam blooming), scenery *rotates*
  it (the disc's seam is radial; sets paint as they face the house), time *ignores* it
  (the tavern is the film's only interior and its only seamless stage — a whole room at
  full paint makes the nat-1 tick land harder than anywhere else). The montage shows six
  islands caught at six different completion states — breadth as six frontiers.
- **Act III — the frontier closes** (S7–S8). The flatten is the seam's final act run
  over the whole world at once — but what's on the far side this time is not
  underdrawing, it is the **finished map** (the direction doc's "two truths merging",
  staged as the frontier crossing everything and both sides agreeing). The board is the
  world with no seam left in it. Then the CTA hands the frontier to the visitor: the
  amber touch-bloom on the button is the film's reveal grammar, performed by you.

The belief ladder, gearing, captions, silences, and both direct addresses stay exactly
per the experience doc. Scrubbing backward un-paints the world along the same frontiers
— the travelling seam makes reverse scroll *narrative* by construction, not just
mechanical undo.

---

## 3. Visual world — islands, and what the seam does to them

Islands-on-the-page stands as the staging law (direction doc §3). The seam adds the rule
that makes every island edge mean something: **an island's rim is where its frontier
came to rest.** The sculpted edge — strata, roots, the path that "ends in a pencil line
that simply stops being drawn" — is not decoration; it is the visible perimeter of work
done. Every island therefore carries a static graphite fringe on its trailing side
(away from the film's line of travel), authored per island, at rest. Only the *active*
frontier — the one the goblin is pushing this stage — moves.

The page is the void, the sheet, and the margin system, per the binding docs. One
addition: the grid ghost (`GRID_INK = 0.04`, enforced — `trilayer.ts:31`) extends a few
cells past each island's graphite fringe onto the paper itself, exactly as the hero
already does (hero doc §4, "the drawing escaping its object") — the page and the world
refusing to stay separate is now a site-wide constant, not a hero effect.

Places relate by transit, never by cut (except the montage's paper page-turns, as
designed): the camera crosses from island to island over bare page, and the arriving
island is met graphite-first, taking its paint as the goblin's work reaches it — the
travelling seam is also the film's *transition* material. The seven-transition catalog
gains one entry (§11).

---

## 4. Typography

The three voices stand as amended (the Hand / Cinzel Inscription / Vollkorn Quiet
Serif), with their entrances and exits per the experience doc §4 and motion doc §8. The
seam adds one systematic rule, promoted from the one-off in the experience doc's Stage 3
("the caption's own strokes flushing from graphite to ink as the pool crosses the
band"):

**Lettering lives on the page, so the seam crosses it too.** Any Hand-lettered line
whose band the active frontier reaches flushes graphite→ink stroke-by-stroke as the
frontier passes — a 200ms per-stroke crossfade of the two stroke colors (motion §8's
swap mechanism), never a repaint. Captions in fully-painted stages are ink; captions
inside curtain freezes are graphite; captions at a frontier are *crossing*. The margin
furniture never flushes — the sheet's own furniture is always graphite; it is the page,
not the world.

What is drawn art vs live text (accessibility/SEO): the twelve captions + tagline are
authored stroke SVGs (drawn art) with the verbatim line in an `aria-label`d visually
hidden text node; the SR document (experience §9) remains the crawlable full story,
first in DOM; the endcard subline, skip note, meta-line, and © line are real text in
Vollkorn; the CTA label is real text in Cinzel. Nothing on screen is a raster of words.

---

## 5. Color palette

The committed tokens (`palette.ts`) are the law. Site spine: paper `#F7F5F0`, ink
`#222222`, tooth `#E8E5DF`, graphite ramp `#B9B6B0 / #82807A / #4A4844`. Alive ramp
(the only glow): amber `#F2C35E` → lantern `#E8963E` → ember `#C75B2A`. The goblin's
green `#84A058` is his alone; brand `#B6D648` is the wordmark pip and nothing else.
Chapter airs: skyDusk `#6D78AE`, skyDay `#ACCDE6`, skyOvercast `#AAB6C0`, skyHearth
`#D4B184`, skyVellum `#EEE6D2`, skyDawn `#E6C1A2`, skyBoard `#F7F5F0`. World pigments
per the committed ground/foliage/wood/fire/cloth/metal bands.

**The seam discipline that governs when a colour may appear: colour is earned by
crossing the frontier.** A hue exists only on the painted side of a seam or inside a
fully-painted stage. The graphite side of any frontier admits exactly four things:
paper, the graphite ramp, ink — and the alive (the goblin at full colour, anything
`markAlive`d, and the ≤6% amber almost-touch, hero grammar, hero-and-endcard only).
Nothing else. No "half-tinted" transitional objects: a prop is either past the frontier
(full palette) or not (graphite) — the blend band belongs to the *frontier texture*
(the dab break-up, `trilayer.ts:286–298`), never to a prop's own fill. Contrast floors
per the binding docs (captions ≥4.5:1, grid ≤4% ink).

---

## 6. Composition — storyboard rules

All six rules of the direction doc §6 bind (four-plane, one eye-path, thirds,
lower-third captions, margin-as-letterbox, portrait restack). Three seam-specific rules
on top:

1. **The frontier obeys the eye-path.** The active seam enters a frame from the
   subject's side of travel and exits frame — it is composition, aimed like light.
   It never bisects the subject except for the goblin, who is *defined* by standing on
   it (the hero pose, quoted at key beats).
2. **Graphite reads as background value.** In any Performance frame containing a
   frontier, the graphite side must sit at least one value tier quieter than the painted
   subject (the four-tier stroke bake gives this for free: distant graphite runs tiers
   1–2). At phone width, if the graphite half of a frame competes with the subject, the
   framing tightens onto the painted side — the frontier can be *implied* by an edge
   entering frame; it never needs to be centered to exist.
3. **Island rims never touch the viewport edge** (islandKit contract,
   `islandKit.ts:18–21`) — the page margin breathes around every island at every
   breakpoint; portrait restacks islands vertically and steepens the active frontier so
   both sides survive the narrow frame (the hero's portrait solution, generalized).

---

## 7. Materials — the trilayer extended to every class

One material system, no exceptions: every world surface is a trilayer
(`createTrilayer`, one shared program, `trilayer.ts:511`) — gouache paint side,
authored-stroke graphite side (four baked density tiers, one family direction per prop,
`bakeStrokeTiles` `trilayer.ts:94–203`), drybrush edge-wear, in-material depth. Per
class, the technique:

| Class | Paint side | Prep side | Technique notes |
|---|---|---|---|
| **Rock / cliff** | Roughened closed forms, baked gouache albedo, `poster: 4` value tiers, drybrush on arrises | Stroke family laid along the bedding direction; strata as *contour* lines (never hatch); silhouetteNear occluders go near-black | The cliff is a strata stack of closed lathe tiers (hero island-edge grammar at landform scale) |
| **Timber / carpentry** | Bark/plank bakes (`bakeBark` precedent), grain-direction dabs, straight edges kept | Grain-family strokes near-vertical (`trunkStroke dir≈1.35`, `hero.ts:906`); joints as single scored lines | Carpentry keeps its ruled silhouette; paint supplies all tone |
| **Foliage** | Lobed crown masses + foliage bake + `poster` quantizer (the P4d fix, `trilayer.ts:264–267`) | Sheet-basis one-direction shading per prop (`stroke.sheet`, ±7° family variance) — a hand shades a whole tree one way | `buildTree` (`hero.ts:890`) is the proven template; the film's 100+ trees are its variants |
| **Cloth** | Sculpted fold masses, `poster: 3`, stroke dabs along the fall line | One family down the drape; hems get the hero contour weight | Hem physics is goblin-only (hero tier) |
| **Water** | Painted body colour (`water #679FB4`), flow rendered with the frontier's own anisotropic dab noise re-used as a baked flow texture; tide-line at banks (the `triEdge` pigment line, `trilayer.ts:316–319`, is *already* a waterline) | Waterline contour + sparse flow ticks, one family | Never transparency, never specular — gouache water is opaque paint that *moves* on the world clock (UV drift of the dab bake, freezable) |
| **Metal** | One committed body tone (brass/iron/gold/steel tokens) + a single authored glint plate per prop (the die-jewel precedent); drybrush wear on edges | Contour + one ellipse ghost on turned parts | No environment reflection, ever — a painted glint is a decision, a reflection is a render |
| **Fire** | The painted lathe tongues (kept from `buildFlames`, re-skinned trilayer) + the amber point glow on the world clock (`rigs.ts flicker`) — light as a painted object | A still graphite teardrop at hero contour weight (the frozen candleflame image, systematized) | The glow dies with the paint (`rigs.ts:143`) — a drawn fire emits nothing |
| **Snow** | Blue-shadow paint tiers (snow `#F2F2EC` body, stoneCool-family shadow masses); highlights are *bare paper* | Nearly nothing: contour plus shadow-mass strokes only | The material joke that earns C3/C6's mountains: snow is the one thing the page and the world agree on |
| **Paper & painted maps in-world** (sheets, DM screen, the board) | Flat authored map art — **the third truth**: a map is already both drawing and paint, so it renders identically on both sides of any seam and inside freezes | Same | This is the flatten's destination material; seeding it on the C5 map table and the DM screen plants the ending |
| **Particles** (motes, moths, embers, dust) | Painted flats and authored scribbles, Performance-side only, all on the world clock (frozen mid-air by the tick) | Absent — except frozen dust, which renders as graphite scribble (S2's shipped image) | |

The frontier itself is a first-class material moment everywhere it appears: the dab
break-up, pigment pooling, and dried tide-line the hero authored (`trilayer.ts:281–319`)
are the *only* legal seam texture — no stage invents a second frontier look.

All bakes are the hero's canvas-bake pipeline (browser-baked, deterministic seeds,
Node-null) scaled up: per-class albedo bakes replace the v1 flat fills and every one of
the **34 `hatch()`/`crossHatch()` call sites in `world.ts`** (grep-confirmed), which are
a hard-gate violation and go to zero — including the cave mouth (world.ts:1912–1972),
tavern window and firebox fills (3006–3082), montage tones, cliff cracks (3936–3956),
and field till (4267–4311). Tone comes from paint tiers and the stroke bake, never from
ruled marks.

---

## 8. Lighting — two rigs carry the film

The shipped rig pair (`rigs.ts createRigs`) is the whole system; nothing new is
invented. Per stage, only three things are staged (the `stageHeroRig`/`parkHeroRig`
pattern, `hero.ts:1649–1683`, generalized to a per-stage rig recipe):

1. **The key's position and colour temperature** per chapter script: C1 the campfire is
   the key (warm, low, radius-limited); C2 morning key warming over the run; C3
   overcast — key near-vertical and soft, the film's flattest Performance light; C4
   lamplight pools (key demoted, the glow points carry the room); C5 bright flat
   vellum; C6 dawn gold raking + painted god-ray cones; C7/8 paper light.
2. **The depth window** (`rig.depthNear/depthFar`) per island scale — fog-to-paper and
   line-weight falloff both read correctly at each stage's camera distance.
3. **The sheet basis** (`rig.sheetX/sheetY`) to each stage's authored lens, so every
   island's graphite side is drawn *on that shot's sheet*.

The one rule that keeps eight stages coherent: **one shadow-casting key, ever** — the
world casts under it while painted (`markCaster`), releases at the fully-drawn page, and
the alive cast always (`rigs.ts:101–109, 157`). On the graphite side of any frontier the
fragments are unlit by construction (the trilayer's Prep side never reads
`outgoingLight`) — so the travelling seam needs zero lighting choreography: light
arrives with paint because that is what the material *is*. Shadows arriving with colour
— the film's thesis image — is structural, not staged.

---

## 9. 3D elements — the kit register

Build once, reuse across stages. Tiering by polish depth:

**Grammar kit** (exists — extend, don't rebuild): island card + page drop shadow
(`islandKit.ts`), trilayer + stroke bake + seam (`trilayer.ts`), rigs (`rigs.ts`), grid
ghost, margin furniture, the curtain pass. *New in kit:* the **seam basis** — one
extension promoting `seamX` from "world x" to a staged axis (dot the world position
against a rig-side seam direction, defaulting to +x so the hero and every shipped frame
are untouched), which is what lets S4's frontier run radially on the disc and S7's run
outward from under him. One uniform vec3 + one dot product; the wobble/dab/tide
machinery is untouched.

**Hero tier** (deepest polish; every close-up cites these):
- **The goblin, re-dressed.** Same locked v2 design, same rig, same `RIG` numbers and
  `EAR_Z` coupling (`world.ts:1099` ↔ `actions.ts:324`), same actions vocabulary. The
  "bad asset drawing" verdict is his *surfaces*: flat fills + pigment noise, faceted
  lathe shading, and two literal hatch patches (flank `world.ts:977–980`, jaw
  `world.ts:1210–1213`). Re-dress: trilayer skin and cloak with per-part stroke
  families, `poster: 3` on the cloak masses, painted face plates (eye discs, brow,
  fang) at jewel finish, drybrush on hood rim and cuffs, hatch patches deleted (their
  job — a lit side and an underside — is the key light's now). The hero's staging
  lessons carry: shell-weighted silhouette at small figure sizes (`hero.ts:1183–1190`),
  profile-readable head, ears as the identifier.
- **The d20** — jewel treatment per direction doc: painted numerals, worn edges, one
  authored glint; `dieGeometry.ts` solved roll kept.
- **The lantern kit** — lamppost (hero `buildLantern` is the template), campfire,
  tavern lamps, candle; all share the flame tongues + glow grammar.
- **The pencil** (`buildPencil`, exists) — recurs beyond the hero: the montage's
  fence-post pencil is this asset scaled up, closing the loop.

**Flora kit:** oak, pine, half-contoured tree (exists — now a *reusable state*: any
tree near a frontier can stand half-contoured), tuft, sprig, fern, mushroom (caps in
threes), stump + rings, roots (island-edge dressing), moss patches.

**Rock kit:** boulder (3 sizes), outcrop cluster, cliff strata stack (S1/S2/S7 — one
asset, three stagings), scree, pebbles, cairn stones (S7's tended beat).

**Carpentry kit:** signpost (hero template), cave door + timber frame, chest (hero
template; also S6 vignette), bench, table (tavern + montage), plank surfaces, stage
disc + kerb, **under-stage machinery** (capstan, counterweight, radial rails —
graphite-only, freeze-visible: the film's only asset with *no* paint side), rope
(catenary + coil, kept from `world.ts:2802–2883` re-skinned), gabled house (montage +
miniWorld), tavern sign + chains, tavern interior set (walls, hearth, shelf + bottles,
mugs, sheets, DM screen — screen faced with third-truth map art), monster (S6 —
rebuilt: painted bulk, poster tiers, ONE fur family direction replacing the 7 tick-
stroke shag clumps of `world.ts:3480–3660`).

**Cast:** adventurer trio (silhouette-first, cloak tokens, never out-chroma the
goblin), DM + two players, ravens (3), tavern patrons, moth/motes/embers.

**Board tier:** the real authored Good Goblin map (product art, the endcard ground),
the flatten icon set — canopy icons, house icons, painted flame marks, inked roads,
field washes — authored as the *targets* the 3D world lies down into.

---

## 10. Depth

The two depth languages are in-material and shipped (`trilayer.ts:15–22`): Performance
distance ramps lit paint to PAPER (never grey); Prep distance is line-weight falloff
(far strokes fainter, more paper). Staged per island via the depth window (§8). The
four-plane rule supplies parallax; foreground occluders under Prep go near-black
silhouette (`silhouetteNear`); theatre flats are allowed for atmosphere, banned for
solid matter; DOF exists at exactly two authored moments (die close-up, C6 miniature)
per the direction doc.

What keeps it from videogame 3D: the page is always co-present. Every island floats on
visible paper with a drop shadow that is *only as real as its finished part*
(`islandKit.ts:44–50`); the grid ghost bleeds past the rims; the margin breathes at
every freeze. Depth in this film is the depth of a diorama on a drafting table — the
camera compresses (mild telephoto per stage, the hero's 32° instinct carried into the
film's 42° reference), never fish-eyes, and the FOV clamp + pull-back (`framing.ts`)
stay the only lens machinery.

---

## 11. Motion language

The two-clock architecture is untouched: `world.t`/`timeScale` freezable, `gobT` never
stops, scroll owns the master timeline, lanes per motion doc §3.2.

**The seam is a scrub-lane channel.** It rides the timeline exactly as the curtain does
— a rig uniform tweened with ease `none`, scrub-tied, reversible by construction. It
never moves during a freeze (at curtain=1 the `max()` makes seam motion invisible, so
the tick's silence is safe even mid-travel). It gets no clock of its own: the frontier
advances only because the scrubbed timeline says his work advanced.

**The eighth transition** (the catalog demands a name and a rule):

| Name | What it is | Where | Rule |
|---|---|---|---|
| **The wake** | The frontier travels — paint arrives at the seam's pace along its staged axis | S2 release, S3 run, S4 turn, S6 vignette steps, S7 flatten | Always motivated by his labor or the camera's transit; band texture is the authored frontier only; composes with the curtain by max; never global except S7; forward un-painting exists only in S4's turn |

Touch reveals (`reveal()`, 0.35–0.9s, power2.out) remain the *local* grammar and now
have a relationship to the wake: a reveal blooms from the touched prop and **merges
into the advancing frontier** — the lantern beat is a reveal whose pool the seam then
absorbs. Everything else per the motion doc: the boil on UI strokes, follow-through
hand-offsets over staggers, the die's dead-still wobble, power2 house ease, PRM mapping
(the wake under reduced motion becomes a cut at the stage boundary, like every ride).

---

## 12. Conversion goal

At t66 the visitor must understand: **a finished world is someone's finished work — and
that someone can be this goblin, for my table.** And must feel: *I want to be the DM he
works for.* The single action: JOIN THE DISCORD (closed beta, one CTA, no waitlist —
`DISCORD_URL` stays the one wired constant).

The CTA is the travelling seam's last inch: a graphite button on a finished map — the
only unfinished thing left in the world — and the visitor's pointer is the touch that
paints it (amber bloom, contact shadow arriving with colour, per the experience doc
§8). The film's final frontier is crossed by the visitor, not the goblin. Click: the
die rolls its 20, Discord opens, the board stays warm behind it.

---

## Per-stage: what changes vs `world.ts`, and the asset list

Line numbers from `world.ts` as read 2026-09-03 (4478 lines; builders grep-confirmed at
846 / 1532 / 1802 / 2225 / 2593 / 2923 / 3393 / 3905).

### Stage 1 — The Claim (replaces `buildAmbush`, 1532–1764, + the restaged-open pieces of `buildCliffWorld`, 4095–4121)
- **Changes:** the infinite `earthPlane`/`grassPlane` (`buildGround` 2244–2254) die
  first — camp and cliff become two islands with sculpted rims. C1 becomes *actual
  night*: indigo air, the campfire as the only key, ember drift; treeline rows
  (1655–1694) become trilayer trees + painted band flats; the rock-face hatch tone
  (1569–1577) and all camp flat fills go to bakes. The camp island's far rim carries
  the film's first static graphite fringe — the quiet tell, pre-explained by nothing.
  The `camp` children-filter hazard (1759–1763) is retired by giving the island an
  explicit group.
- **Assets:** ambush island card; campfire kit; camp kit (bedroll, pack, spear);
  adventurer trio re-dress; cliff strata stack; bolt + arrows + impact bursts
  (painted-stroke versions).

### Stage 2 — The Address (freeze per shipped grammar; cliff pieces from `buildCliffWorld` 3913–3974)
- **Changes:** the tick is untouched. The *release* becomes the wake's debut: on
  *Straight to work.*, `seamX` picks up from his heel and colour returns along his walk
  direction — the experience doc's "colour floods back along his walk direction,"
  implemented as the seam rather than a curtain ease. Dust puff becomes an authored
  graphite scribble asset; the cliff gets its strata re-dress; the grid ghost arrives
  via the island card, not a decal.
- **Assets:** dust-scribble; cliff re-dress (shared with S1/S7); the re-dressed goblin
  carries this stage alone — it is his close-up.

### Stage 3 — Proof of Light (replaces `buildPathProps` 1802–2216 + `buildGround`'s dressing 2225–2588)
- **The flagship wake stage.** The path becomes a long ribbon island, graphite *ahead*
  of him for its whole length; his run drives the frontier down the path spine; each
  prop beat is a touch reveal that merges into the wake; the lantern is the biggest
  bloom and the thesis image. The world-returns beat at t≈25.4 is the frontier
  committing to the island's far rim in one breath (no held partial curtain — the
  motion doc's held-frame rule).
- **Changes:** all ten prop groups re-dressed in trilayer + bakes; the cave mouth's
  crossHatch fill (1912–1974) becomes caveDark paint + contour; ravens, mushrooms,
  signpost, chest, lantern rebuilt from the hero kit templates; the 44-tree forest
  (2338–2392) becomes flora-kit variants with sheet-basis shading; sun disc + ray decal
  (2478–2489) becomes painted morning air (key + fog-to-paper), no decal light.
- **Assets:** path ribbon island; cave door + frame; perch tree; signpost (hero
  template); ravens ×3; mushrooms; the lamppost (hero template, now at film scale).

### Stage 4 — Proof of Scenery (replaces `buildTheatre` 2593–2884)
- **Changes:** the frontier goes **radial** (the seam-basis extension): the disc's seam
  lives in disc angle. As the goblin heaves the rope, the mountain half *paints as it
  swings toward the house* and the forest half *un-paints as it goes backstage* — the
  film's only forward unfinish, and the theatre's whole truth in one turn: scenery is
  finished for the audience, not for itself. The mid-turn Prep flicker shows the
  under-stage machinery (new graphite-only asset) per the experience doc. Disc, kerb,
  trees, peaks re-dressed; mountain snow per the snow material; rope kept re-skinned.
- **Assets:** stage disc + kerb; under-stage machinery (capstan, counterweights,
  rails); mountain flat + snow; scree; the rope.

### Stage 5 — Proof of Time (replaces `buildTavern` 2923–3388)
- **Changes:** the film's only interior and its only *seamless* stage — full paint,
  densest and warmest frame in the film; restraint law 3 cashes in here: after two
  frontier stages, a whole finished room makes the tick hit hardest. One seam note
  only: through the window and the door crack, the world outside stands in graphite —
  the window's night crossHatch fill (3006–3039) becomes an actual view of the undrawn
  world, which is both a gate fix and a better shot. The hearth firebox crossHatch
  (3041–3084) goes to painted dark + coals. The die gets the jewel treatment. **The
  finger-only compromise retires** (`buildFinger` 2890–2920, `nudgeFinger`): the
  experience doc's staging — the goblin strolls through the frozen room, hops on the
  bench, nudges — is restored with the full puppet; the nudge itself keeps its
  4-frame-anticipation polish budget.
- **Assets:** tavern interior set (walls, framing, hearth, shelf + bottles, window);
  table + benches; mugs, sheets, tankard, candle; DM screen (third-truth map art
  facing); DM + players re-dress; the die (hero tier).

### Stage 6 — The Many Jobs (replaces `buildMontage` 3393–3880)
- **Changes:** six vignette islands, each caught at a different completion state —
  six frontier shapes read in six glances (linear along the drawn road, radial from
  the planted tree, vertical up the hung sign, a coin-by-coin chest interior, a
  village edge, down a candle table). The road vignette makes the seam literal: the
  pencil-line he draws IS the frontier, and paint follows it. The monster rebuilds
  per §9 (its shag clumps, 3480–3660, are tick-stroke fur — a hatch cousin). Platform
  discs become island cards; page-turn cuts per the catalog.
- **Assets:** six vignette islands; giant pencil (buildPencil scaled); monster
  rebuild; tavern sign + chains; village houses; hoard + crates; candle table + book.

### Stage 7 — The Handover (replaces `buildCliffWorld` 3905–4386)
- **Changes:** the tended-rim bookend (remains → cairn + mushrooms) stands as staged;
  the miniature world below rebuilds as a true miniature (tilt-shift breath) with the
  crack-hatch patches (3936–3956) and field-till hatch (4267–4313) gone to paint. The
  flatten becomes **the wake run global**: the frontier sweeps outward from beneath
  him across every island at once — the one legal global seam — and its far side is
  the third truth: trees resolve to canopy icons, houses to house icons, fires to
  painted flame marks, roads to inked lines, the grid rising to meet them. The v1 gap
  where roads/river/fields sit outside `miniWorld` and never flatten (4215–4313) is
  closed by design: *everything* flattens. The die throw and the morph per the
  catalog.
- **Assets:** miniature world set (houses, trees, massif, roads, river, fields — all
  with authored flatten targets); the flatten icon set; die2; the cliff re-dress.

### Stage 8 — The Table (replaces the `board` group, 4321–4385)
- **Changes:** the placeholder `boardFill` + `GridHelper` becomes the real authored
  Good Goblin map in the product's own art style — the film's last frame is the
  product's first. Endcard per copy-spec direction C; CTA per §12; board breathes at
  whisper scale; nothing renders below it. The opacity-fade contract on the board
  group's local materials (timeline.ts traversal) carries into the new asset.
- **Assets:** the authored map (product art, the single most product-critical asset
  on the site); wordmark ear-perk rig; the CTA's drawn double-border.

### Persistent interface + endcard
Per the experience doc §4 wholesale (margin, ticks, numeral, ruler, captions, play,
skip, ©). One seam rhyme, free of charge: the progress ruler's 66 ticks already "ink
in" as they pass — name it what it is: the sheet's own travelling seam. Passed ticks
ink; future ticks graphite. The interface performs the film's grammar at 4% opacity,
wordlessly, the whole time.

---

## Guardrails carried forward

No hatching anywhere (this direction *removes* all 34 sites and adds none); paper/ink/
amber/goblin-green/pip discipline absolute; NoToneMapping transfer is the judged
surface; t=66 and gearing fixed; no spinner; reduced motion and keyboard first-class;
copy verbatim; goblin design locked (re-dress, not redesign); nothing here authorizes a
build — it directs one.
