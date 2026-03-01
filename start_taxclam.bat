@echo off
REM TaxClam - Start All Servers
REM This script starts all TaxClam servers and opens the web interface

echo ========================================
echo   TaxClam - Starting All Servers
echo ========================================
echo.

cd /d "%~dp0"

REM Start Flask Server (Port 8000)
echo [1/3] Starting Flask Server on port 8000...
start "TaxClam - Flask Server (8000)" cmd /k ".\.venv\Scripts\python.exe" run_flask_server.py

timeout /t 2 /nobreak >nul

REM Start Unified Server (Port 8001)
echo [2/3] Starting Unified Server on port 8001...
start "TaxClam - Unified Server (8001)" cmd /k ".\.venv\Scripts\python.exe" unified_server.py

timeout /t 2 /nobreak >nul

REM Start Main Server (Port 8002)
echo [3/3] Starting Main Server on port 8002...
start "TaxClam - Main Server (8002)" cmd /k ".\.venv\Scripts\python.exe" run_server.py

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   All servers starting...
echo   Opening web browser...
echo ========================================
echo.
echo   Flask Server:    http://localhost:8000
echo   Unified Server:  http://localhost:8001  (Recommended)
echo   Main Server:     http://localhost:8002
echo.
echo   Press any key to open browser...
echo ========================================

REM Wait a bit for servers to start
timeout /t 5 /nobreak >nul

REM Open browser to Unified Server (has all features)
start http://localhost:8001

echo.
echo Web browser opened to http://localhost:8001
echo.
echo To stop all servers, close all TaxClam command windows.
echo.
pause
