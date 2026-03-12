const Product = require('../models/Product');

// Crear producto nuevo (Solo Admin)
const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: 'Error al crear producto', details: error.message });
    }
};

// Obtener todos los productos activos (Público) con filtrado y paginación
const getProducts = async (req, res) => {
    try {
        const { search, category, page = 1, limit = 12 } = req.query;
        let query = { isActive: true, available: true };

        if (category && category !== 'todos') {
            query.category = category;
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { name: regex },
                { description: regex },
                { keywords: regex },
                { customizationOptions: regex }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            products,
            totalPages: Math.ceil(totalProducts / parseInt(limit)),
            currentPage: parseInt(page),
            totalProducts
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
};

// Obtener un solo producto (Público)
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, isActive: true });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener producto' });
    }
};

// Obtener TODOS los productos incluyendo inactivos (Solo Admin)
const getAllProductsAdmin = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos para admin' });
    }
};

// Modificar un producto (Solo Admin)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar producto', details: error.message });
    }
};

// Soft Delete de producto (Solo Admin) - RNF-04
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        res.status(200).json({ message: 'Producto desactivado (Soft Delete) correctamente', product });
    } catch (error) {
        res.status(500).json({ error: 'Error al intentar eliminar producto' });
    }
};

module.exports = { createProduct, getProducts, getProductById, getAllProductsAdmin, updateProduct, deleteProduct };
