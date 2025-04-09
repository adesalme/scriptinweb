Write-Host "Hello World from PowerShell!"
Write-Host "Current date and time: $(Get-Date)"
Write-Host "Computer name: $env:COMPUTERNAME"
Write-Host "Current user: $env:USERNAME"

# Liste des processus en cours d'exécution (top 5)
Write-Host "`nTop 5 processes by memory usage:"
Get-Process | Sort-Object -Property WorkingSet -Descending | Select-Object -First 5 | Format-Table -Property Id, Name, WorkingSet 