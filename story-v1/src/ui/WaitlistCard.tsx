import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import HeroWordmark from '../hero/HeroWordmark';
import { Glyph } from './Glyph';

// The waitlist card: floats over the stage at the end of the story (Overlay), is a page
// section of its own on a return visit (After), and fills the site's "Get early access" dialog.
// Same markup, same styles. Its links go to the three products on the homepage.

export default function WaitlistCard({ className = 'card', peek = false }: { className?: string; peek?: boolean }) {
  const go = useNavigate();
  const [joined, setJoined] = useState(false);
  const join = (e: FormEvent) => {
    e.preventDefault();
    setJoined(true);
  };
  return (
    <section className={className} aria-label="Join the waitlist">
      <div className="card-mark">
        <HeroWordmark />
      </div>
      <p className="card-line">The Dungeon Master&rsquo;s backstage. Opening to a few tables first.</p>
      {joined ? (
        <p className="card-done">You&rsquo;re on the list. He&rsquo;ll light a lantern for you, and we&rsquo;ll email you when your seat opens.</p>
      ) : (
        <form className="card-form" onSubmit={join}>
          <label className="sr-only" htmlFor={`email-${peek ? 'story' : 'page'}`}>Email</label>
          <input id={`email-${peek ? 'story' : 'page'}`} type="email" required placeholder="you@email.com" autoComplete="email" />
          <button type="submit">Join</button>
        </form>
      )}
      <div className="card-links">
        <button type="button" onClick={() => go('/#map-editor')}>The map editor</button>
        <button type="button" onClick={() => go('/#live-table')}>The live table</button>
        <button type="button" onClick={() => go('/#discord-bot')}>The Discord bot</button>
      </div>
      {peek && (
        <div className="peek" aria-hidden="true">
          <div className="peek-glyph">
            <Glyph name="goblin-peek" />
          </div>
        </div>
      )}
    </section>
  );
}
