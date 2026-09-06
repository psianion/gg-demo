# P5b independent verify — 2026-09-03, dev :5180, Chrome 1906×732 (captures 1568×602)

Tab visible + focused, rAF measured before any judgement. Every fingerprint below was
read off the live scene through `window.__hero` (rig uniforms, stroke instanceCounts,
goblin/flame visibility) — never off the fixer's numbers.

**Settled fingerprint (the control every path must land):** seam 1, birth 1, shadow
0.45, glow 1, gob true, glass `f7edcd`, flame true, brand 1, wordmark `inset(0px 0% 0px
0px)`, tagline `inset(0px 0% 0px 0px)`, meta 1, hint 1, strokes 187 full / 0 zero / 0
partial / 6 authored-empty, entrance prog 1 at t 3.2.

## A — skip under an ARMED readiness gate (`?stallfonts=1`, `gg.seen` cleared)

Detect-armed → keydown → sample, atomically in one page script (the armed window is only
~3.8 s wide before the cap closes it, so the input is a synthetic `KeyboardEvent` on
`window` — the same listener the real key hits).

- armed at 1163 ms: `{t:1.65, prog:0.516, paused:true, ts:0.18, seam:−3.4, glow:0,
  gob:false, flame:false, glass:f7f5f0, brand:0, wm/tag inset 100%}`
- keydown +250 ms: **full settled fingerprint**, `ent {t:3.2, prog:1}`
- +900 ms later: byte-identical fingerprint — no re-park, no rewind
- `p5b-verify-a-skip-under-armed-gate-settled-1568x602.jpg` — brand, tagline, meta,
  play, scroll hint, lit lantern, goblin, both halves. Same frame as the natural
  settle (E-return) and as the PRM settle (C).

## B — same stalled load, hands off

Sampled every ~150 ms from injection (landed mid-stall, already parked at 1.65):

- parked at t 1.65 / seam −3.4 / glow 0 for ~3.5 s of the sampled window
- margin note pencils on during the true stall: opacity 0 → 0.16 → 0.71 → 0.98 → 1,
  text `sharpening pencils…`; **no spinner anywhere**
- cap restores at ~3.6–3.75 s: t 1.65 → 1.767 **playing**, note fades 0.17 → 0
- beats run at authored pace after the restore (t/glow/seam):
  1.767/0.70/−3.13 · 1.917/0.99/−1.18 · 2.067/1.00/0.03 · 2.383/1.00/0.96
- done at 5.30 s of the sampled window, t 3.2, note 0, full settled fingerprint
- `p5b-verify-b-stall-parked-note-on-1568x602.jpg` (parked, note on, fully-drawn
  graphite island, unlit lantern) and
  `p5b-verify-b-cap-restore-ignite-before-bloom-1568x602.jpg` (the restore caught at
  t 1.989 — lantern already lit and pooling, paint only just leaving the lantern edge)
- nothing waits indefinitely on any path.

## C — PRM cold load (persisted `__prmForce` in place before mount, hard load)

- `{prm:true, prmFade:true}` — the cold PRM branch ran (cover carries `hero-prm-fade`)
- **both halves present**: birth 1, 187 strokes full, 0 at instanceCount 0 — the
  reverify blocker measured birth 0 with 158 undrawn
- handoff down (real wheel, 10 ticks): `{y:1000, ht:2.31, coverVis:hidden,
  blackout:1, seam:−3.4, glow:0, filmT:4.41}` — stepped crossfade to black holds
- Home back: `{y:0, ht:0, coverVis:visible}` + settled fingerprint (brand/meta/hint
  0.9999, last frame of the reverse fade)
- `p5b-verify-c-prm-coldload-both-halves-1568x602.jpg`

## D — reload below the fold, then Home (ledger P5-T6)

- cold load, wheel to y=700, `location.reload()`; browser restores y=700:
  `{ht:2.31, done:true, entProg:1, entT:3.2, seam:−3.4, birth:1, coverVis:hidden,
  blackout:1}` — the seeded skip **completed**; no gate abort, no parked-at-1.65
- Home: `{y:0, ht:0, blackout:0, coverVis:visible}` + settled fingerprint
  (meta/hint 0.9998, tagline inset 0.019% — last frame of the reverse fade)
- `p5b-verify-d-reload-below-fold-home-settled-1568x602.jpg` — painted cover, brand,
  tagline, meta, play, scroll hint, and the returner note `been here? skip to the table ↓`
- P5-T6 does not reproduce. Its suspected second half (stale handoff starts on a
  seeded path) did not appear either.

