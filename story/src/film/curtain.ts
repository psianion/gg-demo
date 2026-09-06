import * as THREE from 'three';
import gsap from 'gsap';
import { PAPER, LINE, STROKE_LAYER } from './pencil.ts';
import { EASE_SCRUB, SETTLE, T_FLICK, T_DRAIN_MIN, T_DRAIN_MAX, T_REVEAL } from './motion.ts';

// Behind the Curtain — the film's second visual state, computed rather than authored.
//
// The world is painted. When the world clock stops, the frame drains into graphite,
// ink and parchment; the goblin does not, and neither does anything he has touched.
// That is one full-screen pass over the rendered frame, plus a small mask that says
// which pixels are still alive.
//
// Three properties this file exists to hold:
//
//  1. `curtain` = 0 is the untouched colour frame. Not "nearly untouched" — the shader
//     mixes by exactly zero, so the film plays as authored while the world is running.
//  2. `curtain` = 1 must land on today's release-approved pencil look. The graphite
//     ramp is normalised against pencil's own two values, so paper maps to PAPER and
//     ink maps to LINE *exactly*, and anything still unpainted comes out the far side
//     unchanged. That property is what lets the art pass colour the film one scene at a
//     time without breaking the scenes it hasn't reached.
//  3. The canvas is transparent — the paper grain is CSS, deliberately outside WebGL —
//     so the pass carries alpha through and re-premultiplies at the end. Skip that and
//     the page floods with paper-coloured haze where the film isn't.

// 0 = normal world, 1 = behind the curtain. The timeline tweens this alongside the
// world clock; a plain object, so it needs no plumbing through React or the world.
export const curtain = { value: 0 };

// Tuning. Graphite is a light medium — a mid green should come back as a light tone on
// paper, not as a hole in the page — so the ramp is lifted. Both endpoints are fixed
// points of the lift (0 and 1), which is what keeps paper paper and ink ink.
// Regraded for the lit-3D film (draft 5): the old 0.5 lift was tuned when fills were
// flat washes — under real lighting it flattened the forest's three value steps into
// cream and the whole freeze read washed out ("EW"). The freeze keeps most of its
// value structure now; parchment survives as a breath, not a bath.
const LIFT = 0.85; // < 1 lifts the midtones toward paper
const PARCHMENT = 0xd0bf9a; // warmth bled into the midtones only
const WARMTH = 0.15;

export const MASK_LAYER = 1; // the camera layer the mask render draws, and only it
// (exported for src/gobMeasure.ts: in the hero scene markAlive is called on the goblin
// and his pencil and on nothing else, so a layer-1 pass IS his exact coverage mask —
// the one classification that cannot be fooled by his colour matching the scenery)
const MASK_SCALE = 0.5; // the mask runs at half res — it is a soft reveal, not an edge

// ---- the exception mask ---------------------------------------------------
//
// `markAlive` is permanent: the goblin — and the hand that reaches in at the table — are
// alive behind the curtain by construction. `reveal` is the beat: the prop's own shape
// opening back into colour as he touches it. The C2 lighting run calls it seven times.

const maskMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
const blobGeometry = new THREE.SphereGeometry(1, 12, 8);

/**
 * Keep this object in colour whatever the curtain does.
 *
 *   markAlive(world.goblin.root);
 *
 * Its solids join the mask; its strokes do not — a LineSegments2 is a Mesh whose
 * geometry only means anything to its own shader, and drawing it with any other
 * material scatters confetti at the origin.
 */
