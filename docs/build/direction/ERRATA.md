# ERRATA — the four binding docs, reconciled

2026-09-03 · Reconciliation pass over `docs/2026-09-03-world-direction.md` (WD),
`docs/2026-09-03-scene-book.md` (SB), `docs/2026-09-03-goblin-design.md` (GD) and
`docs/2026-09-03-motion-microinteractions.md` (MM).

**What this document is.** Every disagreement found between the four, each one decided,
and a record of the patch that made the losing document agree. The patches are already
applied, in place, each marked `[ERRATA 2026-09-03 …]` at the point of change so the
history stays readable. **This file changes nothing on its own — it is the audit trail.**

**Method.** All four docs read in full; every ruling checked against `story/story/src`
and `story/story/scripts` before it was made. Where a doc and the code disagreed, the
code won and the doc was corrected. Line numbers below are current as of this pass.

**Precedence used, from the docs' own status sections.** `copy-spec.md` and `story.md`
are LOCKED and beat everything. Shipped code beats every doc on matters of fact. Then:
GD wins on the character (SB §0 marks it LOCKED for his design, build, rig and
materials); SB wins on beats, staging, the asset bill and the transition grammar (its §0
amends WD by name and WD's own §0 invites it); MM wins on motion mechanism, tokens,
lanes, clocks and reverse (its §0.2 amends the motion system and files its departures);
WD wins on art direction, palette, materials and lighting doctrine.

---

## PART 1 — THE DISAGREEMENTS, SETTLED

### 1. The paired `tl.set` positions — `PAIR_GAP`, not "identical", not "≥0.02 t"

**MM §0.2, §11.5, D-13:** pairs sit `PAIR_GAP` (0.025 t) apart, authored as `c` /
`c − PAIR_GAP`, never as two decimal literals.
**SB §4-5 and §3-S6-B1:** "paired at **identical positions** so reverse replays them in
reverse order." **SB §3-S4-B5, §3-S5-B1, §3-S5-B8 and the t50 handoff:** "≥0.02 t apart."
The scene book contradicted itself, and one of its two answers is a shipped bug.

**RULING — MM. Build to `PAIR_GAP`.** Verified in the code and in floating point:

- `clocks.check.ts:66–74` sorts numeric same-target `tl.set` positions and fails the
  build on any gap `< 0.02`; it also asserts symbolic positions are textually unique.
- `timeline.ts:144–146` records the bug identical positions cause, in the past tense:
  *"two sets at the same position replay in reverse order on a backward scroll — the
  film's first frame came back with the camp missing."*
- Two decimal literals cannot be trusted to the floor. Measured in node:
  `30.34 − 30.32 = 0.019999999999999574` (**fails**), `20.55 − 20.53 =
  0.019999999999999574` (**fails**), `c − (c − 0.025) = 0.02499999999999858` (**passes**,
  for every mark in the film). `50.00 − 49.98 = 0.020000000000003126` happens to pass —
  which is exactly why literals are a defect even when they work.

**PATCHED — SB, six places.** §4-5 and §3-S6-B1 rewritten to `c` / `c − PAIR_GAP` with
the evidence inline; §3-S4-B5, §3-S5-B1, §3-S5-B8 and the t50 handoff restated from
"≥0.02 t" to `PAIR_GAP`; the t50 inverse "t49.98" replaced by `50.00 − PAIR_GAP`; and the
S3 frontier retire-pair **"30.32 / 30.34" rewritten as `c − PAIR_GAP` / `c = 30.34`** —
as written it was 0.019999999999999574 apart and would have failed the build on this
beat's first commit. MM's D-13 row updated from *routed* to **applied**.

### 2. The caption count — eleven, plus the endcard block

**MM §0.2, §6.1, D-17:** eleven captions plus the endcard block.
**SB §0, §2, §6, §8 (four places):** "the twelve captions."
**WD §0, §2, §4 (×3), §13 (six places, unfiled by MM):** "all twelve captions."

**RULING — MM.** `copy-spec.md:25–37` lists **eleven** caption rows; row 12 is `endcard`,
marked *(block, see below)* — the endcard copy, not a caption. `App.tsx:35–49`'s
`CAPTIONS` array has **eleven** entries and matches byte for byte. Copy is LOCKED; a
twelfth line cannot be invented. `docs/build/ASSETS.md` is already correct and says so
explicitly — its thirteen lettering slots are 11 captions + the tagline + the wordmark,
and it states *"eleven narration captions plus the endcard tagline make the twelve
lettered lines; the wordmark is a separate drawn asset."* There is no third count.

**PATCHED — SB (4) and WD (6).** All ten sites corrected, with the reason recorded once
in each doc's inheritance table. WD's §13 "12 caption letterings + tagline" → 11. MM's
D-17 row extended to name the six WD sites it had not caught.

### 3. `GOB_SCALE` — two surfaces, one name

**SB §7 and WD §6:** "`GOB_SCALE = 0.75`, uniform and locked film-wide."
**GD §11.2 and gate G7:** "the stage solves `GOB_SCALE` so the projected figure height is
≥ 52 CSS px at every breakpoint, capped at 1.35× the desktop scale."
**MM D-6:** they are different surfaces; rename the second.

**RULING — MM, with the rename direction pinned to the shipped symbol.** They are two
constants for two surfaces with two different floors: the **film body** is a fixed 0.75
with floors of ≥100 px landscape / ≥84 px portrait on `A`-flagged beats
(`figure.check.ts`); the **Cover** solves per breakpoint for ≥52 px capped at 1.35×
(`gob.check.ts` G7). The shipped `hero.ts:50 export const GOB_SCALE = 0.75` is read only
inside `stageGoblin` (`hero.ts:1197`, `:1214`), so **it is the Cover's**, and it is the
one that renames to `HERO_GOB_SCALE`. The film body's constant takes the `GOB_SCALE` name
at film level. No conflict survives the rename.

**PATCHED — GD §11.2 and G7** (renamed, with the two floors distinguished), plus a
cross-reference note in **SB §7** and **WD §6**. MM's D-6 row updated with the direction
of the rename.

### 4. The new-verb count — nine, five of them already shipped

**GD §10 prose:** "**bold** verbs are the five to author"; its table bolds four.
**GD §13 step 7:** "The five new verbs. `freeze()`, `stow()`/`draw()`, `scribe()`,
`pocket()`, `throw()`."
**SB:** mandates four more — `hop` (S5-B4/B7), `hang` (S6-B3), `plantAndPat` (S6-B4),
`touchUp` (S6-B1).
**WD §11:** names four — `hang`, `plantAndPat`, **`coinDrop`**, `touchUp`.
**MM §10.6 / D-5:** "To author: **eight** verbs."

**RULING — nine, and D-5 is closed.** GD's table simply never bolded `stow`/`draw`; its
prose count of five was right, so 5 + 4 = **nine**, not eight. WD's `coinDrop` is struck:
the S6 chest vignette it served is cut (SB §3-S6), and S3-B5's judged coins are a
`PUPPET.pop`, not a verb; `hop` takes its slot, mandated by the `buildFinger` retirement.

**And five of the nine have SHIPPED** — verified in `actions.ts`: `:631 freeze` ·
`:669 stow` · `:694 draw` · `:722 scribe` · `:752 pocket` · `:772 **throwDie**` (renamed
because `throw` is a JavaScript reserved word). **Four remain to author:** `hop`, `hang`,
`plantAndPat`, `touchUp`.

**PATCHED — GD §10 header and §13 step 7** (marked done, with the `throwDie` rename
recorded), **MM §10.6** (header and the five shipped rows), **WD §11** (`coinDrop` → `hop`),
**SB §6 hero tier** (the four outstanding named). MM's D-5 row closed.

### 5. The frontier — one grammar, two mechanisms, `seamDir` declined

**WD §7:** "the seam appears in exactly **two** places"; **§13 S7:** "the film's one
world-scale frontier"; **§7 and §9-4:** the `seamDir: Vector3` promotion is **funded**.
**SB §0 amendments 1 and 2:** frontier grammar in exactly two places — S3's lantern as
`rig.seamX` (island-scale) and S7's flatten as the per-prop `uTriFlat` ramp (world-scale),
with `rig.seamX` parked at `1e6` for all of S7 — and the `seamDir` promotion **declined**,
its budget moved to the practicals array.

**RULING — SB. Forced by the shipped shader, verified at `trilayer.ts`:** `triSeamF =
smoothstep(uTriSeamX − uTriSeamW, uTriSeamX + uTriSeamW, triSeamC)` and `triC =
max(uTriCurtain, triSeamF) * (1.0 − uTriAlive)` (~lines 280–300). The seam can only ever
*add* Prep, east of the line. Ramping `seamX` from its `1e6` park to 118 would flip the
world's whole east half to graphite in one frame at t60 and render the standing miniature
as the drawing. S7's frontier *look* is authored into the flat ramp through the shader's
existing `triDabN` noise (`trilayer.ts:294–297`) — one line, no second uniform, no
direction to get backwards. And nothing in the film needs a non-x basis: S3's ribbon runs
+x and S7 uses no seam, so `seamDir` is specified and not built; the rig/shader extension
count stays net-neutral because the three-slot practicals array takes its budget.

**PATCHED — WD §7** (both the two-places statement and the funded extension), **§9 grammar
kit item 4** (marked declined, budget reassigned), **§13 S3 and S7 rows**.

### 6. The touch-reveal count — eight props, ten shells, ten `alive` steps

**SB §4-4 and MM §11.4:** "9 uses" / "nine uses", then both enumerate **eight** props.
**MM §15.2 step 8** already walks "each of the **ten** reveal shells" — so MM contradicts
itself too.

**RULING — eight touched props, ten marks, ten shells, ten `alive` steps.** The candles
carry three each with its own mark, shell and material. Verified: `timeline.ts` holds
eight `reveal()` call sites today, of which the two at 29.1 (`tufts`, `treeline`) retire
into the t30 exhale, leaving six shipped — fire2 `:491`, lamppost `:494`, cave+door
`:497`, chest `:500`, mushrooms `:518`, signpost `:521` — plus the die and the three
candles to add. The **rope** (S4-B4) and the **road mark** (S6-B1) take `alive` steps but
are **not** touch reveals: both fire at `curtain = 0` in Performance, where there is no
Prep to reveal from. The rope's step exists to keep it painted *through* the S4 flicker;
the road's paint arrives on the `touchUp` bristle line.

**PATCHED — SB §4-4 and MM §11.4** (both headers and both enumerations).

### 7. The goblin's third hatch patch — `1366` is the adventurer's, not his

**WD §7 hatch roll and §14:** "three literal hatch patches — flank `world.ts:978`, jaw
`world.ts:1211`, **cloak tone `world.ts:1366`**."
**GD §4.3 and §13 step 1:** "flank `world.ts:978`, jaw `:1211`, **`contact()` `:1277`**."

**RULING — GD, verified in the file.** `buildGoblin` spans `world.ts:1067–1572`.
`buildAdventurer` starts at `:1573`, and the surviving `cloakTone = hatch(0.3, 0.36, 11,
1.35, 'faint')` sits at **`world.ts:1644`, inside `buildAdventurer`** — it is the
**adventurer's** cloak tone and it is still live. It retires under the cast tier's
"silhouette-first, painted cloaks, **zero interior hatch**" (SB §3-S1-B2), not under the
goblin's pass. The goblin's own third hatch field was the nine-stroke `contact()` disc —
`pencil.ts:487` builds a `hatch(width, depth, 9 / depth, 0, 'faint')` inside it.
**All three of his are already deleted:** `buildGoblin` now greps clean for `hatch(`,
`contact(`, `blobs(`, `timberDark` and `paint(…fill:` — GD gate `G9` passes.

**PATCHED — WD §7 hatch roll and §14** (re-attributed and re-counted), **SB §6 hatch
retirement roll** (the row split into two, one for the goblin's deleted fields and one for
the adventurer's live one), **GD §4.3** (marked done, with a note for the other docs).

### 8. The hatch site count — 31 live, not 33

**WD §7:** "**33 live `hatch()` / `crossHatch()` call sites** (34 grep lines;
`world.ts:3526` is the monster's comment, not a call)."
**SB §6:** "The hatch retirement roll — all **33** sites, by name, to zero."

**RULING — 31 live sites, 32 grep lines.** Counted in the file: 32 matching lines, one of
which (`world.ts:3803`) is the monster's not-hatch comment — which has moved from 3526.
The two goblin patches (flank, jaw) are already deleted; 33 − 2 = 31. The adventurer's
`1366` survives (see 7).

**PATCHED — WD §7 and SB §6 roll headers**, both now stating 31 and instructing retirement
**by name, never by line.**

### 9. Straight-down camera — legal from t62, not only at S8

**WD §6:** "**90° straight-down exists only at the board (S8).**"
**SB §0 amendment 3:** legal wherever the frame's content is the finished map — **S7 from
t62, and S8** — and never framing a standing world; the shipped
`cam(62, 2.5, [145,40,0.01] → [145,0,0])` stands.

**RULING — SB.** WD's own §13 S7 row already describes the top-down map beat at t62, so
WD contradicted itself. **PATCHED — WD §6.**

### 10. Tilt-shift DOF — there is no DOF pass

**WD §10:** "Tilt-shift DOF at **exactly two moments in the film**."
**WD §13 S7:** "Tilt-shift for one breath at the rise."
**SB §0 amendment 4 and §3-S5-B5/B6, §3-S7-B3:** no DOF pass exists; the depth-to-paper
ramp (`rig.depthNear`/`depthFar`) tightens for the same two moments.
**MM §9.3:** "There is no DOF pass in this film and none may be added."

**RULING — SB/MM.** There is no DOF pass anywhere in `story/story/src`, and the experience
doc budgets **one** post pass (the curtain). Same two beats, same intent, shipped
machinery — a scrub-safe uniform pair. **PATCHED — WD §10 and §13 S7 row.**

### 11. The exterior-night key — a `DirectionalLight`, not "radius-limited"

**WD §8:** exterior night = `(1.2, 2.4, 1.6)`, warm, **radius-limited**.
**SB §6 rig ruling 1:** it stays the same `DirectionalLight` as the day family, lowered
and dimmed — `KEY_I_NIGHT = 0.55`, `HEMI_I_NIGHT = 0.35`.

**RULING — SB, verified in `rigs.ts`.** The key is a `THREE.DirectionalLight` and has **no
distance falloff at all**, so "radius-limited" is not a state it can be in; making it one
would convert the film's only shadow-caster to a point light for two stages, against a
cliff baked for the day family — which is the very reason the azimuth is held at +18°.
S1-B5's darkest frame is **composed and baked** (dusk hemisphere plus contact darkening in
the island albedo), not lit by a falloff that does not exist. **PATCHED — WD §8.**

### 12. The `me*` caption band — 24%, not the lower third

**SB §2, §3-S2-B2 and §3-S2-B3:** "lower-third band"; §3-S2-B3 goes further and credits
the **20° down-angle** with keeping the band off his tunic.
**MM §6.4:** "The `me*` lines seat at 24% instead of the shared 78% band."

**RULING — MM, and the shipped code.** `App.tsx:31–34` carries the ledgered fix in a
comment and `CAPTIONS` carries `high: true` on `me1`–`me4`: in the to-camera freeze the
lower-third band crosses the goblin's tunic at **3.54:1**, under the 4.5:1 caption floor.
Camera angle is not the mechanism and cannot be — no elevation inside the 20°–75° bench
clamp moves the band off him. The 20° elevation stays; it is the address's own staging.

**PATCHED — SB §2 (the Captions row), §3-S2-B2 and §3-S2-B3.**

### 13. The nudge — the pencil butt, not a fingertip

**SB §3-S5-B6:** "`nudge` (`actions.ts:460`): 4-frame anticipation, **one fingertip**,
push-through of a few millimetres."
**GD §10 and §15 failure mode 5:** "`nudge()`, but with the **PENCIL BUTT**, not the mitt.
The mitt has no finger and he would use the tool anyway. The flip to butt-forward is the
anticipation." / "Mitts have no fingers … fine manipulation is always the pencil's job."

**RULING — GD, and the shipped verb.** SB §0 marks GD LOCKED for the character, and
`actions.ts:568` already implements it: `tl.to(armOf(g, side).wrist.rotation, { y: side *
2.6, duration: 0.3 … })` with the comment *"the flip: 0.30 s of wrist, and it is the only
warning the die gets"*, plus `express('sly')`. A fingertip on a fingerless mitt is not a
shot. **PATCHED — SB §3-S5-B6** (mechanism and the drifted line ref).

### 14. `EAR_Z` — gate G8 is closed, the retune is shipped

**GD §9 and §13 step 6:** the `EAR_Z = 1.3` → `EAR_Z_R`/`EAR_Z_L` split "is not free and
it is not optional", booked as its own step, gated by `G8`.
**MM §10.2:** "The `EAR_Z` retune is DONE and is not a build item … **Gate G8 is closed.**"

**RULING — MM, verified.** `world.ts:866–867` exports `EAR_Z_R = 0.55` / `EAR_Z_L = 0.85`;
`actions.ts:6–7` imports both; `earBase()` at `actions.ts:35` resolves per side;
`actions.ts:344` records the retune as done and all six `EXPRESSIONS` entries carry
retuned values. `EAR_Z` is gone. **Costing a shipped pass is how a round gets spent
twice.** **PATCHED — GD §9, §13 step 6 and gate G8** (closed, assert kept).

### 15. The goblin's palette in the direction — superseded by the goblin doc

**WD §5:** the goblin row lists `gobSkinLit`, `gobHood`, `gobTunic`, `gobTunicShade`,
`gobBelt`, and closes "He is the loudest chroma in every frame by one deliberate step."
**WD §14 item 2:** the cloak bakes "in the `gobHood #687452` / olive ramp".
**GD §0, §4.1, §4.2:** rust and olive are both dead on merit; `gobCloak #2E3742` +
`gobCloakWorn #59626B`; `gobTunic`, `gobTunicShade`, `gobHood`, `gobBelt`, `gobSkinLit`,
`bedroll` and `timberDark` are **retired from his build entirely**; and he owns the
frame's **darkest committed value and its only cool hue**, not its loudest chroma.

**RULING — GD.** SB §0 marks it LOCKED for his materials, and `palette.ts:133–135` has
already shipped `gobCloak`, `gobCloakWorn` and `gobSkin`. **PATCHED — WD §5** (the whole
goblin row replaced, with the retired tokens named), **WD §14** (a header note plus item 2
corrected to the cool-slate ramp at `poster: 10`, and the closing "loudest chroma" line),
and **SB §3-S2-B2** (its one use of "the loudest chroma in the frame").

### 16. `figure.check.ts` — "no exceptions" is wrong

**WD §6:** the check asserts every acting beat "≥84 px, **no exceptions**".
**SB §7 and MM A9:** `E`-flagged establishing beats are exempt by construction, and
**S7-B6 (the throw) carries a registered exemption** the check's beat table must carry or
it fails at 390 px. The `A`/`E` flag in SB §3 is the single source of truth.

**RULING — SB/MM. PATCHED — WD §6.**

### 17. The S6 vignette subjects — six, and the chest is cut

**WD §13 S6:** names seven subjects and bills "chest + hoard (R)".
**WD §9 set tier:** "Six vignette islets."
**SB §3-S6:** the chest vignette is **cut** — it re-argued S3-B5 with the same registered
prop thirty seconds later, and the montage's job is to accumulate, not restate. Six
subjects, one per shipped slot solve: road · monster · sign · saplings · NPC miniature ·
candles.

**RULING — SB** (the later, argued decision, stated as a supersession, and it is what the
per-mesh census, the hatch roll's `3809` row and the alternation `− + − + − +` are all
built against). **PATCHED — WD §13 S6 row** (the chest struck, the brush + pigment pot
added to the bill where SB puts it).

### 18. The endcard "meta line" retires

**WD §4:** the Quiet Serif carries "the endcard subline, **the meta line**, the skip note,
the © line", and its table row repeats it.
**SB §2:** "**The endcard 'meta line' retires** — direction C is 'no box, nothing extra',
and it has no source copy in `copy-spec.md`."

**RULING — SB**, and `copy-spec.md` is LOCKED: there is no meta-line copy to set. The
Cover's own meta line is a different element and is unaffected. **PATCHED — WD §4** (prose
and table).

