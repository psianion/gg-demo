import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildHero,
  heroProject,
  parkHeroRig,
  shadowReachX,
  pathZ,
  HERO_AZ,
  HERO_AZ_PORTRAIT,
  SEAM_X,
  SEAM_W,
  GOB_SCALE,
  solveGoblinRim,
  solveGoblinScale,
  ISLAND_RX,
  ISLAND_RZ,
} from '../src/film/stages/hero.ts';
import {
  heroCamera,
  gobParts,
  partBox,
  partCentre,
  fillMeshes,
  pxPerUnit,
  vertexAt,
  type Box,
} from '../src/film/gobParts.ts';
import { buildGoblin } from '../src/film/stages/goblin.ts';

// ============================================================================
// CLASS G — the goblin's geometry and source acceptance gates.
// docs/2026-09-03-goblin-design.md §14, and §13 step 0 ("the measurement split").
//
// Plain node + three, no WebGL, no browser, no new dependency — the same house idiom
// as its twelve siblings. Its other half is CLASS P (window.__gob, src/gobMeasure.ts),
// which needs a framebuffer and therefore a browser.
//
// ---------------------------------------------------------------------------
// TWO CLASSES OF ASSERT, AND WHY THE EXIT CODE ONLY WATCHES ONE
//
// The design doc is a REBUILD brief: most of its gates describe a figure that does not
// exist yet. Writing them as hard asserts today would paint `npm run check` red and
// take the other twelve scripts' signal down with it, which is the fastest way to get
// a whole suite ignored.
//
// So every gate declares when it is supposed to hold:
//
//   expect 'now'     — the shipped build already satisfies it and the redesign KEEPS
//                      it. A regression here fails the process. These decide the exit
//                      code.
//   expect 'rebuild' — the gate the rebuild is AIMED at. It is measured and printed
//                      every run, loudly, with its number; it never fails the process
//                      until someone flips its flag to 'now' as its step lands.
//
// The report prints ✓ / ✗ for both classes, plus a REGRESSION line if a 'rebuild' gate
// that was passing starts failing. Flipping a flag to 'now' is the build checklist's
// actual definition of done for that step (§13).
// ============================================================================

type When = 'now' | 'rebuild';
interface Result {
  id: string;
  when: When;
  ok: boolean;
  title: string;
  detail: string;
}
const results: Result[] = [];
function gate(id: string, when: When, title: string, ok: boolean, detail: string) {
  results.push({ id, when, ok, title, detail });
}

const px1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '—');
const px2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '—');

// ---- the scene, staged exactly as it ships -----------------------------------------
const hero = buildHero();
hero.root.updateMatrixWorld(true);
const G = hero.goblin;
const parts = gobParts(G, hero.pencil);
const rootScale = G.root.scale.x; // rig units → world units

// the four gated breakpoints (§14 G1) plus the two the P4e walks were judged at, so
// the diagnosis table can be reproduced line for line
const GATED: [number, number][] = [
  [390, 844],
  [500, 915],
  [768, 1024],
  [1440, 900],
];
const REPORTED: [number, number][] = [
  [390, 844],
  [500, 915],
  [768, 917],
  [768, 1024],
  [1440, 900],
  [1920, 917],
];

// The camera the gates measure through is the SHIPPED framing solve; pin it against
// heroProject so a future change to either can never silently fork the two runners.
for (const [w, h] of REPORTED) {
  const cam = heroCamera(w, h);
  for (const p of [new THREE.Vector3(0.95, 0.3, pathZ(0.95)), new THREE.Vector3(-1.7, 0.5, -1.18)]) {
    const ref = heroProject(w, h, p);
    const v = p.clone().project(cam);
    assert.ok(
      Math.abs((v.x + 1) / 2 - ref.x) < 1e-12 && Math.abs((1 - v.y) / 2 - ref.y) < 1e-12,
      `${w}x${h}: heroCamera and heroProject must be the same lens`,
    );
  }
}

// ---- the measured table (reproduces GOBLIN-DIAGNOSIS §0) ----------------------------
interface Shot {
  w: number;
  h: number;
  cam: THREE.PerspectiveCamera;
  fig: Box; // soles → ear tips, prop excluded
  figProp: Box; // …with the pencil
  head: Box; // head mass, EARS EXCLUDED (§3's 0.34 H head width)
  headAll: Box; // head + ears — the diagnosis's "head unit"
  hem: Box; // the garment mass below the shoulder — reference §1.3's denominator
  earL: Box;
  earR: Box;
  restTop: number; // highest projected point of everything that is NOT an ear
  pencilLen: number; // true projected length, max-pair — not a bbox diagonal
  pencilOverlap: number; // fraction of that length actually COVERED by his own mass
  pencilInBox: number; // …and the same fraction against the body bbox, for comparison
}

