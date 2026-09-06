# MOCK-2 — FLORA AND SKY

Art bible §11.2 rows **5 (Foliage)**, **6 (Bark / trunk)** and **17 (Standing sheet — painted)**,
built as real geometry and judged beside the actual hero island on `?mock=` in both rigs.

Files owned and written by this workflow, and nothing else:

```
story/src/film/mock/foliage.ts       341 lines   ?mock=foliage
story/src/film/mock/bark.ts          137 lines   ?mock=bark
story/src/film/mock/sky.ts           322 lines   ?mock=sky
story/src/film/mock/foliageKit.ts    528 lines   shared by the three above, imported by nothing else
```

`npm run build` green (tsc --noEmit + vite, 1.41 s; production bundle **1,440.33 kB, unchanged** —
the mock route and its glob still tree-shake out). `npm run check` green, all 13 gate scripts,
`gob.check` reporting 22 gates / 22 passing / 0 regressions.

Screenshots in this folder, every claim below cites one:

```
mock-foliage-1440x732-perf.jpg   mock-foliage-1440x732-prep.jpg
mock-foliage-zoom4-perf.jpg      mock-foliage-zoom4-prep.jpg
mock-bark-1440x732-perf.jpg      mock-bark-1440x732-prep.jpg
mock-bark-zoom4-perf.jpg         mock-bark-zoom4-prep.jpg
mock-sky-1440x732-perf.jpg       mock-sky-1440x732-prep.jpg
mock-sky-zoom4-perf.jpg          mock-sky-zoom4-prep.jpg
mock-flora-sky-sheet-1440x732-perf.jpg   mock-flora-sky-sheet-1440x732-prep.jpg
```

**Viewport note:** every shot is **1440 × 732**, not 1440 × 900. `screen.availHeight` on this
machine is **816 CSS px at dpr 1.25**, so a 900-px-tall viewport does not exist here; 732 is the
ceiling with Chrome's own furniture. The horizontal field is what `framing.ts` holds constant, so
the px-per-unit arithmetic below is unaffected.

---

## 1 · What is built

### Foliage — a stand, not a specimen
Row 5 is "every crown in the film", and the film's foliage is never one tree: it is S3's 40+, S4's
forest, S7's twelve. So `?mock=foliage` is a copse — **3 oaks (2.0–2.9 u), 3 pines (1.9–2.7 u), one
1.1-u sapling, 8 undergrowth shrubs and 20 grass tufts** — in two rows, so it has a front and a
back and can be judged as a MASS as well as a specimen.

- **Oak** = 5 overlapping roughened lobes on a 16×12 sphere + 4 contour arcs at 1.03× + one 'faint'
  interior separation. **Pine** = 3 stacked roughened cones + a per-tier skirt arc + the
  `silR()`-derived zigzag, one connected stroke per side, tip to skirt.
- **Merged to four `BufferGeometry`s**: oak crowns · pine crowns · trunks · verge. No `InstancedMesh`
  anywhere (gate 4); every transform is baked into vertices by `placed()`.
- `sheet: true`, **poster 12**, **wear 0** ("trees are tended, not handled"), `bakeFoliage` 512².
- Palette: `canopy` / `canopyDeep` for oak, `needle` for pine, `undergrowth` for the verge, `timber`
  / `timberDark` for trunks. Every colour a palette token or a two-token `mixHex`.

**Measured** (live, `?mock=foliage&zoom=4`): **7 own draw calls** (4 meshes + 3 merged stroke
batches), **7 materials** (4 trilayer + 3 stroke), **9 946 triangles**, 2 466 stroke segments.
Scene at zoom 1: 331 draws / 110 712 rendered triangles against the hero island's own 320 / 79 888.

### Bark — the one hero bake that does not transfer, at three diameters
Row 6's whole difficulty is arithmetic, so `?mock=bark` puts the 256² re-bake on screen at three
diameters at once — an old oak (r 0.225), a mid trunk (r 0.132) and a slim pole (r 0.062) — plus
the two other things the row covers by name, **a limb and a post**, and a cut stump.

