#!/bin/bash

# Timeline Plugin Merge Conflict Resolver
# Wrapper script for easy execution

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/fix-timeline-merge-conflicts.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Timeline Plugin Merge Conflict Resolver${NC}"
echo "================================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    echo "Please install Node.js to use this script."
    exit 1
fi

# Check if the Node.js script exists
if [ ! -f "$NODE_SCRIPT" ]; then
    echo -e "${RED}❌ Node.js script not found: $NODE_SCRIPT${NC}"
    exit 1
fi

# Check if we're in the right directory (should have community-plugins.json file)
if [ ! -f "community-plugins.json" ]; then
    echo -e "${YELLOW}⚠️  Warning: community-plugins.json not found.${NC}"
    echo "Are you running this from the correct directory?"
    echo "Current directory: $(pwd)"
    echo -e "${BLUE}Continuing anyway...${NC}"
fi

# Make the Node.js script executable if it isn't already
if [ ! -x "$NODE_SCRIPT" ]; then
    chmod +x "$NODE_SCRIPT"
fi

# Pass all arguments to the Node.js script
echo -e "${GREEN}🚀 Running merge conflict resolution...${NC}"
node "$NODE_SCRIPT" "$@"

echo -e "${GREEN}✅ Script execution completed!${NC}"

# If there were merge conflicts, suggest setting up a Git hook
if git status &> /dev/null; then
    if git status --porcelain | grep -q "obsidian-releases/community-plugins.json"; then
        echo ""
        echo -e "${YELLOW}💡 Tip: You can set up a Git hook to run this automatically!${NC}"
        echo "Run: $SCRIPT_DIR/setup-git-hook.sh"
    fi
fi 