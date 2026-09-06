# THE TWO CLOCKS — motion & micro-interaction system for the Good Goblin story site

2026-09-02 · Creative-technology layer. Companion to the direction
(`2026-09-02-3d-site-creative-direction.md`), the experience design
(`2026-09-02-experience-design.md`), and the hero (`2026-09-02-hero-design.md`).
Grounded in a full inventory of the shipped film's authored motion
(`timeline.ts` / `actions.ts` / `Film.tsx` / `curtain.ts` / `App.tsx` /
`styles.css` / `framing.ts` — line refs cited where a rule formalizes existing
code). Build requires an approved plan; this document is the system.

---

## 1. Philosophy — five laws

1. **Two clocks.** The world runs on one freezable clock (`world.timeScale`, a
   tweened property — timeline.ts:283); the goblin runs on `gobT`, which never
   stops (his stride `sin(gobT*11)` and breath `sin(gobT*1.9)` are computed
   per-frame, outside GSAP entirely — actions.ts:30–50). Every ambient thing
   joins the world clock; nothing ever gets a third clock without a name (§4).
2. **Scroll owns time.** The master timeline is scrubbed (`scrub: 0.8`,
   timeline.ts:54–62); its default ease is `'none'` — deliberately. On a
   scrubbed timeline, *the visitor's hand is the ease*; authored easing on top
   of scrub is double-easing. Durationed eases exist only inside beats.
3. **Input wins, instantly.** Any input cancels any assisted motion the same
   frame (autoplay already yields on wheel/touch/key — App.tsx:116–119). No
   animation may ever gate, delay, or reinterpret an input.
4. **Three ease lanes, strict borders.** Scrub lane, settle lane, puppet lane
   (§3.2). UI, camera, and type never borrow the puppet lane. Elastic is banned
   everywhere, in every lane, forever.
5. **Motion is grammar.** Every motion in this system maps to one of the named
   transitions or one named micro-interaction. A motion that can't say which
   grammar it performs gets deleted, not tuned.

## 2. Adjudications — where the docs and the code disagreed

The inventory surfaced five conflicts; ruled here so the system has one truth:

| # | Docs said | Code does | Ruling |
|---|---|---|---|
| 1 | "House ease: power2.out for every settle" | Timeline default `'none'`; power2 family only on durationed beats | Both, formalized as lanes (§3.2): linear under scrub, power2 family inside beats |
| 2 | "No overshoots except goblin acting" | `back.out` ×8 on prop pop-ins; one `bounce.out` (tavern sign drop, timeline.ts:849) | Legal — props are actors in this world. Puppet lane only; never UI/camera/type |
| 3 | "The tick is instant, never eased" | timeScale ramps 0.12–0.3s; drains 0.5–1.4s | Two named freezes (§12): the **tick** (perceptual-instant: ≤0.15s clock, 0.35s curtain) and the **gliding drain** (0.5–1.4s, when the curtain movement IS the shot). Both exist today; now they're distinct tools |
| 4 | "Play pauses when the tab hides" | No `visibilitychange` listener; only a dt clamp (App.tsx:103) | Add the listener; keep the clamp as belt-and-braces |
| 5 | (unstated) | R3F defaults: uncapped `dpr`, `frameloop:'always'` | Cap `dpr={[1,2]}`; idle throttle at held frames (§15) |

## 3. Motion tokens

One vocabulary, used by name in specs and code. Durations that live on the
scrubbed timeline are in **film-t units** (1t = 1s at play pace); UI durations
are in real ms.

### 3.1 Duration scale

