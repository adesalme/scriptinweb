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
const authService = require('./services/authService');
require('dotenv').config();
const { spawn } = require('child_process');
const { Server } = require('socket.io');

// Création de l'application Express
const app = express();
const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 8443;
const host = process.env.HOST || 'localhost';

// Configuration de la session avec FileStore
const sessionMiddleware = session({
    store: new FileStore({
        path: process.env.SESSION_STORE_PATH || './sessions',
        ttl: 86400 // 24 heures
    }),
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.SSL_ENABLED === 'true',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
});

app.use(sessionMiddleware);

// Configuration des middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Configurer le serveur HTTP ou HTTPS selon la disponibilité des certificats
let server;
const sslEnabled = process.env.SSL_ENABLED === 'true';

if (sslEnabled) {
    try {
        const certPath = path.resolve(process.env.SSL_CERT_PATH);
        const keyPath = path.resolve(process.env.SSL_KEY_PATH);
        
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
            const httpsOptions = {
                cert: fs.readFileSync(certPath),
                key: fs.readFileSync(keyPath)
            };
            server = https.createServer(httpsOptions, app);
            console.log('Mode HTTPS activé avec certificats SSL');
            console.log(`Certificat: ${certPath}`);
            console.log(`Clé: ${keyPath}`);
        } else {
            console.warn('Certificats SSL non trouvés aux chemins spécifiés, démarrage en mode HTTP');
            server = http.createServer(app);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des certificats SSL:', error);
        console.warn('Démarrage en mode HTTP');
        server = http.createServer(app);
    }
} else {
    console.log('Mode HTTP (sans SSL)');
    server = http.createServer(app);
}

