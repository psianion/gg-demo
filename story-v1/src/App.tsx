import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Stage from './stage/Stage';
import HeroDom from './hero/HeroDom';
import Overlay from './ui/Overlay';
import After from './sections/After';
import Hud from './ui/Hud';
import { clock, HOLD_U, SHOW_HUD, snapClock, sOf, S_MAX, uOf, U_MAX } from './stage/clock';
import { frameHooks, nav, story } from './stage/bus';
import { clamp } from './stage/ease';

gsap.registerPlugin(ScrollTrigger);

// THE PAGE. One fixed stage over the story's scroll track, then an ordinary page.
// Lenis (lerp 0.1) smooths the wheel; ONE ScrollTrigger (scrub: true, no extra
// smoothing) maps the pinned track to u; the stage's spring is the only other filter.
//
// The unpin is not a CSS sticky release (that is a velocity step from 0 to the scroll
// speed). At the end of the pin the stage starts to travel with a quadratic ease-in
// whose slope reaches exactly 1 viewport per unit half a unit later, then rides the
// scroll — continuous in position AND velocity. The page below starts where the
// stage's bottom edge is.
//
// A return visit (review 2) pins for 0 units: the same ramp starts at scroll 0, the
// hero rides off the top, and u stays 0 until "See for yourself" turns the story on.

const RAMP = 0.5; // units of ease-in before the stage rides the scroll
const afterAt = () => story.pinned() + RAMP + 1 - RAMP / 2; // where the page below begins, in viewports

/** how far the stage has travelled up, in viewports, for raw scroll position r (units) */
function stageLift(r: number): number {
  const P = story.pinned();
  if (r <= P) return 0;
  if (r <= P + RAMP) return (r - P) ** 2 / (2 * RAMP);
  return RAMP / 2 + (r - P - RAMP);
}

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [on, setOn] = useState(story.on);

  // ---- the page: Lenis, the unpin, programmatic moves, the load gate
  useEffect(() => {
    const vh = () => window.innerHeight;
    const setVh = () => document.documentElement.style.setProperty('--vh', `${vh()}px`);
    setVh();
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // raw scroll (units) drives the DOM unpin, so the stage and the page below can
    // never drift apart; the canvas runs on the damped u
    let raw = 0;
    const onScroll = () => {
      raw = window.scrollY / vh();
      const lift = stageLift(raw);
      if (stageRef.current) stageRef.current.style.transform = lift > 0 ? `translate3d(0, ${-lift * vh()}px, 0)` : '';
      nav.raw = raw;
      nav.stageVisible = lift < 1.02;
    };
    lenis.on('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    // the die roll holds the wheel for 1.2 s, once, in real time
    let holdT: ReturnType<typeof setTimeout> | undefined;
    const onDie = () => {
      if (nav.jumping) return;
      lenis.stop();
      clearTimeout(holdT);
      holdT = setTimeout(() => lenis.start(), 1200);
    };
    window.addEventListener('gg-die', onDie);

    // programmatic moves: the waitlist chip, the card's buttons, the mini island.
    // Numbers are u; they convert to the page's scroll position.
    nav.go = (y: number | string, opts?: { duration?: number }) => {
      nav.jumping = true;
      lenis.start();
      lenis.scrollTo(typeof y === 'number' ? sOf(y) * vh() : y, {
        duration: opts?.duration ?? 2.2,
        easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
        onComplete: () => (nav.jumping = false),
      });
    };

    // "See for yourself": back to the top if needed (both layouts agree there: lift 0,
    // u 0), then the story is switched on in place
    story.start = () => {
      if (story.on) return;
      const flip = () => {
        story.on = true;
        setOn(true);
      };
      if (window.scrollY < 2) flip();
      else lenis.scrollTo(0, { duration: 0.5, onComplete: flip });
    };

    const onResize = () => {
      setVh();
      ScrollTrigger.refresh();
      onScroll();
    };
    window.addEventListener('resize', onResize);
    onScroll();

    // the load gate: the story is not scrollable until the stage says it is resident
    let cap: ReturnType<typeof setTimeout> | undefined;
    const ready = () => {
      clearTimeout(cap);
      document.documentElement.classList.remove('gg-loading');
      lenis.start();
      ScrollTrigger.refresh();
      if (import.meta.env.DEV) console.info(`[gate] open at ${Math.round(performance.now())} ms`);
    };
    if (story.on && HOLD_U === null) {
      if (import.meta.env.DEV) console.info(`[gate] holding the scroll at ${Math.round(performance.now())} ms`);
      document.documentElement.classList.add('gg-loading');
      lenis.stop();
      window.addEventListener('gg-ready', ready, { once: true });
      cap = setTimeout(ready, 8000); // ponytail: a hard cap beats a page that never opens
    }

    // stop drawing the canvas once the page has scrolled it away
    const hook = () => {
      document.body.classList.toggle('past-stage', !nav.stageVisible);
    };
    frameHooks.push(hook);

    return () => {
      clearTimeout(cap);
      window.removeEventListener('gg-ready', ready);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
      window.removeEventListener('gg-die', onDie);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);

  // ---- the story: its track → u, only while the story is on
  useEffect(() => {
    if (!on) return;
    const lenis = lenisRef.current;
    const vh = () => window.innerHeight;
    const proxy = { s: 0 };
    const tween = gsap.to(proxy, {
      s: S_MAX,
      ease: 'none',
      scrollTrigger: {
        trigger: '#track',
        start: 'top top',
        end: () => `+=${S_MAX * vh()}`,
        scrub: true,
        invalidateOnRefresh: true,
      },
      onUpdate: () => (clock.target = uOf(proxy.s)),
    });
    ScrollTrigger.refresh();

    const hold = HOLD_U;
    if (hold !== null && lenis) {
      // dev: park the page at ?u= (one frame later, once the track has its height)
      requestAnimationFrame(() => {
        lenis.scrollTo(sOf(hold) * vh(), { immediate: true, force: true });
        ScrollTrigger.update();
        snapClock(clamp(hold, 0, U_MAX));
        window.dispatchEvent(new Event('scroll'));
      });
    } else if (window.scrollY > 0) {
      snapClock(clamp(uOf(window.scrollY / vh()), 0, U_MAX));
    }

    // the browser remembers the story once the waitlist card has settled on screen
    let marked = false;
    const hook = (u: number) => {
      if (marked || u < 17.5) return;
      marked = true;
      story.markSeen();
    };
    frameHooks.push(hook);

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, [on]);

  return (
    <>
      <div id="track" style={{ height: `calc(var(--vh, 100vh) * ${afterAt()})` }} aria-hidden="true" />
      <div id="stage" ref={stageRef}>
        <Stage />
        <HeroDom storyOn={on} />
        <Overlay />
      </div>
      <After storyOn={on} />
      {SHOW_HUD && <Hud />}
    </>
  );
}
