import * as THREE from 'three';
import { buildHero, SEAM_X, ISLAND_RX, ISLAND_RZ, type Hero } from '../hero/film/stages/hero.ts';
import { rig } from '../hero/film/stages/trilayer.ts';
import { polyline, sketch, paint, LINE, PAPER } from '../hero/film/pencil.ts';
import * as P from '../hero/film/palette.ts';
import { art, boxStandIn, discStandIn, revealer, type Art } from './props';
import { clamp, lerp, seg, settle, smooth, bump } from './ease';
import {
  SPOT, CELL, PLAYER_CELLS, ACTIVE_PATH, MONSTER_CELLS, FOG, PICKUP, LEADER,
} from './choreo';
import { DIE_SPOT } from './camera';

// Everything on the island and in the room, and the pure mapping from (u, the visitor's
// state) onto it. The director computes a PropState each frame; this file only draws it.

const DEG = Math.PI / 180;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const toCam = V(0, Math.sin(52 * DEG), -Math.cos(52 * DEG)); // beats 2–3 lens, for view-plane contours

/** Everything the scroll + clicks decide, for one frame. */
export interface PropState {
  night: number;
  lanternLit: number;
  cloud: number; // 0 = behind the far edge, 1 = parked
  cloudRope: number; // the drag rope's draw-on
  rain: number;
  snow: number;
  squash: number;
  taperVis: number;
  taperLit: number;
  sackPos: number; // 0 = at the left edge, 1 = at its spot
  sackVis: number;
  sackTip: number;
  show: [number, number, number];
  set: number;
  swapScale: number;
  rollT: number;
  freeze: number;
}
export const newPropState = (): PropState => ({
  night: 0, lanternLit: 1, cloud: 0, cloudRope: 0, rain: 0, snow: 0, squash: 0, taperVis: 0, taperLit: 0,
  sackPos: 0, sackVis: 0, sackTip: 0, show: [0, 0, 0], set: 0, swapScale: 1, rollT: 0, freeze: 0,
});

// ---- small builders ----------------------------------------------------------------

