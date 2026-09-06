import * as THREE from 'three';
import * as P from '../palette.ts';
import { BOARD_WATER } from './groundKit.ts';
import { IRON_LIT, IRON_SHADE } from '../sets/kit.ts';
import { createRigs, FILM_RIG } from '../stages/rigs.ts';
import { createTrilayer, rig } from '../stages/trilayer.ts';

// ?mock=transfer — THE COLOUR TRANSFER PROBE (art bible §4.7).
//
// Not a surface class. This is the instrument that measured §4.7's transfer table:
// what the Performance rig (§5.1) does to an AUTHORED token on its way to screen.
// It exists because "why does my blue look brown" was unanswerable from the token
// alone — the rig's key/fill ratio is a per-channel gain and nothing in the palette
// says so.
//
//   http://localhost:5180/?mock=transfer         the swatch wall, lit, eyeballable
//   …then in the console: await window.__transfer()  → the measured table as JSON
//
// The readback is CLASS P: an off-canvas FloatType / NoColorSpace target, so the
// numbers are LINEAR MIX-DOMAIN values, not sRGB bytes. Measuring this in bytes is
// how a previous round shipped a calibration bug.

// The cool and neutral half of the palette. IRON_LIT / IRON_SHADE are imported above
// (live in sets/kit.ts, not metal.ts — that comment was stale). SNOW_SHADOW: snow.ts
// retired `snowShadow = mix(stoneCool, paper, 0.35)` (search "RETIRED HERE" in snow.ts);
// no committed export exists — literal kept 2026-09-06, see P0g report. This probe keeps
// measuring the retired value on purpose, as a historical §4.7.3 datapoint.
const SNOW_SHADOW = 0xaeb5c0; // mix(stoneCool, paper, 0.35) — retired, no live export

export const TOKENS: [string, number][] = [
  ['snow', P.snow],
  ['snowShadow', SNOW_SHADOW],
  ['stoneCool', P.stoneCool],
  ['skyDusk', P.skyDusk],
  ['skyDay', P.skyDay],
  ['skyOvercast', P.skyOvercast],
  ['skyVellum', P.skyVellum],
  ['water', P.water],
  ['boardWater', BOARD_WATER],
  ['steel', P.steel],
  ['ironLit', IRON_LIT],
  ['iron', P.iron],
  ['ironShade', IRON_SHADE],
  ['ravenSlate', P.ravenSlate],
  ['cloakIndigo', P.cloakIndigo],
  ['graphite', P.graphite],
  ['graphiteLight', P.graphiteLight],
  ['paper', P.paper],
  ['boardFill', P.boardFill],
  ['tooth', P.tooth],
  ['dieBone', P.dieBone],
];

// The five orientations the transfer is quoted at. KEY is the light's own axis
// (4,6,3 normalised); UP is the massif top — the orientation the snow complaint came
// from; VERT a keyward wall; SHADE a wall turned off the key; LEE the underside.
export const ORIENTATIONS: [string, THREE.Vector3][] = [
  ['KEY', new THREE.Vector3(4, 6, 3).normalize()],
  ['UP', new THREE.Vector3(0, 1, 0)],
  ['VERT', new THREE.Vector3(0, 0, 1)],
  ['SHADE', new THREE.Vector3(-1, 0, 0)],
  ['LEE', new THREE.Vector3(-4, -6, -3).normalize()],
];

// THE RIG YOU ARE STANDING UNDER (client ruling 2026-09-05). §4.7's original table was
// measured on `createRigs()` — the cover's rig — and the film is not lit by it: the film
// has its own hemisphere (`FILM_RIG`, nearly twice the fill over a cooler sky) and, from
// this ruling on, a KEY COLOUR PER CHAPTER FAMILY. A pre-compensation table is only true
// for one rig, so the probe now takes the rig it is asked for and reports which one.
//
// `n·k` is the film's other difference: its key rides the lens (`Film.tsx`), so on an
// up-facing surface `n·k = (10·sinE + 14) / sqrt(377 + 280·sinE)` for camera elevation E
// — 0.72 at the horizon through 0.94 straight down, 0.78 at the film's median exterior.
// The KEY orientation below is quoted at that median, not at a fixed sun.
export const D_DAY = 0.78;
const filmKeyAxis = (() => {
  // the axis whose n·k on UP is D_DAY, in the same +x/-z quadrant the film's key sits in
  const y = D_DAY;
  const h = Math.sqrt(Math.max(0, 1 - y * y));
  return new THREE.Vector3(h * 0.6, y, h * 0.8);
})();

export type Family = 'cover' | 'extDay' | 'extNight' | 'interior';

/** The four rigs a surface in this project can be lit by. `cover` is `createRigs()`. */
export const FAMILIES: Record<Family, { key: number; film: boolean; note: string }> = {
  cover: { key: P.keyWarm, film: false, note: 'stages/rigs.ts — the hero, and every ?mock= sheet' },
  extDay: { key: P.keyDay, film: true, note: 'S3 Proof of Light, S4 Proof of Scenery, S6 The Many Jobs, S7 The Handover' },
  extNight: { key: P.keyNight, film: true, note: 'S1 The Claim, S2 The Address' },
  interior: { key: P.keyWarm, film: true, note: 'S5 Proof of Time — a hearth SHOULD be warm' },
};

