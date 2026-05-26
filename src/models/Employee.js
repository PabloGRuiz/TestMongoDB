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
    additionalInfo: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema, 'employees');
