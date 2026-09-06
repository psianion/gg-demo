#!/usr/bin/env node
// WS-a-explore: frame.mjs's buildUrl() has no --family flag (it only wires mock/zoom/rig/hold),
// so `frame.mjs --mock transfer --family X` silently ignores --family and always shoots the
// 'cover' rig. This is a thin variant, screenshot-only, that adds &family=.
// Usage: node scripts/measure/wsa-frame-transfer.mjs <family> [prep] <out.png>
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const [family, maybePrep, ...rest] = process.argv.slice(2);
const prep = maybePrep === 'prep';
const out = prep ? rest[0] : maybePrep;
const port = 9222 + Math.floor(Math.random() * 1000);
const url = `http://localhost:5180/?mock=transfer&family=${family}&zoom=1${prep ? '&rig=prep' : ''}&hold=1`;
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profileDir = mkdtempSync(join(tmpdir(), 'wsa-frame-'));

const child = spawn(chrome, [
  '--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${port}`, '--window-size=1440,900', '--hide-scrollbars',
  '--no-first-run', '--disable-extensions', `--user-data-dir=${profileDir}`, url,
], { stdio: ['ignore', 'ignore', 'pipe'] });

async function main() {
  const deadline = Date.now() + 30000;
  let target;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = list.find((t) => t.type === 'page' && t.url.startsWith(url.split('?')[0]));
      if (target) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!target) throw new Error('no chrome target for ' + url);
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
  await send('Page.enable');
  const rdyDeadline = Date.now() + 25000;
  let ready = false;
  while (Date.now() < rdyDeadline) {
    const r = await send('Runtime.evaluate', {
      expression: "document.documentElement.dataset.mockReady === '1'", returnByValue: true,
    });
    if (r.result.value) { ready = true; break; }
    await new Promise((res) => setTimeout(res, 150));
  }
  if (!ready) throw new Error('mockReady never set for ' + url);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('wrote ' + out);
  await send('Browser.close').catch(() => {});
  ws.close();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); }).finally(() => { try { child.kill(); } catch {} });
