import * as THREE from 'three';
import { buildIsland, type Island } from './islandKit.ts';
import { createTrilayer, rig } from './trilayer.ts';
import { createRigs, type Rigs } from './rigs.ts';
import { markAlive } from '../curtain.ts';
// The rig contract, straight from the module that OWNS it. world.ts re-exports all five
// of these (`export * from './rig.ts'`) and reading them through it used to be
// harmless — until the film's own sets/kit.ts started calling the mock kits, which
// import HERO_AZ from this file. That closed the loop
//   world.ts → sets/ambush.ts → sets/kit.ts → mock/marksKit.ts → stages/hero.ts → world.ts
// and an import cycle through a module that runs work at eval time hands the far side
// bindings still in their temporal dead zone: the film mounted to a blank page with no
// error in the console. world.ts's own header says rig.ts exists so a module can take
// the contract "without importing this file back". This is that. No value moves.
import { applyPose, setGoblinRim, GOB_RIM_PX, REST, type Goblin } from '../rig.ts';
// THE FIGURE IS THE REBUILT ONE (docs/2026-09-03-goblin-reference.md, and the client's
// acceptance of the study). world.ts's `buildGoblin` still builds the film body's
// puppet — that module is the next round's work — but nothing on the COVER comes from
// it any more.
import { buildGoblin } from './goblin.ts';
import { sketch, paint, polyline, roughen, weight } from '../pencil.ts';
import * as P from '../palette.ts';

// THE HALF-ALIVE ISLAND (hero doc §1–§5, P4) — the arrival scene, static.
//
// One island of the C2 path world floats on the page, half painted gouache, half
// graphite underdrawing, and the goblin stands at the seam with a carpenter's pencil,
// caught making it. The seam is rig.seamX by identity — the same cut the trilayer,
// the island drop shadow and the rigs already share — so both halves are one draw,
// one material state, split per fragment.
//
// AXES. The seam is a world-x cut: painted = x < SEAM_X, graphite = x > SEAM_X (the
// trilayer's smoothstep rises with +x). The camera sits on the -z hemisphere, which
// puts world +x on SCREEN LEFT — graphite owns screen-left. The azimuth is POSITIVE
// (camera on the +x side): that tilts the constant-x seam line so graphite holds MORE
// of the frame at the bottom than at the top — hero §2's diagonal, graphite lower-left
// and painted upper-right. (A negative azimuth produces the same left/right split but
// the OPPOSITE diagonal — the P4 verify round caught exactly that.)
//
// MATERIAL FAMILIES, deliberate: surfaces the seam can cross (the ground card, the
// strata skirt, every graphite-side prop) are trilayer — they must know how to be a
// drawing. Props that live entirely in painted territory (lantern, signpost,
// mushrooms) are pencil-vocabulary sketch() objects — drawn ink contours over lit
// gouache fills, the film's own prop language. The two families ARE the two truths;
// the seam decides which one a square inch of the island speaks.
//
// Node-safe: geometry and staging build headless (the checks assert the staging
// rules); the canvas-baked albedos guard on `document` and fall back to flat fills.

const DEG = Math.PI / 180;

// ---- the shot (hero §2, §3) -------------------------------------------------------
export const ISLAND_RX = 2.6; // half-extents, world units (~5.2 x 3.6 island)
export const ISLAND_RZ = 1.8;
export const SEAM_X = 1.0; // the work edge — his progress so far; the goblin (x .95)
// stands at its leading edge ON the left third-line (hero §2's comp)
export const GOB_SCALE = 0.75; // world units tall — see the decision at stageGoblin
export const SEAM_W = 0.2; // a worked EDGE, not a wash — the wobble + the shader's
// granular frontier carry the irregularity; a wide band read as plain falloff
export const SEAM_WOB = 0.75; // hero §4: irregular bloom boundary, never a ruler cut
export const HERO_FOV = 32; // FIXED — no FOV tweens ever (motion §10)

// DECISION (P4c, supersedes hero doc §3's "azimuth −18°" — ledgered as a FINDINGS row
// flagged for the P5 ★ review, never only a check pin): the doc wants BOTH −18° and
// §2's diagonal (graphite lower-left). With the shipped seam architecture those are
// mutually exclusive: the seam is a world-x PLANE shared by identity across the
// trilayer, the island drop shadow and the rigs, so its on-screen tilt is set by the
// camera azimuth alone — at −18° the diagonal flips (graphite upper-left; the first
// P4 build shipped −18 and the verify round measured exactly that). The free variable
// §2 names, "its long axis rotated", tilts only the ELLIPSE: rotating the card alone
// breaks the baked path's registration with the staged goblin, and rotating the whole
// staging group moves every prop through the fixed world-x cut, un-deriving the seam
// staging, the caster throw math and the third-lines. +18° delivers the doc's stated
// OUTCOME (the diagonal is the thing §2 argues for) with the architecture as built.
// The two shot angles live in ../heroView.ts — a leaf with no imports — so the mockup
// kits can take the view basis without dragging this module (and the goblin, and
// actions.ts, and world.ts) into the film's own import graph. Re-exported here, so
// every existing `from './stages/hero.ts'` reads the same two numbers it always did.
import { HERO_AZ, HERO_ELEV } from '../heroView.ts';
export { HERO_AZ, HERO_ELEV };
// G6 — 24° → 18°, and it is the CAMERA that moves because the camera is what was wrong.
//
// The gate is the angle between his face plane and the him→camera ray, band 40–48°. The
// face normal is identical at all four breakpoints; the readings were not (35.1 / 35.9 /
// 37.0 portrait against 47.5 landscape), so the 12.4° spread was never the pose — it was
// this constant plus heroFraming's own `look` walk. §3.4 forbids rotating HIM ("Root
// stays 1.60… no fallback stage") and says nothing about the portrait azimuth, so this is
// the one free variable, and the previous round tabled exactly this remedy and did not
// take it. Swept against the live gate:
//
//   24° → 35.1 / 35.9 / 37.0 / 47.5   (three fails, the shipped reading)
//   21° → 38.1 / 38.8 / 40.0 / 47.5   (two fails)
//   19° → 40.0 / 40.8 / 41.9 / 47.5   (passes, on the boundary)
//   18° → 41.0 / 41.8 / 42.9 / 47.5   (passes; span 41.0–47.5, centred on 44.25)
//
// 18° centres all four in the band instead of clearing it by a rounding error. §2's
// "the seam re-aims steeper, portrait" survives where it is actually authored — the
// portrait comp (COMP.frac 0.92, the cy sink) is untouched, and that is what re-aims the
// composition; the azimuth was carrying an intent the comp already delivers.
export const HERO_AZ_PORTRAIT = 18 * DEG;

// The authored comp (hero §2, §7) — the numbers the camera solve is fitted to, by
// projection, not approximation. Fractions of the viewport; centre = the island's
// world origin on screen.
export const COMP = {
  frac: { landscape: 0.58, portrait: 0.92 }, // island share of viewport width
  // DECISION (P4d, FIX: wide-desktop dead paper — hero §7's spirit over §2's letter):
  // at ≥1800w the old 900px cap left ~28% of the frame as dead paper right of the
  // island. Rebalanced with BOTH knobs §7 allows: the cap rises to 1040px (the island
  // is the poster's subject, not a vignette) and the centre eases toward the frame's
  // middle as the cap bites (see compFor) — the leftover paper splits more evenly
  // while 1440×900 keeps the authored 58vw/0.46 comp untouched.
  maxPx: 1040,
  centerX: { landscape: 0.46, portrait: 0.5 }, // authored: shifted left so the goblin
  // lands the left third-line and the lantern the right (hero §2's diagonal pair)
  // Landscape centre y is the doc's 54vh. Portrait SUPERSEDES the doc's 48vh (P4c,
  // ledgered): at 48vh the brand block (72vw wordmark at 9vh + tagline + meta) lands
  // on the island's far grass at tablet portrait and the bottom 40% of the frame is
  // empty paper — the island drops so the type owns the top paper field and the
  // island the lower body of the page.
  centerY: { landscape: 0.54, portrait: 0.56 },
};

// P4d (FIX: rendered extent): the island RENDERS wider than its rim solve — the
// strata lip (r 1.012), roughen bumps, the rim mark's jitter and stroke overshoot
// add ~4.5% to the projected rim span (measured live at 768×895: 94vw rendered
// against a 92vw rim solve, 8px from the viewport edge). The margin rule is
// absolute, so portrait caps the RIM frac such that rim × RIM_OVERHANG honours
// both the 92vw share and the drawn page margin with air.
export const RIM_OVERHANG = 1.045;

// P4e (FIX: P4d-T3): the island's rendered extent BELOW its centre — strata keel plus
// the trailing roots — as a fraction of its rendered width. Measured live: 0.423 at
// 1440×900 (353px under an 835px span, taken at 0.43 for the roughen swing) and 0.448
// at 768×917 — the portrait lens's steeper +24° azimuth projects the roots deeper, so
// the two aspects carry their own measured number. The bottom rule (hero §2 "nothing
// touches the viewport edge" + direction §6's absolute margin) solves with this at
// EVERY aspect; the raw 1040 cap ran the roots off the bottom of 1920×917 (an
// ordinary 1080p screen with browser chrome).
export const BELOW_FRAC = { landscape: 0.43, portrait: 0.465 };
// the painted pine's tip above the island centre, same units — the tallest rendered
// content (its drawn zigzag tip stroke included), so clearing it clears the rim and
// every crown by construction. MEASURED at the portrait lens, not modelled: the old
// analytic 0.336 was ~60px short at 768×917 (the +24° azimuth and the framing
// solve's look-walk both lift the tip); the walk measured 0.442 of the rim span.
const PINE_TIP = 0.45;

/** The authored comp for a viewport — frac/centre the camera solve is fitted to.
 * Portrait caps the island's 92vw RENDERED extent (rim × RIM_OVERHANG) so nothing
 * of the island — feather, lip, outboard marks — crosses the drawn page margin
 * (direction §6's absolute rule: margin clamp(18px, 2.6vw, 36px) + breathing room). */
export function compFor(width: number, height: number) {
  const portrait = width / Math.max(1, height) < 1;
  const margin = Math.min(36, Math.max(18, 0.026 * width));
  let frac: number;
  let cy = portrait ? COMP.centerY.portrait : COMP.centerY.landscape;
  if (portrait) {
    // aspect-aware solve (P4e generalises the P4d width<560 gate — the hole P4d-T4
    // fell through: at 768 the painted pine grew into the wordmark). The brand block
    // stacks in px from 9vh while the island's extents are width-driven, so the
    // island SINKS until the pine tip clears the type with air, and SHRINKS when the
    // window is too short to also keep the keel + roots off the bottom margin (the
    // flat 0.64 centre cap this replaces ran the island off the page instead).
    const wordmarkH = Math.min(0.72 * width, 420) * (490 / 800);
    const typeBottomPx = 0.09 * height + wordmarkH + 56; // + tagline & meta rows
    frac = Math.min(
      COMP.frac.portrait / RIM_OVERHANG,
      (width - 2 * (margin + 4)) / width / RIM_OVERHANG,
      (height - typeBottomPx - 24 - margin - 8) / ((PINE_TIP + BELOW_FRAC.portrait) * width),
    );
    cy = Math.max(cy, (typeBottomPx + 24 + PINE_TIP * frac * width) / height);
    cy = Math.min(cy, (height - margin - 8 - BELOW_FRAC.portrait * frac * width) / height);
  } else {
    frac = Math.min(
      COMP.frac.landscape,
      COMP.maxPx / width,
      // height-aware term (P4d-T3): short landscape windows pull the cap back down
      // so the rendered island — roots included — always clears the bottom margin;
      // 1440×900 (0.598 head-room) and 1920×1080 keep their authored/capped comps.
      (height * (1 - cy) - margin - 8) / (BELOW_FRAC.landscape * width),
    );
  }
  return {
    portrait,
    frac,
    // landscape centre eases toward the frame's middle as the px cap bites (the
    // COMP.maxPx decision above): 0.46 at the authored 58vw comp, recovering the
    // capped share, never past frame centre — 1440 is untouched, ~1920 lands ≈0.498
    // (measured: dead paper right of the rendered island 29.7% → 24.3%).
    cx: portrait
      ? COMP.centerX.portrait
      : Math.min(0.5, COMP.centerX.landscape + (COMP.frac.landscape - frac)),
    cy,
  };
}
// The key: ~35° elevation from the lantern side (hero §5) — the rigs.ts default parks
// at 50.2°, restaged here for this shot. From (-x,-z): the goblin's shadow throws
// toward +x, across the seam, onto the drawing — the one crossing. The z is as deep
// as the x (tuned live, P4 fix round): with the positive-azimuth camera on the +x
// side, a shallower key lit only his back and he read as a silhouette.
export const KEY_POS = new THREE.Vector3(-4, 3.95, -4);

