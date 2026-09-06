// MOCK — Paper props. Art bible §11.2, row 16. Author group B.
//
//   http://localhost:5180/?mock=paperprop            beside the actual hero island
//   http://localhost:5180/?mock=paperprop&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=paperprop&zoom=1..6
//
// THE ROW COVERS FIVE THINGS and all five are on screen: the signpost boards, a
// character sheet, the DM screen, the map sheet and the book. One recipe, five forms —
// which is the only way to know the recipe is a class and not a prop.
//
// THE CLAUSE THAT DECIDES EVERYTHING HERE: sheets separate by a CONTACT SHADOW and an
// INK RULE LINE, never by tone fill. Paper on paper in a film made of paper cannot use
// value to say "two sheets" — `boardFill` t0 over `tooth` t0 is 8 luma apart and both
// land tier 0, so under the curtain a stack of five sheets would be one white blob. The
// separation is therefore a drawn rule at every overlap plus the real cast shadow the
// upper sheet throws, and it is the same answer at both ends of the curtain.
//
// `bakeScribbleRows` is ILLEGIBLE BY CONSTRUCTION and never a font: rows of short,
// broken, one-direction marks at a wobbling baseline. A character sheet that can be
// read is a character sheet the audience reads instead of watching the film, and a
// rendered typeface is the one thing on this page that would not have been drawn.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { mark, mergeStrokes } from './marksKit.ts';
import { hand, merge, parkSeam, put, rgba, VIEW_CAM, type Place } from './plankKit.ts';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';

const rnd = hand(0x11c7e);

// ---- bakeScribbleRows -------------------------------------------------------------
// 512² tiling. A sheet is 0.5–1.3 u across here and the tile addresses ONE world unit,
// so 512 texels/unit — at the film's 133 px/u figure floor one texel is 0.26 screen px,
// so a scribble mark is authored at 14–34 texels (3.6–8.8 px) and rows sit 25 texels
// apart. Below that the rows moiré into a flat grey, which is the failure this
// arithmetic exists to avoid.
let scribbleTex: THREE.CanvasTexture | null | undefined;
function bakeScribbleRows(): THREE.CanvasTexture | null {
  if (scribbleTex !== undefined) return scribbleTex;
  if (typeof document === 'undefined') return (scribbleTex = null);
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  // base is WHITE, not a colour: `material.color` supplies the paper token, so ONE bake
  // serves boardFill and tooth alike — plankKit's own lever, and row 17's.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.lineCap = 'round';

  // TWENTY ROWS of illegible marks. One direction across the row — a hand writing left
  // to right — and the wobble is in the BASELINE, never in the individual mark's angle,
  // because a second angle family on a 512² sheet is a hatch by another name.
  for (let r = 0; r < 20; r++) {
    const y0 = 14 + r * 25;
    // a paragraph has a ragged right edge and an indent; a block of even rows is a
    // barcode, which is exactly what the sky sheet's lee strokes were caught being
    const indent = r % 6 === 0 ? 40 + rnd() * 30 : 8;
    const right = size - (r % 5 === 4 ? 90 + rnd() * 120 : 10 + rnd() * 26);
    let x = indent;
    while (x < right) {
      const w = 14 + rnd() * 20;
      ctx.strokeStyle = rgba(P.graphite, 0.4 + rnd() * 0.32);
      ctx.lineWidth = 3.4 + rnd() * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y0 + (rnd() - 0.5) * 5);
      ctx.quadraticCurveTo(x + w * 0.5, y0 + (rnd() - 0.5) * 9, x + w, y0 + (rnd() - 0.5) * 5);
      ctx.stroke();
      x += w + 5 + rnd() * 9;
    }
  }
  // four ruled columns down the sheet, at graphiteLight — a character SHEET is ruled,
  // and the rule is what says "form" rather than "letter"
  for (const fx of [0.12, 0.46, 0.62, 0.88]) {
    ctx.strokeStyle = rgba(P.graphiteLight, 0.55);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx * size + (rnd() - 0.5) * 4, 6);
    ctx.lineTo(fx * size + (rnd() - 0.5) * 4, size - 6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return (scribbleTex = tex);
}

/**
 * ONE SHEET, and the whole class is this function. A sheet is 0.006 thick with ONE
 * DOG-EARED CORNER: the corner's own vertices are lifted and pulled inward, so the fold
 * is in the SILHOUETTE rather than painted on it. A sheet with four square corners is a
 * swatch, which is what every paper prop in v1 was.
 */