### 19. The carpenter's pencil at the endcard

**WD §9 hero tier 5 and SB §6 hero tier:** the pencil "recurs at S6's road vignette … and
at **the endcard**."
**WD §12 and SB §5.2:** the endcard is wordmark → tagline → subline → CTA on the bare
board, *"no box, no card, no wash, no drawn border, no drop-shadow smudge"*.

**RULING — the endcard spec.** The pencil appears twice: the Cover and S6-B1. Its drawn
language survives at the endcard only as the CTA's hand-redrawn offset border.
**PATCHED — WD §9 item 5 and SB §6 hero tier row.**

### 20. The island-card count — twelve, not nine

**WD §9:** header "Set tier — **9 islands** + 5 set pieces", then numbers **twelve**
entries under "Islands" (1–5, 6–11 the six islets, 12 the miniature world).
**SB §6 grammar kit:** "9 islands instantiate it", over a table whose seven rows cover the
same twelve cards.

**RULING — twelve island cards**, by WD's own enumeration: camp · cliff · path ribbon ·
theatre · tavern · six S6 worksheet islets · the miniature world. The set-piece count (5)
was right. **PATCHED — WD §9 header and SB §6 grammar-kit row.**

### 21. The cast tier count — seven, not nine

**WD §9:** "Cast tier — **9 items**", over a list with seven entries: adventurer trio ·
DM · two players · tavern patrons ×3 · ravens ×3 · the monster · the NPC based miniature.
(SB §6's table is the same seven merged into six rows and claims no count.)

**RULING — seven. PATCHED — WD §9 header.**

### 22. The texture-memory budget breached its own ceiling

**WD G2:** "**Texture-memory ceiling: 48 MB with mipmaps** … (8 × 512² + 4 × 1024² +
1 × 2048², RGBA, ×1.33 mip **≈ 45 MB**)."

