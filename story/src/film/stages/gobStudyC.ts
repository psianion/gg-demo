import * as THREE from 'three';
import { createTrilayer } from './trilayer.ts';
import { paint, polyline, roughen } from '../pencil.ts';
import * as P from '../palette.ts';

// STUDY C — "THE INFLATED DRAWING".
//
// The shipped figure is a stack of closed primitives — a lathe bell, a sphere skull,
// extruded ear wedges, blob mitts, bone cylinders — each with its own silhouette. The
// eye reads the joins, so the eye reads ASSEMBLY. Nothing about materials fixes that.
//
// This study inverts the order of operations. The character is authored ONCE, as a
// single closed 2D outline — the line an illustrator would draw — and the solid is
// derived FROM that line: the interior is inflated along the camera's own axis by an
// authored girth field, gouged by authored creases, and closed front-to-back into ONE
// watertight manifold. There is no second object anywhere on him. Arms, ears, hem and
// skull are lobes of the same outline, so mass flows from one into the next and the
// silhouette is DESIGNED rather than emergent.
//
// Three consequences the technique buys for free, and they are the whole argument:
//
//   1. THE SILHOUETTE IS EXACT. The inflation runs along `CAM` (subject → camera), so
//      moving a vertex in depth cannot move it on screen: screen-x is exactly `u` and
//      screen-y is exactly `0.8386·v`, independent of z. The rendered outline IS the
//      drawn outline, and the authored ink contour registers on it to the pixel.
//   2. ONE STROKE FAMILY BY CONSTRUCTION. One mesh, one trilayer, one `stroke.dir`.
//      The no-hatching gate cannot be violated — there is no second surface to cross.
//   3. ONE DRAW CALL for the body, against the shipped figure's 64.
//
// He still has to be a SOLID: the key sits 56° off the lens (measured below), so a
// cut-out would collapse under it. The girth field, the front/back asymmetry, the
// depth shear that turns the drawing into a three-quarter, the carved creases and the
// island's own `roughen()` are what make the Lambert read as form rather than as a
// lit sticker.
//
// Known ceiling: the inflation axis is the hero lens. He is a poster figure, correct
// from the shot he was drawn for and progressively sheared away from it. Posing and a
// second camera are the next round's problem, by the brief.

// ---- the shot, copied (never imported — this module owns its own constants) ---------
const DEG = Math.PI / 180;
const HERO_AZ = 18 * DEG; // stages/hero.ts HERO_AZ
const HERO_ELEV = 33 * DEG; // stages/hero.ts HERO_ELEV
// world.ts REST.rootY — the study route copies the shipped goblin's quaternion onto
// whatever we return, so the drawing basis is expressed back through it.
const PARENT_YAW = 1.6;

const YAXIS = new THREE.Vector3(0, 1, 0);
/** subject → camera, unit. */
const CAM = new THREE.Vector3(
  Math.sin(HERO_AZ) * Math.cos(HERO_ELEV),
  Math.sin(HERO_ELEV),
  -Math.cos(HERO_AZ) * Math.cos(HERO_ELEV),
);
/** screen-right, unit and horizontal (up × CAM — three's own lookAt basis). */
const SCR_R = new THREE.Vector3(0, 1, 0).cross(CAM).normalize();

// THE DRAWING BASIS, in the root's own (yawed) local frame.
//   u → screen-right, exactly.   v → world up.   z → toward the camera.
// He is a real standing figure: `v` is world-vertical, so the proportion sheet is rig
// -native and his feet are on the ground. `z` runs up the view ray, which is what makes
// the silhouette exact and lets an ink mark be pushed forward with zero screen drift.
const LU = SCR_R.clone().applyAxisAngle(YAXIS, -PARENT_YAW);
const LV = YAXIS.clone();
const LN = CAM.clone().applyAxisAngle(YAXIS, -PARENT_YAW);

/** (u, v, z) in the drawing → a position in the root's local frame. */
function W(u: number, v: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
  return out.set(
    LU.x * u + LV.x * v + LN.x * z,
    LU.y * u + LV.y * v + LN.y * z,
    LU.z * u + LV.z * v + LN.z * z,
  );
}

// ---- the drawing --------------------------------------------------------------------
//
// Rig units, H = 0.9 (soles → crown, ears out), soles at v = 0, u = 0 at the heels.
// HE FACES SCREEN-LEFT (−u), into the unpainted half — his body sits near profile to
// the lens and only the head turns back toward us. Everything below is the outline, in
// screen-clockwise order, as one continuous line: crown → face → the working arm and
// its notch → hem → boots → hem flick → back → the two ear blades → crown.
//
// The rhythm rules the shape is fitted to, because they are what a stack of primitives
// cannot have: no two curves share a radius; no spacing repeats; the only straight run
// is the sole. Every re-entrant corner is a piece of authored negative space.

