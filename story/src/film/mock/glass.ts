// MOCK — Glass. Art bible §11.2, row 12.
//
//   ?mock=glass · &rig=prep · &zoom=1..6
//
// THE ROW, built: `Cylinder(0.105, 0.082, 0.24, SIX)` — six-sided, not smooth.
// `MeshBasicMaterial`, `fog: false`, no strokes, ONE committed value, no bake.
// `mix(flameCore, flameBody, 0.05)`; `lanternGlass #F2E2B4` t0 for the hand lantern.
// Drawn state: BARE PAPER — one more unpainted solid on the drawing.
//
// THE THREE SHIPPED RULES (hero.ts:786–798), and all three are structural, not tuning:
//   1. the glass must be the HEAD'S DOMINANT MASS — the roof is a rim cap, not a hat,
//      and the plate is a sill, not a plinth. A 0.102-r iron hat swallowed the whole
//      glass at the 33° lens once already and the prop read UNLIT.
//   2. it must OUT-SHINE ITS OWN GROUND POOL (measured 237 against a pool p95 of 212).
//   3. a DISTINCT FLAME SHAPE is required — a bright block is not a burning thing.
//
// THE ONE THING THE ROW DOES NOT SAY AND THE BUILD NEEDS: a `MeshBasicMaterial` does
// not drain. It is outside the trilayer, so at `curtain = 1` a bare basic material is
// still a warm cream block on a graphite page. R14 solved exactly this for fire with a
// three-line `onBeforeCompile` mixing by `rig.curtain` TAKEN BY IDENTITY; the same
// three lines are what turn this glass to paper, and `customProgramCacheKey` keeps
// every glass in the film on one program. Reported in MOCK-3.md.
//
// NOT BUILT HERE, ON PURPOSE: the glow sprite and the `PointLight`. Both belong to row
// 13 (fire) and to `createFlameMaterial()`, which another module owns — so rule 2's
// pool cannot be measured on this route, only rules 1 and 3.
import * as THREE from 'three';
import { createTrilayer, rig } from '../stages/trilayer.ts';
import { propGround } from './groundKit.ts';
import {
  flameCore, flameBody, amberLantern, lanternGlass, timberDark, iron, plank,
  paper, graphite, ink,
} from '../palette.ts';
import { mark, merge, mixHex, parkSeam, put, VIEW_CAM } from './plankKit.ts';

/**
 * A basic material that DRAINS. Three lines of `onBeforeCompile` mixing the composed
 * result toward a target by the film's own curtain uniform, taken by identity — so any
 * partial curtain is a coherent held frame and a scrub cannot pop.
 */
function drains(hex: number, toward: number, key: string): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({ color: hex, fog: false });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCurtain = rig.curtain;
    sh.uniforms.uDrain = { value: new THREE.Color(toward) };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uCurtain;\nuniform vec3 uDrain;')
      .replace(
        '#include <opaque_fragment>',
        'outgoingLight = mix(outgoingLight, uDrain, clamp(uCurtain, 0.0, 1.0));\n#include <opaque_fragment>',
      );
  };
  m.customProgramCacheKey = () => key;
  return m;
}

