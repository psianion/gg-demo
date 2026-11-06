import * as THREE from 'three';
import { sketch, polyline, curveLine, paint, fillMaterial, roughen } from '../hero/film/pencil.ts';
import { type Art, ACCENT, Pen, rng, disposeTree, basis, ring, v3, clamp01, type Basis } from './draw.ts';
import { buildD20 } from './d20.ts';

// The DM's room, Beat 4. Scale is "island-on-screen": the laptop screen is 2.9 wide
// (16:10), the table r = 6 with its top at TABLE_TOP. The builder sets the final
// scale. Everything rests on y = 0 at its footprint centre; table props are authored
// for the table top (place them at y = TABLE_TOP when on the table).
export const TABLE_R = 6;
export const TABLE_TOP = 7.5;

/** Two silhouette strokes of an upright round form in the view plane (cylinder sides). */
function sides(b: Basis, r: number, y0: number, y1: number, r1 = r, w: 'form' | 'faint' = 'form', at = v3(0, 0, 0)) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    g.add(
      polyline(
        [v3(at.x, y0, at.z).addScaledVector(b.right, s * r), v3(at.x, y1, at.z).addScaledVector(b.right, s * r1)],
        w,
      ),
    );
  }
  return g;
}

// ---- table ----------------------------------------------------------------
export interface Table extends Art {
  topY: number;
}

export function buildTable(view?: THREE.Vector3): Table {
  const b = basis(view);
  const rand = rng(601);
  const root = new THREE.Group();
  const T = 0.35; // slab thickness
  const slab = paint(
    new THREE.Mesh(new THREE.CylinderGeometry(TABLE_R, TABLE_R, T, 48).translate(0, TABLE_TOP - T / 2, 0), fillMaterial),
    { fill: ACCENT.wood },
  );
  const rimTop = polyline(ring(TABLE_R, TABLE_R, TABLE_TOP + 0.005, 64, 0, Math.PI * 2, rand, 0.01), 'hero');
  const rimBot = polyline(ring(TABLE_R, TABLE_R, TABLE_TOP - T, 64, 0, Math.PI * 2, rand, 0.01), 'form');
  const edge = sides(b, TABLE_R, TABLE_TOP - T, TABLE_TOP);

  // legs: four turned posts under the apron
  const legs = new THREE.Group();
  const legFills: THREE.Object3D[] = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const at = v3(Math.cos(a) * TABLE_R * 0.62, 0, Math.sin(a) * TABLE_R * 0.62);
    const m = paint(
      new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, TABLE_TOP - T, 10).translate(at.x, (TABLE_TOP - T) / 2, at.z), fillMaterial),
      { fill: ACCENT.wood },
    );
    legFills.push(m);
    legs.add(m, sides(b, 0.2, 0, TABLE_TOP - T, 0.28, 'form', at));
  }

  // grain: long, loose arcs across the top
  const grain = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const z = -TABLE_R * 0.8 + (i / 8) * TABLE_R * 1.6 + (rand() - 0.5) * 0.3;
    const half = Math.sqrt(Math.max(0, TABLE_R * TABLE_R - z * z)) * (0.55 + rand() * 0.3);
    const x0 = -half + rand() * 0.5;
    const pts = [];
    for (let k = 0; k <= 5; k++) {
      const x = x0 + ((half * 2 - 0.5) * k) / 5;
      pts.push(v3(x, TABLE_TOP + 0.006, z + Math.sin(k * 1.3 + i) * 0.12));
    }
    grain.add(curveLine(pts, 'faint', 16));
  }
  root.add(slab, rimTop, rimBot, edge, legs, grain);

  const pen = new Pen();
  pen.at(slab, 0, 0.3);
  pen.at(rimTop, 0, 0.35);
  pen.seq([edge, rimBot], 0.3, 0.5);
  for (const f of legFills) pen.at(f, 0.5, 0.75);
  pen.at(legs, 0.5, 0.75);
  pen.at(grain, 0.72, 1);
  pen.reveal(0);
  return { root, topY: TABLE_TOP, reveal: (p) => pen.reveal(p), dispose: () => disposeTree(root) };
}

// ---- laptop ---------------------------------------------------------------
// Base 3.2 × 2.2, lid hinged at the back, tilted 15° back. `screen` is a 16:10 plane
// (UVs 0..1) on the lid's face, facing +z — put the island's render target on its map.
// setBezel(0..1): at 0 the lid is exactly the screen (the grid backdrop has edges and
// nothing else); by 1 the bezel has grown out to the full lid.
export const SCREEN_W = 2.9;
export const SCREEN_H = SCREEN_W / 1.6;

