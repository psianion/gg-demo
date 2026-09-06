# Asset contract — hand-lettering and hero board

**AMENDED 2026-09-02 (Nayan, mid-build):** there is no art bible for v2 and no external
sign-off gate — only the vision and the story/narrative carry over from v1; the visual
design is the v2 build's to author. The build designs and produces the real artwork
itself (authored SVG lettering, the hero composition, the drawn wordmark), per the v2
spec docs. Statuses below: `to author (P<n>)` — the named stage designs the final asset;
`authored` — designed in-build; `final` — held a ★ browser review.

## Hand-lettering

The Hand is authored lettering, not a font: stroke SVGs in the same hand as the wordmark,
which write on stroke-by-stroke and un-write on reverse. Copy is verbatim from
`copy-spec.md` — the lettering may never restate or reword a line.

| slot | copy (locked) | beat | status |
|------|---------------|------|--------|
| `open1` | Every campaign begins the same way… | cold open | to author (P6) |
| `open2` | …and one goblin always gets away. | ambush | to author (P6) |
| `me1` | That was me. | freeze | to author (P6) |
| `me2` | You thought I ran away. | freeze | to author (P6) |
| `me3` | I did. | freeze | to author (P6) |
| `me4` | Straight to work. | freeze release | to author (P6) |
| `light1` | Someone has to light the world. | lighting-the-world run | to author (P6) |
| `set1` | Your DM dreams it. I move the scenery. | theatre-set rotation | to author (P6) |
| `welcome` | You're welcome. | dice scene exit | to author (P6) |
| `pitch1` | I've built worlds for your DM for years. | cliff / world flattens | to author (P6) |
| `pitch2` | Now I work for every table. | d20 throw | to author (P6) |
| `tagline` | The Dungeon Master's backstage. | hero + endcard | to author (P6) |
| `wordmark` | GOOD / GOBL·IN (d20 interpunct) | hero + endcard | authored (P4: hero treatment in HeroWordmark.tsx — the committed carved-caps lockup with ears, plus the brand-green pip on the die by palette token; P6 may unify further with the lettering hand) |

Eleven narration captions plus the endcard tagline make the twelve lettered lines; the
wordmark is a separate drawn asset reused at the hero and the endcard.

## Hero board

The hero design deliverables — settled by the P4/P5 hero build itself (the hero doc is
the shot spec; the build authors the final look).

