import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Film from './film/Film';
import Wordmark from './Wordmark';

gsap.registerPlugin(ScrollTrigger);

// mobile browser chrome collapsing on scroll changes viewport height mid-scrub;
// without this the film jumps to a different beat as the address bar hides
ScrollTrigger.config({ ignoreMobileResize: true });

// Closed beta lives in Discord — no waitlist, no backend. Swap this for the real
// invite before launch.
const DISCORD_URL = '#';

// Until it is a real destination the CTA stays on this page: a placeholder href with
// target="_blank" opens a second copy of the film, which reads as the button being
// broken rather than the invite not existing yet.
const CTA_IS_LIVE = DISCORD_URL !== '#';

// captions: id -> (text, italic, white-on-blackout vs dark-on-paper)
// Every caption sits in the same lower-third band now, so there is no more `above`
// variant for the freeze lines. `low` is only a size/voice choice: it seats narration
// a touch smaller, for lines said under the work rather than to camera.
// `high` seats a caption at 24% instead of the shared 78% band — color-script.md §6:
// the me* lines sit in the t9.5-16.5 to-camera freeze, where the lower-third band
// crosses the goblin's tunic (3.54:1, under the 4.5:1 caption floor).
const CAPTIONS: { id: string; text: string; onPaper?: boolean; low?: boolean; high?: boolean }[] = [
  { id: 'open1', text: 'Every campaign begins the same way…' },
  { id: 'open2', text: '…and one goblin always gets away.', onPaper: true },
  { id: 'me1', text: 'That was me.', onPaper: true, high: true },
  { id: 'me2', text: 'You thought I ran away.', onPaper: true, high: true },
  { id: 'me3', text: 'I did.', onPaper: true, high: true },
  { id: 'me4', text: 'Straight to work.', onPaper: true, high: true },
  { id: 'light1', text: 'Someone has to light the world.', onPaper: true, low: true },
  { id: 'set1', text: 'Your DM dreams it. I move the scenery.', onPaper: true, low: true },
  // nat1 / nat20 are cut — the die shows its own faces at that distance, and a caption
  // naming the roll it's already displaying was redundant with the shot.
  { id: 'welcome', text: "You're welcome.", onPaper: true },
  { id: 'pitch1', text: "I've built worlds for your DM for years.", onPaper: true },
  { id: 'pitch2', text: 'Now I work for every table.', onPaper: true },
];

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The beat sheet is authored in seconds and runs to t66, so playing the scroll track out
// over 66s is the film at the pace it was cut for.
const RUNTIME = 66;

const scrollMax = () => document.body.scrollHeight - window.innerHeight;

type PlayState = 'idle' | 'playing' | 'ended';

