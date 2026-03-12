const express = require('express');
const router = express.Router();
const { generateQuote } = require('../controllers/aiController');

// Ruta libre para cotizar. Más adelante puede protegerse si solo usuarios logueados pueden cotizar.
router.post('/quote', generateQuote);

module.exports = router;
