const SystemConfig = require('../models/SystemConfig');

// Obtener Configuración Actual (Público/Interno para el IA)
const getConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) {
            // Crea una por defecto si no existe
            config = new SystemConfig();
            await config.save();
        }
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la configuración del sistema' });
    }
};

// Actualizar Configuración (Solo Admin)
const updateConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();
        if (!config) {
            config = new SystemConfig(req.body);
        } else {
            Object.assign(config, req.body);
        }
        await config.save();
        res.status(200).json(config);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar configuración', details: error.message });
    }
};

module.exports = { getConfig, updateConfig };
