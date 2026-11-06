import { useEffect, useState, type ReactElement } from 'react';

// Hand-drawn UI glyphs. The artist's SVGs (public/art/ui/*.svg, currentColor strokes)
// are used as a CSS mask so they take the text colour, day or night; until a file
// exists, a quick inline sketch stands in.

const known = new Map<string, Promise<boolean>>();
function exists(url: string): Promise<boolean> {
  if (!known.has(url)) {
    known.set(
      url,
      new Promise((res) => {
        const i = new Image();
        i.onload = () => res(true);
        i.onerror = () => res(false);
        i.src = url;
      }),
    );
  }
  return known.get(url)!;
}

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const FALLBACK: Record<string, ReactElement> = {
  light: (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M9 4 h6 l1 3 h-8 z" />
      <path d="M8.5 7 C7 11 7 15 9 18 h6 c2 -3 2 -7 0.5 -11" />
      <path d="M12 11 c-1 1.5 -1 3 0 4 c1 -1 1 -2.5 0 -4" />
      <path d="M9 18 v2 h6 v-2" />
    </svg>
  ),
  'weather-clear': (
    <svg viewBox="0 0 24 24" {...P}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3 v2 M12 19 v2 M3 12 h2 M19 12 h2 M5.6 5.6 l1.4 1.4 M17 17 l1.4 1.4 M5.6 18.4 l1.4 -1.4 M17 7 l1.4 -1.4" />
    </svg>
  ),
  'weather-rain': (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M6 14 a4 4 0 0 1 1 -7.8 a5 5 0 0 1 9.6 1 a3.5 3.5 0 0 1 1 6.8 z" />
      <path d="M8 17 l-1 3 M12 17 l-1 3 M16 17 l-1 3" />
    </svg>
  ),
  'weather-snow': (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M6 13 a4 4 0 0 1 1 -7.8 a5 5 0 0 1 9.6 1 a3.5 3.5 0 0 1 1 6.8 z" />
      <path d="M8 17 l0.01 0 M12 19 l0.01 0 M16 17 l0.01 0 M10 21 l0.01 0 M14 21.5 l0.01 0" strokeWidth={2.4} />
    </svg>
  ),
  encounters: (
    <svg viewBox="0 0 24 24" {...P}>
      <path d="M6 20 h12 l-1 -3 h-10 z" />
      <path d="M8 17 c-1 -3 0 -6 4 -7 c4 1 5 4 4 7" />
      <circle cx="12" cy="6.5" r="2.8" />
      <path d="M10 6 l1 0.4 M14 6 l-1 0.4" />
    </svg>
  ),
  'mini-island': (
    <svg viewBox="0 0 48 48" {...P}>
      <path d="M6 22 C10 16 38 16 42 22 C40 27 30 29 24 29 C17 29 8 27 6 22 Z" />
      <path d="M10 25 C14 34 20 40 24 42 C28 40 34 34 38 25" />
      <path d="M30 20 L32 9 L35 20" />
      <path d="M17 20 v-6 M15 14 h5" />
      <path d="M22 41 l2 -8 l2 8" strokeWidth={1.2} />
    </svg>
  ),
  'goblin-peek': (
    <svg viewBox="0 0 160 70" {...P} strokeWidth={3}>
      <path d="M40 60 C34 40 10 26 2 22 C20 22 40 28 52 38" fill="var(--peek-skin, #84a058)" />
      <path d="M120 60 C126 40 150 26 158 22 C140 22 120 28 108 38" fill="var(--peek-skin, #84a058)" />
      <path d="M44 70 C44 42 60 30 80 30 C100 30 116 42 116 70" fill="var(--peek-skin, #84a058)" />
      <ellipse cx="66" cy="52" rx="9" ry="10" fill="#f2c35e" />
      <ellipse cx="94" cy="52" rx="9" ry="10" fill="#f2c35e" />
      <path d="M66 46 v12 M94 46 v12" strokeWidth={3.4} />
    </svg>
  ),
};

export function Glyph({ name }: { name: string }) {
  const url = `${import.meta.env.BASE_URL}art/ui/${name}.svg`;
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    exists(url).then((v) => live && setOk(v));
    return () => {
      live = false;
    };
  }, [url]);
  if (ok && name === 'goblin-peek') return <img className="glyph glyph-img" src={url} alt="" />;
  if (ok)
    return (
      <span
        className="glyph glyph-mask"
        style={{ WebkitMaskImage: `url(${url})`, maskImage: `url(${url})` }}
        aria-hidden="true"
      />
    );
  return <span className="glyph" aria-hidden="true">{FALLBACK[name] ?? null}</span>;
}
