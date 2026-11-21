import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sketch, STROKE_LAYER } from '../hero/film/pencil.ts';
import type { Plan } from './kit';

// THE BLOCKOUT. The hero's entrance, and the page's loading screen: the island arrives as a pencil blockout
// (a cone for the pine, balls on a stick for a tree, a box for a crate, a faceted slab for the island itself),
// and is then painted into the finished map, the colour crossing it from one side while each piece pops out
// of its stand-in as the paint reaches it.
//
// The drawing needs only the kit's plan (what stands where, and how big), so it starts before the models have
// loaded and is what the visitor watches while they do. It runs on two clocks: the pencil's starts with the
// plan, the paint's when everything is in.
//
// While it waits the drawing does not sit still. The world is still being rolled: each piece is redrawn every
// second or so as something else that might have stood there (a pine as a tower, a lamp as a tree), and the
// island's own outline is redrawn with them. As the paint comes near, each becomes what it really is.
//
// The drawing is edges and flat tone only: each facet that faces away from the light is hatched with straight
// strokes, the darkest crossed, and a facet in the light is left as paper.
//
// Everything is ordered by one number, a piece's coordinate across the island (coord below, the same sum
// in the shaders). The pencil sweeps it upward, drawing; the paint sweeps it back down. Pieces are moved
// in the vertex shader through the `anchor` attribute kit.ts bakes in, so the island stays merged.
//
// ?draw=0..1 holds the entrance at that point, for looking at one frame of it.

const HOLD = new URLSearchParams(window.location.search).get('draw');

const DRAW = { at: 0.15, len: 1.7 }; // seconds on the pencil's clock, for its first pass across the island
const MULL = 0.7; // and at least this long is then spent changing its mind, however fast the page loaded
const PAINT = { len: 3.2 }; // seconds on the paint's clock
const REACH = 8; // every coordinate on the island lies well inside ±REACH
const POP = 1.8; // how far the paint travels while a piece pops
const LINGER = 1.0; // a stand-in's lines are drawn over this much travel, and outlast its pop by as much
const LEAD = 0.4; // the island's own lines run this far into the paint before they go
// the rolling: how many other things a piece is drawn as, how long each stays (seconds, a piece and the ground),
// how long one takes to sketch in, and how far ahead of the paint a piece becomes itself
const ROLL = { others: 3, stays: [0.8, 1.4], ground: 1.3, sketch: 0.22, ahead: 3 };

/** When the pencil has been across and had a moment to change its mind. The paint may begin from here. */
export const DRAWN = DRAW.at + DRAW.len + MULL;

/** The pencil's clock and the paint's, in seconds, or the moment ?draw= holds them both at. */
export function clocks(draw: number, paint: number): [number, number] {
  if (HOLD === null) return [draw, paint];
  const t = Number(HOLD) * (DRAWN + PAINT.len);
  return [t, t - DRAWN];
}

// held inside ±EDGE, so what hangs far out beside the island (a cloud) is drawn and painted with its nearest rim
const EDGE = REACH - 1;
const coord = (x: number, z: number) =>
  Math.min(EDGE, Math.max(-EDGE, x - 0.45 * z + 0.55 * Math.sin(z * 0.9 + 1.3) + 0.3 * Math.sin(x * 1.7 - z * 1.1)));

const COORD = /* glsl */ `
  uniform float uFront; // painted: every coordinate above this
  uniform float uDrawn; // drawn: every coordinate below this
  float rvCoord(vec3 p) {
    return clamp(p.x - 0.45 * p.z + 0.55 * sin(p.z * 0.9 + 1.3) + 0.3 * sin(p.x * 1.7 - p.z * 1.1), -${EDGE.toFixed(1)}, ${EDGE.toFixed(1)});
  }
`;

// the paint's edge on the ground is ragged and streaked. Above 0, a point of the ground is painted. The drawn
// island and the real one both ask this, so one ends exactly where the other begins
const EDGE_GLSL = /* glsl */ `
  float rvHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float rvNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(rvHash(i), rvHash(i + vec2(1.0, 0.0)), f.x), mix(rvHash(i + vec2(0.0, 1.0)), rvHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float rvEdge(vec3 p) {
    return rvCoord(p) - uFront + (rvNoise(vec2(p.x * 0.7 + p.z * 0.3, p.z * 6.0)) - 0.5) * 1.5 + (rvNoise(p.xz * 5.0) - 0.5) * 0.3;
  }
`;

