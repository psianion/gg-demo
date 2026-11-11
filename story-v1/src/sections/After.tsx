import { useEffect, useRef, useState } from 'react';
import { capture, frameHooks, nav, story } from '../stage/bus';
import { clock } from '../stage/clock';
import { Glyph } from '../ui/Glyph';
import WaitlistCard from '../ui/WaitlistCard';
import './after.css';

// After the unpin: three feature sections (one still each, rendered from the live scene
// in the visitor's own state), the waitlist as a page section on a return visit (the
// story ends on its own card), a footer, and the mini island that rewinds to the top.

const FEATURES = [
  {
    id: 'f-map',
    title: 'The map editor',
    still: 0,
    lines: [
      'Paint the ground, drop props, draw the paths. It looks hand-drawn because it is.',
      'Light, weather and encounters are toggles, not layers you rebuild.',
      'Prep a dungeon on the bus. It is ready when you sit down.',
    ],
  },
  {
    id: 'f-table',
    title: 'The live table',
    still: 1,
    lines: [
      'Tokens, turns and fog of war, run from your screen.',
      'Players see the map, never your notes or the monsters you are saving.',
      'Rolls land on the table for everyone at once.',
    ],
  },
  {
    id: 'f-bot',
    title: 'The Discord bot',
    still: 2,
    lines: [
      'Your players join from the server they already use.',
      'Initiative, rolls and recaps post to the channel by themselves.',
      'Nothing to install. Nothing to explain.',
    ],
  },
];

export default function After({ storyOn }: { storyOn: boolean }) {
  const [stills, setStills] = useState<string[]>([]);
  const mini = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let last = false;
    let shot = false;
    const hook = () => {
      // the stills are rendered from the scene once, in the visitor's state — at a
      // moment of rest late in the film (readPixels stalls a frame), or at the unpin
      const P = story.pinned();
      const resting = Math.abs(clock.v) < 0.01 && clock.u > 14;
      if (!shot && capture.fn && (resting || nav.raw > P + 0.2)) {
        shot = true;
        capture.fn().then(setStills);
      }
      const on = nav.raw > P + 0.6;
      if (on !== last && mini.current) {
        last = on;
        mini.current.classList.toggle('on', on);
      }
    };
    frameHooks.push(hook);
    return () => {
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);

  return (
    <>
      <main id="after">
        {FEATURES.map((f, i) => (
          <section key={f.id} id={f.id} className={`feature${i % 2 ? ' flip' : ''}`}>
            <figure className="still">
              {stills[f.still] ? <img src={stills[f.still]} alt={`${f.title}: a still from the island`} /> : <div className="still-wait" />}
            </figure>
            <div className="feature-copy">
              <h2>{f.title}</h2>
              {f.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </section>
        ))}
        {!storyOn && (
          <section id="waitlist">
            <WaitlistCard className="card static" />
          </section>
        )}
        <footer id="footer">
          <p className="foot-mark">GOOD GOBLIN</p>
          <p>The Dungeon Master&rsquo;s backstage. Opening to a few tables first.</p>
          <p className="foot-small">&copy; 2026 Good Goblin &middot; No goblins were seen during the making of this site.</p>
        </footer>
      </main>
      <button
        ref={mini}
        type="button"
        className="mini-island"
        aria-label="Back to the top"
        onClick={() => nav.go(0, { duration: 3.2 })}
      >
        <MiniIsland />
      </button>
    </>
  );
}

function MiniIsland() {
  return <Glyph name="mini-island" />;
}