**RULING — the arithmetic was wrong and the census breached the ceiling.** 8 × 512² RGBA =
8 MiB; 4 × 1024² = 16 MiB; 1 × 2048² = 16 MiB; total 40 MiB, and ×1.33 for mips is
**53 MB**, not 45 — over the stated 48 MB ceiling. **The ceiling holds and the board's
2048² ships without a mip chain**: it is only ever seen dead top-down at one scale, so a
mip chain buys it nothing. Corrected census: (8 × 512² + 4 × 1024²) × 1.33 + 16 MiB =
**47.9 MB**. **PATCHED — WD G2.**

### 23. The `lightC` scalar — D-2 routed to the scene book, now applied

**MM D-2 and §10.5:** the t20.55 switchover moves the lighting scalars, not just the
curtain (`rigs.ts:141–144` scales `hemi`, `flat` and the glow by the global curtain). The
Prep branch is unlit so the *drawing* is safe, but the alive props and the goblin are lit —
and the campfire he lights at t18.35 is *"the frame's only light"* (SB §3-S3-B2), so it
would emit nothing for 2.2 t and then jump to full in one frame.
**Decision:** a separate `lightC` `{value}` object, `tl.set` to 0 at **t20.505**, while
the global curtain still holds the whole frame in Prep. MM routed one added row to SB.

