# Why the goblin reads as a bad asset drawing

Character-art post-mortem of the shipped hero figure. 2026-09-03.

Sources: the P4d/P4e/P5 walk frames in `docs/build/walks/`, `src/film/world.ts`
`buildGoblin()` (846–1283), `src/film/stages/hero.ts` `stageGoblin()` (1168–1246),
`pencil.ts`, `trilayer.ts`, `rigs.ts`, `curtain.ts`, `heroLife.ts`.

Every number below was measured, not estimated: projected sizes come from driving the
shipped `heroFraming()` solve headlessly with the shipped staging replicated verbatim;
pixel values come from `System.Drawing` reads of the shipped walk frames; triangle,
material and draw counts come from traversing the built figure.

---

## The one-sentence answer

He is a smooth green lathe-stack wearing nine colours and a beaded outline, standing on
a page whose every other surface is a tiered, drybrushed, hand-stroked painting — and at
the size he actually ships he is the same value as the two trees beside him. The frame
contains three green blobs. One of them is the brand.

---

## 0. The numbers, up front

Shipped staging: `GOB_SCALE = 0.75` world units, root scale `0.8333`, position
`(0.95, 0, pathZ(0.95))`, `rotation.y = 1.6` (near-profile), head `y = 0.35`.

| viewport | figure (w×h px) | aspect | head+ears width | head : body width | eye | mouth | one foot |
|---|---|---|---|---|---|---|---|
| 1440×900 | 96.7 × 106.4 | 0.91 | **100 % of the silhouette** | 1.97 : 1 | 14.8 × 14.3 | 6.3 × 3.5 | 20.1 × 11.1 |
| 1920×917 | 106.1 × 112.4 | 0.94 | 100 % | — | 15.6 × 15.1 | 6.9 × 3.7 | 21.2 × 11.8 |
| 768×917 | 73.6 × 66.6 | **1.11** | 100 % | — | 9.6 × 8.7 | 4.8 × 2.4 | 12.7 × 8.0 |
| 500×915 | 63.0 × 56.4 | **1.12** | 100 % | — | 8.1 × 7.4 | 4.1 × 1.9 | 10.8 × 6.6 |
| 390×844 (real phone) | 48.1 × 42.6 | **1.13** | 100 % | 2.50 : 1 | 6.2 × 5.6 | 3.1 × 1.4 | 8.2 × 4.8 |

Cost: **49,262 triangles**, 3,759 stroke segments (a further 7,518 tris of instanced
quads), **~102 draw calls**, 64 meshes, 38 stroke objects, 71 unique geometries,
13 materials — for a figure that is 43 px tall on a phone.

Split: chest subtree 27,334 tris, legs 21,928. **43,128 tris (88 %) are in the arms and
legs.** The head — the half of him the design argues for — is 5,538.

---

## 1. Silhouette: he is a mushroom, and at phone width he is a wider-than-tall mushroom

**At 36–43 px (phone).** The measurement that decides everything: *the head-and-ears
bounding box is 100 % of the figure's screen width at every single breakpoint.* The
cloak, both arms, both legs, both feet and the pencil contribute exactly zero to the
outline's horizontal extent. The head+ears mass is **2.5× wider than the body** at phone
size. Aspect is **1.13 : 1 — he is wider than he is tall.**

That is not a character footprint. A cap wider than its stem, sitting on a short
vertical, is the silhouette of a mushroom. `p4e-master-500x915.jpg` confirms it: he is a
dark green lump at (140–180, 535–570) that the eye files with the round oak crown at
(345–395, 525–570). Same size, same shape family, same value. Nothing in the outline says
*person* — no shoulder line, no neck notch, no visible leg gap, no hand.

