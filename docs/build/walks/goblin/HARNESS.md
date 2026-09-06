# The goblin measurement harness — baseline on the CURRENT figure

2026-09-03. Build step 0 of `docs/2026-09-03-goblin-design.md` §13. Nothing in the rebuild
was touched; this is the ruler, plus what the ruler reads today.

## What exists

| | |
|---|---|
| **CLASS G** | `story/scripts/gob.check.ts` — plain node + three, `--experimental-strip-types`, registered as the 13th script in `package.json`'s `check`. Geometry and source gates G1–G13. |
| **CLASS P** | `story/src/gobMeasure.ts` → `window.__gob(w, h, { ss, curtain, assert })` — DEV-only, installed by `Hero.tsx` beside `__bakePoster`. Framebuffer gates P1–P8. |
| shared | `story/src/film/gobParts.ts` — one projection + partition helper both runners import, so a G number and a P number cannot fork. |
| touched | `hero.ts` (two `.name =` lines on the painted trees), `curtain.ts` (`MASK_LAYER` exported), `Hero.tsx` (one lazy import), `package.json`. |

`npm run build` and `npm run check` both pass. **13/13 check scripts green, 0 regressions.**

### Why `check` stays green with 22 gates failing

The doc is a rebuild brief, so most of its gates describe a figure that does not exist. Every
gate in `gob.check.ts` declares `expect: 'now'` or `expect: 'rebuild'`. Both are measured and
printed with their number every run; only `'now'` gates decide the exit code. Flipping a flag
to `'now'` as its build step lands is the checklist's definition of done for that step.

Today: **9 passing, 22 awaiting the rebuild, 0 regressions.** The `'now'` gates are G11 (the
shadow still crosses the seam) and G13 (he never sits on the island's underside).

### Colour domains — the calibration trap, closed

The CLASS P target is `FloatType` / `NoColorSpace`, so the readback is **linear light at full
float precision** — the film's own mix domain, no 8-bit quantization, no tone mapping (the hero
Canvas is `flat`). From that one read `gobMeasure` derives two numbers per pixel and never
mixes them:

- `*_lin` — Rec.709 luma of the linear values. What the shader did.
- `*_enc` — Rec.709 luma of the sRGB-**encoded** values. The transfer is applied analytically
  to the float, so these are encoded *values* that were never encoded *bytes*.

