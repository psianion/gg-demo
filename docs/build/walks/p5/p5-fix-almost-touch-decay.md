# P5 fix round — the almost-touch decays over 400ms instead of cutting

Live walk at 1536×730, dev server, 2026-09-03, cold load settled
(`done:true, ht:0, seam:1` confirmed before driving). Driver: page-world script
calling `life.onPointer()` exactly as the verifier did — one call over the
graphite half (world x = seamX + 1.2 projected to NDC), then after 1200ms one
call off the island (NDC 0.95, 0.95) — sampling `rig.touchAmt.value` per frame.

Fix under test: heroLife.ts replaced the dual `gsap.quickTo` pair (two persistent
tweens on one property; the out-leg's resetTo landed synchronously on 0) with ONE
tween path, `touchTo(v)`, duration `v > 0 ? 0.25 : 0.4`, overwrite:'auto', gated
to tween only when the target changes (pointermove-rate calls stay allocation-free).

Measured `[ms-from-in-call, touchAmt]`:

    in-leg  (250ms):  [1, 0 at the call] [16, .190] [51, .488] [99, .784]
                      [148, .936] [165, .963] [218, .998] -> 1
    out-call (ms 1206): touchAmt reads 1.0 IN THE SAME STATEMENT   <- was 0 synchronously pre-fix
    out-leg (400ms):  [+17, .878] [+62, .642] [+85, .512] [+131, .325]
                      [+156, .250] [+194, .135] [+236, .074] [+278, .026] [+294, .016] -> 0

The warmth now breathes out through the full 0.4s tween (SETTLE.arrive ease
front-loads, so the visible fall spans ~300ms with a soft tail — the tween's
duration is the specced 400ms). The in-leg is unchanged and matches the
verifier's own correct measurement (0.963 at ~150–165ms).

`dispose()` now also kills any in-flight touch tween before zeroing the uniform.
Pinned by hero-life.check: no `quickTo(rig.touchAmt` in the source, and the
switched `duration: v > 0 ? 0.25 : 0.4` present.
