# OpenTerm

Obsidian plugin that adds context menu options to open files and folders in a terminal.

## Context Menu Options

- **Open in default terminal** - Opens the directory in the configured terminal (available on all platforms).
- **Open in PowerShell** - Opens the directory in PowerShell (available on all platforms with `pwsh` installed; falls back to `powershell` on Windows).
- **Open in CMD** - Opens the directory in Command Prompt (Windows only).

Each option can be toggled on or off from the plugin settings.

## Settings

The plugin provides a settings tab where you can configure:

- Which context menu items to show
- The PowerShell executable (default: `pwsh` for PowerShell 7+)
- The CMD executable (default: `cmd.exe`)
- The default terminal executable / app per OS

## Installation

Copy `main.js`, `manifest.json`, and `versions.json` into your vault's `.obsidian/plugins/openterm/` directory.

## Development

```bash
npm install
npm run build
```