// one material for every glass in the film, one for every lantern flame
const GLASS_LIT = mixHex(flameCore, flameBody, 0.05);

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();
  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class now builds the ordinary ground
  // card under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  g.add(propGround(2, 1.6, [[0,0,90,0.28]]));
  const wood: THREE.BufferGeometry[] = [];
  const metal: THREE.BufferGeometry[] = [];
  const runs = new THREE.Group();
  const glassMat = drains(GLASS_LIT, paper, 'mockglass');
  const boneMat = drains(lanternGlass, paper, 'mockglass');
  // a drawn fire is a still graphite teardrop — no glow, no sprite, no rays (§11.3)
  const flameMat = drains(amberLantern, graphite, 'mockflame');
  const heartMat = drains(flameCore, graphite, 'mockflame');

  // ---- 1 · the standing lantern ----------------------------------------------
  const L = new THREE.Vector3(-0.55, 0, 0);
  wood.push(put(new THREE.CylinderGeometry(0.03, 0.045, 0.78, 7), { pos: [L.x, 0.39, L.z] }));
  wood.push(put(new THREE.TorusGeometry(0.16, 0.032, 6, 10, Math.PI / 2), { pos: [L.x, 0.82, L.z], rot: [0, Math.PI / 2, Math.PI / 2] }));
  // the sill — thin, because the glass owns the head
  wood.push(put(new THREE.CylinderGeometry(0.086, 0.094, 0.016, 6), { pos: [L.x, 0.672, L.z + 0.16] }));
  // the roof is a RIM CAP overhanging the glass: one dark line over the burn
  metal.push(put(new THREE.ConeGeometry(0.125, 0.034, 6), { pos: [L.x, 0.945, L.z + 0.16] }));
  {
    // THE GLASS. Six-sided, not smooth: a lantern pane is cut, and a smooth cylinder
    // reads as a pill. 0.24 tall against a 0.034 roof and a 0.016 sill — the head's
    // dominant mass by construction, which is rule 1 built rather than tuned.
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.082, 0.24, 6), glassMat);
    glass.position.set(L.x, 0.8, L.z + 0.16);
    g.add(glass);
    // rule 3 — a DISTINCT flame shape: belly, waist, licking tip, parked a step
    // toward the lens so it reads IN the glass instead of behind its face
    const fl = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), flameMat);
    body.scale.set(1, 1.3, 1);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.05, 8), flameMat);
    tip.position.y = 0.056;
    const heart = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), heartMat);
    heart.position.y = -0.006;
    fl.add(body, tip, heart);
    fl.position.set(L.x - 0.012, 0.78, L.z + 0.08);
    g.add(fl);
  }

  // ---- 2 · the hand lantern, set down on the page -----------------------------
  const HL = new THREE.Vector3(0.42, 0, 0.34);
  wood.push(put(new THREE.CylinderGeometry(0.07, 0.078, 0.014, 6), { pos: [HL.x, 0.007, HL.z] }));
  metal.push(put(new THREE.ConeGeometry(0.092, 0.026, 6), { pos: [HL.x, 0.205, HL.z] }));
  metal.push(put(new THREE.TorusGeometry(0.055, 0.008, 5, 12, Math.PI), { pos: [HL.x, 0.222, HL.z], rot: [0, 0, 0] }));
  {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.062, 0.175, 6), boneMat);
    glass.position.set(HL.x, 0.1, HL.z);
    g.add(glass);
  }

  // ---- 3 · the tavern window's ABSENCE of a glass -----------------------------
  // The row names it, and it is the whole class stated as a negative: a frame with
  // nothing in it. On the paint side that is a hole to the page; on the drawn side it
  // is indistinguishable from the glass beside it, which is the point.
  const W = new THREE.Vector3(1.5, 0, -0.3);
  for (const [w, h, x, y] of [
    [0.52, 0.06, 0, 0.02], [0.52, 0.06, 0, 0.86], [0.06, 0.9, -0.23, 0.44], [0.06, 0.9, 0.23, 0.44],
  ] as const) {
    wood.push(put(new THREE.BoxGeometry(w, h, 0.07), { pos: [W.x + x, y + 0.3, W.z] }));
  }
  wood.push(put(new THREE.BoxGeometry(0.46, 0.05, 0.05), { pos: [W.x, 0.74, W.z] }));

  // ---- the housings are trilayer, so they drain with everything else ----------
  g.add(new THREE.Mesh(merge(wood), createTrilayer({ color: timberDark, wear: 0.22, stroke: { dir: 1.35, sheet: true } })));
  g.add(new THREE.Mesh(merge(metal), createTrilayer({ color: iron, wear: 0.26, stroke: { dir: 0.55, sheet: true } })));

  // ---- the drawn furniture: the housings are drawn, the glass never is --------
  // Row 12's "none" is literal — no contour touches the glass, in either state. What
  // is drawn is what HOLDS it, and the empty window's mullion, which is the only mark
  // that says there is nothing there.
  runs.add(
    mark(
      [
        new THREE.Vector3(L.x - 0.13, 0.962, L.z + 0.16).addScaledVector(VIEW_CAM, 0.1),
        new THREE.Vector3(L.x, 0.985, L.z + 0.16).addScaledVector(VIEW_CAM, 0.1),
        new THREE.Vector3(L.x + 0.13, 0.962, L.z + 0.16).addScaledVector(VIEW_CAM, 0.1),
      ],
      ink,
      'form',
    ),
  );
  runs.add(
    mark(
      [
        new THREE.Vector3(L.x - 0.005, 0.02, L.z),
        new THREE.Vector3(L.x - 0.005, 0.66, L.z),
      ].map((p) => p.addScaledVector(VIEW_CAM, 0.06)),
      ink,
      'form',
    ),
  );
  runs.add(mark([
    new THREE.Vector3(W.x - 0.2, 0.36, W.z + 0.05),
    new THREE.Vector3(W.x - 0.2, 1.1, W.z + 0.05),
    new THREE.Vector3(W.x + 0.2, 1.1, W.z + 0.05),
    new THREE.Vector3(W.x + 0.2, 0.36, W.z + 0.05),
    new THREE.Vector3(W.x - 0.2, 0.36, W.z + 0.05),
  ].map((p) => p.addScaledVector(VIEW_CAM, 0.08)), ink, 'form'));
  // the plank sill under the window — one value step off the frame so the joint reads
  g.add(
    new THREE.Mesh(
      put(new THREE.BoxGeometry(0.66, 0.05, 0.14), { pos: [W.x, 0.3, W.z + 0.02] }),
      createTrilayer({ color: plank, wear: 0.24, stroke: { dir: 1.42, sheet: true } }),
    ),
  );

  g.add(runs);
  return parkSeam(g);
}
