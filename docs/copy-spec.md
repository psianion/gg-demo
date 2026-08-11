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
| 9 | `nat1` | Natural 1. | dice scene | unchanged |
| 10 | `nat20` | Natural 20. | dice scene | unchanged |
| 11 | `welcome` | You're welcome. | dice scene exit | unchanged |
| — | — | *(montage stays silent — visual beat)* | montage | decision |
| 12 | `pitch1` | I've built worlds for your DM for years. | cliff / world flattens | **new** |
| 13 | `pitch2` | Now I work for every table. | d20 throw | **new** |
| 14 | `endcard` | *(block, see below)* | board | **replaced** |

The plain-text "GOOD GOBLIN" endcard caption is removed — it duplicated the drawn
wordmark.

## The endcard block

Replaces the `endcard` caption. Centered block over the board, the only
pointer-events-enabled element on the overlay:

```
        [ Wordmark component — GOOD / GOBL·IN, d20 interpunct ]

                 The Dungeon Master's backstage.

     Build the maps. Run the table. The goblin does the rest.

               [ JOIN THE CLOSED BETA — DISCORD ]
```

- Tagline: "The Dungeon Master's backstage." — EB Garamond italic.
- Subline: "Build the maps. Run the table. The goblin does the rest." — EB Garamond
  roman, smaller.
- Button: "Join the closed beta — Discord" — Cinzel, letterspaced caps, drawn-border
  style consistent with the pencil world. Links to `DISCORD_URL`, a named constant in
  `App.tsx` set to `#` until the invite link exists (owner: Nayan). Hover treatment
  (die spin / border redraw) is reserved for the art pass — ship a plain hover state now.
- No feature list on the endcard. Detail lives in Discord.

## Type system

Two roles, two faces, both self-hosted (woff2 in `story/public/fonts/`, `@font-face` in
`styles.css`, no CDN):

- **Caption voice** (the goblin narrating): EB Garamond italic. Replaces Georgia
  everywhere captions appear. Size/tracking as today unless it fights the band.
- **Brand voice** (endcard subline aside, anything brand/CTA): Cinzel — Roman
  inscriptional capitals, matching the carved/engraved direction in `docs/logo/`.

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
