import { useEffect, useRef } from 'react';
import { BOUNDARIES, gearingInverse, stageAt } from './film/gearing';

// Dev-only readout (?hud=1, and App only mounts it under import.meta.env.DEV, so it is
// dead-code-eliminated from production builds): live t / stage / fps / dpr, and keys
// 1-9 jump to the stage boundaries (1 = t0 … 9 = t66). Writes textContent through a
// ref rather than state — a per-frame setState would re-render App's tree 60x/s.
export default function DevHud({ jump }: { jump: (y: number) => void }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let fps = 0;
    let stamp = performance.now();
    const loop = () => {
      frames += 1;
      const now = performance.now();
      if (now - stamp >= 500) {
        fps = Math.round((frames * 1000) / (now - stamp));
        frames = 0;
        stamp = now;
      }
      // the QA handle Film.tsx already exposes; reads the scrubbed playhead, which is
      // the true current t (scroll position is only its target)
      const tl = (window as unknown as { __film?: { tl?: { time(): number } } }).__film?.tl;
      const t = tl ? tl.time() : 0;
      const canvas = document.querySelector('canvas');
      const dpr =
        canvas && canvas.clientWidth ? (canvas.width / canvas.clientWidth).toFixed(2) : '—';
      if (el.current) {
        el.current.textContent = `t ${t.toFixed(2).padStart(5)}  ${stageAt(t).name}  ${fps}fps  dpr ${dpr}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > BOUNDARIES.length) return;
      jump(gearingInverse(BOUNDARIES[n - 1]) * (document.body.scrollHeight - window.innerHeight));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, [jump]);

  return (
    <div
      ref={el}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: 20,
        font: '12px/1.5 ui-monospace, Consolas, monospace',
        color: '#222222',
        background: 'rgba(247, 245, 240, 0.85)',
        padding: '3px 8px',
        pointerEvents: 'none',
        whiteSpace: 'pre',
      }}
    />
  );
}
