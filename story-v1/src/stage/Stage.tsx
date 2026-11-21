import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { heroFraming, solveGoblinRim, solveGoblinScale, stageHeroRig, parkHeroRig, HERO_FOV, ISLAND_RX } from '../hero/film/stages/hero.ts';
import { build as buildKit, readPlan, type Plan } from '../island/kit';
import { createBlockout, clocks, DRAWN, type Blockout } from '../island/blockout';
import { stepLife } from '../island/life';
import { createFire, type Fire } from '../island/fire';
import { createHeroLife, type HeroLife } from '../hero/film/stages/heroLife.ts';
import { rig } from '../hero/film/stages/trilayer.ts';
import { prmAmbient } from '../hero/film/stages/rigs.ts';
import { setPencilResolution, STROKE_LAYER } from '../hero/film/pencil.ts';
import { HERO_DOLLY } from '../hero/film/motion.ts';
import { clock, stepClock } from './clock';
import { clamp, lerp, seg, smooth, smoother } from './ease';
import {
  solveFramings, islandPose, placeCamera, heldPose, prmDip, inRoom, ROOM_FROM, ROOM_TO,
  type Framings, type Pose,
} from './camera';
import { buildWorld, newPropState } from './world';
import { createDirector, type Director } from './director';
import { frameHooks, stats, prm, sceneOut, live as bus, nav, capture } from './bus';

const DEG = Math.PI / 180;

// BEAT 0 (rebuild). The hero is the kit island; the old film takes over the moment the scroll begins,
// until its beats are rebuilt too. The kit is in metres, about 5.2 from middle to rim, and its front
// faces +Z; the hero camera stands on the -Z side of an island 2.6 units from middle to rim.
const KIT_HERO_UNTIL = 0.06;
const KIT_SCALE = ISLAND_RX / 7.2; // smaller than rim-to-rim, so its tall trees stay inside the hero frame

interface KitHero {
  scene: THREE.Scene; float: THREE.Group; root: THREE.Group; mixers: THREE.AnimationMixer[];
  // the entrance (blockout.ts): drawn as a pencil blockout, then painted. The pencil starts with the plan
  // (`since`) and is what the visitor watches while the page loads; the paint starts (`paintAt`) once the
  // models are in (`loaded`), the load gate has opened (`ready`) and the drawing is whole
  draw: Blockout; since: number; loaded: boolean; ready: boolean; paintAt: number | null;
  // the camera's way in (blender/hero_dolly.py): where it is, frame by frame, relative to where it rests.
  // While the page loads it only creeps along the start of the move; the rest is run with the paint
  move: Dolly;
  // the wash of sky round the island: how far in it is (0 to 1, with the paint), its middle and reach on screen
  sky: { uSky: THREE.IUniform<number>; uCentre: THREE.IUniform<THREE.Vector2>; uReach: THREE.IUniform<THREE.Vector2> };
  fog: THREE.Fog;
  // the campfire's embers, smoke and flicker (fire.ts), once the models are in
  fire: Fire | null;
}
interface Dolly { fps: number; az: number[]; el: number[]; d: number[] }

/** Where the camera is `t` seconds into its move: round and up from rest in radians, and its distance over rest's. */
function dollyAt(move: Dolly, t: number) {
  const at = Math.min(move.az.length - 1, Math.max(0, t * move.fps));
  const i = Math.min(move.az.length - 2, Math.floor(at)), k = at - i;
  return { az: lerp(move.az[i], move.az[i + 1], k), el: lerp(move.el[i], move.el[i + 1], k), d: lerp(move.d[i], move.d[i + 1], k) };
}

// how the kit island is first seen: from in front and lower than the old film's hero, so its side and the rock
// under it show. The film's own hero pose takes over as the scroll begins.
const KIT_VIEW = { az: 3 * DEG, el: 23 * DEG };
const CREEP = { rate: 0.2, most: 0.7 }; // seconds of the move spent per second of drawing at first, and at most
// the rest goes a little slower than it was keyed, so it settles gently just after the paint has crossed, and
// takes this long to gather that speed
const RUN = { rate: 0.85, gather: 1.4 };

