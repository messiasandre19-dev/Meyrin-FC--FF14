const CACHE_NAME = 'meyrin-ff14-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/calendar_import.js',
  '/meyrin_logo.png',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des fichiers');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('[Service Worker] Erreur lors de la mise en cache:', error);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie Cache First, puis Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourne depuis le cache si disponible
        if (response) {
          console.log('[Service Worker] Depuis le cache:', event.request.url);
          return response;
        }
        
        // Sinon, fetch depuis le réseau
        console.log('[Service Worker] Depuis le réseau:', event.request.url);
        return fetch(event.request).then((response) => {
          // Ne pas mettre en cache les requêtes non-GET ou non-réussies
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone la réponse pour la mettre en cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch((error) => {
        console.log('[Service Worker] Erreur fetch:', error);
        // Retourner une page d'erreur offline si nécessaire
      })
  );
});

// Gestion des messages depuis l'app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
