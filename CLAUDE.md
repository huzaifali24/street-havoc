# Street Havoc — Project Instructions

This file is read automatically by Claude Code at the start of every session in
this repo. Read it, then read everything in `docs/` before writing any code.

## What this project is
A **mobile arcade fighting game** that should feel like a polished 1990s
arcade / Sega Genesis-era fighter (think the genre, not any specific existing
game). Original characters, original art, original stage. Landscape phone and
tablet target.

## Ground rules (do not violate these)
1. **Original IP only.** No Street Fighter / Mortal Kombat / Sega characters,
   sprites, logos, music, or background art. Character and stage concepts are
   defined in `docs/GAME_DESIGN.md` — follow them, don't substitute
   recognizable existing-game designs.
2. **Vertical slice first.** Build exactly **one stage + two fighters** to a
   polished, finished-game standard before adding anything else (no roster
   expansion, no extra stages, no menus beyond what's needed to fight). See
   `docs/GAME_DESIGN.md` for milestone scope.
3. **No placeholder dressed up as final.** If you can't produce finished-quality
   art/animation with the tools available, say so explicitly, build the
   cleanest version you can, and wire assets so they can be swapped later
   without touching code (data-driven sprite/animation config — see
   `docs/TECH_SPEC.md`). Never claim visual polish or device testing you
   didn't actually verify.
4. **Full-bleed background, every aspect ratio.** No black bars, no stretched
   art, no gaps when the camera moves, on 16:9, ~19.5:9, and tablet
   (~4:3 / 16:10) landscape. Rules and math are in `docs/TECH_SPEC.md`.
5. **Test before declaring done.** Follow `docs/TESTING.md` exactly —
   including taking real screenshots at the three aspect ratios and actually
   inspecting them — before reporting a milestone complete.
6. **Report honestly.** At the end of a session, list what changed, what you
   tested (and how), and what art/assets are still needed. Don't claim
   anything you didn't verify.

## Read in this order
1. `docs/GAME_DESIGN.md` — the two fighters, the stage, animation lists,
   fighter state machine, hit/hurtbox rules.
2. `docs/TECH_SPEC.md` — engine/stack, project structure, responsive
   camera & HUD-safe-area rules.
3. `docs/TESTING.md` — what to test and how to verify it, screenshot
   procedure, end-of-session report format.

## Current status
Milestone 1 vertical slice built (Scrapyard Docks at Dusk, Kessa vs Brom, best-of-3,
CPU stub, touch + keyboard). **All art is procedurally generated placeholder art.**
Final art goes in via `assets/REQUIRED_ASSETS.md`.

Commands:
- `npm run dev`: dev server at http://localhost:5173. URL options are in `src/core/options.ts`,
  e.g. `?cpu=off` for a training dummy, `?cpu=none` for local 2P, `?hitboxes=1`.
  F2 or ` toggles the hitbox overlay.
- `npm run qa`: full automated TESTING.md pass (needs the dev server running).
  Writes screenshots and contact sheets to `tests/output/`.
- `npm run art` / `npm run art:preview`: regenerate the placeholder PNGs from `tools/art/`.
  **This overwrites `assets/`.** Don't run it after final art has been dropped in.
- `npm run typecheck`, `npm run build`.

Keys: P1 is WASD + J/K/L (also arrows + Z/X/C vs CPU). P2 in 2P mode is arrows + , . /