const CELL = 0.3;
const PITCH = 0.36;

/** The swatch wall: every token at every orientation, lit by the shipped rig. */
export function buildMock(): THREE.Object3D {
  const root = new THREE.Group();
  const geo = new THREE.PlaneGeometry(CELL, CELL);
  ORIENTATIONS.forEach(([, n], oi) => {
    TOKENS.forEach(([, hex], ti) => {
      // wear 0: the drybrush rim is a VIEW-angle term, not a light term, and it would
      // contaminate the very quantity this wall exists to show.
      const m = new THREE.Mesh(geo, createTrilayer({ color: hex, wear: 0 }));
      m.position.set((oi - 2) * (PITCH * 1.6), 0.25 + ti * PITCH, 0);
      m.lookAt(m.position.clone().add(n));
      root.add(m);
    });
  });
  return root;
}

type Row = { token: string; hex: string; ori: string; lin: number[] };

/**
 * Measure the transfer. One isolated pass per (token, orientation): the quad faces its
 * own camera dead-on, so N·V = 1 and the wear term is zero by construction; depthNear
 * is parked past infinity so the fog-to-paper term is zero too. What is left is the
 * rig's light alone — which is the only part of the chain a token author can't see.
 *
 * The amber flame glow is zeroed: it is a PointLight at distance 8 / decay 2, a LOCAL
 * warm term around the fire, not a property of the rig everywhere.
 */
export async function measure(gl: THREE.WebGLRenderer, family: Family = 'cover') {
  const scene = new THREE.Scene();
  const rigs = createRigs();
  rigs.update(0);
  rigs.glow.intensity = 0;
  const fam = FAMILIES[family];
  rigs.key.color.setHex(fam.key);
  if (fam.film) {
    // stand the probe under Film.tsx's rig instead of the cover's: same key intensity,
    // the film's own hemisphere, and the film's lens-ridden key axis (D_DAY).
    rigs.hemi.color.setHex(FILM_RIG.sky);
    rigs.hemi.groundColor.setHex(FILM_RIG.ground);
    rigs.hemi.intensity = FILM_RIG.hemiI;
    rigs.key.intensity = FILM_RIG.keyI;
    rigs.key.position.copy(filmKeyAxis);
  }
  scene.add(rigs.root);

  const geo = new THREE.PlaneGeometry(2, 2);
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const target = new THREE.WebGLRenderTarget(8, 8, {
    type: THREE.FloatType,
    colorSpace: THREE.NoColorSpace, // linear in, linear out — the mix domain
    stencilBuffer: false,
  });
  const buf = new Float32Array(8 * 8 * 4);

  const prevCurtain = rig.curtain.value;
  const prevNear = rig.depthNear.value;
  const prevFar = rig.depthFar.value;
  rig.curtain.value = 0;
  rig.depthNear.value = 1e6;
  rig.depthFar.value = 2e6;

  const rows: Row[] = [];
  // KEY and LEE are the key's own axis and its negation, so they follow the rig
  const oris: [string, THREE.Vector3][] = fam.film
    ? [
        ['KEY', filmKeyAxis.clone()],
        ...ORIENTATIONS.slice(1, 4),
        ['LEE', filmKeyAxis.clone().negate()],
      ]
    : ORIENTATIONS;
  // WHITE is the row the ruling is stated against: G(n) IS the on-screen value of a pure
  // white albedo, so this row is the gain vector itself, measured rather than modelled.
  for (const [token, hex] of [['white', 0xffffff] as [string, number], ...TOKENS]) {
    const mesh = new THREE.Mesh(geo, createTrilayer({ color: hex, wear: 0 }));
    scene.add(mesh);
    for (const [ori, n] of oris) {
      mesh.quaternion.identity();
      mesh.lookAt(n);
      cam.position.copy(n).multiplyScalar(2.2);
      cam.lookAt(0, 0, 0);
      gl.setRenderTarget(target);
      gl.render(scene, cam);
      gl.readRenderTargetPixels(target, 3, 3, 2, 2, buf);
      rows.push({
        token,
        hex: '#' + hex.toString(16).padStart(6, '0').toUpperCase(),
        ori,
        lin: [0, 1, 2].map((c) => buf[c]),
      });
    }
    scene.remove(mesh);
    (mesh.material as THREE.Material).dispose();
  }

  gl.setRenderTarget(null);
  target.dispose();
  geo.dispose();
  rig.curtain.value = prevCurtain;
  rig.depthNear.value = prevNear;
  rig.depthFar.value = prevFar;
  return rows;
}

if (typeof window !== 'undefined') {
  // `await window.__transfer()` for the cover's rig (what §4.7 was first measured on),
  // `window.__transfer('extDay' | 'extNight' | 'interior')` for the film's own.
  (window as unknown as Record<string, unknown>).__transfer = async (family: Family = 'cover') => {
    const state = (window as unknown as { __mock?: { gl: THREE.WebGLRenderer } }).__mock;
    if (!state) throw new Error('?mock= route is not up — no renderer');
    const rows = await measure(state.gl, family);
    document.documentElement.dataset.transfer = JSON.stringify({ family, rows });
    return rows;
  };
}
