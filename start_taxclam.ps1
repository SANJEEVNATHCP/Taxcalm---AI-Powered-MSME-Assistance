# TaxClam - Start All Servers (PowerShell)
# This script starts all TaxClam servers and opens the web interface

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TaxClam - Starting All Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Start Flask Server (Port 8000)
Write-Host "[1/3] Starting Flask Server on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\.venv\Scripts\python.exe' run_flask_server.py" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Unified Server (Port 8001)
Write-Host "[2/3] Starting Unified Server on port 8001..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\.venv\Scripts\python.exe' unified_server.py" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Main Server (Port 8002)
Write-Host "[3/3] Starting Main Server on port 8002..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\.venv\Scripts\python.exe' run_server.py" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All servers starting..." -ForegroundColor Yellow
Write-Host "  Opening web browser..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Flask Server:    http://localhost:8000" -ForegroundColor White
Write-Host "  Unified Server:  http://localhost:8001  (Recommended)" -ForegroundColor Green
Write-Host "  Main Server:     http://localhost:8002" -ForegroundColor White
Write-Host ""
Write-Host "  Waiting for servers to start..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Wait for servers to fully start
Start-Sleep -Seconds 8

# Open browser to Unified Server (has all features)
Start-Process "http://localhost:8001"

Write-Host ""
Write-Host "Web browser opened to http://localhost:8001" -ForegroundColor Green
Write-Host ""
Write-Host "To stop all servers, close all PowerShell windows." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
