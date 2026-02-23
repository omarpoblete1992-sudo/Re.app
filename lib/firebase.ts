import { initializeApp, getApps, getApp } from "firebase/app";

// --- ¡LA MAGIA ESTÁ AQUÍ! ---
// En lugar de leer desde process.env (que falla en el cliente),
// vamos a definir el objeto de configuración DIRECTAMENTE en el código.
// Esto es seguro para las claves públicas de Firebase.

const firebaseConfig = {
  apiKey: "AIzaSyDBnKWMkXH0inJKh8IW2tdWML9wQjzycHE", // <-- REEMPLAZA CON TU API KEY REAL
  authDomain: "reflexion-app-e56d6.firebaseapp.com",
  projectId: "reflexion-app-e56d6",
  storageBucket: "reflexion-app-e56d6.appspot.com",
  messagingSenderId: "571213931352",
  appId: "1:571213931352:web:26a1a588d274add6a9bb2d" // <-- REEMPLAZA CON TU APP ID REAL
};

// --- El resto del código se queda igual ---

function createFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export const FirebaseApp = createFirebaseApp();
