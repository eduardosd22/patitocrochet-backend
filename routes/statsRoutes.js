const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// GET /api/stats — Dashboard stats (solo admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const [
            totalOrders,
            pendingOrders,
            acceptedOrders,
            inProgressOrders,
            completedOrders,
            rejectedOrders,
            totalProducts,
            activeProducts,
            revenueResult
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'accepted' }),
            Order.countDocuments({ status: 'in_progress' }),
            Order.countDocuments({ status: 'completed' }),
            Order.countDocuments({ status: 'rejected' }),
            Product.countDocuments({ isActive: true }),
            Product.countDocuments({ isActive: true, available: true }),
            Order.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        // Últimos 5 pedidos
        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderCode status totalAmount clientData createdAt');

        res.json({
            orders: {
                total: totalOrders,
                pending: pendingOrders,
                accepted: acceptedOrders,
                in_progress: inProgressOrders,
                completed: completedOrders,
                rejected: rejectedOrders,
                active: pendingOrders + acceptedOrders + inProgressOrders
            },
            products: {
                total: totalProducts,
                available: activeProducts
            },
            revenue: {
                total: revenueResult[0]?.total || 0
            },
            recentOrders
        });
    } catch (err) {
        console.error('Error stats:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
