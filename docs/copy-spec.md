# Copy, type & CTA spec — narrative/branding pass

Design decisions from the 2026-08-11 story/branding session. This governs every piece of
on-screen text, the two fonts, caption placement, and the closed-beta CTA. Supersedes the
caption list in `skeleton-spec.md` where they differ.

## Product truth (context for all copy)

Good Goblin is a **DM-first D&D helper**: map building (Inkarnate-class) + running the
table on those maps (Owlbear-class) + an asset-generation pipeline for tokens/map assets.
Characters and sourcebooks stay on D&D Beyond. Players play on it; the DM drives it.
The film speaks to players' shared memory ("one goblin always gets away") and reveals the
DM's backstage — the copy must land that the goblin works *for the DM*, and by the end,
*for every table*.

Closed beta = the Discord. One CTA, no waitlist, no backend.

## The script — full caption set

Placement: every caption sits in the lower-third band. Surfaces as today: white on
blackout, ink on paper.

| # | id | Line | Beat | Status |
|---|-----|------|------|--------|
| 1 | `open1` | Every campaign begins the same way… | cold open (black) | unchanged |
| 2 | `open2` | …and one goblin always gets away. | ambush | unchanged |
| 3 | `me1` | That was me. | freeze | unchanged |
| 4 | `me2` | You thought I ran away. | freeze | unchanged |
| 5 | `me3` | I did. | freeze | unchanged |
| 6 | `me4` | Straight to work. | freeze release | unchanged |
| 7 | `light1` | Someone has to light the world. | lighting-the-world run | **new** |
| 8 | `set1` | Your DM dreams it. I move the scenery. | theatre-set rotation | **new** |
| 9 | `welcome` | You're welcome. | dice scene exit | **retimed** |
| — | — | *(montage stays silent — visual beat)* | montage | decision |
| 10 | `pitch1` | I've built worlds for your DM for years. | cliff / world flattens | **new** |
| 11 | `pitch2` | Now I work for every table. | d20 throw | **new** |
| 12 | `endcard` | *(block, see below)* | board | **replaced** |

`nat1` ("Natural 1.") and `nat20` ("Natural 20.") are cut, including the late `nat20`
recap that used to sit at t64.4 — the die is close enough in both shots to read its own
faces, and naming the roll it's already showing was redundant with the shot.

`welcome` now lands right off the flip instead of after a long silent beat: its fade-in
starts at t47.3, the moment both are true — the die has finished tipping over to 20
(done by t44.25) and the world has actually resumed moving (the freeze's `timeScale`
tween runs t47–47.3). Landing the line there puts it on the beat it's reacting to. Hold
trimmed from 1.6s to 1.3s so the fade-out still clears before the montage's first hard
cut at t50.

The plain-text "GOOD GOBLIN" endcard caption is removed — it duplicated the drawn
wordmark.

## The endcard block

Replaces the `endcard` caption. Direction C — "lettered on the board": no box
anywhere. Not a card, not a wash, not a drawn border — the wordmark and copy sit
directly on the finished map, centered over it and the only pointer-events-enabled
surface on the overlay:

```
   [ Wordmark — GOOD / GOBL·IN, d20 interpunct ]

           The Dungeon Master's backstage.

     Build the maps. Run the table. The goblin
                does the rest.

               [ JOIN THE DISCORD ]
```

- **No ground.** There is no paper rectangle behind the type, no rotation on the
  stack as an object, no drawn border, no drop-shadow smudge. The stack itself is
  plain layout: centered at ~46–47% viewport height, width `min(92vw, 720px)` (88vw
  under 500px, to hold the phone gutter floor below).
- **Knockout instead of a box.** Since there's no card occluding the grid, the
  tagline and subline each carry their own per-glyph paper halo — a `.halo` class
  stacking eight `text-shadow` layers in `--paper` (four at 6px blur, four at 12px),
  the same knockout trick the wordmark's own stroke paint-order halo already relies
  on where it crosses the goblin. The grid must not read through any letterform, but
  there is no rectangle doing the work.