**APPLIED — SB §3-S3's state schedule** gains a `lightC` column, the t20.505 row, and the
standing note that `curtain` / `lightC` / `rig.seamX` must stay on **separate** objects —
the 20.53/20.55 pair clears `clocks.check` only because it groups by target, and merging
them onto one state object turns a passing check into a failing one with no code change.

### 24. `rigs.ts:143` is the wrong citation for S7-B4's glow death — D-15 applied

**SB §3-S7-B4:** "ambient life on the miniature extinguishes as each group crosses (its
glow dies with its paint, `rigs.ts:143`)."

**RULING — MM D-15.** That line scales the glow by `(1 − curtain)`, and `curtain` is 0
throughout the flatten, so the glow never dies there. **S7-B4's glow death rides the
group's own `uTriFlat`**, as the third factor of the practicals expression:
`intensity = base × flicker().glow × max(1 − lightC, alive.value) × (1 − flat.value)`.
**APPLIED — SB §3-S7-B4.**

### 25. Reduced-motion stills — 49, not 48

**SB §8:** "One held composition per beat — **48 stills**", over a per-stage table that
enumerates 47 and gives the S3 lantern two (before / after).

**RULING — 48 beats + the lantern's second = 49 stills.** The rule that binds, stated in
MM L11, is *every beat has an authored still*; where SB's stage rows list fewer entries
than the stage has beats they are abbreviating, not licensing a merge. **PATCHED — SB §8.**

