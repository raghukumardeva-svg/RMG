@echo off
echo ============================================
echo  Starting RMG Portal Backend Server
echo ============================================
echo.

cd server

echo Step 1: Installing dependencies (if needed)...
call npm install

echo.
echo Step 2: Starting development server...
echo Backend will run on http://localhost:5000
echo.
echo KEEP THIS WINDOW OPEN while using the application!
echo Press Ctrl+C to stop the server
echo.
echo ============================================
echo.

call npm run dev

pause
