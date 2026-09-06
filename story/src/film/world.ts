import * as THREE from 'three';
import type { Goblin, World } from './rig.ts';
import { keyNight, skyDusk } from './palette.ts';
import { buildAmbush } from './sets/ambush.ts';
import { buildPathProps } from './sets/pathProps.ts';
import { buildGround } from './sets/ground.ts';
import { buildTheatre } from './sets/theatre.ts';
import { buildTavern } from './sets/tavern.ts';
import { buildMontage } from './sets/montage.ts';
import { buildCliffWorld } from './sets/cliffWorld.ts';

// The rig contract — RIG, REST, POCKET, applyPose, setGoblinRim, the World and Goblin
// types — lives in rig.ts so the set modules below can import it without importing this
// file back. Re-exported here because every existing caller reads it from world.ts.
export * from './rig.ts';

/** `goblin` is built by `stages/goblin.ts` and handed in — see the note by the contour
 *  rule above for why this file does not import it. */
export function buildWorld(goblin: Goblin): World {
  const root = new THREE.Group();

  const ambush = buildAmbush(goblin);
  const pathProps = buildPathProps();
  const ground = buildGround();
  const theatre = buildTheatre();
  const tavern = buildTavern();
  const montage = buildMontage();
  const cliffWorld = buildCliffWorld();

  root.add(
    ambush.container,
    pathProps.container,
    ground.container,
    theatre.container,
    tavern.container,
    montage.container,
    cliffWorld.container,
  );

  return {
    root,
    look: new THREE.Vector3(0, 0.8, 0),
    // S1 opens on the night family — stepped from the beat sheet at every boundary.
    keyColor: new THREE.Color(keyNight),
    // C1 opens on sky-dusk. The chapter air, tweened by the timeline and read into the
    // CSS wash by Film.tsx; `scene.fog` stays at paper.
    air: new THREE.Color(skyDusk),
    timeScale: 1,
    t: 0,
    gobT: 0,
    goblin,

    camp: ambush.camp,
    theatreSet: theatre.container,
    tavernSet: tavern.container,
    montageSet: montage.container,
    cliffSet: cliffWorld.container,

    ambushFlames: ambush.ambushFlames,
    adventurers: ambush.adventurers,
    treeline: ambush.treeline,

    fire2Flames: pathProps.fire2Flames,
    fire2Rays: pathProps.fire2Rays,
    lanternPost: pathProps.lanternPost,
    lanternRays: pathProps.lanternRays,
    cave: pathProps.cave,
    caveDoor: pathProps.caveDoor,
    chest: pathProps.chest,
    chestLid: pathProps.chestLid,
    chestCoins: pathProps.chestCoins,
    ravens: pathProps.ravens,
    mushrooms: pathProps.mushrooms,
    signPost: pathProps.signPost,
    signBoard: pathProps.signBoard,
    tufts: ground.tufts,
    pathForestFront: ground.pathForestFront,
    pathForestMid: ground.pathForestMid,
    pathClouds: ground.pathClouds,

    stageDisc: theatre.stageDisc,
    rope: theatre.rope,

    die: tavern.die,
    dieInner: tavern.dieInner,
    dieWobble: 0,
    dieTipAngle: tavern.dieTipAngle,
    nudgeFinger: tavern.nudgeFinger,

    roadLine: montage.roadLine,
    monster: montage.monster,
    tavernSign: montage.tavernSign,
    trees5: montage.trees5,
    chest5Lid: montage.chest5Lid,
    chest5Coins: montage.chest5Coins,
    candleRays: montage.candleRays,

    miniWorld: cliffWorld.miniWorld,
    cliff: cliffWorld.cliff,
    remains: cliffWorld.remains,
    tended: cliffWorld.tended,
    party: ambush.adventurers,

    bolt: cliffWorld.bolt,
    arrows2: cliffWorld.arrows2,
    impacts: cliffWorld.impacts,

    die2: cliffWorld.die2,
    board: cliffWorld.board,
  };
}
