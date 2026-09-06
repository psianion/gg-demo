// MOCK — Plank / carpentry. Art bible §11.2, row 8.
//
//   ?mock=plank · &rig=prep · &zoom=1..6
//
// THE ROW, built: boards extruded INDIVIDUALLY with real gaps and butt joints
// staggered across three z-lines; the stage disc is 24 radial wedge planks at 0.012 u
// gaps with two alternating lengths so the outer joint ring is not one circle; all
// merged. `sheet: true`, `dir` PER MERGED MESH ONCE — 0.06 for the radial floor, 1.42
// for boards. poster 0. `bakePlank` 512² tiling @ 2 u = 256 tex/u, UV'd so `v` runs
// along each board's own length. plankLit t2 · plank t3 · plankShade t4; floor
// floorLit t2 · floorboard t3 · floorShade t4. Drawn: `boxMarks()` 12-edge
// construction, strap lines, end-arcs — carpentry keeps its ruled silhouette and the
// paint supplies all the tone.
//
// The carpentry the task names is all here: signpost · door · chest · bench · table,
// plus the disc and a deck of staggered boards.
//
// SCREEN ARITHMETIC: at the route's ~130 px/u a 0.012-u gap is 1.6 screen px — a
// hairline dark, which is exactly what a butt joint is and why the gaps are ABSOLUTE
// and never scale with the prop. The 512² tile at 2 u is 256 tex/u; a 7–14-texel grain
// streak is 2.7–5.5 px, over the 2 px floor at both ends.
//
// TWO CORRECTIONS TO THE ROW, both reported in MOCK-3.md:
//  1. The disc is built at r 1.150 / 1.127, not r 7.00 / 6.86 — see DISC_R.
//  2. `bakePlank`'s base is WHITE, not a colour: the grain multiplies whatever token
//     the material carries, so ONE 512² serves all six plank tokens instead of six
//     bakes. Row 17 already uses this lever for the sky sheet.
import * as THREE from 'three';
import { createTrilayer } from '../stages/trilayer.ts';
import { propGround } from './groundKit.ts';
import { plank, floorboard, flameCore, timberDark, caveDark, ink, graphite } from '../palette.ts';
import { bakePlankTints, boxRun, buildDoor, buildSignpost, hand, mark, merge, mixHex, parkSeam, put, VIEW_CAM } from './plankKit.ts';

const rnd = hand(0x40d1);

// the six committed tokens, tier-ordered — 2/3/4 twice over, never two adjacent
// surfaces of one object in the same underdrawing band (C5)
const T = {
  plankLit: mixHex(plank, flameCore, 0.3), // #C0A881 t2
  plank, // #A9895E t3
  plankShade: mixHex(plank, timberDark, 0.55), // #866A49 t4
  floorLit: mixHex(floorboard, flameCore, 0.3), // #CCAB78 t2
  floorboard, // #B98E52 t3
  floorShade: mixHex(floorboard, caveDark, 0.45), // #82653E t4
};
type Tok = keyof typeof T;
const TOKS = Object.keys(T) as Tok[];
const NBLOCK = TOKS.length;
const TOKI = Object.fromEntries(TOKS.map((t, i) => [t, i])) as Record<Tok, number>;

/**
 * ============ FIX ROUND — ITEM 31: NINE MATERIALS TO TWO ====================
 *
 * "Collapse nine materials to two via three tint blocks in bakePlank, UV-selected
 * (MOCK-3's own recommendation, not built)." Six tokens across two stroke directions is
 * nine live buckets; both  and  are per-material uniforms, so the
 * only bucket that can be collapsed is the colour one — and it collapses by moving the
 * tint into the tile.  is the whole mechanism: a geometry arrives with u already
 * running ALONG the board (tiling) and v running 0..1 ACROSS it, and this maps that v
 * into its own token's 85-texel block with a guard band a bilinear tap cannot cross.
 *
 * What is left is exactly two materials, one per direction — the row's own budget.
 */
