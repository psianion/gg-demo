import * as THREE from 'three';
import { REST, RIG, type Goblin } from '../hero/film/rig.ts';
import { clamp, lerp, lerpAngle, seg, settle, smooth, window01 } from './ease';

// THE GOBLIN AS A PUPPET OF u. No animation system: a track is position keys + pose
// spans, and evaluating a track at a time is a pure function. Scroll choreography is
// one track evaluated at u; a click is a short track evaluated at real-time tau and
// blended over the scroll pose with a weight that rises and falls smoothly, so either
// can hand off to the other mid-move without a snap.

// ---- pose vectors -------------------------------------------------------------------
const CH = [
  'pelvisY', 'pelvisZ', 'chestX', 'chestZ', 'neckX', 'neckY', 'headX', 'headY', 'headZ',
  'earR', 'earL', 'legRX', 'legLX', 'shinR', 'shinL', 'toeL',
  'armRX', 'armRY', 'armRZ', 'elbowR', 'wristR', 'armLX', 'armLY', 'armLZ', 'elbowL', 'hem',
] as const;
type Ch = (typeof CH)[number];
export type PoseV = Float32Array;
const IDX = Object.fromEntries(CH.map((c, i) => [c, i])) as Record<Ch, number>;
const N = CH.length;

function pose(over: Partial<Record<Ch, number>>, base?: PoseV): PoseV {
  const p = base ? base.slice() : new Float32Array(N);
  for (const [k, v] of Object.entries(over)) p[IDX[k as Ch]] = v as number;
  return p;
}