export function markAlive<T extends THREE.Object3D>(object: T): T {
  object.traverse((child) => {
    // …with ONE opt-out, and it is load-bearing rather than a convenience. The goblin's
    // contact pool (goblin design §8) is parented to his root so it travels with him,
    // but it must NOT be alive: a not-alive trilayer renders as a gouache shadow blob
    // on the painted half and as its own graphite smudge on the drawing, which is what
    // grounds him on both sides of the seam from one mesh with zero staging. Without
    // this line markAlive's traversal would silently switch the device off.
    if (child.userData.neverAlive) return;
    const mesh = child as THREE.Mesh & { isLineSegments2?: boolean };
    if (mesh.isMesh && mesh.isLineSegments2 !== true) {
      mesh.layers.enable(MASK_LAYER);
      // The alive-shadow rule (direction §8, hero §5): on the FROZEN page, "the only
      // shadow belongs to the alive." Alive casting is permanent and set here; the
      // painted world's casters register through markCaster (stages/rigs.ts), whose
      // state the rig releases at the fully-drawn page — so a frozen frame's shadow
      // map can only hold alive casters. Structural, not staged. Inert in the film
      // until a rig with shadows enabled is wired in (the Canvas has no `shadows`
      // today); the ?sandbox=island route runs it live. Permanent once set, like the
      // mask layer: nothing un-marks the alive.
      mesh.castShadow = true;
      // The dedicated aliveness flag the rigs' caster release tests (stages/rigs.ts).
      // The mask layer cannot serve as that test: reveal() below parents mask-only
      // shell copies on layer 1, and a shell is not alive — it is a silhouette.
      mesh.userData.alive = true;
      // …and the material-state half, for trilayer surfaces: an alive material keeps
      // its paint whatever the curtain or the seam does.
      for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const alive = (mat as THREE.Material | undefined)?.userData?.alive as
          | { value: number }
          | undefined;
        if (alive) alive.value = 1;
      }
    }
  });
  return object;
}

/**
 * The prop he just touched comes back to life — colour opening out of the prop itself.
 *
 *   tl.add(reveal([world.caveDoor, world.cave], { duration: 0.35 }), 21.6);
 *
 * The mask takes the PROP'S OWN SHAPE: a mask-only copy of its solids, grown from
 * nothing on the beat. This used to be one sphere sized to a multiple of the object's
 * bounds, which on screen was a large airbrushed disc of colour bleeding across the
 * ground and the rocks behind — exactly the baked radial glow color-script §7.3, §7.4
 * and §8.1 ban by name.
 *
 * Returns the tween rather than running it, because the film is scrubbed: dropped onto
 * the timeline it plays forwards, backwards and to any scroll position like every other
 * beat. `radius` survives only for objects with no solids to copy — a tuft of grass is
 * a LineSegments2 and nothing else — and it is a hard clamp on that object's own size,
 * never a multiple of it.
 */
export function reveal(
  target: THREE.Object3D | THREE.Object3D[],
  { duration = T_REVEAL, radius = 0 }: { duration?: number; radius?: number } = {},
): gsap.core.Tween {
  const scales = (Array.isArray(target) ? target : [target]).map(
    (object) => maskShell(object, radius).scale,
  );
  return gsap.fromTo(
    scales,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1, duration, ease: SETTLE.arrive },
  );
}

// preallocated — maskShell runs once per prop, but allocating matrices inside a traverse
// is the kind of thing that gets copied into a per-frame path later
const shellMatrix = new THREE.Matrix4();
const toShellLocal = new THREE.Matrix4();

