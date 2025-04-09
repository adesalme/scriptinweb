param(
    [Parameter(Mandatory=$false)]
    [System.Management.Automation.PSCredential]
    $Credential
)

Write-Host "Script nécessitant des droits administratifs"

# Vérifie si le script est exécuté en tant qu'administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Ce script n'est pas exécuté avec des privilèges administratifs." -ForegroundColor Red
    
    if ($Credential) {
        Write-Host "Identifiants fournis: $($Credential.UserName)" -ForegroundColor Yellow
        Write-Host "Tentative d'exécution avec les identifiants fournis..." -ForegroundColor Yellow
        
        # Simule une action qui nécessite des privilèges
        Write-Host "Simulation d'une action administrative avec les identifiants fournis." -ForegroundColor Green
    } else {
        Write-Host "Aucun identifiant fourni." -ForegroundColor Red
        Write-Error "Ce script nécessite des privilèges administrateur."
        exit 1
    }
} else {
    Write-Host "Le script est exécuté avec des privilèges administratifs." -ForegroundColor Green
}

# Affichage de quelques informations système
Write-Host "`nInformations système:"
Get-ComputerInfo | Select-Object OSName, OSVersion, OsHardwareAbstractionLayer

# Simulation d'une action administrative
Write-Host "`nSimulation d'actions administratives..."
Write-Host "Vérification des services Windows critiques:"
Get-Service -Name "wuauserv", "WinDefend", "BITS" | Format-Table -Property Name, DisplayName, Status 