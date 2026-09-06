import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRigs, flicker } from '../src/film/stages/rigs.ts';
import { createTrilayer, rig } from '../src/film/stages/trilayer.ts';
import { curtain, markAlive } from '../src/film/curtain.ts';
import { FLICKER } from '../src/film/motion.ts';
import { amber, earthTrack, keyWarm, paper, skyDay } from '../src/film/palette.ts';

// P3: the two lighting rigs. What must hold: the flicker IS the motion §3.3 constants
// (drift impossible — the identity below fails if rigs.ts stops computing from
// FLICKER); PRM damps to STILL, not merely reduced; markAlive is permanent; the amber
// glow is the only glow hue; the Performance fill is hero §5's named skyDay at low
// intensity, by palette token; the painted world casts through markCaster and its
// shadows leave with the paint (hero §5 scopes alive-only to the FROZEN page); and
// the alive-shadow rule is structural — the key is the only shadow-casting light, a
// frozen frame's shadow map holds only alive casters, and the Prep side of the
// trilayer receives that shadow.

const fs = await import('node:fs/promises');
const rigsSrc = await fs.readFile(new URL('../src/film/stages/rigs.ts', import.meta.url), 'utf8');
const curtainSrc = await fs.readFile(new URL('../src/film/curtain.ts', import.meta.url), 'utf8');
const triSrc = await fs.readFile(
  new URL('../src/film/stages/trilayer.ts', import.meta.url),
  'utf8',
);

// ---- flicker comes from motion.ts, term for term --------------------------------
assert.match(rigsSrc, /from '\.\.\/motion\.ts'/, 'rigs import the motion vocabulary');
assert.match(rigsSrc, /FLICKER\./, 'and use FLICKER, not re-typed literals');
for (const t of [0, 0.37, 2.9, 11.3, 47.05]) {
  const f = flicker(t, 1);
  assert.equal(f.scale, 1 + FLICKER.scaleAmp * Math.sin(t * FLICKER.scaleRate));
  assert.equal(f.pulse, 1 + FLICKER.pulseAmp * Math.abs(Math.sin(t * FLICKER.pulseRate)));
  assert.equal(
    f.glow,
    FLICKER.glowBase + FLICKER.glowAmp * Math.abs(Math.sin(t * FLICKER.pulseRate)),
  );
}

// ---- PRM damps to STILL — exactly the lit pose, at every t ----------------------
for (const t of [0, 0.1, 1.7, 8.88, 33.3, 65.72]) {
  const f = flicker(t, 0);
  assert.equal(f.scale, 1, 'PRM: flame scale is exactly the lit pose');
  assert.equal(f.pulse, 1, 'PRM: pulse still');
  assert.equal(f.glow, FLICKER.glowBase, 'PRM: glow parked at base — no residual motion');
}
// and it is honoured LIVE, not once at module load (motion §14: no reload)
assert.match(rigsSrc, /prefers-reduced-motion/, 'rigs read the PRM query');
assert.match(rigsSrc, /addEventListener\('change'/, 'and follow live changes');

// ---- markAlive: permanent — the frozen page's only casters ----------------------
const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), createTrilayer({ color: 0x888888 }));
assert.equal(mesh.castShadow, false, 'nothing casts by default');
assert.equal((mesh.material as THREE.Material).userData.alive.value, 0);
markAlive(mesh);
assert.equal(mesh.castShadow, true, 'the alive cast');
assert.equal(
  (mesh.material as THREE.Material).userData.alive.value,
  1,
  'an alive trilayer keeps its paint',
);
assert.ok(mesh.layers.isEnabled(1), 'and the mask layer still rides along');
markAlive(mesh); // idempotent
assert.equal(mesh.castShadow, true);
// alive permanence is structural: no source in the rig chain un-marks the alive —
// curtain/trilayer never touch castShadow off; the rig's only castShadow write is the
// update() line whose alive term (mask layer 1) always wins, asserted live below
for (const src of [curtainSrc, triSrc]) {
  assert.ok(!/castShadow\s*=\s*false/.test(src), 'nothing ever sets castShadow = false');
}
for (const src of [rigsSrc, curtainSrc, triSrc]) {
  assert.ok(!/unmark/i.test(src), 'no unmark API exists');
}
assert.ok(
  !/castShadow\s*=\s*(true|false)\b/.test(rigsSrc.replace(/key\.castShadow = true/, '') + triSrc),
  'no mesh is ever made (or un-made) a caster directly — markAlive (curtain.ts) is the ' +
    'permanent site, markCaster registers the painted world, and only the rig update owns ' +
    'world-caster state',
);

