// MOCK — Fire. Art bible §11.2, row 13. Author group C / mockup author 4.
//
//   http://localhost:5180/?mock=fire            beside the actual hero island
//   http://localhost:5180/?mock=fire&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=fire&zoom=1..6
//
// ONE CLASS, FOUR SCALES, ONE MATERIAL. This builds the campfire scale (S1/S3); the
// hearth, the candle and the torch are the same call with a different `scale` and a
// narrower stance, which is the row's whole claim and the reason it is one class.
//
// The row's Prep side — "a still graphite teardrop, no glow, no sprite, no rays" —
// cannot be a visible swap (it would pop on scrub), so it is one shared material
// mixing toward graphite by the film's own curtain uniform TAKEN BY IDENTITY. The glow
// sprite's alpha takes (1 − curtain) from the same object, so a drawn fire emits
// nothing. Per-mesh materials added by every fire in the film: ZERO.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { rig, createTrilayer } from '../stages/trilayer.ts';
import { propGround, silhouetteRuns } from './groundKit.ts';
import { mark, mergeStrokes, mergeAt, at, vp, hand, mixHex, VIEW_CAM } from './marksKit.ts';

// coals = mix(amberEmber, caveDark, .35) — #974D29, triTone 0.716, tier 4. An authored
// two-token mix, not a fresh hue (art bible §11.3's own row).
// ITEM 30b — "the coal bed is INVISIBLE at zoom 2". It was mix(amberEmber, caveDark,
// 0.35) = #974D29 at triTone 0.716, a committed tier 4 laid half-buried under the
// lightest object in the frame: at the film's own framing a 0.12-u bed of tier 4 beside
// a tier-0 flame is a shadow, not a bed. The mix goes to 0.18 (#AE5A2C, triTone 0.66,
// still tier 4 and still darker than the tongues by two full tiers) and the crest
// threshold drops so more of every lump takes the amberEmber tier-3 top — so the bed is
// a DARK OBJECT rather than an absence, which is what the fire has to sit in.
const COALS = mixHex(P.amberEmber, P.caveDark, 0.18);

// ---- the shared flame material (cast doc §3.2, art bible R14) ----------------------

let flameMat: THREE.MeshBasicMaterial | null = null;
let coalMatCache: THREE.MeshLambertMaterial | null = null;
let glowMat: THREE.SpriteMaterial | null = null;

/**
 * The coal bed's trilayer — ONE for every fire in the film, hoisted out of buildFire
 * because a material created per call site is a material per campfire, and the census
 * counts materials, not fires. Vertex colours carry both tiers on the one material.
 */
function createCoalMaterial(): THREE.MeshLambertMaterial {
  if (coalMatCache) return coalMatCache;
  const m = createTrilayer({ color: 0xffffff, wear: 0.3, poster: 3, stroke: { dir: 0.55, sheet: true } });
  m.vertexColors = true;
  coalMatCache = m;
  return m;
}

/**
 * THE flame material — every fire in the film shares this one instance, and the bolt
 * and the impact flashes (row 23) share it too. Unlit by construction: fire is the
 * film's only emissive family and a *lit* flame is a contradiction.
 *
 * Hue rides VERTEX COLOURS, so one material and one draw carry the whole amber ramp
 * (flameCore heart → flameBody → amber → ember tip) instead of one material per tier.
 */
export function createFlameMaterial(): THREE.MeshBasicMaterial {
  if (flameMat) return flameMat;
  // DoubleSide: the ember flats are authored in the shot's view plane (no billboards
  // anywhere in this film) and a tongue's far wall is part of its mass.
  const m = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    fog: false,
    side: THREE.DoubleSide,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uFlameCurtain = rig.curtain; // the SAME { value } object
    // WALKED, and a deliberate departure from the row's word: the row says "mixing
    // toward graphite", and at graphite #82807A the drained flame came back a BLOT —
    // the authored teardrop contour is graphiteDark #4A4844 and had almost no
    // separation to sit on, so the one mark that makes it a drawn flame disappeared
    // into its own fill. graphiteLight #B9B6B0 is the pencil tier a drawn flame
    // actually takes: the contour reads, and C11 still holds — the fire stays the
    // lightest OBJECT and the page stays the lightest VALUE.
    shader.uniforms.uFlameGraphite = { value: new THREE.Color(P.graphiteLight) };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uFlameCurtain;\nuniform vec3 uFlameGraphite;',
      )
      // before the colour-space encode, so a full curtain lands exactly on #82807A
      .replace(
        '#include <colorspace_fragment>',
        'gl_FragColor.rgb = mix(gl_FragColor.rgb, uFlameGraphite, clamp(uFlameCurtain, 0.0, 1.0));\n#include <colorspace_fragment>',
      );
  };
  m.customProgramCacheKey = () => 'flame';
  m.userData.role = 'flame';
  flameMat = m;
  return m;
}

