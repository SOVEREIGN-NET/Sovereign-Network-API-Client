#!/bin/bash
set -e

echo "🚀 Manual Release Script"
echo "========================"

# Check if we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Must be on main branch to release"
  exit 1
fi

# Build, test, and prepare
echo "📦 Building..."
npm run build

echo "✅ Running tests..."
npm test

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📌 Current version: $CURRENT_VERSION"

# Read new version from user
echo ""
echo "Enter new version (current: $CURRENT_VERSION):"
read NEW_VERSION

# Update package.json
node -e "
const pkg = require('./package.json');
pkg.version = '$NEW_VERSION';
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "✅ Updated package.json to version $NEW_VERSION"

# Commit
git add package.json
git commit -m "chore(release): $NEW_VERSION"

# Create git tag
git tag -a "v$NEW_VERSION" -m "Release $NEW_VERSION"

echo "📤 Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo "✅ Manual release complete!"
echo "📋 Version: $NEW_VERSION"
echo "🔗 Visit: https://github.com/SOVEREIGN-NET/Sovereign-Network-API-Client/releases"
