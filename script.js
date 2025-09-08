function register() {
    const username = document.getElementById('regUser').value;
    const password = document.getElementById('regPass').value;
    const messageElement = document.getElementById('message');

    if (!username) {
        messageElement.textContent = 'Fehler: Bitte geben Sie einen Benutzernamen ein!';
        return;
    }
    if (!password) {
        messageElement.textContent = 'Fehler: Bitte geben Sie ein Passwort ein!';
        return;
    }

    localStorage.setItem(username, password);
    messageElement.textContent = 'Registrierung erfolgreich!';
}

function login() {
    const username = document.getElementById('logUser').value;
    const password = document.getElementById('logPass').value;
    const messageElement = document.getElementById('message');

    if (!username) {
        messageElement.textContent = 'Fehler: Bitte geben Sie einen Benutzernamen ein!';
        return;
    }
    if (!password) {
        messageElement.textContent = 'Fehler: Bitte geben Sie ein Passwort ein!';
        return;
    }

    const storedPassword = localStorage.getItem(username);
    if (!storedPassword || storedPassword !== password) {
        messageElement.textContent = 'Fehler: Benutzername oder Passwort falsch!';
        return;
    }

    window.location.href = 'home.html';
}