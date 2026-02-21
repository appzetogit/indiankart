import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

import API from './api';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'];
const isFirebaseConfigured = requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]));

let app = null;
let messaging = null;

if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
} else {
    console.warn('Firebase messaging disabled: missing one or more VITE_FIREBASE_* env values.');
}

export const requestForToken = async () => {
    try {
        if (!messaging) {
            return null;
        }

        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered with scope:', registration.scope);

            const currentToken = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                console.log('current token for client: ', currentToken);
                // Save token to database
                API.post('/auth/fcm-token', { fcmToken: currentToken, platform: 'web' })
                    .then(() => console.log('FCM Token saved to database'))
                    .catch(err => console.error('Error saving FCM Token:', err));
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
        if (!messaging) {
            resolve(null);
            return;
        }

        onMessage(messaging, (payload) => {
            console.log("payload", payload);
            resolve(payload);
        });
    });

export default app;