const blockV = (geom: THREE.BufferGeometry, tok: Tok): THREE.BufferGeometry => {
  const uv = geom.getAttribute('uv') as THREE.BufferAttribute;
  const inset = 4 / 512;
  const b = TOKI[tok];
  for (let i = 0; i < uv.count; i++) {
    const v = Math.min(1, Math.max(0, uv.getY(i)));
    uv.setXY(i, uv.getX(i), v * (1 / NBLOCK - inset * 2) + b / NBLOCK + inset);
  }
  uv.needsUpdate = true;
  return geom;
};

// The whole class's disc radius. The row authors it at r 7.00 with a 6.86 alternate;
// at that size the disc alone is 14 u and the mockup route's auto-fit shrinks the hero
// island to a thumbnail, which destroys the one comparison this route exists for. The
// RATIO is kept exactly (6.86/7.00 = 0.980) and the GAP is kept ABSOLUTE at 0.012 u,
// so every screen measurement — joint width, wedge count, the broken outer ring —
// transfers unchanged to r 7.
const DISC_R = 1.15;
const DISC_ALT = DISC_R * 0.98;
const GAP = 0.012;

// THE LAYOUT. First walk: the door stood in front of the disc, the bench sat inside
// the table and the signpost hid behind the leaf — six good props reading as one pile.
// Everything is now on its own ground, spread across ~5.4 u, which is the mock slot.
// SECOND WALK: separating in Z does not separate anything — the shot's azimuth is 18°
// and the camera sits at −z, so a low z is NEARER and a 1.9-u door at z −1.35 stood
// squarely in front of a disc at z +1.5. Props are separated in X, with only the flat
// ones allowed behind a tall one.
const DISC_C = new THREE.Vector3(-2.3, 0, 0.7);
const DOOR_C = new THREE.Vector3(-0.9, 0, -1.8);
const TABLE_C = new THREE.Vector3(0.55, 0, -0.3);
const DECK_C = new THREE.Vector3(1.85, 0, 1.15);
const CHEST_C = new THREE.Vector3(2.15, 0, -1.2);
const SIGN_C = new THREE.Vector3(-2.35, 0, -1.6);

