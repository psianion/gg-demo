import * as THREE from 'three';
import { heroFraming, HERO_FOV } from './stages/hero.ts';
import type { Goblin } from './world.ts';

// THE GOBLIN MEASUREMENT SUBSTRATE (goblin design §14, build step 0).
//
// One projection/partition helper, shared by BOTH acceptance runners so a CLASS G
// number and a CLASS P number can never drift apart:
//
//   CLASS G — scripts/gob.check.ts, plain node + three, no WebGL. Geometry and source.
//   CLASS P — src/gobMeasure.ts (window.__gob), framebuffer readback in the browser.
//
// UNITS. Everything this module returns is CSS PIXELS at the requested viewport, y
// DOWN from the top-left, the same convention heroProject uses in fractions. Nothing
// here is in device pixels; a supersampled render target multiplies by its own ss and
// divides it back out before it reports (see gobMeasure).
//
// It carries no colour opinions at all — every luma domain question lives in
// gobMeasure, so there is exactly one place mixing linear and encoded can go wrong.

/** The hero camera for a viewport, from the authored framing solve. Identical maths to
 * heroProject (hero.ts:256) — gob.check pins the two against each other. */
export function heroCamera(width: number, height: number): THREE.PerspectiveCamera {
  const f = heroFraming(width, height);
  const cam = new THREE.PerspectiveCamera(HERO_FOV, width / Math.max(1, height), 0.1, 200);
  cam.position.copy(f.position);
  cam.lookAt(f.look);
  cam.updateMatrixWorld();
  return cam;
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  w: number;
  h: number;
  n: number; // vertices that landed in front of the lens — 0 means "nothing measured"
}

const EMPTY: Box = { x0: NaN, y0: NaN, x1: NaN, y1: NaN, w: 0, h: 0, n: 0 };

function box(x0: number, y0: number, x1: number, y1: number, n: number): Box {
  return n > 0 ? { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, n } : EMPTY;
}

/** Every renderable FILL mesh under `roots`, minus anything under `exclude`.
 *
 * Skipped on purpose: `shell` meshes (pencil.ts:154 — an inside-out BackSide copy is
 * a contour, not the form, and it sits OUTSIDE the silhouette it draws, so counting it
 * inflates every width by the rim), LineSegments2 strokes (their geometry is instance
 * data that means nothing to a plain vertex read), and anything switched off up its
 * own parent chain (stageGoblin hides root children — hero.ts:1201). */
export function fillMeshes(
  roots: THREE.Object3D[],
  exclude: THREE.Object3D[] = [],
): THREE.Mesh[] {
  const skip = new Set<THREE.Object3D>();
  for (const e of exclude) e.traverse((o) => skip.add(o));
  const out: THREE.Mesh[] = [];
  const seen = new Set<THREE.Object3D>();
  for (const root of roots) {
    root.traverse((o) => {
      if (skip.has(o) || seen.has(o) || !o.visible) return;
      seen.add(o);
      const m = o as THREE.Mesh & { isLineSegments2?: boolean };
      if (!m.isMesh || m.isLineSegments2 === true) return;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      if (mat?.userData?.role === 'shell') return;
      if (!m.geometry?.getAttribute('position')) return;
      out.push(m);
    });
  }
  // `visible` on an ancestor ABOVE a root still hides it; traverse() cannot see that.
  return out.filter((m) => {
    for (let p: THREE.Object3D | null = m; p; p = p.parent) if (!p.visible) return false;
    return true;
  });
}

/** One vertex of a mesh, in its own local space, THROUGH the pose.
 *
 * The figure is a skinned mesh, so its position attribute is the BIND pose and nothing
 * is ever staged in it — `REST` alone folds him 0.34 rad at the waist, which is 4 % of
 * his projected height. Every measurement in this file and in both runners reads a
 * vertex through here, so a CLASS G number and a CLASS P number cannot fork over it. */
export function vertexAt(mesh: THREE.Mesh, i: number, target: THREE.Vector3): THREE.Vector3 {
  const sk = mesh as THREE.SkinnedMesh;
  if (sk.isSkinnedMesh) return sk.getVertexPosition(i, target);
  return target.fromBufferAttribute(mesh.geometry.getAttribute('position'), i);
}

const boneIdx = (o: THREE.Object3D): number | null =>
  typeof o.userData.boneIndex === 'number' ? (o.userData.boneIndex as number) : null;

