import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PAPER, LINE, paint, polyline, sketch, weight, fillMaterial } from '../src/film/pencil.ts';
import { markAlive, reveal, curtain } from '../src/film/curtain.ts';

// ---- paint --------------------------------------------------------------------
// Colour goes under the drawing, never over it: the whole point of one set of art is
// that the line-work survives being painted.

const solid = sketch(new THREE.SphereGeometry(0.4, 12, 10), 25, 'form', 0.01);
const strokes = solid.children[1] as THREE.Mesh;
const shell = solid.children[2] as THREE.Mesh;
const strokeMaterialBefore = strokes.material;
const shellMaterialBefore = shell.material;

paint(solid, { fill: 0x7c4a3c });

const fill = solid.children[0] as THREE.Mesh;
assert.notEqual(fill.material, fillMaterial, 'fill takes the paint');
assert.equal((fill.material as THREE.MeshBasicMaterial).color.getHex(), 0x7c4a3c);
assert.equal(strokes.material, strokeMaterialBefore, 'strokes stay ink unless asked');
assert.equal(shell.material, shellMaterialBefore, 'the silhouette shell stays ink too');
// the paint API must not cost a material per object, or the art pass's dozens of
// assignments turn into dozens of shader programs
const twin = paint(sketch(new THREE.BoxGeometry(1, 1, 1)), { fill: 0x7c4a3c });
assert.equal((twin.children[0] as THREE.Mesh).material, fill.material, 'materials shared by colour');
// painted once, repaintable: the art pass iterates on these values
paint(solid, { fill: 0x4e5f74 });
assert.equal((fill.material as THREE.MeshBasicMaterial).color.getHex(), 0x4e5f74);
// polygon offset is what keeps the fill from z-fighting its own edges — it has to
// survive the clone
assert.equal((fill.material as THREE.MeshBasicMaterial).polygonOffset, true);

// asking for line colour moves the strokes and the shell together, so a warm object
// does not keep a black outline
const warm = sketch(new THREE.ConeGeometry(0.1, 0.3, 7), 20, 'form', 0.006);
paint(warm, { line: 0xa8461c });
assert.equal(((warm.children[1] as THREE.Mesh).material as THREE.Material & { color: THREE.Color }).color.getHex(), 0xa8461c);
assert.equal(((warm.children[2] as THREE.Mesh).material as THREE.MeshBasicMaterial).color.getHex(), 0xa8461c);
assert.equal((warm.children[2] as THREE.Mesh).material instanceof THREE.MeshBasicMaterial, true);
assert.equal(((warm.children[2] as THREE.Mesh).material as THREE.MeshBasicMaterial).side, THREE.BackSide);

// retiering a painted object keeps its paint — otherwise `weight` silently reverts a
// `paint` that ran before it, which is invisible until someone looks at a frame
weight(warm, 'faint');
const retiered = (warm.children[1] as THREE.Mesh).material as THREE.Material & {
  color: THREE.Color;
  linewidth: number;
};
assert.equal(retiered.color.getHex(), 0xa8461c, 'retiering keeps the paint');
// faint tier is 1.1 since the 2026-08-18 art-bible line-weight boost
assert.ok(retiered.linewidth < 1.3, 'and still drops to the faint tier');

// ---- the graphite ramp ---------------------------------------------------------
// The shader is the source of truth; this is the arithmetic it runs, on the same two
// constants, checked at the two points the release depends on. Paper in -> paper out is
// what lets an unpainted film play through a painted pipeline unchanged.

const lin = (hex: number) => new THREE.Color(hex); // Color converts sRGB -> working space
const lum = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const paper = lin(PAPER);
const ink = lin(LINE);
const graphite = (hex: number, lift = 0.5) => {
  const c = lin(hex);
  const t = Math.min(1, Math.max(0, (lum(c) - lum(ink)) / (lum(paper) - lum(ink))));
  return Math.pow(t, lift);
};

// the two fixed points, exactly
assert.equal(graphite(PAPER), 1, 'paper maps to paper');
assert.equal(graphite(LINE), 0, 'ink maps to ink');
// and the lift cannot move them, whatever it is tuned to
for (const lift of [0.35, 0.5, 0.75, 1]) {
  assert.equal(graphite(PAPER, lift), 1);
  assert.equal(graphite(LINE, lift), 0);
}
// a painted mid-value lands as a light graphite tone, not as a hole in the page
const mid = graphite(0x7c4a3c);
assert.ok(mid > 0.25 && mid < 0.75, `mid tone landed at ${mid}`);
// the one film-wide assignment (the ground) has to come back as barely a wash
assert.ok(graphite(0xe6dcc6) > 0.85, 'the ground stays near paper behind the curtain');

