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
// `paper` (#F7F5F0) and `ink` (#222222) are not redeclared here — they already live in
// pencil.ts as PAPER/LINE, and that is the single source for both.

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

// The goblin — the focal chroma of the film: lively olive-green skin under a
// committed rust tunic; the tunic stays the darkest mass in every frame, exactly as
// the value hierarchy demands. He is the one thing that keeps these colours behind
// the curtain, so his palette is pitched a step louder than the world's.
export const gobSkin = 0x84a058; // sage-olive off the reference sheet, calmer than the old lime
export const gobSkinLit = 0xa9c47e;
export const gobTunic = 0x9c3a22;
export const gobTunicShade = 0x64281a; // ink-dark tier
export const gobBelt = 0x7d5c3a;
export const gobSatchel = 0xb08d55;
export const gobTooth = 0xf0ede4;
export const gobHood = 0x687452; // deep moss cowl — dark against the skin so the face pops
export const gobEarInner = 0x5c7a2e; // inner-ear shadow, darker olive than the skin
export const gobEye = 0xf2c35e; // the huge amber lantern eyes — his chroma signature now that the cloak is olive

// Specials
export const dieBone = 0xece2ca;
export const monsterHide = 0x8b6d47;
export const ravenSlate = 0x464c58; // ink-dark tier
export const mushCap = 0xb03c22; // the storybook red cap
export const boardFill = 0xf0ede4;
