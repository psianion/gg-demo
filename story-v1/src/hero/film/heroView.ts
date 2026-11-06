// THE SHOT'S TWO ANGLES, AND NOTHING ELSE.
//
// `HERO_AZ` and `HERO_ELEV` are the camera solve's authored azimuth and elevation, and
// they are the basis every authored contour in this world is drawn in (§3.6: "contour
// marks are authored in the SHOT's view plane"). Four modules need them — `stages/hero.ts`
// itself, and the three mockup kits that lay marks in the plane the lens will see.
//
// WHY THEY LIVE IN A LEAF. They used to live in `stages/hero.ts`, which imports the
// goblin, the actions and the rig contract; the kits imported them from there, and the
// day the film's own `sets/kit.ts` started calling those kits the loop closed —
//   world.ts → sets/ambush.ts → sets/kit.ts → mock/foliageKit.ts → stages/hero.ts
//            → stages/goblin.ts → actions.ts → world.ts
// — and an import cycle through modules that do work at evaluation time hands the far
// side bindings still in their temporal dead zone. The film mounted to a blank page with
// nothing in the console. This file has NO imports, so it can never be in a cycle, and
// there is still exactly ONE definition of each number: the hero stage re-exports both,
// so every existing import of HERO_AZ from that module reads the same value it always did.
//
// No value moved. 18° and 33° are what shipped.
const DEG = Math.PI / 180;

/** The camera's azimuth off −z, radians. */
export const HERO_AZ = 18 * DEG;
/** The camera's elevation above the ground plane, radians. */
export const HERO_ELEV = 33 * DEG;
