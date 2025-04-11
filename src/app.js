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
        req.session.tokenExpiresOn = tokenResponse.expiresOn;
        
        // Sauvegarder la session avant la redirection
        req.session.save((err) => {
            if (err) {
                console.error('Erreur lors de la sauvegarde de la session:', err);
                throw err;
            }
            console.log('Session sauvegardée avec succès');
            res.redirect('/');
        });
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
    
    // Ne pas ajouter .ps1 si le nom contient déjà l'extension
    const cleanName = name.endsWith('.ps1') ? name : `${name}.ps1`;
    const filename = path.join(scriptsDir, cleanName);
    
    fs.writeFileSync(filename, content);
    res.status(201).json({ message: 'Script created successfully', name: cleanName });
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
    
    // Ne pas ajouter .ps1 si le nom contient déjà l'extension
    const cleanName = name.endsWith('.ps1') ? name : `${name}.ps1`;
    const filename = path.join(scriptsDir, cleanName);
    
    if (!fs.existsSync(filename)) {
        return res.status(404).json({ error: 'Script not found' });
    }
    
    fs.writeFileSync(filename, content);
    res.json({ message: 'Script updated successfully' });
});

app.delete('/api/scripts/:name', (req, res) => {
    const { name } = req.params;
    
    // Ne pas ajouter .ps1 si le nom contient déjà l'extension
    const cleanName = name.endsWith('.ps1') ? name : `${name}.ps1`;
    const filename = path.join(scriptsDir, cleanName);
    
    if (!fs.existsSync(filename)) {
        return res.status(404).json({ error: 'Script not found' });
    }
    
    fs.unlinkSync(filename);
    res.json({ message: 'Script deleted successfully' });
});

app.post('/api/scripts/:scriptName/execute', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    const scriptName = req.params.scriptName;
    console.log(`Tentative d'exécution du script: ${scriptName}`);

    try {
        // Vérifier si PowerShell est disponible
        if (!isWindows && !isPwshAvailable) {
            console.error('PowerShell n\'est pas disponible');
            return res.status(500).json({ error: 'PowerShell n\'est pas disponible' });
        }

        // Construire le chemin du script
        const scriptPath = path.join(scriptsDir, scriptName.endsWith('.ps1') ? scriptName : `${scriptName}.ps1`);
        console.log(`Chemin du script: ${scriptPath}`);

        // Vérifier si le script existe
        if (!fs.existsSync(scriptPath)) {
            console.error(`Script non trouvé: ${scriptPath}`);
            return res.status(404).json({ error: 'Script non trouvé' });
        }

        // Lire le contenu du script
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        console.log('Contenu du script lu avec succès');

        // Récupérer le token d'accès de la session
        const accessToken = req.session.accessToken;
        console.log('Token d\'accès récupéré de la session');

        // Exécuter le script avec le token
        console.log('Démarrage de l\'exécution du script avec le token');
        const result = await authService.executePowerShellWithToken(scriptContent, 'azure', accessToken);
        console.log('Script exécuté avec succès');

        res.json({ output: result });
    } catch (error) {
        console.error('Erreur lors de l\'exécution du script:', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'exécution du script',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
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
        const { scriptName, service } = data;
        const session = socket.request.session;
        
        if (!session || !session.user) {
            socket.emit('script-error', 'Non authentifié');
            return;
        }
        
        // Vérifier si PowerShell est disponible
        if (!isWindows && !isPwshAvailable) {
            socket.emit('script-error', 'PowerShell Core (pwsh) n\'est pas installé ou n\'est pas disponible dans le PATH.');
            return;
        }
        
        try {
            const cleanName = scriptName.endsWith('.ps1') ? scriptName : `${scriptName}.ps1`;
            const scriptPath = path.join(scriptsDir, cleanName);
            
            if (!fs.existsSync(scriptPath)) {
                socket.emit('script-error', 'Script non trouvé');
                return;
            }
            
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Vérifier si le script nécessite une authentification
            const requiresAuth = authService.scriptRequiresAuth(scriptContent, service);
            
            // Utiliser le token de l'utilisateur pour l'exécution uniquement si nécessaire
            const result = await authService.executePowerShellWithToken(
                scriptContent,
                service,
                requiresAuth ? session.accessToken : null
            );
            
            // Émettre le résultat ligne par ligne
            if (result) {
                const lines = result.split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        socket.emit('script-output', line);
                    }
                }
            }
            
            socket.emit('execution-completed');
        } catch (error) {
            console.error('Erreur lors de l\'exécution du script:', error);
            socket.emit('script-error', error.message);
        }
    });
    
    // Gestion des commandes shell
    socket.on('execute-command', async (command) => {
        try {
            const pwsh = spawn('pwsh', ['-Command', command]);
            
            pwsh.stdout.on('data', (data) => {
                socket.emit('command-output', data.toString());
            });

            pwsh.stderr.on('data', (data) => {
                socket.emit('command-error', data.toString());
            });
            
            // Handle process completion
            pwsh.on('close', (code) => {
                if (code !== 0) {
                    socket.emit('command-output', {
                        type: 'error',
                        data: `Process exited with code ${code}`
                    });
                }
                socket.emit('command-end');
            });
            
        } catch (error) {
            socket.emit('command-error', error.message);
            socket.emit('command-end');
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
    
    // Définir le port et l'hôte
    const PORT = process.env.PORT || (sslEnabled ? 8443 : 8080);
    const HOST = process.env.HOST || '0.0.0.0';

    server.listen(PORT, HOST, () => {
        console.log(`Serveur démarré en mode ${sslEnabled ? 'HTTPS' : 'HTTP'}`);
        console.log(`URL: ${sslEnabled ? 'https' : 'http'}://${HOST}:${PORT}`);
        console.log(`Mode démonstration: ${process.env.DEMO_MODE === 'true' ? 'activé' : 'désactivé'}`);
        console.log(`PowerShell Core: ${isPwshAvailable ? 'disponible' : 'non disponible'}`);
    });
}

startServer(); 