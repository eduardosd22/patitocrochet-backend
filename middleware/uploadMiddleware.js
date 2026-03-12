const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta de destino
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E5)}${ext}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

module.exports = upload;
