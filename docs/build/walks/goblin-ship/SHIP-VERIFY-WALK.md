# Ship verify walk — the rebuilt goblin, live

2026-09-04 · adversarial verification round. Everything below was measured in Chrome against the
running dev server at `http://localhost:5180`. Nothing here is quoted from a builder report.

## 0. Measurement conditions, stated once

The display is 1920×1080 at 125 % OS scaling, so the browser's CSS viewport tops out at
**1536 × 864** and Chrome's own chrome takes ~150 CSS px of the height. **A 1440×900 or a
500×915 viewport is not reachable on this machine.** Every number below is therefore tagged with
the viewport it was taken at:

| label | viewport used | target in the brief |
|---|---|---|
| wide | **1426 × 732** (canvas 1416 × 732 CSS, buffer 1770 × 915 @ dpr 1.25) | 1440 × 900 |
| film | **1442 × 732** | 1440 × 900 |
| small | **502 × 732** | 500 × 915 |

Tab foreground was forced from PowerShell (EnumWindows → `SetWindowPos` HWND_TOPMOST →
`SetForegroundWindow`) and re-asserted before every measured run; `document.visibilityState ===
'visible'` and a counted rAF loop (**121 frames / 2018 ms = 59.96 fps**) were confirmed before any
judgement was made. Pixel readings are `gl.readPixels` taken inside a double-rAF so they land on the
frame the app itself just drew. Luma is sRGB-encoded `0.2126R + 0.7152G + 0.0722B` on the stored
bytes — the same convention `docs/2026-09-03-goblin-reference.md` uses.

**Environment caveat, on the record:** some other automation was driving this Chrome profile
throughout the session — my tab was repeatedly navigated to `?mock=<class>` routes and up to four
extra WebGL tabs were spawned. Measurements were retaken in fresh tabs; where a run was lost to a
hijack it was rerun, not reported. No `window.open`, `pushState` or `replaceState` exists anywhere
in `src/`, so this is not the site.

---

## 1. Is he in the site?

**Yes, on the default route, with no query string.**

`http://localhost:5180/` cold → the entrance runs in order: whole-page underdrawing with the
lantern lit and **no goblin in it** (correct; `collectStrokes` excludes his subtree) → the paint
bloom sweeps from the lantern side and he arrives WITH the bloom edge, already painted → type wipes
in → settled. Evidence `ship-hero-settled-1426x732.jpg`.

The old figure is gone from source, not merely unreferenced:

* `src/film/stages/gobStudyA.ts` — **deleted** (`ls` returns no such file).
* `src/film/world.ts` — **4211 lines**, and a grep for the old builder's private vocabulary
  (`gobShellMaterial|gobMat|gobLine|inkShell|GOB_RIM_DEFAULT|solveGoblinRimForLens`) returns
  **0 hits**.
* `buildWorld(goblin: Goblin)` now takes the figure; both call sites
  (`src/film/Film.tsx:24`, `scripts/puppet.check.ts:19`) pass `buildGoblin()` from
  `src/film/stages/goblin.ts:2142`.
* `src/film/stages/hero.ts:11` imports `buildGoblin` from `./goblin.ts`.

Still open from the previous round, confirmed unchanged: `GobStudy.tsx:70` falls back to `OLD`
for any unrecognised study key, and `:366` shows `hero.goblin` for `OLD` — so **`?gobstudy=OLD`
now shows the NEW figure**.

## 2. The cover, end to end

