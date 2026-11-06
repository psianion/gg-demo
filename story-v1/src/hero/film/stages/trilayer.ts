import * as THREE from 'three';
import { paper, ink, amberLantern } from '../palette.ts';
import { curtain } from '../curtain.ts';

// THE PAINTED TRILAYER (direction doc §7, §10) — one material, two truths.
//
// Every v2 world surface is a Lambert carrying three authored layers over one sculpted
// form: paint (gouache albedo, lit), underdrawing (the same form's graphite — flat
// paper light, a drawing casts and receives nothing), and edge-wear (a miniature
// painter's drybrush on silhouette edges). Performance↔Prep is a MATERIAL STATE, not a
// scene swap: the one curtain uniform — literally the same `{ value }` object the beat
// sheet tweens — mixes the composed paint side to the composed underdrawing side, so
// any partial curtain value is a held frame by construction and a scrub cannot pop.
//
// The two depth languages (direction §10) live here too, as rig-side uniforms:
//   Performance — fog-to-paper falloff: distance ramps the LIT result toward PAPER,
//     never grey. In-material, so an island on a bare page needs no scene fog.
//   Prep — line-weight falloff: no fog, no shading; far strokes go fainter with more
//     paper show-through, exactly as a pencil renders aerial perspective. And the
//     other half of §10: foreground occluders nearer than rig.silhouetteNear go
//     near-black silhouette — a shape in front of the drawing, not a drawing.
//
// ART GATES honoured by construction: the underdrawing is ONE stroke family (graphite
// marks of the same form's tone) + construction ghosts + the battle-grid watermark at
// <= GRID_INK toward ink. There is no second crossed family anywhere — no hatching.
// All three layers are procedural slot-fillers today; the slots are registered in
// docs/build/TEXTURES.md and swap to authored maps on approval.

// The battle-grid watermark's ink ceiling — asserted against a real framebuffer
// readback in the ?sandbox=island route, and by scripts/island.check.ts.
export const GRID_INK = 0.04;

// Rig-side uniforms, shared by identity across every trilayer material (and the island
// drop shadow). `curtain` IS the film's curtain object — the timeline drives the
// material with the tween it already runs.
export const rig = {
  curtain: curtain as THREE.IUniform<number>,
  depthNear: { value: 6 }, // world units — where each falloff begins
  depthFar: { value: 26 }, // …and where it lands on paper / faintest stroke
  grid: { value: 1 }, // watermark toggle (the sandbox measurement flips it)
  // direction §10, second half: under Prep, anything nearer than this goes near-black
  // silhouette — a foreground occluder is a shape, not a drawing. Configurable per
  // stage like depthNear/depthFar; the default sits under normal framing distances.
  silhouetteNear: { value: 2.5 },
  // The SEAM (hero doc §5): a spatial Performance↔Prep cut — fragments past seamX in
  // world x are the drawing, blended over seamW. The effective material state is
  // max(curtain, seam), so the global curtain and the hero's half-alive cut compose
  // instead of fighting. 1e6 = no seam; the whole page follows the curtain alone.
  seamX: { value: 1e6 },
  seamW: { value: 0.6 },
  // P4 hero (hero §4): the seam is the touch-reveal frozen mid-spread — an irregular
  // feathered bloom, never a ruler cut. World-unit amplitude of the boundary's bow;
  // 0 = straight (the film and sandbox default, so nothing shipped moves).
  seamWob: { value: 0 },
  // P4e: the SHEET basis — the drawing's own view plane, as two world-space axes.
  // Organic props opt in (per-material uTriSheet) and project their world position
  // onto THIS plane instead of a per-face plane, so one prop is one continuous param
  // space with one stroke family direction — a hand shades a whole tree in one
  // direction. Defaults are the world front plane; the hero stages its lens basis.
  sheetX: { value: new THREE.Vector3(1, 0, 0) },
  sheetY: { value: new THREE.Vector3(0, 1, 0) },
  // P4e: the alive-shadow strength on the drawing (was a 0.3 literal, pinned by
  // rigs.check). Promoted to a rig uniform so the hero can COMMIT the goblin's
  // seam-crossing shadow (hero §5's signature) without retuning the film's default.
  aliveShadow: { value: 0.3 },
  // P5 (hero §8): the underdrawing's BIRTH — the entrance fades the Prep-side result
  // up from bare paper while the ~78 authored strokes write themselves on, so the
  // tone arrives with the drawing instead of before it. 1 = fully drawn (the film
  // and every non-entrance frame; parkHeroRig restores it).
  birth: { value: 1 },
  // P5 (hero §9): the almost-touch — cursor world-pos + a screen-derived world radius
  // driving a ≤6% amber lift on the graphite half only. amt eases 250ms in / 400ms
  // out on the UI clock (heroLife); 0 = no lift, the film never moves it.
  touch: { value: new THREE.Vector3(0, 0, 0) },
  touchR: { value: 0.6 },
  touchAmt: { value: 0 },
};

