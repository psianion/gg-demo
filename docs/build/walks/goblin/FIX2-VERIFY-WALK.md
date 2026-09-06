# Goblin rebuild — independent verify of the fix round

2026-09-03. Adversarial re-verify of every finding raised in the first GOB verify round,
plus a full re-run of the gate table at five viewports and an end-to-end hero + film walk.
Nothing in the build was changed by this pass; every number below was measured live.

**Verdict: FAIL.** Eight of fifteen findings are genuinely closed, three are partly closed,
four remain open (two of them blockers). Class P fails 11 of 40 readings across the five
gated viewports. `npm run build` exit 0, `npm run check` exit 0, console clean.

---

## Conditions

| | |
|---|---|
| dev server | `http://localhost:5180`, already running, untouched |
| browser | Chrome, DPR 1 (CSS px == device px), window foregrounded before every read |
| rAF proof | `visibilityState visible`, 37 frames / 604 ms at 1440×900; 31 frames / 500 ms at 500×915 |
| routes walked | `/?hero=1` (cover) and `/` (cover → carve → film → reverse) |
| console | one line, `Beyond20: Custom Domain module loaded` — a browser extension, not the page. **Zero page errors, zero page warnings.** |
| magnification | true OPTICAL zoom via `camera.setViewOffset(W,H,…)` on the live lens — the scene is re-rendered into the full canvas from a sub-rect, not an upscale of a screenshot |

`npm run build` → exit 0. `npm run check` → exit 0, `gob.check` footer
`ALL GATES PASSING — 31 gates · 31 passing · 0 awaiting the rebuild · 0 REGRESSIONS`.

---

## CLASS G (node, `scripts/gob.check.ts`) — 31/31 pass, re-run and read

All 13 gate calls now carry `when: 'now'` (`grep -cE "^\s*'rebuild',$"` → 0), so every gate
reaches `assert.equal(hardFails, 0)` at :730 and the footer leads with the failing count
(:720). **GOB-T8 is closed.**

| gate | need | measured |
|---|---|---|
| G1 aspect | ≥ 1.45 | 1.60 / 1.54 / 1.49 / 1.60 @ 390/500/768/1440 — PASS ×4 |
| G2 ear apex | apex, right−left ≥ 2 % | clears by 10.2–24.7 px; 16.5–22.9 % — PASS ×4 |
| G3 head : hem | ≤ 0.86 | 0.84 / 0.83 / 0.83 / 0.80 — PASS ×4 |
| G4 eye proud | ≥ 0.03 rig units | near +0.10, far +0.08 — PASS, real numbers |
| G5 pencil | ≥14 px @390 / ≥34 @1440, ≤20 % over his mass | 32.2 px / 66.3 px, 0 % / 0 % — PASS |
| G6 face plane | 40–48° | 41.0 / 41.8 / 42.9 / 47.5 — PASS ×4 |
| G7 figure height | ≥ 52 CSS px | 58.0 @1.22× / 60.5 / 83.8 / 124.1 — PASS ×4 |
| G8–G13 | — | PASS |
| shell rim, analytic | 2.6–3.6 px, ratio ≤ 1.7 | 3.20 px … 3.20 px, ratio 1.00 : 1 at both breakpoints |

---

## CLASS P (live, `window.__gob(w, h, { ss: 2 })`) — my own run, curtain 0

| | 390×844 | 500×915 | 768×1024 | 1440×900 | 1920×917 |
|---|---|---|---|---|---|
| figure w×h | 36.2×58.0 | 39.4×60.5 | 56.2×83.8 | 77.6×124.1 | 80.8×131.5 |
| **P1** delta (≥0.12) | **0.048 ✗** | **0.046 ✗** | **0.046 ✗** | **0.073 ✗** | **0.081 ✗** |
| **P2** range / levels (≥60 / ≥3) | 105 / **2 ✗** | 116 / 3 ✓ | 131 / 3 ✓ | 132 / 3 ✓ | 129 / 3 ✓ |
| **P3** amber in head | 107/40 ✓ | 120/62 ✓ | 252/116 ✓ | 513/250 ✓ | 571/250 ✓ |
| **P3b** near:far, seated | 1.36 T/T ✓ | 1.60 T/T ✓ | 1.58 T/T ✓ | 1.33 T/T ✓ | 1.34 T/T ✓ |
| **P4** medians [zero rows] | 2.5[2] 3[0] 3[3] 3[0] **✗** | 2.5[1] 3[0] 2.5[2] 3[0] **✗** | 3[2] 3[0] 3[3] 3[0] ✓ | 3[3] 3.5[0] 3[3] 3[0] ✓ | 3[2] 3[0] 3[3] **2.5**[0] **✗** |
| **P5** contact ratio (≥0.9) | 1.173 ✓ | 0.999 ✓ | 0.953 ✓ | 0.981 ✓ | 1.012 ✓ |
| **P6** shadow delta (≥0.25) | **0.085 ✗** | 0.311 ✓ | 0.368 ✓ | 0.289 ✓ | 0.281 ✓ |
| **P7** amber off head (=0) | 0 ✓ | 0 ✓ | 0 ✓ | 0 ✓ | 0 ✓ |
| **P8** (curtain 1) darkest / floor | 0.186 / 0.165 ✓ | 0.187 ✓ | 0.187 ✓ | 0.185 ✓ | 0.184 ✓ |

