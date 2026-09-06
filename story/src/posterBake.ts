import * as THREE from 'three';
import { heroFraming, solveGoblinRim, solveGoblinScale, HERO_FOV } from './film/stages/hero';
import { setPencilResolution, STROKE_LAYER } from './film/pencil';
import { rig } from './film/stages/trilayer';
import { applyPose, REST } from './film/world';
import type { Hero } from './film/stages/hero';
import type { HeroLife } from './film/stages/heroLife';

// POSTER BAKE (P5 item 4, hero §13) — DEV-only, loaded lazily from Hero.tsx.
//
// `window.__bakePoster()` renders the SETTLED hero frame at exactly 1200×630 (the OG
// image and Picture-Book frame 1, consumed by P15/P16) from the REAL scene: the live
// renderer draws the actual scene graph through the authored 1200×630 framing solve
// into an offscreen target (2× supersampled), and the page's DOM layer — paper,
// margin, ticks, grid ghost, wordmark, tagline, meta — is composed over it at the
// same comp numbers hero.css derives from the viewport. The scroll affordance is
// deliberately absent: a printed poster does not say "scroll" (hero §13 designs the
// frame as a poster that happens to breathe).
//
// The result downloads as hero-poster.png; it is then stored under story/story/public/.

interface HeroHandle {
  hero: Hero;
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  life: HeroLife;
}

export function install(): void {
  (window as unknown as Record<string, unknown>).__bakePoster = bakePoster;
}