// a piece is nothing until the paint reaches where it stands, then springs up from most of its size
const POP_GLSL = /* glsl */ `
  {
    float rvT = clamp((rvCoord(anchor.xyz) - uFront) / ${POP.toFixed(1)}, 0.0, 1.0);
    float rvU = rvT - 1.0;
    float rvS = rvT <= 0.0 ? 0.0 : 0.7 + 0.3 * (1.0 + 2.6 * rvU * rvU * rvU + 1.6 * rvU * rvU);
    transformed = mix(transformed, anchor.xyz + (transformed - anchor.xyz) * rvS, anchor.w);
  }
`;

// the real ground is not swapped but painted across: nothing of it shows ahead of the edge (the drawn island is
// there instead), and just behind the edge it is a little darker, where wet paint pools
const GROUND = /* glsl */ `
  if (vRvGround > 0.5) {
    float rvE = rvEdge(vRvP);
    if (rvE < 0.0) discard;
    gl_FragColor.rgb *= 1.0 - 0.22 * smoothstep(0.0, 0.06, rvE) * (1.0 - smoothstep(0.06, 0.4, rvE));
  }
`;

type Uniforms = Record<'uFront' | 'uDrawn', THREE.IUniform>;

/** A kit material learns the entrance: its pieces pop, its ground is painted across. */
function reveal(material: THREE.Material, U: Uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec4 anchor;\nvarying vec3 vRvP;\nvarying float vRvGround;\n${COORD}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvRvP = position;\nvRvGround = 1.0 - anchor.w;\n${POP_GLSL}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vRvP;\nvarying float vRvGround;\n${COORD}${EDGE_GLSL}`)
      .replace('#include <fog_fragment>', `#include <fog_fragment>\n${GROUND}`);
  };
  material.customProgramCacheKey = () => 'reveal';
}

// ---- the stand-ins: a few plain solids per piece, sized from the bounds its manifest entry carries

type Kind = 'box' | 'drum' | 'pine' | 'tree' | 'dome' | 'blob' | 'post' | 'fire' | 'island';
// what a slot is blocked out as; anything unlisted is a box, and null is too small or too flat to block out
const KIND: Record<string, Kind | null> = {
  grass: null, flowers: null, mushroom: null, path_stones: null, d20: null,
  island: 'island', hero_tree: 'tree', pine: 'pine', bush: 'dome', cloud: 'dome',
  rock_large: 'blob', rock_medium: 'blob', rock_small: 'blob', rubble: 'blob',
  barrel: 'drum', campfire: 'fire', lantern_post: 'post', signpost: 'post', banner: 'post',
};

/** bounds are Blender's (Z up): min x, y, z then max x, y, z. The solids come back in the piece's own space, Y up. */
function standIn(kind: Kind, b: number[]): THREE.BufferGeometry[] {
  const w = b[3] - b[0], d = b[4] - b[1];
  const y0 = Math.max(b[2], 0), h = b[5] - y0;
  const cx = (b[0] + b[3]) / 2, cz = -(b[1] + b[4]) / 2;
  const r = Math.min(w, d) / 2;
  const ball = (rad: number, x: number, y: number, z: number, sy = 1) =>
    new THREE.IcosahedronGeometry(1, 0).scale(rad, rad * sy, rad).translate(x, y, z);
  switch (kind) {
    case 'island': {
      // a faceted slab: flat on top, a band of lip, then rock closing to a point
      const deep = b[2];
      const side = [[0.001, deep], [0.5, deep * 0.8], [0.86, deep * 0.5], [0.99, deep * 0.2], [1, 0], [0.001, 0]];
      return [new THREE.LatheGeometry(side.map(([x, y]) => new THREE.Vector2(x, y)), 14).scale(w / 2, 1, d / 2).translate(cx, 0, cz)];
    }
    case 'drum':
      return [new THREE.CylinderGeometry(r, r, h, 8).translate(cx, y0 + h / 2, cz)];
    case 'fire':
      return [new THREE.ConeGeometry(r * 0.8, h, 6).translate(cx, y0 + h / 2, cz)];
    case 'pine':
      return [
        new THREE.CylinderGeometry(r * 0.14, r * 0.18, h * 0.24, 5).translate(cx, y0 + h * 0.12, cz),
        // three skirts, as the pine has: each narrower and starting inside the one below
        new THREE.ConeGeometry(r, h * 0.32, 7).translate(cx, y0 + h * 0.3, cz),
        new THREE.ConeGeometry(r * 0.72, h * 0.38, 7).translate(cx, y0 + h * 0.55, cz),
        new THREE.ConeGeometry(r * 0.45, h * 0.38, 7).translate(cx, y0 + h * 0.81, cz),
      ];
    case 'tree':
      return [
        new THREE.CylinderGeometry(r * 0.13, r * 0.18, h * 0.55, 5).translate(cx, y0 + h * 0.275, cz),
        ball(r * 0.7, cx - r * 0.36, y0 + h * 0.6, cz + r * 0.1),
        ball(r * 0.66, cx + r * 0.4, y0 + h * 0.62, cz - r * 0.05),
        ball(r * 0.6, cx, y0 + h * 0.8, cz - r * 0.15),
      ];
    case 'dome':
      return [new THREE.IcosahedronGeometry(1, 0).scale(w / 2, h, d / 2).translate(cx, y0, cz)];
    case 'blob':
      return [new THREE.IcosahedronGeometry(1, 0).scale(w / 2, h * 0.6, d / 2).translate(cx, y0 + h * 0.4, cz)];
    case 'post':
      return [
        new THREE.BoxGeometry(0.14, h, 0.14).translate(0, y0 + h / 2, 0),
        new THREE.BoxGeometry(w, h * 0.22, Math.max(d * 0.4, 0.08)).translate(cx, y0 + h * 0.8, cz),
      ];
    default:
      return [new THREE.BoxGeometry(w, h, d).translate(cx, y0 + h / 2, cz)];
  }
}

