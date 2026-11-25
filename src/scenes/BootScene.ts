// Loads every asset listed in src/assets/manifest.ts, validates sheet sizes against the
// fighter configs, fits hurtboxes to the sprite pixels, then starts the fight.
import Phaser from 'phaser';
import { FIGHTERS, FIGHTER_SHEETS, FONT, STAGE_IMAGES, UI_IMAGES, VFX_SHEETS, fighterTextureKey } from '../assets/manifest';
import { ANIM_KEYS, validateConfig } from '../fighters/FighterConfig';
import { fitHurtboxes, setHurtboxes } from '../fighters/hurtboxes';

export const assetProblems: string[] = [];

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload(): void {
    const { width: W, height: H } = this.scale;
    const bar = this.add.graphics();
    this.load.on('progress', (v: number) => {
      bar.clear().fillStyle(0x2c1b58, 1).fillRect(W * 0.2, H / 2 - 6, W * 0.6, 12)
        .fillStyle(0xf6a24a, 1).fillRect(W * 0.2, H / 2 - 6, W * 0.6 * v, 12);
    });
    this.load.on('loaderror', (f: Phaser.Loader.File) => assetProblems.push(`missing: ${f.src}`));
    for (const s of [...FIGHTER_SHEETS, ...VFX_SHEETS]) this.load.spritesheet(s.key, s.path, { frameWidth: s.frameWidth, frameHeight: s.frameHeight });
    for (const i of [...STAGE_IMAGES, ...UI_IMAGES]) this.load.image(i.key, i.path);
  }

  create(): void {
    for (const f of FIGHTERS) assetProblems.push(...validateConfig(f));
    for (const s of [...FIGHTER_SHEETS, ...VFX_SHEETS]) {
      const img = this.textures.get(s.key).getSourceImage() as HTMLImageElement;
      if (img.width !== s.frameWidth * s.frames || img.height !== s.frameHeight) {
        assetProblems.push(`${s.path}: expected ${s.frameWidth * s.frames}x${s.frameHeight}, got ${img.width}x${img.height}`);
      }
    }
    for (const i of [...STAGE_IMAGES, ...UI_IMAGES]) {
      const img = this.textures.get(i.key).getSourceImage() as HTMLImageElement;
      if (img.width !== i.width || img.height !== i.height) assetProblems.push(`${i.path}: expected ${i.width}x${i.height}, got ${img.width}x${img.height}`);
    }
    for (const f of FIGHTERS) for (const a of ANIM_KEYS) {
      const key = fighterTextureKey(f.id, a);
      const img = this.textures.get(key).getSourceImage() as HTMLImageElement;
      setHurtboxes(key, fitHurtboxes(img, f.frame.w, f.frame.h, f.anims[a].frames, f.frame.anchorX, f.frame.anchorY));
    }
    this.cache.bitmapFont.add(FONT.key, Phaser.GameObjects.RetroFont.Parse(this, {
      image: FONT.image, width: FONT.cellW, height: FONT.cellH, chars: FONT.chars, charsPerRow: FONT.perRow,
      'spacing.x': 0, 'spacing.y': 0, 'offset.x': 0, 'offset.y': 0, lineSpacing: 0,
    }));
    if (assetProblems.length) console.error('[assets]', assetProblems);
    this.scene.start('fight');
  }
}
