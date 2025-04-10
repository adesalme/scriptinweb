# PowerShell Web Editor

Une application web pour éditer et exécuter des scripts PowerShell en temps réel, compatible avec Windows et Linux (via PowerShell Core).

## Fonctionnalités

- Interface utilisateur web pour créer, éditer, et gérer des scripts PowerShell
- Exécution en temps réel avec affichage des résultats dans une console intégrée
- Support de Windows et Linux (avec PowerShell Core)
- Possibilité d'utiliser des identifiants pour les scripts nécessitant des privilèges administratifs
- Support SSL pour sécuriser les connexions

## Prérequis

- Docker et Docker Compose
- Certificats SSL (optionnel)

## Déploiement avec Docker

### 1. Configurer les certificats SSL (optionnel)

Pour activer HTTPS, placez vos certificats SSL dans le dossier `certs/` :

```bash
mkdir -p certs
# Copiez vos certificats SSL dans le dossier certs/
# - Certificat : certs/cert.pem
# - Clé privée : certs/key.pem
```

Alternativement, vous pouvez spécifier les chemins vers vos certificats dans le fichier `.env` :

```bash
cp .env.example .env
# Modifiez les variables SSL_CERT_PATH et SSL_KEY_PATH dans le fichier .env
```

### 2. Construire et démarrer le conteneur

```bash
docker-compose up -d
```

L'application sera accessible sur le port 3000 par défaut : http://localhost:3000 ou https://localhost:3000 si SSL est configuré.

### 3. Arrêter le conteneur

```bash
docker-compose down
```

## Configuration

Toutes les configurations peuvent être effectuées via le fichier `.env` :

```
# Configuration du serveur
PORT=3000

# Chemins des certificats SSL
SSL_CERT_PATH=/path/to/your/certificate.pem
SSL_KEY_PATH=/path/to/your/private-key.pem

# Autres configurations
NODE_ENV=production
```

## Développement sans Docker

### Installation

```bash
# Cloner le dépôt
git clone <repo-url>
cd ps-web-editor

# Installer les dépendances
npm install

# Démarrer l'application en mode développement
npm run dev
```

### Prérequis pour le développement local

- Node.js v14+
- PowerShell Core (pwsh) pour Linux/macOS ou PowerShell pour Windows

## Utilisation de PowerShell Core sur Linux

L'application utilise PowerShell Core (pwsh) sur les systèmes Linux. Pour des fonctionnalités Exchange Online, vous devrez installer le module approprié :

```bash
# Dans PowerShell Core (pwsh)
Install-Module -Name ExchangeOnlineManagement -Force
```

## Structure des dossiers

- `src/` - Code source JavaScript de l'application
- `scripts/` - Scripts PowerShell stockés
- `views/` - Templates EJS pour les pages web
- `public/` - Fichiers statiques (CSS, JavaScript client)
- `certs/` - Certificats SSL pour HTTPS

## Utilisation

### Démarrer l'application

```bash
npm start
```

ou pour le développement avec redémarrage automatique :

```bash
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000)

### Utilisation de l'interface

1. **Créer un script** : 
   - Saisissez le code PowerShell dans l'éditeur
   - Donnez un nom au script dans le champ de texte
   - Cliquez sur "Enregistrer"

2. **Exécuter un script** :
   - Cliquez sur le bouton "Exécuter" à côté du script dans la liste
   - Les résultats s'afficheront dans la console PowerShell

3. **Modifier un script** :
   - Cliquez sur le bouton "Modifier" pour charger le script dans l'éditeur
   - Apportez vos modifications
   - Cliquez sur "Enregistrer"

4. **Supprimer un script** :
   - Cliquez sur le bouton "Supprimer" à côté du script dans la liste

5. **Exécution avec identifiants** :
   - Si un script nécessite des droits administratifs, une fenêtre modale apparaîtra
   - Saisissez votre email et mot de passe
   - Cliquez sur "Valider" pour exécuter le script avec ces identifiants

## Structure du projet

```
ps-web-editor/
├── public/              # Fichiers statiques
│   ├── css/             # Feuilles de style
│   └── js/              # Scripts côté client
├── scripts/             # Dossier où sont stockés les scripts PowerShell
├── src/                 # Code source du serveur
│   └── app.js           # Fichier principal de l'application
├── views/               # Fichiers de templates EJS
│   └── index.ejs        # Page principale
├── package.json         # Dépendances du projet
└── README.md            # Ce fichier
```

## Sécurité

⚠️ **Attention** : Cette application est conçue à des fins de démonstration. Pour une utilisation en production, considérez les points suivants :

- Ajoutez une authentification utilisateur
- Utilisez HTTPS pour sécuriser les communications
- Limitez les commandes PowerShell autorisées
- Implémentez des mécanismes de protection contre les injections de code malveillant
- Chiffrez les identifiants lorsqu'ils sont transmis au serveur

## Licence

ISC # scriptinweb