// what a piece on the ground may be rolled as
const ROLLED: Kind[] = ['box', 'drum', 'pine', 'tree', 'dome', 'blob', 'post', 'fire'];

/** Something else that might have stood where this piece does: a kind, and bounds as the manifest would give them
 *  (so before the piece's own `scale`). */
function other(kind: Kind, b: number[], scale: number, floats: boolean, turn: number, r: () => number): [Kind, number[]] {
  if (floats) {
    // what hangs in the air stays what it is and only changes shape
    const x = 0.7 + 0.65 * r(), y = 0.7 + 0.65 * r(), z = 0.7 + 0.65 * r();
    return [kind, [b[0] * x, b[1] * y, b[2] * z, b[3] * x, b[4] * y, b[5] * z]];
  }
  const pool = ROLLED.filter((k) => k !== kind);
  const next = pool[turn % pool.length];
  // about as tall as the piece, if that kind of thing can be; the squat ones stay squat
  const tall = Math.min(3.4 / scale, Math.max(0.6, (b[5] - Math.max(b[2], 0)) * (0.75 + 0.45 * r())));
  const low = Math.min(1.1 / scale, tall);
  const [w, d, h] =
    next === 'tree' ? [Math.max(1, tall) * 0.8, Math.max(1, tall) * 0.8, Math.max(1, tall)]
    : next === 'pine' ? [Math.max(1, tall) * 0.5, Math.max(1, tall) * 0.5, Math.max(1, tall)]
    : next === 'post' ? [Math.min(1.1, tall * 0.4), 0.3, Math.max(1, tall)]
    : next === 'dome' ? [low * 1.8, low * 1.5, low * 0.8]
    : next === 'blob' ? [low * 1.5, low * 1.2, low]
    : next === 'drum' ? [low * 0.8, low * 0.8, low]
    : [low, low, low];
  return [next, [-w / 2, -d / 2, 0, w / 2, d / 2, h]];
}

/** The island's slab with another coastline: pushed out and pulled in round its rim, and deeper or shallower. */
function coast(slab: THREE.BufferGeometry, b: number[], r: () => number) {
  const cx = (b[0] + b[3]) / 2, cz = -(b[1] + b[4]) / 2, w = (b[3] - b[0]) / 2, d = (b[4] - b[1]) / 2;
  const waves = [2, 3, 5].map((n) => ({ n, by: 0.05 + 0.06 * r(), from: r() * Math.PI * 2 }));
  const wide = 0.94 + 0.1 * r(), deep = 0.7 + 0.5 * r();
  const at = slab.getAttribute('position');
  for (let i = 0; i < at.count; i++) {
    const x = at.getX(i) - cx, z = at.getZ(i) - cz;
    const round = Math.atan2(z / d, x / w);
    const f = wide + waves.reduce((sum, v) => sum + v.by * Math.sin(v.n * round + v.from), 0);
    at.setXYZ(i, cx + x * f, at.getY(i) * deep, cz + z * f);
  }
}

