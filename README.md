## Obsidian Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md).

This project uses Typescript to provide type checking and documentation.
The repo contains the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time!

### Compatibility

Custom plugins are only available for Obsidian v0.9.7+.

The current API of this repo targets Obsidian **v0.9.7**. 

### How to use

- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.

### How to install the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `vault/.obsidian/plugins/plugin-id/`.

### Plugin structure

`manifest.json`
 
 - `id` the ID of your plugin.
 - `name` the display name of your plugin.
 - `description` the long description of your plugin.
 - `isDesktopOnly` whether your plugin uses NodeJS or Electron APIs.
 - `js` (optional) an alternative js entry point. Defaults to `main.js`
 - `css` (optional) a css file that should be injected. Defaults to `styles.css`
 
 `main.js`
 
 - This is the main entry point of your plugin.
 - Import any Obsidian API using `require('obsidian')`
 - Import NodeJS or Electron API using `require('fs')` or `require('electron')`
 - Must export a default class which extends `CustomPlugin`
 