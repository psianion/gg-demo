# story-v1 — build plan for the new scroll homepage

2026-11-06 · Source script: "Good Goblin Script v2" (claude.ai artifact 54uZKvjpGeVJH426Fhqn4J)

**Decisions already made (user, 2026-11-06):** reuse the current goblin as a stand-in · beats 1–5 working
and roughly drawn in the existing pencil/paint style (not art-bible polish) · all three Beat 2 toggles real ·
waitlist is a fake submit.

## 1. What we're building

A new Vite site at `/story-v1` (top level, next to `story/`). One pinned WebGL stage for 18 viewport heights
(Beats 0–5 of Script v2), then an ordinary page (feature sections + footer). Real scroll, real clicks, scrubbed
both ways. `story/` is not touched; it stays the reference.

## 2. Stack

Same as `story/` so the hero copies over unchanged: Vite 8, React 19, TypeScript, three r185,
@react-three/fiber 9, GSAP (+ ScrollTrigger), Lenis, Fontsource (Cinzel, Metamorphous, Vollkorn).
No new dependencies planned. Dev port **5181** (story/ keeps 5180, so both can run at once).

## 3. Architecture

```
story-v1/src/
  main.tsx, App.tsx          page shell: Lenis, the 18-unit scroll track, then the normal page
  stage/Stage.tsx            ONE fixed full-screen <Canvas>; owns camera + scene
  stage/director.ts          u ∈ [0,18] → camera pose, island pose, per-beat local progress
  stage/state.ts             tiny store: light | weather | encounter | rolled — survives scroll
  stage/beats/*.ts           one file per beat: props it adds + how it reads local progress
  stage/props/*.ts           cloud, rain/snow, tokens, fog sheet, rope, d20, laptop, room cards
  ui/*.tsx                   DOM overlay: wordmark, captions, rail, turn pill, waitlist card, chip
  sections/*.tsx             after-unpin feature sections, footer, mini-island return button
  hero/…                     the copied hero closure from story/src (see §4)
```

- **One clock.** ScrollTrigger maps the pinned track to `u` (0–18). Everything scroll-driven is a pure
  function of `u`, so reverse scroll is automatic.
