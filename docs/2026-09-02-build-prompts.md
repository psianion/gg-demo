# THE CALL SHEET — sequential build prompts for the Good Goblin story v2

2026-09-02 · senior frontend / 3D web engineering plan
Companion to: `2026-09-02-3d-site-creative-direction.md` (THE UNDERDRAWING), `2026-09-02-experience-design.md` (THE PROJECTIONIST'S SEAT), `2026-09-02-hero-design.md` (THE HALF-ALIVE ISLAND), `2026-09-02-motion-system.md` (THE TWO CLOCKS).

This document is the build plan expressed as **18 paste-ready prompts (P0–P17)**, one per work session, in dependency order. Each prompt inspects before it edits, tests what it builds, and leaves the site runnable. Nothing here runs until the plan is approved.

---

## 0. How to run this document

- **One prompt per fresh session, in order.** Paste §1 STANDING ORDERS first, then the prompt. Sessions are sized to the one-hour cap; if work overruns, the session stops at a clean seam and writes a handoff note instead of pushing through.
- **★ marks a review checkpoint** — Nayan walks the result in the browser before the next prompt runs: after P5 (hero), P7 (first chapters), P10 (die beat), P12 (full film), P17 (ship gate).
- **Suggested runners** (per the established routing): Sonnet for inventory and straightforward exec (P0, P6–P9, P11, P13–P16); Fable or Opus for novel systems and the centerpiece (P1–P5, P10); Opus for the final review pass (P17). Any prompt may also run as a contained workflow (≤5 agents) when its checklist parallelizes; the chapter prompts are inherently serial.
- **Spec precedence when docs disagree:** copy-spec.md (words, locked verbatim) > motion-system (it adjudicated last) > hero-design (it amended its siblings) > experience-design > creative-direction. Do not re-litigate settled adjudications; the motion doc §2 lists them.
- **Scale note:** t is film time, 0–66 (RUNTIME=66). Stage boundaries from the beat sheet: t10.2 / 16.5 / 26.5 / 36 / 50 / 57.5 / 64.5.

> **AMENDMENT — 2026-09-02, Nayan, mid-build (during P3).** v2 is a redesign: only the
> vision and the story/narrative carry over from v1. There is **no art bible**, **no
> asset sign-off gate**, and **no forge/ComfyUI pipeline** for v2. The build itself
> authors final art — lettering, textures, the hero composition, the wordmark — to the
> bar of the v2 spec docs (which remain binding). Every line below that gates work on
> "art bible", "approved forge run", or asset "sign-off" is superseded by this note; the
> asset/texture contracts (ASSETS.md, TEXTURES.md) carry the amended statuses. The ★
> checkpoints stand as browser reviews of the built experience. The v1-era art docs
> (art-direction.md, color-script.md, puppet-spec.md, skeleton-spec.md,
> pencil-detail-plan.md) are reference only, not binding; story.md and copy-spec.md
> (the narrative and the locked words) still bind.

---

## 1. Standing orders (paste into every session)

```
STANDING ORDERS — Good Goblin story v2 rebuild. These bind every session.

CONTEXT
- App: story/story (Vite 8 + React 19 + R3F 9.7 + three 0.185 + GSAP 3.15 + Lenis 1.3.26,
  TypeScript 6). Dev: `npm run dev` → port 5180 strictPort. A dev server may already be
  running — check before spawning; never kill a process without confirming what it is.
- Spec: story/docs/2026-09-02-{3d-site-creative-direction, experience-design, hero-design,
  motion-system}.md. Precedence on conflict: copy-spec.md (locked words) > motion-system >
  hero-design > experience-design > creative-direction. The older docs (story.md,
  copy-spec.md, art-direction.md, color-script.md, puppet-spec.md, skeleton-spec.md,
  pencil-detail-plan.md) are the locked script and v1 art references.
- v1 code map (line counts at rebuild start): src/film/world.ts 4476 · timeline.ts 1033 ·
  pencil.ts 601 · actions.ts 492 · curtain.ts 435 · Film.tsx 256 · framing.ts 43 ·
  palette.ts 97 · dieGeometry.ts 64 · sculpt.ts 58 · App.tsx 301 · Wordmark.tsx 130 ·
  styles.css 499 · main.tsx 16. Checks: scripts/*.check.ts run by `npm run check`.

DISCIPLINE
- Inspect before editing. Read every file you will touch, in full, before the first edit.
  Never guess an API that is one file away. world.ts is a monolith: new scene work goes in
  new modules (src/film/stages/…); extract from world.ts, never append to it.
- Preserve working functionality. At session end: `npm run check` green, `npm run build`
  (tsc + vite) green, dev server renders, ZERO console errors on a browser walk of the
  t-values this prompt names plus the boundaries of everything built by earlier prompts.
- Browser-walk gotcha: after page load the first scrub can render stale/black — issue one
  full scroll pass and force a render before judging any frame.
- Tests follow the house idiom: plain node assert scripts (scripts/<name>.check.ts,
  --experimental-strip-types), registered in package.json "check". One runnable check per
  non-trivial module; no test framework.
- Every non-obvious walk finding gets screenshotted to story/docs/build/walks/<prompt>/.

ART GATES
- NO HATCHING, ever, anywhere. Sketch marks only inside near-black shadows. Lit surfaces
  are smooth Lambert paint.
- Committed color tokens: paper #F7F5F0, ink #222222 (palette.ts is source of truth).
  Amber #F2C35E is the only glow accent; goblin green is goblin-only; #B6D648 wordmark pip
  only. No cream/parchment drift — neutrals stay near-zero chroma.
- Textures: NO forge/ComfyUI generation without in-the-moment approval. Build with neutral
  placeholders against the texture contract (story/docs/build/TEXTURES.md) and flag slots.
- Hand-lettered caption artwork and the art-bible hero board are sign-off gated: build the
  pipelines with placeholder assets and record the asset contract.
- Captions and endcard copy come from copy-spec.md VERBATIM. Goblin v2 design is locked.
- User-facing UI surfaces get the impeccable pass (load the impeccable skill when a prompt
  touches DOM UI: CTA, margin band, loader, endcard, fallback page).

GIT / OUTBOUND
- story/ is untracked; v1 is archived at story/story-v1/ (P0). Do not commit, push, PR, or
  publish anything without Nayan's explicit in-the-moment approval. Never commit to main.
- Zero AI/assistant/model mentions in anything that could leave this machine.
- DISCORD_URL stays '#' in dev; the production-build guard (P12) must fail the build on '#'.

BUDGET
- ~1 hour per session. Overrun → stop at a clean seam, write story/docs/build/HANDOFF.md
  (what's done, what's mid-flight, exact next step), end.
```

---

## 2. The stage map

| # | Name | Builds | Main spec inputs | Exit gate |
|---|------|--------|------------------|-----------|
| P0 | Recon & safety net | v1 archive, code map, baseline walk | all docs §guardrails | v1 green + archived, RECON.md |
| P1 | Foundation | tokens, fonts, motion tokens, clocks, gearing, Lenis/DPR fixes, dev HUD | motion §3–§5, §15; direction §4–§5 | checks green, film unchanged visually |
| P2 | Island & trilayer kit | island base, trilayer material, tick/drain recipes, grid watermark | direction §3, §7, §10; motion §12 | island sandbox flips both ways |
| P3 | Two lighting rigs | Performance rig, Prep rig, alive-shadow rule, flicker on tokens | direction §8; hero §5; motion §14 | rig sandbox A/B + seam blend |
| P4 | Hero I — the scene | half-alive island, seam, goblin+pencil, split rigs, camera, type block | hero §1–§7 | static hero matches comp, 4 breakpoints |
| P5 ★ | Hero II — life | loader/entrance, mouse system, first-scroll handoff, poster bake | hero §8–§10; motion §6, §13 | full entrance+handoff both directions |
| P6 | Margin & captions | margin band, numeral, 66-tick ruler, skip note, Hand + serif reveal systems | direction §4, §6; experience §4; motion §8 | caption sandbox + one live beat migrated |
| P7 ★ | Stages 1–2 (t0–16.5) | THE CLAIM + THE ADDRESS rebuilt on the kit | experience §6 S1–S2; motion §9 | walk t0→18 both directions |
| P8 | Stage 3 (t16.5–26.5) | PROOF OF LIGHT, walk-through transition | experience §6 S3; motion §12 | walk t15→28 both directions |
| P9 | Stage 4 (t26.5–36) | PROOF OF SCENERY, theatre turn | experience §6 S4 | walk t25→37 both directions |
| P10 ★ | Stage 5 (t36–50) | PROOF OF TIME — the die, the tick, the nudge | experience §6 S5; motion §12 tick | walk t35→51, tick timing verified |
| P11 | Stages 6–7 (t50–64.5) | THE MANY JOBS + THE HANDOVER, page turn, flatten payoff | experience §6 S6–S7 | walk t49→65 both directions |
| P12 ★ | Stage 8 + endcard (t64.5–end) | THE TABLE, morph, endcard, CTA, dead-# guard | experience §6 S8, §8; direction §12; motion §7 | FULL film walk t0→end |
| P13 | Play mode & input polish | constant-t autoplay, soft rests, keyboard stepping, cursor system | experience §5; motion §6, §9 | input matrix walk |
| P14 | Responsive & touch | breakpoints, margin adaptation, touch model, mobile perf | experience §5.1; hero §13; motion §15 | 4-viewport walk |
| P15 | Accessibility & failure | SR document, reduced-motion picture book, WebGL-fail page | experience §9–§10; motion §14 | AT walk + forced-failure walk |
| P16 | SEO, meta & loading perf | meta/OG, font strategy, KTX2 stream, budgets | experience §10; motion §15; hero §13 | budget numbers measured green |
| P17 ★ | QA walk & ship gate | motion §16 protocol, clarity contract, impeccable polish, ship report | motion §16; experience §11 | report to Nayan; ship only on approval |

---

## 3. The prompts

### P0 — Recon & safety net *(Sonnet; read-only + archive)*

```
Stage P0 of the Good Goblin story v2 rebuild. STANDING ORDERS apply. This session edits no
source files.

1. Archive v1: copy story/story → story/story-v1, excluding node_modules (robocopy or
   xcopy with /XD node_modules). Verify the copy contains src/, scripts/, index.html,
   package.json. This archive is the rollback for the whole rebuild — never touch it again.
2. Verify v1 health: in story/story run `npm run check` and `npm run build`. Record results.
3. Read, fully: src/film/timeline.ts, world.ts, actions.ts, curtain.ts, framing.ts,
   palette.ts, pencil.ts, Film.tsx, App.tsx, main.tsx, styles.css, and all
   scripts/*.check.ts. Produce story/docs/build/RECON.md: for each file, its
   responsibilities, exports, and the seams where v2 systems will attach (tokens, clocks,
   curtain recipes, stage modules). Name every place world.ts builds a scene — that list
   becomes the extraction map for P2/P7–P12.
4. Baseline walk: start (or reuse) the dev server on 5180, walk t ≈ 0, 6, 13, 22, 33,
   44.6, 53, 61, 66. Screenshot each to story/docs/build/walks/p0/. Remember the
   stale-first-scrub gotcha. Note console output — v1's baseline error state is part of
   the record.
5. Create story/docs/build/TEXTURES.md (empty contract table: slot, surface, resolution,
   tiling, status=placeholder) and story/docs/build/ASSETS.md (hand-lettering + hero-board
   slots, status=awaiting art bible).

Exit: archive verified, RECON.md written, baseline screenshots saved, v1 checks/build
status recorded. Report the extraction map summary and any surprises. Build nothing.
```

### P1 — Foundation: tokens, type, and the two clocks *(Fable)*

```
Stage P1. STANDING ORDERS apply. Read story/docs/build/RECON.md, then the motion doc
§3–§5 and §15, direction doc §4–§5, in full, before editing.

Build, in this order:
1. Tokens. Rework src/film/palette.ts into the v2 palette (direction §5): paper #F7F5F0,
   ink #222222, graphite ramp, amber #F2C35E, goblin green, wordmark pip #B6D648. Keep v1
   export names working (alias old → new) so the film keeps rendering while stages migrate.
2. Motion tokens. New src/film/motion.ts: the full T_* duration scale (motion §3.1), the
   three ease lanes as named constants (§3.2 — scrub 'none' / settle power-family / puppet
   lane), micro-motion constants (§3.3). scripts/motion.check.ts asserts: every duration in
   scale, no UI token inside the 0.25–0.4s dead zone, puppet eases never referenced by
   camera/UI modules (grep-based assertion).
3. Fonts. Add @fontsource/vollkorn (Quiet Serif — variable, true italic). Keep Cinzel (CTA
   only). Inspect Wordmark.tsx and styles.css for Metamorphous usage; leave it working —
   its replacement by hand-lettered artwork is P6's asset contract, not today's edit.
4. Clock hardening. Formalize the two-clock architecture (motion §4) without changing
   behavior: master scrub timeline (defaults ease:'none', scrub 0.8) + world.t; gobT
   free-running; freeze = tweened world.timeScale. scripts/clocks.check.ts asserts the
   invariants (RUNTIME=66; tl.set pairs ≥0.02t apart — parse timeline.ts; timeScale is a
   tweened prop, not gsap.globalTimeline).
5. Gearing. New src/film/gearing.ts: scroll↔t map from experience §5.2 (stage shares:
   14/12/16/12/20/8/12/6% against the t boundaries) + exact inverse. scripts/gearing.check.ts:
   monotonic, inverse round-trips to 1e-6, boundaries land on the beat-sheet t values.
   Wire the map into the ScrollTrigger sizing so #track allocation follows it.
6. Engine fixes (motion §2 adjudications): cap R3F dpr to [1,2]; add the missing
   visibilitychange pause to the autoplay rAF; add idle frame-throttle (30fps after 12s
   without input or t-change) with instant wake. Lenis stays pure-default, event-wired,
   lagSmoothing(0), not instantiated under prefers-reduced-motion.
7. Dev HUD (dev-only, ?hud=1): current t, stage name, fps, dpr; keys 1–9 jump to stage
   boundaries. Invisible in production builds.

Exit: `npm run check` (now 8 scripts) and build green; walk t 0/22/44.6/66 — the film must
look IDENTICAL to the P0 baseline (this stage changes plumbing, not pixels); confirm pause
fires on tab hide during play mode. Report any behavior deltas honestly.
```

### P2 — The island world kit and the painted trilayer *(Fable)*

```
Stage P2. STANDING ORDERS apply. Read direction §3 (islands), §7 (trilayer), §10 (depth
languages), motion §12 (tick vs drain recipes), and curtain.ts + world.ts's ground/scenery
builders (per RECON.md extraction map), in full.

Build:
1. src/film/stages/islandKit.ts — the island diorama base: finite ground card with painted
   feathered edge, soft drop shadow onto the page (fades under Prep per hero §2), page
   margin respected (direction §6 four-plane rule). No infinite ground planes anywhere in
   v2; this kit replaces them stage by stage.
2. Trilayer material — src/film/stages/trilayer.ts: paint layer / underdrawing layer /
   edge-wear, driven by one curtain uniform so Performance↔Prep is a material state, not a
   scene swap. Underdrawing = graphite strokes of the SAME forms + construction ghosts +
   battle-grid watermark ≤4% ink under everything. Placeholder textures: flat neutral
   fills + procedural stroke normals are acceptable ONLY as slot-fillers — register every
   slot in TEXTURES.md. NO HATCHING in any layer.
3. Curtain recipes. Refactor curtain.ts to expose the two named freezes (motion §12):
   tick (clock ≤0.15t, curtain 0.35t) and gliding drain (0.5–1.4t). Keep v1's drain()
   callers working via the drain recipe. scripts/curtain.check.ts grows assertions for
   both recipes' timing constants.
4. Depth languages: Performance = fog-to-paper falloff; Prep = line-weight falloff (no
   fog). Implement as rig-side uniforms on the trilayer.
5. Sandbox route (?sandbox=island, dev-only): one island with a few primitives, buttons to
   run tick and drain both directions, scrub-reversibility check.

Exit: checks + build green; sandbox flips Performance↔Prep both ways with no pop, grid
watermark measures ≤4% ink (sample the framebuffer in the sandbox and assert); the film
itself is UNCHANGED (kit not yet wired in). Screenshot sandbox states to walks/p2/.
```

### P3 — Two lighting rigs *(Fable)*

```
Stage P3. STANDING ORDERS apply. Read direction §8, hero §5, motion §14 (reduced-motion
lighting rows) and the current lighting/flicker code in world.ts (per RECON.md), in full.

Build:
1. src/film/stages/rigs.ts — Performance rig: lantern-warm key + amber glow (amber is the
   ONLY glow hue), gouache-lit Lambert look; flicker driven off world.t using the motion
   §3.3 constants (amps 0.18/0.3, freqs 9/13), damped to STILL (not merely reduced) under
   prefers-reduced-motion.
2. Prep rig: flat, shadowless — EXCEPT entities flagged alive (goblin, touched props):
   they keep their shadow. "The only shadow belongs to the alive." Implement as a
   per-entity alive flag consumed by both rigs; markAlive stays permanent once set.
3. Seam blending: both rigs active simultaneously, blended by the same curtain/seam
   uniform as the trilayer, so a half-alive scene (hero) lights each half correctly with
   one draw philosophy.
4. Extend the sandbox: rig A/B toggle + a seam-sweep slider; verify goblin shadow renders
   on the Prep side while nothing else casts.

Exit: checks + build green; sandbox demonstrates both rigs + seam blend + alive-shadow
rule; PRM query flips flicker to still frames. Film unchanged. Screenshots to walks/p3/.
```

### P4 — Hero I: the Half-Alive Island scene *(Fable)*

```
Stage P4. STANDING ORDERS apply. Read the hero doc §1–§7 IN FULL — it is the shot spec —
plus framing.ts, Film.tsx, App.tsx, and the goblin build in world.ts/actions.ts/pencil.ts.

Build the static hero scene on the P2/P3 kit, in src/film/stages/hero.ts:
1. Geometry: the island diorama, half painted / half graphite, seam = the goblin's work
   progress with the feathered touch-reveal edge (hero §2). Island drop shadow fades under
   the unfinished half.
2. Goblin v2 (locked design) placed at the seam edge with the carpenter's pencil
   (pencil.ts assets). markAlive on goblin from frame one; the goblin's shadow is the only
   shadow crossing onto the graphite half.
3. Rigs: split lighting per P3 meeting at the seam.
4. Camera: FOV 32° tele (fixed — NO FOV tweens, motion §10), elevation 33°, azimuth −18°,
   dolly breath ±1.2% on a 13s cycle (stills under PRM). Respect framing.ts's REF_FOV /
   MAX_PULLBACK contract or consciously supersede it — document which in the code.
5. Typography block (hero §6): hand-lettered wordmark slot (placeholder per ASSETS.md),
   tagline, "~2 minutes" cue, scroll affordance; Vollkorn for the quiet lines; margins per
   direction §6. Run the impeccable pass on this DOM layer.
6. Composition: match the hero doc's poster comp at rest. Verify at 4 widths (mobile
   portrait, tablet, laptop, wide) — the comp rebalances rather than crops arbitrarily.

Exit: checks + build green; static hero renders to comp at all four breakpoints with zero
console errors; screenshots to walks/p4/ including all breakpoints. Entrance, mouse, and
scroll behavior are P5 — the hero may be reached behind a temporary flag (?hero=1) so the
v1 film still plays untouched.
```

### P5 ★ — Hero II: entrance, mouse, and the first-scroll handoff *(Fable)*

```
Stage P5. STANDING ORDERS apply. Read hero §8–§10, motion §6 (cursor) and §13 (loading),
experience §3 (Cover), and the current boot path (main.tsx, App.tsx, Film.tsx), in full.

Build:
1. Entrance (hero §8, motion §13): paper <250ms → grid ghost → ~78 strokes write
   themselves on (elastic pacing 1.2–4s by asset readiness — loading IS the drawing, no
   spinner) → lantern ignites BEFORE paint → color blooms across the painted half with the
   goblin riding the bloom edge → type settles. Settled by 3.2s on a warm cache;
   skippable (any input completes it instantly to the settled frame); returners
   (localStorage gg.seen) get 0.6× pacing. Slow networks: the strokes simply keep drawing
   — the sequence absorbs load time invisibly.
2. Mouse (hero §9): parallax ±2.2°/±1.2° damped 550ms; goblin head-track cone ±14°; 4s
   idle → scritch loop 1.8s; ear-perk once per session; almost-touch = ≤6% amber lift
   within 90px of the seam, never paints anything. Clicks do nothing here — the world is
   pointer-dead until the endcard; verify no cursor:pointer leaks.
3. First-scroll handoff (hero §10): at 3.5% scroll the film catches — head snap 120ms,
   pencil tuck, paint drains back (drain recipe), house lights fall, ember dies at 97%,
   black, then open1. Fully scrub-reversible: scrolling back re-ignites lantern-first.
   Wire the hero as t<0 of the master timeline or as a pre-timeline segment — pick
   whichever keeps the gearing map (P1) intact, and document the choice in gearing.ts.
4. Poster bake: render the settled hero frame to a static image asset (the OG image and
   Picture-Book frame 1, consumed by P15/P16). Store under story/story/public/.
5. Reduced motion: entrance becomes a ≤0.4s crossfade to the settled frame; parallax,
   breath, scritch, ember all still (motion §14 rows).

Exit: checks + build green; walk: cold load → entrance → idle behaviors → handoff →
scroll back → re-ignition, all with zero console errors; skip path and returner path
verified; PRM walk verified. Record a GIF of entrance + handoff to walks/p5/. ★ Nayan
reviews before P6.
```

### P6 — The margin interface and the caption systems *(Sonnet)*

```
Stage P6. STANDING ORDERS apply. Read direction §4 (typography) + §6 (composition),
experience §4 (persistent interface), motion §8 (text reveals), copy-spec.md (locked
words), and styles.css + the current caption code in world.ts/timeline.ts, in full.

Build:
1. Margin band (experience §4): chapter numeral, the 66-tick ruler (progress = film time,
   driven off world.t, not scroll), the skip note (appears t16.5 for first-timers, earlier
   for returners via gg.seen), all in the page margins per direction §6 — captions and UI
   never collide with the diorama. White+ink only; no theme accent (overlays stay
   neutral).
2. The Hand caption system: hand-lettered SVG captions with stroke write-on reveals
   (motion §8 recipe: strokes write at T_REVEAL, hold, unwrite on reverse scrub).
   Placeholder lettering (clean single-stroke SVG paths of the locked copy) registered in
   ASSETS.md — real lettering lands with the art bible. Alignment, size, and margin rules
   from direction §4.
3. The serif reveal system: Vollkorn lines using the shipped clip-path + opacity-pin
   technique (styles.css:216–219 idiom); reveal/retract symmetric under scrub.
4. Caption engine: a declarative caption table (id, t-in, hold, t-out, style Hand|serif,
   margin slot) replacing ad-hoc cap() calls as stages migrate; keep cap() delegating to
   it so unmigrated v1 beats keep working. scripts/captions.check.ts: table entries within
   t range, no overlapping same-slot captions, every string byte-identical to copy-spec.md
   (parse both).
5. Migrate ONE live beat (the cold-open caption pair) to the new system end-to-end as
   proof; remove the old floating style for that beat only.

Exit: checks + build green; walk t0–12 both directions (new captions) + spot t22/44.6/61
(old captions unharmed); impeccable pass on the margin band. Screenshots to walks/p6/.
```

### P7 ★ — Stages 1–2: THE CLAIM and THE ADDRESS (t0–16.5) *(Sonnet)*

```
Stage P7. STANDING ORDERS apply. Read experience §6 Stage 1 + Stage 2 (the beat sheet is
the shot list), motion §9 (scroll choreography) + §12 (house lights, exhale), and the
extraction map entries for the C1/C2 scenery in world.ts, in full.

Rebuild t0–16.5 on the v2 kit:
1. Extract the C1 (ambush night) and C2 (path/lantern run) scenery from world.ts into
   src/film/stages/s1-claim.ts and s2-address.ts, rebuilt as island dioramas with the
   trilayer material and both rigs. Delete the replaced world.ts code — the monolith
   shrinks with every stage.
2. Choreography per the beat sheet: every beat's t value, camera move (cam() twin-tween
   idiom, settle-lane eases, durations from the T_* scale), curtain state, and caption
   (migrated to the P6 engine, words verbatim).
3. Transitions: house lights (from P5's handoff) into open1; exhale where the beat sheet
   places it. Respect scrub-reversibility: tl.set pairs ≥0.02t apart; walk both
   directions.
4. Goblin: gait/breath stay on gobT (never keyed to scroll); puppet-lane eases only for
   in-world acting.

Exit: checks + build green; walk t0→18 forward and back at slow and fast scrub; hero →
stage 1 boundary seamless; captions verbatim; zero console errors; world.ts line count
reduced (report the delta). Screenshots to walks/p7/. ★ Nayan reviews — this is the
quality bar for every remaining stage.
```

### P8 — Stage 3: PROOF OF LIGHT (t16.5–26.5) *(Sonnet)*

```
Stage P8. STANDING ORDERS apply. Read experience §6 Stage 3, motion §12 (walk-through
recipe), and the C3 extraction-map entries, in full. Follow the P7 pattern exactly.

1. Extract and rebuild the Stage 3 scenery (src/film/stages/s3-light.ts) as islands +
   trilayer + rigs. The lantern/light proof beat is the stage's spine — the Performance
   rig's amber does the arguing; keep every other hue quiet.
2. Choreography + captions per the beat sheet; the walk-through transition lands here per
   the catalog — implement it as specified (camera passes through a scene element to the
   next island; occlusion covers the swap; reversible).
3. Delete replaced world.ts code.

Exit: checks + build green; walk t15→28 both directions; walk-through has no visible pop
in either direction; world.ts delta reported. Screenshots to walks/p8/.
```

### P9 — Stage 4: PROOF OF SCENERY (t26.5–36) *(Sonnet)*

```
Stage P9. STANDING ORDERS apply. Read experience §6 Stage 4 and the C3/theatre
extraction-map entries, in full. Follow the P7 pattern.

1. Extract and rebuild Stage 4 (src/film/stages/s4-scenery.ts): the theatre disc turn —
   the scenery-swap proof. The disc rotation is the hero move: camera per motion §10 caps
   (roll ≤8°, ≤25°/s), settle-lane eases, no FOV tweens.
2. The Performance↔Prep flip inside this stage uses the P2 recipes; the audience-facing
   trick must read in BOTH scrub directions.
3. Choreography + captions per the beat sheet; delete replaced world.ts code.

Exit: checks + build green; walk t25→37 both directions at two scrub speeds; disc turn
honors the vestibular caps (assert peak deg/s in a check if feasible, else measure in the
walk); world.ts delta reported. Screenshots to walks/p9/.
```

### P10 ★ — Stage 5: PROOF OF TIME — the die nudge (t36–50) *(Fable, review by Opus if it fights back)*

```
Stage P10. STANDING ORDERS apply. This is the centerpiece — the beat the whole site
argues from. Read experience §6 Stage 5 IN FULL, motion §12 (the tick recipe timing),
direction §11, dieGeometry.ts, and the tavern extraction-map entries.

1. Extract and rebuild the tavern (src/film/stages/s5-time.ts): islands + trilayer +
   Performance rig warmth; the die gets the power3.out family it already speaks.
2. The beat, exactly: nat 1 lands → THE TICK (clock stop ≤0.15t, curtain 0.35t — the
   perceptual-instant freeze; gobT keeps breathing) → the goblin walks in through the
   frozen scene → the nudge (markAlive on the touched die stays permanent) → release →
   nat 20 → "You're welcome." (caption verbatim). The frozen-tick frame is the second
   press still: make that exact t reachable and stable.
3. Gearing: this stage owns 20% of scroll for 11% of time (experience §5.2) — verify the
   P1 map delivers the slow-motion reading and the tick lands where the beat sheet says.
4. Scrub-reversibility is non-negotiable here: backward scrub must un-nudge cleanly
   (except markAlive permanence — verify the doc's rule for reverse and implement what
   motion §12 specifies).

Exit: checks + build green; walk t35→51 both directions at three speeds; tick timing
measured against the recipe constants (instrument in the HUD); the freeze frame
screenshots identically across two loads. Screenshots + GIF of the full beat to
walks/p10/. ★ Nayan reviews the beat before the back half is built.
```

### P11 — Stages 6–7: THE MANY JOBS and THE HANDOVER (t50–64.5) *(Sonnet)*

```
Stage P11. STANDING ORDERS apply. Read experience §6 Stages 6–7, motion §12 (page turn,
flatten), and the montage/cliff extraction-map entries, in full. Follow the P7 pattern.

1. src/film/stages/s6-jobs.ts — the silent montage: the page-turn transition between
   vignettes (the one legal stagger context is the mini-world — keep the shipped 0.05
   stagger idiom where the beat sheet calls for it).
2. src/film/stages/s7-handover.ts — the cliff bookend and THE FLATTEN: the world folds
   flat into the underdrawing — this is the payoff the trilayer and grid watermark exist
   for. The flatten must read as the same strokes losing their paint, not a crossfade.
3. Choreography + captions per the beat sheet; delete replaced world.ts code. By the end
   of this prompt world.ts should be assembly + shared helpers only — report what remains.

Exit: checks + build green; walk t49→65 both directions; the flatten lands on the grid
watermark exactly (screenshot overlay against the P2 sandbox reference). Screenshots to
walks/p11/.
```

### P12 ★ — Stage 8: THE TABLE, the endcard, and the CTA (t64.5–end) *(Sonnet + impeccable)*

```
Stage P12. STANDING ORDERS apply. Read experience §6 Stage 8 + §8 (conversion spec),
direction §12, motion §7 (CTA rows) + §12 (morph), copy-spec.md endcard block, in full.

1. src/film/stages/s8-table.ts — the morph: the d20 face morphs into the real Good Goblin
   board with no cut (the morph recipe; reversible). The board is real product surface —
   match the app's actual look, not a stylized stand-in.
2. The endcard: "The Dungeon Master's backstage." + JOIN THE DISCORD, copy verbatim.
   Touch-lit graphite CTA per the conversion spec: Cinzel, the existing 0.2s color
   transition + the 180ms entry-side amber bloom (motion §7); focus-visible state
   specified and keyboard reachable. The endcard is one of exactly two pointer-live
   surfaces — enable pointer events here and verify they are dead everywhere else.
3. Forms note, for the record: there is no form on this site by design — conversion is a
   single external link to the closed beta Discord. If a signup form ever replaces it,
   that is a new plan, not a tweak. 
4. Dead-# guard: a vite build-time check that FAILS `npm run build` when DISCORD_URL is
   '#' and mode is production (dev stays permissive). scripts/ or vite config — smallest
   correct hook wins.
5. Impeccable pass on the endcard DOM.

Exit: checks + build green (build must fail when forced to production with '#' — verify
both sides of the guard); FULL film walk t0→end, then end→0, zero console errors; CTA
keyboard + pointer verified. Screenshots to walks/p12/. ★ Nayan walks the complete film.
```

### P13 — Play mode, soft rests, and input polish *(Sonnet)*

```
Stage P13. STANDING ORDERS apply. Read experience §5 (input model) and motion §6 (cursor)
+ §9 (gearing/rests), plus the autoplay code (main.tsx/App.tsx per RECON.md), in full.

1. Play mode: autoplay advances at constant STORY time (1t/s) by driving scroll through
   the P1 inverse gearing map — not constant scroll speed. Yields instantly to
   wheel/touch/key; visibilitychange pause (P1) verified under play; the #play control
   keeps its 0.25s opacity idiom.
2. Soft rests: touch-only magnetic rests at the beat sheet's rest anchors (±0.35t window,
   220ms settle). Desktop wheel gets NO magnetism.
3. Keyboard stepping: ←/→ (and PgUp/PgDn) step between the ~18 rest anchors with
   settle-lane easing; Home/End to cover/endcard. Anchors come from one shared table used
   by rests, keyboard, and reload restore. scripts/anchors.check.ts: anchors sorted,
   within range, one per beat-sheet rest.
4. Cursor system (motion §6): quickTo-damped presence; default cursor hidden only if the
   motion doc says so — implement exactly its spec, including touch/PRM behavior.
5. Reload restore: returning mid-film restores to the nearest anchor ≤ saved t.

Exit: checks + build green; input matrix walk — wheel, trackpad momentum, touch drag,
keyboard, play mode, tab-hide during play, reload mid-film — zero console errors each.
Screenshots/GIF to walks/p13/.
```

### P14 — Responsive layouts and touch *(Sonnet)*

```
Stage P14. STANDING ORDERS apply. Read experience §5.1 (devices), hero §13, motion §15
(mobile budgets), and the current viewport handling (framing.ts, Film.tsx, styles.css),
in full.

1. Breakpoint pass at 4 canonical viewports (390×844 portrait, 768×1024, 1440×900,
   1920×1080+): hero comp rebalance (P4 started this — finish it for every stage), margin
   band + captions rescale per direction §6 rules, no caption/diorama collision anywhere
   in the film, no horizontal overflow, type sizes hold the direction §4 hierarchy.
2. Touch model: drag-to-scrub via Lenis touch defaults + P13 soft rests; hover-only
   affordances (almost-touch, cursor presence) cleanly absent on touch — feature-detect,
   don't UA-sniff. The "~2 minutes" cue and skip note must be reachable on small screens.
3. Mobile perf: dpr cap honored, per-stage draw calls within motion §15 budget on a
   mid-tier phone profile (Chrome DevTools throttled run is acceptable evidence).
4. Landscape-phone: pick the doc-compliant behavior (letterbox or reflow) per experience
   §5.1 and implement it; don't leave it accidental.

Exit: checks + build green; the FULL film walked at all four viewports (spot every stage
boundary + hero + endcard), screenshots per viewport to walks/p14/; zero console errors.
```

### P15 — Accessibility and failure modes *(Sonnet)*

```
Stage P15. STANDING ORDERS apply. Read experience §9 (accessibility) + §10 (failure),
motion §14 (the complete reduced-motion mapping), in full.

1. The SR parallel document: the full story as structured prose (from copy-spec.md +
   the beat sheet's scene descriptions) in the DOM, properly headed and landmarked; the
   canvas aria-hidden; the margin band's interactive controls labeled; reading order
   sensible. The CTA is a real link with a real accessible name.
2. Reduced motion = the stepped picture book (motion §14): PRM swaps scrub-driven film for
   stepped stills at the anchor table (P13) with ≤0.4s crossfades; AMBIENT 0.3→0 — stills,
   not damps; Lenis not instantiated; entrance = crossfade (P5). Verify EVERY row of the
   §14 table.
3. WebGL-fail Picture Book: context-creation failure or context-loss → the 8-frame
   Picture Book page built from the baked posters (P5 + stage stills you bake now), same
   copy, same CTA. Test by forcing failure (disable WebGL via devtools flag) and by
   simulating context loss.
4. Keyboard end-to-end: tab order (skip note → play → CTA), focus visible per motion §7,
   stepping per P13; no keyboard trap.
5. Contrast: verify caption ink on paper and endcard text ≥4.5:1 (the tokens should pass
   by construction — measure anyway, including over the darkest film frames the captions
   sit on).

Exit: checks + build green; walks: PRM full pass, forced WebGL-fail pass, keyboard-only
pass, screen reader smoke (NVDA) reading the parallel document start→CTA. Zero console
errors. Evidence to walks/p15/.
```

### P16 — SEO, meta, and loading performance *(Sonnet)*

```
Stage P16. STANDING ORDERS apply. Read experience §10 (budgets), motion §15, hero §13,
and index.html + vite config, in full.

1. Meta: title, description (plain, no AI mentions, voice per PRODUCT.md), canonical,
   theme-color (paper), favicon set, OG/Twitter card wired to the P5 poster (correct
   dimensions), og:site_name Good Goblin. This is a single-page story — no sitemap
   theatrics; robots default-allow.
2. First paint: paper + type visible <1s on a cold cache — inline the critical CSS for
   the paper/loader shell, fonts via @fontsource with font-display strategy that avoids
   FOIT on the Hand/serif (verify what direction §4 specifies), preload only what the
   entrance needs.
3. Asset streaming: KTX2 pipeline for the trilayer texture slots (placeholder textures
   compressed through the same pipeline so the machinery is proven before forge assets
   land); total streamed budget ≤9MB per experience §10; paint+underdrawing packed
   together per the doc. Loader (P5) elastic pacing consumes the real readiness signals.
4. Code split: the film core loads for the entrance; later-stage assets stream behind it
   (the entrance absorbs the wait by design). Measure and record: cold first-paint,
   settled-hero time, total transfer, per-stage texture residency.
5. Bundle audit: no stray deps; three/GSAP tree-shaken; production build size recorded in
   story/docs/build/BUDGETS.md against the doc numbers.

Exit: checks + build green; measured numbers in BUDGETS.md all within budget (or each
overage listed with cause + smallest fix); Lighthouse run saved to walks/p16/ (perf +
SEO + a11y categories — treat regressions as findings, not decoration).
```

### P17 ★ — The QA walk and the ship gate *(Opus)*

```
Stage P17. STANDING ORDERS apply. Read motion §16 (the 8-step QA walk protocol) and
experience §11 (the clarity contract), in full. This session fixes only what the walk
finds; no new features.

1. Run the motion §16 protocol end-to-end, all 8 steps, recording evidence per step to
   walks/p17/. Any failure: fix, re-run that step, and re-walk the neighboring stages.
2. Assert the experience §11 clarity contract — all 7 assertions, each with the concrete
   evidence the doc demands.
3. Impeccable polish pass across every DOM surface (loader, margin band, captions as
   rendered, endcard, fallback page).
4. Cross-browser: Chrome, Firefox, Edge, Safari-if-reachable; the film must be correct in
   Chromium and DEGRADE HONESTLY elsewhere (no silent black frames — the Picture Book
   catches true failure).
5. Regression sweep: v1 archive untouched; `npm run check` full suite; production build
   with a real DISCORD_URL placeholder env to prove the guard's happy path.
6. Write story/docs/build/SHIP-REPORT.md: what was built P0–P17, every open finding
   (none dropped — fix or track, marginal included), measured budgets, the walk evidence
   index, and the ship checklist: real DISCORD_URL from Nayan · art-bible assets landed
   (textures via approved forge run, hand lettering, hero board) · final Nayan walk.

Exit: report delivered to Nayan. STOP. Committing, pushing, PR, or any publish happens
only on Nayan's explicit instruction, per standing orders.
```

---

## 4. What this plan deliberately does not do

- **No forge runs, no art-bible assets, no publishing** — every prompt builds against placeholder assets and a written contract (TEXTURES.md, ASSETS.md); the real art lands through separately approved runs and slots in without code changes.
- **No test framework** — the house check-script idiom covers the pure logic (gearing, anchors, captions, timing constants); everything visual is gated by walked evidence, which is what actually catches regressions in this codebase.
- **No git strategy decision** — story/ is untracked today; whether v2 starts being tracked (recommended: a `story-v2` branch once P5 passes review) is Nayan's call, asked once at that checkpoint, not assumed.
- **No CMS, no analytics, no cookie machinery** — one page, one CTA, by design.
