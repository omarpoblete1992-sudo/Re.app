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
 * Inicialización lazy de Firebase.
 * Durante el build de Next.js (generación de páginas estáticas), las variables
 * de entorno pueden no estar disponibles. Al hacer la inicialización lazy,
 * evitamos que getAuth() se ejecute a nivel de módulo durante SSG,
 * previniendo el error 'auth/invalid-api-key'.
 */

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

function getFirebaseApp(): FirebaseApp {
    if (_app) return _app;

    const apps = getApps();
    if (apps.length > 0) {
        _app = apps[0];
        return _app;
    }

    _app = initializeApp(firebaseConfig);
    return _app;
}

// Exportaciones lazy — solo se inicializan cuando se accede por primera vez
export const auth: Auth = new Proxy({} as Auth, {
    get(_target, prop) {
        if (!_auth) _auth = getAuth(getFirebaseApp());
        return (_auth as unknown as Record<string | symbol, unknown>)[prop];
    },
});

export const db: Firestore = new Proxy({} as Firestore, {
    get(_target, prop) {
        if (!_db) _db = getFirestore(getFirebaseApp());
        return (_db as unknown as Record<string | symbol, unknown>)[prop];
    },
});

export const googleProvider: GoogleAuthProvider = new Proxy({} as GoogleAuthProvider, {
    get(_target, prop) {
        if (!_googleProvider) _googleProvider = new GoogleAuthProvider();
        return (_googleProvider as unknown as Record<string | symbol, unknown>)[prop];
    },
});
