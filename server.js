const express = require('express');
const conectarDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');

const app = express();

// Connect to Local MongoDB
conectarDB();

// Global Middlewares
app.use(express.json());
app.use(express.static('public'));

// API Endpoints
app.use('/api', authRoutes);
app.use('/api/employees', employeeRoutes);

// Start server on Port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=> Web server running at http://localhost:${PORT}`);
});