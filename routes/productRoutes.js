const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById, getAllProductsAdmin, updateProduct, deleteProduct } = require('../controllers/productController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Rutas Públicas (Cualquiera puede ver el catálogo)
router.get('/', getProducts);
router.get('/:id', getProductById);

// Rutas Protegidas (Solo Administradores de Firebase)
router.get('/admin', verifyToken, requireAdmin, getAllProductsAdmin);
router.post('/', verifyToken, requireAdmin, createProduct);
router.put('/:id', verifyToken, requireAdmin, updateProduct);
router.delete('/:id', verifyToken, requireAdmin, deleteProduct); // Soft Delete

module.exports = router;
