import * as THREE from 'three';
import { FLICKER } from '../motion.ts';
import { amber, earthTrack, fillGround, fillSky, keyWarm, paper, skyDay } from '../palette.ts';
import { rig } from './trilayer.ts';

// THE TWO LIGHTING RIGS (direction doc §8, hero doc §5) — one rule between them.
//
// Performance rig — the gouache-lit look: cool sky fill (skyDay hemisphere at low
// intensity, hero §5), lantern-warm key, and the amber glow — a warm point light
// breathing with the flame on the world clock. Amber #F2C35E is the ONLY glow hue
// anywhere (art gate); the glow pool dies with the paint side, because a drawn fire
// emits nothing. The painted world CASTS under the one key (hero §5: "trees and
// goblin cast") — world props register through `markCaster` below.
//
// Prep rig — flat, even paper light and no shadows: a drawing casts none. The single
// exception carries the whole grammar: the alive (the goblin, touched props) keep a
// private warm key and their shadow. Structural, not staged — `markAlive` (curtain.ts)
// makes the permanent casters, `markCaster` the painted world's, and the rig releases
// the world's at the fully-drawn page, so a frozen frame's shadow map can only hold
// alive casters. The key is the only shadow-casting light in either rig.
//
// Both rigs are active simultaneously, blended by THE SAME curtain object the trilayer
// mixes paint→drawing by (rig.curtain, by identity). Lights are scene-scalar, so the
// scalar blend follows the global curtain; the seam's spatial half (the P4 hero's
// half-alive cut) lives in the materials, which read rig.seamX/seamW per fragment —
// one draw philosophy, each half lit correctly by construction.
//
// Not yet wired into the film: Film.tsx keeps its v1 rig until P7 retires it (the
// per-shot camera-riding key placement stays a Film concern; this module owns what
// the lights ARE, not where a shot parks them). Pure three objects + maths — safe
// under Node --experimental-strip-types.

// intensities carry the physically-correct π (see Film.tsx's v1 rig note): Lambert
// divides irradiance by π, so "feels like 1.0" needs ~3.1 across the rig
const HEMI_I = 0.8; // hero §5: skyDay hemisphere "at low intensity" — well under the key
const KEY_I = 2.2;
const FLAT_I = 0.9; // Prep's even paper light — enough to keep an alive shade side read

// THE FILM IS NOT LIT BY THIS MODULE, and §4.7's transfer table is downstream of which
// rig you are standing under. `Film.tsx` keeps its own two lights — the per-shot key
// placement is a Film concern (the sets span x = 0…126, so a fixed sun leaves half the
// shots staring at their own shade side) and its fill is nearly twice this one's, over
// a cooler sky. The numbers live HERE, in the module that owns what the lights are, and
// `Film.tsx` and `mock/transfer.ts` both read them, so the probe can never drift from
// the rig it claims to be measuring. Same KEY_I: §5.5 pins the key's intensity in every
// state, and a chapter family that wants a demoted key takes it out of the colour's own
// luminance (`palette.ts` keyNight).
export const FILM_RIG = { sky: fillSky, ground: fillGround, hemiI: 1.45, keyI: KEY_I } as const;

// PRM damps the flicker to STILL, not merely reduced (motion §14: "A = 0 — still, at
// lit pose") — and live via matchMedia, no reload. Node has no window; ambient stays 1
// there, and flicker() takes ambient explicitly so the checks pin the damped shape.
let ambient = 1;
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => {
    ambient = mq.matches ? 0 : 1;
  };
  sync();
  mq.addEventListener('change', sync);
}
export const prmAmbient = () => ambient;

// ---- Performance-side casters (hero §5: "trees and goblin cast") ------------------
// The alive-only shadow rule scopes to the FROZEN page (direction §8 Prep: "in any
// frozen frame, the only shadow on the page belongs to what is alive"). The painted
// world does cast — and its shadows leave with the paint: registered meshes cast
// while any paint is up and release at the fully-drawn page. Rig-managed, not
// permanent like markAlive: update() owns their state per frame.
//
// The registry is PER RIG (each createRigs() owns its own Set, exposed as
// rigs.markCaster): a module-global registry retained meshes forever under
// HMR/StrictMode remounts and let a discarded render keep driving castShadow on a
// live one. Drop the rig, drop its registry.

/**
 * The flame's breath at world-time t — every term rides the motion §3.3 constants and
 * the world clock, so a freeze stills the fire and PRM (a = 0) is EXACTLY the lit
 * pose: scale 1, pulse 1, glow at glowBase. `scale`/`pulse` are for the stage's flame
 * meshes when they wire in; `glow` drives the rig's amber point light.
 */
