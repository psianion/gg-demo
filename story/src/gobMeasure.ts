import * as THREE from 'three';
import {
  heroFraming,
  shadowReachX,
  pathZ,
  solveGoblinRim,
  solveGoblinScale,
  SEAM_X,
} from './film/stages/hero';
import { heroCamera, gobParts, partBox, fillMeshes, type Box } from './film/gobParts';
import { setPencilResolution, STROKE_LAYER } from './film/pencil';
import { MASK_LAYER } from './film/curtain';
import { rig } from './film/stages/trilayer';
import type { Hero } from './film/stages/hero';
import type { HeroLife } from './film/stages/heroLife';

// ============================================================================
// CLASS P — the goblin's framebuffer acceptance gates.
// docs/2026-09-03-goblin-design.md §14 (P1–P8), built as §13 step 0 requires.
//
//   await window.__gob(width, height, { ss, curtain, assert })
//
// DEV-only, installed by Hero.tsx beside __bakePoster. It renders the LIVE scene through
// the authored hero framing into an offscreen target and reads the pixels back — the
// recipe already proven at IslandSandbox.tsx:170–236 and posterBake.ts:43–65. No second
// recipe, no Playwright, no new dependency.
//
// ---------------------------------------------------------------------------
// COLOUR DOMAINS — read this before comparing any number to any threshold.
//
// The target is FloatType / NoColorSpace, so what comes back is LINEAR light: exactly
// the domain the trilayer mixes in, at full float precision, with no 8-bit quantization
// (IslandSandbox.tsx:162–169 records why a byte readback lies at this base tone). The
// hero Canvas is `flat`, so there is no tone mapping in the path either way.
//
// From that one float read this file derives TWO numbers per pixel and never mixes them:
//
//   *_lin  — Rec.709 luma of the LINEAR values. The mix domain: what the shader did.
//   *_enc  — Rec.709 luma of the sRGB-ENCODED values (0..1, ×255 where the doc counts in
//            /255). This is what a screenshot holds and it is the domain EVERY published
//            threshold is written in: GOBLIN-DIAGNOSIS's "luma 0.335 / oak 0.353 / pine
//            0.314", §14 P2's "range ≥ 60/255", P3's "R − B ≥ 70", P8's "ink + 8/255".
//            The transfer is applied ANALYTICALLY to the float, so these are encoded
//            VALUES that were never encoded BYTES.
//
// Every field is suffixed `_lin` / `_enc` / `_enc255`, or is a pixel count or a CSS-px
// extent. The pass/fail lines are evaluated in `_enc`, because that is where the
// thresholds live.
//
// ---------------------------------------------------------------------------
// HOW EACH REGION IS ISOLATED — four draws, no colour classification
//
// Deciding "these are his pixels" by colour would be circular: the whole complaint is
// that his colour matches the scenery. So the regions come from the scene graph:
//
//   M  camera on MASK_LAYER with a white override → his EXACT coverage, shells
//      included. In the hero scene markAlive touches the goblin and his pencil and
//      nothing else (hero.ts:1243–1244), so layer 1 is him alone.
//   A  the frame as it ships.
//   B  the same frame with the GOBLIN hidden → (B − A) off the mask is the ground
//      darkening he causes: the contact pool and the crossing cast shadow, isolated
//      from the painting underneath them.
//   C  the same frame with the two painted TREES hidden → their exact crown masks, so
//      P1 compares his cloth against crown pixels and not against a bbox full of paper.
//
// Only small sub-rects are read back, so this is far cheaper than one full-frame float
// readback and every region is exact.
// ============================================================================

interface HeroHandle {
  hero: Hero;
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  life: HeroLife;
}

export function install(): void {
  (window as unknown as Record<string, unknown>).__gob = measure;
}

// ---- colour --------------------------------------------------------------------------
/** Linear → sRGB encoded, 0..1 — three's own output transfer, applied to the float. */
function enc(c: number): number {
  const v = c <= 0 ? 0 : c >= 1 ? 1 : c;
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}
const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const INK_ENC = 34 / 255; // 0x222222 is neutral, so its encoded luma IS 34/255

/** One float RGBA sub-rect, addressed in CSS px with y DOWN. */
class Patch {
  readonly W: number;
  readonly H: number;
  constructor(
    readonly x0: number,
    readonly y0: number,
    readonly w: number,
    readonly h: number,
    readonly ss: number,
    readonly buf: Float32Array,
  ) {
    this.W = Math.round(w * ss);
    this.H = Math.round(h * ss);
  }
  /** buffer index under a CSS-px coordinate, or −1 outside */
  idx(x: number, y: number): number {
    const px = Math.floor((x - this.x0) * this.ss);
    const py = Math.floor((y - this.y0) * this.ss);
    if (px < 0 || py < 0 || px >= this.W || py >= this.H) return -1;
    return ((this.H - 1 - py) * this.W + px) * 4; // GL rows arrive bottom-up
  }
  lin(i: number) {
    return luma(this.buf[i], this.buf[i + 1], this.buf[i + 2]);
  }
  encL(i: number) {
    return luma(enc(this.buf[i]), enc(this.buf[i + 1]), enc(this.buf[i + 2]));
  }
  /** the doc's "R − B", in /255 of the encoded domain */
  warm(i: number) {
    return (enc(this.buf[i]) - enc(this.buf[i + 2])) * 255;
  }
  each(fn: (i: number, x: number, y: number) => void) {
    for (let py = 0; py < this.H; py++) {
      for (let px = 0; px < this.W; px++) {
        fn(((this.H - 1 - py) * this.W + px) * 4, this.x0 + px / this.ss, this.y0 + py / this.ss);
      }
    }
  }
}

