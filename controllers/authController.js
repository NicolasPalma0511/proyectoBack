const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const newUser = new User({ username, password, role });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: 'Error al registrar usuario' });
  }
};

exports.login = async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(400).json({ message: 'Usuario no encontrado' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Contraseña incorrecta' });
      }
  
      const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
  
      res.json({ token, role: user.role }); // Incluye el campo 'role' en la respuesta JSON
  
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: 'Error al iniciar sesión' });
    }
  };
