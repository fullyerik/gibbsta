function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const message = document.getElementById('message');
    
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    message.textContent = '';
    message.className = '';
}

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push("mindestens 8 Zeichen");
    }
    if (!hasUpperCase) {
        errors.push("einen Großbuchstaben");
    }
    if (!hasLowerCase) {
        errors.push("einen Kleinbuchstaben");
    }
    if (!hasNumber) {
        errors.push("eine Zahl");
    }
    if (!hasSpecialChar) {
        errors.push("ein Sonderzeichen");
    }
    
    return errors;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function register() {
    const username = document.getElementById('regUser').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;
    const messageElement = document.getElementById('message');

    // Validate username
    if (!username) {
        messageElement.textContent = 'Fehler: Bitte geben Sie einen Benutzernamen ein!';
        messageElement.className = 'error';
        return;
    }

    // Validate email
    if (!email || !validateEmail(email)) {
        messageElement.textContent = 'Fehler: Bitte geben Sie eine gültige E-Mail-Adresse ein!';
        messageElement.className = 'error';
        return;
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        messageElement.textContent = 'Passwort muss enthalten: ' + passwordErrors.join(', ');
        messageElement.className = 'error';
        return;
    }

    // Store user data (temporary until database is implemented)
    const userData = {
        username: username,
        email: email,
        password: password
    };
    
    localStorage.setItem(username, JSON.stringify(userData));
    messageElement.textContent = 'Registrierung erfolgreich! Bitte melden Sie sich jetzt an.';
    messageElement.className = 'success';
    
    // Switch to login after 2 seconds
    setTimeout(() => {
        toggleForms();
        document.getElementById('logUser').value = username;
    }, 2000);
}

// Update login function to work with new storage format
function login() {
    const username = document.getElementById('logUser').value;
    const password = document.getElementById('logPass').value;
    const messageElement = document.getElementById('message');

    if (!username || !password) {
        messageElement.textContent = 'Fehler: Bitte füllen Sie alle Felder aus!';
        messageElement.className = 'error';
        return;
    }

    const storedUserData = localStorage.getItem(username);
    if (!storedUserData) {
        messageElement.textContent = 'Fehler: Benutzername oder Passwort falsch!';
        messageElement.className = 'error';
        return;
    }

    const userData = JSON.parse(storedUserData);
    if (userData.password !== password) {
        messageElement.textContent = 'Fehler: Benutzername oder Passwort falsch!';
        messageElement.className = 'error';
        return;
    }

    window.location.href = 'home.html';
}

document.getElementById('regPass').addEventListener('input', function(e) {
    const password = e.target.value;
    const requirements = document.querySelectorAll('.password-requirements li');
    
    // Validiere jede Anforderung
    requirements[0].style.color = password.length >= 8 ? '#4BB543' : '#65676b';
    requirements[1].style.color = /[A-Z]/.test(password) ? '#4BB543' : '#65676b';
    requirements[2].style.color = /[a-z]/.test(password) ? '#4BB543' : '#65676b';
    requirements[3].style.color = /[0-9]/.test(password) ? '#4BB543' : '#65676b';
    requirements[4].style.color = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password) ? '#4BB543' : '#65676b';
});