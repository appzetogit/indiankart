import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let firebaseAdmin;

try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log('Firebase Admin SDK initialized successfully');
    } else {
        console.warn('Firebase credentials missing. Push notifications will be disabled.');
    }
} catch (error) {
    console.error('Firebase initialization error:', error.message);
}

export default firebaseAdmin;
