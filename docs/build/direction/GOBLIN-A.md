# THE GOOD GOBLIN — redesign A: silhouette first

2026-09-03 · Designer A. Answer to `GOBLIN-DIAGNOSIS.md`, all eleven failures. Pressure:
the viewer only ever gets a 36px black shape; everything else is spent serving that read.
Vocabulary is strictly what the island proved: closed lathe bands, roughen, extruded
beveled profiles, `mark()`/`contourArc()` drawn strokes, `createTrilayer()` with poster
tiers + authored stroke tiles + edge-wear. No new surface system, no skinning, no cloth
sim.

---

## 1. Who he is · the one adjective

**The DM's stagehand: a small professional caught mid-task, unbothered that you saw.**

The silhouette's single adjective: **INTENT.** Not cute, not sneaky, not heroic — *bent
to his work*. A 36px black shape must say "that small thing is DOING something." Every
proportion below is argued from that.

## 2. Silhouette design

### The 36px read (phone; figure ≈ 43px tall)

Five marks, in priority order — if a size cut must drop something, drop from the bottom:

1. **A leaning dark teardrop** — the cloak, one unbroken C-curve down the back from
   crown to hem, tilted 14° forward over the work. The line of action IS the outline.
2. **Two ear blades breaking UP and OUT in an asymmetric V** — the goblin identifier,
   and the wordmark's own shape (two triangles over a dome). Ears buy HEIGHT, never
   width: tips are the two highest points of the figure. This kills the mushroom.
3. **Two amber dots** in the dark of the hood. The only warm pixels on him; unmissable.
4. **The pencil notch** — a triangle of clean paper between the extended pencil arm's
   underside and the cloak's front. Negative space does the verb: arm out = at work.
   The pale cedar pencil crosses that notch as a light stroke on dark.
5. **A contact smudge** under the boots. He is ON the ground, not near it.

Aspect: **height : width = 1 : 0.58 at every breakpoint** (was 1 : 1.11–1.13 on
mobile — wider than tall). At 43px tall he is ≤ 25px wide.

### The 150px read

Everything above, plus: the hood hem as a brow line over the eyes; the nose wedge and
chin breaking the face contour (profile = brow–nose–chin zigzag, not a dome); the boots
under a lifted front hem; the flopped hood tip pointing the direction he faces; the
mouth mark; the satchel bump on the back curve; 4–6 committed value tiers on the cloak.

### Full frame / 6× zoom

Poster-tier gouache with visible edge-wear drybrush at every rim; the authored stroke
tiles carrying his underdrawing tone wherever Prep applies; the tooth nub in the mouth
line; the earring; drawn contour strokes registered AT the silhouette exactly as the
oak crowns do (`hero.ts:906-960` registration discipline applies to him verbatim).

### Negative space inventory (what the paper does)

- pencil-arm notch (the verb) — min 4×4px at phone
- between the ear blades (the V that reads "goblin", not "hat")
- under the lifted front hem, between the two boots (the stance)
- under the chin, between jaw and collar (separates head from body at 3/4 views)

## 3. Proportion sheet

Authored in rig-native units (origin at soles, rig height convention as `world.ts`);
staging scales ×0.833 to the hero's 0.75 world units, exactly the current pipeline.

| measure | value | ratio |
|---|---|---|
| ear tips (top of figure) | 0.90 | 1.00 |
| crown of hood | 0.78 | 0.87 |
| head height, chin→crown (with hood) | 0.40 | 0.44 |
| head height, skull only | 0.36 | 0.40 |
| head width (skull) | 0.30 | W:H 1.2:1, squashed chestnut kept |
| ear length | 0.30 | each; span tip-to-tip ≤ 0.44 |
| chest pivot (waist) | 0.30 | |
| pelvis / hip pivot | 0.20 | |
| cloak hem | 0.06 | front lifted to 0.10 over the boots |
| hem width | 0.40 | 0.23 behind the axis, 0.17 in front |
| shoulder width | 0.24 | |
| arm, shoulder→mitt | 0.26 | |
| boot | 0.11 long × 0.05 tall | oversized: planted |
| max figure width at rest | 0.52 | aspect 0.58 |

