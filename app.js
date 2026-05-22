const mongoose = require("mongoose");
const Legajo = require("./legajoSchema");
const MONGO_URI = 'mongodb://localhost:27017/system';

async function iniciarSistema() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('=> ¡Conectado con éxito a MongoDB Local!');
        await Legajo.deleteMany({});
        console.log('=> Colección anterior limpiada.');

        const legajosData = [
            {
                legajo_id: 'LEG-2026-001',
                nombre: 'Esteban Quito',
                puesto: 'Backend Developer',
                contacto: { email: 'esteban@empresa.com', telefono: '1123456789' },
                informacion_adicional: { skills: 'Node.js, Docker, Git', equipamiento: 'Notebook Lenovo, 16GB RAM', ingles_avanzado: 'Sí' }
            },
            {
                legajo_id: 'LEG-2026-002',
                nombre: 'Ana Clara Ruiz',
                puesto: 'Analista de RRHH',
                contacto: { email: 'anaclara@empresa.com' },
                informacion_adicional: { obra_social: 'OSDE 310', grupo_sanguineo: 'A+', sindicato: 'Sindicato de Comercio', familiares_a_cargo: '2' }
            },
            {
                legajo_id: 'LEG-2026-003',
                nombre: 'Carlos Galiano',
                puesto: 'Frontend Developer',
                contacto: { email: 'cgaliano@empresa.com', telefono: '1145678912' },
                informacion_adicional: { framework_principal: 'React', equipamiento: 'MacBook Pro M2', certificaciones: 'AWS Cloud Practitioner' }
            },
            {
                legajo_id: 'LEG-2026-004',
                nombre: 'María López',
                puesto: 'Project Manager',
                contacto: { email: 'mlopez@empresa.com' },
                informacion_adicional: { metodologia: 'Agile/Scrum', idiomas: 'Inglés, Portugués', obra_social: 'Galeno 220' }
            },
            {
                legajo_id: 'LEG-2026-005',
                nombre: 'Julio Cortázar',
                puesto: 'Technical Writer',
                contacto: { email: 'jcortazar@empresa.com', telefono: '1198765432' },
                informacion_adicional: { area: 'Documentación IT', turno: 'Mañana', tipo_contrato: 'Freelance' }
            },
            {
                legajo_id: 'LEG-2026-006',
                nombre: 'Laura Martinez',
                puesto: 'Diseñadora UX/UI',
                contacto: { email: 'lmartinez@empresa.com', telefono: '1176543210' },
                informacion_adicional: { herramientas: 'Figma, Adobe XD', portafolio: 'Behance /lmartinez', modelo_trabajo: 'Híbrido' }
            },
            {
                legajo_id: 'LEG-2026-007',
                nombre: 'Ricardo Darín',
                puesto: 'DevOps Engineer',
                contacto: { email: 'rdarin@empresa.com' },
                informacion_adicional: { cloud: 'AWS, Azure', kubernetes: 'Avanzado', guardia_pasiva: 'Sí' }
            },
            {
                legajo_id: 'LEG-2026-008',
                nombre: 'Sofía Coppola',
                puesto: 'Data Analyst',
                contacto: { email: 'scoppola@empresa.com', telefono: '1134567890' },
                informacion_adicional: { herramientas_bi: 'PowerBI, Tableau', base_datos: 'SQL Server, MongoDB', titulo: 'Licenciada en Sistemas' }
            },
            {
                legajo_id: 'LEG-2026-009',
                nombre: 'Guillermo Francella',
                puesto: 'Gerente Comercial',
                contacto: { email: 'gfrancella@empresa.com', telefono: '1155556666' },
                informacion_adicional: { region: 'Latam Sur', vehiculo_empresa: 'Sí', bono_anual: 'Incluido' }
            },
            {
                legajo_id: 'LEG-2026-010',
                nombre: 'Marta Minujín',
                puesto: 'Directora de Arte',
                contacto: { email: 'mminujin@empresa.com' },
                informacion_adicional: { departamento: 'Marketing', exposiciones: 'Internacional', alergias: 'Ninguna' }
            }
        ];

        await Legajo.insertMany(legajosData);
        console.log(`=> Se han insertado ${legajosData.length} legajos de prueba con éxito.`);

    } catch (error) {
        console.error('Hubo un error en el proceso:', error);
    } finally {
        await mongoose.disconnect();
        console.log('=> Desconectado de MongoDB.');
    }
}

iniciarSistema();