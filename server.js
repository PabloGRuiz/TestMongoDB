const express = require('express')
const mongoose = require('mongoose')
const Legajo = require('./legajoSchema')
const User = require('./userSchema')
const jwt = require('jsonwebtoken')
const { authMiddleware, JWT_SECRET } = require('./authMiddleware')


const app = express()
app.use(express.json())
app.use(express.static('public'))

mongoose.connect('mongodb://127.0.0.1:27017/system')
    .then(() => console.log("=> MongoDB Conectado"))
    .catch(err => console.log("Error de conexión:", err));

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/register', async (req, res) => {
    try {
        console.log("=> [REGISTER] Intentando registrar usuario:", { ...req.body, user_password: '***' });
        const nuevoUsuario = new User(req.body);
        await nuevoUsuario.save();
        console.log("=> [REGISTER] Usuario registrado con éxito:", nuevoUsuario.user_mail);
        res.status(201).json({ mensaje: "Usuario registrado con éxito" });
    } catch (error) {
        console.error("=> [REGISTER] Error al registrar usuario:", error);
        res.status(400).json({ error: "Error al registrar usuario", detalle: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { user_mail, user_password } = req.body;
        console.log("=> [LOGIN] Intento de login para:", user_mail);
        
        const usuario = await User.findOne({ user_mail });
        if (!usuario) {
            console.log("=> [LOGIN] Usuario no encontrado:", user_mail);
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const isMatch = await usuario.comparePassword(user_password);
        if (!isMatch) {
            console.log("=> [LOGIN] Contraseña incorrecta para:", user_mail);
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const token = jwt.sign(
            { id: usuario._id, user_rol: usuario.user_rol, user_name: usuario.user_name },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        console.log("=> [LOGIN] Login exitoso para:", user_mail);
        res.json({ mensaje: "Login exitoso", token });
    } catch (error) {
        console.error("=> [LOGIN] Error en el servidor al hacer login:", error);
        res.status(500).json({ error: "Error en el servidor al hacer login" });
    }
});

// --- RUTAS DE LEGAJOS (PROTEGIDAS) ---
app.post('/api/legajos', authMiddleware, async (req, res) => {
    try {
        const nuevoLegajo = new Legajo(req.body);
        await nuevoLegajo.save();

        res.status(201).json({ mensaje: "Legajo creado con éxito", data: nuevoLegajo });
    } catch (error) {
        res.status(400).json({ error: "Error al guardar", detalle: error.message });
    }
});

app.get('/api/legajos', authMiddleware, async (req, res) => {
    try {
        const legajos = await Legajo.find().sort({ fecha_ingreso: -1 });
        res.json(legajos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener legajos" });
    }
});

app.delete('/api/legajos/:id', authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        await Legajo.findByIdAndDelete(id);
        res.json({ mensaje: "Legajo eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el legajo" });
    }
});

app.listen(3000, () => {
    console.log("=> Servidor web corriendo en http://localhost:3000");
});