// ---- the rigs themselves --------------------------------------------------------
const rigs = createRigs();

// amber #F2C35E is the ONLY glow hue anywhere (art gate)
assert.equal(amber, 0xf2c35e, 'the palette amber is the locked hue');
assert.equal(rigs.glow.color.getHex(), amber, 'the glow is amber');
assert.equal((rigsSrc.match(/new THREE\.PointLight/g) ?? []).length, 1, 'one glow light');
assert.match(rigsSrc, /new THREE\.PointLight\(amber/, 'built from the palette token');
assert.ok(!/0xffb45e/i.test(rigsSrc), 'the v1 glow hue is gone');

// the Performance fill is hero §5's NAMED value, by palette token — and low intensity
assert.equal(skyDay, 0xaccde6, 'the palette skyDay is the hero §5 hex');
assert.equal(rigs.hemi.color.getHex(), skyDay, 'sky fill is skyDay (hero §5, by name)');
assert.equal(rigs.hemi.groundColor.getHex(), earthTrack, 'ground bounce is a palette token');
assert.equal(rigs.flat.color.getHex(), paper, 'Prep flat is PAPER light, by token');
assert.equal(rigs.key.color.getHex(), keyWarm, 'the key is the keyWarm token (hero §5 family)');
assert.ok(!/0xcdd9e8/i.test(rigsSrc) && !/0x8a7458/i.test(rigsSrc), 'the v1 fill hues are gone');
assert.ok(!/0xffffff/i.test(rigsSrc), 'no raw white light — the page is paper, not white');

// the alive-shadow rule, structurally: the key is the ONLY shadow-casting light in
// either rig; Prep's flat light cannot cast by type
assert.equal(rigs.key.castShadow, true, 'the alive private key casts');
assert.equal(rigs.glow.castShadow, false);
assert.equal(rigs.hemi.castShadow ?? false, false);
assert.ok((rigs.flat as THREE.AmbientLight).isAmbientLight, 'Prep light is shadowless by type');

// blending: both rigs live at once, mixed by THE SAME curtain object the trilayer
// mixes by — Performance fades out as Prep rises, the alive key persists through both
const prev = curtain.value;
curtain.value = 0;
rigs.update(1.234);
assert.ok(rigs.hemi.intensity > 0, 'Performance: sky fill on');
assert.ok(rigs.hemi.intensity < rigs.key.intensity, 'and LOW — a fill, never the key (hero §5)');
assert.ok(rigs.glow.intensity > 0, 'Performance: the fire glows');
assert.equal(rigs.flat.intensity, 0, 'Prep flat is silent under Performance');
const keyI = rigs.key.intensity;
curtain.value = 1;
rigs.update(1.234);
assert.equal(rigs.hemi.intensity, 0, 'Prep: the frozen page has no air');
assert.equal(rigs.glow.intensity, 0, 'Prep: a drawn fire emits nothing');
assert.ok(rigs.flat.intensity > 0, 'Prep: flat paper light');
assert.equal(rigs.key.intensity, keyI, 'the alive key persists in both states');
curtain.value = 0.5;
rigs.update(1.234);
assert.equal(rigs.key.intensity, keyI, 'and through every partial blend');
curtain.value = prev;
assert.match(rigsSrc, /rig\.curtain\.value/, 'the blend reads the shared uniform by identity');

// ---- markCaster: the painted world casts; its shadows leave with the paint -------
// hero §5 (painted side): "trees and goblin cast". direction §8 (Prep): "in any
// frozen frame, the only shadow on the page belongs to what is alive" — the rule
// scopes to the frozen page, so world casters cast under paint and the rig releases
// them at the fully-drawn page. Scrub-reversible: they return with the paint.
const tree = rigs.markCaster(
  new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 9), createTrilayer({ color: 0x678e42 })),
);
assert.equal(tree.castShadow, false, 'registration alone flips nothing — the rig owns state');
curtain.value = 0;
rigs.update(0);
assert.equal(tree.castShadow, true, 'Performance: the painted world casts (hero §5)');
curtain.value = 0.5;
rigs.update(0);
assert.equal(tree.castShadow, true, 'shadows ride while any paint is up');
curtain.value = 1;
rigs.update(0);
assert.equal(tree.castShadow, false, 'the fully-drawn page: a drawing casts none');
assert.equal(mesh.castShadow, true, 'the alive still cast — the frozen page’s only shadow');
curtain.value = 0;
rigs.update(0);
assert.equal(tree.castShadow, true, 'and the world casts again with the paint — reversible');
// double-marking an alive mesh can never un-cast it: the alive term wins every state
rigs.markCaster(mesh);
curtain.value = 1;
rigs.update(0);
assert.equal(mesh.castShadow, true, 'markAlive permanence survives markCaster registration');

