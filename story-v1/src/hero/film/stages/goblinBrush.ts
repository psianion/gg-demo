import * as THREE from 'three';

// ===================================================================================
// HIS BRUSHWORK — the PAINT side's authored marks
// ===================================================================================
//
// THE COMPLAINT, MEASURED. Beside an island built from ~2000 authored dabs he read as
// smooth. A live framebuffer scan across his cowl at the shipped hero framing
// (1430×864, figure 76 × 97 CSS px) returned FORTY-EIGHT CONSECUTIVE PIXELS OF LUMA 96
// — one number, no marks. A 220 × 60 patch of the island's grass in the SAME FRAME
// returned 171 distinct values with no value owning more than 8.9% of it. That is the
// whole gap, and it is a gap in one place only: the paint side.
//
// WHY THE FILM'S EXISTING STROKE TILES COULD NOT REACH HIM. trilayer.ts bakes a real
// authored pencil field, but it is composed into `triUnder` — the UNDERDRAWING half —
// and he is markAlive, so `triC = max(curtain, seam) * (1 - alive)` is 0 in every state
// and `triUnder` is never mixed in. He stays painted always (the client's decision), so
// every mark he will ever show has to live on `triPaint`. The island's paint side is
// worked by CANVAS-BAKED ALBEDO MAPS (hero.ts's bakeIslandAlbedo / bakeFoliage / bakeBark
// through `mapped()`), and that is the language this file matches. Copied, not invented:
// the seeded hand, the tapered stroke with a bow, the wrap-safe redraw at the tile edges,
// the three separated value tiers, the sparse coverage that lets the laid-in ground show.
//
// WHY A MAP ON `color` ALONE WOULD HAVE DONE NOTHING, and what carries it instead.
// goblin.ts's header records the measurement: the hero's key is BEHIND him, so his
// camera-facing side receives the cool hemisphere and nothing else, and `tone()` answers
// that by putting the pigment's shade value in the EMISSIVE — for the cloth, emissive is
// 94% of the rendered luminance and the Lambert term is 6%. A `map` multiplies only that
// 6%. So the tile goes on `emissiveMap` AND `map`: one pigment layer modulating both
// terms, which is also the honest story — a heavier load of paint is heavier whichever
// way the light falls — and it keeps the marks identical front and back, where the key
// swaps which term dominates.
//
// WHY THE POSTER IS THE INSTRUMENT, NOT THE OBSTACLE. The brief's hard constraint is that
// the brushwork must live WITHIN his committed tiers and must not add values or ramp
// them. `uTriPoster` quantizes the lit result to POSTER plateaux AFTER the maps have
// multiplied, so every value this file can produce is one of his own committed tiers, by
// construction — a stroke does not paint a new value, it moves a patch of surface from
// one committed tier to the next. That is what gouache does and it is why the amplitude
// below is solved in BINS rather than chosen by eye.
//
// THE AMPLITUDE, SOLVED. The poster works in gamma-2.2 space, so a relative luminance
// change dL/L moves the encoded value by de = (1/2.2)·e·(dL/L) and crosses
//   bins = de / (1/POSTER) = (POSTER/2.2) · e · (dL/L)
// plateaux. `e` is the material's own committed tier, and his tiers run 0.235 (the cowl's
// cave) to 0.838 (the linen) — a 3.6× spread. ONE amplitude would therefore give the
// linen three and a half times the mark the cave gets: two-bin noise on a 3-px pale band
// and nothing at all in the cowl's interior. So the amplitude is solved per tier for a
// constant BINS_PP and snapped to three buckets, which are three passes of ONE drawing at
// three pressures — the same hand pressing harder, never a different hand.
//
// SCREEN-SPACE ARITHMETIC (hero.ts P4c's first law, re-done for him). He ships 97 CSS px
// tall at 1430×864 over 0.75 world units of figure = 148 px per world unit. The tile spans
// BRUSH_SPAN world units at TILE texels, so 1 texel = BRUSH_SPAN·148/TILE CSS px = 0.121.
// A mark must therefore be authored ≥ 66 texels long (8 CSS px) and ≥ 17 texels wide (2 CSS
// px) to survive AT FRAMING; the strokes below are 70–140 × 14–30. At the study route's 6×
// the same mark is 48–96 px long and 10–20 wide, which is a brush mark and not decoration.
//
// ONE FAMILY, ONE DIRECTION. Every stroke in the tile runs along the tile's +v axis, and
// goblin.ts emits a uv whose v follows each form's own length — down the cloth's hang,
// along the arm's run, along the ear's blade. Nothing crosses inside a tile, so nothing
// can cross on a face. Where a form's family is not its long axis (the wound linen, the
// belt strap, the cheek) the TEXTURE is rotated, and by exactly the angle that form's
// underdrawing already uses: `rot = π/2 − dir`, off goblin.ts's own DIR_* constants. The
// paint and the graphite therefore draw the same figure in the same directions, which is
// the only reason two mechanisms can be one hand.
// ===================================================================================

