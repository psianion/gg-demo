import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play } from '@phosphor-icons/react';
import Stage from './stage/Stage';
import { HERO_REST, compFor } from './hero/film/stages/hero';
import { frameHooks, nav, prm, sceneOut } from './stage/bus';
import { clock } from './stage/clock';
import { seg, smooth } from './stage/ease';
import { useWaitlist } from './site/Waitlist';
import { usePageMeta } from './site/meta';
import { BETA_STARTS } from './site/content/home';
import HomeSections from './site/HomeSections';
import { Arrow, scroller } from './site/ui';
import './home.css';

gsap.registerPlugin(ScrollTrigger);

// the story's machinery and its DOM load on the first "See for yourself", not with the homepage
const Story = lazy(() => import('./Story'));

// THE HOMEPAGE: the island hero across the first screen, then the site's sections below. The stage draws
// the island exactly as the film's first beat does; nothing here moves the clock, so it stays at the top of
// the film, on the hero.
//
// The hero sits on the page's 12-column container: the words in columns 1 to 5, the island on 6 to 12.
// The island is placed by HERO_REST alone (where it comes to rest, and at what size; hero.ts, Stage.tsx),
// fitted here to the columns the layout gives it. Its canvas starts under the header (home.css), so no
// cloud drifts behind the nav. On a phone the words come first and the island has a box of its own
// under them.
//
// "See for yourself" plays the story in place (Story.tsx): the words lift away, the nav goes up, and the
// island glides from its columns to the film's framing while its canvas grows to the whole window; then
// the story's track goes in above the sections. "Back to the page", at the very top, runs that in reverse.

// What the kit island takes up on the screen once settled, as shares of its rim solve width (compFor's
// frac x the canvas width x HERO_REST.size), measured off renders at 1440x900 and 1920x911: its body
// reaches 0.36 either side of its centre and the clouds that hang about it 0.5 (0.55 here, for their
// drift); the body stands 0.39 above the centre (the tree tops) and 0.31 below it (the keel), the high
// clouds 0.57 above it and the falling rubble 0.36 below it.
const ISLE = { body: 0.36, cloud: 0.55, up: 0.39, down: 0.31, sky: 0.57, rubble: 0.36 };
const WIDE = window.matchMedia('(min-width: 1024px)');
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The island on the screen, for the glide in and out of the story: its centre and its reach in window
// pixels, for a rest (HERO_REST's right, size and down) and a canvas of a size at a place. The lens zooms
// about the canvas's middle and the view offset slides it (Stage.tsx), so both ways are exact. Where the
// lens has the island before that is what the stage last saw (HERO_REST.seen) if it drew a canvas of this
// size, and otherwise the authored comp it is fitted to (compFor), which is close on a wide canvas but a
// few pixels out on a tall one.
type Spot = { x: number; y: number; r: number };
type Rest = { right: number; size: number; down: number };
type Box = { left: number; top: number; width: number; height: number };
const FILM: Rest = { right: 0, size: 1, down: 0 };
const lenses = new Map<string, { x: number; y: number; r: number }>(); // what it saw, by canvas size
function lensOf(W: number, H: number) {
  const s = HERO_REST.seen;
  const key = `${Math.round(W)}x${Math.round(H)}`;
  if (Math.abs(s.w - W) < 1 && Math.abs(s.h - H) < 1) lenses.set(key, { x: s.x, y: s.y, r: s.r });
  const seen = lenses.get(key);
  if (seen) return seen;
  const { frac, cx, cy } = compFor(W, H);
  return { x: (cx - 0.5) * 2, y: (0.5 - cy) * 2, r: (frac * W * 2) / H };
}
function spotOf(rest: Rest, b: Box): Spot {
  const { x, y, r } = lensOf(b.width, b.height);
  return {
    x: b.left + (b.width / 2) * (1 + x * rest.size) + rest.right * b.width,
    y: b.top + (b.height / 2) * (1 - y * rest.size) + rest.down * b.height,
    r: (r * b.height * rest.size) / 2,
  };
}
function restAt(s: Spot, b: Box): Rest {
  const { x, y, r } = lensOf(b.width, b.height);
  const size = (2 * s.r) / (r * b.height);
  return {
    size,
    right: (s.x - b.left - (b.width / 2) * (1 + x * size)) / b.width,
    down: (s.y - b.top - (b.height / 2) * (1 - y * size)) / b.height,
  };
}
const boxOf = (el: HTMLElement): Box => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

// wait for a condition, a frame at a time, but never longer than `ms`
const until = (ok: () => boolean, ms: number) =>
  new Promise<void>((done) => {
    const end = performance.now() + ms;
    const look = () => (ok() || performance.now() > end ? done() : requestAnimationFrame(look));
    look();
  });

