// Tiny shared plumbing between the canvas loop and the DOM: per-frame hooks (the DOM
// overlay reads u here, so DOM and canvas can never disagree), fps counter, PRM flag.
import { S_MAX } from './clock';

export const frameHooks: ((u: number, dt: number) => void)[] = [];
export const stats = { frames: 0 };

const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prm = { reduced: mq.matches };
mq.addEventListener('change', () => (prm.reduced = mq.matches));

/** page navigation, shared by the stage and the DOM (App wires `go` to Lenis) */
export const nav = {
  raw: 0,
  stageVisible: true,
  jumping: false,
  go: (_y: number | string, _opts?: { duration?: number }) => {},
};

/** the director's view of the toggles, for the rail (set by the stage) */
export const live = {
  effective: null as null | ((u: number) => import('./state').Effective),
};
export const sceneOut = { night: 0, freeze: 0 };
/** the stage renders the after-page stills on request (data URLs) */
export const capture = { fn: null as null | (() => Promise<string[]>) };

// First visit tells the story; a browser that has reached the waitlist card gets the
// apps first, with a "See for yourself" button on the hero (review 2).
const SEEN_KEY = 'gg.story.seen';
const q = new URLSearchParams(window.location.search);
const forced = import.meta.env.DEV ? q.get('story') : null; // dev: ?story=1|0
let seen = false;
try {
  seen = !!localStorage.getItem(SEEN_KEY);
} catch { /* private mode */ }
export const story = {
  on: forced !== null ? forced === '1' : q.has('u') || !seen,
  /** viewports the stage is pinned for */
  pinned: () => (story.on ? S_MAX : 0),
  /** App wires this: turn a static page into the story, in place */
  start: () => {},
  markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch { /* private mode */ }
  },
};
