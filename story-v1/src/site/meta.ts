import { useEffect } from 'react';
import { useLocation } from 'react-router';

// Each route's title and description, and the reveal of its blocks as they come into view.

const SITE = 'Good Goblin';
const ORIGIN = 'https://goodgobl.in';
const DESCRIPTION =
  'A free, open-source virtual tabletop for D&D and any TTRPG. Dynamic lighting, live fog of war and multi-level maps, hosted on your own machine.';

export function usePageMeta(title?: string, description = DESCRIPTION) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE} | Free, open-source virtual tabletop for D&D`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    // each route names its own address; index.html carries none, so the raw and rendered pages never disagree
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = `${ORIGIN}${pathname}`;
  }, [title, description, pathname]);
}

// Blocks marked data-reveal rise in once, as they enter the window (site.css); the children of each come in a
// beat apart. Under reduced motion the CSS leaves them where they are, so nothing here needs to run.
export function useReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
}
