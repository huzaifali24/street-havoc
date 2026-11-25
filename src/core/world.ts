// World-space constants and the responsive camera math (docs/TECH_SPEC.md "Responsive camera").
// World units: stage art is authored at 1 art px = 2 world px, fighters too.

export const ART_SCALE = 2;
export const STAGE_W = 2400;
export const STAGE_H = 1400;
export const FLOOR_Y = 900;            // fighters' feet line

/** Gameplay-critical vertical band: plank floor + tallest fighter + jump apex headroom. */
export const BAND_TOP = 480;
export const BAND_BOTTOM = 940;        // front edge of the plank floor

/** Screen-space placement of that band: under the HUD bars, above the touch-control strip. */
export const BAND_SCREEN_TOP = 0.14;
export const BAND_SCREEN_BOTTOM = 0.78; // touch controls live in the bottom 22%

/** Minimum world width always visible (fighters' max separation + margins fit inside). */
export const MIN_VIEW_W = 1100;
export const MAX_SEPARATION = 860;
export const WALL_MARGIN = 60;

export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;

export interface ViewLayout {
  zoom: number;
  viewW: number; viewH: number;   // world units visible
  centerY: number;                // world y at the camera's vertical centre
}

/**
 * Pick a uniform zoom so that (a) the gameplay band fits between BAND_SCREEN_TOP and
 * BAND_SCREEN_BOTTOM, and (b) at least MIN_VIEW_W world units are visible horizontally.
 * Extra space on wide screens reveals more stage sideways; on squarer (tablet) screens it
 * reveals more sky above. Never stretches: one zoom for both axes.
 */
export function computeView(screenW: number, screenH: number): ViewLayout {
  const zBand = ((BAND_SCREEN_BOTTOM - BAND_SCREEN_TOP) * screenH) / (BAND_BOTTOM - BAND_TOP);
  const zWidth = screenW / MIN_VIEW_W;
  let zoom = Math.min(zBand, zWidth);
  // never show beyond the authored stage art
  zoom = Math.max(zoom, screenW / STAGE_W, screenH / STAGE_H);
  const viewW = screenW / zoom, viewH = screenH / zoom;
  let centerY = BAND_BOTTOM - (BAND_SCREEN_BOTTOM - 0.5) * viewH;
  centerY = Math.max(viewH / 2, Math.min(STAGE_H - viewH / 2, centerY));
  return { zoom, viewW, viewH, centerY };
}

export function cameraCenterX(midX: number, viewW: number): number {
  return Math.max(viewW / 2, Math.min(STAGE_W - viewW / 2, midX));
}
