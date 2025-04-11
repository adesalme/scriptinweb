let editor = null;
let currentScript = '';

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de CodeMirror
    editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
        mode: 'powershell',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4
    });

    // Charger la liste des scripts au démarrage
    loadScriptsList();
});

// Fonction pour charger la liste des scripts
async function loadScriptsList() {
    try {
        const response = await fetch('/api/scripts?type=admin');
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
    
    if (!scriptName) {
        alert('Veuillez entrer un nom de script');
        return;
    }
    
    // Nettoyer le nom du script (enlever .ps1 s'il est présent)
    const cleanName = scriptName.endsWith('.ps1') ? scriptName.slice(0, -4) : scriptName;
    
    try {
        const method = currentScript ? 'PUT' : 'POST';
        const url = currentScript ? `/api/scripts/${encodeURIComponent(currentScript)}` : '/api/scripts';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: cleanName,
                content: scriptContent,
                isAdmin: true
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la sauvegarde du script');
        }
        
        appendToConsole(`Script ${currentScript ? 'mis à jour' : 'créé'} avec succès`, 'success');
        currentScript = cleanName + '.ps1';
        loadScriptsList();
    } catch (error) {
        console.error('Erreur:', error);
        appendToConsole(error.message, 'error');
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
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la suppression du script');
        }
        
        appendToConsole(`Script "${name}" supprimé avec succès`, 'success');
        
        // Si le script supprimé était en cours d'édition, effacer l'éditeur
        if (currentScript === name) {
            editor.setValue('');
            document.getElementById('scriptName').value = '';
            currentScript = '';
        }
        
        loadScriptsList();
    } catch (error) {
        console.error('Erreur:', error);
        appendToConsole(error.message, 'error');
    }
}

// Fonction pour exécuter le script courant
async function executeCurrentScript() {
    if (!currentScript) {
        alert('Veuillez d\'abord sauvegarder le script');
        return;
    }
    
    await executeScript(currentScript);
}

// Fonction pour exécuter un script
async function executeScript(name) {
    try {
        appendToConsole(`Exécution de ${name}...`, 'command');
        
        const response = await fetch(`/api/scripts/${encodeURIComponent(name)}/execute`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de l\'exécution du script');
        }
        
        const result = await response.json();
        appendToConsole(result.output);
    } catch (error) {
        console.error('Erreur:', error);
        appendToConsole(error.message, 'error');
    }
}

// Fonction pour créer un nouveau script
function createNewScript() {
    currentScript = '';
    document.getElementById('scriptName').value = '';
    editor.setValue('');
}

// Fonction pour effacer la console
function clearConsole() {
    document.getElementById('console').innerHTML = '';
}

// Fonction pour ajouter du texte à la console
function appendToConsole(text, className = '') {
    const consoleElement = document.getElementById('console');
    const element = document.createElement('div');
    element.textContent = text;
    if (className) {
        element.classList.add(className);
    }
    consoleElement.appendChild(element);
    consoleElement.scrollTop = consoleElement.scrollHeight;
} 