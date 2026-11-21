import { useEffect, useRef } from 'react';
import { frameHooks, story } from '../stage/bus';
import { seg, smooth } from '../stage/ease';
import './hero.css';

// The hero's page furniture (from story/'s Hero.tsx, minus the film): the drafting
// sheet and the scroll hint. heroLife writes the entrance onto these ids; scroll then
// fades the hint. The wordmark block (wordmark, tagline, subline, and its shrink to the
// top-left corner on scroll) is out for now.

export default function HeroDom({ storyOn }: { storyOn: boolean }) {
  const hint = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = -1;
    const hook = (u: number) => {
      if (Math.abs(u - last) < 1e-4) return;
      last = u;
      if (hint.current) hint.current.style.opacity = String(1 - smooth(seg(u, 0.02, 0.3)));
      if (ghost.current) ghost.current.style.opacity = String(1 - smooth(seg(u, 0.25, 0.9)));
      if (page.current) page.current.style.opacity = String(1 - smooth(seg(u, 12.6, 13)));
    };
    frameHooks.push(hook);
    return () => {
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);

  return (
    <div id="hero-dom">
      <h1 className="sr-only">Good Goblin</h1>
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
