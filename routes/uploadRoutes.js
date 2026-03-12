const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// POST /api/uploads/product-image
router.post('/product-image', verifyToken, requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl, message: 'Imagen subida correctamente.' });
});

module.exports = router;
