import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Inicializa el SDK de Admin UNA SOLA VEZ en el ámbito global.
admin.initializeApp();

// Obtiene una referencia a la base de datos de Firestore.
const db = admin.firestore();

/**
 * Cloud Function que se activa cuando se crea un nuevo usuario en Firebase Auth.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
    // Extrae la información necesaria del objeto de usuario.
    const { uid, email, displayName, photoURL } = user;

    // Crea un nuevo documento en la colección 'users' con el UID como ID.
    const userRef = db.collection('users').doc(uid);

    try {
        await userRef.set({
            uid,
            email: email || '',
            nickname: displayName || 'Alma Anónima',
            photoUrl: photoURL || '',
            role: 'user',
            birthDate: '',
            gender: '',
            interestedIn: '',
            banned: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info(`✅ Usuario creado exitosamente en Firestore: ${uid}`);
    } catch (error) {
        functions.logger.error(`❌ Error al crear usuario en Firestore: ${uid}`, error);
        throw error;
    }
});
