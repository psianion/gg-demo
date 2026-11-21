import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LINE, PAPER, polyline, STROKE_LAYER, type Weight } from '../hero/film/pencil.ts';
import type { Built } from './kit';

// THE DOCK (Beat 1, u 0 to 2). The goblin walks to the near edge, takes up the rope, hauls the island down onto its
// map sheet, ties off on the signpost and walks to the middle of the camp. All of it is keyed in Blender
// (blender/dock.py) and written to dock.json, sampled along u: how far the camera has come down and in, from the
// hero's resting view to the film's own dock framing (each solved for the window on the page), the
// goblin's spot and the weight and time of each of his clips, the rope's shape, the sheet, the sky and the clouds.
// at(u) reads it; nothing here keeps time of its own, so the beat plays the same backward.
//
// The sheet arrives in the entrance's language (blockout.ts): its ruling is drawn in pencil across the page, swept
// by the same kind of coordinate, then the colour crosses it back with a ragged edge and the pencil goes under it.
//
// Blender is Z-up, the kit Y-up: (x, y, z) there is (x, z, -y) here.

const KIT = '/models/kit/';
const CLIPS = ['walk', 'take_rope', 'haul_rope', 'tie_off', 'dust_hands'] as const;

type Track = number[];
interface Path {
  per_u: number;
  turn: Track; dolly: Track; glide: Track;
  goblin: { x: Track; y: Track; z: Track; yaw: Track };
  clips: Record<string, { w: Track; t: Track }>;
  rope: { haul: Track; tied: Track };
  sheet: { lift: Track; drawn: Track; painted: Track };
  sky: Track; away: Track; bob: Track;
  files: { rope: string; sheet: string };
  at: { sheet: [number, number]; sheet_z: number; lip: [number, number]; fade: [number, number] };
  grid: { squares: [number, number]; cell: number; rule: number; margin: number; borders: [number, number][] };
}

/** The beat at one u: how far the camera has gone from the hero's rest to the dock framing (0 to 1: in its angles,
 *  in its distance, counted in log, and in the point it looks at), how far the sky and its clouds have gone, and
 *  how much of the island's bob is left. */
export interface DockAt { turn: number; dolly: number; glide: number; sky: number; away: number; bob: number }

export interface Dock {
  /** the sheet, its pencil and nothing else: it stands in the kit's space but does not ride the island's bob */
  sheet: THREE.Group;
  /** the rope, and where it goes over the edge in the kit's space (x, z): it shows once the paint has reached there */
  rope: THREE.Object3D;
  lip: [number, number];
  /** everything of the beat at u; the goblin's clips are set, ready for his mixer's next update */
  at(u: number): DockAt;
}

// the sweep's coordinate: the entrance's (blockout.ts), not held to the island, since the sheet reaches far past it
const coord = (x: number, z: number) => x - 0.45 * z + 0.55 * Math.sin(z * 0.9 + 1.3) + 0.3 * Math.sin(x * 1.7 - z * 1.1);
const COORD = /* glsl */ `
  uniform float uSheetFront; // coloured: every coordinate above this
  uniform vec3 uSheetAt;     // where the sheet's middle is, in the kit's space
  varying vec3 vSheetP;
  uniform vec2 uFade;        // it fades into the page between these, along the way it runs back
  uniform vec3 uPage;        // the page, as the screen shows it
  float shHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float shNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(shHash(i), shHash(i + vec2(1.0, 0.0)), f.x), mix(shHash(i + vec2(0.0, 1.0)), shHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float shEdge(vec3 p) {
    float c = p.x - 0.45 * p.z + 0.55 * sin(p.z * 0.9 + 1.3) + 0.3 * sin(p.x * 1.7 - p.z * 1.1);
    return c - uSheetFront + (shNoise(vec2(p.x * 0.7 + p.z * 0.3, p.z * 6.0)) - 0.5) * 1.5 + (shNoise(p.xz * 5.0) - 0.5) * 0.3;
  }
`;
const REACH = 34; // every coordinate on the sheet lies inside ±REACH
const LIFT = 0.04; // the pencil lies this far over the paper, so it is not lost in it

const at = (track: Track, i: number, k: number) => track[i] + (track[i + 1] - track[i]) * k;

/** Load the beat and its pieces. `built` is the island as kit.ts made it; `size` is the scale the kit is shown at,
 *  so the pencil's hand comes out the size it was drawn for. */
