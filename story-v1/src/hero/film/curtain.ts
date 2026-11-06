import * as THREE from 'three';

// story-v1: trimmed to what the hero needs. The full-screen curtain pass, reveal(),
// tick/drain/snapBack lived here for the old film and are gone. `curtain.value` still
// drives every trilayer material (0 = painted, 1 = pencil); markAlive keeps the goblin
// in colour whatever it does — which is exactly Beat 3's freeze.

export const curtain = { value: 0 };

export const MASK_LAYER = 1;

export function markAlive<T extends THREE.Object3D>(object: T): T {
  object.traverse((child) => {
    // …with ONE opt-out, and it is load-bearing rather than a convenience. The goblin's
    // contact pool (goblin design §8) is parented to his root so it travels with him,
    // but it must NOT be alive: a not-alive trilayer renders as a gouache shadow blob
    // on the painted half and as its own graphite smudge on the drawing, which is what
    // grounds him on both sides of the seam from one mesh with zero staging. Without
    // this line markAlive's traversal would silently switch the device off.
    if (child.userData.neverAlive) return;
    const mesh = child as THREE.Mesh & { isLineSegments2?: boolean };
    if (mesh.isMesh && mesh.isLineSegments2 !== true) {
      mesh.layers.enable(MASK_LAYER);
      // The alive-shadow rule (direction §8, hero §5): on the FROZEN page, "the only
      // shadow belongs to the alive." Alive casting is permanent and set here; the
      // painted world's casters register through markCaster (stages/rigs.ts), whose
      // state the rig releases at the fully-drawn page — so a frozen frame's shadow
      // map can only hold alive casters. Structural, not staged. Inert in the film
      // until a rig with shadows enabled is wired in (the Canvas has no `shadows`
      // today); the ?sandbox=island route runs it live. Permanent once set, like the
      // mask layer: nothing un-marks the alive.
      mesh.castShadow = true;
      // The dedicated aliveness flag the rigs' caster release tests (stages/rigs.ts).
      // The mask layer cannot serve as that test: reveal() below parents mask-only
      // shell copies on layer 1, and a shell is not alive — it is a silhouette.
      mesh.userData.alive = true;
      // …and the material-state half, for trilayer surfaces: an alive material keeps
      // its paint whatever the curtain or the seam does.
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const alive = (mat as THREE.Material | undefined)?.userData?.alive as
          | { value: number }
          | undefined;
        if (alive) alive.value = 1;
      }
    }
  });
  return object;
}