export const P_REST = pose({
  pelvisY: REST.pelvisY, pelvisZ: REST.pelvisZ, chestX: REST.chestX, chestZ: REST.chestZ,
  neckX: REST.neckX, neckY: REST.neckY, headX: REST.headX, headY: REST.headY, headZ: 0,
  earR: REST.earR, earL: REST.earL, legRX: REST.legRX, legLX: REST.legLX, shinR: 0, shinL: 0,
  toeL: REST.legLToeX, armRX: REST.armR[0], armRY: REST.armR[1], armRZ: REST.armR[2],
  elbowR: REST.armRElbowX, wristR: REST.armRWristX, armLX: -REST.chestX, armLY: 0, armLZ: 0,
  elbowL: REST.armLElbowX, hem: REST.hemFlickZ,
});
// arms are written relative to plumb (armL compensates the chest fold like applyPose)
const STAND = pose({
  pelvisY: RIG.hipY - 0.006, pelvisZ: 0, chestX: 0.14, chestZ: 0, neckX: 0.06, neckY: 0, headX: -0.04,
  headY: 0, legRX: 0, legLX: 0, toeL: 0, armRX: -0.22, armRY: 0, armRZ: -0.16, elbowR: -0.35, wristR: -0.1,
  armLX: -0.22, armLZ: 0.16, elbowL: -0.35, hem: -0.06,
}, P_REST);
const POSES = {
  stand: STAND,
  haul: pose({ chestX: -0.22, neckX: 0.1, headX: 0.12, pelvisY: RIG.hipY - 0.04, legRX: -0.55, legLX: 0.42,
    shinR: 0.35, armRX: -1.35, armRZ: -0.12, elbowR: -0.4, armLX: -1.35, armLZ: 0.12, elbowL: -0.4 }, STAND),
  crouch: pose({ chestX: 0.62, neckX: 0.15, headX: -0.25, pelvisY: RIG.hipY - 0.07, legRX: -0.7, shinR: 0.9,
    legLX: 0.2, shinL: 0.6, armRX: -1.0, elbowR: -0.5, armLX: -1.0, elbowL: -0.5 }, STAND),
  dust: pose({ armRX: -0.95, armRZ: -0.55, elbowR: -1.45, armLX: -0.95, armLZ: 0.55, elbowL: -1.45, chestX: 0.2 }, STAND),
  carry: pose({ chestX: 0.05, armRX: -1.05, armRZ: -0.3, elbowR: -0.95, armLX: -1.05, armLZ: 0.3, elbowL: -0.95,
    headX: 0.08 }, STAND),
  taper: pose({ armRX: -1.6, armRZ: -0.25, elbowR: -0.7, wristR: 0.3 }, STAND),
  climb: pose({ chestX: 0.3, armRX: -2.5, armRZ: -0.2, elbowR: -0.6, armLX: -2.1, armLZ: 0.2, elbowL: -0.9,
    legRX: -0.9, shinR: 1.1, legLX: -0.3, shinL: 0.6, headX: -0.3 }, STAND),
  reach: pose({ chestX: 0.0, armRX: -2.75, armRZ: -0.35, elbowR: -0.25, wristR: 0.4, armLX: -1.9, armLZ: 0.3,
    elbowL: -1.0, legRX: -0.5, shinR: 0.8, headX: -0.45 }, STAND),
  hang: pose({ chestX: 0.1, armRX: -2.9, armRZ: -0.15, elbowR: -0.15, armLX: -2.9, armLZ: 0.15, elbowL: -0.15,
    legRX: -0.25, legLX: 0.15, headX: -0.1 }, STAND),
  blow: pose({ chestX: 0.55, neckX: 0.25, headX: -0.18, armRX: -0.3, armRZ: -0.5, elbowR: -1.2, armLX: -0.3,
    armLZ: 0.5, elbowL: -1.2, legRX: -0.35, legLX: 0.3 }, STAND),
  shoo: pose({ chestX: 0.05, armRX: -2.3, armRZ: -0.7, elbowR: -0.6, armLX: -2.3, armLZ: 0.7, elbowL: -0.6,
    headX: -0.35 }, STAND),
  lift: pose({ chestX: 0.35, armRX: -1.9, armRZ: -0.25, elbowR: -0.3, armLX: -1.9, armLZ: 0.25, elbowL: -0.3,
    legRX: -0.4, legLX: 0.3, pelvisY: RIG.hipY - 0.03 }, STAND),
  kick: pose({ legRX: -0.95, shinR: -0.1, legLX: 0.12, chestX: -0.05, armRX: -0.4, armRZ: -0.6, armLX: -0.4,
    armLZ: 0.6, elbowR: -0.5, elbowL: -0.5, headX: 0.15 }, STAND),
  look: pose({ chestX: 0.32, neckX: 0.18, headX: 0.22 }, STAND),
  shrug: pose({ armRX: -0.45, armRZ: -1.05, elbowR: -1.6, armLX: -0.45, armLZ: 1.05, elbowL: -1.6,
    earR: REST.earR - 0.35, earL: REST.earL + 0.35, headZ: 0.22, pelvisY: RIG.hipY + 0.004, chestX: 0.02 }, STAND),
  push: pose({ chestX: 0.7, neckX: 0.1, headX: -0.3, armRX: -1.25, armRZ: -0.15, elbowR: -0.15, armLX: -0.6,
    elbowL: -0.6, pelvisY: RIG.hipY - 0.06, legRX: -0.55, shinR: 0.7, legLX: 0.4 }, STAND),
  sit: pose({ pelvisY: 0.07, chestX: 0.28, neckX: 0.1, headX: -0.05, legRX: -1.45, shinR: 1.25, legLX: -1.45,
    shinL: 1.15, toeL: 0, armRX: -0.65, armRZ: -0.2, elbowR: -0.55, armLX: -0.65, armLZ: 0.2, elbowL: -0.55,
    hem: 0.1 }, STAND),
  shake: pose({ chestX: -0.15, armRX: -2.4, armRZ: -0.25, elbowR: -0.45, armLX: -2.4, armLZ: 0.25, elbowL: -0.45,
    headX: -0.4, legRX: -0.3, legLX: 0.3 }, STAND),
} satisfies Record<string, PoseV>;
export type PoseName = keyof typeof POSES;

