# THE SCENE BOOK — the shooting script for the film body

2026-09-03 · Stages 1–8, beat by beat · the persistent interface · the conversion surface.
Experience director of record. **This document is binding.** Where it disagrees with any
scene-direction chapter, this wins. Nothing below is an option.

---

## 0. STATUS

### What this binds

Every beat of the film body (t0–66), the persistent interface layer, the transition grammar, the
asset bill, the phone contract and the accessibility contract. The build works from §3 (beats), §6
(assets) and §4 (transitions). It re-litigates nothing.

### What it inherits, unchanged

| Inherited | Authority | Status |
|---|---|---|
| The narrative and every story beat | `docs/story.md` | LOCKED |
| Every on-screen word, all eleven captions, the endcard block | `docs/copy-spec.md` | LOCKED, VERBATIM. **[ERRATA 2026-09-03, motion doc D-17 applied — eleven, not twelve: `copy-spec.md:25–37` lists eleven caption rows and row 12 is the endcard *block*; `App.tsx:35–49` ships eleven; `ASSETS.md` already reads "eleven narration captions plus the endcard tagline". Corrected in all four places in this book.]** |
| Runtime `t = 66` | `motion.ts:25` | Fixed |
| The scroll↔t gearing map, nine stage rows, stage boundaries | `gearing.ts:44–54` | Fixed. **This book restages art, never time.** |
| Two clocks — `world.t`/`timeScale` freezable, `gobT` never stops | motion doc §4 | Fixed |
| The seven-transition catalog | experience doc §7 | Fixed. No eighth is invented. |
| THE KEPT WORLD — core concept, four flagships, palette, composition, materials, lighting, asset register, gap closures G1–G7 | `docs/2026-09-03-world-direction.md` | LAW, except the four amendments below |
| The shipped hero and its kit | `hero.ts`, `heroLife.ts`, `trilayer.ts`, `rigs.ts`, `islandKit.ts`, `palette.ts` | Verified; the quality bar |
| The goblin's body, build, rig and materials | `docs/2026-09-03-goblin-design.md` | LOCKED. This book stages him; it does not design him. |

### What it supersedes

- **`docs/build/direction/SCENE-S1-S3.md`, `SCENE-S4-S5.md`, `SCENE-S6-S8.md`.** All three are
  closed. Their surviving content is here, reconciled.
- **Experience doc §6's S2-out sentence** ("color floods back along his walk direction"): no frontier
  exists in S2. Superseded by §3's S3 staging.
- **Experience doc §6's S6-out "match-dissolve" and "the cliff in the distance"**: the catalog has no
  match-dissolve, and the cliff sits at x ≈ 120 while the montage faces −z. S6→S7 is the page turn;
  the dawn sky does the handoff.
- **Chapter Three's R1 and R2** (tree-planting demoted to dressing, `plantAndPat` on the NPC base).
  §3-S6 restores the tree as vignette 3 on its own shipped solve and gives `plantAndPat` its literal
  sapling. **The chest vignette is cut instead.**
- **Chapter One's radial lantern pool and its t25.4 world-scale seam release.** Both are replaced by
  §3-S3's frontier staging, which is the only construction the shipped shader permits.
- **Copy-spec's Metamorphous assignment for the endcard tagline and subline**, superseded by the
  direction's §4 voice table. Every word, line break and size clamp in copy-spec stands unchanged.

### The four amendments to THE KEPT WORLD, made here and closed

Each is a one-line change, forced by the shipped code, and each is stated so that the direction and
this book agree:

**[ERRATA 2026-09-05 — CLIENT RULING, and it supersedes amendment 1 below.** `rig.seamX`
is PARKED at `1e6` for the whole film, not only for S7. It was never wired on this
timeline in the first place — `timeline.ts` has zero writes to it — and because
`heroLife.ts:548` drains it to `BLANK_X = −3.4` at the handoff and nothing put it back,
every trilayer reading the shared rig rendered GRAPHITE for the entire run. The film had
never shown most of its own paint. **The frontier grammar now appears in exactly ONE
place: S7's flatten**, as the per-prop ramp. S3's lantern keeps its beat and its thesis
image — see the S3 state schedule and S3-B3 — but it is carried by `reveal()`'s mask
shells plus the global curtain, which is what has always actually been on screen. The
global curtain alone drives painted-versus-drawn from the film's first frame on.]**

1. **§7's "the seam appears in exactly two places" becomes: the frontier grammar appears in exactly
   two places — S3's lantern (as the `rig.seamX` uniform, island-scale) and S7's flatten (as the
   per-prop `uTriFlat` ramp, world-scale).** `rig.seamX` is parked at `1e6` for the whole of S7.
   Reason, from the shader: `triSeamF = smoothstep(seamX−w, seamX+w, vTriWorld.x)` and
   `triC = max(uTriCurtain, triSeamF)` (`trilayer.ts:276–299`) — fragments **east** of `seamX` are
   Prep, and the seam can only ever *add* Prep. Driving S7's flatten off `seamX` would render the
   standing miniature world graphite and would flip the world's east half to Prep in one frame at
   t60. S7's frontier texture is authored into the flat ramp instead (§4, *the flatten*).
2. **§7's funded `seamDir: Vector3` promotion is declined.** Nothing in the film needs a non-x
   frontier basis: S3's path ribbon runs +x, and S7 uses no seam. The two-file change stays specified
   in the direction; it is not built. **Its budget goes to the practicals array (§6, the rig), so the
   rig extension count is net-neutral.**
3. **§6's "90° straight-down exists only at the board (S8)" becomes: straight-down is legal only where
   the frame's content is the finished map — S7 from t62, and S8.** It never frames a standing world.
   The shipped `cam(62, 2.5, [145,40,0.01] → [145,0,0])` stands.
4. **§10's "tilt-shift DOF at exactly two moments" becomes: the depth-to-paper ramp
   (`rig.depthNear`/`depthFar`) tightens for exactly two moments — the S5 die macro and the S7 rise.**
   There is no DOF pass anywhere in `story/src`, and experience §10 budgets **one** post pass (the
   curtain). Same two beats, same intent, shipped machinery.

### The one mechanical ruling everything else rests on

Three separate mechanisms carry Performance↔Prep. They are not interchangeable, and the whole film's
staging follows from which one is doing the work:

| Mechanism | What it is | Scope | Scrub-safe |
|---|---|---|---|
| **`curtain.value`** | the post pass (`curtain.ts`) **and** every trilayer's `uTriCurtain` — the same `{value}` object | global, everything on screen | yes, it is a tween |
| **`material.userData.alive`** | per-material `uTriAlive`; `triC = max(curtain, seam) × (1 − alive)` | one mesh; **keeps paint whatever the curtain or the seam does** | yes, as a **paired `tl.set` step** — never a ramp (colour law 2 bans half-tinted objects) |
| **`rig.seamX`** | the in-material frontier; **Prep is east of the line** | trilayer surfaces only; meaningless while `curtain = 1` | yes, a position tween |

Therefore: **the touch reveal is `reveal()`'s mask shell growing (`curtain.ts:110`) plus a stepped
`alive` flip on the same mark** — the shell is what the audience sees, the flip is what makes the
pixels under it colour. And **a frontier can only exist while the global curtain is 0**, which is why
S3's lantern is where the global curtain drops.

---

## 1. THE JOURNEY AT A GLANCE

| # | Stage | t | Scroll | Argument | The image they remember |
|---|---|---|---|---|---|
| 1 | **The Claim** | 0–10.2 | 14%¹ | *This is the night you remember — and one goblin always gets away.* | A tiny goblin on a dusk cliff rim with three arrows and a wizard's bolt converging on him |
| 2 | **The Address** | 10.2–16.5 | 12% | *This world was decided, not found — and revised.* | The world stopped as pencil, one painted goblin looking up into the lens, and beside his head a contour rubbed out and redrawn |
| 3 | **Proof of Light** | 16.5–26.5 | 16% | *Someone lights the world, prop by prop.* | The lamppost catching, and morning arriving behind him with a tide-line at its foot |
| 4 | **Proof of Scenery** | 26.5–36 | 12% | *The machinery is old because it has always worked.* | A whole forest turning away on a planked disc while he hangs off a rope |
| 5 | **Proof of Time** | 36–50 | 20% | *He does not just build the room; he saves the night in it.* | One painted goblin on a bench in a graphite room, casting the only shadow, nudging a die |
| 6 | **The Many Jobs** | 50–57.5 | 8% | *This is not one heroic night. This is the job.* | Six workbook pages, six one-gesture jobs, no words |
| 7 | **The Handover** | 57.5–64.5 | 12% | *You already believe it — and the ledger it was kept in is a map.* | The world lying down into a Good Goblin map under a rising camera |
| 8 | **The Table** | 64.5–66→rest | 6% | *The ledger is yours, and it is the product.* | A real map with tokens on it, four lines of type, one warm button |

¹ 14% minus the hero's share (`gearing.ts:45`), which the Cover owns.

**The belief ladder:** attention → recognition → affection → promise (light) → promise (scenery) →
delight (time) → breadth → category comprehension → action. A visitor who leaves at stage N leaves
with belief N. The sheet is ordered so a fifteen-second visit still teaches *the goblin that got away
runs the world.*

**The four flagships, by beat id — and nothing else is one:**

| # | Beat | Mark | Framing it gets |
|---|---|---|---|
| 1 | **S2-B3** — the erased, redrawn cliff contour | t13.35–14.3 | the direct-address medium close-up, inside the S2 freeze |
| 2 | **S4-B5** — the scribed arcs in the apron bed | t33.1–34.3 | the flicker's one held frame, inside the S4 tick |
| 3 | **S5-B4** — the graphite mug rings | t41.3–42.6 | the freeze's table-level medium, near plane at reading scale |
| 4 | **S7-B1** — the tended cairn | t57.5–58.3 | the S1 angle-echo, held 0.8 t on the hard cut |

**The four eraser-ghosts, by beat id — exactly four, one per flagship's supporting cast:** S2-B3 the
boulder's prior-position ellipse · S4-B5 the tree's prior-position ellipse on the disc's bare half ·
S5-B4 the tavern door's previous swing arc on the boards · **S7-B2** the erased scorch-ring beside the
cairn (sited in B2, not B1 — see §3-S7). **An eraser ghost is the prior position of a thing that is
still in frame.** The S3 cave door's "previous swing arc" is deleted — it was the same designed mark as
the tavern door's, under a second name. The mushroom patch's last-season ring is **history/wear**, not a
ghost, and stays.

---

## 2. THE PERSISTENT INTERFACE LAYER

All DOM, above the canvas, `pointer-events: none` except the three controls. Never over a set piece.
Crisp at any DPR, selectable, in the accessibility tree.

| Element | Where | States and behaviour |
|---|---|---|
| **Page margin + ticks** | viewport edge, 24–40 px | Whisper ≤4% ink during Performance; **breathes to full over `T_BEAT` (0.4 s) at every tick and un-breathes at every exhale**. Breathes at **t12.6, t33.2, t40.7** — the tick's mark **+0.1 t**, as §3-S5-B3 already says (ERRATA 2026-09-03: this row named the ticks themselves); un-breathes at t30.0, t34.3, t47.0. One element, one opacity, `WHISPER (0.04)` ⇄ 1. The sheet the world is drawn on. |
| **Chapter numeral** | top-right margin | Penciled `C1`…`C7`, 300 ms cross-fade. **Flips: C1→C2 at 16.5 · C2→C3 at 31.5 (with the sky) · C3→C4 at 37.6 (inside the walk-through's darkness) · C4→C5 at 49.5 · C5→C6 at 57.5 (on the page turn) · C6→C7 at 64.5 (on the morph).** |
| **66-tick progress ruler** | bottom margin | 66 fine ticks; passed ticks ink in, future ticks stay graphite. Same whisper/breathe rule. At 26.5 it reads ~40% inked. Through S6 it visibly accelerates — the interface says "montage tempo" without a word. |
| **Captions** | lower-third band, on the margin system — **except the four `me*` lines, which seat at 24%** | The Hand's authored stroke SVGs, **same element ids as today** so every `cap()` call drives them unchanged. **[ERRATA 2026-09-03 — `App.tsx:31–34` and its `high: true` flag are the shipped, ledgered fix: in the t10.2–16.5 to-camera freeze the lower-third band crosses his tunic at **3.54:1**, under the 4.5:1 caption floor, so `me1`–`me4` seat at 24% of viewport height instead. This is a per-caption authored property, checked at every breakpoint, never a runtime decision. Corrected at §3-S2-B2 and §3-S2-B3 too.]** Write on stroke-by-stroke ~15 strokes/s; un-write on reverse. **One at a time, ever.** Graphite while `curtain > 0.5`, ink below it — the flush is a 200 ms per-stroke colour crossfade **keyed off the curtain value, never a parallel tween**. ≥4.5:1 on their band at every breakpoint. |
| **play / pause** | bottom-left, Inscription small caps | ≥44 px. Play drives the same scrub at 1 t/s; any input pauses instantly; `visibilitychange` pauses; it never loops. Swaps to **replay** at t64.5. |
| **skip note** | bottom-right margin | *skip to the table ↓*, Quiet Serif, penciled in **exactly at t16.5** — never earlier. Eases to the endcard in 1.2 s (reduced motion: jumps). Hidden from t64.5. Also on the Cover for returners. |
| **scroll hint** | centre-bottom | Cover only; dies on first input, never returns. |
| **© line** | endcard bottom margin | `© 2026 Good Goblin`, Quiet Serif, 4% ink. The only footer. **The endcard "meta line" retires** — direction C is "no box, nothing extra", and it has no source copy in `copy-spec.md`. |
| **Cursor** | — | System default. Auto-hides after 2.5 s of stillness in play mode; any movement restores it. No custom cursor, no trails. |

**Behaviour during the film.** The layer never moves, never animates on its own, and never occludes a
subject. Its only expressive act is the whisper/breathe pair, which is a *state change of the sheet*,
not decoration: during a freeze the file is open and the page is legible; during Performance the page
gets out of the way. The boil is UI-side only, ≤0.8 px, at rest only, never mid-write, off under
reduced motion. **World strokes never boil** — the stroke tiles are baked and still, and that stillness
is what the freezes read against.

**Accessibility contract for the layer.**

- The **SR document is first in DOM**, visually hidden, and is the film's canonical transcript: *Skip
  to joining the Discord* → the eleven captions verbatim, in order, with one-sentence scene
  descriptions between them → the endcard tagline and subline → the real Discord link as a real `<a>`.
  The canvas is `aria-hidden="true"`. **SEO reads this document, not the canvas.**
- **Keyboard:** `Space` play/pause · `↓/↑` step rest anchors · `PgDn/PgUp` chapter · `Home` cover ·
  `End` endcard · `Esc` de-escalates play mode. Tab order: SR skip link → play/replay → skip note (when
  present) → CTA. No traps.
- **Focus** renders as the drawn double-line rectangle (the CTA's offset-border language), never the
  browser default, never suppressed.
- **Contrast floors, binding:** captions ≥4.5:1 on their band; interface ink ≥3:1 in its *breathed*
  form; the grid ghost ≤`GRID_INK` (0.04) toward ink. Whisper states are always redundant — never the
  sole carrier of information.
- **The seventeen rest anchors** (`↓/↑` steps, and the touch soft-rest targets): open2 · me1 · me2 ·
  me3 · me4 · lantern · mushroom-stop · world-return · set1 · mountain-reveal · nat-1 · look-at-us ·
  the-20 · welcome · tended-cairn · between-pitches · endcard. **S6 has none, by design** — the one
  stage that rewards momentum; `PgDn` jumps it. **No anchor ever lands mid-void** (the S3-B1
  travel-line window is anchor-free).
- Soft rests are touch-only, ±0.35 t, 220 ms ease, cancelled by any input, off on desktop, off under
  reduced motion.


---

## 3. STAGE BY STAGE, BEAT BY BEAT

**[ERRATA 2026-09-03 — every `world.ts` line reference in this section and in §6 is ~278 lines low.
`world.ts` is now **4756** lines (the goblin rebuild landed). Moved landmarks:
`earthPlane`/`grassPlane` 2244–2254 → **2522–2532** · `buildFinger` 2888–2918 → **3168+** ·
`buildTavern` 2921–3388 → **3201+** · the rope 2802 → **3080** · the montage discs 3396 → **3674** ·
the monster's shag 3532–3563 → **3803–3835** · `GridHelper` + `boardFill` 4337–4385 → **4615–4629** ·
`buildCliffWorld` 3905 → **4183** · `miniWorld` 4125–4313 → **4403+**. **`actions.ts` verb refs are
20–115 lines low** (`plantFor` 177 → **200** · `look` 294 → **322** · `peek` 349 → **420** · `haul` 412
→ **504** · `shrug` 431 → **528** · `nudge` 460 → **568** · `dustOff` 470 → **584**). `timeline.ts`,
`curtain.ts`, `trilayer.ts`, `rigs.ts` and `App.tsx` refs are all still accurate to ±2. **Read every retirement and
every kept mark by NAME; the line numbers are provenance, not addresses.**]**

Nine fields per beat: **ARGUMENT · MESSAGE · VISUAL · 3D · GOBLIN · INTERACTION · ANIMATION ·
OUT · KEEPING.** Every t-mark that exists in `timeline.ts` today is inherited; new marks are
flagged `NEW MARK`. Camera entries give position → target and the elevation they solve to; the
bench clamp (20°–75°) holds in every shot. `A` = acting beat (figure floor applies), `E` =
establishing (exempt). **This flag is the source of truth for `scripts/figure.check.ts`.**

---

# STAGE 1 — THE CLAIM · t0–10.2 · C1 · Performance, genuine night

Five beats. Tense: *shared memory, inverted*. **State:** `curtain = 0`, `timeScale = 1`,
`seamX = 1e6`. Air `skyDusk #6D78AE`; key = the campfire, exterior-night family: the same
**`DirectionalLight`** as the day family at the same **+18° screen azimuth**, lowered and
dimmed — `KEY_I_NIGHT = 0.55`, `HEMI_I_NIGHT = 0.35` (§8). The cliff is baked once for the day
family and takes the night at reduced intensity, which is exactly why the azimuth holds.
`Film.tsx:100`'s `0xffb45e` point light is deleted; practical light is the amber ramp.

**Deleted on this stage's watch:** `earthPlane`/`grassPlane` (`world.ts:2244–2254`), the
flat-fill treeline rows, the band-plate horizon, the rock-face hatch (`world.ts:1573`), and the
`camp` children-filter coupling (`world.ts:1759–1763`, replaced by an explicit island group).
**`onlyFor(world.camp, 0, 18)` becomes `onlyFor(world.camp, 0, 16.4)`** — the camp must vanish
inside the void hop's anchorless window, not mid-S3 on another island.

## S1-B1 · t0–4.0 · BLACK · E

1. **ARGUMENT.** *This film speaks my game, and the page obeys me.* The visitor caused this
   blackout by leaving the Cover; scrolling up un-causes it.
2. **MESSAGE.** `open1` — **"Every campaign begins the same way…"** — at the shipped
   `cap('open1', 0.5, 2.5)` (`timeline.ts:171`). Write-on 0.5, holds to 3.0, un-writes by 3.4.
   White strokes on the blackout — the film's only white-on-black type. Lower-third band.
3. **VISUAL.** `#blackout` at full. The caption *is* the frame. Margin at whisper. This is also
   the streaming absorber: a slow line holds black one beat longer, and the pencilled
   *sharpening pencils…* margin note past 3 s is the only legal stall surface. **No spinner.**
4. **3D.** Nothing on screen. Behind the black, staged exactly as the shipped `tl.set` block
   (`timeline.ts:186–195`) so a reverse scrub into black always finds the stage set: camp island,
   cliff island, campfire kit, camp kit, adventurer trio, arrows + shield + bolt. Per G2 the
   Cover's idle has already kicked S1's class bakes.
5. **GOBLIN.** Staged, unseen: `settle` + `express('neutral')` at t0, on the cliff rim at the near
   lip, facing the party.
6. **INTERACTION.** Scroll only, geared tight. The responsiveness *is* the caption: it writes and
   un-writes 1:1 with the thumb.
7. **ANIMATION.** Master only — the write-on. World clock runs; nothing visible rides it. Reverses
   by construction.
8. **OUT.** None — B2 is the same shot; the blackout begins lifting at 4.0.
9. **KEEPING.** None, deliberately. The black is the withheld file.

## S1-B2 · t4.0–5.5 · THE LIFT · E

1. **ARGUMENT.** *Someone already worked this night.* The first image is residue, not battle:
   dropped kit, arrows standing in rock, a fire someone laid.
2. **MESSAGE.** None. Carried by the campfire being the frame's only warmth and by the residue
   reading as *arranged*, not scattered.
3. **VISUAL.** `#blackout` fades 4.0–5.5, `power2.inOut` (`timeline.ts:198`, kept). Camera
   `[100, 7.5, 6] → [114, 3.2, 0]`, **elevation ≈24°** (restaged from v1's 9° up-shot).
   Foreground: three adventurer backs anchoring the bottom edge on the camp island. Middle: the
   paper gap between the islands — both cut edges showing a bright 2–3 px painted lip over
   sectioned strata. Far: the cliff island as a dusk-lit mass, one small goblin at its rim,
   reading against the island's own stone. **Nothing silhouettes against "sky"** — the paper
   beyond ramps in-material. The sheet-edge rule is satisfied twice.
4. **3D.** Camp island (N) · cliff island (N, shared with S2/S7) · campfire kit (R) · camp kit
   bedroll/pack/spear (R) · adventurer trio (R, `cloakIndigo` ×2 + `cloakCrimson`,
   silhouette-first, painted cloaks, zero interior hatch) · arrows ×3 in rock + dropped shield (R)
   · ember particles (R, world clock) · cloud/streak flats (R, atmosphere only) · rock kit dressing
   merged one `BufferGeometry` per class per island. **Per-mesh materials: none.**
5. **GOBLIN.** He holds the rim — `peek` (`actions.ts:349`) over the lip rock, ears up.
   Story-locked: *one tiny goblin peeks around a rock.* No path, no touch.
6. **INTERACTION.** Scroll only. The frame answers with real-plane parallax as the scrub eases;
   embers answer on the world clock without input.
7. **ANIMATION.** World clock: fire flicker (`FLICKER`), ember drift, cloth. Master: the fade and a
   slow authored settle into the wide. The fade mirrors; no reverse recipe needed.
8. **OUT.** None — continuous into B3.
9. **KEEPING.** The evidence, unattributed: the laid fire (ring of stones, cut logs), the arrows
   *in* the rock as painted strokes, the kit arranged the way a camp is struck. Cart-rut wear enters
   the camp island's edge and **stops where the pencil line stops**. Planes two and four; never
   captioned.

## S1-B3 · t5.0–7.5 · THE VOLLEY · A

1. **ARGUMENT.** *This is THE goblin — the one from my table.* The party's reaction turns "an
   ambush" into "that ambush."
2. **MESSAGE.** None. Aim carries it: every projectile converges on the rim, so the tiny figure
   becomes the subject without a cut.
3. **VISUAL.** The B2 wide **tightens to a rim medium as the first bolt leaves** — this is an acting
   beat and the flinches are the acting, so the volley is not exempt. Camera eases
   `[100, 7.5, 6] → [108.5, 7.0, 4.4]`, target `[117.2, 5.4, 0]`, **elevation ≈22°**. The party
   reduces to two shoulder shapes at frame bottom; the bolt enters from below-left as a bright
   painted stroke crossing the paper void; a `rayGold` burst on each impact near the rim. Two thrown
   arrows follow. Impacts are painted marks landing on the cliff's painted face; scorch is **painted
   dark pooling**, never crosshatch.
4. **3D.** As B2, plus the bolt streak prop (R — metal grammar: matte gouache, one authored glint, no
   specular), `impacts[0..1]` `rayGold` cones (R, shipped `boltThrow`/`arrowThrow` recipes,
   `timeline.ts:205–223`, marks kept: 5.0 / 5.9 / 6.3 / 6.6), `arrows2` ×2 (R). No new assets.
5. **GOBLIN.** `flinch` composite at 5.55 and 6.85 (kept, `timeline.ts:227–235`): `crouch` 0.3 +
   `look` down + `express('alarm')`, recovering each time. A duck, not a stagger — his feet never
   move until the leap.
6. **INTERACTION.** Scroll only. The volley is scrub-tied ray-bursts, so dragging back literally
   un-fires the wizard — the film's first taste of the projectionist's power.
7. **ANIMATION.** Master: bolt arcs (0.3 out + 0.3 in per throw), impact pops (`PUPPET.pop` in,
   `SETTLE.exit` out), flinches, the camera tighten. World clock: fire, embers, cloth, unbroken.
   Reverses cleanly — position tweens with `tl.set` visibility flags.
8. **OUT.** **The page turn** at t7.5 — the first of S1's two licensed cuts. One camera `cut()` under
   one frame of paper; both islands persist. Cost: zero.
9. **KEEPING.** These same arrow strikes are the "remains" the tended cliff clears in S7. The film
   plants its own future evidence here.

## S1-B4 · t7.5–9.5 · THE RIM — glance, line, leap · A

1. **ARGUMENT.** *"…and one goblin always gets away" — and this film is his.*
2. **MESSAGE.** `open2` — **"…and one goblin always gets away."** — `cap('open2', 8, 1.6)`
   (`timeline.ts:243`): write-on 8.0, held to 9.6, un-writing over the landing cut. Ink strokes on
   the lower-third band, which at this framing sits on the cliff-top's quiet painted ground. Timed so
   the last words sit under the leap.
3. **VISUAL.** Rim medium: camera `[113.5, 9.2, 3.4] → [117.6, 6.2, 0]`, **elevation ≈28°** — we lean
   over the rim with him. Foreground: the rim's drawn contour and the lip rock. Middle: the goblin,
   full figure, **left third** — this is not a direct address. Far: the plateau running to the far
   edge, then paper. One more bolt impact (`impacts[2]`, mark 8.1 kept). The leap reads in silhouette;
   no face acting required.
4. **3D.** Cliff island — the star of the frame: strata as **contour steps**, three quantized tiers,
   section bands at every cut, drybrush on climbable edges only. `impacts[2]` (R). No party in frame.
   No new assets.
5. **GOBLIN.** Marks kept (`timeline.ts:241–265`): `look` down 7.6 + `express('strain')` · **`look`
   toward lens 7.75–7.95 from three-quarter, half a beat — NEW MARK** (restored from experience §6
   S1; *not* dead-centre, thirds hold — this is the plant for S2's address) · `crouch` flinch on the
   8.1 impact + `express('alarm')` · turn 8.3 · `bolt` sprint unload 8.35 · `express('neutral')` — he
   is commuting, not panicking · the three-tween leap arc 8.4→9.5 (run, rise, fall) with
   chest/pelvis/ear follow-through.
6. **INTERACTION.** Scroll only; a touch soft-rest sits on the `open2` anchor. Reversing pulls him
   backward up out of the void, which is correct and funny, and costs nothing.
7. **ANIMATION.** All master: impact pop, glance, turn, sprint (gait via `goblin.speed`, cycled by
   `gobT`), leap arc, ear flaps. World clock: dusk ambience only. The leap's three position tweens
   mirror exactly.
8. **OUT.** **The page turn** at t9.5 — S1's second licensed cut; it hides the fall. Cost: one camera
   `cut()` + a goblin `tl.set` to the landing pose under the flash.
9. **KEEPING.** The rim carries the ruts of every previous crossing — a rubbed patch at the lip where
   he always lands, drybrush where hands go. Second plane; discoverable on scrub-back.

## S1-B5 · t9.5–10.2 · THE LANDING — crumpled · A

1. **ARGUMENT.** *He is real, fallible, and endearing.* The legendary escape ends in a dust puff.
   Affection begins here.
2. **MESSAGE.** None (`open2` finishes un-writing over the first frames). The meaning is the gap
   between the legend just captioned and the heap on the ground.
3. **VISUAL.** Camera `[129.5, 2.6, 3.4] → [126.5, 0.5, −0.5]`, **elevation ≈26°**, looking down.
   Foreground: ground and one boulder. Middle: the goblin crumpled centre-right, dust rising. Far:
   the cliff's base going up out of frame, its edge and the paper void frame-left. **The chapter's
   darkest painted state, one value step of air above `caveDark`** (colour law 5). The darkness is
   *composed and baked* — hemisphere at `HEMI_I_NIGHT` plus contact darkening in the island albedo —
   **not** light falloff; the key is a directional and has none.
4. **3D.** Cliff island far side (same asset) · dust puff from the particle language (R,
   Performance-side flats — this same dust must freeze as graphite at the S2 tick). No other props.
5. **GOBLIN.** `tl.set` landing pose under the page turn (kept, `timeline.ts:269–273`): full `crouch`
   0.92, `look` down, `express('strain')`. He holds the heap through the stage boundary — the get-up
   belongs to S2.
6. **INTERACTION.** Scroll only. The frame's responsiveness is the dust settling 1:1 with the scrub.
7. **ANIMATION.** Master: dust puff scale in/out (marks 9.55–9.88 kept). World clock: night ambience.
   The page turn replays backward gracefully — paper, never black.
8. **OUT.** None — S2 begins at 10.2 in the same shot, on his first weight-shift. The boundary is a
   gear change, not a cut.
9. **KEEPING.** The ground shows the rubbed patch of every previous landing — the same wear vocabulary
   as B4's rim, now at reading distance. *He has done this exact fall before.*

---

# STAGE 2 — THE ADDRESS · t10.2–16.5 · C1, flipping to C2 at 16.5 · Prep

Five beats. The file opens: first freeze, first underdrawing, first revision mark, the grid — the
oldest layer. **Direct address #1** (dead-centre is licensed here and at *"You're welcome."* only).
**State:** `curtain 0 → 1` at the tick, held at 1 through the stage; `timeScale → 0` at 12.5 and held
at 0 until t30; `seamX = 1e6` — **no frontier in S2**. Prep is flat paper light, **no key**; his
contact shadow (`rig.aliveShadow` 0.3) is the only shadow in the frame.

## S2-B1 · t10.2–12.5 · UP, AND DUSTED OFF · A

1. **ARGUMENT.** *He survived — and we are alone with him now.* The social contract shifts from
   watching a party to following a goblin.
2. **MESSAGE.** None. Carried by the acting: the get-up is unhurried. Nobody who just escaped death
   dusts off this calmly — the calm *is* the mystery `me1` is about to name.
3. **VISUAL.** The B5 shot easing closer as he rises: `[129.5, 2.6, 3.4] → [128.2, 1.9, 2.6]`,
   elevation held ≈24°. He gets up, weight-shifts, dusts himself off; the dust of the gesture rises
   around his knees. Night Performance still. He sits right-of-centre, leaving the left third for the
   cliff base's drawn edge.
4. **3D.** Cliff island · dust motes (particle language, Performance flats — these exact motes are
   about to be frozen). No new assets.
5. **GOBLIN.** Marks kept with one restage: `weightShift` 10.2 · `crouch` release 10.2–10.7 · `settle`
   10.6 · `express('strain')` → `look` level 10.6–11.0 (`timeline.ts:279–283`). **`dustOff` moves from
   11.2×0.9 to 11.4–12.55 — NEW MARK**, so the tick at 12.5 catches the last brush mid-stroke
   (experience §6 S2's "Mid dust-off: the tick", which v1 missed by 0.4 t). He finishes the wipe
   *inside* the frozen world — the film's first proof that he is exempt.
6. **INTERACTION.** Scroll only. The address cluster's soft-rest anchors arm here on touch.
7. **ANIMATION.** Master: get-up chain, dust-off, camera drift, all scrub-tied with `power2.out`
   settles. World clock: night ambience, dust drift. Reversible as-is.
8. **OUT.** **The tick** at t12.5 — instant, never eased, never announced.
9. **KEEPING.** None staged. Deliberately evidence-quiet so the tick's reveal lands with nothing
   pre-spent.

## S2-B2 · t12.5–13.35 · THE TICK · "That was me." · A

1. **ARGUMENT.** *The narrator is the goblin, the film can stop time, and I am backstage.* Three
   beliefs in one frame: identity, mechanism, privilege.
2. **MESSAGE.** `me1` — **"That was me."** — `cap('me1', 12.6, 0.55, T_PUNCH)` (`timeline.ts:306`).
   Graphite strokes (the Hand under Prep), **the 24% band — not the lower third** (ERRATA 2026-09-03:
   `App.tsx`'s `high` flag; the lower third crosses his tunic at 3.54:1 through this whole cluster),
   write-on as his eyes find us. The four
   `me*` lines run at punch fades, spaced so no two are ever on screen together.
3. **VISUAL.** The tick: same frame, the world lifts to its underdrawing in **≤0.15 t** —
   `timeScale → 0` **and** `curtain → 1` on the same cue (tightened from v1's 0.2 t, closing FINDINGS
   P1-T3 / P2-T4). The cliff becomes contour strokes with construction ellipses and measure ticks;
   **the dust of his dust-off hangs mid-air as a graphite scribble sprite**; beneath the ground the
   **grid** ghosts in for the first time at ≤`GRID_INK`, running a few cells past the island rim onto
   the paper. The margin breathes to full over `T_BEAT`. He stays painted — **the frame's darkest
   committed value, its only cool hue, and its only warm accent in the two amber eyes** (ERRATA
   2026-09-03: goblin §4.1/§4.2 supersede "the loudest chroma"; his cloak is `gobCloak #2E3742`) — and
   casts the frame's only shadow. **No key exists in Prep; a drawing casts none.** The
   push-in begins, scrub-tied and dead straight.
4. **3D.** Cliff underdrawing mark set (N — construction ellipses, measure ticks, authored contours in
   `graphiteDark`) · the grid ghost (grammar kit 5) · dust scribble sprite (N — the film's one
   Prep-side particle) · the four `me*` letterings (N, P6, DOM). **The cliff island's albedo is
   untouched — the curtain mixes to the underdrawing in-material; nothing is swapped.**
5. **GOBLIN.** He finishes the dust-off's last wipe 12.5–12.65, unbothered, then turns from the hips to
   camera: **`look` to lens restaged to 12.55–12.9 — NEW MARK** (v1's 12.1 turn pre-empted the tick);
   `express('sly')` 12.4 (kept); `armRest` both sides; `weightShift` (kept, `timeline.ts:295–299`).
   `goblin.speed → 0` — the gait releases, the breath term takes over on `gobT`.
6. **INTERACTION.** Scroll only — and this is where touch soft-rests earn their keep: momentum dying
   within ±0.35 t of each `me*` anchor eases to it over 220 ms, so the four lines are never
   half-written on a phone. Keyboard `↓` lands on the same anchors.
7. **ANIMATION.** Master: the tick (≤0.15 t, no ease), the push-in 12.5→13.7 `power2.inOut`, the
   caption write-on. `gobT` (never stops): breath, ear settle, blink availability. Everything else in
   the world is held still **by construction** — the stroke tiles are baked and still, and the freeze
   reads against that stillness. **Reverse:** the tick mirrored is the same recipe backwards; the
   margin un-breathes.
8. **OUT.** None — B3 is the same held freeze, next line.
9. **KEEPING.** The grid is the oldest layer of all — the first time the film shows the world sits on a
   decided sheet. The construction ellipses and measure ticks say *this cliff was drafted.*

## S2-B3 · t13.35–14.3 · FLAGSHIP 1 · "You thought I ran away." · A

1. **ARGUMENT.** *This world was decided, not found — and revised.* The one line that accuses the
   visitor lands over proof of authorship: a contour drawn, judged wrong, rubbed out, drawn again.
2. **MESSAGE.** `me2` — **"You thought I ran away."** — `cap('me2', 13.52, 0.55, T_PUNCH)`. The caption
   and the erasure are the frame's only two readable marks; the eye path runs face → line → erasure →
   back.
3. **VISUAL.** **The flagship's one authored framing, inside the freeze.** The push-in has settled at
   the direct-address medium close-up: camera ≈1.1 units out, ≈0.35 above his eye line, **elevation
   ≈20°** — he looks *up* into the lens, dead-centre, eyes on the upper third, ear tips out the top.
   Behind him, plane four, the cliff face at reading scale carries **the erased contour pair**: the
   committed rim line in `graphiteDark`, and beside it one earlier line rubbed to `graphiteLight` with
   the eraser's smear direction legible, redrawn a hand's width to the right. Nothing else new is in
   frame. **The `me2` band sits at 24%, in the quiet paper above his ear tips** — **[ERRATA 2026-09-03:
   this read "the lower-third band … the 20° down-angle is what keeps the band off his tunic". Camera
   angle is not the mechanism; the shipped `high` seat is (`App.tsx:31–34`). At this framing the lower
   third crosses his tunic at 3.54:1, and no down-angle inside the 20–75° bench clamp moves it off. The
   20° elevation stays — it is the address's own staging, not a contrast device.]**
4. **3D.** Erased-contour pair (N — flagship asset: two authored strokes + a smear decal) ·
   **eraser-ghost #1 of 4** (N — a boulder's prior-position ellipse in `graphiteLight` at the cliff
   base, plane two) · the `me*` letterings. **All graphite-layer marks from `pencil.ts` primitives —
   never type.**
5. **GOBLIN.** Holding the address: `express('smug')` 13.35 (kept), `weightShift` to the other leg
   (kept, `timeline.ts:308`). No reach, no touch — his stillness, breath only, is the acting.
6. **INTERACTION.** Scroll only; the `me2` soft-rest is where a curious visitor naturally parks, and the
   flagship is composed to reward exactly that park.
7. **ANIMATION.** Master: caption write-on/off only. `gobT`: breath, one ear half-settle. Everything
   else dead still. Fully reversible.
8. **OUT.** None — same held freeze into B4.
9. **KEEPING.** **FLAGSHIP 1.** One line rubbed out and redrawn = the pentimento thesis in a single
   mark. It whispers — no caption names it, no camera hunts it; it is simply legible at the framing the
   address already required. **Phone valve:** if the ghost line cannot survive 390 px it demotes to
   texture at that breakpoint; the shot does not shrink (§7).

## S2-B4 · t14.3–15.15 · "I did." · A

1. **ARGUMENT.** *The escape was the job.* The deadpan flips me2's accusation into intent — he is not
   defending himself, he is correcting the record.
2. **MESSAGE.** `me3` — **"I did."** — `cap('me3', 14.44, 0.5, T_PUNCH)`. The shortest line in the film;
   the write-on is two beats of the Hand.
3. **VISUAL.** Identical held framing. The single change is his face, and one slow blink at the line.
   The frozen dust still hangs. The margin is at full breathe; the ruler's inked ticks now visibly reach
   a fifth of the way along.
4. **3D.** No change. Nothing enters, nothing leaves.
5. **GOBLIN.** `express('flat')` 14.3 (kept) — the deadpan — plus the one authored slow blink. Nothing
   else moves.
6. **INTERACTION.** Scroll only; `me3` anchor armed. The film's stillest beat — its responsiveness is
   that even here, reverse-scrubbing half a line un-writes it.
7. **ANIMATION.** Caption write-on; blink on the puppet lane; breath on `gobT`. Reverse is trivial.
8. **OUT.** None — same freeze into B5.
9. **KEEPING.** The held flagship frame carries it: the erasure stays readable through all four lines —
   one framing, four beats of reading time. No new evidence; the discipline is the point.

## S2-B5 · t15.15–16.5 · "Straight to work." — the release · A

1. **ARGUMENT.** *The mystery has a job attached — follow him.* The address ends not with an explanation
   but with motion; curiosity converts into pursuit.
2. **MESSAGE.** `me4` — **"Straight to work."** — `cap('me4', 15.32, 0.7, T_PUNCH)`; un-writes ~16.27,
   clearing before the numeral flips.
3. **VISUAL.** On the line he breaks the address: `express('sly')`, weight forward, and he turns out of
   dead-centre and *runs* — off the cliff island's rim onto bare paper. **The world does not unfreeze and
   no colour floods back:** the freeze holds into S3 by the experience doc's own S3 state, the frontier
   is banned in S2, and what releases is *him*. The camera swings off the address axis into the
   three-quarter-back travel follow (elevation rising to ≈26°) as the travel line begins drawing itself
   ~1.5 units ahead of his feet. His contact shadow is the only shadow on the void. For the stage's last
   ~0.3 t the frame contains: paper, the line, the goblin. **The skip note pencils into the bottom-right
   margin exactly at 16.5** — leaving is now allowed.
4. **3D.** The travel line (grammar kit 6 — `polyline()`/`curveLine()` through a `LineSegments2`
   `instanceCount` ramp, the shipped `heroLife.ts` mechanism, new call site) · cliff island (exits). Set
   windows: `cliffSet` closes at **16.9 — NEW MARK** (off-frame under the void hop) instead of a hard
   16.5; `camp` closes at **16.4 — NEW MARK**.
5. **GOBLIN.** `express('sly')` + `weightShift` (kept, 15.15); turn from the address 15.85;
   `goblin.speed → 1` and the run begins — the same unhurried working gait S3 keeps. He exits the stage
   mid-stride on the void.
6. **INTERACTION.** Scroll only. The skip note's arrival is itself the interaction event: the premise has
   landed and the margin quietly offers the exit.
7. **ANIMATION.** Master: caption, turn, run-out, camera swing, travel-line `instanceCount` ramp
   (scrub-tied — it un-draws behind his heels on reverse, by construction). `gobT`: gait. No special
   reverse recipe; the void hop lives just past 16.5.
8. **OUT.** **Continuous** — no catalog transition is spent. The S2→S3 boundary is a gear change plus the
   `C1`→`C2` cross-fade (300 ms), crossed at a run.
9. **KEEPING.** His first strides across the rim land on the rubbed patch at the island's edge — the
   commute wear S1-B5 planted, now read from the other side.


---

# STAGE 3 — PROOF OF LIGHT · t16.5–26.5 · C2 · Prep → the frontier

Seven beats. Tense: *present — tonight's shift.* The seven shipped prop stops are kept at
`segAt = 17 + i·1.857` with `actionAt = segAt + 1.35`; **five of the seven land inside this
stage** and the last two belong to S4's t-range (§3-S4-B1/B2). The lantern is the thesis image
and the film's first and only use of the `rig.seamX` frontier.

### The state schedule — this stage owns it, and no other document may contradict it

**[ERRATA 2026-09-05 — CLIENT RULING. THE `seamX` COLUMN BELOW IS SUPERSEDED: it reads
`1e6` at every row, for the whole stage and the whole film.** The frontier sweep
(20.53 → 21.45, x 2.0 → 13.0, and the 30.0 exhale that follows it) was never built —
`timeline.ts` has never written `rig.seamX` — so nothing is being removed from the
screen here; what is being removed is a schedule that described a beat the film does not
have. **What ships, and what the audience has actually been watching, is the same beat as
a CURTAIN beat**: each touched prop takes its colour from its own `reveal()` mask shell
and its `alive` step (`timeline.ts`, the prop loop's `case 0..6`), the ravens' beat eases
the global curtain 1 → 0.25 at t25.4, and t30's `snapBack` finishes it. The tide-line of
morning crossing the frame west→east is **GONE**, and that loss is recorded here rather
than absorbed silently: it was the one image in the film only `seamX` could make.

The `lightC` / `curtain` / `timeScale` columns stand. So does every argument in S3-B3.
Re-authoring the sweep is a build, not a fix: it needs a `seamX` owner on this timeline
that hands the uniform back to the cover at t0 — see `Film.tsx`'s render-pass note for
why the two owners cannot simply share it — and it needs the 21 sets on `rig.seamX`,
`lightC` and `curtain` the table below already specifies.]**

| t | `curtain` | `lightC` | `seamX` | `timeScale` | what is painted |
|---|---|---|---|---|---|
| 16.5 | 1 | 1 | 1e6 | 0 | the goblin only (alive) |
| 18.35 | 1 | 1 | 1e6 | 0 | + the campfire (alive step + mask shell) |
| 20.207 | 1 | 1 | 1e6 | 0 | + the lamppost group (alive step + mask shell, 0.35 s) |
| **20.505** | 1 | **set 0** | 1e6 | 0 | **[ERRATA 2026-09-03, motion doc D-2 routed here and applied]** the lighting scalars move one frame early, while the global curtain still holds the whole frame in Prep — so the change is invisible. `lightC` is a **separate `{value}` object** from `curtain`; everywhere else in the film it tracks the curtain exactly, as one `tl.to` at the same position, duration and ease |
| **20.53** | 1 | 0 | **set 2.0** | 0 | *(no visible change — 2.0 is the frame's west edge; everything in frame is east of the line, so the in-material Prep reads exactly as the post-pass Prep did)* |
| **20.55** | **set 0** | 0 | 2.0 | 0 | the post pass switches off; Prep is now carried in-material |
| 20.55→21.45 | 0 | 0 | **2.0 → 13.0**, `power2.out` | 0 | **the frontier sweep** — morning crosses the frame west→east and stops at x = 13.0 |
| 21.45–30.0 | 0 | 0 | **13.0, parked** | 0 | west of 13.0 painted; east of 13.0 pencil; touched props painted on both sides (alive) |
| 30.0→30.3 | 0 | 0 | **13.0 → 34.0**, `power2.out` | **0 → 1** (`T_EXHALE`) | **the exhale** — the last graphite leaves the ribbon |
| `c − PAIR_GAP` / `c = 30.34` | 0 | 0 | set 1e6 (paired) | 1 | the frontier retires before the theatre island (x = 44) is anywhere near it. **[ERRATA 2026-09-03 — was "30.32 / 30.34": `30.34 − 30.32 = 0.019999999999999574`, **below** `clocks.check.ts:70`'s 0.02 floor, so that pair fails the build on this beat's first commit. Author it as `c − PAIR_GAP` = 30.315.]** |

**Why `lightC` is a second object and not the curtain itself.** `rigs.ts` scales the
hemisphere, the flat ambient and the practicals by the global curtain, so at t20.55 those
three all move in one frame. The Prep branch of the trilayer is unlit, so the *drawing* is
safe — but the alive props and the goblin are lit, and the campfire he lights at 18.35 is
*"the frame's only light"*. Dropping `lightC` at 20.505 puts that move inside a frame the
curtain is still holding entirely in Prep. All three sets stay on separate `{value}`
objects (`curtain`, `lightC`, `rig.seamX`) — which is also the only reason the 20.53/20.55
pair passes `clocks.check`, since it groups by target. **Leave them on separate objects,
and note it at the call site.**

**Why it is built this way, once, so nobody re-opens it.** `triC = max(uTriCurtain, triSeamF)`
(`trilayer.ts:299`) — the seam can only *add* Prep, so **a frontier is meaningless while the
global curtain is 1**. The lantern is therefore the exact moment the global curtain drops and
the frontier takes over the same job spatially. Because `seamX` starts at the frame's west edge,
the swap frame is visually inert; what the audience sees is a tide-line of morning arriving
behind him and stopping at the lamp he just lit. This is the shipped hero's own half-alive
configuration (`rig.seamX` with `curtain = 0`), verified, not new machinery.

**What is NOT built:** no radial pool crossing to neighbouring trees (`reveal()` is a mask shell
of the prop's own shape — `curtain.ts:98–103` records that the radial version was deleted for
being the airbrushed colour disc the colour script bans by name); no frontier that tracks his
heels for the rest of the run; no `seamDir` promotion (the ribbon runs +x; the default basis
serves).

**Shadows on this island.** The path ribbon registers **no world casters**; every painted prop
is grounded by the contact blob baked into the island albedo (direction §8's own rule: *graphite
props get none — a drawing casts nothing*). This is what keeps a graphite tree east of the
frontier from throwing a shadow onto painted ground west of it, and it removes any need for the
key's ±8-unit shadow box to cover a 30-unit island.

**The void hop** (implementation, stage-owned): from 15.85 he runs off the cliff island's rim
onto bare paper; the travel line draws ~1.5 units ahead of him; the camera swings to the
three-quarter-back follow and tightens so that for ~0.5 t **nothing but paper, the line, him and
his contact shadow is in frame**. Inside that anchorless window one scrub-tied `tl.to` slides
goblin + camera + look by a constant world offset onto the path island's approach — a
match-on-motion reposition, invisible forward, exactly reversible backward. It is v1's `tl.set`
teleport (`timeline.ts:321–323`) spread over the void, where no landmark can betray it. **No page
turn is spent; the seven-transition catalog is untouched.**

**Deleted on this stage's watch:** cave-mouth `crossHatch` (`world.ts:1941`) → `caveDark` paint +
contour · sign "letters" (`world.ts:2147`, `2189`) → authored scribble rows · the sun disc + ray
decal · 44 flat-fill trees → the merged flora stand · the chest interior hatch
(`world.ts:218`, inside `buildChest`) → **painted dark pooling**, the same fix as the firebox ·
the mushroom gills hatch (`world.ts:573`) → **one committed shadow mass under the cap**, one value
step, no strokes.

## S3-B1 · t16.5–17.0 · THE VOID CROSSING · A

1. **ARGUMENT.** *The world is a page, and between places there is paper.* The film's world model
   — islands, void, a keeper commuting between them — taught in half a second of pure grammar.
2. **MESSAGE.** None. The line drawing itself ahead of him carries it: the way is only there
   because he is going.
3. **VISUAL.** Paper `#F7F5F0` edge to edge, the line unspooling ~1.5 units ahead of his feet, him
   mid-stride frame centre-right, his contact shadow the only shadow. Camera three-quarter-back,
   **elevation ≈26°**, tight enough that no island anchors the frame. **The void hop executes inside
   this anchorless window.** At ~16.9 the path ribbon island's near rim slides in ahead: cut edge
   first — bright painted lip over sectioned strata — then the graphite path dressing beyond. His
   first stride onto island earth lands at 17.0, exactly on the fire beat's `segAt`.
4. **3D.** Travel line (grammar) · **path ribbon island (N — the big build; the hero island is a
   slice of it, so its albedo/bark/foliage bakes extend 1:1)** · the island's 40+ tree flora stand,
   merged one `BufferGeometry` per class (G1) · path-island grid ghost. `pathSet` opens at 16.5.
   Per G2, S3's class bakes were kicked during S2's idle.
5. **GOBLIN.** Run, nothing else — the working gait at `speed 1`. In from the void, along the line,
   out onto the island's entry rut.
6. **INTERACTION.** Scroll only. The line answers the thumb directly: forward draws it, backward
   un-draws it from his heels — the clearest 1:1 the film has offered.
7. **ANIMATION.** Master: line `instanceCount` ramp, the world-slide, camera follow. `gobT`: gait.
   **Named reverse check:** the slide reverses as the identical offset tween; the assertion is that
   **no island pixel is in frame for the full slide window in both directions at every breakpoint**
   — portrait's taller FOV is the risk case; widen the anchorless span by 0.1 t if it fails.
8. **OUT.** None — continuous onto the island; B2 begins at the fire.
9. **KEEPING.** **Cart ruts enter at the cut edge and stop where the pencil line stops** (direction
   §3, verbatim), and the path's first metres carry the most wear on the island — the keeper's own
   commute, read before a single prop.

## S3-B2 · t17.0–18.857 · FIRST TOUCH — the campfire · A

1. **ARGUMENT.** *His work is making the world ready — and touch is the mechanism.* The first stop
   converts S2's claim into observable labour.
2. **MESSAGE.** None yet. Carried by the touch-reveal grammar itself: colour exists in this world
   only where he has put his hands.
3. **VISUAL.** The run's follow shot, raised to the clamp: camera trails 3.2 back and 2.8 out at
   y ≈ 3.4 (v1's y1.6 restaged), **elevation ≈27°**, the ribbon's near cut edge riding the frame's
   low corner for the whole run (sheet edge in every travelling wide). All graphite: 40+ underdrawn
   trees, the props ahead as drawn forms. He stops at the fire-ring (prop 0, hand `[6, 0.35, 0]`),
   stoops, and the fire catches — **the film's first touch reveal**, `actionAt 18.35`: colour and
   its glow blooming from the contact point, 0.35 s, `SETTLE.arrive`, while the world around stays
   pencil. The flame's glow pool is the frame's only light; scorch below is painted dark pooling.
4. **3D.** Campfire kit #2 (R — ring + logs + tongue flames + glow sprite; `fire2Flames`/`fire2Rays`
   marks kept, `timeline.ts:364–366`) · ember particles (R). **Per-mesh material #1:** the fire group
   merges to **one** trilayer material carrying the `alive` step (ring + logs + flames + glow as one).
5. **GOBLIN.** The shipped per-stop chain, which is the run's grammar (`timeline.ts:434–526`): run to
   the solved stand point · `speed → 0` · turn to face · deep `stoop` (`crouch` to the plant's solve)
   + `reach` to `[6, 0.35, 0]` · **the prop moves only once his hand arrives** · `armRest` + `crouch`
   release · turn back to +x · `speed → 1`. `express('neutral')` — practiced, no hesitation.
6. **INTERACTION.** Scroll only. The reveal is scrub-tied, so backing up un-lights the fire — the
   visitor can audit the work.
7. **ANIMATION.** Master: the run/turn/stoop/reach chain; the **`alive` step at `actionAt`** (a
   `tl.set`, never a ramp — colour law 2) and the **mask shell growth** over 0.35 s, which is the only
   part the audience sees. `gobT` (banked): flame flicker + ember drift begin the moment the shell
   completes and never stop — motion accumulating in a still world. The banked idle's amplitude rides
   the shell's scale so it dies smoothly on reverse; **nothing boolean-flips on "revealed"** (P3-T3).
8. **OUT.** None — the run continues; the camera never stops travelling between stops.
9. **KEEPING.** The fire-ring's stones carry soot from previous nights — painted dark pooling on the
   inner faces, present *before* he lights it. Tonight is not the first night.

## S3-B3 · t18.857–20.714 · THE LANTERN — the thesis image, the frontier · A

**[ERRATA 2026-09-05 — the beat is KEPT and is a CURTAIN beat, not a seam beat.** Points
1, 2, 5, 6, 8 and 9 stand unchanged, and so does the whole of the argument: he lights the
lamp, the flame takes, the glow cones bloom, the caption flushes, and the lamppost keeps
its paint for the rest of the film through its `alive` step. What is cut is the tide-line
in point 3 ("morning arrives from the west, crosses over 0.9 s, stops at x = 13.0") and
the three `seamX` sets in point 7. They were never built. The colour that arrives on this
beat arrives through the lamppost's own mask shell, and the world's colour arrives later,
on the ravens' curtain ease at t25.4 and the t30 snap. **The thesis image survives; the
frontier that carried it does not.**]**

1. **ARGUMENT.** *Someone has to light the world — and light is labour that brings colour and shadow
   as one gift.* The film's whole pitch in one held image. If a visitor remembers one frame of the
   first half, it is this.
2. **MESSAGE.** `light1` — **"Someone has to light the world."** — `cap('light1', 19, 4)`
   (`timeline.ts:533`). It writes on in graphite (Prep side of the Hand); **as the curtain drops at
   20.55 each stroke flushes graphite→ink in a 200 ms per-stroke crossfade keyed off the curtain
   value** — never a repaint, never a parallel tween. It holds 4 t across the cave-door stretch and
   un-writes by 23.4.
3. **VISUAL.** **The run's one held wide.** The camera stops travelling and holds: lamppost right of
   centre on a third, the goblin at its foot, the path ribbon running away into graphite depth, the
   island's cut edge and paper low in frame. **Elevation ≈30°.** The lamppost is restaged per the hero
   lesson (P4d-T5 as staging law): the flame column is never occluded by its own post from this lens,
   and the bracket arm resolves against the paper beyond, not against the pole. He reaches up and taps
   the glass; the flame takes; **`amber` core, `amberLantern` glass tier, painted glow cones** bloom
   from the lamp's own shape over 0.35 s. Then, on the swap frame at 20.55, the **frontier** takes
   over: a tide-line of morning arrives from the west — the way he came — crosses the frame over 0.9 s
   `power2.out`, and **stops at x = 13.0**, a stride past the lamp. Behind the line: painted morning,
   shadows arriving with the colour, the day key warming to full inside swept territory. Ahead: pencil.
   On the line: the shipped pooling, dab break-up and tide-line (`trilayer.ts:281–319`) — paint
   visibly *breaking into strokes* at its own edge.
4. **3D.** The lamppost (hero tier 3, R — restaged) · glow sprite + painted glow cones (R) ·
   `lanternPost`/`lanternRays` reveal marks kept (`timeline.ts:483`) · the `light1` lettering (N, P6).
   **Per-mesh material #2:** the lamppost group merges to one trilayer material carrying the `alive`
   step (post + glass + flame + cones), which is what keeps it painted when the frontier passes it and
   for the rest of the film. **The trees repainting are not per-mesh** — the frontier crosses the
   merged stands in-material, at zero draw-call cost. `sky()` ramps `skyDay` over 1.0 from 20.6 (v1's
   mark logic, re-eased onto the frontier).
5. **GOBLIN.** Run to the post's solved stand (prop 1, hand `[10, 1.1, 0]`) · `speed → 0` · turn ·
   `reach` up + `tap` on the glass — **the touch is the mechanism, and it is the same grammar handed
   to the visitor at the CTA** · hold a beat looking up at it, the one unhurried look of the run ·
   `armRest` · turn · `speed → 1`, and he runs **east through his own frontier into the pencil** as
   the sweep's tail plays out over B4's opening.
6. **INTERACTION.** Scroll only; a rest anchor sits on the lantern. On touch, momentum dying near
   `light1` eases to it — every phone visitor holds this frame once. The frame's answer to a parked
   visitor: banked flicker breathing in the pool while the graphite half stays utterly still.
7. **ANIMATION.** Master: reach/tap · the lamp's `alive` step + mask shell (0.35 s) · the `seamX` set
   at 20.53 and the `curtain` set at 20.55 (**three** sets, **three** objects — `lightC` at 20.505,
   `rig.seamX` at 20.53, `curtain` at 20.55 — no flash in any of them, in either direction; they clear
   `clocks.check` only because it groups by target, so they must never be merged onto one state object) · the frontier tween 20.55→21.45 · the sky ramp · the caption flush. `gobT`: flame
   flicker, his gait. **Reverse must be flawless — this is a signature scrub-back:** every element is
   a plain property tween or a paired set, so backward the frontier retreats west, the curtain
   returns to 1, the flame un-takes and the caption flushes ink→graphite per stroke. Nothing is
   spawned or destroyed at any point.
8. **OUT.** None — the run resumes; the frontier finishes its one move under B4 and then parks.
9. **KEEPING.** The lantern ledger starts its visible life here: the first light the audience watches
   him light, retroactively explaining S1's laid fire and prospectively every practical in the film.
   On the post: rubbed-bright brass where his hand always lands, one authored glint stroke. **Not one
   of the four flagships** — the thesis image and the flagship discipline are separate ledgers, on
   purpose.

## S3-B4 · t20.714–22.571 · THE CAVE DOOR · A

1. **ARGUMENT.** *He opens the way before anyone arrives to need it.* Prep as hospitality: dungeon
   doors do not open themselves.
2. **MESSAGE.** None on entry; `light1` holds over this stretch (to 23.0) — the long hold is authored
   to make the door and the lantern one thought.
3. **VISUAL.** The follow resumes and the frontier's tide-line slides out of frame behind him. He
   leaves the path (prop 2 sits 2 off-path at `[13.4, 0.85, −2]`, just east of the frontier's stop, so
   **the door is still pencil when he reaches it**) to the cave mouth: `caveDark` paint + drawn
   contour. He hauls the timber door open on its hinge and it takes paint at `actionAt 22.064`.
   Inside the mouth: dark, one value step above the door's shadow side (colour law 5).
4. **3D.** Cave + door + timber frame (carpentry kit, R; `caveDoor`/`cave` reveal marks kept,
   `timeline.ts:486`). **Per-mesh material #3:** cave + door as one, `alive`-stepped; its slow
   settle-creak idle banks on `gobT` — a door he opened stays subtly alive.
5. **GOBLIN.** Run · `speed → 0` · turn · `reach` to the door edge and haul it to `rotation.y −1.9`
   (mark kept) — the pull is bodyweight, not arm-wave (the `haul` posture at small amplitude) · back
   to the path · `speed → 1`.
6. **INTERACTION.** Scroll only. Reverse un-opens the door and hands it back to the pencil.
7. **ANIMATION.** Master: chain + door swing + the alive step and shell. `gobT`: banked door settle;
   fire and lantern still flickering behind. No special reverse.
8. **OUT.** None — the run continues.
9. **KEEPING.** Timber-recipe corner-lightening on the handled edge and the hinge strap. **The v1
   "previous swing arc" on the door's Prep side is deleted** — that designed mark belongs to the
   tavern door (eraser-ghost #3) and the film does not spend the same mark twice under two names.

## S3-B5 · t22.571–24.428 · THE CHEST · A

1. **ARGUMENT.** *Even the reward is authored.* Treasure is not found; it is placed — the quietest,
   most subversive product truth in the stage.
2. **MESSAGE.** None (`light1` un-writes 23.0–23.4). Carried by the joke of logistics: the loot is
   stocked like a larder.
3. **VISUAL.** Back on the path (prop 3, hand `[18, 0.4, 0]`): the chest at the verge, east of the
   frontier and therefore drawn. He flips the lid; the coins rise into place (`chestCoins` pop, mark
   kept) and the chest takes paint at `actionAt 23.921`. **The shot deliberately holds both truths at
   once:** painted morning behind him at the frame's west edge with the tide-line still visible along
   the cut, pencil ahead. This is the run's clearest reading of the frontier as an object.
4. **3D.** Chest + judged coins (carpentry kit, R; `chestLid`/`chestCoins` marks kept,
   `timeline.ts:374–375`, reveal at 489). Metal grammar: `gold` by value, matte, **one authored glint
   stroke** on the hoard — no specular. **Per-mesh material #4:** chest + lid + coins as one,
   `alive`-stepped. The interior's `world.ts:218` hatch is replaced by painted dark pooling.
5. **GOBLIN.** Run · stop · turn · `stoop` + `lift` the lid · a satisfied half-beat
   (`express('neutral')` — routine, not triumph) · release · run on.
6. **INTERACTION.** Scroll only. The frame answers via the frontier edge's dab texture breathing at
   sub-pixel under the scrub — the one place the still world shows its material grain.
7. **ANIMATION.** Master: lid, coin pop (`PUPPET.pop`), alive step + shell. `gobT`: banked idles
   accumulating behind him — fire, lantern, door: **three embers of motion in one frame** when the
   camera glances back west. No special reverse.
8. **OUT.** None — the run continues.
9. **KEEPING.** Corner-lightening drybrush on the handled corners (wear only where hands go), and the
   Prep side keeps its `boxMarks` construction — the draughtsman's box that built it.

## S3-B6 · t24.428–25.9 · THE RAVENS — the joke · A

1. **ARGUMENT.** *The world's life is staged too — and he tends it anyway.* The comedy beat: shooing
   birds that are already frozen. It quietly re-teaches the freeze before the world returns.
2. **MESSAGE.** None. The joke is the message: he waves at statues, because the job is the job.
3. **VISUAL.** The perch tree at the path's side, three ravens caught mid-flap in the graphite ahead
   of the frontier — already frozen (the world clock stopped at 12.5). He shoos them; they
   scatter-slide up and away in that frozen stiffness, statues on wires (offsets kept,
   `timeline.ts:378–396`). They stay `ravenSlate` — cast tier, never out-chroma-ing him. **They are
   never touched, so they never take paint**: the ledger stays honest.
4. **3D.** Perch tree + ravens ×3 (cast tier, R; scatter marks kept). **Per-mesh materials: none —
   transforms need no material state.** (This corrects Chapter One's count of three.) The sky ramp
   that v1 hung on this beat (`sky(actionAt, 1.0, skyDay)`) has moved to B3's frontier; **v1's
   `drain(25.4, 0.25)` is deleted** — the partial-curtain hold it produced is exactly what the
   experience doc bans, and the frontier has already done its job.
5. **GOBLIN.** Run · stop under the branch (prop 4, hand `[22, 1.62, 0]` — over his head, so the reach
   *stays a stretch*, the solved full-extension read) · `wave` — the shoo · a beat of looking at the
   un-fleeing birds · `shrug`-adjacent recovery (`armRest`) · run on. `express('strain')` on the
   overhead reach.
6. **INTERACTION.** Scroll only. Reverse un-scatters the ravens back onto the branch — one of the
   film's best backwards gags, free of charge.
7. **ANIMATION.** Master: reach, wave, scatter tweens. `gobT`: **nothing new banks** — he never
   touches them. Held: the ravens' wings, mid-flap, throughout. No special reverse.
8. **OUT.** None — continuous into B7.
9. **KEEPING.** Under the perch tree: a droppings-ring and a worn patch where he stands to shoo them.
   He does this every night; the birds know him, which is *why* they would not move even unfrozen.

## S3-B7 · t25.9–26.5 · THE LAST STRIDE · E

1. **ARGUMENT.** *The shift is not over — and the world is still holding its breath.* The stage ends
   mid-work, which is the only honest way for a stage about work to end.
2. **MESSAGE.** None. The frame says it: painted behind, pencil ahead, one small figure running east
   into the unfinished half.
3. **VISUAL.** The camera lifts slightly (**elevation to ≈32°**) into a travelling wide holding the
   whole ribbon: the painted west with its tide-line at x = 13, the graphite east with the mushroom
   patch and the signpost visible as drawn forms ahead of him, the island's cut edge and the paper
   void low in frame. He runs on, a small painted figure. **The world clock does not resume** — the
   fire flickers, the lantern breathes, the door settles (all banked on `gobT`), and nothing ambient
   moves. A world holding its breath for the exhale that belongs to the next stage.
4. **3D.** Nothing new. `seamX` is parked at 13.0 and does not move again until t30.
5. **GOBLIN.** Run only, `speed 1`, eastward. **At t26.5 exactly: root at x ≈ 26, z = 0, y = 0,
   `speed 1`, `rotation.y = +π/2`, `express('neutral')`, hands empty, no prop in contact.**
6. **INTERACTION.** Scroll only. Reverse re-walks him west through his own morning.
7. **ANIMATION.** Master: gait, camera lift. `gobT`: gait + every banked idle west of the line. Held:
   all untouched ambient.
8. **OUT.** **Continuous** — the stage ends mid-run at the 26.5 gear change. No catalog transition is
   spent. The handoff below is binding on both stages.
9. **KEEPING.** Ahead of him, still in graphite: **the mushroom patch's ring where mushrooms grew last
   season**, and the signpost's **older nail holes**. Both are underdrawing-layer marks, so the morning
   will make them *more* legible, not less. The stage exits on next season's evidence.

### THE t26.5 HANDOFF — binding, one owner per line

| Facet | State at exactly t26.5 |
|---|---|
| **Goblin** | x ≈ 26, z = 0, y = 0, `speed 1`, heading +x, `express('neutral')`, hands empty, no contact |
| **Curtain** | **0** — the post pass is off and has been since 20.55 |
| **Frontier** | `seamX = 13.0`, parked. **Everything east of x = 13 is pencil**, including the mushroom patch (x ≈ 26.6) and the signpost (x ≈ 30) — so **both keep their touch-reveal grammar**, and `reveal()` at `timeline.ts:507` and `:510` are not no-ops |
| **Clock** | `timeScale = 0`. The exhale is t30 and it belongs to S4 |
| **Alive set** (on `gobT`) | fire2, lamppost, cave+door, chest — four per-mesh materials, all stepped |
| **Ravens** | frozen mid-scatter; their scatter tweens end ~26.3, behind camera from ~28 |
| **Light** | `skyDay` ramp completed ~21.6; exterior-day key `(4, 6, 3)` at +18°, full inside swept territory; grades to `skyOvercast` at 31.5 |
| **Owed work in S4's range** | mushrooms `segAt 26.285` / `actionAt 27.635`; signpost `segAt 28.142` / `actionAt 29.492`; the t30 exhale; the t30–31.5 dash. **S4 stages all four.** *"No prop contact" is not a legal hand-off state and is not what this book hands off.* |
| **Retired here** | the 29.1 `tufts`/`treeline` reveals (`timeline.ts:515–516`) — the exhale takes them, which saves two per-mesh materials and two tweens |
| **Interface** | no caption on screen (`light1` cleared 23.4); next is `set1` at 32.6. Numeral `C2`, flipping to `C3` at 31.5 with the sky. Ruler ~40% inked. Skip note live since 16.5 |
| **Camera** | **`[24.5, 5.2, 6.2]` → `[30.5, 1.0, 0]`, elevation ≈26°** — the path island's rim in frame at the bottom (sheet-edge rule), the theatre island's silhouette far at x = 44 |


---

# STAGE 4 — PROOF OF SCENERY · t26.5–36 · C2→C3 at 31.5 · Performance

Six beats. Tense: *past-perfect — the infrastructure.* **This stage owns t26.5–30**, which
carries the last two stops of S3's run, the world's return and the exhale. Air `skyOvercast
#AAB6C0` from 31.5; exterior-day key family (+18°, `(4,6,3)`), flattened near-vertical for the
theatre, **no practicals** — a theatre between shows. **State:** `curtain = 0` throughout except
the flicker's tick (33.1–34.3); `seamX` parked at 13.0 until the exhale, then retired to 1e6 at
30.34 and **never used again in the film**; `timeScale 0 → 1` at 30.

**The set.** The **theatre island** — stage disc + backstage apron on one island card with
sculpted three-band edge, roots, drawn rim, grid ghost. v1 geometry inherited from
`buildTheatre()` (`world.ts:2591–2884`): `stageDisc` at `(44, 0, −2)`, r = 7, top face y = 0.3,
forest half on local −x; `rope` at `(38.5, 0, 1)`. **v1's mountain-on-the-disc
(`world.ts:2718–2774`) restages as a backstage flat standing in a slot** behind the disc, so the
turn *reveals* the flat instead of carrying it. The disc's vacated +x half is bare planks.

**The machinery, restaged — this supersedes the under-disc staging.** The capstan, six radial
rails and **two counterweight booms that sweep outside the kerb at radius ≈ 8.2** — a metre
beyond the disc's rim — are graphite-only, the film's one asset with no paint side. Because the
booms sweep *outboard*, the marks they have worn live in the **apron bed just outside the kerb**,
in plain view from the bench clamp. **There is no push-in under the disc and no rail-truck
redesign**: reading arcs beneath a disc whose top face is y = 0.3 through a kerb gap at ≥20°
elevation is a shot that does not exist, and the whole S4 argument was resting on it. The arcs
come outboard to the camera instead of the camera going under the disc. Same evidence, legible
at 20–24°, no change to the disc's height, kerb, rope or wide silhouette.

**Deleted on this stage's watch:** theatre hatch tones (`world.ts:2628`, `2670`, `2689`, `2759`)
→ floorboard-family directional bake with ruled silhouettes kept and paint supplying tone · the
v1 mountain-dodge run tweens (`timeline.ts:590–591`) · v1's `drain(25.4, 0.25)` (deleted in S3).

## S4-B1 · t26.5–28.1 · THE MUSHROOM STOP · A

1. **ARGUMENT.** *The shift runs past the chapter break — and next season is already planned.*
   The audience meets the stage's geography while he is still finishing yesterday's job, which is
   what "past-perfect" means before a word is spent.
2. **MESSAGE.** None (`light1` cleared at 23.4; `set1` is deliberately held for the turn).
3. **VISUAL.** The travelling follow, camera `[24.5, 5.2, 6.2] → [30.5, 1.0, 0]` at the handoff,
   easing east with him, **elevation ≈26°**. Foreground: the path ribbon's tail, painted, with the
   frontier's tide-line at x = 13 receding behind. Middle: him, stopping at the patch. Far: the
   ribbon's far cut edge, paper void, and the theatre island's silhouette at x = 44 — the disc's
   forest half in profile, the kerb, the mountain flat edge-on as **a pencil-thin vertical line,
   invisible as a mountain, honest as a sheet.** He stoops and seeds the patch; the mushrooms pop
   into place and take paint at `actionAt 27.635` — colour opening from his hand in a still world,
   the same grammar as every stop before it.
4. **3D.** Path ribbon island tail (S3's asset) · **mushrooms — caps in threes, never symmetric**
   (R, flora signature; the `world.ts:573` gills hatch is replaced by one committed shadow mass
   under the cap) · theatre island card + apron (**N**, set tier) · stage disc + kerb (R,
   re-surfaced) · forest-on-disc dressing: ~8 trees + 2 stumps + 3 boulders + a fallen trunk (R,
   merged one geometry per class as disc children) · mountain flat (R-reshaped, edge-on) · rope coil
   (R) · machinery set (**N**, graphite-only, dark at this range). **Per-mesh material #5:** the
   mushroom patch, `alive`-stepped.
5. **GOBLIN.** The shipped stop chain at `segAt 26.285`: run to the solve · `speed → 0` · turn ·
   deep `stoop` + `reach` low · the patch pops under his hand (`PUPPET.pop`) · `armRest` · turn back
   to +x · `speed → 1`. `express('neutral')`.
6. **INTERACTION.** Scroll only. The travel line un-draws behind his heels; the ruler's ticks ink
   past 26.5. Numeral still `C2`.
7. **ANIMATION.** Master: the stop chain, the pop, the `alive` step + mask shell (0.35 s), the camera
   rail (settle lane, `power2.inOut`). World clock: **still stopped.** `gobT`: gait, breath, and every
   banked idle on the ribbon tail behind him — the fire, the lantern, the door — which is exactly why
   this frame is not dead. Reverses cleanly.
8. **OUT.** None — the run continues.
9. **KEEPING.** **The graphite ring where mushrooms grew last season**, now under fresh caps and made
   *more* legible by the paint arriving around it. Whisper plane. Not a flagship.

## S4-B2 · t28.1–30.35 · THE SIGNPOST, AND THE EXHALE · A

1. **ARGUMENT.** *A prepared world becomes a living morning — prep IS the aliveness.* Product
   promise #1 lands, wordlessly, on the visitor who has just watched all of the work.
2. **MESSAGE.** None. The return is wordless on purpose; `light1` said the sentence and the world now
   demonstrates it.
3. **VISUAL.** He straightens the signpost at `actionAt 29.492` and it takes paint. Then, at **t30,
   the exhale**: `timeScale 0 → 1` over `T_EXHALE` (0.3 t) and, on the same cue, the frontier releases
   — `seamX` runs **13.0 → 34.0** over 0.3 t `power2.out` (with `lightC` tracking `curtain` back to 0 on the same cue), taking the last graphite off the ribbon:
   verge grass, the far treeline, the tufts, out to the island's far cut edge and the paper beyond.
   **The world resumes mid-gesture:** the banked idles never stopped, and now the newly-painted
   ambient joins them — verge sway, ember drift, cloud flats — while shadows arrive with the colour.
   **No held partial-curtain frame exists** at any point: the return is spatial and committed, in one
   breath. `seamX` retires to `1e6` at `c = 30.34` (paired at `c − PAIR_GAP` = 30.315 — **not** 30.32, which
   is 0.019999999999999574 away in floating point and fails `clocks.check.ts:70`; ERRATA 2026-09-03), well
   before the theatre island at x = 44 comes near the line.
4. **3D.** Signpost (R, carpentry kit; the `world.ts:2147`/`2189` "letters" become **authored
   scribble rows**) · verge tufts + treeline (R, merged — **no per-mesh material**, the frontier
   crosses them in-material). **Per-mesh material #6:** signpost + board, `alive`-stepped.
5. **GOBLIN.** The shipped stop chain at `segAt 28.142`: run · stop · turn · `reach` and
   **`straighten` the post** — the small version of the gesture S7 will spend once at full scale ·
   `armRest` · turn · `speed → 1`. Then the shipped correction `tl.to(root.position, {z: 0}, c2End −
   0.3)` puts him back on the path, and the dash begins at 30.
6. **INTERACTION.** Scroll only. Rest anchors: **mushroom-stop** (27.6) and **world-return** (30.0).
   Reverse re-pencils the morning east-to-west — the film's biggest single un-keeping so far, and it
   must scrub silky: **one seam-position tween, one timeScale tween, one direction, no booleans.**
7. **ANIMATION.** Master: the stop chain; the seam release; the timeScale ramp; the camera continuing
   its rail. World clock: **resumes at 30 and runs for the rest of the film** except the S4 flicker and
   the S5 freeze. `gobT`: unbroken. **Reverse recipe, named:** the release is one position tween plus
   one clock ramp on the same span; reversing replays them mirrored. **Nothing may key off "the world
   is back"** — no boolean flips (P3-T3).
8. **OUT.** None — the exhale *is* the transition, and the dash carries straight into B3.
9. **KEEPING.** The signpost's **older nail holes in graphite** — the sign has hung on this post
   before, more than once, saying something else. Whisper plane.

## S4-B3 · t30.35–31.5 · THE STAGE, WIDE · E

1. **ARGUMENT.** *This forest is scenery. The world is staged.* The moment the eye finds the disc's
   rim and kerb under the trees, the sentence has landed without a word.
2. **MESSAGE.** None. `set1` is held for the turn itself.
3. **VISUAL.** The stage's one true wide (exempt from the figure floor; the acting beats sit on either
   side). Camera restaged from v1's `[31.5, 4.5, 6] → [42, 1, −2]` (~15°) up to **`[30.5, 7.2, 7] →
   [42, 0.6, −2]`, elevation ≈22°** — leaning over the maquette. Foreground: the rope's ground coil and
   feed line, island rim entering frame (sheet edge). Middle: the disc — planked painted stage, kerb,
   forest half toward us, and **the apron's arc band just outboard of the kerb, dark and illegible
   under the Performance key.** Far: the bare +x half, the mountain flat edge-on behind it, paper
   beyond ramping in-material. Flat grey key, soft. Island rim clear of the viewport edge at every
   breakpoint. Sky eases to `skyOvercast` and the numeral cross-fades C2→C3 at 31.5
   (`timeline.ts:547`).
4. **3D.** As B1 at frame scale. Disc planks re-surfaced with the timber recipe (floorboard-family
   directional bake, ruled silhouette kept, paint supplies tone); kerb with its 16 radial plank lines
   (`world.ts:2605–2629`). Rope: catenary + 6 strand wraps + knot + 3 frayed strands + 3-loop coil (R,
   fibre-streak directional bake). **Merged throughout; no per-mesh materials added.**
5. **GOBLIN.** Dash x → 38.5 over 1.5 t (`timeline.ts:545`), arriving at the rope's feed line. He is
   small in this wide — legal; he is not acting.
6. **INTERACTION.** Scroll only. The dash is scrub-tied: flick-scrollers see him arrive fast, and the
   disc looms at exactly scrub speed.
7. **ANIMATION.** Master: dash, camera settle (settle lane), sky grade (`sky()`, scrub-tied). World
   clock: **the theatre is genuinely still — a theatre between shows, and its stillness is the
   argument.** The only ambient in frame is the path island's tail behind camera. `gobT`: gait.
8. **OUT.** None — same shot; he takes the rope; the camera holds.
9. **KEEPING.** The kerb is **worn where the rope runs** — drybrush on the throat the rope has crossed
   for years; the coil sits on a rubbed patch of plank.

## S4-B4 · t31.5–33.1 · THE HAUL · A

1. **ARGUMENT.** *A scene change is physical work that someone does.*
2. **MESSAGE.** `set1` — **"Your DM dreams it. I move the scenery."** — `cap('set1', 32.6, 2.0)`
   (`timeline.ts:557`). The Hand, ~15 strokes/s, lower-third band, **ink** (Performance). During B5's
   flicker its strokes **flush ink→graphite via the 200 ms per-stroke crossfade, keyed off the curtain
   value** (the `light1` grammar, run off the tick rather than a whole-frame parallel tween), and flush
   back on the exhale. Leaves by `T_BEAT`, clear by ~35.0. **The disc never enters the band — held by
   framing.**
3. **VISUAL.** The acting medium: camera low and behind him at the rope, **elevation ≈21°**, over his
   shoulder, rope running up-frame into the disc. Foreground: the rope and him (≥100 px landscape) and
   **the apron's arc band crossing the frame between him and the kerb**. Middle: the disc turning, near-
   edge trees tracking right and far-edge left — the rigid turn does the sliding; no differential
   rigging. Far: the bare half swinging toward us, then the mountain flat resolving from a pencil edge
   into a standing sheet of reserved-paper snow. Sheet edge: the island rim at frame bottom.
4. **3D.** As B3. **The mountain flat**: v1's three peaks re-cut as one flat sheet in a slot —
   **reserved-paper snow**, the page showing through, blue-grey shadow strokes, a drawn windward edge,
   **barely painted because nobody has played there yet.** Machinery turning under and outboard of the
   disc, **its boom rotation slaved to `stageDisc.rotation`** (same tween target, so it works whenever
   the disc works). **Per-mesh material #7:** the rope, `alive`-stepped at first contact — he has
   touched it, so it stays painted through the flicker.
5. **GOBLIN.** `haul` (`actions.ts:412`) at 31.5 + 3.0 (`timeline.ts:555`): rear leg rolled onto its
   toe, front leg braced, pelvis back, chest counter-rotated, **two pulls not one drag** — practiced, no
   hesitation. He stands on the rubbed patch beside the coil. He touches the rope and nothing else.
6. **INTERACTION.** **The scroll is the rope.** The disc `+= π` over 2.5 s `power2.inOut` from 32.0
   (`timeline.ts:559`) maps 1:1 through the locked **0.35 s input smoothing**, so the disc has inertia
   against the thumb; reversing scroll reverses the forest. The film's best scrub tutorial, offered
   silently. Rest anchor at `set1`.
7. **ANIMATION.** Master: haul pose tweens (puppet lane), disc rotation + machinery (scrub-tied through
   the smoothing), rope pulses in 12 organic yoyo cycles (`PUPPET.organic`, `timeline.ts:560–564`),
   caption write-on, camera. World clock: idle. `gobT`: gait amplitude at `speed 0` is exactly 0 by
   construction — the pose owns him. **Must be flawless in both directions** — smoothing plus pure
   tweens make reverse the identical motion mirrored.
8. **OUT.** **The tick** at t33.1 — into B5.
9. **KEEPING.** The rubbed patch where he always plants his feet to haul; the kerb-throat wear running
   under the moving rope.

## S4-B5 · t33.1–34.3 · THE FLICKER · FLAGSHIP 2 · A

1. **ARGUMENT.** *The machinery is old because it has always worked. Reality has rigging, and someone
   has been operating it for years.*
2. **MESSAGE.** None new — `set1` is up, flushed to graphite for the flicker's duration. The meaning is
   carried entirely by the marks: `pencil.ts` stroke primitives, never lettering, never captioned.
   **Evidence whispers.**
3. **VISUAL.** **The flagship's one authored framing, inside its own freeze — and it is B4's frame,
   held.** The tick fires and the paint lifts off the world; the disc keeps turning under his pull; and
   in the frame's middle ground, now legible under Prep's flat paper light, the **apron bed carries the
   scribed arcs**: concentric arcs ground into the graphite bed just outboard of the kerb where the
   counterweight booms have swept for years — ten thousand swings in one mark — **and one arc that
   overshoots and stops, a turn once taken too far.** The camera makes **one move only: the shipped
   0.09 push drift**, `power1.out` — no push-in, no insert, no new setup. Foreground: the rope and his
   shoulder as the occluder (evidence plane two). Middle: the arcs and the machinery, drawn, working.
   Far: the disc's underside kept one value step above `caveDark` (colour law 5). **The goblin stays
   painted, and the rope stays painted with him** (`alive`) — one warm line running from the only
   painted figure into the graphite machinery: *his work is what animates the drawing.* His contact
   shadow is the only shadow.
4. **3D.** Machinery set (**N**: capstan drum + spokes, 6 radial rails, **2 outboard counterweight
   booms + weights**, 4 blocks — all graphite ramp, stroke primitives + quantized tone) · scribed-arc
   mark set (**N**: 3–4 authored `polyline()`/`curveLine()` arcs in `graphite`/`graphiteDark` on the
   apron bed, plus the one overshoot arc) · **eraser-ghost #2 of 4** (**N**: a tree's prior-position
   ellipse in `graphiteLight` on the disc's bare half — the forest was once dressed differently).
   Everything else as B4, rendered by the trilayer's Prep side. **Per-mesh materials added: none** —
   the machinery has no paint side and needs no state.
5. **GOBLIN.** He keeps hauling; the haul does not pause for the flicker (`gobT` never stops, and the
   pose tweens are timeline-owned). He is the frame-edge anchor, not the subject. One eye-path.
6. **INTERACTION.** None — **and the responsiveness IS the beat:** the visitor's own scroll is still
   turning the disc while the world is frozen. The one thing that moves in the freeze is the thing
   their thumb drives. Guard honoured: the flicker spans 1.2 t of scroll (≥0.8 t — cannot be flicked
   past; ≤1 breath — cannot become the point).
7. **ANIMATION.** The tick at 33.1: `timeScale → 0` in ≤0.15 t **and** `curtain → 1` in 0.35 t
   `power2.out`, same cue. Margin breathes in `T_BEAT`. The 0.09 drift runs 33.15–34.1. The exhale at
   34.3: `timeScale → 1` in `T_EXHALE`, curtain back to 0, camera settling back to the B4/B6 medium over
   34.3–34.9. Disc + machinery scrub-tied throughout, unaffected by the freeze. **Reverse:** all
   tweens; the curtain pair and the drift mirror exactly. Margin-state `tl.set` pairs sit **`PAIR_GAP`
   (0.025 t) apart, authored as `c − PAIR_GAP`** — not "≥0.02 t", which two decimal literals cannot be
   trusted to clear (ERRATA 2026-09-03).
8. **OUT.** **The exhale** at t34.3. Cost: nothing created or destroyed, no bakes, no cut — two curtain
   tweens and a camera return.
9. **KEEPING.** **FLAGSHIP 2 — the scribed arcs.** Supporting cast: the rubbed capstan grip where hands
   go, the tree ghost ellipse, and **the mountain flat's graphite brace and slot, visible at the
   freeze** — backdrop flats are honest theatre sheets and admit it when the file opens. **Phone valve:**
   if the arcs cannot survive 390 px they demote to texture at that breakpoint; the shot does not shrink.

## S4-B6 · t34.3–36 · THE WAVE · A

1. **ARGUMENT.** *He has done this ten thousand times — it is courtesy between coworkers. He waves at
   scenery.*
2. **MESSAGE.** None — `set1` clears by 35.0. The wave carries the beat: affection for the work, zero
   ceremony.
3. **VISUAL.** Medium on him at the rope, **elevation ≈24°**, mountain flat behind and frame-right —
   barely painted, reserved paper shaped by blue-grey shadow strokes, a drawn windward edge, visibly a
   sheet in a slot. Foreground: rope coil. Middle: him (acting — ≥100 px landscape). Far: the bare disc
   half and paper. Sheet edge: island rim, bottom left. The machinery has gone dark and illegible again
   under the Performance key — **the secret closes.**
4. **3D.** As B4. Nothing new.
5. **GOBLIN.** `settle` at 34.5 (`timeline.ts:566`) → hip turn at 34.9 → **`wave` from the wrist**,
   weight on one leg, 35–36 (`timeline.ts:572`) → turn to +x, `express('neutral')`, `speed → 1`, run
   toward the flat's edge (x → 46.5 across the bare stage at y 0.3; the v1 dodge around the old peak at
   (41, −2) retires with the mountain's restage, and the run line is re-authored straight — same marks,
   same target).
6. **INTERACTION.** Scroll only. Rest anchor: **mountain-reveal**, soft-rest eligible on touch.
   Reversing here runs the whole theatre backwards — forest returns, flat hides.
7. **ANIMATION.** Master: all acting (puppet lane), camera hold then trail. World clock: **the rope's
   coil and frayed strands carry a slow settle after the haul** (banked on his touch, `PUPPET.organic`,
   decaying to still) **and the disc lifts one pass of dust motes as it turns** (particle language,
   Performance flats, banked on the touch). Those two are the stage's only ambient, and both are
   motivated — the lantern ledger, kinetically. `gobT`: gait resumes.
8. **OUT.** **The walk-through** (S4→S5, the catalog's only use) begins as he crosses t36. Cost at this
   end: none — the theatre set stays up until 38 (`timeline.ts:152`).
9. **KEEPING.** **Keeping by absence:** the mountain is barely painted *because nobody has played there
   yet* — the register's proof that paint in this world is accumulated play. The bare disc half carries
   the tree ghost.


---

# STAGE 5 — PROOF OF TIME · t36–50 · C3→C4 at 37.6, C4→C5 at 49.5 · Perf → Prep → Perf

Eight beats, 20% of scroll — the film's largest share. Tense: *the intervention.* Air `skyHearth
#D4B184`; **the interior key family — the film's one azimuth move, +38°, hearth key
`(2.6, 3.2, 1.1)`** — hearth and candle practicals carry the room, the key is demoted, dark corners
are kept. It lights assets that exist nowhere else, which is why the move is safe.

**The set:** the **tavern interior shell** on its own island card — v1 `buildTavern()` geometry
(`world.ts:2921–3388`) re-surfaced. Cutaway room, open side facing +z, sized against
`MAX_PULLBACK 2.2` by construction (14-unit walls, 22-unit floor) so portrait never sees outside
the set.

**Retirements executed here:** window `crossHatch` (`world.ts:3018`) → **a real view of the undrawn
world through the glass** · firebox `crossHatch` (`3059`) → painted dark + coals · bay hatch
(`3001`), table-wear hatch (`3131`) → drybrush · sheets (`3249`) and DM screen (`3277`) → authored
scribble rows · **`buildFinger` (`2888–2918`) and `nudgeFinger` (`3192–3197`, `timeline.ts:656–676`)
deleted**, with the crease hatch at `2914` · the v1 goblin hide/park sets (`timeline.ts:601–610`,
`646`) retire — he is IN this scene now.

**Two staging rulings that close mechanism gaps, made once:**

- **The window's view of the undrawn world is two flat baked graphite cards on a
  `MeshBasicMaterial`, outside the trilayer entirely** (paper-props class bake, fog off, no glass
  material — the muntin frame is an opening). They need no state: they are already graphite, so
  they read identically in Performance and inside the freeze, and the curtain's post pass leaves
  them where they are (its ramp's endpoints are fixed points — paper maps to paper, ink to ink).
  **This is why no "stays drawn" uniform is funded.** Cost: zero per-mesh trilayer materials.
- **The DM screen's outward map face is one per-mesh trilayer material with `alive = 1` set at
  build and never tweened.** A map is already both drawing and paint, so it stays painted inside the
  freeze by the same rule that keeps the goblin painted. It is a small dedicated **256² map-vocabulary
  bake in the paper-props class — never a `bakeBoardMap()` slice** (that would drag the film's biggest
  bake seven stages early and break G2's schedule).

## S5-B1 · t36–38 · THE WALK-THROUGH · A

1. **ARGUMENT.** *Backstage connects everything; the sets are one workshop and he commutes through its
   walls.*
2. **MESSAGE.** None. In the dark, **the margin is the only legible thing** — sheet, ticks, ruler — and
   the interface holds the visitor's hand through the one dark corridor in the film. The numeral
   cross-fades C3→C4 at 37.6, inside the darkness; the `skyCut` grade lands with it (same mark as
   `timeline.ts:611`, crossfaded under darkness instead of on a hard cut).
3. **VISUAL.** Camera trailing him, **elevation ≈21°**. He crosses the bare disc and passes the flat's
   edge; **its braced graphite back wipes the frame** — a near-black silhouette plane, Prep's depth
   language: a shape in front of the drawing. **Darkness t ≈ 37.2–37.9.** The held tone is specified,
   not left open: **`caveDark #3F3226` lifted one value step toward paper — a 12% `paper` mix, ≈`#4E4133`**
   — never true black (the film's only true black is the `#blackout` overlay at t0–5.5). Against it the
   margin furniture renders in **`paper` at 55%, measured ≥3.5:1**, breathing. An exposure crossfade
   t ≈ 37.8–38.1 opens on the tavern establish; behind the glass of the crossfade the sets swap.
4. **3D.** Exit side: as S4-B6. Entry side: the full tavern (B2's list). The flats' backs: 2 graphite
   brace cards (part of the mountain flat asset). Set swap under darkness via `onlyFor` triads —
   theatre out at 38 (`timeline.ts:152`), tavern in at 38 (`:160`).
5. **GOBLIN.** Run, `speed 1`, straight past the flat's edge; the camera follows HIM into the dark —
   then he peels off during the crossfade. **When the tavern opens he is NOT in shot**, staged off
   frame-left by the door, invisible until B4. The scene must open on the table, not on him.
6. **INTERACTION.** None. A visitor who parks mid-darkness holds **a composed dark frame with a
   breathing margin** — never a broken one. This is a named held-frame QA case.
7. **ANIMATION.** Master: his run, the camera rail, the exposure crossfade (a scrub-tied opacity/grade
   pair, `tl.set`s `PAIR_GAP` = 0.025 t apart, authored as `c − PAIR_GAP`), the set-visibility triads. World clock: the tavern's ambient life —
   hearth flicker, candle, patron sway — fades in with the crossfade at `timeScale 1`. `gobT`: gait.
   **Reverse:** the crossfade mirrors; the triads un-set themselves (the shipped pattern,
   `timeline.ts:129–139`).
8. **OUT.** None — B1 *is* the transition and it ends standing in B2's establish. S6's class bakes are
   kicked during this stage's idle per G2; this stage has the film's longest runway, and it is used.
9. **KEEPING.** The flats' braced backs — the world's stagecraft admitted in graphite for two beats.

## S5-B2 · t38–40.6 · THE ROLL · E (establish) then A (the die is the actor)

1. **ARGUMENT.** *The whole night hangs on one number, and the number came up wrong.*
2. **MESSAGE.** None — `nat1` was cut in the copy pass. **The die's painted face is the caption.** The
   freeze coming is unannounced.
3. **VISUAL.** Establish t38–38.3, restaged from v1's `[80, 2.1, 6.2]` (~10°, below the clamp) to
   **`[80, 4.8, 6.4] → [80, 1.1, 0.4]`, elevation ≈28°**: foreground the table's near edge, middle the
   die's landing zone with the DM mid-throw behind the screen at far-left, far the hearth right and the
   window left — and **through the window, the undrawn world in pencil**: graphite path and trees where
   the room's paint stops. Then the inherited dive to the die close (`[80.42, 2.42, 1.5] → [80, 1.28, 0]`,
   ~37°, `timeline.ts:635`) — die large, numerals unambiguous, QA'd from this exact angle. Candle pool
   warm; hearth glow on the world clock.
4. **3D.** Tavern shell (R, `world.ts:2929–3002`) · **window view set (N — muntin frame kept, no glass
   material, 2 flat baked graphite cards behind it)** · hearth + firebox painted dark + coals (R,
   `3039–3082`) with `buildFlames` tongues on the world clock · shelf + 5 bottles (R) · table (R,
   `3107–3144`) with the new wear bake · **the d20** (R geometry, `dieGeometry.ts`; jewel re-surface:
   `dieBone` gouache, painted numerals, worn edges, one authored glint) · DM + 2 players (R, `3199–3214`,
   silhouette-first, painted cloaks, no interior hatch) · patrons ×3 (R, `3282–3296`) · mugs ×3 + sheets
   ×3 + DM screen (R, `3216–3280`, scribble rows) · candle (R, `3298–3338`; ray burst retired, amber glow
   sprite grammar) · benches ×3 (R) · door (R). All merged per class. **Per-mesh materials #8 and #9:
   the die** (a `reveal()` target) **and the DM screen's map face** (permanently alive).
5. **GOBLIN.** Absent from frame, staged off frame-left by the door. **The DM acts:** one authored
   arm-swing releasing the die at 37.9–38.2 — cast-tier acting on the puppet lane. The cast may act; it
   may never out-chroma him.
6. **INTERACTION.** None. Rest anchor at **nat-1** (~40.2). The gearing is long here: at full flick speed
   this stage still spans ~2 swipes, so the centrepiece cannot be accidentally skipped.
7. **ANIMATION.** Master: die tumble/bounce/settle (marks t38–40 kept, `timeline.ts:614–628`;
   `SETTLE.heavy`, authored inertia re-judged for weight in the jewel pass), camera dive, DM throw.
   World clock: hearth flicker, candle, patron sway. **Spill-drop does not fall yet.** `gobT`: idle
   offstage. The die's rotation `tl.set` at t38 pairs with its tween per scrub safety.
8. **OUT.** **The tick** at t40.6.
9. **KEEPING.** The room in second plane: table drybrush where forearms have rested for years, the candle's
   drip stack, hearth scorch as painted dark pooling, the bottle shelf rubbed at grab height. None of it
   eye-path; the die is the subject.

## S5-B3 · t40.6–41.3 · THE TICK · E

1. **ARGUMENT.** *Time is a thing someone can hold.*
2. **MESSAGE.** None — the freeze is wordless by decision. Silence made visible is the message.
3. **VISUAL.** Absolute freeze, instant, unannounced: the room lifts to underdrawing mid-laugh. Mugs hang
   tilted, a spilled drop stops in the air, candleflames become still graphite teardrops, **the patrons,
   the players and the DM all freeze into graphite with everything else** (G6 — both parties, always), the
   grid ghosts under the floorboards at ≤`GRID_INK`. The margin breathes to full. Then a slow straight
   dolly back (t40.75–42.2, settle lane, scrub-tied) opens **the freeze's authored flagship framing** —
   table-level medium, **≈24°**: near plane the tabletop's near edge at reading scale, middle the graphite
   die on its 1 and the empty bench, far three graphite figures caught mid-laugh, the hearth's drawn
   teardrops, and **the window's pencil world now continuous with the room** — outside and inside agree at
   last; the room was the exception. One deliberate persistence: **the DM screen's map face stays painted
   inside the freeze**, plane four, discoverable, planting S7/S8.
4. **3D.** As B2, flipped to Prep by the curtain. **Spill-drop prop (N:** 2 painted droplet flats + a
   tabletop splash decal, Performance-side, frozen by construction — but its *fall* is timeline-authored,
   see B8). Grid ghost under the floorboards. **No practical glow: glow dies with the paint**
   (`rigs.ts:143`).
5. **GOBLIN.** None yet — one beat of held, empty, frozen room. The pause before he enters is the joke's
   setup.
6. **INTERACTION.** None. The margin breathe answers the freeze (`T_BEAT` at +0.1 t); ruler and numeral
   are at full legibility — the interface reads the file with you.
7. **ANIMATION.** The tick recipe verbatim: `timeScale → 0` in ≤0.15 t **and** `curtain → 1` in 0.35 t
   `power2.out`, same cue — this wires v1's drain (`timeline.ts:645`) onto the named recipe and closes
   P2-T4 for this beat. Camera dolly scrub-tied. Everything world-clocked stops same-frame by
   construction. `gobT` never stops — he breathes offstage. **Reverse: exact mirror.**
8. **OUT.** None — the freeze holds 6.4 t (t40.6–47). B4 enters it.
9. **KEEPING.** **The freeze IS the file opening.** The screen's persistent map face and the grid ghost —
   the oldest layer — are this beat's receipts.

## S5-B4 · t41.3–42.6 · HE STROLLS IN · FLAGSHIP 3 · A

1. **ARGUMENT.** *This room has hosted years of the game he is about to rescue — and he is the one who
   kept it.*
2. **MESSAGE.** None. The rings are marks, not type. The meaning is carried by contrast: painted goblin /
   graphite world / **the only shadow in the room.**
3. **VISUAL.** The flagship's one authored framing, held from B3. Near plane: the tabletop's near edge with
   **three overlapping graphite mug rings at reading scale, plus one fresh mug standing slightly off its
   own ring** — the ring outlives the mug. The rings ride the foreground element, never the subject.
   Middle: the die, the bench, and him entering frame-left through the door, walking the floorboards
   between graphite patrons. Far: the frozen laugh, hearth, window. **His shadow sweeps the boards as he
   crosses — the frame's only moving shadow** (`rig.aliveShadow`; world casters released at the fully-drawn
   page). Figure floor ≥100 px landscape.
4. **3D.** As B3. **Table wear bake (N):** forearm drybrush + one repair patch a single value step off
   (colour law 4). **The mug rings live in the underdrawing layer, not the wear bake** — they are
   pentimento, and the trilayer's own table assigns the revisions to the underdrawing. That is what lets
   B8's paint close over them. **Eraser-ghost #3 of 4 (N):** the door's previous swing arc in
   `graphiteLight` on the boards at the door he enters through — the door was once hung the other way.
   Bench top: a rubbed-paint patch where he lands.
5. **GOBLIN.** Enter through the door (frame-left) · stroll, unhurried, `speed ≈ 0.6`, along the table's
   far side · **`hop`** onto the bench (**new verb**, puppet lane, mandated by the `buildFinger`
   retirement — the one verb this stage adds), landing on the rubbed patch. He touches nothing yet.
6. **INTERACTION.** None. Scrubbing back walks him out backwards and re-seals the room — the projectionist
   can audit the entrance.
7. **ANIMATION.** Master: his path + the hop (puppet lane; the hop gets the leap's hand-authored-arc
   treatment), **camera dead still — the held framing is the flagship.** World clock: frozen. `gobT`:
   gait and breath live; he is the only alive thing, by construction. **Reverse:** clean — author the hop's
   arc symmetric and it reverses as a hop-down with no recipe.
8. **OUT.** None — continuous into B5; the camera's one push begins at B5's start.
9. **KEEPING.** **FLAGSHIP 3 — the graphite mug rings**, framed inside the freeze at reading scale.
   Supporting cast: the door's swing-arc ghost, the bench's rubbed landing patch, the fresh mug off its
   ring. **Phone valve:** if 390 px cannot hold both his path and the rings, the rings demote to texture at
   that breakpoint; the shot does not shrink.

## S5-B5 · t42.6–43.7 · THE LOOK · A

1. **ARGUMENT.** *He knows we can see him. We are backstage together; what happens next is between us.*
2. **MESSAGE.** None. The eyeline is the message, and the shrug is the film's entire editorial position on
   cheating: *someone has to.*
3. **VISUAL.** One slow straight push begins at 42.4 and runs to 44.4 — **one move, one direction** —
   passing through the direct-address close at ~43.0 and landing on the nudge macro at 44.4. At the look:
   **dead-centre framing** (the second and last of the film's two direct addresses), his face over the
   graphite die, the amber eye the loudest chroma in frame by one step. Foreground: the die, graphite.
   Middle: him. Far: the frozen room, separated **by value and by the depth-to-paper ramp — there is no
   DOF pass in this film** (§0, amendment 4).
4. **3D.** As B4. Nothing new.
5. **GOBLIN.** `look` at the die (neck→head follow-through, `actions.ts:294`) → `look` to lens →
   `express('flat')` → `shrug` (`actions.ts:431`). Practiced, no hesitation.
6. **INTERACTION.** **The soft rest at the look** (touch only; momentum dying within ±0.35 t eases over
   220 ms) — the single most engineered half-second on the site: every phone visitor stops here, eye to
   eye, exactly once. Keyboard `↓` lands here. Nothing clickable; the look answers the visitor's presence
   better than any hover could.
7. **ANIMATION.** Master: the push (settle lane, straight, ~2.0 t), his acting (puppet lane). World frozen;
   `gobT` alive. Reverse: mirror.
8. **OUT.** None — the push continues into B6.
9. **KEEPING.** The rings hold the near plane through the push's first half; the die's worn edges begin to
   read as the macro approaches — an object handled for years.

## S5-B6 · t43.7–44.5 · THE NUDGE · A

1. **ARGUMENT.** *The smallest possible intervention saves the night — drama belongs to the DM; the goblin
   only turns one face.*
2. **MESSAGE.** None — `nat20` was cut. The painted 20 reads its own face.
3. **VISUAL.** The macro at the push's end: the die filling frame, his hand and forearm entering from
   behind it, his face above, **elevation ≈30°**. The 20's numerals painted, worn edges, the one authored
   glint; QA'd at 390 px from this exact angle (1 vs 20 vs neighbours unambiguous). **Separation is the
   depth-to-paper ramp tightened for this beat — `rig.depthNear`/`depthFar` pulled in as a scrub-safe
   uniform pair, one of the film's exactly two such moments.** The graphite room ramps to paper beyond.
4. **3D.** As B4. The die is the film's one object at that table that crosses: `reveal()` target + the
   `alive` step at contact.
5. **GOBLIN.** `reach` solved to the die's near-left edge (`plantFor`'s furniture floor handles the
   bench+table stack, `actions.ts:200+`) → **`nudge`** (`actions.ts:568`): **the anticipation is the
   0.30 s wrist flip to butt-forward, and the push-through is a few millimetres of the PENCIL BUTT — not
   a fingertip.** **[ERRATA 2026-09-03 — "one fingertip" contradicted the goblin doc §10 and §15 failure
   mode 5 (*mitts have no fingers; fine manipulation is always the pencil's job*), which the §0 table
   marks LOCKED for the character — and it contradicted the shipped verb: `nudge()` already writes
   `wrist.rotation.y → side * 2.6` as *"the flip: 0.30 s of wrist, and it is the only warning the die
   gets"*, with `express('sly')`. The pencil butt is the beat.]** Nothing else moves. **The die may need to sit a few
   centimetres nearer the bench edge than v1's `(80, 1.21, 0)` for the reach to solve without the
   invisible-tray read** — budget the rehearsal, `puppet.check` at both breakpoint camera targets.
6. **INTERACTION.** None. The gearing gives the tip its grace: at play pace the tip-over is 0.5 s; under
   scrub the visitor owns its speed — the most satisfying scrub-inch on the site. Rest anchor: **the-20.**
7. **ANIMATION.** Master: the push settles (44.4); the nudge (puppet lane); **the die's `alive` step at
   contact plus its mask shell blooming from the die's own centre over 0.7 s** — colour and its shadow
   arrive together; then the tip 43.75–44.25 via `dieTipAngle` (`timeline.ts:668–672`), `power2.inOut`,
   weighted like a real jewel. **Dead still before it — the held-breath rock stays rejected.** World
   frozen; `gobT` alive. **Reverse:** scrubbing back un-tips the die to 1 and **un-paints it**, then
   un-touches. Reveal order is the un-keeping order, correct by construction.
8. **OUT.** None — hold the macro one beat as he withdraws his hand.
9. **KEEPING.** The die's worn edges under fresh paint — the most-handled object in the film's world,
   restored mid-freeze by its keeper.

## S5-B7 · t44.5–47 · DUST OFF, WALK AWAY · A

1. **ARGUMENT.** *He doesn't want credit. This is routine — the ten-thousandth night, not a heroic one.*
2. **MESSAGE.** None. The exit's briskness is the characterization; the empty frozen room he leaves behind
   — painted die, graphite everything — is the film's cleanest single image of the concept.
3. **VISUAL.** The macro widening as the pull begins (t46.5–49, `timeline.ts:684`): the painted 20 in the
   foreground, the one warm object in a graphite room; his back crossing the middle plane toward the door;
   the frozen laugh beyond. **He exits frame-left by ~46.3, before time resumes** — the cheer must find the
   room exactly as the players left it.
4. **3D.** As B6. Nothing created, nothing destroyed.
5. **GOBLIN.** `dustOff` (`actions.ts:470`) → `hop` down (the new verb, reversed staging) → stroll to the
   door → exit frame. His path retraces his entrance line — the commute again, the same boards.
6. **INTERACTION.** None. Scrub-back replays the whole intervention backwards; this is the most
   repeat-scrubbed stretch of the stage and **every tween in it is symmetric by construction.**
7. **ANIMATION.** Master: acting (puppet lane), camera pull (settle lane, `power2.inOut`). World frozen
   until B8. `gobT` alive.
8. **OUT.** **The exhale** at t47.
9. **KEEPING.** His exit line crosses the door's swing-arc ghost one last time — entrance and exit
   bracketed by the same mark of prior keeping.

## S5-B8 · t47–50 · THE EXHALE — "You're welcome." · E

1. **ARGUMENT.** *Nobody in the world will ever know. The DM gets the drama, the players get the miracle,
   the goblin gets nothing — and prefers it.*
2. **MESSAGE.** `welcome` — **"You're welcome."** — `cap('welcome', 47.3, 1.3)` (`timeline.ts:687–694`;
   retiming locked in copy-spec). The Hand, lower-third band, ink. **Delivered from off-frame** — he has
   left; the line rides over a room that does not know he was there, which is the joke. Clear by 49.0.
3. **VISUAL.** Time resumes mid-gesture: `timeScale → 1` over `T_EXHALE` (t47–47.3, `timeline.ts:678`)
   with `snapBack(47)` (`:679`, `SETTLE.snap` — the punchline reserve); colour floods back; the spilled
   drop lands; the cheer finishes as though nobody noticed. The pull-back settles at a **≈30° table
   medium**: the room in full paint and lamplight, players' arms up mid-cheer, the DM reaching for the die,
   the 20 face up, **the window still showing pencil beyond** — outside remains undrawn; the room is the
   kept thing. **The mug rings are gone under the paint** — evidence closed with the file, which is exactly
   why they live in the underdrawing layer.
4. **3D.** As B7, Performance side. Nothing created; the spill decal registers on the tabletop as the drop
   lands. Sky grades toward `skyVellum` from 47 (`timeline.ts:685`) so C4→C5 resolves before the cut.
5. **GOBLIN.** None — offstage. **The v1 `visible: true` re-park at 49.95 retires with the hide pair; his
   t50 staging is owned by S6-B1 and is specified there.**
6. **INTERACTION.** Rest anchor at **welcome.** Play/skip stand as ever. The beat rewards stillness.
7. **ANIMATION.** The exhale recipe verbatim: the timeScale ramp over 0.3 t, the world resuming MID-gesture
   — the cheer was always mid-rise under the graphite; the freeze never restarted anyone. **The spill-drop's
   fall is timeline-authored** (a 0.2 t tween at 47.3), **not world-clocked** — a one-shot on the world clock
   would not reverse; as a tween it re-hangs on scrub-back. Cheer arms: puppet-lane tweens 47.3–48.2. World
   clock: hearth, candle, sway resume. Caption scrub-tied.
8. **OUT.** **The page turn** at t50 — one frame of paper, never black, `tl.set` pair `PAIR_GAP` (0.025 t) apart, authored as `c − PAIR_GAP`. Tavern
   set out at 49.9 (`timeline.ts:160`), montage in at 49.5 (`:161`). **Confirm in both scrub directions that
   the six islets at z = −40 sit outside the tavern establish's frustum for that 0.4 t overlap** — a named
   QA case. S6's bakes are already warm.
9. **KEEPING.** The proof completes negatively: **the keeping is invisible to the kept.** The visitor alone
   holds the evidence — which is exactly the belief `pitch1` cashes at t58.

### THE t50 HANDOFF — binding

| Facet | State at exactly t50 |
|---|---|
| **Transition** | the page turn: one frame of paper, `tl.set` pair `PAIR_GAP` (0.025 t) apart |
| **Goblin** | **owned by S6-B1.** One paired `tl.set` cluster at **t50.00** (position, `rotation.y`, `speed`, `express`) onto islet 0's solved stand, **with its inverse at `50.00 − PAIR_GAP` = 49.975** (ERRATA 2026-09-03 — was "t49.98", a decimal literal; author the expression) restoring his tavern-exit pose so a backward scrub returns him to the door line. **Asserted in `motion.check`.** He carries nothing; the pencil and brush are islet-resident props |
| **World** | `timeScale 1` since 47.3, Performance, full paint, `curtain = 0`, `seamX = 1e6` (retired at 30.34 and never reused) |
| **Sky** | already at `skyVellum` (`sky(47, 2.5)`, `timeline.ts:685`); C4→C5 has resolved before the cut |
| **Interface** | `welcome` cleared by 49.0; no caption is on screen again until `pitch1` at 58.0. Skip note live. Ruler visibly accelerating |
| **Budget carried in** | **9 per-mesh materials of 40** (fire2, lamppost, cave+door, chest, mushrooms, signpost, rope, die, DM screen) + the goblin = 10. S7 needs 13. See §6 |


---

# STAGE 6 — THE MANY JOBS · t50–57.5 · C5 · Performance, silent

Seven beats. Tense: *habitual.* **State:** Performance throughout — **no freeze, no frontier**;
`curtain = 0`, `seamX = 1e6`, `timeScale = 1`. Air `skyVellum #EEE6D2`, bright, flat, weightless.
**One soft day-family key (+18°) per vignette, never changing mid-vignette.** Every cut is the page
turn: one frame of paper, never black, reversible. **No rest anchors inside the stage** — locked:
the one stage that rewards momentum; `PgDn` jumps it. The ruler visibly accelerates.

**Cut times are shipped and untouched:** `50 + i·1.25` (`timeline.ts:740–744`). **Disc positions
are shipped and untouched:** x = 0, 8, 16, 24, 32, 40 at z = −40 (`world.ts:3396`). **Camera solves
are shipped and untouched** (`timeline.ts:721–738`), including the 0.09 push drift (`:785`) and the
`i % 2` stand-side flip that makes the six shots alternate. **Because alternation is a function of
the slot index, not of the subject, keeping every subject on its own slot's solve preserves strict
alternation with zero camera authoring.**

### The six subjects — this supersedes Chapter Three's R1 and R2

The direction's S6 column named seven subjects; the experience doc's Sell-list named six. The
resolution is not to demote the tree — it is to **cut the chest.** The chest vignette re-argued
S3-B5 ("even the reward is authored") with the same registered prop thirty seconds later, and the
montage's job is to *accumulate*, not restate. Cutting it also frees the film's best-fitting
shipped solve for a better subject.

| Slot | x | Shipped solve | Subject | Why this solve |
|---|---|---|---|---|
| 0 | 0 | map table, favours the near corner, lens −x | **the road** | authored for exactly this |
| 1 | 8 | far-side stand, subject rears to ~1.6, lens +x | **the monster** | authored for exactly this |
| 2 | 16 | drop above his reach, lens low and back, −x | **the tavern sign** | authored for exactly this |
| 3 | 24 | "three of them across a unit, planted at the base", lens +x | **the saplings** | authored for exactly this; `plantAndPat` gets its literal tree back |
| 4 | 32 | "low and small, so the lens drops to meet it", lens −x | **the NPC miniature** | a based figure one cell across is *the* low, small subject; a better fit than the chest ever was |
| 5 | 40 | the smallest subject, the tightest shot, +x | **the candles** | authored for exactly this |

Alternation: **− + − + − +.** Strict, unbroken, no re-derived solve. The NPC keeps vignette index 4
(the register's "vignette 5", 1-based) and its token rhyme into S7/S8.

**The six islets.** Small square work-sheet cards (~5×5 world units) with the full island grammar at
worksheet scale: sectioned three-band cut edge, a drawn rim contour that stops being drawn, grid ghost
at ≤`GRID_INK` running a few cells onto the paper, page drop shadow, and **non-verbal draughting marks
in the margins** — dimension ticks, one arrow, an X where a prop will stand, all `pencil.ts` primitives,
never a font. Each islet reads as a page from the keeper's workbook. **The v1 cylinders + rim + hatch
ring (`world.ts:3398–3416`, hatch at `3409`) are deleted.**

**The S3 grammar reprised at tempo:** in each vignette the one touched thing banks its life — one idle
begins as his hand leaves it, on the world clock, and runs until the next page turn. **Exception: the
NPC miniature, which never idles.** It is a piece, not a creature, and its stillness among the others is
the product rhyme, on purpose.

**Deleted on this stage's watch:** the montage ring hatch (`3409`) · the fragment window `crossHatch`
(`3687`) → painted `caveDark` behind slats with a drawn frame · the montage tone hatches at `3772`
(mound) → **painted soil tone in the islet albedo** and `3784` (stump rings) → **painted concentric
value steps in the timber bake** · `3809` (`hoardTone`) and `3864` (`written5`) → **deleted with the
chest vignette's geometry** · `buildRayBurst` at `3869` — rays were v1's word for light; v2's word is the
amber ramp.

## S6-B1 · t50–51.25 · THE ROAD · A

1. **ARGUMENT.** *The heroic night is over; this is the job — and the job includes drawing the world
   itself.* First belief of the stage: **the goblin authors maps.**
2. **MESSAGE.** None (the montage is silent — locked). The cut grammar carries it: paper flash → a workbook
   page → one job done in one gesture.
3. **VISUAL.** Slot 0's solve: lens ≤3 units out, just outboard of his stand, shooting down the line from
   him to the job, above the work surface; 0.09 push drift over the cut. Islet 0: the map table (timber
   class, ruled silhouette kept, `bakeBark` grain) carrying the map sheet — paper-props class: `dieBone`
   ground, authored illegible scribble-rows one direction, dog-eared corner, held by two painted weight
   stones; quill and inkpot beside it. Foreground: the islet's near cut edge in section. Subject plane: the
   sheet and his hand. The **fence-post carpenter's pencil** leans against the table. Far: bare paper void,
   islet edge in frame. **Graphite:** the road's construction — dimension ticks and one arrow in the sheet's
   margin marking where the road must reach.
4. **3D.** Islet card 0 (**N**) · map table (R, carpentry) · map sheet + quill + inkpot (R, keeping props) ·
   fence-post pencil (R, hero #5 rescaled) · **brush + pigment pot (N — hero tier item 6, its one on-camera
   use in the film)** · 2 weight stones (R, rock kit, merged) · draughting-mark set (**N**, shared across all
   six islets). Table, stones and pot merge into the islet's static geometry; sheet, road, pencil and brush
   stay separate. **Per-mesh material #10: the road mark** (it animates — the v1 `roadLine` scale-from-anchor
   mechanism at `world.ts:3468–3478`, kept, re-surfaced as an inked road stroke, not an `ember` box).
5. **GOBLIN.** **His t50 staging is owned here** (see the S5 handoff): a paired `tl.set` cluster at 50.00 with
   its inverse at 49.98. Then the shipped arrival grammar — gait in, a last stride along his own facing
   (`timeline.ts:799–807`) — a draughtsman's `stoop` over the sheet, the pencil sweeps and the road draws
   itself under the sweep (`roadLine.scale.x → 1`, scrub-tied). Then, **the trilayer's origin story as two
   props**, he swaps pencil for brush: **one `touchUp` stroke** — used exactly once in the film, here — and
   the road's paint side arrives along the bristle line. He does not exit; the page turns on him.
6. **INTERACTION.** None. Responsiveness: the road ink is 1:1 with the scrub; drag backwards and the road
   un-draws, the brush stroke un-paints. **That reversal IS the feedback.**
7. **ANIMATION.** Master: the cut, the drift, the stoop, the pencil sweep, the road scale, the touchUp.
   World clock (banked on hand-leave): the sheet's held corner settles with a paper flutter ≤2 px, once,
   then still. **Special reverse care, binding on all six vignettes:** the vignette-entry `tl.set`s
   (position, rotation, speed) must be authored as `c` / `c − PAIR_GAP` — **`PAIR_GAP = 0.025 t`** — so
   reverse replays them in reverse order. **[ERRATA 2026-09-03, motion doc D-13 applied — this said
   "paired at identical positions", which is the exact bug `timeline.ts:144–146` records ("the film's
   first frame came back with the camp missing") and which `clocks.check.ts:66–74` fails the build on.
   It also contradicted this book's own "≥0.02 t apart" at §S4-B5, §S5-B1, §S5-B8 and the t50 handoff.
   The gap must be authored as an expression, never as two decimal literals: `30.34 − 30.32 =
   0.019999999999999574`, **below** the shipped 0.02 floor, while `c − (c − 0.025) = 0.0249999…` clears
   it for every mark in the film.]** A drifted set is an invisible bug until someone scrubs backwards.
   **Assert in `clocks.check` (extended to evaluate the `<num> − PAIR_GAP` form), not in a second checker.**
8. **OUT.** **The page turn** at t51.25. Cost: nothing created or destroyed — both islets are resident
   (`montageSet` visible 49.5–57.7) — a camera `cut()` plus the goblin relocate sets.
9. **KEEPING.** The pencil is worn short and the pot lid sits crooked — handled tools. The sheet's margin
   ticks say the road was **measured before it was drawn.**

## S6-B2 · t51.25–52.5 · THE MONSTER · A

1. **ARGUMENT.** *He stocks the encounters too.* The player reads "monster"; the DM reads "encounter
   placement."
2. **MESSAGE.** None. The X on the ground carries it: the monster lands where the mark said it would.
3. **VISUAL.** Slot 1's solve (far-side stand, standoff floor for the haunch). Islet 1: a bare worksheet
   with a single graphite **X** at centre and a scuffed ring where the X has been redrawn — value-step wear,
   **not an eraser ghost** (the film's four are spent elsewhere). The monster rears to ~1.6 u; he works it
   from the far side so both read. The soft key gives the bulk one committed shadow side.
4. **3D.** Islet card 1 (**N**) · **the monster — geometry kept verbatim** (`world.ts:3487–3660`: lathe bulk,
   bent arms, brow bar, lantern eyes, underbite + tusks), **surface repainted**: `monsterHide` gouache in 3
   quantized tiers on the bulk, and **the tick-stroke shag kept as authored language** (`world.ts:3532–3563`
   — the direction names it already correct, authored specifically as not-hatch); claws `caveDark`, tusks
   `gobTooth`, eyes `flameCore`. **Per-mesh materials: none — a scale-in transform needs no material state.**
   The monster group merges internally where static.
5. **GOBLIN.** Two-handed set-down (shipped case-1 staging, `timeline.ts:822–829`): `crouch`, both-hands
   `reach`, `express('strain')` — the monster grows from zero under his hands (`PUPPET.pop`) and lands ON the
   X — step back, `armRest` both sides, `express('smug')`.
6. **INTERACTION.** None. Reverse-scrub shrinks the monster back into his hands — legible, funny, free.
7. **ANIMATION.** Master: cut, drift, set-down, monster scale. World clock (banked): **one idle breath cycle,
   chest scale ±1%**, after his hands leave — the encounter is now alive. The idle's visibility is gated on
   the scrub-tied set-down progress, exactly as the S3 props' banked idles are; **nothing boolean-flips.**
8. **OUT.** The page turn at t52.5.
9. **KEEPING.** The redrawn X's scuffed ring — this encounter slot has been used before.

## S6-B3 · t52.5–53.75 · THE SIGN · A

1. **ARGUMENT.** *The world's dressing — signage, the reads players never question — is his too.*
2. **MESSAGE.** None. The tankard device on the sign carries "tavern" alone.
3. **VISUAL.** Slot 2's solve (drop above his reach, lens low and back). Islet 2: the tavern wall fragment —
   timber class with plank-grain bake, ruled silhouette; **the shuttered window's `crossHatch`
   (`world.ts:3687`) is retired** — the shutter becomes painted `caveDark` behind slats with a drawn frame.
   Bracket, curl and brace in `iron` gouache, matte. The sign hangs 0.95 above its bracket at the cut and
   drops home.
4. **3D.** Islet card 2 (**N**) · wall fragment + planks + plinth (R, re-surfaced) · bracket + brace + scroll
   curl (R) · tavern sign + chains (R; the sign face gets the paper-props scribble-row treatment for its
   border, painted tankard device kept, `world.ts:3723–3762`). **Per-mesh materials: none** — the sign is
   transform-animated. Wall merges static.
5. **GOBLIN.** **`hang`** (new verb, puppet lane): he guides the drop in from under it — `reach` up,
   `express('strain')` — the sign falls onto the bracket (`PUPPET.drop`, **the film's one sanctioned
   bounce**), then he `tap`s it level twice.
6. **INTERACTION.** None. The drop's bounce is the frame's own responsiveness.
7. **ANIMATION.** Master: cut, drift, hang, drop, taps. World clock (banked): the sign swings on its chains in
   a decaying pendulum — ~3 swings, then still — after the tap. **Reverse:** the drop tween reverses; the
   bounce runs backward acceptably inside a 1.25 t window — **verify at flick speed** (named QA case).
8. **OUT.** The page turn at t53.75.
9. **KEEPING.** The bracket's underside is **rubbed bright where chains have swung for years** — this is not
   the first sign it has held.

## S6-B4 · t53.75–55 · THE SAPLINGS · A

1. **ARGUMENT.** *He plants the world, and he plans the next one.* The habitual tense at its plainest: a job
   whose payoff is a season away.
2. **MESSAGE.** None. The soil pat and the draughting X where the *next* tree goes carry it.
3. **VISUAL.** Slot 3's solve — authored for three subjects across a unit, planted at the base rather than the
   tops, so the shot already looks at the ground where the work happens. Islet 3: a mound of turned soil
   (**painted soil tone in the islet albedo — `world.ts:3772`'s hatch is deleted**), the sapling trio, one old
   stump beside them whose **rings are painted concentric value steps in the timber bake** (`world.ts:3784`'s
   hatch deleted) — someone felled here and planted here before — and a graphite **X** in the margin marking
   where the next one goes.
4. **3D.** Islet card 3 (**N**) · sapling trio (R, flora kit, merged) · old stump + rings (R, re-surfaced) ·
   mound (R, re-surfaced) · draughting marks (shared set). **Per-mesh materials: none** — the saplings are
   transform-animated as they are planted.
5. **GOBLIN.** **`plantAndPat`** (new verb, puppet lane) ×3 at a quick clip: three quick plantings — set the
   root ball, pat the soil once, move a pace along the row. The verb gets its literal tree, exactly as the
   direction's verb list names it.
6. **INTERACTION.** None. Reverse un-plants the row, right to left.
7. **ANIMATION.** Master: cut, drift, three plant-and-pats. World clock (banked): **the last-planted sapling's
   crown carries one slow leaf-sway** after his hand leaves it. Everything else still.
8. **OUT.** The page turn at t55.
9. **KEEPING.** The pat-marked soil and the stump's rings. And the margin X: **the job after this one is
   already decided.**

## S6-B5 · t55–56.25 · THE NPC · A

1. **ARGUMENT.** *People are placed like pieces — and the pieces are tokens.* The most product-literal beat in
   the film: a painted figure on a visible base **is** a token. It plants the S7/S8 payoff.
2. **MESSAGE.** None. The X on the village square carries it: mark → placement, the same grammar a DM performs
   on the product's map.
3. **VISUAL.** Slot 4's solve — the lens drops to meet a low, small subject, which is exactly what a based
   miniature one cell across is. Islet 4: a **miniature village** — three gabled houses (carpentry register), a
   lane of the islet's baked albedo, and at the square's centre the placement **X**. He enters carrying the
   **NPC based miniature**: a painted figure (cloth class, `cloakIndigo`, silhouette-first, never
   out-chroma-ing him) on a visible `dieBone` base disc, one cell across.
4. **3D.** Islet card 4 (**N**) · **NPC based miniature (N — the register's one new cast prop, hero-adjacent
   polish at its scale)** · gabled house ×3 (R, merged per class) · draughting marks (shared). **Per-mesh
   materials: none** — the miniature is a held, transform-animated mesh.
5. **GOBLIN.** He walks in with the miniature held ahead of him **like a chess piece** — the script's own simile
   made literal — two deliberate steps, then plants the base exactly on the X, and **leans back to check the
   sightline to the tavern-ward house, the way a DM squares a token to the grid.**
6. **INTERACTION.** None. The base-on-X registration is the frame's answer: **precision as feedback.**
7. **ANIMATION.** Master: cut, drift, carry-walk, the set-down, the lean-back. World clock: **nothing banks —
   the miniature never idles.** Its stillness among five idling vignettes is the product rhyme, on purpose.
   Reverses cleanly (pure transforms).
8. **OUT.** The page turn at t56.25.
9. **KEEPING.** The X's placement mark, and the lane's worn centre where feet have gone for years. Habitual
   tense, exactly as §2 assigns S6.

## S6-B6 · t56.25–57.1 · THE CANDLES · A

1. **ARGUMENT.** *Light, again — the first job and the last one are the same job.* The montage rhymes with the
   thesis before the verdict stage. **This rhyme is deliberate and cited by the direction's own lantern
   ledger; it is the one repetition the stage keeps.**
2. **MESSAGE.** None.
3. **VISUAL.** Slot 5's solve — the smallest subject, the tightest shot. Islet 5: the candle table (timber,
   round, one leg) with the three-candle set, brass holders, wax runs, and the open book (paper-props:
   `dieBone` + scribble rows one direction; **`world.ts:3864`'s hatch deleted**). Candles carry the fire/light
   class: **no flame before his touch** — a lit candle before the touch gives the cut away — then lathe-tongue
   flames + `buildGlowSprite` amber radials.
4. **3D.** Islet card 5 (**N**) · candle set ×3 + holders + drips (R, light kit, re-surface of
   `world.ts:3839–3856`) · candle table + book (R) · flame tongues + glow sprites ×3 (light kit; **the
   `buildRayBurst` at `world.ts:3869` retires**). **Per-mesh materials #11, #12, #13: the three candle flames**
   — each lights on its own mark, so each carries its own `alive` step. The glow family always is per-mesh.
5. **GOBLIN.** The careful one: `crouch`, one slow `reach` per candle (`power2.inOut`, shipped case-5 ease),
   `express('sly')` — three touches, three flames, down the table line.
6. **INTERACTION.** None. Reverse un-lights the candles one by one, in reverse order — **the ledger audited
   backwards.**
7. **ANIMATION.** Master: cut, drift, crouch, three lighting touches, per-candle `alive` step + glow bloom from
   the wick (0.6 s, touch-reveal grammar). World clock: flame flicker + glow sway, **banked per candle as lit,
   each on its own practical** (§6, the rig: the practicals array is capped at three, and this beat is why). Everything
   else holds still.
8. **OUT.** **None — continuous into B7, same shot, no cut.**
9. **KEEPING.** **The wax runs down one side of every candle — these candles have burned many nights before
   tonight.** The book's dog-eared corner.

## S6-B7 · t57.1–57.5 · THE TILT TO DAWN · E

1. **ARGUMENT.** *The montage was one night of many, and the night is ending.* It sets the verdict stage's air
   before a word is spent.
2. **MESSAGE.** None. The sky is the message.
3. **VISUAL.** The camera tilts up from the three flames along the table line, past the islet's rim (sheet-edge
   rule honoured at the top of the move), to the paper void warming: a scrub-tied `sky()` tween toward `skyDawn`,
   landing **just short**, so the t57.5 `skyCut` to `skyDawn` (`timeline.ts:887`) is invisible. **The cliff is
   not visible** — it lives at x ≈ 120 and the montage faces −z; the experience doc's "cliff in the distance" is
   geometrically false and is dropped. **The dawn sky does the handoff alone.**
4. **3D.** None new. `cliffSet` becomes visible at t57.0 behind the cut (`timeline.ts:166`) — free, off camera.
5. **GOBLIN.** He stays at the table below frame, done. No acting beat.
6. **INTERACTION.** None. The tilt is scrub-tied; dragging back re-descends to the flames.
7. **ANIMATION.** Master: the tilt (settle lane), the sky warm. World clock: **flame flicker continues under the
   tilt — the last live thing in frame.**
8. **OUT.** **The page turn** at t57.5 — the montage's last paper flash, into the cliff. **This is not a
   match-dissolve**; the catalog has seven transitions and no eighth is invented. Cost: camera cut, goblin
   relocate set (`timeline.ts:877`), `remains` hidden / `tended` shown (`:880–881`), `skyCut`. `montageSet` goes
   invisible at 57.7.
9. **KEEPING.** Carried by B6's wax.


---

# STAGE 7 — THE HANDOVER · t57.5–64.5 · C6 · Performance → the flatten

Seven beats. Tense: *the verdict.* Air `skyDawn #E6C1A2`; low dawn key, exterior-day family (+18° —
the cliff's one bake serves S1's night and S7's day precisely because the azimuth held). **Painted
god-ray cones in `rayGold` — light as a painted object, never a flare.** Rest anchors: the
tended-cairn read, and between the pitch lines. **State:** `curtain = 0` throughout; `timeScale = 1`;
**`seamX` stays parked at `1e6` for the entire stage** (§0, amendment 1).

The cliff island is the S1/S2 asset in its second era of dressing. The miniature world below is v1's
`miniWorld` topology (`world.ts:4125–4313`) kept and re-surfaced — **a real miniature, not a desk.**

**Deleted on this stage's watch:** cliff cracks (`3952`) → painted value-break fractures in the rock
bake · scorches and trample (`4016`, `4027`, `4044`) → gone with the remains · massif tone (`4208`)
→ reserved-paper snow + 3-tier rock · water (`4260`) → the water class's one funded pigment use: a
flat `water #679FB4` band with tangent-aligned lit dabs and a drawn edge · field till (`4297`) →
painted field washes.

### The flatten's mechanism — decided here, not in the build

**`uTriFlat` alone drives the flatten. `rig.seamX` is not used.** In the shader, `triSeamF =
smoothstep(seamX−w, seamX+w, vTriWorld.x)` and `triC = max(uTriCurtain, triSeamF)`: fragments **east**
of `seamX` are Prep, and the seam can only ever add Prep. Ramping `seamX` from its `1e6` park to 118
would flip the whole east half of the world to graphite in one frame at t60 — one beat after B2 and
B3 establish it as morning-lit and painted — and would render the standing miniature as the drawing
rather than as the world. **The frontier's look is authored into the flat ramp instead:** each prop's
`uTriFlat` mix passes through a short dab-broken band driven by the shader's existing `triDabN` noise
(`trilayer.ts:294–297`), so the paint visibly *breaks into strokes* as it becomes map — the film's
frontier grammar, one extra line, no second uniform, no direction to get backwards.

**The third merge rule, written down:** *flatten targets merge per prop-group per x-band; everything
else merges per class per island.* G1's per-class merge and G7's per-prop uniforms collide only
because nobody wrote the middle rule. The stagger key is each merged group's origin x.

**The twelve flatten groups** (of the film-wide 40; §6 carries the full census):

| Group | Origin x | Contents |
|---|---|---|
| houses W | ≈135 | 3 gabled houses (132, 135, 138) |
| houses E | ≈156 | 5 gabled houses (144, 150, 156, 162, 168), incl. both ember roofs |
| trees W | ≈134 | mixed woods, x 130–140 |
| trees M | ≈146 | mixed woods, x 141–152 |
| trees E | ≈160 | mixed woods, x 153–170 |
| massif | ≈158 | the mountain + its snow |
| roadA | 130 | `world.ts:4218–4235` |
| roadB | 135 | `world.ts:4218–4235` |
| river | 130 | `world.ts:4237–4265`, pigment band |
| fields W | ≈138 | 3 of the six |
| fields E | ≈158 | 3 of the six |
| NPC token | ≈150 | the village figure that resolves to a token disc |

**Stagger:** offset = `(originX − 128) / 42 × 0.9`, so the nearest group starts at t60.00 and the
farthest at t60.90; each runs 1.1 t of `uTriFlat 0→1` + `scale.y → 0.02` + a rotation settle,
`power2.in` (shipped ease), **all complete by t62.00**. This replaces the shipped flat `stagger: 0.05`
(`timeline.ts:901–902`). Roads, river and fields **join** the lie-down, closing the v1 split at
`world.ts:4215–4313` where they never flattened. Destination art is a **UV slice of the
`bakeBoardMap()` atlas** (G4/G7) — one bake, two consumers, they cannot drift.

## S7-B1 · t57.5–58.3 · THE TENDED RIM · FLAGSHIP 4 · A

1. **ARGUMENT.** *The ruin from the film's first minute has been kept.* The visitor believed the goblin
   works; now they believe he has been working HERE, on the wound they watched happen, since before they
   arrived. **This is the receipt `pitch1` cashes.**
2. **MESSAGE.** None on entry — the visual rhyme does it. `pitch1` begins writing at 58.0, over the
   flagship's tail (see B2).
3. **VISUAL.** The page turn lands on the S1 rim angle — the angle-echo bookend, `cut(57.5, [119.5, 6.3,
   1.8] → [122.6, 6.3, 0])`, elevation inside the bench clamp. **Held 0.8 t, not 0.5:** the shipped
   over-the-shoulder cut **slides from 58.0 to 58.3 — NEW MARK** (a zero-duration `tl.set`; sliding it costs
   nothing and touches no downstream timing). Foreground: the rim lip with the **cairn** — five slab stones,
   cool stone, flat-stacked (`world.ts:4061–4080`) — and the **three mushrooms**, caps in threes, never
   symmetric (`:4082–4092`). Middle: the goblin at his rim stance, back half to us. Far: dawn paper beyond
   the rim. One painted god-ray cone grazes the rim from frame right. **Same camera, same rock, opposite
   evidence: remains gone, cairn raised, mushrooms planted.**
4. **3D.** Cliff island (R, day bake) · tended dressing (**KEPT** — already built, hidden→shown at 57.5) ·
   remains hidden (shipped sets) · god-ray cone ×1 (**N**, `rayGold` painted cone with a drawn edge, dab
   fill, hard stop — **never a soft alpha falloff**). **No eraser ghost in this frame** — see B2.
5. **GOBLIN.** `settle` on the cut (shipped, `timeline.ts:891`). He stands at the rim where the rubbed patch
   is, looking down at the world. **No task — for the first time in the film there is nothing here left to
   do.**
6. **INTERACTION.** Rest anchor at **tended-cairn**; touch soft-rest lands here. The frame's responsiveness
   is the anchor's gentle magnetism.
7. **ANIMATION.** Master: the cut, the settle. World clock: nothing — the rim is still, and **stillness after
   six busy vignettes IS the beat.** Reverses to the page turn cleanly (paired sets).
8. **OUT.** A plain intra-stage camera cut at **t58.3** to the over-the-shoulder (`[117.5, 7.4, 3.2] → [123,
   6.6, 0]`) — shipped grammar, the same class as S1's internal cuts, not a catalog transition. Cost: zero.
9. **KEEPING.** **FLAGSHIP 4 — the tended cairn.** Cairn plus planted mushrooms, in one foreground, read in
   under a second because they are a rhyme and not a mark. **Phone valve (this flagship gets one too, and its
   valve is re-framing, not texture):** at ≤390 px the `portraitLook` tightens so cairn and mushrooms fill the
   lower half and he crops to shoulders — the rhyme survives; the shot does not shrink.

## S7-B2 · t58.3–59.4 · THE STRAIGHTEN + `pitch1` · A

1. **ARGUMENT.** *"I've built worlds for your DM for years" is a conclusion, not a claim.* The visitor has read
   receipts for six stages; the line letters on over the proof-of-proofs frame and they nod.
2. **MESSAGE.** `pitch1` — **"I've built worlds for your DM for years."** — `cap('pitch1', 58, 2.2)`, VERBATIM.
   The Hand's authored stroke SVG, ~15 strokes/s from t58 (beginning under B1's tail), lower-third band, ink,
   ≥4.5:1, un-writes on reverse. It clears before the flatten reaches full frame; **the band stays clear of the
   rising horizon** (inherited guard).
3. **VISUAL.** Over-the-shoulder: him on the rim, the whole miniature world below — houses, mixed woods, fields,
   river, roads, the massif — morning-lit, every island of the film's world implied as one place. His figure holds
   a thirds position; the cliff rim cuts the bottom zone (sheet edge). Dawn key plus two god-ray cones raking the
   miniature.
4. **3D.** Cliff (R) · **miniature world re-surfaced** (R topology: 8 houses `world.ts:4127–4144` with the 2
   ember roofs kept as the eye's landing points, 12 mixed trees `:4146–4169`, massif + snow `:4174–4213`, roads
   ×2 `:4218–4235`, river `:4237–4265`, fields ×6 `:4270–4313`) · god-ray cones ×2 (**N**, shared geometry) ·
   **eraser-ghost #4 of 4 (N): the erased scorch-ring beside the cairn**, `graphiteLight`, with the cairn standing
   on it. **It is sited in this beat, not in B1** — a graphite-value mark on painted dawn rock cannot read in a
   0.5 t cut with no freeze, but it reads here: the camera is closer, the shot holds 1.1 t, and `pitch1`'s write-on
   is giving the eye somewhere to be. Merged per class except the flatten groups.
5. **GOBLIN.** **`straighten`** (t58.2, 1.8 — shipped; it begins under B1's wide, which is better acting: he
   straightens, *then* we cut closer). Folded over his work for the entire film, here, once, he rises all the way
   up. It reads as a moment because nothing before it did. **He does not move his feet.**
6. **INTERACTION.** Rest anchor **between the pitch lines** arms after `pitch1` completes. Nothing else.
7. **ANIMATION.** Master: the straighten (puppet lane), the caption write-on. World clock: ember-roof shimmer at
   the amber ramp's idle amplitude; nothing else. **Reverse:** the straighten reverses into the fold — correct,
   and poignant backwards.
8. **OUT.** No cut — the camera simply starts rising at t58.5, continuous, under the caption's hold. Cost: zero.
9. **KEEPING.** The rubbed patch at his rim stance — where he always stands to look — and the scorch-ring ghost
   beneath the cairn.

## S7-B3 · t59.4–60 · THE RISE · E

1. **ARGUMENT.** *The world is small enough to keep.* For one breath it IS a miniature on a table — the scale flip
   that pre-loads "this is a map."
2. **MESSAGE.** `pitch1`'s tail clears here.
3. **VISUAL.** The rise, `cam(58.5, 3.5, [128, 26, 8] → look [146, 2, 0])` — slow, straight, **axis-locked: no
   roll, no spiral.** As the camera clears the rim, the **depth-to-paper ramp tightens for one breath** —
   `rig.depthNear`/`depthFar` pulled in over ~0.6 t and released, a scrub-safe uniform pair. **There is no DOF
   pass** (§0, amendment 4); the scale flip comes from the ramp plus composition, which is the technique the hero
   proved. The goblin shrinks below on the rim. Depth ramps toward `paper`, never grey; the miniature's far edge
   and the paper void beyond stay in frame at every point of the move.
4. **3D.** As B2. No new assets.
5. **GOBLIN.** He watches. **His stillness at the rim, shrinking, is the acting** — and it is why this beat is
   classified establishing: the camera is leaving him on purpose.
6. **INTERACTION.** None. The rise is scrub-tied; the visitor's own thumb performs the leaving.
7. **ANIMATION.** Master: the rise, the depth ramp in and out (settle lane, ≤1 breath — *the scale flip is a story
   beat, not a lens toy*). World clock: ember roofs, the river's lit dabs. Both the camera tween and the ramp are
   symmetric; reverses cleanly.
8. **OUT.** Continuous into the flatten — no cut; it begins beneath him at t60.
9. **KEEPING.** The miniature world is the ledger's contents page: ruts enter the map-space, fields sit in worked
   rows. Read, not spotlit.

## S7-B4 · t60–62 · THE FLATTEN · E

1. **ARGUMENT.** *This world was a map all along — and the map is the product's own art.* The category reveal:
   buildings→icons, trees→illustration, mountains→ink, roads→hand-drawn, fires→painted flames.
2. **MESSAGE.** None. **The transformation is the sentence**; a caption would compete with the film's biggest image.
3. **VISUAL.** During the rise's second leg (`cam(62, 2.5, [145, 40, 0.01] → [145, 0, 0])`), the world **lies down
   outward from beneath him**, group by group, keyed by distance from the cliff. On the moving line of change: the
   dab break-up authored into the flat ramp — paint breaking into strokes as it becomes map. Behind it: **the map**
   — flat map paint, inked 2 px roads, illustrated canopy blobs, gabled house icons, painted flame marks on the two
   ember roofs, field washes, the river as its drawn-edge band, token discs, and the grid ghost risen to meet it.
   **Elevation crosses 75° only after t62**, when the frame's content is the finished map (§0, amendment 3).
4. **3D.** **The flatten target set (NEW wiring, not new art):** `uTriFlat` + `uTriFlatUv` per merged group,
   destination art a UV slice of the `bakeBoardMap()` atlas, atlas bound rig-side as one shared sampler. **Twelve
   groups; the census is in §6.** The grid ghost's rise is the board group's shipped opacity traversal, pre-staged.
5. **GOBLIN.** None — he stands on the rim as the world lies down around his cliff. **The cliff flattens LAST,** at
   the stagger's tail, into its crag-mark on the map; he rides it down to map height in the final half-beat. **He
   touches nothing: this is the one change he does not make by hand, because it is not a change — it is the file
   being closed.**
6. **INTERACTION.** None — **and this is the most repeat-scrubbed moment on the site.** The answer to the visitor's
   scrubbing IS the beat: backwards, the map stands back up into the world, flawlessly, by construction.
7. **ANIMATION.** Master, all of it: twelve `uTriFlat` ramps + `scale.y → 0.02` + rotation settles, `power2.in`,
   staggered by origin x. World clock: nothing — ambient life on the miniature extinguishes as each group crosses
   (its glow dies with its paint — **[ERRATA 2026-09-03, motion doc D-15 applied: the citation to `rigs.ts:143`
   was wrong. That line scales the glow by `(1 − curtain)`, and `curtain` is 0 throughout the flatten, so it
   never dies there. **S7-B4's glow death rides the group's own `uTriFlat`**, as the third factor of the
   practicals expression: `intensity = base × flicker().glow × max(1 − lightC, alive.value) × (1 − flat.value)`]**). **Reverse recipe is the whole design (G7): nothing is created or
   destroyed; the same tween runs backwards.** The two moves the direction names as must-be-flawless-both-ways are
   the S4 disc and this. **Drive every group from one timeline position — no callbacks, they do not reverse — and
   walk it both directions at flick speed on the QA grid.**
8. **OUT.** Continuous — the camera locks dead top-down at t62 as the last group lies flat. No cut. **Cost of the
   whole beat: zero runtime allocations**; the atlas bake was kicked a stage ahead per G2.
9. **KEEPING.** The map that appears behind the change IS the keeping made legible. Its underdrawing is the battle
   grid.

## S7-B5 · t62–62.5 · THE MAP, COMPLETE · E

1. **ARGUMENT.** *I am looking at a Good Goblin map.* One held breath of pure product surface before the last
   gesture — the DM's eye is given time to recognise the genre: terrain, roads, tokens, grid.
2. **MESSAGE.** None yet (`pitch2` lands at 62.6).
3. **VISUAL.** Dead top-down (legal: the frame is the map). The film's world as its map: the village with its
   token, the fields, the river's paper band, the roads, the massif's ink, **the cliff's crag-mark at frame left
   with a cairn dot beside it**, two painted flame marks. The goblin: a tiny figure ON the map at the cliff mark —
   the one thing still standing, the keeper on his ledger. Sky already tweening `skyDawn → skyBoard`
   (`timeline.ts:909`, from 62.5) — the film ending by becoming its own medium.
4. **3D.** The flattened set at rest. No new assets.
5. **GOBLIN.** He reaches into the satchel and **pulls the d20** — `die2` scales in at his hand (t62.5,
   `timeline.ts:910`).
6. **INTERACTION.** The **between-pitches** rest anchor sits here. Nothing else.
7. **ANIMATION.** Master: the sky tween, `die2` scale-in. World clock: nothing; the map is still.
8. **OUT.** Continuous into the throw.
9. **KEEPING.** **The map's marks are the film's events:** the flame marks are fires HE lit, the token is the NPC HE
   placed, the crag-mark carries the cairn dot. **The visitor can audit their own two minutes on it.**

## S7-B6 · t62.5–63.5 · THE THROW + `pitch2` · E (registered)

1. **ARGUMENT.** *"Now I work for every table" — the handover is to ME.* The film's object of luck becomes the
   visitor's.
2. **MESSAGE.** `pitch2` — **"Now I work for every table."** — `cap('pitch2', 62.6, 1.0)`, VERBATIM. Lower-third
   band, ink; enters on the spin, leaves before the face fills the frame, clear well before the board fades at 64.5.
3. **VISUAL.** Top-down settling; far below, the tiny figure spins the die and throws it up AT us. The die arcs into
   the camera (`timeline.ts:911–914`: x → 145, y up `power1.out` then `power2.in` toward the lens, tumble
   `power2.out`). `dieBone` gouache, painted numerals, worn edges, one authored glint — the jewel treatment. **His
   release gesture is authored large** — a full arm arc, silhouetted against the flat map ground — so it reads at
   establishing scale.
4. **3D.** `die2` (R — the hero d20 treatment on `dieGeometry.ts`). Visible window shipped: `onlyFor(die2, 62)`.
   **Per-mesh material #13 of the S7 block.**
5. **GOBLIN.** Pull (B5) · spin — a flick of the wrist, the die spinning on his palm for two beats · the throw: **the
   film's last `haul`-class full-body gesture**, release up and toward camera. He stays on the map, shrinking under
   the die's rise. **This is his exit from the film: he does not walk off; the camera takes what he threw.**
6. **INTERACTION.** None. Reverse: the die falls back into his hand and un-spins — segmented position tweens reverse
   cleanly, the same grammar as the S1 leap.
7. **ANIMATION.** Master: the throw arc, the tumble, the caption. **Real inertia is authored INTO the tween** —
   rotation decelerating `power2.out` — no physics. World clock: nothing.
8. **OUT.** Continuous into B7, the same arc.
9. **KEEPING.** The die's own worn edges — the most-handled object the goblin owns.

## S7-B7 · t63.5–64.5 · THE 20 FILLS THE FRAME · E

1. **ARGUMENT.** *Natural 20 — the story's luck is real and it is aimed at me.* The last frame of film-as-film.
2. **MESSAGE.** None (`nat20` was cut — the face reads itself).
3. **VISUAL.** The die grows until one face fills the frame: **the painted 20**, numeral readable at 390 px, QA'd
   exactly there. The sky lands on `skyBoard` = `paper` as the face takes over — **the film delivers itself onto the
   page it was drawn on.** Edge to edge by t64.5.
4. **3D.** `die2` only. **Everything else leaves frame by growth, not by despawn** — reverse safety.
5. **GOBLIN.** Off frame. His work is airborne.
6. **INTERACTION.** None.
7. **ANIMATION.** Master: the arc's last leg (`power2.in` into the lens), the tumble settling so the 20 arrives
   oriented square — **the settle is authored, not lucky.** World clock: nothing. Reverses cleanly.
8. **OUT.** **The morph** (catalog #7, S7→S8 only): the d20 face → the board, edge to edge, **NO CUT** — the promise
   of the whole film kept. The one irreversible-*feeling* move that still scrubs backward. Cost: the board group's
   material fade-up (already resident, `onlyFor(board, 62)`), zero allocation.
9. **KEEPING.** **None in frame, deliberately.** One breath with no marks at all, so the board's arrival reads fresh.

---

# STAGE 8 — THE TABLE · t64.5–66, then at rest · C7 · the Board

Three beats. **Unlit** — `skyBoard` = `paper`; the board is lit by the page, and the film ends in the light it was
drawn in. Camera locked top-down. **The film's interactivity inverts:** the endcard is the only pointer-enabled
surface, and the board itself does not pan or zoom — this is an ending, not a demo, and a demo here would bury the
CTA under play. Nothing renders below the endcard. Skip note hidden (you have arrived); play swaps to **replay**.

## S8-B1 · t64.5–65.0 · THE MORPH · E

1. **ARGUMENT.** *The map I watched being kept is a real product surface, and I am on it.* No cut happened; the
   visitor's trust in the film transfers to the product intact.
2. **MESSAGE.** None yet. The meaning carrier is continuity itself — grid, terrain, roads arriving where the 20's
   face was.
3. **VISUAL.** The board fades up under the die (t64.5–65.1): the authored `bakeBoardMap()` art at
   `BOARD_WASH`-governed layering — **the paper wash stops at 0.5 so the flattened world beneath reads as the
   board's printed content** (`timeline.ts:916–938`, kept); grid, double rule and trim marks land at full ink. The
   die settles (one 0.15 bounce) and **exits at t64.85–65** — its silhouette must not sit under the wordmark, whose
   lockup carries its own d20.
4. **3D.** **The board map (N — `bakeBoardMap()`, one deterministic 2048² canvas bake in
   `src/film/stages/board.ts`; the film's only texture above 1024², and the single most product-critical asset on
   the site).** Replaces the `GridHelper` + `boardFill` placeholder (`world.ts:4337–4385`); the group's
   material-locality and opacity-fade contract holds for the new asset — every material board-local, transparent,
   opacity 0 at build, collected by the shipped traversal. `die2` (R).
5. **GOBLIN.** None. **He is not on the board — the keeper hands over and steps out; his absence is the handover.**
6. **INTERACTION.** None yet.
7. **ANIMATION.** Master: board material fade (0.6), wash fade to 0.5, die settle and exit. World clock: nothing yet.
   Reverses: the fades reverse, the die re-enters and un-settles cleanly.
8. **OUT.** None — the endcard letters onto this same frame.
9. **KEEPING.** **Edge-handling wear at the board's margins** (baked): this map has been played on. **No pentimenti
   on the board** — contrast and product truth outrank the theme at the conversion surface. The one quiet trace.

## S8-B2 · t65.0–65.72 · THE ENDCARD LETTERS ON · E

1. **ARGUMENT.** *This thing has a name, a one-line identity, and exactly one thing to do next.* Comprehension in one
   breath: the tagline names the category, the subline names the two jobs plus the promise, the button names the action.
2. **MESSAGE.** The endcard block, **VERBATIM**, direction C — lettered on the board, no box, no card, no wash, no
   border, per-glyph paper halos. Full spec in §5.
3. **VISUAL.** Locked top-down on the board; the type stack floats directly on the map, the halos doing the knockout.
   Three-tier rhythm: wordmark↔tagline the largest gap; tagline↔subline tight (one thought); subline↔CTA large again
   (the action stands apart). Stack centred ~46–47% vh, `min(92vw, 720px)`, 88vw under 500 px.
4. **3D.** Board (as B1). The endcard is DOM.
5. **GOBLIN.** None. The wordmark's goblin-ears glyph is his proxy now.
6. **INTERACTION.** During the write-on, scroll is still the only input and it scrubs the lettering.
7. **ANIMATION.** The four shipped entrance tweens (`timeline.ts:948–1040`), all `power2.out`: wordmark opacity 65.0
   (0.3) → tagline `clip-path` write-on 65.23 (0.26) → subline at 60% into the tagline's, 65.386 (0.24) → CTA fades
   and scales as one object 65.516 (0.18), label inks in +0.1. **The last thing to arrive is the thing you are asked to
   do.** Settles ~65.72; the endcap hold pins t66. **Scrolling back un-writes it all.** Reduced motion: wipes become
   opacity fades at the same times, CTA scale drops out (both shipped). Boil UI-side only, ≤0.8 px, at rest only.
8. **OUT.** None. The film has no out — it ends on the product surface with one action available.
9. **KEEPING.** Carried by the board's edge wear.

## S8-B3 · t65.72–66 → rest · AT REST · E

1. **ARGUMENT.** *I can act, and acting is safe and obvious.* The frame must feel like arriving, not like being sold.
2. **MESSAGE.** As B2, now static, plus the margin furniture: **replay** (bottom-left, Inscription) and the © line
   **"© 2026 Good Goblin"** (Quiet Serif, 4% ink, the only footer). **The endcard "meta line" retires** — direction C
   is "no box, nothing extra", and it has no source copy.
3. **VISUAL.** The finished frame: board + endcard. **The board breathes at whisper scale — ≤0.5% zoom drift, 12 s
   period, world clock** — alive but still. Reduced motion: static.
4. **3D.** No changes. The send-off die (R, the hero die treatment) stands by in the wordmark's neighbourhood for the
   click beat.
5. **GOBLIN.** None.
6. **INTERACTION — the inversion, complete inventory:** the **CTA** (§5) · **wordmark hover:** the ears perk once per
   session, 300 ms up, 500 ms settle, then never again · **replay:** eases Home over 1.6 s (reduced motion jumps), and
   the Cover is skipped on replay, straight to t0's dim · **keyboard:** tab order SR skip link → play/replay → CTA,
   `Home`/`End` still live, focus rings the drawn double-line rectangle, never suppressed · play mode ending here moves
   focus politely to the CTA with `preventScroll`.
7. **ANIMATION.** World clock: the board breath, the CTA offset-border boil ≤0.8 px. Master: parked at the endcap hold.
   Everything else still.
8. **OUT.** None. Scroll ends here, cleanly.
9. **KEEPING.** The board's edge wear remains the frame's one trace.


---

## 4. THE TRANSITION GRAMMAR — the complete catalog, with recipes and reverses

**Seven transitions exist. No eighth is invented.** House ease `power2.out`; 150–400 ms for
interface, 0.6–1.2 s for world reveals; only the flatten and the rise run longer, and both are
scrub-tied. Every recipe below is pure tweens and paired `tl.set`s — **no callbacks anywhere, because
callbacks do not reverse.**

### 1 · House lights — Cover → S1 only, spent once

**Recipe.** The first scroll, `play`, or `Space` dims the page to black over 0.6 s; the paper margin
stays visible at 4% ink so the sheet never fully disappears. **The visitor caused it.**
**Reverse.** The dim runs backwards to paper. **Reduced motion:** a stepped fade.
**Cost.** One DOM opacity tween.

### 2 · The tick — every freeze · t12.5, t33.1, t40.6

**Recipe, verbatim, three lines on one cue:** `world.timeScale → 0` in **≤0.15 t, no ease** ·
`curtain → 1` in 0.35 t `power2.out` · margin breathes to full over `T_BEAT`. **Instant, never eased,
never announced.** Nothing else may key off it.
**Reverse.** The same three, mirrored: the clock ramps back, the curtain drops, the margin un-breathes.
**Reduced motion.** Already a cut; unchanged, and it is the house style.
**Cost.** Zero — no assets created or destroyed, no bakes.

### 3 · The exhale — every unfreeze · t30.0, t34.3, t47.0

**Recipe.** `world.timeScale → 1` over `T_EXHALE` (0.3 t) + the colour flood on the same cue + margin
un-breathes. **The world resumes MID-gesture; the freeze never restarted anyone.** What the colour
flood *is* differs by site and is named per beat: at **t30** it is the frontier release (`seamX` 13.0 →
34.0, `power2.out`, then retired to `1e6` at 30.34); at **t34.3** and **t47.0** it is `curtain → 0`
plus `snapBack` (`SETTLE.snap`, the punchline reserve). **Every exhale has a visible payload, named:**
t30 the last graphite leaving the ribbon and the ribbon's ambient starting mid-gesture; t34.3 the
machinery going dark again as the paint returns; t47 the cheer completing, the spill-drop landing and
the mug rings closing under paint.
**Reverse.** Mirrored tweens. **One-shots may never ride the world clock** — the spill-drop's fall is a
0.2 t timeline tween precisely so it re-hangs on scrub-back.
**Reduced motion.** An instant cut to the resumed state.

### 4 · The touch reveal — Prep, on his contact · **8 touched props · 10 reveal shells · 10 `alive` steps**

**[ERRATA 2026-09-03 — "9 uses" matched nothing. The enumerated list below is eight props;
the candles carry three marks each with its own shell and its own material, so the film
has ten shells and ten steps. (The motion doc's §15.2 step 8 already walks "each of the
ten reveal shells" while its §11.4 says "nine" — corrected in both docs.) The **rope**
(S4-B4) and the **road mark** (S6-B1) are `alive`-stepped but are NOT touch reveals: both
happen at `curtain = 0` in Performance, where there is no Prep to reveal from. The rope's
step exists to keep it painted *through* the S4 flicker; the road's paint arrives on the
`touchUp` bristle line.]**

**Recipe, and this is the only legal construction:** on `actionAt`, **(a)** a paired `tl.set` flips the
prop's per-material `alive` uniform 0 → 1 — **a step, never a ramp**, because colour law 2 bans
half-tinted objects — and **(b)** `reveal()` grows the prop's **mask shell** (a mask-only copy of the
prop's own solids, `curtain.ts:110–140`) from scale 0 over 0.35 s (`SETTLE.arrive`), or 0.6–0.9 s for
the lantern, the candles and the die. **The shell is the only thing the audience sees**; the flip is
what makes the pixels under it colour. **The shell takes the prop's own shape and can never reach a
neighbour** — the radial version was deleted for being the airbrushed colour disc the colour script
bans by name (`curtain.ts:98–103`), and it is not coming back.
**The eight, by mark:** fire2 (18.35) · lamppost (20.207) · cave+door (22.064) · chest (23.921) ·
mushrooms (27.635) · signpost (29.492) · the die (43.75) · candles ×3 (56.4, 56.6, 56.8) — **ten marks,
ten shells.** Six of the eight are shipped `reveal()` call sites (`timeline.ts:491–521`); the die and the
candles are new. The two shipped reveals at **29.1** (`tufts`, `treeline`) retire — the t30 exhale takes
them, which saves two per-mesh materials and two tweens.
**Banked life.** Each revealed prop's idle begins as the shell completes and rides `gobT`, with its
amplitude gated on the shell's scale so it dies smoothly on reverse. **Nothing boolean-flips on
"revealed"** (P3-T3).
**Reverse.** The shell shrinks to the contact point, the idle fades with it, the set un-sets.
**Reduced motion.** A step to the revealed state — **`A = 0` is *still at the lit pose*,** never a
slowed bloom.

### 5 · The page turn — one frame of paper, never black · 9 uses

**Recipe.** A camera `cut()` under a single frame of paper, plus paired goblin relocate `tl.set`s — the
cluster at its mark `c`, its inverse at **`c − PAIR_GAP` (0.025 t)** — so reverse replays them in reverse
order. Both sets stay resident; nothing is created or destroyed. **[ERRATA 2026-09-03, motion doc D-13
applied — this read "at identical positions", which is the shipped bug class `timeline.ts:144–146`
records and `clocks.check.ts:66–74` fails on, and it contradicted this book's own "≥0.02 t apart" in
four other places. Author the gap as `c − PAIR_GAP`, never as two decimal literals.]**
**The nine:** S1 t7.5 · S1 t9.5 · S5→S6 t50 · S6 t51.25, 52.5, 53.75, 55, 56.25 · S6→S7 t57.5.
**Reverse.** Replays gracefully — paper, never black. **A drifted `tl.set` pair is an invisible bug
until someone scrubs backwards through the montage: assert the pairing in `motion.check`.**
**Reduced motion.** A plain cut with no flash frame.

### 6 · The walk-through — S4 → S5, its only use

**Recipe.** The camera follows him behind the mountain flat; its braced graphite back wipes frame as a
near-black silhouette plane; **darkness t ≈ 37.2–37.9**, held at `caveDark` lifted one value step
(≈`#4E4133`), **never true black**, with the margin breathing in `paper` at 55% (≥3.5:1). An exposure
crossfade t ≈ 37.8–38.1 opens on the tavern establish. **The set swap happens entirely inside the
crossfade**, via the shipped `onlyFor` triads.
**Reverse.** The crossfade mirrors and the triads un-set themselves. **Three named QA cases:** a parked
scrub mid-darkness must be a composed frame; the set swap must hide completely in **both** directions;
and the S5 establish must be fully composed on the emergence frame (the stale-frame trap).
**Reduced motion.** Two stills separated by one dark held frame — no travelling darkness.

### 7 · The morph — S7 → S8, its only use

**Recipe.** The d20's 20-face fills frame edge to edge by t64.5; the board group's materials fade up
beneath it (already resident, `onlyFor(board, 62)`) with `BOARD_WASH` settling at 0.5; the die settles
with one 0.15 bounce and exits 64.85–65. **No cut — the promise of the whole film kept.**
**Reverse.** The fades reverse and the die re-enters: the one irreversible-*feeling* move that still
scrubs backward. **Zero allocation.**
**Reduced motion.** A crossfade at the same times.

### Not transitions — named here so nobody re-classifies them

- **The gear change.** Stage boundaries at 10.2, 16.5, 26.5, 36 (into the walk-through) and 64.5 are
  gearing events, not cuts. Within a stage the scroll↔t map is linear; the boundaries are where it changes.
- **The void hop** (t16.5–17.0). A match-on-motion reposition inside an anchorless window. It spends no
  catalog transition because nothing cuts: one constant-offset tween moves goblin, camera and look
  together while only paper, the line, him and his shadow are in frame.
- **Intra-stage camera cuts.** S1's internal setups and S7's `cut(58.3, …)` are shipped grammar of the
  same class as a shot change inside a scene. They cost zero and are not catalog entries.
- **Sky tweens.** `sky()` and `skyCut()` are grades, not transitions.
- **The frontier.** S3's `seamX` move is a world event inside one beat, not a transition between beats.

---

## 5. THE CONVERSION SPEC

### 5.1 The board — why it is the film's own world

`bakeBoardMap()` (G4: hand-authored in this repo, in code, **one deterministic 2048² canvas bake** in
`src/film/stages/board.ts`) paints **the map of the world the visitor just walked**, in the product's own
vocabulary — because the film's last frame is the product's first frame, and because **the flatten's
destination art is UV slices of this same atlas**, so the two can never drift. It is not an export from
the product: there is no wired path, there is no forge, and no product export contains the film's world.

Content, oriented to the S7 top-down:

- **The battle grid** at `GRID_INK` — the board's underdrawing IS the grid (a map is already both drawing
  and paint, which is the third truth).
- **The village** (the S6 gabled-house icons) with **one NPC token disc** at one-cell diameter on the
  square where he planted the miniature — a `cloakIndigo` ring on `dieBone`.
- **Three party token discs** at the road-head nearest the cliff mark — `cloakIndigo` ×2, `cloakCrimson`
  ×1: the S1 trio, arrived, mid-session. **One monster token** near a cave-mouth mark (`monsterHide`
  ring): the S6 encounter, placed. **Tokens are what a DM recognises in half a second: this map is being
  played.**
- **Inked roads at 2 px** (roadA/roadB's meanders) · **the river as bare paper with a drawn edge** plus
  its pigment band · **six field washes** · **illustrated canopy blobs** at the tree stands · **the massif
  in ink** with reserved-paper snow · **two painted flame marks** on the ember-roof houses · **the cliff
  as a crag-mark with a cairn dot** — the flagship's location, findable by anyone who scrubs back.
- **Edge-handling wear** at the margins: drybrush lightening, one rubbed corner. **No pentimenti. No
  goblin-green anywhere. No `#B6D648` anywhere on the board.**
- Double rule + corner trim marks kept from v1's trim grammar (`world.ts:4357–4384`), now painted into
  the bake.

At rest the board **does not pan, does not zoom, and accepts no pointer events.** It breathes ≤0.5%.

### 5.2 The endcard — copy-spec direction C, verbatim

```
   [ Wordmark — GOOD / GOBL·IN, d20 interpunct ]

           The Dungeon Master's backstage.

     Build the maps. Run the table. The goblin
                does the rest.

               [ JOIN THE DISCORD ]
```

**No ground:** no paper rectangle behind the type, no rotation on the stack, no drawn border, no
drop-shadow smudge. **Knockout instead of a box:** the tagline and subline each carry a per-glyph paper
halo — a `.halo` class stacking eight `text-shadow` layers in `--paper`, four at 6 px blur and four at
12 px. **The grid must not read through any letterform, and no rectangle does the work.**

| Element | Voice | Implementation | Spec |
|---|---|---|---|
| Wordmark | art | drawn lockup + `#B6D648` d20 pip — **its only appearance on the site** | `min(44vw, 450px)` desktop, `76vw` phone; own paper halo; `aria-label="Good Goblin"` |
| Tagline | **The Hand** | authored stroke SVG, `aria-hidden`, verbatim in the SR document | ink `#222222`, `clamp(1.2rem, 2.1vw, 1.55rem)`, margin-top 1.4rem desktop / 1.1rem phone |
| Subline | **The Quiet Serif** (Vollkorn) | **live DOM text** — selectable, indexable | muted `#444`, `clamp(0.88rem, 1.4vw, 1rem)`, margin-top 0.45rem; one line desktop, two balanced lines on phone |
| CTA label | **The Inscription** (Cinzel 700, letterspaced caps) | **live DOM text inside a real `<a href>`** | `JOIN THE DISCORD`, ≥44 px hit area, margin-top 1.6rem |
| © line | The Quiet Serif | live DOM | `© 2026 Good Goblin`, 4% ink, the only footer |

The direction's §4 voice table governs the faces and **supersedes copy-spec's Metamorphous assignment**
for the tagline and subline; every word, every line break and every size clamp in copy-spec stands
unchanged. **Rhythm:** wordmark↔tagline largest, tagline↔subline tight (one thought), subline↔CTA large
again (the action stands apart). **Entrance choreography** is the shipped sequence in §3-S8-B2.

### 5.3 The CTA — the film's one taught rule, performed by the visitor

Eleven scenes taught *what the goblin touches comes alive.* **The button is drawn; the visitor's pointer
is the touch.** This is the only pointer-reactive object on the site.

| State | Spec |
|---|---|
| **Rest (drawn)** | Graphite outline, opaque paper fill, 2 px ink border, label in Cinzel 700 letterspaced caps. **A second border offset 2–3 px, rotated 0.4°, at lower opacity**, boiling ≤0.8 px — a drawn-world object with a hand-redrawn line. Self-evidently a button even at rest; ≥44 px; never wallflowered. |
| **Hover / focus-visible (touch-lit)** | **Amber `#F2C35E` blooms through the letterforms from the pointer-entry side over `T_BLOOM_CTA` (180 ms)**; the **contact shadow arrives beneath alongside the colour** — the film's rule: shadows arrive with paint. The offset border re-inks from 0.4° to 0.9°; the fill inverts to ink with paper text. **Focus-visible gets the identical bloom** — keyboard visitors get the grammar too — **plus** the drawn double-line focus rectangle. Never the browser default; never suppressed. |
| **Active (press)** | Fill deepens to ink, label to paper, a 2 px settle. The one physical press on the site. |
| **Click** | Opens `DISCORD_URL` in a new tab, `rel="noopener"`. **The send-off:** the die beside the wordmark rolls once to 20. Focus and site state intact on tab-return. |
| **Unset URL** | **The button does not render; the subline stands alone.** A dead `#` never ships. `DISCORD_URL` is the single wired constant in `App.tsx` (owner: Nayan); the site is not deploy-ready until it exists. |

**Secondary paths.** The **skip note** (margin, from t16.5) is the respect valve — DMs are busy, jurors
scrub, and both reach the offer without penalty. **Replay** is the advocacy valve — the person who scrubs
the die beat five times is the person who posts it. Both are margin-quiet and neither competes.

**Measurement.** None shipped: no analytics scripts, no cookies, one `localStorage` convenience flag
(`gg.seen`, try/catch-guarded). Instrumentation is a separate decision.

### 5.4 The conversion argument the frame makes

Read top to bottom the frame is a complete syllogism: **the wordmark** names who kept the world (the
character you now like) · **the board** proves what the keeping produces (a real playable map of a story
you just verified, tokens mid-session) · **the tagline** names the category in four words · **the
subline** names the two product halves and the promise · and **one warm button** is the only touchable
thing on the page, lit by the same amber every fire in the film was lit with. No feature list, no second
CTA, no footer, nothing below. **A DM who arrives cold at t64.5 through the skip note gets the identical
frame and still understands: map builder + live table, one goblin, one door.**


---

## 6. THE COMPLETE ASSET BILL

**This table is what the build works from.** `R` = geometry survives, surface rebuilt per the
direction's §7 recipes. `N` = authored fresh. `K` = already built and already the shot. Techniques
cite the direction's four: **A** canvas-baked gouache albedo · **B** baked authored stroke tiles ·
**C** the 4-tier tone quantizer · **D** anisotropic dab noise at frontiers.

### Grammar kit

| Asset | Kit group | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|---|
| Island card + page drop shadow | grammar 1 | all | `islandKit.ts`, shipped | R | extend only; **12 island cards** instantiate it — camp · cliff · path ribbon · theatre · tavern · six S6 worksheet islets · the miniature world (ERRATA 2026-09-03: was "9 islands", which matched neither register's enumeration) |
| Trilayer + stroke-tile bake | grammar 2 | all | A+B+C+D, shipped | R | **one line added:** `triDabN` applied to the `uTriFlat` mix (S7's frontier look) |
| The two rigs | grammar 3 | all | shipped | R | **+3 chapter-family key presets, +a 3-slot practicals array with per-source flicker phase, +key-target tracking.** ~15 lines |
| The seam basis (`seamDir`) | grammar 4 | — | — | **DECLINED** | not built; §0 amendment 2. The direction's §7 and §9 now carry the same ruling (ERRATA 2026-09-03) |
| Grid ghost | grammar 5 | S2, S3, S4, S5, S6, S7, S8 | ≤`GRID_INK`, per island, a few cells onto paper | R | promote the hero effect to a site constant |
| The travel line | grammar 6 | S2, S3, S4 | `polyline()`/`curveLine()` + `LineSegments2` `instanceCount` ramp | N wiring, R mechanism | shipped `heroLife.ts` mechanism, new call site |
| Margin furniture | grammar 7 | all | DOM | R | + skip note, + 66-tick ruler ink-in |
| Particle language | grammar 8 | S1, S2, S3, S4, S5 | painted flats + the graphite dust scribble | R | shed first on low tier |

### Hero tier

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| The goblin | all | per `docs/2026-09-03-goblin-design.md` — **not designed here** | R (surface rebuild) | the film's largest single polish job. **[ERRATA 2026-09-03 — this book mandates four new verbs (`hop`, `hang`, `plantAndPat`, `touchUp`) and they are what remain to author. The goblin doc's own five — `freeze` `stow`/`draw` `scribe` `pocket` `throwDie` — have SHIPPED (`actions.ts:631/669/694/722/752/772`), along with `REST`, `WORKING_SIDE`, `applyPose`, `EAR_Z_R`/`EAR_Z_L` and the deletion of his hatch fields. **Nine new verbs total, four outstanding.**]** |
| The d20 (`die`, `die2`, send-off die) | S5, S7, S8 | metal/bone: `dieBone` gouache, painted numerals **QA'd at 390 px**, worn edges, **one authored glint**, real inertia authored into the tween | R geometry (`dieGeometry.ts`) | the treatment is the work; 3 call sites, one recipe |
| The lamppost | S3 | restaged: flame never occluded by its own post; bracket resolves against paper | R | staging, not rebuild |
| The hand lantern | S3 (carried) | light kit surface | R | — |
| The carpenter's pencil | S6-B1 (fence-post scale); the Cover | timber + metal | R | one rescale. **[ERRATA 2026-09-03 — not "endcard": §5.2 spec's the endcard as *"no box, nothing extra"*. Corrected in the direction §9 too.]** |
| **The brush + pigment pot** | S6-B1 | timber + metal, jewel polish at close-up scale | **N** | **hero-tier NEW, priced with the pencil.** One on-camera use; carries the trilayer's origin story as two props |

### Set tier — islands

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| Camp island | S1 | islandKit at set scale: three-band lathe skirt, roots, drawn rim with an authored gap, grid ghost | **N** | A+B+C |
| **Cliff island** | S1, S2, S7 | **one asset, two eras of dressing.** Rock class: 3 quantized tiers riding `roughen()`, strata as contour steps, section bands at every cut, drybrush on climbable edges only. **Baked once for the day family**; night takes it at `KEY_I_NIGHT`, same +18° azimuth | **N** | the azimuth discipline is what makes one bake serve two stages |
| **Path ribbon island** | S3, S4-B1/B2 | **the big build.** The hero island is a slice of it, so its albedo/bark/foliage bakes extend 1:1. Ribbon path, verge, 40+ merged flora, cut edges both sides | **N** | **sets the ≤120-draw ceiling; `draws.check.ts` gates it at the B3 and B7 cameras** |
| Theatre island card + backstage apron | S4 | islandKit at set scale; **the apron bed carries flagship 2's arcs** | **N** | — |
| Tavern island card | S5 | islandKit under the existing shell; cutaway open side +z by construction | **N** | sized against `MAX_PULLBACK 2.2` |
| Six vignette islets | S6 | islandKit at worksheet scale: ~5×5 square cards, sectioned three-band edge, drawn rim with a stop-gap, grid ghost, page drop shadow | **N** | one recipe, six instances; replaces `world.ts:3398–3416` |
| The miniature world | S7 | v1 `miniWorld` topology kept and re-surfaced — **a real miniature, not a desk** | R | 12 flatten groups (§3-S7) |

### Set pieces

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| **Theatre machinery** (capstan + spokes, 6 radial rails, **2 outboard counterweight booms** + weights, 4 blocks) | S4 | **graphite-only — the film's one asset with no paint side.** Stroke primitives + quantized tone. Boom rotation slaved to `stageDisc.rotation` | **N** | booms sweep at radius ≈8.2, outboard of the kerb — that is what makes flagship 2 a shot |
| **Scribed-arc mark set** (3–4 arcs + one overshoot) | S4-B5 | `pencil.ts` `polyline()`/`curveLine()`, `graphite`/`graphiteDark`, **on the apron bed outboard of the kerb** | **N** (flagship 2) | prototype at 390 px before polishing the machinery |
| The rope | S4 | catenary + 6 strand wraps + knot + 3 frayed strands + 3-loop coil; fibre-streak directional bake | R | markAlive'd at contact |
| Snowy mountain flat | S4 | **reserved-paper snow** — the page showing through, blue-grey shadow strokes, a drawn windward edge; graphite brace + slot on the back | R, reshaped | disc-half → backstage flat in a slot |
| Tavern hearth + firebox + coals | S5 | painted dark + coals (retires `3059`); `buildFlames` tongues on the world clock; Prep = still graphite teardrop | R | — |
| **Tavern window view set** | S5 | muntin frame kept, **no glass material**; behind it **2 flat baked graphite cards on `MeshBasicMaterial`, outside the trilayer** | **N** | retires `3018`; **closes the "stays drawn" gap with zero new uniforms** |

### Flora kit — built once, merged per class per island

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| pine ×3 sizes · oak ×2 · sapling · stump + rings · snag · fern · grass tuft · sprig · **mushroom (caps in threes)** · moss patch | S1, S3, S4, S6, S7 | `bakeFoliage` clump-mass tiles on lobed-crown / tiered-cone geometry; `poster: 12` on crowns; **silhouette radii from `silR()`, never authored free**; `stroke.sheet: true`. **No wear — trees are tended, not handled** | R | 10 items; **stump rings are painted concentric value steps, never hatch**; mushroom gills are one committed shadow mass |

### Rock kit

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| boulder ×3 · outcrop cluster · cliff strata stack · scree · pebbles · **cairn stones** | S1, S2, S3, S4, S6, S7 | rock recipe: 3 quantized tiers, contour steps, section bands, climb-edge drybrush | R (cairn **K**) | merged per island |

### Carpentry kit

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| Signpost (**older nail holes in graphite**) | S4-B2 | timber recipe; **scribble-row sign face** (retires `2147`/`2189`) | R | — |
| Cave door + timber frame | S3-B4 | timber; `caveDark` paint + contour (retires `1941`); corner-lightening only. **The v1 previous-swing arc is deleted** | R | — |
| Chest + judged coins | S3-B5 | timber + metal; `boxMarks` Prep construction; corner-lightening; **interior = painted dark pooling** (retires `218`) | R | the S6 chest instance is **deleted with the cut vignette**, and `3809` dies with it |
| Bench ×3 | S5 | timber; rubbed-paint landing patch on the hop bench | R | — |
| Table (tavern + montage) | S5, S6 | timber; **the tavern table's wear bake carries forearm drybrush + one repair patch one value step off** (retires `3131`) | R + **N** bake | — |
| Plank surface / stage disc + kerb | S4 | floorboard-family directional bake, ruled silhouette kept, paint supplies tone; kerb-throat drybrush (retires `2628`/`2670`/`2689`/`2759`) | R | 16 radial plank lines kept |
| Gabled house (montage + miniature) | S6, S7 | timber; icons at the flatten | R | 3 + 8 instances, merged |
| Tavern sign + chains + wall fragment | S6-B3 | timber + `iron`; scribble-row border, painted tankard device; **shutter = painted `caveDark` behind slats** (retires `3687`) | R | — |
| Shelf + 5 bottles | S5 | timber + glass-as-gouache; rubbed at grab height | R | — |
| **DM screen** | S5 | paper props: **a dedicated 256² map-vocabulary bake, NOT a `bakeBoardMap()` slice**; **one per-mesh trilayer material with `alive = 1` set at build** (retires `3277`) | R + **N** bake | keeps G2's bake schedule intact |
| Long table + book | S6-B6 | timber + paper props; the book's scribble rows one direction (retires `3864`) | R | — |

### Light kit

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| campfire (ring + logs + tongue flames + glow) | S1, S3 | fire class: lathe tongues + `buildGlowSprite` + painted cones; Prep = still graphite teardrop | R | ×2 instances |
| hearth fire · candle · **candle set ×3** | S5, S6 | as above; **`buildRayBurst` (`3869`) retires — rays were v1's word for light** | R | — |
| lantern glass tiers · glow sprite · ember particles | S1, S3 | `amber` / `amberLantern` / `amberEmber` ramp | R | — |
| **Painted god-ray cones** | S7 | `rayGold` painted cones with **drawn edge lines, dab-textured fill, hard stop — never a soft alpha falloff** | **N** | 2–3 instances, shared geometry |

### Cast tier — silhouette-first, never out-chroma the goblin, **always graphite under any freeze (G6)**

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| Adventurer trio (`cloakIndigo` ×2, `cloakCrimson`) | S1, S8 (as tokens) | cloth: sculpted fold masses, one direction per panel, `poster: 3`, committed shadow mass, **no interior hatch** | R | — |
| DM + 2 players | S5 | as above; one authored DM throw beat | R | — |
| Tavern patrons ×3 | S5 | as above, mid-laugh poses | R | — |
| Ravens ×3 | S3-B6 | `ravenSlate`; **never touched, never painted, no per-mesh material** | R | — |
| **The monster** | S6-B2 | geometry kept verbatim; `monsterHide` gouache in 3 quantized tiers; **the tick-stroke shag at `3532–3563` kept as authored not-hatch language** | R geometry, **N surface** | tiers ride `roughen()` displacement, **never parallel bands** |
| **The NPC based miniature** | S6-B5, S7, S8 | cast tier, hero-adjacent polish at its scale: painted figure, `cloakIndigo`, on a visible `dieBone` base one cell across | **N** | the register's one new cast prop; **the token rhyme costs one prop** |

### Keeping props — the concept's own shelf

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| Cairn + planted mushrooms | S7-B1 | rock + flora; already built and already the shot | **K** | flagship 4 |
| Mugs ×3 (and their rings) | S5 | **the rings live in the underdrawing layer** — `pencil.ts` ellipse strokes in the graphite ramp; one mug restaged onto the near edge beside its ring | R + **N** marks | flagship 3 |
| Bedroll / pack / spear camp kit | S1 | cloth + timber | R | — |
| Arrows + dropped shield + bolt (S1 remains) | S1, S7 (cleared) | metal: matte + one glint | R | the same set S7 clears |
| Spill-drop, frozen in air | S5 | 2 painted droplet flats + a tabletop splash decal; **fall is a timeline tween, never world-clocked** | **N** | — |
| Character sheets ×3 | S5 | paper props: `dieBone` + scribble rows one direction (retires `3249`) | R | — |
| Map sheet + quill + inkpot + 2 weight stones | S6-B1 | paper props + metal + rock | R | — |
| **Eraser-ghost decals — exactly four** | S2-B3, S4-B5, S5-B4, S7-B2 | `graphiteLight` marks: **a prior position of a thing still in frame.** boulder ellipse · tree ellipse · tavern-door swing arc · erased scorch-ring | **N** ×4 | one per flagship's supporting cast; **no fifth** |

### Flagship + evidence assets

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| Cliff underdrawing mark set | S2 | `pencil.ts`: construction ellipses, measure ticks, authored contours in `graphiteDark` | **N** | marks, never type |
| **Erased-contour pair** | S2-B3 | committed `graphiteDark` line + rubbed `graphiteLight` ghost with legible smear direction | **N** (flagship 1) | **prototype at 390 px first** |
| Dust scribble sprite | S2 | **the film's only Prep-side particle**; graphite scribble, frozen by construction | **N** | — |
| Scribed-arc mark set | S4-B5 | see set pieces | **N** (flagship 2) | **prototype at 390 px first** |
| Mug-ring mark set | S5-B4 | see keeping props | **N** (flagship 3) | **prototype at 390 px first** |
| Draughting-mark set (ticks, one arrow, the X) | S6 (all six islets) | `pencil.ts` `polyline()`/`score()`/`numeral()`; **never a font** | **N** | one shared set |

### Board tier

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| **`bakeBoardMap()`** | S7 (as the flatten atlas), S8 | one deterministic **2048²** canvas bake in `src/film/stages/board.ts`; the film's only texture above 1024²; vocabulary fixed in §5.1 | **N** | **the chapter's whole bet — budget it like the hero; it will eat iterations.** Judged flat at `NoToneMapping` |
| Flatten target wiring | S7 | `uTriFlat` + `uTriFlatUv` per merged group; atlas bound rig-side as one shared sampler; x-keyed stagger | **N** | 12 groups; roads/river/fields join the lie-down |
| Endcard lettering set | S8 | the Hand's tagline stroke SVG + the CTA's drawn double-border | **N** | — |

### Typography — the eleven captions plus the tagline

| Asset | Stages | Technique | R/N | Build cost |
|---|---|---|---|---|
| `open1` `open2` `me1` `me2` `me3` `me4` `light1` | S1, S2, S3 | the Hand: authored stroke SVGs, **same element ids** so every `cap()` call drives them unchanged | **N** (P6) | `light1` carries the graphite→ink flush |
| **`set1`** | S4-B4 | as above; **its ink⇄graphite flush must key off the curtain value, never a parallel tween** — this is the only caption that flushes off a whole-frame tick, and the wiring is cheap now and ugly retrofitted | **N** (P6) | previously unbilled |
| **`welcome`** | S5-B8 | as above; ink | **N** (P6) | previously unbilled |
| **`pitch1`**, **`pitch2`** | S7 | as above; ink | **N** (P6) | previously unbilled |
| Endcard tagline | S8 | as above | **N** (P6) | — |

### The Picture Book — the WebGL-failure and share/SEO surface

Eight painted frames, one per stage, produced by `posterBake.ts` at the compositions named here. They are
the same page rendered as plain scrolling HTML with the captions and the full endcard — **same story, same
CTA** — and they are the OG/share surface.

| Frame | Composition | R/N |
|---|---|---|
| S1 | B3, the volley at the rim medium | **N** bake |
| S2 | B3, the flagship address with the erasure | **N** bake |
| S3 | B3, the lantern held wide with the tide-line at its foot | **N** bake |
| S4 | B5, the flicker's held frame with the arcs | **N** bake |
| S5 | B4, the frozen room with the goblin crossing it | **N** bake (also the in-film share beat) |
| S6 | B1, the road | **N** bake |
| S7 | B4, mid-flatten | **N** bake |
| S8 | B3, the endcard at rest | **N** bake |

### The per-mesh material census — one running table, ceiling 40

**Per-mesh materials exist only where a mesh needs its own state:** `alive` entities, `reveal()` targets,
and flatten targets. Everything else merges **one `BufferGeometry` per class per island** (G1) —
`InstancedMesh` is banned film-wide, because the trilayer's vertex injection does not read
`instanceMatrix` and every instance would sample the stroke tiles, grid, seam and depth ramp from the
same world position.

| Stage | Materials | Which |
|---|---|---|
| S1 | 0 | — |
| S2 | 0 | — |
| S3 | 4 | fire2 group · lamppost group · cave+door · chest+lid+coins |
| S4 | 3 | mushrooms · signpost+board · rope |
| S5 | 2 | the die · the DM screen's map face |
| S6 | 4 | the road mark · candle flames ×3 |
| S7 | 13 | 12 flatten groups + `die2` |
| S8 | 1 | the board group (its own locality/opacity contract) |
| The goblin | 1 | permanently alive |
| **Total** | **28 of 40** | **12 slots spare** |

**Reductions already taken, so nobody re-adds them:** ravens ×3 → 0 (transforms need no material state) ·
tufts + treeline → 0 (the 29.1 reveals retire; the exhale takes them) · the window diorama cards → 0
(outside the trilayer) · the eight houses → 2 groups, twelve trees → 3 groups, six fields → 2 groups
(that is 31 flatten targets reduced to 12, and it is what buys the film its margin) · the monster, sign,
coins and NPC miniature → 0 (transform-animated).

### The hatch retirement roll — all live sites, by name, to zero

**[ERRATA 2026-09-03, verified against the file — **31 live sites, not 33**, and the line numbers below
are ~278 lines low (`world.ts` is now 4756 lines; the goblin rebuild landed). `978` goblin flank and
`1211` jaw are **already deleted**. `1366` is **the adventurer's** cloak tone, not the goblin's — it is
inside `buildAdventurer` (now `world.ts:1644`), still live, and it retires under S1's "silhouette-first,
painted cloaks, zero interior hatch". The goblin's own third hatch field was the nine-stroke `contact()`
disc (`pencil.ts:487` builds a `hatch()` inside it), also already deleted; `buildGoblin` now greps clean
for `hatch(`, `contact(`, `blobs(`, `timberDark` and `paint(…fill:` — goblin gate `G9` passes. **Retire
every site by name, never by line.**]**

| Site | Retired as | Where it is stated |
|---|---|---|
| `218` well shadow (chest interior) | painted dark pooling | §3-S3-B5 |
| `573` mushroom gills | one committed shadow mass under the cap | §3-S3 header |
| ~~`978` goblin flank · `1211` jaw~~ · the goblin's `contact()` disc | **already deleted** (2026-09-03); lit Lambert + the cloak bake | goblin design doc |
| `1366` **adventurer** cloak tone (now `1644`, in `buildAdventurer`) | painted cloth mass, zero interior hatch — cast tier | §3-S1-B2 |
| `1573` S1 rock face | 3-tier baked tone + authored contours | §3-S1 header |
| `1941` cave mouth | `caveDark` paint + contour | §3-S3 header |
| `2147`, `2189` sign "letters" | authored scribble rows | §3-S4-B2 |
| `2628`, `2670`, `2689`, `2759` theatre tones | floorboard directional bake, ruled silhouette kept | §3-S4 header |
| `2914` finger crease | dies with `buildFinger` | §3-S5 header |
| `3001` tavern bay | drybrush | §3-S5 header |
| `3018` window night | **a real view of the undrawn world through the glass** | §3-S5 header |
| `3059` firebox | painted dark + coals | §3-S5 header |
| `3131` table wear | drybrush | §3-S5-B4 |
| `3249` sheets · `3277` DM screen | authored scribble rows | §3-S5-B2 |
| `3409` montage ring | deleted with the v1 cylinders | §3-S6 header |
| `3687` fragment window | painted `caveDark` behind slats + a drawn frame | §3-S6-B3 |
| `3772` mound | painted soil tone in the islet albedo | §3-S6-B4 |
| `3784` stump rings | painted concentric value steps in the timber bake | §3-S6-B4 |
| `3809` hoard tone · `3864` written book | **deleted with the cut chest vignette** / scribble rows | §3-S6 header |
| `3952` cliff cracks | painted value-break fractures in the rock bake | §3-S7 header |
| `4016`, `4027`, `4044` scorches + trample | gone with the remains | §3-S7 header |
| `4208` massif tone | reserved-paper snow + 3-tier rock | §3-S7 header |
| `4260` water | the water class's one funded pigment band + tangent dabs + drawn edge | §3-S7 header |
| `4297` field till | painted field washes | §3-S7 header |

`hatch()` and `crossHatch()` stay in `pencil.ts` as dead exports until the last call site is gone, then are
deleted, along with the `curtain.ts` shader's near-black hatch accent.


### The rig — the lighting decisions this book makes, closing three open gaps

**1. The exterior-night key stays a `DirectionalLight`.** It is described everywhere as
"radius-limited", but `rigs.ts:118` is a directional and has **no distance falloff at all**; making it
radius-limited would mean converting the film's only shadow-caster to a point light for two stages,
against a cliff baked for the day family. It does not happen. The night family is the same light at the
same **+18° screen azimuth**, lowered and dimmed: **`KEY_I_NIGHT = 0.55`, `HEMI_I_NIGHT = 0.35`.**
S1-B5's darkest frame is **composed and baked** — a dusk hemisphere plus contact darkening in the island
albedo — not lit by a falloff that does not exist. Three chapter-family presets, in `rigs.ts`:

| Family | Stages | Key | Azimuth | Intensities |
|---|---|---|---|---|
| Exterior day | S3, S4, S6, S7 | `(4, 6, 3)` — the shipped hero key | +18° | `KEY_I 2.2`, `HEMI_I 0.8` |
| Exterior night | S1, S2 | the same direction, lowered | +18° | `KEY_I_NIGHT 0.55`, `HEMI_I_NIGHT 0.35` |
| Interior | S5 | `(2.6, 3.2, 1.1)` — the hearth | **+38°**, the film's one azimuth move | key demoted; practicals carry the room |

**S2 is Prep: no key at all.** **S8 is unlit:** `skyBoard` = `paper`.

**2. The practicals array — three slots, hard cap.** `rigs.ts:131` ships **one** amber `PointLight` at a
fixed position, and four stages need several simultaneously. Replace it with a fixed array of three —
`practicals[0..2]`, each carrying `{ position, intensity, phase }` and its own flicker term, all
intensity-scaled by `(1 − curtain)` exactly as the single glow is today (a drawn fire emits nothing).
**~10 lines in `rigs.ts`; `update()` loops.** This extension is funded by declining the `seamDir`
promotion, so the rig/shader budget is net-neutral. Allocation: **S1** 1 (campfire) · **S3** 2 (campfire +
lantern — the "three embers of motion in one frame" read is two practicals plus the door's motion, not
three lights) · **S5** 2 (hearth + candle) · **S6** 3 (the three candles, which is why the cap is three) ·
S2, S4, S7, S8 none.

**3. The key's shadow camera tracks the shot.** `rigs.ts:122–127` is a fixed ±8-unit box with `far 40` —
it cannot cover a 30-unit ribbon island or a 40-unit miniature world, and nothing said so. The box stays
±8; **`key.target` follows `world.look`**, so the shadow map always covers the subject the camera is
pointed at. Beyond the box, grounding is contact blobs.

**4. Where world casters are registered — per stage, decided here.** One shadow-casting light, ever.
Registered casters cast while any paint is up and **release at the fully-drawn page**, so a frozen frame's
shadow map holds only the alive.

| Stage | World casters | Grounding elsewhere |
|---|---|---|
| S1 | camp + cliff dressing, the trio | contact blobs |
| S2 | none (Prep) | his contact shadow only |
| **S3, S6** | **none** | **contact blobs baked into the island albedo.** This is what stops a graphite prop east of S3's frontier from throwing a shadow onto painted ground west of it — *a drawing casts nothing* — and it removes any need for the box to cover the whole ribbon |
| S4 | the disc, the rope, the goblin | contact blobs |
| S5 | the goblin only (the room is frozen for most of the stage) | contact blobs |
| S7 | the cliff, the miniature world's near half | contact blobs |
| S8 | none (unlit) | — |

**5. The lantern ledger, kinetically.** Every light source in the film is one he lit on camera or plausibly
maintains. **No unmotivated light anywhere.** And the world only ever moves where he has been: ambient life
exists only on surfaces he has lit or dressed, so an untouched graphite region is still **by
construction**.

---

## 7. THE PHONE CONTRACT — the film at 390×844

**The figure floor.** At every **acting** beat the goblin projects **≥100 px of figure height** on
landscape and **≥84 px** on portrait ≤560 CSS px. **Establishing beats are the only shots permitted below
the floor.** `GOB_SCALE = 0.75`, uniform and locked film-wide. World scale per beat never changes; camera
and shot size do.

**[ERRATA 2026-09-03, motion doc D-6 applied — two surfaces, one name.** This film-wide `GOB_SCALE = 0.75`
is not the goblin doc §11.2 / gate `G7` scalar, which the **Cover** solves per breakpoint so his projected
figure clears **≥52 CSS px**, capped at 1.35× base. The shipped `hero.ts:50 export const GOB_SCALE = 0.75`
is the *Cover's* (it is read only inside `stageGoblin`) and **renames to `HERO_GOB_SCALE`**; the film body's
constant takes the `GOB_SCALE` name at film level. Two constants, two floors (52 px on the Cover, 84/100 px
in the film), no conflict.**]**

**The mechanism, applied in this order, per beat:** (1) **camera distance** — the portrait comp solves per
breakpoint, height-aware; (2) **the portrait beat re-frame** — every acting beat carries a second authored
camera target (`portraitLook`): a tighter, differently-composed shot of the same moment, **authored
staging, never a runtime crop, never an FOV tween**; (3) **drop the wide** — where (1) and (2) cannot reach
the floor without breaking the 92vw island margin, the beat plays as a medium and the stage's establishing
wide happens on either side of the acting, never during it.

**`scripts/figure.check.ts` asserts every `A` beat** in the table below at 390×844, 500×915 and 768×917
(≥84 px) and at 1440×900 and 1920×1080 (≥100 px). **The `A`/`E` flag in §3 is the check's source of truth
for the whole film — one table, not three.**

| Stage | Beats | Flag | Portrait staging |
|---|---|---|---|
| S1 | B1 | E | black + caption; caption clamp verified at 390×844 |
| S1 | B2 | E | recompose toward the cliff: party as two foreground shoulders at frame bottom, rim goblin upper third; **the paper gap between the islands is the shot's spine and survives the narrow frame better than the landscape spread does** |
| S1 | **B3** | **A** | **reclassified from establishing.** The flinches are acting: a rim medium with the bolt entering from below-left; he clears 84 px |
| S1 | B4, B5 | A | rim medium-close, plateau cropped, paper void kept above; **the leap plays taller in portrait** — the vertical drop suits the frame |
| S2 | B1–B5 | A | the push-in's portrait solve lands closer (`compFor`/`BELOW_FRAC`); his face clears 84 px trivially. **Flagship 1's erasure sits beside his head at the same world scale; if the ghost line cannot survive 390 px it demotes to texture there** |
| S3 | B1 | A | he is the only content; portrait centres him. **Check the void-hop window still contains no island pixel at portrait's taller FOV** — widen the anchorless span by 0.1 t if not |
| S3 | B2, B4, B5, B6 | A | per stop: a tighter three-quarter of goblin + prop, island rim and one plane of dressing — "drop the wide". Transit between stops may dip below the floor |
| S3 | **B3** | **A** | the thesis image: lamppost and goblin **stacked vertically** (post exits top of frame, the lit ground fills the lower half, caption band on the quiet outer edge). **QA the graphite→ink flush at 390 exactly.** He clears 84 px and the band clears 4.5:1 |
| S3 | B7 | E | travelling wide; the frontier's tide-line is a full-height event and reads at any width |
| S4 | B1, B2 | A | tighter on him + the prop; the theatre island's silhouette may leave frame until B3 |
| S4 | B3 | E | the stage's one true wide; exempt |
| S4 | B4 | A | tighter over-the-shoulder: rope + disc rim, the mountain cropped until the reveal |
| S4 | **B5** | **A** | the flicker's held frame, tightened: **his shoulder, the rope, and the apron's arc band across the middle.** If the arcs cannot survive 390 px they demote to texture there |
| S4 | B6 | A | two-shot: goblin + flat |
| S5 | B1 | A | trailing medium; the dark frame is composed at every width |
| S5 | B2 | E establish, then A on the die | the establish is exempt; **the die's numerals are QA'd at 390 px from this exact angle** |
| S5 | B3 | E | the frozen room; the dolly's end composition |
| S5 | **B4** | **A** | tighter on his path with the rings held in the near plane; **if 390 cannot hold both, the rings demote to texture there — the shot does not shrink** |
| S5 | B5 | A | dead-centre close; clears trivially |
| S5 | B6 | A | the macro — his hand and head at frame scale. **The 20's numerals QA'd at 390 px** |
| S5 | B7 | A | medium |
| S5 | B8 | E | table medium; exempt |
| S6 | B1–B6 | A | **the figure floor is met by camera distance alone in all six** — the shipped solve already sits ≤3 units out and shoots down the goblin-to-job line **precisely because a phone frame is 36° wide** (`timeline.ts:711–715`). Each still carries a `portraitLook`: B1 favours sheet + hand, B3 crops the wall to bracket + drop, B5 frames miniature + X + the near house. **Islets never crop on all four sides** — each shows a rim |
| S6 | B7 | E | the tilt; exempt |
| S7 | **B1** | **A** | the flagship: the `portraitLook` tightens so **cairn + mushrooms fill the lower half and he crops to shoulders.** The rhyme survives; the shot does not shrink. **This flagship's valve is re-framing, not texture** — there is no fine mark to demote |
| S7 | B2 | A | tighter OTS: rim + him + the world's near half; the massif may exit frame — the wide establishing read happens in B3's rise instead, which is "drop the wide" working as designed |
| S7 | B3, B4, B5 | E | the rise, the flatten, the map; exempt |
| S7 | **B6** | **E, registered exemption** | the throw. **`die2` is the actor; he is deliberately under the floor because the handover means the camera leaves him.** His release is authored as a large silhouette gesture so it reads at establishing scale. **His last floor-compliant acting beat is B2's straighten.** The check's beat table must carry this flag or it will fail the throw at 390 px |
| S7 | B7 | E | the 20 face; **numeral QA'd at 390 px** |
| S8 | B1–B3 | E | no goblin. Endcard clamps are copy-spec law: stack 88vw under 500 px, wordmark 76vw, subline caps to two balanced lines, halo contrast ≥4.5:1 verified at 390×844. Board wear marks demote to texture at 390 if they cannot read |

**Everything else at phone width.** Islands restack vertically rather than crop; **island rims never touch
the viewport edge at any breakpoint** (the drop shadow's soft tail is exempt at ≤11% alpha); the caption
band and margin hold at 390×844; the S5 interior is sized against `MAX_PULLBACK 2.2` with its open side
facing the pulled-back portrait camera **by construction**, so portrait never sees outside the set.
**Nothing is cut outright at phone width.** There are exactly **four demote-to-texture valves** — flagships
1, 2 and 3 plus the board's edge wear — and one **re-frame valve** (flagship 4).

**Prototype gate, before any other build work.** The three demotable flagship reads (S2's erasure, S4's
arcs, S5's rings) are prototyped at 390 px **first**. They are cheap to test and they decide whether
portrait gets an argument at all. **If two of the three fail, demotion is not the answer — re-siting is:**
the arcs move outboard along the apron bed (already the staging here), and the rings move to the die's own
near edge.

---

## 8. ACCESSIBILITY

### Reduced motion — the stepped picture book

Live `matchMedia`, no reload, as `rigs.ts:42–51` already does. **`A = 0` means *still, at the lit pose*,
not merely reduced.** One held composition per beat — 48 beats, **49 stills**, the compositions named in
§3. **[ERRATA 2026-09-03 — "48 stills" did not match the per-stage table below, which enumerates 47 and
gives the S3 lantern two (before / after). The rule that binds is *every beat has an authored still*: 48
beats + the lantern's second = **49**. Where a stage row below lists fewer entries than the stage has
beats, it is abbreviating, not licensing a merge — S5-B5, S5-B7 and S7-B6 each still own a still.]**

| Stage | Steps |
|---|---|
| S1 | black + `open1` → the aftermath wide → the volley at the rim medium → the leap's end pose → the landing |
| S2 | the get-up → the tick (already a cut, unchanged) → the flagship address → "I did." → the run-out |
| S3 | the void crossing (**the void hop becomes a step — there is no slide to see, which is safer, not weaker**) → the lit fire → **the lantern as a two-still sequence, before / after** → the open door → the chest → the ravens scattered → the last stride |
| S4 | the mushrooms → the signpost + the returned morning (**the exhale is a cut**) → the stage wide → the haul → **the flicker as one cut-in / cut-out held frame, no drift** → the wave |
| S5 | the dark held frame (one) → the tavern establish → the die on 1 → the frozen room → the goblin at the die → the painted 20 → the resumed room |
| S6 | six vignettes, each held **in its finished state** (road drawn, monster placed, sign hung, saplings planted, NPC on its X, candles lit) → the dawn tilt's end |
| S7 | the tended rim → the OTS with `pitch1` → the miniature → **the flatten as a single cross-fade between the standing and flat states** (the same `uTriFlat` endpoints, opacity-stepped, no sweep) → the map → the throw as a cut to the 20 |
| S8 | the board → the endcard (**wipes become opacity fades at the same times and durations; the CTA's scale drops out entirely**) → at rest, static |

**Also:** every write-on becomes a plain opacity fade at the same mark and duration · every camera ride
becomes its end composition · every freeze and exhale is an instant cut · page turns become plain cuts with
no flash frame · the exposure crossfade becomes a plain crossfade · banked idles, hearth, candle, patron
sway, ember drift, the spill's hang and the board's breath all go **still at the lit pose** · soft rests
off · boil off · play mode steps at the same 66 s pacing.

### Screen reader

The canvas is `aria-hidden="true"`. **The SR document is first in DOM**, visually hidden, and carries, in
order: *Skip to joining the Discord* → the eleven captions **verbatim** with a one-sentence scene
description between each → the endcard tagline and subline → the real Discord link as a real `<a>`.

Scene sentences, in order (SR-only; not on-screen copy):
1. *Night at the foot of a cliff: the aftermath of an ambush, lit by one campfire.*
2. *The party spots a goblin on the rim and fires; he ducks, runs, and leaps off the far side.*
3. *He lands in a heap, gets up, dusts himself off — and time stops. The world becomes a pencil drawing; he stays painted.*
4. *He runs down a path island through the drawing, lighting a fire and a lamppost, opening a cave door, stocking a chest, and shooing three frozen ravens.*
5. *Morning returns behind him; he seeds mushrooms and straightens a signpost.*
6. *He hauls a rope and a whole forest turns away on a stage disc, revealing a snowy mountain flat standing backstage; for a moment the paint lifts and the machinery under the stage shows its worn arcs.*
7. *In a tavern the Dungeon Master rolls a one. Time freezes; the goblin walks in through the frozen room, nudges the die to twenty, and is gone before time starts again.*
8. *Six quick jobs: he draws a road, places a monster, hangs a tavern sign, plants saplings, sets a villager down on its mark, and lights three candles.*
9. *At dawn he stands on the same cliff, now tended — the wreckage cleared, a cairn raised, mushrooms planted — and looks out over the whole world.*
10. *The camera rises and the world lies down into a map. He pulls a twenty-sided die, spins it, and throws it at us.*
11. *The die's twenty fills the frame and becomes the map you are now looking at.*

The endcard's CTA is a real link in the visual layer too. Focus order: SR skip link → play/replay → skip
note (when present) → CTA.

### Keyboard

`Space` play/pause · `↓/↑` step the seventeen rest anchors (§2) · `PgDn/PgUp` chapter · `Home` cover ·
`End` endcard · `Esc` de-escalates play mode. **No traps. No interaction is hover-only** — there is no
hover during the film at all. The skip note enters the tab order at t16.5. Play mode ending at the endcard
moves focus to the CTA politely (`preventScroll`, no jump). **Focus is the drawn double-line rectangle,
always visible, never the browser default, never suppressed.**

### Vestibular

**No camera roll anywhere in the film.** No spiral moves, no orbits, no free camera, no FOV tweens. Every
push is straight-line; the S7 rise is slow and axis-locked; the S4 disc turn is object motion under a
static-to-slow camera; the flatten is in-world (texture and scale), not camera motion. Cuts are instant
with no smear frames. The S1 impacts are **scale pops, not flashes**. The walk-through's darkness is an
exposure crossfade, not a smear.

### Contrast and colour independence

Captions ≥4.5:1 on their band at every breakpoint · interface ink ≥3:1 in its breathed form · the grid
ghost ≤`GRID_INK` · the walk-through's margin ≥3.5:1 against the held tone · the endcard's halo system
verified against the **final** board bake at 390 px and 1920 px. **State is never colour-only:** Prep is
simultaneously texture (graphite strokes), lighting (shadowless), margin (breathed) and motion (stopped);
the flatten is simultaneously geometry lying down, strokes changing class and the grid rising; the CTA
pairs colour with a border re-ink, a contact shadow and a fill inversion.

### Failure and interruption

WebGL unavailable, or context lost twice → **the Picture Book** (§6): the eight painted frames with the
captions and the full endcard as plain scrolling HTML — same story, same CTA, and the share/SEO surface.
Context lost once → silent restore at the nearest rest anchor. Reload mid-film → resume at the nearest
rest anchor, **never a raw offset**, so every restored frame is a composed one; the app forces one full
scrub-render before unveiling, behind the Cover. Resize or rotate → re-clamp, restack portrait staging,
preserve `t`. **No spinner exists anywhere.**

---

## 9. OPEN RISKS — honestly

1. **`bakeBoardMap()` is the film's whole bet.** A code-authored 2048² map that must read as *real product
   art* under the guardrail that rejects smooth masses and gradient washes on sight — and it is the
   conversion surface **and** the flatten's destination atlas. Budget it like the hero; it will eat
   iterations. Mitigation: its vocabulary is fixed (§5.1) and it is judged flat at `NoToneMapping`.
2. **The S3 curtain drop at t20.55 is the film's one architectural switchover**, and everything after it
   depends on it being invisible. The plan is sound — `seamX` is placed at the frame's west edge one frame
   before the curtain drops, so the flip changes nothing on screen — but it has never been walked. **Build
   this beat first, after the phone prototypes, and walk it in both directions before anything else in S3
   is polished.**
3. **The path ribbon island sets the draw-call ceiling.** ≤120 per stage, measured with
   `draws.check.ts` at each stage's authored camera. The merged-geometry discipline is what makes it fit,
   and *"just one more separate mesh"* on the ribbon is where the budget dies first. The tavern is the
   second risk: the densest room, plus a window diorama, plus a cast of six.
4. **The flatten's reverse at flick speed** is the site's most-scrubbed moment. G7's same-mesh construction
   makes it correct by design, but the x-keyed stagger must be driven from **one timeline position with no
   callbacks**. Walk it both directions at flick speed on the QA grid.
5. **Night on a paper page is unproven.** S1 carries "genuine night" entirely in dusk air plus one dimmed
   directional over a light page, with the cliff baked for the *day* family. If the read fails — too pale,
   or the day-baked shadow side contradicting the fire's direction — **the fix lane is intensity and air
   only**; the bake and the azimuth are law. Judge at the first S1 walk, flat transfer, no grading escape
   hatch.
6. **Flagship legibility at 768 px.** An erasure that reads at 1440 can vanish at 390 (where it demotes by
   rule), but if it also fails at ~768 the argument thins for half of real traffic. Author the ghost line at
   the width the framing guarantees and **QA at 768 as well as the contract's named sizes.**
7. **The walk-through is the most fragile transition in the film.** A parked scrub mid-darkness is a legal
   held frame and must be composed; the set swap must hide entirely inside the crossfade in **both**
   directions; and the S5 establish must be fully composed on the emergence frame. Three QA cases, all named.
8. **Banked idles are new wiring — fifteen idle sites, not nine** (ERRATA 2026-09-03: the motion doc
   §10.4 carries the complete ledger with a named scrub-tied gate for each, and caps the registry at 20).
   The flicker terms currently read `world.t` — frozen for
   whole stages. Moving touched props' idles onto `gobT` with amplitude gated by the reveal shell is cheap
   at ≤40 materials, but **P3-T3's caution binds: nothing may boolean-flip on "revealed."**
9. **`set1` flushing graphite mid-hold.** The Hand's ink⇄graphite crossfade is shipped grammar for `light1`
   but **has never run off a whole-frame tick.** It must key off the curtain value, not a parallel tween.
   One wiring decision: cheap now, ugly retrofitted.
10. **The full-puppet nudge replaces the film's best v1 animation.** Bench + table is a stacked-furniture
    reach at proportions where his arm is a third of his body; the die may need to sit a few centimetres
    nearer the bench edge for the reach to solve without the invisible-tray read. Budget rehearsal;
    `puppet.check` at both breakpoint camera targets.
11. **The mug rings overcooking.** Near-plane evidence at reading scale is one nudge from becoming the
    subject and breaking the one-eye-path rule. The rings are value-quiet graphite on `plank`; the die and
    the goblin carry the contrast. **Judge in the built frame, and thin the rings before moving the camera.**
12. **The reverse of the die's reveal at macro scale** has never been seen. If the un-painting reads as a
    glitch rather than as un-keeping, re-judge the shell's radius and duration inside the shipped 0.35–0.9 s
    band — **not with new machinery.**
13. **God-ray cones are one gradient-wash accident from violating the no-smooth-masses gate.** They must be
    painted objects: drawn edge lines, dab-textured fill, a hard stop. Never a soft alpha falloff.
14. **The monster's 3-tier bulk bake** must not read as banded stripes at vignette distance. The tiers ride
    `roughen()` displacement, not parallel bands — **check at the vignette lens, not in isolation.**
15. **The endcard's contrast on a busy board.** `BOARD_WASH 0.5` and the per-glyph halos were tuned against
    an empty grid; a fully painted map underneath is a harder knockout test. QA against the final bake at
    390 px and 1920 px before calling S8 done. **The wash may need to rise; it may not fall** — the
    printed-content read depends on it.
16. **The S4 stillness is deliberate and may still read as dead.** A theatre between shows has no
    practicals and almost no ambient by design; the rope's settle and the disc's dust are its only motion.
    If the wide sags, **the fix is dressing density, never turn speed** — time is locked.
17. **Six paired `tl.set` clusters in the montage plus one at t50.** A drifted pair is an invisible bug
    until someone scrubs backwards. **Assert every pairing in `motion.check`.**

---

**The direction's own test, restated as this book's exit criterion.** When *"I've built worlds for your DM
for years"* letters on at t58, the visitor should already believe it — because for six stages, the pixels
kept the receipts. Every beat above earns one of those receipts or it does not ship.