/** Is this screen point covered by any of these meshes' projected triangles?
 *
 * G5 asks for the fraction of the pencil laid "over his own mass", and the first
 * implementation measured it against the body's axis-aligned BOUNDING BOX. That box is
 * the wrong shape for this one test, and provably so: swept across 30 pencil
 * orientations it returned a flat 42% every time, while the real coverage over the same
 * sweep ranged 5–42%. The reason is §2's own mark 4 — the work triangle is a wedge of
 * CLEAN PAPER between the arm's underside, the body's front and the ground, and it lives
 * INSIDE the bounding rectangle. A rectangle test therefore scores the pencil crossing
 * the notch, which is the design, identically to the pencil buried in his cloak, which is
 * the defect. Point-in-projected-triangle is O(tris) per sample and the figure is 6k
 * triangles, so the exact answer costs nothing worth saving.
 */
function coverageTest(cam: THREE.PerspectiveCamera, w: number, h: number, meshes: THREE.Mesh[]) {
  const tris: number[][] = [];
  const v = new THREE.Vector3();
  for (const m of meshes) {
    const pos = m.geometry.getAttribute('position');
    if (!pos) continue;
    const idx = m.geometry.getIndex();
    const n = idx ? idx.count : pos.count;
    const proj: [number, number][] = [];
    for (let i = 0; i < pos.count; i++) {
      vertexAt(m, i, v).applyMatrix4(m.matrixWorld).project(cam);
      proj.push([((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h]);
    }
    for (let i = 0; i < n; i += 3) {
      const [a, b, c] = idx
        ? [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)]
        : [i, i + 1, i + 2];
      tris.push([proj[a][0], proj[a][1], proj[b][0], proj[b][1], proj[c][0], proj[c][1]]);
    }
  }
  return (x: number, y: number) => {
    for (const t of tris) {
      const d1 = (x - t[2]) * (t[1] - t[3]) - (t[0] - t[2]) * (y - t[3]);
      const d2 = (x - t[4]) * (t[3] - t[5]) - (t[2] - t[4]) * (y - t[5]);
      const d3 = (x - t[0]) * (t[5] - t[1]) - (t[4] - t[0]) * (y - t[1]);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) return true;
    }
    return false;
  };
}
const shots = new Map<string, Shot>();

/** True projected length of a thin prop: the largest distance between any two of its
 * projected vertices. A bbox diagonal overstates a diagonal rod by up to 40%. */
function projectedLength(cam: THREE.PerspectiveCamera, w: number, h: number, root: THREE.Object3D) {
  const pts: [number, number][] = [];
  const v = new THREE.Vector3();
  for (const mesh of fillMeshes([root])) {
    const pos = mesh.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).project(cam);
      if (v.z > 1) continue;
      pts.push([((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h]);
    }
  }
  let best = 0;
  let a: [number, number] = [0, 0];
  let b: [number, number] = [0, 0];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d > best) {
        best = d;
        a = pts[i];
        b = pts[j];
      }
    }
  }
  return { len: best, a, b };
}

const gobScale = new Map<string, number>();
for (const [w, h] of REPORTED) {
  const cam = heroCamera(w, h);
  // §11.2's HERO_GOB_SCALE is a PER-BREAKPOINT solve now, so every shot has to be staged
  // at its own scale or G1/G7/G13 all read the 1440 answer at a phone's framing.
  solveGoblinScale(G, w, h);
  solveGoblinRim(G, w, h);
  hero.root.updateMatrixWorld(true);
  gobScale.set(`${w}x${h}`, G.root.scale.x);
  const fig = partBox(cam, w, h, parts.figure);
  const body = partBox(cam, w, h, parts.body);
  const { len, a, b } = projectedLength(cam, w, h, hero.pencil);
  // how much of the tool is laid over his own mass instead of clear ground (§7)
  const covers = coverageTest(cam, w, h, fillMeshes(parts.body.roots, parts.body.exclude));
  let inside = 0;
  let inBox = 0;
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    if (covers(x, y)) inside++;
    if (x >= body.x0 && x <= body.x1 && y >= body.y0 && y <= body.y1) inBox++;
  }
  shots.set(`${w}x${h}`, {
    w,
    h,
    cam,
    fig,
    figProp: partBox(cam, w, h, { roots: [parts.root], exclude: [] }),
    head: partBox(cam, w, h, parts.head),
    headAll: partBox(cam, w, h, parts.headAll),
    hem: partBox(cam, w, h, parts.torso),
    earL: partBox(cam, w, h, parts.earL),
    earR: partBox(cam, w, h, parts.earR),
    restTop: partBox(cam, w, h, {
      roots: [parts.root],
      exclude: [hero.pencil, G.earL, G.earR],
    }).y0,
    pencilLen: len,
    pencilOverlap: inside / (N + 1),
    pencilInBox: inBox / (N + 1),
  });
}

// the gates below that are NOT per-breakpoint (G4's raycast, G11's throw, the shell
// analytic) read the 1440×900 stage, so leave him there rather than at whatever the
// last row of REPORTED happened to be
solveGoblinScale(G, 1440, 900);
solveGoblinRim(G, 1440, 900);
hero.root.updateMatrixWorld(true);

