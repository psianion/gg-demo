import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  buildHero,
  heroFraming,
  heroProject,
  stageHeroRig,
  parkHeroRig,
  solveGoblinRim,
  solveGoblinScale,
  pathZ,
  HERO_FOV,
} from './film/stages/hero';
import { rig } from './film/stages/trilayer';
import { curtain, markAlive } from './film/curtain';
import { setPencilResolution, STROKE_LAYER } from './film/pencil';
import { paper } from './film/palette';

// THE GOBLIN STUDY ROUTE (dev only — main.tsx's gate constant-folds it out of prod).
//
//   /?gobstudy=A | B | C | OLD  [&view=scene|front|three|back|sheet] [&rig=prep] [&zoom=n]
//
// Three sculpts are being built in parallel to replace the shipped figure. Judging one
// in a vacuum is what produced the shipped figure, so this route stands ONE study on
// the shipped hero island, in the shipped hero scene, under the shipped hero camera and
// rigs, at the exact place/rotation/scale hero.ts stages the goblin — and `OLD` puts the
// thing being replaced in the same frame for comparison.
//
// It is a HELD frame on purpose: no heroLife, no entrance, no idle, no camera breath,
// no pointer. rig.birth defaults to 1 and stageHeroRig() sets the same seam/aliveShadow
// the settled cover holds, so what renders here IS the settled hero frame minus its
// life — which makes two screenshots of two studies differ only by the sculpt.
//
// Render path copies Hero.tsx exactly: flat (NoToneMapping), shadows="percentage",
// STROKE_LAYER on the camera, pencil resolution + goblin scale/rim solved per viewport.

export type StudyKey = 'A' | 'B' | 'C' | 'OLD';

// THE PLATE VIEWS. `scene` is the study above and is untouched. The other four stand the
// figure ALONE on the paper — no island, no props, no path — framed the way the client's
// reference sheets are framed, so a screenshot drops straight beside `goblin-body.png` /
// `goblin-actions.png` and the two can be measured against each other.
//
// Azimuths are relative to the figure's OWN facing (his local +z), not to world axes, so a
// study staged at any root rotation still shows its front when you ask for the front.
// Elevation is 5° — the reference plates are drawn at eye level, and a plate camera that
// looks down at him measures a different silhouette than the one the client drew.
export type ViewKey = 'scene' | 'front' | 'three' | 'back' | 'sheet';
const PLATE_AZ: Record<'front' | 'three' | 'back', number> = { front: 0, three: 45, back: 180 };
const PLATE_EL = 5 * (Math.PI / 180);
// the reference figure fills ~0.93 of its card; 0.82 leaves room for the readout to sit in
// the corner without crossing him, and the strip needs more room again
const PLATE_FILL = 0.82;
const SHEET_FILL = 0.78;

// Each sculptor owns one file, so the loader keys are literal — Vite needs an analysable
// specifier, and a literal one also means a broken study can only break its own study.
const BUILDERS: Record<Exclude<StudyKey, 'OLD'>, () => Promise<THREE.Object3D>> = {
  A: async () => (await import('./film/stages/goblin')).buildGobStudyA(),
  B: async () => (await import('./film/stages/gobStudyB')).buildGobStudyB(),
  C: async () => (await import('./film/stages/gobStudyC')).buildGobStudyC(),
};

const VIEWS: ViewKey[] = ['scene', 'front', 'three', 'back', 'sheet'];

export function studyParams(search: string) {
  const q = new URLSearchParams(search);
  const raw = (q.get('gobstudy') ?? '').toUpperCase();
  const study: StudyKey = raw === 'OLD' ? 'OLD' : raw === 'B' || raw === 'C' ? raw : raw === 'A' ? 'A' : 'OLD';
  const prep = (q.get('rig') ?? '').toLowerCase() === 'prep';
  const v = (q.get('view') ?? '').toLowerCase();
  const view: ViewKey = (VIEWS as string[]).includes(v) ? (v as ViewKey) : 'scene';
  const z = Number(q.get('zoom'));
  // ponytail: zoom is clamped at 6 because dpr rides it (2·zoom) and a 1440×900 frame
  // at dpr 12 is a 250 MB drawing buffer. Raise the clamp if a lens ever needs more.
  const zoom = Number.isFinite(z) && z > 0 ? Math.min(6, Math.max(1, z)) : 1;
  return { study, prep, zoom, view };
}

// ---- measurement ------------------------------------------------------------------