type V2 = { u: number; v: number };

function outlinePath(): THREE.Path {
  const p = new THREE.Path();
  // crown-front, and down the brow
  p.moveTo(-0.175, 0.758);
  p.bezierCurveTo(-0.216, 0.752, -0.240, 0.730, -0.247, 0.668);
  // the brow's overhang, then the nose — the two fastest curvature changes on him
  p.quadraticCurveTo(-0.255, 0.652, -0.234, 0.636);
  p.bezierCurveTo(-0.246, 0.606, -0.292, 0.586, -0.298, 0.542);
  p.quadraticCurveTo(-0.284, 0.518, -0.254, 0.510);
  p.quadraticCurveTo(-0.248, 0.498, -0.259, 0.486);
  // chin
  p.bezierCurveTo(-0.272, 0.466, -0.260, 0.428, -0.236, 0.416);
  // THE KEYHOLE — jaw under, back to the throat, then out again to the chest front
  p.quadraticCurveTo(-0.208, 0.392, -0.184, 0.380);
  p.bezierCurveTo(-0.172, 0.356, -0.204, 0.336, -0.220, 0.316);
  // THE WORKING ARM leaves the body front — one lobe of the same line
  p.bezierCurveTo(-0.248, 0.302, -0.284, 0.284, -0.292, 0.250);
  p.bezierCurveTo(-0.304, 0.220, -0.322, 0.196, -0.320, 0.168);
  p.bezierCurveTo(-0.334, 0.146, -0.338, 0.130, -0.330, 0.114);
  p.quadraticCurveTo(-0.322, 0.094, -0.302, 0.092);
  p.quadraticCurveTo(-0.282, 0.096, -0.280, 0.114);
  // …and back up its underside: this edge is the top of the work triangle
  p.bezierCurveTo(-0.284, 0.148, -0.272, 0.176, -0.262, 0.206);
  p.bezierCurveTo(-0.250, 0.236, -0.228, 0.256, -0.204, 0.266);
  // the cloak front, down to the hem lip
  p.bezierCurveTo(-0.198, 0.212, -0.218, 0.148, -0.228, 0.102);
  p.quadraticCurveTo(-0.234, 0.080, -0.212, 0.068);
  // the forward boot, out from under the hem
  p.quadraticCurveTo(-0.194, 0.058, -0.182, 0.054);
  p.bezierCurveTo(-0.184, 0.038, -0.196, 0.026, -0.194, 0.014);
  p.quadraticCurveTo(-0.172, 0.002, -0.148, 0.006);
  p.quadraticCurveTo(-0.128, 0.018, -0.124, 0.046);
  p.lineTo(-0.114, 0.064);
  // the notch between the boots — the hem's underside dips between them
  p.quadraticCurveTo(-0.082, 0.086, -0.052, 0.062);
  // the trailing boot, rolled onto its toe
  p.quadraticCurveTo(-0.046, 0.044, -0.038, 0.028);
  p.quadraticCurveTo(-0.014, 0.008, 0.010, 0.012);
  p.quadraticCurveTo(0.040, 0.016, 0.044, 0.040);
  p.quadraticCurveTo(0.054, 0.058, 0.058, 0.072);
  // the hem's back sweep, widest behind him
  p.bezierCurveTo(0.098, 0.076, 0.126, 0.076, 0.146, 0.084);
  // THE HEM FLICK — the counterweight, and the tail of the line of action
  p.bezierCurveTo(0.190, 0.078, 0.216, 0.084, 0.232, 0.106);
  p.bezierCurveTo(0.214, 0.122, 0.188, 0.126, 0.170, 0.124);
  // up the back: the satchel's bulge is the one break in the bell's back curve
  p.bezierCurveTo(0.160, 0.166, 0.162, 0.200, 0.150, 0.234);
  p.bezierCurveTo(0.174, 0.272, 0.168, 0.306, 0.148, 0.328);
  p.bezierCurveTo(0.128, 0.366, 0.116, 0.394, 0.094, 0.416);
  p.bezierCurveTo(0.078, 0.446, 0.058, 0.478, 0.048, 0.510);
  p.bezierCurveTo(0.038, 0.556, 0.028, 0.598, 0.028, 0.636);
  // THE NEAR EAR (his left, camera-side): the wide, low, swept blade
  p.bezierCurveTo(0.094, 0.668, 0.186, 0.748, 0.222, 0.836);
  p.bezierCurveTo(0.186, 0.828, 0.098, 0.756, 0.036, 0.712);
  // THE FAR EAR (his right): the tall, clean apex — the highest point of the figure
  p.bezierCurveTo(0.058, 0.798, 0.104, 0.908, 0.124, 0.990);
  p.bezierCurveTo(0.096, 0.936, 0.028, 0.858, -0.038, 0.808);
  // the crown, closing the line
  p.bezierCurveTo(-0.086, 0.794, -0.140, 0.784, -0.175, 0.758);
  return p;
}