**Head:hem width = 0.75 : 1** (was 1.97–2.50 : 1). The head is still ~51% of crown
height — the diagnosis's "head is half of him" decision, kept — but the ears no longer
spend the width budget twice: they spend the *height* budget.

**Line of action at rest:** one forward C — crown leads the stance centre by +0.10 z,
pelvis trails −0.02, hem sweeps back −0.08. Hip→sternum→skull is a curve, not a plumb
line with a kink. Weight split 58/42, right leg loaded (his working side). Drawn
literally: the back contour stroke (§4) traces this curve at `hero` weight.

## 4. Construction — part by part

Zero `sketch()` shells (was 19). Outline = trilayer edge-wear + **eight authored drawn
strokes**, the trees' own solution. Every mesh is a `createTrilayer` Lambert; every part
parents to its rig joint (rigid parts, as now).

| part | technique | tris | stroke family direction |
|---|---|---|---|
| cloak upper (shoulder→waist) | closed climbing lathe, 20 pts × 24 seg, roughen amp 0.008 | ~420 | dir 1.45 (down the drape), sheet basis |
| cloak lower (waist→hem) | second lathe band on the `hemBone`, hem ring scaled z 0.85 and offset −0.02 z for the back sweep; island-strata precedent | ~420 | dir 1.45, sheet |
| hood cowl | partial sphere (the proven `world.ts:1035` cowl), roughen 0.006, opening cut wide brow-to-jaw | ~500 | dir 0.9 (wrapping the cowl), sheet |
| hood tip | small cone 0.055 r × 0.10, drooped back-left rot.x −0.7 — an asymmetric flag on the crown | 32 | inherits hood |
| skull | authored lathe (chestnut profile as `world.ts:998`), scale (1.06, 0.92, 0.78) — face is a PLANE | ~440 | dir 0.5, sheet |
| nose | beveled wedge cone r 0.02 × 0.045, down-forward | 24 | inherits skull |
| ears ×2 | the proven extruded beveled wedge (`world.ts:1077-1091`), base pivots **rot.z = −side·0.55 (right) / −side·0.85 (left)** — asymmetric, up-and-out | 2×140 | dir along the blade, per side |
| inner ear ×2 | inset copy at 0.48/0.42 scale (as now) | 2×60 | — |
| eyes ×2 | oblate sphere r 0.045, scale (1, 1.15, 0.55), **front cap ≥ 0.02 PROUD of the skull along the face normal** — assert by raycast in the build check (shipped bug: −0.064 sunk) | 2×160 | unlit (§6) |
| lids ×2 | skin-tier caps, blink by scale.y | 2×80 | — |
| mouth | three authored `mark()` strokes (neutral / open-o `ellipseMark` / grin), state-swapped by `visible` — never deformed | ~72 | ink, `faint` |
| tooth | one 0.012 nub, breaks the mouth line | 24 | — |
| arms ×2 | two tapered cylinders (upper/fore) + bare mitt as a 5-pt teardrop lathe — **no marching-cubes blobs anywhere** | 2×330 | dir 1.3 |
| legs ×2 + boots | tapered cylinders + boot as a squashed 6-pt lathe with toe pivot kept | 2×280 | dir 1.35 |
| satchel + strap | box + box, back shoulder (as now) | 40 | dir 0.61 |
| collar | cylinder cowl-pool (as now) | 64 | inherits cloak |
| pencil | KEPT as built (`hero.ts:1136-1162`) — two-value fix is right | ~120 | — |
| contact pool | feathered trilayer disc 0.34×0.22 (§8) | 64 | — |

**Drawn strokes (the eight):** back-sweep crown→hem (`hero` weight — the one heavy
line, his line of action made literal, parented across chest/hem groups as two joined
polylines); hood front hem arc (`form`); two ear outer edges (`form`); jaw–chin
(`form`); pencil-arm underside (`faint`); front hem ellipse (`faint`); mouth (state
mark). Weight ratio inside the figure **≤ 2:1** (was 6.3:1); all are authored polylines
(`mark()`), which cannot bead — the 390px beaded chain was the shells' wobble, and the
shells are gone. LineMaterial floor: 1.25px at any DPR.

