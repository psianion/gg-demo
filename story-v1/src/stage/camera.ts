import * as THREE from 'three';
import { heroFraming, HERO_FOV, ISLAND_RX, ISLAND_RZ } from '../hero/film/stages/hero.ts';
import { clamp, lerp, seg, smoother } from './ease';

// Camera framings, solved per viewport (on resize only — never per frame), and the
// pure u → pose path between them. A pose is spherical about a look point so moves
// interpolate as arcs, not chords. Every move is smoother() (C2) across its own range:
// zero velocity at each key, so consecutive moves hand off without a jolt.

const DEG = Math.PI / 180;

export interface Pose {
  look: THREE.Vector3;
  az: number; // off −z, like the hero
  el: number;
  d: number;
}

const tmpCam = new THREE.PerspectiveCamera(HERO_FOV, 1, 0.1, 200);
const v = new THREE.Vector3();

export function placeCamera(cam: THREE.Camera, p: Pose): void {
  cam.position.set(
    p.look.x + p.d * Math.cos(p.el) * Math.sin(p.az),
    p.look.y + p.d * Math.sin(p.el),
    p.look.z - p.d * Math.cos(p.el) * Math.cos(p.az),
  );
  cam.lookAt(p.look);
}

function poseFrom(pos: THREE.Vector3, look: THREE.Vector3): Pose {
  const o = pos.clone().sub(look);
  const d = o.length();
  return { look: look.clone(), d, el: Math.asin(o.y / d), az: Math.atan2(o.x, -o.z) };
}

/** The island's rim + a few tall points (tree tops) — what a framing must contain. */
const RIM: THREE.Vector3[] = [];
for (let i = 0; i < 48; i++) {
  const t = (i / 48) * Math.PI * 2;
  RIM.push(new THREE.Vector3(Math.cos(t) * ISLAND_RX, 0, Math.sin(t) * ISLAND_RZ));
}

function rimBox(p: Pose, aspect: number, pts: THREE.Vector3[] = RIM) {
  tmpCam.aspect = aspect;
  tmpCam.updateProjectionMatrix();
  placeCamera(tmpCam, p);
  tmpCam.updateMatrixWorld();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const q of pts) {
    v.copy(q).project(tmpCam);
    const sx = (v.x + 1) / 2;
    const sy = (1 - v.y) / 2; // y down
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
    y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  return { x0, x1, y0, y1 };
}

/**
 * Frame the island at a given angle so its rim box hits a target box (viewport
 * fractions, y down). Distance is fitted to whichever of width/height binds; the look
 * point walks in the camera plane until the box lands where asked.
 */
function frameIsland(
  aspect: number,
  az: number,
  el: number,
  want: { w: number; h: number; cx: number; bottom?: number; cy?: number },
): Pose {
  const p: Pose = { look: new THREE.Vector3(), az, el, d: 10 };
  const right = new THREE.Vector3();
  for (let i = 0; i < 10; i++) {
    let b = rimBox(p, aspect);
    const k = Math.max((b.x1 - b.x0) / want.w, (b.y1 - b.y0) / want.h);
    p.d *= k;
    b = rimBox(p, aspect);
    right.setFromMatrixColumn(tmpCam.matrixWorld, 0);
    const viewH = 2 * p.d * Math.tan((HERO_FOV * DEG) / 2);
    const ex = (b.x0 + b.x1) / 2 - want.cx;
    const ey = want.bottom !== undefined ? b.y1 - want.bottom : (b.y0 + b.y1) / 2 - (want.cy ?? 0.5);
    // slide sideways in the camera plane; place vertically by raising/lowering the look
    // point (the camera then looks a little above or below the island). A world-y step
    // reads linearly at every elevation; a ground step blew up below ~20° (review 1).
    p.look.addScaledVector(right, ex * viewH * aspect);
    p.look.y -= (ey * viewH) / Math.cos(el);
  }
  return p;
}

export interface Framings {
  aspect: number;
  portrait: boolean;
  hero: Pose;
  dock: Pose;
  push: Pose;
  screen: Pose;
  /** the 16:10 laptop-screen rect inside the viewport (fractions, y down) */
  rect: { x: number; y: number; w: number; h: number };
  /** vertical fov for the 16:10 render-to-texture camera */
  rtFov: number;
}