export function buildMock(): THREE.Object3D {
  const g = new THREE.Group();

  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class now builds the ordinary ground
  // card under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  g.add(propGround(3.6, 2.6, [[-2.3,0.7,204,0.26],[-0.9,-1.8,90,0.28],[0.55,-0.3,102,0.26],[1.85,1.15,120,0.24],[2.15,-1.2,84,0.28],[-2.35,-1.6,42,0.26]]));
  // ONE tile, six tint blocks — see blockV above
  const grain = bakePlankTints(TOKS.map((t) => T[t]));
  // dir is a property of the merged MESH, so a token that appears in both the radial
  // floor and the upright carpentry needs one bucket per direction
  const buckets = new Map<number, THREE.BufferGeometry[]>();
  // the TOKEN no longer opens a bucket — it is in the UV now. Only the direction does.
  const add = (tok: Tok, dir: number, geom: THREE.BufferGeometry) => {
    (buckets.get(dir) ?? buckets.set(dir, []).get(dir)!).push(blockV(geom, tok));
  };
  const runs = new THREE.Group();

  // one board: a real solid with real thickness, UV'd so v runs along its own length
  // u runs ALONG the board and tiles at the class's 2-u repeat; v runs ACROSS it and
  // stays 0..1 so  can put it in the token's block. BoxGeometry hands u along x
  // and v along z on the face that matters, so the two are swapped here.
  const board = (w: number, th: number, len: number, p: Parameters<typeof put>[1]) => {
    const geom = new THREE.BoxGeometry(w, th, len);
    const uv = geom.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * (len / 2), uv.getX(i));
    uv.needsUpdate = true;
    return put(geom, p);
  };

  // ---- 1 · the stage disc: 24 radial wedge planks -----------------------------
  // Two alternating lengths, so the outer joint ring is a broken ring and not one
  // drawn circle — the single detail that stops a turned disc reading as a lathe part.
  const step = (Math.PI * 2) / 24;
  const discTier: Tok[] = ['floorboard', 'floorboard', 'floorLit', 'floorboard', 'floorShade', 'floorboard'];
  // AT 6× THE FIRST DISC FAILED, and only at 6×: a `CylinderGeometry` sector's sides
  // are RADIAL, so a constant angular inset is a constant-angle gap — 0 u at the hub
  // and 0.022 u at the rim. Twenty-four of those read as WHITE SPOKES converging on a
  // starburst, which is a fan, not a floor. A real radial plank floor has a constant
  // KERF: the boards are cut as wedges but the saw takes the same 0.012 u at every
  // radius. So each wedge is an authored trapezoid whose two long sides are offset
  // laterally by GAP/2, and the hub is covered by the capstan collar so the joints
  // never have to converge at all.
  const HUB = 0.3;
  for (let i = 0; i < 24; i++) {
    const rOut = i % 2 ? DISC_ALT : DISC_R;
    const half = (r: number) => Math.max(0.004, r * Math.tan(step / 2) - GAP / 2);
    const s = new THREE.Shape();
    s.moveTo(HUB, -half(HUB));
    s.lineTo(rOut, -half(rOut));
    s.lineTo(rOut, half(rOut));
    s.lineTo(HUB, half(HUB));
    s.closePath();
    const w = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false });
    // v runs along the board's own length — outward, which is the grain of a radial
    // plank — at the class's 256 tex/u
    const uv = w.getAttribute('uv');
    // ExtrudeGeometry hands back the SHAPE coordinates as uv, so u is the radius and
    // v is the half-width — which runs the grain ACROSS the board and drew the disc as
    // concentric arcs at 6x. Swapped, so v is the radius: the grain runs out along each
    // plank, which is what the row means by "v runs along each board own length".
    // u is the RADIUS and tiles at the 2-u repeat; v is the wedge's own normalised
    // half-width, which  then puts in the token's block. A wedge's half-width
    // grows with radius, so the normalisation has to be evaluated per vertex or the
    // grain fans out toward the rim.
    for (let k = 0; k < uv.count; k++) {
      const rr = uv.getX(k);
      const hw = Math.max(0.004, rr * Math.tan(step / 2) - GAP / 2);
      uv.setXY(k, rr / 2, Math.min(1, Math.max(0, 0.5 + uv.getY(k) / (2 * hw))));
    }
    uv.needsUpdate = true;
    add(discTier[i % 6], 0.06, put(w, { pos: [DISC_C.x, 0.09, DISC_C.z], rot: [Math.PI / 2, 0, -(i + 0.5) * step] }));
  }
  // and a SUBFLOOR: at 6x the kerf let the page show straight through the deck at the
  // front of the disc — a floor you can see the sky through. One plate under the
  // wedges, in the same bucket, so it costs nothing.
  add('floorShade', 0.06, put(new THREE.CylinderGeometry(DISC_ALT - 0.03, DISC_ALT - 0.03, 0.03, 28), { pos: [DISC_C.x, 0.075, DISC_C.z] }));
  // the hub the joints die into — a turned collar, the one true circle on the disc
  add('floorShade', 0.06, put(new THREE.CylinderGeometry(HUB + 0.02, HUB + 0.02, 0.075, 20), { pos: [DISC_C.x, 0.038, DISC_C.z] }));
  // THE BROKEN OUTER RING. The first walk drew it as one continuous circle at 1.0 × R
  // and undid the whole point of the two alternating lengths — a lathe part again. It
  // is now twenty-four short arcs, each at ITS OWN wedge's radius, chained into one
  // run: the 0.023-u radial step between neighbours is 3 screen px, which is the
  // stepped joint the row asks for, drawn instead of implied.
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 24; i++) {
      const r = (i % 2 ? DISC_ALT : DISC_R) * 1.005;
      for (let k = 0; k <= 3; k++) {
        const a = (i + k / 3) * step;
        const j = 1 + (rnd() - 0.5) * 0.012;
        pts.push(new THREE.Vector3(DISC_C.x + Math.cos(a) * r * j, 0.064, DISC_C.z + Math.sin(a) * r * j));
      }
    }
    runs.add(mark(pts, ink, 'form'));
  }
  // THE DISC'S JOINT COMB. Under the curtain a 0.012-u kerf is gone and the disc came
  // back as one flat grey ellipse — the same failure the deck and the door had, so it
  // takes the same answer: the joint is DRAWN as well as cut. Twenty-four radial runs,
  // out and back, in one polyline; the carry-overs land on the rim ring and the collar,
  // which are both already ink.
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 24; i++) {
      const a = i * step;
      const rOut = (i % 2 ? DISC_ALT : DISC_R) * 0.985;
      const [r0, r1] = i % 2 ? [rOut, HUB + 0.03] : [HUB + 0.03, rOut];
      pts.push(
        new THREE.Vector3(DISC_C.x + Math.cos(a) * r0, 0.126, DISC_C.z + Math.sin(a) * r0),
        new THREE.Vector3(DISC_C.x + Math.cos(a) * r1, 0.126, DISC_C.z + Math.sin(a) * r1),
      );
    }
    runs.add(mark(pts, ink, 'form'));
  }
  // the capstan collar's double rule — two committed circles, the only true circles on
  // the disc, because a turned collar IS one
  for (const [rr, hex, w] of [[0.34, ink, 'form'], [0.29, graphite, 'faint']] as const) {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 30; k++) {
      const a = (k / 30) * Math.PI * 2;
      const j = 1 + (rnd() - 0.5) * 0.02;
      pts.push(new THREE.Vector3(DISC_C.x + Math.cos(a) * DISC_R * rr * j, 0.064, DISC_C.z + Math.sin(a) * DISC_R * rr * j));
    }
    runs.add(mark(pts, hex, w));
  }

  // ---- 2 · the deck: butt joints staggered across THREE z-lines ---------------
  // Six boards across, each cut at a different z so no two neighbours break together.
  const JOINT = [0.0, 0.42, -0.36]; // the three z-lines
  const deckX = (i: number) => DECK_C.x + (i - 2.5) * (0.27 + GAP);
  for (let i = 0; i < 6; i++) {
    const jz = JOINT[i % 3];
    const tok: Tok = i % 3 === 1 ? 'floorLit' : i % 4 === 3 ? 'floorShade' : 'floorboard';
    // two boards per run, butted at jz — a real joint, not a drawn line
    for (const [z0, z1] of [[-0.72, jz - GAP / 2], [jz + GAP / 2, 0.72]] as const) {
      const len = z1 - z0;
      if (len < 0.08) continue;
      add(tok, 1.42, board(0.27, 0.05, len, { pos: [deckX(i), 0.025, DECK_C.z + (z0 + z1) / 2] }));
    }
  }
  // THE JOINT COMB. A 0.012-u gap is 1.6 screen px at the film's figure floor and it
  // vanishes outright on the drawn side, where the boards fused into one grey slab on
  // the first walk. So the joint is DRAWN as well as built — the same answer row 16
  // gives for stacked paper ("an ink rule line, never a tone fill"). One boustrophedon
  // run carries all five joints AND the six sawn ends: down a joint, along the end,
  // up the next. 1 draw.
  {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 5; i++) {
      const x = deckX(i) + (0.27 + GAP) / 2;
      const [a, b] = i % 2 ? [0.72, -0.72] : [-0.72, 0.72];
      pts.push(
        new THREE.Vector3(x, 0.052, DECK_C.z + a).addScaledVector(VIEW_CAM, 0.05),
        new THREE.Vector3(x, 0.052, DECK_C.z + b).addScaledVector(VIEW_CAM, 0.05),
      );
      if (i < 4) pts.push(new THREE.Vector3(deckX(i + 1) + (0.27 + GAP) / 2, 0.052, DECK_C.z + b).addScaledVector(VIEW_CAM, 0.05));
    }
    runs.add(mark(pts, ink, 'form'));
  }

  // ---- 3 · the door: ported to plankKit.ts's buildDoor() (RULING 4, W5a-node) -
  // Same 5 boards + frame + 2 straps, same GAP/tiers/dir/wear as before; buildDoor is
  // self-contained (its own merged mesh(es) + its own marks group), so it is added
  // straight into the route group rather than through this file's `add`/`runs` buckets.
  g.add(buildDoor({ center: DOOR_C }));

  // ---- 4 · the chest ----------------------------------------------------------
  const chest = CHEST_C;
  for (const [w, h, d, x, y, z, tok] of [
    [0.66, 0.34, 0.05, 0, 0.2, -0.21, 'plank'], // front
    [0.66, 0.34, 0.05, 0, 0.2, 0.21, 'plankShade'], // back
    [0.05, 0.34, 0.38, -0.31, 0.2, 0, 'plankShade'], // ends
    [0.05, 0.34, 0.38, 0.31, 0.2, 0, 'plankShade'],
    [0.68, 0.05, 0.42, 0, 0.05, 0, 'plankShade'], // floor
    [0.33, 0.07, 0.44, -0.17, 0.41, 0, 'plankLit'], // the lid, TWO boards with a gap
    [0.33, 0.07, 0.44, 0.17, 0.41, 0, 'plank'],
  ] as const) {
    add(tok, 1.42, board(w, h, d, { pos: [chest.x + x, y, chest.z + z] }));
  }
  runs.add(mark(boxRun(0.68, 0.4, 0.44, new THREE.Vector3(chest.x, 0.24, chest.z)), ink, 'form'));

  // ---- 5 · the table and its bench -------------------------------------------
  const tbl = TABLE_C;
  for (let i = 0; i < 3; i++) {
    const tok: Tok = i === 1 ? 'plank' : 'plankLit';
    add(tok, 1.42, board(0.3, 0.055, 1.0, { pos: [tbl.x + (i - 1) * (0.3 + GAP), 0.62, tbl.z] }));
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    add('plankShade', 1.42, board(0.07, 0.6, 0.07, { pos: [tbl.x + sx * 0.42, 0.3, tbl.z + sz * 0.42] }));
  }
  runs.add(mark(boxRun(0.92, 0.055, 1.0, new THREE.Vector3(tbl.x, 0.62, tbl.z)), ink, 'form'));
  // the bench, pulled out from the table — two boards on two slab legs
  for (let i = 0; i < 2; i++) {
    add(i ? 'plank' : 'plankLit', 1.42, board(0.16, 0.05, 0.86, { pos: [tbl.x - 0.78 + (i - 0.5) * (0.16 + GAP), 0.36, tbl.z] }));
  }
  for (const sz of [-1, 1] as const) {
    add('plankShade', 1.42, board(0.2, 0.34, 0.05, { pos: [tbl.x - 0.78, 0.17, tbl.z + sz * 0.33] }));
  }

  // ---- 6 · the signpost: ported to plankKit.ts's buildSignpost() (RULING 4, W5a-node)
  // Row 16 files signpost BOARDS under paper props; the POST and the arrow blank are
  // carpentry, and this is the seam between the two rows (reported in MOCK-3.md). Same
  // post + 2 boards as before; self-contained like buildDoor, so added straight in.
  g.add(buildSignpost({ center: SIGN_C }));

  // ---- merge: one geometry per token per direction ----------------------------
  for (const [dir, list] of buckets) {
    const mat = createTrilayer({
      color: grain ? 0xffffff : T.plank,
      wear: 0.24,
      stroke: { dir, sheet: true },
    });
    if (grain) mat.map = grain;
    const mesh = new THREE.Mesh(merge(list), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  g.add(runs);
  return parkSeam(g);
}
