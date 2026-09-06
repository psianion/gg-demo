# RECON — the v1 story film, mapped

Read of every source file in `story/story` at the v2 rebuild start. Written for P1–P17 to
navigate by. Nothing was edited to produce this.

Root: `D:\Labs\map-goblin\story\story`. All paths below are relative to it.
All line numbers are from the files as read on 2026-09-02.

---

## 0. At a glance

| File | Lines | One-line role |
|---|---|---|
| `src/film/world.ts` | 4476 | Every mesh in the film. 8 scene builders + a shared sculpt/prop vocabulary. |
| `src/film/timeline.ts` | 1033 | The beat sheet. One GSAP timeline, scrubbed by ScrollTrigger, t 0→~65.72. |
| `src/film/pencil.ts` | 601 | Drawing vocabulary: strokes, fills, pigment shader, `paint()`, hatch, plates, numerals. |
| `src/film/actions.ts` | 492 | The puppet: gait, IK reach solve, stance, expressions, 12 named actions. |
| `src/film/curtain.ts` | 435 | The graphite post-pass + the alive-mask (`markAlive` / `reveal`). |
| `src/film/Film.tsx` | 256 | R3F component: builds world, owns the frame loop, the two clocks, the light rig, the pass. |
| `src/film/palette.ts` | 97 | 60 colour token exports. No structure, no ramp, no groups. |
| `src/film/dieGeometry.ts` | 64 | d20 geometry solved so one X rotation rolls the 1 onto the 20. |
| `src/film/framing.ts` | 43 | `fitFov` + `fitPullback` — hold the authored horizontal field on narrow viewports. |
| `src/film/sculpt.ts` | 58 | Metaball → mesh (`blobs`, `ball`), cached by ball list. |
| `src/App.tsx` | 301 | DOM shell: `#track`, Canvas, caption divs, endcard, rail, play button, autoplay rAF, Lenis. |
| `src/Wordmark.tsx` | 130 | The lockup as inline SVG paths + a turbulence "carve" filter. |
| `src/main.tsx` | 16 | Mount + font/CSS imports. |
| `src/styles.css` | 499 | Tokens, `#track` height, paper grain, caption band, endcard, rail, play, PRM block. |
| `index.html` | 18 | `#root`, theme-color `#f7f5f0`, title, description meta. |
| `vite.config.ts` | 6 | React plugin. Nothing else — no aliases, no base, no build tuning. |
| `scripts/*.check.ts` | 173/98/256/41/28 | curtain / pencil / puppet / framing / die. Plain `node:assert`, run by `npm run check`. |

Every line count in the brief's v1 code map is **exact**. See §6 for what the map got wrong
that isn't a count.

---

## 1. File by file — responsibilities, exports, seams

### `src/film/palette.ts` (97)

**Responsibility.** A flat list of `export const <name> = 0x……` colour tokens — 60 of them
in 9 comment-grouped bands (sky, grounds, foliage, wood, fire, cloth, metals, goblin,
specials). No functions, no ramp, no types, no default export. Consumed as
`import * as P from './palette.ts'` by `world.ts` and `timeline.ts` (which uses only the
7 `sky*` values), and by name in `pencil.ts` (the 12-token `QUIET_PIGMENT` set).

**Exports.** `skyDusk skyDay skyOvercast skyHearth skyVellum skyDawn skyBoard` ·
`earth earthTrack grass grassDeep snow stoneCool stoneWarm rockFace caveDark water
floorboard platformDisc` · `canopy canopyDeep needle undergrowth moss` ·
`timber timberDark plank` · `flameCore flameBody ember rayGold lanternGlass candle` ·
`cloakIndigo cloakCrimson bedroll tavernCloth` · `brass iron gold steel` ·
`gobSkin gobSkinLit gobTunic gobTunicShade gobBelt gobSatchel gobTooth gobHood gobEarInner
gobEye` · `dieBone monsterHide ravenSlate mushCap boardFill`.

**Not here, deliberately:** `paper` and `ink` live in `pencil.ts` as `PAPER` / `LINE`
(stated in the header comment, lines 13–14). Any v2 palette work has to reconcile that
split — `curtain.ts` imports `PAPER`/`LINE` from pencil, not palette.

**Dead tokens, verified by grep.** `moss` and `lanternGlass` have zero references anywhere.
`gobSkinLit`, `gobTunic` and `gobTunicShade` are referenced *only* by `pencil.ts`'s
`QUIET_PIGMENT` set (183–187) and are never handed to a `paint()` call — the goblin's tunic
tokens survive from before he became one-piece olive (`P.gobHood` ×6, `P.gobSkin` ×9 are
what actually paint him).

**v2 seam (P1 item 1).** This file is a leaf — nothing imports *from* it except by name,
so aliasing old names to a new structured palette is a pure add. The one hard dependency
to preserve: `timeline.ts:494/537/601/675/877/899` reads `P.skyDay`, `P.skyOvercast`,
`P.skyHearth`, `P.skyVellum`, `P.skyDawn`, `P.skyBoard`, and `Film.tsx:64` reads `skyDusk`
as the fog's initial value. Those seven are the chapter-air ramp; keep them or re-point the
five `sky()`/`skyCut()` calls.

### `src/film/pencil.ts` (601)

**Responsibility.** The single drawing hand. Everything visible in the film is built from
these primitives; `world.ts` imports 18 of them.

**Exports.** `PAPER` (0xf7f5f0) · `LINE` (0x222222) · `STROKE_LAYER` (2) ·
type `Weight` = 'hero'|'form'|'faint' · `setPencilResolution(w,h)` · `fillMaterial`
(MeshLambertMaterial, pigment-patched) · `inkMaterial` · type `Paint` = {fill?,line?,ink?} ·
`paint(object, colors)` · `roughen(geom, amp, freq, seed)` · `sketch(geom, threshold=25,
w='form', shell=0)` · `hatch(w,h,density,angle,weight)` · `crossHatch(w,h,density)` ·
`polyline(points, w, close)` · `plate(shape, w, divisions)` · `score(path, w, divisions)` ·
`curveLine(points, w, segments)` · `contact(width, depth)` · `weight(object, w)` ·
`rays(n, r0, r1, w)` · `numeral(value, height, w)`.

**Internals worth knowing.**
- Three shared `LineMaterial` tiers, widths `{hero:3.4, form:2.1, faint:1.1}` (line 30),
  scaled by `SCALE` and sub-divided by `SUB` — both set from a **module-level**
  `reduced = window.innerWidth < 700` (line 34). Read once at import; a resize never
  re-tiers. In Node (check scripts) `window` is undefined → full detail, which
  `pencil.check.ts:5` depends on.
- `PIGMENT_GLSL` + `pigment(material, amount)` (90–136): two octaves of world-space value
  noise patched into any Lambert via `onBeforeCompile`, with a fixed
  `customProgramCacheKey = 'pigment'` so every pigmented fill shares one program.
  Characters get `amount 0.3` via the `QUIET_PIGMENT` hex set (184–187).
- `paint()` dispatches on `material.userData.role` ∈ `stroke|fill|shell|ink`, and caches
  cloned materials in a `Map` keyed `role+geometryHint:hex`. `clone()` drops
  `onBeforeCompile`, so painted fills are re-patched (line 200) — a trap for any new
  material role.
- Determinism: a local xorshift `rand()` seeded `0x9e3779b9` (238–246) drives all stroke
  wobble; `noise3` (252–271) drives `roughen`. Same drawing on every load, by construction.

