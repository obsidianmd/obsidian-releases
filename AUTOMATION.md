# Timeline Plugin Automation

This directory contains automated scripts to monitor and maintain the Manuscript Timeline plugin in the Obsidian community plugins list.

## Overview

The automation system ensures that the Manuscript Timeline plugin (`manuscript-timeline`) stays correctly positioned at the end of the `community-plugins.json` file, even when upstream changes from the Obsidian repository create merge conflicts.

## Files

### Core Scripts
- `fix-timeline-merge-conflicts.js` - Main conflict resolution logic
- `fix-timeline-conflicts.sh` - Shell wrapper for the conflict resolver
- `monitor-upstream-conflicts.js` - Upstream monitoring and sync logic
- `monitor-upstream.sh` - Shell wrapper for upstream monitoring

### Automation
- `.github/workflows/timeline-automation.yml` - GitHub Actions workflow for scheduled automation
- `test-automation.sh` - Test script to verify automation setup

### Documentation
- `AUTOMATION.md` - This file

## How It Works

### 1. Scheduled Automation
The GitHub Actions workflow runs automatically at:
- **9:00 AM PT** (4:00 PM UTC)
- **11:00 AM PT** (6:00 PM UTC)  
- **2:00 PM PT** (9:00 PM UTC)
- **4:00 PM PT** (11:00 PM UTC)

### 2. Conflict Resolution Process
When the automation runs:

1. **Fetch Upstream**: Gets latest changes from the Obsidian repository
2. **Detect Changes**: Checks if `community-plugins.json` has been modified
3. **Merge Changes**: Attempts to merge upstream changes
4. **Resolve Conflicts**: If conflicts occur, automatically resolves them
5. **Position Plugin**: Ensures the timeline plugin stays at the end
6. **Post Comment**: Adds a comment to the PR about what was done
7. **Push Changes**: Commits and pushes the resolved changes

### 3. Conflict Resolution Strategy
The automation uses a smart conflict resolution strategy:

- **Prefer Incoming**: Takes upstream changes as the base
- **Remove Duplicates**: Eliminates any duplicate timeline plugin entries
- **Position at End**: Always places the timeline plugin at the end of the list
- **Validate JSON**: Ensures the final JSON is valid and well-formed

## Manual Usage

### Test the Automation
```bash
./test-automation.sh
```

### Run Conflict Resolution Only
```bash
node fix-timeline-merge-conflicts.js
```

### Run Full Monitoring (Manual)
```bash
./monitor-upstream.sh --force-sync
```

### Check for Changes Only
```bash
./monitor-upstream.sh --check-only
```

## GitHub Integration

### PR Comments
When the automation successfully resolves conflicts or merges changes, it posts a comment to the PR with:
- Timestamp of the operation
- Number of additions/deletions from upstream
- Timeline plugin position verification
- Summary of what was done

### Authentication
The automation uses GitHub CLI with the `GITHUB_TOKEN` secret for:
- Fetching upstream changes
- Posting PR comments
- Pushing resolved changes

## Troubleshooting

### Common Issues

1. **GitHub CLI Not Found**
   - The workflow installs GitHub CLI automatically
   - Manual runs may need: `brew install gh` (macOS) or `sudo apt install gh` (Ubuntu)

2. **Merge Conflicts Not Resolved**
   - Check the logs in the `logs/` directory
   - Run `./test-automation.sh` to verify setup
   - Manual intervention may be needed for complex conflicts

3. **PR Comments Not Posted**
   - Verify GitHub CLI authentication
   - Check that the PR number can be determined automatically
   - Comments are logged even if posting fails

### Logs
- Automation logs: `logs/upstream-monitor-YYYYMMDD.log`
- Test logs: `logs/test-automation-YYYYMMDD-HHMMSS.log`

## Configuration

### Timeline Plugin Entry
The plugin entry is defined in the scripts:
```javascript
const TIMELINE_PLUGIN_ENTRY = {
  "id": "manuscript-timeline",
  "name": "Manuscript Timeline", 
  "author": "Eric Rhys Taylor",
  "description": "A manuscript timeline for creative fiction writing projects...",
  "repo": "EricRhysTaylor/Obsidian-Manuscript-Timeline"
};
```

### Schedule Times
The automation schedule can be modified in `.github/workflows/timeline-automation.yml`:
```yaml
schedule:
  - cron: "0 16 * * *"  # 9am PT
  - cron: "0 18 * * *"  # 11am PT
  - cron: "0 21 * * *"  # 2pm PT
  - cron: "0 23 * * *"  # 4pm PT
```

## Monitoring

### GitHub Actions
- Check the "Actions" tab in the repository
- Look for "Timeline Plugin Automation" workflow runs
- Each run shows detailed logs and summary

### Manual Monitoring
```bash
# Check recent logs
ls -la logs/upstream-monitor-*.log | tail -5

# View latest log
tail -f logs/upstream-monitor-$(date +%Y%m%d).log
```

## Security

- Uses GitHub's built-in `GITHUB_TOKEN` for authentication
- No external API keys or secrets required
- All operations are logged for audit purposes
- Scripts are idempotent and safe to run multiple times

## Contributing

When modifying the automation:

1. Test changes locally with `./test-automation.sh`
2. Update this documentation
3. Test the workflow manually via GitHub Actions
4. Monitor the first few automated runs

## Support

For issues with the automation:
1. Check the logs in the `logs/` directory
2. Run the test script to verify setup
3. Check GitHub Actions for detailed error messages
4. Manual intervention may be required for complex scenarios 