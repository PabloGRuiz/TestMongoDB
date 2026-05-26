const mongoose = require('mongoose');

const conectarDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/system');
        console.log("=> MongoDB Conectado");
    } catch (error) {
        console.error("Error de conexión a MongoDB:", error.message);
        process.exit(1);
    }
};

module.exports = conectarDB;
