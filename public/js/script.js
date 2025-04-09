document.addEventListener('DOMContentLoaded', function() {
  // Initialisation de Socket.IO
  const socket = io();
  
  // Variables globales
  let currentScript = '';
  let credentialsModal = null;
  let currentScriptToExecute = '';
  
  // Initialisation de l'éditeur CodeMirror
  const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
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
  
  // Initialisation du modal Bootstrap
  credentialsModal = new bootstrap.Modal(document.getElementById('credentialsModal'));
  
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
  
  // Fonction pour charger la liste des scripts depuis le serveur
  function loadScriptsList() {
    fetch('/api/scripts')
      .then(response => response.json())
      .then(scripts => {
        const scriptsList = document.getElementById('scriptsList');
        scriptsList.innerHTML = '';
        
        if (scripts.length === 0) {
          scriptsList.innerHTML = '<li class="list-group-item text-center text-muted">Aucun script disponible</li>';
          return;
        }
        
        scripts.forEach(script => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center script-item';
          li.setAttribute('data-name', script);
          
          const scriptName = document.createTextNode(script);
          li.appendChild(scriptName);
          
          const buttonsDiv = document.createElement('div');
          
          const executeBtn = document.createElement('button');
          executeBtn.className = 'btn btn-sm btn-success execute-script';
          executeBtn.textContent = 'Exécuter';
          executeBtn.addEventListener('click', function() {
            executeScript(script);
          });
          
          const editBtn = document.createElement('button');
          editBtn.className = 'btn btn-sm btn-warning edit-script';
          editBtn.textContent = 'Modifier';
          editBtn.addEventListener('click', function() {
            loadScript(script);
          });
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn btn-sm btn-danger delete-script';
          deleteBtn.textContent = 'Supprimer';
          deleteBtn.addEventListener('click', function() {
            deleteScript(script);
          });
          
          buttonsDiv.appendChild(executeBtn);
          buttonsDiv.appendChild(editBtn);
          buttonsDiv.appendChild(deleteBtn);
          
          li.appendChild(buttonsDiv);
          scriptsList.appendChild(li);
        });
      })
      .catch(error => {
        console.error('Erreur lors du chargement des scripts:', error);
        appendToConsole('Erreur lors du chargement des scripts: ' + error.message, 'error');
      });
  }
  
  // Fonction pour charger un script dans l'éditeur
  function loadScript(name) {
    fetch(`/api/scripts/${name}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Script non trouvé');
        }
        return response.json();
      })
      .then(data => {
        editor.setValue(data.content);
        document.getElementById('scriptName').value = name;
        currentScript = name;
        appendToConsole(`Script "${name}" chargé dans l'éditeur.`, 'success');
      })
      .catch(error => {
        console.error('Erreur lors du chargement du script:', error);
        appendToConsole('Erreur: ' + error.message, 'error');
      });
  }
  
  // Fonction pour sauvegarder un script
  function saveScript() {
    const name = document.getElementById('scriptName').value.trim();
    const content = editor.getValue();
    
    if (!name) {
      appendToConsole('Erreur: Veuillez spécifier un nom pour le script.', 'error');
      return;
    }
    
    if (!content) {
      appendToConsole('Erreur: Le contenu du script est vide.', 'error');
      return;
    }
    
    const method = currentScript === name ? 'PUT' : 'POST';
    const url = currentScript === name ? `/api/scripts/${name}` : '/api/scripts';
    
    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, content })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erreur lors de la sauvegarde du script');
        }
        return response.json();
      })
      .then(data => {
        currentScript = name;
        appendToConsole(`Script "${name}" sauvegardé avec succès.`, 'success');
        loadScriptsList();
      })
      .catch(error => {
        console.error('Erreur:', error);
        appendToConsole('Erreur: ' + error.message, 'error');
      });
  }
  
  // Fonction pour supprimer un script
  function deleteScript(name) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le script "${name}" ?`)) {
      return;
    }
    
    fetch(`/api/scripts/${name}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression du script');
        }
        return response.json();
      })
      .then(data => {
        appendToConsole(`Script "${name}" supprimé avec succès.`, 'success');
        
        if (currentScript === name) {
          editor.setValue('');
          document.getElementById('scriptName').value = '';
          currentScript = '';
        }
        
        loadScriptsList();
      })
      .catch(error => {
        console.error('Erreur:', error);
        appendToConsole('Erreur: ' + error.message, 'error');
      });
  }
  
  // Fonction pour exécuter un script
  function executeScript(name, credentials = null) {
    appendToConsole(`Exécution du script "${name}"...`, 'command');
    currentScriptToExecute = name;
    
    socket.emit('execute-script', name, credentials);
  }
  
  // Gestionnaire d'événement pour le bouton de sauvegarde
  document.getElementById('saveScript').addEventListener('click', saveScript);
  
  // Gestionnaire d'événement pour effacer la console
  document.getElementById('clearConsole').addEventListener('click', clearConsole);
  
  // Gestionnaire d'événement pour soumettre les identifiants
  document.getElementById('submitCredentials').addEventListener('click', function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      alert('Veuillez renseigner tous les champs.');
      return;
    }
    
    credentialsModal.hide();
    
    // Réinitialiser le formulaire
    document.getElementById('credentialsForm').reset();
    
    // Exécuter le script avec les identifiants
    executeScript(currentScriptToExecute, { email, password });
  });
  
  // Écouter les événements Socket.IO
  socket.on('script-output', function(data) {
    appendToConsole(data.output);
  });
  
  socket.on('script-error', function(data) {
    appendToConsole(data.error, 'error');
  });
  
  socket.on('execution-completed', function(data) {
    appendToConsole('Exécution terminée.', 'success');
  });
  
  socket.on('execution-error', function(data) {
    appendToConsole('Erreur: ' + data.error, 'error');
  });
  
  socket.on('credentials-required', function(data) {
    appendToConsole('Ce script nécessite des droits administrateur.', 'command');
    currentScriptToExecute = data.scriptName;
    credentialsModal.show();
  });
  
  // Charger la liste initiale des scripts
  loadScriptsList();
}); 