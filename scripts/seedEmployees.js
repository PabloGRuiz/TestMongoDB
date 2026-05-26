const mongoose = require('mongoose');
const Employee = require('../src/models/Employee');
const fs = require('fs');
const path = require('path');

const positions = [
  'Backend Developer', 'Frontend Developer', 'HR Analyst', 
  'Project Manager', 'DevOps Engineer', 'Data Analyst', 'UX/UI Designer'
];

const healthInsurances = ['OSDE 310', 'Galeno 220', 'Swiss Medical', 'Sancor Salud'];

async function runSeedEmployees() {
    console.log('=> [SEED EMPLOYEES] Starting employee seeding...');
    
    await Employee.deleteMany({});
    console.log('=> [SEED EMPLOYEES] Employees collection cleared.');

    const mockEmployees = [];

    for (let i = 1; i <= 100; i++) {
      const empNumber = String(i).padStart(3, '0');
      const randomPosition = positions[Math.floor(Math.random() * positions.length)];
      
      mockEmployees.push({
        employeeId: `EMP-2026-${empNumber}`,
        fullName: `Employee Number ${i}`,
        position: randomPosition,
        contact: {
          email: `employee${i}@company.com`,
          phone: `11${Math.floor(10000000 + Math.random() * 90000000)}`
        },
        additionalInfo: {
          health_insurance: healthInsurances[Math.floor(Math.random() * healthInsurances.length)],
          equipment: i % 2 === 0 ? 'Lenovo Notebook, 16GB RAM' : 'MacBook Pro M2',
          advanced_english: i % 3 === 0 ? 'Yes' : 'No'
        },
        hireDate: new Date(Date.now() - Math.random() * 31536000000),
        isActive: true,
        deletedAt: null
      });
    }

    const filePath = path.join(__dirname, '../employees.json');
    fs.writeFileSync(filePath, JSON.stringify(mockEmployees, null, 2));
    console.log(`=> [SEED EMPLOYEES] Saved 100 employees physically in file: employees.json`);

    await Employee.create(mockEmployees);
    console.log('=> [SEED EMPLOYEES] Success! 100 employees injected into the "system" database.');
}

module.exports = runSeedEmployees;