console.log('\n  the shipped figure, measured through the shipped framing solve');
console.log('  viewport     figure w×h      h:w    head+ears  head:hem  ear tips (L/R/rest)');
for (const [w, h] of REPORTED) {
  const s = shots.get(`${w}x${h}`)!;
  console.log(
    `  ${`${w}×${h}`.padEnd(11)}  ${`${px1(s.fig.w)}×${px1(s.fig.h)}`.padEnd(13)} ` +
      `${px2(s.fig.h / s.fig.w).padStart(5)}  ` +
      `${`${((100 * s.headAll.w) / s.fig.w).toFixed(0)}% of w`.padEnd(10)} ` +
      `${px2(s.head.w / s.hem.w).padStart(7)}   ` +
      `${px1(s.earL.y0)}/${px1(s.earR.y0)}/${px1(s.restTop)}`,
  );
}

// ---- G1 / G2 / G3, RE-GATED (2026-09-04) ---------------------------------------------
//
// docs/2026-09-03-goblin-reference.md is binding and its §7.6 strikes all three of these
// outright — the client's own plates measure 1.32–1.38 aspect against G1's ≥ 1.45, both
// ear tips level and 0.203 H BELOW the crown against G2's unequal blades, and head :
// widest body = 1.45 : 1 against G3's ≤ 0.86. What follows is §7.6's own replacement
// text, nothing invented here:
//
//   G1  projected aspect (height : width, ear tips included) lands 1.25 – 1.45, and the
//       ear span IS the figure's full projected width — no other part may be wider.
//   G2  the hood CROWN is the highest projected point; both ear tips sit 0.17 – 0.24 H
//       below it and their heights differ by ≤ 0.02 H.
//   G3  head width ≥ 1.30 × the widest body width below the shoulder.
//
// AND THEY ARE MEASURED IN THE PLATE FRAMING, not through the hero lens. §1.3's numbers
// are pixel measurements of flat drawings at eye level, dead front; a ratio read through
// a 32° perspective at a 43° three-quarter under a 33° downward lens is a different
// quantity, which is exactly the category error §0.0.1 caught inside G6. Reference §9
// says so directly: "a study's aspect can be read straight off against §1.3 and §7.6's
// G1" — off the `&view=front` plate. So the plate camera below is orthographic and
// square, which makes every ratio framing-independent, and the hero-lens numbers stay in
// the printed table above as evidence.
// …and ON THE SCULPT, not on the staged figure. These three are BUILD gates: §1.3's
// plates are neutral standing figures, and the stage's own `REST` is a hunch of 0.34 rad
// composed with a head-turn of 0.54, which rotates the ear axis out of horizontal by
// sin(0.34)·sin(0.54) — 0.13 H of height between two blades that are symmetric by
// construction. Gating a build number on a pose is the same error again, so the plates
// are shot against a fresh un-posed build, which is also exactly what `/?gobstudy=A`
// shows and what the client signed off.
const PLATE_FIG = buildGoblin();
PLATE_FIG.root.updateMatrixWorld(true);
const plateParts = gobParts(PLATE_FIG, hero.pencil);
const PLATE = 1000;
function plateCamera(azDeg: number, elDeg = 5): THREE.OrthographicCamera {
  const face = PLATE_FIG.root.rotation.y + (azDeg * Math.PI) / 180; // his OWN facing
  const el = (elDeg * Math.PI) / 180;
  const c = PLATE_FIG.root.getWorldPosition(new THREE.Vector3());
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  cam.position.set(
    c.x + Math.sin(face) * Math.cos(el) * 10,
    c.y + Math.sin(el) * 10 + 0.4,
    c.z + Math.cos(face) * Math.cos(el) * 10,
  );
  cam.lookAt(c.x, c.y + 0.4, c.z);
  cam.updateMatrixWorld();
  return cam;
}
{
  const plate = plateCamera(0);
  const pb = (p: { roots: THREE.Object3D[]; exclude: THREE.Object3D[] }) =>
    partBox(plate, PLATE, PLATE, p);
  const fig = pb(plateParts.figure);
  const eL = pb(plateParts.earL);
  const eR = pb(plateParts.earR);
  const head = pb(plateParts.head);
  const torso = pb(plateParts.torso);
  // "everything that is NOT an ear" — its top edge is the crown G2 now asks for
  const rest = pb({
    roots: [PLATE_FIG.pelvis],
    exclude: [PLATE_FIG.earL, PLATE_FIG.earR],
  });

  const ar = fig.h / fig.w;
  const earSpan = Math.max(eL.x1, eR.x1) - Math.min(eL.x0, eR.x0);
  gate(
    'G1',
    'now',
    'plate aspect 1.25–1.45, and the ear span IS the figure width (reference §7.6)',
    ar >= 1.25 && ar <= 1.45 && earSpan >= fig.w - 0.5,
    `${px2(ar)} : 1 · ear span ${px1(earSpan)} of ${px1(fig.w)} px figure width`,
  );

  // Screen y runs DOWN, so "highest" is the SMALLEST y.
  const dropL = (eL.y0 - rest.y0) / fig.h;
  const dropR = (eR.y0 - rest.y0) / fig.h;
  const level = Math.abs(eL.y0 - eR.y0) / fig.h;
  gate(
    'G2',
    'now',
    'the crown is the apex; both ear tips 0.17–0.24 H under it and level (reference §7.6)',
    rest.y0 < Math.min(eL.y0, eR.y0) &&
      dropL >= 0.17 && dropL <= 0.24 && dropR >= 0.17 && dropR <= 0.24 &&
      level <= 0.02,
    `crown ${rest.y0 < Math.min(eL.y0, eR.y0) ? 'is' : 'IS NOT'} the apex; tips at ` +
      `${px2(dropL)} / ${px2(dropR)} H below it (want 0.17–0.24); ` +
      `they differ by ${px2(level)} H (want ≤ 0.02)`,
  );

  const r = head.w / torso.w;
  gate(
    'G3',
    'now',
    'head width ≥ 1.30 × the widest body below the shoulder (reference §7.6)',
    r >= 1.3,
    `head ${px1(head.w)}px : body ${px1(torso.w)}px = ${px2(r)} ` +
      `(the plates measure 93 : 64 = 1.45)`,
  );
}