| step | result |
|---|---|
| cold entrance order | underdrawing → bloom → he lands with the bloom → type. He is never drawn in graphite. |
| settled pose | REST exactly: root (0.950, 0, 0.308) ry 1.600, pelvis y 0.188, chest (0.340, 0.072), neck (0.160, 0.160), head (−0.060, 0.380), ears (0.850, −0.550), hem −0.100, hood 0, pupils 0, pencil visible |
| figure size | **75.8 × 103.3 CSS px** at 1426×732 (gob.check's analytic solve prints 110.4 px @1440×900 — different framing, both above G7's 52 px floor) |
| head-track | neck.y **0.097 → 0.258**, head.y **0.285 → 0.527** chasing a swept pointer |
| blink | eyeL.scale.y and eyeR.scale.y both bottom at **0.120** and return to 1.000 |
| ear perk | earL **0.850 → 0.550**, earR **−0.550 → −0.250** — both blades lift, once per session |
| idle scritch | armR.wrist.x **−0.307 → −0.207**, armR.pose.z **−0.302 → −0.272** after cursor stillness |
| first-scroll handoff | at scrollY 300: neck (0.160, **−0.190**), head (−0.380, **−0.370**), pencil `visible=false`, island fully drained to graphite — **and he is still painted** |
| handoff reverse | scrolled back to 0: pose byte-identical to REST, pencil visible, paint restored |
| reduced motion | `__prmForce(true)` then 3 s of pointer sweeping over the island: **all 20 sampled channels byte-identical**. An honest still, no spinner |
| poster bake | `window.__posterDataUrl` after `__bakePoster()`: **1200 × 630, 414 KB, luma 24–246, mean 216, 4365 amber px (r−b ≥ 100)** — the eyes print |

Note on the bake: `posterBake.ts:205-212` returns `Promise<void>` and **triggers a download** of
`hero-poster.png`; the measurable artefact is the `window.__posterDataUrl` stash at :205. A builder
claim that "`__bakePoster()` returned a PNG" is not literally what the function does.

Small breakpoint, **502 × 732**: figure **40.4 × 54.6 CSS px**, 60.5 fps, 324 draw calls, 11 GPU
textures, 268 geometries, 21 trilayer materials with 20 alive. Evidence
`ship-hero-small-502x732.jpg`. At that size the individual marks are sub-pixel; the brushwork
survives only as tone break-up, which is the safe failure.

## 3. The film — eight stages, forward and back

Driven through the real scroll (the timeline is scroll-tied; `tl.duration() = 66`).

**Painted everywhere.** At every one of 19 forward sample times (t = 2, 5.6, 9.5, 13.6, 17.6, 20.4,
24, 28, 32.6, 35.2, 38.5, 43.2, 48, 50.8, 55.3, 58.4→59.2, 62.3, 63, 65) and at **90 further scroll
samples in both directions**, he carried **19 trilayer materials, 18 at `alive = 1`**, the single
exception being a `CircleGeometry` whose own object declares `userData.neverAlive = true` — the
contact pool, by design. That held inside both freezes (t 13.65: `timeScale 0`, `curtain 1`) and
while he is hidden at the tavern (t 38.5 / 43.2 / 48: `root.visible = false`).

Live evidence: `ship-film-t17-c2-lantern-painted-in-graphite-1442x732.jpg` — the whole world in
graphite, him in full colour carrying a lit lantern; and
`ship-film-t13.65-freeze-closeup-caption-over-hood-1442x732.jpg` — the film's only close-up, fully
painted against a fully drained world.

**Scrub safety.** 19 scroll positions spanning t 0 → 66, visited ascending and then descending,
with the scrub allowed to settle to a stationary `tl.time()` at each stop (naïve 7-frame settling
gives a false ~2 s lag in the reading direction and must not be used). 26 pose channels compared at
identical scroll positions:

* **18 of 19 points bit-identical forward vs backward.**
* One exception: scrollY 9600 (t 52.95, C5 montage), `armL.pose.rotation.x` differs by
  **0.022 rad** (1.3°) — GSAP relative-tween bookkeeping, one channel, one instant, off camera.

No pose explosion, no missing limb, no part left behind at a page turn, at any sample.

