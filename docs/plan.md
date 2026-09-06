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
3. **Goblin puppet refinement** — richer action set on the locked rig. Deferred: expressiveness waits until it can be judged against real art. The rig's blocker is recorded below. ⬅ **current**
4. **Art pass** — painted layers replace pencil primitives, scene by scene, in story order; the graphite post-pass ships here (pencil look becomes the Behind-the-Curtain state).
5. **Ending morph + polish** — d20 → board transition, micro-interaction polish, performance, reduced-motion, audio mix.
6. **Copy + release gate** — final wording ✅ **done early** (copy/type/CTA pass per `copy-spec.md`); the release gate itself (deployed browser walk, zero console errors) remains and runs last.

## Status update — 2026-08-16 (art pass + polish sprint)

Milestones 3–5 are done; milestone 6's gate walked on the production bundle (scrub-driven; console/network clean; real-time play-through and a phone walk still owed a human eye).

- **Curtain pipeline** (`src/film/curtain.ts`): full-screen graphite post-pass with PAPER→PAPER / LINE→LINE fixed points (asserted in `scripts/curtain.check.ts`), exception mask (goblin + nudge finger + revealed props keep color), `paint()` color API in `pencil.ts` with a color-keyed material cache, `reveal()` returning scrub-safe tweens that put a prop's own solids into the mask.
- **Color script applied** (`docs/color-script.md` is authoritative): full token palette in `palette.ts`, every chapter painted, per-chapter sky/fog ramp (dusk→day→overcast→hearth→vellum→dawn→paper) synced to a CSS `--sky` var that lerps to paper under the curtain, C2 seven-prop reveal arc with the ravens beat easing the curtain itself to 0.6 and the signpost beat revealing tufts/treeline.
- **Review fixes shipped** (18-finding impeccable review, all fixed or adjudicated): ground split (earth-track patch / earth / grass), chapter visibility gating (`onlyFor` tl.set helper — beware reverse-scrub set ordering and pre-render flash, both guarded), freeze release snaps at 0.12s, captions `me1–me4` at 24% + paper halo on all captions, endcard tagline/subline reveal fix, die2 exits before the wordmark, board holds a 0.5-opacity wash so the flattened mini-world reads as printed content, field fill/ink registration (one holder transform), tavern enclosed (wings at floor edges, walls 14 high — sized for the portrait pull-back), warm parchment graphite (WARMTH 0.30, widened band), t36 goblin detour around the theatre mountain, portrait pull-back in `framing.ts`/`Film.tsx` (restores authored horizontal field when the 70° clamp engages; cached-vector guard against per-frame compounding; verified at 390×844).
- **Declined/accepted**: t51 goblin stays tight against the map sheet (stand position is IK-solved; moving it desyncs the drawing hand); t33 small-goblin accepted.
- **Still open**: `DISCORD_URL` in App.tsx is `#` (owner: Nayan); audio does not exist (film ships silent, captions carry it); real-device phone walk; real-time (non-scrubbed) play-through needs a foregrounded window (browser throttles rAF when occluded).

## Status (as of this import)

Milestone 1+2 complete. The entire film plays as black pencil line-work on paper, scrubbed by scroll:

- All chapters implemented per `skeleton-spec.md`: cold open → ambush + freeze ("That was me.") → lighting-the-world tracking shot (7 props) → theatre-set disc rotation → the dice scene (tumble, freeze, nudge, natural 20) → six-cut montage → cliff rise + world flatten → d20 throw → board + endcard.
- Both freeze clocks verified working (world clock stops, goblin clock doesn't).
- Build is clean (tsc + vite); zero console errors; all nine beat-sheet checkpoints verified against the spec (camera, goblin pose, captions, freeze state).
- Previz review done (human walk-through): scroll feel and pacing accepted as-is; one camera change locked — the C2 tracking shot is now a three-quarter-back over-the-shoulder follow instead of a flat side-track (spec + timeline updated together). Pacing and camera are locked.
- Copy/type/CTA pass implemented per `copy-spec.md`: full caption set rewritten on the timeline, type system shipped (Metamorphous for captions/UI, Cinzel for the CTA only, via @fontsource), endcard rebuilt as direction C ("lettered on the board", no box) with the scroll-scrubbed entrance choreography (t65–66) and the Discord CTA (`DISCORD_URL` still `#`, owner: Nayan).

Numbers in the beat sheet are previz targets, not sacred. Pacing changes go into `story/src/film/timeline.ts` (one beat-sheet-shaped file); set/prop changes into `story/src/film/world.ts`.

## Standing constraints

- **Mobile is a release requirement, not a late polish item.** The goblin, the art, and the animations must not look bad on a phone. `framing.ts` holds the composed horizontal field across viewports so the locked camera survives portrait, but portrait still reads tighter than desktop once it hits the 70° cap — judge every art-pass scene at phone aspect, not only on a laptop.
- **The gait blocks the beat sheet from posing the body.** `Film.tsx` writes `legL/legR.rotation.x`, both `arm.swing.rotation.x`, and `torso.position.y` absolutely every frame; tweening `goblin.speed` to 0 pins those channels to neutral rather than releasing them. Legs and torso are unreachable from `timeline.ts`, which is why every action so far is arms-and-head. Make the gait additive over a timeline-owned base pose before writing any beat that needs a crouch, a shrug, or a weight shift.
