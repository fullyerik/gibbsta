function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const message = document.getElementById('message');
    
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    message.textContent = '';
    message.className = '';
}

function register() {
    const username = document.getElementById('regUser').value;
    const password = document.getElementById('regPass').value;
    const messageElement = document.getElementById('message');

    if (!username) {
        messageElement.textContent = 'Fehler: Bitte geben Sie einen Benutzernamen ein!';
        messageElement.className = 'error';
        return;
    }
    if (!password) {
        messageElement.textContent = 'Fehler: Bitte geben Sie ein Passwort ein!';
        messageElement.className = 'error';
        return;
    }

    localStorage.setItem(username, password);
    messageElement.textContent = 'Registrierung erfolgreich! Bitte melden Sie sich jetzt an.';
    messageElement.className = 'success';
    
    // Nach 2 Sekunden zum Login wechseln
    setTimeout(() => {
        toggleForms();
        document.getElementById('logUser').value = username;
    }, 2000);
}

function login() {
    const username = document.getElementById('logUser').value;
    const password = document.getElementById('logPass').value;
    const messageElement = document.getElementById('message');

    if (!username) {
        messageElement.textContent = 'Fehler: Bitte geben Sie einen Benutzernamen ein!';
        messageElement.className = 'error';
        return;
    }
    if (!password) {
        messageElement.textContent = 'Fehler: Bitte geben Sie ein Passwort ein!';
        messageElement.className = 'error';
        return;
    }

    const storedPassword = localStorage.getItem(username);
    if (!storedPassword || storedPassword !== password) {
        messageElement.textContent = 'Fehler: Benutzername oder Passwort falsch!';
        messageElement.className = 'error';
        return;
    }

    window.location.href = 'home.html';
}