# Required assets — Street Havoc 16 (Milestone 1)

Every image the game loads is listed here. **All current files are procedurally generated
placeholders** (`npm run art`, source in `tools/art/`). They're consistent and readable, but
they aren't final hand-made pixel art. Replace any file in place with final art of the
**same pixel size and frame count** and the game picks it up with no code changes.

Source of truth in code: `src/assets/manifest.ts` (paths and sizes) and
`src/fighters/kessa.ts` / `src/fighters/brom.ts` (frame counts, timing, hitboxes).
At boot the game checks every file's dimensions against the manifest and logs any mismatch.
`npm run qa` fails if this document and the manifest disagree.

## Global rules

- **Format:** PNG, 32-bit RGBA, transparent background (except opaque stage layers noted below).
- **Pixel art, no smoothing.** The game renders nearest-neighbour. All sprites and stage layers are
  drawn at **2× world scale**, so 1 art pixel = 2 world units. Don't pre-scale the art.
- **Sprite sheets** are a single horizontal strip: frame *i* occupies `x = i × frameWidth`, `y = 0`.
- **Fighter frames are 128×128.** The **anchor is (64, 124)**: feet rest on row 124, centred on
  column 64, in every frame. Characters face **right** (the game mirrors them).
- **Silhouette height:** the standing character should fill about 70–85% of the frame height.
  The placeholders measure about 106 px (Kessa) and about 99 px (Brom).
- **Palette:** 12–20 colours per character, no gradients beyond 2–3 step shading bands.
  Kessa uses cyan/electric blue, yellow-white trim and navy shadows. Brom uses iron-red/burnt
  orange, charcoal straps/boots and ember-orange seams (accent only).
- **Hurtboxes are automatic.** They're fitted to the opaque pixels of each frame at load time
  (upper and lower body box), so they follow new art.
- **Hitboxes are authored data.** If a new attack frame moves the striking limb, update that
  frame's `hitboxes` entry in `kessa.ts` / `brom.ts` (art-pixel coordinates relative to the anchor,
  facing right). Check it with the overlay (F2 in dev builds).
- **Changing a frame count** means editing `frames`, `ticks` (and for attacks `phases`,
  `hitboxes`, `advance`) in the fighter config. That's data only, no logic changes.
  The game reports a mismatch at boot if the PNG width doesn't equal frames × 128.

## Fighter sprite sheets — Kessa "Voltfist" Reyes (`assets/sprites/kessa/`)

| File | Size (px) | Frames | Frame timing (ticks @60 Hz) | Notes |
|---|---|---|---|---|
| `sprites/kessa/idle.png` | 768x128 | 6 | 8,7,7,8,7,7 (loop) | confident weight-shift bounce |
| `sprites/kessa/walk.png` | 1024x128 | 8 | 5 each (loop) | fighting-stance shuffle, used forward and back |
| `sprites/kessa/jump.png` | 384x128 | 3 | picked by velocity | 0 rise · 1 apex (floaty) · 2 fall |
| `sprites/kessa/land.png` | 128x128 | 1 | 3 | landing crouch |
| `sprites/kessa/light.png` | 640x128 | 5 | 3,2,3,4,5 | **Snap Kick**: W W **I** R R (low kick) |
| `sprites/kessa/heavy.png` | 896x128 | 7 | 4,4,3,3,3,6,8 | **Rising Spin**: W W W **I I** R R (heel kick at chest/head height) |
| `sprites/kessa/special.png` | 1024x128 | 8 | 4,4,4,3,3,5,6,7 | **Volt Arc**: W W W **I I** R R R (arm sweep; arc is a separate VFX) |
| `sprites/kessa/hurt.png` | 384x128 | 3 | game-driven | 0 light flinch · 1 heavy recoil · 2 recovering |
| `sprites/kessa/defeat.png` | 640x128 | 5 | 8,8,8,10,hold | collapse to one knee (last frame held) |
| `sprites/kessa/win.png` | 512x128 | 4 | 8,8,10,hold | cocky finger-point |

## Fighter sprite sheets — Brom Hatch (`assets/sprites/brom/`)

