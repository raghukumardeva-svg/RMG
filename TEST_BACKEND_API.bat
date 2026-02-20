@echo off
echo ============================================
echo  Testing Backend API Connection
echo ============================================
echo.

echo Testing if backend server is responding...
echo.

curl http://localhost:5000/api/health 2>nul

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Cannot connect to backend server
    echo Make sure the server is running!
    echo Run START_BACKEND_SERVER.bat first
) else (
    echo.
    echo SUCCESS: Backend server is responding!
)

echo.
pause
