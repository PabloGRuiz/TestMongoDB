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

let isAdmin = false;
let currentEmployeeId = null;

if (token) {
    const payload = parseJwt(token);
    if (payload) {
        isAdmin = payload.role === 'Admin' || payload.user_rol === 'Admin';
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('userName').innerText = payload.name || payload.user_name || 'User';
            document.getElementById('userRole').innerText = payload.role || payload.user_rol || 'User';
            
            if (isAdmin) {
                document.getElementById('adminActions').classList.remove('hidden');
            }
            
            loadEmployeeData();
            loadAttributes();
        });
    }
}

function handleAuthError(res) {
    if (res.status === 401 || res.status === 403) {
        alert("Your session has expired or you do not have permissions.");
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        throw new Error('Expired session or lacking permissions');
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

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function initTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.innerText = isDark ? '☀️' : '🌙';
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

const urlParams = new URLSearchParams(window.location.search);
const idMongo = urlParams.get('id');

const formElements = document.querySelectorAll('.employee-input');
const btnModify = document.getElementById('btnModify');
const btnSave = document.getElementById('btnSave');
const btnAddField = document.getElementById('btnAddField');
const fieldsContainer = document.getElementById('dynamicFieldsContainer');
const msgNoInfo = document.getElementById('msgNoInfo');

async function loadEmployeeData() {
    if (!idMongo) {
        alert("Employee ID not provided.");
        window.location.href = 'index.html';
        return;
    }
    
    currentEmployeeId = idMongo;

    try {
        const response = await fetch(`/api/employees/${idMongo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        handleAuthError(response);
        
        if (!response.ok) throw new Error("Error loading data");
        
        const emp = await response.json();
        
        document.getElementById('employeeId').value = emp.employeeId || '';
        document.getElementById('fullName').value = emp.fullName || '';
        document.getElementById('position').value = emp.position || '';
        if (emp.contact) {
            document.getElementById('email').value = emp.contact.email || '';
            document.getElementById('phone').value = emp.contact.phone || '';
        }

        if (emp.additionalInfo && emp.additionalInfo.length > 0) {
            msgNoInfo.classList.add('hidden');
            emp.additionalInfo.forEach(attr => {
                addDynamicField(attr.k, attr.v);
            });
        }

    } catch (error) {
        console.error(error);
        alert("Could not load employee.");
        window.location.href = 'index.html';
    }
}

function addDynamicField(key = '', value = '') {
    msgNoInfo.classList.add('hidden');
    const div = document.createElement('div');
    div.className = "flex gap-2 items-center dynamic-field-row";
    
    const isEditing = !btnSave.classList.contains('hidden');
    const readonlyAttr = isEditing ? '' : 'readonly';
    const bgClass = isEditing ? 'bg-white dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800';

    div.innerHTML = `
        <input type="text" list="attributesList" placeholder="Key (e.g. Health Insurance)" value="${key}" ${readonlyAttr} class="dynamic-key employee-input w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm ${bgClass} text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
        <span class="text-gray-400 dark:text-gray-500 font-bold">:</span>
        <input type="text" placeholder="Value" value="${value}" ${readonlyAttr} class="dynamic-value employee-input w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm ${bgClass} text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
        <button type="button" onclick="this.parentElement.remove()" class="btn-delete-dynamic ${isEditing ? '' : 'hidden'} text-red-500 hover:text-red-700 font-bold px-2">X</button>
    `;
    fieldsContainer.appendChild(div);
}

if (btnModify) {
    btnModify.addEventListener('click', () => {
        btnModify.classList.add('hidden');
        btnSave.classList.remove('hidden');
        btnAddField.classList.remove('hidden');
        
        const inputs = document.querySelectorAll('.employee-input');
        inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.classList.remove('bg-gray-100', 'dark:bg-gray-800');
            input.classList.add('bg-white', 'dark:bg-gray-700');
        });

        const deleteBtns = document.querySelectorAll('.btn-delete-dynamic');
        deleteBtns.forEach(btn => btn.classList.remove('hidden'));
    });
}

if (btnAddField) {
    btnAddField.addEventListener('click', () => {
        addDynamicField();
    });
}

if (btnSave) {
    btnSave.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const messageDiv = document.getElementById('message');
        btnSave.innerText = "Saving...";
        
        const data = {
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
            const response = await fetch(`/api/employees/${currentEmployeeId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            handleAuthError(response);

            if (response.ok) {
                messageDiv.className = "mt-6 p-3 rounded-lg text-sm text-center font-medium bg-green-100 text-green-700 block";
                messageDiv.innerText = "Changes saved successfully!";
                
                setTimeout(() => window.location.reload(), 1500);
            } else {
                const errorJson = await response.json();
                throw new Error(errorJson.error || "Error updating");
            }
        } catch (error) {
            messageDiv.className = "mt-6 p-3 rounded-lg text-sm text-center font-medium bg-red-100 text-red-700 block";
            messageDiv.innerText = error.message;
            btnSave.innerText = "💾 Save Changes";
        }
    });
}
