const express = require('express');
const router = express.Router();
const { syncUser, getMyProfile, updateMyProfile } = require('../controllers/userController');
const { verifyToken, verifyFirebaseToken } = require('../middleware/authMiddleware');

// POST /api/users/sync — Registrar usuario nuevo
router.post('/sync', verifyFirebaseToken, syncUser);

// GET /api/users/me — Obtener perfil
router.get('/me', verifyToken, getMyProfile);

// PUT /api/users/profile — Actualizar datos (nombre, teléfono, dirección)
router.put('/profile', verifyToken, updateMyProfile);

module.exports = router;

