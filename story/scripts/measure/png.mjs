#!/usr/bin/env node
// T-MOCKREADY: decode a captured PNG and measure a rectangle of it.
//
// WHY IT EXISTS: every remaining gate in THE PLAN reads pixels off a frame written by
// scripts/measure/frame.mjs, and nothing in the repo could open a PNG. Law 11 forbids a
// new npm dependency, so this is node stdlib only — `fs` for the bytes, `zlib` for the
// one inflate the format needs. Scope is exactly what Page.captureScreenshot emits:
// bit depth 8, colour type 2 (RGB) or 6 (RGBA), non-interlaced. Anything else throws
// with the IHDR it saw rather than guessing.
//
// Usage:
//   node scripts/measure/png.mjs <file.png> --rect x,y,w,h [--rect x,y,w,h ...]
//   node scripts/measure/png.mjs --selftest
//
// Luminance is LINEAR, through THE PLAN §2's piecewise sRGB curve. Never x^2.2: the
// shortcut is off by ~0.01 in triTone and has already produced false corrections.

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { inflateSync, deflateSync } from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// THE PLAN §2 / art bible §11.3. Piecewise, not a power law.
export function lin(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

// The five scanline filters, PNG spec §9.2, undone in place. `bpp` is the byte stride
// between a pixel and the one to its left (3 or 4 here), `prev` the already-unfiltered
// row above (zeros for row 0).
function unfilter(type, row, prev, bpp) {
  const n = row.length;
  switch (type) {
    case 0:
      break;
    case 1:
      for (let i = bpp; i < n; i++) row[i] = (row[i] + row[i - bpp]) & 255;
      break;
    case 2:
      for (let i = 0; i < n; i++) row[i] = (row[i] + prev[i]) & 255;
      break;
    case 3:
      for (let i = 0; i < n; i++) {
        const left = i >= bpp ? row[i - bpp] : 0;
        row[i] = (row[i] + ((left + prev[i]) >> 1)) & 255;
      }
      break;
    case 4:
      for (let i = 0; i < n; i++) {
        const left = i >= bpp ? row[i - bpp] : 0;
        const upLeft = i >= bpp ? prev[i - bpp] : 0;
        row[i] = (row[i] + paeth(left, prev[i], upLeft)) & 255;
      }
      break;
    default:
      throw new Error(`png: unknown scanline filter ${type}`);
  }
}

export function readPng(path) {
  const buf = readFileSync(path);
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error(`png: ${path} is not a PNG (bad signature)`);

  let width = 0;
  let height = 0;
  let depth = 0;
  let colour = 0;
  let interlace = 0;
  const idat = [];
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('latin1', off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      colour = body[9];
      interlace = body[12];
    } else if (type === 'IDAT') {
      idat.push(body);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len; // length + type + data + crc
  }

  const ihdr = `IHDR w=${width} h=${height} depth=${depth} colour=${colour} interlace=${interlace}`;
  if (depth !== 8) throw new Error(`png: only bit depth 8 supported — ${ihdr}`);
  if (colour !== 2 && colour !== 6) throw new Error(`png: only colour type 2/6 supported — ${ihdr}`);
  if (interlace !== 0) throw new Error(`png: interlaced images not supported — ${ihdr}`);
  if (!idat.length) throw new Error(`png: no IDAT chunk — ${ihdr}`);

  const channels = colour === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  if (raw.length < height * (stride + 1)) {
    throw new Error(`png: truncated image data (${raw.length} bytes, need ${height * (stride + 1)})`);
  }

  const data = new Uint8Array(height * stride);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const p = y * (stride + 1);
    const row = raw.subarray(p + 1, p + 1 + stride);
    unfilter(raw[p], row, prev, channels);
    data.set(row, y * stride);
    prev = row;
  }
  return { width, height, channels, data };
}

