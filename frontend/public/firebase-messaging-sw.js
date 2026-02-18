importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCCdjJRyPx_kv6lcR2CLBJwjhuFKfBjKDM",
    authDomain: "test-303cb.firebaseapp.com",
    projectId: "test-303cb",
    storageBucket: "test-303cb.firebasestorage.app",
    messagingSenderId: "248635966712",
    appId: "1:248635966712:web:137b07aeef2ca7c2eee70d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/indiankart-logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
