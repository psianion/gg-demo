# DIR-A — THE DRAFTING TABLE

Creative direction for the whole site: film body (stages 1–8), persistent interface,
endcard. Anchored to the shipped hero (`src/film/stages/hero.ts`, `trilayer.ts`,
`rigs.ts`, `islandKit.ts` — the quality bar) and to the binding v2 docs. Story and
copy locked; every on-screen word stays exactly as `copy-spec.md` sets it.

---

## 1. Core concept

**The entire film happens on one surface: the Dungeon Master's drafting table — and the
visitor never leaves the bench.**

Why it is true for THIS product and no other: Good Goblin is literally a drafting table
that becomes a game table — you draw the map, then you run the table on the same
surface. The hero already stages this ("you are standing at the maker's bench, not
flying" — hero doc §3); v1's body then abandons the bench for infinite ground planes and
open sky (`world.ts:2242–2252`), which is exactly where the previz read comes from. This
direction makes the bench the film's whole geography: every stage island is a **sheet in
progress on the same working surface**, the travel between them happens on bare paper,
and the C6 rise doesn't reveal "a miniature world" — it reveals **the table itself**,
every sheet of the film in place on it. The final board is not a metaphor arriving; it's
the surface you've been looking at for two minutes, finally seen whole. The product's
sentence — *the map you drew is the game you run* — becomes the film's floor plan.

What this gives the body that the hero only hinted at:

- **A reason every set is finite.** The islands-on-the-page rule stops being an art
  choice and becomes physics: a set is a sheet; a sheet has edges; the paper is the
  table. No frame can regress to an infinite plane because there is nowhere for one
  to exist.
- **A unification the flatten can cash.** The flatten stops being a clever effect and
  becomes an inevitability — sheets pressing back into their drawings on the surface
  they never left.
- **A travel grammar between stages.** The goblin's runs between sets happen on bare
  paper, along a graphite path line that draws itself ahead of him — the world extends
  exactly as far as its maker has drawn.

## 2. Narrative — the argument, scrolled

The experience doc's claim / three proofs / handover shape stands untouched (its §2 beat
sheet and gearing are shipped and fixed). The drafting table adds one silent through-line
the scrub keeps paying off:

1. **The claim** (S1–S2): the ambush happens on a sheet at night; the first freeze shows
   the sheet's truth — graphite, construction lines, the grid ghost.
2. **The proofs** (S3–S5): each proof is a different thing a maker does at a table —
   *finishing* (paint follows his touch), *arranging* (a pinned cutout rotates), and
   *correcting* (time stops while the author fixes a roll). Light, scenery, time — but
   also: brush, pin, eraser. The table gives the three proofs a second, wordless reading
   for anyone who makes things.
3. **The handover** (S6–S8): the montage is six study plates worked in quick succession;
   the rise reveals the whole table; the die lands; the last sheet is the product's
   own map. The pencil is handed over — literally (§12).

Nothing is added to the copy. The argument sharpens because the pictures now agree with
each other: one surface, one maker, one session of work, told in one take.

## 3. Visual world — sheets on the table

**A "place" in this film is a sheet of work.** Five kinds, one vocabulary:

| Kind | What it is | Where |
|---|---|---|
| **Plate** | An island diorama standing on the paper — finite, sculpted edge, grid ghost beneath (islandKit card + dressing) | S1 ambush, S3 path ribbon, S7 cliff |
| **Pinned cutout** | A plate that rotates on a visible brass drawing pin | S4 theatre disc |
| **Model box** | A cutaway interior — three walls, open ceiling corner, sitting on the table like a maquette | S5 tavern |
| **Study plate** | A small square work-sheet, one subject each, non-verbal draughting marks in its margins | S6's six vignettes |
| **The board** | The finished sheet — a real authored Good Goblin map | S8 |