Every published threshold is written in the encoded domain — the diagnosis's `luma 0.335 / oak
0.353 / pine 0.314`, §14 P2's `60/255`, P3's `R − B ≥ 70`, P8's `ink + 8/255` — so **the pass
lines are evaluated in `_enc`** and both numbers are returned. It is stated per field and in the
module header.

### How regions are isolated — four draws, no colour classification

Deciding "these are his pixels" by colour would be circular; the complaint *is* that his colour
matches the scenery. So the regions come from the scene graph:

- **M** — camera on `MASK_LAYER` with a white override. In the hero scene `markAlive` touches
  the goblin and his pencil and nothing else, so layer 1 is his exact coverage, shells included.
- **F** — the same mask with the contour shells hidden: the fill silhouette. `M − F` along a
  scan row **is** the rim thickness, as geometry.
- **A** — the frame as it ships.
- **B** — the goblin hidden. `B − A` off the mask is the ground darkening he causes: the contact
  region and the crossing cast shadow, isolated from the painting under them.
- **C** — the two painted trees hidden: their exact crown masks, so P1 compares cloth against
  crown pixels rather than a bbox full of paper.

Only small sub-rects are read back.

---

## Baseline — CLASS G (node)

```
viewport     figure w×h      h:w    head+ears  head:hem  ear tips (L/R/rest, screen y)
390×844      48.1×42.6      0.89  100% of w     1.10   442.6/453.0/442.9
500×915      63.0×56.4      0.89  100% of w     1.10   534.3/549.7/535.6
768×917      73.6×66.6      0.91  100% of w     1.10   598.3/618.6/600.9
768×1024     88.5×80.3      0.91  100% of w     1.10   644.8/668.6/647.5
1440×900     96.7×106.4     1.10  100% of w     1.04   389.4/416.3/390.5
1920×917     106.1×112.4    1.06  100% of w     1.06   393.1/421.3/394.1
```

| gate | reads | needs |
|---|---|---|
| G1 aspect (h : w) | 0.89 / 0.89 / 0.91 / 1.10 | ≥ 1.45 |
| G2 ear apex | ears clear the body by **0.2–2.7 px**; the RIGHT tip is **24–30 % of figure height BELOW** the left | apex, right − left ≥ 2 % |
| G3 head : hem | 1.10 (1.04 @1440); head+ears : hem **2.44 → 1.92** | ≤ 0.86 |
| G4 eye proud | near eye **+0.067 rig units**; far eye **never hit** — occluded 0.067 before its own centre | both ≥ 0.03 |
| G5 pencil | 17.9 px @390, 51.7 px @1440; **57–60 % laid over his own mass** | ≥14/≥34 px, ≤ 20 % |
| G6 face plane | **41.7°** @1440 landscape, **35.7°** at every portrait breakpoint | 40–48° everywhere |
| G7 figure height | **42.6 px** @390 (needs 1.22×), 56.4 / 80.3 / 106.4 | ≥ 52 px |
| G8 `EAR_Z_R/L` | absent; 3 hits of the old `EAR_Z` | one home, both import |
| G9 `buildGoblin` | `hatch(` ×2 · `contact(` ×1 · `blobs(` ×2 · `timberDark` ×4 · `paint(…fill:` ×26 | 0 each |
| G10 one REST | `REST` missing, `applyPose` missing, 0/3 readers, **15 inline joint literals in `stageGoblin`** | one table, 0 literals |
| G11 shadow crossing | reach x **1.71** vs band edge 1.20 | > 1.20 ✅ |
| G12 contact pool | absent; no `neverAlive` carve-out; **hide-loop still there** | all three |
| G13 underside clear | 72.5 / 102.8 / 156.9 / 196.2 px of card below him | 0 overlap ✅ |

Shell rim, analytic (`shell × SCALE × 2.6 × rootScale × pxPerUnit`): **19 shell meshes**,
8 distinct weights, **3.50 → 1.40 px @1440** and **1.44 → 0.58 px @390**, ratio 2.50 : 1.

---

## Baseline — CLASS P (live, Chrome, `?hero=1`, ss 2)

Walk: `docs/build/walks/goblin/baseline-hero-1440x804.jpg`,
`baseline-goblin-zoom-1440x804.png`. Tab foregrounded and rAF verified (37 frames / 600 ms,
`visibilityState visible`). **Console: zero errors, zero warnings** (the one log line is the
Beyond20 extension, not the page).

| | 390×844 | 500×915 | 768×1024 | 1440×900 |
|---|---|---|---|---|
| figure bbox (px) | 48.1×42.6 | 63.0×56.4 | 88.5×80.3 | 96.7×106.4 |
| **P1** cloak mean `_enc` | 0.306 | 0.309 | 0.310 | **0.316** |
| …cloak mean `_lin` | 0.082 | 0.084 | 0.084 | 0.088 |
| …oak / pine crown `_enc` | 0.339 / 0.302 | 0.344 / 0.309 | 0.348 / 0.317 | 0.360 / **0.328** |
| …**delta** (need ≥ 0.12) | **−0.004** | **0.000** | **0.007** | **0.012** |
| **P2** torso range `_enc255` | 38 | 38 | 39 | **31–33** |
| …plateaux (need ≥ 3) | 2 | 1 | 1 | **1** |
| **P3** amber px in head | 9 | 20 | 55 | **74–88** |
| …near / far eye | 7 / **0** | 15 / **0** | 36 / **0** | 74 / **0** |
| …warmest R−B in head | 143.4 | 144.8 | 144.6 | 145.0 |
| **P4** rim px (4 samples) | 1 / 1 / 0.5 / 2 | 2 / 1.5 / 1 / 2.5 | 3 / 2 / 3.5 | 3.5 / 2 / 1.5 / **5** |
| …ratio (need ≤ 1.7) | 4.0 | 2.5 | — | **3.33** |
| **P5** contact : boot bbox | 0.60 | 0.49 | 0.37 | **0.29** |
| **P6** shadow vs field `_enc` | −0.012 | 0.026 | 0.066 | **0.028** |
| **P7** amber off the head | 1 | 6 | 22 | **76–99** |
| **P8** cloak lit range (curtain 1) | — | 206/255 | — | 206/255 |
| …darkest cloak px (curtain 1) | — | 0.154 | — | 0.154 (floor 0.165) |

**Every P gate fails at every breakpoint.** P8 was run at `{ curtain: 1 }` for 500×915 and
1440×900: under Prep his cloth range opens to 206/255 (he is the only lit thing), but his
darkest pixel is 0.154 against the 0.165 floor — **he already reads as a hole under Prep**, the
risk §4.5 books as gate P8, present before the palette even goes dark.

---

## What I reproduced, and what I could not

**Reproduced exactly.** The projected figure table is bit-for-bit the diagnosis's §0:
96.7×106.4 @1440, 106.1×112.4 @1920, 73.6×66.6 @768×917, 63.0×56.4 @500, 48.1×42.6 @390 — and
head+ears is **100 % of the silhouette width at every breakpoint**, its central claim. Also
exact: 19 shell meshes; 49,322 triangles against the quoted 49,262 (0.1 %); the far eye buried
0.067 units behind the skull (quoted 0.064); the 43 px phone figure; the shadow reach 1.71.

**Reproduced closely.**
- *Cloak-vs-crown delta 0.02.* I read **0.012** at 1440 and 0.000–0.007 at the smaller sizes.
  Cloak 0.316 vs pine 0.328 / oak 0.360, against the diagnosis's whole-figure 0.335 vs pine
  0.314 / oak 0.353 — every number within 0.015 of its quoted twin, from a float readback of
  the live scene rather than a JPEG walk frame. The finding stands and is if anything worse.
- *Head value range 8/255.* I scan the **torso**, which the diagnosis measured separately at
  "25 distinct values, range 18 levels": I read **31–39/255 with a single plateau** — the same
  smooth Lambert ramp with essentially no committed tier in it. The tighter head number is not
  what this scan samples.
- *Rim 6.12 px → 0.97 px.* Analytically (CLASS G) I get **3.50 → 1.40 px @1440** and
  **1.44 → 0.58 px @390**; measured in pixels (CLASS P) **1.5–5 px @1440, 0.5–2 px @390**. So
  the *shape* of the finding reproduces — a multi-to-one weight variance, sub-1.5 px on the
  phone, blunt at desktop — but my numbers run roughly 40 % lower than the quoted pair. The
  most likely reading is that the diagnosis's 6.12 px measured the visible **ink band** (shell
  plus the coincident authored stroke) rather than the shell offset alone. I measure the shell
  offset, because on this figure a colour-based band measurement is not usable (see below).

**Could NOT reproduce: amber pixels = 0.** The diagnosis reports 0 amber px in his bbox at both
1440×900 and 500×915, with the warmest pixel anywhere in the box at R−B = 64. I measure **74–88
amber px at 1440 and 20 at 500**, all of them on the **near** eye, with the warmest pixel at
**R−B = 145**. The far eye returns 0 at every breakpoint.

The structural half of the diagnosis is confirmed — the far eye is geometrically buried (CLASS G
G4 cannot hit it at all), P3b fails everywhere, the eyes are ~5 px on a phone. What I cannot
confirm is the "0 pixels" quantity, and I would not assume the harness is wrong here: it reads a
float framebuffer of the live scene, while the quoted number came from JPEG walk frames, where
chroma subsampling and compression flatten a warm 5-px feature into its neighbours. **Treat the
P3 baseline as 74–88 / 20, not 0 / 0.** If the walk frames are the intended source of truth for
that gate, someone should say so, because the two disagree by more than the gate's margin.

---

## Three things the harness found that the doc should hear

1. **G6 fails at every portrait breakpoint, and the doc's own remedy makes it worse.** By §14's
   stated formula (`root.y + neck.y + head.y` vs `HERO_AZ`), the shipped stage measures 41.7° at
   1440 — matching §3.4 — but **35.7° at 390 / 500 / 768**, because portrait swings the azimuth
   to 24°. Worse, §3.4's prescribed nudge to `neck.y 0.16 + head.y 0.38` moves the same formula
   to **39.4° landscape / 33.4° portrait**, i.e. *away* from the 40–48° band it claims to reach
   43° in. The gate is implemented exactly as written and prints all three readings (doc
   formula, world normal, actual him→camera ray, which is 51.3° at 1440). Someone owns this
   arithmetic before step 4.

2. **P7 as written cannot pass, because `gobSatchel` is amber by the classifier.** `0xB08D55`
   has R − B = 91, over the `≥ 70` line, and §4.2 keeps the satchel as "the ONE warm patch". I
   measure 76–99 such pixels off the head at 1440, and they are the satchel, not a leak. Either
   P7 needs to exclude the satchel's projected region or its threshold has to move.

3. **The shipped shaded hood measures 0.133 encoded — bit for bit the ink value.** That killed
   the first, colour-based rim measurement, which reported a 40 px "rim" by walking a
   near-ink run straight across his head. It is also the cleanest single statement of failure 1
   in the diagnosis, and it is why P4 is now measured as `mask − mask-without-shells` geometry
   instead of by colour. Worth knowing before `gobCloak` is tuned toward its `0x232830` floor.

---

## Walk protocol notes (they cost me real time)

- The tab must be **foreground**, not merely in a focused window. `SetForegroundWindow` on the
  Chrome process focused the wrong tab; `SendKeys ^9` after it was what actually made
  `visibilityState` go `visible`. Before that, every `Runtime.evaluate` with an `await` timed
  out at 45 s and no frame ticked.
- `javascript_tool` runs in the isolated world and cannot see `window.__gob`. Inject a
  `<script>` element, hand results back through `document.documentElement.dataset`, read the
  dataset. `dataset.domains` comes back as `[BLOCKED: Cookie/query string data]` — a reader
  filter, not a harness fault; read that field from the object, not the dataset.
- **`__gob` is not perfectly repeatable across calls.** `life.skip()` settles the entrance, but
  the head-track cone still follows the last pointer position, so the near eye's amber count
  moved 87 → 74 between two runs of the same breakpoint. Park the pointer off-canvas, or accept
  ±15 % on eye-area counts.
- The phone **stroke tier** (`pencil.ts:34–36`, `SUB 1 / SCALE 0.75`) is decided by
  `window.innerWidth < 700` **at module load**. Calling `__gob(390, 844)` from a 1440-wide
  window measures the desktop tier at phone framing. A true phone-tier P4 number needs the
  window actually narrower than 700 before load.
- HMR re-instantiates the stage singletons; every number above was taken after a hard reload.