const OUTLINE: V2[] = outlinePath()
  .getPoints(9)
  .map((p) => ({ u: p.x, v: p.y }));

// ---- the girth field ----------------------------------------------------------------
//
// What turns the line into a body. Each ORGAN is an elliptical region of influence
// carrying a plateau depth `g`, a roll-off distance `t` (how far in from the outline
// the surface reaches full depth — small = a carved, hard-shouldered form; large = a
// round one), a back multiplier `b` (a nose has no back; a cloak's back is fuller than
// its front) and a depth offset `dz`. Blended by a soft weight, so girth changes
// CONTINUOUSLY across the figure — the arm thins into the sleeve, the skull swells out
// of the cowl. That continuity is the difference between grown and bolted.

type Organ = { u: number; v: number; ru: number; rv: number; g: number; t: number; b?: number; dz?: number };

const ORGANS: Organ[] = [
  { u: -0.092, v: 0.612, ru: 0.20, rv: 0.17, g: 0.128, t: 0.108, b: 0.92 }, // skull
  { u: -0.246, v: 0.544, ru: 0.09, rv: 0.09, g: 0.070, t: 0.048, b: 0.35 }, // muzzle
  { u: -0.214, v: 0.646, ru: 0.08, rv: 0.06, g: 0.096, t: 0.044, b: 0.55 }, // brow
  { u: 0.140, v: 0.760, ru: 0.15, rv: 0.13, g: 0.024, t: 0.014, b: 1.0, dz: 0.048 }, // near ear
  { u: 0.062, v: 0.872, ru: 0.11, rv: 0.14, g: 0.021, t: 0.013, b: 1.0, dz: -0.030 }, // far ear
  { u: -0.048, v: 0.398, ru: 0.16, rv: 0.10, g: 0.124, t: 0.082, b: 1.06 }, // cowl / yoke
  { u: -0.052, v: 0.290, ru: 0.17, rv: 0.11, g: 0.140, t: 0.078, b: 1.08 }, // chest
  { u: -0.020, v: 0.150, ru: 0.22, rv: 0.10, g: 0.158, t: 0.070, b: 1.08 }, // bell
  { u: -0.020, v: 0.074, ru: 0.24, rv: 0.05, g: 0.146, t: 0.042, b: 1.06 }, // hem lip
  { u: 0.200, v: 0.100, ru: 0.08, rv: 0.05, g: 0.028, t: 0.018, b: 0.9 }, // hem flick
  { u: -0.262, v: 0.262, ru: 0.09, rv: 0.09, g: 0.046, t: 0.032, b: 0.95 }, // upper arm
  { u: -0.294, v: 0.170, ru: 0.07, rv: 0.08, g: 0.040, t: 0.028, b: 0.95 }, // forearm
  { u: -0.306, v: 0.106, ru: 0.07, rv: 0.06, g: 0.052, t: 0.036, b: 0.95 }, // mitt
  { u: -0.156, v: 0.030, ru: 0.09, rv: 0.05, g: 0.058, t: 0.034, b: 0.9 }, // forward boot
  { u: -0.004, v: 0.028, ru: 0.09, rv: 0.05, g: 0.056, t: 0.034, b: 0.9 }, // trailing boot
];

/** The three-quarter, as DEPTH. His front (low u) leans toward the lens; the shear is
 * stronger through the head than the body, which is exactly the acting note — the body
 * is near profile to the work and only the head turns back to us. */
function shearAt(v: number): number {
  return 0.22 + 0.34 * smooth(0.34, 0.64, v);
}
const SHEAR_AXIS = -0.03; // the u the shear pivots about — his own centre line

