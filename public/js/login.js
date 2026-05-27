const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmit');
    const messageDiv = document.getElementById('message');
    btnSubmit.innerText = "Verifying...";
    messageDiv.classList.add('hidden');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        messageDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 block animate-pulse";
        messageDiv.innerText = error.message || "Error logging in";
        messageDiv.classList.remove('hidden');
    } finally {
        btnSubmit.innerText = "Sign In";
    }
});
