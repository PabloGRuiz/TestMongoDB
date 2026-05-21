const mongoose = require('mongoose');
const LegajoSchema = new mongoose.Schema({
    legajo_id: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    puesto: { type: String, required: true },
    fecha_ingreso: { type: Date, default: Date.now },
    contacto: {
        email: String,
        telefono: String
    },
    informacion_adicional: mongoose.Schema.Types.Mixed
});
module.exports = mongoose.model('Legajo', LegajoSchema, 'legajos');