import { useLayoutEffect, type ReactNode, type RefObject } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import Lenis from 'lenis';

// The site's small shared parts: the arrow in its own circle that trails a pill button, the mounted
// frame every picture and panel sits in, the page's smooth scroll and the sliding marker that the nav,
// the roadmap tabs and the docs sidebar use to show where you are.

/** the trailing arrow of a pill button, in its own circle (site.css .btn-ic) */
export function Arrow({ icon }: { icon?: ReactNode }) {
  return <span className="btn-ic" aria-hidden="true">{icon ?? <ArrowUpRight weight="regular" />}</span>;
}

/** a mounted frame: an outer tray holding an inner core, like a print on its mat (site.css .mount) */
export function Mount({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mount ${className}`}>
      <div className="mount-core">{children}</div>
    </div>
  );
}

/** the page's smooth scroll; null under reduced motion (Site.tsx makes it) */
export const scroller: { lenis: Lenis | null } = { lenis: null };

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Keeps a marker on the current item of a list: writes --mx, --my, --mw and --mh (the item's box,
 * relative to the box) on `box`, and `data-marked` while there is an item to mark. The marker itself is
 * CSS: it moves by transform only, and only once it has been placed the first time (`data-ready`).
 */
export function useMarker(box: RefObject<HTMLElement | null>, selector: string, key: unknown) {
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const place = () => {
      const on = el.querySelector<HTMLElement>(selector);
      el.toggleAttribute('data-marked', !!on);
      if (!on) return;
      const b = el.getBoundingClientRect();
      const r = on.getBoundingClientRect();
      el.style.setProperty('--mx', `${r.left - b.left}px`);
      el.style.setProperty('--my', `${r.top - b.top}px`);
      el.style.setProperty('--mw', `${r.width}px`);
      el.style.setProperty('--mh', `${r.height}px`);
    };
    place();
    // the first placement lands without sliding; after that it slides
    const raf = requestAnimationFrame(() => el.setAttribute('data-ready', ''));
    const ro = new ResizeObserver(place);
    ro.observe(el);
    let live = true;
    document.fonts?.ready.then(() => live && place());
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [box, selector, key]);
}
