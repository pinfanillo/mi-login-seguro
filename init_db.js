// init_db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conectado a la base de datos users.db.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error("Error al crear la tabla de usuarios:", err.message);
    } else {
      console.log("Tabla 'users' lista o ya existente.");
    }
  });
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conexión a la base de datos cerrada.');
});