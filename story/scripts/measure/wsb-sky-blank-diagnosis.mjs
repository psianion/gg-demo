// WS-b: WHY does ?mock=sky render blank in Performance and correctly in Prep?
// Reproduces MockSheet.tsx's own fit solve (heroFraming -> union Box3 -> bounding
// sphere -> camera distance d -> rig.depthNear/depthFar) exactly, at slot 0
// (`?mock=sky` alone), then measures each sky leaf's real camera distance against
// those thresholds and evaluates trilayer.ts's own `triFade` formula
// (`smoothstep(uTriNear, uTriFar, triDist)`) — the term that, in the Performance
// branch, does `triPaint = mix(outgoingLight, uTriPaper, triFade)`: at triFade = 1
// the fragment is PAPER regardless of albedo. Prep's branch only dampens its stroke
// term by up to 25% at the same distance (`triMark * (1 - triFade*0.75)`), so the
// two rigs diverge exactly where triFade saturates.
import * as THREE from 'three';
import { buildHero, heroFraming, HERO_FOV } from '../../src/film/stages/hero.ts';
import { buildMock } from '../../src/film/mock/sky.ts';

const W = 1440, H = 900;
const DEG = Math.PI / 180;
const FIRST_X = 6.4; // MockSheet.tsx

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const hero = buildHero();
const mocks = new THREE.Group();
const sky = buildMock();
sky.position.set(FIRST_X, 0, 0); // slot 0, as MockScene places a lone ?mock=sky
mocks.add(sky);

const f = heroFraming(W, H);
const dir = f.position.clone().sub(f.look).normalize();
const box = new THREE.Box3().setFromObject(hero.island.root);
box.expandByObject(mocks);
const sph = box.getBoundingSphere(new THREE.Sphere());
const aspect = W / H;
const vfov = HERO_FOV * DEG;
const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);

for (const zoom of [1, 4]) {
  const d = ((sph.radius * 1.06) / Math.sin(Math.min(vfov, hfov) / 2)) / zoom;
  const camPos = sph.center.clone().addScaledVector(dir, d);
  const depthNear = d * 0.95;
  const depthFar = d * 2.4;
  console.log(`\n== zoom ${zoom} ==  sph.center=(${sph.center.x.toFixed(2)},${sph.center.y.toFixed(2)},${sph.center.z.toFixed(2)}) r=${sph.radius.toFixed(2)}`);
  console.log(`d=${d.toFixed(2)}  camPos=(${camPos.x.toFixed(2)},${camPos.y.toFixed(2)},${camPos.z.toFixed(2)})  depthNear=${depthNear.toFixed(2)}  depthFar=${depthFar.toFixed(2)}`);

  // camera for NDC / on-screen check
  const cam = new THREE.PerspectiveCamera(HERO_FOV, aspect, 0.1, 200);
  cam.position.copy(camPos);
  cam.lookAt(sph.center);
  cam.updateMatrixWorld();

  let i = 0;
  sky.children.forEach((mesh) => {
    if (!mesh.isMesh) return;
    const bb = new THREE.Box3().setFromObject(mesh);
    const c = bb.getCenter(new THREE.Vector3());
    const triDist = camPos.distanceTo(c);
    const fade = smoothstep(depthNear, depthFar, triDist);
    const ndc = c.clone().project(cam);
    const onscreen = Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 && ndc.z > -1 && ndc.z < 1;
    console.log(
      `leaf ${i++}: worldCenter=(${c.x.toFixed(2)},${c.y.toFixed(2)},${c.z.toFixed(2)})  triDist=${triDist.toFixed(2)}  ` +
      `triFade=${fade.toFixed(4)}  onscreenNDC=${onscreen}  ndc=(${ndc.x.toFixed(3)},${ndc.y.toFixed(3)},${ndc.z.toFixed(3)})`,
    );
  });
}
