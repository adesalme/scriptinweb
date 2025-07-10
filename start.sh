#!/bin/bash
set -e

# Copier .env.example en .env si .env n'existe pas
echo "[scriptinweb] Vérification du fichier .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[scriptinweb] .env créé à partir de .env.example. Pensez à le personnaliser."
else
  echo "[scriptinweb] .env déjà présent."
fi

# Installation des dépendances frontend
if [ -d "frontend" ]; then
  echo "[scriptinweb] Installation des dépendances frontend..."
  cd frontend
  if [ -f "package.json" ]; then
    npm install
  fi
  cd ..
fi

# Installation des dépendances backend
if [ -d "backend" ]; then
  echo "[scriptinweb] Installation des dépendances backend..."
  cd backend
  if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
  fi
  cd ..
fi

# Build et lancement des conteneurs
echo "[scriptinweb] Build et lancement de l'application (docker-compose up --build)..."
docker-compose up --build 