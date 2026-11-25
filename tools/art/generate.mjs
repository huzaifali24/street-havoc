// Placeholder art generator for Street Havoc 16.
// Renders every sprite sheet / stage layer / UI font listed in assets/REQUIRED_ASSETS.md
// using the procedural painters in tools/art/*.js inside headless Chromium, and writes PNGs
// into assets/. Re-run with `npm run art`. Real art can overwrite these files directly.
//
//   node tools/art/generate.mjs            -> write all assets
//   node tools/art/generate.mjs --preview  -> also write an upscaled contact sheet to tools/art/preview/
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const assets = join(root, 'assets');
const preview = process.argv.includes('--preview');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');
for (const f of ['painter-core.js', 'painter-fighters.js', 'painter-vfx.js', 'painter-stage.js', 'painter-ui.js']) {
  await page.addScriptTag({ path: join(here, f) });
}

const outputs = await page.evaluate(async ({ only }) => window.SH.renderAll(only), { only });
for (const o of outputs) {
  const file = join(assets, o.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(o.data.split(',')[1], 'base64'));
  console.log(`wrote assets/${o.path}  ${o.w}x${o.h}${o.frames ? `  (${o.frames} frames)` : ''}`);
}

if (preview) {
  const outDir = join(here, 'preview');
  mkdirSync(outDir, { recursive: true });
  const sheets = await page.evaluate(() => window.SH.previewSheets());
  for (const s of sheets) {
    writeFileSync(join(outDir, s.name), Buffer.from(s.data.split(',')[1], 'base64'));
    console.log(`preview tools/art/preview/${s.name}`);
  }
}
await browser.close();
