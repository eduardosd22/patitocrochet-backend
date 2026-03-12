const express = require('express');
const router = express.Router();
const { createOrder, trackOrder, trackMultipleOrders, updateOrderStatus, getAllOrdersAdmin } = require('../controllers/orderController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/create',          createOrder);
router.get('/track/:orderCode', trackOrder);
router.post('/track-multiple',  trackMultipleOrders);

// Rutas de usuario autenticado — busca por email del cliente
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const Order = require('../models/Order');
        // El email del usuario Firebase se guarda en req.user.email
        const userEmail = req.user?.email;
        if (!userEmail) return res.json([]);
        const orders = await Order.find({ 'clientData.email': userEmail }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('my-orders error:', err);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
});

// Rutas de Administrador
router.get('/',              verifyToken, requireAdmin, getAllOrdersAdmin);
router.patch('/:id/status',  verifyToken, requireAdmin, updateOrderStatus);

module.exports = router;

