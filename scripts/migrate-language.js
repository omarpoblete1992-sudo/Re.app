const admin = require('firebase-admin');

// INSTRUCCIONES:
// 1. Descarga tu key de servicio (serviceAccountKey.json) desde Firebase Console (Configuración del proyecto > Cuentas de servicio)
// 2. Coloca 'serviceAccountKey.json' junto a este script o en la raíz del proyecto.
// 3. Modifica la ruta del require abajo si es necesario.
// 4. Ejecuta: node scripts/migrate-language.js (asegúrate de tener instalado firebase-admin: npm i firebase-admin)

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateLanguage() {
    console.log('Iniciando migración de i18n ("language" backfill)...');

    // 1. Migrar Users
    const usersSnapshot = await db.collection('users').get();
    console.log(`Encontrados ${usersSnapshot.size} usuarios. Procesando...`);

    let usersUpdated = 0;
    const usersBatch = db.batch();

    usersSnapshot.forEach(doc => {
        const data = doc.data();
        if (!data.language) {
            usersBatch.update(doc.ref, { language: 'es' });
            usersUpdated++;
        }
    });

    if (usersUpdated > 0) {
        await usersBatch.commit();
        console.log(`✅ ${usersUpdated} usuarios actualizados con language: 'es'`);
    } else {
        console.log('✅ Todos los usuarios ya tenían el campo language.');
    }

    // 2. Migrar Posts (Esencias)
    const postsSnapshot = await db.collection('posts').get();
    console.log(`Encontrados ${postsSnapshot.size} posts. Procesando...`);

    let postsUpdated = 0;
    // Firestore batches support up to 500 operations
    let currentBatch = db.batch();
    let operationsInBatch = 0;

    for (const doc of postsSnapshot.docs) {
        const data = doc.data();
        if (!data.language) {
            currentBatch.update(doc.ref, { language: 'es' });
            postsUpdated++;
            operationsInBatch++;

            if (operationsInBatch === 450) {
                await currentBatch.commit();
                console.log(`Commit intermedio de Posts (450 docs)...`);
                currentBatch = db.batch(); // Start a new batch
                operationsInBatch = 0;
            }
        }
    }

    if (operationsInBatch > 0) {
        await currentBatch.commit();
    }

    if (postsUpdated > 0) {
        console.log(`✅ ${postsUpdated} posts actualizados con language: 'es'`);
    } else {
        console.log('✅ Todos los posts ya tenían el campo language.');
    }

    console.log('🎉 Migración completada exitosamente.');
}

migrateLanguage().catch(console.error);
