// TaxCalm Service Worker
// Enables offline functionality and PWA features

const CACHE_NAME = 'taxcalm-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/about',
    '/static/css/style.css',
    '/static/js/calculator.js',
    '/static/js/ai-assistant.js',
    '/static/js/features.js',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache).catch(err => {
                    console.log('Some assets failed to cache:', err);
                });
            })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // For API calls
    if (event.request.url.includes('/calculate-gst') || event.request.url.includes('/ask-gst')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached version if offline
                    return caches.match(event.request)
                        .then(response => {
                            return response || new Response(
                                JSON.stringify({
                                    error: 'Offline - Using cached data'
                                }),
                                { headers: { 'Content-Type': 'application/json' } }
                            );
                        });
                })
        );
        return;
    }

    // For static assets
    event.respondWith(
    caches.match(event.request)
        .then(response => {
            // Return from cache if available
            if (response) {
                return response;
            }

            // Otherwise fetch from network
            return fetch(event.request)
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200 &&
                        (event.request.url.includes('.js') ||
                            event.request.url.includes('.css') ||
                            event.request.url.includes('.html'))) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Offline fallback
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
        })
);
});
