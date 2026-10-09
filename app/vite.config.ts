import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Веб TUGEN: Vite + React + Tailwind на веб-слое kit (@tugen/uikit/web) — особой настройки не нужно

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // API — у бэкенда на Nim (корень репозитория): yarn dev ходит к нему через прокси
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } },
});