- **Clicks are separate.** A click plays a real-time GSAP tween and writes to `state.ts`; the scroll sequence
  reads that state and never overwrites it (the script's "a clicked state stays" rule).
- **The die roll** is the one real-time event inside the scroll: it fires once at u = 11.5 and holds input
  for 1.2 s.
- **Captions and UI** are DOM over the canvas, shown or hidden by `u` ranges.

## 4. Reusing the hero

`Hero.tsx` pulls ~21,000 lines transitively (hero → curtain/actions/world → every old film set). Plan:

1. Copy the whole closure verbatim into `story-v1/src/hero/` with its folder structure intact, and boot it
   in its existing standalone mode (`?hero=1` path: entrance + idle life, no film). Gate: it renders the
   same as in `story/`.
2. Cut the old film out: stub or inline what hero.ts actually uses from `curtain.ts` (`markAlive`) and
   drop `actions/world/sets/*`, `gearing.ts`, `preScrub`, the blackout/ember "house lights" handoff and the
   "skip to the table" button. Gate: same render, far fewer files, `tsc` clean.
3. Expose the hero's root, island, lantern, goblin and rigs to the director so later beats can move them.

## 5. Beat by beat

| Beat | u | Build | Reused |
|---|---|---|---|
| 0 Hero | 0 | As shipped, plus: hover yaw ±25° / pitch ±8° on the island (eased, heavy), drag on touch, a rope hanging off the edge, wordmark + tagline + subline, scroll hint | hero scene, `heroLife` idle acts, cursor head-track, lantern |
| 1 Landing | 0–2 | Island tilts to ¾ top-down and descends to the bottom edge; hover rotation hands off smoothly to scroll; pencil grid draws in across the page; goblin hauls the rope, ties it to the signpost; wordmark shrinks top-left. Caption 1.2 | `pencil.ts` lines for rope and grid |
| 2 Canvas | 2–8 | Right-edge rail with 3 chips. **Light:** day/night paper, lantern lights, campfire brightens; also the site's dark mode, persisted. **Weather:** clear → rain → snow; a painted cloud he drags on a rope; pencil rain, snow flakes, island whitens. **Encounters:** sack tips out 3 monster tokens with nameplates + threat rings; second click swaps the set. Scroll plays all three in order | lantern glow + rigs, trilayer paint for props |
| 3 Table | 8–13 | 4 orange player tokens walked in one by one; turn pill; active token moves 3 cells while fog peels back; d20 rolls to 1 → **freeze** (world goes pencil, goblin stays in colour) → shrug, nudge → 20, colour returns, "critical hit". Camera pushes in. Captions 8.4, 12.4 | `dieGeometry.ts` from story/, goblin poses from `rig.ts` |
| 4 Pull-back | 13–16 | The live island is rendered into a texture on a laptop screen; camera cranes back and up over the DM's shoulder; round table, lamp, dice, snacks; DM + 4 players as flat ink cards. Captions 13.6, 15.2 | render-to-texture of the same scene |
| 5 Screen | 16–18 | Camera pushes back into the screen; island swaps to a "product UI" frame (placeholder chrome around the same scene); paper card: wordmark, line, email + Join, 3 feature buttons; goblin peeks over the card's edge | — |
| After | 18+ | Unpin; 3 feature sections (one still each, rendered from the scene) + footer; mini island bottom-right rewinds to the top | — |

Also from the wireframe: a small "Join the waitlist" chip top-right for the whole pinned stage.

**Goblin actions** are rough: walk / carry / haul / point / shrug / dust-off built from the existing rig's poses
and simple position tweens. No new character animation system.

## 6. One pass, built by a team (REVISED 2026-11-06 — replaces the six phases)

User ruling: **one pass, no multi-step fix cycle.** Art may be rough sketch line drawing. **Flow, scroll and
animation must be perfect.** Start from the hero island; everything else is drawn to sit with it.

| Role | Who | Owns (writes only here) |
|---|---|---|
| **builder** | Opus agent | everything under `story-v1/` except `story-v1/src/art/` and `story-v1/public/art/` |
| **artist** | Opus agent | `story-v1/src/art/**` (three.js line-drawn prop builders) and `story-v1/public/art/**` (SVG ink cards, glyphs) |
| **main chat** | lead | reasons, reviews, QA. Writes no site code. |

Agents talk to each other and to `main` with SendMessage. The artist's asset list and the API contract are in §11.

### Art direction (all new things)
Rough **ink line drawing on paper**, the same hand as the hero's pencil marks (`pencil.ts`: `sketch`, `polyline`,
`roughen`, `weight`). Mostly lines, at most a flat paper-coloured fill so lines occlude correctly, and one accent
per object (brass light, orange player tokens, red d20). The hero island stays exactly as shipped.

### Motion bar — this is what "perfect" means, and what main will check
1. **Every scroll-driven property is a pure function of `u`.** Scroll back to any `u` and the frame is identical
   (except clicked state). No `onEnter` one-shot tweens for scroll content.
2. **No snaps, ever.** Every handoff (hover → scroll in Beat 1, scroll → product UI in Beat 5, unpin at 18)
   is continuous in position *and* velocity. Hover rotation decays into the dock instead of being reset.
3. **Smoothing:** Lenis (lerp ≈ 0.1) feeds one ScrollTrigger with `scrub: true`; a single damped `u` (critically
   damped spring, no overshoot) drives the stage. No second layer of scrub smoothing stacked on top.
4. **Easing:** camera moves ease in-out across their whole range (no linear camera moves); goblin actions use
   anticipation and settle (small overshoot ≤ 4%). Props pop in with a 2-frame-free scale/draw-on, never appear.
5. **Line draw-on:** new line art enters by drawing its stroke (dash-offset or vertex reveal), driven by `u`.
6. **Clicks:** real-time tweens 0.6–1.2 s; a click mid-scroll never jumps the camera; double-clicks queue or
   retarget, never stack.
