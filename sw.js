const CACHE_NAME = 'carol-lyrics-shell-v3';
const APP_SHELL = [
  './', './index.html', './lyrics.html', './styles/mainpage.css?v=4.3.0',
  './scripts/index.js', './scripts/lyrics.js', './scripts/song-data.js', './scripts/app.js'
];

const isSameOrigin = (request) => new URL(request.url).origin === self.location.origin;
const isSongData = (request) => new URL(request.url).pathname.endsWith('/scripts/song-data.js');

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((name) => name.startsWith('carol-lyrics-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name))
  )).then(() => self.clients.claim()));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => undefined);
  return cached || refresh || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !isSameOrigin(request)) return;

  // Lyrics appear instantly from cache, then refresh silently when online.
  if (isSongData(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetch(request)));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || staleWhileRevalidate(request)));
});
