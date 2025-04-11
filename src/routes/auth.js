const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { requireAuth } = require('../middlewares/auth');

// Route de login
router.get('/login', async (req, res) => {
    try {
        const authUrl = await authService.getAuthUrl();
        res.render('login', { 
            title: 'Connexion',
            user: req.session.user,
            authUrl
        });
    } catch (error) {
        console.error('Error getting auth URL:', error);
        res.render('error', {
            title: 'Erreur',
            message: 'Une erreur est survenue lors de la préparation de l\'authentification',
            error: error.message,
            user: req.session.user
        });
    }
});

// Route de callback
router.get('/callback', async (req, res) => {
    try {
        // Exchange the authorization code for a token
        const tokenData = await authService.handleCallback(req.query.code);
        
        // Get user info using the access token
        const userInfo = await authService.getUserInfo(tokenData.accessToken);
        
        // Store user info in session
        req.session.user = userInfo;
        
        // Redirect to home page
        res.redirect('/');
    } catch (error) {
        console.error('Auth callback error:', error);
        res.render('error', { 
            title: 'Erreur d\'Authentification',
            message: 'Une erreur est survenue lors de l\'authentification',
            error: {
                status: 500,
                stack: error.message || 'Une erreur inattendue est survenue'
            },
            user: req.session.user 
        });
    }
});

// Route de déconnexion
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router; 