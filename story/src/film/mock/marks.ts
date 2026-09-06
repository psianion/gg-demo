// MOCK — Transient mark. Art bible §11.2, row 23. Author group D / mockup author 4.
//
//   http://localhost:5180/?mock=marks            beside the actual hero island
//   http://localhost:5180/?mock=marks&rig=prep   the drawn half (curtain = 1)
//   http://localhost:5180/?mock=marks&zoom=1..6
//
// THE DOCTRINE, and every line below is derived from it:
//
//   AN ATTACK HERE IS A MARK SOMEONE DREW, NOT AN EVENT SOMEONE SIMULATED.
//
//   1. A mark has ends. A particle system does not, which is why one can never be
//      authored: it has no first frame and no last.
//   2. The same object exists at every t. Nothing spawns, nothing despawns. A mark
//      that "appears" is a mark whose instanceCount ramps.
//   3. Motion is a position tween of an authored object, so a backward scrub is the
//      identical tween running the other way — the projectionist can un-fire the
//      wizard.
//
// So this module builds the S1 volley as ONE FRAME of it, every object at full ramp:
// the bolt mid-flight towing the line it is drawing, one impact (three marks landing
// together), and the landing dust. Six transient marks — which is the film's own
// ceiling for a single instant, and the reason this sheet shows six and not sixteen.
//
// FEWER, BIGGER. The instinct is eight ticks at 0.06–0.12 u; that is 2–4 px each and
// it is invisible dirt. Nothing here is ever 'faint' (0.83 px is a grey ghost).
import * as THREE from 'three';
import * as P from '../palette.ts';
import { curveLine, paint } from '../pencil.ts';
import { propGround } from './groundKit.ts';
import { createFlameMaterial } from './fire.ts';
import {
  mark,
  tick,
  mergeStrokes,
  mergeAt,
  hand,
  vp,
  VIEW_R,
  VIEW_UP,
  VIEW_CAM,
  spindleGeom,
  alongAxis,
  buildImpact,
  SPINDLE,
} from './marksKit.ts';

// The spindle geometry (row 23's "one geometry the whole attack layer is made of") and
// the impact recipe (strike + spall + flash) now live in `marksKit.ts` so this route and
// the film's `sets/kit.ts` builders share one copy — see `buildImpact`, `spindleGeom`.

