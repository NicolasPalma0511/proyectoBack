const mongoose = require('mongoose');

const envioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    destino: { type: String, required: true, enum: ['Lima', 'Cusco', 'Trujillo', 'Arequipa'] }, // Enumera los destinos disponibles
    estado: { type: String, enum: ['pendiente', 'enviado', 'en camino', 'entregado', 'cancelado'], default: 'pendiente' },
    precio: { type: Number, required: true },
    toneladas: { type: Number, required: true },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Envio = mongoose.model('Envio', envioSchema);

module.exports = Envio;
