const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

beforeAll(async () => {
    // Connect to a test database so we don't touch development/production data
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/system_test';
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    // Close the connection clean and nice
    await mongoose.connection.close();
});

beforeEach(async () => {
    // Clear the users collection before each test to ensure isolation
    await User.deleteMany({});
});

describe('Authentication Endpoints (/api/register, /api/login)', () => {
    
    const validUserData = {
        userId: 'test-admin',
        name: 'Test Administrator',
        email: 'testadmin@system.com',
        password: 'securePassword123',
        role: 'Admin'
    };

    describe('POST /api/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/register')
                .send(validUserData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'User registered successfully');

            // Verify in db
            const userInDb = await User.findOne({ email: validUserData.email });
            expect(userInDb).toBeDefined();
            expect(userInDb.name).toBe(validUserData.name);
            expect(userInDb.role).toBe(validUserData.role);
        });

        it('should fail to register a user with a duplicate email', async () => {
            // Register first user
            await request(app).post('/api/register').send(validUserData);

            // Register second user with same email but different ID
            const duplicateUser = {
                ...validUserData,
                userId: 'test-admin-2',
                name: 'Another Admin'
            };

            const response = await request(app)
                .post('/api/register')
                .send(duplicateUser);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Email is already registered.');
        });
    });

    describe('POST /api/login', () => {
        beforeEach(async () => {
            // Seed a user before each test in this suite
            await request(app).post('/api/register').send(validUserData);
        });

        it('should authenticate an existing user and return a JWT token', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: validUserData.email,
                    password: validUserData.password
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('token');
            expect(typeof response.body.token).toBe('string');
        });

        it('should fail login when providing an incorrect password', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: validUserData.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should fail login when providing a non-existent email', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: 'nonexistent@system.com',
                    password: validUserData.password
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });
    });
});
