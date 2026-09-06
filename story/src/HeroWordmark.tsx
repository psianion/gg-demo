import { wordmarkPip } from './film/palette';

const PIP = `#${wordmarkPip.toString(16).padStart(6, '0')}`;

/**
 * The hero wordmark (hero doc §6, ASSETS wordmark row): the drawn GOOD / GOBL·IN
 * lockup with the goblin's ears over the sign and the d20 interpunct — now carrying
 * its pip in brand green (palette.wordmarkPip: marketing-only, the one place that
 * hue exists). Letterforms are the committed carved-caps identity from the v1
 * lockup (docs/logo direction) — same paths, hero-owned ids so both routes can exist.
 *
 * The word carries a paper stroke halo (paint-order) so it knocks itself out where it
 * crosses the goblin — and, on short viewports, where it might cross the island.
 */
export default function HeroWordmark() {
  return (
    <svg
      viewBox="-24 -112 800 490"
      fill="var(--line)"
      role="img"
      aria-label="Good Goblin — goodgobl.in"
    >
      <defs>
        {/* the film's graphite hand: a pencil never lands the same curve twice */}
        <filter id="hw-carve" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="4" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <path
          id="hw-O"
          fillRule="evenodd"
          d="M52 0 C81 0 104 33.6 104 75 C104 116.4 81 150 52 150 C23 150 0 116.4 0 75 C0 33.6 23 0 52 0 Z
             M52 18 C38 18 26 43 26 75 C26 107 38 132 52 132 C66 132 78 107 78 75 C78 43 66 18 52 18 Z"
        />
        <path
          id="hw-D"
          fillRule="evenodd"
          d="M0 0 L50 0 C78 0 100 33 100 75 C100 117 78 150 50 150 L0 150 Z
             M26 18 L50 18 C64 18 74 43 74 75 C74 107 64 132 50 132 L26 132 Z"
        />
        <path
          id="hw-B"
          fillRule="evenodd"
          d="M0 0 L48 0 C70 0 84 15 84 36 C84 52 76 64 64 69 C80 74 92 88 92 106 C92 131 76 150 48 150 L0 150 Z
             M26 18 L46 18 C55 18 60 26 60 37 C60 49 55 57 46 57 L26 57 Z
             M26 80 L48 80 C59 80 66 91 66 105 C66 121 59 132 48 132 L26 132 Z"
        />
        <path id="hw-L" d="M0 0 L26 0 L26 124 L84 124 L84 150 L0 150 Z" />
        <path id="hw-I" d="M0 0 L26 0 L26 150 L0 150 Z" />
        <path id="hw-N" d="M0 0 L30 0 L74 88 L74 0 L100 0 L100 150 L70 150 L26 62 L26 150 L0 150 Z" />
        <g id="hw-G">
          <path d="M94.6 32 A52 75 0 1 0 94.6 118 L73.3 107.7 A26 57 0 1 1 73.3 42.3 Z" />
          <path d="M56 72 L104 72 L104 120 L82 120 L82 94 L56 94 Z" />
        </g>

        <g id="hw-die" fillRule="evenodd">
          <path
            d="M50 2 L92 26 L92 74 L50 98 L8 74 L8 26 Z
               M50 24 L73 37 L73 63 L50 76 L27 63 L27 37 Z"
          />
          <path d="M50 30 L70 66 L30 66 Z M50 45 L57 59 L43 59 Z" />
        </g>

        {/* ears and eyes over the sign — level eyes read startled; these read sly */}
        <g id="hw-gob">
          <path d="M112 -92 C148 -80 182 -58 204 -34 C199 -15 181 -8 167 -16 C145 -34 126 -60 112 -92 Z" />
          <path d="M336 -92 C300 -80 266 -58 244 -34 C249 -15 267 -8 281 -16 C303 -34 322 -60 336 -92 Z" />
          <path d="M162 20 C156 -34 186 -70 224 -70 C262 -70 292 -34 286 20 Z" />
          <path
            d="M182 -30 C194 -42 214 -38 218 -27 C221 -18 206 -12 194 -16 C185 -20 180 -25 182 -30 Z"
            fill="var(--paper)"
          />
          <path
            d="M266 -30 C254 -42 234 -38 230 -27 C227 -18 242 -12 254 -16 C263 -20 268 -25 266 -30 Z"
            fill="var(--paper)"
          />
          <circle cx="204" cy="-25" r="6" fill="var(--line)" />
          <circle cx="244" cy="-25" r="6" fill="var(--line)" />
        </g>

        <g id="hw-word">
          <g transform="translate(122 0)">
            <use href="#hw-G" />
            <use href="#hw-O" x="120" />
            <use href="#hw-O" x="240" />
            <use href="#hw-D" x="360" />
          </g>
          <g transform="translate(0 192)">
            <use href="#hw-G" />
            <use href="#hw-O" x="120" />
            <use href="#hw-B" x="240" />
            <use href="#hw-L" x="348" />
            <g transform="translate(439 42) scale(1.10)">
              <use href="#hw-die" />
            </g>
            <use href="#hw-I" x="562" />
            <use href="#hw-N" x="604" />
          </g>
        </g>
      </defs>

      <g filter="url(#hw-carve)">
        <g transform="translate(128 0)">
          <use href="#hw-gob" />
        </g>
        <g stroke="var(--paper)" strokeWidth="13" paintOrder="stroke">
          <use href="#hw-word" />
        </g>
        {/* the d20's pip, lit brand green (hero §6; palette.wordmarkPip — the one
            marketing-only hue, nowhere else on the page or in the world). Drawn on
            top of the halo pass so the word's paper stroke can't punch a ring around
            it; the transform composes the die's place in the second line. */}
        <path d="M50 45 L57 59 L43 59 Z" fill={PIP} transform="translate(439 234) scale(1.10)" />
      </g>
    </svg>
  );
}
