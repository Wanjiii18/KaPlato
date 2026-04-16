@echo off
echo ========================================
echo    KaPlato with ngrok Tunnel
echo ========================================
echo.
echo This creates a public URL for testing anywhere
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ngrok is not installed!
    echo.
    echo Install ngrok:
    echo   1. Download from: https://ngrok.com/download
    echo   2. Or use: choco install ngrok  ^(if you have Chocolatey^)
    echo   3. Or use: scoop install ngrok  ^(if you have Scoop^)
    echo.
    pause
    exit /b 1
)

echo Starting Ionic server...
start /B ionic serve --port=8100

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting ngrok tunnel...
echo This URL can be accessed from ANYWHERE (not just local network)
echo.
ngrok http 8100
