const admin = require('firebase-admin');

// Si no se han definido estas variables, mostraremos un log de advertencia para que el usuario las llene después
if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'tu_project_id') {
    console.warn('⚠️ Advertencia: Credenciales de Firebase Admin no configuradas correctamente en .env');
}

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Reemplaza los saltos de línea escapados (útil en entornos como Vercel/Heroku)
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
        })
    });
    console.log('Firebase Admin SDK inicializado correctamente');
} catch (error) {
    console.error('Error al inicializar Firebase Admin:', error.message);
}

module.exports = admin;
