# Tabletop rebuild — development plan, beat by beat

2026-11-11 · Script: `docs/2026-11-06-script-v2.md` (unchanged unless a beat review says otherwise).
Replaces the art and look of `story-v1/`. The scroll shell stays.

## 1. The feel

A visitor should feel they are at a real game night with a living world on the table.

**One world, two distances.** The same models, paint and light are used everywhere. Camera distance decides how
they read:

- **Far = tabletop.** A low-poly set on a wooden table, lit by the room's lamp, focus shallow like a macro photo.
- **Close = in-world.** As the camera pushes in, figures breathe and move, the island's own sky comes in round it,
  focus widens.
- **Before the table = afloat** (decided 2026-11-21). The page opens on the island hanging in open sky. Docking
  (Beat 1) is where the two meet: the goblin hauls it in, the sky thins away, and the table, its battle grid and
  the lamp's light arrive under it. Both the sky and the table are built; neither replaces the other.

Game overlays (nameplates, threat rings, turn pill, damage numbers) are one DOM design used in both.

## 2. Decisions made (2026-11-11)

| Topic | Decision |
|---|---|
| Island | Complete rebuild. Nothing of the shipped pencil island is kept. |
| Style | One style throughout. No pencil freeze, no particle dissolve. |
| Modes | Tabletop for everything; in-world only when the island is pulled close. |
| Living characters | Start with the goblin fully animated, plus 4 party members and 3 monsters with an idle and one action each. Extend later if it looks good. |
| Goblin | New goblin. The Backstabber FBX in `assets/` is not used. |
| Outside assets | Free CC0 model packs (KayKit, Quaternius, Kenney) and Poly Haven textures and lighting environments. Nothing paid. |
| Animation | Keyed by script in Blender to start. Revisit if motion reads stiff. |
| Blender | Python scripts (Blender 5.2). Since 2026-11-21 they are run in the open Blender session through its bridge (`blender/live.mjs`), by request; the older ones still run headless. |
| New packages | `postprocessing` (depth of field, glow) and `@gltf-transform/cli` (model and texture compression). |
| Table and sky | Both (2026-11-21). The island floats in its sky for the hero and docks in Beat 1; close up, the sky returns round it. Until Beat 4 it docks onto the map sheet only, which fills the backdrop: no wood, candles or pencil. The wooden table is the room's, and is first seen in the pull-back, under the laptop. |
| Rope | The goblin ties it off on the signpost (2026-11-21), as the script has it. The bollard built with the table set is not used in beats 1 to 3. |
| Figure bases | None (2026-11-21). Figures stand on the ground they are on. |
| Dice gag | The freeze is the loading animation's line drawing, not grey miniatures (2026-11-21): the world goes back to pencil, the goblin stays in colour, and the paint sweeps back when he tips the die. |
| Review | One beat at a time. Each beat is shown and judged before the next starts. Anything can be kept or dropped at its review. |

## 3. Style rules (what keeps it one style)

