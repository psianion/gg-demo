import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { buildIsland } from './film/stages/islandKit';
import { createTrilayer, rig, GRID_INK } from './film/stages/trilayer';
import { createRigs, prmAmbient } from './film/stages/rigs';
import { curtain, markAlive, tick, glidingDrain, snapBack, TICK, DRAIN } from './film/curtain';
import { paper, ink, canopy, timber, stoneCool, mushCap, dieBone } from './film/palette';

// ?sandbox=island (dev-only; main.tsx's gate constant-folds this route out of
// production builds the same way App.tsx drops the HUD). One island, a few trilayer
// primitives, the two motion-§12 freeze recipes runnable both directions, a scrub
// slider for reversibility, and a real readPixels measurement of the battle-grid
// watermark's ink against GRID_INK.

// The measurement works in LINEAR light — the domain GRID_INK actually mixes in.
// The old read compared sRGB-encoded canvas bytes against the cap: different units,
// ~4x under-reported, and it would only have failed near 22% ink.
const linearLum = (hex: number) => {
  // THREE.Color(hex) converts sRGB hex into the linear working space
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};
const INK_LUM = linearLum(ink);

type ThreeState = { gl: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera };

// world-clock stub: the tick recipe stops it; the spinner and the rig's amber flicker
// both make that visible (flicker rides world.t, so a tick stills the fire)
const world = { timeScale: 1, t: 0 };

function Diorama() {
  const kit = useMemo(() => {
    const island = buildIsland({ radiusX: 2.5, radiusZ: 1.75 });
    // a few primitives on the card — kept off the centre patch the ink measurement
    // samples, so the readback sees flat ground
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), createTrilayer({ color: timber }));
    crate.position.set(-1.4, 0.25, 0.3);
    crate.rotation.y = 0.4;
    const tree = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.3, 9), createTrilayer({ color: canopy }));
    tree.position.set(1.5, 0.65, -0.5);
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.3),
      createTrilayer({ color: stoneCool }),
    );
    boulder.position.set(1.0, 0.22, 0.75);
    boulder.scale.y = 0.7;
    // foreground occluder (direction §10 second half): nearer than rig.silhouetteNear,
    // so under Prep it reads as a near-black silhouette, not a drawing
    const nearRock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.3),
      createTrilayer({ color: stoneCool }),
    );
    nearRock.position.set(1.3, 2.3, 3.9);
    nearRock.rotation.set(0.3, 0.7, 0.1);
    island.root.add(nearRock);
    // the spinner: driven by world.timeScale, so the tick visibly stops the clock
    const spinner = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22),
      createTrilayer({ color: mushCap }),
    );
    spinner.position.set(-0.9, 0.75, -0.7);
    island.root.add(crate, tree, boulder, spinner);
    // The painted world casts (hero §5: "trees and goblin cast"): world props register
    // through the rig's own markCaster (per-rig registry, P4 pre-work) and the rig
    // flips them with the curtain — casting under Performance, released at the
    // fully-drawn page, where only the alive remains.
    const rigs = createRigs();
    rigs.markCaster(crate);
    rigs.markCaster(tree);
    rigs.markCaster(boulder);
    // The alive stand-in (P3): a markAlive'd primitive — permanent caster, so on the
    // fully-drawn page its shadow is the only one left while the crate/tree/boulder
    // release. Its trilayer keeps paint through every curtain/seam state (the alive
    // uniform).
    const alive = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18, 0.45, 6, 12),
      createTrilayer({ color: dieBone }),
    );
    alive.position.set(-0.4, 0.5, 1.15);
    markAlive(alive);
    island.root.add(alive);
    return { island, spinner, rigs };
  }, []);

  useFrame((_, delta) => {
    world.t += delta * world.timeScale;
    kit.spinner.rotation.y += delta * 1.6 * world.timeScale;
    kit.spinner.rotation.x += delta * 0.7 * world.timeScale;
    kit.rigs.update(world.t);
  });

  return (
    <>
      <primitive object={kit.island.root} />
      <primitive object={kit.rigs.root} />
    </>
  );
}

