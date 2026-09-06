// MOCK — Painted map / board. Art bible §11.2, row 20. Author group D.
//
//   http://localhost:5180/?mock=board            beside the actual hero island
//   http://localhost:5180/?mock=board&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=board&zoom=1..6
//
// THE FILM'S LAST SHOT. Everything the story spends 66 seconds arriving at is this
// object, and until now it did not exist — the route printed "still a stub".
//
// THE ROW, built: a printed sheet ON the page, never a plane and never a GridHelper —
// a 24 × 24 card 0.02 thick on its own two-band micro-skirt (`boardFill` lip +
// `caveDark` keel), a drawn double rule inset 0.55 u, corner trim marks, and a battle
// grid at one world unit. `ground: false` — the board is SCENE, not page, so it must
// never take the shader's own page grid; its grid is authored geometry.
//
// SCALE, and it is `plank.ts`'s lever exactly. The row authors the card at 24 u. At
// that size the mock slot's auto-fit shrinks the hero island to a thumbnail and the one
// comparison this route exists for is destroyed. The CELL COUNT is kept exactly (24 × 24)
// and the card is built at 5.28 u, so one grid cell is 0.22 u and every screen
// measurement transfers to 24 u by ×4.545. The SKIRT is the one number that does NOT
// scale: a sheet of card is 0.02 thick whatever it is a map of, so the lip and the keel
// stay at the row's absolute 0.012 each.
//
// THE BAKE CARRIES ONLY WASHES. Every edge the eye judges — grid, double rule, trim
// marks, roads, coastline, token rims — is `pencil.ts` line geometry, which is why the
// row's drawn state is "identical to its painted state": nothing here has a tier above
// 2 to lose. 768² over the 5.28-u card = 145 texels/unit against the row's 96, so the
// wash density transfers with headroom rather than needing it.
import * as THREE from 'three';
import * as P from '../palette.ts';
import { createTrilayer } from '../stages/trilayer.ts';
import { BOARD_WATER } from './groundKit.ts';
import { mergeStrokes } from './marksKit.ts';
import { css, hand, mark, merge, mixHex, parkSeam, put, rgba } from './plankKit.ts';

const CELLS = 24;
const CELL = 0.22;
const CARD = CELLS * CELL; // 5.28 u — the row's 24 u at ×0.22
const LIP = 0.012;
const KEEL = 0.012;
const TOP = LIP + KEEL + 0.002;

const rnd = hand(0x2f8b1);

// the row's own five wash tokens, all as two-token mixes (§11.3 — no fresh hues)
const boardWash = mixHex(P.paper, P.earth, 0.28); // #E8E0D0 t0
const boardCanopy = mixHex(P.canopy, P.paper, 0.3); // #92AD76 t2
const boardField = mixHex(P.earth, P.grass, 0.35); // #B2AC75 t2 — groundKit's FIELD_A
const boardSmudge = mixHex(boardWash, P.graphite, 0.22); // the thumb, and the corners

