// server.js (Copia y pega el contenido COMPLETO, reemplazando el anterior)
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
// --- CAMBIO CLAVE AQUÍ --- Render usa el puerto que le da el entorno (process.env.PORT)
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database(path.join(__dirname, 'users.db'));

// Configuración de Express y middlewares
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public'))); 

// Configuración de Sesiones
app.use(session({
    // ¡Cámbialo en un proyecto real! Para render, es mejor usar una variable de entorno, pero lo dejamos aquí por simplicidad.
    secret: 'un_secreto_muy_seguro_cambialo', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000, secure: 'auto' } // secure: 'auto' ayuda con HTTPS en Render
}));

// Middleware de autenticación (Protege las rutas)
function requireLogin(req, res, next) {
    if (req.session.userId) {
        next(); 
    } else {
        res.redirect('/login.html'); 
    }
}

// --------------------- RUTAS ---------------------

// Ruta Raíz: Redirige al área privada o al login
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.redirect('/login.html');
    }
});

// 1. Ruta de REGISTRO (POST)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Validación básica
    if (!username || !password) {
        return res.send('Usuario y contraseña son requeridos.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run('INSERT INTO users (username, hashed_password) VALUES (?, ?)', 
            [username, hashedPassword], 
            function (err) {
            if (err) {
                if (err.errno === 19) {
                    return res.send('El nombre de usuario ya existe. <a href="/register.html">Volver a intentar</a>');
                }
                console.error(err.message);
                return res.status(500).send('Error interno del servidor.');
            }
            console.log(`Usuario registrado: ${username}`);
            res.redirect('/login.html'); 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar usuario.');
    }
});

// 2. Ruta de LOGIN (POST)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Error interno.');
        }

        if (!row) {
            return res.send('Usuario o contraseña incorrectos. <a href="/login.html">Volver a intentar</a>');
        }

        const match = await bcrypt.compare(password, row.hashed_password);

        if (match) {
            req.session.userId = row.id; 
            res.redirect('/'); 
        } else {
            res.send('Usuario o contraseña incorrectos. <a href="/login.html">Volver a intentar</a>');
        }
    });
});

// 3. Ruta de LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('No se pudo cerrar sesión.');
        }
        res.redirect('/login.html'); 
    });
});

// 4. Ruta para el área privada (protegida por el middleware)
app.get('/index.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}.`);
});