/** How far into its move the camera is, in the move's own seconds: creeping ever slower while the pencil works,
 *  never quite stopping, then gathering speed from that creep as the paint starts. No step in speed anywhere. */
function moved(drawing: number, painting: number) {
  const creep = (t: number) => CREEP.most * (1 - Math.exp((-t * CREEP.rate) / CREEP.most));
  if (painting <= 0) return creep(drawing);
  const began = drawing - painting;
  const slow = CREEP.rate * Math.exp((-began * CREEP.rate) / CREEP.most);
  const k = Math.min(1, painting / RUN.gather);
  // the speed eases from the creep's to the run's; this is that ease summed
  const gathered = RUN.gather * (k * k * k - (k * k * k * k) / 2) + Math.max(0, painting - RUN.gather);
  return creep(began) + slow * painting + (RUN.rate - slow) * gathered;
}

// The island hangs in its own pocket of warm, hazy sky (blender/out/look/island_sky.png): a wash round it, peach
// under it and pale blue over it, thinning to the bare page well before the page's edge. The colours are written
// as the screen shows them.
const HAZE = '#f3dcc0';
const SKY = /* glsl */ `
  uniform float uSky;
  uniform vec2 uCentre;
  uniform vec2 uReach;
  varying vec2 vNdc;
  void main() {
    vec2 q = (vNdc - uCentre) / uReach; // 1 at the island's rim
    vec3 low = vec3(0.961, 0.824, 0.651), mid = vec3(0.973, 0.918, 0.824), high = vec3(0.914, 0.937, 0.941);
    float t = clamp(0.5 + q.y * 0.22, 0.0, 1.0);
    vec3 c = t < 0.5 ? mix(low, mid, t * 2.0) : mix(mid, high, t * 2.0 - 1.0);
    float a = uSky * (1.0 - smoothstep(1.0, 2.3, length(q))) * (1.0 - smoothstep(0.75, 1.0, abs(vNdc.y)));
    gl_FragColor = vec4(c * a, a);
  }
`;

function kitHeroScene(plan: Plan, move: Dolly, since: number): KitHero {
  const draw = createBlockout(plan, KIT_SCALE);
  const root = new THREE.Group(); // the drawing now, and the models beside it when they arrive
  root.add(draw.group);
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(HAZE, 1, 100);
  scene.fog = fog;
  const sky = { uSky: { value: 0 }, uCentre: { value: new THREE.Vector2() }, uReach: { value: new THREE.Vector2(1, 1) } };
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: sky,
      vertexShader: 'varying vec2 vNdc; void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }',
      fragmentShader: SKY,
      // drawn at the far plane after everything solid, so it fills only what the island and clouds left empty
      transparent: true, premultipliedAlpha: true, depthWrite: false,
    }),
  );
  backdrop.frustumCulled = false;
  scene.add(backdrop);
  scene.add(new THREE.HemisphereLight('#e6ecff', '#7a6650', 1.15));
  const key = new THREE.DirectionalLight('#ffd9a8', 1.75);
  key.position.set(0.52, 0.74, -0.42).multiplyScalar(22);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -3.5;
  sc.right = sc.top = 3.5;
  sc.near = 8;
  sc.far = 40;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.015;
  const fill = new THREE.DirectionalLight('#ccdeff', 0.6);
  fill.position.set(-27, 18, -23);
  const float = new THREE.Group();
  float.add(root);
  const turn = new THREE.Group();
  turn.rotation.y = Math.PI;
  turn.scale.setScalar(KIT_SCALE);
  turn.add(float);
  scene.add(key, key.target, fill, turn);
  return { scene, float, root, mixers: [], draw, since, loaded: false, ready: false, paintAt: null, move, sky, fog, fire: null };
}

interface RoomPose { dir: THREE.Vector3; d: number; look: THREE.Vector3 }

