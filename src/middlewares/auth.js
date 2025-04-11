const config = require('../config/config');

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

const isAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.render('error', {
            message: 'Accès non autorisé',
            error: { status: 403, stack: 'Vous n\'avez pas les droits d\'administrateur nécessaires pour accéder à cette page.' },
            user: req.session.user || null
        });
    }
    next();
};

module.exports = {
    requireAuth,
    ensureAuthenticated,
    isAdmin
}; 