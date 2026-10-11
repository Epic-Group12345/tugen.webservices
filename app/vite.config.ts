import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { propsPlugin } from './node_modules/@tugen/uikit/docs/props-plugin';

// Веб TUGEN: Vite + React + Tailwind на веб-слое kit (@tugen/uikit/web).
// Страницы /uikit и /docs берут витрину и сайт документации прямо из пакета kit (example/ и docs/):
// пакет закреплён коммитом из GitHub и приходит целиком, но его exports их не открывают — отсюда псевдонимы.
// propsPlugin собирает таблицы свойств документации из типов kit (virtual:uikit-props)

const kit = (path: string) =>
  fileURLToPath(
    new URL(`./node_modules/@tugen/uikit/${path}`, import.meta.url),
  );

export default defineConfig({
  plugins: [tailwindcss(), react(), propsPlugin()],
  resolve: {
    alias: {
      '@uikit-docs': kit('docs/src'),
      '@uikit-gallery': kit('example/src'),
    },
  },
  // Кусок документации большой (все примеры сразу), но грузится только на /docs
  build: { chunkSizeWarningLimit: 2000 },
  // API — у бэкенда на Nim (корень репозитория): yarn dev ходит к нему через прокси
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } },
});