### 26. Banked idles — fifteen sites, not nine

**SB §9 risk 8:** "Banked idles on **nine** props are new wiring."
**MM §10.4:** the complete ledger, with a named scrub-tied gate per row, and A13 caps the
registry at 20.

**RULING — MM.** **PATCHED — SB §9 risk 8.**

### 27. The margin breathe fires at the tick + 0.1 t

**SB §2:** "Breathes at t12.5, t33.1, t40.6."
**SB §3-S5-B3 and MM §12.10:** the breathe is `T_BEAT` at the tick's mark **+0.1 t** —
12.6 / 33.2 / 40.7.

**RULING — MM and SB's own beat text.** **PATCHED — SB §2.**

### 28. The token extension count — ten, not twelve

**MM §0.2:** "**Twelve** tokens added (§2.2)."
**MM §2.2:** "The extension — **ten** new tokens", table of exactly ten.

**RULING — ten** (§2.4 names ten *further* micro-constants, so neither reading is twelve).
**PATCHED — MM §0.2.**

### 29. Line-reference drift — `world.ts` is 4756 lines, not 4478

Not a doc-vs-doc disagreement but the largest source of false precision in the set, and it
will send a builder to the wrong function. `world.ts` has grown ~278 lines since both WD
and SB were written (the goblin rebuild landed), and `actions.ts`'s verbs have moved
20–115 lines.

