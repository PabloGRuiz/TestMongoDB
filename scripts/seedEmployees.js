const mongoose = require('mongoose');
const Employee = require('../src/models/Employee');
const Attribute = require('../src/models/Attribute');
const fs = require('fs');
const path = require('path');

const positions = [
  'Backend Developer', 'Frontend Developer', 'HR Analyst', 
  'Project Manager', 'DevOps Engineer', 'Data Analyst', 'UX/UI Designer'
];

const healthInsurances = ['OSDE 310', 'Galeno 220', 'Swiss Medical', 'Sancor Salud'];

async function runSeedEmployees() {
    console.log('=> [SEED EMPLOYEES] Starting employee seeding...');
    
    try {
        await Employee.collection.drop();
        console.log('=> [SEED EMPLOYEES] Employees collection dropped.');
    } catch (e) {
        if (e.code === 26) {
            console.log('=> [SEED EMPLOYEES] Employees collection does not exist yet.');
        } else {
            throw e;
        }
    }

    try {
        await Attribute.collection.drop();
        console.log('=> [SEED EMPLOYEES] Attributes collection dropped.');
    } catch (e) {
        if (e.code !== 26) throw e;
    }

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
        additionalInfo: [
          { k: 'health_insurance', v: healthInsurances[Math.floor(Math.random() * healthInsurances.length)] },
          { k: 'equipment', v: i % 2 === 0 ? 'Lenovo Notebook, 16GB RAM' : 'MacBook Pro M2' },
          { k: 'advanced_english', v: i % 3 === 0 ? 'Yes' : 'No' }
        ],
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

    const attributeDocs = [
        { name: 'health_insurance' },
        { name: 'equipment' },
        { name: 'advanced_english' }
    ];
    await Attribute.create(attributeDocs);
    console.log(`=> [SEED EMPLOYEES] Saved ${attributeDocs.length} attributes in the dictionary.`);
}

module.exports = runSeedEmployees;
