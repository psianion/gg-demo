/**
 * The Good Goblin lockup, drawn.
 *
 * GOOD stacked over GOBL·IN: the die sits between GOBL and IN, so the mark reads as
 * GOBLIN and as gobl.in at once. It is the domain and the title in one lockup, which
 * is the only reason the stack can carry the address at all.
 *
 * Carved capitals — cap height 150, stems 26, curves 18, and an O that is a 104x150
 * upright oval rather than a circle. That thick/thin is the whole character of the
 * face; drawn monoline with a circular O it reads as the default rounded sans.
 *
 * He is behind the sign and both are solid ink, so the letters carry a paper halo
 * where they cross him (paint-order: stroke). Without it the two silhouettes merge
 * into one blob and the peek disappears.
 */
export default function Wordmark() {
  return (
    <svg
      viewBox="-24 -112 800 490"
      fill="var(--line)"
      role="img"
      aria-label="Good Goblin — goodgobl.in"
    >
      <defs>
        {/* The film's graphite hand: a pencil never lands the same curve twice. */}
        <filter id="gg-carve" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.009"
            numOctaves="4"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="7"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <path
          id="gg-O"
          fillRule="evenodd"
          d="M52 0 C81 0 104 33.6 104 75 C104 116.4 81 150 52 150 C23 150 0 116.4 0 75 C0 33.6 23 0 52 0 Z
             M52 18 C38 18 26 43 26 75 C26 107 38 132 52 132 C66 132 78 107 78 75 C78 43 66 18 52 18 Z"
        />
        <path
          id="gg-D"
          fillRule="evenodd"
          d="M0 0 L50 0 C78 0 100 33 100 75 C100 117 78 150 50 150 L0 150 Z
             M26 18 L50 18 C64 18 74 43 74 75 C74 107 64 132 50 132 L26 132 Z"
        />
        <path
          id="gg-B"
          fillRule="evenodd"
          d="M0 0 L48 0 C70 0 84 15 84 36 C84 52 76 64 64 69 C80 74 92 88 92 106 C92 131 76 150 48 150 L0 150 Z
             M26 18 L46 18 C55 18 60 26 60 37 C60 49 55 57 46 57 L26 57 Z
             M26 80 L48 80 C59 80 66 91 66 105 C66 121 59 132 48 132 L26 132 Z"
        />
        <path id="gg-L" d="M0 0 L26 0 L26 124 L84 124 L84 150 L0 150 Z" />
        <path id="gg-I" d="M0 0 L26 0 L26 150 L0 150 Z" />
        <path id="gg-N" d="M0 0 L30 0 L74 88 L74 0 L100 0 L100 150 L70 150 L26 62 L26 150 L0 150 Z" />
        {/* G is an arc-drawn C plus its bar and stem. Traced as one silhouette contour
            the bar vanished and the letter read as a C. */}
        <g id="gg-G">
          <path d="M94.6 32 A52 75 0 1 0 94.6 118 L73.3 107.7 A26 57 0 1 1 73.3 42.3 Z" />
          <path d="M56 72 L104 72 L104 120 L82 120 L82 94 L56 94 Z" />
        </g>

        <g id="gg-die" fillRule="evenodd">
          <path
            d="M50 2 L92 26 L92 74 L50 98 L8 74 L8 26 Z
               M50 24 L73 37 L73 63 L50 76 L27 63 L27 37 Z"
          />
          <path d="M50 30 L70 66 L30 66 Z M50 45 L57 59 L43 59 Z" />
        </g>

        {/* Eyes cut out of a solid head rather than drawn on it, and angled — outer
            corners low, inner corners high. Level eyes read startled; these read sly. */}
        <g id="gg-gob">
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

        <g id="gg-word">
          <g transform="translate(122 0)">
            <use href="#gg-G" />
            <use href="#gg-O" x="120" />
            <use href="#gg-O" x="240" />
            <use href="#gg-D" x="360" />
          </g>
          <g transform="translate(0 192)">
            <use href="#gg-G" />
            <use href="#gg-O" x="120" />
            <use href="#gg-B" x="240" />
            <use href="#gg-L" x="348" />
            {/* 70% of cap height, seated on the baseline */}
            <g transform="translate(439 42) scale(1.10)">
              <use href="#gg-die" />
            </g>
            <use href="#gg-I" x="562" />
            <use href="#gg-N" x="604" />
          </g>
        </g>
      </defs>

      <g filter="url(#gg-carve)">
        <g transform="translate(128 0)">
          <use href="#gg-gob" />
        </g>
        <g stroke="var(--paper)" strokeWidth="13" paintOrder="stroke">
          <use href="#gg-word" />
        </g>
      </g>
    </svg>
  );
}
