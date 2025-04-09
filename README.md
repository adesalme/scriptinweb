# PowerShell Web Editor

Une application web Node.js qui permet de créer, modifier, supprimer et exécuter des scripts PowerShell via une interface web.

## Fonctionnalités

- Éditeur de scripts PowerShell avec coloration syntaxique
- Liste des scripts disponibles avec options d'exécution, de modification et de suppression
- Console PowerShell intégrée pour afficher les résultats d'exécution
- Gestion des identifiants pour l'exécution de scripts nécessitant des droits administratifs

## Prérequis

- Node.js (v12 ou supérieur)
- PowerShell (Windows PowerShell 5.1 ou PowerShell Core 6+)

## Installation

1. Clonez ce dépôt ou téléchargez les fichiers
2. Naviguez dans le dossier du projet
3. Installez les dépendances

```bash
cd ps-web-editor
npm install
```

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
