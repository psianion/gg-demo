# Good Goblin — story site

The brand story site for Good Goblin: a scroll-driven animated short that introduces the product before the closed beta, ending on the game board itself with no cut.

- `story/` — the site (Vite + React + Three.js/react-three-fiber + GSAP ScrollTrigger + Lenis)
- `docs/story.md` — the film script
- `docs/art-direction.md` — the visual grammar (normal world vs. behind the curtain)
- `docs/plan.md` — stack decision, architecture, build order, current status
- `docs/skeleton-spec.md` — the implementation contract for the current pencil-skeleton milestone

## Run

```
cd story
npm install
npm run dev     # http://localhost:5180
```

`npm run build` type-checks and bundles.

## Current state

Milestone 1+2 (pencil skeleton) is complete: the entire film — every chapter, camera move, freeze, and transition — plays as black line-work on paper, scrubbed by scroll. No color, no textures yet; that is deliberate. Next step is pacing/camera review, then the art pass. See `docs/plan.md`.