// ---- bakeBoardMap ---------------------------------------------------------------
// WASHES ONLY. The row is explicit that the desktop reads ~2.4 screen px per texel at
// full scale and that the answer to a soft read is FEWER, LARGER washes, never more
// texels — so every mass below is authored at ≥40 texels and there is not one mark
// under 6 texels wide anywhere on this canvas.
let boardTex: THREE.CanvasTexture | null | undefined;
function bakeBoardMap(): THREE.CanvasTexture | null {
  if (boardTex !== undefined) return boardTex;
  if (typeof document === 'undefined') return (boardTex = null);
  const size = 768;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = css(boardWash);
  ctx.fillRect(0, 0, size, size);

  // a wash is a loaded brush laid once and left: one committed pass, ragged at the
  // edge, never a gradient. `blob` is the only mark-making function on this canvas.
  const blob = (cx: number, cy: number, r: number, hex: number, a: number, lobes = 9) => {
    ctx.fillStyle = rgba(hex, a);
    ctx.beginPath();
    for (let i = 0; i <= lobes; i++) {
      const t = (i / lobes) * Math.PI * 2;
      const rr = r * (0.78 + rnd() * 0.4);
      const x = cx + Math.cos(t) * rr;
      const y = cy + Math.sin(t) * rr * 0.82;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(cx + Math.cos(t - 0.31) * rr * 1.14, cy + Math.sin(t - 0.31) * rr * 0.95, x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  // 1 · THE SEA, upper right — one wash, one tier, no gradient in it at all
  ctx.fillStyle = rgba(BOARD_WATER, 0.9);
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(size * 0.42, 0);
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    ctx.lineTo(size * (0.42 + t * 0.5 + Math.sin(t * 5.1) * 0.055), size * (t * 0.62));
  }
  ctx.lineTo(size, size * 0.66);
  ctx.closePath();
  ctx.fill();
  // the river, one committed run inland from the estuary
  ctx.strokeStyle = rgba(BOARD_WATER, 0.9);
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(size * 0.61, size * 0.3);
  ctx.bezierCurveTo(size * 0.44, size * 0.42, size * 0.4, size * 0.58, size * 0.2, size * 0.72);
  ctx.stroke();

  // 2 · THE FOREST — five overlapping canopy washes, one mass
  for (const [cx, cy, r] of [
    [0.19, 0.24, 0.115], [0.3, 0.2, 0.09], [0.13, 0.35, 0.085],
    [0.27, 0.33, 0.075], [0.38, 0.28, 0.06],
  ] as const) {
    blob(cx * size, cy * size, r * size, boardCanopy, 0.72);
  }
  // 3 · THE FIELDS — two blocks, south, one tier apart from the forest
  for (const [cx, cy, r] of [[0.55, 0.78, 0.13], [0.72, 0.86, 0.1], [0.4, 0.88, 0.085]] as const) {
    blob(cx * size, cy * size, r * size, boardField, 0.62, 7);
  }
  // 4 · THE FLAME MARKS — the row's `ember` t2, the board's one warm accent: three
  // burn marks where the story's fires were, and nothing else on this card is warm.
  for (const [cx, cy, r] of [[0.66, 0.53, 0.032], [0.24, 0.62, 0.026], [0.83, 0.4, 0.022]] as const) {
    blob(cx * size, cy * size, r * size, P.ember, 0.5, 7);
  }

  // 5 · EDGE-HANDLING WEAR, four rubbed corners, one thumb smudge — C8 at product
  // scale. The world carries erasures; the product carries fingerprints.
  for (const [cx, cy] of [[0.04, 0.04], [0.96, 0.05], [0.05, 0.96], [0.95, 0.95]] as const) {
    const g = ctx.createRadialGradient(cx * size, cy * size, 0, cx * size, cy * size, size * 0.11);
    g.addColorStop(0, rgba(boardSmudge, 0.34));
    g.addColorStop(1, rgba(boardSmudge, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx * size, cy * size, size * 0.11, 0, 6.3);
    ctx.fill();
  }
  // the four edges, rubbed where the sheet is picked up
  for (let i = 0; i < 44; i++) {
    const s = i % 4;
    const t = rnd();
    const d = rnd() * 16;
    const x = s === 0 ? t * size : s === 1 ? size - d : t * size;
    const y = s === 0 ? d : s === 1 ? t * size : s === 2 ? size - d : t * size;
    ctx.strokeStyle = rgba(boardSmudge, 0.1 + rnd() * 0.12);
    ctx.lineWidth = 6 + rnd() * 7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (s % 2 ? 0 : 26 + rnd() * 22), y + (s % 2 ? 26 + rnd() * 22 : 0));
    ctx.stroke();
  }
  // ONE thumb smudge, where a hand holds the board to turn it
  const th = ctx.createRadialGradient(size * 0.5, size * 0.965, 0, size * 0.5, size * 0.965, size * 0.07);
  th.addColorStop(0, rgba(boardSmudge, 0.4));
  th.addColorStop(1, rgba(boardSmudge, 0));
  ctx.fillStyle = th;
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.965, size * 0.07, size * 0.045, 0.2, 0, 6.3);
  ctx.fill();

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  // unmipped: the board is seen dead-on at one scale, and a mip chain on a card whose
  // whole content is washes only trades sharpness for nothing
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return (boardTex = tex);
}

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();
  const H = CARD / 2;

  // ---- the sheet -----------------------------------------------------------------
  const map = bakeBoardMap();
  const face = new THREE.PlaneGeometry(CARD, CARD, 1, 1);
  face.rotateX(-Math.PI / 2);
  const cardMat = createTrilayer({
    color: map ? 0xffffff : boardWash,
    wear: 0.24, // edge-handling wear — the one class where wear is the PRODUCT's
    ground: false, // scene, not page: the board's grid is geometry, never the shader's
    poster: 0,
    stroke: { dir: 0.02, sheet: true },
  });
  if (map) cardMat.map = map;
  const card = new THREE.Mesh(face, cardMat);
  card.position.y = TOP;
  card.receiveShadow = true;
  g.add(card);

  // the two-band micro-skirt — the board sits ON the page like everything else in this
  // film, and the difference between this and a plane is the whole of §11.5 C1 said at
  // product scale
  const lip = new THREE.Mesh(
    new THREE.BoxGeometry(CARD, LIP, CARD),
    createTrilayer({ color: P.boardFill, wear: 0.2, stroke: { dir: 0.02, sheet: true } }),
  );
  lip.position.y = KEEL + LIP / 2;
  const keel = new THREE.Mesh(
    new THREE.BoxGeometry(CARD * 0.992, KEEL, CARD * 0.992),
    createTrilayer({ color: P.caveDark, wear: 0.2, stroke: { dir: 0.02, sheet: true } }),
  );
  keel.position.y = KEEL / 2;
  g.add(lip, keel);

  // ---- the token discs -------------------------------------------------------------
  // S8's own pieces, in `dieBone` — the only objects standing ON the board, and the
  // reason the last shot is a game and not a picture.
  const y = TOP + 0.004;
  const tokens = merge(
    ([
      [-0.9, 0.7, 0.085], [-0.66, 0.94, 0.085], [-1.1, 1.02, 0.085],
      [1.24, -0.5, 0.105], [0.42, -1.35, 0.075],
    ] as const).map(([x, z, r]) =>
      put(new THREE.CylinderGeometry(r, r * 0.96, 0.03, 14), { pos: [x, y + 0.015, z] }),
    ),
  );
  const tokenMesh = new THREE.Mesh(
    tokens,
    createTrilayer({ color: P.dieBone, wear: 0.26, stroke: { dir: 0.02, sheet: true } }),
  );
  tokenMesh.castShadow = true;
  g.add(tokenMesh);

  // ---- ALL the ink, as geometry ----------------------------------------------------
  // Three merged runs, three draws: the grid at `faint`, the rules and trim at `form`,
  // and the map's own line-work at `form`. Nothing here is a shader term.
  const grid: THREE.Vector3[][] = [];
  for (let i = 0; i <= CELLS; i++) {
    const t = -H + i * CELL;
    const j = () => (rnd() - 0.5) * 0.004; // a ruled line drawn by a hand still wobbles
    grid.push([new THREE.Vector3(t + j(), y, -H), new THREE.Vector3(t + j(), y, H)]);
    grid.push([new THREE.Vector3(-H, y, t + j()), new THREE.Vector3(H, y, t + j())]);
  }
  g.add(mergeStrokes(grid.map((run) => mark(run, P.graphiteLight, 'faint'))));

  // the double rule, inset 0.55 u at the row's scale = 0.121 u here, plus the four
  // corner trim marks a printed sheet carries outside its own rule
  const rules: THREE.Vector3[][] = [];
  for (const inset of [0.121, 0.148]) {
    const r = H - inset;
    rules.push([
      new THREE.Vector3(-r, y, -r), new THREE.Vector3(r, y, -r),
      new THREE.Vector3(r, y, r), new THREE.Vector3(-r, y, r), new THREE.Vector3(-r, y, -r),
    ]);
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * (H - 0.055);
      const cz = sz * (H - 0.055);
      rules.push([new THREE.Vector3(cx - sx * 0.075, y, cz), new THREE.Vector3(cx, y, cz)]);
      rules.push([new THREE.Vector3(cx, y, cz - sz * 0.075), new THREE.Vector3(cx, y, cz)]);
    }
  }
  g.add(mergeStrokes(rules.map((run) => mark(run, P.ink, 'form'))));

  // the map's own line-work: the coastline the sea wash stops at, two roads, and a rim
  // around every token. The washes are soft; these are the edges the eye actually
  // judges, which is the row's whole argument for a 96-texel bake being enough.
  const ink: THREE.Vector3[][] = [];
  {
    const coast: THREE.Vector3[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      coast.push(new THREE.Vector3(
        (-0.08 + t * 0.5 + Math.sin(t * 5.1) * 0.055) * CARD,
        y,
        (-0.5 + t * 0.62) * CARD,
      ));
    }
    ink.push(coast);
    ink.push([
      new THREE.Vector3(-H * 0.86, y, H * 0.5),
      new THREE.Vector3(-H * 0.2, y, H * 0.22),
      new THREE.Vector3(0.32 * H, y, -0.1 * H),
      new THREE.Vector3(0.78 * H, y, -0.42 * H),
    ]);
    ink.push([
      new THREE.Vector3(-H * 0.1, y, H * 0.9),
      new THREE.Vector3(0.1 * H, y, H * 0.3),
      new THREE.Vector3(-0.05 * H, y, -0.24 * H),
    ]);
    for (const [x, z, r] of [
      [-0.9, 0.7, 0.085], [-0.66, 0.94, 0.085], [-1.1, 1.02, 0.085],
      [1.24, -0.5, 0.105], [0.42, -1.35, 0.075],
    ] as const) {
      const ring: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ring.push(new THREE.Vector3(x + Math.cos(a) * r * 1.06, y + 0.032, z + Math.sin(a) * r * 1.06));
      }
      ink.push(ring);
    }
  }
  g.add(mergeStrokes(ink.map((run) => mark(run, P.graphiteDark, 'form'))));

  return parkSeam(g);
}

// ponytail: no pentimenti. The world carries erasures — the product does not, and the
// row says so in one clause. Nothing here is half-drawn, nothing is unfinished, and the
// rim contour has no authored gap: this is the ONE object in the film that is done.
