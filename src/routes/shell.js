const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const powershellService = require('../services/powershellService');

// Route pour la page shell
router.get('/', requireAuth, (req, res) => {
    res.render('shell', { 
        title: 'PowerShell Shell',
        user: req.session.user 
    });
});

// Route pour exécuter une commande
router.post('/execute', requireAuth, async (req, res) => {
    try {
        const { command } = req.body;
        const output = await powershellService.executeCommand(command);
        res.json({ output });
    } catch (error) {
        console.error('Error executing command:', error);
        res.status(500).json({ 
            error: 'Une erreur est survenue lors de l\'exécution de la commande',
            details: error.message 
        });
    }
});

module.exports = router; 