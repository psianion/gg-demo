import * as THREE from 'three';
import * as P from '../palette.ts';
import { LINE, paint, sketch } from '../pencil.ts';

// C7 — the second d20 at the cliff, and the pencil game board the film ends on. Lifted
// out of buildCliffWorld unchanged: it shared no local with the cliff or the miniature,
// only the container both were parented to, which is now the caller's job.
export function buildBoard() {
  const die2 = sketch(new THREE.IcosahedronGeometry(0.5), 25, 'hero');
  die2.position.set(122.8, 6.8, 0);
  die2.scale.set(0, 0, 0);
  paint(die2, { fill: P.dieBone });

  // The board is the film's last image — the d20's face becomes it, and the visitor is
  // meant to land on an actual map. Floating grid lines with nothing behind them read as
  // a wireframe, so it gets paper to sit on, a double-ruled edge and corner registration
  // marks, the way a printed board is trimmed.
  //
  // Every material in this group MUST be board-local, transparent and start at opacity 0:
  // the timeline traverses the group, collects whatever it finds and fades it all up. A
  // shared material in here would drag the rest of the film up with it.
  const board = new THREE.Group();
  board.position.set(145, 35.4, 0);

  // board-fill, set directly rather than through paint()'s shared cache — this material
  // must stay board-local so the opacity fade in timeline.ts only ever touches this group.
  // Named because it is the one material in the group that does NOT go to full opacity:
  // it is the paper the flattened world is printed on, not a lid over it. See BOARD_WASH
  // in timeline.ts.
  const boardFill = new THREE.Mesh(
    new THREE.PlaneGeometry(25.4, 25.4),
    new THREE.MeshBasicMaterial({
      name: 'board-fill',
      color: P.boardFill,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  );
  boardFill.rotation.x = -Math.PI / 2;
  boardFill.position.y = -0.02; // under the grid, clear of z-fighting
  board.add(boardFill);

  const grid = new THREE.GridHelper(24, 24, LINE, LINE);
  const gridMat = grid.material as THREE.LineBasicMaterial;
  gridMat.transparent = true;
  gridMat.opacity = 0;
  board.add(grid);

  const boardInk = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0 });
  const ruleAt = (r: number) =>
    new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-r, 0, -r),
        new THREE.Vector3(r, 0, -r),
        new THREE.Vector3(r, 0, r),
        new THREE.Vector3(-r, 0, r),
      ]),
      boardInk,
    );
  board.add(ruleAt(12), ruleAt(12.55));

  // trim marks at the corners
  const tickPts: THREE.Vector3[] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      tickPts.push(
        new THREE.Vector3(sx * 12.9, 0, sz * 12.55),
        new THREE.Vector3(sx * 13.5, 0, sz * 12.55),
        new THREE.Vector3(sx * 12.55, 0, sz * 12.9),
        new THREE.Vector3(sx * 12.55, 0, sz * 13.5),
      );
    }
  }
  board.add(
    new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tickPts), boardInk),
  );

  return { die2, board };
}