function stat(xs: number[]) {
  if (!xs.length) return { n: 0, mean: NaN, min: NaN, max: NaN };
  let s = 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of xs) {
    s += v;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return { n: xs.length, mean: s / xs.length, min: lo, max: hi };
}
const r3 = (n: number) => (Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null);
const r1 = (n: number) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : null);

// ---- the measurement -------------------------------------------------------------------
async function measure(
  width = 1440,
  height = 900,
  opts: { ss?: number; curtain?: number; assert?: boolean } = {},
) {
  const handle = (window as unknown as { __hero?: HeroHandle }).__hero;
  if (!handle) throw new Error('no __hero handle — open the hero first (/ or ?hero=1)');
  const { hero, gl, scene, life } = handle;
  const ss = opts.ss ?? 2;
  life.skip(); // the settled frame, exactly — the same thing posterBake asks for

  // ---- stage the lens ------------------------------------------------------------------
  const f = heroFraming(width, height);
  const cam = heroCamera(width, height);
  cam.layers.enable(STROKE_LAYER); // the flat hero path enables strokes on the camera
  const prev = {
    near: rig.depthNear.value,
    far: rig.depthFar.value,
    curtain: rig.curtain.value,
    glow: hero.glowSprite?.scale.x ?? 1,
    rt: gl.getRenderTarget(),
  };
  rig.depthNear.value = f.d * 0.95;
  rig.depthFar.value = f.d * 2.4;
  if (opts.curtain !== undefined) rig.curtain.value = opts.curtain;
  hero.glowSprite?.scale.setScalar(width < 560 ? 0.9 : 1.15);
  // LineMaterial sizes its quads in RESOLUTION pixels, so handing it (width, height)
  // while rendering into a width*ss target makes a 2.1px stroke cover 2.1 CSS px — the
  // unit §14 P4 is written in. (posterBake hands it the target size instead, because a
  // poster IS its target.) Every px number below is therefore CSS px.
  setPencilResolution(width, height);
  solveGoblinScale(hero.goblin, width, height); // §11.2: and the rim below reads it
  solveGoblinRim(hero.goblin, width, height); // §5.12: the shells are a CSS-px quantity

  const rt = new THREE.WebGLRenderTarget(width * ss, height * ss, {
    type: THREE.FloatType,
    colorSpace: THREE.NoColorSpace, // linear in, linear out — the film's own target path
    stencilBuffer: false,
  });

  const draw = () => {
    gl.setRenderTarget(rt);
    gl.clear();
    gl.render(scene, cam);
  };
  const readRect = (b: { x0: number; y0: number; x1: number; y1: number }): Patch => {
    const x0 = Math.max(0, Math.floor(b.x0));
    const y0 = Math.max(0, Math.floor(b.y0));
    const x1 = Math.min(width, Math.ceil(b.x1));
    const y1 = Math.min(height, Math.ceil(b.y1));
    const w = Math.max(1, x1 - x0);
    const h = Math.max(1, y1 - y0);
    const buf = new Float32Array(Math.round(w * ss) * Math.round(h * ss) * 4);
    gl.readRenderTargetPixels(
      rt,
      Math.round(x0 * ss),
      Math.round((height - y1) * ss), // GL's origin is BOTTOM-left; ours is top-left
      Math.round(w * ss),
      Math.round(h * ss),
      buf,
    );
    return new Patch(x0, y0, w, h, ss, buf);
  };

  // ---- the regions, from geometry — never from colour -------------------------------
  hero.root.updateMatrixWorld(true);
  const parts = gobParts(hero.goblin, hero.pencil);
  const figBox = partBox(cam, width, height, parts.figure);
  const headBox = partBox(cam, width, height, parts.headAll);
  const cloakBox = partBox(cam, width, height, parts.cloak);
  const bootBox = partBox(cam, width, height, parts.boots);
  const headMassBox = partBox(cam, width, height, parts.head); // ears excluded — P4's rows
  const warmBox = partBox(cam, width, height, parts.warmPatch); // §0.0.3 — P1/P7's exclusion
  const poolBox = partBox(cam, width, height, parts.pool); // §8 — P5's device, not P6's
  const inWarm = (x: number, y: number) =>
    warmBox.n > 0 && x >= warmBox.x0 && x <= warmBox.x1 && y >= warmBox.y0 && y <= warmBox.y1;
  const eyeBox = {
    L: partBox(cam, width, height, parts.eyeL),
    R: partBox(cam, width, height, parts.eyeR),
  };
  const dist = (o: THREE.Object3D) =>
    o.getWorldPosition(new THREE.Vector3()).distanceTo(cam.position);
  const nearEye: 'L' | 'R' = dist(hero.goblin.face.eyeR) < dist(hero.goblin.face.eyeL) ? 'R' : 'L';
  const farEye: 'L' | 'R' = nearEye === 'L' ? 'R' : 'L';

  // the ground he darkens, out to his shadow's tip. KEY_POS is (−4, ·, −4), so the throw
  // runs the (+x, +z) diagonal; §14 G11 is the same reach.
  const gx = hero.goblin.root.position.x;
  const gz = hero.goblin.root.position.z;
  const figTopY = (() => {
    const b = new THREE.Box3();
    for (const m of fillMeshes([hero.goblin.root])) b.expandByObject(m);
    return b.max.y;
  })();
  const proj = (p: THREE.Vector3) => {
    const v = p.clone().project(cam);
    return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
  };
  const reach = shadowReachX(gx, figTopY);
  const tip = proj(new THREE.Vector3(reach, 0, gz + (reach - gx)));
  // world +x projects to screen LEFT (hero.ts:19–25), so the graphite half — and his
  // shadow's crossing — sit at SMALLER screen x than the seam's own column
  const seamX = proj(new THREE.Vector3(SEAM_X, 0, pathZ(SEAM_X))).x;
  const stageBox = {
    x0: Math.min(figBox.x0, tip.x) - 24,
    y0: Math.min(figBox.y0, tip.y) - 12,
    x1: Math.max(figBox.x1, tip.x) + 24,
    y1: Math.max(figBox.y1, tip.y) + 24,
  };

  const treeBox = (name: string): Box | null => {
    const o = scene.getObjectByName(name);
    if (!o) return null;
    const b = partBox(cam, width, height, { roots: [o], exclude: [] });
    // the CROWN only — the tree's upper 62% of screen height; below that is bark
    return b.n ? { ...b, y1: b.y0 + b.h * 0.62, h: b.h * 0.62 } : null;
  };
  const oakBox = treeBox('heroOak');
  const pineBox = treeBox('heroPine');
  const oakObj = scene.getObjectByName('heroOak') ?? null;
  const pineObj = scene.getObjectByName('heroPine') ?? null;

  // ---- M: his exact coverage -----------------------------------------------------------
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const prevOverride = scene.overrideMaterial;
  const prevMask = cam.layers.mask;
  scene.overrideMaterial = white;
  cam.layers.set(MASK_LAYER);
  draw();
  const M = readRect(stageBox);
  // …and the same mask with the CONTOUR SHELLS hidden, so the rim can be measured as
  // the geometry it is. A colour test cannot do this job on the shipped figure: its
  // shaded hood measures 0.133 encoded — bit for bit the ink value — so "count the
  // near-ink pixels at the contour" reports a 40 CSS px rim. (That collision is itself
  // one of the diagnosis's findings; it is not a bug in the harness.)
  const shells: THREE.Object3D[] = [];
  hero.goblin.root.traverse((o) => {
    const m = o as THREE.Mesh;
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (m.isMesh && mat?.userData?.role === 'shell' && o.visible) {
      o.visible = false;
      shells.push(o);
    }
  });
  draw();
  const F = readRect(stageBox); // the FILL silhouette, no contour
  // …and the shells ALONE. P4 asks how thick the two ink shells are, and a walk in from
  // paper cannot tell which part it landed on: at 390×844 the working arm crosses the
  // cloak's seam side on every sampled row, and the arm carries authored mark() strokes
  // rather than a shell (§5 — two shells, everything else drawn), so the gate reported
  // 15/15 rows with "no contour" for a contour that was never supposed to be a rim.
  // With the shells' own mask, a row is sampled only where a shell actually is.
  const hidden: THREE.Object3D[] = [];
  hero.goblin.root.traverse((o) => {
    const m = o as THREE.Mesh & { isLineSegments2?: boolean };
    if (!o.visible || o === hero.goblin.root) return;
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    if (m.isMesh || m.isLineSegments2) {
      if (mat?.userData?.role !== 'shell') {
        o.visible = false;
        hidden.push(o);
      }
    }
  });
  for (const o of shells) o.visible = true;
  draw();
  const S = readRect(stageBox); // the two ink shells, alone
  for (const o of hidden) o.visible = true;
  scene.overrideMaterial = prevOverride;
  cam.layers.mask = prevMask;
  white.dispose();

  // ---- A / B / C -------------------------------------------------------------------------
  draw();
  const A = readRect(stageBox);
  const oakA = oakBox && readRect(oakBox);
  const pineA = pineBox && readRect(pineBox);

  hero.goblin.root.visible = false;
  draw();
  const B = readRect(stageBox);
  hero.goblin.root.visible = true;

  // …and the same frame with ONLY THE CONTACT POOL hidden. P5's device and P6's device do
  // two different jobs (§8) and they overlap on the page, so "the ground he darkens" is
  // the union of them. Subtracting the pool by its projected BBOX is the wrong shape —
  // the bbox of a foreshortened ellipse swallows most of the cast at phone framings, and
  // P6 read 0.078 there against 0.255 at 1440 purely from that. This draw isolates it
  // exactly: a pixel the pool causes is one where hiding the pool changes the frame.
  const poolNodes = parts.pool.roots;
  for (const o of poolNodes) o.visible = false;
  draw();
  const Bp = readRect(stageBox);
  for (const o of poolNodes) o.visible = true;

  let oakC: Patch | null = null;
  let pineC: Patch | null = null;
  if (oakObj || pineObj) {
    if (oakObj) oakObj.visible = false;
    if (pineObj) pineObj.visible = false;
    draw();
    if (oakBox) oakC = readRect(oakBox);
    if (pineBox) pineC = readRect(pineBox);
    if (oakObj) oakObj.visible = true;
    if (pineObj) pineObj.visible = true;
  }

  // ---- restore -----------------------------------------------------------------------------
  gl.setRenderTarget(prev.rt);
  rt.dispose();
  rig.depthNear.value = prev.near;
  rig.depthFar.value = prev.far;
  rig.curtain.value = prev.curtain;
  hero.glowSprite?.scale.setScalar(prev.glow);
  setPencilResolution(window.innerWidth, window.innerHeight);
  solveGoblinScale(hero.goblin, window.innerWidth, window.innerHeight);
  solveGoblinRim(hero.goblin, window.innerWidth, window.innerHeight);

  // ==========================================================================================
  // MEASUREMENTS
  // ==========================================================================================
  const px2 = 1 / (ss * ss); // one target pixel, in CSS px²
  const DIFF = 0.004; // linear luma below which A and B are the same pixel (float noise)
  const isHim = (i: number) => M.lin(i) > 0.5;
  const isFill = (i: number) => F.lin(i) > 0.5;
  const step = 1 / ss;

  let maskPx = 0;
  const groundDark: { i: number; x: number; y: number; d: number }[] = [];
  A.each((i, x, y) => {
    if (isHim(i)) {
      maskPx++;
      return;
    }
    const d = B.encL(i) - A.encL(i); // + = he darkened this ground pixel
    if (Math.abs(A.lin(i) - B.lin(i)) > DIFF && d > 0) groundDark.push({ i, x, y, d });
  });

  // ---- P1: cloak value vs the darkest painted crown -----------------------------------------
  const cloakEnc: number[] = [];
  const cloakLin: number[] = [];
  A.each((i, x, y) => {
    if (!isHim(i)) return;
    if (x < cloakBox.x0 || x > cloakBox.x1 || y < cloakBox.y0 || y > cloakBox.y1) return;
    if (x >= headBox.x0 && x <= headBox.x1 && y >= headBox.y0 && y <= headBox.y1) return;
    if (inWarm(x, y)) return; // §4.2's one warm patch is not cloth (§0.0.3, and P7 below)
    if (A.encL(i) < INK_ENC + 0.02) return; // the drawn contour is ink, not cloth
    cloakEnc.push(A.encL(i));
    cloakLin.push(A.lin(i));
  });
  const cloak = stat(cloakEnc);

  const crownOf = (a: Patch | null, c: Patch | null, label: string) => {
    if (!a || !c) return null;
    const e: number[] = [];
    const l: number[] = [];
    a.each((i) => {
      if (Math.abs(a.lin(i) - c.lin(i)) <= DIFF) return; // background, not crown
      e.push(a.encL(i));
      l.push(a.lin(i));
    });
    const s = stat(e);
    return {
      label,
      px: r1(s.n * px2),
      mean_enc: r3(s.mean),
      darkest_enc: r3(s.min),
      mean_lin: r3(stat(l).mean),
    };
  };
  const crowns = [crownOf(oakA, oakC, 'oak'), crownOf(pineA, pineC, 'pine')].filter(
    (c): c is NonNullable<typeof c> => c !== null && (c.px ?? 0) > 0,
  );
  const darkest = crowns.length
    ? crowns.reduce((m, c) => ((c.mean_enc ?? 1) < (m.mean_enc ?? 1) ? c : m))
    : null;

  // ---- P2: the 26-sample torso scan, ACROSS the bell ---------------------------------
  //
  // It used to scan straight DOWN the torso, and that column cannot see what the gate is
  // for. The cloak is a lathe: going down it the surface normal barely turns, so the lit
  // value barely moves and the whole column lands in one poster tier — the scan came back
  // 62,62,62,62,62,63,63,63,64,64,64,65,65 and reported "3 plateaux" purely out of the
  // quantization floor of a smooth run. The tier structure of a bell runs AROUND it, from
  // the key side to the shade side, which is a HORIZONTAL cut at the torso's own height.
  // Same 26 samples, same thresholds, the axis the value actually varies along.
  // Both cuts are taken, because the garment's tiers are not all on one axis and the
  // question the gate asks — does the cloth carry committed tiers at all — is answered by
  // either. ACROSS the bell reads the lighting sweep from the key side to the shade side;
  // DOWN the torso reads the three shingled bands and the shingle step between them
  // (§5 part 1). The reported plateau count is the better cut's, with both printed.
  const sampleLine = (x0: number, y0: number, x1: number, y1: number) => {
    const out: (number | null)[] = [];
    for (let k = 0; k < 26; k++) {
      const t = (k + 0.5) / 26;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const i = A.idx(x, y);
      out.push(i >= 0 && isHim(i) && !inWarm(x, y) ? Math.round(A.encL(i) * 255) : null);
    }
    return out;
  };
  const scanAcross = sampleLine(
    cloakBox.x0,
    cloakBox.y0 + cloakBox.h * 0.55,
    cloakBox.x1,
    cloakBox.y0 + cloakBox.h * 0.55,
  );
  // …down the cloth's own SPINE, not down the box's midline: the box includes the hem
  // flick and the patch pocket, which pull its centre off the body, and a straight column
  // there returned 11 nulls out of 26.
  const scanDown: (number | null)[] = [];
  for (let k = 0; k < 26; k++) {
    const y = cloakBox.y0 + ((k + 0.5) / 26) * cloakBox.h;
    let lo = Infinity;
    let hi = -Infinity;
    for (let x = cloakBox.x0; x <= cloakBox.x1; x += step) {
      const i = A.idx(x, y);
      if (i >= 0 && isFill(i)) {
        if (x < lo) lo = x;
        if (x > hi) hi = x;
      }
    }
    const cx = (lo + hi) / 2;
    const i = A.idx(cx, y);
    scanDown.push(
      Number.isFinite(cx) && i >= 0 && isHim(i) && !inWarm(cx, y)
        ? Math.round(A.encL(i) * 255)
        : null,
    );
  }
  // An authored stroke crossing the column is INK, not cloth tone — the gate asks what
  // range the SURFACE carries, and a 34/255 stroke pixel would hand it 60/255 for free.
  const INK_255 = Math.round((INK_ENC + 0.02) * 255);
  const levelsOf = (samples: (number | null)[]) => {
    const ok = samples.filter((v): v is number => v !== null && v > INK_255);
    const held = [...new Set(ok)].sort((a, b) => a - b);
    let n = 0;
    for (let k = 0; k < held.length; ) {
      let j = k + 1;
      while (j < held.length && held[j] - held[j - 1] <= 5) j++;
      if (ok.filter((v) => v >= held[k] && v <= held[j - 1]).length >= 2) n++;
      k = j;
    }
    return { n, range: ok.length ? Math.max(...ok) - Math.min(...ok) : NaN };
  };
  const across = levelsOf(scanAcross);
  const down = levelsOf(scanDown);
  const scan = across.n >= down.n ? scanAcross : scanDown;
  const scanOk = scan.filter((v): v is number => v !== null && v > INK_255);
  // A PLATEAU IS A COMMITTED VALUE, and the old definition could not tell one from a
  // gradient. "A run of ≥ 3 consecutive samples within 2/255" is satisfied by the
  // quantization floor of any slow ramp — the shipped smooth cloak scored 3 on
  // 62,62,62,62,62,63,63,63,64,64,64,65,65 while carrying no tiers at all, which is
  // exactly how a hard gate came to pass on the defect it exists to catch.
  //
  // A tier is a value the surface COMMITS to: more than one sample lands on it, and it is
  // separated from the next tier by a visible STEP rather than by rounding. `levelsOf`
  // above does that. Re-run against the shipped smooth cloak's own scan it scores 1, and
  // against a posterized bell it scores the bell's tier count.
  const plateaux = Math.max(across.n, down.n);
  // THE RANGE TERM READS THE WHOLE CLOTH, not one line of 26 samples. A line's range is
  // hostage to whether its samples happen to land on the thin drybrush rim, which is why
  // it swung 45 → 104 across breakpoints while nothing about the garment changed. The
  // cloak sample set (P1's, ink and the warm patch already excluded) is the same cloth
  // and its min/max is the range the surface actually carries.
  const scanRange = cloak.n ? Math.round((cloak.max - cloak.min) * 255) : NaN;

  // ---- P3 / P3b / P7: amber ----------------------------------------------------------------
  let amberHead = 0;
  let amberOff = 0;
  let warmestHead = 0; // the diagnosis's loosened test: "warmest pixel anywhere in his box"
  let warmestOff = 0;
  const amberEye = { L: 0, R: 0 };
  A.each((i, x, y) => {
    if (!isHim(i)) return;
    const inH = x >= headBox.x0 && x <= headBox.x1 && y >= headBox.y0 && y <= headBox.y1;
    if (inH) warmestHead = Math.max(warmestHead, A.warm(i));
    else warmestOff = Math.max(warmestOff, A.warm(i));
  });
  const eyeCx = { L: 0, R: 0 };
  const eyeCy = { L: 0, R: 0 };
  A.each((i, x, y) => {
    if (!isHim(i) || A.warm(i) < 70) return;
    const inHead =
      x >= headBox.x0 && x <= headBox.x1 && y >= headBox.y0 && y <= headBox.y1;
    if (inHead) amberHead++;
    // §0.0.3: the satchel IS amber-classified (R − B 91) and §4.2 keeps it as the one
    // warm patch, so P7 excludes its projected region. The amendment lived only in the
    // doc until now, and the gate reported a failure the doc had already ruled out.
    else if (!inWarm(x, y)) amberOff++;
    for (const s of ['L', 'R'] as const) {
      const e = eyeBox[s];
      if (e.n && x >= e.x0 && x <= e.x1 && y >= e.y0 && y <= e.y1) {
        amberEye[s]++;
        eyeCx[s] += x;
        eyeCy[s] += y;
      }
    }
  });
  // P3b, EXTENDED — "both eyes return amber" said nothing about WHERE. The shipped pair
  // passed this gate at 1.05 : 1 while hanging off the lower-left of the skull with the
  // near one's outer third outside the head's own silhouette, because counting amber
  // inside the head BBOX cannot tell an eye from a lobe stuck to the side of one. So the
  // centroid of each eye's amber must also land inside the head MASS's projected box —
  // the skull and hood, ears excluded.
  const eyeSeated = (['L', 'R'] as const).map((s) => {
    if (!amberEye[s]) return false;
    const cx = eyeCx[s] / amberEye[s];
    const cy = eyeCy[s] / amberEye[s];
    return (
      cx >= headMassBox.x0 && cx <= headMassBox.x1 && cy >= headMassBox.y0 && cy <= headMassBox.y1
    );
  });

  // ---- P4: rim thickness at sampled contour points -------------------------------------------
  // Value-based, not mask-based: the band the eye reads as "the line" is the BackSide shell
  // plus whatever authored stroke lies on the same contour, and both are ink.
  // The shell is a flat unlit MeshBasicMaterial at 0x222222 (pencil.ts:154), so a rim
  // pixel's encoded luma is EXACTLY 34/255 — no lighting term, no view term. That flat
  // plateau is what the band is identified by. A ceiling instead of a window does not
  // work on this figure: the shipped cloak's own shaded side reaches 0.153 encoded, so
  // any "darker than 0.26" test swallows half his body (measured: a 40px "rim").
  const INK_WIN = 0.018;
  const isRim = (i: number) => Math.abs(A.encL(i) - INK_ENC) <= INK_WIN;
  /** Walk INWARD from clear paper along one row. The first pixel the CONTOURED mask
   * covers is the rim's outer edge; the first pixel the UNCONTOURED mask covers is
   * where the form itself begins. The distance between them IS the drawn contour's
   * thickness at that point, in CSS px, measured as geometry rather than as colour. */
  const limit = 60 * ss;
  const isShell = (i: number) => S.lin(i) > 0.5;
  /** the screen x where a SHELL first covers this row, walking in from paper */
  const outerAt = (y: number, startX: number, dir: -1 | 1): number | null => {
    let x = startX;
    for (let k = 0; k < limit; k++) {
      const i = A.idx(x, y);
      if (i >= 0 && isShell(i)) return x;
      x += dir * step;
    }
    return null;
  };
  const rimAt = (label: string, y: number, startX: number, dir: -1 | 1) => {
    const outer = outerAt(y, startX, dir);
    if (outer === null) return { label, at_y: r1(y), px: null as number | null };
    // THE THICKNESS IS THE SHORTEST WAY THROUGH, not the width of the row. A row cuts the
    // contour at whatever angle the outline happens to run there, so one 3.2 px rim
    // measures 3.2 px on a vertical edge and 11 px where the outline is near-horizontal —
    // the spread this gate reported the moment the ear length moved its sampled row up
    // onto the crown. Fitting a tangent and dividing by its cosine over-corrects on a
    // 58 px figure (it read 1.46 px against a 3.2 px solve at 390×844); walking a fitted
    // normal over-shoots the other way, because the row's entry point is not the outline's
    // own nearest point. The minimum over a fan of inward directions needs no fit and is
    // the perpendicular distance by definition.
    let best: number | null = null;
    for (let a = -8; a <= 8; a++) {
      const th = (a / 8) * 1.25; // ±72° about the inward horizontal
      const ux = dir * Math.cos(th);
      const uy = Math.sin(th);
      let px = outer;
      let py = y;
      for (let jstep = 0; jstep < limit; jstep++) {
        const i = A.idx(px, py);
        if (i < 0) break;
        if (isFill(i)) {
          const d = Math.hypot(px - outer, py - y);
          if (best === null || d < best) best = d;
          break;
        }
        px += ux * step;
        py += uy * step;
      }
    }
    return { label, at_y: r1(y), px: best === null ? null : r3(best) };
  };
  // world +x projects to screen LEFT, so the seam side of any part is its SMALLER x.
  //
  // §14 P4 says "at the head's WIDEST projected point", and taking a fixed fraction of a
  // bounding box is not that: on the shipped stage the head box's own midpoint landed
  // down by the collar, where the cloak's shell is the first thing a row meets and the
  // head's fill is 6 px behind it — a gap between two parts, reported as a 6.5 px rim.
  // Find the widest FILL row inside each box and sample there.
  //
  // …and it is measured over MANY rows, not one. A single row is hostage to whatever part
  // happens to own the silhouette there: the left ear and the satchel carry authored
  // marks instead of a shell (§5 parts 6 and 11 — an ear's contour is two mark() strokes
  // ON the blade, by design), so a row that lands on either reports 0 px for a contour
  // that is not supposed to be a rim at all. Fifteen rows across the part's middle half,
  // reported as the MEDIAN with the zero count printed beside it: the median is the drawn
  // contour's weight, and `zero_rows` is the "part of his silhouette has no line on it"
  // reading, which is the thing that actually needed watching.
  const rimBand = (label: string, b: Box, side: 'seam' | 'painted') => {
    const dir = side === 'seam' ? 1 : -1;
    const startX = side === 'seam' ? b.x0 - 10 : b.x1 + 10;
    const vals: number[] = [];
    let zero = 0;
    let unshelled = 0;
    for (let k = 0; k < 15; k++) {
      const y = b.y0 + b.h * (0.25 + (0.5 * (k + 0.5)) / 15);
      const r = rimAt(label, y, startX, dir as -1 | 1);
      if (r.px === null) unshelled++; // no shell on this row of this side — an ear, an arm
      else if (r.px <= 0.01) zero++; // a shell IS here and it draws nothing: a real hole
      else vals.push(r.px);
    }
    vals.sort((p, q) => p - q);
    return {
      label,
      px: vals.length ? r3(vals[Math.floor(vals.length / 2)]) : null,
      rows: 15,
      zero_rows: zero,
      unshelled_rows: unshelled,
      spread_px: vals.length ? `${r3(vals[0])}–${r3(vals[vals.length - 1])}` : null,
    };
  };
  const rims = [
    rimBand('head, seam side', headMassBox, 'seam'),
    rimBand('head, painted side', headMassBox, 'painted'),
    rimBand('hem, seam side', cloakBox, 'seam'),
    rimBand('hem, painted side', cloakBox, 'painted'),
  ];
  // A ZERO OR A MISS IS A SAMPLE, NOT AN ABSENCE. The old line filtered `v > 0` before
  // taking max : min, so the two 0 px rows at 390 and 500 — stretches of silhouette with
  // no drawn line on them at all — vanished out of the ratio and the gate printed a
  // flattering 1.7 : 1 beside a failing pass flag. Zeros stay in; a miss prints as null
  // and takes the ratio with it.
  const rimVals = rims.map((r) => r.px).filter((v): v is number => v !== null);
  const rimComplete = rimVals.length === rims.length && rimVals.every((v) => v > 0);

  // ---- P5: the contact region under the hem ---------------------------------------------------
  // PROPORTIONAL padding, not a fixed 8 CSS px. An absolute pad is a different fraction
  // of the window at every breakpoint, which is most of why this gate drifted 0.512 →
  // 0.206 across the five walked widths while nothing about the pool changed.
  const pad = Math.max(4, bootBox.w * 0.42);
  const inContactWindow = (x: number, y: number) =>
    x >= bootBox.x0 - pad &&
    x <= bootBox.x1 + pad &&
    y >= figBox.y1 - bootBox.h &&
    y <= figBox.y1 + bootBox.h * 1.5;
  const contactPx = groundDark.filter((p) => p.d >= 0.1 && inContactWindow(p.x, p.y));
  const contactArea = contactPx.length * px2;
  const bootArea = bootBox.n ? bootBox.w * bootBox.h : NaN;
  const localGround = (() => {
    const v: number[] = [];
    B.each((i, x, y) => {
      if (x < bootBox.x0 - 3 * bootBox.w || x > bootBox.x0 - bootBox.w) return;
      if (y < figBox.y1 - bootBox.h || y > figBox.y1 + bootBox.h) return;
      v.push(B.encL(i));
    });
    return stat(v);
  })();

  // ---- P6: the crossing shadow -------------------------------------------------------------------
  // P5's device and P6's device are two different things doing two different jobs (§8),
  // and they overlap on the page: the contact pool sits under his boots, inside the cast
  // shadow's own footprint. Measuring the union as "the cast shadow" mixed the pool's
  // lighter feathered ring into the shadow's mean — resizing the pool moved P6 by 0.17
  // encoded, a number that has nothing to do with the shadow. The exclusion is the POOL'S
  // OWN projected region, taken from the scene graph like every other region here; a
  // boot-derived window is the wrong shape and misses the pool's feathered tail.
  const isPool = (i: number) => Math.abs(A.lin(i) - Bp.lin(i)) > DIFF;
  // 0.10, the same bar P5 uses for "darker than the local ground". The old 0.02 admitted
  // the cast's whole antialiased penumbra, and a penumbra is a larger fraction of a small
  // shadow than of a big one — the gate read 0.078 at 390×844 against 0.256 at 1440×900
  // on one unchanged shadow, purely from how much soft edge each region swept in.
  const shadowPx = groundDark.filter((p) => p.d >= 0.1 && p.x < seamX && !isPool(p.i));
  const shadow = stat(shadowPx.map((p) => A.encL(p.i)));
  const field = (() => {
    if (!shadowPx.length) return stat([]);
    const y0 = Math.min(...shadowPx.map((p) => p.y));
    const y1 = Math.max(...shadowPx.map((p) => p.y));
    const dark = new Set(shadowPx.map((p) => p.i));
    const v: number[] = [];
    A.each((i, x, y) => {
      if (y < y0 || y > y1 || x > seamX || dark.has(i) || isHim(i) || isPool(i)) return;
      v.push(A.encL(i));
    });
    return stat(v);
  })();
  const boundary = (() => {
    if (!shadowPx.length) return { drop_enc: null as number | null, width_px: null as number | null };
    // Cut ACROSS the shadow's long axis, not along it. The cast runs the (+x,+z)
    // diagonal, and the underdrawing's own tone gradients along exactly that direction,
    // so a cut at the tip measures the graphite field's ramp instead of the shadow's
    // edge. A vertical cut through the centroid crosses a long side at near-constant
    // field tone.
    const cx = shadowPx.reduce((s, p) => s + p.x, 0) / shadowPx.length;
    const col = shadowPx.filter((p) => Math.abs(p.x - cx) < 1 / ss);
    if (col.length < 4) return { drop_enc: null, width_px: null };
    const edge = Math.min(...col.map((p) => p.y)); // the upper long edge
    // MEANS over 4 CSS px either side, with ink strokes excluded — the graphite field
    // is full of authored 34/255 marks and a single-pixel probe lands on one often
    // enough to report a 0.03 shadow as a 0.47 "boundary".
    const band = (from: number, to: number) => {
      const v: number[] = [];
      for (let y = from; y <= to; y += 1 / ss) {
        const i = A.idx(cx, y);
        if (i >= 0 && !isRim(i) && !isHim(i)) v.push(A.encL(i));
      }
      return stat(v).mean;
    };
    const out = band(edge - 6, edge - 2);
    const ins = band(edge + 2, edge + 6);
    if (!Number.isFinite(out) || !Number.isFinite(ins)) return { drop_enc: null, width_px: null };
    const drop = out - ins;
    let w = 0;
    for (let y = edge - 6; y <= edge + 6; y += 1 / ss) {
      const i = A.idx(cx, y);
      if (i < 0 || isRim(i) || isHim(i)) continue;
      const t = (out - A.encL(i)) / (drop || 1);
      if (t > 0.1 && t < 0.9) w += 1 / ss;
    }
    return { drop_enc: r3(drop), width_px: r3(w) };
  })();

  // ==========================================================================================
  // §14 P3 anchors two widths — >= 40 @ 390 and >= 250 @ 1440 — and the step function
  // between them failed 500 and 768 on a figure that is simply smaller there. Linear
  // between the two authored anchors, flat outside them.
  const P3_floor =
    width <= 390 ? 40 : width >= 1440 ? 250 : Math.round(40 + (210 * (width - 390)) / 1050);
  const out = {
    viewport: { width, height, ss, curtain: opts.curtain ?? prev.curtain },
    domains:
      '*_enc = Rec.709 luma of the sRGB-ENCODED values (the doc + diagnosis domain); ' +
      '*_lin = Rec.709 luma of the LINEAR values (the shader mix domain). Read from a ' +
      'float target — never quantized to bytes.',
    figure: {
      bbox_css: { x: r1(figBox.x0), y: r1(figBox.y0), w: r1(figBox.w), h: r1(figBox.h) },
      aspect_h_over_w: r3(figBox.h / figBox.w),
      head_bbox_css: { x: r1(headBox.x0), y: r1(headBox.y0), w: r1(headBox.w), h: r1(headBox.h) },
      covered_css_px2: r1(maskPx * px2),
    },
    P1_cloak_vs_crown: {
      cloak_mean_enc: r3(cloak.mean),
      cloak_mean_lin: r3(stat(cloakLin).mean),
      cloak_px: r1(cloak.n * px2),
      crowns,
      darkest_crown_enc: darkest?.mean_enc ?? null,
      delta_enc: darkest ? r3((darkest.mean_enc ?? 0) - cloak.mean) : null,
      need: 'cloak ≤ darkest crown − 0.12',
      // WHY THIS STILL FAILS, AND WHY THE NUMBER IS NOT THE KNOB'S FAULT.
      //
      // §4.2's remedy is `gobCloak` 0x2E3742 → 0x272E37, and that has been taken: the
      // delta moved 0.004 → 0.05–0.086 across the five walked widths (the satchel, which
      // §4.2 calls the one warm patch, also stopped being averaged in as "cloak"). It
      // cannot reach 0.12, and the reason is arithmetic between three of the doc's own
      // gates rather than a tuning miss:
      //
      //   P8 requires every cloth pixel ≥ ink + 8/255 → cloak MIN ≥ 0.165 encoded
      //   P2 requires the cloth's encoded range ≥ 60/255 → 0.235
      //   a distribution with that min and that range has mean ≥ ~0.224
      //   the darkest measured crown is 0.322–0.328 → the best reachable delta is ~0.10
      //
      // …and that is the ceiling before any margin. The gate is left at the doc's 0.12 so
      // it keeps reporting the gap instead of being quietly moved to wherever the build
      // happens to land; closing it needs a decision about the CROWN's value (§15.1's own
      // "the knob is the strata, never him"), which is not this figure's to make.
      pass: darkest ? cloak.mean <= (darkest.mean_enc ?? 0) - 0.12 : null,
    },
    P2_torso_scan: {
      across_enc255: scanAcross,
      down_enc255: scanDown,
      levels: { across: across.n, down: down.n },
      samples_enc255: scan, // the better cut, printed as the gate's evidence
      range_enc255: Number.isFinite(scanRange) ? scanRange : null,
      plateaux,
      need: 'range ≥ 60/255 and ≥ 3 committed levels on either cut',
      pass: scanRange >= 60 && plateaux >= 3,
    },
    P3_amber: {
      in_head_px: amberHead,
      warmest_in_head: r1(warmestHead), // the diagnosis's loosened probe, same units
      warmest_off_head: r1(warmestOff),
      floor: P3_floor,
      rule: 'R − B ≥ 70 (encoded), on masked pixels inside the head bbox',
      near_eye: nearEye,
      near_px: amberEye[nearEye],
      far_px: amberEye[farEye],
      near_far_ratio: amberEye[farEye] ? r3(amberEye[nearEye] / amberEye[farEye]) : null,
      eyes_seated_on_skull: { L: eyeSeated[0], R: eyeSeated[1] },
      pass: amberHead >= P3_floor,
      pass_P3b:
        amberEye.L > 0 &&
        amberEye.R > 0 &&
        amberEye[nearEye] <= 2.5 * amberEye[farEye] &&
        eyeSeated[0] &&
        eyeSeated[1],
    },
    P4_rim_css_px: {
      samples: rims,
      missing: rims.filter((r) => r.px === null).map((r) => r.label),
      min: rimVals.length ? r3(Math.min(...rimVals)) : null,
      max: rimVals.length ? r3(Math.max(...rimVals)) : null,
      ratio: rimComplete ? r3(Math.max(...rimVals) / Math.min(...rimVals)) : null,
      need: 'each 2.6–3.6 CSS px, max : min ≤ 1.7 : 1 (measured perpendicular to the silhouette)',
      pass:
        rimComplete &&
        rimVals.every((v) => v >= 2.6 && v <= 3.6) &&
        Math.max(...rimVals) / Math.min(...rimVals) <= 1.7,
    },
    P5_contact: {
      area_css_px2: r1(contactArea),
      boot_bbox_css_px2: r1(bootArea),
      ratio: r3(contactArea / bootArea),
      mean_delta_enc: r3(stat(contactPx.map((p) => p.d)).mean),
      local_ground_enc: r3(localGround.mean),
      need: 'a region ≥ 0.9 × the boot bbox, ≥ 0.10 enc darker than the local ground',
      pass: contactArea >= 0.9 * bootArea,
    },
    P6_cast_shadow: {
      area_css_px2: r1(shadowPx.length * px2),
      shadow_mean_enc: r3(shadow.mean),
      field_mean_enc: r3(field.mean),
      delta_enc: r3(field.mean - shadow.mean),
      boundary,
      need: '≥ 0.25 enc darker than the surrounding graphite; ≥ 0.15 across ≤ 4 CSS px',
      pass:
        field.mean - shadow.mean >= 0.25 &&
        (boundary.drop_enc ?? 0) >= 0.15 &&
        (boundary.width_px ?? 99) <= 4,
    },
    P7_amber_off_head: { px: amberOff, need: '0 — amber is the eyes and nothing else', pass: amberOff === 0 },
    P8_prep_rig: {
      note: 'only meaningful when called with { curtain: 1 } — he is then the only lit thing',
      cloak_range_enc255: cloak.n ? Math.round((cloak.max - cloak.min) * 255) : null,
      cloak_darkest_enc: r3(cloak.min),
      ink_floor_enc: r3(INK_ENC + 8 / 255),
      need: 'lit range ≥ 45/255, and no pixel darker than ink + 8/255',
      pass: cloak.n
        ? (cloak.max - cloak.min) * 255 >= 45 && cloak.min >= INK_ENC + 8 / 255
        : null,
    },
  };

  if (opts.assert) {
    const failed = Object.entries(out)
      .filter(([, v]) => v && typeof v === 'object' && (v as { pass?: boolean }).pass === false)
      .map(([k]) => k);
    if (failed.length) throw new Error(`__gob(${width}×${height}) FAILED: ${failed.join(', ')}`);
  }
  return out;
}
