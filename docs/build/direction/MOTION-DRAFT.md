# THE PROJECTIONIST'S HAND — the complete motion and micro-interaction system

2026-09-03 · Creative-technology layer for the whole site: the film body (t0–66), the persistent
interface, the endcard, and every moment the visitor touches the page.

**What this is.** `docs/2026-09-02-motion-system.md` is the architecture and it is **inherited, not
replaced**. This document extends it from "the shipped hero plus a v1 film" to "the whole 48-beat film
body, the interface layer, and the conversion surface", at the resolution an engineer builds from
without inventing anything.

**Authority.** `docs/2026-09-03-scene-book.md` is LAW; where this document and the scene book
disagree, the scene book wins and this document is wrong. `docs/copy-spec.md` is verbatim.
`gearing.ts:44–54` and `RUNTIME = 66` are fixed — **nothing here re-times the film.** Where the
shipped code and a doc disagree, the code is cited and the disagreement is named in §16, never
silently resolved.

**What it may not do.** It may not add an eighth transition, may not add a third clock, may not add a
post pass, may not tween FOV, may not re-gear a stage, and may not put a spinner anywhere.

---

## 1. THE LAWS

Twelve. Each one is a rule with a named failure behind it. A motion that cannot cite its law does not
ship; it gets deleted, not tuned.

