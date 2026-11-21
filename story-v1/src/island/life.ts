import * as THREE from 'three';

// THE LIFE. What moves on the island once it is painted: the trees, bushes, grass and flowers bend in a wind
// whose gusts roll across the island, the clouds drift and bob, the fire's tongues lick and twist, the
// banner billows. The island stays merged, so all of it is done in the vertex shader: kit.ts bakes a `life`
// attribute on every vertex saying what it belongs to, and blockout.ts runs LIFE_VERTEX after a piece's pop,
// in its colour and its shadow alike. Each motion is a sum of slow sines at unrelated rates, so nothing loops.
//
// `life` is (kind + seed, three numbers for that kind). kind is 0 for what stands still, then:
//   1 a plant:  its height above its own origin, how far its top moves in a full gust, unused
//   2 a cloud:  unused
//   3 a flame:  where its tongue rises from (x, y, z)
//   4 a cloth:  the height it hangs from, how far it hangs, the way its face looks (radians about Y)
// seed (0 to 1) keeps neighbours out of step.

/** shared by every kit material: the island's own clock, and how alive it is (0 under reduced motion) */
export const LIFE = { uTime: { value: 0 }, uLife: { value: 1 } };

/** The island's clock runs only while it is on screen; `on` is 0 under reduced motion. */
export function stepLife(dt: number, on: number) {
  LIFE.uTime.value += dt * on;
  LIFE.uLife.value = on;
}

// how far a plant's top moves in a full gust, per metre of its height: a tuft is far more pliant than a pine
const PLANTS: Record<string, number> = { hero_tree: 0.07, pine: 0.06, bush: 0.05, grass: 0.11, flowers: 0.1 };
const FLAME_H = 0.9; // a tongue's height, about; its licks grow toward its tip

/** the way the wind blows across the island, in the kit's space (x, z) */
export const WIND = { x: 0.8, z: -0.6 };

/** A number from 0 to 1 that is the same for the same place. */
export function seedOf(x: number, z: number) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** How hard the wind is blowing at (x, z): 0 to 1, mostly low, rising in gusts that travel downwind. Mirrors lfGust. */
export function gust(x: number, z: number, t: number) {
  const along = x * WIND.x + z * WIND.z, across = x * 0.6 + z * 0.8;
  const g = 0.55 + 0.3 * Math.sin(along * 0.55 - t * 1.35 + 0.8 * Math.sin(across * 0.35 + t * 0.16)) + 0.15 * Math.sin(along * 1.3 - t * 2.6 + across * 0.6);
  return g * g;
}

/** How a tongue is flaring, -1 to 1: it stretches and brightens as this rises. Mirrors lfFlare. */
export function flare(seed: number, t: number) {
  const p = seed * 6.2832;
  return 0.5 * Math.sin(t * 3.7 + p) + 0.3 * Math.sin(t * 6.3 + p * 2.1) + 0.2 * Math.sin(t * 10.1 + p * 3.7);
}

const v = new THREE.Vector3();

/** What a mesh of a piece is, for the shader: the four numbers of its `life` (see above). `flat` is the mesh
 *  already moved into the kit's space. */
export function lifeOf(piece: THREE.Object3D, mesh: THREE.Object3D, flat: THREE.BufferGeometry): [number, number, number, number] {
  const slot = piece.userData.slot as string;
  const seed = Math.min(0.999, seedOf(piece.position.x, piece.position.z));
  const part = (name: RegExp) => {
    for (let o: THREE.Object3D | null = mesh; o && o !== piece; o = o.parent) if (name.test(o.name)) return o;
    return null;
  };
  if (slot in PLANTS) {
    const top = ((piece.userData.bounds as number[] | undefined)?.[5] ?? 1) * piece.scale.x;
    return [1 + seed, top, PLANTS[slot] * top, 0];
  }
  if (slot === 'cloud') return [2 + seed, 0, 0, 0];
  if (slot === 'campfire') {
    const tongue = part(TONGUE);
    if (tongue) {
      tongue.getWorldPosition(v);
      return [3 + tongueSeed(tongue.name), v.x, v.y, v.z];
    }
  }
  if (slot === 'banner' && part(/^cloth$/)) {
    flat.computeBoundingBox();
    const box = flat.boundingBox!;
    return [4 + seed, box.max.y, box.max.y - box.min.y, piece.rotation.y];
  }
  return [0, 0, 0, 0];
}

