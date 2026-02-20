#!/bin/bash

# Git History Cleanup Script for RMG Portal
# This script removes sensitive files from git history
# WARNING: This rewrites git history. Make sure to backup your repository first!

set -e  # Exit on error

echo "========================================"
echo "  RMG Portal - Git History Cleanup"
echo "========================================"
echo ""
echo "⚠️  WARNING: This script will rewrite git history!"
echo "⚠️  Make sure you have a backup of your repository!"
echo ""
echo "This script will remove the following sensitive files from git history:"
echo "  - src/data/users.json (contains plain-text passwords)"
echo "  - .env (contains environment configuration)"
echo ""

# Confirm before proceeding
read -p "Do you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Step 1: Checking if files exist in git history..."

# Check if files exist in git history
if git log --all --full-history -- "src/data/users.json" | grep -q "commit"; then
    echo "✓ Found src/data/users.json in git history"
    USERS_JSON_EXISTS=true
else
    echo "✗ src/data/users.json not found in git history"
    USERS_JSON_EXISTS=false
fi

if git log --all --full-history -- ".env" | grep -q "commit"; then
    echo "✓ Found .env in git history"
    ENV_EXISTS=true
else
    echo "✗ .env not found in git history"
    ENV_EXISTS=false
fi

if [ "$USERS_JSON_EXISTS" = false ] && [ "$ENV_EXISTS" = false ]; then
    echo ""
    echo "✓ No sensitive files found in git history. Nothing to clean up!"
    exit 0
fi

echo ""
echo "Step 2: Creating backup..."

# Create a backup branch
BACKUP_BRANCH="backup-before-cleanup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
echo "✓ Created backup branch: $BACKUP_BRANCH"

echo ""
echo "Step 3: Removing files from git index (if they exist)..."

# Remove files from git index if they currently exist
if [ -f "src/data/users.json" ]; then
    git rm --cached src/data/users.json 2>/dev/null || true
    echo "✓ Removed src/data/users.json from git index"
fi

if [ -f ".env" ]; then
    git rm --cached .env 2>/dev/null || true
    echo "✓ Removed .env from git index"
fi

echo ""
echo "Step 4: Removing files from git history..."
echo "This may take a few minutes..."

# Method 1: Using git filter-branch (works on most systems)
if command -v git-filter-branch &> /dev/null; then
    echo "Using git filter-branch..."

    git filter-branch --force --index-filter \
      "git rm --cached --ignore-unmatch src/data/users.json .env" \
      --prune-empty --tag-name-filter cat -- --all

    echo "✓ Files removed from history using filter-branch"
fi

# Method 2: Alternative using git filter-repo (if available)
# Uncomment if you have git-filter-repo installed
# if command -v git-filter-repo &> /dev/null; then
#     echo "Using git filter-repo (recommended)..."
#     git filter-repo --invert-paths --path src/data/users.json --path .env --force
#     echo "✓ Files removed from history using filter-repo"
# fi

echo ""
echo "Step 5: Cleaning up..."

# Remove backup refs
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✓ Cleanup complete"

echo ""
echo "Step 6: Verifying..."

# Verify files are gone from history
if git log --all --full-history -- "src/data/users.json" ".env" | grep -q "commit"; then
    echo "⚠️  Warning: Files may still exist in history"
    echo "You may need to run additional cleanup commands"
else
    echo "✓ Verified: Sensitive files removed from git history"
fi

echo ""
echo "========================================"
echo "  Cleanup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Review changes:"
echo "   git log --oneline --all --graph"
echo ""
echo "2. If everything looks good, force push to remote:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "3. Notify your team:"
echo "   - Everyone needs to re-clone the repository"
echo "   - OR run: git fetch origin && git reset --hard origin/main"
echo ""
echo "4. If something went wrong, restore from backup:"
echo "   git checkout $BACKUP_BRANCH"
echo ""
echo "⚠️  IMPORTANT: After force pushing, all team members must re-clone!"
echo ""