// ---- the tongues -------------------------------------------------------------------

// [radius, height, x, z, lean] — kept verbatim from the shipped buildFlames; the lean
// is what stops them reading as traffic cones.
const TONGUES: [number, number, number, number, number][] = [
  [0.12, 0.42, 0, 0, 0.05],
  [0.085, 0.3, 0.06, 0.02, -0.22],
  [0.07, 0.24, -0.055, -0.025, 0.26],
  [0.05, 0.17, 0.02, -0.06, 0.12],
  [0.042, 0.13, -0.03, 0.055, -0.15],
];

// a drawn flame profile — belly low, waist, licking tip. Not a cone.
const PROFILE: [number, number][] = [
  [0.001, 0], [0.55, 0.1], [1.0, 0.32], [0.6, 0.55], [0.3, 0.72], [0.13, 0.88], [0.001, 1.0],
];

const C = new THREE.Color();
const lin = (hex: number) => C.set(hex).toArray() as [number, number, number];

/** The amber ramp as a function of height up a tongue. Core tongue runs hotter. */
function tongueHue(v: number, core: boolean): [number, number, number] {
  // WALKED: running flameCore up the core tongue gave a pale cream lump whose only read
  // was its drawn contour. flameCore is the HEART — the bottom quarter of the tall
  // tongue and nothing else; the mass is flameBody→amber→ember, which is a fire.
  const stops: [number, number, number][] = core
    ? [lin(P.flameCore), lin(P.amber), lin(P.ember)]
    : [lin(P.flameBody), lin(P.ember), lin(P.amberEmber)];
  // the heart is short: v is bent so the first stop only holds the bottom quarter
  const f = Math.min(0.999, Math.max(0, v)) ** 0.55 * 2;
  const i = Math.floor(f);
  const t = f - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function tongueGeom(r: number, h: number, core: boolean): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    PROFILE.map(([px, py]) => new THREE.Vector2(px * r, py * h)),
    12,
  );
  const pos = g.getAttribute('position');
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const [cr, cg, cb] = tongueHue(pos.getY(i) / h, core);
    col[i * 3] = cr;
    col[i * 3 + 1] = cg;
    col[i * 3 + 2] = cb;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// ---- embers (cast doc §3.4) ---------------------------------------------------------
//
// ~14 authored five-point blob flats on a shallow convection arc, phase baked into the
// position, ONE merged geometry, ONE draw, on the shared flame material. The rule that
// makes them work is COUNT ≥ 8, not size. They do not loop: a mod(t, period) puts a
// teleport at the wrap and a scrubbed timeline finds it. See `userData.bob` below.

