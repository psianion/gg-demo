// Talk to the open Blender session through the "MCP for Blender" add-on's bridge (localhost:9876).
//
//   node live.mjs ping
//   node live.mjs run <file.py> [KEY=VALUE]  run a Python file in the live session, print what it prints
//   node live.mjs shot <out.png> [max size]  save the 3D viewport as an image
//
// The bridge takes one JSON command per connection and answers with one JSON object.
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

const [mode, a, b, ...more] = process.argv.slice(2);
// `run file.py KEY=VALUE ...` sets those in the session's environment first, since it cannot inherit this one
const env = (mode === 'run' ? [b, ...more] : [])
  .filter(Boolean)
  .map((pair) => `__import__("os").environ[${JSON.stringify(pair.split('=')[0])}] = ${JSON.stringify(pair.split('=').slice(1).join('='))}\n`)
  .join('');
const command =
  mode === 'run'
    ? { type: 'execute_code', params: { code: `${env}__file__ = ${JSON.stringify(path.resolve(a))}\n${fs.readFileSync(a, 'utf8')}` } }
    : mode === 'shot'
      ? { type: 'get_viewport_screenshot', params: { filepath: path.resolve(a), max_size: Number(b ?? 1600), format: 'png' } }
      : { type: 'ping', params: {} };

const socket = net.connect(9876, '127.0.0.1');
let reply = '';
socket.setTimeout(Number(process.env.LIVE_TIMEOUT ?? 900_000), () => {
  console.error('TIMEOUT waiting for Blender');
  socket.destroy();
  process.exit(2);
});
socket.on('connect', () => socket.write(JSON.stringify(command)));
socket.on('data', (chunk) => {
  reply += chunk;
  let parsed;
  try {
    parsed = JSON.parse(reply);
  } catch {
    return; // the answer is still arriving
  }
  socket.end();
  const result = parsed.result ?? {};
  const text = typeof result === 'string' ? result : (result.result ?? result.output ?? JSON.stringify(result));
  console.log(parsed.status === 'success' ? String(text).slice(-6000) : `ERROR ${String(parsed.message).slice(-6000)}`);
  process.exit(parsed.status === 'success' ? 0 : 1);
});
socket.on('error', (e) => {
  console.error(`NO BRIDGE: ${e.message}`);
  process.exit(3);
});