/** procedural layers riding on a span (pure in the span's own time) */
type Wiggle = 'hand' | 'clap' | 'climb' | 'wave' | 'shake' | 'none';

// ---- tracks -------------------------------------------------------------------------
export interface Key { t: number; x: number; z: number; y?: number; face?: number }
export interface Span { a: number; b: number; pose: PoseName; fade?: number; wig?: Wiggle; amp?: number }
export interface Track { keys: Key[]; spans: Span[]; look?: { a: number; b: number }[] }

export interface Eval {
  x: number; y: number; z: number; heading: number; stride: number; moving: number; lookCam: number;
  pose: PoseV;
}
export const newEval = (): Eval => ({ x: 0, y: 0, z: 0, heading: 0, stride: 0, moving: 0, lookCam: 0, pose: new Float32Array(N) });

/** fill in default faces (direction of the incoming move) and cumulative arc length */
export function prepare(tr: Track): Track & { arc: number[] } {
  const k = tr.keys;
  for (let i = 0; i < k.length; i++) {
    if (k[i].face !== undefined) continue;
    const a = k[Math.max(0, i - 1)];
    const b = k[i];
    const dx = b.x - a.x, dz = b.z - a.z;
    k[i].face = dx * dx + dz * dz > 1e-6 ? Math.atan2(dx, dz) : i > 0 ? k[i - 1].face! : REST.rootY;
  }
  const arc = [0];
  for (let i = 1; i < k.length; i++) arc.push(arc[i - 1] + Math.hypot(k[i].x - k[i - 1].x, k[i].z - k[i - 1].z));
  return Object.assign(tr, { arc });
}

/** re-measure a track's arc after its keys moved (in place, no allocation) */
export function rearc(tr: Track & { arc: number[] }): void {
  const k = tr.keys;
  for (let i = 1; i < k.length; i++) tr.arc[i] = tr.arc[i - 1] + Math.hypot(k[i].x - k[i - 1].x, k[i].z - k[i - 1].z);
}

const STRIDE = 0.3; // world units per full gait cycle (long enough not to alias on a fast scroll)

export function evalTrack(tr: Track & { arc: number[] }, t: number, out: Eval, base: PoseV): Eval {
  const k = tr.keys;
  let i = 0;
  while (i < k.length - 2 && t >= k[i + 1].t) i++;
  const a = k[i], b = k[i + 1] ?? k[i];
  const span = b.t - a.t;
  const lt = span > 0 ? clamp((t - a.t) / span) : 1;
  const e = settle(lt);
  out.x = lerp(a.x, b.x, e);
  out.z = lerp(a.z, b.z, e);
  out.y = lerp(a.y ?? 0, b.y ?? 0, smooth(lt));
  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  // moving: high mid-move, 0 at the keys (the ease's own velocity shape)
  const vel = span > 0 ? (dist * 6 * lt * (1 - lt)) / Math.max(span, 1e-3) : 0;
  out.moving = dist > 0.02 ? clamp(vel / 1.5) * clamp(dist / 0.15) : 0;
  out.stride = ((tr.arc[i] + dist * e) / STRIDE) * Math.PI * 2;
  // Heading. A stationary key pair just turns a.face → b.face. A move turns INTO its
  // direction over the first fifth and OUT to b.face over the last fifth — two
  // fixed-endpoint blends, so the short way round can never flip mid-turn.
  if (dist > 0.03) {
    const dir = Math.atan2(b.x - a.x, b.z - a.z);
    const h1 = lerpAngle(a.face!, dir, smooth(clamp(lt / 0.2)));
    out.heading = lerpAngle(h1, b.face!, smooth(clamp((lt - 0.8) / 0.2)));
  } else out.heading = lerpAngle(a.face!, b.face!, smooth(lt));

  out.pose.set(base);
  for (const s of tr.spans) {
    const w = window01(t, s.a, s.b, s.fade ?? Math.min(0.12, (s.b - s.a) * 0.35));
    if (w <= 0) continue;
    const p = POSES[s.pose];
    for (let c = 0; c < N; c++) out.pose[c] += (p[c] - out.pose[c]) * w;
    wiggle(s, t, w, out.pose);
  }
  out.lookCam = 0;
  if (tr.look) for (const l of tr.look) out.lookCam = Math.max(out.lookCam, window01(t, l.a, l.b, (l.b - l.a) * 0.3));
  return out;
}

