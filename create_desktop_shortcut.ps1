# Create Desktop Shortcut for TaxClam
# Run this script once to create a desktop icon

$ScriptDir = $PSScriptRoot
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "TaxClam.lnk"
$TargetPath = Join-Path $ScriptDir "start_taxclam.bat"

# Create shortcut
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "Start TaxClam - GST Assistant for MSMEs"
$Shortcut.IconLocation = "shell32.dll,21"  # Computer icon
$Shortcut.Save()

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Desktop Shortcut Created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Double-click the 'TaxClam' icon on your desktop to:" -ForegroundColor Yellow
Write-Host "  - Start all servers automatically" -ForegroundColor White
Write-Host "  - Open the web application" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
