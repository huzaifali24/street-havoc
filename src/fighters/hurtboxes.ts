// Hurtboxes are fitted to the actual sprite pixels at load time, so they always match
// whatever art is in assets/ (placeholder or final) without anyone re-authoring numbers.
// Each frame gets two boxes: upper body (head/torso/arms) and lower body (hips/legs),
// each the bounding box of opaque pixels in that slice, slightly inset.
import type { Box } from './FighterConfig';

const store = new Map<string, Box[][]>();

export function setHurtboxes(textureKey: string, frames: Box[][]): void { store.set(textureKey, frames); }
export function getHurtboxes(textureKey: string, frame: number): Box[] { return store.get(textureKey)?.[frame] ?? []; }

export function fitHurtboxes(img: CanvasImageSource & { width: number; height: number }, frameW: number, frameH: number,
  frames: number, anchorX: number, anchorY: number): Box[][] {
  const c = document.createElement('canvas');
  c.width = frameW * frames; c.height = frameH;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const out: Box[][] = [];
  for (let f = 0; f < frames; f++) {
    const ox = f * frameW;
    let top = frameH, bottom = -1;
    for (let y = 0; y < frameH; y++) for (let x = 0; x < frameW; x++) {
      if (data[(y * c.width + ox + x) * 4 + 3] > 0) { if (y < top) top = y; if (y > bottom) bottom = y; }
    }
    if (bottom < 0) { out.push([]); continue; }
    const split = Math.round(top + (bottom - top) * 0.45);
    const slice = (y0: number, y1: number): Box | null => {
      let minX = frameW, maxX = -1, minY = frameH, maxY = -1;
      for (let y = y0; y <= y1; y++) for (let x = 0; x < frameW; x++) {
        if (data[(y * c.width + ox + x) * 4 + 3] > 0) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
      }
      if (maxX < 0) return null;
      const inset = 2;
      return { x: minX + inset - anchorX, y: minY + 1 - anchorY, w: Math.max(2, maxX - minX + 1 - inset * 2), h: Math.max(2, maxY - minY + 1 - 1) };
    };
    out.push([slice(top, split), slice(split + 1, bottom)].filter((b): b is Box => !!b));
  }
  return out;
}