export function flicker(t: number, a: number, phase = 0) {
  return {
    scale: 1 + FLICKER.scaleAmp * a * Math.sin(t * FLICKER.scaleRate + phase),
    pulse: 1 + FLICKER.pulseAmp * a * Math.abs(Math.sin(t * FLICKER.pulseRate + phase)),
    glow: FLICKER.glowBase + FLICKER.glowAmp * a * Math.abs(Math.sin(t * FLICKER.pulseRate + phase)),
  };
}

export interface Rigs {
  root: THREE.Group;
  hemi: THREE.HemisphereLight; // Performance: cool sky fill — fades out under Prep
  key: THREE.DirectionalLight; // the alive private warm key — persists in BOTH states
  glow: THREE.PointLight; // Performance: the amber flame glow, flickering on world.t
  flat: THREE.AmbientLight; // Prep: flat, even, shadowless by construction
  markCaster<T extends THREE.Object3D>(object: T): T; // register a painted-world caster
  update(t: number): void; // call each frame with the world clock
}

/** Both rigs, one group, blended per frame by the shared curtain uniform. */
export function createRigs(): Rigs {
  const root = new THREE.Group();
  const worldCasters = new Set<THREE.Mesh>();

  /**
   * Register a world prop (tree, crate, boulder) as a Performance-side shadow caster.
   * The rig flips its castShadow with the curtain — never register-and-set directly.
   * An alive mesh (markAlive's userData.alive flag) always wins: it casts in every
   * state. Mask-only geometry (reveal()'s layer-1 shells, which never draw on layer 0)
   * is skipped outright — a shell is a silhouette for the curtain mask, not a prop.
   */
  function markCaster<T extends THREE.Object3D>(object: T): T {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh & { isLineSegments2?: boolean };
      if (mesh.isMesh && mesh.isLineSegments2 !== true && mesh.layers.isEnabled(0)) {
        worldCasters.add(mesh);
      }
    });
    return object;
  }

  // hero §5 by name: skyDay #ACCDE6 sky fill; ground bounce off the ochre earth token
  const hemi = new THREE.HemisphereLight(skyDay, earthTrack, HEMI_I);

  // Lantern-warm key — hero §5's #FFEACC family, promoted to the keyWarm palette
  // token (P4 pre-work c). The film's only shadow-casting light: under Performance
  // the marked world casts into it (plus contact blobs grounding props); at the
  // fully-drawn page only markAlive's casters remain in its map.
  const key = new THREE.DirectionalLight(keyWarm, KEY_I);
  key.position.set(4, 6, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0015;
  key.shadow.radius = 3; // soft-edged, not razor GL — honoured under PCFShadowMap

  const glow = new THREE.PointLight(amber, 0, 8, 2);
  glow.position.set(0, 0.8, 0);

  const flat = new THREE.AmbientLight(paper, 0); // flat PAPER light, by token

  root.add(hemi, key, key.target, glow, flat);

  function update(t: number) {
    // the same { value } object the trilayer and the island shadow mix by — identity,
    // so any partial curtain is a coherent held frame across surfaces AND lights
    const c = Math.min(1, Math.max(0, rig.curtain.value));
    hemi.intensity = HEMI_I * (1 - c); // the frozen page has no air
    glow.intensity = flicker(t, ambient).glow * (1 - c); // a drawn fire emits nothing
    flat.intensity = FLAT_I * c; // Prep: flat paper light rises as the paint drains
    // key.intensity stays KEY_I — the alive keep their warm key in both states

    // The world's shadows leave with the paint (hero §5 exit grammar: shadows arrive
    // with color): registered casters cast while any paint is up, release at the
    // fully-drawn page. An alive mesh wins in every state — double-marking can never
    // un-cast the alive. Aliveness is markAlive's dedicated userData.alive flag, NOT
    // the mask layer: reveal() parents mask-only shell copies on layer 1, so a layer
    // test would promote invisible shell geometry to permanent caster.
    // ponytail: boolean flip at c=1 — a single shadow map can't fade one caster set
    // and keep another; if the release reads as a pop at the P7 wire-in, that round
    // owns a crossfade (ledgered P3-T3).
    const painted = c < 1;
    for (const mesh of worldCasters) mesh.castShadow = painted || mesh.userData.alive === true;
  }

  return { root, hemi, key, glow, flat, markCaster, update };
}