**How places relate:** adjacency on the table. Between plates there is only paper —
the void of the direction doc, now with a floor truth. The goblin crosses it on a
drawn path line (see §11). At C6 the relation is revealed literally: the camera rises
and the plates of the film are all there, arranged on one surface, the grid ghost
running continuously beneath all of them for the first time.

**What the page is:** the page IS the table IS (finally) the battlemap. The margin
system from the experience doc §4 — ticks, chapter numeral, 66-tick ruler — is the
sheet's own furniture and carries forward unchanged.

**Restraint rule:** the table's tool props (pencil, pin tin, eraser, straightedge)
appear exactly twice — the hero already owns the pencil; C6's rise may show tools at
the table's margin; the endcard shows the pencil at rest. Never mid-proof. The table
is a truth we stand on, not clutter we point at.

## 4. Typography

The three voices of the direction doc §4 + hero amendment, unchanged in role:

1. **The Hand** — the twelve captions and the endcard tagline, hand-lettered stroke
   SVGs in the wordmark's hand. Write on stroke-by-stroke (~15 strokes/s, `T_BEAT`),
   un-write on reverse. Graphite in Prep, ink in Performance; the `light1` line's
   strokes flush graphite→ink as the lantern pool crosses the band (experience §6).
2. **The Inscription** — Cinzel 700 letterspaced caps: the CTA label and the three
   tiny wayfinding labels (play / pause / replay). Nothing else, ever.
3. **The Quiet Serif** — Vollkorn (variable, true italic, self-hosted): the endcard
   subline, meta-line, skip note, © line.

**Drawn art vs live text (accessibility + SEO):** the Hand is art — every lettered
line exists twice: as strokes on screen and as real text in the visually-hidden SR
document (experience §9), which is also the crawlable page copy. Vollkorn and Cinzel
runs are live DOM text, selectable. Head meta per experience §3. No grotesk anywhere;
hierarchy is voice, not size. Caption discipline (lower-third band, phone-verified
clamps, ≥4.5:1) per copy-spec.

