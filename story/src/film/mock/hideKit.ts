// KIT — the S6 monster, lifted verbatim out of `mock/hide.ts`'s `buildMock()` (W8c, art
// bible row 22) so `sets/montage.ts` can build the SAME creature the mock route proves.
//
// The ravens (S3) ALSO live here now (P0k-B), as `ravenGeometry()` — but only the
// GEOMETRY: `sets/kit.ts`'s `massMat`/`metalMat` (the trilayer material cache that also
// applies the film's own `FILM_WEAR` scalar) are private to that file and not exported, so
// reaching them from here would mean importing `sets/kit.ts` — which now imports
// `ravenGeometry` FROM here, so that import would cycle. So this file builds the two raven
// geometries (body + beak) in raven-local space and hands them back unmaterialled;
// `sets/kit.ts`'s `buildRaven()` wraps them in its own committed materials, and
// `mock/hide.ts` wraps them in the SAME tokens and dir directly via `createTrilayer`, at
// the mock route's own (unscaled) wear, matching every other class in this file.
//
// Row 22: 13-point bulk profile, non-uniform (1.15, 1.0, 0.62) scale, 20 lathe segments,
// `roughen(bulk, 0.075, 3.0, 44)`, 7 shag clumps of 3–6 per-tick-angled ticks, corrected
// shoulder offsets (+0.11 / +0.26 outboard — the old +0.05/+0.14 rendered armless), a
// 3-tier `createTrilayer` bucket `monsterLit` t3 / `MONSTER_HIDE` t4 / `monsterShade` t4,
// claws in `caveDark`, tusks in `gobTooth`, trilayer eyes in `flameCore`. The ravens: a
// fused body (marching-cubes blobs) + wedge tail + two plate wings, `ravenSlate` t4 at
// poster 0, dir 0.55 (the one-mass family's own rung, R6) — plus a beak in `iron`, the
// bird's one value step.
//
// BASIS (§3.6): the shag ticks and the silhouette contour are view-plane marks — they
// read `marksKit`'s live `VIEW_CAM` at build time, exactly like `marksKit.buildImpact`
// does. This function takes NO basis argument for that reason: the caller must call
// `setMarksView(az, elev)` before building and `setMarksView()` after, same contract as
// every other basis-dependent builder (§4.4). `ravenGeometry()` has no marks and no basis
// dependency at all — it is pure geometry.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { roughen } from '../pencil.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { ball, blobs } from '../sculpt.ts';
import { at, hand, mark, mergeAt, mergeStrokes, mixHex, VIEW_CAM } from './marksKit.ts';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';

// CORRECTED 2026-09-06 (P0l, law 6): was t=0.3 → #AB9471 triTone 0.4613, 0.0013 from the
// 0.46 boundary. Swept t toward monsterHide (the darker partner) in 0.01 steps; t=0.24 is
// the smallest change that clears 0.49 while staying t3.
// Reproduce: node scripts/tritone.mjs mix 8B6D47 F7EFD2 0.24
export const monsterLit = mixHex(P.monsterHide, P.flameCore, 0.24); // #A58C68 triTone 0.4972 t3
export const monsterShade = mixHex(P.monsterHide, P.caveDark, 0.5); // #655037 t4
// CORRECTED 2026-09-06 (P0l, law 6): raw P.monsterHide (#8B6D47) triTone 0.6372 was
// 0.0172 from the 0.62 boundary. Mixed toward P.caveDark (the monster's own dark) in 0.01
// steps; t=0.05 is the smallest that clears 0.65, and stays 0.1269 below monsterShade's
// 0.7791 (well over the 0.06 floor so the hide/shade step still reads).
// Reproduce: node scripts/tritone.mjs mix 8B6D47 3F3226 0.05
// node scripts/measure/p0l-monster-tiers.mjs
export const MONSTER_HIDE = mixHex(P.monsterHide, P.caveDark, 0.05); // #876A45 triTone 0.6522 t4

// world.ts:3229's own profile, unchanged — wide seated haunch, a waist that pulls in at
// standing height (this is the clearance the goblin works in), a chest hump, a narrow
// neck, then a small head lobe separated from the shoulders.
const BULK: [number, number][] = [
  [0.02, -0.86], [0.6, -0.8], [0.68, -0.6], [0.6, -0.35],
  [0.46, -0.1], [0.4, 0.15], [0.32, 0.35], [0.22, 0.52],
  [0.16, 0.6], [0.28, 0.66], [0.32, 0.76], [0.16, 0.85], [0.02, 0.88],
];

