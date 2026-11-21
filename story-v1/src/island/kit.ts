import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { lifeOf } from './life';

// THE KIT. The camp island as Blender exports it: one GLB per piece, a manifest saying what each slot
// is, a layout saying where each one stands. build() assembles it; nothing here knows what a tree is.
// &proof=1 holds everything still for step 1's match view; &play=1 runs the pieces' looping clips.
//
// Blender is Z-up, the files and this scene are Y-up: (x, y, z) there is (x, z, -y) here.

const KIT = '/models/kit/';
const QUERY = new URLSearchParams(window.location.search);
export const PROOF = QUERY.get('proof') === '1';
export const PLAY = QUERY.get('play') === '1';

type Variant = { glb: string; bounds?: number[]; clips?: { name: string; loop: boolean }[] };
type Manifest = { slots: Record<string, { default: string; variants: Record<string, Variant> }> };
type Instance = { slot: string; variant?: string; pos: [number, number, number]; yaw?: number; scale?: number };
type Layout = { stage: { table_z: number }; instances: Instance[] };
/** What stands where, without the models: two small files, enough to block the island out while they load. */
export type Plan = { manifest: Manifest; layout: Layout };
/** `goblin`: his rig, its mixer, and every clip he has, for the beats that step them (dock.ts) */
export type Built = {
  root: THREE.Group; loose: THREE.Group; tableY: number;
  goblin: { node: THREE.Object3D; mixer: THREE.AnimationMixer; clips: THREE.AnimationClip[] };
};

// the island's soft shadow on the table: the Blender lamp is 27 m wide, so it is a stain, not an outline
export const STAIN = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const fade = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  fade.addColorStop(0, 'rgba(10, 6, 4, 0.55)');
  fade.addColorStop(0.55, 'rgba(10, 6, 4, 0.32)');
  fade.addColorStop(1, 'rgba(10, 6, 4, 0)');
  g.fillStyle = fade;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();

function place(node: THREE.Object3D, pos: [number, number, number], yaw = 0, scale = 1) {
  node.position.set(pos[0], pos[2], -pos[1]);
  node.rotation.y = THREE.MathUtils.degToRad(yaw);
  node.scale.multiplyScalar(scale);
  node.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
    // the files carry lamp strengths in candela; this scene's sun is in Blender's small numbers
    if ((o as THREE.PointLight).isPointLight) (o as THREE.PointLight).intensity /= 10000;
  });
}

/** Everything that stands still is drawn as one mesh per material: tens of draw calls instead of thousands. */
function batch(root: THREE.Group, moving: Set<THREE.Object3D>): THREE.Group {
  root.updateMatrixWorld(true);
  const groups = new Map<string, { material: THREE.Material; parts: THREE.BufferGeometry[] }>();
  const taken: THREE.Mesh[] = [];
  const moves = (o: THREE.Object3D) => {
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (moving.has(p)) return true;
    return false;
  };
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material) || moves(mesh)) return;
    const material = mesh.material as THREE.MeshStandardMaterial;
    const keep = ['position', 'normal', ...(material.map ? ['uv'] : []), ...(material.vertexColors ? ['color'] : [])];
    const lean = new THREE.BufferGeometry();
    for (const name of keep) {
      const attribute = mesh.geometry.getAttribute(name);
      if (attribute) lean.setAttribute(name, attribute);
    }
    lean.setIndex(mesh.geometry.index);
    const flat = lean.index ? lean.toNonIndexed() : lean.clone();
    flat.applyMatrix4(mesh.matrixWorld);
    // where its piece stands, on every vertex, so a shader can move a whole piece at once (blockout.ts);
    // w is 0 for the ground, which is not a piece but the thing they stand on
    let piece: THREE.Object3D = mesh;
    while (piece.parent && piece.parent !== root) piece = piece.parent;
    const anchor = new Float32Array(flat.getAttribute('position').count * 4);
    for (let i = 0; i < anchor.length; i += 4) {
      anchor[i] = piece.position.x;
      anchor[i + 1] = piece.position.y;
      anchor[i + 2] = piece.position.z;
      anchor[i + 3] = piece.userData.slot === 'island' ? 0 : 1;
    }
    flat.setAttribute('anchor', new THREE.BufferAttribute(anchor, 4));
    // and what it is to the wind, the fire and the clouds (life.ts), so the shader can move it
    const vec = lifeOf(piece, mesh, flat);
    const life = new Float32Array(anchor.length);
    for (let i = 0; i < life.length; i += 4) life.set(vec, i);
    flat.setAttribute('life', new THREE.BufferAttribute(life, 4));
    const shape = Object.entries(flat.attributes).map(([name, a]) => `${name}:${a.array.constructor.name}:${a.itemSize}`);
    const key = `${material.uuid}|${shape.sort().join(',')}`;
    if (!groups.has(key)) groups.set(key, { material, parts: [] });
    groups.get(key)!.parts.push(flat);
    taken.push(mesh);
  });
  for (const mesh of taken) mesh.removeFromParent();
  const still = new THREE.Group();
  for (const { material, parts } of groups.values()) {
    const merged = new THREE.Mesh(mergeGeometries(parts), material);
    merged.castShadow = true;
    merged.receiveShadow = true;
    still.add(merged);
  }
  return still;
}

