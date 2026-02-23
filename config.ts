// /config.ts

// Este objeto contiene TODAS las claves PÚBLICAS que necesita el cliente.
// Al estar en su propio archivo, nos aseguramos de que no se pierdan.
const clientConfig = {
  firebase: {
    apiKey: "AIzaSyDBnKWMkXH0inJKh8IW2tdWML9wQjzycHE", // <-- TU API KEY REAL
    authDomain: "reflexion-app-e56d6.firebaseapp.com",
    projectId: "reflexion-app-e56d6",
    storageBucket: "reflexion-app-e56d6.appspot.com",
    messagingSenderId: "571213931352",
    appId: "1:571213931352:web:26a1a588d274add6a9bb2d" // <-- TU APP ID REAL
  },
  // Si tuvieras otras claves públicas, irían aquí.
  // Ejemplo: publicMercadoPagoKey: "APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
};

export default clientConfig;
