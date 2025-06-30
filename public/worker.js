// themes/mono/public/worker.js

//------------------------------------------------------------------------
//------------------  PWA DASHBOAD APP -----------------------------------
//------------------------------------------------------------------------

// -- PWA Cache --
const CACHE_NAME = 'sublymus-dashboard-cache-v1';
// URLs du "shell" de l'application à mettre en cache lors de l'installation
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/logo.svg', 
  '/res/icons/icon-192x192.png'
];

// -- INSTALLATION --
// Se déclenche à l'installation du SW
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  // Mettre en cache les assets du shell de l'application
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('[Service Worker] Caching failed:', err))
  );
  // Forcer l'activation du nouveau SW
  event.waitUntil(self.skipWaiting());
});

// -- ACTIVATION --
// Se déclenche après l'installation, quand l'ancien SW est remplacé
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  // Nettoyer les anciens caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Prend le contrôle des clients immédiatement
  event.waitUntil(clients.claim());
});

// -- FETCH (Interception des requêtes réseau) --
// C'est ici que la magie du hors-ligne opère
self.addEventListener('fetch', (event) => {
  // Pour les requêtes de navigation (pages HTML), utiliser la stratégie Network falling back to Cache
  // pour toujours avoir la dernière version si en ligne.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request)) // Si le réseau échoue, on cherche dans le cache
        .then(response => response || caches.match('/offline.html')) // Si ni réseau ni cache, on peut afficher une page offline custom
    );
    return;
  }

  // Pour les autres requêtes (CSS, JS, images, API), utiliser Stale-While-Revalidate
  // Cela retourne la ressource du cache immédiatement (rapide),
  // puis met à jour le cache en arrière-plan avec la version réseau.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Si la requête réseau réussit, on met la nouvelle version en cache
          if (networkResponse.status === 200) { // Ne mettre en cache que les réponses valides
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Retourner la réponse du cache si elle existe, sinon attendre la réponse réseau
        return cachedResponse || fetchPromise;
      });
    })
  );
});

//------------------------------------------------------------------------
//------------------  NOTIFICATION
//------------------------------------------------------------------------
console.log('[Service Worker Mono] Loaded');

// Écouteur pour l'événement 'push' (quand une notification arrive)
self.addEventListener('push', function(event) {
  console.log('[Service Worker Mono] Push Received.');
  
  let payload;
  try {
    payload = event.data ? event.data.json() : null;
  } catch (e) {
    console.error('[Service Worker Mono] Error parsing push data JSON:', e);
    // Fallback si le payload n'est pas du JSON ou est manquant
    payload = { 
      title: 'Nouvelle Notification', 
      options: { body: event.data?.text() || 'Vous avez un nouveau message.' }
    };
  }

  if (!payload || !payload.title) {
    console.error('[Service Worker Mono] Push payload or title missing.');
    payload = { title: 'Notification Importante', options: { body: 'Quelque chose de nouveau est arrivé !' }};
  }

  const title = payload.title;
  const options = {
    body: payload.options?.body || 'Cliquez pour voir les détails.',
    icon: payload.options?.icon || '/assets/icons/icon-192x192.png', // Icône par défaut de ton thème
    badge: payload.options?.badge || '/assets/icons/badge-72x72.png', // Badge par défaut
    vibrate: payload.options?.vibrate || [100, 50, 100], // Vibration par défaut
    tag: payload.options?.tag || 'default-tag', // Un tag par défaut
    renotify: payload.options?.renotify || false,
    requireInteraction: payload.options?.requireInteraction || false,
    actions: payload.options?.actions || [], // Ex: [{action: 'view', title: 'Voir', icon: '/icons/view.png'}]
    data: payload.options?.data || { url: self.registration.scope || '/' } // Données passées (URL à ouvrir par défaut)
  };

  console.log('[Service Worker Mono] Showing notification:', title, options);
  event.waitUntil(self.registration.showNotification(title, options));
});

// Écouteur pour le clic sur la notification
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker Mono] Notification click Received.');
  event.notification.close(); // Ferme la notification

  const notificationData = event.notification.data || {};
  let urlToOpen = notificationData.url || self.registration.scope || '/'; // URL par défaut

  // Gérer les actions des boutons
  if (event.action) {
    console.log(`[Service Worker Mono] Action clicked: ${event.action}`);
    // Essayer de trouver une URL spécifique pour cette action dans les données de la notification
    const actionClicked = (event.notification.actions || []).find(a => a.action === event.action);
    if (actionClicked && (actionClicked).url) { // (actionClicked as any) pour accéder à une prop custom 'url'
        urlToOpen = (actionClicked).url;
    } else if (notificationData.actions && notificationData.actions[event.action]?.url) { // Autre structure possible pour les données d'action
        urlToOpen = notificationData.actions[event.action].url;
    }
    // Si pas d'URL spécifique pour l'action, on garde l'URL principale de la notification
  }
  
  console.log(`[Service Worker Mono] Attempting to open or focus: ${urlToOpen}`);

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function(clientList) {
      // Essayer de trouver un client (onglet) existant avec la même URL (path uniquement)
      const targetPath = new URL(urlToOpen, self.location.origin).pathname;
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientPath = new URL(client.url).pathname;
        if (clientPath === targetPath && 'focus' in client) {
          console.log('[Service Worker Mono] Focusing existing client.');
          return client.focus();
        }
      }
      // Si aucun client existant n'est trouvé, ouvrir une nouvelle fenêtre/onglet
      if (clients.openWindow) {
        console.log('[Service Worker Mono] Opening new window.');
        return clients.openWindow(urlToOpen);
      }
    }).catch(err => {
      console.error('[Service Worker Mono] Error during notificationclick client matching:', err);
      // Fallback si matchAll ou focus échoue
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Optionnel: Gérer l'installation et l'activation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker Mono] Install event');
  // Tu peux pré-cacher des assets ici si tu veux une PWA offline-first
  // event.waitUntil(self.skipWaiting()); // Forcer l'activation immédiate du nouveau SW
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker Mono] Activate event');
  // Nettoyer les anciens caches ici
  // event.waitUntil(clients.claim()); 
});