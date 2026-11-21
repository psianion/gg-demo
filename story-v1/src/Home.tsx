import { useEffect, useRef } from 'react';
import Stage from './stage/Stage';
import { HERO_REST } from './hero/film/stages/hero';
import { frameHooks, prm, sceneOut } from './stage/bus';
import { seg, smooth } from './stage/ease';
import './home.css';

// THE PAGE, for now: one screen, the island hero across the whole window and the words over the
// left of it. The stage draws the island exactly as the film's first beat does; nothing here moves
// the clock, so it stays at the top of the film, on the hero.

// when the closed beta starts, as the line reads it
const BETA_STARTS = 'December 2026';

// on a wide window the island comes to rest right of where the film puts it, and a little smaller,
// so the words have the left of the page and the island's sky still fades out inside the window; on
// a narrow one the words stack over it and it rests where the film puts it
const WIDE = window.matchMedia('(min-width: 1024px)');
const rest = () => Object.assign(HERO_REST, WIDE.matches ? { right: 0.16, size: 0.76 } : { right: 0, size: 1 });

export default function Home() {
  const text = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rest();
    WIDE.addEventListener('change', rest);
    return () => {
      WIDE.removeEventListener('change', rest);
      Object.assign(HERO_REST, { right: 0, size: 1 });
    };
  }, []);

  // the words come in as the paint finishes crossing, when the camera has nearly drawn back and the
  // island has settled to the right, so they never sit over the drawing; under reduced motion they
  // are simply there
  useEffect(() => {
    let last = -1;
    const hook = () => {
      const k = prm.reduced ? 1 : smooth(seg(sceneOut.painted, 0.8, 1));
      if (k === last || !text.current) return;
      last = k;
      text.current.style.opacity = String(k);
    };
    frameHooks.push(hook);
    return () => {
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);

  return (
    <main className="home">
      <div className="home-island" aria-hidden="true">
        <Stage />
        {/* the film's hero life (heroLife.ts) fades the page's grid ghost in on load and expects it
            to be there; this empty one stands in for it while the film's page furniture is off */}
        <div id="hero-gridghost" hidden />
      </div>
      <div className="home-text" ref={text}>
        <h1>Good Goblin</h1>
        <p className="home-copy">
          <span>
            <span>A map editor, a live table and a Discord bot for your game night.</span>
          </span>{' '}
          <span>
            <span>Open source.</span> <span>It runs in your browser, hosted right from your own machine.</span>
          </span>{' '}
          <span>
            <span>Your players join online, with nothing to install.</span>
          </span>
        </p>
        <p className="home-beta">Closed beta starts {BETA_STARTS}</p>
      </div>
    </main>
  );
}
