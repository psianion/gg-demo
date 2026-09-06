#!/usr/bin/env node
// T-FRAME: deterministic, non-interactive frame capture for the film.
//
// Interactive capture (claude-in-chrome) has failed repeatedly on this box: the tab
// reports visibilityState "hidden", gets zero requestAnimationFrame callbacks, and
// screenshots freeze at first paint. Headless Chrome sidesteps all three — it is the
// only tab, so it is always the foreground/visible one.
//
// Why CDP over WebSocket instead of the `--screenshot=` CLI flag: that flag fires the
// capture right after load, with no way to wait for the film to actually reach the
// requested t and render past first paint (App.tsx's ?t= route needs a handful of rAFs
// to seek, hide the cover and settle). Driving Page.captureScreenshot ourselves, after
// polling Runtime.evaluate for readiness, is the only way to capture a SETTLED frame.
// No npm dependency: Node 22 ships a global WebSocket (undici-backed) that is enough
// to speak the protocol.
//
// Usage:
//   node scripts/measure/frame.mjs --t 6.4 --curtain 0 --out docs/build/walks/world/x.png
//   node scripts/measure/frame.mjs --mock foliage --zoom 4 --rig prep --out out.png
//   [--w 1440] [--h 900] [--url http://localhost:5180/] [--hold] [--timeout 15000]
// --out resolution (fixed 2026-09-06, was resolved against CWD, so a run from the app root
// created a stray story/story/docs/... tree instead of landing in the canonical docs/ tree):
// absolute --out is used as-is; a relative --out whose first segment is "docs" resolves
// against the app root's PARENT (the docs/ tree lives one level above the app root); any
// other relative --out resolves against the app root, same as before.

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// app root = two levels up from this file (scripts/measure/frame.mjs), derived from the
// script's own location, never process.cwd() (that was the bug).
const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function resolveOut(out) {
  if (isAbsolute(out)) return out;
  const firstSegment = out.split(/[\\/]/)[0];
  if (firstSegment === 'docs') return resolve(APP_ROOT, '..', out);
  return resolve(APP_ROOT, out);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true; // boolean flag, e.g. --hold
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    join(process.env['LocalAppData'] ?? '', 'Google\\Chrome\\Application\\chrome.exe'),
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(
    `chrome.exe not found. Checked: ${candidates.join(', ')}. Set CHROME_PATH to override.`,
  );
}

function buildUrl(args) {
  const base = args.url ?? 'http://localhost:5180/';
  const qp = new URLSearchParams();
  if (args.mock) {
    qp.set('mock', String(args.mock));
    if (args.zoom) qp.set('zoom', String(args.zoom));
    if (args.rig) qp.set('rig', String(args.rig));
    qp.set('hold', '1'); // T-MOCKREADY: pin the route's clock so two captures are byte-equal
  } else {
    if (args.t === undefined) throw new Error('need --t <seconds> or --mock <class>');
    qp.set('t', String(args.t));
    qp.set('curtain', String(args.curtain ?? '0'));
    qp.set('hud', '1'); // so the captured frame shows the HUD's own t readback
    if (args.hold) qp.set('hold', '1');
  }
  return `${base}?${qp.toString()}`;
}

// --- minimal CDP client over the global WebSocket, no deps ---------------------------

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      const p = this.pending.get(msg.id);
      if (p) {
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
      }
    });
  }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', () => resolve(), { once: true });
      ws.addEventListener('error', (e) => reject(new Error(String(e.message ?? e))), { once: true });
    });
    return new CDP(ws);
  }
  send(method, params = {}) {
    const id = this.nextId++;
    const p = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params }));
    return p;
  }
  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function waitForTarget(port, url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const target = list.find((t) => t.type === 'page' && t.url && t.url.startsWith(url.split('?')[0]));
      if (target) return target;
    } catch {
      // chrome not listening yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`no page target for ${url} within ${timeoutMs}ms`);
}

// generic readiness for a route that carries no dataset flag (e.g. ?mock=): count rAFs
// since the probe first ran and require a healthy run of them, proving WebGL is past
// first paint and actually ticking, not just loaded.
const RAF_PROBE = `
  (function () {
    if (!window.__frameProbeN) {
      window.__frameProbeN = 0;
      const tick = () => { window.__frameProbeN++; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    return window.__frameProbeN;
  })()
`;