/**
 * NAMING A PART ON A FIGURE THAT IS ONE MESH.
 *
 * The partition below is written in rig handles — "the head", "an ear", "the cloak" —
 * and it used to resolve them as SUBTREES, which worked while every part was its own
 * object. The rebuilt goblin is one continuous skin over a skeleton, so `goblin.head`
 * carries no geometry at all and a subtree walk measures nothing.
 *
 * So a descriptor whose roots are BONES switches to INFLUENCE mode: a vertex belongs to
 * the part whose bone dominates its four skin weights, and `exclude`'s own bones are
 * subtracted (which is exactly how `head` has always meant "head mass, ears excluded").
 * Rigid furniture — the eyes, the pupils, the authored marks — belongs to the nearest
 * bone above it, which is the same answer the subtree walk gave. Every existing
 * descriptor keeps its meaning; nothing here knows a mesh name.
 */
function influence(roots: THREE.Object3D[], exclude: THREE.Object3D[]) {
  const rootBones = roots.filter((r) => boneIdx(r) !== null);
  if (rootBones.length === 0) return null;
  const allow = new Set<number>();
  const allowObj = new Set<THREE.Object3D>();
  const mark = (o: THREE.Object3D, on: boolean) =>
    o.traverse((c) => {
      const i = boneIdx(c);
      if (i === null) return;
      if (on) {
        allow.add(i);
        allowObj.add(c);
      } else {
        allow.delete(i);
        allowObj.delete(c);
      }
    });
  for (const r of rootBones) mark(r, true);
  for (const e of exclude) if (boneIdx(e) !== null) mark(e, false);
  let fig: THREE.Object3D | null = rootBones[0];
  while (fig && fig.userData.gobRoot !== true) fig = fig.parent;
  return fig ? { allow, allowObj, fig } : null;
}

/** Projected bounding box, in CSS px, of the fill geometry under `roots`. Measured
 * per VERTEX — a bounding-sphere or Box3 approximation of a rotated lathe overstates
 * the silhouette by several px at the sizes this figure actually ships at. */
export function projectedBox(
  cam: THREE.Camera,
  width: number,
  height: number,
  roots: THREE.Object3D[],
  exclude: THREE.Object3D[] = [],
): Box {
  const v = new THREE.Vector3();
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let n = 0;
  const inf = influence(roots, exclude);
  const meshes = inf
    ? fillMeshes([inf.fig], exclude.filter((e) => boneIdx(e) === null))
    : fillMeshes(roots, exclude);
  for (const mesh of meshes) {
    const pos = mesh.geometry.getAttribute('position');
    const mw = mesh.matrixWorld;
    let keep: ((i: number) => boolean) | null = null;
    if (inf) {
      const sk = mesh as THREE.SkinnedMesh;
      if (sk.isSkinnedMesh) {
        const si = mesh.geometry.getAttribute('skinIndex');
        const sw = mesh.geometry.getAttribute('skinWeight');
        keep = (i) => {
          let best = -1;
          let bw = 0;
          for (let c = 0; c < 4; c++) {
            const w = sw.getComponent(i, c);
            if (w > bw) {
              bw = w;
              best = si.getComponent(i, c);
            }
          }
          return best >= 0 && inf.allow.has(best);
        };
      } else {
        let owned = false;
        for (let p: THREE.Object3D | null = mesh; p; p = p.parent) {
          if (inf.allowObj.has(p)) {
            owned = true;
            break;
          }
          if (boneIdx(p) !== null) break; // a bone that is not allowed owns it
        }
        if (!owned) continue;
      }
    }
    for (let i = 0; i < pos.count; i++) {
      if (keep && !keep(i)) continue;
      vertexAt(mesh, i, v).applyMatrix4(mw).project(cam);
      if (v.z > 1) continue; // behind the far plane / behind the lens
      const px = ((v.x + 1) / 2) * width;
      const py = ((1 - v.y) / 2) * height;
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;
      n++;
    }
  }
  return box(x0, y0, x1, y1, n);
}

/** The named parts the acceptance gates talk about, derived from the exported rig
 * handles only — so the same partition survives the §5 geometry rebuild without this
 * file knowing a single mesh name. */