- `sheet: true`, **dir 1.35**, **poster 0**, `bakeBark` **256²**, `timber` / `timberDark` /
  `plank`. One merged geometry, one material.
- Drawn: `trunkSide()` tapering side contours that **track each trunk's own lean**, two 'faint'
  bark streaks pushed clear of the cylinder, and a root-flare arc in the Prep register.

**Measured**: **4 own draws** (1 mesh + 3 stroke batches), **4 materials**, **682 triangles**,
456 stroke segments. Scene at zoom 1: 325 draws / 83 988.

### Sky — how distance and horizon are handled, in one frame
`?mock=sky` builds **S3's exact three-leaf staging** (§2.5), near → far, `canopyDeep` → `rockFace`
→ `skyDay`, every flat bottom on ONE baseline. That common baseline **is** the horizon: this film
has no horizon line, it has sheets standing in slots at one height, and the value ladder between
them is the distance.

- `ExtrudeGeometry(shape, { depth: 0.10, bevelEnabled: false })` from an authored `Shape` — never a
  `PlaneGeometry`. Dead-flat bottom, 11–14 lobes at 0.62–1.00 of leaf height with ±8% control
  offsets, **one torn notch pulled to 0.34**, hard vertical sides, `rotation.x = −0.14` of rake.
- `sheet: true`, `dir 0.18 ± 0.05`, **poster 6**, **wear 0.10**, `bakeSkySheet` 512² tiling at
  **6 u = 85.3 texels/unit**, base **paper**.
- **A fourth sheet**, a spare leaned face-away behind the others, is the only way to see what the
  route's fixed camera otherwise hides: the **Λ brace and slot line** on the back of every leaf.
  §2.2 requires them always built and legible off-axis; S2's own argument is the licence
  ("the sheets are there; they have simply not been painted yet"). It is mock-only — the staged
  count is three per stage.

**Measured**: **6 own draws** (4 meshes + 2 stroke batches), **6 materials**, **2 240 triangles**,
48 stroke segments. Scene at zoom 1: 326 draws / 82 416.

### The one mechanism added — one prop, two truths
`hero.ts` builds every tree **twice**: a painted copy east of the seam in `ink`, a graphite copy
west of it in `graphiteDark` (`hero.ts:916–1050`, `style: 'painted' | 'graphite'`). On the mock
route the seam is parked, so the curtain alone decides the state and a fixed-colour stroke cannot
follow it. `foliageKit.strokeMaterial()` patches the shipped `LineMaterial` **exactly the way R14
patches the flame** — mixing toward the drawn register by `rig.curtain` **taken by identity**, with
`customProgramCacheKey`, so any partial curtain is a coherent held frame by construction. Four
registers: `paint` (ink → graphiteDark), `prep` (graphite, alpha 0 → 1 — the interior leaf arcs),
`flat` and `flatLight` (graphite in every state — the brace and the slot line).

Two consequences worth carrying into the film body:
1. **One tree carries both truths**, so the film needs half the tree geometry the hero spends.
2. These are private clones, so `pencil.ts`'s `setPencilResolution` never sees them and each batch
   takes the viewport off the renderer in `onBeforeRender`. Going through `paint()` instead would
   have patched the shared `ink`/`form` variant and drained **every hero stroke in the film** with
   it — the wrong blast radius.

`StrokeBag` merges N authored runs into **one draw per (weight × register)** by concatenating the
interleaved segment buffers `setPositions` builds. Nine contour arcs on seven trees is 63 draws
unmerged and 1 merged.

---

## 2 · What the recipe got wrong

### F0 · The route does not park the seam — and it is not a flora problem
`MockSheet.tsx:105` sets `rig.seamX.value = 1e6` so "the curtain alone decides the state and the
comparison is like-for-like". **It does not stick.** Read live off the island drop shadow's own
`uSeamX` (which *is* `rig.seamX`, by identity) on a freshly navigated `?mock=foliage`:

```
{"seamX":1,"seamW":0.2,"curtain":0}
```

