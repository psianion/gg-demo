# THE HALF-ALIVE ISLAND — signature hero design

2026-09-02 · 3D art direction for the arrival moment. Builds on
`2026-09-02-3d-site-creative-direction.md` (The Underdrawing) and supersedes **Stage 0
(the Cover)** of `2026-09-02-experience-design.md` — the Cover's loading strategy,
affordances, and house-lights handoff all carry forward; the paper-and-wordmark still
life becomes a full signature scene. Impeccable brand register applied (§12).
Amendments to the sibling docs are listed in §14. Build requires an approved plan.

---

## 1. The image

**A small island of the world floats on the page, half-drawn and half-alive — and the
goblin is standing on the seam, pencil in hand, caught making it.**

The right side of the island is finished: painted gouache, morning light, a lit lantern
post, breathing grass, a moth. The left side is still underdrawing: graphite contours,
construction ellipses, measure ticks, the battle grid ghosting beneath. The boundary
between the two is not a wipe line — it is the goblin's *progress*, the soft-bloomed
edge of work done, and he stands at its leading edge with a carpenter's pencil, looking
down at the next stroke. Above the island, the wordmark. Under it, one true sentence:
*The Dungeon Master's backstage.*

That is the entire product in one held frame — **the drawn world becoming the played
world, and who does it** — parseable in under three seconds, before a single scroll.
The film that follows is the explanation; the endcard is the invitation; the hero is
the question that makes you scroll: *why is half this world pencil?*

One deliberate spoiler-shape note: the hero shows the two states as a still life
*without* explaining them. The film's first freeze (Stage 2) doesn't lose its reveal —
it gains recognition: "the poster was this."

---

## 2. The scene — contents and composition

**The island** (~5 × 3.5 world units, oval, sculpted-edge earth strata with two roots
trailing off into the page): a slice of the C2 path world in miniature —

- the winding path crossing left→right (earthTrack `#A8875C` where painted, bare
  contour where not),
- the lamppost — a **lantern** post, lit — standing in painted territory right of
  center,
- five trees: two painted oaks/pines right (canopy `#678E42` / needle `#4C7350`,
  canopyDeep `#466F33` in their shadow mass), three still graphite left, one of them
  only half-contoured (visibly *next*),
- a signpost (painted, freshly straightened — one support stone still out of place),
- the chest, graphite, waiting on the far left,
- grass tufts, stones, three red-cap mushrooms (mushCap `#B03C22`) clustered at the
  lantern's foot — the film's caps-in-threes signature,
- under the graphite half: the grid, ≤4% ink, fading out under the painted half.

**The goblin** (locked v2 design; 0.62 units tall) stands on the path just left of
island center, at the seam's leading edge, three-quarter toward camera, head bent to
his work. Right glove emerged from the cloak holding a **carpenter's pencil** (bare
cedar, graphite core, worn flat) — the reach pose the cloak was designed for. His
gaze: down-left at the unpainted path. His shadow falls *across the seam onto the
drawing* — see §5.

**Screen composition (desktop 16:9):** island ~58vw wide (max 900px), center at 54%
viewport height, its long axis rotated so the graphite side owns the lower-left and
the painted side the upper-right — the eye reads before → after in reading direction.
Goblin lands on the left third-line; lantern on the right third-line; the two make the
frame's diagonal. Wordmark centered at 12% vh, min(38vw, 420px). Tagline directly
beneath. Affordances in the bottom margin per the interface layer. Nothing touches
the viewport edge; the page margin breathes around everything.

**Portrait:** island 92vw at 48% vh, camera pulled back per the FOV-clamp rule;
wordmark 72vw at 9% vh; the seam re-aims steeper so both halves stay visible in the
narrow frame; affordances stack per the experience doc.

---

## 3. Camera

- **Lens:** FOV 32° — mild telephoto. Compression is what makes a diorama read as a
  *miniature you could pick up* rather than a landscape; wide angles kill the maquette.
- **Position:** elevation 33°, azimuth −18° (favoring the painted side so morning
  light rakes toward camera), framed so the island's near rim cuts the bottom of its
  zone — you are standing at the maker's bench, not flying.