/** The tongues of the fire, in the kit's space (`root`'s): where each rises from and its seed, as the shader has them. */
export function tongues(piece: THREE.Object3D, root: THREE.Object3D) {
  const out: { at: THREE.Vector3; seed: number }[] = [];
  root.updateMatrixWorld(true);
  piece.traverse((o) => {
    if (!TONGUE.test(o.name)) return;
    out.push({ at: root.worldToLocal(o.getWorldPosition(new THREE.Vector3())), seed: tongueSeed(o.name) });
  });
  return out;
}

// a tongue's seed comes from its name, not where it stands, so this side and the shader's agree exactly
const TONGUE = /^(tongue_\d+|core)$/;
const tongueSeed = (name: string) => {
  const s = ((name === 'core' ? 7 : Number(name.slice(7)) + 1) * 0.618034) % 1;
  return Math.min(0.999, s);
};

// declarations, after blockout's COORD (it needs uFront and rvCoord)
export const LIFE_PARS = /* glsl */ `
  attribute vec4 life;
  uniform float uTime;
  uniform float uLife;
  varying float vLfGlow;
  const vec2 LF_WIND = vec2(${WIND.x.toFixed(2)}, ${WIND.z.toFixed(2)});
  float lfGust(vec2 p, float t) {
    float along = dot(p, LF_WIND), across = dot(p, vec2(0.6, 0.8));
    float g = 0.55 + 0.3 * sin(along * 0.55 - t * 1.35 + 0.8 * sin(across * 0.35 + t * 0.16)) + 0.15 * sin(along * 1.3 - t * 2.6 + across * 0.6);
    return g * g;
  }
  float lfFlare(float p, float t) {
    return 0.5 * sin(t * 3.7 + p) + 0.3 * sin(t * 6.3 + p * 2.1) + 0.2 * sin(t * 10.1 + p * 3.7);
  }
`;