// The shell is the object's silhouette, rebuilt once in mask-only materials and parented
// to the object so it follows every tween the beat sheet already runs on it. Scaling the
// shell from 0 is what makes the reveal a reveal, and it stays a plain property tween —
// no callbacks, so a backward scrub un-reveals for free.
function maskShell(object: THREE.Object3D, radius: number): THREE.Group {
  const existing = object.userData.maskShell as THREE.Group | undefined;
  if (existing) return existing;

  const shell = new THREE.Group();
  object.updateWorldMatrix(true, true);
  toShellLocal.copy(object.matrixWorld).invert();

  object.traverse((child) => {
    const mesh = child as THREE.Mesh & { isLineSegments2?: boolean };
    // a LineSegments2 is a Mesh whose geometry only means anything to its own shader, and
    // drawing it with any other material scatters confetti at the origin
    if (!mesh.isMesh || mesh.isLineSegments2 === true) return;
    const copy = new THREE.Mesh(mesh.geometry, maskMaterial);
    copy.applyMatrix4(shellMatrix.multiplyMatrices(toShellLocal, mesh.matrixWorld));
    copy.layers.set(MASK_LAYER); // mask only — never drawn into the film itself
    copy.frustumCulled = false;
    shell.add(copy);
  });

  // Nothing to copy: the ray bursts and the grass tufts are drawn line and no solid at
  // all. They get the one blob the film still uses, clamped to their own size.
  if (shell.children.length === 0) {
    const blob = new THREE.Mesh(blobGeometry, maskMaterial);
    blob.scale.setScalar(radius || 0.2);
    blob.layers.set(MASK_LAYER);
    blob.frustumCulled = false;
    shell.add(blob);
  }

  // The reveal grows about the prop's own centre, not the group origin. A signboard's
  // group origin is at the ground, and scaling its shell from there floated a displaced
  // silhouette through the mask mid-tween — on screen, a ghost copy of the sign punching
  // a full-colour window into the half-drained ground beside the real one.
  const center = new THREE.Box3().setFromObject(shell).getCenter(new THREE.Vector3());
  for (const copy of shell.children) copy.position.sub(center);
  shell.position.copy(center);
  shell.scale.setScalar(0);

  object.add(shell);
  object.userData.maskShell = shell;
  return shell;
}

// ---- the two named freezes (motion §12) ------------------------------------
//
// The freeze grammar as recipes rather than per-beat literals. `tick` is the standard
// stop: the world clock halts in ≤0.15t — instant, no slow-mo easing — and the curtain
// rides the same cue over 0.35t. `glidingDrain` is for beats where the wave itself is
// the shot (the C2 world-returns): the curtain glides 0.5–1.4t while the clock does
// its own thing. `snapBack` is the release — time restarting, not a dissolve. All
// three write onto the caller's timeline, so a backward scrub un-plays them like every
// other beat.
export const TICK = { clock: 0.15, curtain: 0.35 } as const;
export const DRAIN = { min: T_DRAIN_MIN, max: T_DRAIN_MAX } as const;

export function tick(tl: gsap.core.Timeline, at: number, world: { timeScale: number }): void {
  tl.to(world, { timeScale: 0, duration: TICK.clock, ease: EASE_SCRUB }, at);
  tl.to(curtain, { value: 1, duration: TICK.curtain, ease: SETTLE.arrive }, at);
}

export function glidingDrain(tl: gsap.core.Timeline, at: number, to: number, dur: number): void {
  // The 0.5–1.4t band (motion §12) is enforced, not just documented: an out-of-band
  // duration clamps to the nearest edge rather than throwing mid-film. Every shipped
  // call site is in-band, so the clamp is an identity for the authored beats.
  const clamped = Math.min(DRAIN.max, Math.max(DRAIN.min, dur));
  tl.to(curtain, { value: to, duration: clamped, ease: SETTLE.move }, at);
}

export function snapBack(tl: gsap.core.Timeline, at: number): void {
  tl.to(curtain, { value: 0, duration: T_FLICK, ease: SETTLE.snap }, at);
}

