# Script de connexion à Exchange Online avec gestion d'erreur pour Linux et Windows
try {
    # Vérifier si le module est disponible
    if (-not (Get-Module -ListAvailable -Name ExchangeOnlineManagement)) {
        Write-Error "Le module ExchangeOnlineManagement n'est pas installé. Veuillez l'installer avec: Install-Module -Name ExchangeOnlineManagement -Force"
        exit 1
    }
    
    # Importer le module
    Import-Module ExchangeOnlineManagement -ErrorAction Stop
    
    # Afficher des informations de diagnostic
    Write-Output "PowerShell Version: $($PSVersionTable.PSVersion)"
    Write-Output "OS: $($PSVersionTable.OS)"
    Write-Output "Module ExchangeOnlineManagement chargé avec succès."
    
    # Essayer de se connecter avec un comportement interactif
    Write-Output "Tentative de connexion à Exchange Online..."
    Connect-ExchangeOnline -ErrorAction Stop
    
    Write-Output "Connexion réussie à Exchange Online."
} catch {
    Write-Error "Erreur lors de la connexion à Exchange Online: $_"
} 