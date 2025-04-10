document.addEventListener('DOMContentLoaded', function() {
  // Initialisation de Socket.IO
  const socket = io();
  
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
    tabSize: 4,
    indentWithTabs: true,
    extraKeys: {
      'Tab': function(cm) {
        cm.replaceSelection('    ');
      }
    }
  });
  
  // Référence à la console PowerShell
  const psConsole = document.getElementById('console');
  
  // Fonction pour ajouter du texte à la console
  function appendToConsole(text, className = '') {
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
    const name = document.getElementById('scriptName').value.trim();
    const content = editor.getValue();
    
    if (!name) {
      alert('Veuillez saisir un nom pour le script');
      return;
    }
    
    // Nettoyer le nom du script : enlever .ps1 s'il existe et le rajouter proprement
    const cleanName = name.replace(/\.ps1$/, '');
    const fullName = `${cleanName}.ps1`;
    
    try {
      // Utiliser PUT si le script existe déjà, sinon POST pour un nouveau script
      const method = currentScript ? 'PUT' : 'POST';
      const url = currentScript 
        ? `/api/scripts/${encodeURIComponent(currentScript)}`
        : '/api/scripts';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: fullName, content })
      });
      
      if (response.ok) {
        appendToConsole(`Script "${fullName}" ${currentScript ? 'modifié' : 'créé'} avec succès`, 'success');
        currentScript = fullName; // Mettre à jour le script courant
        loadScriptsList();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du script:', error);
      appendToConsole('Erreur lors de la sauvegarde du script: ' + error.message, 'error');
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
  socket.on('script-output', function(data) {
    if (data.output) {
      appendToConsole(data.output);
    }
  });
  
  socket.on('execution-error', function(data) {
    if (data.message) {
      appendToConsole('Erreur: ' + data.message, 'error');
    }
    if (data.stack) {
      appendToConsole('Stack trace: ' + data.stack, 'error');
    }
  });
  
  socket.on('execution-completed', function(data) {
    appendToConsole('Exécution terminée', 'success');
  });
  
  // Charger la liste des scripts au démarrage
  loadScriptsList();
}); 