/** A solid's edges as the old film's hand drew them: wobbling, overshooting the corners. Six numbers a stroke. */
function strokesOf(geometry: THREE.BufferGeometry, threshold: number, size: number): Float32Array {
  // the hand's wobble is sized for what the lens sees, so the solid is drawn at display size and put back
  const shown = geometry.clone().scale(size, size, size);
  const line = sketch(shown, threshold).children[1] as LineSegments2;
  const data = (line.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute).data.array;
  const out = Float32Array.from(data, (v) => v / size);
  line.geometry.dispose();
  shown.dispose();
  return out;
}

// flat tone, drawn: straight strokes about a pixel wide, laid across each facet by where it lies in the island,
// so they are parallel on a facet and stop at its edges. Lit facets get none, dark ones are crossed.
const TONE = /* glsl */ `
  float rvStrokes(vec3 p, vec3 across, float perMetre) {
    float v = dot(p, across) * perMetre;
    return 1.0 - smoothstep(0.45, 1.1, abs(fract(v) - 0.5) / max(fwidth(v), 1e-4));
  }
  float rvTone(vec3 p, vec3 n) {
    float lit = dot(normalize(n), normalize(vec3(-0.52, 0.74, 0.42)));
    float ink = (1.0 - step(0.3, lit)) * rvStrokes(p, vec3(0.62, 0.74, 0.26), 7.0);
    return max(ink, (1.0 - step(-0.15, lit)) * rvStrokes(p, vec3(-0.55, 0.7, 0.45), 7.0));
  }
`;

export interface Blockout {
  /** the stand-ins and every pencil line; stands where the kit's root will */
  group: THREE.Group;
  /** the models have loaded: they learn to pop and be painted, and the lamps and the goblin wait their turn */
  attach(root: THREE.Group): void;
  /** `draw` seconds on the pencil's clock, `paint` on the paint's (Infinity: over). Returns how far the paint has got, 0 to 1. */
  at(draw: number, paint: number): number;
}

