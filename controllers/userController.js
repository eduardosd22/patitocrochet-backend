const User = require('../models/User');

// Sincronizar/Crear usuario de Firebase en nuestra BD local
const syncUser = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.user; // viene del verifyToken middleware

    // Buscar si ya existe, si no, crearlo (upsert)
    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.create({
        uid,
        email,
        name: name || email.split('@')[0],
        photoURL: photoURL || '',
        role: 'client' // Por defecto cliente; admin se asigna manualmente en BD
      });
      console.log(`Nuevo usuario creado: ${email}`);
    } else {
      // Actualizar nombre/foto en cada login (puede cambiar en Google)
      user.name = name || user.name;
      user.photoURL = photoURL || user.photoURL;
      await user.save();
    }

    res.json({
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.role,
      photoURL: user.photoURL
    });
  } catch (error) {
    console.error('Error al sincronizar usuario:', error);
    res.status(500).json({ error: 'Error al sincronizar usuario' });
  }
};

// Obtener perfil del usuario actual
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// Actualizar perfil del usuario
const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { name, phone, address },
      { new: true }
    ).select('-__v');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

module.exports = { syncUser, getMyProfile, updateMyProfile };

