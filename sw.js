// Service Worker: App offline verfügbar machen.
// App-Dateien: sofort aus dem Cache, im Hintergrund aktualisieren (beim nächsten Öffnen neu).
// Die Nutzerdaten liegen NICHT hier, sondern im localStorage – Updates löschen nichts.

const CACHE = 'habits-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/store.js', 'js/logic.js', 'js/ui.js', 'js/library.js', 'js/icons-data.js',
  'js/views/today.js', 'js/views/habit.js', 'js/views/mood.js', 'js/views/stats.js',
  'js/views/more.js', 'js/views/review.js', 'js/views/welcome.js',
  'icons/icon-192.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isFont = url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: url.origin === location.origin });
      const network = fetch(request)
        .then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
