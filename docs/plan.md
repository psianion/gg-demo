# Plan — stack, architecture, build order, status

## Stack (decided)

Vite + React + TS shell · **react-three-fiber (Three.js)** as the stage · **GSAP ScrollTrigger + Lenis** as the master timeline · custom GLSL for the graphite/parchment grammar · WebAudio. Dev port 5180.

### Why this stack

The art direction decides the tech:

- The freeze grammar (color world → graphite/ink, goblin stays colored, touched things re-ignite) is a **real-time shader problem**: one set of painted art, with the ink state computed in a post-process pass and color returning through animated masks. Pre-baking two versions of every image would double asset production and still read as a crossfade.
- Three moments demand a real 3D camera over painted layers (a multiplane rig): the **theatre-set rotation**, the **ending flatten** (camera rises, world collapses into illustration, top-down), and the **d20** the camera flies into. With painted layers placed at real depths, these are literal camera moves, not fakes.
- The **no-cut ending** into the interactive board rules out pre-rendered video entirely.

Rejected: Pixi-only 2.5D (signature 3D shots become hand-faked projections), pre-rendered frame-sequence scrub (heavy, non-responsive, kills interactivity and the no-cut ending), Lottie/SVG (can't reach painted richness).

### Architecture

- One fixed fullscreen R3F canvas; a tall DOM track (1800vh) drives scroll, Lenis-smoothed, scrubbing a single labeled GSAP timeline via ScrollTrigger. Chapters = timeline labels. Freezes = pinned story beats; scroll-driven so the viewer paces themselves.
- Each scene is a multiplane set: painted layers on planes at depth (currently pencil-primitive stand-ins). Ambient life (wind, fire, smoke, birds) is driven by one global world clock — a freeze is that clock stopping, site-wide. The goblin runs on a second clock that never stops.
- The goblin is a code-rigged segmented puppet (body-part planes, GSAP walk/action cycles) — same animation system as everything else, no special pipeline.
- The behind-the-curtain state will be one post-process pass (graphite ramp + parchment + ink edges) gated by a mask render-target; goblin and touched props write into the mask.
- The d20 is a real 3D mesh; the final face crossfades into the interactive board view — same canvas, no cut.
- Opening black screen doubles as the audio-consent gate. `prefers-reduced-motion` and mobile get a simplified pass.

## Build order

1. **Skeleton** — scaffold, scroll/timeline/canvas rig, world geometry, full beat sheet. ✅ **done**
2. **Previz review** — walk the pencil film, lock pacing and camera. ✅ **done**
3. **Goblin puppet refinement** — richer action set on the locked rig. ⬅ **current**
4. **Art pass** — painted layers replace pencil primitives, scene by scene, in story order; the graphite post-pass ships here (pencil look becomes the Behind-the-Curtain state).
5. **Ending morph + polish** — d20 → board transition, micro-interaction polish, performance, reduced-motion, audio mix.
6. **Copy + release gate** — final wording, deployed browser walk, zero console errors.

## Status (as of this import)

Milestone 1+2 complete. The entire film plays as black pencil line-work on paper, scrubbed by scroll:

- All chapters implemented per `skeleton-spec.md`: cold open → ambush + freeze ("That was me.") → lighting-the-world tracking shot (7 props) → theatre-set disc rotation → the dice scene (tumble, freeze, nudge, natural 20) → six-cut montage → cliff rise + world flatten → d20 throw → board + endcard.
- Both freeze clocks verified working (world clock stops, goblin clock doesn't).
- Build is clean (tsc + vite); zero console errors; all nine beat-sheet checkpoints verified against the spec (camera, goblin pose, captions, freeze state).
- Previz review done (human walk-through): scroll feel and pacing accepted as-is; one camera change locked — the C2 tracking shot is now a three-quarter-back over-the-shoulder follow instead of a flat side-track (spec + timeline updated together). Pacing and camera are locked.

Numbers in the beat sheet are previz targets, not sacred. Pacing changes go into `story/src/film/timeline.ts` (one beat-sheet-shaped file); set/prop changes into `story/src/film/world.ts`.
