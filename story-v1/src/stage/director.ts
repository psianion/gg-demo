import * as THREE from 'three';
import type { Hero } from '../hero/film/stages/hero.ts';
import { clamp, lerp, seg, smooth } from './ease';
import {
  applyEval, evalTrack, gaitOf, mixEval, newEval, P_REST, POSES, rearc, type Gait, type Track,
} from './actor';
import { CHIP_SEGMENT, clipTrack, SCROLL_TRACK } from './choreo';
import { actions, DUR, persistLight, queueDrained, state, type Effective } from './state';
import type { PropState } from './world';
import { clock } from './clock';

// THE DIRECTOR: (u, the visitor's state, real time) → the goblin's pose and the props'
// state. Scroll content is a pure function of u. The only real-time things are click
// clips and the die roll, and each blends in and out so nothing jumps.

export const DIE_U = 11.5;
const ROLL_S = 1.05;

export interface Director {
  frame(u: number, dt: number, cam: THREE.Camera | null, ps: PropState): void;
  effective(u: number): Effective;
  hands: { r: THREE.Vector3; l: THREE.Vector3 };
  die: { fired: boolean; clock: number };
  /** the director owns him past the hero; heroLife's head-track stands down */
  engaged(): boolean;
}

export function createDirector(hero: Hero, opts: { onDieFire: () => void }): Director {
  const g = hero.goblin;
  const scrollE = newEval();
  const clipE = newEval();
  const outE = newEval();
  const gaitA: Gait = { legR: 0, legL: 0, shinR: 0, shinL: 0, armR: 0, armL: 0, bob: 0 };
  const gaitB: Gait = { ...gaitA };
  const gait: Gait = { ...gaitA };
  const hands = { r: new THREE.Vector3(), l: new THREE.Vector3() };
  const die = { fired: false, clock: 0 };
  let seenJumps = -1;
  let prevU = NaN; // first frame: no crossing (a ?u= load past 11.5 must not roll)
  let lastU = 0;
  const gobY = g.root.position.y;
  // the chip glance: real-time and damped (hover is UI, not scroll)
  const glance = { p: new THREE.Vector3(), w: 0 };
  const railDir = new THREE.Vector3();

  // the scroll pose's base: his work hunch at the hero, a stand once he's off
  const base = new Float32Array(P_REST.length);
  const baseFor = (u: number) => {
    const w = smooth(seg(u, 0.06, 0.32));
    for (let i = 0; i < base.length; i++) base[i] = lerp(P_REST[i], POSES.stand[i], w);
    return base;
  };

  // a clicked chip's own scroll segment holds (he already did it for you)
  const remap = (u: number) => {
    for (const k of ['light', 'weather', 'encounters'] as const) {
      const [a, b] = CHIP_SEGMENT[k];
      if (state[k].clicked && u > a && u < b) return a;
    }
    return u;
  };

  const effective = (u: number): Effective => {
    const night = state.light.clicked ? state.light.night : seqNight(u);
    const rain = state.weather.clicked ? state.weather.rain : seqRain(u);
    const snow = state.weather.clicked ? state.weather.snow : 0;
    return {
      night,
      weather: rain > 0.5 ? 'rain' : snow > 0.5 ? 'snow' : 'clear',
      shown: state.encounters.clicked ? state.encounters.show > 0.5 : u > 7.1,
    };
  };

  let clipTr: (Track & { arc: number[] }) | null = null;

  function startNext(u: number) {
    const kind = actions.queue.shift();
    if (!kind) {
      queueDrained();
      return;
    }
    const ps = scratch;
    sequenceInto(u, ps);
    actions.cur = {
      kind,
      tau: 0,
      from: {
        night: ps.night, cloud: ps.cloud, rain: ps.rain, snow: ps.snow,
        show: Math.min(ps.show[0], ps.show[1], ps.show[2]), swap: 0,
      },
      ax: g.root.position.x,
      az: g.root.position.z,
    };
    clipTr = clipTrack(kind, g.root.position.x, g.root.position.z) as Track & { arc: number[] };
    // the toggle now belongs to the visitor, seeded with what was on screen
    if (kind === 'lightOn' || kind === 'lightOff') {
      state.light.clicked = true;
      state.light.night = ps.night;
    } else if (kind === 'rain' || kind === 'snow' || kind === 'clear') {
      state.weather.clicked = true;
      state.weather.cloud = ps.cloud;
      state.weather.rain = ps.rain;
      state.weather.snow = ps.snow;
    } else {
      if (!state.encounters.clicked) {
        state.encounters.clicked = true;
        state.encounters.show = actions.cur.from.show;
      }
    }
  }

  // the scroll sequence alone, honouring clicked toggles
  const scratch = {} as PropState;
  function sequenceInto(u: number, ps: PropState) {
    const L = state.light, W = state.weather, E = state.encounters;
    ps.night = L.clicked ? L.night : seqNight(u);
    ps.lanternLit = lerp(1, ps.night, smooth(seg(u, 0.6, 1.5)));
    const wx = !W.clicked;
    ps.cloud = wx ? smooth(seg(u, 4.62, 4.98)) * (1 - smooth(seg(u, 5.5, 5.85))) : W.cloud;
    ps.cloudRope = wx ? smooth(seg(u, 4.6, 4.66)) * (1 - smooth(seg(u, 5.0, 5.1))) : 0;
    ps.rain = wx ? seqRain(u) : W.rain;
    ps.snow = wx ? 0 : W.snow;
    ps.squash = wx ? 0 : W.squash;
    const lt = !L.clicked;
    ps.taperVis = lt ? smooth(seg(u, 2.12, 2.22)) * (1 - smooth(seg(u, 3.36, 3.48))) : 0;
    ps.taperLit = lt ? smooth(seg(u, 2.92, 3.02)) * (1 - smooth(seg(u, 3.15, 3.3))) : 0;
    if (!E.clicked) {
      ps.sackVis = smooth(seg(u, 6.28, 6.38));
      ps.sackPos = seg(u, 6.36, 6.66);
      ps.sackTip = smooth(seg(u, 6.66, 6.9));
      for (let i = 0; i < 3; i++) ps.show[i] = smooth(seg(u, 6.88 + i * 0.13, 7.12 + i * 0.13));
      ps.set = 0;
    } else {
      ps.sackVis = 1;
      ps.sackPos = 1;
      ps.sackTip = 1;
      for (let i = 0; i < 3; i++) ps.show[i] = clamp(E.show * 1.3 - i * 0.15);
      ps.set = E.set;
    }
    ps.swapScale = 1;
    ps.freeze = smooth(seg(u, 11.64, 11.74)) * (1 - smooth(seg(u, 12.3, 12.42)));
    ps.rollT = 0;
  }
  scratch.show = [0, 0, 0];

  function frame(u: number, dt: number, cam: THREE.Camera | null, ps: PropState) {
    // ---- the die: one real-time roll, fired by crossing 11.5 going forward
    if (Number.isNaN(prevU) || clock.jumps !== seenJumps) {
      prevU = u;
      seenJumps = clock.jumps;
    }
    if (prevU < DIE_U && u >= DIE_U && !die.fired) {
      die.fired = true;
      die.clock = 0;
      opts.onDieFire();
    }
    if (u < 11.0) die.fired = false;
    if (die.fired) die.clock = Math.min(ROLL_S, die.clock + dt);
    prevU = u;

    sequenceInto(u, ps);
    // roll: real time once fired; scrubbing past it catches up; scrubbing back rewinds
    const rc = die.fired ? die.clock / ROLL_S : 0;
    ps.rollT = u >= DIE_U ? Math.max(rc, seg(u, 11.56, 11.8)) : Math.max(rc, 0) * smooth(seg(u, 11.0, DIE_U));
    if (!die.fired && u >= DIE_U) ps.rollT = Math.max(ps.rollT, seg(u, 11.56, 11.8));

    // ---- the scroll pose
    const su = remap(u);
    evalTrack(SCROLL_TRACK, su, scrollE, baseFor(su));
    gaitOf(scrollE.stride, scrollE.moving, gaitA);

    // ---- a click clip on top
    if (!actions.cur && actions.queue.length) startNext(u);
    const cur = actions.cur;
    let w = 0;
    if (cur) {
      cur.tau = Math.min(1, cur.tau + dt / DUR[cur.kind]);
      const tau = cur.tau;
      // the anchor follows the live scroll pose, so the clip returns to wherever he is now
      const tr = clipTr!;
      const k0 = tr.keys[0], k1 = tr.keys[tr.keys.length - 1];
      k0.x = k1.x = scrollE.x;
      k0.z = k1.z = scrollE.z;
      rearc(tr);
      evalTrack(tr, tau, clipE, scrollE.pose);
      gaitOf(clipE.stride, clipE.moving, gaitB);
      w = smooth(seg(tau, 0, 0.12)) * (1 - smooth(seg(tau, 0.88, 1)));
      runClip(cur.kind, tau, cur.from, ps);
      if (tau >= 1) {
        actions.cur = null;
        if (!actions.queue.length) queueDrained();
      }
    }
    mixEval(scrollE, clipE, w, outE);
    if (w <= 0) outE.lookCam = scrollE.lookCam;
    gait.legR = lerp(gaitA.legR, gaitB.legR, w);
    gait.legL = lerp(gaitA.legL, gaitB.legL, w);
    gait.shinR = lerp(gaitA.shinR, gaitB.shinR, w);
    gait.shinL = lerp(gaitA.shinL, gaitB.shinL, w);
    gait.armR = lerp(gaitA.armR, gaitB.armR, w);
    gait.armL = lerp(gaitA.armL, gaitB.armL, w);
    gait.bob = lerp(gaitA.bob, gaitB.bob, w);

    // heroLife owns head + wrist at the hero; the director takes over as he moves off
    const lifeW = 1 - smooth(seg(u, 0.02, 0.2));
    const want = actions.hover && u > 1.9 && u < 8.1 && !actions.cur ? 1 : 0;
    glance.w += (want - glance.w) * (1 - Math.exp(-dt / 0.12));
    if (cam && glance.w > 0.001) {
      // the rail sits at the screen's right edge: a point far off to the lens's right
      railDir.setFromMatrixColumn(cam.matrixWorld, 0);
      glance.p.copy(g.root.position).addScaledVector(railDir, 4);
    }
    applyEval(g, outE, gait, lifeW, cam, gobY, glance);
    // the carpenter's pencil goes back in the cloak as he leaves his work
    hero.pencil.scale.setScalar(Math.max(1e-3, 1 - smooth(seg(u, 0.08, 0.3))));
    hero.pencil.visible = u < 0.3;

    g.root.updateMatrixWorld(true);
    g.armR.wrist.getWorldPosition(hands.r);
    g.armL.wrist.getWorldPosition(hands.l);
    lastU = u;
  }

  function runClip(kind: string, tau: number, from: { night: number; cloud: number; rain: number; snow: number; show: number }, ps: PropState) {
    const L = state.light, W = state.weather, E = state.encounters;
    switch (kind) {
      case 'lightOn':
        L.night = lerp(from.night, 1, smooth(seg(tau, 0.5, 0.72)));
        ps.taperVis = smooth(seg(tau, 0.02, 0.1)) * (1 - smooth(seg(tau, 0.74, 0.84)));
        ps.taperLit = smooth(seg(tau, 0.44, 0.5)) * (1 - smooth(seg(tau, 0.66, 0.74)));
        if (tau >= 1) persistLight(true);
        break;
      case 'lightOff':
        L.night = lerp(from.night, 0, smooth(seg(tau, 0.36, 0.62)));
        if (tau >= 1) persistLight(false);
        break;
      case 'rain':
        W.cloud = lerp(from.cloud, 1, smooth(seg(tau, 0.2, 0.7)));
        W.rain = lerp(from.rain, 1, smooth(seg(tau, 0.62, 0.92)));
        W.snow = lerp(from.snow, 0, smooth(seg(tau, 0.2, 0.6)));
        W.kind = 'rain';
        ps.cloudRope = from.cloud < 0.5 ? smooth(seg(tau, 0.2, 0.28)) * (1 - smooth(seg(tau, 0.66, 0.76))) : 0;
        break;
      case 'snow':
        W.cloud = lerp(from.cloud, 1, smooth(seg(tau, 0.1, 0.45)));
        W.rain = lerp(from.rain, 0, smooth(seg(tau, 0.2, 0.5)));
        W.snow = lerp(from.snow, 1, smooth(seg(tau, 0.45, 0.92)));
        W.squash = Math.sin(seg(tau, 0.35, 0.78) * Math.PI * 5) ** 2 * (1 - smooth(seg(tau, 0.7, 0.8)));
        W.kind = 'snow';
        break;
      case 'clear':
        W.cloud = lerp(from.cloud, 0, smooth(seg(tau, 0.3, 0.8)));
        W.rain = lerp(from.rain, 0, smooth(seg(tau, 0.25, 0.6)));
        W.snow = lerp(from.snow, 0, smooth(seg(tau, 0.25, 0.75)));
        W.kind = 'clear';
        break;
      case 'monsters':
        E.show = lerp(from.show, 1, smooth(seg(tau, 0.58, 0.95)));
        ps.sackVis = smooth(seg(tau, 0.14, 0.24));
        ps.sackPos = seg(tau, 0.22, 0.5);
        ps.sackTip = smooth(seg(tau, 0.48, 0.66));
        break;
      case 'swap': {
        const k = seg(tau, 0.3, 0.8);
        if (k >= 0.5 && E.swap < 0.5) {
          E.set = 1 - E.set;
          E.swap = 1;
        }
        if (tau >= 1) E.swap = 0;
        ps.swapScale = Math.abs(Math.cos(Math.PI * smooth(k)));
        ps.set = E.set;
        break;
      }
    }
    // the persistent half is re-read into this frame's props
    if (kind.startsWith('light')) {
      ps.night = L.night;
      ps.lanternLit = lerp(1, ps.night, smooth(seg(lastU, 0.6, 1.5)));
    } else if (kind === 'rain' || kind === 'snow' || kind === 'clear') {
      ps.cloud = W.cloud;
      ps.rain = W.rain;
      ps.snow = W.snow;
      ps.squash = W.squash;
    } else if (kind === 'monsters') {
      for (let i = 0; i < 3; i++) ps.show[i] = clamp(E.show * 1.3 - i * 0.15);
      ps.set = E.set;
    }
  }

  return { frame, effective, hands, die, engaged: () => lastU < 0.2 };
}

export const seqNight = (u: number) => smooth(seg(u, 2.95, 3.25)) * (1 - smooth(seg(u, 3.62, 3.86)));
export const seqRain = (u: number) => smooth(seg(u, 4.95, 5.15)) * (1 - smooth(seg(u, 5.45, 5.65)));
