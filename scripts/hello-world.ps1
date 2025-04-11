# Vérification de la disponibilité de PowerShell Core
if (-not (Get-Command pwsh -ErrorAction SilentlyContinue)) {
    Write-Error "PowerShell Core n'est pas installé. Veuillez l'installer pour utiliser ce script."
    exit 1
}

# Configuration de l'environnement PowerShell
$env:NO_COLOR = "1"
$PSStyle.OutputRendering = "PlainText"
$ProgressPreference = "SilentlyContinue"
$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"

# Vérification de la disponibilité des modules
$requiredModules = @(
    "ExchangeOnlineManagement",
    "Az"
)

foreach ($module in $requiredModules) {
    if (-not (Get-Module -ListAvailable -Name $module)) {
        Write-Warning "Le module $module n'est pas installé. Certaines fonctionnalités peuvent ne pas être disponibles."
    }
}

# Configuration des variables d'environnement pour le mode démonstration
$env:DEMO_MODE = "true"
$env:DEMO_USER = "demo@example.com"
$env:DEMO_TENANT = "demo.onmicrosoft.com"

# Configuration des variables d'environnement pour l'authentification Azure
$env:AZURE_CLIENT_ID = "demo-client-id"
$env:AZURE_CLIENT_SECRET = "demo-client-secret"
$env:AZURE_TENANT_ID = "demo-tenant-id"

# Configuration des variables d'environnement pour Exchange Online
$env:EXCHANGE_URL = "https://outlook.office365.com/powershell-liveid/"
$env:EXCHANGE_SCOPE = "https://outlook.office365.com/.default"

# Configuration des variables d'environnement pour la gestion des erreurs
$env:ERROR_ACTION = "Stop"
$env:ERROR_PREFERENCE = "Stop"
$env:VERBOSE_PREFERENCE = "Continue"

# Configuration des variables d'environnement pour la journalisation
$env:LOG_LEVEL = "Information"
$env:LOG_PATH = "./logs"
$env:LOG_FILE = "script-execution.log"

# Configuration des variables d'environnement pour la gestion des sessions
$env:SESSION_TIMEOUT = "3600"
$env:SESSION_REFRESH = "true"

# Configuration des variables d'environnement pour la gestion des tokens
$env:TOKEN_EXPIRY = "3600"
$env:TOKEN_REFRESH = "true"

# Configuration des variables d'environnement pour la gestion des certificats
$env:CERT_PATH = "./certs"
$env:CERT_NAME = "demo-cert"

# Configuration des variables d'environnement pour la gestion des connexions
$env:CONNECTION_TIMEOUT = "30"
$env:CONNECTION_RETRY = "3"

# Configuration des variables d'environnement pour la gestion des requêtes
$env:REQUEST_TIMEOUT = "30"
$env:REQUEST_RETRY = "3"

# Configuration des variables d'environnement pour la gestion des réponses
$env:RESPONSE_TIMEOUT = "30"
$env:RESPONSE_RETRY = "3"

# Configuration des variables d'environnement pour la gestion des erreurs
$env:ERROR_RETRY = "3"
$env:ERROR_TIMEOUT = "30"

# Configuration des variables d'environnement pour la gestion des logs
$env:LOG_RETENTION = "30"
$env:LOG_ROTATION = "true"

# Script simple sans authentification
Write-Host "Hello World from PowerShell!"
Write-Host "Current date and time: $(Get-Date)"
Write-Host "Computer name: $(hostname)"
Write-Host "Current user: $(whoami)"

# Liste des processus en cours d'exécution (top 5)
Write-Host "`nTop 5 processes by memory usage:"
Get-Process | Sort-Object -Property WorkingSet -Descending | Select-Object -First 5 | Format-Table -Property Id, Name, WorkingSet 