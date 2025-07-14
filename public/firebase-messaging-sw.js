// Import Firebase scripts pour le service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuration Firebase (obtenir depuis les variables d'environnement)
firebase.initializeApp({
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
});

// Récupérer l'instance de messaging
const messaging = firebase.messaging();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
    console.log('Message reçu en arrière-plan:', payload);

    const notificationTitle = payload.notification?.title || 'Tournoi CODM';
    const notificationOptions = {
        body: payload.notification?.body || 'Nouvelle notification',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: payload.data,
        actions: [
            {
                action: 'view',
                title: 'Voir'
            },
            {
                action: 'dismiss',
                title: 'Ignorer'
            }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        // Ouvrir l'application ou naviguer vers une page spécifique
        const urlToOpen = event.notification.data?.url || '/';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Si l'application est déjà ouverte, la mettre au premier plan
                    for (const client of clientList) {
                        if (client.url.includes(urlToOpen) && 'focus' in client) {
                            return client.focus();
                        }
                    }

                    // Sinon, ouvrir une nouvelle fenêtre
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});
