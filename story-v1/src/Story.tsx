import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroDom from './hero/HeroDom';
import Overlay from './ui/Overlay';
import Hud from './ui/Hud';
import { clock, SHOW_HUD, snapClock, sOf, S_MAX, uOf } from './stage/clock';
import { frameHooks, nav } from './stage/bus';
import { seg, smooth } from './stage/ease';
import { scroller } from './site/ui';

gsap.registerPlugin(ScrollTrigger);

// THE STORY ON THE HOMEPAGE: the film's machinery from App.tsx, mounted by Home once "See for yourself" has
// carried the island to the film's framing, and gone again with "Back to the page" or a route change.
//
// A track below the hero makes the scroll for it: the hero and the track together run S_MAX viewports of
// pinned story, the unpin ramp, then the homepage's sections. ONE ScrollTrigger maps that scroll to u, on
// the site's own Lenis (or the native scroll under reduced motion); the stage's spring is the only other
// filter. The unpin is App's: at the end of the pin the island and the story's DOM start to travel with a
// quadratic ease-in whose slope reaches 1 viewport per unit half a unit later, then ride the scroll, so
// position and speed stay continuous, and the sections begin where the stage's bottom edge is.

const RAMP = 0.5; // units of ease-in before the stage rides the scroll
const AFTER = S_MAX + RAMP / 2 + 1; // where the sections begin, in viewports