export const DIE_SPOT = new THREE.Vector3(0.35, 0, -0.5);

export function solveFramings(width: number, height: number): Framings {
  const aspect = width / Math.max(1, height);
  const portrait = aspect < 1;
  const hf = heroFraming(width, height);
  const hero = poseFrom(hf.position, hf.look);

  // Beat 1–2: a level camera, eye height (review 1). It looks a little above the island,
  // so the island is a thin ellipse (≈ 0.16 tall:wide, seen from ≈ 13°) hugging the
  // bottom edge, the goblin, signpost and trees stand tall against empty paper, and the
  // ground grid recedes to a horizon just above mid-frame.
  const DOCK_EL = 2 * DEG;
  const dock = portrait
    ? frameIsland(aspect, 0, DOCK_EL, { w: 1.04, h: 0.5, cx: 0.5, bottom: 0.9 })
    : frameIsland(aspect, 0, DOCK_EL, { w: 0.92, h: 0.64, cx: 0.5, bottom: 1.02 });
  // Beat 5: the product-UI frame still wants the map readable, so ¾ top-down stays
  const SCREEN_EL = 52 * DEG;

  // Beat 3 push: by the gag the die (r ≈ 0.16) fills about a quarter of the frame
  const push: Pose = {
    look: DIE_SPOT.clone().add(new THREE.Vector3(0.12, 0.16, 0.12)),
    az: -10 * DEG,
    el: 40 * DEG,
    d: portrait ? 4.1 : 3.0,
  };

  // the laptop-screen rect: 16:10 fitted inside the viewport
  const SA = 1.6;
  const rect =
    aspect >= SA
      ? { w: SA / aspect, h: 1, x: (1 - SA / aspect) / 2, y: 0 }
      : { w: 1, h: aspect / SA, x: 0, y: (1 - aspect / SA) / 2 };
  const screen = frameIsland(aspect, 0, SCREEN_EL, {
    w: rect.w * 0.8,
    h: rect.h * 0.7,
    cx: 0.5,
    cy: rect.y + rect.h * 0.56,
  });
  const rtFov =
    aspect >= SA ? HERO_FOV : (2 * Math.atan(Math.tan((HERO_FOV * DEG) / 2) * (aspect / SA))) / DEG;
  return { aspect, portrait, hero, dock, push, screen, rect, rtFov };
}

export function mixPose(a: Pose, b: Pose, t: number, out: Pose): Pose {
  out.look.lerpVectors(a.look, b.look, t);
  out.az = lerp(a.az, b.az, t);
  out.el = lerp(a.el, b.el, t);
  out.d = Math.exp(lerp(Math.log(a.d), Math.log(b.d), t)); // dolly reads even in log space
  return out;
}

export const ROOM_FROM = 13;
export const ROOM_TO = 16.9;
export const inRoom = (u: number) => u >= ROOM_FROM && u < ROOM_TO;

/** The island-scene camera path (everything except the 13–16.9 room). */
export function islandPose(u: number, f: Framings, out: Pose): Pose {
  if (u < 2) return mixPose(f.hero, f.dock, smoother(seg(u, 0, 2)), out);
  if (u < 8) return mixPose(f.dock, f.dock, 0, out);
  if (u < 11.6) return mixPose(f.dock, f.push, smoother(seg(u, 8, 11.6)), out);
  if (u < 12.5) return mixPose(f.push, f.push, 0, out);
  return mixPose(f.push, f.screen, smoother(seg(u, 12.5, 13)), out);
}

/** Reduced motion: held framings, swapped at the bottom of a paper dip. */
export function heldPose(u: number, f: Framings): Pose {
  if (u < 1) return f.hero;
  if (u < 9.8) return f.dock;
  if (u < 12.6) return f.push;
  return f.screen;
}
export const HELD_CUTS = [1, 9.8, 12.6];
/** canvas opacity under reduced motion: dips to paper around each held-framing cut */
export function prmDip(u: number): number {
  let o = 1;
  for (const c of HELD_CUTS) o = Math.min(o, clamp(Math.abs(u - c) / 0.18));
  return o;
}
