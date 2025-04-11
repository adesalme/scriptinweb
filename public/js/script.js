document.addEventListener('DOMContentLoaded', function() {
  // Initialisation de Socket.IO
  const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 3
  });
  
  // Variables globales
  let currentScript = '';
  let editor = null;
  
  // Initialisation de l'éditeur CodeMirror
  editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    mode: 'powershell',
    theme: 'monokai',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    tabSize: 4
  });
  
  // Référence à la console PowerShell
  const psConsole = document.getElementById('console');
  
  // Fonction pour ajouter du texte à la console
  function appendToConsole(text, className = '') {
    if (!text || text.trim() === '') return;
    
    const element = document.createElement('div');
    element.textContent = text;
    if (className) {
        element.classList.add(className);
    }
    psConsole.appendChild(element);
    psConsole.scrollTop = psConsole.scrollHeight;
  }
  
  // Fonction pour effacer la console
  function clearConsole() {
    psConsole.innerHTML = '';
  }
  
  // Fonction pour charger la liste des scripts
  async function loadScriptsList() {
    try {
      const response = await fetch('/api/scripts');
      const scripts = await response.json();
      
      const scriptsList = document.getElementById('scriptsList');
      scriptsList.innerHTML = '';
      
      if (scripts.length === 0) {
        scriptsList.innerHTML = '<li class="list-group-item text-center text-muted">Aucun script disponible</li>';
        return;
      }
      
      scripts.forEach(script => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center script-item';
        item.setAttribute('data-name', script.name);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = script.name.replace('.ps1', '');
        
        const buttonsDiv = document.createElement('div');
        
        // Bouton Exécuter
        const executeBtn = document.createElement('button');
        executeBtn.className = 'btn btn-sm btn-success me-1';
        executeBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        executeBtn.title = 'Exécuter';
        executeBtn.onclick = () => executeScript(script.name);
        
        // Bouton Modifier
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-primary me-1';
        editBtn.innerHTML = '<i class="bi bi-pencil-fill"></i>';
        editBtn.title = 'Modifier';
        editBtn.onclick = () => loadScript(script.name);
        
        // Bouton Supprimer
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i>';
        deleteBtn.title = 'Supprimer';
        deleteBtn.onclick = () => deleteScript(script.name);
        
        buttonsDiv.appendChild(executeBtn);
        buttonsDiv.appendChild(editBtn);
        buttonsDiv.appendChild(deleteBtn);
        
        item.appendChild(nameSpan);
        item.appendChild(buttonsDiv);
        scriptsList.appendChild(item);
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la liste des scripts:', error);
      appendToConsole('Erreur lors du chargement de la liste des scripts', 'error');
    }
  }
  
  // Fonction pour charger un script
  async function loadScript(name) {
    try {
      const response = await fetch(`/api/scripts/${encodeURIComponent(name)}`);
      const data = await response.json();
      
      document.getElementById('scriptName').value = name.replace('.ps1', '');
      editor.setValue(data.content);
      currentScript = name;
    } catch (error) {
      console.error('Erreur lors du chargement du script:', error);
      appendToConsole('Erreur lors du chargement du script', 'error');
    }
  }
  
  // Fonction pour sauvegarder un script
  async function saveScript() {
    const scriptName = document.getElementById('scriptName').value;
    const scriptContent = editor.getValue();
    const isAdminScript = document.getElementById('isAdminScript').checked;
    const scriptCatalog = document.querySelector('input[name="scriptCatalog"]:checked').value;
    
    if (!scriptName) {
        alert('Veuillez entrer un nom de script');
        return;
    }
    
    // Nettoyer le nom du script (enlever .ps1 s'il est présent)
    const cleanName = scriptName.endsWith('.ps1') ? scriptName.slice(0, -4) : scriptName;
    
    try {
        const method = currentScript ? 'PUT' : 'POST';
        const url = currentScript ? `/api/scripts/${encodeURIComponent(cleanName)}` : '/api/scripts';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: cleanName,
                content: scriptContent,
                isAdminScript,
                scriptCatalog
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la sauvegarde du script');
        }
        
        const result = await response.json();
        currentScript = cleanName;
        
        // Mettre à jour le message de succès avec le catalogue
        alert(`Script ${currentScript ? 'mis à jour' : 'créé'} avec succès dans le catalogue ${result.catalog === 'admin' ? 'administrateur' : 'utilisateur'}`);
        
        // Recharger la liste des scripts
        loadScriptsList();
        
        // Fermer le modal
        document.getElementById('newScriptModal').style.display = 'none';
    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message);
    }
  }
  
  // Fonction pour supprimer un script
  async function deleteScript(name) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le script "${name}" ?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/scripts/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        appendToConsole(`Script "${name}" supprimé avec succès`, 'success');
        loadScriptsList();
        
        // Si le script supprimé était en cours d'édition, effacer l'éditeur
        if (currentScript === name) {
          editor.setValue('');
          document.getElementById('scriptName').value = '';
          currentScript = '';
        }
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du script:', error);
      appendToConsole('Erreur lors de la suppression du script: ' + error.message, 'error');
    }
  }
  
  // Fonction pour exécuter un script
  function executeScript(name) {
    clearConsole();
    appendToConsole(`Exécution du script "${name}"...`, 'command');
    
    // Déterminer le service en fonction du nom du script
    let service = 'exchange';
    if (name.toLowerCase().includes('azure')) {
      service = 'azure';
    }
    
    // Nettoyer le nom du script et s'assurer qu'il a l'extension .ps1
    const cleanName = name.replace(/\.ps1$/, '');
    const scriptName = `${cleanName}.ps1`;
    
    socket.emit('execute-script', { scriptName, service });
  }
  
  // Gestionnaires d'événements
  document.getElementById('saveScript').addEventListener('click', saveScript);
  document.getElementById('clearConsole').addEventListener('click', clearConsole);
  
  // Écouter les événements Socket.IO
  socket.on('connect', () => {
    appendToConsole('Connecté au serveur', 'success');
  });
  
  socket.on('disconnect', () => {
    appendToConsole('Déconnecté du serveur', 'warning');
  });
  
  socket.on('script-output', function(data) {
    // Si data est une chaîne, l'afficher directement
    if (typeof data === 'string') {
        appendToConsole(data);
    }
    // Si data est un objet avec une propriété output, afficher output
    else if (data && data.output) {
        appendToConsole(data.output);
    }
  });
  
  socket.on('script-error', function(error) {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Erreur inconnue';
    appendToConsole(errorMessage, 'error');
  });
  
  socket.on('execution-completed', function() {
    appendToConsole('Exécution terminée', 'success');
  });
  
  // Charger la liste des scripts au démarrage
  loadScriptsList();
});

function createNewScript() {
    // Réinitialiser le formulaire
    document.getElementById('scriptName').value = '';
    editor.setValue('');
    document.getElementById('isAdminScript').checked = false;
    document.querySelector('input[name="scriptCatalog"][value="user"]').checked = true;
    
    // Réinitialiser le script courant
    currentScript = null;
    
    // Afficher le modal
    document.getElementById('newScriptModal').style.display = 'block';
}

// Fonction pour fermer le modal
function closeNewScriptModal() {
    document.getElementById('newScriptModal').style.display = 'none';
}

// Fermer le modal si on clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('newScriptModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
} 