function wiggle(s: Span, t: number, w: number, p: PoseV) {
  const wig = s.wig ?? 'none';
  if (wig === 'none') return;
  const amp = (s.amp ?? 1) * w;
  const ph = ((t - s.a) / Math.max(1e-3, s.b - s.a)) * Math.PI * 2;
  if (wig === 'hand') {
    // hand over hand on a rope
    const q = Math.sin(ph * 4);
    p[IDX.armRX] += q * 0.35 * amp;
    p[IDX.armLX] -= q * 0.35 * amp;
    p[IDX.chestX] += Math.abs(q) * 0.08 * amp;
  } else if (wig === 'clap') {
    const q = Math.sin(ph * 5);
    p[IDX.armRZ] += q * 0.25 * amp;
    p[IDX.armLZ] -= q * 0.25 * amp;
  } else if (wig === 'climb') {
    const q = Math.sin(ph * 3);
    p[IDX.armRX] += q * 0.4 * amp;
    p[IDX.armLX] -= q * 0.4 * amp;
    p[IDX.legRX] -= q * 0.35 * amp;
    p[IDX.legLX] += q * 0.35 * amp;
  } else if (wig === 'wave') {
    const q = Math.sin(ph * 4);
    p[IDX.armRZ] += q * 0.5 * amp;
    p[IDX.armLZ] += q * 0.5 * amp;
  } else if (wig === 'shake') {
    const q = Math.sin(ph * 7);
    p[IDX.armRX] += q * 0.25 * amp;
    p[IDX.armLX] += q * 0.25 * amp;
    p[IDX.chestX] += q * 0.08 * amp;
  }
}

export function mixEval(a: Eval, b: Eval, w: number, out: Eval): Eval {
  out.x = lerp(a.x, b.x, w);
  out.y = lerp(a.y, b.y, w);
  out.z = lerp(a.z, b.z, w);
  out.heading = lerpAngle(a.heading, b.heading, w);
  out.lookCam = lerp(a.lookCam, b.lookCam, w);
  out.moving = lerp(a.moving, b.moving, w);
  // strides can't be lerped (phases); the gait is mixed after evaluation instead
  for (let c = 0; c < N; c++) out.pose[c] = lerp(a.pose[c], b.pose[c], w);
  return out;
}

// ---- writing onto the puppet ------------------------------------------------------------
const tmp = new THREE.Vector3();

export interface Gait { legR: number; legL: number; shinR: number; shinL: number; armR: number; armL: number; bob: number }
export function gaitOf(stride: number, moving: number, out: Gait): Gait {
  const s = Math.sin(stride);
  const c = Math.cos(stride);
  const m = moving;
  out.legR = s * 0.55 * m;
  out.legL = -s * 0.55 * m;
  out.shinR = Math.max(0, -c) * 0.7 * m;
  out.shinL = Math.max(0, c) * 0.7 * m;
  out.armR = -s * 0.35 * m;
  out.armL = s * 0.35 * m;
  out.bob = Math.abs(Math.cos(stride)) * 0.012 * m;
  return out;
}