function smooth(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// CARVES — the interior form. A gouge (negative `d`) or a swell (positive) laid along
// an authored 2D run: this is how the surface itself describes the hood hem, the collar,
// the shingle lines, the socket and the knuckle, instead of another primitive doing it.
type Carve = { pts: [number, number][]; r: number; d: number; back?: number };

const CARVES: Carve[] = [
  // the hood's brow hem, across the forehead — the shadow the eyes live under
  { pts: [[-0.250, 0.664], [-0.190, 0.694], [-0.108, 0.700], [-0.044, 0.672]], r: 0.030, d: -0.026, back: 0 },
  // the eye sockets, near and far
  { pts: [[-0.226, 0.630], [-0.198, 0.626]], r: 0.024, d: -0.020, back: 0 },
  { pts: [[-0.146, 0.618], [-0.126, 0.612]], r: 0.020, d: -0.016, back: 0 },
  // the cheek hollow under the far eye
  { pts: [[-0.130, 0.566], [-0.108, 0.512]], r: 0.032, d: -0.014, back: 0 },
  // the nose bridge — a swell, not a part
  { pts: [[-0.230, 0.612], [-0.262, 0.570], [-0.276, 0.542]], r: 0.022, d: 0.018, back: 0 },
  // the mouth line
  { pts: [[-0.252, 0.494], [-0.216, 0.486], [-0.190, 0.492]], r: 0.014, d: -0.012, back: 0 },
  // THE COLLAR: where the head sinks into the yoke, all the way round
  { pts: [[-0.216, 0.372], [-0.140, 0.404], [-0.040, 0.428], [0.058, 0.432]], r: 0.034, d: -0.026, back: 0.7 },
  // two shingle lines round the bell — the cloth's own courses
  { pts: [[-0.216, 0.246], [-0.100, 0.268], [0.026, 0.272], [0.146, 0.250]], r: 0.026, d: -0.014, back: 0.8 },
  { pts: [[-0.230, 0.140], [-0.090, 0.166], [0.040, 0.170], [0.152, 0.148]], r: 0.024, d: -0.012, back: 0.8 },
  // the satchel, on the LIT back curve — a swell with a hard lower lip
  { pts: [[0.126, 0.296], [0.140, 0.244], [0.132, 0.198]], r: 0.046, d: 0.020, back: 0 },
  { pts: [[0.108, 0.192], [0.140, 0.186]], r: 0.020, d: -0.014, back: 0 },
  // the working arm's separation from the body — a valley, never an outline
  { pts: [[-0.234, 0.300], [-0.246, 0.256], [-0.244, 0.216]], r: 0.030, d: -0.020 },
  // the mitt's cuff and its one knuckle ridge
  { pts: [[-0.286, 0.140], [-0.316, 0.132]], r: 0.018, d: -0.016 },
  { pts: [[-0.316, 0.112], [-0.296, 0.100]], r: 0.016, d: 0.012, back: 0 },
  // the hem's underside, and the boot tops
  { pts: [[-0.204, 0.082], [-0.060, 0.100], [0.096, 0.094]], r: 0.020, d: -0.012, back: 0.6 },
  { pts: [[-0.190, 0.048], [-0.126, 0.052]], r: 0.016, d: -0.012, back: 0 },
  { pts: [[-0.040, 0.044], [0.030, 0.040]], r: 0.016, d: -0.012, back: 0 },
];

function organField(u: number, v: number) {
  let wsum = 0;
  let g = 0;
  let t = 0;
  let b = 0;
  let dz = 0;
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < ORGANS.length; i++) {
    const o = ORGANS[i];
    const du = (u - o.u) / o.ru;
    const dv = (v - o.v) / o.rv;
    const d2 = du * du + dv * dv;
    if (d2 < bestD) {
      bestD = d2;
      best = i;
    }
    if (d2 >= 1) continue;
    const w = (1 - d2) * (1 - d2) * (1 - d2);
    wsum += w;
    g += w * o.g;
    t += w * o.t;
    b += w * (o.b ?? 1);
    dz += w * (o.dz ?? 0);
  }
  if (wsum < 1e-6) {
    const o = ORGANS[best];
    return { g: o.g, t: o.t, b: o.b ?? 1, dz: o.dz ?? 0 };
  }
  return { g: g / wsum, t: t / wsum, b: b / wsum, dz: dz / wsum };
}

/** Distance from (u,v) to a carve's run, and its falloff weight. */
function carveWeight(c: Carve, u: number, v: number): number {
  let d2 = Infinity;
  for (let i = 1; i < c.pts.length; i++) {
    const [ax, ay] = c.pts[i - 1];
    const [bx, by] = c.pts[i];
    const ex = bx - ax;
    const ey = by - ay;
    let s = ((u - ax) * ex + (v - ay) * ey) / (ex * ex + ey * ey || 1e-12);
    s = s < 0 ? 0 : s > 1 ? 1 : s;
    const cx = ax + ex * s;
    const cy = ay + ey * s;
    const dd = (u - cx) * (u - cx) + (v - cy) * (v - cy);
    if (dd < d2) d2 = dd;
  }
  const k = 1 - d2 / (c.r * c.r);
  return k <= 0 ? 0 : k * k;
}

