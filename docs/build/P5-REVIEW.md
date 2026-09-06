# ★ P5 review — the Half-Alive Island hero, ready to walk

2026-09-03. Stages P0–P5 of the v2 rebuild are built and verified. The hero is the film's
front door: entrance → idle life → first-scroll handoff → the untouched v1 film. Dev
server: http://localhost:5180 (PID 17556, running). 12/12 check scripts green, build
green, zero console errors on every walked path. Storage is clean — your first load is a
true cold one.

## What P0–P5 delivered

- **P0** — v1 archived byte-identical at `story/story-v1`; RECON.md (827 lines, the
  world.ts extraction map); baseline walk + console record.
- **P1** — v2 palette (v1 aliases kept), motion token scale, the two clocks hardened,
  RUNTIME pinned to a true 66, the gearing map wired as the scroll drive, dpr cap /
  visibility pause / idle throttle, dev HUD (`?hud=1`).
- **P2** — island diorama kit + the painted trilayer (one curtain uniform), tick/drain
  recipes, `?sandbox=island` with a calibrated ≤4% grid-ink assertion, render-pipeline
  parity (film applies NO tone mapping — everything is judged under that transfer).
- **P3** — the two rigs: lantern-warm Performance with token-driven flicker (PRM = still),
  flat Prep where *the only shadow belongs to the alive*; seam blending per fragment.
- **P4** (5 rounds) — the poster: authored island (stepped strata, roots, drawn rim that
  stops being drawn), canvas-baked gouache surfaces, **authored pencil-stroke graphite**
  (hand-drawn stroke tiles, one direction per prop — the machine-ruling look is gone),
  goblin staged at the seam with his committed crossing shadow, drawn wordmark lockup,
  type on paper at ≥4.5:1 everywhere, height-aware comp solver across breakpoints.
- **P5** (2 rounds) — the entrance (loading IS the drawing, lantern ignites before paint,
  goblin rides the bloom edge, skippable, returners 0.6×), mouse life (parallax,
  head-track, scritch, once-per-session ear perk, almost-touch), the scrub-reversible
  3.5% first-scroll handoff into the film, 1200×630 poster bake, PRM paths.

## Walk order (from the final verify pass)

1. **Cold front door**, hands off (`http://localhost:5180/`): grid ghost → island draws
   itself → lantern lights BEFORE any colour → paint blooms from the lantern side →
   goblin lands on the bloom edge → type writes on. Judge pacing, and judge the lantern
   head as it lights (parked P4d-T5: the flame barely survives the post in front of it).
2. **Settled poster comp.** Judge P5-T3: the tagline tail vs the island's far-left rim in
   `public/hero-poster.png` (re-bake via `window.__bakePoster()` only if the comp changes).
3. **Hover and hold** over the graphite half — he notices you. Judge P4-T6: does the
   lifted head show a real amber-eye glint at your framing? Then hold still 4s — he goes
   back to work (scritch).
4. **Zoom the figure at rest.** Judge P4d-T6: the pencil is 53×17px — at framing "caught
   making it" is carried by the gesture, not the object. Accept or fund.
5. **Resize to ~500 wide.** Same item at phone width: the figure is ~36px, the premise is
   carried by wordmark+tagline there. Also P4e-T4: the scroll hint sits on the trailing root.
6. **Stalled load** (`?stallfonts=1`, DEV hook): the drawing parks, "sharpening pencils…"
   appears in the margin (no spinner exists), finishes on its own ~4s later. Reload, press
   any key mid-park: instant full painted cover. Judge P5b-T3 (note crowds the play ring).
7. **One hard flick down**: full handoff (head snap, pencil tuck, drain, house lights,
   ember, black) → "Every campaign begins the same way…". Flick back: lantern relights
   FIRST, paint returns, settles exactly.
8. **Slow two-tick scrub, stop mid-drain**: he's caught, brand un-writing, ember alive.
   Scrub back — exact restore.
9. **Reduced motion** (`window.__prmForce(true)`, reload — persists per tab): instant
   settled cover with BOTH halves; scroll = three stepped crossfades; back = settled.
10. **The film once through**, spot t22 and t66 — regression eyeball (nothing touched it).

## Needs your verdict (the supersessions + parked items, one place)

| item | question |
|---|---|
| P4c-T1 | camera azimuth ships **+18°** (doc says −18°; irreconcilable with the §2 diagonal under a world-x seam). Accept, or fund a rotatable seam plane. |
| P4e-T1 | goblin scale ships **0.75u** (doc 0.62; 0.62 failed the first-glance test at phone width). Accept, or fund a re-staged figure. |
| P4c-T2 / P4e-T2 | comp supersessions: brand block owns the upper-left paper field (not centred); portrait 92vw is height-conditional. |
| P4d-T5 | lantern head staging: flame occluded by its own post from the shipped lens. |
| P4e-T5 | lantern pool measures yellow (56–61° hue), not amber (40–48 target). |
| P4e-T6 | island drop-shadow tail crosses the page margin at ≤11% alpha at 3 breakpoints. |
| P4-T6 / P4d-T6 | amber-eye chroma read; pencil legibility at framing / phone-width figure. |
| P5-T3 / P4e-T4 / P5b-T3 | poster tagline tail; scroll hint on the root; stall note crowds play. |

## The one process question (call sheet §4, deferred to this checkpoint)

`story/` is still untracked. The call sheet recommends starting a **`story-v2` branch**
now that the hero has passed verification, so the rebuild history from here is
recoverable. Your call — nothing is committed until you say so.

## After your walk

P6 (margin band + the Hand/serif caption systems — now authoring the real lettering per
the amendment) is next, then P7 (★). Evidence for everything above:
`story/docs/build/walks/p0..p5/`, ledger `story/docs/build/FINDINGS.md`.
