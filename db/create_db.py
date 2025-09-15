import sqlite3

# Verbindung zur DB
conn = sqlite3.connect("db/users.db")
c = conn.cursor()

# Tabelle für Benutzer erstellen
c.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)
''')

conn.commit()
conn.close()

print("Datenbank users.db erstellt!")
