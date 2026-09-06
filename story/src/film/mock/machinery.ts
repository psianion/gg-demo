// MOCK — Machinery. Art bible §11.2, row 19. Author group G / author 4.
//
//   http://localhost:5180/?mock=machinery            beside the actual hero island
//   http://localhost:5180/?mock=machinery&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=machinery&zoom=1..6
//
// THE FILM'S ONE ASSET WITH NO PAINT SIDE, and that is the whole row. Everything else
// in this world is a painted surface that drains to a drawing; the stage machinery is a
// DRAWING THAT HAPPENS TO BE IN THE WORLD, in both states, at every curtain value —
// which is exactly what stage machinery is. It never lights, never shades, never casts
// and never drains, because there is nothing to drain: `MeshBasicMaterial`,
// `fog: false`, zero Lambert response, outside the trilayer entirely.
//
// That is also why the two rigs look identical on this route. It is not a bug and it is
// not the seam: it is row 19's own column, and if this class DID change between rigs it
// would be wrong.
//
// S4 ONLY. Six things, all of them mechanism built as mechanism — a capstan with six
// spokes and a pawl that actually engages its ratchet, six radial rails the disc runs
// on, two counterweight booms sweeping outboard, and four blocks. The booms' rotation
// is slaved to `stageDisc.rotation` in the film body; here they stand at the angle the
// beat opens on.
//
// SCALE, and it is `plank.ts`'s lever: the row authors the booms sweeping outboard at
// r 8.2, which at mock-slot size shrinks the hero island to a thumbnail. Everything is
// built at ×0.30 — booms reach r 2.46 — and every ratio in the mechanism is exact, so
// a screen measurement here multiplies by 3.33 to reach the film body.
import * as THREE from 'three';
import { buildMachinery, buildMachineryBooms } from './machineryKit.ts';

const K = 0.3; // the row's r 8.2 → 2.46 u

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();
  g.add(buildMachinery({ scale: K }));
  g.add(buildMachineryBooms({ scale: K }));
  return g;
}

// ponytail: no animation and no `stageDisc` here. The row slaves the booms to the disc's
// rotation and the disc is timeline.ts's, which this workflow does not own — the booms
// are built at S4's opening angle and the slaving is one assignment at the wire-in.
//
// ponytail: no parkSeam. This class has no trilayer material in it, so the seam cannot
// reach it — which is the same fact as "no paint side", said from the other end.
