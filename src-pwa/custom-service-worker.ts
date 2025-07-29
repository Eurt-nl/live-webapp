/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "InjectManifest"
 */

declare const self: ServiceWorkerGlobalScope & typeof globalThis & { skipWaiting: () => void };

import { clientsClaim } from 'workbox-core';
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import type { WorkboxPlugin } from 'workbox-core/types';

self.skipWaiting();
void clientsClaim();

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

// Cache voor statische assets
registerRoute(
  /\.(?:js|css|svg|gif|map|ico|json)$/,
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }) as WorkboxPlugin,
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dagen
      }) as WorkboxPlugin,
    ],
  }),
);

// Cache voor afbeeldingen
registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }) as WorkboxPlugin,
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dagen
      }) as WorkboxPlugin,
    ],
  }),
);

// Cache voor API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }) as WorkboxPlugin,
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minuten
      }) as WorkboxPlugin,
    ],
  }),
);

// Non-SSR fallbacks to index.html
// Production SSR fallbacks to offline.html (except for dev)
if (process.env.MODE !== 'ssr' || process.env.PROD) {
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL(process.env.PWA_FALLBACK_HTML), {
      denylist: [new RegExp(process.env.PWA_SERVICE_WORKER_REGEX), /workbox-(.)*\.js$/, /^\/api\//],
    }),
  );
}

// Update detectie en notificatie naar clients
self.addEventListener('message', () => {
  // Event parameter wordt niet gebruikt, dus we laten het weg
});

// Wanneer een nieuwe service worker wordt geïnstalleerd
self.addEventListener('install', () => {
  console.log('🔄 Nieuwe service worker geïnstalleerd');
  self.skipWaiting();
});

// Wanneer een nieuwe service worker wacht om actief te worden
self.addEventListener('waiting', () => {
  console.log('⏳ Service worker wacht om actief te worden');

  // Stuur bericht naar alle clients dat er een update is
  self.clients.matchAll().then((clients: readonly Client[]) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        message: 'Er is een nieuwe versie van de app beschikbaar',
      });
    });
  });
});

// Wanneer de service worker actief wordt
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('✅ Service worker geactiveerd');

  // Claim alle clients
  event.waitUntil(self.clients.claim());
});
