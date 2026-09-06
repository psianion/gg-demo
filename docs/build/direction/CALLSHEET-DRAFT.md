# THE BUILD CALL SHEET — the film body, hero shipped → whole film built

2026-09-03 · Draft. Twenty-six prompts, six acts, sixteen human checkpoints.
Each prompt is written to be handed to one engineer **with no other context**: it names the
docs it must read, the code it touches, what it delivers, how it is proven done, and what it
may not touch.

**This document plans a build. It does not authorise one.** No prompt runs until its plan is
approved.

---

## 0. HOW TO READ THIS

- **The binding doc set** is four documents and every prompt names which sections of them it
  needs: `docs/2026-09-03-world-direction.md` (WD) · `docs/2026-09-03-scene-book.md` (SB) ·
  `docs/2026-09-03-goblin-design.md` (GD) · `docs/2026-09-03-motion-microinteractions.md` (MM).
  **`docs/build/direction/ERRATA.md` is read alongside all four** — it carries thirty rulings
  that supersede text still sitting in the docs, and a complete does-not-exist list.
- **Inherited and authoritative:** `docs/story.md`, `docs/copy-spec.md` (both LOCKED, verbatim),
  `docs/2026-09-02-experience-design.md`, `docs/2026-09-02-motion-system.md`,
  `docs/2026-09-02-hero-design.md`.
- **Not binding, superseded v1 art thinking:** `art-direction.md`, `color-script.md`,
  `puppet-spec.md`, `skeleton-spec.md`, `pencil-detail-plan.md`. Do not build from them.
- **`story/story-v1` is read-only reference. Never edited.**
- **★** marks a human browser review before the next prompt runs.
- **Line numbers in the docs are provenance, not addresses** (ERRATA 29 — `world.ts` is 4756
  lines and every `world.ts` reference in WD and SB is ~278 low). **Every retirement and every
  kept mark is found by NAME.**

### The ruling that fixes most of the order

SB §0's mechanical ruling: three separate mechanisms carry Performance↔Prep, and they are not
interchangeable.

| Mechanism | Scope | Consequence for the order |
|---|---|---|
| `curtain.value` | global, the post pass **and** every `uTriCurtain` | one object; the switchover that drops it is architectural and gets built and walked before any S3 art |
| `material.userData.alive` | one mesh; a **paired `tl.set` step**, never a ramp | pairs must be `c` / `c − PAIR_GAP`, so the token and the check extension precede every authored pair |
| `rig.seamX` | trilayer only; **Prep is east of the line**; meaningless while `curtain = 1` | the frontier can only *add* Prep, so S7's flatten cannot use it — `uTriFlat` must exist as a declared uniform before twelve groups can carry it |

### Two structural decisions this sheet makes, and why

**1. There are no separate "kit" prompts.** WD §9 lists 36 kit items across flora, rock,
carpentry and light. Authoring them in a vacuum is exactly the "boilerplate-procedural" failure
`docs/build/TEXTURES.md` rejects on sight — *every surface must read as painted art under the
film transfer*, and that is only judgeable in a frame. **Each kit item is authored by the stage
that first needs it, registered in `surfaces.ts`, and reused unchanged afterwards.** The
azimuth discipline (WD §8: one bake per chapter family) is what makes reuse safe across
stages — the cliff is baked once for the day family and the night takes it at reduced
intensity. Every stage prompt below states which kit items it *owns* and which it must
*reuse without re-baking*.

**2. `portraitLook` and the class albedo bakes are split declare/consume.** P5 threads the
`portrait` flag and builds `figure.check.ts`; each stage authors its own beats' `portraitLook`
beside its landscape camera. P6 builds the registry, the budget checks and the three grammar
bakes; each stage authors the class bakes it is the first to need. Retrofitting either after
48 beats exist re-touches every beat.

---

## 1. THE ACTS — each ends in a walkable film

| Act | Prompts | State at the end |
|---|---|---|
| **0 · The prototype gate** | P0 | Film unchanged. A written verdict on three marks at 390 px that decides S2/S4/S5 staging. |
| **1 · The spine** | P1–P7 | Film runs on **v1 art**, unbroken, with the whole mechanism under it: tokens, the rig wired, the reversal harness, the S3 switchover walked, the portrait build, the surface registry, the set-scale island grammar. |
| **2 · The page** | P8–P10 | Margin, ruler, numeral, the accessible path and the Hand's eleven letterings, all over the v1 world. Every live a11y defect on main closed. |
| **3 · The world** | P11–P18 | Stages 1–6 rebuilt to v2 art, one stage per prompt, each walkable forward and backward on landing. |
| **4 · The handover** | P19–P21 | The board bake, the flatten, the endcard. The film is complete end to end. |
| **5 · The fallback and the gate** | P22–P23 | The Picture Book, then MM §15.2's eighteen-step walk and the standing gates. |

**Nothing in Act 1 or Act 2 changes what is on screen except by improving it.** The film stays
walkable at every prompt boundary. Act 3's stages replace v1 art one at a time; a stage that is
half-built is not committed.

---

## 2. THE DEPENDENCY GRAPH — every edge with its reason

Derived from the docs and verified against the code. **These are the edges that genuinely fix
the order.** Anything not listed here may be reordered.

| Edge | Reason, with its citation |
|---|---|
| **P0 → everything** | SB §7: *"Prototype gate, before any other build work."* If two of the three demotable reads fail at 390, the answer is **re-siting, not demotion** — the arcs move outboard along the apron bed, the rings move to the die's own near edge. Both are staging changes to sets that do not exist yet. Learning it after S4 and S5 are dressed costs both sets. |
| **P1 → P4** | ERRATA 1: the S3 frontier retire-pair as written (`30.32 / 30.34`) evaluates to `0.019999999999999574`, **below** `clocks.check.ts:70`'s 0.02 floor. Authored as `c − PAIR_GAP` it is `0.02499999999999858` for every mark in the film. Without the token and the check extension the switchover fails the build on its first commit. |
| **P1 → P5** | MM §13.2: the PRM/portrait rebuild is *only* safe because relative tweens are banned. GSAP resolves `'+='` at a tween's first render; a rebuild at t=33 re-bases the disc from its current ~2.0 rad and the seek renders `2.0 + π`. The disc, the tavern sign and the endcard die all visibly jump on a preference flip until the seven call sites convert. |
| **P1 → every stage prompt** | MM L9 / `motion.check.ts:116–197`: a re-inlined literal fails the check. Every beat authored before the tokens land has to be rewired. |
| **P2 → P4** | MM §15.2 step 9's walk demands **no change at all in the rendered frame** across 20.505 / 20.53 / 20.55 — *including the lighting scalars.* That needs `lightC` as a second `{value}` object (D-2) and the practicals' `max(1 − lightC, alive.value)` factor (D-1). Without them the campfire he lights at t18.35 emits nothing for 2.2 t and jumps to full in one frame. |
| **P2 → P3** | A1's state vector names `lightC.value`, every group's `uTriFlat.value`, every practical's `intensity` and `board.scale`. The harness cannot sample what does not exist. |
| **P2 → P11** | S1's night is `KEY_I_NIGHT 0.55` / `HEMI_I_NIGHT 0.35` on the same `DirectionalLight` at the same +18° azimuth (SB §6 rig ruling 1), and S1 owns one practical. **And `rigs.ts` is not wired into the film at all today** — `createRigs()` is called only by `hero.ts:1637` and the sandbox; `Film.tsx` still runs its v1 rig with the `0xffb45e` PointLight at `:100`. Nothing lit can be built before that wire-in. |
| **P2 → P20** | `uTriFlat` must be a declared uniform with a shader branch before twelve merged groups can each carry one, and the practicals' third factor `(1 − p.flat.value)` already references the object (D-1, D-15). |
| **P3 → every stage prompt** | A1 is the only automated guard on drifted `tl.set` pairs, callbacks, integrators, boolean flips, relative tweens and the t38 set-then-tween. MM: *"worth more than the rest combined."* Authoring 48 beats without it means finding the drift by hand on a backward flick. |
| **P4 → P14a/P14b** | SB §9 risk 2: *"Build this beat first, after the phone prototypes, and walk it in both directions before anything else in S3 is polished."* Everything after t20.55 depends on the flip being invisible, and it has never been walked. |
| **P5 → every stage prompt** | SB §7 makes a second authored camera target mandatory on every `A`-flagged beat (~30 of 48), and `figure.check` asserts the floor **against the `{portrait: true}` build**. A beat whose portrait build does not exist cannot be gated, and retrofitting after 48 landscape cameras re-touches every beat (MM §8.6). |
| **P6 → P7, and → every stage prompt** | G1's ceiling is 33 shared trilayers and ≤40 per-mesh materials film-wide. A stage that instantiates ad-hoc materials before the registry exists is rebuilt to fit the census. `InstancedMesh` is banned by the shader itself (`trilayer.ts:482` reads `modelMatrix`, never `instanceMatrix`) — the merge discipline has to be in place from the first island. |
| **P6 → P13** | `bake.check.ts` and the ≤12 ms/bake, ≤140 ms total, 47.9 MB budgets (ERRATA 22) must exist before the one-stage-ahead schedule can be asserted. |
| **P6 → P19** | The board's 2048² is the film's only texture above 1024² and ships **without a mip chain** to hold the 48 MB ceiling. The ceiling has to be enforceable before the bake that tests it is authored. |
| **P7 → P11** | S1's two islands are the first instances of the set-scale card. **G5 must land here:** `createCurtainPass` swaps `scene.overrideMaterial` twice (`curtain.ts:443`, `:457`) and both bypass the trilayer, so a feathered card's alpha discard never runs in the prepass and the contour pass inks a hard ring at every card's geometric circle — the exact opposite of *"an edge that simply stops being drawn."* Judge one rim before eleven more exist. |
| **P7 → P14a** | S3-B1's void crossing **is** the travel line: the line unspooling ~1.5 units ahead of his feet is the whole beat. |
| **P8 → P12** | Transition 2 (the tick) is three lines on one cue and the third is *"margin breathes to full over `T_BEAT`"* at t12.6. S2's tick is the film's first, and there is no margin element in `App.tsx` today. |
| **P10 → P14b** | SB §7: S3-B3 is *"the thesis image… QA the graphite→ink flush at 390 exactly."* The flush colours authored `<path>` strokes; a `<div>` text node has none. |
| **P10 → P15** | SB §9 risk 9: `set1`'s ink⇄graphite flush is the only caption that flushes off a whole-frame tick and *"the wiring is cheap now and ugly retrofitted."* |
| **P9 → P23** | MM §15.2 step 15: *"The shipped DOM cannot produce that order"* — `#overlay` renders at `App.tsx:229` and `#play` at `:340`. The keyboard walk cannot pass until `#play` moves above `#overlay`. |
| **P11 → P12, P11 → P20** | SB §6: the cliff island is **one asset, two eras of dressing** (S1/S2 remains, S7 tended), baked once for the day family. Building it twice breaks the azimuth discipline that lets one bake serve both. |
| **P13 → P14a** | D-12: the normal/depth prepass runs every frame of the entire film and is *"the single largest lever on this page"*, and no shipped number reflects it. **Measure it before S3 is polished** — if it exceeds 3.0 ms, the degradation ladder re-orders, which changes what the ribbon may spend. |
| **P14a → P15, P17a, P18, P20** | SB §9 risk 3: the path ribbon island **sets the ≤120-draw ceiling**, and no stage may raise the total above its measured figure without a recorded decision. The ceiling is not knowable until the ribbon is measured. |
| **P16 → P17b** | WD §11: `buildFinger` retires and the v1 finger-only compromise becomes *"the goblin strolls into the frozen room, hops on the bench, and nudges the die with the full puppet."* Without `hop()` S5-B4 has no way onto the bench. |
| **P16 → P18** | `hang` (S6-B3), `plantAndPat` (S6-B4) and `touchUp` (S6-B1, used exactly once in the film) are three of that stage's six vignettes. |
| **P19 → P20** | G4 / SB §5.1: *"the flatten's destination art is UV slices of this same atlas"* — one bake, two consumers, **so they cannot drift.** The atlas must exist before the twelve groups can address rects in it. |
| **P19 → P21** | The same atlas is the board the film ends on. |
| **P21 → P22** | SB §9 risk 15: the halo system and `BOARD_WASH 0.5` were tuned against an empty grid and must be verified against the **final** bake; and the Picture Book's eighth frame is the endcard at rest. |
| **P11…P21 → P22** | The Picture Book is eight painted frames, one per stage, at the compositions SB §6 names. Every one needs its stage finished. |
| **P2 → P11…P21** | Shadows: three `renderer.render` calls per frame means three shadow renders unless `shadowMap.autoUpdate = false` (MM §14.2). Each stage then registers its own world casters per SB §6 rig ruling 4 — the moment shadows go on, the cost triples for everything already built. |

### Edges that look real and are not

- **The goblin's rebuild does not gate the film body.** GD §13 steps 6 and 7 are DONE (ERRATA
  14, 4): `EAR_Z_R`/`EAR_Z_L`, `REST`, `applyPose` and five verbs have shipped. Gate G8 is
  closed. **Do not re-cost it.**
- **The four remaining verbs do not gate S1–S4.** Only S5 and S6 use them.
- **The Hand does not gate S1 or S2's *art*** — `cap()` no-ops on a missing id and keeps its
  signature. It gates S3-B3's and S4-B4's flush QA only.
- **The board does not gate S1–S6.** Only S7's flatten targets and S8.

---

## 3. THE HUMAN CHECKPOINTS

Sixteen. Each is a browser review on the dev server at **http://localhost:5180** — which is
already running on PID 17556 and **must never be killed or restarted**.

