import { useEffect, useRef } from 'react';
import HeroWordmark from './HeroWordmark';
import { frameHooks, story } from '../stage/bus';
import { lerp, seg, smooth, smoother } from '../stage/ease';
import './hero.css';

// The hero's page furniture (from story/'s Hero.tsx, minus the film): the drafting
// sheet, the wordmark block, the scroll hint. heroLife writes the entrance onto these
// ids; scroll then shrinks the wordmark to the top-left corner (pure in u) and fades
// the tagline, subline and hint.

export default function HeroDom({ storyOn }: { storyOn: boolean }) {
  const brand = useRef<HTMLElement>(null);
  const mover = useRef<HTMLDivElement>(null);
  const sub = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let box = { left: 0, top: 0, width: 1 };
    const measure = () => {
      const el = brand.current;
      const mv = mover.current;
      if (!el || !mv) return;
      const t = mv.style.transform;
      mv.style.transform = '';
      const r = el.getBoundingClientRect();
      box = { left: r.left, top: r.top, width: r.width };
      // the wrapper scales about the wordmark's own top-left corner, so the hero
      // stylesheet's own transforms (portrait centring) are left alone
      mv.style.transformOrigin = `${r.left}px ${r.top}px`;
      mv.style.transform = t;
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    let last = -1;
    const hook = (u: number) => {
      if (Math.abs(u - last) < 1e-4) return;
      last = u;
      const k = smoother(seg(u, 0.12, 1.5));
      const small = window.innerWidth < 700 ? 104 : 132;
      const s = lerp(1, small / box.width, k);
      const m = window.innerWidth < 700 ? 14 : 22;
      const dx = lerp(0, m - box.left, k);
      const dy = lerp(0, m - box.top, k);
      const out = 1 - smooth(seg(u, 16.9, 17.25)); // the card carries the wordmark from here
      if (mover.current) {
        mover.current.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
        mover.current.style.visibility = out > 0.001 ? 'visible' : 'hidden';
        mover.current.style.opacity = String(out);
      }
      if (sub.current) sub.current.style.opacity = String(1 - smooth(seg(u, 0.1, 0.6)));
      if (hint.current) hint.current.style.opacity = String(1 - smooth(seg(u, 0.02, 0.3)));
      if (ghost.current) ghost.current.style.opacity = String(1 - smooth(seg(u, 0.25, 0.9)));
      if (page.current) page.current.style.opacity = String(1 - smooth(seg(u, 12.6, 13)));
    };
    frameHooks.push(hook);
    return () => {
      window.removeEventListener('resize', measure);
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);

  return (
    <div id="hero-dom">
      <p className="sr-only">
        A small island of a fantasy world floats on a sheet of paper, half painted and half still a
        pencil drawing. A goblin works at the edge of the painted part, carpenter&rsquo;s pencil in hand.
      </p>
      <div id="hero-page" ref={page} aria-hidden="true">
        <div id="hero-margin" />
        <span className="hero-tick t-n" />
        <span className="hero-tick t-s" />
        <span className="hero-tick t-e" />
        <span className="hero-tick t-w" />
        <div ref={ghost}>
          <div id="hero-gridghost" />
        </div>
      </div>
      <div className="brand-wrap" ref={mover}>
        <header id="hero-brand" ref={brand}>
          <h1 className="sr-only">Good Goblin</h1>
          <HeroWordmark />
          <div ref={sub}>
            <p id="hero-tagline">The Dungeon Master&rsquo;s backstage.</p>
            <p id="hero-meta">Build the maps. Run the table. The goblin does the rest.</p>
          </div>
        </header>
      </div>
      {/* a return visit gets "See for yourself" where the scroll hint sits; the entrance
          fades #hero-hint in either way */}
      <div ref={hint} className="hint-wrap">
        <div id="hero-hint" aria-hidden={storyOn}>
          {storyOn ? (
            <>
              <span>scroll</span>
              <svg viewBox="0 0 12 26">
                <path d="M6 1 C7 8 5 14 6 21" />
                <path d="M2.5 17.5 L6 21.5 L9.5 17.5" />
              </svg>
            </>
          ) : (
            <button type="button" id="hero-see" onClick={() => story.start()}>
              See for yourself
            </button>
          )}
        </div>
      </div>
      <p id="hero-note" aria-hidden="true">
        sharpening pencils&hellip;
      </p>
    </div>
  );
}
