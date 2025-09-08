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

function checkAge() {
    const age = document.getElementById('userAge').value;
    const parentalConsentGroup = document.getElementById('parentalConsentGroup');
    
    if (age === 'under13') {
        alert('Du musst mindestens 13 Jahre alt sein, um dich bei Gibbsta zu registrieren.');
        document.getElementById('userAge').value = '';
        return;
    }
    
    parentalConsentGroup.style.display = age === '13-17' ? 'flex' : 'none';
}

// Erweitere die Register-Funktion
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

    // Überprüfe AGBs und Datenschutz
    if (!document.getElementById('agbCheckbox').checked) {
        messageElement.textContent = 'Bitte akzeptiere die AGB.';
        messageElement.className = 'error';
        return;
    }

    if (!document.getElementById('privacyCheckbox').checked) {
        messageElement.textContent = 'Bitte akzeptiere die Datenschutzerklärung.';
        messageElement.className = 'error';
        return;
    }

    if (!document.getElementById('ageConfirmCheckbox').checked) {
        messageElement.textContent = 'Bitte bestätige dein Alter.';
        messageElement.className = 'error';
        return;
    }

    const age = document.getElementById('userAge').value;
    if (!age) {
        messageElement.textContent = 'Bitte wähle dein Alter aus.';
        messageElement.className = 'error';
        return;
    }

    if (age === '13-17' && !document.getElementById('parentalConsentCheckbox').checked) {
        messageElement.textContent = 'Bitte bestätige die Zustimmung deiner Erziehungsberechtigten.';
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

// Beispiel für verschiedene Rollen/Rechte
const ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    CONTENT_MANAGER: 'content_manager',
    MODERATOR: 'moderator'
};

const PERMISSIONS = {
    user: ['post', 'comment', 'like'],
    moderator: ['post', 'comment', 'like', 'delete_comments', 'edit_posts'],
    content_manager: ['post', 'comment', 'like', 'create_categories', 'pin_posts'],
    admin: ['post', 'comment', 'like', 'ban_users', 'delete_posts', 'edit_all'],
    super_admin: ['all']
};

// Voreingestellte Admin-Accounts (später in Datenbank)
const ADMIN_USERS = {
    'Erik-Admin': {
        username: 'Erik-Admin',
        email: 'gibbstateam@gmail.com',
        password: 'Test-123',
        role: ROLES.SUPER_ADMIN
    },
    'Lars-Admin': {
        username: 'Lars-Admin',
        email: 'gibbstateam@gmail.com',
        password: 'Test-123',
        role: ROLES.ADMIN
    },
    'Enes-Admin': {
        username: 'Enes-Admin',
        email: 'gibbstateam@gmail.com',
        password: 'hashedPassword123',
        role: ROLES.CONTENT_MANAGER
    },
    'Marvin-Admin': {
        username: 'Marvin-Admin',
        email: 'gibbstateam@gmail.com',
        password: 'hashedPassword123',
        role: ROLES.MODERATOR
    }
};

// Funktion zum Prüfen der Berechtigungen
function hasPermission(user, permission) {
    const userRole = user.role;
    const userPermissions = PERMISSIONS[userRole];
    return userPermissions.includes('all') || userPermissions.includes(permission);
}

// Suche Benutzer anhand von E-Mail oder Benutzername
function findUserByEmailOrUsername(identifier) {
    // Prüfe zuerst Admin-Accounts
    for (let adminUser of Object.values(ADMIN_USERS)) {
        if (adminUser.username === identifier || adminUser.email === identifier) {
            return adminUser;
        }
    }

    // Prüfe normale User-Accounts
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const userData = JSON.parse(localStorage.getItem(key));
        if (userData.username === identifier || userData.email === identifier) {
            return userData;
        }
    }
    return null;
}

// Erweitere die bestehende Login-Funktion
function login() {
    const identifier = document.getElementById('logUser').value;
    const password = document.getElementById('logPass').value;
    const messageElement = document.getElementById('message');

    if (!identifier || !password) {
        messageElement.textContent = 'Fehler: Bitte füllen Sie alle Felder aus!';
        messageElement.className = 'error';
        return;
    }

    // Suche Benutzer anhand von E-Mail oder Benutzername
    const user = findUserByEmailOrUsername(identifier);

    if (!user) {
        messageElement.textContent = 'Fehler: Benutzername/E-Mail oder Passwort falsch!';
        messageElement.className = 'error';
        return;
    }

    // Überprüfe das Passwort
    if (user.password !== password) {
        messageElement.textContent = 'Fehler: Benutzername/E-Mail oder Passwort falsch!';
        messageElement.className = 'error';
        return;
    }

    // Setze die Rolle
    const userData = { ...user };
    if (ADMIN_USERS[user.username]) {
        userData.role = ADMIN_USERS[user.username].role;
    } else {
        userData.role = ROLES.USER;
    }

    // Speichere die User-Daten in der Session
    sessionStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Weiterleitung zur Home-Seite
    window.location.href = 'home.html';
}

// Beispiel für Verwendung der Berechtigungen
function checkUserPermissions() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // Beispiele für Berechtigungsprüfungen
    if (hasPermission(currentUser, 'delete_posts')) {
        // Zeige Delete-Button an
        showDeleteButtons();
    }
    
    if (hasPermission(currentUser, 'ban_users')) {
        // Zeige Ban-Option an
        showBanOptions();
    }
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