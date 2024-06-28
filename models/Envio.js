const mongoose = require('mongoose');

const envioSchema = new mongoose.Schema({
    descripcion: { type: String, required: true },
    destino: { type: String, required: true, enum: ['Lima', 'Cusco', 'Trujillo', 'Arequipa'] },
    toneladas: { type: Number, required: true },
    precio: { type: Number, required: true },
    estado: { type: String, enum: ['pendiente', 'enviado', 'en camino', 'entregado', 'cancelado'], default: 'pendiente' },
    nombreUsuario: { type: String, required: true },
    apellidoUsuario: { type: String, required: true },
    nmrOperacion: { type: String, required: true },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Envio = mongoose.model('Envio', envioSchema);

module.exports = Envio;
