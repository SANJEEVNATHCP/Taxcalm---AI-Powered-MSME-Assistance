# GitHub Push Helper Script
# After getting your Personal Access Token, run this

Write-Host "`n🚀 GitHub Push Setup" -ForegroundColor Cyan
Write-Host "=" * 50

# Prompt for token
$token = Read-Host "`nEnter your GitHub Personal Access Token"

if ($token) {
    Write-Host "`n📝 Updating remote URL..." -ForegroundColor Yellow
    
    # Update remote URL with token
    git remote set-url origin "https://${token}@github.com/sachin-sks-2610/taxclam.git"
    
    Write-Host "✅ Remote URL updated!" -ForegroundColor Green
    
    # Push to GitHub
    Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "`n📍 View your repository at:" -ForegroundColor Cyan
        Write-Host "   https://github.com/sachin-sks-2610/taxclam`n" -ForegroundColor Blue
    } else {
        Write-Host "`n❌ Push failed. Check your token and try again." -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ No token provided. Exiting." -ForegroundColor Red
}

Write-Host "`n" + "=" * 50