Stage spot-checks that landed on their authored values: t 5.6 flinch (chest 0.370, neck −0.220,
head −0.330, legR crouch −0.345/0.690/−0.345); t 9.5 leap (pos 125.470, 3.855, −0.497, ears
1.650/−1.350); t 13.65 freeze (neck.y −0.729, head.y −0.891, `timeScale 0`, `curtain 1`);
t 17.6 handoff-in (pos 4.801, speed 1, REST plus gait); t 28 mushroom stoop (chest 0.552, ry 1.952,
`curtain 0.25`); t 32.6 rope haul (armR.pose.x −2.727); t 38.5–48 tavern (hidden); t 50.8 montage
(pos −1.053, 0.2, −40.110); t 63 throw released (armR −2.05, ears 0.716/−0.416).

## 4. The brushwork — the client's actual ask

### 4a. It is real. A/B proves it.

`brushFor`'s output was removed live by nulling `map` + `emissiveMap` on his 15 mapped materials and
measuring the identical region on the identical frame, then restoring (restored reading returns to
the "with" numbers, so nothing drifted). Mid-tone cloth pixels only, over his whole projected box at
1426×732:

| | with brush | maps stripped | restored |
|---|---|---|---|
| mean identical-luma run | **1.65** | 2.07 | 1.64 |
| single most common value | 82 @ **13.6 %** | 108 @ **24.2 %** | 82 @ 14.2 % |
| distinct values | 140 | 140 | 140 |

The brushwork **halves** the share of his most-common value and shortens the mean run by 20 %. It is
doing work, and it is not a ramp: the plateaux are the same before and after (72 / 82 / 95-96 /
108-109 present in both) — the marks move surface between committed tiers rather than inventing new
values, which is exactly what was claimed.

### 4b. Beside the island's grass, same frame, equal patches

18 × 22 CSS px patches (23 × 28 device), one frame, wide breakpoint:

| patch | mean rgb | distinct | longest run | mean run | top value | values > 2 % |
|---|---|---|---|---|---|---|
| his back cloth | (80, 82, 63) | 64 | 6 | **1.44** | 96 @ **20.2 %** | 10 |
| his hood | (96, 96, 60) | 60 | 8 | **1.59** | 82 @ **24.9 %** | 8 |
| island grass | (129, 142, 79) | 58 | 5 | **1.53** | 137 @ **5.7 %** | 18 |

**On run structure he now lands on top of the grass** (1.44 / 1.59 against 1.53; longest run 6 / 8
against 5). **On value concentration he does not**: his top value holds 20–25 % of a patch where the
grass's holds 5.7 %, and he offers 8–10 values above 2 % where the grass offers 18. That gap is the
quantizer — he is committed to ~20 plateaux and the grass is not quantized at all — and it is
structural, not a defect.

### 4c. At 6×, is it the same hand?