/** The full depth solve at a point: plateau depth front and back, and the sheared
 *  centre the cross-section sits on. */
function depthAt(u: number, v: number) {
  const o = organField(u, v);
  let gf = o.g;
  let gb = o.g * o.b;
  for (const c of CARVES) {
    const w = carveWeight(c, u, v);
    if (w <= 0) continue;
    gf += c.d * w;
    gb += c.d * w * (c.back ?? 1);
  }
  const c0 = -shearAt(v) * (u - SHEAR_AXIS) + o.dz;
  return { gf: Math.max(0.004, gf), gb: Math.max(0.004, gb), t: o.t, c: c0 };
}

/** The shoulder profile: circular, so the surface leaves the outline tangent to the
 *  view ray and rolls over into the plateau. A flat cap here is what reads as cardboard. */
function prof(x: number): number {
  if (x >= 1) return 1;
  if (x <= 0) return 0;
  const k = 1 - x;
  return Math.sqrt(1 - k * k);
}

// ---- the signed field of the outline ------------------------------------------------

function sdPoly(px: number, py: number) {
  let d2 = Infinity;
  let nx = 0;
  let ny = 0;
  let inside = false;
  const n = OUTLINE.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ax = OUTLINE[j].u;
    const ay = OUTLINE[j].v;
    const bx = OUTLINE[i].u;
    const by = OUTLINE[i].v;
    const ex = bx - ax;
    const ey = by - ay;
    let t = ((px - ax) * ex + (py - ay) * ey) / (ex * ex + ey * ey || 1e-12);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + ex * t;
    const cy = ay + ey * t;
    const dd = (px - cx) * (px - cx) + (py - cy) * (py - cy);
    if (dd < d2) {
      d2 = dd;
      nx = cx;
      ny = cy;
    }
    if (ay > py !== by > py && px < ax + ((py - ay) / (by - ay)) * (bx - ax)) inside = !inside;
  }
  return { s: (inside ? 1 : -1) * Math.sqrt(d2), nx, ny };
}

/** The surface, front side, at a point the caller knows is on or inside the outline —
 *  used to sit an authored ink mark exactly on the form it describes. */
function surfaceZ(u: number, v: number): number {
  const { s } = sdPoly(u, v);
  const d = depthAt(u, v);
  return d.c + d.gf * prof(Math.max(0, s) / d.t);
}

// ---- the bounds the grid and the albedo share ---------------------------------------

const BOUNDS = (() => {
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const p of OUTLINE) {
    if (p.u < u0) u0 = p.u;
    if (p.u > u1) u1 = p.u;
    if (p.v < v0) v0 = p.v;
    if (p.v > v1) v1 = p.v;
  }
  const pad = 0.012;
  return { u0: u0 - pad, v0: v0 - pad, u1: u1 + pad, v1: v1 + pad };
})();

// ---- the skin: one closed manifold --------------------------------------------------

const CELL = 0.0105;

