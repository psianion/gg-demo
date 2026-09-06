# P5 fix round — cover teardown now gated on the eased playhead

Live walk, 1536×730 (inner 1536×730, DPR window 1522×714 screenshots), dev server
localhost:5180, 2026-09-03. Sampler: page-world rAF loop recording
`{ms, scrollY, #hero-cover style.visibility, life.handoffTime(), #hero-blackout opacity}`
every frame; carve = 3.5% of scrollMax 12402 = 434px; HERO_T = 2.31.

Fix under test: `Hero.tsx` — `active` no longer derives from raw `window.scrollY`;
HeroScene forwards every `preScrub` update (the eased playhead from timeline.ts's
0.8s expo scrub — the same value that drives `life.scrubTo`) to `onEased`, which
gates the cover on `t < -1e-3`.

## Forward: one 10-tick wheel flick from the settled cover (the verifier's failing gesture)

Per-frame samples `[ms, scrollY, handoffTime, blackoutOpacity, visibility]`:

    [25081,  86, 0.000, 0.000, v]
    [25097, 170, 0.061, 0.000, v]
    [25113, 246, 0.172, 0.000, v]
    [25129, 319, 0.331, 0.000, v]
    [25149, 385, 0.523, 0.000, v]
    [25165, 442, 0.725, 0.000, v]   <- raw scroll crosses the 434px carve HERE.
                                       pre-fix the cover flipped hidden on this frame
                                       (measured ht 1.36, blackout 0.008 in the verify)
    [25179, 495, 0.960, 0.000, v]
    [25198, 542, 1.206, 0.000, v]
    [25212, 586, 1.485, 0.101, v]   <- Phase B: house lights rising
    [25231, 626, 1.774, 0.880, v]
    [25248, 662, 2.067, 1.000, v]   <- page fully dark, ember beat inside (dies at 2.24)
    [25265, 694, 2.310, 1.000, v]
    [25280, 725, 2.310, 1.000, h]   <- teardown: EXACTLY at full handoff, black under black

Result: the cover flips hidden only at handoffTime = HERO_T with blackout at 1.
Every Phase B value (0.6s-equivalent house lights, 6% recession tween, ember death at
97%) is scrubbed through rendered frames before the teardown. The pre-fix one-frame
cut from a lit island to black cannot occur: the gate and the handoff share one clock.

## Reverse: 10-tick flick back up from y=917

    flip to visible at [89493, y=136, ht 1.952, blackout 0.999]
    settled            [92594, y=0,   ht 0,     blackout 0]

The cover returns while the page is still fully dark (bo 0.999) and the handoff
reverses on-screen — mid-return frame shows the graphite island under the falling
house lights with the lantern's amber dot re-lit, then the full settled painted frame.

## Stills (a slow 3-tick pass on the shipped code, frames the pre-fix cut never showed)

- p5-fix-settled-cover-cold-1536x730.jpg — the settled cover at y=0
- p5-fix-handoff-phaseA-middrain-goblin-caught-1536x730.jpg — drain mid-sweep, goblin caught turning, lantern still lit
- p5-fix-handoff-phaseA-drained-lantern-last-1536x730.jpg — paint gone, the lantern the last live thing
- p5-fix-handoff-phaseB-houselights-falling-1536x730.jpg — the page dimming over the graphite island

(GIF exports of the two passes were recorded but Chrome's auto-download policy ate
both downloads — the same trap P5-T3 recorded for the poster bake; the per-frame
sample tables above are the load-bearing evidence.)
