// KIT — Machinery (art bible §11.2 row 19). Lifted verbatim from mock/machinery.ts's
// `buildMock()` (W6d-node) so `sets/theatre.ts` can build S4's real machinery instead of
// a third hand copy. Two exports because the scene book slaves the counterweight booms
// to `stageDisc.rotation` (S4-B4/B5) and everything else (capstan, rails, blocks) stands
// still on the apron: the wiring task parents `buildMachineryBooms()`'s group under
// `stageDisc` (or a group driven by the same tween) and `buildMachinery()`'s group
// anywhere else under the island.
//
// Row 19 has no stroke family, no bake, no seed, no per-mesh material (`Stroke family ·
// dir: none`; `Bake: none`; fill is the one committed token `graphiteLight`) — the class
// is real 3D construction read by `sketch()`'s EdgesGeometry, not a flat authored mark,
// so it takes no view-plane basis (contrast `plankKit.ts`'s VIEW_R/VIEW_CAM or
// `foliageKit.ts`'s `setView`: neither is imported here, and none of row 19's geometry
// depends on a camera). The mock's `r 8.2` boom sweep is already sized to the film's own
// stage disc (`sets/theatre.ts`: `CylinderGeometry(7, 7, ...)`, kerb `7.16`) — verified by
// the row's own comment ("every ratio in the mechanism is exact") — so the only knob two
// call sites need is the uniform scale the mock calls `K`: the mock's slot wants 0.3, the
// film wants 1.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { sketch } from '../pencil.ts';
import { merge, put } from './plankKit.ts';

export interface MachineryOpts {
  /** Uniform scale, the mock's `K`. 1 = the film's own units (disc r7 / kerb r7.16); the mock passes 0.3. */
  scale?: number;
}

function drawnGroup(parts: THREE.BufferGeometry[]): THREE.Group {
  const g = new THREE.Group();
  const drawn = sketch(merge(parts), 24, 'form');
  const fill = drawn.children[0] as THREE.Mesh;
  fill.material = new THREE.MeshBasicMaterial({ color: P.graphiteLight, fog: false });
  fill.castShadow = false;
  fill.receiveShadow = false;
  g.add(drawn);
  return g;
}

/**
 * The fixed half: capstan drum + ratchet ring + 6 spokes + pawl, 6 radial rails + chairs,
 * the king post, and 4 blocks (cheeks + sheave + fall). Stands still on the apron.
 */
