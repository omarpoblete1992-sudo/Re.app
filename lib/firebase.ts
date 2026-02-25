import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import clientConfig from "@/config";

/**
 * Inicialización Singleton de Firebase.
 * Usa las claves hardcodeadas de config.ts (públicas por diseño).
 * Patrón getApps() evita doble inicialización.
 */
function getFirebaseApp(): FirebaseApp {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0];
    }
    return initializeApp(clientConfig.firebase);
}

const app: FirebaseApp = getFirebaseApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
