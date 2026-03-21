#!/bin/bash

# ============================================================
# Bookiverse — Auto Fix Script
# Run this from your PROJECT ROOT (where frontend/ folder is)
# Usage: bash apply-fixes.sh
# ============================================================

set -e  # stop on any error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Bookiverse — Applying All Fixes${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# ── Check we are in the right folder ─────────────────────────
if [ ! -d "frontend" ]; then
  echo -e "${RED}ERROR: 'frontend' folder not found.${NC}"
  echo -e "${YELLOW}Please run this script from your project root folder.${NC}"
  echo -e "Example: If your project is at ~/bookiverse, run:"
  echo -e "  cd ~/bookiverse"
  echo -e "  bash apply-fixes.sh"
  exit 1
fi

if [ ! -d "frontend/src" ]; then
  echo -e "${RED}ERROR: 'frontend/src' folder not found.${NC}"
  echo -e "${YELLOW}Make sure your frontend project structure is correct.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Project root detected${NC}"
echo ""

# ── Create directories if they don't exist ───────────────────
mkdir -p frontend/src/pages
mkdir -p frontend/src/hooks
mkdir -p frontend/src/store
echo -e "${GREEN}✓ Directories ready${NC}"
echo ""

# ── Backup original files before replacing ───────────────────
BACKUP_DIR="frontend/src/_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/pages"
mkdir -p "$BACKUP_DIR/hooks"
mkdir -p "$BACKUP_DIR/store"

FILES_TO_BACKUP=(
  "frontend/src/App.jsx"
  "frontend/src/pages/AdminPanel.jsx"
  "frontend/src/pages/Pages.jsx"
  "frontend/src/pages/BookDetail.jsx"
  "frontend/src/pages/Home.jsx"
  "frontend/src/pages/UploadPage.jsx"
  "frontend/src/hooks/useGenres.js"
  "frontend/src/store/index.js"
)

echo -e "${YELLOW}Creating backups...${NC}"
for file in "${FILES_TO_BACKUP[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/${file#frontend/src/}"
    echo -e "  Backed up: ${file}"
  fi
done
echo -e "${GREEN}✓ Backups saved to: ${BACKUP_DIR}${NC}"
echo ""

# ── Get the directory where this script lives ─────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Copy all fixed files ──────────────────────────────────────
echo -e "${YELLOW}Applying fixed files...${NC}"

copy_file() {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    echo -e "  ${GREEN}✓${NC} $dst"
  else
    echo -e "  ${RED}✗ MISSING source: $src${NC}"
    echo -e "    Make sure all fixed files are in the same folder as this script."
  fi
}

copy_file "$SCRIPT_DIR/App.jsx"             "frontend/src/App.jsx"
copy_file "$SCRIPT_DIR/AdminPanel.jsx"      "frontend/src/pages/AdminPanel.jsx"
copy_file "$SCRIPT_DIR/Pages.jsx"           "frontend/src/pages/Pages.jsx"
copy_file "$SCRIPT_DIR/BookDetail.jsx"      "frontend/src/pages/BookDetail.jsx"
copy_file "$SCRIPT_DIR/Home.jsx"            "frontend/src/pages/Home.jsx"
copy_file "$SCRIPT_DIR/UploadPage.jsx"      "frontend/src/pages/UploadPage.jsx"
copy_file "$SCRIPT_DIR/useGenres.js"        "frontend/src/hooks/useGenres.js"
copy_file "$SCRIPT_DIR/index.js"            "frontend/src/store/index.js"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}   All files applied successfully!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. ${YELLOW}cd frontend${NC}"
echo -e "  2. ${YELLOW}npm install${NC}  (only needed if you haven't already)"
echo -e "  3. ${YELLOW}npm run dev${NC}  to start the frontend"
echo ""
echo -e "If anything looks wrong, your originals are backed up at:"
echo -e "  ${YELLOW}${BACKUP_DIR}${NC}"
echo ""