// back to the top of the page first, if it has scrolled (both ways in and out start there). A wheel turned
// during the ease takes it over, so the top is made sure of at the end either way
const toTop = () =>
  new Promise<void>((done) => {
    const lenis = scroller.lenis;
    if (window.scrollY < 2 || !lenis) {
      window.scrollTo(0, 0);
      return done();
    }
    let over = false;
    const end = () => {
      if (over) return;
      over = true;
      clearTimeout(late);
      lenis.scrollTo(0, { immediate: true, force: true });
      done();
    };
    const late = setTimeout(end, 800);
    lenis.scrollTo(0, { duration: 0.5, force: true, onComplete: end });
  });

let leftStory = false; // the visitor left the homepage while the story was on

export default function Home() {
  const hero = useRef<HTMLElement>(null);
  const island = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const lift = useRef<HTMLDivElement>(null);
  const join = useWaitlist();
  usePageMeta();

  // the story: 'rest' is the ordinary page, 'moving' the way in or out, 'story' while it is mounted
  const phase = useRef<'rest' | 'moving' | 'story'>('rest');
  const [story, setStory] = useState(false);
  const place = useRef(() => {});
  const scrubs = useRef<gsap.core.Tween[]>([]);
  const ready = useRef(false); // the stage has said gg-ready (it is resident)
  const glideOff = useRef(() => {});

  // fit the island to its columns: as large as it can be with its clouds kept off the words and inside
  // the canvas, its body centred on the columns where that leaves room (on a wide window it may run a
  // gutter past the container on the right). Then the words are brought level with the island's body.
  // While the story has the island, the fitting waits for it to come back.
  useLayoutEffect(() => {
    place.current = () => {
      const box = island.current;
      const s = slot.current;
      const t = text.current;
      if (!box || !s || !t) return;
      const W = box.clientWidth;
      const H = box.clientHeight;
      if (!W || !H) return;
      const wide = WIDE.matches;
      const { frac, cx, cy } = compFor(W, H);
      let left: number;
      let right: number;
      if (wide) {
        const b = box.getBoundingClientRect();
        const r = s.getBoundingClientRect();
        left = r.left - b.left + 12; // a little air between the words and the nearest cloud
        right = r.right - b.left;
      } else {
        // the island's own box under the words, inside the page gutter (site.css --gutter)
        const g = clamp(0.04 * window.innerWidth, 16, 48);
        left = g;
        right = W - g;
      }
      const edge = wide ? W - 12 : right;
      const bleed = wide ? clamp(0.04 * window.innerWidth, 16, 48) : 0;
      // the lens zooms about the canvas's middle, then the view offset slides it (Stage.tsx); the island's
      // centre drops (cy - 0.5) x H x size below the middle as it grows
      const drop = ((cy - 0.5) * H) / (frac * W);
      const R = Math.min(
        (right + bleed - left) / (ISLE.cloud + ISLE.body),
        (edge - left) / (2 * ISLE.cloud),
        (H / 2 - 4) / (ISLE.sky - drop),
        (H / 2 - 12) / (ISLE.rubble + drop),
      );
      if (!(R > 0)) return;
      const x = clamp((left + right) / 2, left + ISLE.cloud * R, Math.min(right + bleed - ISLE.body * R, edge - ISLE.cloud * R));
      const size = R / (frac * W);
      const x0 = W / 2 + (cx * W - W / 2) * size;
      Object.assign(HERO_REST, { right: (x - x0) / W, size, down: 0 });
      if (wide) {
        const y = box.offsetTop + H / 2 + drop * R + ((ISLE.down - ISLE.up) / 2) * R;
        const header = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 72;
        const top = t.offsetTop;
        t.style.translate = `0 ${Math.max(y - (top + t.offsetHeight / 2), header + 16 - top)}px`;
      } else {
        t.style.translate = '';
      }
    };
    place.current();
    const ro = new ResizeObserver(() => phase.current === 'rest' && place.current());
    ro.observe(hero.current!);
    ro.observe(text.current!);
    return () => {
      ro.disconnect();
      Object.assign(HERO_REST, { right: 0, size: 1, down: 0, fit: null });
    };
  }, []);

  // the island scrolls away with the first screen; while it is out of view the stage stops drawing
  // (its own switch, nav.stageVisible), and starts again when it comes back. The story keeps that switch
  // itself while it is on
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => phase.current === 'rest' && (nav.stageVisible = e.isIntersecting));
    io.observe(hero.current!);
    return () => {
      io.disconnect();
      nav.stageVisible = true;
    };
  }, []);

  // the stage says once, when it is resident, that it is ready (Stage.tsx); the story's load gate only
  // holds the scroll if that has not happened yet
  useEffect(() => {
    const on = () => (ready.current = true);
    window.addEventListener('gg-ready', on);
    return () => window.removeEventListener('gg-ready', on);
  }, []);

  // while the hero's title is in view the header leaves the name to it (site.css, html.hero-title-in)
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('hero-title-in');
    const io = new IntersectionObserver(([e]) => root.classList.toggle('hero-title-in', e.isIntersecting), {
      rootMargin: '-84px 0px 0px 0px', // the nav's band (site.css --header-h)
    });
    io.observe(title.current!);
    return () => {
      io.disconnect();
      root.classList.remove('hero-title-in');
    };
  }, []);

  // the words come in as the paint finishes crossing, when the camera has nearly drawn back and the
  // island has settled to the right, so they never sit over the drawing; under reduced motion they
  // are simply there
  useEffect(() => {
    let last = -1;
    const hook = () => {
      const k = prm.reduced ? 1 : smooth(seg(sceneOut.painted, 0.8, 1));
      if (k === last || !text.current) return;
      last = k;
      text.current.style.opacity = String(k);
      text.current.style.transform = k < 1 ? `translateY(${(1 - k) * 14}px)` : '';
    };
    frameHooks.push(hook);
    return () => {
      frameHooks.splice(frameHooks.indexOf(hook), 1);
    };
  }, []);

  // the curtain: as the hero scrolls away the island draws back (smaller, drifting up, fading a little)
  // and the words lift and fade, scrubbed to the scroll. Only the DOM wrappers move, never the stage, and
  // the measuring above reads the untouched boxes around them. Wide windows only; off under reduced motion,
  // and switched off while the story has the scroll.
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const scrub = { trigger: hero.current, start: 'top top', scrub: 0.5 };
      scrubs.current = [
        gsap.to(curtain.current, { scale: 0.86, yPercent: -9, opacity: 0.55, ease: 'none', scrollTrigger: { ...scrub, end: 'bottom top' } }),
        gsap.to(lift.current, { y: -90, opacity: 0, ease: 'none', scrollTrigger: { ...scrub, end: '60% top' } }),
      ];
      return () => (scrubs.current = []);
    });
    return () => mm.revert();
  }, []);

  // leaving the homepage mid-way puts everything the way in and out set back; coming back to it after
  // leaving the story opens the ordinary page at the top, not at the story's scroll position (which is
  // what the router kept for it)
  useEffect(() => {
    if (leftStory) {
      leftStory = false;
      scroller.lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    }
    return () => {
      if (phase.current !== 'rest') leftStory = true;
      glideOff.current();
      gsap.killTweensOf([lift.current, curtain.current]);
      document.documentElement.classList.remove('story', 'story-pinned');
    };
  }, []);

  // the island glides from where it is now (`from`) to `to` over `seconds`, while its canvas changes size
  // under it: every frame the stage asks for the rest that puts it there in the canvas it is about to draw
  // (HERO_REST.fit), whatever size that canvas has reached. `flip` runs as the glide ends (the way out puts
  // the island's box back then); `done` once the canvas has been drawn at its box's size.
  const glide = (from: Spot, to: () => Spot, seconds: number, flip: () => void, done: () => void) => {
    const box = island.current!;
    const k = { e: 0 };
    let over = false;
    let late: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (over) return;
      over = true;
      clearTimeout(late);
      HERO_REST.fit = null;
      done();
    };
    // the glide itself starts once the canvas has its box's size: the stage's resize is a heavy frame, and
    // the island holds still through it rather than skip part of the way
    const tw = gsap.to(k, {
      e: 1,
      duration: seconds,
      ease: 'power2.inOut',
      paused: true,
      onComplete: () => {
        flip();
        late = setTimeout(finish, 1000); // the stage did not draw the kit island (it could not load)
      },
    });
    const go = setTimeout(() => tw.play(), 1000); // the same, if it never draws it
    HERO_REST.fit = (W, H) => {
      const b = box.getBoundingClientRect();
      const fits = Math.abs(W - b.width) < 1 && Math.abs(H - b.height) < 1;
      if (fits && tw.paused()) {
        clearTimeout(go);
        tw.play();
      }
      const a = to();
      const e = k.e;
      const s = { x: from.x + (a.x - from.x) * e, y: from.y + (a.y - from.y) * e, r: from.r * (a.r / from.r) ** e };
      Object.assign(HERO_REST, restAt(s, { left: b.left, top: b.top, width: W, height: H }));
      if (e >= 1 && fits) finish();
    };
    glideOff.current = () => {
      tw.kill();
      clearTimeout(go);
      clearTimeout(late);
      over = true;
    };
  };

  // "See for yourself": to the top if needed, then the island takes the whole window and the story mounts
  const start = async () => {
    if (phase.current !== 'rest') return;
    phase.current = 'moving';
    const root = document.documentElement;
    const h = hero.current!;
    const box = island.current!;
    await toTop();
    // the curtain's scrub catches up with the top, then lets go of the island and the words
    await until(() => scrubs.current.every((t) => t.progress() < 1e-3), 1500);
    scrubs.current.forEach((t) => t.scrollTrigger?.disable(false));
    text.current!.inert = true;
    root.classList.add('story', 'story-pinned');
    const mount = () => {
      Object.assign(HERO_REST, FILM);
      phase.current = 'story';
      setStory(true);
    };
    if (prm.reduced) {
      // reduced motion: the layouts swap under a short fade
      gsap.to([lift.current, curtain.current], { opacity: 0, duration: 0.25 });
      await new Promise((r) => setTimeout(r, 250));
      h.classList.add('story');
      const at = () => spotOf(FILM, boxOf(box));
      glide(at(), at, 0, () => {}, () => {
        mount();
        gsap.to(curtain.current, { opacity: 1, duration: 0.25, clearProps: 'opacity' });
      });
      return;
    }
    gsap.to(lift.current, { y: -90, opacity: 0, duration: 0.9, ease: 'power2.inOut' });
    const from = spotOf(HERO_REST, boxOf(box));
    h.classList.add('story');
    glide(from, () => spotOf(FILM, boxOf(box)), 0.9, () => {}, mount);
  };

  // "Back to the page", at the very top: the story goes (its track, its trigger, u back to 0), then the
  // way in runs in reverse
  const back = async () => {
    if (phase.current !== 'story') return;
    phase.current = 'moving';
    const root = document.documentElement;
    const h = hero.current!;
    const box = island.current!;
    await toTop();
    await until(() => clock.u === 0, 1000);
    setStory(false);
    root.classList.remove('story-pinned');
    // where the island rests in its columns: the layout is put back for a moment to measure it, and
    // nothing is drawn in between
    h.classList.remove('story');
    place.current();
    const rest = spotOf(HERO_REST, boxOf(box));
    h.classList.add('story');
    const from = spotOf(FILM, boxOf(box));
    Object.assign(HERO_REST, FILM);
    const end = () => {
      place.current();
      text.current!.inert = false;
      root.classList.remove('story');
      scrubs.current.forEach((t) => t.scrollTrigger?.enable());
      nav.stageVisible = true;
      phase.current = 'rest';
    };
    if (prm.reduced) {
      gsap.to(curtain.current, { opacity: 0, duration: 0.25 });
      await new Promise((r) => setTimeout(r, 250));
      h.classList.remove('story');
      glide(rest, () => rest, 0, () => {}, () => {
        end();
        gsap.to([lift.current, curtain.current], { opacity: 1, duration: 0.25, clearProps: 'opacity' });
      });
      return;
    }
    gsap.to(lift.current, { y: 0, opacity: 1, duration: 0.9, ease: 'power2.inOut', clearProps: 'transform,opacity' });
    glide(from, () => rest, 0.9, () => h.classList.remove('story'), end);
  };

  return (
    <>
      <section className="home" ref={hero} aria-labelledby="home-title">
        <div className="home-island" ref={island} aria-hidden="true">
          <div className="home-curtain" ref={curtain}>
            <Stage />
          </div>
          {/* the film's hero life (heroLife.ts) fades the page's grid ghost in on load and expects it
              to be there; this empty one stands in for it while the film's page furniture is off */}
          <div id="hero-gridghost" hidden />
        </div>
        <div className="wrap grid home-grid">
          <div className="home-text" ref={text}>
            <div className="home-lift" ref={lift}>
              <p className="home-beta">Closed beta, {BETA_STARTS}</p>
              <h1 id="home-title" ref={title}>
                Good Goblin
              </h1>
              <p className="home-copy">
                <span>A free, open-source virtual tabletop, built for D&amp;D and ready for any tabletop RPG.</span>{' '}
                <span>Dynamic lighting, live fog of war, multi-level maps and full control of your table.</span>{' '}
                <span>Hosted on your own machine. Players join in the browser, with nothing to install.</span>
              </p>
              <div className="home-actions">
                <button type="button" className="btn btn-lg" onClick={join}>
                  Get early access <Arrow />
                </button>
                <Link to="/docs" className="btn btn-lg quiet">
                  Read the guides <Arrow />
                </Link>
                <button type="button" className="btn btn-lg quiet" onClick={start}>
                  See for yourself <Arrow icon={<Play weight="regular" />} />
                </button>
              </div>
            </div>
          </div>
          <div className="home-slot" ref={slot} aria-hidden="true" />
        </div>
      </section>
      {story && (
        <Suspense fallback={null}>
          <Story home={hero} island={island} ready={ready.current} onBack={back} />
        </Suspense>
      )}
      <HomeSections />
    </>
  );
}
