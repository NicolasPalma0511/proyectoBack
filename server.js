const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const { auth, admin } = require('./middleware/auth');
const { register, login } = require('./controllers/authController');
const Envio = require('./models/Envio');
const User = require('./models/User');

const app = express();

// Configurar cors
const corsOptions = {
  origin: 'http://localhost:19006', // Ajustar al origen correcto de tu frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'], // Encabezados permitidos
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

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
  try {
    let envios;
    if (req.user.role === 'admin') {
      envios = await Envio.find();
    } else {
      envios = await Envio.find({ creadoPor: req.user.id });
    }
    res.json(envios);
  } catch (error) {
    console.error('Error fetching envios:', error);
    res.status(500).json({ message: 'Error fetching envios' });
  }
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

// Ruta para crear un envío
app.post('/envios', auth, async (req, res) => {
  try {
    const { titulo, descripcion, destino, estado, precio, toneladas, nombreUsuario, apellidoUsuario, nmrOperacion } = req.body;

    const nuevoEnvio = new Envio({
      titulo,
      descripcion,
      destino,
      estado,
      precio,
      toneladas,
      nombreUsuario,
      apellidoUsuario,
      nmrOperacion,
      creadoPor: req.user.id,
      actualizadoPor: req.user.id,
    });

    await nuevoEnvio.save(); // Guardar el nuevo envío en la base de datos
    res.json(nuevoEnvio); // Devolver el nuevo envío como respuesta
  } catch (err) {
    console.error(err);
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
    res.json({ message: 'Envío eliminado' });
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
    const { toneladas, precio } = req.body;

    // Validación mínima: toneladas debe estar presente para actualizar
    if (!toneladas) {
      return res.status(400).json({ message: 'Se requiere toneladas para actualizar.' });
    }

    const envio = await Envio.findById(req.params.id);

    if (!envio) {
      return res.status(404).json({ message: 'Envío no encontrado' });
    }

    // Actualizar envío en la base de datos
    envio.toneladas = parseFloat(toneladas);
    envio.precio = parseFloat(precio); // El precio ya está calculado en el frontend
    envio.actualizadoPor = req.user.id;
    envio.fechaActualizacion = Date.now();

    const envioActualizado = await envio.save();

    res.json(envioActualizado);
  } catch (err) {
    console.error('Error al actualizar el envío:', err);
    res.status(400).json({ message: 'Error al actualizar el envío' });
  }
});



// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
