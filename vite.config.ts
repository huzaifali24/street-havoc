import { defineConfig } from 'vite';

// assets/ is served as the static root so sprite/background PNGs can be swapped
// on disk without touching code (paths come from src/assets/manifest.ts).
export default defineConfig({
  publicDir: 'assets',
  server: { port: 5173, strictPort: true }, // add --host to test on a phone over LAN
  build: { chunkSizeWarningLimit: 2000 },
});
