const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const fs = require('fs');
const { NodePowershell } = require('node-powershell');

// Création de l'application Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuration de l'application
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dossier pour stocker les scripts PowerShell
const scriptsDir = path.join(__dirname, '../scripts');
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Route principale
app.get('/', (req, res) => {
  const scripts = getScriptsList();
  res.render('index', { scripts });
});

// API pour gérer les scripts
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
  const filename = path.join(scriptsDir, `${name}.ps1`);
  
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

app.get('/api/scripts', (req, res) => {
  const scripts = getScriptsList();
  res.json(scripts);
});

// Fonction pour obtenir la liste des scripts
function getScriptsList() {
  if (!fs.existsSync(scriptsDir)) {
    return [];
  }
  
  return fs.readdirSync(scriptsDir)
    .filter(file => file.endsWith('.ps1'))
    .map(file => file.replace('.ps1', ''));
}

// Socket.IO pour la communication en temps réel
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('execute-script', async (scriptName, credentials) => {
    const ps = new NodePowershell({
      executionPolicy: 'Bypass',
      noProfile: true
    });
    
    try {
      const scriptPath = path.join(scriptsDir, `${scriptName}.ps1`);
      
      if (!fs.existsSync(scriptPath)) {
        socket.emit('execution-error', { message: 'Script not found' });
        return;
      }
      
      // Si des identifiants sont fournis, les utiliser
      if (credentials && credentials.email && credentials.password) {
        // Créer un script temporaire qui utilise les identifiants fournis
        ps.addCommand(`$securePassword = ConvertTo-SecureString "${credentials.password}" -AsPlainText -Force`);
        ps.addCommand(`$credential = New-Object System.Management.Automation.PSCredential ("${credentials.email}", $securePassword)`);
        ps.addCommand(`. "${scriptPath}" -Credential $credential`);
      } else {
        ps.addCommand(`. "${scriptPath}"`);
      }
      
      // Écouter les événements de sortie standard
      ps.on('output', (data) => {
        socket.emit('script-output', { output: data });
      });
      
      // Écouter les événements d'erreur
      ps.on('err', (error) => {
        socket.emit('script-error', { error: error.toString() });
      });
      
      const result = await ps.invoke();
      socket.emit('execution-completed', { result });
    } catch (error) {
      console.error('Execution error:', error);
      
      // Vérifier si l'erreur est liée à des privilèges administratifs manquants
      if (error.message && error.message.includes('administrator')) {
        socket.emit('credentials-required', { scriptName });
      } else {
        socket.emit('execution-error', { error: error.toString() });
      }
    } finally {
      await ps.dispose();
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 