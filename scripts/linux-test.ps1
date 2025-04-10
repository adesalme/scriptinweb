# Script de test pour PowerShell Core sur Linux
Write-Output "Test PowerShell Core sur Linux"
Write-Output "OS: $(Get-CimInstance -Class Win32_OperatingSystem -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Caption)"
Write-Output "PowerShell Version: $($PSVersionTable.PSVersion)"
Write-Output "--------------------"
Get-Process | Select-Object -First 5 | Format-Table -AutoSize 