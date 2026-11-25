import { Suspense, useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import {
  createBrowserRouter,
  Link,
  NavLink,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from 'react-router';
import { IconContext } from '@phosphor-icons/react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WaitlistProvider, useWaitlist } from './Waitlist';
import Sample from './Sample';
import { Arrow, reducedMotion, scroller, useMarker } from './ui';
import { licence, links } from './content/links';
import { BETA_STARTS } from './content/home';
import './site.css';

gsap.registerPlugin(ScrollTrigger);

// The site: one layout (the floating nav, the page, the footer) around every route. Each page loads on
// its own, before the route changes to it, so three.js and the kit only load on the homepage and a
// crossfade never fades to an empty page.

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });
const Docs = page(() => import('./pages/Docs'));
const Changelog = page(() => import('./pages/Changelog'));

const NAV = [
  { to: '/docs', label: 'Guides' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/changelog', label: 'Changelog' },
  { to: '/about', label: 'About' },
];

// every icon on the site is drawn in the one weight
const ICONS = { weight: 'light' as const, size: 20 };

// The nav is a pill floating over the page. On the homepage it leaves the name to the hero's own title
// while that title is in view (Home.tsx sets html.hero-title-in); everywhere else the name is there. A
// small pine bar slides under the current page. On a phone the pill holds the name and the menu button,
// whose two lines turn into an X; the menu opens over the whole screen.
function Header({ menu, setMenu }: { menu: boolean; setMenu: (m: boolean) => void }) {
  const join = useWaitlist();
  const { pathname } = useLocation();
  const list = useRef<HTMLElement>(null);
  useMarker(list, 'a[aria-current="page"]', pathname);

  return (
    <header className="site-header">
      <div className="wrap site-header-in">
        <div className="pill-nav">
          <div className="mark-slot">
            <div>
              <Link to="/" className="site-mark">
                Good Goblin
              </Link>
            </div>
          </div>
          <nav className="nav-links" aria-label="Main" ref={list}>
            <ul>
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to}>{n.label}</NavLink>
                </li>
              ))}
            </ul>
            <span className="nav-bar" aria-hidden="true" />
          </nav>
          <button type="button" className="btn btn-sm nav-join" onClick={join}>
            Get early access <Arrow />
          </button>
          <button
            type="button"
            className={`menu-btn${menu ? ' open' : ''}`}
            aria-expanded={menu}
            aria-controls="menu"
            aria-label={menu ? 'Close the menu' : 'Open the menu'}
            onClick={() => setMenu(!menu)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

// the phone menu: paper glass over the whole screen, the links rising in one after another
function Menu({ open, close }: { open: boolean; close: () => void }) {
  const join = useWaitlist();
  const first = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!open) return;
    first.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, close]);
  return (
    <div id="menu" className={`menu${open ? ' open' : ''}`} inert={!open}>
      <nav aria-label="Menu">
        <ul>
          {[{ to: '/', label: 'Home' }, ...NAV].map((n, i) => (
            <li key={n.to} style={{ '--i': i } as CSSProperties}>
              <NavLink to={n.to} end ref={i === 0 ? first : undefined}>
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="menu-foot" style={{ '--i': NAV.length + 1 } as CSSProperties}>
        <button
          type="button"
          className="btn btn-lg"
          onClick={() => {
            close();
            join();
          }}
        >
          Get early access <Arrow />
        </button>
        <p>Closed beta starts {BETA_STARTS}</p>
      </div>
    </div>
  );
}

function Footer() {
  const join = useWaitlist();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <p>A free, open-source virtual tabletop for D&amp;D and any tabletop RPG.</p>
            <button type="button" className="btn quiet" onClick={join}>
              Get early access <Arrow />
            </button>
          </div>
          <nav className="foot-nav" aria-label="Footer">
            <div>
              <p className="foot-h">Product</p>
              <ul>
                {NAV.slice(0, 3).map((n) => (
                  <li key={n.to}>
                    <Link to={n.to} className="ul">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="foot-h">Project</p>
              <ul>
                <li>
                  <Link to="/about" className="ul">
                    About
                  </Link>
                </li>
                {[links.github, links.discord].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="ul">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <Sample on={links.github.sample || links.discord.sample} />
            </div>
          </nav>
        </div>
        <p className="foot-licence">
          {licence.text} <Sample on={licence.sample} />
        </p>
        <div className="foot-mark" aria-hidden="true">
          <span>Good Goblin</span>
        </div>
      </div>
    </footer>
  );
}

// where an element sits in the page by layout alone, so a block still rising in (the reveal's offset)
// is not aimed short; less its scroll margin, the nav's band
function layoutTop(el: HTMLElement) {
  let y = 0;
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
  return y - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
}

// a link to /page#id scrolls to it once the page has loaded and drawn it
function useHashScroll() {
  const { hash, key } = useLocation();
  useEffect(() => {
    if (!hash) return;
    let tries = 0;
    let raf = 0;
    const find = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!el) {
        if (tries++ < 120) raf = requestAnimationFrame(find);
        return;
      }
      const y = layoutTop(el);
      if (scroller.lenis) scroller.lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    };
    find();
    return () => cancelAnimationFrame(raf);
  }, [hash, key]);
}

// Lenis eases the wheel and drives ScrollTrigger; under reduced motion the page scrolls natively
function useSmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    scroller.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      scroller.lenis = null;
    };
  }, []);
}

// Route changes crossfade where the browser has view transitions: a click on a link to another page
// goes through the router with its view transition on (and back and forward replay it). Elsewhere, and
// under reduced motion, the router's own links swap the page as before.
function useCrossfade() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!('startViewTransition' in document) || reducedMotion()) return;
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      navigate(url.pathname + url.search + url.hash, { viewTransition: true });
    };
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [navigate]);
}

function Layout() {
  const { pathname, key } = useLocation();
  const home = pathname === '/';
  const [menu, setMenu] = useState(false);
  useHashScroll();
  useSmoothScroll();
  useCrossfade();

  // the menu closes on every route change; while it is open the page under it holds still
  useEffect(() => setMenu(false), [key]);
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', menu);
    if (menu) scroller.lenis?.stop();
    else scroller.lenis?.start();
  }, [menu]);

  return (
    <IconContext.Provider value={ICONS}>
      <WaitlistProvider>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Header menu={menu} setMenu={setMenu} />
        <Menu open={menu} close={() => setMenu(false)} />
        <main id="main" tabIndex={-1} className={home ? 'home-main' : 'page'} inert={menu}>
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
        <div inert={menu}>
          <Footer />
        </div>
        <ScrollRestoration />
      </WaitlistProvider>
    </IconContext.Provider>
  );
}

const Empty = () => null;

export default function Site({ Home }: { Home: ComponentType }) {
  const [router] = useState(() =>
    createBrowserRouter([
      {
        element: <Layout />,
        HydrateFallback: Empty,
        children: [
          { path: '/', element: <Home /> },
          { path: '/docs', lazy: Docs },
          { path: '/docs/:slug', lazy: Docs },
          { path: '/changelog', lazy: Changelog },
          { path: '/changelog/:version', lazy: Changelog },
          { path: '/roadmap', lazy: page(() => import('./pages/Roadmap')) },
          { path: '/about', lazy: page(() => import('./pages/About')) },
          { path: '*', lazy: page(() => import('./pages/NotFound')) },
        ],
      },
    ]),
  );
  return <RouterProvider router={router} />;
}
