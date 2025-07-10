# scriptinweb

Application web dockerisée pour écrire, sauvegarder et exécuter des scripts PowerShell avec authentification Azure SSO.

## Architecture

- **frontend/** : Application React + TypeScript + TailwindCSS (éditeur, console, liste de scripts)
- **backend/** : API FastAPI (Python) ou Express (Node.js) pour gestion auth, scripts, sessions
- **powershell-runner/** : Image Docker PowerShell Core + modules Az/Exchange pour exécution isolée
- **nginx/** : Reverse proxy pour sécuriser et router les requêtes
- **docker-compose.yml** : Orchestration multi-conteneurs
- **.env.example** : Variables d'environnement à configurer

## Fonctionnalités principales
- Authentification Azure SSO (Microsoft Entra ID)
- Éditeur de scripts PowerShell en ligne (Monaco Editor)
- Console PowerShell interactive
- Sauvegarde/chargement/exécution de scripts personnels
- Injection automatique du jeton SSO dans les scripts nécessitant Azure/Exchange

## Démarrage rapide

1. Copier `.env.example` en `.env` et compléter les variables
2. Lancer `docker-compose up --build`
3. Accéder à l'application via le navigateur

---

Voir chaque dossier pour plus de détails sur la configuration spécifique. 