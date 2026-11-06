import * as THREE from 'three';
import { polyline } from '../hero/film/pencil.ts';
import { type Art, Pen, merge, disposeTree, v3 } from './draw.ts';

// The map grid on the backdrop plane (XZ, y = 0). One draw call: every cell edge is a
// wobbled pencil stroke, and the segments are sorted by distance from the (-x, -z)
// corner, so the draw-on is a wavefront sweeping out from that corner.
export function buildGrid(w: number, d: number, cell: number): Art {
  const root = new THREE.Group();
  const nx = Math.max(1, Math.round(w / cell));
  const nz = Math.max(1, Math.round(d / cell));
  const x0 = -w / 2;
  const z0 = -d / 2;
  const lines = [];
  // each line is subdivided per cell so the wavefront advances cell by cell along it
  for (let i = 0; i <= nz; i++) {
    const z = z0 + (d * i) / nz;
    const pts = [];
    for (let j = 0; j <= nx; j++) pts.push(v3(x0 + (w * j) / nx, 0, z));
    lines.push(polyline(pts, 'faint'));
  }
  for (let j = 0; j <= nx; j++) {
    const x = x0 + (w * j) / nx;
    const pts = [];
    for (let i = 0; i <= nz; i++) pts.push(v3(x, 0, z0 + (d * i) / nz));
    lines.push(polyline(pts, 'faint'));
  }
  const grid = merge(lines, 'faint', (x, _y, z) => Math.hypot(x - x0, z - z0));
  grid.position.y = 0.002; // above the paper, under everything else
  root.add(grid);

  const pen = new Pen();
  pen.at(grid, 0, 1);
  pen.reveal(0);
  return { root, reveal: (p) => pen.reveal(p), dispose: () => disposeTree(root) };
}
