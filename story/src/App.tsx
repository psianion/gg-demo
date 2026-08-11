import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Film from './film/Film';

gsap.registerPlugin(ScrollTrigger);

// mobile browser chrome collapsing on scroll changes viewport height mid-scrub;
// without this the film jumps to a different beat as the address bar hides
ScrollTrigger.config({ ignoreMobileResize: true });

// captions: id -> (text, italic, white-on-blackout vs dark-on-paper)
const CAPTIONS: { id: string; text: string; onPaper?: boolean }[] = [
  { id: 'open1', text: 'Every campaign begins the same way…' },
  { id: 'open2', text: '…and one goblin always gets away.', onPaper: true },
  { id: 'me1', text: 'That was me.', onPaper: true },
  { id: 'me2', text: 'You thought I ran away.', onPaper: true },
  { id: 'me3', text: 'I did.', onPaper: true },
  { id: 'me4', text: 'Straight to work.', onPaper: true },
  { id: 'nat1', text: 'Natural 1.', onPaper: true },
  { id: 'nat20', text: 'Natural 20.', onPaper: true },
  { id: 'welcome', text: "You're welcome.", onPaper: true },
  { id: 'endcard', text: 'GOOD GOBLIN', onPaper: true },
];

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const caps = useRef<Record<string, HTMLElement>>({}).current;

  useEffect(() => {
    // Smoothing is the one piece of motion the visitor didn't ask for — the film
    // itself is scrubbed by their own scroll, so it still plays under reduced motion,
    // just without the glide.
    if (prefersReducedMotion()) return;

    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
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
        {CAPTIONS.map(({ id, text, onPaper }) => (
          <div
            key={id}
            id={id}
            className={`caption${onPaper ? ' on-paper' : ''}`}
            aria-hidden="true"
            ref={(el) => {
              if (el) caps[id] = el;
            }}
          >
            {text}
          </div>
        ))}

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
    </>
  );
}
