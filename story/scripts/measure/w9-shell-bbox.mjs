// W9-explore pass 2: geometry facts for the mock snow drape, read-only.
// Invoke: node --experimental-strip-types scripts/measure/w9-shell-bbox.mjs
import { buildMock } from '../../src/film/mock/snow.ts';

const root = buildMock();
let shell = null;
root.traverse((o) => { if (o.name === 'massif-snow-shell') shell = o; });
if (!shell) throw new Error('massif-snow-shell mesh not found in buildMock() output');

const pos = shell.geometry.getAttribute('position');
const uv = shell.geometry.getAttribute('uv');
let min = [Infinity, Infinity, Infinity];
let max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
  min = [Math.min(min[0], x), Math.min(min[1], y), Math.min(min[2], z)];
  max = [Math.max(max[0], x), Math.max(max[1], y), Math.max(max[2], z)];
}
let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
for (let i = 0; i < uv.count; i++) {
  uMin = Math.min(uMin, uv.getX(i)); uMax = Math.max(uMax, uv.getX(i));
  vMin = Math.min(vMin, uv.getY(i)); vMax = Math.max(vMax, uv.getY(i));
}
console.log('vertex count', pos.count);
console.log('bbox min', min.map((n) => n.toFixed(4)).join(','));
console.log('bbox max', max.map((n) => n.toFixed(4)).join(','));
console.log('uv u', uMin.toFixed(4), uMax.toFixed(4));
console.log('uv v', vMin.toFixed(4), vMax.toFixed(4));
console.log('material map present?', !!shell.material.map, '(document undefined in node => bake skipped, expected null)');
