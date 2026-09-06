# P5b gate-latch walks — 2026-09-03, dev :5180, Chrome 1568x602, tab visible + rAF verified

Settled-fingerprint baseline (all walks land this exactly): seam 1, birth 1, shadow 0.45,
glow 1, gob true, glass f7edcd, flame true, brand 1, wm inset(0px 0% 0px 0px), meta 1,
hint 1, strokes undrawn 6 / drawn 187 (the 6 are authored-empty line geometries — same
count on a naturally completed entrance), entrance prog 1.

## A — skip under an armed gate (?stallfonts=1, gg.seen cleared)

Detect-armed → keydown → sample, atomically in one page script.

- before (armed): `{armed:true, t:1.65, seam:-3.4, glow:0, birth:1, gob:false, brand:"0"}`
- after keydown +200ms: full settled fingerprint; `ent {t:3.2, paused:true, prog:1}`
- stable after a further 900ms: identical fingerprint (no re-park, no rewind)
- p5b-skip-under-gate-settled-1568x602.jpg

## B — stall cap, hands off (?stallfonts=1, gg.seen cleared)

Sample loop every ~150ms from injection (landed mid-stall, parked t=1.65):

- parked at 1.65 for ~3.5s of the sampled window; note opacity 0 → 0.08 → 0.66 → 0.96 → 1
  (pencils on during the true stall), holds 1
- cap restore: t 1.65 → 1.721 (playing) at ~3.6s sample time, note fades 0.42 → 0
- done at sample 5224ms with t 3.2 / prog 1; note 0 after; full settled fingerprint
- p5b-stall-cap-completed-1568x602.jpg

## C — PRM cold load (persisted __prmForce → hard reload, force in place before mount)

- `{prm:true, prmFade:true}` — the COLD branch ran (cover carries hero-prm-fade)
- full settled fingerprint WITH the underdrawing: birth 1, undrawn 6 / drawn 187
  (the blocker measured birth 0, undrawn 158)
- PRM handoff flick: down → `{y:1000, ht:2.31, coverHidden:true, blackout:1}`;
  up → `{y:0, ht:0, coverVisible:true, seam:1, glow:1, gob:true, brand:1}`
- p5b-prm-coldload-underdrawing-present-1568x602.jpg
- note: __prmForce now persists per-tab via sessionStorage gg.prmforce (DEV-only,
  prmForce.ts) so a cold-PRM walk is deterministic; force reset to 0 after the walk

## D — reload below the fold, then Home (ledger P5-T6)

- wheel to y=700 → location.reload() → browser restores y=700:
  `{yRestored:700, ht:2.31, done:true, entProg:1, coverHidden:true, seam:-3.4}` —
  the seeded skip completed (no gate abort), cover correctly hidden past the carve
- Home +2.5s: `{y:0, ht:0, coverVisible:true}` + full settled fingerprint
  (meta/hint 0.9998 — last frame of the reverse fade still easing)
- p5b-reload-below-fold-home-settled-1568x602.jpg

## E — regression flick, both directions (non-PRM)

rAF recorder [ms, y, ht, coverVisible, blackout], 10-tick flicks:

- forward: 194 frames; Phase B rendered while visible (frames with 1.7<ht<2.30 and
  coverVisible 1); first hidden frame exactly `[_, 730, 2.31, 0, 1.000]` — teardown
  only at full handoff under an opaque blackout; film cold open renders
- reverse: cover reappears at `[_, 148, 2.053, 1, 1.000]` (black under black);
  mid-scrub frame shows the graphite island with the lantern already relit
  (lantern-first by geometry); settles at y=0 to the exact settled fingerprint
- p5b-handoff-forward-film-open-1568x602.jpg,
  p5b-handoff-reverse-relight-mid-scrub-1568x602.jpg,
  p5b-handoff-return-settled-1568x602.jpg

## Console

Across walks D/E page session and a full tracked ?stallfonts cap run: zero errors;
only the 2 baseline THREE.Clock deprecation warnings.

## Poster

Settled frame unchanged by the fixes (fingerprint identical to the P5 control) —
public/hero-poster.png NOT rebaked. Tagline-tail overlap stays a parked review item.
