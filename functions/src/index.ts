// @ts-ignore - Tipos pueden no estar exportados en esta versión específica de npm.
import * as functions from "firebase-functions/compat/v1";  // <--- Usa /compat/v1
import { onDocumentCreated } from "firebase-functions/v2/firestore";  // Gen2 para Firestore
import * as admin from "firebase-admin";

admin.initializeApp();

// onUserCreated: usa Gen1 (funciona con firebase-functions ^6.x en compat mode)
export const onUserCreated = functions.auth.user().onCreate(async (user: any) => {
    const { uid, email, displayName, photoURL } = user;

    const db = admin.firestore();
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

  // Campos de trial y suscripción (10 días)
  trialActive: true,
  trialStart: admin.firestore.FieldValue.serverTimestamp(),
  trialEnd: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 24 * 60 * 60 * 1000),
  subscriptionActive: false,
  subscriptionEnd: null,
  firstMutualConnection: false
}, { merge: true });  // merge: true evita sobrescribir datos si el doc ya existe
        console.log(`✅ Usuario creado: ${uid}`);
    } catch (error) {
        console.error(`❌ Error al crear usuario: ${uid}`, error);
        throw error;
    }
});

// onNewMessage: usa Gen2 (ya está correcto)
export const onNewMessage = onDocumentCreated(
    "connections/{connectionId}/messages/{messageId}",
    async (event) => {
        const connectionId = event.params.connectionId;
        const connectionRef = admin.firestore().collection('connections').doc(connectionId);
        const messageData = event.data?.data();

        if (!messageData) return;
        let finalCount = 0;

        try {
            await admin.firestore().runTransaction(async (transaction) => {
                const connectionSnap = await transaction.get(connectionRef);
                if (!connectionSnap.exists) throw new Error('Connection no existe');

                const data = connectionSnap.data()!;
                let interactionCount = (data.interactionCount || 0) + 1;
                let status = data.status || 'pending';
                let revealedUsers = data.revealedUsers || [];

                if (messageData.senderId !== data.fromUserId && messageData.senderId !== data.toUserId) {
                    throw new Error('Mensaje inválido');
                }

                if (interactionCount >= 50 && status !== 'revealed') {
                    status = 'revealed';
                    revealedUsers = [data.fromUserId, data.toUserId];
                }

                transaction.update(connectionRef, {
                    interactionCount,
                    status,
                    revealedUsers,
                    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                finalCount = interactionCount; // Assign interactionCount to finalCount
            });

            console.log(`✅ Mensaje procesado en ${connectionId} | Count: ${finalCount}`);
        } catch (error) {
            console.error(`❌ Error en onNewMessage ${connectionId}`, error);
            throw error;
        }
    }
);
