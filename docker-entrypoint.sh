#!/bin/bash
set -e

# Charger les variables d'environnement s'il y a un fichier .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Vérifier et configurer le certificat SSL si spécifié dans .env
if [ -n "$SSL_CERT_PATH" ] && [ -n "$SSL_KEY_PATH" ]; then
  echo "Configuration SSL détectée. Mise en place des certificats..."
  
  # Vérifier si les fichiers de certificat existent
  if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
    # Copier les certificats dans le répertoire approprié
    cp "$SSL_CERT_PATH" /app/certs/cert.pem
    cp "$SSL_KEY_PATH" /app/certs/key.pem
    echo "Certificats SSL configurés avec succès."
  else
    echo "AVERTISSEMENT: Les fichiers de certificat SSL spécifiés dans .env n'existent pas."
  fi
fi

# Vérifier l'installation de PowerShell Core
echo "Vérification de PowerShell Core..."
if command -v pwsh &> /dev/null; then
  echo "PowerShell Core est installé:"
  pwsh -Command '$PSVersionTable.PSVersion'
else
  echo "AVERTISSEMENT: PowerShell Core n'est pas installé correctement."
fi

# Vérifier l'installation du module ExchangeOnlineManagement
echo "Vérification du module Exchange Online Management..."
pwsh -Command "Get-Module -Name ExchangeOnlineManagement -ListAvailable | Select-Object Name, Version" || echo "Module non disponible."

# Exécuter la commande spécifiée
echo "Démarrage de l'application..."
exec "$@" 