function StageScene() {
  const world = useMemo(() => buildWorld(), []);
  const { camera, size, gl, viewport } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const life = useRef<HeroLife | null>(null);
  const dir = useRef<Director | null>(null);
  const ps = useMemo(() => newPropState(), []);
  const F = useRef<Framings | null>(null);
  const pose = useMemo<Pose>(() => ({ look: new THREE.Vector3(), az: 0, el: 0, d: 1 }), []);
  const rtCam = useMemo(() => new THREE.PerspectiveCamera(HERO_FOV, 1.6, 0.1, 200), []);
  const rt = useRef<THREE.WebGLRenderTarget | null>(null);
  const room = useRef<{ F: RoomPose; R1: RoomPose; R2: RoomPose; C: THREE.Vector3 } | null>(null);
  const live = useRef({
    wt: 0, t: 0,
    hover: { yaw: 0, pitch: 0, vy: 0, vp: 0, ty: 0, tp: 0 },
    drag: null as null | { x: number; y: number; ty: number; tp: number },
    glowBase: 1.15,
  });

  // ---- mount: rig, life, director, the laptop screen material
  useEffect(() => {
    stageHeroRig();
    const l = createHeroLife(world.hero, { engaged: () => dir.current?.engaged() ?? true });
    life.current = l;
    const d = createDirector(world.hero, {
      onDieFire: () => window.dispatchEvent(new CustomEvent('gg-die')),
    });
    dir.current = d;
    bus.effective = d.effective;
    world.taperMount(world.hero.goblin.armR.wrist);
    gl.localClippingEnabled = true;
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__stage = { world, life: l, director: d, camera, gl, clock, rig, ps };
    return () => {
      l.dispose();
      life.current = null;
      parkHeroRig();
    };
  }, [world, gl, camera]);

  // ---- the kit island for the hero. Its plan is two small files, and the drawing starts as soon as they are
  // in: that is the loading screen. The models follow, and the load gate below waits for them. If any of it
  // cannot load, the old hero stays
  const kit = useRef<KitHero | null>(null);
  const kitTried = useRef(false); // until the plan has loaded or failed the hero draws nothing: the page opens blank
  useEffect(() => {
    let on = true;
    const mixers: THREE.AnimationMixer[] = [];
    const made = Promise.all([readPlan(), fetch('/models/kit/hero_dolly.json').then((r) => r.json() as Promise<Dolly>)])
      .then(([plan, move]) => {
        if (!on) return;
        const k = kitHeroScene(plan, move, live.current.t);
        kit.current = k;
        return buildKit(mixers, plan).then((built) => {
          if (!on) return;
          k.root.add(built.root);
          k.draw.attach(built.root);
          k.fire = createFire(built.root, k.draw.popped);
          k.mixers = mixers;
          k.loaded = true;
        });
      })
      .catch(() => {
        if (on) kit.current = null;
      })
      .then(() => {
        if (on) kitTried.current = true;
      });
    world.loading.push(made);
    // the paint waits for the load gate, so none of it is spent on a page still warming up
    const begin = () => {
      if (kit.current) kit.current.ready = true;
    };
    window.addEventListener('gg-ready', begin);
    return () => {
      on = false;
      kit.current = null;
      kitTried.current = false;
      window.removeEventListener('gg-ready', begin);
    };
  }, [world, cam]);

  // ---- pointer: hover rotates the island (heavy), touch drags it
  useEffect(() => {
    const L = live.current;
    const move = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      if (e.pointerType === 'mouse') {
        L.hover.ty = nx * 25;
        L.hover.tp = ny * 8;
        life.current?.onPointer(nx, ny, camera, false);
      } else if (L.drag) {
        L.hover.ty = clamp(L.drag.ty + ((e.clientX - L.drag.x) / window.innerWidth) * 70, -25, 25);
        L.hover.tp = clamp(L.drag.tp - ((e.clientY - L.drag.y) / window.innerHeight) * 30, -8, 8);
      }
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      L.drag = { x: e.clientX, y: e.clientY, ty: L.hover.ty, tp: L.hover.tp };
      life.current?.glance();
    };
    const up = () => (L.drag = null);
    const el = gl.domElement;
    window.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', up, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [camera, gl]);

  // ---- resize: every framing is solved here, never per frame
  useEffect(() => {
    const f = solveFramings(size.width, size.height);
    F.current = f;
    cam.fov = HERO_FOV;
    cam.near = 0.1;
    cam.far = 200;
    cam.updateProjectionMatrix();
    cam.layers.enable(STROKE_LAYER);
    rtCam.layers.enable(STROKE_LAYER);
    setPencilResolution(size.width, size.height);
    solveGoblinScale(world.hero.goblin, size.width, size.height);
    solveGoblinRim(world.hero.goblin, size.width, size.height);
    live.current.glowBase = size.width < 560 ? 0.9 : 1.15;
    const hf = heroFraming(size.width, size.height);
    const worldPerPx = (2 * hf.d * Math.tan((HERO_FOV * DEG) / 2)) / size.height;
    life.current?.setTouchRadius(90 * worldPerPx);

    // render target for the laptop screen: the 16:10 rect, at device pixels
    const dpr = viewport.dpr;
    const rw = Math.max(2, Math.round(f.rect.w * size.width * dpr));
    const rh = Math.max(2, Math.round(f.rect.h * size.height * dpr));
    rt.current?.dispose();
    rt.current = new THREE.WebGLRenderTarget(rw, rh, { samples: 4, type: THREE.HalfFloatType });
    rtCam.fov = f.rtFov;
    rtCam.aspect = 1.6;
    rtCam.updateProjectionMatrix();
    const screen = world.laptop.screen;
    screen.material = new THREE.MeshBasicMaterial({
      map: rt.current.texture, transparent: true, blending: THREE.NoBlending, depthWrite: true, toneMapped: false,
    });
    screen.renderOrder = 10;

    // room poses: F = the screen exactly filling the rect; R1 over the DM's shoulder
    world.room.updateMatrixWorld(true);
    const C = new THREE.Vector3().setFromMatrixPosition(screen.matrixWorld);
    const n = new THREE.Vector3(0, 0, 1).transformDirection(screen.matrixWorld).normalize();
    const sc = new THREE.Vector3().setFromMatrixScale(screen.matrixWorld);
    const geo = (screen.geometry as THREE.PlaneGeometry).parameters;
    const sw = geo.width * sc.x;
    const sh = geo.height * sc.y;
    const aspect = size.width / size.height;
    const t16 = Math.tan((HERO_FOV * DEG) / 2);
    const dF = aspect >= 1.6 ? sh / 2 / t16 : sw / 2 / (t16 * aspect);
    const Fp: RoomPose = { dir: n.clone(), d: dF, look: C.clone() };
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, n).normalize();
    const r1dir = n.clone().addScaledVector(up, 0.16).addScaledVector(right, -0.34).normalize();
    const r1look = C.clone().add(new THREE.Vector3(0, -0.2, -4.6));
    const R1: RoomPose = { dir: r1dir, d: fitRoom(r1dir, r1look, world.roomFitPoints, aspect), look: r1look };
    const r2dir = r1dir.clone().addScaledVector(right, -0.12).normalize();
    const R2: RoomPose = { dir: r2dir, d: R1.d * 0.95, look: r1look.clone().add(new THREE.Vector3(0.3, 0, 0)) };
    room.current = { F: Fp, R1, R2, C };

    // warm every shader now, not on the frame a prop first appears: compile() only
    // walks visible objects, so everything is shown for the call and then restored
    const shown: THREE.Object3D[] = [];
    for (const sc of [world.island, world.room])
      sc.traverse((o) => {
        if (!o.visible) {
          shown.push(o);
          o.visible = true;
        }
      });
    gl.compile(world.island, cam);
    gl.compile(world.room, cam);
    // the island also draws into the laptop's linear render target — its own programs
    gl.setRenderTarget(rt.current);
    gl.render(world.island, rtCam);
    gl.setRenderTarget(null);
    for (const o of shown) o.visible = false;
  }, [size.width, size.height, viewport.dpr, cam, rtCam, world]);

  // the load gate (review 2): fonts in, every texture resolved, then three drawn frames
  // after the warm-up above — App holds the scroll until `gg-ready`
  useEffect(() => {
    let off = false;
    let done = false;
    const h = () => {
      if (done || stats.frames < need) return;
      done = true;
      window.dispatchEvent(new Event('gg-ready'));
    };
    let need = Infinity;
    Promise.all([document.fonts?.ready ?? Promise.resolve(), ...world.loading]).then(() => {
      if (off) return;
      need = stats.frames + 3;
      frameHooks.push(h);
    });
    return () => {
      off = true;
      const i = frameHooks.indexOf(h);
      if (i >= 0) frameHooks.splice(i, 1);
    };
  }, [world]);

  // the after-page stills: three framings of the live island, in the visitor's state
  useEffect(() => {
    capture.fn = async () => {
      while (!life.current?.entranceDone()) await new Promise((r) => setTimeout(r, 100));
      const w = 960, h = 600;
      const f = solveFramings(w, h); // stills are landscape on every device
      const target = new THREE.WebGLRenderTarget(w, h, { samples: 4 });
      const c = new THREE.PerspectiveCamera(HERO_FOV, w / h, 0.1, 200);
      c.layers.enable(STROKE_LAYER);
      const shots: Pose[] = [
        { ...f.dock, look: f.dock.look.clone(), d: f.dock.d * 0.92 },
        { look: new THREE.Vector3(-0.9, 0, -0.2), az: 0.25, el: 38 * DEG, d: 4.2 },
        { ...f.push, look: f.push.look.clone(), az: 0.35, d: f.push.d * 1.25 },
      ];
      const buf = new Uint8Array(w * h * 4);
      const out: string[] = [];
      const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#f7f5f0';
      for (const p of shots) {
        // one shot per frame so the page never stalls for all three at once
        await new Promise((r) => requestAnimationFrame(r));
        placeCamera(c, p);
        c.updateMatrixWorld();
        setPencilResolution(w, h);
        gl.setRenderTarget(target);
        gl.setClearColor(paper, 1);
        gl.clear();
        gl.render(world.island, c);
        gl.readRenderTargetPixels(target, 0, 0, w, h, buf);
        gl.setRenderTarget(null);
        gl.setClearColor(0x000000, 0);
        setPencilResolution(size.width, size.height);
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d')!;
        const img = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) img.data.set(buf.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
        ctx.putImageData(img, 0, 0);
        const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, 'image/jpeg', 0.86));
        out.push(blob ? URL.createObjectURL(blob) : '');
      }
      target.dispose();
      return out;
    };
    return () => {
      capture.fn = null;
    };
  }, [gl, world, size.width, size.height]);

  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpLook = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const q2 = useMemo(() => new THREE.Quaternion(), []);
  const axY = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const axR = useMemo(() => new THREE.Vector3(), []);
  const rpA = useMemo<RoomPose>(() => ({ dir: new THREE.Vector3(), d: 1, look: new THREE.Vector3() }), []);
  const handsSpare = useMemo(() => ({ r: new THREE.Vector3(), l: new THREE.Vector3() }), []);

  const tick = (delta: number, draw = true) => {
    const dt = Math.min(delta, 0.1);
    const L = live.current;
    const f = F.current;
    const d = dir.current;
    const l = life.current;
    if (!f || !d || !l) return;
    stepClock(dt);
    const u = clock.u;
    while (world.pendingTextures.length) gl.initTexture(world.pendingTextures.pop()!);
    // a page that loads (or is restored) mid-film skips the hero's entrance
    if (u > 0.02 && !l.entranceDone()) l.skip();
    L.t += dt;
    L.wt += dt * (1 - ps.freeze); // the world clock stops in the freeze; he doesn't
    const reduced = prm.reduced;

    // ---- hover spring (critically damped, heavy) and its decay into the dock
    const H = L.hover;
    const w = 3.6;
    for (const [k, v, tgt] of [['yaw', 'vy', H.ty], ['pitch', 'vp', H.tp]] as const) {
      const x0 = H[k] - tgt;
      const e = Math.exp(-w * dt);
      const kk = H[v] + w * x0;
      H[k] = tgt + (x0 + kk * dt) * e;
      H[v] = (H[v] - w * kk * dt) * e;
    }
    const hw = (1 - smooth(seg(u, 0, 0.9))) * (reduced ? 0 : 1);

    // ---- camera
    const roomMode = inRoom(u);
    if (!roomMode) {
      let p = reduced ? heldPose(u, f) : islandPose(u, f, pose);
      const hero = u < KIT_HERO_UNTIL ? kit.current : null;
      if (hero) {
        // the kit island's own view, easing into the film's as the scroll begins
        if (p !== pose) {
          pose.look.copy(p.look);
          pose.d = p.d;
          pose.az = p.az;
          pose.el = p.el;
          p = pose;
        }
        const w = 1 - smooth(seg(u, 0, KIT_HERO_UNTIL));
        p.az += (KIT_VIEW.az - f.hero.az) * w;
        p.el += (KIT_VIEW.el - f.hero.el) * w;
        if (hero.paintAt === null && hero.loaded && hero.ready && L.t - hero.since >= DRAWN) hero.paintAt = L.t;
        if (!reduced) {
          // its way in: close over the drawing, creeping, then back and round to that view as the paint crosses
          const [drawing, painting] = clocks(L.t - hero.since, hero.paintAt === null ? -1 : L.t - hero.paintAt);
          const m = dollyAt(hero.move, moved(drawing, painting));
          p.az += m.az * w;
          p.el += m.el * w;
          p.d *= 1 + (m.d - 1) * w;
        }
      }
      placeCamera(cam, p);
      cam.updateMatrixWorld();
      // breath (still under reduced motion) + the hover orbit about the island's centre
      const breath = 1 + HERO_DOLLY.amp * prmAmbient() * Math.sin((L.t * Math.PI * 2) / HERO_DOLLY.periodS) * hw;
      tmpPos.copy(cam.position).sub(p.look).multiplyScalar(breath).add(p.look);
      tmpLook.copy(p.look);
      if (hw > 0) {
        axR.setFromMatrixColumn(cam.matrixWorld, 0);
        q.setFromAxisAngle(axY, -H.yaw * DEG * hw);
        q2.setFromAxisAngle(axR, H.pitch * DEG * hw);
        q.multiply(q2);
        tmpPos.applyQuaternion(q);
        tmpLook.applyQuaternion(q);
      }
      cam.position.copy(tmpPos);
      cam.lookAt(tmpLook);
      rig.depthNear.value = p.d * 0.95;
      rig.depthFar.value = p.d * 2.4;
    } else {
      // the island lives on the laptop from the screen framing; the room camera moves
      const R = room.current!;
      let a: RoomPose, b: RoomPose, t: number;
      if (reduced) {
        const held = u < 13.25 || u >= 16.65 ? R.F : R.R1;
        a = b = held;
        t = 0;
      } else if (u < 14.5) [a, b, t] = [R.F, R.R1, smoother(seg(u, ROOM_FROM, 14.5))];
      else if (u < 16) [a, b, t] = [R.R1, R.R2, smoother(seg(u, 14.5, 16))];
      else [a, b, t] = [R.R2, R.F, smoother(seg(u, 16, ROOM_TO))];
      rpA.dir.copy(a.dir).lerp(b.dir, t).normalize();
      rpA.d = Math.exp(lerp(Math.log(a.d), Math.log(b.d), t));
      rpA.look.lerpVectors(a.look, b.look, t);
      cam.position.copy(R.C).addScaledVector(rpA.dir, rpA.d);
      cam.lookAt(rpA.look);
      placeCamera(rtCam, f.screen);
      rig.depthNear.value = f.screen.d * 0.95;
      rig.depthFar.value = f.screen.d * 2.4;
    }
    cam.updateMatrixWorld();

    // ---- lights + life
    const hero = world.hero;
    hero.rigs.update(L.wt);
    hero.rigs.glow.intensity *= l.state.glow;
    if (hero.glowSprite) hero.glowSprite.scale.setScalar(L.glowBase * l.state.glow * Math.max(0.001, ps.lanternLit) * (1 + 0.5 * ps.night) * (1 - 0.7 * ps.freeze));
    l.update(L.wt, dt, cam);

    // ---- the director: goblin + prop state; then the props
    const lens = roomMode ? rtCam : cam;
    lens.updateMatrixWorld();
    if (l.entranceDone()) d.frame(u, dt, lens, ps);
    sceneOut.night = ps.night;
    sceneOut.freeze = ps.freeze;
    world.updateIsland(u, ps, L.wt, lens, l.entranceDone() ? d.hands : handsSpare, l.entranceDone(), l.toggles);

    // ---- render (nothing to draw once the page has carried the stage away)
    const W = size.width, Hh = size.height;
    if (!draw) return;
    if (!nav.stageVisible) {
      for (const h of frameHooks) h(u, dt);
      return;
    }
    const canvas = gl.domElement;
    canvas.style.opacity = reduced ? String(prmDip(u) * roomDip(u)) : '1';
    if (!roomMode) {
      // the grid acquires edges: everything is clipped toward the laptop's 16:10 rect
      const s = u >= ROOM_TO ? 1 : smooth(seg(u, 12.6, ROOM_FROM));
      if (s > 0) {
        const rx = lerp(0, f.rect.x, s) * W, ry = lerp(0, f.rect.y, s) * Hh;
        const rw = lerp(1, f.rect.w, s) * W, rh = lerp(1, f.rect.h, s) * Hh;
        gl.setScissorTest(true);
        gl.setScissor(rx, Hh - ry - rh, rw, rh);
        gl.clear();
        gl.render(world.island, cam);
        gl.setScissorTest(false);
      } else if (!kit.current && !kitTried.current && u < KIT_HERO_UNTIL) {
        // the kit's plan is still loading: leave the paper bare, so the drawing is the first thing seen
      } else if (kit.current && u < KIT_HERO_UNTIL) {
        // the hero: the kit island afloat (a slow bob and drift, held still under reduced motion), the goblin idling
        const k = kit.current;
        const m = reduced ? 0 : 1;
        for (const mixer of k.mixers) mixer.update(dt * m);
        k.float.position.y = (Math.sin(L.t * 0.9) * 0.13 + Math.sin(L.t * 0.37) * 0.05) * m;
        k.float.rotation.y = Math.sin(L.t * 0.27) * 0.1 * m;
        // the page opens as paper: the sky comes in behind the island as the paint crosses it, and goes again
        // as the scroll begins, since the film after this beat is still drawn on paper
        const painted = reduced
          ? k.draw.at(Infinity, k.loaded ? Infinity : -1)
          : k.draw.at(L.t - k.since, k.paintAt === null ? -1 : L.t - k.paintAt);
        // what lives on it once painted (life.ts, fire.ts): wind in the trees, drifting clouds, the fire. After
        // the entrance has set the lamps, since the fire's flicker rides on them
        stepLife(dt, m);
        k.fire?.update(dt * m, m);
        k.sky.uSky.value = painted * painted * (3 - 2 * painted) * (1 - smooth(seg(u, 0.015, KIT_HERO_UNTIL)));
        // the wash follows the island on the screen, and reaches as far as the island is wide there
        const reach = (5.2 * KIT_SCALE) / (cam.position.length() * Math.tan((cam.fov * DEG) / 2));
        tmpPos.set(0, 0, 0).project(cam);
        k.sky.uCentre.value.set(tmpPos.x, tmpPos.y);
        k.sky.uReach.value.set(reach / cam.aspect, reach);
        // haze begins at the island's near rim and thickens behind it
        k.fog.near = cam.position.length() - 5.2 * KIT_SCALE;
        k.fog.far = k.fog.near + 40 * KIT_SCALE;
        gl.render(k.scene, cam);
      } else gl.render(world.island, cam);
    } else {
      // island → texture through the screen camera (same pose as the last direct frame).
      // The texture is drawn at the resolution the screen actually covers on the page:
      // full at the handoffs, falling as the crane pulls back (a pure function of u).
      const target = rt.current!;
      const k = screenScale(world.laptop.screen, cam, f.rect.h * Hh, Hh);
      target.viewport.set(0, 0, Math.ceil(target.width * k), Math.ceil(target.height * k));
      const map = (world.laptop.screen.material as THREE.MeshBasicMaterial).map!;
      map.repeat.set(Math.ceil(target.width * k) / target.width, Math.ceil(target.height * k) / target.height);
      setPencilResolution(f.rect.w * W * k, f.rect.h * Hh * k);
      gl.setRenderTarget(target);
      gl.clear();
      gl.render(world.island, rtCam);
      gl.setRenderTarget(null);
      setPencilResolution(W, Hh);
      world.updateRoom(u, L.wt, cam);
      gl.render(world.room, cam);
    }

    for (const h of frameHooks) h(u, dt);
    stats.frames++;
  };
  useFrame((_, delta) => tick(delta), 1);

  // dev: evaluate the whole stage at any u, synchronously, without drawing — the
  // continuity sweeps read camera, goblin and prop transforms from this
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const g = world.hero.goblin;
    const v = new THREE.Vector3();
    const fwd = new THREE.Vector3();
    (window as unknown as Record<string, unknown>).__probe = (u: number) => {
      clock.u = clock.target = u;
      clock.v = 0;
      tick(0, false);
      cam.updateMatrixWorld();
      cam.getWorldDirection(fwd);
      const out: number[] = [...cam.position.toArray(), ...fwd.toArray()];
      g.root.getWorldPosition(v);
      out.push(...v.toArray(), Math.sin(g.root.rotation.y), Math.cos(g.root.rotation.y));
      out.push(g.chest.rotation.x, g.neck.rotation.y, g.head.rotation.y, g.head.rotation.x, g.armR.pose.rotation.x, g.legR.pose.rotation.x);
      const d = dir.current!;
      out.push(...d.hands.r.toArray());
      out.push(ps.night, ps.cloud, ps.rain, ps.freeze, ps.sackPos, ps.show[0], ps.rollT, rig.seamX.value);
      return out;
    };
  }, [world, cam]);

  return null;
}

