@echo off
REM Git History Cleanup Script for RMG Portal (Windows)
REM This script removes sensitive files from git history
REM WARNING: This rewrites git history. Make sure to backup your repository first!

echo ========================================
echo   RMG Portal - Git History Cleanup
echo ========================================
echo.
echo WARNING: This script will rewrite git history!
echo Make sure you have a backup of your repository!
echo.
echo This script will remove the following sensitive files from git history:
echo   - src/data/users.json (contains plain-text passwords)
echo   - .env (contains environment configuration)
echo.

set /p confirm="Do you want to continue? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Aborted.
    exit /b 0
)

echo.
echo Step 1: Checking if files exist in git history...

git log --all --full-history -- "src/data/users.json" | findstr /C:"commit" >nul 2>&1
if %errorlevel%==0 (
    echo Found src/data/users.json in git history
    set USERS_JSON_EXISTS=true
) else (
    echo src/data/users.json not found in git history
    set USERS_JSON_EXISTS=false
)

git log --all --full-history -- ".env" | findstr /C:"commit" >nul 2>&1
if %errorlevel%==0 (
    echo Found .env in git history
    set ENV_EXISTS=true
) else (
    echo .env not found in git history
    set ENV_EXISTS=false
)

if "%USERS_JSON_EXISTS%"=="false" if "%ENV_EXISTS%"=="false" (
    echo.
    echo No sensitive files found in git history. Nothing to clean up!
    exit /b 0
)

echo.
echo Step 2: Creating backup...

REM Create timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set BACKUP_BRANCH=backup-before-cleanup-%datetime:~0,8%-%datetime:~8,6%

git branch %BACKUP_BRANCH%
echo Created backup branch: %BACKUP_BRANCH%

echo.
echo Step 3: Removing files from git index (if they exist)...

if exist "src\data\users.json" (
    git rm --cached src/data/users.json 2>nul
    echo Removed src/data/users.json from git index
)

if exist ".env" (
    git rm --cached .env 2>nul
    echo Removed .env from git index
)

echo.
echo Step 4: Removing files from git history...
echo This may take a few minutes...

git filter-branch --force --index-filter "git rm --cached --ignore-unmatch src/data/users.json .env" --prune-empty --tag-name-filter cat -- --all

echo Files removed from history

echo.
echo Step 5: Cleaning up...

REM Remove backup refs
rmdir /s /q .git\refs\original 2>nul
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo Cleanup complete

echo.
echo Step 6: Verifying...

git log --all --full-history -- "src/data/users.json" ".env" | findstr /C:"commit" >nul 2>&1
if %errorlevel%==0 (
    echo Warning: Files may still exist in history
    echo You may need to run additional cleanup commands
) else (
    echo Verified: Sensitive files removed from git history
)

echo.
echo ========================================
echo   Cleanup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Review changes:
echo    git log --oneline --all --graph
echo.
echo 2. If everything looks good, force push to remote:
echo    git push origin --force --all
echo    git push origin --force --tags
echo.
echo 3. Notify your team:
echo    - Everyone needs to re-clone the repository
echo    - OR run: git fetch origin ^&^& git reset --hard origin/main
echo.
echo 4. If something went wrong, restore from backup:
echo    git checkout %BACKUP_BRANCH%
echo.
echo WARNING: After force pushing, all team members must re-clone!
echo.

pause
