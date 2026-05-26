// Validar y aplicar el modo oscuro al iniciar la página
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// Lógica de autenticación del Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmit');
    const mensajeDiv = document.getElementById('mensaje');
    btnSubmit.innerText = "Verificando...";
    mensajeDiv.classList.add('hidden');

    const user_mail = document.getElementById('user_mail').value;
    const user_password = document.getElementById('user_password').value;

    try {
        const respuesta = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_mail, user_password })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        mensajeDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 block animate-pulse";
        mensajeDiv.innerText = error.message || "Error al iniciar sesión";
        mensajeDiv.classList.remove('hidden');
    } finally {
        btnSubmit.innerText = "Ingresar";
    }
});
