const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const socketIo = require('socket.io');
const fs = require('fs');
const { PowerShell } = require('node-powershell');
const os = require('os');
const { exec } = require('child_process');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const { authService, requiresInteractiveAuth } = require('./services/authService');
require('dotenv').config();
const { spawn } = require('child_process');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const expressLayouts = require('express-ejs-layouts');

// Configuration
const config = require('./config/config');

// Routes
const authRoutes = require('./routes/auth');
const scriptsRoutes = require('./routes/scripts');
const adminRoutes = require('./routes/admin');
const shellRoutes = require('./routes/shell');

// Middlewares
const { requireAuth } = require('./middlewares/auth');

// Services
const powershellService = require('./services/powershellService');

// Création de l'application Express
const app = express();

// Configuration de la session
const sessionMiddleware = session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: config.session.cookie,
    store: new FileStore({
        path: config.session.store.path,
        ttl: 86400, // 1 jour en secondes
        reapInterval: 3600, // Nettoyage toutes les heures
        reapAsync: true
    })
});

app.use(sessionMiddleware);

// Configuration des middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Configuration de express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Configuration du serveur HTTP/HTTPS
let server;
if (config.app.sslEnabled) {
    try {
        const httpsOptions = {
            cert: fs.readFileSync(config.ssl.certPath),
            key: fs.readFileSync(config.ssl.keyPath)
        };
        server = https.createServer(httpsOptions, app);
        console.log('Mode HTTPS activé');
    } catch (error) {
        console.error('Erreur SSL:', error);
        server = http.createServer(app);
    }
} else {
    server = http.createServer(app);
}

// Configuration de Socket.IO
const io = socketIo(server, {
    cors: {
        origin: `https://${config.app.host}:${config.app.port}`,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware de session pour Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/scripts', scriptsRoutes);
app.use('/admin', adminRoutes);
app.use('/shell', shellRoutes);

// Route principale
app.get('/', requireAuth, async (req, res) => {
    try {
        const scriptsDir = config.scripts.directory;
        const adminScriptsDir = config.scripts.adminDirectory;
        
        // Créer les dossiers s'ils n'existent pas
        await fs.promises.mkdir(scriptsDir, { recursive: true });
        await fs.promises.mkdir(adminScriptsDir, { recursive: true });
        
        // Récupérer les scripts normaux et admin
        const [normalScripts, adminScripts] = await Promise.all([
            fs.promises.readdir(scriptsDir),
            fs.promises.readdir(adminScriptsDir)
        ]);
        
        const scripts = [
            ...normalScripts.filter(file => file.endsWith('.ps1')).map(file => ({
                name: file,
                path: path.join(scriptsDir, file),
                isAdmin: false
            })),
            ...adminScripts.filter(file => file.endsWith('.ps1')).map(file => ({
                name: file,
                path: path.join(adminScriptsDir, file),
                isAdmin: true
            }))
        ];
        
        res.render('index', {
            title: 'Accueil',
            scripts,
            user: req.session.user,
            isWindows: powershellService.isWindows,
            isPwshAvailable: powershellService.isPwshAvailable,
            sslEnabled: config.app.sslEnabled
        });
    } catch (error) {
        console.error('Erreur lors du chargement de la page d\'index:', error);
        res.status(500).render('error', {
            title: 'Erreur',
            message: 'Erreur lors du chargement de la page',
            error: error,
            user: req.session.user
        });
    }
});

// Route pour le shell PowerShell
app.get('/shell', requireAuth, (req, res) => {
    res.render('shell', {
        title: 'Shell PowerShell',
        user: req.session.user,
        isWindows: powershellService.isWindows,
        isPwshAvailable: powershellService.isPwshAvailable,
        sslEnabled: config.app.sslEnabled
    });
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('Nouvelle connexion Socket.IO');
    
    socket.on('execute-command', async (command) => {
        try {
            const output = await powershellService.executeCommand(command);
            socket.emit('command-output', output);
            socket.emit('command-end');
        } catch (error) {
            console.error('Erreur d\'exécution:', error);
            socket.emit('command-error', error.message);
            socket.emit('command-end');
        }
    });
    
    socket.on('execute-script', async (data) => {
        try {
            const { scriptName, service } = data;
            const scriptPath = path.join(config.scripts.directory, scriptName);
            const adminScriptPath = path.join(config.scripts.adminDirectory, scriptName);
            
            let content;
            try {
                content = await fs.promises.readFile(scriptPath, 'utf8');
            } catch (error) {
                try {
                    content = await fs.promises.readFile(adminScriptPath, 'utf8');
                } catch (error) {
                    throw new Error('Script non trouvé');
                }
            }
            
            const output = await powershellService.executeScript(content, service);
            socket.emit('script-output', output);
            socket.emit('execution-completed');
        } catch (error) {
            console.error('Erreur d\'exécution:', error);
            socket.emit('script-error', error.message);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Déconnexion Socket.IO');
    });
});

// Démarrage du serveur
const port = config.app.port;
server.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
    console.log(`Mode ${config.app.sslEnabled ? 'HTTPS' : 'HTTP'}`);
}); 