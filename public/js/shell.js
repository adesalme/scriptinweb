document.addEventListener('DOMContentLoaded', function() {
  // Initialisation de Socket.IO
  const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 3
  });
  
  // Références aux éléments DOM
  const shellOutput = document.getElementById('shell-output');
  const commandInput = document.getElementById('commandInput');
  
  // Fonction pour ajouter du texte à la console
  function appendOutput(text, isError = false) {
    if (!text || text.trim() === '') return;
    
    const element = document.createElement('div');
    element.textContent = text;
    if (isError) {
      element.classList.add('error');
    }
    shellOutput.appendChild(element);
    shellOutput.scrollTop = shellOutput.scrollHeight;
  }
  
  // Fonction pour effacer la console
  function clearConsole() {
    shellOutput.innerHTML = '';
    showWelcomeMessage();
  }
  
  // Fonction pour afficher le message de bienvenue
  function showWelcomeMessage() {
    appendOutput('Windows PowerShell');
    appendOutput('Copyright (C) Microsoft Corporation. Tous droits réservés.');
    appendOutput('');
    appendOutput('PS C:\\Windows\\System32>');
  }
  
  // Gestionnaire d'événements pour l'entrée de commande
  commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const command = commandInput.value;
      appendOutput('PS C:\\Windows\\System32> ' + command);
      socket.emit('execute-command', command);
      commandInput.value = '';
    }
  });
  
  // Écouteurs d'événements Socket.IO
  socket.on('connect', () => {
    appendOutput('Connecté au serveur PowerShell', 'success');
  });
  
  socket.on('disconnect', () => {
    appendOutput('Déconnecté du serveur PowerShell', 'error');
  });
  
  socket.on('command-output', (data) => {
    appendOutput(data);
  });
  
  socket.on('command-error', (data) => {
    appendOutput(data, true);
  });
  
  socket.on('command-end', () => {
    commandInput.disabled = false;
    commandInput.focus();
  });
  
  // Rendre toute la zone de la console cliquable
  shellOutput.addEventListener('click', () => {
    commandInput.focus();
  });
  
  // Focus initial sur l'input
  commandInput.focus();
  
  // Afficher le message de bienvenue initial
  showWelcomeMessage();
}); 