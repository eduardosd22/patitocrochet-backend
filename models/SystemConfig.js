const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    hourlyRate: { type: Number, default: 100 },
    baseMaterialCost: { type: Number, default: 50 },
    weeklySlots: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