## E — regression, non-PRM

**Cold entrance, ignite before bloom** (93 rAF frames): first glow > 0 at t 1.666 with
seam still −3.4; flame visible 1.693; **first seam movement 1.758, by which time glow is
already 0.669**. Goblin lands at t 2.478 on the bloom edge. Settles 3.2. Light leads.

**Hard flick down** (240 rAF frames): cover survives the whole drain and the start of
Phase B — [106 ms, y 343, ht 0.376, visible, blackout 0, seam 0.88] · [188 ms, y 594,
ht 1.486, visible, blackout 0.103, seam −3.36]. First hidden frame exactly
`[254 ms, y 728, ht 2.310, hidden, blackout 1.000]`. Film cold open renders
(`Every campaign begins the same way…`, then the night forest at t 4.41).
`p5b-verify-e-handoff-forward-film-open1-1568x602.jpg`

**Flick back up** (239 frames): cover returns at `ht 2.052` under `blackout 1.000`
(black under black — no pop); seam returns at ht 1.451; **lantern relights first** —
glow 0.21 at seam −2.18, 0.94 at −0.93, flame back at ht 0.775 / seam −0.64, i.e. before
the frontier reaches the island's painted mass. Lands y=0 on the exact settled
fingerprint. `p5b-verify-e-reverse-wordmark-rewriting-1568x602.jpg` catches the wordmark
mid-re-write (`G / GO`); `p5b-verify-e-return-settled-1568x602.jpg` is the landing.

**Slow two-tick scrub with a mid-drain stop:** held at `ht 1.061` — seam −1.737, shadow
0 (lifted), pencil hidden (tucked), wordmark inset 100% (un-written), ember 1, glow
0.472, cover visible, blackout 0. Held stable across two captures 1.6 s apart, no drift,
no pop. `p5b-verify-e-middrain-hold-ht1.06-1568x602.jpg` — he is caught, head to camera.
Scrubbing back from that stop restores the exact settled cover (pencil visible, ember 0).

**Film spots:** t 22.12 renders the lamppost beat with `Someone has to light the world.`;
t 66.00 renders the endcard (wordmark, tagline, `Build the maps. Run the table. The
goblin does the rest.`, JOIN THE DISCORD, replay). `p5b-verify-film-t22-1568x602.jpg`,
`p5b-verify-film-t66-endcard-1568x602.jpg`.

**Console:** zero errors and zero warnings across the walked session — the only line is
the browser extension's own `Beyond20: Custom Domain module loaded: localhost`.

## Checks, build, poster

- `npm run check` 12/12 green (framing, pencil, die, puppet, curtain, island, motion,
  clocks, gearing, rigs, hero, hero-life). `npm run build` green, exit 0, only the
  pre-existing >500 kB chunk warning.
- `hero-life.check` prints 4 gsap `Invalid property … Missing plugin?` lines — DOM-shim
  noise on plain objects under node, not app output.
- `public/hero-poster.png` mtime 03:34, before the fix round (heroLife.ts 05:31): NOT
  rebaked — consistent, because the settled fingerprint this round lands is identical to
  the P5 control. Tagline-tail overlap stays the parked review item (P5-T3).

## Negative test of the new behavior harness

The harness was copied with the whole `src` tree into a throwaway `_negtmp/`, mutated
there and run; the shipped files were never touched (`heroLife.ts` sha256 identical
before and after, sandbox deleted).

| mutation | check result |
|---|---|
| control (shipped code) | **ok** |
| N1 gate latch removed (`!gated` / `gated = true` dropped) | **FAILS** — “fonts pending forever: the cap must complete the entrance inside ~7020 ms” (scenario b) |
| N2 PRM jump back to `progress(1, true)` | **FAILS** — “PRM cold load: the page is fully drawn (birth 1) — 0 !== 1” |
| N3 `skip()` reordered to jump-then-`finishEntrance()` | **FAILS** — “skip with fonts ready: seam parked at the work edge — −3.4 !== 1” (scenario d) |
| N4 `skip()` jump back to `progress(1, true)` | **FAILS** — “skip with fonts ready: the page is fully drawn (birth 1) — 0 !== 1” |
| N5 `restored` single-run latch removed | **passes** — coverage gap (see P5b-T1) |
| N6 `tl.pause(gateT)` reverted to bare `tl.pause()` | **passes** — coverage gap (see P5b-T2) |

The four regressions this round fixed are all really pinned, behaviorally, against the
real module. Two guards are not: N5 and N6 below.
