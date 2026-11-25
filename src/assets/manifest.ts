// Single source of truth for every image file the game loads.
// Paths are relative to assets/ (served as the web root by Vite).
// `npm run check:assets` verifies each file exists with exactly these dimensions,
// and assets/REQUIRED_ASSETS.md documents the same list for artists.
import { ANIM_KEYS, type FighterConfig } from '../fighters/FighterConfig';
import { KESSA } from '../fighters/kessa';
import { BROM } from '../fighters/brom';

export const FIGHTERS: FighterConfig[] = [KESSA, BROM];

export interface SheetAsset { key: string; path: string; frameWidth: number; frameHeight: number; frames: number }
export interface ImageAsset { key: string; path: string; width: number; height: number }

export function fighterTextureKey(id: string, anim: string): string { return `${id}_${anim}`; }

export const FIGHTER_SHEETS: SheetAsset[] = FIGHTERS.flatMap((f) =>
  ANIM_KEYS.map((a) => ({
    key: fighterTextureKey(f.id, a),
    path: `sprites/${f.id}/${a}.png`,
    frameWidth: f.frame.w, frameHeight: f.frame.h, frames: f.anims[a].frames,
  })));

export const VFX_SHEETS: SheetAsset[] = [
  { key: 'vfx_hit_spark_volt', path: 'sprites/vfx/hit_spark_volt.png', frameWidth: 48, frameHeight: 48, frames: 4 },
  { key: 'vfx_hit_spark_ember', path: 'sprites/vfx/hit_spark_ember.png', frameWidth: 48, frameHeight: 48, frames: 4 },
  { key: 'vfx_volt_arc', path: 'sprites/vfx/volt_arc.png', frameWidth: 96, frameHeight: 96, frames: 5 },
  { key: 'vfx_quake_wave', path: 'sprites/vfx/quake_wave.png', frameWidth: 192, frameHeight: 64, frames: 6 },
  { key: 'vfx_dust', path: 'sprites/vfx/dust.png', frameWidth: 64, frameHeight: 32, frames: 4 },
  { key: 'stage_gull', path: 'stage/scrapyard_docks/gull.png', frameWidth: 16, frameHeight: 12, frames: 2 },
];

/** Where each VFX sheet is anchored (origin) when spawned. */
export const VFX_ORIGINS: Record<string, [number, number]> = {
  vfx_hit_spark_volt: [0.5, 0.5],
  vfx_hit_spark_ember: [0.5, 0.5],
  vfx_volt_arc: [0, 0.5],
  vfx_quake_wave: [0.5, 1],
  vfx_dust: [0.5, 1],
};

export const STAGE_IMAGES: ImageAsset[] = [
  { key: 'stage_sky', path: 'stage/scrapyard_docks/sky.png', width: 1200, height: 700 },
  { key: 'stage_far', path: 'stage/scrapyard_docks/far.png', width: 1200, height: 700 },
  { key: 'stage_mid', path: 'stage/scrapyard_docks/mid.png', width: 1200, height: 700 },
  { key: 'stage_fg', path: 'stage/scrapyard_docks/fg.png', width: 1400, height: 110 },
];

export const UI_IMAGES: ImageAsset[] = [
  { key: 'ui_font', path: 'ui/font_7x9.png', width: 112, height: 27 },
];

export const FONT = { key: 'arcade', image: 'ui_font', cellW: 7, cellH: 9, perRow: 16, chars: " !'-.:/?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" };

export function allAssets(): { path: string; width: number; height: number; frames?: number; frameWidth?: number }[] {
  return [
    ...FIGHTER_SHEETS.map((s) => ({ path: s.path, width: s.frameWidth * s.frames, height: s.frameHeight, frames: s.frames, frameWidth: s.frameWidth })),
    ...VFX_SHEETS.map((s) => ({ path: s.path, width: s.frameWidth * s.frames, height: s.frameHeight, frames: s.frames, frameWidth: s.frameWidth })),
    ...STAGE_IMAGES, ...UI_IMAGES,
  ];
}
