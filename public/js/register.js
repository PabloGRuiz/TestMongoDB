// Validar y aplicar el modo oscuro al iniciar la página
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// Lógica de registro de usuario
document.getElementById('formRegister').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmit');
    const mensajeDiv = document.getElementById('mensaje');
    btnSubmit.innerText = "Creando cuenta...";
    mensajeDiv.classList.add('hidden');

    const datos = {
        user_id: document.getElementById('user_id').value,
        user_name: document.getElementById('user_name').value,
        user_mail: document.getElementById('user_mail').value,
        user_rol: document.getElementById('user_rol').value,
        user_password: document.getElementById('user_password').value
    };

    try {
        const respuesta = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            mensajeDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 block";
            mensajeDiv.innerText = "¡Registro exitoso! Redirigiendo...";
            mensajeDiv.classList.remove('hidden');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            console.error("Error devuelto por el servidor:", data);
            throw new Error(data.detalle || data.error);
        }
    } catch (error) {
        console.error("Error en el cliente durante el registro:", error);
        mensajeDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 block animate-pulse";
        mensajeDiv.innerText = `Error: ${error.message || "Error al registrarse"}`;
        mensajeDiv.classList.remove('hidden');
    } finally {
        btnSubmit.innerText = "Registrarse";
    }
});