// The meshes that make the figure's SILHOUETTE — the same carve-outs hero.ts's own
// scale solve uses (no ink shells, no strokes, no contact pool, no prop), so `OLD`'s
// projected height here is directly comparable to the number solveGoblinScale targets.
function fillMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  const stack: THREE.Object3D[] = [root];
  while (stack.length) {
    const o = stack.pop()!;
    if (!o.visible || o.userData.neverAlive === true || o.userData.prop === true) continue;
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (m.isMesh && m.isLineSegments2 !== true && mat?.userData?.role !== 'shell') {
      if (m.geometry?.getAttribute('position')) out.push(m);
    }
    for (const c of o.children) stack.push(c);
  }
  return out;
}

/** Every visible drawable under `root` — what the figure actually costs to render. */
function drawables(root: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  const stack: THREE.Object3D[] = [root];
  while (stack.length) {
    const o = stack.pop()!;
    if (!o.visible) continue;
    const m = o as THREE.Mesh;
    if ((m.isMesh || (o as THREE.Line).isLine === true) && m.geometry && m.material) out.push(m);
    for (const c of o.children) stack.push(c);
  }
  return out;
}

function measure(figure: THREE.Object3D, camera: THREE.Camera, width: number, height: number) {
  figure.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const m of fillMeshes(figure)) {
    const pos = m.geometry.getAttribute('position');
    const sk = m as THREE.SkinnedMesh;
    for (let i = 0; i < pos.count; i++) {
      // through the POSE: the figure is skinned now, and its position attribute is the
      // bind pose, which is not what any of these views renders
      (sk.isSkinnedMesh ? sk.getVertexPosition(i, v) : v.fromBufferAttribute(pos, i))
        .applyMatrix4(m.matrixWorld)
        .project(camera);
      if (v.z > 1) continue; // behind the lens
      const px = ((v.x + 1) / 2) * width;
      const py = ((1 - v.y) / 2) * height;
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;
    }
  }
  let tris = 0;
  const materials = new Set<string>();
  const draws = drawables(figure);
  for (const m of draws) {
    const g = m.geometry as THREE.BufferGeometry & { instanceCount?: number };
    const verts = g.index ? g.index.count : (g.getAttribute('position')?.count ?? 0);
    // instanced geometry (the ink strokes are LineSegments2) bills per instance
    const n = (m as THREE.InstancedMesh).count ?? (g.instanceCount && g.instanceCount > 0 ? g.instanceCount : 1);
    tris += (verts / 3) * (Number.isFinite(n) && n > 0 ? n : 1);
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
      if (mat) materials.add(mat.uuid);
    }
  }
  const seen = Number.isFinite(x0);
  return {
    // CSS px in the UNMAGNIFIED frame — &zoom does not change these numbers, it only
    // magnifies what you look at, so a study measured at zoom 4 is the same study.
    box: seen
      ? { left: +x0.toFixed(1), top: +y0.toFixed(1), right: +x1.toFixed(1), bottom: +y1.toFixed(1) }
      : null,
    heightPx: seen ? +(y1 - y0).toFixed(1) : 0,
    widthPx: seen ? +(x1 - x0).toFixed(1) : 0,
    tris: Math.round(tris),
    calls: draws.length, // one drawable = one draw call
    materials: materials.size,
  };
}

// ---- the plate views ----------------------------------------------------------------

/**
 * A copy of a RIGGED figure that stands where you put it.
 *
 * `Object3D.clone()` duplicates the bones (they are children of the figure's root) but
 * hands every cloned SkinnedMesh the ORIGINAL's `Skeleton` — three does not remap bone
 * references. The clone then deforms onto the original's world matrix and renders on top
 * of it, so the three-up strip collapsed into one figure with three ink shells stacked on
 * it while each plate showed only its unskinned furniture: the eyes, the marks, the pool.
 * (Measured live the first time the rigged figure met this route.)
 *
 * The remap is short here because a bone carries its own index (`userData.boneIndex`):
 * collect the clone's bones by that index and rebind to a new Skeleton over them. The
 * bone inverses are the REST pose's and are shared — they belong to the sculpt, not to
 * any one copy of it.
 */
