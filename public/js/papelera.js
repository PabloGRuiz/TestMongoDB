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
        if (payload.user_rol !== 'Admin') {
            alert("Acceso denegado. Solo administradores pueden ver la papelera.");
            window.location.href = 'index.html';
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('userName').innerText = payload.user_name || 'Usuario';
            document.getElementById('userRole').innerText = payload.user_rol || 'Usuario';
        });
    }
}

function handleAuthError(res) {
    if (res.status === 401 || res.status === 403) {
        alert("Tu sesión ha expirado o no tienes permisos.");
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        throw new Error('Sesión expirada o sin permisos');
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

// --- LÓGICA DE PAPELERA ---

async function cargarPapelera() {
    const listaDiv = document.getElementById('listaBorrados');
    try {
        const respuesta = await fetch('/api/legajos/trash', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        handleAuthError(respuesta);
        
        const legajos = await respuesta.json();
        listaDiv.innerHTML = '';

        if (legajos.length === 0) {
            listaDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm italic transition-colors">La papelera está vacía.</p>';
            return;
        }

        legajos.forEach(leg => {
            const fechaBorrado = leg.deletedAt ? new Date(leg.deletedAt).toLocaleDateString() : 'Desconocida';
            const tarjeta = document.createElement('div');
            tarjeta.className = "p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center";
            tarjeta.innerHTML = `
                <div>
                    <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100 transition-colors">${leg.nombre} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">(${leg.legajo_id})</span></h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 transition-colors">${leg.puesto}</p>
                    <p class="text-xs text-red-500 dark:text-red-400 mt-1 font-semibold">Borrado el: ${fechaBorrado}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="restaurarLegajo('${leg._id}')" class="text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-700 dark:text-green-400 font-bold py-2 px-3 rounded border border-green-200 dark:border-green-800 transition-colors" title="Restaurar al Dashboard">
                        Restaurar
                    </button>
                    <button onclick="eliminarFisico('${leg._id}')" class="text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-700 dark:text-red-400 font-bold py-2 px-3 rounded border border-red-200 dark:border-red-800 transition-colors" title="Eliminar para siempre">
                        Eliminar Definitivamente
                    </button>
                </div>
            `;
            listaDiv.appendChild(tarjeta);
        });

    } catch (error) {
        listaDiv.innerHTML = '<p class="text-red-500 text-sm">Error al cargar la papelera.</p>';
    }
}

async function restaurarLegajo(idMongo) {
    if (confirm("¿Estás seguro de que quieres restaurar este legajo? Volverá al Dashboard principal.")) {
        try {
            const respuesta = await fetch(`/api/legajos/${idMongo}/restore`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            handleAuthError(respuesta);

            if (respuesta.ok) {
                cargarPapelera();
            } else {
                alert("Error al restaurar el legajo.");
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        }
    }
}

async function eliminarFisico(idMongo) {
    if (confirm("⚠️ ADVERTENCIA: Esta acción es irreversible. ¿Deseas eliminar este legajo permanentemente de la base de datos?")) {
        try {
            const respuesta = await fetch(`/api/legajos/${idMongo}/hard`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            handleAuthError(respuesta);

            if (respuesta.ok) {
                cargarPapelera();
            } else {
                alert("Error al eliminar el legajo de forma definitiva.");
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        }
    }
}

// Inicializar lista al cargar la página
document.addEventListener('DOMContentLoaded', cargarPapelera);
