# Inventory — the SKY (read-only audit, 2026-09-06)

Produced for WS. Facts first; the main session's options at the end (a look decision, escalated to Nayan).
Frames: `docs/build/walks/world/ws-inv-sky-t*.png`, `ws-inv-sky-mock-{perf,prep}-z1.png`.

## CENTRAL FACTS

1. **The hero has no sky.** `hero.ts` has no fog, no `scene.background`, no sky object. Its page is a flat CSS paper fill
   (`body.hero::after { background: var(--paper) }` in `hero.css`) behind a transparent canvas. By construction.
2. **The film's "sky" is a fog colour plus a CSS gradient.** `Film.tsx`: `scene.background = null` (canvas transparent),
   `scene.fog = FogExp2(skyDusk, 0.0085)`. `timeline.ts` tweens only `scene.fog.color` via `sky()` / `skyCut()`:
   mount `skyDusk #6D78AE` · ≈t25.78 → `skyDay #ACCDE6` · 31.5 → `skyOvercast #AAB6C0` · 38 cut `skyHearth #D4B184` ·
   47 → `skyVellum #EEE6D2` · 57.5 cut `skyDawn #E6C1A2` · 62.5 → `skyBoard #F7F5F0` (= paper). Behind the canvas,
   `styles.css` paints `body::after` as a 3-stop vertical gradient of `--sky` (set per frame from the fog colour, lerped
   to paper by the curtain) with only 18% / 12% mixes at the ends — invisible in every captured frame; they read as one
   flat fill. The film's hemisphere light `FILM_RIG` is constant (`fillSky 0xCDD9E8`); no light carries the chapter air.
3. **The concept (row 17 + `mock/sky.ts`): the sky is three things — the VOID (bare paper), the AIR (the chapter token,
   "living only in `rigs.hemi.color`"), and the LEAF (the only sky OBJECT: a painted standing sheet, ≤3 per stage,
   `ExtrudeGeometry` from an authored lobed shape, dead-flat bottom, one torn notch, `sheet: true`, poster 6,
   `bakeSkySheet` on a paper base with the chapter hue via `material.color`, back-facing brace/slot line, no cloud
   contours). Verdict column: "NEW, unproven."**