- **Idle breath:** dolly ±1.2% on a 13s sine — the stillness of a held frame, alive
  under the eye. Never a drift path, never an orbit; the hero is a poster, not a
  turntable.
- **Cursor parallax** (§9): yaw ±2.2°, pitch ±1.2°, damped 550ms, capped — depth
  proof, not a gimmick. Off on touch and under reduced motion.

---

## 4. Materials

Straight from the trilayer system, with the committed tokens (`palette.ts` /
`pencil.ts` are the source of truth — paper `#F7F5F0`, ink `#222222`):

- **Painted half:** gouache albedo with directional brushwork following form; paper
  tooth show-through at grazing angles; edge-wear drybrush on the lantern post's
  corners, the signpost arm, the near rim of the path — the specific wear of
  maintained things. Matte throughout; gouache has no gloss. The lantern glass
  (lanternGlass `#F2E2B4`) is the only emissive surface in the hero.
- **Graphite half:** the same forms' authored underdrawing — contour passes,
  construction ellipses on the tree crowns, tick marks along the path, one visibly
  erased and redrawn line on the half-contoured tree (the maker is not a machine).
  Strokes carry the 2-frame boil at ≤0.8px screen amplitude.
- **The seam:** the touch-reveal grammar frozen mid-spread — a soft, irregular,
  feathered bloom boundary (never a straight clip), pigment slightly denser at the
  leading edge as real wet media pools at its own frontier. The seam is the hero's
  most-stared-at square inch; it gets authored texture, not a shader falloff alone.
- **The island edge:** cut earth strata (earth `#C2A97E` over stoneWarm `#A9967A`
  over a caveDark `#3F3226` underside), roots, one dangling pebble — painted on the
  painted side, sectioned drawing on the graphite side (strata drawn as a geologist
  would hatch— no: as *contour lines*, hatching stays banned).
- **The goblin:** ~~full paint per his sheet — sage skin `#84A058`, olive cloak, amber
  eyes `#F2C35E`. He is the loudest chroma in the frame by one deliberate step.~~
  **SUPERSEDED 2026-09-03** by `docs/2026-09-03-goblin-design.md` §4, and built the
  same day. He owns the frame's **darkest committed value and its only cool hue** — a
  slate cloak `#2E3742`, theatre blacks, because a stagehand dresses to disappear
  against the set. His *chroma* is small, warm and inside that dark: sage skin
  `#84A058` and the amber eyes `#F2C35E`. Olive was measured against the rendered pine
  crown at a 0.012 luma delta — he was a third tree. The one ownership statement for
  his colour now lives in `src/film/palette.ts`'s goblin block; nothing re-litigates it
  from this bullet, from the retired rust comment, or from `world.ts`.
- **The pencil:** jewel-tier micro-prop — bare cedar, flat-worn graphite tip, a thumb
  notch. It's the product's icon rendered honest ("the map you *drew*").
- **The page:** cold-press tooth, margin ticks, the grid ghost extending faintly off
  the island's graphite side onto the paper itself — the drawing escaping its object,
  the page and the world refusing to stay separate. ≤4% ink, always.

## 5. Lighting — two rigs meeting at the seam

The hero's lighting concept IS the concept:

- **Painted side — the Performance rig.** Warm morning key (`#FFEACC`-family, ~35°
  elevation from the lantern side) + cool sky fill (skyDay `#ACCDE6` hemisphere at
  low intensity); the lantern contributes a warm point light (flameBody `#F4CC70`)
  with the film's authored flicker (±7%, never strobing). Soft shadows: trees and
  goblin cast; contact shadows ground every prop.
- **Graphite side — the Prep rig.** Flat, even, shadowless paper light. A drawing
  casts nothing.
- **The one crossing:** the goblin's shadow — he stands in the lit world, and his
  shadow falls across the seam *onto the drawing*, the only shadow that touches the
  graphite half. The "only shadow belongs to the alive" rule, staged as the hero's
  quiet signature. First-time visitors won't articulate it; they will feel that he is
  the only real thing on that side.
