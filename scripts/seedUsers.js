const mongoose = require('mongoose');
const User = require('../src/models/User');

async function runSeedUsers() {
    console.log('=> [SEED USERS] Starting user seeding...');
    
    await User.deleteMany({});
    console.log('=> [SEED USERS] Users collection cleared.');

    const admin = new User({
        userId: 'admin-01',
        name: 'Main Administrator',
        email: 'admin@system.com',
        password: 'adminpassword123',
        role: 'Admin'
    });

    const user = new User({
        userId: 'user-01',
        name: 'Standard User',
        email: 'user@system.com',
        password: 'userpassword123',
        role: 'User'
    });

    await admin.save();
    await user.save();
    
    console.log('=> [SEED USERS] Users generated successfully:');
    console.log('   - Admin: admin@system.com / adminpassword123');
    console.log('   - User: user@system.com / userpassword123');
}

module.exports = runSeedUsers;
