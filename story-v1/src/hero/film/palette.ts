// COLOUR PASS — the film is painted now, by direction: the shapes were signed off in
// monochrome and every token here keeps its NAME and its VALUE HIERARCHY (what was
// darkest stays darkest, ink-dark tiers stay ink-dark, fire and snow stay near-paper)
// while gaining its hue. The register is COMMITTED storybook gouache — graded against
// painted D&D reference (deep enchanted-forest greens, ochre earth, indigo twilight,
// warm firelight against cool darks): the first two chromatic passes hedged pale and
// the whole film read as tinted graphite. This grade puts real pigment in the mids —
// the lights stay airy (the page rule holds) but a green is a green, a twilight is a
// twilight, and the goblin still owns the strongest chroma in any frame. The graphite
// ramp in curtain.ts can still drain any of these back to pencil; the freeze IS the
// payoff: behind the curtain the frame goes graphite and only the goblin keeps colour.
//
// V2 REWORK (direction doc §5): the spine below is the site-level palette — paper,
// ink, a graphite ramp, the amber alive-ramp, the goblin's green, the wordmark pip.
// New stage work names THESE tokens; everything under "v1 world palette" further down
// keeps its exact name and value so the shipped film renders pixel-identical while the
// stages migrate. Where a v1 name and a v2 token are the same colour, the v1 name is
// an alias of the v2 token rather than a second literal.

// ---- v2 spine — both states -------------------------------------------------------
// `paper`/`ink` also live in pencil.ts as PAPER/LINE (kept literal there so this file
// stays a leaf module with no imports); the four values are the committed tokens and
// must stay equal.
export const paper = 0xf7f5f0; // the page, the void, the sky's floor
export const ink = 0x222222; // contours, lettering, the wordmark

// Graphite ramp — underdrawing values between paper and ink. Near-zero chroma by rule:
// the direction doc's warm-bone drafts were adjudicated back to neutral (no
// cream/parchment drift; parchment warmth is the curtain shader's job, not a token).
export const tooth = 0xe8e5df; // paper-grain shadow, margin furniture
export const graphiteLight = 0xb9b6b0; // faint construction marks
export const graphite = 0x82807a; // underdrawing strokes, Prep midtone
export const graphiteDark = 0x4a4844; // heavy graphite, near-black accents

// ---- v2 alive ramp — the only colours allowed to glow -----------------------------
export const amber = 0xf2c35e; // life, touch, fire, the nudged die, the lit CTA
export const amberLantern = 0xe8963e; // lantern glass tier
export const amberEmber = 0xc75b2a; // ember tier (v1 `ember` below predates this ramp)
// The Performance key LIGHT's hue (hero §5's "#FFEACC family") — a light colour, not a
// glow: the amber-only glow gate is untouched by it. Promoted from a doc-named literal
// in stages/rigs.ts so the value has one home.
//
// THIS IS THE COVER'S KEY AND THE INTERIOR'S KEY, and it does not move. The hero
// shipped and was accepted under it (§4.7.6), and S5's tavern is lit by a hearth, which
// SHOULD be warm. Everything below is the film's own, per chapter family.
export const keyWarm = 0xffeacc;

// THE KEY IS A PER-CHAPTER-FAMILY COLOUR (client ruling, 2026-09-05), exactly as its
// AZIMUTH already is (world direction §8's coherence rule: three families, three
// azimuths). Both values below are SOLVED against the film's own rig — `Film.tsx`'s
// hemisphere `#CDD9E8/#8A7458` at 1.45 over the same 2.2 key — not against the kit rig
// §4.7 was first measured on, and both are blends of committed tokens (§4.5), never a
// fresh hue. `KEY_I` is untouched in both: §5.5 pins the key's intensity, so a family
// that wants a demoted key gets it through the colour's own luminance.
//
//   G(n) = ( mix(ground, sky, 0.5·n.y+0.5)·HEMI_I + key·KEY_I·max(0, n·k) ) / π
//
// EXT-DAY — `mix(keyWarm, paper, 0.69)`. Solved from that identity for R−B = 0 on a
// WHITE albedo on an UP-facing surface, in the linear mix domain: the film's fill is
// cool and twice the hero's, so the key has to give back exactly `HEMI_I·(sky_B−sky_R)
// / (KEY_I·n·k)` = 0.166 of red-over-blue and no more. Measured across every camera
// elevation the film actually uses (n·k 0.72 → 0.94) it holds |R−B| ≤ 2/255.
export const keyDay = 0xfaf2e6;