- Wordmark: `min(44vw, 450px)` desktop, `76vw` phone, its own paper halo unchanged.
- Tagline: "The Dungeon Master's backstage." — Metamorphous, upright, ink (#222),
  `clamp(1.2rem, 2.1vw, 1.55rem)`, margin-top 1.4rem desktop / 1.1rem phone.
- Subline: "Build the maps. Run the table. The goblin does the rest." — Metamorphous,
  smaller, muted (#444), `clamp(0.88rem, 1.4vw, 1rem)`, margin-top 0.45rem. One line
  on desktop; caps to two balanced lines on phone.
- **Rhythm.** Three tiers, not one even gap: wordmark to tagline is the largest;
  tagline to subline is tight, since they're one thought; subline to the button
  (margin-top 1.6rem) is the stack's other large gap, so the action stands apart from
  what sets it up.
- Button: "Join the Discord" — Cinzel 700, letterspaced caps. Opaque paper background,
  2px ink border, plus a second border offset 2–3px and rotated ~0.4deg at lower
  opacity behind it — a drawn-world object with a hand-redrawn line, not a rasterised
  rectangle. On hover, that offset line re-inks itself further off true (rotation
  steps from 0.4deg to 0.9deg) as the fill inverts. Links to `DISCORD_URL`, a named
  constant in `App.tsx` set to `#` until the invite link exists (owner: Nayan). Hover
  fills to ink / paper text.
- No feature list on the endcard. Detail lives in Discord.

### Entrance choreography

The stack letters itself onto the board over the timeline's last second-and-change
(t65.0–66, against a 66-long beat sheet), starting once the board fade (t64.5–65.1)
has registered so the type lands on ground that's already there. Everything is GSAP-
tweened on the same scroll-scrubbed timeline as the rest of the film — scrolling back
un-writes it, which is correct: nothing on this page plays itself. With no card and no
border there's no longer a first authored "draw" beat; the wordmark opens the
sequence instead.

Order, with overlapping staggers rather than a strict queue:

1. Wordmark: opacity 0→1 — the first thing to arrive.
2. Tagline: writes on left-to-right via `clip-path: inset(0 100% 0 0)` →
   `inset(0 0% 0 0)`, overlapping the wordmark's tail.
3. Subline: the same wipe, starting ~60% into the tagline's — the two read as one
   beat, not two.
4. CTA: the button (real border plus its offset second pass) fades and scales in as
   one object, then the label inks in a moment after — the last thing to arrive is
   the thing you're asked to do.

All eases are confident-deceleration (`power2.out`) — the same ease family the rest
of the film already uses for its settles. Full sequence settles by ~t65.72,
comfortably inside the 66-long beat sheet.

**Reduced motion:** the wipes become plain opacity fades at the same start times and
durations, and the CTA's scale drops out entirely rather than easing to a smaller
amount.

## Type system

Two roles, two faces, both self-hosted via `@fontsource` packages, no CDN:

- **Caption voice** (the goblin narrating): Metamorphous, upright. Replaces EB
  Garamond italic everywhere captions appear, including the endcard tagline/subline
  and the small controls (`#hint`, `#play`). Metamorphous ships weight 400 only, with
  no italic face — every one of those runs upright now; an italic anywhere in this
  family would come back as a synthesised oblique, which this spec treats as a hard
  failure, not a fallback. Caption size clamp came down a step from the EB Garamond
  values since Metamorphous sets noticeably wider and heavier per character.
- **Brand voice** (the CTA button only): Cinzel — Roman inscriptional capitals,
  matching the carved/engraved direction in `docs/logo/`. Nothing else on the page
  uses it.

## Caption placement

- All captions move from dead-center to a **lower-third band**: centered horizontally,
  baseline ~78% of viewport height, clear of the scroll hint (hint moves or hides while
  a caption is up if they collide).
- Must hold on phone aspect (release requirement): max-width and font clamp verified at
  390×844.
- The endcard block is the exception: vertically centered over the board.

## Out of scope

- Line-level wordsmithing beyond this set — lines can be revised ahead; the two flagged
  as least-sure are `light1` and the tagline.
- Art-pass button styling, audio, and the d20→board morph polish.