// ---- P4 pre-work (a): aliveness is the dedicated flag, never the mask layer ------
// reveal() parents mask-only shell copies on layer 1; a layer test promoted invisible
// shell geometry to permanent caster. Shells are skipped at registration (they never
// draw on layer 0), and the release predicate reads markAlive's userData.alive flag.
assert.match(rigsSrc, /userData\.alive === true/, 'the release predicate tests the alive flag');
assert.ok(!/layers\.isEnabled\(1\)/.test(rigsSrc), 'the mask layer is not the aliveness test');
assert.equal(mesh.userData.alive, true, 'markAlive sets the flag');
const prop = new THREE.Group();
const solid = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), createTrilayer({ color: 0x94795a }));
const shellCopy = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial());
shellCopy.layers.set(1); // mask-only, exactly like curtain.ts reveal()'s shells
prop.add(solid, shellCopy);
rigs.markCaster(prop);
curtain.value = 0;
rigs.update(0);
assert.equal(solid.castShadow, true, 'the prop itself casts under paint');
assert.equal(shellCopy.castShadow, false, 'mask-only shell geometry is never a caster');
curtain.value = 1;
rigs.update(0);
assert.equal(solid.castShadow, false, 'and the prop releases at the drawn page');
assert.equal(shellCopy.castShadow, false);
// a mask-layer flag alone is NOT aliveness: a world mesh riding layer 1 without the
// alive flag still releases (this exact case was the P3 bug)
const layered = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), createTrilayer({ color: 0x8792a6 }));
layered.layers.enable(1);
rigs.markCaster(layered);
curtain.value = 1;
rigs.update(0);
assert.equal(layered.castShadow, false, 'the mask layer alone never wins the release');

// ---- P4 pre-work (b): the caster registry is per rig ------------------------------
// A discarded render's rig must not retain or cross-drive another rig's meshes.
const rigsB = createRigs();
const treeB = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1, 7), createTrilayer({ color: 0x678e42 }));
rigsB.markCaster(treeB);
curtain.value = 0;
rigs.update(0);
assert.equal(treeB.castShadow, false, 'a rig drives only its own registry');
rigsB.update(0);
assert.equal(treeB.castShadow, true, 'the owning rig does drive it');
assert.ok(!/^const worldCasters/m.test(rigsSrc), 'no module-global caster registry survives');
curtain.value = prev;

// the Prep side RECEIVES the alive shadow: the trilayer's underdrawing darkens by the
// shadow mask (whose casters can only be alive), composed before the one state mix
assert.match(triSrc, /shadowmask_pars_fragment/, 'getShadowMask is compiled in');
assert.match(
  triSrc,
  /mix\(triUnder, uTriInk, \(1\.0 - getShadowMask\(\)\) \* uTriAliveShadow\)/,
  'the alive shadow lands on the drawing as graphite, not as lighting',
);
// P4e: the strength is rig-side now (the hero commits its one crossing shadow); the
// film's parked default stays the 0.3 this check has always pinned
assert.equal(rig.aliveShadow.value, 0.3, 'alive-shadow strength defaults to 0.3');

console.log('rigs.check: ok');
