const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Initialize user data in navbar
if (token) {
    const payload = parseJwt(token);
    if (payload) {
        document.addEventListener('DOMContentLoaded', () => {
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            if (userNameEl) userNameEl.innerText = payload.name || payload.user_name || 'User';
            if (userRoleEl) userRoleEl.innerText = payload.role || payload.user_rol || 'User';
            
            if (payload.role === 'Admin' || payload.user_rol === 'Admin') {
                const btnTrash = document.getElementById('btnTrash');
                if(btnTrash) btnTrash.classList.remove('hidden');
            }
        });
    }
}

function handleAuthError(res) {
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        throw new Error('Expired or invalid session');
    }
}

let globalAttributes = [];

async function loadAttributes() {
    try {
        const response = await fetch('/api/attributes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            globalAttributes = await response.json();
            renderDatalist();
        }
    } catch (e) {
        console.error("Could not load attributes");
    }
}

function renderDatalist() {
    let datalist = document.getElementById('attributesList');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'attributesList';
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = globalAttributes.map(attr => `<option value="${attr.name}">`).join('');
}

const btnAddField = document.getElementById('btnAddField');
const fieldsContainer = document.getElementById('dynamicFieldsContainer');

if (btnAddField) {
    btnAddField.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = "flex gap-2 items-center";
        div.innerHTML = `
            <input type="text" list="attributesList" placeholder="e.g. Health Insurance" class="dynamic-key w-1/2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
            <span class="text-gray-400 dark:text-gray-500 font-bold">:</span>
            <input type="text" placeholder="e.g. OSDE" class="dynamic-value w-1/2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
            <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 font-bold px-2">X</button>
        `;
        fieldsContainer.appendChild(div);
    });
}

document.getElementById('formEmployee').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('message');
    btnSubmit.innerText = "Saving...";

    const data = {
        employeeId: document.getElementById('employeeId').value,
        fullName: document.getElementById('fullName').value,
        position: document.getElementById('position').value,
        contact: {
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        },
        additionalInfo: []
    };

    const keys = document.querySelectorAll('.dynamic-key');
    const values = document.querySelectorAll('.dynamic-value');

    keys.forEach((inputKey, index) => {
        const key = inputKey.value.trim();
        const value = values[index].value.trim();
        if (key && value) {
            data.additionalInfo.push({ k: key, v: value });
        }
    });

    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        handleAuthError(response);

        if (response.ok) {
            messageDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-green-100 text-green-700";
            messageDiv.innerText = "Employee saved successfully!";
            messageDiv.classList.remove('hidden');
            document.getElementById('formEmployee').reset();
            fieldsContainer.innerHTML = '';
            loadEmployees();
        } else {
            const errorJson = await response.json();
            throw new Error(errorJson.error);
        }
    } catch (error) {
        messageDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-red-100 text-red-700";
        messageDiv.innerText = error.message || "Error saving";
        messageDiv.classList.remove('hidden');
    } finally {
        btnSubmit.innerText = "Save to MongoDB";
    }
});

let currentPage = 1;
const itemsPerPage = 10;
let currentSearchTerm = '';