| After | What the human is looking at | Why it cannot wait |
|---|---|---|
| **P0** ★ | Three marks at 390 / 768 / 1440 | Decides whether S2, S4 and S5 are staged as authored or re-sited. |
| **P4** ★ | Five frames stepped both directions across the t20.55 switchover | SB risk 2. If the flip shows, the whole S3 construction is wrong and nothing after t20.55 is safe. |
| **P5** ★ | The portrait build on a real phone | MM §8.6: *"not scriptable — whether the portrait framing is good."* |
| **P7** ★ | One set-scale island rim, all breakpoints | The grammar every one of the twelve island cards inherits, plus the G5 prepass fix. |
| **P9** ★ | Keyboard-only walk, focus ring on paper / blackout / board | MM §5.1: not scriptable. Focus visibility is a hard gate. |
| **P10** ★ | The eleven letterings written on and un-written; the Cover after the font reassignment | The film's voice, and the only prompt that touches shipped, verified Cover files. |
| **P11** ★ | S1's night at flat transfer | SB risk 5: *"Night on a paper page is unproven… judge at the first S1 walk, no grading escape hatch."* |
| **P12** ★ | Flagship 1 inside the freeze | The film's first evidence beat and its first authored framing. |
| **P14b** ★ | The lantern, the frontier's tide-line, the draw-call number | The thesis image, and the ceiling every later stage is measured against. |
| **P15** ★ | The disc at flick speed, both directions, three times; flagship 2 | MM §15.2 step 7 — one of the two must-be-flawless-both-ways moves. |
| **P17b** ★ | The walk-through's three named QA cases; flagship 3; the full-puppet nudge | SB risk 7: *"the most fragile transition in the film."* Risk 10: the nudge replaces the film's best v1 animation. |
| **P18** ★ | The six page turns backward, one notch at a time | SB risk 17: *"a drifted pair is an invisible bug until someone scrubs backwards."* |
| **P19** ★ | The board bake at 390 and 1920, flat transfer | SB risk 1: *"the film's whole bet… budget it like the hero; it will eat iterations."* |
| **P20** ★ | The flatten at flick speed, both directions, three times | The site's most-scrubbed moment (risk 4) and the second must-be-flawless move. |
| **P21** ★ | Endcard contrast on the final board | Risk 15: *"the wash may need to rise; it may not fall."* |
| **P23** ★ | The ship gate | MM §15.2's eighteen steps, the impeccable pass, the art-style guide. |

---

# ACT 0 — THE PROTOTYPE GATE

## P0 · The three flagship reads at 390 px

**Size:** 1–2 days.