// EXT-NIGHT — `mix(keyWarm, skyDusk, 0.59)`. The moon carries no warmth of its own:
// solved for key R−B = 0 exactly, so every warm pixel in a night frame comes from the
// fire the goblin lit (the lantern ledger, world direction §8) and from nothing else.
// Its luminance lands at 0.52× the day key, which is the world direction's demoted
// `KEY_I_NIGHT` delivered through hue instead of intensity. An up-facing white then
// reads −13/255 cool — the chapter's indigo air doing that work, not the key.
export const keyNight = 0xbbb2bb;

// THE FILM'S FILL — the two halves of `Film.tsx`'s hemisphere, promoted out of that
// file's inline args so the transfer probe and the rig read one value (`FILM_RIG` in
// stages/rigs.ts). Light colours, like the keys above, not surface tokens: nothing may
// paint with these. They are NOT the cover's fill — `rigs.ts` keeps `skyDay` over
// `earthTrack` at HEMI_I 0.8, and `rigs.check.ts:97` holds these two out of that rig by
// name. The film's is cooler and nearly twice as strong, which is the whole reason the
// film's key had to be re-solved rather than inherited.
export const fillSky = 0xcdd9e8; // cool sky fill — the air the film's forms sit in
export const fillGround = 0x8a7458; // warm earth bounce under it

// ---- v2 goblin + brand ------------------------------------------------------------
export const goblinGreen = 0x84a058; // his sage skin; green belongs to him alone
export const wordmarkPip = 0xb6d648; // marketing-only: the wordmark's d20 pip, nothing else

// ==== v1 world palette — values frozen, aliased into v2 where they coincide ========

// Sky / fog — one per chapter, tweened chapter to chapter by timeline.ts. A chapter
// mood is a real atmosphere now: distance fades into coloured air, not pale haze.
export const skyDusk = 0x6d78ae; // C1 — night camp (real indigo twilight, darkest wash)
export const skyDay = 0xaccde6; // C2 — the run (committed morning blue)
export const skyOvercast = 0xaab6c0; // C3 — theatre
export const skyHearth = 0xd4b184; // C4 — tavern interior (deep amber)
export const skyVellum = 0xeee6d2; // C5 — montage void
export const skyDawn = 0xe6c1a2; // C6 — cliff (committed peach dawn)
export const skyBoard = 0xf7f5f0; // C7 — returns to paper

// Grounds — real temperature in the mids; big areas keep one value step of air above
// the accents so the page still breathes, but earth is ochre now, not oat milk
export const earth = 0xc2a97e;
export const earthTrack = 0xa8875c;
export const grass = 0x94b164;
export const grassDeep = 0x6f9349;
export const snow = 0xf2f2ec;
export const stoneCool = 0x8792a6;
export const stoneWarm = 0xa9967a;
export const rockFace = 0x878b7a;
export const caveDark = 0x3f3226; // ink-dark tier (deep umber, not black)
export const water = 0x679fb4;
export const floorboard = 0xb98e52;
export const platformDisc = 0xcfc0a0;

// Foliage — deep storybook greens off the enchanted-forest reference boards; the deep
// tier holds a genuine dark against paper, exactly the bible's three value steps
export const canopy = 0x678e42;
export const canopyDeep = 0x466f33;
export const needle = 0x4c7350;
export const undergrowth = 0x87945e;
export const moss = 0x8ba05e;

// Wood
export const timber = 0x94795a;
export const timberDark = 0x6a5138;
export const plank = 0xa9895e;

