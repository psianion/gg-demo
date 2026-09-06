#!/usr/bin/env node
// THE PLAN §4.4 — prove the basis convention for setView()/setMarksView().
//
// foliageKit.ts `setView(az, elev)` and marksKit.ts `setMarksView(az, elev)` both build:
//   VIEW_R   = (cos az, 0, sin az)                                     — screen-right, ground plane
//   VIEW_CAM = (sin az · cos elev, sin elev, −cos az · cos elev)       — unit vector toward the camera
// This is IDENTICAL, term for term, to hero.ts's own camera placement in `heroFraming()`:
//   cam.position − look = d · (cos elev · sin az, sin elev, −cos elev · cos az)
// i.e. VIEW_CAM is exactly the (look → camera) unit vector in the hero's own az/elev convention.
//
// THE PLAN §4.4 says: az = atan2(cz − fz, cx − fx). That is the *standard* atan2(z, x)
// angle of the (dx, dz) vector — NOT the angle setView/setMarksView expect. Solving
// VIEW_CAM's x/z rows for az shows the kit's az is measured off −Z toward +X:
//   az_kit = atan2(dx, −dz)  =  atan2(dz, dx) + 90°  =  planAz + 90°
// (elevation is untouched: atan2(dy, hypot(dx,dz)) is the same expression in both places.)
//
// This script proves it three ways: (1) algebra against HERO_AZ/HERO_ELEV, (2) a REAL
// THREE.PerspectiveCamera's true right/back axes vs. the kit's VIEW_R/VIEW_CAM, for the
// hero shot and three timeline.ts shots, (3) shotView()'s output reproduces HERO_AZ/ELEV.

import * as THREE from 'three';

const DEG = Math.PI / 180;
const HERO_AZ = 18 * DEG;
const HERO_ELEV = 33 * DEG;

// ---- exactly setView()/setMarksView()'s math (foliageKit.ts / marksKit.ts) ----
function kitBasis(az, elev) {
  const VIEW_R = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
  const VIEW_CAM = new THREE.Vector3(
    Math.sin(az) * Math.cos(elev),
    Math.sin(elev),
    -Math.cos(az) * Math.cos(elev),
  );
  return { VIEW_R, VIEW_CAM };
}

// ---- THE PLAN §4.4's literal formula ----
function planFormula(cam, look) {
  const dx = cam[0] - look[0];
  const dy = cam[1] - look[1];
  const dz = cam[2] - look[2];
  return { az: Math.atan2(dz, dx), elev: Math.atan2(dy, Math.hypot(dx, dz)) };
}

// ---- the corrected convention (this is what `shotView` in foliageKit.ts implements) ----
function shotView(cam, look) {
  const dx = cam[0] - look[0];
  const dy = cam[1] - look[1];
  const dz = cam[2] - look[2];
  return { az: Math.atan2(dx, -dz), elev: Math.atan2(dy, Math.hypot(dx, dz)) };
}

// ---- independent geometric truth: a real camera's true right / true back axes ----
function trueAxes(cam, look) {
  const c = new THREE.PerspectiveCamera(32, 1440 / 900, 0.1, 200);
  c.position.set(...cam);
  c.lookAt(new THREE.Vector3(...look));
  c.updateMatrixWorld();
  return {
    right: new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 0),
    back: new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 2), // local +Z = toward the camera
  };
}

function angleDeg(a, b) {
  return (Math.acos(THREE.MathUtils.clamp(a.dot(b) / (a.length() * b.length()), -1, 1)) * 180) / Math.PI;
}

// hero's own camera, built the same way heroFraming() builds it (direction only; d, look origin
// don't affect az/elev extraction or the axis angles below)
const heroCam = [
  10 * Math.cos(HERO_ELEV) * Math.sin(HERO_AZ),
  10 * Math.sin(HERO_ELEV),
  -10 * Math.cos(HERO_ELEV) * Math.cos(HERO_AZ),
];
const heroLook = [0, 0, 0];

const shots = [
  { name: 'hero (HERO_AZ 18°/HERO_ELEV 33°)', cam: heroCam, look: heroLook },
  { name: 'cam(4)  [102,1.6,2.2]→[117.4,3.8,0.2]', cam: [102, 1.6, 2.2], look: [117.4, 3.8, 0.2] },
  { name: 'cut(7.5) [114.4,7.2,3.0]→[117.6,6.4,0]', cam: [114.4, 7.2, 3.0], look: [117.6, 6.4, 0] },
  { name: 'cut(16.5) [2.5,1.1,3.2]→[2.5,0.7,0.9]', cam: [2.5, 1.1, 3.2], look: [2.5, 0.7, 0.9] },
  { name: 'ground.ts S3 follow-cam (C2_AZ/C2_ELEV source)', cam: [-3.2, 1.6, 2.8], look: [0, 0.8, 0] },
];

console.log('--- step 2: hero-camera check ---');
const heroPlan = planFormula(heroCam, heroLook);
console.log(
  `HERO_AZ=${(HERO_AZ / DEG).toFixed(2)}°  HERO_ELEV=${(HERO_ELEV / DEG).toFixed(2)}°   ` +
    `plan-formula az=${(heroPlan.az / DEG).toFixed(2)}°  elev=${(heroPlan.elev / DEG).toFixed(2)}°   ` +
    `diff(az)=${((HERO_AZ - heroPlan.az) / DEG).toFixed(2)}°`,
);

console.log('\n--- step 3: angle table (0° = convention is right, ~90° = convention is off) ---');
console.log(
  ['shot', 'plan az', 'plan elev', 'shotView az', 'R∠trueRight(plan)', 'R∠trueRight(shotView)', 'CAM∠trueBack(plan)', 'CAM∠trueBack(shotView)'].join(
    ' | ',
  ),
);
for (const s of shots) {
  const plan = planFormula(s.cam, s.look);
  const sv = shotView(s.cam, s.look);
  const truth = trueAxes(s.cam, s.look);
  const planBasis = kitBasis(plan.az, plan.elev);
  const svBasis = kitBasis(sv.az, sv.elev);
  console.log(
    [
      s.name,
      (plan.az / DEG).toFixed(1) + '°',
      (plan.elev / DEG).toFixed(1) + '°',
      (sv.az / DEG).toFixed(1) + '°',
      angleDeg(planBasis.VIEW_R, truth.right).toFixed(1) + '°',
      angleDeg(svBasis.VIEW_R, truth.right).toFixed(1) + '°',
      angleDeg(planBasis.VIEW_CAM, truth.back).toFixed(1) + '°',
      angleDeg(svBasis.VIEW_CAM, truth.back).toFixed(1) + '°',
    ].join(' | '),
  );
}

console.log('\n--- step 4: shotView(heroCam, heroLook) ≈ (HERO_AZ, HERO_ELEV) ---');
const svHero = shotView(heroCam, heroLook);
console.log(
  `shotView → az=${(svHero.az / DEG).toFixed(3)}° elev=${(svHero.elev / DEG).toFixed(3)}°   ` +
    `HERO_AZ=${(HERO_AZ / DEG).toFixed(3)}° HERO_ELEV=${(HERO_ELEV / DEG).toFixed(3)}°   ` +
    `diff az=${((svHero.az - HERO_AZ) / DEG).toExponential(2)}° elev=${((svHero.elev - HERO_ELEV) / DEG).toExponential(2)}°`,
);