**Totals: ≈ 4,600 triangles** (was ~56,800 — legs alone were 21,928), **≈ 26 mesh draw
calls + 8 stroke calls ≈ 34** (was ~102), one already-resident trilayer program, no new
shader. Merge the strokes per weight class into one LineSegments2 each if calls matter:
→ ~29.

**Hatching: zero.** `world.ts:978` flank, `:1211` jaw, `:1277` contact hatch fields all
die with the old build. Tone is poster tiers + stroke tiles, one family per part, per
the gate.

## 5. Materials

Three colour families + the pencil's neutrals. No hex on two unrelated parts (kills
failure 11's five-parts-one-brown).

| family | hex | where | trilayer knobs |
|---|---|---|---|
| **cloth — rust** | `gobTunic #9C3A22`, dark tier `gobTunicShade #64281A` | cloak, hood, tip, boots (shade) | poster 6, wear 0.28 |
| **skin — sage** | `gobSkin #84A058`, `gobEarInner #5C7A2E` | face, ears, hands, legs | poster 5, wear 0.22 |
| **accent — amber** | `amber #F2C35E` | eyes only | unlit (§6) |
| pencil neutrals | `timberDark` / `dieBone` / `graphiteDark` | pencil only (shared with world props, never with his body) | as built |

**This is the poster's subject fix.** The palette already committed it and the build
ignored it: `palette.ts:112-118` — *"lively olive-green skin under a committed rust
tunic; the tunic stays the darkest mass in every frame."* Rust `#9C3A22` measures
~0.30 encoded luma against grass 0.62 / oak crown 0.50 / pine 0.45 — **0.15+ darker
than every painted mass near him, and 150°+ away in hue**. The green world, the red-brown
worker. Green stays his alone (skin at face/hands/ears — the small areas), amber stays
glow-only. Gate check: cloak avg luma ≥ 0.12 below the darkest crown AND hue Δ ≥ 90°,
measured at 43px via the `heroProject` bbox readback exactly as the diagnosis measured.

- **Poster tiers:** cloak 6, skin 5, ears 4 — a 43px figure wants fewer, harder tiers
  than a tree (crowns use 12). The lit cloak must read as 3 decided value steps at
  phone width, not a ramp: assert range ≥ 60/255 across the torso scan (the shipped
  head scanned 8/255).
- **Edge-wear** (0.22–0.3) is his outline's soft half: rims lighten toward paper —
  drybrush at every contour, worked cloth on the rust, and it replaces 19 ink shells.
- **Underdrawing:** each part carries `stroke:{dir, sheet:true}` — one family per part,
  ±7° hand variance from the bake, tiers from the same quantizer as the world. He is
  drawn with the same pencil as his island.
- **QUIET_PIGMENT (`pencil.ts:184-200`):** his hexes leave the damp list by leaving the
  `paint()` system entirely — the protagonist is the MOST painted object on the page,
  never 0.3× muted.
- **The seam and the curtain:** he is `markAlive` — full paint in both states; on the
  graphite half he is the only colour, per the grammar. **The one exception is the
  entrance:** paint arrives on him hand-first — per-part `alive` stagger: pencil+mitt
  0ms → right arm 120 → head+ears 240 → cloak upper 360 → cloak lower+legs 480, inside
  the hero bloom. The tool wakes first; the maker is painted by his own work.