function buildSkin(): THREE.BufferGeometry {
  const nu = Math.ceil((BOUNDS.u1 - BOUNDS.u0) / CELL) + 1;
  const nv = Math.ceil((BOUNDS.v1 - BOUNDS.v0) / CELL) + 1;
  const snap = CELL * 1.7;

  // per node: 0 dead, 1 boundary (one shared vertex), 2 interior (front + back)
  const kind = new Uint8Array(nu * nv);
  const iFront = new Int32Array(nu * nv).fill(-1);
  const iBack = new Int32Array(nu * nv).fill(-1);
  const pos: number[] = [];
  const uv: number[] = [];
  const du = BOUNDS.u1 - BOUNDS.u0;
  const dv = BOUNDS.v1 - BOUNDS.v0;
  const tmp = new THREE.Vector3();

  const push = (u: number, v: number, z: number) => {
    W(u, v, z, tmp);
    pos.push(tmp.x, tmp.y, tmp.z);
    uv.push((u - BOUNDS.u0) / du, (v - BOUNDS.v0) / dv);
    return pos.length / 3 - 1;
  };

  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const u = BOUNDS.u0 + i * CELL;
      const v = BOUNDS.v0 + j * CELL;
      const { s, nx, ny } = sdPoly(u, v);
      const k = i + j * nu;
      if (s > 0) {
        const d = depthAt(u, v);
        const f = prof(s / d.t);
        kind[k] = 2;
        iFront[k] = push(u, v, d.c + d.gf * f);
        iBack[k] = push(u, v, d.c - d.gb * prof(s / (d.t * Math.max(0.2, d.gb / d.gf))));
      } else if (s > -snap) {
        // an outside node within a cell of the line snaps ONTO the line and becomes one
        // shared vertex: that is what closes the front and back caps watertight, and it
        // is why the rendered boundary follows the authored curve and not the grid.
        const d = depthAt(nx, ny);
        kind[k] = 1;
        iFront[k] = iBack[k] = push(nx, ny, d.c);
      }
    }
  }

  const idx: number[] = [];
  const tri = (a: number, b: number, c: number, ka: number, kb: number, kc: number) => {
    if (ka === 1 && kb === 1 && kc === 1) return; // fully-on-the-line: front == back
    idx.push(a, b, c);
  };
  for (let j = 0; j < nv - 1; j++) {
    for (let i = 0; i < nu - 1; i++) {
      const a = i + j * nu;
      const b = i + 1 + j * nu;
      const c = i + 1 + (j + 1) * nu;
      const d = i + j * nu + nu;
      const ka = kind[a];
      const kb = kind[b];
      const kc = kind[c];
      const kd = kind[d];
      if (!ka || !kb || !kc || !kd) continue;
      if (ka + kb + kc + kd === 4) continue; // no interior node in this quad
      tri(iFront[a], iFront[b], iFront[c], ka, kb, kc);
      tri(iFront[a], iFront[c], iFront[d], ka, kc, kd);
      tri(iBack[a], iBack[c], iBack[b], ka, kc, kb);
      tri(iBack[a], iBack[d], iBack[c], ka, kd, kc);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geom.setIndex(idx);
  // the island's own worked surface: nothing on this page is smooth Lambert
  roughen(geom, 0.0045, 26, 3);
  return geom;
}

// ---- the albedo: he is PAINTED in 2D, in the drawing's own coordinates ---------------
//
// One bake, one map, one material. The regions are authored in the same (u,v) the
// outline is, so registration is exact by construction rather than by fitting.

const HEX = (h: number) => '#' + h.toString(16).padStart(6, '0');
function shade(h: number, k: number): string {
  const c = new THREE.Color(h);
  c.r = Math.min(1, c.r * k);
  c.g = Math.min(1, c.g * k);
  c.b = Math.min(1, c.b * k);
  return '#' + c.getHexString();
}

function bakeAlbedo(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const CW = 384;
  const CH = 560;
  const cv = document.createElement('canvas');
  cv.width = CW;
  cv.height = CH;
  const g = cv.getContext('2d')!;
  const du = BOUNDS.u1 - BOUNDS.u0;
  const dv = BOUNDS.v1 - BOUNDS.v0;
  const X = (u: number) => ((u - BOUNDS.u0) / du) * CW;
  const Y = (v: number) => (1 - (v - BOUNDS.v0) / dv) * CH;

  let s = 0x2f9a13;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const poly = (pts: [number, number][], fill: string) => {
    g.beginPath();
    g.moveTo(X(pts[0][0]), Y(pts[0][1]));
    for (let i = 1; i < pts.length; i++) g.lineTo(X(pts[i][0]), Y(pts[i][1]));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  };
  const oval = (u: number, v: number, ru: number, rv: number, fill: string, rot = 0) => {
    g.save();
    g.translate(X(u), Y(v));
    g.rotate(rot);
    g.beginPath();
    g.ellipse(0, 0, (ru / du) * CW, (rv / dv) * CH, 0, 0, Math.PI * 2);
    g.fillStyle = fill;
    g.fill();
    g.restore();
  };

  // 1. theatre blacks, everywhere. Anything not repainted below is the garment.
  g.fillStyle = HEX(P.gobCloak);
  g.fillRect(0, 0, CW, CH);

  // 2. the three cloth courses as three committed value steps — a garment wears at the
  //    hem first, so the hem band is the palest and the yoke the darkest.
  g.fillStyle = shade(P.gobCloak, 1.34);
  g.fillRect(0, Y(0.145), CW, Y(0.0) - Y(0.145));
  g.fillStyle = shade(P.gobCloak, 1.16);
  g.fillRect(0, Y(0.268), CW, Y(0.145) - Y(0.268));

  // 3. the satchel — the ONE warm patch, on the lit back curve
  poly(
    [[0.100, 0.196], [0.148, 0.190], [0.166, 0.240], [0.156, 0.302], [0.114, 0.306], [0.100, 0.250]],
    HEX(P.gobSatchel),
  );
  poly([[0.100, 0.196], [0.148, 0.190], [0.150, 0.212], [0.100, 0.216]], shade(P.gobSatchel, 0.78));

  // 4. the working arm: sleeve → a hand's width of bare forearm → the worn mitt.
  //    Three values down one limb; the value break is what says "arm" at 36 px.
  poly([[-0.300, 0.212], [-0.244, 0.196], [-0.256, 0.136], [-0.318, 0.152]], HEX(P.gobSkin));
  poly(
    [[-0.322, 0.150], [-0.268, 0.134], [-0.272, 0.086], [-0.340, 0.096], [-0.344, 0.126]],
    HEX(P.gobCloakWorn),
  );

  // 5. boots
  poly([[-0.206, 0.058], [-0.114, 0.062], [-0.118, 0.000], [-0.204, 0.000]], HEX(P.gobCloakWorn));
  poly([[-0.052, 0.056], [0.058, 0.062], [0.056, 0.000], [-0.050, 0.000]], HEX(P.gobCloakWorn));

  // 6. the face — the sage wedge under the hood's brow hem
  poly(
    [
      [-0.252, 0.664], [-0.190, 0.694], [-0.108, 0.700], [-0.040, 0.668], [-0.030, 0.596],
      [-0.052, 0.508], [-0.108, 0.436], [-0.184, 0.386], [-0.236, 0.416], [-0.259, 0.486],
      [-0.254, 0.510], [-0.298, 0.542], [-0.234, 0.636],
    ],
    HEX(P.gobSkin),
  );
  // 7. the two ear blades, and their inner shells
  poly([[0.020, 0.628], [0.222, 0.836], [0.036, 0.712], [0.012, 0.664]], HEX(P.gobSkin));
  poly([[0.036, 0.712], [0.124, 0.990], [-0.038, 0.808], [0.006, 0.726]], HEX(P.gobSkin));
  poly([[0.046, 0.664], [0.178, 0.796], [0.056, 0.708]], HEX(P.gobEarInner));
  poly([[0.040, 0.734], [0.106, 0.930], [0.008, 0.804]], HEX(P.gobEarInner));

  // 8. the socket band the eyes live in — the hood's own shadow, painted, so the amber
  //    has a dark to sit in whatever the key is doing
  poly(
    [[-0.256, 0.652], [-0.190, 0.674], [-0.108, 0.676], [-0.052, 0.646], [-0.058, 0.596], [-0.240, 0.600]],
    shade(P.gobCloak, 1.5),
  );
  // 9. the nose, the two amber eyes (unequal — a three-quarter shows two), the fang nub
  oval(-0.272, 0.556, 0.030, 0.030, HEX(P.gobEarInner));
  oval(-0.214, 0.628, 0.0155, 0.0125, HEX(P.gobEye));
  oval(-0.132, 0.618, 0.0110, 0.0100, HEX(P.gobEye));
  oval(-0.240, 0.486, 0.0090, 0.0070, HEX(P.gobTooth), -0.3);

  // 10. drybrush: dabs in ONE family direction (the drape falls), a miniature painter's
  //     hand over flat gouache. Never a second crossing direction, anywhere.
  g.globalAlpha = 0.5;
  for (let i = 0; i < 420; i++) {
    const u = BOUNDS.u0 + rnd() * du;
    const v = BOUNDS.v0 + rnd() * dv;
    if (sdPoly(u, v).s < 0.008) continue;
    const len = 0.02 + rnd() * 0.05;
    const a = 1.45 + (rnd() - 0.5) * 0.22;
    g.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
    g.lineWidth = 1 + rnd() * 2.4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(X(u), Y(v));
    g.quadraticCurveTo(
      X(u + Math.cos(a) * len * 0.5 + 0.006),
      Y(v + Math.sin(a) * len * 0.5),
      X(u + Math.cos(a) * len),
      Y(v + Math.sin(a) * len),
    );
    g.stroke();
  }
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  return tex;
}

// ---- the drawn line ------------------------------------------------------------------
//
// Pushing a mark along +z moves it up its own view ray: it wins the depth test against
// the solid and its screen position does not move by a pixel. Every mark below is
// therefore registered on the form it describes, by construction.

const PUSH = 0.026;

function markOn(pts: [number, number][], hex: number, w: 'hero' | 'form' | 'faint', close = false) {
  const v3 = pts.map(([u, v]) => W(u, v, surfaceZ(u, v) + PUSH));
  return paint(polyline(v3, w, close), { line: hex });
}

/** The silhouette itself, drawn. It rides the boundary's own sheared centre, so it lands
 *  exactly on the rendered outline — the whole point of inflating along the view ray. */
function contour(): THREE.Object3D {
  const dense = outlinePath().getPoints(14);
  const v3 = dense.map((p) => {
    const d = depthAt(p.x, p.y);
    return W(p.x, p.y, d.c + PUSH);
  });
  return paint(polyline(v3, 'hero', true), { line: P.ink });
}

const MARKS: { pts: [number, number][]; hex: number; w: 'hero' | 'form' | 'faint'; close?: boolean }[] = [
  // the hood's brow hem — mark 3's dark, given an edge
  { pts: [[-0.252, 0.660], [-0.196, 0.690], [-0.104, 0.696], [-0.040, 0.666]], hex: P.ink, w: 'form' },
  // the nose-and-chin zigzag that breaks the face contour
  { pts: [[-0.226, 0.606], [-0.272, 0.560], [-0.250, 0.520], [-0.222, 0.516]], hex: P.ink, w: 'form' },
  { pts: [[-0.254, 0.492], [-0.212, 0.484], [-0.192, 0.492]], hex: P.ink, w: 'form' },
  // the two ear folds, one per blade, each along its own blade — never across it
  { pts: [[0.040, 0.660], [0.116, 0.732], [0.184, 0.796]], hex: P.graphiteDark, w: 'form' },
  { pts: [[0.030, 0.736], [0.070, 0.842], [0.106, 0.928]], hex: P.graphiteDark, w: 'form' },
  // the collar: the head sinks into the yoke, and this is the line that says so
  { pts: [[-0.212, 0.370], [-0.140, 0.404], [-0.040, 0.428], [0.056, 0.430]], hex: P.ink, w: 'form' },
  // the arm's separation from the body — an authored valley's line, not an outline
  { pts: [[-0.232, 0.302], [-0.246, 0.258], [-0.242, 0.218]], hex: P.ink, w: 'form' },
  // the mitt cuff and the satchel's lower lip
  { pts: [[-0.276, 0.140], [-0.322, 0.128]], hex: P.ink, w: 'form' },
  { pts: [[0.102, 0.196], [0.150, 0.190]], hex: P.ink, w: 'form' },
  { pts: [[0.100, 0.250], [0.104, 0.200]], hex: P.ink, w: 'form' },
  // the hem's underside and the boot tops — mark 5's grounding, drawn
  { pts: [[-0.208, 0.078], [-0.100, 0.100], [0.020, 0.100], [0.108, 0.090]], hex: P.ink, w: 'form' },
  { pts: [[-0.196, 0.050], [-0.124, 0.054]], hex: P.ink, w: 'form' },
  { pts: [[-0.044, 0.046], [0.034, 0.042]], hex: P.ink, w: 'form' },
];

// ---- the pencil (his icon; a prop, not the figure) ------------------------------------

function buildPencil(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.185, 6, 1),
    createTrilayer({ color: P.dieBone, wear: 0.2, poster: 6, floor: 0.2, stroke: { dir: 1.5, sheet: true } }),
  );
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.016, 0.05, 6, 1),
    createTrilayer({ color: P.graphiteDark, wear: 0.18, poster: 0, stroke: { dir: 1.5, sheet: true } }),
  );
  body.position.y = 0.026;
  tip.position.y = -0.091;
  tip.rotation.z = Math.PI;
  g.add(body, tip);
  // in the drawing plane, angled across the work triangle: the pale stick on open paper
  g.position.copy(W(-0.288, 0.078, surfaceZ(-0.302, 0.104) + 0.02));
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(LU, LV, LN));
  g.rotateZ(-0.72);
  g.userData.prop = true;
  return g;
}