| Token | Value | Derived from / used for |
|---|---|---|
| `T_FLICK` | 0.12 | snapBack (timeline.ts:90), head-snap, timeScale stops, CTA label ink-in |
| `T_UI` | 0.2–0.25s | the three shipped CSS transitions (styles.css:244/278/386); all button/UI state changes |
| `T_BEAT` | 0.4 | caption fade default (timeline.ts:67–72), margin breathe, per-line write-on |
| `T_PUNCH` | 0.25 | punchline caption fades (`me1` 0.25 — timeline.ts:296) |
| `T_GESTURE` | 0.5 | rig settle default (actions.ts:273); average authored rig beat is 0.52 |
| `T_REVEAL` | 0.8 | curtain reveal default (curtain.ts:86–98); touch reveals run 0.35–0.9 |
| `T_DRAIN` | 0.5–1.4 | curtain state glides (authored range) |
| `T_EXHALE` | 0.3 | timeScale 0→1 resume ramps |
| `T_CAM` | 1.5–2.5 | cam() moves (range 1.2–3.5; 3.5 reserved for the C6 pull-back) |
| `T_BLOOM` | 0.8–1.2s | hero paint bloom, CTA amber bloom is 180ms (a UI cousin, not this token) |
| Hero entrance beats | per hero doc §8 | 250ms paper → 1.2–4s strokes → 0.8s bloom → settled ≤3.2s |

Rules: no durationed UI motion under 100ms except `T_FLICK` acknowledgments;
nothing between 0.25s and 0.4s (the gap keeps UI-speed and world-speed
legibly different); anything ≥0.4s on the film must be scrub-tied.

### 3.2 Ease lanes

| Lane | Eases | Where | Never |
|---|---|---|---|
| **Scrub** | `none` (timeline default, timeline.ts:55) | Everything mapped 1:1 to scroll: caption fades, curtain values, camera rails, the flatten, the morph | Easing a scrubbed value twice |
| **Settle** | `power2.out` (arrivals), `power2.inOut` (A→B moves — the dominant authored ease, 15 uses), `power2.in` (impacts/exits), `power3.out` (heavy settles: die), `power4.out` (snapBack only) | Camera beats, reveals, rig moves, UI enters/exits, lettering | Bounce/back/elastic |
| **Puppet** | `back.out` (pop-ins), `sine.inOut/out` (organic micro-loops, walk-offs), `bounce.out` (one authored drop, grandfathered) | In-world prop/character acting only | UI, camera, type, margin, CTA — ever |

House follow-through is **hand-offset, not stagger**: secondary channels start
at `at + dur*0.22` and heads chase necks by 0.12s at 0.9× duration
(`look()`, actions.ts:293–300). `stagger:` appears exactly once in the film
(the miniature-world flatten, 0.05 — timeline.ts:892) and stays the only one;
new multi-object cascades use the follow-through offset so motion reads as one
body, not a list.

### 3.3 Micro-motion constants

