#!/bin/bash

# Spreadsheet Automation - File Migration Script
# This script reorganizes files for Node.js production deployment

set -e  # Exit on error

echo "=========================================="
echo "Spreadsheet Automation - File Migration"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "[1/5] Creating directory structure..."
mkdir -p public/mockup
mkdir -p data
mkdir -p scripts
mkdir -p exports
mkdir -p backups
mkdir -p logs
echo "✓ Directories created"
echo ""

echo "[2/5] Moving landing page files..."
if [ -d "camp" ]; then
    cp camp/index.html public/index.html
    cp camp/styles.css public/styles.css
    cp camp/script.js public/script.js
    echo "✓ Landing page files copied to public/"
else
    echo "⚠ Warning: camp/ directory not found"
fi
echo ""

echo "[3/5] Moving mockup framework..."
if [ -d "mockup-framework" ]; then
    cp mockup-framework/index.html public/mockup/index.html
    cp mockup-framework/styles.css public/mockup/styles.css
    cp mockup-framework/script.js public/mockup/script.js
    cp mockup-framework/README.md public/mockup/README.md
    echo "✓ Mockup framework copied to public/mockup/"
else
    echo "⚠ Warning: mockup-framework/ directory not found"
fi
echo ""

echo "[4/5] Verifying file structure..."
REQUIRED_FILES=(
    "public/index.html"
    "public/styles.css"
    "public/script.js"
    "public/mockup/index.html"
    "public/mockup/styles.css"
    "public/mockup/script.js"
    "server.js"
    "package.json"
)

ALL_PRESENT=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file - MISSING"
        ALL_PRESENT=false
    fi
done
echo ""

if [ "$ALL_PRESENT" = false ]; then
    echo "⚠ Some required files are missing!"
    exit 1
fi

echo "[5/5] Final steps..."
echo ""
echo "File migration complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Copy: cp env.example .env"
echo "3. Edit .env with your configuration"
echo "4. Run: npm run prepare-db"
echo "5. Test: npm run dev"
echo ""
echo "For production deployment, see PRODUCTION_DEPLOYMENT.md"
echo ""


