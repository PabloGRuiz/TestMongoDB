const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

document.getElementById('formRegister').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmit');
    const messageDiv = document.getElementById('message');
    btnSubmit.innerText = "Creating account...";
    messageDiv.classList.add('hidden');

    const data = {
        userId: document.getElementById('userId').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 block";
            messageDiv.innerText = "Registration successful! Redirecting...";
            messageDiv.classList.remove('hidden');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            console.error("Error returned by server:", result);
            throw new Error(result.details || result.error);
        }
    } catch (error) {
        console.error("Client error during registration:", error);
        messageDiv.className = "mt-4 p-3 rounded-lg text-sm text-center font-medium bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 block animate-pulse";
        messageDiv.innerText = `Error: ${error.message || "Error registering"}`;
        messageDiv.classList.remove('hidden');
    } finally {
        btnSubmit.innerText = "Register";
    }
});