/** the laptop screen's projected height as a fraction of its full-fill height */
const corner = new THREE.Vector3();
function screenScale(screen: THREE.Mesh, cam: THREE.Camera, fillPx: number, H: number): number {
  const g = (screen.geometry as THREE.PlaneGeometry).parameters;
  let y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    corner.set((x * g.width) / 2, (y * g.height) / 2, 0).applyMatrix4(screen.matrixWorld).project(cam);
    y0 = Math.min(y0, corner.y);
    y1 = Math.max(y1, corner.y);
  }
  return clamp((((y1 - y0) / 2) * H) / fillPx, 0.3, 1);
}

/** under reduced motion the room's held framings swap at a paper dip too */
function roomDip(u: number) {
  return Math.min(clamp(Math.abs(u - 13.25) / 0.18), clamp(Math.abs(u - 16.65) / 0.18));
}

/** distance along `dir` from `look` at which every point fits the frame */
function fitRoom(dirV: THREE.Vector3, look: THREE.Vector3, pts: THREE.Vector3[], aspect: number): number {
  const c = new THREE.PerspectiveCamera(HERO_FOV, aspect, 0.1, 500);
  const v = new THREE.Vector3();
  let d = 20;
  for (let i = 0; i < 12; i++) {
    c.position.copy(look).addScaledVector(dirV, d);
    c.lookAt(look);
    c.updateMatrixWorld();
    let m = 0;
    for (const p of pts) {
      v.copy(p).project(c);
      m = Math.max(m, Math.abs(v.x) / 0.9, Math.abs(v.y) / 0.86);
    }
    d *= 0.35 + 0.65 * m;
  }
  return d;
}

export default function Stage() {
  return (
    <Canvas
      className="stage-canvas"
      flat
      shadows="percentage"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: HERO_FOV, near: 0.1, far: 200, position: [0, 5, -9] }}
    >
      <StageScene />
    </Canvas>
  );
}