function cloneRigged(src: THREE.Object3D): THREE.Object3D {
  const copy = src.clone();
  let skeleton: THREE.Skeleton | null = null;
  src.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!skeleton && m.isSkinnedMesh) skeleton = m.skeleton;
  });
  if (!skeleton) return copy;
  const bones: THREE.Bone[] = [];
  copy.traverse((o) => {
    const i = o.userData.boneIndex;
    if (typeof i === 'number') bones[i] = o as unknown as THREE.Bone;
  });
  const mine = new THREE.Skeleton(bones, (skeleton as THREE.Skeleton).boneInverses);
  copy.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (m.isSkinnedMesh) m.bind(mine, new THREE.Matrix4());
  });
  return copy;
}

/** The figure's own forward in world space (his local +z), flattened to the ground plane. */
function facing(fig: THREE.Object3D): THREE.Vector3 {
  const f = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(fig.getWorldQuaternion(new THREE.Quaternion()))
    .setY(0);
  return f.lengthSq() < 1e-6 ? new THREE.Vector3(0, 0, 1) : f.normalize();
}

/**
 * Hide everything under `root` that is not on the path down to `leaf`, and return the undo.
 * Only siblings OF the kept chain are touched, so nothing inside the figure is disturbed and
 * a study that hides its own parts keeps them hidden.
 */
function isolate(root: THREE.Object3D, leaf: THREE.Object3D): () => void {
  const keep = new Set<THREE.Object3D>();
  for (let o: THREE.Object3D | null = leaf; o; o = o.parent) keep.add(o);
  const hidden: THREE.Object3D[] = [];
  // walk the chain by hand rather than with traverse(): traverse() has no prune, so it
  // reaches the SUBJECT'S OWN children — whose parent is on the chain and which are not
  // themselves on it — and hides the whole figure. Measured live: 0 draw calls.
  const stack: THREE.Object3D[] = [root];
  while (stack.length) {
    const o = stack.pop()!;
    if (o === leaf) continue; // never descend into the subject
    for (const c of o.children) {
      if (keep.has(c)) stack.push(c);
      else if (c.visible) {
        c.visible = false;
        hidden.push(c);
      }
    }
  }
  return () => {
    for (const o of hidden) o.visible = true;
  };
}

/**
 * World box of what the eye reads as the FIGURE — every visible drawable except the ground
 * pool, which is a flat disc nearly three times his width and, left in, sets the plate's
 * whole scale (measured: it took the strip's figures down to 92 CSS px).
 */
function silhouetteBox(obj: THREE.Object3D): THREE.Box3 {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  const stack: THREE.Object3D[] = [obj];
  while (stack.length) {
    const o = stack.pop()!;
    if (!o.visible || o.userData.neverAlive === true) continue;
    const m = o as THREE.Mesh;
    if (m.isMesh && m.geometry) {
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      if (m.geometry.boundingBox) box.union(tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld));
    }
    for (const c of o.children) stack.push(c);
  }
  return box.isEmpty() ? new THREE.Box3().setFromObject(obj) : box;
}

/**
 * Park the camera so `obj` fills `fill` of the SMALLER-margin axis of the frame, seen from
 * `dir` (unit, subject → camera). Iterated against the projected bounding box rather than
 * solved algebraically for the same reason `heroFraming` iterates: under perspective the
 * projected extent of a box is not its size over its distance, and the error at a 32° lens
 * one figure-length away is several per cent. Returns the settled camera distance.
 */
function fitTo(
  cam: THREE.PerspectiveCamera,
  obj: THREE.Object3D,
  dir: THREE.Vector3,
  fill: number,
  width: number,
  height: number,
): number {
  const box = silhouetteBox(obj);
  if (box.isEmpty()) return 4;
  const look = box.getCenter(new THREE.Vector3());
  const corners: THREE.Vector3[] = [];
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  const aspect = width / Math.max(1, height);
  cam.fov = HERO_FOV;
  cam.aspect = aspect;
  const tan = Math.tan((HERO_FOV * Math.PI) / 360);
  let d = Math.max(0.2, box.getSize(new THREE.Vector3()).length());
  const v = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    cam.position.copy(dir).multiplyScalar(d).add(look);
    cam.lookAt(look);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const c of corners) {
      v.copy(c).project(cam);
      if (v.x < x0) x0 = v.x;
      if (v.x > x1) x1 = v.x;
      if (v.y < y0) y0 = v.y;
      if (v.y > y1) y1 = v.y;
    }
    // Recentre FIRST, at the distance the measurement was taken at. `look` and the camera
    // move together, so shifting `look` up pushes the picture DOWN the frame — the sign is
    // positive, and getting it backwards walks the solve off screen (measured: the figure
    // landed at y 1209–1745 in a 900px frame).
    const viewH = 2 * d * tan;
    right.setFromMatrixColumn(cam.matrixWorld, 0);
    up.setFromMatrixColumn(cam.matrixWorld, 1);
    look
      .addScaledVector(right, ((x0 + x1) / 2) * ((viewH * aspect) / 2))
      .addScaledVector(up, ((y0 + y1) / 2) * (viewH / 2));
    // …then take the size step. NDC spans −1..1, so an extent of e covers e/2 of the frame.
    d *= Math.max((y1 - y0) / 2 / fill, (x1 - x0) / 2 / fill);
  }
  cam.position.copy(dir).multiplyScalar(d).add(look);
  cam.lookAt(look);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return d;
}

