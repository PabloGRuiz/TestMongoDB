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

// Inicializar datos del usuario en el navbar
if (token) {
    const payload = parseJwt(token);
    if (payload) {
        document.addEventListener('DOMContentLoaded', () => {
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            if (userNameEl) userNameEl.innerText = payload.user_name || 'Usuario';
            if (userRoleEl) userRoleEl.innerText = payload.user_rol || 'Usuario';
            
            if (payload.user_rol === 'Admin') {
                const btnPapelera = document.getElementById('btnPapelera');
                if(btnPapelera) btnPapelera.classList.remove('hidden');
            }
        });
    }
}

function handleAuthError(res) {
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        throw new Error('Sesión expirada o inválida');
    }
}

const btnAgregarCampo = document.getElementById('btnAgregarCampo');
const contenedorCampos = document.getElementById('contenedorCamposDinamicos');

btnAgregarCampo.addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = "flex gap-2 items-center";
    div.innerHTML = `
        <input type="text" placeholder="Ej: Obra Social" class="key-dinamica w-1/2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
        <span class="text-gray-400 dark:text-gray-500 font-bold">:</span>
        <input type="text" placeholder="Ej: OSDE" class="value-dinamica w-1/2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 font-bold px-2">X</button>
    `;
    contenedorCampos.appendChild(div);
});

document.getElementById('formLegajo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.querySelector('button[type="submit"]');
    const mensajeDiv = document.getElementById('mensaje');
    btnSubmit.innerText = "Guardando...";

    const datos = {
        legajo_id: document.getElementById('legajo_id').value,
        nombre: document.getElementById('nombre').value,
        puesto: document.getElementById('puesto').value,
        contacto: {
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value
        },
        informacion_adicional: {}
    };

    const keys = document.querySelectorAll('.key-dinamica');
    const values = document.querySelectorAll('.value-dinamica');

    keys.forEach((inputKey, index) => {
        const clave = inputKey.value.trim();
        const valor = values[index].value.trim();
        if (clave && valor) {
            datos.informacion_adicional[clave] = valor;
        }
    });

    try {
        const respuesta = await fetch('/api/legajos', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });

        handleAuthError(respuesta);

        if (respuesta.ok) {
            mensajeDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-green-100 text-green-700";
            mensajeDiv.innerText = "¡Legajo guardado!";
            document.getElementById('formLegajo').reset();
            contenedorCampos.innerHTML = '';
            cargarLegajos();
        } else {
            const errorJson = await respuesta.json();
            throw new Error(errorJson.error);
        }
    } catch (error) {
        mensajeDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-red-100 text-red-700";
        mensajeDiv.innerText = error.message || "Error al guardar";
    } finally {
        btnSubmit.innerText = "Guardar en MongoDB";
    }
});

let allLegajos = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentSearchTerm = '';

