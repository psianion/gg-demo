import * as THREE from 'three';
import { flare, gust, LIFE, tongues, WIND } from './life';

// THE FIRE'S BREATH. What the campfire gives off, and the light it throws. Embers are small faceted shards
// that leave the flames' feet, ride up on the heat, wander in the turbulence, drift downwind and cool as they
// go, white-yellow to orange to a dark fleck, before they wink out; now and then a log cracks and throws a
// spray of quick sparks. Above them a little smoke, a few faceted puffs swelling and thinning as they rise.
// The campfire's lamp and the lantern's flicker with the flames (the campfire's follows its tongues' flaring,
// the same numbers the shader licks them with, life.ts).
//
// All of it lives in the kit's space, so it rides the island's bob. Fixed pools, nothing allocated per frame.

const EMBERS = 128, PUFFS = 20;

// what an ember looks like as it cools, hottest first, as the screen shows them
const COOL = ['#fff3d1', '#ffd45e', '#ff9c2b', '#f25a14', '#9c260d', '#3d1c13', '#1f1613'].map((c) => new THREE.Color(c));
const SMOKE = { low: new THREE.Color('#6e6058'), high: new THREE.Color('#ddd3c9'), glow: new THREE.Color('#c8743c') };

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Flat-coloured shards, each facet shaded by which way it faces, so a tumbling shard glints. Fogged like the island. */
function shardMaterial(shade: number, smoke: boolean) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uShade: { value: shade } }]),
    vertexShader: /* glsl */ `
      attribute vec4 tint;
      varying vec4 vTint;
      varying vec3 vView;
      #include <fog_pars_vertex>
      void main() {
        vTint = tint;
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vView = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uShade;
      varying vec4 vTint;
      varying vec3 vView;
      #include <fog_pars_fragment>
      void main() {
        vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
        float facet = clamp(dot(n, normalize(vec3(-0.35, 0.8, 0.5))), 0.0, 1.0);
        gl_FragColor = vec4(vTint.rgb * mix(1.0, 0.6 + 0.55 * facet, uShade), vTint.a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
    fog: true,
    transparent: smoke,
    depthWrite: !smoke,
  });
}

/** A fixed pool of particles: where each is, how it moves, how old it is and how long it has, and how it tumbles. */
class Pool {
  live: Uint8Array; p: Float32Array; v: Float32Array; age: Float32Array; life: Float32Array; size: Float32Array;
  seed: Float32Array; shape: Float32Array; axis: Float32Array; turn: Float32Array; spin: Float32Array;
  mesh: THREE.InstancedMesh; tint: THREE.InstancedBufferAttribute; n: number;
  constructor(n: number, geometry: THREE.BufferGeometry, material: THREE.Material) {
    this.n = n;
    this.live = new Uint8Array(n);
    this.p = new Float32Array(n * 3);
    this.v = new Float32Array(n * 3);
    this.age = new Float32Array(n);
    this.life = new Float32Array(n);
    this.size = new Float32Array(n);
    this.seed = new Float32Array(n);
    this.shape = new Float32Array(n * 3);
    this.axis = new Float32Array(n * 3);
    this.turn = new Float32Array(n);
    this.spin = new Float32Array(n);
    this.mesh = new THREE.InstancedMesh(geometry, material, n);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.tint = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    this.tint.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('tint', this.tint);
    this.mesh.frustumCulled = false; // its bounds would be wherever the first frame left them
    this.clear();
  }
  clear() {
    this.live.fill(0);
    for (let i = 0; i < this.n; i++) this.mesh.setMatrixAt(i, ZERO);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  /** a free slot, given a size, a tumble and a seed; -1 if all are taken */
  take(size: number, spin: number) {
    const i = this.live.indexOf(0);
    if (i < 0) return -1;
    this.live[i] = 1;
    this.age[i] = 0;
    this.size[i] = size;
    this.seed[i] = Math.random();
    // a shard is not a ball: each is drawn out a little along its own axes
    put3(this.shape, i, 0.65 + 0.6 * Math.random(), 0.85 + 0.9 * Math.random(), 0.55 + 0.5 * Math.random());
    a.randomDirection();
    put3(this.axis, i, a.x, a.y, a.z);
    this.turn[i] = Math.random() * Math.PI * 2;
    this.spin[i] = spin;
    return i;
  }
  /** draw slot i: at its place, turned, sized (each axis its own) */
  put(i: number, size: number) {
    const j = i * 3;
    a.set(this.axis[j], this.axis[j + 1], this.axis[j + 2]);
    q.setFromAxisAngle(a, this.turn[i]);
    b.set(this.p[j], this.p[j + 1], this.p[j + 2]);
    s.set(this.shape[j] * size, this.shape[j + 1] * size, this.shape[j + 2] * size);
    this.mesh.setMatrixAt(i, m.compose(b, q, s));
  }
  end(i: number) {
    this.live[i] = 0;
    this.mesh.setMatrixAt(i, ZERO);
  }
}

const put3 = (to: Float32Array, i: number, x: number, y: number, z: number) => {
  to[i * 3] = x;
  to[i * 3 + 1] = y;
  to[i * 3 + 2] = z;
};
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const a =new THREE.Vector3(), b = new THREE.Vector3(), s = new THREE.Vector3();
const q = new THREE.Quaternion(), m = new THREE.Matrix4(), c = new THREE.Color();

export interface Fire {
  group: THREE.Group;
  /** after the blockout's at(), which sets the lamps where the entrance has them; `on` is 0 under reduced motion */
  update(dt: number, on: number): void;
}

/** The fire's embers, sparks, smoke and flicker, for the kit `root` (null if it has no campfire). `popped` says
 *  how far a piece standing at (x, z) has popped in, so nothing comes off the fire before it is there. */
export function createFire(root: THREE.Group, popped: (x: number, z: number) => number): Fire | null {
  const camp = root.children.find((o) => o.userData.slot === 'campfire');
  if (!camp) return null;
  const base = camp.position.clone();
  const flames = tongues(camp, root);
  const lampOf = (piece?: THREE.Object3D) => {
    let found: THREE.PointLight | undefined;
    piece?.traverse((o) => {
      if ((o as THREE.PointLight).isPointLight) found = o as THREE.PointLight;
    });
    return found;
  };
  const glow = lampOf(camp);
  const glowAt = glow?.position.clone();
  const lantern = lampOf(root.children.find((o) => o.userData.slot === 'lantern_post'));
  // the lantern's glass glows with its lamp
  const panes: { material: THREE.MeshStandardMaterial; full: number }[] = [];
  root.traverse((o) => {
    const material = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if ((o as THREE.Mesh).isMesh && material?.name === 'pane' && !panes.some((p) => p.material === material))
      panes.push({ material, full: material.emissiveIntensity });
  });

  const embers = new Pool(EMBERS, new THREE.OctahedronGeometry(1, 0), shardMaterial(0.45, false));
  const puffs = new Pool(PUFFS, new THREE.IcosahedronGeometry(1, 0), shardMaterial(1, true));
  puffs.mesh.renderOrder = 1; // over the sky's wash, which is drawn last of all that is solid
  const group = new THREE.Group();
  group.add(embers.mesh, puffs.mesh);
  root.add(group);

  let owed = 0, smokeOwed = 0, crack = 2.5;

  const ember = (fast: boolean) => {
    const i = embers.take(fast ? 0.011 + 0.01 * Math.random() : 0.016 + 0.03 * Math.random() ** 2 + (Math.random() < 0.08 ? 0.025 : 0), 3 + 9 * Math.random());
    if (i < 0) return;
    // from the feet of the flames, a little out from the middle
    const r = (fast ? 0.1 : 0.2) * Math.sqrt(Math.random()), at = Math.random() * Math.PI * 2;
    const out = fast ? 0.4 + 0.5 * Math.random() : 0.15 * Math.random();
    const up = fast ? 1.5 + 1.1 * Math.random() : 0.45 + 0.6 * Math.random();
    put3(embers.p, i, base.x + r * Math.cos(at), base.y + 0.12 + 0.22 * Math.random(), base.z + r * Math.sin(at));
    put3(embers.v, i, Math.cos(at) * out, up, Math.sin(at) * out);
    embers.life[i] = fast ? 0.55 + 0.5 * Math.random() : Math.random() < 0.12 ? 2.6 + 1.2 * Math.random() : 1.0 + 1.6 * Math.random() ** 1.5;
  };
  const puff = () => {
    const i = puffs.take(0.06 + 0.035 * Math.random(),(0.15 + 0.35 * Math.random()) * (Math.random() < 0.5 ? -1 : 1));
    if (i < 0) return;
    const r = 0.12 * Math.sqrt(Math.random()), at = Math.random() * Math.PI * 2;
    put3(puffs.p, i, base.x + r * Math.cos(at), base.y + 0.72 + 0.12 * Math.random(), base.z + r * Math.sin(at));
    put3(puffs.v, i, (Math.random() - 0.5) * 0.08, 0.32 + 0.12 * Math.random(), (Math.random() - 0.5) * 0.08);
    puffs.life[i] = 3.6 + 1.6 * Math.random();
  };

  return {
    group,
    update(dt, on) {
      if (!on) {
        // reduced motion: a still fire gives off nothing
        if (group.visible) {
          embers.clear();
          puffs.clear();
          group.visible = false;
          if (glow && glowAt) glow.position.copy(glowAt);
          for (const pane of panes) pane.material.emissiveIntensity = pane.full;
        }
        return;
      }
      group.visible = true;
      const t = LIFE.uTime.value;
      const lit = popped(base.x, base.z);
      // how the fire is flaring, all its tongues together: -1 to 1, mostly well inside
      let f = 0;
      for (const tongue of flames) f += flare(tongue.seed, t);
      f /= Math.max(1, flames.length);

      // its light breathes with it and shifts a little as the tongues sway; the lantern's flame is steadier
      if (glow && glowAt) {
        glow.intensity *= 1 + 0.2 * f + 0.05 * Math.sin(t * 13.7 + 0.4 * Math.sin(t * 3.1));
        glow.position.set(glowAt.x + 0.025 * Math.sin(t * 4.3), glowAt.y + 0.04 * f, glowAt.z + 0.025 * Math.sin(t * 3.7 + 1));
      }
      const steady = 1 + 0.05 * Math.sin(t * 2.3) + 0.03 * Math.sin(t * 5.9 + 1.2) + 0.02 * Math.sin(t * 11.3 + 0.5);
      if (lantern) lantern.intensity *= steady;
      for (const pane of panes) pane.material.emissiveIntensity = pane.full * steady;

      // embers come off it steadily, more as it flares; a log cracks every few seconds and throws sparks
      owed += 15 * (1 + 0.6 * f) * lit * dt;
      for (; owed >= 1; owed--) ember(false);
      crack -= dt;
      if (crack <= 0) {
        crack = 1.6 + 4 * Math.random();
        if (lit > 0.9) for (let n = 6 + Math.floor(7 * Math.random()); n > 0; n--) ember(true);
      }
      smokeOwed += 2.2 * lit * dt;
      for (; smokeOwed >= 1; smokeOwed--) puff();

      const drag = Math.exp(-1.3 * dt), drift = Math.exp(-0.6 * dt);
      for (let i = 0; i < EMBERS; i++) {
        if (!embers.live[i]) continue;
        const age = (embers.age[i] += dt), life = embers.life[i];
        if (age >= life) {
          embers.end(i);
          continue;
        }
        const k = age / life, heat = 1 - k, j = i * 3, sd = embers.seed[i] * 6.2832;
        const P = embers.p, V = embers.v;
        const px = P[j], py = P[j + 1], pz = P[j + 2], rise = py - base.y;
        // heat carries it up; cooled, it hangs and starts to settle
        V[j + 1] += (1.7 * heat * heat - 0.3) * dt;
        // turbulence: a curling field that slides with time, so neighbouring embers part ways
        const tx = Math.sin(py * 2.3 + t * 1.7 + sd) + 0.5 * Math.sin(pz * 4.1 - t * 2.3 + sd * 2);
        const tz = Math.cos(py * 2.1 - t * 1.3 + sd * 1.3) + 0.5 * Math.sin(px * 3.7 + t * 1.9 + sd * 3);
        // and once clear of the flames the wind takes it, harder in a gust
        const w = 0.6 * gust(px, pz, t) * Math.min(1, rise / 0.9);
        V[j] = (V[j] + (tx * 1.1 + WIND.x * w) * dt) * drag;
        V[j + 1] *= drag;
        V[j + 2] = (V[j + 2] + (tz * 1.1 + WIND.z * w) * dt) * drag;
        P[j] += V[j] * dt;
        P[j + 1] += V[j + 1] * dt;
        P[j + 2] += V[j + 2] * dt;
        embers.turn[i] += embers.spin[i] * dt;
        // grows in over its first moments, shrinks as it cools, and goes to nothing at the end: never a pop
        const size = embers.size[i] * smoothstep(0, 0.06, k) * (1 - smoothstep(0.72, 1, k)) * (1 - 0.3 * k);
        embers.put(i, size);
        // cooling: some embers run cooler than others; a hot one twinkles
        const cool = Math.min(1, Math.max(0, 1 - heat * (0.82 + 0.3 * embers.seed[i]))) * (COOL.length - 1);
        const n = Math.min(COOL.length - 2, Math.floor(cool));
        c.copy(COOL[n]).lerp(COOL[n + 1], cool - n);
        const twinkle = 1 + 0.25 * heat * Math.sin(t * (15 + 9 * embers.seed[i]) + sd * 7);
        embers.tint.setXYZW(i, c.r * twinkle, c.g * twinkle, c.b * twinkle, 1);
      }

      for (let i = 0; i < PUFFS; i++) {
        if (!puffs.live[i]) continue;
        const age = (puffs.age[i] += dt), life = puffs.life[i];
        if (age >= life) {
          puffs.end(i);
          continue;
        }
        const k = age / life, j = i * 3, sd = puffs.seed[i] * 6.2832;
        const P = puffs.p, V = puffs.v;
        const px = P[j], py = P[j + 1], pz = P[j + 2], rise = py - base.y;
        // smoke rises slower, slows as it rises, sways lazily and leans further downwind
        const w = 0.35 * gust(px, pz, t) * Math.min(1, rise / 0.6);
        V[j] = (V[j] + (0.25 * Math.sin(py * 1.3 + t * 0.7 + sd) + WIND.x * w) * dt) * drift;
        V[j + 1] = (V[j + 1] + 0.1 * (1 - k) * dt) * drift;
        V[j + 2] = (V[j + 2] + (0.25 * Math.cos(py * 1.1 - t * 0.6 + sd * 1.7) + WIND.z * w) * dt) * drift;
        P[j] += V[j] * dt;
        P[j + 1] += V[j + 1] * dt;
        P[j + 2] += V[j + 2] * dt;
        puffs.turn[i] += puffs.spin[i] * dt;
        // swells as it goes, and thins in and out
        puffs.put(i, puffs.size[i] * (1 + 1.9 * k) * smoothstep(0, 0.1, k));
        c.copy(SMOKE.low).lerp(SMOKE.high, smoothstep(0, 0.6, k)).lerp(SMOKE.glow, 0.5 * (1 - smoothstep(0, 0.14, k)));
        puffs.tint.setXYZW(i, c.r, c.g, c.b, 0.26 * smoothstep(0, 0.15, k) * (1 - smoothstep(0.35, 1, k)));
      }

      embers.mesh.instanceMatrix.needsUpdate = puffs.mesh.instanceMatrix.needsUpdate = true;
      embers.tint.needsUpdate = puffs.tint.needsUpdate = true;
    },
  };
}
