// MOCK — the drawn-mark kit shared by the cast-and-effects classes (rows 9, 13, 23).
//
// Owned by the same author as cloth.ts / fire.ts / marks.ts and imported by all three.
// It carries exactly the vocabulary those rows need and that hero.ts keeps private:
// the shot's view-plane basis, the two-token mix, a deterministic hand, and — the one
// piece with no precedent — a way to MERGE authored strokes so a four-tick spall is
// one draw instead of four.
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { polyline, paint, STROKE_LAYER, type Weight } from '../pencil.ts';
import { HERO_AZ, HERO_ELEV } from '../heroView.ts';
import { shotView } from './foliageKit.ts';
import * as P from '../palette.ts';

// One basis-from-camera formula for both kits (§4.4) — see `shotView` in `foliageKit.ts`.
export { shotView };

// ---- the shot's view plane (hero.ts:658–673, re-derived — those consts are private)
//
// Every transient mark and every cast contour in this film is authored in the plane
// THIS lens sees, exactly as a draughtsman draws what the sheet will show. Defaults to
// the hero's own lens, exactly like `foliageKit.ts`'s `VIEW_R`/`VIEW_CAM`/`setView`.
export const VIEW_R = new THREE.Vector3();
export const VIEW_UP = new THREE.Vector3(0, 1, 0);
/** Toward the camera — a push along this wins the depth test without moving on screen. */
export const VIEW_CAM = new THREE.Vector3();

/**
 * POINT THE HAND AT A DIFFERENT LENS (§3.6). A builder sets the shot's basis, builds its
 * marks, then calls `setMarksView()` with no argument to hand the hero's lens back.
 * `VIEW_R`/`VIEW_CAM` stay the same two objects, so every importer keeps reading them by
 * identity — mirrors `foliageKit.ts`'s `setView`.
 */
export function setMarksView(az: number = HERO_AZ, elev: number = HERO_ELEV): void {
  VIEW_R.set(Math.cos(az), 0, Math.sin(az));
  VIEW_CAM.set(
    Math.sin(az) * Math.cos(elev),
    Math.sin(elev),
    -Math.cos(az) * Math.cos(elev),
  );
}
setMarksView();

/** A point in the view plane: `h` right, `v` up, `push` toward the lens. */
export function vp(o: THREE.Vector3, h: number, v: number, push = 0): THREE.Vector3 {
  return o
    .clone()
    .addScaledVector(VIEW_R, h)
    .addScaledVector(VIEW_UP, v)
    .addScaledVector(VIEW_CAM, push);
}

// ---- palette + hand ---------------------------------------------------------------

/** The painter's two-token mix (hero.ts:294–298). No colour here is ever a fresh hue. */
export const mixHex = (a: number, b: number, t: number) => {
  const ch = (h: number, s: number) => (h >> s) & 255;
  const m = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};

/** Deterministic, so the drawing is identical on every load and every scrub. */
export function hand(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- authored marks ---------------------------------------------------------------

/** One drawn mark: a wobbled polyline through view-plane points, painted `hex`. */
export function mark(pts: THREE.Vector3[], hex: number, w: Weight = 'form'): LineSegments2 {
  return paint(polyline(pts, w), { line: hex });
}

/**
 * A three-point tick — the monster's shag word (cast doc §1.6), which this film reuses
 * for spall, landing dust and the flame's fringe. `a` is its own angle in the view
 * plane, so a clump of these is never a parallel family: no-hatch by construction.
 */
export function tick(
  o: THREE.Vector3,
  a: number,
  len: number,
  hex: number,
  w: Weight = 'hero',
  bow = 0.22,
  push = 0.06,
): LineSegments2 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const n = [-s, c] as const; // the tick's own normal, so the bow is across the mark
  return mark(
    [
      vp(o, 0, 0, push),
      vp(o, c * len * 0.55 + n[0] * len * bow, s * len * 0.55 + n[1] * len * bow, push),
      vp(o, c * len, s * len, push),
    ],
    hex,
    w,
  );
}

/** A drawn arc in the view plane. angle 0 = screen-right, π/2 = up (hero.ts:677–701). */
export function arc(
  o: THREE.Vector3,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  hex: number,
  w: Weight = 'form',
  push = 0.15,
  seed = 11,
): LineSegments2 {
  const rnd = hand(seed);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = a0 + ((a1 - a0) * i) / 16;
    const j = 1 + (rnd() - 0.5) * 0.06;
    pts.push(vp(o, Math.cos(a) * rx * j, Math.sin(a) * ry * j, push));
  }
  return mark(pts, hex, w);
}

/**
 * MERGE authored strokes into ONE LineSegments2 — the piece the pencil module does not
 * export and the reason a four-tick spall would otherwise cost four draws.
 *
 * `polyline()` has already run the wobble/overshoot pipeline; `LineSegmentsGeometry`
 * stores the result as one interleaved [start.xyz, end.xyz] buffer per segment, so
 * concatenating those buffers is loss-free — the hand survives the merge. Inputs must
 * share a weight and a colour (they share a material by construction then).
 */
