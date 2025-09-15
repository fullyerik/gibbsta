import sqlite3
import hashlib  # für Passwort-Hashing

DB_PATH = "db/users.db"

# Passwort verschlüsseln
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Registrierung
def register(username, password):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)",
                  (username, hash_password(password)))
        conn.commit()
        print("Registrierung erfolgreich!")
    except sqlite3.IntegrityError:
        print("Benutzername existiert bereits.")
    conn.close()

# Login
def login(username, password):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT password FROM users WHERE username=?", (username,))
    result = c.fetchone()
    conn.close()
    if result and result[0] == hash_password(password):
        print("Login erfolgreich!")
    else:
        print("Falscher Benutzername oder Passwort.")