/** Apply a final eval + gait. `lifeW` (0..1) lets heroLife's own head/wrist writes win. */
export function applyEval(
  g: Goblin, e: Eval, gait: Gait, lifeW: number, cam: THREE.Camera | null, gobY: number,
  glance?: { p: THREE.Vector3; w: number },
) {
  const p = e.pose;
  g.root.position.set(e.x, gobY + e.y, e.z);
  g.root.rotation.y = e.heading;
  g.pelvis.position.y = p[IDX.pelvisY];
  g.pelvis.rotation.z = p[IDX.pelvisZ];
  g.chest.rotation.x = p[IDX.chestX];
  g.chest.rotation.z = p[IDX.chestZ];
  g.neck.rotation.x = p[IDX.neckX];
  g.earR.rotation.z = p[IDX.earR];
  g.earL.rotation.z = p[IDX.earL];
  g.legR.pose.rotation.x = p[IDX.legRX];
  g.legL.pose.rotation.x = p[IDX.legLX];
  g.legR.shin.pose.rotation.x = p[IDX.shinR];
  g.legL.shin.pose.rotation.x = p[IDX.shinL];
  g.legL.toe.rotation.x = p[IDX.toeL];
  g.armR.pose.rotation.x = p[IDX.armRX];
  g.armR.pose.rotation.y = p[IDX.armRY];
  g.armL.pose.rotation.set(p[IDX.armLX], p[IDX.armLY], p[IDX.armLZ]);
  g.armR.elbow.rotation.x = p[IDX.elbowR];
  g.armL.elbow.rotation.x = p[IDX.elbowL];
  g.hemFlick.rotation.z = p[IDX.hem];
  g.head.rotation.z = p[IDX.headZ];
  // gait — additive channels only (rig.ts: one channel, one owner)
  g.legR.swing.rotation.x = gait.legR;
  g.legL.swing.rotation.x = gait.legL;
  g.legR.shin.swing.rotation.x = gait.shinR;
  g.legL.shin.swing.rotation.x = gait.shinL;
  g.armR.swing.rotation.x = gait.armR;
  g.armL.swing.rotation.x = gait.armL;
  g.bob.position.y = gait.bob;

  // head + wrist + the arm's z: shared with heroLife's head-track/scritch at the hero
  let neckY = p[IDX.neckY];
  let headY = p[IDX.headY];
  let headX = p[IDX.headX];
  if (cam && e.lookCam > 0) {
    // the look at the visitor: aim neck+head at the lens, in his own frame
    g.root.updateMatrixWorld();
    tmp.copy(cam.position);
    g.root.worldToLocal(tmp);
    const yaw = clamp(Math.atan2(tmp.x, tmp.z), -1.35, 1.35);
    const pitch = clamp(Math.atan2(tmp.y - 0.6, Math.hypot(tmp.x, tmp.z)), -0.2, 0.75);
    neckY = lerp(neckY, yaw * 0.4, e.lookCam);
    headY = lerp(headY, yaw * 0.6, e.lookCam);
    headX = lerp(headX, -pitch * 0.8, e.lookCam);
  }
  if (glance && glance.w > 0.001) {
    // a hovered chip: he glances toward it (head only, the body keeps working)
    g.root.updateMatrixWorld();
    tmp.copy(glance.p);
    g.root.worldToLocal(tmp);
    const yaw = clamp(Math.atan2(tmp.x, tmp.z), -1.2, 1.2);
    neckY = lerp(neckY, yaw * 0.35, glance.w);
    headY = lerp(headY, yaw * 0.55, glance.w);
  }
  const k = 1 - lifeW;
  g.neck.rotation.y = lerp(g.neck.rotation.y, neckY, k);
  g.head.rotation.y = lerp(g.head.rotation.y, headY, k);
  g.head.rotation.x = lerp(g.head.rotation.x, headX, k);
  g.armR.wrist.rotation.x = lerp(g.armR.wrist.rotation.x, p[IDX.wristR], k);
  g.armR.pose.rotation.z = lerp(g.armR.pose.rotation.z, p[IDX.armRZ], k);
}

export { POSES, IDX };
