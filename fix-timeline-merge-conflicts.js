#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const PLUGINS_FILE = 'community-plugins.json';
const TIMELINE_PLUGIN_ID = 'manuscript-timeline';
const TIMELINE_PLUGIN_ENTRY = {
  "id": "manuscript-timeline",
  "name": "Manuscript Timeline",
  "author": "Eric Rhys Taylor",
  "description": "A manuscript timeline for creative fiction writing projects that displays scenes organized by act, subplot, and chronological order in a radial format for a comprehensive view of project.",
  "repo": "EricRhysTaylor/Obsidian-Manuscript-Timeline"
};

function log(message) {
  console.log(`[MERGE-FIX] ${message}`);
}

function fixMergeConflicts() {
  const filePath = path.join(process.cwd(), PLUGINS_FILE);
  
  if (!fs.existsSync(filePath)) {
    log(`❌ File not found: ${PLUGINS_FILE}`);
    process.exit(1);
  }

  log(`📂 Reading ${PLUGINS_FILE}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if there are merge conflict markers
  const hasConflicts = content.includes('<<<<<<<') || content.includes('=======') || content.includes('>>>>>>>');
  
  if (!hasConflicts) {
    log('✅ No merge conflicts detected. Checking plugin position...');
    
    try {
      const plugins = JSON.parse(content);
      const timelineIndex = plugins.findIndex(p => p.id === TIMELINE_PLUGIN_ID);
      
      if (timelineIndex === -1) {
        log('⚠️  Timeline plugin not found. Adding to end...');
        plugins.push(TIMELINE_PLUGIN_ENTRY);
        const newContent = JSON.stringify(plugins, null, 2);
        fs.writeFileSync(filePath, newContent);
        log('✅ Timeline plugin added to end of list');
      } else if (timelineIndex === plugins.length - 1) {
        log('✅ Timeline plugin is already at the end. No changes needed.');
      } else {
        log('🔄 Moving timeline plugin to end...');
        const timelinePlugin = plugins.splice(timelineIndex, 1)[0];
        plugins.push(timelinePlugin);
        const newContent = JSON.stringify(plugins, null, 2);
        fs.writeFileSync(filePath, newContent);
        log('✅ Timeline plugin moved to end of list');
      }
      return;
    } catch (error) {
      log(`❌ JSON parsing error: ${error.message}`);
      process.exit(1);
    }
  }

  log('🔧 Merge conflicts detected. Resolving...');
  
  // Remove Git conflict markers and extract content sections
  const lines = content.split('\n');
  const cleanLines = [];
  let inConflict = false;
  let currentSection = 'current';
  let conflictSections = {
    current: [],
    incoming: []
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('<<<<<<<')) {
      inConflict = true;
      currentSection = 'current';
      continue;
    } else if (line.startsWith('=======')) {
      currentSection = 'incoming';
      continue;
    } else if (line.startsWith('>>>>>>>')) {
      inConflict = false;
      
      // Process the conflict: prefer incoming changes but ensure timeline plugin is at end
      const allConflictLines = [...conflictSections.current, ...conflictSections.incoming];
      cleanLines.push(...allConflictLines);
      
      // Reset for next conflict
      conflictSections = { current: [], incoming: [] };
      continue;
    }
    
    if (inConflict) {
      conflictSections[currentSection].push(line);
    } else {
      cleanLines.push(line);
    }
  }
  
  // Reconstruct the content
  content = cleanLines.join('\n');
  
  try {
    // Parse JSON to validate and reorganize
    let plugins = JSON.parse(content);
    
    // Remove any existing timeline plugin entries
    plugins = plugins.filter(p => p.id !== TIMELINE_PLUGIN_ID);
    
    // Add timeline plugin at the end
    plugins.push(TIMELINE_PLUGIN_ENTRY);
    
    // Write back formatted JSON
    const newContent = JSON.stringify(plugins, null, 2);
    fs.writeFileSync(filePath, newContent);
    
    log('✅ Merge conflicts resolved successfully!');
    log(`📝 Timeline plugin positioned at end of list (position ${plugins.length})`);
    
  } catch (error) {
    log(`❌ Error processing JSON after conflict resolution: ${error.message}`);
    log('🔄 Attempting robust conflict cleanup...');
    
    // More aggressive cleanup for complex conflicts
    content = content
      // Remove all Git conflict markers
      .replace(/<<<<<<< HEAD[\s\S]*?=======[\s\S]*?>>>>>>> upstream\/master/g, '')
      .replace(/<<<<<<< HEAD[\s\S]*?>>>>>>> upstream\/master/g, '')
      // Clean up JSON syntax
      .replace(/,\s*,/g, ',')  // Remove double commas
      .replace(/,\s*]/g, ']')   // Remove trailing commas before closing bracket
      .replace(/}\s*{/g, '},{') // Ensure proper object separation
      .replace(/}\s*]\s*{/g, '},{') // Fix broken array structure
      .replace(/]\s*{/g, '},{') // Fix broken array structure
      .trim();
    
    try {
      let plugins = JSON.parse(content);
      plugins = plugins.filter(p => p.id !== TIMELINE_PLUGIN_ID);
      plugins.push(TIMELINE_PLUGIN_ENTRY);
      
      const newContent = JSON.stringify(plugins, null, 2);
      fs.writeFileSync(filePath, newContent);
      log('✅ Robust cleanup successful!');
      
    } catch (fallbackError) {
      log(`❌ Robust cleanup failed: ${fallbackError.message}`);
      log('🛠️  Attempting emergency manual fix...');
      
      // Emergency fix: rebuild the file from scratch with known good structure
      try {
        const backupContent = fs.readFileSync(filePath + '.backup', 'utf8');
        const backupPlugins = JSON.parse(backupContent);
        backupPlugins.push(TIMELINE_PLUGIN_ENTRY);
        const newContent = JSON.stringify(backupPlugins, null, 2);
        fs.writeFileSync(filePath, newContent);
        log('✅ Emergency fix successful!');
      } catch (emergencyError) {
        log(`❌ Emergency fix failed: ${emergencyError.message}`);
        log('💡 Please manually review the JSON file for syntax errors.');
        process.exit(1);
      }
    }
  }
}

function validateJson() {
  const filePath = path.join(process.cwd(), PLUGINS_FILE);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const plugins = JSON.parse(content);
    
    log(`✅ JSON validation passed. Found ${plugins.length} plugins.`);
    
    const timelineIndex = plugins.findIndex(p => p.id === TIMELINE_PLUGIN_ID);
    if (timelineIndex !== -1) {
      log(`📍 Timeline plugin found at position ${timelineIndex + 1} of ${plugins.length}`);
      if (timelineIndex === plugins.length - 1) {
        log('✅ Timeline plugin is correctly positioned at the end');
      } else {
        log('⚠️  Timeline plugin is not at the end');
      }
    } else {
      log('❌ Timeline plugin not found in the list');
    }
    
  } catch (error) {
    log(`❌ JSON validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Timeline Plugin Merge Conflict Resolver

Usage: node fix-timeline-merge-conflicts.js [options]

Options:
  --validate, -v    Validate JSON and check plugin position
  --help, -h        Show this help message

Description:
  This script automatically resolves merge conflicts in the community-plugins.json
  file by ensuring the Manuscript Timeline plugin is positioned at the end of the
  list and removing Git conflict markers.

Examples:
  node fix-timeline-merge-conflicts.js          # Fix conflicts and position plugin
  node fix-timeline-merge-conflicts.js -v       # Just validate current state
`);
    return;
  }
  
  if (args.includes('--validate') || args.includes('-v')) {
    validateJson();
    return;
  }
  
  log('🚀 Starting timeline plugin merge conflict resolution...');
  fixMergeConflicts();
  log('🎉 Process completed!');
  
  // Also validate after fixing
  log('\n📋 Validating result...');
  validateJson();
}

main(); 