export default function App() {
  // Element | not just HTMLElement — the scroll rail below is a pair of SVG <path>
  // nodes, and GSAP tweens those the same way it tweens any DOM node.
  const caps = useRef<Record<string, Element>>({}).current;
  const lenis = useRef<Lenis | null>(null);
  const [play, setPlay] = useState<PlayState>('idle');

  // Browsers restore scroll position on refresh, which drops you back into the middle of
  // a film with no memory of how you got there. A reload should start it over.
  // Runs before the Lenis effect so Lenis reads a scroll position of 0 when it starts.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Smoothing is the one piece of motion the visitor didn't ask for — the film
    // itself is scrubbed by their own scroll, so it still plays under reduced motion,
    // just without the glide.
    if (prefersReducedMotion()) return;

    const instance = new Lenis();
    lenis.current = instance;
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  // Scroll the page at the film's own rate. Driving the scroll position directly rather
  // than handing Lenis a long tween keeps the pace exactly linear — the timeline is
  // scrubbed off scroll distance, so any easing in the scroll is easing in the cut.
  useEffect(() => {
    if (play !== 'playing') return;

    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      // a backgrounded tab hands back a dt of many seconds; without the clamp the film
      // jumps a third of its length the moment you look at it again
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const end = scrollMax();
      const y = Math.min(window.scrollY + (end / RUNTIME) * dt, end);
      if (lenis.current) lenis.current.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
      if (y >= end - 1) return setPlay('ended');
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // Any deliberate scroll hands control back. Playback that fights the wheel is worse
    // than no playback at all.
    const yield_ = () => setPlay('idle');
    window.addEventListener('wheel', yield_, { passive: true });
    window.addEventListener('touchstart', yield_, { passive: true });
    window.addEventListener('keydown', yield_);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', yield_);
      window.removeEventListener('touchstart', yield_);
      window.removeEventListener('keydown', yield_);
    };
  }, [play]);

  // Scrolling to the end by hand earns the replay button too — it is the end of the film
  // either way.
  useEffect(() => {
    const onScroll = () => {
      const atEnd = window.scrollY >= scrollMax() - 2;
      setPlay((p) => (p === 'playing' ? p : atEnd ? 'ended' : 'idle'));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggle = useCallback(() => {
    setPlay((p) => {
      if (p === 'playing') return 'idle';
      if (p === 'ended') {
        if (lenis.current) lenis.current.scrollTo(0, { immediate: true });
        else window.scrollTo(0, 0);
      }
      return 'playing';
    });
  }, []);

  return (
    <>
      <div id="track" />
      <Canvas
        style={{ position: 'fixed', inset: 0 }}
        camera={{ fov: 42, near: 0.1, far: 600, position: [0, 2.2, 7] }}
      >
        <Film caps={caps} />
      </Canvas>
      {/* The film is entirely inside a canvas, so on its own it carries no text at
          all. This is the story for anyone who can't see it — screen reader, failed
          WebGL context, or a browser that never got there. */}
      <p className="sr-only">
        A short film, scrubbed by scrolling. Every campaign begins the same way: a party of
        adventurers is ambushed, and one goblin always gets away. That goblin is the narrator.
        Time freezes, and while the world holds still he walks back through it doing quiet
        work — lighting the campfire the party will find, opening the cave door, filling the
        chest, straightening the signpost. At the table, a player rolls a natural 1. In the
        frozen moment the goblin strolls in, looks at the die, looks at you, and nudges it.
        It lands on a natural 20. Time resumes and nobody notices. You're welcome.
      </p>

      <div id="overlay">
        <div id="blackout" />
        {CAPTIONS.map(({ id, text, onPaper, low, high }) => (
          <div
            key={id}
            id={id}
            className={`caption${onPaper ? ' on-paper' : ''}${low ? ' low' : ''}${high ? ' high' : ''}`}
            aria-hidden="true"
            ref={(el) => {
              if (el) caps[id] = el;
            }}
          >
            {text}
          </div>
        ))}

        {/* The endcard is lettered straight onto the board now — no card, no box, no
            drawn border. Each line of type carries its own paper knockout (a layered
            text-shadow halo, see .halo in styles.css) so the grid doesn't read through
            the letterforms, the same way the wordmark's stroke halo already knocks
            itself out where it crosses the goblin. It holds the one real destination on
            the overlay — so unlike the captions above it, it is not aria-hidden: the
            wordmark and copy are supplementary, but the Discord link is a genuine link
            and needs to reach assistive tech. */}
        <div
          id="endcard"
          ref={(el) => {
            if (el) caps.endcard = el;
          }}
        >
          <div
            id="endcard-wordmark"
            ref={(el) => {
              if (el) caps['endcard-wordmark'] = el;
            }}
          >
            <Wordmark />
          </div>

          <p
            id="endcard-tagline"
            className="halo"
            ref={(el) => {
              if (el) caps['endcard-tagline'] = el;
            }}
          >
            The Dungeon Master&rsquo;s backstage.
          </p>
          <p
            id="endcard-subline"
            className="halo"
            ref={(el) => {
              if (el) caps['endcard-subline'] = el;
            }}
          >
            Build the maps. Run the table. The goblin does the rest.
          </p>
          <a
            id="endcard-cta"
            href={DISCORD_URL}
            {...(CTA_IS_LIVE ? { target: '_blank', rel: 'noreferrer' } : {})}
            ref={(el) => {
              if (el) caps['endcard-cta'] = el;
            }}
          >
            <span
              className="cta-label"
              ref={(el) => {
                if (el) caps['endcard-cta-label'] = el;
              }}
            >
              Join the Discord
            </span>
          </a>
        </div>

        {/* Inks itself in as you scroll — the film's own progress, drawn rather than
            metered. Pure CSS scroll timeline; browsers without it simply don't get a rail. */}
        <svg id="rail" viewBox="0 0 4 200" preserveAspectRatio="none" aria-hidden="true">
          <path className="rail-track" d="M2 0 C3 40 1 78 2 118 C3 158 1 178 2 200" />
          <path className="rail-ink" pathLength="1" d="M2 0 C3 40 1 78 2 118 C3 158 1 178 2 200" />
        </svg>

        <div id="hint">
          <span>scroll</span>
          <svg viewBox="0 0 12 26" aria-hidden="true">
            <path d="M6 1 C7 8 5 14 6 21" />
            <path d="M2.5 17.5 L6 21.5 L9.5 17.5" />
          </svg>
        </div>
      </div>

      {/* Outside #overlay on purpose. The control blends with what is behind it, and
          #overlay is a stacking context with a transparent backdrop — inside it the
          blend had nothing to invert against and the button rendered white on paper.
          Out here its backdrop is the film itself, blackout included.

          Drawn, not an icon set: a UI glyph with even weights and true circles would be
          the one thing on screen that wasn't sketched. The ring is deliberately not
          quite closed and not quite round. */}
      <button
        id="play"
        type="button"
        onClick={toggle}
        aria-label={play === 'playing' ? 'Pause' : play === 'ended' ? 'Replay' : 'Play'}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path
            className="play-ring"
            d="M16 2.4 C24 2.2 29.8 8.4 29.6 16.2 C29.4 24 23.6 29.8 15.8 29.6 C8 29.4 2.3 23.4 2.4 15.6 C2.5 8.6 8.4 2.6 15.2 2.4"
          />
          {play === 'playing' ? (
            <>
              <path d="M13 10.5 C13.4 16 12.8 18 13 21.5" />
              <path d="M19 10.5 C18.6 16 19.2 18 19 21.5" />
            </>
          ) : play === 'ended' ? (
            <>
              <path d="M22.4 12.6 C20.6 9.2 16.4 8 13.2 9.9 C9.8 11.9 9 16.4 11 19.6 C13 22.9 17.4 23.8 20.6 21.7" />
              <path d="M17.6 12.9 L22.6 12.5 L21.9 7.6" />
            </>
          ) : (
            <path d="M12.6 9.8 L22.4 15.9 L12.5 22.1 C12.9 18 12.8 13.7 12.6 9.8" />
          )}
        </svg>
        <span>{play === 'playing' ? 'pause' : play === 'ended' ? 'replay' : 'play'}</span>
      </button>
    </>
  );
}
