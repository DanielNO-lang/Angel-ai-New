import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        injectRegister: null,
        registerType: 'autoUpdate',
        includeAssets: ['icon-192.svg', 'icon-512.svg', 'icon-maskable-512.svg', 'angel-logo.png'],
        manifest: {
          id: '/',
          name: 'Angel AI',
          short_name: 'Angel',
          description: 'Personal AI workspace and agent platform combining conversational AI, persistent memory, tasks, agent workflows, and visual interaction.',
          theme_color: '#060813',
          background_color: '#060813',
          display: 'standalone',
          orientation: 'any',
          start_url: '/?source=pwa',
          scope: '/',
          icons: [
            {
              src: '/icon-192.svg?v=6',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/icon-512.svg?v=6',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/icon-maskable-512.svg?v=6',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'angel-service-worker.js',
        injectManifest: {
          injectionPoint: 'self.__WB_MANIFEST',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}'],
          maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        },
        devOptions: {
          // The custom service worker requires the build-injected precache manifest.
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
