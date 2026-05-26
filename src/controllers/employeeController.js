const Employee = require('../models/Employee');

const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ isActive: { $ne: false } }).sort({ hireDate: -1 });
        return res.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        return res.status(500).json({ error: "Error fetching employees" });
    }
};

const createEmployee = async (req, res) => {
    try {
        const newEmployee = new Employee(req.body);
        await newEmployee.save();
        return res.status(201).json({ message: "Employee created successfully", data: newEmployee });
    } catch (error) {
        console.error("Error creating employee:", error);
        return res.status(400).json({ error: "Error saving employee", details: error.message });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEmployee = await Employee.findByIdAndUpdate(id, { isActive: false, deletedAt: new Date() }, { new: true });
        if (!deletedEmployee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        return res.json({ message: "Employee sent to trash" });
    } catch (error) {
        console.error("Error deleting (soft) employee:", error);
        return res.status(500).json({ error: "Error sending employee to trash" });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        return res.json(employee);
    } catch (error) {
        console.error("Error fetching employee by id:", error);
        return res.status(500).json({ error: "Error fetching employee" });
    }
};

const updateEmployee = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: "Access denied. Administrator role is required." });
        }

        const { id } = req.params;
        const updatedEmployee = await Employee.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        
        if (!updatedEmployee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        return res.json({ message: "Employee updated successfully", data: updatedEmployee });
    } catch (error) {
        console.error("Error updating employee:", error);
        return res.status(400).json({ error: "Error updating employee", details: error.message });
    }
};

const getDeletedEmployees = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: "Access denied" });
        const employees = await Employee.find({ isActive: false }).sort({ deletedAt: -1 });
        return res.json(employees);
    } catch (error) {
        console.error("Error fetching employees in trash:", error);
        return res.status(500).json({ error: "Error fetching trash" });
    }
};

const restoreEmployee = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: "Access denied" });
        const { id } = req.params;
        const restoredEmployee = await Employee.findByIdAndUpdate(id, { isActive: true, deletedAt: null }, { new: true });
        if (!restoredEmployee) return res.status(404).json({ error: "Employee not found" });
        return res.json({ message: "Employee restored successfully" });
    } catch (error) {
        console.error("Error restoring employee:", error);
        return res.status(500).json({ error: "Error restoring employee" });
    }
};

const hardDeleteEmployee = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ error: "Access denied" });
        const { id } = req.params;
        const deletedEmployee = await Employee.findByIdAndDelete(id);
        if (!deletedEmployee) return res.status(404).json({ error: "Employee not found" });
        return res.json({ message: "Employee permanently deleted" });
    } catch (error) {
        console.error("Error deleting employee permanently:", error);
        return res.status(500).json({ error: "Error deleting employee permanently" });
    }
};

const backupEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({});
        return res.json(employees);
    } catch (error) {
        console.error("Error backing up employees:", error);
        return res.status(500).json({ error: "Error exporting backup" });
    }
};

const restoreEmployeesBackup = async (req, res) => {
    try {
        const importData = req.body;
        if (!Array.isArray(importData)) {
            return res.status(400).json({ error: "The backup file format is incorrect." });
        }

        const countDB = await Employee.countDocuments();
        
        if (importData.length < countDB) {
            const bulkOps = importData.map(emp => {
                const empData = { ...emp };
                delete empData._id; 
                
                return {
                    updateOne: {
                        filter: { employeeId: emp.employeeId },
                        update: { $set: empData },
                        upsert: true
                    }
                };
            });
            await Employee.bulkWrite(bulkOps);
            return res.json({ message: "Backup partially imported (Updated items)" });
        } else {
            await Employee.deleteMany({});
            await Employee.insertMany(importData);
            return res.json({ message: "Database completely restored from backup" });
        }
    } catch (error) {
        console.error("Error restoring employees backup:", error);
        return res.status(500).json({ error: "Error importing backup", details: error.message });
    }
};

module.exports = {
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
};
