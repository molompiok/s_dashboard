// themes/mono/public/worker.js
// Ce fichier doit être à la racine du dossier public pour être accessible via /worker.js

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
  // event.waitUntil(clients.claim()); // Permet au SW activé de contrôler les clients immédiatement
});