export function mergeStrokes(lines: LineSegments2[]): LineSegments2 {
  const flat: number[] = [];
  for (const l of lines) {
    const attr = l.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute;
    const a = attr.data.array as ArrayLike<number>;
    for (let i = 0; i < a.length; i++) flat.push(a[i]);
    l.geometry.dispose();
  }
  const geom = new LineSegmentsGeometry();
  geom.setPositions(flat);
  const out = new LineSegments2(geom, lines[0].material);
  out.computeLineDistances();
  out.layers.set(STROKE_LAYER);
  return out;
}

/** Merge a class's meshes into one BufferGeometry. Instancing is banned (gate 4). */
export function mergeAt(
  parts: { geom: THREE.BufferGeometry; m: THREE.Matrix4 }[],
): THREE.BufferGeometry {
  const list = parts.map(({ geom, m }) => geom.clone().applyMatrix4(m));
  // merge needs one uniform attribute set — `uv1` and stray channels arrive unevenly
  // from lathes, spheres and extrusions, and a mismatched channel drops the whole merge.
  // KEEP THE INTERSECTION rather than a fixed whitelist: the old code dropped `uv`
  // outright, which silently made a mapped merged class impossible — row 9's cloth bake
  // arrived and rendered as nothing at all until this was found. `color` survives the
  // same way: it is how one merged geometry carries a whole value ramp on one material.
  const keep = Object.keys(list[0].attributes).filter((k) => list.every((x) => x.attributes[k]));
  for (const g of list) {
    for (const k of Object.keys(g.attributes)) if (!keep.includes(k)) g.deleteAttribute(k);
  }
  // LEVEL THE INDEX STATE. `mergeGeometries` refuses a mixed set outright, and the set
  // goes mixed the moment a class puts an ExtrudeGeometry or a marching-cubes surface
  // (both non-indexed) beside a lathe or a sphere (both indexed) — which is exactly what
  // row 22's ravens do. plankKit's `merge` already levels; this one did not, and the
  // failure surfaced as "hide: threw: mergeAt: geometries would not merge" on the route.
  const mixed = list.some((x) => !x.index);
  const level = mixed ? list.map((x) => (x.index ? x.toNonIndexed() : x)) : list;
  const merged = mergeGeometries(level, false);
  for (const g of list) g.dispose();
  for (const g of level) if (g !== merged && !list.includes(g)) g.dispose();
  if (!merged) throw new Error('mergeAt: geometries would not merge');
  merged.computeVertexNormals();
  return merged;
}

/** A tapered limb from `a` to `b` — a sleeve, a grip, a laid log. */
export function limb(
  a: THREE.Vector3,
  b: THREE.Vector3,
  rA: number,
  rB: number,
  seg = 8,
): { geom: THREE.BufferGeometry; m: THREE.Matrix4 } {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  return {
    geom: new THREE.CylinderGeometry(rB, rA, len, seg, 1, false),
    m: new THREE.Matrix4().compose(
      new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
      new THREE.Quaternion().setFromUnitVectors(VIEW_UP, dir.normalize()),
      new THREE.Vector3(1, 1, 1),
    ),
  };
}

/** A local transform, as a matrix — the merge bakes transforms into vertices. */
export function at(
  pos: [number, number, number],
  rot: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1],
): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...scale),
  );
}

// ---- the spindle — the one geometry the whole attack layer is made of (row 23) --------
//
// A bolt or a flash is a brush stroke someone loaded and pulled: fat one third along and
// tapering to a point at BOTH ends, which is what a loaded brush leaves on paper and what
// a cone or a capsule never does.
export const SPINDLE: [number, number][] = [
  [0.001, 0.0], [0.35, 0.12], [1.0, 0.3], [0.72, 0.55], [0.4, 0.78], [0.001, 1.0],
];
const SPINDLE_C = new THREE.Color();
const spindleLin = (hex: number) => SPINDLE_C.set(hex).toArray() as [number, number, number];

/** A spindle of `len`, laid along +Y, with the flameCore heart at its fat point. */
export function spindleGeom(len: number, maxR: number): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    SPINDLE.map(([r, y]) => new THREE.Vector2(r * maxR, y * len)),
    12,
  );
  const pos = g.getAttribute('position');
  const col = new Float32Array(pos.count * 3);
  // flameCore only where the brush was loaded, amber through the belly, amberEmber out to
  // both points — a single flameCore run came back a pale peach smear on paper.
  const heart = spindleLin(P.flameCore);
  const body = spindleLin(P.amber);
  const tail = spindleLin(P.amberEmber);
  for (let i = 0; i < pos.count; i++) {
    const v = pos.getY(i) / len;
    const k = Math.min(1, Math.abs(v - 0.3) / 0.22); // hot only within ±0.22 of the belly
    const b = v > 0.3 ? tail : body;
    for (let c = 0; c < 3; c++) col[i * 3 + c] = heart[c] + (b[c] - heart[c]) * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Lay a +Y spindle along `dir`, centred so its tail sits at `tail`. */
export function alongAxis(tail: THREE.Vector3, dir: THREE.Vector3): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    tail.clone(),
    new THREE.Quaternion().setFromUnitVectors(VIEW_UP, dir.clone().normalize()),
    new THREE.Vector3(1, 1, 1),
  );
}

