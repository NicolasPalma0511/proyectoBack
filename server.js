const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { auth, admin } = require('./middleware/auth');
const { register, login } = require('./controllers/authController');
const Envio = require('./models/Envio');
const User = require('./models/User');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Conectar a MongoDB
mongoose.connect('mongodb+srv://nicolaspalma:sUVKw8JajP1YVOVT@cluster0.lepkpnb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Inicializar el administrador si no existe
const initializeAdmin = async () => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      const newAdmin = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      });
      await newAdmin.save();
      console.log('Administrador inicializado con éxito');
    } else {
      console.log('El administrador ya existe');
    }
  } catch (err) {
    console.error('Error al inicializar el administrador:', err);
  }
};

initializeAdmin();

// Rutas de autenticación
app.post('/register', register);
app.post('/login', login);

// Ruta para crear un administrador (protegida)
app.post('/create-admin', auth, admin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const newAdmin = new User({
      username,
      password,
      role: 'admin',
    });
    await newAdmin.save();
    res.status(201).json({ message: 'Administrador creado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al crear administrador' });
  }
});

// Rutas protegidas de envíos
app.get('/envios', auth, async (req, res) => {
  const envios = await Envio.find();
  res.json(envios);
});

// Ruta protegida para obtener un envío por ID
app.get('/envios/:id', auth, async (req, res) => {
  try {
    const envio = await Envio.findById(req.params.id);
    if (!envio) {
      return res.status(404).json({ message: 'Envío no encontrado' });
    }
    res.json(envio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});


// Rutas protegidas solo para administradores
app.post('/envios', auth, async (req, res) => {
  try {
    const nuevoEnvio = new Envio({
      ...req.body,
      creadoPor: req.user.id,
      actualizadoPor: req.user.id,
    });
    await nuevoEnvio.save();
    res.json(nuevoEnvio);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear el envío' });
  }
});

app.put('/envios/:id', auth, async (req, res) => {
  try {
    const envioActualizado = await Envio.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        actualizadoPor: req.user.id,
        fechaActualizacion: Date.now(),
      },
      { new: true }
    );
    res.json(envioActualizado);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar el envío' });
  }
});

app.delete('/envios/:id', auth, admin, async (req, res) => {
  try {
    await Envio.findByIdAndDelete(req.params.id);
    res.json({ message: 'Envio eliminado' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar el envío' });
  }
});

// Ruta para que los usuarios actualicen el estado de los envíos
app.patch('/envios/:id/estado', auth, async (req, res) => {
  try {
    const { estado } = req.body;
    const envioActualizado = await Envio.findByIdAndUpdate(
      req.params.id,
      { estado, actualizadoPor: req.user.id, fechaActualizacion: Date.now() },
      { new: true }
    );
    res.json(envioActualizado);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar el estado del envío' });
  }
});

app.patch('/envios/:id', auth, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validación mínima: al menos uno de los campos debe estar presente para actualizar
    if (!nombre && !descripcion) {
      return res.status(400).json({ message: 'Se requiere al menos nombre o descripción para actualizar.' });
    }

    const envioActualizado = await Envio.findByIdAndUpdate(
      req.params.id,
      {
        ...(nombre && { nombre }), // Actualiza nombre si existe en el body
        ...(descripcion && { descripcion }), // Actualiza descripcion si existe en el body
        actualizadoPor: req.user.id,
        fechaActualizacion: Date.now(),
      },
      { new: true }
    );

    if (!envioActualizado) {
      return res.status(404).json({ message: 'Envío no encontrado' });
    }

    res.json(envioActualizado);
  } catch (err) {
    console.error('Error al actualizar el envío:', err);
    res.status(400).json({ message: 'Error al actualizar el envío' });
  }
});


// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
