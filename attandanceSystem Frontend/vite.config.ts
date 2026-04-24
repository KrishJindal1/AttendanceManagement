import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // Same-origin API during `npm run dev` — avoids CORS and flaky fetch errors
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      // Never serve API routes from the SW cache (avoids empty/wrong PDF responses after fetch)
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly'
          }
        ]
      },
      manifest: {
        name: 'Attendance System',
        short_name: 'Attendance',
        description: 'Upload and manage student attendance records easily.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});
