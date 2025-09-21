@echo off
echo =================================================
echo          KaPlato Mobile Deployment Script
echo =================================================
echo.
echo This script will build and deploy your app to mobile device
echo.

cd "C:\Users\ACER NITRO AN515-52\Documents\Mobile\Capstone\KaPlato"

echo Step 1: Installing/updating dependencies...
call npm install

echo.
echo Step 2: Building Angular/Ionic app...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Please fix the errors and try again.
    pause
    exit /b 1
)

echo.
echo Step 3: Syncing with Capacitor...
call npx cap sync android

echo.
echo Step 4: Copying web assets to Android...
call npx cap copy android

echo.
echo Step 5: Opening Android Studio for final build and deployment...
echo.
echo In Android Studio:
echo 1. Wait for Gradle sync to complete (this may take a few minutes)
echo 2. Connect your phone via USB cable
echo 3. Enable "USB Debugging" on your phone:
echo    - Go to Settings ^> About Phone
echo    - Tap "Build Number" 7 times to enable Developer Options
echo    - Go to Settings ^> Developer Options
echo    - Enable "USB Debugging"
echo 4. Select your device in Android Studio
echo 5. Click the green 'Run' button (or press Shift+F10)
echo.

call npx cap open android

echo.
echo Mobile deployment process started!
echo Check Android Studio for final steps.
echo.
echo If you encounter any issues:
echo - Make sure your phone is connected and USB debugging is enabled
echo - Try running 'npx cap sync android' again
echo - Check that Android Studio has the latest SDK installed
echo.
pause