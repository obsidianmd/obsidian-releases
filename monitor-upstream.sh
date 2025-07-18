#!/bin/bash

# Upstream Conflict Monitor - Shell Wrapper
# Monitors the upstream Obsidian repository for changes affecting the timeline plugin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/monitor-upstream-conflicts.js"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/upstream-monitor-$(date +%Y%m%d).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Function to send desktop notification (macOS)
send_notification() {
    local title="$1"
    local message="$2"
    local sound="$3"
    
    if command -v osascript &> /dev/null; then
        osascript -e "display notification \"$message\" with title \"$title\" sound name \"$sound\""
    fi
}

# Function to check if running in cron
is_cron() {
    [[ -z "$TERM" || "$TERM" == "dumb" ]]
}

# Function to show progress if not in cron
show_progress() {
    if ! is_cron; then
        echo -e "${BLUE}$1${NC}"
    fi
    log_message "$1"
}

# Main execution
main() {
    local start_time=$(date)
    
    show_progress "🚀 Starting upstream monitoring session"
    show_progress "📅 Start time: $start_time"
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        local error_msg="❌ Node.js is required but not installed"
        log_message "$error_msg"
        if ! is_cron; then
            echo -e "${RED}$error_msg${NC}"
        fi
        send_notification "Timeline Monitor Error" "$error_msg" "Basso"
        exit 1
    fi
    
    # Check if the Node.js script exists
    if [ ! -f "$NODE_SCRIPT" ]; then
        local error_msg="❌ Monitor script not found: $NODE_SCRIPT"
        log_message "$error_msg"
        if ! is_cron; then
            echo -e "${RED}$error_msg${NC}"
        fi
        send_notification "Timeline Monitor Error" "$error_msg" "Basso"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "community-plugins.json" ]; then
        local warning_msg="⚠️  Warning: community-plugins.json not found in $(pwd)"
        log_message "$warning_msg"
        if ! is_cron; then
            echo -e "${YELLOW}$warning_msg${NC}"
        fi
    fi
    
    # Make sure the script is executable
    chmod +x "$NODE_SCRIPT" 2>/dev/null || true
    
    # Run the monitoring script
    show_progress "🔍 Running upstream conflict monitor..."
    
    local temp_log=$(mktemp)
    local exit_code=0
    
    # Capture both stdout and stderr, and track exit code
    if node "$NODE_SCRIPT" "$@" 2>&1 | tee "$temp_log"; then
        exit_code=0
    else
        exit_code=$?
    fi
    
    # Append the output to our log
    cat "$temp_log" >> "$LOG_FILE"
    rm "$temp_log"
    
    local end_time=$(date)
    show_progress "📅 End time: $end_time"
    
    # Send notifications based on results
    if [ $exit_code -eq 0 ]; then
        # Check if there were any actual changes processed
        if grep -q "Upstream sync completed successfully" "$LOG_FILE"; then
            local success_msg="✅ Timeline plugin conflicts resolved successfully"
            log_message "$success_msg"
            send_notification "Timeline Monitor" "Upstream conflicts resolved successfully!" "Glass"
            if ! is_cron; then
                echo -e "${GREEN}$success_msg${NC}"
            fi
        elif grep -q "No upstream changes detected" "$LOG_FILE"; then
            local no_changes_msg="✅ No upstream changes detected - timeline plugin is safe"
            log_message "$no_changes_msg"
            # Only notify about no changes if specifically requested
            if [[ "$*" == *"--notify-all"* ]]; then
                send_notification "Timeline Monitor" "No upstream changes detected" "Purr"
            fi
            if ! is_cron; then
                echo -e "${GREEN}$no_changes_msg${NC}"
            fi
        fi
    else
        local error_msg="❌ Upstream monitoring failed (exit code: $exit_code)"
        log_message "$error_msg"
        send_notification "Timeline Monitor Error" "Monitoring failed - check logs" "Basso"
        if ! is_cron; then
            echo -e "${RED}$error_msg${NC}"
            echo -e "${YELLOW}💡 Check the log file: $LOG_FILE${NC}"
        fi
    fi
    
    # Clean up old log files (keep last 30 days)
    find "$LOG_DIR" -name "upstream-monitor-*.log" -mtime +30 -delete 2>/dev/null || true
    
    return $exit_code
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo -e "${BLUE}Upstream Conflict Monitor${NC}"
    echo "========================="
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --check-only     Only check for changes, don't merge"
    echo "  --force-sync     Force sync even if no changes detected"
    echo "  --notify-all     Send notifications for all results (including no changes)"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "Description:"
    echo "  Monitors the upstream Obsidian repository for changes that could"
    echo "  affect your timeline plugin. Automatically syncs and resolves conflicts."
    echo ""
    echo "Logging:"
    echo "  Logs are saved to: $LOG_DIR"
    echo "  Current log: $LOG_FILE"
    echo ""
    echo "Setup automation:"
    echo "  Run: ./setup-cron-monitoring.sh"
    echo ""
    exit 0
fi

# Execute main function
main "$@" 