`ship-6x-cloth-beside-island-grass-1426x732.jpg` (CSS magnifier over the shipped hero frame, his
cloth left, the island's grass right, one frame). Honest answer: **the same construction, a
different pressure.** Direction, density and sparse-over-a-worked-ground are shared. Edge quality is
not: the grass's dabs have hard ends and high local contrast; his read as broad, soft, low-contrast
drags. He no longer looks smooth beside the island, but he is still the quieter surface in the
frame, and the face is the quietest thing on him — `ship-prep-rig-face-crop-538x375.png` shows the
cheek carrying almost no mark at all.

At plate scale the marks are unmistakable and well-formed: `ship-gobstudy-back-zoom2-1426x732.jpg`
(figure 347.6 × 534.2 CSS) shows strokes running down the dome, down the skirt, and around the belt,
with the drawn hood creases and hem line on top.

## 5. Hard gate — crossing strokes

**No crossing strokes found.** Checked at 6×, 8× and 16× on the hero cover; at 1× and 2× zoom on
`?gobstudy=A&view=front|back|sheet`, both rigs; and at 5× and 8× on the film's close-up.

The check that mattered was the film close-up, where two mark systems appear to overlap. A live A/B
settles it: `ship-film-5x-belt-WITH-brush-1442x732.jpg` versus
`ship-film-5x-belt-NO-brush-1442x732.jpg`, same frame, maps stripped and restored. The broad wavy
bands **remain** when the maps are gone — they are lighting × poster tiers, not strokes. The fine
directional strokes **disappear** with the maps — they are the one brush family. At 8× the point is
plain: `ship-film-8x-cowl-one-family-1442x732.jpg` shows a single evenly-spaced family across the
whole lappet, and `ship-film-8x-crown-one-family-1442x732.jpg` shows the hood band and the lit
forehead as adjacent regions with one direction each.

One observation, not a gate failure: on the front cowl and lappets the family runs ~35° off
horizontal on screen, not down the hang. It is one family and it follows the loft's own v; it is
just not the vertical the reference's own fold strokes draw there. On the back it is vertical.

## 6. He stays painted

Verified on screen in both rigs and inside a film freeze.

* **Performance rig, hero:** 21 trilayer materials, 20 at `alive = 1`; the one exception is the
  `neverAlive` contact pool (`CircleGeometry`, `userData.neverAlive = true` on the object itself).
* **Prep rig, study route:** `?gobstudy=A&view=front&rig=prep&zoom=2` renders him in full colour —
  olive cloth, green skin, lemon eyes, brown belt, cream wraps, ink contour.
  `ship-prep-rig-front-stays-painted-1426x732.jpg`.
* **Film freezes:** t 13.65 (`timeScale 0`, `curtain 1`) and t 20.4 / 24 / 43.2 — 18/19 alive at
  every one. He is the only painted thing in a graphite world, which is the point.

No state in either rig switches him to the underdrawing.

## 7. Is he still him?

Measured from the rendered pixels of the study route's front plate the way the reference measured
the client's PNGs: alpha mask, ground ellipse cut at the lowest row holding a dark pixel, 425 × 550
device grab, figure **386 × 519 device px**.

| measure | measured here | reference | verdict |
|---|---|---|---|
| front-plate aspect (H : W, ears in) | **1.345 : 1** | client plates 1.32–1.38; G1 band 1.25–1.45 | PASS, dead centre |
| ear span = the figure's full width | tips at x 15 and x 400, the two extremes | must equal full width | PASS |
| crown is the apex | topmost pixel is the hood, in the middle 40 % band | crown highest | PASS |
| ear tips below the crown | 0.191 H / 0.183 H | 0.17–0.24 H | PASS |
| ear tips level | **0.008 H apart** (topmost-of-blade). By the extreme-x reading instead: 0.200 / 0.224 = **0.024 H** | ≤ 0.02 H | PASS on the blade read, marginal on the extreme-x read; gob.check's own part-based read on an un-posed build prints 0.00 |
| head : widest body | **1.606** | ≥ 1.30; client plates 1.45 | PASS, 11 % headier than the plates |
| eye centre height | **0.257 H** | 0.272 H | PASS |
| eye height / head unit | **0.409** | 0.40 | PASS |
| eye pair span / head width | **0.526** | 0.61 | NARROW |
| gap between eyes | **0.47 eye-widths** | 0.42 | PASS |
| back-plate aspect | **1.501** | 1.53–1.59 | 2 % WIDE |

Palette, sampled as region modes from the framebuffer on the settled cover (device px):

| family | measured modes (L, 0–255) | reference |
|---|---|---|
| cloth, hood crown | **82 (49 %), 96 (45 %)** | cloak base `#4F5442` = **82** — lands |
| cloth, back / skirt | **83, 96/97**, folds at 55 / 64 / 69 | mid `#3E4134` = 63 lands; deep 36 / 48 not reached |
| cloth total span | 55 → 108 = **53/255 over ≥ 4 plateaux** | §7.6 P2 wants ≥ 50/255 and ≥ 4 plateaux — passes |
| skin, lit | **173** | `#ABB772` = 175 — lands |
| eye bright field | **233** (67.6 % of eye pixels) | `#FEF15C` = **233** — exact |
| contour | **26** (76 %), then 34 (10 %) | `#1A1B10` = **26** — lands (34 is the site's `#222222` ink) |

Hue is right throughout — g > r > b on every cloth sample, olive-grey not slate. The one honest
drift: his cloth carries a **108 (L 0.424)** tier the reference has no cloth value for, and his top
cloth tier sits ~6/255 above the reference's lightest cloak tier. Both are present with the brush
maps stripped, so this is the accepted sculpt's tier placement, not a brushwork regression.

Costume roll-call against §4, all present: hood dome with crease strokes, two ear blades with 2–3
pale ticks each, two-tone almond eyes with a shade crescent and a pupil, nose, mouth, brows, throat
tab, plain tunic, belt with a pouch on his right hip (clearest from behind, as drawn), linen
forearm and shin wraps, bare green hands, dark boots, contact pool.

## 8. Regressions, checks, console, cost

* `npm run build` — **green**, `built in 1.05s`, exit 0.
* `npm run check` — **exit 0**, all 13 scripts, `gob.check: ALL GATES PASSING — 22 gates · 22
  passing · 0 awaiting the rebuild · 0 REGRESSIONS`.
* Console — **one** message across the whole walk, a browser extension's own load line
  (`Beyond20: Custom Domain module loaded`). Zero page errors on the cover, the study route, both
  rigs and the film.
* Cost, wide breakpoint: **59.96 fps** (121 frames / 2018 ms), **324 draw calls**, **11 GPU
  textures**, **268 geometries**. Small breakpoint 502 × 732: **60.5 fps**, 324 calls, 64,496 scene
  triangles.
* His own cost: **14 solid meshes (7 skinned) + 29 fat-line objects, 31,452 solid triangles**,
  29 materials, 18 with `map` and 18 with `emissiveMap`.

Two things the green suite does **not** cover, stated so the number is not over-read:

1. **`gob.check` runs CLASS G only.** A grep of the run log for `CLASS P`, `P10` or `P4 ` returns
   **0**. P2 (torso scan), P3/P7 (amber classifier), P4 (rim px) and **P10 (6× zoom, no crossing
   strokes)** have no script behind them at all — they are live-walk gates, and "22/22" says nothing
   about the brushwork, the palette, the rim or hatching.
2. **G8 still asserts the contract the reference struck.** `scripts/gob.check.ts:557` reads
   `// G8 — the ear base angle lives in ONE module, unequal per side (§9)` and asserts
   `EAR_Z_R / EAR_Z_L exported once … unequal per side`. Reference §7.6 rules G8 **"STRUCK AND
   INVERTED — assert one symmetric ear constant; assert the two-constant form is gone."**
   `world.ts:864-865` still holds `EAR_Z_R = 0.55` and `EAR_Z_L = 0.85`. G1, G2 and G3 were
   re-pointed to §7.6's replacement text in this round; G8 was not.

## 9. The one visible regression

`ship-film-t13.65-freeze-closeup-caption-over-hood-1442x732.jpg`. At t 13.65, the film's only
close-up, the caption "You thought I ran away." prints in ink at y ≈ 172 **straight across his
hood**, dark grey on dark olive, barely legible. Measured: crown at y ≈ 108, eyes at y ≈ 290 (40 %
down the frame, not the upper third), face ≈ 45 % of frame height. His head plus cowl is a far
larger share of his height than the old skull's was, so the authored caption seat and this push-in
are no longer compatible. Reproduced live, both scroll directions.

## 10. Files

Evidence written to `docs/build/walks/goblin-ship/ship-*.jpg|png` (13 shots). Ledger rows appended
to `docs/build/FINDINGS.md`.
