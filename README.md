# ScriptInWeb

Une application web pour éditer et exécuter des scripts PowerShell en temps réel, avec authentification Azure AD et support pour Windows et Linux (via PowerShell Core).

## Fonctionnalités

- Interface utilisateur web pour créer, éditer, et gérer des scripts PowerShell
- Exécution en temps réel avec affichage des résultats dans une console intégrée
- Shell PowerShell interactif intégré à l'interface web
- Authentification via Azure AD (Microsoft Entra ID)
- Mode démonstration pour tester sans configuration Azure
- Support de Windows et Linux (avec PowerShell Core)
- Support SSL pour sécuriser les connexions
- Stockage des sessions dans des fichiers pour une meilleure persistance

## Prérequis

- Node.js v14+
- PowerShell Core (pwsh) pour Linux/macOS ou PowerShell pour Windows
- Certificats SSL (optionnel, mais recommandé pour la production)

## Installation

### Option 1 : Installation automatique (Linux)

Un script d'installation est fourni pour configurer automatiquement tous les prérequis sur Linux :

```bash
# Rendre le script exécutable
chmod +x install-prerequisites.sh

# Exécuter le script en tant que root
sudo ./install-prerequisites.sh
```

Ce script installe :
- PowerShell Core
- Modules PowerShell nécessaires (ExchangeOnlineManagement, Az)
- Node.js et npm
- Dépendances du projet

### Option 2 : Installation manuelle

```bash
# Cloner le dépôt
git clone <repo-url>
cd scriptinweb

# Installer les dépendances
npm install

# Créer les dossiers nécessaires
mkdir -p scripts
mkdir -p certs
```

## Configuration

Toutes les configurations sont centralisées dans le fichier `.env` :

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Modifier les variables selon votre environnement
```

### Variables de configuration principales

```
# Configuration du serveur
PORT=3000
HTTPS_PORT=8443
HOST=localhost

# Configuration SSL
SSL_ENABLED=true
SSL_CERT_PATH=/ssl/cert.pem
SSL_KEY_PATH=/ssl/key.pem

# Configuration Azure AD
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_TENANT_ID=your_tenant_id
AZURE_REDIRECT_URI=https://adresse.domaine.com/auth/callback

# Configuration de l'application
APP_NAME=ScriptInWeb
APP_URL=https://adresse.domaine.com 
APP_DESCRIPTION=Éditeur de scripts PowerShell avec authentification Azure AD

# Configuration des dossiers
SCRIPTS_DIR=scripts
CERTIFICATES_DIR=certs

# Configuration de la session
SESSION_SECRET=your_session_secret
SESSION_STORE_PATH=./sessions

# Configuration du mode démonstration
DEMO_MODE=false
```

## Démarrage de l'application

### Mode production

```bash
npm start
```

### Mode développement

```bash
npm run dev
```

## Mode démonstration

Pour tester l'application sans configuration Azure AD, activez le mode démonstration dans le fichier `.env` :

```
DEMO_MODE=true
```

En mode démonstration :
- L'authentification Azure AD est désactivée
- Les commandes PowerShell sont simulées
- Aucune connexion à Azure n'est établie

## Utilisation de PowerShell Core sur Linux

L'application utilise PowerShell Core (pwsh) sur les systèmes Linux. Pour des fonctionnalités Exchange Online et Azure, vous devrez installer les modules appropriés :

```powershell
# Dans PowerShell Core (pwsh)
Install-Module -Name ExchangeOnlineManagement -Force
Install-Module -Name Az -Force -AllowClobber
```

## Structure des dossiers

- `src/` - Code source JavaScript de l'application
  - `app.js` - Point d'entrée de l'application
  - `services/` - Services de l'application (authentification, PowerShell)
- `views/` - Templates EJS pour l'interface utilisateur
- `public/` - Fichiers statiques (CSS, JavaScript, images)
- `scripts/` - Dossier pour stocker les scripts PowerShell
- `certs/` - Dossier pour les certificats SSL
- `sessions/` - Dossier pour le stockage des sessions

## Déploiement avec Docker

Un fichier `docker-compose.yml` est fourni pour faciliter le déploiement avec Docker :

```bash
docker-compose up -d
```

## Sécurité

- Les sessions sont stockées dans des fichiers pour une meilleure persistance
- Les certificats SSL sont utilisés pour sécuriser les connexions
- L'authentification Azure AD protège l'accès à l'application
- Les secrets sont stockés dans le fichier `.env` (non versionné)

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

ISC
