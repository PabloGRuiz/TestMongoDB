require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`=> Web server running at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Critical failure: Could not connect to database.", err);
    process.exit(1);
});