**RULING — read every retirement and every kept mark BY NAME. Line numbers are provenance,
not addresses.** Verified moves, recorded in both docs:

| Landmark | Doc says | Actual |
|---|---|---|
| `world.ts` total | 4478 | **4756** |
| `earthPlane` / `grassPlane` | 2244–2254 | **2522–2532** |
| `buildFinger` | 2888–2920 | **3168** |
| `buildTavern` | 2921–3390 | **3201** |
| the rope | 2802+ | **3080** |
| the montage discs | 3396 | **3674** |
| the monster's shag / its comment | 3526, 3532–3563 | **3803**, **3803–3835** |
| `buildCliffWorld` | 3905 | **4183** |
| `miniWorld` | 4125–4313 | **4403+** |
| `GridHelper` + `boardFill` | 4337–4351 / 4337–4385 | **4615–4629** |
| `actions.ts` verbs | `plantFor` 177 · `look` 294 · `peek` 349 · `haul` 412 · `shrug` 431 · `nudge` 460 · `dustOff` 470 | **200 · 322 · 420 · 504 · 528 · 568 · 584** |

`timeline.ts`, `curtain.ts`, `trilayer.ts`, `rigs.ts`, `styles.css` and `App.tsx`
references were spot-checked and are accurate to ±2.

**PATCHED — a dated drift note at the head of WD §13 and SB §3**, plus the corrected
counts inline at both hatch rolls.

### 30. Check-script inventory

**WD §16** owed `figure.check.ts`, `draws.check.ts` and `bake.check.ts` "plus the
existing" — and then named eight of the thirteen that `package.json`'s `check` actually
runs. **MM §15.1 step 0** names all thirteen correctly.

**RULING — MM. PATCHED — WD §16**, now naming all thirteen including `gob.check.ts`, which
landed with the goblin rebuild.

---

## PART 2 — WHAT THE DOCS ASSUME EXISTS AND DOES NOT

MM §12.9 started this list with nine entries. Every one verified below, and the list
completed from the other three docs. **This is the build's real scope.** Nothing here is
a defect; it is unwritten work the docs speak about in the present tense.

### Verified absent — MM §12.9's nine, all confirmed

| Item | Verified how | Spec |
|---|---|---|
| **The margin layer** — page margin, ticks, chapter numeral, 66-tick ruler | no `#margin` / ruler / numeral element anywhere in `src`; `App.tsx` renders only `#track`, the SR `<p>`, `#overlay`, `#blackout`, the captions, `#endcard`, `#rail`, `#hint`, `#play` | MM §12.10, SB §2 |
| **`uTriFlat`** (+ `uTriFlatUv`) | zero occurrences in `src`; `trilayer.ts` declares `uTriCurtain`, `uTriSeamX`, `uTriAlive` and no flat uniform | WD G7, SB §3-S7, MM §10.3/§10.7 |
| **The three-slot practicals array** | zero occurrences of "practical" in `src`; `rigs.ts` ships one fixed `PointLight` (`glow`) | SB §6 rig ruling 2, MM §10.5 |
| **Authored stroke-SVG captions** | `App.tsx:231–243` renders `<div>` text nodes in Metamorphous | MM §6.2, SB §2 |
| **`figure.check.ts`, `draws.check.ts`** | `scripts/` holds thirteen checks; neither is among them | WD §6/G1, MM A9/A10 |
| **The Picture Book** | no fallback route, no eight-frame page; `posterBake.ts` bakes the hero poster only | SB §6, MM §12.8 |
| **The `{prm, portrait}` build flags** | `buildTimeline`'s signature is `(world, camera, scene, caps)` — `timeline.ts:64–70` | MM §8.6, §13.2 |
| **`#film-skip`** | absent; only `#hero-skip` exists | MM §5, §5.2 |
| **`#sr-skip`** | absent; the SR block is a prose `<p>` at `App.tsx:219` | MM §5, §6.6 |

