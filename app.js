const mongoose = require('mongoose');
const runSeedUsers = require('./scripts/seedUsers');
const runSeedEmployees = require('./scripts/seedEmployees');

async function initializeSystem() {
    try {
        console.log('===================================================');
        console.log('=> [APP INITIALIZER] Preparing system for testing');
        console.log('===================================================');
        
        console.log('=> [APP INITIALIZER] Connecting to MongoDB (mongodb://127.0.0.1:27017/system)...');
        await mongoose.connect('mongodb://127.0.0.1:27017/system');
        console.log('=> [APP INITIALIZER] Connection established.');

        console.log('\n--- PHASE 1: USERS ---');
        await runSeedUsers();

        console.log('\n--- PHASE 2: EMPLOYEES ---');
        await runSeedEmployees();

        console.log('\n===================================================');
        console.log('=> [APP INITIALIZER] PROCESS COMPLETED SUCCESSFULLY.');
        console.log('=> The environment is 100% clean and ready for testing.');
        console.log('===================================================');
        process.exit(0);
    } catch (error) {
        console.error('\n=> [APP INITIALIZER] Critical error during initialization:', error);
        process.exit(1);
    }
}

initializeSystem();