// ---- G4: the eye is proud of the skull ----------------------------------------------
// §6: a raycast down the shipped lens through the eye centre must hit the eye's front
// cap ≥ 0.03 RIG units before any other surface. Measured on BOTH eyes and gated on the
// worse of the two — §14 P3b requires both eyes to return amber, so a far eye buried
// behind the skull is a failure of this gate, not an exemption from it.
{
  const cam = heroCamera(1440, 900);
  // shells are BackSide copies OUTSIDE the form; a contour must not win an occlusion test
  const hidden: THREE.Object3D[] = [];
  G.root.traverse((o) => {
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (m.isMesh && (mat?.userData?.role === 'shell' || m.isLineSegments2) && o.visible) {
      o.visible = false;
      hidden.push(o);
    }
  });
  const report: string[] = [];
  let worst = Infinity;
  for (const [name, eyeGroup] of [
    ['near', G.face.eyeR],
    ['far', G.face.eyeL],
  ] as const) {
    const centre = partCentre({ roots: [eyeGroup], exclude: [] });
    const rc = new THREE.Raycaster(
      cam.position.clone(),
      centre.clone().sub(cam.position).normalize(),
      0.01,
      200,
    );
    const hits = rc.intersectObject(G.root, true);
    const inEye = new Set<THREE.Object3D>();
    eyeGroup.traverse((o) => inEye.add(o));
    // the amber disc is the largest mesh in the eye group — pupil and glint sit proud
    // of it by design and would flatter the number
    let disc: THREE.Mesh | null = null;
    let discR = 0;
    for (const m of fillMeshes([eyeGroup])) {
      m.geometry.computeBoundingSphere();
      const r = m.geometry.boundingSphere?.radius ?? 0;
      if (r > discR) {
        discR = r;
        disc = m;
      }
    }
    const eyeHit = hits.find((x) => x.object === disc);
    const occl = hits.find((x) => !inEye.has(x.object));
    // rig units: divide out the stage's uniform root scale
    const proud = eyeHit
      ? ((occl ? occl.distance : Infinity) - eyeHit.distance) / rootScale
      : -Infinity;
    worst = Math.min(worst, proud);
    report.push(
      eyeHit
        ? `${name} +${px2(proud)}`
        : `${name} NEVER HIT (occluded ${px2((centre.distanceTo(cam.position) - (occl?.distance ?? 0)) / rootScale)} rig units before its centre)`,
    );
  }
  for (const o of hidden) o.visible = true;
  gate('G4', 'now', 'eye proud of the skull ≥ 0.03 rig units', worst >= 0.03, report.join(', '));
}

// ---- G5: the pencil reads ------------------------------------------------------------
{
  const a = shots.get('390x844')!;
  const b = shots.get('1440x900')!;
  gate(
    'G5',
    'now',
    'pencil ≥ 14px @390 / ≥ 34px @1440, ≤ 20% over his own mass',
    a.pencilLen >= 14 && b.pencilLen >= 34 && b.pencilOverlap <= 0.2 && a.pencilOverlap <= 0.2,
    `len ${px1(a.pencilLen)}px @390, ${px1(b.pencilLen)}px @1440; ` +
      `over his mass ${(100 * b.pencilOverlap).toFixed(0)}% @1440, ${(100 * a.pencilOverlap).toFixed(0)}% @390 ` +
      `(bbox, for comparison: ${(100 * b.pencilInBox).toFixed(0)}% / ${(100 * a.pencilInBox).toFixed(0)}%)`,
  );
}