// ---- the pass -------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D tFrame;
  uniform sampler2D tMask;
  uniform sampler2D tNormal;
  uniform sampler2D tDepth;
  uniform vec3 uPaper;
  uniform vec3 uInk;
  uniform vec3 uParchment;
  uniform vec2 uMaskTexel;
  uniform vec2 uTexel;
  uniform float uWobble;
  uniform float uNear;
  uniform float uFar;
  uniform float uCurtain;
  uniform float uLift;
  uniform float uWarmth;
  varying vec2 vUv;

  float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  float linDepth(vec2 uv) {
    float z = texture2D(tDepth, uv).x;
    float ndc = z * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
  }

  // value noise for the hand — deterministic, no time term, so the page never shimmers
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    // The hand: a static screen-space ink displacement — the same trick the art
    // bible's pages run. Two decorrelated low-frequency fields shove every sample a
    // couple of texels sideways, so GL-straight edges come out drawn. It permutes
    // samples, never changes values: PAPER->PAPER and LINE->LINE stay exact.
    vec2 np = vUv / (uTexel * 140.0);
    vec2 wob = (vec2(vnoise(np), vnoise(np + 37.7)) - 0.5) * 2.0 * uWobble * uTexel;
    vec2 suv = vUv + wob;

    vec4 frame = texture2D(tFrame, suv);
    float a = frame.a;
    // The frame arrives premultiplied wherever multisampling resolved partial coverage —
    // that is every drawn stroke's edge. Undo it, work in straight colour, put it back
    // at the end: the canvas is transparent and the page composites it premultiplied.
    vec3 color = frame.rgb / max(a, 1e-4);

    // ---- the sketch: contour ink from real 3D form -------------------------------
    // Lines come from the surface itself — normal and depth discontinuities — so they
    // follow curvature, silhouettes and creases the way a pencil does, on ANY geometry.
    vec2 co = uTexel * 1.5;
    vec3 nR = texture2D(tNormal, suv + vec2(co.x, 0.0)).xyz;
    vec3 nL = texture2D(tNormal, suv - vec2(co.x, 0.0)).xyz;
    vec3 nU = texture2D(tNormal, suv + vec2(0.0, co.y)).xyz;
    vec3 nB = texture2D(tNormal, suv - vec2(0.0, co.y)).xyz;
    float nEdge = length(nR - nL) + length(nU - nB);
    float dC = linDepth(suv);
    float dEdge = abs(linDepth(suv + vec2(co.x, 0.0)) - dC)
                + abs(linDepth(suv + vec2(0.0, co.y)) - dC);
    // depth edges fade with distance and need a higher bar — at grazing angles the far
    // ground plane otherwise draws a smeared band along the whole horizon. The window
    // sits high (0.14-0.3): near a curved rim the depth keeps jumping for several
    // pixels inward, and a lower window bloomed every close crown into a fat black band
    float dLine = smoothstep(0.14, 0.3, dEdge / max(dC, 0.15)) * (1.0 - smoothstep(25.0, 55.0, dC));
    float line = smoothstep(0.55, 1.15, nEdge) + dLine;
    line = clamp(line, 0.0, 1.0);
    // only ink where something was actually drawn — half the silhouette line lives on
    // the object side, which is enough
    line *= smoothstep(0.05, 0.6, a);

    // ---- the sketch: hatch tone in the darks -------------------------------------
    // Draft 5 direction: the film is REAL lit 3D — tone comes from lighting, never
    // from pattern fills. Hatching survives only as a quiet accent inside the true
    // darks (a drawn shadow), thresholds in LINEAR space, under every ground/sky wash
    // so big airy areas stay clean and PAPER -> PAPER stays exact for the ramp below.
    // (A full bible-style midtone pattern hatch was tried and rejected on review.)
    float lu = lum(color);
    float hWander = (vnoise(vUv / (uTexel * 60.0)) - 0.5) * 2.2;
    float hd = (suv.x * 0.878 - suv.y * 0.479) / (uTexel.y * 8.0) + hWander;
    // thresholds sit BELOW every authored albedo: a dark fill is a colour, not a
    // shadow — only true near-black crevices take the pencil. Held at 0.10 since the
    // colour pass: reds are luminance-poor (the rust tunic's linear Y is ~0.11) and a
    // 0.12 gate striped the tunic the moment it gained its hue
    float hatch = smoothstep(0.1, 0.04, lu) * smoothstep(0.34, 0.18, abs(fract(hd) - 0.5)) * 0.4;
    float hd2 = (suv.x * 0.622 + suv.y * 0.783) / (uTexel.y * 9.0) - hWander;
    hatch += smoothstep(0.03, 0.008, lu) * smoothstep(0.34, 0.18, abs(fract(hd2) - 0.5)) * 0.35;
    color = mix(color, uInk, clamp(hatch, 0.0, 0.6) * a);
    color = mix(color, uInk, line * 0.82);

    // Alive: the goblin, and whatever he has touched. Five taps at half res is the whole
    // softness of the reveal — a hard-edged mask reads as a cut-out of him. The mask
    // rides the same displaced sample point so the reveal tracks the drawn image.
    float mask = texture2D(tMask, suv).r;
    mask += texture2D(tMask, suv + vec2( uMaskTexel.x,  uMaskTexel.y)).r;
    mask += texture2D(tMask, suv + vec2(-uMaskTexel.x,  uMaskTexel.y)).r;
    mask += texture2D(tMask, suv + vec2( uMaskTexel.x, -uMaskTexel.y)).r;
    mask += texture2D(tMask, suv + vec2(-uMaskTexel.x, -uMaskTexel.y)).r;
    mask *= 0.2;

    // The graphite ramp, normalised against pencil's own two values: whatever the frame
    // is worth between ink and paper comes back out as that much graphite. Paper in,
    // paper out — exactly — which is what lets an unpainted scene sit next to a painted
    // one and still look like the film it was yesterday.
    float t = clamp((lum(color) - lum(uInk)) / max(lum(uPaper) - lum(uInk), 1e-4), 0.0, 1.0);
    t = pow(t, uLift);
    vec3 graphite = mix(uInk, uPaper, t);
    // Parchment warmth across everything that is neither paper nor ink. The weight still
    // goes to exactly zero at both ends — that is what keeps PAPER->PAPER and LINE->LINE
    // exact whatever this is tuned to — but the 0.55 power widens the shoulder so the
    // light two thirds of the ramp are warm paper rather than cool grey.
    float warm = uWarmth * pow(t * (1.0 - t) * 4.0, 0.55);
    graphite = mix(graphite, uParchment, warm);

    vec3 result = mix(color, graphite, uCurtain * (1.0 - mask));

    gl_FragColor = vec4(result, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb *= a;
  }
