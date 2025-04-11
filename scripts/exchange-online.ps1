# Script simplifié pour Exchange Online
try {
    # Vérifier si nous sommes en mode démonstration
    if ($env:AZURE_ACCESS_TOKEN -like 'demo-*') {
        Write-Output "Mode démonstration: Simulation de la connexion à Exchange Online"
        
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
        Write-Output "Connexion à Exchange Online..."
        Connect-ExchangeOnline -AccessToken $env:AZURE_ACCESS_TOKEN -AppId $env:AZURE_CLIENT_ID -Organization $env:AZURE_TENANT_ID
        
        # Exemple de commande Exchange Online
        Write-Output "`nRécupération des boîtes aux lettres..."
        Get-Mailbox -ResultSize 10 | Format-Table DisplayName, PrimarySmtpAddress, UserPrincipalName
        
        # Déconnexion propre
        Disconnect-ExchangeOnline -Confirm:$false
    }
} catch {
    Write-Error "Erreur: $_"
} 