// ---- the authored pencil bake (P4e, closes P4d-T1) --------------------------------
//
// The graphite tone carrier is no longer an analytic row field: 26 rows/unit with
// committed cores measured as MACHINE ruling (zebra bands, fingerprint swirls on the
// lobed crowns, a barcode chest — the ledgered ceiling of the procedural approach).
// Tone is now AUTHORED: thousands of individual pencil strokes drawn on a canvas —
// tapered ends, per-stroke pressure/width/length/grey jitter, angle variance within
// ~±7° of ONE family direction, strokes that rest and lift, rows that skip — baked
// into FOUR density tiers (one horizontal band each) that the shader samples by the
// same quantized tone the P4d value system verified. Density carries value, exactly
// as the art gate demands; what changed is that the marks are a hand's, not a rule's.
// Browser-only like the albedo bakes; Node stages simply carry a null sampler (no
// GLSL ever compiles there).
const STROKE_TILE_U = 1.6; // world units per tile repeat across the stroke direction
const STROKE_TILE_V = 0.4; // …and per band along it (each band is a 4:1 slice)
function bakeStrokeTiles(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 1024;
  const band = size / 4;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.lineCap = 'round';
  // deterministic hand — the same drawing on every load
  let s = 0x51ab3e7;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // one stroke: ~7 short segments with a tapered width envelope and a slow bow —
  // a lead laid down, pressed, and lifted. Drawn again at the wrap offsets when it
  // could cross a tile edge, so the band tiles seamlessly both ways.
  const stroke = (
    x0: number,
    y0: number,
    ang: number,
    len: number,
    w: number,
    alpha: number,
    grey: number,
  ) => {
    const n = 7;
    const bow = (rnd() - 0.5) * 0.25;
    const pad = len + w;
    const xs = x0 < pad || x0 > size - pad ? [-size, 0, size] : [0];
    const ys = y0 % band < pad || y0 % band > band - pad ? [-band, 0, band] : [0];
    ctx.strokeStyle = `rgba(${grey},${grey},${grey},${alpha})`;
    for (const ox of xs) {
      for (const oy of ys) {
        let px = x0 + ox;
        let py = y0 + oy;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const env = Math.min(1, Math.min(t, 1 - t) * 3.6 + 0.18); // tapered ends
          const a2 = ang + bow * (t - 0.5);
          const nx = px + Math.cos(a2) * (len / n);
          const ny = py + Math.sin(a2) * (len / n);
          ctx.lineWidth = w * env;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          px = nx;
          py = ny;
        }
      }
    }
  };
  // per-tier authoring: light tiers are sparse, grainy, often lifted; dark tiers
  // pack more passes, wider leads, harder pressure — clustered density IS the value
  const ROWS = 15; // ≈4.3 screen px of row pitch at the hero's 161 px/world-unit
  const rowChance = [0.55, 0.85, 0.95, 1.0];
  const passes = [1, 1, 2, 3];
  const wLo = [4.5, 6, 7, 9];
  const wHi = [7, 9.5, 11, 14];
  const aLo = [0.45, 0.55, 0.64, 0.8];
  const aHi = [0.68, 0.8, 0.9, 1.0];
  for (let k = 0; k < 4; k++) {
    const y0b = k * band;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y0b, size, band);
    ctx.clip();
    const pitch = band / ROWS;
    for (let p = 0; p < passes[k]; p++) {
      for (let r = 0; r < ROWS; r++) {
        if (rnd() > rowChance[k]) continue; // a whole row lifted off the paper
        const ry =
          y0b + (r + 0.5) * pitch + (rnd() - 0.5) * pitch * 0.55 + (p ? (rnd() - 0.5) * pitch : 0);
        let x = -rnd() * 140;
        while (x < size + 40) {
          const len = 80 + rnd() * (160 + 60 * k);
          const ang = (rnd() - 0.5) * 0.24; // hand variance, within ~±7°
          const grey = Math.round(16 + rnd() * 58);
          stroke(
            x,
            ry + (rnd() - 0.5) * 3,
            ang,
            len,
            wLo[k] + rnd() * (wHi[k] - wLo[k]),
            aLo[k] + rnd() * (aHi[k] - aLo[k]),
            grey,
          );
          // the lead travels on, or lifts and rests before the next stroke
          x += len * (0.82 + rnd() * 0.45) + (rnd() < 0.22 ? 40 + rnd() * 100 : 4 + rnd() * 16);
        }
      }
    }
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  // a MASK, not a colour: sampled raw (no colour-space transform) so the authored
  // pressure survives — an sRGB decode would eat every half-pressure mark
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping; // bands wrap by shader fract, never by sampler
  tex.flipY = false; // v counts canvas rows top-down, so band k IS tier k+1 (walked:
  // the default flip sampled tier 4 out of the near-empty tier-1 band)
  tex.anisotropy = 16; // grazing-angle samples smeared the strokes at 4 (walked at 4×)
  return tex;
}
const strokeTiles = bakeStrokeTiles();
// QA handle, the __hero/__island precedent: measure the bake instead of guessing
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__strokeTiles = strokeTiles;
}