**11 failing readings of 40.** The fixer reported P4 as "PASS 3 of 5"; it passes **2 of 5** —
1920×917's hem-painted side reads 2.5 px, below the 2.6 floor. Everything else in the
fixer's Class P table reproduces within noise.

### True phone stroke tier (window sized to 500 CSS px BEFORE load, `pencil.ts:34-36`)

`390×844  P1 0.052 F | P2 125/2 F | P3 115/40 P, 3b P | P4 2.5[2],3[0],3[3],3[0] F | P5 1.025 P | P6 0.084 F | P7 0 P`
`500×915  P1 0.051 F | P2 116/3 P | P3 131/62 P, 3b P | P4 2.5[1],3[0],2.5[2],3[0] F | P5 1.033 P | P6 0.325 P | P7 0 P`

Identical to the desktop-tier run to within rounding. **GOB-T16 stays closed.**

---

## What the eye sees

### 1440×900, settled cover — `fix2-cover-settled-1440x900.jpg`

There **is a subject**: he is the darkest, highest-contrast mass on the island and the eye
goes to him. There is **no face** at this size — one warm smudge. He reads as *a small
hooded figure with a pointed ear, bent to the ground, holding a pale stick*. **A creature**:
yes, marginally. **A tool in a hand**: the object reads as a stick, not a pencil, at 1:1.
**Does he belong to the island's world**: partly — see below.

### 6×–26× optical, 1440×900

- `fix2-zoom4.5x-figure-1440x900.jpg`, `fix2-zoom9x-cloak-pencil-1440x900.jpg` — the cloak now
  carries **real committed tiers with hard boundaries** (near-black body, a mid-grey flank
  with a hard edge, a pale edge-wear rim down the right side and around the hem). The smooth
  Lambert ramp of the first round is gone. What it does not carry in the hero rig is any
  authored stroke mark: the cloth is flat colour fields beside an island made of thousands of
  drawn strokes, so he still reads smoother than everything around him.
- `fix2-film-zoom6x-cloak-tiers-1440x900.jpg` — in the FILM rig the same garment shows a fine
  one-direction diagonal stroke field over the tiers. One family, one direction, never
  crossed: **the no-hatching gate holds**.
- `fix2-zoom10x-head-1440x900.jpg`, `fix2-zoom26x-eyes-1440x900.jpg` — the two amber discs
  merge into one peanut low on the front-left of the skull. Each carries a white glint and a
  black crescent riding the disc's lower edge (the pupil, drawn at the rim, reading as a lash).
  No nose, no mouth. The FAR eye's outer portion is drawn over the page, outside his own
  silhouette.
- `fix2-zoom9x-cloak-pencil-1440x900.jpg` — the pencil now **reads as a pencil**: tan barrel,
  two drawn long edges, a segment line, a sharpened cone and a dark graphite point. Its axis
  runs ~40° off the forearm, which is what §7 asks for.

### 500×915, true phone tier — `fix2-hero-500x915-phonetier.jpg`

At 1:1 he is a ~35×50 px dark blob with one yellow speck and a pale diagonal stick. The
wordmark and tagline carry the frame; he does not. `fix2-zoom6x-500x915-phonetier.jpg`
shows the same figure magnified — the pencil resolves beautifully, the face does not.

### 768×924 portrait — `fix2-hero-768x924-portrait.jpg`

No regression from the HERO_AZ_PORTRAIT 24° → 18° move: island 68.9 vw, side gaps 114/125 px,
bottom gap 47 px, **wordmark canvas overlap 0.00 %**, island top y 437 against a brand bottom
of 400. At 500×915: 87.6 vw, gaps 27/35/161 px, brand bottom 362 vs island top 398.

---

## Face census — the decisive measurement

At the shipped 1440×900 framing, hiding one node at a time and counting the pixels of the
composed frame that change (DPR 1, so these are CSS px²):

| part | visible px | | part | visible px |
|---|---|---|---|---|
| head (all) | 3929 | | **nose** | **0** |
| eye disc, near | 122 | | **mouth (smile)** | **0** |
| eye disc, far | 68 | | fang | 5 |
| glint L / R | 7 / 8 | | brow L / R | 2 / 4 |
| pupil L / R | 7 / 9 | | ear R / L | 877 / 76 |
| pencil | 938 | | | |

The nose and the mouth render **zero pixels**. The face is two amber discs plus ~30 px of
everything else. Of the far eye's 68 px, 19 px (27.9 %) land where nothing else of him
covers — the disc pokes past his own silhouette onto the page.

---

## The crossing shadow

