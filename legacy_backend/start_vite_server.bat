@echo off
REM TaxCalm Dashboard — Start Vite Dev Server
title TaxCalm Dashboard

echo ========================================
echo   TaxCalm Dashboard — Starting...
echo ========================================
echo.

cd /d "%~dp0taxcalm-dashboard"

REM Start Vite dev server in a separate window
start "TaxCalm Vite Server" cmd /k "npm run dev"

REM Wait for server to be ready (Vite usually starts in 3-4 s)
timeout /t 5 /nobreak >nul

echo   Opening browser at http://localhost:5173
start "" "http://localhost:5173"

echo.
echo   Server is running at: http://localhost:5173
echo   Close the "TaxCalm Vite Server" window to stop.
echo.
exit