// Fire and warm light — the light sources are the palest things on the page, and they
// are unambiguously WARM: gold against the cool washes, the reference boards' one
// constant. `rayGold` is still the only stroke colour that is not ink: antique gold,
// so drawn light reads lighter-handed than drawn matter.
export const flameCore = 0xf7efd2;
export const flameBody = 0xf4cc70;
export const ember = 0xe89544;
export const rayGold = 0xa88e3e;
export const lanternGlass = 0xf2e2b4;
export const candle = 0xf4e8c8;

// Cloth
export const cloakIndigo = 0x4d5a9e;
export const cloakCrimson = 0x9e3d2c;
export const bedroll = 0xb5a084;
export const tavernCloth = 0xac9570;

// Metals
export const brass = 0xb0913f;
export const iron = 0x7d8590;
export const gold = 0xcda43e;
export const steel = 0xb1bac2;

// ---- THE GOBLIN — this block is the ONE ownership statement for his colour ---------
//
// SETTLED 2026-09-03 by docs/2026-09-03-goblin-design.md §4, which adjudicated three
// signed sources that disagreed (the rust-tunic comment that used to sit here, the
// one-cloak/olive decision at world.ts + gobHood, and hero-design.md §4's "loudest
// chroma"). Nothing re-litigates this from those sources: they are rationale now.
//
// HE OWNS VALUE, AND THE FRAME'S ONE COOL HUE. He wears theatre blacks — a stagehand
// dresses dark and non-reflective so he disappears against the set, which is his job
// description and the argument the palette was missing. The world is warm green and
// ochre on paper; the colour missing from it is a cool dark. His CHROMA is small, warm
// and inside that cool dark: the sage skin and the two amber eyes.
//
// Rust died on merit, not on a citation: gobTunic 0x9C3A22 measures 0.303 encoded luma
// against the rendered pine crown's 0.314 — it fails the separation gate by 0.011 —
// and a rust figure on an ochre path is camouflage. Olive died because he became a
// third tree (measured cloak-vs-crown delta 0.012, gate wants ≥ 0.12).
//
// CALIBRATION KNOB. If gate P1 fails on a live walk, the knob is gobCloak's value and
// the range is 0x2E3742 → 0x272E37 (luma 0.211 → 0.175). NEVER below 0x232830 (0.152):
// under that he is within 2/255 of ink and reads as a hole, not a garment. Move
// nothing else.
export const gobCloak = 0x272e37; // 0.211 — cool slate. No other object in the world may take this value band.
export const gobCloakWorn = 0x59626b; // 0.379 — the SAME cloth worn pale: mitts, cuffs, boots. A value tier, not a fourth hue.
export const gobSkin = goblinGreen; // 0.600 — sage-olive; green belongs to him alone by palette law
export const gobEarInner = 0x5c7a2e; // 0.430 — inner ear, AND the nose (skin-on-skin measured 3 % visible)
export const gobSatchel = 0xb08d55; // 0.550 — the ONE warm patch, capped at 12 % of his silhouette area
export const gobTooth = 0xf0ede4; // 0.930 — the fang nub
export const gobEye = amber; // 0.770 — unlit; the eyes and nothing else on him carry amber
// Retired from his build (§4.2) and kept only as exports because pencil.ts's
// QUIET_PIGMENT set and the v1 world still name them. `buildGoblin` references none of
// them, and gate G9 keeps it that way.
export const gobSkinLit = 0xa9c47e;
export const gobTunic = 0x9c3a22;
export const gobTunicShade = 0x64281a; // ink-dark tier
export const gobBelt = 0x7d5c3a;
export const gobHood = 0x687452; // the old moss cowl

// Specials
export const dieBone = 0xece2ca;
export const monsterHide = 0x8b6d47;
export const ravenSlate = 0x464c58; // ink-dark tier
export const mushCap = 0xb03c22; // the storybook red cap
export const boardFill = 0xf0ede4;