/**
 * ROW 23 · THE IMPACT — three marks landing on one frame, authored in the current view
 * plane (call `setMarksView(az, elev)` for the shot before building, `setMarksView()`
 * after): a permanent strike stroke (0.25 u, ramps up and never back down), 4 spall ticks
 * at per-tick angles (never parallel — no-hatch by construction), and 3 spindle flashes at
 * 0.35 u laid out as three flicks of a hand, never a radial rosette. `graphiteDark` for the
 * strike and the spall; the flash rides the shared flame material's amber ramp.
 *
 * The group's own origin IS the strike point — callers place the impact in the world with
 * `group.position.set(x, y, z)`. `angle` is the incoming travel direction in the view
 * plane (0 = screen-right); default is the S1 volley's own authored launch→strike vector
 * (`mock/marks.ts`'s `travel`), so a caller with no direction of its own still gets the
 * row's authored geometry. `material` is the shared flame material (`fire.ts`'s
 * `createFlameMaterial()`) for the flash — taken as a parameter, not imported here,
 * because `fire.ts` itself imports from this module (`mixHex`, `mark`, `vp`, …) and an
 * import the other way would be a circular one.
 *
 * `opts.scale` (W3c fix, W3-V2) — a uniform multiplier on the whole impact's read size,
 * for a caller whose camera sits far enough back that the row's authored lengths land
 * under row 23's 5-10 px (@500) spall floor. Applied on an INNER group so it never
 * touches `buildImpact`'s own internal ratios (strike:spall:flash stay exactly as
 * authored) and never fights a caller's `group.scale` animation tween (`timeline.ts`
 * ramps the OUTER returned group's `.scale` to an absolute `{1,1,1}`; a caller-visible
 * multiplier baked onto that same property would be overwritten the instant the ramp
 * lands). Default 1 — every other call site (pathProps x2, montage x1) is unaffected.
 */
export function buildImpact(opts: {
  angle?: number;
  material: THREE.Material;
  scale?: number;
}): THREE.Group {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  inner.scale.setScalar(opts.scale ?? 1);
  g.add(inner);
  const strike = new THREE.Vector3(0, 0, 0);
  const inAngle = opts.angle ?? Math.atan2(-1.28, 2.0);

  // a · the strike mark. PERMANENT: its ramp goes 0→full and never comes back down.
  const strikeMark = mark(
    [
      vp(strike, Math.cos(inAngle) * -0.13, Math.sin(inAngle) * -0.13, 0.1),
      vp(strike, Math.cos(inAngle) * 0.12, Math.sin(inAngle) * 0.12, 0.1),
    ],
    P.graphiteDark,
    'hero',
  );
  strikeMark.name = 'marks:strike';

  // b · the spall — FOUR ticks, each at its own angle, never parallel.
  const refl = inAngle + Math.PI;
  const spall = mergeStrokes(
    [-0.72, -0.24, 0.3, 0.86].map((d, i) =>
      tick(strike, refl + d, 0.16 + (i % 3) * 0.05, P.graphiteDark, 'hero', 0.18 - i * 0.06, 0.1),
    ),
  );
  spall.name = 'marks:spall';

  // c · the flash — THREE flicks of a hand, never a radial rosette. The same spindle
  // BufferGeometry as the bolt, at 0.35 u, on the amber ramp.
  const flash = new THREE.Mesh(
    mergeAt(
      ([[0.55, 0.24, 0.46, 0.03], [1.9, 0.11, 0.3, 0.022], [3.35, 0.18, 0.38, 0.026]] as const).map(
        ([a, out, len, wide], i) => {
          const dir = new THREE.Vector3()
            .addScaledVector(VIEW_R, Math.cos(a))
            .addScaledVector(VIEW_UP, Math.sin(a));
          return {
            geom: spindleGeom(len, wide),
            m: alongAxis(
              strike.clone().addScaledVector(dir, out).addScaledVector(VIEW_CAM, 0.08 + i * 0.01),
              dir,
            ),
          };
        },
      ),
    ),
    opts.material,
  );
  flash.name = 'marks:flash';
  flash.renderOrder = 3;

  inner.add(strikeMark, spall, flash);
  return g;
}