// The lantern's berth (P4c, FIX: the lamp must read LIT). At the old far berth
// (-1.85, -0.3) the glass head sat directly against the painted pine's dark cone from
// the +18° azimuth — a lit lamp against a dark canopy is a dark lamp. Restaged to the
// NEAR rim: from the shipped lens the head now silhouettes against its own painted
// pool and open grass, with paper past the rim — and the closer berth buys the prop
// ~20% more screen height. Still the right third-line's anchor (hero §2), still x<0
// with every warm source (P3-T2).
// (P4d: z −1.0 → −1.18 — from the shipped lens the pine's lowest skirt corner still
// clipped the glass head's top-left; a near-step clears the whole head onto its own
// pool and open paper. The right-third projection moves ~0.005vw — inside the pin.)
export const LANTERN_POS = new THREE.Vector3(-1.7, 0, -1.18);

// Painted-world casters (P3-T2/P3-T4 staging rules): ONLY props whose full shadow
// throw stays clear of the seam band register with the rig. Everything else grounds
// through a painted contact blob in the albedo bake (P3-T5 — a miniature painter's
// craft, not a lighting hack). scripts/hero.check.ts asserts the throw math.
export const CASTERS: { x: number; z: number; height: number }[] = [
  { x: -0.95, z: -1.0, height: 1.25 }, // the painted oak, near-right foreground
  { x: -2.2, z: 0.8, height: 1.6 }, // the painted pine, far right by the rim
  // (P4c: its tiered crown no longer matters to the lamp — the lantern left its
  // shadow for the near rim; heights track the lobed/tiered rebuild)
];

/** Horizontal x-reach of a caster's shadow tip under the restaged key. */
export function shadowReachX(x: number, height: number): number {
  const horiz = Math.hypot(KEY_POS.x, KEY_POS.z);
  const el = Math.atan2(KEY_POS.y, horiz);
  return x + (height / Math.tan(el)) * (-KEY_POS.x / horiz);
}

// ---- framing (hero §2, §7) --------------------------------------------------------
//
// CONSCIOUSLY SUPERSEDES framing.ts. That contract holds the film's authored 42°
// horizontal field and pulls back inside a built set (MAX_PULLBACK sized to the
// tavern box). The hero is a poster on an open page: its lens is a fixed 32° tele
// (hero §3) and the comp REBALANCES per breakpoint — the island's on-screen share and
// centre are the authored quantities (COMP above), so the camera is FITTED to them by
// projecting the actual rim, iteratively, instead of trusting a small-angle formula
// (the P4 verify round measured the formula 3–5vw and 5vh off its own comments).
// No FOV tween exists here or ever will (motion §10).
export function heroFraming(width: number, height: number) {
  const aspect = width / Math.max(1, height);
  const { portrait, frac, cx, cy } = compFor(width, height);
  const az = portrait ? HERO_AZ_PORTRAIT : HERO_AZ;
  const hfov = 2 * Math.atan(Math.tan((HERO_FOV * DEG) / 2) * aspect);
  // seed distance from the rim ellipse's analytic projected half-width, then refine
  const halfW = Math.hypot(ISLAND_RX * Math.cos(az), ISLAND_RZ * Math.sin(az));
  let d = halfW / (frac * Math.tan(hfov / 2));
  const look = new THREE.Vector3();
  const cam = new THREE.PerspectiveCamera(HERO_FOV, aspect, 0.1, 200);
  const place = () => {
    cam.position
      .set(
        d * Math.cos(HERO_ELEV) * Math.sin(az),
        d * Math.sin(HERO_ELEV),
        -d * Math.cos(HERO_ELEV) * Math.cos(az),
      )
      .add(look);
    cam.lookAt(look);
    cam.updateMatrixWorld();
  };
  const pr = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).project(cam);
  for (let i = 0; i < 6; i++) {
    place();
    // measured island width: the projected rim's screen extent
    let lo = Infinity;
    let hi = -Infinity;
    for (let a = 0; a < 48; a++) {
      const t = (a / 48) * Math.PI * 2;
      const v = pr(Math.cos(t) * ISLAND_RX, 0, Math.sin(t) * ISLAND_RZ);
      lo = Math.min(lo, v.x);
      hi = Math.max(hi, v.x);
    }
    d *= (hi - lo) / 2 / frac;
    place();
    // walk the look (camera rides along) until the island origin projects to (cx, cy)
    const c = pr(0, 0, 0);
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const viewH = 2 * cam.position.distanceTo(look) * Math.tan((HERO_FOV * DEG) / 2);
    const ex = (c.x + 1) / 2 - cx; // + = origin sits too far right
    const ey = (1 - c.y) / 2 - cy; // + = origin sits too low
    look.addScaledVector(right, ex * viewH * aspect).addScaledVector(up, -ey * viewH);
  }
  place();
  return { position: cam.position.clone(), look, d, portrait };
}

/** Project a world point through the authored hero framing → viewport fractions
 * (x right, y down). The comp checks measure the shipped solve with this. */
export function heroProject(width: number, height: number, p: THREE.Vector3) {
  const f = heroFraming(width, height);
  const cam = new THREE.PerspectiveCamera(HERO_FOV, width / Math.max(1, height), 0.1, 200);
  cam.position.copy(f.position);
  cam.lookAt(f.look);
  cam.updateMatrixWorld();
  const v = p.clone().project(cam);
  return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 };
}

