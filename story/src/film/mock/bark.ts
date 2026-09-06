// MOCK — Bark / trunk. Art bible §11.2, row 6. FLORA AND SKY, author 2.
//
//   http://localhost:5180/?mock=bark            beside the actual hero island
//   http://localhost:5180/?mock=bark&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=bark&zoom=1..6
//
// Row 6 is THE ONE HERO BAKE THAT DOES NOT TRANSFER, and the reason is arithmetic: at
// 128² the 1.5–4.5-texel streaks measure 1.6–4.7 screen px at the film's 133 px/u
// figure floor, under the 2 px floor at the thin end. So this mock's whole job is to
// put the 256² re-bake on screen at THREE diameters at once — a thick old trunk, a
// mid trunk, a slim pole — because a bark tile that only holds at one diameter is not
// a film-wide bake, it is a lucky trunk.
//
// RECIPE (row 6): trunk cylinders + trunkSide() tapering side strokes; sheet: true,
// dir 1.35 + (seed%3)·0.05 along the grain; poster 0; bakeBark 256²; timber #94795A t3
// / timberDark #6A5138 t4; drawn state = tier 3–4 plus the tapering side strokes.

import * as THREE from 'three';
import { createTrilayer } from '../stages/trilayer.ts';
import { roughen } from '../pencil.ts';
import { propGround } from './groundKit.ts';
import * as P from '../palette.ts';
import {
  StrokeBag,
  arcPts,
  bakeBark,
  kseed,
  leanTip,
  mixHex,
  parkSeam,
  merged,
  placed,
  trunkGeom,
  trunkSideRuns,
} from './foliageKit.ts';

// x, z, base radius, top radius, height, and the seed that picks the family angle.
// Three diameters spanning the film's whole range, plus the two other things row 6
// covers by name: a limb and a post.
const TRUNKS = [
  { x: -1.05, z: -0.35, rb: 0.225, rt: 0.145, h: 2.62, lean: 0.035, dir: 0.4 }, // old oak — coarse grain
  { x: 0.95, z: 0.55, rb: 0.132, rt: 0.092, h: 2.16, lean: -0.06, dir: 1.1 }, // a mid trunk
  { x: 1.95, z: -0.75, rb: 0.062, rt: 0.05, h: 1.72, lean: 0.09, dir: 2.3 }, // the slim pole — the hard case
];

