const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/configController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Ver configuración actual
router.get('/', getConfig);

// Actualizar configuración (Solo Admin)
router.put('/', verifyToken, requireAdmin, updateConfig);

module.exports = router;
