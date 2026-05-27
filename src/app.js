const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attributeRoutes = require('./routes/attributeRoutes');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Endpoints
app.use('/api', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attributes', attributeRoutes);

module.exports = app;