/** A linear read of the curve the lathe revolves — shag and arms land ON the surface. */
const bulkR = (y: number): number => {
  for (let i = 1; i < BULK.length; i++) {
    const [r0, y0] = BULK[i - 1];
    const [r1, y1] = BULK[i];
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return BULK[BULK.length - 1][0];
};

export type Part = { geom: THREE.BufferGeometry; m: THREE.Matrix4 };

export interface MonsterOpts {
  /** Non-uniform lathe scale. Default is the film's own R16 cast scale. */
  scale?: THREE.Vector3;
  /** `hand()` seed for the shag-tick jitter and the silhouette wobble. */
  seed?: number;
}

/** THE MONSTER, S6 — verbatim off `mock/hide.ts`'s `buildMock()`. See file doc above. */
export function buildMonster(opts: MonsterOpts = {}): THREE.Group {
  const SCALE = opts.scale ?? new THREE.Vector3(1.15, 1.0, 0.62);
  const rnd = hand(opts.seed ?? 0x6d3a9);
  const g = new THREE.Group();
  const hideParts: Part[] = [];
  const litParts: Part[] = [];
  const shadeParts: Part[] = [];
  const clawParts: Part[] = [];
  const boneParts: Part[] = [];
  const marks: LineSegments2[] = [];

  // R16's cast scale: he stands ~1.74 u of bulk on a 0.9-u lift, which is a head over
  // twice the goblin. The base is at y 0.9 so the profile's own −0.86 meets the ground.
  const MY = 0.9;
  const base = at([0, MY, 0], [0, 0, 0.05]); // nothing this big sits perfectly plumb
  {
    // 20 radial segments, not world.ts's 10: at set scale ten flat panels shade as a
    // folded lampshade, which is the exact failure ?mock=foliage forced on the pine.
    const bulk = new THREE.LatheGeometry(BULK.map(([r, y]) => new THREE.Vector2(r, y)), 20);
    bulk.scale(SCALE.x, SCALE.y, SCALE.z);
    // ROUGHENED, AND IT IS THE ROW'S OWN CLAUSE: "tiers ride the roughen() displacement,
    // never parallel bands". amp 0.075 is 11% of the bulk's own 0.68 max radius, inside
    // the bible's 7–22% band.
    roughen(bulk, 0.075, 3.0, 44);
    hideParts.push({ geom: bulk, m: base });
  }

  // the seven shag clumps, verbatim — angles favour the −70°..140° arc the S6 camera
  // sees, with two held back at 200/260 for the neighbouring shots.
  const SHAG: [number, number, number, number][] = [
    [-1.222, -0.65, 0.28, 0.2], [-0.698, -0.55, 0.26, 0.19],
    [-0.175, -0.3, 0.24, 0.17], [0.873, 0.05, 0.2, 0.14],
    [1.92, 0.4, 0.16, 0.12], [3.491, -0.6, 0.26, 0.18],
    [4.538, -0.3, 0.22, 0.15],
  ];
  for (const [a, y, w, h] of SHAG) {
    const r = bulkR(y);
    // the clump's own frame on the hide: outward along the surface normal, pushed clear
    // of the solid so the ticks are not buried inside the mass they fringe
    const o = new THREE.Vector3(Math.cos(a) * r * SCALE.x, MY + y * SCALE.y, Math.sin(a) * r * SCALE.z);
    const out = new THREE.Vector3(Math.cos(a) * SCALE.z, 0.12, Math.sin(a) * SCALE.x).normalize();
    const side = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 1, 0)).normalize();
    const n = 3 + Math.floor(rnd() * 4); // 3..6 ticks per clump
    for (let i = 0; i < n; i++) {
      const cx = (rnd() - 0.5) * w;
      const cy = (rnd() - 0.5) * h;
      // THE PER-TICK ANGLE is the whole word. Three ticks at one angle is a hatch
      // patch; three at their own angles is fur.
      const ang = (rnd() - 0.5) * 2.4;
      const len = 0.05 + rnd() * 0.04;
      const p = (dh: number, dv: number, push: number) =>
        o.clone().addScaledVector(side, cx + dh).setY(o.y + cy + dv).addScaledVector(out, push);
      marks.push(
        mark(
          [
            p(-Math.sin(ang) * len * 0.5, -Math.cos(ang) * len * 0.5, 0.05),
            p(0, 0, 0.075),
            p(Math.sin(ang) * len * 0.5, Math.cos(ang) * len * 0.5, 0.05),
          ],
          P.graphiteDark,
          'faint',
        ),
      );
    }
  }

  // the arms — solid masses planted like knuckles, an upper and a forearm meeting at a
  // bent elbow. A single rod shades as a flat tube; the elbow break gives the light two
  // round masses. The far arm is bigger: the sheet's own forced perspective.
  for (const side of [-1, 1] as const) {
    const big = side === 1 ? 1.25 : 1;
    // +0.11 / +0.26 outboard, not world.ts's +0.05 / +0.14. At the smaller number the
    // upper arm sat 0.05 u proud of a bulk the roughen displaces by 0.075, so the whole
    // limb rendered INSIDE the mass it hangs off and the mock came back armless.
    const shoulder = new THREE.Vector3(side * (bulkR(0.3) * SCALE.x + 0.11), 0.32, 0.16);
    const paw = new THREE.Vector3(side * (bulkR(0.3) * SCALE.x + 0.26) * big, -0.5, 0.3 * big);
    const elbow = shoulder.clone().lerp(paw, 0.48);
    elbow.x += side * 0.045 * big;
    elbow.z += 0.05 * big;
    const seg = (a: THREE.Vector3, b: THREE.Vector3, rA: number, rB: number, into: Part[]) => {
      const d = new THREE.Vector3().subVectors(b, a);
      into.push({
        geom: new THREE.CylinderGeometry(rB, rA, d.length(), 10),
        m: base.clone().multiply(
          new THREE.Matrix4().compose(
            new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
            new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()),
            new THREE.Vector3(1, 1, 1),
          ),
        ),
      });
    };
    // upper arm at the LIT tier, forearm at the SHADE tier: the row's t3/t4/t4 ladder
    // needs the shag between its two darks and the elbow is where it gets a third value
    seg(shoulder, elbow, 0.1 * big, 0.075 * big, litParts);
    seg(elbow, paw, 0.075 * big, 0.062 * big, shadeParts);
    // the mitt, and three claws off it — caveDark, the film's ink-dark tier
    hideParts.push({
      geom: new THREE.SphereGeometry(0.085 * big, 10, 8),
      m: base.clone().multiply(at([paw.x, paw.y, paw.z], [0, 0, 0], [1.1, 0.9, 1])),
    });
    for (let c = 0; c < 3; c++) {
      const a = -0.5 + c * 0.5;
      clawParts.push({
        geom: new THREE.ConeGeometry(0.019 * big, 0.1 * big, 6),
        m: base.clone().multiply(
          at(
            [paw.x + Math.sin(a) * 0.07 * big, paw.y - 0.07 * big, paw.z + Math.cos(a) * 0.07 * big],
            [1.35, a, 0],
          ),
        ),
      });
    }
  }

  // two tusks and two eyes — the whole face, and nothing else. At S6's framing the head
  // is under 40 screen px, so a modelled jaw is noise and two bright points are a read.
  for (const s of [-1, 1] as const) {
    boneParts.push({
      geom: new THREE.ConeGeometry(0.022, 0.1, 6),
      m: base.clone().multiply(at([s * 0.075, 0.7, 0.16], [-0.5, 0, s * 0.2])),
    });
  }
  const eyeMat = createTrilayer({ color: P.flameCore, wear: 0, stroke: { dir: 0.55, sheet: true } });
  const eyes = new THREE.Mesh(
    mergeAt(
      [-1, 1].map((s) => ({
        geom: new THREE.SphereGeometry(0.021, 7, 6),
        m: base.clone().multiply(at([s * 0.062, 0.775, 0.14])),
      })),
    ),
    eyeMat,
  );
  g.add(eyes);

  // the monster's own drawn state: ONE contour up its screen-left silhouette and across
  // the shoulder hump, sampled off the profile it revolves. Row 22's tiers ride the
  // roughen and the shag; this is the single line that says where the mass ends.
  {
    const sil: THREE.Vector3[] = [];
    for (let i = 0; i <= 18; i++) {
      const y = -0.84 + (i / 18) * 1.7;
      const r = bulkR(y) * SCALE.x * (1 + (rnd() - 0.5) * 0.04);
      sil.push(new THREE.Vector3(-r, MY + y * SCALE.y, 0).addScaledVector(VIEW_CAM, 0.3));
    }
    marks.push(mark(sil, P.graphiteDark, 'form'));
  }

  // ---- merge: one geometry and one material per token -------------------------------
  // dir 0.55 + (seed%4)·0.07 — the one-mass family, the same ladder rung as rock and
  // skin (R6). Nothing in this film picks off the ladder.
  const bucket: [Part[], number, number, number][] = [
    [hideParts, MONSTER_HIDE, 3, 0.55],
    [litParts, monsterLit, 3, 0.62],
    [shadeParts, monsterShade, 3, 0.69],
    [clawParts, P.caveDark, 0, 0.55],
    [boneParts, P.gobTooth, 0, 0.55],
  ];
  for (const [parts, color, poster, dir] of bucket) {
    if (!parts.length) continue;
    const mesh = new THREE.Mesh(
      mergeAt(parts),
      createTrilayer({ color, wear: 0.26, poster, stroke: { dir, sheet: true } }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  const byMat = new Map<LineSegments2['material'], LineSegments2[]>();
  for (const m of marks) (byMat.get(m.material) ?? byMat.set(m.material, []).get(m.material)!).push(m);
  for (const list of byMat.values()) g.add(mergeStrokes(list));
  // NOT parkSeam()'d here — that is a mock-route / top-level-assembly concern (see
  // `mock/hide.ts`'s own `parkSeam(g)` and `sets/ground.ts`'s note on why a SET does not
  // call it itself). The caller decides.
  return g;
}

/**
 * ROW 22 · A CORVID'S GEOMETRY ONLY — moved out of `sets/kit.ts`'s `buildRaven()`
 * verbatim (P0k-B), because that function's committed materials (`massMat`/`metalMat`)
 * are private to `sets/kit.ts` and importing them here would cycle. A tight teardrop
 * body with no neck, a bladed fanned tail and two folded plate wings, all merged into ONE
 * raven-local-space geometry; and a down-curved wedge beak, its own local offset already
 * baked in via `applyMatrix4` (the same offset `buildRaven()` used to give its beak mesh
 * via `.rotation`/`.position`). Every caller places both with its own top-level transform
 * — `sets/kit.ts`'s `buildRaven()` at the origin (one raven, one call), `mock/hide.ts` at
 * each of its three perches (via `mergeAt`, one call for all three).
 */
export function ravenGeometry(): { body: THREE.BufferGeometry; beak: THREE.BufferGeometry } {
  const body = blobs(
    [
      ball(0.5, 0.46, 0.42, 0.16), // body
      ball(0.5, 0.44, 0.58, 0.14), // breast
      ball(0.5, 0.52, 0.3, 0.11), // rump into the tail root
      ball(0.5, 0.62, 0.64, 0.1), // head, sunk into the chest — a raven has no neck
    ],
    36,
  );
  const tailShape = new THREE.Shape();
  tailShape.moveTo(-0.03, 0);
  tailShape.lineTo(-0.038, 0.13);
  tailShape.lineTo(-0.018, 0.115);
  tailShape.lineTo(-0.006, 0.145);
  tailShape.lineTo(0.008, 0.115);
  tailShape.lineTo(0.022, 0.138);
  tailShape.lineTo(0.038, 0.11);
  tailShape.lineTo(0.03, 0);
  tailShape.lineTo(-0.03, 0);

  const slate: Part[] = [
    {
      geom: body,
      m: new THREE.Matrix4().compose(
        new THREE.Vector3(-0.1875, -0.143, -0.165),
        new THREE.Quaternion(),
        new THREE.Vector3(0.375, 0.31, 0.375),
      ),
    },
    {
      geom: new THREE.ExtrudeGeometry(tailShape, { depth: 0.012, bevelEnabled: false }),
      m: new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0.015, -0.075),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + 0.5, 0, 0)),
        new THREE.Vector3(1, 1, 1),
      ),
    },
  ];
  for (const s of [-1, 1] as const) {
    slate.push({
      geom: new THREE.BoxGeometry(0.012, 0.052, 0.15),
      m: new THREE.Matrix4().compose(
        new THREE.Vector3(s * 0.055, 0.026, -0.025),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.28, s * 0.12, 0)),
        new THREE.Vector3(1, 1, 1),
      ),
    });
  }
  const beak = new THREE.ConeGeometry(0.02, 0.05, 5);
  beak.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(0, 0.036, 0.115),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + 0.22, 0, 0)),
      new THREE.Vector3(1, 1, 1),
    ),
  );
  return { body: mergeAt(slate), beak };
}
