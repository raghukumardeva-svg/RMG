@echo off
echo ============================================
echo RMG Portal - MongoDB Quick Start
echo ============================================
echo.

echo Step 1: Checking MongoDB...
net start | findstr /i "MongoDB" >nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is running
) else (
    echo [WARNING] MongoDB is not running
    echo Starting MongoDB...
    net start MongoDB
    if %errorlevel% equ 0 (
        echo [OK] MongoDB started successfully
    ) else (
        echo [ERROR] Failed to start MongoDB
        echo Please start MongoDB manually
        pause
        exit /b 1
    )
)
echo.

echo Step 2: Installing dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo Step 3: Seeding database with JSON data...
call npm run seed
if %errorlevel% neq 0 (
    echo [ERROR] Failed to seed database
    pause
    exit /b 1
)
echo [OK] Database seeded successfully
echo.

echo Step 4: Starting server...
echo Server will start at http://localhost:5000
echo.
call npm run dev

pause
