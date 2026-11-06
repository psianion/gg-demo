import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Stage from './stage/Stage';
import HeroDom from './hero/HeroDom';
import Overlay from './ui/Overlay';
import After from './sections/After';
import Hud from './ui/Hud';
import { clock, HOLD_U, SHOW_HUD, snapClock, U_MAX } from './stage/clock';
import { frameHooks, nav } from './stage/bus';
import { clamp } from './stage/ease';

gsap.registerPlugin(ScrollTrigger);

// THE PAGE. One fixed stage over an 18-unit scroll track, then an ordinary page.
// Lenis (lerp 0.1) smooths the wheel; ONE ScrollTrigger (scrub: true, no extra
// smoothing) maps the pinned track to u; the stage's spring is the only other filter.
//
// The unpin is not a CSS sticky release (that is a velocity step from 0 to the scroll
// speed). At 18 the stage starts to travel with a quadratic ease-in whose slope
// reaches exactly 1 viewport per unit at 18.5, then rides the scroll — continuous in
// position AND velocity. The page below starts where the stage's bottom edge is.

const RAMP = 0.5; // units of ease-in before the stage rides the scroll
const AFTER_AT = U_MAX + RAMP + 1 - RAMP / 2; // where the page below begins, in viewports

/** how far the stage has travelled up, in viewports, for raw scroll position r (units) */
function stageLift(r: number): number {
  if (r <= U_MAX) return 0;
  if (r <= U_MAX + RAMP) return (r - U_MAX) ** 2 / (2 * RAMP);
  return RAMP / 2 + (r - U_MAX - RAMP);
}

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vh = () => window.innerHeight;
    const setVh = () => document.documentElement.style.setProperty('--vh', `${vh()}px`);
    setVh();
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // the one ScrollTrigger: a proxy tween, scrubbed 1:1
    const proxy = { u: 0 };
    const tween = gsap.to(proxy, {
      u: U_MAX,
      ease: 'none',
      scrollTrigger: {
        trigger: '#track',
        start: 'top top',
        end: () => `+=${U_MAX * vh()}`,
        scrub: true,
        invalidateOnRefresh: true,
      },
      onUpdate: () => (clock.target = proxy.u),
    });

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

    // programmatic moves: the waitlist chip, the card's buttons, the mini island
    nav.go = (y: number | string, opts?: { duration?: number }) => {
      nav.jumping = true;
      lenis.start();
      lenis.scrollTo(typeof y === 'number' ? y * vh() : y, {
        duration: opts?.duration ?? 2.2,
        easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
        onComplete: () => (nav.jumping = false),
      });
    };

    const onResize = () => {
      setVh();
      ScrollTrigger.refresh();
      onScroll();
    };
    window.addEventListener('resize', onResize);

    const hold = HOLD_U;
    if (hold !== null) {
      // dev: park the page at ?u= (one frame later, once the track has its height)
      requestAnimationFrame(() => {
        lenis.scrollTo(hold * vh(), { immediate: true, force: true });
        ScrollTrigger.update();
        snapClock(clamp(hold, 0, U_MAX));
        onScroll();
      });
    } else if (window.scrollY > 0) {
      snapClock(clamp(window.scrollY / vh(), 0, U_MAX));
    }
    onScroll();

    // stop drawing the canvas once the page has scrolled it away
    const hook = () => {
      document.body.classList.toggle('past-stage', !nav.stageVisible);
    };
    frameHooks.push(hook);

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.ticker.remove(raf);
      lenis.destroy();
      window.removeEventListener('gg-die', onDie);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);

  return (
    <>
      <div id="track" style={{ height: `calc(var(--vh, 100vh) * ${AFTER_AT})` }} aria-hidden="true" />
      <div id="stage" ref={stageRef}>
        <Stage />
        <HeroDom />
        <Overlay />
      </div>
      <After />
      {SHOW_HUD && <Hud />}
    </>
  );
}