// Configuration de Socket.IO avec le middleware de session
const io = new Server(server, {
    cors: {
        origin: process.env.APP_URL,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Ajouter le middleware de session à Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Détection du système d'exploitation
const isWindows = os.platform() === 'win32';
let isPwshAvailable = false;

// Vérifier la disponibilité de PowerShell Core (pwsh)
function checkPwshAvailability() {
    return new Promise((resolve) => {
        const command = isWindows ? 'where pwsh' : 'which pwsh';
        exec(command, (error) => {
            if (error) {
                console.warn('PowerShell Core (pwsh) n\'est pas installé ou n\'est pas disponible dans le PATH');
                resolve(false);
            } else {
                console.log('PowerShell Core (pwsh) est disponible');
                resolve(true);
            }
        });
    });
}

// Dossier pour stocker les scripts PowerShell
const scriptsDir = path.join(__dirname, '../scripts');
if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
}

// Fonction pour obtenir la liste des scripts
function getScriptsList() {
    const scriptsDir = path.join(__dirname, '..', process.env.SCRIPTS_DIR || 'scripts');
    console.log('Recherche des scripts dans le dossier:', scriptsDir);
    
    if (!fs.existsSync(scriptsDir)) {
        console.warn('Le dossier des scripts n\'existe pas, création:', scriptsDir);
        fs.mkdirSync(scriptsDir, { recursive: true });
        return [];
    }
    
    const files = fs.readdirSync(scriptsDir);
    console.log('Fichiers trouvés dans le dossier:', files);
    
    const scriptFiles = files.filter(file => file.endsWith('.ps1'));
    console.log('Scripts PowerShell trouvés:', scriptFiles);
    
    return scriptFiles.map(file => ({
        name: file,
        path: path.join(scriptsDir, file)
    }));
}

// Middleware d'authentification
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

const ensureAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Routes d'authentification
app.get('/auth/login', async (req, res) => {
    try {
        const authUrl = await authService.getAuthUrl();
        console.log('Redirection vers l\'URL d\'authentification:', authUrl);
        res.redirect(authUrl);
    } catch (error) {
        console.error('Erreur lors de la génération de l\'URL d\'authentification:', error);
        res.status(500).render('error', { 
            message: 'Erreur lors de l\'authentification',
            error: error
        });
    }
});

// Route pour le mode démonstration
app.get('/auth/demo-login', (req, res) => {
    console.log('Mode démonstration: Connexion simulée');
    req.session.user = {
        displayName: 'Demo User',
        userPrincipalName: 'demo@example.com',
        id: 'demo-id'
    };
    res.redirect('/');
});

app.get('/auth/callback', async (req, res) => {
    try {
        console.log('Callback reçu avec les paramètres:', req.query);
        
        if (req.query.error) {
            throw new Error(`Erreur Azure AD: ${req.query.error_description || req.query.error}`);
        }

        const { code } = req.query;
        if (!code) {
            throw new Error('Aucun code d\'autorisation reçu');
        }

        console.log('Code d\'autorisation reçu, demande du token...');
        const tokenResponse = await authService.handleCallback(code);
        
        console.log('Token reçu, récupération des informations utilisateur...');
        const userInfo = await authService.getUserInfo(tokenResponse.accessToken);
        
        console.log('Stockage des informations en session...');
        req.session.user = userInfo;
        req.session.accessToken = tokenResponse.accessToken;
        
        console.log('Redirection vers la page d\'accueil...');
        res.redirect('/');
    } catch (error) {
        console.error('Erreur détaillée lors du callback d\'authentification:', error);
        res.status(500).render('error', { 
            message: 'Erreur lors de l\'authentification',
            error: error
        });
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Protection des routes
app.get('/', requireAuth, (req, res) => {
    const scripts = getScriptsList();
    res.render('index', { 
        scripts, 
        isWindows, 
        isPwshAvailable, 
        sslEnabled,
        user: req.session.user 
    });
});

// Protection de l'API
app.use('/api', requireAuth);

// API pour gérer les scripts
app.get('/api/scripts', (req, res) => {
    const scripts = getScriptsList();
    res.json(scripts);
});

app.post('/api/scripts', (req, res) => {
    const { name, content } = req.body;
    if (!name || !content) {
        return res.status(400).json({ error: 'Name and content are required' });
    }
    
    const filename = path.join(scriptsDir, `${name}.ps1`);
    fs.writeFileSync(filename, content);
    res.status(201).json({ message: 'Script created successfully', name });
});

app.get('/api/scripts/:name', (req, res) => {
    const { name } = req.params;
    // Ne pas ajouter .ps1 si le nom contient déjà l'extension
    const filename = path.join(scriptsDir, name.endsWith('.ps1') ? name : `${name}.ps1`);
    
    if (!fs.existsSync(filename)) {
        return res.status(404).json({ error: 'Script not found' });
    }
    
    const content = fs.readFileSync(filename, 'utf8');
    res.json({ name, content });
});

app.put('/api/scripts/:name', (req, res) => {
    const { name } = req.params;
    const { content } = req.body;
    const filename = path.join(scriptsDir, `${name}.ps1`);
    
    if (!fs.existsSync(filename)) {
        return res.status(404).json({ error: 'Script not found' });
    }
    
    fs.writeFileSync(filename, content);
    res.json({ message: 'Script updated successfully' });
});

app.delete('/api/scripts/:name', (req, res) => {
    const { name } = req.params;
    const filename = path.join(scriptsDir, `${name}.ps1`);
    
    if (!fs.existsSync(filename)) {
        return res.status(404).json({ error: 'Script not found' });
    }
    
    fs.unlinkSync(filename);
    res.json({ message: 'Script deleted successfully' });
});

// Route pour la page shell
app.get('/shell', ensureAuthenticated, (req, res) => {
    res.render('shell', {
        user: req.session.user,
        isHttps: req.secure
    });
});

// Modification de la gestion Socket.IO pour utiliser l'identité de l'utilisateur
io.on('connection', (socket) => {
    console.log('Nouvelle connexion Socket.IO');
    
    socket.on('execute-script', async (data) => {
        console.log('Demande d\'exécution du script:', data);
        
        try {
            if (!data || typeof data !== 'object' || !data.scriptName) {
                throw new Error('Format de données invalide');
            }

            const scripts = getScriptsList();
            console.log('Liste des scripts disponibles:', scripts.map(s => s.name));
            
            const script = scripts.find(s => s.name === data.scriptName);
            if (!script) {
                console.error('Script non trouvé:', data.scriptName);
                socket.emit('script-error', 'Script not found');
                return;
            }
            
            console.log('Exécution du script:', script.path);
            
            // Déterminer PowerShell executable basé sur la plateforme
            const pwshPath = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
            
            // Créer le processus PowerShell avec l'option pour désactiver la colorisation
            const ps = spawn(pwshPath, [
                '-NoProfile',
                '-NonInteractive',
                '-Command',
                `& {
                    $Host.UI.RawUI.ForegroundColor = 'White';
                    $Host.UI.RawUI.BackgroundColor = 'Black';
                    $PSStyle.OutputRendering = 'PlainText';
                    . "${script.path}"
                }`
            ]);
            
            // Fonction pour nettoyer les codes ANSI
            function cleanAnsiCodes(text) {
                // Supprime les codes de couleur ANSI
                return text.replace(/\x1B\[[0-9;]*[mGK]/g, '');
            }
            
            // Gérer la sortie standard
            ps.stdout.on('data', (data) => {
                const cleanOutput = cleanAnsiCodes(data.toString());
                socket.emit('script-output', {
                    output: cleanOutput
                });
            });
            
            // Gérer les erreurs
            ps.stderr.on('data', (data) => {
                const cleanOutput = cleanAnsiCodes(data.toString());
                socket.emit('script-output', {
                    output: cleanOutput
                });
            });
            
            // Gérer la fin du processus
            ps.on('close', (code) => {
                if (code !== 0) {
                    socket.emit('script-error', `Process exited with code ${code}`);
                }
                socket.emit('execution-completed');
            });
            
        } catch (error) {
            console.error('Erreur lors de l\'exécution du script:', error);
            socket.emit('script-error', error.message);
        }
    });
    
    // Gestion des commandes shell
    socket.on('execute-command', async (command) => {
        try {
            // Determine PowerShell executable based on platform
            const pwshPath = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
            
            // Create PowerShell process
            const ps = spawn(pwshPath, ['-NoProfile', '-NonInteractive', '-Command', command]);
            
            // Handle standard output
            ps.stdout.on('data', (data) => {
                socket.emit('command-output', {
                    type: 'output',
                    data: data.toString()
                });
            });
            
            // Handle standard error
            ps.stderr.on('data', (data) => {
                socket.emit('command-output', {
                    type: 'error',
                    data: data.toString()
                });
            });
            
            // Handle process completion
            ps.on('close', (code) => {
                if (code !== 0) {
                    socket.emit('command-output', {
                        type: 'error',
                        data: `Process exited with code ${code}`
                    });
                }
                socket.emit('command-complete');
            });
            
            // Handle process errors
            ps.on('error', (err) => {
                socket.emit('command-output', {
                    type: 'error',
                    data: `Failed to start PowerShell: ${err.message}`
                });
                socket.emit('command-complete');
            });
            
        } catch (error) {
            socket.emit('command-output', {
                type: 'error',
                data: `Error executing command: ${error.message}`
            });
            socket.emit('command-complete');
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Démarrage du serveur
async function startServer() {
    // Vérifier la disponibilité de PowerShell Core au démarrage
    isPwshAvailable = await checkPwshAvailability();
    
    // Définir le port en fonction de la présence des certificats SSL et de l'environnement
    const PORT = process.env.PORT || (sslEnabled ? 8443 : 8080);
    const HOST = '0.0.0.0'; // Écouter sur toutes les interfaces
    const protocol = sslEnabled ? 'https' : 'http';

    server.listen(sslEnabled ? httpsPort : port, host, () => {
        console.log(`Serveur démarré en mode ${sslEnabled ? 'HTTPS' : 'HTTP'}`);
        console.log(`URL: ${sslEnabled ? 'https' : 'http'}://${host}:${sslEnabled ? httpsPort : port}`);
        console.log(`Mode démonstration: ${process.env.DEMO_MODE === 'true' ? 'activé' : 'désactivé'}`);
        console.log(`PowerShell Core: ${isPwshAvailable ? 'disponible' : 'non disponible'}`);
    });
}

startServer(); 