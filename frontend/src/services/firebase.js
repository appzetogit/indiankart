import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

import API from './api';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'];
const isFirebaseConfigured = requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]));

let app = null;
let messaging = null;

if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
} else {
    console.warn('Firebase messaging disabled: missing one or more VITE_FIREBASE_* env values.');
}

export const requestForToken = async () => {
    try {
        if (!app) {
            return null;
        }

        const messagingSupported = await isSupported();
        if (!messagingSupported) {
            console.warn('Firebase messaging is not supported in this browser.');
            return null;
        }

        if (!messaging) {
            messaging = getMessaging(app);
        }

        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission not granted.');
                return null;
            }
        }

        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered with scope:', registration.scope);

            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            if (!vapidKey) {
                console.warn('Missing VITE_FIREBASE_VAPID_KEY. Unable to fetch FCM token.');
                return null;
            }

            const currentToken = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                console.log('current token for client: ', currentToken);
                // Save token to database
                await API.post('/auth/fcm-token', { fcmToken: currentToken, platform: 'web' });
                console.log('FCM Token saved to database');
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        isSupported()
            .then((messagingSupported) => {
                if (!app || !messagingSupported) {
                    resolve(null);
                    return;
                }

                if (!messaging) {
                    messaging = getMessaging(app);
                }

                onMessage(messaging, (payload) => {
                    console.log("payload", payload);
                    resolve(payload);
                });
            })
            .catch(() => resolve(null));
    });

export default app;