// ---- G6: the three-quarter -----------------------------------------------------------
// §0.0.1 (binding, and it WINS over §14's wording): the algebraic reading — root.y +
// neck.y + head.y against HERO_AZ — is RETIRED. It ignores the pitch that neck.x/head.x
// put on the face normal, it measures against the lens AXIS rather than the him→camera
// ray (heroFraming walks `look` off the world origin to seat the comp), and §3.4's own
// prescribed nudge moves it AWAY from its target. The gate's intent is a readable
// three-quarter, which is a property of the angle between the face plane and the ray the
// lens actually sees him along. That reading is the gate; the retired formula is still
// printed beside it as evidence, so the supersession is legible in every run.
//
// RESTAGE ATTEMPTED AND MEASURED (2026-09-03), and it does not close from one pose. The
// head-turn moves every breakpoint by the same amount — more turn is FEWER degrees off
// the ray, i.e. toward full-face — but the portrait and landscape readings are 12.4°
// apart while the band is 8° wide, so no single `REST.headY` puts all four inside it:
//
//   headY 0.38 (§3.4's own prescribed value) → 35.1 / 35.9 / 37.0 / 47.5 — landscape IN
//   headY 0.293 (−5°)                        → 41.0 / 41.8 / 42.9 / 53.4 — 3 portraits IN
//   headY 0.333 (centred)                    → 37.8 / 38.6 / 39.7 / 50.2 — NONE in
//
// The 12.4° spread is the CAMERA, not him: HERO_AZ 18° vs HERO_AZ_PORTRAIT 24° accounts
// for 6° of it and heroFraming's `look` walk for the rest — the face normal is identical
// in all four rows. Closing it needs the portrait azimuth moved, and §3.4 forbids both a
// camera restage and rotating the root ("Root stays 1.60… no fallback stage"). So the
// DOCUMENTED FALLBACK is taken: `REST` holds §3.4's prescribed neck.y 0.16 + head.y 0.38.
// This gate therefore reports and does not gate — it is blocked on a camera decision
// nobody has authority to make here, not on the pose.
{
  const theta = G.root.rotation.y + G.neck.rotation.y + G.head.rotation.y;
  const faceDoc = new THREE.Vector2(Math.sin(theta), Math.cos(theta));
  const faceGeo = (() => {
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(
      G.head.getWorldQuaternion(new THREE.Quaternion()),
    );
    return new THREE.Vector2(n.x, n.z).normalize();
  })();
  for (const [w, h] of GATED) {
    const s = shots.get(`${w}x${h}`)!;
    const az = w / h < 1 ? HERO_AZ_PORTRAIT : HERO_AZ;
    const lens = new THREE.Vector2(Math.sin(az), -Math.cos(az));
    const gp = G.root.getWorldPosition(new THREE.Vector3());
    const toCam = new THREE.Vector2(s.cam.position.x - gp.x, s.cam.position.z - gp.z).normalize();
    const deg = (v: THREE.Vector2, u: THREE.Vector2) =>
      (Math.acos(Math.max(-1, Math.min(1, v.dot(u)))) * 180) / Math.PI;
    const a = deg(faceGeo, toCam); // §0.0.1 — the face-plane normal against the real ray
    gate(
      'G6',
      'now',
      `face plane 40–48° off the him→camera ray @ ${w}×${h}`,
      a >= 40 && a <= 48,
      `${px1(a)}° measured · ${px1(deg(faceDoc, lens))}° retired doc formula · ${px1(deg(faceGeo, lens))}° normal vs the lens axis`,
    );
  }
}

// ---- G7: the figure is big enough to carry five marks --------------------------------
// §11.2: solve HERO_GOB_SCALE so the projected figure is ≥ 52 CSS px everywhere, capped
// at 1.35× the desktop scale. `solveGoblinScale` (hero.ts) is that solve, and the shot
// loop above stages every breakpoint through it, so this now gates the solved figure and
// prints the multiplier it actually landed on.
for (const [w, h] of GATED) {
  const s = shots.get(`${w}x${h}`)!;
  const base = GOB_SCALE / 0.9;
  const got = (gobScale.get(`${w}x${h}`) ?? base) / base;
  gate(
    'G7',
    'now',
    `figure ≥ 52 CSS px @ ${w}×${h}`,
    s.fig.h >= 52 && got <= 1.35 + 1e-9,
    `${px1(s.fig.h)}px at HERO_GOB_SCALE ${px2(got)}× (cap 1.35×)`,
  );
}

// ---- source gates --------------------------------------------------------------------
const fs = await import('node:fs/promises');
const read = (p: string) => fs.readFile(new URL(p, import.meta.url), 'utf8');
// The rig contract (RIG, REST, POCKET, applyPose, setGoblinRim, the World and Goblin
// types) moved to rig.ts when world.ts was split into sets/*, and world.ts re-exports it
// verbatim — `export * from './rig.ts'`. G8 and G10 below ask which MODULE owns those
// declarations, and that module is still the one every caller reaches through world.ts,
// so the pair is read here as the one source it is.
const worldSrc = (await read('../src/film/world.ts')) + (await read('../src/film/rig.ts'));
const actionsSrc = await read('../src/film/actions.ts');
const heroSrc = await read('../src/film/stages/hero.ts');
const lifeSrc = await read('../src/film/stages/heroLife.ts');
const posterSrc = await read('../src/posterBake.ts');

