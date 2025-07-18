#!/bin/bash

# Test script for timeline automation
# This script tests the automation without making actual changes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/test-automation-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Timeline Automation${NC}"
echo "================================"
echo ""

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

log_message "🚀 Starting automation test..."

# Test 1: Check if all required files exist
log_message "📋 Test 1: Checking required files..."
required_files=(
    "fix-timeline-conflicts.sh"
    "fix-timeline-merge-conflicts.js"
    "monitor-upstream.sh"
    "monitor-upstream-conflicts.js"
    "community-plugins.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log_message "✅ Found: $file"
    else
        log_message "❌ Missing: $file"
        exit 1
    fi
done

# Test 2: Check if scripts are executable
log_message "📋 Test 2: Checking script permissions..."
scripts=(
    "fix-timeline-conflicts.sh"
    "monitor-upstream.sh"
)

for script in "${scripts[@]}"; do
    if [ -x "$script" ]; then
        log_message "✅ Executable: $script"
    else
        log_message "⚠️  Making executable: $script"
        chmod +x "$script"
    fi
done

# Test 3: Validate JSON structure
log_message "📋 Test 3: Validating JSON structure..."
if node -e "
const fs = require('fs');
try {
    const content = fs.readFileSync('community-plugins.json', 'utf8');
    const plugins = JSON.parse(content);
    console.log('✅ JSON is valid. Found', plugins.length, 'plugins');
    
    const timelineIndex = plugins.findIndex(p => p.id === 'manuscript-timeline');
    if (timelineIndex !== -1) {
        console.log('✅ Timeline plugin found at position', timelineIndex + 1);
        if (timelineIndex === plugins.length - 1) {
            console.log('✅ Timeline plugin is correctly positioned at the end');
        } else {
            console.log('⚠️  Timeline plugin is not at the end');
        }
    } else {
        console.log('❌ Timeline plugin not found');
    }
} catch (error) {
    console.error('❌ JSON validation failed:', error.message);
    process.exit(1);
}
"; then
    log_message "✅ JSON validation passed"
else
    log_message "❌ JSON validation failed"
    exit 1
fi

# Test 4: Test conflict resolution script
log_message "📋 Test 4: Testing conflict resolution script..."
if node fix-timeline-merge-conflicts.js --validate; then
    log_message "✅ Conflict resolution script test passed"
else
    log_message "❌ Conflict resolution script test failed"
    exit 1
fi

# Test 5: Test monitoring script (dry run)
log_message "📋 Test 5: Testing monitoring script (dry run)..."
if ./monitor-upstream.sh --check-only; then
    log_message "✅ Monitoring script test passed"
else
    log_message "❌ Monitoring script test failed"
    exit 1
fi

# Test 6: Check GitHub CLI availability
log_message "📋 Test 6: Checking GitHub CLI..."
if command -v gh &> /dev/null; then
    log_message "✅ GitHub CLI is available"
    gh --version | head -1
else
    log_message "⚠️  GitHub CLI not found (will be installed in GitHub Actions)"
fi

# Test 7: Check Git configuration
log_message "📋 Test 7: Checking Git configuration..."
if git config --get user.name &> /dev/null; then
    log_message "✅ Git user.name is configured: $(git config --get user.name)"
else
    log_message "⚠️  Git user.name not configured"
fi

if git config --get user.email &> /dev/null; then
    log_message "✅ Git user.email is configured: $(git config --get user.email)"
else
    log_message "⚠️  Git user.email not configured"
fi

# Summary
log_message ""
log_message "🎉 All tests completed successfully!"
log_message "📝 Test log saved to: $LOG_FILE"
log_message ""
log_message "💡 Next steps:"
log_message "   1. Commit and push the automation workflow"
log_message "   2. The automation will run at 9am, 11am, 2pm, and 4pm PT"
log_message "   3. Monitor the GitHub Actions tab for results"
log_message "   4. Check PR comments for automation updates"

echo -e "${GREEN}✅ Automation test completed successfully!${NC}" 