export function buildMachinery(opts: MachineryOpts = {}): THREE.Group {
  const K = opts.scale ?? 1;
  const parts: THREE.BufferGeometry[] = [];

  // ---- the capstan --------------------------------------------------------------
  // a drum, its ratchet ring, and six spokes through the head. 10 radial segments, not
  // 24: this class's read is its EDGES, and a smooth drum gives EdgesGeometry nothing
  // to find — the facets are the drawing.
  parts.push(put(new THREE.CylinderGeometry(1.4 * K, 1.55 * K, 1.5 * K, 10), { pos: [0, 0.75 * K, 0] }));
  parts.push(put(new THREE.CylinderGeometry(1.85 * K, 1.85 * K, 0.22 * K, 16), { pos: [0, 1.42 * K, 0] }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.18;
    parts.push(
      put(new THREE.BoxGeometry(2.9 * K, 0.17 * K, 0.17 * K), {
        pos: [Math.cos(a) * 1.45 * K, 1.62 * K, Math.sin(a) * 1.45 * K],
        rot: [0, -a, 0],
      }),
    );
    // the spoke's own handle knob — a capstan bar has an end a hand fits round
    parts.push(
      put(new THREE.CylinderGeometry(0.15 * K, 0.15 * K, 0.3 * K, 7), {
        pos: [Math.cos(a) * 2.85 * K, 1.62 * K, Math.sin(a) * 2.85 * K],
        rot: [Math.PI / 2, 0, -a],
      }),
    );
  }
  // THE PAWL, and it is engaged. A pawl drawn clear of its ratchet is an ornament; this
  // one sits on the ring with its pivot post behind it, which is the difference between
  // "mechanism built as mechanism" and a diagram of one.
  parts.push(put(new THREE.BoxGeometry(1.15 * K, 0.14 * K, 0.2 * K), { pos: [2.35 * K, 1.44 * K, 0.3 * K], rot: [0, -0.12, 0.16] }));
  parts.push(put(new THREE.CylinderGeometry(0.13 * K, 0.13 * K, 1.6 * K, 6), { pos: [2.95 * K, 0.8 * K, 0.36 * K] }));

  // ---- six radial rails ----------------------------------------------------------
  // the track the stage disc runs on. They stop short of the capstan and short of the
  // booms' sweep, because a rail that runs under both is a floorboard.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    parts.push(
      put(new THREE.BoxGeometry(5.4 * K, 0.13 * K, 0.26 * K), {
        pos: [Math.cos(a) * 4.6 * K, 0.07 * K, Math.sin(a) * 4.6 * K],
        rot: [0, -a, 0],
      }),
    );
    // a chair every rail, where it crosses the ring beam
    parts.push(
      put(new THREE.BoxGeometry(0.4 * K, 0.24 * K, 0.5 * K), {
        pos: [Math.cos(a) * 3.2 * K, 0.12 * K, Math.sin(a) * 3.2 * K],
        rot: [0, -a, 0],
      }),
    );
  }

  // the king post the tie rods hang from — stands still; only the booms swing.
  parts.push(put(new THREE.CylinderGeometry(0.16 * K, 0.2 * K, 1.75 * K, 7), { pos: [0, 2.3 * K, 0] }));

  // ---- four blocks ----------------------------------------------------------------
  // a block is two cheeks and a sheave, and it is the smallest thing in the class — the
  // reason the row asks for `sketch` at threshold 20–30 rather than 40.
  ([[3.6, 0.9, 2.4], [-3.4, 1.1, 1.6], [1.4, 1.35, -3.8], [-1.9, 0.75, -3.2]] as const).forEach(
    ([bx, by, bz], i) => {
      const p: [number, number, number] = [bx * K, by * K, bz * K];
      for (const c of [-1, 1] as const) {
        parts.push(
          put(new THREE.BoxGeometry(0.11 * K, 0.85 * K, 0.5 * K), {
            pos: [p[0] + c * 0.22 * K, p[1], p[2]],
            rot: [0, i * 0.6, 0.1],
          }),
        );
      }
      parts.push(
        put(new THREE.CylinderGeometry(0.3 * K, 0.3 * K, 0.14 * K, 9), {
          pos: [p[0], p[1] - 0.1 * K, p[2]],
          rot: [0, i * 0.6, Math.PI / 2],
        }),
      );
      // the fall, straight down to the deck: a block with no rope in it is jewellery
      parts.push(
        put(new THREE.CylinderGeometry(0.04 * K, 0.04 * K, (by + 0.4) * K, 5), {
          pos: [p[0], (by * 0.5 - 0.2) * K, p[2]],
        }),
      );
    },
  );

  return drawnGroup(parts);
}

/**
 * The rotating half: the 2 outboard counterweight booms (180° apart), their
 * counterweights and tie rods. The wiring task parents this group's rotation to
 * `stageDisc.rotation` (or a group the same tween drives) — no second tween.
 */
export function buildMachineryBooms(opts: MachineryOpts = {}): THREE.Group {
  const K = opts.scale ?? 1;
  const BOOM_R = 8.2 * K;
  const parts: THREE.BufferGeometry[] = [];

  // ---- two counterweight booms, sweeping outboard at r 8.2 -----------------------
  // Slaved to stageDisc.rotation in the film; here they stand at the angle S4 opens on,
  // 180° apart, because two booms that are not opposed do not counterweight anything.
  for (const s of [0, Math.PI] as const) {
    const a = 0.72 + s;
    parts.push(
      put(new THREE.BoxGeometry(BOOM_R, 0.2 * K, 0.2 * K), {
        pos: [(Math.cos(a) * BOOM_R) / 2, 2.05 * K, (Math.sin(a) * BOOM_R) / 2],
        rot: [0, -a, 0.045],
      }),
    );
    // the counterweight itself, outboard, and the tie rod back to the head
    parts.push(
      put(new THREE.BoxGeometry(0.72 * K, 1.05 * K, 0.62 * K), {
        pos: [Math.cos(a) * (BOOM_R - 0.35 * K), 1.85 * K, Math.sin(a) * (BOOM_R - 0.35 * K)],
        rot: [0, -a, 0],
      }),
    );
    const tie = new THREE.Vector3(Math.cos(a) * BOOM_R * 0.94, 2.16 * K, Math.sin(a) * BOOM_R * 0.94);
    const head = new THREE.Vector3(0, 3.1 * K, 0);
    const d = new THREE.Vector3().subVectors(tie, head);
    const rod = new THREE.CylinderGeometry(0.05 * K, 0.05 * K, d.length(), 5);
    rod.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3().addVectors(tie, head).multiplyScalar(0.5),
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    parts.push(rod);
  }

  return drawnGroup(parts);
}
