// DEV-only QA: force prefers-reduced-motion from the console, LIVE — Chrome's
// DevTools emulation is not scriptable from the outside, and motion §14 requires the
// preference honoured without a reload, so the flip itself needs a handle:
//
//   __prmForce(true)   // every '(prefers-reduced-motion: reduce)' query matches
//   __prmForce(false)  // back to the real OS preference
//
// Imported FIRST in main.tsx so the wrapped matchMedia is in place before any module
// samples it (rigs.ts binds its live listener at import time). The whole body is
// DEV-gated: in production the condition constant-folds to false and the module
// tree-shakes to nothing — matchMedia ships untouched.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const native = window.matchMedia.bind(window);
  // the force persists per-tab (sessionStorage): a COLD-load PRM walk needs the
  // preference in place before any module samples it, and a post-reload __prmForce
  // call always loses that race — set it, reload, and the force is already on
  let forced = false;
  try {
    forced = sessionStorage.getItem('gg.prmforce') === '1';
  } catch {
    /* storage unavailable — live flips still work */
  }
  const listeners = new Set<() => void>();
  (window as unknown as { __prmForce?: (v: boolean) => void }).__prmForce = (v: boolean) => {
    forced = v;
    try {
      sessionStorage.setItem('gg.prmforce', v ? '1' : '0');
    } catch {
      /* fine */
    }
    for (const l of listeners) l();
  };
  window.matchMedia = ((query: string) => {
    const mql = native(query);
    if (!query.includes('prefers-reduced-motion')) return mql;
    return {
      media: mql.media,
      get matches() {
        return forced || mql.matches;
      },
      onchange: null,
      addEventListener: (_type: string, fn: () => void) => {
        listeners.add(fn);
        mql.addEventListener('change', fn);
      },
      removeEventListener: (_type: string, fn: () => void) => {
        listeners.delete(fn);
        mql.removeEventListener('change', fn);
      },
      addListener: (fn: () => void) => listeners.add(fn),
      removeListener: (fn: () => void) => listeners.delete(fn),
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

export {};