**At ~100–150 px (desktop hero).** `p4c-master-comp-1440x900.jpg`: the mushroom gains a
spike (the hood peak + tail cones) and reads as a small conifer — the same shape family
as the painted pine two-thirds across the frame. The two ear blades read as the widest
thing about him, running near-horizontal because `pivot.rotation.z = -side * 1.3`
(world.ts:1101) sweeps them almost flat, so from the shipped near-profile they run
edge-to-edge across the silhouette instead of breaking upward out of it.

**At 4×–6× (`p4e-goblin-seam-zoom4x`, `p4e-verify-goblin-seam-zoom6x`).** It falls apart
into three unconnected lumps: a dome, a bell, and a brown teardrop. The ear is a detached
dark leaf floating over the dome with a hard black notch where it should join the skull.
There is no continuous contour anywhere on the figure — every mass carries its own closed
loop of ink (19 shell meshes; §5), so the "silhouette" is nineteen silhouettes stacked.

**The staging comment already admits this.** hero.ts:1194–1197: *"every three-quarter
under a bent hood at the 33° lens collapsed to a featureless dome — the profile is what
reads at poster distance."* The design cannot hold the three-quarter view the hero doc
asks for (§2: "three-quarter toward camera"), so staging was forced into profile. A
character whose readable angle count is one is not a character.

---

## 2. Construction: it is a lathe stack, and the joins are all butt joints

`buildGoblin()` is a parts bin. Counting only what the camera can hit:

- **Cloak** — `LatheGeometry`, 8-point profile, 18 radial segments, `scale.z = 0.9`
  (world.ts:943–953). A truncated cone of revolution. It has one silhouette from every
  azimuth, because a solid of revolution does.
- **Skull** — `LatheGeometry`, 11-point profile, 22 segments, `scale (1.18, 0.86, 0.9)`
  (998–1012). Another solid of revolution, coaxial with the cloak.
- **Hood** — partial `SphereGeometry(0.185, 14, 10)` with a face window, `roughen`'d
  (1035–1046). A third coaxial dome.
- **Peak** — `ConeGeometry(0.055, 0.1, 8)` (1051). **Tail** — `ConeGeometry(0.036, 0.16, 7)`
  (1064). **Rim** — `TorusGeometry` arc (1057). **Collar** — `CylinderGeometry` (972).
- **Ears** — `ExtrudeGeometry` of a bezier `Shape` with a bevel (1085–1091), pivoted at
  `(±0.13, −0.025, −0.015)`, which is *inside* the skull's own surface, then rotated ∓1.3 rad
  so the blade has to punch out through the hood shell. Two closed ink contours crossing
  a third with no join authored between them — that black notch in the 6× frame is
  exactly this.
- **Limbs** — `limb()` capsules of radius 0.018–0.024.
- **Hands and feet** — `blobs()` marching-cubes metaballs at resolution 36 and 30
  (899–911, 1245–1258). These are the four heaviest meshes on the figure at
  **2,160 / 2,160 / 1,980 / 1,980 triangles each**, and each is drawn **twice** (fill +
  shell). A metaball-marched mitt costing 2,160 triangles renders at 20 × 11 px on
  desktop and 8 × 5 px on a phone.

