import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const firebaseAdminConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin
let app: App;

if (getApps().length === 0) {
    app = initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
} else {
    app = getApps()[0];
}

if (!app) {
    throw new Error('Failed to initialize Firebase Admin');
}

// Initialize Admin Firestore
export const adminDb = getFirestore(app);

// Initialize Admin Cloud Messaging
export const adminMessaging = getMessaging(app);

export default app;
