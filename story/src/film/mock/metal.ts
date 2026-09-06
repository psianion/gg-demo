// MOCK — Metal. Art bible §11.2, row 11.
//
//   ?mock=metal · &rig=prep · &zoom=1..6
//
// THE ROW, built: struck / turned / banded forms, NO thin sheet. `sheet: true`,
// `dir 0.55`; poster 8 on the struck and turned masses, poster 0 on the banding; no
// bake. steel t1 · ironLit t2 · brass t3 · iron t3 · ironShade t4. Drawn: contour +
// ONE core-shadow stroke, and one authored glint dab in `mix(steel, paper, 0.7)` — a
// miniature painter's dot-and-line on the blade's upper third, rubbed-bright at the
// grip. NO specular, NO reflection, NO environment map, ever.
//
// SCREEN ARITHMETIC, and it is the row's whole argument: a blade is 0.028 u of fill.
// At the film's volley framing (37.1 px/u) that is 1.04 px and CANNOT carry its read.
// So the read is the BRACKET: a 'form' contour on each long edge, 1.58 px each, =
// 4.2 px of bright vertical bar. That is why the blade here is contoured on both long
// edges by one continuous run and shaded by exactly one stroke down the middle — and
// why a raised sword is a legal silhouette attribute at that framing while a modelled
// hand is not.
//
// SIX MERGED MESHES (five tokens + the glint), nine drawn runs.
import * as THREE from 'three';
import { roughen } from '../pencil.ts';
import { propGround } from './groundKit.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { steel, iron, brass, timberDark, ravenSlate, paper, ink, graphiteDark } from '../palette.ts';
import { hand, mark, merge, mixHex, parkSeam, put, VIEW_CAM, VIEW_R } from './plankKit.ts';

const rnd = hand(0x9c4e);

// SECOND WALK: the shield read as a PAN. A disc's lean cannot be guessed from one Euler
// term — it is solved from the shot: the lens looks along about (0.4, 0.6, −0.8) from
// (4.8, 7, −9.2), so the face's normal is set to that and the rim, boss and straps all
// take the same basis instead of each carrying their own approximation.
const SHIELD_ROT: [number, number, number] = [-0.93, 0, -0.4];