async function bakePoster(w = 1200, h = 630, ss = 2): Promise<void> {
  const handle = (window as unknown as { __hero?: HeroHandle }).__hero;
  if (!handle) throw new Error('no __hero handle — open the hero first');
  const { hero, gl, scene, life } = handle;
  life.skip(); // the poster is the settled frame, exactly
  // …and the figure in it is the ONE rest pose (goblin design §9.1, gate G10). The bake
  // used to inherit whatever the live head-track and the 4 s scritch had left on his
  // joints, so the poster and the reduced-motion still were the same frame only by luck.
  // Re-writing REST here makes the printed frame the authored one by construction — and
  // it is the same table `stageGoblin` and the PRM still read, so it cannot fork.
  applyPose(hero.goblin, REST);
  await document.fonts.load('16.8px Metamorphous');
  await document.fonts.load('italic 14.7px Vollkorn');

  const W = w * ss;
  const H = h * ss;

  // ---- the 3D frame, through the real renderer -----------------------------------
  const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const f = heroFraming(w, h);
  const cam = new THREE.PerspectiveCamera(HERO_FOV, w / h, 0.1, 120);
  cam.position.copy(f.position);
  cam.lookAt(f.look);
  cam.updateProjectionMatrix();
  cam.layers.enable(STROKE_LAYER);
  const prevNear = rig.depthNear.value;
  const prevFar = rig.depthFar.value;
  rig.depthNear.value = f.d * 0.95;
  rig.depthFar.value = f.d * 2.4;
  const prevGlow = hero.glowSprite?.scale.x ?? 1;
  hero.glowSprite?.scale.setScalar(1.15); // the ≥560px halo, whatever the live window
  // (w, h) — the LOGICAL comp, not the supersampled buffer. Both of these size a line in
  // *resolution* pixels, and the frame is downsampled 2 : 1 into the 1200×630 sheet
  // below, so handing them (W, H) shipped every stroke and both ink shells at HALF the
  // authored weight: the poster's rim landed at ~1.6 CSS px against GOB_RIM_PX 3.2.
  // gobMeasure passes the logical size for exactly this reason (gobMeasure.ts:166–170)
  // and measures ~3 px back; the two callers of one solve used to disagree.
  setPencilResolution(w, h);
  solveGoblinScale(hero.goblin, w, h); // §11.2 — and the rim below reads this scale
  solveGoblinRim(hero.goblin, w, h);
  const prevRT = gl.getRenderTarget();
  gl.setRenderTarget(rt);
  gl.clear();
  gl.render(scene, cam);
  const px = new Uint8Array(W * H * 4);
  gl.readRenderTargetPixels(rt, 0, 0, W, H, px);
  gl.setRenderTarget(prevRT);
  rt.dispose();
  rig.depthNear.value = prevNear;
  rig.depthFar.value = prevFar;
  hero.glowSprite?.scale.setScalar(prevGlow);
  setPencilResolution(window.innerWidth, window.innerHeight);

  // GL rows come back bottom-up — flip into an ImageData on a temp canvas
  const frame = document.createElement('canvas');
  frame.width = W;
  frame.height = H;
  const fctx = frame.getContext('2d')!;
  const img = fctx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
  }
  fctx.putImageData(img, 0, 0);

  // ---- the sheet + brand layer, at the 1200×630 comp -------------------------------
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  const paper = '#f7f5f0';
  const line = '#222222';
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(frame, 0, 0, w, h);

  // grid ghost (hero.css #hero-gridghost): 46vw×36vh at (2%, bottom 4%), rotateX 46°
  // under a 900px perspective, radial-masked — projected here point by point
  {
    const g = document.createElement('canvas');
    g.width = w;
    g.height = h;
    const gc = g.getContext('2d')!;
    const gw = 0.46 * w;
    const gh = 0.36 * h;
    const left = 0.02 * w;
    const bottom = h - 0.04 * h;
    const cx = left + gw / 2;
    const d = 900;
    const cos = Math.cos((46 * Math.PI) / 180);
    const sin = Math.sin((46 * Math.PI) / 180);
    const pr = (x: number, y: number) => {
      const s = d / (d + y * sin);
      return [cx + (x - cx) * s, bottom - y * cos * s] as const;
    };
    gc.strokeStyle = 'rgba(34, 34, 34, 0.05)';
    gc.lineWidth = 1;
    for (let x = left; x <= left + gw; x += 58) {
      gc.beginPath();
      gc.moveTo(...pr(x, 0));
      gc.lineTo(...pr(x, gh));
      gc.stroke();
    }
    for (let y = 0; y <= gh; y += 40) {
      gc.beginPath();
      gc.moveTo(...pr(left, y));
      gc.lineTo(...pr(left + gw, y));
      gc.stroke();
    }
    gc.globalCompositeOperation = 'destination-in';
    const m = gc.createRadialGradient(
      left + gw * 0.62,
      bottom - gh * 0.72 * cos,
      0,
      left + gw * 0.62,
      bottom - gh * 0.72 * cos,
      gw * 0.7,
    );
    m.addColorStop(0, 'rgba(0,0,0,0.9)');
    m.addColorStop(0.72, 'rgba(0,0,0,0)');
    gc.fillStyle = m;
    gc.fillRect(0, 0, w, h);
    ctx.drawImage(g, 0, 0);
  }

  // margin + ticks (hero.css: clamp(18px, 2.6vw, 36px) → 31.2 at 1200)
  const margin = Math.min(36, Math.max(18, 0.026 * w));
  ctx.strokeStyle = 'rgba(34, 34, 34, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(margin, margin, w - 2 * margin, h - 2 * margin);
  const tickAt = Math.min(30, Math.max(14, 0.02 * w));
  ctx.fillStyle = 'rgba(34, 34, 34, 0.16)';
  ctx.fillRect(w / 2 - 0.5, tickAt, 1, 9);
  ctx.fillRect(w / 2 - 0.5, h - tickAt - 9, 1, 9);
  ctx.fillRect(tickAt, h / 2 - 0.5, 9, 1);
  ctx.fillRect(w - tickAt - 9, h / 2 - 0.5, 9, 1);

  // the brand block (hero.css #hero-brand): left margin+1.2vw, top 12vh, width 368
  const bx = margin + 0.012 * w;
  const by = 0.12 * h;
  const bw = Math.min(0.38 * w, 368);
  const bh = bw * (490 / 800);
  const svgEl = document.querySelector('#hero-brand svg');
  if (svgEl) {
    // React renders inline SVG without xmlns; an SVG-as-image requires it, and the
    // CSS custom properties resolve to nothing outside the document
    const src = svgEl.outerHTML
      .replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      .replaceAll('var(--line)', line)
      .replaceAll('var(--paper)', paper);
    const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
    await new Promise<void>((resolve, reject) => {
      const im = new Image();
      im.onload = () => {
        ctx.drawImage(im, bx, by, bw, bh);
        URL.revokeObjectURL(url);
        resolve();
      };
      im.onerror = reject;
      im.src = url;
    });
  }
  ctx.textBaseline = 'top';
  ctx.fillStyle = line;
  ctx.font = '16.8px Metamorphous';
  const tagY = by + bh + 10.4;
  ctx.fillText('The Dungeon Master’s backstage.', bx, tagY);
  ctx.fillStyle = '#4a4844';
  ctx.font = 'italic 14.7px Vollkorn';
  ctx.fillText('a tale told in one take · about two minutes', bx, tagY + 16.8 * 1.3 + 7.2);

  // stash for headless retrieval (Chrome's auto-download policy can eat the click)
  (window as unknown as Record<string, unknown>).__posterDataUrl = cv.toDataURL('image/png');
  cv.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hero-poster.png';
    a.click();
  }, 'image/png');
}
