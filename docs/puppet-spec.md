# Puppet spec — milestone 3

The goblin rig, the additive gait, the action vocabulary and the expression set. Written
before the pass, the way `copy-spec.md` was, so the work has something to be checked against.

## The deferral, resolved

`plan.md` defers milestone 3 on the grounds that expressiveness can only be judged against
real art. Half of that is right and half of it is blocking the wrong thing.

- **Judgement** of a face at distance does need painted art. That part stays deferred, and is
  listed under *Re-review after the art pass* below.
- **The rig** does not. It is the thing the beat sheet is already fighting, and no amount of
  painted line-work fixes a skeleton that cannot crouch. Milestone 4 replaces pencil primitives
  scene by scene; every scene it touches contains this puppet. Doing the rig second means
  restaging every one of those scenes twice.

So: the rig, the gait, the actions and the expression channels ship now. Only the aesthetic
verdict on the face waits.

## The archetype the body comes from

Not a folk helper-spirit and not an ambush raider. He is a **D&D goblin who builds the
dungeon** — the small, dextrous one whose racial kit is *Nimble Escape* and *Tinker's Lore*.
That is the whole film in two traits: he gets away in chapter 1 (`Nimble Escape`), and what he
gets away *to* is the work (`Tinker's Lore` — traps, hinges, unusual devices). The tabletop
goblin is Small, 3–4 ft, Dexterity-primary and Constitution-secondary — quick and hardy, never
strong. Artists draw the same creature at roughly **three heads tall**, big head on a wiry
frame, hunched with raised shoulders and the head carried low and forward, long pointed ears,
and hands and feet exaggerated well past human proportion.

Every one of those is a structural instruction, not a decoration:

| trait | what it does to the skeleton |
|---|---|
| 3 heads tall, big head | The head is a real mass carried *ahead of* the spine. It needs a **neck** that can swing it, not a fixed offset. Our head is 0.32 units across on a 0.9-unit body — that is a third of him, and it is currently welded to the root. |
| Hunched, shoulders raised | The hunch is his rest state, not his only state. A **pelvis / chest split** is what lets him straighten on "You're welcome" and fold back down into the work. The posture change *is* the character arc; without the split there is nothing to change. |
| Dexterity over Strength, wiry | Power comes from leverage, not bulk. Muscularly that means strong forearms, grip and calves, and no upper-arm mass to model. Practically: **wrist and ankle matter more than shoulder bulk**. |
| Nimble Escape | Crouch-and-spring is his signature move, and it is chapter 1's entire staging — hidden behind a rock, then gone. A compressed crouch needs **knee and ankle**, both. |
| Tinker's Lore | Work happens at arm's length, in front of the chest, on a specific object. The film authors **13 of these reaches** (7 props in C2, 6 montage jobs). The **elbow** is precisely what separates *working on a thing* from *touching a thing*, thirteen times. |
| Long pointed ears | Ears carry emotion at distances where brows are two pixels. On a character this small in frame, they are the primary expression channel, so they get **their own joints**. |
| Exaggerated feet | Already in the rig, and correct. A **toe pivot** is what stops the feet ice-skating on the contact frames. |

This overturns the cheap answer. Sizing joints by how many pixels they occupy would drop the
elbow; sizing them by what the character *is* keeps it, because the reach is the thing he does
most in the film. Joints are `THREE.Group`s and cost no draw calls; only the limb splits cost
geometry, and that bill is counted below.

## Skeleton

Origin at the feet, faces +z at rest, ~0.9 units tall. **Bold** = new in this pass.

```txt
root                                   timeline: position, rotation (travel + facing)
├── contact shadow
├── **pelvis**                         timeline: rotation.z (contrapposto), position.y (crouch)
│   ├── **bob**                        gait only: vertical bob + idle breath
│   ├── legL/legR .pose                timeline: base thigh angle (stance, crouch)
│   │   └── .swing                     gait only: thigh swing
│   │       └── **shin.pose/.swing**   timeline base + gait knee bend
│   │           └── **foot**           timeline: ankle; **toe** pivot for contact
│   └── **chest**                      timeline: rotation.x hunch↔straighten, .z weight shift
│       ├── torso shell, tunic, belt, collar, satchel, strap, flank hatch
│       ├── **neck** → head            timeline: neck carries the head mass; head aims
│       │   ├── nose, jaw hatch
│       │   ├── **earL/earR**          timeline: rotation.z + .x (expression)
│       │   └── brows, eyes, mouth     expression set (below)
│       └── armL/armR .pose            timeline: shoulder
│           └── .swing                 gait only: arm swing
│               └── **elbow**          timeline: forearm
│                   └── **wrist/hand** timeline: grip angle
```

Two structural changes carry the weight of the whole milestone:

1. **Head and arms move under `chest`.** Today they are siblings of the torso under `root`, so a
   lean tears him apart — the torso rotates and the head stays behind in mid-air. This is why
   every authored action so far is arms-and-head: they were the only parts that could move
   without breaking him.
2. **Legs move under `pelvis`.** A weight shift is a pelvis rotation with a counter-rotation in
   the chest. That is contrapposto, and it is the difference between standing and posing.