`;

/**
 * One extra pass over the frame. The scene renders into a target instead of onto the
 * canvas; this composites it back out through the graphite ramp.
 *
 *   const pass = createCurtainPass(gl);
 *   useFrame(() => pass.render(scene, camera), 1); // priority > 0: we own the render
 */
export function createCurtainPass(renderer: THREE.WebGLRenderer) {
  // Multisampled because the film is line-work: the canvas had antialiasing and the
  // render target has to keep it, or every stroke in the film goes to stairs.
  const frameTarget = new THREE.WebGLRenderTarget(1, 1, { samples: 4, stencilBuffer: false });
  const maskTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    stencilBuffer: false,
  });
  // The sketch pass's eyes: view-space normals + depth of the SOLID scene (strokes are
  // excluded by layer — a line has no surface to contour).
  const normalTarget = new THREE.WebGLRenderTarget(1, 1, {
    stencilBuffer: false,
    depthTexture: new THREE.DepthTexture(1, 1),
  });
  const normalOverride = new THREE.MeshNormalMaterial();

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    // The scene pass into frameTarget does NOT tone map: three r185 forces
    // NoToneMapping whenever the renderer targets a render target (non-XR), whatever
    // the materials' toneMapped flags say. So the film's world materials are never
    // tone mapped anywhere — this composite is the only pass that touches the canvas,
    // and toneMapped:false keeps it from adding ACES to an untone-mapped frame. Any
    // material/light work must be judged under this transfer (the island sandbox's
    // `flat` Canvas exists for that parity).
    toneMapped: false,
    blending: THREE.NoBlending, // we write the frame; we do not blend into it
    uniforms: {
      tFrame: { value: frameTarget.texture },
      tMask: { value: maskTarget.texture },
      tNormal: { value: normalTarget.texture },
      tDepth: { value: normalTarget.depthTexture },
      uNear: { value: 0.1 },
      uFar: { value: 100 },
      uPaper: { value: new THREE.Color(PAPER) },
      uInk: { value: new THREE.Color(LINE) },
      uParchment: { value: new THREE.Color(PARCHMENT) },
      uMaskTexel: { value: new THREE.Vector2() },
      uTexel: { value: new THREE.Vector2(1 / 1920, 1 / 1080) },
      uWobble: { value: 3.2 }, // displacement amplitude in device pixels
      uCurtain: { value: 0 },
      uLift: { value: LIFT },
      uWarmth: { value: WARMTH },
    },
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCamera = new THREE.Camera();

  // preallocated — render() runs every frame and allocates nothing
  const clearColor = new THREE.Color();
  const bufferSize = new THREE.Vector2();
  let width = 0;
  let height = 0;

  function setSize(rawWidth: number, rawHeight: number) {
    // a zero-sized target is a GL error, and R3F can hand one over on the first layout
    const w = Math.max(1, rawWidth);
    const h = Math.max(1, rawHeight);
    if (w === width && h === height) return;
    width = w;
    height = h;
    frameTarget.setSize(w, h);
    normalTarget.setSize(w, h);
    const mw = Math.max(1, Math.round(w * MASK_SCALE));
    const mh = Math.max(1, Math.round(h * MASK_SCALE));
    maskTarget.setSize(mw, mh);
    // the taps sit a texel and a half out, in the mask's own resolution
    material.uniforms.uMaskTexel.value.set(1.5 / mw, 1.5 / mh);
    material.uniforms.uTexel.value.set(1 / w, 1 / h);
  }

  function render(scene: THREE.Scene, camera: THREE.Camera) {
    // The targets follow the drawing buffer rather than a resize listener: same answer,
    // one less thing to keep in step, and it picks up pixel-ratio changes for free.
    renderer.getDrawingBufferSize(bufferSize);
    setSize(bufferSize.x, bufferSize.y);

    material.uniforms.uCurtain.value = curtain.value;
    renderer.getClearColor(clearColor);
    const clearAlpha = renderer.getClearAlpha();

    if (curtain.value > 0.001) {
      // The mask draws the alive objects only, at half res, unfogged. Everything else in
      // the scene is invisible to this camera for the length of one render. Skipped
      // outright while the world is in colour, which is most of the film.
      const layers = camera.layers.mask;
      scene.overrideMaterial = maskMaterial;
      camera.layers.set(MASK_LAYER);
      renderer.setClearColor(0x000000, 1);
      renderer.setRenderTarget(maskTarget);
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      camera.layers.mask = layers;
    }

    // the sketch pass's normal/depth view of the solids — strokes stay off this camera
    {
      const layers = camera.layers.mask;
      const fog = scene.fog;
      scene.fog = null; // normals and depth are geometry facts; fog has no business here
      scene.overrideMaterial = normalOverride;
      camera.layers.set(0);
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(normalTarget);
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      scene.fog = fog;
      camera.layers.mask = layers;
    }
    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera) {
      material.uniforms.uNear.value = persp.near;
      material.uniforms.uFar.value = persp.far;
    }

    // the film itself, into the target rather than onto the canvas — the main camera
    // also draws the stroke layer
    camera.layers.enable(STROKE_LAYER);
    renderer.setClearColor(clearColor, clearAlpha);
    renderer.setRenderTarget(frameTarget);
    renderer.render(scene, camera);

    // and back out through the ramp
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCamera);
  }

  function dispose() {
    frameTarget.dispose();
    maskTarget.dispose();
    material.dispose();
    quad.geometry.dispose();
  }

  return { render, setSize, dispose, material };
}
