## This repo is used to keep track of releases for Obsidian.

Until Silver piggybacked the community themes onto it.

## Community Plugins

To add your plugin to the list, make a pull request to the `community-plugins.json` file.
The order of this list is not kept, please add your plugin to the end of the list.

- `id`: A unique ID for your plugin. Make sure this is the same one you have in your `manifest.json`.
- `name`: The name of your plugin. This will be used to search for your plugin.
- `author`: The author's name.
- `description`: A short description of what your plugin does.
- `repo`: The GitHub repository identifier, in the form of `user-name/repo-name`, if your GitHub repo is located at `https://github.com/user-name/repo-name`.
- `branch`: (optional) A branch if you prefer to use a specific branch of your repo. Defaults to `master`.

### How community plugins are pulled

- Obsidian will read the list of plugins in `community-plugins.json`.
- The `name` field is used for searching.
- When the user opens the detail page of your plugin, Obsidian will pull the `manifest.json` and `README.md` from your GitHub repo using the specified branch (or `master`).
- `manifest.json` will be used to figure out the latest version.
- When the user chooses to install your plugin, Obsidian will look for your GitHub releases tagged identically to the version inside `manifest.json`.
- Obsidian will download `manifest.json`, `main.js` (if available), and `styles.css` (if available), and store them in the proper location inside the vault.