// The parchment warmth rides on top of the ramp, and the two fixed points only survive
// it because its weight vanishes at both ends. Same arithmetic as the shader's `warm`.
const parchment = (t: number, w = 0.3) => w * Math.pow(t * (1 - t) * 4, 0.55);
assert.equal(parchment(graphite(PAPER)), 0, 'paper takes no warmth — PAPER -> PAPER exactly');
assert.equal(parchment(graphite(LINE)), 0, 'ink takes no warmth — LINE -> LINE exactly');
// and it has to actually be on screen in the light tones, which is where the frame lives
assert.ok(parchment(graphite(0xe6dcc6)) > 0.08, 'the light end still reads as parchment');

// ---- the pass's fragile bits ---------------------------------------------------
// Three traps, each of which fails as a plausible-looking frame rather than an error:
// transparency (the paper grain is CSS, behind a transparent canvas), and the tone
// mapping + colour space the renderer normally applies on its way to the canvas and
// does not apply on its way to a render target.
const source = await import('node:fs/promises').then((fs) =>
  fs.readFile(new URL('../src/film/curtain.ts', import.meta.url), 'utf8'),
);
assert.match(source, /frame\.rgb \/ max\(a, 1e-4\)/, 'un-premultiply before working');
assert.match(source, /gl_FragColor\.rgb \*= a;/, 're-premultiply for a transparent canvas');
assert.match(source, /#include <tonemapping_fragment>/, 'tone mapping the target skipped');
assert.match(source, /#include <colorspace_fragment>/, 'output colour space');
assert.ok(
  source.indexOf('#include <tonemapping_fragment>') < source.indexOf('gl_FragColor.rgb *= a;'),
  'premultiply is the last thing that happens',
);

// ---- the exception mask --------------------------------------------------------

const alive = markAlive(sketch(new THREE.BoxGeometry(1, 1, 1)));
const aliveFill = alive.children[0] as THREE.Mesh;
const aliveStrokes = alive.children[1] as THREE.Mesh;
assert.ok(aliveFill.layers.isEnabled(1), 'solids join the mask');
assert.ok(!aliveStrokes.layers.isEnabled(1), 'strokes never do');
assert.ok(aliveFill.layers.isEnabled(0), 'and still draw in the film');

// a prop that has not been touched yet is not in the mask at all
const prop = sketch(new THREE.BoxGeometry(0.4, 0.4, 0.4));
const propParts = prop.children.length;
assert.ok(
  prop.children.every((child) => !child.layers.isEnabled(1)),
  'nothing is in the mask before he touches it',
);

const tween = reveal(prop, { duration: 0.6 });
assert.equal(prop.children.length, propParts + 1, 'the reveal hangs off the prop itself');
const maskShell = prop.children[propParts] as THREE.Group;
// The mask is the prop's OWN silhouette, not a sphere run wider than it. A soft disc of
// colour around a prop is the baked radial glow color-script §7.3/§7.4/§8.1 ban by name,
// and on screen it bled across the ground and the rocks behind.
assert.ok(maskShell.children.length >= 1, "the shell copies the prop's solids");
assert.ok(
  maskShell.children.every(
    (child) => !(child as THREE.Mesh & { isLineSegments2?: boolean }).isLineSegments2,
  ),
  'and never the line-work — a LineSegments2 drawn with another material is confetti',
);
assert.ok(
  maskShell.children.every((child) => child.layers.isEnabled(1) && !child.layers.isEnabled(0)),
  'the shell is mask-only — it never draws into the film',
);
assert.equal(maskShell.scale.x, 0, 'starts closed — the tween opens it');
tween.progress(1);
assert.equal(maskShell.scale.x, 1, "and opens to the prop's own size");
tween.progress(0);
assert.equal(maskShell.scale.x, 0, 'scrubbing back closes it again — the film is scrubbed');
// asked twice, the same prop reuses its shell rather than stacking them
reveal(prop);
assert.equal(prop.children.length, propParts + 1);

// one beat, several props, one tween — a reveal is a beat, not a per-object chore
const near = sketch(new THREE.BoxGeometry(0.2, 0.2, 0.2));
const far = sketch(new THREE.BoxGeometry(0.2, 0.2, 0.2));
reveal([near, far], { duration: 0.3 }).progress(1);
assert.equal((near.children[near.children.length - 1] as THREE.Group).scale.x, 1);
assert.equal((far.children[far.children.length - 1] as THREE.Group).scale.x, 1);

// A grass tuft is a LineSegments2 and nothing else — no solid to copy. That is the one
// case the blob survives for, and it is hard-clamped to the object's own size.
const drawnOnly = new THREE.Group();
drawnOnly.add(polyline([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.1, 0)], 'faint'));
reveal(drawnOnly, { radius: 0.12 });
const fallback = drawnOnly.children[1] as THREE.Group;
assert.equal(fallback.children.length, 1, 'exactly one blob, and only because there is no solid');
assert.equal(
  (fallback.children[0] as THREE.Mesh).scale.x,
  0.12,
  'clamped to the object, never a multiple of it',
);

assert.equal(curtain.value, 0, 'the film starts in colour');

console.log('curtain.check: ok');
