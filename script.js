// === UI-Helfer (wie bisher) ===
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
  if (password.length < minLength) errors.push("mindestens 8 Zeichen");
  if (!hasUpperCase) errors.push("einen Großbuchstaben");
  if (!hasLowerCase) errors.push("einen Kleinbuchstaben");
  if (!hasNumber) errors.push("eine Zahl");
  if (!hasSpecialChar) errors.push("ein Sonderzeichen");
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

// === REGISTRIEREN (Supabase) ===
async function register() {
  const username = document.getElementById('regUser').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPass').value;
  const messageElement = document.getElementById('message');

  // Basis-Validierungen wie vorher
  if (!username) { messageElement.textContent = 'Bitte Benutzernamen eingeben.'; messageElement.className = 'error'; return; }
  if (!email || !validateEmail(email)) { messageElement.textContent = 'Bitte gültige E-Mail eingeben.'; messageElement.className = 'error'; return; }
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) { messageElement.textContent = 'Passwort muss enthalten: ' + passwordErrors.join(', '); messageElement.className = 'error'; return; }
  if (!document.getElementById('agbCheckbox').checked) { messageElement.textContent = 'Bitte AGB akzeptieren.'; messageElement.className = 'error'; return; }
  if (!document.getElementById('privacyCheckbox').checked) { messageElement.textContent = 'Bitte Datenschutzerklärung akzeptieren.'; messageElement.className = 'error'; return; }
  if (!document.getElementById('ageConfirmCheckbox').checked) { messageElement.textContent = 'Bitte Alter bestätigen.'; messageElement.className = 'error'; return; }
  const age = document.getElementById('userAge').value;
  if (!age) { messageElement.textContent = 'Bitte Alter auswählen.'; messageElement.className = 'error'; return; }
  if (age === '13-17' && !document.getElementById('parentalConsentCheckbox').checked) { messageElement.textContent = 'Bitte Zustimmung der Erziehungsberechtigten bestätigen.'; messageElement.className = 'error'; return; }

  try {
    // 1) Supabase SignUp
    const { data, error } = await sb.auth.signUp({
      email, password, options: { data: { username } }
    });
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error('Registrierung fehlgeschlagen.');

    // 2) Profil anlegen
    const { error: pErr } = await sb.from('profiles').insert({
      id: user.id, username, display_name: username
    });
    if (pErr) throw pErr;

    messageElement.textContent = 'Registrierung erfolgreich! Bitte ggf. E-Mail bestätigen und anmelden.';
    messageElement.className = 'success';
    setTimeout(() => { toggleForms(); document.getElementById('logUser').value = email; }, 1200);
  } catch (e) {
    messageElement.textContent = 'Fehler: ' + e.message;
    messageElement.className = 'error';
  }
}

// === LOGIN (Supabase) ===
async function login() {
  const identifier = document.getElementById('logUser').value.trim(); // E-Mail
  const password   = document.getElementById('logPass').value;
  const messageElement = document.getElementById('message');

  if (!identifier || !password) {
    messageElement.textContent = 'Bitte alle Felder ausfüllen.';
    messageElement.className = 'error';
    return;
  }

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email: identifier, password });
    if (error) throw error;

    const { data: prof, error: pErr } = await sb
      .from('profiles')
      .select('role, username')
      .eq('id', data.user.id)
      .single();
    if (pErr) throw pErr;

    // Für bestehende UI
    sessionStorage.setItem('currentUser', JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      username: prof?.username || '',
      role: prof?.role || 'user'
    }));

    window.location.href = 'home.html';
  } catch (e) {
    messageElement.textContent = 'Fehler: Benutzername/E-Mail oder Passwort falsch!';
    messageElement.className = 'error';
  }
}

// Live-Check der Passwort-Anforderungen
document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('regPass');
  if (passInput) {
    passInput.addEventListener('input', function(e) {
      const password = e.target.value;
      const requirements = document.querySelectorAll('.password-requirements li');
      requirements[0].style.color = password.length >= 8 ? '#4BB543' : '#65676b';
      requirements[1].style.color = /[A-Z]/.test(password) ? '#4BB543' : '#65676b';
      requirements[2].style.color = /[a-z]/.test(password) ? '#4BB543' : '#65676b';
      requirements[3].style.color = /[0-9]/.test(password) ? '#4BB543' : '#65676b';
      requirements[4].style.color = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password) ? '#4BB543' : '#65676b';
    });
  }
});
