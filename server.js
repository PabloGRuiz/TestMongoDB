const express = require('express')
const mongoose = require('mongoose')
const Legajo = require('./legajoSchema')

const app = express()
app.use(express.json())
app.use(express.static('public'))

mongoose.connect('mongodb://127.0.0.1:27017/system')
    .then(() => console.log("=> MongoDB Conectado"))
    .catch(err => console.log("Error de conexión:", err));

app.post('/api/legajos', async (req, res) => {
    try {
        const nuevoLegajo = new Legajo(req.body);
        await nuevoLegajo.save();

        res.status(201).json({ mensaje: "Legajo creado con éxito", data: nuevoLegajo });
    } catch (error) {
        res.status(400).json({ error: "Error al guardar", detalle: error.message });
    }
});

app.get('/api/legajos', async (req, res) => {
    try {
        const legajos = await Legajo.find().sort({ fecha_ingreso: -1 });
        res.json(legajos); // <- ESTA ES LA LÍNEA MÁGICA QUE FALTABA
    } catch (error) {
        res.status(500).json({ error: "Error al obtener legajos" });
    }
});

app.delete('/api/legajos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Buscamos el documento por su ID de Mongo y lo destruimos
        await Legajo.findByIdAndDelete(id);
        res.json({ mensaje: "Legajo eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el legajo" });
    }
});

app.listen(3000, () => {
    console.log("=> Servidor web corriendo en http://localhost:3000");
});