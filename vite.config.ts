import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'branding/askleion-favicon.svg',
        'branding/apple-touch-icon.png',
        'branding/askleion-icon-192.png',
        'branding/askleion-icon-512.png',
        'branding/askleion-icon-maskable-512.png',
        'branding/askleion-symbol.svg',
        'branding/askleion-symbol-light.svg',
        'branding/askleion-logo-vertical.svg',
        'branding/askleion-logo-vertical-dark.svg'
      ],
      manifest: {
        name: 'Askleion',
        short_name: 'Askleion',
        description: 'Biblioteca médica personal con soporte offline para estudio, farmacología, procedimientos y conocimiento clínico.',
        theme_color: '#0D1B2A',
        background_color: '#F5F2EB',
        display: 'fullscreen',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/branding/askleion-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/branding/askleion-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/branding/askleion-icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/auth\/v1\//, /^\/rest\/v1\//, /^\/storage\/v1\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