- **The island's drop shadow on the page** obeys the same law: present and soft under
  the painted half, fading to nothing under the graphite half. The object is only as
  real as its finished part.
- **Atmosphere:** one moth orbiting the lantern (2.6s ellipse), six dust motes in the
  key light's shaft, pollen drift ≤3 particles — painted side only. The graphite side
  gets nothing but the boil. No fog anywhere in the hero (fog is in-world grammar;
  the page is a void, not a room).

## 6. Typography and copy

Per the (amended) type system — every face on screen at the hero:

- **Wordmark** — the drawn GOOD GOBL·IN with ears and d20 pip, inline SVG, paper halo
  where it might cross the island on short viewports. Entrance: strokes write on
  (§8), the last stroke being the pip.
- **Tagline** — *The Dungeon Master's backstage.* in **the Hand** (authored
  lettering), ink `#222222` on paper: ~15.9:1. clamp(1.15rem → 1.5rem). This line
  also closes the film at the endcard — the one product sentence, said twice, bookending.
- **Meta-line** — *a tale told in one take · about two minutes* — **Vollkorn** italic
  (the Quiet Serif; see amendment §14.4), 0.92rem, `#4A463E` on paper ≈ 8:1. The
  contract-setter; quiet on purpose.
- **Affordances** — *scroll ↓* (the Hand, boiling arrow, center-bottom), *play*
  (Cinzel small caps, bottom-left, ≥44px), returners' *been here? skip to the table ↓*
  (Vollkorn, bottom-right). All ink-family on paper, all ≥4.5:1, all per the
  experience doc's interface layer.
- **No other words.** No feature bullets, no nav, no social row. The hero argues by
  image; the copy load is one name, one sentence, one contract, two verbs.

## 7. Atmosphere — what the frame feels like

Morning in a maker's studio. The palette is the committed gouache grade against
near-chroma-zero bone paper — airy lights, real pigment mids, one warm ember accent.
The mood target: **calm confidence with one held breath of magic** — not epic, not
cozy-pastel, not tavern-dark. The visitor should feel they've walked in on someone
good at their work who doesn't yet know they're being watched… and then he notices
(§9). Sound: none, site-wide, by design.

## 8. Entrance sequence — the load that draws itself

The entrance is the loading strategy (carried from the experience doc, now staged on
the island). All timings from first byte; every step is skippable — any input at any
moment jump-cuts to the settled frame and begins the §10 handoff. Returners
(`gg.seen`) run it at 0.6× duration.

| t | Beat |
|---|---|
| 0–250ms | Paper `#F7F5F0` + tooth + margins render (CSS/inline; zero network wait, zero layout shift, ever) |
| 250–450ms | The grid ghost fades in under the island's footprint; margin ticks draw on staggered |
| 450–1650ms | **The underdrawing writes itself** — ~78 graphite strokes draw the whole island (ground → path → trunks → canopies → props), dash-reveal, three-stroke stagger. This phase is also the *real* progress surface: if texture streaming lags, stroke pacing stretches to cover it (min 1.2s, graceful to ~4s; past 3s of true stall the margin notes *sharpening pencils…*). No spinner exists |
| 1650–1750ms | The lantern ignites: glass warms `#F2E2B4`, one soft pulse to `#F4CC70`, its light pool arriving before the paint — light leads, exactly as it does in the film |
| 1650–2450ms | **The paint bloom** — color spreads from the lantern across the right half (touch-reveal grammar, power2.out), shadows arriving with color; **the goblin fades in with the bloom's leading edge** (he is *of* the alive), his shadow laying across the seam as he lands |
| 2450–3100ms | Idle life starts (breath, blink, moth, flicker, boil). The wordmark writes on (480ms), tagline overlaps (360ms, −120ms lead), meta-line fades in, affordances rise 12px + fade |
| ~3.2s | Settled. The held frame. Idle GPU throttles to 30fps after 12s without input; wakes instantly |

The sequence performs the product in eleven words: *a map draws itself, then comes
alive, and someone made that happen.*

## 9. Mouse interaction — noticed, not clickable