export interface Laptop extends Art {
  screen: THREE.Mesh;
  setBezel(b: number): void;
}

export function buildLaptop(): Laptop {
  const root = new THREE.Group();
  const W = 3.2;
  const D = 2.2;
  const H = 0.12;
  const base = sketch(new THREE.BoxGeometry(W, H, D).translate(0, H / 2, 0), 25, 'form');

  // keyboard: a recessed field of key rows, and a trackpad
  const keys = new THREE.Group();
  const kx = W * 0.42;
  const kz0 = -D / 2 + 0.22;
  const kz1 = kz0 + 0.95;
  const y = H + 0.004;
  keys.add(polyline([v3(-kx, y, kz0), v3(kx, y, kz0), v3(kx, y, kz1), v3(-kx, y, kz1)], 'faint', true));
  for (let r = 1; r < 5; r++) {
    const z = kz0 + ((kz1 - kz0) * r) / 5;
    keys.add(polyline([v3(-kx, y, z), v3(kx, y, z)], 'faint'));
  }
  for (let r = 0; r < 5; r++) {
    const za = kz0 + ((kz1 - kz0) * r) / 5;
    const zb = kz0 + ((kz1 - kz0) * (r + 1)) / 5;
    // key gaps, each row staggered; the front row is the space bar's two ends
    const xs = r === 4 ? [-0.7, 0.7] : Array.from({ length: 11 }, (_, c) => -kx + ((2 * kx) * (c + 1)) / 12 + (r % 2) * 0.05);
    for (const x of xs) keys.add(polyline([v3(x, y, za), v3(x, y, zb)], 'faint'));
  }
  const pad = polyline(
    [v3(-0.5, y, kz1 + 0.15), v3(0.5, y, kz1 + 0.15), v3(0.5, y, kz1 + 0.75), v3(-0.5, y, kz1 + 0.75)],
    'faint',
    true,
  );

  // lid
  const LH = 2.15;
  const LT = 0.07;
  const lid = new THREE.Group();
  lid.position.set(0, H, -D / 2 + LT / 2);
  lid.rotation.x = -0.26;
  const scrY = 0.1 + SCREEN_H / 2 + 0.04; // screen centre up the lid (bigger chin at the hinge)
  const frame = new THREE.Group(); // scales about the screen centre for setBezel
  frame.position.y = scrY;
  const lidSolid = sketch(new THREE.BoxGeometry(W, LH, LT).translate(0, LH / 2 - scrY, 0), 25, 'form');
  frame.add(lidSolid);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
    new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
  );
  screen.position.set(0, scrY, LT / 2 + 0.004);
  const hw = SCREEN_W / 2;
  const hh = SCREEN_H / 2;
  const zs = LT / 2 + 0.008;
  const screenEdge = polyline(
    [v3(-hw, scrY - hh, zs), v3(hw, scrY - hh, zs), v3(hw, scrY + hh, zs), v3(-hw, scrY + hh, zs)],
    'form',
    true,
  );
  lid.add(frame, screen, screenEdge);
  root.add(base, keys, pad, lid);

  const sx0 = SCREEN_W / W;
  const sy0 = SCREEN_H / LH;
  function setBezel(bz: number) {
    const q = clamp01(bz);
    frame.visible = q > 0.001;
    frame.scale.set(sx0 + (1 - sx0) * q, sy0 + (1 - sy0) * q, 1);
  }

  const pen = new Pen();
  pen.at(screen, 0, 0.01);
  pen.at(screenEdge, 0, 0.25);
  pen.at(frame, 0.2, 0.45);
  pen.at(base, 0.4, 0.7);
  pen.seq([keys, pad], 0.65, 1);
  const material = screen.material as THREE.Material;
  setBezel(1);
  pen.reveal(0);
  return {
    root,
    screen,
    setBezel,
    // the pen drives lidSolid's own visibility; setBezel drives its parent `frame`
    reveal: (p) => pen.reveal(p),
    dispose: () => disposeTree(root, [material]),
  };
}

// ---- lamp -----------------------------------------------------------------
// One warm lamp: a brass desk lamp, ~3.2 tall, shade over the table. `bulb` is the
// local position for the builder's point light.
export interface Lamp extends Art {
  bulb: THREE.Vector3;
}

