router.get('/', requireAuth, async (req, res) => {
    try {
        const scripts = await scriptService.getScripts();
        res.render('index', { 
            title: 'Accueil',
            scripts,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error fetching scripts:', error);
        res.status(500).render('error', { 
            title: 'Erreur',
            message: 'Une erreur est survenue lors du chargement des scripts',
            error,
            user: req.session.user
        });
    }
});

router.get('/shell', (req, res) => {
    res.render('shell', { 
        title: 'PowerShell Shell',
        user: req.session.user 
    });
});

router.get('/editor', requireAuth, (req, res) => {
    res.render('editor', { 
        title: 'Éditeur de Scripts',
        user: req.session.user 
    });
});

router.get('/scripts', requireAuth, (req, res) => {
    res.render('scripts', { 
        title: 'Mes Scripts',
        user: req.session.user 
    });
});

router.get('/scripts/:id', requireAuth, async (req, res) => {
    try {
        const script = await scriptService.getScript(req.params.id);
        if (!script) {
            return res.status(404).render('error', { 
                title: 'Script Non Trouvé',
                message: 'Le script demandé n\'existe pas',
                user: req.session.user
            });
        }
        res.render('script', { 
            title: script.name,
            script,
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error fetching script:', error);
        res.status(500).render('error', { 
            title: 'Erreur',
            message: 'Une erreur est survenue lors du chargement du script',
            error,
            user: req.session.user
        });
    }
}); 