export function buildMock(): THREE.Object3D {
  parkSeam();
  kseed(0x4c1f22b);
  const g = new THREE.Group();
  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class now builds the ordinary ground
  // card under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  g.add(propGround(3, 2.2, [[-1.05,-0.35,108,0.28],[0.95,0.55,72,0.26],[1.95,-0.75,42,0.24],[-2.15,0.85,42,0.24],[0.05,1.35,132,0.3]]));
  const bag = new StrokeBag();
  const bark = bakeBark();
  const parts: THREE.BufferGeometry[] = [];

  for (const t of TRUNKS) {
    parts.push(trunkGeom(t.rt, t.rb, t.h, t.x, 0, t.z, t.lean, t.dir));
    const [dx, ty, dz] = leanTip(t.h, t.lean, t.dir);
    for (const run of trunkSideRuns(t.x, t.z, t.rb * 1.12, t.rt * 0.72, 0.02, ty, dx, dz)) {
      bag.add(run, 'form', 'paint');
    }
    // TWO BARK STREAKS AT 'faint', INSIDE the silhouette. This is row 7's own vocabulary
    // — 'the fix for a smooth Lambert limb was drawn marks, not more geometry' — and at
    // set scale row 6 needs it just as badly: a 0.45-u trunk under bare Lambert is a
    // continuous gradient that swallows every albedo streak the bake can carry, and no
    // amount of texture contrast beats it. Two drawn marks do, for two segments.
    // The push has to CLEAR the trunk: a mark on the axis pushed 0.14 toward the camera
    // is still buried 0.09 u inside a 0.225-r cylinder and never draws (pass 4 shipped
    // exactly that and the streaks were simply absent).
    for (const f of [-0.42, 0.34]) {
      const [run] = trunkSideRuns(t.x, t.z, t.rb * f, t.rt * f * 0.8, t.rb * 0.9, ty * 0.94, dx, dz, t.rb * 1.25);
      bag.add(run, 'faint', 'paint'); // ONE per offset — a pair at 'faint' is a hatch
    }
    // THE DRAWN HALF beyond the tier field. Row 6's Prep column gives only "tier 3–4
    // plus the tapering side strokes", which under the curtain is a grey stick with two
    // edges — the drain reveals nothing the paint did not already say. The root flare
    // is the one mark that fixes it, and it is not a new vocabulary word: it is row 7's
    // "2 side contours at 'form'" applied where a trunk enters the ground, which is the
    // only place a trunk has a form change to draw.
    bag.add(
      arcPts(t.x, t.rb * 0.5, t.z, t.rb * 2.1, t.rb * 1.05, 1.06 * Math.PI, 1.94 * Math.PI, 0.1),
      'form',
      'prep',
    );
  }

  // Two limbs off the old oak — a limb is bark too, and it is where the grain has to
  // TURN. dir is per merged mesh, so the turn has to come from the UV and the form,
  // never from a second stroke family (C4: a directional grain is a fact of the bake,
  // a stroke family is a fact of the sheet).
  parts.push(trunkGeom(0.045, 0.085, 1.05, -1.02, 1.62, -0.32, 1.02, 0.5));
  parts.push(trunkGeom(0.04, 0.072, 0.86, -1.08, 2.04, -0.38, -0.86, 2.35));

  // The leaning post — row 6 says "every trunk, limb and post", and a post is the one
  // piece of this class that was never alive, so it is the reference the trunks are
  // read against.
  parts.push(trunkGeom(0.062, 0.07, 1.28, -2.15, 0, 0.85, 0.19, 0.6));
  {
    const [dx, ty, dz] = leanTip(1.28, 0.19, 0.6);
    for (const run of trunkSideRuns(-2.15, 0.85, 0.078, 0.062, 0.02, ty, dx, dz)) bag.add(run, 'form', 'paint');
  }

  // The cut stump: roughened so the tiers ride displacement rather than parallel bands,
  // with a committed cap at timberDark. Its cut face is the one place in the class where
  // the grain is seen end-on, and it is drawn as a mark, not painted as rings (§11.2
  // S6 note: "the old stump's rings are painted").
  {
    const x = 0.05;
    const z = 1.35;
    const body = roughen(new THREE.CylinderGeometry(0.235, 0.275, 0.44, 13, 1, false), 0.022, 6, 21);
    parts.push(placed(body, x, 0.22, z));
    for (const run of trunkSideRuns(x, z, 0.285, 0.245, 0.02, 0.44)) bag.add(run, 'form', 'paint');
    bag.add(arcPts(x, 0.45, z, 0.235, 0.09, 0, 2 * Math.PI, 0.06, 22), 'form', 'paint');
    bag.add(arcPts(x, 0.45, z, 0.12, 0.046, 0.2, 2 * Math.PI + 0.2, 0.08, 18), 'form', 'prep');
    // ============ FIX ROUND — ITEM 28: THE CUT FACE ==========================
    // "The cut stump top drains to a SOLID BLACK DISC — a blot rather than a drawing.
    // It needs a committed lighter cap value so a cut reads as a cut."
    //
    // It was the cylinder's own cap sharing the trunk's material, so it took `timber` t3
    // through the bark tile — and a cap sampled near the tile's dark streaks quantizes
    // to the bottom drawn tier over its whole area, which is a blot by construction. A
    // cut face is NOT bark: it is the inside of the wood, always lighter than the
    // outside, and here it is a separate disc at `mix(timber, flameCore, 0.45)` — a
    // committed t2 — so the drawn state has two tiers to put a ring between and the cut
    // reads as a cut in both rigs.
    const cap = new THREE.Mesh(
      (() => {
        const c = new THREE.CircleGeometry(0.238, 16);
        c.rotateX(-Math.PI / 2);
        c.translate(x, 0.442, z);
        return c;
      })(),
      createTrilayer({ color: mixHex(P.timber, P.flameCore, 0.45), wear: 0.24, stroke: { dir: 1.35, sheet: true } }),
    );
    cap.receiveShadow = true;
    g.add(cap);
  }

  // ---- one geometry, one material -------------------------------------------------
  // dir 1.35 — the family's base rung, along the grain. The merge is what bans the
  // per-trunk (seed%3)·0.05 spread; §11.2 row 6 writes the spread for unmerged trunks
  // and the film merges them per island, so the spread lives BETWEEN islands.
  // POSTER 0, AS ROW 6 SAYS — tested against poster 5 and the row wins. At set scale a
  // 0.45-u trunk under bare Lambert reads as a polished dowel, so poster 5 was tried to
  // buy committed tiers; it bought ONE hard vertical edge and it swallowed the grain,
  // because the quantizer works on the composed lit luminance and the streaks' own
  // contrast is smaller than a step. The tiers had to come from the ALBEDO instead, and
  // they do: bakeBark's circumferential value band (foliageKit) puts a lit side, a mid
  // and a shade side around every trunk in the film for the price of a gradient.
  const mat = createTrilayer({
    color: bark ? 0xffffff : P.timber,
    wear: 0.22,
    poster: 0,
    stroke: { dir: 1.35, sheet: true },
  });
  if (bark) mat.map = bark;

  const mesh = new THREE.Mesh(merged(parts), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh, bag.build());
  return g;
}