/** The body of a top-level function, by brace matching from its signature. The body's
 * opening brace is the LAST one on the signature's own line — an inline return type
 * (`function stageGoblin(): { goblin: Goblin; … } {`) opens a brace first. */
function fnBody(src: string, signature: string): string {
  const at = src.indexOf(signature);
  assert.ok(at >= 0, `source gate needs ${signature}`);
  const eol = src.indexOf('\n', at);
  let i = src.lastIndexOf('{', eol);
  assert.ok(i > at, `no body brace on ${signature}'s line`);
  let depth = 0;
  const from = i;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(from, i + 1);
  }
  return src.slice(from);
}
// G9 used to read `fnBody(worldSrc, 'export function buildGoblin()')`. That builder is
// deleted — the figure is stages/goblin.ts now, and the whole file is the builder — so
// the scan is the whole file with full-line comments stripped. Stripping is not
// cosmetic: the file's own header states the ban in prose ("no paint({fill:}), no
// blobs, no hatching"), which the banned-vocabulary regexes would otherwise count as
// four violations of itself.
const goblinSrc = (await read('../src/film/stages/goblin.ts'))
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');
const stageGoblinSrc = fnBody(heroSrc, 'function stageGoblin()');

// G8 — the ear base angle lives in ONE module, unequal per side (§9)
{
  const oneHome =
    /export const EAR_Z_R\b/.test(actionsSrc) !== /export const EAR_Z_R\b/.test(worldSrc);
  const bothImport =
    /EAR_Z_R/.test(worldSrc) &&
    /EAR_Z_R/.test(actionsSrc) &&
    /EAR_Z_L/.test(worldSrc) &&
    /EAR_Z_L/.test(actionsSrc);
  const oldGone = !/\bEAR_Z\b\s*=/.test(actionsSrc) && !/\bEAR_Z\b(?!_)/.test(worldSrc);
  gate(
    'G8',
    'now',
    'EAR_Z_R / EAR_Z_L exported once, imported by world.ts and actions.ts; EAR_Z gone',
    oneHome && bothImport && oldGone,
    `exported-once ${oneHome}, both-import ${bothImport}, old-constant-gone ${oldGone}` +
      (oldGone ? '' : ` (${(actionsSrc.match(/\bEAR_Z\b(?!_)/g) ?? []).length} hits in actions.ts)`),
  );
}