// ---- the scene --------------------------------------------------------------------

const GOB_X = 0.95; // hero.ts stageGoblin — kept here only to aim the zoom lens

function StudyScene({
  study,
  view,
  onStatus,
}: {
  study: StudyKey;
  view: ViewKey;
  onStatus: (error: string | null) => void;
}) {
  const hero = useMemo(() => buildHero(), []);
  const { camera, size, gl, scene } = useThree();
  const figure = useRef<THREE.Object3D | null>(null);
  // subject = what the plate camera frames; target = what window.__study() measures (the strip
  // frames three figures but must still report ONE, and it reports the front one)
  const plate = useRef<{ subject: THREE.Object3D; dir: THREE.Vector3; target: THREE.Object3D } | null>(
    null,
  );
  const [built, setBuilt] = useState(0); // bumps when a study object lands
  const [staged, setStaged] = useState(0); // bumps when a plate view finishes staging

  // the shared rig singletons, staged and parked exactly as Hero.tsx does
  useEffect(() => {
    stageHeroRig();
    return () => parkHeroRig();
  }, []);

  // build (or fail to build) the study figure and park it on the hero's own staging
  useEffect(() => {
    let dead = false;
    hero.goblin.root.visible = study === 'OLD';
    const attach = (obj: THREE.Object3D) => {
      if (dead) return;
      const g = hero.goblin.root;
      obj.position.copy(g.position);
      obj.quaternion.copy(g.quaternion);
      obj.scale.copy(g.scale); // the hero's solved figure scale — same for every study
      markAlive(obj); // the goblin is alive: casts in both rigs, keeps paint under Prep
      hero.root.add(obj);
      figure.current = obj;
      setBuilt((n) => n + 1);
      onStatus(null);
    };
    if (study === 'OLD') {
      figure.current = hero.goblin.root;
      setBuilt((n) => n + 1);
      onStatus(null);
    } else {
      // a missing / throwing / not-yet-built module is the EXPECTED state for two of
      // the three studies at any moment — it shows as a message, never as a crash
      BUILDERS[study]()
        .then((obj) => {
          if (obj && (obj as THREE.Object3D).isObject3D) attach(obj);
          else throw new Error(`buildGobStudy${study}() returned ${String(obj)}, not an Object3D`);
        })
        .catch((e: unknown) => {
          if (dead) return;
          figure.current = null;
          setBuilt((n) => n + 1);
          onStatus(e instanceof Error ? e.message : String(e));
        });
    }
    return () => {
      dead = true;
      const f = figure.current;
      if (f && f !== hero.goblin.root) f.removeFromParent();
      figure.current = null;
    };
  }, [hero, study, onStatus]);

  // THE PLATE STAGING. `scene` stages nothing and is byte-for-byte the study above.
  // Otherwise the island, the props and the path are hidden and the figure stands alone on
  // the page — `sheet` additionally clones him twice so front, three-quarter and back sit in
  // one strip, which is the direct analogue of a reference plate row.
  useEffect(() => {
    if (view === 'scene') return;
    const fig = figure.current;
    if (!fig) return;
    const fwd = facing(fig);
    let subject: THREE.Object3D = fig;
    let strip: THREE.Group | null = null;
    if (view === 'sheet') {
      strip = new THREE.Group();
      const w = silhouetteBox(fig).getSize(new THREE.Vector3());
      const pitch = Math.max(w.x, w.z, 0.2) * 1.2;
      // lay the three out across the plate camera's own right axis, never along his facing —
      // spaced along +z at a front view they would stand behind one another
      const across = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), fwd).normalize();
      [0, 45, 180].forEach((deg, i) => {
        const c = cloneRigged(fig);
        c.position.copy(fig.position).addScaledVector(across, (i - 1) * pitch);
        c.quaternion.copy(fig.quaternion);
        c.rotateY((deg * Math.PI) / 180);
        strip!.add(c);
      });
      hero.root.add(strip);
      subject = strip;
    }
    const restore = isolate(hero.root, subject);
    const az = view === 'sheet' ? 0 : PLATE_AZ[view];
    const dir = fwd
      .clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), (az * Math.PI) / 180)
      .multiplyScalar(Math.cos(PLATE_EL))
      .setY(Math.sin(PLATE_EL))
      .normalize();
    plate.current = { subject, dir, target: strip ? strip.children[0] : fig };
    setStaged((n) => n + 1);
    return () => {
      restore();
      if (strip) {
        strip.removeFromParent();
        strip.clear();
      }
      plate.current = null;
    };
  }, [hero, view, built]);

  // THE AUTHORED FRAME — Hero.tsx's framing effect, minus the life, and solved at the
  // UNMAGNIFIED viewport.
  //
  // &zoom scales the canvas with a CSS transform, and R3F measures the TRANSFORMED
  // rect: at zoom 3 a 1440×900 window hands this effect size 4320×2700. Solving the
  // authored quantities against that is wrong twice over — setPencilResolution would
  // make every ink stroke a third of its shipped weight, and solveGoblinScale would
  // re-solve the figure for a viewport nobody ships. So every solve reads the real
  // window; the magnification is purely more pixels on the same authored picture,
  // which is what a magnifier is.
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cam = camera as THREE.PerspectiveCamera;
    cam.layers.enable(STROKE_LAYER);
    setPencilResolution(vw, vh);
    solveGoblinScale(hero.goblin, vw, vh);
    solveGoblinRim(hero.goblin, vw, vh);
    // a study rides the same solved scale, so A/B/C/OLD are the same size problem
    const f2 = figure.current;
    if (f2 && f2 !== hero.goblin.root) f2.scale.copy(hero.goblin.root.scale);
    const p = plate.current;
    // the strip's clones were taken before this solve ran, so re-apply it to each of them
    if (f2 && p && p.subject !== f2) for (const c of p.subject.children) c.scale.copy(f2.scale);

    // a plate view frames the FIGURE; `scene` frames the island, exactly as it always did
    if (view !== 'scene' && p) {
      const d = fitTo(cam, p.subject, p.dir, view === 'sheet' ? SHEET_FILL : PLATE_FILL, vw, vh);
      rig.depthNear.value = d * 0.95;
      rig.depthFar.value = d * 2.4;
      return;
    }
    const f = heroFraming(vw, vh);
    cam.fov = HERO_FOV;
    cam.position.copy(f.position);
    cam.lookAt(f.look);
    cam.updateProjectionMatrix();
    rig.depthNear.value = f.d * 0.95;
    rig.depthFar.value = f.d * 2.4;
  }, [camera, size.width, size.height, hero, built, view, staged]);

  // THE HOOK. window.__study() — projected size in CSS px, and what the figure costs.
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__study = () => {
      // in a plate view the measured figure is the plate's own target, so the numbers always
      // describe what is actually on screen
      const f = (view !== 'scene' && plate.current?.target) || figure.current;
      const p = studyParams(window.location.search);
      const info = gl.info.render;
      return {
        study,
        ok: !!f,
        view,
        rig: p.prep ? 'prep' : 'performance',
        zoom: p.zoom,
        // the SHIPPED frame the study is judged in (window CSS px) — never the
        // magnified one; `buffer` is what &zoom actually bought in real pixels
        viewport: { w: window.innerWidth, h: window.innerHeight, dpr: gl.getPixelRatio() },
        buffer: { w: Math.round(size.width * gl.getPixelRatio()), h: Math.round(size.height * gl.getPixelRatio()) },
        place: f
          ? {
              position: f.position.toArray().map((n) => +n.toFixed(4)),
              scale: +f.scale.x.toFixed(4),
            }
          : null,
        figure: f ? measure(f, camera, window.innerWidth, window.innerHeight) : null,
        // whole-frame cost for context — the figure's own share is figure.calls/tris
        sceneCalls: info.calls,
        sceneTris: info.triangles,
      };
    };
    w.__studyScene = { hero, camera, gl, scene, rig };
    return () => {
      delete w.__study;
      delete w.__studyScene;
    };
  }, [study, view, camera, gl, scene, hero, size.width, size.height, built, staged]);

  // held frame: the rigs run on a FROZEN clock so two studies differ only by the sculpt
  useFrame(() => hero.rigs.update(0));

  return <primitive object={hero.root} />;
}

