#!/usr/bin/env node
// WS-a-explore step 1/2: reproduce art bible §4.7's OWN method exactly — the off-canvas
// FloatType/NoColorSpace readback via `window.__transfer(family)` (src/film/mock/transfer.ts),
// not a screenshot pixel-read. buildMock() (the visible swatch wall on ?mock=transfer) never
// renders a literal 0xffffff quad — only the 21 named tokens — so the bible's "white albedo"
// row cannot be read off any on-screen patch; this script calls the same in-page function the
// bible's numbers came from and prints its linear rows + the sRGB encode of the white row.
//
// Usage: node scripts/measure/wsa-transfer-probe.mjs <extDay|extNight|interior|cover>

import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const family = process.argv[2] ?? 'extDay';
const port = 9222 + Math.floor(Math.random() * 1000);
const url = `http://localhost:5180/?mock=transfer&family=${family === 'cover' ? 'cover' : family}`;
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profileDir = mkdtempSync(join(tmpdir(), 'wsa-transfer-'));

function enc(lin) {
  const x = Math.max(0, Math.min(1, lin));
  const s = x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

const child = spawn(chrome, [
  '--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${port}`, '--window-size=800,600', '--hide-scrollbars',
  '--no-first-run', '--disable-extensions', `--user-data-dir=${profileDir}`, url,
], { stdio: ['ignore', 'ignore', 'pipe'] });

async function main() {
  const deadline = Date.now() + 20000;
  let target;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page' && t.url.startsWith(url.split('?')[0]));
      if (target) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!target) throw new Error('no chrome target');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res) => ws.addEventListener('open', res, { once: true }));
  let id = 1;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    const p = pending.get(msg.id);
    if (p) { pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result); }
  });
  function send(method, params = {}) {
    const myId = id++;
    const p = new Promise((resolve, reject) => pending.set(myId, { resolve, reject }));
    ws.send(JSON.stringify({ id: myId, method, params }));
    return p;
  }
  // wait for mockReady (T-MOCKREADY)
  const rdyDeadline = Date.now() + 15000;
  let ready = false;
  while (Date.now() < rdyDeadline) {
    const r = await send('Runtime.evaluate', {
      expression: "document.documentElement.dataset.mockReady === '1'", returnByValue: true,
    });
    if (r.result.value) { ready = true; break; }
    await new Promise((res) => setTimeout(res, 150));
  }
  if (!ready) throw new Error('mockReady never set — ?mock=transfer route did not settle');

  const famArg = family === 'cover' ? '' : `'${family}'`;
  const r = await send('Runtime.evaluate', {
    expression: `(async () => { await window.__transfer(${famArg}); return document.documentElement.dataset.transfer; })()`,
    awaitPromise: true, returnByValue: true,
  });
  const { rows } = JSON.parse(r.result.value);
  const wanted = rows.filter((row) => row.token === 'white' && ['UP', 'KEY'].includes(row.ori));
  console.log(`family=${family}`);
  for (const row of wanted) {
    const [R, G, B] = row.lin;
    const hex = '#' + [R, G, B].map(enc).map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
    console.log(`${row.ori}  lin ${R.toFixed(4)} ${G.toFixed(4)} ${B.toFixed(4)}  -> ${hex}  R-B(byte) ${enc(R) - enc(B)}`);
  }
  await send('Browser.close').catch(() => {});
  ws.close();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); }).finally(() => { try { child.kill(); } catch {} });