async function loadEmployees() {
    const listDiv = document.getElementById('employeesList');
    try {
        const url = `/api/employees?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(currentSearchTerm)}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        handleAuthError(response);
        const result = await response.json();
        
        renderEmployees(result.data, result.pagination);
    } catch (error) {
        listDiv.innerHTML = '<p class="text-red-500 text-sm">Error loading database.</p>';
    }
}

let searchTimeout = null;
function filterEmployees(event) {
    currentSearchTerm = event.target.value;
    currentPage = 1;
    
    // Debounce to prevent too many API requests while typing
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadEmployees();
    }, 300);
}

function changePage(delta) {
    currentPage += delta;
    loadEmployees();
}

function renderEmployees(employees, pagination) {
    const listDiv = document.getElementById('employeesList');
    const paginationDiv = document.getElementById('employeesPagination');
    
    listDiv.innerHTML = '';

    if (!employees || employees.length === 0) {
        listDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm italic transition-colors">No employees found.</p>';
        if (paginationDiv) paginationDiv.innerHTML = '';
        return;
    }

    employees.forEach(emp => {
        let extraInfoHTML = '';
        if (emp.additionalInfo && emp.additionalInfo.length > 0) {
            extraInfoHTML = `<div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 transition-colors">
                <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 transition-colors">Additional Info:</p>
                <ul class="text-xs text-gray-600 dark:text-gray-300 space-y-1 transition-colors">`;

            emp.additionalInfo.forEach(attr => {
                extraInfoHTML += `<li><span class="font-bold text-gray-800 dark:text-gray-100 transition-colors">${attr.k}:</span> ${attr.v}</li>`;
            });
            extraInfoHTML += `</ul></div>`;
        }

        const card = document.createElement('div');
        card.className = "p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700/30 relative";
        card.innerHTML = `
    <div class="flex justify-between items-start">
        <div>
            <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100 transition-colors">${emp.fullName}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 transition-colors">${emp.position} | <span class="text-blue-600 dark:text-blue-400 font-mono text-xs transition-colors">${emp.employeeId}</span></p>
        </div>
        <div class="flex gap-2">
            <a href="details.html?id=${emp._id}" class="text-blue-500 hover:text-blue-700 text-sm font-bold transition-colors self-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-800" title="View Details">
                Details
            </a>
            <button onclick="deleteEmployee('${emp._id}')" class="text-red-400 hover:text-red-600 transition-colors p-1" title="Delete Employee">
                🗑️
            </button>
        </div>
    </div>
    ${extraInfoHTML}
`;
        listDiv.appendChild(card);
    });
    
    if (paginationDiv && pagination) {
        paginationDiv.innerHTML = `
            <button onclick="changePage(-1)" ${pagination.currentPage <= 1 ? 'disabled class="text-gray-400 dark:text-gray-600 cursor-not-allowed font-bold"' : 'class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer"'}>
                &larr; Previous
            </button>
            <span class="text-gray-600 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Page ${pagination.currentPage} of ${pagination.totalPages}</span>
            <button onclick="changePage(1)" ${pagination.currentPage >= pagination.totalPages ? 'disabled class="text-gray-400 dark:text-gray-600 cursor-not-allowed font-bold"' : 'class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer"'}>
                Next &rarr;
            </button>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    loadAttributes();
});

async function deleteEmployee(idMongo) {
    if (confirm("Are you sure you want to send this employee to the trash?")) {
        try {
            const response = await fetch(`/api/employees/${idMongo}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            handleAuthError(response);

            if (response.ok) {
                loadEmployees();
            } else {
                alert("Error trying to delete the employee.");
            }
        } catch (error) {
            alert("Connection error with the server.");
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function exportBackup() {
    try {
        const response = await fetch('/api/employees/backup', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        handleAuthError(response);
        
        if (!response.ok) throw new Error("Error exporting");
        
        const data = await response.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_employees_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert("There was a problem exporting the backup.");
    }
}

async function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = JSON.parse(e.target.result);
            
            const response = await fetch('/api/employees/restore', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(content)
            });
            handleAuthError(response);

            const result = await response.json();
            if (response.ok) {
                alert(result.message || "Backup imported successfully");
                loadEmployees();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert("Error importing the backup: " + error.message);
        } finally {
            event.target.value = ""; 
        }
    };
    reader.readAsText(file);
}

function initTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.innerText = isDark ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const doc = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    if (doc.classList.contains('dark')) {
        doc.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if (themeIcon) themeIcon.innerText = '🌙';
    } else {
        doc.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeIcon) themeIcon.innerText = '☀️';
    }
}

document.addEventListener('DOMContentLoaded', initTheme);