Three behaviors, all read-only, all damped, all off under reduced motion. (This
amends the experience doc's pointer rule: the pre-film hero and the endcard are the
two pointer-live surfaces; the film between them stays pointer-dead.)

1. **Parallax breath** — camera yaw/pitch per §3. Touch devices: none.
2. **He notices you.** The goblin's head tracks the cursor inside a cone (yaw ±14°,
   pitch −6°…+10°, damped 400ms); first cursor entry over the island earns the
   one-per-session ear-perk. After 4s of cursor stillness he loses interest and
   returns to work — looks down, two tiny pencil strokes (a 1.8s scritch loop, his
   only idle act) — and glances back up on re-entry. Caught making, over and over,
   charming both ways. On touch: he glances up once at first touch-scroll instead.
3. **The almost-touch.** Over the graphite half only, a 90px-radius warmth follows
   the cursor — ≤6% amber `#E89544` lift, 250ms in / 400ms out. Your presence *almost*
   wakes the drawing; it never actually paints. The film explains whose touch works;
   the CTA finally gives you your own. Tease, grammar-consistent, cheap (one shader
   uniform).

**Clicks on the scene do nothing** — no hotspots, no surprise navigation; the click
grammar stays reserved for the CTA. The pointer is a presence here, not a tool.

## 10. Scroll response — the first-scroll transition

The handoff owns the first **3.5% of total scroll** (carved from Stage 1's share;
gearing amendment §14.3), fully scrub-tied and reversible in both directions.

- **Phase A — caught (0→55% of the slice).** The goblin snaps his head up to camera
  (120ms — the fastest move he ever makes), tucks the pencil into the cloak (400ms,
  glove retracts). The paint **drains back to the seam** — the world un-paints in
  reverse touch-reveal, lantern pool contracting last; his shadow lifts off the
  drawing; wordmark and tagline un-write; meta-line and hint fade; the margin stays.
  Meaning: you moved closer, and the magic hid itself.
- **Phase B — house lights (55→100%).** The page dims to black (0.6s-equivalent);
  the all-graphite island recedes (dolly-back 6%, opacity out); the last live pixel
  on screen is the lantern's ember-dot `#E89544`, dying at 97%.
- **Phase C — the film.** Black. `open1` — *Every campaign begins the same way…* —
  writes on. Stage 1 proceeds exactly per the experience doc.

Scrubbed backward from the film, the sequence re-ignites in reverse order — lantern
first, then the bloom, then he pulls the pencil back out and gets back to work
(reveals always grow from their light source; the grammar holds in both directions).
The play button drives the same path at film pace. Reduced motion: three crossfade
steps (settled → graphite still → black).

**Why this handoff:** it converts the site's biggest structural risk — a hero so good
people don't scroll — into the scroll's reward loop: the first gesture *causes* story
(the world hides; he knew you were coming), and pulling back re-plays it. The hero
teaches the film's one input by making the first input narrative.

## 11. Instant-understanding check

Product value must survive a 3-second glance. The hero states it three redundant
ways: the **image** (a map becoming a living world, made by the goblin), the
**tagline** (The Dungeon Master's backstage), the **wordmark** (who). A DM parses
"this makes and runs worlds" before scrolling; a player parses "that's the goblin
that got away, and he *works* here." The meta-line closes the contract (one take,
two minutes). Nothing else is asked of the visitor at the hero — comprehension
first, spectacle in service of it.

## 12. The impeccable pass

Run against the brand register (design IS the product here):

- **Lane, named:** *picture-book maquette on the drafting table* — reference
  anchors: stop-motion studio breakdown stills, mid-century picture-book endpapers,
  construction drawings. Explicitly not: Klim-editorial, Stripe-restraint,
  acid-maximalism, cozy-pastel Ghibli-lite, tavern-dark fantasy kitsch.
- **First-order category reflex** ("D&D site" → dark dungeon, torches, dragon,
  Cinzel everywhere, scroll-parchment UI): avoided — morning gouache, bone paper,
  construction drawing; Cinzel demoted to one button and two labels.
- **Second-order reflex** ("D&D-but-wholesome" → pastel cottagecore wash): avoided —
  the construction layer, stage machinery, committed pigment darks (canopyDeep
  `#466F33`, caveDark `#3F3226`) and the maker's-bench framing keep it a *craft*
  image, not a mood filter.