function emberBlob(o: THREE.Vector3, r: number, hue: [number, number, number], rnd: () => number) {
  const pos: number[] = [];
  const col: number[] = [];
  const rim: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + rnd() * 0.5;
    const rr = r * (0.72 + rnd() * 0.5);
    rim.push(vp(o, Math.cos(a) * rr, Math.sin(a) * rr * 0.82));
  }
  for (let i = 0; i < 5; i++) {
    const b = rim[i];
    const c = rim[(i + 1) % 5];
    pos.push(o.x, o.y, o.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let k = 0; k < 3; k++) col.push(hue[0], hue[1], hue[2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  g.computeVertexNormals();
  return g;
}

// ---- the painted halo ---------------------------------------------------------------

function glowSprite(): THREE.Sprite | null {
  if (typeof document === 'undefined') return null;
  // one bake, one material, every fire in the film — the halo is a shared asset
  if (glowMat) {
    const reuse = new THREE.Sprite(glowMat);
    reuse.scale.setScalar(1.15);
    reuse.renderOrder = 4;
    return reuse;
  }
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d')!;
  const rgba = (hex: number, a: number) =>
    `rgba(${(hex >> 16) & 255},${(hex >> 8) & 255},${hex & 255},${a})`;
  const g = ctx.createRadialGradient(64, 64, 3, 64, 64, 64);
  g.addColorStop(0, rgba(P.flameCore, 0.95));
  g.addColorStop(0.22, rgba(P.amber, 0.5));
  g.addColorStop(0.55, rgba(P.amber, 0.16));
  g.addColorStop(1, rgba(P.amber, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  // a DRAWN fire emits nothing: the halo's alpha takes (1 − curtain) from the same
  // { value } object the tongues mix by, so the glow leaves exactly with the paint
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uFlameCurtain = rig.curtain;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFlameCurtain;')
      .replace(
        '#include <alphatest_fragment>',
        'diffuseColor.a *= 1.0 - clamp(uFlameCurtain, 0.0, 1.0);\n#include <alphatest_fragment>',
      );
  };
  m.customProgramCacheKey = () => 'flameGlow';
  glowMat = m;
  const s = new THREE.Sprite(m);
  s.scale.setScalar(1.15);
  s.renderOrder = 4;
  return s;
}

/**
 * One fire, at `scale` (1 = the S1/S3 campfire; ~0.34 is the hearth's stance, ~0.12 the
 * candle). Everything below is a transform or a vertex colour — nothing here is a
 * material state, so per-source flicker stays a group scale, as the row requires.
 */
export function buildFire(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const rnd = hand(0x51f3);

  // 1 draw — five tongues, one merged geometry, the amber ramp in vertex colours
  const flames = new THREE.Mesh(
    mergeAt(
      TONGUES.map(([r, h, x, z, lean], i) => ({
        geom: tongueGeom(r, h, i === 0),
        m: at([x, 0, z], [0, 0, lean]),
      })),
    ),
    createFlameMaterial(),
  );
  flames.name = 'flames';

  // 1 draw — the coal bed. The tongues are the lightest object in the frame and need a
  // committed dark to sit in, or the fire floats. Trilayer, so it drains with the world:
  // amberEmber t3 on the proud faces, coals t4 below (C5: adjacent tiers must differ).
  const coals = new THREE.Mesh(
    mergeAt(
      // WALKED: proud round lumps read as three orange beans sitting beside the flame.
      // A coal bed is LOW and mostly dark — the fire is the bright thing, the bed is what
      // it sits in. Half-buried, flattened, `coals` t4 with an amberEmber t3 crest only.
      ([
        [0.125, -0.065, 0.062],
        [-0.115, 0.045, 0.056],
        [0.02, 0.115, 0.05],
        [-0.03, -0.115, 0.053],
        [0.085, 0.085, 0.045],
        [-0.075, -0.02, 0.042],
      ] as const).map(([x, z, r], i) => {
        const geom = new THREE.IcosahedronGeometry(r, 1);
        const pos = geom.getAttribute('position');
        const col = new Float32Array(pos.count * 3);
        for (let v = 0; v < pos.count; v++) {
          const hot = pos.getY(v) > r * 0.12 ? lin(P.amberEmber) : lin(COALS);
          col[v * 3] = hot[0];
          col[v * 3 + 1] = hot[1];
          col[v * 3 + 2] = hot[2];
        }
        geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
        return { geom, m: at([x, 0.02, z], [rnd() * 0.6, i, 0], [1.3, 0.56, 1.3]) };
      }),
    ),
    createCoalMaterial(),
  );
  coals.name = 'coals';

  // 1 draw — 14 embers, phase baked into position, one merged geometry
  const embers = new THREE.Group();
  const emberParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 14; i++) {
    const k = i / 13;
    // WALKED: a wide arc read as confetti thrown over the fire. The plume is narrow and
    // leans with the tongues — 14 specks in a COLUMN is a fire; 14 in a fan is a party.
    const o = new THREE.Vector3(
      0.072 * Math.sin(i * 1.93) * (0.35 + k) + k * 0.05,
      0.44 + k * 0.3 + Math.sin(i * 2.7) * 0.025,
      0.05 * Math.cos(i * 2.71) * (0.35 + k),
    );
    const r = 0.024 + rnd() * 0.014; // 0.048–0.076 u across
    const hue = tongueHue(0.55 + k * 0.45, false);
    emberParts.push(emberBlob(o, r, hue, rnd));
  }
  const emberMesh = new THREE.Mesh(
    mergeAt(emberParts.map((geom) => ({ geom, m: at([0, 0, 0]) }))),
    createFlameMaterial(),
  );
  emberMesh.name = 'embers';
  embers.add(emberMesh);
  // Motion, for whoever wires this into a stage: a pure function of the world clock,
  // exactly reversible, and at a = 0 (reduced motion) it is EXACTLY the built pose.
  // ponytail: no loop and no emitter — mod(t, period) teleports at the wrap and a
  // scrubbed timeline finds it.
  embers.userData.bob = (t: number, a = 1) => 0.15 * a * Math.sin(t * 1.46);

  // 1 draw — THE DRAWN TEARDROP and its fringe.
  //
  // WALKED, and this is the row's one real gap: the shared material drains the flame's
  // COLOUR to graphite, and the row calls the Prep side "a still graphite teardrop" — but
  // a drained fill is a grey smudge, not a teardrop. A teardrop is a LINE. So the flame
  // carries one authored contour in the shot's view plane, present in both states (which
  // is what world.ts's own buildFlames already did with sketch(..., 'form')), plus the
  // four shag ticks at the tongue tips, each at its OWN angle — no-hatch by construction.
  // authored point for point, up the left side to the licking tip and back down the
  // right — belly, waist, tip. A trig sweep gave a lens; a flame is drawn, not solved.
  // ============ FIX ROUND — ITEM 30a ==========================================
  // "The authored teardrop contour is a HARD BALLOON OUTLINE that sits 2–4 px proud of
  // the tongue mass. Derive it from the merged silhouette instead of the view plane."
  //
  // The contour is authored, and it stays authored — a flame is drawn, not solved, and
  // a trig sweep gave a lens the first time this was tried. What was wrong is that it
  // was authored in the VIEW PLANE at a fixed 0.16 push, which puts it in front of the
  // tongues by a constant depth regardless of where the tongue actually turns; at the
  // route's framing that measures as the 2–4 px halo the judgement found.
  //
  // So the SAME fifteen points are now measured against the merged tongue silhouette:
  // `silhouetteRuns` gives the tongues' own outline from this lens, and each authored
  // point is pulled radially onto the nearest point of it. The hand survives — the
  // point order, the waist, the licking tip are all still authored — and the line lands
  // ON the mass. The push drops to 0.04, which is depth-test clearance and nothing more.
  const O = new THREE.Vector3(0, 0, 0);
  const sil = silhouetteRuns(flames.geometry, VIEW_CAM).flat();
  const snap = (p: THREE.Vector3): THREE.Vector3 => {
    if (!sil.length) return p;
    let best = sil[0];
    let bd = Infinity;
    for (const q of sil) {
      const d = q.distanceToSquared(p);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    // 0.6 of the way onto the silhouette: fully snapped, the authored waist collapses
    // into whichever tongue happens to be nearest and the teardrop stops being a
    // teardrop. Measured on screen, 0.6 puts the line inside the mass's own edge at
    // every station while keeping the shape the hand drew.
    return p.lerp(best, 0.6);
  };
  const contour = mark(
    ([
      [-0.02, 0.006], [-0.105, 0.062], [-0.138, 0.148], [-0.101, 0.238],
      [-0.063, 0.302], [-0.056, 0.372], [-0.023, 0.437], [0.016, 0.476],
      [0.029, 0.401], [0.053, 0.327], [0.099, 0.246], [0.129, 0.151],
      [0.101, 0.061], [0.021, 0.006], [-0.02, 0.006],
    ] as const).map(([h, y]) => snap(vp(O, h, y, 0)).addScaledVector(VIEW_CAM, 0.04)),
    P.graphiteDark,
    'form',
  );
  const fringe = mergeStrokes([
    contour,
    ...([
      [0, 0.435, 0, 1.31, 0.075],
      [0.062, 0.315, 0.02, 1.06, 0.06],
      [-0.058, 0.255, -0.025, 1.72, 0.058],
      [0.021, 0.182, -0.06, 1.45, 0.045],
    ] as const).map(([x, y, z, a, len]) =>
      mark(
        [
          vp(new THREE.Vector3(x, y, z), 0, 0, 0.16),
          vp(new THREE.Vector3(x, y, z), Math.cos(a) * len * 0.6, Math.sin(a) * len * 0.6, 0.16),
          vp(new THREE.Vector3(x, y, z), Math.cos(a + 0.35) * len, Math.sin(a + 0.35) * len, 0.16),
        ],
        P.graphiteDark,
        'form',
      ),
    ),
  ]);
  fringe.name = 'fringe';

  g.add(coals, flames, embers, fringe);
  const halo = glowSprite();
  if (halo) {
    halo.position.set(0, 0.3, 0);
    g.add(halo);
  }
  g.scale.setScalar(scale);
  return g;
}

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();
  // the campfire, and the same class at hearth stance beside it — one build, two
  // scales, so the row's "one class, four scales" claim is on screen and not in prose
  const camp = buildFire(1);
  const hearth = buildFire(0.42);
  hearth.position.set(0.95, 0, 0.35);
  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class now builds the ordinary ground
  // card under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  g.add(propGround(1.6, 1.3, [[0,0,102,0.32],[0.95,0.35,54,0.3]]));
  g.add(camp, hearth);
  return g;
}

// ponytail: no PointLight here. The practical is a RIG concern — rigs.ts already scales
// its amber glow by (1 − curtain), and a second scene light thrown from a mockup would
// relight the hero island beside it and make the comparison a lie. Handoff: the film's
// practicals array (scene book §6.2) parks one at this group's origin.
//
// ponytail: no smoke. Cast doc §4.3 declines it outright — this world's fire is the
// keeper's fire, "smoke says burning where the film needs lit" — and there is no soft
// volumetric in this language that would not land as art bible §9.3's gradient wash.