**One drafting-table rule added:** any mark the table itself makes (dimension ticks,
arrows, an X where a prop will stand — S6's study plates) is **non-verbal**. Words on
screen are copy, copy is locked; the draughtsman annotates in marks, not language.

## 5. Color — the committed tokens and the law of entry

Source of truth: `palette.ts` / `pencil.ts` (the hero doc superseded the direction
doc's draft hexes; these are the committed values).

**The spine (both states):** paper `#F7F5F0` · ink `#222222` · tooth `#E8E5DF` ·
graphiteLight `#B9B6B0` · graphite `#82807A` · graphiteDark `#4A4844`.

**The alive ramp — the only colours allowed to glow:** amber `#F2C35E` →
amberLantern `#E8963E` → amberEmber `#C75B2A`. Key light hue keyWarm `#FFEACC` (a
light colour, not a glow).

**The goblin:** goblinGreen `#84A058` skin, hood `#687452`, ear-inner `#5C7A2E`,
eyes = amber. Green is his alone — nothing else in any frame may read goblin-green.

**Brand:** wordmarkPip `#B6D648` — the d20 pip on the wordmark and nothing else.

**The world (Performance paint):** the committed gouache grade — chapter air
skyDusk `#6D78AE` / skyDay `#ACCDE6` / skyOvercast `#AAB6C0` / skyHearth `#D4B184` /
skyVellum `#EEE6D2` / skyDawn `#E6C1A2` / skyBoard = paper; grounds earth `#C2A97E`,
earthTrack `#A8875C`, grass `#94B164`, grassDeep `#6F9349`, snow `#F2F2EC`; foliage
canopy `#678E42`, canopyDeep `#466F33`, needle `#4C7350`; wood timber `#94795A`,
timberDark `#6A5138`, plank `#A9895E`; fire flameCore `#F7EFD2`, flameBody `#F4CC70`,
ember `#E89544`, rayGold `#A88E3E`, lanternGlass `#F2E2B4`; cloth cloakIndigo
`#4D5A9E`, cloakCrimson `#9E3D2C`; metals brass `#B0913F`, iron `#7D8590`; specials
dieBone `#ECE2CA`, mushCap `#B03C22`, water `#679FB4`, ravenSlate `#464C58`.

**The discipline — when a colour is allowed to appear:**

- A hue enters the film only as **paint** (albedo on a trilayer surface), never as
  light. Exactly two light hues exist: keyWarm and amber. No coloured fill lights,
  no rim lights, no lens effects.
- Behind the curtain every hue drains to the graphite ramp except the goblin's and
  whatever he has touched (shipped: `trilayer.ts` `uTriAlive`, `curtain.ts` mask).
- The grid ghost never exceeds `GRID_INK = 0.04` toward ink (asserted in code —
  `trilayer.ts:31`).
- Big areas keep one value step of air above their accents (the committed palette's
  own rule); ink-dark tiers (caveDark, tunicShade, ravenSlate) are the only
  near-blacks and are never adjacent to each other in a frame.
- New assets name tokens; no re-inlined literals. Any new colour is a palette PR, not
  a paint call.

## 6. Composition — storyboard rules across breakpoints

All of direction doc §6 binds (four-plane rule, one eye-path, goblin on thirds,
captions in the band, margin instead of letterboxing). The table adds:

- **The bench eye-level rule.** The camera is always at the table: elevations between
  ~20° (walking beside a plate) and ~75° (working over a study plate); the straight-down
  90° exists only at the board. No horizon-level landscape shots — the "sky" is the
  paper beyond the table's far edge, always ramping to `paper` (in-material fog,
  `trilayer.ts` `uTriNear/uTriFar`).
- **A sheet edge in every wide.** Every establishing frame shows at least one plate
  edge or the paper void — the finiteness is the composition's signature, the way the
  hero's near rim cuts its bottom zone. No frame may crop a plate on all four sides
  at wide scale (close-ups exempt).
- **Compression discipline.** The film's REF_FOV 42° stays (shipped clamp,
  `framing.ts`); framing prefers longer, flatter compositions — a maquette you lean
  over, not a landscape you fly through. The FOV clamp + pull-back own portrait; no
  FOV tweens (motion §10).
- **Phone:** plates restack vertically for tall aspect rather than cropping; the
  caption band and margin hold at 390×844 (copy-spec release requirement); the S5
  model box is sized against `MAX_PULLBACK 2.2` exactly as the v1 tavern already is
  (`world.ts:2953–2977` note in RECON §2.7) — the box's open side faces the pulled-back
  portrait camera by construction.

## 7. Materials — the trilayer, per class of surface

One system, shipped and proven: `createTrilayer()` — paint (lit gouache) /
underdrawing (authored stroke tiles, 4-tier tone quantizer) / wear (view-angle
drybrush), blended by the one curtain uniform, plus per-material knobs `poster`,
`stroke.dir`, `stroke.sheet`, `wear`, `feather`. **Every class below is a recipe of
those knobs plus an authored paint layer — no new material systems.**