**v2 seams.** The trilayer material (P2 item 2) attaches at `fillMaterial` /
`plateFill` / `shellMaterial` and at `paint()`'s role dispatch — adding an
`underdrawing` role is the cheapest hook. Line-weight-falloff depth (P2 item 4) attaches
at `WIDTH` + `weight()`. **The no-hatch rule collides here:** `hatch`/`crossHatch` are
exported and called ~60 times across `world.ts`; they are not going away in one stage, so
plan the removal set explicitly rather than deleting the primitive.

### `src/film/sculpt.ts` (58)

`ball(x,y,z,r) → Blob`, `blobs(balls, res=44) → BufferGeometry`, type `Blob`.
MarchingCubes in a unit box, `SUBTRACT=10 / ISOLATION=80`, cached in a module `Map` keyed
by the exact ball list + resolution. Pure; no window, no DOM. Nothing about it is
chapter-specific — it survives the rebuild untouched.

### `src/film/dieGeometry.ts` (64)

`dieFaces(radius) → { geom, tipAngle, faceDir, faceCount, top, neighbour }`. Stands an
icosahedron up so face 0's normal is +Y and its rolling edge lies on local X, then returns
the single X rotation (~41.8°, sign-corrected toward camera) that brings the neighbour up.
Asserted by `scripts/die.check.ts`. Used once, in `buildTavern` (world.ts:3147).

### `src/film/framing.ts` (43)