const TILE = 512;

/** World units the tile spans, in BOTH axes. goblin.ts emits its uv in world units, so
 *  this one number is the brush's size everywhere on him — a painter carries one brush
 *  round a figure, and the cloth, the ear and the boot get the same mark because of it. */
export const BRUSH_SPAN = 0.42;

/** The poster count goblin.ts commits to. Repeated here rather than imported so the
 *  amplitude solve can be read on its own; `assertPoster` below fences the two together. */
const POSTER = 20;

/**
 * Peak-to-peak travel a stroke gets, in committed tiers.
 *
 * WALKED UP FROM A WRONG ANSWER, TWICE. At 1.35 the live census still found one value
 * owning 15% of him: 1.35 tiers peak-to-peak is ±0.67 from the middle, and a fragment
 * sitting near its plateau's CENTRE never reaches a boundary, so the poster quantized the
 * whole swing back to where it started. 2.0 broke the hero open (longest identical run
 * 47 px → 21) but left the FRONT PLATE flat, because dead-on the Lambert term barely
 * varies and every fragment on the tunic sits at the same place in the same bin — one
 * amplitude, one answer, all over. 2.4 is where both read: on the hero the longest run
 * lands 23 px against the island grass's 21 in the same frame, and the front plate's
 * tunic carries marks.
 *
 * It is still bounded by the tiers themselves. 2.4 peak-to-peak is ±1.2 plateaux, so a
 * mark reaches the NEXT committed value and only the extreme of the range touches the one
 * past it — which is what the reference's own cloth does, five committed tiers across an
 * encoded span of 0.196, adjacent values, never a jump. The brushwork moves the surface
 * BETWEEN his committed tiers; the poster leaves it no way to invent one.
 */
const BINS_PP = 2.4;

/** The three pressures. A bucket is the authored peak-to-peak of the tile's own value
 *  BEFORE the mean is divided back out; see `variant`. */
const BUCKETS = [0.3, 0.48, 0.68] as const;

// ---- the bake ----------------------------------------------------------------------