export default function IslandSandbox() {
  const three = useRef<ThreeState | null>(null);
  const readout = useRef<HTMLDivElement>(null);
  const [inkMeasure, setInkMeasure] = useState<string>('ink: not yet measured');

  // the sandbox owns the rig for its scale: the island is ~4 units deep, so the two
  // depth falloffs need a hand-span range to be visible at all
  useEffect(() => {
    rig.depthNear.value = 4.5;
    rig.depthFar.value = 12;
    // the near rock sits ~2.1 units from the lens; the island ground starts ~4.6 —
    // a 4-unit threshold silhouettes the occluder and leaves the drawing alone
    rig.silhouetteNear.value = 4;
    return () => {
      rig.depthNear.value = 6;
      rig.depthFar.value = 26;
      rig.silhouetteNear.value = 2.5;
      rig.seamX.value = 1e6; // seam parked — the film follows the curtain alone
      curtain.value = 0; // module singleton — leave the film's state untouched
      world.timeScale = 1;
    };
  }, []);

  // the two recipes as paused timelines — play/reverse are the "both directions"
  // buttons, and the sliders scrub them, which IS the reversibility check
  const tlTick = useRef<gsap.core.Timeline | null>(null);
  const tlDrain = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    const a = gsap.timeline({ paused: true });
    tick(a, 0, world);
    const b = gsap.timeline({ paused: true });
    glidingDrain(b, 0, 1, (DRAIN.min + DRAIN.max) / 2);
    snapBack(b, 2.2);
    tlTick.current = a;
    tlDrain.current = b;
    return () => {
      a.kill();
      b.kill();
      curtain.value = 0;
      world.timeScale = 1;
    };
  }, []);

  // live readout, DevHud-style: textContent through a ref, no per-frame setState
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (readout.current) {
        const seam = rig.seamX.value < 1e5 ? rig.seamX.value.toFixed(2) : 'off';
        readout.current.textContent =
          `curtain ${curtain.value.toFixed(3)}  timeScale ${world.timeScale.toFixed(3)}` +
          `  seamX ${seam}  prmAmbient ${prmAmbient()}` +
          `  tick={clock:${TICK.clock},curtain:${TICK.curtain}}  drain=${DRAIN.min}–${DRAIN.max}t`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // THE INK MEASUREMENT — a real framebuffer readback, not an eyeball. Renders the
  // Prep state twice (grid on / grid off) into a FLOAT render target — the film's own
  // world-pass path: off-canvas, linear, no tone mapping, and no 8-bit quantization
  // (a byte readback at this base tone jitters ±1.2% per byte, swamping a 4% signal).
  // Per pixel it recovers the shader's own LINEAR mix factor: the grid writes
  // out = mix(base, ink, g), so g = (lumOff - lumOn) / (lumOff - lumInk). That is the
  // exact unit GRID_INK caps — like-for-like, no sRGB laundering — so at the cap the
  // worst pixel reads ~4%, not the ~0.95% the encoded-domain read used to claim.
  const measure = () => {
    const s = three.current;
    if (!s) {
      setInkMeasure('grid ink: FAIL — WebGL root not up, nothing measured');
      console.error('island sandbox: ink measurement found no WebGL root');
      return;
    }
    const ctx = s.gl.getContext();
    const w = ctx.drawingBufferWidth;
    const h = ctx.drawingBufferHeight;
    // a patch big enough that several grid lines cross it at any dpr
    const size = Math.min(Math.round(Math.min(w, h) * 0.3), w, h);
    const x0 = Math.round((w - size) / 2);
    const y0 = Math.round((h - size) / 2);
    const target = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.FloatType,
      colorSpace: THREE.NoColorSpace, // linear in, linear out — the film's target path
      stencilBuffer: false,
    });
    const read = () => {
      s.gl.setRenderTarget(target);
      s.gl.render(s.scene, s.camera);
      const buf = new Float32Array(size * size * 4);
      s.gl.readRenderTargetPixels(target, x0, y0, size, size, buf);
      return buf;
    };
    const prevCurtain = curtain.value;
    curtain.value = 1; // the grid lives in the underdrawing — measure it in Prep
    rig.grid.value = 1;
    const on = read();
    rig.grid.value = 0;
    const off = read();
    rig.grid.value = 1;
    curtain.value = prevCurtain;
    s.gl.setRenderTarget(null);
    target.dispose();

    let worst = 0;
    let sum = 0;
    for (let i = 0; i < on.length; i += 4) {
      // Un-premultiply by coverage first — the same `frame.rgb / max(a, 1e-4)` the
      // film's curtain composite runs. A feather-rim pixel blends over the target's
      // transparent black, and skipping this skews the recovered factor upward.
      const aOff = off[i + 3];
      if (aOff < 0.15) continue; // off the card — the page carries no watermark
      const a =
        (0.2126 * on[i] + 0.7152 * on[i + 1] + 0.0722 * on[i + 2]) / Math.max(on[i + 3], 1e-4);
      const b =
        (0.2126 * off[i] + 0.7152 * off[i + 1] + 0.0722 * off[i + 2]) / Math.max(aOff, 1e-4);
      // recover the mix factor toward ink this pixel took — the unit of the cap
      const g = Math.abs(b - a) / Math.max(b - INK_LUM, 1e-4);
      if (g > worst) worst = g;
      sum += g;
    }
    const mean = sum / (size * size);
    // presence rides the worst pixel: the grid is sparse lines, so the region MEAN is
    // legitimately near zero — a worst-pixel delta is the watermark existing.
    // EPS is float32 round-trip slack only, ~0.0025% of the cap — not ink allowance.
    const EPS = 1e-6;
    const present = worst > 0.002;
    const pass = worst <= GRID_INK + EPS && present;
    setInkMeasure(
      `grid ink: worst ${(worst * 100).toFixed(2)}% mean ${(mean * 100).toFixed(3)}%` +
        ` linear mix toward ink (cap ${GRID_INK * 100}%) — ${pass ? 'PASS' : 'FAIL'}`,
    );
    if (!pass) console.error(`grid watermark ink assertion failed: worst ${worst}, mean ${mean}`);
  };

  // Auto-run once the WebGL root is up — RETRYING until it is (a background tab can
  // delay R3F's first mount well past any fixed timeout), and failing LOUDLY if it
  // never arrives, instead of silently no-oping at t=900ms.
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      if (three.current) {
        clearInterval(id);
        measure();
      } else if (++tries >= 40) {
        clearInterval(id);
        setInkMeasure('grid ink: FAIL — WebGL root never appeared for the auto-measure');
        console.error('island sandbox: ink auto-measure gave up after 12s without a WebGL root');
      }
    }, 300);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btn: CSSProperties = {
    font: '12px ui-monospace, Consolas, monospace',
    padding: '4px 10px',
    background: '#f7f5f0',
    color: '#222',
    border: '1px solid #222',
    cursor: 'pointer',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f7f5f0' }}>
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        // `flat` = NoToneMapping: RENDER-PIPELINE PARITY with the film. The film's
        // world pass renders into a target (three suppresses tone mapping off-canvas)
        // and its curtain composite is toneMapped:false with one sRGB encode — so the
        // film applies NO tone mapping to world materials. The sandbox signs off
        // material states that must look identical when wired in; ACES here showed a
        // grey disc that would be graphite-on-PAPER in the film (direction §10).
        flat
        // shadows on: the alive-shadow rule is the thing under test here. The film's
        // Canvas keeps shadows off, so markAlive's castShadow flags stay inert there.
        // 'percentage' = PCFShadowMap — the boolean default maps to PCFSoftShadowMap,
        // which three r185 deprecates with a console warning (and PCF honours
        // shadow.radius, which the rig uses for the soft edge).
        shadows="percentage"
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true }}
        camera={{ fov: 42, near: 0.1, far: 100, position: [0, 3.4, 5.2] }}
        onCreated={(state) => {
          three.current = { gl: state.gl, scene: state.scene, camera: state.camera };
          // QA handle, Film.tsx's window.__film precedent — dev-only route, walk dumps
          (window as unknown as Record<string, unknown>).__island = three.current;
          state.camera.lookAt(0, 0, 0);
        }}
      >
        {/* both rigs now come from rigs.ts, blended by the curtain — see Diorama */}
        <Diorama />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          font: '12px ui-monospace, Consolas, monospace',
          color: '#222',
          background: 'rgba(247,245,240,.92)',
          border: '1px solid #222',
          padding: 10,
          maxWidth: 460,
        }}
      >
        <div ref={readout} />
        <div>{inkMeasure}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={btn} onClick={() => { curtain.value = 0; }}>rig A · performance</button>
          <button style={btn} onClick={() => { curtain.value = 1; }}>rig B · prep</button>
          <button style={btn} onClick={() => tlTick.current?.play()}>tick ▶</button>
          <button style={btn} onClick={() => tlTick.current?.reverse()}>tick ◀</button>
          <button style={btn} onClick={() => tlDrain.current?.tweenTo((DRAIN.min + DRAIN.max) / 2)}>
            drain ▶
          </button>
          <button style={btn} onClick={() => tlDrain.current?.tweenTo(0)}>drain ◀</button>
          <button style={btn} onClick={() => tlDrain.current?.play()}>drain + snap</button>
          <button style={btn} onClick={measure}>measure ink</button>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          scrub tick
          <input
            type="range"
            min={0}
            max={1000}
            defaultValue={0}
            style={{ flex: 1 }}
            onInput={(e) => tlTick.current?.pause().progress(Number(e.currentTarget.value) / 1000)}
          />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          seam sweep
          <input
            type="range"
            min={0}
            max={1000}
            defaultValue={1000}
            style={{ flex: 1 }}
            // sweep the spatial seam across the card: left = all drawing, right = all
            // painted (3.4 puts the blend band past the card's rim). One uniform, by
            // identity — the trilayer, the drop shadow and the rigs all read it.
            onInput={(e) => {
              rig.seamX.value = -3.4 + (6.8 * Number(e.currentTarget.value)) / 1000;
            }}
          />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          scrub drain
          <input
            type="range"
            min={0}
            max={1000}
            defaultValue={0}
            style={{ flex: 1 }}
            onInput={(e) => tlDrain.current?.pause().progress(Number(e.currentTarget.value) / 1000)}
          />
        </label>
      </div>
    </div>
  );
}