`rig.aliveShadow` reads **0.97** live (§8 prescribes 0.62 — unchanged this round).
At 1440×900: shadow area **2 869 CSS px²** at mean **0.227 enc**, against a figure covering
**5 127 CSS px²** whose cloth means **0.236 enc**. The shadow is darker than the figure that
casts it and more than half its area. It now has a readable silhouette (head, body and the
pencil's line are legible in it, `fix2-zoom4.5x-figure-1440x900.jpg`), which is real progress
over the first round's "ink blot", but the value relationship is unchanged.

---

## Hero walk, end to end

| beat | result |
|---|---|
| entrance (replayed on the live timeline) | strokes write on 133 → 0 undrawn by t1.60; birth 0 → 1; **lantern ignites at t1.80 with the seam still at −3.4**, first seam movement at t1.80 → −2.58; goblin lands t2.40–2.60 at the bloom edge; settled at t3.20. Order and pacing intact. |
| settled poster | `fix2-cover-settled-1440x900.jpg` — full frame, 168 stroke meshes, 0 undrawn |
| mouse life | parallax responds (par.yaw 0.837 → −1.601); almost-touch warms to 1.000 over him and decays to 0 off him; blink measured (eye scale.y 1 → 0.569 → 1); wrist idles continuously (−0.21 … −0.39 rad). Head-track verified with dispatched `pointermove`: head.rotation.y **0.2335 ↔ 0.5263** (0.293 rad = the ±14° cone × 0.6 exactly), neck 0.0624 ↔ 0.2575 (× 0.4), pitch −0.063 → −0.171. |
| handoff | cover flips hidden at handoffTime **2.310**, blackout 1, film picks up on black with `Every campaign begins the same way…` |
| film scrub | full pass walked with real wheel ticks through every beat to the endcard + CTA. `world.goblin.root.userData.rimSolved` moves with the lens (0.0148 → 0.0207 → 0.030): **the film solves his rim now**, and the C1 close-up renders with a readable ink contour (`fix2-film-c1-goblin-1440x900.jpg`) |
| reverse | scrolled back through the film with captions returning in order; settles to the exact painted cover (`fix2-reverse-restored-cover-1440x900.jpg`). A **Home-key jump** (not a scroll) showed a one-off flat-blue frame mid-return before the cover faded in — `fix2-reverse-home-jump-blue-frame-1440x900.jpg` — transient, resolved in ~4 s. |
| reduced motion | `__prmForce(true)` + cold load → honest still, no spinner: prm true, birth 1, seam 1, glow 1.15, goblin visible, 168 strokes, 0 undrawn (`fix2-prm-still-1440x900.jpg`) |

---

## Harness honesty — three things the fix round's own claims do not match

1. **"zeros kept in the ratio"** (`gobMeasure.ts:666-670`). The code at :641-648 pushes a zero
   row into `zero++`, not into `vals`; `px` is the median of `vals` and `rimVals` is built from
   the four medians. A zero row still cannot move the printed ratio. What DID land is that
   `zero_rows` is printed beside it — and it is not zero: **2–3 of 15 rows on the SEAM side of
   both the head and the hem, at every breakpoint**, are rows where a shell is present and
   draws nothing. The fixer's summary line ("zero zero-rows on the painted side") is true and
   omits the side that fails.
2. **P2's range term no longer reads the scan.** `scanRange` (:513) is
   `(cloak.max − cloak.min) × 255` over P1's whole cloth sample — the same expression P8 uses
   at :871. Two gates now print the same number, and a min/max over ~1 600 px is a far weaker
   test than the range of 26 samples. The reported 48 → 130 improvement is part real edge-wear
   and part a change of estimator.
3. **P2's plateau count is the MAX of two scans** (:507). At 1440 the `across` cut reads
   `…,34,93,63,48,48,48,47×9,48×5,63,63,78,93,136,34` — 20 of 26 samples on one value, and the
   three "committed levels" are the body plus two two-sample levels that sit on the drybrush
   rims. The `down` cut scores **1** level (`47,47,…,48,48,48`), i.e. the §5 shingle step is
   still not a value step down the body.

---

## Findings ledger status after this pass

- **Closed**: T5 (G6 41.0–47.5° in band ×4), T6 (P5 0.913–1.007 ×5 — the pool really is
  3.5× deeper; the proportional window pad is a defensible scale-invariance fix and is not
  what bought the pass), T8, T9 first clause, T10, T11, T13, T15, T16.
- **Partly closed**: T1 (tiers + edge wear landed and read; authored stroke marks still do
  not reach the cloth in the hero rig), T3 (medians landed, seam-side holes remain),
  T12 (the shadow has a silhouette now; its value did not move), T14 (the tip landed; the
  grip complaint is contradicted by measurement and I accept the fixer's rebuttal).
- **Open**: **T2 (blocker — no nose, no mouth, eyes merge and the far one leaves the
  silhouette)**, **T3 (blocker — P4 fails 3 of 5, 2–3 zero rows per seam side everywhere)**,
  **T4 (blocker — still not a subject at phone width)**, T7 (unreachable by the doc's own
  arithmetic; needs a decision, not a knob), T12.

Full detail in `docs/build/FINDINGS.md`.
