import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Singleton/Intelligent initialization for Firebase.
 * This ensures that initializeApp is only called once, and handles 
 * the absence of environment variables during the Next.js build phase.
 */
function getFirebaseApp(): FirebaseApp {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0];
    }

    // During Next.js build (e.g., generating static pages), environment variables
    // might be missing, which causes initializeApp to throw 'auth/invalid-api-key'.
    // We check if the apiKey is present before initializing.
    if (!firebaseConfig.apiKey) {
        // Return a dummy initialization to prevent the build from crashing
        // when pre-rendering pages (like /_not-found) that don't actually 
        // need to interact with Firebase at build time.
        return initializeApp({
            ...firebaseConfig,
            apiKey: "dummy-key-for-build-process-only"
        });
    }

    return initializeApp(firebaseConfig);
}

const app: FirebaseApp = getFirebaseApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
