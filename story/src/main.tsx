// FIRST import: wraps matchMedia before any module samples it (DEV-only, see file)
import './prmForce';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Hero from './Hero';
import IslandSandbox from './IslandSandbox';
import GobStudy from './GobStudy';
import MockSheet from './MockSheet';
// self-hosted: no CDN request, no render-blocking third-party origin
// Metamorphous ships weight 400 only — no italic face exists, so every caption and
// control now runs upright.
import '@fontsource/metamorphous/400.css';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
// The Quiet Serif (direction §4 voice 3): Vollkorn carries the endcard subline, the
// skip note, and anything longer than a sentence — warm, bookish, with a TRUE italic.
// Loaded now so stage migrations can adopt it via --font-quiet (styles.css); surfaces
// switch over as they are rebuilt.
import '@fontsource/vollkorn/400.css';
import '@fontsource/vollkorn/400-italic.css';
import './styles.css';

// Dev-only stage sandbox (?sandbox=island). Same DCE pattern as App's HUD gate: the
// import.meta.env.DEV term constant-folds to false in production, the ternary becomes
// unreachable, and IslandSandbox tree-shakes out of the build entirely.
const SANDBOX =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('sandbox') === 'island';

// DECISION (P5): the DEFAULT route now boots into the hero — App mounts the cover
// over the film and the gearing map's t<0 Cover stage hands off at 3.5% scroll.
// ?hero=1 is KEPT as a dev jump: the hero standalone (entrance + idle life, no film,
// no scroll), for judging the cover in isolation and for the poster bake
// (window.__bakePoster, DEV builds). Still not dev-gated — the standalone frame must
// be judgeable under a production build too, exactly as P4 argued.
const HERO = new URLSearchParams(window.location.search).get('hero') === '1';

// Dev-only goblin study route (?gobstudy=A|B|C|OLD) — same DCE gate as the sandbox.
const STUDY =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('gobstudy');

// Dev-only surface-class mockup route (?mock=<class>|sheet) — same DCE gate again.
const MOCK = import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {MOCK ? (
      <MockSheet />
    ) : STUDY ? (
      <GobStudy />
    ) : SANDBOX ? (
      <IslandSandbox />
    ) : HERO ? (
      <Hero />
    ) : (
      <App />
    )}
  </StrictMode>,
);
