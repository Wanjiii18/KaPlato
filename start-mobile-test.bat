@echo off
echo ========================================
echo    KaPlato Mobile Test Server
echo ========================================
echo.
echo Starting Ionic development server...
echo This will generate a QR code for phone testing
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0start-mobile-test.ps1"
