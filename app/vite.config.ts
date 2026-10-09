import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { uniwind } from 'uniwind/vite';
import { defineConfig, transformWithEsbuild, type Plugin } from 'vite';

// Веб TUGEN: компоненты @tugen/uikit через react-native-web и Uniwind — настройка как у витрины kit
// (tugen.uikit/example/vite.config.ts)

// Пакеты @rn-primitives публикуют JSX в .js/.mjs — Rollup его не разбирает, переводим сами
const rnPrimitivesJsx = (): Plugin => ({
  name: 'rn-primitives-jsx',
  enforce: 'pre',
  async transform(code, id) {
    if (/@rn-primitives\/.+\.m?js$/.test(id)) {
      const out = await transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
      });
      return { code: out.code, map: null };
    }
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [
    rnPrimitivesJsx(),
    tailwindcss(),
    uniwind({ cssEntryFile: './src/global.css' }),
    react(),
  ],
  resolve: {
    // Веб-версии модулей (accordion.web.js на Radix) раньше нативных
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.mjs',
      '.web.js',
      '.tsx',
      '.ts',
      '.mjs',
      '.js',
      '.json',
    ],
    alias: {
      // Портал с ключами вместо @rn-primitives/portal (README kit: «Портал»)
      '@rn-primitives/portal': fileURLToPath(
        new URL(
          './node_modules/@tugen/uikit/src/rnp-portal.tsx',
          import.meta.url,
        ),
      ),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx', '.mjs': 'jsx' },
      resolveExtensions: ['.web.mjs', '.web.js', '.mjs', '.js', '.json'],
    },
  },
  // Часть кода React Native ждёт глобальные __DEV__ и global, как в Metro
  define: {
    __DEV__: JSON.stringify(mode !== 'production'),
    global: 'globalThis',
  },
  server: { port: 5173 },
}));
