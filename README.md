## About this repo

This repo is used for hosting public releases of Obsidian, as well as our community plugins & themes directories.

Obsidian is not open source software and this repo _DOES NOT_ contain the source code of Obsidian. However, if you wish to contribute to Obsidian, you can easily do so with our extensive plugin system. A plugin guide can be found here: https://marcus.se.net/obsidian-plugin-docs/

This repo does not accept issues, if you have questions or issues with plugins, please go to their own repo to file them. If you have questions or issues about core Obsidian itself, please post them to our community: https://obsidian.md/community

## Submit your plugin or theme

When opening a pull request, please switch to preview mode and select the option to go through our submission checklist. Submit your entry by following the convention in the JSON file and we will review your submission.

Thanks for submitting your creations!

You can find a detailed explanation for submitting your [plugin here](https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/How+to+add+your+plugin+to+the+community+plugin+list) and your [theme here](https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/How+to+add+your+theme+to+the+community+theme+store).

### Community Plugins format

To add your plugin to the list, make a pull request to the `community-plugins.json` file.
The order of this list is not kept, please add your plugin to the end of the list.

- `id`: A unique ID for your plugin. Make sure this is the same one you have in your `manifest.json`.
- `name`: The name of your plugin.
- `author`: The author's name.
- `description`: A short description of what your plugin does.
- `repo`: The GitHub repository identifier, in the form of `user-name/repo-name`, if your GitHub repo is located at `https://github.com/user-name/repo-name`.
- `branch`: (optional) A branch if you prefer to use a specific branch of your repo. Defaults to `master`.

### How community plugins are pulled

- Obsidian will read the list of plugins in `community-plugins.json`.
- The `name`, `author` and `description` fields are used for searching.
- When the user opens the detail page of your plugin, Obsidian will pull the `manifest.json` and `README.md` from your GitHub repo using the specified branch (or `master`).
- The `manifest.json` in your repo will only be used to figure out the latest version. Actual files are fetched from your GitHub releases.
- If your `manifest.json` requires a version of Obsidian that's higher than the running app, your `versions.json` will be consulted to find the latest version of your plugin that is compatible.
- When the user chooses to install your plugin, Obsidian will look for your GitHub releases tagged identically to the version inside `manifest.json`.
- Obsidian will download `manifest.json`, `main.js`, and `styles.css` (if available), and store them in the proper location inside the vault.