/** `size` is the scale the kit is shown at, so the pencil's hand comes out the size it was drawn for. */
export function createBlockout(plan: Plan, size: number): Blockout {
  const U: Uniforms = { uFront: { value: REACH }, uDrawn: { value: -REACH - LINGER } };

  // any stroke from the old hand carries the shared pencil material, kept at the right weight on resize
  const pencil = (sketch(new THREE.BoxGeometry(1, 1, 1)).children[1] as LineSegments2).material;
  const tone = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */ `
      attribute vec4 anchor;
      varying vec3 vP;
      varying vec3 vN;
      varying float vGround;
      ${COORD}
      void main() {
        float c = rvCoord(anchor.xyz);
        float show = step(c, uFront) * step(c, uDrawn);
        vP = position;
        vN = normal;
        vGround = 1.0 - anchor.w;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(position, anchor.xyz + (position - anchor.xyz) * show, anchor.w), 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vP;
      varying vec3 vN;
      varying float vGround;
      ${COORD}
      ${EDGE_GLSL}
      ${TONE}
      void main() {
        // the drawn island is there from where the pencil has been to where the paint has not
        if (vGround > 0.5 && (rvCoord(vP) > uDrawn || rvEdge(vP) >= 0.0)) discard;
        // pencil on the page itself: where there is no lead the canvas is left clear and the page's own paper
        // shows (the surface is opaque, so this alpha is written as it stands, premultiplied like the canvas)
        gl_FragColor = vec4(vec3(0.3), 1.0) * rvTone(vP, vN) * 0.6;
      }
    `,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

  // ---- the stand-ins, from the plan alone. A take is one way of drawing a piece: its tone, and its lines in the
  // order the pencil makes them. Each piece has its true take first, then the others it is rolled through.
  type Take = { fill: THREE.Mesh; lines: LineSegments2; keys: Float32Array };
  const group = new THREE.Group();
  const take = (kind: Kind, bounds: number[], placed: THREE.Matrix4, stands: THREE.Vector3, reshape?: (g: THREE.BufferGeometry) => void): Take => {
    const solids: THREE.BufferGeometry[] = [];
    const strokes: { key: number; at: Float32Array; i: number }[] = [];
    for (const part of standIn(kind, bounds)) {
      reshape?.(part);
      const solid = (part.index ? part.toNonIndexed() : part.clone()).applyMatrix4(placed);
      part.dispose();
      solid.deleteAttribute('uv');
      solid.computeVertexNormals(); // one normal a facet: the tone is flat
      const anchor = new Float32Array(solid.getAttribute('position').count * 4);
      // w is 0 for the island, which is not a piece but the thing they stand on
      for (let i = 0; i < anchor.length; i += 4) anchor.set([stands.x, stands.y, stands.z, kind === 'island' ? 0 : 1], i);
      solid.setAttribute('anchor', new THREE.BufferAttribute(anchor, 4));
      solids.push(solid);
      const at = strokesOf(solid, 25, size);
      // the island's lines are drawn and painted over where each one lies; a piece's simply in the order made
      for (let i = 0; i < at.length; i += 6)
        strokes.push({ key: kind === 'island' ? coord((at[i] + at[i + 3]) / 2, (at[i + 2] + at[i + 5]) / 2) - LEAD : strokes.length, at, i });
    }
    strokes.sort((a, b) => a.key - b.key);
    const positions = new Float32Array(strokes.length * 6);
    strokes.forEach((s, n) => positions.set(s.at.subarray(s.i, s.i + 6), n * 6));
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);
    const lines = new LineSegments2(geometry, pencil);
    lines.layers.set(STROKE_LAYER);
    lines.frustumCulled = false;
    const fill = new THREE.Mesh(mergeGeometries(solids), tone);
    for (const solid of solids) solid.dispose();
    lines.visible = fill.visible = false;
    group.add(fill, lines);
    return { fill, lines, keys: Float32Array.from(strokes, (s) => s.key) };
  };

  // the rolls are the same on every visit
  let seed = 7;
  const r = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const ground: Take[] = [];
  // c: where the piece stands across the island. stays, from: how long each of its takes lasts, and its offset
  const pieces: { c: number; takes: Take[]; stays: number; from: number }[] = [];
  const matrix = new THREE.Matrix4(), turn = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), grown = new THREE.Vector3();
  const nudged = new THREE.Vector3();
  for (const inst of plan.layout.instances) {
    const slot = plan.manifest.slots[inst.slot];
    const kind = inst.slot in KIND ? KIND[inst.slot] : 'box';
    const bounds = slot?.variants[inst.variant ?? slot.default]?.bounds;
    if (!kind || !bounds) continue;
    // Blender is Z-up, the page Y-up: (x, y, z) there is (x, z, -y) here, as kit.ts places the piece itself
    const stands = new THREE.Vector3(inst.pos[0], inst.pos[2], -inst.pos[1]);
    grown.setScalar(inst.scale ?? 1);
    matrix.compose(stands, turn.setFromAxisAngle(up, THREE.MathUtils.degToRad(inst.yaw ?? 0)), grown);
    if (kind === 'island') {
      ground.push(take(kind, bounds, matrix, stands));
      for (let n = 0; n < ROLL.others; n++) ground.push(take(kind, bounds, matrix, stands, (slab) => coast(slab, bounds, r)));
      continue;
    }
    const takes = [take(kind, bounds, matrix, stands)];
    const floats = inst.slot === 'cloud' || inst.slot === 'rubble';
    const first = Math.floor(r() * ROLLED.length);
    for (let n = 0; n < ROLL.others; n++) {
      const [as, shaped] = other(kind, bounds, inst.scale ?? 1, floats, first + n * 3, r);
      // not quite where the piece will be, and facing any way
      nudged.set(stands.x + (floats ? 0 : (r() - 0.5) * 0.5), stands.y, stands.z + (floats ? 0 : (r() - 0.5) * 0.5));
      matrix.compose(nudged, turn.setFromAxisAngle(up, r() * Math.PI * 2), grown);
      takes.push(take(as, shaped, matrix, stands));
    }
    const stays = THREE.MathUtils.lerp(ROLL.stays[0], ROLL.stays[1], r());
    pieces.push({ c: coord(stands.x, stands.z), takes, stays, from: r() * stays });
  }
  const below = (keys: Float32Array, c: number) => {
    let lo = 0, hi = keys.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (keys[mid] < c) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const unit = (x: number) => Math.min(1, Math.max(0, x));
  /** take `now` of these is the one on the page, with `count` of its lines drawn and its tone once most are */
  const show = (takes: Take[], now: number, count: number) =>
    takes.forEach((t, k) => {
      t.lines.visible = k === now && count > 0;
      t.fill.visible = t.lines.visible && count > t.keys.length * 0.6;
      if (t.lines.visible) t.lines.geometry.instanceCount = Math.min(count, t.keys.length);
    });

  const ease = (x: number) => {
    const c = Math.min(1, Math.max(0, x));
    return c * c * (3 - 2 * c);
  };

  // what waits on the models: a lamp lights nothing until its piece has popped, so the fire's glow arrives with
  // the fire, and the goblin steps in as the paint reaches where he stands
  const lamps: { light: THREE.Light; full: number; key: number }[] = [];
  let goblin: THREE.Object3D | undefined;
  let goblinAt = 0, goblinSize = 1;

  return {
    group,
    attach(root) {
      root.updateMatrixWorld(true);
      // pieces pop, the ground is painted, and what has not popped casts no shadow
      const depth = new THREE.MeshDepthMaterial();
      depth.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, U);
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>\nattribute vec4 anchor;\n${COORD}`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>\n${POP_GLSL}`);
      };
      root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || !mesh.geometry.getAttribute('anchor')) return;
        reveal(mesh.material as THREE.Material, U);
        mesh.customDepthMaterial = depth;
      });
      for (const piece of root.children)
        piece.traverse((o) => {
          const light = o as THREE.Light;
          if (light.isLight) lamps.push({ light, full: light.intensity, key: coord(piece.position.x, piece.position.z) });
        });
      goblin = root.children.find((o) => o.userData.slot === 'goblin');
      if (goblin) {
        goblinAt = coord(goblin.position.x, goblin.position.z);
        goblinSize = goblin.scale.x;
      }
    },
    at(draw, paint) {
      [draw, paint] = clocks(draw, paint);
      // the pencil starts slowly
      const drawn = ease(Math.pow(Math.min(1, Math.max(0, (draw - DRAW.at) / DRAW.len)), 1.4));
      const painted = ease(paint / PAINT.len);
      U.uDrawn.value = THREE.MathUtils.lerp(-REACH - LINGER, REACH, drawn);
      U.uFront.value = THREE.MathUtils.lerp(REACH, -REACH - POP - LINGER - LEAD, painted);
      const reach = Math.min(U.uDrawn.value, U.uFront.value);
      const still = !Number.isFinite(draw); // no entrance at all: the drawing as it will be, until the models are in
      {
        // the ground is rolled until the paint starts, then drawn as it is
        const settled = still || paint >= 0;
        const n = Math.floor(draw / ROLL.ground);
        const fresh = still ? 1 : unit((settled ? paint : draw - n * ROLL.ground) / ROLL.sketch);
        const now = settled ? 0 : 1 + (n % ROLL.others);
        show(ground, now, Math.min(below(ground[now].keys, reach), Math.ceil(ground[now].keys.length * fresh)));
      }
      for (const p of pieces) {
        // a piece is rolled until the paint is nearly on it; near counts up from 0 as it closes that last stretch
        const ahead = Math.min(ROLL.ahead, REACH - p.c);
        const near = (p.c - U.uFront.value + ahead) / ahead;
        const settled = still || near > 0;
        const n = Math.floor((draw + p.from) / p.stays);
        const fresh = still ? 1 : unit(settled ? near / 0.4 : (draw + p.from - n * p.stays) / ROLL.sketch);
        const now = settled ? 0 : 1 + (n % ROLL.others);
        // stroke by stroke as the pencil comes up to it, the last of them going as it pops
        show(p.takes, now, Math.ceil(p.takes[now].keys.length * fresh * unit(1 - (p.c - reach) / LINGER)));
      }
      group.visible = painted < 1;
      for (const lamp of lamps) lamp.light.intensity = lamp.full * ease((lamp.key - U.uFront.value) / POP);
      if (goblin) {
        const k = Math.min(1, Math.max(0, (goblinAt - U.uFront.value) / POP)) - 1;
        goblin.visible = k > -1;
        goblin.scale.setScalar(goblinSize * (1 + 2.6 * k * k * k + 1.6 * k * k)); // the same spring as the pieces
      }
      return painted;
    },
  };
}
