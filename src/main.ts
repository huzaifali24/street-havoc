import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { FightScene } from './scenes/FightScene';

// RESIZE: the canvas always fills the viewport (no letterboxing). The fight camera then
// picks a uniform zoom per aspect ratio — see computeView() in src/core/world.ts.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0e0a26',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  input: { activePointers: 4 },
  fps: { target: 60 },
  scene: [BootScene, FightScene],
});

(window as unknown as { __game: Phaser.Game }).__game = game;