/** how far the stage has travelled up, in viewports, for raw scroll position r (units) */
function stageLift(r: number): number {
  if (r <= S_MAX) return 0;
  if (r <= S_MAX + RAMP) return (r - S_MAX) ** 2 / (2 * RAMP);
  return RAMP / 2 + (r - S_MAX - RAMP);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export default function Story({
  home,
  island,
  ready,
  onBack,
}: {
  /** the hero section, the first stretch of the story's scroll */
  home: RefObject<HTMLElement | null>;
  /** the island's box, carried off by the unpin with the story's DOM */
  island: RefObject<HTMLElement | null>;
  /** the stage has already said it is resident (gg-ready), so the scroll need not wait for it */
  ready: boolean;
  onBack: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const skip = useRef(() => {});

  useEffect(() => {
    const root = document.documentElement;
    const lenis = scroller.lenis;
    const hero = home.current!;
    const box = island.current!;
    const dom = layer.current!;
    const vh = () => window.innerHeight;

    // the track makes up the rest of the story's length after the hero
    const size = () => {
      root.style.setProperty('--vh', `${vh()}px`);
      track.current!.style.height = `${Math.max(0, AFTER * vh() - hero.offsetHeight)}px`;
    };
    size();

    // raw scroll (units) drives the unpin, so the stage and the sections can never drift apart; the canvas
    // runs on the damped u. The nav is away while the stage is pinned and comes back as it leaves
    const onScroll = () => {
      const raw = window.scrollY / vh();
      const lift = stageLift(raw);
      const t = lift > 0 ? `translate3d(0, ${-lift * vh()}px, 0)` : '';
      box.style.transform = t;
      dom.style.transform = t;
      nav.raw = raw;
      nav.stageVisible = lift < 1.02;
      root.classList.toggle('story-pinned', lift <= 0);
    };
    const offLenis = lenis?.on('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    // the die roll holds the wheel for 1.2 s, once, in real time
    let holdT: ReturnType<typeof setTimeout> | undefined;
    const onDie = () => {
      if (nav.jumping || !lenis) return;
      lenis.stop();
      clearTimeout(holdT);
      holdT = setTimeout(() => lenis.start(), 1200);
    };
    window.addEventListener('gg-die', onDie);

    // programmatic moves: the waitlist chip and Skip to the site. Numbers given to nav.go are u
    const glide = (y: number | string, duration: number) => {
      nav.jumping = true;
      if (lenis) {
        lenis.start();
        lenis.scrollTo(y, { duration, easing: easeInOut, force: true, onComplete: () => (nav.jumping = false) });
        return;
      }
      const el = typeof y === 'string' ? document.querySelector<HTMLElement>(y) : null;
      window.scrollTo(0, el ? el.getBoundingClientRect().top + window.scrollY : Number(y));
      nav.jumping = false;
    };
    nav.go = (y, opts) => glide(typeof y === 'number' ? sOf(y) * vh() : y, opts?.duration ?? 2.2);
    skip.current = () => glide(AFTER * vh(), 1.5);

    // the story's track to u
    const proxy = { s: 0 };
    const tween = gsap.to(proxy, {
      s: S_MAX,
      ease: 'none',
      scrollTrigger: { start: 0, end: () => S_MAX * vh(), scrub: true, invalidateOnRefresh: true },
      onUpdate: () => (clock.target = uOf(proxy.s)),
    });
    lenis?.resize();
    ScrollTrigger.refresh();
    onScroll();

    const onResize = () => {
      size();
      ScrollTrigger.refresh();
      onScroll();
    };
    window.addEventListener('resize', onResize);

    // the load gate: if the stage is not resident yet, the story is not scrollable until it says so
    let cap: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      clearTimeout(cap);
      root.classList.remove('gg-loading');
      lenis?.start();
      ScrollTrigger.refresh();
    };
    if (!ready) {
      root.classList.add('gg-loading');
      lenis?.stop();
      window.addEventListener('gg-ready', open, { once: true });
      cap = setTimeout(open, 8000); // a hard cap beats a page that never opens
    }

    // the hero's entrance has played already on the homepage, so the hint it would have drawn on is shown
    // here; the way back and the way past sit either side of it, and leave with it as the story starts
    const hint = dom.querySelector<HTMLElement>('#hero-hint');
    if (hint) hint.style.opacity = '1';
    let last = -1;
    const hook = (u: number) => {
      const o = 1 - smooth(seg(u, 0.02, 0.3));
      if (o === last || !top.current) return;
      last = o;
      top.current.style.opacity = String(o);
      top.current.style.visibility = o > 0.001 ? 'visible' : 'hidden';
    };
    frameHooks.push(hook);

    // a reload mid-story opens the ordinary homepage at the top: the router keeps the scroll position on
    // pagehide, so the page is put back at the top first (a capturing listener on window runs before it)
    const leave = () => window.scrollTo(0, 0);
    window.addEventListener('pagehide', leave, { capture: true });

    return () => {
      clearTimeout(cap);
      clearTimeout(holdT);
      window.removeEventListener('gg-ready', open);
      window.removeEventListener('gg-die', onDie);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pagehide', leave, { capture: true });
      offLenis?.();
      tween.scrollTrigger?.kill();
      tween.kill();
      frameHooks.splice(frameHooks.indexOf(hook), 1);
      nav.go = () => {};
      nav.jumping = false;
      nav.raw = 0;
      nav.stageVisible = true;
      snapClock(0);
      box.style.transform = '';
      root.classList.remove('gg-loading', 'story-pinned');
      root.style.removeProperty('--vh');
      // the light chip writes the site's colours on the root (Overlay); they go with the story
      for (const p of ['--paper', '--line', '--quiet']) root.style.removeProperty(p);
      root.classList.remove('night');
      lenis?.start();
      lenis?.resize();
      ScrollTrigger.refresh();
    };
  }, [home, island, ready]);

  return (
    <>
      <div className="story-track" ref={track} aria-hidden="true" />
      <div className="story-stage" ref={layer}>
        <HeroDom storyOn />
        <Overlay />
        <div className="story-top" ref={top}>
          <button type="button" className="btn btn-sm quiet" onClick={onBack}>
            Back to the page
          </button>
          <button type="button" className="btn btn-sm quiet" onClick={() => skip.current()}>
            Skip to the site
          </button>
        </div>
      </div>
      {SHOW_HUD && <Hud />}
    </>
  );
}
