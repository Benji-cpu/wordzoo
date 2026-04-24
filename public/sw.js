// Self-destruct service worker. The previous SW (wordzoo-v1) pre-cached app
// shell routes and survives across deploys because the browser keeps using
// the registered copy. This replacement takes over, deletes every cache it
// finds, unregisters itself, and reloads open tabs so the next request goes
// straight to the network.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