Everything is coaxial and stacked on one vertical spine: cloak, collar, neck stub, skull,
hood, peak. Six revolved forms sharing an axis is the definition of "turned on a lathe",
and the code comment at world.ts:865–866 explicitly promises the opposite ("the legs stay
thin but knotted, not turned on a lathe") while the torso and head are exactly that.

**Where the geometry betrays its procedural origin:**

- Every join is a *butt* — one primitive ends, the next begins, at the same coordinate,
  with no overlap, no fused mass, no drawn line carried across. The head/collar join, the
  ear/skull join and the wrist/mitt join all show as a hard value break with a stray
  contour running through it at 4× zoom.
- The head reads as an *object placed on* the body rather than growing from it, because
  the skull lathe and cloak lathe are separate closed solids with separate outlines,
  separated by a `CylinderGeometry` collar.
- `roughen()` is applied to exactly one part of him (the hood, amp 0.006). The other
  eighteen forms are mathematically clean surfaces of revolution. The island's strata
  bands get `roughen` at amp 0.02–0.05 and read as cut earth; his forms get 0 and read
  as CAD.

---

## 3. Proportion and gesture: no line of action, no centre of weight

**Proportion is defensible on paper and fatal in the frame.** Head at ~55 % of figure
height is a real stylistic choice (big-head goblin) — but combined with ears that are
`0.46` long swept to horizontal, the head *unit* becomes 100 % of the width as well as
55 % of the height. The design spends its whole silhouette budget twice on the same
element. Nothing is left for a shoulder, a hip, or a hand.

**There is no line of action.** The staged pose (hero.ts:1208–1229) is:
`chest.rotation.x = 0.32`, `neck.x = 0.08`, `head.x = 0.1`, `head.y = 0.35`,
`legL.x = 0.06`, `legR.x = −0.1`. Every rotation is under 20°, all in the same plane, all
in the same direction. Drawing a curve through hip → sternum → skull gives a nearly
straight vertical with a 0.32 rad kink at the waist. That is a stack with a slouch, not a
gesture. The only diagonal in the whole figure is the right arm
(`pose.rotation.set(−1.15, 0, −0.3)`) — and only **33 %** of that arm's surface is
unoccluded from the shipped lens.

**There is no centre of weight.** Both legs are near-vertical, symmetric, buried under
the cloak, and measure **0 % and 6 % visible** from the shipped lens. Nothing is
supporting anything. There is no contrapposto, no weight leg, no push into the ground —
he stands the way a bollard stands.

**The premise is not staged.** The poster's sentence is "a goblin, with a pencil, drawing
the world." The pencil body is `BoxGeometry(0.024, 0.15, 0.011)` at `scale 2.3`, which
projects to **6.5 × 40.6 px at 1440** and **2.6 × 16 px at 390**. It is painted
`P.timberDark`, and so are the mitt holding it, the glove cuff, both boots and the eye
rims — five different objects on the figure share one hex. So the hand and the held
object are one continuous brown mass with a stick coming off it, laid across a ground
already covered in drawn path marks of the same ink weight. At 4× (`p4e-goblin-seam-zoom4x`)
it reads as a twig. At phone it reads as nothing.

---

## 4. Surface: he is not on the film's material at all

This is the finding that explains the client's sentence most directly.

`createTrilayer()` is called **11 times** in the shipped hero — 9 in `hero.ts`, 2 in
`islandKit.ts`. It is called **0 times** in `world.ts`. The goblin is built entirely on
the old pencil vocabulary: `fillMaterial`, a `MeshLambertMaterial` with two octaves of
albedo noise (pencil.ts:73–136), plus `shellMaterial` (a flat `MeshBasicMaterial`,
`BackSide`) and `LineMaterial` strokes.

So every surface quality the island earned, he does not have:

| trilayer gives | goblin gets |
|---|---|
| `uTriPoster` luminance quantization to committed tiers (trilayer.ts:264–267) | continuous Lambert ramp |
| edge-wear drybrush on silhouette edges (304–305) | nothing |
| fog-to-paper depth falloff (306) | nothing |
| four-tier **authored** baked pencil stroke tiles (336–371) | nothing |
| sheet-basis one-direction stroke family per prop (348–361) | nothing |
| seam pooling, dried edge, granular frontier (310–319) | nothing |

**Measured, from the shipped frames.** A 26-sample scan down his head in
`p4e-goblin-seam-zoom4x-1440x900.png` (x = 500, y = 100→250):

```
77,84,56 | 80,87,57 | 81,88,58 | 83,89,59 | 83,90,59 | 84,90,59 | 84,90,59 | 84,91,59
| 85,91,59 | 85,91,59 | 85,91,59 | 85,91,59 | 85,90,59 | 84,89,58 | 83,89,57 | 82,87,56 ...
```

21 distinct values in 26 samples, stepping one unit at a time. **Total value range across
his entire head: 8 levels out of 255 (3 %).** That is an airbrush gradient with almost no
gradient in it. The cloak is the same: 25 distinct values, range 18 levels (7 %).

The same scan across a painted oak crown (`p4d-crown-tiers-contour-zoom-1440x900.png`),
which *does* opt into the trilayer:

```
135,147,96 | ... | 61,60,60 | 63,78,58 | 52,70,47 | 48,67,41 | 45,65,32 | 45,64,27
| 44,64,26 | 43,64,26 | 43,64,26 | 43,64,26 | 43,64,26 | 43,64,26 ...
```

Plateaux with hard jumps between them — four committed tiers. **Range: 92 levels (36 %).**

**The island's trees carry 11× the value range of the brand's protagonist, in decided
tiers, while he carries a 3 % smear.** That is precisely what "a bad asset drawing" looks
like next to painted art.

It gets worse on purpose. `pencil.ts:184–200` puts every one of his palette hexes into
`QUIET_PIGMENT` and damps his albedo texture to **0.3** — one third of what every world
surface gets — on the reasoning that "full-strength mottle on a face-sized mesh reads as
a bruise". The result is that the one thing in the frame the viewer is meant to look at
is deliberately the *least* painted object on the page.

**And the value collision.** Average RGB inside each bounding box at 500×915:

| | avg RGB | luma |
|---|---|---|
| the goblin | 83, 88, 68 | **0.335** |
| painted oak crown | 80, 97, 56 | 0.353 |
| painted pine crown | 69, 86, 53 | 0.314 |
| open grass he stands on | 118, 130, 86 | 0.488 |

His average value sits *between the two trees*, within 0.02 luma of each. `gobHood`
`#687452` and `gobSkin` `#84A058` are the same yellow-green family as `grass` `#94B164`
and the crowns. The hero doc §4 requires: *"He is the loudest chroma in the frame by one
deliberate step."* Measured: he is a third tree.

---

## 5. Face and eye: there is no face in the shipped frame

`palette.ts:124` — *"the huge amber lantern eyes — his chroma signature"*. The build
gives each eye a `SphereGeometry(0.056, 12, 8)` scaled `(1, 1.05, 0.5)` in `gobEye`
(= amber `#F2C35E`), a `TorusGeometry` rim in `timberDark`, a slit ink pupil and a paper
glint. Four meshes per eye; 1,276 triangles across eyes, brows, nose and mouth.

**Amber pixels present in his bounding box in the shipped frames:**

| frame | amber px in his bbox |
|---|---|
| `p4e-verify-master-1440x900.jpg` (desktop) | **0** |
| `p4e-master-500x915.jpg` (phone proxy) | **0** |
| `p4e-goblin-seam-zoom4x-...png` (4× zoom) | 256, in one 32 × 28 patch |

Loosening the test to "warmest pixel anywhere in his box" at 1440×900 finds a ~2 × 2
cluster at (464, 421): `R133 G121 B69` and `R197 G183 B136`. Warmth (R−B) = 64. The
lantern in the same frame measures 104. So his chroma signature contributes roughly
**four pixels of muddy khaki** at the shipped desktop size and **nothing at all** at
phone size.

Causes, in order:

1. **The eye is geometrically sunk.** Casting from the shipped lens to the left eye's
   centre, the first surface hit is the skull lathe, 0.064 world units *in front* of the
   eye's centre; the eye's own front cap only reaches 0.023 out. `eye.position.z = 0.102`
   (world.ts:1145) sits inside a skull whose z half-depth at that height is ≈0.122. The
   discs are set into the head instead of proud on it.
2. **The staged angle hides the rest.** `rotation.y = 1.6` + `head.rotation.y = 0.35` is
   near-profile, so the near eye is at the head's grazing edge and the far one is behind
   the skull.
3. **Size.** Even fully exposed, the eye is 6.2 × 5.6 px on a phone. The pupil inside it
   is a `SphereGeometry(0.015, 8, 6)` scaled to a slit — sub-pixel.
4. **The rest of the face is below ink weight.** The mouth arc measures 6.3 × 3.5 px at
   1440 and **3.1 × 1.4 px at 390**; the fang is `ConeGeometry(0.008, 0.022, 4)`; the nose
   is a `SphereGeometry(0.016)` painted `gobSkin`, i.e. the same colour as the face it
   sits on, and measures **3 % visible** from the shipped lens. The brows are ink tori
   0.005 thick.

**The wordmark is a better goblin than the goblin.** Look at `p4e-master-500x915.jpg`: the
logo above the type is two ears and two eyes as flat black plates on paper, and it reads
instantly at 60 px. The 3D figure below it, at the same size, has neither ears you can
name nor eyes you can see. The brand's own mark and the brand's own character do not
depict the same creature.

---

## 6. Shadow, contact, weight: he floats

The film's grounding primitive is `contact()` (pencil.ts:487–498), which is a `hatch()` —
a fan of parallel strokes on a ground-plane quad. `buildGoblin()` attaches one at
world.ts:1277.

`stageGoblin()` then **switches it off**:

```ts
// hero.ts:1201-1203
for (const child of goblin.root.children) {
  if (child !== goblin.pelvis) child.visible = false;
}
```

The comment says the real cast shadow replaces it. It does not, where it matters:

- `markAlive()` sets `castShadow = true` on his meshes (curtain.ts:75), and `Hero.tsx:244`
  enables renderer shadows, so a shadow *is* produced.
- But `KEY_POS = (−4, 3.95, −4)` throws his shadow toward **+x**, from x 0.95 to x 1.71
  (`shadowReachX`). The seam is at x 1.0. So essentially the whole shadow lands on the
  **graphite half**, where it renders as `mix(triUnder, ink, (1−mask) × 0.45)` — a soft
  grey darkening of a field that is already covered in grey pencil strokes.
- Under his feet, on the painted side, there is now **nothing at all**: no cast shadow
  (it went the other way), no contact smear (disabled above), no painted contact blob
  (`hero.ts:504` bakes those into the albedo for painted props only, and he is not one).

Look at `p4e-goblin-seam-zoom4x` next to `p4d-crown-tiers-contour-zoom`: the oak sits in a
large soft shadow pool that reads as weight; the goblin's cloak hem meets clean grass with
zero darkening. He is a sticker on the island.

In the **film** (not the hero) it is absolute: `curtain.ts:72–74` records that the film's
Canvas has no `shadows`, so `markAlive`'s cast flags are inert there. Across the whole
two-minute film — where he is on screen essentially continuously — his only ground
contact is 9 parallel hatch strokes, which is both a hard-gate violation (§9) and, at his
screen size, a grey smear or nothing.

---

## 7. Animation-readiness: the build guarantees "parts moving"

The rig itself is fine — the joint argument at world.ts:832–843 is sound and
`actions.ts` drives 25 distinct channels. The problem is entirely in how the figure is
*drawn*, and it makes every motion read as assembly:

1. **Nineteen independent contour shells.** `sketch(..., shell)` draws each solid a second
   time, inside-out, in flat ink (pencil.ts:378–386). There are 19 of these on him. A
   drawn character has ONE line that runs continuously across a shoulder and changes
   weight; this figure has nineteen closed loops that slide over one another. Rotate the
   neck and you watch the skull's loop travel across the collar's loop. That is the
   canonical "parts moving" read, built in at the material level.
2. **Contour weight varies 6.3 : 1 across one figure.** Measured rim thickness at the head
   distance: cloak lathe 6.12 px, hood 5.51 px, ear extrude 3.67 px, mitt 3.06 px, small
   spheres 2.45 px at 1440×900 — and **0.97 px** at 390×844. Below ~1.5 px the shells
   drop under anti-aliasing and the outline breaks into the beaded chain visible at 6×
   (`p4e-verify-goblin-seam-zoom6x`), which the P4d note at hero.ts:1179–1183 already
   identified and tried to patch by multiplying `(scale − 1)` by 2.6. That patch scales
   *all* weights, so it preserved the 6.3 : 1 ratio it needed to remove.
3. **No overlap logic at any joint.** Butt joints (§2) mean a rotation opens a visible
   seam rather than compressing a mass. The ear pivot inside the skull is the worst case:
   `earPerk()` (heroLife.ts:622–638) rotates the blade 0.3 rad, dragging its contour
   across the hood's contour with nothing authored to hide the crossing.
4. **The blink is a scaled eyeball, not a lid.** heroLife.ts:717–731 sets
   `face.eyeL.scale.y` / `eyeR.scale.y` to 0.12. The whole eye group — amber disc, ink
   rim torus, pupil, glint — squashes vertically. A drawn blink is skin coming *down over*
   an eye. This is the eye deforming. At 6 px it is a one-frame flicker of noise; and the
   far eye is behind the skull anyway.
5. **The expression channels are below threshold.** The ear perk is 0.3 rad on a blade
   that is 19 px long at phone — about 2 px of tip travel. The head-track cone is ±14°
   yaw on a head with no visible face, so "he notices you" has no readable payload.
6. **All shading is view-independent flat colour**, so a rotation changes the outline
   only. There is no form turning, no value re-organising as he moves — which is what
   makes a painted figure read as a solid in motion.

---

## 8. Cost: the budget is spent where the camera cannot see

49,262 triangles + 7,518 stroke-quad triangles ≈ **56,800 triangles** and **~102 draw
calls** for a 43-px-tall figure. He is on screen for essentially the whole film, so this
is the film's floor.

Where it goes, against how much of each part the lens can actually see (unoccluded
surface sampling from the shipped 1440×900 lens):

| part | triangles | visible |
|---|---|---|
| legs (both, with metaball feet) | 21,928 | **0 % (left), 6 % (right)** |
| arms (both, with metaball mitts) | 21,200 | 33 % (right arm) |
| head group (all of it) | 5,538 | — |
| ears | 2,460 | 17 % / 44 % |
| eyes + brows + nose + mouth | 1,276 | nose 3 % |
| cloak + satchel + collar (the actual silhouette) | ~600 | — |

**Two thirds of the mesh budget is anatomy hidden under a cloak.** The four metaball
extremities alone are 8,280 triangles, each drawn twice, to produce four brown lumps
totalling under 60 px² on a phone. Meanwhile the cloak — the only part of him that
contributes to the silhouette at all — is an 8-point, 18-segment lathe costing ~600
triangles.

19 shell meshes mean 19 extra draw calls that exist only to draw an outline that the
trilayer's edge-wear already solves for every other object in the frame.

---

## 9. Hard-gate violations already in the build

- **Hatching on the character.** `world.ts:978` (`hatch(0.16, 0.12, 15, 1.2, 'faint')`,
  flank tone) and `world.ts:1211` (`hatch(0.14, 0.06, 16, 0.2, 'faint')`, jaw tone), plus
  `contact()` at 1277, which is a third hatch field. Three hatch fields at three different
  angles (1.2 rad, 0.2 rad, 0 rad) on one figure — against `trilayer.ts:23–25`: *"There is
  no second crossed family anywhere — no hatching."*
- And they do nothing anyway. `hatch()` solves `n = max(2, round(density × height))`, so
  the flank field is **2 strokes** and the jaw field is **2 strokes**. The character's
  entire tonal system is **four pencil marks**, spanning 19 px and 17 px at desktop, 7 px
  at phone. They are a gate violation that buys no tone.

---

## The ranked failure list

Ordered by how much each one costs the frame.

**1. He is the same value and hue as the scenery, so the poster has no subject.**
Measured luma 0.335 against oak 0.353 and pine 0.314 — inside 0.02 of both. Zero amber
pixels. The doc requires "the loudest chroma in the frame by one deliberate step"; the
build delivers a third tree. *Fix: he must own a value and a chroma nothing else in the
world is allowed to touch, and it must survive at 43 px.*

**2. The silhouette is a mushroom — head+ears is 100 % of his width and 2.5 : 1 over the
body; at every mobile breakpoint he is wider than tall.** The whole silhouette budget is
spent twice on one element. *Fix: authored silhouette first, checked at 36–48 px before
any surface work; the body must contribute outline, and the ears must break the shape
vertically rather than defining its width.*

**3. He is not on the film's shipped material.** 0 of 11 `createTrilayer` calls. 8 value
levels of continuous Lambert ramp against the island's 92 levels in four committed tiers,
and his albedo texture is deliberately damped to 0.3. This is the literal difference
between "asset" and "painted art" in this build. *Fix: he moves onto the trilayer, with
posterized tiers, edge-wear, and one authored stroke family — or onto something better,
but not onto smooth Lambert.*

**4. There is no face at any shipped size.** Eyes sunk 0.06 world units inside the skull,
0 amber px at 1440 and at 500, mouth at 3.1 × 1.4 px on a phone. The wordmark's flat
two-ears-two-eyes plate reads better at 60 px than the 3D head does. *Fix: the face is
the read; build it as a drawn plate proud of the skull, sized so the eye survives a 43 px
figure, and reconcile it with the mark.*

**5. He floats.** Contact smear switched off at hero.ts:1201–1203; the cast shadow throws
onto the graphite half; nothing under his feet on the painted side; no shadow at all in
the film. Every other prop in the frame sits in a pool. *Fix: a real, authored, painted
contact under him in both lighting states — not a hatch fan, not a lighting side-effect.*

**6. Nineteen independent ink contours make every motion read as parts sliding, and the
outline weight varies 6.3 : 1 (0.97 px to 6.12 px), so it beads at small sizes and blunts
at large.** *Fix: one contour language for the whole figure at one screen-relative weight;
joins that overlap and fuse rather than butt.*

**7. No line of action and no centre of weight.** Every staged rotation is under 20° in
one plane; both legs are symmetric, vertical and 0–6 % visible. He is a stack with a
slouch. The design also cannot hold a three-quarter view — hero.ts:1194 records the
retreat to profile. *Fix: pose and construction authored together, with a curve through
hip → sternum → skull and a weight leg, and the design must survive at least the
three-quarter the doc asks for.*

**8. The premise is not staged.** The pencil is 2.6 × 16 px on a phone, painted the same
`timberDark` as the mitt, the cuff, both boots and the eye rims, and laid over ground
already full of same-weight ink. "A goblin with a pencil" is not legible. *Fix: value
separation between hand and tool, and the tool silhouetted against clear ground.*

**9. 88 % of 49,262 triangles is hidden anatomy.** Legs at 0 % and 6 % visible cost 21,928
tris; four metaball extremities cost 8,280 and are each drawn twice. ~102 draw calls for
a 43 px figure. *Fix: model the silhouette, not the skeleton; every triangle must be
argued from a pixel the camera can see.*

**10. Three hatch fields on the character, totalling four strokes.** A hard-gate violation
that produces no tone. *Fix: delete; tone comes from the material.*

**11. Nine painted hexes on a 43 px figure, five of them shared between unrelated parts.**
`timberDark` is simultaneously the boots, the gloves, the cuffs, the eye rims and the
pencil. *Fix: a three-value character palette — one skin, one cloth, one accent — with
every remaining part resolved by value, not by hue.*
