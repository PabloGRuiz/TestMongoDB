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
let currentLegajoId = null;

// Inicializar navbar y rol
if (token) {
    const payload = parseJwt(token);
    if (payload) {
        isAdmin = payload.user_rol === 'Admin';
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('userName').innerText = payload.user_name || 'Usuario';
            document.getElementById('userRole').innerText = payload.user_rol || 'Usuario';
            
            if (isAdmin) {
                document.getElementById('adminActions').classList.remove('hidden');
            }
            
            cargarDatosLegajo();
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

// === TEMA OSCURO ===
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


// === LÓGICA DE DETALLES ===
const urlParams = new URLSearchParams(window.location.search);
const idMongo = urlParams.get('id');

const formElements = document.querySelectorAll('.legajo-input');
const btnModificar = document.getElementById('btnModificar');
const btnGuardar = document.getElementById('btnGuardar');
const btnAgregarCampo = document.getElementById('btnAgregarCampo');
const contenedorCampos = document.getElementById('contenedorCamposDinamicos');
const msgNoInfo = document.getElementById('msgNoInfo');

async function cargarDatosLegajo() {
    if (!idMongo) {
        alert("ID de legajo no proporcionado.");
        window.location.href = 'index.html';
        return;
    }
    
    currentLegajoId = idMongo;

    try {
        const respuesta = await fetch(`/api/legajos/${idMongo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        handleAuthError(respuesta);
        
        if (!respuesta.ok) throw new Error("Error al cargar datos");
        
        const leg = await respuesta.json();
        
        document.getElementById('legajo_id').value = leg.legajo_id || '';
        document.getElementById('nombre').value = leg.nombre || '';
        document.getElementById('puesto').value = leg.puesto || '';
        if (leg.contacto) {
            document.getElementById('email').value = leg.contacto.email || '';
            document.getElementById('telefono').value = leg.contacto.telefono || '';
        }

        if (leg.informacion_adicional && Object.keys(leg.informacion_adicional).length > 0) {
            msgNoInfo.classList.add('hidden');
            for (const [clave, valor] of Object.entries(leg.informacion_adicional)) {
                agregarCampoDinamico(clave, valor);
            }
        }

    } catch (error) {
        console.error(error);
        alert("No se pudo cargar el legajo.");
        window.location.href = 'index.html';
    }
}

function agregarCampoDinamico(clave = '', valor = '') {
    msgNoInfo.classList.add('hidden');
    const div = document.createElement('div');
    div.className = "flex gap-2 items-center dynamic-field-row";
    
    // Si no estamos en modo edición, los inputs nacen readonly
    const isEditing = !btnGuardar.classList.contains('hidden');
    const readonlyAttr = isEditing ? '' : 'readonly';
    const bgClass = isEditing ? 'bg-white dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800';

    div.innerHTML = `
        <input type="text" placeholder="Dato (ej: Obra Social)" value="${clave}" ${readonlyAttr} class="key-dinamica legajo-input w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm ${bgClass} text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
        <span class="text-gray-400 dark:text-gray-500 font-bold">:</span>
        <input type="text" placeholder="Valor" value="${valor}" ${readonlyAttr} class="value-dinamica legajo-input w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm ${bgClass} text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 outline-none transition-colors">
        <button type="button" onclick="this.parentElement.remove()" class="btn-eliminar-dinamico ${isEditing ? '' : 'hidden'} text-red-500 hover:text-red-700 font-bold px-2">X</button>
    `;
    contenedorCampos.appendChild(div);
}

// Activar modo edición
if (btnModificar) {
    btnModificar.addEventListener('click', () => {
        btnModificar.classList.add('hidden');
        btnGuardar.classList.remove('hidden');
        btnAgregarCampo.classList.remove('hidden');
        
        // Quitar readonly a inputs y cambiar fondo para indicar que son editables
        const inputs = document.querySelectorAll('.legajo-input');
        inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.classList.remove('bg-gray-100', 'dark:bg-gray-800');
            input.classList.add('bg-white', 'dark:bg-gray-700');
        });

        // Mostrar botones de eliminar dinámicos
        const btnsEliminar = document.querySelectorAll('.btn-eliminar-dinamico');
        btnsEliminar.forEach(btn => btn.classList.remove('hidden'));
    });
}

if (btnAgregarCampo) {
    btnAgregarCampo.addEventListener('click', () => {
        agregarCampoDinamico();
    });
}

// Guardar cambios
if (btnGuardar) {
    btnGuardar.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const mensajeDiv = document.getElementById('mensaje');
        btnGuardar.innerText = "Guardando...";
        
        const datos = {
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
            const respuesta = await fetch(`/api/legajos/${currentLegajoId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            });

            handleAuthError(respuesta);

            if (respuesta.ok) {
                mensajeDiv.className = "mt-6 p-3 rounded-lg text-sm text-center font-medium bg-green-100 text-green-700 block";
                mensajeDiv.innerText = "¡Cambios guardados con éxito!";
                
                // Salir del modo edición (opcional)
                setTimeout(() => window.location.reload(), 1500);
            } else {
                const errorJson = await respuesta.json();
                throw new Error(errorJson.error || "Error al actualizar");
            }
        } catch (error) {
            mensajeDiv.className = "mt-6 p-3 rounded-lg text-sm text-center font-medium bg-red-100 text-red-700 block";
            mensajeDiv.innerText = error.message;
            btnGuardar.innerText = "💾 Guardar Cambios";
        }
    });
}