// G9 — buildGoblin's banned vocabulary (§4.3, §5, §9 of the diagnosis)
{
  const banned: [string, RegExp][] = [
    ['hatch(', /\bhatch\(/g],
    ['contact(', /\bcontact\(/g],
    ['blobs(', /\bblobs\(/g],
    ['timberDark', /timberDark/g],
    ['paint(… fill:', /paint\([^)]*\{\s*fill:/g],
  ];
  const hits = banned.map(([n, re]) => [n, (goblinSrc.match(re) ?? []).length] as const);
  gate(
    'G9',
    'now',
    'stages/goblin.ts: no hatch / contact / blobs / timberDark / paint fill',
    hits.every(([, n]) => n === 0),
    hits.map(([n, c]) => `${n} ×${c}`).join(', '),
  );
}

// G10 — ONE rest pose, three readers (§9.1)
{
  const restExported = /export const REST\b/.test(worldSrc);
  const applyPose = /export function applyPose\b/.test(worldSrc);
  // An inline JOINT literal: a numeric rotation/position write onto one of the puppet's
  // OWN groups. Named explicitly rather than matched on ".rotation" alone, because that
  // shape is also every stage's legitimate work and the gate has to tell them apart:
  //   - `goblin.root.position.set(0.95, …)` is PLACEMENT. Where he stands is the stage's
  //     job and §9.1's table does not contain it — only `root.rotation.y`, which IS here.
  //   - `pencil.position/rotation.set(…)` is a PROP in his mitt, not a joint of his.
  // Everything §9.1 actually tables — pelvis, chest, neck, head, the ear pivots, the arm
  // and leg chains, hemFlick — is caught, at any depth (`armR.pose.rotation.set`).
  const LITERAL = new RegExp(
    '\\.root\\.rotation\\.(set\\(\\s*-?\\d|[xyz]\\s*[-+]?=\\s*-?\\d)' +
      '|\\.(pelvis|bob|chest|neck|head|ear[LR]|arm[LR]|leg[LR]|hemFlick|pupils|hood|face)' +
      '\\b[\\w.]*\\.(rotation|position)\\.(set\\(\\s*-?\\d|[xyz]\\s*[-+]?=\\s*-?\\d)',
    'g',
  );
  const readers: [string, string][] = [
    ['stageGoblin', stageGoblinSrc],
    ['posterBake', posterSrc],
    ['the PRM still (heroLife)', lifeSrc],
  ];
  const bad = readers
    .map(([n, s]) => [n, (s.match(LITERAL) ?? []).length] as const)
    .filter(([, c]) => c > 0);
  const callers = readers.filter(([, s]) => /applyPose\(/.test(s)).length;
  gate(
    'G10',
    'now',
    'stageGoblin / PRM still / posterBake share one REST table, no inline joint literals',
    restExported && applyPose && callers === 3 && bad.length === 0,
    `REST ${restExported ? 'exported' : 'MISSING'}, applyPose ${applyPose ? 'exists' : 'MISSING'}, ` +
      `${callers}/3 call it` +
      (bad.length ? `; inline literals: ${bad.map(([n, c]) => `${n} ×${c}`).join(', ')}` : ''),
  );
}

// ---- G11: the crossing shadow is preserved -------------------------------------------
// §8: the whole point of the poster's second silhouette. This holds TODAY and §8 keeps
// it, so it is a real regression fence.
{
  const b = new THREE.Box3();
  for (const m of fillMeshes([G.root])) b.expandByObject(m);
  const reach = shadowReachX(0.95, b.max.y);
  gate(
    'G11',
    'now',
    'his shadow still crosses the seam band',
    reach > SEAM_X + SEAM_W,
    `reach x ${px2(reach)} > seam band edge ${px2(SEAM_X + SEAM_W)} (figure top y ${px2(b.max.y)})`,
  );
}

// ---- G12: the contact pool ------------------------------------------------------------
{
  let pool: THREE.Object3D | null = null;
  for (const c of G.root.children) if (c.userData.neverAlive === true) pool = c;
  const carveOut = /neverAlive/.test(await read('../src/film/curtain.ts'));
  const hideLoop = /for \(const child of goblin\.root\.children\)/.test(stageGoblinSrc);
  // CONTOUR PARITY (§4.4's standing rule, made checkable instead of asserted in prose).
  //
  // His fills carry seam/curtain/alive uniforms; his ink shells and authored marks carry
  // none. That is only safe while EVERY contoured part of him is alive — an alive
  // trilayer computes triC = max(curtain, seam) × (1 − alive) = 0 in every state, so his
  // surfaces never switch to the underdrawing and an always-ink contour can never
  // disagree with them. The one way to break it is a part that is NOT alive but IS
  // contoured: it would change state under the curtain while its own outline did not.
  //
  // So: count the not-alive fills under his root, and require that none of them owns a
  // shell or a stroke. Today that set is exactly {the contact pool}, which is contoured
  // by nothing at all — its edge is the trilayer's own feather.
  const inNeverAlive = (o: THREE.Object3D) => {
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p.userData.neverAlive) return true;
    return false;
  };
  let strayUnAlive = 0; // a trilayer of his that is neither alive nor a declared opt-out
  let contouredOptOut = 0; // …and a contour living inside a declared opt-out
  G.root.traverse((o) => {
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    if (!m.isMesh) return;
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (mat?.userData?.role === 'shell' || m.isLineSegments2 === true) {
      // …counted only when it lives inside SOMEONE ELSE'S opt-out. A contour that IS
      // the opt-out is not a state disagreement: it has no trilayer state to disagree
      // with, and the rebuilt figure's ink shell declares neverAlive for a different
      // rule entirely — a BackSide shell rendered into the shadow map casts from ~1 px
      // outside the fill and shadows the whole figure with itself. The invariant this
      // gate actually polices is a not-alive FILL wearing a contour, which is still
      // caught, exactly.
      if (o.parent && inNeverAlive(o.parent)) contouredOptOut++;
    } else if (mat?.userData?.role === 'trilayer' && mat.userData.alive?.value !== 1) {
      // only a TRILAYER can change state under the curtain or the seam; an ink or basic
      // material (pupils, glints, the eyes) has one value in every state.
      if (!inNeverAlive(o)) strayUnAlive++;
    }
  });
  gate(
    'G12',
    'now',
    'contact pool + contour parity: pool on root & neverAlive, hide-loop gone, no contour on a not-alive part',
    !!pool && carveOut && !hideLoop && strayUnAlive === 0 && contouredOptOut === 0,
    `pool ${pool ? 'present' : 'ABSENT'}, curtain carve-out ${carveOut}, ` +
      `stageGoblin hide-loop ${hideLoop ? 'STILL THERE' : 'gone'}; ` +
      `${strayUnAlive} stray not-alive trilayer(s), ${contouredOptOut} contour(s) inside the opt-out`,
  );
}

// ---- G13: he never sits on the island's underside band ---------------------------------
// The underside starts at the y=0 rim's LOWEST projected edge in his own screen column.
for (const [w, h] of GATED) {
  const s = shots.get(`${w}x${h}`)!;
  let rimBottom = -Infinity;
  for (let a = 0; a < 360; a++) {
    const t = (a / 360) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(t) * ISLAND_RX, 0, Math.sin(t) * ISLAND_RZ).project(s.cam);
    const x = ((p.x + 1) / 2) * w;
    if (x < s.fig.x0 || x > s.fig.x1) continue;
    rimBottom = Math.max(rimBottom, ((1 - p.y) / 2) * h);
  }
  gate(
    'G13',
    'now',
    `figure clear of the island underside @ ${w}×${h}`,
    s.fig.y1 < rimBottom,
    `his soles at y ${px1(s.fig.y1)}, the rim's near edge at ${px1(rimBottom)} (${px1(rimBottom - s.fig.y1)}px of card below him)`,
  );
}

// ---- the shell px-solve, as evidence (§5.12 / §14 P4) -----------------------------------
// Not a gate here — CLASS P measures the rendered rim in pixels. This is the ANALYTIC
// half, and it is now exact rather than approximate: the shells are displaced along
// their own smoothed normals (world.ts inkShell), so a silhouette point's offset IS
// `rimUnits` everywhere on the hull, with no cos-θ term to make one side of the bell
// thick and the other side zero. ×rootScale ×pxPerUnit = CSS px.
{
  // WHAT THIS NUMBER IS, NOW (2026-09-04). It is `setGoblinRim`'s SEED — the hero's
  // per-layout GOB_RIM_PX 3.2 solve, which stageGoblin still calls — and it is not what
  // renders. The rebuilt figure carries reference §7.6's AMENDED P4 in its own
  // onBeforeRender: 1.0 % of the projected figure height, floor 1.0 px, ceiling 3.6 px,
  // re-solved off the live camera every frame. Measured live at 1456×924 the rendered rim
  // was 1.10 CSS px against the 3.20 printed below, because the figure projects 110 px
  // there and a fixed 3.2 px is a blot on it. CLASS P measures the rendered rim.
  console.log('\n  shell rim, analytic — the SEED (live solve is reference §7.6 P4)');
  const offsets = new Map<string, number>();
  let shellCount = 0;
  G.root.traverse((o) => {
    const m = o as THREE.Mesh;
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (!m.isMesh || mat?.userData?.role !== 'shell') return;
    shellCount++;
    offsets.set(`${m.geometry.type}:${shellCount}`, m.userData.rimR as number);
  });
  const list = [...offsets.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`    ${shellCount} shell meshes on him, ${list.length} distinct rim weights`);
  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ] as [number, number][]) {
    // the rim is SOLVED per layout in the app (hero.solveGoblinRim, called wherever
    // setPencilResolution runs), so the analytic read has to re-solve it too or it
    // measures one breakpoint's answer at another breakpoint's scale
    solveGoblinScale(G, w, h);
    solveGoblinRim(G, w, h);
    offsets.clear();
    let k = 0;
    G.root.traverse((o) => {
      const m = o as THREE.Mesh;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      if (!m.isMesh || mat?.userData?.role !== 'shell') return;
      offsets.set(`${m.geometry.type}:${k++}`, m.userData.rimR as number);
    });
    const list = [...offsets.entries()].sort((a, b) => b[1] - a[1]);
    const kpx = pxPerUnit(w, h) * G.root.scale.x;
    const thick = list.map(([, off]) => off * kpx);
    console.log(
      `    ${w}×${h}: ${px2(Math.max(...thick))}px … ${px2(Math.min(...thick))}px ` +
        `— ratio ${px2(Math.max(...thick) / Math.min(...thick))} : 1`,
    );
    console.log(
      `      heaviest: ${list
        .slice(0, 3)
        .map(([n, off]) => `${n.split(":")[0]} ${px2(off * kpx)}px`)
        .join(', ')}`,
    );
  }
}

// ---- report ------------------------------------------------------------------------
console.log('\n  CLASS G gates');
let hardFails = 0;
let softFails = 0;
for (const r of results) {
  if (!r.ok) r.when === 'now' ? hardFails++ : softFails++;
  const tag = r.when === 'now' ? '' : ' [awaits rebuild]';
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.id} ${r.title}${tag}\n      ${r.detail}`);
}
// THE HEADLINE IS THE FAILING COUNT, and it is the first thing on the line.
//
// This footer used to lead with "31 gates · 23 passing" and bury "8 awaiting the
// rebuild" behind it, while `npm run check` exited 0 the whole time — so two build
// reports in a row opened with a green exit as though it meant the gates held. A
// 'rebuild' gate still does not fail the process (that is the whole point of the flag),
// but it is now impossible to read this line and think nothing is outstanding.
const failing = results.filter((r) => !r.ok);
console.log(
  `\n  ${failing.length ? `${failing.length} GATE(S) FAILING: ${failing.map((r) => r.id).join(', ')}` : 'ALL GATES PASSING'}` +
    ` — ${results.length} gates · ${results.filter((r) => r.ok).length} passing · ` +
    `${softFails} awaiting the rebuild · ${hardFails} REGRESSIONS`,
);
console.log(
  `  staged at GOB_SCALE ${GOB_SCALE} base; HERO_GOB_SCALE solved per breakpoint ` +
    `(${GATED.map(([w, h]) => `${w}:${px2((gobScale.get(`${w}x${h}`) ?? 0) / (GOB_SCALE / 0.9))}×`).join(' ')})`,
);

parkHeroRig();
assert.equal(hardFails, 0, `${hardFails} gate(s) that already held have regressed`);
console.log('gob.check: ok');