export function buildMock(): THREE.Object3D {
  const root = new THREE.Group();

  const O = new THREE.Vector3(0, 0, 0);
  const flame = createFlameMaterial();

  // the volley's geometry, in the shot's view plane: the wizard is off screen left and
  // high, the rim is low and centre, the goblin lands to the right.
  const launch = vp(O, -2.05, 1.62);
  const strike = vp(O, -0.05, 0.34);
  const travel = new THREE.Vector3().subVectors(strike, launch).normalize();

  // ---- 1 · THE BOLT, 55 % of the way there --------------------------------------
  const boltTail = launch.clone().addScaledVector(travel, 1.05);
  const bolt = new THREE.Mesh(
    mergeAt([{ geom: spindleGeom(1.1, 0.055), m: alongAxis(boltTail, travel) }]),
    flame,
  );
  bolt.name = 'marks:bolt';
  bolt.renderOrder = 3;

  // ONE 'hero' contour along its upper silhouette edge only — a stroke has one lit
  // edge; two would make it a tube.
  const up = new THREE.Vector3().crossVectors(travel, VIEW_CAM).normalize();
  const boltEdge = mark(
    SPINDLE.map(([r, y]) =>
      boltTail
        .clone()
        .addScaledVector(travel, y * 1.1)
        .addScaledVector(up, r * 0.055 * 1.05)
        .addScaledVector(VIEW_CAM, 0.06),
    ),
    P.graphiteDark,
    'hero',
  );
  boltEdge.name = 'marks:boltEdge';

  // ---- 2 · THE TRAIL — and the trail IS the mark ---------------------------------
  // The bolt's read is not the head; it is the LINE the head is drawing. In the film
  // this curve's instanceCount ramps up as it flies and back down as it dies; here it
  // stands at full ramp, which is the frame the ramp is aiming at.
  // ============ FIX ROUND — ITEM 29a: PUT A HAND IN IT =====================
  // "The bolt's towed arc is a MECHANICALLY SMOOTH CURVE with no hand in it, against a
  // film whose every other line wobbles… it is the only perfectly smooth curve in the
  // film." It was: six points on an exact sine, handed to `curveLine`, which then
  // interpolates them into a Catmull-Rom that is smoother still. Every other mark in
  // this world goes through `polyline`'s wobble; `curveLine` does not, so the wobble has
  // to be authored into the POINTS. ±1.6% of the run's length, deterministic, and
  // pinned at both ends — a thrown thing wanders, but it leaves and arrives where it is
  // aimed.
  const wob = hand(0x4b19);
  const arcPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    const p = launch.clone().lerp(boltTail, t);
    const end = i === 0 || i === 5 ? 0 : 1;
    // a thrown thing sags: the bow is across the travel, in the view plane
    arcPts.push(
      p
        .addScaledVector(VIEW_UP, Math.sin(t * Math.PI) * 0.16 + (wob() - 0.5) * 0.09 * end)
        .addScaledVector(VIEW_R, (wob() - 0.5) * 0.07 * end)
        .addScaledVector(VIEW_CAM, 0.05),
    );
  }
  // WALKED — 26 curve points came back as a BEAD CHAIN, not a line: strokes() subdivides
  // every segment three ways, so 26 points over a 2.5 u arc gave 75 sub-segments of
  // ~2.7 screen px against a 3.4 px round-capped stroke. A segment shorter than its own
  // width renders as a dot. 9 points is 27 sub-segments at ~7.6 px, and it draws.
  // WALKED, and the row's second real gap: the row paints this arc "on the amber ramp",
  // but pencil.ts's line materials have NO curtain channel — a painted stroke survives
  // the drain unchanged. An amber arc therefore stands as a GLOW HUE on the fully drawn
  // black-and-white page, which is the one thing Prep may not contain. The arc is
  // graphiteDark; the amber lives in the spindle, which drains. Both states honest, and
  // in Performance it reads as the film's own grammar — a drawn contour over a painted
  // mass, which is exactly what world.ts's own buildFlames already did.
  const trail = paint(curveLine(arcPts, 'hero', 9), { line: P.graphiteDark });
  trail.name = 'marks:trail';

  // ---- 3 · THE IMPACT — three marks arriving on the same frame, via `marksKit`'s ------
  // `buildImpact` (row 23), so this route and the film's `sets/kit.ts` builders share one
  // recipe. These are the remains the S7 cliff clears, and the strike's permanence is the
  // point (fix round item 29a/29b — the flicks read as a hand, never a sparkle — already
  // live inside `buildImpact` itself).
  const inAngle = Math.atan2(travel.dot(VIEW_UP), travel.dot(VIEW_R));
  const impact = buildImpact({ angle: inAngle, material: flame });
  impact.position.copy(strike);
  impact.name = 'marks:impact';

  // ---- 4 · THE LANDING DUST — five comma ticks, not a puff -----------------------
  // The client drew this himself: action plate 5 shows short comma ticks around the
  // boots. A puff cloud is a soft volumetric and there is no soft volumetric here.
  const land = vp(O, 1.42, 0.03);
  const dust = mergeStrokes(
    ([
      [3.02, 0.24],
      [2.55, 0.17],
      [1.78, 0.14],
      [0.66, 0.19],
      [0.16, 0.25],
    ] as const).map(([a, len], i) => tick(land, a, len, P.graphiteDark, 'hero', 0.34, 0.05 + i * 0.01)),
  );
  dust.name = 'marks:dust';

  // ---- THE GROUND IT STANDS ON — the judgement's item 33 ------------------------
  // "Prove grounding… C9 is unproven for every one of them." A prop judged on bare paper
  // cannot be judged for grounding at all, so this class now builds the ordinary ground
  // card under itself and carries its own C9 ledger: one painted contact blob per prop,
  // authored at the hero's 394 texels/unit and rescaled by the card's own. Painted props
  // ground; drawings never do, which is why the blobs live in the incident card's albedo
  // and drain with it.
  root.add(propGround(2.6, 2, [[strike.x, strike.z, 118, 0.3],[land.x, land.z, 98, 0.4]]));
  root.add(bolt, boltEdge, trail, impact, dust);
  return root;
}

// ponytail: no sword swing. There is no swing in the shooting script — the swords are
// RAISED, which is the ambush's whole posture — and a smear needs a swept mark, which
// is a new mechanism for a beat that does not exist. If direction ever authors one the
// mechanism is already here: a curveLine in this same view plane, 'hero', its
// instanceCount ramping on across the swing and off behind it. One draw, zero
// materials, reverses by construction.
//
// ponytail: no arrow bodies. At S1-B3 a 0.3 u arrow is 11 px of dark stick on a dark
// field. What reads is its trail and what it leaves standing — both of which are the
// two marks already built above, at a different paint.
//
// ponytail: buildRayBurst / rays() are NOT reproduced here at any size. Rays were v1's
// word for light and every one of their uses is replaced by a spindle or a tick.
