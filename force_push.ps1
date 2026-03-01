# Force Push to GitHub - Replaces remote content with local code

Write-Host "`n🚀 TaxClam Force Push Tool`n" -ForegroundColor Cyan
Write-Host "⚠️  This will REPLACE all content on GitHub with your local code" -ForegroundColor Yellow
Write-Host "📁 157 files will be pushed`n" -ForegroundColor White

$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Aborted." -ForegroundColor Red
    exit 0
}

$token = Read-Host "`nPaste your GitHub Personal Access Token" -AsSecureString
$tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))

if ([string]::IsNullOrWhiteSpace($tokenPlain)) {
    Write-Host "❌ No token provided. Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Updating remote URL..." -ForegroundColor Yellow
git remote set-url origin "https://$tokenPlain@github.com/sachin-sks-2610/taxclam.git"

Write-Host "📤 Force pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! All 157 files pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n🔗 View at: https://github.com/sachin-sks-2610/taxclam`n" -ForegroundColor Cyan
    
    # Clean up token
    git remote set-url origin "https://github.com/sachin-sks-2610/taxclam.git"
} else {
    Write-Host "`n❌ Force push failed. Check the error above.`n" -ForegroundColor Red
}