### Verified absent — the rest, from all four docs

| Item | Verified how | Spec |
|---|---|---|
| **`lightC`** — the second `{value}` object | zero occurrences in `src` | MM D-2, SB §3-S3 (as applied here) |
| **`bake.check.ts`** | absent from `scripts/` | WD §16, G2 |
| **`src/film/stages/surfaces.ts`** — the fixed material registry, 11 shared trilayers + ≤3 stroke variants each, ceiling 33 | file does not exist; the bake helpers are hero-scoped (`bakeIslandAlbedo`, `bakeBark`, `bakeFoliage`, `silR`, `buildGlowSprite` all live in `stages/hero.ts`) | WD G1 |
| **`src/film/stages/board.ts` + `bakeBoardMap()`** | file does not exist; `world.ts:4615–4629` is still the `GridHelper` + `boardFill` placeholder | WD G4, SB §5.1 — *"the single most product-critical asset on the site"* |
| **The ten new motion tokens** — `PAIR_GAP`, `T_NUMERAL`, `T_FLUSH`, `T_REST`, `T_STEP`, `T_SKIP`, `T_REPLAY`, `T_CURSOR_HIDE`, `BOARD_BREATH`, `FLATTEN` | none in `motion.ts` | MM §2.2 |
| **The ten §2.4 micro-constants** — `TRACK_TAU`, `PAR_DUR`, `SCRITCH_TAU`, `PERK`, `BLINK`, `SCRITCH`, `DEPTH_SHOT`, `DEPTH_TIGHT`, `WRITE_STAGGER`, `WHISPER` | none in `motion.ts` | MM §2.4 |
| **`SEAM_PARK`** — used by MM §2.2's own pair-authoring example | zero occurrences in `src` | MM §2.2 |
| **`portraitLook`** — the second authored camera target on every `A` beat (~30 of 48) | zero occurrences in `src` | SB §7, MM §8.6 |
| **The four remaining verbs** — `hop`, `hang`, `plantAndPat`, `touchUp` | absent from `actions.ts`'s exports | SB §3-S5/S6, MM §10.6 |
| **The three chapter-family key presets** — `KEY_I_NIGHT`, `HEMI_I_NIGHT`, the interior `(2.6, 3.2, 1.1)` at +38° | zero occurrences; `rigs.ts` has one `HEMI_I`/`KEY_I`/`FLAT_I` triple and one fixed key at `(4, 6, 3)` | WD §8, SB §6 rig ruling 1 |
| **`key.target` tracking `world.look`** | the target is added to the rig root and never re-aimed; the shadow box is a fixed ±8 with `far 40` | SB §6 rig ruling 3 |
| **`renderer.shadowMap.autoUpdate = false`** — and shadows at all | `<Canvas>` ships no `shadows` prop (`App.tsx:207–213`); `rigs.ts` is *"not yet wired into the film"* | MM §14.2, A13 |
| **The banked-idle system** — idles on `gobT` gated by `maskShell.scale` | `Film.tsx`'s flicker reads the world clock; `motion.ts:82`, `Film.tsx:225` and `timeline.ts:336–341` all still comment the *opposite* thesis | MM §10.4, D-14 |
| **The die's and the candles' `reveal()` targets** | six shipped reveals (`timeline.ts:491–521`); the die, the three candles and their `alive` steps are unwritten | SB §4-4 |
| **The t30 exhale at `T_EXHALE`** | `timeline.ts:550` still runs `timeScale → 1` over `T_FLICK` (0.12), not `T_EXHALE` (0.3) | SB §4-3, MM §11.3 |
| **The t12.5 tick at 0.15 t** | `timeline.ts:305` still hand-rolls `timeScale: 0, duration: 0.2` and `drain(12.5, 1, 0.6)`; neither S2's nor S5's freeze calls the named `tick()` recipe | WD §11, SB §3-S2-B2 (closes FINDINGS P1-T3 / P2-T4) |
| **The six relative→absolute tween conversions** | all six still ship: `timeline.ts:268`, `:269`, `:570`, `:573`, `:872`, `:937`, `:962` | MM §2.3, §13.2, A5 |
| **`repeat: 12` → odd** | `timeline.ts:573` still rests the rope 0.15 above its authored base | MM D-19 |
| **The `stagger:` removal** | `timeline.ts:915`'s flat `stagger: 0.05` is still the flatten's cascade | MM §2.3, SB §3-S7 |
| **The drawn double-line focus rectangle** | `styles.css:487–488` is still `outline: 2px solid var(--line)`; `#play` still carries `mix-blend-mode: difference` on the button itself | MM §5.1, D-9 |
| **Guarded `:hover`** | `styles.css:286` and `:394` are unguarded | MM D-10 |
| **`#endcard-cta { pointer-events: auto }` deleted + `inert` on `#endcard`** | `styles.css:230` still ships it; `CTA_IS_LIVE` exists but the anchor renders anyway | MM §5.2, D-18 |
| **`#play` moved above `#overlay`** | `#overlay` is `App.tsx:229`, `#play` is `:341` — the required tab order is impossible today | MM §15.2 step 15 |
| **PRM play mode stepping anchor-to-anchor** | the loop still runs `window.scrollTo` per rAF frame under PRM — **a live WCAG 2.2.2 / 2.3.3 defect on main**, not a plan | MM §13.4, D-16 |
| **`prmAmbient()` in `Film.tsx`** | `Film.tsx:17–20` still computes `AMBIENT` at module scope, so a live PRM flip never reaches the film | MM D-3 |
| **`portrait` track sizing (~950vh)** | `styles.css:65` is a flat `1800vh` with no media query; `gearing.ts:12` marks it *P14 scope* — **every phone-flick conclusion in MM §7.2 and §15.2 step 11 rests on this unbuilt number** | MM §7.2 |
| **The world direction's whole v2 art surface** | none of it exists: no island cards for the film body, no class bakes, no merged flora stands, no theatre machinery, no window view set, no god-ray cones, no islets, no eraser ghosts, no scribed arcs, no mug rings, no erased-contour pair, no dust scribble sprite, no NPC based miniature, no brush + pigment pot. `world.ts`'s eight v1 stage builders are unchanged | WD §9, §13; SB §6 |