const GLSL_PARS = /* glsl */ `
  varying vec3 vTriWorld;
  varying vec3 vTriLocal;
  varying vec3 vTriWorldN;
  uniform float uTriCurtain;
  uniform float uTriNear;
  uniform float uTriFar;
  uniform float uTriSilNear;
  uniform float uTriGrid;
  uniform float uTriGround;
  uniform float uTriAlive;
  uniform float uTriSeamX;
  uniform float uTriSeamW;
  uniform float uTriSeamWob;
  uniform float uTriWear;
  uniform float uTriFeather;
  uniform float uTriPoster;
  uniform float uTriFloor;
  uniform float uTriSheet;
  uniform float uTriStrokeDir;
  uniform float uTriStrokeScale;
  uniform float uTriAliveShadow;
  uniform float uTriBirth;
  uniform vec3 uTriTouch;
  uniform float uTriTouchR;
  uniform float uTriTouchAmt;
  uniform vec3 uTriAmber;
  uniform vec3 uTriSheetX;
  uniform vec3 uTriSheetY;
  uniform sampler2D uTriStrokes;
  uniform vec3 uTriPaper;
  uniform vec3 uTriInk;
  float triLum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  float triHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float triNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(triHash(i), triHash(i + vec2(1.0, 0.0)), u.x),
               mix(triHash(i + vec2(0.0, 1.0)), triHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

// Composed where Lambert hands its lit result to the canvas: `outgoingLight` and
// `normal` are in scope, `diffuseColor.a` is still to be consumed by opaque_fragment.
const GLSL_COMPOSE = /* glsl */ `
  {
    float triDist = length(vViewPosition);
    float triFade = smoothstep(uTriNear, uTriFar, triDist);

    // P4d (FIX: painted crowns): opt-in value POSTERIZATION — the lit result's
    // luminance quantizes to uTriPoster committed steps (hue kept), so a Lambert
    // ramp over a curved mass reads as decided value tiers, the way gouache is
    // actually mixed and laid, instead of an airbrush gradient. 0 = off (default;
    // only the tree crowns opt in). Paint side only by construction — the
    // underdrawing below never reads outgoingLight.
    // QUANTIZED IN THE ENCODED DOMAIN, not the linear one — the same correction this
    // file already makes 80 lines below for the underdrawing's tone ("linear luminance
    // crushes every mid and dark paint into the same low sliver"). It is the same bug in
    // the same file, and on the goblin it was total: his cloak's whole lit range is
    // ~0.004–0.05 linear, which is INSIDE the first bin at any poster count that keeps
    // the first bin above the ink floor, so the garment rendered as one flat plateau —
    // a 26-sample scan across the bell came back 46,46,46,45,45,46,46,46,46,47. There is
    // no value of uTriPoster that fixes that in linear: 80 steps would tier him and would
    // also put his darkest bin below the ink value. Gouache is mixed in perceptual steps, so the
    // quantization belongs there; a mid-value crown keeps roughly the tier count it had.
    // Wear is drybrush: silhouette edges lighten toward paper. It belongs to the painted
    // object, so it rides the paint side only — and it is composed BEFORE the poster, not
    // after, so the drybrush lands as a committed value STEP the way a dry brush actually
    // leaves one. Composed after (as it was) it laid a smooth 26% ramp over every tier
    // boundary, which is what stopped the tiers reading as tiers at all: the scan across
    // the goblin's bell crossed four poster bins and still measured one plateau, because
    // no two adjacent samples inside a bin agreed to 2/255.
    float triWearF = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.5);
    outgoingLight = mix(outgoingLight, uTriPaper, triWearF * uTriWear);
    if (uTriPoster > 0.5) {
      float triPl = max(triLum(outgoingLight), 1e-5);
      // THE DARKEST COMMITTED TIER (hero doc §4.5, "he must not read as a hole"). A
      // painted garment bottoms out at the darkest value that was mixed FOR it, not at
      // the paper's black. Without this the goblin's shade side lands at 0.11 encoded —
      // below ink — and gate P8 reads him as a hole in the Prep rig. 0 for everything
      // that does not opt in, so no other surface moves.
      float triPe = max(pow(triPl, 0.4545), uTriFloor);
      float triPq = (floor(triPe * uTriPoster) + 0.5) / uTriPoster;
      outgoingLight *= pow(triPq, 2.2) / triPl;
    }

    // The material state this fragment is in: the global curtain OR the spatial seam
    // (hero doc §5 — the half-alive cut), whichever has more Prep — zeroed outright
    // for alive-flagged entities, who keep their paint whatever the page does.
    // The seam COORDINATE wobbles (hero §4: an irregular bloom boundary, never a
    // straight clip): two octaves of world-space noise bow the cut by uTriSeamWob
    // world units. At the 0 default this is exactly the straight seam; the island
    // drop shadow keeps the straight cut, which hides inside its own blur.
    float triSeamC = vTriWorld.x
                   + (triNoise(vTriWorld.zy * 1.9 + 4.7) - 0.5) * uTriSeamWob
                   + (triNoise(vTriWorld.zx * 6.3) - 0.5) * uTriSeamWob * 0.35
                   + (triNoise(vTriWorld.zx * 14.0 + 9.3) - 0.5) * uTriSeamWob * 0.14;
    float triSeamF = smoothstep(uTriSeamX - uTriSeamW, uTriSeamX + uTriSeamW, triSeamC);
    // AUTHORED FRONTIER (P4 fix round; hero §4 "not a shader falloff alone"): inside
    // the blend band the wash breaks into pigment granules — drybrush catching the
    // paper tooth — so the paint ENDS in speckle instead of desaturating away. The
    // band factor is exactly zero outside the blend, so a parked seam (1e6) and the
    // global curtain are untouched by construction.
    float triSeamBand = triSeamF * (1.0 - triSeamF) * 4.0;
    // P4d (FIX: frontier as paint, not pixels): the saturating swing is kept from
    // P4c (amplitude 2.2+ closes the dead band), but the noise is now sampled
    // ANISOTROPICALLY — stretched ~5:1 along the ground brushwork's own flow
    // direction (the albedo's dab angle), so the blend commits in elongated
    // dab-shaped patches ~0.2 world units long instead of per-pixel crumbs: paint
    // visibly BREAKING into strokes. A fine isotropic octave keeps the dab edges
    // ragged. Exactly zero outside the band, as before.
    vec2 triFlowP = vec2(vTriWorld.z * 0.95 - vTriWorld.x * 0.31,
                         vTriWorld.x * 0.95 + vTriWorld.z * 0.31);
    float triDabN = triNoise(vec2(triFlowP.x * 26.0, triFlowP.y * 5.0) + 2.2)
                  + (triNoise(vTriWorld.zx * 47.0 + 8.1) - 0.5) * 0.4;
    triSeamF = clamp(triSeamF + (triDabN - 0.5) * 2.6 * triSeamBand, 0.0, 1.0);
    float triC = max(uTriCurtain, triSeamF) * (1.0 - uTriAlive);

    // ---- Performance: lit paint (wear + poster already composed) + fog-to-paper ----
    vec3 triPaint = mix(outgoingLight, uTriPaper, triFade); // ramps to PAPER, never grey
    // Wet media pools at its own frontier (hero §4): pigment sits slightly denser in
    // a narrow band on the painted side of the seam's leading edge. Exactly zero
    // wherever no seam is staged (seamX parks at 1e6, the smoothstep never opens).
    // …and NOT on the alive. The seam is a property of the PAGE — the frontier where the
    // painting stops — and an alive entity is exempt from it by construction (uTriAlive
    // zeroes triC above, hero doc §4.4: "he keeps his paint in every state"). These two
    // terms were the one place the seam still reached him: the goblin stands at x 0.95
    // against a seam at 1.0 with a 0.2 band, so the dried-edge multiply (×0.6) was
    // painting a wet-media tide-line across his own cloth. Measured, that band is what
    // took his darkest Prep-rig pixel to 0.153 encoded against gate P8's "no darker than
    // ink + 8/255" (0.165) — he read as a hole in a stripe he should never have carried.
    float triSeamPaint = 1.0 - uTriAlive;
    float triPool = (1.0 - triSeamF) * triSeamPaint
                  * smoothstep(uTriSeamX - uTriSeamW * 3.0, uTriSeamX - uTriSeamW * 0.4, triSeamC);
    triPaint = mix(triPaint, triPaint * vec3(0.86, 0.85, 0.9), triPool * 0.5);
    // …and the dried edge itself (P4 fix round): the dense pigment tide-line where
    // the wet frontier stopped, riding the wobbled seam coordinate — a visible line
    // of "work done up to here", broken by noise like pigment settling unevenly.
    float triEdgeD = abs(triSeamC - uTriSeamX + uTriSeamW * 0.35);
    float triEdge = (1.0 - smoothstep(0.02, 0.08, triEdgeD)) * (1.0 - triSeamF) * triSeamPaint;
    triPaint = mix(triPaint, triPaint * vec3(0.6, 0.58, 0.66),
                   triEdge * (0.52 + 0.35 * triNoise(vTriWorld.zy * 17.0)));

    // ---- Prep: the underdrawing — flat paper light, unlit by construction ----
    vec3 triUnder = uTriPaper;
    // Page furniture (grid + ghosts) lies UNDER the scene, so it exists only on
    // surfaces that opt IN as ground (the island card; uTriGround) AND face up — the
    // normal test alone still printed the grid on crate lids, which are up-facing but
    // are scene, not page.
    float triUpF = uTriGround * smoothstep(0.55, 0.8, normalize(vTriWorldN).y);
    // graphite strokes of the SAME form: the albedo's own tone laid down as ONE
    // stroke family with paper show-through in the gaps — never a crossed second.
    // Tone is measured in the ENCODED domain (pow 1/2.2): linear luminance crushes
    // every mid and dark paint into the same low sliver, and the whole diorama
    // drained into one ~7% band — perceptual tone keeps distinct paints distinct.
    float triT = clamp((pow(triLum(triAlbedo), 0.4545) - pow(triLum(uTriInk), 0.4545))
                 / max(pow(triLum(uTriPaper), 0.4545) - pow(triLum(uTriInk), 0.4545), 1e-4),
                 0.0, 1.0);
    // AUTHORED PENCIL (P4e, closes P4d-T1): the form tone QUANTIZES into four
    // committed tiers — the P4d value system, verified and unchanged — and each tier
    // renders as its band of the BAKED stroke tiles (see bakeStrokeTiles above):
    // hand-authored strokes with tapered ends, pressure, rests and lifted rows,
    // clustered denser in the dark tiers. Density carries the value in ONE family
    // direction per region; nothing crosses it. The analytic row field this replaces
    // measured as machine ruling (the ledgered ceiling of the procedural approach).
    // the band edges get a light hand-wobble so a tier boundary lands ragged, not
    // as a stair-step tracing the albedo's own edges (walked at 4×)
    float triTone = 1.0 - triT + (triNoise(vTriWorld.xz * 31.0) - 0.5) * 0.06;
    float triTier = step(0.14, triTone)
                  * clamp(floor((triTone - 0.14) * 6.25) + 1.0, 1.0, 4.0) * 0.25;
    // Projection: organic props opt into the rig's SHEET basis (uTriSheet) — one
    // continuous param space and one family direction for the WHOLE prop, the way a
    // hand shades a whole tree in one direction (the per-face flip was the P2c-T4
    // swirl). Planar faces keep the dominant-axis plane, hard-picked with NO
    // cross-plane blending — per-face direction is a draughtsman's box shading,
    // adjacent regions, never a crossed second family.
    vec3 triAn = abs(normalize(vTriWorldN));
    vec2 triPp = uTriSheet > 0.5
               ? vec2(dot(vTriWorld, uTriSheetX), dot(vTriWorld, uTriSheetY))
               : (triAn.y >= max(triAn.x, triAn.z) ? vTriWorld.xz
               : (triAn.x >= triAn.z ? vTriWorld.zy : vTriWorld.xy));
    // the prop's one drawing direction, then the tier's band of the authored tiles
    // §3.8, THE FIRST LAW, APPLIED TO THE TIER FIELD ITSELF. The stroke tile is laid in
    // WORLD units — STROKE_TILE_V / ROWS = 0.4/15 = 0.02667 u of row pitch — and that
    // number was solved ONCE, at the hero's 161 px/u, where it is 4.29 screen px. A class
    // framed much farther away projects the same pitch to a fraction of a pixel and the
    // rows alias into a woven grid, which is two families crossing inside one form. The
    // answer is the law's own, FEWER AND BIGGER: a class whose framing is distant lays its
    // rows bigger in world space so they land at the SAME screen pitch the tile was
    // authored for. stroke.scale is that factor, 1 by default, so every surface already
    // shipping is byte-identical. Measured per class at its own beat, never guessed.
    vec2 triPpS = triPp / max(uTriStrokeScale, 1e-3);
    vec2 triDirV = vec2(cos(uTriStrokeDir), sin(uTriStrokeDir));
    vec2 triSp = vec2(dot(triPpS, triDirV), dot(triPpS, vec2(-triDirV.y, triDirV.x)));
    float triMark = 0.0;
    if (triTier > 0.0) {
      vec2 triUv = vec2(triSp.x / ${STROKE_TILE_U.toFixed(2)},
                        (triTier * 4.0 - 1.0
                         + clamp(fract(triSp.y / ${STROKE_TILE_V.toFixed(2)}), 0.004, 0.996)) * 0.25);
      triMark = 1.0 - texture2D(uTriStrokes, triUv).r;
    }
    float triStroke = triMark
                    * (1.0 - triFade * 0.75); // line-weight falloff — Prep's distance language
    triUnder = mix(triUnder, mix(uTriPaper, uTriInk, 0.96), triStroke);
    // battle-grid watermark, capped at GRID_INK toward ink. Composed AFTER the strokes
    // so the enforced number IS the on-page number — strokes must not launder the cap
    // the framebuffer measurement reads back.
    vec2 triGp = abs(fract(vTriWorld.xz) - 0.5);
    float triGridLine = 1.0 - smoothstep(0.008, 0.022, min(triGp.x, triGp.y));
    triUnder = mix(triUnder, uTriInk, triGridLine * ${GRID_INK.toFixed(3)} * uTriGrid * triUpF);
    // construction ghosts: a faint compass ring every three units, one stray ellipse
    vec2 triCp = (fract(vTriWorld.xz / 3.0) - 0.5) * 3.0;
    float triGhost = 1.0 - smoothstep(0.015, 0.05, abs(length(triCp) - 0.95));
    triUnder = mix(triUnder, uTriInk, triGhost * 0.1 * triUpF);
    // direction §10, second half: foreground occluders go near-black silhouette —
    // nearer than uTriSilNear, the drawing gives way to a flat dark shape
    float triSil = 1.0 - smoothstep(uTriSilNear * 0.55, uTriSilNear, triDist);
    triUnder = mix(triUnder, uTriInk, triSil * 0.92);
    // The alive shadow crosses onto the drawing (hero doc §5): on the frozen page,
    // the only shadow that touches the graphite half belongs to what is alive.
    // Structural, not staged — at full curtain the shadow map holds only markAlive's
    // casters; the rig (stages/rigs.ts markCaster) releases the painted world's
    // casters with the paint. Under PARTIAL curtain a world shadow can tint this term
    // (≤ curtain·0.3 toward ink — ledgered P3-T3), and under a spatial seam with
    // paint up a world shadow can cross onto the graphite half (P3-T4, hero staging).
    // A soft graphite darkening, not a lit shadow. Strength is rig-side (P4e): the
    // film default stays 0.3; the hero commits the goblin's crossing shadow harder.
    triUnder = mix(triUnder, uTriInk, (1.0 - getShadowMask()) * uTriAliveShadow);
    // P5 (hero §8): the drawing's birth — the whole Prep result rises from bare paper
    // as the entrance writes the strokes on. 1 everywhere but the entrance.
    triUnder = mix(uTriPaper, triUnder, uTriBirth);
    // P5 (hero §9): the almost-touch — a ≤6% amber lift following the cursor over the
    // drawing. It lives on the Prep side ONLY (triUnder), so it can never paint:
    // the painted half's fragments take triPaint below regardless of the cursor.
    float triTouchD = distance(vTriWorld, uTriTouch);
    triUnder = mix(triUnder, uTriAmber,
                   (1.0 - smoothstep(uTriTouchR * 0.25, uTriTouchR, triTouchD))
                   * uTriTouchAmt * 0.06);

    outgoingLight = mix(triPaint, triUnder, triC);
  }
