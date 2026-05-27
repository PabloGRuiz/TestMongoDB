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

if (token) {
    const payload = parseJwt(token);
    if (payload) {
        if (payload.role !== 'Admin' && payload.user_rol !== 'Admin') {
            alert("Access denied. Only administrators can view the recycle bin.");
            window.location.href = 'index.html';
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('userName').innerText = payload.name || payload.user_name || 'User';
            document.getElementById('userRole').innerText = payload.role || payload.user_rol || 'User';
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

// --- TRASH LOGIC ---

async function loadTrash() {
    const listDiv = document.getElementById('trashList');
    try {
        const response = await fetch('/api/employees/trash', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        handleAuthError(response);
        
        const employees = await response.json();
        listDiv.innerHTML = '';

        if (employees.length === 0) {
            listDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm italic transition-colors">The recycle bin is empty.</p>';
            return;
        }

        employees.forEach(emp => {
            const deleteDate = emp.deletedAt ? new Date(emp.deletedAt).toLocaleDateString() : 'Unknown';
            const card = document.createElement('div');
            card.className = "p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100 transition-colors">${emp.fullName} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">(${emp.employeeId})</span></h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 transition-colors">${emp.position}</p>
                    <p class="text-xs text-red-500 dark:text-red-400 mt-1 font-semibold">Deleted on: ${deleteDate}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="restoreEmployee('${emp._id}')" class="text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-700 dark:text-green-400 font-bold py-2 px-3 rounded border border-green-200 dark:border-green-800 transition-colors" title="Restore to Dashboard">
                        Restore
                    </button>
                    <button onclick="hardDeleteEmployee('${emp._id}')" class="text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-400 font-bold py-2 px-3 rounded border border-red-200 dark:border-red-800 transition-colors" title="Delete permanently">
                        Permanent Delete
                    </button>
                </div>
            `;
            listDiv.appendChild(card);
        });

    } catch (error) {
        listDiv.innerHTML = '<p class="text-red-500 text-sm">Error loading recycle bin.</p>';
    }
}

async function restoreEmployee(idMongo) {
    if (confirm("Are you sure you want to restore this employee? It will return to the main Dashboard.")) {
        try {
            const response = await fetch(`/api/employees/${idMongo}/restore`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            handleAuthError(response);

            if (response.ok) {
                loadTrash();
            } else {
                alert("Error restoring the employee.");
            }
        } catch (error) {
            alert("Connection error with the server.");
        }
    }
}

async function hardDeleteEmployee(idMongo) {
    if (confirm("⚠️ WARNING: This action is irreversible. Do you wish to permanently delete this employee from the database?")) {
        try {
            const response = await fetch(`/api/employees/${idMongo}/hard`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            handleAuthError(response);

            if (response.ok) {
                loadTrash();
            } else {
                alert("Error permanently deleting the employee.");
            }
        } catch (error) {
            alert("Connection error with the server.");
        }
    }
}

document.addEventListener('DOMContentLoaded', loadTrash);
