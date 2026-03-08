@echo off
REM TaxClam - Start Unified Server & Open Web Interface
REM Launches the server in background and opens browser automatically

cd /d "%~dp0"

REM Start the unified server in background (hidden/minimized)
start "" .\.venv\Scripts\pythonw.exe unified_server.py

REM Wait for server to initialize
timeout /t 3 /nobreak >nul

REM Open browser to TaxClam web interface
start http://localhost:1000

exit
