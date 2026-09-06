#!/usr/bin/env node
// WS-a-explore step 5: reproduce art bible §4.7's diagonal-gain model (§4.7.1) in node,
// then sweep a hemisphere tint `k` per chapter token to find the largest k that keeps
// |R-B| <= 5 and |dL| <= 3/255 on UP and KEY, per family.
//
// Model (art bible §4.7.1, verified against rigs.ts / Film.tsx / transfer.ts):
//   G(n) = [ mix(ground_lin, sky_lin, 0.5*n.y+0.5) * HEMI_I + key_lin * KEY_I * max(0,n.k) ] / pi
//   screen_linear = albedo_linear (*) G(n)   -- for a white albedo, screen_linear = G(n)
// FILM_RIG (stages/rigs.ts): sky=fillSky, ground=fillGround, hemiI=1.45, keyI=KEY_I=2.2.
// Film.tsx's key axis on an up-facing surface: n.k = (10 sinE + 14) / sqrt(377 + 280 sinE);
// transfer.ts quotes it at the median exterior E where n.k = D_DAY = 0.78, and builds the
// axis as filmKeyAxis = (h*0.6, D_DAY, h*0.8), h = sqrt(1-D_DAY^2) -- already unit length.
// KEY orientation is n = filmKeyAxis itself (n.k=1, n.y=D_DAY); UP is n=(0,1,0) (n.k=D_DAY,
// hemisphere weight = 1, pure sky).