| # | Law | The failure it prevents |
|---|---|---|
| **L1** | **Two clocks, and only two.** The world runs on `world.t` scaled by `world.timeScale` (freezable, a tweened property — `Film.tsx:182`); the goblin runs on `world.gobT`, which never stops (`Film.tsx:183`). Every ambient thing joins the world clock. Nothing gets a third clock without a name in this table. | A third clock is a third thing to freeze. The film's whole thesis is "the world stops and he doesn't"; anything that stops on its own schedule silently contradicts it. |
| **L2** | **Scroll owns time.** The master timeline is `paused` and driven only by `tl.time()` from the gearing drive (`timeline.ts:1063–1088`). Nothing plays it. Its default ease is `'none'` (`timeline.ts:72`) — **on a scrubbed timeline the visitor's hand is the ease.** | Double-easing. An authored ease on top of the scrub reads as lag, and the visitor blames their trackpad. |
| **L3** | **Input wins, same frame.** Any input cancels any assisted motion immediately (autoplay yields on `wheel`/`touchstart`/`keydown` — `App.tsx:149–151`). No animation may gate, delay, queue, or reinterpret an input. | Scroll-jacking. One frame of "the site decided when I get to move" costs more trust than the whole film earns. |
| **L4** | **Three ease lanes, hard borders.** Scrub (`'none'`), Settle (`SETTLE.*`), Puppet (`PUPPET.*`) — `motion.ts:49–69`. UI, camera, type and margin never borrow the puppet lane; `motion.check.ts:74–91` greps for it. Elastic is banned in every lane, forever. | A camera that bounces. A caption that overshoots. The film stops being a hand-made object and becomes a template. |
| **L5** | **No state in the film's motion.** No integrators, no springs, no velocity drag, no per-frame accumulators driving visual state, no booleans flipped on "revealed". Every visual value is either an authored GSAP key or a pure function of `(t, gobT, a scrub-tied scalar)`. | The whole scrub-safety bug class. `timeline.ts:129–139` and `goblin-design §11.1` are both written in the past tense of shipped bugs. |
| **L6** | **No callbacks drive visual state.** `tl.call`, `onComplete`, `onStart` and ScrollTrigger boundary callbacks do not reverse. Visibility goes through `onlyFor()`-style `tl.set` triads (`timeline.ts:139–149`). A tween's own `onUpdate` **is** legal — it fires on every playhead pass in both directions — but only where it writes a pure function of that tween's own progress (`heroLife.ts:345–349` is the shipped precedent). | The film's first frame came back with the camp missing. A callback fired on a boundary crossing is a one-way door on a two-way road. |
| **L7** | **Paired sets sit `PAIR_GAP` apart, never at the same position.** Two `tl.set`s on the same target at the same position replay in reverse order on backward scrub. `PAIR_GAP = 0.025` t (§2.4) — above `clocks.check.ts:70–74`'s 0.02 floor with float headroom. | The page-turn flash. And the seven montage clusters, which are invisible until someone scrubs backwards. |
| **L8** | **A partial state is a held frame.** Any `0 < curtain < 1`, any mid-sweep `seamX`, any mid-ramp `uTriFlat` must be a composed, shippable frame, because a parked scrub will hold it. No transition may pass through a frame that only works in motion. | Mask defects and half-tinted objects. Colour law 2 bans half-tinted objects by name; a held partial frame is where that ban gets tested. |
| **L9** | **Every motion names its token, lane, clock and grammar.** Tokens live in `motion.ts` and are *wired* — imported at the call site — so drift is impossible by construction (`motion.check.ts:116–197`). A re-inlined literal fails the check. | The scale rotting into forty hand-found numbers, which is what `actions.ts:56–58` records happening to thirteen reaches. |
| **L10** | **The camera never freezes.** `timeScale` stops the world; the camera is on the master timeline and keeps moving through every tick (S2's push-in, S4-B5's drift, S5's dolly). | A freeze that also freezes the lens reads as a stall, not as a stopped world. The visitor's own thumb still moving the shot is what makes the freeze a privilege instead of a pause. |
| **L11** | **Reduced motion is a path, not a subtraction.** `A = 0` means *still at the lit pose*, never a slowed or damped version. Every beat has an authored still. Honoured live via `matchMedia`, no reload (`rigs.ts:42–51`). | "Damped" motion still moves. A visitor with a vestibular disorder gets nausea from 30% of a camera ride exactly as they do from 100% of one. |
| **L12** | **No spinner exists.** Anywhere. The loading is the drawing drawing itself; a stall slows the hand and pencils one margin note. | The one honest opportunity this site has to perform its own product, spent on a rotating arc. |

---

## 2. TOKENS

### 2.1 The shipped scale — unchanged, re-stated

`src/film/motion.ts` is the vocabulary. Every value below is asserted by `motion.check.ts:34–48`.
**This section adds; it does not fork.**

| Token | Value | Unit | Status |
|---|---|---|---|
| `RUNTIME` | 66 | film-t | wired, fixed |
| `SCRUB` | 0.8 | s | wired |
| `T_FLICK` | 0.12 | both | wired |
| `T_UI` / `T_UI_MAX` | 0.2 / 0.25 | s | CSS-pinned |
| `T_BEAT` | 0.4 | film-t | wired |
| `T_PUNCH` | 0.25 | film-t | wired |
| `T_GESTURE` | 0.5 | film-t | wired |
| `T_REVEAL` | 0.8 | film-t | wired |
| `T_DRAIN_MIN` / `T_DRAIN_MAX` | 0.5 / 1.4 | film-t | wired |
| `T_EXHALE` | 0.3 | film-t | wired |
| `T_CAM_MIN` / `T_CAM_MAX` | 1.5 / 2.5 | film-t | forward |
| `T_BLOOM_MIN` / `MAX` / `CTA` | 0.8 / 1.2 / 0.18 | s | forward |

**The dead zone stands.** No *UI-seconds* duration between 0.25 s and 0.4 s; none under 0.1 s except
`T_FLICK` acknowledgments. Film-t durations are exempt — `T_EXHALE = 0.3` is the doc-sanctioned
precedent (`motion.ts:5–8`), and every new film-t token below inherits that exemption. The test is not
the number, it is the unit: **a duration that lands in `styles.css` must be a UI-lane value**
(`motion.check.ts:199–212`), and a duration that lands on the master timeline is film-t and free.

### 2.2 The extension — twelve new tokens

Added to `motion.ts` with the same three-way status marking (WIRED / CSS / FORWARD).

| Token | Value | Unit | Consumer | Why this number |
|---|---|---|---|---|
| `PAIR_GAP` | 0.025 | film-t | timeline (every paired set) | `clocks.check.ts:70` demands ≥0.02 t; float subtraction of authored decimals (`51.25 − 51.23`) can land a hair under. 0.025 t = 25 ms at play pace ≈ 1.5 frames — invisible, and provably above the floor. |
| `T_NUMERAL` | 0.3 | film-t | chapter numeral crossfade | The scene-book's 300 ms, in the unit it actually lives in. It sits on the master timeline at t16.5/31.5/37.6/49.5/57.5/64.5, so it is film-t and exempt from the dead zone. **It must never appear in `styles.css`.** |
| `T_FLUSH` | 0.2 | film-t | the Hand's graphite⇄ink stroke crossfade | The scene-book's 200 ms per stroke. Expressed as a *width in curtain-space*, not a tween — see §6.3. |
| `T_REST_DETECT` | 0.15 | s | touch soft rest | Momentum-death detection window (motion §9). |
| `T_REST` | 0.22 | s | touch soft rest | The eased ride to the anchor. Above the 0.1 floor, below the dead zone. |
| `T_STEP` | 0.45 | s | keyboard `↓/↑` anchor step | Long enough to read as travel, short enough that holding the key is not a slideshow. |
| `T_SKIP` | 1.2 | s | skip-note ride to the endcard | Shipped literal, `App.tsx:186`. |
| `T_REPLAY` | 1.6 | s | replay's ride Home | Scene book §3-S8-B3. Longer than the skip because it crosses the whole film. |
| `T_CURSOR_HIDE` | 2.5 | s | play-mode cursor auto-hide | Video-player convention; scene book §2. |
| `DISC_SMOOTH` | 0.35 | s | S4 theatre-disc input smoothing | Scene book §3-S4-B4 ("the locked 0.35 s input smoothing"). |
| `BOARD_BREATH` | `{ amp: 0.005, periodS: 12 }` | — | S8 board breath | ≤0.5% zoom drift, 12 s (scene book §3-S8-B3). Same shape as `HERO_DOLLY`. |
| `FLATTEN` | `{ x0: 128, xSpan: 42, spread: 0.9, dur: 1.1 }` | film-t / world-x | S7-B4 | The scene book's own stagger formula, as a token instead of a magic constant: `offset = (originX − x0) / xSpan × spread`. |

Two shipped literals are **promoted, not invented** — they already equal existing tokens and the call
site should read the token: `heroLife.ts:595–596`'s almost-touch `0.25 / 0.4` **is** `T_UI_MAX` /
`T_BEAT`. Rewiring them is a two-line change and closes a drift `motion.check` cannot currently see
(§16, D-4).

### 2.3 Ease lanes — which ease, for which class, and why

| Lane | Ease | Everything that uses it | Why |
|---|---|---|---|
| **Scrub** | `EASE_SCRUB = 'none'` | The master timeline's default. Caption opacity, curtain values, camera rails' *positions when the beat is a follow*, the `seamX` sweep's linear legs, the travel-line `instanceCount` ramp, the flatten's UV mix. | The visitor's hand is already the ease (L2). A second one is lag. **And exact reversal is easiest on a straight line** — the crossing times in `heroLife.ts:538–539` are solved analytically only because the drain is linear. |
| **Settle** | `power2.out` (arrivals) · `power2.inOut` (A→B moves, the dominant authored ease) · `power2.in` (impacts, exits) · `power3.out` (heavy settles: the die) · `power4.out` (`snapBack` only) | Camera beats, reveals, rig moves, UI enters/exits, lettering, the depth ramp, the frontier sweep, the exhale. | Confident deceleration is the film's whole physical register: things arrive and stay arrived. `power4.out` is reserved for `snapBack` because a punchline is the one release that should feel *snapped*, not eased. |
| **Puppet** | `back.out` (pop-ins) · `sine.inOut` (organic micro-loops) · `sine.out` (walk-offs) · `bounce.out` (**one** authored drop — the tavern sign, grandfathered and re-spent as S6-B3's sanctioned bounce) | In-world prop and character acting only. | Props are actors in this world. But an overshoot on a camera or a caption is the thing that makes a site read as templated, so the border is enforced by grep, not by taste. |

**House follow-through is hand-offset, not stagger.** Secondary channels start at `at + dur × 0.22`;
heads chase necks by `dur × 0.12` at `0.9 ×` duration (`actions.ts:294–300`).

**`stagger:` goes to zero.** It appears exactly once today (`timeline.ts:902`, the miniature flatten)
and the scene book's twelve-group x-keyed formula replaces it. After S7 is rewired, **the film contains
no `stagger:` at all** — every cascade is a computed per-target offset, because a computed offset is a
position on the timeline and a `stagger` is a scheduling behaviour. Positions reverse; behaviours are
one more thing to reason about backwards. Assert it (§15, A5).

### 2.4 Micro-motion constants

Shipped and unchanged: `BOIL {fps: 6, ampPx: 0.8}` · `BREATH_RATE 1.9` · `STRIDE_RATE 11` ·
`FLICKER {scaleAmp .18, scaleRate 9, pulseAmp .3, pulseRate 13, glowBase 4.5, glowAmp 1.6}` ·
`RAY_SPIN_RATE 0.5` · `HERO_DOLLY {amp .012, periodS 13}` · `MOTH_ORBIT_S 2.6` ·
`UI_RISE_MAX_PX 12` · `PARALLAX_CAP_DEG {yaw 2.2, pitch 1.2}` · `IDLE_THROTTLE {afterS 12, fps 30}`.

Added, all shipped literals being named rather than new behaviour:

- `TRACK_TAU = 0.13` s — the head-chase time constant, `k = 1 − exp(−dt/τ)` (`heroLife.ts:751`).
  Frame-rate independent by construction; **this is the only damped lerp on the site and it lives on
  the UI clock, not the film.**
- `PAR_TAU = 0.55` s — parallax `quickTo` damping (`heroLife.ts:583–584`).
- `PERK = { up: 0.3, settle: 0.5 }` — the ear-perk (`heroLife.ts:635–636`); `settle` is `T_GESTURE`.
- `BLINK = { close: 0.06, open: 0.07, everyS: [3.5, 7.0] }` (`heroLife.ts:718–730`).
- `SCRITCH = { periodS: 1.8, afterS: 4 }` (`heroLife.ts:734–743`).
- `DEPTH_SHOT = { near: 0.95, far: 2.4 }` — multipliers of shot distance for `rig.depthNear/Far`,
  lifted verbatim from the hero's own solve (`Hero.tsx:131–132`). `DEPTH_TIGHT = { near: 0.55, far:
  1.35, dur: 0.6 }` is the same pair pulled in for the film's exactly two tightening moments (§9.3).

---

## 3. INPUT → RESPONSE BUDGET

The contract: **what must be on screen within how many milliseconds of each input class, and what is
explicitly allowed to be late.** "First visible response" means a pixel changed, not a promise
resolved.

| Input | First visible response | Budget | What is allowed to be late |
|---|---|---|---|
| **Wheel / trackpad tick** | The Lenis transform moves; `ScrollTrigger.update` runs on Lenis's own `scroll` event (`App.tsx:93`), the drive re-points the scrub tween (`timeline.ts:1075–1078`) | **same frame, ≤16 ms** | The *film* settling to the new `t` — that is the authored 0.8 s expo glide and it is the hand-feel, not lag |
| **Touch drag** | Same path, no smoothing between finger and page | **same frame** | Nothing. A dragged page that lags the finger is broken, not stylish |
| **Flick / fling release** | Momentum begins immediately (native under Lenis) | **same frame** | The playhead's catch-up (§7.3) |
| **Any input during play mode** | `setPlay('idle')`; the rAF loop is cancelled on the next tick (`App.tsx:142–151`) | **same frame for the state, ≤1 frame for the loop** | Nothing else |
| **`Esc`** | Play mode de-escalates | **same frame** | — |
| **Keyboard anchor step (`↓/↑`)** | The eased ride starts | **≤50 ms**, `T_STEP` 0.45 s `power2.out` travel | The film's own settle at the destination |
| **`PgDn/PgUp`, `Home`, `End`** | Ride starts | **≤50 ms**; `T_SKIP` for `End`, `T_REPLAY` for `Home` | — |
| **Hover / pointerenter on a control** | The state transition starts | **≤50 ms**, no hover-intent delay — every target is ≥44 px | — |
| **Click / press** | The pressed state paints | **≤100 ms**, `T_FLICK` acknowledgment | Navigation (`target="_blank"`) |
| **`focus-visible`** | The drawn double-line rectangle *and* the identical hover treatment | **same frame** | — |
| **Touch tap on a control** | `:active` state (there is no hover to borrow) | **≤100 ms** | — |
| **Pointer move over the Cover** | Parallax/head-track/almost-touch targets update; the damped chase begins | **next frame**, damped over `PAR_TAU` / `TRACK_TAU` / `T_UI_MAX` | The *arrival* — these are presences, not controls, and a damped presence is the point |
| **`prefers-reduced-motion` flip** | Takes effect | **next paint, no reload** (`rigs.ts:44–49`, `heroLife.ts:491–496`) | The timeline rebuild, which preserves `tl.time()` (§13.2) |
| **Resize / rotate** | FOV re-clamp and pull-back re-solve | **next frame** (`Film.tsx:72–82`, and the per-frame idempotent compare at `:201–206`) | Portrait restaging of authored `portraitLook` targets — next rendered frame |
| **First byte → first paint** | Paper, tooth, margins (CSS/inline, zero network) | **≤250 ms** (`hero-design §8`) | Everything else |
| **Any input during the entrance** | The entrance jumps to the settled frame | **same frame** (`heroLife.ts:460–472`) | — |

**Two things that must never be late, and are not on the list because they are not responses:** the
scroll position (it is never written by us except during an explicitly-invoked ride), and the caption
under the thumb (it is a tween on the same timeline as the scroll, so it is 1:1 by construction).

**The one honest lateness.** At 4× CPU throttle the curtain pass can push a frame past 16.6 ms.
`gsap.ticker.lagSmoothing(0)` stays (`App.tsx:84`): the film must never rewrite its own clock after a
hitch. A dropped frame is a dropped frame; a catch-up jump is a continuity error.

---

## 4. THE CURSOR SYSTEM

**The pointer is a presence, not a tool.** System cursor always. No custom sprite, no trail, no ring,
no magnetic snap. The reason is the film's own argument: for eleven scenes the visitor watches someone
else's hands do the touching, and their reward for waiting is one button. A decorated cursor spends
that reward in the first second.

### 4.1 States — four, and there is no fifth

| State | When | Implementation |
|---|---|---|
| **default** | Everywhere: over the canvas, over captions, over the margin, over the board | `cursor: default` on `html`; the canvas has no pointer handlers at all — `Film.tsx` registers none, `curtain.ts` registers none, `Hero.tsx:89–105` registers a **window-level** `pointermove` and nothing else |
| **pointer** | Over the four controls only: `#play`, `#hero-skip`, the film's skip note, `#endcard-cta` | `cursor: pointer` on exactly those four selectors |
| **text** | Over the endcard's live DOM text (subline, © line) and nowhere else | Default UA behaviour; the film's captions carry `user-select: none` so the I-beam never appears mid-film |
| **hidden** | Play mode, after `T_CURSOR_HIDE` (2.5 s) of pointer stillness | `html.cursor-hidden { cursor: none }` plus the same on the four controls. Restored on the first `pointermove`, and on any focus change. Only while `play === 'playing'` |

**Never:** `grab`, `crosshair`, `zoom-in`, `not-allowed`, or a `pointer` on anything that is not a
control. The board "does not pan, does not zoom, and accepts no pointer events" (scene book §5.1) —
a `grab` cursor there would promise a demo the frame deliberately refuses.

### 4.2 How the cursor answers the world — three responses, one surface

All three live on the **Cover only**, are read-only, are damped, and are off on touch and under reduced
motion. All three are shipped (`heroLife.ts:640–684`).

1. **Parallax breath.** `gsap.quickTo` on `par.yaw` / `par.pitch`, `PAR_TAU` `power2.out`, capped at
   `PARALLAX_CAP_DEG` (2.2° / 1.2°), applied about the lens after the framing solve
   (`Hero.tsx:174–177`). Input normalised to viewport centre.
2. **He notices you.** Head-track cone yaw ±14°, pitch −10°…+6°, chased at `TRACK_TAU` and split
   neck 0.4 / head 0.6 — the same cascade `look()` authors. First cursor entry over the island earns
   the one-per-session ear-perk (`PERK`, settle lane, deliberately **not** puppet: it must read
   *noticed*, not cartoon). After `SCRITCH.afterS` of stillness he loses interest and goes back to
   work — a 1.8 s pencil loop, his only idle act.
3. **The almost-touch.** One uniform triple (`rig.touch`, `rig.touchR`, `rig.touchAmt`) driving a
   ≤6% amber lift on the **graphite half only** — it lives on the Prep branch of the shader
   (`trilayer.ts:400–405`), so it can never paint. `T_UI_MAX` in, `T_BEAT` out, through **one**
   tween path (`heroLife.ts:589–599` records that a dual-`quickTo` pair cut the warmth to zero
   instead of decaying it). Cost: one uniform write per move, zero draw calls, zero React state.

### 4.3 In the film: nothing, and that is the design

Between the handoff and t64.5 the pointer does **nothing**. No hover, no parallax, no hotspot, no
clickable prop. The film's input is the scroll and the film says so with its own silence. This is not
an omission to be filled later; it is the setup for §5's punchline.

Implementation: `#overlay` is `pointer-events: none` except the controls; the canvas has no handlers;
the play button lives outside `#overlay` (`App.tsx:337–339`) precisely so it can blend against the
blackout and still be hit.

### 4.4 At the endcard: one response, and it is the film's own rule

The CTA. Eleven scenes taught *what the goblin touches comes alive*; the button is drawn and the
visitor's pointer is the touch. Full spec in §5.

### 4.5 Touch equivalents

| Cursor behaviour | Touch equivalent |
|---|---|
| Parallax breath | **None.** `onPointer` returns early on `pointerType !== 'mouse'` (`heroLife.ts:643`) |
| He notices you | **One glance-up**, once, on the first touch-scroll (`heroLife.glance`, `Hero.tsx:98–100`) |
| Almost-touch | **None.** There is no hover to almost-touch with |
| Auto-hide | n/a |
| Hover state on a control | **`:active` only.** Every `:hover` rule is wrapped in `@media (hover: hover) and (pointer: fine)` — an unguarded `:hover` sticks after a tap on touch, which is the single most common way a good button becomes a broken one |
| Hover as affordance | **Rest state must be self-evidently a button.** The CTA's opaque paper fill, 2 px ink border and offset second pass do that job at rest (`styles.css:242–284`) |
| — | Plus, touch-only: **soft rests** (§7.5), `-webkit-tap-highlight-color: transparent` with a real `:active`, and a 48 px min hit height (`styles.css:240`) |

---

## 5. HOVER AND FOCUS INVENTORY

Every interactive element on the site. All UI transitions run on compositor properties at UI-lane
durations; `motion.check.ts:199–212` pins every `transition:` duration in `styles.css` to
`{T_FLICK, T_UI, T_UI_MAX}`. **`:focus-visible` always receives the identical visual change as hover,
plus the drawn rectangle. No state is hover-only** (scene book §8, Keyboard).

| Element | Rest | Hover / `:focus-visible` | Active | Disabled / absent | Timing | Reduced motion |
|---|---|---|---|---|---|---|
| **CTA** `#endcard-cta` | Graphite outline, opaque paper fill, 2 px ink border; second border offset 3 px, rotated 0.4°, opacity 0.45, boiling ≤0.8 px | **Amber `#F2C35E` blooms through the letterforms from the pointer-entry side**; the contact shadow arrives beneath *with* the colour (the film's rule); offset border re-inks 0.4°→0.9°; fill inverts to ink, label to paper | Fill deepens to ink, label to paper, 2 px settle | **If `DISCORD_URL` is unset the button does not render** and the subline stands alone (`App.tsx:26`; scene book §5.3). A dead `#` never ships | bloom `T_BLOOM_CTA` 0.18 s; border `T_UI` (shipped, `styles.css:283`); fill `T_UI` (`:249`); press `T_FLICK` | Bloom becomes a plain crossfade at the same duration; no scale, no boil. **The state change is kept** — ≤250 ms colour changes are not vestibular triggers |
| **play / pause / replay** `#play` | 0.75 opacity, `mix-blend-mode: difference` so it reads on paper *and* on the blackout with no authored transition (`styles.css:366–391`) | opacity 1 (shipped, `T_UI_MAX`) **+ the label underline draws on** over `T_FLICK` | 1 px dip | Never disabled. Label swaps by mode; `aria-label` swaps with it (`App.tsx:344`) | `T_UI_MAX` opacity, `T_FLICK` underline | Underline becomes a fade; opacity kept |
| **skip note** (film, from t16.5) | Penciled, 80% ink, Quiet Serif | ink 100%, the arrow advances 3 px | — | **Not in the DOM's tab order before t16.5 or after t64.5** — driven as a pure function of `t` (§5.2), never a callback | `T_UI` | Ride becomes an instant jump (`App.tsx:186` already branches) |
| **hero skip note** `#hero-skip` (returners) | Penciled, 80% | ink 100% | — | Only rendered in film mode after `gg.seen` (`Hero.tsx:310`) | `T_UI` | Instant jump (`prmAmbient() > 0` gate, `Hero.tsx:247`) |
| **Wordmark** (endcard) | Static drawn lockup | **Ear-perk once per session**, `PERK` (0.3 up / 0.5 settle), then never again | — | Not a link during the film; at the endcard it is Home | `PERK`, settle lane | Off |
| **SR skip link** | Visually hidden | **Becomes visible on focus** — the standard, and non-negotiable | — | Always first in DOM | none | none |
| **Subline, © line** | Live DOM text, selectable | Text cursor only | — | — | — | — |
| **Captions, margin, ruler, numeral, world, board** | — | **None, by design** | — | `pointer-events: none` | — | — |
| **hint (`scroll ↓`)** | Boils, bobs 8 px every 6 s | Not a target | — | Dies permanently on first input, never returns (`App.tsx:317` keeps it `display:none` in film mode) | — | Bob off, boil off |

### 5.1 The focus rectangle — a build item, not a default

`styles.css:486–489` currently ships `outline: 2px solid var(--line); outline-offset: 3px`. The scene
book (§2, §8) mandates **the drawn double-line rectangle, in the CTA's own offset-border language,
never the browser default, never suppressed.** Build it as one utility, applied to every focusable
element:

```css
:focus-visible { outline: none; position: relative; }
:focus-visible::before,
:focus-visible::after {
  content: ''; position: absolute; inset: -4px; border: 2px solid var(--line);
  pointer-events: none;
}
:focus-visible::after { inset: -7px; opacity: 0.45; transform: rotate(0.4deg); }
```

Two passes, offset, the second rotated off true — the same hand that drew the button. It must survive
on `#play` (which sits on `mix-blend-mode: difference`) and on the CTA (which already owns `::after`
— there, the focus ring uses the existing `::after` at its hover rotation plus one added `::before`).
`outline: none` without a replacement is a hard failure; the replacement lands in the same commit.

### 5.2 Anything that changes DOM interactivity is a function of `t`, not a callback

The skip note enters the tab order at t16.5 and leaves at t64.5; the endcard becomes
pointer-enabled at t65.0. Neither may be driven by a marker callback (L6). Both are computed in the
frame loop from `tlRef.current.time()`, which is already read there for the idle throttle
(`Film.tsx:163`):

```ts
const t = tlRef.current?.time() ?? 0;
skipEl.hidden      = t < 16.5 || t >= 64.5;          // hidden also removes it from tab order
endcardEl.style.pointerEvents = t >= 65.0 ? 'auto' : 'none';
```

Pure functions of `t`. They reverse for free, they cost two comparisons, and they cannot desync.

---

## 6. THE TEXT REVEAL SYSTEM

### 6.1 Two text technologies, and which line uses which

| Voice | Technology | Reveal | Lines |
|---|---|---|---|
| **The Hand** | Authored stroke SVG, `aria-hidden`, verbatim in the SR document | **Write-on**, stroke by stroke, ~15 marks/s | The twelve captions; the endcard tagline |
| **The Quiet Serif** (Vollkorn) | Live DOM text, selectable, indexable | **Wipe** — `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` (shipped, `timeline.ts:989–995`) | Endcard subline; skip note; © line; hero meta line |
| **The Inscription** (Cinzel 700) | Live DOM inside a real `<a href>` | **Ink-in** — plain opacity, `T_FLICK`, after its container arrives | The CTA label only |

**Wipes on fonts, write-ons on lettering.** A `clip-path` wipe across a rendered typeface reads as a
mask; a dash reveal across an authored stroke reads as a pen. Using the wrong one is the most visible
possible tell that the lettering is not drawn.

### 6.2 The write-on, implemented

The scene book requires the captions become authored stroke SVGs with **the same element ids as
today, so every `cap()` call drives them unchanged** (§2). That constraint sets the whole design:
`cap(id, at, hold, fade)` (`timeline.ts:77–82`) keeps its signature and its two `tl.to`s; only the
*property* they drive changes.

```ts
// per caption element, built once at mount
const paths = [...el.querySelectorAll('path')];
const lens  = paths.map(p => p.getTotalLength());
paths.forEach((p, i) => { p.style.strokeDasharray = `${lens[i]}`; });
const w = { p: 0 };
const applyWrite = () => {
  const c = WRITE_STAGGER;                       // 3 — the hero's own concurrency
  for (let i = 0; i < paths.length; i++) {
    const local = clamp((w.p * (paths.length + c - 1) - i) / c, 0, 1);
    paths[i].style.strokeDashoffset = `${lens[i] * (1 - local)}`;
  }
};
// and cap() tweens `w` instead of `opacity`:
tl.to(w, { p: 1, duration: fade, ease: EASE_SCRUB, onUpdate: applyWrite }, at);
tl.to(w, { p: 0, duration: fade, ease: EASE_SCRUB, onUpdate: applyWrite }, at + hold);
```

This is `heroLife.ts:265–275`'s `applyStrokes` verbatim, at caption scale. It is a tween `onUpdate`
writing a pure function of that tween's own progress, so it satisfies L6 and reverses exactly — which
is the whole reason to reuse the mechanism rather than invent one.

**The authoring constraint that falls out of it, and it is binding.** The write-on duration *is*
`cap()`'s `fade` argument, and the rate is ~15 marks/s. Therefore:

> **A caption's authored path count must satisfy `N ≤ round(fade × 15)`** — ≤6 paths at `T_BEAT`,
> ≤4 paths at `T_PUNCH`.

So a "stroke" here is an authored path at **word or word-group scale**, not a pen stroke per letter.
`me3` ("I did.") is two or three paths; `me2` ("You thought I ran away.") is four. This is the number
P6's lettering hand must author to, and it is checkable from the SVG source (§15, A8).

### 6.3 The graphite⇄ink flush — keyed off the curtain, never a parallel tween

`light1` writes on in graphite during Prep and must flush to ink as the curtain drops at t20.55;
`set1` writes on in ink and must flush the other way through S4-B5's tick and back on the exhale. The
scene book is explicit: **a 200 ms per-stroke colour crossfade keyed off the curtain value, never a
parallel tween** (§2, §9 risk 9). A parallel tween is a second clock for the same event and it will
desync the moment anyone scrubs.

Implementation — one more `onUpdate`-free per-frame read, in the same place `--sky` is written
(`Film.tsx:284–287`):

```ts
// one scalar the CSS reads; strokes stagger across it so the whole line finishes with the curtain
const W = T_FLUSH / TICK.curtain;                 // 0.2 / 0.35 = 0.571 — the per-stroke ramp width
// per path i of N: local = clamp((curtain*(1 + W*(N-1)/N... )) → see below
el.style.setProperty('--flush', String(curtain.value));
```

and in the stroke's own style, per path index `i`:

```css
/* stroke i flushes over [i/(N-1) * (1-W), i/(N-1) * (1-W) + W] in curtain-space */
stroke: color-mix(in srgb, var(--ink) calc(100% * var(--k)), var(--graphite));
```

where `--k` is the clamped local ramp. **The curtain is the clock**, so at any parked scrub position
the line's colour is exactly what that curtain value implies, forward or backward, and the flush can
never be mid-way while the curtain is not.

### 6.4 Caption windows — the scrub-domain rules

- **One at a time, ever.** Windows never overlap; ≥0.12 t between consecutive captions edge to edge
  (the `me1–me4` rule, `timeline.ts:302–314`).
- Fades are **linear** (scrub lane). `T_BEAT` default, `T_PUNCH` for the four punchlines.
- Holds are as authored: 0.5–4.0 t. Every window is a pure `tl.to` pair, so backward scrub un-writes.
- **Graphite while `curtain > 0.5`, ink below it** (scene book §2) — via §6.3, not a second tween.
- **The band never crosses the subject.** The `me*` lines seat at 24% instead of the shared 78% band
  because the lower third crosses his tunic at 3.54:1 (`App.tsx:31–34`). This is a per-caption
  authored property, checked at every breakpoint, not a runtime decision.

### 6.5 Live DOM text entering

The endcard's four shipped tweens are kept exactly (`timeline.ts:965–1039`): wordmark opacity 0.3 t
at t65.0 → tagline wipe 0.26 t at 65.23 → subline wipe 0.24 t starting at 60% into the tagline's
(65.386) → CTA fades and scales 0.96→1 as one object at 65.516, label inks `T_FLICK` after. The
overlap is the point: the two lines read as one beat. All scrub-tied; scrolling back un-writes.

**One change at P6:** the tagline moves from `<p>` + wipe to the Hand + write-on, per scene book §5.2.
The subline stays live DOM with the wipe — it must stay selectable and indexable.

### 6.6 The screen-reader document

First in DOM, visually hidden, `canvas` is `aria-hidden="true"`. It is **the film's canonical
transcript, not a summary** — the shipped paragraph (`App.tsx:219–227`) is a prose précis and must be
replaced with: *Skip to joining the Discord* → the twelve captions **verbatim**, in order, with the
scene book §8's eleven scene sentences between them → the endcard tagline and subline → the real
Discord link as a real `<a>`. It never animates and it is never `hidden` — `.sr-only` clips it
(`styles.css:466–476`). **SEO reads this document.**

---

## 7. SCROLL CHOREOGRAPHY

### 7.1 The engine, restated from the code

Lenis on defaults (`App.tsx:91–95`), wired `instance.on('scroll', ScrollTrigger.update)` and ticked
from the GSAP ticker. `lagSmoothing(0)` for everyone including reduced motion. No `scrollerProxy`.
Under reduced motion **Lenis is never instantiated** and native scroll drives the identical scrub.

The drive is one `ScrollTrigger` on `#track` reporting raw progress, `gearing()` shaping it, and
**one persistent tween** re-pointed per update (`timeline.ts:1063–1085`):

```ts
scrub.vars.t = gearing(self.progress);
scrub.invalidate().restart();     // supersedes the in-flight glide; allocates nothing
```

`duration: SCRUB` (0.8), `ease: 'expo'`, `onUpdate: () => { tl.time(max(0, playhead.t)); preScrub.fn?.(playhead.t) }`.

### 7.2 What one gesture is worth

`#track` is a flat `1800vh`; scroll range is `17 × vh`. At a 900 px viewport that is 15 300 px, and a
100 px wheel notch is `0.00654` of progress. Through `gearing()` that is, per stage:

| Stage | share | span (t) | **t per 100 px notch** |
|---|---|---|---|
| The Cover | 0.035 | 2.31 | 0.43 |
| S1 The Claim | 0.105 | 10.2 | **0.64** — the loosest; the blackout is geared tight so impatience is rewarded with story |
| S2 The Address | 0.12 | 6.3 | 0.34 |
| S3 Proof of Light | 0.16 | 10.0 | 0.41 |
| S4 Proof of Scenery | 0.12 | 9.5 | 0.52 |
| S5 Proof of Time | 0.20 | 14.0 | 0.46 |
| S6 The Many Jobs | 0.08 | 7.5 | **0.61** — the montage, deliberately quick |
| S7 The Handover | 0.12 | 7.0 | 0.38 |
| S8 The Table | 0.06 | 1.5 | **0.16** — the endcard gets the most runway per pixel on the site |

Portrait/touch: `~950vh` via media query, range `8.5 × vh`. Ten confident flicks cross the film, so
**one flick ≈ 6.6 t** and no flick can cross a whole stage except S6 (7.5 t) — which is the one stage
designed to be flicked, and the one stage with no rest anchors.

### 7.3 Tick, flick, fling, parked

| Gesture | What the visitor does | What the film does |
|---|---|---|
| **Tick** | One notch | The scrub tween re-points and closes ~0.4 t over 0.8 s expo. Because expo front-loads, ~63% of it lands in the first ~0.25 s: the response is immediate, the settle is soft |
| **Flick** | A fast swipe or several notches inside 0.8 s | Each update **re-points the same tween and restarts it**. There is no queue and no accumulation: the playhead always eases toward the *latest* target from wherever it currently is. A four-notch flick is one continuous 0.8 s glide, not four |
| **Fling** | Momentum carries hundreds of pixels | Identical mechanism at a larger delta. `tl.time(x)` renders the timeline *through* everything between the last time and `x`, so no `tl.set` is ever skipped, however large the jump — sets are positional, not sampled |
| **Parked scrub** | The thumb stops mid-beat | The tween completes and stops writing. The frame that remains is a **held frame** and L8 makes it a shippable one. `world.t`/`gobT` keep running, so a parked frame still breathes: the banked idles are what make a parked graphite frame alive instead of dead (§10.4) |
| **Faster than the film can settle** | Sustained fast scroll | The playhead runs perpetually ~0.3–0.8 t behind the scroll target and never catches up until the visitor stops. **This is correct and it is the mass.** Nothing degrades: there is no per-frame state to skip, no callback to miss, and `lagSmoothing(0)` guarantees no post-hitch catch-up jump |

### 7.4 Reverse

Reverse is not a mode. It is the same mechanism with a decreasing target, and everything in §1's L5–L7
exists to make it identical. The film's best moments are authored *for* it: the ravens un-scatter, the
wizard un-fires, the die un-paints, the map stands back up. **The film is as long backwards as
forwards and it is a different film.**

### 7.5 Rest anchors — seventeen, and what they power

`open2 · me1 · me2 · me3 · me4 · lantern · mushroom-stop · world-return · set1 · mountain-reveal ·
nat-1 · look-at-us · the-20 · welcome · tended-cairn · between-pitches · endcard`
(scene book §2). **S6 has none, by design** — `PgDn` jumps it. **No anchor lands mid-void:** the
S3-B1 travel-line window (t16.5–17.0) is deliberately anchor-free.

They power four things:

1. **Touch soft rests.** Momentum death detected over `T_REST_DETECT` (0.15 s); if the playhead is
   within ±0.35 t of an anchor, ease to it over `T_REST` (0.22 s) via `lenis.scrollTo(gearingInverse(anchor) × max)`.
   **Cancelled by any input, off on desktop, off under reduced motion.** This is what stops the four
   `me*` lines sitting half-written on a phone.
2. **Keyboard stepping** (`↓/↑`), `T_STEP` `power2.out`.
3. **Reload restore** (§12.3).
4. **Reduced-motion stepping** and PRM play mode.

### 7.6 Play mode

Play drives the same scrub at a true **1 t/s** by advancing film time and mapping back through
`gearingInverse` (`App.tsx:123–137`), so speed is constant in `t` across a piecewise scroll map. The
grammar, all shipped:

- Accumulates `t` in a local, **never** re-derived from `window.scrollY` (integer round-trip loses
  ~8% of pace per frame — `App.tsx:114–118`).
- `dt` clamped to 0.1 (`:127`).
- **Any deliberate input yields instantly** (`:142–151`).
- **`visibilitychange` pauses** (`:146–148`). Both the clamp and the listener stay: belt and braces.
- Never loops. Ends at `'ended'`, focus moves to the CTA with `preventScroll`.
- Reduced motion: steps anchor to anchor, still on the 66 s total pacing (§13.4).

### 7.7 Ends

Native rubber-band at the top. Hard stop at the endcard; nothing renders below it. Reload behaviour is
§12.3, and the shipped `scrollRestoration = 'manual'` + `scrollTo(0,0)` (`App.tsx:75–78`) is in
tension with the scene book's "resume at the nearest rest anchor" — named in §16, D-2.

---

## 8. CAMERA MOTION

### 8.1 The vocabulary — eight move classes, all shipped, none new

| Class | Recipe | Ease | Duration | Uses |
|---|---|---|---|---|
| **Cut** | `cut(at, pos, look)` — a `tl.set` pair on `camera.position` and `world.look` (`timeline.ts:103–106`) | — | 0 | Nine page turns; the intra-stage setups at 7.5, 9.5, 16.5, 38, the six montage cuts, 57.5, 58.0/58.3 |
| **Rail (travelling follow)** | `cam()` with the beat's own window as duration (`timeline.ts:447–448` runs it at `c2Window` = 1.857 t per stop) | `SETTLE.move` | = the beat | S3's whole run, S4-B1/B2, S5-B1, S6's 0.09 drift |
| **Push-in** | `cam()`, straight line, position and look on the same duration | `SETTLE.move` | 1.15–2.0 t | Exactly two: S2 12.5→13.7, S5 42.4→44.4 |
| **Dolly-back** | `cam()`, straight line, opening the frame | `SETTLE.move` | 1.5–2.5 t | S5-B3 (40.75→42.2), S5-B7 (46.5→49) |
| **Rise** | `cam()`, axis-locked vertical | `SETTLE.move` | 3.5 t then 2.5 t | S7 only (58.5, 62). `T_CAM_MAX` 2.5 is the band; **3.5 is the one authored outlier and it is reserved for this move** |
| **Drift** | `cam()` at 9% of the cut-to-focus vector | `power1.out` | 1.15 t | The six montage cuts (`timeline.ts:785–792`) and S4-B5's flicker — its **only** camera move |
| **Tilt** | `cam()` moving `world.look` while position holds | `SETTLE.move` | ≤1 t | S6-B7 only |
| **Breath** | Per-frame scale of the position vector about the look target | — | `HERO_DOLLY` / `BOARD_BREATH` | Cover and endcard board only. **Never changes framing intent** |

`sky()` and `skyCut()` grade the fog colour (`timeline.ts:115–122`) — camera-adjacent, not moves.

**No FOV tweens. Zero exist and none may be added.** The lens is owned entirely by `framing.ts`:
`fitFov` holds the composed horizontal field, clamped 42°–70°, and `fitPullback` steps the camera back
along its own axis once the clamp bites, capped at `MAX_PULLBACK 2.2`. Both are **resize-driven only**
and applied per frame idempotently by comparing authored vs applied positions (`Film.tsx:201–206`) —
the trick that stops the pull-back compounding while a tween is not writing.

### 8.2 Cut versus move

A cut is spent only where the catalog licenses it. The test that decides:

> **A cut may only land on a frame the audience has not been in.** A hard cut is the one moment a set
> can appear for free (`timeline.ts:157–159`, written the day the theatre popped in mid-shot).

Everything else moves. Corollaries:

- A cut back to a frame we just left is a **held** frame (S7-B1's 0.8 t on the S1 rim angle), and it
  must earn the hold with new content — there, the tended dressing.
- Two cuts inside 0.5 t is a flicker, not a montage. The six page turns sit 1.25 t apart.
- **A cut and a move never share a mark** except the montage's authored `at + 0.04` drift, which is
  what turns six locked-off frames into a montage rather than a slideshow (`timeline.ts:780–784`).

### 8.3 The camera during a freeze — L10, stated as staging

The tick stops `world.timeScale`; the camera is on the master timeline and is **not** affected. Every
freeze in the film has camera motion inside it, and that is the grammar:

| Freeze | Camera inside it |
|---|---|
| t12.5 (S2) | The push-in to the address close, 12.5→13.7 |
| t33.1 (S4-B5) | The shipped 0.09 drift, 33.15→34.1. **One move only** — no push-in, no insert, no new setup |
| t40.6 (S5) | The dolly back 40.75→42.2 opening the flagship framing; then the single push 42.4→44.4; then the pull 46.5→49 |

The rule for authoring inside a freeze: **one move, one direction, no cut.** The freeze's whole
argument is that the visitor can look around a stopped world; a cut inside one takes that back.

### 8.4 At a stage join

Stage boundaries are **gear changes, not cuts** (scene book §4). The playhead is continuous across
them; only `dt/dscroll` changes. A `cam()` that straddles a boundary is legal and renders identically —
the tween knows nothing about gearing.

Two boundaries do spend a transition (t50 and t57.5, both page turns). The rest — 10.2, 16.5, 26.5, 36,
64.5 — are crossed inside a continuing shot, and the scene book specifies the exact handoff state for
each. The two that matter for camera:

- **t26.5**: `[24.5, 5.2, 6.2] → [30.5, 1.0, 0]`, ≈26°, mid-rail. The rail simply continues.
- **t36**: the walk-through begins mid-run. No cut; the flat's braced back wipes frame and an exposure
  crossfade opens on the tavern.

### 8.5 The seven rules that keep 48 beats from being a rollercoaster

1. **One move per beat.** If a beat needs two, it is two beats or it is one move with a longer duration.
2. **Straight lines only.** Every `cam()` is a two-point tween on position plus a two-point tween on
   `world.look`; the path is a straight segment. No arcs, no spirals, no orbits, no free camera.
3. **No roll, anywhere in the film.** Not "≤8°" in practice — zero. The vestibular contract (scene
   book §8) says so and there is no authored `rotation.z` on the camera.
4. **Angular velocity ≤25°/s at play pace.** Check it from `world.look`'s travel over the tween's
   duration at the shot distance — a rail that swings the look target 40° in 1 t fails.
5. **The bench clamp: elevation 20°–75° in every shot.** Straight-down is legal only where the
   frame's content is the finished map — S7 from t62, and S8 (scene book §0, amendment 3).
6. **The sheet edge is in every travelling wide.** An island's cut edge low in frame is the only thing
   that tells the eye the camera is moving *over a page* rather than floating. It is composition doing
   a motion job, and it costs nothing.
7. **Stillness is a move.** S7-B1 holds dead still after six montage cuts; S5-B4 holds dead still
   because the framing *is* the flagship. Both are authored decisions with the same weight as a rise.

---

## 9. PARALLAX AND DEPTH RESPONSE

### 9.1 What parallaxes

**Exactly one pointer parallax exists on the site: the Cover's** (§4.2), ±2.2° yaw / ±1.2° pitch,
damped `PAR_TAU`, off on touch and under reduced motion.

**In the film there is no pointer parallax and there are no parallax layers.** What the visitor reads
as parallax is real: the camera physically translates through a 3D world, so planes separate by
geometry. S1-B2's field names it "real-plane parallax as the scrub eases", and that is a description of
perspective, not of a technique. The consequence is that parallax strength is not a tunable — it is
the shot's distance and the set's depth, and it is authored in the camera solve.

### 9.2 Where parallax is banned, and why

| Surface | Ban | Reason |
|---|---|---|
| **The margin, ticks, ruler, numeral** | No offset, ever | They are **the sheet the world is drawn on.** A sheet that parallaxes against its own drawing stops being the sheet and becomes a HUD |
| **The captions** | No offset, no depth, no 3D transform | Same, plus they must hold ≥4.5:1 against a band whose position is authored per caption |
| **The paper void** | Nothing to parallax | The void has no depth. It is the page. Giving it a layer would answer the film's central question with the wrong answer |
| **The endcard stack** | No offset, no rotation, no drift | Direction C: "no box, nothing extra". The board is locked top-down and the type sits on it |
| **The board at rest** | `BOARD_BREATH` only — ≤0.5% zoom, 12 s | It "does not pan, does not zoom, and accepts no pointer events" (scene book §5.1). The breath is a sign of life, not a response |
| **The `#blackout` overlay** | Opacity only | It is the house lights |
| **Any 2D layer over the canvas** | There are none, and there will be none | One post pass is the budget (`experience §10`); a parallax layer is a second compositing surface with its own tone |

### 9.3 Depth is a material property, not a lens effect

**There is no DOF pass in this film and none may be added** (scene book §0, amendment 4). Depth is
expressed three ways, all in-material (`trilayer.ts`):

1. **Performance — fog-to-paper.** `triFade = smoothstep(uTriNear, uTriFar, dist)`; the lit result
   ramps toward `PAPER`, **never grey** (`:306`). In-material, so an island on a bare page needs no
   scene fog.
2. **Prep — line-weight falloff.** `triStroke * (1 - triFade * 0.75)` (`:369–370`): far strokes go
   fainter with more paper show-through, which is exactly how a pencil renders aerial perspective.
3. **Foreground occluders.** Nearer than `rig.silhouetteNear` (2.5) the drawing gives way to a
   near-black shape (`:383–385`) — *a shape in front of the drawing, not a drawing*.

**The ramp is set per shot, not per stage.** The hero's own rule is the one to generalise:
`depthNear = d × DEPTH_SHOT.near (0.95)`, `depthFar = d × DEPTH_SHOT.far (2.4)`, where `d` is the
solved shot distance (`Hero.tsx:131–132`). Wire it once in the frame loop from
`camera.position.distanceTo(world.look)` and every shot in the film inherits a correct depth read for
free, including the ones a visitor is scrubbing through.

**The two tightening moments, and there are exactly two:**

| Beat | Move | Recipe |
|---|---|---|
| **S5-B6, the die macro** (t43.7–44.5) | Separation from the graphite room without a DOF pass | `rig.depthNear`/`depthFar` multipliers ramp `DEPTH_SHOT → DEPTH_TIGHT` over `DEPTH_TIGHT.dur` (0.6 t), settle lane, released over the same |
| **S7-B3, the rise** (t59.4–60) | The scale flip that pre-loads "this is a map" | Same pair, same duration, in and out inside one breath |

Both are scrub-safe uniform pairs on the master timeline; both are symmetric and reverse exactly.
**Anything longer than one breath turns a story beat into a lens toy** — the ramp is not a look, it is
a sentence.

---

## 10. OBJECT TRANSFORMS AND THE PUPPET

### 10.1 His motion identity, as a spec an engineer implements

> **"Fast in, one overshoot, dead stop." A stagehand's economy: nothing he does is for the audience.**

| Rule | Number | Enforcement |
|---|---|---|
| **Attack** | 90–140 ms, `power3.in` | Authored per action |
| **Settle** | 450–700 ms, `power2.out` | `T_GESTURE` (0.5) is the median; `settle()`'s default (`actions.ts:274`) |
| **Overshoot** | Head mass only, ≤4%. Ears +80 ms at 1.3× | Never on the root, never on a prop the camera is on |
| **Anticipation** | A `weightShift` or crouch-load 0.12–0.18 t **before** any limb moves | And **none at all** on nudge, scritch, tap — competence does not telegraph the easy ones |
| **The one exception** | The d20 throw: crouch 0.30, anticipation 0.28 s / core 0.14 s / settle 0.32 s | It lands *because* it is the only one |
| **Chain order** | pelvis → chest → neck → head → **ears last** | Exception: when he is working, the **pencil hand leads and the body follows** |
| **The freeze** | Motion stops in **≤0.10 t, no ease-out**. Only eyes, ears and breath continue | This is his fingerprint. Everyone else in fiction eases out |
| **Recovery** | Back to the working stoop within 0.8 t | He is interruptible, not distractible |
| **Never** | Holds symmetry · moves everything at once · eases in-out evenly | The third one is the tell that a figure is tween software |

**Scrub safety, non-negotiable (goblin §11.1).** Every channel is an authored GSAP key on a transform.
`hemFlick` is driven by **authored action keys**, not by root velocity and not by a spring — both the
velocity-drag and the spring proposals are rejected by name. Zero per-frame allocation, zero material
swaps, zero geometry morphs.

### 10.2 The rig and its per-frame surface

The only per-frame work on the puppet is `applyGait` (`actions.ts:31–51`), which writes **only** into
`swing`/`bob` groups at amplitude scaled by `speed`. At `speed 0` every gait term is exactly 0 and the
authored pose owns him — released, not overridden. `puppet.check.ts` asserts the two channel sets never
overlap.

Breath rides the **gait clock** (`gobT`), so a freeze never stops it, and it fades in as the gait fades
out (`actions.ts:47–50`). That single line is why "That was me." is not delivered by a statue.

Three group additions (goblin §9), all authored-key driven: `hemFlick` (hem rear pivot), `pupils`
(±0.006 u), `hood` (cowl ±0.02 y, driven by the brow channel).

**One constant change with a mandatory downstream pass:** `EAR_Z` 1.3 becomes `EAR_Z_R = 0.55` /
`EAR_Z_L = 0.85`, exported from one module and imported by both `world.ts` and `actions.ts` (gate G8 —
`actions.ts:326–333` already carries the import and the warning). `express()` writes ear rotation
**absolutely** (`:347–348`), so **all six `EXPRESSIONS` entries land their `ear` delta on unequal bases
and need a retune pass.** It is booked, it is not free, and `alarm` carrying the right blade past
vertical is accepted and funnier.

### 10.3 The prop transform vocabulary

| Verb | Recipe | Lane | Reverses |
|---|---|---|---|
| **Pop-in** | `scale 0.9 → 1`, `PUPPET.pop` (`back.out`). **Never 0 → 1 on a large prop** — an overshoot from nothing reads as a balloon | Puppet | Trivially |
| **Drop** | `position.y -= h`, `PUPPET.drop`. **One authored use** (the tavern sign) — S6-B3 is where it is spent | Puppet | Verify at flick speed: a bounce run backwards inside a 1.25 t window is a named QA case |
| **Swing / hinge** | `rotation` to an authored angle, settle lane (the cave door's `y: −1.9`) | Settle | Trivially |
| **Segmented arc** | Two or three position tweens, `power2.out` then `power2.in`, with chest/pelvis/ear follow-through | Puppet | **This is the film's jump grammar** — S1's leap (`timeline.ts:257–265`), the S5 hop, the S7 throw. Author the arc symmetric and it reverses with no recipe |
| **Yoyo micro-loop** | `yoyo: true, repeat: n`, `PUPPET.organic` (`sine.inOut`) — the rope's 12 cycles, the tap's elbow, the wave's wrist | Puppet | Yes, but **`repeat` must be finite and even-ended** so the resting value is the authored one |
| **Scale-out** | `scale → 0`, `SETTLE.exit` | Settle | Yes. **Everything leaves frame by growth or by tween, never by despawn** (scene book §3-S7-B7) |
| **Visibility** | `onlyFor()` triads only (`timeline.ts:139–149`) | — | By construction — `tl.set` un-sets itself |
| **The flatten** | `uTriFlat 0→1` + `scale.y → 0.02` + a rotation settle, `power2.in`, per merged group, offset by `FLATTEN` | Scrub/Settle | **The whole design.** Nothing is created or destroyed; the same tween runs backwards |

### 10.4 The banked-idle system — the one genuinely new mechanism

The requirement (scene book §4-4, §9 risk 8): each revealed prop's idle **begins as the reveal shell
completes, rides `gobT`, and has its amplitude gated on the shell's scale so it dies smoothly on
reverse. Nothing may boolean-flip on "revealed."**

Three constraints make the implementation almost write itself:

1. It must ride `gobT`, because `world.t` is stopped for whole stages (t12.5–30 and t40.6–47) and a
   fire he lit at t18.35 must flicker inside the freeze.
2. It must be a pure function with no state (L5).
3. Its gate must already be scrub-tied and reversible.

**`reveal()` already provides that gate.** It grows `object.userData.maskShell.scale` from 0 to 1 as a
plain property tween (`curtain.ts:120–132`, shell cached at `:183`). That scalar is exactly the reveal
progress, it is on the master timeline, and it reverses for free. So:

```ts
// per banked prop, in the frame loop — one lookup, one multiply, zero allocation
const a = (prop.userData.maskShell as THREE.Group | undefined)?.scale.x ?? 0;   // 0..1, scrub-tied
const amp = a * prmAmbient();                                                   // PRM stills it
flame.scale.setScalar(1 + FLICKER.scaleAmp * amp * Math.sin(gobT * FLICKER.scaleRate + phase));
```

No boolean, no `revealed` flag, no callback, no `if`. Scrub back and the amplitude decays to zero
exactly as the colour does — **the life leaves with the paint, which is the film's own rule.**

The nine banked idles, from the scene book: fire2 (flicker + embers, from 18.35) · lamppost (flame
breath, 20.207) · cave door (settle-creak, 22.064) · chest (none — a lid at rest) · mushrooms (none) ·
signpost (none) · the die (none — *dead still*, the held-breath rock stays rejected) · the three
candles (per-candle flicker + glow sway, 56.4/56.6/56.8). Plus the montage's transform-gated idles,
which use the same pattern against their own scrub-tied set-down progress: the map sheet's one paper
flutter, the monster's ±1% breath, the sign's decaying 3-swing pendulum, the last sapling's leaf sway.
**The NPC miniature never idles** — its stillness among five idling vignettes is the product rhyme, on
purpose.

### 10.5 The practicals — and a defect the ledger implies

The scene book funds a three-slot practicals array replacing `rigs.ts:131`'s single fixed
`PointLight`, each slot carrying `{ position, intensity, phase }`, all scaled by `(1 − curtain)`
because *a drawn fire emits nothing*.

**That scalar is wrong for S3 and it will show.** `rigs.ts:143` scales the glow by `(1 − c)` where `c`
is the **global** curtain. During S3 the curtain is 1 from t12.5 to t20.55 — so the campfire he lights
at t18.35, which S3-B2 says is *"the frame's only light"*, would emit nothing for 2.2 t and then jump
to full in one frame at the t20.55 switchover.

The rule the film actually wants is one word different: **a practical emits if and only if the prop it
belongs to is painted.** Which is `max(1 − curtain, thatMaterial.alive.value)`:

```ts
// per slot; `alive` is the owning material's userData.alive object, held BY IDENTITY (the rig.curtain pattern)
p.light.intensity = p.base * flicker(t, ambient, p.phase).glow * Math.max(1 - c, p.alive.value);
```

Painted page → full. Frozen page, untouched source → 0. Frozen page, a source **he lit** → full. One
`max`, no booleans, and it makes "three embers of motion in one frame" literally true. Filed as D-1.

### 10.6 The action library — what exists and what must be authored

Existing in `actions.ts`: `applyGait` · `reachSolve`/`reach` · `armRest` · `crouchPose`/`crouch` ·
`crouchChest` · `plantFor` · `cameraSideArm` · `stanceOf` · `weightShift` · `settle` · `look` ·
`express` (six poses) · `peek` · `bolt` · `stoop` · `lift` · `tap` · `haul` · `shrug` · `wave` ·
`nudge` · `dustOff` · `straighten`.

To author, **eight verbs across the two binding docs** (goblin §10 names four; the scene book mandates
four more; the goblin doc's own "five to author" count does not match its four bold entries — D-5):

| Verb | Owner | Signature intent |
|---|---|---|
| `freeze()` | goblin §10 | All swing channels → 0 in ≤0.10 t, no ease-out; 250 ms of nothing but a blink; then `look()` to lens, `alarm` melting to `sly` over 0.6 t, **ears arrive last** |
| `scribe()` | goblin §10 | `stoop()` + `wrist.z` ±0.4 rad at 2.2 Hz, head tracking the tip 90 ms late, right ear ticking at each stroke end. **The hero's rest pose is this action paused** |
| `pocket()` | goblin §10 | One reach into the front-right skirt, `WORKING_SIDE`, wrist supinating on the way out so the die shows. 0.35 in / 0.25 out |
| `throw()` | goblin §10 | The film's one authored anticipation; release at 55°; both ears trail; `pupils` track the die; **then he watches it** |
| `hop()` | scene book S5-B4/B7 | Onto and off the bench. Segmented-arc grammar (§10.3); **author the arc symmetric and the reverse is a hop-down for free** |
| `hang()` | scene book S6-B3 | Guide the drop in from under it, `express('strain')`, then `tap` it level twice |
| `plantAndPat()` | scene book S6-B4 | Set the root ball, pat the soil once, move a pace along the row. ×3 at a quick clip |
| `touchUp()` | scene book S6-B1 | One brush stroke; the paint side arrives along the bristle line. **Used exactly once in the film** |

All eight take caller-supplied `(tl, g, at, dur, …)` and write only into timeline-owned channels, the
same contract every existing verb honours.

### 10.7 Named object motions with their own rules

- **The die.** Authored tumble, `SETTLE.heavy` settle, landing **exactly** on the 1-face because the
  camera is about to read it (`timeline.ts:626–628`). **Dead still through the freeze** — `dieWobble`
  stays 0; any rock after the settle read as the die landing twice. The nudge is 4-frame anticipation,
  weighted tip-over, and the endcard send-off roll is 0.9 s `power3.out`.
- **The theatre disc.** `+= π` over 2.5 t `power2.inOut`, **through the locked `DISC_SMOOTH` 0.35 s
  input smoothing**, so it has inertia against the thumb. **Turn direction always matches scroll
  direction.** Its machinery's boom rotation is slaved to the same tween target, so it works whenever
  the disc works.
- **The flatten.** Twelve groups; `offset = (originX − 128)/42 × 0.9`; each runs 1.1 t of `uTriFlat`
  0→1 + `scale.y → 0.02` + a rotation settle, `power2.in`; the nearest starts at t60.00, the farthest
  at t60.90, all complete by t62.00. **Driven from one timeline position with no callbacks.**
- **The cliff flattens last** and he rides it down in the final half-beat. He touches nothing: this is
  the one change he does not make by hand, because it is not a change — it is the file being closed.

---

## 11. TRANSITIONS — the catalog, its costs, its reverses

Seven. **No eighth is invented.** Every recipe is pure tweens and paired `tl.set`s; **no callbacks
anywhere, because callbacks do not reverse.**

### 11.1 House lights — Cover → S1, spent once

**Recipe.** The first scroll, `play` or `Space` dims the page to black over the 0.6 s-equivalent slice
of the handoff (`HANDOFF.lights = 0.73` of `HERO_T`); the paper margin stays at 4% ink so the sheet
never fully disappears. Phase B also recedes the graphite island 6% and kills the lantern's ember-dot
at 97% (`heroLife.ts:547–568`). **The visitor caused it.**
**Reverse.** Runs backwards to paper; the frontier re-ignites lantern-first **by geometry** — the
lantern sits nearest the painted rim, so the returning seam reaches it first. No reverse recipe exists
because none is needed.
**Cost.** One DOM opacity tween, one `rig.seamX` tween, one `state.recede` scalar.
**Reduced motion.** Three crossfade steps: settled → graphite still → black (`heroLife.ts:503–515`).

### 11.2 The tick — every freeze · t12.5, t33.1, t40.6

**Recipe, verbatim, three lines on one cue** (`curtain.ts:196–202`):
`world.timeScale → 0` in **≤0.15 t, `EASE_SCRUB`** · `curtain.value → 1` in 0.35 t `SETTLE.arrive` ·
**the margin breathes to full over `T_BEAT` at +0.1 t.** Instant, never eased, never announced.
Nothing else may key off it.
**Reverse.** The same three, mirrored.
**Cost.** Zero. No assets created or destroyed, no bakes.
**Reduced motion.** Already a cut; unchanged, and it is the house style.
**Held-frame note.** The 0.35 t curtain ramp is the film's most-parked partial state. Every value in
it is a shippable frame (L8) and it is the first thing the QA walk holds (§15).

### 11.3 The exhale — every unfreeze · t30.0, t34.3, t47.0

**Recipe.** `world.timeScale → 1` over `T_EXHALE` + the colour flood on the same cue + the margin
un-breathes. **The world resumes MID-gesture; the freeze never restarted anyone.**
The flood differs by site, and each has a **named visible payload**:

| t | Flood | Payload |
|---|---|---|
| **30.0** | The frontier release: `seamX` 13.0 → 34.0 over 0.3 t `power2.out`, then retired to `1e6` at 30.34 (paired at 30.32) | The last graphite leaving the ribbon; the ribbon's ambient starting mid-gesture |
| **34.3** | `curtain → 0` + `snapBack` | The machinery going dark again as the paint returns |
| **47.0** | `curtain → 0` + `snapBack` (`SETTLE.snap` — the punchline reserve) | The cheer completing, the spill-drop landing, the mug rings closing under paint |

**Reverse.** Mirrored tweens. **One-shots may never ride the world clock** — the spill-drop's fall is a
0.2 t timeline tween precisely so it re-hangs on scrub-back.
**Cost.** Two or three tweens.
**Reduced motion.** An instant cut to the resumed state.

### 11.4 The touch reveal — Prep, on his contact · nine uses

**Recipe, and it is the only legal construction.** On `actionAt`:
**(a)** a paired `tl.set` flips the prop's per-material `alive` uniform 0 → 1 — **a step, never a
ramp**, because colour law 2 bans half-tinted objects; and
**(b)** `reveal()` grows the prop's **mask shell** — a mask-only copy of the prop's own solids
(`curtain.ts:143–185`) — from scale 0 over 0.35 s `SETTLE.arrive`, or 0.6–0.9 s for the lantern, the
candles and the die.
**The shell is the only thing the audience sees**; the flip is what makes the pixels under it colour.
The shell takes the prop's own shape and can never reach a neighbour — the radial version was deleted
for being the airbrushed colour disc the colour script bans by name (`curtain.ts:103–118`), **and it
is not coming back.**

**The nine, by mark.** fire2 18.35 · lamppost 20.207 · cave+door 22.064 · chest 23.921 · mushrooms
27.635 · signpost 29.492 · the die 43.75 · candles ×3 at 56.4 / 56.6 / 56.8. (Nine named uses, ten
`alive` steps — the candles carry three, each on its own mark and its own material.)
**Banked life** begins as the shell completes and rides `gobT`, amplitude gated on the shell scale
(§10.4). **Nothing boolean-flips on "revealed."**
**Reverse.** The shell shrinks to the contact point, the idle fades with it, the set un-sets.
**Cost.** One shell built once and cached; one tween; one `tl.set` pair.
**Reduced motion.** A **step to the revealed state** — `A = 0` is still at the lit pose, never a slowed
bloom.

### 11.5 The page turn — one frame of paper, never black · nine uses

**Recipe.** A camera `cut()` under a single frame of paper, plus paired goblin relocate `tl.set`s. Both
sets stay resident; nothing is created or destroyed.
**The nine.** S1 t7.5 · S1 t9.5 · S5→S6 t50 · S6 t51.25, 52.5, 53.75, 55, 56.25 · S6→S7 t57.5.
**The pairing rule, and it is the invisible-bug one.** Each relocate cluster (`position`, `rotation.y`,
`speed`, `express`) sits at one position; **its inverse — restoring the pose the previous beat left —
sits exactly `PAIR_GAP` earlier.** Same target at two positions `0.025 t` apart clears
`clocks.check.ts:70` with float headroom (L7). A drifted pair is invisible until someone scrubs
backwards through the montage.
**Reverse.** Replays gracefully — paper, never black.
**Cost.** One `cut()` + one cluster + its inverse. Zero allocation.
**Reduced motion.** A plain cut with no flash frame.

### 11.6 The walk-through — S4 → S5, its only use

**Recipe.** The camera follows him behind the mountain flat; its braced graphite back wipes frame as a
near-black silhouette plane (Prep's `silhouetteNear` language, free). **Darkness t ≈ 37.2–37.9**, held
at `caveDark` lifted one value step (≈`#4E4133`) — **never true black**; the film's only true black is
the `#blackout` overlay at t0–5.5. The margin breathes in `paper` at 55%, measured ≥3.5:1. An exposure
crossfade t ≈ 37.8–38.1 opens on the tavern establish, and **the set swap happens entirely inside the
crossfade** via the shipped `onlyFor` triads (theatre out at 38, tavern in at 38).
**Reverse.** The crossfade mirrors; the triads un-set themselves.
**Cost.** One opacity/grade pair (`tl.set`s ≥ `PAIR_GAP` apart) plus the shipped triads.
**Reduced motion.** Two stills separated by one dark held frame — no travelling darkness.
**Three named QA cases.** A parked scrub mid-darkness must be a composed frame · the set swap must hide
completely in **both** directions · the S5 establish must be fully composed on the emergence frame.

### 11.7 The morph — S7 → S8, its only use

**Recipe.** The d20's 20-face fills frame edge to edge by t64.5; the board group's materials fade up
beneath it (already resident, `onlyFor(board, 62)`) over 0.6 t with `BOARD_WASH` settling at 0.5; the
die settles with one 0.15 bounce and exits 64.85–65 (`timeline.ts:916–946`). **No cut — the promise of
the whole film kept.**
**Reverse.** The fades reverse and the die re-enters: the one irreversible-*feeling* move that still
scrubs backward.
**Cost.** Zero allocation — the traversal collects materials once at build.
**Reduced motion.** A crossfade at the same times.

### 11.8 Not transitions — named so nobody re-classifies them

**Gear changes** (10.2, 16.5, 26.5, 36, 64.5) · **the void hop** (t16.5–17.0: one constant-offset tween
moving goblin, camera and look together inside an anchorless window where only paper, the line, him and
his shadow are in frame) · **intra-stage camera cuts** (S1's setups, S7's `cut(58.3)`) · **sky tweens**
· **the frontier** (S3's `seamX` move is a world event inside one beat).

---

## 12. LOADING SEQUENCES

**Loading is the drawing drawing itself. No spinner exists anywhere on this site.** (L12.)

### 12.1 First load, cold

Shipped and asserted (`heroLife.ts:43–52`, `ENTRANCE`):

| t (s from first paint) | Beat |
|---|---|
| 0–0.25 | Paper `#F7F5F0` + tooth + margins. CSS/inline, zero network, **zero layout shift, ever** |
| 0.25–0.45 | Grid ghost fades in under the island footprint; margin ticks draw on, staggered 0.05 |
| 0.45–1.65 | **~78 graphite strokes write the island on**, three-stroke stagger, ground → trunks → canopies by height. **This phase is the progress bar** |
| 1.65–2.00 | **The lantern ignites — before the paint.** Glass warms `#F2E2B4` (0.1 s) → `#F4CC70` (0.18 s); the light pool rises. *Light leads*, exactly as it does in the film |
| 1.75–2.55 | **The paint bloom** — `rig.seamX` runs `BLANK_X (−3.4) → SEAM_X`, `SETTLE.arrive`; shadows arrive with colour; the goblin lands on the bloom's leading edge (crossing time solved analytically at `heroLife.ts:301–304`) |
| 2.4–3.2 | Type settles: wordmark writes on 0.48, tagline overlaps at −0.12 lead, meta fades, affordances rise `UI_RISE_MAX_PX` |
| ≤3.2 | **Settled** — asserted, not aspired. Idle throttles to 30 fps after 12 s |

**Any input at any moment jump-cuts to the settled frame** (`heroLife.ts:460–469`), and the jump runs
**events-on**: `progress(1)` with events suppressed also suppressed the stroke tween's `onUpdate` and
left the underdrawing at `instanceCount 0`. `done` is set *first* so the crawl and gate calls stand
down instead of aborting the very jump that completes the entrance.

### 12.2 Warm load, and the returner

`localStorage 'gg.seen'`, try/catch-guarded. Returners run the whole entrance at `RETURNER_PACE` 0.6×
and additionally get the bottom-right *been here? skip to the table ↓*, which rides
`gearingInverse(64.5) × scrollMax` through App's Lenis over `T_SKIP` (`heroLife.ts:814–817`,
`Hero.tsx:244–250`). Storage being unavailable is a cold path, not an error.

### 12.3 Reload mid-film

The scene book requires **resume at the nearest rest anchor, never a raw offset**, so every restored
frame is a composed one; and the app must force **one full scrub-render before unveiling**, behind the
Cover, which retires the stale-first-frame gotcha. The shipped code instead always restarts
(`App.tsx:75–78`) — a deliberate v1 choice, now in conflict (D-2).

**Proposed resolution, satisfying both intents:** a cold visitor (no `gg.seen`) restarts, because a
first-timer who reloads wants the film. A visitor with a live `sessionStorage 'gg.t'` resumes at
`argmin |anchor − t|` over the seventeen anchors. One `sessionStorage` write per second while
scrolling, one read on mount, both try/catch-guarded. The forced pre-render is unconditional: the
drive already does it (`timeline.ts:1086–1088` seeds `playhead.t` from `st.progress` and calls
`apply()` before first paint) — keep that and never regress it.

### 12.4 The stalled path

Elastic, in-world, and shipped. At 85% of the stroke phase, a not-ready page slows the hand to a crawl
(`timeScale × 0.18`); at 100% the pencil rests at the gate, capped at `ENTRANCE.strokes.max` (4 s) of
total stroke time. Past `stallNoteAfter` (3 s) of true stall, the margin pencils **`sharpening
pencils…`** and nothing else changes.

Two hard-won details that must not be refactored away:

- **The gate pauses at most once** (`heroLife.ts:391–404`). A callback that seeks its own timeline
  aborts a `progress(1)` mid-flight.
- **The resume is deferred one ticker tick, parked.** `lagSmoothing(0)` means the first tick after a
  stall carries the whole accumulated delta; resumed synchronously against a stale ticker time, that
  delta teleported the playhead past ignite *and* bloom in one frame (`heroLife.ts:358–375`).

`?stallfonts` in DEV forces the path deterministically with a never-resolving readiness promise.

### 12.5 Chapter streaming, during the film

- **Prefetch by scroll proximity**; play mode prefetches linearly.
- **Paint and underdrawing packed in one KTX2 atlas** per class, so no curtain state can pop between
  two half-loaded halves.
- **Textures are GPU-uploaded on idle frames, never mid-scrub.** The hook already exists: `Film.tsx`
  computes `idle.skip` per frame (`:168–177`) — a frame the film has already decided not to render.
  Drain one `renderer.initTexture` per such frame, additionally gated on the drive tween being
  inactive. A texture upload during a scrub is a stall the visitor attributes to their own thumb.
- **A chapter that is not ready holds the last composed frame plus the margin note.** Never a blocking
  screen, never a spinner, never a skeleton.
- **Bakes are kicked one stage early** (G2): S3's class bakes during S2's idle, S6's during S5's — the
  stage with the film's longest runway, and it is used.

### 12.6 Fonts

Cinzel + Vollkorn self-hosted (`@fontsource`), woff2 preloaded at idle, `font-display: swap`. Both
faces first appear ≥2.4 s in, so a swap cannot flash. **The Hand is SVG and loads with the page.**

### 12.7 The slow-device path

Runtime tiering, §14.5. Nothing about loading changes — the entrance is already elastic — but the tier
verdict is taken **after** the entrance settles, so the load never competes with the measurement.

### 12.8 WebGL unavailable, or context lost twice

**The Picture Book.** The same page renders eight pre-rendered painted frames (one per stage) with the
captions and the full endcard as plain scrolling HTML. Same story, same CTA, and it doubles as the
share/SEO surface. Frame 1 is the hero poster (`posterBake`, already a first-class artifact).
Context lost **once** → silent restore at the nearest rest anchor.
Detection: a `webglcontextlost` listener plus a constructor-level probe before mounting the Canvas.
**There is no degraded 3D path** — a half-working film is worse than a good book.

---

## 13. REDUCED MOTION

### 13.1 The stance

`A = 0` means **still, at the lit pose** — not damped, not slowed, not 30%. The film still plays,
because the film is scrubbed by the visitor's own scroll and that is motion they asked for. What goes
is every motion they did not: the glide, the rides, the freezes-as-transitions, the write-ons, the
ornaments, the boil, the parallax, the soft rests.

**Honoured live, no reload**, via `matchMedia` — `rigs.ts:42–51` is the shipped pattern and it is the
one to copy.

### 13.2 How the film becomes 48 stills, mechanically

**Ruling: a PRM variant of the timeline, built by flag, rebuilt on the media-query change with
`tl.time()` preserved.** The precedents are both shipped: `timeline.ts:955–1031` already branches the
endcard on `reducedMotion` at build time, and `heroLife.ts:572–578` already rebuilds a timeline in
place on a live flip, preserving its playhead.

```ts
const tl = buildTimeline(world, camera, scene, caps, { prm });     // one flag, threaded
// on the media-query change:
const at = tl.time(); disposeTimeline(tl); tl = buildTimeline(..., { prm: next }); tl.time(at, false);
```

Inside `buildTimeline`, `prm` changes six helpers and nothing else:

| Helper | PRM form |
|---|---|
| `cam(at, dur, pos, look)` | becomes `cut(at, pos, look)` **at the move's own start mark** — the visitor gets the destination composition for the whole beat, which is the "held composition per beat" the docs specify |
| `cap(id, at, hold, fade)` | unchanged in timing; the write-on's `onUpdate` is replaced by a plain opacity fade over the same window |
| `tick()` / `exhale` | `tl.set` on both `timeScale` and `curtain` — instant cuts |
| `reveal()` | `tl.set(shell.scale, 1)` at `actionAt` — a step to the revealed state |
| page turn | the `cut()` and the cluster stay; **the paper flash frame is not authored** |
| the flatten | one opacity cross-fade between the standing and flat states at the same `uTriFlat` endpoints, opacity-stepped, **no sweep** |

Everything else — the goblin's acting, the prop transforms, the disc turn — keeps its authored tweens,
because they are the story and they are driven by the visitor's own hand.

### 13.3 The complete mapping, stage by stage

Directly from scene book §8, restated as what the visitor **gets**, not what they lose:

| Stage | The stills they get |
|---|---|
| **S1** | black + `open1` → the aftermath wide → the volley at the rim medium → the leap's end pose → the landing |
| **S2** | the get-up → the tick (**already a cut, unchanged**) → the flagship address → "I did." → the run-out |
| **S3** | the void crossing (**the void hop becomes a step — there is no slide to see, which is safer, not weaker**) → the lit fire → **the lantern as a two-still sequence, before / after** → the open door → the chest → the ravens scattered → the last stride |
| **S4** | the mushrooms → the signpost + the returned morning (**the exhale is a cut**) → the stage wide → the haul → **the flicker as one cut-in / cut-out held frame, no drift** → the wave |
| **S5** | the dark held frame (one) → the tavern establish → the die on 1 → the frozen room → the goblin at the die → the painted 20 → the resumed room |
| **S6** | six vignettes, each held **in its finished state** → the dawn tilt's end |
| **S7** | the tended rim → the OTS with `pitch1` → the miniature → **the flatten as a single crossfade** → the map → the throw as a cut to the 20 |
| **S8** | the board → the endcard (**wipes become opacity fades at the same times and durations; the CTA's scale drops out entirely** — both shipped) → at rest, static |

**Also, in one list:** every write-on → a plain opacity fade at the same mark and duration · every
camera ride → its end composition · every freeze and exhale → an instant cut · page turns → plain cuts,
no flash · the exposure crossfade → a plain crossfade · banked idles, hearth, candle, patron sway,
ember drift, the spill's hang and the board's breath → **still at the lit pose** · soft rests off ·
boil off · parallax, head-track, ear-perk, dolly breath, hint bob off · Lenis never instantiated · the
hero entrance → three crossfade steps · the hero handoff → three crossfade steps · play mode steps at
the same 66 s pacing.

**Kept under PRM:** every UI state change ≤250 ms (they are not vestibular triggers), the CTA's colour
change (as a crossfade), focus rings, the drawn double-line rectangle, all captions, all copy, the
entire story.

### 13.4 PRM play mode

Play still runs 66 s total, but advances **anchor to anchor**: the next anchor's `t` is reached in
`(t_next − t_now)` seconds by a single `scrollTo` at that anchor's scroll position, held for the
remainder. So the *pacing* is the film's pacing and the *motion* is one instantaneous reposition per
anchor. WCAG 2.2.2 holds: nothing auto-advances without user initiation, and it stops on any input.

### 13.5 The live-flip defect

`Film.tsx:17–20` computes `AMBIENT` **once at module scope** from `matchMedia`. A live preference flip
does not reach the film's flicker, ray spin, gait ambient or cloud drift. `rigs.ts:42–51` does it
correctly, live, and exports `prmAmbient()`. Fix: `Film.tsx` imports `prmAmbient` and calls it once per
frame — a boolean read, no allocation, and it deletes a module-scope constant. Filed as D-3.

### 13.6 QA handle

`prmForce.ts` wraps `matchMedia` in DEV and persists the force in `sessionStorage`, so a **cold-load**
PRM walk is possible (`__prmForce(true)`, reload). DevTools emulation is not scriptable from outside
and motion §14 requires a no-reload flip, so the handle is not optional test furniture — it is how the
requirement gets verified at all.

---

## 14. PERFORMANCE ENGINEERING

### 14.1 The frame budget

**60 fps desktop = 16.6 ms.** Mid-tier phone target ≥40 fps = 25 ms.

| Slice | Desktop budget |
|---|---|
| Scroll + GSAP (drive tween, timeline render, DOM tweens) | ≤1.5 ms |
| R3F scene traversal + the film's own per-frame work | ≤2.0 ms |
| Scene draw passes (see §14.2) | ≤8.0 ms |
| Curtain composite | ≤2.0 ms |
| DOM / interface | ≤1.5 ms |
| Headroom | ≥1.5 ms |

### 14.2 What actually runs per frame — measured from the code, not assumed

**Per frame, always:**
`world.t += d × timeScale` and `world.gobT += d` · the pull-back's authored-vs-applied compare and one
`camera.lookAt` (`Film.tsx:201–208`) · the key light's re-stage, three vector ops (`:213–223`) ·
flame flicker for two groups, soon three practicals (`:226–245`) · three ray-burst `rotation.z` writes
(`:248–251`) · `applyGait` — twelve rotation writes and two on `bob` (`actions.ts:31–51`) · the cloud
wrap (`Film.tsx:268–273`) · one die wobble · one `--sky` CSS variable write (`:284–287`).

That set is a few dozen property writes and **zero allocations** — the house rule (`Film.tsx:33–37`,
`curtain.ts:415–419`, and the pull-back's own comment).

**The real cost is in `curtainPass.render` (`curtain.ts:438–492`), which is up to four passes:**

1. The **mask** render — half res, override material, layer 1 only. Already skipped when
   `curtain.value ≤ 0.001` (`:448`), which is most of the film.
2. The **normal/depth** render — full res, override material, layer 0, fog nulled. **This runs every
   frame of the entire film**, because the sketch pass's contour ink is always on. It is a second full
   scene traversal and it is the single largest lever on this page.
3. The **frame** render into `frameTarget` (4× MSAA).
4. The **composite** full-screen quad.

**Ruling.** Pass 2 stays on desktop — it is what draws the film's edges from real 3D form, and losing
it loses the drawing. It is the **first structural thing to shed on a weak device**, at 0.75 resolution
then 0.5, before anything the audience can name.

**Per beat, never per frame:** mask shells (built once, cached at `object.userData.maskShell`),
materials, geometry merges, bakes, the board traversal (`timeline.ts:928–936`).

### 14.3 Throttles and gates

- **Idle throttle**, shipped: 30 fps after 12 s with no input **and no `t` change** — reading
  `tl.time()` is how a scrub counts as activity, because the wheel listener only sees the device, not
  play mode or a HUD jump (`Film.tsx:159–177`). Skipped deltas are **carried** so ambient clocks keep
  true pace. Instant wake.
- **DPR** capped `[1, 2]` (`App.tsx:211`); low tier 1.5. A 3× phone renders 2.25× the pixels for detail
  nobody can see, and this film is fill-rate-bound in the composite.
- **Visibility**: play mode pauses on `visibilitychange`; the `dt` clamp of 0.1 stays as belt and
  braces.
- **Pointer paths**: `quickTo` and quickSetters only, zero React state per pointer move
  (`heroLife.ts:583–599`).
- **DOM motion**: compositor properties only — `transform`, `opacity`, `clip-path`. **No layout
  animation, ever.** `will-change` applied on interaction start and removed on settle. The one
  per-frame DOM write is the `--sky` custom property, and `--breath`/`--t` join it (§5.2, §2) —
  written **only when they change by more than 0.005**, which for `--breath` is a handful of frames per
  freeze.
- **Scrub hygiene**: state rides uniforms (curtain, seam, touch, flat), **never material swaps**;
  `lagSmoothing(0)` stays; texture uploads never land mid-scrub (§12.5).
- **Draw calls** ≤120 per stage, measured at each stage's authored camera. The path ribbon island sets
  the ceiling; *"just one more separate mesh"* on the ribbon is where the budget dies first.
- **Materials** ≤40 per-mesh trilayers film-wide; the running census is the scene book's §6 table.

### 14.4 Payload

JS ≤300 KB gz initial · hero-critical ≤2.0 MB · film stream ≤9 MB KTX2 · one post pass · the board bake
is the film's only texture above 1024².

### 14.5 What degrades first, and how the tier is chosen at runtime

**Chosen by measurement, not by user-agent sniffing.** After the entrance settles (`entranceDone()`),
collect frame times for 90 rendered frames and take the median. Re-evaluate once more at t≈20 (the
first travelling wide with a full island). Two thresholds: >20 ms → tier down one step; >28 ms → two.
Never tier back up mid-session — an oscillating quality level is worse than a low one.

**The ladder, garnish first, grammar last:**

| Step | Sheds | Costs the visitor |
|---|---|---|
| 1 | DPR 2 → 1.5 | Nothing they can name |
| 2 | Shadow map 1024 → 512, `radius` 3 → 2 | Softer contact edges |
| 3 | Particles halved (embers, motes, dust) | Density |
| 4 | Boil → static | The UI stops breathing |
| 5 | Parallax and head-track off (Cover only) | The Cover's presence |
| 6 | Normal/depth target → 0.75, then 0.5 res | Slightly softer contour ink |
| 7 | Practicals 3 → 1 (nearest to `world.look`) | S6's three candles share one pool |

**Never shed:** the curtain pass, the seam, the reveal shells, the alive shadow, the goblin's gait and
breath, the captions, the focus rings, the SR document. *The concept sheds garnish, never grammar.*

### 14.6 Measurement

The DEV HUD (`?hud=1`, tree-shaken in production — `App.tsx:58–61`) plus the shipped console handles:
`__film` (world, tl, camera), `__curtain` (hold any beat behind the curtain), `__sketch` (the pass's
live grading uniforms), `__hero`, `__island`, `__strokeTiles`, `__gob(w, h)`, `__prmForce`. These have
saved more rounds than they cost — *a reach that looks like an arm hanging at his side and a reach that
never fired are indistinguishable in a frame grab.* **No analytics in production**; one `localStorage`
convenience flag (`gg.seen`), try/catch-guarded.

---

## 15. THE QA WALK — the motion gate

Run in order. Every step has something objectively checkable; the assertions marked **A#** are
scriptable and belong in `pnpm check` or a headless walk script.

### 15.1 Before the browser

**Step 0.** `pnpm check` green: `clocks`, `motion`, `curtain`, `gearing`, `puppet`, `rigs`, `island`,
`pencil`, `die`, `framing`, `hero`, `hero-life`, `gob`, plus the new `figure` and `draws`.

**A1 — the reversal identity. The single most valuable check on the project.** Headless, Node + three,
no WebGL needed. Build the world and timeline; sweep `tl.time()` forward across `t = 0…66` in 0.01 t
steps recording a state vector at 200 sample marks; sweep backward through the same marks recording
again; assert `max |forward − backward| < 1e-6` per component.
State vector: `camera.position`, `world.look`, `goblin.root.position/rotation`, `curtain.value`,
`rig.seamX/depthNear/depthFar/aliveShadow`, every material's `userData.alive.value`, every
`maskShell.scale`, every `onlyFor` target's `.visible`, `world.timeScale`.
**This one test catches every drifted `tl.set` pair, every callback, every integrator, and every
boolean flip in the film.** It is cheap and it should run on every commit.

**A2 — the seven paired clusters.** For each `c ∈ {50.00, 51.25, 52.50, 53.75, 55.00, 56.25}` and the
t50 handoff: assert `tl.set` sites exist on `goblin.root.position`, `goblin.root.rotation` and
`goblin` (speed) at both `c` and `c − PAIR_GAP`; assert `c − (c − PAIR_GAP) ≥ 0.02` **as computed in
floating point**, not as written; assert `tl.time(c − 0.001)` leaves him at the previous beat's pose
and `tl.time(c + 0.001)` at the islet stand; then `tl.time(c + 0.5)` → `tl.time(c − 0.5)` and assert
the pose returns.

**A3 — the nine page turns.** For each mark in
`{7.5, 9.5, 50, 51.25, 52.5, 53.75, 55, 56.25, 57.5}`: assert `#blackout` opacity is 0 across
`mark ± 0.1` (**paper, never black**), and that a camera `cut()` pair exists at the mark.

**A4 — no held partial curtain outside its windows.** Sample `curtain.value` at 0.01 t across 0…66;
assert every sample with `0.001 < v < 0.999` falls inside an authored window:
`[12.5, 12.85] ∪ [33.1, 33.45] ∪ [34.3, 34.42] ∪ [40.6, 40.95] ∪ [47.0, 47.12]`. Anything else is a
partial state nobody authored, and L8 says it will be parked on.

**A5 — grammar greps on `timeline.ts`.** No `stagger:`. No `onComplete`/`onStart`/`onRepeat`. No
`tl.call(`. No `ScrollTrigger` callback other than `onUpdate`/`onRefresh` on the one drive. `onUpdate`
allowed only on tweens whose handler is a pure function of the tween's own target.

**A6 — the frontier's window.** `rig.seamX.value === 1e6` for every `t` outside `[20.53, 30.34]`; and
inside, monotonic non-decreasing except at the two authored `tl.set`s.

**A7 — the clock.** `world.timeScale ∈ {0, 1}` at every sample except inside the six named ramps
(three ticks ≤0.15 t, three exhales 0.3 t).

**A8 — the text.** No two caption windows overlap; ≥0.12 t gap edge to edge; every caption's authored
SVG has `N ≤ round(fade × 15)` paths (§6.2); every caption string matches `copy-spec.md` byte for byte;
the SR document contains all twelve verbatim in order.

**A9 — the figure floor.** `figure.check.ts` on every `A`-flagged beat at 390×844, 500×915, 768×917
(≥84 px) and 1440×900, 1920×1080 (≥100 px). **The `A`/`E` flag in the scene book §3 is the single
source of truth** — including S7-B6's registered exemption, which the beat table must carry or the
check fails the throw at 390.

**A10 — draw calls** ≤120 per stage at each stage's authored camera.

### 15.2 In the browser — the ordered walk

1. **Cold load, cache cleared, `localStorage` cleared.** Watch the entrance. **Look for:** paper within
   250 ms · no layout shift, ever · ticks before strokes · **the lantern igniting before the paint** ·
   the goblin arriving on the bloom's edge, not before it · settled ≤3.2 s · **no spinner and no
   skeleton at any moment.** Then: `?stallfonts` and confirm the crawl, the note at 3 s, the cap at 4 s,
   and that an input mid-stall still lands on the settled frame.
2. **The handoff.** Scroll one notch. **Look for:** the head snap being the fastest thing on the page ·
   the paint draining lantern-last · the ember-dot as the final live pixel at 97%. Scroll back up:
   **the lantern must re-ignite first.** Repeat five times at different speeds; the frame at any parked
   position must be composed.
3. **Forward, slow** (one notch at a time), 0 → 66. **Look for:** every transition legible · one
   caption at a time · the caption band never crossing the subject · zero console errors.
4. **Forward, natural**, then **forward, flick**. Then **backward, flick**, then **backward, natural**,
   then **backward, slow.** The backward passes are the real test.
5. **The seven clusters, individually.** Park just before each, step through at one notch, step back.
   **Look for:** no pose snap, no frame where he is in two places, no prop left revealed on the way back.
6. **The nine page turns, individually,** both directions. **Look for:** paper, never black; no double
   flash; the montage's `at + 0.04` drift starting *after* the cut, not with it.
7. **The two must-be-flawless-both-ways moves.** The S4 disc (t31.5–34.3) and the S7 flatten
   (t60–62), at flick speed, both directions, three times each. **Look for:** the disc's turn direction
   always matching the scroll direction · the flatten's twelve groups keeping their x-order in reverse ·
   nothing created or destroyed at either end.
8. **Held-frame audit.** Park at every partial-curtain value (the five windows in A4, at 25/50/75%) and
   at all seventeen rest anchors. Every one must be a frame you would ship as a still. **Named cases:**
   mid-darkness in the walk-through · mid-sweep in the S3 frontier · mid-flatten.
9. **The S3 switchover, walked alone and first** (scene book §9 risk 2). Park at 20.51, 20.53, 20.55,
   20.57 and step between them one frame at a time in both directions. **Look for:** any change at all
   in the rendered frame across the three sets. **There must be none.** Then the same for the lighting
   scalars (§10.5 / D-1) — the practicals and the hemisphere must not jump.
10. **Play mode.** End to end, foregrounded, 66 s ±1 s. Then: hide the tab mid-play and return (must be
    paused, must not have advanced); yield to input at three points (wheel, touch, key); reach the end
    and confirm focus lands on the CTA with no scroll jump; press replay.
11. **Real phone, portrait.** Soft rests at the four `me*` lines and the look · the 950vh track ·
    ten flicks to the end · the figure floor by eye at S2-B3, S4-B5, S5-B4, S7-B1 · the three demotable
    flagship reads · the die's numerals at S5-B2 and S7-B7 · **no sticky hover after any tap.**
12. **Reduced-motion walk.** `__prmForce(true)`, reload, walk the whole film. **Look for:** every
    beat has a composed still · nothing moves that was not scrolled · the story is complete · the CTA
    still works. Then flip the preference **live** mid-film and confirm it takes effect on the next
    paint with the playhead preserved (this is where D-3 shows).
13. **Keyboard-only walk.** Tab from load: SR skip link → play → skip note (only after t16.5) → CTA.
    Step all seventeen anchors with `↓`/`↑`, chapters with `PgDn`/`PgUp`, `Home`, `End`, `Esc`.
    **Look for:** the drawn double-line rectangle on every focus, never suppressed, never the browser
    default · no traps · the skip note not focusable before t16.5 or after t64.5.
14. **4× CPU throttle.** Walk S3, S5 and S7. **Look for:** budgets holding, no hitch at a chapter
    boundary, **no catch-up jump after a stall** (that is `lagSmoothing(0)` doing its job).
15. **WebGL off.** Confirm the Picture Book: eight frames, twelve captions, the endcard, the real link.
    Then force a context loss once and confirm silent restore at the nearest anchor.
16. **The gates.** The impeccable pass on the built UI · the clarity contract's seven assertions ·
    the art-style guide · zero console errors on a full walk in both directions, on the dev grid and on
    a real phone.

---

## 16. DEFECTS, CONFLICTS AND OPEN QUESTIONS

Named rather than silently resolved. Every one is a place where two binding documents disagree, or
where the shipped code contradicts a doc. **None is decided here.**

| # | Item | Detail | Proposed resolution |
|---|---|---|---|
| **D-1** | **The practicals' scalar breaks S3-B2** | `rigs.ts:143` scales the glow by `(1 − globalCurtain)`, so the campfire he lights at t18.35 — which S3-B2 calls *"the frame's only light"* — emits nothing until t20.55 and then jumps to full in one frame | Scale each practical by `max(1 − curtain, ownMaterial.alive.value)` (§10.5). One `max`, no booleans, and it makes the lantern ledger literally true |
| **D-2** | **The t20.55 switchover moves the lighting scalars, not just the curtain** | `hemi`, `flat` and the practicals are scene-scalar and keyed to the global curtain (`rigs.ts:141–144`). At the switchover they all change in one frame. The trilayer's Prep branch is unlit so the *drawing* is safe, but the **alive** props and the goblin are painted and lit | Add one row to the S3 state schedule: a light-blend scalar set to 0 at **t20.51**, while the global curtain still holds the whole frame in Prep and the change is therefore invisible. Three sets, three targets, `PAIR_GAP` apart. **Needs the scene book owner's sign-off** — this document may not amend the schedule |
| **D-3** | **`Film.tsx` does not honour a live PRM flip** | `AMBIENT` is computed once at module scope (`Film.tsx:17–20`), so flicker, ray spin, gait ambient and cloud drift ignore a live preference change. Motion §14 and scene book §8 both require live | Import `prmAmbient()` from `rigs.ts` and call it per frame. One boolean read; deletes a constant |
| **D-4** | **Token drift `motion.check` cannot see** | `heroLife.ts:595–596` uses literals `0.25` / `0.4` where `T_UI_MAX` / `T_BEAT` are the same values. The wired-token grep only checks tokens it already lists | Rewire the two call sites; add them to `wiredAt` |
| **D-5** | **"Five verbs to author" but four are marked** | `goblin-design §10:606` says five; the table bolds four (`freeze`, `scribe`, `pocket`, `throw`). The scene book independently mandates four more (`hop`, `hang`, `plantAndPat`, `touchUp`) | Treat the authoring list as **eight** (§10.6) and ask the goblin doc's owner which fifth was intended |
| **D-6** | **`GOB_SCALE` has two owners** | Scene book §7: *"`GOB_SCALE = 0.75`, uniform and locked film-wide."* Goblin §11.2 / gate G7: *"the stage solves `GOB_SCALE` so the projected figure height is ≥52 CSS px, capped at 1.35×."* | They are different surfaces — the film's locked scale and the Cover's solved one. Rename the second `HERO_GOB_SCALE` and the conflict evaporates |
| **D-7** | **Reload behaviour** | Scene book §8: resume at the nearest rest anchor. `App.tsx:75–78`: always restart | §12.3's split: cold visitor restarts, in-session visitor resumes at the nearest anchor |
| **D-8** | **The `me*` cluster is under the reading floor at play pace** | Motion §8's rule is `hold ≥ chars × 55 ms + 500 ms`. `me1` needs 1.16 t and gets 0.55; `me2` needs 1.77 and gets 0.55; `me3` needs 0.83 and gets 0.50; `me4` needs 1.38 and gets 0.70 | **Re-timing is a hard gate and this is not a request to re-time.** The mitigations are real and already designed: four rest anchors on the four lines, touch soft rests, keyboard stepping, and the verbatim SR transcript. State the rule as *"holds meet the reading floor except inside the `me*` punch cluster, where the anchors carry it"* — or move the floor. Owner's call |
| **D-9** | **The focus ring is the browser's, not the film's** | `styles.css:486–489` is a single solid outline; the scene book mandates the drawn double-line rectangle | §5.1's utility, in the same commit as any `outline: none` |
| **D-10** | **`:hover` is unguarded** | `styles.css:286`, `:394` have no `@media (hover: hover)` — hover sticks after a tap on touch | Wrap both; add `:active` states |
| **D-11** | **The SR document is a summary, not the transcript** | `App.tsx:219–227` is prose; the scene book requires the twelve captions verbatim plus the eleven scene sentences plus the endcard copy plus the link | P6 deliverable; the sentences are already written (scene book §8) |
| **D-12** | **The normal/depth prepass runs every frame of the film** | `curtain.ts:462–475` renders the whole scene a second time unconditionally, because the contour ink is always on. It is the biggest single cost on the page and no doc names it | Keep it at full res on desktop; it is tier-ladder step 6 (§14.5). **Measure it before S3 is polished** — if it is over 3 ms on the ribbon island, the ladder needs re-ordering |

---

## 17. GUARDRAILS

No build until its plan is approved. Nothing deploys or publishes. `story/` stays uncommitted. Motion
never overrides the standing bans: **no hatching in any authored mark · no tone mapping · copy is
verbatim · the goblin design and the scene book are locked.** Any new motion names its token, its lane,
its clock and its grammar — or it does not exist.