// Mean sRGB bytes, mean LINEAR luminance, mean r-b in bytes, over a rectangle.
// The rect is clamped to the image; an empty intersection throws rather than
// returning a plausible-looking zero.
export function patch(img, x, y, w, h) {
  const x0 = Math.max(0, Math.trunc(x));
  const y0 = Math.max(0, Math.trunc(y));
  const x1 = Math.min(img.width, Math.trunc(x) + Math.trunc(w));
  const y1 = Math.min(img.height, Math.trunc(y) + Math.trunc(h));
  if (x1 <= x0 || y1 <= y0) {
    throw new Error(`png: rect ${x},${y},${w},${h} is outside ${img.width}x${img.height}`);
  }
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sl = 0;
  const c = img.channels;
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * img.width + x0) * c;
    for (let xx = x0; xx < x1; xx++, i += c) {
      const r = img.data[i];
      const g = img.data[i + 1];
      const b = img.data[i + 2];
      sr += r;
      sg += g;
      sb += b;
      sl += 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    }
  }
  const n = (x1 - x0) * (y1 - y0);
  return { r: sr / n, g: sg / n, b: sb / n, lum: sl / n, rb: (sr - sb) / n };
}

// --- CLI ----------------------------------------------------------------------------

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

// Encodes a 6-wide RGBA image with ONE filter type per row and decodes it back.
// Five filters need five rows (the brief's "6x4" cannot carry all five), so it is
// 6 x 5 — the assertion the test exists for is "every filter round-trips".
function selftest() {
  const W = 6;
  const FILTERS = [0, 1, 2, 3, 4];
  const H = FILTERS.length;
  const px = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      px[i] = (x * 41 + y * 7) & 255;
      px[i + 1] = (x * 13 + y * 97 + 5) & 255;
      px[i + 2] = (x * 211 + y * 3 + 128) & 255;
      px[i + 3] = 255 - ((x + y) & 15);
    }
  }
  const stride = W * 4;
  const raw = Buffer.alloc(H * (stride + 1));
  for (let y = 0; y < H; y++) {
    const f = FILTERS[y];
    raw[y * (stride + 1)] = f;
    for (let i = 0; i < stride; i++) {
      const cur = px[y * stride + i];
      const left = i >= 4 ? px[y * stride + i - 4] : 0;
      const up = y > 0 ? px[(y - 1) * stride + i] : 0;
      const upLeft = y > 0 && i >= 4 ? px[(y - 1) * stride + i - 4] : 0;
      const sub =
        f === 0 ? 0 : f === 1 ? left : f === 2 ? up : f === 3 ? (left + up) >> 1 : paeth(left, up, upLeft);
      raw[y * (stride + 1) + 1 + i] = (cur - sub) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // depth
  ihdr[9] = 6; // colour type RGBA
  const png = Buffer.concat([
    SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  const tmp = new URL('./.png-selftest.png', import.meta.url);
  writeFileSync(tmp, png);
  let img;
  try {
    img = readPng(tmp);
  } finally {
    try {
      unlinkSync(tmp);
    } catch {}
  }
  if (img.width !== W || img.height !== H || img.channels !== 4) {
    throw new Error(`selftest: header mismatch ${img.width}x${img.height}c${img.channels}`);
  }
  for (let i = 0; i < px.length; i++) {
    if (img.data[i] !== px[i]) {
      const y = Math.floor(i / stride);
      throw new Error(
        `selftest: byte ${i} (row ${y}, filter ${FILTERS[y]}) decoded ${img.data[i]}, expected ${px[i]}`,
      );
    }
  }
  console.log('selftest ok');
}

function main(argv) {
  if (argv.includes('--selftest')) return selftest();
  const rects = [];
  let file = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--rect') {
      const v = String(argv[++i] ?? '').split(',').map(Number);
      if (v.length !== 4 || v.some((n) => !Number.isFinite(n))) {
        throw new Error(`--rect needs x,y,w,h — got "${argv[i]}"`);
      }
      rects.push(v);
    } else if (!argv[i].startsWith('--')) {
      file = argv[i];
    }
  }
  if (!file) throw new Error('usage: node scripts/measure/png.mjs <file.png> --rect x,y,w,h [--rect ...] | --selftest');
  const img = readPng(file);
  if (!rects.length) rects.push([0, 0, img.width, img.height]);
  console.log(`${file}  ${img.width}x${img.height}  channels ${img.channels}`);
  for (const [x, y, w, h] of rects) {
    const p = patch(img, x, y, w, h);
    const sign = p.rb >= 0 ? '+' : '-';
    console.log(
      `rect ${x},${y},${w},${h}  ${p.r.toFixed(1)} ${p.g.toFixed(1)} ${p.b.toFixed(1)}` +
        `  lum ${p.lum.toFixed(4)}  R-B ${sign}${Math.abs(p.rb).toFixed(1)}`,
    );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(String(e.message ?? e));
    process.exit(1);
  }
}
