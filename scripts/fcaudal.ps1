# Remplacez 'user@example.com' par l'adresse e-mail de l'utilisateur
$userEmail = "adesalme@chateauform.com"

# Connexion à Azure AD
Connect-AzureAD

# Obtenir l'utilisateur par son adresse e-mail
$user = Get-AzureADUser -ObjectId $userEmail

# Vérifier si l'utilisateur existe
if ($user) {
    # Obtenir les groupes auxquels l'utilisateur appartient
    $userGroups = Get-AzureADUserMembership -ObjectId $user.ObjectId

    # Afficher les résultats
    if ($userGroups.Count -gt 0) {
        Write-Host "L'utilisateur $userEmail est membre des groupes suivants :"
        $userGroups | ForEach-Object { Write-Host $_.DisplayName }
    } else {
        Write-Host "L'utilisateur $userEmail n'est membre d'aucun groupe."
    }
} else {
    Write-Host "Aucun utilisateur trouvé avec l'adresse e-mail $userEmail."
}

# Déconnexion de la session Azure AD
Disconnect-AzureAD