async function cargarLegajos() {
    const listaDiv = document.getElementById('listaLegajos');
    try {
        const respuesta = await fetch('/api/legajos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        handleAuthError(respuesta);
        allLegajos = await respuesta.json();
        
        currentPage = 1;
        renderLegajos();
    } catch (error) {
        listaDiv.innerHTML = '<p class="text-red-500 text-sm">Error al cargar la base de datos.</p>';
    }
}

function filtrarLegajos(event) {
    currentSearchTerm = event.target.value.toLowerCase();
    currentPage = 1;
    renderLegajos();
}

function cambiarPagina(delta) {
    currentPage += delta;
    renderLegajos();
}

function renderLegajos() {
    const listaDiv = document.getElementById('listaLegajos');
    const paginacionDiv = document.getElementById('paginacionLegajos');
    
    const filtrados = allLegajos.filter(leg => {
        const searchStr = `${leg.nombre} ${leg.puesto} ${leg.legajo_id}`.toLowerCase();
        return searchStr.includes(currentSearchTerm);
    });

    const totalPages = Math.ceil(filtrados.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginados = filtrados.slice(startIndex, startIndex + itemsPerPage);

    listaDiv.innerHTML = '';

    if (paginados.length === 0) {
        listaDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm italic transition-colors">No se encontraron legajos.</p>';
        if (paginacionDiv) paginacionDiv.innerHTML = '';
        return;
    }

    paginados.forEach(leg => {
        let infoExtraHTML = '';
        if (leg.informacion_adicional && Object.keys(leg.informacion_adicional).length > 0) {
            infoExtraHTML = `<div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 transition-colors">
                <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 transition-colors">Info Adicional:</p>
                <ul class="text-xs text-gray-600 dark:text-gray-300 space-y-1 transition-colors">`;

            for (const [clave, valor] of Object.entries(leg.informacion_adicional)) {
                infoExtraHTML += `<li><span class="font-bold text-gray-800 dark:text-gray-100 transition-colors">${clave}:</span> ${valor}</li>`;
            }
            infoExtraHTML += `</ul></div>`;
        }

        const tarjeta = document.createElement('div');
        tarjeta.className = "p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700/30 relative";
        tarjeta.innerHTML = `
    <div class="flex justify-between items-start">
        <div>
            <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100 transition-colors">${leg.nombre}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 transition-colors">${leg.puesto} | <span class="text-blue-600 dark:text-blue-400 font-mono text-xs transition-colors">${leg.legajo_id}</span></p>
        </div>
        <div class="flex gap-2">
            <a href="detalles.html?id=${leg._id}" class="text-blue-500 hover:text-blue-700 text-sm font-bold transition-colors self-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-800" title="Ver Detalles">
                Detalles
            </a>
            <button onclick="eliminarLegajo('${leg._id}')" class="text-red-400 hover:text-red-600 transition-colors p-1" title="Eliminar Legajo">
                🗑️
            </button>
        </div>
    </div>
    ${infoExtraHTML}
`;
        listaDiv.appendChild(tarjeta);
    });
    
    if (paginacionDiv) {
        paginacionDiv.innerHTML = `
            <button onclick="cambiarPagina(-1)" ${currentPage === 1 ? 'disabled class="text-gray-400 dark:text-gray-600 cursor-not-allowed font-bold"' : 'class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer"'}>
                &larr; Anterior
            </button>
            <span class="text-gray-600 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Página ${currentPage} de ${totalPages || 1}</span>
            <button onclick="cambiarPagina(1)" ${currentPage >= totalPages ? 'disabled class="text-gray-400 dark:text-gray-600 cursor-not-allowed font-bold"' : 'class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold transition-colors cursor-pointer"'}>
                Siguiente &rarr;
            </button>
        `;
    }
}
cargarLegajos();

async function eliminarLegajo(idMongo) {
    if (confirm("¿Estás seguro de que querés enviar este legajo a la papelera?")) {
        try {
            const respuesta = await fetch(`/api/legajos/${idMongo}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            handleAuthError(respuesta);

            if (respuesta.ok) {
                cargarLegajos();
            } else {
                alert("Error al intentar eliminar el legajo.");
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function exportarBackup() {
    try {
        const respuesta = await fetch('/api/legajos/backup', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        handleAuthError(respuesta);
        
        if (!respuesta.ok) throw new Error("Error al exportar");
        
        const data = await respuesta.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_legajos_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert("Hubo un problema al exportar el backup.");
    }
}

async function importarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const contenido = JSON.parse(e.target.result);
            
            const respuesta = await fetch('/api/legajos/restore', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contenido)
            });
            handleAuthError(respuesta);

            const result = await respuesta.json();
            if (respuesta.ok) {
                alert(result.mensaje || "Backup importado correctamente");
                cargarLegajos();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert("Error al importar el backup: " + error.message);
        } finally {
            event.target.value = ""; // Permitir volver a cargar el mismo archivo
        }
    };
    reader.readAsText(file);
}

// === LÓGICA DE MODO OSCURO (THEME TOGGLE) ===
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

// Inicializar tema al cargar el DOM
document.addEventListener('DOMContentLoaded', initTheme);
