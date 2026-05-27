const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    position: { type: String, required: true },
    hireDate: { type: Date, default: Date.now },
    contact: {
        email: String,
        phone: String
    },
    additionalInfo: [{
        k: { type: String, required: true },
        v: { type: String, required: true }
    }],
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema, 'employees');
