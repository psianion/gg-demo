# THE PROJECTIONIST'S HAND — the binding motion and micro-interaction system

2026-09-03 · The creative-technology layer for the whole site: the film body (t0–66), the persistent
interface, the endcard, and every moment the visitor touches the page.

**Status: BINDING.** Every entry names its token, its ease, its driver clock and its reverse. Every
open question in the draft is decided here. Where a thing cannot be asserted by a check script, the
entry says so and names what a human looks at instead.

---

## 0. INHERITANCE AND AMENDMENT

### 0.1 What this inherits from `docs/2026-09-02-motion-system.md`, unchanged

The whole architecture. Specifically and without alteration:

- **§4 The clock architecture.** Two clocks: `world.t` scaled by a tweened `world.timeScale`
  (`Film.tsx:183`), and `world.gobT` which never stops (`Film.tsx:183`). The master timeline is
  `paused` and driven only by `tl.time()` from the gearing drive.
- **§3.1 the duration scale, §3.2 the three ease lanes, §3.3 the micro-motion constants.** Every
  shipped value survives at its shipped number. `motion.check.ts:34–48` is the authority.
- **§5 the input→response budget's contract shape**, extended in §3 below with rows it did not have.
- **§9 the scroll engine.** One `ScrollTrigger` on `#track`, `gearing()` shaping raw progress, one
  persistent `expo` tween re-pointed by `invalidate().restart()` (`timeline.ts:1086–1099`).
  `lagSmoothing(0)` for everyone.
- **§13 loading is the drawing drawing itself.** No spinner, anywhere, ever.
- **§14 reduced motion is a path, not a subtraction.** `A = 0` means still at the lit pose.
- **§17 the guardrails.**

### 0.2 What this amends, and the amendment

