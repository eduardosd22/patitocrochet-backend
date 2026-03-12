const admin = require('../config/firebase');
const User = require('../models/User');

// Middleware COMPLETO: verifica Firebase + busca en BD local
// Se usa en rutas que requieren que el usuario ya exista en nuestra BD
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);

        // Busca al usuario en nuestra base de datos por su UID de Firebase
        const user = await User.findOne({ uid: decodedToken.uid });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos local' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware LIGERO: solo verifica que el token de Firebase sea válido
// Se usa en /sync donde el usuario puede no existir aún en nuestra BD
const verifyFirebaseToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No se proporcionó token.' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);

        // Inyectamos los datos del token de Firebase directamente
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            photoURL: decodedToken.picture
        };
        next();
    } catch (error) {
        console.error('Error al verificar token Firebase:', error);
        res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware para verificar si el usuario es administrador (RN-05)
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

module.exports = { verifyToken, verifyFirebaseToken, requireAdmin };

