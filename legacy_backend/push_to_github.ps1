# GitHub Push Script for TaxClam
# Run this script after generating your Personal Access Token

Write-Host "`n🚀 TaxClam GitHub Push Tool`n" -ForegroundColor Cyan

$token = Read-Host "Paste your GitHub Personal Access Token here" -AsSecureString
$tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))

if ([string]::IsNullOrWhiteSpace($tokenPlain)) {
    Write-Host "❌ No token provided. Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Updating git remote with token..." -ForegroundColor Yellow
git remote set-url origin "https://$tokenPlain@github.com/sachin-sks-2610/taxclam.git"

Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Your code has been pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n🔗 View your repository at: https://github.com/sachin-sks-2610/taxclam`n" -ForegroundColor Cyan
    
    # Clean up: Remove token from remote URL for security
    git remote set-url origin "https://github.com/sachin-sks-2610/taxclam.git"
} else {
    Write-Host "`n❌ Push failed. Please check the error above.`n" -ForegroundColor Red
}
