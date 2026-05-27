const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
    getEmployees,
    createEmployee,
    deleteEmployee,
    backupEmployees,
    restoreEmployeesBackup,
    getEmployeeById,
    updateEmployee,
    getDeletedEmployees,
    restoreEmployee,
    hardDeleteEmployee
} = require('../controllers/employeeController');

// Secure all employee routes with JWT auth middleware
router.use(authMiddleware);

/**
 * @openapi
 * components:
 *   schemas:
 *     Attribute:
 *       type: object
 *       required:
 *         - k
 *         - v
 *       properties:
 *         k:
 *           type: string
 *           description: The dynamic attribute key/name (using the Attribute Pattern)
 *           example: obraSocial
 *         v:
 *           type: string
 *           description: The dynamic attribute value
 *           example: OSDE 310
 *     EmployeeInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - fileNumber
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@company.com
 *         fileNumber:
 *           type: string
 *           description: Unique employee identifier number (legajo)
 *           example: LEG-4820
 *         additionalInfo:
 *           type: array
 *           description: Dynamic fields structured strictly using the Attribute Pattern
 *           items:
 *             $ref: '#/components/schemas/Attribute'
 *     Employee:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john.doe@company.com
 *         fileNumber:
 *           type: string
 *           example: LEG-4820
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         additionalInfo:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attribute'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/employees:
 *   get:
 *     summary: Retrieve a paginated list of active employees
 *     description: Gets all employees that are not soft-deleted. Supports full-text search, filtering by dynamic attribute keys and values, and custom pagination.
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or fileNumber
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         description: Dynamic attribute key to filter by (e.g. obraSocial)
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         description: Dynamic attribute value to filter by (requires key to be specified)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Paginated employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 totalEmployees:
 *                   type: integer
 *                   example: 15
 *                 limit:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized
 */
router.get('/', getEmployees);

/**
 * @openapi
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     description: Registers a new employee with basic details and dynamic metadata (Attribute Pattern).
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Bad Request - Missing required fields or duplicate file number
 *       401:
 *         description: Unauthorized
 */
router.post('/', createEmployee);

/**
 * @openapi
 * /api/employees/trash:
 *   get:
 *     summary: View soft-deleted employees
 *     description: Retrieves the list of all employees currently in the recycling bin (isDeleted = true).
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Trash list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Unauthorized
 */
router.get('/trash', getDeletedEmployees);

/**
 * @openapi
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     description: Fetches all detailed information for a single employee using their MongoDB ID.
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The employee MongoDB ID
 *     responses:
 *       200:
 *         description: Employee details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', getEmployeeById);

/**
 * @openapi
 * /api/employees/{id}:
 *   put:
 *     summary: Update an employee
 *     description: Modifies an existing employee's details or dynamic attributes.
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The employee MongoDB ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', updateEmployee);

/**
 * @openapi
 * /api/employees/{id}/restore:
 *   put:
 *     summary: Restore a soft-deleted employee
 *     description: Restores an employee from the trash back to the active listing.
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The employee MongoDB ID
 *     responses:
 *       200:
 *         description: Employee restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee restored successfully
 *       404:
 *         description: Employee not found in trash
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/restore', restoreEmployee);

/**
 * @openapi
 * /api/employees/{id}:
 *   delete:
 *     summary: Soft-delete an employee
 *     description: Moves an employee to the trash. The employee is hidden from the main list but can still be restored.
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The employee MongoDB ID
 *     responses:
 *       200:
 *         description: Employee moved to trash successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee moved to trash
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', deleteEmployee);

/**
 * @openapi
 * /api/employees/{id}/hard:
 *   delete:
 *     summary: Permanently delete an employee
 *     description: Completely removes the employee record from the database. This action is irreversible.
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The employee MongoDB ID
 *     responses:
 *       200:
 *         description: Employee deleted permanently
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee deleted permanently from database
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id/hard', hardDeleteEmployee);

/**
 * @openapi
 * /api/employees/backup/export:
 *   get:
 *     summary: Export all active employee records as JSON
 *     description: Exports the current state of active employees to a backup file for disaster recovery or migrations.
 *     tags:
 *       - Backup
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Backup generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Backup generated successfully
 *                 filename:
 *                   type: string
 *                   example: backup_legajos_2026-05-27.json
 *                 count:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized
 */
router.get('/backup/export', backupEmployees);

/**
 * @openapi
 * /api/employees/restore/import:
 *   post:
 *     summary: Import and restore employees from a JSON backup file
 *     description: Overwrites or appends employee records from a JSON file backup.
 *     tags:
 *       - Backup
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Backup restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employees backup restored successfully
 *                 importedCount:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized
 */
router.post('/restore/import', restoreEmployeesBackup);

module.exports = router;
