const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true }, // Firebase UID
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    photoURL: { type: String, default: '' },
    phone: { type: String },
    address: { type: String },
    role: { type: String, enum: ['client', 'admin'], default: 'client' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
