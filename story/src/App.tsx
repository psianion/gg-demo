import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Film from './film/Film';

gsap.registerPlugin(ScrollTrigger);

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

export default function App() {
  const caps = useRef<Record<string, HTMLElement>>({}).current;

  useEffect(() => {
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
      <div id="overlay">
        <div id="blackout" />
        {CAPTIONS.map(({ id, text, onPaper }) => (
          <div
            key={id}
            id={id}
            className={`caption${onPaper ? ' on-paper' : ''}`}
            ref={(el) => {
              if (el) caps[id] = el;
            }}
          >
            {text}
          </div>
        ))}
        <div id="hint">scroll ↓</div>
      </div>
    </>
  );
}