Boil: 2 frames at 6fps, ≤0.8px screen amplitude, UI strokes only, off under
reduced motion. Breath: `0.5+0.5*sin(gobT*1.9)`. Stride: `sin(gobT*11)`.
Flicker: scale `1+0.18A·sin(world.t*9+i)` / `1+0.3A·|sin(world.t*13+i)|`,
glow `4.5+1.6A·|sin(world.t*13+i)|` (Film.tsx:185–189), ray spin
`world.t*0.5A` — `A` = ambient scalar (1 normal / 0 reduced motion, superseding
today's 0.3 — §14). Hero dolly breath ±1.2% @ 13s sine. Moth orbit 2.6s.
UI rises ≤12px. Parallax caps ±2.2° yaw / ±1.2° pitch.

## 4. The clock architecture

| Clock | What runs on it | Freeze behavior |
|---|---|---|
| **Master scrub** | The whole film timeline; `scrub: 0.8` against `#track` (1800vh CSS spacer) | Never freezes; it IS the visitor |
| **`world.t` / `world.timeScale`** | All ambient life: flames, rays, leaves, moths, motes | `timeScale` tweened to 0 in ≤0.15 (the tick) — everything downstream stops same-frame by construction |
| **`gobT`** | Gait, breath, idle acting | Never stops. Alive by construction, not exception |
| **UI clock** | CSS transitions, hero entrance, cursor damping | Independent of the film; pauses for nobody |
| **Boil clock** | 6fps quantized stroke jitter | Off under reduced motion |

**Scrub-safety rules** (each one paid for in a shipped bug):
- Visibility gating goes through `onlyFor()`-style `tl.set` triads
  (timeline.ts:129–139) — tweens un-set themselves on backward scrub;
  callbacks don't reverse.
- Paired `tl.set`s at the *same* position replay in reverse order on backward
  scrub — page-turn flashes and cut pairs sit ≥0.02t apart.
- Any held partial-curtain value (0 < curtain < 1) is QA'd as a *held frame*,
  not in motion — partial frames amplify mask defects.
- First render after load/reload forces one full scrub-render behind the hero
  before unveiling (retires the stale-first-frame gotcha).
- Reload resumes at the nearest rest anchor, never a raw offset.

## 5. Input → response budget

| Input | First visible response | Budget |
|---|---|---|
| Wheel/touch scrub | Lenis transform | same frame (≤16ms) |
| Any input during autoplay | rAF cancelled | same frame |
| Hover (CTA, buttons) | state transition starts | ≤ 50ms (no hover-intent delay; these targets are large) |
| Click/press | pressed state | ≤ 100ms; `T_FLICK` acknowledgment |
| Esc during play | pause | same frame |
| Keyboard step (↑/↓) | scrollTo begins | ≤ 50ms, 450ms power2.out travel |
| Cursor over hero | parallax/head-track lerp begins | next frame, damped (§6) |
| prefers-reduced-motion flips | takes effect | next paint, no reload required |

## 6. Cursor system

The pointer is a **presence, not a tool** — system cursor always, no trails, no
custom sprite. Live surfaces: hero and endcard only.

- **Hero parallax:** `gsap.quickTo` on camera yaw/pitch, 0.55s power2.out
  damping, caps ±2.2°/±1.2°; positional input normalized to viewport center.
  Touch: none. Reduced motion: none.
- **He notices you:** head-track cone yaw ±14°, pitch −6°…+10°, 400ms damped
  chase reusing the `look()` neck→head cascade; 4s idle → return-to-work
  (scritch loop 1.8s); one ear-perk per session on first island entry
  (300ms up, 500ms settle — settle lane, not puppet: it must read noticed,
  not cartoon). Touch: single glance-up on first touch-scroll.
- **The almost-touch:** one shader uniform (cursor world-pos) driving a 90px
  radial ≤6% amber lift on the graphite half; 250ms in / 400ms out. Never
  paints. Costs one uniform write per move, zero draw calls.
- **Auto-hide:** cursor fades after 2.5s stillness during play mode only;
  any movement restores instantly.
- Clicks on world geometry: no handlers exist. Nothing to mis-click.

## 7. Hover & focus inventory — every interactive state on the site

All UI transitions run `T_UI` on compositor properties (the shipped three
transitions stay the pattern — styles.css:244/278/386). `:focus-visible`
always receives the identical visual change plus the drawn double-line focus
rectangle; no state is hover-only.

| Element | Rest | Hover / focus-visible | Active/press | Notes |
|---|---|---|---|---|
| **CTA** | Graphite outline, paper fill, offset border 0.4° boiling | **Amber bloom** 180ms from pointer-entry side (letterforms fill `#E8963E`-family), contact shadow arrives, offset border re-inks to 0.9° (existing 0.2s transform transition) | Fill→ink, label→paper (`T_FLICK` settle) | Click: die rolls 20; new tab |
| **play / pause / replay** | 60% ink opacity | opacity 1 (shipped, 0.25s) + label underline draws on 120ms | 1px dip | Label swaps by mode |
| **skip note** | Penciled, 80% | ink 100%, arrow advances 3px | — | 450ms eased jump on activate; 1.2s ease if animating far |
| **Wordmark (endcard/hero)** | static | ear-perk, once per session | — | Not a link until endcard; at endcard it's Home |
| **hint (scroll ↓)** | boiling, bobs 8px every 6s | — (not a target) | — | Dies permanently on first input |
| **Captions, margin, world** | — | none, by design | — | Pointer-dead per experience doc §5.4 |

## 8. Text reveal system

- **The Hand (captions, tagline):** stroke-SVG dash write-on, ≈15 strokes/s,
  one line ≈ `T_BEAT`; multi-line staggers by the follow-through offset
  (second line starts at 60% of the first — the copy-spec endcard rhythm).
  Un-writes on reverse scrub (dash offset is scrub-tied on the film; UI-clock
  write-ons reverse on state exit). State swap graphite⇄ink: 200ms crossfade
  of two stroke colors, never a repaint.
- **Caption windows (scrub domain):** fade `T_BEAT` in/out (`T_PUNCH` for
  punchlines), holds 0.55–2.5t as authored; windows never overlap — ≥0.12t
  gap between consecutive captions (the me1–me4 rule); hold ≥ chars×55ms+500ms
  at play pace. Linear fades are correct here (scrub lane).
- **Quiet Serif (subline, meta, skip):** `clip-path: inset(0 100% 0 0 → 0 0 0 0)`
  wipes with the shipped opacity-pin pattern (styles.css:216–219) — wipes on
  fonts, write-ons on lettering. Reduced motion: same-window opacity fades.
- **Endcard letter-on (t65.0–66):** wordmark opacity 0.6t → tagline write-on
  0.5t overlapping its tail → subline wipe starting at 60% of tagline →
  CTA fades+scales 0.98→1 as one object, label inks `T_FLICK` after. All
  scrub-tied; scrolling back un-writes.
- **Hero entrance strokes:** ~78 island strokes at 3-stroke stagger (~15/s),
  pacing elastic against asset readiness (min 1.2s, graceful to 4s).
- **White-on-black opens (`open1/open2`):** the only white type; plain opacity,
  scrub-tied.

## 9. Scroll choreography

- **Engine:** Lenis on defaults (shipped — App.tsx:79–90), event-wired to
  `ScrollTrigger.update`, `lagSmoothing(0)`, no scrollerProxy. Reduced motion:
  Lenis never instantiated; native scroll drives the same scrub (shipped
  behavior, kept).
- **Track:** CSS spacer `1800vh` (~27vh per t). Portrait/touch: ~950vh via
  media query — full tale in ~10 flicks.
- **Scrub 0.8 stays.** It is the film's hand-feel: heavy enough that the world
  has mass, light enough that reversal reads within a quarter second.
- **Gearing:** piecewise-linear scrollY→t map per the experience-doc stage
  weights + the hero's 3.5% carve. Implementation: a single `gearMap(y)` used
  by the ScrollTrigger proxy AND its inverse by autoplay, so play mode moves
  at constant *t*-speed (66s) through non-uniform scroll — the shipped linear
  `scrollTo(y)` loop gains the inverse map; everything else (dt clamp 0.1,
  yield-on-input, `'ended'` state — App.tsx:95–148) carries forward, plus the
  new `visibilitychange` pause (§2.4).
- **Rest anchors (~18):** cover-settled, open1, open2, me1–me4, light1
  (lantern), world-returns, set1, mountain-reveal, nat-1, look-at-us, the-20,
  welcome, cairn, pitch1, pitch2, endcard. Powers: touch soft rests (150ms
  idle detect → capture ±0.35t → 220ms power2.out `lenis.scrollTo`, cancel on
  any input), keyboard stepping (450ms power2.out), reload restore, and
  reduced-motion stepping.
- **Ends:** native rubber-band at top; hard stop at endcard, nothing below.
  Autoplay end → `'ended'`, focus moves to CTA with `preventScroll`.

## 10. Camera motion

- **Vocabulary (all shipped, kept):** `cam(at,dur,pos,look)` twin-tweens
  position + `world.look` with one ease (default power2.inOut — timeline.ts:75);
  `cut(at,pos,look)` via `tl.set` pairs; `sky()/skyCut()` grade fog color as a
  camera-adjacent move. **No FOV tweens** — zero exist and none may be added;
  the FOV clamp (42°→70°) + pull-back (≤2.2×, idempotent per-frame —
  framing.ts, Film.tsx:154–159) own the lens, resize-driven only.
- **Durations:** `T_CAM` 1.5–2.5t; 3.5t reserved for the C6 rise; push-ins on
  freezes ~1.5t, straight-line only.
- **Idle cameras:** hero/board breathing dolly ±1.2% @ 13s sine — the only
  non-scrub camera motion on the site, and it never changes framing intent.
- **Vestibular caps (hard):** roll ≤8° ever; angular velocity ≤25°/s at play
  pace; no spirals; cuts are instant (`tl.set`, ≥0.02t pair spacing); the rise
  is axis-locked. Parallax is hero-only and capped (§6).

## 11. Object transforms & the puppet system

- **Rig primitives (shipped, the acting alphabet):** `applyGait` (per-frame,
  gobT), `look` (neck→head 0.12s follow-through), `weightShift`,
  `settle(0.5)`, `express` — six named poses (neutral/sly/flat/strain/smug/
  alarm) tweening against absolute face constants (BROW_Y/MOUTH_Y/EAR_Z —
  world/actions must agree or expressions re-sweep the ears), plus gesture
  verbs: peek, bolt, stoop, lift, tap, haul, shrug, wave, nudge, dustOff,
  straighten. New hero verbs join the same file with caller-supplied
  durations: pencil-scritch (1.8s loop), pencil-tuck (0.4), head-snap
  (`T_FLICK`, expo... **power4.out** — stay in-family), glance-up.
- **Touch reveal:** `reveal(targets,{duration,radius})` — maskShell scale
  0→1, power2.out, 0.35–0.9s, shell recentered on bbox (the ghost-silhouette
  lesson); radius fallback for lines-only props. Color+shadow arrive together.
- **Pop-ins:** `back.out`, scale from 0.9→1 (never 0→1 overshoot on large
  props), puppet lane, world props only.
- **The die:** authored tumble (scrub-tied), settle power3.out; the nudge =
  4-frame anticipation, tip-over weighted, dead-still wobble before it
  (locked: no idle rock). Endcard send-off roll: 0.9s, settle power3.out.
- **Theatre disc:** scrub input smoothed 0.35s → perceived inertia; turn
  direction always matches scroll direction.
- **The flatten:** islands lie down scrub-tied; per-island follow-through
  offsets; the miniature-world `stagger:0.05, power2.in` (timeline.ts:892)
  stays the site's one true stagger.
- **Ambient set:** flicker/ray-spin per §3.3 on `world.t`; moths, motes,
  pollen — Performance-side only, all freezable by construction.

## 12. State transitions — the catalog, with recipes

| Transition | Recipe |
|---|---|
| **House lights** | Page dims 0.6s scrub-tied; margin persists at 4%; hero: island recedes 6% dolly, ember dies at 97% |
| **The tick** | `world.timeScale → 0` in ≤0.15t + `curtain.value → 1` in 0.35t power2.out, same cue (drain rides the freeze — timeline.ts:80–85); margin breathes in `T_BEAT` at +0.1t; silence is the effect |
| **The gliding drain** | `curtain.value` glides 0.5–1.4t when the wave itself is the shot (C2 world-returns); any held partial value QA'd as a held frame |
| **The exhale** | `timeScale → 1` in `T_EXHALE`; `snapBack` 0.12t power4.out reserved for punchlines ("You're welcome.") |
| **Touch reveal** | §11; light/shadow/color one event |
| **Page turn** | 1-frame paper flash via `tl.set` pair ≥0.02t apart; montage cuts + the two S1 cuts only |
| **Walk-through** | Camera follows him behind scenery; darkness ≤2 beats; exposure crossfade, no cut |
| **The morph** | d20 face → board, scrub-tied 1.2t: camera locks, face UV crossfades to board texture, edge-to-edge; reversible |
| **Hero handoff** | Phase A caught (0–55%: head-snap, pencil-tuck, reverse-bloom drain, type un-writes) → Phase B house lights (55–100%) → Phase C black + `open1`; reverse re-ignites lantern-first |

## 13. Loading sequences

- **Hero entrance = the loader** (hero doc §8): stroke scheduler promises-tied;
  lantern ignites before paint; goblin rides the bloom edge; settled ≤3.2s;
  any input skips; returners 0.6×; >3s true stall → *sharpening pencils…*
  margin note. No spinner exists anywhere on the site.
- **Chapter streaming:** prefetch by scroll proximity (play mode prefetches
  linearly); textures GPU-uploaded on idle frames (`renderer.initTexture`)
  never mid-scrub; paint+underdrawing packed in one KTX2 atlas so no curtain
  state can pop; a chapter not ready = hold last composed frame + margin note
  (never a blocking screen).
- **Fonts:** Cinzel + Vollkorn self-hosted (@fontsource pattern stays), woff2
  preloaded at idle, `font-display: swap` — both faces first appear ≥2.4s in,
  so swap can't flash. The Hand is SVG and loads with the page.

## 14. Reduced motion — the complete mapping

Honored live via `matchMedia` (no reload). Today's partial handling (no Lenis;
`AMBIENT 0.3`; rail-ink off) upgrades to:

