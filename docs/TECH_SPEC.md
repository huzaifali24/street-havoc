# Tech Spec — Stack, Structure, Responsive Rules

## Stack
- **Engine:** Phaser 3 (TypeScript) + Vite dev server.
  Why: runs in a normal browser, so you (Claude Code) can start a dev
  server and screenshot it at arbitrary viewport sizes with Playwright
  without needing a native editor GUI. Has Arcade Physics (simple, reliable
  AABB collision — good fit for hitboxes/hurtboxes). Scale Manager makes
  full-bleed responsive canvases straightforward. Mobile packaging later via
  Capacitor (don't set this up yet — not needed for the vertical slice).
- **Language:** TypeScript.
- **Testing/QA tooling:** Playwright (`npm install -D playwright` +
  `npx playwright install chromium`) for automated screenshots at the
  required viewport sizes — see `docs/TESTING.md`.

## Initial scaffold commands
```
npm create vite@latest . -- --template vanilla-ts
npm install phaser
npm install -D playwright
npx playwright install --with-deps chromium
```
(Run in this folder. If the folder isn't empty when you run `vite create`,
scaffold into a temp dir and move files in.)

## Folder structure to create
```
src/
  main.ts                 — Phaser game config, boots the game
  scenes/
    BootScene.ts           — loads assets, shows loading state
    FightScene.ts           — the actual match: stage + both fighters + HUD
  fighters/
    FighterConfig.ts        — data-driven per-character stats/move data
    FighterController.ts    — shared state machine (Idle/Walk/Jump/Attack/Hurt/Defeat)
    kessa.ts                — Kessa-specific config (speed, damage, move data)
    brom.ts                 — Brom-specific config
  stage/
    ScrapyardDocks.ts        — stage layer setup, parallax, camera bounds
  ui/
    Hud.ts                   — health bars, round indicator
    TouchControls.ts         — virtual stick + attack buttons
  debug/
    HitboxOverlay.ts          — toggleable hurtbox/hitbox outline renderer
assets/
  sprites/kessa/...            — per-animation sprite sheets (placeholder or final)
  sprites/brom/...
  stage/scrapyard_docks/...     — background/midground/foreground layer images
  REQUIRED_ASSETS.md             — exact list of every sprite/background file
                                    the code expects, with pixel dimensions,
                                    frame counts, and naming — so an artist
                                    (human or better tool) can replace
                                    placeholders without touching code.
docs/
  GAME_DESIGN.md, TECH_SPEC.md, TESTING.md (already written)
```

## Responsive camera / full-bleed rules (no black bars, no stretching)
1. Use Phaser's Scale Manager in `Phaser.Scale.RESIZE` (or `ENVELOP`) mode —
   never `FIT`, which letterboxes. The canvas must always fill the viewport.
2. Define a **gameplay-critical vertical band**: floor + both fighters' full
   height + a small headroom margin for jumps. This band must be visible on
   every supported aspect ratio without cropping.
3. Author background art wider than the narrowest supported aspect ratio
   needs, and taller than the widest (tallest) phone needs, i.e. with bleed
   margin on all sides, so that on a very wide/short viewport (tablet ~4:3)
   you reveal more horizontal background, and on a very tall/narrow viewport
   (~19.5:9 phone) you reveal more vertical sky/floor depth — but the
   gameplay-critical band (rule 2) is always inside the visible area on
   every ratio. Do the cropping by adjusting camera viewport/zoom per
   aspect-ratio bucket, not by stretching the art.
4. Three aspect-ratio buckets to explicitly support and test:
   - ~16:9 (e.g. 1280×720)
   - ~19.5:9 (e.g. 844×390 landscape, i.e. a tall phone rotated)
   - tablet landscape (~4:3 or ~16:10, e.g. 1200×840 / 1280×800)
5. Pixel art must never be stretched/scaled non-uniformly. Scale sprites by
   integer-ish factors where possible (or at least uniform X/Y scale) so
   proportions stay correct; let the camera zoom handle fitting more/less
   of the world, not per-axis sprite stretching.
6. No seams: parallax layers must tile or be authored wide enough that their
   edges never become visible at any supported camera position/zoom used
   in gameplay. If a layer can run out of coverage at the extremes, make it
   wider or disable parallax on it rather than risk a seam.

## HUD / touch control safe areas
- Health bars: pinned to top-left/top-right with a margin of at least 4% of
  screen width/height from the edge (clears notches/rounded corners on
  19.5:9 phones).
- Virtual stick (bottom-left) and attack buttons (bottom-right): confined to
  the bottom ~18–22% of screen height, and must never overlap the
  gameplay-critical vertical band from the camera rules above. Verify this
  explicitly on the 19.5:9 bucket, where vertical space is tightest.
- None of the HUD may cover a fighter or the floor during normal standing
  play on any of the three test buckets.