/** A deterministic hand — the same painting on every load, hero.ts's `brand()` idiom. */
function hand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The master tile, authored ONCE at full pressure. Bytes are read raw (the texture
 * declares NoColorSpace, trilayer.ts's own choice for its stroke tiles: "a MASK, not a
 * colour"), so a byte IS a linear multiplier on the pigment — 255 is bare cloth taking
 * the full committed tier, 0 would be a full stop of pigment. The three shipped
 * pressures are made from this one drawing by `variant`.
 */
function bakeMaster(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = TILE;
  const ctx = cv.getContext('2d')!;
  const rnd = hand(0x1d7c9a3);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // q is the mark's PIGMENT LOAD: 0 = the heaviest stroke in the family, 1 = bare.
  const g = (q: number) => Math.round(255 * Math.max(0, Math.min(1, q)));
  const rgba = (q: number, a: number) => `rgba(${g(q)},${g(q)},${g(q)},${a})`;

  // the laid-in ground: the value the whole tile sits at before a mark is made. Not
  // white — a painter lays a tone and then works both ways out of it, which is the only
  // way a multiply map can carry marks LIGHTER than the surface as well as darker.
  ctx.fillStyle = rgba(0.62, 1);
  ctx.fillRect(0, 0, TILE, TILE);

  /** One stroke: seven segments with a tapered width envelope and a slow bow — a loaded
   *  brush laid down, pressed and lifted. Redrawn at the wrap offsets whenever it could
   *  cross a tile edge, so the tile repeats in both axes with no seam. Angle is measured
   *  from +v (canvas +y), which is the form's own long axis. */
  const stroke = (x0: number, y0: number, ang: number, len: number, w: number, q: number, a: number) => {
    const n = 7;
    const bow = (rnd() - 0.5) * 0.3;
    const pad = len + w;
    const xs = x0 < pad || x0 > TILE - pad ? [-TILE, 0, TILE] : [0];
    const ys = y0 < pad || y0 > TILE - pad ? [-TILE, 0, TILE] : [0];
    ctx.strokeStyle = rgba(q, a);
    for (const ox of xs) {
      for (const oy of ys) {
        let px = x0 + ox;
        let py = y0 + oy;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const env = Math.min(1, Math.min(t, 1 - t) * 3.4 + 0.2);
          const a2 = ang + bow * (t - 0.5);
          const nx = px + Math.sin(a2) * (len / n);
          const ny = py + Math.cos(a2) * (len / n);
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

  // PASS 1 — the under-painting. Broad soft masses running with the family, so the GROUND
  // is itself a worked field and not one number. This pass is the difference between the
  // first attempt and this one: with a flat ground and 35% dab coverage, 65% of his cloth
  // stayed on exactly one plateau and the live census still showed a single value owning
  // 15% of him. The poster turns these into large committed patches — form, not texture —
  // and the dabs then work on top of a surface that already moves.
  for (let i = 0; i < 22; i++) {
    stroke(
      rnd() * TILE,
      rnd() * TILE,
      (rnd() - 0.5) * 0.18,
      260 + rnd() * 240,
      54 + rnd() * 64,
      rnd() < 0.5 ? 0 : 1,
      0.3 + rnd() * 0.24,
    );
  }

  // PASS 2 — the dab family, in three separated value tiers a luminance sample can pull
  // apart (hero.ts's ground brushwork, same three). Rows across u with rests and lifted
  // rows; ±7° of hand variance inside ONE direction.
  //
  // THE ASPECT IS THE ISLAND'S. 95–175 texels long by 17–31 wide is 5.6 : 1 — measured
  // off hero.ts's own ground dabs (30–64 px by 6–14, i.e. 5 : 1) — and 11.6–21.3 CSS px
  // by 2.1–3.8 at the shipped framing against the island's 12–26 by 2–5. The first pass
  // ran 8 : 1 and the back plate read fibrous, like wood grain rather than gouache; the
  // stroke got shorter and wider by the same factor rather than either alone, so the
  // mark's SIZE on the page did not move.
  // DENSITY IS WHY THE FIRST TRY LOOKED LIKE SCRATCHES AND THE ISLAND LOOKS LIKE PAINT.
  // Judged at 6× with his cloth and the island's grass in one frame: thirteen rows over
  // three passes overlapped into continuous vertical streaks, where the grass keeps every
  // dab discrete — visible ends, visible gaps, the base tone owning the space between. So
  // the rows come down to nine over two passes with longer rests, which is hero.ts's own
  // ~22% coverage rather than near-total.
  const ROWS = 8; // pitch ≈ 64 texels ≈ 7.8 CSS px at the hero's 148 px/world-unit
  const pitch = TILE / ROWS;
  for (let p = 0; p < 2; p++) {
    for (let r = 0; r < ROWS; r++) {
      if (rnd() > [0.95, 0.62][p]) continue; // a whole row lifted off the surface
      const rx = (r + 0.5) * pitch + (rnd() - 0.5) * pitch * 0.7 + p * pitch * 0.4;
      let y = -rnd() * 200;
      while (y < TILE + 40) {
        const len = 95 + rnd() * 80;
        const tier = rnd();
        // the three tiers are separated from the GROUND as well as from each other — at
        // 0.46 the mid tier sat on top of a 0.58 ground and contributed nothing
        const q = tier < 0.38 ? rnd() * 0.08 : tier < 0.7 ? 0.32 + rnd() * 0.16 : 0.93 + rnd() * 0.07;
        // COMMITTED. The first pass laid these at 0.5–0.9 alpha over a ground already
        // near the mean, and the composite ate the amplitude: the strongest dab measured
        // a −10% multiplier where the solve had asked for −19%, i.e. 0.43 tiers of travel
        // instead of a whole one, and the poster then quantized every mark away. A gouache
        // stroke is opaque where the brush is loaded, so it is laid opaque here and the
        // GAPS between marks — not their transparency — are what lets the ground show.
        stroke(
          rx + (rnd() - 0.5) * pitch * 0.55,
          y,
          (rnd() - 0.5) * 0.24,
          len,
          17 + rnd() * 14,
          q,
          0.86 + rnd() * 0.14,
        );
        // the brush travels on, or lifts and rests before the next mark
        y += len * (0.9 + rnd() * 0.4) + (rnd() < 0.4 ? 70 + rnd() * 170 : 14 + rnd() * 34);
      }
    }
  }

  // PASS 3 — the dry flecks. Short, narrow, and at the two ENDS of the value range: the
  // tooth of the paper catching a half-loaded brush. They are the highest-contrast marks
  // in the tile, so they are the last thing to survive at the 500-px breakpoint.
  for (let i = 0; i < 44; i++) {
    stroke(rnd() * TILE, rnd() * TILE, (rnd() - 0.5) * 0.3, 44 + rnd() * 54, 8 + rnd() * 8, rnd() < 0.5 ? 0 : 1, 0.7 + rnd() * 0.3);
  }
  return cv;
}

let master: HTMLCanvasElement | null | undefined;

export interface Brush {
  tex: THREE.Texture;
  /** What the pigment must be multiplied by so the tile's MEAN lands the material back on
   *  the committed tier `tone()` solved for. Without it every brushed surface drops by
   *  the tile's mean and the whole figure would read a tier and a half darker. */
  gain: number;
}

/** bucket -> the pressed drawing, its measured mean, and the ONE texture every direction
 *  of that pressure is cloned from. three keys the GPU upload on `texture.source` and
 *  `Texture.copy` shares the source by reference, so eleven directions of three pressures
 *  are three uploads — `info.memory.textures` says so. Building a fresh CanvasTexture per
 *  direction instead took the count from 8 to 19 (measured), for the same eleven images. */
const variants = new Map<number, { cv: HTMLCanvasElement; mean: number; base: THREE.Texture }>();
/** bucket|rot -> the clone. Transform is per-texture; the image is not. */
const textures = new Map<string, THREE.Texture>();

/**
 * The master drawing at one pressure. `A` is the authored peak-to-peak: a byte b becomes
 * 255·(1 − A·(1 − b/255)), i.e. the same marks with the value range squeezed toward bare.
 * Pressing the ONE drawing keeps every bucket the same hand — three different bakes would
 * be three different painters working on one figure.
 */
function variant(A: number) {
  const hit = variants.get(A);
  if (hit) return hit;
  if (master === undefined) master = bakeMaster();
  if (!master) return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = TILE;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(master, 0, 0);
  const img = ctx.getImageData(0, 0, TILE, TILE);
  const d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const b = 255 - A * (255 - d[i]);
    d[i] = d[i + 1] = d[i + 2] = b;
    sum += b;
  }
  ctx.putImageData(img, 0, 0);
  const base = new THREE.CanvasTexture(cv);
  // raw bytes: a mask, not a colour. An sRGB decode would bend the multiplier and the
  // amplitude solve would be wrong by the transfer. (trilayer.ts's own choice, copied.)
  base.colorSpace = THREE.NoColorSpace;
  base.wrapS = base.wrapT = THREE.RepeatWrapping;
  // 16, trilayer.ts's own number for the same reason: he is staged at 43° and the cowl's
  // sides are near edge-on, where a lower anisotropy smeared the strokes into a wash —
  // visible against the island's crisp dabs in the 6× comparison frame.
  base.anisotropy = 16;
  const out = { cv, mean: sum / (TILE * TILE * 255), base };
  variants.set(A, out);
  return out;
}

/** Snap a solved amplitude to the nearest shipped pressure. */
const bucketOf = (a: number) =>
  BUCKETS.reduce((best, b) => (Math.abs(b - a) < Math.abs(best - a) ? b : best), BUCKETS[0]);

/**
 * The brush for one material.
 *
 * `tier` is the material's own committed encoded value — the mid-point of the (unlit, lit)
 * pair `tone()` is solved against — and it is what sets the amplitude, because a fixed
 * relative change in luminance crosses `(POSTER/2.2)·tier` plateaux and his tiers span
 * 0.235 to 0.838. `dir` is the form's underdrawing family angle (goblin.ts's DIR_*), and
 * the texture is rotated by π/2 − dir so the paint's family and the graphite's are the
 * same family. Node stages carry a null brush and keep today's flat tiers exactly.
 */
export function brushFor(tier: number, dir: number): Brush | null {
  // solve the authored amplitude for a constant peak-to-peak in tiers, then undo the
  // mean-division the gain will apply (a tile of mean m swings A/m once compensated)
  const want = (BINS_PP * 2.2) / (POSTER * Math.max(0.05, tier));
  const A = bucketOf(want / (1 + want / 2));
  const v = variant(A);
  if (!v) return null;
  const rot = Math.PI / 2 - dir;
  const key = `${A}|${rot.toFixed(3)}`;
  let tex = textures.get(key);
  if (!tex) {
    tex = v.base.clone();
    // uv arrives in WORLD UNITS, so the repeat is literally "one tile per BRUSH_SPAN
    // units" and the mark is the same size on the cloth, the ear and the boot
    tex.repeat.set(1 / BRUSH_SPAN, 1 / BRUSH_SPAN);
    tex.rotation = -rot; // rotating the SAMPLE frame by −rot turns the MARK by +rot
    textures.set(key, tex);
  }
  return { tex, gain: 1 / v.mean };
}

/** Fence: the amplitude solve above is written against goblin.ts's poster count. */
export function assertPoster(n: number): void {
  if (n !== POSTER) throw new Error(`goblinBrush: POSTER ${POSTER} != goblin.ts ${n}`);
}

// QA handle, the __hero / __strokeTiles precedent: measure the bake instead of guessing.
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__gobBrush = { variants, textures, BRUSH_SPAN, BUCKETS };
}