7. **60 fps** on a 2020 laptop at 1440×900 (no per-frame allocation, render-to-texture only during 13–17).
8. `prefers-reduced-motion`: camera moves become crossfades between held framings; no auto idle acts.
9. Phone (390×844): drag replaces hover, rail moves to the bottom, Beat 4 uses a taller crop.

## 7. Git

Branch `story-v1`. The builder commits once at the end (plus a WIP commit if it needs a checkpoint).
No AI attribution in commit messages (user's global rule). Nothing pushed.

## 8. Out of scope for this build

New goblin design · art-bible-level painting of new props · real waitlist backend · sound · a real product
canvas (Beat 5 uses a placeholder UI frame) · CMS/analytics/SEO.

## 9. Risks

- **The hero is wired to the old film** (preScrub, curtain, house-lights handoff). Step §4.1 copies before
  cutting so there's always a working version to compare against.
- **Rotating the island fights the hero's authored framing**, which is solved per viewport for a fixed
  camera. Hover rotation will turn the island, not the camera, and the framing is re-solved only on resize.
- **"Goblin stays in colour while the world freezes"** depends on whether he shares the trilayer uniforms
  with the island. If he does, he goes on his own render layer for that beat.
- **Render-to-texture in Beat 4** doubles draw cost for 3 units of scroll. Fallback: drop the screen texture
  resolution during the crane.

## 10. Paths

The builder copies `story/src/film/**` to `story-v1/src/hero/film/**` and `story/src/{Hero.tsx,HeroWordmark.tsx,hero.css}`
to `story-v1/src/hero/`, keeping relative imports intact. So the pencil kit lives at
`story-v1/src/hero/film/pencil.ts` and the d20 helper at `story-v1/src/hero/film/dieGeometry.ts`.
**The builder does this copy first and messages `artist` when it is done.**

## 11. Artist contract

World units are the hero's: island ≈ 5.2 × 3.6 (`ISLAND_RX = 2.6`, `ISLAND_RZ = 1.8`, top surface at y ≈ 0),
goblin 0.75 tall. +y is up.

Every 3D prop is a TS module in `story-v1/src/art/` exporting a builder that returns:

```ts
export interface Art {
  root: THREE.Group;          // origin at the prop's footprint centre, resting on y = 0
  reveal(p: number): void;    // 0 = not drawn, 1 = fully drawn; strokes draw on in order. Pure function of p.
  dispose(): void;
}
```

Extra per-prop setters are listed below. No per-frame allocation in `reveal`/setters. Lines via `pencil.ts`
(`polyline`, `curveLine`, `sketch`, `roughen`, `weight`, `numeral`), never a new line system.
`src/art/index.ts` re-exports everything. `src/art/Gallery.tsx` shows every prop with a reveal slider; the builder
mounts it at `?art=1`.

| File | Builder | Extra API | Notes |
|---|---|---|---|
| `grid.ts` | `buildGrid(w, d, cell)` | — | pencil grid on the backdrop plane, draws on from one corner |
| `rope.ts` | `buildRope()` | `set(a: Vector3, b: Vector3, sag: number)` | catenary-ish, called every frame during hauls |
| `taper.ts` | `buildTaper()` | `setLit(0..1)` | the stick he lights the lantern with |
| `weather.ts` | `buildCloud()`, `buildRain(w,d)`, `buildSnow(w,d)` | rain/snow `setTime(t)`, `setAmount(0..1)`; cloud `setSquash(0..1)` (shake) | rain = short pencil hatch strokes falling over the island only |
| `snowCap.ts` | `buildSnowCap(w)` | `setAmount` | caps for signpost / tree |
| `tokens.ts` | `buildPlayerToken(i: 0..3)`, `buildMonsterToken(kind)` | `setFacing(rad)` | player tokens orange accent; monster kinds: goblin-ish, wolf, skeleton, slime, bat, ogre (2 sets of 3) |
| `ring.ts` | `buildThreatRing(r)` | `setPulse(t)` | faint dashed ring |
| `sack.ts` | `buildSack()` | `setTip(0..1)` | |
| `fog.ts` | `buildFogSheet(w, d)` | `setPeel(0..1)` | hatched sheet that peels back like a bedsheet |
| `d20.ts` | `buildD20(radius)` | `showFace(1 \| 20)`, exposes face normals for the roll | red accent; uses `dieGeometry.ts` + `numeral` |
| `room.ts` | `buildTable()`, `buildLaptop()`, `buildLamp()`, `buildTableClutter()` | laptop exposes `screen: THREE.Mesh` (plane, UVs 0–1, 16:10) and `setBezel(0..1)` | round wooden table r ≈ 6 relative to island-on-screen scale; builder decides final scale |
| `public/art/people/*.svg` | DM (back/over-shoulder), player-1..4 | — | loose ink figures, transparent bg, used as textures on cards |
| `public/art/ui/*.svg` | light, weather-clear/rain/snow, encounters, chevron, card edge, goblin-peek (ears+eyes) | — | hand-drawn glyphs, `currentColor` strokes |
| `public/art/ui/mini-island.svg` | — | — | return button |

The artist asks `builder` (SendMessage) for anything that depends on scene scale, and tells `builder` as each file lands.

## 12. Review 1 (2026-11-07) — Beat 1 island angle

**Finding.** When the island is tucked at the bottom of the screen (u ≈ 2 onward) it is seen from ¾ top-down
(52°): a fat ellipse mid-frame, the grid a flat sheet under it. Wanted: a low, near-eye-level view. The island
reads as a thin ellipse hugging the bottom edge, the goblin, signpost and trees stand upright and tall in
front of empty paper, and the grid on the ground recedes to a horizon in perspective (sketches: low view with
and without the grid).

**Change (camera.ts only).**
1. `dock` elevation 52° → 2°: a level camera at eye height. The sketch's ellipse is ≈ 0.13 as tall as it is
   wide; the island is 2.6 × 1.8, so the island must be seen from ≈ 12°. A level camera that looks a little
   *above* the island (look point ≈ 1.3 up) sees it from 13° and drops it to the bottom edge — the framing
   solver sets that look height. Azimuth stays 0 (square on, like the sketch).
2. `dock` target box: rim width 0.8 → 0.92 of the viewport, near rim just past the bottom edge (1.02), so the
   ellipse spans the frame and sits on the edge as drawn. Portrait keeps its own box, same elevation.
3. Solver fix: `frameIsland` placed the island vertically by walking the look point along the ground, scaled by
   1/sin(el) — fine at 52°, divergent below ~20° (the first step was ~6 world units and the island ended up
   behind the camera). It now raises/lowers the look point instead, which is linear at every elevation. The
   52° `screen` framing converges to the same box as before (look.y ≈ 0.04).
4. Beat 5 `screen` framing keeps 52° (its own constant) — the product-UI frame still wants the map readable.
5. The grid is already a ground plane at y = −0.98, so at a level camera it foreshortens into the horizon grid
   by itself — but at 17 × 12 its far edge hid behind the island. `world.ts` now builds it 40 × 34, shifted
   6 back, so it recedes to a hard far edge at ≈ 0.58 of the frame behind the island, like the gridded sketch.
   The draw-on sweep is unchanged (its origin corner is now behind the lens, so on screen it reads as drawing
   in from the far right).

**Verified 2026-11-07** at 1440 × 900, u = 1, 2, 6, 9: island box ≈ 0.79–1.02 tall, ellipse ratio 0.16, goblin,
signpost and trees upright, `tsc --noEmit` clean. Beat 2 and the start of the Beat 3 push read fine from the
low angle; the threat rings and fog patch are flatter but legible.

**Inherits the change (not re-authored here, flag for review 2).** The dock is held u 2–8, so Beat 2 (chips:
light, weather, encounters) is seen from the same low angle; threat rings and the sack will read flatter.
The Beat 3 push (dock → 40°) now cranes up instead of down. The after-section stills are shot from the dock.

## 13. Review 2 (2026-11-07) — the chips beat's length, return visits, and a load gate

Agreed in brainstorm 2026-11-07. Three changes, all in `story-v1/`.

### A. The chips beat scrolls like every other beat
The canvas beat (u 2–8: Light → Weather → Encounters) is 6 viewports of scroll; the others are 2–5. It keeps
its sequence on scroll and the chips keep working on click, but it plays over **2.5 viewports**.

- Scroll ↔ u is no longer 1 viewport per unit. `clock.ts` owns a piecewise-linear map between scroll
  position `s` (viewports) and `u`: keys (u, s) = (0, 0), (2, 2), (8, 4.5), (18, 14.5). `uOf(s)` and `sOf(u)`.
  `S_MAX` = 14.5 replaces `U_MAX` wherever something is measured in scroll, i.e. the track height, the
  ScrollTrigger length, the unpin ramp, the stills/mini-island thresholds and `nav.go` targets (which stay in u
  and convert). Everything the stage does stays a pure function of u — only the pixel density of one stretch
  changed, so nothing in director/camera/world/overlay is touched.
- Not changed: the table beat (8–13) stays 5 viewports; it holds the real-time die roll. Flag for review 3 if it
  also reads long.

### B. First visit tells the story; later visits go to the apps
- **Memory:** `localStorage['gg.story.seen'] = <ISO date>`, written the first time the damped u reaches 17.5
  (the waitlist card is settled on screen). Leaving halfway does not mark it. The hero's own `gg.seen`
  (entrance at 0.6×) is untouched. Dev override `?story=1|0`, like `?u=`.
- **Story mode (not seen):** as today — hero, 18-unit story ending on the waitlist card, then the app sections
  and footer. The `#track` is `S_MAX + 1.25` viewports.
- **Static mode (seen):** the stage is pinned for 0 units: the same unpin ramp starts at scroll 0, so the hero
  rides off the top on the first scroll, then the three app sections, then a **static waitlist section** (the
  same card, laid out as a page section), then the footer. No ScrollTrigger exists; u stays 0, the hero lives
  (hover, idle acts). The overlay's captions, rail, chrome and in-story card are all u-gated and so never show.
- **"See for yourself":** in static mode the hero's "scroll" hint is replaced by this button, same place. Click:
  if the page has scrolled at all, Lenis eases back to 0 (≤ 0.5 s), then the page switches to story mode in
  place: the track grows, the ScrollTrigger is created, the hint returns. At scroll 0 both modes agree (lift 0,
  u 0), so there is no jump. The visitor scrolls the story themselves.
- `WaitlistCard` is extracted from `Overlay.tsx` into `ui/WaitlistCard.tsx` and used by both the overlay (as
  the floating `.card`) and `After.tsx` (as `section#waitlist`, only in static mode).

### C. Load gate on the hero (story mode only)
The story must not be scrollable before everything it draws is resident. Until ready: `html.gg-loading`
(overflow hidden, hint hidden) and `lenis.stop()`. Ready = fonts loaded **and** every SVG texture the world
loads has resolved (`world.loading`, a promise per `svgTexture`) **and** three frames have been drawn after
the shader warm-up on mount. Hard cap 8 s, then unlock regardless. The stage dispatches `gg-ready`; App
unlocks and refreshes ScrollTrigger. The hero's entrance is not waited for (scrolling mid-entrance already
skips it cleanly).

### Verified 2026-11-07 (1440 × 900, dev server)
- `?story=1`: track 15.75 viewports; 3.25 viewports of scroll = u 5 (weather, cloud and rain on, rail up).
  Gate held the scroll from 86 ms to 636 ms after navigation, then opened on `gg-ready`.
- `?story=0`: track 1.25 viewports, hint reads "See for yourself", rail/wait-chip hidden, u stays 0; hero rides
  off into the map editor; the page ends waitlist card → footer.
- "See for yourself" from 0.4 viewports down: eased to 0, track grew to 15.75, hint back to "scroll", the static
  waitlist section gone, stage transform empty (no jump); 2 viewports of scroll then = u 2, the docked island.
- `?u=17.9` wrote `gg.story.seen`; a plain load after that opened in static mode.
- `tsc --noEmit` clean.
- Known nit for the copy/visual pass: in static mode the three app stills are shot from the hero at rest, so the
  island is half pencil, half paint (the story's stills are shot late in the film, fully painted).
