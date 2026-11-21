# Tabletop rebuild — development plan, beat by beat

2026-11-11 · Script: `docs/2026-11-06-script-v2.md` (unchanged unless a beat review says otherwise).
Replaces the art and look of `story-v1/`. The scroll shell stays.

## 1. The feel

A visitor should feel they are at a real game night with a living world on the table.

**One world, two distances.** The same models, paint and light are used everywhere. Camera distance decides how
they read:

- **Far = tabletop.** A hand-painted miniature set. Figures stand on bases, focus is shallow like a macro photo,
  the light is the room's lamp.
- **Close = in-world.** As the camera pushes in, bases sink away, figures breathe and move, sky and distant land
  fade in around the island, focus widens.

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
| Blender | Driven headless by Python scripts (Blender 5.2), not a live session. |
| New packages | `postprocessing` (depth of field, glow) and `@gltf-transform/cli` (model and texture compression). |
| Review | One beat at a time. Each beat is shown and judged before the next starts. Anything can be kept or dropped at its review. |

## 3. Style rules (what keeps it one style)

1. One palette, defined once and used by every texture.
2. One paint treatment: flat hand-painted colour with a soft edge highlight and a dark wash in the recesses, as on
   a painted miniature. CC0 models are repainted to this; none keep their pack's look.
3. One key light direction in every beat. Day and night are two bakes of the same set.
4. One base design for every figure (dark round base, thin brass rim).
5. One overlay design for nameplates, rings and pills.
6. The dice gag freeze is in the same language: the world turns to unpainted grey miniatures, the goblin stays
   painted.

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

**Asset hero drafts, 2026-11-11, waiting for a verdict.** After draft 4 the direction was set in three answers:
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
- Camera path for u 0–2 keyed in Blender and exported. This starts the single continuous path that every later
  beat extends.
- Goblin: rope haul, tie-off, dust hands, walk to centre. Rope as a baked simulation.
- The table surface and battle grid arrive under the island.

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
- The d20: baked rigid-body roll landing on 1; freeze to unpainted grey; goblin tips it to 20; paint floods back.
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
