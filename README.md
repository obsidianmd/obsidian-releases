# OpenCMD-PS

Obsidian plugin that adds context menu options to open files and folders in a terminal.

## Context Menu Options

- **Open in default app** - Opens the directory in the system default terminal (available on all platforms).
- **Open in PowerShell** - Opens the directory in PowerShell (Windows only).
- **Open in CMD** - Opens the directory in Command Prompt (Windows only).

On Linux and macOS, only "Open in default app" is shown.

## Development

```bash
npm install
npm run build
```

Copy `main.js` and `manifest.json` into your vault's `.obsidian/plugins/opencmd-ps/` directory.
