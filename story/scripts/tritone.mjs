#!/usr/bin/env node
// Canonical triTone tool — THE PLAN §2 / §4.3, art bible §11.3.
// Exact piecewise sRGB decode. Never x^2.2 (see THE PLAN §2 "triAlbedo").
//
//   node scripts/tritone.mjs <hex>
//   node scripts/tritone.mjs mix <hexA> <hexB> <t>
//   node scripts/tritone.mjs stop <hex> <g> [g2 g3 ...]
//   node scripts/tritone.mjs mul <hexA> <hexB>

const INK = '#222222';
const PAPER = '#F7F5F0';
const BOUNDARIES = [0.14, 0.3, 0.46, 0.62];

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lin(byte) {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// linFrac — same piecewise sRGB decode as lin(), but for a 0..1 fraction that is
// already normalized (a grey stop `g`, not a 0..255 byte). Used by "stop"/"mul".
function linFrac(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// encByte — exact piecewise sRGB OETF, encode linear back to an 0..255 byte.
function encByte(linVal) {
  const c = linVal <= 0.0031308 ? linVal * 12.92 : 1.055 * linVal ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

function lum([r, g, b]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function enc(x) {
  return x ** 0.4545;
}

const encInk = enc(lum(hexToRgb(INK)));
const encPaper = enc(lum(hexToRgb(PAPER)));

function triTone(hex) {
  const triT = (enc(lum(hexToRgb(hex))) - encInk) / (encPaper - encInk);
  return 1 - triT;
}

function tierOf(t) {
  let tier = BOUNDARIES.findIndex((b) => t < b);
  if (tier === -1) tier = 4;
  const distance = Math.min(...BOUNDARIES.map((b) => Math.abs(t - b)));
  return { tier, distance };
}

// mixHex — copied verbatim from src/film/mock/groundKit.ts
// (grep -n "export const mixHex" src/film/mock/groundKit.ts). Do not reimplement.
const mixHex = (a, b, t) => {
  const ch = (h, s) => (h >> s) & 255;
  const m = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};

const hexToNum = (hex) => parseInt(hex.replace('#', ''), 16);
const numToHex = (n) => '#' + n.toString(16).padStart(6, '0').toUpperCase();

// computeFromLinear — triTone computed DIRECTLY from linear channels, no hex
// round-trip (measured under P0h: round-tripping through an 8-bit hex byte before
// re-deriving luminance is off by ~0.001-0.002 in triTone). The hex printed is
// informational only.
function computeFromLinear(rl, gl, bl) {
  const clip = rl > 1 || gl > 1 || bl > 1;
  const clipVals = clip ? [rl, gl, bl] : null;
  const crl = Math.min(1, rl);
  const cgl = Math.min(1, gl);
  const cbl = Math.min(1, bl);
  const l = 0.2126 * crl + 0.7152 * cgl + 0.0722 * cbl;
  const e = enc(l);
  const t = 1 - (e - encInk) / (encPaper - encInk);
  const { tier, distance } = tierOf(t);
  const hex =
    '#' +
    [crl, cgl, cbl].map((v) => encByte(v).toString(16).padStart(2, '0').toUpperCase()).join('');
  return { l, e, t, tier, distance, hex, clip, clipVals };
}

function printLinearResult(prefix, res) {
  if (res.clip) {
    console.log(`${prefix}CLIP lin=[${res.clipVals.map((v) => v.toFixed(4)).join(', ')}]`);
  }
  console.log(`${prefix}hex ${res.hex}`);
  console.log(`${prefix}lum ${res.l.toFixed(6)}`);
  console.log(`${prefix}enc ${res.e.toFixed(6)}`);
  console.log(`${prefix}triTone ${res.t.toFixed(4)}`);
  console.log(`${prefix}tier ${res.tier}`);
  console.log(`${prefix}distance ${res.distance.toFixed(4)}`);
}

function stoneCoolStopTriTone(g) {
  const [r, gg, b] = hexToRgb('#8792A6');
  const gl = linFrac(g);
  return computeFromLinear(lin(r) * gl, lin(gg) * gl, lin(b) * gl).t;
}

function selfCheck() {
  const okInk = encInk.toFixed(5) === '0.15266';
  const okWater = triTone('#CFDDDF').toFixed(4) === '0.1335';
  const okStop78 = stoneCoolStopTriTone(0.78).toFixed(4) === '0.6469';
  const okStop56 = stoneCoolStopTriTone(0.56).toFixed(4) === '0.8007';
  const okStop100 = stoneCoolStopTriTone(1.0).toFixed(4) === '0.4893';
  if (!okInk || !okWater || !okStop78 || !okStop56 || !okStop100) {
    console.log('FAIL');
    console.log(`encInk=${encInk} triTone(#CFDDDF)=${triTone('#CFDDDF')}`);
    console.log(
      `stoneCool stop(0.78)=${stoneCoolStopTriTone(0.78)} stop(0.56)=${stoneCoolStopTriTone(
        0.56,
      )} stop(1.0)=${stoneCoolStopTriTone(1.0)}`,
    );
    process.exit(1);
  }
}

function report(hex) {
  const rgb = hexToRgb(hex);
  const l = lum(rgb);
  const e = enc(l);
  const t = triTone(hex);
  const { tier, distance } = tierOf(t);
  console.log(`hex ${hex.toUpperCase()}`);
  console.log(`lum ${l.toFixed(6)}`);
  console.log(`enc ${e.toFixed(6)}`);
  console.log(`triTone ${t.toFixed(4)}`);
  console.log(`tier ${tier}`);
  console.log(`distance ${distance.toFixed(4)}`);
}

function usage() {
  console.log('node scripts/tritone.mjs <hex>                        report a token');
  console.log('node scripts/tritone.mjs mix <hexA> <hexB> <t>        report mixHex(A, B, t)');
  console.log('node scripts/tritone.mjs stop <hex> <g> [g2 g3 ...]   report lin(hex) x lin(g) per grey stop');
  console.log('node scripts/tritone.mjs mul <hexA> <hexB>            report lin(hexA) x lin(hexB) per channel');
}

selfCheck();
console.log(`encInk ${encInk.toFixed(5)}`);

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  usage();
  process.exit(args.length === 0 ? 1 : 0);
} else if (args[0] === 'mix') {
  const [, hexA, hexB, tStr] = args;
  const mixed = numToHex(mixHex(hexToNum(hexA), hexToNum(hexB), parseFloat(tStr)));
  report(mixed);
} else if (args[0] === 'stop') {
  const [, hex, ...gStrs] = args;
  const gs = gStrs.map(Number);
  if (!hex || gs.length === 0 || gs.some(Number.isNaN)) {
    usage();
    process.exit(1);
  }
  const [r, g, b] = hexToRgb(hex);
  let minDistance = Infinity;
  for (const gVal of gs) {
    const gl = linFrac(gVal);
    const res = computeFromLinear(lin(r) * gl, lin(g) * gl, lin(b) * gl);
    console.log(`g ${gVal}`);
    printLinearResult('  ', res);
    minDistance = Math.min(minDistance, res.distance);
  }
  if (gs.length > 1) console.log(`min distance ${minDistance.toFixed(4)}`);
} else if (args[0] === 'mul') {
  const [, hexA, hexB] = args;
  if (!hexA || !hexB) {
    usage();
    process.exit(1);
  }
  const [ar, ag, ab] = hexToRgb(hexA);
  const [br, bg, bb] = hexToRgb(hexB);
  const res = computeFromLinear(lin(ar) * lin(br), lin(ag) * lin(bg), lin(ab) * lin(bb));
  printLinearResult('', res);
} else {
  report(args[0]);
}
