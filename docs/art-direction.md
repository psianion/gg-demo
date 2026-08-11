# Art direction — the visual grammar

The film has exactly two visual states. The contrast between them is not "the style" — it is storytelling language, used only when we're allowed to see the goblin's hidden work. Restraint is the rule: if the effect were everywhere, it would mean nothing.

## Normal World

Events as everyone else experiences them:

- Fully painted world
- Rich colors
- Motion everywhere — wind, fire, leaves
- NPCs, adventurers, a living world

This is reality.

## Behind the Curtain

The instant we're allowed into the goblin's secret:

**Time freezes.** Not with a magical explosion. Just… silence. The music drops away. Leaves stop mid-air. Fire stops flickering. Smoke hangs perfectly still. Birds freeze in flight.

**The world desaturates into graphite, ink, and parchment.**

**Only the Good Goblin remains in full color.**

Then whatever he touches regains color — not because he's painting it, but because we're witnessing the one thing that's still alive while the rest of reality is paused.

The audience immediately understands: *we're seeing something we're not normally allowed to see.*

## The grammar applied

**Campfire.** Living world → time freezes → everything becomes ink → goblin walks in → touches the lantern → lantern glows warm orange → campfire lights → he leaves → snap, time resumes → adventurers arrive a second later.

**Tavern.** People laughing → freeze → black & white → goblin hangs the tavern sign → the sign gains color → lanterns illuminate → freeze ends → patrons walk in naturally.

**Dice (the centerpiece).** DM rolls → natural 1 → *tick* → absolute silence, graphite world, the die still wobbling slightly → the goblin strolls in, looks at the die, looks at us, shrugs → the tiniest nudge → the die rolls on → he dusts off his hands and walks away → it lands on 20 → time resumes → the cheer finishes naturally, as though nobody noticed. Tonally: the audience knows time stopped, the characters don't (Spider-Verse / Puss in Boots: The Last Wish energy).

## Technical reading of the grammar

- The freeze is a **clock**, not an effect: all ambient motion (fire, leaves, smoke, birds) runs off one world clock; freezing is that clock stopping. The goblin runs on his own clock that never stops — he is alive behind the curtain by construction. (Both clocks already exist in the skeleton.)
- The graphite/ink/parchment state is a **single post-process pass** shared by every scene — desaturation to a graphite ramp, parchment paper texture, ink-edge emphasis — gated by a mask. The goblin and everything he touches write into the mask and keep/regain full color through soft expanding reveals.
- One set of painted art per scene. The ink state is computed, never a second set of assets.

## Current milestone note

The skeleton in this repo is deliberately **pre-color**: the entire film is black pencil line-work on paper (white-fill meshes with dark edge lines, ray-bursts as the pencil symbol for light). Structure, pacing, and camera get locked first; texture, detail, and color come after. When the art pass lands, the pencil look does not disappear — it becomes the Behind-the-Curtain state, and the Normal World gets painted on top.