| Class | Becomes |
|---|---|
| Lenis smoothing | Native scroll (shipped, kept) |
| Scrub-tied camera rides | Stepped held compositions at rest anchors (the picture-book) |
| Freezes/exhales | Instant cuts |
| Write-ons/wipes | Opacity fades, same windows |
| Ambient (flicker, moths, spin) | `A = 0` — still, at lit pose (supersedes 0.3: "damped" motion still moves) |
| Boil, parallax, head-track, soft rests, dolly breath, hint bob, ear-perk | Off |
| Hero entrance | 3 crossfade steps (paper → graphite still → settled) |
| Hero handoff | 3 crossfade steps (settled → graphite → black) |
| Autoplay | Steps anchor-to-anchor on the 66s pacing |
| CTA bloom / UI transitions | Kept (≤250ms state changes are not vestibular triggers); bloom becomes a plain crossfade |

WCAG 2.2.2 stance: nothing auto-plays or auto-advances without user
initiation; idle ornaments (moth, flicker, breath) are subtle, pausable via
play-state, and fully stilled under the preference.

## 15. Performance engineering

**Frame budget @60fps (16.6ms):** scrub+GSAP ≤1.5ms · R3F scene ≤10ms
(desktop) · curtain pass ≤2ms (one full-screen pass, one mask layer — shipped
architecture) · DOM/UI ≤1.5ms · headroom ≥1.5ms. Mid-phone target ≥40fps.

