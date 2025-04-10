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
      
      scripts.forEach(script => {
        const item = document.createElement('div');
        item.className = 'script-item d-flex justify-content-between align-items-center p-2 border-bottom';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = script;
        
        const buttonsDiv = document.createElement('div');
        
        // Bouton Exécuter
        const executeBtn = document.createElement('button');
        executeBtn.className = 'btn btn-sm btn-success me-1';
        executeBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
        executeBtn.title = 'Exécuter';
        executeBtn.onclick = () => executeScript(script);
        
        // Bouton Modifier
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-primary me-1';
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.title = 'Modifier';
        editBtn.onclick = () => loadScript(script);
        
        // Bouton Supprimer
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = 'Supprimer';
        deleteBtn.onclick = () => deleteScript(script);
        
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
      const response = await fetch(`/api/scripts/${name}`);
      const data = await response.json();
      
      document.getElementById('scriptName').value = data.name;
      editor.setValue(data.content);
      currentScript = data.name;
    } catch (error) {
      console.error('Erreur lors du chargement du script:', error);
      appendToConsole('Erreur lors du chargement du script', 'error');
    }
  }
  
  // Fonction pour sauvegarder un script
  async function saveScript() {
    const name = document.getElementById('scriptName').value;
    const content = editor.getValue();
    
    if (!name) {
      alert('Veuillez saisir un nom pour le script');
      return;
    }
    
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, content })
      });
      
      if (response.ok) {
        appendToConsole(`Script "${name}" sauvegardé avec succès`, 'success');
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
      const response = await fetch(`/api/scripts/${name}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        appendToConsole(`Script "${name}" supprimé avec succès`, 'success');
        loadScriptsList();
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
    if (name.includes('azure')) {
      service = 'azure';
    }
    
    socket.emit('execute-script', { scriptName: name, service });
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
    appendToConsole('Exécution terminée avec succès.', 'success');
  });
  
  // Charger la liste des scripts au démarrage
  loadScriptsList();
}); 