4. **Leaves exist in the film only on S3's ribbon** (`ground.ts` `LEAVES`: near `canopyDeep` x26 · mid `skyDay` x28 · far
   `skyDay` x24, z −13 / −21 / −33). No `onlyFor` window (in the scene all 66 s), STATIC tints (they carry S3's colours
   into S4's frame top-left). Not in `ambush`, `theatre`, `tavern`, `montage`, `cliffWorld`. `world.pathClouds` is `[]`;
   `Film.tsx`'s drift loop walks nothing.
5. **Book vs code:** S3-B3 puts the `skyDay` ramp at t20.6 (the lantern frontier) and says v1's `drain(25.4, 0.25)` is
   DELETED; the code still ramps at ≈25.78 (the ravens beat) and still calls `drain(25.4, …)`. → WT.
6. **Per stage, what the book asks and what exists:** S1 "Air skyDusk", B2 names "cloud/streak flats (atmosphere only)"
   → none built. S2 "Prep is flat paper light" → flat fog fill. S3 → the three leaves (the only stage with any). S4
   "Air skyOvercast … a backstage mountain flat standing in a slot" → old cone peaks (W6c). S5 interior, n/a. S6 "Air
   skyVellum, bright, flat, weightless" → flat fill (book's own intent). S7 "Air skyDawn … painted god-ray cones in
   rayGold" → flat fill, no cones (W3d). S8 "unlit — skyBoard = paper" → correct.
7. **The `?mock=sky` route renders BLANK in Performance** (5 KB white PNG) and correctly in Prep (three leaf banks +
   a spare leaf leaned face-away beside a hero-island diorama). A route defect; the class is "unproven" in paint.

## FRAMES (1440×900, Performance)

t2.0 black (blackout) · t12.5 flat periwinkle edge-to-edge · t19.5 three painted banks at frame top + the theatre's old
snow peak visible far right · t31.0 flat light-blue, old cone mountain on the disc, S3 leaves bleeding in top-left ·
t40.0 interior, no sky · t52.0 flat pale fill · t58.0 flat peach over two-thirds of frame, no cone, no sheet · t62.5
flat peach in the corners of the top-down map.

---

## OPTIONS (main session, 2026-09-06 — escalated; not dispatched)

The brief says "the sky should look like sky" and "like the hero's hand". The hero's sky is paper. Two coherent readings:

**Option A — the concept as written (VOID = paper).** The background returns to PAPER like the hero: the CSS backdrop
becomes paper with the chapter AIR as a visible wash at the top of frame fading to paper by the horizon (a measured
gradient, top stop = the chapter token, bottom = paper), and the chapter colour otherwise lives in the LIGHT (a
per-chapter tint on the film hemisphere's sky colour, tweened where `sky()` tweens today). Leaves (≤3 per stage, per
the book) carry the sky as painted objects: S1 cloud/streak flats in `skyDusk`, S3 as today but retinted per chapter
and windowed, S4 the backstage flat (W6c), S7 god-ray cones (W3d). Result: every exterior reads as a drawing on paper
with painted sky sheets, exactly the hero's page. Risk: the S1 night and S7 dawn lose their full-frame colour; the book's
"Air" reads as a wash, not a fill.

**Option B — the fill, made to look like sky.** Keep the full-frame chapter colour but make it a PAINTED sky: the CSS
backdrop gets a real gradient (measured ≥ 0.06 linear-luminance spread top to bottom) with a paper-grain wash so it is
visibly gouache on paper, not a flat hex; plus the same leaves as A. Result: night stays night, dawn stays dawn, and
the sky has brushwork. Risk: departs from the concept's "void is bare paper" and from the hero's paper page.

**Recommendation: A**, because the accepted hero is the bar and its page is paper; the film's flat fills are the single
biggest reason it does not look like the hero's hand. Either way the leaf work is common: WS-b builds the per-stage
leaves from `mock/sky.ts`'s recipe lifted into a kit (`skyKit.ts`), retinted per chapter, windowed by `onlyFor`, and
fixes the Performance-blank route. WT takes the ramp/drain mismatch. Awaiting Nayan's call on A vs B before WS-a.

---

## RULING (Nayan, 2026-09-06 — LOCKED): OPTION A, PAPER.

The void is paper. The air is a wash at the top of frame fading to paper, plus a per-chapter tint on the film's
hemisphere light. The leaves are the sky objects. No agent re-opens this. WS-a builds it; WS-b (leaves) is common.

## Post-WS-b notes (2026-09-06)
- `skyKit.ts`: `buildLeaf(opts)`, `buildLeafBank(leaves, faceAway?)`, `retintLeaf(group, hex)`; `sky.ts` calls it; 6720 verts /
  48 segs identical before and after. `ground.ts` still calls `foliageKit.buildLeaf` directly with its own `LEAVES` table —
  the second copy; WS-b-wire points it at `buildLeafBank`.
- Retint contract: `material.color = mixHex(tint, paper, wash)` is baked at build; `retintLeaf` sets the colour directly, so
  a per-chapter retint must pass `mixHex(newTint, P.paper, leaf.wash)`, carrying each leaf's wash.
- **The "blank Performance route" was NOT a render bug.** It is a readiness RACE in mock-mode capture: `?mock=<class>`
  loads its module asynchronously and both `MockSheet.tsx`'s readout and `frame.mjs`'s mock poll wait only for 20 rAF
  ticks. 2 of 4 captures raced (hero-only crop), 4 of 4 loaded on retry. Same race reproduces on `?mock=foliage`. Fix
  belongs to `MockSheet.tsx` (expose `dataset.mockReady` when `mocks.children.length === ids.length`) and `frame.mjs`
  mock-mode `pollReady` — a small tooling task (T-MOCKREADY) before any more mock-route frames are trusted.
- Wash-ladder pigments: near 0.5010 t3 (0.041 clear) · mid #B2B69C 0.3245 t2 **0.0245 FLAG** · far #DED8C6 0.1444 t1
  **0.0044 FLAG** · spare 0.2887 t1 **0.0113 FLAG**. Row 17 is "NEW, unproven", so these are derived numbers: WS-b-wire
  re-mixes the wash ladder so every leaf clears 0.03 (measured with `scripts/tritone.mjs mix`), records it in row 17.