// ---- palette helpers --------------------------------------------------------------
const css = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;
const rgba = (hex: number, a: number) =>
  `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
// tone-mix between two palette tokens — the painter's way to a lit tier without a new
// token: every mixed colour is a blend of committed values, never a fresh hue
const mixHex = (a: number, b: number, t: number) => {
  const ch = (h: number, s: number) => (h >> s) & 255;
  const m = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};

// deterministic hand for the bake — same painting on every load
let bakeSeed = 0x2f6e2b1;
function brand(): number {
  bakeSeed = (bakeSeed + 0x6d2b79f5) | 0;
  let t = Math.imul(bakeSeed ^ (bakeSeed >>> 15), 1 | bakeSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// the path's spine: z as a function of x, a gentle S left to right (hero §2)
export const pathZ = (x: number) => 0.15 + 0.35 * Math.sin((x - 0.4) * 0.85);

// ---- the albedo bakes (TEXTURES.md: hero-island-albedo, hero-foliage, hero-bark) --
//
// The paint layer pushed past kit-placeholder: a real 2D painting of the island top —
// layered gouache fields, directional dabs, the path, its ruts, stones, and the
// painted contact blobs that ground every painted prop (closes P3-T5 for the hero).
// The SAME map feeds both truths: the trilayer derives the graphite half's stroke
// tone from this albedo, so the underdrawing is the same forms by construction.
function bakeIslandAlbedo(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  // SCREEN-SPACE ARITHMETIC (P4c, the round's first law): at 1440×900 the island
  // projects ~840px over 5.2 world units → ~161 screen px per world unit. A 2048 bake
  // gives 394 texels/unit → 1 texel ≈ 0.41 screen px, so a brush dab must be authored
  // ≥ 25 texels long (~10 screen px) and ≥ 5 texels wide (~2 screen px) to read AT
  // FRAMING. The 1024 bake's 9–27px dabs at 0.28 alpha between near-identical greens
  // were ~2 effective screen px of nothing — this bake authors 30–64px dabs at
  // 0.45–0.8 alpha in three genuinely separated value tiers.
  const size = 2048;
  const s = size / 1024; // px-literal scale vs the old bake's coordinate space
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  // world → canvas px (u tracks +x, v tracks -z; the card's own UV layout)
  const ux = (x: number) => ((x / ISLAND_RX + 1) / 2) * size;
  const vz = (z: number) => ((-z / ISLAND_RZ + 1) / 2) * size;

  // ground field: grass with real pigment structure. NOT random soft ellipses — the
  // P4 verify round read those as airbrush clouds and their accidental radial spread
  // as a concave ring. The masses are CLUSTERED (meadow clumps) and the light has
  // a direction (key from -x/-z): shadow mass gathers far-right, lit tone near-left.
  ctx.fillStyle = css(P.grass);
  ctx.fillRect(0, 0, size, size);
  const clusters: [number, number, number, number][] = [];
  for (let i = 0; i < 9; i++) {
    // [cx, cy, radius, shadow?] — clumps sit anywhere; their tone leans on position
    const x = brand() * size;
    const y = brand() * size;
    clusters.push([x, y, (90 + brand() * 110) * s, x / size + (1 - y / size) > 1.05 ? 1 : 0]);
  }
  for (const [cx, cy, cr, sh] of clusters) {
    for (let i = 0; i < 7; i++) {
      const a = brand() * 6.3;
      const rr = brand() * cr * 0.7;
      const r = (26 + brand() * 44) * s;
      ctx.fillStyle = rgba(sh ? (brand() < 0.6 ? mixHex(P.grassDeep, P.canopyDeep, 0.5) : P.grassDeep) : (brand() < 0.5 ? P.grassDeep : P.grass), 0.34 + brand() * 0.28);
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r, r * (0.45 + brand() * 0.35), -0.35 + brand() * 0.7, 0, 6.3);
      ctx.fill();
    }
  }
  // morning-lit warmth pooling toward the lantern side (painted half, low u)
  const warm = ctx.createLinearGradient(0, 0, size, 0);
  warm.addColorStop(0, rgba(P.flameCore, 0.18));
  warm.addColorStop(0.45, rgba(P.flameCore, 0.05));
  warm.addColorStop(1, rgba(P.flameCore, 0));
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, size, size);

  // the path: earthTrack band along the spine, drawn as one confident stroke
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const spine = () => {
    ctx.beginPath();
    for (let x = -2.9; x <= 2.9; x += 0.2) {
      const px = ux(x);
      const py = vz(pathZ(x));
      if (x <= -2.89) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  };
  // softened ochre verge first, the track band over it — wet-brushed, not masked
  spine();
  ctx.strokeStyle = rgba(P.earth, 0.55);
  ctx.lineWidth = 0.62 * (size / (2 * ISLAND_RZ));
  ctx.stroke();
  spine();
  ctx.strokeStyle = css(P.earthTrack);
  ctx.lineWidth = 0.52 * (size / (2 * ISLAND_RZ));
  ctx.stroke();
  // cart ruts: two darker threads riding the band
  for (const off of [-0.09, 0.09]) {
    ctx.beginPath();
    for (let x = -2.9; x <= 2.9; x += 0.2) {
      const px = ux(x);
      const py = vz(pathZ(x) + off);
      if (x <= -2.89) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = rgba(P.timberDark, 0.26);
    ctx.lineWidth = 7 * s;
    ctx.stroke();
  }
  // the track's own painted edges — where the brush pulled earth over grass; a path
  // is a decision, not a smear
  for (const off of [-0.27, 0.27]) {
    ctx.beginPath();
    for (let x = -2.9; x <= 2.9; x += 0.2) {
      const px = ux(x);
      const py = vz(pathZ(x) + off + Math.sin(x * 2.3) * 0.02);
      if (x <= -2.89) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = rgba(mixHex(P.earthTrack, P.timberDark, 0.5), 0.3);
    ctx.lineWidth = 5 * s;
    ctx.stroke();
  }

  // directional gouache brushwork — one flow family following the ground. P4c: the
  // fix-round dabs (9–27px, 0.28–0.58 alpha) measured ~2 screen px of nothing at
  // framing. These are 30–64px (≈12–26 screen px), 5–13px wide (≈2–5 screen px),
  // committed 0.45–0.8 alpha, in THREE separated value tiers a luminance sample can
  // pull apart: shadow (grassDeep→canopyDeep), mid (grassDeep/undergrowth on the
  // grass base), and warm-lit tips (grass→flameCore) gathering on the key side.
  // measured at framing (P4c): with 1300 dabs at 0.45–0.8 alpha the rendered ground
  // still collapsed to a 14-luma band (dab coverage too sparse — base grass owned
  // most pixels). 2000 dabs at 0.55–0.9, the shadow tier pushed to near-canopyDeep
  // and the lit tier past half-flameCore, measure ~25 luma between tier medians.
  const grassLit = mixHex(P.grass, P.flameCore, 0.58);
  const grassShade = mixHex(P.grassDeep, P.canopyDeep, 0.85);
  const trackShade = mixHex(P.earthTrack, P.timberDark, 0.45);
  const earthLit = mixHex(P.earth, P.flameCore, 0.35);
  for (let i = 0; i < 2000; i++) {
    const x = brand() * size;
    const y = brand() * size;
    const wx = (x / size) * 2 - 1;
    const onPath = Math.abs(y - vz(pathZ(wx * ISLAND_RX))) < 0.26 * (size / (2 * ISLAND_RZ));
    const len = (30 + brand() * 34) * (onPath ? 0.7 : 1);
    // path strokes run along the path; grass strokes share one gently-varying flow
    const ang = onPath
      ? Math.atan2(vz(pathZ(wx * ISLAND_RX + 0.2)) - vz(pathZ(wx * ISLAND_RX)), 0.2 * (size / (2 * ISLAND_RX)))
      : -0.32 + Math.sin(x * 0.006 + y * 0.004) * 0.35 + (brand() - 0.5) * 0.3;
    // lit tips gather where the key rakes in (low u, low v — the -x/-z quarter)
    const litBias = (1 - x / size) * 0.5 + (1 - y / size) * 0.5;
    const tone = brand() * (0.7 + litBias * 0.6);
    ctx.strokeStyle = onPath
      ? rgba(tone < 0.4 ? trackShade : tone < 0.75 ? P.earth : earthLit, 0.45 + brand() * 0.35)
      : rgba(tone < 0.32 ? grassShade : tone < 0.58 ? P.grassDeep : tone < 0.84 ? P.undergrowth : grassLit, 0.55 + brand() * 0.35);
    ctx.lineWidth = (6 + brand() * 8) * (onPath ? 0.8 : 1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // a curved dab — a loaded brush pulled and lifted, not a plotted tick
    ctx.quadraticCurveTo(
      x + Math.cos(ang) * len * 0.5 + (brand() - 0.5) * 8,
      y + Math.sin(ang) * len * 0.5 + (brand() - 0.5) * 8,
      x + Math.cos(ang) * len,
      y + Math.sin(ang) * len,
    );
    ctx.stroke();
  }

  // pebbles by the path — each grounded by its own tiny shadow crescent
  for (let i = 0; i < 14; i++) {
    const x = -2.4 + brand() * 4.6;
    const z = pathZ(x) + (brand() < 0.5 ? -1 : 1) * (0.3 + brand() * 0.25);
    const pr = (4 + brand() * 5) * s;
    ctx.fillStyle = rgba(P.caveDark, 0.32);
    ctx.beginPath();
    ctx.ellipse(ux(x) + 2 * s, vz(z) + 2 * s, pr * 1.1, pr * 0.7, 0.3, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = rgba(brand() < 0.5 ? P.stoneWarm : P.stoneCool, 0.9);
    ctx.beginPath();
    ctx.ellipse(ux(x), vz(z), pr, pr * 0.75, brand() * 3, 0, 6.3);
    ctx.fill();
  }

  // the cut-earth rim ring: grass meets the strata in a painted edge, not an alpha
  // fade (P4 fix round — the feathered halo read as a serving-dish lip). A broad
  // earthy band right at the rim with a thin dark accent inside it.
  const ring = (r: number, hex: number, a: number, w: number) => {
    ctx.strokeStyle = rgba(hex, a);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, (size / 2) * r, (size / 2) * r, 0, 0, 6.3);
    ctx.stroke();
  };
  ring(0.985, P.earth, 0.5, 14 * s);
  ring(0.968, P.timberDark, 0.28, 5 * s);

  // the lantern's pool of light — painted INTO the ground the way a miniature painter
  // would (hero §2 "a lantern post, lit"; §8 "light leads"): a warm wash under the
  // glass with a hot core, so the lamp visibly owns its patch of world. P4c: the
  // lantern restaged to the near rim (see buildHero) — the pool follows the glass.
  {
    // P4d (FIX: the lamp must OUT-SHINE its own pool — the walk measured glass L215
    // under pool L219, a lamp dimmer than its light): the pool tightens (135 → 92)
    // and pulls toward AMBER — flameBody over sunlit grass read as more yellow-green
    // grass; amber is the ramp's stated ground-glow hue — so the ground reads warm
    // and clearly BELOW the burning glass in value.
    const px = ux(LANTERN_POS.x);
    const py = vz(LANTERN_POS.z + 0.14);
    // P4e (P4d-T5): the pool measured hue ~51° (green grass pulling the amber wash
    // yellow) — the wash grades a step down the ramp (amber→amberLantern) to land
    // in the stated amber family (~40–48°), and the hot core shrinks so no pool
    // pixel out-shines the burning glass.
    const poolHue = mixHex(P.amber, P.amberLantern, 0.5);
    const pool = ctx.createRadialGradient(px, py, 6 * s, px, py, 92 * s);
    // the inner wash commits (0.75 alpha, a step toward ember) — at 0.55 the green
    // grass under it still pulled the measured hue to ~52; the pool must read as
    // amber LIGHT on grass, not as yellower grass
    pool.addColorStop(0, rgba(mixHex(poolHue, P.amberEmber, 0.3), 0.75));
    pool.addColorStop(0.4, rgba(poolHue, 0.35));
    pool.addColorStop(1, rgba(poolHue, 0));
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(px, py, 92 * s, 0, 6.3);
    ctx.fill();
    const core = ctx.createRadialGradient(px, py, 2 * s, px, py, 18 * s);
    core.addColorStop(0, rgba(P.flameBody, 0.3));
    core.addColorStop(1, rgba(P.flameBody, 0));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(px, py, 18 * s, 0, 6.3);
    ctx.fill();
  }

  // painted contact blobs — grounding shadows under every PAINTED prop (P3-T5).
  // Graphite props get none: a drawing casts nothing, and grounding one would lie.
  const blob = (x: number, z: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(ux(x), vz(z), 0, ux(x), vz(z), r * s);
    g.addColorStop(0, rgba(P.caveDark, a));
    g.addColorStop(1, rgba(P.caveDark, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ux(x), vz(z), r * s, 0, 6.3);
    ctx.fill();
  };
  blob(LANTERN_POS.x, LANTERN_POS.z, 48, 0.3); // lantern post (near rim, P4c)
  blob(-1.47, -1.14, 20, 0.26); // mushrooms at the lantern's foot
  blob(-1.7, -1.2, 20, 0.26);
  blob(-1.57, -1.28, 18, 0.26);
  blob(-0.15, -0.9, 40, 0.28); // signpost
  blob(-0.3, -0.72, 22, 0.24); // the out-of-place support stone
  blob(-0.5, -0.62, 26, 0.24); // painted rock
  blob(-0.95, -1.0, 58, 0.26); // painted oak
  blob(-2.2, 0.8, 50, 0.26); // painted pine
  // the goblin's stance — he is painted, so he grounds. Darkened and tightened (goblin
  // design §8 device 2) so the painted blob, the trilayer contact pool and the boots
  // all agree on where he touches instead of three softnesses fighting.
  blob(0.95, 0.31, 24, 0.4);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// foliage tile: layered dab masses over a canopyDeep→canopy value climb; the same map
// dresses painted and graphite crowns, so the drawing is the same form's tone.
// SCREEN-SPACE (P4c): a crown lobe is ~0.3 world units (~48 screen px radius) and its
// sphere UV wraps the whole tile around it, so ~1 texel ≈ 0.5–1 screen px at 512. A
// leaf cluster must be authored ≥ 40 texels (~25 screen px) to read as a clump; the
// old 256 tile's 14–36px blotches projected as out-of-focus noise. The crowns' FORM
// tiers come from lobed geometry under the Lambert key (see buildTree) — the tile
// carries cluster texture, committed, not the whole job.
function bakeFoliage(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createLinearGradient(0, size, 0, 0);
  g.addColorStop(0, css(P.canopyDeep));
  g.addColorStop(1, css(P.canopy));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // leaf-cluster clumps: each a committed dark under-mass with lit leaf dabs on its
  // upper shoulder; the lit tier mixes toward flameCore so the crowns carry the
  // morning key in the paint itself. Sizes per the texel math above.
  const leafLit = mixHex(P.canopy, P.flameCore, 0.5);
  for (let c = 0; c < 22; c++) {
    const cx = brand() * size;
    const cy = brand() * size;
    const cr = 40 + brand() * 55;
    ctx.fillStyle = rgba(cy > size * 0.5 ? P.canopyDeep : P.needle, 0.45 + brand() * 0.25);
    ctx.beginPath();
    ctx.ellipse(cx, cy + cr * 0.25, cr, cr * 0.7, -0.3 + brand() * 0.6, 0, 6.3);
    ctx.fill();
    const lit = cy < size * 0.55;
    for (let i = 0; i < 7; i++) {
      const a = -2.6 + brand() * 2.0; // dabs gather on the upper shoulder
      const rr = cr * (0.4 + brand() * 0.6);
      ctx.fillStyle = rgba(lit ? (brand() < 0.55 ? leafLit : P.grass) : brand() < 0.6 ? P.canopy : P.undergrowth, 0.55 + brand() * 0.3);
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7, 12 + brand() * 16, 8 + brand() * 11, -0.4 + brand() * 0.8, 0, 6.3);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function bakeBark(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = css(P.timber);
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 42; i++) {
    const x = brand() * size;
    ctx.strokeStyle = rgba(brand() < 0.7 ? P.timberDark : P.plank, 0.22 + brand() * 0.3);
    ctx.lineWidth = 1.5 + brand() * 3;
    ctx.beginPath();
    ctx.moveTo(x, -4);
    ctx.bezierCurveTo(x + (brand() - 0.5) * 8, size * 0.33, x + (brand() - 0.5) * 8, size * 0.66, x + (brand() - 0.5) * 6, size + 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// a trilayer that carries a baked map: white albedo slot, the painting IS the colour.
// `poster` quantizes the PAINT side's lit luminance into committed value steps
// (trilayer uTriPoster) — the crowns opt in so their Lambert ramp reads as tiers.
function mapped(
  map: THREE.Texture | null,
  fallback: number,
  wear = 0.22,
  poster = 0,
  stroke?: { dir?: number; sheet?: boolean },
) {
  const mat = createTrilayer({ color: map ? 0xffffff : fallback, wear, poster, stroke });
  if (map) mat.map = map;
  return mat;
}

// ---- drawn graphite marks (authored, not derived) ---------------------------------
const mark = (pts: THREE.Vector3[], hex: number, w: 'hero' | 'form' | 'faint', close = false) =>
  paint(polyline(pts, w, close), { line: hex });

// The same form's own edges as pencil marks: sketch() extracts wobbled strokes from
// any geometry — take its drawn line and drop the fill (the trilayer solid underneath
// is the tone; these are the contour passes laid over it). This is what makes a
// graphite-half prop read as a DRAWING of itself instead of a pale 3D ghost.
function inkEdges(geom: THREE.BufferGeometry, threshold: number, hex: number, w: 'form' | 'faint' = 'faint') {
  const s = sketch(geom, threshold, w);
  const fill = s.children[0] as THREE.Mesh;
  fill.visible = false; // tone belongs to the trilayer solid; only the strokes stay
  return paint(s, { line: hex });
}

// Contour marks are authored in the SHOT's view plane: the hero is one fixed camera
// (HERO_AZ/HERO_ELEV), so a drawn silhouette lives where THAT lens sees the form's
// edge — exactly how a draughtsman draws what the sheet will show. Portrait's +24°
// re-aim is 6° off this basis; a wobbled pencil arc carries 6° without complaint.
// SCREEN-SPACE: 'form' weight is 2.1 screen px — the readable floor for a contour at
// the ~161px/world-unit framing; 'faint' (1.1px) is for ghosts and erased passes ONLY
// (the P4/P4b rounds shipped faint contours and both verify rounds read them as none).
const VIEW_R = new THREE.Vector3(Math.cos(HERO_AZ), 0, Math.sin(HERO_AZ));
// toward the camera — a mark pushed along this vector keeps its SCREEN position
// (it slides up its own view ray, near enough) but wins the depth test against the
// solid it annotates; the walk showed marks at surface depth getting swallowed
const VIEW_CAM = new THREE.Vector3(
  Math.sin(HERO_AZ) * Math.cos(HERO_ELEV),
  Math.sin(HERO_ELEV),
  -Math.cos(HERO_AZ) * Math.cos(HERO_ELEV),
);

/** A drawn arc in the view plane around (cx,cy,cz): angle 0 = screen-right, π/2 = up.
 * `push` biases the whole arc toward the camera (depth only — see VIEW_CAM). */
function contourArc(
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  hex: number,
  w: 'hero' | 'form' | 'faint' = 'form',
  push = 0.15,
) {
  const pts: THREE.Vector3[] = [];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const j = 1 + (brand() - 0.5) * 0.06;
    const h = Math.cos(a) * rx * j;
    pts.push(
      new THREE.Vector3(cx + VIEW_R.x * h, cy + Math.sin(a) * ry * j, cz + VIEW_R.z * h)
        .addScaledVector(VIEW_CAM, push),
    );
  }
  return mark(pts, hex, w);
}

/** All 12 edges of a box drawn as strokes — a construction drawing keeps even its
 * hidden edges; the stroke pipeline's overshoot corners make it a hand's box. */
function boxMarks(w: number, h: number, d: number, cy: number, hex: number): THREE.Group {
  const g = new THREE.Group();
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x * hw, cy + y * hh, z * hd);
  const edges: [THREE.Vector3, THREE.Vector3][] = [];
  for (const y of [-1, 1]) {
    edges.push([v(-1, y, -1), v(1, y, -1)], [v(-1, y, 1), v(1, y, 1)]);
    edges.push([v(-1, y, -1), v(-1, y, 1)], [v(1, y, -1), v(1, y, 1)]);
  }
  for (const x of [-1, 1]) for (const z of [-1, 1]) edges.push([v(x, -1, z), v(x, 1, z)]);
  for (const [a, b] of edges) g.add(mark([a, b], hex, 'form'));
  return g;
}

// an ellipse of drawn points in a plane, jittered like a hand's construction pass
function ellipseMark(
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  rz: number,
  hex: number,
  w: 'form' | 'faint',
  tilt = 0,
  sweep: [number, number] = [0, Math.PI * 2],
) {
  const pts: THREE.Vector3[] = [];
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = sweep[0] + ((sweep[1] - sweep[0]) * i) / n;
    const j = 1 + (brand() - 0.5) * 0.05;
    const x = Math.cos(a) * rx * j;
    const y = Math.sin(a) * rz * j;
    pts.push(new THREE.Vector3(cx + x, cy + y * Math.sin(tilt), cz + y * Math.cos(tilt)));
  }
  return mark(pts, hex, w);
}

// ---- props ------------------------------------------------------------------------

// painted-territory props speak the film's drawn-prop language: sketch() ink over fills
function buildLantern(): THREE.Group {
  const g = new THREE.Group();
  const base = sketch(new THREE.CylinderGeometry(0.14, 0.17, 0.1, 9), 30, 'form');
  base.position.y = 0.05;
  paint(base, { fill: P.stoneWarm });
  const base2 = sketch(new THREE.CylinderGeometry(0.09, 0.12, 0.08, 9), 30, 'faint');
  base2.position.y = 0.13;
  paint(base2, { fill: P.stoneWarm });
  // P4c: a SQUAT storybook post — at the old 0.92 pole the head projected straight
  // into the pine's canopy from the shipped lens; at ~0.8 world units the glass
  // clears every crown and hangs over its own painted pool (lit ground behind it)
  const pole = sketch(new THREE.CylinderGeometry(0.028, 0.038, 0.66, 8), 35, 'form');
  pole.position.y = 0.49;
  paint(pole, { fill: P.timberDark });
  // the curved arm, a quarter-torus reaching over the path side. P4e (P4d-T5: the
  // head read unattached — the bracket never resolved): a fatter tube with a
  // form-weight ink pass and dark timber against the pale page, so the head HANGS.
  const arm = sketch(new THREE.TorusGeometry(0.16, 0.032, 6, 10, Math.PI / 2), 25, 'form');
  arm.position.set(0, 0.82, 0);
  arm.rotation.y = Math.PI / 2;
  arm.rotation.z = Math.PI / 2;
  paint(arm, { fill: P.timberDark });
  // Housing hung from the arm's tip — OPEN: the glass IS the lantern (hero §4's one
  // emissive surface). P4 fix round: the old 0.102-radius iron hat swallowed nearly
  // the whole glass at the 33° lens and the prop read UNLIT — the roof is now a small
  // cap sitting high, the glass is taller and wider, and a paler hot core rides its
  // upper half so it reads as burning, not as painted cream.
  const housing = new THREE.Group();
  housing.position.set(0, 0.8, 0.16);
  // P4d (FIX: the glass measured L215 against its own L219 pool, and the dark
  // plate + roof owned most of a ~20px head): plate thinned to a sill, glass
  // grown to the head's dominant mass and pushed up the ramp toward flameCore —
  // the brightest warm element in the frame — roof shrunk to a rim cap.
  const plate = sketch(new THREE.CylinderGeometry(0.086, 0.094, 0.016, 6), 25, 'faint');
  plate.position.y = -0.128;
  paint(plate, { fill: P.timberDark });
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.082, 0.24, 6),
    // 0.05 up the ramp (P4e): the glass measures L237 — brightest warm element
    new THREE.MeshBasicMaterial({ color: mixHex(P.flameCore, P.flameBody, 0.05), fog: false }),
  );
  // P5 (hero §8): the entrance ignites the lamp — heroLife finds the glass/flame by
  // these tags and carries the lit/unlit colours (unlit = bone glass; lit = this
  // authored value, recorded on userData so the ignition lands EXACTLY here).
  glass.userData.heroPart = 'glass';
  glass.userData.litHex = mixHex(P.flameCore, P.flameBody, 0.05);
  // unlit = bare paper: pre-ignition the glass is one more unpainted solid on the
  // drawing (a cream block floated over the graphite in the walk); ignition warms it
  glass.userData.unlitHex = P.paper;
  // P4e (P4d-T5): a distinct FLAME teardrop in the glass — the old proud core column
  // hid behind the glass face and NO flame read at any zoom. The teardrop parks a
  // step toward the lens (the contours' 2.5D depth cheat) so it reads IN the glass:
  // amberLantern body, flameCore heart — the one mark that says burning, not bright.
  const flameMat = new THREE.MeshBasicMaterial({ color: P.amberLantern, fog: false });
  const fBody = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), flameMat);
  fBody.scale.set(1, 1.3, 1);
  const fTip = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.05, 8), flameMat);
  fTip.position.y = 0.056;
  const fHeart = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 6, 6),
    new THREE.MeshBasicMaterial({ color: P.flameCore, fog: false }),
  );
  fHeart.position.y = -0.006;
  const flame = new THREE.Group();
  flame.add(fBody, fTip, fHeart);
  flame.position.set(-0.012, -0.02, -0.08); // centred in the glass from the lens (walked)
  flame.userData.heroPart = 'flame'; // P5: the ignition set (see the glass tag above)
  // the roof is a thin dark RIM overhanging the glass (P4e — the old high cap read
  // as a speck): wide and shallow, its silhouette the one dark line over the burn.
  // Still no broad hat — the glass stays the head's dominant mass (walked 3 rounds).
  const roof = sketch(new THREE.ConeGeometry(0.125, 0.034, 6), 20, 'form');
  roof.position.y = 0.145;
  paint(roof, { fill: P.iron });
  housing.add(plate, glass, flame, roof);
  g.add(base, base2, pole, arm, housing);
  return g;
}

// the lantern's bloom — a painted halo of the amber ramp (the ONLY glow hue), baked
// as a radial sprite so the glass visibly SHEDS light instead of merely being pale.
// Browser-only like the albedo bakes; Node staging simply has no halo to assert.
function buildGlowSprite(): THREE.Sprite | null {
  if (typeof document === 'undefined') return null;
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 3, 64, 64, 64);
  g.addColorStop(0, rgba(P.flameCore, 0.95));
  g.addColorStop(0.22, rgba(P.amber, 0.5));
  g.addColorStop(0.55, rgba(P.amber, 0.16));
  g.addColorStop(1, rgba(P.amber, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }),
  );
  sprite.scale.setScalar(1.15); // P4d: the shed light grows with the grown glass
  sprite.renderOrder = 4;
  return sprite;
}

function buildSignpost(): THREE.Group {
  const g = new THREE.Group();
  const post = sketch(new THREE.CylinderGeometry(0.03, 0.04, 0.78, 7), 35, 'form');
  post.position.y = 0.39;
  paint(post, { fill: P.timber });
  const cap = sketch(new THREE.ConeGeometry(0.045, 0.05, 7), 30, 'faint');
  cap.position.y = 0.8;
  paint(cap, { fill: P.timberDark });
  // the arrow board — freshly straightened: dead level, pointing up the path
  const board = new THREE.Group();
  board.position.y = 0.62;
  const shape = new THREE.Shape();
  shape.moveTo(-0.2, -0.06);
  shape.lineTo(0.14, -0.06);
  shape.lineTo(0.24, 0);
  shape.lineTo(0.14, 0.06);
  shape.lineTo(-0.2, 0.06);
  shape.closePath();
  const plank = sketch(new THREE.ExtrudeGeometry(shape, { depth: 0.024, bevelEnabled: false }), 25, 'form');
  plank.position.z = -0.012;
  paint(plank, { fill: P.plank });
  board.add(plank);
  // two scribbled label lines — marks, never words (hero §6: no other words)
  for (const [y, len] of [
    [0.016, 0.22],
    [-0.02, 0.16],
  ] as const) {
    const pts = [];
    for (let i = 0; i <= 6; i++) pts.push(new THREE.Vector3(-0.16 + (len * i) / 6, y + (brand() - 0.5) * 0.008, 0.016));
    board.add(mark(pts, P.ink, 'faint'));
  }
  g.add(post, cap, board);
  return g;
}

function buildMushroom(scale: number): THREE.Group {
  const g = new THREE.Group();
  const stem = sketch(new THREE.CylinderGeometry(0.022, 0.03, 0.07, 7), 35, 'faint');
  stem.position.y = 0.035;
  paint(stem, { fill: P.dieBone });
  const cap = sketch(new THREE.SphereGeometry(0.055, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 40, 'form', 0.004);
  cap.position.y = 0.062;
  cap.scale.y = 0.72;
  paint(cap, { fill: P.mushCap });
  for (let i = 0; i < 3; i++) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), (cap.children[0] as THREE.Mesh).material);
    spot.position.set(Math.cos(i * 2.1) * 0.032, 0.095, Math.sin(i * 2.1) * 0.032);
    paint(spot, { fill: P.dieBone });
    g.add(spot);
  }
  g.add(stem, cap);
  g.scale.setScalar(scale);
  return g;
}

// trilayer trees — both halves; the seam decides which truth each one renders in.
// P4c APPROACH CHANGE (both verify rounds): form comes from GEOMETRY + AUTHORED
// CONTOURS now, not from a tile. The old single sphere/cone under a stretched
// foliage tile shipped twice as a smooth blob, and its inkEdges pass gave facet
// noise plus a pole fan instead of a silhouette. A crown is now overlapping lobes /
// stacked tiers — the Lambert key lights each mass its own tier, the silhouette
// breaks like a drawn tree's — and the contour is AUTHORED: scalloped view-plane
// arcs and tapering trunk strokes, ink on the painted tree, graphiteDark on the
// graphite one. Same forms, two truths, and a stranger can name both.
function buildTree(
  kind: 'oak' | 'pine',
  foliage: THREE.Texture | null,
  bark: THREE.Texture | null,
  seed: number,
  style: 'painted' | 'graphite' = 'painted',
): THREE.Group {
  const g = new THREE.Group();
  const graphite = style === 'graphite';
  const lineHex = graphite ? P.graphiteDark : P.ink;
  // P4e (FIX 1 — P4d-T1): ONE drawing direction per organic prop, in the sheet
  // basis — a hand shades a whole tree in one direction; the per-face flip was the
  // fingerprint swirl. Slight per-prop variance in the family angle is the hand;
  // trunks shade along their own grain, near-vertical.
  const crownStroke = { dir: 0.5 + (seed % 5) * 0.06, sheet: true };
  const trunkStroke = { dir: 1.35 + (seed % 3) * 0.05, sheet: true };
  // contour offset (P4d, FIX: the ink sat 10–40 screen px OUTSIDE the painted lobes
  // — a floating line reads as a mistake, and on the graphite side the P4c arcs
  // orbited a mass that now carries its own tiered tone): arcs register AT the
  // silhouette — 1.05× the lobe radius painted, 1.10× graphite (just proud of the
  // roughen swing) — and survive the solid via a deeper VIEW_CAM push instead of
  // lateral distance.
  const K = graphite ? 1.1 : 1.05;
  const trunkSide = (r0: number, r1: number, y0: number, y1: number) => {
    for (const side of [-1, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 4; i++) {
        const t = i / 4;
        const r = side * (r0 + (r1 - r0) * t);
        pts.push(
          new THREE.Vector3(VIEW_R.x * r, y0 + (y1 - y0) * t, VIEW_R.z * r)
            .addScaledVector(VIEW_CAM, 0.14),
        );
      }
      // the trunk is what says "tree": on the graphite half it carries the hero
      // stroke tier — at form weight it sank into the row field (walked)
      g.add(mark(pts, lineHex, graphite ? 'hero' : 'form'));
    }
  };
  if (kind === 'oak') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.085, 0.66, 9), mapped(bark, P.timber, 0.3, 0, trunkStroke));
    trunk.position.y = 0.33;
    g.add(trunk);
    // five overlapping lobes — the crown's masses
    const lobes: [number, number, number, number][] = [
      [0, 0.98, 0, 0.34],
      [-0.27, 0.86, 0.08, 0.26],
      [0.25, 0.85, -0.05, 0.27],
      [0.03, 1.2, 0.04, 0.25],
      [-0.14, 1.08, -0.16, 0.22],
    ];
    for (const [i, [lx, ly, lz, lr]] of lobes.entries()) {
      // roughen displaces ±amp along the normal: at 0.10 the bumps stay within the
      // contour arcs' registration band (the arcs ride the silhouette and win the
      // depth test via their 0.35 camera push — see the crown block below)
      const lobe = new THREE.Mesh(
        roughen(new THREE.SphereGeometry(lr, 12, 9), lr * 0.1, 3.4, seed * 7 + i),
        mapped(foliage, P.canopy, 0.3, 12, crownStroke), // poster 12: ~3–4 value tiers
      );
      lobe.position.set(lx, ly, lz);
      g.add(lobe);
    }
    // the drawn crown: a scalloped outline HUGGING the outer lobes (radius = lobe
    // radius × K, centred on the lobe itself), one interior separation where the
    // masses meet, and the trunk's two tapering side strokes. The deep push (0.35)
    // is what keeps a snug arc out of its own roughened mass's depth (walked: at
    // push 0.15 an on-silhouette arc got half-swallowed).
    g.add(contourArc(-0.27, 0.86, 0.08, 0.26 * K, 0.25 * K, 0.45 * Math.PI, 1.5 * Math.PI, lineHex, 'form', 0.35));
    g.add(contourArc(0.03, 1.2, 0.04, 0.25 * K, 0.24 * K, 0.1 * Math.PI, 0.95 * Math.PI, lineHex, 'form', 0.35));
    g.add(contourArc(0.25, 0.85, -0.05, 0.27 * K, 0.26 * K, -0.55 * Math.PI, 0.42 * Math.PI, lineHex, 'form', 0.35));
    g.add(contourArc(0, 0.98, 0, 0.34 * K, 0.33 * K, 1.2 * Math.PI, 1.85 * Math.PI, lineHex, 'form', 0.35));
    g.add(contourArc(-0.14, 1.08, -0.16, 0.22 * K, 0.18 * K, 1.15 * Math.PI, 1.8 * Math.PI, lineHex, 'faint', 0.35));
    if (graphite) {
      // interior leaf-mass arcs — short curved marks inside the lobes, mid graphite
      // tier: they are what make a scalloped white mass read TREE, not cloud. Pushed
      // 0.4 toward the camera to clear the lobe fronts (depth-only — VIEW_CAM).
      g.add(contourArc(-0.16, 0.92, 0.06, 0.14, 0.11, 0.3 * Math.PI, 1.1 * Math.PI, P.graphite, 'form', 0.4));
      g.add(contourArc(0.12, 1.04, 0, 0.13, 0.1, 0.5 * Math.PI, 1.4 * Math.PI, P.graphite, 'form', 0.4));
      g.add(contourArc(0.16, 0.8, -0.04, 0.12, 0.1, -0.2 * Math.PI, 0.7 * Math.PI, P.graphite, 'form', 0.4));
      g.add(contourArc(-0.05, 1.14, 0.03, 0.12, 0.09, 0.9 * Math.PI, 1.7 * Math.PI, P.graphite, 'form', 0.4));
    }
    trunkSide(0.098, 0.058, 0.02, 0.66);
  } else {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.36, 8), mapped(bark, P.timber, 0.3, 0, trunkStroke));
    trunk.position.y = 0.18;
    g.add(trunk);
    // three stacked tiers — a pine's silhouette is its skirts
    const tiers: [number, number, number][] = [
      [0.55, 0.44, 0.56],
      [0.93, 0.34, 0.5],
      [1.26, 0.23, 0.46],
    ];
    for (const [i, [cy, r, h]] of tiers.entries()) {
      const cone = new THREE.Mesh(
        roughen(new THREE.ConeGeometry(r, h, 10, 2), r * 0.07, 4.1, seed * 5 + i),
        mapped(foliage, P.needle, 0.3, 12, crownStroke), // poster 12: tiered like the oak
      );
      cone.position.y = cy;
      g.add(cone);
      g.add(contourArc(0, cy - h / 2, 0, r * (graphite ? 1.05 : 1.01), r * 0.3, 1.1 * Math.PI, 1.9 * Math.PI, lineHex, 'form', 0.3));
    }
    // the fir's SILHOUETTE: one connected zigzag stroke per side, tip to skirt —
    // per-tier slants never assembled into a tree at framing (walked); the zigzag
    // is how a hand actually draws a fir. P4e (FIX: P4d-T2 — the authored radii sat
    // 9–16 screen px OUTSIDE the mass and no scale of the zig knob could close it):
    // the radii now DERIVE from the tier cone profile — skirt points at each cone's
    // own base radius, tuck points a proportional step back toward the trunk (a
    // drawn line INSIDE tone is a hand's zigzag; a line outside it is a wire tent).
    const silR = (y: number) =>
      Math.max(
        0.02,
        ...tiers.map(([cy, r, h]) => {
          const top = cy + h / 2;
          return y >= cy - h / 2 - 0.02 && y <= top ? (r * (top - y)) / h : 0;
        }),
      );
    const zigPts: [number, number][] = [[0.03, tiers[2][0] + tiers[2][2] / 2 + 0.02]];
    for (let i = tiers.length - 1; i >= 0; i--) {
      const yBot = tiers[i][0] - tiers[i][2] / 2 + 0.01;
      zigPts.push([silR(yBot), yBot]);
      if (i > 0) zigPts.push([silR(yBot) * 0.45, yBot + 0.03]);
    }
    const zig = graphite ? 1.03 : 0.99; // ON the mass — the tips' stroke overshoot
    // supplies the only proudness (measured: 1.01 still left a 5px float at a tip)
    for (const side of [-1, 1]) {
      // push 0.1, not the arcs' 0.3: at the silhouette the cone falls away, so a
      // shallow push already wins depth — the deep push's perspective residue was
      // ~8 screen px of lateral shift, the largest remaining registration error
      const pts = zigPts.map(([r0, y]) =>
        new THREE.Vector3(VIEW_R.x * side * r0 * zig, y, VIEW_R.z * side * r0 * zig)
          .addScaledVector(VIEW_CAM, 0.1),
      );
      g.add(mark(pts, lineHex, 'form'));
    }
    trunkSide(0.082, 0.046, 0.02, 0.38);
  }
  return g;
}

// the half-contoured tree — line only, visibly NEXT: trunk contours, a partial crown
// pass, one erased-and-redrawn arc (the maker is not a machine — hero §4)
function buildHalfContouredTree(): THREE.Group {
  const g = new THREE.Group();
  // P4c: the P4b cut read as "a stray wire" — the started tree now draws at the same
  // graphiteDark/form register as the finished graphite props, in the view plane the
  // shot actually reads (contourArc), so it reads as a tree someone is starting.
  for (const side of [-1, 1]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 5; i++) {
      const y = (0.58 * i) / 5;
      const r = side * (0.05 + 0.03 * (1 - y / 0.58)) + (brand() - 0.5) * 0.012;
      pts.push(new THREE.Vector3(VIEW_R.x * r, y, VIEW_R.z * r));
    }
    g.add(mark(pts, P.graphiteDark, 'form'));
  }
  // the crown's first construction pass — an open arc, stopped mid-stroke
  g.add(contourArc(0, 0.92, 0, 0.42, 0.34, -0.25, 2.15, P.graphiteDark, 'form'));
  // the erased line: a fainter ghost arc sitting where the first attempt was…
  g.add(contourArc(0.06, 0.98, 0.02, 0.4, 0.3, 0.2, 1.65, P.graphiteLight, 'faint'));
  // …and the redrawn correction over it
  g.add(contourArc(-0.02, 0.88, 0.01, 0.44, 0.3, 0.35, 1.4, P.graphiteDark, 'form'));
  return g;
}

function buildChest(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.26), createTrilayer({ color: P.timber, wear: 0.25 }));
  body.position.y = 0.1;
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.4, 10, 1, false, 0, Math.PI),
    createTrilayer({ color: P.timberDark, wear: 0.25 }),
  );
  lid.rotation.z = Math.PI / 2;
  lid.position.y = 0.2;
  for (const x of [-0.11, 0.11]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.21, 0.28), createTrilayer({ color: P.brass }));
    band.position.set(x, 0.1, 0);
    g.add(band);
  }
  g.add(body, lid);
  // graphite-half prop: it waits as a DRAWING. P4c (verify: "completely illegible as
  // a chest") — the marks are authored now, graphiteDark at form weight: the full box
  // construction (all 12 edges), the lid's two end arcs + crest + hem lines, plank
  // seams and the strap verticals. The trilayer rows underneath are the tone fill;
  // these lines are what a stranger names a chest by.
  g.add(boxMarks(0.4, 0.2, 0.26, 0.1, P.graphiteDark));
  for (const ex of [-0.2, 0.2]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = (Math.PI * i) / 10;
      pts.push(new THREE.Vector3(ex, 0.2 + Math.sin(a) * 0.13, Math.cos(a) * 0.13));
    }
    g.add(mark(pts, P.graphiteDark, 'form'));
  }
  // lid crest + hem lines along its length, and the body's plank seams
  g.add(mark([new THREE.Vector3(-0.2, 0.33, 0), new THREE.Vector3(0.2, 0.33, 0)], P.graphiteDark, 'form'));
  for (const z of [-0.13, 0.13]) {
    g.add(mark([new THREE.Vector3(-0.2, 0.2, z), new THREE.Vector3(0.2, 0.2, z)], P.graphiteDark, 'form'));
  }
  for (const y of [0.065, 0.135]) {
    g.add(mark([new THREE.Vector3(-0.2, y, 0.131), new THREE.Vector3(0.2, y, 0.131)], P.graphite, 'form'));
  }
  for (const x of [-0.11, 0.11]) {
    g.add(mark([new THREE.Vector3(x, 0.005, 0.132), new THREE.Vector3(x, 0.2, 0.132)], P.graphiteDark, 'form'));
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) {
      const a = (Math.PI * i) / 6;
      pts.push(new THREE.Vector3(x, 0.2 + Math.sin(a) * 0.145, Math.cos(a) * 0.145));
    }
    g.add(mark(pts, P.graphiteDark, 'faint'));
  }
  return g;
}

function buildRock(r: number, color: number, seed: number): THREE.Mesh {
  const rock = new THREE.Mesh(
    roughen(new THREE.DodecahedronGeometry(r), r * 0.22, 2.5, seed),
    // P4e: a rock is an organic mass — one stroke direction for the whole prop
    createTrilayer({ color, wear: 0.3, stroke: { dir: 0.55 + (seed % 4) * 0.07, sheet: true } }),
  );
  rock.scale.y = 0.7;
  return rock;
}

function buildTuft(hex: number): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = -0.5 + (i / 6) * 1 + (brand() - 0.5) * 0.2;
    const h = 0.08 + brand() * 0.08;
    g.add(
      mark(
        [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.sin(a) * h * 0.5, h * 0.7, (brand() - 0.5) * 0.03),
          new THREE.Vector3(Math.sin(a) * h, h, (brand() - 0.5) * 0.04),
        ],
        hex,
        'faint',
      ),
    );
  }
  return g;
}

// the carpenter's pencil (ASSETS pencil-card): bare cedar, flat-worn graphite tip, a
// thumb notch — a drawn object in the film's own sketch vocabulary, jewel-tier small
export function buildPencil(): THREE.Group {
  const g = new THREE.Group();
  // flat-oval cedar body — carpenter's pencils don't roll off the world.
  // P4e (P4d-T6: it rendered as a mid-brown lozenge — neither dark against the pale
  // frontier nor pale against his cloak): the body commits DARK, the whittled collar
  // stays pale cut wood — a two-value object the way a drawn pencil actually reads.
  // VALUES INVERTED (goblin design §7). The geometry was right and the two-value
  // instinct was right; the ASSIGNMENT is what made "a goblin with a pencil" illegible —
  // a timberDark body inside a timberDark mitt is one continuous brown mass with a stick
  // in it. A whittled carpenter's pencil IS pale cedar, so this is more true, not less,
  // and it gives a value gradient along the tool that separates from whatever is behind
  // it at every stage of the shot: a PALE BAR against his dark mitt and against mid
  // grass, ending in a DARK TIP where it touches the near-paper graphite half.
  const pencilMat = (color: number, wear: number) =>
    createTrilayer({ color, wear, poster: 6, stroke: { dir: 1.5, sheet: true } });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.15, 0.011), pencilMat(P.dieBone, 0.2));
  // whittled collar, cut facets showing pale wood — the same cedar, one step brighter
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0095, 0.0045, 0.032, 6),
    pencilMat(P.dieBone, 0.2),
  );
  collar.position.y = -0.089;
  // THE GRAPHITE CORE, and the reason "no tip resolves" was a measurement, not taste:
  // the collar cone spans y −0.105…−0.073 and the core spanned −0.112…−0.100, so 0.005
  // of it — 0.9 CSS px at 768, 1.6 px at 1440 — ever emerged. A pencil whose whole
  // premise is "a pale bar ending in a dark tip" was shipping with no tip. Lengthened to
  // 0.030 and dropped clear of the collar, it reads at ~5 px on a phone and ~9 px at
  // 1440. MeshBasicMaterial keeps it at the graphite value in every rig, like the eyes.
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0044, 0.0016, 0.03, 6),
    new THREE.MeshBasicMaterial({ color: P.graphiteDark, fog: false }),
  );
  core.position.y = -0.119;
  // thumb notch: one short score where a small hand grips
  const notch = mark(
    [new THREE.Vector3(-0.013, 0.028, 0.007), new THREE.Vector3(0.013, 0.024, 0.007)],
    P.ink,
    'form',
  );
  // …and its two long edges, drawn. Everything else in the shot carries a contour and
  // the tool did not, which is most of why a pale bar read as a flat tan slab: it was the
  // one object on the page with no line on it.
  const edge = (x: number) =>
    mark(
      [
        new THREE.Vector3(x, 0.074, 0.006),
        new THREE.Vector3(x, -0.02, 0.006),
        new THREE.Vector3(x, -0.086, 0.006),
      ],
      P.ink,
      'form',
    );
  g.add(body, collar, core, notch, edge(-0.0122), edge(0.0122));
  return g;
}

/**
 * Solve the goblin's two ink shells for a viewport (goblin design §5.12).
 *
 * The rim is a SCREEN-SPACE quantity — that is the whole fix. A world-unit shell gives
 * a 6.3 : 1 weight spread across the shipped breakpoints and beads to under a pixel on
 * a phone; solving `GOB_RIM_PX / (pxPerUnit × rootScale)` per layout holds the same
 * 3.2 CSS px everywhere. Called wherever setPencilResolution already runs — the same
 * place, for the same reason: line weight is measured on the page, not in the world.
 *
 * Deliberately not routed through gobParts.pxPerUnit: gobParts imports this module.
 */
export function solveGoblinRim(goblin: Goblin, width: number, height: number): void {
  const f = heroFraming(width, height);
  const pxPerUnit = height / (2 * f.d * Math.tan((HERO_FOV * DEG) / 2));
  // the LIVE root scale, not the GOB_SCALE constant: solveGoblinScale below re-scales
  // him per breakpoint, and a rim solved against the constant would come out wrong by
  // exactly that factor on every phone.
  setGoblinRim(goblin, GOB_RIM_PX / (pxPerUnit * goblin.root.scale.x));
}

/** §11.2 / gate G7 — the phone scale bump, solved instead of assumed.
 *
 * "The Cover's stage solves HERO_GOB_SCALE so the projected figure height (soles → right
 * ear tip) is ≥ 52 CSS px at every breakpoint, capped at 1.35× the desktop scale." No
 * solve existed: `GOB_SCALE` was one constant and the gate printed the multiplier each
 * breakpoint would have needed (1.14× at 390×844, where he measured 45.5 px — the size
 * at which the walk called him "an unreadable dark smudge"). This is that solve.
 *
 * The projected height is linear in the scale for a uniform scale about his own root, so
 * one measure-and-divide is exact; it is re-checked once because the framing's own solve
 * is iterative. Called wherever solveGoblinRim is — and BEFORE it, because the rim reads
 * the scale this sets. */
export const GOB_SCALE_CAP = 1.35; // §11.2's cap on the bump, relative to the desktop scale
// …and the target it solves TO. G7's floor is 52 px; solving to exactly 52 makes the gate
// a coin-flip on the last float (it landed at 51.9997 and failed), and 52 px is the size
// the walk called "an unreadable dark smudge with one yellow dot" in the first place. 58
// needs 1.17× at 390×844 — comfortably inside the 1.35 cap, and it clears G13's island
// underside by 65 px there.
const GOB_TARGET_PX = 58;
export function solveGoblinScale(goblin: Goblin, width: number, height: number): void {
  const base = GOB_SCALE / 0.9;
  const cam = new THREE.PerspectiveCamera(HERO_FOV, width / Math.max(1, height), 0.1, 200);
  const f = heroFraming(width, height);
  cam.position.copy(f.position);
  cam.lookAt(f.look);
  cam.updateMatrixWorld();
  const v = new THREE.Vector3();
  const projectedHeight = () => {
    goblin.root.updateMatrixWorld(true);
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const m of goblinFillMeshes(goblin)) {
      const pos = m.geometry.getAttribute('position');
      // the figure is a skinned mesh, so the vertex has to be read through the POSE:
      // a raw position read measures the bind figure, which stands 4 % taller than the
      // working stoop this stage actually prints
      const sk = m as THREE.SkinnedMesh;
      for (let i = 0; i < pos.count; i++) {
        (sk.isSkinnedMesh ? sk.getVertexPosition(i, v) : v.fromBufferAttribute(pos, i))
          .applyMatrix4(m.matrixWorld)
          .project(cam);
        if (v.z > 1) continue;
        const py = ((1 - v.y) / 2) * height;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
      }
    }
    return y1 - y0;
  };
  goblin.root.scale.setScalar(base);
  for (let i = 0; i < 2; i++) {
    const h = projectedHeight();
    if (!(h > 0)) break;
    const want = Math.min(GOB_SCALE_CAP, Math.max(1, (GOB_TARGET_PX / h) * (goblin.root.scale.x / base)));
    goblin.root.scale.setScalar(base * want);
  }
  goblin.root.updateMatrixWorld(true);
}

/** The fill meshes the scale solve measures: no contour shells (they sit OUTSIDE the
 *  form), no strokes, no contact pool (it is ground, not silhouette — the same carve-out
 *  gobParts makes), and no prop. Deliberately local: gobParts imports this module. */
function goblinFillMeshes(goblin: Goblin): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  const stack: THREE.Object3D[] = [goblin.root];
  while (stack.length) {
    const o = stack.pop()!;
    if (!o.visible || o.userData.neverAlive === true || o.userData.prop === true) continue;
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (m.isMesh && m.isLineSegments2 !== true && mat?.userData?.role !== 'shell') {
      if (m.geometry?.getAttribute('position')) out.push(m);
    }
    for (const c of o.children) stack.push(c);
  }
  return out;
}

// ---- the goblin at the seam (hero §2) ---------------------------------------------
//
// LOCKED sculpted design, staged: 0.62 units tall, three-quarter to camera, head bent
// to the work, right glove out of the cloak holding the pencil at the next stroke.
function stageGoblin(): { goblin: Goblin; pencil: THREE.Group } {
  const goblin = buildGoblin();
  // DECISION (P4e, SUPERSEDES hero §2's staged 0.62 units — for the P5 ★ review):
  // the poster's premise is §1's sentence, and at 0.62 units the subject measured
  // ~80px at 1440 and a dark speck at 500 — no figure-weight contour, committed
  // cloak value or crisped shadow made "a goblin with a pencil" read at first
  // glance (P4d-T6, and this round's pass-1 walk confirmed it). 0.75 units keeps
  // the LOCKED design and proportions (a uniform scale, nothing redrawn) and buys
  // the ~20% of screen height that lets the silhouette, the bent head and the
  // pencil name themselves at every shipped framing.
  // §11.2's HERO_GOB_SCALE is solved per layout by solveGoblinScale (below and in
  // Hero.tsx's framing effect); this is only the base it solves from.
  goblin.root.scale.setScalar(GOB_SCALE / 0.9);
  // The blanket `weight(goblin.root, 'form')` that used to sit here is DELETED, not
  // moved. It retiered every stroke on the figure to one weight, which was right when
  // his interior separations were all 'form' by construction; the rebuilt figure authors
  // its own two tiers off the client's plates — the hood's front hem and the ear ticks
  // are pressed, the creases, brows, nose, mouth, belt and boot lines are dropped — and
  // flattening them is exactly the lost-and-found the reference asks for (§3.6).
  solveGoblinScale(goblin, 1440, 900); // …and the same for §11.2's per-breakpoint scale
  solveGoblinRim(goblin, 1440, 900); // a sane default until the first layout solve lands
  // ON the path at the seam's leading edge (SEAM_X 1.0), which is also the comp's
  // left third-line — hero §2's staging, pinned by hero.check's projection asserts
  goblin.root.position.set(0.95, 0, pathZ(0.95));
  // The hide-loop that used to sit here — "hide every root child but the pelvis" — is
  // DELETED (goblin design §8). It was written against the v1 nine-stroke contact()
  // hatch; what it actually does now is switch off his grounding, because the contact
  // pool is a root child too. The pool and the crossing cast shadow are two different
  // devices doing two different jobs, and the shot wants both.

  // THE WORKING STOOP, from the ONE table (goblin design §9.1). This block used to be
  // eighteen inline joint literals, which meant this staging, the reduced-motion still
  // and the poster bake each held their own copy of the pose. All three now read `REST`
  // and this stage owns placement and scale only — gate G10.
  //
  // Including `root.rotation.y` 1.60: §3.4 settled that the P4 "featureless dome" was a
  // VALUE failure, not a staging one — the shipped head was already at a 41° three-
  // quarter — so the restage is the head-turn inside REST (neck.y 0.16 + head.y 0.38),
  // and the body does not rotate.
  applyPose(goblin, REST);

  const pencil = buildPencil();
  pencil.userData.prop = true; // the §11.2 scale solve measures the FIGURE, not his kit
  weight(pencil, 'form'); // silhouetted against the ground, not a faint ghost
  // §2 mark 4 / §7's staging contract — THE PENCIL NOTCH. The tool used to lie 23% of
  // its projected length over his own painted mass (measured), which is the one thing
  // §7 forbids: "its full length crosses ground value and never his own cloak". Re-aimed
  // so the shaft leaves the mitt across the front of the work triangle and the tip comes
  // down onto the ground line — 0% of it now touches his silhouette at either breakpoint,
  // and it is 46° off the forearm, never parallel to a limb (the shipped lozenge merge).
  // Gripped at the top third: the wrist sits at pencil-local y +0.039 on a body that
  // spans −0.110 to +0.075.
  pencil.position.set(0.004, -0.09, 0.02);
  pencil.rotation.set(-0.55, 0.9, 1.4);
  // oversized in the mitt on purpose — his kit always is, and at poster framing a
  // true-scale pencil is four pixels of nothing. P4e (P4d-T6: at 1.9 it projected
  // ~20×5px — an object needs edges AND a value flip to read at that size, so the
  // dark body/pale collar recolour above rides a further step up): 2.3.
  pencil.scale.setScalar(2.3);
  goblin.armR.wrist.add(pencil);

  markAlive(goblin.root);
  markAlive(pencil);
  return { goblin, pencil };
}

// ---- the island (ASSETS island-card + seam-study) ---------------------------------

export interface Hero {
  root: THREE.Group;
  island: Island;
  rigs: Rigs;
  goblin: Goblin;
  pencil: THREE.Group;
  lanternGlow: THREE.Vector3; // where the amber point light parks
  glowSprite: THREE.Sprite | null; // the bloom — Hero.tsx clamps it at narrow widths
}

/**
 * Build the whole hero scene. Also stages the shared rig uniforms (seam, depth) —
 * call parkHeroRig() when the scene unmounts so the module singletons return to the
 * film's defaults.
 */
export function buildHero(): Hero {
  const root = new THREE.Group();
  stageHeroRig();

  // -- the card ---------------------------------------------------------------------
  // feather at anti-aliasing width ONLY (P4 fix round: even 0.05 left a pale halo all
  // around the rim — grass must MEET cut earth). The painted rim ring in the albedo
  // and the strata lip carry the edge; the "stops being drawn" read on the graphite
  // side comes from the rim contour's authored gap, never from alpha.
  const island = buildIsland({ radiusX: ISLAND_RX, radiusZ: ISLAND_RZ, feather: 0.012 });
  const albedo = bakeIslandAlbedo();
  if (albedo) {
    const groundMat = island.ground.material as THREE.MeshLambertMaterial;
    groundMat.map = albedo;
    groundMat.color.set(0xffffff); // the painting carries the colour
  } else {
    (island.ground.material as THREE.MeshLambertMaterial).color.set(P.grass);
  }
  // the island floats above its own page shadow — the sculpted underside needs air
  // (P4c: the keel now drips to y −0.79; the page sits below the drip point)
  island.shadow.position.y = -0.98;
  island.shadow.scale.set(ISLAND_RX * 1.32, ISLAND_RZ * 1.32, 1);
  root.add(island.root);

  // -- the sculpted edge (direction §3; P2-T1, re-cut a second time — FIX 3) --------
  // The P4b "stepped" bands were open-ended cylinders: FrontSide culling let the
  // lens see STRAIGHT THROUGH the skirt (bare paper between the ribbons) and the
  // keel's inward taper faced away from the 33° camera entirely — the island read as
  // hollow ribbons under a plate. The section is now three LATHE bands forming one
  // continuous SOLID skirt: each band's profile overlaps the next vertically (so
  // roughen() can never open a paper gap), the caveDark keel closes to a drip point
  // the silhouette actually shows, and every band is DoubleSide.
  const bandProfiles: { color: number; pts: [number, number][] }[] = [
    // [r, y] on the unit rim — earth lip, proud and near-vertical, meets the card
    { color: P.earth, pts: [[0.996, 0.004], [1.012, -0.055], [0.99, -0.125], [0.982, -0.175]] },
    // stone shelf, tucked up under the lip — pulled a committed step darker than the
    // earth lip (mixHex of two committed tokens): raw stoneWarm vs earth was a
    // 12-luma difference the walk read as one tan band
    { color: mixHex(P.stoneWarm, P.timberDark, 0.42), pts: [[0.998, -0.155], [0.962, -0.265], [0.93, -0.375]] },
    // the keel: a hand-cut slice tapering to the drip point. The upper run stays
    // near-vertical (≤ ~30° inward) so the 33°-elevation lens actually SEES caveDark
    // below the shelf before the silhouette turns under — a fast taper here hid the
    // whole stratum behind its own near skirt.
    { color: P.caveDark, pts: [[0.945, -0.35], [0.9, -0.52], [0.78, -0.63], [0.5, -0.71], [0.18, -0.77], [0, -0.79]] },
  ];
  for (const [i, band] of bandProfiles.entries()) {
    const geom = roughen(
      new THREE.LatheGeometry(band.pts.map(([r, y]) => new THREE.Vector2(r, y)), 72),
      [0.02, 0.03, 0.05][i], // the keel is the roughest cut — a smooth keel shaded
      // into an airbrush gradient in the walk; broken form reads as cut earth
      3.1,
      7 + i,
    );
    // P4e: the section shades in ONE near-horizontal family — strata are laid beds,
    // and the sheet basis keeps the ring from flipping direction around the rim
    const mat = createTrilayer({ color: band.color, wear: 0.18, stroke: { dir: 0.04, sheet: true } });
    mat.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(geom, mat);
    mesh.scale.set(ISLAND_RX, 1, ISLAND_RZ);
    root.add(mesh);
  }
  // two roots trailing off the near rim (hero §2) — bent, tapering limbs (the P4b
  // straight cones read as nails hammered through the island): three segments each
  // with an accumulating curl, plus a rootlet at the elbow. P4d (FIX: the two roots
  // were the frame's only bare smooth Lambert surfaces — table legs): every segment
  // carries its two drawn side contours (the trunkSide language at root scale) plus
  // short bark streak marks — ink + lighter painted streaks on the painted root,
  // pencil on the graphite one; the trilayer solid under them keeps the tone.
  const buildRoot = (seed: number, curl: number, lineHex: number, streakHex: number): THREE.Group => {
    const g = new THREE.Group();
    const radii = [0.075, 0.05, 0.028, 0.007];
    const lens = [0.3, 0.26, 0.2];
    // toward-camera bias in root-local space: the roots' yaws stay within ~±0.4 rad,
    // so a fixed local push keeps every mark proud of its own limb's depth
    const push = new THREE.Vector3(0.03, 0.03, -0.07);
    let parent: THREE.Object3D = g;
    for (let i = 0; i < 3; i++) {
      const seg = new THREE.Group();
      // top radius continues the parent segment's end radius — a mismatched joint
      // read as broken sticks in the walk; joints also overlap 6% for the bends
      const m = new THREE.Mesh(
        roughen(new THREE.CylinderGeometry(radii[i], radii[i + 1], lens[i], 7, 2), 0.008, 6, seed + i),
        // P4e (FIX 1, the graphite root inherited the zebra): the authored field
        // extends here — one steep grain direction per root, whole limb one family
        createTrilayer({ color: P.timberDark, wear: 0.2, stroke: { dir: 1.15 + curl * 0.12, sheet: true } }),
      );
      m.position.y = -lens[i] / 2;
      seg.add(m);
      for (const side of [-1, 1]) {
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 3; k++) {
          const t = k / 3;
          pts.push(
            new THREE.Vector3(side * (radii[i] + (radii[i + 1] - radii[i]) * t) * 1.04, -lens[i] * t, 0)
              .add(push),
          );
        }
        seg.add(mark(pts, lineHex, 'form'));
      }
      for (let sN = 0; sN < 2; sN++) {
        const sx = (brand() - 0.5) * radii[i];
        seg.add(
          mark(
            [
              new THREE.Vector3(sx, -lens[i] * (0.15 + 0.2 * sN), 0).add(push),
              new THREE.Vector3(sx * 0.6, -lens[i] * (0.55 + 0.25 * sN), 0).add(push),
            ],
            streakHex,
            'faint',
          ),
        );
      }
      seg.rotation.x = 0.2 + i * 0.12; // the curl: each joint bends further out
      seg.rotation.z = curl * 0.1 * i;
      parent.add(seg);
      if (i === 1) {
        const let1 = new THREE.Mesh(
          roughen(new THREE.ConeGeometry(0.018, 0.16, 6), 0.006, 7, seed + 9),
          createTrilayer({ color: P.timberDark, wear: 0.2, stroke: { dir: 1.15 + curl * 0.12, sheet: true } }),
        );
        let1.rotation.set(Math.PI * 0.92, 0, curl * 0.45);
        let1.position.set(curl * 0.04, -0.06, 0.03);
        seg.add(let1);
      }
      const next = new THREE.Group();
      next.position.y = -lens[i] * 0.94;
      seg.add(next);
      parent = next;
    }
    return g;
  };
  for (const [i, [x, z, yaw]] of ([
    [-0.92, -1.58, 0.35],
    [1.09, -1.5, -0.4],
  ] as const).entries()) {
    // the painted-side root draws in ink with lighter timber streaks (paint's own
    // bark language); the root under the frontier draws in pencil
    const graphiteSide = x > SEAM_X - SEAM_W;
    const tail = graphiteSide
      ? buildRoot(20 + i * 3, -1, P.graphiteDark, P.graphite)
      : buildRoot(20 + i * 3, 1, P.ink, P.timber);
    tail.position.set(x, -0.22, z);
    tail.rotation.y = yaw;
    root.add(tail);
  }
  // one dangling pebble under the graphite rim (hero §4) — near-front, in frame
  const pebble = buildRock(0.05, P.stoneWarm, 31);
  pebble.position.set(1.72, -0.5, -1.0);
  root.add(pebble);

  // the rim contour: a drawn edge that STOPS BEING DRAWN across the graphite left
  // (direction §3) — an open stroke, not a closed loop. P4c: the gap now spans the
  // WHOLE graphite rim (a 300°→80°), not just the lower-left: the undrawn upper-left
  // rim is where the brand block's type sits, and the old inked rim arc was the
  // measured worst-contrast pixel under both text lines.
  {
    const pts: THREE.Vector3[] = [];
    for (let a = 80; a <= 300; a += 7) {
      const t = (a * Math.PI) / 180;
      // P4d (FIX: the far-right rim line floated ~10px off the paint edge): jitter
      // 0.035 → 0.012 — the stroke pipeline's own wobble is the hand; a 1.75% radial
      // swing at RX 2.6 was ±7 screen px of float
      const j = 1 + (brand() - 0.5) * 0.012;
      pts.push(new THREE.Vector3(Math.cos(t) * ISLAND_RX * j, 0.012, -Math.sin(t) * ISLAND_RZ * j));
    }
    root.add(mark(pts, P.ink, 'form'));
  }
  // strata contours — the section drawn as contour lines, never any crossed
  // families (hero §4's geologist note). Graphite side: on the NEAR-left skirt
  // (the quadrant the lens sees below the drawn half), clear of the type column.
  // Painted side: the SAME boundaries in ink — the film's drawn-prop language;
  // without them the Lambert shade crushed earth/stone/keel into one gradient
  // (walked) and the section read as a bowl.
  for (const [y, rr, hex, a0, a1] of [
    [-0.15, 0.985, P.graphiteDark, 10, 75],
    [-0.36, 0.975, P.graphite, 10, 75],
    [-0.155, 0.98, P.ink, 96, 176],
    // the keel boundary rides PROUD of the keel top (r 0.975 vs 0.945): drawn at the
    // surface radius the roughen swallowed it (walked)
    [-0.36, 0.975, P.ink, 104, 170],
  ] as const) {
    const pts: THREE.Vector3[] = [];
    for (let a = a0; a <= a1; a += 6) {
      const t = (a * Math.PI) / 180;
      pts.push(new THREE.Vector3(Math.cos(t) * ISLAND_RX * rr, y, -Math.sin(t) * ISLAND_RZ * rr));
    }
    root.add(mark(pts, hex, 'form'));
  }
  // P4d (FIX: the underside skirt was markless): the section's own strokes carried
  // down the shelf into the keel top — short downward cut marks, one family, ink on
  // the painted quadrant and graphite on the drawn one, riding proud of the lathe
  // radius exactly like the boundary contours above. They live on the STONE SHELF's
  // mid value (ink dies on the caveDark keel — walked) and their tails just enter
  // the dark.
  for (let a = 14; a <= 170; a += 13) {
    const t = (a * Math.PI) / 180;
    const hex = a < 88 ? P.graphite : P.ink;
    const j = 0.9 + brand() * 0.2;
    root.add(
      mark(
        [
          new THREE.Vector3(Math.cos(t) * ISLAND_RX * 0.965, -0.16 - 0.06 * j, -Math.sin(t) * ISLAND_RZ * 0.965),
          new THREE.Vector3(Math.cos(t) * ISLAND_RX * 0.86, -0.38 - 0.1 * j, -Math.sin(t) * ISLAND_RZ * 0.86),
        ],
        hex,
        'form', // 'faint' vanished on the skirt's mid values (walked)
      ),
    );
  }

  // -- painted-territory props ------------------------------------------------------
  // the lantern stands by the path on the right third-line (hero §2's diagonal pair
  // with the goblin — the comp assertions in hero.check pin both projections). P4c:
  // at the NEAR rim (LANTERN_POS — see its decision comment) so the lit head reads
  // against its own pool and open grass, never against the pine's dark cone.
  const lantern = buildLantern();
  lantern.position.copy(LANTERN_POS);
  const lanternGlow = new THREE.Vector3(LANTERN_POS.x, 0.8, LANTERN_POS.z + 0.16);

  // near the path's painted start, in front of the brand block (the old far-side
  // berth put it exactly behind the tagline at the new comp)
  const signpost = buildSignpost();
  signpost.position.set(-0.15, 0, -0.9);
  signpost.rotation.y = 0.5;
  // freshly straightened: one support stone still out of place beside the base
  const strayStone = buildRock(0.06, P.stoneWarm, 12);
  strayStone.position.set(-0.3, 0.03, -0.72);
  strayStone.rotation.z = 0.6;

  // the caps-in-threes cluster at the lantern's foot (hero §2)
  const mushrooms = new THREE.Group();
  for (const [x, z, s] of [
    [-1.47, -1.14, 1],
    [-1.7, -1.2, 0.8],
    [-1.57, -1.28, 0.65],
  ] as const) {
    const m = buildMushroom(s);
    m.position.set(x, 0, z);
    mushrooms.add(m);
  }

  const paintedRock = buildRock(0.09, P.stoneCool, 3);
  paintedRock.position.set(-0.5, 0.045, -0.62);

  const foliage = bakeFoliage();
  const bark = bakeBark();
  const oak = buildTree('oak', foliage, bark, 1);
  oak.position.set(CASTERS[0].x, 0, CASTERS[0].z);
  oak.scale.setScalar(0.85); // a step smaller in the near foreground
  const pine = buildTree('pine', foliage, bark, 2);
  pine.position.set(CASTERS[1].x, 0, CASTERS[1].z);
  pine.scale.setScalar(1.05);
  // the two PAINTED crowns are the goblin's value competition — the §14 P1 gate is
  // "cloak mean luma ≤ the darkest painted crown − 0.12", so the measurement harness
  // (src/gobMeasure.ts) has to be able to find them without guessing at a bounding box
  oak.name = 'heroOak';
  pine.name = 'heroPine';

  const tuftA = buildTuft(P.grassDeep);
  tuftA.position.set(-2.1, 0, 0.9);
  const tuftB = buildTuft(P.grassDeep);
  tuftB.position.set(-0.32, 0, -1.05);

  root.add(lantern, signpost, strayStone, mushrooms, paintedRock, oak, pine, tuftA, tuftB);

  // the lantern's bloom — parked exactly at the glass (browser bake; see the builder)
  const glowSprite = buildGlowSprite();
  if (glowSprite) {
    glowSprite.position.copy(lanternGlow);
    root.add(glowSprite);
  }

  // -- graphite-territory props (the seam turns these to underdrawing) --------------
  // staged clear of the goblin's screen column, inside the portrait margin, and —
  // P4c — pulled DOWN-SCREEN (smaller z): the grove's crowns used to fill the upper
  // left of the frame, which is now the paper field the brand block sits on (FIX 4);
  // the graphite mass belongs to the LOWER-left anyway (hero §2's diagonal).
  // the grove is YOUNG — drawn small (0.62–0.66): full-height crowns anywhere left
  // of centre rise into the 38–48vh band the tagline/meta own; measured at the
  // shipped framing, these tips clear the meta-line's baseline with air
  const gTreeA = buildTree('oak', foliage, bark, 3, 'graphite');
  gTreeA.position.set(1.9, 0, -0.8);
  gTreeA.scale.setScalar(0.72);
  const gTreeB = buildTree('pine', foliage, bark, 4, 'graphite');
  // P4d (FIX 1 acceptance: the pine must be NAMEABLE): at (2.05, −0.95) the pine sat
  // almost exactly down the +18° view ray from the oak and vanished behind its mass
  // once the crowns carried tone — restaged a lateral half-stride so both graphite
  // trees read as their own forms; still inside the rim's 0.8 ellipse band and
  // below the type field.
  gTreeB.position.set(2.2, 0, -0.45);
  gTreeB.scale.setScalar(0.68);
  // just off the path one stride up from the goblin — clear of his screen column
  // (parked at his feet it stood exactly in front of him; P4 fix-round walk)
  const nextTree = buildHalfContouredTree();
  nextTree.position.set(1.42, 0, -0.45);
  const chest = buildChest();
  // at x 1.42 the wobbled seam's painted side caught its corner (walked half-painted
  // — §2 wants it WAITING as a drawing); 1.55 sits clear of the worst noise bow
  chest.position.set(1.55, 0, -1.15);
  chest.rotation.y = -0.4;
  chest.scale.setScalar(1.25);
  const gRock = buildRock(0.075, P.stoneWarm, 5);
  gRock.position.set(2.32, 0.038, -0.2);
  const gRockMarks = inkEdges(gRock.geometry, 22, P.graphiteDark, 'form');
  gRockMarks.position.copy(gRock.position);
  gRockMarks.scale.copy(gRock.scale);
  const gTuft = buildTuft(P.graphiteDark);
  gTuft.position.set(1.92, 0, -0.3);

  // the BARE PATH's contour (hero §2: "earthTrack where painted, bare contour where
  // not" — FIX 1: the unpainted path simply did not exist): two drawn edge lines
  // following the spine from under the paint frontier out to the rim, one family,
  // graphiteDark at form weight so they read at framing.
  const pathMarks = new THREE.Group();
  for (const off of [-0.26, 0.26]) {
    const pts: THREE.Vector3[] = [];
    // the FAR edge line stops short of its climb toward the rim — its last reach was
    // the one dark mark left under the meta-line's measured box
    for (let x = 0.72; x <= (off > 0 ? 2.1 : 2.42); x += 0.17) {
      pts.push(new THREE.Vector3(x, 0.012, pathZ(x) + off + Math.sin(x * 2.1) * 0.015));
    }
    pathMarks.add(mark(pts, P.graphiteDark, 'form'));
  }
  // …and the ruts' first light passes, stopping short — work in progress
  for (const off of [-0.09, 0.09]) {
    const pts: THREE.Vector3[] = [];
    for (let x = 1.05; x <= 1.9; x += 0.17) {
      pts.push(new THREE.Vector3(x, 0.012, pathZ(x) + off));
    }
    pathMarks.add(mark(pts, P.graphite, 'faint'));
  }

  // measure ticks along the unpainted path (hero §4) — the maker's own furniture
  const ticks = new THREE.Group();
  for (let x = 1.2; x <= 2.4; x += 0.3) {
    const z = pathZ(x) - 0.34;
    ticks.add(
      mark(
        [new THREE.Vector3(x, 0.012, z), new THREE.Vector3(x + 0.02, 0.012, z - 0.09)],
        P.graphiteDark,
        'form', // measure marks must survive the stroke field around them
      ),
    );
  }
  // construction ellipses on the graphite crowns (hero §4)
  const ellipses = new THREE.Group();
  ellipses.add(ellipseMark(1.9, 0.66, -0.8, 0.3, 0.26, P.graphiteLight, 'faint', Math.PI * 0.42));
  ellipses.add(ellipseMark(2.2, 0.56, -0.45, 0.26, 0.22, P.graphiteLight, 'faint', Math.PI * 0.46));

  root.add(gTreeA, gTreeB, nextTree, chest, gRock, gRockMarks, gTuft, pathMarks, ticks, ellipses);

  // -- the goblin, the pencil, the rigs ---------------------------------------------
  const { goblin, pencil } = stageGoblin();
  root.add(goblin.root);

  const rigs = createRigs();
  rigs.key.position.copy(KEY_POS); // ~35° from the lantern side — restaged (P3-T1)
  // shadow frustum tightened from the kit's ±8 to the island's span: sharper 1024 map
  // for the one shadow the shot is about (P3-T1 re-judged for the hero's real goblin)
  rigs.key.shadow.camera.left = -4.5;
  rigs.key.shadow.camera.right = 4.5;
  rigs.key.shadow.camera.top = 4.5;
  rigs.key.shadow.camera.bottom = -4.5;
  // P4e (P4d-T6: the crossing shadow measured a 6–8% wash): the one shadow the shot
  // is about gets a real map — 2048 over the tightened frustum, radius pulled to a
  // figure's own penumbra, and the committed rig.aliveShadow (stageHeroRig) lands it
  rigs.key.shadow.mapSize.set(2048, 2048);
  // 0.4, measured (goblin design §8, gate P6). §8 prescribed softening this to 1.5 and
  // that is the wrong direction — a drawn shadow has an EDGE. Swept live at 1440×900:
  // the P6 boundary probe reads 0.437 enc across 3.0 CSS px at 0.4, against 0.126 across
  // 4.5 px at 0.8. The radius is what buys the edge; aliveShadow buys the body.
  rigs.key.shadow.radius = 0.4;
  rigs.glow.position.copy(lanternGlow);
  // P4d (FIX: the glow's ground hotspot measured L247 yellow-green — brighter than
  // the glass itself): the point light's range windows down so the lamp sheds a
  // tight warm pool instead of sun-lighting the lawn; the painted amber pool in the
  // albedo carries the hue, the light only kisses it.
  rigs.glow.distance = 1.5; // P4e, measured live: at 2.0 the ground hotspot still
  // out-shone the glass; at 1.5 pool p95 = 212 under glass 237 with 0.6% of pool
  // pixels brighter — the lamp is the brightest warm thing (P4d-T5)
  // P3-T2/P3-T4 staging: warm sources on the painted side; only clear-throw casters
  rigs.markCaster(oak);
  rigs.markCaster(pine);
  root.add(rigs.root);

  return { root, island, rigs, goblin, pencil, lanternGlow, glowSprite };
}

/**
 * Stage the shared rig uniforms for the hero shot — the seam, by identity: trilayer,
 * island shadow and lights all read the same cut. Split out of buildHero so
 * StrictMode's effect cycle can re-stage after its own cleanup parked the rig.
 */
export function stageHeroRig(): void {
  rig.seamX.value = SEAM_X;
  rig.seamW.value = SEAM_W;
  rig.seamWob.value = SEAM_WOB;
  // depth languages tuned to the shot's ~9-unit camera distance (re-solved per
  // resize in Hero.tsx; these are the Node-visible defaults)
  rig.depthNear.value = 9;
  rig.depthFar.value = 24;
  // P4e: the sheet basis — organic props' authored strokes are laid in the LENS's
  // own view plane (the drawing's sheet), one continuous direction per prop
  rig.sheetX.value.set(Math.cos(HERO_AZ), 0, Math.sin(HERO_AZ));
  rig.sheetY.value.set(
    -Math.sin(HERO_ELEV) * Math.sin(HERO_AZ),
    Math.cos(HERO_ELEV),
    Math.sin(HERO_ELEV) * Math.cos(HERO_AZ),
  );
  // THE CROSSING SHADOW, solved against its own gate (goblin design §8, gate P6).
  //
  // §8 prescribed 0.45 → 0.62 and called that "a committed dark shape". It is not: swept
  // live at 1440×900 through window.__gob, the region mean measures
  //
  //   0.62 → 0.033 enc darker than the graphite field (edge 0.126 over 4.5 px)
  //   0.78 → 0.127                                     (edge 0.248 over 5.0 px)
  //   0.86 → 0.196                                     (edge 0.328 over 3.0 px)
  //   0.94 → 0.279                                     (edge 0.437 over 3.0 px)
  //   0.97 → 0.324 @1440 and 0.272 @390                (edge 0.494 over 3.0 px)  ← P6 PASSES
  //
  // against a gate of ≥ 0.25 with an edge ≥ 0.15 across ≤ 4 CSS px. 0.62 is not 60% of
  // the way there, it is 12% of the way there, because the term mixes toward ink in
  // LINEAR space and the encoded response near a mid field is steeply super-linear —
  // which is exactly why §8's number, chosen on the page rather than on the meter, read
  // as the wash the diagnosis measured. 0.94 is the first value that carries both halves
  // of the gate, and it is what makes his silhouette appear twice on the page: once in
  // colour, once as a drawn shadow. `heroLife`'s SETTLED.aliveShadow moves with it.
  rig.aliveShadow.value = 0.97;
}

/** Return the shared rig uniforms to the film's defaults (module singletons). */
export function parkHeroRig(): void {
  rig.seamX.value = 1e6;
  rig.seamW.value = 0.6;
  rig.seamWob.value = 0;
  rig.depthNear.value = 6;
  rig.depthFar.value = 26;
  rig.sheetX.value.set(1, 0, 0);
  rig.sheetY.value.set(0, 1, 0);
  rig.aliveShadow.value = 0.3;
  // P5's channels park too: the film's page is always fully drawn and untouched
  rig.birth.value = 1;
  rig.touchAmt.value = 0;
}