// after the pop: `transformed` is where the piece's vertex stands now. Nothing moves until its piece has popped,
// and it eases in over the pop (`pop`, how far the paint travels while a piece pops)
export const lifeVertex = (pop: number) => /* glsl */ `
  vLfGlow = 1.0;
  {
    float lfKind = floor(life.x);
    float lfOn = uLife * smoothstep(0.0, 1.0, clamp((rvCoord(anchor.xyz) - uFront) / ${pop.toFixed(2)}, 0.0, 1.0));
    float lfPh = fract(life.x) * 6.2832;
    float t = uTime;
    if (lfKind == 1.0 && lfOn > 0.0) {
      // a plant bends from its foot, the more the higher: leaning downwind in the gust, rocking at its own
      // pace (a tall thing slowly, a tuft quickly), its leaves shivering
      float h = clamp((transformed.y - anchor.y) / life.y, 0.0, 1.2);
      float b = h * h;
      float g = lfGust(anchor.xz, t);
      float f = 3.2 / sqrt(max(life.y, 0.3));
      vec2 rock = LF_WIND * sin(t * f + lfPh) + vec2(0.6, 0.8) * 0.45 * sin(t * f * 0.77 + lfPh * 1.7);
      vec2 d = life.z * b * (LF_WIND * (0.15 + 0.85 * g) + rock * (0.3 + 0.3 * g));
      vec3 k = position * 7.0;
      vec3 shiver = vec3(sin(t * 5.3 + k.x + k.y), sin(t * 4.6 + k.y * 1.3 + k.z), sin(t * 5.9 + k.z + k.x * 0.7));
      vec3 moved = vec3(d.x, -0.5 * dot(d, d) / max(h * life.y, 0.05), d.y) + shiver * life.z * 0.1 * b * (0.3 + g);
      transformed += moved * lfOn;
    } else if (lfKind == 2.0 && lfOn > 0.0) {
      // a cloud wanders to and fro about where it hangs, each along its own heading and at its own pace (so no
      // two are ever in step), drifts a little across that, bobs, and its puffs slowly swell and settle
      vec3 r = transformed - anchor.xyz;
      float heading = (fract(life.x * 7.31 + 0.13) - 0.5) * 1.4; // across the view, more or less: depth hardly shows
      float pace = 0.65 + 0.8 * fract(life.x * 3.17 + 0.71);
      vec2 way = vec2(cos(heading), sin(heading));
      float tc = t * pace;
      float to = 0.42 * sin(tc * 0.21 + lfPh) + 0.14 * sin(tc * 0.47 + lfPh * 2.3);
      float fro = 0.18 * sin(tc * 0.29 + lfPh * 1.7);
      float bob = 0.14 * sin(tc * 0.5 + lfPh * 1.3) + 0.05 * sin(tc * 0.83 + lfPh * 3.1);
      vec2 drift = way * to + vec2(-way.y, way.x) * fro;
      float swell = 0.03 * sin(t * 0.4 + lfPh + dot(r, vec3(0.9, 0.6, 0.4)));
      transformed += (vec3(drift.x, bob, drift.y) + r * swell) * lfOn;
    } else if (lfKind == 3.0 && lfOn > 0.0) {
      // a tongue of the fire: it stretches as it flares and thins as it does, twists, and licks, the tip
      // whipping after the base; the wind leans it a little
      vec3 q = transformed - life.yzw;
      float h = clamp(q.y / ${FLAME_H.toFixed(2)}, 0.0, 1.2);
      float n = lfFlare(lfPh, t);
      q.y *= 1.0 + 0.2 * n;
      q.xz *= 1.0 - 0.14 * n * h;
      float a = h * (0.45 * sin(t * 1.9 + lfPh) + 0.25 * sin(t * 3.3 + lfPh * 1.6));
      q.xz = mat2(cos(a), sin(a), -sin(a), cos(a)) * q.xz;
      q.xz += vec2(sin(t * 5.1 - h * 3.5 + lfPh), sin(t * 4.3 - h * 2.9 + lfPh * 1.9 + 1.0)) * 0.06 * h * h;
      q.xz += LF_WIND * 0.08 * h * h * lfGust(life.yw, t);
      transformed = mix(transformed, life.yzw + q, lfOn);
      // brighter as it flares, with a band of heat running up it
      vLfGlow = mix(1.0, 1.0 + 0.14 * n + 0.08 * sin(t * 7.0 - h * 5.0 + lfPh), lfOn);
    } else if (lfKind == 4.0 && lfOn > 0.0) {
      // a cloth hangs from its bar and billows forward, away from its pole, in ripples running down it; its
      // hem is blown out sideways in the gust and swings back as it drops, a beat behind the top
      float d = clamp((life.y - transformed.y) / life.z, 0.0, 1.0);
      vec2 face = vec2(sin(life.w), cos(life.w));
      vec2 side = vec2(face.y, -face.x);
      float across = dot(transformed.xz - anchor.xz, side);
      float g = lfGust(anchor.xz, t);
      float wave = 0.6 * sin(d * 4.5 - t * 3.2 + across * 2.5 + lfPh) + 0.4 * sin(d * 7.0 - t * 4.6 - across * 3.0 + lfPh * 1.3);
      float push = d * 0.05 * (1.0 + wave) * (0.4 + g);
      float swing = d * d * (0.13 * g * dot(side, LF_WIND) + 0.07 * sin(t * 1.9 - d * 1.2 + lfPh) + 0.03 * sin(t * 3.1 - d * 2.0 + lfPh * 1.7));
      transformed.xz += (face * push + side * swing) * lfOn;
      transformed.y += 0.5 * swing * swing / max(d * life.z, 0.05) * lfOn;
    }
  }
`;

export const LIFE_FRAG_PARS = /* glsl */ `
  varying float vLfGlow;
`;
// after <emissivemap_fragment>: a flame's light rises and falls with it
export const LIFE_FRAG = /* glsl */ `
  totalEmissiveRadiance *= vLfGlow;
`;
