#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PLUGINS_FILE = 'community-plugins.json';
const TIMELINE_PLUGIN_ID = 'manuscript-timeline';
const UPSTREAM_REMOTE = 'upstream'; // or 'origin' if that's your upstream
const UPSTREAM_BRANCH = 'master'; // or 'main'
const TIMELINE_PLUGIN_ENTRY = {
  "id": "manuscript-timeline",
  "name": "Manuscript Timeline",
  "author": "Eric Rhys Taylor",
  "description": "A manuscript timeline for creative fiction writing projects that displays scenes organized by act, subplot, and chronological order in a radial format for a comprehensive view of project.",
  "repo": "EricRhysTaylor/Obsidian-Manuscript-Timeline"
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '📋';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

function checkGitStatus() {
  log('🔍 Checking Git repository status...');
  
  // Check if we're in a git repo
  const gitStatus = execCommand('git status --porcelain', { silent: true });
  if (!gitStatus.success) {
    log('Not in a Git repository!', 'error');
    return false;
  }
  
  // Check for uncommitted changes
  if (gitStatus.output.trim()) {
    log('⚠️  You have uncommitted changes. Stashing them temporarily...', 'warning');
    const stash = execCommand('git stash push -m "Auto-stash before upstream sync"');
    if (!stash.success) {
      log('Failed to stash changes. Please commit or stash manually.', 'error');
      return false;
    }
    return 'stashed';
  }
  
  return true;
}

function setupUpstream() {
  log('🔗 Checking upstream remote configuration...');
  
  // Check if upstream remote exists
  const remotes = execCommand('git remote -v', { silent: true });
  if (!remotes.success) {
    log('Failed to check Git remotes', 'error');
    return false;
  }
  
  if (!remotes.output.includes(UPSTREAM_REMOTE)) {
    log(`⚠️  Upstream remote '${UPSTREAM_REMOTE}' not found. Setting it up...`, 'warning');
    log('💡 Please enter the upstream repository URL (e.g., https://github.com/obsidianmd/obsidian-releases.git):');
    
    // For automation, we'll assume the standard Obsidian repository
    const upstreamUrl = 'https://github.com/obsidianmd/obsidian-releases.git';
    log(`🔗 Adding upstream: ${upstreamUrl}`);
    
    const addUpstream = execCommand(`git remote add ${UPSTREAM_REMOTE} ${upstreamUrl}`);
    if (!addUpstream.success) {
      log(`Failed to add upstream remote: ${addUpstream.error}`, 'error');
      return false;
    }
    log('✅ Upstream remote added successfully');
  }
  
  return true;
}

function fetchUpstream() {
  log(`📥 Fetching latest changes from ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}...`);
  
  const fetch = execCommand(`git fetch ${UPSTREAM_REMOTE} ${UPSTREAM_BRANCH}`);
  if (!fetch.success) {
    log(`Failed to fetch from upstream: ${fetch.error}`, 'error');
    return false;
  }
  
  log('✅ Successfully fetched upstream changes');
  return true;
}

function checkForUpstreamChanges() {
  log('🔍 Checking for upstream changes in community-plugins.json...');
  
  // Check if there are differences between our version and upstream
  const diff = execCommand(`git diff HEAD ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH} -- ${PLUGINS_FILE}`, { silent: true });
  
  if (!diff.success) {
    log(`Failed to check differences: ${diff.error}`, 'error');
    return null;
  }
  
  if (!diff.output.trim()) {
    log('✅ No changes detected in community-plugins.json');
    return false;
  }
  
  log('📋 Changes detected in community-plugins.json');
  
  // Count the number of changes
  const lines = diff.output.split('\n');
  const additions = lines.filter(line => line.startsWith('+')).length;
  const deletions = lines.filter(line => line.startsWith('-')).length;
  
  log(`📊 Changes: +${additions} additions, -${deletions} deletions`);
  
  return {
    hasChanges: true,
    additions,
    deletions,
    diff: diff.output
  };
}

function mergeUpstream() {
  log(`🔄 Merging changes from ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}...`);
  
  const currentBranch = execCommand('git branch --show-current', { silent: true });
  if (!currentBranch.success) {
    log('Failed to get current branch', 'error');
    return false;
  }
  
  log(`📍 Current branch: ${currentBranch.output.trim()}`);
  
  // Attempt to merge upstream changes
  const merge = execCommand(`git merge ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}`, { silent: true });
  
  if (merge.success) {
    log('✅ Merged upstream changes successfully', 'success');
    return true;
  }
  
  // Check if it's a merge conflict
  if (merge.error.includes('CONFLICT') || merge.error.includes('conflict')) {
    log('⚠️  Merge conflicts detected. Resolving automatically...', 'warning');
    const resolved = resolveConflicts();
    // Mark that we had conflicts for PR comment
    global.hadMergeConflicts = true;
    return resolved;
  }
  
  log(`Failed to merge: ${merge.error}`, 'error');
  return false;
}

function resolveConflicts() {
  log('🔧 Resolving merge conflicts in community-plugins.json...');
  
  // Run our existing conflict resolution script
  const resolver = path.join(__dirname, 'fix-timeline-merge-conflicts.js');
  const resolve = execCommand(`node "${resolver}"`);
  
  if (!resolve.success) {
    log(`Conflict resolution failed: ${resolve.error}`, 'error');
    return false;
  }
  
  // Stage the resolved file
  const stage = execCommand(`git add ${PLUGINS_FILE}`);
  if (!stage.success) {
    log(`Failed to stage resolved file: ${stage.error}`, 'error');
    return false;
  }
  
  // Complete the merge
  const commit = execCommand('git commit --no-edit');
  if (!commit.success) {
    log(`Failed to commit merge: ${commit.error}`, 'error');
    return false;
  }
  
  log('✅ Conflicts resolved and merge completed', 'success');
  return true;
}

function validatePluginPosition() {
  log('🔍 Validating timeline plugin position...');
  
  if (!fs.existsSync(PLUGINS_FILE)) {
    log(`File not found: ${PLUGINS_FILE}`, 'error');
    return false;
  }
  
  try {
    const content = fs.readFileSync(PLUGINS_FILE, 'utf8');
    const plugins = JSON.parse(content);
    
    const timelineIndex = plugins.findIndex(p => p.id === TIMELINE_PLUGIN_ID);
    
    if (timelineIndex === -1) {
      log('⚠️  Timeline plugin not found. Adding to end...', 'warning');
      plugins.push(TIMELINE_PLUGIN_ENTRY);
      
      const newContent = JSON.stringify(plugins, null, 2);
      fs.writeFileSync(PLUGINS_FILE, newContent);
      
      // Stage and commit the change
      execCommand(`git add ${PLUGINS_FILE}`);
      execCommand('git commit -m "Add timeline plugin to end of list"');
      
      log('✅ Timeline plugin added and committed', 'success');
      return true;
    }
    
    if (timelineIndex === plugins.length - 1) {
      log('✅ Timeline plugin is correctly positioned at the end', 'success');
      return true;
    }
    
    log(`🔄 Moving timeline plugin from position ${timelineIndex + 1} to end...`);
    const timelinePlugin = plugins.splice(timelineIndex, 1)[0];
    plugins.push(timelinePlugin);
    
    const newContent = JSON.stringify(plugins, null, 2);
    fs.writeFileSync(PLUGINS_FILE, newContent);
    
    // Stage and commit the change
    execCommand(`git add ${PLUGINS_FILE}`);
    execCommand('git commit -m "Move timeline plugin to end of list"');
    
    log('✅ Timeline plugin repositioned and committed', 'success');
    return true;
    
  } catch (error) {
    log(`JSON validation failed: ${error.message}`, 'error');
    return false;
  }
}

function restoreStash() {
  log('🔄 Restoring stashed changes...');
  const restore = execCommand('git stash pop');
  if (!restore.success) {
    log('⚠️  Failed to restore stash. You may need to manually apply: git stash pop', 'warning');
    return false;
  }
  log('✅ Stashed changes restored');
  return true;
}

function postPRComment(conflictsResolved, changesInfo) {
  log('💬 Posting PR comment about automation update...');
  
  try {
    const timestamp = new Date().toLocaleString();
    let comment = '';
    
    if (conflictsResolved) {
      comment = `## 🤖 Automated Conflict Resolution

**Timestamp:** ${timestamp}

✅ **Upstream conflicts automatically resolved!**

**Changes merged from upstream:**
- **+${changesInfo.additions}** additions
- **-${changesInfo.deletions}** deletions

**Timeline plugin status:**
- 📍 **Position:** ${changesInfo.pluginPosition} of ${changesInfo.totalPlugins} (correctly at end)
- ✅ **Status:** Conflicts resolved, plugin positioned correctly

**What happened:**
1. 🔄 Fetched latest changes from upstream Obsidian repository
2. 🔧 Automatically merged upstream changes with conflict resolution
3. 📍 Ensured "Manuscript Timeline" plugin remains at the end of the list
4. ✅ Committed and ready for review

*This was handled automatically by the timeline plugin monitoring system.*`;
    } else {
      comment = `## 🤖 Automated Upstream Sync

**Timestamp:** ${timestamp}

✅ **Upstream changes automatically merged!**

**Changes merged from upstream:**
- **+${changesInfo.additions}** additions  
- **-${changesInfo.deletions}** deletions

**Timeline plugin status:**
- 📍 **Position:** ${changesInfo.pluginPosition} of ${changesInfo.totalPlugins} (correctly at end)
- ✅ **Status:** No conflicts, clean merge

**What happened:**
1. 🔄 Fetched latest changes from upstream Obsidian repository
2. ✅ Clean merge with no conflicts detected
3. 📍 Verified "Manuscript Timeline" plugin remains correctly positioned
4. ✅ Committed and ready for review

*This was handled automatically by the timeline plugin monitoring system.*`;
    }
    
    // Try to find the current PR number dynamically
    let prNumber = null;
    
    // Check if we're in a GitHub Actions environment
    if (process.env.GITHUB_EVENT_PATH) {
      try {
        const eventData = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
        if (eventData.pull_request) {
          prNumber = eventData.pull_request.number;
        }
      } catch (error) {
        log(`Failed to read GitHub event data: ${error.message}`, 'warning');
      }
    }
    
    // If we couldn't get PR number from event, try to find it from git
    if (!prNumber) {
      const branchName = execCommand('git branch --show-current', { silent: true });
      if (branchName.success) {
        const branch = branchName.output.trim();
        // Try to find PR associated with this branch
        const prList = execCommand('gh pr list --head ' + branch, { silent: true });
        if (prList.success && prList.output.trim()) {
          const match = prList.output.match(/^(\d+)/);
          if (match) {
            prNumber = match[1];
          }
        }
      }
    }
    
    if (prNumber) {
      // Post comment using GitHub CLI
      const ghCommand = `gh pr comment ${prNumber} --repo obsidianmd/obsidian-releases --body "${comment.replace(/"/g, '\\"')}"`;
      const result = execCommand(ghCommand);
      
      if (result.success) {
        log(`✅ PR comment posted successfully to PR #${prNumber}`, 'success');
      } else {
        log(`⚠️  Failed to post PR comment: ${result.error}`, 'warning');
      }
    } else {
      log('⚠️  Could not determine PR number, skipping comment post', 'warning');
      log('💡 Comment content:', 'info');
      console.log(comment);
    }
    
  } catch (error) {
    log(`Failed to post PR comment: ${error.message}`, 'warning');
  }
}

function generateSummaryReport() {
  log('\n📋 SUMMARY REPORT');
  log('================');
  
  try {
    const content = fs.readFileSync(PLUGINS_FILE, 'utf8');
    const plugins = JSON.parse(content);
    const timelineIndex = plugins.findIndex(p => p.id === TIMELINE_PLUGIN_ID);
    
    log(`📊 Total plugins: ${plugins.length}`);
    if (timelineIndex !== -1) {
      log(`📍 Timeline plugin position: ${timelineIndex + 1} of ${plugins.length}`);
      log(`✅ Correctly positioned: ${timelineIndex === plugins.length - 1 ? 'YES' : 'NO'}`);
    } else {
      log('❌ Timeline plugin not found in list');
    }
    
    // Check if we're ahead of upstream
    const ahead = execCommand(`git rev-list --count HEAD ^${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}`, { silent: true });
    if (ahead.success && ahead.output.trim() !== '0') {
      log(`📤 Local commits ahead of upstream: ${ahead.output.trim()}`);
      log('💡 Consider pushing your changes');
    }
    
    return {
      totalPlugins: plugins.length,
      pluginPosition: timelineIndex !== -1 ? timelineIndex + 1 : 0,
      correctlyPositioned: timelineIndex === plugins.length - 1
    };
    
  } catch (error) {
    log(`Failed to generate summary: ${error.message}`, 'error');
    return null;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Upstream Conflict Monitor for Timeline Plugin

Usage: node monitor-upstream-conflicts.js [options]

Options:
  --check-only     Only check for changes, don't merge
  --force-sync     Force sync even if no changes detected
  --help, -h       Show this help message

Description:
  Monitors the upstream Obsidian repository for changes that could affect
  your timeline plugin. Automatically syncs and resolves conflicts.

This script:
  1. Fetches latest changes from upstream
  2. Detects changes in community-plugins.json  
  3. Merges changes and resolves conflicts automatically
  4. Ensures your timeline plugin stays at the end
  5. Provides a summary report

Recommended: Run this daily via cron job or manually when needed.
`);
    return;
  }
  
  log('🚀 Starting upstream conflict monitoring...');
  log(`📅 Timestamp: ${new Date().toLocaleString()}`);
  
  // Step 1: Check Git status and handle uncommitted changes
  const gitStatus = checkGitStatus();
  if (gitStatus === false) {
    process.exit(1);
  }
  
  let hadStash = gitStatus === 'stashed';
  
  try {
    // Step 2: Setup upstream remote if needed
    if (!setupUpstream()) {
      process.exit(1);
    }
    
    // Step 3: Fetch latest from upstream
    if (!fetchUpstream()) {
      process.exit(1);
    }
    
    // Step 4: Check for changes
    const changes = checkForUpstreamChanges();
    if (changes === null) {
      process.exit(1);
    }
    
    if (!changes && !args.includes('--force-sync')) {
      log('✅ No upstream changes detected. Timeline plugin is safe!', 'success');
      generateSummaryReport();
      return;
    }
    
    if (args.includes('--check-only')) {
      if (changes) {
        log('⚠️  Changes detected but --check-only flag used. No merge performed.', 'warning');
      }
      return;
    }
    
    // Step 5: Merge upstream changes
    global.hadMergeConflicts = false; // Reset conflict flag
    if (!mergeUpstream()) {
      log('❌ Failed to merge upstream changes', 'error');
      process.exit(1);
    }
    
    const hadConflicts = global.hadMergeConflicts; // Check if conflicts were resolved
    
    // Step 6: Validate and fix plugin position
    if (!validatePluginPosition()) {
      log('❌ Failed to validate plugin position', 'error');
      process.exit(1);
    }
    
    // Step 7: Generate summary and post PR comment
    const summaryInfo = generateSummaryReport();
    
    if (summaryInfo) {
      const changesInfo = {
        additions: changes.additions,
        deletions: changes.deletions,
        pluginPosition: summaryInfo.pluginPosition,
        totalPlugins: summaryInfo.totalPlugins
      };
      
      // Post comment to PR about the automated resolution
      postPRComment(hadConflicts, changesInfo);
    }
    
    log('🎉 Upstream sync completed successfully!', 'success');
    
  } finally {
    // Restore stashed changes if we had any
    if (hadStash) {
      restoreStash();
    }
  }
}

main().catch(error => {
  log(`Unexpected error: ${error.message}`, 'error');
  process.exit(1);
}); 