self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Purely a shell for PWA installability. 
  // You can add caching logic here later for offline support!
  event.respondWith(fetch(event.request));
});
