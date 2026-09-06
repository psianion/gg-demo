# scripts/measure

Reproduction scripts cited by art-bible CORRECTED/CLARIFIED notes (law 14): a
`Reproduce:` in a bible note must point here, run as `node scripts/measure/<file>`
from the app root, and print the number the note states. No scratchpad paths.

- `w3a-step-verify.mjs` — row 4 (Cliff/strata): worst cliff-boundary step px, S1/S7.
- `w3a-strata-crossings.mjs` — row 4 (Cliff/strata): cut x boundary-arc crossings, S1/S7.
- `w3c-impact-crossings.mjs` — row 23 (Transient mark): §4.5 crossing count for the impact mark set.
- `frame.mjs` — T-FRAME: headless, non-interactive frame capture of the film (`?t=`) or a `?mock=` route via the DevTools protocol, no npm deps. `node scripts/measure/frame.mjs --t 6.4 --curtain 0 --out <path.png>` (or `--mock <class> --zoom N --rig prep`); see the header comment for every flag.
- `png.mjs` — T-MOCKREADY: node-stdlib PNG decoder + patch statistics for any captured frame. `node scripts/measure/png.mjs <file.png> --rect x,y,w,h [--rect …]` prints `R G B`, LINEAR `lum` (THE PLAN §2's piecewise curve, never `x^2.2`) and `R-B`; `--selftest` round-trips all five scanline filters and prints `selftest ok`. Importable: `readPng(path)` / `patch(img, x, y, w, h)` / `lin(byte)`.
- `wsa-wash-row.mjs` — WS-a: finds the row where the CSS wash reaches paper. `node scripts/measure/wsa-wash-row.mjs <file.png> [--tol 4] [--x0 300] [--x1 <w>]` scans every row across the column band, prints the first row whose mean is within tol of the bottom band, and its percentage of frame height (spec: 52 % +/- 5 %). Pass a geometry-free column with --x0/--x1 where anything stands in frame.
- `mockReady` contract — T-MOCKREADY: `MockSheet.tsx` sets `document.documentElement.dataset.mockReady = ''` on mount and `'1'` three `useFrame` ticks after the async class imports resolve (raised even when every id produced a note); `frame.mjs`'s `--mock` capture returns only when that flag is `'1'` AND the rAF probe has reached `minFrames`, and appends `&hold=1` so the route pins its world clock (`flicker(t)` on the hero campfire) and two captures of the same args are byte-equal.