// ---- the contact pool -----------------------------------------------------------------

function buildPool(): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(1, 26),
    createTrilayer({ color: P.caveDark, wear: 0, feather: 0.5 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.scale.set(0.215, 0.115, 1);
  const c = W(-0.086, 0, 0.01);
  m.position.set(c.x, 0.006, c.z);
  // not alive on purpose: a gouache blob on the painted half, its own graphite smudge on
  // the drawing — one mesh grounds him on both sides of the seam
  m.userData.neverAlive = true;
  return m;
}

// ---- assembly --------------------------------------------------------------------------

export function buildGobStudyC(): THREE.Object3D {
  const root = new THREE.Group();
  root.name = 'gobStudyC';

  const albedo = bakeAlbedo();
  const skinMat = createTrilayer({
    color: albedo ? 0xffffff : P.gobCloak,
    wear: 0.26,
    poster: 14,
    floor: 0.175,
    // ONE family direction for the WHOLE creature — there is no second surface on him
    // that could cross it. The gate is met by construction, not by discipline.
    stroke: { dir: 1.45, sheet: true },
  });
  if (albedo) skinMat.map = albedo;

  const skin = new THREE.Mesh(buildSkin(), skinMat);
  skin.name = 'gobStudyC:skin';
  root.add(skin);

  root.add(contour());
  for (const m of MARKS) root.add(markOn(m.pts, m.hex, m.w, m.close));
  root.add(buildPencil());
  root.add(buildPool());

  return root;
}
