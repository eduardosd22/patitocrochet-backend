const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name:                { type: String, required: true },
    description:         { type: String, required: true },
    price:               { type: Number, required: true },
    category:            { type: String, required: true },
    imageUrl:            { type: String, default: '' },        // URL de imagen principal
    images:              [{ type: String }],                    // Galería extra
    stock:               { type: Number, default: 99 },         // Unidades disponibles
    available:           { type: Boolean, default: true },      // Disponible para ordenar
    customizationOptions:{ type: [String] },
    keywords:            { type: [String], default: [] },       // Palabras clave de búsqueda
    isActive:            { type: Boolean, default: true }       // Soft delete
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

