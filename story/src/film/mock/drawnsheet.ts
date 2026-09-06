// MOCK — Standing sheet, drawn. Art bible §11.2, row 18. Author group G / author 4.
//
//   http://localhost:5180/?mock=drawnsheet            beside the actual hero island
//   http://localhost:5180/?mock=drawnsheet&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=drawnsheet&zoom=1..6
//
// S5's WINDOW VIEW OF THE UNDRAWN WORLD — the film's one sky that is a drawing, seen
// through the film's one finished room. THE ROOM IS FINISHED; OUTSIDE IS STILL PENCIL,
// and that sentence is the entire beat.
//
// It is only ever a drawn state. `MeshBasicMaterial`, `fog: false`, outside the
// trilayer entirely — which means, like row 19's machinery, it looks the SAME in both
// rigs on this route, and that is the row's own column rather than a fault. The other
// twenty-one classes prove they can drain; this one proves it never had to.
//
// THE CUT SHEET AND THE SLOT ARE ROW 17'S, LITERALLY — `leafShape` is imported from
// `sky.ts` rather than copied, so "the same cut sheet as row 17" is a fact about the
// build and not a claim in a comment. Two tiers of card, `graphite #82807A` for the
// treeline and `graphiteLight #B9B6B0` for the hill behind it, on one 256² bake.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { StrokeBag, kseed, krand, parkSeam, rgba } from './foliageKit.ts';
import { leafShape } from './foliageKit.ts';

// TILE AT TWO WORLD UNITS, NOT ROW 17's SIX. The row asks for a 256² card and row 17
// tiles at 6 u; taken together that is 43 texels/unit, and at 43 a graphite stroke long
// enough to draw on the canvas (22–56 texels) is 0.5–1.3 WORLD UNITS long — a smear a
// metre wide, which is what the first build of this file put on screen. A pencil stroke
// on a backdrop is 0.1–0.3 u. Tiling at 2 u gives 128 texels/unit and the same authored
// stroke lands at 0.17–0.44 u, which is a mark a hand made. The 256² stays.
const TILE_U = 2;

// ---- bakeGraphiteCard --------------------------------------------------------------
// 256² tiling over 6 world units = 43 texels/unit. That is a QUARTER of row 17's 85,
// and it is right: this card carries graphite tone, not painted banks, and graphite on
// paper has no edges to keep sharp — the mark IS the grain. Base is white so
// `material.color` supplies the tier and one bake serves both cards.
let cardTex: THREE.CanvasTexture | null | undefined;
function bakeGraphiteCard(): THREE.CanvasTexture | null {
  if (cardTex !== undefined) return cardTex;
  if (typeof document === 'undefined') return (cardTex = null);
  kseed(0x5d20be3);
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.lineCap = 'round';

  // 260 graphite strokes, ONE direction, drawn twice at each wrap so the tile has no
  // seam. This is the pencil doing what a pencil does to a big flat area: laying tone
  // in one family and letting the paper come through it. Never crossed — the gate.
  for (let i = 0; i < 320; i++) {
    const x = krand() * size;
    const y = krand() * size;
    const len = 22 + krand() * 34; // 0.17–0.44 u at 128 texels/unit — a pencil stroke
    // 0.31 rad, the drawn world's own lay angle, ±0.1 of hand
    const a = 0.31 + (krand() - 0.5) * 0.2;
    ctx.strokeStyle = `rgba(0,0,0,${0.06 + krand() * 0.13})`;
    ctx.lineWidth = 3.5 + krand() * 3.5;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.quadraticCurveTo(
          x + ox + Math.cos(a) * len * 0.5 + (krand() - 0.5) * 6,
          y + oy + Math.sin(a) * len * 0.5 + (krand() - 0.5) * 6,
          x + ox + Math.cos(a) * len,
          y + oy + Math.sin(a) * len,
        );
        ctx.stroke();
      }
    }
  }
  // and the page's own tooth under all of it — the reason a graphite field is never
  // a flat grey even where the strokes are dense
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = rgba(P.tooth, 0.1 + krand() * 0.16);
    ctx.fillRect(krand() * size, krand() * size, 2 + krand() * 3, 2 + krand() * 3);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return (cardTex = tex);
}

type Card = { w: number; h: number; x: number; z: number; tint: number; lobes: number; notch: number };

// TWO CARDS, and the row names both: a `graphite` treeline in front of a
// `graphiteLight` hill. Two tiers is the whole depth language here, because a drawing
// has no atmosphere to fade into — it has darker marks and fainter ones.
const CARDS: Card[] = [
  { w: 11.4, h: 2.5, x: -0.6, z: 3.6, tint: P.graphite, lobes: 12, notch: 5 },
  { w: 15.8, h: 3.5, x: 0.9, z: 8.4, tint: P.graphiteLight, lobes: 9, notch: 6 },
];

export function buildMock(): THREE.Object3D {
  parkSeam();
  kseed(0x21e7f04);
  const g = new THREE.Group();
  const bag = new StrokeBag();
  const map = bakeGraphiteCard();

  for (const C of CARDS) {
    const shape = leafShape(C.w, C.h, C.lobes, C.notch);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
    // ExtrudeGeometry hands back the shape's own x/y as UVs, and those are world units
    // here, so one divide is the whole "tile at 6 world units" instruction
    const uv = geom.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TILE_U, uv.getY(i) / TILE_U);
    uv.needsUpdate = true;

    // OUTSIDE THE TRILAYER, and that is the row. No light, no fog, no drain, no shadow:
    // a card of graphite tone standing in a slot, identical at every curtain value.
    const mat = new THREE.MeshBasicMaterial({ color: C.tint, fog: false });
    if (map) mat.map = map;
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.set(-0.14, Math.PI, 0, 'YXZ'); // row 17's rake and facing
    mesh.position.set(C.x, 0, C.z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    g.add(mesh);

    // THE BRACE AND THE SLOT LINE, on the back of every sheet, always built — row 17's
    // clause, and on this row it is the only thing that is not a wash. `flat` register:
    // graphite in every state, because the batten is a real batten and was never
    // painted, which on THIS card is true of the whole object.
    mesh.updateMatrix();
    const m = mesh.matrix;
    const back = -0.03;
    const bx = C.w * 0.34;
    const by = C.h * 0.72;
    bag.add(
      [new THREE.Vector3(-bx, 0.06, back), new THREE.Vector3(0, by, back), new THREE.Vector3(bx, 0.06, back)],
      'form',
      'flat',
      m,
    );
    bag.add(
      [new THREE.Vector3(-bx * 0.62, by * 0.42, back), new THREE.Vector3(bx * 0.62, by * 0.42, back)],
      'form',
      'flat',
      m,
    );
    bag.add(
      [new THREE.Vector3(-C.w * 0.46, 0.035, back), new THREE.Vector3(C.w * 0.46, 0.035, back)],
      'faint',
      'flatLight',
      m,
    );
  }

  g.add(bag.build());
  return g;
}

// ponytail: no window frame and no room. Row 18's asset is the SHEET; the finished room
// it is seen through is S5's set and belongs to plank and glass, which are already
// built. Putting a frame here would prove nothing about this class and would put two
// authors' work in one file.
