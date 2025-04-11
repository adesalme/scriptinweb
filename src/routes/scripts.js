const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { requireAuth, isAdmin } = require('../middlewares/auth');
const powershellService = require('../services/powershellService');
const config = require('../config/config');

// Liste des scripts
router.get('/', requireAuth, async (req, res) => {
    try {
        const scriptsDir = config.scripts.directory;
        const adminScriptsDir = config.scripts.adminDirectory;
        
        // Créer les dossiers s'ils n'existent pas
        await fs.mkdir(scriptsDir, { recursive: true });
        await fs.mkdir(adminScriptsDir, { recursive: true });
        
        // Récupérer les scripts normaux et admin
        const [normalScripts, adminScripts] = await Promise.all([
            fs.readdir(scriptsDir),
            fs.readdir(adminScriptsDir)
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
        
        res.json(scripts);
    } catch (error) {
        console.error('Erreur lors de la récupération des scripts:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des scripts' });
    }
});

// Obtenir un script
router.get('/:name', requireAuth, async (req, res) => {
    try {
        const scriptName = req.params.name;
        const scriptPath = path.join(config.scripts.directory, scriptName);
        const adminScriptPath = path.join(config.scripts.adminDirectory, scriptName);
        
        let content;
        try {
            content = await fs.readFile(scriptPath, 'utf8');
        } catch (error) {
            try {
                content = await fs.readFile(adminScriptPath, 'utf8');
            } catch (error) {
                throw new Error('Script non trouvé');
            }
        }
        
        res.json({ content });
    } catch (error) {
        console.error('Erreur lors de la récupération du script:', error);
        res.status(404).json({ error: error.message });
    }
});

// Créer un script
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name, content, isAdmin } = req.body;
        
        if (!name || !content) {
            return res.status(400).json({ error: 'Nom et contenu requis' });
        }
        
        const scriptName = name.endsWith('.ps1') ? name : `${name}.ps1`;
        const targetDir = isAdmin ? config.scripts.adminDirectory : config.scripts.directory;
        const scriptPath = path.join(targetDir, scriptName);
        
        await fs.writeFile(scriptPath, content, 'utf8');
        
        res.json({ message: 'Script créé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la création du script:', error);
        res.status(500).json({ error: 'Erreur lors de la création du script' });
    }
});

// Mettre à jour un script
router.put('/:name', requireAuth, async (req, res) => {
    try {
        const { content, isAdmin } = req.body;
        const scriptName = req.params.name;
        
        if (!content) {
            return res.status(400).json({ error: 'Contenu requis' });
        }
        
        const targetDir = isAdmin ? config.scripts.adminDirectory : config.scripts.directory;
        const scriptPath = path.join(targetDir, scriptName);
        
        await fs.writeFile(scriptPath, content, 'utf8');
        
        res.json({ message: 'Script mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du script:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du script' });
    }
});

// Supprimer un script
router.delete('/:name', requireAuth, async (req, res) => {
    try {
        const scriptName = req.params.name;
        const scriptPath = path.join(config.scripts.directory, scriptName);
        const adminScriptPath = path.join(config.scripts.adminDirectory, scriptName);
        
        try {
            await fs.unlink(scriptPath);
        } catch (error) {
            try {
                await fs.unlink(adminScriptPath);
            } catch (error) {
                throw new Error('Script non trouvé');
            }
        }
        
        res.json({ message: 'Script supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du script:', error);
        res.status(404).json({ error: error.message });
    }
});

// Exécuter un script
router.post('/:name/execute', requireAuth, async (req, res) => {
    try {
        const scriptName = req.params.name;
        const scriptPath = path.join(config.scripts.directory, scriptName);
        const adminScriptPath = path.join(config.scripts.adminDirectory, scriptName);
        
        let content;
        try {
            content = await fs.readFile(scriptPath, 'utf8');
        } catch (error) {
            try {
                content = await fs.readFile(adminScriptPath, 'utf8');
            } catch (error) {
                throw new Error('Script non trouvé');
            }
        }
        
        const output = await powershellService.executeScript(content);
        res.json({ output });
    } catch (error) {
        console.error('Erreur lors de l\'exécution du script:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 