export async function readPlan(): Promise<Plan> {
  const [manifest, layout] = (await Promise.all([
    fetch(`${KIT}manifest.json`).then((r) => r.json()),
    fetch(`${KIT}layout.json`).then((r) => r.json()),
  ])) as [Manifest, Layout];
  return { manifest, layout };
}

export async function build(mixers: THREE.AnimationMixer[], plan?: Plan): Promise<Built> {
  const { manifest, layout } = plan ?? (await readPlan());
  const loader = new GLTFLoader();
  const files = new Map<string, Promise<GLTF>>();
  const file = (name: string) => {
    if (!files.has(name)) files.set(name, loader.loadAsync(KIT + name));
    return files.get(name)!;
  };
  const root = new THREE.Group(); // the island and everything standing on it
  const loose = new THREE.Group(); // what lies on the table beside it
  const moving = new Set<THREE.Object3D>();
  await Promise.all(
    layout.instances.map(async (inst) => {
      const slot = manifest.slots[inst.slot];
      if (!slot) return;
      const variant = slot.variants[inst.variant ?? slot.default];
      const gltf = await file(variant.glb);
      const node = clone(gltf.scene);
      place(node, inst.pos, inst.yaw, inst.scale);
      node.userData.slot = inst.slot;
      node.userData.bounds = variant.bounds;
      (inst.slot === 'd20' ? loose : root).add(node);
      if (!PLAY) return;
      const loops = new Set((variant.clips ?? []).filter((c) => c.loop).map((c) => c.name));
      const clips = gltf.animations.filter((a) => loops.has(a.name));
      if (!clips.length) return;
      moving.add(node);
      const mixer = new THREE.AnimationMixer(node);
      for (const clip of clips) mixer.clipAction(clip).play();
      mixer.setTime(inst.pos[0] * 0.11); // a gust crosses the island, it does not hit everything at once
      mixers.push(mixer);
    }),
  );
  const rig = await file('goblin__lp.glb');
  const goblin = clone(rig.scene);
  place(goblin, [-0.9, 0, 0], 48);
  goblin.userData.slot = 'goblin';
  const idle = rig.animations.find((a) => a.name === 'idle_alive');
  const mixer = new THREE.AnimationMixer(goblin);
  if (idle) {
    mixer.clipAction(idle).play();
    mixer.setTime(0); // the match view holds him on this frame
    if (PLAY || !PROOF) mixers.push(mixer);
  }
  root.add(goblin);
  moving.add(goblin); // he stays a rig of separate parts
  root.add(batch(root, moving));
  loose.add(batch(loose, new Set()));
  return { root, loose, tableY: layout.stage.table_z, goblin: { node: goblin, mixer, clips: rig.animations } };
}