async function pollReady(cdp, { mode, minFrames, timeoutMs }) {
  const deadline = Date.now() + timeoutMs;
  let lastFrameT = null;
  while (Date.now() < deadline) {
    // A navigation still settling (or a context torn down between polls) can make one
    // evaluate come back empty — treat that as "not ready yet", not a hard failure; only
    // the overall timeout below is fatal.
    try {
      if (mode === 't') {
        const r = await cdp.send('Runtime.evaluate', {
          expression:
            "JSON.stringify({ready: document.documentElement.dataset.frameReady === '1', t: document.documentElement.dataset.frameT ?? null, hasCanvas: !!document.querySelector('canvas')})",
          returnByValue: true,
        });
        const val = JSON.parse(r.result.value);
        lastFrameT = val.t;
        if (val.ready && val.hasCanvas) return { frameT: val.t };
      } else {
        // T-MOCKREADY: rAF ticks alone only prove WebGL is running, not that the route's
        // async class imports resolved and rendered. Both conditions, one evaluate.
        const r = await cdp.send('Runtime.evaluate', {
          expression: `JSON.stringify({ n: ${RAF_PROBE}, mockReady: document.documentElement.dataset.mockReady === '1' })`,
          returnByValue: true,
        });
        const val = JSON.parse(r.result.value);
        if (val.mockReady && typeof val.n === 'number' && val.n >= minFrames)
          return { frames: val.n, mockReady: true };
      }
    } catch {
      // retry on the next tick
    }
    await new Promise((res) => setTimeout(res, 100));
  }
  throw new Error(`readiness not reached within ${timeoutMs}ms (last t seen: ${lastFrameT})`);
}

async function main() {
  const t0 = performance.now();
  const args = parseArgs(process.argv.slice(2));
  if (!args.out) throw new Error('--out <path.png> is required');
  const outPath = resolveOut(args.out);
  const w = Number(args.w ?? 1440);
  const h = Number(args.h ?? 900);
  const timeoutMs = Number(args.timeout ?? 15000);
  const url = buildUrl(args);
  const mode = args.mock ? 'mock' : 't';

  const chrome = findChrome();
  const profileDir = mkdtempSync(join(tmpdir(), 'tframe-profile-'));
  const port = Number(args.port ?? 9222 + Math.floor(Math.random() * 1000));

  const flagsTried = [];
  async function launchAndCapture(swiftshader) {
    const cliArgs = [
      '--headless=new',
      ...(swiftshader ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
      `--remote-debugging-port=${port}`,
      `--window-size=${w},${h}`,
      '--hide-scrollbars',
      '--no-first-run',
      '--disable-extensions',
      `--user-data-dir=${profileDir}`,
      url,
    ];
    flagsTried.push(cliArgs.slice(0, -1).join(' '));
    const child = spawn(chrome, cliArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d.toString()));
    try {
      const target = await waitForTarget(port, url, timeoutMs);
      const cdp = await CDP.connect(target.webSocketDebuggerUrl);
      await cdp.send('Page.enable');
      const ready = await pollReady(cdp, { mode, minFrames: 20, timeoutMs });
      const gl = await cdp
        .send('Runtime.evaluate', {
          expression:
            "(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl') || c.getContext('webgl2'); return g ? g.getParameter(g.RENDERER) : 'NO_WEBGL'; })()",
          returnByValue: true,
        })
        .catch(() => ({ result: { value: 'UNKNOWN' } }));
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
      await cdp.send('Browser.close').catch(() => {});
      cdp.close();
      return { renderer: gl.result.value, ready, stderr };
    } finally {
      // Browser.close usually ends the process; this is belt-and-braces.
      try {
        child.kill();
      } catch {}
    }
  }

  let result;
  try {
    result = await launchAndCapture(true);
  } catch (e) {
    result = { error: String(e) };
  }
  if (result.error || result.renderer === 'NO_WEBGL') {
    // fall back to plain --headless=new (no forced software-WebGL flags)
    const fallback = await launchAndCapture(false).catch((e) => ({ error: String(e) }));
    result = { ...fallback, firstAttempt: result };
  }

  const ms = performance.now() - t0;
  console.log(
    JSON.stringify(
      { url, out: outPath, ms: Math.round(ms), flagsTried, ...result },
      null,
      2,
    ),
  );
  if (!result.error) console.log(`wrote ${outPath}`);
  if (result.error) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