/** Text on a card, for nameplates (renders inside the laptop's texture too). */
function label(text: string, h = 0.075, accent?: number): THREE.Mesh {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const fpx = 64;
  ctx.font = `${fpx}px Metamorphous, Georgia, serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 48;
  c.width = w;
  c.height = fpx + 36;
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(247,245,240,0.92)';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    const r = 18;
    ctx.beginPath();
    ctx.roundRect(4, 4, c.width - 8, c.height - 8, r);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent !== undefined ? `#${accent.toString(16).padStart(6, '0')}` : '#222';
    ctx.font = `${fpx}px Metamorphous, Georgia, serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, c.width / 2, c.height / 2 + 3);
    tex.needsUpdate = true;
  };
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  draw();
  document.fonts?.ready.then(draw);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry((h * c.width) / c.height, h), mat);
  m.renderOrder = 5;
  return m;
}

function ellipse(rx: number, rz: number, y: number, n = 40): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(V(Math.cos(a) * rx, y, Math.sin(a) * rz));
  }
  return pts;
}

/** The island's own battle grid: faint cell lines clipped to the rim ellipse. */
function islandCells(): Art {
  const root = new THREE.Group();
  const lines: THREE.Object3D[] = [];
  const RX = ISLAND_RX * 0.94;
  const RZ = ISLAND_RZ * 0.92;
  for (let x = -Math.floor(RX / CELL) * CELL; x <= RX; x += CELL) {
    const h = RZ * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2));
    if (h > 0.1) lines.push(polyline([V(x, 0.03, -h), V(x, 0.03, 0), V(x, 0.03, h)], 'faint'));
  }
  for (let z = -Math.floor(RZ / CELL) * CELL; z <= RZ; z += CELL) {
    const h = RX * Math.sqrt(Math.max(0, 1 - (z / RZ) ** 2));
    if (h > 0.1) lines.push(polyline([V(-h, 0.03, z), V(0, 0.03, z), V(h, 0.03, z)], 'faint'));
  }
  // sweep from the near-right corner, like the page grid
  lines.sort((a, b) => a.id - b.id);
  root.add(...lines);
  const reveal = revealer(root);
  reveal(0);
  return { root, reveal, dispose: () => {} };
}

/** A small campfire — stones, logs, a flame that brightens at night and gutters in rain. */
function campfire() {
  const root = new THREE.Group();
  const stoneMat = new THREE.MeshLambertMaterial({ color: P.stoneWarm });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const s = sketch(new THREE.DodecahedronGeometry(0.045, 0), 30, 'faint');
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045, 0), stoneMat);
    m.position.set(Math.cos(a) * 0.12, 0.025, Math.sin(a) * 0.1);
    s.position.copy(m.position);
    root.add(m, s);
  }
  const logMat = new THREE.MeshLambertMaterial({ color: P.timberDark });
  for (const r of [0.4, 2.3, 4.2]) {
    const g = new THREE.CylinderGeometry(0.018, 0.022, 0.2, 6).rotateZ(Math.PI / 2 - 0.35).rotateY(r);
    const m = new THREE.Mesh(g, logMat);
    m.position.y = 0.05;
    const s = sketch(g, 30, 'faint');
    s.position.y = 0.05;
    root.add(m, s);
  }
  const flameMat = new THREE.MeshBasicMaterial({ color: P.flameBody, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
  const coreMat = new THREE.MeshBasicMaterial({ color: P.flameCore, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
  const flame = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.06, 0);
  shape.quadraticCurveTo(-0.07, 0.09, 0, 0.2);
  shape.quadraticCurveTo(0.07, 0.09, 0.06, 0);
  shape.quadraticCurveTo(0, -0.02, -0.06, 0);
  const fg = new THREE.ShapeGeometry(shape, 8);
  const outer = new THREE.Mesh(fg, flameMat);
  const inner = new THREE.Mesh(fg, coreMat);
  inner.scale.setScalar(0.55);
  inner.position.z = -0.002;
  const edge = polyline(shape.getPoints(10).map((p) => V(p.x, p.y, 0.001)), 'faint');
  paint(edge, { line: P.amberEmber });
  flame.add(outer, inner, edge);
  flame.position.y = 0.04;
  root.add(flame);
  const glowTex = radialTexture();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: P.amber, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
  glow.scale.setScalar(0.9);
  glow.position.y = 0.12;
  root.add(glow);
  const light = new THREE.PointLight(P.amber, 0, 2.6, 2);
  light.position.y = 0.2;
  root.add(light);
  return { root, flame, glow, light };
}

let _radial: THREE.Texture | null = null;
function radialTexture(): THREE.Texture {
  if (_radial) return _radial;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  _radial = new THREE.CanvasTexture(c);
  return _radial;
}

// ---- colour tints: the freeze greys every accent; night re-papers the paper fills ----
interface Tinted { mat: THREE.Material & { color: THREE.Color }; orig: THREE.Color; grey: THREE.Color; paper: boolean }
const NIGHT_PAPER = new THREE.Color(0x3c4255);

function collectTints(root: THREE.Object3D, skip: THREE.Object3D[], out: Tinted[], seen: Set<THREE.Material>) {
  root.traverse((o) => {
    for (const s of skip) {
      let p: THREE.Object3D | null = o;
      while (p) {
        if (p === s) return;
        p = p.parent;
      }
    }
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    if (!m.isMesh && !(o as THREE.Sprite).isSprite) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats as (THREE.Material & { color?: THREE.Color })[]) {
      if (!mat || !mat.color || seen.has(mat)) continue;
      if (mat.userData?.role === 'trilayer' || mat.userData?.alive) continue;
      seen.add(mat);
      const hex = mat.color.getHex();
      if (hex === LINE || hex === P.graphite || hex === P.graphiteDark || hex === P.graphiteLight) continue;
      const c = mat.color.clone();
      const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
      out.push({ mat: mat as Tinted['mat'], orig: c, grey: new THREE.Color(l, l, l).lerp(new THREE.Color(0xd8d4cc), 0.35), paper: hex === PAPER });
    }
  });
}

// =====================================================================================

export interface World {
  hero: Hero;
  island: THREE.Scene;
  room: THREE.Scene;
  laptop: { screen: THREE.Mesh; root: THREE.Group };
  roomCards: THREE.Mesh[];
  /** textures that arrived after load — the stage uploads them before they're needed */
  pendingTextures: THREE.Texture[];
  /** every texture fetch started at build — the load gate waits on these */
  loading: Promise<unknown>[];
  roomFitPoints: THREE.Vector3[];
  /** draw on everything that the late art loads add */
  updateIsland(u: number, ps: PropState, wt: number, cam: THREE.Camera, hands: { r: THREE.Vector3; l: THREE.Vector3 }, entranceDone: boolean, toggles: { mesh: THREE.Mesh; x: number }[]): void;
  updateRoom(u: number, wt: number, cam: THREE.Camera): void;
  taperMount(wrist: THREE.Object3D): void;
}

export function buildWorld(): World {
  const hero = buildHero();
  const island = new THREE.Scene();
  island.add(hero.root);
  const props = new THREE.Group();
  hero.root.add(props);
  /** every texture fetch this build starts — the load gate waits on these */
  const loading: Promise<unknown>[] = [];

  // -- page grid + island cells
  // deep enough that, from the level dock camera, it recedes to the horizon behind the
  // island instead of ending behind it (review 1); shifted back so little is wasted
  // behind the lens
  const grid = art<Art>('buildGrid', [40, 34, CELL], () => boxStandIn(40, 0.01, 34, 'faint'));
  grid.root.position.y = -0.98;
  grid.root.position.z = 6;
  paint(grid.root, { line: 0xb3aea4 }); // the page grid is a whisper, not a ruling
  props.add(grid.root);
  const cells = islandCells();
  props.add(cells.root);

  // -- ropes: the hanging end, and the run to his hands / the signpost / the cloud
  type RopeArt = Art & { set(a: THREE.Vector3, b: THREE.Vector3, sag: number): void };
  const ropeDangle = art<RopeArt>('buildRope', [], () => boxStandIn(0.02, 0.02, 0.02));
  const ropeRun = art<RopeArt>('buildRope', [], () => boxStandIn(0.02, 0.02, 0.02));
  const ropeCloud = art<RopeArt>('buildRope', [], () => boxStandIn(0.02, 0.02, 0.02));
  props.add(ropeDangle.root, ropeRun.root, ropeCloud.root);
  const LIP = V(SPOT.ropeLip.x, -0.01, SPOT.ropeLip.z);
  const POST = V(SPOT.signpost.x + 0.02, 0.24, SPOT.signpost.z - 0.02);

  // -- taper (parented to his right wrist by the stage)
  type TaperArt = Art & { setLit(l: number): void };
  const taper = art<TaperArt>('buildTaper', [], () => boxStandIn(0.02, 0.3, 0.02));

  // -- campfire
  const fire = campfire();
  fire.root.position.set(SPOT.campfire.x, 0, SPOT.campfire.z);
  props.add(fire.root);

  // -- the lantern's pool of light on the ground (night)
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: radialTexture(), color: P.amber, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
  );
  pool.position.set(SPOT.lantern.x + 0.2, 0.025, SPOT.lantern.z + 0.15);
  props.add(pool);
  const glass = (() => {
    let g: THREE.Mesh | undefined;
    let f: THREE.Object3D | undefined;
    hero.root.traverse((o) => {
      if (o.userData.heroPart === 'glass') g = o as THREE.Mesh;
      if (o.userData.heroPart === 'flame') f = o;
    });
    return { mesh: g, flame: f, lit: new THREE.Color(g?.userData.litHex ?? P.flameCore), unlit: new THREE.Color(g?.userData.unlitHex ?? P.dieBone) };
  })();
  const KEY_I = hero.rigs.key.intensity;
  const keyWarm = hero.rigs.key.color.clone();
  const keyNight = new THREE.Color(0x9fa8d0);

  // -- weather
  type CloudArt = Art & { setSquash(s: number): void };
  type Wx = Art & { setTime(t: number): void; setAmount(a: number): void };
  const cloud = art<CloudArt>('buildCloud', [toCam], () => boxStandIn(2, 0.8, 1));
  cloud.root.scale.setScalar(0.42);
  props.add(cloud.root);
  const rain = art<Wx>('buildRain', [ISLAND_RX * 1.8, ISLAND_RZ * 1.7, 1.9], () => boxStandIn(0.01, 0.01, 0.01));
  const snow = art<Wx>('buildSnow', [ISLAND_RX * 1.8, ISLAND_RZ * 1.7, 1.9], () => boxStandIn(0.01, 0.01, 0.01));
  props.add(rain.root, snow.root);
  rain.reveal(1);
  snow.reveal(1);
  type Cap = Art & { setAmount(a: number): void };
  const capSign = art<Cap>('buildSnowCap', [0.22], () => boxStandIn(0.2, 0.02, 0.1));
  capSign.root.position.set(SPOT.signpost.x, 0.82, SPOT.signpost.z);
  const capFire = art<Cap>('buildSnowCap', [0.3], () => boxStandIn(0.2, 0.02, 0.1));
  capFire.root.position.set(SPOT.campfire.x, 0.0, SPOT.campfire.z);
  props.add(capSign.root, capFire.root);
  const snowCover = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: P.snow, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  snowCover.scale.set(ISLAND_RX * 0.985, 1, ISLAND_RZ * 0.985);
  snowCover.position.y = 0.035;
  snowCover.renderOrder = 2;
  props.add(snowCover);
  const puddles = new THREE.Group();
  for (const [x, z, r] of [[-0.9, -0.35, 0.16], [0.6, -0.75, 0.12], [-0.2, 0.6, 0.14], [1.3, 0.05, 0.1]] as const) {
    const p = polyline(ellipse(r, r * 0.55, 0.035, 18), 'faint', true);
    paint(p, { line: P.water });
    p.position.set(x, 0, z);
    puddles.add(p);
  }
  props.add(puddles);
  const revealPuddles = revealer(puddles);

  // -- encounters: the sack, two sets of three monsters, rings, nameplates
  type SackArt = Art & { setTip(t: number): void; mouth: THREE.Object3D };
  const sack = art<SackArt>('buildSack', [toCam], () => {
    const a = boxStandIn(0.35, 0.35, 0.3);
    return Object.assign(a, { mouth: a.root });
  });
  props.add(sack.root);
  type Tok = Art & { setFacing(r: number): void };
  const SETS = [['goblin', 'wolf', 'skeleton'], ['slime', 'bat', 'ogre']];
  const NAMES: Record<string, string> = { goblin: 'Goblin', wolf: 'Dire wolf', skeleton: 'Skeleton', slime: 'Slime', bat: 'Giant bat', ogre: 'Ogre' };
  const monsters = SETS.map((set) =>
    set.map((kind) => {
      const t = art<Tok>('buildMonsterToken', [kind], () => discStandIn(0.13, 0.05, 0x8b6d47));
      const ring = art<Art & { setPulse(t: number): void }>('buildThreatRing', [0.3], () => discStandIn(0.3, 0.001));
      const name = label(NAMES[kind]);
      props.add(t.root, ring.root, name);
      return { t, ring, name };
    }),
  );

  // -- the party: four orange tokens, nameplates
  const PLAYER_NAMES = ['Mira', 'Bram', 'Tess', 'Rook'];
  const players = PLAYER_NAMES.map((n, i) => {
    const t = art<Tok>('buildPlayerToken', [i, toCam], () => discStandIn(0.13, 0.05, 0xd9772b));
    const name = label(n, 0.075, 0x9a4a12);
    props.add(t.root, name);
    return { t, name };
  });

  // -- fog of war
  type FogArt = Art & { setPeel(p: number): void };
  const fog = art<FogArt>('buildFogSheet', [FOG.w, FOG.d], () => boxStandIn(FOG.w, 0.02, FOG.d, 'faint'));
  fog.root.position.set(FOG.x, 0.04, FOG.z);
  props.add(fog.root);

  // -- the d20
  type DieArt = Art & { setTip(t: number): void; showFace(f: 1 | 20): void; body: THREE.Group; restY: number };
  const die = art<DieArt>('buildD20', [0.16], () => {
    const a = boxStandIn(0.25, 0.25, 0.25);
    return Object.assign(a, { body: a.root, restY: 0.125, showFace: () => {}, setTip: () => {} });
  });
  props.add(die.root);
  die.reveal(1);
  die.showFace(1);
  // tipping 1 → 20 rolls the die one face over; measure that shift once and cancel it
  // so the die turns over where it lies instead of sliding
  const tipShift = (() => {
    const a = V(0, 0, 0), b = V(0, 0, 0);
    die.setTip(0);
    die.root.updateMatrixWorld(true);
    die.body.getWorldPosition(a);
    die.setTip(1);
    die.root.updateMatrixWorld(true);
    die.body.getWorldPosition(b);
    die.setTip(0);
    return b.sub(a).setY(0).sub(die.root.position);
  })();
  const dieAxis = V(1, 0.3, 0.6).normalize();
  const dieStart = V(DIE_SPOT.x - 1.6, 0, DIE_SPOT.z - 1.3);
  const dieQ = new THREE.Quaternion();

  // -- tints (after everything in the island scene exists)
  const tints: Tinted[] = [];
  const seenMats = new Set<THREE.Material>();
  collectTints(hero.root, [hero.goblin.root], tints, seenMats);
  let lastNight = -1;
  let lastFreeze = -1;
  const applyTints = (night: number, freeze: number) => {
    if (Math.abs(night - lastNight) < 1e-3 && Math.abs(freeze - lastFreeze) < 1e-3) return;
    lastNight = night;
    lastFreeze = freeze;
    for (const t of tints) {
      if (t.paper) t.mat.color.copy(t.orig).lerp(NIGHT_PAPER, night * 0.38);
      else t.mat.color.copy(t.orig).lerp(t.grey, freeze);
    }
  };

  // ---- the room ------------------------------------------------------------------------
  const room = new THREE.Scene();
  const hemi = new THREE.HemisphereLight(0xf4efe6, 0x8a7458, 1.6);
  const key = new THREE.DirectionalLight(0xffeacc, 1.2);
  key.position.set(-6, 20, 10);
  room.add(hemi, key);
  type TableArt = Art & { topY?: number };
  const table = art<TableArt>('buildTable', [V(0, 0.6, 1).normalize()], () => discStandIn(6, 7.5));
  const TOP = table.topY ?? 7.5;
  room.add(table.root);
  type LaptopArt = Art & { screen: THREE.Mesh; setBezel(b: number): void };
  const laptop = art<LaptopArt>('buildLaptop', [], () => {
    const a = boxStandIn(3.2, 0.12, 2.2);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.9 / 1.6), new THREE.MeshBasicMaterial());
    screen.position.set(0, 1.2, -1.1);
    a.root.add(screen);
    return Object.assign(a, { screen, setBezel: () => {} });
  });
  laptop.root.position.set(0, TOP, 0);
  room.add(laptop.root);
  type LampArt = Art & { bulb?: THREE.Vector3 };
  const lamp = art<LampArt>('buildLamp', [V(0, 0.6, 1).normalize()], () => boxStandIn(1, 3, 1));
  lamp.root.position.set(-3.9, TOP, -1.6);
  lamp.root.rotation.y = 0.5;
  room.add(lamp.root);
  const lampLight = new THREE.PointLight(0xffd59a, 0, 16, 1.6);
  if (lamp.bulb) lampLight.position.copy(lamp.bulb);
  else lampLight.position.set(1.3, 2.4, 0.4);
  lamp.root.add(lampLight);
  const clutter = art<Art>('buildTableClutter', [], () => boxStandIn(1, 0.1, 1));
  clutter.root.position.set(0, TOP, 0);
  room.add(clutter.root);

  // the people: flat ink cards. The DM is ours (over-the-shoulder, +z); players across.
  const cardDefs = [
    { src: 'people/dm.svg', x: -4.6, z: 4.6, h: 7.2, y: 4.6 },
    { src: 'people/player-1.svg', x: -6.6, z: -5.9, h: 6.4, y: 5.2 },
    { src: 'people/player-2.svg', x: -2.4, z: -8.7, h: 6.6, y: 5.2 },
    { src: 'people/player-3.svg', x: 2.4, z: -8.7, h: 6.5, y: 5.2 },
    { src: 'people/player-4.svg', x: 6.6, z: -5.9, h: 6.4, y: 5.2 },
  ];
  const roomCards = cardDefs.map((d, i) => {
    const clip = new THREE.Plane(V(0, -1, 0), 0);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, clippingPlanes: [clip], depthWrite: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(d.h * 0.72, d.h), mat);
    mesh.position.set(d.x, d.y + d.h / 2, d.z);
    mesh.userData.clip = clip;
    mesh.userData.base = d.y;
    mesh.userData.h = d.h;
    mesh.userData.i = i;
    const fallback = () => {
      mat.map = inkFigure(i === 0);
      mat.needsUpdate = true;
    };
    loading.push(
      svgTexture(`${import.meta.env.BASE_URL}art/${d.src}`, 900)
        .then(({ tex, aspect }) => {
          mesh.scale.x = aspect / 0.72;
          mat.map = tex;
          mat.needsUpdate = true;
          pendingTextures.push(tex);
        })
        .catch(fallback),
    );
    room.add(mesh);
    return mesh;
  });

  const pendingTextures: THREE.Texture[] = [];
  const roomFitPoints = [
    V(-1.6, TOP, -1.1), V(1.6, TOP, 1.1), V(0, TOP + 2.2, -1.2),
    ...cardDefs.slice(1).map((d) => V(d.x, d.y + d.h * 0.92, d.z)),
    ...cardDefs.slice(1).map((d) => V(d.x, TOP, d.z * 0.7)),
  ];

  // ---- per-frame ---------------------------------------------------------------------
  const tmpA = V(0, 0, 0);
  const tmpB = V(0, 0, 0);
  const tmpC = V(0, 0, 0);
  const camQ = new THREE.Quaternion();

  function placeLabel(m: THREE.Mesh, x: number, y: number, z: number, o: number, cam: THREE.Camera) {
    m.position.set(x, y, z);
    m.quaternion.copy(camQ);
    (m.material as THREE.MeshBasicMaterial).opacity = o;
    m.visible = o > 0.005;
    void cam;
  }

  function updateIsland(
    u: number, ps: PropState, wt: number, cam: THREE.Camera,
    hands: { r: THREE.Vector3; l: THREE.Vector3 }, entranceDone: boolean,
    toggles: { mesh: THREE.Mesh; x: number }[],
  ) {
    cam.getWorldQuaternion(camQ);
    const birth = rig.birth.value;

    // paint blooms across the whole island during Beat 1
    if (entranceDone) {
      rig.seamX.value = lerp(SEAM_X, 3.7, smooth(seg(u, 0.3, 1.8)));
      for (const t of toggles) t.mesh.visible = t.x < rig.seamX.value;
    }
    rig.curtain.value = ps.freeze;
    applyTints(ps.night, ps.freeze);

    // grids
    grid.reveal(smooth(seg(u, 0.45, 1.95)));
    cells.reveal(smooth(seg(u, 7.85, 8.35)));

    // ropes (Beat 0/1)
    const haul = seg(u, 0.4, 1.1);
    const dangleLen = lerp(1.25, 0.16, smooth(haul));
    tmpA.copy(LIP);
    tmpB.set(LIP.x + 0.06, LIP.y - dangleLen, LIP.z - 0.12);
    ropeDangle.set(tmpA, tmpB, 0.02);
    ropeDangle.reveal(birth);
    const holding = smooth(seg(u, 0.33, 0.42));
    const tied = smooth(seg(u, 1.45, 1.6));
    if (holding > 0) {
      tmpC.copy(hands.r).lerp(POST, tied);
      ropeRun.set(tmpC, LIP, lerp(0.03, 0.06, tied));
      ropeRun.reveal(holding);
    } else ropeRun.reveal(0);

    // taper
    taper.reveal(ps.taperVis);
    taper.setLit(ps.taperLit);

    // lantern + night light
    const n = ps.night;
    const lit = ps.lanternLit;
    if (glass.mesh) (glass.mesh.material as THREE.MeshBasicMaterial).color.copy(glass.unlit).lerp(glass.lit, lit);
    if (glass.flame) glass.flame.scale.setScalar(Math.max(0.001, lit));
    (pool.material as THREE.MeshBasicMaterial).opacity = 0.55 * n * lit * (1 - ps.freeze);
    hero.rigs.hemi.intensity *= 1 - 0.6 * n;
    hero.rigs.key.intensity = KEY_I * (1 - 0.6 * n);
    hero.rigs.key.color.copy(keyWarm).lerp(keyNight, n);
    hero.rigs.glow.intensity *= lit * (1 + 1.6 * n);

    // campfire: brighter at night, gutters in the rain, smothered by snow
    const damp = 1 - 0.65 * ps.rain - 0.8 * ps.snow;
    const fl = 0.85 + 0.15 * Math.sin(wt * 11.3) * Math.sin(wt * 7.1 + 1.3);
    const fireAmt = clamp(damp) * (0.75 + 0.5 * n);
    fire.flame.scale.set(0.9 + 0.1 * fl, (0.6 + 0.5 * fl) * Math.max(0.05, fireAmt), 1);
    fire.flame.quaternion.copy(camQ);
    (fire.glow.material as THREE.SpriteMaterial).opacity = 0.35 * fireAmt * fl * (1 - ps.freeze);
    fire.light.intensity = 0.9 * fireAmt * fl * (1 - ps.freeze);
    fire.root.visible = birth > 0.5;

    // weather
    const c = ps.cloud;
    const ce = smooth(c);
    cloud.root.position.set(
      lerp(SPOT.offFar.x, 0.1, ce),
      lerp(-1.1, 2.05, smooth(clamp(c * 1.25))),
      lerp(SPOT.offFar.z + 0.5, 1.15, ce),
    );
    cloud.reveal(smooth(clamp(c * 2.2)));
    cloud.root.visible = c > 0.001;
    cloud.setSquash(ps.squash);
    if (ps.cloudRope > 0.001) {
      tmpC.copy(cloud.root.position).add(tmpB.set(0, -0.25, -0.2));
      ropeCloud.set(hands.r, tmpC, 0.12);
      ropeCloud.reveal(ps.cloudRope);
      ropeCloud.root.visible = true;
    } else ropeCloud.root.visible = false;
    rain.setTime(wt);
    rain.setAmount(ps.rain);
    rain.root.visible = ps.rain > 0.001;
    snow.setTime(wt);
    snow.setAmount(ps.snow);
    snow.root.visible = ps.snow > 0.001;
    revealPuddles(ps.rain);
    capSign.setAmount(ps.snow);
    capSign.reveal(ps.snow);
    capFire.setAmount(ps.snow);
    capFire.reveal(ps.snow);
    (snowCover.material as THREE.MeshLambertMaterial).opacity = 0.62 * smooth(ps.snow);
    snowCover.visible = ps.snow > 0.001;

    // sack
    const sp = settle(ps.sackPos);
    sack.root.position.set(lerp(SPOT.leftEdge.x + 0.15, SPOT.sack.x, sp), 0, lerp(SPOT.leftEdge.z, SPOT.sack.z, sp));
    sack.reveal(ps.sackVis);
    sack.root.visible = ps.sackVis > 0.001;
    sack.setTip(ps.sackTip);
    sack.mouth.getWorldPosition(tmpA);

    // monsters: out of the sack mouth onto their cells; turn to face the party at 10.9
    const face = lerp(Math.PI, Math.atan2(ACTIVE_PATH[2].x - MONSTER_CELLS[1].x, ACTIVE_PATH[2].z - MONSTER_CELLS[1].z), smooth(seg(u, 10.9, 11.3)));
    for (let s = 0; s < 2; s++) {
      const on = s === ps.set ? 1 : 0;
      for (let i = 0; i < 3; i++) {
        const m = monsters[s][i];
        const sh = ps.show[i] * on;
        const e = settle(sh);
        const cell = MONSTER_CELLS[i];
        const hop = Math.sin(Math.PI * clamp(sh)) * 0.25;
        m.t.root.position.set(lerp(tmpA.x, cell.x, e), lerp(Math.max(0, tmpA.y - 0.05), 0, e) + hop, lerp(tmpA.z, cell.z, e));
        const sc = smooth(clamp(sh * 3)) * ps.swapScale;
        m.t.root.scale.setScalar(Math.max(1e-3, sc));
        m.t.root.visible = sh > 0.001 && sc > 0.002;
        m.t.reveal(smooth(clamp(sh * 1.6)));
        // the nudged one rocks after the kick
        const rock = i === 1 ? bump(u, 7.56, 7.8) * 0.35 : 0;
        m.t.root.rotation.set(0, 0, rock);
        m.t.setFacing(face);
        const ro = smooth(seg(sh, 0.7, 1)) * ps.swapScale;
        m.ring.root.position.set(cell.x, 0.035, cell.z);
        m.ring.reveal(ro);
        m.ring.root.visible = ro > 0.001;
        m.ring.setPulse(wt);
        placeLabel(m.name, cell.x, 0.42, cell.z - 0.02, smooth(seg(sh, 0.75, 1)) * ps.swapScale, cam);
      }
    }

    // the party: carried in one per half unit, then the leader walks 3 cells
    for (let i = 0; i < 4; i++) {
      const s = 8 + i * 0.5;
      const p = players[i];
      const appear = smooth(seg(u, s + 0.0, s + 0.08));
      const carry = seg(u, s + 0.1, s + 0.34);
      const set = smooth(seg(u, s + 0.33, s + 0.4));
      const cell = PLAYER_CELLS[i];
      // between pick-up and set, the token rides in his hands
      tmpC.copy(hands.r).add(hands.l).multiplyScalar(0.5);
      let x = PICKUP[i].x, y = 0, z = PICKUP[i].z;
      if (carry > 0) {
        const ride = smooth(clamp(carry * 4)); // lifted into his hands
        x = lerp(x, tmpC.x, ride);
        y = lerp(0, tmpC.y - 0.1, ride);
        z = lerp(z, tmpC.z, ride);
      }
      x = lerp(x, cell.x, set);
      y = lerp(y, 0, set);
      z = lerp(z, cell.z, set);
      let rot = bump(u, s + 0.38, s + 0.47) * 0.25; // he straightens it
      if (i === LEADER) {
        for (let k = 0; k < 3; k++) {
          const h = seg(u, 10.6 + k * 0.24, 10.82 + k * 0.24);
          if (h <= 0) break;
          const from = k === 0 ? cell : ACTIVE_PATH[k - 1];
          const to = ACTIVE_PATH[k];
          const e = settle(h);
          x = lerp(from.x, to.x, e);
          z = lerp(from.z, to.z, e);
          y += Math.sin(Math.PI * h) * 0.06;
          rot = 0;
        }
      }
      p.t.root.position.set(x, Math.max(0, y), z);
      p.t.root.rotation.z = rot;
      p.t.root.visible = appear > 0.001;
      p.t.root.scale.setScalar(Math.max(1e-3, appear));
      p.t.reveal(appear);
      p.t.setFacing(lerp(0.35, 0, seg(u, s + 0.4, s + 0.46)));
      placeLabel(p.name, x, -0.0 + 0.04, z - 0.2, smooth(seg(u, s + 0.42, s + 0.5)) * (1 - ps.freeze * 0.5), cam);
      p.name.rotation.set(0, 0, 0);
      p.name.quaternion.copy(camQ);
    }

    // fog: laid with the table, peeled back like a bedsheet by the goblin
    fog.reveal(smooth(seg(u, 7.95, 8.3)) * (1 - smooth(seg(u, 10.95, 11.25))));
    fog.root.visible = u > 7.94 && u < 11.25;
    fog.setPeel(smooth(seg(u, 10.32, 10.95)));

    // the d20
    const r = ps.rollT;
    die.root.visible = r > 0.001 && u > 11.0;
    if (die.root.visible) {
      const ease = 1 - (1 - r) ** 3;
      const start = dieStart;
      const bounce = Math.abs(Math.sin(r * Math.PI * 2.5)) * (1 - r) ** 1.6 * 0.9;
      die.root.position.set(lerp(start.x, DIE_SPOT.x, ease), bounce + (1 - ease) * 0.6, lerp(start.z, DIE_SPOT.z, ease));
      dieQ.setFromAxisAngle(dieAxis, (1 - ease) * Math.PI * 7);
      die.body.quaternion.copy(dieQ);
      const tip = smooth(seg(u, 12.17, 12.28));
      die.setTip(tip);
      die.root.position.x -= tipShift.x * tip;
      die.root.position.z -= tipShift.z * tip;
    }
  }

  function updateRoom(u: number, wt: number, cam: THREE.Camera) {
    laptop.setBezel(smooth(seg(u, 13.0, 13.45)));
    laptop.reveal(smooth(seg(u, 13.0, 13.7)));
    // the screen is the island — it is never drawn on, it is simply there
    for (let o: THREE.Object3D | null = laptop.screen; o && o !== room; o = o.parent) o.visible = true;
    table.reveal(smooth(seg(u, 13.35, 14.3)));
    const lr = smooth(seg(u, 14.5, 15.2));
    lamp.reveal(lr);
    lampLight.intensity = 30 * lr;
    clutter.reveal(smooth(seg(u, 14.7, 15.7)));
    cam.getWorldQuaternion(camQ);
    for (const m of roomCards) {
      const i = m.userData.i as number;
      const a = 14.5 + i * 0.22;
      const p = smooth(seg(u, a, a + 0.55));
      const clip = m.userData.clip as THREE.Plane;
      // wipe the drawing on from the bottom of the card up
      clip.constant = m.userData.base + m.userData.h * p;
      m.visible = p > 0.001;
      // face the lens around the vertical only — flat cards, standing up
      m.rotation.set(0, Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z), 0);
      m.position.y = m.userData.base + m.userData.h / 2 + Math.sin(wt * 0.9 + i * 1.7) * 0.03;
    }
  }

  function taperMount(wrist: THREE.Object3D) {
    taper.root.scale.setScalar(1);
    taper.root.position.set(0, -0.02, 0.03);
    taper.root.rotation.set(-0.4, 0, 0);
    wrist.add(taper.root);
    taper.reveal(0);
  }

  return {
    hero, island, room, laptop, roomCards, pendingTextures, roomFitPoints, updateIsland, updateRoom, taperMount,
    loading,
  };
}

/** Rasterise an SVG (no intrinsic size needed) into a crisp canvas texture. */
async function svgTexture(url: string, height: number): Promise<{ tex: THREE.Texture; aspect: number }> {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok || !text.includes('<svg')) throw new Error('no svg');
  const vb = /viewBox="([\d.\s-]+)"/.exec(text)?.[1].trim().split(/\s+/).map(Number);
  const aspect = vb && vb[3] ? vb[2] / vb[3] : 0.8;
  const w = Math.round(height * aspect);
  const sized = text.replace('<svg', `<svg width="${w}" height="${height}"`);
  const blob = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  const img = new Image();
  img.src = blob;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = w;
  c.height = height;
  c.getContext('2d')!.drawImage(img, 0, 0, w, height);
  URL.revokeObjectURL(blob);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, aspect };
}

/** Until the artist's SVG people land: a loose ink figure drawn on a canvas. */
function inkFigure(back: boolean): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = 500;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#222';
  g.fillStyle = 'rgba(247,245,240,0.96)';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.ellipse(180, 120, 60, 70, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(60, 500);
  g.quadraticCurveTo(70, 240, 180, 220);
  g.quadraticCurveTo(290, 240, 300, 500);
  g.fill();
  g.stroke();
  if (!back) {
    g.beginPath();
    g.arc(160, 115, 5, 0, Math.PI * 2);
    g.arc(200, 115, 5, 0, Math.PI * 2);
    g.fillStyle = '#222';
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