`fitFov(aspect)` — holds the authored horizontal field (REF_FOV 42 @ 16:9), clamped to
MAX_FOV 70. `fitPullback(aspect)` — once the fov clamps, multiply the camera's distance
from `world.look` by `tan(REF_H/2)/tan(h/2)`, capped at `MAX_PULLBACK = 2.2` (the cap is
sized by `buildTavern`'s room box; see the comment at 30–36). Exactly 1.0 wherever the fov
clamp never engages, so desktop is untouched by construction. Consumed only by `Film.tsx`
(72, 78). Asserted by `framing.check.ts`.

### `src/film/curtain.ts` (435)

**Responsibility.** The film's second visual state, computed rather than authored: a
full-screen pass that ramps the rendered frame into graphite/parchment, plus a mask saying
which pixels stay in colour.

**Exports.** `curtain` (a plain `{value: 0}` object — the tween target) ·
`markAlive(object)` · `reveal(target|targets, {duration=0.8, radius=0}) → gsap.core.Tween` ·
`createCurtainPass(renderer) → { render, setSize, dispose, material }`.

**Mechanics.**
- `MASK_LAYER = 1`, `MASK_SCALE = 0.5`. `markAlive` enables layer 1 on every `isMesh` that
  is not a `LineSegments2` (a LineSegments2 drawn with another material is confetti — the
  rule is repeated in `maskShell`).
- `reveal` builds (once, cached on `object.userData.maskShell`) a mask-only copy of the
  prop's own solids, recentred on the prop's bounding-box centre, scale 0, parented to the
  prop; the returned tween scales it 0→1. Returned rather than run, so dropping it on the
  scrubbed timeline gives backward-scrub un-reveal for free. `radius` is the fallback for
  objects with no solids (grass tufts, ray bursts) — one clamped blob, never a multiple of
  the object's size.
- `render(scene, camera)` does up to four passes per frame: mask (only when
  `curtain.value > 0.001`), normal+depth of the solids (fog nulled, layer 0 only), the film
  into `frameTarget` (4× MSAA, stroke layer enabled), then the composite quad to the canvas.
  Targets follow `renderer.getDrawingBufferSize()`, not a resize listener.
- The fragment shader (163–288) is the whole look: screen-space value-noise **wobble**
  (`uWobble` 3.2 device px), **contour ink** from normal+depth discontinuities, a **hatch**
  accent gated to near-black luminance only (`smoothstep(0.1, 0.04, lu)` — the draft-5
  no-hatch compromise), the **graphite ramp** normalised so `PAPER→PAPER` and `LINE→LINE`
  are exact fixed points, and **parchment warmth** whose weight vanishes at both ends.
  Un-premultiplies on entry, re-premultiplies last (the canvas is transparent, the paper
  grain is CSS).
- Constants: `LIFT = 0.85`, `PARCHMENT = 0xd0bf9a`, `WARMTH = 0.15`.

**v2 seam (P2 item 3).** There is no recipe layer today — `timeline.ts` owns both freeze
shapes as two local helpers (`drain`, `snapBack`, timeline.ts:84–90). The "tick" and
"gliding drain" of motion §12 want to move *into* this file as named exports and be called
from the beat sheet. `curtain` being a bare mutable object with no subscribers is what
makes that easy: any tween target works, and `Film.tsx:230` + `render()` both just read
`.value` each frame. `curtainPass.material.uniforms` is already exposed on
`window.__sketch` (Film.tsx:111) for live tuning.

### `src/film/actions.ts` (492)

**Responsibility.** The puppet vocabulary. Everything here writes into timeline-owned
channels only; the gait writes only into `*.swing` + `bob`. `puppet.check.ts` asserts the
split.

**Exports.** `applyGait(g, gobT, ambient=1)` (the only per-frame function) ·
type `Stance` · `reachSolve(side, target, stance)` · `reach(...)` · `armRest(...)` ·
`crouchPose(amount)` · `crouchChest(amount)` · `plantFor(targetY, side, minStandoff=0)` ·
`cameraSideArm(heading, stand, cam)` · `stanceOf(amount)` · `crouch(...)` ·
`weightShift(...)` · `HUNCH` (0.3) · `settle(...)` · `look(...)` · `EXPRESSIONS`
(neutral/sly/flat/strain/smug/alarm) · `express(...)` · and the named actions
`peek`, `bolt`, `stoop`, `lift`, `tap`, `haul`, `shrug`, `wave`, `nudge`, `dustOff`,
`straighten`.

**The three load-bearing solves.**
- `reachSolve` — two-bone IK in chest space (the fold carries the shoulder), law of
  cosines for the elbow, closed-form inverse of the group's XYZ Euler for the aim. Clamps
  to full extension out of range (the stretch reads as a stretch). The comment at 93–99
  records two wrong answers worth not repeating.
- `plantFor` — solves *where he stands and how far he folds* from a target height, walking
  crouch amounts `[0, .2, .4, .6, .8, 1]` and taking the first fold whose standoff clears
  `READABLE = arm*0.68`. `minStandoff` is the escape hatch for jobs with a footprint the
  solve doesn't know about (map table, monster haunch).
- `cameraSideArm` — picks the working hand by which shoulder faces the lens.

**Dead export:** `shrug` (430–441) and `peek` (348–356) and `nudge` (459–467) are exported
and never called from `timeline.ts` — `peek` and `nudge` were orphaned when the open was
restaged to the cliff and the table scene went finger-only.

**v2 seam.** `EXPRESSIONS`' `EAR_Z = 1.3` (line 324) must agree with the ear pivot's base
angle in `world.ts:1099` — `express()` writes `rotation.z` absolutely. That coupling is
called out in both files and is the kind of thing a stage extraction breaks silently.
Motion §3.2's "puppet lane" is exactly this file's ease set.

### `src/film/world.ts` (4476)

See §2 — this file gets its own section.

**Exports.** interfaces `Swung`, `Arm`, `Leg`, `Face`, `Rig`, `Goblin`, `World` ·
`RIG` (the bone-length table) · `buildWorld() → World`. Everything else is module-private.

### `src/film/Film.tsx` (256)

**Responsibility.** The only React component that touches three. Default export
`Film({ caps })`.

**What it owns.**
1. `useMemo(buildWorld)` — the world is built once, at mount.
2. `createCurtainPass(gl)` memoised on `gl`; disposed on unmount (115).
3. Scene setup (57–65): `scene.background = null` (transparent canvas so the CSS grain
   shows), `scene.fog = new FogExp2(skyDusk, 0.0085)`.
4. Framing (70–80): on mount and every resize, `cam.fov = fitFov(aspect)`,
   `lens.pull = fitPullback(aspect)`, `setPencilResolution(w, h)`. The comment at 74–77 is
   load-bearing: do **not** invalidate `lens.applied` here or the pull-back compounds.
5. Alive registration (84–113): `markAlive(world.goblin.root)`, `markAlive(world.nudgeFinger)`;
   a `PointLight(0xffb45e)` parented into each of the two flame groups; QA handles
   `window.__curtain` and `window.__sketch`.
6. `buildTimeline(world, camera, scene, caps)` in a `useEffect` (118–131), with
   `window.__film = { world, tl, camera }` and a kill on cleanup.
7. **The frame loop** (133–233, priority 0) — the two clocks, the portrait pull-back, the
   camera-riding key light, flame flicker + glow, ray spin, `applyGait`, cloud drift, the
   die wobble, and the CSS `--sky` sync.
8. **The render** (238, priority 1) — `curtainPass.render(scene, camera)`. Priority > 0
   takes the render away from R3F.
9. The light rig JSX (249–255): `hemisphereLight(0xcdd9e8, 0x8a7458, 1.45)` +
   `keyRig` (a `DirectionalLight(0xffeacc, 2.2)` and its target in one Group) +
   `world.root`.

**`AMBIENT`** (15–18) is a module-level constant read once from
`matchMedia('(prefers-reduced-motion: reduce)')` → `0.3` or `1`. Motion §3.3 supersedes the
0.3 with a full stop, and §5 requires PRM flips to take effect on the next paint — today
they require a reload.

**v2 seams.** The clocks (P1 item 4) are lines 134–136. The rigs (P3) replace lines 166–176
+ 249–255. dpr cap and idle throttle (P1 item 6) belong on the `<Canvas>` in `App.tsx:153`,
not here. The hero's half-alive seam blend (P3 item 3) needs one uniform shared between the
trilayer and the rigs — `curtain.value` is the only such channel today.

### `src/App.tsx` (301)

**Responsibility.** The whole DOM side. Default export `App()`.

- `gsap.registerPlugin(ScrollTrigger)` + `ScrollTrigger.config({ ignoreMobileResize: true })`
  at module scope (9–13). `timeline.ts:29` registers the plugin a second time (harmless).
- `DISCORD_URL = '#'` and `CTA_IS_LIVE` (17–22) — the CTA is a placeholder that deliberately
  does not open a new tab while dead.
- `CAPTIONS` (31–45): 11 entries, `{ id, text, onPaper?, low?, high? }`. These strings are
  the copy-spec lines; `nat1`/`nat20` are cut (comment at 40–41).
- `RUNTIME = 66` (52) and `scrollMax() = document.body.scrollHeight - window.innerHeight`.
- Effects: scroll-restoration reset to manual + `scrollTo(0,0)` (68–71); Lenis (73–90,
  skipped entirely under PRM); the autoplay rAF (95–126); an `atEnd` scroll listener that
  flips the button to *replay* (130–137).
- Markup: `<div id="track"/>`, the fixed `<Canvas camera={{fov:42, near:0.1, far:600,
  position:[0,2.2,7]}}>` wrapping `<Film caps={caps}/>`, an `.sr-only` narrative paragraph,
  `#overlay` (blackout + the 11 caption divs + the endcard stack + the SVG rail + the scroll
  hint), and the `#play` button **outside** `#overlay` (the comment at 264–271 explains why:
  `mix-blend-mode: difference` needs the film as its backdrop).
- `caps` is a `useRef({}).current` populated by ref callbacks — it is the map
  `timeline.ts` tweens through.

**v2 seams.** Gearing wires in at the `<div id="track"/>` height and/or at the
ScrollTrigger config in `timeline.ts`. The dpr cap, `visibilitychange` pause and idle
throttle (P1 item 6) are all edits inside this file. The margin/ruler/chapter-numeral
layer of experience §4 is a new sibling of `#overlay`. The hand-lettered captions of
experience §4 replace the `CAPTIONS` array + `.caption` CSS, but **must keep the same
element ids** or every `cap()` call in the beat sheet silently no-ops (`cap` returns early
on a missing id, timeline.ts:68).

### `src/Wordmark.tsx` (130)

Pure SVG, no props, no state. `viewBox="-24 -112 800 490"`, `fill="var(--line)"`, one
`feTurbulence`+`feDisplacementMap` filter (`#gg-carve`, scale 7, seed 7) over the whole
group. Letterforms are hand-authored paths in `<defs>` (`gg-O`, `gg-D`, `gg-B`, `gg-L`,
`gg-I`, `gg-N`, `gg-G`), plus `gg-die` and `gg-gob`. The word carries a
`stroke="var(--paper)" strokeWidth="13" paintOrder="stroke"` halo so it knocks itself out
where it crosses the goblin. Depends on the CSS custom properties `--line` and `--paper`.

### `src/main.tsx` (16) / `index.html` (18) / `vite.config.ts` (6)

`main.tsx` mounts `<App/>` in `<StrictMode>` and imports `@fontsource/metamorphous/400.css`,
`@fontsource/cinzel/400.css`, `@fontsource/cinzel/700.css`, `./styles.css` — self-hosted, no
CDN. StrictMode double-invokes effects in dev: `buildTimeline` runs twice and the first
timeline is killed by its cleanup; anything stateful added to that effect must survive it.
`index.html` has `theme-color #f7f5f0`, the description meta (which is copy), and
`<div id="root">`. `vite.config.ts` is the React plugin and nothing else — no `base`, no
aliases, no manual chunks, no asset handling. P16's budget work starts from zero config.

### `src/styles.css` (499)

- `:root` tokens: `--paper: #f7f5f0`, `--line: #222222`, `--sky: var(--paper)`.
  **`--sky` is written from JS every frame** (Film.tsx:231).
- `body::after` — a fixed three-stop gradient mixed from `--sky` (zenith `#313c5e`,
  horizon `#ffe9c8`); `body::before` — a fixed fractal-noise SVG data-URI at `opacity .1`,
  `mix-blend-mode: multiply`. Both `position: fixed` because the track is 1800vh.
- **`#track { height: 1800vh }`** (line 60) — the single number that sets the film's scroll
  length. Nothing in JS reads or writes it.
- `.caption` — lower-third band at `top: 78%`, `88vw / max 900px`, Metamorphous,
  `clamp(1.15rem, 2.8vw, 2.1rem)`, `opacity: 0` (the timeline's tween target), a triple
  paper text-shadow halo. Modifiers `.on-paper` (ink), `.low` (smaller), `.high`
  (`top: 24%`, for the me1–me4 freeze where the band crosses the tunic).
- `#endcard` stack + `.halo` (an 8-shadow paper knockout) + `#endcard-cta` with its
  rotated `::after` second pass. Note lines 216–219: a `[style*='clip-path']` attribute
  selector pins opacity to 1 — the write-on wipe never tweens opacity, so without this
  rule the tagline/subline stay invisible. **Any change to the endcard entrance must keep
  that contract.**
- `#rail` is display:none unless `@supports (animation-timeline: scroll())`; it is a pure
  CSS scroll-timeline, no JS.
- `#play` uses `mix-blend-mode: difference` to stay legible over both blackout and paper.
- `@media (prefers-reduced-motion: reduce)` (492–499) kills only the rail animation.

### `scripts/*.check.ts` (5 scripts, all in `npm run check`)

Run as `node --experimental-strip-types scripts/<n>.check.ts`, plain `node:assert/strict`,
each ends with a `console.log`. No framework, no runner, no watch.

| Script | Lines | Asserts |
|---|---|---|
| `framing.check.ts` | 41 | 42° at 16:9 untouched; equal hfov at 16:9 vs 4:3; portrait opens and clamps at 70; ultrawide keeps 42; pull-back covers ≥0.9× the authored width, is exactly 1 wherever the clamp doesn't bite, and caps at 2.2. |
| `die.check.ts` | 28 | Top face points up; one X tilt lands the neighbour up; the tilt is one face (35–48°); it leans toward camera. |
| `pencil.check.ts` | 98 | `sketch` = fill+edges (+shell only when asked); 12 edges × SUB sub-strokes; wobble bounded ≤0.06; shell rim is a constant world thickness at two radii; polyline/curveLine/hatch/rays stroke counts; numerals centred on the origin. |
| `puppet.check.ts` | 256 | **Builds the whole world** (`buildWorld().goblin`). Channel ownership (gait vs timeline, no overlap); hierarchy (head+arms on chest, legs on pelvis not bob); a golden rest pose to 1e-6; gait contributes exactly 0 at speed 0; breath still runs at speed 0 and is bounded; crouch keeps the ankle on the floor; reach lands the hand within 1e-3 at seven authored prop heights, with the elbow in front of the shoulder; out-of-range straightens to full extension; a planted hand does not drift under breath; the expression set is complete and in range. |
| `curtain.check.ts` | 173 | `paint` puts colour under the drawing only; materials shared by colour; repaintable; polygonOffset survives the clone; `weight` keeps paint; the graphite ramp's two fixed points under four lifts; parchment weight vanishes at both ends; **four source-text greps** on `curtain.ts` (un-premultiply, re-premultiply, tonemapping include, colorspace include, and the ordering between them); the mask rules (solids in, strokes never, shell is mask-only, opens and closes on scrub, reused not stacked, blob fallback clamped). |

**The constraint that matters for v2:** `puppet.check.ts` imports `world.ts`, so **every
module reachable from `world.ts` must run under `--experimental-strip-types` in Node** —
no JSX, no CSS imports, no bare `window`/`document` access (`pencil.ts:34` and
`Film.tsx:16` both guard with `typeof window !== 'undefined'`). New `src/film/stages/*.ts`
modules inherit that rule the moment `buildWorld` reaches them.

---

## 2. THE EXTRACTION MAP — every scene `world.ts` builds

`buildWorld()` (4388–4476) calls eight builders in order and adds seven containers to one
root; `buildGoblin` is threaded into `buildAmbush` rather than added separately.

```
buildGoblin()        844–1281   (parked into the ambush container at 1749–1750)
buildAmbush(goblin) 1530–1764   → container, camp, treeline, ambushFlames, adventurers
buildPathProps()    1800–2216   → container + 13 named props
buildGround()       2223–2588   → container, tufts, pathForestFront, pathForestMid, pathClouds
buildTheatre()      2591–2884   → container, stageDisc, rope
buildTavern()       2921–3388   → container, die, dieInner, dieTipAngle, nudgeFinger
buildMontage()      3391–3880   → container, roadLine, monster, tavernSign, trees5,
                                  chest5Lid, chest5Coins, candleRays
buildCliffWorld()   3903–4386   → container, miniWorld, cliff, die2, board, remains,
                                  tended, bolt, arrows2, impacts
```

### 2.1 Shared vocabulary (extract first — everything else depends on it)

| Symbol | Lines | What | Used by |
|---|---|---|---|
| `COLUMN` / `BOULDER` / `STUMP` | 39–61 | Metaball ball-lists in unit space | limb, trunkOf, logs, stumps, bedroll |
| `limb(r, len, w, shell)` | 67–75 | Sculpted limb hung from its top pivot | goblin legs/arms, adventurer legs/arms, oak forks |
| `trunkOf(d, h, w)` | 79–88 | Standing root-heavy trunk | pines, oaks, the perch tree |
| `rock(w, tier, turn)` | 97–105 | Roughened flattened dodecahedron | ambush outcrop, hearth ring, cave rocks, pebbles, scree, cliff chunks, map weights |
| `buildRayBurst(x,y,z)` | 109–119 | Ray burst in a scale-0 Group, painted `rayGold` | fire2Rays, lanternRays, candleRays, the 3 impacts |
| `buildBolt()` | 123–133 | Wizard's bolt streak + tip flare, `visible=false` | the restaged open |
| `buildFlames(lit)` | 138–187 | 5 leaning lathe tongues + 2 embers; `userData.lit` drives scale in Film.tsx | ambush fire, path fire, tavern hearth |
| `buildChest(x,y,z)` | 190–285 | `{container, lid, coins}`; domed lid on a back-edge hinge | C2 prop, C5 vignette 4 |
| `treeSeed` / `treeVary` | 290–294 | Build-order deterministic per-tree variation | every tree |
| `lobedCrown(r, h, seed)` | 301–335 | Lathe + integer-order angular lobing + roughen | buildOak, the C2 perch tree |
| `buildPine(r,h,trunkH,fill)` | 343–420 | 4-tier scalloped lathe conifer | 6 backdrops |
| `buildOak(r,h,fill)` | 425–474 | Forked trunk + lobedCrown + 2 seam scores | mixed into every treeline |
| `buildRaven()` | 479–545 | Sculpted no-neck teardrop + wedge beak + blade tail | 3 on the C2 branch |
| `buildMushroom()` | 547–592 | Scale-0 toadstool: stem, lathe cap, gills, 3 spots | C2 ×3, C6 tended ×3 |
| `buildHouse(roofColor)` | 598–664 | Gabled cottage | 8 in the miniature |
| `cauliflowerShape()` | 1771–1783 | Cloud plate outline | ambush clouds, pathClouds |
| `streakShape()` | 1788–1797 | Stratus sliver outline | 3 horizon streaks (never drift) |
| `buildFinger()` | 2888–2918 | The one part of him C4 shows | nudgeFinger |
| `buildArrow(len)` | 3885–3900 | Shaft + crossed fletch, tip at the origin | remains ×5, arrows2 ×2 |
| `RIG` | 816–830 | Bone lengths — the numbers `actions.ts` solves against | goblin, both solvers, puppet.check |
| Interfaces | 671–810 | `Swung`/`Arm`/`Leg`/`Face`/`Rig`/`Goblin`/`World` | everything |

### 2.2 `buildGoblin()` — 844–1281 · serves every stage

Origin at feet, faces +z, ~0.9 units tall. Hierarchy:
`root → pelvis → { legL.pose, legR.pose, bob → chest → { neck → head → …, armL.pose, armR.pose } }`,
plus a `contact()` shadow on the root (1275).

| Part | Lines |
|---|---|
| root / pelvis / bob | 845–855 |
| `buildLeg` (thigh, shin+wrap, foot sculpt, toe pivot) | 857–924 |
| chest + one-piece olive cloak lathe | 926–953 |
| satchel + strap | 957–967 |
| collar/cowl | 970–973 |
| flank hatch tone | 976–979 |
| neck + neck stub | 983–988 |
| skull (chestnut lathe) | 992–1012 |
| hood shell + peak + rim + tail | 1014–1067 |
| ears (`earShape`, `buildEar`, earring / bandage) | 1069–1129 |
| eyes (amber disc, rim, slit pupil, glint) + brows | 1131–1174 |
| nose | 1176–1188 |
| mouth + fang, `face` record | 1190–1206 |
| jaw hatch tone | 1209–1212 |
| `buildArm` (upper, elbow, forearm, cuff, wrist, mitt) | 1214–1267 |
| assembly + return | 1269–1280 |

**Couplings:** ear pivot `rotation.z = -side * 1.3` (1099) must equal `EAR_Z` in
`actions.ts:324`. `RIG` values are read by `crouchPose`, `plantFor`, `reachSolve`.
Five `hatch()` calls live inside the goblin (flank, jaw) — no-hatch removals hit here.

### 2.3 `buildAmbush(goblin)` — 1530–1764 · **Stage 1–2 (t0–16.5)** + the t29.1 treeline reveal

Set at the world origin; the camera opens on it and later pushes into the hero close-up.

| Piece | Lines | Notes |
|---|---|---|
| hero rock | 1536–1540 | `rock(1.8,'hero')`, scale.y .75 |
| outcrop (3 chunks) | 1544–1557 | kept off z=+0.9 |
| rock contact shadow | 1562–1564 | |
| rock-face tone (2 hatch) | 1567–1575 | |
| `ambushFlames` | 1577–1579 | at (−2.2, 0, 0.6), `lit=1` |
| hearth ring (7 stones) | 1583–1589 | |
| 2 fire logs + scorch | 1590–1606 | |
| camp kit: bedroll, pack+flap, spear+head | 1608–1646 | x −4.0 … −1.5 |
| **treeline** front row (8, every 3rd an oak) | 1653–1676 | z −15.5 … −21.0 |
| treeline mid row (8) | 1680–1692 | z −24 … −26.5 |
| back-row band plates (2) | 1695–1717 | `bandShape`, z −33/−35 |
| cloud plates (3) | 1720–1729 | z −37 … −42 |
| adventurers (3) | 1732–1747 | one crimson, two indigo; `rotation.y = π/2` |
| goblin parked behind the rock | 1749–1750 | `(0.5, −0.7, 0.9)` — overwritten by the timeline at t0 |
| **the camp split** | 1757–1761 | `camp` = every child that is neither `treelineGroup` nor `goblin.root` |

**Extraction hazard.** `camp` is assembled by *filtering `container.children` after the
fact*. Re-parent anything in this builder and the gate at `timeline.ts:141`
(`onlyFor(world.camp, 0, 18)`) silently changes what it hides. The three adventurers are
inside `camp`, and they are also `world.party` — the figures the restaged open teleports to
x≈106–109 at t0. They therefore go invisible at t18 and never come back, which is correct
today but is a live coupling between C1's set gate and the cliff staging.

### 2.4 `buildPathProps()` — 1800–2216 · **Stage 3 (t16.5–30)**, seven prop beats in +x order

| Prop | Lines | World x | Timeline beat |
|---|---|---|---|
| `fire2Flames` + `fire2Rays` | 1803–1807 | 6 | c2 prop 0 (`lit`→1, rays pop, reveal) |
| `lanternPost` (base tiers, pole, collar, finial, curved arm, scroll, S-curl, hook+ring, cage housing, shadow) + `lanternRays` | 1809–1908 | 10 | c2 prop 1 |
| `cave` (3 rocks, mouth fill + crossHatch + 4 rim chips, timber doorframe) | 1910–1972 | 13.2–14.9 | c2 prop 2 (revealed with the door) |
| `caveDoor` (round-topped extrude, 4 plank seams clipped to the arc, 2 strap hinges + curls + rivets, ring handle) | 1974–2048 | 13.4 | c2 prop 2 (`rotation.y → −1.9`) |
| `chest` (via `buildChest`) | 2050–2051 | 18 | c2 prop 3 (lid + coins) |
| perch tree (trunk, 2 twigs, `lobedCrown`) | 2053–2086 | 21.2 | scenery |
| branch + 3 `ravens` | 2092–2107 | 22 | c2 prop 4 (scatter — **no reveal**, this beat eases the curtain instead) |
| 3 `mushrooms` | 2109–2119 | 26 | c2 prop 5 |
| `signPost` (post, cap, base, back board + letters + point, 2 lashings) | 2121–2163 | 30 | c2 prop 6 (revealed with the board) |
| `signBoard` (arrow-shaped extrude, 2 letter rows, 2 nails) | 2165–2198 | 30 | c2 prop 6 (`rotation.z 0.5 → 0`) |

### 2.5 `buildGround()` — 2223–2588 · the film's only infinite ground + all Stage-3 dressing

**This is the builder P2 exists to kill** ("no infinite ground planes anywhere in v2").

| Piece | Lines | Extent |
|---|---|---|
| `earthPlane` | 2242–2246 | 270×300 at (−25,0,0) → **x −160…110** |
| `grassPlane` | 2248–2252 | 210×300 at (215,0,0) → **x 110…320** |
| `campGround` (worn patch) | 2254–2258 | r=4 circle at (−2.2, .006, .3) |
| path edges (2 curveLines off a 5-point spine) | 2262–2279 | x 2→36 |
| `tufts` (5 groups, double-fan blades) | 2287–2319 | far verge only |
| `pathForestFront` / `pathForestMid` (44 trees) | 2336–2390 | x 5–35.3, z −6…−14 |
| near-side forest (6) → front group | 2378–2389 | z 4.6–5.8 |
| sprigs (5) | 2395–2412 | |
| back-row bands (3) | 2418–2440 | z −25…−27 |
| `pathClouds` (5, `userData.baseX`) | 2445–2458 | drift in Film.tsx |
| horizon streaks (3, never in `pathClouds`) | 2463–2471 | |
| sun disc + sunRays | 2476–2487 | (26, 8.6, −22) |
| ground dashes (7) + pebbles (4, 3 double-edged) | 2491–2531 | |
| contour clusters (9) | 2537–2559 | includes 3 at the C1 camp |
| roadside stump + shadow | 2564–2579 | (19, .17, −5.5) |

**Geometry note for P2/P7:** the `earth`/`grass` seam sits at **x = 110** — between the
restaged party (x 106.9–109.4) and the cliff (x 120), i.e. inside Stage 1's S2 frame
(camera 102 → look 117.4). Two different fills meet with no transition there. Worth
looking at in the P0 baseline stills before the island kit removes the question.

### 2.6 `buildTheatre()` — 2591–2884 · **Stage 4 (t30–38)**

`stageDisc` at (44, 0, −2), r=7, top face y=0.3. Forest half on local −x (faces the path at
rotation 0), snowy mountain half on local +x (swings to camera after `+= π`).

| Piece | Lines |
|---|---|
| disc mesh | 2594–2599 |
| kerb, 16 radial plank lines, the heavier half-joint line, under-rim tone | 2605–2629 |
| forest half: 8 trees | 2632–2655 |
| forest floor: 3 tone patches, 2 stumps + rings, 3 boulders, fallen trunk | 2657–2716 |
| mountain half: 3 peaks + snow caps + rock tone + ridge lines | 2718–2774 |
| scree (3) + foot treeline (5 pines) | 2775–2796 |
| `rope` at (38.5, 0, 1): catenary tube, 6 strand wraps, knot, 3 frayed strands, 3-loop ground coil, feed line | 2800–2881 |

The boulder at local (−1.0, −5.71) carries a comment recording why it was moved — it used
to sit exactly where the haul/wave beats plant him.

### 2.7 `buildTavern()` — 2921–3388 · **Stage 5 (t38–50)**, centred on x=80

| Piece | Lines |
|---|---|
| floor plane 12×22 at (80,.01,7) + 15 board lines + 6 butt joints | 2929–2951 |
| back wall 12×14 at z=−4; two 8×14 wings at x=74/86 | 2953–2977 |
| timber framing: 4 posts, 2 beams, 3 plaster bays | 2979–3002 |
| window: night fill + crossHatch, frame, mullions, sill | 3004–3037 |
| hearth: breast, mantel, firebox fill + crossHatch, 2 logs, `buildFlames(1)` ×1.4, hearthstone | 3039–3082 |
| shelf + 5 bottles | 3084–3105 |
| table: top, lip, 6 chord plank seams, wear tone, leg, foot, contact | 3107–3144 |
| **`die` / `dieInner`** + 20 numerals (`dieFaces(0.35)`, the 20-face pre-rotated into its post-tilt frame) | 3146–3190 |
| `nudgeFinger` parked at (80.04, 1.02, −0.56), scale 0 | 3192–3197 |
| DM + 2 players (`buildAdventurer(false, indigo)`) | 3199–3214 |
| 3 mugs + handles | 3216–3231 |
| 3 character sheets + writing, pencil stub | 3233–3256 |
| DM screen (3 panels, printed tone) | 3258–3280 |
| tankard + handle + foam | 3282–3296 |
| candle: dish, stick, shaft, flame, always-on ray burst | 3298–3338 |
| 3 benches | 3340–3360 |
| door: slab, 3 planks, 2 bands, knob | 3362–3385 |

The room's 14-unit wall height and 22-unit floor depth are sized against
`framing.ts`'s `MAX_PULLBACK = 2.2` — shrink either and portrait sees outside the set.

### 2.8 `buildMontage()` — 3391–3880 · **Stage 6 (t50–57.5)**, six platforms at z=−40, x=0/8/16/24/32/40

| Vignette | Lines | Contents |
|---|---|---|
| all six platforms (disc, rim, ring tone, contact) | 3396–3414 | top face y=0.2 |
| 0 — map table | 3416–3476 | table+4 legs, map sheet, coastline, 2 weight stones, inkpot, quill, **`roadLine`** (scale.x 0→1) |
| 1 — **`monster`** | 3478–3658 | lathe bulk + `bulkR()` lookup, 7 shag clumps (3–6 tick strokes each), 2 arms (upper/forearm/mitt/3 claws), horn nubs, brow ridges + pale eyes, maw line, 2 tusks |
| 2 — **`tavernSign`** | 3660–3766 | wall fragment + 4 planks + plinth + shuttered window, bracket + brace, sign plank + border + tankard device + 6 chain links, bracket curl |
| 3 — **`trees5`** | 3768–3802 | mound tone, old stump + rings (outside `trees5`), 3 scale-0 trees |
| 4 — **`chest5`** | 3804–3820 | `buildChest`, hoard tone, 2 crates |
| 5 — candles | 3822–3868 | table + leg, 3 candles with wick/drip/holder, book + writing, **`candleRays`** |

### 2.9 `buildCliffWorld()` — 3903–4386 · **Stages 7–8 (t57.5–66)** *and* the restaged open (t0–9.5)

Two eras in one builder — this is the one to split most carefully.

| Piece | Lines | Serves |
|---|---|---|
| `cliff` group at (120,0,0); 3 roughened tiers, top face **y=6** | 3911–3932 | S1–S2 and S7 |
| 6 crack hatch patches on the plateau | 3934–3954 | S7 top-down |
| 2 top chunks + 4 talus chunks | 3956–3972 | both |
| **`remains`** — 2 rim arrows, 3 face arrows, 2 face scorches, 2 rim scorches, dropped shield, trample mark | 3974–4046 | visible by default; hidden at t57.5 |
| **`tended`** — 5-stone cairn (roughened drums, offset/spun/tilted), 3 mushrooms | 4048–4091 | hidden by default; shown at t57.5 |
| **`bolt`**, **`arrows2`** (2), **`impacts`** (3 ray bursts) | 4093–4119 | the restaged open only (t5–9.5) |
| 8 houses (2 with ember roofs) → `miniWorld` | 4125–4142 | the flatten |
| 12 miniature trees → `miniWorld` | 4144–4167 | the flatten |
| `mountain` massif + snow + 2 shoulders + 3 ridge lines + tone → `miniWorld` | 4169–4211 | the flatten |
| 2 roads (double-edged curveLines) | 4213–4233 | not in `miniWorld` — they do **not** flatten |
| river: 2 coloured edges + 6 tangent-aligned water tones | 4235–4263 | ditto |
| 6 fields (holder group + fill + till hatch + hedge outline) | 4265–4311 | ditto |
| **`die2`** at (122.8, 6.8, 0), scale 0 | 4313–4317 | the throw |
| **`board`** at (145, 35.4, 0): `boardFill` (its own named `board-fill` material), GridHelper 24×24, two rule loops, corner trim marks — **every material board-local, transparent, opacity 0** | 4319–4383 | the last image |

**Contract:** the board's materials must stay local to that group and start at opacity 0 —
`timeline.ts:918–928` traverses the group, collects every material it finds, and fades them
all up. A shared material in there drags the rest of the film's opacity with it.

### 2.10 Dead / redundant fields on `World`

Counted by grep across `timeline.ts` and `Film.tsx`, the only two consumers:

- `adventurers` — 0 uses. Same array object as `party` (both `ambush.adventurers`).
- `cliff` — 0 uses.
- `pathForestFront`, `pathForestMid` — 0 uses. The groups render; nothing addresses them.
- `dieWobble` — never written by the timeline; `Film.tsx:221`
  (`world.die.rotation.z = 0.02*sin(gobT*6)*world.dieWobble`) therefore always evaluates to
  0, which makes the outer `world.die` wrapper and that line dead motion.
- `actions.ts` exports `peek`, `shrug`, `nudge` — none is called by the beat sheet.

---

## 3. Scroll → film time, exactly

### 3.1 The chain

```
styles.css:57–61   #track { position: relative; width: 100%; height: 1800vh }
App.tsx:152        <div id="track" />                       ← the only scroll-height source
timeline.ts:54–62  gsap.timeline({
                     defaults: { ease: 'none' },
                     scrollTrigger: { trigger:'#track', start:'top top',
                                      end:'bottom bottom', scrub: 0.8 }})
Film.tsx:118–131   buildTimeline(world, camera, scene, caps)   ← built once per mount
```

Nothing else maps scroll to time. There is no `onUpdate`, no manual `tl.time()` write, no
`ScrollTrigger.create` anywhere else.

### 3.2 The formula

With `H = window.innerHeight`, `#track` is the only non-fixed element (`canvas`, `#overlay`
and `#play` are all `position: fixed`), so:

```
documentHeight = 18·H                     (1800vh)
scrollMax      = 18·H − H = 17·H          ( = App.tsx's scrollMax(), and ScrollTrigger's
                                            'bottom bottom' end, exactly )
progress p     = scrollY / (17·H)                                  ∈ [0,1]
target time    = p · tl.duration()
actual time    = target, approached with GSAP's numeric scrub → a 0.8 s ease toward it
```

`tl.duration()` is implicit — GSAP takes it from the last child's end. The last tween is the
CTA label at `ctaAt + 0.1` for `0.1` → **≈ 65.716**, not 66. (Chain:
`entranceAt 65.0` → `taglineAt 65.23` → `sublineAt 65.386` → `ctaAt 65.516` → label ends
65.716; the comment at timeline.ts:1030 says "settles by ~t65.72".)

### 3.3 Autoplay

`App.tsx:95–126`. A rAF loop that writes the **scroll position**, not the timeline:

```
dt = min((now − last)/1000, 0.1)          // backgrounded-tab clamp
end = scrollMax()
y   = min(scrollY + (end / RUNTIME)·dt, end)      // RUNTIME = 66  (App.tsx:52)
lenis ? lenis.scrollTo(y, {immediate:true}) : window.scrollTo(0, y)
if (y >= end − 1) → setPlay('ended')
```

So play mode traverses the full track in 66 s of wall clock, and the film's ~65.72 t are
spread over those 66 s — play pace is **0.996 t/s**, ~0.4 % slow. Marginal, but it means
`RUNTIME` and the beat sheet's real length are not the same number today.

Playback yields to any `wheel` / `touchstart` / `keydown` (116–125). A separate always-on
scroll listener (130–137) flips the button to *replay* at the bottom. There is **no
`visibilitychange` listener** — only the dt clamp (motion §2 adjudication #4).

### 3.4 Where gearing attaches (P1 item 5)

Two candidate seams, and only two:

1. **`#track` height** (styles.css:60) — changes total scroll, not the mapping's shape.
2. **The scrub mapping itself.** ScrollTrigger's `progress` is linear by construction, so a
   piecewise stage map means either (a) re-timing the timeline so authored t values already
   carry the gearing (rejects the beat sheet's t vocabulary), or (b) taking the timeline off
   `scrollTrigger:` and driving `tl.time(gearing(progress))` from a standalone
   `ScrollTrigger.create({ onUpdate })`, re-implementing the 0.8 s scrub as an explicit
   lerp. (b) preserves the authored t numbers, which every doc, every check and every
   comment in this codebase is written against. Whichever is chosen, `App.tsx`'s autoplay
   must use the **inverse** map or play mode stops being 1 t/s.

Also note: `scrub: 0.8` is a *numeric* scrub — GSAP eases the playhead toward the scroll
target over 0.8 s. Anything that reads "current t" for a HUD or a rest-anchor snap must read
`tl.time()`, not the scroll position.

---

## 4. The three mechanisms the rebuild must not break

### 4.1 Captions — the `cap()` idiom

```ts
// timeline.ts:67–72
const cap = (id: string, at: number, hold: number, fade = 0.4) => {
  const el = caps[id];
  if (!el) return;                                   // ← silent no-op on a missing id
  tl.to(el, { opacity: 1, duration: fade }, at);
  tl.to(el, { opacity: 0, duration: fade }, at + hold);
};
```

`caps` is `Record<string, Element>`, built in `App.tsx` by ref callbacks on every
`.caption` div **and** on `endcard`, `endcard-wordmark`, `endcard-tagline`,
`endcard-subline`, `endcard-cta`, `endcard-cta-label`. The base `opacity: 0` lives in CSS.
`Element` not `HTMLElement` on purpose — the same tween shape drives SVG paths.

The eleven calls, in order:

| id | at | hold | fade | window (in→out end) |
|---|---|---|---|---|
| `open1` | 0.5 | 2.5 | 0.4 | 0.5 → 3.4 |
| `open2` | 8 | 1.6 | 0.4 | 8 → 10.0 |
| `me1` | 12.6 | 0.55 | 0.25 | 12.6 → 13.40 |
| `me2` | 13.52 | 0.55 | 0.25 | 13.52 → 14.32 |
| `me3` | 14.44 | 0.5 | 0.25 | 14.44 → 15.19 |
| `me4` | 15.32 | 0.7 | 0.25 | 15.32 → 16.27 |
| `light1` | 19 | 4 | 0.4 | 19 → 23.4 |
| `set1` | 32.6 | 2.0 | 0.4 | 32.6 → 35.0 |
| `welcome` | 47.3 | 1.3 | 0.4 | 47.3 → 49.0 |
| `pitch1` | 58 | 2.2 | 0.4 | 58 → 60.6 |
| `pitch2` | 62.6 | 1.0 | 0.4 | 62.6 → 64.0 |

The me1–me4 run is spaced **0.12 t edge-to-edge** at `fade 0.25` — the tightest timing in
the film, and the reason `fade` is a parameter at all. Experience §4's hold rule
(`≥ max(authored, chars×55ms + 500ms)`) will lengthen several of these; check the me-run
for overlap when it does.

Two overlay tweens do **not** go through `cap()`: `tl.to('#hint', {opacity:0, duration:0.3}, 0.6)`
(a raw selector) and the `#blackout` fade at t4 over 1.5 s.

The endcard (timeline.ts:938–1030) is hand-authored rather than `cap()`-driven: wordmark
opacity at 65.0, then tagline and subline as **clip-path wipes** (`inset(0 100% 0 0)` →
`inset(0 0% 0 0)`), then the CTA box, then its label. **`reducedMotion` is captured once at
build time** (timeline.ts:945–947) and swaps the wipes for opacity fades — a live PRM flip
does nothing without rebuilding the timeline.

### 4.2 The curtain — `drain()` and friends

```ts
// timeline.ts:84–90
const drain    = (at, to, dur) => tl.to(curtain, { value: to, duration: dur, ease: 'power2.inOut' }, at);
const snapBack = (at)          => tl.to(curtain, { value: 0,  duration: 0.12, ease: 'power4.out' }, at);
```

`curtain` is the bare `{value:0}` object exported from `curtain.ts:27`. Every call sits next
to a `world.timeScale` tween — the curtain never gets a beat of its own:

| t | call | paired clock move |
|---|---|---|
| 12.5 | `drain(12.5, 1, 0.6)` | `world.timeScale → 0` over 0.2 |
| 25.4 | `drain(25.4, 0.25, 1.4)` | — (the ravens beat: no prop to reveal, so the curtain itself eases) |
| 30 | `snapBack(30)` | `world.timeScale → 1` over 0.12 |
| 40.6 | `drain(40.6, 1, 0.5)` | `world.timeScale → 0` over 0.15 |
| 47 | `snapBack(47)` | `world.timeScale → 1` over 0.3 |

Consumers: `createCurtainPass.render` reads `curtain.value` into `uCurtain` every frame and
**skips the mask pass entirely** below 0.001; `Film.tsx:230` lerps the CSS `--sky` toward
paper by the same value so the DOM grain layer drains with the canvas.

`reveal()` is added with `tl.add(reveal([...], {...}), at)` — 8 calls, all in Stage 3:
props 0,1,2,3,5,6 on their own `actionAt`, plus `tufts` (radius 0.12) and `treeline` at
t29.1. Prop 4 (ravens) has none by design.

`markAlive` is called exactly twice, both in `Film.tsx:85–90`: `world.goblin.root` and
`world.nudgeFinger`.

### 4.3 The two clocks

```ts
// Film.tsx:133–136 — useFrame priority 0
world.t    += delta * world.timeScale;   // freezable
world.gobT += delta;                     // never
```

| Clock | Written | Read by |
|---|---|---|
| `world.t` | Film.tsx:134 | flame flicker + point-light glow (179–190), ray-burst spin (192–196) |
| `world.timeScale` | timeline.ts (4 tweens: 0@12.5, 1@30, 0@40.6, 1@47) | the `world.t` accumulator, and nothing else |
| `world.gobT` | Film.tsx:135 | `applyGait` (gait + breath), cloud drift (211–218), the die wobble (221) |
| `goblin.speed` | timeline (≈14 tweens) | gait amplitude — at 0 every gait term is exactly 0, so the authored pose is released, not overridden |
| `goblin.planted` | `reach()` / `armRest()` in actions.ts | kills the breath's contribution so a planted hand stays on its prop |

The freeze grammar in one line: **`timeScale → 0` stops everything downstream of `world.t`
same-frame; `gobT` keeps running, so he is alive by construction rather than by exception.**
`applyGait` lives in `actions.ts` (not the render loop) specifically so `puppet.check.ts`
asserts against the shipping code.

Cloud drift is a pure function of `gobT`
(`euclideanModulo(baseX + gobT*0.4*A − (−8), 46) + (−8)`), not an accumulator, so a scrub
back never meets a seam.

---

## 5. Seam summary for P1–P12

| v2 system | Attaches at | Watch out for |
|---|---|---|
| Palette tokens (P1.1) | `palette.ts` wholesale; `PAPER`/`LINE` stay in `pencil.ts` | the 7 `sky*` names are read by name in `timeline.ts` and `Film.tsx` |
| Motion tokens (P1.2) | new `src/film/motion.ts`; call sites are `timeline.ts` + `actions.ts` + `styles.css` | the "puppet lane never in camera/UI" grep assertion must survive stage extraction |
| Fonts (P1.3) | `main.tsx` imports, `styles.css` family declarations, `Wordmark.tsx` is path art (no font) | |
| Clocks (P1.4) | `Film.tsx:133–136`; invariants live in `timeline.ts` | `tl.set` pairs at the same position replay in reverse on backward scrub (the `onlyFor` comment at 130–133 is the shipped bug) |
| Gearing (P1.5) | `styles.css:60` + the `scrollTrigger` block at `timeline.ts:56–61`; inverse into `App.tsx:95–126` | duration is ~65.716, not 66 |
| Engine fixes (P1.6) | `<Canvas>` props in `App.tsx:153`; the rAF at 95–126; Lenis at 73–90 | |
| Dev HUD (P1.7) | `App.tsx`; read t from `tl.time()`, and `window.__film` already exposes `{world, tl, camera}` | |
| Island kit (P2.1) | replaces `buildGround()` 2242–2258 first, then per-stage | `buildGround` also owns all of Stage 3's dressing — split before deleting |
| Trilayer (P2.2) | `pencil.ts` `fillMaterial` / `plateFill` / `shellMaterial` + `paint()`'s role switch | `clone()` drops `onBeforeCompile`; re-patch (pencil.ts:200) |
| Curtain recipes (P2.3) | promote `drain`/`snapBack` out of `timeline.ts:84–90` into `curtain.ts` | 5 call sites, all paired with a `timeScale` tween |
| Rigs (P3) | `Film.tsx:166–176` (key placement) and 249–255 (JSX rig); flicker at 179–190 | `AMBIENT` is captured once at module scope |
| Stage modules (P7–P12) | the eight builders in §2 | `puppet.check.ts` imports `world.ts` → every stage module must run in Node with no `window` |

---

## 6. Surprises against the brief's v1 code map

1. **`Film.tsx` is at `src/film/Film.tsx`, not `src/Film.tsx`.** The map (and the P0 brief)
   lists it beside `App.tsx`. Every other path in the map is right.
2. **Every line count in the map is exact** — world 4476, timeline 1033, pencil 601,
   actions 492, curtain 435, Film 256, framing 43, palette 97, dieGeometry 64, sculpt 58,
   App 301, Wordmark 130, styles 499, main 16. Nothing has drifted.
3. **The timeline is ~65.716 t long, not 66.** `RUNTIME = 66` in `App.tsx` is therefore a
   near-miss rather than the true length; play mode runs ~0.4 % slow.
4. **Dead code, confirmed by grep** (§2.10): `World.adventurers`, `World.cliff`,
   `World.pathForestFront`, `World.pathForestMid` have zero consumers; `World.dieWobble` is
   never written, which makes `Film.tsx:221` and the `world.die` wrapper inert;
   `actions.ts`'s `peek`, `shrug` and `nudge` are exported and never called; `palette.ts`'s
   `moss` and `lanternGlass` have no references at all, and `gobSkinLit` / `gobTunic` /
   `gobTunicShade` are named only by `pencil.ts`'s `QUIET_PIGMENT` set — never painted.
11. **Import extensions are inconsistent.** `world.ts`, `actions.ts` and `curtain.ts` use
    explicit `./x.ts` specifiers (required by the `--experimental-strip-types` check
    scripts); `timeline.ts:27` and `Film.tsx` use extensionless `./actions` / `./world`,
    which only resolve through Vite. `allowImportingTsExtensions` is on in `tsconfig.json`,
    so both compile — but a new module that a check script must import has to use the
    extensioned form.
5. **Hidden/undeclared files in the tree** (all git-ignored or untracked):
   `story/.impeccable/hook.cache.json`, `story/src/film/.impeccable/hook.cache.json`,
   `story/bible-vs-build.html` (461 KB), `story/docs/art-bible.html` (107 KB) and
   `story/docs/2026-08-18-cliff-hook-plan.md`, an empty `story/dist/`, and
   `story/../assets/goblin-backstabber-male/`. `.gitignore` covers
   `node_modules/ dist/ node-compile-cache/ .DS_Store .impeccable/`.
6. **`prefers-reduced-motion` is sampled three times, all once-only:** `App.tsx:47`
   (per-render, gating Lenis), `Film.tsx:16` (module scope, `AMBIENT`), `timeline.ts:945`
   (build time, endcard wipes). None of them re-evaluates on a live PRM change, which
   motion §5 requires.
7. **`buildAmbush`'s `camp` group is assembled by filtering `container.children` after the
   fact** (1757–1761), and the three adventurers are inside it *and* are `world.party`.
   Any re-parenting in that builder changes what the t18 set gate hides.
8. **`hatch()`/`crossHatch()` are still used ~60 times** across `world.ts` (goblin flank and
   jaw, cave mouth, hearth firebox, tavern bays and sheets, montage tones, cliff cracks and
   scorches, miniature fields and water). The no-hatch rule is a real removal programme, not
   a flag flip. The shader also keeps a near-black hatch accent (`curtain.ts:245–253`).
9. **`world.ts` imports 18 symbols from `pencil.ts`** and is the only importer of most of
   them — extraction to `stages/` will fan those imports out across ~10 modules.
10. `story/docs/build/` already contained `ASSETS.md`, `TEXTURES.md` and `walks/` when this
    file was written (parallel P0 work). Nothing there was touched.
