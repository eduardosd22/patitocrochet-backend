const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Si es de catálogo
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    isAIGenerated: { type: Boolean, default: false },
    customDetails: { type: String }
});

const orderSchema = new mongoose.Schema({
    orderCode: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null si el cliente compró como invitado (Flujo A.3)
    clientData: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String }
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'on_hold', 'in_progress', 'completed'],
        default: 'pending'
    },
    requestedDate: { type: Date, required: true }, // Fecha para validación de cupos/agenda
    requiresAdminValidation: { type: Boolean, default: false } // RN-01: Inmutabilidad de precios IA
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
