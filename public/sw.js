const CACHE_NAME = 'assist-tv-v1';
const STATIC_CACHE_NAME = 'assist-tv-static-v1';

const STATIC_ASSETS = [
  '/_next/static/',
  '/favicon.ico',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => 
        url.endsWith('/') ? url : url
      ));
    }).catch(err => {
      console.log('Service Worker: Error caching static assets', err);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache First for Next.js static assets
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Stale While Revalidate for API layout calls
  if (url.pathname.includes('/api/layout')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          const fetchPromise = fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Return cached version if network fails
            return response;
          });

          // Return cached version immediately if available, 
          // otherwise wait for network
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Network First for other requests
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for offline actions (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync operations
      console.log('Service Worker: Background sync')
    );
  }
});