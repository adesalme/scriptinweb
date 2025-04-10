# Script de connexion à Exchange Online avec token MSAL
try {
    # Vérifier si le module est disponible
    if (-not (Get-Module -ListAvailable -Name ExchangeOnlineManagement)) {
        Write-Output "Mode démonstration: Simulation de l'installation du module ExchangeOnlineManagement"
        # En mode démonstration, on continue sans le module
    } else {
        # Importer le module
        Import-Module ExchangeOnlineManagement -ErrorAction Stop
        Write-Output "Module ExchangeOnlineManagement chargé avec succès."
    }
    
    # Afficher des informations de diagnostic
    Write-Output "PowerShell Version: $($PSVersionTable.PSVersion)"
    Write-Output "OS: $($PSVersionTable.OS)"
    
    # Vérifier si nous sommes en mode démonstration (token commençant par 'demo-')
    if ($token -like 'demo-*') {
        Write-Output "Mode démonstration: Simulation de la connexion à Exchange Online"
        Write-Output "Token utilisé: $token"
        Write-Output "AppId: $env:AZURE_CLIENT_ID"
        Write-Output "Organization: $env:AZURE_TENANT_ID"
        
        # Simuler des résultats
        Write-Output "`nRécupération des boîtes aux lettres (simulation)..."
        $demoMailboxes = @(
            @{DisplayName="Utilisateur 1"; PrimarySmtpAddress="user1@demo.com"; UserPrincipalName="user1@demo.com"},
            @{DisplayName="Utilisateur 2"; PrimarySmtpAddress="user2@demo.com"; UserPrincipalName="user2@demo.com"},
            @{DisplayName="Administrateur"; PrimarySmtpAddress="admin@demo.com"; UserPrincipalName="admin@demo.com"}
        )
        $demoMailboxes | Format-Table -Property DisplayName, PrimarySmtpAddress, UserPrincipalName
    } else {
        # Se connecter à Exchange Online avec le token
        Write-Output "Tentative de connexion à Exchange Online avec le token MSAL..."
        Connect-ExchangeOnline -AccessToken $token -AppId $env:AZURE_CLIENT_ID -Organization $env:AZURE_TENANT_ID
        
        Write-Output "Connexion réussie à Exchange Online."
        
        # Exemple de commande Exchange Online
        Write-Output "`nRécupération des boîtes aux lettres..."
        Get-Mailbox -ResultSize 10 | Format-Table DisplayName, PrimarySmtpAddress, UserPrincipalName
    }
    
} catch {
    Write-Error "Erreur lors de l'exécution du script: $_"
} finally {
    # Déconnexion propre (uniquement si nous ne sommes pas en mode démonstration)
    if ($token -notlike 'demo-*' -and $null -ne (Get-PSSession | Where-Object {$_.ConfigurationName -eq "Microsoft.Exchange" -and $_.State -eq "Opened"})) {
        Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue
    }
} 