`;

export interface TrilayerOpts {
  color?: number; // paint-layer albedo (flat fill until the slot's real art lands)
  wear?: number; // edge-wear strength, 0..1
  feather?: number; // >0: alpha-feathered rim over the local unit circle (ground cards)
  ground?: boolean; // page furniture (grid + ghosts) opt-in — the island card only
  poster?: number; // >0: paint-side luminance quantizes to this many value steps
  // >0: the darkest COMMITTED tier, as an encoded luminance — the paint side never goes
  // below it (hero doc §4.5: a garment bottoms out at its own darkest mixed value, not
  // at the paper's black). Only meaningful with poster > 0.
  floor?: number;
  // P4e: the underdrawing's stroke authorship per prop — `dir` is the one family
  // direction (radians in the projection plane); `sheet` opts an ORGANIC prop into
  // the rig's view-plane basis so the whole prop shades in one continuous direction
  // `scale` multiplies the stroke tile's WORLD size (both the 1.6-u repeat across the
  // family and the 0.4-u band along it), so a class framed far from the lens can hold the
  // tile's authored 4.29-screen-px row pitch instead of aliasing into a grid. 1 = the
  // hero's own size, and is what every class that does not name it gets. See §3.8.
  stroke?: { dir?: number; sheet?: boolean; scale?: number };
}

/**
 * A trilayer surface material. All instances share the rig uniforms by identity and
 * compile to one program (the per-material knobs are uniforms too).
 */
export function createTrilayer({
  color = paper,
  wear = 0.22,
  feather = 0,
  ground = false,
  poster = 0,
  floor = 0,
  stroke,
}: TrilayerOpts = {}) {
  const material = new THREE.MeshLambertMaterial({ color });
  // The per-entity alive flag (P3): markAlive() flips this to 1 and the material keeps
  // its paint whatever the curtain/seam does — the material-state half of the rule the
  // film's mask pass carries. One uniform per material; the kit builds one material per
  // mesh, so marking a mesh never bleeds into a neighbour.
  material.userData.alive = { value: 0 };
  // Both depth languages are in-material (fog-to-paper / line-weight). Scene fog would
  // stack a second, differently-coloured ramp on top — and fog Prep, which has none.
  material.fog = false;
  if (feather > 0) material.transparent = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTriCurtain = rig.curtain;
    shader.uniforms.uTriNear = rig.depthNear;
    shader.uniforms.uTriFar = rig.depthFar;
    shader.uniforms.uTriSilNear = rig.silhouetteNear;
    shader.uniforms.uTriGrid = rig.grid;
    shader.uniforms.uTriSeamX = rig.seamX;
    shader.uniforms.uTriSeamW = rig.seamW;
    shader.uniforms.uTriSeamWob = rig.seamWob;
    shader.uniforms.uTriGround = { value: ground ? 1 : 0 };
    shader.uniforms.uTriAlive = material.userData.alive;
    shader.uniforms.uTriWear = { value: wear };
    shader.uniforms.uTriFeather = { value: feather };
    shader.uniforms.uTriPoster = { value: poster };
    shader.uniforms.uTriFloor = { value: floor };
    // the old dominant-axis family angle (atan 0.57/0.82) stays the default direction
    shader.uniforms.uTriStrokeDir = { value: stroke?.dir ?? 0.61 };
    shader.uniforms.uTriSheet = { value: stroke?.sheet ? 1 : 0 };
    shader.uniforms.uTriStrokeScale = { value: stroke?.scale ?? 1 };
    shader.uniforms.uTriSheetX = rig.sheetX;
    shader.uniforms.uTriSheetY = rig.sheetY;
    shader.uniforms.uTriAliveShadow = rig.aliveShadow;
    shader.uniforms.uTriBirth = rig.birth;
    shader.uniforms.uTriTouch = rig.touch;
    shader.uniforms.uTriTouchR = rig.touchR;
    shader.uniforms.uTriTouchAmt = rig.touchAmt;
    // the amber ramp's lantern tier — hero §9's lift hue, by token (the doc's #E89544
    // is palette.amberLantern's family; no re-inlined literal)
    shader.uniforms.uTriAmber = { value: new THREE.Color(amberLantern) };
    shader.uniforms.uTriStrokes = { value: strokeTiles };
    shader.uniforms.uTriPaper = { value: new THREE.Color(paper) };
    shader.uniforms.uTriInk = { value: new THREE.Color(ink) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriWorld;\nvarying vec3 vTriLocal;\nvarying vec3 vTriWorldN;')
      .replace(
        '#include <begin_vertex>',
        // objectNormal is in scope: Lambert's beginnormal_vertex runs before begin_vertex.
        // mat3(modelMatrix) is exact for the rotations + axis-aligned scales the kit
        // uses; normalized in the fragment before any test.
        '#include <begin_vertex>\nvTriWorld = (modelMatrix * vec4(position, 1.0)).xyz;\nvTriLocal = position;\nvTriWorldN = mat3(modelMatrix) * objectNormal;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_PARS)
      // getShadowMask() for the Prep-side alive shadow — chained here because its
      // sampler declarations live in shadowmap_pars_fragment, which sits after common
      .replace(
        '#include <shadowmap_pars_fragment>',
        '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>',
      )
      .replace(
        '#include <map_fragment>',
        /* glsl */ `#include <map_fragment>
        vec3 triAlbedo = diffuseColor.rgb;
        // painted feathered rim — the card fades into the page (local unit circle)
        diffuseColor.a *= 1.0 - smoothstep(1.0 - max(uTriFeather, 1e-3), 1.0, length(vTriLocal.xy))
                        * step(1e-4, uTriFeather);
        // The invisible tail of the feather must not write DEPTH: the curtain pass inks
        // depth discontinuities, and a depth footprint at the geometric circle would
        // draw a hard contour ring around an edge that "simply stops being drawn"
        // (direction §3). Chosen over depthWrite:false because the card is the ground —
        // the main pass still needs it to occlude anything sunk below it. NOTE the
        // curtain prepass renders through a scene.overrideMaterial, which bypasses this
        // shader entirely — that gap is ledgered (FINDINGS P2c-T1) for the P7 wire-in.
        if (diffuseColor.a < 0.01) discard;`,
      )
      .replace('#include <opaque_fragment>', GLSL_COMPOSE + '\n#include <opaque_fragment>');
  };
  // every trilayer compiles to the same program — the knobs are uniforms
  material.customProgramCacheKey = () => 'trilayer';
  material.userData.role = 'trilayer';
  return material;
}
