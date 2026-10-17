// Minimal service worker. It makes the site installable as an app and never caches anything,
// so logins, AI answers and job results are always fresh.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  /* no respondWith: the browser handles every request normally */
});
