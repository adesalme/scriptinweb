#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si l'utilisateur est root
if [ "$EUID" -ne 0 ]; then
    print_warning "Ce script doit être exécuté en tant que root (sudo)"
    print_warning "Tentative d'exécution avec sudo..."
    sudo "$0" "$@"
    exit $?
fi

print_message "Installation des prérequis pour PowerShell Web Editor..."

# Mettre à jour les paquets
print_message "Mise à jour des paquets..."
apt-get update
apt-get upgrade -y

# Installer les dépendances pour PowerShell Core
print_message "Installation des dépendances pour PowerShell Core..."
apt-get install -y curl gnupg apt-transport-https

# Ajouter le dépôt Microsoft
print_message "Ajout du dépôt Microsoft..."
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-debian-bullseye-prod bullseye main" > /etc/apt/sources.list.d/microsoft.list'
apt-get update

# Installer PowerShell Core
print_message "Installation de PowerShell Core..."
apt-get install -y powershell

# Vérifier l'installation de PowerShell Core
if command -v pwsh &> /dev/null; then
    print_success "PowerShell Core installé avec succès:"
    pwsh -Command '$PSVersionTable.PSVersion'
else
    print_error "Échec de l'installation de PowerShell Core"
    exit 1
fi

# Installer les modules PowerShell nécessaires
print_message "Installation des modules PowerShell nécessaires..."
pwsh -Command "Set-PSRepository -Name 'PSGallery' -InstallationPolicy Trusted"
pwsh -Command "Install-Module -Name ExchangeOnlineManagement -Force -Scope AllUsers"
pwsh -Command "Install-Module -Name Az -Force -AllowClobber -Scope AllUsers"

# Vérifier l'installation des modules
print_message "Vérification des modules PowerShell installés..."
pwsh -Command "Get-Module -Name ExchangeOnlineManagement -ListAvailable | Select-Object Name, Version"
pwsh -Command "Get-Module -Name Az -ListAvailable | Select-Object Name, Version"

# Installer Node.js et npm si nécessaire
if ! command -v node &> /dev/null; then
    print_message "Installation de Node.js et npm..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Vérifier l'installation de Node.js
if command -v node &> /dev/null; then
    print_success "Node.js installé avec succès: $(node -v)"
    print_success "npm installé avec succès: $(npm -v)"
else
    print_error "Échec de l'installation de Node.js"
    exit 1
fi

# Installer les dépendances du projet
print_message "Installation des dépendances du projet..."
npm install

# Créer les dossiers nécessaires
print_message "Création des dossiers nécessaires..."
mkdir -p scripts
mkdir -p certs

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    print_message "Création du fichier .env à partir du modèle..."
    cp .env.example .env
    print_warning "Le fichier .env a été créé. Veuillez le modifier avec vos informations d'authentification Azure."
fi

print_success "Installation des prérequis terminée avec succès!"
print_message "Vous pouvez maintenant démarrer l'application avec: npm start"
print_message "Pour le développement, utilisez: npm run dev" 