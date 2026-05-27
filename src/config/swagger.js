const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Employee Management System API',
            version: '1.0.0',
            description: 'Comprehensive documentation of endpoints for the Employee Management System, including Authentication, Employee CRUD, and Dynamic Attributes dictionary.',
            contact: {
                name: 'Pablo Ruiz',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token to authorize access to protected endpoints.',
                },
            },
        },
    },
    apis: [path.join(__dirname, '../routes/*.js')], // Scan JSDoc comments in routes files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