| slot | what it settles | status |
|------|-----------------|--------|
| `island-card` | the hero island's form and silhouette — elliptical card (5.2×3.6) over a SOLID lathe skirt (P4c: three vertically-overlapping closed lathe bands, earth lip / darkened stone shelf / caveDark keel to a drip point, DoubleSide — the P4b open cylinders read hollow), ink section lines on the painted skirt + graphite ones on the drawn side, feather at anti-aliasing width with a painted rim ring, bent 3-segment tapering roots + a dangling pebble at the NEAR rim, and a drawn rim contour whose unfinished gap spans the whole graphite rim (stages/hero.ts) | authored, verified at P4d — the silhouette is the poster's strongest asset: the skirt is solid at every breakpoint (no paper through the rim), the three strata bands read at framing, the rim contour registers 2–4 screen px off the paint edge, and the painted trailing root reads as a bent tapering root. Two honest gaps: the caveDark keel is still a smooth airbrushed mass carrying ~4 pale section scratches, and the graphite-side root takes the drawn half's row field and reads as a striped stick (FINDINGS P2-T1, P4d-T1). walks/p4/p4d-verify-roots-underside-zoom4x-1440x900.jpg. **P4e re-verified at all four shipped framings:** the skirt is still solid (no paper through the rim anywhere), the three strata bands still read, and the graphite-side root and skirt now carry the authored stroke field — the striped-stick read is CLOSED. The keel reads as the island's dark underbelly at framing; under magnification the painted-side drip point is still a smooth Lambert mass carrying sparse pale section marks, which is the one half of P2-T1 left open |
| `seam-study` | the graphite/paint seam — rig.seamX 1.0 / seamW 0.2 (a worked edge, not a wash) with a three-octave wobble (rig.seamWob 0.75), a granular drybrush frontier at dither 2.2 (P4c: paint breaks STRAIGHT into strokes — the old half-mixed band walked as a blank bleached strip), a dried tide-line at the leading edge plus the broader pooling band; the island shadow splits per half by the same uniforms. P4d replaced the isotropic per-pixel dither with ANISOTROPIC dab noise — sampled 26/unit across × 5/unit along the ground brushwork's own flow, amplitude 2.6, plus a fine ragged octave | authored — the round's cleanest win. Verified at 1440×900 zoom: the paint breaks into elongated directional dabs ~15–30 screen px long with white islands biting back into the green, reading as drybrush at its frontier rather than speckle; the dead band stays closed and the parked seam is untouched by construction. walks/p4/p4d-verify-goblin-seam-zoom4.6x-1440x900.jpg. RE-VERIFIED at P4e (no regression): at 3× along the near rim the paint still breaks into elongated directional dabs with white islands biting back into the green, and the drawn half beyond it now answers with authored strokes rather than rows — the frontier is the strongest square inch in the frame |
| `pencil-card` | the carpenter's pencil as a drawn object — flat cedar body, whittled dieBone collar, flat-worn graphiteDark core, thumb-notch score; sketch()-built, markAlive'd, 1.9× in the mitt and staged in the goblin's near-profile working reach so it silhouettes against the path (stages/hero.ts buildPencil / stageGoblin) | authored as geometry, does not read as a prop at the shipped framing — measured at 1440×900 the whole pencil projects to roughly 20 × 5 screen px and renders as a brown lozenge lying near the goblin's feet; body, collar, graphite core and thumb notch are all sub-pixel. The jewel-tier prop hero §4 asks for is not on screen. FINDINGS P4d-T6; walks/p4/p4d-verify-goblin-seam-zoom4.6x-1440x900.jpg. **P4e**: recoloured to a two-value object (timberDark body, pale dieBone whittle collar, graphiteDark tip), weighted to `form`, and stepped 1.9→2.3. Re-measured live at 1440×900 it projects 53×17px (88×31 including its own cast shadow) — from 20×5. At 10× it reads as a slender shaft with a dark point held out over the drawing; at the shipped framing it is a brown stroke in the mitt, so §4's jewel-tier prop is still carried by the arm gesture rather than by the object. Improved, not delivered — FINDINGS P4d-T6, walks/p4/p4e-verify-goblin-seam-zoom6x-1440x900.jpg |
| `poster-comp` | the hero composition at rest — projection-solved via compFor/heroFraming (island 58vw≤900px at 54vh, centre x 46vw; brand block in the upper-left paper field at landscape; portrait 92vw margin-capped, centre 56vh sinking aspect-aware on short/narrow windows; azimuth +18°/+24°, a ledgered supersession of §3's −18 — FINDINGS P4c-T1; goblin left third-line, lantern right third-line at 1440, frac-compressed thirds pinned ±0.035 at 1920; type contrast measured ≥8.4:1 per breakpoint). P4d: px cap 900→1040 with a cap-bite centre ease, and RIM_OVERHANG 1.045 so the portrait caps solve the RENDERED extent — walks/p4/p4d-verify-* | authored at landscape, TWO breakpoints open. Re-measured live: 1440×900 lands the authored comp exactly (island centre 46.0vw / 54.0vh, goblin 34.6vw, lantern 69.2vw, tagline 14.6:1, meta 8.37:1, affordance 6.49:1, 0% of type pixels below 4.5) and 500×915 is clean (89.8vw, 20/31 px gaps, pine clear of the type). 1920×917 rebalances horizontally as intended (400/429 px gaps) but the taller island runs off the BOTTOM edge — FINDINGS P4d-T3. 768×917 holds the margin (90.4vw, 24/50 px) but the painted pine crosses the wordmark's "N" — FINDINGS P4d-T4. 390 remains solver-only (P4-T3). P5 bakes the OG still. **authored at every breakpoint after P4e** (measured live off the canvas with a forced-synchronous render): 1440×900 lands the authored comp exactly — centre 0.460/0.540, opaque span 58.0vw, gaps 230/375/152/64–71px against a 36px margin; 1920×917 sheds the px cap to a height-aware 45.8vw and clears the bottom by 51px (P4d-T3 closed); 1600×800 clears by 46px; 768×917 sinks to cy 0.709 at 68.4vw with 82px of air under the wordmark (P4d-T4 closed); 500×915 sits at 88.6vw with 23/34px side gaps and the bloom now inside the margin. Type re-sampled at every one of them: wordmark 14.6:1, tagline 14.6:1, meta 8.62:1, affordance 5.36–8.37:1, 0% of any box below 4.5:1 and 0% canvas overlap on the three brand lines. Two open comp notes for the ★ review: the scroll affordance overlaps the trailing root (P4e-T4) and the soft drop-shadow tail reaches the page edge at ≤11% alpha (P4e-T6) |
