# THE BUILD CALL SHEET — BINDING

2026-09-03 · **This document is binding.** It supersedes `docs/build/direction/CALLSHEET-DRAFT.md`
in full; the draft is kept only as provenance.

**Thirty-six prompts · six acts plus one parallel lane · twenty human checkpoints.**

Each prompt is written to be handed to one engineer **with no other context**: what it builds,
which doc sections and code files it reads, what it delivers, the named checks and measured
numbers that prove it done, what it may not touch, and the walkable state it leaves the film in.

**This document plans a build. It does not authorise one.** No prompt runs until its plan is
approved.

---

## 0. STANDING ORDERS

Every prompt in this sheet inherits everything in this section. A prompt does not restate it.

### 0.1 The doc set, and how a reference is read

**Binding, all four, read the sections each prompt names:**
`docs/2026-09-03-world-direction.md` (**WD**) · `docs/2026-09-03-scene-book.md` (**SB**) ·
`docs/2026-09-03-goblin-design.md` (**GD**) · `docs/2026-09-03-motion-microinteractions.md` (**MM**).

**`docs/build/direction/ERRATA.md` is read alongside all four, every time.** It carries thirty
rulings that supersede text still sitting in the docs, plus the complete does-not-exist list.

**Inherited and authoritative:** `docs/story.md`, `docs/copy-spec.md` (both LOCKED, verbatim),
`docs/2026-09-02-experience-design.md`, `docs/2026-09-02-motion-system.md`,
`docs/2026-09-02-hero-design.md`.

**Not binding — superseded v1 art thinking, do not build from them:** `art-direction.md`,
`color-script.md`, `puppet-spec.md`, `skeleton-spec.md`, `pencil-detail-plan.md`.

**`story/story-v1` is read-only reference. Never edited.**

**RULING — the by-NAME rule extends to `timeline.ts` and `curtain.ts`, and ERRATA 29's "±2"
claim is struck.** ERRATA 29 states that `timeline.ts`, `curtain.ts`, `trilayer.ts`, `rigs.ts`,
`styles.css` and `App.tsx` references are accurate to ±2. Measured on the live files this
morning, that is false from roughly `timeline.ts:900` and `curtain.ts:440` onward:

| Doc says | Actually at | What it is |
|---|---|---|
| `timeline.ts:915` | **`:925`** | `stagger: 0.05`, the flatten cascade |
| `timeline.ts:937` / `:962` | **`:947` / `:972`** | the two `die2` relative tweens |
| `curtain.ts:443` / `:457` | **`:453` / `:458`** | the mask `scene.overrideMaterial` swap pair |
| `curtain.ts:467` / `:472` | *(the second pair; the draft cited only one)* | the normal/depth swap pair |

Every reference in this sheet is therefore **found by NAME** — the symbol, or the shipped comment
text at the site. Line numbers appear only as provenance, never as an address. A prompt that
cannot find its site by name says so and stops; it does not edit the line the doc printed.

There is one live drift the by-name rule catches that a grep does not: the seventh relative tween
is written `` { y: `+=${Math.PI}` } `` at the disc, a **template literal**, which the obvious
`'+=` grep misses. Any check that bans relative tweens bans the backtick form too.

### 0.2 The hard gates — art and transfer

- **No hatching anywhere.** Paper `#F7F5F0`, ink `#222222`, amber `#F2C35E` the only glow hue,
  `#B6D648` only the wordmark die pip.
- **The film applies NO tone mapping.** Every art judgement is made flat at `NoToneMapping`.
- **Rejected on sight** (WD §16): smooth Lambert masses · ruled analytic stripes · default
  primitives · gradient washes. Palette by token only — a new colour is a `palette.ts` change,
  never a paint call.
- **Runtime `t = 66` and the gearing map (`gearing.ts:44–54`) are FIXED.** Every prompt restages
  art; none restages time.
- **Copy is verbatim** from `copy-spec.md`. No spinner anywhere on this site, including the
  fallback. Reduced motion and keyboard are first-class, never a branch bolted on afterwards.
- **`InstancedMesh` is banned and the count across `src/` stays zero.** The trilayer's vertex
  injection computes `vTriWorld` from `modelMatrix` and never reads `instanceMatrix`, so every
  instance would sample stroke tiles, grid, seam and depth ramp from one world position.
  *Instancing does not merely cost work; it breaks the material.* Merge geometry per class per
  island instead — one `BufferGeometry`, one draw.
- **Budgets:** ≤120 draws per stage at its authored cameras · ≤40 per-mesh materials film-wide
  (census currently 28 planned, 12 spare) · ≤33 shared trilayers · texture memory
  `(8 × 512² + 4 × 1024²) × 1.33 + 16 MiB = 47.9 MB` against a 48 MB ceiling, with the board's
  2048² **mip-free** (ERRATA 22).

### 0.3 The mechanism ruling — three carriers, not interchangeable

SB §0's ruling, which is what actually fixes the order:

| Mechanism | Scope | Consequence |
|---|---|---|
| `curtain.value` | global — the post pass **and** every `uTriCurtain` | one object; the S3 switchover that drops it is architectural and is built and walked before any S3 art |
| `material.userData.alive` | one mesh; a **paired `tl.set` step**, never a ramp | pairs are `c` / `c − PAIR_GAP`, so the token and the check extension precede every authored pair |
| `rig.seamX` | trilayer only; Prep is **east** of the line; meaningless while `curtain = 1` | the frontier can only *add* Prep, so S7's flatten cannot use it — `uTriFlat` must be a declared uniform before twelve groups carry it |

**`curtain`, `lightC` and `rig.seamX` must stay on three separate `{value}` objects.** The
20.53/20.55 pair is `0.019999999999999574` apart and clears `clocks.check` only because the check
groups by target. Move any two onto one state object and the check goes from passing to failing
with no code change.

### 0.4 The three standing tables — the discipline that replaces global scans

A check that scans the whole film for a banned form turns red the day it lands and stays red
until the last prompt that removes an instance. That is not a gate; it is noise everyone learns
to ignore. **Every film-wide assertion in this sheet is table-driven instead.**

Three tables, each a plain exported `const` array living inside the check script that owns it:

**1. The MARK TABLE** (`walk.check.ts`) — the paired sets, page turns, curtain windows and
timeScale ramps A2/A3/A4/A6/A7 assert against. Ships empty of the marks that do not exist yet.
**Every prompt registers its own marks as part of its deliverable. A prompt that authors a paired
set without registering it is not done.**

**2. The OPEN-ROW ALLOWLIST** (`motion.check.ts` for A5, `walk.check.ts` for A4) — every shipped
violation that a *named later prompt* removes. A row is `{ site, closedBy }`, `site` matched by
**symbol or shipped comment text, never line number**. The check fails on any violation **not**
in the table, and **also fails on any table row whose site no longer exists** — so a closed row
cannot rot in the file and a prompt cannot forget to delete it. Closing the row is part of the
closing prompt's deliverable.

The allowlist ships with exactly these rows and no others:

| Check | Row (by name) | Closed by |
|---|---|---|
| A4 | `drain(12.5, 1, 0.6)` — holds a partial curtain over `[12.5, 13.1]` against the authored `[12.5, 12.85]` | **P21** (S2 converts it to the named `tick()` recipe) |
| A4 | `drain(25.4, 0.25, T_DRAIN_MAX)` — holds `[25.4, 26.8]`, inside **no** authored window | **P9** (the S3 state schedule supersedes it; P9 deletes the call) |
| A4 | `drain(40.6, 1, T_DRAIN_MIN)` — holds `[40.6, 41.1]` against `[40.6, 40.95]` | **P29** (S5's t40.6 tick) |
| A5 | the seven relative tweens: both ear flaps, the disc's `` `+=${Math.PI}` ``, the rope's `+=0.15`, the tavern sign's `-=0.95`, both `die2` sites | **P6** |
| A5 | `stagger: 0.05` on the flatten cascade | **P32** |

**3. The BEAT / CAMERA TABLE** (`figure.check.ts`, `draws.check`) — the beats whose projected
figure height is asserted, and the stage cameras whose draw count is asserted. **Ships empty.
Each prompt registers its own beats and cameras.** `figure.check` needs only `{ id, t, flag }`;
it samples the camera vector from the built timeline exactly as A1 does, so a beat cannot drift
from its own camera. `S7-B6`'s exemption is a registered row, not a special case in code.

### 0.5 The measurement split — what a check may assume

`pnpm check` is thirteen plain `node --experimental-strip-types` scripts. **No new dependency, no
Playwright, ever.** Two of this sheet's measurements cannot run there and pretending otherwise is
how the ≤120 ceiling becomes unenforceable:

- **Every bake calls `document.createElement('canvas')`** — `trilayer.ts:98` (`bakeStrokeTiles`),
  `hero.ts:314` (`bakeIslandAlbedo`), `:552` (`bakeFoliage`), `:591` (`bakeBark`), `:815`
  (`buildGlowSprite`). There is no DOM under Node.
- **`renderer.info.render.calls` requires a real `WebGLRenderer` render.**

So every measurement in this sheet is one of two classes, and each prompt says which:

| Class | Runner | Precedent it copies |
|---|---|---|
| **CLASS G** | plain Node in `pnpm check` | the thirteen shipped scripts; `island.check.ts:53` reaches the shader by passing `null` as the renderer into `onBeforeCompile` |
| **CLASS B** | a browser handle on a sandbox route, called by name inside a ★ walk | `window.__gob(w, h)` in `src/gobMeasure.ts`, `window.__film` in `Film.tsx:148`, and the readback recipe at `IslandSandbox.tsx:190–195` / `posterBake.ts:50–62` |

`figure.check` is genuinely CLASS G — it is projection math, exactly as `hero.check.ts` proves.
`draws` and `bake` are split: a CLASS G half asserts what is computable from source (the material
census, the one-program assertion, the byte census computed from the bake slot table, the board's
`generateMipmaps: false`), and a CLASS B half takes the number. **P1 builds the CLASS B runner
before any budget depends on it.**

`pnpm check` ends this build at **seventeen** scripts: the thirteen shipped (`framing`, `pencil`,
`die`, `puppet`, `curtain`, `island`, `motion`, `clocks`, `gearing`, `rigs`, `hero`, `hero-life`,
`gob`) plus `figure`, `draws`, `bake` and `walk`.

### 0.6 File ownership, and the goblin workflow running right now

A separate workflow is rewriting `world.ts buildGoblin`, `hero.ts stageGoblin`, `actions.ts`,
`palette.ts`, and adding `scripts/gob.check.ts`, `src/gobMeasure.ts`, `src/film/gobParts.ts`.
Those are the same files P13 and every Act 3 stage prompt touch.

**Ownership is frozen until P0 closes.** Until then, that workflow owns `buildGoblin`,
`stageGoblin`, the `actions.ts` verb bodies and the goblin rows of `palette.ts` outright. No
prompt in this sheet edits them. After P0 closes, they return to this sheet and P13 may add verbs.

### 0.7 What no prompt may touch

`RUNTIME = 66` · `gearing.ts:44–54` · any authored mark position (re-timing is a hard gate) ·
`cap()`'s signature · any caption's `at`/`hold`/`fade` · `T_BLOOM_CTA` in `styles.css` (the CSS
lane is exactly `{T_FLICK, T_UI, T_UI_MAX}`) · a fourth light hue (exactly `keyWarm` and `amber`
exist) · a second post pass · scene fog · any infinite ground plane · a fifth eraser ghost, a
twelfth caption, an eighth transition, a third clock, a seventh S6 vignette · per-frame allocation
· any integrator, spring or velocity drag in the scrub domain (L5).

### 0.8 How a prompt proves itself done

All six, every time. A prompt with five of six is not done.

1. **`pnpm check` green** — every script, including the ones the prompt extended.
2. **Its own named gates green**, with the measured numbers written into the prompt's record.
   A threshold quoted without a number beside it is not a gate.
3. **Its rows registered** in the mark table, the beat/camera table, `surfaces.ts` and
   `docs/build/TEXTURES.md`; and **its allowlist rows deleted** if it is the closing owner.
4. **A full forward and backward walk with zero console errors**, on the dev grid and — for any
   prompt with a ★ — on a real phone.
5. **The film still walks end to end.** A half-built stage is not committed.
6. **A written record**: what was looked at, at which mark, at which width, and what the number
   was. *Saying "verify it feels right" without naming the frame is how a gate becomes a
   formality.*

### 0.9 Sequencing risk, stated honestly

- **P19 (`bakeBoardMap`) is the only unbounded prompt in the sheet.** It is deliberately started
  early and run in parallel so its iterations do not sit on the tail. If it still slips, P32 and
  P33 slip with it and there is no workaround — the flatten's destination art and the endcard's
  contrast test both need the finished bake.
- **P3's verdict is load-bearing and unknowable until it runs.** The order survives either
  outcome; the *content* of P26 and P29 does not.
- **P22's Pass A number decides whether the degradation ladder re-orders**, and the number that
  actually governs is the one taken on the ribbon in P24, not the one taken on S1/S2 in P22.
- **P0 is outside this sheet's control.** It closes when the goblin workflow lands. Act 1 and
  Act 2 run without it; Act 3 cannot start without it, because a night stage judged on a v1-
  surfaced goblin is not judgeable.
- **Act 3's stages are the schedule.** Eight prompts, 4–5 days each, and each one's ★ can send it
  back. Everything before Act 3 exists to make sure a stage is built once.

---

## 1. THE DEPENDENCY GRAPH

### 1.1 The lanes

Five things run at once. Everything else is a straight line.

| Lane | Prompts | Runs |
|---|---|---|
| **Precondition** | P0 | outside this sheet; must close before P20 |
| **De-risk** | P1, P2, P3 | in parallel with each other and with P4–P6 |
| **Spine → page → world** | P4 → P35 | the main line |
| **Board** | P18, P19 | starts the moment P11 lands; runs in parallel through Acts 2 and 3; reconciled after P30 |
| **Pass A measurement** | P22, and again inside P24 | half a day each, on the built art |

### 1.2 The edges, each with its reason

**These are the edges that genuinely fix the order. Anything not listed may be reordered.**

| Edge | Reason |
|---|---|
| **P0 → P20 (and all of Act 3)** | GD §13 leaves steps 1–5 and 8 unchecked — palette/ears/hatch, the trilayer conversion, the silhouette rebuild, the face, the grounding, the `gobBirth` entrance. Only 6 and 7 are DONE. WD §9 and SB §6 both call the surface rebuild *"the film's largest single polish job"*. **S1's night is judged on the lit goblin.** A night stage judged on a v1-surfaced goblin is not judgeable, and re-judging it later costs the stage. |
| **P0 → P13** | `actions.ts` is frozen to the goblin workflow until P0 closes (§0.6). P13 adds four verbs to that file. |
| **P1 → P7** | P7's honesty gate is a frame comparison, and there is no frame-diff harness anywhere in the plan. P1 builds `window.__frames()` and captures the reference set **before** P7 changes the rig. |
| **P1 → P11** | The ≤120 draw ceiling and the ≤12 ms/bake budget are CLASS B numbers (§0.5). If the readback pattern does not hold, the single rule governing the ribbon, the tavern and the flatten is unenforceable — and you find that out at P24 instead of at P1. |
| **P2 → P11, P2 → P12** | Both shader changes modify the one program every surface in the film shares. A `customProgramCacheKey` mistake splits `surfaces.ts`'s 33 materials into 33 programs and the draw ceiling is gone; a wrong `uTriFeather` read inks a hard ring at every card's geometric circle. Both failures otherwise surface at P12 and P32 — up to twenty prompts after the change. |
| **P3 → P21, P26, P29** | SB §7's prototype gate. If two of the three demotable reads fail at 390, **the answer is re-siting, not demotion** — the arcs move outboard along the apron bed, the rings move to the die's own near edge. Both are staging changes to sets that do not exist yet. *(The draft's "P0 → everything" edge over-blocked: nothing in the spine or the page consumes this verdict.)* |
| **P4 → P5** | A1's state vector is sampled by name; the tokens it samples against (`PAIR_GAP` above all) must exist. |
| **P5 → P6** | **This is the reordering that matters most.** P6 rewrites seven relative tweens to absolute end values. A wrong base silently changes the ear flap, the disc's end rotation, the rope's rest height, the sign's drop and the endcard die — and **`pnpm check`, a grep and a Cover walk all pass on a changed end value.** A1 is the only thing that catches it, and it needs nothing from P6 to run. |
| **P5 → every stage prompt** | A1 is the only automated guard on drifted `tl.set` pairs, callbacks, integrators, boolean flips, relative tweens and the t38 set-then-tween. Authoring 48 beats without it means finding the drift by hand on a backward flick. |
| **P4 → P9** | ERRATA 1: the S3 retire-pair as the scene book wrote it (`30.32 / 30.34`) evaluates to `0.019999999999999574` — **below** `clocks.check.ts:70`'s 0.02 floor. Authored as `c − PAIR_GAP` it is `0.02499999999999858` for every mark in the film. Without the token and the A11 extension the switchover fails the build on its first commit. |
| **P7 → P8** | The practicals array, `lightC` and `uTriFlat` all hang off a rig that is wired into the film. Today `createRigs()` is called only by `hero.ts:1637` and the sandbox; `Film.tsx` still runs its v1 rig. |
| **P7 → all of Act 3** | Shadows. Three `renderer.render` calls per frame means three shadow renders unless `shadowMap.autoUpdate = false` (MM §14.2). The moment shadows go on, the cost triples for everything already built. |
| **P8 → P9** | MM §15.2 step 9 demands **no change at all in the rendered frame** across 20.505 / 20.53 / 20.55 — *including the lighting scalars*. That needs `lightC` as a second `{value}` object (D-2) and the practicals' `max(1 − lightC, alive)` factor (D-1). |
| **P8 → P32** | `uTriFlat` must be a declared uniform with a shader branch before twelve merged groups each carry one, and the practicals' third factor `(1 − p.flat.value)` already references the object (D-15). |
| **P9 → P24, P9 → P25** | SB §9 risk 2: *"Build this beat first, after the phone prototypes, and walk it in both directions before anything else in S3 is polished."* Everything after t20.55 depends on the flip being invisible, and it has never been walked. |
| **P10 → every stage prompt** | SB §7 makes a second authored camera target mandatory on every `A`-flagged beat (~30 of 48), and `figure.check` asserts the floor **against the `{portrait: true}` build**. Retrofitting after 48 landscape cameras re-touches every beat (MM §8.6). |
| **P11 → P12, and → every stage prompt** | G1's ceiling is 33 shared trilayers and ≤40 per-mesh materials film-wide. A stage that instantiates ad-hoc materials before the registry exists is rebuilt to fit the census. |
| **P11 → P18** | The board's 2048² is the film's only texture above 1024² and ships mip-free to hold the 48 MB ceiling. The ceiling has to be enforceable before the bake that tests it is authored. |
| **P12 → P20** | S1's two islands are the first instances of the set-scale card. Judge one rim before eleven more exist. |
| **P12 → P24** | S3-B1's void crossing **is** the travel line: the line unspooling ~1.5 units ahead of his feet is the whole beat. |
| **P14 → P21** | Transition 2 (the tick) is three lines on one cue and the third is *"margin breathes to full over `T_BEAT`"* at t12.6. S2's tick is the film's first, and there is no margin element in `App.tsx` today. |
| **P14 → P15** | P15's tab-order target is SR skip → play → skip note → CTA. `#film-skip` does not exist until P14 builds it. |
| **P15 → P35** | MM §15.2 step 15: `#overlay` renders above `#play` in the tree today, so the required tab order is impossible. The keyboard walk cannot pass until P15 moves it. |
| **P17 → P25** | SB §7: S3-B3 is *"the thesis image… QA the graphite→ink flush at 390 exactly."* The flush colours authored `<path>` strokes; a `<div>` text node has none. |
| **P17 → P26** | SB §9 risk 9: `set1`'s ink⇄graphite flush is the only caption that flushes off a whole-frame tick, and *"the wiring is cheap now and ugly retrofitted."* |
| **P20 → P21, P20 → P31** | SB §6: the cliff island is **one asset, two eras of dressing** (S1/S2 remains, S7 tended), baked once for the day family. Building it twice breaks the azimuth discipline that lets one bake serve both. |
| **P22 → P23/P24** | D-12: the normal/depth prepass runs every frame of the entire film and is *"the single largest lever on this page"*. If it exceeds 3.0 ms the ladder re-orders, which changes what the ribbon may spend. |
| **P24 → P26, P27, P30, P32** | SB §9 risk 3: the ribbon island **sets the ≤120-draw ceiling**, and no stage may raise the total above its measured figure without a recorded decision. |
| **P13 → P29, P13 → P30** | `hop` is the only way onto the S5 bench; `hang`, `plantAndPat` and `touchUp` are three of S6's six vignettes. |
| **P19 → P32** | G4 / SB §5.1: *"the flatten's destination art is UV slices of this same atlas"* — one bake, two consumers, **so they cannot drift.** |
| **P19 → P33** | The same atlas is the board the film ends on. |
| **P33 → P34** | SB §9 risk 15: the halo system and `BOARD_WASH 0.5` were tuned against an empty grid and must be verified against the **final** bake; and the Picture Book's eighth frame is the endcard at rest. |
| **P20…P33 → P34** | The Picture Book is eight painted frames, one per stage. Every one needs its stage finished. |

### 1.3 Edges the draft asserted that are not real

- **The four remaining verbs do not gate S1–S4.** Only S5 and S6 use them.
- **The Hand does not gate S1's or S2's art** — `cap()` no-ops on a missing id and keeps its
  signature. It gates S3-B3's and S4-B4's flush QA only.
- **The board does not gate S1–S6.** Only S7's flatten targets and S8.
- **P3 does not gate the spine.** Its consumers are P21, P26 and P29 and nothing else.
- **P13 does not sit on the critical path.** Its only inputs are P6's absolute-end-value rule and
  P5's harness; it runs in Act 1, which shortens the tail by two days and shrinks the `actions.ts`
  conflict window with the goblin workflow.

### 1.4 The edge the draft was wrong about — and the correction

The draft wrote *"the goblin's rebuild does not gate the film body"* on the strength of GD §13
steps 6 and 7 being done. Steps **1, 2, 3, 4, 5 and 8 are all unchecked**, and they are the
surface: the palette, the trilayer conversion, the silhouette, the face, the grounding pool and
the entrance. **It gates Act 3.** See P0.

---

## 2. THE DE-RISK PROMPTS, AND WHY THEY RUN FIRST

Three prompts run before the spine commits to anything, plus one precondition that is not ours to
run. Each exists because the cost of learning its answer late is measured in whole prompts.

**P0 · the goblin handoff.** Not a build prompt — a contract and a gate. Act 3's first stage is
judged on a lit figure; if that figure is still v1-surfaced, the S1 night verdict is worthless and
S1 gets built twice.

**P1 · the measurement runner.** Every Act 3 acceptance gate is a number nobody can currently
take. The bakes need a DOM canvas and the draw counts need a real render; all thirteen shipped
checks are plain Node and no new dependency is permitted. Stand the CLASS B handles up on the
`window.__gob` precedent, prove them on a v1 stage in a day. **If the pattern does not hold, the
≤120 ceiling is unenforceable for the entire back half of the plan — and you learn that at P24.**
P1 also captures the reference frame set P7's honesty gate compares against, because there is no
other frame-diff harness in the plan and P7's *"renders identically"* is otherwise unmeasurable.

**P2 · the two shader spikes.** `uTriFlat` + `uTriFlatUv` (P8) and G5's feather-aware
normal/mask override (P12) both modify the one program every surface in the film shares —
verified live at `curtain.ts:453/458` and `:467/472`, the two `scene.overrideMaterial` swaps that
bypass the trilayer entirely, and at `trilayer.ts:482`, which reads `vTriWorld` from
`modelMatrix`. A `customProgramCacheKey` mistake splits 33 materials into 33 programs; a wrong
`uTriFeather` read inks a hard ring at every card's geometric circle. Both failures otherwise
surface at P12 and P32.

**P3 · the three flagship reads at 390 px.** SB §7's prototype gate, plus one addition the draft
missed: **two of the three marks have no authored camera at all** (S4-B5 is "B4's frame, held";
S5-B4 is "held from B3"), and a mark's legibility at 390 px is a pure function of shot distance
and ground value. A stand-in at a guessed distance can return either answer. P3 solves and records
the three camera vectors as its own deliverable and binds them into SB §3.

**And one more, which is the biggest bet in the sheet: P18.** The board vocabulary study cannot
run before the budgets exist, so it is not in Act 0 — but it starts the instant P11 lands and runs
in parallel from there. SB risk 1 calls `bakeBoardMap()` *"the film's whole bet"*, it is the only
asset with two consumers that cannot drift, and the draft priced it as unbounded and then put it
on the tail of the critical path. Splitting it into a 512² vocabulary study and a full bake gives
the bet an early verdict instead of a late one.

---

# 3. THE PROMPTS, IN ORDER

# ACT 0 — PRECONDITIONS AND DE-RISK

## P0 · The goblin handoff and the CLASS P gate ★

**Size:** not costed here — the work belongs to the in-flight goblin workflow. **This prompt is a
contract and a gate.**

**Runs:** now, in parallel with everything in Acts 0–2. **Must close before P20.**

**Read:** GD §13 (the whole checklist, including the "minimum viable subset" paragraph), GD §14
(CLASS G and CLASS P in full), GD §4.1–§4.4, GD §9, WD §9's hero tier item 1, SB §6's hero tier,
ERRATA 3, 4, 7, 14, 15.
**Code:** `src/film/world.ts buildGoblin` · `src/film/stages/hero.ts stageGoblin` ·
`src/film/actions.ts` · `src/film/palette.ts` (the goblin rows) · `scripts/gob.check.ts` ·
`src/gobMeasure.ts` (`window.__gob`) · `src/film/gobParts.ts`.

**Deliverable — three things, none of them film-body code.**

1. **A written statement of what the in-flight workflow closes and what it does not**, checked
   against GD §13 step by step. As of this sheet's date, **steps 6 and 7 are DONE** (ERRATA 14 and
   4: `EAR_Z_R`/`EAR_Z_L`, `REST`, `applyPose`, and `freeze`/`stow`/`draw`/`scribe`/`pocket`/
   `throwDie` shipped in `actions.ts`) and **steps 0, 1, 2, 3, 4, 5, 8 and 9 are open**:
   the measurement split · palette + ears + hatch · the trilayer conversion · the silhouette
   rebuild (cloak bands, hem flick, patch pocket, lathe mitts, extruded boots, the two px-solved
   shells) · the face (proud eyes, nose, pupils group, hood-slide brow) · the grounding (feathered
   pool, `neverAlive` carve-out, `aliveShadow` 0.45 → 0.62) · the `gobBirth` entrance and its
   per-part stagger · the gate run. `scripts/gob.check.ts` and `src/gobMeasure.ts` exist on disk,
   which means step 0 is in flight, not that it is signed off.
2. **The file-ownership freeze, written down.** `buildGoblin`, `stageGoblin`, the `actions.ts`
   verb bodies and the goblin rows of `palette.ts` belong to that workflow until this gate closes.
   **No prompt in this sheet touches them before then** — which is also why P13 (the four
   remaining verbs) is scheduled in Act 1 rather than Act 3, to shrink the conflict window.
3. **The CLASS P gate run, and it is the ★.** GD §14 CLASS P in full: `window.__gob(w, h)` at
   **390 / 500 / 768 / 1440**, plus the **6× zoom walk**, the **Prep-rig walk** and the
   **seam-birth walk**. `window.__gob` throws on its own thresholds, so each breakpoint is one
   call.

**Acceptance gates.** `pnpm check` green including `gob.check` (CLASS G). **CLASS P green at all
four widths and on all three walks**, with the failures list empty. GD's gate G9 holds:
`buildGoblin` greps clean for `hatch(`, `crossHatch(`, `blobs(`, `timberDark` and `paint(…fill:`.
**★ HUMAN:** the figure at 390 px on paper and on the blackout, and the same figure inside a Prep
freeze — the two states the film actually ships him in.

**Must NOT touch.** Nothing in the film body. No stage builder, no timeline mark, no rig.

**Walkable state.** The Cover is unchanged and still passes `docs/build/P5-REVIEW.md`'s record.
The film body still runs v1 art with a v2 goblin walking through it.

**If it slips.** GD §13's own fallback applies: **steps 1, 4 and 5 are roughly 80% of the
verdict** — value ownership, a face that exists at shipped sizes, a figure that touches the
ground — and they are independently walkable. **Gate that subset (G1, G2, G4, P1, P3, P5) and let
Act 3 start on it**, with steps 2, 3 and 8 landing during Act 3 as a surface-only change that
touches no stage code. Steps 1, 4 and 5 are the hard precondition; the rest are not.

---

## P1 · The measurement runner and the reference frames

**Size:** 1 day. **Runs in parallel with P2, P3, P4.**

**Read:** §0.5 above, GD §14's step 0 paragraph (the CLASS G / CLASS P split and its reasoning),
MM §14.1 (the per-pass budget), MM §14.2, WD G2's bake budgets, ERRATA 22.
**Code:** `src/gobMeasure.ts` (the `window.__gob` install and its throw-on-failure shape) ·
`src/IslandSandbox.tsx` (the `?sandbox=island` route pattern in `src/main.tsx:22–27`, and the
`setRenderTarget` → `render` → `readRenderTargetPixels` recipe at `:190–195`) ·
`src/posterBake.ts:50–62` (the offscreen `WebGLRenderTarget` + camera recipe) ·
`src/film/Film.tsx:148` (`window.__film = { world, tl, camera }`) · `src/App.tsx:211` (the DPR cap).

**Deliverable.** One dev-only module, installed on the same DCE-gated pattern as the island
sandbox, exposing three handles. **No new dependency. No Playwright. No route that ships.**

1. **`window.__draws(t)`** — seeks the built timeline to film-`t`, renders one frame through the
   real renderer, returns `renderer.info.render.calls` and `renderer.info.render.triangles`.
   Takes an optional width/height so a stage camera can be measured at 390 and at 1440.
2. **`window.__bakes()`** — runs every registered bake once with `performance.now()` around each,
   returns `{ name, ms, bytes }[]` plus the total. The registration list is the bake slot table
   P11 builds; until then it reads the five shipped bakes by name (`bakeStrokeTiles`,
   `bakeIslandAlbedo`, `bakeFoliage`, `bakeBark`, `buildGlowSprite`).
3. **`window.__frames(marks)`** — bakes a PNG per mark through the real renderer at a fixed size,
   on `posterBake.ts`'s recipe. **Immediately capture and commit the reference set at
   `t = 5.2, 12.6, 19.0, 33.5, 41.5, 56.5, 61.0, 65.0`** into `docs/build/walks/reference/`.
   **This set is what P7's honesty gate compares against, and it must be captured before P7
   changes the rig.**

Plus: **prove the pattern on a v1 stage today.** Record `__draws()` at S1's and S5's current
cameras and `__bakes()`'s five numbers into `docs/build/FINDINGS.md`. If the readback does not
work headlessly-enough to be a gate, **say so here and stop**, because every draw and bake
threshold in this sheet then needs a different mechanism and P11 must be re-planned.

**Acceptance gates.** `pnpm check` unchanged and green — this prompt adds nothing to it. The three
handles return numbers on the dev server at 5180. The eight reference frames exist on disk. The v1
baselines are recorded. **DCE proof:** the module is absent from a production build
(`grep -c __draws dist/assets/*.js` returns 0).

**Must NOT touch.** `timeline.ts`. Any stage builder. Any shipped Cover file. The production
bundle.

**Walkable state.** Identical to today. Nothing on screen changed.

---

## P2 · The two shader spikes, on the shipped hero island

**Size:** 1–2 days. **Runs in parallel with P1, P3, P4.**

**Read:** WD G5 (both the shader fix and the art-side belt), WD G7, MM §10.3, MM §10.7's flatten
paragraph, SB §3-S7's mechanism section, ERRATA 5 (why the seam cannot carry the flatten).
**Code:** `src/film/stages/trilayer.ts` (`createTrilayer`, `TrilayerOpts`, the `rig` uniform
block, the `triSeamF` / `triC = max(uTriCurtain, triSeamF) * (1 - uTriAlive)` lines, `triDabN`,
`uTriFeather`, and the `vTriWorld`-from-`modelMatrix` injection) · `src/film/curtain.ts` (the two
`scene.overrideMaterial` swap pairs — the mask swap and the normal/depth swap, **found by the
shipped comments at those sites, not by line number**) · `src/IslandSandbox.tsx` ·
`scripts/island.check.ts:53` (how the shader is reached with a `null` renderer).

**Deliverable — a spike, in the sandbox, on the hero island. Not wired into the film.**

1. **`uTriFlat` (0…1) and `uTriFlatUv` (vec4 rect)** declared as per-material uniforms with the
   shader branch, defaulting to 0, with **`triDabN` applied to the flat mix** so the frontier look
   is authored into the ramp rather than added later. **The single question this spike answers:
   does the program count stay at one?** Prove `customProgramCacheKey` is unaffected by the new
   uniforms across every `TrilayerOpts` permutation the film uses.
2. **G5, the feather-aware prepass override.** Both `scene.overrideMaterial` swaps bypass the
   trilayer entirely, so a feathered card's alpha discard never runs in the prepass and the
   contour pass inks a hard ring at every card's geometric circle — *the exact opposite of "an
   edge that simply stops being drawn."* The fix is a `MeshNormalMaterial` clone carrying the same
   three lines the trilayer already runs, reading `uTriFeather` and the local position from
   `mesh.userData`. Roughly ten lines. **Do the same for the mask override — it is the same
   defect twice.**

**Acceptance gates.** **CLASS G:** an `island.check` extension asserting one program across all
`TrilayerOpts` permutations, with the count printed. **CLASS B:** `window.__draws()` on the hero
island before and after — the number does not move. **Visual, in the sandbox at 390 / 768 /
1440:** a feathered card's rim shows **no hard ring at its geometric circle** in the contour pass,
and `uTriFlat = 1` on one prop reads as a flat dabbed slice, not a smooth wash.

**Must NOT touch.** `Film.tsx`. `timeline.ts`. The v1 rig. Any stage art. The uniforms are
declared and proven here; **P8 wires them, P12 lands G5 for real.**

**Walkable state.** Unchanged. The spike lives behind the sandbox route.

---

## P3 · The three flagship reads at 390 px, and the three camera vectors ★

**Size:** 2 days. **Runs in parallel with P1, P2, P4.** Gates **P21, P26 and P29** only.

**Read:** SB §7 (whole, especially the closing *"Prototype gate, before any other build work"*),
SB §1's flagship table, SB §6's *Flagship + evidence assets*, SB §3-S2-B3 / §3-S4-B4 and B5 /
§3-S5-B3 and B4, WD §6's phone-width contract, WD §5's palette permission table, ERRATA 12.
**Code:** `src/IslandSandbox.tsx` and `src/main.tsx:22–27` (the sandbox route precedent) ·
`src/film/pencil.ts` (`polyline`, `curveLine`, `score`, `numeral`) · `src/film/palette.ts`
(`graphite`, `graphiteLight`, `graphiteDark`, `plank`) · `src/film/framing.ts` ·
`src/film/stages/trilayer.ts` (the `rig` uniform block).

**Deliverable.**

**First, and this is a deliverable, not a preliminary: solve and record the three camera
vectors.** Two of the three marks have no authored camera in SB §3 at all — S4-B5 is *"B4's
frame, held"* (elevation ≈21°, no position) and S5-B4 is *"held from B3"*, whose dolly ends at
*"table-level medium, ≈24°"* with no position. **A mark's legibility at 390 px is a pure function
of shot distance and ground value**, so a stand-in at a guessed distance can return either
answer and the verdict would be worthless. Solve position + look for all three, record them, and
**bind them into SB §3 as the authored cameras P26 and P29 must build to.**

**Second:** a sandbox route (`?sandbox=marks`) staging the three demotable mark sets at their own
solved cameras, at **390×844, 768×917 and 1440×900**:

1. **The erased-contour pair** (S2-B3) — a committed `graphiteDark` line plus a rubbed
   `graphiteLight` ghost with a legible smear direction, beside his head at the S2 address's
   world scale.
2. **The scribed-arc set** (S4-B5) — 3–4 arcs plus one overshoot on the apron bed **outboard of
   the kerb**, at the flicker's held-frame camera.
3. **The mug-ring set** (S5-B4) — `pencil.ts` ellipse strokes in the graphite ramp on `plank`, in
   the frozen frame's near plane at reading scale.

**The stand-in surfaces carry the class albedo the real ones will** — graphite apron bed, `plank`,
cliff rock — so the value contrast under each mark is honest. A mark judged against bare paper is
not judged.

**Third:** the written verdict, one line per mark per breakpoint: **reads · demotes to texture ·
must re-site.**

**Acceptance gates.**
- Each mark renders at all three widths with a screenshot recorded in
  `docs/build/walks/marks/`.
- The three camera vectors are recorded and patched into SB §3.
- **If two of the three fail: demotion is not the answer.** Record the re-siting decision (arcs
  further outboard along the apron bed; rings onto the die's own near edge) as **binding staging
  for P26 and P29.**
- SB risk 6: **QA at 768 as well.** An erasure that reads at 1440 and demotes at 390 still thins
  the argument for half of real traffic if it fails at 768.
- No hatching in any mark. `pencil.ts` primitives only — **marks are not type** (WD §4).
- **★ HUMAN.** This verdict is recorded before P21, P26 or P29 run.

**Must NOT touch.** `timeline.ts`. `world.ts`'s stage builders. Any shipped Cover file
(`Hero.tsx`, `hero.ts`, `heroLife.ts`, `hero.css`, `HeroWordmark.tsx`). No timeline marks, no
gearing, no palette additions.

**Walkable state.** Unchanged; the marks live behind a sandbox route.

---

# ACT 1 — THE SPINE

The film runs on v1 art throughout this act. **Nothing on screen regresses**, and P7 is the one
prompt where that claim is measured rather than asserted.

## P4 · Motion tokens and grammar hygiene

**Size:** 1–2 days.

**Read:** MM §2 (whole — §2.1's status corrections, §2.2's ten tokens, §2.3's ease lanes and the
three bans, §2.4's ten micro-constants), MM §15.1 A5 and A11, MM D-4, D-13, MM L7 and L9,
ERRATA 1 and 28.
**Code:** `src/film/motion.ts` · `src/film/stages/heroLife.ts` (the two `0.25`/`0.4` literals in
the UI settle, and the `× Math.min(1, dt * 6)` damped lerp — **by the shipped comments at those
sites**) · `scripts/clocks.check.ts` (the `≥0.02` same-target floor and its grouping) ·
`scripts/motion.check.ts` (the `wiredAt` registry and the existing grep bank).

**Deliverable.**

1. **Ten new tokens** in `motion.ts` with WIRED/CSS/FORWARD status: `PAIR_GAP 0.025`,
   `T_NUMERAL 0.3`, `T_FLUSH 0.2`, `T_REST 0.22`, `T_STEP 0.45`, `T_SKIP 1.2`, `T_REPLAY 1.6`,
   `T_CURSOR_HIDE 2.5`, `BOARD_BREATH {amp: 0.005, periodS: 12}`,
   `FLATTEN {x0: 128, xSpan: 42, spread: 0.9, dur: 1.1}`. Plus **`SEAM_PARK`** (= `1e6`), which
   MM §2.2's own code sample already uses and which does not exist in `src`.
2. **Ten micro-constants** (MM §2.4): `TRACK_TAU 0.13`, `PAR_DUR 0.55`, `SCRITCH_TAU 0.16`,
   `PERK`, `BLINK`, `SCRITCH`, `DEPTH_SHOT`, `DEPTH_TIGHT`, `WRITE_STAGGER 3`, `WHISPER 0.04`.
3. **The pair-authoring rule**, in code and in a comment at every paired site: `c` and
   `c − PAIR_GAP`, **never two decimal literals.** ERRATA 1 is the reason and it is worth
   restating at the call site: `30.34 − 30.32` evaluates to `0.019999999999999574` and **fails**
   the floor; `c − (c − 0.025)` evaluates to `0.02499999999999858` and passes for every mark in
   the film.
4. **D-4:** `heroLife.ts`'s `0.25`/`0.4` UI-settle literals rewire to `T_UI_MAX`/`T_BEAT` and
   enter `wiredAt`.
5. **The frame-rate fix:** `heroLife.ts`'s `× Math.min(1, dt * 6)` becomes
   `k = 1 − exp(−dt / SCRITCH_TAU)`. After this **all three damped lerps on the site are
   frame-rate independent.**
6. **`clocks.check.ts` extended (A11)** to recognise the `<expr> - PAIR_GAP` form, evaluate it in
   floating point, and apply the same ≥0.02 floor. **Not a second checker** — one extension to
   the shipped one.
7. **`motion.check.ts` extended (A5), table-driven per §0.4:** bans `stagger:`,
   `onComplete`/`onStart`/`onRepeat`, `tl.call(`, `camera.rotation.z`, every relative form
   **including the backtick one** (`'+=`, `'-=`, `` `+= ``, `` `-= ``, and
   `` `+=${ ``), and asserts every `repeat:` paired with `yoyo: true` is odd. **It ships with the
   open-row allowlist of §0.4 populated and no other rows**, and fails both on an unlisted
   violation and on a listed row whose site has disappeared.

**Acceptance gates.** `pnpm check` green — **including A5, on the day it lands**, because the
seven relative tweens and the one `stagger:` are allowlisted rows owned by P6 and P32 rather than
un-flagged failures. A11 passes on every existing pair. `motion.check`'s `wiredAt` covers every
new token. **The Cover is re-walked:** `SCRITCH_TAU` and `PAR_DUR` touch shipped, verified Cover
behaviour, and the scritch must still feel like the 60 Hz original —
`1 − exp(−(1/60)/0.16) ≈ 0.099` against the shipped `0.1`, and that arithmetic is written into
the record.

**Must NOT touch.** No conversions — **P6 owns those, behind A1.** `RUNTIME = 66`.
`gearing.ts:44–54`. Any authored mark position. Any art. `T_BLOOM_CTA` never enters `styles.css`.

**Walkable state.** Identical to today. Tokens exist; nothing consumes the new ones yet.

---

## P5 · The reversal harness and the check suite

**Size:** 2 days. **MM: *"worth more than the rest combined."* It lands before anything rewrites a tween.**

**Read:** MM §15.1 (whole, A1–A13), MM L5/L6/L7/L8, ERRATA Part 3 items 1 and 5–9, §0.4 above.
**Code:** `scripts/clocks.check.ts` (the extension pattern) · `src/film/timeline.ts`
(`buildTimeline`'s signature, `disposeTimeline`, the `onlyFor` helper, and the sanctioned
set-then-tween on `dieInner.rotation` — **all by name**) · `src/film/world.ts` (`buildWorld`) ·
`package.json`'s `check` script.

**Deliverable.**

1. **`scripts/walk.check.ts` — A1, the reversal identity.** Headless Node + three, no WebGL, no
   DOM. Build world and timeline; sweep `tl.time()` forward 0…66 in 0.01 t steps recording a state
   vector at 200 sample marks; sweep backward through the same marks; assert
   `max |forward − backward| < 1e-6` per component. **The failure output names the component and
   the sample mark**, never just a boolean.

   **The state vector at P5 — every component of which exists today:** `camera.position` ·
   `world.look` · `goblin.root.position` and `.rotation` · `curtain.value` · `rig.seamX` ·
   `rig.depthNear` / `depthFar` / `aliveShadow` · every material's `userData.alive.value` ·
   every `maskShell.scale` · **every `onlyFor` target's `.visible`** · `world.timeScale`.
   *This is the point of moving A1 earlier: it needs nothing from P6, P7 or P8 to catch the
   thing P6 can silently break.*

   **The vector extends at P8** (`lightC.value`, every group's `uTriFlat.value`, every practical's
   `intensity`) **and at P33** (`board.scale`), each as that prompt's own deliverable.
2. **A2** — the paired clusters: the `tl.set` sites exist at both `c` and `c − PAIR_GAP` on root
   position, root rotation and speed, and the pose returns after a `+0.5` / `−0.5` round trip.
3. **A3** — the page turns: `#blackout` opacity is 0 across `mark ± 0.1` (**paper, never black**)
   and a camera `cut()` pair exists at the mark.
4. **A4** — no held partial curtain outside the authored windows
   `[12.5, 12.85] ∪ [33.1, 33.45] ∪ [34.3, 34.42] ∪ [40.6, 40.95] ∪ [47.0, 47.12]`,
   **table-driven with the three `drain()` open rows of §0.4 and their named owners.** This is
   what retires `T_DRAIN_MIN` / `T_DRAIN_MAX`: a *new* `glidingDrain` call fails here first.
5. **A6** — `rig.seamX.value === SEAM_PARK` for every `t` outside `[20.53, 30.34]`; inside,
   monotonic non-decreasing except at the two authored sets.
6. **A7** — `world.timeScale ∈ {0, 1}` at every sample except inside the named ramps.
7. **The three standing tables of §0.4**, shipped with their initial rows, plus the self-cleaning
   clause: **a table row whose site no longer exists is a failure.**
8. **Wire everything into `pnpm check`.**

**Acceptance gates.** A1 green on the current build (the `{}` run only — the `prm` and `portrait`
runs land with P10, which extends it to three). Every assertion runs inside `pnpm check` in a few
seconds. The whole suite is fifteen scripts after this prompt.

**Must NOT touch.** No GLSL compiled in Node. **No new dependency, no Playwright** — the pattern
is plain `node --experimental-strip-types`, as all thirteen shipped checks are. No CLASS B
measurement here; that is P1's.

**Walkable state.** Identical to today, now with a harness that can prove it.

---

## P6 · The relative→absolute conversions

**Size:** 1 day. **Small, mechanical, and dangerous — which is exactly why it runs behind A1.**

**Read:** MM §2.3, MM §13.2, MM D-19, MM §15.1 A5, §0.4's allowlist.
**Code:** `src/film/timeline.ts` — the seven relative sites, **found by name**: the two ear-flap
tweens at the S1 perk · the stage disc's `` { y: `+=${Math.PI}` } `` · the rope's
`{ y: '+=0.15', repeat: 12, yoyo: true }` · the tavern sign's `{ y: '-=0.95' }` · the two `die2`
tweens (`{ x: '+=12', y: '+=8' }` and `{ y: '-=0.15' }`).

**Deliverable.**

1. **All seven convert to absolute end values.** MM §13.2 is the reason and it is not theoretical:
   GSAP resolves `'+='` at a tween's **first render**, so a PRM or portrait rebuild at t=33
   re-bases the disc from its current ~2.0 rad and the seek renders `2.0 + π`. Until these
   convert, the disc, the tavern sign and the endcard die **visibly jump on a preference flip**.
2. **The rope's `repeat: 12` becomes `repeat: 11`** (D-19). Thirteen legs rests the rope 0.15
   above its authored base.
3. **The disc's backtick form is the one a naive grep misses** — note it in the commit so nobody
   re-introduces it thinking the grep would catch it.
4. **Delete the seven A5 allowlist rows** and the `repeat` row, per §0.4. The check then fails if
   any come back.

**Acceptance gates.** **A1 green — and this is the whole point of the ordering.** A wrong base
silently changes the ear flap, the disc's end rotation, the rope's rest height, the sign's drop
and the endcard die, and **`pnpm check`, a grep and a Cover walk all pass on a changed end
value.** A1 is the only thing that sees it. `motion.check`'s A5 green with the rows gone.
Screenshot compare against P1's reference frames at `t = 33.5` and `t = 65.0` — **the disc and
the die are in the same place.**

**Must NOT touch.** Any mark position. Any duration or ease. The conversion changes *how the end
value is expressed*, never what it is.

**Walkable state.** Identical on screen. A preference flip mid-film no longer jumps.

---

## P7 · The lighting spine — `rigs.ts` wired into the film

**Size:** 2 days.

**Read:** WD §8 (whole), SB §6 *The rig* rulings 1, 3 and 4, MM §9.3 (the per-shot depth ramp),
MM §14.2 (the four passes and the shadow ruling), MM D-3, D-14, ERRATA 11.
**Code:** `src/film/stages/rigs.ts` (whole — including the *"Not yet wired into the film"*
comment at its head, `createRigs`, the `HEMI_I`/`KEY_I`/`FLAT_I` triple, the fixed key at
`(4, 6, 3)`, the `glow` PointLight at `(0, 0.8, 0)`, and `update()`'s `(1 - c)` scalars) ·
`src/film/Film.tsx` (the module-scope `AMBIENT`, the `0xffb45e` PointLight parented into
`world.ambushFlames` and `world.fire2Flames`, the frame loop, the two clocks, the pull-back
idempotence, the flicker) · `src/film/curtain.ts` (`curtainPass.render`'s three `renderer.render`
calls) · `src/App.tsx` (the `<Canvas>` element) · `src/film/motion.ts` (the D-14 comment).

**Deliverable.**

1. **Wire `rigs.ts` into the film.** `createRigs()` is called today only by `hero.ts` and
   `IslandSandbox.tsx`; `Film.tsx` still runs its v1 rig. This is the wire-in every lighting
   ruling in the doc set assumes.
2. **The `0xffb45e` retirement is a swap, not a deletion — and this is a correction to the
   draft.** That light is *"the film's one open colour violation"* (WD §5, FINDINGS P3-T6), but it
   is also **the film's only warm practical**, parented into both flame groups. Deleting it and
   waiting for a later prompt to assign slots leaves **every fire in the film emitting nothing for
   the whole of Acts 1 and 2**, against this act's own promise. So: **seat the two shipped flame
   positions (`ambushFlames`, `fire2Flames`) into practical slots 0 and 1 as part of this
   wire-in** — same positions, same flicker, **only the hue moving to the amber ramp.** The swap
   is invisible. P20 and P25 then re-site those slots as their own art lands.
3. **Three chapter-family key presets:** exterior day `(4, 6, 3)` at +18°, `KEY_I 2.2` /
   `HEMI_I 0.8` · exterior night — **the same `DirectionalLight`, lowered and dimmed**,
   `KEY_I_NIGHT 0.55` / `HEMI_I_NIGHT 0.35`, **same +18° azimuth** · interior `(2.6, 3.2, 1.1)`
   at +38°. *"Radius-limited" is not a state a directional light can be in* (ERRATA 11) — the key
   has no distance falloff, so do not convert it; S1-B5's darkest frame is composed and baked.
4. **`key.target` follows `world.look`.** The shadow box stays ±8 with far 40; beyond it,
   grounding is contact blobs (SB §6 rig ruling 3).
5. **Shadows on:** `<Canvas shadows>`, **`renderer.shadowMap.autoUpdate = false` once at setup**
   and `needsUpdate = true` once per frame before the first pass in `curtainPass.render`.
   **Mandatory before shadows are enabled, not after** — three `render()` calls otherwise mean
   three shadow renders every frame.
6. **MM §9.3's per-shot depth ramp, wired.** `d = camera.position.distanceTo(world.look)`, then
   `rig.depthNear.value = d * DEPTH_SHOT.near` and `rig.depthFar.value = d * DEPTH_SHOT.far`,
   **once in the frame loop.** P4 landed the constants and P29/P32 use `DEPTH_TIGHT`, but with no
   per-shot base **every shot in the film inherits the hero's fixed ramp** — booked by no other
   prompt.
7. **D-3:** `Film.tsx` imports `prmAmbient()` and calls it once per frame, deleting the
   module-scope `AMBIENT`. Today a live PRM flip never reaches flicker, ray spin, gait ambient or
   cloud drift.
8. **D-14:** rewrite the three shipped comments that assert the superseded thesis — in `motion.ts`,
   in `Film.tsx`'s flicker, and in `timeline.ts`'s idle note — **in this same commit**, so nobody
   builds a practical against a comment describing a dead rule.

**Acceptance gates.** `rigs.check`, `curtain.check`, `island.check`, `motion.check`, A1 green.
**A13:** `worldCasters.size ≤ 40` and `shadowMap.autoUpdate === false` whenever `<Canvas shadows>`
is set. Frame budget re-measured per pass against MM §14.1 via P1's handles.

**The honesty gate, which replaces the draft's unmeasurable *"renders identically"*:** compare
against **P1's committed reference frames** at `t = 5.2, 12.6, 19.0, 33.5, 41.5, 56.5, 61.0,
65.0`. **The only differences permitted are the four enumerated here** — shadows now present, the
key at its chapter-family preset, the depth ramp per-shot rather than fixed, and the flame glow
in the amber ramp rather than `0xffb45e`. **Any fifth difference is a regression and blocks the
prompt.** The Cover is unaffected (`hero.ts` keeps its own `createRigs()` call) and is re-walked
to confirm it.

**Must NOT touch.** No fourth light. No coloured fill lights, rim lights or lens artifacts. No
per-frame allocation. No integrator, no spring, no state — L5's one sanctioned exception is
`rigs.update()`'s `castShadow` write, already accepted in writing. **No art.** No practicals
array yet, no `lightC`, no `uTriFlat` — **P8 owns those.**

**Walkable state.** The film runs on the real rig, with shadows, with fires that still light the
frame. Four enumerated visual changes, all improvements.

---

## P8 · The state plumbing — practicals, `lightC`, `uTriFlat`

**Size:** 2 days.

**Read:** SB §6 *The rig* ruling 2, MM §10.4 (banked idles), MM §10.5 (practicals and the two
defects), MM D-1, D-2, D-15, WD G7, ERRATA 23, 24, 26; P2's spike record.
**Code:** `src/film/stages/rigs.ts` (the single fixed `glow` PointLight; `update()`'s three
`(1 - c)` scalars) · `src/film/stages/trilayer.ts` (P2's proven `uTriFlat` / `uTriFlatUv` branch,
`triDabN`) · `src/film/timeline.ts` (**every existing `curtain` write** — the `drain()` and
`tick()` call sites at t12.5, 25.4, 30, 33.1, 34.3, 40.6, 47, all found by name) ·
`src/film/curtain.ts` (`tick()`, `drain()`, the cached shell) · `scripts/walk.check.ts`.

**Deliverable.**

1. **The three-slot practicals array**, replacing the single fixed `PointLight`. Each slot
   `{ position, intensity, phase, alive, flat }`, with **one expression that serves both
   consumers**:
   `p.base * flicker(t, ambient, p.phase).glow * Math.max(1 - lightC.value, p.alive.value) * (1 - p.flat.value)`.
   `alive` and `flat` are held **by identity**, on the `rig.curtain` pattern. **Hard cap three**
   — roughly ten lines and an `update()` loop. P7's two seated flames become slots 0 and 1;
   slot 2 is free.
2. **`collapsePracticals(slots)`** — the degradation ladder's step-7 helper, **stated as a rule by
   the draft and given to nobody**: on a tiered-down device a beat's three practicals collapse to
   **one slot at their centroid, chosen once when the beat's materials are built**. Not "nearest
   to `world.look`", which flips between S6's three candles frame to frame. Every stage that
   assigns slots calls it; it exists here so they can.
3. **`lightC`** — a second `{value}` object beside `curtain`, and **the tracking tweens are the
   deliverable, not a spec sentence.** `rigs.update()` scales `hemi`, `glow` and `flat` by
   `rig.curtain.value` today; this prompt repoints those to `lightC`. **Author a `lightC` tween
   beside every existing `curtain` write — same position, same duration, same ease — in this same
   commit.** Without that, `lightC` is frozen for the whole film and the goblin, the one lit thing
   in Prep, is lit by a Performance rig inside every freeze from here until P21/P26/P29 land
   their ticks. **S3 (P9) is the only place the two ever diverge.**
4. **`uTriFlat` (0…1) and `uTriFlatUv` (vec4 rect) wired into the film's materials**, on P2's
   proven branch, defaulting to 0, with `triDabN` on the flat mix. **The board atlas binds
   rig-side as one shared sampler — declare the slot here; P19 fills it.**
5. **The banked-idle system** (MM §10.4) — a registry **capped at 20**, each entry gated on its own
   scrub-tied scalar, riding `gobT`:
   `amp = (prop.userData.maskShell?.scale.x ?? 0) * prmAmbient()`. **No boolean, no `revealed`
   flag, no callback, no `if`.** Register the five sites whose props exist today: S1-B2's ember
   drift and its cloth (`ambushFlames.userData.lit`), fire2 (shell × `lit` — **`lit` stays**, it
   sizes the flame and deleting it makes the flames full-size from t0), the lamppost, and the cave
   door. **The remaining ten of MM §10.4's fifteen sites register with their stages** (ERRATA 26).
6. **Extend A1's state vector**: `lightC.value`, every group's `uTriFlat.value`, every practical's
   `intensity`.

**Acceptance gates.** `rigs.check`, `curtain.check`, `island.check`, A1 green **with the extended
vector**. A13: idle registry ≤ 20, practicals ≤ 3. **Every registered idle's amplitude decays to
exactly 0 as its shell scrubs back to 0** — asserted in A1, not eyeballed. **`lightC` tracks
`curtain` exactly at every one of the seven existing curtain writes**, verified by sampling both
at `mark ± 0.05` in A1. Reference-frame compare against P1's set: **no change at any of the eight
marks.**

**Must NOT touch.** No fourth light. No second post pass. No art. The S3 divergence — **P9 owns
it.** No `stagger:`.

**Walkable state.** Identical on screen, with the state layer the S3 switchover and the S7 flatten
both need.

---

## P9 · The S3 curtain switchover, built and walked ★

**Size:** 1–2 days. **Small, high-risk, and mandated to come before every other S3 decision.**

**Read:** SB §3-S3's *state schedule* (the whole table plus both explanatory paragraphs — *"this
stage owns it, and no other document may contradict it"*), SB §0 amendment 1, SB §9 risk 2,
MM §2.2's *"The S3 switchover is not a same-target pair and must be said out loud"*, MM D-1/D-2,
MM §15.2 step 9, WD §7's frontier ruling, ERRATA 1, 5, 23.
**Code:** `src/film/timeline.ts` (the S3 block, the shipped prop-stop chain, the t30 exhale, the
t12.5 tick, **and `drain(25.4, 0.25, T_DRAIN_MAX)` — which this prompt deletes**) ·
`src/film/curtain.ts` (the named `tick()` recipe with `TICK = { clock: 0.15, curtain: 0.35 }`
already exported; `SETTLE.arrive`; the retired drain clamp) · `src/film/stages/trilayer.ts` (the
`triSeamF` / `triC = max(uTriCurtain, triSeamF)` lines) · `src/film/stages/rigs.ts` (P8's `lightC`
and practicals).

**Deliverable.** The S3 state schedule, authored exactly as SB §3-S3 gives it, **on v1 S3 art**:

| t | `curtain` | `lightC` | `seamX` | `timeScale` |
|---|---|---|---|---|
| 16.5 | 1 | 1 | `SEAM_PARK` | 0 |
| 18.35 | 1 | 1 | `SEAM_PARK` | 0 — the campfire's alive step + shell |
| 20.207 | 1 | 1 | `SEAM_PARK` | 0 — the lamppost group's, 0.35 s |
| **20.505** | 1 | **set 0** | `SEAM_PARK` | 0 |
| **20.53** | 1 | 0 | **set 2.0** | 0 |
| **20.55** | **set 0** | 0 | 2.0 | 0 |
| 20.55→21.45 | 0 | 0 | **2.0 → 13.0**, `power2.out` | 0 |
| 21.45–30.0 | 0 | 0 | **13.0, parked** | 0 |
| 30.0→30.3 | 0 | 0 | **13.0 → 34.0**, `power2.out` | **0 → 1** over `T_EXHALE` |
| `c = 30.34` / `c − PAIR_GAP` | 0 | 0 | set `SEAM_PARK` (paired) | 1 |

Plus, in this same prompt:

- **Delete `drain(25.4, 0.25, T_DRAIN_MAX)`.** It holds a partial curtain across `[25.4, 26.8]`
  which sits **inside no authored window at all**, and this schedule supersedes it. **Delete its
  A4 allowlist row** (§0.4).
- **The t30 exhale moves from `T_FLICK` (0.12) to `T_EXHALE` (0.3)** — the shipped call still
  runs the wrong token.
- **A comment at the call site** recording that `curtain`, `lightC` and `rig.seamX` **must stay on
  three separate `{value}` objects**: the 20.53/20.55 pair is `0.019999999999999574` apart and
  passes only because `clocks.check` groups by target. *"If anyone ever moves both onto one state
  object, the check goes from passing to failing with no code change."*
- **Register** the schedule's paired set in A2, its window in A4 and its seam span in A6.

**Acceptance gates.**
- `clocks.check` (with P4's A11 extension), A1 ×1, A4, A6, A7 all green; the A4 row deleted.
- **MM §15.2 step 9, the walk, and it is the gate:** park at 20.505, 20.51, 20.53, 20.55, 20.57
  and step between them **one frame at a time in both directions**. *"Look for: any change at all
  in the rendered frame across the four sets. There must be none"* — **including the lighting
  scalars.**
- **The campfire lit at 18.35 emits light continuously from that moment** (D-1). No jump at 20.55.
- Held-frame audit at 25 / 50 / 75% of the 2.0→13.0 sweep: **every parked frame is shippable.**
- **★ HUMAN CHECKPOINT. Nothing else in S3 is polished until this passes.**

**Must NOT touch.** **No radial pool** crossing to neighbouring trees — `reveal()` is a mask shell
of the prop's own shape, and the radial version was deleted for being the airbrushed colour disc
the colour script bans by name. No frontier that tracks his heels. **No `seamDir` promotion** —
DECLINED (SB §0 amendment 2), its budget already spent on P8's practicals. No re-timing.

**Walkable state.** S3 runs the real Performance↔Prep switchover on v1 art, walkable in both
directions with no visible flip.

---

## P10 · The portrait build ★

**Size:** 2–3 days.

**Read:** MM §8.6 (whole), MM §13.2, MM §13.4, SB §7 (whole, including the beat table, the four
demote-valves and the one re-frame valve), WD §6's phone-width contract and G3, MM §15.1 A9,
ERRATA 3 and 16, GD §11.2 and gate G7.
**Code:** `src/film/timeline.ts` (`buildTimeline`'s signature, `cam`, `cut`, `disposeTimeline` —
by name) · `src/film/framing.ts` (`fitFov`, `PORTRAIT_ASPECT` and the shipped clamp) ·
`src/film/gearing.ts` (the P14-scope note on the track height) · `src/styles.css` (the flat
`1800vh` track) · `src/film/stages/hero.ts` (`GOB_SCALE`, read **only** inside `stageGoblin`) ·
`src/App.tsx` (the resize path) · `scripts/framing.check.ts`.

**Deliverable.**

1. **`buildTimeline(world, camera, scene, caps, { prm, portrait })`** — one options object,
   threaded. `cam()` and `cut()` read
   `const look = portrait && beat.portraitLook ? beat.portraitLook : beat.look`. Selecting the
   variant is free at build and costs nothing per frame.
2. **The rebuild recipe:** on a media-query change or breakpoint crossing —
   `at = tl.time()` → `resetRelativeBases(world)` (a DEV **tripwire that throws**, not a fixup —
   P6 already removed the seven relative sites, and this is what keeps them gone) →
   `disposeTimeline` → rebuild → `tl.time(at, false)`. Budget **≤40 ms desktop / ≤90 ms phone**,
   one frame, **never during a scrub**.
3. **The breakpoint is the one `framing.ts` already owns** — `aspect < PORTRAIT_ASPECT`, evaluated
   on the existing resize handler, with **±0.02 aspect hysteresis** so a collapsing mobile address
   bar cannot thrash the rebuild.
4. **The PRM branch table** (MM §13.2's six helpers): `cam` → `cut` at the move's own start mark ·
   `cap` → plain opacity fade over the same window · `tick`/`exhale` → `tl.set` pairs `PAIR_GAP`
   apart on `timeScale`, `curtain`, `lightC` and the margin opacity · `reveal` →
   `tl.set(shell.scale, 1)` at `actionAt` · page turn → cut with no flash frame · the flatten →
   one opacity cross-fade at the same `uTriFlat` endpoints, no sweep.
5. **The portrait track:** the flat `1800vh` gains a portrait media query at the solved
   **~950vh**. **Every phone-flick conclusion in MM §7.2 and §15.2 step 11 rests on this number,
   and it is solved here, not known.**
6. **The `GOB_SCALE` rename** (ERRATA 3): `hero.ts`'s shipped constant becomes
   **`HERO_GOB_SCALE`** — it is the Cover's, read only inside `stageGoblin` — and the film body's
   `GOB_SCALE = 0.75` is a new film-level constant. **Two constants, two surfaces, two floors**
   (52 CSS px on the Cover, 84/100 px in the film).
7. **`scripts/figure.check.ts` — CLASS G, and table-driven per §0.4.** It asserts the projected
   figure height at 390×844, 500×915, 768×917 (**≥84 px, against the `{portrait: true}` build**)
   and 1440×900, 1920×1080 (≥100 px). **It ships with an empty beat table and every stage prompt
   registers its own `A`-flagged beats.** A prompt that authors a beat without registering it is
   not done. Rows are `{ id, t, flag }`; the camera vector is sampled from the built timeline, so
   a beat cannot drift from its own camera. `E`-flagged beats are exempt by construction; **S7-B6
   carries a registered exemption row**; WD §6's *"no exceptions"* is struck (ERRATA 16).

   *Why the table and not a scan: at P10 `portraitLook` exists on zero beats, so a global check
   would fail on ~30 beats the moment it landed and would gate P20 on S3–S7 beats that are still
   v1.*
8. **Extend A1 to three runs:** `{}`, `{prm: true}`, `{portrait: true}`.

**Acceptance gates.** `framing.check`, `figure.check` (empty table = trivially green, and that is
correct), A1 ×3 all green. Rebuild timed on a real phone against the ≤90 ms budget, number
recorded. **★ HUMAN, §15.2 steps 11 and 13, on a real phone:** rotate mid-film and confirm the
rebuild preserves `t` and restages portrait in one frame; the four `me*` soft rests; ten flicks to
the end.

**Must NOT touch.** **No FOV tween** — the shipped clamp holds. No runtime crop. No per-frame blend
on a viewport boolean (runtime state in the scrub domain, L5). No second `cam()` at the same mark.
`t = 66` and the gearing map are fixed.

**Walkable state.** The film walks in portrait and under reduced motion, on v1 art.

---

## P11 · The surface registry, the budgets, and the performance ladder

**Size:** 2–3 days. *(This absorbs the draft's separate performance prompt, whose ladder, tier
measurement, upload gating and bake schedule have no dependency on built art. What genuinely
needs built art — the Pass A number — becomes P22 and is re-taken in P24.)*

**Read:** WD §7 (the eleven surface classes and their recipes), WD G1 (whole), WD G2 (whole, with
ERRATA 22's corrected arithmetic), SB §6's per-mesh material census and its *"Reductions already
taken"* list, MM §14 (whole — §14.1's per-pass budget, §14.2's four passes, §14.3's throttles,
§14.5's ladder and tier measurement, §14.6), MM §12.5, MM §14.4, MM §15.1 A10 and A13.
**Code:** `src/film/stages/trilayer.ts` (`createTrilayer`, `TrilayerOpts`, `bakeStrokeTiles`, the
`rig` block) · `src/film/stages/hero.ts` (`bakeIslandAlbedo`, `bakeFoliage`, `bakeBark`, `silR`,
`buildGlowSprite`) · `src/film/pencil.ts` (`contact`) · `src/film/curtain.ts`
(`curtainPass.render`'s three `renderer.render` calls, the mask skip, the normal/depth override) ·
`src/film/Film.tsx` (the idle throttle and its early return) · `src/App.tsx` (the DPR cap) ·
`src/film/stages/rigs.ts` (shadow map size and radius) · `docs/build/TEXTURES.md` ·
P1's `window.__draws()` / `window.__bakes()`.

**Deliverable.**

1. **`src/film/stages/surfaces.ts`** — a fixed material registry: **one shared trilayer per surface
   class from WD §7 (eleven classes)**, plus at most **three stroke-direction variants per class**
   where a class genuinely needs more than the ±7° of hand variance the bake already carries.
   **Ceiling: 33 trilayer materials for the whole site.** All share the rig uniforms by identity
   and compile to **one program**.
2. **The three grammar bakes at module load:** the stroke tiles (shipped 1024², unchanged), the
   paper tooth, the contact blob.
3. **The bake slot table** — eleven class albedo bakes declared, **512² for the eight tiling
   classes**, **1024² for the four carrying close-ups** (goblin cloak, metal, fire, island ground),
   plus the board's single 2048². **Each bake is authored by the stage that first needs it** and
   registered here on landing. `window.__bakes()` reads this table.
4. **`scripts/bake.check.ts` — CLASS G half.** The byte census computed **from the slot table, not
   from a run**: `(8 × 512² + 4 × 1024²) × 1.33 + 16 MiB = 47.9 MB` against the 48 MB ceiling, and
   an assertion that **the board's 2048² carries `generateMipmaps: false`** (ERRATA 22 — with a
   mip chain the census is 53 MB and breaches its own ceiling). A bake that would cross the ceiling
   reduces its own resolution; it does not get an exception. **CLASS B half:** `window.__bakes()`'s
   ≤12 ms per bake and ≤140 ms total, read as a named line in each stage's ★ walk.
5. **`scripts/draws.check.ts` — CLASS G half:** the material census (≤40 per-mesh film-wide, ≤33
   trilayers), the one-program assertion, and **the stage/camera table is non-empty for every
   stage already built**. **CLASS B half:** `window.__draws(t)` **fails above 120**, read at each
   registered stage camera as a named line in that stage's ★ walk. **The table ships empty and
   each stage registers its own cameras** — a global scan cannot assert a camera that does not
   exist yet.
6. **The tier measurement, one measurement not two.** After `entranceDone()`, collect frame times
   for **90 rendered frames satisfying `!idle.skip && scrub.isActive()`** — frames the visitor is
   actually scrubbing — and take the median. `>20 ms` → tier down one; `>28 ms` → two.
   **Never tier back up mid-session.** The draft's t≈20 re-evaluation is cut.
7. **The seven-step degradation ladder**, garnish first, grammar last, with step 7 calling P8's
   `collapsePracticals()`. **The ladder's order is written down here; P22 supplies the number that
   may re-order it.**
8. **Texture upload gating.** `if (!scrub.isActive() && uploadQueue.length) renderer.initTexture(uploadQueue.shift()!)`,
   placed **after** the idle early-return guard, **cap one per frame**. The draft's `idle.skip`
   hook does not work: it is true only after twelve seconds of no input *and* no `t` change, and
   the loop returns before any other code when it is.
9. **The ruling that makes that queue non-empty, stated in one line in the code and in
   `TEXTURES.md`:** **the film ships no streamed textures.** MM §12.5's KTX2 atlas packing and
   prefetch-by-scroll-proximity and MM §14.4's 9 MB KTX2 film stream **retire** — G2 and G4 make
   every surface an in-code canvas bake, so there is no asset to stream and no producer for the
   queue. **The upload gate applies to the class bakes' own `initTexture` calls** at the
   stage-ahead schedule below.
10. **The G2 bake schedule.** Each stage kicks the **next** stage's class bakes during its own idle
    (`requestIdleCallback`, hard fallback at the stage boundary). **A class bake that misses its
    window renders its class in flat class albedo without the stroke tone** for the frames it is
    late — which reads as a thinner coat, not as a broken surface.
11. **`will-change` applied on interaction start and removed on settle** (MM §14.3) — booked by no
    other prompt.

**Acceptance gates.** `island.check`, `bake.check` (G), `draws.check` (G) green. **`surfaces.ts`
exports no more than 33 materials and a test proves they share one program.** **`InstancedMesh`
count across `src/` is zero and stays zero** — the trilayer computes `vTriWorld` from
`modelMatrix` and never reads `instanceMatrix`, so every instance would sample stroke tiles, grid,
seam and depth ramp from one world position. *Instancing does not merely cost work; it breaks the
material.* The v1 stages' `__draws()` and `__bakes()` baselines from P1 are re-recorded against
the registry. **§15.2 step 16:** 4× CPU throttle on the v1 film — the §14.1 budgets hold per pass,
no hitch at a chapter boundary, **no catch-up jump after a stall** (that is `lagSmoothing(0)`
doing its job), no texture-upload stall mid-scrub.

**Must NOT touch.** No new material system. No second post pass. No re-inlined colour literals.
**Never shed, at any tier:** the curtain pass, the seam, the reveal shells, the alive shadow, the
goblin's gait and breath, the captions, the focus rings, the SR document, the margin's breathe.
*The concept sheds garnish, never grammar.* **No user-agent sniffing** — the tier is chosen by
measurement. No spinner, no skeleton, no blocking screen.

**Walkable state.** Unchanged on screen, with every budget in this sheet now measurable.

---

## P12 · The set-scale island grammar ★

**Size:** 2–3 days.

**Read:** WD §3 (whole), WD §9's grammar kit (items 1, 5, 6, 8), WD G5 (both the shader fix and
the art-side belt), SB §6's grammar kit table, MM §12.9's margin/travel-line rows,
`docs/build/ASSETS.md`'s `island-card` row (the hero's verified recipe and its two honest gaps).
**Code:** `src/film/stages/islandKit.ts` (whole — `IslandOpts`, `buildIsland`, the `shadowFrag`
seam line) · `src/film/stages/hero.ts` (the shipped island at hero scale) ·
`src/film/stages/heroLife.ts` (the `LineSegments2` + `instanceCount` stroke-ramp mechanism, its
152 strokes, `applyStrokes`) · `src/film/pencil.ts` (`polyline`, `curveLine`) ·
`src/film/curtain.ts` (the two `scene.overrideMaterial` swap pairs) ·
`src/film/stages/trilayer.ts` (`uTriFeather`) · **P2's spike branch.**

**Deliverable.**

1. **The island card at set scale** — the hero's verified recipe (elliptical card over a **solid,
   closed three-band lathe skirt**: earth lip / darkened stone shelf / `caveDark` keel, bent
   tapering roots, page drop shadow) generalised to a set-scale parameterisation, plus the two
   additions WD §3 makes binding: **the edge is a section through the layers** (a bright 2–3 px
   painted lip over sectioned strata at every cut), and **places relate by wear** (cart ruts
   entering at the island edge and stopping where the pencil line stops).
2. **The grid ghost promoted to a site constant** — per island, at or below `GRID_INK` (0.04),
   extending a few cells past each island's rim onto the paper.
3. **The travel line** — `polyline()` / `curveLine()` on a `LineSegments2` `instanceCount` ramp,
   drawing **~1.5 world units ahead** of him and **un-drawing behind his heels** on reverse. The
   mechanism is `heroLife.ts`'s, verbatim; this is a new call site, not a new mechanism.
4. **The particle language** — motes, moths, embers, dust, pollen, cloud flats, and the graphite
   dust scribble sprite. Performance-only, freezable by construction, **first thing shed on low
   tier.**
5. **G5 lands for real**, on P2's proven spike: the normal/depth override and the mask override
   both become **feather-aware variants** reading `uTriFeather` and the local position from
   `mesh.userData`. Roughly ten lines each.
6. **The art-side belt, which binds regardless of the shader:** **no island's rim contour may
   depend on the prepass finding its edge.** Every rim contour in the film is an **authored mark
   with a deliberate gap where the line stops being drawn**, exactly as the hero authors its own.

**Acceptance gates.** `island.check`, `curtain.check`, A1 ×3 green. **The grammar is budgeted
here, not eleven cards later:** register the sandbox island as a `draws.check` camera and gate on
**its own numbers** — one merged `BufferGeometry` per class, **zero per-mesh materials**, and the
skirt and rim as **one draw** — so the card arrives inside the ceiling instead of being measured
against it at P24. Numbers recorded. **★ HUMAN:** one set-scale island rim walked at 390 / 768 /
1440 — the skirt is solid (no paper through the rim), the three strata bands read, the section lip
reads at the cut, the rim contour's stop-gap **reads as authored and not as a rendering failure**,
and **the prepass inks no hard ring at the card's geometric circle.** Island rims never touch the
viewport edge at any breakpoint (the drop shadow's soft tail exempt at ≤11% alpha).

**Must NOT touch.** **No infinite ground plane may be introduced anywhere** — `earthPlane` /
`grassPlane` die at S1 and S3 and nothing replaces them. No backdrop plate fills. **No scene fog**
— both depth languages are already in-material, and scene fog would stack a second, differently
coloured ramp and would fog the Prep, which has none.

**Walkable state.** The film still runs v1 stages; the grammar every one of the twelve island cards
inherits is built, budgeted and judged.

---

## P13 · The four remaining verbs

**Size:** 2 days. **Scheduled here, not in Act 3** — its only inputs are P6's absolute-end-value
rule and P5's harness, it gives `hop` a rehearsal window well before P29's flagship beat, and it
shrinks the `actions.ts` conflict window with the goblin workflow. **Requires P0 closed.**

**Read:** GD §10 (the action library table **and the ERRATA at its head — five verbs have SHIPPED,
do not re-cost them**), GD §11 and §11.1, MM §10.3 and §10.6, MM §2.3's follow-through rules,
SB §3-S5-B4 and B7 (`hop`), §3-S6-B3 (`hang`), §3-S6-B4 (`plantAndPat`), §3-S6-B1 (`touchUp`),
ERRATA 4 and 13.
**Code:** `src/film/actions.ts` — the whole verb contract, with `freeze`, `stow`, `draw`,
`scribe`, `pocket` and `throwDie` as the pattern to match (all by name); `applyGait`; `settle`;
`look`; the ear lag; **`nudge` — already the pencil butt** · `scripts/puppet.check.ts`.

**Deliverable.** Four verbs, same contract as the six that exist: caller-supplied
`(tl, g, at, dur, …)`, writing **only** into timeline-owned channels, **absolute end values only.**

- **`hop()`** — onto and off the S5 bench. Segmented-arc grammar: two or three position tweens,
  `power2.out` then `power2.in`, with chest/pelvis/ear follow-through. **Author the arc symmetric
  and the reverse is a hop-down for free.**
- **`hang()`** — guide the sign's drop in from under it, `express('strain')`, then `tap` it level
  twice. **The film's one authored `bounce.out`, spent here.**
- **`plantAndPat()`** — set the root ball, pat the soil once, move a pace along the row. ×3 at a
  quick clip.
- **`touchUp()`** — one brush stroke; the paint side arrives along the bristle line. **Used exactly
  once in the film.** Author against a placeholder brush; P30 lands the real prop.

**Acceptance gates.** `puppet.check` — the gait channel set and the authored channel set **never
overlap**; at `speed 0` every gait term is exactly 0 and the authored pose owns him. A1 ×3, A5.
**His motion identity holds:** attack 90–140 ms `power3.in`, settle 450–700 ms `power2.out`,
overshoot on head mass only ≤4%, **ears last** at `EAR_LAG` +80 ms on `back.out(1.3)`, chain order
pelvis → chest → neck → head → ears. **Anticipation is weight, not windup** — and none at all on
the easy ones.

**Must NOT touch.** **No integrator, no spring, no velocity drag** — `hemFlick` is driven by
authored action keys, and GOBLIN-B's 200 ms velocity drag and GOBLIN-C's spring are **rejected by
name**. Zero per-frame allocation, zero material swaps, zero geometry morphs. Do not touch the six
shipped verbs. **Do not re-cost GD §13 steps 6 or 7 — both are DONE and gate G8 is CLOSED.**

**Walkable state.** Unchanged on screen. Nine verbs available; four unused until S5 and S6.

---

# ACT 2 — THE PAGE

## P14 · The interface layer

**Size:** 2–3 days.

**Read:** SB §2 (the whole table and the behaviour paragraph), MM §12.10 (whole — *"it is four
tweens"*, and its argument against a CSS scroll-timeline **by name**), MM §9.2 (the parallax bans),
MM §5.2 (the `t`-driven DOM states), MM §4.1 (the cursor system), MM §15.1 A12, WD §9 grammar
item 7, SB §3-S1-B1 (the stall note), ERRATA 27.
**Code:** `src/App.tsx` (the whole render tree — **there is no margin, ruler or numeral element
today**; `<svg id="rail">` with `.rail-track` / `.rail-ink` on a `pathLength="1"` path; `#hint`,
which ships `display: none`) · `src/styles.css` (`#rail`, `.rail-track`, `.rail-ink`, the
`rail-ink` keyframes and the wide-breakpoint media query that shows it; the reduced-motion block
that already names it) · `src/film/Film.tsx` (the frame loop and its `tl.time()` read) ·
`src/film/motion.ts` (`WHISPER`, `T_NUMERAL`, `T_BEAT`, `T_SKIP`, `T_CURSOR_HIDE`, `RUNTIME`) ·
`src/film/stages/heroLife.ts` (the Cover's stall note, as the model).

**Deliverable.** One `<div id="margin">`, `pointer-events: none`, above the canvas, never over a
set piece, carrying **five behaviours and no more**:

1. **Whisper / breathe.** The whole layer is **one element with one opacity**: `WHISPER (0.04)`
   during Performance, `1` during a freeze. Six `tl.to` pairs — breathe over `T_BEAT`
   `SETTLE.arrive` at **12.6 / 33.2 / 40.7** (**the tick's mark + 0.1 t**, not the tick itself —
   ERRATA 27), un-breathe at **30.0 / 34.3 / 47.0**. Twelve tweens, one property.
2. **The chapter numeral.** Seven `<span>`s `C1`…`C7` in one container, crossfaded by `T_NUMERAL`
   opacity pairs at **16.5 / 31.5 / 37.6 / 49.5 / 57.5 / 64.5**. Twelve tweens. **Film-t, so
   `T_NUMERAL` never enters `styles.css`.**
3. **The 66-tick ruler — one path, one tween.** Not sixty-six elements and not sixty-six per-frame
   writes. One graphite `<path pathLength="66">` under one ink path with the same geometry,
   `stroke-dasharray: 0.55 0.45`, its `stroke-dashoffset` driven by a **single** `tl.to` from 66
   to 0 over `duration: RUNTIME` at position 0, `EASE_SCRUB`. **Authored in film-t**, so
   `gearing()` makes it visibly run through S1 and S6 and crawl through S8.
4. **`#rail` retires — element and CSS — in this same commit.** The shipped CSS
   scroll-timeline progress rail is exactly the thing MM §12.10 argues against at length: *"it
   would ink linearly in scroll and show no acceleration at all."* Leaving it means the film ships
   **two progress indicators, one of them the one the doc rejects.** Delete `<svg id="rail">` and
   its two paths from `App.tsx`, and `#rail`, `#rail path`, `.rail-track`, `.rail-ink`, the
   `@keyframes rail-ink` block, the wide-breakpoint rule and the reduced-motion rule from
   `styles.css`. **Name it in the complement so nobody re-adds it.**
5. **The film-side stall note.** SB §3-S1-B1's pencilled `sharpening pencils…` margin note past
   3 s of no input. The Cover has one in `heroLife.ts`; the film's margin does not, and no other
   prompt books it. Same voice, same Quiet Serif, same fade.

Plus **two things that live on the page rather than in the margin:**

- **`#film-skip`** — the element and its `t`-gate (`t >= 16.5 && t < 64.5`) computed in the frame
  loop from `tlRef.current.time()`, with the **focus-rescue branch** that moves focus to `#play`
  when the note hides while holding it. Copy: *skip to the table ↓*, Quiet Serif, `T_SKIP` ride to
  the endcard (reduced motion: jumps). **A12's skip-note and focus-rescue clauses land here, with
  the element that owns them** — the rest of A12 (`inert`, the play label) lands with P15.
- **The cursor system (MM §4.1), which no other prompt books.** Four states and **no fifth**;
  `cursor: pointer` on exactly the five controls; `html.cursor-hidden` after `T_CURSOR_HIDE` in
  play mode, restored on **`pointermove` and `focusin`**; `user-select: none` on the captions.
  P4 landed `T_CURSOR_HIDE` and nothing consumed it.

**Acceptance gates.** Interface ink **≥3:1 in its breathed form**, measured. Grid ghost
≤`GRID_INK`. **A12's skip-note assertions at `t = 16.4 / 16.6 / 64.4 / 64.6`**, plus
`document.activeElement === #play` after hiding the note while it held focus. A1 ×3 green.
**Exactly three per-frame DOM writes exist in the film**: `--sky`, the ruler's `stroke-dashoffset`,
and (later, in P16) the caption writes inside their own windows — asserted, not assumed.
**`grep -c "rail" src/App.tsx src/styles.css` returns 0** for the element and its classes.

**Must NOT touch.** **No parallax, offset, depth or 3D transform on any margin element** — they
are the sheet the world is drawn on, and a sheet that parallaxes against its own drawing becomes a
HUD. The layer never moves, never animates on its own, never occludes a subject. **No `T_NUMERAL`
or `T_STEP` in `styles.css`** — the CSS lane is three values. **Do not re-add `#rail` in any form.**

**Walkable state.** The film has its page: margin, numeral, ruler, skip note, cursor discipline.
One progress indicator, and it is the authored one.

---

## P15 · The accessible path ★

**Size:** 3 days. **Every item here is a live defect on main or a missing first-class surface.**

**Read:** MM §5 (whole, including §5.1's mechanism and §5.2's three `t`-driven states), MM §6.6,
MM §7.5 (the seventeen anchors), MM §12.3 (D-7), MM §13.4 (D-16), MM §15.1 A12, MM §15.2 steps
12/14/15, SB §2's accessibility contract, SB §8 (Screen reader, Keyboard, Vestibular, Failure and
interruption), MM D-9, D-10, D-11, D-16, D-18.
**Code:** `src/App.tsx` (`DISCORD_URL` / `CTA_IS_LIVE`, the always-restart, **Lenis never
instantiated under PRM**, the per-rAF `window.scrollTo`, the `scrollY` label flip, the skip ride,
the prose précis, `#overlay`, `#play` — all by name) · `src/styles.css` (`#endcard-cta`'s
`pointer-events: auto`, the two unguarded `:hover` rules, `mix-blend-mode` on `#play`, `.sr-only`,
the browser `outline`) · `src/Hero.tsx` (`#hero-skip`) · `src/prmForce.ts` ·
`docs/copy-spec.md`.

**Deliverable.**

1. **The SR document** replaces the prose précis. **First in DOM**, visually hidden, in order:
   `#sr-skip` (`<a href="#play">Skip to the film controls</a>`, **the first focusable element in
   the document**) → *Skip to joining the Discord* → **the eleven captions verbatim** with SB §8's
   eleven scene sentences between them → the endcard tagline and subline → the real Discord link
   as a real `<a>`. The canvas is `aria-hidden="true"`. **SEO reads this document, not the canvas.**
2. **Tab order.** Move `#play` **above** `#overlay` in the tree. Target order: SR skip → play →
   skip note (only after t16.5) → CTA. **The shipped DOM cannot produce that order today.**
3. **The focus rectangle.** Move `mix-blend-mode: difference` **off `#play` and onto its two
   children** (`#play > svg, #play > span`) — no DOM change needed — so the button itself is
   unblended and can own a focus ring that does not invert. Then the drawn double-line utility
   (`::before` at `inset: -4px`, `::after` at `inset: -7px`, opacity 0.45, rotated 0.4°) on the
   **five** focusable elements. **The CTA is the one override and it is free** — its existing
   `::after` already *is* the second line. **`outline: none` without its replacement is a hard
   failure; both land in this commit.**
4. **Guarded `:hover`** — wrap both unguarded rules in `@media (hover: hover) and (pointer: fine)`
   so hover does not stick after a tap, and add the `:active` states.
5. **The CTA's dead-link fix (D-18).** Delete `#endcard-cta { pointer-events: auto }`; gate
   `#endcard` with **`inert`** until t65.0 (**`inert` leaves the tab order; `pointer-events: none`
   does not**); and **when `CTA_IS_LIVE` is false the anchor does not render at all** — the
   subline stands alone. A dead `#` at `opacity: 0`, clickable for the whole film, ships today.
6. **The play/replay label moves off `scrollY`** to `t >= 64.5`, as a pure function of `t`.
7. **The seventeen rest anchors** (SB §2, by name) + `↓/↑` stepping over them at `T_STEP` ·
   `PgDn/PgUp` chapter · `Home` cover · `End` endcard · `Esc` de-escalates play · `Space`
   play/pause. **S6 has none, by design.** **No anchor lands mid-void.**
8. **Touch soft rests** — ±0.35 t, `T_REST` (0.22 s), fired only after momentum has died,
   **cancelled by any input**, off on desktop, off under reduced motion. L3's one exhaustive
   exception.
9. **PRM play mode (D-16) — a live WCAG 2.2.2 / 2.3.3 defect on main.** With Lenis never
   instantiated under PRM, the loop runs `window.scrollTo` **every rAF frame**: sixty repositions a
   second of smooth auto-motion delivered to a visitor who asked for none. Replace with
   **anchor-to-anchor stepping** — the next anchor's `t` reached in `(t_next − t_now)` seconds by a
   **single** `scrollTo` at that anchor's scroll position, held for the remainder. Same 66 s
   pacing, one instantaneous reposition per anchor.
10. **D-7 reload.** A **cold** visitor (no `gg.seen`) restarts. A visitor with a live
    `sessionStorage 'gg.t'` **resumes at `argmin |anchor − t|`** over the seventeen anchors, so
    every restored frame is a composed one. One write per second while scrolling, one read on
    mount, **both try/catch-guarded**. `history.scrollRestoration = 'manual'` stays for both paths.
11. **A12's remaining clauses** — the `inert` flip and the play label — asserted at
    `t = 64.9 / 65.1` and at the label's own boundary. (The skip-note and focus-rescue clauses
    landed with P14.)

**Acceptance gates.** A12 green in full. **★ HUMAN, MM §15.2 step 15:** tab from load and get
exactly SR skip → play → skip note → CTA; **the drawn double-line rectangle is legible on paper,
on the blackout and on the board**, never suppressed, never the browser default; no traps; focus
never lands on `<body>`. **Step 12:** play mode end to end 66 s ±1 s, pauses on
`visibilitychange`, yields to wheel/touch/key, `Space` with focus on `<body>` does not page-down.
**Step 14:** `__prmForce(true)`, reload, walk — **nothing moves that was not scrolled**, and PRM
play **steps rather than glides.**

**Must NOT touch.** **No hover-only state anywhere** — there is no hover during the film at all.
`:focus-visible` always receives the identical visual change as hover, plus the rectangle. No
analytics, no cookies; one `localStorage` convenience flag (`gg.seen`) and one `sessionStorage`
key, both try/catch-guarded. **No copy invented** — `copy-spec.md` is verbatim.

**Walkable state.** The film is keyboard-complete, screen-reader-complete and PRM-correct on v1 art.

---

## P16 · The caption mechanism

**Size:** 2 days. *(P16 and P17 are the draft's single Hand prompt split: the mechanism is
engineering with a check; the lettering is a hand with a human verdict. Splitting them puts the ★
where the risk is.)*

**Read:** MM §6.1 (the two technologies), §6.2 (the write-on and its authoring constraint), §6.3
(the flush and the three defects that killed the CSS ramp), §6.4 (the scrub-domain rules), MM §15.1
A8, MM D-8, ERRATA 2 and 12.
**Code:** `src/App.tsx` (`CAPTIONS` and the shipped `high: true` flag) ·
`src/film/timeline.ts` (`cap()` — **its signature does not change**) · `src/styles.css` (the
`.caption` rules).

**Deliverable.**

1. **Eleven SVG caption shells** at the **same element ids as today** — `open1` `open2` `me1`
   `me2` `me3` `me4` `light1` `set1` `welcome` `pitch1` `pitch2` — so every `cap()` call drives
   them unchanged. **Shells, not letterings: P17 authors the hand.**
2. **The write-on.** `cap()` tweens a **progress object** instead of `opacity`; `WRITE_STAGGER = 3`
   concurrency; **integer `stroke-dashoffset`** — sub-pixel dash offsets are invisible and the
   guard is what keeps the cost honest. **The forward exit is an un-write**: the second `tl.to`
   runs progress 1→0 through the same ramp, so strokes erase in the order the pen would lift.
   **Forward exit and reverse exit are the same read; one mechanism, one grammar.**
3. **The graphite⇄ink flush** — a **second `tl.to` at the same position, duration and ease as the
   curtain tween that triggers it**, staggering across the paths in the tween's own progress,
   writing through a **17-entry colour LUT built once at mount**. Not a CSS ramp: a fixed width in
   curtain-space is not 200 ms of film-t under `power2.out`, the per-path `--k` cannot be derived
   in CSS from one `--flush`, and it wrote a custom property on caption elements **every frame of
   the film**. **Two tweens at one position on one scrubbed timeline cannot desync, because a
   scrubbed timeline is positional.**
4. **The `me*` band.** The four `me*` lines seat at **24% of viewport height**, not the shared
   lower third — the shipped `high: true` flag is the ledgered fix (the lower third crosses his
   tunic at **3.54:1**, under the 4.5:1 floor, and no elevation inside the 20–75° bench clamp moves
   it off). **A per-caption authored property, checked at every breakpoint, never a runtime
   decision.**
5. **A8** — exactly eleven caption ids matching `copy-spec.md` rows 1–11 **byte for byte**; no two
   windows overlap; **≥0.12 t edge to edge**; the SR document carries all eleven verbatim in order
   plus the tagline and subline and a real `<a>`.

**Acceptance gates.** A8 green. A1 ×3 green. **Zero allocations outside the eleven caption
windows**; measure the write-on once (target **<0.05 ms/frame**, number recorded) and **do not
build a cache for it.**

**Must NOT touch.** `cap()`'s signature. Any caption's `at`, `hold` or `fade` — **re-timing is a
hard gate**, and D-8 is explicitly *not* a request to re-time the `me*` cluster. **No twelfth
caption**: copy is LOCKED and row 12 of `copy-spec.md` is the endcard **block**, not a caption
(ERRATA 2). No lettering yet.

**Walkable state.** Captions write on and un-write and flush, in a placeholder hand.

---

## P17 · The Hand ★

**Size:** 3 days. **The only prompt that edits shipped, verified Cover files.**

**Read:** MM §6.2's authoring constraint, MM §6.5 (the endcard's four shipped tweens), WD §4 (the
three voices and the voice table), SB §2's caption row, SB §6's typography table,
`docs/copy-spec.md` (**LOCKED, verbatim, rows 1–11**), MM D-8, D-17, ERRATA 2.
**Code:** `src/HeroWordmark.tsx` (**the hand to match**) · `src/styles.css` (Metamorphous on
`.caption`, on `#hint`, on `#play`) · `src/hero.css` (the hero tagline and the meta line) ·
`package.json` (`@fontsource/metamorphous`).

**Deliverable.**

1. **Eleven authored stroke SVGs plus the endcard tagline**, in the wordmark's hand, into P16's
   shells. Copy **verbatim** from `copy-spec.md`; **the lettering may never restate or reword a
   line.**
2. **The authoring constraint, and it is binding:** `N ≤ round(fade × 15)` paths — **≤6 at
   `T_BEAT`, ≤4 at `T_PUNCH`.** A "stroke" is an authored path at **word or word-group scale**,
   not a pen stroke per letter. `me3` ("I did.") is two or three paths; `me2` is four.
3. **Metamorphous retires — the gap no doc books.** WD §4 declares *"Three voices. No fourth"*,
   and `@fontsource/metamorphous` currently sets every caption, `#play` (WD §4 assigns
   play/pause/replay to **Cinzel**), `#hint`, and **two elements of the shipped, verified Cover**
   (the hero tagline and the meta line). Reassign per WD §4's voice table, then **drop the
   dependency.**
4. **`#hint`'s voice, adjudicated here because no doc assigns it one** (ERRATA Part 2 books it as
   unwritten work in no doc's bill). **Ruling: Quiet Serif**, matching the skip note it is a
   sibling of. `#hint` also ships `display: none` in film mode and is Cover-only, so the change is
   one line and one walk.

**Acceptance gates.** A8 green with the real letterings; **every SVG satisfies
`N ≤ round(fade × 15)`**, counted and recorded per caption. **Caption contrast ≥4.5:1 on its band
at every breakpoint**, measured. **★ HUMAN, §15.2 step 3:** each `me*` line readable before it
un-writes at natural scroll pace — **D-8's only real check.** **★ HUMAN: the Cover is re-walked at
all five breakpoints after the font reassignment** — it is shipped, verified work and
`docs/build/P5-REVIEW.md` is its record.

**Must NOT touch.** Any caption's timing. **No wipe on a caption and no write-on on a font** —
using the wrong one is the most visible possible tell that the lettering is not drawn. **The Hand
never revises**: the world carries erasures, the narrator does not.

---

# THE BOARD LANE — runs in parallel from the moment P11 lands

`bakeBoardMap()` is the film's single largest bet and the draft put it on the tail of the critical
path, where its unbounded iteration count would drag P32 and P33 with it. Nothing in the Act 3
stages is an input to it: its content is a deterministic canvas bake over `miniWorld`'s layout,
which P32 **re-surfaces rather than moves**. **So it starts at P11 and runs alongside Acts 2 and
3**, with one reconciliation pass after P30.

## P18 · The board vocabulary study ★

**Size:** 2–3 days. **Starts the day P11 lands.**

**Read:** SB §5.1 (the whole content list — **this is the vocabulary and it is fixed**), WD G4,
WD §9's board tier, SB §9 risk 1 (*"the film's whole bet"*), WD §16's four art gates.
**Code:** `src/film/stages/hero.ts` (`bakeIslandAlbedo` — the model for a deterministic in-code
canvas bake) · `src/film/palette.ts` · `src/IslandSandbox.tsx` (the route pattern).

**Deliverable.** A **512² study of the six hardest elements only**, judged flat at
`NoToneMapping` at **390 px**:

1. **Illustrated canopy blobs** at a tree stand.
2. **Gabled house icons** — the S6 village vocabulary.
3. **The river as bare paper with a drawn edge**, plus its pigment band.
4. **Six field washes** — the element closest to violating the no-gradient-wash gate.
5. **The massif in ink** with reserved-paper snow.
6. **Token discs at one-cell diameter** — `cloakIndigo` ring on `dieBone`.

**Acceptance gates.** **★ HUMAN, and this is the early verdict the whole bet needs:** at 390 px,
flat, **no smooth Lambert masses, no ruled analytic stripes, no default primitives, no gradient
washes.** A DM must read the six elements as a played map, not as a diagram. **If the vocabulary
does not hold at 512², it will not hold at 2048² and P19 must not start.** No goblin-green
anywhere; no `#B6D648` anywhere.

**Must NOT touch.** Nothing in the film. This is a study on a sandbox route.

**Walkable state.** Unchanged.

## P19 · `bakeBoardMap()` ★

**Size:** 4–6 days, **and budget it like the hero; it will eat iterations.** Runs in parallel
through Act 3. **One reconciliation pass after P30** to align the gabled-house icon and the token
language with what S6 actually authored.

**Read:** SB §5.1 (whole), WD G4, WD §9's board tier, SB §9 risk 1, WD §16's art gates, ERRATA 22
(**no mip chain**); P18's recorded verdict.
**Code:** `src/film/stages/hero.ts` (`bakeIslandAlbedo`) · `src/film/world.ts`'s `GridHelper` +
`boardFill` + the trim grammar's double rule and corner marks (**by name**) ·
`src/film/stages/trilayer.ts` (`GRID_INK`, and **P8's rig-side atlas sampler slot**) ·
`scripts/bake.check.ts`.

**Deliverable.** `src/film/stages/board.ts` with `bakeBoardMap()` — **one deterministic 2048²
canvas bake, no mip chain**, painting **the map of the world the visitor just walked**, in the
product's own vocabulary. It is **not** an export from the product: there is no wired path, no
forge, and no product export contains the film's world.

Content, oriented to the S7 top-down, and this list is the spec:

- **The battle grid at `GRID_INK`** — the board's underdrawing **is** the grid, which is why it
  renders identically on both sides of any frontier and inside every freeze.
- **The village** (S6's gabled-house icons) with **one NPC token disc** at one-cell diameter on the
  square where he planted the miniature — `cloakIndigo` ring on `dieBone`.
- **Three party token discs** at the road-head nearest the cliff mark (`cloakIndigo` ×2,
  `cloakCrimson` ×1: the S1 trio, arrived, mid-session) and **one monster token** near a cave-mouth
  mark. **Tokens are what a DM recognises in half a second: this map is being played.**
- **Inked roads at 2 px** · **the river as bare paper with a drawn edge** plus its pigment band ·
  **six field washes** · **illustrated canopy blobs** at the tree stands · **the massif in ink**
  with reserved-paper snow · **two painted flame marks** on the ember-roof houses · **the cliff as
  a crag-mark with a cairn dot** — the flagship's location, findable by anyone who scrubs back.
- **Edge-handling wear** at the margins: drybrush lightening, one rubbed corner.
- The double rule + corner trim marks kept from v1's trim grammar, **painted into the bake.**

Plus: **the UV rects published for S7's twelve flatten groups.** One bake, two consumers, so they
cannot drift.

**Acceptance gates.** `bake.check` (G) — **the corrected 47.9 MB census holds with the board
mip-free**, and `generateMipmaps: false` is asserted. `window.__bakes()` (B) — the board's own ms
recorded against the ≤12 ms/bake budget, with its exception recorded if it needs one. **★ HUMAN,
and it is the film's conversion surface:** judged **flat at `NoToneMapping`** at 390 px and
1920 px. **No smooth Lambert masses, no ruled analytic stripes, no default primitives, no gradient
washes — rejected on sight. No pentimenti on the board. No goblin-green anywhere. No `#B6D648`
anywhere.** A DM must read *"this map is being played"* in half a second.

**Must NOT touch.** The board does not pan, does not zoom, and accepts no pointer events at rest.
It breathes ≤0.5%, as a **scale on the board**, never a camera move.

**Walkable state.** The board exists as an asset; nothing consumes it until P32 and P33.

---

# ACT 3 — THE WORLD

**Requires P0 closed.** Every stage prompt in this act shares a standing contract, stated once and
assumed by all of them:

> **Standing contract for a stage prompt.** Read WD §5 (the palette permission table and the five
> colour laws), WD §7 (the material recipes and the technique letters A/B/C/D), WD §8 (the chapter
> families and the shadow policy), WD §10 (the depth language), SB §3's beats for the stage (all
> nine fields per beat), SB §4's transition recipes for any transition the stage uses, SB §6's
> asset bill rows for the stage, SB §7's beat row, SB §8's PRM stills row, and the ERRATA in full.
> **Own** the kit items the bill marks `N` for this stage and register them in `surfaces.ts` and
> `docs/build/TEXTURES.md`; **reuse without re-baking** everything an earlier stage authored — the
> azimuth discipline (one bake per chapter family) is what makes that safe. Author each `A` beat's
> `portraitLook` beside its landscape camera. **Register** the stage's `tl.set` pairs in A2, its
> page turns in A3, its curtain windows in A4, its `A` beats in `figure.check`'s table, its
> cameras in `draws.check`'s table, its idles in the banked-idle registry, and its world casters
> per SB §6 rig ruling 4. **Retire every named hatch site by NAME** (ERRATA 8: **31 live sites**,
> not 33 — the two goblin patches are already gone and one grep line is the monster's not-hatch
> comment).
>
> **Gates on every stage:** `pnpm check` green · A1 ×3 · `figure.check` green **on its own
> registered beats** · `window.__draws()` **≤120 at the stage's registered cameras, number
> recorded** · `window.__bakes()` inside ≤12 ms/bake · the per-mesh census matches SB §6's row ·
> zero `hatch(` / `crossHatch(` call sites left from the stage's list · **zero console errors on a
> full forward and backward walk.**
>
> **Never on any stage:** no hatching · no tone mapping · no `InstancedMesh` · no infinite ground
> plane · no smooth Lambert mass, ruled analytic stripe, default primitive or gradient wash · no
> eighth transition · no re-timing · no new copy · no unmotivated light.

## P20 · S1 — The Claim ★

**Size:** 4–6 days. **The film's first v2 art and the proving ground for the whole kit.**

**Read:** the standing contract, plus SB §3-S1 (header + five beats), WD §13's S1 row, SB §9
risk 5.
**Code:** `src/film/world.ts` — `buildAmbush`, `buildAdventurer`, `buildFlames`, `buildArrow`,
`buildRayBurst`, `buildRock`, `buildGround`'s `earthPlane` / `grassPlane`, and the `camp`
children-filter coupling (**all by name**) · `src/film/Film.tsx` (P7 seated the flame practicals —
confirm slots 0 and 1) · `src/film/timeline.ts` (S1's shipped marks, `boltThrow` / `arrowThrow`,
the flinch composite, the leap's three tweens — by name).

**Deliverable.** **Camp island** and **cliff island** at set scale — the cliff **baked once for
the day family**, which is what lets S2's night and S7's dawn share one asset. Genuine night:
`skyDusk #6D78AE` air, the campfire as the sole key on the exterior-night preset, embers on the
world clock, **the amber ramp carrying practical light.** **The two infinite planes die.** Rock and
cliff take baked 3-tier tone riding `roughen()`, with strata as **contour steps, never hatch**, and
section bands at every cut; drybrush on climbable edges only. Adventurers re-surfaced
**silhouette-first, painted cloaks, zero interior hatch.** Bolt and arrow impacts as painted
strokes plus `rayGold` bursts; scorch is **painted dark pooling.**

The camp gets an explicit island group, and **`onlyFor(world.camp, 0, 18)` becomes
`onlyFor(world.camp, 0, 16.4)`** — the camp must vanish inside the void hop's anchorless window,
not mid-S3 on another island. **S1-B4's NEW MARK:** `look` toward lens at 7.75–7.95 from
three-quarter, half a beat, not dead-centre — the plant for S2's address.

**Kit items this stage owns:** rock kit (boulder ×3, outcrop cluster, cliff strata stack, scree,
pebbles) · light kit (campfire: ring + logs + tongue flames + glow) · cast tier (adventurer trio) ·
keeping props (bedroll / pack / spear, arrows + shield + bolt) · cloud and streak flats + ember
particles.
**Hatch sites retired, by name:** the S1 rock face, and **the adventurer's cloak tone** (ERRATA 7
— it was never the goblin's; it lives inside `buildAdventurer` and retires under the cast tier's
zero-interior-hatch rule).

**Extra gates.** **Per-mesh materials: zero** for this stage (SB §6's census). Two of the five
beats are `E`; **B3 is reclassified to `A`** — the flinches are the acting. **The sheet-edge rule
is satisfied twice in B2** — no wide may crop an island on all four sides. **★ HUMAN, and it is
SB risk 5:** *"Night on a paper page is unproven… if the read fails — too pale, or the day-baked
shadow side contradicting the fire's direction — the fix lane is intensity and air only; the bake
and the azimuth are law. Judge at the first S1 walk, flat transfer, no grading escape hatch."*
**This is also the first frame in which the rebuilt goblin is lit** — which is why P0 gates it.

**Must NOT touch.** The cliff island's bake family (shared with S2 and S7). The two licensed page
turns at 7.5 and 9.5 are S1's only cuts.

**Walkable state.** S1 is v2; S2–S8 still v1. The film walks end to end.

## P21 · S2 — The Address ★ · FLAGSHIP 1

**Size:** 2–3 days.

**Read:** the standing contract, plus SB §3-S2 (header + five beats), WD §13's S2 row, WD §11's
tick paragraph, ERRATA 12, **P3's recorded verdict on the erasure.**
**Code:** `src/film/timeline.ts` — the hand-rolled `{ timeScale: 0, duration: 0.2 }` freeze and
its `drain(12.5, 1, 0.6)` (**by the shipped comment at the site**) · `src/film/curtain.ts` (the
named `tick()` recipe, with `TICK = { clock: 0.15, curtain: 0.35 }` already exported) ·
`src/film/pencil.ts` · `src/film/stages/trilayer.ts` (`rig.aliveShadow`).

**Deliverable.** The cliff's underdrawing gains construction ellipses, measure ticks and authored
contours in `graphiteDark`. **Flagship 1: one erased, redrawn contour** in `graphiteLight` under
the committed line, with a legible smear direction, plus **the boulder's prior-position ellipse**
as one of the film's exactly four eraser ghosts. The grid ghosts in. Dust hangs as **the film's
only Prep-side particle** — a graphite scribble sprite, frozen by construction. **His contact
shadow is the only shadow in the frame** (`rig.aliveShadow`). One authored framing on the erasure
inside the freeze.

**And the tick is fixed here.** The shipped code still hand-rolls the freeze; **neither S2's nor
S5's freeze calls the named `tick()` recipe**, even though `TICK` is already exported. Convert
S2's to the recipe — `world.timeScale → 0` in ≤0.15 t **no ease**, `curtain → 1` in 0.35 t
`power2.out`, margin breathes to full over `T_BEAT` at **12.6**. **This closes FINDINGS P1-T3**,
which the direction has carried since v1, and **deletes the `drain(12.5, …)` A4 allowlist row**
(§0.4).

**Extra gates.** Per-mesh materials: zero. **A4's `[12.5, 12.85]` window green with the row gone.**
The four `me*` letterings on the 24% band clearing 4.5:1, measured. **★ HUMAN:** the flagship read
at 390 / **768** / 1440 (SB risk 6 — 768 is where the argument thins for half of real traffic);
*"a mark the camera is forbidden to point at is a mark that does not exist."*

**Must NOT touch.** S2 is Prep: **no key light at all.** No frontier exists in S2 — experience §6's
*"color floods back along his walk direction"* is superseded. No fifth eraser ghost.

## P22 · Pass A, the first measurement

**Size:** half a day. **A gate, not a build.**

**Read:** MM §14.1, MM §14.2 (the four passes), MM D-12, P11's ladder as written.
**Code:** `src/film/curtain.ts` (`curtainPass.render`'s three `renderer.render` calls, the mask
skip, the normal/depth override) · P1's `window.__draws()` and the frame-time instrumentation.

**Deliverable.** **Measure Pass A** — normal/depth, full res, which **runs every frame of the
entire film** because the sketch pass's contour ink is always on — against §14.1's **≤3.0 ms**, on
the **built S1 and S2 art**. Record the number.

Plus **the ladder decision rule and its threshold, written down**: if Pass A exceeds 3.0 ms on the
ribbon, **step 6 (normal/depth → 0.75 res) is promoted above step 3.** The rule is authored here;
**the measurement that triggers it is taken in P24, on the ribbon, because that is where D-12
states the threshold.** S1 and S2 are two small islands; the ribbon is a 30-unit island with a
40-tree merged stand. **The number taken here cannot decide what P24 may spend, and this prompt
says so rather than pretending otherwise.**

**Acceptance gates.** The number is recorded in `docs/build/FINDINGS.md` with the machine and the
DPR it was taken at. The decision rule is written into P11's ladder as a named branch.

**Must NOT touch.** Anything. This prompt measures and writes.

**Walkable state.** Unchanged.

## P23 · S3 — the flora kit

**Size:** 2–3 days. *(The draft's ribbon prompt was an island, a ten-item kit, a transition and the
film's draw ceiling in one. The kit is judgeable on its own, in the sandbox, with its own budget.)*

**Read:** the standing contract, plus WD §9's flora kit, WD §7's foliage and bark recipes,
SB §6's grammar kit table.
**Code:** `src/film/world.ts` — the 44 flat-fill trees, `buildPine`, `buildOak`, `buildMushroom`
(by name) · `src/film/stages/hero.ts` (`bakeBark`, `bakeFoliage`, `silR`, `buildTree`) ·
`src/film/stages/surfaces.ts`.

**Deliverable.** **The flora kit's ten items**, authored in the island sandbox on P12's card, and
**merged one `BufferGeometry` per class per island** — a 40-tree stand is **one draw call.**
Silhouette radii come from **`silR()` derived from the tier cone profile, never authored free** —
the P4d-T2 lesson, closed at P4e and not to be re-opened. `poster: 12` on crowns.
`stroke.sheet: true`. **No wear on foliage — trees are tended, not handled.**

**Acceptance gates.** **Gated in the sandbox with its own numbers, not against the ribbon's:**
`window.__draws()` on a 40-tree stand returns **one draw per class**, and the kit contributes
**zero per-mesh materials**. `bake.check`. Registered in `surfaces.ts` and `TEXTURES.md`.

**Must NOT touch.** The ribbon island — **P24 owns it.** No timeline mark.

**Walkable state.** Unchanged in the film; the kit is built and budgeted.

## P24 · S3 — the path ribbon island ★

**Size:** 3–4 days. **This is where the film's draw ceiling is set.**

**Read:** the standing contract, plus SB §3-S3's header (the deleted list, the shadow ruling, the
void hop) and B1, SB §9 risk 3, WD §13's S3 row, MM D-12, P22's recorded number and rule.
**Code:** `src/film/world.ts` — `buildPathProps`, `buildGround` (by name) ·
`src/film/timeline.ts` — v1's `tl.set` teleport that the void hop replaces, and
**`tl.set(world.cliffSet, { visible: false }, 16.5)`** (by name) · `src/film/stages/hero.ts`
(`bakeIslandAlbedo`) · P23's flora kit.

**Deliverable.**

1. **The path becomes a ribbon island** — and because *the hero island is a slice of it*, its
   albedo, bark and foliage bakes **extend 1:1**. Ribbon path, verge, cut edges both sides, **entry
   ruts that stop where the pencil line stops**, the island's grid ghost. The 44 flat-fill trees
   die, replaced by P23's merged stands.
2. **The void hop** (S3-B1, stage-owned): from 15.85 he runs off the cliff rim onto bare paper,
   the travel line draws ~1.5 units ahead, the camera swings to three-quarter-back and tightens so
   that for ~0.5 t **nothing but paper, the line, him and his contact shadow is in frame.** Inside
   that anchorless window, **one scrub-tied `tl.to` slides goblin + camera + look by a constant
   world offset** onto the path island's approach — a match-on-motion reposition, invisible
   forward, exactly reversible backward. **No page turn is spent; the seven-transition catalog is
   untouched.**
3. **The `cliffSet` NEW MARK, which no prompt in the draft owned.** `cliffSet.visible` is set at
   0 / **16.5** / 57.0 today; SB §3-S2-B5 requires the close to move to **16.9 — "off-frame under
   the void hop."** A cliff island that vanishes at 16.5 **pops out of a frame the goblin has just
   run off**, which is precisely what this prompt's own reverse gate tests. Move it, and
   **register it in A1's `onlyFor` visibility component** — noting that it is a **bare `tl.set`
   trio, not an `onlyFor` triad**, so the pairing rule applies differently and A2 does not claim it.
4. **Shadows on this island: none.** The ribbon registers **no world casters**; every painted prop
   is grounded by the contact blob baked into the island albedo. This is what stops a graphite tree
   east of the frontier throwing a shadow onto painted ground west of it — *a drawing casts
   nothing* — and it removes any need for the key's ±8 box to cover a 30-unit island.
5. **The mandatory Pass A re-measurement.** Take Pass A **on the built ribbon** against ≤3.0 ms and
   **record a ladder decision as an acceptance line**: step 6 promoted above step 3, or not. This
   is the measurement D-12 actually specifies; P22's S1/S2 number is not it.

**Acceptance gates.** **`window.__draws()` at the B3 and B7 cameras is the film's ceiling** — the
number is recorded and **every later stage is measured against it.** *"Just one more separate
mesh"* on the ribbon is where the budget dies first. **§15.2 step 4a, the void hop's reverse
check:** at 390×844 and 768×917, walk t16.4→17.1 and back at three speeds — **no island pixel in
frame at any point of the slide, in either direction.** Portrait's taller FOV is the risk case;
**widen the anchorless span by 0.1 t if it fails, never move the camera.** **★ HUMAN:** the
ribbon's rim, the merged flora stand, the void hop both directions, and **the measured draw number
read aloud.** *A ceiling breach found after seven prop stops are built on it costs the later
prompt entire.*

**Must NOT touch.** P9's state schedule. The seven prop stops — **P25 owns them.**

**Walkable state.** S3's island and its entrance are v2; its props are still v1.

## P25 · S3 — the seven stops, the lantern, the frontier's art ★

**Size:** 3–4 days.

**Read:** the standing contract, plus SB §3-S3 B2–B7 and the t26.5 handoff, WD §7's *seam*
section, WD §9's hero tier, **P9's committed state schedule (this prompt may not alter it)**.
**Code:** `src/film/timeline.ts` (the shipped per-stop chain and its six `reveal()` sites, by
name) · `src/film/world.ts` (`buildChest`, the cave mouth, the sign, the ravens, the mushrooms,
`buildMushroom`) · `src/film/curtain.ts` (`reveal`).

**Deliverable.** The seven prop stops kept at `segAt = 17 + i·1.857`, `actionAt = segAt + 1.35` —
**five land inside this stage, the last two belong to S4's t-range.** Each prop gets its authored
surface **plus one whisper of history** (older nail holes on the signpost, a graphite ring where
mushrooms grew last season).

**The lantern beat is the thesis image:** the pool blooms, trees take their paint back, shadows
arrive with colour, and the frontier absorbs the reveal. The lamppost is **restaged so the flame is
never occluded by its own post** and the bracket resolves against paper (P4d-T5 is a staging rule
now, not a weight problem).

**The hand lantern — WD §9 hero tier item 4, and the draft built the lamppost instead.** SB §6's
hero tier row is *"S3, carried, light kit surface, R"*: **the lantern he carries between sets** is
a distinct hero-tier prop, and it is authored here.

**Hatch sites retired here, by name:** the **cave mouth** → `caveDark` paint + contour · the
**chest interior** → **painted dark pooling** · and **the sun disc and ray decal die** — morning
is the day-family key at `skyDay`.
**The sign letters and the mushroom gills do NOT retire here** — they belong to props S4 stages
(the mushroom stop at `actionAt 27.635` and the signpost at 29.492), and both props' per-mesh
materials are counted inside S4's census, not S3's. **P26 retires them with the props they belong
to.**

**Two practicals** (campfire + lantern — the *"three embers of motion in one frame"* read is two
practicals plus the door's motion, not three lights). **Four per-mesh materials:** the fire2 group
(ring + logs + flames + glow merged to **one** material carrying the alive step), the lamppost
group, cave + door, chest + lid + coins. **Three banked idles registered** (fire2, lamppost, cave
door settle-creak) — three of MM §10.4's ten outstanding sites.

**Extra gates.** **Per-mesh census exactly 4.** **★ HUMAN, SB §7:** S3-B3 at 390 px — lamppost and
goblin **stacked vertically** (post exits top of frame, lit ground fills the lower half, caption
band on the quiet outer edge), he clears 84 px, the band clears 4.5:1, and **the graphite→ink flush
is QA'd at 390 exactly.** Held-frame audit at 25 / 50 / 75% of the frontier sweep and of the
lantern's reveal shell, where the idle amplitude is half up.

**Must NOT touch.** P9's state schedule. **No radial pool. No `seamDir`.** The chest's judged coins
are a `PUPPET.pop`, **not a verb** (ERRATA 4). The S3 cave door's "previous swing arc" is
**deleted** — it was the same designed mark as the tavern door's under a second name.

**Walkable state.** S3 is v2 end to end.

## P26 · S4 — Proof of Scenery ★ · FLAGSHIP 2

**Size:** 4–5 days.

**Read:** the standing contract, plus SB §3-S4 (header + six beats), WD §13's S4 row, MM §10.7's
theatre-disc paragraph, SB §9 risks 16 and 17, **P3's recorded verdict on the arcs and its solved
S4-B5 camera.**
**Code:** `src/film/world.ts` — `buildTheatre` (by name), the rope, the mountain flat ·
`src/film/timeline.ts` — the disc (absolute since P6), the rope's yoyo (`repeat: 11` since P6), and
the two 29.1 reveals that retire here (by name).

**Deliverable.** Theatre island card + backstage apron. The disc becomes a **planked painted
stage** on a floorboard-family directional bake with the **ruled silhouette kept** and paint
supplying all tone, kerb-throat drybrush where the rope runs. The forest half turns on **visible
radial rails.**

**Theatre machinery — the film's one asset with no paint side:** capstan + spokes, six radial
rails, **two outboard counterweight booms** sweeping at radius ≈8.2 outboard of the kerb, four
blocks, boom rotation slaved to `stageDisc.rotation`. *That outboard sweep is what makes flagship 2
a shot.*

**Flagship 2: the scribed arcs worn into the apron bed** — 3–4 arcs plus one overshoot, **at P3's
solved camera and on P3's recorded siting** — plus **the tree's prior-position ellipse** (eraser
ghost 2). The mountain flat becomes **reserved-paper snow** — the page showing through, shaped by
blue-grey shadow strokes and a drawn windward edge; an honest theatre flat with a graphite brace
and slot visible at the freeze. *It is barely painted because nobody has played there yet.*

**S3's last two prop stops land here** (mushrooms at 27.635, signpost at 29.492) — **and so do
their hatch retirements, which the draft mis-routed to S3:** the **sign "letters"** → authored
scribble rows, and the **mushroom gills** → **one committed shadow mass under the cap, one value
step, no strokes.** Both props' per-mesh materials are counted in this stage's census.

**The two shipped reveals at 29.1 (`tufts`, `treeline`) retire** — the t30 exhale takes them,
saving two per-mesh materials and two tweens. The rope is `alive`-stepped at contact to keep it
painted **through** the flicker — it is **not** a touch reveal (there is no Prep to reveal from at
`curtain = 0`). `set1`'s ink⇄graphite flush keys off the curtain value.

`skyOvercast`, flat near-vertical key, **no practicals.** **No radial seam** — an angle around a
pivot is a second shader mode, not a dot; the turn stages with the shipped seven-transition grammar.

**Extra gates.** **Per-mesh census exactly 3** (mushrooms, signpost + board, rope). **★ HUMAN,
§15.2 step 7:** the disc at t31.5–34.3 at **flick speed, both directions, three times** — the turn
direction matches the scroll direction by construction, *and this walk is what confirms no
smoothing crept back in.* Flagship 2 at 390 / 768 / 1440. SB risk 16: *"the S4 stillness is
deliberate and may still read as dead. If the wide sags, the fix is dressing density, never turn
speed — time is locked."*

**Must NOT touch.** **`DISC_SMOOTH` does not exist and is not reintroduced** — the `SCRUB` glide
**is** the disc's inertia. No practicals on this stage. Time is locked.

**Walkable state.** S1–S4 are v2.

## P27 · S5 — the room

**Size:** 3 days. *(SB risk 3's second-densest set, split so the room is judged before a cast of
six is built on top of it.)*

**Read:** the standing contract, plus SB §3-S5's header, SB §6's set pieces and carpentry rows,
WD §13's S5 row, SB §6 rig ruling 1's interior family.
**Code:** `src/film/world.ts` — `buildTavern` (by name, ~470 lines), the hearth, the window, the
table, the sheets, the DM screen, the shelf, the benches.

**Deliverable.** Tavern island card + cutaway shell, **open side +z by construction**, sized
against `MAX_PULLBACK 2.2` so portrait never sees outside the set. **The interior key family at
+38°** — the film's one azimuth move, lighting only assets that exist nowhere else — with
**hearth + candle practicals carrying the room and the key demoted**; dark corners kept.

Retirements, by name: **the firebox** → painted dark + coals · **the table wear** → **drybrush**,
on a wear bake carrying forearm drybrush and **one repair patch exactly one value step off** ·
**the sheets and the DM screen** → authored scribble rows, with the screen taking **a dedicated
256² map-vocabulary bake, NOT a `bakeBoardMap()` slice** (that is what keeps G2's schedule intact)
and **one per-mesh material with `alive = 1` set at build** · **the tavern bay** → drybrush.

Benches ×3 with a **rubbed-paint landing patch on the hop bench.** Shelf + five bottles, rubbed at
grab height.

**The spill-drop prop, which no prompt in the draft built:** **two painted droplet flats plus the
tabletop splash decal** (SB §3-S5-B3, flagged `N`). **P29 authors only its 0.2 t fall tween** — the
prop itself is this stage's.

**Extra gates.** `window.__draws()` ≤120 **and ≤ the ribbon's number without a recorded decision**,
number recorded. `bake.check`. **World casters: the goblin only** — the room is frozen for most of
the stage.

**Must NOT touch.** The cast — **P28 owns it.** `buildFinger` / `nudgeFinger` — **P29 deletes
them.** No beats.

**Walkable state.** S5's room is v2 and empty; its cast and beats are still v1.

## P28 · S5 — the population and the window ★

**Size:** 2 days. **G6 is the shot, so the ★ is here.**

**Read:** the standing contract, plus **WD G6 in full** (what the humans are during the freeze),
WD §13's S5 row's window line.
**Code:** `src/film/world.ts` — the window and its muntins, the tavern interior (by name) ·
`src/film/stages/trilayer.ts` · `src/film/curtain.ts` (`markAlive`).

**Deliverable.**

1. **The cast of six** — DM + two players + three patrons mid-laugh — **silhouette-first**, one
   direction per garment panel, `poster: 3`, committed shadow mass, **no interior hatch.** **The
   DM's near arm is built as an addressable joint**, because P29 authors a throw on it.
2. **The window view set.** The window-night hatch retires into **a real view of the undrawn world
   through the glass** — *the room is finished; outside is still pencil*, which WD calls the best
   single shot idea in the field. Implemented as: **muntin frame kept, no glass material**, and
   behind it **two flat baked graphite cards on `MeshBasicMaterial`, outside the trilayer** —
   which closes the "stays drawn" gap with **zero new uniforms.**
3. **G6, and it is the ruling:** the DM, the players and the patrons **all freeze into the
   underdrawing like everything else. They are never `markAlive`d, in any stage, under any
   freeze.** *The players are in the Performance; the goblin is the one who crosses.*

**Acceptance gates.** **A grep proves no cast mesh reaches `markAlive` from any stage.** **★
HUMAN, and it is the shot:** the frozen room at 390 / 768 / 1440 — **three graphite figures caught
mid-laugh, a graphite die still wobbling, a graphite mug ring on the table, and one painted goblin
walking through them casting the only shadow in the room.** If G6 does not read here, it does not
read anywhere, and finding that out after eight beats are built on it costs P29 entire.

**Must NOT touch.** The room's surfaces. The beats.

**Walkable state.** S5's set and cast are v2 on v1 beats.

## P29 · S5 — the beats ★ · FLAGSHIP 3

**Size:** 3–4 days.

**Read:** the standing contract, plus SB §3-S5 B1–B8 and the t50 handoff, SB §4-6 (the
walk-through and its **three named QA cases**), MM §9.3 (`DEPTH_TIGHT`), MM §10.7's die paragraph,
SB §9 risks 7, 10, 11, 12, ERRATA 13, **P3's recorded verdict on the rings and its solved S5-B4
camera.**
**Code:** `src/film/timeline.ts` — **L7's one sanctioned exception** (a `tl.set` and a `tl.to` on
`dieInner.rotation` at the same position, where the set is the tween's from-state), the
`tavernSet` / `montageSet` `onlyFor` windows, and **`drain(40.6, 1, T_DRAIN_MIN)`** (all by name) ·
`src/film/actions.ts` (`nudge` — **already the pencil butt**; `hop` from P13) ·
`src/film/dieGeometry.ts`.

**Deliverable.**

- **The walk-through (t36–38), the film's most fragile transition.** The camera follows him behind
  the mountain flat; its braced graphite back wipes frame as a near-black silhouette plane;
  **darkness t≈37.2–37.9 held at `caveDark` lifted one value step (≈`#4E4133`), never true black**,
  with the margin breathing in `paper` at 55% (≥3.5:1). An exposure crossfade t≈37.8–38.1 opens on
  the tavern establish, and **the set swap happens entirely inside the crossfade** via the shipped
  `onlyFor` triads.
- **S5-B2's DM throw, which no prompt in the draft named:** *one authored arm-swing releasing the
  die at 37.9–38.2, cast-tier acting on the puppet lane*, on the addressable arm P28 built. It is
  the reason the die is in the air at all.
- **The die's jewel treatment** — `dieBone` gouache, **painted numerals QA'd at 390 px from B2's
  exact angle** (1 vs 20 vs neighbours unambiguous), worn edges, **one authored glint** (a
  miniature painter's dot-and-line baked into the paint layer, **never a specular**), real inertia
  in the tween, `SETTLE.heavy` settle landing **exactly** on the 1-face. **Dead still through the
  freeze** — `dieWobble` stays 0; any rock after the settle reads as the die landing twice.
- **The tick at 40.6 on the named recipe**, margin breathe at 40.7, and **the
  `drain(40.6, …)` A4 allowlist row deleted** (§0.4). This closes FINDINGS P2-T4.
- **Flagship 3: the graphite mug rings**, living **in the underdrawing layer** as `pencil.ts`
  ellipse strokes in the graphite ramp on `plank`, at P3's solved camera and recorded siting, with
  one mug restaged onto the near edge beside its ring — plus **the tavern door's previous swing
  arc** (eraser ghost 3).
- **He strolls in**, `express('flat')` into the shrug (the deadpan is the film's editorial position
  on cheating), **`hop`** onto the bench, and **nudges the die with the pencil butt** — the mitt
  has no finger and he would use the tool anyway; **the flip to butt-forward is the anticipation.**
  The die takes paint at the moment of contact — **`reveal()`, 0.6–0.9 s, blooming from the die's
  own centre: the one G6 exception, and the only object at that table that crosses.**
  `DEPTH_TIGHT` on the macro, in and out inside one breath.
- **The spill-drop's fall** as **a 0.2 t timeline tween, never world-clocked**, precisely so it
  re-hangs on scrub-back. (P27 built the prop.)
- **The exhale at 47.0** with `snapBack`, `welcome`, the cheer completing, the drop landing and the
  rings closing under paint.
- **`buildFinger` and `nudgeFinger` are deleted**, and the crease hatch inside them dies with them.

**Extra gates.** **Per-mesh census exactly 2** (the die, the DM screen's map face). **★ HUMAN:**
the walk-through's **three named QA cases** — a parked scrub mid-darkness must be a composed frame;
the set swap must hide **completely in both directions**; the S5 establish must be **fully composed
on the emergence frame** (the stale-frame trap). **§15.2 step 10:** step t37.9→38.1 and back at one
notch — **no rotation snap in either direction** (A1 is the only automated guard on the t38
set-then-tween; this is the eye on it). **§15.2 step 11:** park at 49.5 / 49.7 / 49.9 at every
breakpoint including portrait's taller FOV — **no islet geometry anywhere in frame**; if one
appears, move `montageSet`'s open to `49.9 − PAIR_GAP`, **not the camera.** Risk 10: budget
rehearsal for the full-puppet nudge — bench + table is a stacked-furniture reach at proportions
where his arm is a third of his body; **`puppet.check` at both breakpoint camera targets**, and the
die may need to sit a few centimetres nearer the bench edge. Risk 11: *"judge in the built frame,
and thin the rings before moving the camera."* Risk 12: the reverse of the die's reveal at macro
scale has never been seen — if the un-painting reads as a glitch, **re-judge the shell's radius and
duration inside the shipped 0.35–0.9 s band, not with new machinery.**

**Walkable state.** S1–S5 are v2.

## P30 · S6 — The Many Jobs ★

**Size:** 4–5 days.

**Read:** the standing contract, plus SB §3-S6 (header, **the six subjects section which supersedes
Chapter Three's R1 and R2**, seven beats), SB §4-5 (the page turn), WD §13's S6 row, SB §9 risks 14
and 17, ERRATA 17 (**the chest vignette is CUT**).
**Code:** `src/film/world.ts` — `buildMontage` (by name), the six discs, the monster's tick-stroke
shag (by name — *already the correct no-hatch language, authored specifically as not-hatch*),
`buildRayBurst`, `buildHouse` · `src/film/timeline.ts` (the shipped montage solve — *the figure
floor is met by camera distance alone in all six, precisely because a phone frame is 36° wide*).

**Deliverable.** Six discs become **islets with island edges** — ~5×5 square worksheet cards,
sectioned three-band edge, drawn rim with a stop-gap, grid ghost, page drop shadow — carrying
**non-verbal draughting marks in their margins**: dimension ticks, one arrow, an X where a prop
will stand. **`pencil.ts` primitives, never a font.**

**The six subjects, and there are six:** road · monster · sign · saplings · NPC miniature ·
candles. **The chest vignette is CUT** — it re-argued S3-B5 with the same registered prop thirty
seconds later, and the montage's job is to accumulate, not restate. Its `hoardTone` hatch dies with
the geometry.

The monster **keeps its tick-stroke shag language and is repainted**, not rebuilt: `monsterHide`
gouache in three quantized tiers **riding `roughen()` displacement, never parallel bands.** The NPC
becomes a **based miniature** — the script's own simile made literal, and **at the flatten every
figure resolves to a token disc**; the product rhyme costs one prop, and it **never idles** (its
stillness among five idling vignettes is the rhyme, on purpose).

**S6's named props, which the draft's deliverable never listed:** **S6-B1's keeping props — map
sheet, quill, inkpot and two weight stones** — and **S6-B6's candle table and book.** Both are `R`
rows in SB §6 and both are authored here.

The road vignette uses the fence-post pencil and **the film's one `touchUp` brush stroke**, with
**the brush + pigment pot** authored here as hero tier — *pencil draws the Prep, brush paints the
Performance: the trilayer's origin story as two props.* The tavern sign gets the film's one
`bounce.out` drop and its shutter becomes **painted `caveDark` behind slats.** The candles hand off
to dawn.

**Three practicals — and this is why the cap is three.** Three touch reveals at 56.4 / 56.6 / 56.8,
each with its own shell and its own material, **each banked on its own `maskShell.scale.x`.**

**Six page turns** at `50 + i·1.25`, each a camera `cut()` under **one frame of paper, never
black**, plus paired goblin relocate `tl.set`s at `c` and **`c − PAIR_GAP`.** Hatch retirements by
name: the deleted v1 cylinders' site · the **mound** · the **stump rings** → **painted concentric
value steps, never hatch** · the **written book** → scribble rows. **`buildRayBurst` retires** —
*rays were v1's word for light.*

**Extra gates.** **Per-mesh census exactly 4** (the road mark + three candle flames). **A2** on all
six clusters plus the t50 handoff; **A3** on six of the nine page turns. **★ HUMAN, §15.2 steps 5
and 6:** park just before each cluster, step through at one notch, step back — *no pose snap, no
frame where he is in two places, no prop left revealed on the way back*; and the page turns show
**paper, never black**, no double flash, with the `at + 0.04` drift starting **after** the cut, not
with it. SB risk 14: check the monster's tiers **at the vignette lens, not in isolation.**
**S6 has no rest anchors, by design** — it is the one stage that rewards momentum, and `PgDn` jumps
it.

**Must NOT touch.** **No lettering in the islet margins** — copy is locked and the draughtsman
annotates in marks. No seventh vignette. The chest stays cut.

**Walkable state.** S1–S6 are v2. **P19's reconciliation pass runs now**, aligning the board's
gabled-house icon and token language with what this stage actually authored.

---

# ACT 4 — THE HANDOVER

## P31 · S7 — the art

**Size:** 3 days. *(Split from the flatten so the art is judged as art and the mechanism is judged
as mechanism. The flatten is the film's most-scrubbed move; it deserves its own prompt and its own
★.)*

**Read:** the standing contract, plus SB §3-S7's header and beats B1–B3 and B5–B7, WD §13's S7 row,
SB §0 amendments 3 and 4, SB §9 risk 13, ERRATA 9, 10.
**Code:** `src/film/world.ts` — `buildCliffWorld` and `miniWorld` (by name; **the cairn and planted
mushrooms are already built and already the shot**), and the roads / river / fields that sit
**outside** `miniWorld` today.

**Deliverable.**

- **Flagship 4, the tended rim** — cairn + planted mushrooms, already built; **restaged on the S1
  angle-echo** and held 0.8 t on the hard cut, re-surfaced to v2. **The erased scorch-ring** beside
  the cairn is eraser ghost 4, **sited in B2, not B1.**
- **The miniature world becomes a real miniature** — houses, trees and massif re-surfaced, fields
  painted, **water as bare paper with a drawn edge** plus the water class's one funded pigment band
  with tangent-aligned lit dabs. **Not a desk, not a table of plates.**
- **Painted god-ray cones** in `rayGold`: **drawn edge lines, dab-textured fill, a hard stop —
  never a soft alpha falloff.** SB risk 13: they are **one gradient-wash accident from violating
  the no-smooth-masses gate.**
- **The rise's `DEPTH_TIGHT`** in and out inside one breath, and the **t62 straight-down** — legal
  because the frame's content is the finished map (SB §0 amendment 3; there is **no DOF pass**, the
  depth-to-paper ramp tightens instead — ERRATA 10).
- **Hatch retirements by name:** the **cliff cracks** → painted value-break fractures · the
  **scorches and trample** → **gone with the remains** · the **massif** → reserved-paper snow +
  3-tier rock · the **water** · the **field till** → painted field washes.

**Extra gates.** `window.__draws()` ≤ the ribbon's ceiling at B1, B2 and B7, recorded.
`figure.check` on B1 and B2 registered. `bake.check`.

**Must NOT touch.** The flatten — **P32 owns it, and this prompt authors nothing that assumes it.**
No `seamX` anywhere in S7.

**Walkable state.** S7's art is v2 and the world still stands up; the flatten is still v1's
`stagger:` cascade.

## P32 · S7 — the flatten ★

**Size:** 3 days. **The site's most-scrubbed moment.**

**Read:** the standing contract, plus SB §3-S7's **flatten mechanism section — decided there, not
in the build** — and B4, WD G7 (whole), MM §10.7's flatten paragraph, SB §9 risk 4, ERRATA 5, 24;
**P19's published UV rects.**
**Code:** `src/film/timeline.ts` — **`stagger: 0.05`, the last `stagger:` in the film** (by name) ·
`src/film/stages/trilayer.ts` (P8's `uTriFlat` / `uTriFlatUv`) · `src/film/stages/rigs.ts` (the
practicals' third factor) · `src/film/world.ts` (`miniWorld` and the roads / river / fields).

**Deliverable.**

- **Everything flattens.** Roads, river and fields join `miniWorld`'s lie-down, **closing the v1
  split.**
- **G7's construction, and nothing else is legal:** each flattenable prop's trilayer runs
  **`uTriFlat` 0→1, mixing the class albedo to its slice of the board bake, while the same tween
  runs `scale.y → 0.02` and settles rotation.** One timeline, one direction of travel, no branch.
  **Because nothing is instantiated or removed, reversing is the identical tween running
  backwards** — the only construction under which the site's most repeat-scrubbed moment is
  flawless in both directions.
- **Twelve merged groups, x-keyed by `FLATTEN`:**
  `offset = (originX − FLATTEN.x0) / FLATTEN.xSpan × FLATTEN.spread`, nearest at t60.00, farthest
  at t60.90, all complete by t62.00. **Driven from one timeline position, with no callbacks and no
  `stagger:`** — a computed offset is a *position* and a stagger is a *behaviour*; **positions
  reverse.** **This retires the film's last `stagger:` and deletes its A5 allowlist row** (§0.4).
- **`rig.seamX` is parked at `SEAM_PARK` for the whole of S7.** The frontier *look* is authored
  into the flat ramp through the shader's existing `triDabN` noise. Driving the flatten off `seamX`
  would render the standing miniature world graphite and **flip the world's east half to Prep in
  one frame at t60** — the seam can only *add* Prep east of the line (ERRATA 5).
- **Each group's `uTriFlat` also scales its own practicals** — S7-B4's glow death rides
  `uTriFlat`, **not** the curtain (D-15; during the flatten `curtain` is 0, so `(1 − c)` is 1 and
  the glow would never die).
- `die2`, the throw, the 20 filling frame.
- **The cliff flattens last** and he rides it down in the final half-beat. **He touches nothing:
  this is the one change he does not make by hand, because it is not a change — it is the file
  being closed.**

**Extra gates.** **A5: the film now contains no `stagger:` at all**, with the row gone. **Per-mesh
census exactly 13** (12 flatten groups + `die2`). `figure.check` on B1 and B2 **with B6's
registered exemption row** or the check fails the throw at 390 px — *`die2` is the actor; he is
deliberately under the floor because the handover means the camera leaves him*, and **his last
floor-compliant acting beat is B2's straighten.** **★ HUMAN, §15.2 step 7:** the flatten at t60–62
at **flick speed, both directions, three times** — the twelve groups keep their x-order in reverse,
**nothing is created or destroyed at either end**, and **each vignette's practical dies with its
own group, not with the curtain.**

**Must NOT touch.** No `seamX` anywhere in S7. **Nothing may be created, destroyed, swapped or
spawned during the flatten. Everything leaves frame by growth or by tween, never by despawn.**

**Walkable state.** S1–S7 are v2. The film reaches the board.

## P33 · S8 — The Table ★

**Size:** 2–3 days.

**Read:** the standing contract, plus SB §3-S8 (three beats), SB §5.2 (**the endcard, copy-spec
direction C, verbatim**), SB §5.3 (the CTA's four states), SB §5.4, SB §4-7 (the morph), WD §12,
`docs/copy-spec.md` direction C, MM §6.5, MM §9.2's board-breath row, MM §5's focusable inventory,
SB §9 risk 15, ERRATA 18 and 19.
**Code:** `src/film/world.ts`'s `board` group (`GridHelper` + `boardFill` + the rule loops, by
name) · `src/film/timeline.ts` (the board traversal — **per beat, never per frame** — and the
endcard's four shipped tweens, already branched on `reducedMotion`) · `src/App.tsx`'s `#endcard`
subtree · `src/styles.css`'s `.halo` · **P19's bake.**

**Deliverable.** The board group carries **the real bake**, retiring the `GridHelper` + `boardFill`
placeholder while keeping the group's material-locality and opacity-fade contract. **The morph:**
the d20's 20-face fills frame edge to edge by t64.5, the board's materials fade up beneath it with
`BOARD_WASH` settling at 0.5, the die settles with one 0.15 bounce and exits 64.85–65. **No cut —
the promise of the whole film kept.**

**The endcard is copy-spec direction C, verbatim and unchanged:** wordmark → tagline → subline →
CTA, lettered **directly on the board. No box, no card, no wash, no drawn border, no drop-shadow
smudge, no rotation on the stack.** **Knockout instead of a box:** the tagline and subline each
carry a per-glyph paper halo — eight `text-shadow` layers in `--paper`, four at 6 px blur and four
at 12 px. **The grid must not read through any letterform, and no rectangle does the work.** The
endcard "meta line" **retires** (ERRATA 18) and **the carpenter's pencil does not appear here**
(ERRATA 19 — its two appearances are the Cover and S6-B1; its language survives only as the CTA's
hand-redrawn offset border).

**The © line, which the draft's ban on "anything below the endcard" accidentally forbade.**
SB §2 and §5.2 both require **`© 2026 Good Goblin`, Quiet Serif, 4% ink, in the endcard's bottom
margin — "the only footer".** It is built here, and the ban is worded correctly below.

**The endcard wordmark, adjudicated.** MM §5's inventory makes it *"a real `<a href="/">` (Home)"*
and the same section closes with *"Five focusable elements. That is the whole list"*, which P15's
utility is built against. **Ruling: the wordmark is art, not a link** — a Home link on the page
that *is* home is a link to itself. It carries `aria-label="Good Goblin"`, stays out of the tab
order, and **the five-focusable list stands unchanged.** SB §3-S8-B3's **once-per-session ear
perk** survives as a decorative pointer behaviour, guarded by
`@media (hover: hover) and (pointer: fine)`.

**The CTA performs the film's one taught rule.** Rest: graphite outline, opaque paper fill, 2 px
ink border, a **second border offset 2–3 px, rotated 0.4°, at lower opacity**, boiling ≤0.8 px.
Hover **and `focus-visible` identically**: amber blooms through the letterforms **from the
pointer-entry side** over `T_BLOOM_CTA` (0.18 s) **as a GSAP tween on the JS side** — 0.18 is not
in the CSS lane's three values and **the check is not widened** — with **the contact shadow
arriving beneath alongside the colour**, the offset border re-inking 0.4° → 0.9°, and the fill
inverting. Press: fill deepens to ink, 2 px settle. Click: `DISCORD_URL` in a new tab,
`rel="noopener"`, and **the die beside the wordmark rolls once to 20.**

**`BOARD_BREATH` as `board.scale.setScalar(...)` about its own centre — never a camera write.** A
per-frame `camera.position` write after the pull-back's idempotence check makes the
authored-vs-applied compare false every frame, and the portrait pull-back multiplies into it.
**Extend A1's state vector with `board.scale`** here. The board carries **faint edge-handling
wear** and no pentimenti — *contrast and product truth outrank the theme at the conversion surface.*

**Extra gates.** **Per-mesh census exactly 1** (the board group). A12 (`#endcard.inert` at t64.9 and
t65.1). **★ HUMAN, SB risk 15:** the halo system and `BOARD_WASH` verified against the **final**
bake at 390 px **and** 1920 px — they were tuned against an empty grid, and a fully painted map
underneath is a harder knockout test. **The wash may need to rise; it may not fall.** Endcard
clamps are copy-spec law: stack 88vw under 500 px, wordmark 76vw, subline caps to two balanced
lines, **halo contrast ≥4.5:1 verified at 390×844**. Play swaps to **replay at t64.5**; play mode
ending at the endcard moves focus to the CTA politely (`preventScroll`, no jump).

**Must NOT touch.** No second CTA, no waitlist, no feature list, no backend, no analytics.
`DISCORD_URL` stays the single wired constant, and **if it is unset the button does not render.**
**Nothing renders below the endcard except the © line.**

**Walkable state.** The film is complete end to end.

---

# ACT 5 — THE FALLBACK AND THE GATE

## P34 · The Picture Book ★

**Size:** 3 days.

**Read:** SB §6's *The Picture Book* table (the eight compositions), SB §8's *Failure and
interruption*, MM §12.8, WD §4's accessibility / SEO split.
**Code:** `src/posterBake.ts` · `src/App.tsx` (the mount path) · `src/main.tsx`.

**Deliverable.** **Eight painted frames** — one per stage, baked at the compositions SB §6 names:
S1-B3 the volley at the rim medium · S2-B3 the flagship address with the erasure · S3-B3 the
lantern held wide with the tide-line at its foot · S4-B5 the flicker's held frame with the arcs ·
S5-B4 the frozen room with the goblin crossing it · S6-B1 the road · S7-B4 mid-flatten · S8-B3 the
endcard at rest.

**Eight bakes are owed, not seven.** MM §12.8 and the draft both said *"frame 1 is already a
first-class artifact"* because `posterBake.ts` bakes the hero poster today — but **SB §6's table
makes S1's frame B3, the volley at the rim medium.** The Cover poster is a different composition of
a different stage. It stays as the OG image; it is not frame 1.

Rendered as **the same page in plain scrolling HTML with the eleven captions and the full endcard —
same story, same CTA.**

**Detection:** a `webglcontextlost` listener **plus a constructor-level probe before mounting the
Canvas.** Context lost **once** → silent restore at the nearest rest anchor. Context lost twice, or
WebGL unavailable → the Picture Book. **There is no degraded 3D path — a half-working film is worse
than a good book.**

**And it is the OG / share / SEO surface**, which is why it is a real page and not an error state.

**Acceptance gates.** **§15.2 step 17:** WebGL off — eight frames, **eleven captions**, the
endcard, the real link; then force a context loss once and confirm silent restore at the nearest
anchor. **A8's SR assertions hold on the fallback page too.** Reload mid-film resumes at the
nearest anchor, **never a raw offset**, so every restored frame is a composed one. **★ HUMAN:** the
eight frames read as a story in order, at 390 px.

**Must NOT touch.** **No spinner exists anywhere on this site, including here.**

## P35 · The gate ★

**Size:** 2–3 days.

**Read:** MM §15.2 (all eighteen steps, **in order**), MM §15.1 (A1–A13), MM §17, WD §16, SB §9
(all seventeen risks, as the list to sign off), GD §14 (CLASS G **and CLASS P**).
**Code:** everything. `package.json`'s `check`.

**Deliverable.** MM §15.2's eighteen-step walk, run in order, with a **written record per step
naming what was looked at** — *because saying "verify it feels right" without naming the frame is
how a gate becomes a formality.* Plus:

- **`pnpm check` green on all seventeen scripts:** the thirteen shipped (`framing`, `pencil`,
  `die`, `puppet`, `curtain`, `island`, `motion`, `clocks`, `gearing`, `rigs`, `hero`, `hero-life`,
  `gob`) plus `figure`, `draws` (G half), `bake` (G half) — **and `walk` (A1), run three times.**
- **Every standing table clean:** the A4 and A5 allowlists are **empty**, `figure.check`'s beat
  table covers every `A`-flagged beat in SB §3, and `draws.check`'s camera table covers every stage.
- **The CLASS B numbers, re-taken at the gate:** `window.__draws()` ≤120 at every registered
  camera, `window.__bakes()` ≤12 ms per bake and ≤140 ms total, and the byte census at 47.9 MB.
- **GD §14 CLASS P re-run** — `window.__gob(w, h)` at 390 / 500 / 768 / 1440 plus the 6× zoom,
  Prep-rig and seam-birth walks. **CLASS G is not CLASS P, and `pnpm check` only runs the former.**
- **Zero `hatch(` / `crossHatch(` call sites left in `world.ts`** — all 31 retired by name
  (ERRATA 8). `hatch()` and `crossHatch()` then **delete from `pencil.ts`**, along with the
  `curtain.ts` shader's near-black hatch accent.
- **The four art gates of WD §16, applied to the finished film** — this replaces the draft's
  "art-style guide", which gates on a document that **does not exist anywhere under `story/`** and
  which §6 below and WD §0 and §16 all say the project deliberately does not have:
  1. **No hatch anywhere** in the film.
  2. **`NoToneMapping` is the judged transfer** — every art verdict taken flat.
  3. **No smooth Lambert masses, no ruled analytic stripes, no default primitives, no gradient
     washes.**
  4. **Palette by token only** — a grep proves no colour literal outside `palette.ts`.
- **The impeccable pass** on the built UI.
- **Zero console errors on a full walk in both directions, on the dev grid and on a real phone.**
- **Every one of SB §9's seventeen risks signed off** as closed, mitigated, or accepted with a
  reason.

**★ HUMAN. This is the ship gate.**

---

## 4. THE REVIEW CHECKPOINTS

**Twenty.** Each is a browser review on the dev server at **http://localhost:5180** — which is
already running on **PID 17556** and **must never be killed or restarted.**

| After | What the human is looking at | Why it cannot wait |
|---|---|---|
| **P0** ★ | The rebuilt figure at 390 px on paper, on the blackout, and inside a Prep freeze | Act 3's first stage is judged on a lit goblin. A night stage judged on a v1 surface is not judgeable, and S1 gets built twice. |
| **P3** ★ | Three marks at 390 / 768 / 1440, on class-albedo surfaces, at solved cameras | Decides whether S2, S4 and S5 are staged as authored or **re-sited**. |
| **P9** ★ | Five frames stepped both directions across the t20.55 switchover | SB risk 2. If the flip shows, the whole S3 construction is wrong and nothing after t20.55 is safe. |
| **P10** ★ | The portrait build on a real phone | MM §8.6: *"not scriptable — whether the portrait framing is good."* |
| **P12** ★ | One set-scale island rim, all breakpoints, plus the G5 prepass fix | The grammar every one of the twelve island cards inherits. |
| **P15** ★ | Keyboard-only walk; focus ring on paper, on the blackout, on the board | MM §5.1: not scriptable. Focus visibility is a hard gate. |
| **P17** ★ | The eleven letterings written on and un-written; the Cover after the font reassignment | The film's voice, and the only prompt that touches shipped, verified Cover files. |
| **P18** ★ | Six board elements at 512², flat, at 390 px | The film's whole bet, given an **early** verdict instead of a late one. If the vocabulary fails here, P19 must not start. |
| **P19** ★ | The full board bake at 390 and 1920, flat transfer | SB risk 1: *"budget it like the hero; it will eat iterations."* |
| **P20** ★ | S1's night at flat transfer | SB risk 5: *"Night on a paper page is unproven… judge at the first S1 walk, no grading escape hatch."* |
| **P21** ★ | Flagship 1 at 390 / 768 / 1440 | The film's first evidence beat and its first authored framing. |
| **P24** ★ | The ribbon's rim, the merged flora stand, the void hop both directions, **and the measured draw number read aloud** | The ceiling every later stage is measured against. A breach found after seven prop stops are built on it costs P25 entire. |
| **P25** ★ | The lantern, the frontier's tide-line, S3-B3 at 390 px | The thesis image, and the flush QA'd at the width that decides it. |
| **P26** ★ | The disc at flick speed, both directions, three times; flagship 2 | MM §15.2 step 7 — one of the two must-be-flawless-both-ways moves. |
| **P28** ★ | The frozen room with G6's three graphite figures and one painted goblin | **G6 is the shot.** If it does not read here it does not read anywhere, and eight beats would be built on it. |
| **P29** ★ | The walk-through's three named QA cases; flagship 3; the full-puppet nudge | SB risk 7: *"the most fragile transition in the film."* Risk 10: the nudge replaces the film's best v1 animation. |
| **P30** ★ | The six page turns backward, one notch at a time | SB risk 17: *"a drifted pair is an invisible bug until someone scrubs backwards."* |
| **P32** ★ | The flatten at flick speed, both directions, three times | The site's most-scrubbed moment (risk 4) and the second must-be-flawless move. |
| **P33** ★ | Endcard contrast on the final board, 390 and 1920 | Risk 15: *"the wash may need to rise; it may not fall."* |
| **P35** ★ | The ship gate | MM §15.2's eighteen steps, CLASS P, the impeccable pass, WD §16's four art gates. |

**Two checkpoints the draft did not have, and why they are here:** **P24** and **P28**. Both were
the densest, highest-risk prompts in their pair and both were judged only after another 3–4 days of
work had been stacked on top of them. **P18** is also new — the early half of the board bet.

---

## 5. THE SCOPE LEDGER

Everything the doc set assumes exists, mapped to the prompt that builds it. **A row with no owner
is a bug in this sheet.** Sources: ERRATA Part 2's does-not-exist list, plus the items the
adversarial pass found uncovered.

### 5.1 Mechanism and state

| Thing | Owner |
|---|---|
| The ten motion tokens (`PAIR_GAP`, `T_NUMERAL`, `T_FLUSH`, `T_REST`, `T_STEP`, `T_SKIP`, `T_REPLAY`, `T_CURSOR_HIDE`, `BOARD_BREATH`, `FLATTEN`) | **P4** |
| `SEAM_PARK` | **P4** |
| The ten §2.4 micro-constants (`TRACK_TAU`, `PAR_DUR`, `SCRITCH_TAU`, `PERK`, `BLINK`, `SCRITCH`, `DEPTH_SHOT`, `DEPTH_TIGHT`, `WRITE_STAGGER`, `WHISPER`) | **P4** |
| The pair-authoring rule and A11's `− PAIR_GAP` form | **P4** |
| A5's ban bank, including the backtick relative form | **P4** |
| The frame-rate fix on the third damped lerp | **P4** |
| `walk.check.ts` / A1 and its state vector | **P5**, extended at **P8** and **P33** |
| A2, A3, A4, A6, A7 and the three standing tables | **P5** |
| The seven relative→absolute conversions; `repeat: 11` | **P6** |
| `rigs.ts` wired into the film; the v1 rig retired | **P7** |
| The three chapter-family key presets (`KEY_I_NIGHT`, `HEMI_I_NIGHT`, the +38° interior) | **P7** |
| `key.target` tracking `world.look` | **P7** |
| Shadows on, `shadowMap.autoUpdate = false`, per-frame `needsUpdate` | **P7** |
| **MM §9.3's per-shot depth ramp wire-in** (`depthNear/Far` from `camera.position.distanceTo(world.look)`) | **P7** |
| `prmAmbient()` called per frame; module-scope `AMBIENT` deleted (D-3) | **P7** |
| The three D-14 comment rewrites | **P7** |
| The three-slot practicals array and its one expression | **P8** |
| **The ladder's step-7 `collapsePracticals()` helper** | **P8** |
| `lightC` **and its tracking tween beside every existing curtain write** | **P8** |
| `uTriFlat` / `uTriFlatUv` wired, with `triDabN` on the flat mix | **P2** (spike) → **P8** (wired) |
| The rig-side board-atlas sampler slot | **P8** (declared) → **P19** (filled) |
| The banked-idle registry (cap 20) and its five shippable sites | **P8**; ten more with their stages (**P25** ×3, **P30** ×3, others as staged) |
| The S3 state schedule; `T_EXHALE` at t30; the three-objects comment | **P9** |
| `buildTimeline(..., { prm, portrait })`; the rebuild recipe; the PRM branch table | **P10** |
| `portraitLook` on every `A` beat | each stage prompt, per the standing contract |
| The portrait track (~950vh) | **P10** |
| `GOB_SCALE` → `HERO_GOB_SCALE` split | **P10** |
| The four remaining verbs (`hop`, `hang`, `plantAndPat`, `touchUp`) | **P13** |

### 5.2 Checks and measurement

| Thing | Owner |
|---|---|
| `window.__draws()`, `window.__bakes()`, `window.__frames()` | **P1** |
| **The reference frame set P7's honesty gate compares against** | **P1** |
| `figure.check.ts` (CLASS G, table-driven) | **P10**; rows by each stage |
| `draws.check.ts` (G half + B half) | **P11**; cameras by each stage |
| `bake.check.ts` (G half + B half) | **P11**; slots by each stage |
| `surfaces.ts` — the fixed material registry | **P11** |
| The bake slot table and the G2 stage-ahead schedule | **P11** |
| The tier measurement and the seven-step ladder | **P11** |
| Texture upload gating, and **the ruling that retires the KTX2 stream** | **P11** |
| **`will-change` on interaction start, removed on settle** | **P11** |
| The Pass A number (S1/S2) and the ladder decision rule | **P22** |
| **The Pass A re-measure on the ribbon, where D-12's threshold lives** | **P24** |
| CLASS P (`window.__gob`) gate run | **P0**, re-run at **P35** |

### 5.3 The page and the interface

| Thing | Owner |
|---|---|
| `#margin`, the whisper/breathe, the chapter numeral | **P14** |
| The 66-tick ruler (one path, one tween) | **P14** |
| **`#rail`'s retirement — element and CSS** | **P14** |
| **The film-side stall note** (`sharpening pencils…`) | **P14** |
| `#film-skip` and its focus-rescue branch; A12's skip-note clauses | **P14** |
| **The cursor system (MM §4.1)** and `user-select: none` on captions | **P14** |
| The SR document, `#sr-skip`, the canvas `aria-hidden` | **P15** |
| Tab order: `#play` above `#overlay` | **P15** |
| The drawn double-line focus rectangle; the `mix-blend-mode` move | **P15** |
| Guarded `:hover` and the `:active` states | **P15** |
| `#endcard-cta` dead-link fix; `inert` on `#endcard`; `CTA_IS_LIVE` gating | **P15** |
| The play/replay label off `scrollY` | **P15** |
| The seventeen rest anchors and the keyboard map | **P15** |
| Touch soft rests | **P15** |
| PRM play mode stepping anchor-to-anchor (D-16) | **P15** |
| D-7 reload/resume | **P15** |
| A12's `inert` and play-label clauses | **P15** |
| The eleven SVG caption shells, write-on, un-write, the 17-entry flush LUT, the 24% `me*` band, A8 | **P16** |
| The eleven authored letterings + the endcard tagline | **P17** |
| **Metamorphous retired** across `.caption`, `#play`, `#hint` and the two Cover elements; dependency dropped | **P17** |
| **`#hint`'s voice — Quiet Serif, adjudicated** | **P17** |

### 5.4 Art, props and assets

| Thing | Owner |
|---|---|
| **The goblin's surface rebuild — GD §13 steps 1, 2, 3, 4, 5, 8** | **P0** (the in-flight workflow; gated here) |
| The set-scale island card, grid ghost, travel line, particle language, G5 | **P12** |
| The flora kit's ten items, merged per class | **P23** |
| `bakeBoardMap()` and the twelve UV rects | **P18** (study) → **P19** (bake) |
| S1: rock kit, light kit, cast tier, keeping props, cloud/ember flats | **P20** |
| **`cliffSet`'s 16.5 → 16.9 NEW MARK** | **P24** |
| The void hop | **P24** |
| S3's seven prop stops and their surfaces | **P25** |
| **The hand lantern** (carried, hero tier) | **P25** |
| The sign-letter and mushroom-gill hatch retirements | **P26** (with the props they belong to) |
| Theatre machinery, the scribed arcs, the snow flat | **P26** |
| The tavern room, the DM screen's 256² bake, the benches, the shelf | **P27** |
| **The spill-drop prop** (2 droplet flats + splash decal) | **P27**; its fall tween **P29** |
| The cast of six; the window view set; G6 | **P28** |
| **S5-B2's DM throw** (the authored arm-swing at 37.9–38.2) | **P29** (on the joint **P28** builds) |
| The die's jewel treatment; the mug rings; eraser ghost 3 | **P29** |
| The six islets, the monster repaint, the based miniature | **P30** |
| **S6-B1's keeping props** (map sheet, quill, inkpot, 2 weight stones) | **P30** |
| **S6-B6's candle table and book** | **P30** |
| The brush + pigment pot | **P30** |
| Flagship 4, the miniature world, the god-ray cones | **P31** |
| The twelve flatten groups; the last `stagger:` removed | **P32** |
| The board group carrying the real bake; the endcard; the CTA | **P33** |
| **The © line** — `© 2026 Good Goblin`, Quiet Serif, 4% ink | **P33** |
| **The endcard wordmark's ear perk** (art, `aria-label`, not focusable — ruled in P33) | **P33** |
| The Picture Book's **eight** frames (not seven) | **P34** |
| `hatch()` / `crossHatch()` deleted from `pencil.ts`; the shader's hatch accent | **P35** |

### 5.5 Rulings this sheet makes, so nobody re-opens them

1. **`#rail` dies** (P14). The film ships one progress indicator and it is the authored one.
2. **The endcard wordmark is art, not a link** (P33). Five focusables stands.
3. **`#hint` speaks in the Quiet Serif** (P17), matching the skip note it is a sibling of.
4. **The film ships no streamed textures** (P11). MM §12.5's prefetch-by-proximity and §14.4's
   9 MB KTX2 budget retire; every surface is an in-code canvas bake.
5. **There is no `docs/art-style-guide.md`** (P35). The ship gate is WD §16's four art gates plus
   the census and budget checks.
6. **The `0xffb45e` light is swapped, not deleted** (P7). No frame in the film loses its fire.
7. **The Picture Book owes eight bakes** (P34). The Cover poster is not frame 1.
8. **ERRATA 29's "±2" claim is struck** (§0.1). `timeline.ts` and `curtain.ts` join the by-NAME
   rule; the measured drift is ~10 lines from `timeline.ts:900` and `curtain.ts:440` onward.

---

## 6. WHAT THIS SHEET DELIBERATELY DOES NOT SCHEDULE

Named so nobody schedules them by accident.

- **No art bible, no external asset sign-off gate, no forge or image-generation pipeline.** The
  build authors its own final art, in code, in this repo. *Any plan that reintroduces a generation
  run or an approval gate before a surface may be painted is wrong on its face.* **And no
  `art-style-guide.md`** — the file does not exist, the category is denied by WD §0 and §16, and
  P35 gates on the four concrete art gates instead.
- **No `seamDir` promotion.** DECLINED (SB §0 amendment 2); its budget is already spent on P8's
  practicals, so the rig/shader extension count is net-neutral.
- **No DOF pass.** There is none in `story/src` and the experience doc budgets one post pass. The
  two beats that wanted it get the depth-to-paper ramp tightening instead (ERRATA 10).
- **No KTX2 chapter stream and no prefetch-by-scroll-proximity.** Retired by P11's ruling — there
  is no asset to stream.
- **No `DISC_SMOOTH`, no `T_REST_DETECT`, no tier re-evaluation at t≈20, no CSS flush ramp, no
  `BOARD_BREATH` as a camera move, no eighth camera class, no global focus utility.** MM §16.2
  cuts all seven with reasons.
- **No goblin *redraw*.** GD is LOCKED and steps 6 and 7 are DONE; gate G8 is CLOSED. **But the
  surface rebuild — steps 1–5 and 8 — is real, owned by the in-flight workflow, and gates Act 3.**
  It is out of *this sheet's* build scope, not out of the project's.
- **No re-timing.** `t = 66` and `gearing.ts:44–54` are fixed. Every prompt restages art, never
  time.
- **No fifth flagship, no twelfth caption, no eighth transition, no third clock, no second post
  pass, no fifth eraser ghost, no seventh S6 vignette, no chest vignette** (ERRATA 17).
- **No new dependency and no Playwright**, anywhere, at any point.
- **No `InstancedMesh`.** Not a budget decision — the shader would break.







