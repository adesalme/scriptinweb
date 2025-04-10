# Script de test pour PowerShell Core sur Linux
Write-Output "Testing PowerShell on Linux..."
Write-Output "OS: $(uname -a)"
Write-Output "PowerShell Version: $($PSVersionTable.PSVersion)"
Write-Output "Current Path: $(Get-Location)"
Write-Output "Available Modules:"
Get-Module -ListAvailable | Format-Table Name, Version
Write-Output "--------------------"
Get-Process | Select-Object -First 5 | Format-Table -AutoSize 