- **The cream-body-bg ban, addressed head-on:** the page is `#F7F5F0` — a true
  off-white at near-zero chroma (OKLCH ≈ 0.966 L / 0.005 C), not the warm-tinted
  cream band — and it is **diegetic material**, not a background tint: it has tooth,
  margins, ticks, a grid ghost, and the story is *about* it. Paper here is the
  medium the product lives on; identity-preservation and concept both hold.
- **Fonts:** the reflex-reject list caught Newsreader in the direction doc — replaced
  by **Vollkorn** (§14.4), procedure-picked for the voice words *hand-made,
  candlelit, dependable* (physical object: a picture-book colophon). The Hand is
  authored lettering (immune by construction); Cinzel is committed identity
  (docs/logo carved direction) with one job.
- **Bans swept:** no cards, no gradient text, no glassmorphism, no eyebrows, no
  numbered scaffolds, no hero-metric template, no side-stripes. The wordmark is the
  only display-scale type (≤450px wide, drawn — inside the ceiling's spirit).
- **Contrast:** tagline 15.9:1 · meta ≈8:1 · affordances ≥4.5:1 (`#5A544A` floor on
  paper) · whisper-state elements (grid, margin at 4%) are decorative-redundant,
  never sole information carriers.
- **Motion:** one orchestrated entrance (the brand-permission move), exponential
  ease-outs only, no bounce, every step skippable, reduced-motion = crossfades,
  no scroll-hijack — the handoff is scrub-tied, not stolen.
- **AI-slop verdict to beat:** a visitor should ask *"how was this made?"* — the
  answer the hero gives is literal: *watch, it makes itself.*

## 13. Performance, budget, fallbacks

- **Hero-critical payload ≤2.0MB:** island trilayer atlas ≤1.1MB (KTX2, paint +
  underdrawing packed together — the drain can never pop), goblin ≤550KB (shared
  with C1), inline lettering SVGs ≤45KB, moth/pencil ≤40KB. First paint <1s;
  composed ≤3.2s on 4G mid-tier; the film streams behind it per the experience doc.
- **Tiering:** low tier drops parallax, halves motes, statics the boil, keeps the
  seam and the shadow rule (the concept sheds garnish, never grammar).
- **The static poster is a first-class artifact:** the settled frame, baked at
  1200×630, becomes the OG image (§14.2), the Picture-Book fallback's first frame,
  and the press still. The composition must work printed — it is designed as a
  poster that happens to breathe.
- **No-WebGL / context-lost twice:** Picture Book path per the experience doc,
  opening on that poster.

## 14. Amendments to sibling docs (applied)

1. **Experience design §3 (Stage 0):** superseded by this doc — pointer note added
   there. Cover principles (paper-first, ~2-minute contract, absorb-slowness,
   skippable, returners' fast path) all carry forward into §8 here.
2. **Experience design §3 meta:** OG image is now the hero poster (the die-nudge
   frame remains the in-film share beat and press-kit second still).
3. **Experience design §5.2/§2 gearing:** 3.5% of total scroll is carved for the
   hero handoff from Stage 1's 14% (Stage 1 ≈ 10.5% remains; all other stages
   unchanged).
4. **Direction doc §4 typography:** Quiet Serif = **Vollkorn** (variable, true
   italic, self-hosted), replacing Newsreader (reflex-reject). Role unchanged.
5. **Experience design §5.4:** pointer-live surfaces are exactly two — the hero
   (pre-film) and the endcard; the film between remains pointer-dead.

## 15. Guardrails

Everything standing binds here: no hatching anywhere (the strata section is contour,
not hatch); painted textures gated on in-the-moment approval before any generation;
goblin v2 and locked copy untouched (the tagline reuse at the hero is new placement
of an approved line, flagged for sign-off); the art bible gets a **hero board**
(island card, seam study, pencil card, poster comp) before any build; impeccable
runs again on the built hero; nothing deploys or publishes; `story/` stays
uncommitted; build starts only after its plan is approved.
