require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Fix global para Render Nodemailer ENETUNREACH
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Importar rutas
const aiRoutes      = require('./routes/aiRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes   = require('./routes/orderRoutes');
const configRoutes  = require('./routes/configRoutes');
const userRoutes    = require('./routes/userRoutes');
const statsRoutes   = require('./routes/statsRoutes');
const uploadRoutes  = require('./routes/uploadRoutes');

// Conectar a Base de Datos
connectDB();

const app = express();

// Confía en el proxy de Render para que express-rate-limit pueda leer las IPs correctamente
app.set('trust proxy', 1);

// Middlewares basicos
app.use(cors());
app.use(express.json());

// Configuracion de Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 150, // Limite de 150 requests por IP cada 15 min
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.' }
});

const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // Limite de 10 pedidos por IP cada 10 min
  message: { error: 'Has excedido el límite de creación de pedidos. Intenta más tarde.' }
});

// Aplicar limiter global a todas las rutas de la API
app.use('/api/', globalLimiter);

// Servir imágenes subidas como archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Montar Rutas
app.use('/api/ai',       aiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders/create', strictLimiter); // Aplicar limiter estricto a creación
app.use('/api/orders',   orderRoutes);
app.use('/api/config',   configRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/stats',    statsRoutes);
app.use('/api/uploads',  uploadRoutes);

// Health check
app.get('/', (req, res) => res.send('API Patito Crochet en funcionamiento ✅'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
