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

router.use(authMiddleware);

router.get('/', getEmployees);
router.post('/', createEmployee);
router.get('/trash', getDeletedEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);
router.put('/:id/restore', restoreEmployee);
router.delete('/:id', deleteEmployee);
router.delete('/:id/hard', hardDeleteEmployee);

router.get('/backup/export', backupEmployees);
router.post('/restore/import', restoreEmployeesBackup);

module.exports = router;