Reparenting changes the frame of reference for angles `timeline.ts` already authors. Local
offsets are re-derived so the **rest pose is world-identical to today's** — locked by a golden
test (below), not by eye. Existing authored angles stay valid wherever `chest` and `pelvis` are
neutral, which is everywhere they are not deliberately posed.

### What this costs

Splitting thigh/shin and forearm adds four `sketch()` solids: fill + strokes each, so **+8 draw
calls** on one character. Joint groups are free. Accepted deliberately — `site-diorama-geometry`
budgets draw calls over triangles, and eight calls buys the two things the film needs most
(a walk with knees, a reach that lands). No merging work is done here; the pencil strokes carry
per-weight `LineMaterial`s and do not merge today either.

## The additive gait — the blocker, fixed

Today `Film.tsx` writes `legL/legR.rotation.x`, both `arm.swing.rotation.x` and
`torso.position.y` **absolutely, every frame**. Tweening `speed` to 0 pins those channels at
neutral rather than releasing them, so legs and torso are unreachable from `timeline.ts`.

The fix is the pattern the rig already uses on the arms — `pose` for the timeline, `swing` for
the gait — extended to every gait-driven channel:

```txt
one channel, one owner.
gait writes ONLY into *.swing and *.bob groups, and its amplitude scales by `speed`.
timeline writes ONLY into *.pose groups and the joints it owns above.
final angle = pose (authored) + swing (gait × speed)
```

At `speed = 0` every swing group is exactly 0 and the authored pose is what you see — released,
not overridden. At `speed = 1` the gait rides on top of whatever base pose the beat set, so he
can walk *while* crouched, *while* carrying, *while* leaning.

**Idle never stops.** The gait's replacement at rest is a breath: a small `bob` rise-and-fall
plus an ear and neck micro-drift at amplitude `(1 - speed)`, driven by `gobT` — the goblin
clock, which a freeze does not stop. This is the freeze grammar's own claim, and today it is
false: during "That was me." the world freezes and *he freezes with it*, because his only motion
is a gait scaled by a speed that is zero. He is meant to be the one thing still alive in frame.

Reduced motion damps the breath to 30% along with the rest of the ambient life; it does not
stop it, for the same reason.

## Reach, solved rather than tuned

Thirteen authored reaches currently set `armR.pose.rotation.x` to a hand-tuned number per prop
(`-2.0`, `-1.45`, `-1.85`, `-2.2`, `-1.1`…), each found by eye against one prop height.

With an elbow in the chain, keep a `reachTo(goblin, worldPoint)` helper: a planar two-bone
solve (law of cosines, fixed upper/fore lengths) returning shoulder + elbow angles, which the
timeline tweens to. Roughly ten lines, deterministic, and the hand lands **on** the hinge, the
lid, the mushroom — at any prop height, including the ones the art pass will move. Out-of-reach
targets clamp to full extension, which is also the correct read: he is reaching for something
too high, and the sign board in montage 2 is exactly that.

## Action vocabulary

The pose clusters are already in `timeline.ts`, inline and unnamed — the rope pull is six
`tl.to` lines, the shrug two, the nudge three. They move to `actions.ts` as named functions that
append to the timeline. This is naming and de-duplication, not a framework: each is the same
tweens it is today, addressable by name and reusable across chapters.

```txt
walkTo(tl, g, at, dur, to, facing)   gait ramp in, travel, ramp out
crouchTo(tl, g, at, dur, amount)     pelvis drop + knees + chest fold
reachTo(tl, g, at, dur, worldPoint)  two-bone solve → shoulder/elbow/wrist
haul(tl, g, at, dur)                 planted stance, both arms, lean back onto the rear leg
stoop(tl, g, at, dur, worldPoint)    quick down-and-up: plant a tree, set a stone
lift(tl, g, at, dur)                 crouch, both hands, straighten under load
tap(tl, g, at, dur, worldPoint)      short hammer stroke from the elbow
peek(tl, g, at, dur)                 compressed crouch → head only clears cover
bolt(tl, g, at)                      spring out of the crouch into a run — Nimble Escape
shrug / wave / dustOff / nudge       the existing beats, named
settle(tl, g, at)                    return to hunch idle
look(tl, g, at, dur, worldPoint)     neck leads, head follows, ears cock
express(tl, g, at, dur, name)        the expression set
```

## Expression set

Full set, as chosen. Named poses over the face channels — brow angle and height, mouth curve
and width, ear angle, eye scale. Geometry unchanged; the pupils stay the film's only filled
black.

| name | reads as | used at |
|---|---|---|
| `neutral` | working face, brows level-inward | default, the C2 run |
| `sly` | one brow up, mouth curled, ears forward | "That was me." |
| `flat` | brows level, mouth straight, ears neutral | "I did." — the deadpan |
| `strain` | brows down and together, mouth compressed, ears back | the rope haul, the lift |
| `smug` | both brows up, wide mouth, ears high | "You're welcome.", the wave |
| `alarm` | brows high, mouth small, ears flared wide | the natural 1 |

Ears are part of every entry deliberately: at his on-screen size in the montage and the C2
follow, the ears are legible when the brows are not.

