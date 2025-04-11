# PowerShell Web Editor

Une application web pour éditer et exécuter des scripts PowerShell avec authentification Azure AD.

## Fonctionnalités

- Authentification via Azure AD
- Édition de scripts PowerShell avec coloration syntaxique
- Exécution de scripts en temps réel
- Support des scripts administratifs
- Interface utilisateur moderne et responsive
- Support SSL/HTTPS

## Prérequis

- Node.js 14+
- PowerShell Core (pwsh)
- Compte Azure AD pour l'authentification

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-compte/powershell-web-editor.git
   cd powershell-web-editor
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Copiez le fichier d'exemple de configuration :
   ```bash
   cp .env.example .env
   ```

4. Configurez les variables d'environnement dans le fichier `.env`

## Configuration

### Variables d'environnement

- `NODE_ENV` : Environnement (development/production)
- `PORT` : Port HTTP
- `HTTPS_PORT` : Port HTTPS
- `HOST` : Nom d'hôte
- `SSL_ENABLED` : Activer/désactiver SSL
- `AZURE_AD_*` : Configuration Azure AD
- Voir `.env.example` pour la liste complète

### SSL/HTTPS

Pour activer HTTPS :
1. Placez vos certificats dans le dossier `ssl/`
2. Configurez `SSL_ENABLED=true` dans `.env`
3. Définissez les chemins des certificats dans `.env`

## Structure du projet

```
/
├── src/            # Code source
├── public/         # Fichiers statiques
├── views/          # Templates EJS
├── scripts/        # Scripts PowerShell
├── ssl/           # Certificats SSL
└── sessions/      # Sessions utilisateurs
```

## Développement

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## Sécurité

- Authentification via Azure AD
- Support SSL/HTTPS
- Validation des entrées
- Protection CSRF
- Sessions sécurisées

## Licence

MIT