export function buildLamp(view?: THREE.Vector3): Lamp {
  const b = basis(view);
  const rand = rng(707);
  const root = new THREE.Group();
  const baseFill = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.16, 24).translate(0, 0.08, 0), fillMaterial);
  const baseLines = new THREE.Group();
  baseLines.add(
    polyline(ring(0.65, 0.65, 0.0, 24, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(0.55, 0.55, 0.16, 22, 0, Math.PI * 2, rand), 'form'),
    sides(b, 0.65, 0, 0.16, 0.55),
  );
  // stem: up and over, a gentle swan neck
  const stemPts = [v3(0, 0.16, 0), v3(0.05, 1.2, -0.05), v3(0.25, 2.4, 0.05), v3(0.85, 2.95, 0.25), v3(1.35, 2.85, 0.4)];
  const stem = new THREE.Group();
  stem.add(curveLine(stemPts, 'form', 24), curveLine(stemPts.map((p) => p.clone().add(v3(0.05, 0, 0))), 'faint', 24));

  // shade: an open cone hanging from the end of the neck, tipped toward the table
  const shade = new THREE.Group();
  shade.position.set(1.5, 2.75, 0.45);
  shade.rotation.z = -0.35;
  const shadeFill = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.62, 0.7, 24, 1, true).translate(0, -0.35, 0), fillMaterial);
  const shadeLines = new THREE.Group();
  shadeLines.add(
    polyline(ring(0.62, 0.62, -0.7, 26, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(0.18, 0.18, 0, 14, 0, Math.PI * 2, rand), 'form'),
    sides(b, 0.62, -0.7, 0, 0.18),
    polyline(ring(0.5, 0.5, -0.55, 22, 0, Math.PI * 2, rand), 'faint'),
  );
  paint(shadeLines, { line: ACCENT.brass });
  const bulbAt = v3(0, -0.6, 0);
  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 8),
    new THREE.MeshBasicMaterial({ color: ACCENT.glow, toneMapped: false }),
  );
  bulbMesh.position.copy(bulbAt);
  shade.add(shadeFill, shadeLines, bulbMesh);
  root.add(baseFill, baseLines, stem, shade);
  root.updateMatrixWorld(true);
  const bulb = shade.localToWorld(bulbAt.clone());

  const pen = new Pen();
  pen.at(baseFill, 0, 0.3);
  pen.at(baseLines, 0, 0.3);
  pen.at(stem, 0.25, 0.6);
  pen.at(shadeFill, 0.55, 0.9);
  pen.at(shadeLines, 0.55, 0.9);
  pen.at(bulbMesh, 0.9, 1);
  pen.reveal(0);
  return { root, bulb, reveal: (p) => pen.reveal(p), dispose: () => disposeTree(root, [bulbMesh.material]) };
}