- **Prep rig:** flat shadowless light; poster tiers still commit (they quantize the lit
  result, and Prep's flat light gives one tier + wear) — he reads as flat storybook
  colour on the drawing, which is exactly the "only real thing on that side" claim.

## 6. Face and eye

- **Eyes are `MeshBasicMaterial` amber — unlit, like the flame cores.** They cannot go
  muddy under any rig, any curtain state, any grade: guaranteed warm pixels at every
  size. Check: ≥ 8 amber px inside his bbox at 390×844 (shipped: zero).
- **Limit:** value never exceeds `lanternGlass`; no glow sprite, no bloom, no emissive
  halo — amber *glow FX* belongs to fire and the lantern. His eyes are painted lanterns,
  not light sources, and they light nothing.
- Eye diameter = 22% of head height → ~4px each at phone: two dots. Blink = lids
  scale.y, 90ms down / 140ms up, double-blink at 3–7s idle.
- **Geometry gate:** eye front cap ≥ 0.02 proud of the skull along the face normal,
  raycast-asserted headlessly (the shipped eye lost to the skull by 0.064).
- Brow = the hood hem: the cowl slides ±0.02 y as an expression channel — more hood =
  determined, less = surprised. Cheap, silhouette-safe, reads at 150px.
- Mouth = swapped authored marks (§4): neutral line / open o / grin. Nose wedge gives
  the profile its zigzag and catches one lighter poster tier from the key.
- **The wordmark test:** dark hood dome + two up-ears + two amber dots — the 3D head
  at 60px and the flat mark now depict the same creature by construction.

## 7. Costume and kit

One garment: the rust work-cloak, hood to hem — the drape IS the outfit (kept from the
build's own reasoning at `world.ts:936-940`, recoloured to the palette's committed
rust). Under it: bare sage hands and legs, dark boots. On it: the back satchel (tools —
the C2 read), one brass earring (left), the collar pool at the neck.

**The pencil is staged as a prop, not owned as a lozenge:**
- kept two-value (dark body / pale collar / graphite core) and oversized 2.3× as shipped;
- held in a **bare sage-green mitt** — hand and tool now separate by hue AND value
  (the shipped brown-mitt-brown-pencil fusion was failure 8's core);
- posed with length across the lens, tip down, crossing the §2 notch so it silhouettes
  against clean paper, never against his own chest, never against drawn path marks —
  staging asserts: pencil ≥ 14px long at 390 with a ≥ 3-tier value flip against
  whatever is behind it;
- pale collar faces camera (the light end points at the viewer; the dark end does the
  work).

## 8. Weight and contact

- **The contact pool** — a feathered trilayer disc (0.34 × 0.22 rig units, feather 0.5,
  `caveDark` at low opacity) parented to his root under the stance centre, offset
  +0.03 x away from the key. It is **NOT marked alive**, so the material grammar grounds
  him for free on both sides of any seam: painted side → a gouache shadow blob (what
  every painted prop gets, `hero.ts:504`); graphite side → its own underdrawing, a
  dark-tier stroke smudge — the drawn contact smear, from the same mesh, with zero
  staging. The `stageGoblin` hide-the-smear hack (`hero.ts:1201-1203`) dies.
- **Cast-shadow rule kept:** he is alive, so in the Performance rig his big masses
  (cloak, hood, head, ears, arms) cast; the hero's seam-crossing shadow stays the
  signature (`uTriAliveShadow` already rig-side). In the film's shadowless Canvas
  (`curtain.ts:72-74`) the pool alone carries the ground truth — he never floats
  anywhere, regardless of where KEY_POS throws.
- **Stance:** boots oversized (0.11 long), toes out 0.12 rad, front hem lifted 0.05 so
  the boots always read; toe pivot retained so contact frames don't slide.

## 9. Puppet

Joint set = the argued skeleton (`world.ts:832-843`, kept verbatim) **plus two, minus
none:** `hemBone` (waist; swings the lower cloak band ±0.35 rad — the silhouette must
animate, and the cloak is the silhouette) and per-side ear base pivots at the new
asymmetric rest angles (update `EAR_Z` in `actions.ts:325` to per-side constants
`EAR_Z_R 0.55 / EAR_Z_L 0.85` — `express()` writes absolute).

pelvis (crouch/weight) · chest (the hunch, a state not a shape) · neck + head (the
mass-swing and the look) · arm pose/elbow/wrist ×2 (the 13 reaches) · leg pose/shin/
foot/toe ×2 (Nimble Escape; contact) · ears ×2 (expression at distance) · lids
(blink) · hood slide (brow) · mouth marks (state) · hemBone (drape).

The film's demanded actions, on this rig (existing `actions.ts` verbs in caps):

| action | drives | silhouette note |
|---|---|---|
| peek | PEEK: neck.y + one ear up, half-crouch | one ear over an edge = the read |
| run | applyGait + hemBone trail −0.3, chest +0.1 | hem streams back: speed drawn |
| freeze-and-turn | LOOK 120ms head snap (his fastest move), body follows 400ms | ears flare symmetric once |
| light a lantern | REACH R high + TAP; eyes brighten one tier via lid part | arm diagonal + amber above |
| pull a rope | HAUL + hemBone +0.2, weight 70/30 | back C-curve deepens |
| walk-in casual | gait at 0.6 ambient, hands "in pockets" = armRest both | teardrop ambles, ears loose |
| shrug | SHRUG + both ears droop 0.3 | ears do half the shrug |
| nudge a die | NUDGE: one finger of the mitt = wrist.z only | tiny motion, big stillness |
| draw on a map | STOOP + wrist scritch loop (the 1.8s idle act) | the hero pose itself |
| throw a d20 | crouch 0.4 anticipation → REACH release + hem kick | full-body diagonal, once |
| look at viewer | LOOK to camera + hood slide up 0.01 | the §9 caught beat |
| scritch / idle | breath (chest ±1.2%, 3.2s) + blink + ear micro 0.02 rad | never symmetric weight |

## 10. Motion identity

**A stagehand's economy: snap, then settle. Nothing he does is for the audience.**

- **Timing signature:** attack 90–140ms `power3.in`, settle 450–700ms `power2.out`;
  the head alone gets 4% overshoot. The 120ms freeze-turn stays his fastest move ever.
- **Anticipation habit:** every large action buys a 40–60ms counter-dip ≤ 3° (crouch
  breath before a bolt, wrist lift before a stroke). Small actions (nudge, scritch)
  get none — competence is not telegraphing the easy ones.
- **Lead and follow:** eyes → head → ears (+90ms) → chest → hem (+150ms). Exception:
  when working, the pencil hand leads and the body follows it — the craft drags the
  craftsman.
- **Idle:** he is never still and never symmetric — 58/42 weight, breath, double-blink,
  the 4s scritch return-to-work loop (`heroLife.ts` channels kept, now with readable
  payloads: asymmetric ears and amber eyes make the head-track visible at last).

## 11. Reduced-motion still · phone fallback

- **The still** is the settled hero poster: bent to the work, pencil on the next
  stroke, both ears up, amber eyes open, pool under his boots — honest (it is a frame
  the live scene actually holds), baked into the 1200×630 OG poster.
- **Phone gates** (heroProject asserts at 390×844, run headless like `hero.check`):
  figure height ≥ 43px; width ≤ 0.65 × height; ear tips = 2 highest figure points;
  amber ≥ 8px; pencil ≥ 14px with a value flip; cloak luma ≥ 0.12 below nearest crown;
  pool visible ≥ 2px. Any staging change re-runs the gates — the measurement
  discipline the codebase already owns, pointed at the subject.
- Three-quarter gate: the same asserts at azimuths −18°, −45°, −90° — the 3/4 collapse
  (`hero.ts:1194-1197`) is answered by asymmetric ears + rust/sage two-mass split +
  proud amber eyes, and verified, not hoped.

## 12. Failure modes deliberately accepted

1. **Rust sits near `mushCap #B03C22`.** Same warm family, three tiny caps in frame.
   Separated by size, value tier and the caps' red lean. Accepted; if a walk confuses
   them, darken the caps one tier, never him.
2. **Front-on is his weakest angle** (symmetric ears, flat face plane). Gated to
   "readable", not "best"; profile and 3/4 are the staged angles. Accepted.
3. **Rigid parts, no skinning:** extreme reaches can open a 1–2px joint gap at 6×.
   Sleeve/hem overlaps and the drawn contours cover the staged poses; unstaged
   extremes are nobody's shot. Accepted.
4. **Unlit amber eyes** stay bright in dark scenes (C4 tavern). That is the
   lantern-eyes conceit, capped at `lanternGlass` value. Accepted as identity.
5. **One-bone hem:** a run's drape is a swing, not a cloth ripple. Storybook register;
   accepted.
6. **Head at ~51% is still toybox-adjacent.** The jaw taper, nose zigzag and ear
   asymmetry argue against "baby"; if a live walk still reads infant, the knob is
   skull scale.y +6% — never shrinking the head (the proportion is a kept decision).
7. **~34 draw calls is not the theoretical floor** (~20 with merged strokes/materials).
   At 4,600 tris on an already-resident program, spending engineering there before a
   measured need is the wrong lazy. Accepted until a frame profile says otherwise.