- **Renderer:** `dpr={[1, 2]}` (closing the uncapped default), low tier 1.5;
  `frameloop:'always'` during the film; **idle throttle** at held frames
  (hero settled / board rest): 30fps after 12s without input, instant wake.
  `visibilitychange` pauses autoplay and the UI clock's ornaments.
- **DOM motion:** compositor properties only (transform/opacity) + clip-path
  on caption-scale areas; no layout animation ever; `will-change` applied on
  interaction start, removed on settle; z-index scale stays semantic.
- **Pointer paths:** `quickTo`/quickSetter + damped lerp; cursor shader value
  is one uniform write; zero React state per pointer move.
- **Allocation discipline:** no per-frame `new` — reuse vectors (the
  pull-back's authored-vs-applied compare — Film.tsx:154–159 — is the house
  pattern); flicker stays closed-form sine (no noise textures).
- **Scrub hygiene:** state changes ride uniforms (curtain, almost-touch),
  never material swaps; `lagSmoothing(0)` stays (no catch-up jumps after
  stalls); texture uploads never land mid-scrub (§13).
- **Payload:** JS ≤300KB gz initial; hero-critical ≤2.0MB; film stream ≤9MB
  KTX2 (per experience doc).
- **Measurement:** dev-flag HUD (fps, draw calls, curtain ms) + the
  GL-readback QA recipe for color assertions; no analytics in prod.

## 16. QA walk protocol (motion gate)

1. Full scrub forward AND backward at three speeds (slow, natural, flick) —
   every transition legible in both directions, zero console errors.
2. Held-frame audit at every partial-curtain value and every rest anchor.
3. Autoplay end-to-end (66s) foregrounded; tab-hide/show mid-play; input-yield
   at three points.
4. Real-phone touch walk (soft rests, gearing, 950vh track), portrait restage.
5. Reduced-motion walk: full stepped tale, hero fades, CTA fades.
6. Keyboard-only walk: step every anchor, reach and fire the CTA.
7. 4× CPU throttle walk: budgets hold, no hitching at chapter loads.
8. The impeccable pass + the experience doc's clarity contract, then the
   art-bible/live gates per standing rules.

## 17. Guardrails

No build until its plan is approved. Nothing deploys or publishes. Motion
never overrides the standing bans (no hatching, no surface gimmicks, goblin v2
and copy locked). Any new motion must name its token, lane, clock, and grammar
— or it doesn't exist.
