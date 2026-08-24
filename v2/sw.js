/* FRENCH STORE — minimal PWA service worker.
   Intentionally does NOT intercept fetch requests or cache catalog, Auth,
   Wallet, BISA, orders or API responses. Network behavior stays unchanged. */
'use strict';

const FS_SW_VERSION = 'fs-pwa-v1-20260823';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