| Motion-system § | Amendment | Why |
|---|---|---|
| **§1 Philosophy, law "every ambient thing joins the world clock"** | Becomes: *ambient joins the world clock; **a prop's idle joins his clock from the moment he touches it**.* See L1 below. | Scene book §4-4 and §9 risk 8 make the banked idles ride `gobT`, because a fire he lights at t18.35 must flicker inside a freeze that runs to t30. Three shipped code comments assert the opposite and are rewritten in the same commit (D-14). |
| **§3.1 duration scale** | **Ten** tokens added (§2.2 — ERRATA 2026-09-03: this row said twelve; §2.2's table has ten rows, and §2.4 names ten *further* micro-constants, so neither number was twelve); `T_DRAIN_MIN`/`T_DRAIN_MAX` **retired to a clamp** with no authored call site (A4); `DISC_SMOOTH` and `T_REST_DETECT` are **not** added (cut, §16.2). | The rebuilt film authors no gliding drain. The two cut tokens were knobs for machinery the scrub already provides. |
| **§3.2 ease lanes** | Unchanged in content; the border is now also asserted on the *camera* module and on `styles.css` (A5, §15.1). | Grep, not taste. |
| **§7 hover & focus inventory** | Rewritten as §5, with the focus ring's mechanism decided (`#play` stops blending; its two children blend instead) and with `inert`, not `pointer-events`, as the interactivity gate. | `pointer-events: none` does not leave the tab order, and `#endcard-cta` overrides an inherited `none` anyway (`styles.css:229`). Focus visibility is a hard gate; "must survive" is not a mechanism. |
| **§8 text reveal** | The caption count is **eleven plus the endcard block**, not twelve (`copy-spec.md:25–37`, `App.tsx:35–49`). The graphite⇄ink flush is a second tween on the master timeline, not a CSS ramp (§6.3). | Copy is LOCKED; a twelfth caption cannot be invented. And two tweens at one position with one ease cannot desync on a positional scrub. |
| **§10 camera motion** | Eight move classes become **seven**: "Breath" leaves the camera and becomes a scale on the board (§8.1, §9.2). A second authored framing per beat (`portraitLook`) is added as a **build-time flag**, not a per-frame blend (§8.6). | `Film.tsx:200–205`'s pull-back idempotence compares authored vs applied camera position; a per-frame breath written after it compounds. |
| **§12 state transitions** | Seven transitions, unchanged. The page-turn pairing rule is `PAIR_GAP` apart, **against** the scene book's "identical positions" (D-13). | `timeline.ts:143–147` and `clocks.check.ts:66–74` are both written in the past tense of that exact bug, and the scene book contradicts itself at §S5-B8. Routed to its owner, not silently overridden. |
| **§15 performance** | The frame budget's "scene draw passes" line is split into the three `renderer.render` calls it actually is (`curtain.ts:438–491`); `rigs.update()`'s caster loop is added to the census; `shadowMap.autoUpdate = false` is mandated. | three.js renders the shadow map once per `render()` call. Three calls, three shadow renders, unless it is turned off. |
| **§16 QA walk** | Extended to A1–A13 and a sixteen-step browser walk, each marked scriptable or human-eye. | The reversal identity (A1) is worth more than the rest combined. |

**Authority.** `docs/2026-09-03-scene-book.md` is LAW. Where this document departs from it, the
departure is filed in §16 with the shipped-code evidence and routed to the scene book's owner — it is
never silent. `docs/copy-spec.md` is verbatim. `gearing.ts:44–54` and `RUNTIME = 66` are fixed;
**nothing here re-times the film.**

**What this may not do.** No eighth transition. No third clock. No second post pass. No FOV tween. No
re-gearing. No spinner.

---

## 1. THE LAWS

Twelve. Each is a rule with a named failure behind it. A motion that cannot cite its law does not
ship; it gets deleted, not tuned.

| # | Law | The failure it prevents |
|---|---|---|
| **L1** | **Two clocks, and only two — and a prop's idle joins his.** The world runs on `world.t × world.timeScale` (freezable, `Film.tsx:183`); the goblin runs on `world.gobT`, which never stops (`Film.tsx:183`). Scene-owned ambience (sky drift, cloud wrap, the unlit world) rides `world.t`. **A prop's idle rides `gobT` from the moment he touches it** — that is the film's thesis in one line, and §10.4 is its whole mechanism. Nothing gets a third clock. | A third clock is a third thing to freeze. And a fire he lights inside a nineteen-second freeze that then sits perfectly still is the film contradicting its own claim. |
| **L2** | **Scroll owns time.** The master timeline is `paused` and driven only by `tl.time()` from the drive (`timeline.ts:1086–1099`). Its default ease is `'none'` (`timeline.ts:76`) — **on a scrubbed timeline the visitor's hand is the ease.** | Double-easing. An authored ease on top of the scrub reads as lag and the visitor blames their trackpad. This is why `DISC_SMOOTH` is cut. |
| **L3** | **Input wins, same frame.** Any input cancels any assisted motion immediately (`App.tsx:149–151`). No animation may gate, delay, queue or reinterpret an input. **One exception, and it is exhaustive: the touch soft rest** (§7.5), which fires only after momentum has already died and is cancelled by any input. | Scroll-jacking. One frame of "the site decided when I get to move" costs more trust than the whole film earns. |
| **L4** | **Three ease lanes, hard borders.** Scrub (`'none'`), Settle (`SETTLE.*`), Puppet (`PUPPET.*`) — `motion.ts:48–68`. UI, camera, type and margin never borrow the puppet lane; `motion.check.ts:74–91` greps for it. Elastic is banned in every lane, forever. | A camera that bounces. A caption that overshoots. The film stops being a hand-made object. |
| **L5** | **No state in the film's motion.** No integrators, no springs, no velocity drag, no per-frame accumulators driving visual state, no booleans flipped on "revealed". Every visual value is an authored GSAP key or a pure function of `(t, gobT, a scrub-tied scalar)`. **One sanctioned exception, named and costed: `rigs.update()`'s `castShadow` write** (§14.2) — a renderer flag, idempotent, derived from `curtain` and `userData.alive`, never read back. | The whole scrub-safety bug class. `timeline.ts:131–141` and goblin §11.1 are both written in the past tense of shipped bugs. |
| **L6** | **No callbacks drive visual state.** `tl.call`, `onComplete`, `onStart` and ScrollTrigger boundary callbacks do not reverse. Visibility goes through `onlyFor()` triads (`timeline.ts:143–153`). A tween's own `onUpdate` **is** legal — it fires on every playhead pass in both directions — but only where it writes a pure function of that tween's own progress (`heroLife.ts:278–286`'s `applyStrokes` is the shipped precedent). | The film's first frame came back with the camp missing (`timeline.ts:144–146`). A callback on a boundary crossing is a one-way door on a two-way road. |
| **L7** | **Two writes to one target at one position are illegal — with one named exception.** A `tl.set` pair on the same target at the same position replays in reverse order on backward scrub. Pairs sit `PAIR_GAP` apart and are **authored as `c` / `c − PAIR_GAP`, never as two decimal literals** (§2.2). *The exception:* a `tl.set` immediately followed by a `tl.to` on the same target at the same position — the set is the tween's from-state. The film has exactly one (`timeline.ts:638–639`, the die's t38 rotation) and A1 is its only guard. | The page-turn flash. The seven montage clusters, invisible until someone scrubs backwards. And the float trap: `30.34 − 30.32 = 0.019999999999999574`, which fails `clocks.check.ts:70`. |
| **L8** | **A partial state is a held frame.** Any `0 < curtain < 1`, any mid-sweep `seamX`, any mid-ramp `uTriFlat` must be a composed, shippable frame, because a parked scrub will hold it. No transition may pass through a frame that only works in motion. | Mask defects and half-tinted objects. Colour law 2 bans half-tinted objects by name; a held partial frame is where that ban gets tested. |
| **L9** | **Every motion names its token, lane, clock and grammar.** Tokens live in `motion.ts` and are *wired* — imported at the call site (`motion.check.ts:116–197`). A re-inlined literal fails the check. | The scale rotting into forty hand-found numbers, which is what `actions.ts:74–78` records happening to thirteen reaches. |
| **L10** | **The camera never freezes.** `timeScale` stops the world; the camera is on the master timeline and keeps moving through every tick. | A freeze that also freezes the lens reads as a stall, not as a stopped world. The visitor's own thumb still moving the shot is what makes the freeze a privilege instead of a pause. |
| **L11** | **Reduced motion is a path, not a subtraction.** `A = 0` means *still at the lit pose*, never slowed or damped. Every beat has an authored still. Honoured live via `matchMedia`, no reload (`rigs.ts:42–51`). | "Damped" motion still moves. A visitor with a vestibular disorder gets nausea from 30% of a camera ride exactly as they do from 100% of one. |
| **L12** | **No spinner exists.** Anywhere. Loading is the drawing drawing itself; a stall slows the hand and pencils one margin note. | The one honest opportunity this site has to perform its own product, spent on a rotating arc. |

---

## 2. TOKENS

### 2.1 The shipped scale — inherited, re-stated, with two status corrections

`src/film/motion.ts` is the vocabulary; `motion.check.ts:34–48` asserts every value. **This section
adds; it does not fork.**

| Token | Value | Unit | Status |
|---|---|---|---|
| `RUNTIME` | 66 | film-t | wired, fixed |
| `SCRUB` | 0.8 | s | wired |
| `T_FLICK` | 0.12 | both | wired · CSS-legal |
| `T_UI` / `T_UI_MAX` | 0.2 / 0.25 | s | CSS-pinned |
| `T_BEAT` | 0.4 | film-t | wired |
| `T_PUNCH` | 0.25 | film-t | wired |
| `T_GESTURE` | 0.5 | film-t | wired |
| `T_REVEAL` | 0.8 | film-t | wired |
| `T_DRAIN_MIN` / `T_DRAIN_MAX` | 0.5 / 1.4 | film-t | **RETIRED-WIRED** — see below |
| `T_EXHALE` | 0.3 | film-t | wired |
| `T_CAM_MIN` / `T_CAM_MAX` | 1.5 / 2.5 | film-t | forward |
| `T_BLOOM_MIN` / `MAX` | 0.8 / 1.2 | s | forward |
| `T_BLOOM_CTA` | 0.18 | s | forward — **JS-only, may never enter `styles.css`** |

**`T_DRAIN_MIN`/`T_DRAIN_MAX` are retired.** A4 (§15.1) permits partial curtain values only inside five
authored ramp windows totalling 0.35 t and 0.12 t. The rebuilt film therefore authors **no
`glidingDrain` call at all**; the 0.5–1.4 t band survives only as the clamp inside
`curtain.ts:204–210`, which is now an identity with no caller. The tokens stay in `motion.ts` so the
clamp keeps reading them and `motion.check`'s `wiredAt` keeps passing. **Nobody may author a new
gliding drain without amending A4 in the same commit.**

**`T_BLOOM_CTA` cannot be a CSS transition.** `motion.check.ts:199–212` regexes every `transition:`
duration in `styles.css` and asserts membership in `{T_FLICK 0.12, T_UI 0.2, T_UI_MAX 0.25}`. 0.18 is
not in that set. **Decision: the CTA's amber bloom runs as a GSAP tween on the JS side** (§5, CTA row),
where the token is free, exactly like `T_SKIP` and `T_REPLAY`. The check is not widened — the CSS lane
stays three values.

**The dead zone stands.** No *UI-seconds* duration between 0.25 s and 0.4 s; none under 0.1 s except
`T_FLICK` acknowledgments. Film-t durations are exempt (`motion.ts:5–8`). The test is the unit: **a
duration that lands in `styles.css` must be a UI-lane value; a duration that lands on the master
timeline is film-t and free.**

### 2.2 The extension — ten new tokens

Added to `motion.ts` with the same three-way status marking (WIRED / CSS / FORWARD). Two draft tokens
are cut (§16.2) and do not appear.

| Token | Value | Unit | Consumer | Why this number |
|---|---|---|---|---|
| `PAIR_GAP` | 0.025 | film-t | timeline (every paired set) | `clocks.check.ts:70` demands ≥0.02 t. Two decimal literals cannot be trusted to that floor: `30.34 − 30.32 = 0.019999999999999574` and `20.55 − 20.53 = 0.019999999999999574`, both **below** it. `c − (c − 0.025) = 0.02499999999999858` for every mark in the film. 25 ms at play pace ≈ 1.5 frames — invisible, and provably above the floor. |
| `T_NUMERAL` | 0.3 | film-t | chapter numeral crossfade | The scene book's 300 ms in the unit it lives in. It sits on the master timeline at t16.5 / 31.5 / 37.6 / 49.5 / 57.5 / 64.5, so it is film-t and exempt from the dead zone. **It must never appear in `styles.css`.** |
| `T_FLUSH` | 0.2 | film-t | the Hand's graphite⇄ink stroke crossfade | The scene book's 200 ms per stroke, as the *per-path ramp width* inside the curtain tween's own window (§6.3). |
| `T_REST` | 0.22 | s | touch soft rest | The eased ride to the anchor. Above the 0.1 floor, below the dead zone. |
| `T_STEP` | 0.45 | s | keyboard `↓/↑` anchor step | Long enough to read as travel, short enough that holding the key is not a slideshow. |
| `T_SKIP` | 1.2 | s | skip-note ride to the endcard | Shipped literal, `App.tsx:186`. |
| `T_REPLAY` | 1.6 | s | replay's ride Home | Scene book §3-S8-B3. Longer than the skip because it crosses the whole film. |
| `T_CURSOR_HIDE` | 2.5 | s | play-mode cursor auto-hide | Video-player convention; scene book §2. |
| `BOARD_BREATH` | `{ amp: 0.005, periodS: 12 }` | — | S8 board **scale** | ≤0.5% drift over 12 s (scene book §3-S8-B3). Same shape as `HERO_DOLLY`, applied to `board.scale`, never the camera (§9.2). |
| `FLATTEN` | `{ x0: 128, xSpan: 42, spread: 0.9, dur: 1.1 }` | film-t / world-x | S7-B4 | The scene book's own stagger formula as a token: `offset = (originX − x0) / xSpan × spread`. |

Two shipped literals are **promoted, not invented** — they already equal existing tokens and the call
site should read the token: `heroLife.ts:597–598`'s almost-touch `0.25 / 0.4` **is** `T_UI_MAX` /
`T_BEAT`. Rewiring is a two-line change (D-4).

**The pair-authoring rule, binding.** Every paired `tl.set` in `timeline.ts` is written as a computed
expression against a single named mark:

```ts
const c = 30.34;                       // the beat's mark, written once
tl.set(rig.seamX, { value: 1e6 }, c);
tl.set(rig.seamX, { value: SEAM_PARK }, c - PAIR_GAP);   // 30.315 — never typed as a decimal
```

Two decimal literals are a defect even when they happen to pass. A11 (§15.1) evaluates the
subtraction in floating point and fails the build if any pair is under 0.02 t.

**The S3 switchover is not a same-target pair and must be said out loud.** `seamX` at 20.53 and
`curtain` at 20.55 sit 0.019999999999999574 t apart — *below* the floor — and pass only because
`clocks.check` groups by target and these are two different objects (`rig.seamX` vs `curtain`). If
anyone ever moves both onto one state object, the check goes from passing to failing with no code
change. **Leave them on separate objects, and note it at the call site.**

### 2.3 Ease lanes — which ease, for which class, and why

| Lane | Ease | Everything that uses it | Why |
|---|---|---|---|
| **Scrub** | `EASE_SCRUB = 'none'` | The master timeline's default. Caption opacity and write-on progress, curtain values, camera rails' positions when the beat is a follow, the `seamX` sweep's linear legs, the travel-line `instanceCount` ramp, the flatten's UV mix, the ruler's ink-in. | The visitor's hand is already the ease (L2). **And exact reversal is easiest on a straight line** — the crossing times in `heroLife.ts:540–541` are solved analytically only because the drain is linear. |
| **Settle** | `power2.out` (arrivals) · `power2.inOut` (A→B moves, the dominant authored ease) · `power2.in` (impacts, exits) · `power3.out` (heavy settles: the die) · `power4.out` (`snapBack` only) | Camera beats, reveals, rig moves, UI enters/exits, lettering, the depth ramp, the frontier sweep, the exhale, the margin breathe. | Confident deceleration is the film's physical register: things arrive and stay arrived. `power4.out` is reserved for `snapBack` because a punchline is the one release that should feel *snapped*. |
| **Puppet** | `back.out` (pop-ins) · `sine.inOut` (organic micro-loops) · `sine.out` (walk-offs) · `bounce.out` (**one** authored drop — the tavern sign, re-spent as S6-B3) | In-world prop and character acting only. | Props are actors. An overshoot on a camera or a caption is what makes a site read as templated, so the border is enforced by grep, not by taste. |

**House follow-through is hand-offset, not stagger.** Secondary channels start at `at + dur × 0.22`.
**Heads chase necks:** `look()` writes the neck at `at` and the head at `at + dur × 0.12` over
`dur × 0.9` on `power2.out` (`actions.ts:322–329`). **Ears arrive last:** `EAR_LAG = 0.08` s behind the
face, on `back.out(1.3)` (`actions.ts:377–378`) — 1.3 is `back.out`'s overshoot parameter, not a
duration multiplier.

**`stagger:` goes to zero.** It appears once today (`timeline.ts:915`, the miniature flatten) and the
scene book's twelve-group x-keyed formula replaces it. After S7 is rewired, **the film contains no
`stagger:` at all** — every cascade is a computed per-target offset, because a computed offset is a
*position* on the timeline and a `stagger` is a *scheduling behaviour*. Positions reverse; behaviours
are one more thing to reason about backwards. Asserted (A5).

**`'+=' / '-='` go to zero too.** Six relative tweens ship today —
`goblin.earL/earR.rotation '+=0.3'/'-=0.3'` (`timeline.ts:268–269`), `world.rope.position '+=0.15'`
(`:573`), `world.stageDisc.rotation '+=${Math.PI}'` (`:570`), `world.tavernSign.position '-=0.95'`
(`:872`), `world.die2.rotation '+=12'/'+=8'` (`:937`), `world.die2.position '-=0.15'` (`:962`). GSAP
resolves a relative value at the tween's **first render**, against whatever the target holds then. That
makes them un-rebuildable (§13.2) and it makes A1's reversal identity dishonest. **All six convert to
absolute end values at authoring time**, and A5 greps `timeline.ts` for `'+=`, `'-=`, `` `+= `` and
`` `-= ``. It is the smaller diff and it is the one that lets a PRM or breakpoint rebuild be a seek.

**Yoyo repeats must be odd.** `repeat: n` with `yoyo: true` plays `n + 1` legs; an even `n` ends on a
forward leg and parks the target away from its authored base. `timeline.ts:573` ships `repeat: 12` — 13
legs — and rests the rope 0.15 above where it started. **Every yoyo `repeat` in the film is odd**, and
A5 asserts it.

### 2.4 Micro-motion constants

Shipped and unchanged: `BOIL {fps: 6, ampPx: 0.8}` · `BREATH_RATE 1.9` · `STRIDE_RATE 11` ·
`FLICKER {scaleAmp .18, scaleRate 9, pulseAmp .3, pulseRate 13, glowBase 4.5, glowAmp 1.6}` ·
`RAY_SPIN_RATE 0.5` · `HERO_DOLLY {amp .012, periodS 13}` · `MOTH_ORBIT_S 2.6` ·
`UI_RISE_MAX_PX 12` · `PARALLAX_CAP_DEG {yaw 2.2, pitch 1.2}` · `IDLE_THROTTLE {afterS 12, fps 30}`.

Added — shipped literals being named, plus one correction:

- `TRACK_TAU = 0.13` s — the head-chase time constant, `k = 1 − exp(−dt/τ)` (`heroLife.ts:762`).
  Frame-rate independent by construction, on the UI clock, not the film.
- `PAR_DUR = 0.55` s — the parallax `quickTo` **duration** (`heroLife.ts:594–595`). It was named
  `PAR_TAU` in the draft; it is not a time constant and the name lied.
- `SCRITCH_TAU = 0.16` s — **new, and it removes a defect.** `heroLife.ts:757–758` returns the wrist
  and pose home with `+= (base − current) × Math.min(1, dt × 6)`, which is frame-rate dependent: at
  144 Hz it converges 2.4× faster than at 60 Hz. Both lines convert to `k = 1 − exp(−dt/SCRITCH_TAU)`,
  matching the 60 Hz feel (`1 − exp(−(1/60)/0.16) ≈ 0.099` ≈ the shipped `0.1`). **There are three
  damped lerps on the site, not one** — this pair and `TRACK_TAU` — and after this change all three
  are frame-rate independent. It is the last such dependency on the Cover.
- `PERK = { up: 0.3, settle: 0.5 }` — the ear-perk (`heroLife.ts:636–637`); `settle` is `T_GESTURE`.
- `BLINK = { close: 0.06, open: 0.07, everyS: [3.5, 7.0] }` (`heroLife.ts:719–731`).
- `SCRITCH = { periodS: 1.8, afterS: 4 }` (`heroLife.ts:744–755`).
- `DEPTH_SHOT = { near: 0.95, far: 2.4 }` — multipliers of shot distance for `rig.depthNear/Far`,
  lifted from the hero's solve (`Hero.tsx:131–132`). `DEPTH_TIGHT = { near: 0.55, far: 1.35, dur: 0.6 }`
  is the same pair for the film's exactly two tightening moments (§9.3).
- `WRITE_STAGGER = 3` — concurrent paths in a caption write-on (§6.2); the hero's own value.
- `WHISPER = 0.04` — the margin layer's Performance-state ink (scene book §2). Breathe target is 1.

---

## 3. INPUT → RESPONSE BUDGET

The contract: **what must be on screen within how many milliseconds of each input class, and what is
explicitly allowed to be late.** "First visible response" means a pixel changed, not a promise
resolved.

| Input | First visible response | Budget | Allowed to be late |
|---|---|---|---|
| **Wheel / trackpad tick** | The Lenis transform moves; `ScrollTrigger.update` runs on Lenis's own `scroll` event (`App.tsx:93`); the drive re-points the scrub tween (`timeline.ts:1098–1099`) | **same frame, ≤16 ms** | The *film* settling to the new `t` — the authored 0.8 s expo glide, which is the hand-feel, not lag |
| **Touch drag** | Same path, no smoothing between finger and page | **same frame** | Nothing. A dragged page that lags the finger is broken, not stylish |
| **Flick / fling release** | Momentum begins immediately (native under Lenis) | **same frame** | The playhead's catch-up (§7.3) |
| **Any input during play mode** | `setPlay('idle')`; the rAF loop is cancelled next tick (`App.tsx:142–152`) | **same frame for the state, ≤1 frame for the loop** | Nothing else |
| **`Space`** | Play toggles. **`preventDefault()` is part of the response** — unhandled, `Space` on `<body>` is the browser's page-down, which jumps a viewport at the same instant play mode seeds `t` from `window.scrollY` (`App.tsx:130`) and the jump is picked up as film time. **Bound only when `document.activeElement` is not a control**, so `Space` still activates `#play` and the CTA natively | **same frame** | — |
| **`Esc`** | Play mode de-escalates | **same frame** | — |
| **Keyboard anchor step (`↓/↑`)** | The eased ride starts | **≤50 ms**, `T_STEP` 0.45 s `power2.out` travel | The film's own settle at the destination |
| **`PgDn/PgUp`, `Home`, `End`** | Ride starts | **≤50 ms**; `T_SKIP` for `End`, `T_REPLAY` for `Home` | — |
| **Hover / pointerenter on a control** | The state transition starts | **≤50 ms**, no hover-intent delay — every target is ≥44 px | — |
| **Click / press** | The pressed state paints | **≤100 ms**, `T_FLICK` acknowledgment | Navigation (`target="_blank"`) |
| **`focus-visible`** | The drawn double-line rectangle *and* the identical hover treatment | **same frame** | — |
| **Touch tap on a control** | `:active` state (there is no hover to borrow) | **≤100 ms** | — |
| **Pointer move over the Cover** | Parallax / head-track / almost-touch targets update; the damped chase begins | **next frame**, damped over `PAR_DUR` / `TRACK_TAU` / `T_UI_MAX` | The *arrival* — these are presences, not controls, and a damped presence is the point |
| **`prefers-reduced-motion` flip** | Ambient stills (`prmAmbient()`, next frame) | **next paint, no reload** (`rigs.ts:42–51`) | **The timeline rebuild — one frame.** It preserves `tl.time()` and re-seeks (§13.2) |
| **Resize / rotate** | FOV re-clamp and pull-back re-solve | **next frame** (`Film.tsx:200–205`) | **The portrait restage — one frame.** A breakpoint crossing is a **timeline rebuild**, not a tween (§8.6): `portraitLook` targets and portrait staging both land on the rebuild's seek |
| **First byte → first paint** | Paper, tooth, margins (CSS/inline, zero network) | **≤250 ms** (hero §8) | Everything else |
| **Any input during the entrance** | The entrance jumps to the settled frame | **same frame** (`heroLife.ts:462–474`) | — |

**Two things that must never be late, and are not on the list because they are not responses:** the
scroll position (never written by us except during an explicitly-invoked ride or the touch soft rest),
and the caption under the thumb (a tween on the same timeline as the scroll, 1:1 by construction).

**The two rebuild events, costed.** A PRM flip and a breakpoint crossing both dispose and rebuild the
master timeline, then `tl.time(at, false)`. Measured budget: **≤40 ms on desktop, ≤90 ms on a mid-tier
phone** — one dropped frame's worth of stall on a preference change, which is honest. Both are rare,
neither happens during a scrub, and neither may allocate a new `World`. **Nothing else in the film is
permitted to trigger a rebuild.**

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
| **pointer** | Over the five controls only: the SR skip link, `#play`, the film's skip note, `#hero-skip`, `#endcard-cta` | `cursor: pointer` on exactly those five selectors |
| **text** | Over the endcard's live DOM text (subline, © line) and nowhere else | Default UA behaviour; the film's captions carry `user-select: none` so the I-beam never appears mid-film |
| **hidden** | Play mode, after `T_CURSOR_HIDE` (2.5 s) of pointer stillness | `html.cursor-hidden { cursor: none }` plus the same on the five controls. Restored on the first `pointermove` **and on any `focusin`**. Only while `play === 'playing'` |

**Never:** `grab`, `crosshair`, `zoom-in`, `not-allowed`, or a `pointer` on anything that is not a
control. The board "does not pan, does not zoom, and accepts no pointer events" (scene book §5.1) — a
`grab` cursor there would promise a demo the frame deliberately refuses.

### 4.2 How the cursor answers the world — three responses, one surface

All three live on the **Cover only**, are read-only, are damped, and are off on touch and under reduced
motion. All three are shipped (`heroLife.ts:640–690`).

1. **Parallax breath.** `gsap.quickTo` on `par.yaw` / `par.pitch`, `PAR_DUR` `power2.out`, capped at
   `PARALLAX_CAP_DEG` (2.2° / 1.2°), applied about the lens after the framing solve
   (`Hero.tsx:174–177`). Input normalised to viewport centre. **Clock:** UI (rAF), not film.
   **Reverse:** n/a — it is a presence, not a timeline entry.
2. **He notices you.** Head-track cone yaw ±14°, pitch −10°…+6°, chased at `TRACK_TAU` (`k = 1 −
   exp(−dt/τ)`, `heroLife.ts:762`) and split neck 0.4 / head 0.6 — the same cascade `look()` authors.
   First cursor entry over the island earns the one-per-session ear-perk (`PERK`, **settle** lane,
   deliberately not puppet: it must read *noticed*, not cartoon). After `SCRITCH.afterS` of stillness
   he loses interest and goes back to work — a 1.8 s pencil loop, his only idle act, returning home on
   `SCRITCH_TAU`.
3. **The almost-touch.** One uniform triple (`rig.touch`, `rig.touchR`, `rig.touchAmt`) driving a ≤6%
   amber lift on the **graphite half only** — it lives on the Prep branch of the shader
   (`trilayer.ts:400–405`), so it can never paint. `T_UI_MAX` in, `T_BEAT` out, through **one** tween
   path (`heroLife.ts:591–601` records that a dual-`quickTo` pair cut the warmth to zero instead of
   decaying it). Cost: one uniform write per move, zero draw calls, zero React state.

### 4.3 In the film: nothing, and that is the design

Between the handoff and t64.5 the pointer does **nothing**. No hover, no parallax, no hotspot, no
clickable prop. The film's input is the scroll and the film says so with its own silence. This is not
an omission to be filled later; it is the setup for §5's punchline.

Implementation: `#overlay` is `pointer-events: none` except the controls; the canvas has no handlers;
the play button lives outside `#overlay` (`App.tsx:340–342`) precisely so it can blend against the
blackout and still be hit.

### 4.4 At the endcard: one response, and it is the film's own rule

The CTA. Eleven scenes taught *what the goblin touches comes alive*; the button is drawn and the
visitor's pointer is the touch. Full spec in §5.

### 4.5 Touch equivalents

| Cursor behaviour | Touch equivalent |
|---|---|
| Parallax breath | **None.** `onPointer` returns early on `pointerType !== 'mouse'` (`heroLife.ts:644`) |
| He notices you | **One glance-up**, once, on the first touch-scroll (`heroLife.glance`, `Hero.tsx:98–100`) |
| Almost-touch | **None.** There is no hover to almost-touch with |
| Auto-hide | n/a |
| Hover state on a control | **`:active` only.** Every `:hover` rule is wrapped in `@media (hover: hover) and (pointer: fine)` — an unguarded `:hover` sticks after a tap on touch, the single most common way a good button becomes a broken one. `styles.css:286` and `:394` ship unguarded today (D-10) |
| Hover as affordance | **Rest state must be self-evidently a button.** The CTA's opaque paper fill, 2 px ink border and offset second pass do that job at rest (`styles.css:229–284`) |
| — | Plus, touch-only: **soft rests** (§7.5), `-webkit-tap-highlight-color: transparent` with a real `:active`, and a 48 px min hit height (`styles.css:240`) |

---

## 5. HOVER AND FOCUS INVENTORY

Every interactive element on the site. All CSS UI transitions run on compositor properties at UI-lane
durations; `motion.check.ts:199–212` pins every `transition:` duration in `styles.css` to
`{T_FLICK, T_UI, T_UI_MAX}` — **which is why `T_BLOOM_CTA` runs in JS, not CSS.**
**`:focus-visible` always receives the identical visual change as hover, plus the drawn rectangle. No
state is hover-only** (scene book §8, Keyboard).

| Element | Rest | Hover / `:focus-visible` | Active | Disabled / absent | Timing · driver | Reduced motion |
|---|---|---|---|---|---|---|
| **CTA** `#endcard-cta` | Graphite outline, opaque paper fill, 2 px ink border; second border offset 3 px, rotated 0.4°, opacity 0.45, boiling ≤0.8 px | **Amber `#F2C35E` blooms through the letterforms from the pointer-entry side**; the contact shadow arrives beneath *with* the colour (the film's rule); offset border re-inks 0.4°→0.9°; fill inverts to ink, label to paper | Fill deepens to ink, label to paper, 2 px settle | **When `CTA_IS_LIVE` is false the anchor does not render at all** and the subline stands alone. `App.tsx:21–26` ships `DISCORD_URL = '#'` and renders it anyway, dropping only `target`/`rel` — a dead `#` in the tab order today (D-18) | bloom `T_BLOOM_CTA` 0.18 s **as a GSAP tween on `pointerenter`/`focus`, killed and reversed on leave/blur** · border `T_UI` CSS (`styles.css:284`) · fill `T_UI` CSS (`:249`) · press `T_FLICK` CSS | Bloom becomes a plain crossfade at the same duration; no scale, no boil. **The state change is kept** — ≤250 ms colour changes are not vestibular triggers |
| **play / pause / replay** `#play` | 0.75 opacity. **`mix-blend-mode: difference` moves off the button and onto its two children** (`#play > svg, #play > span`) so it reads on paper *and* on the blackout while the button itself stays unblended and can own a focus ring (§5.1) | opacity 1 (shipped, `T_UI_MAX`) **+ the label underline draws on** over `T_FLICK` | 1 px dip (`transform: translateY(1px)`, `T_FLICK`) | Never disabled. Label and `aria-label` swap by mode (`App.tsx:344`), driven as a **function of `t`** (§5.2), not by the shipped scroll listener | `T_UI_MAX` opacity, `T_FLICK` underline and dip · CSS | Underline becomes a fade; opacity and dip kept |
| **skip note** (film, from t16.5) | Penciled, `WHISPER`→80% ink, Quiet Serif | ink 100%, the arrow advances 3 px | — | **Not in the DOM's tab order before t16.5 or after t64.5** — `hidden`, driven as a pure function of `t` (§5.2), never a callback. **Focus rescue on hide** (§5.2) | `T_UI` · CSS | Ride becomes an instant jump (`App.tsx:186` already branches) |
| **hero skip note** `#hero-skip` (returners) | Penciled, 80% | ink 100% | — | Only rendered in film mode after `gg.seen` (`Hero.tsx:310`) | `T_UI` · CSS | Instant jump (`prmAmbient() > 0` gate, `Hero.tsx:247`) |
| **Wordmark** (endcard) | Static drawn lockup | **Ear-perk once per session**, `PERK` (0.3 up / 0.5 settle), **plus** ink 100% from 80% at `T_UI` — the perk is a delight, the ink change is the affordance and it must not be once-only | 1 px dip, `T_FLICK` | Not a link during the film. **At the endcard it is a real `<a href="/">` (Home)**, entering the tab order on the same `inert` flip as the CTA | `PERK` settle lane (perk) · `T_UI` CSS (ink) | Perk off; ink change kept |
| **SR skip link** | Visually hidden (`.sr-only`) | **Becomes visible on focus** — the standard, and non-negotiable | — | **Does not exist today.** Build item: first child of `<body>`, `<a href="#play">Skip to the film controls</a>` | none | none |
| **Subline, © line** | Live DOM text, selectable | Text cursor only | — | — | — | — |
| **Captions, margin, ruler, numeral, world, board** | — | **None, by design** | — | `pointer-events: none` | — | — |
| **hint (`scroll ↓`)** | Boils, bobs 8 px every 6 s | Not a target | — | Dies permanently on first input, never returns (`App.tsx:317` keeps it `display:none` in film mode) | — | Bob off, boil off |

**Five focusable elements. That is the whole list**, and §15.2 step 13 walks exactly it.

### 5.1 The focus rectangle — decided, with a working mechanism

`styles.css:486–489` currently ships `outline: 2px solid var(--line); outline-offset: 3px`. The scene
book (§2, §8) mandates **the drawn double-line rectangle, in the CTA's own offset-border language,
never the browser default, never suppressed.**

**The blocker the draft left open:** `#play` sets `mix-blend-mode: difference` (`styles.css:390`), so
any pseudo-element of `#play` is inside the blended group and the ring inverts along with the glyph —
unpredictable contrast, on the exact element where focus visibility is a hard gate.

**Decision — move the blend to the children, not the button.** `#play` already contains exactly two
elements (`<svg>` and `<span>`, `App.tsx:346–365`). No DOM change is needed:

```css
#play { /* no mix-blend-mode here any more */ }
#play > svg,
#play > span { mix-blend-mode: difference; }
```

The glyph and label keep their inversion against paper and blackout; the button element itself is
unblended and owns `:focus-visible`. Then one utility, on the five focusable elements:

```css
#sr-skip:focus-visible, #play:focus-visible, #film-skip:focus-visible,
#hero-skip:focus-visible, #endcard-cta:focus-visible { outline: none; position: relative; }

#sr-skip:focus-visible::before, #play:focus-visible::before, #film-skip:focus-visible::before,
#hero-skip:focus-visible::before, #endcard-cta:focus-visible::before,
#sr-skip:focus-visible::after,  #play:focus-visible::after,  #film-skip:focus-visible::after,
#hero-skip:focus-visible::after {
  content: ''; position: absolute; inset: -4px; border: 2px solid var(--line);
  pointer-events: none;
}
#sr-skip:focus-visible::after, #play:focus-visible::after,
#film-skip:focus-visible::after, #hero-skip:focus-visible::after {
  inset: -7px; opacity: 0.45; transform: rotate(0.4deg);
}
```

**The CTA is the one override, and it is free:** it already owns `::after` as its offset second border
(`styles.css:274–285`), which *is* the second line, already rotated to 0.9° at focus. It receives only
`::before`. **Two lines, offset, the second rotated off true — the same hand that drew the button.**

*Partially declining the reviewer's cut of this utility:* one rectangle is not two, and the scene book
says double-line. What the cut was really about — `#play` — is solved by the blend move above, so the
utility no longer needs a special case for it. Five selectors, one override, no wrapper element.

`outline: none` without a replacement is a hard failure; the replacement lands in the same commit
(D-9). **Not scriptable.** A human tabs the five elements at both themes and confirms the rectangle is
legible on paper, on the blackout, and on the board (§15.2 step 13).

### 5.2 Anything that changes DOM interactivity is a function of `t`, not a callback

**Three** DOM states are functions of `t`, not two. All are computed in the frame loop from
`tlRef.current.time()`, which is already read there for the idle throttle (`Film.tsx:161`):

```ts
const t = tlRef.current?.time() ?? 0;

// 1. the film's skip note: t16.5 … t64.5
const skipOn = t >= 16.5 && t < 64.5;
if (skipEl.hidden === skipOn) {
  // focus rescue — the only place in the film where a scrub can steal focus
  if (!skipOn && skipEl.contains(document.activeElement))
    (document.getElementById('play') as HTMLElement).focus({ preventScroll: true });
  skipEl.hidden = !skipOn;
}

// 2. the endcard: interactive from t65.0
endcardEl.inert = t < 65.0;

// 3. the play button's mode label — t64.5, per scene book §2, NOT scrollY
const mode = play === 'playing' ? 'pause' : t >= 64.5 ? 'replay' : 'play';
```

Three decisions and three rulings behind them:

1. **`inert`, not `pointerEvents`.** `pointer-events: none` does not remove anything from the tab
   order, and `#endcard-cta` carries its own `pointer-events: auto` (`styles.css:229`) which overrides
   an inherited `none` anyway — so the shipped CTA is clickable for the entire film while sitting at
   `opacity: 0`. **Delete that declaration** and gate the container with `inert`, which removes the
   subtree from hit-testing *and* from the tab order in one property. A visitor pressing Tab at scroll
   0 must not land on an invisible link.
2. **Focus rescue, one branch.** `hidden` on a focused element silently drops focus to `<body>` and
   restarts the visitor's Tab sequence. The branch above runs only on the transition frame.
3. **The play/replay swap moves off `scrollY`.** `App.tsx:166` flips the label when
   `scrollY >= scrollMax − 2`, i.e. at t66. The scene book says t64.5, on the morph. It is the same
   class of state as the other two and it becomes the same pure function. The `scroll` listener that
   sets `'ended'` stays — that is play-mode state, not a label.

All three reverse for free, cost three comparisons, and cannot desync. **Scriptable** (A12).

---

## 6. THE TEXT REVEAL SYSTEM

### 6.1 Two text technologies, and which line uses which

| Voice | Technology | Reveal | Lines |
|---|---|---|---|
| **The Hand** | Authored stroke SVG, `aria-hidden`, verbatim in the SR document | **Write-on**, stroke by stroke, ~15 marks/s | The **eleven** captions; the endcard tagline |
| **The Quiet Serif** (Vollkorn) | Live DOM text, selectable, indexable | **Wipe** — `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` (shipped, `timeline.ts:1013–1017`) | Endcard subline; skip note; © line; hero meta line |
| **The Inscription** (Cinzel 700) | Live DOM inside a real `<a href>` | **Ink-in** — plain opacity, `T_FLICK`, after its container arrives | The CTA label only |

**Wipes on fonts, write-ons on lettering.** A `clip-path` wipe across a rendered typeface reads as a
mask; a dash reveal across an authored stroke reads as a pen. Using the wrong one is the most visible
possible tell that the lettering is not drawn.

**It is eleven captions, not twelve.** `copy-spec.md:25–37` lists eleven caption rows; row 12 is
`endcard`, marked *(block, see below)* — the endcard copy, not a caption. `App.tsx:35–49`'s `CAPTIONS`
array has eleven entries and matches. **Everywhere in this document, in the SR transcript, and in A8:
eleven captions plus the endcard block.** The scene book says "twelve" in four places (§1:22, §2:157,
§8:2186, §8:2419) — filed as D-17 so both documents are corrected in one pass.

### 6.2 The write-on, implemented

The scene book requires the captions become authored stroke SVGs with **the same element ids as today,
so every `cap()` call drives them unchanged** (§2). That constraint sets the whole design:
`cap(id, at, hold, fade)` (`timeline.ts:81–87`) keeps its signature and its two `tl.to`s; only the
*property* they drive changes.

```ts
// per caption element, built once at mount
const paths = [...el.querySelectorAll('path')];
const lens  = paths.map(p => p.getTotalLength());
paths.forEach((p, i) => { p.style.strokeDasharray = `${lens[i]}`; });
const w = { p: 0 }, last = new Int32Array(paths.length).fill(-1);
const applyWrite = () => {
  const c = WRITE_STAGGER;                       // 3 — the hero's own concurrency
  for (let i = 0; i < paths.length; i++) {
    const local = clamp((w.p * (paths.length + c - 1) - i) / c, 0, 1);
    const v = (lens[i] * (1 - local)) | 0;       // integer — sub-pixel dash offsets are invisible
    if (v !== last[i]) { last[i] = v; paths[i].setAttribute('stroke-dashoffset', String(v)); }
  }
};
// cap() tweens `w` instead of `opacity`:
tl.to(w, { p: 1, duration: fade, ease: EASE_SCRUB, onUpdate: applyWrite }, at);
tl.to(w, { p: 0, duration: fade, ease: EASE_SCRUB, onUpdate: applyWrite }, at + hold);
```

**Driver:** the master timeline (scrub lane). **Reverse:** exact — it is a tween `onUpdate` writing a
pure function of that tween's own progress, which satisfies L6 and is why this mechanism is reused
rather than invented.

**The forward exit is an un-write, and that is the decision.** The second `tl.to` runs `w.p` from 1
back to 0 through the same ramp, so `local` for the *highest* index falls first: the strokes erase in
the order the pen would lift, last-to-first. **The forward exit and the reverse exit are therefore the
same read** — one mechanism, one grammar, no second recipe. `cap()`'s existing fade-out is replaced,
not supplemented.

**The cost, stated honestly.** This is *not* `applyStrokes`'s cost class: `heroLife.ts:282` writes
`geometry.instanceCount`, a number on a GPU buffer descriptor, while this writes a DOM attribute and
dirties SVG paint. With `N ≤ 6` paths and the integer guard above, a caption window costs **≤6 short
string allocations and ≤6 attribute writes per frame, inside its own window only** — eleven windows
totalling ≈4.4 t of 66. **§14.2's "zero allocations" claim is amended to "zero allocations outside the
eleven caption windows."** Measure it once (target <0.05 ms/frame); do not build a cache for it.

**The authoring constraint that falls out, and it is binding.** The write-on duration *is* `cap()`'s
`fade` argument, and the rate is ~15 marks/s. Therefore:

> **A caption's authored path count must satisfy `N ≤ round(fade × 15)`** — ≤6 paths at `T_BEAT`,
> ≤4 paths at `T_PUNCH`.

So a "stroke" here is an authored path at **word or word-group scale**, not a pen stroke per letter.
`me3` ("I did.") is two or three paths; `me2` ("You thought I ran away.") is four. This is the number
P6's lettering hand authors to, and it is checkable from the SVG source (A8).

### 6.3 The graphite⇄ink flush — a second tween at the same position, on the same timeline

`light1` writes on in graphite during Prep and must flush to ink as the curtain drops at t20.55;
`set1` writes on in ink and must flush the other way through S4-B5's tick and back on the exhale. The
scene book requires **a 200 ms per-stroke colour crossfade keyed off the curtain value, never a
parallel tween** (§2, §9 risk 9).

**The draft's CSS ramp is cut** (§16.2). Three defects killed it: (1) `W = T_FLUSH / TICK.curtain`
treats curtain-space as linear, but the curtain tween is `SETTLE.arrive` = `power2.out`
(`curtain.ts:201`), so a fixed width in curtain-space is not 200 ms of film-t — near curtain = 1 the
ease is nearly flat and the last strokes take several times longer than the first; (2) the per-path
`--k` cannot be derived in CSS from one `--flush` without a per-path `--i` and `@property`-registered
numbers, neither of which was specified; (3) it wrote a custom property on caption elements **every
frame of the film**, contradicting §14.3's DOM budget a page earlier.

**Decision: author the flush as a second `tl.to` at the same position, the same duration and the same
ease as the curtain tween that triggers it.**

```ts
const flushIn = (capState: {k: number}, at: number) =>
  tl.to(capState, { k: 1, duration: TICK.curtain, ease: SETTLE.arrive, onUpdate: writeFlush }, at);
```

**The scene book's ban does not apply.** It bans "a second clock for the same event". This is not a
second clock — it is the *same* clock. Two tweens at one position on one scrubbed timeline with one
ease render identically at every playhead value, forward and backward, because a scrubbed timeline is
**positional**: `tl.time(x)` renders both from the same `x`. They cannot desync. That is the same
argument that lets the light-blend scalar track the curtain in D-2, and it is the argument the CSS ramp
was invented to avoid needing.

`writeFlush` staggers across the paths in the tween's own progress, not in curtain-space, so the
per-path ramp is honestly `T_FLUSH` of film-t:

```ts
const SPAN = TICK.curtain - T_FLUSH;                  // 0.15 t of stagger across the line
const writeFlush = () => {                            // fires ONLY inside the 0.35 t window
  for (let i = 0; i < paths.length; i++) {
    const start = paths.length > 1 ? (i / (paths.length - 1)) * (SPAN / TICK.curtain) : 0;
    const local = clamp((capState.k - start) / (T_FLUSH / TICK.curtain), 0, 1);
    const step  = Math.round(local * 16);             // 17-entry colour LUT, built once
    if (step !== lastStep[i]) { lastStep[i] = step; paths[i].style.stroke = FLUSH_LUT[step]; }
  }
};
```

**Driver:** the master timeline. **Reverse:** exact — the tween replays backwards, the LUT index walks
back down, and every parked position is a coherent held frame. **Cost:** ≤6 style writes and **zero
allocations** (the LUT is built once at mount), inside 0.35 t windows only.

**Held-frame guarantee (L8):** at any parked scrub position the line's colour is exactly what that
playhead position implies, and the flush can never be mid-way while the curtain is not — they are the
same tween window.

### 6.4 Caption windows — the scrub-domain rules

- **One at a time, ever.** Windows never overlap; ≥0.12 t between consecutive captions edge to edge
  (the `me1–me4` rule, `timeline.ts:306–318`).
- Write-on progress is **linear** (scrub lane). `T_BEAT` default, `T_PUNCH` for the four punchlines.
- Holds are as authored: 0.5–4.0 t. Every window is a pure `tl.to` pair, so backward scrub un-writes.
- **Graphite while `curtain > 0.5`, ink below it** (scene book §2) — via §6.3, on the same tween.
- **The band never crosses the subject.** The `me*` lines seat at 24% instead of the shared 78% band
  because the lower third crosses his tunic at 3.54:1 (`App.tsx:31–34`). A per-caption authored
  property, checked at every breakpoint, **not** a runtime decision.
- **The reading floor is not met inside the `me*` cluster and this is the ruling** (D-8): re-timing is
  a hard gate, so the four rest anchors on the four lines, the touch soft rests, the keyboard stepping
  and the verbatim SR transcript carry it. **Not scriptable.** A human reads §15.2 step 3 at natural
  scroll pace and confirms each `me*` line can be finished before it un-writes.

### 6.5 Live DOM text entering

The endcard's four shipped tweens are kept exactly (`timeline.ts:978–1063`): wordmark opacity 0.3 t at
t65.0 → tagline wipe 0.26 t at 65.23 → subline wipe 0.24 t starting at 60% into the tagline's (65.386)
→ CTA fades and scales 0.96→1 as one object at 65.516, label inks `T_FLICK` after. The overlap is the
point: the two lines read as one beat. All scrub-tied; scrolling back un-writes.

**One change at P6:** the tagline moves from `<p>` + wipe to the Hand + write-on, per scene book §5.2.
The subline stays live DOM with the wipe — it must stay selectable and indexable.

### 6.6 The screen-reader document

First in DOM, visually hidden, `canvas` is `aria-hidden="true"`. It is **the film's canonical
transcript, not a summary.** `App.tsx:219–227` ships a prose précis and is replaced with, in this
order:

1. **The SR skip link** — `<a id="sr-skip" href="#play">Skip to the film controls</a>`, the first
   focusable element in the document. It does not exist today; it is a build item here, in the section
   that rewrites this document anyway.
2. *Skip to joining the Discord* (a second in-page link to the CTA).
3. **The eleven captions verbatim**, in order, with the scene book §8's eleven scene sentences between
   them.
4. The endcard tagline and subline.
5. The real Discord link as a real `<a>`.

It never animates and it is never `hidden` — `.sr-only` clips it (`styles.css:466–476`). **SEO reads
this document.**

---

## 7. SCROLL CHOREOGRAPHY

### 7.1 The engine, restated from the code

Lenis on defaults (`App.tsx:89–95`), wired `instance.on('scroll', ScrollTrigger.update)` and ticked
from the GSAP ticker. `lagSmoothing(0)` for everyone including reduced motion. No `scrollerProxy`.
Under reduced motion **Lenis is never instantiated** (`App.tsx:89`) and native scroll drives the
identical scrub.

The drive is one `ScrollTrigger` on `#track` reporting raw progress, `gearing()` shaping it, and **one
persistent tween** re-pointed per update (`timeline.ts:1086–1099`):

```ts
scrub.vars.t = gearing(self.progress);
scrub.invalidate().restart();     // supersedes the in-flight glide; allocates nothing
```

`duration: SCRUB` (0.8), `ease: 'expo'`, `onUpdate: () => { tl.time(max(0, playhead.t)); preScrub.fn?.(playhead.t) }`.

### 7.2 What one gesture is worth

`#track` is a flat `1800vh` (`styles.css:62–65`); scroll range is `17 × vh`. At a 900 px viewport that
is 15 300 px, and a 100 px wheel notch is `0.006536` of progress. Through `gearing()`:

| Stage | share | span (t) | **t per 100 px notch** |
|---|---|---|---|
| The Cover | 0.035 | 2.31 | 0.43 |
| S1 The Claim | 0.105 | 10.2 | **0.64** — **the loosest gearing on the site.** The blackout is the *most* film per pixel, deliberately: impatience through the cold open is rewarded with story rather than punished with scrolling |
| S2 The Address | 0.12 | 6.3 | 0.34 |
| S3 Proof of Light | 0.16 | 10.0 | 0.41 |
| S4 Proof of Scenery | 0.12 | 9.5 | 0.52 |
| S5 Proof of Time | 0.20 | 14.0 | 0.46 |
| S6 The Many Jobs | 0.08 | 7.5 | **0.61** — the montage, deliberately quick |
| S7 The Handover | 0.12 | 7.0 | 0.38 |
| S8 The Table | 0.06 | 1.5 | **0.16** — the endcard gets the most runway per pixel on the site |

**Portrait/touch — FORWARD, not shipped.** `styles.css:62–65` is a flat `1800vh` with no media query,
and `gearing.ts:12` marks portrait track sizing as *P14 scope*. The intended figure is `~950vh`, range
`8.5 × vh`, ten confident flicks across the film, **one flick ≈ 6.6 t** — with which no flick can cross
a whole stage except S6 (7.5 t), the one stage designed to be flicked and the one with no rest anchors.
**Everything §7.5 and §15.2 step 11 conclude about phone flick behaviour rests on that unbuilt number**
and is re-verified when it lands.

### 7.3 Tick, flick, fling, parked

| Gesture | What the visitor does | What the film does |
|---|---|---|
| **Tick** | One notch | The scrub tween re-points and closes ~0.4 t over 0.8 s expo. Because expo front-loads, ~63% lands in the first ~0.25 s: the response is immediate, the settle is soft |
| **Flick** | A fast swipe or several notches inside 0.8 s | Each update **re-points the same tween and restarts it**. No queue, no accumulation: the playhead always eases toward the *latest* target from wherever it is. A four-notch flick is one continuous 0.8 s glide, not four |
| **Fling** | Momentum carries hundreds of pixels | Identical mechanism at a larger delta. `tl.time(x)` renders the timeline *through* everything between the last time and `x`, so no `tl.set` is ever skipped however large the jump — sets are positional, not sampled |
| **Parked scrub** | The thumb stops mid-beat | The tween completes and stops writing. The frame that remains is a **held frame** and L8 makes it a shippable one. `world.t`/`gobT` keep running, so a parked frame still breathes: the banked idles are what make a parked graphite frame alive instead of dead (§10.4) |
| **Faster than the film can settle** | Sustained fast scroll | The playhead runs perpetually ~0.3–0.8 t behind the target and never catches up until the visitor stops. **This is correct and it is the mass.** Nothing degrades: no per-frame state to skip, no callback to miss, and `lagSmoothing(0)` guarantees no post-hitch catch-up jump |

### 7.4 Reverse

Reverse is not a mode. It is the same mechanism with a decreasing target, and everything in L5–L7
exists to make it identical. The film's best moments are authored *for* it: the ravens un-scatter, the
wizard un-fires, the die un-paints, the map stands back up, the captions un-write. **The film is as
long backwards as forwards and it is a different film.**

### 7.5 Rest anchors — seventeen, and what they power

`open2 · me1 · me2 · me3 · me4 · lantern · mushroom-stop · world-return · set1 · mountain-reveal ·
nat-1 · look-at-us · the-20 · welcome · tended-cairn · between-pitches · endcard` (scene book §2).
**S6 has none, by design** — `PgDn` jumps it. **No anchor lands mid-void:** the S3-B1 travel-line
window (t16.5–17.0) is deliberately anchor-free.

They power four things:

1. **Touch soft rests — the one exception to L3.** When Lenis reports velocity at rest (`lenis.velocity`
   under its own epsilon; **no detection window token is needed and none is added** — §16.2), and the
   **scroll target** is within ±0.35 t of an anchor, ease to it over `T_REST` (0.22 s) via
   `lenis.scrollTo(gearingInverse(anchor) × scrollMax)`.
   **The test reads `gearing(ScrollTrigger.progress)`, not `tl.time()`.** During momentum the playhead
   trails the scroll target by up to 0.8 t of expo glide, so the two give different answers and pick
   different anchors — and the scroll target is the position the ride is about to write.
   **Cancelled by any input, off on desktop, off under reduced motion.** This is what stops the four
   `me*` lines sitting half-written on a phone.
2. **Keyboard stepping** (`↓/↑`), `T_STEP` `power2.out`.
3. **Reload restore** (§12.3).
4. **Reduced-motion stepping** and PRM play mode (§13.4).

### 7.6 Play mode — shipped, and to build

Play drives the same scrub at a true **1 t/s** by advancing film time and mapping back through
`gearingInverse` (`App.tsx:123–139`), so speed is constant in `t` across a piecewise scroll map.

**Shipped, verified in `App.tsx`:**

- Accumulates `t` in a local, **never** re-derived from `window.scrollY` (integer round-trip loses ~8%
  of pace per frame — `:115–121`).
- `dt` clamped to 0.1 (`:126`).
- **Any deliberate input yields instantly** (`:142–152`).
- **`visibilitychange` pauses** (`:146–148`). Both the clamp and the listener stay: belt and braces.
- Never loops; ends at `'ended'` (`:134`).

**To build — none of this exists today:**

- **`Space` binds to play/pause with `preventDefault()`**, and only when focus is not on a control (§3).
- **On `'ended'`, focus moves to the CTA with `preventScroll: true`.** `App.tsx:135` calls
  `setPlay('ended')` and nothing else.
- **The label swap moves to t64.5 as a function of `t`** (§5.2), off the `scrollY >= scrollMax − 2`
  listener at `:165`.
- **PRM play mode steps anchor to anchor** (§13.4). **Today it does not**: with Lenis never
  instantiated under PRM (`App.tsx:89`), the play loop runs a per-frame `window.scrollTo(0, y)` — 60
  discrete repositions a second, which reads as smooth auto-motion delivered to a visitor who asked
  for none. That is a **live WCAG 2.3.3 / 2.2.2 defect on main**, not a plan, and it is filed as D-16.

### 7.7 Ends

Native rubber-band at the top. Hard stop at the endcard; nothing renders below it. Reload behaviour is
§12.3, decided at D-7.

---

## 8. CAMERA MOTION

### 8.1 The vocabulary — seven move classes, all shipped, none new

**Breath leaves this table.** It was the eighth class; it is now a scale on the board (§9.2), because a
per-frame camera write fights `Film.tsx:200–205`'s pull-back invariant. `HERO_DOLLY` survives unchanged
— it runs on the hero's own camera, which has no pull-back solve.

| Class | Recipe | Ease | Duration | Uses |
|---|---|---|---|---|
| **Cut** | `cut(at, pos, look)` — a `tl.set` pair on `camera.position` and `world.look` (`timeline.ts:107–110`) | — | 0 | Nine page turns; the intra-stage setups at 7.5, 9.5, 16.5, 38, the six montage cuts, 57.5, 58.0/58.3 |
| **Rail (travelling follow)** | `cam()` with the beat's own window as duration (`timeline.ts:451–452`, `c2Window` = 1.857 t per stop) | `SETTLE.move` | = the beat | S3's whole run, S4-B1/B2, S5-B1, S6's 0.09 drift |
| **Push-in** | `cam()`, straight line, position and look on the same duration | `SETTLE.move` | 1.15–2.0 t | Exactly two: S2 12.5→13.7, S5 42.4→44.4 |
| **Dolly-back** | `cam()`, straight line, opening the frame | `SETTLE.move` | 1.5–2.5 t | S5-B3 (40.75→42.2), S5-B7 (46.5→49) |
| **Rise** | `cam()`, axis-locked vertical | `SETTLE.move` | 3.5 t then 2.5 t | S7 only (58.5, 62). `T_CAM_MAX` 2.5 is the band; **3.5 is the one authored outlier, reserved for this move** |
| **Drift** | `cam()` at 9% of the cut-to-focus vector | `power1.out` | 1.15 t | The six montage cuts (`timeline.ts:789–796`) and S4-B5's flicker — its **only** camera move |
| **Tilt** | `cam()` moving `world.look` while position holds | `SETTLE.move` | ≤1 t | S6-B7 only |

`sky()` and `skyCut()` grade the fog colour (`timeline.ts:119–126`) — camera-adjacent, not moves.

**No FOV tweens. Zero exist and none may be added.** The lens is owned entirely by `framing.ts`:
`fitFov` holds the composed horizontal field, clamped 42°–70°, and `fitPullback` steps the camera back
along its own axis once the clamp bites, capped at `MAX_PULLBACK 2.2`. Both are **resize-driven only**
and applied per frame idempotently by comparing authored vs applied positions (`Film.tsx:200–205`) —
the trick that stops the pull-back compounding while a tween is not writing, and the invariant that
`BOARD_BREATH` may not touch.

### 8.2 Cut versus move

> **A cut may only land on a frame the audience has not been in.** A hard cut is the one moment a set
> can appear for free (`timeline.ts:159–163`, written the day the theatre popped in mid-shot).

Everything else moves. Corollaries:

- A cut back to a frame we just left is a **held** frame (S7-B1's 0.8 t on the S1 rim angle), and it
  must earn the hold with new content — there, the tended dressing.
- Two cuts inside 0.5 t is a flicker, not a montage. The six page turns sit 1.25 t apart.
- **A cut and a move never share a mark** except the montage's authored `at + 0.04` drift, which is
  what turns six locked-off frames into a montage rather than a slideshow (`timeline.ts:784–788`).

### 8.3 The camera during a freeze — L10, stated as staging

The tick stops `world.timeScale`; the camera is on the master timeline and is **not** affected.

| Freeze | Camera inside it |
|---|---|
| t12.5 (S2) | The push-in to the address close, 12.5→13.7 |
| t33.1 (S4-B5) | The shipped 0.09 drift, 33.15→34.1. **One move only** — no push-in, no insert, no new setup |
| t40.6 (S5) | The dolly back 40.75→42.2 opening the flagship framing; the single push 42.4→44.4; the pull 46.5→49 |

The rule for authoring inside a freeze: **one move, one direction, no cut.** The freeze's argument is
that the visitor can look around a stopped world; a cut inside one takes that back.

### 8.4 At a stage join

Stage boundaries are **gear changes, not cuts** (scene book §4). The playhead is continuous across
them; only `dt/dscroll` changes. A `cam()` that straddles a boundary is legal and renders identically —
the tween knows nothing about gearing.

Two boundaries spend a transition (t50 and t57.5, both page turns). The rest — 10.2, 16.5, 26.5, 36,
64.5 — are crossed inside a continuing shot. The two that matter for camera:

- **t26.5**: `[24.5, 5.2, 6.2] → [30.5, 1.0, 0]`, ≈26°, mid-rail. The rail simply continues.
- **t36**: the walk-through begins mid-run. No cut; the flat's braced back wipes frame and an exposure
  crossfade opens on the tavern.

### 8.5 The seven rules that keep 48 beats from being a rollercoaster

1. **One move per beat.** If a beat needs two, it is two beats or it is one move with a longer
   duration. *(A `portraitLook` is not a second move — it is the same move's alternate destination,
   selected at build. See §8.6.)*
2. **Straight lines only.** Every `cam()` is a two-point tween on position plus a two-point tween on
   `world.look`; the path is a straight segment. No arcs, no spirals, no orbits, no free camera.
3. **No roll, anywhere in the film.** Not "≤8°" in practice — zero. There is no authored `rotation.z`
   on the camera and A5 greps for one.
4. **Angular velocity ≤25°/s at play pace.** Checked from `world.look`'s travel over the tween's
   duration at the shot distance — a rail that swings the look target 40° in 1 t fails.
5. **The bench clamp: elevation 20°–75° in every shot.** Straight-down is legal only where the frame's
   content is the finished map — S7 from t62, and S8 (scene book §0, amendment 3).
6. **The sheet edge is in every travelling wide.** An island's cut edge low in frame is the only thing
   that tells the eye the camera is moving *over a page* rather than floating. Composition doing a
   motion job, and it costs nothing.
7. **Stillness is a move.** S7-B1 holds dead still after six montage cuts; S5-B4 holds dead still
   because the framing *is* the flagship. Both are authored decisions with the same weight as a rise.

### 8.6 `portraitLook` — the second authored framing, decided

Scene book §7 makes a second authored camera target mandatory on every **A**-flagged beat (~30 of 48),
and `figure.check.ts` asserts the figure floor at three portrait widths. The draft named it once and
gave it no mechanism. Two readings were available and both are wrong: a per-frame blend on a viewport
boolean is runtime state in the scrub domain (L5), and a second `cam()` at the same mark violates
rule 1.

**Decision: one build-time flag, threaded exactly like `prm`.**

```ts
const tl = buildTimeline(world, camera, scene, caps, { prm, portrait });
// inside buildTimeline, cam() and cut() read:
const look = portrait && beat.portraitLook ? beat.portraitLook : beat.look;
```

`buildTimeline`'s signature (`timeline.ts:64–71`) gains one options object carrying both flags. `cam()`
writes absolute positions at build time, so selecting the variant is free at build and costs nothing
per frame.

**A breakpoint crossing is a rebuild, not a tween.** It is the same event class as a PRM flip: dispose,
rebuild with the new flag, `tl.time(at, false)`. That means it inherits §13.2's relative-tween fix
without a second mechanism — which is the whole reason to make it a flag and not a runtime blend.
Budgeted in §3 at ≤40 ms desktop / ≤90 ms phone, one frame, never during a scrub.

**The breakpoint is the one `framing.ts` already owns.** `fitFov`'s clamp biting *is* the portrait
condition; the flag is `aspect < PORTRAIT_ASPECT`, evaluated on the resize handler that already runs.
Hysteresis of ±0.02 aspect so a collapsing mobile address bar cannot thrash the rebuild.

**This also answers "restack portrait staging"** (scene book §8, resize): portrait staging is authored
into the same flagged branch and lands on the same seek. There is no third mechanism.

**Reverse:** trivially — the rebuilt timeline is a timeline. **Scriptable:** A9 runs `figure.check.ts`
against the `portrait: true` build. **Not scriptable:** whether the portrait framing is *good*. A human
walks §15.2 step 11 on a real phone.

---

## 9. PARALLAX AND DEPTH RESPONSE

### 9.1 What parallaxes

**Exactly one pointer parallax exists on the site: the Cover's** (§4.2), ±2.2° yaw / ±1.2° pitch,
damped `PAR_DUR`, off on touch and under reduced motion.

**In the film there is no pointer parallax and there are no parallax layers.** What the visitor reads
as parallax is real: the camera physically translates through a 3D world, so planes separate by
geometry. S1-B2's field names it "real-plane parallax as the scrub eases", and that is a description of
perspective, not a technique. Parallax strength is therefore not a tunable — it is the shot's distance
and the set's depth, authored in the camera solve.

### 9.2 Where parallax is banned, and why

| Surface | Ban | Reason |
|---|---|---|
| **The margin, ticks, ruler, numeral** | No offset, ever | They are **the sheet the world is drawn on.** A sheet that parallaxes against its own drawing stops being the sheet and becomes a HUD |
| **The captions** | No offset, no depth, no 3D transform | Same, plus they must hold ≥4.5:1 against a band whose position is authored per caption |
| **The paper void** | Nothing to parallax | The void has no depth. It is the page. Giving it a layer would answer the film's central question with the wrong answer |
| **The endcard stack** | No offset, no rotation, no drift | Direction C: "no box, nothing extra". The board is locked top-down and the type sits on it |
| **The board at rest** | `BOARD_BREATH` only — and **as a scale on the board, not a move of the camera** | `board.scale.setScalar(1 + BOARD_BREATH.amp * sin(gobT * 2π / BOARD_BREATH.periodS))` about its own centre gives the identical 0.5% read and touches no camera invariant. A per-frame write to `camera.position` after `Film.tsx:200–205` makes `camera.position.equals(lens.applied)` false every frame, so the breathed position is cached as `authored` and the portrait pull-back multiplies into it — the exact compounding that comment block exists to prevent |
| **The `#blackout` overlay** | Opacity only | It is the house lights |
| **Any 2D layer over the canvas** | There are none, and there will be none | One post pass is the budget (experience §10); a parallax layer is a second compositing surface with its own tone |

**Driver:** `gobT` (it is life, and life does not freeze). **Reverse:** n/a — a pure function of a clock
that only runs forward; it has no authored state to reverse, and a parked scrub still breathes, which
is the point.

### 9.3 Depth is a material property, not a lens effect

**There is no DOF pass in this film and none may be added** (scene book §0, amendment 4). Depth is
expressed three ways, all in-material (`trilayer.ts`):

1. **Performance — fog-to-paper.** `triFade = smoothstep(uTriNear, uTriFar, dist)`; the lit result
   ramps toward `PAPER`, **never grey** (`:306`). In-material, so an island on a bare page needs no
   scene fog.
2. **Prep — line-weight falloff.** `triStroke * (1 - triFade * 0.75)` (`:369–370`): far strokes go
   fainter with more paper show-through, exactly how a pencil renders aerial perspective.
3. **Foreground occluders.** Nearer than `rig.silhouetteNear` (2.5) the drawing gives way to a
   near-black shape (`:383–385`) — *a shape in front of the drawing, not a drawing*.

**The ramp is set per shot, not per stage.** Generalise the hero's own rule: `depthNear = d ×
DEPTH_SHOT.near (0.95)`, `depthFar = d × DEPTH_SHOT.far (2.4)`, where `d` is the solved shot distance
(`Hero.tsx:131–132`). Wire it once in the frame loop from `camera.position.distanceTo(world.look)` and
every shot inherits a correct depth read for free, including the ones a visitor is scrubbing through.
**Driver:** per-frame, but a pure function of camera and look — both of which are timeline-authored, so
it reverses by construction.

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
| **Settle** | 450–700 ms, `power2.out` | `T_GESTURE` (0.5) is the median and `settle()`'s default (`actions.ts:300`) |
| **Overshoot** | Head mass only, ≤4%. **Ears lag `EAR_LAG` +80 ms and overshoot on `back.out(1.3)`** (`actions.ts:377–378`) — 1.3 is `back.out`'s overshoot parameter, not a duration multiplier | Never on the root, never on a prop the camera is on |
| **Anticipation** | A `weightShift` or crouch-load 0.12–0.18 t **before** any limb moves (`actions.ts:289–294`) | And **none at all** on nudge, scritch, tap — competence does not telegraph the easy ones |
| **The one exception** | The d20 throw: crouch 0.30, anticipation 0.28 s / core 0.14 s / settle 0.32 s | It lands *because* it is the only one |
| **Chain order** | pelvis → chest → neck → head → **ears last**; the neck/head cascade is `look()`'s 0.12 offset at 0.9× duration (`actions.ts:322–329`) | Exception: when he is working, the **pencil hand leads and the body follows** |
| **The freeze** | Motion stops in **≤0.10 t, no ease-out**. Only eyes, ears and breath continue | This is his fingerprint. Everyone else in fiction eases out |
| **Recovery** | Back to the working stoop within 0.8 t | He is interruptible, not distractible |
| **Never** | Holds symmetry · moves everything at once · eases in-out evenly | The third is the tell that a figure is tween software |

**Scrub safety, non-negotiable (goblin §11.1).** Every channel is an authored GSAP key on a transform.
`hemFlick` is driven by **authored action keys**, not root velocity and not a spring — both proposals
are rejected by name. Zero per-frame allocation, zero material swaps, zero geometry morphs.

### 10.2 The rig and its per-frame surface

The only per-frame work on the puppet is `applyGait` (`actions.ts:48–72`), which writes **only** into
`swing`/`bob` groups at amplitude scaled by `speed`. At `speed 0` every gait term is exactly 0 and the
authored pose owns him — released, not overridden. `puppet.check.ts` asserts the two channel sets never
overlap.

Breath rides the **gait clock** (`gobT`), so a freeze never stops it, and it fades in as the gait fades
out (`actions.ts:64–71`). That single line is why "That was me." is not delivered by a statue.

Three group additions (goblin §9), all authored-key driven: `hemFlick` (hem rear pivot), `pupils`
(±0.006 u), `hood` (cowl ±0.02 y, driven by the brow channel — already wired at `actions.ts:401`).

**The `EAR_Z` retune is DONE and is not a build item.** `world.ts` already exports `EAR_Z_R = 0.55` /
`EAR_Z_L = 0.85`; `actions.ts:6–7` already imports both; `earBase()` at `:35` already resolves per
side; and `actions.ts:343–360` records *"THE EAR RETUNE (design §13 step 6), done. Every delta below is
measured against the UNEQUAL bases EAR_Z_R 0.55 / EAR_Z_L 0.85"* — with all six `EXPRESSIONS` entries
carrying retuned values at `:361–372`, including the `alarm 0.62` the draft described as a future
outcome. **Gate G8 is closed.** Delete it from every build ledger; costing a shipped pass is how a
round gets spent twice.

### 10.3 The prop transform vocabulary

| Verb | Recipe | Lane | Reverses |
|---|---|---|---|
| **Pop-in** | `scale 0.9 → 1`, `PUPPET.pop` (`back.out`). **Never 0 → 1 on a large prop** — an overshoot from nothing reads as a balloon | Puppet | Trivially |
| **Drop** | `position.y` to an **absolute** floor value, `PUPPET.drop`. **One authored use** (the tavern sign, `timeline.ts:872`, currently `'-=0.95'` and converting to absolute per §2.3) — S6-B3 is where it is spent | Puppet | Verify at flick speed: a bounce run backwards inside a 1.25 t window is a named QA case |
| **Swing / hinge** | `rotation` to an authored angle, settle lane (the cave door's `y: −1.9`) | Settle | Trivially |
| **Segmented arc** | Two or three position tweens, `power2.out` then `power2.in`, with chest/pelvis/ear follow-through | Puppet | **The film's jump grammar** — S1's leap (`timeline.ts:261–269`), the S5 hop, the S7 throw. Author the arc symmetric and it reverses with no recipe |
| **Yoyo micro-loop** | `yoyo: true, repeat: n` with **`n` odd**, `PUPPET.organic` (`sine.inOut`) — the rope, the tap's elbow, the wave's wrist | Puppet | Yes, **only when `n` is odd.** `n + 1` legs must be even or the target rests off its authored base — `timeline.ts:573`'s `repeat: 12` rests the rope 0.15 high today. Asserted (A5) |
| **Scale-out** | `scale → 0`, `SETTLE.exit` | Settle | Yes. **Everything leaves frame by growth or by tween, never by despawn** (scene book §3-S7-B7) |
| **Visibility** | `onlyFor()` triads only (`timeline.ts:143–153`) | — | By construction — `tl.set` un-sets itself |
| **The flatten** | `uTriFlat 0→1` + `scale.y → 0.02` + a rotation settle, `power2.in`, per merged group, offset by `FLATTEN` | Scrub/Settle | **The whole design.** Nothing created or destroyed; the same tween runs backwards |

### 10.4 The banked-idle system — the one genuinely new mechanism

The requirement (scene book §4-4, §9 risk 8): each revealed prop's idle **begins as the reveal shell
completes, rides `gobT`, and has its amplitude gated on the shell's scale so it dies smoothly on
reverse. Nothing may boolean-flip on "revealed."** This is L1's amendment in mechanism form.

Three constraints make the implementation almost write itself:

1. It must ride `gobT`, because `world.t` is stopped for whole stages (t12.5–30, t40.6–47) and a fire he
   lit at t18.35 must flicker inside the freeze.
2. It must be a pure function with no state (L5).
3. Its gate must already be scrub-tied and reversible.

**`reveal()` already provides that gate.** It grows `object.userData.maskShell.scale` from 0 to 1 as a
plain property tween (`curtain.ts:120–132`, shell cached at `:183`). That scalar is exactly the reveal
progress, it is on the master timeline, and it reverses for free.

```ts
// per banked prop, in the frame loop — one lookup, two multiplies, zero allocation
const lit = flame.userData.lit as number;                                    // the SIZE gate
const a   = (prop.userData.maskShell as THREE.Group | undefined)?.scale.x ?? 0;  // the IDLE gate
const amp = a * prmAmbient();
const s   = lit * (1 + FLICKER.scaleAmp * amp * Math.sin(gobT * FLICKER.scaleRate + phase));
flame.scale.setScalar(s);
```

**`lit` is the shell gate's sibling, not its predecessor, and both stay.** `lit` is a scrub-tied 0→1
tween authored at `timeline.ts:375`; it *sizes* the flame, and without it fire2's flames are full size
from t0 and visible in every S1 and S2 frame (`Film.tsx:230–237` is the shipped code and it is
correct). The shell scale *gates the idle amplitude*. Two scrub-tied tweens, two jobs, one multiply
each. **Deleting `lit` was never the instruction.**

No boolean, no `revealed` flag, no callback, no `if`. Scrub back and the amplitude decays to zero
exactly as the colour does — **the life leaves with the paint, which is the film's own rule.**

**The complete banked-idle ledger.** The draft listed nine; the film has these, and every one of them
is in §14.2's per-frame census with a measured cost. Each rides `gobT` and is gated on its own
scrub-tied scalar; **the gate is named for each** because "it's banked" is not an implementation.

| Idle | Mark | Gate (scrub-tied scalar) |
|---|---|---|
| fire2 flicker + embers | 18.35 | `maskShell.scale.x` × `flame.userData.lit` |
| lamppost flame breath | 20.207 | `maskShell.scale.x` |
| cave door settle-creak | 22.064 | `maskShell.scale.x` |
| the three candles: per-candle flicker + glow sway | 56.4 / 56.6 / 56.8 | each candle's own `maskShell.scale.x` |
| **S1-B2 ember drift + cloth** | from t0 | `ambushFlames.userData.lit` (already authored) |
| **S4-B6 rope coil settle** | on his release | the rope's own set-down tween progress |
| **S4 disc dust-mote pass** | on the disc's turn | the disc tween's normalised progress |
| **S5-B1/B2 tavern ambient** (hearth flicker, candle, patron sway) | 38 (set-in) | `onlyFor(tavernSet)`'s own reveal ramp scalar; **hearth and candle additionally gated on their practicals' `alive.value`** |
| **S6-B7 flame flicker under the tilt** | 56.8 | the candle gate above; the tilt does not touch it |
| **S7-B2 ember-roof shimmer** | on set-down | the vignette's set-down progress |
| **S7-B3 river lit dabs** | on set-down | the vignette's set-down progress |
| montage map-sheet paper flutter · monster ±1% breath · sign's decaying 3-swing pendulum · last sapling's leaf sway | per vignette | each vignette's own transform-gated set-down progress |
| chest · mushrooms · signpost · **the die** | — | **none, deliberately.** A lid at rest is at rest; the die is *dead still* through the freeze, and the held-breath rock stays rejected |
| **the NPC miniature** | — | **never idles.** Its stillness among five idling vignettes is the product rhyme, on purpose |

**Reverse for every row:** the shell (or set-down) scalar walks back to 0, the amplitude decays with
it, and the prop parks at its authored pose. **Not scriptable in general** — A1 catches a gate that
fails to return to 0, but not an idle that *looks* wrong mid-decay. A human parks at 25/50/75% of each
reveal in §15.2 step 8.

### 10.5 The practicals — and the two defects the ledger implies

The scene book funds a three-slot practicals array replacing `rigs.ts:131`'s single fixed `PointLight`,
each slot carrying `{ position, intensity, phase }`, all scaled by `(1 − curtain)` because *a drawn
fire emits nothing*.

**That scalar is wrong in two places and both must be fixed before it is applied.**

**(a) S3 — it will show.** `rigs.ts:143` scales the glow by `(1 − c)` where `c` is the **global**
curtain. During S3 the curtain is 1 from t12.5 to t20.55 — so the campfire he lights at t18.35, which
S3-B2 calls *"the frame's only light"*, would emit nothing for 2.2 t and then jump to full in one frame
at the switchover.

**(b) S7 — the scene book's citation is wrong.** Scene book §3-S7-B4 names this exact line as the
mechanism by which each vignette's ambient life dies as its group flattens (*"its glow dies with its
paint, `rigs.ts:143`"*). During the flatten `curtain` is 0 throughout, so `(1 − c)` is already 1 and the
glow never dies there. The line has a second named consumer whose requirement it meets neither before
nor after the D-1 rewrite.

**Decision — one expression that serves both consumers:**

```ts
// per slot; `alive` is the owning material's userData.alive object, held BY IDENTITY (the rig.curtain pattern)
p.light.intensity =
  p.base * flicker(t, ambient, p.phase).glow
         * Math.max(1 - lightC.value, p.alive.value)   // (a) painted page OR he lit it
         * (1 - p.flat.value);                          // (b) and it dies with its own group's flatten
```

- **`max(1 − lightC, alive.value)`** — painted page → full. Frozen page, untouched source → 0. Frozen
  page, a source **he lit** → full. One `max`, no booleans, and it makes *"three embers of motion in one
  frame"* literally true. (`lightC`, not `curtain` — see D-2.)
- **`(1 − flat.value)`** — `flat` is the owning group's `uTriFlat` uniform object, held by identity like
  every other scalar here. S7-B4's glow death rides `uTriFlat`, not the curtain. Scene book §S7-B4's
  `rigs.ts:143` citation is filed wrong as D-15.

**Driver:** the master timeline for both scalars; `gobT` for `flicker()`'s phase. **Reverse:** exact —
three scrub-tied scalars multiplied, no branch. **Scriptable:** A1 samples every practical's
`intensity`. **Human:** §15.2 step 9 walks the switchover frame by frame and confirms the lighting
scalars do not jump.

### 10.6 The action library — what exists and what must be authored

Existing in `actions.ts`: `applyGait` · `reachSolve`/`reach` · `armRest` · `crouchPose`/`crouch` ·
`crouchChest` · `plantFor` · `cameraSideArm` · `stanceOf` · `weightShift` · `settle` · `look` ·
`express` (six poses, retuned) · `peek` · `bolt` · `stoop` · `lift` · `tap` · `haul` · `shrug` · `wave` ·
`nudge` · `dustOff` · `straighten`.

**Nine new verbs. Decided. FIVE HAVE SHIPPED; four remain to author.**

**[ERRATA 2026-09-03 — this read "To author: eight verbs", which double-counted. The goblin doc's five
(`freeze`, `stow`/`draw`, `scribe`, `pocket`, `throw`) plus the scene book's four (`hop`, `hang`,
`plantAndPat`, `touchUp`) is **nine**, not eight; §13 step 7 of the goblin doc always said five and its
table simply did not bold `stow`/`draw`. And the goblin rebuild has since landed all five:
`actions.ts:631` `freeze` · `:669` `stow` · `:694` `draw` · `:722` `scribe` · `:752` `pocket` · `:772`
**`throwDie`** — renamed because `throw` is a JavaScript reserved word. **D-5 is closed. Only the bottom
four rows are outstanding.**]**

| Verb | Owner | Signature intent |
|---|---|---|
| ~~`freeze()`~~ **SHIPPED `actions.ts:631`** | goblin §10 | All swing channels → 0 in ≤0.10 t, no ease-out; 250 ms of nothing but a blink; then `look()` to lens, `alarm` melting to `sly` over 0.6 t, **ears arrive last** |
| ~~`stow()`/`draw()`~~ **SHIPPED `actions.ts:669` / `:694`** | goblin §10, §13 step 7 | The 120 ms tuck behind the right ear before any run or haul, and its inverse. **Always show the stow** |
| ~~`scribe()`~~ **SHIPPED `actions.ts:722`** | goblin §10 | `stoop()` + `wrist.z` ±0.4 rad at 2.2 Hz, head tracking the tip 90 ms late, right ear ticking at each stroke end. **The hero's rest pose is this action paused** |
| ~~`pocket()`~~ **SHIPPED `actions.ts:752`** | goblin §10 | One reach into the front-right skirt, `WORKING_SIDE`, wrist supinating on the way out so the die shows. 0.35 in / 0.25 out |
| ~~`throw()`~~ **SHIPPED as `throwDie()`, `actions.ts:772`** (`throw` is a reserved word) | goblin §10 | The film's one authored anticipation; release at 55°; both ears trail; `pupils` track the die; **then he watches it** |
| `hop()` | scene book S5-B4/B7 | Onto and off the bench. Segmented-arc grammar (§10.3); **author the arc symmetric and the reverse is a hop-down for free** |
| `hang()` | scene book S6-B3 | Guide the drop in from under it, `express('strain')`, then `tap` it level twice |
| `plantAndPat()` | scene book S6-B4 | Set the root ball, pat the soil once, move a pace along the row. ×3 at a quick clip |
| `touchUp()` | scene book S6-B1 | One brush stroke; the paint side arrives along the bristle line. **Used exactly once in the film** |

All eight take caller-supplied `(tl, g, at, dur, …)`, write only into timeline-owned channels, and
**author absolute end values only** (§2.3) — the same contract every existing verb honours.

### 10.7 Named object motions with their own rules

- **The die.** Authored tumble, `SETTLE.heavy` settle, landing **exactly** on the 1-face because the
  camera is about to read it (`timeline.ts:626–639`). **Dead still through the freeze** — `dieWobble`
  stays 0; any rock after the settle reads as the die landing twice. The nudge is 4-frame anticipation,
  weighted tip-over; the endcard send-off roll is 0.9 s `power3.out`. **`timeline.ts:638–639` is L7's
  one sanctioned exception** — a `tl.set` and a `tl.to` on `dieInner.rotation` at the same position,
  where the set is the tween's from-state. `clocks.check` compares set-to-set only and passes it; A1 is
  its only real guard, and §15.2 names t38 as a walk case.
- **The theatre disc.** A `power2.inOut` tween to an **absolute** end rotation over 2.5 t at t32.0
  (`timeline.ts:570`, converting from `'+=${Math.PI}'` per §2.3). **The `SCRUB` glide is its inertia,
  and direction follows the thumb by construction** — it is a scrubbed tween. *No input smoothing
  exists;* `DISC_SMOOTH` is cut (§16.2). If a longer feel is wanted, lengthen the tween's duration
  inside its beat window — that is a position, not a behaviour. Its machinery's boom rotation is slaved
  to the same tween target, so it works whenever the disc works.
- **The flatten.** Twelve groups; `offset = (originX − FLATTEN.x0) / FLATTEN.xSpan × FLATTEN.spread`;
  each runs `FLATTEN.dur` (1.1 t) of `uTriFlat` 0→1 + `scale.y → 0.02` + a rotation settle, `power2.in`;
  the nearest starts at t60.00, the farthest at t60.90, all complete by t62.00. **Driven from one
  timeline position with no callbacks and no `stagger:`.** Each group's `uTriFlat` also scales its own
  practicals (§10.5b).
- **The cliff flattens last** and he rides it down in the final half-beat. He touches nothing: this is
  the one change he does not make by hand, because it is not a change — it is the file being closed.

---

## 11. TRANSITIONS — the catalog, its costs, its reverses

Seven. **No eighth is invented.** Every recipe is pure tweens and paired `tl.set`s; **no callbacks
anywhere, because callbacks do not reverse.**

### 11.1 House lights — Cover → S1, spent once

**Recipe.** The first scroll, `play` or `Space` dims the page to black over the 0.6 s-equivalent slice
of the handoff (`HANDOFF.lights` of `HERO_T`); the paper margin stays at `WHISPER` so the sheet never
fully disappears. Phase B also recedes the graphite island 6% and kills the lantern's ember-dot at 97%
(`heroLife.ts:549–580`). **The visitor caused it.**
**Reverse.** Runs backwards to paper; the frontier re-ignites lantern-first **by geometry** — the
lantern sits nearest the painted rim, so the returning seam reaches it first. No reverse recipe exists
because none is needed.
**Cost.** One DOM opacity tween, one `rig.seamX` tween, one `state.recede` scalar.
**Reduced motion.** Three crossfade steps: settled → graphite still → black (`heroLife.ts:505–517`).

### 11.2 The tick — every freeze · t12.5, t33.1, t40.6

**Recipe, four lines on one cue** (`curtain.ts:196–202` carries the first two today):
`world.timeScale → 0` in `TICK.clock` (0.15 t), `EASE_SCRUB` · `curtain.value → 1` in `TICK.curtain`
(0.35 t), `SETTLE.arrive` · **`lightC.value → 1` at the same position, duration and ease as the curtain**
(D-2; positional, cannot desync) · **the margin layer's opacity `WHISPER → 1` over `T_BEAT` at
`at + 0.1`**, `SETTLE.arrive`.
Instant, never eased, never announced. Nothing else may key off it.
**The margin layer does not exist in the DOM today** — see the build ledger, §12.9. `curtain.ts:196–202`
has two lines and no margin; the breathe is authored in `timeline.ts` against the margin element, not
in `curtain.ts`.
**Reverse.** The same four, mirrored.
**Cost.** Zero assets. Four tweens, one of them a DOM opacity.
**Reduced motion.** Already a cut; unchanged, and it is the house style.
**Held-frame note.** The 0.35 t curtain ramp is the film's most-parked partial state. Every value in it
is a shippable frame (L8) and it is the first thing the QA walk holds.

### 11.3 The exhale — every unfreeze · t30.0, t34.3, t47.0

**Recipe.** `world.timeScale → 1` over `T_EXHALE` + the colour flood on the same cue + `lightC → 0`
tracking the curtain + the margin un-breathes `1 → WHISPER` over `T_BEAT`. **The world resumes
MID-gesture; the freeze never restarted anyone.**

| t | Flood | Payload |
|---|---|---|
| **30.0** | The frontier release: `seamX` 13.0 → 34.0 over 0.3 t `power2.out`, then retired to `1e6` at **`c = 30.34`, paired at `c − PAIR_GAP` = 30.315** | The last graphite leaving the ribbon; the ribbon's ambient starting mid-gesture |
| **34.3** | `curtain → 0` + `snapBack` | The machinery going dark again as the paint returns |
| **47.0** | `curtain → 0` + `snapBack` (`SETTLE.snap` — the punchline reserve) | The cheer completing, the spill-drop landing, the mug rings closing under paint |

**The t30 pair is the reason `PAIR_GAP` exists.** `30.34 − 30.32 = 0.019999999999999574`, which is
*below* `clocks.check.ts:70`'s `>= 0.02` floor and fails the build on this beat's first commit.
`30.34 − (30.34 − PAIR_GAP) = 0.02499999999999858`. **Author it as the expression, never as 30.315.**
**Reverse.** Mirrored tweens. **One-shots may never ride the world clock** — the spill-drop's fall is a
0.2 t timeline tween precisely so it re-hangs on scrub-back.
**Cost.** Three or four tweens.
**Reduced motion.** An instant cut to the resumed state.

### 11.4 The touch reveal — Prep, on his contact · **eight touched props · ten shells · ten `alive` steps**

**[ERRATA 2026-09-03 — "nine uses" was wrong here and in the scene book §4-4, and it contradicted this
document's own §15.2 step 8, which already walks "each of the **ten** reveal shells". The enumerated list
is eight props; the candles carry three marks, three shells and three materials. The **rope** (S4-B4) and
the **road mark** (S6-B1) take `alive` steps but are not touch reveals — both fire at `curtain = 0` in
Performance, where there is no Prep to reveal from.]**

**Recipe, and it is the only legal construction.** On `actionAt`:
**(a)** a paired `tl.set` flips the prop's per-material `alive` uniform 0 → 1 — **a step, never a
ramp**, because colour law 2 bans half-tinted objects; and
**(b)** `reveal()` grows the prop's **mask shell** — a mask-only copy of the prop's own solids
(`curtain.ts:143–185`) — from scale 0 over 0.35 s `SETTLE.arrive`, or 0.6–0.9 s for the lantern, the
candles and the die.
**The shell is the only thing the audience sees**; the flip is what makes the pixels under it colour.
The shell takes the prop's own shape and can never reach a neighbour — the radial version was deleted
for being the airbrushed colour disc the colour script bans by name (`curtain.ts:103–118`), **and it is
not coming back.**

**The eight, by mark.** fire2 18.35 · lamppost 20.207 · cave+door 22.064 · chest 23.921 · mushrooms
27.635 · signpost 29.492 · the die 43.75 · candles ×3 at 56.4 / 56.6 / 56.8. (**Eight props, ten marks,
ten shells, ten `alive` steps** — the candles carry three, each on its own mark and its own material.)
Six of the eight are shipped `reveal()` call sites (`timeline.ts:491–521`); the die and the candles are
new; the two shipped reveals at 29.1 (`tufts`, `treeline`) retire into the t30 exhale.
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

**The pairing rule, and it contradicts the scene book — deliberately, filed as D-13.** Each relocate
cluster (`position`, `rotation.y`, `speed`, `express`) sits at one mark `c`; **its inverse — restoring
the pose the previous beat left — sits at `c − PAIR_GAP`.**

The scene book says the opposite at §4-5 (*"at **identical positions** so reverse replays them in
reverse order"*) and repeats it at §3-S6-B1. **The scene book is wrong here, and it contradicts itself**
— §S5-B1, §S5-B8, §S6 and §S7 all say `tl.set` pairs sit "≥0.02 t apart". The evidence is shipped:
`timeline.ts:144–146` records *"two sets at the same position replay in reverse order on a backward
scroll — the film's first frame came back with the camp missing"*, and `clocks.check.ts:66–74` fails the
build on any same-target pair under 0.02 t. **Build to `PAIR_GAP`;** the correction is routed to the
scene book's owner as D-13, along with its own internal §4-5 vs §S5-B8 inconsistency.

**Reverse.** Replays gracefully — paper, never black.
**Cost.** One `cut()` + one cluster + its inverse. Zero allocation.
**Reduced motion.** A plain cut with no flash frame.

### 11.6 The walk-through — S4 → S5, its only use

**Recipe.** The camera follows him behind the mountain flat; its braced graphite back wipes frame as a
near-black silhouette plane (Prep's `silhouetteNear` language, free). **Darkness t ≈ 37.2–37.9**, held
at `caveDark` lifted one value step (≈`#4E4133`) — **never true black**; the film's only true black is
the `#blackout` overlay at t0–5.5. The margin breathes in `paper` at 55%, measured ≥3.5:1, and **the
numeral flips C3→C4 inside the darkness at t37.6** — the one flip the audience is meant to notice. An
exposure crossfade t ≈ 37.8–38.1 opens on the tavern establish, and **the set swap happens entirely
inside the crossfade** via the shipped `onlyFor` triads (theatre out at 38, tavern in at 38).
**Reverse.** The crossfade mirrors; the triads un-set themselves.
**Cost.** One opacity/grade pair (`tl.set`s `PAIR_GAP` apart) plus the shipped triads.
**Reduced motion.** Two stills separated by one dark held frame — no travelling darkness.
**Three named QA cases, human-eye:** a parked scrub mid-darkness must be a composed frame · the set
swap must hide completely in **both** directions · the S5 establish must be fully composed on the
emergence frame.

### 11.7 The morph — S7 → S8, its only use

**Recipe.** The d20's 20-face fills frame edge to edge by t64.5; the board group's materials fade up
beneath it (already resident, `onlyFor(world.board, 62)` — `timeline.ts:171`) over 0.6 t with
`BOARD_WASH` settling at 0.5 (`:948`, `:961`); the die settles with one 0.15 bounce and exits 64.85–65
(`timeline.ts:937–962`, both relative tweens converting to absolute per §2.3). **No cut — the promise of
the whole film kept.**
**Reverse.** The fades reverse and the die re-enters: the one irreversible-*feeling* move that still
scrubs backward.
**Cost.** Zero allocation — the traversal collects materials once at build (`timeline.ts:951–961`).
**Reduced motion.** A crossfade at the same times.

### 11.8 Not transitions — named so nobody re-classifies them

**Gear changes** (10.2, 16.5, 26.5, 36, 64.5) · **the void hop** · **intra-stage camera cuts** (S1's
setups, S7's `cut(58.3)`) · **sky tweens** · **the frontier** (S3's `seamX` move is a world event inside
one beat).

**The void hop, with its named reverse check.** t16.5–17.0: one constant-offset tween moving goblin,
camera and look together inside an anchorless window where only paper, the line, him and his shadow are
in frame. **S3-B1's binding check:** *no island pixel may be in frame for the full slide window, in both
directions, at every breakpoint.* **Portrait's taller FOV is the risk case.** **The remedy is authored
and pre-approved: widen the anchorless span by 0.1 t** (16.5–17.1) if it fails. This is a walk step
(§15.2 step 4a), not scriptable — a human looks for an island edge entering frame at 390×844 and
768×917, forward and backward.

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

**Any input at any moment jump-cuts to the settled frame** (`heroLife.ts:462–474`), and the jump runs
**events-on**: `progress(1)` with events suppressed also suppressed the stroke tween's `onUpdate` and
left the underdrawing at `instanceCount 0` (`heroLife.ts:476`, `:490`). `done` is set *first* so the
crawl and gate calls stand down instead of aborting the very jump that completes the entrance.

### 12.2 Warm load, and the returner

`localStorage 'gg.seen'`, try/catch-guarded (`heroLife.ts:269–275`). Returners run the whole entrance at
`RETURNER_PACE` 0.6× and additionally get the bottom-right *been here? skip to the table ↓*, which rides
`gearingInverse(64.5) × scrollMax` through App's Lenis over `T_SKIP` (`Hero.tsx:244–250`,
`App.tsx:184–190`). Storage being unavailable is a cold path, not an error.

### 12.3 Reload mid-film — D-7, decided

The scene book requires **resume at the nearest rest anchor, never a raw offset**, so every restored
frame is a composed one. The shipped code always restarts (`App.tsx:75–78`).

**Decision, satisfying both intents:** a **cold** visitor (no `gg.seen`) restarts, because a first-timer
who reloads wants the film. A visitor with a live `sessionStorage 'gg.t'` **resumes at
`argmin |anchor − t|` over the seventeen anchors**. One `sessionStorage` write per second while
scrolling, one read on mount, both try/catch-guarded. `history.scrollRestoration = 'manual'` stays for
both paths — we choose the position, the browser never does.

**The forced pre-render is unconditional and already shipped:** the drive seeds `playhead.t` from
`st.progress` and calls `apply()` before first paint (`timeline.ts:1108–1110`). Keep it and never
regress it.

### 12.4 The stalled path

Elastic, in-world, and shipped. At 85% of the stroke phase, a not-ready page slows the hand to a crawl
(`timeScale × 0.18`); at 100% the pencil rests at the gate, capped at `ENTRANCE.strokes.max` (4 s) of
total stroke time. Past `stallNoteAfter` (3 s) of true stall, the margin pencils **`sharpening
pencils…`** and nothing else changes.

Two hard-won details that must not be refactored away:

- **The gate pauses at most once** (`heroLife.ts:393–406`). A callback that seeks its own timeline
  aborts a `progress(1)` mid-flight.
- **The resume is deferred one ticker tick, parked.** `lagSmoothing(0)` means the first tick after a
  stall carries the whole accumulated delta; resumed synchronously against a stale ticker time, that
  delta teleported the playhead past ignite *and* bloom in one frame (`heroLife.ts:360–377`).

`?stallfonts` in DEV forces the path deterministically with a never-resolving readiness promise.

### 12.5 Chapter streaming, during the film

- **Prefetch by scroll proximity**; play mode prefetches linearly.
- **Paint and underdrawing packed in one KTX2 atlas** per class, so no curtain state can pop between two
  half-loaded halves.
- **Textures are GPU-uploaded when the drive tween is inactive, not on `idle.skip` frames.** The draft's
  hook does not work: `idle.skip` is true only after **twelve seconds** of no input *and* no `t` change
  (`Film.tsx:168–170`), so during normal viewing there are **zero** such frames — and when it *is* true
  the loop `return`s at `:171–173` before any other code, so there is no position to drain from. **Decision:**

  ```ts
  // in Film.tsx's frame loop, AFTER the idle early-return guard
  if (!scrub.isActive() && uploadQueue.length) renderer.initTexture(uploadQueue.shift()!);
  ```

  `scrub.isActive()` is false whenever the visitor has paused for ~0.8 s — orders of magnitude more
  common than a 12 s idle, and precisely the moment a stall is invisible. **Cap: one `initTexture` per
  frame.** A 1024² KTX2 costs ~1–3 ms to upload; two in a frame is a dropped frame. A texture upload
  during a scrub is a stall the visitor attributes to their own thumb.
- **A chapter that is not ready holds the last composed frame plus the margin note.** Never a blocking
  screen, never a spinner, never a skeleton.
- **Bakes are kicked one stage early** (G2): S3's class bakes during S2's idle, S6's during S5's — the
  stage with the film's longest runway, and it is used.

### 12.6 Fonts

Cinzel + Vollkorn self-hosted (`@fontsource`), woff2 preloaded at idle, `font-display: swap`. Both faces
first appear ≥2.4 s in, so a swap cannot flash. **The Hand is SVG and loads with the page.**

### 12.7 The slow-device path

Runtime tiering, §14.5. Nothing about loading changes — the entrance is already elastic — but the tier
verdict is taken **after** the entrance settles, so the load never competes with the measurement.

### 12.8 WebGL unavailable, or context lost twice

**The Picture Book.** The same page renders eight pre-rendered painted frames (one per stage) with the
**eleven captions** and the full endcard as plain scrolling HTML. Same story, same CTA, and it doubles
as the share/SEO surface. Frame 1 is the hero poster (`posterBake`, already a first-class artifact).
Context lost **once** → silent restore at the nearest rest anchor.
Detection: a `webglcontextlost` listener plus a constructor-level probe before mounting the Canvas.
**There is no degraded 3D path** — a half-working film is worse than a good book.

### 12.9 The build ledger — what does not exist yet

The draft cited several of these as if shipped. **Nothing in this table exists in `src/` today.** Each
is named with its owner, its cost class, and where its motion is specified.

| Item | Evidence it is absent | Cost class | Motion spec |
|---|---|---|---|
| **The margin layer** (page margin + ticks, chapter numeral, 66-tick ruler) | `App.tsx` renders `#blackout`, the captions, `#endcard`, `#rail`, `#hint`. There is no margin, ruler or numeral element | One `<div id="margin">` + one `<svg>` per sub-element; **four DOM tweens film-wide** (§12.10) | §12.10 |
| **The film's skip note** (`#film-skip`) | Absent; only `#hero-skip` exists (`Hero.tsx:310`) | One DOM element, one `t`-gate (§5.2) | §5, §5.2 |
| **The SR skip link** (`#sr-skip`) | Absent from the document | One `<a>`, one CSS rule | §5, §6.6 |
| **`uTriFlat`** | `trilayer.ts` declares `uTriCurtain`, `uTriSeamX`, `uTriAlive` — **no `uTriFlat`** (`:214`, `:299`, `:446–451`) | One uniform + one shader branch + twelve per-group uniform objects | §10.3, §10.7, §10.5b |
| **The three-slot practicals array** | `rigs.ts:131` is a single fixed `PointLight` | ~15 lines (scene book §6 table) | §10.5 |
| **Authored stroke-SVG captions** | `App.tsx:231–243` renders `<div>` text nodes | 11 SVGs, `N ≤ round(fade × 15)` paths each | §6.2 |
| **`figure.check.ts`, `draws.check.ts`** | `scripts/` holds 13 checks; neither is among them | Two headless scripts | §15.1 A9, A13 |
| **The Picture Book** | No fallback route exists | 8 baked frames + one HTML page | §12.8 |
| **The `{prm, portrait}` build flags** | `buildTimeline`'s signature is `(world, camera, scene, caps)` (`timeline.ts:64–71`) | One options object, threaded | §8.6, §13.2 |

### 12.10 The margin layer's motion — decided, and it is four tweens

The scene book §2 gives the margin four behaviours. None had a mechanism. All four are authored on the
master timeline and cost nothing per frame.

1. **Whisper/breathe.** The whole layer is **one element** with one opacity: `WHISPER (0.04)` during
   Performance, `1` during a freeze. Six `tl.to` pairs — breathe over `T_BEAT` `SETTLE.arrive` at
   `12.6 / 33.2 / 40.7` (the tick's mark + 0.1), un-breathe over `T_BEAT` at `30.0 / 34.3 / 47.0`.
   **Twelve tweens, one property, on the master timeline. Reverses for free.**
2. **The chapter numeral.** Seven `<span>`s (`C1`…`C7`) in one container, crossfaded by `T_NUMERAL`
   opacity tween pairs at `16.5 / 31.5 / 37.6 / 49.5 / 57.5 / 64.5`. Twelve tweens. **Film-t, so
   `T_NUMERAL` never enters `styles.css`.**
3. **The 66-tick progress ruler — one path, one tween.** Not sixty-six elements and not sixty-six
   per-frame writes. One graphite `<path>` with `pathLength="66"` under one ink `<path>` with the same
   geometry, `stroke-dasharray: 0.55 0.45` (66 discrete dashes across the length), and its
   `stroke-dashoffset` driven by a **single** `tl.to` from 66 to 0 over `duration: RUNTIME` at position
   0, `EASE_SCRUB`.
   **Why this satisfies "visibly accelerates through S6":** the tween is authored in **film-t**, and
   `gearing()` is what maps scroll to t. Where a stage gets more t per pixel (S1 0.64, S6 0.61) the
   ruler visibly runs; where it gets less (S8 0.16) it crawls. The read is free and it is *correct* —
   a CSS `scroll-timeline` would ink linearly in scroll and show no acceleration at all.
   **Cost:** one GSAP DOM tween writing one attribute per frame, inside §14.1's 1.5 ms DOM slice
   alongside `--sky`. **Reverse:** it is one tween; it un-inks exactly.
4. **The boil.** UI-side only, ≤0.8 px, **at rest only, never mid-write**, off under reduced motion.
   **World strokes never boil** — the stroke tiles are baked and still, and that stillness is what the
   freezes read against.

**Contrast floor, binding and human-checked:** interface ink ≥3:1 **in its breathed form**. Whisper
states are always redundant — never the sole carrier of information.

---

## 13. REDUCED MOTION

### 13.1 The stance

`A = 0` means **still, at the lit pose** — not damped, not slowed, not 30%. The film still plays,
because the film is scrubbed by the visitor's own scroll and that is motion they asked for. What goes is
every motion they did not: the glide, the rides, the freezes-as-transitions, the write-ons, the
ornaments, the boil, the parallax, the soft rests.

**Honoured live, no reload**, via `matchMedia` — `rigs.ts:44–50` is the shipped pattern and it is the
one to copy.

### 13.2 How the film becomes 48 stills, mechanically

**Ruling: a PRM variant of the timeline, built by flag, rebuilt on the media-query change with
`tl.time()` preserved.** Both precedents are shipped: `timeline.ts:978–1063` already branches the
endcard on `reducedMotion` at build time, and `heroLife.ts:583–589` already rebuilds a timeline in place
on a live flip, preserving its playhead.

```ts
const tl = buildTimeline(world, camera, scene, caps, { prm, portrait });
// on the media-query change (or a breakpoint crossing, §8.6):
const at = tl.time();
resetRelativeBases(world);                  // ← MANDATORY, see below
disposeTimeline(tl);
tl = buildTimeline(world, camera, scene, caps, { prm: next, portrait });
tl.time(at, false);
```

**The rebuild is only safe because §2.3 banned relative tweens, and that is not optional.** GSAP
resolves `'+='` at a tween's **first render**, against whatever the target holds at that moment. The
film ships six of them (`timeline.ts:268–269, 570, 573, 872, 937, 962`). A rebuild at t=33 would
re-base the disc from its *current* ~2.0 rad and the seek would render `2.0 + π` instead of `0 + π`:
the disc, the tavern sign and the endcard throw all visibly jump on a preference flip. The cited
precedent (`heroLife.ts:583–589`) is a short hero-scoped handoff with no relative tweens in it; it does
not transfer to a 66 t film on its own.

**Decision: convert all six to absolute end values** (§2.3), grep-banned by A5. That is the smaller diff
than enumerating and resetting them, and it also makes A1's reversal identity honest — a relative tween
does not reverse to the same value twice if anything else has written the target in between.

`resetRelativeBases(world)` remains in the recipe as a **one-line assertion, not a fixup**: in DEV it
throws if any of the six named targets is off its authored t0 value at rebuild time. It is the tripwire
that catches a relative tween creeping back in past the grep.

Inside `buildTimeline`, `prm` changes six helpers and nothing else:

| Helper | PRM form |
|---|---|
| `cam(at, dur, pos, look)` | becomes `cut(at, pos, look)` **at the move's own start mark** — the visitor gets the destination composition for the whole beat, which is the "held composition per beat" the docs specify |
| `cap(id, at, hold, fade)` | unchanged in timing; the write-on's `onUpdate` is replaced by a plain opacity fade over the same window |
| `tick()` / `exhale` | `tl.set` on `timeScale`, `curtain`, `lightC` and the margin opacity — instant cuts, each pair `PAIR_GAP` apart |
| `reveal()` | `tl.set(shell.scale, 1)` at `actionAt` — a step to the revealed state |
| page turn | the `cut()` and the cluster stay; **the paper flash frame is not authored** |
| the flatten | one opacity cross-fade between the standing and flat states at the same `uTriFlat` endpoints, opacity-stepped, **no sweep** |

Everything else — the goblin's acting, the prop transforms, the disc turn — keeps its authored tweens,
because they are the story and they are driven by the visitor's own hand.

### 13.3 The complete mapping, stage by stage

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
no flash · the exposure crossfade → a plain crossfade · **every banked idle in §10.4's ledger** (fire2,
lamppost, cave door, three candles, S1 ember drift and cloth, rope coil, disc dust motes, tavern hearth
/ candle / patron sway, ember-roof shimmer, river dabs, the four montage vignette idles, the spill's
hang) **and the board's breath → still at the lit pose** · soft rests off · boil off · parallax,
head-track, ear-perk, dolly breath, hint bob off · the ruler's ink-in **kept** (it is the visitor's own
scroll) · Lenis never instantiated · the hero entrance → three crossfade steps · the hero handoff →
three crossfade steps · play mode steps anchor to anchor at the same 66 s pacing.

**Kept under PRM:** every UI state change ≤250 ms (they are not vestibular triggers), the CTA's colour
change (as a crossfade), focus rings, the drawn double-line rectangle, all captions, all copy, the
margin's whisper/breathe as instant steps, the entire story.

### 13.4 PRM play mode — a build item, and a live defect it fixes

Play still runs 66 s total, but advances **anchor to anchor**: the next anchor's `t` is reached in
`(t_next − t_now)` seconds by a **single** `scrollTo` at that anchor's scroll position, held for the
remainder. So the *pacing* is the film's pacing and the *motion* is one instantaneous reposition per
anchor. WCAG 2.2.2 holds: nothing auto-advances without user initiation, and it stops on any input.

**This replaces a live defect.** Today, with Lenis never instantiated under PRM (`App.tsx:89`), the play
loop runs `window.scrollTo(0, y)` **every rAF frame** (`:134`) — 60 repositions a second, which is
smooth auto-motion delivered to a visitor who explicitly asked for none. Filed as **D-16**, and it is on
main now.

### 13.5 The live-flip defect

`Film.tsx:17–20` computes `AMBIENT` **once at module scope** from `matchMedia`. A live preference flip
does not reach the film's flicker, ray spin, gait ambient or cloud drift. `rigs.ts:42–51` does it
correctly, live, and exports `prmAmbient()`. **Fix: `Film.tsx` imports `prmAmbient` and calls it once
per frame** — a boolean read, no allocation, and it deletes a module-scope constant. Filed as D-3.

### 13.6 QA handle

`prmForce.ts` wraps `matchMedia` in DEV and persists the force in `sessionStorage`, so a **cold-load**
PRM walk is possible (`__prmForce(true)`, reload). DevTools emulation is not scriptable from outside and
the no-reload flip is a requirement, so the handle is not optional test furniture — it is how the
requirement gets verified at all.

---

## 14. PERFORMANCE ENGINEERING

### 14.1 The frame budget

**60 fps desktop = 16.6 ms.** Mid-tier phone target ≥40 fps = 25 ms.

| Slice | Desktop budget |
|---|---|
| Scroll + GSAP (drive tween, timeline render, DOM tweens) | ≤1.5 ms |
| R3F scene traversal + the film's own per-frame work (§14.2) | ≤2.0 ms |
| **Pass A — normal/depth full-scene render** (every frame) | **≤3.0 ms** |
| **Pass B — mask render** (half res, only while `curtain > 0.001`) | **≤1.0 ms** |
| **Pass C — frame render into `frameTarget`** (4× MSAA) | **≤4.0 ms** |
| Composite quad | ≤2.0 ms |
| DOM / interface (`--sky`, the ruler's dashoffset, caption writes in-window) | ≤1.5 ms |
| Headroom | ≥1.5 ms |

The draft's single "scene draw passes ≤8.0 ms" line hid the fact that `curtainPass.render`
(`curtain.ts:438–491`) issues **three `renderer.render` calls every frame** and a fourth while the
curtain is up. Budget them separately or the ladder cannot be ordered.

### 14.2 What actually runs per frame — measured from the code

**Per frame, always** (`Film.tsx:159–290`):
`world.t += d × timeScale` and `world.gobT += d` · the pull-back's authored-vs-applied compare and one
`camera.lookAt` (`:200–207`) · the key light's re-stage, three vector ops (`:212–222`) · flame flicker
for two groups, soon three practicals (`:225–244`) · three ray-burst `rotation.z` writes (`:247–250`) ·
`applyGait` — twelve rotation writes and two on `bob` (`actions.ts:48–72`) · the cloud wrap
(`Film.tsx:267–272`) · one die wobble (`:275`) · one `--sky` CSS variable write (`:283–286`).

**Plus, and the draft omitted them:**

- **`rigs.update()`'s caster loop** — `for (const mesh of worldCasters) mesh.castShadow = painted ||
  mesh.userData.alive === true` (`rigs.ts:156–157`). This is a per-frame boolean write over a `Set`.
  **It is L5's one sanctioned exception, accepted in writing:** it is a renderer flag, not visual state;
  it is idempotent; it is derived entirely from `curtain.value` and `userData.alive`, both scrub-tied;
  and it is never read back. A per-beat `tl.set` pair would be more authored surface for the same
  answer. **Cap: `worldCasters` ≤ 40 meshes**, asserted (A13). Measured cost at 40: <0.05 ms.
- **The full banked-idle ledger** (§10.4). Nine props in the draft; **fifteen idle sites** in the ledger.
  Each is one `userData` lookup, one or two multiplies and one transform write. Budget: **≤0.35 ms for
  the whole set**, and it is the first line to re-measure when a vignette is added.
- **The margin ruler's `stroke-dashoffset`** — one GSAP DOM tween, one attribute write (§12.10).
- **Caption write-on and flush** — ≤12 attribute/style writes and ≤6 short-string allocations, **inside
  caption and curtain windows only** (§6.2, §6.3). Zero the rest of the film.

That set is a few dozen property writes and **zero allocations outside the eleven caption windows** —
the amended house rule (`Film.tsx:33–37`, `curtain.ts:415–419`).

**The four passes, and the shadow multiplier.**

1. **Mask** — half res, override material, layer 1 only. Already skipped when `curtain.value ≤ 0.001`
   (`curtain.ts:448`), which is most of the film.
2. **Normal/depth** — full res, override material, layer 0, fog nulled (`:462–474`). **This runs every
   frame of the entire film**, because the sketch pass's contour ink is always on. It is a second full
   scene traversal and it is the single largest lever on this page.
3. **Frame** into `frameTarget` (4× MSAA) (`:483–486`).
4. **Composite** full-screen quad (`:489`).

**The shadow ruling, and it is one line.** three.js re-renders the shadow map on **every**
`renderer.render(scene, camera)` call. `<Canvas>` ships no `shadows` prop today (`App.tsx:207–213`) and
`rigs.ts:28` says the rig is *"not yet wired into the film"*, so no shipped number reflects this — but
§14.5 step 2 (shadow map 1024 → 512) and §14.3's "never shed: the alive shadow" both assume shadows are
on. The moment they are, the cost **triples**. Therefore:

```ts
renderer.shadowMap.autoUpdate = false;
// once per frame, before the first pass in curtainPass.render:
renderer.shadowMap.needsUpdate = true;
```

One line of setup and one line per frame, and it is the difference between one shadow render and three.
**Mandatory before shadows are enabled, not after.**

**Ruling on pass 2.** It stays at full res on desktop — it is what draws the film's edges from real 3D
form, and losing it loses the drawing. It is the **first structural thing to shed on a weak device**, at
0.75 resolution then 0.5, before anything the audience can name (D-12).

**Per beat, never per frame:** mask shells (built once, cached at `object.userData.maskShell`),
materials, geometry merges, bakes, the board traversal (`timeline.ts:951–961`), the practicals' slot
assignment (§14.5 step 7).

### 14.3 Throttles and gates

- **Idle throttle**, shipped: 30 fps after 12 s with no input **and no `t` change** — reading `tl.time()`
  is how a scrub counts as activity, because the wheel listener only sees the device, not play mode or a
  HUD jump (`Film.tsx:159–177`). Skipped deltas are **carried** so ambient clocks keep true pace.
  Instant wake.
- **DPR** capped `[1, 2]` (`App.tsx:211`); low tier 1.5. A 3× phone renders 2.25× the pixels for detail
  nobody can see, and this film is fill-rate-bound in the composite.
- **Visibility**: play mode pauses on `visibilitychange`; the `dt` clamp of 0.1 stays as belt and braces.
- **Pointer paths**: `quickTo` and quickSetters only, zero React state per pointer move
  (`heroLife.ts:594–601`).
- **DOM motion**: compositor properties are `transform` and `opacity`. **`clip-path` is not
  compositor-accelerated in the general case** — animating `inset()` triggers paint, and it is what the
  two endcard wipes do (`timeline.ts:1013–1017`, `1035–1039`). They are 0.26 t and 0.24 t on two short
  text lines; **costed as paint, ≈0.3 ms per frame inside those two windows**, and that is fine. Say it
  rather than mis-classify it. **No layout animation, ever.** `will-change` applied on interaction start
  and removed on settle.
- **The per-frame DOM writes are three:** `--sky` (unconditional), the ruler's `stroke-dashoffset` (one
  GSAP tween), and, inside their own windows only, the caption write-on and flush.
- **Scrub hygiene**: state rides uniforms (curtain, lightC, seam, touch, flat), **never material swaps**;
  `lagSmoothing(0)` stays; texture uploads land only when `!scrub.isActive()` (§12.5).
- **Draw calls** ≤120 per stage, measured at each stage's authored camera. The path ribbon island sets
  the ceiling; *"just one more separate mesh"* on the ribbon is where the budget dies first.
- **Materials** ≤40 per-mesh trilayers film-wide; the running census is the scene book's §6 table.

### 14.4 Payload

JS ≤300 KB gz initial · hero-critical ≤2.0 MB · film stream ≤9 MB KTX2 · one post pass · the board bake
is the film's only texture above 1024².

### 14.5 What degrades first, and how the tier is chosen at runtime

**Chosen by measurement, not by user-agent sniffing. One measurement, not two.**

After `entranceDone()`, collect frame times for **90 rendered frames that satisfy
`!idle.skip && scrub.isActive()`** — i.e. frames the visitor is actually scrubbing, which is when the
budget matters — and take the median. Two thresholds: >20 ms → tier down one step; >28 ms → two. **Never
tier back up mid-session** — an oscillating quality level is worse than a low one.

**The draft's t≈20 re-evaluation is cut** (§16.2). With "never tier back up", a second sample can only
ever lower the tier, so it is a one-way ratchet the doc did not cost; and a median taken across a parked
stretch measures near-zero frame times because `idle.skip` frames return before rendering
(`Film.tsx:171–174`), so it could never tier down anyway. **One measurement, on real scrub frames,
answers the same question.**

**The ladder, garnish first, grammar last:**

| Step | Sheds | Costs the visitor |
|---|---|---|
| 1 | DPR 2 → 1.5 | Nothing they can name |
| 2 | Shadow map 1024 → 512, `radius` 3 → 2 (`rigs.ts:121`, `:129`) | Softer contact edges |
| 3 | Particles halved (embers, motes, dust) | Density |
| 4 | Boil → static | The UI stops breathing |
| 5 | Parallax and head-track off (Cover only) | The Cover's presence |
| 6 | Normal/depth target → 0.75, then 0.5 res | Slightly softer contour ink |
| 7 | **Practicals 3 → 1, the slot chosen at beat-authoring time** | S6's three candles share one pool |

**Step 7's rule, decided.** *Not* "nearest to `world.look`". The three candles (S6-B6) sit within about
half a unit of each other and the camera drifts every frame (the montage's 0.09 push), so a per-frame
nearest-slot test flips between candles frame to frame and the light visibly jumps. **On a tiered-down
device the beat's three practicals collapse to one slot positioned at their centroid, chosen once when
the beat's materials are built. Zero per-frame decisions.**

**Never shed:** the curtain pass, the seam, the reveal shells, the alive shadow, the goblin's gait and
breath, the captions, the focus rings, the SR document, the margin's breathe.
*The concept sheds garnish, never grammar.*

### 14.6 Measurement

The DEV HUD (`?hud=1`, tree-shaken in production — `App.tsx:58–61`) plus the shipped console handles:
`__film` (world, tl, camera), `__curtain` (hold any beat behind the curtain), `__sketch` (the pass's
live grading uniforms), `__hero`, `__island`, `__strokeTiles`, `__gob(w, h)`, `__prmForce`. These have
saved more rounds than they cost — *a reach that looks like an arm hanging at his side and a reach that
never fired are indistinguishable in a frame grab.* **No analytics in production**; one `localStorage`
convenience flag (`gg.seen`), try/catch-guarded.

---

## 15. THE QA WALK — the motion gate

Run in order. **A#** items are scriptable and belong in `pnpm check` or a headless walk script.
Everything else names **what a human looks at**, because saying "verify it feels right" without naming
the frame is how a gate becomes a formality.

### 15.1 Before the browser — thirteen assertions

**Step 0.** `pnpm check` green: `clocks`, `motion`, `curtain`, `gearing`, `puppet`, `rigs`, `island`,
`pencil`, `die`, `framing`, `hero`, `hero-life`, `gob`, plus the new `figure` and `draws`.

**A1 — the reversal identity. The single most valuable check on the project.** Headless, Node + three,
no WebGL. Build the world and timeline; sweep `tl.time()` forward across `t = 0…66` in 0.01 t steps
recording a state vector at 200 sample marks; sweep backward through the same marks recording again;
assert `max |forward − backward| < 1e-6` per component.
State vector: `camera.position`, `world.look`, `goblin.root.position/rotation`, `curtain.value`,
`lightC.value`, `rig.seamX/depthNear/depthFar/aliveShadow`, every material's `userData.alive.value`,
every group's `uTriFlat.value`, every `maskShell.scale`, every `onlyFor` target's `.visible`,
`world.timeScale`, every practical's `intensity`, `board.scale`.
**This one test catches every drifted `tl.set` pair, every callback, every integrator, every boolean
flip, every relative tween and the t38 set-then-tween.** It is cheap and it runs on every commit.
**Run it three times: `{}`, `{prm: true}`, `{portrait: true}`.**

**A2 — the seven paired clusters.** For each `c ∈ {50.00, 51.25, 52.50, 53.75, 55.00, 56.25}` and the
t50 handoff: assert `tl.set` sites exist on `goblin.root.position`, `goblin.root.rotation` and `goblin`
(speed) at both `c` and `c − PAIR_GAP`; assert `tl.time(c − 0.001)` leaves him at the previous beat's
pose and `tl.time(c + 0.001)` at the islet stand; then `tl.time(c + 0.5)` → `tl.time(c − 0.5)` and
assert the pose returns. *(The float check is A11's job, not a second implementation of it.)*

**A3 — the nine page turns.** For each mark in `{7.5, 9.5, 50, 51.25, 52.5, 53.75, 55, 56.25, 57.5}`:
assert `#blackout` opacity is 0 across `mark ± 0.1` (**paper, never black**), and that a camera `cut()`
pair exists at the mark.

**A4 — no held partial curtain outside its windows.** Sample `curtain.value` at 0.01 t across 0…66;
assert every sample with `0.001 < v < 0.999` falls inside an authored window:
`[12.5, 12.85] ∪ [33.1, 33.45] ∪ [34.3, 34.42] ∪ [40.6, 40.95] ∪ [47.0, 47.12]`. Anything else is a
partial state nobody authored, and L8 says it will be parked on. **This is what retires
`T_DRAIN_MIN/MAX`** — a new `glidingDrain` call fails here first.

**A5 — grammar greps on `timeline.ts`.** No `stagger:`. No `onComplete`/`onStart`/`onRepeat`. No
`tl.call(`. No `ScrollTrigger` callback other than `onUpdate`/`onRefresh` on the one drive. No `'+=`,
`'-=`, `` `+= `` or `` `-= ``. No `camera.rotation.z`. Every `repeat:` paired with `yoyo: true` is odd.
`onUpdate` allowed only on tweens whose handler is a pure function of the tween's own target.

**A6 — the frontier's window.** `rig.seamX.value === 1e6` for every `t` outside `[20.53, 30.34]`; inside,
monotonic non-decreasing except at the two authored `tl.set`s.

**A7 — the clock.** `world.timeScale ∈ {0, 1}` at every sample except inside the six named ramps
(three ticks ≤`TICK.clock`, three exhales `T_EXHALE`).

**A8 — the text.** **Exactly eleven** caption ids, matching `copy-spec.md` rows 1–11 byte for byte; no
two caption windows overlap; ≥0.12 t gap edge to edge; every caption's authored SVG has
`N ≤ round(fade × 15)` paths (§6.2); the SR document contains **all eleven captions verbatim in order,
plus the endcard tagline and subline**, and contains a real `<a>` to the Discord URL.

**A9 — the figure floor.** `figure.check.ts` on every `A`-flagged beat at 390×844, 500×915, 768×917
(≥84 px) and 1440×900, 1920×1080 (≥100 px), **against the `{portrait: true}` build at the three narrow
widths**. **The `A`/`E` flag in the scene book §3 is the single source of truth** — including S7-B6's
registered exemption, which the beat table must carry or the check fails the throw at 390.

**A10 — draw calls** ≤120 per stage at each stage's authored camera.

**A11 — the pair-gap arithmetic, extended in `clocks.check.ts`, not in a second checker.** The shipped
check already compares numeric same-target `tl.set` positions with a `>= 0.02` floor
(`clocks.check.ts:66–74`) and asserts symbolic positions are textually unique. **Extend it** to
recognise the `<num> - PAIR_GAP` form, evaluate it in floating point, and apply the same floor. This is
what makes the authoring rule (§2.2) enforceable rather than advisory, and it is where the scene book's
§9 risk 17 asked for the montage pairing to be asserted. **Do not build a second headless walk for it.**

**A12 — the three `t`-driven DOM states.** Seek to `t = 16.4 / 16.6 / 64.4 / 64.6 / 64.9 / 65.1` and
assert: `#film-skip.hidden` matches `!(t >= 16.5 && t < 64.5)`; `#endcard.inert` matches `t < 65.0`; the
play button's label and `aria-label` match `t >= 64.5 ? 'replay' : 'play'`. Then assert
`document.activeElement` is `#play` after hiding the skip note while it held focus.

**A13 — the per-frame census caps.** `worldCasters.size ≤ 40`; the banked-idle registry `≤ 20` entries;
`renderer.shadowMap.autoUpdate === false` whenever `<Canvas shadows>` is set.

### 15.2 In the browser — the ordered walk

Every step names what a human looks at. Steps marked **(H)** have no scriptable equivalent at all.

1. **Cold load, cache cleared, `localStorage` cleared.** **(H)** Watch the entrance. **Look for:** paper
   within 250 ms · no layout shift, ever · ticks before strokes · **the lantern igniting before the
   paint** · the goblin arriving on the bloom's edge, not before it · settled ≤3.2 s · **no spinner and
   no skeleton at any moment.** Then `?stallfonts`: confirm the crawl, the note at 3 s, the cap at 4 s,
   and that an input mid-stall still lands on the settled frame.
2. **The handoff. (H)** Scroll one notch. **Look for:** the head snap being the fastest thing on the
   page · the paint draining lantern-last · the ember-dot as the final live pixel at 97%. Scroll back
   up: **the lantern must re-ignite first.** Repeat five times at different speeds; the frame at any
   parked position must be composed.
3. **Forward, slow** (one notch at a time), 0 → 66. **(H)** **Look for:** every transition legible · one
   caption at a time · the caption band never crossing the subject · **each `me*` line readable before
   it un-writes at natural pace** (D-8's only real check) · the ruler visibly running through S1 and S6
   and crawling through S8 · zero console errors.
4. **Forward, natural**, then **forward, flick**. Then **backward, flick**, then **backward, natural**,
   then **backward, slow.** The backward passes are the real test.
   **4a. The void hop's reverse check (H).** At 390×844 and 768×917, walk t16.4→17.1 and back at three
   speeds. **Look for: no island pixel in frame at any point of the slide, in either direction.** If one
   appears, widen the anchorless span to 17.1 (§11.8) and re-walk. Portrait is the risk case.
5. **The seven clusters, individually. (H)** Park just before each, step through at one notch, step back.
   **Look for:** no pose snap, no frame where he is in two places, no prop left revealed on the way back.
6. **The nine page turns, individually,** both directions. **(H)** **Look for:** paper, never black; no
   double flash; the montage's `at + 0.04` drift starting *after* the cut, not with it.
7. **The two must-be-flawless-both-ways moves. (H)** The S4 disc (t31.5–34.3) and the S7 flatten
   (t60–62), at flick speed, both directions, three times each. **Look for:** the disc's turn direction
   matching the scroll direction (it does by construction — this confirms no smoothing crept back in) ·
   the flatten's twelve groups keeping their x-order in reverse · nothing created or destroyed at either
   end · each vignette's practical dying with its own group, not with the curtain (§10.5b).
8. **Held-frame audit. (H)** Park at every partial-curtain value (A4's five windows, at 25/50/75%), at
   all seventeen rest anchors, and at 25/50/75% of each of the ten reveal shells. Every one must be a
   frame you would ship as a still. **Named cases:** mid-darkness in the walk-through · mid-sweep in the
   S3 frontier · mid-flatten · mid-reveal on the lantern, where the idle amplitude is half up.
9. **The S3 switchover, walked alone and first** (scene book §9 risk 2). **(H)** Park at 20.505, 20.51,
   20.53, 20.55, 20.57 and step between them one frame at a time in both directions. **Look for:** any
   change at all in the rendered frame across the four sets. **There must be none** — including the
   lighting scalars (`lightC`, the practicals, the hemisphere), which is what D-1 and D-2 exist for.
10. **The t38 die case. (H)** `timeline.ts:638–639`'s `tl.set` + `tl.to` share a position. Step
    t37.9→38.1 and back at one notch. **Look for:** no rotation snap in either direction. A1 is the only
    automated guard; this is the eye on it.
11. **The S5→S6 frustum case.** `montageSet` opens at 49.5 and `tavernSet` closes at 49.9
    (`timeline.ts:164–165`), so the six islets at `z = −40` are resident for a 0.4 t overlap while the
    tavern establish is still the shot. **(H)** Park at 49.5, 49.7, 49.9 at every breakpoint including
    portrait's taller FOV. **Look for: no islet geometry anywhere in frame.** If one appears, move
    `montageSet`'s open to 49.9 − PAIR_GAP, not the camera.
12. **Play mode.** End to end, foregrounded, 66 s ±1 s. Then: hide the tab mid-play and return (must be
    paused, must not have advanced); yield to input at three points (wheel, touch, key); press `Space`
    with focus on `<body>` and confirm **the page does not page-down**; reach the end and confirm focus
    lands on the CTA with no scroll jump; press replay.
13. **Real phone, portrait. (H)** Soft rests at the four `me*` lines and the look · the portrait track
    (re-verify §7.2's forward numbers once P14 lands) · ten flicks to the end · the figure floor by eye
    at S2-B3, S4-B5, S5-B4, S7-B1 · the three demotable flagship reads · the die's numerals at S5-B2 and
    S7-B7 · **no sticky hover after any tap** (D-10) · rotate mid-film and confirm the rebuild preserves
    `t` and restages portrait in one frame.
14. **Reduced-motion walk.** `__prmForce(true)`, reload, walk the whole film. **(H)** **Look for:** every
    beat has a composed still · **nothing moves that was not scrolled** — in particular PRM play mode
    must step, not glide (D-16) · the story is complete · the CTA still works. Then flip the preference
    **live** mid-film: confirm it takes effect on the next paint with the playhead preserved, and
    **specifically that the disc, the tavern sign and the endcard die do not jump** (this is where the
    relative-tween ban proves itself, §13.2).
15. **Keyboard-only walk.** Tab from load: **SR skip link → play → skip note (only after t16.5) → CTA.**
    **The shipped DOM cannot produce that order** — `#overlay` (containing `#endcard-cta`) renders at
    `App.tsx:229` and `#play` at `:340`. **Build item: move `#play` above `#overlay` in the tree**, and
    the endcard's `inert` gate (§5.2) keeps the CTA out of the order until t65 regardless. Step all
    seventeen anchors with `↓`/`↑`, chapters with `PgDn`/`PgUp`, `Home`, `End`, `Esc`, `Space`.
    **(H) Look for:** the drawn double-line rectangle on every focus, legible on paper, on the blackout
    and on the board · never suppressed, never the browser default · no traps · the skip note not
    focusable before t16.5 or after t64.5 · **focus never lands on `<body>`** when the skip note hides
    under the thumb.
16. **4× CPU throttle.** Walk S3, S5 and S7. **Look for:** the §14.1 budgets holding per pass, no hitch
    at a chapter boundary, **no catch-up jump after a stall** (that is `lagSmoothing(0)` doing its job),
    and no texture-upload stall mid-scrub (§12.5).
17. **WebGL off.** Confirm the Picture Book: eight frames, **eleven captions**, the endcard, the real
    link. Then force a context loss once and confirm silent restore at the nearest anchor.
18. **The gates.** The impeccable pass on the built UI · the clarity contract's seven assertions · the
    art-style guide · zero console errors on a full walk in both directions, on the dev grid and on a
    real phone.

---

## 16. THE DECISION REGISTER

**Every item below is decided.** Where a decision amends a document this one does not own, the amendment
is *routed*, not applied silently — but the build is never blocked waiting for the route.

### 16.1 Decisions

| # | Item | Decision | Route |
|---|---|---|---|
| **D-1** | The practicals' `(1 − curtain)` scalar breaks S3-B2 — the campfire he lights at t18.35 emits nothing until t20.55, then jumps to full in one frame (`rigs.ts:143`) | `intensity = base × flicker().glow × max(1 − lightC, alive.value) × (1 − uTriFlat_of_group)` (§10.5). One `max`, one multiply, no booleans | — |
| **D-2** | The t20.55 switchover moves the lighting scalars, not just the curtain (`rigs.ts:141–144`). `hemi`, `flat` and the practicals all change in one frame; the Prep branch is unlit so the *drawing* is safe, but the alive props and the goblin are lit | **A separate `lightC` `{value}` object.** Everywhere else it tracks `curtain` exactly — one `tl.to` at the same position, duration and ease, which is positional and cannot desync. At S3 it is `tl.set` to 0 at **t20.505**, while the global curtain still holds the whole frame in Prep and the change is therefore invisible. Three sets, three targets, each pair `PAIR_GAP` apart | **APPLIED 2026-09-03** — the `lightC` column and the t20.505 row are now in the scene book's §3-S3 state schedule, with the "never merge these onto one state object" note |
| **D-3** | `Film.tsx:17–20` computes `AMBIENT` at module scope; a live PRM flip never reaches flicker, ray spin, gait ambient or cloud drift | Import `prmAmbient()` from `rigs.ts:51` and call it per frame. One boolean read; deletes a constant | — |
| **D-4** | Token drift `motion.check` cannot see: `heroLife.ts:597–598` uses `0.25` / `0.4` where `T_UI_MAX` / `T_BEAT` are the same values | Rewire the two call sites; add them to `wiredAt` | — |
| **D-5** | goblin §10 prose says five verbs to author; its table bolds four; the scene book mandates four more | **CLOSED 2026-09-03. Nine, not eight** — the table simply did not bold `stow`/`draw`. **The goblin's five have SHIPPED** (`actions.ts:631/669/694/722/752/772`; `throw()` ships as `throwDie()`). **Four remain:** `hop`, `hang`, `plantAndPat`, `touchUp` | Applied to all four docs by the ERRATA pass |
| **D-6** | `GOB_SCALE` has two owners: scene book §7 locks it film-wide at 0.75; goblin §11.2 / gate G7 has the stage solve it for a ≥52 px projected figure | They are different surfaces. **Rename the second `HERO_GOB_SCALE`** and the conflict evaporates. **[ERRATA 2026-09-03 — the rename lands on the shipped symbol: `hero.ts:50 export const GOB_SCALE = 0.75` is read only inside `stageGoblin`, so it IS the Cover's, and it is the one that becomes `HERO_GOB_SCALE`. The film body's `GOB_SCALE = 0.75` is a new film-level constant.]** | Applied to the scene book §7, the direction §6 and the goblin §11.2/G7 |
| **D-7** | Reload behaviour: scene book §8 resumes at the nearest anchor; `App.tsx:75–78` always restarts | **Split** (§12.3): cold visitor restarts, in-session visitor (`sessionStorage 'gg.t'`) resumes at the anchor minimising `abs(anchor − t)` | — |
| **D-8** | The `me*` cluster is under motion §8's reading floor (`hold ≥ chars × 55 ms + 500 ms`) at play pace: `me1` needs 1.16 t and gets 0.55; `me2` 1.77 / 0.55; `me3` 0.83 / 0.50; `me4` 1.38 / 0.70 | **Re-timing is a hard gate and this is not a request to re-time.** The rule is restated: *holds meet the reading floor except inside the `me*` punch cluster, where the four rest anchors, the touch soft rests, the keyboard stepping and the verbatim SR transcript carry it.* **Not scriptable**; §15.2 step 3 is the check | Route the rule's wording to motion §8's owner |
| **D-9** | The focus ring is the browser's (`styles.css:486–489`), not the film's drawn double-line | §5.1, including the `mix-blend-mode` move off `#play` onto its two children. Lands in the same commit as any `outline: none` | — |
| **D-10** | `:hover` is unguarded at `styles.css:286` and `:394` — hover sticks after a tap on touch | Wrap both in `@media (hover: hover) and (pointer: fine)`; add the `:active` states named in §5 | — |
| **D-11** | The SR document is a prose summary (`App.tsx:219–227`), not the transcript | §6.6's document, **eleven captions plus the endcard block**, with the SR skip link first | — |
| **D-12** | The normal/depth prepass runs every frame of the film (`curtain.ts:462–474`) — the biggest single cost on the page, and no doc named it | Keep it at full res on desktop; it is ladder step 6. **Measure it before S3 is polished** — if it exceeds 3.0 ms on the ribbon island, the ladder re-orders | — |
| **D-13** | The scene book says goblin relocate `tl.set`s sit at **identical positions** (§4-5, §3-S6-B1) and, in four other places, **≥0.02 t apart** (§S5-B1, §S5-B8, §S6, the t50 handoff). It contradicts itself | **Build to `PAIR_GAP`.** Identical positions is the exact bug `timeline.ts:144–146` records and `clocks.check.ts:66–74` fails on. `30.34 − 30.32 = 0.019999999999999574` | **APPLIED 2026-09-03** — both "identical positions" sites corrected, all four "≥0.02 t" sites restated as `c − PAIR_GAP`, and the S3 `30.32 / 30.34` retire-pair (which failed the floor as written) rewritten as `c − PAIR_GAP` |
| **D-14** | Three shipped code comments assert the opposite of L1's amendment: `motion.ts:82` (*"FLICKER … all on world.t, so a freeze stills every term"*), `Film.tsx:225` (*"flame flicker reads the world clock — visibly stops during a freeze"*), `timeline.ts:336–341` (*"a fire he lights mid-freeze sits there lit and perfectly motionless … that stillness is the point"*) | The banked-idle ruling supersedes them (§10.4). **All three comments are rewritten in the same commit as the first banked idle**, so nobody builds a new practical against a comment that describes the old thesis | — |
| **D-15** | Scene book §3-S7-B4 cites `rigs.ts:143` as the mechanism by which a vignette's glow dies as its group flattens. During the flatten `curtain` is 0, so `(1 − c)` is 1 and the glow never dies there | The citation is wrong. **S7-B4's glow death rides `uTriFlat`**, per D-1's third factor | **APPLIED 2026-09-03** — the scene book §3-S7-B4 citation is corrected in place |
| **D-16** | **Live accessibility defect on main.** Under PRM, Lenis is never instantiated (`App.tsx:89`) and play mode runs `window.scrollTo(0, y)` every rAF frame (`:134`) — smooth auto-motion delivered to a visitor who asked for none. WCAG 2.3.3 and 2.2.2 | §13.4's anchor-to-anchor stepping. **This is a defect to fix, not a feature to build** | — |
| **D-17** | "The twelve captions" appears in the scene book at §1, §2, §8 (×2) — **and, unfiled until now, in the world direction at §0, §2, §4 (×3) and §13** | **Eleven captions plus the endcard block**, everywhere. Copy is LOCKED and a twelfth line cannot be invented. `ASSETS.md` already reads "eleven narration captions plus the endcard tagline"; its thirteen slots are 11 + tagline + wordmark, and the wordmark is a separate drawn asset | **APPLIED 2026-09-03** — all four scene-book sites and all six world-direction sites corrected |
| **D-18** | `App.tsx:21–26` ships `DISCORD_URL = '#'` and renders the anchor anyway, dropping only `target`/`rel`. A dead `#` link sits in the tab order today, at `opacity: 0`, clickable for the whole film (`styles.css:229`) | **When `CTA_IS_LIVE` is false the anchor does not render**; the subline stands alone. Plus `inert` on `#endcard` until t65 (§5.2) and the deletion of `#endcard-cta { pointer-events: auto }` | — |
| **D-19** | `timeline.ts:573`'s rope yoyo is `repeat: 12` — 13 legs — and rests the rope 0.15 above its authored base | **Yoyo `repeat` must be odd** (§10.3), asserted by A5. Convert to `repeat: 11` and to an absolute end value | — |

### 16.2 The cuts — seven things this document deliberately does not contain

| Cut | Why |
|---|---|
| **`DISC_SMOOTH` (0.35 s) and its paragraph** | A second smoothing clock on a value the 0.8 s `SCRUB` already smooths. A stateful smoother violates L5; a second ease violates L2. The disc is a `power2.inOut` tween on the scrubbed master timeline (`timeline.ts:570`) — the scrub *is* its inertia and direction follows the thumb by construction. 0.35 s also sits inside §2.1's dead zone with no exemption claimed. One sentence replaces it (§10.7) |
| **The `--flush` / `color-mix` / per-path CSS ramp** | Replaced by one `tl.to` at the same position, duration and ease as the curtain tween (§6.3). The stated reason for banning that — *"a second clock … it will desync"* — is wrong on a positional scrub. The cut deletes a per-frame DOM write, an `@property` registration, a per-path `--i`, and an ease mismatch between a linear curtain-space width and `power2.out` |
| **`T_REST_DETECT` (0.15 s)** | A named, tunable token for a condition Lenis already reports (velocity at rest). One knob nobody will ever turn. Folded into §7.5's sentence |
| **The t≈20 tier re-evaluation** | "Never tier back up" makes the second measurement a one-way ratchet, on frames the idle throttle may have zeroed. One measurement after `entranceDone()` on real scrub frames answers the same question (§14.5) |
| **A2's separate float clause** | `clocks.check.ts:66–74` already does exactly this on numeric pairs. **Extend it** to the symbolic `at − PAIR_GAP` form (A11) rather than building a second checker in a headless walk |
| **`BOARD_BREATH` as a camera move — and with it, the eighth camera class** | A 0.5% per-frame camera-position write that defeats `Film.tsx:200–205`'s pull-back idempotence, for a drift nobody consciously sees. `board.scale` gives the identical read and touches no invariant (§9.2). Eight move classes become seven |
| **The global `:focus-visible ::before + ::after` utility** | Scoped to the five focusable elements instead of every `:focus-visible` in the document, with the CTA's existing `::after` reused. **Partially declined:** one rectangle is not two and the scene book mandates a double line — but the reason the cut was proposed (`#play` cannot use pseudo-elements under `mix-blend-mode`) is solved outright by moving the blend to its two children (§5.1), so no special case remains |

---

## 17. GUARDRAILS

No build until its plan is approved. Nothing deploys or publishes. `story/` stays uncommitted. Motion
never overrides the standing bans: **no hatching in any authored mark · no tone mapping · copy is
verbatim · the goblin design and the scene book are locked · runtime `t = 66` and the shipped gearing
are fixed.**

Any new motion names its **token, its lane, its clock and its reverse** — or it does not exist. Any
motion that cannot be asserted by a check script names **the frame a human parks on** — or it does not
ship.
