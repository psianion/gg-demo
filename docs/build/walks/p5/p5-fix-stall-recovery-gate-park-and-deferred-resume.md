# P5 fix round — font-stall recovery no longer swallows ignite + bloom

Live walks at 1536×730, dev server, 2026-09-03. Reproduced with a TEMP harness
(reverted after the walk): `?stallfonts=<ms>` replaced `doc.fonts.ready` with a
timer that also busy-blocked the main thread 400ms before resolving — the
accumulated-delta condition the finding names (lagSmoothing is 0 in App.tsx) —
and exposed the entrance timeline as `window.__ent`. gg.seen cleared each run
(cold pacing). The shipped `restore()`/gate code is exactly what was exercised;
only the readiness source was faked.

## What the harness exposed — the real root cause is DEEPER than the report's

Run 1 (pre-gate-fix, deferred-resume fix alone), sampling
`{entrance.time(), paused, timeScale, seamX, glow, done}` per frame:

    [4040]  t=3.019  paused  ts=0.18  seam=-3.4  glow=0  done=false   <- PARKED AT 3.019, NOT 1.65
    [6412]  t=3.019  playing ts=1     seam=1     glow=1  done=false   <- resume snap-rendered both beats
    [6590]  t=3.200  playing ts=1     seam=1     glow=1  done=true

The verifier's cold load read rig values (seamX -3.4, birth 1) and assumed the park
was AT the 1.65 gate. It was not: with lagSmoothing 0, a stalled main thread hands
the 0.18× crawl one huge tick that overshoots t1.65 mid-render; the gate's bare
`tl.pause()` fires as a crossed callback and strands the playhead PAST the still-
unrendered ignite (1.65–2.0) and bloom (1.75–2.55). Any resume then renders
everything behind the playhead in one frame — deferring the resume cannot help.

## The two-part fix, verified

1. The readiness gate pins the playhead AT the gate: `tl.pause(gateT)` (gateT =
   strokes.at + strokes.min = 1.65). Nothing past the gate has rendered when it
   fires, so the seek is invisible.
2. `restore()` parks the timeline and resumes via `gsap.ticker.add(…, true)` — the
   tick that carries the accumulated stall delta is consumed while paused, and
   play() re-bases against fresh ticker time.

Run 2 (both fixes, same harness):

    [3921]  t=1.65  paused  ts=0.18  seam=-3.4  glow=0  done=false   <- parked EXACTLY at the gate
    [6507]  t=1.65  playing ts=1     seam=-3.4  glow=0  done=false   <- resumed AT the gate, nothing pre-rendered
    [8084]  t=3.20  playing ts=1     seam=1     glow=1  done=true    <- 1.65->3.2 in 1577ms = authored pace

Run 3 (finer sampling): resumed at t1.65/seam -3.4; 320ms later t1.96, seam -0.73
(mid-bloom), glow just landed (ignite ends 2.0) — the sweep is gradual, and the
settled frame after the stall path is the correct painted cover with brand,
goblin, and lit lantern (screenshot in run log). The ignition and the paint bloom
PLAY; nothing cuts.

Both behaviors are pinned by hero-life.check source asserts: the `tl.pause(gateT)`
gate and the `tl.pause(); gsap.ticker.add(` deferral in restore.
