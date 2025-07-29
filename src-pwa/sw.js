import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { clients } from 'workbox-window';

// Precache alle assets die tijdens de build zijn gegenereerd
precacheAndRoute(self.__WB_MANIFEST);

// Cache strategieën voor verschillende soorten bestanden
registerRoute(
  /\.(?:js|css|html)$/,
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  }),
);

registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dagen
      }),
    ],
  }),
);

registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new CacheFirst({
    cacheName: 'google-fonts-stylesheets',
  }),
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  }),
);

// Network first strategie voor API calls
registerRoute(
  /^https:\/\/api\./,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60, // 1 uur
      }),
    ],
  }),
);

// Forceer de service worker om direct actief te worden
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Claim clients zodra de service worker actief is
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
