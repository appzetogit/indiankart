import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let firebaseAdmin;

try {
    const normalizePrivateKey = (rawKey) => {
        if (!rawKey) return undefined;

        let key = String(rawKey).trim();

        // Strip optional surrounding quotes from .env values.
        if (
            (key.startsWith('"') && key.endsWith('"')) ||
            (key.startsWith("'") && key.endsWith("'"))
        ) {
            key = key.slice(1, -1);
        }

        // Support escaped newlines and remove CR characters.
        key = key.replace(/\\n/g, '\n').replace(/\r/g, '');
        return key;
    };

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : null;

    const privateKey = normalizePrivateKey(
        serviceAccountJson?.private_key || process.env.FIREBASE_PRIVATE_KEY
    );

    const projectId = serviceAccountJson?.project_id || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = serviceAccountJson?.client_email || process.env.FIREBASE_CLIENT_EMAIL;

    if (projectId && clientEmail && privateKey) {
        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
        console.log('Firebase Admin SDK initialized successfully');
    } else {
        console.warn('Firebase credentials missing/invalid. Push notifications will be disabled.');
    }
} catch (error) {
    console.error('Firebase initialization error:', error.message);
}

export default firebaseAdmin;
