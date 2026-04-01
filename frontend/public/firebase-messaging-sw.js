importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBd0fdBzverxO97NOQ5GCTyTkmpII6zhho",
    authDomain: "indiankart-ab04a.firebaseapp.com",
    projectId: "indiankart-ab04a",
    storageBucket: "indiankart-ab04a.firebasestorage.app",
    messagingSenderId: "303213414487",
    appId: "1:303213414487:web:409fd7d6816ce336657b12",
    measurementId: "G-GJR2N1SJ24"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload?.notification?.title || payload?.data?.title || 'Indian Kart';
    const notificationOptions = {
        body: payload?.notification?.body || payload?.data?.body || 'You have a new notification.',
        icon: '/indiankart-logo.png',
        badge: '/indiankart-logo.png',
        data: {
            url: payload?.data?.click_action || '/'
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification?.data?.url || '/';
    event.waitUntil(clients.openWindow(targetUrl));
});
