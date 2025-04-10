# Script de connexion à Azure avec token MSAL
try {
    # Vérifier si le module Az est disponible
    if (-not (Get-Module -ListAvailable -Name Az)) {
        Write-Output "Mode démonstration: Simulation de l'installation du module Az"
        # En mode démonstration, on continue sans le module
    } else {
        # Importer le module Az
        Import-Module Az -ErrorAction Stop
        Write-Output "Module Az chargé avec succès."
    }
    
    # Afficher des informations de diagnostic
    Write-Output "PowerShell Version: $($PSVersionTable.PSVersion)"
    Write-Output "OS: $($PSVersionTable.OS)"
    
    # Vérifier si nous sommes en mode démonstration (token commençant par 'demo-')
    if ($token -like 'demo-*') {
        Write-Output "Mode démonstration: Simulation de la connexion à Azure"
        Write-Output "Token utilisé: $token"
        Write-Output "AppId: $env:AZURE_CLIENT_ID"
        Write-Output "Tenant: $env:AZURE_TENANT_ID"
        
        # Simuler des résultats
        Write-Output "`nRécupération des informations du compte (simulation)..."
        Write-Output "Nom: Demo User"
        Write-Output "Type de compte: User"
        Write-Output "ID du tenant: $env:AZURE_TENANT_ID"
        Write-Output "ID de l'abonnement: demo-subscription-id"
        
        Write-Output "`nListe des abonnements disponibles (simulation)..."
        $demoSubscriptions = @(
            @{Name="Abonnement Demo 1"; Id="sub-1"; State="Enabled"},
            @{Name="Abonnement Demo 2"; Id="sub-2"; State="Enabled"},
            @{Name="Abonnement Demo 3"; Id="sub-3"; State="Disabled"}
        )
        $demoSubscriptions | Format-Table -Property Name, Id, State
        
        Write-Output "`nListe des groupes de ressources (simulation)..."
        $demoResourceGroups = @(
            @{ResourceGroupName="rg-demo-1"; Location="West Europe"; ProvisioningState="Succeeded"},
            @{ResourceGroupName="rg-demo-2"; Location="North Europe"; ProvisioningState="Succeeded"},
            @{ResourceGroupName="rg-demo-3"; Location="East US"; ProvisioningState="Failed"}
        )
        $demoResourceGroups | Format-Table -Property ResourceGroupName, Location, ProvisioningState
    } else {
        # Se connecter à Azure avec le token
        Write-Output "Tentative de connexion à Azure avec le token MSAL..."
        Connect-AzAccount -AccessToken $token -AccountId $env:AZURE_CLIENT_ID -Tenant $env:AZURE_TENANT_ID
        
        Write-Output "Connexion réussie à Azure."
        
        # Exemple de commandes Azure
        Write-Output "`nRécupération des informations du compte..."
        Get-AzContext
        
        Write-Output "`nListe des abonnements disponibles..."
        Get-AzSubscription | Format-Table Name, Id, State
        
        Write-Output "`nListe des groupes de ressources..."
        Get-AzResourceGroup | Format-Table ResourceGroupName, Location, ProvisioningState
    }
    
} catch {
    Write-Error "Erreur lors de l'exécution du script: $_"
} finally {
    # Déconnexion propre (uniquement si nous ne sommes pas en mode démonstration)
    if ($token -notlike 'demo-*' -and $null -ne (Get-AzContext)) {
        Disconnect-AzAccount -ErrorAction SilentlyContinue
    }
} 