function lin(byteOrHex) {
  const x = byteOrHex / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
function hexToLin(hex) {
  const n = typeof hex === 'string' ? parseInt(hex.replace('#', ''), 16) : hex;
  return [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
}
function enc(x) {
  const c = Math.max(0, Math.min(1, x));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}
function encByte(x) {
  return Math.round(enc(x) * 255);
}
function mix3(a, b, t) {
  return [0, 1, 2].map((i) => a[i] * (1 - t) + b[i] * t);
}
function mixHexLin(aHex, bHex, t) {
  return mix3(hexToLin(aHex), hexToLin(bHex), t);
}

const HEMI_I = 1.45; // FILM_RIG.hemiI
const KEY_I = 2.2; // FILM_RIG.keyI
const D_DAY = 0.78;
const h = Math.sqrt(1 - D_DAY * D_DAY);
const keyAxisY = D_DAY; // n.y of the KEY orientation (filmKeyAxis is already unit length)

const FILL_SKY = 0xcdd9e8;
const FILL_GROUND = 0x8a7458;

const FAMILIES = {
  extDay: 0xfaf2e6, // keyDay
  extNight: 0xbbb2bb, // keyNight
  interior: 0xffeacc, // keyWarm
};

// hemisphere weight toward sky: 0.5*n.y + 0.5
function hemiTerm(nY, skyLin, groundLin) {
  const wSky = 0.5 * nY + 0.5;
  return mix3(groundLin, skyLin, wSky).map((v) => v * HEMI_I);
}
function keyTerm(keyLin, nDotK) {
  return keyLin.map((v) => v * KEY_I * Math.max(0, nDotK));
}
function gain(nY, nDotK, skyLin, groundLin, keyLin) {
  const hem = hemiTerm(nY, skyLin, groundLin);
  const key = keyTerm(keyLin, nDotK);
  return [0, 1, 2].map((i) => (hem[i] + key[i]) / Math.PI);
}

// --- verify k=0 reproduces the bible's ext-day UP #E8E8E8 / KEY #F7F5F2 ---
const skyLin0 = hexToLin(FILL_SKY);
const groundLin0 = hexToLin(FILL_GROUND);
const keyLinDay = hexToLin(FAMILIES.extDay);
const upG = gain(1, D_DAY, skyLin0, groundLin0, keyLinDay); // UP: n.y=1, n.k=D_DAY
const keyG = gain(keyAxisY, 1, skyLin0, groundLin0, keyLinDay); // KEY: n.y=D_DAY, n.k=1
const upBytes = upG.map(encByte);
const keyBytes = keyG.map(encByte);
const upTarget = [0xe8, 0xe8, 0xe8];
const keyTarget = [0xf7, 0xf5, 0xf2];
const upErr = upBytes.map((v, i) => v - upTarget[i]);
const keyErr = keyBytes.map((v, i) => v - keyTarget[i]);
console.log('VERIFY k=0 against bible #E8E8E8 (UP) / #F7F5F2 (KEY), ext-day:');
console.log('  UP  bytes', upBytes, ' err', upErr);
console.log('  KEY bytes', keyBytes, ' err', keyErr);
const worst = Math.max(...upErr.map(Math.abs), ...keyErr.map(Math.abs));
if (worst > 2) {
  console.log(`STOP: worst byte error ${worst} exceeds +-2/255. Do not trust the sweep below.`);
  process.exit(1);
}
console.log(`  worst byte error ${worst} <= 2 -- model verified.\n`);

// --- chapter tokens (palette.ts) ---
const TOKENS = {
  skyDusk: 0x6d78ae,
  skyDay: 0xaccde6,
  skyOvercast: 0xaab6c0,
  skyHearth: 0xd4b184,
  skyVellum: 0xeee6d2,
  skyDawn: 0xe6c1a2,
  skyBoard: 0xf7f5f0,
};
// which family lights each chapter (art bible §4.7.2 / palette.ts family comments)
const TOKEN_FAMILY = {
  skyDusk: 'extNight',
  skyDay: 'extDay', // C2 the run -- lit ext-day per keyDay
  skyOvercast: 'extDay',
  skyHearth: 'interior',
  skyVellum: 'extDay',
  skyDawn: 'extDay',
  skyBoard: 'extDay',
};

const KS = [0.05, 0.1, 0.15, 0.2, 0.3];

console.log('token       fam       k     UP R G B (bytes)   R-B   dL(vs k=0)   KEY R G B (bytes)  R-B   dL(vs k=0)');
for (const [token, hex] of Object.entries(TOKENS)) {
  const fam = TOKEN_FAMILY[token];
  const keyLin = hexToLin(FAMILIES[fam]);
  const base = { up: gain(1, D_DAY, skyLin0, groundLin0, keyLin), key: gain(keyAxisY, 1, skyLin0, groundLin0, keyLin) };
  const lumOf = (g) => 0.2126 * g[0] + 0.7152 * g[1] + 0.0722 * g[2];
  const baseLumUp = lumOf(base.up);
  const baseLumKey = lumOf(base.key);
  let markedK = 0;
  for (const k of KS) {
    const tintedSky = mixHexLin(FILL_SKY, hex, k);
    const upG_ = gain(1, D_DAY, tintedSky, groundLin0, keyLin);
    const keyG_ = gain(keyAxisY, 1, tintedSky, groundLin0, keyLin);
    const upB = upG_.map(encByte);
    const keyB = keyG_.map(encByte);
    const upRB = upB[0] - upB[2];
    const keyRB = keyB[0] - keyB[2];
    const dLup = Math.round((lumOf(upG_) - baseLumUp) * 255);
    const dLkey = Math.round((lumOf(keyG_) - baseLumKey) * 255);
    console.log(
      `${token.padEnd(11)} ${fam.padEnd(9)} ${k.toFixed(2)}  ${upB.join(' ').padEnd(11)}      ${upRB >= 0 ? '+' : ''}${upRB}    ${dLup >= 0 ? '+' : ''}${dLup}          ${keyB.join(' ').padEnd(11)}      ${keyRB >= 0 ? '+' : ''}${keyRB}   ${dLkey >= 0 ? '+' : ''}${dLkey}` +
        (Math.abs(upRB) <= 5 && Math.abs(keyRB) <= 5 && Math.abs(dLup) <= 3 && Math.abs(dLkey) <= 3 ? '  OK' : ''),
    );
    if (Math.abs(upRB) <= 5 && Math.abs(keyRB) <= 5 && Math.abs(dLup) <= 3 && Math.abs(dLkey) <= 3) markedK = k;
  }
  console.log(`  -> ${token}: largest clean k = ${markedK}`);
}
