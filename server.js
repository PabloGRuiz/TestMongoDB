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

app.get('/api/legajos/backup', authMiddleware, async (req, res) => {
    try {
        const legajos = await Legajo.find({});
        res.json(legajos);
    } catch (error) {
        res.status(500).json({ error: "Error al exportar el backup" });
    }
});

app.post('/api/legajos/restore', authMiddleware, async (req, res) => {
    try {
        const importData = req.body;
        if (!Array.isArray(importData)) {
            return res.status(400).json({ error: "El archivo de backup no tiene el formato correcto." });
        }

        const countDB = await Legajo.countDocuments();
        
        if (importData.length < countDB) {
            // Solo actualizar e insertar los importados sin borrar los existentes
            const bulkOps = importData.map(leg => {
                // Removemos _id para evitar errores de inmutabilidad si cambian
                const legData = { ...leg };
                delete legData._id;
                
                return {
                    updateOne: {
                        filter: { legajo_id: leg.legajo_id },
                        update: { $set: legData },
                        upsert: true
                    }
                };
            });
            await Legajo.bulkWrite(bulkOps);
            res.json({ mensaje: "Backup importado parcialmente (Actualización de elementos)" });
        } else {
            // Restauración completa
            await Legajo.deleteMany({});
            await Legajo.insertMany(importData);
            res.json({ mensaje: "Base de datos restaurada completamente desde el backup" });
        }
    } catch (error) {
        console.error("Error en restore:", error);
        res.status(500).json({ error: "Error al importar el backup", detalle: error.message });
    }
});

app.listen(3000, () => {
    console.log("=> Servidor web corriendo en http://localhost:3000");
});