function sheet(w: number, h: number, corner: number, place: Place): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(w, 0.006, h, 2, 1, 2);
  const pos = geom.getAttribute('position');
  const cx = (corner % 2 ? 1 : -1) * (w / 2);
  const cz = (corner < 2 ? 1 : -1) * (h / 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (Math.abs(x - cx) < 1e-3 && Math.abs(z - cz) < 1e-3) {
      pos.setXYZ(i, x - Math.sign(cx) * w * 0.13, pos.getY(i) + h * 0.1, z - Math.sign(cz) * h * 0.13);
    }
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  // the tile addresses ONE world unit, so a big sheet carries more rows than a small
  // one and the writing is the same size on both — which is what writing does
  const uv = geom.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  uv.needsUpdate = true;
  return put(geom, place);
}

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();
  const map = bakeScribbleRows();
  const fresh: THREE.BufferGeometry[] = []; // boardFill t0
  const aged: THREE.BufferGeometry[] = []; // tooth t0 — out on the table a while
  const marks: LineSegments2[] = [];

  // 1 · THE MAP SHEET, biggest and flattest, with two smaller sheets slid over it —
  // the stack the rule line and the contact shadow exist for
  fresh.push(sheet(1.28, 0.94, 1, { pos: [-0.55, 0.003, 0.42], rot: [0, 0.16, 0] }));
  aged.push(sheet(0.82, 0.62, 3, { pos: [-0.28, 0.014, 0.2], rot: [0, -0.42, 0] }));
  fresh.push(sheet(0.6, 0.46, 0, { pos: [-0.86, 0.024, 0.66], rot: [0, 0.62, 0] }));

  // 2 · THE CHARACTER SHEET, lying alone so its scribble rows read AS rows without
  // another sheet arguing with them
  aged.push(sheet(0.72, 0.98, 2, { pos: [0.72, 0.004, 0.86], rot: [0, -0.14, 0] }));

  // 3 · THE DM SCREEN — three hinged panels standing up. It is the one paper prop with
  // a silhouette, and the fold angles are what give it one.
  ([[0.0, -0.62, 0.34], [0.52, -0.5, -0.28], [1.0, -0.66, 0.5]] as const).forEach(([x, z, yaw], i) => {
    (i === 1 ? aged : fresh).push(
      sheet(0.54, 0.7, i, { pos: [x, 0.35, z], rot: [Math.PI / 2, yaw, 0] }),
    );
  });

  // 4 · THE BOOK — six leaves fanned over a board, and the fan is the only place in
  // this class where two sheets are allowed to touch
  for (let i = 0; i < 6; i++) {
    (i % 2 ? aged : fresh).push(
      sheet(0.42, 0.56, 1, { pos: [-1.72, 0.028 + i * 0.007, -0.5], rot: [0, 0.18 + i * 0.035, 0] }),
    );
  }

  // 5 · THE SIGNPOST BOARDS — the row names them first, and they are this class seen
  // from the side: the same sheet, thicker, nailed to a post.
  const post = new THREE.Mesh(
    put(new THREE.CylinderGeometry(0.038, 0.044, 1.3, 7), { pos: [1.62, 0.65, -0.1] }),
    createTrilayer({ color: P.timberDark, wear: 0.28, stroke: { dir: 1.35, sheet: true } }),
  );
  post.castShadow = true;
  g.add(post);
  fresh.push(sheet(0.6, 0.17, 1, { pos: [1.78, 1.06, -0.1], rot: [Math.PI / 2, 0.3, 0] }));
  aged.push(sheet(0.5, 0.15, 3, { pos: [1.74, 0.84, -0.1], rot: [Math.PI / 2, 0.26, 0] }));

  // ---- the ink rule lines, and they ARE the separation ------------------------------
  const rule = (x0: number, z0: number, x1: number, z1: number, y: number) =>
    marks.push(
      mark(
        [
          new THREE.Vector3(x0, y, z0).addScaledVector(VIEW_CAM, 0.05),
          new THREE.Vector3(x1, y, z1).addScaledVector(VIEW_CAM, 0.05),
        ],
        P.graphite,
        'form',
      ),
    );
  rule(-0.66, -0.08, 0.09, 0.34, 0.019);
  rule(-0.63, 0.53, 0.11, 0.72, 0.019);
  rule(-1.16, 0.5, -0.58, 0.86, 0.03);
  rule(-1.93, -0.74, -1.5, -0.28, 0.075);

  // FOUR `graphiteLight` SCORE DOTS as older nail holes where a previous board hung —
  // one whisper of history per prop, never captioned.
  for (const [x, z] of [[1.62, -0.02], [1.62, 0.02], [1.9, 0.0], [1.36, 0.0]] as const) {
    marks.push(
      mark(
        [
          new THREE.Vector3(x, 1.06, z + 0.09).addScaledVector(VIEW_CAM, 0.06),
          new THREE.Vector3(x + 0.008, 1.063, z + 0.09).addScaledVector(VIEW_CAM, 0.06),
        ],
        P.graphiteLight,
        'faint',
      ),
    );
  }

  // ---- two materials, two draws ----------------------------------------------------
  // dir 0.61, sheet FALSE — a sheet of paper is not an organic mass and takes no
  // view-plane basis; its stroke family runs with the writing. poster 0: a tier-0 fill
  // has nothing to quantize, and a quantized sheet of paper is a photocopy.
  for (const [parts, color] of [[fresh, P.boardFill], [aged, P.tooth]] as const) {
    const mat = createTrilayer({
      color: map ? 0xffffff : color,
      wear: 0.3, // paper is the most-handled surface in the film
      poster: 0,
      stroke: { dir: 0.61, sheet: false },
    });
    if (map) {
      mat.map = map;
      mat.color.setHex(color); // white-based bake × the token = one bake, two papers
    }
    const mesh = new THREE.Mesh(merge(parts), mat);
    // the contact shadow IS half the separation clause — without it a stack of sheets
    // has no depth at any curtain value
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }

  const byMat = new Map<LineSegments2['material'], LineSegments2[]>();
  for (const m of marks) (byMat.get(m.material) ?? byMat.set(m.material, []).get(m.material)!).push(m);
  for (const list of byMat.values()) g.add(mergeStrokes(list));

  return parkSeam(g);
}

// ponytail: the scribble is never legible and there is no font anywhere in this file.
// A readable character sheet is a thing the audience reads instead of watching the
// film, and a rendered typeface is the one mark on this page nobody's hand made.