export function gobParts(goblin: Goblin, pencil: THREE.Object3D) {
  const arms = [goblin.armL.pose, goblin.armR.pose];
  // The contact pool (goblin design §8) is a child of his root but it is GROUND, not
  // silhouette: a flat disc under his boots, wider than his stance by design. Counting
  // it in `figure` would add its own width and depth to every §2 silhouette number and
  // quietly flatter — then wreck — G1, G7 and G13. It is found by the same flag that
  // makes it work at all (`userData.neverAlive`), so this stays name-free like the rest
  // of this partition. P5 still measures it, from the ground side, where it belongs.
  const ground = goblin.root.children.filter((c) => c.userData.neverAlive === true);
  // §0.0.3: the satchel is the ONE warm patch on him and P7 excludes its projected
  // region. Found by its own flag, so this partition stays free of mesh names.
  const warm: THREE.Object3D[] = [];
  goblin.root.traverse((o) => {
    if (o.userData.warmPatch === true) warm.push(o);
  });
  return {
    root: goblin.root,
    pencil,
    /** the whole figure, prop and grounding excluded — §2's "height incl. ear tips :
     * max width incl. ears" */
    figure: { roots: [goblin.root], exclude: [pencil, ...ground] },
    /** head mass, ears excluded — G3's numerator */
    head: { roots: [goblin.head], exclude: [goblin.earL, goblin.earR] },
    headAll: { roots: [goblin.head], exclude: [] as THREE.Object3D[] },
    earL: { roots: [goblin.earL], exclude: [] as THREE.Object3D[] },
    earR: { roots: [goblin.earR], exclude: [] as THREE.Object3D[] },
    eyeL: { roots: [goblin.face.eyeL], exclude: [] as THREE.Object3D[] },
    eyeR: { roots: [goblin.face.eyeR], exclude: [] as THREE.Object3D[] },
    /** the CLOAK MASS: everything the chest carries that is not the head chain and not
     * an arm — the garment, the collar and the satchel. G3's denominator, and the
     * column the §14 P2 torso scan runs down. */
    cloak: { roots: [goblin.chest], exclude: [goblin.neck, ...arms] },
    /** the satchel + strap — §0.0.3's exclusion region for P7, and the patch P1 must not
     *  average into "the cloak" */
    warmPatch: { roots: warm, exclude: [] as THREE.Object3D[] },
    /** the contact pool (§8) — P5's device, and therefore the region P6 must NOT read as
     *  cast shadow. Same `neverAlive` flag that makes the pool work at all. */
    pool: { roots: ground, exclude: [] as THREE.Object3D[] },
    /** the figure minus the head chain — "the body must contribute outline". Rooted at
     *  the PELVIS, not at root: on the skinned figure that is what makes `exclude`'s
     *  `neck` subtract the head chain instead of subtracting an empty group. */
    body: { roots: [goblin.pelvis], exclude: [goblin.neck, pencil, ...ground] },
    /** the garment mass BELOW THE SHOULDER — the reference's own §1.3 denominator, and
     *  the one G3 was re-gated against (reference §7.6: head ≥ 1.30 × this). */
    torso: {
      roots: [goblin.pelvis],
      exclude: [goblin.neck, ...arms, goblin.legL.pose, goblin.legR.pose],
    },
    boots: { roots: [goblin.legL.foot, goblin.legR.foot], exclude: [] as THREE.Object3D[] },
    arms,
  };
}

export type GobParts = ReturnType<typeof gobParts>;

/** Convenience: project one of the part descriptors above. */
export function partBox(
  cam: THREE.Camera,
  width: number,
  height: number,
  part: { roots: THREE.Object3D[]; exclude: THREE.Object3D[] },
): Box {
  return projectedBox(cam, width, height, part.roots, part.exclude);
}

/** World-space centre of a part's fill geometry — the raycast gates aim with this. */
export function partCentre(part: {
  roots: THREE.Object3D[];
  exclude: THREE.Object3D[];
}): THREE.Vector3 {
  const b = new THREE.Box3();
  for (const m of fillMeshes(part.roots, part.exclude)) b.expandByObject(m);
  return b.isEmpty() ? new THREE.Vector3() : b.getCenter(new THREE.Vector3());
}

/** CSS px per world unit at a given depth, for the authored hero lens.
 * The §5.12 shell px-solve is the inverse of this. */
export function pxPerUnit(width: number, height: number): number {
  const f = heroFraming(width, height);
  return height / (2 * f.d * Math.tan(((HERO_FOV * Math.PI) / 180) / 2));
}
