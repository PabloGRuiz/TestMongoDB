const mongoose = require("mongoose");
const Legajo = require("./legajoSchema")
const MONGO_URI = 'mongodb://localhost:27017/system'

async function iniciarSistema() {

    try {

        await mongoose.connect(MONGO_URI);
        console.log('=> ¡Conectado con éxito a MongoDB Local!');
        await Legajo.deleteMany({});

        const empleadoSistemas = new Legajo({
            legajo_id: 'LEG-2026-001',
            nombre: 'Esteban Quito',
            puesto: 'Backend Developer',
            contacto: { email: 'esteban@empresa.com', telefono: '1123456789' },
            informacion_adicional: {
                skills: ['Node.js', 'Docker', 'Git'],
                equipamiento: { tipo: 'Notebook', marca: 'Lenovo', ram_gb: 16 },
                ingles_avanzado: true
            }
        });

        const empleadoAdmin = new Legajo({
            legajo_id: 'LEG-2026-002',
            nombre: 'Ana Clara Ruiz',
            puesto: 'Analista de RRHH',
            contacto: { email: 'anaclara@empresa.com' },
            informacion_adicional: {
                obra_social: 'OSDE 310',
                grupo_sanguineo: 'A+',
                sindicato: 'Sindicato de Comercio',
                familiares_a_cargo: 2
            }
        });

        await empleadoSistemas.save()
        console.log("Legajo guardado!")

        await empleadoAdmin.save()
        console.log("Legajo guardado!")
    } catch (error) {
        console.error('Hubo un error en el proceso:', error);
    } finally {
        await mongoose.disconnect();
        console.log('=> Desconectado de MongoDB.');
    }

}

iniciarSistema()