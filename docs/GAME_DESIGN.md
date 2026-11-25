# Game Design — Vertical Slice

## Milestone 1 scope (do not exceed this yet)
- 1 stage: **Scrapyard Docks at Dusk**
- 2 fighters: **Kessa "Voltfist" Reyes** and **Brom Hatch**
- Full move sets for both (listed below), working collision, a simple
  best-of-3-rounds local 2-player (or vs CPU-stub) match loop.
- Nothing else. No character select screen beyond a minimal stub, no story
  mode, no extra stages.

---

## Fighter 1 — Kessa "Voltfist" Reyes
**Archetype:** fast rushdown striker.
**Silhouette:** tall, lean, narrow frame, long limbs, low fighting stance,
ponytail/hair trail that whips during movement (reads as "fast" even in a
static frame).
**Colors:** cyan/electric-blue bodysuit, yellow-white trim and glove/boot
highlights, dark navy shadows. High contrast, cool palette.
**Personality:** cocky, energetic, show-off. Idle pose has a confident
weight-shift; taunts with a quick finger-point on round win.
**Fighting style:** capoeira-influenced kickboxing with electric-energy
flourishes on hits (small spark VFX, not full lightning bolts).

Move list:
| Input      | Name          | Notes |
|------------|---------------|-------|
| Idle       | —             | subtle bounce, 4–6 frames |
| Walk       | —             | 6–8 frame cycle, forward/back |
| Jump       | —             | rises fast, floaty apex, fast fall |
| Light atk  | "Snap Kick"   | fast low kick, short range, quick recovery |
| Heavy atk  | "Rising Spin" | spinning heel kick, slower, knocks back |
| Special    | "Volt Arc"    | short-range arcing energy swipe in front of her (NOT a full-screen fireball — keep it a close/mid-range tool so it reads as original) |
| Hit react  | —             | 2–3 frame flinch per hit, direction-aware |
| Defeat     | —             | collapse to one knee, 4–5 frames |

## Fighter 2 — Brom Hatch
**Archetype:** heavy grappler/zoner.
**Silhouette:** short-ish but very wide, slab shoulders, thick forearms,
wide stable stance, heavy boots. Reads as "slow but hits hard" in silhouette
alone — the opposite shape language from Kessa.
**Colors:** burnt orange/iron-red torso, charcoal-black straps and boots,
glowing ember-orange seams (like heated metal) as accent, not full-body glow.
Warm palette, low saturation except the ember accents.
**Personality:** stoic, grounded, economical — no showboating, deliberate
movements, a slow single nod on round win.
**Fighting style:** forge-and-anvil brawler: slow heavy hits, short-range
grapple-flavored heavy attack, ground-shockwave special.

Move list:
| Input      | Name           | Notes |
|------------|----------------|-------|
| Idle       | —              | heavy, slow breathing sway, 4 frames |
| Walk       | —              | plodding 6-frame cycle, visible weight |
| Jump       | —              | short hop, heavy landing (small dust/impact frame) |
| Light atk  | "Hook"         | short jab, surprisingly quick for his size |
| Heavy atk  | "Anvil Drop"   | big wind-up overhead smash, long recovery, big reward |
| Special    | "Forge Quake"  | short hop + ground stomp, small local shockwave hitbox, not a full-screen effect |
| Hit react  | —              | barely staggers on light hits, real flinch on heavy hits (weight-appropriate reactions) |
| Defeat     | —              | slow topple, 4–5 frames |

**Why these two:** opposite silhouettes (tall/narrow vs short/wide), opposite
palettes (cool electric vs warm ember), opposite pacing (fast/low-reward vs
slow/high-reward), opposite personalities (showy vs stoic). This is the
contrast the brief asked for — don't drift them closer together later.

---

## Shared fighter technical spec
- **Canvas per frame:** author at 128×128px per frame (power-of-two, easy to
  pack into a sprite sheet), character silhouette should fill roughly
  70–85% of frame height so fighters read clearly on a phone screen without
  dominating the stage.
- **In-world height:** tune so a standing fighter is ~28–32% of the visible
  stage height on a 16:9 phone framing — large enough to read attacks, small
  enough that two fighters plus some stage is always visible.
- **Palette:** 12–20 colors per character (Genesis-era discipline), no
  photographic textures, no gradients beyond simple 2–3 step shading bands.
- **Animation frame counts** (initial pass, can refine): idle 4–6, walk 6–8,
  jump 3 (rise/apex/fall), light attack 4–5 (wind-up/impact/recovery), heavy
  attack 6–7 (longer wind-up), special 7–9, hit react 2–3, defeat 4–5.
- **Attack timing contract:** every attack must have at minimum 1 wind-up
  frame (no hitbox), 1 impact frame (hitbox active, hit-stop/freeze-frame of
  1–3 game-ticks on connect), and 1+ recovery frames (no hitbox, fighter is
  vulnerable). Never go straight from idle to an active hitbox with zero
  wind-up.
- **State machine:** `Idle → Walk → Jump`, and from any grounded state into
  `LightAttack | HeavyAttack | Special`, which lock out movement/other
  attacks until recovery completes, then return to `Idle`. `Hurt` can
  interrupt any state except another `Hurt`'s invulnerable tail frame (brief
  i-frames right after a hit react so hits can't infinite-combo-lock on a
  stub AI). `Defeat` is terminal for the round.
- **Hit/hurtboxes:** separate hurtbox (vulnerable area, roughly matches
  silhouette) from hitbox (damage area, only exists during the attack's
  active frames). Build a debug overlay toggle to draw both as outlines —
  required for testing, strip or hide behind a flag for the "polished"
  build.
- **Hit reactions:** on hit, apply a brief hit-stop (freeze both fighters
  2–3 ticks), push the defender back slightly, play their directional hit
  react frame(s), spawn one small restrained impact VFX (a few particles /
  a short flash), not a screen-filling effect.

---

## Stage — Scrapyard Docks at Dusk
Industrial dockyard, dusk lighting, warm orange sky fading to deep blue/purple.
- **Foreground (in front of fighters, non-blocking):** thin chain-link fence
  strip and scattered crates/barrels silhouettes along the very bottom/side
  edges only — must never cross over the fighters' torso height.
- **Midground (fighting plane):** wooden dock planks as the floor, shipping
  containers and a crane leg or two framing the sides.
- **Background (furthest, slowest parallax):** shipping cranes, distant
  ships, dusk sky gradient with a few gulls/clouds.
- Parallax: background moves slowest, midground moves with camera 1:1
  (it's the floor fighters stand on), foreground (if any) moves slightly
  faster than camera — kept subtle, see `docs/TECH_SPEC.md` for the
  no-seam/no-gap rule.
- Keep the floor a clean, uncluttered horizontal band with strong
  value-contrast against both fighter palettes (cyan character and
  ember-orange character both need to read against it — avoid orange-heavy
  midground floor colors that fight with Brom's palette, and avoid cyan/blue
  floor colors that fight with Kessa's).
