const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { requireAuth, isAdmin } = require('../middlewares/auth');
const config = require('../config/config');
const UserManager = require('../models/User');
const scriptService = require('../services/scriptService');
const userManager = require('../models/User');

// Route pour la gestion des utilisateurs
router.get('/users', requireAuth, isAdmin, async (req, res) => {
    try {
        const users = await userManager.getAllUsers();
        res.render('admin/users', {
            title: 'Administration - Utilisateurs',
            users,
            user: req.session.user,
            isAuthenticated: true,
            isAdmin: true
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('error', {
            title: 'Erreur',
            message: 'Une erreur est survenue lors du chargement des utilisateurs',
            error,
            user: req.session.user
        });
    }
});

// Route pour modifier les droits d'un utilisateur
router.post('/users/:id/toggle-admin', requireAuth, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await UserManager.getUser(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        // Ne pas permettre de retirer les droits admin du premier utilisateur
        const users = await UserManager.getAllUsers();
        if (users[0].id === userId) {
            return res.status(403).json({ error: 'Impossible de modifier les droits du premier administrateur' });
        }
        
        const updatedUser = await UserManager.setAdmin(userId, !user.isAdmin);
        res.json(updatedUser);
    } catch (error) {
        console.error('Erreur lors de la modification des droits:', error);
        res.status(500).json({ error: 'Erreur lors de la modification des droits' });
    }
});

// Route pour la page des scripts administratifs
router.get('/scripts', requireAuth, isAdmin, async (req, res) => {
    try {
        const scripts = await scriptService.getAdminScripts();
        res.render('admin/scripts', {
            title: 'Administration - Scripts',
            scripts,
            user: req.session.user,
            isAuthenticated: true,
            isAdmin: true
        });
    } catch (error) {
        console.error('Error fetching admin scripts:', error);
        res.status(500).render('error', {
            title: 'Erreur',
            message: 'Une erreur est survenue lors du chargement des scripts d\'administration',
            error,
            user: req.session.user
        });
    }
});

// Route pour exécuter un script administratif
router.get('/scripts/:scriptName/execute', requireAuth, isAdmin, async (req, res) => {
    try {
        const scriptName = req.params.scriptName;
        const scriptPath = path.join(config.scripts.adminDirectory, scriptName);

        // Vérifier si le script existe
        try {
            await fs.access(scriptPath);
        } catch (error) {
            return res.status(404).render('error', {
                message: 'Script non trouvé',
                error: `Le script ${scriptName} n'existe pas`
            });
        }

        // Lire le contenu du script
        const content = await fs.readFile(scriptPath, 'utf8');

        res.render('admin/execute', {
            script: {
                name: scriptName,
                content: content,
                path: scriptPath
            },
            user: req.session.user,
            isAuthenticated: true,
            isAdmin: true
        });
    } catch (error) {
        console.error('Erreur lors de l\'accès au script:', error);
        res.status(500).render('error', {
            message: 'Erreur lors de l\'accès au script',
            error: error
        });
    }
});

router.get('/scripts/:id', requireAuth, isAdmin, (req, res) => {
    res.render('admin/script-detail', { 
        title: 'Détail du Script',
        user: req.session.user 
    });
});

router.get('/logs', requireAuth, isAdmin, (req, res) => {
    res.render('admin/logs', { 
        title: 'Administration - Logs',
        user: req.session.user 
    });
});

module.exports = router; 