### One gap no doc books

**Metamorphous is a fourth voice, still shipped, and nothing retires it.** WD §4 declares
"Three voices. No fourth" — the Hand, Cinzel, Vollkorn. But `@fontsource/metamorphous` is
a live dependency and Metamorphous sets **every caption** (`styles.css:101`), **`#play`**
(`:385` — WD §4 assigns play/pause/replay to Cinzel), **`#hint`** (`:348` — WD §4 assigns
it no voice at all), and two elements of the shipped, verified Cover (`hero.css:200` the
hero tagline, `:247` the meta line). Retiring it from the film body is implied by the Hand
replacing the captions, but **the `#play`, `#hint` and Cover reassignments are unwritten
work in no doc's bill, and dropping the dependency is nobody's task.** Booked here.

---

## PART 3 — TRACKED, NOT PATCHED

Real, minor, and deliberately left alone with a note rather than an edit.

1. **MM §2.3 counts "six relative tweens" over seven call sites** (`timeline.ts:268` and
   `:269` are two tweens, one named item; `:937` writes x and y in one tween). Six *items*
   is self-consistent; the grep in A5 catches all seven regardless. No change.
2. **MM D-8's routed rule wording** belongs to `docs/2026-09-02-motion-system.md` §8,
   which is outside this pass's edit scope (four binding docs only). Still routed,
   unapplied: *holds meet the reading floor except inside the `me*` punch cluster, where
   the four rest anchors, the touch soft rests, the keyboard stepping and the verbatim SR
   transcript carry it.*
3. **MM D-14's three shipped code comments** (`motion.ts:82`, `Film.tsx:225`,
   `timeline.ts:336–341`) still assert the pre-banked-idle thesis. They are source, not
   doc, and this pass edits no source. They must be rewritten in the same commit as the
   first banked idle, as D-14 requires.
4. **WD §11's "motion §14" cross-reference** points at `docs/2026-09-02-motion-system.md`
   §14, not the new motion doc's §13. Correct as written; noted because it reads like a
   typo.
5. **The per-mesh material census arithmetic is sound.** Re-added: S1 0 + S2 0 + S3 4 +
   S4 3 + S5 2 + S6 4 + S7 13 + S8 1 + the goblin 1 = **28 of 40**, and the running
   in-beat numbering (#1–#13 through S6, then "of the S7 block") is internally consistent
   with the S5 handoff's "9 of 40 + the goblin = 10". No change.
6. **The beat count is sound.** 5 + 5 + 7 + 6 + 8 + 7 + 7 + 3 = **48**, matching SB §3,
   §7's phone table and MM's "48 beats". No change.
7. **The seventeen rest anchors match** between SB §2 and MM §7.5, name for name. No change.
8. **The nine page turns match** between SB §4-5 and MM §11.5, mark for mark, and are
   consistent with the six montage cuts at `50 + i·1.25`. No change.
9. **The gearing table matches the code.** SB §1's shares and MM §7.2's per-notch figures
   both reconcile with `gearing.ts:44–54` and `HERO_SHARE = 0.035`. No change.
10. **WD §9's board-tier line span (`4337–4351`) and SB §3-S8-B1's (`4337–4385`) differ**
    from each other as well as from the code. Folded into ruling 29's by-name instruction
    rather than reconciled digit by digit.
