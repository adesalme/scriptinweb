# Script pour lister les groupes d'un utilisateur Azure AD
param(
    [Parameter(Mandatory=$false)]
    [string]$userEmail = "adesalme@chateauform.com",
    [Parameter(Mandatory=$false)]
    [string]$accessToken
)

# Fonction pour afficher les messages avec un timestamp
function Write-LogMessage {
    param([string]$Message)
    Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): $Message"
}

Write-LogMessage "Démarrage du script..."

try {
    # Vérifier si les modules requis sont installés
    $requiredModules = @('Az.Accounts', 'Az.Resources')
    foreach ($module in $requiredModules) {
        if (-not (Get-Module -ListAvailable -Name $module)) {
            Write-LogMessage "Installation du module $module..."
            Install-Module -Name $module -Force -AllowClobber -Scope CurrentUser
        }
        Write-LogMessage "Import du module $module..."
        Import-Module $module -ErrorAction Stop
    }

    # Connexion à Azure avec le token si fourni
    Write-LogMessage "Tentative de connexion à Azure..."
    if ($accessToken) {
        Write-LogMessage "Connexion avec le token d'accès..."
        try {
            # Définir le token comme variable d'environnement
            $env:AZURE_ACCESS_TOKEN = $accessToken
            
            # Vérifier le token
            Write-LogMessage "Vérification du token..."
            $tokenInfo = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($accessToken.Split('.')[1]))
            Write-LogMessage "Informations du token: $tokenInfo"
            
            # Connexion avec le token
            Write-LogMessage "Tentative de connexion avec le token..."
            $secureToken = ConvertTo-SecureString $accessToken -AsPlainText -Force
            $azContext = Connect-AzAccount -AccessToken $secureToken -AccountId $userEmail -ErrorAction Stop
            Write-LogMessage "Connecté avec succès via token"
            Write-LogMessage "Contexte Azure: $($azContext | ConvertTo-Json)"
        } catch {
            Write-LogMessage "Erreur détaillée lors de la connexion avec le token:"
            Write-LogMessage "Message: $($_.Exception.Message)"
            Write-LogMessage "Type: $($_.Exception.GetType().FullName)"
            if ($_.Exception.InnerException) {
                Write-LogMessage "Erreur interne: $($_.Exception.InnerException.Message)"
            }
            throw
        }
    } else {
        Write-LogMessage "Aucun token fourni, utilisation de l'authentification par appareil..."
        Write-LogMessage "Veuillez vous rendre sur https://microsoft.com/devicelogin et entrer le code qui va s'afficher..."
        $azContext = Connect-AzAccount -UseDeviceAuthentication -ErrorAction Stop
    }

    # Recherche de l'utilisateur
    Write-LogMessage "Recherche de l'utilisateur : $userEmail"
    $user = Get-AzADUser -UserPrincipalName $userEmail -ErrorAction Stop

    if ($user) {
        Write-LogMessage "Utilisateur trouvé : $($user.DisplayName)"
        
        # Recherche des groupes
        Write-LogMessage "Recherche des appartenances aux groupes..."
        $groups = Get-AzADGroup -MemberObjectId $user.Id -ErrorAction Stop

        if ($groups) {
            Write-LogMessage "Groupes trouvés : $($groups.Count) groupe(s)"
            Write-Host "`nL'utilisateur $userEmail est membre des groupes suivants :"
            Write-Host "----------------------------------------------------"
            $groups | ForEach-Object {
                Write-Host "- $($_.DisplayName)"
            }
        } else {
            Write-LogMessage "Aucun groupe trouvé pour cet utilisateur"
            Write-Host "`nL'utilisateur $userEmail n'est membre d'aucun groupe."
        }
    } else {
        Write-LogMessage "Utilisateur non trouvé"
        Write-Host "`nAucun utilisateur trouvé avec l'adresse e-mail : $userEmail"
    }

} catch {
    Write-LogMessage "ERREUR : $($_.Exception.Message)"
    Write-Host "`nUne erreur est survenue lors de l'exécution du script :"
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.InnerException) {
        Write-Host "Détails supplémentaires : $($_.Exception.InnerException.Message)" -ForegroundColor Red
    }
} finally {
    # Nettoyage
    Write-LogMessage "Nettoyage de la session..."
    try {
        Disconnect-AzAccount -ErrorAction SilentlyContinue
        Write-LogMessage "Déconnexion réussie"
    } catch {
        Write-LogMessage "Erreur lors de la déconnexion : $($_.Exception.Message)"
    }
    Write-LogMessage "Fin du script"
}
