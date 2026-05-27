const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Attribute = require('../src/models/Attribute');

let adminToken = '';
let userToken = '';
let testEmployeeId = '';

beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/system_test';
    await mongoose.connect(mongoUri);

    // Wipe clean
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Attribute.deleteMany({});

    // Seed test users
    await request(app).post('/api/register').send({
        userId: 'admin-01',
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'adminpassword123',
        role: 'Admin'
    });

    await request(app).post('/api/register').send({
        userId: 'user-01',
        name: 'Regular User',
        email: 'user@test.com',
        password: 'userpassword123',
        role: 'User'
    });

    // Login users to get tokens
    const adminLoginRes = await request(app).post('/api/login').send({
        email: 'admin@test.com',
        password: 'adminpassword123'
    });
    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app).post('/api/login').send({
        email: 'user@test.com',
        password: 'userpassword123'
    });
    userToken = userLoginRes.body.token;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Employee Endpoints (/api/employees)', () => {
    const newEmployeeData = {
        employeeId: 'LEG-9999',
        fullName: 'Jane Doe',
        position: 'Senior Engineer',
        contact: {
            email: 'jane.doe@company.com',
            phone: '555-1234'
        },
        additionalInfo: [
            { k: 'obraSocial', v: 'OSDE 310' },
            { k: 'shirtSize', v: 'M' }
        ]
    };

    describe('Security checks (No / Invalid token)', () => {
        it('should reject requests without a token with 401 Unauthorized', async () => {
            const response = await request(app).get('/api/employees');
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Token not provided.');
        });

        it('should reject requests with an invalid token with 401 Unauthorized', async () => {
            const response = await request(app)
                .get('/api/employees')
                .set('Authorization', 'Bearer invalidtokenhere');
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid token.');
        });
    });

    describe('Admin operations (Full Access)', () => {
        it('should allow an Admin to create an employee with dynamic attributes', async () => {
            const response = await request(app)
                .post('/api/employees')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newEmployeeData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Employee created successfully');
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.fullName).toBe(newEmployeeData.fullName);
            expect(response.body.data.employeeId).toBe(newEmployeeData.employeeId);
            
            // Validate Attribute Pattern storage
            expect(Array.isArray(response.body.data.additionalInfo)).toBe(true);
            expect(response.body.data.additionalInfo.length).toBe(2);
            expect(response.body.data.additionalInfo[0]).toEqual(
                expect.objectContaining({ k: 'obraSocial', v: 'OSDE 310' })
            );

            // Store ID for future tests
            testEmployeeId = response.body.data._id;

            // Verify global attribute dictionary upsert
            const attrsInDb = await Attribute.find({});
            const keys = attrsInDb.map(a => a.name);
            expect(keys).toContain('obraSocial');
            expect(keys).toContain('shirtSize');
        });

        it('should fetch the list of active employees with pagination details', async () => {
            const response = await request(app)
                .get('/api/employees')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toEqual(
                expect.objectContaining({
                    currentPage: 1,
                    totalItems: 1,
                    limit: 10
                })
            );
            expect(response.body.data[0].employeeId).toBe(newEmployeeData.employeeId);
        });

        it('should fetch a single employee by ID', async () => {
            const response = await request(app)
                .get(`/api/employees/${testEmployeeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body._id).toBe(testEmployeeId);
            expect(response.body.fullName).toBe(newEmployeeData.fullName);
        });

        it('should allow an Admin to update employee details and dynamic attributes', async () => {
            const updatedData = {
                ...newEmployeeData,
                fullName: 'Jane Smith',
                additionalInfo: [
                    { k: 'obraSocial', v: 'Swiss Medical' },
                    { k: 'shirtSize', v: 'M' },
                    { k: 'bloodType', v: 'O+' }
                ]
            };

            const response = await request(app)
                .put(`/api/employees/${testEmployeeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Employee updated successfully');
            expect(response.body.data.fullName).toBe('Jane Smith');
            expect(response.body.data.additionalInfo.length).toBe(3);
            expect(response.body.data.additionalInfo[0].v).toBe('Swiss Medical');
            
            // Verify new attribute registered in global list
            const attrsInDb = await Attribute.find({});
            const keys = attrsInDb.map(a => a.name);
            expect(keys).toContain('bloodType');
        });
    });

    describe('Role-Based Access Control (Regular User restrictions)', () => {
        it('should allow a regular user to read employees', async () => {
            const response = await request(app)
                .get('/api/employees')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(1);
        });

        it('should prevent a regular user from updating an employee (403 Forbidden)', async () => {
            const response = await request(app)
                .put(`/api/employees/${testEmployeeId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ fullName: 'Hack Attempt' });

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error', 'Access denied. Administrator role is required.');
        });

        it('should prevent a regular user from viewing the trash (403 Forbidden)', async () => {
            const response = await request(app)
                .get('/api/employees/trash')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error', 'Access denied');
        });
    });

    describe('Soft-delete and Restoration Flow (Admin only)', () => {
        it('should allow soft-deleting an employee (moves to trash)', async () => {
            // Soft delete
            const deleteRes = await request(app)
                .delete(`/api/employees/${testEmployeeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteRes.status).toBe(200);
            expect(deleteRes.body).toHaveProperty('message', 'Employee sent to trash');

            // Verify it is not in the active employees list
            const listRes = await request(app)
                .get('/api/employees')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(listRes.body.data.length).toBe(0);

            // Verify it is in the trash
            const trashRes = await request(app)
                .get('/api/employees/trash')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(trashRes.status).toBe(200);
            expect(trashRes.body.length).toBe(1);
            expect(trashRes.body[0]._id).toBe(testEmployeeId);
        });

        it('should allow restoring an employee from the trash', async () => {
            const restoreRes = await request(app)
                .put(`/api/employees/${testEmployeeId}/restore`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(restoreRes.status).toBe(200);
            expect(restoreRes.body).toHaveProperty('message', 'Employee restored successfully');

            // Verify it is active again
            const listRes = await request(app)
                .get('/api/employees')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(listRes.body.data.length).toBe(1);
        });

        it('should allow hard-deleting an employee permanently', async () => {
            const hardDeleteRes = await request(app)
                .delete(`/api/employees/${testEmployeeId}/hard`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(hardDeleteRes.status).toBe(200);
            expect(hardDeleteRes.body).toHaveProperty('message', 'Employee permanently deleted');

            // Verify completely gone
            const checkRes = await request(app)
                .get(`/api/employees/${testEmployeeId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(checkRes.status).toBe(404);
        });
    });
});
