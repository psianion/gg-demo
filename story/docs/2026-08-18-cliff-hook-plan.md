# Cliff hook — restaged opening + bookend (2026-08-18)

New cold open: the goblin/adventurer fight has already happened. The last goblin
watches the party from the cliff rim while they hurl attacks at him; on
"…and one goblin always gets away." he leaps off the far side. Cut: he gets up,
dusts off, "That was me." — then the film continues unchanged. At C6 he returns
to the *same* cliff, now tended clean of battle remains, and looks down to
reveal the map (existing flatten/board ending, untouched).

## Scope rails

- Everything fits t0–16.5 plus a C6 dressing pass at t57.5. No retiming of
  t16.5–57.5 or the ending. Exit state at t16.5 (goblin pos/pose feeding C2)
  must match current behaviour exactly.
- All captions unchanged (`App.tsx` CAPTIONS). DM voice = existing open1/open2.
- Cliff = the existing `buildCliffWorld` cliff at world x=120. Opening cameras
  point there; ambush set stays hidden (unused by the new open, not deleted).
- Mini world / die2 / board stay C6-only (`onlyFor` as today).
- Art rules: silhouette-first, hatching never gradient, light as grey strokes
  never glow, palette tokens only, `sketch()`/`blobs()` for all solids,
  shell pass opt-in only where the camera reads it. Gait owns its channels —
  `puppet.check.ts` must pass.

## Shot list (C1 restaged, t0–16.5)

- S1 t0–4 — blackout. cap open1 "Every campaign begins the same way…" (as-is).
- S2 t4–7.5 — WIDE from low behind the party (3 ambush adventurers repositioned
  at the cliff's front base): battle remains mid-ground (dropped kit, arrows in
  dirt, scorch hatch), cliff rising, lone goblin silhouette on the rim.
  Wizard bolt = bright stroke arcing up (curveLine + ray-burst impact near rim);
  1–2 arrows thunk into the face. Goblin flinch (peek-style duck) on impact.
- S3 t7.5–9.5 — CUT to cliff-top medium: goblin at rim, glances down (look),
  impacts burst at the rim. cap open2 "…and one goblin always gets away." ~t8.
  He turns and leaps off the BACK side — hand-authored position arc (no jump
  primitive exists; same technique as the t36 stage hop), drops out of frame.
- S4 t9.5–10.2 — CUT to cliff base, back side: goblin crumpled in a small dust
  hatch puff. The cut hides the landing.
- S5 t10.2–16.5 — he pushes up (weightShift/settle), `dustOff` (existing,
  currently unused), looks at camera → drain/freeze + push-in (relocated freeze
  grammar) → me1 "That was me." (10.8) … me4 "Straight to work." (15.6).

## C6 redress (t57.5–58.5)

Same cliff, tended: remains hidden; cairn of stacked talus + three mushrooms
(art bible: caps in threes) at the rim, visible in the over-shoulder foreground
before the camera rises. Remains must be placed where BOTH the opening shots and
the C6 over-shoulder frame can see them (rim arrows, rim scorch, top talus), so
the "fixed" read lands. Everything after the rise (flatten, throw, board,
endcard) untouched.

## Build steps (agents)

1. world.ts: `remains` + `tended` prop groups at the cliff, projectile kit
   (bolt stroke, arrows, impact bursts — hidden by default, timeline-driven),
   minimal party attack read (lean/rotation, from-behind framing — no new rig
   unless adventurer arms are already articulated).
2. timeline.ts: restage t0–16.5 per shot list; C6 redress; verify t16.5 and
   t57.5 handoff states; scrub-reversible throughout (tl.to/tl.set only).
3. Build + typecheck + puppet check; screenshot key beats in Chrome.
4. Opus impeccable/art-bible review; adjudicate; present frames.

Noted alternative (not built): freeze mid-fall and deliver the four lines
frozen in the air — stronger cut, but the user's script says get-up first;
revisit only if the dust-off staging feels flat on review.
