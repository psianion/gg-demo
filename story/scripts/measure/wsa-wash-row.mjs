// WS-a — where the wash reaches paper.
// Scans every row of a captured frame across a column band and prints the first row whose
// mean RGB is within `--tol` (default 4/255) per channel of the bottom-band value
// (`x0, h-18, x1-x0, 18`). Spec: that row sits at 52 % +/- 5 % of height.
//
//   node scripts/measure/wsa-wash-row.mjs <file.png> [--tol 4] [--x0 300] [--x1 <w>]
//
// --x0/--x1 pick the COLUMN band. The default 300..w is the whole frame minus the HUD and
// only means anything where no geometry stands in the column; where geometry does, pass a
// geometry-free column and state it in the report.
import { readPng, patch } from './png.mjs';

const [file, ...rest] = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = rest.indexOf('--' + name);
  return i === -1 ? dflt : Number(rest[i + 1]);
};
const tol = arg('tol', 4);
const x0 = arg('x0', 300);

const img = readPng(file);
const { width: w, height: h } = img;
const x1 = arg('x1', w);
const bw = x1 - x0;
const bottom = patch(img, x0, h - 18, bw, 18);
const target = [bottom.r, bottom.g, bottom.b];

let first = -1;
const rows = [];
for (let y = 0; y < h; y++) {
  const p = patch(img, x0, y, bw, 1);
  rows.push(p);
  const d = Math.max(Math.abs(p.r - target[0]), Math.abs(p.g - target[1]), Math.abs(p.b - target[2]));
  if (first === -1 && d <= tol) first = y;
}

const pct = first === -1 ? NaN : (first / h) * 100;
console.log(`${file}  ${w}x${h}  column x ${x0}..${x1}`);
console.log(`bottom band ${target.map((v) => v.toFixed(1)).join(' ')} (rect ${x0},${h - 18},${bw},18)  tol ${tol}`);
console.log(`first row within tol: ${first}  = ${pct.toFixed(1)} % of height  (spec 52 % +/- 5 % => rows ${Math.round(h * 0.47)}..${Math.round(h * 0.57)})`);
for (const y of [0, Math.round(h * 0.25), Math.round(h * 0.47), first, Math.round(h * 0.57), h - 1]) {
  if (y < 0 || y >= h) continue;
  const p = rows[y];
  console.log(`  row ${String(y).padStart(3)}  ${p.r.toFixed(1)} ${p.g.toFixed(1)} ${p.b.toFixed(1)}`);
}
