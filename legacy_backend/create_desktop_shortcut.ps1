# Create Desktop Shortcut for TaxCalm Dashboard (Vite)
# Run this script once to create a desktop icon with the TaxCalm brand icon

$ScriptDir = $PSScriptRoot
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "TaxCalm Dashboard.lnk"
$TargetPath  = Join-Path $ScriptDir "start_vite_server.bat"
$IconPath    = Join-Path $ScriptDir "taxcalm_icon.ico"

# ── Build TaxCalm icon: green square + white ₹ ──────────────────────────────
Add-Type -AssemblyName System.Drawing

$size   = 64
$bmp    = New-Object System.Drawing.Bitmap($size, $size)
$g      = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode   = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Rounded-rect green background
$green  = [System.Drawing.Color]::FromArgb(16, 185, 129)   # #10b981
$brush  = New-Object System.Drawing.SolidBrush($green)
$path   = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 12
$rect   = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$path.AddArc($rect.X,                      $rect.Y,                       $radius*2, $radius*2, 180, 90)
$path.AddArc($rect.Right - $radius*2,      $rect.Y,                       $radius*2, $radius*2, 270, 90)
$path.AddArc($rect.Right - $radius*2,      $rect.Bottom - $radius*2,      $radius*2, $radius*2,   0, 90)
$path.AddArc($rect.X,                      $rect.Bottom - $radius*2,      $radius*2, $radius*2,  90, 90)
$path.CloseFigure()
$g.FillPath($brush, $path)

# White ₹ symbol centred
$font   = New-Object System.Drawing.Font("Arial", 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$white  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$sf     = New-Object System.Drawing.StringFormat
$sf.Alignment     = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$fRect  = New-Object System.Drawing.RectangleF(0, 2, $size, $size)
$g.DrawString([char]0x20B9, $font, $white, $fRect, $sf)   # ₹ = U+20B9
$g.Dispose()

# Convert bitmap → Icon and save as .ico
$hIcon  = $bmp.GetHicon()
$icon   = [System.Drawing.Icon]::FromHandle($hIcon)
$stream = [System.IO.File]::Open($IconPath, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$bmp.Dispose()
# ────────────────────────────────────────────────────────────────────────────

# Create shortcut
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath     = $TargetPath
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description    = "Start TaxCalm Dashboard (Vite) - GST Assistant for MSMEs"
$Shortcut.IconLocation   = "$IconPath,0"
$Shortcut.Save()

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Desktop Shortcut Created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Shortcut : $ShortcutPath" -ForegroundColor Cyan
Write-Host "Icon     : $IconPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Double-click the 'TaxCalm Dashboard' icon on your desktop to:" -ForegroundColor Yellow
Write-Host "  - Start the Vite dev server (npm run dev)" -ForegroundColor White
Write-Host "  - Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