`buildHero()` calls `stageHeroRig()` (`hero.ts:1405 → :1797`), which sets `seamX = SEAM_X = 1.0`,
and it wins the StrictMode mount race against the route's own effect. Every mock is placed at
**x ≥ 6.4**, which is the seam's drawn side — so **under rig A every class on this route renders in
the DRAWN register** and no author can see their paint at all. It is visible in the first pass of
this walk: the whole stand came back as graphite at `curtain 0.00`.

**Handoff** (`MockSheet.tsx` is not this workflow's file): park the seam *after* `buildHero()` — in
the same `useMemo`, or in a `useLayoutEffect`, or simply call `parkHeroRig()` on mount. Meanwhile
`foliageKit.parkSeam()` does it idempotently at build time, to the value the route already asks
for, and touches nothing else in the rig. **Every other author's mock is affected the same way.**

### F1 · The route cannot prove the depth ramp
`MockSheet.tsx:170–172` sets `depthNear = d·0.95` and `depthFar = d·2.4` from the distance it
solves to fit the box — and the box grows with whatever the mock puts in it. Work it through: if
the far leaf sits at z ≈ 2R behind the group, the fit radius is R, `d ≈ 3.63R`, and the leaf's ramp
position is `(5.2R − 3.45R) / (8.7R − 3.45R) ≈ 0.33` **whatever spacing is authored**. So row 17's
"the far leaf is ≥85% washed to paper" is not showable on this route at any scale. **Handoff:** the
route would need per-class depth staging (`&depth=6,26`) to prove row 17, row 1's verge fade, or
anything else that reads by C6.

### F2 · `bakeFoliage` "unchanged" cannot deliver row 5's own palette
The census gives `crownPine` "the foliage map, `needle` tint". `hero.ts:634`'s `mapped()` reads
`color: map ? 0xffffff : fallback` — **the tint is dropped the moment a map exists**, so in the
shipped code oak and pine render the same green and `needle` is inert. Fixed here with a **two-band
512² tile** (oak `v ∈ [0.5, 1]`, pine `v ∈ [0, 0.5]`) and a three-line UV remap. One texture, the
census's own 1.00 MiB, both tokens land — and halving the v range at the same time as the pixel
range makes the mapping **isotropic** (512 texels per unit-u *and* per unit-v), where the full-tile
sphere mapping was 2:1 and rendered its round dabs squashed.

### F3 · The 1.10× / 1.05× contour radii do not survive the scale change
§11.3 gives the graphite contour 1.10× the lobe radius and the painted one 1.05×. On a 0.62-u lobe
that difference is 0.03 u = **1.4 screen px** at this framing — under the stroke pipeline's own
wobble amplitude. **One arc set at 1.03× serves both registers.** What actually distinguishes the
two states is the colour swap and the four interior leaf arcs, and those are now uniform-driven.

### F4 · The contour push is a RATIO, not a number
`hero.ts`'s `push 0.35` on an r 0.34 lobe is **1.03× the lobe's own radius**. Carried across as the
ratio it over-pushes badly: `VIEW_CAM` is a direction, not a per-point view ray, so a deep push on a
lobe 200 px off the optical axis diverges laterally as well as in depth and every arc floated
**15–25 screen px** clear of its mass — visible as stray wire in pass 2. `hero.ts:1036` already
measured 8 px of this and answered it by dropping the fir's push to 0.1. Landing value: **cr · 0.30**,
which also lets the nearer lobes swallow the far ones' arcs — and *that* is what makes the island's
own contour read as a broken line rather than a wire cage.

### F5 · Bark: the re-bake fixes the texel size, not the contrast — and row 6's channels are short one
The 128² → 256² change is right and its arithmetic is right. But it is **not** what is wrong with
bark at set scale. Measured on the live route: the map is bound (256², `color #ffffff`), and its red
channel spans **107..170** — a 63/255 = 28% luminance band. A 0.45-u trunk under Lambert has its own
ramp spanning ~100%, so the grain is subordinate at every scale, every alpha and every mip level.

Tried and rejected, both on screen:
- **poster 5** — bought one hard vertical edge and *swallowed the grain*, because the quantizer works
  on composed lit luminance and the streaks' contrast is smaller than a step. **Row 6's poster 0 is
  right**, and this is the reason.
- **unmipping** the tile — no measurable change; the trunk sits at 1.5–3 texels/px, so mip level was
  never the cause.

What actually carries bark at set scale, in order of effect:

1. **`heightSegments`.** `CylinderGeometry(rTop, rBot, len, 9, 1)` has **two rings of vertices**, so
   `roughen()` has nothing to displace between the ends. Three passes of amplitude and frequency
   tuning were tuning nothing. ~3 rings per world unit turns a lathe into a trunk — compare
   `mock-bark-zoom4-perf.jpg` against the smooth dowels of the earlier passes. The hero never hit
   this because its trunks are 0.66 u and 27 screen px.
2. **A circumferential value band baked into u.** `u` wraps exactly **once** around a trunk, so a
   gradient across the tile's u *is* a lit side, a mid and a shade side on every trunk in the film,
   for the price of a gradient. It must be laid **under** the streaks: over them its own 0.5 alpha
   halved their contrast and took the grain back out.
3. **Drawn marks** — which is row 7's own conclusion ("the fix for a smooth Lambert limb was drawn
   marks, not more geometry") and row 6 needs it just as badly.

**Row 6's channel list should read A B D E F, not A B D F.** `trunkSide()` is authored contour
geometry — channel E — and both the structure column and the drawn-state column already call for it.

### F6 · Row 17's bake contradicts itself
§2.3 says "**base is `paper`, not a colour** — the chapter's hue arrives as `material.color`, so one
bake serves all seven weathers" **and** "14 bank masses at `rgba(<tint>, 0.22)`". Both cannot hold:
a tinted bake is a bake per chapter. The banks are laid in **`stoneCool`** instead — a committed
token that darkens neutrally under any tint — and the hue stays entirely in `material.color`.

### F7 · The tint column is the leaf's DEEPEST tier, not its fill
This one is forced, not chosen. With a paper-base bake multiplied by `material.color`, a leaf can
only ever go **darker** than its token — so C11's "the lit edge of a cloud is the page showing
through" has **no headroom** once the token itself is the fill. The near leaf at flat `canopyDeep`
rendered as one green wall with no banks in it at all. Fill is now
`mixHex(token, paper, wash)` with a wash ladder of **0.30 / 0.44 / 0.62**: the headroom comes back,
the bake's own darkening lands the banks *on* the token, and the ladder states the depth language as
pigment — which is also what delivers the far leaf's "≥85% paper" on a route where the in-material
ramp cannot run (F1).

### F8 · A smooth gradient and poster 6 are incompatible
The belly shading was first built as a `createLinearGradient`, and poster 6 turned it into a **ruled
horizontal band across every leaf**. The quantizer will always find a hard step in a smooth ramp.
Everything on the sky sheet is now a **dab** — 46 in the belly, 9 per bank, 4 paper shoulder dabs
per bank — which is the same conclusion `bakeGroundSheet`'s 2 000 dabs already encode, restated for
a flat surface that gets no help from Lambert.

### F9 · Row 17's rake arithmetic does not close
`rotation.x = −0.14 rad` puts a leaf's top `h · sin(0.14) = 0.14 h` farther than its bottom. For
§2.2's stated **"1.4–3.0 u farther"** the leaf must be **10.0–21.4 u tall**. The 14–26 u figure in
the same section is a *span* (width). At a backdrop's plausible 2.3–3.4 u height, −0.14 rad buys
**0.32–0.48 u** — real, but ~2% of a 20-unit depth ramp, i.e. invisible. Either the film's leaves
are near-square, or the rake must steepen to −0.30…−0.45 rad. Built to the specced angle and
reported rather than silently re-tuned.

### F10 · The merge bans the per-prop stroke-angle spread
C4 gives crowns `dir 0.50 + (seed%5)·0.06` and bark `1.35 + (seed%3)·0.05`, but gate 4 merges a
stand into **one** `BufferGeometry` per class per island and one mesh is one `uTriStrokeDir`. The
spread therefore lives **between merges** (oak 0.50 / pine 0.62 here, inside C4's ±0.2 rad
neighbour rule) and between islands — never between props. Row 5 and row 6 should say so.

### F11 · Two three.js facts that bite this vocabulary
- **`IcosahedronGeometry` ships non-indexed**, so `computeVertexNormals` cannot smooth it and
  `roughen(new IcosahedronGeometry(r, 1), …)` renders as a **faceted golf ball with white creases** —
  §9.5's "default primitive with a flat fill" arriving by the back door. The undergrowth is built
  from small roughened spheres instead, which also makes the verge and the canopy the same
  vocabulary word said quietly.
- **`mergeGeometries` refuses a list mixing indexed and non-indexed geometry** — and it *warns and
  returns null* rather than throwing, which on the lazy-glob route is a silently missing class.
  `foliageKit.merged()` throws on null so the route prints the reason.

### F12 · Nothing here can ground
C9 grounds a painted prop with a contact blob **in the island's own albedo**, and the mock route
gives no island under the mock — the stands, poles and sheets stand on bare paper. That is a route
limitation rather than a class one, but it means **the contact ledger is unproven for flora**, and
it should be proven when these classes land on a real ground card.

---

## 3 · Where each class is weakest

**Foliage.** The lit patches. `poster 12` on a 0.62-u lobe produces broad flat value steps that read
slightly graphic at ×4 (`mock-foliage-zoom4-perf.jpg`) — the island's own crowns escape this only
because they are small enough that the steps land sub-pixel. It holds at 1× and at the film's
framings, which is the test that matters, but it is the first thing that will need a knob if the
film ever frames a crown large. Second weakest: the stand has no ground, so its silhouette is doing
all the work at 500 px; against a real incident card with a contact blob it will read harder.

**Bark.** The albedo grain, and F5 says why with numbers: a timber→timberDark tile is a 28%
luminance band under a Lambert cylinder whose own ramp is 100%, so at every scale the grain is the
quietest thing on the trunk. The form and the drawn marks carry the class. If the film ever needs
bark to read as bark rather than as wood, the honest lever is a **wider albedo range** (a third,
darker token in the tile's shade third), not more texels and not a poster. Second weakest: the cut
stump's top face takes only 0.32 of the key at this rig's elevation and reads as a cup rather than
as a cut; it wants a committed lighter cap value, which is a paint decision the row does not make.

**Sky.** Everything that depends on the depth ramp is unproven here (F1), so the class's central
claim — "the value change you see in a sky is parallax off the leaf's −0.14 rad rake" — is
**asserted, not demonstrated**, and F9 says the arithmetic behind it does not close at backdrop
heights anyway. What *is* proven: the cut sheet reads as a cut sheet, the flat bottoms read as one
horizon, the tint ladder carries the distance on its own, the drawn half is an honest tier ladder
(t3 / t2 / t1, far leaf nearly bare paper — `mock-sky-1440x732-prep.jpg`), and the brace and slot
line are legible the moment a sheet turns. Second weakest: at ×4 the dabs read as flat blobs with
hard edges; they are sized against the film's 77 px/u wide framing and a magnifier is above their
design resolution, but a stage that frames a leaf close would find them.

---

## 4 · Census delta

| item | value | note |
|---|---|---|
| `bakeFoliage` | 512², 1.00 MiB | **unchanged in size**, re-authored as two bands (F2) |
| `bakeBark` | 256², 0.25 MiB | the re-bake, as row 6 specifies; mipped, anisotropy 8 |
| `bakeSkySheet` | 512², 1.00 MiB | as row 17 specifies; paper base, `stoneCool` banks (F6) |
| shared trilayer materials | `crownOak` · `crownPine` · `undergrowth` · `bark` · `skyLeaf` ×3 | `undergrowth` is **+1** on §11.6's list, which has no entry for it |
| `skyLeaf` | **3 per stage, not 1** | one per tint; a shared material cannot carry three chapter tokens |
| non-trilayer materials | 5 stroke clones | `form/paint` · `faint/paint` · `form/prep` · `form/flat` · `faint/flatLight`, all one program, shared across the three classes |
| draws | foliage 7 · bark 4 · sky 6 | own draws; +1 shadow-map draw per casting mesh |

Nothing here breaches ≤120 draws per stage, ≤40 per-mesh materials, or the 1024²-square bake cap.
