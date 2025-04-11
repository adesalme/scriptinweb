// Initialize CodeMirror editor
const editor = CodeMirror(document.getElementById('editor'), {
    mode: 'powershell',
    theme: 'powershell',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    lineWrapping: true
});

// Get DOM elements
const executeBtn = document.getElementById('executeBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const output = document.getElementById('output');

// State management
let isExecuting = false;
let currentExecution = null;

// Event listeners
executeBtn.addEventListener('click', executeScript);
stopBtn.addEventListener('click', stopExecution);
clearBtn.addEventListener('click', clearOutput);

// Function to execute the script
async function executeScript() {
    if (isExecuting) {
        return;
    }

    const script = editor.getValue();
    if (!script.trim()) {
        appendOutput('Erreur: Le script est vide.');
        return;
    }

    try {
        isExecuting = true;
        updateButtonStates();

        const response = await fetch('/api/execute-interactive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ script })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            appendOutput(text);
        }
    } catch (error) {
        appendOutput(`Erreur: ${error.message}`);
    } finally {
        isExecuting = false;
        updateButtonStates();
    }
}

// Function to stop script execution
function stopExecution() {
    if (!isExecuting) {
        return;
    }

    fetch('/api/stop-execution', {
        method: 'POST'
    }).catch(error => {
        console.error('Error stopping execution:', error);
    });

    isExecuting = false;
    updateButtonStates();
    appendOutput('\nExécution arrêtée par l\'utilisateur.');
}

// Function to clear the output
function clearOutput() {
    output.textContent = '';
}

// Function to append text to the output
function appendOutput(text) {
    output.textContent += text;
    output.scrollTop = output.scrollHeight;
}

// Function to update button states
function updateButtonStates() {
    executeBtn.disabled = isExecuting;
    stopBtn.disabled = !isExecuting;
    clearBtn.disabled = isExecuting;
}

// Initialize button states
updateButtonStates(); 