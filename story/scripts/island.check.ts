import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildIsland } from '../src/film/stages/islandKit.ts';
import { createTrilayer, rig, GRID_INK } from '../src/film/stages/trilayer.ts';
import { curtain } from '../src/film/curtain.ts';

// P2: the island diorama base + the painted trilayer. What must hold:
// the ground is FINITE (no infinite planes in v2), the whole base is one material
// state driven by the one curtain uniform BY IDENTITY, the battle-grid watermark is
// capped at 4% ink, and the underdrawing carries exactly one stroke family — the
// no-hatch gate is structural, not a review note.

// ---- the island is a finite card, not a plane ----------------------------------
const island = buildIsland({ radiusX: 2.5, radiusZ: 1.75 });
island.root.updateWorldMatrix(true, true);
const bounds = new THREE.Box3().setFromObject(island.root);
const size = bounds.getSize(new THREE.Vector3());
assert.ok(size.x <= 2.5 * 2 * 1.2 + 0.5, `finite in x (got ${size.x})`);
assert.ok(size.z <= 1.75 * 2 * 1.2 + 0.5, `finite in z (got ${size.z})`);
assert.ok(size.x > 4 && size.z > 3, 'and actually island-sized');
assert.equal(island.ground.material.transparent, true, 'the edge feathers into the page');
assert.equal(
  (island.ground.material as THREE.Material).userData.role,
  'trilayer',
  'the card is a trilayer surface',
);

