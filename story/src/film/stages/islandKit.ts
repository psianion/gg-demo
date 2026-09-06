import * as THREE from 'three';
import { earth, ink } from '../palette.ts';
import { curtain } from '../curtain.ts';
import { createTrilayer, rig } from './trilayer.ts';

// THE ISLAND KIT (direction doc §3) — the diorama base every v2 stage stands on.
//
// The world is built on islands: a finite ground card with a painted, feathered edge,
// floating on the page. The paper is the void — no infinite ground planes anywhere in
// v2. This kit replaces world.ts's buildGround planes stage by stage; the v1 film
// keeps its planes until each stage migrates.
//
// The card drops a soft shadow onto the page (hero doc §5: the island is only as real
// as its finished part — the shadow fades to nothing under Prep, when the island is a
// drawing and a drawing casts none). Both meshes ride the same curtain uniform as the
// trilayer, so the whole base is one material state.
//
// Page margin (direction §6 four-plane rule / §3): the kit cannot see the viewport —
// margin is a framing concern. `radiusX`/`radiusZ` on the returned kit are the extents
// the stage's camera solve frames WITH the page margin; nothing here may be framed
// touching the viewport edge.

const shadowVert = /* glsl */ `
  varying vec2 vP;
  varying vec3 vWorld;
  void main() {
    vP = position.xy;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shadowFrag = /* glsl */ `
  uniform float uCurtain;
  uniform float uSeamX;
  uniform float uSeamW;
  uniform vec3 uInk;
  varying vec2 vP;
  varying vec3 vWorld;
  void main() {
    float r = length(vP);
    // The same material state the trilayer computes: global curtain OR the spatial
    // seam (hero doc §5 — the drop shadow is present under the painted half, gone
    // under the graphite half; the island is only as real as its finished part).
    float cSeam = max(uCurtain, smoothstep(uSeamX - uSeamW, uSeamX + uSeamW, vWorld.x));
    // Plateau falloff: near-full strength holds out past the card's rim (the card sits
    // at shadow-local r ~= 0.8), then exhales to nothing at the shadow's edge — so a
    // legible soft band actually escapes the silhouette instead of hiding under the
    // opaque card. Whole thing fades away as the curtain rises: a drawing casts none.
    float a = (1.0 - smoothstep(0.62, 1.0, r)) * 0.24 * (1.0 - cSeam);
    gl_FragColor = vec4(uInk, a);
    // Film-parity transfer: ink is linear in here; to canvas this encodes sRGB, to a
    // render target (the film path) it is a no-op — same ink either way. Tone mapping
    // stays off via toneMapped:false, matching the film's suppressed world pass.
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface IslandOpts {
  radiusX?: number; // half-extent along x, world units
  radiusZ?: number; // half-extent along z
  feather?: number; // painted-edge feather as a fraction of the rim (0..1)
  color?: number; // ground albedo (trilayer paint slot)
}

export interface Island {
  root: THREE.Group;
  ground: THREE.Mesh;
  shadow: THREE.Mesh;
  radiusX: number;
  radiusZ: number;
}

/** One diorama base: finite feathered ground card + page drop shadow. */
export function buildIsland({
  radiusX = 2.5,
  radiusZ = 1.75,
  feather = 0.12,
  color = earth, // the default card is a slice of path world — by token, never re-inlined
}: IslandOpts = {}): Island {
  const root = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    // ground: the island card is the one surface page furniture (grid + ghosts)
    // prints on — everything else stands ON the gridded page, not gridded itself
    createTrilayer({ color, feather, ground: true }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.scale.set(radiusX, radiusZ, 1);
  // the alive shadow lands here — inert until a rig enables renderer shadows
  ground.receiveShadow = true;
  root.add(ground);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.ShaderMaterial({
      vertexShader: shadowVert,
      fragmentShader: shadowFrag,
      uniforms: {
        uCurtain: curtain as THREE.IUniform<number>, // the one curtain uniform, by identity
        uSeamX: rig.seamX, // the trilayer's seam, by identity — one cut, every surface
        uSeamW: rig.seamW,
        uInk: { value: new THREE.Color(ink) },
      },
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  // a soft grounding shadow, offset off the key side, a touch below the card —
  // the escaping band is what makes the island read as SITTING on the page
  shadow.position.set(-radiusX * 0.07, -0.06, radiusZ * 0.06);
  shadow.scale.set(radiusX * 1.25, radiusZ * 1.25, 1);
  shadow.renderOrder = -1; // under the feathered card in the transparent pass
  root.add(shadow);

  return { root, ground, shadow, radiusX, radiusZ };
}
