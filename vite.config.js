import { defineConfig } from 'vite';

export default defineConfig({
  // web/generated пересобирается командой yarn nim; Vite следит за готовым JS
  server: { port: 5173 },
});