// ---- the route --------------------------------------------------------------------

export default function GobStudy() {
  const { study, prep, zoom, view } = useMemo(() => studyParams(window.location.search), []);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState('50% 50%');
  const readout = useRef<HTMLDivElement>(null);

  useEffect(() => {
    curtain.value = prep ? 1 : 0;
    return () => {
      curtain.value = 0;
    };
  }, [prep]);

  // the magnifier aims at the FIGURE, not the middle of the page: the transform origin
  // is the goblin's own projected screen point under the authored framing. A plate view
  // already centres him, so there the origin stays at the middle of the frame.
  useEffect(() => {
    if (zoom === 1 || view !== 'scene') return;
    const solve = () => {
      const p = heroProject(
        window.innerWidth,
        window.innerHeight,
        new THREE.Vector3(GOB_X, 0.4, pathZ(GOB_X)),
      );
      setOrigin(`${(p.x * 100).toFixed(2)}% ${(p.y * 100).toFixed(2)}%`);
    };
    solve();
    window.addEventListener('resize', solve);
    return () => window.removeEventListener('resize', solve);
  }, [zoom, view]);

  // live numbers in the corner, DevHud-style: textContent through a ref, no setState
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const read = (window as unknown as { __study?: () => Record<string, unknown> }).__study;
      if (readout.current && read) {
        const s = read() as {
          figure: { heightPx: number; widthPx: number; tris: number; calls: number; materials: number } | null;
          sceneCalls: number;
          sceneTris: number;
        };
        readout.current.textContent = s.figure
          ? `figure ${s.figure.widthPx}×${s.figure.heightPx} css px · ${s.figure.tris} tris · ` +
            `${s.figure.calls} calls · ${s.figure.materials} materials   [scene ${s.sceneCalls} calls / ${s.sceneTris} tris]`
          : 'figure — not built';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const css = `#${paper.toString(16).padStart(6, '0')}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: css, overflow: 'hidden' }}>
      <div id="gobstudy-lens" style={{ position: 'absolute', inset: 0 }}>
        {/* THE MAGNIFIER. The scale rides the CANVAS ELEMENT, never an ancestor: R3F
            measures its own container with getBoundingClientRect, so a transform above
            it feeds the measured size back into the canvas's own CSS size and the frame
            runs away (measured live at zoom 3: a 12960px-wide canvas showing an empty
            ninth of the shot). Transforming the canvas leaves the container at the true
            viewport, so the shot, the framing solve and the pencil weight are the
            shipped ones — and the pixel ratio below buys the magnification real pixels
            instead of upscaling a 1× buffer. */}
        {zoom !== 1 && (
          <style>{`#gobstudy-lens canvas { transform: scale(${zoom}); transform-origin: ${origin}; }`}</style>
        )}
        <Canvas
          style={{ position: 'absolute', inset: 0 }}
          // flat = NoToneMapping and shadows="percentage": render-pipeline parity with
          // Hero.tsx. Judging a sculpt under any other transfer judges the transfer.
          flat
          shadows="percentage"
          // 1×: Hero.tsx's [1, 2] range (a range CLAMPS the system dpr — it cannot raise
          // it). Magnified: an explicit number, 2 per zoom step so the buffer keeps ~2
          // device px per screen px, ceilinged at an 8192px buffer — past that a hidpi
          // screen walks into the 16k texture limit and the context dies.
          dpr={zoom === 1 ? [1, 2] : Math.min(2 * zoom, 8192 / window.innerWidth)}
          camera={{ fov: HERO_FOV, near: 0.1, far: 120, position: [0, 5, -9] }}
        >
          <StudyScene study={study} view={view} onStatus={setError} />
        </Canvas>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          font: '12px ui-monospace, Consolas, monospace',
          color: '#222',
          background: 'rgba(247,245,240,.92)',
          border: '1px solid #222',
          padding: '8px 10px',
          maxWidth: 'min(760px, calc(100vw - 20px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div>
          <b>study {study}</b> · view {view} · rig {prep ? 'prep (flat)' : 'performance'} · zoom{' '}
          {zoom}× · window.__study()
        </div>
        <div ref={readout} />
        {error && (
          <div style={{ color: '#7a1f1f', maxWidth: 700, whiteSpace: 'pre-wrap' }}>
            study {study} did not build — {error}
          </div>
        )}
      </div>
    </div>
  );
}