const T = {
  steel, // #B1BAC2 t1 — struck, poster 8
  // 0.45 → 0.60 along the same two-token axis. At 0.45 this is `#949DA7`, `triTone`
  // **0.439** — 0.021 from the t2/t3 boundary at 0.46, INSIDE `trilayer.ts:377`'s ±0.03
  // of world noise, so the arrowhead and the chest hasp it paints flipped tier across
  // their own 8-mm plates. The film moved off it (`sets/kit.ts`'s `IRON_LIT`); this is the
  // reference route the bible measures row 11 on, so it moves with it or the row is
  // measured on a value nothing ships. `#9CA5AE`, `triTone` 0.400, t2, 0.060 clear.
  ironLit: mixHex(iron, steel, 0.6), // #9CA5AE t2 — turned, poster 8
  brass, // #B0913F t3 — turned, poster 8
  iron, // #7D8590 t3 — banded, poster 0
  ironShade: mixHex(iron, ravenSlate, 0.5), // #626974 t4 — banded, poster 0
  shaft: timberDark, // the arrows' wood; not a metal token, and not counted as one
};
type Tok = keyof typeof T;
const POSTER: Record<Tok, number> = { steel: 8, ironLit: 8, brass: 8, iron: 0, ironShade: 0, shaft: 0 };

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();

  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class now builds the ordinary ground
  // card under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  g.add(propGround(2.2, 1.7, [[-0.78,-0.45,48,0.3],[0.34,0.12,78,0.28],[1.2,0.2,36,0.26],[-1.25,0.62,36,0.26],[0.05,-1.05,54,0.3]]));
  const buckets = new Map<Tok, THREE.BufferGeometry[]>();
  const add = (tok: Tok, geom: THREE.BufferGeometry) =>
    (buckets.get(tok) ?? buckets.set(tok, []).get(tok)!).push(geom);
  const glints: THREE.BufferGeometry[] = [];
  const runs = new THREE.Group();

  // ---- 1 · the sword, raised on its point ------------------------------------
  // A blade is an authored SHAPE, never a scaled box: the taper to the point is the
  // silhouette, and a box has none.
  const SW = 0.09; // blade width at the guard
  const SL = 0.86; // blade length
  const sword = new THREE.Vector3(-0.78, 0, -0.45);
  const lean = 0.16; // it leans, because a sword stood dead plumb reads as a diagram
  {
    const s = new THREE.Shape();
    s.moveTo(-SW / 2, 0);
    s.lineTo(SW / 2, 0);
    s.lineTo(SW * 0.42, SL * 0.8);
    s.lineTo(0, SL);
    s.lineTo(-SW * 0.42, SL * 0.8);
    s.closePath();
    add(
      'steel',
      put(new THREE.ExtrudeGeometry(s, { depth: 0.022, bevelEnabled: false }), {
        pos: [sword.x, 0.46, sword.z],
        rot: [0, 0.34, lean],
      }),
    );
    // guard (struck bar), grip (banded), pommel (turned)
    add('brass', put(new THREE.BoxGeometry(0.26, 0.036, 0.05), { pos: [sword.x + 0.08, 0.44, sword.z], rot: [0, 0.34, lean] }));
    add('ironShade', put(new THREE.CylinderGeometry(0.026, 0.024, 0.19, 7), { pos: [sword.x + 0.1, 0.34, sword.z], rot: [0, 0.34, lean] }));
    add('brass', put(roughen(new THREE.SphereGeometry(0.038, 8, 6), 0.004, 9, 4), { pos: [sword.x + 0.12, 0.23, sword.z] }));

    // the glint: ONE authored dab on the blade's upper third, flat in the view plane
    const dab = new THREE.PlaneGeometry(0.03, 0.15);
    glints.push(
      put(dab, {
        pos: [sword.x - 0.045, 0.94, sword.z + 0.03],
        rot: [0, 0.34, lean],
      }),
    );
    // the drawn bracket: down one long edge, across the point, back up the other —
    // ONE run, two contours, because the point is where a hand turns the pencil
    const edge = (side: number) => {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const y = 0.46 + t * SL;
        const w = (SW / 2) * (1 - Math.max(0, (t - 0.8) / 0.2)) * side;
        pts.push(
          new THREE.Vector3(sword.x + VIEW_R.x * w - Math.sin(lean) * t * SL, y, sword.z + VIEW_R.z * w)
            .addScaledVector(VIEW_CAM, 0.1),
        );
      }
      return pts;
    };
    const l = edge(-1);
    const r = edge(1).reverse();
    runs.add(mark([...l, ...r], ink, 'form'));
    // ONE core-shadow stroke, down the blade's shaded third. Never two.
    runs.add(
      mark(
        [
          new THREE.Vector3(sword.x + VIEW_R.x * 0.022, 0.54, sword.z + VIEW_R.z * 0.022).addScaledVector(VIEW_CAM, 0.11),
          new THREE.Vector3(sword.x + VIEW_R.x * 0.016 - Math.sin(lean) * SL * 0.78, 1.14, sword.z + VIEW_R.z * 0.016).addScaledVector(VIEW_CAM, 0.11),
        ],
        graphiteDark,
        'form',
      ),
    );
  }

  // ---- 2 · the shield: a DISHED disc with a proud rim and a domed boss --------
  //
  // ================= FIX ROUND — ITEMS 12 AND 13 =============================
  //
  // ITEM 12 IS THE FILM'S ONLY HARD-GATE VIOLATION and it was in this block:
  // "two straight authored strokes cross at close to a right angle inside the shield
  // disc… visible at the film's own framing". The cause is one word in the comment that
  // used to sit here — "four banded straps across the face, radial — one family, never
  // crossed" — which is false by construction. Four RADIAL straps run THROUGH the
  // centre, so every pair of them crosses there, and two 86° apart (i = 0 and i = 3)
  // cross at close to a right angle. It was a geometry crossing, not a stroke crossing,
  // but it renders as two lines crossing and the gate does not care which pass made it.
  //
  // THE FIX IS THAT NO STRAP REACHES THE CENTRE. Each now runs from the boss's own rim
  // OUTWARD to the shield's rim — six of them, evenly spaced, none overlapping any other
  // at any point, and the boss covers the hub they used to meet in. Six radii that never
  // touch are one family; four diameters are a hatch.
  //
  // ITEM 13: "make the shield read as a shield — rim thickness and boss depth in the
  // silhouette, not a radial ramp. At 500 px it is a coin." A cylinder has neither, so
  // the disc is now a LATHE with a real section: a dished face that falls 0.035 from the
  // rim to the hub, a rim that stands 0.045 PROUD of the face on both sides, and a boss
  // that domes 0.075 out of it. All three are in the outline the moment the shield is
  // not seen exactly face-on — which the shot's own lean guarantees.
  const sh = new THREE.Vector3(0.34, 0.4, 0.12);
  {
    // the section, in the disc's own plane: hub → dished face → proud rim → back
    const SECT: [number, number][] = [
      [0.0, -0.03], [0.1, -0.032], [0.2, -0.026], [0.28, -0.012],
      [0.325, 0.014], [0.35, 0.045], [0.352, 0.0], [0.34, -0.03],
      [0.3, -0.052], [0.16, -0.062], [0.0, -0.064],
    ];
    add(
      'ironLit',
      put(
        roughen(new THREE.LatheGeometry(SECT.map(([r, y]) => new THREE.Vector2(r, y)), 22), 0.005, 9, 5),
        { pos: [sh.x, sh.y, sh.z], rot: SHIELD_ROT },
      ),
    );
    // the rim band, a separate BANDED form at poster 0 — an ink-dark ring does not tier
    // a TorusGeometry is born in the XY plane with its axis along +z; the lathe's axis
    // is +y, so the ring is stood into the disc's own plane BEFORE the shield's rotation
    // carries it into the world. Skip that and the rim lands edge-on across the face.
    const ring = (r: number, tube: number) => {
      const t = new THREE.TorusGeometry(r, tube, 6, 26);
      t.rotateX(-Math.PI / 2);
      return put(t, { pos: [sh.x, sh.y, sh.z], rot: SHIELD_ROT });
    };
    add('iron', ring(0.348, 0.034));
    // THE BOSS, on the axis where a boss goes. It used to sit 0.06 off-centre, which is
    // what made the disc read as a plate with a stud on it rather than as a shield.
    add(
      'brass',
      put(roughen(new THREE.SphereGeometry(0.082, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), 0.004, 9, 6), {
        pos: [sh.x, sh.y, sh.z],
        rot: SHIELD_ROT,
        scale: [1, 1, 1],
      }),
    );
    // SIX STRAPS, EACH FROM THE BOSS'S RIM TO THE SHIELD'S — never through the hub, so
    // no two of them meet anywhere. This is the gate fix.
    // TWO CONCENTRIC BANDS, not six radial straps. Six radii that stop short of the hub
    // satisfy the gate — no two of them touch anywhere — and they were built and walked;
    // what came back was a SHIP'S WHEEL. Six spokes converging on a hub is a wheel
    // whatever the gap in the middle, and row 11's own word for this form is BANDED,
    // which means a ring. Two rings cannot cross each other or anything else, they are
    // what a boss shield actually carries, and they read as a shield at 500 px because
    // concentric circles inside a circle is the shape of one.
    for (const [r, tube] of [[0.16, 0.013], [0.26, 0.015]] as const) {
      add('ironShade', ring(r, tube));
    }
    glints.push(put(new THREE.PlaneGeometry(0.05, 0.02), { pos: [sh.x - 0.13, sh.y + 0.14, sh.z - 0.09], rot: [-0.5, 0.2, 0.3] }));
    // contour: the rim, drawn as a run at 1.02× the turned radius
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 26; k++) {
      const a = (k / 26) * Math.PI * 2;
      const j = 1 + (rnd() - 0.5) * 0.03;
      pts.push(
        new THREE.Vector3(sh.x + VIEW_R.x * Math.cos(a) * 0.352 * j, sh.y + Math.sin(a) * 0.352 * j * 0.86, sh.z + VIEW_R.z * Math.cos(a) * 0.352 * j)
          .addScaledVector(VIEW_CAM, 0.12),
      );
    }
    runs.add(mark(pts, ink, 'form'));
    // the boss's own ring — a concentric circle, which is a second contour and NEVER a
    // second family: two rings do not cross
    const boss: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const j = 1 + (rnd() - 0.5) * 0.05;
      boss.push(
        new THREE.Vector3(sh.x + VIEW_R.x * Math.cos(a) * 0.088 * j, sh.y + Math.sin(a) * 0.088 * j * 0.86, sh.z + VIEW_R.z * Math.cos(a) * 0.088 * j)
          .addScaledVector(VIEW_CAM, 0.16),
      );
    }
    runs.add(mark(boss, graphiteDark, 'form'));
    // ONE core-shadow stroke under the boss
    runs.add(
      mark(
        [
          new THREE.Vector3(sh.x - 0.16, sh.y - 0.09, sh.z - 0.02).addScaledVector(VIEW_CAM, 0.13),
          new THREE.Vector3(sh.x + 0.02, sh.y - 0.17, sh.z + 0.01).addScaledVector(VIEW_CAM, 0.13),
          new THREE.Vector3(sh.x + 0.19, sh.y - 0.1, sh.z + 0.02).addScaledVector(VIEW_CAM, 0.13),
        ],
        graphiteDark,
        'form',
      ),
    );
  }

  // ---- 3 · three arrows, heads up --------------------------------------------
  for (let i = 0; i < 3; i++) {
    const x = 1.16 + i * 0.075;
    const tilt = -0.2 + i * 0.05;
    add('shaft', put(new THREE.CylinderGeometry(0.009, 0.009, 0.78, 5), { pos: [x, 0.39, 0.16 + i * 0.05], rot: [0, 0, tilt] }));
    const s = new THREE.Shape();
    s.moveTo(-0.028, 0);
    s.lineTo(0.028, 0);
    s.lineTo(0, 0.11);
    s.closePath();
    add(
      i === 1 ? 'steel' : 'ironLit',
      put(new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: false }), { pos: [x - Math.sin(tilt) * 0.78, 0.78, 0.16 + i * 0.05], rot: [0, 0, tilt] }),
    );
  }
  // one run brackets all three shafts — three arrows, one draw
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 3; i++) {
      const x = 1.16 + i * 0.075;
      const tilt = -0.2 + i * 0.05;
      pts.push(
        new THREE.Vector3(x + 0.012, 0.02, 0.16 + i * 0.05).addScaledVector(VIEW_CAM, 0.08),
        new THREE.Vector3(x - Math.sin(tilt) * 0.86 + 0.012, 0.86, 0.16 + i * 0.05).addScaledVector(VIEW_CAM, 0.08),
      );
    }
    runs.add(mark(pts, ink, 'form'));
  }

  // ---- 4 · the chain, and the hinge plate ------------------------------------
  // A chain is banded metal: poster 0, one direction, links merged into one geometry.
  for (let i = 0; i < 7; i++) {
    add(
      i % 2 ? 'iron' : 'ironShade',
      put(new THREE.TorusGeometry(0.05, 0.014, 5, 11), {
        pos: [-1.28 + i * 0.012, 0.9 - i * 0.084, 0.62],
        rot: [i % 2 ? Math.PI / 2 : 0, 0, 0.1],
      }),
    );
  }
  // the hasp plate and its two knuckles, lying where a hand left them
  add('iron', put(new THREE.BoxGeometry(0.3, 0.018, 0.1), { pos: [0.05, 0.012, -1.05], rot: [0, 0.6, 0] }));
  for (const s of [-1, 1] as const) {
    add('ironShade', put(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 7), { pos: [0.05 + s * 0.1 * Math.cos(0.6), 0.02, -1.05 - s * 0.1 * Math.sin(0.6)], rot: [0, 0.6, Math.PI / 2] }));
  }
  runs.add(
    mark(
      [
        new THREE.Vector3(-1.26, 0.95, 0.62).addScaledVector(VIEW_CAM, 0.1),
        new THREE.Vector3(-1.21, 0.42, 0.62).addScaledVector(VIEW_CAM, 0.1),
        new THREE.Vector3(-1.18, 0.05, 0.62).addScaledVector(VIEW_CAM, 0.1),
      ],
      graphiteDark,
      'form',
    ),
  );

  // ---- merge ------------------------------------------------------------------
  for (const [tok, list] of buckets) {
    const mesh = new THREE.Mesh(
      merge(list),
      createTrilayer({ color: T[tok], wear: 0.26, poster: POSTER[tok], stroke: { dir: 0.55, sheet: true } }),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  // the glints — one merged geometry, one material, the only near-paper value on any
  // metal in the film, and it is PAINT, not a highlight the renderer computed
  {
    const mat = createTrilayer({ color: mixHex(steel, paper, 0.7), wear: 0, stroke: { dir: 0.55, sheet: true } });
    mat.side = THREE.DoubleSide;
    g.add(new THREE.Mesh(merge(glints), mat));
  }
  g.add(runs);
  return parkSeam(g);
}