// the drop shadow rides the SAME curtain object — one uniform, one material state
const shadowMat = island.shadow.material as THREE.ShaderMaterial;
assert.equal(shadowMat.uniforms.uCurtain, curtain, 'shadow shares the curtain by identity');
assert.equal(shadowMat.transparent, true);
assert.equal(shadowMat.depthWrite, false, 'the shadow never occludes the card');
assert.ok(island.shadow.position.y < 0, 'the shadow lies on the page under the card');
// hero doc §5: a drawing casts nothing — the shadow's alpha carries (1 - state), where
// the state is the same max(curtain, seam) the trilayer computes: present under the
// painted half of a seamed island, gone under the graphite half
assert.match(shadowMat.fragmentShader, /max\(uCurtain, smoothstep\(uSeamX/, 'shadow state = max(curtain, seam)');
assert.match(shadowMat.fragmentShader, /1\.0 - cSeam/, 'shadow fades to nothing under Prep');
assert.equal(shadowMat.uniforms.uSeamX, rig.seamX, 'shadow reads the seam by identity');
assert.equal(shadowMat.uniforms.uSeamW, rig.seamW);

// ---- the trilayer wiring, without a GPU ----------------------------------------
// onBeforeCompile is data until a renderer runs it; feed it a stub carrying the
// Lambert anchors and check what it wires.
const anchorsVert = '#include <common>\n#include <begin_vertex>';
const anchorsFrag = '#include <common>\n#include <map_fragment>\n#include <opaque_fragment>';
function compile(material: THREE.Material) {
  const shader = {
    uniforms: {} as Record<string, THREE.IUniform>,
    vertexShader: anchorsVert,
    fragmentShader: anchorsFrag,
  };
  material.onBeforeCompile(shader as unknown as THREE.WebGLProgramParametersWithUniforms, null as unknown as THREE.WebGLRenderer);
  return shader;
}

const mat = createTrilayer({ color: 0xc2a97e, feather: 0.22 });
const shader = compile(mat);

// one curtain uniform, by identity — Performance↔Prep is a material state
assert.equal(shader.uniforms.uTriCurtain, curtain, 'the trilayer IS driven by the curtain object');
assert.equal(shader.uniforms.uTriGrid, rig.grid, 'rig uniforms shared by identity');
assert.equal(shader.uniforms.uTriNear, rig.depthNear);
assert.equal(shader.uniforms.uTriFar, rig.depthFar);
assert.equal(shader.uniforms.uTriSilNear, rig.silhouetteNear, 'silhouette threshold is rig-side');
// a second material shares the same rig — no per-material copies to drift
const shader2 = compile(createTrilayer({ color: 0x678e42 }));
assert.equal(shader.uniforms.uTriCurtain, shader2.uniforms.uTriCurtain);

// scene fog stays out — both depth languages are in-material (direction §10: Prep has
// no fog, and Performance's fog-to-paper must not stack under FogExp2's dusk ramp)
assert.equal(mat.fog, false, 'trilayer ignores scene fog');

// the depth languages are all present, each gated to its state
// (the wear/drybrush term composes BEFORE the poster now, so the fade is the first thing
// applied to triPaint rather than the second — same ramp, same target)
assert.match(shader.fragmentShader, /vec3 triPaint = mix\(outgoingLight, uTriPaper, triFade\)/,
  'Performance: fog-to-paper falloff — distance ramps to PAPER, never grey');
assert.match(shader.fragmentShader, /1\.0 - triFade \* 0\.75/,
  'Prep: line-weight falloff — far strokes fainter, more paper show-through');
assert.match(shader.fragmentShader, /smoothstep\(uTriSilNear \* 0\.55, uTriSilNear, triDist\)/,
  'Prep: near-black silhouette — direction §10 second half, foreground occluders');
assert.match(shader.fragmentShader, /mix\(triUnder, uTriInk, triSil \* 0\.92\)/,
  'the silhouette lands on the Prep side only');
// the material state: global curtain OR the spatial seam, zeroed for alive entities —
// and that ONE factor is what mixes paint to drawing
assert.match(shader.fragmentShader,
  /float triC = max\(uTriCurtain, triSeamF\) \* \(1\.0 - uTriAlive\)/,
  'state = max(curtain, seam), and the alive keep their paint');
assert.match(shader.fragmentShader, /mix\(triPaint, triUnder, triC\)/,
  'and that one state factor mixes between them');
assert.equal(shader.uniforms.uTriSeamX, rig.seamX, 'the seam is a rig uniform, by identity');
assert.equal(shader.uniforms.uTriSeamW, rig.seamW);

// the underdrawing projects sanely: page furniture (grid + ghosts) exists only on
// up-facing surfaces, and strokes take their face's own projection plane — no world-XZ
// smears down vertical faces
assert.match(shader.vertexShader, /vTriWorldN = mat3\(modelMatrix\) \* objectNormal/,
  'world normal reaches the fragment');
assert.match(shader.fragmentShader, /uTriGrid \* triUpF/,
  'the battle-grid is masked to up-facing ground — laid UNDER the scene');
assert.match(shader.fragmentShader, /triGhost \* 0\.1 \* triUpF/,
  'construction ghosts are page furniture too');
// …and "ground" is an OPT-IN, not any up-facing surface: the up-mask carries the
// per-material ground flag, so a crate lid prints no grid; only the island card does
assert.match(shader.fragmentShader, /float triUpF = uTriGround \* smoothstep/,
  'page furniture needs the ground flag, not just an up normal');
assert.equal(shader.uniforms.uTriGround.value, 0, 'default trilayer is scene, not page');
const groundShader = compile(island.ground.material as THREE.Material);
assert.equal(groundShader.uniforms.uTriGround.value, 1, 'the island card opts in');
assert.match(shader.fragmentShader, /triAn\.y >= max\(triAn\.x, triAn\.z\) \? vTriWorld\.xz/,
  'strokes pick a dominant-axis plane per face (hard select, no cross-plane blending)');

// the invisible feathered tail never writes depth — the curtain pass inks depth
// discontinuities, and a footprint at the geometric circle would draw a contour ring
assert.match(shader.fragmentShader, /if \(diffuseColor\.a < 0\.01\) discard;/,
  'feathered-out fragments discard instead of writing depth');

// the battle-grid watermark is capped at 4% ink, in the shader source itself
assert.ok(GRID_INK <= 0.04, 'grid watermark <= 4% ink');
assert.match(shader.fragmentShader, new RegExp(`triGridLine \\* ${GRID_INK.toFixed(3)}`),
  'the cap is the shipped multiplier, not a separate number');

// NO HATCHING — structural: exactly one stroke direction exists in the underdrawing,
// and no crossed second family is accumulated anywhere. P4e: the tone carrier is the
// authored stroke bake (uTriStrokes) sampled ONCE through one rotated param space —
// a second sample at another angle would be a cross-hatch, and none exists.
assert.equal(shader.fragmentShader.match(/vec2 triDirV =/g)?.length, 1, 'one stroke family');
assert.ok(!/crossHatch|hatch/i.test(shader.fragmentShader), 'no hatch anywhere in the trilayer');
assert.equal(shader.fragmentShader.match(/texture2D\(uTriStrokes/g)?.length, 1,
  'the authored strokes are sampled once — a second rotated sample would be a cross-hatch');

// feather + wear are per-material uniforms on one shared program
assert.equal(shader.uniforms.uTriFeather.value, 0.22);
assert.equal(shader2.uniforms.uTriFeather.value, 0, 'non-card surfaces do not feather');
assert.equal(mat.customProgramCacheKey(), 'trilayer', 'every trilayer shares one program');

console.log('island.check: ok');