1. One palette, defined once and used by every texture.
2. One treatment, locked on 2026-11-21: bold low-poly. Every surface is flat facets with one colour a face, from
   one palette (`LOWPOLY` in `blender/world_assets.py`), baked into vertex colour. No textures, no wash, no
   outlines. The benchmark images are in `blender/out/refs/target/`. (Before the lock this rule was a painted
   miniature's base coat, wash and edge highlight.)
3. One key light direction in every beat. Day and night are two bakes of the same set.
4. No figure bases (dropped 2026-11-21). A figure's feet are on the island, the table or the map.
5. One overlay design for nameplates, rings and pills.
6. The dice gag freeze is in the entrance's language (`story-v1/src/island/blockout.ts`): the world drops back to
   its pencil line drawing, the goblin stays in colour, and the paint crosses again when he tips the die.

## 4. Pipeline

```
blender/                     Python build scripts, one per set or character (source of truth)
blender/out/*.glb            exports (not hand-edited)
story-v1/public/models/      compressed models and textures the site loads
story-v1/src/stage/          the existing clock, director and camera, now driving loaded models
```

- **Blender makes:** geometry, painted textures, baked light (day and night), baked physics, keyed animation, the
  camera path.
- **three.js shows:** loaded glTF with baked light, animation clips set by scroll position, depth of field and
  glow, the DOM overlays.
- **Scroll rule (kept from story-v1):** everything scroll-driven is a pure function of `u`. Baked clips are stepped
  with `mixer.setTime(f(u))`, never played.
- **Match check:** each beat has a target frame rendered in Blender. The three.js frame is compared against it so
  the site does not come out weaker than the render.
- **Budgets:** 60 fps at 1440×900 on a 2020 laptop; total model and texture download under 15 MB; phone
  (390×844) checked at every beat review, not at the end.

### Kept from story-v1
`clock.ts` (scroll ↔ u map), `director.ts`, `state.ts`, `bus.ts`, the load gate, first-visit and return-visit
modes, `WaitlistCard`, the after-sections and footer.

### Replaced
`src/hero/**` (7,600 lines of the old island and goblin), `src/art/**` (line-drawn props), `stage/world.ts`,
`stage/actor.ts`, `stage/choreo.ts`, the SVG people cards.

## 5. Steps

Each step ends with frames at desktop and phone size and a verdict from Nayan: keep, change or drop.

### Step 0 — Look proof (blocks everything)
- Blender: one island (terrain, signpost, campfire, tree, lantern post), repainted to the style rules, lit and
  baked. One candidate goblin and one party member chosen from the CC0 packs.
- Output: **two still frames of the same island**, tabletop distance and in-world distance, rendered in Blender.
  Plus a sheet of goblin candidates to pick from.
- Question to answer: do the two frames read as one world, and is this the quality bar?
- No site code in this step.

**Draft 1, 2026-11-11: vision kept, art rejected.** Verdict: "the vision is what I like not the art quality so
much. This looks like small 3D clay models not really like TTRPG / D&D or MMORPG feels." The goblin has to be
better too, and everything needs more attention to detail. The bar is two images kept in `blender/out/refs/`: a
hand-painted overgrown stone circle (glow, deep cool shadow, big painted leaves) and a top-down inked battle map
(line work, cracks, stains, warm window light). So "far" means battle-map art, not a photo of miniatures.

**Draft 2, 2026-11-11: rejected.** `step0b_map.png` (the island as a battle map, three-quarter
top-down on a parchment grid) and `step0b_inworld.png`, in `blender/out/step0/` with `index.html` to view them
beside the bar images. What changed: foliage built leaf by leaf, grass, ferns, bushes and flowers, worn paving
round the fire, a waystone with a glowing rune and broken pillars, tent and camp gear, drawn grain and cracks in
the materials, ink outlines, a brush filter, a low warm sun against cool shadow. The figures are still pack
models and are the part furthest from the bar.

```
blender -b --factory-startup --python blender/look_proof.py -- map <out.png> [samples] [width] [height]
blender -b --factory-startup --python blender/look_proof.py -- world <out.png> [samples] [width] [height]
```

Style rules 2 and 4 change with this: the paint treatment is now painted patches, drawn detail, cool shadow wash
and ink outline; draft 1's photographed table, dice and macro focus are dropped. `goblin_sheet.py` and
`tabletop.py` are draft 1 and have not been rerun.

**Draft 2 verdict:** "why does this somehow look worse?" More small detail at equal contrast read as noise, and
outlines with a paint filter over low-poly models read as a cheap mobile game. The cartoon packs were then ruled
out as a base ("too bright bold and cartooney"), and raw photo scans as "a bit too life like and photograph, can
make a little bit like say BG3". The asset board in `blender/out/refs/real/` was accepted as the register.

**Draft 3, 2026-11-11: rejected.** Verdict: "this is too realistic and bad. We gotta make them more game-y like
indie mmorpgs. Change all art accordingly in one pass." What it was: `step0c_map.png`, `step0c_inworld.png` and
`step0c_goblin_candidates.png` in `blender/out/step0/`, with `index.html` to view them.
- **Register.** Scanned Poly Haven models and textures (CC0) with a game-art pass (`gameart.py`: photo grain
  softened, colour pulled to a chosen palette, darker bases and creases, calmer highlights), a low warm sun, a
  dawn landscape behind, and a fire that lights the camp. No outlines, no paint filter.
- **Tabletop frame.** The island hangs just over an inked map sheet on the table: ruled five-foot grid, double
  border, contour rings, torn edges, two bone dice.
- **In-world frame.** The same scene file and light from head height.
- **Goblin.** Three new candidates built from an open human base (MakeHuman through the MPFB add-on, output CC0),
  reshaped to goblin proportions, about 1.12 m, fully rigged. A (apprentice, orange kerchief) is the lead and
  stands in both frames. He is not yet at the bar close up: the face is a reshaped human, not a sculpted creature.
- **Review.** A separate, strict reviewer scored each round on six checks (not a photo, not cartoony, materials,
  palette, light and form, cleanliness), pass mark 4 of 5 on all six, three rounds at most. Both frames ended at
  4 on five checks and 3 on cleanliness. What costs the last point: the goblin's face and hands, the flame, the
  noisy tree crowns, the island's shadow on the sheet.

**Draft 4, 2026-11-11: rejected.** Verdict: "goblin 0/10 world/island 6/10 - the goblin etc looked better in
draft 1 than any other drafts, more D&D like." What it was: `step0d_map.png`, `step0d_inworld.png` and
`step0d_goblin_candidates.png` in `blender/out/step0/`, with `index.html` to view them.
- **Register.** A stylised game world: Quaternius kit models (CC0) with chunky shapes and painted surfaces, every
  kit material pulled to one natural palette and grounded (`camp.py`, `dress()`), a painted two-colour sky with
  layered hills and clouds, clear daylight, painted flames. No photo scans in the island and no photo backdrop.
- **Layout.** Unchanged from draft 3: fire in a stone ring, bench and seat log, signpost, lantern post, table
  corner with chest, barrels and banner, anvil and axe, cobbled path, twisted tree.
- **Tabletop frame.** The island and its stone ledge over the inked map sheet, with two game dice.
- **Goblin.** Redesigned as a game character on the same base and rig (`goblin_game.py`): head a third of his
  height, big eyes, thick ears, painted olive skin, painted cloth. A (apprentice, orange kerchief) leads.
- **Review.** Same reviewer, new bar (stylised indie MMORPG; not toy-bright, not clay, not photographic). After two
  rounds both frames score 4 on five checks and 3 on "one style throughout"; goblin A scores 4. Not yet in the
  style: the thin grass blades, the flat far hills, the map sheet, the flame, the goblin's smooth skin and tunic.

```
node blender/fetch_polyhaven.mjs tex:<id>[:<res>] hdri:<id>[:<res>]      # restores Poly Haven textures and skies
blender -b --factory-startup --python blender/camp.py -- map <out.png> [samples] [width] [height]
blender -b --factory-startup --python blender/camp.py -- world <out.png> [samples] [width] [height]
blender -b --factory-startup --python blender/goblin_game.py -- build|sheet ...   # needs the MPFB add-on installed
```

Drafts 3 and 4 change section 2 and section 3: style rule 2 (flat hand-painted miniature colour on repainted
pack models) is now "painted kit models held to one palette", and the figure base of rule 4 is gone. Those
sections are left as written until a draft has a yes. `camp.py` now builds draft 4 only; draft 3's frames are kept
as images. `goblin.py` is the realistic draft 3 goblin. `look_proof.py`, `island.py`, `paint.py`, `tabletop.py`,
`goblin_sheet.py` and `figures.py` belong to drafts 1 and 2.

**Asset hero drafts, 2026-11-11, accepted** ("All good enough except the Island Wedge"). After draft 4 the direction was set in three answers:
keep draft 1's animation rig but redo the goblin's art as "a dnd animated/painted goblin and less like a cartoon";
keep draft 4's camp layout and map sheet but rebuild the world from low-poly pieces in the minis' family; and hold
light, painted surface detail, colour depth and posing work "until asset hero drafts are finalised".
`blender/out/step0/assets.html` shows both sheets.
- **Goblin** (`goblin_mini.py`, `step0e_goblin.png`, `out/lib/goblin_mini.blend`): the KayKit hooded rogue rig,
  re-proportioned to about three and a half heads, with a new sculpted head riding the head bone and leather gear
  riding the body bones; base coat, wash and drybrush. All 76 clips still pose. Reviewer: 4 of 5 on five checks,
  3 on the stock poses. The paint is a render-time shader and needs baking before export.
- **World pieces** (`world_assets.py`, `step0e_world_assets.png`): one hero piece per island element from KayKit
  Hexagon and Dungeon, softened MegaKit pieces and parts built here, under one paint treatment; pick-one pairs for
  hero tree, rocks and grass. Flat colour by design while the hold is on, so it sits below the goblin's finish
  (reviewer: 2 of 5 as a set with him).
- **No more human-base goblins.** Both MakeHuman goblins (`goblin.py`, `goblin_game.py`) are dead ends.

**Step 0 in the locked look, 2026-11-21, waiting for a verdict.** The look was settled later than this step, on
the hero itself (see "Art benchmark" under step 2). These are step 0's two frames in that look, with the low-poly
goblin: `blender/out/look/step0_far.png` (the island whole, hanging in its sky) and
`blender/out/look/step0_world.png` (head height by the fire).
`node live.mjs run live_island.py GG_STEPS="stand render" GG_NAME=step0_world GG_STAGE=sky GG_VIEW=world` makes
the second; `GG_VIEW=hero` the first.

What was open, and how it was settled on 2026-11-21:
- **Far was not a tabletop.** Settled: build both the table and the sky (section 1, "Before the table"). The table
  set is the work below.
- **A party member.** The four are built (`blender/party_lp.py`, `out/look/party_lp.png`): a tiefling warlock, a
  half-orc fighter, a dark elf monk and a human bard, on the goblin's method. Verdict: "They look fine". Stills
  only so far: no clips tried, not exported.
- **Style rules 4 and 6.** Settled: no bases; the dice freeze is the line drawing (section 3).
- **A fetch script for the kits.** Agreed; it is the work below.

#### Table and sky, and the fetch script: the work that closes step 0

Blender only, in the open session through `blender/live.mjs`. No site code: how the page gets from sky to table is
Beat 1, and waits on a verdict on these frames.

1. **The table set** (new kit pieces in `world_assets.py`, faceted like everything else):
   - a round wooden table top, big enough that the island is a model on it (the island about a third of its width),
     planked, with a worn edge;
   - a battle-map sheet on it under the island: paper, a ruled five-foot grid, a border, torn or curled edges
     (draft 3's and 4's sheet in `camp.py` was liked; this is that sheet in the locked look);
   - what a table at game night has on it, a few pieces only: dice (the kit's d20), a pencil, a candle or two;
   - a mooring for the island: a peg or cleat on the table and the rope the goblin hauls on, so docking has
     something to end at.
2. **The docked stage** (`GG_STAGE=table` in `assemble.py`): the island hanging low over the sheet, casting its
   shadow on it, clouds gone; warm lamp light from above as the key, in the same direction every other stage uses,
   the room dark beyond the table. The sky stage stays as it is. The table's pieces are placed by this stage, not
   added to the island's own instances in `layout.json`: the site builds everything in that list, and the hero must
   not gain a table before Beat 1. The camp's small table already owns the slot name `table`, so the new pieces
   take other names (`tabletop`, `map_sheet`, `mooring` and so on).
3. **Frames** in `blender/out/look/`: `step0_table.png` (tabletop distance: the whole table top with the island on
   it), `step0_table_near.png` (three-quarter, the island filling the frame with the sheet and the mooring in
   view), and `step0_dock.png` (the moment between: the island still high, sky above, table below, so the two
   can be judged in one frame).
4. **The fetch script** (`blender/fetch_kits.mjs`): restores every pack under `blender/vendor/` that the current
   build scripts read, from where it came from, pinned to what is there now (commit for the cloned packs, URL for
   the zips). A `--check` mode proves every source still answers without downloading the packs. Packs whose
   licence forbids redistribution are fetched, never committed. `fetch_polyhaven.mjs` stays as it is.

Done when: the three frames exist and read as the same island and look as `step0_far.png`; a strict second look
at them finds no smooth-shaded, textured or untinted surface; `node blender/fetch_kits.mjs --check` passes; one
small pack fetched into an empty folder matches what is in `vendor/`; the kit's manifest and layout still build
the sky stage unchanged.

**Built 2026-11-21, waiting for a verdict.** `blender/out/look/step0_table.png`, `step0_table_near.png` and
`step0_dock.png`, each with a small JPEG beside it.
- **Table set** (`world_assets.py`, five new slots, exported to `out/kit/`, not in `layout.json`): `tabletop` (a
  round top 32 m across in the island's metres, fourteen planks with the grain in long facets, dark gaps, a worn pale
  chamfer with knocks), `map_sheet` (12 by 10 five-foot squares inside a double border, every line a strip of faces,
  ink faded where the nib ran dry, torn and handled edges, two corners curling up), `pencil`, `candle` (lit, with its
  own light) and `mooring` (a bollard bolted to the table, rope wound and coiled, a `line` part one metre long and a
  `stake` part; the manifest's `stake_tie` says where on the stake the line ties). The dice are the layout's two
  d20s, now faceted like everything else (they were the one unfaceted piece).
- **Stages** (`assemble.py`): `GG_STAGE=table` hangs the island over the sheet with no clouds, the key a warm spot
  lamp along `KEY_DIR` whose pool ends at the table's rim, the room near black. The stage drives the stake into the
  island's turf near the front rim and turns and stretches the line to it. `GG_STAGE=dock` is the sky stage
  untouched with the table set 16 m further down (`DOCK_LIFT`). New views `table`, `near` and `dock`.

```
node live.mjs run live_island.py GG_STEPS="stand render" GG_NAME=step0_table GG_STAGE=table GG_VIEW=table
node live.mjs run live_island.py GG_STEPS="stand render" GG_NAME=step0_table_near GG_STAGE=table GG_VIEW=near
node live.mjs run live_island.py GG_STEPS="stand render" GG_NAME=step0_dock GG_STAGE=dock GG_VIEW=dock
node blender/fetch_kits.mjs --check
```

Checked: every mesh in the stood table and dock scenes (goblin included) is flat-shaded on the facet material with
its `Col` colours, or a flame, with no image textures. After a full `GG_STEPS=kit` rebuild, `layout.json` is
byte-identical, every GLB other than the d20 is byte-identical, the manifest gains the five slots and nothing else
changes but the faceted d20's footprint, and a sky
hero render matches `step0_far.png` pixel for pixel (`out/look/step0_far_check.png`). `fetch_kits.mjs --check`
passes. The Dungeon pack fetched into an empty folder is byte-identical to `vendor/` (848 files). The KayKit packs
are cloned at their pinned commits, not taken as GitHub archives, because their `.gitattributes` leave most files
out of an archive. Not checked: a real download of the 104 MB Stylized Nature zip (its unzip code was checked
against a GitHub archive), and the other two KayKit clones. Not covered by `fetch_kits.mjs`: Skeletons, Poly Pizza,
MakeHuman, and the Fantasy Props, Medieval Village and animation packs, which only older drafts read, or nothing
does. Poly Haven is
left to `fetch_polyhaven.mjs`, but the plain stage's `wood_table_worn_*.jpg` sit in the `polyhaven/` root, where
that script does not put them.

What step 0 found:
- **Kits and the open human base cover the world and the goblin for free.** The kit zips and the scanned
  textures were partly fetched by hand; `fetch_polyhaven.mjs` covers Poly Haven textures and skies only, so a
  fetch for the kits is still owed.
- **Packs.** KayKit Adventurers, Skeletons, Dungeon and Medieval Hexagon (CC0, cloned from GitHub into
  `blender/vendor/`), eleven creature models from Poly Pizza (CC0, mostly Quaternius), Poly Haven table wood and
  room light. `blender/vendor/` is not in git and there is no fetch script yet; that is owed in step 1.
- **Animation is mostly solved for the cast.** Every KayKit adventurer and skeleton shares one rig with 76 clips
  (idle, walk, interact, pick up, throw, sit, lie down, cheer, attacks, hit, death). The party and the skeleton
  monsters need no keyed animation. A goblin built on that rig (candidates A and B) gets all 76 clips; the
  Quaternius candidates (C, D, E) have 14 or 15 clips and a different rig.
- **Goblin candidates.** A: KayKit hooded rogue made goblin (green skin, ears, smaller, bigger head, hood in the
  brand orange). B: the same without the hood. C: Quaternius orc. D: Quaternius demon recoloured. E: Quaternius
  block goblin. The proof frames use A.
- **Choices made in the frames that are open to a no:** the island stands on a rock stem set in a large version
  of the figure base (dark, brass rim); the battle grid is a pencil grid on a paper sheet on a wooden table; the
  monsters waiting beside the map are the three skeletons; the lantern is unlit by day.
- **Render cost.** Under a minute a frame at 2880×1800 on the RTX 5070 Ti, so look changes are cheap to try.

### Step 1 — Pipeline proof

**2026-11-11, waiting for a verdict.** `story-v1` at `/?island=1` (`src/island/IslandProof.tsx`) loads the kit from
`public/models/kit/` (manifest, layout, one GLB per piece, 6.0 MB uncompressed with the goblin), builds island a
from them under the Blender tabletop camera, and overlays the Blender frame on the B key. Standing pieces are
merged per material: 286 draw calls, 80 fps on the build machine (RTX 5070 Ti), not yet measured on a 2020 laptop.
`&play=1` runs every piece's loop clip unmerged (about 3,460 draw calls). Camera, layout and pose match the
Blender frame; the surfaces do not yet, because the wash, drybrush and ground mottling are render-time shaders in
Blender and are not baked into the files. Not done on purpose: wiring into the scroll story, compression, depth of
field and glow.
- Export the step 0 island to glTF, compress it, load it in `story-v1` in place of the old hero.
- Add depth of field and glow.
- Check: the three.js frame matches the Blender frame; 60 fps; download size.

### Step 2 — Beat 0, the hero

**2026-11-11, waiting for a verdict.** The kit island is the hero on the real homepage (`/`): on the paper sheet
with the wordmark, tagline and scroll hint as they were, afloat with a slow bob and drift, turning with the
pointer through the existing hover, the goblin looping `idle_alive`. `src/stage/Stage.tsx` draws it while
`u < 0.06`; `src/island/kit.ts` loads it, and the load gate waits for it. Scoped to that on request. Known gaps:
the first scroll cuts to the old pencil island, since beats 1 to 5 are not rebuilt; the old hero's entrance
animation and its pointer reactions still run unseen underneath; macro focus, the head following the cursor and
the three idle acts are not done; the phone size was not checked. `/?island=1` is the bare island and
`/?island=1&proof=1` step 1's match view.

**Later on 2026-11-11: the draft was accepted ("looks okay for the draft"), and an entrance was asked for**, "from
barebones to map island", after the old hero's sketch-to-colour seam. Built, waiting for a verdict
(`src/island/blockout.ts`): the page opens bare, the island is drawn as a pencil blockout (plain stand-in solids
sized from each piece's manifest bounds, the old film's hand from `pencil.ts`, pencil tone on the ground), then
paint crosses it and each piece pops out of its stand-in; about 3.4 s, ending on the finished island. It is an
entrance, not a second style and not the dice-gag freeze. `/?draw=0..1` holds it at one point. Under reduced
motion it is skipped. Not checked: the phone size, a slow laptop.

- The island floating over paper, macro focus, slow drift, hover rotation.
- Goblin: idle, head follows the cursor, three small idle acts.
- Wordmark, tagline and scroll hint restyled to sit with the new look.

### Art benchmark — low-poly pass on the kit

**2026-11-21, waiting for a verdict.** Nayan finalised the art benchmark: three reference images of this island as a
premium stylised low-poly diorama (`blender/out/refs/target/`), with the instruction to keep placement and
proportions and improve geometry, material variation, vegetation density and lighting. This replaces style rule 2
(wash and drybrush) for the world pieces.
- **One treatment, baked.** `world_assets.py` runs every module through `facet()`: one colour a face (from the
  builder, a pack texture or the material), nudged per face and lit a little from above, flat shaded, written to
  vertex colour under one `facet` material. The GLBs carry it, so the earlier gap (paint as a render-time shader)
  is closed for the world pieces. `FACET = False` restores the painted treatment and its palette.
- **New default variants (`lp`).** Hull-built tree crowns, bushes and rocks, a tiered pine, one-mesh grass tufts,
  daisies, and an island with a thick lip, hanging grass and a slab of boulders underneath. New slots: `mushroom`,
  `rubble` (floating chunks, with a `float` clip). Every earlier variant is still in the kit.
- **Layout.** Nothing moved. The round pine on the right is now the tiered pine at the same spot; added two small
  pines, 170 grass tufts (320 in all), 18 flower clumps, 5 mushrooms, 2 bushes and 12 floating chunks.
- **Stage.** `assemble.py`: `GG_STAGE=paper` (warm paper, low warm sun, cool sky, bloom) and `GG_VIEW=hero`.
- **Run in the open Blender session**, at Nayan's request, through the MCP add-on's bridge: `node live.mjs run
  live_island.py`. Frames: `blender/out/look/island_hero.png`, `island_close.png`, `island_top.png`.
- **Not done.** The goblin is the painted mini as before.

**Later on 2026-11-21: the look passed** ("Passes yes minor changes later"), with two asks: the entrance must run
into the new island without a seam, and "its too bright make it little foggy cinematic and add the poly clouds and
bg". Built, waiting for a verdict:
- **Sky.** New `cloud` slot (two variants, a `drift` clip), six clouds in the layout. `assemble.py` has
  `GG_STAGE=sky`: a peach-to-pale-blue backdrop, a dimmer warm sun, and distance fading into haze through the mist
  pass. Frame: `blender/out/look/island_sky.png`. The paper stage is kept.
- **On the homepage.** The new kit is in `story-v1/public/models/kit/`. `Stage.tsx` draws the island in the same
  sky (a backdrop behind everything solid, fog from the island's near rim, dimmer lights); the stain on the paper
  is gone, since there is no paper under it.
- **Entrance (`blockout.ts`).** Stand-ins follow the new shapes (three-skirt pine, larger crowns, clouds and
  floating chunks; mushrooms get none). Far clouds are held inside the sweep so they are drawn and painted with
  the nearest rim. The sky comes in with the paint and unpainted ground stays bare paper. The fire and lantern
  light only once their piece has popped. Checked at `?draw=0.3`, `0.62`, `0.7`, `1` and on a plain load.
- **Not done.** The first scroll still cuts to the old pencil island on paper; the sky fades out just before it.
  Clouds, trees and fire do not move on the homepage (clips play only with `&play=1`). Phone size, reduced motion
  and frame rate on a real screen are unchecked: the automated tab ran the new hero and the old film alike at
  about 27 to 31 frames a second.

**Third round, 2026-11-21, waiting for a verdict.** Four asks: the fog local to the island and not the whole page,
clouds nearer the island, the entrance as a zoom out of the line drawing made with the dolly-rotate skill
(kevinbadi/blender-skills), and a first view from lower down.
- **Sky as a pocket.** The backdrop is a wash round the island that thins to the bare page before the page's edge
  (`SKY` in `Stage.tsx`); the haze on the pieces is unchanged.
- **Clouds.** Seven, all within about 7 m of the middle: behind the trees, beside the rim, one under it.
- **Camera move.** `blender/hero_dolly.py` builds the skill's rig in the open Blender session (a camera tracking
  and parented to a target, the target turned while distance and height change) and runs it outward: from 70° round,
  24° higher and 0.42 of the distance, to rest, over 3.2 s on Blender's Bezier easing. It is written to
  `out/kit/hero_dolly.json` relative to the resting pose, and `Stage.tsx` adds it to the page's own hero pose, so it
  lands exactly whatever the window. The lens is not keyed (the page's is fixed) and nothing is rendered to video.
- **First view.** `KIT_VIEW` in `Stage.tsx`: 3° round and 23° up, in place of the film's 18° and 33°; it eases back
  to the film's pose over the first scroll, to meet the cut.
- **Pencil tone** is laid out for the lens as it is when the drawing is whole (1.3 s in), since the camera now moves.

**Fourth round, 2026-11-21, waiting for a verdict.** Asked: drop the grey wavy tone, keep the drawing to edges with
comic pencil shading that follows the facets, and let the drawing start slowly so it is the loading screen.
- **Tone.** The wavy hatch is gone (and with it the sheet it was laid on). Each stand-in facet facing away from the
  light is hatched with straight strokes about a pixel wide, the darkest crossed; lit facets are bare paper. The
  black outlines are the old hand's, unchanged: a first pass thinned and greyed them and Nayan had them put back.
- **Loading screen.** `blockout.ts` now builds from the kit's plan alone (`manifest.json` and `layout.json`), so the
  drawing starts before the models load, on its own clock (2.4 s, slow to start). The island itself is drawn as a
  faceted slab. The paint has a second clock that starts once the models are in, the load gate has opened and the
  drawing is whole; the real ground is cut away ahead of the paint's edge and the drawn slab behind it, on the same
  edge. The camera creeps along the start of its move while the page loads and runs the rest with the paint.
- **Not done.** No slow connection was simulated: on this machine the models arrive before the drawing finishes.

**Fifth round, 2026-11-21, waiting for a verdict.** Asked: while it loads, the line drawing should keep randomising
(the lamp to something else, trees to something else, the terrain too) until the coloured island arrives; the change
of speed between the slow drawing and the fast paint read as a jolt and should be smooth; then, on seeing it, "it
becomes too fast, keep the speed slower at the end".
- **Rolling.** Every piece is drawn four ways: as itself, and as three other things of about its height (box, drum,
  pine, tree, dome, blob, post, fire), set a little off its spot and turned any way. Clouds and floating rubble keep
  their kind and only change shape. Each piece swaps every 0.8 to 1.4 s on its own beat, sketched in stroke by
  stroke, tone following. The island's slab is redrawn every 1.3 s with another coastline and depth. The rolls are
  seeded, so the same on every visit, and are a function of the clock alone (`?draw=` still holds a frame).
- **Settling.** The ground becomes the true slab as the paint starts; each piece becomes itself about 3 units of
  travel ahead of the paint's edge, so the real island resolves just before the colour reaches it.
- **Timing.** The pencil's first pass is 1.7 s, then at least 0.7 s of rolling before the paint may start (2.55 s
  in all, as before). The paint takes 3.2 s (was 2.2). The camera creeps ever slower while loading and never stops,
  then gathers speed over 1.4 s from that creep (no step), plays the rest of its move at 0.85 of keyed speed and
  lands about 0.8 s after the paint, on the move's own ease-out. Peak turn is about 28 degrees a second.
- **Not done.** Not watched at real speed by me: the automation tab was held to one frame a second by the browser
  (finished island included). Checked held frames, the type check, and the cost (41 ms to build, nothing per frame).

**Goblin and island motion, 2026-11-21.** The low-poly look is locked; these bring the rest of the hero up to it.
- **Goblin.** `blender/goblin_lp.py` rebuilds him in the island's look on the miniature's skeleton, so the six clips
  fit: about 5,400 flat faces, a big head with a hooked nose, tusks and yellow eyes, long cupped ears that curl up
  to a point, a pot belly, long arms, clawed hands and three-toed feet. He wears a rogue's hood (point on top, brim
  down over the brow) with a torn mantle, an open leather vest, patched breeches, a belt with pouch and rope, and
  wraps. Ears, lids, pouch and rope have their own bones. `GG_STEPS=kit` bakes the clips and writes
  `out/kit/goblin__lp.glb`, which the site now loads; `goblin__mini.glb` stays as the alternate.
- **Motion on the page.** `src/island/life.ts` moves the merged island in the vertex shader after each piece has
  popped: trees, pines, bushes, grass and flowers sway in gusts that cross the island, the banner swings and
  ripples, each cloud drifts on its own heading and pace, the fire's tongues lick and its lamps flicker.
  `src/island/fire.ts` adds faceted embers, bursts of sparks and a little smoke. All of it holds still under reduced
  motion.
- **Not checked.** The clips other than the idle are unwatched in motion; phone sizes; real-screen frame rate.

### Step 3 — Beat 1, docking

Plan agreed 2026-11-21. Script: `docs/2026-11-06-script-v2.md`, "Beat 1 · units 0–2". The kit island, which today
is only on screen for the first 0.06 of a unit, stays through unit 2; the old film takes over there, so the hard
cut moves from the first scroll to the end of this beat.

**What the visitor sees** (u is scroll in units of one viewport; everything is a function of u alone, so it plays
the same backward):

| u | The goblin | The island and the camera | Round it |
|---|---|---|---|
| 0 | idling by the fire | the hero as it is now, afloat | sky, clouds |
| 0–0.3 | walks to the near edge, takes up the rope that hangs there | the camera starts down and in | |
| 0.3–1.4 | hauls, hand over hand, heels dug in | comes down to the sheet; the camera comes down with it and closes in | the sky thins, the clouds lift away and out of frame; from about 0.5 the map sheet's grid is drawn in pencil across the whole backdrop |
| 1.2 | | | caption: **Every world needs a stagehand.** |
| 1.4–1.8 | ties the rope off on the signpost, dusts his hands | settles: seen from low and nearly level, the island as wide as the viewport, its near rim along the foot of it | the sheet takes its colour, as the island did in the entrance |
| 1.8–2 | walks to the middle of the camp | still | the sheet whole: paper, grid, border |

**The camera comes down, it does not rise** (corrected 2026-11-21; the script's "three-quarter top-down" is not
what is wanted). It ends where the old film's Beat 2 begins: low, close to eye level on the island, the island
zoomed in to the full width of the viewport, the sheet a flat plane running back to a level horizon behind it.

**Decided:** sheet only, no wood (see section 2); the rope ends on the signpost; the sheet arrives in the entrance's
language, pencil first and then colour.

**Blender** (open session, `blender/live.mjs`):
- The rope as kit pieces that can be scrubbed: hanging off the near edge at u 0, taut down and out of frame while
  he hauls, made fast round the signpost at the end.
- Goblin clips on `goblin_lp`, keyed like his six (`goblin_anim.py`): take the rope, haul (he has this), tie off,
  dust hands, and the two walks. Re-export `goblin__lp.glb`.
- The camera for u 0 to 2, keyed and written out relative to the hero's resting view, the way
  `hero_dolly.py` writes the opening move. This is the start of the one continuous path later beats extend.
- A sheet-only stage (the `map_sheet` piece grown to fill the backdrop, no table top, candles, pencil or bollard)
  and target frames at u 0.5, 1.2 and 2 for the match check.

**Site** (`story-v1`):
- `Stage.tsx`: the kit scene and its camera run to u 2; clips are stepped with `mixer.setTime(f(u))`, never
  played; the sky wash and the clouds leave with u; the wind, fire and embers carry on.
- The sheet's grid drawn then coloured, in `src/island/`, by the same means as the entrance where that fits.
- The caption at 1.2 through whatever the old film uses for captions.

**Not in this beat:** the wordmark (still out of the hero), the mouse turning the island and the goblin's head
following the cursor (Beat 0 items the script asks for), anything of Beat 2.

**Done when:** stills at u 0, 0.5, 1, 1.2, 1.6 and 2 on the way down are the same as at those values on the way
back up; the stills at 0.5, 1.2 and 2 sit beside their Blender target frames and are not weaker; u 0 and the
entrance are unchanged (`/?draw=0.7`, `/?draw=1`); nothing of the wooden table shows before unit 2; the same
stills hold at phone size (390×844); under reduced motion the beat still scrubs but nothing idles; the type check
and the console are clean; the frame cost is measured.

**Built 2026-11-21, waiting for a verdict.** One function of u in `blender/dock.py` (`beat`) says where everything
is; it is written to `public/models/kit/dock.json` (100 samples a unit) and the target frames are rendered from it.
- **Camera.** Keyed in Blender on the `hero_dolly.py` rig between the hero at rest and the old film's own dock framing
  of the kit island (`frameDock` in `stage/camera.ts`: 2° up, square to the island, rim 0.92 of the width, near rim
  at the foot; 1.04 and 0.9 on a phone). It is written as how far along it is (angles, log distance, look point), and
  the page solves both ends for its window, so it lands on the film's framing whatever the size. Still to 0.3, down
  and in through the haul, settled by 1.8; it never rises. The island stays level throughout.
- **Sheet.** `map_sheet` variant `wide` (38 × 32 squares, 1.07 MB), level under the island 1 m below its turf, so the
  camp sits on the grid and its rock goes under the paper. It comes up from 16 m below from 0.4 to 1.4, is drawn in
  pencil 0.5–1.4 (`island/dock.ts`: the entrance's hand and sweep coordinate) and painted 1.4–1.8 (the entrance's
  ragged edge, pencil under the colour). Toward the horizon it fades into the page between 18 and 33 m back, so no
  far edge is seen.
- **Rope.** `rope__a.glb`, one tube with two morph targets over its hang (haul, tied): hangs off the near edge at u
  0 (shown once the paint reaches the edge), runs through his hands and over the edge while he hauls, two and a half
  turns round the signpost's post at the end. Built in `world_assets.py` (`DOCK`, `rope_paths`).
- **Goblin.** New clips in `goblin_anim.py`: `take_rope`, `tie_off`, `dust_hands`; `haul_rope` now pulls forward and
  down, the way the rope runs. His route (fire, near edge, post, middle of the camp) is in `dock.json` with each
  clip's weight and time; the two walks are the walk cycle stepped by distance walked, so his feet stay planted. The
  page steps every clip (time scale 0, time set from u); the idle keeps its own clock and fades out by 0.05.
- **Found and fixed:** every clip in `goblin__lp.glb` was exported as the rest pose (NLA-track export); he now
  exports per action, so on the page he idles for the first time. That is the one change at u 0.
- **Also:** clouds lift up and out (`uAway` in `life.ts`), out of frame by about 1; the sky wash and haze go by 1.1;
  the bob settles by 1.4; wind, fire and embers run throughout. Caption starts at 0.9, whole by 1.2. A page that
  comes back mid-beat skips the entrance. Under reduced motion the canvas dips only at the cut at 2.
- Commands: `node live.mjs run goblin_lp.py GG_STEPS=kit ...`, then `node live.mjs run dock.py GG_STEPS="kit path"
  GG_U=0` and `GG_STEPS="stand render" GG_U=0.5|1.2|2`; copy `goblin__lp.glb`, `goblin__lp_manifest.json`,
  `rope__a.glb`, `map_sheet__wide.glb` and `dock.json` into `public/models/kit/` (the public `manifest.json` is
  unchanged). `out/kit` was backed up to `out/kit_before_beat1/`.
- **Checked** (stills and targets in `blender/out/dock_check/`): down and back up at 0, 0.5, 1, 1.2, 1.6, 2 give the
  same camera, goblin, bones, rope, sheet and sky (only the hero's breath, a clock, differs below 0.9); targets at 0.5,
  1.2, 2 against the page at 1920 × 911: same framing and pose, the page a little flatter in light as the hero is;
  `?draw=0.7` and `?draw=1` as before, plus the rope under the near rim and the goblin now idling; no table; phone
  stills in a 390 × 844 frame (the window was not resized); reduced motion: every u still, pose changes with u; type
  check clean; console clean apart from the old `THREE.Clock` notice; cost at 1920 × 911 on the build machine: 161
  to 164 draw calls, 115 k to 159 k triangles, 0.7 ms a render, `dock.at` under 0.01 ms.
- **Not checked:** real-speed playback (the automated tab runs at about a frame a second), a slow laptop, a real phone.

### Step 4 — Beat 2, the canvas chips
- **Light:** day and night bakes blended; lantern and campfire light the terrain at night. Still the site's dark
  mode.
- **Weather:** rain and snow over the island, wet and snowy versions of the terrain textures, a cloud.
- **Encounters:** three monster miniatures tipped from a sack (baked physics), nameplates and threat rings.
- Goblin: climb and light, drag the cloud, tip the sack.
- Likely the heaviest beat. May be reviewed as three halves (one per chip).

### Step 5 — Beat 3, the table (tabletop → in-world)
- Party of four arrives as miniatures; the camera pushes in; bases sink, figures come alive, sky fades in.
- Fog of war peeled back as a baked cloth simulation.
- The d20: baked rigid-body roll landing on 1; the world drops back to its line drawing (the entrance's blockout,
  run backward) while the goblin stays in colour; he tips it to 20; the paint crosses again.
- Each party member and monster: idle plus one action.
- To decide at this review (script additions, not yet agreed): the critical hit lands on a monster with a damage
  number; one monster steps toward the party on arrival; night shrinks what the party can see.

### Step 6 — Beat 4, the pull-back (in-world → tabletop → room)
- Camera cranes out; the living world shrinks to a map on the DM's laptop.
- The room, modelled and baked: round wooden table, laptop, lamp, dice, pencil, snacks.
- The DM and four players. Open question for this review: modelled figures in the same painted style, or kept
  out of focus so they need less detail.
- The island keeps running on the laptop screen (render to texture, as now).

### Step 7 — Beat 5, the screen, and the page after
- Push into the screen; app chrome around the island; the waitlist card; the goblin peeks over its edge.
- New stills for the three feature sections, shot from the finished scenes.
- The mini island return button redrawn from the new island.

### Step 8 — Whole-film pass
- Full scroll both ways at desktop and phone; reduced-motion version; load time; console clean.
- Return-visit mode checked with the new stills.

## 6. Risks

- **Characters are the weak point of scripted work.** CC0 packs cover this, but repainting them to one style has
  to be proven in step 0, which is why step 0 includes a figure.
- **Scripted animation may read stiff** next to good models. It is judged first on the goblin in step 2; if it
  fails there, the animation source is reopened before more is keyed.
- **In-world mode multiplies cost.** It is limited to Beat 3 until that beat is approved.
- **October's failure was the look, found late.** Step 0 exists so the look is judged on two frames before
  anything is built on it.

## 7. Not in this plan

Sound · a real waitlist backend · the real product UI in Beat 5 · the old film in `story/` (left as it is).