// ---- clutter --------------------------------------------------------------
// The table-top spread, authored for y = 0 = table top, centred on the table, clear of
// the laptop's 3.2 × 2.2 footprint (+ lid) in the middle: dice, a d20, a pencil, a
// snack bowl, two character sheets and a mug. The DM sits at +z.
export function buildTableClutter(): Art {
  const b = basis();
  const rand = rng(808);
  const root = new THREE.Group();
  const pen = new Pen();
  const parts: THREE.Object3D[] = [];

  // character sheets: paper lying flat, a title stroke and lines of scribble
  for (const [x, z, ry] of [[-3.3, -3.6, 0.35], [3.9, -1.2, -0.55]] as const) {
    const sheet = new THREE.Group();
    const w = 1.1;
    const h = 1.5;
    const p = sketch(new THREE.BoxGeometry(w, 0.01, h).translate(0, 0.005, 0), 25, 'form');
    sheet.add(p);
    sheet.add(polyline([v3(-w * 0.38, 0.012, -h * 0.4), v3(w * 0.1, 0.012, -h * 0.4)], 'form'));
    for (let i = 0; i < 9; i++) {
      const zz = -h * 0.28 + i * h * 0.075;
      const len = w * (0.5 + rand() * 0.3);
      const pts = [];
      for (let k = 0; k <= 6; k++) pts.push(v3(-w * 0.4 + (len * k) / 6, 0.012, zz + (rand() - 0.5) * 0.015));
      sheet.add(polyline(pts, 'faint'));
    }
    sheet.position.set(x, 0, z);
    sheet.rotation.y = ry;
    parts.push(sheet);
  }

  // two d6
  for (const [x, z, ry] of [[-2.8, -2.4, 0.4], [-2.2, -3.0, -0.3]] as const) {
    const s = 0.34;
    const d6 = sketch(new THREE.BoxGeometry(s, s, s).translate(0, s / 2, 0), 25, 'form');
    // pips on the top face
    const pips = new THREE.Group();
    for (const [px, pz] of [[-0.09, -0.09], [0, 0], [0.09, 0.09]]) {
      pips.add(polyline(ring(0.025, 0.025, s + 0.004, 6).map((q) => q.add(v3(px, 0, pz))), 'faint', true));
    }
    d6.add(pips);
    d6.position.set(x, 0, z);
    d6.rotation.y = ry;
    parts.push(d6);
  }

  // pencil: a long hexagonal stick lying down, sharpened tip
  const pencilG = new THREE.Group();
  const pl = 1.7;
  const pencilBody = sketch(new THREE.CylinderGeometry(0.06, 0.06, pl, 6).rotateZ(Math.PI / 2).translate(0, 0.06, 0), 25, 'form');
  const tipCone = sketch(new THREE.ConeGeometry(0.06, 0.22, 6).rotateZ(-Math.PI / 2).translate(pl / 2 + 0.11, 0.06, 0), 25, 'form');
  pencilG.add(pencilBody, tipCone);
  pencilG.position.set(3.4, 0, 1.4);
  pencilG.rotation.y = 0.5;
  parts.push(pencilG);

  // snack bowl with a heap of chips
  const bowl = new THREE.Group();
  const bowlFill = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1, 0.6, 1).translate(0, 0.39, 0),
    fillMaterial,
  );
  bowl.add(
    bowlFill,
    polyline(ring(0.65, 0.65, 0.39, 28, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(0.3, 0.3, 0.005, 16, 0, Math.PI * 2, rand), 'faint'),
    curveLine(
      [v3(0, 0.39, 0).addScaledVector(b.right, -0.65), v3(0, 0.1, 0).addScaledVector(b.right, -0.4), v3(0, 0.02, 0),
        v3(0, 0.1, 0).addScaledVector(b.right, 0.4), v3(0, 0.39, 0).addScaledVector(b.right, 0.65)].map((p) => p.addScaledVector(b.view, 0.2)),
      'form',
      14,
    ),
  );
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const rr = rand() * 0.42;
    const c = v3(Math.cos(a) * rr, 0.42 + rand() * 0.08, Math.sin(a) * rr);
    const chip = [];
    for (let k = 0; k <= 5; k++) {
      const t = (k / 5) * Math.PI * 2;
      chip.push(c.clone().add(v3(Math.cos(t) * 0.09 * (0.8 + rand() * 0.4), (rand() - 0.5) * 0.03, Math.sin(t) * 0.07)));
    }
    bowl.add(polyline(chip, 'faint', true));
  }
  bowl.position.set(-4.3, 0, 0.6);
  parts.push(bowl);

  // mug
  const mug = new THREE.Group();
  const mugFill = new THREE.Mesh(roughen(new THREE.CylinderGeometry(0.3, 0.28, 0.55, 16).translate(0, 0.275, 0), 0.006, 5, 2), fillMaterial);
  mug.add(
    mugFill,
    polyline(ring(0.3, 0.3, 0.55, 18, 0, Math.PI * 2, rand), 'form'),
    polyline(ring(0.25, 0.25, 0.48, 16, 0, Math.PI * 2, rand), 'faint'),
    sides(b, 0.28, 0, 0.55, 0.3),
    curveLine([v3(0.3, 0.45, 0), v3(0.48, 0.42, 0), v3(0.5, 0.25, 0), v3(0.29, 0.14, 0)], 'form', 10),
  );
  mug.position.set(4.2, 0, 2.5);
  parts.push(mug);

  root.add(...parts);
  pen.seq(parts, 0, 0.85);

  // a little red d20 lying by the dice — its own pen, on the tail of the reveal
  const die = buildD20(0.22);
  die.root.position.set(2.7, 0, -2.9);
  die.root.rotation.y = 0.7;
  root.add(die.root);

  return {
    root,
    reveal: (p) => {
      pen.reveal(p);
      die.reveal(clamp01((p - 0.7) / 0.3));
    },
    dispose: () => {
      die.dispose();
      disposeTree(root);
    },
  };
}