## Re-staging

Every beat below currently fakes with arms-and-head what it can now do with a body.

| t | beat | today | after |
|---|---|---|---|
| 5–6 | Peek behind the rock | root slides up 0.7 on y — he rises like a lift | `peek`: compressed crouch behind cover, head clears first, ears up, `alarm` |
| 8.5–9.5 | The bolt | speed→1, x tween | `bolt`: spring out of the crouch, first stride long, chest forward |
| 9.5–10.2 | The freeze | speed→0, he pins to neutral | halts on a planted foot, weight over the front leg, breath continues |
| 10.2–16.5 | Four to-camera lines | head.rotation.y only | `look` (neck leads), weight shift between lines, `sly` → `flat` → `smug` |
| 17–30 | C2 run, 7 props | armR angle per prop, head tilt | `reachTo` the actual prop point; a stoop for the low ones (chest, mushrooms), full extension for the high (ravens' branch); `neutral`, `strain` on the door |
| 31.5–35 | Rope pull | both arms up, root.rotation.z 0.15 | `haul`: rear leg planted, pelvis back, chest counter-rotated, `strain`, ratchet in two pulls |
| 35–36 | The wave | armR.z wiggle | turn from the hips, `smug`, ears high, weight on one leg |
| 41–45.4 | Tavern: stroll, look, shrug, nudge, dust-off | arms and head | walks in hunched, straightens to look at us, `shrug` with real shoulders, `alarm` at the 1, a crouched `nudge` with one finger, `smug` on the way out |
| 50–57.5 | Montage, 6 vignettes | one shared reach pose | six distinct jobs, below |
| 57.5–62 | Cliff | set, faces +x | stands straight for the first time in the film — the hunch releases as the camera rises |

### The six montage jobs

Each vignette gets a different body action, because six cuts of the same reach is one cut shown
six times.

| # | vignette | job |
|---|---|---|
| 0 | map table, road | draughtsman's stoop over the table, hand sweeping along the line as it grows out of it |
| 1 | monster | two-handed set-down, then a step back and both arms lowering — he plants it and lets go |
| 2 | tavern sign | reaching *up* at full extension to guide the drop onto the bracket, then a `tap` |
| 3 | three pines | three quick `stoop`s, one per tree, riding the existing 0.15 stagger |
| 4 | chest | deep `lift`: crouch, both hands under the lid, straighten as it opens |
| 5 | candles | the tightest shot and the most precise — leans in from the chest, one careful touch |

## Checks

`scripts/puppet.check.ts`, joining the existing `npm run check` (`framing`, `pencil`, `die`):

1. **Ownership.** Walk the rig; assert no joint is written by both the gait and the timeline —
   the failure this whole milestone exists to fix, made unrepeatable.
2. **Release.** Run the frame function at `speed = 0`; assert every swing/bob contribution is
   exactly 0, so an authored pose survives untouched.
3. **Breath.** Assert idle amplitude is non-zero at `speed = 0` and reads `gobT`, not `t` — he
   stays alive through a freeze.
4. **Golden rest pose.** Assert world positions of head, both hands and both feet at rest match
   today's values within 1e-6. This is the reparenting regression net.
5. **Reach.** For a sample of targets in and out of range, assert the solved hand lands within
   1e-3 of the target, or at full extension when unreachable.

Plus `npm run build` clean (tsc + vite).

## Browser walk

Six pose-critical moments at desktop, and the two closest shots re-checked at phone portrait —
where `fitFov` hits its 70° cap and the framing runs tightest:

1. the peek + bolt (chapter 1 crouch)
2. the freeze at "That was me." — breath visible, weight planted
3. one C2 reach — hand on the prop, not near it
4. the rope haul — the lean is a body, not a rotated root
5. one montage job — legible as *that* job from one frame
6. the cliff straighten

Zero console errors. Judged against `art-direction.md`, and reviewed in the order
`site-diorama-geometry` asks for: silhouette first, then structure, then accent — his silhouette
must read at a glance with the props deleted.

## Re-review after the art pass

- Face expressiveness at real on-screen size, against painted line-work rather than primitives.
- Whether ears alone carry the expression at montage distance, or the brows need to grow.
- Portrait framing of the two closest shots — `framing.ts` already flags fov-only compensation
  as a milestone 4 problem.

## Notes on the three site skills

`site-diorama-geometry`, `site-surface-value` and `site-beat-conductor` are scoped to `site/` in
the `dm-site` worktree — unlit `MeshBasicMaterial` with baked textures, inverted-hull ink
outlines, nine top-down dungeon beats. This site is pencil `LineMaterial` strokes on paper with
fog and no post pass. What transfers, and is used above: silhouette-before-detail review and
greyscale thumbnails; *detail below the occlusion line is not detail* (which is why the joint
list is argued from the character rather than from pixel counts, and why no toes are modelled);
determinism at build time (`pencil.ts` already has its seeded `rand()`); draw calls over
triangles; and the QA habit of exercising a beat in both scroll directions. The palette
contract, the unlit doctrine, the clip-plane reveal and the dual-pane split do not apply here
and are not imported.
