const Order = require('../models/Order');
const Product = require('../models/Product');
const SystemConfig = require('../models/SystemConfig');
const { sendOrderEmail, sendAdminNotificationEmail } = require('../utils/emailService');

// Generar código único: PAT-AMI-1001, PAT-RAMO-1002, PAT-PE-1003
const generateOrderCode = async (category = '') => {
    const cat = category.toLowerCase();
    let prefix = 'PAT-PE';
    if (cat.includes('amigurumi')) prefix = 'PAT-AMI';
    else if (cat.includes('ramo'))      prefix = 'PAT-RAMO';
    else if (cat.includes('llavero'))   prefix = 'PAT-LLA';
    else if (cat.includes('gorro'))     prefix = 'PAT-GOR';

    const count = await Order.countDocuments();
    return `${prefix}-${1000 + count}`;
};

// POST /api/orders/create — Crear pedido (público, no requiere login)
const createOrder = async (req, res) => {
    try {
        const { items, totalAmount, clientData } = req.body;

        if (!items || !items.length)
            return res.status(400).json({ error: 'El carrito está vacío.' });
        if (!clientData?.name || !clientData?.email)
            return res.status(400).json({ error: 'Nombre y email son obligatorios.' });

        const orderCode = await generateOrderCode(items[0]?.category || 'PE');

        // 1. Validar Stock de todos los productos primero
        const productUpdates = [];
        for (const item of items) {
            if (!item.isAIGenerated && item.product) {
                const product = await Product.findOne({ _id: item.product, isActive: true });
                if (!product) {
                    return res.status(404).json({ error: `Producto no encontrado o descontinuado: ${item.name}` });
                }
                if (product.stock < item.quantity) {
                    return res.status(400).json({ error: `Stock insuficiente para: ${product.name}. Disponible: ${product.stock}` });
                }
                productUpdates.push({ product, quantity: item.quantity });
            }
        }

        const newOrder = new Order({
            orderCode,
            user: req.user ? req.user._id : null,
            clientData,
            items,
            totalAmount,
            requestedDate: new Date(),
            requiresAdminValidation: items.some(i => i.isAIGenerated)
        });

        await newOrder.save();

        // 2. Descontar Stock y actualizar disponibilidad
        for (const update of productUpdates) {
            update.product.stock -= update.quantity;
            if (update.product.stock <= 0) {
                update.product.stock = 0;
                update.product.available = false;
            }
            await update.product.save();
        }

        // 3. Notificar al cliente y al admin en segundo plano (sin 'await' para evitar bloqueos si el correo tarda 10 min en fallar)
        // Eliminado/Comentado temporalmente por política de enviar WhatsApp
        // sendOrderEmail(clientData.email, clientData.name, orderCode, 'pending', items, totalAmount).catch(console.error);
        // sendAdminNotificationEmail(orderCode, items, totalAmount, clientData).catch(console.error);

        res.status(201).json({
            message: 'Pedido creado con éxito',
            orderCode: newOrder.orderCode,
            status: newOrder.status
        });

    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({ error: 'Error al generar pedido', details: error.message });
    }
};

// GET /api/orders/track/:orderCode — Rastreo público
const trackOrder = async (req, res) => {
    try {
        const { orderCode } = req.params;
        const order = await Order.findOne({ orderCode }).select('-clientData');
        if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar pedido' });
    }
};

// POST /api/orders/track-multiple — Rastreo público múltiple
const trackMultipleOrders = async (req, res) => {
    try {
        const { codes } = req.body;
        if (!codes || !Array.isArray(codes)) return res.json([]);
        const orders = await Order.find({ orderCode: { $in: codes } }).select('-clientData').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar pedidos múltiples' });
    }
};

// PATCH /api/orders/:id/status — Cambiar estado (solo admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

        const finalStates = ['completed', 'rejected'];
        if (finalStates.includes(order.status)) {
            return res.status(400).json({ error: 'Este pedido ya está en un estado final y no puede modificarse.' });
        }

        order.status = status;
        await order.save();

        // Notificar al cliente en segundo plano (protegido contra orders antiguos sin clientData)
        if (order.clientData && order.clientData.email) {
            // Eliminado/Comentado temporalmente por política de enviar WhatsApp
            /*
            sendOrderEmail(
                order.clientData.email,
                order.clientData.name || 'Cliente',
                order.orderCode,
                status,
                order.items,
                order.totalAmount
            ).catch(console.error);
            */
        }

        res.status(200).json({ message: `Estado actualizado a: ${status}`, order });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: 'Error al actualizar estado', details: error.message });
    }
};

// GET /api/orders — Listar todos (admin)
const getAllOrdersAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const totalOrders = await Order.countDocuments();
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            orders,
            totalPages: Math.ceil(totalOrders / parseInt(limit)),
            currentPage: parseInt(page),
            totalOrders
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al listar pedidos' });
    }
};

module.exports = { createOrder, trackOrder, trackMultipleOrders, updateOrderStatus, getAllOrdersAdmin };