| Class | Technique |
|---|---|
| **Rock / cliff** | Solid closed lathe with stepped strata (hero island-edge grammar), poster 3–4 value tiers, stroke.dir along the strata run, heavy wear on silhouette edges. Strata read as contour steps, never hatch. |
| **Timber / carpentry** | Straight-edged forms; stroke.dir along the grain per face (dominant-axis plane, hard-picked — the draughtsman's box shading already in the shader); poster 3; wear on handled corners and arrises only (the maintained-world rule). |
| **Foliage** | Lobed-crown lathes (kit), `poster` on (the shipped opt-in — committed value tiers instead of airbrush ramps), `stroke.sheet` on so one hand shades a whole crown in one direction; canopyDeep as the decided shadow mass, not a gradient. |
| **Cloth** | Sculpted hang (the cloak lathe grammar), stroke.sheet, poster 2–3 — gouache folds as decided tiers; hem physics on the goblin only (hero tier). |
| **Water** | Painted, opaque, matte: flat gouache bands of `water` with authored gold-less glint strokes as separate thin plates riding the world clock (drift, freezable). No transparency, no reflection, no speculars — a painted river, exactly as the flatten needs it to become an inked line. |
| **Metal** | Gouache + one authored painted highlight stroke per object (a miniature painter's dot-and-line, baked into the paint layer), wear high on edges. Never smooth-shiny; brass/iron are colours, not BRDFs. |
| **Fire** | The lathe-tongue flame kit + the rig's amber point glow on the world clock (`rigs.ts flicker`), flame paint posterized to 3 tiers (core/body/ember). The only emissive class. A drawn fire emits nothing (shipped: glow dies with the paint). |
| **Snow** | **The least-painted material in the film**: near-paper `#F2F2EC` washes with the paper tooth showing through hardest, shadow mass as one cool decided tier. Backstage (the S4 mountain) is barely painted *because nobody has played there yet* — the drafting table's own logic making a material choice. |
| **Paper / sheets (diegetic)** | Real geometry cards using the islandKit feather grammar; edges are painted deckle or a pencil line that stops. The S6 map sheet, character sheets, DM screen panels are paper-on-paper: separated by contact shadow and ink rule lines, never by tone fill. |
| **The painted map (board)** | Product-true art: the actual Good Goblin map style, authored as the S8 board texture. The one surface in the film that is neither gouache-world nor graphite — it is the product's own paint. |

The underdrawing side of every class comes free — same forms, tone quantizer, one
stroke family per region (the no-hatch gate holds by construction in the shader).
This retires the ~60 `hatch()`/`crossHatch()` calls across `world.ts` (RECON §6.8) as
each stage migrates: hatch was v1's only way to say "tone"; the trilayer says it with
authored stroke density.

## 8. Lighting — two rigs, one lamp

The shipped `createRigs()` architecture carries the whole film: Performance =
hemisphere fill + warm key + amber glow; Prep = flat paper light, no shadows; both
blended by the same curtain object; the key is the only shadow caster;
`markCaster` releases the painted world's shadows at the fully-drawn page so a frozen
frame's shadow map holds only the alive.

**The one rule the table adds — the lamp never moves.** The shadow-casting key is the
lamp over the drafting table: its **azimuth is fixed for the entire film** (the hero's
(4, 6, 3) family). Stage to stage, what changes is:

- key **colour/intensity** (C1 pulled low and warm; C2 morning-bright; C3 flat-grey
  overcast dimming toward the flicker beat; C4 low, letting the glow pools carry the
  room; C6 dawn-gold at full),
- the **hemisphere's chapter air** (the sky tokens — the shipped chapter ramp),
- the **painted glow objects** (fires, lanterns, candles) and their amber point glows,
  which are placed per shot and breathe on the world clock.

What never changes: key direction, the amber-only glow gate, shadows soft
(radius 3, the shipped setting), Prep shadowless-except-the-alive. One lamp is what
makes eight differently-scripted chapters read as one session at one table — and it
means every asset's authored paint can commit its shadow side once, in one direction,
instead of being lit generically.

Light is allowed to be a painted object (glow cones, ray bursts in rayGold) and never
a lens artifact. No tone mapping exists (three r185 NoToneMapping here); everything is
graded flat, in the paint — which the committed palette already is.

## 9. 3D elements — the kit register

Build once, reuse everywhere. Hero tier gets jewel polish; set tier gets full trilayer
recipes; grammar tier is shader/margin work; support tier is silhouette-first.

**HERO TIER (deepest polish)**
- **The goblin (repaint, rig kept).** The client's verdict lands here. Keep the
  hierarchy, `RIG`, and every solver (`world.ts:844–1281`, `actions.ts` — the
  EAR_Z 1.3 coupling at `world.ts:1099`/`actions.ts:324` preserved). Replace the
  skin: all five `hatch()` tone patches (flank `976–979`, jaw `1209–1212`) deleted;
  every surface a trilayer with `stroke.sheet`; cloak gouache at poster 3 with a
  decided shadow tier; hood-rim and cuff edge-wear; authored amber eye glints
  (painted, not speculars); hem follow-through per motion §3.2.
- **The d20** — jewel treatment: dieBone gouache, painted numerals, worn edges, one
  authored glint; real inertia on the tumble; the nudge stays the film's most
  polished animation (motion §11). Shares geometry (`dieGeometry.ts`, shipped).
- **The lantern kit** — lamppost, hand lantern, campfire, candle, hearth, tavern
  lamp: one flame lathe set + glass tiers + amber glow, six mountings.
- **The carpenter's pencil** (exists in the hero) — returns at C6 margin and endcard.

**SET TIER (the five sheet kinds, §3)**
- Ambush plate (night): hero rock, outcrop, hearth ring, logs, camp kit, cliff base.
- Path ribbon plate: the winding track, cave mouth + door, chest, signpost + board,
  perch tree + branch, 40+ trees from the flora kit, mushroom clusters.
- Theatre cutout: planked disc + rim, **the brass drawing pin at its hub**, forest
  half, snow-mountain half (least-painted grammar), rope + capstan; understage
  machinery in graphite (freeze-visible only).
- Tavern model box: three walls + framing + window, hearth, table + benches, bar
  shelf + bottles, DM screen, character sheets, mugs, tankard, candle, door.
- Cliff plate: tiered cliff, tended set (cairn + mushrooms), remains set (arrows,
  scorch, shield), talus.
- Six study plates (montage): map sheet + quill + inkpot + roadLine; monster
  (repainted mass — see §13/S6); tavern-sign wall fragment; tree trio + stump;
  chest + hoard; long table + three candles + book.
- **The table entire (C6/C7, new):** the one asset my pressure adds — the full
  working surface seen at the rise: all plates in place, continuous grid ghost,
  2–3 tools at the far margin, sheet edges and one tape tab. Replaces v1's generic
  `miniWorld` houses/mountain/fields as the "whole world" (the flatten's cast —
  houses-to-icons etc. — lives ON its far plates).
- The board: the authored Good Goblin map (product-true), S8.

**FLORA KIT** — pine (3 sizes), oak (2), sapling, stump, snag, fern, grass tuft,
sprig, mushroom (the caps-in-threes signature) — all poster-tier crowns, sheet-basis
strokes, built once, instanced across every plate.

**CAST (support tier)** — adventurer trio (cloakIndigo ×2, cloakCrimson ×1),
tavern patrons ×3, ravens ×3, the NPC "chess piece" figure — silhouette-first, low
detail by design, never chroma-louder than the goblin.

**GRAMMAR TIER** — the underdrawing layer on every asset (free with trilayer); grid
ghost under every plate; **the travel line** (the self-drawing graphite path between
plates, §11); margin furniture (ticks, numerals, 66-tick ruler, skip note); particle
language — motes, moths, embers, pollen (Performance-only, freezable), plus one new
member: **eraser crumbs** — three tiny paper-coloured flecks at a sheet transition,
low-tier garnish, first thing shed on low tier.

## 10. Depth — two languages, one per state

Shipped in the material and kept: **Performance depth is atmospheric** — distance
ramps the lit result to `paper`, never grey (`uTriNear/uTriFar`); backdrop flats are
honest theatre sheets (allowed for atmosphere, banned for solid matter); shallow
tilt-shift DOF at exactly two moments (die close-up, C6 table reveal — where the
scale-flip IS the story). **Prep depth is graphite** — line-weight falloff (far
strokes fainter, more paper), foreground occluders near-black silhouette
(`uTriSilNear`), no fog, no DOF.

The table sharpens the flats: parallax backdrops are literal **cut sheets standing in
slots** — at any freeze their sheet-nature is visible in graphite (an edge, a brace).
Depth in this film is the depth of a maquette: three to five real planes you could
reach between, never videogame draw-distance. The camera proves depth by moving past
plate edges (occlusion), not by haze quantity.

## 11. Motion language — what the body does with the two clocks

Architecture shipped (`world.t`/`timeScale`, `gobT` never stops, scrub owns time,
three ease lanes, the seven named transitions). The body's dialect:

- **Sheet handling rides the scrub lane.** The montage's page-turns, S1's two cuts,
  and the S4→S5 walk-through are physically staged as table moves — a study plate
  slides under the frame on the paper flash; the walk-through passes under an
  overlay sheet's shadow — but they remain the shipped transitions (page turn,
  walk-through) with their rules. No new grammar names; the table is how the seven
  transitions are *staged*, not an eighth.
- **The travel line.** Between plates the goblin runs on bare paper along a graphite
  line drawing itself ~1.5 world units ahead of him, scrub-tied — reverse scroll
  un-draws it behind his heels. His contact shadow is the only shadow on the void
  (the alive-shadow rule doing narrative work). Rest anchors never land mid-void.
- **The world clock's cast per stage** stays explicit: flames, embers, moths, motes,
  cloth, clouds, water glints, candle pools — all freezable by construction; the
  tick stops them same-frame. The goblin's gait/breath/acting on `gobT`, plus his
  pencil-scritch idle at the hero — he is alive by construction.
- **Weight where the story needs it:** the theatre turn keeps its 0.35s input
  smoothing (perceived inertia — motion §11); the die tips like a jewel; the flatten
  is scrub-tied both directions and is the most repeat-scrubbed moment on the site.
- **The boil** stays UI-side only (margin, lettering, CTA offset border) at ≤0.8px;
  world strokes never boil (the stroke tiles are baked, still, and that stillness is
  what freezes read against).
- Reduced motion: the full mapping in motion §14 — stepped picture book, fades for
  write-ons, A=0 stillness, live matchMedia (the shipped rigs already do this;
  `rigs.ts:42–51`).

## 12. Conversion — hand them the pencil

At t66 the visitor must **understand**: map editor and live table are one surface, and
the prep that makes worlds feel alive is what this product does for a DM. They must
**feel**: seen backstage — *I want to be the DM this goblin works for.* The single
action: **JOIN THE DISCORD**.

The endcard is copy-spec direction C, untouched: wordmark, tagline, subline, CTA
lettered on the board, no box, per-glyph halos, the locked entrance choreography. The
CTA performs the film's grammar — drawn graphite at rest, amber touch-light on
hover/focus, the die rolls 20 on click (experience §8).

One staging proposal (art, not copy — flagged for sign-off): **the carpenter's pencil
from the hero lies at rest in the board's top margin**, outside the endcard stack,
pointing at nothing. The film opened on the maker holding it; it ends with the pencil
set down on your side of the table. Nobody needs it explained; the SR document doesn't
mention it; if it crowds a breakpoint it is cut on that breakpoint without loss.

Secondary paths (skip note from t16.5, replay) and the no-analytics stance per the
experience doc. `DISCORD_URL` stays the single wired constant.

## 13. Stage by stage — what changes vs `world.ts`, and the assets

Per stage: **Now** (what v1 does, cited), **Becomes**, **Assets** (R = redesign of an
existing build, N = newly authored). The camp-split gate (`world.ts:1757–1761` /
`timeline.ts:141`), the board-material contract (`world.ts:4319–4383` /
`timeline.ts:918–928`), and the Node-safe stage-module rule (RECON §1
`puppet.check.ts`) bind every migration.

**S1 — THE CLAIM (t0–10.2).**
Now: ambush set on the infinite earth plane (`buildGround`, `2242–2246`), rock-face
hatch tone (`1567–1575`), flat-fill treeline rows (`1653–1717`), band-plate horizon,
decal firelight. Becomes: the **ambush plate** — a night island under the lamp pulled
low; one fire, real indigo air (skyDusk), embers on the world clock; treeline from the
flora kit with committed canopyDeep masses; cloud flats as visible cut sheets; the
cliff base rising off the plate's far edge. The bolt/arrow impacts stay ray-burst
grammar in rayGold. Assets: ambush plate (N), hero rock + outcrop (R), hearth ring +
logs + camp kit (R), flora kit pines/oaks (R), cloud/streak sheets (R), adventurer
trio (R), fire kit (R).

**S2 — THE ADDRESS (t10.2–16.5).**
Now: the freeze happens over the same infinite ground; goblin carries hatch tone;
dust is a decal. Becomes: the first freeze lands on the plate's underdrawing — strata
in contour, construction ellipses, the grid ghost fading in under the sheet
(trilayer Prep side, free); dust puff as graphite scribble (authored stroke sprite,
frozen); the goblin repaint (hero tier, §9) casting the only shadow — `aliveShadow`
committed harder here exactly as the hero rig allows (`trilayer.ts:65`). Assets:
goblin repaint (R — the headline item), dust scribble sprite (N).

**S3 — PROOF OF LIGHT (t16.5–26.5).**
Now: `buildPathProps` (`1800–2216`) over two infinite planes with `crossHatch` cave
mouth (`1910–1972`); 44 flat-fill trees (`2336–2390`); sun disc + rays. Becomes: the
**path ribbon plate** — a winding diorama whose road ends where the pencil line stops
(the hero's own island promoted to a long ribbon); all seven prop beats kept on their
timeline marks; the lantern catch is the thesis image — amber pool blooming through
graphite, trees taking their paint back with shadows arriving (the shipped touch-reveal
+ markCaster release, run forward). Kill the sun disc: morning is the lamp at
C2 colour + skyDay air. Assets: path ribbon plate (N), lamppost/lantern (R, hero-tier),
cave mouth + door (R, crossHatch deleted), chest (R), signpost + board (R), ravens ×3
(R), perch tree + branch (R), mushrooms (R), flora kit fills the ribbon (R).

**S4 — PROOF OF SCENERY (t26.5–36).**
Now: `buildTheatre` (`2591–2884`) — disc with flat fills, mountain with snow caps +
rock tone. Becomes: the **pinned cutout** — a brass drawing pin visible at the disc's
hub (the pin IS the pivot; the machinery flicker shows capstan + counterweights in
graphite, ≥0.8t, ≤1 breath per experience §6); forest half full trilayer; the
mountain half in the **least-painted snow grammar** — backstage is barely painted
because it hasn't been played yet; the rope + capstan redesigned as jewel-adjacent
props (the visitor's scroll is this rope). Assets: theatre disc + kerb (R), brass pin
(N), understage machinery set (N, graphite-only), snow mountain flats (R), rope +
capstan (R), scree + foot pines (R from kit).

**S5 — PROOF OF TIME (t36–50).**
Now: `buildTavern` (`2921–3388`) — a four-wall room with crossHatch window/firebox
(`3004–3037`, `3039–3082`), flat board fills. Becomes: the **model box** — a cutaway
maquette, three walls, sitting on the table; lamplight pools (candle + hearth glows)
carry the warmest, densest frame in the film; every surface trilayer (plank grain
stroke.dir, poster tiers); the die close-up is jewel-tier with painted numerals
readable at 390px (clarity contract #5); the freeze turns the room to underdrawing
mid-laugh with the grid ghosting under the floorboards. Assets: tavern model box (R —
restage as cutaway), table + benches (R), hearth + fire (R), DM screen + sheets +
mugs + tankard + candle (R), patrons ×3 (R), the d20 (R, hero tier), nudge finger (R).

**S6 — THE MANY JOBS (t50–57.5).**
Now: `buildMontage` (`3391–3880`) — six discs at z=−40; the monster's pelt is tick-
stroke shag clumps (`3478–3658`), tones are hatch patches. Becomes: **six study
plates** — small square work-sheets, one subject each, non-verbal draughting marks in
their margins (dimension ticks, an arrow, an X — no words, copy is locked); page-turn
cuts staged as plates sliding under the frame; the monster repainted as a solid
sculpted mass with one stroke family and poster tiers (its shag becomes decided
silhouette lumps, not strokes); vignette 0's map sheet is the film's first diegetic
paper-on-paper. Assets: study plate base ×6 (N), map sheet + quill + inkpot (R),
monster (R — second-biggest repaint after the goblin), sign wall + bracket (R),
tree trio (R from kit), chest + hoard (R), candle table + book (R).

**S7 — THE HANDOVER (t57.5–64.5).**
Now: `buildCliffWorld` (`3903–4386`) — crack-hatch plateau (`3934–3954`), generic
`miniWorld` houses/mountain, field till-hatch (`4265–4311`). Becomes: the same cliff
from S1's angle but **tended** (the bookend reads in half a second); then the rise —
and the reveal is **the table entire**: every plate of the film arranged on one
surface, tools at the far margin, the grid ghost continuous beneath all of it for the
first time, tilt-shift for one breath. The flatten presses each plate into its own
underdrawing and refills it with flat map colour — trees to canopies, the tavern box
folding flat to a room outline, roads to inked lines, fires to painted flame marks —
scrub-tied, flawless in both directions (the site's most repeat-scrubbed moment). The
die throw ends it. Assets: cliff plate (R), tended/remains sets (R), **the table
entire** (N — replaces miniWorld; the flatten cast lives on its far plates), tool set:
pencil + pin tin + eraser + tape tab (N, 4 props max), d20 flight (R).

**S8 — THE TABLE (t64.5–66).**
Now: `board` group — a GridHelper + rule loops over `boardFill` (`4319–4383`).
Becomes: the morph lands on a **real authored Good Goblin map** in the product's own
art style — the film's world as its map, product truth as the final material; endcard
per copy-spec direction C with the locked choreography; board breathes at whisper
scale at rest; the pencil at rest (§12, pending sign-off). The board's
material-locality contract holds (every material board-local, opacity-faded by the
timeline traversal). Assets: the authored board map (N — product art, the one asset
made in the product itself), endcard lettering SVGs (N, shared with §4's Hand set).

**Persistent interface (all stages).** The margin system, chapter numerals, 66-tick
ruler, skip note, play/pause/replay, captions — per experience §4, unchanged. All DOM,
never over a set piece. The one addition: at each chapter handoff the numeral's
cross-fade is accompanied by a single non-verbal pencil tick appearing on the ruler —
the maker keeping count. Whisper-tier, redundant, off under reduced motion.

## 14. What this is not / guardrails

Not a tech demo, not the scroll-through-a-world genre, not photoreal/pixel/flat-vector
(direction §13 binds). The ownable five carry forward, and the table adds a sixth:
**one working surface for the whole film** — the film's geography is a bench, revealed
whole exactly once. No liquid chrome, no tunnels, no wireframe cities; the flex is
paper, paint, pencil in real 3D with two rendering truths.

Hard gates honoured by construction: no hatching (the trilayer's one-family stroke
tiles; every v1 hatch call retired per stage); paper/ink/amber/pip discipline (§5);
NoToneMapping — everything judged flat; t=66 gearing and stage boundaries untouched
(this direction restages art, never time); no spinner (the entrance is the loader);
reduced motion + keyboard per experience §9 / motion §14. Nothing deploys; `story/`
stays uncommitted; build starts only after its plan is approved.
