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

async function register() {
  const username = document.getElementById('regUser').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPass').value;
  const msg = document.getElementById('message');

  try {
    // 1) Username-Verfügbarkeit prüfen
    const { data: existingUser, error: nameErr } = await sb
      .from('profiles')
      .select('id')
      .eq('username', username)
      .range(0, 0); // exakt 1 Zeile statt maybeSingle()

    if (nameErr) throw nameErr;
    if (existingUser && existingUser[0]) {
      msg.textContent = 'Benutzername ist bereits vergeben. Bitte wähle einen anderen.';
      msg.className = 'error';
      return;
    }

    // 2) SignUp
    const { data, error } = await sb.auth.signUp({
      email, password, options: { data: { username } }
    });
    if (error) {
      if (error.message?.toLowerCase().includes('already registered')) {
        msg.textContent = 'Diese E-Mail ist bereits registriert. Bitte logge dich ein.';
        msg.className = 'error';
        return;
      }
      throw error;
    }

    const user = data.user;
    if (!user) throw new Error('Registrierung fehlgeschlagen.');

    // 3) Profil anlegen/aktualisieren
    const { error: pErr } = await sb
      .from('profiles')
      .upsert(
        { id: user.id, username, display_name: username, email },
        { onConflict: 'id' }
      );
    if (pErr) throw pErr;

    // 4) Success
    msg.textContent = 'Registrierung erfolgreich! Bitte ggf. E-Mail bestätigen und anmelden.';
    msg.className = 'success';
    setTimeout(() => {
      toggleForms();
      document.getElementById('logUser').value = email;
    }, 1200);

  } catch (e) {
    console.error('SignUp error:', e);
    msg.textContent = 'Fehler: ' + (e?.message || e);
    msg.className = 'error';
  }
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

async function login() {
  const identifier = document.getElementById('logUser').value.trim(); // E-Mail ODER Benutzername
  const password   = document.getElementById('logPass').value;
  const msg = document.getElementById('message');

  if (!identifier || !password) {
    msg.textContent = 'Bitte E-Mail/Benutzername und Passwort eingeben.';
    msg.className = 'error';
    return;
  }

  try {
    let emailForLogin = identifier;

    // Wenn kein '@' drin ist → als Benutzername behandeln → erste passende E-Mail holen
    if (!identifier.includes('@')) {
      const { data: rows, error: lookupErr } = await sb
        .from('profiles')
        .select('email')
        .ilike('username', identifier)
        .range(0, 0); // exakt 1 Zeile

      if (lookupErr) throw lookupErr;
      const row = rows && rows[0];
      if (!row || !row.email) {
        msg.textContent = 'Benutzername nicht gefunden. Bitte E-Mail verwenden oder zuerst mit E-Mail einloggen.';
        msg.className = 'error';
        return;
      }
      emailForLogin = row.email;
    }

    // Normales E-Mail+Passwort-Login
    const { data, error } = await sb.auth.signInWithPassword({ email: emailForLogin, password });
    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        msg.textContent = 'Bitte bestätige zuerst deine E-Mail.';
      } else if (/invalid login credentials/i.test(error.message)) {
        msg.textContent = 'E-Mail/Benutzername oder Passwort ist falsch.';
      } else {
        msg.textContent = 'Login fehlgeschlagen: ' + error.message;
      }
      msg.className = 'error';
      return;
    }

    const user = data.user;

    // Email ins Profil nachtragen (id sollte UNIQUE sein; Upsert ist idempotent)
    await sb.from('profiles').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id' }
    );

    // Profil lesen → nur die erste Zeile nehmen (kein .single()!)
    const { data: profRows, error: pErr } = await sb
      .from('profiles')
      .select('role, username')
      .eq('id', user.id)
      .range(0, 0);

    if (pErr) throw pErr;

    const prof = (profRows && profRows[0]) || null;

    sessionStorage.setItem('currentUser', JSON.stringify({
      id: user.id,
      email: user.email,
      username: prof?.username || '',
      role: prof?.role || 'user'
    }));

    window.location.href = 'home.html';
  } catch (e) {
    console.error(e);
    // Fängt auch den „Cannot coerce…“-Fall ab
    document.getElementById('message').textContent = 'Login fehlgeschlagen: ' + (e.message || e);
    document.getElementById('message').className = 'error';
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