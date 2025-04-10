FROM node:20-slim

# Installation de PowerShell Core
RUN apt-get update && \
    apt-get install -y curl gnupg apt-transport-https && \
    curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
    mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg && \
    sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-debian-bullseye-prod bullseye main" > /etc/apt/sources.list.d/microsoft.list' && \
    apt-get update && \
    apt-get install -y powershell && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Installation du module Exchange Online Management
RUN pwsh -Command "Set-PSRepository -Name 'PSGallery' -InstallationPolicy Trusted" && \
    pwsh -Command "Install-Module -Name ExchangeOnlineManagement -Force -Scope AllUsers"

# Dossier de l'application
WORKDIR /app

# Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste des fichiers de l'application
COPY . .

# Exposer le port
EXPOSE 3000

# Création d'un répertoire pour les certificats SSL
RUN mkdir -p /app/certs

# Script d'entrée pour gérer les certificats SSL et démarrer l'application
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Démarrer l'application
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"] 