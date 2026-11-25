# Testing & Reporting — required before calling anything "done"

Do not report a milestone complete without actually running these checks.
Don't claim a visual result or device test you didn't verify.

## Functional checks
- [ ] Both fighters can Idle/Walk/Jump and each has working Light/Heavy/
      Special attacks with visible wind-up → impact → recovery (watch it,
      don't just read the code).
- [ ] Hitbox only active during an attack's impact frame(s); hurtbox active
      otherwise. Toggle the debug overlay (`docs/TECH_SPEC.md`) and confirm
      visually that boxes line up with the sprites, not floating off them.
- [ ] Hits register reliably (no dropped/double hits), apply a brief
      hit-stop, correct knockback direction, and play the defender's hit
      react frame.
- [ ] Defeat triggers correctly at 0 HP and locks out further input.
- [ ] Controls are responsive (no noticeable input lag) on both touch
      (simulated) and keyboard input during dev testing.

## Visual/camera checks — screenshot procedure
Use Playwright against the dev server for all three buckets:
```
npx playwright screenshot --viewport-size=1280,720  http://localhost:5173 16x9.png
npx playwright screenshot --viewport-size=844,390   http://localhost:5173 19x5-9.png
npx playwright screenshot --viewport-size=1200,840  http://localhost:5173 tablet.png
```
(Adjust the dev server URL/port to whatever Vite actually prints.)

For each of the three screenshots, actually look at the image and check:
- [ ] No black bars / empty canvas edges.
- [ ] No stretched or distorted sprites (proportions look right vs. source
      art).
- [ ] Floor, both fighters, and key stage elements fully visible — nothing
      cropped off that matters for reading the fight.
- [ ] No visible seams or gaps in the parallax layers.
- [ ] Fighters clearly readable against the background (contrast check —
      if a fighter's silhouette blends into the floor/background at a
      glance, that's a fail, fix the palette or floor color).
- [ ] HUD and touch buttons don't cover a fighter or the floor.

If any check fails, fix it and re-screenshot — don't report success on a
failed check.

## End-of-session report format
Always end a work session with:
1. **What changed** — concrete list (files/features), not a restatement of
   this doc.
2. **What was tested, and how** — name the actual checks run from this file
   and what you observed (e.g. "screenshotted all 3 buckets, no black bars,
   HUD clear of fighters on all three").
3. **Art/assets still needed** — anything still placeholder-quality, with
   the exact spec from `assets/REQUIRED_ASSETS.md` so it can be swapped in
   cleanly later. Be explicit that placeholder art is not final.
4. **Anything you could not verify** (e.g. real mobile device testing,
   actual touch-screen feel) — say so plainly rather than implying it was
   checked.
