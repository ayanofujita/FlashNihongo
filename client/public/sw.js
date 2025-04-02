// Service Worker for NihongoFlash PWA

// Increment this version number whenever you make significant changes
const CACHE_NAME = 'nihongoflash-cache-v1'; // Updated cache version
const BUILD_TIME = new Date().getTime(); // Add a timestamp to force cache refresh

// Skip waiting and claim clients immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    
    // Tell all clients this service worker is now active
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({
        type: 'WORKER_UPDATED'
      }));
    });
  }
});
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event (clean up old caches and claim clients)
self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheAllowlist.indexOf(cacheName) === -1) {
              console.log('Deleting outdated cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim clients to ensure the new service worker takes control immediately
      self.clients.claim()
    ])
  );
  
  console.log('Service Worker activated with cache version:', CACHE_NAME);
});

// Fetch event with network-first strategy for HTML and JS files
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // For HTML, JS files and root path - use network first approach
  const isHTML = event.request.headers.get('accept').includes('text/html');
  const isJS = url.pathname.endsWith('.js') || url.pathname.endsWith('.jsx') || url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx');
  const isRoot = url.pathname === '/' || url.pathname === '/index.html';
  
  if (isHTML || isJS || isRoot || url.pathname.includes('/auth/')) {
    // Always try network first for these critical files
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If we got a valid response, clone it and update the cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
  } 
  // For API requests, never cache
  else if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
  }
  // For other assets (images, CSS), use cache-first approach
  else {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
              
              return response;
            });
        })
    );
  }
});