export async function createDock(built: Built, size: number): Promise<Dock> {
  const path = (await fetch(`${KIT}dock.json`).then((r) => r.json())) as Path;
  const loader = new GLTFLoader();
  const [ropeFile, sheetFile] = await Promise.all([loader.loadAsync(KIT + path.files.rope), loader.loadAsync(KIT + path.files.sheet)]);

  // ---- the rope: one tube in the island's space, its shapes as morph targets (haul, tied) over the hang
  let rope: THREE.Mesh | undefined;
  ropeFile.scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    rope = mesh;
    mesh.castShadow = mesh.receiveShadow = true;
    const m = mesh.material as THREE.MeshStandardMaterial;
    m.flatShading = true; // its facets as they bend, not the normals of the shape it was built in
    m.needsUpdate = true;
  });
  built.root.add(ropeFile.scene);
  const morph = (name: string) => rope?.morphTargetDictionary?.[name] ?? -1;
  const [haulAt, tiedAt] = [morph('haul'), morph('tied')];

  // ---- the goblin's clips, each stepped by u (never played); the idle keeps its own clock and only fades
  const { node: goblin, mixer, clips } = built.goblin;
  const idle = clips.find((c) => c.name === 'idle_alive');
  const actions = new Map<string, THREE.AnimationAction>();
  for (const name of CLIPS) {
    const clip = clips.find((c) => c.name === name);
    if (clip) actions.set(name, mixer.clipAction(clip));
  }
  // where he stands at the end: his idle again, a copy so it can be stepped while the first keeps time
  if (idle) {
    const rest = idle.clone();
    rest.name = 'rest';
    actions.set('rest', mixer.clipAction(rest));
  }
  for (const a of actions.values()) {
    a.play();
    a.setEffectiveTimeScale(0);
    a.setEffectiveWeight(0);
  }
  const idling = idle ? mixer.existingAction(idle) : null;

  // ---- the sheet: the painted one from Blender, its pieces put into the sheet's own metres
  const sheet = new THREE.Group();
  sheet.visible = false;
  // seen from the low dock view it runs back toward the horizon, and fades into the page before its far edge
  const [near, far] = path.at.fade;
  const faded = (z: number) => THREE.MathUtils.smoothstep(-z, near, far); // z in the kit's space; Blender's +Y is -z
  const U = {
    uSheetFront: { value: REACH }, uSheetAt: { value: new THREE.Vector3() },
    uFade: { value: new THREE.Vector2(near, far) }, uPage: { value: new THREE.Vector3(0xf7, 0xf5, 0xf0).divideScalar(255) }, // PAPER
  };
  sheetFile.scene.updateMatrixWorld(true);
  const papers: THREE.Mesh[] = [];
  sheetFile.scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const paper = new THREE.Mesh(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), mesh.material);
    paper.receiveShadow = true;
    const m = paper.material as THREE.Material;
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, U);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\nuniform vec3 uSheetAt;\nvarying vec3 vSheetP;`)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSheetP = position + uSheetAt;');
      // nothing ahead of the colour's edge, and just behind it a little darker, where the wet paint pools
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${COORD}`)
        .replace(
          '#include <fog_fragment>',
          `#include <fog_fragment>
          float shE = shEdge(vSheetP);
          if (shE < 0.0) discard;
          gl_FragColor.rgb *= 1.0 - 0.22 * smoothstep(0.0, 0.06, shE) * (1.0 - smoothstep(0.06, 0.4, shE));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uPage, smoothstep(uFade.x, uFade.y, -vSheetP.z));`,
        );
    };
    m.customProgramCacheKey = () => 'sheet';
    papers.push(paper);
    sheet.add(paper);
  });

  // ---- its ruling in pencil: every line of the grid cut at each square, both borders and the torn outline, each
  // stroke keyed by where it lies so the pencil can sweep across them and the colour sweep back over them
  const LEAD = new THREE.Color(LINE), PAGE = new THREE.Color(PAPER), tone = new THREE.Color();
  const g = path.grid;
  const W = (g.squares[0] * g.cell) / 2 + g.margin, H = (g.squares[1] * g.cell) / 2 + g.margin;
  const [sx, sy] = path.at.sheet;
  const centre = new THREE.Vector3(sx, 0, -sy); // in the kit's space, before its height
  const ruled = (n: number) => Array.from({ length: n + 1 }, (_, k) => (k - n / 2) * g.cell);
  const xs = ruled(g.squares[0]), zs = ruled(g.squares[1]);
  const v = (x: number, z: number) => new THREE.Vector3(x * size, LIFT * size, z * size);
  const grid: THREE.Vector3[][] = [];
  for (const x of xs) for (let j = 0; j < zs.length - 1; j++) grid.push([v(x, zs[j]), v(x, zs[j + 1])]);
  for (const z of zs) for (let i = 0; i < xs.length - 1; i++) grid.push([v(xs[i], z), v(xs[i + 1], z)]);
  const frame: THREE.Vector3[][] = [];
  for (const inset of [0, ...g.borders.map((b) => b[0])]) {
    const w = W - inset, h = H - inset;
    const corners = [v(-w, -h), v(w, -h), v(w, h), v(-w, h)];
    // each side in pieces a square or so long, so it is drawn and painted over a bit at a time
    corners.forEach((a, i) => {
      const b = corners[(i + 1) % 4];
      const n = Math.max(1, Math.round(a.distanceTo(b) / size / g.cell));
      for (let k = 0; k < n; k++) frame.push([a.clone().lerp(b, k / n), a.clone().lerp(b, (k + 1) / n)]);
    });
  }
  const pencil = (pieces: THREE.Vector3[][], weight: Weight) => {
    const strokes: { key: number; at: ArrayLike<number>; i: number }[] = [];
    let shared: LineMaterial | undefined;
    for (const [a, b] of pieces) {
      // the hand's wobble is sized for what the lens sees, so it is drawn at display size and put back
      const line = polyline([a, b], weight);
      shared = line.material as LineMaterial;
      const data = (line.geometry.getAttribute('instanceStart') as THREE.InterleavedBufferAttribute).data.array;
      for (let i = 0; i < data.length; i += 6)
        strokes.push({ key: coord(centre.x + (data[i] + data[i + 3]) / 2 / size, centre.z + (data[i + 2] + data[i + 5]) / 2 / size), at: data, i });
      line.geometry.dispose();
    }
    strokes.sort((p, q) => p.key - q.key);
    const positions = new Float32Array(strokes.length * 6);
    // the lead pales into the page as the sheet runs back, the way its colour does
    const colours = new Float32Array(strokes.length * 6);
    strokes.forEach((s, n) => {
      for (let k = 0; k < 6; k++) positions[n * 6 + k] = s.at[s.i + k] / size;
      for (let end = 0; end < 2; end++) tone.copy(LEAD).lerp(PAGE, faded(centre.z + positions[n * 6 + end * 3 + 2])).toArray(colours, n * 6 + end * 3);
    });
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colours);
    const material = shared!.clone();
    material.vertexColors = true;
    material.color.set(0xffffff);
    const lines = new LineSegments2(geometry, material);
    lines.layers.set(STROKE_LAYER);
    lines.frustumCulled = false;
    sheet.add(lines);
    return { lines, keys: Float32Array.from(strokes, (s) => s.key), material, shared: shared! };
  };
  const drawn = [pencil(grid, 'faint'), pencil(frame, 'form')];
  const below = (keys: Float32Array, c: number) => {
    let lo = 0, hi = keys.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (keys[mid] < c) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const out: DockAt = { turn: 0, dolly: 0, glide: 0, sky: 1, away: 0, bob: 1 };
  return {
    sheet,
    rope: ropeFile.scene,
    lip: [path.at.lip[0], -path.at.lip[1]],
    at(u) {
      const f = Math.min(Math.max(u, 0), 2) * path.per_u;
      const i = Math.min(Math.floor(f), path.turn.length - 2), k = f - i;
      out.turn = at(path.turn, i, k);
      out.dolly = at(path.dolly, i, k);
      out.glide = at(path.glide, i, k);
      out.sky = at(path.sky, i, k);
      out.away = at(path.away, i, k);
      out.bob = at(path.bob, i, k);

      // the goblin: where he stands and which way he faces, then each clip's weight and its time at this u
      const G = path.goblin;
      goblin.position.set(at(G.x, i, k), at(G.z, i, k), -at(G.y, i, k));
      goblin.rotation.y = THREE.MathUtils.degToRad(at(G.yaw, i, k));
      idling?.setEffectiveWeight(at(path.clips.idle.w, i, k));
      for (const [name, action] of actions) {
        const c = path.clips[name];
        action.setEffectiveWeight(at(c.w, i, k));
        // a one-off holds its last frame; the walk and the haul loop (a stepped action is not wrapped for it)
        const t = at(c.t, i, k), long = action.getClip().duration;
        action.time = name === 'walk' || name === 'haul_rope' ? t % long : Math.min(t, long - 1e-4);
      }

      // the rope's shape
      if (rope?.morphTargetInfluences) {
        if (haulAt >= 0) rope.morphTargetInfluences[haulAt] = at(path.rope.haul, i, k);
        if (tiedAt >= 0) rope.morphTargetInfluences[tiedAt] = at(path.rope.tied, i, k);
      }

      // the sheet: up from far below, drawn, then coloured
      const lift = at(path.sheet.lift, i, k), drawnK = at(path.sheet.drawn, i, k), painted = at(path.sheet.painted, i, k);
      sheet.visible = drawnK > 0;
      sheet.position.set(centre.x, path.at.sheet_z - lift, centre.z);
      U.uSheetAt.value.copy(sheet.position);
      U.uSheetFront.value = THREE.MathUtils.lerp(REACH, -REACH, painted);
      for (const paper of papers) paper.visible = painted > 0;
      const reach = Math.min(THREE.MathUtils.lerp(-REACH, REACH, drawnK), U.uSheetFront.value);
      for (const d of drawn) {
        d.lines.geometry.instanceCount = below(d.keys, reach);
        d.material.resolution.copy(d.shared.resolution); // the page keeps the pencil's own weight right on resize
      }
      return out;
    },
  };
}