**Read:** SB §7 (whole, especially the closing *"Prototype gate, before any other build
work"*), SB §1's flagship table, SB §6 *Flagship + evidence assets*, SB §3-S2-B3 / §3-S4-B5 /
§3-S5-B4, WD §6's phone-width contract, ERRATA 12.
**Code:** `src/IslandSandbox.tsx` (the route precedent, `?sandbox=island`), `src/film/pencil.ts`
(`polyline`, `curveLine`, `score`, `numeral`), `src/film/palette.ts` (`graphite`,
`graphiteLight`, `graphiteDark`), `src/film/framing.ts`, `src/film/stages/trilayer.ts` (the
`rig` uniform block).

**Deliverable.** A sandbox route (`?sandbox=marks`) staging the three demotable flagship mark
sets, each at its own beat's authored camera, at **390×844, 768×917 and 1440×900**:

1. **The erased-contour pair** (S2-B3) — a committed `graphiteDark` line plus a rubbed
   `graphiteLight` ghost with a legible smear direction, beside his head at the S2 address's
   world scale.
2. **The scribed-arc set** (S4-B5) — 3–4 arcs plus one overshoot on the apron bed **outboard of
   the kerb**, at the flicker's held-frame camera.
3. **The mug-ring set** (S5-B4) — `pencil.ts` ellipse strokes in the graphite ramp on `plank`,
   in the frozen frame's near plane at reading scale.

Plus a written verdict, one line per mark per breakpoint: **reads · demotes to texture ·
must re-site.**

**Acceptance gates.**
- Each mark renders at all three widths with a screenshot recorded.
- The verdict is written into this call sheet's own record before P12, P15 or P17b run.
- **If two of the three fail: demotion is not the answer.** Record the re-siting decision (arcs
  further outboard along the apron bed; rings onto the die's own near edge) as binding staging
  for P15 and P17b.
- SB risk 6: **QA at 768 as well**, not only the contract's named sizes — an erasure that reads
  at 1440 and demotes at 390 still thins the argument for half of real traffic if it fails at 768.
- No hatching in any mark. `pencil.ts` primitives only — **marks are not type** (WD §4).

**Must NOT touch.** `timeline.ts`. `world.ts`'s stage builders. Any shipped Cover file
(`Hero.tsx`, `hero.ts`, `heroLife.ts`, `hero.css`, `HeroWordmark.tsx`). No timeline marks, no
gearing, no palette additions.

---

# ACT 1 — THE SPINE

The film runs on v1 art throughout this act. Nothing on screen regresses.

## P1 · Motion tokens and timeline grammar hygiene

**Size:** 1–2 days.

**Read:** MM §2 (whole — §2.1 status corrections, §2.2's ten tokens, §2.3's ease lanes and the
three bans, §2.4's ten micro-constants), MM §15.1 A5 and A11, MM D-4, D-13, D-19, ERRATA 1 and
28, MM L7 and L9.
**Code:** `src/film/motion.ts`, `src/film/timeline.ts` (`:268`, `:269`, `:570`, `:573`, `:872`,
`:937`, `:962` — the seven relative call sites; `:143–153` `onlyFor`; `:638–639` the sanctioned
set-then-tween), `src/film/stages/heroLife.ts` (`:597–598`, `:757–758`, `:762`),
`scripts/clocks.check.ts` (`:66–74`), `scripts/motion.check.ts` (`:34–48`, `:74–91`,
`:116–197`, `:199–212`).

**Deliverable.**
1. **Ten new tokens** in `motion.ts` with WIRED/CSS/FORWARD status: `PAIR_GAP 0.025`,
   `T_NUMERAL 0.3`, `T_FLUSH 0.2`, `T_REST 0.22`, `T_STEP 0.45`, `T_SKIP 1.2`, `T_REPLAY 1.6`,
   `T_CURSOR_HIDE 2.5`, `BOARD_BREATH {amp: 0.005, periodS: 12}`,
   `FLATTEN {x0: 128, xSpan: 42, spread: 0.9, dur: 1.1}`. Plus `SEAM_PARK`.
2. **Ten micro-constants** (MM §2.4): `TRACK_TAU 0.13`, `PAR_DUR 0.55`, `SCRITCH_TAU 0.16`,
   `PERK`, `BLINK`, `SCRITCH`, `DEPTH_SHOT`, `DEPTH_TIGHT`, `WRITE_STAGGER 3`, `WHISPER 0.04`.
3. **The seven relative tweens convert to absolute end values** and the rope's
   `repeat: 12` becomes `repeat: 11` (D-19 — 13 legs rests the rope 0.15 above its authored base).
4. **The pair-authoring rule**, in code and in a comment at every paired site: `c` and
   `c − PAIR_GAP`, **never two decimal literals**.
5. **D-4:** `heroLife.ts:597–598`'s `0.25`/`0.4` rewire to `T_UI_MAX`/`T_BEAT` and enter
   `wiredAt`.
6. **The frame-rate fix:** `heroLife.ts:757–758`'s `× Math.min(1, dt × 6)` becomes
   `k = 1 − exp(−dt/SCRITCH_TAU)`. After this all three damped lerps on the site are
   frame-rate independent.
7. **`clocks.check.ts` extended (A11)** to recognise the `<num> - PAIR_GAP` form, evaluate it in
   floating point and apply the same ≥0.02 floor. **Not a second checker.**
8. **`motion.check.ts` extended (A5):** no `stagger:`, no `onComplete`/`onStart`/`onRepeat`, no
   `tl.call(`, no `'+=` / `'-=` / `` `+= `` / `` `-= ``, no `camera.rotation.z`, every
   `repeat:` paired with `yoyo: true` is odd.

**Acceptance gates.** `pnpm check` green (all thirteen scripts). A5's greps return zero on
`timeline.ts`. A11 passes on every existing pair. `motion.check`'s `wiredAt` covers every new
token. **The Cover is re-walked** — `SCRITCH_TAU` and `PAR_DUR` touch shipped, verified Cover
behaviour; the scritch must still feel like the 60 Hz original (`1 − exp(−(1/60)/0.16) ≈ 0.099`
against the shipped `0.1`).

**Must NOT touch.** `RUNTIME = 66`. `gearing.ts:44–54`. Any authored mark position. Any art.
`T_BLOOM_CTA` may never enter `styles.css` — the CSS lane stays exactly
`{T_FLICK, T_UI, T_UI_MAX}`.

---

## P2 · The rig, wired and extended

**Size:** 3–4 days. **The largest mechanism prompt, and the one nobody has scheduled.**

**Read:** WD §8 (whole), SB §6 *The rig* (all five rulings), MM §10.4 (banked idles), MM §10.5
(practicals and the two defects), MM §14.2 (the four passes and the shadow ruling), MM D-1,
D-2, D-3, D-14, D-15, WD G7, ERRATA 11 and 23 and 24 and 26.
**Code:** `src/film/stages/rigs.ts` (whole — note `:28`'s *"Not yet wired into the film"*),
`src/film/Film.tsx` (`:17–20` module-scope `AMBIENT`, `:100` the `0xffb45e` PointLight,
`:159–290` the frame loop, `:183` the two clocks, `:200–207` the pull-back idempotence,
`:225–244` the flicker), `src/film/stages/trilayer.ts` (`:36–77` the rig block, `:411–421`
`TrilayerOpts`, `:427+` `createTrilayer`, the `triSeamF`/`triC` lines, `triDabN`),
`src/film/curtain.ts` (`:110–140` `reveal`, `:183` the cached shell, `:438–491`
`curtainPass.render`), `src/film/motion.ts:82`.

**Deliverable.**

1. **Wire `rigs.ts` into the film.** `createRigs()` is called today only by `hero.ts:1637` and
   `IslandSandbox.tsx`; `Film.tsx` still runs its v1 rig. Retire the v1 rig, including the
   `0xffb45e` PointLight parented into the flame groups at `Film.tsx:100` (WD §5 names it the
   film's one open colour violation, FINDINGS P3-T6). **This is the wire-in `rigs.ts:28`
   anticipates and every lighting ruling in the doc set assumes.**
2. **Three chapter-family key presets:** exterior day `(4, 6, 3)` +18° `KEY_I 2.2` / `HEMI_I 0.8`
   · exterior night — **the same `DirectionalLight`, lowered and dimmed**, `KEY_I_NIGHT 0.55` /
   `HEMI_I_NIGHT 0.35`, same +18° azimuth · interior `(2.6, 3.2, 1.1)` at +38°. *"Radius-limited"
   is not a state a directional light can be in* (ERRATA 11) — do not convert it.
3. **The three-slot practicals array**, replacing `rigs.ts:131`'s single fixed `PointLight`.
   Each slot `{ position, intensity, phase, alive, flat }` with the one expression that serves
   both consumers: `p.base * flicker(t, ambient, p.phase).glow * Math.max(1 - lightC.value,
   p.alive.value) * (1 - p.flat.value)`. `alive` and `flat` are held **by identity**, the
   `rig.curtain` pattern. Hard cap three; ~10 lines and an `update()` loop.
4. **`lightC`** — a second `{value}` object beside `curtain`. Everywhere in the film it tracks
   the curtain exactly (one `tl.to` at the same position, duration and ease). S3 is where it
   diverges, and that is P4's job.
5. **`uTriFlat` (0…1) and `uTriFlatUv` (vec4 rect) declared** as per-material uniforms with the
   shader branch, defaulting to 0, with `triDabN` applied to the flat mix so S7's frontier look
   is authored into the ramp. The board atlas binds **rig-side as one shared sampler** — declare
   the slot; P19 fills it.
6. **`key.target` follows `world.look`.** The box stays ±8 with far 40; beyond it grounding is
   contact blobs (SB §6 rig ruling 3).
7. **Shadows on:** `<Canvas shadows>`, `renderer.shadowMap.autoUpdate = false` once at setup and
   `needsUpdate = true` once per frame before the first pass in `curtainPass.render`.
   **Mandatory before shadows are enabled, not after** — three `render()` calls otherwise mean
   three shadow renders.
8. **The banked-idle system** (MM §10.4) — a registry capped at 20, each entry gated on its own
   scrub-tied scalar, riding `gobT`:
   `amp = (prop.userData.maskShell?.scale.x ?? 0) * prmAmbient()`. No boolean, no `revealed`
   flag, no callback, no `if`. Register the sites whose props exist today: S1-B2's ember drift
   and cloth (`ambushFlames.userData.lit`), fire2 (shell × `lit` — **`lit` stays**, it sizes the
   flame and deleting it makes the flames full-size from t0), the lamppost, the cave door. The
   remaining eleven register with their stages.
9. **D-3:** `Film.tsx` imports `prmAmbient()` and calls it once per frame, deleting the
   module-scope `AMBIENT`.
10. **D-14:** rewrite the three shipped comments that assert the old thesis — `motion.ts:82`,
    `Film.tsx:225`, `timeline.ts:336–341` — **in this same commit**, so nobody builds a practical
    against a comment describing a superseded rule.

**Acceptance gates.** `rigs.check`, `curtain.check`, `island.check`, `motion.check` green.
**A13:** `worldCasters.size ≤ 40`, the idle registry ≤ 20, `shadowMap.autoUpdate === false`
whenever `<Canvas shadows>` is set. Every registered idle's amplitude decays to exactly 0 as its
shell scrubs back to 0. The film renders identically to before the wire-in except where a
ruling says otherwise; the Cover is unaffected (`hero.ts` keeps its own `createRigs()` call).
Frame budget re-measured per pass against MM §14.1.

**Must NOT touch.** No fourth light. No coloured fill lights, rim lights or lens artifacts —
exactly two light hues exist, `keyWarm` and `amber`. No per-frame allocation. No integrator, no
spring, no state (L5's one sanctioned exception is `rigs.update()`'s `castShadow` write, already
accepted in writing). No art.

---

## P3 · The reversal harness and the check suite

**Size:** 2 days.

**Read:** MM §15.1 (whole, A1–A13), MM L5/L6/L7/L8, ERRATA Part 3 items 1 and 5–9.
**Code:** `scripts/clocks.check.ts` (the extension pattern), `src/film/timeline.ts`
(`buildTimeline`'s signature at `:64–71`, `disposeTimeline` at `:1135`), `src/film/world.ts`
(`buildWorld` at `:4668`), `package.json`'s `check` script.

**Deliverable.**

1. **`scripts/walk.check.ts` — A1, the reversal identity.** Headless Node + three, no WebGL.
   Build world and timeline; sweep `tl.time()` forward 0…66 in 0.01 t steps recording a state
   vector at 200 sample marks; sweep backward through the same marks; assert
   `max |forward − backward| < 1e-6` per component. **State vector:** `camera.position`,
   `world.look`, `goblin.root.position/rotation`, `curtain.value`, `lightC.value`,
   `rig.seamX/depthNear/depthFar/aliveShadow`, every material's `userData.alive.value`, every
   group's `uTriFlat.value`, every `maskShell.scale`, every `onlyFor` target's `.visible`,
   `world.timeScale`, every practical's `intensity`, `board.scale`.
2. **A2** — the seven paired clusters (six montage marks plus the t50 handoff): the `tl.set`
   sites exist at both `c` and `c − PAIR_GAP` on root position, root rotation and speed; the
   pose returns after a `+0.5` / `−0.5` round trip.
3. **A3** — the nine page turns: `#blackout` opacity is 0 across `mark ± 0.1` (**paper, never
   black**) and a camera `cut()` pair exists at the mark.
4. **A4** — no held partial curtain outside the five authored windows
   `[12.5, 12.85] ∪ [33.1, 33.45] ∪ [34.3, 34.42] ∪ [40.6, 40.95] ∪ [47.0, 47.12]`.
   **This is what retires `T_DRAIN_MIN`/`T_DRAIN_MAX`** — a new `glidingDrain` call fails here first.
5. **A6** — `rig.seamX.value === 1e6` for every `t` outside `[20.53, 30.34]`; inside, monotonic
   non-decreasing except at the two authored sets.
6. **A7** — `world.timeScale ∈ {0, 1}` at every sample except inside the six named ramps.
7. **Wire everything into `pnpm check`.**

**The standing rule this prompt establishes.** A2, A3, A6 and A7 reference marks that do not all
exist yet (seven of the nine page turns, the montage clusters, the frontier window). **The
harness ships with a mark table, and every subsequent prompt adds its own marks to that table
as part of its deliverable.** A prompt that authors a paired set without registering it in A2 is
not done.

**Acceptance gates.** A1 green on the current build (`{}` only — the `prm`/`portrait` runs land
with P5, which must extend it to three runs). Every assertion runs in `pnpm check` in under a
few seconds. A1's failure output names the component and the sample mark, not just a boolean.

**Must NOT touch.** No GLSL compiled in Node. No new dependency, no Playwright — the pattern is
plain `node --experimental-strip-types`, as all thirteen existing checks are.

---

## P4 · The S3 curtain switchover, built and walked ★

**Size:** 1–2 days. **Small, high-risk, and mandated to come before every other S3 decision.**

**Read:** SB §3-S3's *state schedule* (the whole table plus both explanatory paragraphs — *"this
stage owns it, and no other document may contradict it"*), SB §0 amendment 1, SB §9 risk 2,
MM §2.2's *"The S3 switchover is not a same-target pair and must be said out loud"*, MM D-1/D-2,
MM §15.2 step 9, WD §7's frontier ruling, ERRATA 1, 5, 23.
**Code:** `src/film/timeline.ts` (the S3 block, the shipped prop-stop chain at `:434–526`,
`:550`'s exhale, `:305`'s tick), `src/film/curtain.ts` (`:196–202` the `tick()` recipe,
`:201` `SETTLE.arrive`, `:204–210` the retired drain clamp), `src/film/stages/trilayer.ts` (the
`triSeamF` / `triC = max(uTriCurtain, triSeamF)` lines), `src/film/stages/rigs.ts` (P2's
`lightC` and practicals).

**Deliverable.** The S3 state schedule, authored exactly as SB §3-S3 gives it, **on v1 S3 art**:

| t | `curtain` | `lightC` | `seamX` | `timeScale` |
|---|---|---|---|---|
| 16.5 | 1 | 1 | 1e6 | 0 |
| 18.35 | 1 | 1 | 1e6 | 0 — the campfire's alive step + shell |
| 20.207 | 1 | 1 | 1e6 | 0 — the lamppost group's, 0.35 s |
| **20.505** | 1 | **set 0** | 1e6 | 0 |
| **20.53** | 1 | 0 | **set 2.0** | 0 |
| **20.55** | **set 0** | 0 | 2.0 | 0 |
| 20.55→21.45 | 0 | 0 | **2.0 → 13.0**, `power2.out` | 0 |
| 21.45–30.0 | 0 | 0 | **13.0, parked** | 0 |
| 30.0→30.3 | 0 | 0 | **13.0 → 34.0**, `power2.out` | **0 → 1** over `T_EXHALE` |
| `c = 30.34` / `c − PAIR_GAP` | 0 | 0 | set 1e6 (paired) | 1 |

Plus: **the t30 exhale moves from `T_FLICK` (0.12) to `T_EXHALE` (0.3)** — `timeline.ts:550`
still runs the wrong token. And a comment at the call site recording that `curtain`, `lightC`
and `rig.seamX` **must stay on three separate `{value}` objects**: the 20.53/20.55 pair is
`0.019999999999999574` apart and passes only because `clocks.check` groups by target. *"If
anyone ever moves both onto one state object, the check goes from passing to failing with no
code change."*

**Acceptance gates.**
- `clocks.check` (with P1's A11 extension), A1, A4, A6, A7 all green.
- **MM §15.2 step 9, the walk, and it is the gate:** park at 20.505, 20.51, 20.53, 20.55, 20.57
  and step between them **one frame at a time in both directions**. *"Look for: any change at
  all in the rendered frame across the four sets. There must be none"* — including the lighting
  scalars.
- The campfire lit at 18.35 emits light **continuously** from that moment (D-1). No jump at 20.55.
- Held-frame audit at 25/50/75% of the 2.0→13.0 sweep: every parked frame is shippable.
- **★ HUMAN CHECKPOINT.** Nothing else in S3 is polished until this passes.

**Must NOT touch.** No radial pool crossing to neighbouring trees — `reveal()` is a mask shell
of the prop's own shape and the radial version was deleted for being the airbrushed colour disc
the colour script bans by name (`curtain.ts:98–103`). No frontier that tracks his heels. **No
`seamDir` promotion** — DECLINED (SB §0 amendment 2), its budget already spent on P2's
practicals. No re-timing of any mark.

---

## P5 · The portrait build ★

**Size:** 2–3 days.

**Read:** MM §8.6 (whole), MM §13.2, SB §7 (whole, including the beat table and the four
demote-valves and the one re-frame valve), WD §6's phone-width contract and G3, MM §15.1 A9,
ERRATA 3 (the `GOB_SCALE` / `HERO_GOB_SCALE` split), GD §11.2 and gate G7.
**Code:** `src/film/timeline.ts:64–71` (the signature), `:89–92` `cam`, `:107–110` `cut`,
`:1135` `disposeTimeline`, `src/film/framing.ts` (`fitFov` and its clamp),
`src/film/gearing.ts:12` (the P14-scope note), `src/styles.css:65` (the flat `1800vh`),
`src/film/stages/hero.ts:50` (`GOB_SCALE`, read only inside `stageGoblin`), `:1197`, `:1214`,
`src/App.tsx` (the resize path), `scripts/framing.check.ts`.

**Deliverable.**

1. **`buildTimeline(world, camera, scene, caps, { prm, portrait })`** — one options object,
   threaded. `cam()` and `cut()` read
   `const look = portrait && beat.portraitLook ? beat.portraitLook : beat.look`. Selecting the
   variant is free at build and costs nothing per frame.
2. **The rebuild recipe:** on a media-query change or a breakpoint crossing —
   `at = tl.time()` → `resetRelativeBases(world)` (a DEV **tripwire that throws**, not a fixup)
   → `disposeTimeline` → rebuild → `tl.time(at, false)`. Budget ≤40 ms desktop / ≤90 ms phone,
   one frame, never during a scrub.
3. **The breakpoint is the one `framing.ts` already owns:** `aspect < PORTRAIT_ASPECT`, evaluated
   on the existing resize handler, with **±0.02 aspect hysteresis** so a collapsing mobile
   address bar cannot thrash the rebuild.
4. **The PRM branch table** (MM §13.2's six helpers): `cam` → `cut` at the move's own start
   mark · `cap` → plain opacity fade over the same window · `tick`/`exhale` → `tl.set` pairs
   `PAIR_GAP` apart on `timeScale`, `curtain`, `lightC` and the margin opacity · `reveal` →
   `tl.set(shell.scale, 1)` at `actionAt` · page turn → cut with no flash frame · the flatten →
   one opacity cross-fade at the same `uTriFlat` endpoints, no sweep.
5. **The portrait track:** `styles.css:65`'s flat `1800vh` gains a portrait media query at the
   solved **~950vh** (`gearing.ts:12` marks this P14 scope; **every phone-flick conclusion in
   MM §7.2 and §15.2 step 11 rests on this unbuilt number**).
6. **The `GOB_SCALE` rename:** `hero.ts:50`'s shipped constant becomes **`HERO_GOB_SCALE`** (it
   is the Cover's — read only inside `stageGoblin`); the film body's `GOB_SCALE = 0.75` is a new
   film-level constant. Two constants, two surfaces, two floors (52 CSS px on the Cover, 84/100
   px in the film).
7. **`scripts/figure.check.ts`** — asserts the projected figure height for every **`A`-flagged**
   beat in SB §3's table at 390×844, 500×915, 768×917 (≥84 px, **against the
   `{portrait: true}` build**) and 1440×900, 1920×1080 (≥100 px). **SB §3's `A`/`E` flag is the
   check's single source of truth — one table, not three** — and the beat table **must carry
   S7-B6's registered exemption** or the check fails the throw at 390 px. `E`-flagged beats are
   exempt by construction. WD §6's "no exceptions" is struck (ERRATA 16).
8. **Extend A1 to three runs:** `{}`, `{prm: true}`, `{portrait: true}`.

**Acceptance gates.** `framing.check`, `figure.check`, A1 ×3 all green. **★ §15.2 step 11 and
step 13 on a real phone:** rotate mid-film and confirm the rebuild preserves `t` and restages
portrait in one frame; the four `me*` soft rests; ten flicks to the end.

**Must NOT touch.** **No FOV tween** — the shipped clamp holds. No runtime crop. No per-frame
blend on a viewport boolean (that is runtime state in the scrub domain, L5). No second `cam()`
at the same mark. `t = 66` and the gearing map are fixed.

---

## P6 · The surface registry and the budgets

**Size:** 2 days.

**Read:** WD §7 (the eleven surface classes and their recipes), WD G1 (whole), WD G2 (whole,
with ERRATA 22's corrected arithmetic), SB §6's per-mesh material census and its *"Reductions
already taken"* list, MM §14.3, MM §15.1 A10 and A13.
**Code:** `src/film/stages/trilayer.ts` (`createTrilayer`, `TrilayerOpts`, `bakeStrokeTiles` at
`:94–204`, `rig`), `src/film/stages/hero.ts` (`bakeIslandAlbedo` `:303`, `bakeFoliage` `:549`,
`bakeBark` `:588`, `silR`, `buildGlowSprite` `:812`), `src/film/pencil.ts:487` (`contact`),
`docs/build/TEXTURES.md` (the texture register — **rows are added by the prompt that introduces
the surface**).

**Deliverable.**

1. **`src/film/stages/surfaces.ts`** — a fixed material registry: **one shared trilayer per
   surface class from WD §7 (eleven classes)**, plus at most **three stroke-direction variants
   per class** where a class genuinely needs more than the ±7° of hand variance the bake already
   carries. **Ceiling: 33 trilayer materials for the whole site.** All share the rig uniforms by
   identity and compile to one program (`customProgramCacheKey`).
2. **The three grammar bakes at module load:** the stroke tiles (shipped 1024², unchanged), the
   paper tooth, the contact blob.
3. **The bake slot table** — eleven class albedo bakes declared, **512² for the eight tiling
   classes** and **1024² for the four that carry close-ups** (goblin cloak, metal, fire, island
   ground), plus the board's single 2048². **Each is authored by the stage that first needs it**
   (see §0's decision 2) and registered here on landing.
4. **`scripts/bake.check.ts`** — ≤12 ms per bake, ≤140 ms total, and the **corrected census:
   `(8 × 512² + 4 × 1024²) × 1.33 + 16 MiB = 47.9 MB`** against the 48 MB ceiling. **The board's
   2048² ships without a mip chain** — it is only ever seen dead top-down at one scale
   (ERRATA 22). A bake that would cross the ceiling reduces its own resolution; it does not get
   an exception.
5. **`scripts/draws.check.ts`** — reads `renderer.info.render.calls` at each stage's authored
   camera and **fails above 120**. Baseline it on the v1 stages now so every later prompt has a
   number to move.
6. **The per-mesh census as a runtime assert:** ≤40 film-wide, with SB §6's running table as the
   ledger (28 of 40 planned, 12 spare).

**Acceptance gates.** `island.check`, `bake.check`, `draws.check` green. The v1 stages'
baselines recorded. `surfaces.ts` exports no more than 33 materials and a test proves they share
one program. **`InstancedMesh` count across `src/` is zero** and stays zero — the trilayer's
vertex injection computes `vTriWorld` from `modelMatrix` and does not read `instanceMatrix`, so
every instance would sample the stroke tiles, grid, seam and depth ramp from the same world
position. *Instancing does not merely cost work; it breaks the material.*

**Must NOT touch.** No new material system. No second post pass. No re-inlined colour literals —
a new colour is a `palette.ts` change, never a paint call.

---

## P7 · The set-scale island grammar ★

**Size:** 2–3 days.

**Read:** WD §3 (whole), WD §9's grammar kit (items 1, 5, 6, 8), WD G5 (both the shader fix and
the art-side belt), SB §6's grammar kit table, MM §12.9's margin/travel-line rows,
`docs/build/ASSETS.md`'s `island-card` row (the hero's verified recipe and its two honest gaps).
**Code:** `src/film/stages/islandKit.ts` (whole — `IslandOpts`, `buildIsland`, the `shadowFrag`
seam line), `src/film/stages/hero.ts` (the shipped island at hero scale),
`src/film/stages/heroLife.ts` (the `LineSegments2` + `instanceCount` stroke-ramp mechanism, its
152 strokes, `:278–286` `applyStrokes`), `src/film/pencil.ts` (`polyline`, `curveLine`),
`src/film/curtain.ts:443` and `:457` (the two `scene.overrideMaterial` swaps),
`src/film/stages/trilayer.ts` (`uTriFeather`).

**Deliverable.**

1. **The island card at set scale** — the hero's verified recipe (elliptical card over a
   **solid, closed three-band lathe skirt**: earth lip / darkened stone shelf / `caveDark` keel,
   bent tapering roots, page drop shadow) generalised to a set-scale parameterisation, plus the
   two additions WD §3 makes binding: **the edge is a section through the layers** (a bright
   2–3 px painted lip over sectioned strata at every cut), and **places relate by wear** (cart
   ruts entering at the island edge and stopping where the pencil line stops).
2. **The grid ghost promoted to a site constant** — per island, at or below `GRID_INK` (0.04),
   extending a few cells past each island's rim onto the paper.
3. **The travel line** — `polyline()`/`curveLine()` on a `LineSegments2` `instanceCount` ramp,
   drawing **~1.5 world units ahead** of him and **un-drawing behind his heels** on reverse.
   The mechanism is `heroLife.ts`'s, verbatim; this is a new call site.
4. **The particle language** — motes, moths, embers, dust, pollen, cloud flats, and the graphite
   dust scribble sprite. Performance-only, freezable by construction, first thing shed on low tier.
5. **G5, the prepass fix:** the normal/depth override becomes a **feather-aware variant** — a
   `MeshNormalMaterial` clone whose fragment shader carries the same three lines the trilayer
   already runs, reading `uTriFeather` and the local position from `mesh.userData`. Roughly ten
   lines. **Do the same for the mask override.**
6. **The art-side belt, which binds regardless:** **no island's rim contour may depend on the
   prepass finding its edge.** Every rim contour in the film is an **authored mark with a
   deliberate gap where the line stops being drawn**, exactly as the hero authors its own.

**Acceptance gates.** `island.check`, `curtain.check`, A1 green. `draws.check` baseline unchanged
or better. **★ HUMAN:** one set-scale island rim walked at 390 / 768 / 1440 — the skirt is solid
(no paper through the rim), the three strata bands read, the section lip reads at the cut, the
rim contour's stop-gap reads as authored and not as a rendering failure, and **the prepass inks
no hard ring at the card's geometric circle**. Island rims never touch the viewport edge at any
breakpoint (the drop shadow's soft tail exempt at ≤11% alpha).

**Must NOT touch.** **No infinite ground plane may be introduced anywhere** — `earthPlane` /
`grassPlane` die at S1 and S3, and nothing replaces them. No backdrop plate fills. No scene fog
(both depth languages are already in-material; scene fog would stack a second, differently
coloured ramp and would fog the Prep, which has none).

---

# ACT 2 — THE PAGE

## P8 · The interface layer

**Size:** 2–3 days.

**Read:** SB §2 (the whole table and the behaviour paragraph), MM §12.10 (whole — *"it is four
tweens"*), MM §9.2 (the parallax bans), MM §5.2 (the `t`-driven DOM states), WD §9 grammar item
7, ERRATA 27 (the breathe fires at the tick's mark **+0.1 t**).
**Code:** `src/App.tsx` (`:204–371` — the whole render tree; there is no margin, ruler or
numeral element today), `src/styles.css`, `src/film/Film.tsx:159–177` (the frame loop and its
`tl.time()` read), `src/film/motion.ts` (`WHISPER`, `T_NUMERAL`, `T_BEAT`, `RUNTIME`).

**Deliverable.** One `<div id="margin">`, `pointer-events: none`, above the canvas, never over a
set piece, carrying four behaviours and **no more**:

1. **Whisper/breathe.** The whole layer is **one element with one opacity**: `WHISPER (0.04)`
   during Performance, `1` during a freeze. Six `tl.to` pairs — breathe over `T_BEAT`
   `SETTLE.arrive` at **12.6 / 33.2 / 40.7** (*the tick's mark + 0.1 t*, not the tick itself),
   un-breathe at **30.0 / 34.3 / 47.0**. Twelve tweens, one property.
2. **The chapter numeral.** Seven `<span>`s `C1`…`C7` in one container, crossfaded by
   `T_NUMERAL` opacity pairs at **16.5 / 31.5 / 37.6 / 49.5 / 57.5 / 64.5**. Twelve tweens.
   **Film-t, so `T_NUMERAL` never enters `styles.css`.**
3. **The 66-tick ruler — one path, one tween.** Not sixty-six elements and not sixty-six
   per-frame writes. One graphite `<path pathLength="66">` under one ink path with the same
   geometry, `stroke-dasharray: 0.55 0.45`, its `stroke-dashoffset` driven by a **single**
   `tl.to` from 66 to 0 over `duration: RUNTIME` at position 0, `EASE_SCRUB`. It is authored in
   **film-t**, so `gearing()` makes it visibly run through S1 and S6 and crawl through S8 —
   a CSS `scroll-timeline` would ink linearly in scroll and show no acceleration at all.
4. **The boil.** UI-side only, ≤0.8 px, **at rest only, never mid-write**, off under reduced
   motion. **World strokes never boil.**

Plus **`#film-skip`** — the element and its `t`-gate (`t >= 16.5 && t < 64.5`) computed in the
frame loop from `tlRef.current.time()`, with the **focus rescue branch** that moves focus to
`#play` when the note hides while holding it. Copy: *skip to the table ↓*, Quiet Serif,
`T_SKIP` ride to the endcard (reduced motion: jumps).

**Acceptance gates.** Interface ink **≥3:1 in its breathed form**. Grid ghost ≤`GRID_INK`.
A12's skip-note assertions at `t = 16.4 / 16.6 / 64.4 / 64.6`. A1 green. **Exactly three
per-frame DOM writes exist in the film**: `--sky`, the ruler's `stroke-dashoffset`, and (later,
in P10) the caption writes inside their own windows.

**Must NOT touch.** **No parallax, offset, depth or 3D transform on any margin element** — they
are the sheet the world is drawn on, and a sheet that parallaxes against its own drawing becomes
a HUD. The layer never moves, never animates on its own, and never occludes a subject. No
`T_NUMERAL` or `T_STEP` in `styles.css` — the CSS lane is three values.

---

## P9 · The accessible path ★

**Size:** 3 days. **Every item here is a live defect on main or a missing first-class surface.**

**Read:** MM §5 (whole, including §5.1's mechanism and §5.2's three `t`-driven states), MM §6.6,
MM §7.5 (the seventeen anchors), MM §12.3 (D-7), MM §13.4 (D-16), MM §15.1 A12, MM §15.2 steps
12/14/15, SB §2's accessibility contract, SB §8 (Screen reader, Keyboard, Vestibular, Failure
and interruption), MM D-9, D-10, D-11, D-16, D-18.
**Code:** `src/App.tsx` (`:21–26` `DISCORD_URL`/`CTA_IS_LIVE`, `:75–78` the always-restart,
`:89` Lenis never instantiated under PRM, `:134` the per-rAF `window.scrollTo`, `:166` the
scrollY label flip, `:184–190` the skip ride, `:219–227` the prose précis, `:229` `#overlay`,
`:340` `#play`), `src/styles.css` (`:229–230` `pointer-events: auto`, `:286` and `:394`
unguarded `:hover`, `:390` `mix-blend-mode` on `#play`, `:466–476` `.sr-only`, `:486–489` the
browser outline), `src/Hero.tsx:310` (`#hero-skip`), `src/prmForce.ts`, `docs/copy-spec.md`.

**Deliverable.**

1. **The SR document** replaces `App.tsx:219–227`'s prose précis. **First in DOM**, visually
   hidden, in order: `#sr-skip` (`<a href="#play">Skip to the film controls</a>`, the first
   focusable element in the document) → *Skip to joining the Discord* → **the eleven captions
   verbatim** with SB §8's eleven scene sentences between them → the endcard tagline and subline
   → the real Discord link as a real `<a>`. The canvas is `aria-hidden="true"`. **SEO reads this
   document, not the canvas.**
2. **Tab order.** Move `#play` **above** `#overlay` in the tree. Target order: SR skip → play →
   skip note (only after t16.5) → CTA. **The shipped DOM cannot produce that order today.**
3. **The focus rectangle.** Move `mix-blend-mode: difference` **off `#play` and onto its two
   children** (`#play > svg, #play > span`) — no DOM change needed — so the button itself is
   unblended and can own a focus ring that does not invert. Then the drawn double-line utility
   (`::before` at `inset: -4px` and `::after` at `inset: -7px`, opacity 0.45, rotated 0.4°) on
   the **five** focusable elements. **The CTA is the one override and it is free** — its
   existing `::after` already *is* the second line. `outline: none` without its replacement is a
   hard failure; both land in this commit.
4. **Guarded `:hover`** — wrap `styles.css:286` and `:394` in
   `@media (hover: hover) and (pointer: fine)` so hover does not stick after a tap, and add the
   `:active` states.
5. **The CTA's dead-link fix (D-18).** Delete `#endcard-cta { pointer-events: auto }`; gate
   `#endcard` with **`inert`** until t65.0 (`inert` leaves the tab order, `pointer-events: none`
   does not); and **when `CTA_IS_LIVE` is false the anchor does not render at all** — the
   subline stands alone. A dead `#` at `opacity: 0`, clickable for the whole film, ships today.
6. **The play/replay label moves off `scrollY`** to `t >= 64.5`, as a pure function of `t`.
7. **The seventeen rest anchors** (SB §2, by name) + `↓/↑` stepping over them at `T_STEP` ·
   `PgDn/PgUp` chapter · `Home` cover · `End` endcard · `Esc` de-escalates play · `Space`
   play/pause. **S6 has none, by design.** No anchor lands mid-void.
8. **Touch soft rests** — ±0.35 t, `T_REST` (0.22 s), fired only after momentum has died,
   **cancelled by any input**, off on desktop, off under reduced motion. L3's one exhaustive
   exception.
9. **PRM play mode (D-16) — a live WCAG 2.2.2 / 2.3.3 defect on main.** With Lenis never
   instantiated under PRM the loop runs `window.scrollTo` **every rAF frame** — 60 repositions a
   second of smooth auto-motion delivered to a visitor who asked for none. Replace with
   **anchor-to-anchor stepping**: the next anchor's `t` reached in `(t_next − t_now)` seconds by
   a **single** `scrollTo` at that anchor's scroll position, held for the remainder. Same 66 s
   pacing, one instantaneous reposition per anchor.
10. **D-7 reload.** A **cold** visitor (no `gg.seen`) restarts. A visitor with a live
    `sessionStorage 'gg.t'` **resumes at `argmin |anchor − t|`** over the seventeen anchors, so
    every restored frame is a composed one. One write per second while scrolling, one read on
    mount, both try/catch-guarded. `history.scrollRestoration = 'manual'` stays for both paths.
11. **A12** — the three `t`-driven DOM states asserted at `t = 16.4 / 16.6 / 64.4 / 64.6 / 64.9
    / 65.1`, plus `document.activeElement === #play` after hiding the skip note while it held focus.

**Acceptance gates.** A12 green. **★ HUMAN, MM §15.2 step 15:** tab from load and get exactly
SR skip → play → skip note → CTA; **the drawn double-line rectangle is legible on paper, on the
blackout and on the board**, never suppressed, never the browser default; no traps; focus never
lands on `<body>`. **Step 12:** play mode end to end 66 s ±1 s, pauses on `visibilitychange`,
yields to wheel/touch/key, `Space` with focus on `<body>` does not page-down. **Step 14:**
`__prmForce(true)`, reload, walk — **nothing moves that was not scrolled**, and PRM play steps
rather than glides.

**Must NOT touch.** No hover-only state anywhere — there is no hover during the film at all.
`:focus-visible` always receives the identical visual change as hover, plus the rectangle.
No analytics, no cookies; one `localStorage` convenience flag (`gg.seen`) and one
`sessionStorage` key, both try/catch-guarded. No copy invented — `copy-spec.md` is verbatim.

---

## P10 · The Hand ★

**Size:** 4–5 days. **The largest interface prompt, and the only one that edits shipped Cover
files.**

**Read:** MM §6 (whole — §6.1 the two technologies, §6.2 the write-on with its authoring
constraint, §6.3 the flush and the three defects that killed the CSS ramp, §6.4 the scrub-domain
rules, §6.5 the endcard's four shipped tweens), WD §4 (the three voices), SB §2's caption row,
SB §6's typography table, `docs/copy-spec.md` (LOCKED, verbatim, rows 1–11), MM §15.1 A8,
MM D-8, D-17, ERRATA 2 and 12, ERRATA Part 2's *"One gap no doc books"*.
**Code:** `src/App.tsx:31–49` (`CAPTIONS` and the shipped `high: true` fix),
`src/film/timeline.ts:81–87` (`cap()` — its signature does not change), `src/HeroWordmark.tsx`
(the hand to match), `src/styles.css:101` (Metamorphous on `.caption`), `:348` (`#hint`),
`:385` (`#play`), `src/hero.css:200` and `:247`, `package.json` (`@fontsource/metamorphous`).

**Deliverable.**

1. **Eleven authored stroke SVGs** — `open1` `open2` `me1` `me2` `me3` `me4` `light1` `set1`
   `welcome` `pitch1` `pitch2` — **plus the endcard tagline**. In the wordmark's hand. Copy
   **verbatim** from `copy-spec.md`; the lettering may never restate or reword a line. **Same
   element ids as today**, so every `cap()` call drives them unchanged.
2. **The authoring constraint, and it is binding:** `N ≤ round(fade × 15)` paths — **≤6 at
   `T_BEAT`, ≤4 at `T_PUNCH`**. A "stroke" is an authored path at **word or word-group scale**,
   not a pen stroke per letter. `me3` ("I did.") is two or three paths; `me2` is four.
3. **The write-on.** `cap()` tweens a progress object instead of `opacity`;
   `WRITE_STAGGER = 3` concurrency; **integer `stroke-dashoffset`** (sub-pixel dash offsets are
   invisible and the guard is what keeps the cost honest). **The forward exit is an un-write** —
   the second `tl.to` runs progress 1→0 through the same ramp, so strokes erase in the order the
   pen would lift. Forward exit and reverse exit are the same read; one mechanism, one grammar.
4. **The graphite⇄ink flush** — a **second `tl.to` at the same position, duration and ease as
   the curtain tween that triggers it**, staggering across the paths in the tween's own
   progress, writing through a **17-entry colour LUT built once at mount**. Not a CSS ramp: a
   fixed width in curtain-space is not 200 ms of film-t under `power2.out`, the per-path `--k`
   cannot be derived in CSS from one `--flush`, and it wrote a custom property on caption
   elements **every frame of the film**. Two tweens at one position on one scrubbed timeline
   cannot desync, because a scrubbed timeline is **positional**.
5. **The `me*` band.** The four `me*` lines seat at **24% of viewport height**, not the shared
   lower third — the shipped `high: true` flag at `App.tsx:31–34` is the ledgered fix (the lower
   third crosses his tunic at **3.54:1**, under the 4.5:1 floor, and no elevation inside the
   20–75° bench clamp moves it off). A per-caption authored property, checked at every
   breakpoint, **never a runtime decision**.
6. **Metamorphous retires — the gap no doc books.** WD §4 declares *"Three voices. No fourth"*,
   and `@fontsource/metamorphous` currently sets every caption, `#play` (WD §4 assigns
   play/pause/replay to Cinzel), `#hint` (WD §4 assigns it no voice), and **two elements of the
   shipped, verified Cover** (`hero.css:200` the hero tagline, `:247` the meta line). Reassign
   all four per WD §4's voice table, then **drop the dependency**.

**Acceptance gates.** **A8:** exactly eleven caption ids matching `copy-spec.md` rows 1–11 byte
for byte; no two windows overlap; ≥0.12 t edge to edge; every SVG satisfies
`N ≤ round(fade × 15)`; the SR document carries all eleven verbatim in order plus the tagline
and subline and a real `<a>`. Caption contrast **≥4.5:1 on its band at every breakpoint**.
Zero allocations outside the eleven caption windows; measure the write-on once (target
<0.05 ms/frame) and **do not build a cache for it**. **★ HUMAN, §15.2 step 3:** each `me*` line
readable before it un-writes at natural scroll pace (D-8's only real check). **★ HUMAN: the
Cover is re-walked at all five breakpoints after the font reassignment** — it is shipped,
verified work and `docs/build/P5-REVIEW.md` is its record.

**Must NOT touch.** `cap()`'s signature. Any caption's `at`, `hold` or `fade`. **Re-timing is a
hard gate** — D-8 is explicitly *not* a request to re-time the `me*` cluster. No twelfth
caption: copy is LOCKED and row 12 of `copy-spec.md` is the endcard **block**, not a caption
(ERRATA 2). No wipe on a caption and no write-on on a font — using the wrong one is the most
visible possible tell that the lettering is not drawn. **The Hand never revises**: the world
carries erasures, the narrator does not.

---

# ACT 3 — THE WORLD

Every stage prompt in this act shares a standing contract, stated once here and assumed by all
eight:

> **Standing contract for a stage prompt.** Read WD §5 (the palette permission table and the
> five colour laws), WD §7 (the material recipes and the technique letters A/B/C/D), WD §8 (the
> chapter families and the shadow policy), WD §10 (the depth language), SB §3's beats for the
> stage (all nine fields per beat), SB §4's transition recipes for any transition the stage
> uses, SB §6's asset bill rows for the stage, SB §7's beat row, SB §8's PRM stills row, and the
> ERRATA in full. **Own** the kit items the bill marks `N` for this stage and register them in
> `surfaces.ts` and `docs/build/TEXTURES.md`; **reuse without re-baking** everything an earlier
> stage already authored. Author each `A` beat's `portraitLook` beside its landscape camera.
> Register the stage's `tl.set` pairs in A2, its page turns in A3, its curtain windows in A4 and
> its world casters per SB §6 rig ruling 4. **Retire every named hatch site by NAME.**
> **Gates on every stage:** `pnpm check` green · A1 ×3 · `figure.check` on every `A` beat ·
> `draws.check` ≤120 at the stage's authored cameras · the per-mesh census matches SB §6's row ·
> zero `hatch(`/`crossHatch(` call sites left from the stage's list · zero console errors on a
> full forward and backward walk. **Never on any stage:** no hatching · no tone mapping · no
> `InstancedMesh` · no infinite ground plane · no smooth Lambert mass, ruled analytic stripe,
> default primitive or gradient wash (rejected on sight) · no eighth transition · no re-timing ·
> no new copy · no unmotivated light.

## P11 · S1 — The Claim ★

**Size:** 4–6 days. **The film's first v2 art and the proving ground for the whole kit.**

**Read:** the standing contract, plus SB §3-S1 (header + five beats), WD §13's S1 row, SB §9
risk 5.
**Code:** `src/film/world.ts` — `buildAmbush` (by name), `buildAdventurer`, `buildFlames`,
`buildArrow`, `buildRayBurst`, `buildRock`, `buildGround`'s `earthPlane`/`grassPlane` (by name;
the docs' line numbers are ~278 low), the `camp` children-filter coupling; `src/film/Film.tsx`
(P2 removed the `0xffb45e` light — confirm); `src/film/timeline.ts` (S1's shipped marks 5.0 /
5.9 / 6.3 / 6.6 / 8.1, `boltThrow`/`arrowThrow`, the flinch composite, the leap's three tweens).

**Deliverable.** **Camp island** and **cliff island** at set scale (the cliff **baked once for
the day family** — this is what lets S2's night and S7's dawn share one asset). Genuine night:
`skyDusk #6D78AE` air, the campfire as the sole key on the exterior-night preset, embers on the
world clock, the amber ramp carrying practical light. **The two infinite planes die.** Rock and
cliff take baked 3-tier tone riding `roughen()` with strata as **contour steps, never hatch**
and section bands at every cut; drybrush on climbable edges only. Adventurers re-surfaced
**silhouette-first, painted cloaks, zero interior hatch**. Bolt and arrow impacts as painted
strokes plus `rayGold` bursts; scorch is **painted dark pooling**. The camp gets an explicit
island group, and **`onlyFor(world.camp, 0, 18)` becomes `onlyFor(world.camp, 0, 16.4)`** — the
camp must vanish inside the void hop's anchorless window, not mid-S3 on another island. S1-B4's
**NEW MARK**: `look` toward lens at 7.75–7.95 from three-quarter, half a beat, not dead-centre —
the plant for S2's address.

**Kit items this stage owns:** rock kit (boulder ×3, outcrop cluster, cliff strata stack, scree,
pebbles) · light kit (campfire: ring + logs + tongue flames + glow) · cast tier (adventurer
trio) · keeping props (bedroll/pack/spear, arrows + shield + bolt) · cloud/streak flats + ember
particles. **Hatch sites retired:** `1573` (S1 rock face) and `1644` (the **adventurer's** cloak
tone — ERRATA 7; it was never the goblin's).

**Extra gates.** **Per-mesh materials: zero** for this stage (SB §6's census). Two of the five
beats are `E`; B3 is **reclassified to `A`** — the flinches are the acting. **The sheet-edge
rule is satisfied twice in B2** — no wide may crop an island on all four sides. **★ HUMAN, and
it is SB risk 5:** *"Night on a paper page is unproven… if the read fails — too pale, or the
day-baked shadow side contradicting the fire's direction — the fix lane is intensity and air
only; the bake and the azimuth are law. Judge at the first S1 walk, flat transfer, no grading
escape hatch."*

**Must NOT touch.** The cliff island's bake family (it is shared with S2 and S7). The two
licensed page turns at 7.5 and 9.5 are S1's only cuts.

## P12 · S2 — The Address ★ · FLAGSHIP 1

**Size:** 2–3 days.

**Read:** the standing contract, plus SB §3-S2 (header + five beats), WD §13's S2 row, WD §11's
tick paragraph, ERRATA 12, P0's recorded verdict on the erasure.
**Code:** `src/film/timeline.ts:305` (the hand-rolled `{ timeScale: 0, duration: 0.2 }` plus
`drain(12.5, 1, 0.6)`), `src/film/curtain.ts:196–202` (the named `tick()` recipe, with
`TICK = { clock: 0.15, curtain: 0.35 }` already exported), `src/film/pencil.ts`,
`src/film/stages/trilayer.ts` (`rig.aliveShadow`).

**Deliverable.** The cliff's underdrawing gains construction ellipses, measure ticks and
authored contours in `graphiteDark`. **Flagship 1: one erased, redrawn contour** in
`graphiteLight` under the committed line, with a legible smear direction, plus **the boulder's
prior-position ellipse** as one of the film's exactly four eraser ghosts. The grid ghosts in.
Dust hangs as **the film's only Prep-side particle** — a graphite scribble sprite, frozen by
construction. **His contact shadow is the only shadow in the frame** (`rig.aliveShadow`). One
authored framing on the erasure inside the freeze.

**And the tick is fixed here.** `timeline.ts:305` still hand-rolls the freeze; **neither S2's nor
S5's freeze calls the named `tick()` recipe**, even though `TICK` is already exported. Convert
both to the recipe — `world.timeScale → 0` in ≤0.15 t **no ease**, `curtain → 1` in 0.35 t
`power2.out`, margin breathes to full over `T_BEAT` at **12.6**. **This closes FINDINGS P1-T3
and P2-T4**, which the direction has been carrying since v1.

**Extra gates.** Per-mesh materials: zero. A4's `[12.5, 12.85]` window. The four `me*` letterings
on the 24% band clearing 4.5:1. **★ HUMAN:** the flagship read at 390 / **768** / 1440 (SB risk
6 — 768 is where the argument thins for half of real traffic); *"a mark the camera is forbidden
to point at is a mark that does not exist."*

**Must NOT touch.** S2 is Prep: **no key light at all**. No frontier exists in S2 — experience
§6's "color floods back along his walk direction" is superseded. No fifth eraser ghost.

## P13 · Performance: the prepass number and the streaming ladder

**Size:** 1–2 days. **Runs before S3 is polished, because D-12 says so.**

**Read:** MM §14 (whole — §14.1 the per-pass budget, §14.2 what actually runs per frame and the
four passes, §14.3 throttles, §14.5 the ladder and the tier measurement, §14.6), MM §12.5
(chapter streaming), MM D-12, WD G2's schedule.
**Code:** `src/film/curtain.ts:438–491` (`curtainPass.render`'s three `renderer.render` calls,
`:448`'s mask skip, `:462–474` the normal/depth override), `src/film/Film.tsx:159–177` (the idle
throttle and its early return), `src/App.tsx:211` (the DPR cap), `src/film/stages/rigs.ts:121`
and `:129` (shadow map size and radius).

**Deliverable.**

1. **The prepass measurement (D-12).** Measure Pass A (normal/depth, full res, **runs every
   frame of the entire film** because the sketch pass's contour ink is always on) against
   §14.1's ≤3.0 ms on the built S1/S2 art. *"If it exceeds 3.0 ms on the ribbon island, the
   ladder re-orders."* Record the number. **This is the single largest lever on the page and no
   shipped number reflects it.**
2. **The tier measurement, one measurement not two.** After `entranceDone()`, collect frame
   times for **90 rendered frames satisfying `!idle.skip && scrub.isActive()`** — frames the
   visitor is actually scrubbing — and take the median. >20 ms → tier down one; >28 ms → two.
   **Never tier back up mid-session.** The draft's t≈20 re-evaluation is cut.
3. **The seven-step ladder**, garnish first, grammar last, including **step 7's decided rule**:
   on a tiered-down device the beat's three practicals collapse to **one slot at their
   centroid, chosen once when the beat's materials are built** — not "nearest to `world.look`",
   which flips between S6's three candles frame to frame.
4. **Texture upload gating.** `if (!scrub.isActive() && uploadQueue.length)
   renderer.initTexture(uploadQueue.shift()!)`, placed **after** the idle early-return guard,
   **cap one per frame**. The draft's `idle.skip` hook does not work: it is true only after
   twelve seconds of no input *and* no `t` change, and the loop returns before any other code
   when it is.
5. **The G2 bake schedule.** Each stage kicks the **next** stage's class bakes during its own
   idle (`requestIdleCallback`, hard fallback at the stage boundary). **A class bake that misses
   its window renders its class in flat class albedo without the stroke tone** for the frames it
   is late — which reads as a thinner coat, not as a broken surface.

**Acceptance gates.** `bake.check` green. A13. **§15.2 step 16:** 4× CPU throttle on S1 and S2 —
the §14.1 budgets hold per pass, no hitch at a chapter boundary, **no catch-up jump after a
stall** (that is `lagSmoothing(0)` doing its job), no texture-upload stall mid-scrub.

**Must NOT touch.** **Never shed:** the curtain pass, the seam, the reveal shells, the alive
shadow, the goblin's gait and breath, the captions, the focus rings, the SR document, the
margin's breathe. *The concept sheds garnish, never grammar.* No user-agent sniffing — the tier
is chosen by measurement. No spinner, no skeleton, no blocking screen.

## P14a · S3 — the path ribbon island

**Size:** 4–5 days. **The big build, and it sets the film's draw ceiling.**

**Read:** the standing contract, plus SB §3-S3's header (the deleted list, the shadow ruling,
the void hop) and B1, SB §9 risk 3, WD §13's S3 row, WD §9's flora kit.
**Code:** `src/film/world.ts` — `buildPathProps`, `buildGround` (by name), the 44 flat-fill
trees, `buildPine`, `buildOak`, `buildMushroom`; `src/film/stages/hero.ts` (`bakeIslandAlbedo`,
`bakeBark`, `bakeFoliage`, `silR`, `buildTree`); `src/film/timeline.ts:321–323` (v1's `tl.set`
teleport, which the void hop replaces).

**Deliverable.** **The path becomes a ribbon island** — and because *the hero island is a slice
of it*, its albedo, bark and foliage bakes **extend 1:1**. Ribbon path, verge, cut edges both
sides, entry ruts that **stop where the pencil line stops**, the island's grid ghost. The 44
flat-fill trees die; **the flora kit's ten items are authored here and merged one
`BufferGeometry` per class per island** — a 40-tree stand is one draw call. Silhouette radii
come from **`silR()` derived from the tier cone profile, never authored free** (the P4d-T2
lesson, closed at P4e and not to be re-opened). `poster: 12` on crowns. `stroke.sheet: true`.
**No wear on foliage — trees are tended, not handled.**

**The void hop** (S3-B1, stage-owned): from 15.85 he runs off the cliff rim onto bare paper, the
travel line draws ~1.5 units ahead, the camera swings to three-quarter-back and tightens so that
for ~0.5 t **nothing but paper, the line, him and his contact shadow is in frame**. Inside that
anchorless window **one scrub-tied `tl.to` slides goblin + camera + look by a constant world
offset** onto the path island's approach — a match-on-motion reposition, invisible forward,
exactly reversible backward. **No page turn is spent; the seven-transition catalog is untouched.**

**Shadows on this island: none.** The ribbon registers **no world casters**; every painted prop
is grounded by the contact blob baked into the island albedo. This is what stops a graphite tree
east of the frontier throwing a shadow onto painted ground west of it — *a drawing casts
nothing* — and it removes any need for the key's ±8 box to cover a 30-unit island.

**Extra gates.** **`draws.check` at the B3 and B7 cameras is the film's ceiling** — every later
stage is measured against this number and *"just one more separate mesh"* on the ribbon is where
the budget dies first. **§15.2 step 4a, the void hop's reverse check:** at 390×844 and 768×917,
walk t16.4→17.1 and back at three speeds — **no island pixel in frame at any point of the slide,
in either direction.** Portrait's taller FOV is the risk case; **widen the anchorless span by
0.1 t if it fails**, never move the camera.

## P14b · S3 — the seven stops, the lantern, the frontier's art ★

**Size:** 3–4 days.

**Read:** the standing contract, plus SB §3-S3 B2–B7 and the t26.5 handoff, WD §7's *seam*
section, P4's committed state schedule (**this prompt may not alter it**).
**Code:** `src/film/timeline.ts:434–526` (the shipped per-stop chain and the six `reveal()`
sites at `:491–521`), `src/film/world.ts` (`buildChest`, the cave mouth, the sign, the ravens,
the mushrooms, `buildMushroom`), `src/film/curtain.ts:110–140`.

**Deliverable.** The seven prop stops kept at `segAt = 17 + i·1.857`, `actionAt = segAt + 1.35`
— **five land inside this stage, the last two belong to S4's t-range.** Each prop gets its
authored surface **plus one whisper of history** (older nail holes on the signpost, a graphite
ring where mushrooms grew last season). **The lantern beat is the thesis image**: the pool
blooms, trees take their paint back, shadows arrive with colour, and the frontier absorbs the
reveal. The lamppost is **restaged so the flame is never occluded by its own post** and the
bracket resolves against paper (P4d-T5 is a staging rule now, not a weight problem).

**Hatch sites retired here, by name:** `1941` cave mouth → `caveDark` paint + contour · `2147`
and `2189` sign "letters" → authored scribble rows · `218` chest interior → **painted dark
pooling** · `573` mushroom gills → **one committed shadow mass under the cap, one value step, no
strokes**. The sun disc and ray decal die — morning is the day-family key at `skyDay`.

**Two practicals** (campfire + lantern — the *"three embers of motion in one frame"* read is two
practicals plus the door's motion, not three lights). **Four per-mesh materials:** the fire2
group (ring + logs + flames + glow merged to **one** material carrying the alive step), the
lamppost group, cave+door, chest+lid+coins. Three banked idles registered (fire2, lamppost, cave
door settle-creak).

**Extra gates.** Per-mesh census **exactly 4**. **★ HUMAN, SB §7:** S3-B3 at 390 px — lamppost
and goblin **stacked vertically** (post exits top of frame, lit ground fills the lower half,
caption band on the quiet outer edge), he clears 84 px, the band clears 4.5:1, and **the
graphite→ink flush is QA'd at 390 exactly**. Held-frame audit at 25/50/75% of the frontier sweep
and of the lantern's reveal shell, where the idle amplitude is half up.

**Must NOT touch.** P4's state schedule. No radial pool. No `seamDir`. The chest's judged coins
are a `PUPPET.pop`, **not a verb** (ERRATA 4). The S3 cave door's "previous swing arc" is
**deleted** — it was the same designed mark as the tavern door's under a second name.

## P15 · S4 — Proof of Scenery ★ · FLAGSHIP 2

**Size:** 4–5 days.

**Read:** the standing contract, plus SB §3-S4 (header + six beats), WD §13's S4 row, MM §10.7's
theatre-disc paragraph, SB §9 risks 16 and 17, P0's recorded verdict on the arcs.
**Code:** `src/film/world.ts` — `buildTheatre` (by name), the rope, the mountain flat;
`src/film/timeline.ts:570` (the disc, converted to absolute by P1), `:573` (the rope's yoyo,
`repeat: 11` by P1), `:526–527` (the two 29.1 reveals that retire here).

**Deliverable.** Theatre island card + backstage apron. The disc becomes a **planked painted
stage** on a floorboard-family directional bake with the **ruled silhouette kept** and paint
supplying all tone, kerb-throat drybrush where the rope runs (retires `2628`/`2670`/`2689`/`2759`).
The forest half turns on **visible radial rails**. **Theatre machinery — the film's one asset
with no paint side**: capstan + spokes, six radial rails, **two outboard counterweight booms**
sweeping at radius ≈8.2 outboard of the kerb, four blocks, boom rotation slaved to
`stageDisc.rotation`. *That outboard sweep is what makes flagship 2 a shot.* **Flagship 2: the
scribed arcs worn into the apron bed**, 3–4 arcs plus one overshoot, plus **the tree's
prior-position ellipse** (eraser ghost 2). The mountain flat becomes **reserved-paper snow** —
the page showing through, shaped by blue-grey shadow strokes and a drawn windward edge; an
honest theatre flat with a graphite brace and slot visible at the freeze. *It is barely painted
because nobody has played there yet.*

S3's last two prop stops land here (mushrooms at 27.635, signpost at 29.492). **The two shipped
reveals at 29.1 (`tufts`, `treeline`) retire** — the t30 exhale takes them, saving two per-mesh
materials and two tweens. The rope is `alive`-stepped at contact to keep it painted **through**
the flicker — it is **not** a touch reveal (there is no Prep to reveal from at `curtain = 0`).
`set1`'s ink⇄graphite flush keys off the curtain value.

`skyOvercast`, flat near-vertical key, **no practicals**. **No radial seam** — an angle around a
pivot is a second shader mode, not a dot; the turn stages with the shipped seven-transition
grammar.

**Extra gates.** Per-mesh census **exactly 3** (mushrooms, signpost+board, rope). **★ HUMAN,
§15.2 step 7:** the disc at t31.5–34.3 at **flick speed, both directions, three times** — the
turn direction matches the scroll direction by construction, *and this walk is what confirms no
smoothing crept back in.* Flagship 2 at 390 / 768 / 1440. SB risk 16: *"the S4 stillness is
deliberate and may still read as dead. If the wide sags, the fix is dressing density, never turn
speed — time is locked."*

**Must NOT touch.** `DISC_SMOOTH` does not exist and is not reintroduced — the `SCRUB` glide
**is** the disc's inertia. No practicals on this stage. Time is locked.

## P16 · The four remaining verbs

**Size:** 2 days.

**Read:** GD §10 (the action library table and the ERRATA at its head — **five have SHIPPED, do
not re-cost them**), GD §11 and §11.1, MM §10.3 and §10.6, MM §2.3's follow-through rules,
SB §3-S5-B4/B7 (`hop`), §3-S6-B3 (`hang`), §3-S6-B4 (`plantAndPat`), §3-S6-B1 (`touchUp`),
ERRATA 4 and 13.
**Code:** `src/film/actions.ts` (the whole verb contract; `:631` `freeze`, `:669` `stow`,
`:694` `draw`, `:722` `scribe`, `:752` `pocket`, `:772` `throwDie` as the pattern to match;
`:48–72` `applyGait`; `:300` `settle`; `:322–329` `look`; `:377–378` the ear lag;
`:568` `nudge` — *already the pencil butt*), `scripts/puppet.check.ts`.

**Deliverable.** Four verbs, same contract as the nine that exist: caller-supplied
`(tl, g, at, dur, …)`, writing **only** into timeline-owned channels, **absolute end values
only**.

- **`hop()`** — onto and off the S5 bench. Segmented-arc grammar: two or three position tweens,
  `power2.out` then `power2.in`, with chest/pelvis/ear follow-through. **Author the arc symmetric
  and the reverse is a hop-down for free.**
- **`hang()`** — guide the sign's drop in from under it, `express('strain')`, then `tap` it level
  twice. The film's **one** authored `bounce.out`, spent here.
- **`plantAndPat()`** — set the root ball, pat the soil once, move a pace along the row. ×3 at a
  quick clip.
- **`touchUp()`** — one brush stroke; the paint side arrives along the bristle line. **Used
  exactly once in the film.** Author against a placeholder brush; P18 lands the real prop.

**Acceptance gates.** `puppet.check` — the gait channel set and the authored channel set never
overlap; at `speed 0` every gait term is exactly 0 and the authored pose owns him. A1, A5. His
motion identity holds: attack 90–140 ms `power3.in`, settle 450–700 ms `power2.out`, overshoot on
head mass only ≤4%, **ears last** at `EAR_LAG` +80 ms on `back.out(1.3)`, chain order pelvis →
chest → neck → head → ears. **Anticipation is weight, not windup** — and none at all on the easy
ones.

**Must NOT touch.** No integrator, no spring, no velocity drag — `hemFlick` is driven by
**authored action keys**, and GOBLIN-B's 200 ms velocity drag and GOBLIN-C's spring are both
rejected by name. Zero per-frame allocation, zero material swaps, zero geometry morphs. Do not
touch the five shipped verbs. Do not re-cost GD §13 steps 6 or 7 — **both are DONE and gate G8
is CLOSED.**

## P17a · S5 — the room

**Size:** 4–5 days. **SB risk 3's second-densest set: the densest room, plus a window diorama,
plus a cast of six.**

**Read:** the standing contract, plus SB §3-S5's header, SB §6's set pieces and carpentry rows,
WD §13's S5 row, WD G6 (**what the humans are during the freeze**), SB §6 rig ruling 1's
interior family.
**Code:** `src/film/world.ts` — `buildTavern` (by name, ~470 lines), `buildFinger` and
`nudgeFinger` (both retire at P17b), the hearth, the window, the table, the sheets, the DM
screen, the shelf, the benches.

**Deliverable.** Tavern island card + cutaway shell, **open side +z by construction**, sized
against `MAX_PULLBACK 2.2` so portrait never sees outside the set. The **interior key family at
+38°** — the film's one azimuth move, lighting only assets that exist nowhere else — with
**hearth + candle practicals carrying the room and the key demoted**; dark corners kept.

Retirements, by name: **`3018` window night → a real view of the undrawn world through the
glass** (*the room is finished; outside is still pencil* — WD calls it the best single shot idea
in the field). Implemented as: muntin frame kept, **no glass material**, and behind it **two
flat baked graphite cards on `MeshBasicMaterial`, outside the trilayer** — which closes the
"stays drawn" gap with **zero new uniforms**. **`3059` firebox → painted dark + coals.**
**`3131` table wear → drybrush**, on a wear bake carrying forearm drybrush and **one repair
patch exactly one value step off**. **`3249` sheets and `3277` DM screen → authored scribble
rows**; the screen gets **a dedicated 256² map-vocabulary bake, NOT a `bakeBoardMap()` slice**
(that is what keeps G2's schedule intact) and **one per-mesh material with `alive = 1` set at
build**. **`3001` tavern bay → drybrush.**

Benches ×3 with a **rubbed-paint landing patch on the hop bench**. Shelf + five bottles, rubbed
at grab height. The cast — DM + two players + three patrons mid-laugh — silhouette-first, one
direction per garment panel, `poster: 3`, committed shadow mass, **no interior hatch**.

**G6, and it is the shot:** the DM, the players and the patrons **all freeze into the
underdrawing like everything else.** They are never `markAlive`d, in any stage, under any
freeze. *The players are in the Performance; the goblin is the one who crosses.* Three graphite
figures caught mid-laugh, a graphite die still wobbling, a graphite mug ring on the table — and
**one painted goblin walking through them, casting the only shadow in the room.**

**Extra gates.** `draws.check` ≤120 **and** ≤ the ribbon's number without a recorded decision.
`bake.check`. World casters: **the goblin only** (the room is frozen for most of the stage).

## P17b · S5 — the beats ★ · FLAGSHIP 3

**Size:** 3–4 days.

**Read:** the standing contract, plus SB §3-S5 B1–B8 and the t50 handoff, SB §4-6 (the
walk-through, its **three named QA cases**), MM §9.3 (`DEPTH_TIGHT`), MM §10.7's die paragraph,
SB §9 risks 7, 10, 11, 12, ERRATA 13, P0's recorded verdict on the rings.
**Code:** `src/film/timeline.ts:638–639` (**L7's one sanctioned exception** — a `tl.set` and a
`tl.to` on `dieInner.rotation` at the same position, where the set is the tween's from-state),
`:164–165` (`tavernSet`/`montageSet` windows), `src/film/actions.ts:568` (`nudge`, already the
pencil butt), `src/film/dieGeometry.ts`.

**Deliverable.**

- **The walk-through (t36–38), the film's most fragile transition.** The camera follows him
  behind the mountain flat; its braced graphite back wipes frame as a near-black silhouette
  plane; **darkness t≈37.2–37.9 held at `caveDark` lifted one value step (≈`#4E4133`), never
  true black**, with the margin breathing in `paper` at 55% (≥3.5:1). An exposure crossfade
  t≈37.8–38.1 opens on the tavern establish, and **the set swap happens entirely inside the
  crossfade** via the shipped `onlyFor` triads.
- **The die's jewel treatment** — `dieBone` gouache, **painted numerals QA'd at 390 px from
  B2's exact angle** (1 vs 20 vs neighbours unambiguous), worn edges, **one authored glint**
  (a miniature painter's dot-and-line baked into the paint layer, **never a specular**), real
  inertia in the tween, `SETTLE.heavy` settle landing **exactly** on the 1-face. **Dead still
  through the freeze** — `dieWobble` stays 0; any rock after the settle reads as the die landing
  twice.
- **The tick at 40.6** on the named recipe, margin breathe at 40.7.
- **Flagship 3: the graphite mug rings**, living **in the underdrawing layer** as `pencil.ts`
  ellipse strokes in the graphite ramp on `plank`, with one mug restaged onto the near edge
  beside its ring — plus **the tavern door's previous swing arc** (eraser ghost 3).
- **He strolls in**, `express('flat')` into the shrug (the deadpan is the film's editorial
  position on cheating), **`hop`** onto the bench, and **nudges the die with the pencil butt**
  — the mitt has no finger and he would use the tool anyway; the flip to butt-forward **is** the
  anticipation. The die takes paint at the moment of contact — **`reveal()`, 0.6–0.9 s, blooming
  from the die's own centre: the one G6 exception, and the only object at that table that
  crosses.** `DEPTH_TIGHT` on the macro, in and out inside one breath.
- **The spill-drop** as **a 0.2 t timeline tween, never world-clocked**, precisely so it re-hangs
  on scrub-back.
- **The exhale at 47.0** with `snapBack`, `welcome`, the cheer completing, the drop landing and
  the rings closing under paint.
- **`buildFinger` and `nudgeFinger` are deleted**, and `2914`'s crease hatch dies with them.

**Extra gates.** Per-mesh census **exactly 2** (the die, the DM screen's map face). **★ HUMAN:**
the walk-through's **three named QA cases** — a parked scrub mid-darkness must be a composed
frame; the set swap must hide **completely in both directions**; the S5 establish must be fully
composed on the emergence frame (the stale-frame trap). **§15.2 step 10:** step t37.9→38.1 and
back at one notch — **no rotation snap in either direction** (A1 is the only automated guard on
the t38 set-then-tween; this is the eye on it). **§15.2 step 11:** park at 49.5 / 49.7 / 49.9 at
every breakpoint including portrait's taller FOV — **no islet geometry anywhere in frame**; if
one appears, move `montageSet`'s open to `49.9 − PAIR_GAP`, **not the camera**. Risk 10: budget
rehearsal for the full-puppet nudge — bench + table is a stacked-furniture reach at proportions
where his arm is a third of his body; **`puppet.check` at both breakpoint camera targets**, and
the die may need to sit a few centimetres nearer the bench edge. Risk 11: *"judge in the built
frame, and thin the rings before moving the camera."* Risk 12: the reverse of the die's reveal
at macro scale has never been seen — if the un-painting reads as a glitch, re-judge the shell's
radius and duration **inside the shipped 0.35–0.9 s band, not with new machinery.**

## P18 · S6 — The Many Jobs ★

**Size:** 4–5 days.

**Read:** the standing contract, plus SB §3-S6 (header, **the six subjects section which
supersedes Chapter Three's R1 and R2**, seven beats), SB §4-5 (the page turn), WD §13's S6 row,
SB §9 risks 14 and 17, ERRATA 17 (**the chest vignette is CUT**).
**Code:** `src/film/world.ts` — `buildMontage` (by name), the six discs, the monster's
tick-stroke shag (by name — *already the correct no-hatch language, authored specifically as
not-hatch*), `buildRayBurst`, `buildHouse`; `src/film/timeline.ts:711–715` (the shipped
montage solve — *the figure floor is met by camera distance alone in all six, precisely because
a phone frame is 36° wide*).

**Deliverable.** Six discs become **islets with island edges** — ~5×5 square worksheet cards,
sectioned three-band edge, drawn rim with a stop-gap, grid ghost, page drop shadow — carrying
**non-verbal draughting marks in their margins**: dimension ticks, one arrow, an X where a prop
will stand. **`pencil.ts` primitives, never a font.**

**The six subjects, and there are six:** road · monster · sign · saplings · NPC miniature ·
candles. **The chest vignette is CUT** — it re-argued S3-B5 with the same registered prop thirty
seconds later, and the montage's job is to accumulate, not restate. `3809` `hoardTone` dies with
the geometry.

The monster **keeps its tick-stroke shag language and is repainted**, not rebuilt: `monsterHide`
gouache in three quantized tiers **riding `roughen()` displacement, never parallel bands**. The
NPC becomes a **based miniature** — the script's own simile made literal, and **at the flatten
every figure resolves to a token disc**; the product rhyme costs one prop, and it **never idles**
(its stillness among five idling vignettes is the rhyme, on purpose). The road vignette uses the
fence-post pencil and **the film's one `touchUp` brush stroke**, with **the brush + pigment pot**
authored here as hero tier — *pencil draws the Prep, brush paints the Performance: the trilayer's
origin story as two props.* The tavern sign gets the film's one `bounce.out` drop and its shutter
becomes **painted `caveDark` behind slats** (retires `3687`). The candles hand off to dawn.

**Three practicals — and this is why the cap is three.** Three touch reveals at 56.4 / 56.6 /
56.8, each with its own shell and its own material, each banked on its own `maskShell.scale.x`.

**Six page turns** at `50 + i·1.25`, each a camera `cut()` under **one frame of paper, never
black**, plus paired goblin relocate `tl.set`s at `c` and **`c − PAIR_GAP`**. Hatch retirements
by name: `3409` (deleted with the v1 cylinders), `3772` mound, `3784` stump rings → **painted
concentric value steps, never hatch**, `3864` written book → scribble rows. `buildRayBurst`
retires — *rays were v1's word for light.*

**Extra gates.** Per-mesh census **exactly 4** (the road mark + three candle flames). **A2** on
all six clusters plus the t50 handoff; **A3** on six of the nine page turns. **★ HUMAN, §15.2
steps 5 and 6:** park just before each cluster, step through at one notch, step back — *no pose
snap, no frame where he is in two places, no prop left revealed on the way back*; and the page
turns show **paper, never black**, no double flash, with the `at + 0.04` drift starting **after**
the cut, not with it. SB risk 14: check the monster's tiers **at the vignette lens, not in
isolation.** **S6 has no rest anchors, by design** — it is the one stage that rewards momentum,
and `PgDn` jumps it.

**Must NOT touch.** No lettering in the islet margins — copy is locked and the draughtsman
annotates in marks. No seventh vignette. The chest stays cut.

---

# ACT 4 — THE HANDOVER

## P19 · `bakeBoardMap()` ★

**Size:** 4–6 days, and **budget it like the hero; it will eat iterations.**

**Read:** SB §5.1 (the whole content list — **this is the vocabulary and it is fixed**), WD G4,
WD §9's board tier, SB §9 risk 1 (*"the film's whole bet"*), WD §16's art gates, ERRATA 22
(**no mip chain**).
**Code:** `src/film/stages/hero.ts:303` (`bakeIslandAlbedo` — the model for a deterministic
in-code canvas bake), `src/film/world.ts`'s `GridHelper` + `boardFill` + the trim grammar's
double rule and corner marks (by name), `src/film/stages/trilayer.ts` (`GRID_INK`, and P2's
rig-side atlas sampler slot), `scripts/bake.check.ts`.

**Deliverable.** `src/film/stages/board.ts` with `bakeBoardMap()` — **one deterministic 2048²
canvas bake, no mip chain**, painting **the map of the world the visitor just walked** in the
product's own vocabulary. It is **not** an export from the product: there is no wired path,
there is no forge, and no product export contains the film's world.

Content, oriented to the S7 top-down, and this list is the spec:

- **The battle grid at `GRID_INK`** — the board's underdrawing **is** the grid (a map is already
  both drawing and paint, which is the third truth, and which is why the board renders
  identically on both sides of any frontier and inside every freeze).
- **The village** (S6's gabled-house icons) with **one NPC token disc** at one-cell diameter on
  the square where he planted the miniature — `cloakIndigo` ring on `dieBone`.
- **Three party token discs** at the road-head nearest the cliff mark (`cloakIndigo` ×2,
  `cloakCrimson` ×1: the S1 trio, arrived, mid-session) and **one monster token** near a
  cave-mouth mark. **Tokens are what a DM recognises in half a second: this map is being played.**
- **Inked roads at 2 px** · **the river as bare paper with a drawn edge** plus its pigment band ·
  **six field washes** · **illustrated canopy blobs** at the tree stands · **the massif in ink**
  with reserved-paper snow · **two painted flame marks** on the ember-roof houses · **the cliff
  as a crag-mark with a cairn dot** — the flagship's location, findable by anyone who scrubs back.
- **Edge-handling wear** at the margins: drybrush lightening, one rubbed corner.
- The double rule + corner trim marks kept from v1's trim grammar, **painted into the bake**.

Plus: **the UV rects published for S7's twelve flatten groups.** One bake, two consumers, so
they cannot drift.

**Acceptance gates.** `bake.check` — the corrected 47.9 MB census holds **with the board
mip-free**. **★ HUMAN, and it is the film's conversion surface:** judged **flat at
`NoToneMapping`** at 390 px and 1920 px. **No smooth Lambert masses, no ruled analytic stripes,
no default primitives, no gradient washes — rejected on sight.** **No pentimenti on the board.**
**No goblin-green anywhere. No `#B6D648` anywhere.** A DM must read *"this map is being played"*
in half a second.

**Must NOT touch.** The board does not pan, does not zoom and accepts no pointer events at rest.
It breathes ≤0.5%, as a **scale on the board**, never a camera move.

## P20 · S7 — The Handover ★

**Size:** 5–6 days.

**Read:** the standing contract, plus SB §3-S7 (header, **the flatten's mechanism section —
decided there, not in the build** — and seven beats), WD G7 (whole), MM §10.7's flatten
paragraph, MM §9.3's rise, SB §0 amendments 1 and 3 and 4, SB §9 risks 4 and 13, ERRATA 5, 9, 10.
**Code:** `src/film/world.ts` — `buildCliffWorld` and `miniWorld` (by name; the cairn and
planted mushrooms are **already built and already the shot**), the roads/river/fields that sit
**outside** `miniWorld` and never flatten; `src/film/timeline.ts:915` (`stagger: 0.05` — the
last `stagger:` in the film), `:937` and `:962` (`die2`, converted to absolute by P1);
`src/film/stages/trilayer.ts` (P2's `uTriFlat`/`uTriFlatUv`).

**Deliverable.**

- **Flagship 4, the tended rim** — cairn + planted mushrooms, already built; restaged on the S1
  angle-echo and held 0.8 t on the hard cut, re-surfaced to v2. **The erased scorch-ring** beside
  the cairn is eraser ghost 4, **sited in B2, not B1**.
- **The miniature world becomes a real miniature** — houses, trees and massif re-surfaced,
  fields painted, **water as bare paper with a drawn edge** plus the water class's one funded
  pigment band with tangent-aligned lit dabs. **Not a desk, not a table of plates.**
- **Everything flattens.** Roads, river and fields join `miniWorld`'s lie-down, closing the v1
  split. **G7's construction, and nothing else is legal:** each flattenable prop's trilayer runs
  **`uTriFlat` 0→1 mixing the class albedo to its slice of the board bake, while the same tween
  runs `scale.y → 0.02` and settles rotation.** One timeline, one direction of travel, no branch.
  **Because nothing is instantiated or removed, reversing is the identical tween running
  backwards** — which is the only construction under which the site's most repeat-scrubbed
  moment is flawless in both directions.
- **Twelve merged groups**, x-keyed by `FLATTEN`:
  `offset = (originX − FLATTEN.x0) / FLATTEN.xSpan × FLATTEN.spread`, nearest at t60.00, farthest
  at t60.90, all complete by t62.00. **Driven from one timeline position, with no callbacks and
  no `stagger:`** — a computed offset is a *position* and a stagger is a *behaviour*; positions
  reverse. **This retires the film's last `stagger:`.**
- **`rig.seamX` is parked at `1e6` for the whole of S7.** The frontier *look* is authored into
  the flat ramp through the shader's existing `triDabN` noise. Driving the flatten off `seamX`
  would render the standing miniature world graphite and flip the world's east half to Prep in
  one frame at t60.
- **Each group's `uTriFlat` also scales its own practicals** — S7-B4's glow death rides
  `uTriFlat`, **not** the curtain (D-15; during the flatten `curtain` is 0, so `(1 − c)` is 1 and
  the glow would never die).
- **Painted god-ray cones** in `rayGold`: **drawn edge lines, dab-textured fill, a hard stop —
  never a soft alpha falloff.**
- The rise's `DEPTH_TIGHT` in and out inside one breath. The **t62 straight-down** (legal because
  the frame's content is the finished map). `die2`, the throw, the 20 filling frame.
- **Hatch retirements by name:** `3952` cliff cracks → painted value-break fractures ·
  `4016`/`4027`/`4044` scorches + trample → **gone with the remains** · `4208` massif → reserved-
  paper snow + 3-tier rock · `4260` water · `4297` field till → painted field washes.
- **The cliff flattens last** and he rides it down in the final half-beat. **He touches nothing:
  this is the one change he does not make by hand, because it is not a change — it is the file
  being closed.**

**Extra gates.** **A5: the film now contains no `stagger:` at all.** Per-mesh census **exactly
13** (12 flatten groups + `die2`). `figure.check` on B1 and B2, **with B6's registered exemption
in the beat table** or the check fails the throw at 390 px — *`die2` is the actor; he is
deliberately under the floor because the handover means the camera leaves him*, and **his last
floor-compliant acting beat is B2's straighten.** **★ HUMAN, §15.2 step 7:** the flatten at
t60–62 at **flick speed, both directions, three times** — the twelve groups keep their x-order in
reverse, **nothing is created or destroyed at either end**, and **each vignette's practical dies
with its own group, not with the curtain.** SB risk 13: the god-rays are **one gradient-wash
accident from violating the no-smooth-masses gate.**

**Must NOT touch.** No `seamX` anywhere in S7. Nothing may be created, destroyed, swapped or
spawned during the flatten. **Everything leaves frame by growth or by tween, never by despawn.**

## P21 · S8 — The Table ★

**Size:** 2–3 days.

**Read:** the standing contract, plus SB §3-S8 (three beats), SB §5.2 (**the endcard, copy-spec
direction C, verbatim**), SB §5.3 (the CTA's four states), SB §5.4, SB §4-7 (the morph), WD §12,
`docs/copy-spec.md` direction C, MM §6.5, MM §9.2's board-breath row, SB §9 risk 15,
ERRATA 18 and 19.
**Code:** `src/film/world.ts`'s `board` group (`GridHelper` + `boardFill` + the rule loops, by
name), `src/film/timeline.ts:951–961` (the board traversal — **per beat, never per frame**),
`:978–1063` (the endcard's four shipped tweens, already branched on `reducedMotion`),
`src/App.tsx`'s `#endcard` subtree, `src/styles.css`'s `.halo`.

**Deliverable.** The board group carries **the real bake**, retiring the `GridHelper` +
`boardFill` placeholder while keeping the group's material-locality and opacity-fade contract.
**The morph:** the d20's 20-face fills frame edge to edge by t64.5, the board's materials fade up
beneath it with `BOARD_WASH` settling at 0.5, the die settles with one 0.15 bounce and exits
64.85–65. **No cut — the promise of the whole film kept.**

**The endcard is copy-spec direction C, verbatim and unchanged:** wordmark → tagline → subline →
CTA, lettered **directly on the board**. **No box, no card, no wash, no drawn border, no
drop-shadow smudge, no rotation on the stack.** **Knockout instead of a box:** the tagline and
subline each carry a per-glyph paper halo — eight `text-shadow` layers in `--paper`, four at 6 px
blur and four at 12 px. **The grid must not read through any letterform, and no rectangle does
the work.** The endcard "meta line" **retires** (ERRATA 18) and **the carpenter's pencil does not
appear here** (ERRATA 19 — its two appearances are the Cover and S6-B1; its language survives
only as the CTA's hand-redrawn offset border).

**The CTA performs the film's one taught rule.** Rest: graphite outline, opaque paper fill, 2 px
ink border, a **second border offset 2–3 px, rotated 0.4°, at lower opacity**, boiling ≤0.8 px.
Hover **and `focus-visible` identically**: amber blooms through the letterforms **from the
pointer-entry side** over `T_BLOOM_CTA` (0.18 s) **as a GSAP tween on the JS side** — 0.18 is not
in the CSS lane's three values and **the check is not widened** — with **the contact shadow
arriving beneath alongside the colour**, the offset border re-inking 0.4°→0.9°, and the fill
inverting. Press: fill deepens to ink, 2 px settle. Click: `DISCORD_URL` in a new tab,
`rel="noopener"`, and **the die beside the wordmark rolls once to 20**.

**`BOARD_BREATH` as `board.scale.setScalar(...)` about its own centre — never a camera write.**
A per-frame `camera.position` write after `Film.tsx:200–205` makes the pull-back's
authored-vs-applied compare false every frame and the portrait pull-back multiplies into it.
The board carries **faint edge-handling wear** and no pentimenti — *contrast and product truth
outrank the theme at the conversion surface.*

**Extra gates.** Per-mesh census **exactly 1** (the board group). A12 (`#endcard.inert` at t64.9
and t65.1). **★ HUMAN, SB risk 15:** the halo system and `BOARD_WASH` verified against the
**final** bake at 390 px **and** 1920 px — they were tuned against an empty grid and a fully
painted map underneath is a harder knockout test. **The wash may need to rise; it may not fall.**
Endcard clamps are copy-spec law: stack 88vw under 500 px, wordmark 76vw, subline caps to two
balanced lines, halo contrast ≥4.5:1 verified at 390×844. Play swaps to **replay at t64.5**;
play mode ending at the endcard moves focus to the CTA politely (`preventScroll`, no jump).

**Must NOT touch.** No second CTA, no waitlist, no feature list, no backend, no analytics.
`DISCORD_URL` stays the single wired constant, and **if it is unset the button does not render.**
Nothing renders below the endcard.

---

# ACT 5 — THE FALLBACK AND THE GATE

## P22 · The Picture Book

**Size:** 2–3 days.

**Read:** SB §6's *The Picture Book* table (the eight compositions), SB §8's *Failure and
interruption*, MM §12.8, WD §4's accessibility/SEO split.
**Code:** `src/posterBake.ts` (it bakes the hero poster today — **frame 1 is already a
first-class artifact**), `src/App.tsx` (the mount path), `src/main.tsx`.

**Deliverable.** Eight painted frames, one per stage, baked at the compositions SB §6 names —
S1-B3 the volley at the rim medium · S2-B3 the flagship address with the erasure · S3-B3 the
lantern held wide with the tide-line at its foot · S4-B5 the flicker's held frame with the arcs ·
S5-B4 the frozen room with the goblin crossing it · S6-B1 the road · S7-B4 mid-flatten · S8-B3
the endcard at rest. Rendered as **the same page in plain scrolling HTML with the eleven captions
and the full endcard — same story, same CTA.**

**Detection:** a `webglcontextlost` listener **plus a constructor-level probe before mounting the
Canvas**. Context lost **once** → silent restore at the nearest rest anchor. Context lost twice,
or WebGL unavailable → the Picture Book. **There is no degraded 3D path — a half-working film is
worse than a good book.**

**And it is the OG/share/SEO surface**, which is why it is a real page and not an error state.

**Acceptance gates.** **§15.2 step 17:** WebGL off — eight frames, **eleven captions**, the
endcard, the real link; then force a context loss once and confirm silent restore at the nearest
anchor. A8's SR assertions hold on the fallback page too. Reload mid-film resumes at the nearest
anchor, **never a raw offset**, so every restored frame is a composed one.

**Must NOT touch.** No spinner exists anywhere on this site, including here.

## P23 · The gate ★

**Size:** 2–3 days.

**Read:** MM §15.2 (all eighteen steps, **in order**), MM §15.1 (A1–A13), MM §17, WD §16,
SB §9 (all seventeen risks, as the list to sign off), GD §14 (CLASS G and CLASS P).
**Code:** everything. `package.json`'s `check`.

**Deliverable.** MM §15.2's eighteen-step walk, run in order, with a written record per step
naming what was looked at — *because saying "verify it feels right" without naming the frame is
how a gate becomes a formality.* Plus:

- `pnpm check` green on all sixteen scripts: the thirteen shipped (`framing`, `pencil`, `die`,
  `puppet`, `curtain`, `island`, `motion`, `clocks`, `gearing`, `rigs`, `hero`, `hero-life`,
  `gob`) plus `figure`, `draws`, `bake` — **and `walk` (A1), run three times.**
- **Zero `hatch(` / `crossHatch(` call sites left in `world.ts`.** All 31 retired by name
  (ERRATA 8). `hatch()` and `crossHatch()` then delete from `pencil.ts`, along with the
  `curtain.ts` shader's near-black hatch accent.
- The **impeccable** pass on the built UI.
- The art-style guide.
- **Zero console errors on a full walk in both directions, on the dev grid and on a real phone.**
- Every one of SB §9's seventeen risks signed off as closed, mitigated or accepted with a reason.

**★ HUMAN.** This is the ship gate.

---

## 4. WHAT THIS SHEET DELIBERATELY DOES NOT SCHEDULE

Named so nobody schedules them by accident:

- **No art bible, no external asset sign-off gate, no forge or image-generation pipeline.**
  The build authors its own final art, in code, in this repo. *Any plan that reintroduces a
  generation run or an approval gate before a surface may be painted is wrong on its face.*
- **No `seamDir` promotion.** DECLINED (SB §0 amendment 2); its budget is already spent on P2's
  practicals, so the rig/shader extension count is net-neutral.
- **No DOF pass.** There is none in `story/src` and the experience doc budgets one post pass.
  The two beats that wanted it get the depth-to-paper ramp tightening instead.
- **No `DISC_SMOOTH`, no `T_REST_DETECT`, no tier re-evaluation at t≈20, no CSS flush ramp, no
  `BOARD_BREATH` as a camera move, no eighth camera class, no global focus utility.**
  MM §16.2 cuts all seven with reasons.
- **No goblin redraw.** GD is LOCKED; steps 6 and 7 are DONE; gate G8 is CLOSED. This is a
  surface and staging rebuild.
- **No re-timing.** `t = 66` and `gearing.ts:44–54` are fixed. Every document here restages art,
  never time.
- **No fifth flagship, no twelfth caption, no eighth transition, no third clock, no second post
  pass, no fifth eraser ghost, no seventh S6 vignette.**

## 5. OPEN QUESTIONS THIS SHEET CANNOT ANSWER

Flagged rather than guessed, because each needs a person:

1. **P0's verdict is genuinely load-bearing** and unknowable until it runs. If two of three fail,
   P15 and P17b change staging. The sheet's order survives either outcome; the prompts' content
   does not.
2. **P13's prepass number** decides whether the degradation ladder re-orders, which changes what
   P14a may spend. If Pass A exceeds 3.0 ms on the ribbon, step 6 (normal/depth → 0.75 res) may
   have to move above step 3.
3. **P19's iteration count is unbounded by design.** SB risk 1 says budget it like the hero. If
   it slips, P20 and P21 slip with it — there is no way to build the flatten's destination art
   or the endcard's contrast test without it.
4. **The portrait track's ~950vh is solved, not known.** Every phone-flick conclusion in MM §7.2
   and §15.2 step 11 rests on a number P5 produces.