| File | Size (px) | Frames | Frame timing (ticks @60 Hz) | Notes |
|---|---|---|---|---|
| `sprites/brom/idle.png` | 512x128 | 4 | 14,12,14,12 (loop) | heavy, slow breathing sway |
| `sprites/brom/walk.png` | 768x128 | 6 | 7 each (loop) | plodding, visible weight |
| `sprites/brom/jump.png` | 384x128 | 3 | picked by velocity | 0 rise · 1 apex · 2 fall (short hop) |
| `sprites/brom/land.png` | 128x128 | 1 | 9 | heavy landing squash (dust VFX spawns) |
| `sprites/brom/light.png` | 640x128 | 5 | 3,3,3,4,6 | **Hook**: W W **I** R R (quick short jab) |
| `sprites/brom/heavy.png` | 896x128 | 7 | 7,7,8,4,3,16,14 | **Anvil Drop**: W W W **I I** R R (big overhead wind-up, long recovery) |
| `sprites/brom/special.png` | 1152x128 | 9 | 5,5,5,4,4,4,9,10,10 | **Forge Quake**: crouch, hop, apex, stomp (W×4), **I I** stomp impact, R R R. The hop is drawn inside the frame (feet stay near row 124 except frames 1–3). |
| `sprites/brom/hurt.png` | 384x128 | 3 | game-driven | 0 barely-staggers (light hits) · 1 real flinch · 2 recovering |
| `sprites/brom/defeat.png` | 640x128 | 5 | 12,12,12,12,hold | slow topple backwards (last frame lying, held) |
| `sprites/brom/win.png` | 512x128 | 4 | 16,12,30,hold | arms folded, slow single nod |

W = wind-up (no hitbox), **I** = impact (hitbox active, 2–3 tick hit-stop on connect),
R = recovery (vulnerable). Hit-react frames are chosen by the game: hit weight picks the frames,
and how far through the stun picks which one shows.

## VFX sheets (`assets/sprites/vfx/`)

| File | Size (px) | Frames | Frame size | Origin | Notes |
|---|---|---|---|---|---|
| `sprites/vfx/hit_spark_volt.png` | 192x48 | 4 | 48×48 | centre | Kessa's small electric hit spark. Keep it restrained. |
| `sprites/vfx/hit_spark_ember.png` | 192x48 | 4 | 48×48 | centre | Brom's ember impact burst |
| `sprites/vfx/volt_arc.png` | 480x96 | 5 | 96×96 | left-centre (0, 48) | Volt Arc swipe. Spawned at Kessa anchor +(18, −70) art px. Must stay close/mid range (about 70 art px reach), never a full-screen projectile. |
| `sprites/vfx/quake_wave.png` | 1152x64 | 6 | 192×64 | bottom-centre | Forge Quake local ground shockwave. Spawned at Brom anchor +(24, 0). Keep it small and local. |
| `sprites/vfx/dust.png` | 256x32 | 4 | 64×32 | bottom-centre | landing dust (Brom) |

## Stage — Scrapyard Docks at Dusk (`assets/stage/scrapyard_docks/`)

World layout (world units = 2× art px): the stage is 2400×1400 world, which is
**1200×700 art px**. Landmarks in art-pixel rows, the same for every full-size layer:
the horizon is at about **y 392**, the plank floor covers **y 420–470**, and the
fighters' feet line is **y 450**. The bottom of the screen (below art y about 470)
sits under the touch controls, so keep gameplay-relevant detail out of it.

| File | Size (px) | Parallax | Opaque? | Notes |
|---|---|---|---|---|
| `stage/scrapyard_docks/sky.png` | 1200x700 | 0.10 | **fully opaque** | Dusk sky: deep indigo top, warm orange at the horizon, low sun, clouds. Must fill the whole image. Extra sky shows on 4:3 tablets. |
| `stage/scrapyard_docks/far.png` | 1200x700 | 0.35 | transparent above the far quay | Distant gantry cranes, far quay silhouettes and the ship on the horizon, plus the sea from y 392 down. **Keep the quay band (about y 300–392) dark**: it sits behind the fighters' torsos and gives both palettes their contrast. |
| `stage/scrapyard_docks/mid.png` | 1200x700 | 1.00 (fighting plane) | opaque from y 404 down; containers and crane legs at the sides | Wooden dock planks (y 420–470) as a clean horizontal band in **desaturated grey-violet**. Avoid orange (fights Brom) and cyan/blue (fights Kessa). Containers and a crane leg frame each side; pilings and water below. |
| `stage/scrapyard_docks/fg.png` | 1400x110 | 1.15 | transparent | Chain-link fence strip with crate/barrel silhouettes. Placed at world y 990 (below the floor), so it never crosses the fighters. Must stay at least 1400 px wide to cover the faster parallax. |
| `stage/scrapyard_docks/gull.png` | 32x12 | ~0.25 (sprite) | transparent | 2 frames of 16×12, wings up/down. Ambient sky gulls. |

**Coverage (no seams):** the full-size layers are sized so their edges are never visible at
any camera position or zoom used in play, from 4:3 to about 21:9. Wider or taller art is fine
(it's centred), but narrower art will show seams. The game measures coverage every frame,
and `npm run qa` sweeps every camera position at nine aspect ratios.

## UI

| File | Size (px) | Notes |
|---|---|---|
| `ui/font_7x9.png` | 112x27 | Arcade bitmap font: 7×9 cells, 16 per row. Character order is `" !'-.:/?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"`. Glyphs are white with a 1 px dark outline (the game tints them). |

Health bars, timer, round pips, touch controls, shadows and the debug overlay are drawn
in code (vector graphics), so they have no image assets.
