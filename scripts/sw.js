const CACHE_NAME = 'my-site-cache-v2'; // Increment version for updates
const URLS_TO_CACHE = [
    '/',                     // Root or index.html
    '../index.html',
    '../lyrics.html',
    '../SongsEnglish/songs.json',
    '../SongsMalayalam/songs.json',
    '../scripts/song-data.js',
    '../scripts/index.js',
    '../scripts/lyrics.js',
    '../styles/mainpage.css'
];
// Install event - Cache the specified pages
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching pages...');
            return cache.addAll(URLS_TO_CACHE);
        })
    );
});
// Fetch event - Serve files from cache
self.addEventListener('fetch', (event) => {
    console.log('Service Worker fetching:', event.request.url);
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
// Handle manual skip waiting for updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
